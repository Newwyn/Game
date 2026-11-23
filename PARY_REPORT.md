# Báo cáo triển khai hero mới: **Pary — Búa Thánh (`holyhammer`)** & Hệ thống chặn dịch chuyển (`relocate: true`)

## 1. Các file đã thay đổi / thêm mới

### Server & Game Logic
- **`C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\server.js`**
  - Thêm `CLASS_DEFS.holyhammer` (Pary — Búa Thánh), đưa `'holyhammer'` vào `SQUAD_ORDER` (KHÔNG thêm vào `MONSTER_SCALE_HEROES`).
  - Gắn `relocate: true` lên toàn bộ kỹ năng / nội tại dịch chuyển vị trí:
    - Jessica (`assassin`): KN1 `Phóng Bùa` (`backstep: 5`), KN2 `Đột Kích` (`dash: true`), Thiên phú 1 `Bóng Ẩn` (`shadowStep.relocate = true`).
    - Lyra (`archer`): KN1 `Tiễn Gió Chớp` (`backstep: 3`).
    - Zerith (`reaper`): KN1 `Lưỡi Hái Xuyên Hồn` (`reaper_dash`).
    - Quái / trùm / triệu hồi lao-vồ: `sylva_wolf.pounceRelocate`, `chess_knight.relocate` (`fork` & `knightJump`), `BOSS_SKILLS` (`b_wolf.pounce`, `b_morwen.dash`, `b_vexa.dash`).
    - Giữ nguyên ngoại lệ **không** gắn `relocate: true` cho `wrestler` (`Brakk` — `Bá Vương Quật`) và các chiêu nhảy tại chỗ.
  - Cập nhật `heroPanelPayload` để gửi thêm `relocate: !!sk.relocate` xuống client.
  - Bổ sung hệ thống chặn dịch chuyển dùng chung (`relocateZonesFor`, `isRelocateLocked`, `syncRelocateLocks`, `segmentCircleIntercept`, `restoreAuraShieldOnBlock`, `checkRelocationBlock`), chặn từ `queueSkill`, `skillUsable`, `autoChooseSkill` và các nhánh thực thi trong `executeSkill`, `checkShadowStep`, `processBossSkills`, `sylvaAfterAuto`, `chessRoyalCommands.knight`, `chessAfterAuto`.
  - Cài đặt bộ kỹ năng & thiên phú của Pary (`castParySkill`, `paryAfterAuto`, `parySurroundDefBonus`, `parySpinOrColossusCcImmune`, `syncParyEffects`), nối vào `getEffectiveStats`, `calculateDamage`, `ccImmune`, `applyStun`, `startBattleLoop`, `killMember`, `processYunYou`, `SHIELD_TYPES`, `CROSS_REMOVABLE_BUFFS` và nhánh AI trong `autoChooseSkill`.
- **`C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\game\shop.js`**
  - Thêm `holyhammer: 1200` vào `PRICES` (giá mở bán trong Cửa hàng anh hùng = 1200 Kim Cương).

### Client UI, Character & VFX Placeholder
- **`C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\src\ui\squadSelect.js`**
  - Thêm `'holyhammer'` vào `SQUAD_ORDER` và `FALLBACK_HEROES`.
- **`C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\src\characters\sprite\tiers.js`**
  - Thêm `holyhammer: 'rok'` vào `ART` và đưa `holyhammer` vào nhánh fallback nếu thiếu atlas theo bậc.
- **`C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\src\characters\registry.js`**
  - Định nghĩa `HOLYHAMMER` kế thừa tạo hình tạm từ `ROK` và ánh xạ các hành động ngữ nghĩa (`attack`, `spin`, `smash`, `aura`, `slam`, `throw`) sang clip sẵn có của Rok (`attack`, `taunt`, `bash`, `fortress`); đăng ký `holyhammer` trong `CHARACTER_VISUALS`.
- **`C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\src\ui\heroPanel.js`**
  - Thêm `holyhammer: 'rok'` vào `ART`, thêm mô tả tiếng Việt chi tiết trong `SKILL_DESC.holyhammer`, và tự động hiển thị thẻ `"↗ Dịch chuyển"` cạnh tên mọi kỹ năng có `relocate: true` (cho tất cả các tướng).
