# Jessica (Lôi Ám) — TẠO HÌNH MỚI (nữ ninja sấm tím) + bộ tấm SPRITE

Luật chung, đoạn prompt chung, câu sửa khi AI vẽ sai: `art/HUONG_DAN_VE_NHAN_VAT.md`. Hiệu ứng riêng của Jessica: `art/jessica/fx2/PROMPTS_FX.md`. Hiệu ứng dùng chung cả đội (khói, vệt chém, bụi, sao choáng...): `art/common/PROMPTS_FX_CHUNG.md`.

Tranh Jessica cũ (`art/assassin2/`) giữ nguyên, không dùng nữa khi bản mới vào game.

## 0. Tạo hình mới (làm TRƯỚC mọi tấm khác)

**Jessica bản 3 — nữ ninja trẻ, sát thủ sấm tím** (người, không tai thú):
- **Tóc:** đen bóng ánh tím, dài, buộc **đuôi ngựa cao** bằng ruy băng tím có treo 2 lá bùa nhỏ. Mái lệch. **Mắt tím sắc.**
- **Trang phục:** bộ ninja đen ôm người, phối **tím đậm**, viền **vàng hình tia sét**.
  - Khăn quàng cổ tím đậm, **2 đuôi khăn dài** bay theo chuyển động (đẹp khi chạy / lộn / lướt).
  - Bảo vệ tay màu đen, găng hở ngón. Chân quấn băng, giày ninja tối màu.
  - Thắt lưng có **xấp bùa giấy trắng chữ tím** (Phóng Bùa).
- **Vũ khí:** 1 **dao găm ngắn lưỡi hơi cong**, lưỡi ánh tím, **cầm ngược** (lưỡi hướng xuống dọc cẳng tay) ở tay gần.
- **Phối màu cả bộ:** đen · tím đậm · tím oải hương · vàng sấm.
  - Hợp kỹ năng: tàng hình hào quang sấm tím, đòn chém sấm tím đen, bùa gắn Ấn tím.

Lưu vào `art/jessica/` với tên **`01-character-v3.png`**.

