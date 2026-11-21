# Fix round 2 — Pary (lead ran build + tests). LAST round, please be thorough.

Same session rules (no shell, absolute paths inside this workspace only, do not commit).
Build now passes and all old tests pass (good). 5 tests in `tests/holyhammer.test.js` still fail. Full failure output: `PARY_FAILURES2.txt` in this folder. Summary:

1. Test 2 "Relocate flag…": crashes `Cannot read properties of undefined (reading 'push')` at the harness `run` (holyhammer.test.js:40, called from :190) — the harness code you inject pushes into an array that does not exist in that context. Fix the test harness.
2. Test 5 "Relocation blocking": `Zerith bị chặn ngay mép vòng (~4.5), nhận d=8` — an outside relocation into / across the aura is NOT stopped at the aura edge on the server (the unit ends at 8 units). Implement the interception in the real server code path the Zerith dash uses (check where his position is set — e.g. `planReaperDash` / `member.x = to.x`), and for Jessica dash / backstep / shadow step and Lyra backstep too.
3. Test 6 "Brakk exemption": expected 100, actual 0 — Brakk's grab gets blocked or the test reads the wrong value. brakk_grab must not be affected at all.
4. Test 7 "Skill 3": YunYou is not pulled down / not allowed to take off again (expected true, actual false). Check the slam-3 handling on airborne YunYou against the spec and the swordsage flying code.
5. Test 10 "PvP mirror & right-side Skill 1 knockback": expected -46, actual 0 — Skill 1 knockback for a RIGHT-side Pary does not move the target to the left arena edge (2 units inside `ARENA_BOUNDS.minX`). Make the knockback direction/side symmetric.

Decide for each case whether the server code or the test is wrong, fix the right one (the spec in docs/superpowers/specs/2026-11-21-pary-design.md is the authority), update PARY_REPORT.md (section "Fix round 2"), and stop.
