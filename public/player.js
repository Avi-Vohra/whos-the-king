const socket = io();
const el = (id) => document.getElementById(id);

const joinSection = el('joinSection');
const charSection = el('charSection');
const waitingStartSection = el('waitingStartSection');
const gameSection = el('gameSection');
const endSection = el('endSection');

let myPlayerId = localStorage.getItem('wtk_player_id');
let myRoomCode = localStorage.getItem('wtk_room_code');
let pendingTargetPrompt = null;
let selectedTargets = [];
let lastBiddingItemId = null;
let lastEffectKey = null;
let fightTapInterval = null;
let lastFightStage = null;

function charAvatarEl(characterId, size, extraClass = '', full = false) {
  const div = document.createElement('div');
  div.className = `char-avatar ${full ? 'full-body' : ''} ${extraClass}`;
  div.style.width = size + 'px';
  div.style.height = size + 'px';
  div.innerHTML = characterId ? characterSVG(characterId, Math.round(size * 0.9), { full }) : '';
  return div;
}

// --- rejoin if we have saved identity ---
if (myPlayerId && myRoomCode) {
  attemptJoin(myRoomCode, null, myPlayerId);
}

el('joinBtn').addEventListener('click', () => {
  const code = el('codeInput').value.trim().toUpperCase();
  const name = el('nameInput').value.trim();
  if (!code || !name) {
    el('joinError').textContent = 'Enter both a room code and your name.';
    return;
  }
  attemptJoin(code, name, null);
});

function attemptJoin(code, name, existingPlayerId) {
  socket.emit('player:join', { code, name, existingPlayerId }, (res) => {
    if (!res || !res.ok) {
      localStorage.removeItem('wtk_player_id');
      localStorage.removeItem('wtk_room_code');
      el('joinError').textContent = (res && res.error) || 'Could not join.';
      return;
    }
    myPlayerId = res.playerId;
    myRoomCode = res.code;
    localStorage.setItem('wtk_player_id', myPlayerId);
    localStorage.setItem('wtk_room_code', myRoomCode);
    joinSection.classList.add('hidden');
  });
}

socket.on('player:target-select-prompt', (prompt) => {
  pendingTargetPrompt = prompt;
  selectedTargets = [];
  if (latestState) render(latestState);
});

let latestState = null;
socket.on('player:state', (state) => {
  latestState = state;
  render(state);
});

function render(state) {
  el('roomPill').textContent = `Room ${state.code}`;
  el('roomPill').classList.remove('hidden');

  if (state.phase === 'lobby') {
    joinSection.classList.add('hidden');
    waitingStartSection.classList.add('hidden');
    gameSection.classList.add('hidden');
    endSection.classList.add('hidden');
    if (state.me.character) {
      charSection.classList.add('hidden');
      waitingStartSection.classList.remove('hidden');
      el('waitingChosenName').textContent = `You are ${CHAR_BY_ID[state.me.character].name}`;
    } else {
      charSection.classList.remove('hidden');
      renderCharSelect(state);
    }
    return;
  }

  joinSection.classList.add('hidden');
  charSection.classList.add('hidden');
  waitingStartSection.classList.add('hidden');

  if (state.phase === 'ended') {
    gameSection.classList.add('hidden');
    endSection.classList.remove('hidden');
    renderEnd(state);
    return;
  }

  gameSection.classList.remove('hidden');
  endSection.classList.add('hidden');
  renderGame(state);
}

function renderCharSelect(state) {
  const grid = el('charGrid');
  grid.innerHTML = '';
  for (const c of state.characters) {
    const opt = document.createElement('div');
    opt.className = 'char-option' + (c.taken ? ' taken' : ' pickable');
    opt.appendChild(charAvatarEl(c.id, 84, '', true));
    const name = document.createElement('div');
    name.className = 'cname';
    name.textContent = c.name;
    opt.appendChild(name);
    const tag = document.createElement('div');
    tag.className = 'ctag';
    tag.textContent = c.taken ? 'Taken' : c.tagline;
    opt.appendChild(tag);
    if (!c.taken) {
      opt.addEventListener('click', () => {
        socket.emit('player:pick-character', { characterId: c.id });
      });
    }
    grid.appendChild(opt);
  }
}

