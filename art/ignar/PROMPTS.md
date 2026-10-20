# Ignar (Hỏa Ngục) bản 2 — bộ tranh để ráp thẳng vào game

Luật chung xem `art/HUONG_DAN_VE_NHAN_VAT.md`. Lưu tất cả vào **1 thư mục** `ignar-v2`, đặt đúng tên file.
- Ảnh mẫu khi vẽ **01 / 01b**: đính kèm `art/ignar/01-character.png` hiện tại (giữ thiết kế nhân vật).
- Khi vẽ **02 / 03**: đính kèm **01 mới** vừa vẽ.
- Khi vẽ **05 / fx**: đính kèm `art/ignar/fx-a.png` hiện tại làm mẫu phong cách hiệu ứng.

## A. Những động tác code đã có (tự chạy với mảnh mới)
| Động tác | Dùng khi | Bàn tay cần |
|---|---|---|
| idle / ready | đứng thở, thủ thế | thả lỏng · ngửa (giữ lửa) |
| move | chạy | ngửa |
| fall → land | rơi xuống mở màn | — |
| attack | đánh thường: ném cầu lửa | đẩy chưởng → ngửa |
| summon | Thiên Hỏa Cầu: giơ tay gọi thiên thạch | giơ trời |
| bolt | Cột Lửa: giơ tay rồi chưởng xuống | giơ trời → đẩy chưởng |
| charge | gồng Hỏa Thần (giữ) | nắm đấm 2 tay |
| palm | Hỏa Chưởng (lúc Hỏa Thần) | đẩy chưởng |
| volley | nhảy chưởng toàn thể | đẩy chưởng 2 tay |
| hurt / stunned / victory / dead | trúng đòn, choáng, thắng, gục | thả lỏng · giơ trời |

**Mắt cần:** mở · nhắm (chớp) · giận · quyết tâm · đau · cười.

**Mảnh lò xo mới so với bản cũ** (đung đưa → mượt hơn): tóc sau, khăn vai, vạt áo sau, vạt áo trước có dây xích.

## B. Hiệu ứng → kỹ năng (vẽ lại thì code nối lại đúng chỗ)
| Hình (tấm) | Dùng ở | Khung |
|---|---|---|
| Lửa trên lòng bàn tay (fx-a) | luôn cầm trên tay xa, Hỏa Thần thì 3 ngọn quanh người | **3 khung lặp** (bản cũ 1) |
| Cầu lửa bay (fx-a) | đánh thường | 1 |
| Nổ lửa (fx-a) | đánh thường, Thiên Hỏa Cầu | **6 khung** (bản cũ 4) |
| Cầu lửa xoáy lớn (fx-a) | đòn mạnh / nạp lửa | 1 |
| Vết cháy đất (fx-a) | biển lửa sau Thiên Hỏa Cầu | 1 |
| Thiên thạch rơi thẳng (fx-b) | Thiên Hỏa Cầu | 1 |
| Vòng phép dưới đất (fx-b) | Cột Lửa: báo trước chỗ bùng | 1 |
| Biểu tượng phá giáp (fx-b) | Cột Lửa trúng: −M.DEF | 1 |
| Cột lửa (fx-b) | Cột Lửa Phá Ma | **6 khung** |
| Vòng triệu hồi lớn (fx-c) | Hỏa Thần Giáng Lâm | 1 |
| Đôi cánh lửa (fx-c) | Hỏa Thần Giáng Lâm | 1 |
| Hào quang lửa quanh người (fx-c) | suốt Hỏa Thần | **4 khung lặp** (bản cũ 3) |
| Luồng chưởng lửa ngang (fx-c) | Hỏa Chưởng | 1 |
| Vòng sao choáng (fx-c) | nhảy chưởng làm choáng | 1 |
| Vòm Giáp Lửa (fx-c) | thiên phú 2 — Giáp Lửa | 1 (mới) |
| Hộ Vệ Thần Lửa (05) | Hỏa Thần: thần lửa ném cầu lửa | **4 dáng** (bản cũ 3) |

