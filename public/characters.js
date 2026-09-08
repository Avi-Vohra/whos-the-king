// Full-body flat-shaded lion illustrations, shared by host and player screens.
// Coordinate space for every character: viewBox "0 0 160 220".
// Head is always centered at HEAD_CX/HEAD_CY so small "avatar" contexts can
// crop to just the head via a smaller viewBox over the same drawing.
const HEAD_CX = 80;
const HEAD_CY = 60;

const CHARACTERS = [
  { id: 'chopped',  name: 'Chopped Lion',  gender: 'male',   tagline: 'Scruffy. Rough. Unbothered.' },
  { id: 'chud',     name: 'Chud Lion',     gender: 'male',   tagline: 'Goofy. Doofy. Dangerous?' },
  { id: 'chud-jr',  name: 'Chud Jr. Lion', gender: 'male',   tagline: 'Smol doofus in training.' },
  { id: 'zesty',    name: 'Zesty Lion',    gender: 'male',   tagline: 'Flashy mane, flashier attitude.' },
  { id: 'diva',     name: 'Diva Lion',     gender: 'female', tagline: 'Glossy mane, dramatic pose.' },
  { id: 'tiny',     name: 'Tiny Terror',   gender: 'male',   tagline: 'Small body, big menace.' },
  { id: 'bald',     name: 'Bald Lion',     gender: 'male',   tagline: 'No mane. All confidence.' },
  { id: 'cute',     name: 'Cute Lion',     gender: 'female', tagline: 'Big eyes. Small terror.' },
  { id: 'lady',     name: 'Lady Lion',     gender: 'female', tagline: 'Elegant. Stylish. Deadly.' },
  { id: 'avi',      name: 'Avi',           gender: 'male',   tagline: 'Jacked. Handsome. Menace.' },
];

const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

let charUidCounter = 0;
function uid(prefix) {
  charUidCounter += 1;
  return `${prefix}${charUidCounter}`;
}

function furGrad(light, dark, cx = '32%', cy = '26%') {
  const id = uid('fg');
  return { id, defs: `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="80%"><stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/></radialGradient>` };
}
function sheenGrad(c1, c2, x1 = '0%', y1 = '0%', x2 = '100%', y2 = '100%') {
  const id = uid('sh');
  return { id, defs: `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient>` };
}

// ---------- anatomy primitives ----------

function leg(hipX, hipY, footY, width, color, shadeColor, footColor) {
  const w2 = width / 2;
  return `<path d="M ${hipX - w2} ${hipY} L ${hipX - w2 * 0.8} ${footY - 6} Q ${hipX - w2 - 1} ${footY} ${hipX} ${footY}
      Q ${hipX + w2 + 1} ${footY} ${hipX + w2 * 0.8} ${footY - 6} L ${hipX + w2} ${hipY} Z" fill="${color}"/>
    <path d="M ${hipX - w2} ${hipY} L ${hipX - w2 * 0.6} ${hipY + (footY - hipY) * 0.5} L ${hipX} ${hipY + 2} Z" fill="${shadeColor}" opacity="0.35"/>
    <ellipse cx="${hipX}" cy="${footY}" rx="${w2 + 1.5}" ry="4.5" fill="${footColor || color}"/>`;
}

function arm(shoulderX, shoulderY, handX, handY, width, color, shadeColor) {
  return `<path d="M ${shoulderX} ${shoulderY} Q ${(shoulderX + handX) / 2 + width * 0.5} ${(shoulderY + handY) / 2} ${handX} ${handY}"
      stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round"/>
    <path d="M ${shoulderX} ${shoulderY} Q ${(shoulderX + handX) / 2 + width * 0.5} ${(shoulderY + handY) / 2} ${handX} ${handY}"
      stroke="${shadeColor}" stroke-width="${width * 0.4}" fill="none" stroke-linecap="round" opacity="0.3"/>
    <circle cx="${handX}" cy="${handY}" r="${width * 0.62}" fill="${color}"/>`;
}

function tail(hipX, hipY, color, tuftColor, dir = 1) {
  const x1 = hipX + dir * 14, y1 = hipY + 10;
  const x2 = hipX + dir * 30, y2 = hipY - 6;
  const x3 = hipX + dir * 20, y3 = hipY - 30;
  return `<path d="M ${hipX} ${hipY} Q ${x1} ${y1} ${x2} ${y2} Q ${x2 + dir * 6} ${y2 - 14} ${x3} ${y3}"
      stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="${x3}" cy="${y3}" r="7" fill="${tuftColor}"/>`;
}

function earPair(cx, cy, r, outer, inner) {
  return `
    <circle cx="${(cx - r * 0.82).toFixed(1)}" cy="${(cy - r * 0.72).toFixed(1)}" r="${(r * 0.34).toFixed(1)}" fill="${outer}"/>
    <circle cx="${(cx - r * 0.82).toFixed(1)}" cy="${(cy - r * 0.72).toFixed(1)}" r="${(r * 0.17).toFixed(1)}" fill="${inner}"/>
    <circle cx="${(cx + r * 0.82).toFixed(1)}" cy="${(cy - r * 0.72).toFixed(1)}" r="${(r * 0.34).toFixed(1)}" fill="${outer}"/>
    <circle cx="${(cx + r * 0.82).toFixed(1)}" cy="${(cy - r * 0.72).toFixed(1)}" r="${(r * 0.17).toFixed(1)}" fill="${inner}"/>`;
}
function muzzle(cx, cy, r, color) {
  return `<ellipse cx="${cx}" cy="${(cy + r * 0.38).toFixed(1)}" rx="${(r * 0.58).toFixed(1)}" ry="${(r * 0.42).toFixed(1)}" fill="${color}"/>`;
}
function nose(cx, cy, color) {
  return `<path d="M ${cx - 4} ${cy} Q ${cx} ${cy + 4} ${cx + 4} ${cy} Q ${cx} ${cy + 2.5} ${cx - 4} ${cy} Z" fill="${color}"/>`;
}
function headBase(fill, cx, cy, r, earOuter, earInner, muzzleColor) {
  return `${earPair(cx, cy, r, earOuter, earInner)}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>
    ${muzzleColor ? muzzle(cx, cy, r, muzzleColor) : ''}`;
}

function maneRing(cx, cy, r, bumpR, count, colors) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${bumpR}" fill="${colors[i % colors.length]}"/>`;
  }
  return out;
}
function jaggedMane(cx, cy, rInner, rOuter, count, color, jitterSeed = 0) {
  const points = [];
  for (let i = 0; i < count * 2; i++) {
    const angle = (Math.PI * 2 * i) / (count * 2);
    const jitter = jitterSeed ? Math.sin(i * 7 + jitterSeed) * 3 : 0;
    const r = (i % 2 === 0 ? rOuter : rInner) + jitter;
    points.push(`${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`);
  }
  return `<polygon points="${points.join(' ')}" fill="${color}"/>`;
}

