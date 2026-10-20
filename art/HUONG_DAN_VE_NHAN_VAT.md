# Hướng dẫn tạo tranh nhân vật + hiệu ứng (quy trình SPRITE, chung cho cả đội)

Làm theo đúng quy trình đã dùng cho Ignar. Mỗi nhân vật có 1 file prompt riêng `art/<tên>/sprite/PROMPTS_SPRITE.md` (động tác) và `art/<tên>/fx2/PROMPTS_FX.md` (hiệu ứng), viết theo khuôn dưới đây.

## 1. Game dựng nhân vật thế nào
- **Nhân vật = sprite:** mỗi khung là 1 hình vẽ trọn thân. Mỗi động tác 1 tấm 8 khung (hoặc 2 động tác ngắn chung 1 tấm, mỗi hàng 1 động tác).
  - Khung xương cũ vẫn chạy ẩn bên dưới để giữ đúng mốc ra đòn, lúc rơi vào trận, chết, choáng.
- **Khung chính = khung ra đòn** (đẩy chưởng, chém trúng, đập khiên...). Mình canh khung này trùng đúng mốc gây sát thương của server. Bạn chỉ cần vẽ đúng thứ tự.
- **Đứng yên:** dùng 1 khung + thở bằng code (cách C), vì AI vẽ lại tóc / mắt / hoạ tiết mỗi khung → đủ khung đứng sẽ nhấp nháy.
- **Hiệu ứng = tranh nền đen, chạy khung:** nổ, cột lửa, hào quang, khiên, vật triệu hồi... Game tự tách nền, phóng to / xoay / mờ dần, đổi khung theo thời gian.

## 2. Mình làm gì khi nhận tranh (KHÔNG tô / vẽ lại)
1. Tách nền (xanh với nhân vật, đen với hiệu ứng), cắt từng khung.
2. Đưa mọi tấm về cùng cỡ, căn chân cho thân không giật.
3. Đánh dấu điểm gắn: tay, mũi vũ khí, đầu cung, chỗ phép bay ra.
4. Đóng gói atlas WebP cho nhẹ.
5. Nối vào đúng động tác / kỹ năng, giữ mốc sát thương; quay video gửi bạn duyệt.

**Khung nào hỏng thì mình báo số khung để bạn tạo lại đúng khung đó.**

## 3. Bộ tấm SPRITE chuẩn của 1 nhân vật
Mọi tấm **1536×1024, nền xanh thuần #00FF00, lưới 4 cột × 2 hàng = 8 ô đứng 384×512**, đọc trái → phải, hàng trên rồi hàng dưới.

| Tấm | Nội dung | Ghi chú |
|---|---|---|
| `sprite-idle.png` | hàng trên: đứng thường 4 · hàng dưới: thủ thế 4 | game dùng 1 khung + thở |
| `sprite-attack.png` | đánh thường 8 | khung chính theo bảng của nhân vật |
| `sprite-move.png` | chạy 8, lặp | |
| `sprite-hurt-stun.png` | trúng đòn 4 · choáng 4 lặp | sao choáng do game vẽ |
| `sprite-dead-victory.png` | gục 4 (khung 4 nằm) · thắng 4 | |
| `sprite-<chiêu>-land.png` | gồng / niệm 4 · rơi vào trận → đáp đất 4 | gồng: khung 3–4 gần giống nhau để rung khi giữ |
| `sprite-<kỹ năng>.png` | mỗi kỹ năng 8 | khung chính theo bảng của nhân vật |

## 4. Ảnh đính kèm khi tạo
- **Tấm đầu tiên (`sprite-idle`):** đính kèm 2 ảnh:
  - `art/<tên>/01-character.png`: thiết kế nhân vật;
  - `art/ignar/sprite/sprite-idle.png`: **chỉ để lấy cỡ, tỉ lệ chibi, nét vẽ**, không lấy nhân vật.
- **Các tấm sau:** đính kèm `01-character.png` + `sprite-idle.png` **của chính nhân vật đó** (vừa tạo xong).
  - Lần làm Ignar có ảnh mẫu thì các tấm chỉ lệch cỡ dưới 4%; không có ảnh mẫu thì lệch 6,5%.
