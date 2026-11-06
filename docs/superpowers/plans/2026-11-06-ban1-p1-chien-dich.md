# P1 — Nền chiến dịch chương 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Người chơi vào chế độ "📖 Cốt truyện", chọn ải 1–20 (và nhánh) của chương 1 ở 3 độ khó, tốn thể lực, đánh bằng hệ thống trận hiện có, nhận thưởng (EXP, Vàng, Kim Cương, Đá Cường Hoá), mở khoá ải / độ khó / anh hùng theo luật — tất cả lưu lại.

**Architecture:** Luật & dữ liệu viết thành module thuần CommonJS trong `game/` (không phụ thuộc socket, test được bằng `node --test`). `server.js` chỉ nối: thêm chế độ `campaign`, sự kiện socket, dựng đội quái theo ải, gọi luật khi trận kết thúc. Client thêm 1 màn chọn ải + 1 màn kết quả; chọn đội dùng lại `squadSelect` (chỉ hiện anh hùng đã có).

**Tech Stack:** Node ≥ 18 (CommonJS phía server, như `progression.js`), Socket.io, Vite + ES modules phía client, test bằng `node:test` + `node:assert` (không thêm thư viện).

**Spec:** `BAN_THIET_KE_GAME.md` (mục 3.2, 3.3, 7b, 8, 9.7 đá, 12) · `CHUONG_1_TOC_NGUOI.md` (mục 2, 4, 5, 7).

## Global Constraints
- Chữ hiển thị: **tiếng Việt**. Không dùng `confirm()` / `alert()` / `prompt()` — hộp xác nhận làm ngay trên trang.
- Chỉ số tỉ lệ dùng thang **1000 = 100%** như phần còn lại của game.
- Không thêm thư viện npm. Test: `npm test` (= `node --test "tests/**/*.test.js"`).
- Tiến trình lưu trong `data/progress.json` qua `P.saveAll` sẵn có; save cũ thiếu trường mới phải tự bổ sung mặc định, không lỗi.
- Chế độ Test / Đấu hiện có **không được đổi hành vi**.
- **Rok là tộc Người** (`server.js` CLASS_DEFS.warrior.race = `'human'`).
- Thể lực: tối đa **360**, hồi **1 điểm / 300 giây**; tốn **Cốt truyện 4 · Khó 6 · Địa ngục 10**; thua hoặc bỏ trận hoàn lại (chi phí − 1).
- Ví khởi đầu: **Vàng 500, Kim Cương 100, Đá 0**. Mua thể lực: **50 Kim Cương → +60** (có thể vượt 360, tối đa 999).
- Độ khó: cấp quái **+0 / +5 / +10**, máu & tấn công quái **×1 / ×1,25 / ×1,6**. Trùm: máu **×2** (trùm nhỏ, ải 5/15), **×3** (giữa chương, ải 10), **×4** (cuối, ải 20).
- Mở khoá: Cốt truyện ải n cần qua Cốt truyện ải n−1. Khó ải n cần qua Cốt truyện ải n **và** đã qua Cốt truyện ải 4. Địa ngục cần qua **cả 20 ải Khó**. Nhánh cần cờ (`flags`) — P3 đặt cờ; N5 cần thêm qua Cốt truyện ải 18.
- Anh hùng sở hữu mặc định: **Jessica (assassin), Rok (warrior), Seraphine (priest)**; **Lyra (archer)** thêm khi lần đầu qua Cốt truyện ải 12.
- Thưởng mỗi lần thắng (ải số n, nhánh dùng n của ải gốc): EXP mỗi anh hùng ra trận `40 + 15n`; Vàng `50 + 10n`; Đá `1 + floor(n/5)`; nhân **×1 / ×1,5 / ×2** (EXP, Vàng) và **×1 / ×2 / ×3** (Đá) theo độ khó. Kim Cương **chỉ lần đầu qua**: ải thường 10, trùm nhỏ 30, giữa chương 50, cuối 100 (×1 Khó, ×2 Địa ngục); nhánh 40.