const BROW = {
  flat: (cx, cy, spread = 12) => `
    <path d="M ${cx - spread - 2} ${cy - 10} L ${cx - 2} ${cy - 9}" stroke="#241305" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M ${cx + 2} ${cy - 9} L ${cx + spread + 2} ${cy - 10}" stroke="#241305" stroke-width="2.6" stroke-linecap="round"/>`,
  angry: (cx, cy) => `
    <path d="M ${cx - 16} ${cy - 6} L ${cx - 3} ${cy - 1}" stroke="#241305" stroke-width="3" stroke-linecap="round"/>
    <path d="M ${cx + 16} ${cy - 6} L ${cx + 3} ${cy - 1}" stroke="#241305" stroke-width="3" stroke-linecap="round"/>`,
  raisedOne: (cx, cy) => `
    <path d="M ${cx - 16} ${cy - 8} Q ${cx - 8} ${cy - 15} ${cx - 1} ${cy - 9}" stroke="#241305" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M ${cx + 2} ${cy - 8} L ${cx + 15} ${cy - 6}" stroke="#241305" stroke-width="2.6" stroke-linecap="round"/>`,
  arched: (cx, cy, color = '#241305') => `
    <path d="M ${cx - 17} ${cy - 13} Q ${cx - 10} ${cy - 19} ${cx - 3} ${cy - 14}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M ${cx + 3} ${cy - 14} Q ${cx + 10} ${cy - 19} ${cx + 17} ${cy - 13}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  crooked: (cx, cy) => `
    <path d="M ${cx - 17} ${cy - 12} L ${cx - 3} ${cy - 6}" stroke="#241305" stroke-width="3" stroke-linecap="round"/>
    <path d="M ${cx + 2} ${cy - 4} L ${cx + 14} ${cy - 9}" stroke="#241305" stroke-width="3" stroke-linecap="round"/>`,
};

function oneSultryEye(ex, ey, dir, iris) {
  return `
    <ellipse cx="${ex}" cy="${ey}" rx="7.4" ry="5" fill="#fff8f0"/>
    <circle cx="${ex}" cy="${(ey + 0.4).toFixed(1)}" r="3.9" fill="${iris}"/>
    <circle cx="${ex}" cy="${(ey + 0.4).toFixed(1)}" r="1.7" fill="#1a0d05"/>
    <circle cx="${(ex - dir * 1.6).toFixed(1)}" cy="${(ey - 1.3).toFixed(1)}" r="1" fill="#fff"/>
    <path d="M ${(ex - dir * 7.6).toFixed(1)} ${(ey - 1.6).toFixed(1)} Q ${ex} ${(ey - 6.4).toFixed(1)} ${(ex + dir * 7.6).toFixed(1)} ${(ey - 1.6).toFixed(1)}"
      stroke="#241305" stroke-width="1.9" fill="none" stroke-linecap="round"/>
    <path d="M ${(ex - dir * 7.2).toFixed(1)} ${(ey + 2.6).toFixed(1)} Q ${ex} ${(ey + 4.8).toFixed(1)} ${(ex + dir * 7.2).toFixed(1)} ${(ey + 2.3).toFixed(1)}"
      stroke="#241305" stroke-width="0.9" fill="none" opacity="0.45"/>
    <g stroke="#241305" stroke-width="1.3" stroke-linecap="round">
      <path d="M ${(ex + dir * 7.2).toFixed(1)} ${(ey - 2).toFixed(1)} L ${(ex + dir * 10.4).toFixed(1)} ${(ey - 4.6).toFixed(1)}"/>
      <path d="M ${(ex + dir * 3.6).toFixed(1)} ${(ey - 5.8).toFixed(1)} L ${(ex + dir * 4.6).toFixed(1)} ${(ey - 8.6).toFixed(1)}"/>
      <path d="M ${(ex - dir * 0.8).toFixed(1)} ${(ey - 6.4).toFixed(1)} L ${(ex - dir * 0.4).toFixed(1)} ${(ey - 9.4).toFixed(1)}"/>
    </g>`;
}

const EYE = {
  normal: (cx, cy) => `<circle cx="${cx - 8}" cy="${cy}" r="3.2" fill="#241305"/><circle cx="${cx + 8}" cy="${cy}" r="3.2" fill="#241305"/>
    <circle cx="${cx - 6.6}" cy="${cy - 1.2}" r="0.9" fill="#fff"/><circle cx="${cx + 9.4}" cy="${cy - 1.2}" r="0.9" fill="#fff"/>`,
  derp: (cx, cy) => `<circle cx="${cx - 9}" cy="${cy}" r="5.6" fill="#fff"/><circle cx="${cx - 7}" cy="${cy + 1.5}" r="2.9" fill="#241305"/>
    <circle cx="${cx + 8}" cy="${cy - 2}" r="3.9" fill="#fff"/><circle cx="${cx + 9}" cy="${cy - 2}" r="2" fill="#241305"/>`,
  angry: (cx, cy) => `<circle cx="${cx - 8}" cy="${cy}" r="3" fill="#241305"/><circle cx="${cx + 8}" cy="${cy}" r="3" fill="#241305"/>`,
  smirk: (cx, cy) => `<path d="M ${cx - 12} ${cy} Q ${cx - 8} ${cy - 4} ${cx - 4} ${cy}" stroke="#241305" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M ${cx + 4} ${cy} Q ${cx + 8} ${cy - 4} ${cx + 12} ${cy}" stroke="#241305" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  big: (cx, cy) => `<circle cx="${cx - 10}" cy="${cy}" r="7.5" fill="#fff"/><circle cx="${cx - 9}" cy="${cy + 1}" r="4.3" fill="#241305"/><circle cx="${cx - 7.2}" cy="${cy - 1.2}" r="1.5" fill="#fff"/>
    <circle cx="${cx + 10}" cy="${cy}" r="7.5" fill="#fff"/><circle cx="${cx + 11}" cy="${cy + 1}" r="4.3" fill="#241305"/><circle cx="${cx + 12.8}" cy="${cy - 1.2}" r="1.5" fill="#fff"/>`,
  sultry: (cx, cy, iris = '#6b4426') => oneSultryEye(cx - 11, cy, -1, iris) + oneSultryEye(cx + 11, cy, 1, iris),
  confident: (cx, cy) => `<path d="M ${cx - 12} ${cy - 1} L ${cx - 4} ${cy - 1}" stroke="#241305" stroke-width="3" stroke-linecap="round"/>
    <path d="M ${cx + 4} ${cy - 1} L ${cx + 12} ${cy - 1}" stroke="#241305" stroke-width="3" stroke-linecap="round"/>`,
  asymmetric: (cx, cy) => `<circle cx="${cx - 9}" cy="${cy - 3}" r="3.4" fill="#241305"/><circle cx="${cx + 8}" cy="${cy + 3}" r="2.4" fill="#241305"/>
    <path d="M ${cx + 3} ${cy + 3} L ${cx + 13} ${cy + 3}" stroke="#241305" stroke-width="1.6" opacity="0.5"/>`,
};

const MOUTH = {
  smile: (cx, cy) => `<path d="M ${cx - 8} ${cy} Q ${cx} ${cy + 7} ${cx + 8} ${cy}" stroke="#241305" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  tongue: (cx, cy) => `<path d="M ${cx - 9} ${cy} Q ${cx} ${cy + 9} ${cx + 9} ${cy}" stroke="#241305" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="${cx}" cy="${cy + 7}" rx="4.5" ry="5" fill="#e0607a"/>`,
  wideTongueOpen: (cx, cy) => `<path d="M ${cx - 13} ${cy - 4} Q ${cx} ${cy + 16} ${cx + 13} ${cy - 4} Z" fill="#5a2712"/>
    <ellipse cx="${cx}" cy="${cy + 8}" rx="6.5" ry="6.5" fill="#e0607a"/>
    <path d="M ${cx - 13} ${cy - 4} Q ${cx} ${cy + 2} ${cx + 13} ${cy - 4}" fill="#fdf6e3"/>`,
  zigzag: (cx, cy) => `<path d="M ${cx - 9} ${cy} l 4 5 l 4 -5 l 4 5 l 4 -5" stroke="#241305" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  smirk: (cx, cy) => `<path d="M ${cx - 9} ${cy - 1} Q ${cx + 2} ${cy + 6} ${cx + 10} ${cy - 3}" stroke="#241305" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  tiny: (cx, cy) => `<circle cx="${cx}" cy="${cy + 2}" r="2.4" fill="#241305"/>`,
  lips: (cx, cy, color = '#c23e63') => `
    <path d="M ${cx - 6.5} ${cy - 0.6} Q ${cx - 2.4} ${cy - 2.4} ${cx} ${cy - 0.8} Q ${cx + 2.4} ${cy - 2.4} ${cx + 6.5} ${cy - 0.6}
      Q ${cx + 4} ${cy + 4.4} ${cx} ${cy + 4.6} Q ${cx - 4} ${cy + 4.4} ${cx - 6.5} ${cy - 0.6} Z" fill="${color}"/>
    <ellipse cx="${cx - 1.8}" cy="${cy + 1.4}" rx="1.3" ry="0.8" fill="#fff" opacity="0.55"/>`,
  grin: (cx, cy) => `<path d="M ${cx - 10} ${cy - 1} Q ${cx} ${cy + 8} ${cx + 10} ${cy - 1} Z" fill="#241305"/>
    <path d="M ${cx - 8} ${cy + 1} Q ${cx} ${cy + 4} ${cx + 8} ${cy + 1}" fill="#fff"/>`,
  crookedGap: (cx, cy) => `<path d="M ${cx - 10} ${cy - 2} Q ${cx - 1} ${cy + 7} ${cx + 9} ${cy - 4}" stroke="#241305" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M ${cx - 6} ${cy + 1} L ${cx - 3} ${cy + 4} L ${cx - 1} ${cy + 1}" fill="#fdf6e3"/>
    <path d="M ${cx + 3} ${cy - 1} L ${cx + 6} ${cy + 2}" stroke="#fdf6e3" stroke-width="2"/>`,
};

