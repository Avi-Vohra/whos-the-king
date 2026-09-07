// Character roster shared in spirit between server (validation) and client (rendering).
// gender drives the "King"/"Queen" crowning title.
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CHARACTERS };
}
