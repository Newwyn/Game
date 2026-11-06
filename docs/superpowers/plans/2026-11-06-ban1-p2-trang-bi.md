# P2 — Trang bị Implementation Plan

**Goal:** Thắng ải Cốt truyện (từ ải 6) rơi đồ ngẫu nhiên; người chơi mặc / tháo đồ cho anh hùng ở màn "🎒 Trang bị", đồ cộng chỉ số vào trận; từ ải 10 mở **Lò rèn**: cường hoá (+1 → +10), tinh luyện (roll lại 1 dòng phụ), phân giải đồ thừa thành đá. Có 3 bộ đồ tộc Người (2 món / 4 món) — tạm lấy bằng tool Test, P6 (hầm ngục đồ bộ) mới rơi thật.

**Architecture:** Luật & dữ liệu đồ là module thuần CommonJS trong `game/gear.js` (test bằng `node --test`, rng truyền vào). `server.js` nối: lưu `pr.gear`, sự kiện socket, cộng chỉ số đồ trong `applyProgress`, hiệu ứng bộ 4 món trong trận, rơi đồ khi thắng ải. Client thêm `src/ui/gear.js` (màn Trang bị + Lò rèn), nút mở từ màn chọn ải, màn kết quả hiện đồ rơi.

**Spec:** `BAN_THIET_KE_GAME.md` mục 9 (9.1–9.7), 10 (3 bộ tộc Người) · `CHUONG_1_TOC_NGUOI.md` (ải 6 dạy mặc đồ, ải 10 mở lò rèn).

## Global Constraints
- Chữ hiển thị tiếng Việt. Không `confirm()/alert()/prompt()`. Không thêm thư viện npm.
- Chỉ số tỉ lệ thang **1000 = 100%**. `atkSpeed` của game là **khoảng cách đòn (ms)** → +x‰ tốc đánh = `atkSpeed / (1 + x/1000)`.
- **Tấn công** trên đồ cộng vào `pAtk` nếu nhân vật đánh vật lý, `mAtk` nếu đánh phép (`dmgType`).
- Save cũ không có `pr.gear` → tự bổ sung `{ items:{}, equipped:{}, nextId:1 }`. Chế độ Test / Đấu không đổi hành vi khi không mặc đồ (Đấu không tính đồ).
- 6 ô: `weapon` Vũ khí ⚔️ · `armor` Áo 🥋 · `hands` Tay 🧤 · `legs` Chân 👢 · `ring` Nhẫn 💍 · `necklace` Dây chuyền 📿.
- Cấp đồ 10…60. **Mặc được khi cấp anh hùng ≥ cấp đồ − 9** (đồ 10 mặc từ Lv1, đồ 20 từ Lv11…) — vì ải 6 anh hùng mới ~Lv5.
- Độ hiếm 0–4: Thường (trắng) · Tốt (xanh lá) · Hiếm (xanh dương) · Sử thi (tím) · Huyền thoại (cam). Số dòng phụ **1 / 2 / 3 / 4 / 4**.
- Chỉ số chính & dòng phụ theo bảng 9.4 / 9.5; nhân **hệ số cấp** (10=20% · 20=35% · 30=50% · 40=65% · 50=80% · 60=100%) × **hệ số độ hiếm** (60/70/80/90/100%). Chân có 2 chỉ số chính (Thủ vật lý + Thủ phép).
- Cường hoá: bảng 9.7 (tỉ lệ 100,100,100,100,100,80,65,50,35,20%; chính +5×5, +8, +9, +11, +13, +16%); từ +8 hỏng tụt 1 cấp; **tích may mắn +5% mỗi lần hỏng, về 0 khi thành công**; **Bùa May Mắn** +10% (1 bùa / lần). Đá: cấp 10=1 · 20=2 · 30=3 · 40=5 · 50=7 · 60=10 viên, ×2 (+6/+7), ×3 (+8/+9), ×4 (+10). Phí Vàng = `cấp đồ × 5 × cấp đích`. Mốc **+5**: các dòng phụ +10%.
- Tinh luyện: 1 **Đá Tinh Luyện** + Vàng `cấp đồ × 10` → roll ngẫu nhiên hoàn toàn 1 dòng (có thể đổi loại dòng, không trùng loại với dòng khác cùng món).
- Phân giải: Đá Cường Hoá = `đá-cấp × [1,1.5,2,3,4][độ hiếm]` (làm tròn lên) + 50% số đá đã đập vào món; Đá Tinh Luyện 0/0/1/2/3 theo độ hiếm. Món đang mặc hoặc khoá 🔒 không phân giải được.
- Túi tối đa **100 món chưa mặc**; đầy thì đồ rơi tự phân giải (báo trên màn kết quả).
- Rơi đồ (chỉ khi thắng, từ khi đã qua ải 6 Cốt truyện, hoặc chính lần đầu qua ải 6): 1 món / trận, ải trùm thêm 1 món. Ô ngẫu nhiên trong 4 ô **Vũ khí · Áo · Tay · Chân** (nhẫn / dây chuyền: hầm ngục P6). Cấp đồ = `max(10, floor(cấp ải / 10) × 10)` với cấp ải = số ải + 0/5/10 theo độ khó. Độ hiếm (trắng/xanh lá/xanh dương): Cốt truyện 60/30/10 · Khó 30/45/25 · Địa ngục 10/45/45. Lần đầu qua ải 6 Cốt truyện: chắc chắn 1 **Vũ khí xanh lá**. Khó / Địa ngục: 10% / 20% rơi 1 **Bùa May Mắn**.
- Bộ tộc Người (4 ô vũ khí/áo/tay/chân): `ho_ve` Hộ Vệ Vương Quốc (2: +10% Thủ vật lý & phép · 4: lần đầu máu < 50% → khiên 15% máu tối đa 10s, cả đội +5% thủ 6s) · `chien_luoc` Chiến Lược Gia (2: +15% hồi năng lượng — mpAtk & mpSec · 4: dùng kỹ năng ≥ 3 Orb → hoàn 1 Orb, cả đội +10% tấn công 5s) · `lu_khach` Lữ Khách (2: +8% Tấn công · 4: mỗi đồng đội khác tộc +6% sát thương, tối đa +18%).