// ---------- shared body builders ----------

function standardLegs(cx, hipY, footY, spread, width, color, shade) {
  return leg(cx - spread, hipY, footY, width, color, shade) + leg(cx + spread, hipY, footY, width, color, shade);
}

function bustShoulders(cx, cy, r, color1, color2) {
  return `<path d="M ${cx - r * 1.15} ${cy + r * 0.55} Q ${cx} ${cy + r * 0.15} ${cx + r * 1.15} ${cy + r * 0.55}
    L ${cx + r * 1.35} ${cy + r * 1.7} L ${cx - r * 1.35} ${cy + r * 1.7} Z" fill="${color1}"/>
    <path d="M ${cx - r * 1.15} ${cy + r * 0.55} Q ${cx} ${cy + r * 0.15} ${cx + r * 1.15} ${cy + r * 0.55}
    L ${cx + r * 1.15} ${cy + r * 0.95} Q ${cx} ${cy + r * 0.55} ${cx - r * 1.15} ${cy + r * 0.95} Z" fill="${color2}" opacity="0.55"/>`;
}

// ================= character builders =================
// Each returns SVG markup drawn into the shared 160x220 canvas.

function buildAvi() {
  const g = furGrad('#e2984a', '#c9762a');
  const skinGrad = furGrad('#eeb060', '#b8721f', '32%', '15%');
  const mane = `<circle cx="${HEAD_CX}" cy="${HEAD_CY - 2}" r="40" fill="#7a3f14"/>` + maneRing(HEAD_CX, HEAD_CY - 2, 40, 7.4, 18, ['#8f4b18', '#a85c1f']);

  // Torso: wide heavy chest tapering hard to a narrow waist (classic V-taper).
  const torso = `
    <path d="M 26 104 Q 80 90 134 104 L 122 168 Q 80 180 38 168 Z" fill="url(#${skinGrad.id})"/>
    <path d="M 26 104 Q 80 90 134 104 L 128 118 Q 80 100 32 118 Z" fill="#fff0d5" opacity="0.4"/>
    <path d="M 48 112 Q 80 126 112 112 L 104 138 Q 80 148 56 138 Z" fill="#00000028"/>
    <path d="M 80 140 L 80 168" stroke="#00000038" stroke-width="3"/>
    <path d="M 62 142 Q 80 149 98 142" stroke="#00000030" stroke-width="2.6" fill="none"/>
    <path d="M 63 153 Q 80 160 97 153" stroke="#00000030" stroke-width="2.6" fill="none"/>
    <path d="M 65 164 Q 80 170 95 164" stroke="#00000030" stroke-width="2.6" fill="none"/>
    <path d="M 32 118 Q 26 140 38 168" stroke="#00000025" stroke-width="4" fill="none"/>
    <path d="M 128 118 Q 134 140 122 168" stroke="#00000025" stroke-width="4" fill="none"/>`;

  // Arms held out and bent - a distinct bulging bicep shape (not just a
  // thick stroke) at the top of each arm, tapering to a narrower forearm.
  const arms = `
    <path d="M 28 106 Q 2 118 6 146 Q 8 158 18 156 Q 10 138 14 122 Q 18 108 34 112 Z" fill="#d98a3f"/>
    <ellipse cx="14" cy="130" rx="15" ry="19" fill="#e8a352" opacity="0.9" transform="rotate(-18 14 130)"/>
    <ellipse cx="9" cy="124" rx="6" ry="10" fill="#fbdcae" opacity="0.5" transform="rotate(-18 9 124)"/>
    <path d="M 12 150 Q 16 170 42 174" stroke="#c9762a" stroke-width="19" fill="none" stroke-linecap="round"/>
    <circle cx="44" cy="175" r="13" fill="#b8721f"/>
    <path d="M 132 106 Q 158 118 154 146 Q 152 158 142 156 Q 150 138 146 122 Q 142 108 126 112 Z" fill="#d98a3f"/>
    <ellipse cx="146" cy="130" rx="15" ry="19" fill="#e8a352" opacity="0.9" transform="rotate(18 146 130)"/>
    <ellipse cx="151" cy="124" rx="6" ry="10" fill="#fbdcae" opacity="0.5" transform="rotate(18 151 124)"/>
    <path d="M 148 150 Q 144 170 118 174" stroke="#c9762a" stroke-width="19" fill="none" stroke-linecap="round"/>
    <circle cx="116" cy="175" r="13" fill="#b8721f"/>`;

  const legs = `${leg(58, 168, 213, 26, '#c9762a', '#8a4f1f')}${leg(102, 168, 213, 26, '#c9762a', '#8a4f1f')}
    <path d="M 46 176 Q 58 190 46 208" stroke="#00000022" stroke-width="4" fill="none"/>
    <path d="M 114 176 Q 102 190 114 208" stroke="#00000022" stroke-width="4" fill="none"/>`;

  const face = BROW.flat(HEAD_CX, HEAD_CY - 10, 11)
    + EYE.confident(HEAD_CX, HEAD_CY - 6)
    + nose(HEAD_CX, HEAD_CY + 6, '#3a1f0e')
    + MOUTH.grin(HEAD_CX, HEAD_CY + 12)
    + `<path d="M ${HEAD_CX - 10} ${HEAD_CY - 22} L ${HEAD_CX + 10} ${HEAD_CY - 22}" stroke="#7a4515" stroke-width="2" opacity="0.4"/>`;

  return `<defs>${g.defs}${skinGrad.defs}</defs>`
    + tail(118, 172, '#c9762a', '#7a3f14', 1)
    + legs + torso + arms + mane
    + headBase(`url(#${g.id})`, HEAD_CX, HEAD_CY, 26, '#c9762a', '#a8611f', '#ffdba0')
    + face;
}

