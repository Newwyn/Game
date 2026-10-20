# Ignar — bộ HIỆU ỨNG mới (9 tấm) để hoàn chỉnh nhân vật

Lưu các tấm vào `art/ignar/fx2/` đúng tên, hoặc gửi vào chat như lúc làm sprite. Xong tấm nào gửi tấm đó, không cần chờ đủ 9.

## 1. Hiện trạng → bản mới

| Hiệu ứng | Dùng ở | Hiện có | Bản mới |
|---|---|---|---|
| Lửa trên tay | luôn cầm, quanh khiên lửa | 1 hình, code lắc nhẹ | **4 khung lặp** |
| Cầu lửa bay | đánh thường, Hộ Vệ ném | 1 hình | **4 khung lặp** |
| Trúng cầu lửa | đánh thường, Hộ Vệ, nhịp cháy | code vẽ (tia + quầng) | **4 khung** |
| Cầu lửa xoáy lớn | Hỏa Chưởng, chưởng toàn thể | 1 hình | **4 khung lặp** |
| Nổ lửa | Thiên Hỏa Cầu, Hỏa Chưởng, Giáp Lửa vỡ, chưởng đất | 4 khung, viền đỏ đục | **8 khung** |
| Thiên thạch rơi | Thiên Hỏa Cầu | 1 hình | **4 khung lặp** |
| Ngọn lửa biển lửa | biển lửa sau Thiên Hỏa Cầu | mượn khung cột lửa | **4 khung lặp riêng** |
| Vòng báo / đất cháy / vòng phép / vòng triệu hồi / sóng lửa / chưởng đất | các kỹ năng | 3 hình + code | **8 hình nằm trên đất** |
| Biểu tượng phá giáp | Cột Lửa trúng (−M.DEF) | 1 hình | 1 hình mới |
| Cột lửa | Cột Lửa Phá Ma | 6 khung | **8 khung** (bùng → cháy lặp → tắt) |
| Hào quang lửa | gồng Hỏa Thần | 3 khung, nền đỏ | **4 khung lặp** |
| Cánh lửa | Hỏa Thần hiện, Giáp Lửa bật | 1 hình | **4 khung bung cánh** |
| Luồng chưởng | Hỏa Chưởng, chưởng toàn thể | 1 hình | **4 khung** |
| Khiên lửa | lúc Hỏa Thần, Giáp Lửa | code vẽ quả cầu | **4 khung lặp** |
| Hộ Vệ Thần Lửa | suốt Hỏa Thần | 3 dáng | **8 khung**: bay lặp 4 · ném 2 · gầm 2 |

**Lỗi bản cũ:** nền tấm fx-a / fx-c có quầng đỏ, khi tách nền thành **viền đục quanh lửa**, và có ít khung. Bản mới cần **nền đen tuyền**, lưới cố định để mình cắt tự động.

## 2. Cách tạo
1. Mỗi tấm tạo **1 lần đủ khung**. Đính kèm `art/ignar/fx-a.png` làm mẫu phong cách lửa.
2. Dán **đoạn chung** đúng loại lưới (mục 3), rồi dán **đoạn riêng** của tấm (mục 4).
3. Nền phải **đen tuyền**. AI tô quầng sáng ra cả nền thì nhắn: `Keep the background pure black #000000 everywhere outside the effects`.
4. Khung lệch thì nhắn vẽ lại riêng khung đó: `Keep everything identical, only redraw frame 3 so that ...`.
5. Mọi tấm 1536×1024.

## 3. Đoạn chung

### Lưới A — 4 cột × 2 hàng (ô đứng 384×512): tấm 1, 2, 3, 4, 6, 7, 8, 9
```
Game VFX sprite sheet in the same 2D anime game art style as the attached reference (rich orange, yellow and red fire, bright white-yellow cores, crisp flame shapes, soft edges). Canvas 1536x1024 on a PURE BLACK #000000 background. The canvas is an invisible grid of 4 columns x 2 rows = 8 equal cells of 384x512 pixels, read left to right, top row then bottom row. Draw exactly ONE frame in each cell, centered, filling about 75% of the cell, fully inside its own cell with black space around it — nothing crosses into another cell or touches the canvas edge. The background stays pure black between and around the effects: no glow haze, no smoke filling the background, no red tint. Frames of the same animation have the SAME size and the SAME base point so they play smoothly; looping animations: the last frame flows seamlessly back into the first. No characters (unless asked), no text, no numbers, no grid lines.
```