### 01-character-v3.png (1024×1536, nền trong suốt)
Đính kèm `art/rok/01-character-v3.png`: **chỉ để lấy phong cách chibi của cả đội**.
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed clothing and accessories, crisp clean line art, soft cel shading, vibrant colors. Use the attached image ONLY as a style reference — do NOT copy its character, outfit or colors. NEW CHARACTER: Jessica, a young female ninja assassin (human, no animal ears). Long glossy black hair with violet highlights tied in a high ponytail with a purple ribbon holding two small paper talismans, a side-swept fringe, sharp violet eyes, confident sly smile. A fitted black ninja outfit with deep-violet panels and gold lightning-bolt trim, a dark purple scarf around the neck with two long trailing tails, black arm guards and fingerless gloves, wrapped legs and dark ninja boots, a belt with a bundle of white paper talismans with purple glyphs. In her near hand a short slightly curved dagger with a violet-tinted blade, held in a REVERSE GRIP (blade pointing down along the forearm). Three-quarter side view facing RIGHT, full body, standing in a calm alert pose, both legs visible. Transparent background, no ground shadow, no text.
```

### 01b-portrait-v3.png (1024×1536, nền trong suốt) — ảnh màn chọn đội (tuỳ chọn)
Đính kèm `01-character-v3.png` vừa tạo.
```
Chibi 2D game character art, the SAME character as the attached image (Jessica, young female ninja with a black-violet high ponytail, violet eyes, black and deep-violet ninja outfit with gold lightning trim, dark purple scarf, reverse-grip violet dagger, paper talismans). Dynamic pose: crouching low on one knee, dagger held ready in reverse grip, the other hand holding a paper talisman between two fingers in front of her face, scarf tails and ponytail flowing in the wind. Full body, transparent background, no text.
```

**Mô tả dán vào chỗ `<...>` của đoạn prompt chung sprite** (dùng cho mọi tấm dưới):
```
Jessica, a chibi young female ninja with a long black-violet high ponytail, violet eyes, a fitted black and deep-violet ninja outfit with gold lightning-bolt trim, a dark purple scarf with long trailing tails, and a short violet dagger held in a reverse grip
```

## 1. Bảng động tác (9 tấm)

Mọi tấm 1536×1024, nền xanh #00FF00 (hoặc trong suốt), lưới 4×2. **Khung chính** = khung trùng mốc gây sát thương của server.

| # | File | Động tác (dùng khi) | Khung | Khung chính | Ưu tiên |
|---|---|---|---|---|---|
| 1 | `sprite-idle.png` | hàng trên: đứng thường · hàng dưới: thủ thế trong trận | 4 + 4 | — | ★★★ làm ĐẦU TIÊN |
| 2 | `sprite-attack.png` | đánh thường: chém dao ngang | 8 | **khung 4** @0,18s | ★★★ |
| 3 | `sprite-move.png` | chạy kiểu ninja (người đổ tới, tay quạt ra sau) | 8 lặp | — | ★★★ |
| 4 | `sprite-hurt-stun.png` | trúng đòn · choáng | 4 + 4 | — | ★★★ |
| 5 | `sprite-throw.png` | **Phóng Bùa** (KN1): lộn mèo ra sau, quăng bùa giữa không trung | 8 | **khung 6** @0,42s | ★★★ |
| 6 | `sprite-throwstand-vanish.png` | hàng trên: phóng bùa đứng tại chỗ · hàng dưới: **Đột Kích** (KN2) thụp người kết ấn → biến mất | 4 + 4 | phóng đứng: **khung 3** @0,2s | ★★ |
| 7 | `sprite-dash.png` | hàng trên: lướt chém (Đột Kích, lặp khi lướt giữa các quái) · hàng dưới: hiện ra chém hất lên | 4 + 4 | hiện ra: **khung 7** @0,18s | ★★ |
| 8 | `sprite-stealth-land.png` | hàng trên: **Tàng Hình** (KN3) kết ấn · hàng dưới: rơi vào trận → đáp đất | 4 + 4 | tàng hình: **khung 3** @0,38s · khung 3–4 giữ khi niệm | ★★ |
| 9 | `sprite-dead-victory.png` | gục · thắng | 4 + 4 | gục: giữ khung 4 · thắng: giữ khung 7–8 | ★ |

**Game tự vẽ** (tranh ở `art/jessica/fx2/` + `art/common/`): lá bùa đang bay, dấu Ấn, vệt chém sấm, khói biến mất / hiện ra, hào quang tàng hình, sét buff né của đồng đội, loé trúng, bụi, sao choáng. Ở đây chỉ vẽ Jessica.

**Lá bùa trên tay:** vẽ lá bùa kẹp giữa 2 ngón ở khung **lấy đà**; khung **ném** vẽ tay đã buông (lá bùa đang bay do game vẽ).

## 2. Cách tạo
1. **Tấm 1 (`sprite-idle`):** đính kèm `art/jessica/01-character-v3.png` + `art/rok/sprite/sprite-idle.png` (chỉ lấy cỡ / nét).
2. **Tấm 2–9:** đính kèm `art/jessica/01-character-v3.png` + `sprite-idle.png` **của Jessica** vừa tạo.
3. Dán **đoạn chung sprite** (mục 5 của hướng dẫn) với mô tả ở mục 0, rồi dán **đoạn riêng** dưới đây.

## 3. Đoạn riêng từng tấm

### 1 · sprite-idle.png
```
TOP ROW, frames 1-4 = RELAXED STANDING (out of combat): standing upright and relaxed, the dagger lowered in a reverse grip at her side, the other hand resting on her hip, calm sly smile, four almost identical frames with only a tiny breathing difference (chest and shoulders rise slightly), scarf tails hanging down.
BOTTOM ROW, frames 5-8 = COMBAT READY STANCE: a low ninja crouch, knees bent, weight forward, the reverse-grip dagger held up in front of her chest, the other hand open behind her for balance, sharp focused eyes, four almost identical frames with only a tiny breathing difference.
```

### 2 · sprite-attack.png — khung 4 = chém trúng
```
ANIMATION: QUICK REVERSE-GRIP DAGGER SLASH, 8 frames. Frame 1: combat ready stance. Frame 2: a quick step forward, the dagger arm pulled back across her body to the opposite shoulder. Frame 3: lunging forward, body twisting, the slash starting. Frame 4: KEY FRAME — a fast horizontal slash at chest height, the dagger arm swept fully forward and outward, body leaning into it, front leg extended, scarf and ponytail flying back. Frame 5: follow-through, the arm continuing past, body turned. Frame 6: recovering, pulling the dagger back. Frame 7: a small hop back to her spot. Frame 8: back to the combat ready stance.
```

### 3 · sprite-move.png — chạy lặp
```
ANIMATION: NINJA RUN CYCLE, 8 frames, seamless loop (frame 8 flows back into frame 1). Fast light steps, the upper body leaning far forward, both arms trailing straight back behind her (the dagger in reverse grip in the near hand), the scarf tails and ponytail streaming straight back. Frame 1: near leg forward, heel down. Frame 2: down position, knees bent. Frame 3: passing position. Frame 4: up position, pushing off. Frame 5: far leg forward, heel down. Frame 6: down position. Frame 7: passing position. Frame 8: up position.
```

### 4 · sprite-hurt-stun.png — trúng đòn + choáng
```
TOP ROW = ANIMATION 1, HURT, 4 frames: Frame 1: combat ready stance. Frame 2: just got hit — flinches backward, head snapped back, eyes squeezed shut, gritted teeth, arms raised to protect herself. Frame 3: skids half a step back, scarf swinging forward. Frame 4: recovering, almost back to the ready stance, annoyed frown.
BOTTOM ROW = ANIMATION 2, STUNNED (seamless loop), 4 frames: dazed swirly eyes, mouth slightly open, the dagger hanging loosely, knees wobbly. Frame 5: swaying to the left. Frame 6: back to center. Frame 7: swaying to the right. Frame 8: back to center. No stars or symbols.
```

### 5 · sprite-throw.png — Phóng Bùa, khung 6 = quăng bùa
```
ANIMATION: BACKFLIP TALISMAN THROW, 8 frames. Frame 1: combat ready stance. Frame 2: crouches to jump, pulling a white paper talisman with purple glyphs from her belt, holding it between two fingers. Frame 3: leaping backward into the air, body tucking into a backward somersault, knees to the chest. Frame 4: upside down in the middle of the backflip, tightly tucked, the talisman still held between two fingers. Frame 5: coming out of the flip high in the air, body upright, the throwing arm cocked back behind her head holding the talisman. Frame 6: KEY FRAME — still in the air, the throwing arm whipped fully forward toward the right, hand open, fingers pointing at the enemy (the talisman has just left her hand — do NOT draw it, the game adds the flying talisman), scarf flying. Frame 7: landing on her toes in a low crouch, one hand touching the ground. Frame 8: rising back to the combat ready stance.
```

### 6 · sprite-throwstand-vanish.png — phóng bùa đứng (hàng trên) + thụp người biến mất (hàng dưới)
```
TOP ROW = ANIMATION 1, STANDING TALISMAN THROW, 4 frames: Frame 1: pulls a white paper talisman with purple glyphs and holds it between two fingers in front of her face, eyes narrowed. Frame 2: wind-up, the throwing arm pulled back, body turned. Frame 3: KEY FRAME — a quick flick throw forward toward the right, arm extended, hand open (the talisman has left her hand — do NOT draw it). Frame 4: follow-through, back toward the combat ready stance.
BOTTOM ROW = ANIMATION 2, VANISH (crouch into the shadows), 4 frames: Frame 5: drops into a sudden crouch, the free hand forming a ninja hand seal (index and middle finger raised) in front of her chest. Frame 6: crouching deeper, almost kneeling, eyes narrowed, scarf settling down. Frame 7: very low coiled crouch, one hand touching the ground, ready to vanish (the game adds the smoke). Frame 8: almost identical to frame 7 (held).
```

### 7 · sprite-dash.png — lướt chém (hàng trên) + hiện ra chém (hàng dưới)
```
TOP ROW = ANIMATION 1, DASH STRIKE (seamless loop while dashing between enemies), 4 frames: a lightning-fast low dash toward the right, body almost horizontal and close to the ground, the reverse-grip dagger thrust forward along the forearm, the other arm stretched back, the scarf tails and ponytail streaming straight back; the 4 frames are small variations of the same pose (legs and scarf shift slightly) for a smooth loop. No speed lines, no afterimages.
BOTTOM ROW = ANIMATION 2, APPEAR WITH A RISING SLASH, 4 frames: Frame 5: emerging from a very low crouch behind the enemy, dagger held low. Frame 6: springing up, the dagger arm cocked low behind her. Frame 7: KEY FRAME — a powerful rising diagonal slash upward and forward, the dagger arm swept high, body stretched upward on her toes, scarf flying up. Frame 8: landing back into the combat ready stance.
```

### 8 · sprite-stealth-land.png — Tàng Hình (hàng trên) + rơi vào trận (hàng dưới)
```
TOP ROW = ANIMATION 1, STEALTH HAND SEAL, 4 frames: Frame 1: combat ready stance. Frame 2: brings both hands together in front of her chest forming a ninja hand seal (index and middle fingers of both hands raised and pressed together), eyes closing, focused. Frame 3: KEY FRAME — eyes snap open sharp and fierce, the hand seal held firmly, her ponytail, scarf tails and hair lifted upward as if by a sudden gust of wind (the game adds the purple lightning smoke). Frame 4: almost identical to frame 3 with a tiny shift (used for a steady hold loop).
BOTTOM ROW = ANIMATION 2, ENTRANCE LANDING, 4 frames: Frame 5: falling from the sky, body upright, knees bent, arms out for balance, scarf and ponytail blown upward. Frame 6: touchdown in a very low ninja crouch, one hand and one knee on the ground. Frame 7: rising from the crouch. Frame 8: confident combat ready stance.
```

### 9 · sprite-dead-victory.png — gục (hàng trên) + thắng (hàng dưới)
```
TOP ROW = ANIMATION 1, DEFEAT, 4 frames: Frame 1: hit hard, staggering backward, eyes squeezed shut. Frame 2: knees buckling, falling backward, the dagger slipping from her hand. Frame 3: falling, almost on the ground. Frame 4: lying flat on her back on the ground, eyes closed, the dagger beside her (final frame, held).
BOTTOM ROW = ANIMATION 2, VICTORY, 4 frames: Frame 5: a light happy hop, big smile. Frame 6: spins the dagger in her fingers, playful grin. Frame 7: proud victory pose: one hand making a ninja hand seal near her face, a cheeky wink, the dagger held down in a reverse grip, scarf flowing. Frame 8: almost identical to frame 7 with a tiny change (breathing loop).
```

## 4. Mình làm khi nhận tấm
- **Ráp:** tách nền, căn chân, chỉnh cỡ (như Rok). Đánh dấu điểm gắn ở khung chính:
  - bàn tay ném: chỗ lá bùa bay ra (Phóng Bùa khung 6, phóng đứng khung 3);
  - mũi dao: chỗ loé vệt chém (đánh thường khung 4, hiện ra khung 7).
- **Lộn mèo:** tấm Phóng Bùa đã vẽ sẵn vòng lộn → tắt vòng xoay bằng code của bản khung xương (tránh xoay 2 lần); đường nhảy lùi 5 đơn vị giữ nguyên.
- **Tàng hình:** game làm Jessica mờ đi + phủ hào quang sấm tím (tranh `fx2`).
- **Gửi duyệt:** video từng động tác (`tools/test-sprite.html?char=assassin`). Khung nào hỏng mình báo số khung để tạo lại.
- **Bản khung xương cũ:** vẫn xem được bằng `?jessica=cutout`.