## Review Focus
1. Save cũ (không có `wallet`, `stamina`, `campaign`, `owned`) → mở chế độ Cốt truyện vẫn chạy, nhận giá trị mặc định. → test ở Task 2.
2. Thể lực sau khi tắt server vài giờ → hồi đúng theo thời gian thật, không vượt 360 khi hồi tự nhiên, không âm. → test ở Task 2.
3. Bấm "Vào trận" 2 lần liên tiếp → chỉ trừ thể lực 1 lần. → test ở Task 6 (kiểm tra `room.status`).
4. Gửi `startStage` với ải chưa mở / độ khó chưa mở / anh hùng chưa có / thiếu thể lực → bị từ chối kèm lý do tiếng Việt, không trừ gì. → test ở Task 4 (`canStart`).
5. Thắng lại ải đã qua → không nhận Kim Cương lần đầu lần nữa; Lyra không bị thêm trùng. → test ở Task 5.

---

## File Structure
| File | Trách nhiệm |
|---|---|
| `game/wallet.js` (mới) | Ví: tạo mặc định, cộng / trừ an toàn |
| `game/stamina.js` (mới) | Thể lực: hồi theo thời gian, tiêu, hoàn, mua |
| `game/chapter1.js` (mới) | **Dữ liệu** 20 ải + 5 nhánh chương 1 (tên, phần, cấp, trùm, đội quái) |
| `game/campaign.js` (mới) | **Luật**: chuẩn hoá save, trạng thái mở khoá, `canStart`, thưởng, áp kết quả, tính năng đã mở |
| `tests/*.test.js` (mới) | Test cho 4 module trên |
| `server.js` (sửa) | Rok race; chế độ `campaign`; sự kiện socket; dựng đội quái theo ải; áp kết quả khi trận kết thúc |
| `src/ui/campaign.js` (mới) | Màn chọn ải (chương 1, 3 tab độ khó, ví + thể lực) + màn kết quả |
| `src/ui/modeMenu.js`, `src/ui/squadSelect.js`, `src/main.js`, `src/net/socket.js`, `src/styles/index.css` (sửa) | Thẻ "Cốt truyện", lọc anh hùng sở hữu, nối sự kiện |

---

### Task 1: Hạ tầng test + sửa Rok là tộc Người

**Files:**
- Modify: `package.json` (script `"test": "node --test \"tests/**/*.test.js\""`)
- Modify: `server.js:63` (`race: 'dragon'` → `race: 'human'` cho `warrior`)
- Test: `tests/smoke.test.js`

- [ ] **Step 1:** Viết `tests/smoke.test.js`: `require('../progression.js')`, assert `P.RACE_DEFS.human.trait.key === 'human_adapt'` và `P.computeStats({ maxHp: 100, maxMp: 3000, pAtk: 10, mAtk: 0, pDef: 10, mDef: 10, crit: 0, critDmg: 1500, acc: 1000, dodge: 0, pen: 0, block: 0, mpAtk: 0, mpSec: 0, atkSpeed: 1000, moveSpeed: 1, classGroup: 'warrior', race: 'human' }, { level: 1, rank: 0 }).maxHp === 105`.
- [ ] **Step 2:** Sửa `package.json` script test; chạy `npm test` → PASS.
- [ ] **Step 3:** Đổi race của `warrior` thành `'human'`. Chạy `node -e "require('./progression.js')"` không lỗi; mở game chế độ Test, bảng chọn đội Rok hiện tộc Human.
- [ ] **Step 4:** Commit `"Rok la toc Nguoi + ha tang test node:test"`.

### Task 2: Ví tiền + thể lực

**Files:**
- Create: `game/wallet.js`, `game/stamina.js`
- Test: `tests/wallet.test.js`, `tests/stamina.test.js`