### Lưới B — 2 cột × 4 hàng (ô nằm 768×256): tấm 5 (hình trên mặt đất)
```
Game VFX sprite sheet in the same 2D anime game art style as the attached reference (rich orange, yellow and red fire, bright cores, crisp shapes). Canvas 1536x1024 on a PURE BLACK #000000 background. The canvas is an invisible grid of 2 columns x 4 rows = 8 equal wide cells of 768x256 pixels, read left to right, top row to bottom row. Draw exactly ONE item per cell, centered, filling about 85% of the cell width, fully inside its own cell — nothing crosses into another cell. Ground items lie FLAT ON THE GROUND seen from a low side angle, so circles appear as very wide flat ellipses (about 4 times wider than tall). The background stays pure black everywhere: no glow haze, no red tint. No characters, no text, no numbers, no grid lines.
```

## 4. Đoạn riêng từng tấm

### Tấm 1 · `fx-hand.png` — lửa trên tay + cầu lửa bay (lưới A) ★★★
```
TOP ROW, frames 1-4: a small magic flame floating above an open palm (the hand is NOT drawn), a seamless 4-frame flicker loop: the same flame each time with the tongues of fire shifting upward, same size, same base point at the bottom center of the cell, a tiny bright core at the bottom.
BOTTOM ROW, frames 5-8: a fireball projectile flying to the RIGHT, seamless 4-frame loop: a bright round fire core at the right side with a short flickering flame tail streaming to the left, same size and same core position in every frame, only the flames of the tail change.
```

### Tấm 2 · `fx-boom.png` — nổ lửa 8 khung (lưới A) ★★★
```
Frames 1-8: ONE fire explosion animation on the ground, bottoms aligned on the same ground line near the bottom of each cell. Frame 1: a small bright white-yellow flash at the ground. Frame 2: a fast expanding fireball burst. Frame 3: big explosion with flames shooting up and out. Frame 4: peak explosion, biggest, with flying embers and small glowing rock bits. Frame 5: the fireball starts breaking apart into tongues of flame. Frame 6: flames shrinking, dark smoke rising with glowing embers. Frame 7: mostly dark grey smoke with a few embers. Frame 8: thin fading smoke wisps.
```

### Tấm 3 · `fx-hit.png` — trúng cầu lửa + cầu lửa xoáy lớn (lưới A) ★★★
```
TOP ROW, frames 1-4: a small fire IMPACT burst where a fireball hits a target, centered in the cell: frame 1 a bright flash star, frame 2 a ring of flame and sparks bursting outward, frame 3 the flames spreading thinner with flying sparks, frame 4 last sparks and wisps fading.
BOTTOM ROW, frames 5-8: a BIG SWIRLING FIREBALL projectile flying to the RIGHT, seamless 4-frame loop: a spinning spiral of flame around a bright core at the right side with a thick swirling tail to the left, the spiral rotates a little each frame, same size and same core position in every frame.
```

### Tấm 4 · `fx-meteor.png` — thiên thạch + ngọn lửa biển lửa (lưới A) ★★
```
TOP ROW, frames 1-4: a giant blazing METEOR falling STRAIGHT DOWN, seamless 4-frame loop: a molten rock core at the BOTTOM of the cell wrapped in fire, with a long roaring flame tail pointing straight UP to the top of the cell, same size and same core position in every frame, only the flames of the tail change.
BOTTOM ROW, frames 5-8: a SMALL TUFT OF FLAMES burning on the ground (for a burning field), seamless 4-frame flicker loop, bottoms aligned on the same ground line near the bottom of each cell, about half the cell tall, same width in every frame.
```

