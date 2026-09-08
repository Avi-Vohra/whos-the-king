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