function renderGame(state) {
  const me = state.me;
  el('meAvatar').innerHTML = '';
  el('meAvatar').appendChild(charAvatarEl(me.character, 60, me.active ? '' : 'eliminated'));
  el('meName').textContent = me.name;
  el('meCharName').textContent = CHAR_BY_ID[me.character] ? CHAR_BY_ID[me.character].name : '';
  el('meRoars').textContent = me.roars;
  el('meStrength').textContent = me.strength;

  el('spectatorBanner').classList.toggle('hidden', me.active);
  el('roundInfo').textContent = `Round ${state.round} / ${state.totalRounds}`;

  ['biddingView', 'targetSelectView', 'fightView', 'revealEffectView', 'leaderboardView'].forEach((v) => el(v).classList.add('hidden'));

  if (state.phase === 'bidding') {
    if (lastBiddingItemId !== (state.currentItem && state.currentItem.id) + state.round) {
      lastBiddingItemId = (state.currentItem && state.currentItem.id) + state.round;
      el('bidInput').value = '';
      el('bidInput').disabled = false;
      el('submitBidBtn').disabled = false;
      el('passBtn').disabled = false;
    }
    el('bidInput').max = me.roars;
    el('biddingView').classList.remove('hidden');
    el('itemName').textContent = state.currentItem ? state.currentItem.name : '';
    el('itemFlavor').textContent = state.currentItem ? state.currentItem.flavor : '';
    el('itemIcon').innerHTML = state.currentItem ? itemIconSVG(state.currentItem.id, 80) : '';
    el('itemCard').classList.toggle('tren-glow', !!state.currentItem && state.currentItem.id === 'tren');

    const bidForm = el('bidForm');
    const submittedNote = el('bidSubmittedNote');
    const passedNote = el('passedNote');
    if (!me.active) {
      bidForm.classList.add('hidden');
      submittedNote.classList.add('hidden');
      passedNote.classList.add('hidden');
    } else if (state.hasPassed) {
      bidForm.classList.add('hidden');
      submittedNote.classList.add('hidden');
      passedNote.classList.remove('hidden');
    } else if (state.hasBid) {
      bidForm.classList.add('hidden');
      submittedNote.classList.remove('hidden');
      passedNote.classList.add('hidden');
    } else {
      bidForm.classList.remove('hidden');
      submittedNote.classList.add('hidden');
      passedNote.classList.add('hidden');
      renderQuickBids(me.roars);
    }
    return;
  }

  const amITargetWinner = state.phase === 'target_select' && me.active
    && state.bidReveal && state.bidReveal.winnerId === myPlayerId;
  if (amITargetWinner) {
    if (!pendingTargetPrompt) {
      // The one-time target-select-prompt socket event was missed (e.g. a
      // reconnect/reload mid-round) - rebuild the same prompt from synced
      // state so the winner isn't stuck unable to pick a target.
      const eligible = state.players.filter((p) => p.active && p.id !== myPlayerId);
      const count = Math.min(state.currentItem && state.currentItem.id === 'tren' ? 2 : 1, eligible.length);
      pendingTargetPrompt = { itemId: state.currentItem && state.currentItem.id, itemName: state.currentItem && state.currentItem.name, count, eligible };
      selectedTargets = [];
    }
    el('targetSelectView').classList.remove('hidden');
    renderTargetSelect(state);
    return;
  }

  if (state.phase === 'fight' && state.fight) {
    el('fightView').classList.remove('hidden');
    renderFight(state);
    return;
  }

  if (state.phase === 'leaderboard') {
    el('leaderboardView').classList.remove('hidden');
    renderLeaderboard(state);
    return;
  }

  // bid_reveal / target_select (not me) / effect_reveal
  el('revealEffectView').classList.remove('hidden');
  renderRevealEffect(state);
}

function renderQuickBids(roars) {
  const wrap = el('quickBids');
  wrap.innerHTML = '';
  const options = [...new Set([10, 25, 50, roars])].filter((n) => n > 0 && n <= roars);
  for (const n of options) {
    const btn = document.createElement('button');
    btn.textContent = n === roars ? `All-in (${n})` : n;
    btn.addEventListener('click', () => { el('bidInput').value = n; });
    wrap.appendChild(btn);
  }
}