- **`C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\src\ui\hud.js`**
  - Làm mờ & vô hiệu hoá nút kỹ năng có `relocate: true` khi tướng đang mang hiệu ứng `relocate_lock`, kèm tooltip `"🚫 Khoá dịch chuyển"`.
  - Bổ sung icon & chú thích trạng thái trong `effectInfo` (`relocate_lock`, `holy_aura`, `holy_aura_shield`, `holy_aura_ally_shield`, `pary_throw_shield`, `pary_surround_def`, `pary_spin_guard`, `pary_colossus`) và thêm `'relocate_lock'`, `'pary_surround_def'` vào `AURA_EFFECTS`.
- **`C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\src\vfx\paryFx.js`** *(file mới)*
  - Hiệu ứng placeholder bằng Three.js / `pixelFx.js` / `vfx.js` cho: gồng xoay búa, vòng hào quang 4.5 đơn vị bám theo Pary, sóng va đập 3 nhịp búa khổng lồ, búa bay đi–về của Thiên phú 1, và chữ nổi `"🚫 Bị chặn!"` khi chặn dịch chuyển.
- **`C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\src\combat\events.js`**
  - Nối `holy_smash`, `holy_aura`, `holy_colossus` trong `onSkillExecuted`, `onCastStart`, đăng ký sự kiện `paryFx`, dọn hiệu ứng ở `battleEnd`/`mainMenu`, và export `onParyFx` vào `__fxTest`.

### Kiểm thử
- **`C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\tests\holyhammer.test.js`** *(file mới)*
  - Test harness VM độc lập cho toàn bộ thông số cơ bản, Shop/Squad, KN1–3, hai Thiên phú, hệ thống khoá/chặn dịch chuyển (`relocate: true` + ngoại lệ Brakk), kéo YunYou đang bay xuống ở nhịp 3 rồi bay lại, và trận PvP gương (Pary vs Pary).

---

## 2. Thông số cuối cùng của Pary (`holyhammer`)
- **Thông tin chung**: `name: 'Pary'`, `title: 'Búa Thánh'`, `className: 'Chiến Binh'`, `race: 'goblin'`, `classGroup: 'warrior'`, `dmgType: 'physical'`, `range: 'melee'`, `shopPrice: 1200`.
- **Chỉ số gốc trước tộc -> sau tộc Goblin ở Lv1 (bậc Thường)**:
  - `maxHp`: `3900` → **`3510`** (sau hệ số máu ×0.9 của Goblin; cao hơn Rok `3200`)
  - `pAtk`: **`95`** (công thấp, dưới Rok `150`), `mAtk: 0`
  - `pDef`: **`270`**, `mDef`: **`230`** (cao nhất game ở Lv1: vượt Rok `220/160` và quân Xe `260/200`)
  - `crit: 50` (+100 từ tộc Goblin = `150`), `pen: 0` (+100 từ tộc Goblin = `100`), `block: 200`, `dodge: 50`, `atkSpeed: 1200`, `atkRange: 2.3`, `moveSpeed: 0.01` (×1.1 Goblin = `0.011`), `mpAtk: 220`, `mpSec: 110`.
- **Kỹ năng 1 — `Búa Thánh Phán Quyết`** (`2.5 Orb`, hồi `10s`, niệm `2s`, tầm `2.8`):
  - Trong `2s` niệm (`spin`): giảm `50%` sát thương nhận (`castDmgReduce: 0.5`) và **miễn khống chế** (`castCcImmune: true`).
  - Niệm xong (`smash`): gây `×1.4` công lên mục tiêu phía trước, hất văng tới cách biên sân địch `2` đơn vị (`ARENA_BOUNDS.maxX - 2` hoặc `ARENA_BOUNDS.minX + 2`, không bao giờ vượt ngoài sân) và làm choáng `1s` khi đáp đất. Mục tiêu không thể đẩy (như Brakk Khổng Lồ) không bay nhưng vẫn chịu `×1.4` sát thương và choáng `1s` (`noCleanse`).
