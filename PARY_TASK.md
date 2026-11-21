# Task — new hero PARY (goblin tank with a holy hammer): server rules, relocation blocking, tests, client hookup

Session rules: NO shell / terminal (any command attempt aborts the run). Use ABSOLUTE paths, and only paths INSIDE this workspace folder `C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary` (absolute paths inside it are fine and required by your file tools). Never open image files. Do NOT commit. The lead runs `npm test` (317 pass now) and `npx vite build` and tests in the game.

## Read first
- `docs/superpowers/specs/2026-11-21-pary-design.md` — the APPROVED design (Vietnamese). "người dùng chốt" = owner's decision, implement exactly; "(Claude đề xuất)" = starting numbers you use as given.
- Patterns to copy (do not invent new architecture):
  - `warrior` (Rok) in `server.js`: `knockback` skill (push, `knocked` status, landing stun), `taunt`, shields (`SHIELD_TYPES`), cast-time skills (`castTime`, `state = 'casting'`, cast interrupted by stun).
  - `wrestler` (Brakk): knock-up (`knockup` status), `ccImmune`, giant-form "cannot be pushed".
  - `swordsage` (YunYou): flying / untargetable logic (`isSwordAirborne`, `canBeTargeted`) — skill 3 slam 3 must pull a flying YunYou down for the stun duration then he flies again (spec §3, not the permanent "landed" state).
  - `crosspriest` (Caelum, newest): talents, `extra` events, tests in `tests/crosspriest.test.js` (vm harness) — copy that harness for the new test file.
  - `MONSTER_SCALE_HEROES` is pinned to the original heroes: do NOT add Pary.

## Build
1. **Class `holyhammer`** in `CLASS_DEFS`: name `Pary`, title `Búa Thánh` (or similar Vietnamese), race `goblin`, `classGroup: 'warrior'`, `dmgType: 'physical'`, melee. Tank stats: HP high, attack low, **highest defence in the game**: pDef 270, mDef 230 at level 1 (higher than Rok 220/160 and chess Xe 260/200). Shop price 1200. Add to `SQUAD_ORDER` (server and `src/ui/squadSelect.js` incl. `FALLBACK_HEROES`).
2. **Skill 1** (2.5 Orb = 2500 MP, cooldown 10 s): cast 2 s (spin the hammer) then a heavy smash on the target in front; the target is knocked back VERY far — to 2 units from the enemy-side arena edge (`ARENA_BOUNDS`, never outside), stunned 1 s on landing. Damage ×1.4 attack. During the 2 s cast: Pary takes 50% less damage AND is immune to all crowd control (cannot be stunned / knocked / interrupted). Targets that cannot be pushed (Brakk giant etc.) still take damage + stun, no flight.
3. **Skill 2 — Hào Quang Thánh Thần** (3 Orb, cooldown 15 s): aura around Pary, 6 s, radius 4.5.
   - Pary's shield = 8% max HP × (1 + 0.25 × N), N = number of units (allies + enemies, excluding Pary) inside the aura at cast time, max 5.
   - Each ALLY inside the aura at cast gets ONLY a shield = 0.5 × (Pary pDef + Pary mDef) × 6. All other effects are Pary's.
   - While the aura is up it blocks enemy RELOCATION (see 4). Each blocked relocation restores 15% of Pary's max aura shield (capped at that max).