function renderTargetSelect(state) {
  el('targetPrompt').textContent = `${pendingTargetPrompt.itemName}: choose ${pendingTargetPrompt.count} target${pendingTargetPrompt.count > 1 ? 's' : ''}`;
  const list = el('targetList');
  list.innerHTML = '';
  for (const p of pendingTargetPrompt.eligible) {
    const opt = document.createElement('div');
    opt.className = 'target-option' + (selectedTargets.includes(p.id) ? ' selected' : '');
    opt.appendChild(charAvatarEl(p.character, 46));
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = p.name;
    opt.appendChild(name);
    const str = document.createElement('div');
    str.className = 'strength';
    str.textContent = `${p.strength} STR`;
    opt.appendChild(str);
    opt.addEventListener('click', () => {
      const idx = selectedTargets.indexOf(p.id);
      if (idx >= 0) {
        selectedTargets.splice(idx, 1);
      } else if (selectedTargets.length < pendingTargetPrompt.count) {
        selectedTargets.push(p.id);
      }
      renderTargetSelect(state);
    });
    list.appendChild(opt);
  }
  el('confirmTargetBtn').disabled = selectedTargets.length !== pendingTargetPrompt.count;
}

el('confirmTargetBtn').addEventListener('click', () => {
  if (!pendingTargetPrompt || selectedTargets.length !== pendingTargetPrompt.count) return;
  socket.emit('player:select-targets', { targetIds: selectedTargets });
  pendingTargetPrompt = null;
});

el('submitBidBtn').addEventListener('click', () => {
  const val = Math.floor(Number(el('bidInput').value));
  const amount = Number.isFinite(val) && val >= 0 ? val : 0;
  socket.emit('player:submit-bid', { amount });
  el('bidInput').disabled = true;
  el('submitBidBtn').disabled = true;
  el('passBtn').disabled = true;
});

el('passBtn').addEventListener('click', () => {
  socket.emit('player:pass');
  el('bidInput').disabled = true;
  el('submitBidBtn').disabled = true;
  el('passBtn').disabled = true;
});

function playerName(state, id) {
  const p = state.players.find((pp) => pp.id === id);
  return p ? p.name : '???';
}

function renderFight(state) {
  const f = state.fight;
  const content = el('fightContent');
  const me = state.me;
  const iAmAttacker = me.id === f.attacker.id;
  const iAmDefender = me.id === f.defender.id;
  const amParticipant = iAmAttacker || iAmDefender;
  const opponent = iAmAttacker ? f.defender : f.attacker;
  const self = iAmAttacker ? f.attacker : f.defender;

  if (f.stage !== lastFightStage) {
    lastFightStage = f.stage;
    content.innerHTML = '';
  }

  if (f.stage === 'countdown') {
    content.innerHTML = `
      <div style="text-align:center;">
        <h2>${f.attacker.name} vs ${f.defender.name}</h2>
        <div style="font-size:3.5rem; font-weight:900; color:var(--red); margin:1rem 0;">Get Ready!</div>
        <p>${amParticipant ? 'Tap as fast as you can when it starts!' : 'Watch the host screen...'}</p>
      </div>`;
    return;
  }

  if (f.stage === 'active') {
    if (!amParticipant) {
      const tapsA = f.taps[f.attacker.id] || 0;
      const tapsB = f.taps[f.defender.id] || 0;
      content.innerHTML = `
        <div style="text-align:center;">
          <h2>${f.attacker.name} vs ${f.defender.name}</h2>
          <p style="font-size:1.3rem; font-weight:800;">${tapsA} — ${tapsB}</p>
          <p>Fighting it out... watch the host screen!</p>
        </div>`;
      return;
    }
    // Only build the tap UI once per fight to avoid wiping button state; update live parts after.
    if (!document.getElementById('fightTapBtn')) {
      content.innerHTML = `
        <div style="text-align:center;">
          <h2 style="margin-bottom:0.2rem;">VS ${opponent.name}</h2>
          <p id="fightTimeLeft" style="font-weight:800; font-size:1.1rem;"></p>
          <button id="fightTapBtn" style="width:100%; padding:2.2rem; font-size:2rem; font-weight:900; background:var(--red); color:#fff; border-radius:20px; margin:1rem 0; box-shadow:0 6px 0 #8a2a20;">TAP!</button>
          <p id="fightTapCount" style="font-size:1.3rem; font-weight:800;"></p>
        </div>`;
      const btn = document.getElementById('fightTapBtn');
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); socket.emit('player:fight-tap'); btn.style.transform = 'scale(0.94)'; setTimeout(() => { btn.style.transform = 'scale(1)'; }, 60); }, { passive: false });
      btn.addEventListener('click', () => { socket.emit('player:fight-tap'); });
      if (fightTapInterval) clearInterval(fightTapInterval);
      fightTapInterval = setInterval(() => {
        const node = document.getElementById('fightTimeLeft');
        if (!node || !latestState || !latestState.fight || latestState.fight.stage !== 'active') { clearInterval(fightTapInterval); fightTapInterval = null; return; }
        const rem = Math.max(0, (latestState.fight.endsAt - Date.now()) / 1000);
        node.textContent = `${rem.toFixed(1)}s left`;
      }, 100);
    }
    const myTaps = f.taps[self.id] || 0;
    const oppTaps = f.taps[opponent.id] || 0;
    const countEl = document.getElementById('fightTapCount');
    if (countEl) countEl.textContent = `You: ${myTaps}  •  ${opponent.name}: ${oppTaps}`;
    return;
  }
}