- **Kỹ năng 2 — `Hào Quang Thánh Thần`** (`3 Orb`, hồi `15s`, dùng ngay, hiệu lực `6s`, bán kính `4.5`):
  - Hào quang đi chuyển theo Pary trong `6s`.
  - Khiên Pary = `8% maxHp × (1 + 0.25 × N)`, với `N` = số đơn vị (đồng minh + địch, trừ Pary) đứng trong vòng `4.5` lúc bật, tối đa `N = 5` (tối đa `18% maxHp`).
  - Đồng minh đứng trong vòng lúc bật **chỉ** nhận khiên `6s` = `0.5 × (pDef hiệu dụng + mDef hiệu dụng) × 6` (mọi hiệu ứng hào quang & hồi khiên chỉ thuộc về Pary).
  - Khoá dịch chuyển địch trong vòng và chặn mọi pha dịch chuyển từ ngoài vào hoặc băng qua vòng; mỗi lần chặn thành công hồi lại `15%` lượng khiên tối đa của Hào quang cho Pary (trần ở `shieldMax`).
- **Tuyệt kỹ (KN3) — `Búa Thánh Khổng Lồ`** (`4 Orb`, hồi `25s`, niệm `2s`, tầm `5`):
  - Trong `2s` niệm: **không** miễn khống chế (bị choáng sẽ mất chiêu).
  - Sau khi niệm xong: đập `3` nhịp tại `+0s`, `+0.6s`, `+1.6s` (suốt 3 nhịp Pary **miễn khống chế**, vẫn nhận sát thương bình thường):
    - Nhịp 1 & 2: địch trong bán kính `5`, gây `×0.6` công, hất tung `0.4s` + choáng `0.5s`.
    - Nhịp 3: **toàn bộ địch còn sống trên sân**, gây `×1.2` công, hất tung (`0.6s`) + choáng `1.5s`; kéo được cả YunYou đang bay xuống đất (`airborne = false`, **không** set `swordGrounded`) để đồng đội/kỹ năng đánh trúng suốt thời gian choáng rồi YunYou tự bay lên lại sau khi hết choáng.
- **Thiên phú 1 (Lv20) — `Búa Bay Hậu Tuyến`**:
  - Mỗi đòn đánh thường thứ `3`: ném búa vào `1` kẻ địch ngẫu nhiên chọn được ở tuyến sau (loại trừ kẻ địch gần Pary nhất; nếu chỉ còn `1` địch chọn được thì ném chính kẻ đó), gây `×0.8` công + choáng `1s`; búa bay về cho Pary khiên `6% maxHp` trong `6s`.
- **Thiên phú 2 (Lv40) — `Hộ Giáp Bủa Vây`**:
  - Tăng `+8% P.DEF` và `+8% M.DEF` cho mỗi kẻ địch còn sống trong bán kính `4.5` quanh Pary (tối đa `5` địch = `+40%`), tính động mỗi lần đọc `getEffectiveStats`.

---

## 3. Cơ chế chặn dịch chuyển dùng chung & cách kỹ năng mới tham gia
1. **Cách một kỹ năng / nội tại mới tham gia (`opt-in`)**:
   - Chỉ cần gắn thuộc tính **`relocate: true`** lên object định nghĩa kỹ năng trong `CLASS_DEFS` (hoặc `BOSS_SKILLS` / cấu hình hành động di chuyển vị trí).
   - Giao diện `heroPanelPayload` + `heroPanel.js` tự động gắn nhãn **`"↗ Dịch chuyển"`** cạnh tên kỹ năng đó; `hud.js` tự động làm mờ/khoá nút khi có trạng thái `relocate_lock`.
