const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { customAlphabet } = require('nanoid');
const { CHARACTERS } = require('./shared-characters');
const { ITEMS, generateItemQueue, TOTAL_ROUNDS } = require('./items');

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);
const genPlayerId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12);

const STARTING_ROARS = 150;

const ELIMINATION_TAGLINES = [
  'Rest in pieces, mane and all.',
  'The circle of life just got smaller.',
  'Another one bites the dust and grass.',
  'Pride Rock has no room for the weak.',
  'Yeeted clean off the savanna.',
  "That's gonna hurt the family tree.",
  'Their role in this pride: recast.',
  'The grass remembers everything.',
  'Well, that escalated to extinction fast.',
  "Filed under: should've bid more Roars.",
  "Their Wi-Fi just disconnected. Permanently.",
  'Voted off the savanna island.',
  'The hyenas are already writing eulogies.',
  'Gone with the wind and their dignity.',
  "That's a wrap on their pride card.",
  "Vultures circling. It's giving buffet.",
  'Their spot in the group photo? Deleted.',
  'Down bad and down for the count.',
  'The savanna giveth, the savanna taketh.',
  'Forgot sunscreen and survival instincts today.',
];

function pickTagline(room) {
  if (!room.usedTaglines || room.usedTaglines.size >= ELIMINATION_TAGLINES.length) {
    room.usedTaglines = new Set();
  }
  let idx;
  do { idx = Math.floor(Math.random() * ELIMINATION_TAGLINES.length); } while (room.usedTaglines.has(idx));
  room.usedTaglines.add(idx);
  return ELIMINATION_TAGLINES[idx];
}
const BID_TIME_MS = 30000;
const TARGET_SELECT_TIME_MS = 30000;
const MIN_PLAYERS = 2;

const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

const app = express();
// Dev-friendly static serving: without explicit no-store, browsers will
// heuristically cache these files (Last-Modified with no Cache-Control lets
// Chrome skip re-requesting entirely for a while), so edits can silently not
// show up on reload. Force revalidation every time.
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-store'),
}));

const server = http.createServer(app);
const io = new Server(server);

/** @type {Map<string, Room>} */
const rooms = new Map();

function makeRoom() {
  let code;
  do {
    code = nanoid();
  } while (rooms.has(code));

  const room = {
    code,
    hostSocketId: null,
    players: new Map(), // playerId -> player
    phase: 'lobby', // lobby | bidding | bid_reveal | target_select | effect_reveal | leaderboard | ended
    round: 0,
    itemQueue: [],
    currentItem: null,
    bids: new Map(), // playerId -> amount
    passed: new Set(), // playerIds who passed this round
    winnerId: null,
    pendingPoison: null, // { targetId, targetName }
    lastPoisonResult: null,
    lastEffectResult: null,
    bidTimer: null,
    targetTimer: null,
    endResult: null,
    usedTaglines: new Set(),
  };
  rooms.set(code, room);
  return room;
}

function getActivePlayers(room) {
  return [...room.players.values()].filter((p) => p.active);
}

function publicPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    character: p.character,
    roars: p.roars,
    strength: p.strength,
    active: p.active,
    connected: p.connected,
    hasBid: undefined,
  };
}

function takenCharacters(room) {
  return new Set([...room.players.values()].map((p) => p.character).filter(Boolean));
}

function characterOptions(room) {
  const taken = takenCharacters(room);
  return CHARACTERS.map((c) => ({ ...c, taken: taken.has(c.id) }));
}

function roomSummary(room) {
  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    totalRounds: TOTAL_ROUNDS,
    players: [...room.players.values()].map(publicPlayer),
  };
}

function currentItemPublic(room) {
  if (!room.currentItem) return null;
  return { id: room.currentItem.id, name: room.currentItem.name, flavor: room.currentItem.flavor };
}