- **Hiệu ứng:** đính kèm `art/ignar/fx2/fx-boom.png` làm mẫu phong cách (nét, độ rực). Hiệu ứng có nhân vật / vật triệu hồi thì đính kèm thêm hình gốc của nó.

## 5. Đoạn prompt chung — SPRITE (dán ĐẦU mỗi prompt, thay `<...>`)
```
Sprite sheet for a 2D game. Exactly the same character, outfit, weapon, colors and drawing style as the FIRST attached image (<tên nhân vật>, <mô tả ngắn: VD a chibi knight with a round blue shield and a sword>). The SECOND attached image is ONLY a reference for size, chibi proportions, line style and shading — do NOT copy its character, colors or outfit. Canvas 1536x1024, a neat grid of 4 columns x 2 rows = 8 equal cells, read left to right, top row then bottom row. ONE full-body frame per cell, three-quarter side view facing RIGHT, same scale in every frame, the character centered in his cell with his feet near the bottom of the cell, nothing cropped, nothing touching the cell borders. Keep every detail identical between frames: same face, same hair shape, same armor / clothing patterns, same weapon shape; only the pose changes. Weapons and held items are drawn in the hands as in the design. NO magic effects, no projectiles, no impact flashes, no speed lines (the game adds all effects). Flat pure green #00FF00 background, no ground shadow, no text, no numbers, no grid lines.
```

## 6. Đoạn prompt chung — HIỆU ỨNG
### Lưới A — 4 cột × 2 hàng (ô đứng 384×512)
```
Game VFX sprite sheet in the same 2D anime game art style as the attached reference (crisp shapes, bright glowing cores, soft edges). Canvas 1536x1024 on a PURE BLACK #000000 background. The canvas is an invisible grid of 4 columns x 2 rows = 8 equal cells of 384x512 pixels, read left to right, top row then bottom row. Draw exactly ONE frame in each cell, centered, filling about 75% of the cell, fully inside its own cell with black space around it — nothing crosses into another cell or touches the canvas edge. The background stays pure black between and around the effects: no glow haze, no smoke filling the background, no colored tint. Frames of the same animation have the SAME size and the SAME base point so they play smoothly; looping animations: the last frame flows seamlessly back into the first. No characters (unless asked), no text, no numbers, no grid lines.
```
### Lưới B — 2 cột × 4 hàng (ô nằm 768×256) — hình nằm trên mặt đất
```
Game VFX sprite sheet in the same 2D anime game art style as the attached reference. Canvas 1536x1024 on a PURE BLACK #000000 background. The canvas is an invisible grid of 2 columns x 4 rows = 8 equal wide cells of 768x256 pixels, read left to right, top row to bottom row. Draw exactly ONE item per cell, centered, filling about 85% of the cell width, fully inside its own cell — nothing crosses into another cell. Ground items lie FLAT ON THE GROUND seen from a low side angle, so circles appear as very wide flat ellipses (about 4 times wider than tall). The background stays pure black everywhere: no glow haze, no colored tint. No characters, no text, no numbers, no grid lines.
```

## 7. Sửa khi AI vẽ sai
- **1 khung sai:** `Keep everything identical, only redraw frame 6 so that ...`
- **Tô quầng ra nền (hiệu ứng):** `Keep the background pure black #000000 everywhere outside the effects`
- **Nền không xanh thuần (sprite):** `Make the background a flat pure green #00FF00, no gradient, no shadow`
- **Lệch lưới:** không sao, miễn mỗi khung **tách rời** và **đúng thứ tự**.

## 8. Gửi cho mình
- Gửi thẳng ảnh vào chat; xong tấm nào gửi tấm đó, không cần đủ.
- Mình lưu vào `art/<tên>/sprite/` và `art/<tên>/fx2/` đúng tên.

Tranh khung xương cũ (`02-body-parts`, `03-hands-eyes`...) không cần vẽ nữa.
