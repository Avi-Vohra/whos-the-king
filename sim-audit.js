const { io } = require('socket.io-client');
const { spawn } = require('child_process');

const PORT = process.argv[2] || 4321;
const N = parseInt(process.argv[3] || '4', 10);
const URL = `http://localhost:${PORT}`;

function log(...a) { console.log(...a); }

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function run() {
  const host = io(URL, { transports: ['websocket'] });
  await new Promise((res) => host.on('connect', res));
  const { code } = await new Promise((res) => host.emit('host:create', res));
  log(`room ${code} players=${N}`);

  const players = [];
  for (let i = 0; i < N; i++) {
    const s = io(URL, { transports: ['websocket'] });
    await new Promise((res) => s.on('connect', res));
    const joinRes = await new Promise((res) => s.emit('player:join', { code, name: `P${i}` }, res));
    if (joinRes.error) throw new Error('join error: ' + joinRes.error);
    players.push({ socket: s, id: joinRes.playerId, state: null, fightTapped: false });
  }

  let hostState = null;
  host.on('host:state', (st) => { hostState = st; });
  for (const p of players) {
    p.socket.on('player:state', (st) => { p.state = st; });
  }

  await wait(300);
  const charList = ['chopped','chud','chud-jr','zesty','diva','tiny','bald','cute','lady','avi'];
  for (let i = 0; i < players.length; i++) {
    players[i].socket.emit('player:pick-character', { characterId: charList[i % charList.length] });
  }
  await wait(300);

  host.emit('host:start-game');
  await wait(300);

  const trenSeen = new Set();
  const baboonSeen = new Set();
  let rounds = 0;
  const seenTargetSelfBug = [];

  const deadline = Date.now() + 240000;
  let lastRound = -1;
  while (Date.now() < deadline) {
    if (!hostState) { await wait(100); continue; }
    if (hostState.phase === 'ended') {
      log('ENDED', JSON.stringify(hostState.endResult));
      break;
    }
    if (hostState.phase === 'bidding') {
      rounds = hostState.round;
      if (rounds !== lastRound) { lastRound = rounds; log(`  round ${rounds} @ t=${Math.round((Date.now()-(deadline-240000))/1000)}s item=${hostState.currentItem && hostState.currentItem.id}`); }
      for (const p of players) p.targetedThisRound = false;
      const item = hostState.currentItem;
      if (item && item.id === 'tren') trenSeen.add(hostState.round);
      if (item && item.id === 'red_butt_baboon') baboonSeen.add(hostState.round);
      for (const p of players) {
        if (!p.state || !p.state.me || !p.state.me.active) continue;
        if (p.state.phase !== 'bidding') continue;
        const already = p.state.bidProgress && p.state.bidProgress.submitted && p.state.bidProgress.submitted.includes(p.id);
        if (already) continue;
        const bid = Math.floor(Math.random() * 5);
        p.socket.emit('player:submit-bid', { amount: bid });
      }
    } else if (hostState.phase === 'target_select') {
      const winnerId = hostState.winnerId;
      const winner = players.find((p) => p.id === winnerId);
      if (winner && !winner.targetedThisRound) {
        winner.targetedThisRound = true;
        const eligible = hostState.players.filter((p) => p.active && p.id !== winnerId);
        const isTren = hostState.currentItem && hostState.currentItem.id === 'tren';
        const count = Math.min(isTren ? 2 : 1, eligible.length);
        const picks = eligible.slice(0, count).map((p) => p.id);
        if (picks.includes(winnerId)) seenTargetSelfBug.push({ round: hostState.round, picks });
        if (count > 0) winner.socket.emit('player:select-targets', { targetIds: picks });
      }
    } else if (hostState.phase === 'fight') {
      const f = hostState.fight;
      if (f && f.stage === 'active') {
        for (const p of players) {
          if (p.id === f.attacker.id || p.id === f.defender.id) {
            for (let k = 0; k < 3; k++) p.socket.emit('player:fight-tap');
          }
        }
      }
    } else if (hostState.phase === 'effect_reveal' || hostState.phase === 'leaderboard') {
      host.emit('host:continue');
    }
    await wait(150);
  }

  log('rounds reached:', rounds, 'tren rounds:', [...trenSeen], 'baboon rounds:', [...baboonSeen]);
  log('self-target bugs:', JSON.stringify(seenTargetSelfBug));
  if (hostState && hostState.phase !== 'ended') log('WARNING: did not reach ended state, phase=', hostState.phase);

  host.close();
  for (const p of players) p.socket.close();
}

run().then(() => process.exit(0)).catch((e) => { console.error('SIM ERROR', e); process.exit(1); });