## File Structure
| File | Ai | Trách nhiệm |
|---|---|---|
| `game/gear.js` (mới) | Codex | Dữ liệu + luật đồ: tạo đồ, chỉ số, mô tả, mặc / tháo, túi, bộ, rơi đồ, cường hoá, tinh luyện, phân giải, cộng chỉ số |
| `tests/gear.test.js` (mới) | Codex | Test cho mọi hàm trên |
| `server.js` (sửa) | Claude | `pr.gear`, socket, chỉ số đồ vào trận, hiệu ứng bộ 4 món, rơi đồ, tool Test nhận đồ |
| `src/ui/gear.js` (mới), `src/ui/campaign.js`, `src/net/socket.js`, `src/main.js`, `src/styles/index.css`, `src/ui/progressTool.js` (sửa) | Claude (thay Antigravity — không gọi được lệnh `agy`) | Màn Trang bị + Lò rèn, nút mở, đồ rơi ở màn kết quả, nút tool Test |

## `game/gear.js` — API (CommonJS)
```
SLOTS, SLOT_INFO{slot:{name,icon}}, LEVELS, RARITIES[{id,name,color}], STATS{key:{label,unit:'num'|'pct'}}, SETS{id:{name,two,four,twoText,fourText}}
INV_MAX = 100
ensureGear(pr) -> pr.gear
createItem(rng, {slot, level, rarity, set=null}, id) -> item
   item = { id, slot, level, rarity, set, main:[{key,value}], subs:[{key,roll,value}], enhance:0, luck:0, spent:0, locked:false }
itemStats(item) -> { atk, hp, pDef, mDef, mpAtk, crit, critDmg, dodge, block, pen, acc, atkSpeed }  (đã tính cường hoá + mốc +5)
describe(item) -> { id, slot, slotName, icon, name, level, wearLevel, rarity, rarityName, color, set, setName, enhance, locked,
                    main:[{key,label,value,text}], subs:[{key,label,value,text,pct,gold}] }   // pct 0..1 vị trí trong khoảng; gold = pct >= 0.9
canWear(heroLevel, item) -> {ok, why?}
addItem(pr, item) -> boolean (false nếu túi đầy) ; newId(pr) -> 'g<n>'
equip(pr, heroId, heroLevel, itemId) -> {ok, why?, swapped?}   // món đang mặc ở ô đó về túi; món đang trên người khác thì tháo khỏi người đó
unequip(pr, heroId, slot) -> {ok, why?}     // túi đầy thì từ chối
equippedItems(pr, heroId) -> item[] ; ownerOf(pr, itemId) -> heroId|null ; bagItems(pr) -> item[] (chưa mặc)
gearBonus(items) -> { stats:{...cộng dồn}, sets:{id:count}, effects:[setId có đủ 4 món] }
applyGear(stats, bonus, dmgType) -> stats mới (cùng dạng computeStats; atk -> pAtk/mAtk; % cộng ‰; atkSpeed chia; thưởng 2 món)
rollDrops(rng, {no, boss, diff, firstClear}) -> { items:[{slot, level, rarity}], charms:n }   // không tự kiểm tra 'gear' đã mở
salvageValue(item) -> {stone, refine}
salvage(pr, wallet, ids) -> {ok, why?, count, stone, refine}   // cộng vào wallet.stone, pr.items.refine_stone
enhanceInfo(item) -> {maxed, to, rate (0..1, đã cộng luck, chưa cộng bùa), stone, gold, dropOnFail}
enhance(pr, wallet, item, rng, {charm}) -> {ok, why?, success, from, to}   // trừ đá + vàng (+1 pr.items.luck_charm nếu charm)
refineInfo(item) -> {refine:1, gold}
refine(pr, wallet, item, rng, line) -> {ok, why?, before, after}
```