function renderRevealEffect(state) {
  const content = el('revealEffectContent');
  content.innerHTML = '';
  const me = latestState.me;

  if (state.phase === 'bid_reveal' && state.bidReveal) {
    const winnerName = playerName(state, state.bidReveal.winnerId);
    const amount = state.bidReveal.bids.find((b) => b.playerId === state.bidReveal.winnerId);
    const h = document.createElement('h2');
    h.style.textAlign = 'center';
    h.textContent = state.bidReveal.winnerId === me.id
      ? `You won the bid for ${amount ? amount.amount : ''} Roars!`
      : `${winnerName} won the bid!`;
    content.appendChild(h);
    return;
  }

  if (state.phase === 'target_select') {
    const winnerName = playerName(state, state.bidReveal ? state.bidReveal.winnerId : null);
    const p = document.createElement('p');
    p.style.textAlign = 'center';
    p.style.fontWeight = '800';
    p.textContent = `${winnerName} is choosing their target…`;
    content.appendChild(p);
    return;
  }

  if (state.phase === 'effect_reveal' && state.effectResult) {
    const r = state.effectResult;
    const key = JSON.stringify(r) + state.round;
    lastEffectKey = key;
    const winnerName = playerName(state, r.winnerId);
    const iAmWinner = r.winnerId === me.id;
    let title = '';
    let cls = 'good';

    if (r.fizzled) {
      title = iAmWinner ? `You won the item, but there was no valid target left.` : `${winnerName} won the item, but there was no valid target left.`;
    } else if (r.type === 'strength') {
      title = iAmWinner ? `You gained ${r.amount} Strength!` : `${winnerName} gained ${r.amount} Strength.`;
    } else if (r.type === 'baboon') {
      title = iAmWinner ? `🐒 BLAM! The Red-Butt Baboon got you. You're out!` : `🐒 BLAM! The Red-Butt Baboon eliminated ${winnerName}!`;
      cls = iAmWinner ? 'bad' : 'good';
    } else if (r.type === 'fight_win') {
      const targetName = playerName(state, r.eliminatedId);
      const amEliminated = r.eliminatedId === me.id;
      title = amEliminated
        ? `You lost the fight! ${winnerName} wins (${r.attackerTaps}-${r.defenderTaps} taps).`
        : iAmWinner
          ? `You won the fight! ${targetName} is eliminated (${r.attackerTaps}-${r.defenderTaps} taps).`
          : `${winnerName} won the fight! ${targetName} eliminated (${r.attackerTaps}-${r.defenderTaps} taps).`;
      cls = amEliminated ? 'bad' : 'good';
    } else if (r.type === 'fight_loss') {
      const amAttacker = r.winnerId === me.id;
      const amDefender = r.defenderId === me.id;
      title = amAttacker
        ? `You lost the fight and took -${r.penalty} Strength.`
        : amDefender
          ? `You fought off ${winnerName}! They lose ${r.penalty} Strength.`
          : `${playerName(state, r.defenderId)} fought off ${winnerName}, who loses ${r.penalty} Strength.`;
      cls = amAttacker ? 'bad' : 'good';
    } else if (r.type === 'vultures_mark') {
      const amTarget = r.targetId === me.id;
      title = iAmWinner
        ? `You marked ${playerName(state, r.targetId)} for the vultures. They won't see it coming.`
        : amTarget
          ? `${winnerName} marked you for the vultures. Something's coming next round...`
          : `${winnerName} marked ${playerName(state, r.targetId)} for the vultures.`;
      cls = amTarget ? 'bad' : 'good';
    } else if (r.type === 'locked_horns') {
      const targetName = playerName(state, r.targetId);
      const amTarget = r.targetId === me.id;
      title = iAmWinner
        ? `You locked horns with ${targetName}! -${r.amount} Strength for them.`
        : amTarget
          ? `${winnerName} locked horns with you! -${r.amount} Strength.`
          : `${winnerName} locked horns with ${targetName}. -${r.amount} Strength.`;
      cls = amTarget ? 'bad' : 'good';
    } else if (r.type === 'sharpened_claw') {
      const targetName = playerName(state, r.targetId);
      const amTarget = r.targetId === me.id;
      title = iAmWinner
        ? `You clawed ${targetName} for ${r.amount} Strength!`
        : amTarget
          ? `${winnerName} clawed you for ${r.amount} Strength!`
          : `${winnerName} clawed ${targetName} for ${r.amount} Strength.`;
      cls = amTarget ? 'bad' : 'good';
    } else if (r.type === 'thorn_bush') {
      const targetName = playerName(state, r.targetId);
      const amTarget = r.targetId === me.id;
      title = iAmWinner
        ? `You drove ${targetName} into the thorns! -${r.amount} Strength.`
        : amTarget
          ? `${winnerName} drove you into the thorns! -${r.amount} Strength.`
          : `${winnerName} drove ${targetName} into the thorns. -${r.amount} Strength.`;
      cls = amTarget ? 'bad' : 'good';
    } else if (r.type === 'poisoned_carcass') {
      title = iAmWinner
        ? `You planted a poisoned carcass. Your target won't see it coming...`
        : `${winnerName} planted a poisoned carcass somewhere out there...`;
    } else if (r.type === 'tren') {
      const amEliminated = r.eliminatedIds.includes(me.id);
      title = amEliminated
        ? `TREN. ${winnerName} just eliminated you instantly.`
        : iAmWinner
          ? `TREN ACTIVATED. You eliminated ${r.eliminatedIds.map((id) => playerName(state, id)).join(' and ')}!`
          : `TREN ACTIVATED. ${winnerName} eliminated ${r.eliminatedIds.map((id) => playerName(state, id)).join(' and ')}!`;
      cls = amEliminated ? 'bad' : 'good';
    }

    const banner = document.createElement('div');
    banner.className = `result-banner ${cls}${r.type === 'tren' ? ' tren' : ''}`;
    banner.textContent = title;
    content.appendChild(banner);

    if (r.tagline) {
      const tag = document.createElement('p');
      tag.className = 'elim-tagline-p';
      tag.textContent = r.tagline;
      content.appendChild(tag);
    }
  }
}

