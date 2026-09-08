const socket = io();

const el = (id) => document.getElementById(id);
const lobbySection = el('lobbySection');
const gameSection = el('gameSection');
const endSection = el('endSection');

let latestState = null;
let lastEffectKey = null;
let lastPoisonKey = null;

function charAvatar(characterId, size, extraClass = '', full = false) {
  const div = document.createElement('div');
  div.className = `char-avatar ${full ? 'full-body' : ''} ${extraClass}`;
  div.style.width = size + 'px';
  div.style.height = size + 'px';
  if (characterId) {
    div.innerHTML = characterSVG(characterId, Math.round(size * 0.9), { full });
  } else {
    div.innerHTML = '<span style="font-size:1.5rem;">?</span>';
  }
  return div;
}

function charName(id) {
  return (CHAR_BY_ID[id] && CHAR_BY_ID[id].name) || 'Unknown';
}

// --- restore/create room on load ---
const savedCode = sessionStorage.getItem('wtk_host_code');
if (savedCode) {
  socket.emit('host:rejoin', { code: savedCode }, (res) => {
    if (!res || !res.ok) createRoom();
  });
} else {
  createRoom();
}

function createRoom() {
  socket.emit('host:create', (res) => {
    if (res && res.ok) sessionStorage.setItem('wtk_host_code', res.code);
  });
}

socket.on('host:state', (state) => {
  latestState = state;
  render(state);
});