function chudTemplate(scale, opts = {}) {
  const cx = 80, hipY = 118 * scale + (220 - 220 * scale), bellyCy = 150;
  // We draw in a fixed frame but scale the whole lower body via viewBox math:
  // simpler approach - build absolute coordinates per scale factor directly.
  const s = scale;
  const headR = 30 * (s < 1 ? 1.05 : 1); // keep head a bit bigger relatively for jr
  const bellyRx = 46 * s, bellyRy = 42 * s;
  const bellyCx = 80, bellyCyPos = HEAD_CY + 60 * s;
  const g = furGrad(opts.light || '#f2c377', opts.dark || '#c97a2b');
  const bellyGrad = sheenGrad('#fff3d9', '#e8b567');
  const maneColor1 = '#dc9440', maneColor2 = '#c97a2b';
  const mane = `<circle cx="${HEAD_CX}" cy="${HEAD_CY}" r="${38 * s}" fill="#b96b23"/>` + maneRing(HEAD_CX, HEAD_CY, 38 * s, 7 * s, 14, [maneColor1, maneColor2]);

  const legY1 = bellyCyPos + bellyRy - 8, legY2 = legY1 + 26 * s;
  const legs = standardLegs(80, legY1, legY2, 30 * s, 20 * s, '#c97a2b', '#a8611f');

  const belly = `
    <ellipse cx="${bellyCx}" cy="${bellyCyPos}" rx="${bellyRx}" ry="${bellyRy}" fill="url(#${g.id})"/>
    <ellipse cx="${bellyCx - bellyRx * 0.3}" cy="${bellyCyPos - bellyRy * 0.35}" rx="${bellyRx * 0.55}" ry="${bellyRy * 0.4}" fill="url(#${bellyGrad.id})" opacity="0.6"/>
    <circle cx="${bellyCx}" cy="${bellyCyPos + bellyRy * 0.3}" r="${3 * s}" fill="#00000030"/>
    <path d="M ${bellyCx - bellyRx} ${bellyCyPos} Q ${bellyCx} ${bellyCyPos + bellyRy * 0.9} ${bellyCx + bellyRx} ${bellyCyPos}"
      stroke="#00000020" stroke-width="${3 * s}" fill="none"/>`;

  const armY = bellyCyPos - bellyRy * 0.1;
  const arms = `
    <path d="M ${bellyCx - bellyRx * 0.85} ${armY} Q ${bellyCx - bellyRx * 1.35} ${armY + 8 * s} ${bellyCx - bellyRx * 1.05} ${armY + 26 * s}"
      stroke="#c97a2b" stroke-width="${16 * s}" fill="none" stroke-linecap="round"/>
    <circle cx="${bellyCx - bellyRx * 1.05}" cy="${armY + 26 * s}" r="${9 * s}" fill="#a8611f"/>
    <path d="M ${bellyCx + bellyRx * 0.85} ${armY} Q ${bellyCx + bellyRx * 1.35} ${armY + 8 * s} ${bellyCx + bellyRx * 1.05} ${armY + 26 * s}"
      stroke="#c97a2b" stroke-width="${16 * s}" fill="none" stroke-linecap="round"/>
    <circle cx="${bellyCx + bellyRx * 1.05}" cy="${armY + 26 * s}" r="${9 * s}" fill="#a8611f"/>`;

  const face = BROW.raisedOne(HEAD_CX, HEAD_CY - 3)
    + EYE.derp(HEAD_CX, HEAD_CY - 2)
    + nose(HEAD_CX, HEAD_CY + 11, '#4a2712')
    + MOUTH.wideTongueOpen(HEAD_CX, HEAD_CY + 16);

  return `<defs>${g.defs}${bellyGrad.defs}</defs>`
    + tail(bellyCx + bellyRx - 6, bellyCyPos + bellyRy * 0.5, '#c97a2b', '#8a4f1f', 1)
    + legs + belly + arms + mane
    + headBase(`url(#${g.id})`, HEAD_CX, HEAD_CY, headR, '#dc9440', '#c97a2b', '#ffe7bb')
    + face;
}

function buildChud() { return chudTemplate(1); }
function buildChudJr() { return chudTemplate(0.72, { light: '#f6cf8f', dark: '#d68f40' }); }

