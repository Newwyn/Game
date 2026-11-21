# CAELUM (`crosspriest`) — Báo cáo triển khai

> **LƯU Ý QUAN TRỌNG VỀ KIỂM TRA:** Trong phiên làm việc này, mọi lệnh shell/terminal đều bị cấm theo quy tắc tác vụ (`no shell/terminal`). Vì vậy **chúng tôi CHƯA chạy `node --test` (cả 306 test có sẵn lẫn `tests/crosspriest.test.js`) và CHƯA chạy `npm run build` / kiểm tra trình duyệt trực tiếp**. Mọi logic đều đã được rà soát tĩnh bằng tay; cần người dùng/CI chạy kiểm tra thực tế.

---

## 1. Danh sách tệp đã thêm / sửa

### Máy chủ & dữ liệu anh hùng
- [server.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/server.js)
  - Khai báo `CLASS_DEFS.crosspriest`, thêm `'crosspriest'` vào `SQUAD_ORDER` (giữ nguyên `MONSTER_SCALE_HEROES` không đổi để không làm lệch sức mạnh quái cốt truyện).
  - Khởi tạo `m.crossType = 1` và `m.crosses = []` trong `createSquad`; thêm `'cross_shield'` vào `SHIELD_TYPES`.
  - Thêm socket `'setCrossType'` (1..4) và mở rộng `'queueSkill'` hỗ trợ tuỳ chọn `point: { x, z }` + `crossType` (kéo điểm mới ghi đè điểm cũ thay vì tắt hàng đợi).
  - Cập nhật `getEffectiveStats`, `ccTime`, `calculateDamage`, `dealDamage`, `killMember`, `healCutOf`, `orbRegenMult`, `foeInReach`, `isSelfBuff`, `executeSkill`, `autoChooseSkill`.
  - Thêm cụm hàm xử lý Caelum: đặt/nâng cấp/hết giờ/thay cây thứ 5, tác dụng 4 loại Thánh giá (quy tắc cộng dồn: chỉ **sát thương sét loại 3** và **hồi máu loại 1** cộng dồn khi chồng lấn, mọi hiệu ứng khác lấy cấp cao nhất), `Thánh Ca` (KN2), `Thần Quang` (KN3), Thiên phú 1 & Thiên phú 2, tự chọn vị trí + AI `AUTO`, dọn sạch khi hết trận / reset / về menu.
- [game/shop.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/game/shop.js)
  - Thêm giá bán `crosspriest: 1200` vào `PRICES`.

### Hệ thống kéo thả dùng chung & giao diện chiến đấu / hiệu ứng
- [src/ui/dragCast.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/ui/dragCast.js) *(tệp mới)*
  - Module kéo thả kỹ năng chọn điểm tổng quát bằng Pointer Events (hỗ trợ chuột & cảm ứng, không dừng trận).
- [src/vfx/crossFx.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/vfx/crossFx.js) *(tệp mới)*
  - Bảng vẽ Thánh giá 4 loại & Đại Thánh Giá (tự dò ảnh `caelum_cross_1..4.webp` / `caelum_cross_big.webp` qua `import.meta.glob`, thiếu thì vẽ quad thay thế), vòng vùng tác dụng mảnh nhẹ + đốm sáng, hiệu ứng `pixelfx` ở tỉ lệ chuẩn (`src/vfx/pixelFx.js`), đăng ký tuỳ biến xem trước kéo thả cho `cross_place`.