## Socket (server ↔ client)
- client → `gearOpen` · `gearEquip {hero,itemId}` · `gearUnequip {hero,slot}` · `gearLock {itemId}` · `gearSalvage {itemIds}` · `gearEnhance {itemId, charm}` · `gearRefine {itemId, line}`
- server → `gearState { heroes:[{id,name,emoji,level,rankName,race,dmgType,stats,equipped:{slot:view|null},sets:[{id,name,count}]}], bag:[view], invMax, wallet, mats:{refine_stone,luck_charm}, features:{gear,forge}, enhance:{itemId:enhanceInfo}, refine:{itemId:refineInfo} }`
- server → `gearResult { action, success?, text }` (hiện ngay trên màn) · `gearError { text }`
- `stageResult` thêm `drops:[view]`, `charms`, `autoSalvaged:{count,stone,refine}`

## Tasks
1. **Codex:** `game/gear.js` + `tests/gear.test.js` theo API trên; `npm test` PASS.
2. **Claude:** server.js — `pr.gear`, socket, `applyGear` trong trận (Cốt truyện + Test), hiệu ứng bộ 4 món, rơi đồ ở `finishStage`, sự kiện tool Test `gearDebugGive`.
3. **Claude:** giao diện — `src/ui/gear.js` (danh sách anh hùng, 6 ô, túi lọc theo ô / độ hiếm, thẻ chi tiết có thanh dòng phụ + chữ vàng ≥ 90%, mặc / tháo, khoá; Lò rèn: cường hoá có tỉ lệ / phí / bùa, tinh luyện chọn dòng, phân giải nhiều món với hộp xác nhận trên trang), nút "🎒 Trang bị" ở màn chọn ải (khoá tới khi qua ải 6, Lò rèn khoá tới ải 10), màn kết quả hiện đồ rơi.
4. **Kiểm tra trọn luồng bấm thật:** save mới → qua ải 6 nhận vũ khí → mặc → chỉ số tăng (bảng chọn đội / trong trận) → tool Test nhận bộ đủ 4 món → hiệu ứng → Lò rèn cường hoá / hỏng tụt cấp / tinh luyện / phân giải → túi đầy tự phân giải. Ghi `NHAT_KY_CAP_NHAT.md`, commit.