function buildChopped() {
  const g = furGrad('#d9a05e', '#a8672f');
  // Patchy uneven mane with visible bald gaps.
  const mane = jaggedMane(HEAD_CX, HEAD_CY, 28, 44, 10, '#5c3a1e', 3)
    + jaggedMane(HEAD_CX, HEAD_CY, 26, 38, 10, '#7a4a24', 9)
    + `<circle cx="${HEAD_CX + 28}" cy="${HEAD_CY - 10}" r="7" fill="${'url(#' + g.id + ')'}"/>
       <circle cx="${HEAD_CX - 30}" cy="${HEAD_CY + 6}" r="6" fill="${'url(#' + g.id + ')'}"/>`;

  const torso = `<path d="M 52 104 Q 80 96 108 104 L 112 150 Q 80 160 48 150 Z" fill="url(#${g.id})"/>
    <path d="M 52 104 Q 80 96 108 104 L 106 112 Q 80 105 54 112 Z" fill="#fff" opacity="0.12"/>
    <path d="M 60 120 L 72 128" stroke="#5c3a1e" stroke-width="2" opacity="0.6"/>`;
  const legs = standardLegs(80, 150, 202, 20, 18, '#a8672f', '#8a5225');
  const arms = arm(52, 112, 34, 150, 13, '#a8672f', '#5c3a1e') + arm(108, 112, 126, 150, 13, '#a8672f', '#5c3a1e');

  const face = BROW.crooked(HEAD_CX, HEAD_CY - 4)
    + `<circle cx="${HEAD_CX - 10}" cy="${HEAD_CY - 4}" r="6.4" fill="#fff"/><circle cx="${HEAD_CX - 9}" cy="${HEAD_CY - 3}" r="3.6" fill="#241305"/><circle cx="${HEAD_CX - 7.4}" cy="${HEAD_CY - 5.6}" r="1.2" fill="#fff"/>
       <path d="M ${HEAD_CX + 4} ${HEAD_CY + 3} Q ${HEAD_CX + 9} ${HEAD_CY} ${HEAD_CX + 14} ${HEAD_CY + 3.4}" stroke="#241305" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M ${HEAD_CX - 21} ${HEAD_CY - 8} L ${HEAD_CX - 9} ${HEAD_CY - 15}" stroke="#8a4520" stroke-width="2.4" stroke-linecap="round"/>
       <path d="M ${HEAD_CX + 15} ${HEAD_CY + 4} L ${HEAD_CX + 21} ${HEAD_CY + 12}" stroke="#8a4520" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
       <path d="M ${HEAD_CX - 12} ${HEAD_CY - 10} L ${HEAD_CX - 6} ${HEAD_CY + 6}" stroke="#7a3010" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`
    + `<ellipse cx="${HEAD_CX - 4}" cy="${HEAD_CY + 9}" rx="5.5" ry="4" fill="#4a2712"/><ellipse cx="${HEAD_CX - 5.5}" cy="${HEAD_CY + 8}" rx="1.4" ry="1" fill="#7a4a24"/>`
    + MOUTH.crookedGap(HEAD_CX, HEAD_CY + 15)
    + `<path d="M ${HEAD_CX + 6} ${HEAD_CY + 14} L ${HEAD_CX + 7.5} ${HEAD_CY + 20} L ${HEAD_CX + 4} ${HEAD_CY + 15.5} Z" fill="#fdf6e8"/>`
    + `<circle cx="${HEAD_CX - 14}" cy="${HEAD_CY + 20}" r="1.1" fill="#5c3a1e"/><circle cx="${HEAD_CX - 9}" cy="${HEAD_CY + 22}" r="1.1" fill="#5c3a1e"/><circle cx="${HEAD_CX - 4}" cy="${HEAD_CY + 20.5}" r="1.1" fill="#5c3a1e"/>`;

  return `<defs>${g.defs}</defs>`
    + tail(100, 150, '#a8672f', '#5c3a1e', 1)
    + legs + torso + arms + mane
    + headBase(`url(#${g.id})`, HEAD_CX, HEAD_CY, 27, '#a5652f', '#7a4a24', '#f0c98a')
    + face;
}

function buildTiny() {
  const s = 0.88;
  const g = furGrad('#dd8a3f', '#b3611f');
  const mane = jaggedMane(HEAD_CX, HEAD_CY, 24 * s, 40 * s, 9, '#6f2f14') + jaggedMane(HEAD_CX, HEAD_CY, 22 * s, 34 * s, 9, '#8a3f22');
  const shoulderY = HEAD_CY + 44 * s;
  const hipY = shoulderY + 40 * s;
  const torso = `<path d="M ${80 - 27 * s} ${shoulderY} Q 80 ${shoulderY - 8 * s} ${80 + 27 * s} ${shoulderY}
      Q ${80 + 30 * s} ${shoulderY + 20 * s} ${80 + 21 * s} ${hipY} Q 80 ${hipY + 8 * s} ${80 - 21 * s} ${hipY}
      Q ${80 - 30 * s} ${shoulderY + 20 * s} ${80 - 27 * s} ${shoulderY} Z" fill="url(#${g.id})"/>`;
  const legs = standardLegs(80, hipY, hipY + 26 * s, 14 * s, 12 * s, '#8a3f22', '#6f2f14');
  // Puffed-up posture: fists raised near shoulders.
  const arms = `<path d="M ${80 - 26 * s} ${shoulderY + 4 * s} Q ${80 - 40 * s} ${shoulderY - 6 * s} ${80 - 30 * s} ${shoulderY - 20 * s}"
      stroke="#8a3f22" stroke-width="${9 * s}" fill="none" stroke-linecap="round"/>
    <circle cx="${80 - 30 * s}" cy="${shoulderY - 20 * s}" r="${6 * s}" fill="#6f2f14"/>
    <path d="M ${80 + 26 * s} ${shoulderY + 4 * s} Q ${80 + 40 * s} ${shoulderY - 6 * s} ${80 + 30 * s} ${shoulderY - 20 * s}"
      stroke="#8a3f22" stroke-width="${9 * s}" fill="none" stroke-linecap="round"/>
    <circle cx="${80 + 30 * s}" cy="${shoulderY - 20 * s}" r="${6 * s}" fill="#6f2f14"/>`;
  const face = BROW.angry(HEAD_CX, HEAD_CY - 5) + EYE.angry(HEAD_CX, HEAD_CY - 2) + nose(HEAD_CX, HEAD_CY + 8, '#4a2712') + MOUTH.zigzag(HEAD_CX, HEAD_CY + 12);

  return `<defs>${g.defs}</defs>`
    + tail(80 + 18 * s, hipY - 4 * s, '#8a3f22', '#6f2f14', 1)
    + legs + torso + arms + mane
    + headBase(`url(#${g.id})`, HEAD_CX, HEAD_CY, 24 * s, '#a85228', '#8a3f22', '#e9b57c')
    + face;
}

function buildZesty() {
  const g = furGrad('#f7cf7a', '#e2a53f');
  const mane = `<circle cx="${HEAD_CX}" cy="${HEAD_CY}" r="40" fill="#ff8fc4"/>` + maneRing(HEAD_CX, HEAD_CY, 40, 7.2, 16, ['#ff6fae', '#ffd23f', '#8a4fff']);
  const glasses = uid('gl');
  const torso = `<path d="M 54 106 Q 80 98 106 106 L 110 152 Q 80 162 50 152 Z" fill="url(#${g.id})"/>
    <path d="M 54 106 Q 80 98 106 106 L 104 114 Q 80 107 56 114 Z" fill="#fff" opacity="0.15"/>`;
  const legs = standardLegs(80, 152, 202, 20, 17, '#e2a53f', '#c98a2f');
  // One hand on hip, confident lean.
  const armLeft = `<path d="M 54 110 Q 36 122 44 142" stroke="#e2a53f" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="44" cy="142" r="8" fill="#c98a2f"/>`;
  const armRight = arm(106, 110, 128, 148, 13, '#e2a53f', '#c98a2f');
  const chain = `<path d="M 68 112 Q 80 128 92 112" stroke="#ffd23f" stroke-width="2.5" fill="none"/>
    <circle cx="80" cy="126" r="5" fill="#ffd23f" stroke="#c99a1a" stroke-width="1.2"/>`;

  const face = `<rect x="${HEAD_CX - 17}" y="${HEAD_CY - 8}" width="34" height="11" rx="4" fill="#1a1a1a"/>
     <rect x="${HEAD_CX - 15}" y="${HEAD_CY - 6}" width="14" height="7" rx="2" fill="url(#${glasses})"/>
     <rect x="${HEAD_CX + 3}" y="${HEAD_CY - 6}" width="14" height="7" rx="2" fill="url(#${glasses})"/>
     <path d="M ${HEAD_CX} ${HEAD_CY - 6} h -1" stroke="#1a1a1a" stroke-width="2"/>`
    + MOUTH.smile(HEAD_CX, HEAD_CY + 15);

  return `<defs>${g.defs}
      <linearGradient id="${glasses}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7fd8ff"/><stop offset="100%" stop-color="#2b6fa8"/></linearGradient>
    </defs>`
    + tail(102, 150, '#e2a53f', '#8a4fff', 1)
    + legs + torso + armLeft + armRight + chain + mane
    + headBase(`url(#${g.id})`, HEAD_CX, HEAD_CY, 27, '#ffb84d', '#e2a53f', '#ffe7bb')
    + face;
}

