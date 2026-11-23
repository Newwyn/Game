# Fix round 1 — Pary (lead ran build + tests)

Same session rules as PARY_TASK.md (no shell, absolute paths inside this workspace only, do not commit).

1. **Build fails**: `src/vfx/paryFx.js:13` imports `LIB` from `src/vfx/pixelFx.js`, which does not export it. Do not import LIB; call `spawnPixelFx('<name>', ...)` only with effect names already registered in that file (or register new ones there the same way existing ones are registered: import + add to the LIB map inside pixelFx.js).
2. **All 10 tests in `tests/holyhammer.test.js` crash** with `chessRoyalCommands is not defined`: your test harness (around line 114) lists `chessRoyalCommands, chessAfterAuto` among names it pulls from server.js, but those functions do not exist in server.js. Build the harness exactly like `tests/crosspriest.test.js` does (copy its harness function), only referencing names that really exist.
3. **Regression in `tests/swordsage.test.js` test 4** ("airborne miễn mọi đòn..."): assertion `thiếu buff đồng minh holy_shield trên YunYou đang bay` now fails — Seraphine's ally shield no longer lands on a flying YunYou. Something you changed in shield / status / relocation handling blocks ally buffs on airborne units. Find it (diff your server.js against how shields were applied before) and restore it; allies' heals / buffs / shields must still reach a flying YunYou.

Then re-check that `npm test` would pass (all 317 old tests + yours) by reading carefully, update PARY_REPORT.md (section "Fix round 1"), and stop.
