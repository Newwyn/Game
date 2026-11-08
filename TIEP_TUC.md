# ▶️ TIẾP TỤC LÀM — Legend of Capsules (cập nhật 08/11/2026)

File này để mở máy khác là làm tiếp được ngay. Lịch sử chi tiết từng lần sửa: `NHAT_KY_CAP_NHAT.md` (mới nhất ở trên). Lộ trình: `docs/superpowers/plans/2026-11-06-ban1-lo-trinh.md`.

## 1. Chạy game
```
git pull
npm install
npm run dev        # server socket :3000 + vite :5173 → mở http://localhost:5173
npm test           # 71 bài kiểm tra (node --test)
```
- `npm run dev` luôn để server ở cổng 3000 (vite chuyển socket sang) — kể cả khi công cụ khác đặt biến PORT.
- Lưu tiến trình người chơi: `data/progress.json` (không đẩy GitHub — máy mới bắt đầu từ đầu). Mỗi trình duyệt có mã riêng trong localStorage `loc.clientId`.
- Thử nhanh: chế độ **Test** → **📖 Cốt truyện thử** (mở khoá tới ải 6/10/16/20, tặng tiền).

## 2. Đang ở đâu
- Bản 1 (tộc Người) P1 → P6 xong. Nhân vật chính Nam / Nữ, Jessica vào đội ở ải 2, Seraphine ở ải 3, Lyra ở ải 12.
- **Bản đồ thế giới 3D** (mô hình thu nhỏ, mô hình Kenney CC0) là mặc định; vẫn chọn được ⚡ Nhẹ / 🗺️ Phẳng 2D (bản Pokémon tranh vẽ) / 🤖 Tự động trong 🧭 Bản đồ. Có **sổ nhiệm vụ** (phím J) + **tự đi tới mục tiêu** (bấm đất hoặc nút 🧭).
- **5 trùm có 2 chiêu riêng** (vòng / vạch đỏ cảnh báo trước) · **trận đấu gọn trên điện thoại** (thẻ 2×2).
- **Tranh nhân vật theo bậc S / SS** (SSS = tranh cũ): đã có Rok, Jessica, Seraphine, Ignar, Zerith, Brakk.
- **Chưa xong** (gợi ý thứ tự):
  1. Tranh bậc S / SS còn thiếu: Lyra (thiếu tấm bắn cung), Nerissa, Elarion, Grix, Sylva, sói địch / Sói Đầu Đàn; vẽ lại vài tấm Flow sai (Jessica + Ignar thua/thắng, Zerith bay).
  2. Bấm tay kiểm tra: việc bác Borin, trang sách Thư viện, Phiến đá Hầm Mộ, NPC Kinh thành (có kiểm tra tự động rồi).
  3. Lỗi nhỏ: console báo 1 khối 3D có toạ độ NaN khi vào bản đồ 3D Ngoại ô (`computeBoundingSphere … NaN`) — chưa ảnh hưởng hình, nên tìm trong `src/world3d/build.js`.
  4. Thêm: nhạc nền / tiếng bước chân, cỏ cao gặp quái ngẫu nhiên, nhà có cửa vào được, chương 2.

## 3. Bản đồ kiểu Pokémon — chỗ nào ở đâu
| Phần | File |
|---|---|
| Luật (rương, việc, sự kiện, câu đố, mở khu theo ải, Nam/Nữ + `{cau}` `{ten}` trong lời thoại) | `game/world.js` (+ `tests/world.test.js`) |
| Lời thoại cốt truyện | `game/story.js` (token: `{cau}` cậu/cô · `{Cau}` · `{anh}` anh/chị · `{chang}` chàng trai/cô gái · `{ban}` · `{ten}` tên) |
| Ải, quái, khách đi cùng (`guests`), gia nhập (`joins`), độ mạnh quái ải đầu (`power`) | `game/chapter1.js` → `STORY_PARTY` |
| Động cơ bản đồ (đi ô, nhảy, camera, NPC đi lại, hộp thoại, màn "Bạn là ai?") | `src/ui/world.js` |
| Lưới đi được + vị trí NPC / đồ vật / lối ra | `src/world/maps.js` — **tự sinh**, đừng sửa tay |
| Ảnh nền 5 bản đồ | `src/assets/maps/*.webp` (1376×768 = 43×24 ô 32px) |
| Tranh đi bộ (3 cột × 4 hàng: xuống, trái, phải, lên) + đồ vật | `src/assets/overworld/*.webp/.json` |

