// Flat cartoon lion icons + metadata, shared by host and player screens.
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

function sheenGrad(c1, c2) {
  const id = uid('sh');
  return { id, defs: `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient>` };
}

// Ring of small circles around (cx,cy) at radius r -- classic scalloped mane look.
function maneRing(cx, cy, r, bumpR, count, colors) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const color = colors[i % colors.length];
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${bumpR}" fill="${color}"/>`;
  }
  return out;
}

function jaggedMane(cx, cy, rInner, rOuter, count, color) {
  const points = [];
  for (let i = 0; i < count * 2; i++) {
    const angle = (Math.PI * 2 * i) / (count * 2);
    const r = i % 2 === 0 ? rOuter : rInner + (Math.random() * 0 || 0);
    points.push(`${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`);
  }
  return `<polygon points="${points.join(' ')}" fill="${color}"/>`;
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
};

function oneSultryEye(ex, ey, dir, iris) {
  return `
    <ellipse cx="${ex}" cy="${ey}" rx="7.4" ry="5" fill="#fff8f0"/>
    <path d="M ${(ex - dir * 7.6).toFixed(1)} ${ey} Q ${ex} ${ey + 5.4} ${(ex + dir * 7.6).toFixed(1)} ${ey}" fill="none"/>
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
  derp: (cx, cy) => `<circle cx="${cx - 9}" cy="${cy}" r="5.4" fill="#fff"/><circle cx="${cx - 7}" cy="${cy + 1.5}" r="2.8" fill="#241305"/>
    <circle cx="${cx + 8}" cy="${cy - 2}" r="3.8" fill="#fff"/><circle cx="${cx + 9}" cy="${cy - 2}" r="1.9" fill="#241305"/>`,
  angry: (cx, cy) => `<circle cx="${cx - 8}" cy="${cy}" r="3" fill="#241305"/><circle cx="${cx + 8}" cy="${cy}" r="3" fill="#241305"/>`,
  smirk: (cx, cy) => `<path d="M ${cx - 12} ${cy} Q ${cx - 8} ${cy - 4} ${cx - 4} ${cy}" stroke="#241305" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M ${cx + 4} ${cy} Q ${cx + 8} ${cy - 4} ${cx + 12} ${cy}" stroke="#241305" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  big: (cx, cy) => `<circle cx="${cx - 10}" cy="${cy}" r="7.5" fill="#fff"/><circle cx="${cx - 9}" cy="${cy + 1}" r="4.3" fill="#241305"/><circle cx="${cx - 7.2}" cy="${cy - 1.2}" r="1.5" fill="#fff"/>
    <circle cx="${cx + 10}" cy="${cy}" r="7.5" fill="#fff"/><circle cx="${cx + 11}" cy="${cy + 1}" r="4.3" fill="#241305"/><circle cx="${cx + 12.8}" cy="${cy - 1.2}" r="1.5" fill="#fff"/>`,
  sultry: (cx, cy, iris = '#6b4426') => oneSultryEye(cx - 11, cy, -1, iris) + oneSultryEye(cx + 11, cy, 1, iris),
  confident: (cx, cy) => `<path d="M ${cx - 12} ${cy - 1} L ${cx - 4} ${cy - 1}" stroke="#241305" stroke-width="3" stroke-linecap="round"/>
    <path d="M ${cx + 4} ${cy - 1} L ${cx + 12} ${cy - 1}" stroke="#241305" stroke-width="3" stroke-linecap="round"/>`,
};

const MOUTH = {
  smile: (cx, cy) => `<path d="M ${cx - 8} ${cy} Q ${cx} ${cy + 7} ${cx + 8} ${cy}" stroke="#241305" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  tongue: (cx, cy) => `<path d="M ${cx - 9} ${cy} Q ${cx} ${cy + 9} ${cx + 9} ${cy}" stroke="#241305" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="${cx}" cy="${cy + 7}" rx="4.5" ry="5" fill="#e0607a"/>`,
  zigzag: (cx, cy) => `<path d="M ${cx - 9} ${cy} l 4 5 l 4 -5 l 4 5 l 4 -5" stroke="#241305" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M ${cx - 6} ${cy + 1} l 2.5 3 M ${cx + 3} ${cy + 1} l 2.5 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  smirk: (cx, cy) => `<path d="M ${cx - 9} ${cy - 1} Q ${cx + 2} ${cy + 6} ${cx + 10} ${cy - 3}" stroke="#241305" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  tiny: (cx, cy) => `<circle cx="${cx}" cy="${cy + 2}" r="2.4" fill="#241305"/>`,
  lips: (cx, cy, color = '#c23e63') => `
    <path d="M ${cx - 6.5} ${cy - 0.6}
        Q ${cx - 2.4} ${cy - 2.4} ${cx} ${cy - 0.8}
        Q ${cx + 2.4} ${cy - 2.4} ${cx + 6.5} ${cy - 0.6}
        Q ${cx + 4} ${cy + 4.4} ${cx} ${cy + 4.6}
        Q ${cx - 4} ${cy + 4.4} ${cx - 6.5} ${cy - 0.6} Z" fill="${color}"/>
    <path d="M ${cx - 5.4} ${cy - 0.2} Q ${cx} ${cy + 1.4} ${cx + 5.4} ${cy - 0.2}" stroke="#000" stroke-width="0.5" fill="none" opacity="0.35"/>
    <ellipse cx="${cx - 1.8}" cy="${cy + 1.4}" rx="1.3" ry="0.8" fill="#fff" opacity="0.55"/>`,
  grin: (cx, cy) => `<path d="M ${cx - 10} ${cy - 1} Q ${cx} ${cy + 8} ${cx + 10} ${cy - 1} Z" fill="#241305"/>
    <path d="M ${cx - 8} ${cy + 1} Q ${cx} ${cy + 4} ${cx + 8} ${cy + 1}" fill="#fff"/>`,
};