function render(state) {
  el('roomCode').textContent = state.code;
  el('roomPill').textContent = `Room ${state.code}`;
  el('roomPill').classList.remove('hidden');

  if (state.phase === 'lobby') {
    lobbySection.classList.remove('hidden');
    gameSection.classList.add('hidden');
    endSection.classList.add('hidden');
    renderLobby(state);
    return;
  }

  lobbySection.classList.add('hidden');

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

function renderLobby(state) {
  el('lobbyCount').textContent = state.players.length === 0
    ? 'Waiting for players…'
    : `${state.players.length} player${state.players.length === 1 ? '' : 's'} joined`;

  const grid = el('lobbyGrid');
  grid.innerHTML = '';
  for (const p of state.players) {
    const card = document.createElement('div');
    card.className = 'lobby-card';
    card.appendChild(charAvatar(p.character, 80));
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = p.name;
    card.appendChild(name);
    const status = document.createElement('div');
    status.className = p.character ? 'char-label' : 'waiting';
    status.textContent = p.character ? charName(p.character) : 'choosing…';
    card.appendChild(status);
    grid.appendChild(card);
  }

  const allPicked = state.players.length > 0 && state.players.every((p) => p.character);
  el('startGameBtn').disabled = !(state.players.length >= 2 && allPicked);
}

function renderGame(state) {
  el('roundPill').textContent = `Round ${state.round} / ${state.totalRounds}`;
  const phaseLabels = {
    bidding: 'Bidding Open',
    bid_reveal: 'Revealing Bids…',
    target_select: 'Choosing Target…',
    effect_reveal: 'Resolving…',
    leaderboard: 'Leaderboard',
  };
  el('phasePill').textContent = phaseLabels[state.phase] || '';

  const views = ['biddingView', 'revealView', 'effectView', 'leaderboardView'];
  views.forEach((v) => el(v).classList.add('hidden'));
  el('continueBar').classList.add('hidden');

  if (state.phase === 'bidding') {
    el('biddingView').classList.remove('hidden');
    renderBidding(state);
  } else if (state.phase === 'bid_reveal' || state.phase === 'target_select') {
    el('revealView').classList.remove('hidden');
    renderReveal(state);
  } else if (state.phase === 'effect_reveal') {
    el('effectView').classList.remove('hidden');
    el('continueBar').classList.remove('hidden');
    el('continueBtn').textContent = 'Continue';
    renderEffect(state);
  } else if (state.phase === 'leaderboard') {
    el('leaderboardView').classList.remove('hidden');
    el('continueBar').classList.remove('hidden');
    const active = state.players.filter((p) => p.active).length;
    el('continueBtn').textContent = (active === 0 || state.round >= state.totalRounds) ? 'See Results' : 'Next Round';
    renderLeaderboard(state);
  }
}

function renderBidding(state) {
  el('itemName').textContent = state.currentItem ? state.currentItem.name : '';
  el('itemFlavor').textContent = state.currentItem ? state.currentItem.flavor : '';
  el('itemIcon').innerHTML = state.currentItem ? itemIconSVG(state.currentItem.id, 96) : '';
  el('itemCard').classList.toggle('tren-glow', !!state.currentItem && state.currentItem.id === 'tren');

  const grid = el('bidProgressGrid');
  grid.innerHTML = '';
  const active = state.players.filter((p) => p.active);
  const submitted = new Set((state.bidProgress && state.bidProgress.submitted) || []);
  for (const p of active) {
    const card = document.createElement('div');
    card.className = 'bid-progress-card' + (submitted.has(p.id) ? ' submitted' : '');
    card.appendChild(charAvatar(p.character, 60));
    const name = document.createElement('div');
    name.textContent = p.name;
    name.style.fontWeight = '700';
    card.appendChild(name);
    if (submitted.has(p.id)) {
      const check = document.createElement('div');
      check.className = 'check';
      check.textContent = '✓';
      card.appendChild(check);
    }
    grid.appendChild(card);
  }
}

let lastRevealKey = null;
function animateCountUp(el, target, duration = 550) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = `${Math.round(target * eased)} 🔥`;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderReveal(state) {
  const br = state.bidReveal;
  if (!br) return;
  el('revealItemName').textContent = br.item.name;
  const rows = el('revealRows');
  rows.innerHTML = '';
  const revealKey = state.round + ':' + br.bids.map((b) => b.playerId + b.amount).join(',');
  const isNewReveal = revealKey !== lastRevealKey;
  lastRevealKey = revealKey;
  const sorted = br.bids.slice().sort((a, b) => b.amount - a.amount);
  for (const b of sorted) {
    const row = document.createElement('div');
    row.className = 'reveal-row' + (b.playerId === br.winnerId ? ' winner' : '');
    const who = document.createElement('div');
    who.className = 'who';
    who.appendChild(charAvatar(b.character, 50));
    const nameSpan = document.createElement('span');
    nameSpan.textContent = b.name;
    who.appendChild(nameSpan);
    row.appendChild(who);
    const amt = document.createElement('div');
    amt.className = 'amount';
    if (isNewReveal) {
      amt.textContent = '0 🔥';
      animateCountUp(amt, b.amount);
    } else {
      amt.textContent = `${b.amount} 🔥`;
    }
    row.appendChild(amt);
    rows.appendChild(row);
  }

  const note = el('revealNote');
  if (state.phase === 'target_select') {
    const winner = state.players.find((p) => p.id === br.winnerId);
    note.textContent = `${winner ? winner.name : 'The winner'} is choosing their target…`;
    note.classList.remove('hidden');
  } else {
    note.classList.add('hidden');
  }
}

function renderEffect(state) {
  const stage = el('effectStage');
  const result = state.effectResult;
  if (!result) { stage.innerHTML = ''; return; }

  const key = JSON.stringify(result) + state.round;
  const isNew = key !== lastEffectKey;
  lastEffectKey = key;

  stage.innerHTML = '';
  const winner = state.players.find((p) => p.id === result.winnerId);

  function playerName(id) {
    const p = state.players.find((pp) => pp.id === id);
    return p ? p.name : '???';
  }
  function playerChar(id) {
    const p = state.players.find((pp) => pp.id === id);
    return p ? p.character : null;
  }

  stage.classList.toggle('tren-glow', result.type === 'tren');

  function taglineEl(tagline) {
    const p = document.createElement('p');
    p.className = 'elim-tagline';
    p.textContent = tagline;
    return p;
  }

  if (result.fizzled) {
    stage.appendChild(charAvatar(winner.character, 130, '', true));
    const h = document.createElement('h2');
    h.textContent = `${winner.name} won the item, but there was no valid target left.`;
    stage.appendChild(h);
  } else if (result.type === 'strength') {
    stage.appendChild(charAvatar(winner.character, 160, isNew ? 'pop' : '', true));
    const h = document.createElement('h2');
    h.textContent = `${winner.name} grows stronger!`;
    stage.appendChild(h);
    const pop = document.createElement('div');
    pop.className = 'stat-pop gain';
    pop.textContent = `+${result.amount} Strength`;
    stage.appendChild(pop);
  } else if (result.type === 'baboon') {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:flex-end; justify-content:center; gap:1rem; position:relative;';
    row.appendChild(charAvatar(winner.character, 150, isNew ? 'shake' : '', true));
    const baboonWrap = document.createElement('div');
    baboonWrap.className = 'baboon-reveal';
    baboonWrap.innerHTML = baboonStandaloneSVG(150);
    row.appendChild(baboonWrap);
    const shotgun = document.createElement('div');
    shotgun.className = 'shotgun-wrap';
    shotgun.style.right = '8%';
    shotgun.style.bottom = '38%';
    shotgun.innerHTML = shotgunSVG();
    row.appendChild(shotgun);
    const flash = document.createElement('div');
    flash.className = 'muzzle-flash';
    flash.style.left = '48%';
    flash.style.bottom = '42%';
    flash.innerHTML = muzzleFlashSVG();
    row.appendChild(flash);
    stage.appendChild(row);
    const h = document.createElement('h2');
    h.textContent = `${winner.name} got played...`;
    stage.appendChild(h);
    const blam = document.createElement('div');
    blam.className = 'blam-text';
    blam.textContent = 'BLAM!';
    stage.appendChild(blam);
    for (let i = 0; i < 5; i++) {
      const smoke = document.createElement('div');
      smoke.className = 'smoke-cloud';
      smoke.style.left = `${40 + i * 8}%`;
      smoke.style.top = `${50 + (i % 2) * 10}%`;
      smoke.style.animationDelay = `${0.75 + i * 0.08}s`;
      stage.appendChild(smoke);
    }
    const sub = document.createElement('p');
    sub.textContent = '🐒 The Red-Butt Baboon strikes again. Eliminated!';
    stage.appendChild(sub);
    stage.appendChild(taglineEl(result.tagline));
  } else if (result.type === 'ambush') {
    stage.appendChild(charAvatar(winner.character, 130, '', true));
    const h = document.createElement('h2');
    h.textContent = `${winner.name} sprung the ambush!`;
    stage.appendChild(h);
    const vic = charAvatar(playerChar(result.eliminatedId), 120, 'avatar-fade-out', true);
    stage.appendChild(vic);
    const sub = document.createElement('p');
    sub.textContent = `${playerName(result.eliminatedId)} (lowest Strength) is eliminated!`;
    stage.appendChild(sub);
    stage.appendChild(taglineEl(result.tagline));
  } else if (result.type === 'stampede') {
    stage.appendChild(charAvatar(winner.character, 130, '', true));
    const h = document.createElement('h2');
    h.textContent = `${winner.name} triggered a stampede!`;
    stage.appendChild(h);
    const vic = charAvatar(playerChar(result.eliminatedId), 120, 'avatar-fade-out', true);
    stage.appendChild(vic);
    const sub = document.createElement('p');
    sub.textContent = `${playerName(result.eliminatedId)} never saw it coming. Eliminated!`;
    stage.appendChild(sub);
    stage.appendChild(taglineEl(result.tagline));
  } else if (result.type === 'sharpened_claw') {
    stage.appendChild(charAvatar(winner.character, 130, '', true));
    const h = document.createElement('h2');
    h.textContent = `${winner.name} strikes ${playerName(result.targetId)}!`;
    stage.appendChild(h);
    const pop = document.createElement('div');
    pop.className = 'stat-pop gain';
    pop.textContent = `+${result.amount} Strength`;
    stage.appendChild(pop);
    const sub = document.createElement('p');
    sub.textContent = `${playerName(result.targetId)} loses ${result.amount} Strength.`;
    stage.appendChild(sub);
  } else if (result.type === 'thorn_bush') {
    stage.appendChild(charAvatar(winner.character, 130, '', true));
    const h = document.createElement('h2');
    h.textContent = `${winner.name} sends ${playerName(result.targetId)} into the thorns!`;
    stage.appendChild(h);
    const pop = document.createElement('div');
    pop.className = 'stat-pop loss';
    pop.textContent = `-${result.amount} Strength`;
    stage.appendChild(pop);
    const sub = document.createElement('p');
    sub.textContent = `${playerName(result.targetId)} is hurt, but still standing.`;
    stage.appendChild(sub);
  } else if (result.type === 'poisoned_carcass') {
    stage.appendChild(charAvatar(winner.character, 150, '', true));
    const h = document.createElement('h2');
    h.textContent = `${winner.name} plants a poisoned carcass...`;
    stage.appendChild(h);
    const sub = document.createElement('p');
    sub.textContent = 'Somewhere out there, a rival will regret this. No one knows who yet...';
    stage.appendChild(sub);
  } else if (result.type === 'hyena_pack') {
    stage.appendChild(charAvatar(winner.character, 130, '', true));
    const h = document.createElement('h2');
    h.textContent = result.success
      ? `The hyenas take down ${playerName(result.targetId)}!`
      : `The hyenas backed off...`;
    stage.appendChild(h);
    if (result.success) {
      stage.appendChild(charAvatar(playerChar(result.targetId), 120, 'avatar-fade-out', true));
      const sub = document.createElement('p');
      sub.textContent = `${playerName(result.targetId)} was weaker. Eliminated!`;
      stage.appendChild(sub);
      stage.appendChild(taglineEl(result.tagline));
    } else {
      const sub = document.createElement('p');
      sub.textContent = `${playerName(result.targetId)} was too strong. Nothing happens.`;
      stage.appendChild(sub);
    }
  } else if (result.type === 'tren') {
    const h0 = document.createElement('h2');
    h0.textContent = 'TREN ACTIVATED';
    h0.style.color = '#1a7a3a';
    stage.appendChild(h0);
    stage.appendChild(charAvatar(winner.character, 150, isNew ? 'pop' : '', true));
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '2rem';
    row.style.marginTop = '0.5rem';
    for (const id of result.eliminatedIds) {
      row.appendChild(charAvatar(playerChar(id), 120, 'avatar-fade-out', true));
    }
    stage.appendChild(row);
    const sub = document.createElement('p');
    sub.textContent = `${winner.name} eliminates ${result.eliminatedIds.map(playerName).join(' and ')} instantly!`;
    stage.appendChild(sub);
    stage.appendChild(taglineEl(result.tagline));
  }
}

function shotgunSVG() {
  return `<svg viewBox="0 0 100 40" width="90" height="36" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="14" width="65" height="9" rx="2" fill="#5a5a5a"/>
    <rect x="85" y="12" width="10" height="13" rx="1" fill="#2e2e2e"/>
    <path d="M 10 18 L 32 14 L 32 26 L 14 30 Z" fill="#6b4527"/>
    <rect x="26" y="22" width="8" height="12" rx="2" fill="#3a2712"/>
    <path d="M 27 30 Q 30 37 34 31" fill="none" stroke="#3a2712" stroke-width="2"/>
  </svg>`;
}
function muzzleFlashSVG() {
  return `<svg viewBox="0 0 60 60" width="46" height="46" xmlns="http://www.w3.org/2000/svg">
    <polygon points="30,0 36,22 58,22 40,34 46,58 30,44 14,58 20,34 2,22 24,22" fill="#fff6c0"/>
    <polygon points="30,10 34,24 48,24 36,32 40,48 30,38 20,48 24,32 12,24 26,24" fill="#ffd23f"/>
  </svg>`;
}

function renderLeaderboard(state) {
  const list = el('leaderboardList');
  list.innerHTML = '';
  const maxStrength = Math.max(1, ...state.leaderboard.map((p) => p.strength));
  state.leaderboard.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'lb-row' + (p.active ? '' : ' eliminated');
    const rank = document.createElement('div');
    rank.className = 'rank';
    rank.textContent = p.active ? `#${i + 1}` : '💀';
    row.appendChild(rank);
    row.appendChild(charAvatar(p.character, 56, p.active ? '' : 'eliminated'));
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = p.name;
    row.appendChild(name);
    const barWrap = document.createElement('div');
    barWrap.className = 'bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = `${Math.max(2, (p.strength / maxStrength) * 100)}%`;
    barWrap.appendChild(bar);
    row.appendChild(barWrap);
    const num = document.createElement('div');
    num.className = 'strength-num';
    num.textContent = p.strength;
    row.appendChild(num);
    list.appendChild(row);
  });

  // poison reveal toast
  if (state.poisonResult) {
    const key = state.poisonResult.targetId + state.round;
    if (key !== lastPoisonKey) {
      lastPoisonKey = key;
      const toast = document.createElement('div');
      toast.className = 'pill';
      toast.style.display = 'block';
      toast.style.textAlign = 'center';
      toast.style.marginTop = '0.8rem';
      toast.textContent = `☠️ A poisoned carcass claims a victim: ${state.poisonResult.targetName} lost 20 Strength!`;
      list.parentElement.appendChild(toast);
    }
  }
}