**Sửa chỗ đi được / dời NPC:** mở `tools/build_maps.py`, sửa `OPS` (hình chữ nhật ô `walk` / `block`) hoặc `LAYOUT` (npcs, objects, exits), rồi:
```
python tools/build_maps.py      # cần ảnh gốc ở .team/art/maps/m0..m4.webp + .json (chỉ có ở máy cũ — xem mục 5)
npm test                        # tests/maps.test.js kiểm tra NPC/đồ vật khớp server, lối ra hợp lệ
```
Thêm NPC mới: thêm vào `NPCS` + `SCENES` trong `game/world.js`, vẽ tranh đi bộ, thêm vị trí trong `LAYOUT`.

## 4. Vẽ tranh bằng AI
**Codex** (tính vào lượt dùng — hỏi trước khi vẽ nhiều):
```
node tools/codex_draw.js <ra.png> "<đề bài tiếng Anh>" [ảnh_mẫu.png]
node tools/codex_batch.js <jobs.json> 3      # jobs: [{ "out", "prompt", "image"? }], chạy 3 lượt song song, bỏ qua file đã có
```
(Codex bị chặn ghi file trên Windows → script tự chép ảnh từ `~/.codex/generated_images`. Không dùng cờ "dangerously…".)

**Google Flow** (trình duyệt trong app, đã đăng nhập tài khoản của bạn): tải ảnh về Downloads rồi `python tools/grab_download.py <đích.webp> [rộng_tối_đa] [--key]`.

**Đóng gói tranh:**
| Việc | Lệnh |
|---|---|
| Tranh đi bộ 3×4 nền xanh lá → webp + json | `python tools/sheet_pack.py <raw.png> src/assets/overworld/<tên>.webp 3 4 96` |
| Đồ vật 3×3 | `python tools/sheet_pack.py <raw.png> src/assets/overworld/items.webp 3 3 96` |
| Quái 2 dáng (đứng · đánh) | `python tools/enemy_pack.py <tên>` |
| Thêm 2 khung bước chân cho quái | `python tools/enemy_walk_pack.py <tên> [ảnh] [--strict]` (`--strict` cho quái da xanh lá) |
| Lưới đi được tự đoán từ ảnh bản đồ | `python tools/map_mask.py <ảnh> 32 <ra.json> [soi.png]` |
| Icon kỹ năng | `src/assets/skills/<lớp>_<0..2>.webp` (128px) — tự hiện trên ô kỹ năng |

Đề bài mẫu đã dùng: `.team/art/jobs2.json` (NPC), `.team/art/jobs_skills.json` (icon), `.team/art/jobs_walk.json` (dáng đi) — chỉ có ở máy cũ.

## 5. Lưu ý
- Thư mục `.team/` (ảnh gốc AI, worktree) **không đẩy GitHub** → máy mới chỉ có tranh đã đóng gói trong `src/assets`. Muốn chạy lại `build_maps.py` ở máy mới: chép `.team/art/maps/` từ máy cũ, hoặc tải 5 ảnh `src/assets/maps/*.webp` làm ảnh gốc và chạy `map_mask.py` cho từng ảnh (m0 = outskirts, m1 = forest, m2 = ashford, m3 = road, m4 = capital).
- Không dùng `confirm()/alert()/prompt()` — hộp xác nhận làm ngay trên trang.
- Giả lập cân bằng: `node tools/sim_stage.js --stage c1-05 --level 7 [--squad warrior,assassin] [--auto] [--runs 4]`.