- [src/net/socket.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/net/socket.js): Mở rộng `net.queueSkill` nhận payload phụ và thêm `net.setCrossType`.
- [src/ui/input.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/ui/input.js): Khởi tạo `initDragCast`, chặn double-click sau thao tác kéo/bấm nhanh bằng `consumeDragClickSuppression`.
- [src/ui/hud.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/ui/hud.js): Khay 4 nút chọn loại Thánh giá trên thẻ Caelum (`Sinh Mệnh`, `Uy Lực`, `Sấm Sét`, `Thanh Tẩy`), đếm số Thánh giá `x/4` trên KN1, gắn class `drag-target`, thêm `effectInfo` cho các buff/debuff của Caelum, đồng bộ `foeNear` theo tầm đặt 14.
- [src/combat/events.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/combat/events.js): Xử lý `cross_place` / `cross_hymn` / `cross_radiance` trong `onSkillExecuted`, đạn ánh sáng đánh thường cho `crosspriest`, lắng nghe `'crossFx'`, dọn `clearCrossFx()` & `cancelDragCast()` khi bắt đầu/kết thúc trận.
- [src/characters/registry.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/characters/registry.js): Đăng ký `crosspriest: () => PRIEST` (dùng tạm sprite Seraphine).
- [src/characters/sprite/tiers.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/characters/sprite/tiers.js): Thêm `crosspriest: 'seraphine'` trong `ART`.
- [src/vfx/pixelFx.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/vfx/pixelFx.js): Thêm `crosspriest: ['custom/cast-flash', 'holy']` trong `HERO_SWING`.
- [src/ui/heroPanel.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/ui/heroPanel.js): Thêm `crosspriest` vào `ART` và mô tả tiếng Việt 3 kỹ năng trong `SKILL_DESC`.
- [src/ui/squadSelect.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/ui/squadSelect.js): Thêm `'crosspriest'` vào `SQUAD_ORDER` và `FALLBACK_HEROES`.
- [src/styles/index.css](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/styles/index.css) & [src/styles/battle-mobile.css](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/styles/battle-mobile.css): Kiểu dáng cho `.cross-tray`, `.drag-target`, `.dragging-skill`, `.drag-cancel` trên desktop & mobile.

### Kiểm thử
- [tests/crosspriest.test.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/tests/crosspriest.test.js) *(tệp mới)*: Bộ test `node:test` dùng harness `node:vm` kiểm tra toàn bộ cơ chế máy chủ.

---

## 2. Thông số cuối cùng của Caelum (`crosspriest`)

### Thông tin & chỉ số nền
- **Tên / Danh hiệu / Nghề / Tộc / Nhóm:** `Caelum` · `Thánh Giá` · `Tu Sĩ` · `Elf` · `classGroup: 'priest'` · `dmgType: 'magic'` · `range: 'ranged'` · giá cửa hàng: **1200 Kim Cương**.
- **Chỉ số Lv1 (nền `CLASS_DEFS`, trước cộng tộc Elf):**
  - `maxHp: 1040`, `maxMp: 5000` (5 Orb), `pAtk: 0`, `mAtk: 190`, `pDef: 42`, `mDef: 88`
  - `crit: 100` (10%), `critDmg: 500` (+50%), `acc: 1000`, `dodge: 110`, `pen: 20` (2%), `block: 0`, `lifesteal: 0`
  - `mpAtk: 240`, `mpSec: 155`, `atkSpeed: 1050`, `atkRange: 10`, `moveSpeed: 0.01`, `autoHitFrame: 2`, `autoImpact: 470`
  - *(Tộc Elf tự cộng +12% Chính xác, +8% Né tránh, ×1.1 MP/đòn & MP/giây; tăng cấp theo bảng `priest` trong `progression.js`.)*

### Kỹ năng 1 — `Thánh Giá` (`cross_place`)
- **Giá / Hồi chiêu / Tầm đặt:** **2 Orb** · **5s** (`5000 ms`) · tầm đặt **14** đơn vị quanh Caelum (kẹp vào `ARENA_BOUNDS`: `x ∈ [-48, 48], z ∈ [-13, 13]`).
- **Giới hạn & tiến cấp:** Tối đa **4** cây; cây mới cấp **1 → 2** sau **10s**, **2 → 3** sau **10s**, cấp **3** tồn tại thêm **10s** rồi hết. Bán kính cấp 1/2/3 = **3 / 3.6 / 4.2**.
- **Cây thứ 5 thay cây cũ nhất:** Kế thừa `level` và thời gian còn lại (nếu thay cây đang cấp **3** thì nhận lại **10s** mới). Không thể bị nhắm hay nhận sát thương.
- **Hệ số tăng theo bậc (Rank 0 / S / SS / SSS):**
  - `powerScale` (hồi máu, sát thương sét, khiên): `[1.00, 1.15, 1.32, 1.50]`
  - `statScale` (Uy Lực ±ATK/DEF/atkSpeed): `[1.00, 1.08, 1.16, 1.25]`