function buildBald() {
  const g = furGrad('#e8ba76', '#c68a3f');
  const skinGrad = furGrad('#eec488', '#b8802f', '32%', '18%');
  // Sleek, toned torso - broader shoulders than the plain block before,
  // with a hint of definition so he doesn't read as a flat body.
  const torso = `<path d="M 48 104 Q 80 94 112 104 L 114 156 Q 80 168 46 156 Z" fill="url(#${skinGrad.id})"/>
    <path d="M 48 104 Q 80 94 112 104 L 108 114 Q 80 106 52 114 Z" fill="#fff3d9" opacity="0.35"/>
    <path d="M 80 128 L 80 156" stroke="#00000022" stroke-width="2.2"/>
    <path d="M 62 132 Q 80 138 98 132" stroke="#00000018" stroke-width="2" fill="none"/>
    <path d="M 64 144 Q 80 150 96 144" stroke="#00000018" stroke-width="2" fill="none"/>`;
  const legs = standardLegs(80, 156, 205, 21, 20, '#c68a3f', '#a8712f');
  // Arms crossed high on the chest - confident, dignified, clearly visible.
  const arms = `<path d="M 50 110 Q 60 138 92 122" stroke="#c68a3f" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="M 110 110 Q 100 138 68 122" stroke="#b8802f" stroke-width="14" fill="none" stroke-linecap="round"/>
    <circle cx="92" cy="122" r="8" fill="#a8712f"/><circle cx="68" cy="122" r="8" fill="#a8712f"/>`;
  const necklace = `<path d="M 60 106 Q 80 120 100 106" stroke="#e0a83a" stroke-width="2.6" fill="none"/>
    <circle cx="80" cy="117" r="6" fill="#e0a83a" stroke="#a87a1e" stroke-width="1.3"/>
    <circle cx="80" cy="117" r="2.4" fill="#fff6de"/>`;
  const face = `<ellipse cx="${HEAD_CX - 9}" cy="${HEAD_CY - 19}" rx="8" ry="5" fill="#fff" opacity="0.45"/>`
    + BROW.raisedOne(HEAD_CX, HEAD_CY - 4)
    + EYE.smirk(HEAD_CX, HEAD_CY - 2)
    + nose(HEAD_CX, HEAD_CY + 11, '#4a2712')
    + MOUTH.smirk(HEAD_CX, HEAD_CY + 16);

  return `<defs>${g.defs}${skinGrad.defs}</defs>`
    + tail(104, 152, '#c68a3f', '#a8712f', 1)
    + legs + torso + arms
    + headBase(`url(#${g.id})`, HEAD_CX, HEAD_CY, 28, '#e0a352', '#c68a3f', '#ffe7bb')
    + necklace + face;
}

function buildCute() {
  const s = 0.78; // chibi: smaller body relative to the oversized head
  const g = furGrad('#ffe3ba', '#f2bd7c');
  const mane = maneRing(HEAD_CX, HEAD_CY, 30, 6.4, 10, ['#ffe9c4']);
  const shoulderY = HEAD_CY + 40;
  const torso = `<ellipse cx="80" cy="${shoulderY + 14 * s}" rx="${22 * s}" ry="${18 * s}" fill="url(#${g.id})"/>`;
  const legs = standardLegs(80, shoulderY + 26 * s, shoulderY + 26 * s + 14 * s, 10 * s, 9 * s, '#f2bd7c', '#e0a05f');
  const arms = `<circle cx="${80 - 24 * s}" cy="${shoulderY + 12 * s}" r="${8 * s}" fill="#f2bd7c"/>
    <circle cx="${80 + 24 * s}" cy="${shoulderY + 12 * s}" r="${8 * s}" fill="#f2bd7c"/>`;
  const bow = `<g transform="translate(${HEAD_CX} ${HEAD_CY - 34})"><path d="M -6 0 Q 0 -8 6 0 Q 0 4 -6 0 Z" fill="#ff8fc4"/></g>`;
  const blush = `<circle cx="${HEAD_CX - 16}" cy="${HEAD_CY + 8}" r="4.6" fill="#ff9eb0" opacity="0.7"/><circle cx="${HEAD_CX + 16}" cy="${HEAD_CY + 8}" r="4.6" fill="#ff9eb0" opacity="0.7"/>`;
  const face = EYE.big(HEAD_CX, HEAD_CY - 1) + nose(HEAD_CX, HEAD_CY + 10, '#4a2712') + MOUTH.tiny(HEAD_CX, HEAD_CY + 15);

  return `<defs>${g.defs}</defs>`
    + tail(80 + 18 * s, shoulderY + 16 * s, '#f2bd7c', '#e0a05f', 1)
    + legs + torso + arms + mane + bow
    + headBase(`url(#${g.id})`, HEAD_CX, HEAD_CY, 34, '#ffe3ba', '#f2bd7c', '#fff2d9')
    + blush + face;
}

function ladyDivaTemplate(opts) {
  const g = furGrad(opts.skinLight, opts.skinDark);
  const dressGrad = sheenGrad(opts.dressLight, opts.dressDark);
  // Graceful hourglass silhouette in a modest wrap dress (fully clothed):
  // shoulders taper in to a visibly cinched waist, then flare to the hem.
  const dress = `<path d="M 58 108 Q 80 100 102 108
      Q 96 120 94 128 Q 106 136 112 150
      Q 80 168 48 150 Q 54 136 66 128 Q 64 120 58 108 Z" fill="url(#${dressGrad.id})"/>
    <path d="M 58 108 Q 80 100 102 108 L 98 118 Q 80 112 62 118 Z" fill="${opts.skinLight}" opacity="0.5"/>
    <path d="M 94 128 Q 80 133 66 128" stroke="${opts.dressDark}" stroke-width="1.6" fill="none" opacity="0.6"/>
    <path d="M 62 150 Q 80 160 98 150" stroke="${opts.dressDark}" stroke-width="1.6" fill="none" opacity="0.5"/>`;
  const legs = `<path d="M 68 150 L 66 200" stroke="${opts.skinDark}" stroke-width="9" stroke-linecap="round"/>
    <path d="M 92 150 L 94 200" stroke="${opts.skinDark}" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="66" cy="202" rx="7" ry="4" fill="${opts.skinDark}"/><ellipse cx="94" cy="202" rx="7" ry="4" fill="${opts.skinDark}"/>`;
  // Graceful pose: one hand on hip, one relaxed.
  const arms = `<path d="M 58 114 Q 42 126 48 144" stroke="${opts.skinLight}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="48" cy="144" r="6.5" fill="${opts.skinDark}"/>
    <path d="M 102 114 Q 112 130 104 146" stroke="${opts.skinLight}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="104" cy="146" r="6.5" fill="${opts.skinDark}"/>`;

  return { g, dressGrad, dress, legs, arms };
}

