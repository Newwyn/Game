# TIẾP TỤC — viết 11/11/2026 16:55 (đọc cái này trước khi làm tiếp)

## Việc dở ngay lúc dừng
1. **Nhánh `team/cook`** (worktree `.team/wt/cook`, trợ lý Claude đang làm lúc dừng, có thể chưa xong / chưa commit): nấu ăn, túi đồ ăn, hái quả, chặt cây, đào quặng, câu cá, leo núi, dụng cụ 3 bậc, ghi chép, hình vật phẩm, mốc mở chức năng. Việc cần làm: xem `git -C .team/wt/cook status`, chạy test, commit trên nhánh, ghép vào main, bấm thử. Gỡ junction node_modules bằng PowerShell trước khi xoá worktree.
2. **Tranh quái Flow**: `~/Downloads/morwen-sprite-idle.jpg` đã tải. Còn Morwen 4 tấm, sói, sói đầu đàn, Valdric, Người Gác Mộ + quái chương 2. Hôm 11/11 Flow đã tạo 9 tấm, chưa bị chặn. Cách làm: `art/enemies/TIEN_DO.md`.
3. **Viết lại lời thoại nhiệm vụ** (`game/questData1.js`) theo giọng đã duyệt (`demo/DEMO_LOI_THOAI.md`).
4. **Làm theo quyết định mới** của người chơi: `demo/Y_TUONG_TAI_NGUYEN_VA_TRANG_BI.md` mục 11.

## Chưa bấm thử (cần kiểm tra bằng cú bấm thật)
- Quả bom của Goblin Ném Bom trong ải 1.
- Các chỗ nhảy (bậc, khe, đá nhảy, nhảy xa) và hình 3D của chúng; 6 vùng ngoài Ashford.
- Chuỗi nhánh, ải c1-n6 / c1-n7, nhiệm vụ ẩn, nhảy rào bế mèo.
- 12 / 23 cảnh sân đấu 3D chưa nhìn; tranh truyện hiện đúng ở từng ải.
- Sera dạng S sau khi sửa cỡ; Sylva và các tướng mới bật lớp động tác.
- Tool thử: Thắng / Thua ngay, Mở hết chương, phép Elarion, điện thoại.

## Lưu ý
- Thư mục `src/assets/battle/*` + `tools/battle_bg2.py`, `tools/bg_*.py`, `Claude outputs/` đang có thay đổi CHƯA commit của một phiên khác (nền trận màu nước) — người chơi không ưng, đừng commit nhầm.
- Dữ liệu `data/progress.json` đã trả về bản sao lưu trước khi thử.

---

# ▶️ TIẾP TỤC LÀM — Legend of Capsules (cập nhật 10/11/2026 đêm)

File này để mở máy khác là làm tiếp được ngay. Lịch sử chi tiết từng lần sửa: `NHAT_KY_CAP_NHAT.md` (mới nhất ở trên). Lộ trình: `docs/superpowers/plans/2026-11-06-ban1-lo-trinh.md`.

## 1. Chạy game
```
git pull
npm install
npm run dev        # server socket :3000 + vite :5173 → mở http://localhost:5173
npm test           # 118 bài kiểm tra (node --test)
```
- `npm run dev` luôn để server ở cổng 3000 (vite chuyển socket sang) — kể cả khi công cụ khác đặt biến PORT.
- Lưu tiến trình người chơi: `data/progress.json` (không đẩy GitHub — máy mới bắt đầu từ đầu). Mỗi trình duyệt có mã riêng trong localStorage `loc.clientId`.
- Thử nhanh: chế độ **Test** → **📖 Cốt truyện thử** (mở khoá tới ải 6/10/16/20, tặng tiền).