Thêm khung / hình mới thì mình sửa code dùng đủ số khung — bạn chỉ cần vẽ đúng thứ tự.

---

## 01-character.png (1024×1536, nền trong suốt)
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed outfit and accessories, crisp clean line art, soft cel shading, vibrant saturated colors. Redraw the SAME character as the attached image (Ignar, a young fire mage) as a clean model-sheet pose: strict side view (profile) facing RIGHT, full body, standing straight, both arms held slightly away from the body and slightly forward so the whole upper arm, elbow, forearm and hand are clearly visible and do not overlap the torso, legs slightly apart with both boots visible. Keep the same design: spiky crimson-red hair with orange tips, amber eyes, black and crimson mage coat with golden flame patterns and gold trim, short shoulder capelet, waist sash with hanging gold chains and small red gem pendants, a long back coat tail and a shorter front coat flap, wide flame-pattern sleeve cuffs, dark baggy trousers, black-and-gold boots. Empty hands, no fireball (the game adds the fire). Transparent background, no ground shadow, no text.
```

## 01b-portrait.png (1024×1536, nền trong suốt) — ảnh màn chọn đội
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height, large expressive anime eyes, short arms and legs, highly detailed outfit, crisp clean line art, soft cel shading, vibrant colors. Same character as the attached Ignar image, dynamic spell-casting pose, one hand raised holding a roaring fireball, embers swirling around, coat and capelet blowing in the heat. Full body, transparent background, no text.
```

## 02-body-parts.png (1536×1024, nền trong suốt)
```
Chibi 2D game art, same character, same chibi proportions, same colors and the SAME SIZE as the attached full-body reference (every part exactly as big as it appears on the full-body image). Character parts sheet for 2D cutout skeletal animation (Spine style). Strict side view facing RIGHT. Every part drawn separately with generous empty space between parts, nothing overlapping, nothing cropped, no part touching another part. Every joint end is drawn as a full ROUNDED cap (ball-joint shape) so parts can rotate without gaps: the top of each upper arm (shoulder) and its bottom (elbow) are round, the top of each forearm (elbow) is round, the top of each thigh (hip) and its bottom (knee) are round, the top of each shin (knee) is round, the neck stub has a round bottom. Parts: (1) head with face, front bangs and ear, eyes OPEN, short neck stub, WITHOUT the back hair; (2) back hair spikes as a separate piece; (3) torso: coat upper body from collar to hips with the waist sash, NO arms, NO legs, NO capelet, NO coat tails, round neck opening, rounded shoulders, rounded hip bottom; (4) short shoulder capelet as a separate piece; (5) long back coat tail panel; (6) front coat flap with the hanging gold chains and red gem pendants; (7) upper arm near side with the sleeve; (8) upper arm far side; (9) forearm near side with the wide flame-pattern sleeve cuff, the cuff open and hollow at the wrist (no hand); (10) forearm far side, same; (11) thigh near, baggy trousers; (12) thigh far; (13) shin with boot near, toe pointing right; (14) shin with boot far. Arrange in neat rows. Flat even lighting, transparent background, no text, no labels, no numbers.
```

## 03-hands-eyes.png (1536×1024, nền trong suốt)
```
Chibi 2D game art, same character as the attached reference, same skin tone and same size as on the full-body image. Sheet of separate hands and eye expressions for 2D cutout animation. TOP ROW, 6 small chibi bare hands drawn HORIZONTALLY with the wrist on the LEFT and the fingers toward the RIGHT, side view, each with a short rounded wrist stub (no sleeve): (1) relaxed hand; (2) open palm facing UP, slightly cupped as if holding a small flame, but empty; (3) open palm pushing forward, palm facing right, fingers up; (4) closed fist; (5) open hand raised to the sky, fingers spread like a claw; (6) pointing index finger. BOTTOM ROW, 6 close-up chibi eye patches of the same side-view face, each one big anime eye with a small patch of skin around it, same angle, same size and same skin tone as the eye on the head: (1) open normal, (2) closed blink, (3) angry, (4) determined narrowed, (5) pain squeezed shut, (6) happy closed smile. Everything separated with space, transparent background, no text.
```