function bidProgress(room) {
  const active = getActivePlayers(room);
  return {
    submitted: active.filter((p) => room.bids.has(p.id) || room.passed.has(p.id)).map((p) => p.id),
    totalActive: active.length,
  };
}

function leaderboardData(room) {
  const players = [...room.players.values()]
    .slice()
    .sort((a, b) => b.strength - a.strength || (a.active === b.active ? 0 : a.active ? -1 : 1));
  return players.map(publicPlayer);
}

function syncRoom(room) {
  const base = roomSummary(room);

  if (room.hostSocketId) {
    io.to(room.hostSocketId).emit('host:state', {
      ...base,
      currentItem: currentItemPublic(room),
      bidProgress: room.phase === 'bidding' ? bidProgress(room) : null,
      bidReveal: room.phase === 'bid_reveal' || room.phase === 'target_select' || room.phase === 'effect_reveal'
        ? bidRevealPayload(room)
        : null,
      effectResult: room.lastEffectResult,
      poisonResult: room.lastPoisonResult,
      leaderboard: room.phase === 'leaderboard' ? leaderboardData(room) : null,
      endResult: room.endResult,
      characters: characterOptions(room),
    });
  }

  for (const p of room.players.values()) {
    if (!p.socketId) continue;
    io.to(p.socketId).emit('player:state', {
      ...base,
      me: publicPlayer(p),
      currentItem: currentItemPublic(room),
      hasBid: room.bids.has(p.id),
      hasPassed: room.passed.has(p.id),
      bidReveal: room.phase === 'bid_reveal' || room.phase === 'target_select' || room.phase === 'effect_reveal'
        ? bidRevealPayload(room)
        : null,
      effectResult: room.lastEffectResult,
      poisonResult: room.lastPoisonResult,
      leaderboard: room.phase === 'leaderboard' ? leaderboardData(room) : null,
      endResult: room.endResult,
      characters: characterOptions(room),
    });
  }
}

function bidRevealPayload(room) {
  const active = getActivePlayers(room);
  const bids = active.map((p) => ({
    playerId: p.id,
    name: p.name,
    character: p.character,
    amount: room.bids.get(p.id) || 0,
  }));
  return {
    item: currentItemPublic(room),
    bids,
    winnerId: room.winnerId,
  };
}

function eliminate(player) {
  player.active = false;
  player.strength = 0;
  player.roars = 0;
}

function clearTimers(room) {
  if (room.bidTimer) clearTimeout(room.bidTimer);
  if (room.targetTimer) clearTimeout(room.targetTimer);
  room.bidTimer = null;
  room.targetTimer = null;
}

function startRound(room) {
  clearTimers(room);
  room.round += 1;
  room.lastEffectResult = null;
  room.lastPoisonResult = null;
  room.winnerId = null;
  room.bids = new Map();
  room.passed = new Set();

  // Apply pending poison silently at the start of this round.
  if (room.pendingPoison) {
    const target = room.players.get(room.pendingPoison.targetId);
    if (target && target.active) {
      target.strength = Math.max(0, target.strength - 20);
      room.lastPoisonResult = { targetId: target.id, targetName: target.name };
    }
    room.pendingPoison = null;
  }

  room.currentItem = room.itemQueue[room.round - 1];
  room.phase = 'bidding';
  syncRoom(room);

  room.bidTimer = setTimeout(() => revealBids(room), BID_TIME_MS);
}

function allActiveDecided(room) {
  const active = getActivePlayers(room);
  if (active.length === 0) return true;
  return active.every((p) => room.bids.has(p.id) || room.passed.has(p.id));
}

