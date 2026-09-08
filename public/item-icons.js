// Flat cartoon icons for the item pool, one per item id, all drawn to the
// same visual complexity so the trap item ("The Red-Butt Baboon") never
// stands out from the rest before it's revealed.
let itemUidCounter = 0;
function itemUid(prefix) {
  itemUidCounter += 1;
  return `${prefix}${itemUidCounter}`;
}

function badge(bg1, bg2, inner) {
  const gradId = itemUid('ibg');
  return `<defs>
      <radialGradient id="${gradId}" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#${gradId})" stroke="#5a3115" stroke-width="3"/>
    ${inner}`;
}

const ITEM_BUILDERS = {
  fresh_kill() {
    const inner = `
      <g transform="translate(50 54) rotate(-18)">
        <rect x="-20" y="-6" width="40" height="12" rx="6" fill="#fdf6e3"/>
        <circle cx="-20" cy="-7" r="7" fill="#fdf6e3"/><circle cx="-20" cy="7" r="7" fill="#fdf6e3"/>
        <circle cx="20" cy="-7" r="7" fill="#fdf6e3"/><circle cx="20" cy="7" r="7" fill="#fdf6e3"/>
      </g>
      <path d="M 66 30 Q 70 38 65 44 Q 72 42 72 34 Z" fill="#c0392b"/>
      <path d="M 30 68 Q 26 74 30 80 Q 22 78 22 70 Z" fill="#c0392b"/>`;
    return badge('#ffd98a', '#e8a33d', inner);
  },
  watering_hole() {
    const inner = `
      <ellipse cx="50" cy="62" rx="34" ry="16" fill="#4fa3d1"/>
      <ellipse cx="50" cy="58" rx="34" ry="14" fill="#6bc3ec"/>
      <path d="M 26 58 Q 50 68 74 58" stroke="#eaf7ff" stroke-width="2.5" fill="none" opacity="0.7"/>
      <path d="M 30 50 Q 50 58 70 50" stroke="#eaf7ff" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M 28 44 Q 30 30 26 22" stroke="#3f8f4a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M 72 46 Q 71 32 76 24" stroke="#3f8f4a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    return badge('#bfe9ff', '#7fc8ec', inner);
  },
  aura() {
    const inner = `
      <circle cx="50" cy="52" r="22" fill="#fff3c4" opacity="0.55"/>
      <circle cx="50" cy="52" r="15" fill="#ffe9a8" opacity="0.85"/>
      <circle cx="50" cy="52" r="8" fill="#fff6de"/>
      <g fill="#b06fd6">
        <path d="M50 16 l3 9 -3 9 -3-9 Z"/>
        <path d="M50 88 l3-9 -3-9 -3 9 Z"/>
        <path d="M16 52 l9-3 9 3 -9 3 Z"/>
        <path d="M88 52 l-9 3 -9-3 9-3 Z"/>
        <path d="M27 27 l8 3 3 8 -8-3 Z"/>
        <path d="M73 77 l-8-3 -3-8 8 3 Z"/>
        <path d="M73 27 l-3 8 -8 3 3-8 Z"/>
        <path d="M27 77 l3-8 8-3 -3 8 Z"/>
      </g>`;
    return badge('#f6d6ff', '#c48ce0', inner);
  },
  prime_territory() {
    const inner = `
      <circle cx="74" cy="26" r="10" fill="#ffe07a"/>
      <path d="M 8 72 Q 30 40 50 62 Q 70 40 92 70 L 92 88 L 8 88 Z" fill="#4a8f3c"/>
      <path d="M 8 78 Q 34 56 50 72 Q 68 54 92 76 L 92 88 L 8 88 Z" fill="#5da84c"/>
      <g stroke="#356b2a" stroke-width="2" stroke-linecap="round">
        <path d="M 24 88 L 22 78"/><path d="M 30 88 L 32 76"/><path d="M 66 88 L 64 78"/><path d="M 74 88 L 76 77"/>
      </g>`;
    return badge('#bfe8c8', '#7fc98f', inner);
  },
  loyal_lioness() {
    const inner = `
      <ellipse cx="46" cy="70" rx="26" ry="12" fill="#c9852f"/>
      <circle cx="68" cy="52" r="17" fill="#e0a352"/>
      <circle cx="79" cy="44" r="5.5" fill="#e0a352"/>
      <path d="M 84 62 Q 96 66 94 76 Q 88 72 84 70 Z" fill="#c9852f"/>
      <circle cx="73" cy="50" r="1.8" fill="#3a2010"/>
      <path d="M 66 58 Q 69 61 72 58" stroke="#3a2010" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    return badge('#ffe3b0', '#e8a33d', inner);
  },
  croc_ambush() {
    const inner = `
      <ellipse cx="50" cy="70" rx="34" ry="12" fill="#3f8fc9" opacity="0.5"/>
      <path d="M 12 58 Q 20 46 40 48 L 46 40 L 50 48 L 56 40 L 60 48 Q 84 46 88 60
        Q 70 66 60 60 L 30 60 Q 18 64 12 58 Z" fill="#3f7a3f"/>
      <path d="M 40 48 L 46 40 L 50 48 L 56 40 L 60 48" fill="none" stroke="#fdf6e3" stroke-width="1.4"/>
      <circle cx="30" cy="52" r="2.4" fill="#ffd23f"/>
      <circle cx="30" cy="52" r="1.1" fill="#241305"/>
      <path d="M 12 58 Q 8 66 16 70" stroke="#3f7a3f" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    return badge('#bfe0f0', '#3f7a9c', inner);
  },
  vultures_mark() {
    const inner = `
      <g fill="#3a2f2a">
        <ellipse cx="38" cy="34" rx="12" ry="7" transform="rotate(-20 38 34)"/>
        <ellipse cx="62" cy="34" rx="12" ry="7" transform="rotate(20 62 34)"/>
        <circle cx="50" cy="38" r="9"/>
      </g>
      <path d="M 44 36 L 50 44 L 56 36" fill="#d6a020"/>
      <circle cx="46" cy="35" r="1.6" fill="#fff"/><circle cx="54" cy="35" r="1.6" fill="#fff"/>
      <circle cx="50" cy="70" r="16" fill="none" stroke="#c0392b" stroke-width="3" stroke-dasharray="5 4"/>
      <path d="M 50 62 L 50 78 M 42 70 L 58 70" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>`;
    return badge('#cfc3b0', '#7a6a5a', inner);
  },
  locked_horns() {
    const inner = `
      <path d="M 22 66 Q 4 54 10 30 Q 16 20 24 24 Q 18 34 22 46 Q 30 44 36 50" fill="#3a2712" stroke="#1f1409" stroke-width="1.5"/>
      <path d="M 78 66 Q 96 54 90 30 Q 84 20 76 24 Q 82 34 78 46 Q 70 44 64 50" fill="#5a3f22" stroke="#1f1409" stroke-width="1.5"/>
      <circle cx="37" cy="60" r="17" fill="#c9a45a"/>
      <circle cx="63" cy="60" r="17" fill="#a9835a"/>
      <path d="M 45 55 L 58 65 M 58 55 L 45 65" stroke="#fdf6e3" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M 27 82 L 16 92 M 73 82 L 84 92" stroke="#5a3f1f" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`;
    return badge('#e8d0a0', '#a9835a', inner);
  },
  sharpened_claw() {
    const inner = `
      <g stroke="#fdf6e3" stroke-width="6" stroke-linecap="round">
        <path d="M 24 24 L 46 76" opacity="0.95"/>
        <path d="M 42 20 L 64 80" opacity="0.95"/>
        <path d="M 60 26 L 82 72" opacity="0.95"/>
      </g>
      <g stroke="#c0392b" stroke-width="2" stroke-linecap="round" opacity="0.6">
        <path d="M 24 24 L 46 76"/><path d="M 42 20 L 64 80"/><path d="M 60 26 L 82 72"/>
      </g>`;
    return badge('#f3a6a1', '#c0392b', inner);
  },
  poisoned_carcass() {
    const inner = `
      <path d="M 26 58 Q 50 40 74 58 L 68 78 Q 50 68 32 78 Z" fill="#eef2e0"/>
      <circle cx="42" cy="56" r="9" fill="#6fae4f"/>
      <circle cx="58" cy="56" r="9" fill="#6fae4f"/>
      <circle cx="38" cy="54" r="2.4" fill="#243617"/><circle cx="46" cy="54" r="2.4" fill="#243617"/>
      <circle cx="54" cy="54" r="2.4" fill="#243617"/><circle cx="62" cy="54" r="2.4" fill="#243617"/>
      <path d="M 44 62 L 48 66 L 52 62 L 56 66" stroke="#243617" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 50 78 Q 46 86 50 92 Q 54 86 50 78 Z" fill="#6fae4f"/>`;
    return badge('#d7e8bf', '#8bb56a', inner);
  },
  hyena_pack() {
    function hyenaHead(cx, cy, scale, flip) {
      const f = flip ? -1 : 1;
      return `<g transform="translate(${cx} ${cy}) scale(${f * scale} ${scale})">
        <path d="M -14 8 Q -16 -6 -6 -12 L -8 -20 L -1 -13 Q 6 -14 12 -6 Q 16 2 10 10 Q 12 16 6 18
          Q 8 22 2 22 Q -2 26 -8 20 Q -16 20 -14 8 Z" fill="#8a6f45"/>
        <path d="M 4 10 Q 10 13 13 9" fill="none" stroke="#2a1c0d" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="1" cy="-2" r="1.6" fill="#c0392b"/>
        <path d="M -2 12 L 8 12 L 5 17 L 1 17 Z" fill="#fdf6e3"/>
      </g>`;
    }
    const inner = `
      <ellipse cx="50" cy="80" rx="38" ry="8" fill="#3a2f1f" opacity="0.35"/>
      ${hyenaHead(28, 60, 1.15, true)}
      ${hyenaHead(52, 48, 1.4, false)}
      ${hyenaHead(76, 62, 1.1, false)}`;
    return badge('#e8d8ae', '#b89b62', inner);
  },
  tren() {
    const inner = `
      <g transform="translate(50 50) rotate(30)">
        <rect x="-8" y="-26" width="16" height="34" rx="3" fill="#eaf7ff"/>
        <rect x="-8" y="-30" width="16" height="6" rx="2" fill="#8fb9c9"/>
        <rect x="-5" y="-12" width="10" height="16" fill="#7fd0e0"/>
      </g>
      <path d="M 62 20 L 50 44 L 60 44 L 46 72 L 66 42 L 55 42 Z" fill="#ffd23f" stroke="#c99a1a" stroke-width="1.5"/>`;
    return badge('#ffe2a8', '#e8752c', inner);
  },
  red_butt_baboon() {
    return badge('#d8c3a3', '#8a7a6a', baboonCreatureMarkup(50, 58, 0.62));
  },
  great_migration() {
    const inner = `
      <path d="M 8 70 Q 30 46 50 62 Q 70 46 92 68 L 92 88 L 8 88 Z" fill="#6b8f3c"/>
      <path d="M 8 78 Q 34 60 50 72 Q 68 58 92 76 L 92 88 L 8 88 Z" fill="#7fa84c"/>
      <g fill="#8a6a3a">
        <ellipse cx="34" cy="52" rx="9" ry="6"/><ellipse cx="34" cy="52" rx="9" ry="6" transform="translate(0,-8)"/>
        <path d="M 30 46 L 27 36 M 38 46 L 41 36" stroke="#8a6a3a" stroke-width="2" stroke-linecap="round"/>
      </g>
      <g fill="#a9835a">
        <ellipse cx="62" cy="46" rx="8" ry="5.5"/><ellipse cx="62" cy="46" rx="8" ry="5.5" transform="translate(0,-7)"/>
        <path d="M 58 41 L 56 32 M 66 41 L 68 32" stroke="#a9835a" stroke-width="1.8" stroke-linecap="round"/>
      </g>`;
    return badge('#cfe6b0', '#8fb56a', inner);
  },
  thorn_bush_ambush() {
    const inner = `
      <ellipse cx="50" cy="66" rx="30" ry="16" fill="#4a6b2a"/>
      <g stroke="#2f4a1a" stroke-width="2.4" stroke-linecap="round">
        <path d="M 26 60 L 18 46"/><path d="M 34 52 L 30 36"/><path d="M 46 48 L 46 30"/>
        <path d="M 58 48 L 62 30"/><path d="M 68 54 L 78 40"/><path d="M 74 62 L 86 52"/>
      </g>
      <g fill="#241305">
        <ellipse cx="42" cy="62" rx="4" ry="5"/><ellipse cx="58" cy="62" rx="4" ry="5"/>
      </g>
      <g fill="#d64545">
        <circle cx="42" cy="62" r="1.6"/><circle cx="58" cy="62" r="1.6"/>
      </g>`;
    return badge('#d9e8c4', '#7a9a52', inner);
  },
};