**Interfaces:**
- Produces:
  - `wallet.js`: `CURRENCIES = ['gold','diamond','stone']`, `defaultWallet() -> {gold:500, diamond:100, stone:0}`, `add(w, cur, n) -> w`, `trySpend(w, cur, n) -> boolean` (không đủ → false, không trừ).
  - `stamina.js`: `MAX = 360`, `REGEN_SEC = 300`, `COST = {story:4, hard:6, hell:10}`, `BUY = {diamond:50, amount:60, cap:999}`, `defaultStamina(now) -> {value:360, lastAt:now}`, `regen(st, now) -> st` (cộng `floor((now-lastAt)/300000)` điểm, chỉ khi `value < MAX`, không vượt MAX; `lastAt` tiến đúng số điểm đã cộng; nếu `value >= MAX` thì `lastAt = now`), `trySpend(st, n, now) -> boolean`, `refund(st, n)`, `buy(st, wallet) -> boolean`.

- [ ] **Step 1:** Test ví: `trySpend` đủ → true và trừ; thiếu → false và giữ nguyên; `add` số âm bị chặn (n < 0 → không đổi).
- [ ] **Step 2:** Test thể lực: từ `{value:100, lastAt:0}`, `regen(now = 3*300000+5)` → value 103, `lastAt = 900000`; `regen` sau 30 giờ từ 100 → 360 (không vượt); đang 370 (mua dư) → regen không giảm, không tăng; `trySpend(4)` khi 3 → false; `buy` trừ 50 Kim Cương, +60, chặn 999.
- [ ] **Step 3:** Chạy `npm test` → FAIL (chưa có module).
- [ ] **Step 4:** Viết `game/wallet.js`, `game/stamina.js` theo Interfaces.
- [ ] **Step 5:** `npm test` → PASS. Commit `"Vi tien + the luc (game/)"`.

### Task 3: Dữ liệu chương 1

**Files:**
- Create: `game/chapter1.js`
- Test: `tests/chapter1.test.js`

**Interfaces:**
- Produces: `module.exports = { id: 'c1', name: 'Ngọn Lửa Gây Chiến', stages: Stage[], branches: Branch[] }`
  - `Stage = { id: 'c1-01'..'c1-20', no: 1..20, name, part: 'lang'|'duong'|'kinh', level: no, boss: 0|1|2|3, enemies: [{ classId, name, x, z }] }` — `boss`: 1 = trùm nhỏ (ải 5, 15), 2 = giữa chương (ải 10), 3 = cuối (ải 20).
  - `Branch = { id: 'c1-n1'..'c1-n5', name, baseNo, flag, needStoryNo? , enemies }` — `baseNo` lấy cấp / thưởng; N5: `needStoryNo: 18`.
- Tên ải, nhánh, phần: **chép đúng bảng mục 4 và 5 của `CHUONG_1_TOC_NGUOI.md`**.
- Đội quái **tạm** (P5 thay bằng quái thật): chỉ dùng `monster_tank`, `monster_archer`, `monster_supporter`, đặt `name` theo truyện (VD `'Goblin Cướp'`, `'Sói Rừng'`, `'Lính Trạm Gác'`, trùm `'Skarn Răng Sắt'`). Ải thường 2–3 quái, ải trùm: 1 quái trùm (`monster_tank`) + 2 lính. Vị trí x 25–32, z −3..3 như `MONSTER_SQUAD`.
- Cờ nhánh: `n1:'gieng_co'`, `n2:'bua_borin'`, `n3:'nguyen_lieu_lena'`, `n4:'trang_sach'`, `n5:'loi_vao_ham_mo'`.

- [ ] **Step 1:** Test: đúng 20 ải `no` 1..20 liên tục, id duy nhất; `boss` đúng {5:1, 10:2, 15:1, 20:3}, còn lại 0; part: 1–10 `lang`, 11–12 `duong`, 13–20 `kinh`; mọi `classId` thuộc 3 quái tạm; 5 nhánh, N5 có `needStoryNo === 18`; tên ải 1 `'Đêm ở cổng làng'`, ải 20 `'Đại tướng Valdric'`.
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** Viết `game/chapter1.js`. **Step 4:** PASS. Commit `"Du lieu chuong 1: 20 ai + 5 nhanh"`.