---

## Hiệu ứng (mỗi tấm 1536×1024, nền đen tuyền)
Dán câu này lên **đầu mỗi prompt** hiệu ứng:
```
Game VFX sprite sheet in the same 2D anime game style as the attached reference, on a pure black background, bright glowing fire effects with rich orange, yellow and red colors, each effect isolated with plenty of black space around it, nothing touching the edges, no text, no labels. Animation frames of the same effect are drawn in order from left to right, every frame the SAME SIZE and on the SAME baseline so they play smoothly.
```

### fx-a.png — lửa tay, cầu lửa, nổ
```
Row 1: (1) (2) (3) a small flame floating above an open palm, three animation frames of the same flickering flame for a seamless loop, same size and same base point; (4) a fireball projectile flying to the right with a short fiery tail. Row 2: (5) (6) (7) (8) fire explosion animation frames 1 to 4: small bright flash, expanding fireball burst, peak explosion with flying embers and rock bits, explosion breaking apart. Row 3: (9) (10) explosion frames 5 and 6: dark smoke with glowing embers, fading thin smoke; (11) a big swirling spiral fireball; (12) a scorched burning patch of ground with small flames, side view, wide and low.
```

### fx-b.png — Thiên Hỏa Cầu, Cột Lửa
```
Top row: (1) a giant blazing meteor fireball falling STRAIGHT DOWN with a long flame tail pointing up, tall; (2) a glowing fire magic circle with runes lying flat on the ground, seen from a low side angle (wide flat ellipse); (3) a "defense break" icon: a cracked violet crystal shield with a small flame. Bottom row, the lower two thirds of the image: (4) to (9) six tall animation frames of the same FIRE PILLAR erupting from the ground: tiny flame at the ground, pillar rising, full tall pillar, peak with swirling flames, weakening pillar, last embers. All six frames the same width, bottoms aligned on the same ground line.
```

### fx-c.png — Hỏa Thần Giáng Lâm, Giáp Lửa
```
(1) a large fire summoning circle with runes lying flat on the ground, seen from a low side angle (very wide flat ellipse); (2) a pair of large spread fire wings, side view facing right; (3) (4) (5) (6) four animation frames of a tall flame aura that surrounds a standing chibi character (the middle is empty, no character drawn), flames dancing upward, same size, bottoms aligned, loopable; (7) a horizontal fire palm blast streak shooting to the right; (8) a small ring of dizzy stars with tiny flames; (9) a translucent orange fire shield dome with a flame pattern, big enough to cover a chibi character, front view.
```

### 05-guardian.png — Hộ Vệ Thần Lửa (1536×1024, nền đen tuyền)
```
Same 2D anime game style as the attached reference, pure black background. A fire guardian spirit: a fiery humanoid made of living flames with dark molten-rock armor plates and glowing eyes, floating, its lower body a swirling flame tail. Four poses of the SAME spirit side by side, same size, same height, facing RIGHT, each separated with black space: (1) idle hovering; (2) idle hovering, flames shifted (second frame for a breathing loop); (3) throwing a fireball forward with one arm extended; (4) roaring with both arms raised and flames bursting. No text.
```

---

## Gửi lại
- Nén thư mục `ignar-v2` gửi vào đây.
- Mình ráp xong gửi ảnh từng động tác + từng kỹ năng để bạn duyệt trước khi lưu vào game.
- Tấm nào AI không xếp đúng hàng / cột cũng được, miễn các hình **tách rời** và chuỗi khung **đúng thứ tự trái → phải**.
