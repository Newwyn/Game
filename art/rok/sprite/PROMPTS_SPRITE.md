# Rok (Thiết Hộ) — TẠO HÌNH MỚI (hiệp sĩ châu Âu) + bộ tấm SPRITE

Luật chung, đoạn prompt chung, câu sửa khi AI vẽ sai: `art/HUONG_DAN_VE_NHAN_VAT.md`. Hiệu ứng của Rok (Khiên Thần...): `art/rok/fx2/PROMPTS_FX.md`.

## 0. Tạo hình mới (làm TRƯỚC mọi tấm khác)

**Rok bản 3 — hiệp sĩ trẻ kiểu châu Âu:**
- **Tóc:** bạch kim (trắng ánh vàng), cắt gọn, mái hơi vuốt sang bên. Mắt xanh dương.
- **Giáp:** giáp tấm thép bạc sáng bóng, viền vàng.
  - Áo khoác ngoài (tabard) trắng có **hình sư tử vàng** ở ngực.
  - Áo choàng xanh hoàng gia viền vàng. Găng và giày giáp.
- **Kiếm:** trường kiếm thép, chuôi chữ thập vàng.
- **Khiên:** khiên hình **"heater"** (đầu bằng, đáy nhọn) — nền trắng, viền xanh hoàng gia + vàng, **sư tử vàng đứng chồm** ở giữa.
- **Phối màu cả bộ:** bạc · trắng · xanh hoàng gia · vàng.
  - Hợp kỹ năng: Sư Tử Gầm (sư tử trên khiên / áo) và Khiên Thần (bản phóng to, toả sáng của chính chiếc khiên).

Lưu vào `art/rok/` với tên **`01-character-v3.png`** (giữ tranh cũ `01-character.png`).