2. **Cách hoạt động theo trạng thái vùng chặn**:
   - Truy vấn động qua `relocateZonesFor(room, unitPid, now)`: gom tất cả hiệu ứng đang hoạt động có `{ blocksRelocate: true, radius }` trên đơn vị còn sống thuộc phe đối địch (hiện tại là `holy_aura` của Pary). Bất kỳ tướng mới nào sau này tạo vùng có `{ blocksRelocate: true, radius }` đều dùng chung pipeline mà không cần sửa logic chặn.
   - **Đứng sẵn trong vùng**: mỗi tick `syncRelocateLocks` gắn/làm mới `relocate_lock` (tự xoá ngay khi rời vùng, hết giờ, hoặc chủ vùng tử trận). Khi có `relocate_lock`, `queueSkill`, `skillUsable`, `autoChooseSkill` và các điểm kích hoạt di chuyển từ chối khởi tạo chiêu `relocate: true`.
   - **Từ ngoài nhảy vào hoặc lướt xuyên qua vùng**: nơi thực thi tính đoạn đường XZ `from -> to` qua `checkRelocationBlock(room, relocatorPid, relocator, from, to, now)` (dùng `segmentCircleIntercept`). Nếu đoạn cắt vùng chặn sớm nhất:
     1. Dừng người dịch chuyển ngay sát mép vòng (`R + 0.02`, clamp trong `ARENA_BOUNDS`).
     2. Làm choáng `1s`.
     3. Gọi `restoreAuraShieldOnBlock` hồi `15%` khiên tối đa cho chủ vùng.
     4. Phát sự kiện `paryFx` (`kind: 'relocateBlocked'`, `text: 'Bị chặn!'`) để client hiển thị chữ nổi và loé khiên.

---

## 4. Toàn bộ tài nguyên tạm (Placeholder)
- **Tạo hình & chân dung (`holyhammer`)**: dùng tạm tạo hình Rok (`warrior` — `ROK_SPRITE` / `rokRig` / chân dung Rok) trong `tiers.js`, `registry.js`, `heroPanel.js`.
- **Animation clip mapping (`HOLYHAMMER.anims`)**:
  - `attack` → `attack` (`hitTime: 0.24`)
  - `spin` → `taunt`
  - `smash` → `bash` (`hitTime: 0.22`)
  - `aura` → `fortress` (`hitTime: 0.12`)
  - `slam` → `bash` (`hitTime: 0.22`)
  - `throw` → `attack` (`hitTime: 0.24`)
- **Icon kỹ năng (`heroPanel.js` & `hud.js`)**: chưa có file `src/assets/skills/holyhammer_*.webp`; giao diện vẫn an toàn vì `SKILL_ART[...]` kiểm tra có ảnh mới vẽ nền.
- **VFX (`src/vfx/paryFx.js`)**: vẽ vòng hào quang, búa đập từ trên xuống, búa xoay bay đi–về và chữ nổi `"🚫 Bị chặn!"` bằng Three.js / Canvas kết hợp `pixelFx.js` (`scifi/force-field`, `impacts/heavy-landing`, `lightning/zap-hit`) và `spawnShockwave`.

---

## 5. Fix round 1 (đợt sửa sau build/test từ nhóm trưởng)
1. **Lỗi build Vite ở `src/vfx/paryFx.js` (`LIB` không được export từ `pixelFx.js`)**:
   - Đã sửa `C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\src\vfx\paryFx.js`: xoá import `LIB` khỏi `'./pixelFx.js'`, giữ các tên hiệu ứng đã đăng ký sẵn trong `pixelFx.js` (`'scifi/force-field'`, `'impacts/heavy-landing'`, `'lightning/zap-hit'`) và gọi trực tiếp `spawnPixelFx(candidates[0], opts)` trong `safePixelFx` bọc `try/catch`.
2. **Lỗi harness ở `tests/holyhammer.test.js` (`ReferenceError: chessRoyalCommands is not defined`)**:
   - Đã viết lại `C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\tests\holyhammer.test.js` theo đúng mẫu `harness()` / `arena()` / `realLoop()` của `tests/crosspriest.test.js` (chạy trực tiếp `server.js` trong `vm.createContext` và truy xuất hàm nội bộ qua `h.run(...)`, không dùng `globalThis.__test` nên không phụ thuộc danh sách export tên hàm). Đồng thời sửa chữ ký `P.computeStats(def, { level, rank })` và dùng `createSquad` để giữ nguyên tộc/thiên phú.
