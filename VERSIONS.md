# Versions

Host: http://localhost:3000/host.html (or your Mac's LAN IP, currently `192.168.0.28`)
Player: http://192.168.0.28:3000/player.html

- **v1** — Removed Stampede/Ambush Spot (random kills). Added Croc Ambush, Vulture's Mark, Locked Horns. Elimination-attempt items (Hyena Pack, Croc Ambush) now trigger a live 5s tap-contest fight (Strength-weighted, disconnect/tie-safe) instead of resolving instantly.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `6970274`

- **v2** — Fight results (win/loss) now render full death animations (collapse+fade, impact burst, stagger); every elimination ends with a "pride watches in silence" beat. Added icons for the 3 new items.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `678d829`

- **v3** — The Lioness gets a dedicated hero art asset (flowing shaded mane, catchlight eyes) plus a cinematic reveal (light rays, sparkles, swaying grass, camera push-in) when she comes up for bid, and a triumphant claim animation for the winner.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `a444b4d`

- **v4** — Self-audit: verified full games at 2/3/4/6/8 players (all pass, no self-targeting, correct Tren/Baboon frequency). Graphics pass: rebuilt Bald Lion's torso/arms (was a flat blob, now has visible crossed-arm pose and shading).
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `b2f04e8`

- **v5** — Background overhaul: replaced flat gradient with layered savanna scene (2 hill layers, 5 acacia tree silhouettes, jagged grass texture) as a fixed bottom band behind all screens. Verified on both host and player (narrow phone width).
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `8488085`

- **v6** — Chopped Lion pushed funnier-ugly (derp/squint mismatched eyes, snaggletooth, bulbous nose). Item reveal now does a real 3D card-flip + icon spin-in every new item (previously the pop-in animation never replayed after the first item). Victory screen gets a falling confetti burst behind the crown.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `5d6411c`

- **v7** — Self-audit: full socket-driven games simulated at 2/3/4/6/8 players (no crashes, no self-targeting, Tren/Baboon exactly once each game, correct King/fallen endings). Tiny Terror rebuilt (was shrunk to 68% leaving him tiny/empty-looking vs the rest of the roster; now 88%, tapered torso, tail off the fist). Cute Lion's chibi body proportions nudged slightly larger.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `477eabf`

- **v8** — UI polish: button hover/focus-visible states, subtle card top sheen. Fixed two confusing item icons: Hyena Pack looked identical to Prime Territory's hills (now a pack of red-eyed toothy hyena silhouettes); Thorn Bush Ambush's red circle+cross read as a medical symbol (now lurking predator eyes in the bush).
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `f755eb0`

- **v9** — Found via manual in-browser playtest, not automated tests: the bid winner's target-select screen depended entirely on a one-time socket event. Any reconnect/reload during that phase (phone screen lock, backgrounded tab, flaky wifi — all common mid-party) permanently soft-locked them out of picking a target for that round, silently falling back to a random pick 30s later. Fixed by rebuilding the prompt from synced state on render, so it survives reconnects.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `d0edd30`
