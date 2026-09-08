const socket = io();

const el = (id) => document.getElementById(id);
const lobbySection = el('lobbySection');
const gameSection = el('gameSection');
const endSection = el('endSection');

let latestState = null;
let lastEffectKey = null;
let lastPoisonKey = null;
let lastFightTapsA = 0;
let lastFightTapsB = 0;
let fightCountdownInterval = null;
let fightTimerInterval = null;
let lastFightKey = null;

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
    fight: 'FIGHT!',
    effect_reveal: 'Resolving…',
    leaderboard: 'Leaderboard',
  };
  el('phasePill').textContent = phaseLabels[state.phase] || '';

  const views = ['biddingView', 'revealView', 'fightView', 'effectView', 'leaderboardView'];
  views.forEach((v) => el(v).classList.add('hidden'));
  el('continueBar').classList.add('hidden');

  if (state.phase === 'bidding') {
    el('biddingView').classList.remove('hidden');
    renderBidding(state);
  } else if (state.phase === 'bid_reveal' || state.phase === 'target_select') {
    el('revealView').classList.remove('hidden');
    renderReveal(state);
  } else if (state.phase === 'fight') {
    el('fightView').classList.remove('hidden');
    renderFight(state);
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

let lastLionessRound = null;

function renderLionessCinematic(state) {
  const stage = el('lionessStage');
  const isNewReveal = lastLionessRound !== state.round;
  lastLionessRound = state.round;
  stage.innerHTML = `
    <div class="lioness-rays"></div>
    <div class="lioness-grass"></div>
    <div class="lioness-sparkles">${'<span></span>'.repeat(10)}</div>
    <div class="lioness-portrait ${isNewReveal ? 'lioness-entrance' : ''}">${characterSVG('lioness_hero', 210, { full: true })}</div>
    <div class="lioness-caption">👑 The Most Coveted Prize on the Savanna 👑</div>`;
}

let lastItemKey = null;

function renderBidding(state) {
  el('itemFlavor').textContent = state.currentItem ? state.currentItem.flavor : '';
  el('itemCard').classList.toggle('tren-glow', !!state.currentItem && state.currentItem.id === 'tren');

  const isLioness = !!state.currentItem && state.currentItem.id === 'loyal_lioness';
  el('itemCard').classList.toggle('lioness-mode', isLioness);
  el('itemIcon').classList.toggle('hidden', isLioness);
  el('lionessStage').classList.toggle('hidden', !isLioness);
  if (isLioness) {
    el('itemName').textContent = 'A Loyal Lioness';
    renderLionessCinematic(state);
  } else {
    el('itemName').textContent = state.currentItem ? state.currentItem.name : '';
    el('itemIcon').innerHTML = state.currentItem ? itemIconSVG(state.currentItem.id, 96) : '';
  }

  const itemKey = state.currentItem ? `${state.round}:${state.currentItem.id}` : null;
  if (itemKey && itemKey !== lastItemKey) {
    lastItemKey = itemKey;
    const card = el('itemCard');
    card.classList.remove('card-flip-in');
    const iconWrap = el('itemIcon');
    iconWrap.classList.remove('icon-spin-in');
    void card.offsetWidth;
    card.classList.add('card-flip-in');
    if (!isLioness) iconWrap.classList.add('icon-spin-in');
  }

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

const FIGHT_ITEM_NAMES = { hyena_pack: 'Hyena Pack', croc_ambush: 'Croc Ambush' };

function runFightCountdown() {
  if (fightCountdownInterval) clearInterval(fightCountdownInterval);
  let n = 3;
  const setText = (t) => { const node = document.getElementById('fightCountdownNum'); if (node) node.textContent = t; };
  setText(String(n));
  fightCountdownInterval = setInterval(() => {
    n -= 1;
    if (n > 0) setText(String(n));
    else if (n === 0) setText('FIGHT!');
    else { clearInterval(fightCountdownInterval); fightCountdownInterval = null; }
  }, 1000);
}

function renderFight(state) {
  const stage = el('fightStage');
  const f = state.fight;
  if (!f || !f.attacker || !f.defender) { stage.innerHTML = ''; return; }
  const a = f.attacker, b = f.defender;

  const fightKey = f.attacker.id + f.defender.id + state.round;
  if (fightKey !== lastFightKey) { lastFightKey = fightKey; lastFightTapsA = 0; lastFightTapsB = 0; }

  const tapsA = f.taps[a.id] || 0;
  const tapsB = f.taps[b.id] || 0;
  const hitA = tapsA > lastFightTapsA;
  const hitB = tapsB > lastFightTapsB;
  lastFightTapsA = tapsA;
  lastFightTapsB = tapsB;

  stage.innerHTML = '';
  stage.classList.toggle('fight-shake', f.stage === 'active' && (hitA || hitB));

  const title = document.createElement('h2');
  title.className = 'fight-title';
  title.textContent = FIGHT_ITEM_NAMES[f.itemId] || 'FIGHT';
  stage.appendChild(title);

  const arena = document.createElement('div');
  arena.className = 'fight-arena';

  const leftSide = document.createElement('div');
  leftSide.className = 'fight-fighter' + (hitA ? ' hit-flash' : '');
  leftSide.appendChild(charAvatar(a.character, 170, '', true));
  const leftName = document.createElement('div');
  leftName.className = 'fight-name';
  leftName.textContent = a.name;
  leftSide.appendChild(leftName);

  const vs = document.createElement('div');
  vs.className = 'fight-vs';
  vs.textContent = 'VS';

  const rightSide = document.createElement('div');
  rightSide.className = 'fight-fighter fight-fighter-right' + (hitB ? ' hit-flash' : '');
  const rightAvatarWrap = charAvatar(b.character, 170, '', true);
  rightAvatarWrap.classList.add('mirror');
  rightSide.appendChild(rightAvatarWrap);
  const rightName = document.createElement('div');
  rightName.className = 'fight-name';
  rightName.textContent = b.name;
  rightSide.appendChild(rightName);

  arena.appendChild(leftSide);
  arena.appendChild(vs);
  arena.appendChild(rightSide);
  stage.appendChild(arena);

  if (f.stage === 'countdown') {
    const cd = document.createElement('div');
    cd.className = 'fight-countdown';
    cd.id = 'fightCountdownNum';
    cd.textContent = '3';
    stage.appendChild(cd);
    runFightCountdown();
  } else if (f.stage === 'active') {
    const bonusA = Math.max(0, Math.floor((a.strength - b.strength) / 10));
    const bonusB = Math.max(0, Math.floor((b.strength - a.strength) / 10));
    const scoreA = tapsA + bonusA;
    const scoreB = tapsB + bonusB;
    const total = Math.max(1, scoreA + scoreB);
    const pctA = Math.round((scoreA / total) * 100);

    const barWrap = document.createElement('div');
    barWrap.className = 'fight-bar-wrap';
    const barA = document.createElement('div');
    barA.className = 'fight-bar-a';
    barA.style.width = pctA + '%';
    const barB = document.createElement('div');
    barB.className = 'fight-bar-b';
    barB.style.width = (100 - pctA) + '%';
    barWrap.appendChild(barA);
    barWrap.appendChild(barB);
    stage.appendChild(barWrap);

    const tapLabels = document.createElement('div');
    tapLabels.className = 'fight-tap-labels';
    tapLabels.innerHTML = `<span>${tapsA} taps${bonusA ? ` (+${bonusA} STR)` : ''}</span><span>${tapsB} taps${bonusB ? ` (+${bonusB} STR)` : ''}</span>`;
    stage.appendChild(tapLabels);

    const timer = document.createElement('div');
    timer.className = 'fight-timer';
    timer.id = 'fightTimerNum';
    timer.textContent = `${Math.max(0, (f.endsAt - Date.now()) / 1000).toFixed(1)}s`;
    stage.appendChild(timer);

    if (fightTimerInterval) clearInterval(fightTimerInterval);
    fightTimerInterval = setInterval(() => {
      const node = document.getElementById('fightTimerNum');
      if (!node) { clearInterval(fightTimerInterval); fightTimerInterval = null; return; }
      const rem = Math.max(0, (f.endsAt - Date.now()) / 1000);
      node.textContent = `${rem.toFixed(1)}s`;
      if (rem <= 0) { clearInterval(fightTimerInterval); fightTimerInterval = null; }
    }, 100);
  } else if (fightTimerInterval) {
    clearInterval(fightTimerInterval);
    fightTimerInterval = null;
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

  function mournersRow(excludeIds) {
    const remaining = state.players.filter((p) => p.active && !excludeIds.includes(p.id));
    if (remaining.length === 0) return null;
    const wrap = document.createElement('div');
    wrap.className = 'mourners-row';
    const caption = document.createElement('div');
    caption.className = 'mourners-caption';
    caption.textContent = 'The pride watches in silence...';
    wrap.appendChild(caption);
    const row = document.createElement('div');
    row.className = 'mourners-avatars';
    for (const p of remaining.slice(0, 6)) row.appendChild(charAvatar(p.character, 56));
    wrap.appendChild(row);
    return wrap;
  }

  function impactBurst() {
    const burst = document.createElement('div');
    burst.className = 'impact-lines';
    return burst;
  }

  if (result.fizzled) {
    stage.appendChild(charAvatar(winner.character, 130, '', true));
    const h = document.createElement('h2');
    h.textContent = `${winner.name} won the item, but there was no valid target left.`;
    stage.appendChild(h);
  } else if (result.type === 'strength' && result.itemId === 'loyal_lioness') {
    stage.classList.add('lioness-claim-stage');
    const row = document.createElement('div');
    row.className = 'lioness-claim-row' + (isNew ? ' lioness-claim-anim' : '');
    const heroWrap = document.createElement('div');
    heroWrap.innerHTML = characterSVG('lioness_hero', 170, { full: true });
    row.appendChild(heroWrap);
    row.appendChild(charAvatar(winner.character, 170, '', true));
    stage.appendChild(row);
    const h = document.createElement('h2');
    h.textContent = `${winner.name} wins her loyalty!`;
    stage.appendChild(h);
    const pop = document.createElement('div');
    pop.className = 'stat-pop gain';
    pop.textContent = `+${result.amount} Strength`;
    stage.appendChild(pop);
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
    const baboonMourn = mournersRow([winner.id]);
    if (baboonMourn) stage.appendChild(baboonMourn);
  } else if (result.type === 'fight_win') {
    const row = document.createElement('div');
    row.className = 'fight-result-row';
    row.appendChild(charAvatar(winner.character, 140, isNew ? 'pop' : '', true));
    row.appendChild(impactBurst());
    row.appendChild(charAvatar(playerChar(result.eliminatedId), 140, 'collapse-fall', true));
    stage.appendChild(row);
    const h = document.createElement('h2');
    h.textContent = `${winner.name} won the fight!`;
    stage.appendChild(h);
    const sub = document.createElement('p');
    sub.textContent = `${playerName(result.eliminatedId)} (${result.defenderTaps} taps) couldn't out-fight ${winner.name} (${result.attackerTaps} taps). Eliminated!`;
    stage.appendChild(sub);
    stage.appendChild(taglineEl(result.tagline));
    const mourn = mournersRow([winner.id, result.eliminatedId]);
    if (mourn) stage.appendChild(mourn);
  } else if (result.type === 'fight_loss') {
    const defender = state.players.find((p) => p.id === result.defenderId);
    const row = document.createElement('div');
    row.className = 'fight-result-row';
    row.appendChild(charAvatar(defender ? defender.character : null, 140, 'pop', true));
    row.appendChild(impactBurst());
    row.appendChild(charAvatar(winner.character, 140, 'stagger-hit', true));
    stage.appendChild(row);
    const h = document.createElement('h2');
    h.textContent = `${defender ? defender.name : 'The defender'} fought them off!`;
    stage.appendChild(h);
    const pop = document.createElement('div');
    pop.className = 'stat-pop loss';
    pop.textContent = `-${result.penalty} Strength`;
    stage.appendChild(pop);
    const sub = document.createElement('p');
    sub.textContent = `${winner.name} (${result.attackerTaps} taps) lost the fight to ${defender ? defender.name : '???'} (${result.defenderTaps} taps).`;
    stage.appendChild(sub);
  } else if (result.type === 'vultures_mark') {
    stage.appendChild(charAvatar(winner.character, 130, '', true));
    const h = document.createElement('h2');
    h.textContent = `${winner.name} marks ${playerName(result.targetId)} for the vultures...`;
    stage.appendChild(h);
    const sub = document.createElement('p');
    sub.textContent = `Next round, a third of their Strength vanishes. No warning.`;
    stage.appendChild(sub);
  } else if (result.type === 'locked_horns') {
    stage.appendChild(charAvatar(winner.character, 130, '', true));
    const h = document.createElement('h2');
    h.textContent = `${winner.name} locks horns with ${playerName(result.targetId)}!`;
    stage.appendChild(h);
    const pop = document.createElement('div');
    pop.className = 'stat-pop loss';
    pop.textContent = `-${result.amount} Strength`;
    stage.appendChild(pop);
    const sub = document.createElement('p');
    sub.textContent = `${playerName(result.targetId)} staggers back, weaker for it.`;
    stage.appendChild(sub);
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
    const trenMourn = mournersRow([winner.id, ...result.eliminatedIds]);
    if (trenMourn) stage.appendChild(trenMourn);
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

  const confetti = document.createElement('div');
  confetti.className = 'confetti-field';
  const confettiColors = ['#f5a623', '#ffd166', '#4caf7d', '#d9483a', '#fff6e3', '#e8752c'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = confettiColors[i % confettiColors.length];
    piece.style.animationDelay = `${(Math.random() * 0.6).toFixed(2)}s`;
    piece.style.animationDuration = `${(2.2 + Math.random() * 1.6).toFixed(2)}s`;
    piece.style.setProperty('--drift', `${(Math.random() * 80 - 40).toFixed(0)}px`);
    confetti.appendChild(piece);
  }
  container.appendChild(confetti);

  const content = document.createElement('div');
  content.className = 'crown-content';

  const crown = document.createElement('div');
  crown.className = 'crown-emoji';
  crown.textContent = '👑';
  content.appendChild(crown);

  const avatarsRow = document.createElement('div');
  avatarsRow.style.display = 'flex';
  avatarsRow.style.justifyContent = 'center';
  avatarsRow.style.gap = '2rem';
  avatarsRow.style.margin = '1rem 0';
  for (const w of winners) {
    avatarsRow.appendChild(charAvatar(w.character, isMulti ? 150 : 220, '', true));
  }
  content.appendChild(avatarsRow);

  const h1 = document.createElement('h1');
  if (isMulti) {
    const names = winners.map((w) => w.name).join(' & ');
    h1.textContent = `${names} have earned the throne — and the night in The Lion's Den!`;
  } else {
    const w = winners[0];
    h1.textContent = `${w.name} has earned the throne — and the night in The Lion's Den!`;
  }
  content.appendChild(h1);

  const sub = document.createElement('p');
  sub.style.color = 'var(--cream)';
  sub.style.fontSize = '1.4rem';
  sub.textContent = `Final Strength: ${winners[0].strength}`;
  content.appendChild(sub);
  container.appendChild(content);

  endSection.appendChild(container);
}

el('startGameBtn').addEventListener('click', () => socket.emit('host:start-game'));
el('forceRevealBtn').addEventListener('click', () => socket.emit('host:reveal-bids'));
el('continueBtn').addEventListener('click', () => socket.emit('host:continue'));