function renderEnd(state) {
  const result = state.endResult;
  if (!result) return;
  if (result.fallen) {
    endSection.innerHTML = `
      <div class="fallen-screen">
        <div style="font-size:5rem;">🦴</div>
        <h1>The pride has fallen.</h1>
        <p style="font-size:1.3rem;">There is no king. Only bones and regret.</p>
      </div>`;
    return;
  }
  const winners = result.winners;
  const isMulti = winners.length > 1;
  endSection.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'crown-screen';
  const crown = document.createElement('div');
  crown.className = 'crown-emoji';
  crown.textContent = '👑';
  container.appendChild(crown);

  const avatarsRow = document.createElement('div');
  avatarsRow.style.display = 'flex';
  avatarsRow.style.justifyContent = 'center';
  avatarsRow.style.gap = '2rem';
  avatarsRow.style.margin = '1rem 0';
  for (const w of winners) {
    avatarsRow.appendChild(charAvatar(w.character, isMulti ? 150 : 220, '', true));
  }
  container.appendChild(avatarsRow);

  const h1 = document.createElement('h1');
  if (isMulti) {
    const names = winners.map((w) => w.name).join(' & ');
    h1.textContent = `${names} have earned the throne — and the night in The Lion's Den!`;
  } else {
    const w = winners[0];
    h1.textContent = `${w.name} has earned the throne — and the night in The Lion's Den!`;
  }
  container.appendChild(h1);

  const sub = document.createElement('p');
  sub.style.color = 'var(--cream)';
  sub.style.fontSize = '1.4rem';
  sub.textContent = `Final Strength: ${winners[0].strength}`;
  container.appendChild(sub);

  endSection.appendChild(container);
}

el('startGameBtn').addEventListener('click', () => socket.emit('host:start-game'));
el('forceRevealBtn').addEventListener('click', () => socket.emit('host:reveal-bids'));
el('continueBtn').addEventListener('click', () => socket.emit('host:continue'));