- **4 loại theo cấp Thánh giá `[Lv1, Lv2, Lv3]`:**
  1. **Loại 1 — `Sinh Mệnh`** *(chu kỳ xung 2s)*:
     - Đồng đội: hồi máu `(0.32 / 0.45 / 0.60 × M.ATK + 2% / 3% / 4% maxHP) × powerScale` (**cộng dồn** khi nhiều cây chồng lấn) + tăng **0.20 / 0.28 / 0.36 Orb** (không cộng dồn).
     - Địch: giảm hồi máu nhận **30% / 40% / 50%**, giảm tốc hồi Orb **25% / 35% / 45%**, trừ **0.14 / 0.20 / 0.28 Orb** mỗi xung 2s (tất cả lấy cấp cao nhất, không cộng dồn).
  2. **Loại 2 — `Uy Lực`** *(hào quang liên tục, lưu lại 1s sau khi rời vùng — không cộng dồn)*:
     - Đồng đội: **+(12% / 16% / 22%) × statScale** ATK, DEF và tốc đánh.
     - Địch: **−(10% / 14% / 18%) × statScale** ATK, DEF và tốc đánh.
  3. **Loại 3 — `Sấm Sét`** *(chu kỳ 1s)*:
     - Đồng đội: không tác động (`—`).
     - Địch: chọn ngẫu nhiên 1 địch trong vùng giật sét phép `(0.65 / 0.90 / 1.20) × M.ATK × powerScale` (**cộng dồn** khi chồng lấn) + choáng **0.5s** (miễn choáng **2s** cho từng mục tiêu sau mỗi lần bị giật).
  4. **Loại 4 — `Thanh Tẩy`** *(giải/gỡ 3s, khiên 5s, giảm kháng hiệu ứng liên tục — không cộng dồn)*:
     - Đồng đội: khiên `(0.60 / 0.85 / 1.15 × M.ATK + 6% / 8% / 11% maxHP) × powerScale` trong 5s (chu kỳ 5s) + giải hiệu ứng xấu (`cleanse`, chu kỳ 3s).
     - Địch: gỡ **1 / 1 / 2** buff có lợi (`stripBuffs`, chu kỳ 3s) + giảm kháng hiệu ứng **25% / 35% / 45%** (giảm `tenacity` tới `125/175/225`, giảm hiệu lực `ccResist` và tăng thời gian khống chế nhận vào `+25% / +35% / +45%`).

### Kỹ năng 2 — `Thánh Ca` (`cross_hymn`)
- **Giá:** **2 Orb** · **Hồi chiêu theo bậc `[Thường, S, SS, SSS]`:** `7.0s / 6.2s / 5.5s / 4.8s`.
- **Tác dụng:** Kích hoạt hiệu ứng của toàn bộ Thánh giá KN1 đang có **3 lần** ngay lập tức; Thánh giá `< Lv3` giảm **4s** tới lần lên cấp kế (cộng dồn phần thời gian dư nếu vượt ngưỡng lên cấp); Thánh giá `Lv3` được **+4s** thời gian tồn tại.

