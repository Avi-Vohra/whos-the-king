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

- **v10** — Victory roar: synthesized crowd/growl sound on the crown reveal via Web Audio API (oscillator sweep + filtered noise) — no external audio asset needed, plays once per game end.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `e6a3931`

- **v11** — Bald Lion's crossed arms were tucked so tight to the body he read as visibly narrower/smaller than the rest of the roster; flared the elbows outward so the pose is both clearer and gives him proper silhouette presence. Re-ran self-audit sims at 4/6/8 players post-fix: all clean (Tren/Baboon exactly once, no self-targeting, correct endings).
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `c929542`

- **v12** — Found via systematic bbox comparison (not eyeballing): Avi's bicep/fist geometry extended past both edges of the SVG canvas, silently clipping both fists in half on every render. Pulled the geometry inward while keeping the same muscle definition. Re-checked bounding boxes for all 10 characters - all now fully within canvas.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `a3cae27`

- **v13** — Mechanics audit this pass: confirmed mid-game joins are correctly rejected, reconnects work regardless of phase, and leaderboard already distinguishes eliminated players clearly. Small UX fix: the bid input now caps at the player's current Roars for native browser validation.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `4191f6a`

- **v14** — Edge-case pass (bid of 0, bid of full Roars/all-in, rapid double-clicks, browser back button): all clean except one real bug found via the back-button test - the player screen showed an empty stray card above the leaderboard (a leftover effect-reveal container that was shown unconditionally for every non-bidding phase, including leaderboard, but has no leaderboard content). Fixed - leaderboard now renders exclusively.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `28a8f99`

- **v15** (final, this session) — Found via multi-tab edge-case testing: a player's old browser tab silently stopped receiving any further state updates after they reconnected from a second tab (backgrounded tab reawakening, reopening a bookmarked link) - it would freeze forever with no update and no error. Fixed by broadcasting to a per-player socket.io room instead of a single tracked socket, so every open tab for a player stays live. Verified with a scripted two-tab test and a full socket-driven game on the live server (no crashes, no self-targeting, correct ending).
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `edde882`