### Task 4: Luật chiến dịch — chuẩn hoá save, mở khoá, kiểm tra vào trận

**Files:**
- Create: `game/campaign.js`
- Test: `tests/campaign.test.js`

**Interfaces:**
- Consumes: `wallet.js`, `stamina.js`, `chapter1.js` (Task 2–3).
- Produces:
  - `DIFFS = ['story','hard','hell']`, `DIFF = { story:{lv:0, mul:1, exp:1, stone:1, dia:1}, hard:{lv:5, mul:1.25, exp:1.5, stone:2, dia:1}, hell:{lv:10, mul:1.6, exp:2, stone:3, dia:2} }`, `BOSS_HP = {0:1, 1:2, 2:3, 3:4}`.
  - `ensureCampaign(pr, now) -> pr` — bổ sung nếu thiếu: `pr.wallet = defaultWallet()`, `pr.stamina = defaultStamina(now)`, `pr.owned = ['assassin','warrior','priest']`, `pr.campaign = { cleared: { story: {}, hard: {}, hell: {} } }` (khoá = stage/branch id, giá trị = true), `pr.flags = {}`. Không ghi đè trường đã có.
  - `findStage(id) -> Stage|Branch|null`.
  - `isUnlocked(pr, id, diff) -> { ok: boolean, why?: string }` — luật ở Global Constraints; `why` tiếng Việt (VD `'Hãy qua ải 3 ở mức Cốt truyện trước'`, `'Địa ngục mở khi qua hết 20 ải mức Khó'`, `'Chưa tìm ra lối vào nhánh này'`).
  - `chapterState(pr) -> { stages: [{ id, no, name, part, boss, status: { story, hard, hell } }], branches: [...] }` với status ∈ `'locked'|'open'|'cleared'`.
  - `canStart(pr, { id, diff, classes }, now) -> { ok, why? }` — kiểm tra theo thứ tự: ải tồn tại → mở khoá → `classes` 1–4 phần tử, tất cả thuộc `pr.owned` → thể lực (sau `regen`) ≥ `COST[diff]`.
  - `features(pr) -> Set<string>`: `'command'` luôn; `'orb'` khi qua story c1-01; `'auto'` khi qua c1-02; `'hard'` khi qua c1-04; `'gear'` khi qua c1-06; `'forge'` khi qua c1-10; `'setDungeon'` khi qua c1-15; `'jewelDungeon'` khi qua c1-16; `'hell'` khi qua đủ 20 hard; `'heroShop'` khi qua c1-20.

- [ ] **Step 1:** Test `ensureCampaign({})` ra đủ trường mặc định; gọi lần 2 không đổi giá trị đã có (VD `wallet.gold = 7` giữ 7).
- [ ] **Step 2:** Test mở khoá: save mới → c1-01 story `ok`, c1-02 story `!ok`; đánh dấu story c1-01..04 cleared → c1-03 hard `ok`, c1-05 hard `!ok`; hell c1-01 `!ok` cho tới khi đủ 20 hard; nhánh n1 `!ok` → đặt `flags.gieng_co = true` → `ok`; n5 có cờ nhưng chưa qua story 18 → `!ok`.
- [ ] **Step 3:** Test `canStart`: anh hùng `'archer'` chưa sở hữu → `!ok`; 5 anh hùng → `!ok`; thể lực 3 với story → `!ok` và **không trừ** thể lực; hợp lệ → `ok`.
- [ ] **Step 4:** Test `features`: save mới chỉ có `'command'`; qua c1-01..c1-10 có `'forge'`, chưa có `'setDungeon'`.
- [ ] **Step 5:** `npm test` FAIL → viết `game/campaign.js` (phần trên) → PASS. Commit `"Luat chien dich: mo khoa, kiem tra vao tran, tinh nang"`.

