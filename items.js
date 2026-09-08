// Item pool for "Who's the King?"
// type: 'strength' | 'attack' | 'trap'
// power: identifier used by server logic to resolve attack effects
const ITEMS = {
  fresh_kill: {
    id: 'fresh_kill', name: 'Fresh Kill', type: 'strength',
    flavor: 'A carcass still warm from the hunt. Claim it and grow stronger.',
    strengthGain: 15,
  },
  watering_hole: {
    id: 'watering_hole', name: 'The Watering Hole', type: 'strength',
    flavor: 'Every creature needs it. Control it and every creature fears you.',
    strengthGain: 15,
  },
  aura: {
    id: 'aura', name: 'Aura', type: 'strength',
    flavor: "Some lions are just built different. Yours radiates something the others can't touch.",
    strengthGain: 18,
  },
  prime_territory: {
    id: 'prime_territory', name: 'Prime Territory', type: 'strength',
    flavor: 'The best patch of the savanna, thick with prey. Whoever controls it, thrives.',
    strengthGain: 20,
  },
  loyal_lioness: {
    id: 'loyal_lioness', name: 'A Loyal Lioness', type: 'strength',
    flavor: 'A fierce hunting partner who answers to only one lion.',
    strengthGain: 25,
  },
  great_migration: {
    id: 'great_migration', name: 'The Great Migration', type: 'strength',
    flavor: 'A river of prey stretching to the horizon. Feast like never before.',
    strengthGain: 20,
  },
  sharpened_claw: {
    id: 'sharpened_claw', name: 'A Sharpened Claw', type: 'attack', power: 'sharpened_claw',
    flavor: 'One perfect swipe. Take their strength for your own.',
  },
  poisoned_carcass: {
    id: 'poisoned_carcass', name: 'A Poisoned Carcass', type: 'attack', power: 'poisoned_carcass',
    flavor: 'Leave it for a rival to find. They will never see it coming.',
  },
  hyena_pack: {
    id: 'hyena_pack', name: 'Hyena Pack', type: 'attack', power: 'hyena_pack', fight: true,
    flavor: 'Send the pack after a rival. Only the stronger side walks away.',
  },
  thorn_bush_ambush: {
    id: 'thorn_bush_ambush', name: 'Thorn Bush Ambush', type: 'attack', power: 'thorn_bush',
    flavor: 'Choose a rival to drive into the thorns. Painful, not deadly.',
  },
  croc_ambush: {
    id: 'croc_ambush', name: 'Croc Ambush', type: 'attack', power: 'croc_ambush', fight: true,
    flavor: 'Drag a rival into the water at the crossing. Only one of you climbs back out.',
  },
  vultures_mark: {
    id: 'vultures_mark', name: "Vulture's Mark", type: 'attack', power: 'vultures_mark',
    flavor: 'Mark a rival for the vultures. Next round, a third of their Strength is gone.',
  },
  locked_horns: {
    id: 'locked_horns', name: 'Locked Horns', type: 'attack', power: 'locked_horns',
    flavor: 'Charge in and lock horns with a rival. They stagger back, weaker for it.',
  },
  tren: {
    id: 'tren', name: 'Tren', type: 'attack', power: 'tren',
    flavor: 'Veins bulge. Eyes go wide. You have never felt this strong in your life.',
  },
  red_butt_baboon: {
    id: 'red_butt_baboon', name: 'The Red-Butt Baboon', type: 'trap', power: 'baboon',
    flavor: 'A strange creature lurks nearby, rear end glowing an unnatural red.',
  },
};

const STRENGTH_IDS = ['fresh_kill', 'watering_hole', 'aura', 'prime_territory', 'loyal_lioness', 'great_migration'];
const REGULAR_ATTACK_IDS = ['sharpened_claw', 'poisoned_carcass', 'hyena_pack', 'thorn_bush_ambush', 'croc_ambush', 'vultures_mark', 'locked_horns'];
const FILLER_POOL = [...STRENGTH_IDS, ...REGULAR_ATTACK_IDS];

const TOTAL_ROUNDS = 12;
const STRENGTH_ONLY_ROUNDS = 2; // rounds 1-2, index 0-1
const BACK_HALF_START_INDEX = 6; // rounds 7-12 (0-indexed 6..11)

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Builds an ordered list of TOTAL_ROUNDS item ids for one game.
// Rounds 1-2 are always distinct strength items. 'tren' and
// 'red_butt_baboon' each appear exactly once, both placed somewhere in the
// back half (rounds 7-12), in different rounds. Every other round is filled
// by drawing (with repetition) from the full strength+attack pool.
function generateItemQueue() {
  const slots = new Array(TOTAL_ROUNDS).fill(null);

  const openers = shuffle(STRENGTH_IDS).slice(0, STRENGTH_ONLY_ROUNDS);
  for (let i = 0; i < STRENGTH_ONLY_ROUNDS; i++) slots[i] = openers[i];

  const backHalfIndices = [];
  for (let i = BACK_HALF_START_INDEX; i < TOTAL_ROUNDS; i++) backHalfIndices.push(i);
  const shuffledBack = shuffle(backHalfIndices);
  slots[shuffledBack[0]] = 'red_butt_baboon';
  slots[shuffledBack[1]] = 'tren';

  for (let i = STRENGTH_ONLY_ROUNDS; i < TOTAL_ROUNDS; i++) {
    if (slots[i] === null) slots[i] = pickRandom(FILLER_POOL);
  }

  return slots.map((id) => ITEMS[id]);
}

module.exports = { ITEMS, generateItemQueue, TOTAL_ROUNDS };