function revealBids(room) {
  clearTimers(room);
  const active = getActivePlayers(room);
  const item = room.currentItem;
  const bidders = active.filter((p) => room.bids.has(p.id));

  if (bidders.length === 0) {
    // Nobody bid (everyone passed, or nobody responded) - no winner, no effect.
    room.winnerId = null;
    room.lastEffectResult = null;
    room.phase = 'leaderboard';
    syncRoom(room);
    return;
  }

  let maxBid = -1;
  for (const p of bidders) {
    const amt = room.bids.get(p.id);
    if (amt > maxBid) maxBid = amt;
  }
  const topBidders = bidders.filter((p) => room.bids.get(p.id) === maxBid);
  const winner = topBidders[Math.floor(Math.random() * topBidders.length)];
  winner.roars -= maxBid;
  room.winnerId = winner.id;
  room.phase = 'bid_reveal';
  syncRoom(room);

  setTimeout(() => resolveItemEffect(room, winner, item), 1800);
}

function resolveItemEffect(room, winner, item) {
  if (item.type === 'strength') {
    winner.strength += item.strengthGain;
    room.lastEffectResult = { type: 'strength', itemId: item.id, winnerId: winner.id, amount: item.strengthGain };
    room.phase = 'effect_reveal';
    syncRoom(room);
    return;
  }

  if (item.type === 'trap') {
    eliminate(winner);
    room.lastEffectResult = { type: 'baboon', winnerId: winner.id, tagline: pickTagline(room) };
    room.phase = 'effect_reveal';
    syncRoom(room);
    return;
  }

  // attack items
  if (item.power === 'ambush') {
    const active = getActivePlayers(room);
    let minStrength = Infinity;
    for (const p of active) minStrength = Math.min(minStrength, p.strength);
    // Winner can never be their own victim - if winner is the sole player at
    // the board's lowest Strength, the ambush has no valid target and fizzles.
    const candidates = active.filter((p) => p.strength === minStrength && p.id !== winner.id);
    if (candidates.length === 0) {
      room.lastEffectResult = { type: 'ambush', winnerId: winner.id, fizzled: true };
      room.phase = 'effect_reveal';
      syncRoom(room);
      return;
    }
    const victim = candidates[Math.floor(Math.random() * candidates.length)];
    eliminate(victim);
    room.lastEffectResult = { type: 'ambush', winnerId: winner.id, eliminatedId: victim.id, tagline: pickTagline(room) };
    room.phase = 'effect_reveal';
    syncRoom(room);
    return;
  }

  if (item.power === 'stampede') {
    // Random OTHER active player is eliminated - never the bidder, and
    // never chosen by the bidder.
    const eligible = getActivePlayers(room).filter((p) => p.id !== winner.id);
    if (eligible.length === 0) {
      room.lastEffectResult = { type: 'stampede', winnerId: winner.id, fizzled: true };
      room.phase = 'effect_reveal';
      syncRoom(room);
      return;
    }
    const victim = eligible[Math.floor(Math.random() * eligible.length)];
    eliminate(victim);
    room.lastEffectResult = { type: 'stampede', winnerId: winner.id, eliminatedId: victim.id, tagline: pickTagline(room) };
    room.phase = 'effect_reveal';
    syncRoom(room);
    return;
  }

  // remaining attack items require the winner to pick target(s)
  const baseCount = item.power === 'tren' ? 2 : 1;
  const eligible = getActivePlayers(room).filter((p) => p.id !== winner.id);

  if (eligible.length === 0) {
    // no valid target at all; effect fizzles
    room.lastEffectResult = { type: item.power, winnerId: winner.id, fizzled: true };
    room.phase = 'effect_reveal';
    syncRoom(room);
    return;
  }

  // Tren normally hits 2 targets, but if only 1 other player is active it
  // still fires against that one player rather than fizzling entirely.
  const count = Math.min(baseCount, eligible.length);

  room.phase = 'target_select';
  syncRoom(room);

  if (winner.socketId) {
    io.to(winner.socketId).emit('player:target-select-prompt', {
      itemId: item.id,
      itemName: item.name,
      count,
      eligible: eligible.map(publicPlayer),
    });
  }

  room.targetTimer = setTimeout(() => {
    const randomTargets = shuffle(eligible).slice(0, count).map((p) => p.id);
    applyTargetedEffect(room, winner, item, randomTargets);
  }, TARGET_SELECT_TIME_MS);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function applyTargetedEffect(room, winner, item, targetIds) {
  clearTimers(room);
  const targets = targetIds.map((id) => room.players.get(id)).filter(Boolean);

  if (item.power === 'sharpened_claw') {
    const target = targets[0];
    const amount = Math.floor(target.strength / 2);
    target.strength -= amount;
    winner.strength += amount;
    room.lastEffectResult = { type: 'sharpened_claw', winnerId: winner.id, targetId: target.id, amount };
  } else if (item.power === 'poisoned_carcass') {
    const target = targets[0];
    room.pendingPoison = { targetId: target.id, targetName: target.name };
    room.lastEffectResult = { type: 'poisoned_carcass', winnerId: winner.id };
  } else if (item.power === 'hyena_pack') {
    const target = targets[0];
    const success = target.strength < winner.strength;
    if (success) eliminate(target);
    room.lastEffectResult = { type: 'hyena_pack', winnerId: winner.id, targetId: target.id, success, tagline: success ? pickTagline(room) : undefined };
  } else if (item.power === 'thorn_bush') {
    const target = targets[0];
    target.strength = Math.max(0, target.strength - 10);
    room.lastEffectResult = { type: 'thorn_bush', winnerId: winner.id, targetId: target.id, amount: 10 };
  } else if (item.power === 'tren') {
    for (const t of targets) eliminate(t);
    room.lastEffectResult = { type: 'tren', winnerId: winner.id, eliminatedIds: targets.map((t) => t.id), tagline: pickTagline(room) };
  }

  room.phase = 'effect_reveal';
  syncRoom(room);
}

function toLeaderboard(room) {
  clearTimers(room);
  room.phase = 'leaderboard';
  syncRoom(room);
}

function continueFromLeaderboard(room) {
  const active = getActivePlayers(room);
  if (active.length === 0) {
    endGame(room, true);
  } else if (room.round >= TOTAL_ROUNDS) {
    endGame(room, false);
  } else {
    startRound(room);
  }
}

function endGame(room, fallen) {
  clearTimers(room);
  room.phase = 'ended';
  if (fallen) {
    room.endResult = { fallen: true };
  } else {
    const active = getActivePlayers(room);
    const maxStrength = Math.max(...active.map((p) => p.strength));
    const winners = active.filter((p) => p.strength === maxStrength).map(publicPlayer);
    room.endResult = { fallen: false, winners };
  }
  syncRoom(room);
}

io.on('connection', (socket) => {
  socket.on('host:create', (cb) => {
    const room = makeRoom();
    room.hostSocketId = socket.id;
    socket.data.role = 'host';
    socket.data.roomCode = room.code;
    socket.join(room.code);
    cb && cb({ ok: true, code: room.code });
    syncRoom(room);
  });

  socket.on('host:rejoin', ({ code }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb && cb({ ok: false, error: 'Room not found' });
    room.hostSocketId = socket.id;
    socket.data.role = 'host';
    socket.data.roomCode = code;
    socket.join(code);
    cb && cb({ ok: true, code: room.code });
    syncRoom(room);
  });

  socket.on('host:start-game', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.data.role !== 'host' || room.phase !== 'lobby') return;
    const players = [...room.players.values()];
    if (players.length < MIN_PLAYERS) return;
    if (players.some((p) => !p.character)) return;
    room.itemQueue = generateItemQueue();
    room.round = 0;
    startRound(room);
  });

  socket.on('host:reveal-bids', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.data.role !== 'host' || room.phase !== 'bidding') return;
    revealBids(room);
  });

  socket.on('host:continue', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.data.role !== 'host') return;
    if (room.phase === 'bid_reveal' || room.phase === 'effect_reveal') {
      toLeaderboard(room);
    } else if (room.phase === 'leaderboard') {
      continueFromLeaderboard(room);
    }
  });

  socket.on('player:join', ({ code, name, existingPlayerId }, cb) => {
    const room = rooms.get((code || '').toUpperCase());
    if (!room) return cb && cb({ ok: false, error: 'Room not found. Check the code.' });

    if (existingPlayerId && room.players.has(existingPlayerId)) {
      const player = room.players.get(existingPlayerId);
      player.socketId = socket.id;
      player.connected = true;
      socket.data.role = 'player';
      socket.data.roomCode = room.code;
      socket.data.playerId = existingPlayerId;
      socket.join(room.code);
      cb && cb({ ok: true, playerId: existingPlayerId, code: room.code });
      syncRoom(room);
      return;
    }

    if (room.phase !== 'lobby') {
      return cb && cb({ ok: false, error: 'This game has already started.' });
    }
    const trimmed = (name || '').trim().slice(0, 16);
    if (!trimmed) return cb && cb({ ok: false, error: 'Enter a name.' });

    const playerId = genPlayerId();
    const player = {
      id: playerId,
      name: trimmed,
      character: null,
      roars: STARTING_ROARS,
      strength: 0,
      active: true,
      connected: true,
      socketId: socket.id,
    };
    room.players.set(playerId, player);
    socket.data.role = 'player';
    socket.data.roomCode = room.code;
    socket.data.playerId = playerId;
    socket.join(room.code);
    cb && cb({ ok: true, playerId, code: room.code });
    syncRoom(room);
  });

  socket.on('player:pick-character', ({ characterId }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.get(socket.data.playerId);
    if (!player) return;
    if (!CHAR_BY_ID[characterId]) return;
    if (takenCharacters(room).has(characterId)) return;
    player.character = characterId;
    syncRoom(room);
  });

  socket.on('player:submit-bid', ({ amount }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'bidding') return;
    const player = room.players.get(socket.data.playerId);
    if (!player || !player.active) return;
    let bid = Math.floor(Number(amount));
    if (!Number.isFinite(bid) || bid < 0) bid = 0;
    if (bid > player.roars) bid = player.roars;
    room.passed.delete(player.id);
    room.bids.set(player.id, bid);
    syncRoom(room);
    if (allActiveDecided(room)) revealBids(room);
  });

  socket.on('player:pass', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'bidding') return;
    const player = room.players.get(socket.data.playerId);
    if (!player || !player.active) return;
    room.bids.delete(player.id);
    room.passed.add(player.id);
    syncRoom(room);
    if (allActiveDecided(room)) revealBids(room);
  });

  socket.on('player:select-targets', ({ targetIds }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'target_select') return;
    if (room.winnerId !== socket.data.playerId) return;
    const winner = room.players.get(room.winnerId);
    const item = room.currentItem;
    const eligible = getActivePlayers(room).filter((p) => p.id !== winner.id);
    const count = Math.min(item.power === 'tren' ? 2 : 1, eligible.length);
    const ids = Array.isArray(targetIds) ? [...new Set(targetIds)].slice(0, count) : [];
    const validIds = ids.filter((id) => eligible.some((p) => p.id === id));
    if (validIds.length !== count) return;
    applyTargetedEffect(room, winner, item, validIds);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    if (socket.data.role === 'host' && room.hostSocketId === socket.id) {
      room.hostSocketId = null;
    } else if (socket.data.role === 'player') {
      const player = room.players.get(socket.data.playerId);
      if (player && player.socketId === socket.id) {
        player.connected = false;
        player.socketId = null;
      }
    }
    syncRoom(room);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Who's the King? running on http://localhost:${PORT}`);
});

// Exposed for direct-state-construction testing only; not used by the app itself.
module.exports = {
  rooms, makeRoom, getActivePlayers, eliminate,
  startRound, revealBids, resolveItemEffect, applyTargetedEffect,
  continueFromLeaderboard, endGame,
};