### Task 5: Thưởng & áp kết quả trận

**Files:**
- Modify: `game/campaign.js`
- Test: `tests/campaign-result.test.js`

**Interfaces:**
- Consumes: `P.addExp(hero, amount)` từ `progression.js`.
- Produces:
  - `rewardsFor(id, diff, firstClear) -> { exp, gold, stone, diamond }` — công thức ở Global Constraints.
  - `applyResult(pr, { id, diff, classes, win }, P, now) -> { win, firstClear, rewards, leveled: { classId: số cấp lên }, newHeroes: string[], refund: number }`
    - thắng: cộng thưởng vào ví, EXP cho từng anh hùng trong `classes` (qua `P.addExp`), đánh dấu cleared; lần đầu qua story `c1-12` → thêm `'archer'` vào `owned` (nếu chưa có) và trả trong `newHeroes`.
    - thua: hoàn `COST[diff] - 1` thể lực, không thưởng.

- [ ] **Step 1:** Test `rewardsFor('c1-10','story',true)` = `{ exp: 190, gold: 150, stone: 3, diamond: 50 }`; `rewardsFor('c1-20','hell',true)` → `diamond: 200`, `stone: 15`, `gold: 500`, `exp: 680`; `firstClear=false` → `diamond: 0`.
- [ ] **Step 2:** Test `applyResult` thắng c1-12 story lần đầu → `newHeroes` `['archer']`, `pr.owned` có `'archer'` 1 lần; thắng lại → `newHeroes` rỗng, `diamond` 0; thua c1-03 hard → `refund: 5`, ví không đổi.
- [ ] **Step 3:** FAIL → viết → PASS. Commit `"Thuong va ap ket qua tran chien dich"`.

### Task 6: Nối vào server

**Files:**
- Modify: `server.js` (gần `MODES` ~dòng 752, `createMonsterSquad` ~678, `confirmSquad` ~1608, `backToMenu` ~1596, `checkWinCondition` ~5538, `progressOf` ~781)

**Interfaces:**
- Consumes: Task 2–5.
- Produces (sự kiện socket):
  - client → server `campaignOpen` → server emit `campaignState` `{ chapter: chapterState(pr), wallet, stamina: { value, max: 360, nextInSec }, owned, features: [...], squad }` — `squad` = dữ liệu bảng chọn đội giống sự kiện `squadSelect` (mode `'campaign'`, chỉ anh hùng sở hữu, cấp / bậc thật, `selected` = đội lần trước).
  - client → server `startStage` `{ id, diff, classes }` → nếu `!canStart` emit `campaignError { text }`; nếu ok: trừ thể lực, `room.mode = 'campaign'`, `room.stage = { id, diff, classes }`, dựng đội, emit `battleStart` như `confirmSquad` (kèm `mode: 'campaign'`, `stage: { id, no, name, diff }`), `startBattleLoop`.
  - khi trận kết thúc trong `checkWinCondition` (và khi `backToMenu` lúc đang đánh): nếu `room.mode === 'campaign'` và chưa áp → `applyResult` (thua khi hoà / bỏ trận) → `P.saveAll` → emit `stageResult` (kết quả `applyResult` + `wallet`, `stamina`).
  - client → server `buyStamina` → `stamina.buy` → emit `campaignState`.
- `createMonsterSquad(level, layout = MONSTER_SQUAD, opts = {})` — thêm tham số `layout` (mảng `{classId, name, x, z}` hoặc định dạng cũ) và `opts = { mul, bossHp }`; mặc định giữ hành vi cũ.
- `progressOf` gọi `ensureCampaign(pr, Date.now())`.

