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
  ambush_spot: {
    id: 'ambush_spot', name: "Rival Pride's Ambush Spot", type: 'attack', power: 'ambush',
    flavor: 'The perfect vantage point. From here, you strike the weakest first.',
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
    id: 'hyena_pack', name: 'Hyena Pack', type: 'attack', power: 'hyena_pack',
    flavor: 'Send the pack after a rival. If they are weaker, they will not survive.',
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

// Strength items are front-loaded into the early rounds (players need a
// base of Strength before the attack items start flying), and attack items
// fill the back half. No item repeats within a single game.
const STRENGTH_IDS = ['fresh_kill', 'watering_hole', 'aura', 'prime_territory', 'loyal_lioness'];
const REGULAR_ATTACK_IDS = ['ambush_spot', 'sharpened_claw', 'poisoned_carcass', 'hyena_pack'];

const TOTAL_ROUNDS = 8;
const STRENGTH_ROUNDS = 4;
const ATTACK_ROUNDS = TOTAL_ROUNDS - STRENGTH_ROUNDS;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Builds an ordered list of TOTAL_ROUNDS item ids for one game.
// Rounds 1..STRENGTH_ROUNDS are distinct strength items (front-loaded).
// Rounds after that are attack-phase: 'tren' exactly once (not the very
// first attack round, for maximum impact), 'red_butt_baboon' exactly once
// (no visual distinction from other items), plus distinct regular attacks
// filling any remaining slots. No item ever repeats within a game.
function generateItemQueue() {
  const strengthPicks = shuffle(STRENGTH_IDS).slice(0, STRENGTH_ROUNDS);

  const regularAttackSlots = ATTACK_ROUNDS - 2; // minus tren + baboon
  const regularAttackPicks = shuffle(REGULAR_ATTACK_IDS).slice(0, Math.max(0, regularAttackSlots));

  const others = shuffle([...regularAttackPicks, 'red_butt_baboon']);
  const trenIndex = ATTACK_ROUNDS > 1 ? 1 + Math.floor(Math.random() * (ATTACK_ROUNDS - 1)) : 0;

  const attackPhase = [];
  let oi = 0;
  for (let i = 0; i < ATTACK_ROUNDS; i++) {
    if (i === trenIndex) {
      attackPhase.push('tren');
    } else {
      attackPhase.push(others[oi]);
      oi += 1;
    }
  }

  return [...strengthPicks, ...attackPhase].map((id) => ITEMS[id]);
}

module.exports = { ITEMS, generateItemQueue, TOTAL_ROUNDS };