function renderLeaderboard(state) {
  const list = el('leaderboardListP');
  list.innerHTML = '';
  for (const p of state.leaderboard) {
    const row = document.createElement('div');
    row.className = 'lb-row-p' + (p.active ? '' : ' eliminated') + (p.id === state.me.id ? ' me' : '');
    row.appendChild(charAvatarEl(p.character, 40, p.active ? '' : 'eliminated'));
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = p.name;
    row.appendChild(name);
    const str = document.createElement('div');
    str.textContent = `${p.strength} STR`;
    row.appendChild(str);
    list.appendChild(row);
  }
}

function renderEnd(state) {
  const result = state.endResult;
  endSection.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card end-card';

  if (result.fallen) {
    card.innerHTML = `<div style="font-size:4rem;">🦴</div><h2>The pride has fallen.</h2><p>There is no king.</p>`;
    endSection.appendChild(card);
    return;
  }

  const winners = result.winners;
  const iWon = winners.some((w) => w.id === latestState.me.id);
  const isMulti = winners.length > 1;

  const avatarsRow = document.createElement('div');
  avatarsRow.style.display = 'flex';
  avatarsRow.style.justifyContent = 'center';
  avatarsRow.style.gap = '1rem';
  for (const w of winners) avatarsRow.appendChild(charAvatarEl(w.character, isMulti ? 100 : 160, '', true));
  card.appendChild(avatarsRow);

  const h2 = document.createElement('h2');
  if (isMulti) {
    const names = winners.map((w) => w.name).join(' & ');
    h2.textContent = iWon
      ? `👑 You've earned the throne — and the night in The Lion's Den!`
      : `👑 ${names} have earned the throne — and the night in The Lion's Den!`;
  } else {
    h2.textContent = iWon
      ? `👑 You've earned the throne — and the night in The Lion's Den!`
      : `👑 ${winners[0].name} has earned the throne — and the night in The Lion's Den!`;
  }
  card.appendChild(h2);
  endSection.appendChild(card);
}