- [ ] **Step 1:** Thêm `'campaign'` vào `MODES` (không qua `chooseMode`; vào bằng `startStage`). Sửa `createMonsterSquad` như trên — chế độ Test / Đấu gọi như cũ.
- [ ] **Step 2:** Viết các handler theo Interfaces. Chống bấm 2 lần: `startStage` chỉ nhận khi `room.status` ∉ `{'starting','active'}`; cờ `room.stageApplied` chặn áp kết quả 2 lần.
- [ ] **Step 3:** Chạy `node --check server.js`; `npm test` PASS; khởi động `npm run dev`, kiểm tra Test và Đấu vẫn vào trận được.
- [ ] **Step 4:** Commit `"Server: che do Cot truyen (campaign)"`.

### Task 7: Giao diện — thẻ Cốt truyện, chọn ải, kết quả

**Files:**
- Create: `src/ui/campaign.js`
- Modify: `src/ui/modeMenu.js` (thêm thẻ `📖 Cốt truyện` đứng **đầu**, `data-mode="campaign"` → mở màn chọn ải thay vì `chooseMode`), `src/ui/squadSelect.js` (chế độ `campaign`: chỉ hiện `owned`, nút "Vào trận" gửi `startStage`), `src/net/socket.js`, `src/main.js`, `src/styles/index.css`

**Interfaces:**
- Consumes: sự kiện socket Task 6.
- Produces: `setupCampaign()` (gọi trong `main.js`), `showCampaign()`.
- Màn chọn ải: tiêu đề chương; thanh trên: Vàng · Kim Cương · Đá · Thể lực `value/360` + thời gian hồi điểm kế + nút "+" mua (hộp xác nhận ngay trên trang: "Dùng 50 Kim Cương đổi 60 thể lực?"); 3 tab độ khó (tab khoá hiện lý do); lưới 20 ải chia 3 nhóm *Làng Ashford · Đường Vương Đạo · Kinh thành Valoria*, ải trùm có viền nổi bật, ải khoá mờ + ổ khoá, ải đã qua có dấu ✓; khu nhánh ẩn (chỉ hiện nhánh đã mở). Bấm ải mở → chọn đội → `startStage`. Lỗi `campaignError` hiện ngay trên màn (không `alert`).
- Màn kết quả (`stageResult`): Thắng / Thua, thưởng từng loại, "Lần đầu qua: +X Kim Cương", anh hùng lên cấp, **"Lyra gia nhập đội!"** khi `newHeroes` có `archer`, thua thì "Hoàn lại X thể lực". Nút "Tiếp tục" → về màn chọn ải.

- [ ] **Step 1:** Làm các phần trên; dùng biến màu / font có sẵn trong `index.css`.
- [ ] **Step 2:** `npx vite build` không lỗi.
- [ ] **Step 3:** Commit `"Giao dien Cot truyen: chon ai + ket qua"`.

### Task 8: Kiểm tra trọn luồng (bấm thật)

- [ ] **Step 1:** Xoá save thử (đổi `progressKey` bằng trình duyệt sạch), chạy game: Menu → Cốt truyện → ải 1 mở, ải 2 khoá, tab Khó / Địa ngục khoá có lý do; ví 500 / 100 / 0; thể lực 360.
- [ ] **Step 2:** Chọn đội (chỉ thấy Jessica, Rok, Seraphine) → vào ải 1 → thể lực còn 356 → bật AUTO → thắng → màn kết quả đúng thưởng (`exp 55, gold 60, stone 1, diamond 10`) → ải 2 mở.
- [ ] **Step 3:** Thua một ải (bỏ trận bằng Menu) → hoàn 3 thể lực. Bấm "Vào trận" liên tục 2 lần → chỉ trừ 1 lần.
- [ ] **Step 4:** Mua thể lực: Kim Cương 100 → 50, thể lực +60, hộp xác nhận trên trang.
- [ ] **Step 5:** Chế độ Test và Đấu vẫn chạy như trước. Ghi `NHAT_KY_CAP_NHAT.md`. Commit.
