# Grix (Lục Độc) — bộ HIỆU ỨNG vẽ theo khung (8 tấm)

Theo quy trình chung `art/HUONG_DAN_VE_NHAN_VAT.md` §6 (như Ignar / Zerith): tranh **nền đen tuyền**, lưới cố định, game tự tách nền,
cắt khung (`tools/fx_grid_pack.py art/grix/fx2/fx2_spec.json`) rồi chạy khung trong `src/vfx/goblinFx.js`.
Ảnh mẫu phong cách: đính kèm `art/ignar/fx2/fx-boom.png` (nét, độ rực) — **chỉ lấy phong cách, KHÔNG lấy màu lửa**.
Bảng màu Grix: **xanh lục độc phát sáng** (lime #a3e635, lõi gần trắng-vàng chanh) · **xanh axit** #84cc16 · **lục đậm** #365314 ·
**tím mận** điểm xuyết #7e22ce · thuỷ tinh trong · đồng thau (vạc).

| # | Tấm | Lưới | Dùng ở |
|---|---|---|---|
| 1 | `fx-vial.png` | A | lọ độc nhỏ bay (đánh thường) · trúng độc nhỏ (đánh thường, Độc mỗi giây) |
| 2 | `fx-flask.png` | A | bình độc lớn bay (KN1) · bình vàng hồi máu bay (thiên phú 1) |
| 3 | `fx-splash.png` | A | bình vỡ trên đất 8 khung (KN1) |
| 4 | `fx-ground.png` | B | vòng báo · vũng axit · đầm lầy 4 khung lặp · vòng Giáp Độc · sóng nổ |
| 5 | `fx-cauldron.png` | A | vạc đồng hiện ra · vạc sôi lặp (KN2) |
| 6 | `fx-sludge.png` | A | cục bùn độc bay (KN2) · khói độc bốc lên từ đầm |
| 7 | `fx-detonate.png` | A | nổ độc lớn 8 khung (KN3) |
| 8 | `fx-magic.png` | A | vòng xoáy độc khi bay niệm (KN3) · loé búng tay · đầu lâu Mục Rữa · vòm Giáp Độc · luồng hồn độc lây |

## Đoạn chung — Lưới A (4 cột × 2 hàng, ô 384×512)
```
Game VFX sprite sheet in the same 2D anime game art style as the attached reference (crisp shapes, bright glowing cores, soft edges) but in a TOXIC POISON color palette: glowing lime green #a3e635 with near-white lime cores, acid green #84cc16, deep swamp green #365314, small plum-purple #7e22ce accents, clear glass. Do NOT use orange, red or fire colors. Canvas 1536x1024 on a PURE BLACK #000000 background. The canvas is an invisible grid of 4 columns x 2 rows = 8 equal cells of 384x512 pixels, read left to right, top row then bottom row. Draw exactly ONE frame in each cell, centered, filling about 75% of the cell, fully inside its own cell with black space around it — nothing crosses into another cell or touches the canvas edge. The background stays pure black between and around the effects: no glow haze, no smoke filling the background, no colored tint. Frames of the same animation have the SAME size and the SAME base point so they play smoothly; looping animations: the last frame flows seamlessly back into the first. No characters, no text, no numbers, no grid lines.
```

## Đoạn chung — Lưới B (2 cột × 4 hàng, ô nằm 768×256) — hình nằm trên mặt đất
```
Game VFX sprite sheet in the same 2D anime game art style as the attached reference but in a TOXIC POISON color palette: glowing lime green #a3e635, acid green #84cc16, deep swamp green #365314, small plum-purple #7e22ce accents. Do NOT use orange, red or fire colors. Canvas 1536x1024 on a PURE BLACK #000000 background. The canvas is an invisible grid of 2 columns x 4 rows = 8 equal wide cells of 768x256 pixels, read left to right, top row to bottom row. Draw exactly ONE item per cell, centered, filling about 85% of the cell width, fully inside its own cell — nothing crosses into another cell. Ground items lie FLAT ON THE GROUND seen from a low side angle, so circles appear as very wide flat ellipses (about 4 times wider than tall). The background stays pure black everywhere: no glow haze, no colored tint. No characters, no text, no numbers, no grid lines.
```

## Đoạn riêng từng tấm

### 1 · `fx-vial.png` (lưới A)
```
TOP ROW, frames 1-4: a SMALL corked glass potion vial filled with glowing lime-green poison, tumbling through the air, seamless 4-frame spin loop (the vial rotates about 90 degrees per frame), a thin trail of green droplets behind it to the LEFT, same size and same center in every frame, the vial fills only about 35% of the cell.
BOTTOM ROW, frames 5-8: a SMALL poison IMPACT splash centered in the cell: frame 5 a bright lime flash star with a few glass glints, frame 6 a ring of green acid droplets bursting outward, frame 7 thinner droplets and rising bubbles, frame 8 last tiny bubbles and green wisps fading.
```

### 2 · `fx-flask.png` (lưới A)
```
TOP ROW, frames 1-4: a LARGE round alchemy flask (glass bulb with a cork and a short neck) full of bubbling glowing toxic-green liquid with a skull-shaped bubble inside, tumbling through the air, seamless 4-frame spin loop, dripping green trail to the LEFT, same size and same center in every frame, about 55% of the cell.
BOTTOM ROW, frames 5-8: the SAME large flask shape but filled with glowing GOLDEN-MINT healing liquid (warm gold #facc15 with mint green #6ee7b7 sparkles, no skull), tumbling in a seamless 4-frame spin loop, sparkling trail to the LEFT, same size and same center in every frame.
```

### 3 · `fx-splash.png` (lưới A)
```
Frames 1-8: ONE big poison flask SHATTER animation on the ground, bottoms aligned on the same ground line near the bottom of each cell. Frame 1: the glass flask hits the ground with a bright lime flash and glass cracks. Frame 2: glass shards fly out and a crown of green acid splashes upward. Frame 3: tall splash crown with droplets and shards, the biggest. Frame 4: the splash falls back, a wide acid puddle forms with big bubbles. Frame 5: bubbling puddle with green fumes rising. Frame 6: fumes rising higher, bubbles popping, a few purple sparks. Frame 7: thin toxic fumes, small bubbles. Frame 8: last wisps of green vapor fading.
```

### 4 · `fx-ground.png` (lưới B, hình nằm trên đất)
```
Cell 1: a thin glowing lime-green WARNING ring on the ground with small alchemy rune marks around it (target marker), empty inside.
Cell 2: a splattered ACID PUDDLE: irregular glossy toxic-green liquid splash with darker green edges, glass shards and a few bubbles.
Cells 3-6: a bubbling POISON SWAMP POOL, the SAME pool in 4 frames forming a seamless loop: murky deep green sludge with a glowing lime surface, slowly swirling, bubbles rising and popping in different places each frame, a small skull-shaped bubble in one frame, same outline and size in all 4 cells.
Cell 7: a glowing toxic-green HEXAGON-PATTERN RING on the ground (base of a poison shield), dripping, with small purple runes.
Cell 8: a wide expanding SHOCKWAVE RING of green poison mist and droplets on the ground (burst), bright lime edge.
```

### 5 · `fx-cauldron.png` (lưới A)
```
A small round BRASS ALCHEMY CAULDRON on three short legs with riveted bands and two ring handles, full of bubbling glowing toxic-green brew, seen from the side three-quarter view, bottoms aligned on the same ground line near the bottom of each cell, the cauldron about 55% of the cell wide.
TOP ROW, frames 1-4: the cauldron APPEARS: frame 1 a burst of green smoke on the ground with a faint cauldron silhouette, frame 2 the cauldron rising out of the smoke, frame 3 the cauldron fully visible bouncing slightly, the brew splashing, frame 4 settled with a big green bubble on the brew.
BOTTOM ROW, frames 5-8: the SAME cauldron BOILING, seamless 4-frame loop: the brew bubbling over the rim, green steam rising and curling above it, bubbles in different places each frame, the cauldron itself stays identical and in the same position.
```

### 6 · `fx-sludge.png` (lưới A)
```
TOP ROW, frames 1-4: a big GLOB of thick toxic-green sludge flying to the RIGHT, seamless 4-frame wobble loop: a glossy round blob with a bright lime highlight and a skull-like bubble, dripping goo tail streaming to the LEFT, same size and same center in every frame.
BOTTOM ROW, frames 5-8: TOXIC FUMES rising from the ground, seamless 4-frame loop: wavy green vapor columns with small bubbles and purple sparkles drifting upward, bottoms aligned on the same ground line near the bottom of the cell, same width in every frame.
```

### 7 · `fx-detonate.png` (lưới A)
```
Frames 1-8: ONE big POISON EXPLOSION animation on the ground, bottoms aligned on the same ground line near the bottom of each cell. Frame 1: a small blinding white-lime flash at the ground. Frame 2: a fast expanding ball of glowing green poison gas. Frame 3: big explosion with a tall column of toxic gas shooting up and acid splashes flying out. Frame 4: peak explosion, biggest, with a skull shape forming in the rising gas cloud, purple sparks. Frame 5: the gas cloud starts breaking apart into green wisps. Frame 6: dark green smoke rising with glowing lime droplets. Frame 7: mostly murky green smoke with a few droplets. Frame 8: thin fading green smoke wisps.
```

### 8 · `fx-magic.png` (lưới A)
```
TOP ROW, frames 1-4: a swirling TOXIC VORTEX aura (seen from the side, around where a small floating caster would be, the caster is NOT drawn), seamless 4-frame loop: two rings of glowing green poison mist spiraling around an empty center, potion-vial-shaped sparks and bubbles orbiting, bottoms aligned near the bottom of the cell, same size in every frame.
Frame 5: a FINGER-SNAP FLASH: a crisp 8-point star of bright white-lime light with a ring shockwave, centered.
Frame 6: a ROTTING SKULL mark icon: a cute but creepy green skull with purple glowing eye holes, dripping green slime, centered, about 45% of the cell.
Frame 7: a POISON SHIELD DOME: a translucent bubble dome made of glowing green hexagon cells with drips running down, seen from the side, empty inside, bottom flat near the bottom of the cell.
Frame 8: a POISON SPREAD WISP: a flying green ghostly wisp with a small skull face, trailing mist to the LEFT, flying to the RIGHT, centered.
```
