# Caelum — fix pass 1 (the lead ran build + tests)

Same session rules (no shell; paths inside this workspace; no image files; do not commit).

1. **Build fails**: `src/ui/dragCast.js (12:19): "ARENA_BOUNDS" is not exported by "src/config.js"`. Use what really exists (read `src/config.js` and how the server / other client code know the battlefield bounds), or define the bounds locally from the same constants the server uses. Check every other import you added in client files against the real exports.
2. **4 failing tests** (314 total, 310 pass) — full details in `.team/failures-1.txt`. Read them and fix the CODE where it contradicts the spec (`docs/superpowers/specs/2026-11-20-caelum-design.md` + `CAELUM_TASK.md`), or the test where the test is wrong:
   - 103 "metadata, roster, shop, stats and monsterScale isolation": an assertion is false.
   - 105 "level progression 1->2->3, expiration at 30s and 5th-cross inheritance": expected level 3, actual 2.
   - 109 "Talents 1 & 2": expected 4000, actual 5000.
   - 110 "socket handlers, AUTO crossType selection and PvP mirror termination": TypeError `Cannot read properties of undefined (reading 'auth')` — the test harness socket mock lacks what the handler reads; mirror how other tests build sockets (search `handshake` / `auth` in tests/).
Append a "Fix pass 1" section to `CAELUM_REPORT.md`. Then stop.