function baseHead(fill, cx, cy, r, earOuter, earInner, muzzleColor) {
  return `${earPair(cx, cy, r, earOuter, earInner)}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>
    ${muzzleColor ? muzzle(cx, cy, r, muzzleColor) : ''}`;
}

function shoulders(cx, cy, r, color1, color2) {
  return `<path d="M ${cx - r * 1.15} ${cy + r * 0.55} Q ${cx} ${cy + r * 0.15} ${cx + r * 1.15} ${cy + r * 0.55}
    L ${cx + r * 1.35} ${cy + r * 1.7} L ${cx - r * 1.35} ${cy + r * 1.7} Z" fill="${color1}"/>
    <path d="M ${cx - r * 1.15} ${cy + r * 0.55} Q ${cx} ${cy + r * 0.15} ${cx + r * 1.15} ${cy + r * 0.55}
    L ${cx + r * 1.15} ${cy + r * 0.95} Q ${cx} ${cy + r * 0.55} ${cx - r * 1.15} ${cy + r * 0.95} Z" fill="${color2}" opacity="0.55"/>`;
}

const BUILDERS = {
  chopped(cx, cy) {
    const g = furGrad('#e8a860', '#c07a34');
    const mane = jaggedMane(cx, cy, 30, 47, 10, '#5c3a1e') + jaggedMane(cx, cy, 28, 41, 10, '#7a4a24');
    return `<defs>${g.defs}</defs>`
      + shoulders(cx, cy + 30, 26, '#6b4527', '#83572f')
      + mane
      + baseHead(`url(#${g.id})`, cx, cy, 26, '#a5652f', '#7a4a24', '#f0c98a')
      + `<path d="M ${cx - 21} ${cy - 8} L ${cx - 10} ${cy - 13}" stroke="#8a4520" stroke-width="2.4" stroke-linecap="round"/>
         <circle cx="${cx - 15}" cy="${cy + 18}" r="1.1" fill="#5c3a1e"/><circle cx="${cx - 10}" cy="${cy + 20}" r="1.1" fill="#5c3a1e"/><circle cx="${cx - 5}" cy="${cy + 18.5}" r="1.1" fill="#5c3a1e"/>`
      + BROW.angry(cx, cy - 4)
      + EYE.normal(cx, cy - 2) + nose(cx, cy + 10, '#4a2712') + MOUTH.smirk(cx, cy + 14);
  },
  chud(cx, cy) {
    const g = furGrad('#f2c377', '#c97a2b');
    const mane = `<circle cx="${cx}" cy="${cy}" r="40" fill="#b96b23"/><circle cx="${cx}" cy="${cy}" r="40" fill="#c97a2b" opacity="0.6"/>` + maneRing(cx, cy, 40, 7.4, 14, ['#dc9440', '#c97a2b']);
    return `<defs>${g.defs}</defs>`
      + shoulders(cx, cy + 30, 27, '#c97a2b', '#e0a04a')
      + mane
      + baseHead(`url(#${g.id})`, cx, cy, 27, '#dc9440', '#c97a2b', '#ffe7bb')
      + BROW.raisedOne(cx, cy - 3)
      + EYE.derp(cx, cy - 2) + nose(cx, cy + 11, '#4a2712') + MOUTH.tongue(cx, cy + 15);
  },
  'chud-jr'(cx, cy) {
    const s = 0.72;
    const g = furGrad('#f6cf8f', '#d68f40');
    const mane = `<circle cx="${cx}" cy="${cy}" r="${40 * s}" fill="#c97a2b"/>` + maneRing(cx, cy, 40 * s, 5.6, 11, ['#dc9440', '#c97a2b']);
    return `<defs>${g.defs}</defs>`
      + shoulders(cx, cy + 20, 20, '#c97a2b', '#e0a04a')
      + mane
      + baseHead(`url(#${g.id})`, cx, cy, 27 * s, '#dc9440', '#c97a2b', '#ffe7bb')
      + BROW.raisedOne(cx, cy - 2)
      + EYE.derp(cx, cy - 1) + nose(cx, cy + 8, '#4a2712') + MOUTH.tongue(cx, cy + 11);
  },
  zesty(cx, cy) {
    const g = furGrad('#f7cf7a', '#e2a53f');
    const mane = `<circle cx="${cx}" cy="${cy}" r="42" fill="#ff8fc4"/>` + maneRing(cx, cy, 42, 7.6, 16, ['#ff6fae', '#ffd23f', '#8a4fff']);
    const glasses = uid('gl');
    return `<defs>${g.defs}
        <linearGradient id="${glasses}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7fd8ff"/><stop offset="100%" stop-color="#2b6fa8"/></linearGradient>
      </defs>`
      + shoulders(cx, cy + 30, 27, '#8a4fff', '#ff6fae')
      + mane
      + baseHead(`url(#${g.id})`, cx, cy, 27, '#ffb84d', '#e2a53f', '#ffe7bb')
      + `<rect x="${cx - 17}" y="${cy - 8}" width="34" height="11" rx="4" fill="#1a1a1a"/>
         <rect x="${cx - 15}" y="${cy - 6}" width="14" height="7" rx="2" fill="url(#${glasses})"/>
         <rect x="${cx + 3}" y="${cy - 6}" width="14" height="7" rx="2" fill="url(#${glasses})"/>
         <path d="M ${cx} ${cy - 6} h -1" stroke="#1a1a1a" stroke-width="2"/>
         <path d="M ${cx} ${cy + 24} L ${cx} ${cy + 32}" stroke="#ffd23f" stroke-width="2.5"/>
         <circle cx="${cx}" cy="${cy + 35}" r="6.5" fill="#ffd23f" stroke="#c99a1a" stroke-width="1.5"/>`
      + MOUTH.smile(cx, cy + 15);
  },
  diva(cx, cy) {
    const g = furGrad('#f7dcae', '#e6b877');
    const sheen = sheenGrad('#fff7e6', '#f0cf94');
    const mane = `<ellipse cx="${cx}" cy="${cy - 2}" rx="46" ry="42" fill="url(#${sheen.id})"/>
      <ellipse cx="${cx}" cy="${cy - 2}" rx="38" ry="35" fill="#fbe6c4"/>
      <path d="M ${cx - 30} ${cy - 20} Q ${cx - 10} ${cy - 40} ${cx + 20} ${cy - 30}" stroke="#fff" stroke-width="3" fill="none" opacity="0.55" stroke-linecap="round"/>`;
    const flower = `<g transform="translate(${cx + 32} ${cy - 26})">
        <circle cx="0" cy="-6" r="4.2" fill="#ff8fc4"/><circle cx="5.4" cy="-2" r="4.2" fill="#ff8fc4"/>
        <circle cx="3.2" cy="4.4" r="4.2" fill="#ff8fc4"/><circle cx="-5.4" cy="2" r="4.2" fill="#ff8fc4"/>
        <circle cx="-4.2" cy="-4.4" r="4.2" fill="#ff8fc4"/><circle cx="0" cy="0" r="3.2" fill="#ffd23f"/>
      </g>`;
    return `<defs>${g.defs}${sheen.defs}</defs>`
      + shoulders(cx, cy + 30, 26, '#e6b877', '#f7dcae')
      + mane + flower
      + baseHead(`url(#${g.id})`, cx, cy, 26, '#f0cf94', '#e6b877', '#fff2d9')
      + `<circle cx="${cx - 30}" cy="${cy - 34}" r="3.6" fill="#fff" opacity="0.7"/>
         <circle cx="${cx + 6}" cy="${cy + 8}" r="3" fill="#ffb0c8" opacity="0.55"/><circle cx="${cx - 18}" cy="${cy + 8}" r="3" fill="#ffb0c8" opacity="0.55"/>
         <circle cx="${cx + 14}" cy="${cy + 16}" r="1.3" fill="#7a4a3a"/>`
      + BROW.arched(cx, cy - 3, '#8a5a2a')
      + EYE.sultry(cx, cy - 1) + nose(cx, cy + 10, '#a85a6a') + MOUTH.lips(cx, cy + 14);
  },
  tiny(cx, cy) {
    const s = 0.78;
    const g = furGrad('#dd8a3f', '#b3611f');
    const mane = jaggedMane(cx, cy, 24 * s, 40 * s, 9, '#6f2f14') + jaggedMane(cx, cy, 22 * s, 34 * s, 9, '#8a3f22');
    return `<defs>${g.defs}</defs>`
      + shoulders(cx, cy + 22 * s, 20 * s, '#8a3f22', '#a85228')
      + mane
      + baseHead(`url(#${g.id})`, cx, cy, 24 * s, '#a85228', '#8a3f22', '#e9b57c')
      + BROW.angry(cx, cy - 5)
      + EYE.angry(cx, cy - 2) + nose(cx, cy + 8, '#4a2712') + MOUTH.zigzag(cx, cy + 12);
  },
  bald(cx, cy) {
    const g = furGrad('#e8ba76', '#c68a3f');
    return `<defs>${g.defs}</defs>`
      + shoulders(cx, cy + 30, 28, '#c68a3f', '#e8ba76')
      + baseHead(`url(#${g.id})`, cx, cy, 28, '#e0a352', '#c68a3f', '#ffe7bb')
      + `<ellipse cx="${cx - 9}" cy="${cy - 19}" rx="8" ry="5" fill="#fff" opacity="0.45"/>
         <path d="M ${cx - 8} ${cy + 32} L ${cx + 8} ${cy + 32} L ${cx} ${cy + 38} Z" fill="#ffd23f"/>
         <circle cx="${cx}" cy="${cy + 30}" r="3" fill="#ffd23f" stroke="#c99a1a" stroke-width="1"/>`
      + BROW.raisedOne(cx, cy - 4)
      + EYE.smirk(cx, cy - 2) + nose(cx, cy + 11, '#4a2712') + MOUTH.smirk(cx, cy + 16);
  },
  cute(cx, cy) {
    const s = 0.82;
    const g = furGrad('#ffe3ba', '#f2bd7c');
    const mane = maneRing(cx, cy, 30 * s, 6.4 * s, 10, ['#ffe9c4']);
    return `<defs>${g.defs}</defs>`
      + shoulders(cx, cy + 22 * s, 22 * s, '#f2bd7c', '#ffe3ba')
      + mane
      + baseHead(`url(#${g.id})`, cx, cy, 26 * s, '#ffe3ba', '#f2bd7c', '#fff2d9')
      + `<g transform="translate(${cx} ${cy - 34 * s})"><path d="M -6 0 Q 0 -8 6 0 Q 0 4 -6 0 Z" fill="#ff8fc4"/></g>`
      + `<circle cx="${cx - 16}" cy="${cy + 8}" r="4.6" fill="#ff9eb0" opacity="0.7"/><circle cx="${cx + 16}" cy="${cy + 8}" r="4.6" fill="#ff9eb0" opacity="0.7"/>`
      + EYE.big(cx, cy - 1) + nose(cx, cy + 10, '#4a2712') + MOUTH.tiny(cx, cy + 15);
  },
  lady(cx, cy) {
    const g = furGrad('#f0c98a', '#d99f56');
    const hairGrad = furGrad('#a8703c', '#6b4526', '40%', '25%');
    const bun = `<ellipse cx="${cx}" cy="${(cy - 34).toFixed(1)}" rx="16" ry="13" fill="url(#${hairGrad.id})"/>`;
    const hair = `<path d="M ${cx - 27} ${cy - 2}
        Q ${cx - 32} ${cy - 26} ${cx - 6} ${cy - 32}
        Q ${cx - 14} ${cy - 20} ${cx - 20} ${cy - 4}
        Q ${cx - 24} ${cy + 4} ${cx - 27} ${cy - 2} Z" fill="url(#${hairGrad.id})"/>
      <path d="M ${cx + 27} ${cy - 2}
        Q ${cx + 32} ${cy - 26} ${cx + 6} ${cy - 32}
        Q ${cx + 14} ${cy - 20} ${cx + 21} ${cy - 2}
        Q ${cx + 25} ${cy + 8} ${cx + 27} ${cy - 2} Z" fill="url(#${hairGrad.id})"/>
      <path d="M ${cx - 18} ${cy - 22} Q ${cx} ${cy - 34} ${cx + 18} ${cy - 22}" stroke="#c99060" stroke-width="1.6" fill="none" opacity="0.5" stroke-linecap="round"/>`;
    const stole = `<path d="M ${cx - 28} ${cy + 22} Q ${cx} ${cy + 10} ${cx + 28} ${cy + 22}
        L ${cx + 32} ${cy + 46} Q ${cx} ${cy + 35} ${cx - 32} ${cy + 46} Z" fill="#c9587a"/>
      <path d="M ${cx - 28} ${cy + 22} Q ${cx} ${cy + 10} ${cx + 28} ${cy + 22} L ${cx + 25} ${cy + 28} Q ${cx} ${cy + 19} ${cx - 25} ${cy + 28} Z" fill="#e88aa8" opacity="0.7"/>
      <path d="M ${cx - 28} ${cy + 22} Q ${cx} ${cy + 10} ${cx + 28} ${cy + 22}" stroke="#ffd23f" stroke-width="1.4" fill="none" opacity="0.8"/>`;
    return `<defs>${g.defs}${hairGrad.defs}</defs>`
      + stole
      + bun + hair
      + baseHead(`url(#${g.id})`, cx, cy, 25, '#e0b06a', '#d99f56', '#fbe9cf')
      + `<circle cx="${cx - 22}" cy="${cy + 4}" r="2.2" fill="#ffd9e8" stroke="#c99a1a" stroke-width="0.6"/><circle cx="${cx + 22}" cy="${cy + 4}" r="2.2" fill="#ffd9e8" stroke="#c99a1a" stroke-width="0.6"/>
         <circle cx="${cx + 14}" cy="${cy + 18}" r="1.3" fill="#7a3a2a"/>
         <circle cx="${cx - 17}" cy="${cy + 11}" r="3.6" fill="#ff9eb5" opacity="0.45"/><circle cx="${cx + 17}" cy="${cy + 11}" r="3.6" fill="#ff9eb5" opacity="0.45"/>`
      + BROW.arched(cx, cy - 4, '#6b4527')
      + EYE.sultry(cx, cy - 1, '#5a3a20') + nose(cx, cy + 9, '#a85a6a')
      + MOUTH.lips(cx, cy + 15, '#b8264a');
  },
  avi(cx, cy) {
    const g = furGrad('#e2984a', '#c9762a');
    const mane = `<circle cx="${cx}" cy="${cy - 4}" r="41" fill="#8f4b18"/>` + maneRing(cx, cy - 4, 41, 7.2, 16, ['#a85c1f', '#8f4b18']);
    const bodyLight = sheenGrad('#e2984a', '#b8721f');
    const body = `<path d="M ${cx - 30} ${cy + 34} Q ${cx} ${cy + 18} ${cx + 30} ${cy + 34} L ${cx + 34} ${cy + 54} L ${cx - 34} ${cy + 54} Z" fill="url(#${bodyLight.id})"/>
      <path d="M ${cx - 12} ${cy + 30} Q ${cx} ${cy + 36} ${cx + 12} ${cy + 30}" stroke="#8a4f1f" stroke-width="1.6" fill="none" opacity="0.6"/>
      <circle cx="${cx - 13}" cy="${cy + 37}" r="9" fill="#c9762a"/><circle cx="${cx + 13}" cy="${cy + 37}" r="9" fill="#c9762a"/>
      <path d="M ${cx - 6} ${cy + 44} Q ${cx} ${cy + 41} ${cx + 6} ${cy + 44}" stroke="#8a4f1f" stroke-width="1.4" fill="none" opacity="0.6"/>`;
    return `<defs>${g.defs}${bodyLight.defs}</defs>`
      + body + mane
      + baseHead(`url(#${g.id})`, cx, cy - 4, 28, '#c9762a', '#a8611f', '#ffdba0')
      + `<path d="M ${cx - 10} ${cy - 22} L ${cx + 10} ${cy - 22}" stroke="#7a4515" stroke-width="2" opacity="0.4"/>`
      + BROW.flat(cx, cy - 10, 10)
      + EYE.confident(cx, cy - 6) + nose(cx, cy + 6, '#4a2712') + MOUTH.grin(cx, cy + 12);
  },
};

function characterSVG(id, size = 100) {
  const build = BUILDERS[id];
  if (!build) return '';
  const cx = 60, cy = 58;
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${build(cx, cy)}</svg>`;
}