### 01-character-v3.png (1024×1536, nền trong suốt)
Đính kèm `art/ignar/01-character.png`: **chỉ để lấy phong cách chibi của cả đội**.
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed armor and accessories, crisp clean line art, soft cel shading, vibrant colors. Use the attached image ONLY as a style reference — do NOT copy its character, outfit or colors. NEW CHARACTER: Rok, a brave young European knight. Neat platinum-blonde hair (white with a soft golden sheen), short with a side-swept fringe, bright blue eyes, determined friendly face. Polished silver plate armor with gold trim (pauldrons, breastplate, gauntlets, greaves, armored boots), a white tabard over the armor with a golden rampant lion emblem on the chest, a royal-blue cape with gold edging, a brown leather sword belt. In one hand a steel longsword with a golden cross-guard; on the other arm a heater shield (flat top, pointed bottom) — white field, royal-blue and gold border, a golden rampant lion in the center. Three-quarter side view facing RIGHT, full body, standing straight in a calm ready pose: shield held at his side, sword pointing down, both legs visible. Transparent background, no ground shadow, no text.
```

### 01b-portrait-v3.png (1024×1536, nền trong suốt) — ảnh màn chọn đội (tuỳ chọn)
Đính kèm `01-character-v3.png` vừa tạo.
```
Chibi 2D game character art, the SAME character as the attached image (Rok, young European knight with platinum-blonde hair, silver plate armor, white tabard with a golden lion, royal-blue cape, longsword and white heater shield with a golden lion). Heroic pose: raising the longsword high to the sky, shield braced in front, cape flowing in the wind, golden light glinting on the armor. Full body, transparent background, no text.
```

**Mô tả dán vào chỗ `<...>` của đoạn prompt chung sprite** (dùng cho mọi tấm dưới):
```
Rok, a chibi young European knight with neat platinum-blonde hair and blue eyes, polished silver plate armor with gold trim, a white tabard with a golden lion emblem, a royal-blue cape, a steel longsword with a golden cross-guard and a white heater shield with a golden rampant lion
```

## 1. Bảng động tác (8 tấm)

Mọi tấm 1536×1024, nền xanh #00FF00, lưới 4×2. **Khung chính** = khung trùng mốc gây sát thương của server.

| # | File | Động tác (dùng khi) | Khung | Khung chính | Ưu tiên |
|---|---|---|---|---|---|
| 1 | `sprite-idle.png` | hàng trên: đứng thường · hàng dưới: thủ thế trong trận | 4 + 4 | — | ★★★ làm ĐẦU TIÊN |
| 2 | `sprite-attack.png` | đánh thường: bổ kiếm từ trên xuống | 8 | **khung 4** @0,24s | ★★★ |
| 3 | `sprite-move.png` | chạy (nặng nề, khiên trước người) | 8 lặp | — | ★★★ |
| 4 | `sprite-hurt-stun.png` | trúng đòn · choáng | 4 + 4 | — | ★★★ |
| 5 | `sprite-taunt.png` | **Sư Tử Gầm** (KN1): giơ kiếm gầm vang, đập kiếm vào khiên | 8 | **khung 4** @0,42s | ★★ |
| 6 | `sprite-bash.png` | **Đẩy Khiên** (KN2): lao tới húc khiên | 8 | **khung 3** @0,22s | ★★ |
| 7 | `sprite-guard-land.png` | hàng trên: **Dựng Khiên** (KN3) giơ khiên gọi Khiên Thần → cắm thế thủ, giữ · hàng dưới: rơi vào trận → đáp đất | 4 + 4 | **khung 2** @0,14s (Khiên Thần hiện ra) · khung 3–4 rung khi giữ | ★★ |
| 8 | `sprite-dead-victory.png` | gục · thắng | 4 + 4 | gục: giữ khung 4 · thắng: giữ khung 7–8 | ★ |

**Game tự vẽ** (tranh ở `art/rok/fx2/`): Khiên Thần, linh hồn sư tử + sóng gầm, loé trúng đòn, sao choáng, bụi. Ở đây chỉ vẽ Rok.

## 2. Cách tạo
1. **Tấm 1 (`sprite-idle`):** đính kèm `art/rok/01-character-v3.png` + `art/ignar/sprite/sprite-idle.png` (chỉ lấy cỡ / nét).
2. **Tấm 2–8:** đính kèm `art/rok/01-character-v3.png` + `sprite-idle.png` **của Rok** vừa tạo.
3. Dán **đoạn chung sprite** (mục 5 của hướng dẫn) với mô tả ở mục 0, rồi dán **đoạn riêng** dưới đây.

## 3. Đoạn riêng từng tấm

### 1 · sprite-idle.png
```
TOP ROW, frames 1-4 = RELAXED STANDING (out of combat): standing calmly and upright, shield resting at his side, sword held low pointing at the ground, four almost identical frames with only a tiny breathing difference (chest and shoulders rise slightly), the cape hangs down.
BOTTOM ROW, frames 5-8 = COMBAT READY STANCE: knees slightly bent, the heater shield held up in front of his chest, the longsword raised diagonally forward beside the shield, determined eyes, four almost identical frames with only a tiny breathing difference.
```

### 2 · sprite-attack.png — khung 4 = chém trúng
```
ANIMATION: OVERHEAD LONGSWORD CHOP, 8 frames. Frame 1: combat ready stance, shield in front of the chest. Frame 2: anticipation — the sword swings up and back over his head, body leaning back, the shield tucked close to the chest. Frame 3: the sword at the highest point behind his head, fierce face. Frame 4: KEY FRAME — a powerful downward chop: the sword slams down in front of him at waist height, one step forward, body leaning forward, cape flying back. Frame 5: follow-through, the blade low near the ground. Frame 6: holding the low blade. Frame 7: pulling the sword back up. Frame 8: back to the combat ready stance.
```

### 3 · sprite-move.png — chạy lặp
```
ANIMATION: RUN CYCLE of an armored knight, 8 frames, seamless loop (frame 8 flows back into frame 1). Short heavy steps, body leaning slightly forward, the heater shield kept in front of his body, the longsword held low at his side. Frame 1: near leg forward, heel down. Frame 2: down position, knees bent. Frame 3: passing position. Frame 4: up position, pushing off. Frame 5: far leg forward, heel down. Frame 6: down position. Frame 7: passing position. Frame 8: up position. The cape bounces and trails behind, the platinum hair bounces.
```

### 4 · sprite-hurt-stun.png — trúng đòn + choáng
```
TOP ROW = ANIMATION 1, HURT, 4 frames: Frame 1: combat ready stance. Frame 2: just got hit — flinches backward behind his shield, head snapped back, eyes squeezed shut, gritted teeth. Frame 3: stumbles half a step back, cape swinging forward. Frame 4: recovering, almost back to the ready stance, frowning.
BOTTOM ROW = ANIMATION 2, STUNNED (seamless loop), 4 frames: dazed swirly eyes, mouth slightly open, shield and sword hanging low, knees wobbly. Frame 5: swaying to the left. Frame 6: back to center. Frame 7: swaying to the right. Frame 8: back to center. No stars or symbols.
```

### 5 · sprite-taunt.png — Sư Tử Gầm, khung 4 = tiếng gầm
```
ANIMATION: LION WAR ROAR, 8 frames. Frame 1: combat ready stance. Frame 2: starts raising the longsword, chest puffing out. Frame 3: the sword raised high above his head, leaning back, taking a deep breath. Frame 4: KEY FRAME — a mighty ROAR like a lion: mouth wide open shouting at the enemies, sword raised high, body leaning forward, cape blown backward. Frame 5: still roaring, slightly less intense. Frame 6: brings the sword down and BANGS it against his shield. Frame 7: bangs the shield again, fierce grin. Frame 8: back to the combat ready stance.
```

### 6 · sprite-bash.png — Đẩy Khiên, khung 3 = húc khiên
```
ANIMATION: SHIELD BASH, 8 frames. Frame 1: combat ready stance. Frame 2: anticipation — crouches low, pulls the heater shield back against his shoulder, sword arm back. Frame 3: KEY FRAME — explosive lunge forward, the shield thrust straight out in front at full arm length, body leaning hard into it, back leg stretched, cape flying back. Frame 4: holding the extended shield. Frame 5: follow-through, still leaning forward. Frame 6: shifting the weight back. Frame 7: rising up. Frame 8: back to the combat ready stance.
```

### 7 · sprite-guard-land.png — Dựng Khiên (hàng trên) + rơi vào trận (hàng dưới)
```
TOP ROW = ANIMATION 1, SUMMON THE DIVINE SHIELD, 4 frames: Frame 1: raises his heater shield high above his head toward the sky with the arm stretched up, sword pulled back, eyes looking up, solemn face. Frame 2: KEY FRAME — slams the shield down in front of him in a wide low stance, the shield planted firmly before his body, sword hidden behind it, determined face (the giant divine shield appears here — NOT drawn, the game adds it). Frame 3: holding the low guard stance behind the shield. Frame 4: almost identical to frame 3 with a tiny shift (used for a steady hold loop).
BOTTOM ROW = ANIMATION 2, ENTRANCE LANDING, 4 frames: Frame 5: falling from the sky, body upright, knees bent, shield and sword out to the sides for balance, cape blown upward. Frame 6: touchdown in a deep crouch on one knee, the shield touching the ground. Frame 7: rising from the crouch. Frame 8: confident combat ready stance.
```

### 8 · sprite-dead-victory.png — gục (hàng trên) + thắng (hàng dưới)
```
TOP ROW = ANIMATION 1, DEFEAT, 4 frames: Frame 1: hit hard, staggering backward, eyes squeezed shut. Frame 2: knees buckling, falling backward, the shield slipping. Frame 3: falling, almost on the ground. Frame 4: lying flat on his back on the ground, eyes closed, sword and shield beside him (final frame, held).
BOTTOM ROW = ANIMATION 2, VICTORY, 4 frames: Frame 5: a happy little jump, big smile. Frame 6: raises the longsword straight up to the sky, shield at his side, big grin. Frame 7: proud victory pose, sword raised high, eyes closed with a happy smile, cape flowing. Frame 8: almost identical to frame 7 with a tiny change (breathing loop).
```

## 4. Mình làm khi nhận tấm
- **Ráp:** tách nền, căn chân, chỉnh cỡ. Đánh dấu điểm gắn ở khung chính:
  - mũi kiếm: chỗ loé trúng;
  - tâm khiên: chỗ Khiên Thần hiện ra, linh hồn sư tử bay ra.
- **Gửi duyệt:** video từng động tác (`tools/test-sprite.html?char=warrior`). Khung nào hỏng mình báo số khung để tạo lại.
- **Bản khung xương cũ:** vẫn xem được bằng `?rok=cutout`.
- **"Thành Trì"** (cắm khiên quỳ): hiện không có kỹ năng nào dùng; nếu sau này dùng, lấy khung của Dựng Khiên.