### Kỹ năng 3 — `Thần Quang` (`cross_radiance`)
- **Giá / Hồi chiêu / Thời gian:** **4 Orb** · **20s** · tồn tại **10s** tại trung tâm sân `(0, 0)`, tác dụng toàn bản đồ, **không tính** vào giới hạn 4 cây, **bị huỷ ngay nếu Caelum tử trận** (mà không hồi sinh).
- **Buff / Debuff & Thần Phạt theo bậc `[Thường, S, SS, SSS]`:**
  - Đồng đội: **+15% / +18% / +22% / +25%** Tấn công (pAtk/mAtk) & Phòng thủ (pDef/mDef) suốt 10s.
  - Mỗi **1s** (tổng 10 phát): Thần Phạt lên toàn bộ địch gây `0.55 / 0.65 / 0.78 / 0.92 × M.ATK` sát thương phép, giảm **15% / 17% / 20% / 22%** sát thương địch gây ra, giảm **15% / 18% / 22% / 25%** P.DEF & M.DEF (duy trì 2.5s), và xoá **1** hiệu ứng có lợi.
  - Mỗi phát **thứ 5** (phát #5 và #10): phát nổ thêm `1.40 / 1.65 / 1.95 / 2.30 × M.ATK` sát thương phép lên mọi địch và giải toàn bộ hiệu ứng xấu cho đồng đội.

### Thiên phú
- **Thiên phú 1 (mở Lv20) — `Ánh Sáng Thống Nhất`:** Mỗi Thánh giá KN1 đang tồn tại trên sân tăng **+4% Tấn công** cho cả đội (tối đa 4 cây = **+16%**).
- **Thiên phú 2 (mở Lv40) — `Thánh Giá Hiến Tế`:** Mỗi Thánh giá KN1 kết thúc (bị thay thế hoặc hết giờ) hoàn **1 Orb** cho Caelum; khi Caelum tử trận và hồi chiêu **30s** đã sẵn sàng, toàn bộ Thánh giá KN1 còn lại bay về hồi sinh Caelum với **20% máu tối đa mỗi cây** (tối đa **80%**) và bị tiêu thụ hết (không hoàn Orb cho phần bị tiêu thụ; không có cây thì không hồi sinh).

---

## 3. Cơ chế Kéo Thả Kỹ Năng (`src/ui/dragCast.js`) & Cách hero khác sử dụng

### Cách hoạt động
1. `initDragCast(...)` gắn listener `pointerdown` toàn cục lên `#combat-hud [data-skill]` trong [src/ui/input.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/ui/input.js).
2. Khi người chơi nhấn vào nút kỹ năng: kiểm tra `skillDef.dragTarget`. Nếu không có -> bỏ qua hoàn toàn, hành vi click truyền thống của mọi tướng khác không đổi.
3. Nếu di chuyển con trỏ `< 10px` rồi thả (bấm nhanh): gọi `onQuickTap`, gửi `queueSkill(memberIndex, skillIndex)` **không kèm `point`**, máy chủ tự chọn điểm tối ưu.
4. Nếu kéo `>= 10px`:
   - Kích hoạt vòng vùng tác dụng (`areaRing`), vòng giới hạn tầm (`rangeRing`), và bóng xem trước (`ghost`) bằng raycast từ camera xuống mặt phẳng mặt đất `y = GROUND_Y` (`-0.5`), đồng thời trận đấu **vẫn chạy bình thường**.
   - Ngoài tầm `range`: vòng chuyển sang màu đỏ `#ef4444` và toạ độ được kẹp lên rìa tầm tối đa (và kẹp trong `ARENA_BOUNDS`).
   - Thả ngược lên chính nút kỹ năng (`.drag-cancel`): huỷ thao tác, không gửi lệnh, không tốn Orb.
   - Thả trên sân: gửi `{ point: { x, z }, ...extra }` lên máy chủ và dùng `consumeDragClickSuppression` để tránh `click` gửi lặp hai lần.

### Cách một anh hùng / kỹ năng khác bật kéo thả
1. Trên máy chủ (`CLASS_DEFS[hero].skills[i]` trong [server.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/server.js)), chỉ cần thêm trường:
   ```js
   dragTarget: { range: 14, radius: 3.5, color: 0x38bdf8 }
   // hoặc radii: [3, 3.6, 4.2]
   ```
   Và đọc `opts.point` trong `executeSkill` của kỹ năng đó (máy chủ đã tự truyền `opts.point` từ `member.queuedTargets[skillIdx]`).
2. *(Tuỳ chọn)* Nếu muốn bóng xem trước / màu / payload riêng theo trạng thái tướng (như `crossType` của Caelum), gọi `registerDragCustomizer(skillType, ({ member, skillIdx, skillDef }) => ({ range, radius, color, extraPayload, createGhost }))` ở bất kỳ module FX/UI nào — không cần sửa `src/ui/dragCast.js`.

---

## 4. Các thành phần tạm (Placeholders) đã dùng

1. **Sprite & Chân dung anh hùng:** Tạm dùng sprite & chân dung của **Seraphine (`priest` / `'seraphine'`)** trong [src/characters/registry.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/characters/registry.js), [src/characters/sprite/tiers.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/characters/sprite/tiers.js) và [src/ui/heroPanel.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/ui/heroPanel.js).
2. **Đồ hoạ Thánh giá trên sân:** Dùng `CanvasTexture` vẽ hình Thánh giá phát sáng làm fallback trong [src/vfx/crossFx.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/vfx/crossFx.js). Khi bổ sung các tệp `src/assets/sprites/caelum_cross_1.webp` .. `caelum_cross_4.webp` và `src/assets/sprites/caelum_cross_big.webp`, `import.meta.glob` sẽ tự nạp ảnh thay cho hình tạm.
3. **Biểu tượng nút kỹ năng & trạng thái HUD:** Chưa có bộ icon `src/assets/skills/crosspriest_0..2.webp` nên nút kỹ năng dùng nhãn chữ mặc định; thanh trạng thái `effectInfo` trong [src/ui/hud.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/ui/hud.js) tạm dùng emoji (`✝️`, `⚔️`, `📉`, `💔`, `💫`, `🛡️`, `🌟`, `⚡`).

---

## 5. Các điểm chưa thể xác minh tự động (chờ chạy thực tế)

- **Chưa chạy bộ test Node (`node --test`):** Chưa kiểm chứng thực thi của cả 306 test hiện có và bộ test mới [tests/crosspriest.test.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/tests/crosspriest.test.js).
- **Chưa build Vite / kiểm tra runtime trình duyệt:** Chưa chạy `npm run build` để bắt lỗi import/bundler phía client, chưa kiểm thử trực quan thao tác kéo thả chuột/cảm ứng trên camera thực tế, độ rõ của vòng Thánh giá, giao diện khay 4 nút trên màn hình desktop & portrait mobile, cũng như animation hồi sinh/đánh thường dùng sprite Seraphine.
- **Độ dài hiệu ứng động lúc hồi sinh:** Vì Thiên phú 2 hồi sinh Caelum đồng bộ ngay trong `killMember` (để bảo toàn điều kiện thắng thua cùng nhịp và tránh lọt qua Sudden Death), client phát hiệu ứng Thánh giá bay về từ vị trí cũ trong 0.45s sau khi Caelum đã hồi máu ngay tại thời điểm chí tử — nên kiểm tra cảm giác nhìn thực tế trên màn hình.

---

## Fix pass 1

Các lỗi từ lần build + chạy test của lead trong `.team/failures-1.txt` đã được kiểm tra và sửa như sau (tất cả xuất phát từ import/test harness, không phải sai lệch logic thiết kế trên `server.js`):

1. **Lỗi build client (`src/ui/dragCast.js` & `src/vfx/crossFx.js`):**
   - [src/ui/dragCast.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/ui/dragCast.js): Bỏ import `ARENA_BOUNDS` không tồn tại ở [src/config.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/config.js); khai báo cục bộ `const ARENA_BOUNDS = { minX: -48, maxX: 48, minZ: -13, maxZ: 13 }` khớp hệt `server.js`.
   - [src/vfx/crossFx.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/vfx/crossFx.js): Qua rà soát toàn bộ import client mới thêm, phát hiện thêm `CHEST_Y` cũng chỉ là hằng nội bộ trong `src/vfx/vfx.js` chứ không được export từ [src/config.js](file:///C:/Users/Admin/Desktop/legend-of-capsules/.team/wt/caelum/src/config.js); đã bỏ import `CHEST_Y` và khai báo cục bộ `const CHEST_Y = 1.0`, đồng thời dùng helper `disposeGroup` cục bộ thay cho `disposeObject` (chỉ import các hàm đã xác nhận export từ `./vfx.js`: `addAnim`, `fxPlane`, `glowTexture`, `spawnLightning`, `spawnShockwave`). Mọi import còn lại đều khớp với export thật.
2. **Test 103 (`tests/crosspriest.test.js`):** Cửa hàng anh hùng (`SHOP.buy`) thanh toán bằng `diamond` (Kim Cương) chứ không phải `gold`. Đã sửa ví test sang `{ diamond: 1200 }` và kiểm tra `pr.wallet.diamond === 0`.
3. **Test 105 (`tests/crosspriest.test.js`):** Trong bài test thay thế cây thứ 5 ở mốc `t=24s`, cây cũ nhất (`B`, đặt ở `t=11s`) thực tế đang ở cấp 2 (`11s + 10s = 21s` mới lên cấp 2, tới `31s` mới lên cấp 3) nên server giữ đúng cấp 2. Đã tách nhánh kiểm tra thay cây đang cấp 3 sang fixture sạch: đặt `X1` lúc `t=0`, cho lên cấp 3 tại `t=20s`, đặt thêm 3 cây lúc `20s`, rồi thay `X1` ở `t=24s` để kiểm tra kế thừa cấp 3 và nhận lại đủ `10s` mới (hết ở `t=34s`).
4. **Test 109 (`tests/crosspriest.test.js`):** Bài test hoàn Orb của Thiên phú 2 trước đó dùng mặc định `crossType = 1` (Sinh Mệnh), vốn cũng hồi thêm Orb mỗi 2s nên tổng `caelum.mp` chạm trần `5000` thay vì đúng `4000` từ riêng 4 cây hết hạn. Đã đặt `caelum.crossType = 2` (Uy Lực) cho nhánh kiểm tra hoàn Orb của Thiên phú 2 để tách riêng đúng `+4 × 1000 = 4000 MP`.
5. **Test 110 (`tests/crosspriest.test.js`):** Bổ sung `handshake: { auth: { clientId: 'test-' + id } }` vào mock socket trong `connectSocket` và mock `Accounts.resume: () => ({ ok: false })` trong `./game/accounts` của `harness()` để gọi `io.on('connection')` không văng `Cannot read properties of undefined (reading 'auth')`.

*Ghi chú: Vẫn chưa chạy lại lệnh build/test do phiên làm việc không được dùng shell; chờ lần chạy tiếp theo của lead/CI.*