function baboonCreatureMarkup(cx, cy, scale) {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">
    <ellipse cx="10" cy="18" rx="9" ry="5" fill="#1c1c22" opacity="0.5"/>
    <path d="M 30 -6 Q 35 -22 12 -22 L -34 -18 Q -46 -14 -46 0 Q -46 16 -30 18 L 22 16 Q 34 12 30 -6 Z" fill="#33333b"/>
    <path d="M -46 0 Q -46 -12 -36 -16 L -30 -14 Q -40 -8 -38 4 Z" fill="#26262d" opacity="0.7"/>
    <ellipse cx="22" cy="6" rx="11" ry="10" fill="#d64545"/>
    <ellipse cx="22" cy="3" rx="8" ry="6.5" fill="#e8635a"/>
    <path d="M 46 -6 Q 62 -14 66 -30 Q 58 -20 50 -14" fill="none" stroke="#26262d" stroke-width="5" stroke-linecap="round"/>
    <g stroke="#26262d" stroke-width="7" stroke-linecap="round">
      <path d="M -22 14 L -25 34"/><path d="M -10 15 L -13 34"/>
      <path d="M 8 15 L 6 34"/><path d="M 18 13 L 17 32"/>
    </g>
    <g fill="#c9a67e">
      <ellipse cx="-26" cy="35" rx="4.5" ry="2.6"/><ellipse cx="-14" cy="35" rx="4.5" ry="2.6"/>
      <ellipse cx="5" cy="35" rx="4.5" ry="2.6"/><ellipse cx="16" cy="33" rx="4.5" ry="2.6"/>
    </g>
    <circle cx="-40" cy="-6" r="6" fill="#2c2c33"/>
    <ellipse cx="-52" cy="1" rx="9" ry="7" fill="#8a95a8"/>
    <path d="M -50 -3 Q -46 -1 -46 3" fill="none" stroke="#3a6fa8" stroke-width="3" stroke-linecap="round"/>
    <path d="M -56 -3 Q -60 -1 -60 3" fill="none" stroke="#3a6fa8" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="-53" cy="5" rx="3.4" ry="2.4" fill="#d64545"/>
    <circle cx="-42" cy="-9" r="1.6" fill="#0a0a0d"/>
  </g>`;
}

function baboonStandaloneSVG(size = 160) {
  return `<svg viewBox="0 0 140 100" width="${size}" height="${Math.round(size * 100 / 140)}" xmlns="http://www.w3.org/2000/svg">${baboonCreatureMarkup(78, 55, 1.35)}</svg>`;
}

function itemIconSVG(itemId, size = 90) {
  const build = ITEM_BUILDERS[itemId];
  if (!build) return '';
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${build()}</svg>`;
}