3. **Lỗi hồi quy ở `tests/swordsage.test.js` test 4 (`thiếu buff đồng minh holy_shield trên YunYou đang bay`)**:
   - **Nguyên nhân gốc**: Trong `executeSkill` tại `C:\Users\Admin\Desktop\legend-of-capsules\.team\wt\pary\server.js` (dòng ~4203), điều kiện `else if (skillDef.type?.startsWith('holy_'))` đã bắt nhầm kỹ năng 1 của Tu Sĩ Seraphine (`type: 'holy_shield'`) trước khi luồng chạy tới nhánh `else if (skillDef.type === 'heal' || skillDef.type === 'holy_shield')` ở phía dưới (~4497), khiến `castParySkill` nuốt mất lượt buff `holy_shield`.
   - **Cách sửa**: Thay bằng khớp chính xác 3 loại kỹ năng của Pary (`skillDef.type === 'holy_smash' || skillDef.type === 'holy_aura' || skillDef.type === 'holy_colossus'`).
   - **Củng cố thêm**: Đổi `skillDef?.relocate` mang tính phòng thủ ở `executeSkill`, và đặt kiểm tra hết đồng đội (`if (!hasAlly)`) trước nhánh kiểm tra choáng/hất tung trong `processYunYou` để nếu đồng đội cuối cùng chết trong lúc YunYou đang bị choáng bởi Nhịp 3 thì YunYou vẫn hạ cánh hẳn.

---

## 6. Điểm chưa thể tự xác minh & trạng thái chạy kiểm thử
- **Lưu ý quan trọng**: Phiên làm việc này vẫn tuân thủ ràng buộc không chạy lệnh terminal/shell nên **chưa tự chạy `npm test` (bao gồm `tests/holyhammer.test.js` và bộ test 317 ca sẵn có) và chưa tự chạy `npx vite build`**.
- **Đã tự kiểm tra tĩnh sau Fix round 1**:
  - Đọc đối chiếu trực tiếp toàn bộ `src/vfx/paryFx.js` (xác nhận chỉ import `spawnPixelFx` từ `./pixelFx.js` và đúng tên hiệu ứng `'scifi/force-field'`, `'impacts/heavy-landing'`, `'lightning/zap-hit'`).
  - Đối chiếu các vị trí đã sửa trong `server.js` (`executeSkill` ~3917 & ~4203, `processYunYou` ~7861) và toàn bộ 10 test case mới trong `tests/holyhammer.test.js` theo đúng mô hình VM của `tests/crosspriest.test.js`.
  - Xác nhận không chỉnh sửa `data/` và không sử dụng đường dẫn tương đối hay lệnh mạng/shell.
- **Đề xuất bước xác minh tiếp theo của nhóm trưởng**:
  1. Chạy `npx vite build` để kiểm tra đóng gói client ES modules (`src/vfx/paryFx.js`).
  2. Chạy `npm test` (hoặc `node --test tests/*.test.js`) để xác nhận toàn bộ 317 test sẵn có (đặc biệt `tests/swordsage.test.js` test 4) + 10 test trong `tests/holyhammer.test.js` đều PASS.

---

## 7. Fix round 2 (xử lý 5 ca fail còn lại trong `tests/holyhammer.test.js`)
Đối chiếu trực tiếp [PARY_FAILURES2.txt](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/pary/PARY_FAILURES2.txt), [2026-11-21-pary-design.md](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/pary/docs/superpowers/specs/2026-11-21-pary-design.md), [progression.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/pary/progression.js) và [server.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/pary/server.js), tất cả 5 ca fail đều bắt nguồn từ giả định chỉ số / API trong [tests/holyhammer.test.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/pary/tests/holyhammer.test.js) (build Vite và 317 test sẵn có đã PASS ở vòng trước; các đường dẫn chặn dịch chuyển, ngoại lệ Brakk, kéo/bay lại YunYou và hất văng đối xứng phía `server.js` đã khớp đặc tả):

1. **Test 2 (`Relocate flag…`) — `Cannot read properties of undefined (reading 'push')`**:
   - **Nguyên nhân**: `P.defaultProgress(HERO_IDS())` chỉ trả `{ heroes, items }` (không có `owned`; mảng `owned` được `C.ensureCampaign` tạo trong `progressOf`).
   - **Cách sửa**: Gọi `progressOf('test_panel')` thay cho `P.defaultProgress(HERO_IDS())` trước khi đưa `'assassin'`, `'holyhammer'` vào `pr.owned` và gọi `heroPanelPayload(pr)`.