function buildDiva() {
  const p = ladyDivaTemplate({ skinLight: '#f7dcae', skinDark: '#e6b877', dressLight: '#ffd7e8', dressDark: '#e88aa8' });
  const sheen = sheenGrad('#fff7e6', '#f0cf94');
  const mane = `<ellipse cx="${HEAD_CX}" cy="${HEAD_CY - 2}" rx="46" ry="42" fill="url(#${sheen.id})"/>
      <ellipse cx="${HEAD_CX}" cy="${HEAD_CY - 2}" rx="38" ry="35" fill="#fbe6c4"/>
      <path d="M ${HEAD_CX - 30} ${HEAD_CY - 20} Q ${HEAD_CX - 10} ${HEAD_CY - 40} ${HEAD_CX + 20} ${HEAD_CY - 30}" stroke="#fff" stroke-width="3" fill="none" opacity="0.55" stroke-linecap="round"/>`;
  const flower = `<g transform="translate(${HEAD_CX + 32} ${HEAD_CY - 26})">
      <circle cx="0" cy="-6" r="4.2" fill="#ff8fc4"/><circle cx="5.4" cy="-2" r="4.2" fill="#ff8fc4"/>
      <circle cx="3.2" cy="4.4" r="4.2" fill="#ff8fc4"/><circle cx="-5.4" cy="2" r="4.2" fill="#ff8fc4"/>
      <circle cx="-4.2" cy="-4.4" r="4.2" fill="#ff8fc4"/><circle cx="0" cy="0" r="3.2" fill="#ffd23f"/>
    </g>`;
  const face = `<circle cx="${HEAD_CX - 30}" cy="${HEAD_CY - 34}" r="3.6" fill="#fff" opacity="0.7"/>
      <circle cx="${HEAD_CX + 6}" cy="${HEAD_CY + 8}" r="3" fill="#ffb0c8" opacity="0.55"/><circle cx="${HEAD_CX - 18}" cy="${HEAD_CY + 8}" r="3" fill="#ffb0c8" opacity="0.55"/>
      <circle cx="${HEAD_CX + 14}" cy="${HEAD_CY + 16}" r="1.3" fill="#7a4a3a"/>`
    + BROW.arched(HEAD_CX, HEAD_CY - 3, '#8a5a2a')
    + EYE.sultry(HEAD_CX, HEAD_CY - 1) + nose(HEAD_CX, HEAD_CY + 10, '#a85a6a') + MOUTH.lips(HEAD_CX, HEAD_CY + 14);

  return `<defs>${p.g.defs}${p.dressGrad.defs}${sheen.defs}</defs>`
    + tail(105, 148, '#e6b877', '#f7dcae', 1)
    + p.legs + p.dress + p.arms + mane + flower
    + headBase(`url(#${p.g.id})`, HEAD_CX, HEAD_CY, 26, '#f0cf94', '#e6b877', '#fff2d9')
    + face;
}

function buildLady() {
  const p = ladyDivaTemplate({ skinLight: '#f0c98a', skinDark: '#d99f56', dressLight: '#7fc9a8', dressDark: '#3f8f6f' });
  const hairGrad = furGrad('#a8703c', '#6b4526', '40%', '25%');
  const bun = `<ellipse cx="${HEAD_CX}" cy="${(HEAD_CY - 34).toFixed(1)}" rx="16" ry="13" fill="url(#${hairGrad.id})"/>`;
  const hair = `<path d="M ${HEAD_CX - 27} ${HEAD_CY - 2} Q ${HEAD_CX - 32} ${HEAD_CY - 26} ${HEAD_CX - 6} ${HEAD_CY - 32}
      Q ${HEAD_CX - 14} ${HEAD_CY - 20} ${HEAD_CX - 20} ${HEAD_CY - 4} Q ${HEAD_CX - 24} ${HEAD_CY + 4} ${HEAD_CX - 27} ${HEAD_CY - 2} Z" fill="url(#${hairGrad.id})"/>
    <path d="M ${HEAD_CX + 27} ${HEAD_CY - 2} Q ${HEAD_CX + 32} ${HEAD_CY - 26} ${HEAD_CX + 6} ${HEAD_CY - 32}
      Q ${HEAD_CX + 14} ${HEAD_CY - 20} ${HEAD_CX + 21} ${HEAD_CY - 2} Q ${HEAD_CX + 25} ${HEAD_CY + 8} ${HEAD_CX + 27} ${HEAD_CY - 2} Z" fill="url(#${hairGrad.id})"/>
    <path d="M ${HEAD_CX - 18} ${HEAD_CY - 22} Q ${HEAD_CX} ${HEAD_CY - 34} ${HEAD_CX + 18} ${HEAD_CY - 22}" stroke="#c99060" stroke-width="1.6" fill="none" opacity="0.5" stroke-linecap="round"/>`;
  const necklace = `<path d="M ${HEAD_CX - 20} 110 Q ${HEAD_CX} 122 ${HEAD_CX + 20} 110" stroke="#ffd23f" stroke-width="2" fill="none" opacity="0.85"/>
    <circle cx="${HEAD_CX}" cy="119" r="3.4" fill="#ffd23f" stroke="#c99a1a" stroke-width="0.8"/>`;
  const face = `<circle cx="${HEAD_CX - 22}" cy="${HEAD_CY + 3}" r="2.2" fill="#ffd9e8" stroke="#c99a1a" stroke-width="0.6"/><circle cx="${HEAD_CX + 22}" cy="${HEAD_CY + 3}" r="2.2" fill="#ffd9e8" stroke="#c99a1a" stroke-width="0.6"/>
      <circle cx="${HEAD_CX + 14}" cy="${HEAD_CY + 18}" r="1.3" fill="#7a3a2a"/>
      <circle cx="${HEAD_CX - 17}" cy="${HEAD_CY + 11}" r="3.6" fill="#ff9eb5" opacity="0.45"/><circle cx="${HEAD_CX + 17}" cy="${HEAD_CY + 11}" r="3.6" fill="#ff9eb5" opacity="0.45"/>`
    + BROW.arched(HEAD_CX, HEAD_CY - 4, '#6b4527')
    + EYE.sultry(HEAD_CX, HEAD_CY - 1, '#5a3a20') + nose(HEAD_CX, HEAD_CY + 9, '#a85a6a')
    + MOUTH.lips(HEAD_CX, HEAD_CY + 15, '#b8264a');

  return `<defs>${p.g.defs}${p.dressGrad.defs}${hairGrad.defs}</defs>`
    + tail(105, 148, '#d99f56', '#f0c98a', 1)
    + p.legs + p.dress + p.arms + bun + hair + necklace
    + headBase(`url(#${p.g.id})`, HEAD_CX, HEAD_CY, 25, '#e0b06a', '#d99f56', '#fbe9cf')
    + face;
}