4. **Relocation blocking (new mechanic, reusable)**:
   - Add a flag `relocate: true` to every skill that moves its caster to another spot: Jessica (`assassin`) Phóng Bùa (has `backstep`), Đột Kích (`dash: true`), her shadow-step talent move; Lyra (`archer`) Tiễn Gió Chớp (`backstep`); Zerith (`reaper`) dash skill(s); monster skills that pounce / dash. Brakk's `brakk_grab` leap is NOT relocation (owner's decision). Jumps that land on the same spot are not relocation.
   - While an enemy of Pary is inside an active aura: it cannot START a relocation skill (server refuses / AUTO does not pick it; `foeInReach`/`canUse` style). Expose a status on that unit, e.g. `{ type: 'relocate_lock' }`, refreshed each tick while inside, so the HUD can show it.
   - If an enemy relocation (from outside) would end inside or cross the aura: stop it at the aura edge, stun 1 s, count as "blocked" (restores Pary's shield), emit an event so the client can show "Bị chặn!".
5. **Skill 3** (4 Orb, cooldown 25 s): cast 2 s (NOT CC-immune during the cast — a stun cancels it like other cast skills). After the cast a giant holy hammer appears and Pary slams 3 times: slam 1 at end of cast, slam 2 +0.6 s, slam 3 +1.0 s after slam 2. During the 3 slams Pary is IMMUNE to crowd control (still takes damage normally).
   - Slams 1 and 2: enemies within radius 5 of Pary, ×0.6 attack, knock-up 0.4 s + stun 0.5 s.
   - Slam 3: ALL enemies on the whole field (that are alive), ×1.2 attack, knock-up then stun 1.5 s. A flying YunYou is also hit: he is brought down to the ground (hittable) for the stun duration, then flies again; this must NOT set his permanent "landed for the rest of the battle" state.
6. **Talents**: Talent 1 — every 3rd basic attack Pary throws her hammer at a random enemy in the back line (all targetable enemies except the one nearest to Pary; if only one enemy, that one), ×0.8 attack, stun 1 s, hammer returns, Pary gets a shield 6% max HP for 6 s. Talent 2 — for each enemy within 4.5 units of Pary: +8% pDef and +8% mDef, max 5 enemies (+40%), recomputed continuously (`getEffectiveStats`).
7. **Client**:
   - Use Rok's sprite (`warrior`) as a temporary placeholder for Pary in `src/characters/registry.js` and `src/characters/sprite/tiers.js` / `src/ui/heroPanel.js` `ART` maps (the lead will add drawn art later at `caelum`-style paths `src/assets/sprites/pary_sprite.webp` + `src/characters/sprite/parySprite.json`).
   - Skill / talent descriptions in Vietnamese with full diacritics in `src/ui/heroPanel.js` `SKILL_DESC`; status names in `src/ui/hud.js` (aura shield, relocation lock "🚫 Khoá dịch chuyển", talent 2 defence stacks, cast damage reduction / CC immunity).
   - In the hero panel, every skill with `relocate: true` (any hero) shows a small tag "↗ Dịch chuyển" next to its name.
   - Floating text "Bị chặn!" over the blocked unit (reuse the existing floating text / damage number helper).
   - Visual effects: prefer the vendored pixelfx library (`src/vfx/pixelFx.js` `LIB`) at normal pixel scale; keep them simple placeholders (aura ring, slam shockwave, hammer throw) — the lead will replace with drawn art. New file `src/vfx/paryFx.js` + an events handler in `src/combat/events.js`. Actions for the sprite: `attack`, `spin` (skill 1 cast), `smash`, `aura`, `slam` (skill 3), `throw` (talent 1).
8. **Tests** — new `tests/holyhammer.test.js` with the vm harness of `tests/crosspriest.test.js`: metadata (highest defence of all heroes), skill 1 cast timing + far knockback clamped inside the arena + landing stun + damage reduction and CC immunity during cast, skill 2 shield scaling with unit count (cap 5) + ally shield value + relocation lock status + a blocked dash (stopped at edge, stunned, shield restored), Brakk grab NOT blocked, skill 3 timeline (cast not immune / stun cancels it, 3 slams, radius for 1–2, whole field for 3, CC immune during slams, YunYou pulled down then flies again), talent 1 every 3rd attack hits a back-line enemy + shield, talent 2 defence stacking, AUTO uses all three skills, a long AUTO battle and a PvP mirror both end with a winner. Keep every existing test green.

## Rules
Vietnamese UI text; never `confirm()` / `alert()` / `prompt()`; no new npm packages; follow the existing style (Vietnamese comments). Do not touch `data/`.

Write `PARY_REPORT.md` in the workspace folder: files changed, final numbers, how relocation blocking works and how a new skill opts in (`relocate: true`), every placeholder, anything unverified, and that tests were not run by you. Then stop.