## 2. Đang ở đâu
- **Chương 1 (tộc Người) + Chương 2 (vùng Elf)** chơi được trọn: 40 ải + 9 nhánh, 9 trùm có chiêu riêng. Thanh chọn chương ở màn chọn ải.
- Bản đồ thế giới 3D (mặc định) / 2D Pokémon; **vùng Elf** đi qua cổng phía đông kinh thành. Trong nhà (quán Lena, lò rèn, nhà Bà Mira) vẽ phẳng.
- Giao diện bản đồ: bản đồ nhỏ, thanh chức năng (C/I/J/M/Esc), **Nhân vật** (chỉ số, kỹ năng, trang bị, trang phục), **Túi đồ 4 phần**, **Cửa hàng vật phẩm**, **Cài đặt**. Cỏ cao gặp quái.
- Tranh trang phục S / SS đủ 11 anh hùng. Icon vẽ AI: `src/assets/icons/` (tài nguyên, nguyên liệu, ô đồ, nút chức năng, vật phẩm nhiệm vụ).
- **10/11:** mỗi ải tối đa 3 phút · Valdric có tuyệt kỹ Thánh Hỏa Phán Quyết (khiên 5 giây, nhảy bổ xuống) · bảng Thắng/Thua chờ 2 giây · hiệu ứng trùm vẽ bằng Flow · xoá dấu Flow trên tranh.
- **Quái có bộ hình động đầy đủ như nhân vật — đang làm (4/22)**: tiến độ + cách làm ở `art/enemies/TIEN_DO.md` (đọc trước khi làm tiếp). Xem thử: `tools/enemy-viewer.html`.
- **Chưa xong** (gợi ý thứ tự):
  0. Làm tiếp bộ hình động quái (Chiến Binh Lửa dở 2/5, còn 17 loại) — Flow chặn nếu tạo dồn dập, làm chậm từng đợt.
  1. Đi bộ thử 3 căn nhà + 2 bản đồ Elf bằng tay, chỉnh lưới đi được nếu lệch (`tools/build_maps.py` → OPS / INTERIORS).
  2. Nhạc nền / tiếng động (bạn muốn để sau).
  3. Chương 3 — tộc Rồng (Brakk), theo gợi mở ở kết chương 2.
  4. Tìm cảnh báo `computeBoundingSphere NaN` (có thể ở hiệu ứng trận đấu).

## 3. Bản đồ kiểu Pokémon — chỗ nào ở đâu
| Phần | File |
|---|---|
| Luật (rương, việc, sự kiện, câu đố, mở khu theo ải, Nam/Nữ + `{cau}` `{ten}` trong lời thoại) | `game/world.js` (+ `tests/world.test.js`) |
| Lời thoại cốt truyện | `game/story.js` (token: `{cau}` cậu/cô · `{Cau}` · `{anh}` anh/chị · `{chang}` chàng trai/cô gái · `{ban}` · `{ten}` tên) |
| Ải, quái, khách đi cùng (`guests`), gia nhập (`joins`), độ mạnh quái ải đầu (`power`) | `game/chapter1.js`, `game/chapter2.js` → `STORY_PARTY` (nhiều chương: `game/campaign.js` `CHAPTERS`) |
| Lời thoại chương 2 | `game/story2.js` (khoá theo id ải `c2-07`…) |
| Quái hoang / cỏ cao | `game/wild.js` (server) · `src/world/wild.js` (ô nào là cỏ cao) |
| Bảng Nhân vật / Túi / Cửa hàng / Cài đặt | `src/ui/heroPanel.js` + `src/styles/heropanel.css` · server: `heroPanelPayload`, socket `heroPanelOpen` `setSkin` `buyItem` `heroUseItem` |
| Icon | `src/ui/icons.js` → `src/assets/icons/<mã>.webp` |
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
| Quái 4 dáng (đứng · đánh · 2 bước) | `python tools/enemy_pack4.py <ảnh.png> <tên> [--strict]` |
| Tranh trang phục S / SS (Codex) | `python tools/tier_jobs.py > .team/art/jobs_tier.json` → `node tools/codex_batch.js … 4` → `python tools/tier_jobs.py install` → `python tools/tier_art.py spec <tên> <s|ss>` → `python tools/sprite_pack.py art/<tên>/sprite_<s|ss>/sprite_spec.json` (cần `pip install numpy scipy scikit-image opencv-python`) |
| Thêm 2 khung bước chân cho quái | `python tools/enemy_walk_pack.py <tên> [ảnh] [--strict]` (`--strict` cho quái da xanh lá) |
| Lưới đi được tự đoán từ ảnh bản đồ | `python tools/map_mask.py <ảnh> 32 <ra.json> [soi.png]` |
| Icon kỹ năng | `src/assets/skills/<lớp>_<0..2>.webp` (128px) — tự hiện trên ô kỹ năng |

Đề bài mẫu đã dùng: `.team/art/jobs2.json` (NPC), `.team/art/jobs_skills.json` (icon), `.team/art/jobs_walk.json` (dáng đi) — chỉ có ở máy cũ.

## 5. Lưu ý
- Thư mục `.team/` (ảnh gốc AI, worktree) **không đẩy GitHub** → máy mới chỉ có tranh đã đóng gói trong `src/assets`. Muốn chạy lại `build_maps.py` ở máy mới: chép `.team/art/maps/` từ máy cũ, hoặc tải 5 ảnh `src/assets/maps/*.webp` làm ảnh gốc và chạy `map_mask.py` cho từng ảnh (m0 = outskirts, m1 = forest, m2 = ashford, m3 = road, m4 = capital).
- Không dùng `confirm()/alert()/prompt()` — hộp xác nhận làm ngay trên trang.
- Giả lập cân bằng: `node tools/sim_stage.js --stage c1-05 --level 7 [--squad warrior,assassin] [--auto] [--runs 4]`.