// ---- The Lioness: dedicated hero asset for the "A Loyal Lioness" item ----
// Highest-detail character in the game - individually shaded flowing mane
// strands, bigger expressive eyes with a strong catchlight, warm
// golden-hour palette. Not part of the playable roster.
function buildLionessHero() {
  const skin = furGrad('#f4c988', '#d99f56', '38%', '22%');
  const strandGradA = sheenGrad('#c9873f', '#8f5a24');
  const strandGradB = sheenGrad('#e8b563', '#a8703c');
  const dressGrad = sheenGrad('#e8a63f', '#b8721f');

  // Long flowing mane built from many individual overlapping strand paths
  // radiating from the head (measured from straight-up, sweeping to each
  // side but staying clear of the face oval - only the top/side ~220deg
  // arc gets strands, never the bottom ~140deg where eyes/nose/mouth are).
  let mane = '';
  const strandCount = 14;
  const maneCx = HEAD_CX, maneCy = HEAD_CY - 6;
  for (let i = 0; i < strandCount; i++) {
    const deg = -110 + (i / (strandCount - 1)) * 220;
    const rad = (deg * Math.PI) / 180;
    const dirX = Math.sin(rad);
    const dirY = -Math.cos(rad);
    const len = 44 + (i % 3) * 9;
    const baseR = 25;
    const baseX = maneCx + dirX * baseR;
    const baseY = maneCy + dirY * baseR;
    const tipX = maneCx + dirX * len;
    const tipY = maneCy + dirY * len + 12;
    const midX = maneCx + dirX * (len * 0.58);
    const midY = maneCy + dirY * (len * 0.58) + 3;
    const grad = i % 2 === 0 ? strandGradA : strandGradB;
    mane += `<path d="M ${baseX.toFixed(1)} ${baseY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}"
      stroke="url(#${grad.id})" stroke-width="${(9 - (i % 3)).toFixed(1)}" fill="none" stroke-linecap="round" opacity="0.94"/>`;
  }
  const maneBase = `<ellipse cx="${maneCx}" cy="${maneCy}" rx="30" ry="28" fill="url(#${strandGradB.id})"/>`;

  const dress = `<path d="M 58 108 Q 80 100 102 108
      Q 96 120 94 128 Q 108 138 114 152
      Q 80 170 46 152 Q 52 138 66 128 Q 64 120 58 108 Z" fill="url(#${dressGrad.id})"/>
    <path d="M 58 108 Q 80 100 102 108 L 98 118 Q 80 112 62 118 Z" fill="#f4c988" opacity="0.5"/>
    <path d="M 94 128 Q 80 133 66 128" stroke="#8a5a1f" stroke-width="1.6" fill="none" opacity="0.6"/>`;
  const legs = `<path d="M 68 152 L 66 200" stroke="#d99f56" stroke-width="9" stroke-linecap="round"/>
    <path d="M 92 152 L 94 200" stroke="#d99f56" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="66" cy="202" rx="7" ry="4" fill="#d99f56"/><ellipse cx="94" cy="202" rx="7" ry="4" fill="#d99f56"/>`;
  // Dramatic pose: one arm raised gracefully to her mane, one on hip.
  const arms = `<path d="M 58 112 Q 40 108 36 92" stroke="#f4c988" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="36" cy="92" r="6.5" fill="#d99f56"/>
    <path d="M 102 114 Q 114 128 106 146" stroke="#f4c988" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="106" cy="146" r="6.5" fill="#d99f56"/>`;

  const eyes = oneSultryEye(HEAD_CX - 12, HEAD_CY - 2, -1, '#4a2f16')
    + oneSultryEye(HEAD_CX + 12, HEAD_CY - 2, 1, '#4a2f16')
    + `<circle cx="${HEAD_CX - 14}" cy="${HEAD_CY - 4}" r="1.6" fill="#fff" opacity="0.95"/>
       <circle cx="${HEAD_CX + 10}" cy="${HEAD_CY - 4}" r="1.6" fill="#fff" opacity="0.95"/>`;

  const face = `<circle cx="${HEAD_CX - 30}" cy="${HEAD_CY - 30}" r="4" fill="#fff" opacity="0.75"/>
      <circle cx="${HEAD_CX + 16}" cy="${HEAD_CY + 10}" r="3.4" fill="#ffb0c8" opacity="0.5"/>
      <circle cx="${HEAD_CX - 18}" cy="${HEAD_CY + 10}" r="3.4" fill="#ffb0c8" opacity="0.5"/>
      <circle cx="${HEAD_CX + 14}" cy="${HEAD_CY + 18}" r="1.3" fill="#7a3a2a"/>`
    + BROW.arched(HEAD_CX, HEAD_CY - 5, '#6b4527')
    + eyes + nose(HEAD_CX, HEAD_CY + 10, '#a85a6a')
    + MOUTH.lips(HEAD_CX, HEAD_CY + 16, '#c0203f');

  return `<defs>${skin.defs}${strandGradA.defs}${strandGradB.defs}${dressGrad.defs}</defs>`
    + tail(105, 150, '#d99f56', '#f4c988', 1)
    + legs + dress + arms + maneBase + mane
    + headBase(`url(#${skin.id})`, HEAD_CX, HEAD_CY, 27, '#e0b06a', '#d99f56', '#fff2d9')
    + face;
}

const BUILDERS = {
  chopped: buildChopped,
  chud: buildChud,
  'chud-jr': buildChudJr,
  zesty: buildZesty,
  diva: buildDiva,
  lioness_hero: buildLionessHero,
  tiny: buildTiny,
  bald: buildBald,
  cute: buildCute,
  lady: buildLady,
  avi: buildAvi,
};

// Per-character head-crop viewBox override for tiny "avatar" contexts
// (x, y, width, height) - all default to a standard square crop around
// HEAD_CX/HEAD_CY, tuned individually where a character's head sits at a
// different size/position (e.g. chibi Cute, small Tiny Terror).
const HEAD_CROP = {
  cute: [16, -4, 130, 130],
  tiny: [26, 12, 108, 108],
  'chud-jr': [22, 8, 116, 116],
  default: [18, 6, 124, 124],
};

function characterSVG(id, size = 100, opts = {}) {
  const build = BUILDERS[id];
  if (!build) return '';
  const body = build();
  if (opts.full) {
    return `<svg viewBox="0 0 160 220" width="${size}" height="${Math.round(size * 220 / 160)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  }
  const [x, y, w, h] = HEAD_CROP[id] || HEAD_CROP.default;
  return `<svg viewBox="${x} ${y} ${w} ${h}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}