2. **Test 5 (`Relocation blocking`) — `Zerith d=8`**:
   - **Nguyên nhân**: `createSquad` sắp đội theo `SQUAD_ORDER` (`assassin` → `archer` → `reaper`, và `priest` → `holyhammer`), nên dùng chỉ số cứng `0 / 1 / 2` trong test đã gọi nhầm `assassin` (`Phóng Bùa` lùi) thay vì `zerith` (`idx = 2`), gọi nhầm `archer` thay vì `jessOut`, và `targetIndex = 1` trỏ vào `pary` thay vì `sera` (`idx = 0`). Về phía server, cả 5 đường dẫn dịch chuyển ngoài vào/xuyên qua (`reaper_dash`, `dash` của Jessica, `backstep` của Jessica `projectile`, `backstep` của Lyra `snipe`, và `shadowStep`) đều đã gọi `checkRelocationBlock`.
   - **Cách sửa**: Dùng `foes.indexOf(...)` / `team.indexOf(...)` cho toàn bộ chỉ số trong Test 5, và kiểm tra thêm ca Jessica `Phóng Bùa` (`backstep: 5`) bị chặn từ ngoài vào.
3. **Test 6 (`Brakk exemption`) — `0 !== 100`**:
   - **Nguyên nhân**: `brakk_grab` không bị chặn (chỉ số `brakk.x` thay đổi và không bị choáng đều PASS), nên Brakk lao vào đánh thẳng Pary và `calculateDamage` trừ sát thương hấp thụ trực tiếp vào `sh.hp` (`100` → `0`).
   - **Cách sửa**: Đặt `sh.hp = 5000; sh.maxHp = 5000` (lớn hơn sát thương cú quật) và dùng `foes.indexOf(brakk)`, đồng thời khẳng định `aura.blockedCount === 0`, `sh.hp < 5000 && sh.hp > 0` (chỉ hấp thụ sát thương, không hề hồi +15% khiên) và không có `relocateBlocked`.
4. **Test 7 (`Skill 3` — YunYou bay lại `false !== true`)**:
   - **Nguyên nhân**: `foeHeroes: ['swordsage', 'priest', 'mage']` được `createSquad` xếp theo `SQUAD_ORDER` thành `[priest, mage, swordsage]`, nên YunYou nằm ở chỉ số `2`, nhưng test lại gọi `processYunYou(room, 'p2', 0, ...)` lên `priest` (`idx = 0`). Kiểm tra lại `processYunYou` (`server.js:7848-7875`) và Nhịp 3 `holy_colossus` (`server.js:8343-8353`): đã đúng đặc tả (không đặt `swordGrounded`, đặt `swordPullRestore = true`, choáng 1.5s rồi tự bay lên lại).
   - **Cách sửa**: Lấy `var YI = foes.indexOf(yunyou)` và truyền `YI` vào cả hai lệnh `processYunYou`.
5. **Test 10 (`PvP mirror & right-side Skill 1`) — `0 !== -46`**:
   - **Nguyên nhân**: `allies: ['warrior']` xếp `warrior` trước `holyhammer` trong `team` (`team[0] = warrior`, `team[1] = pary`), nên gán `rightPary.targetIndex = 1` đã nhắm vào `pary` (`-40`) thay vì `targetLeft` (`idx = 0`). Hàm `castParySkill` (`server.js:8253-8256`) đã tính `enemyIsRight = false` và `ARENA_BOUNDS.minX + 2 = -46` chuẩn cho phe Phải.
   - **Cách sửa**: Dùng `team.indexOf(targetLeft)` cho `rightPary.targetIndex` và `foes.indexOf(rightPary)` khi gọi `executeSkill`.

### Trạng thái kiểm chứng sau Fix round 2
- **Chưa tự chạy lệnh kiểm thử**: Do ràng buộc không chạy shell/terminal trong phiên này, **chưa tự chạy `npm test` (317 test sẵn có + 10 ca trong `tests/holyhammer.test.js`)** sau vòng sửa 2.
- **Đã tự kiểm tra tĩnh**: Đối chiếu toàn bộ các vị trí sửa trong [tests/holyhammer.test.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/pary/tests/holyhammer.test.js) theo đúng thứ tự `SQUAD_ORDER` và luồng `server.js` thực tế. Nhờ nhóm trưởng chạy `npm test` (và `npx vite build` nếu cần xác nhận lại) để chốt 10/10 ca `holyhammer.test.js`.
