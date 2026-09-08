# Versions

Host: http://localhost:3000/host.html (or your Mac's LAN IP, currently `192.168.0.28`)
Player: http://192.168.0.28:3000/player.html

- **v1** — Removed Stampede/Ambush Spot (random kills). Added Croc Ambush, Vulture's Mark, Locked Horns. Elimination-attempt items (Hyena Pack, Croc Ambush) now trigger a live 5s tap-contest fight (Strength-weighted, disconnect/tie-safe) instead of resolving instantly.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `6970274`

- **v2** — Fight results (win/loss) now render full death animations (collapse+fade, impact burst, stagger); every elimination ends with a "pride watches in silence" beat. Added icons for the 3 new items.
  Host: http://localhost:3000/host.html · Player: http://192.168.0.28:3000/player.html
  Commit: `678d829`