### Tấm 5 · `fx-ground.png` — hình nằm trên đất (lưới B) ★★
```
Cell 1: a red-orange TARGET WARNING CIRCLE on the ground: a glowing ring with a few runes and arrows pointing inward, thin and clean.
Cell 2: a SCORCHED BURNING GROUND patch: cracked blackened earth with glowing lava cracks and tiny flames, wide and low.
Cell 3: a FIRE MAGIC CIRCLE with runes on the ground, just forming: thin dim orange lines, partly drawn.
Cell 4: the SAME fire magic circle as cell 3, fully lit: bright glowing runes and lines, small flames along the outer ring.
Cell 5: a large ornate FIRE SUMMONING CIRCLE with a flaming star and runes, different from the circle in cells 3-4, bright.
Cell 6: a FIRE SHOCKWAVE RING: a thin flat ring of flame expanding along the ground, empty in the middle.
Cell 7: a low wide GROUND SLAM fire burst: flames and rock bits splashing sideways along the ground from a central impact.
Cell 8: a "DEFENSE BREAK" icon (NOT on the ground, front view, centered): a cracked violet crystal shield with a small flame and a downward arrow.
```

### Tấm 6 · `fx-pillar.png` — cột lửa 8 khung (lưới A) ★★
```
Frames 1-8: ONE tall FIRE PILLAR erupting from the ground, bottoms aligned on the same ground line near the bottom of each cell, same width in every frame. Frame 1: a small burst of flame at the ground. Frame 2: the pillar shooting up to half height. Frame 3: full tall pillar reaching the top of the cell. Frames 4, 5, 6: the full pillar roaring, flames swirling upward — three frames for a seamless loop (frame 6 flows back into frame 4). Frame 7: the pillar weakening and thinning. Frame 8: last flames and embers at the ground.
```

### Tấm 7 · `fx-firegod.png` — hào quang + cánh lửa Hỏa Thần (lưới A) ★★
```
TOP ROW, frames 1-4: a tall FLAME AURA rising from the ground around a standing chibi character (the character is NOT drawn — the middle stays empty and dark), flames on the left and right sides dancing upward, seamless 4-frame loop, bottoms aligned, same size.
BOTTOM ROW, frames 5-8: a pair of large FIRE WINGS seen from the side, opening: frame 5 small folded wings of flame, frame 6 half open, frame 7 fully spread wide, frame 8 fully spread with flames and feathers of fire scattering. Same center point in every frame.
```

### Tấm 8 · `fx-palm-shield.png` — luồng chưởng + khiên lửa (lưới A) ★★
```
TOP ROW, frames 1-4: a FIRE PALM BLAST bursting to the RIGHT from a point at the left edge of the cell, middle height (the hand is NOT drawn): frame 1 a bright flash at the origin, frame 2 a cone of fire shooting right, frame 3 the full cone of flames with sparks, frame 4 the cone breaking into flame wisps.
BOTTOM ROW, frames 5-8: a FIRE SHIELD DOME big enough to cover a standing chibi character, front view: a translucent glowing orange sphere outlined by a bright rim of flame with a faint flame pattern, the INSIDE stays mostly empty and dark (the character will be seen through it), seamless 4-frame loop with the rim flames flowing around, same size in every frame.
```

### Tấm 9 · `fx-guardian.png` — Hộ Vệ Thần Lửa 8 khung (lưới A, đính kèm thêm `art/ignar/05-guardian.png`) ★★
```
The SAME fire guardian spirit as the attached guardian image: a fiery humanoid made of living flames with dark molten-rock armor plates and glowing eyes, floating, its lower body a swirling flame tail, facing RIGHT, same size and same height in every frame. Frames 1-4: idle hovering, seamless 4-frame loop, the body bobbing slightly and the flames flowing upward. Frame 5: winding up to throw, one arm pulled back holding a ball of fire. Frame 6: throwing, the arm thrust forward toward the right (the fireball is NOT drawn, the game adds it). Frame 7: starting to roar, both arms rising. Frame 8: roaring with both arms raised high and flames bursting out of the body.
```

## 5. Mình làm khi nhận tấm
- **Cắt theo lưới**, tách nền đen thành trong suốt, giữ độ rực của lửa. Không tô sửa.
- **Nối từng hiệu ứng vào đúng kỹ năng:**
  - chạy khung theo thời gian;
  - khung lặp khi kéo dài (lửa tay, cầu lửa bay, hào quang, khiên, cột lửa đang cháy, Hộ Vệ bay);
  - giữ đúng mốc sát thương của server.
- **Gửi video từng kỹ năng để bạn duyệt.** Khung nào hỏng mình báo số khung để tạo lại.
