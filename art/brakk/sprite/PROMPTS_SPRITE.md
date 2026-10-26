# Brakk (Cuồng Đấu) — TẠO HÌNH MỚI (đô vật tộc Rồng Đất – dung nham) + bộ tấm SPRITE

Tài liệu liên quan:
- Luật chung, đoạn prompt chung, câu sửa khi AI vẽ sai: `art/HUONG_DAN_VE_NHAN_VAT.md`.
- Hiệu ứng riêng của Brakk: `art/brakk/fx2/PROMPTS_FX.md`.
- Hiệu ứng dùng chung cả đội (bụi, khói, sao choáng...): `art/common/PROMPTS_FX_CHUNG.md`.

Tranh Brakk cũ (`art/brakk/01-character.png`, tấm bộ phận, dạng khổng lồ `04-...`, `fx-a/b/c.png`) giữ nguyên, không dùng nữa khi bản mới vào game.

## 0. Tạo hình mới (làm TRƯỚC mọi tấm khác)

**Brakk bản 3 — đô vật trẻ tộc Rồng Đất, nhà vô địch đấu trường dung nham** (chủ đề **đất đá · dung nham · rồng**):
- **Tóc:** bờm dựng ngược rất rậm màu **nâu cát**, ngọn tóc **cam dung nham** sáng nhẹ. **Mắt hổ phách** đồng tử dọc. Cười tự tin lộ răng nanh nhỏ, sẹo chéo trên má.
- **Tộc Rồng Đất:**
  - 2 **sừng rồng dày màu đá xám đậm**, vân nứt cam dung nham.
  - **Vảy rồng nâu đồng như đá phiến** trên vai, bắp tay, lưng; khe vảy có vệt cam dung nham mảnh.
  - **Đuôi rồng** to khoẻ nâu đồng, hàng gai đá dọc sống đuôi, chóp đuôi cam dung nham.
- **Thân hình + đồ đô vật:**
  - Cởi trần, cơ bắp (tỉ lệ chibi), da rám nắng.
  - **Đai vô địch** to bản bằng đồng, mặt đai là **đầu rồng đá ngậm ngọc hổ phách**.
  - Quần đùi đấu vật **đen viền đồng**; **băng quấn tay trắng** + bao cổ tay đồng; giày đấu vật cao cổ nâu – đồng có dây buộc.
- **Vũ khí:** tay không, nắm đấm to.
- **Phối màu cả bộ:** nâu cát · đồng · đen than · xám đá · cam dung nham (hổ phách).
  - Bỏ hẳn đỏ: khỏi trùng tông với Ignar (lửa đỏ) và Zerith (đỏ thẫm).
  - Hợp kỹ năng: Chấn Địa (gai đá trồi, sóng chấn đất), Bá Vương Quật (hố nứt dung nham), Thần Lực Khổng Lồ (da nứt đá + dung nham), Long Huyết (máu rồng dung nham).

**Dạng Khổng Lồ** (Thần Lực Khổng Lồ, 10s) — cùng nhân vật nhưng vạm vỡ hẳn:
- Vai, ngực rộng; tay to; **nắm đấm khổng lồ**.
- Vảy đá lan khắp da, nứt toác với **vân dung nham cam sáng rực**.
- **Mắt trắng rực**, không con ngươi; bờm bốc ngược như dung nham chảy lên; hơi nóng phì ra từ mũi.
- Đai, quần, băng tay, giày giữ nguyên (hơi nứt).

Lưu vào `art/brakk/` với tên **`01-character-v3.png`**, **`01c-giant-v3.png`** (dạng khổng lồ) và (tuỳ chọn) **`01b-portrait-v3.png`**.

### 01-character-v3.png (1024×1536, nền trong suốt)
Đính kèm `art/rok/01-character-v3.png`: **chỉ để lấy phong cách chibi của cả đội**.
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed clothing and accessories, crisp clean line art, soft cel shading, vibrant colors. Use the attached image ONLY as a style reference — do NOT copy its character, outfit or colors. NEW CHARACTER: Brakk, a young earth-dragon tribe pro wrestler, the champion of the lava arena. A wild spiky mane of sandy-brown hair with glowing lava-orange tips, two thick stone-grey dragon horns with glowing orange cracks, amber eyes with slit pupils, a cocky grin with small fangs, a scar across one cheek. Bare-chested with a muscular chibi build and tanned skin; bronze-brown rocky dragon scales like slate covering his shoulders, upper arms and back, with thin glowing lava-orange lines between the scales; a thick bronze-brown dragon tail with a row of rocky spikes along its spine and a glowing lava-orange tip. A huge bronze championship belt whose buckle is a stone dragon head holding an amber gem, black wrestling trunks with bronze trim, white hand wraps with bronze wrist bracers, tall brown-and-bronze laced wrestling boots. Bare-handed, big clenched fists. Color palette: sandy brown, bronze, charcoal black, stone grey and lava orange — no red. Three-quarter side view facing RIGHT, full body, standing in a proud powerful pose with his fists on his hips, both legs visible. Transparent background, no ground shadow, no text.
```

### 01c-giant-v3.png (1024×1536, nền trong suốt) — dạng Khổng Lồ (dùng cho 2 tấm khổng lồ)
Đính kèm `01-character-v3.png` vừa tạo.
```
Chibi 2D game character art, the SAME character as the attached image (Brakk, the young earth-dragon wrestler), now in his GIANT FORM: the same face, horns, belt, trunks, hand wraps and boots, but much bulkier and more powerful — broad shoulders and chest, thick arms, huge fists — the bronze rocky scales spread over most of his skin and cracked open with bright glowing lava-orange veins, glowing white eyes without pupils, his mane blazing upward like molten lava, hot steam puffing from his nose, the boots and belt slightly cracked. Keep the same chibi proportions and drawing style. Three-quarter side view facing RIGHT, full body, a massive hunched fighting stance with his huge fists raised, both legs visible. Transparent background, no ground shadow, no glow or particles around him, no text.
```

### 01b-portrait-v3.png (1024×1536, nền trong suốt) — ảnh màn chọn đội (tuỳ chọn)
Đính kèm `01-character-v3.png`.
```
Chibi 2D game character art, the SAME character as the attached image (Brakk, young earth-dragon wrestler with a sandy-brown mane with lava-orange tips, stone-grey horns, bronze rocky dragon scales, a bronze dragon tail, a huge bronze championship belt, black trunks, white hand wraps, brown wrestling boots). Dynamic pose: a double-biceps flex with a huge confident grin, one foot forward, the tail swishing behind him. Full body, transparent background, no text.
```

**Mô tả dán vào chỗ `<...>` của đoạn prompt chung sprite** (tấm 1–8, dạng thường):
```
Brakk, a chibi young earth-dragon wrestler with a wild sandy-brown mane with glowing lava-orange tips, thick stone-grey horns with orange cracks, amber eyes, a bare muscular chest, bronze rocky dragon scales on his shoulders, arms and back, a thick bronze dragon tail with rocky spikes, a huge bronze championship belt with a stone dragon head, black wrestling trunks, white hand wraps with bronze bracers and tall brown wrestling boots
```

**Mô tả dạng Khổng Lồ** (tấm 9–10, thay cho đoạn trên):
```
Brakk in his GIANT FORM, a chibi earth-dragon wrestler made much bulkier (broad shoulders and chest, thick arms, huge fists), bronze rocky scales covering most of his skin cracked with bright glowing lava-orange veins, glowing white eyes without pupils, his mane blazing upward like molten lava, the same stone-grey horns, bronze dragon tail, bronze championship belt, black trunks, white hand wraps and brown boots
```

**Đoạn luật tay không** (dán ngay SAU đoạn chung sprite, ở MỌI tấm):
```
FIST RULES: he is always bare-handed (white hand wraps, bronze bracers) — never draw any weapon, rope, chair or held object, and never draw the opponent he grabs: when he grabs or lifts someone, his hands grip EMPTY AIR exactly where the opponent would be (the game draws the opponent). The same horns, tail, belt and boots in every frame. Do not draw dust, rocks, cracks, lava splashes, sparks, glow or motion lines around him (the game adds all effects).
```

## 1. Bảng động tác (10 tấm: 8 dạng thường + 2 dạng Khổng Lồ)

Mọi tấm 1536×1024, nền xanh #00FF00 (hoặc trong suốt), lưới 4×2. **Khung chính** = khung trùng mốc gây sát thương của server.

| # | File | Động tác (dùng khi) | Khung | Khung chính | Ưu tiên |
|---|---|---|---|---|---|
| 1 | `sprite-idle.png` | hàng trên: đứng thường · hàng dưới: thủ thế trong trận | 4 + 4 | — | ★★★ làm ĐẦU TIÊN |
| 2 | `sprite-attack.png` | đánh thường: đấm thẳng | 8 | **khung 4** @0,2s | ★★★ |
| 3 | `sprite-move.png` | chạy | 8 lặp | — | ★★★ |
| 4 | `sprite-hurt-stun.png` | trúng đòn · choáng | 4 + 4 | — | ★★★ |
| 5 | `sprite-grab.png` | **Bá Vương Quật** (KN1): vồ túm → nhấc qua đầu → nhảy vọt → quật | 8 | **khung 7** @0,85s | ★★★ |
| 6 | `sprite-charge-stomp.png` | hàng trên: gồng niệm (KN2 1s, KN3 0,5s) · hàng dưới: **Chấn Địa** (KN2) bật cao → dậm | 4 + 4 | gồng: khung 3–4 giữ · dậm: **khung 7** @0,6s | ★★★ |
| 7 | `sprite-roar-taunt.png` | hàng trên: gầm hoá Khổng Lồ (KN3, cả Độc Long) · hàng dưới: **Tiếng Hét Bảo Hộ** (thiên phú: đấm ngực khiêu khích) | 4 + 4 | gầm: **khung 3** @0,3s · khiêu khích: **khung 7** @0,3s | ★★ |
| 8 | `sprite-dead-victory.png` | gục · thắng | 4 + 4 | gục: giữ khung 4 · thắng: giữ khung 7–8 | ★ |
| 9 | `sprite-giant-ready-move.png` | **KHỔNG LỒ:** hàng trên: thủ thế (thay đứng / thủ thế) · hàng dưới: chạy | 4 + 4 lặp | — | ★★★ |
| 10 | `sprite-giant-attack.png` | **KHỔNG LỒ:** hàng trên: đấm · hàng dưới: móc ngược hất tung | 4 + 4 | đấm: **khung 3** @0,2s · móc ngược: **khung 7** @0,2s | ★★★ |

**Lúc Khổng Lồ:** trúng đòn, choáng, túm quật, dậm đất, gầm dùng tranh dạng thường; game phóng to và phủ ánh dung nham.

**Rơi vào trận:** dùng lại khung nhảy (tấm 5, khung 6) lúc rơi + khung gồng 1 (ngồi thụp, 1 nắm tay chống đất) lúc đáp. Không cần tấm riêng.

**Game tự vẽ** (tranh ở `art/brakk/fx2/` + `art/common/`): tia lửa đá khi đấm, vệt móc ngược, hố nứt dung nham, gai đá, sóng chấn đất, rồng đất hoá khổng lồ, hào quang khổng lồ, khiên vảy rồng, tiếng hét, cột máu rồng, bụi, sao choáng. Ở đây chỉ vẽ Brakk.

**Khung trên không** (nhảy vọt, bật cao): vẽ trong ô như các khung khác. Game tự nhấc Brakk lên cao.

## 2. Cách tạo
1. **Tấm 1 (`sprite-idle`):** đính kèm `art/brakk/01-character-v3.png` + `art/rok/sprite/sprite-idle.png` (chỉ lấy cỡ / nét).
2. **Tấm 2–8:** đính kèm `art/brakk/01-character-v3.png` + `sprite-idle.png` **của Brakk** vừa tạo. Dặn thêm: `Draw him at exactly the same size as in the attached sprite-idle sheet.`
3. **Tấm 9–10 (Khổng Lồ):** đính kèm `art/brakk/01c-giant-v3.png` + `sprite-idle.png` của Brakk. Dùng **mô tả dạng Khổng Lồ** ở chỗ `<...>`. Dặn thêm: `Draw him in his giant form, filling the cell height like the attached sprite-idle sheet (the game enlarges the giant form), but much bulkier.`
4. Dán **đoạn chung sprite** (mục 5 của hướng dẫn) với mô tả ở mục 0, rồi **đoạn luật tay không**, rồi **đoạn riêng** dưới đây.

## 3. Đoạn riêng từng tấm

### 1 · sprite-idle.png
```
TOP ROW, frames 1-4 = RELAXED STANDING (out of combat): standing tall with his chest puffed out, both fists on his hips, a confident grin, the tail curled on the ground behind him, four almost identical frames with only a tiny breathing difference (chest and shoulders rise slightly).
BOTTOM ROW, frames 5-8 = COMBAT READY STANCE: a low wide brawler stance, knees bent, upper body leaning slightly forward, both fists raised in front of his chest in a guard, eyes locked on the enemy, the tail raised behind him for balance, four almost identical frames with only a tiny breathing difference.
```

### 2 · sprite-attack.png — khung 4 = cú đấm trúng
```
ANIMATION: STRAIGHT PUNCH, 8 frames. Frame 1: combat ready stance. Frame 2: pulling the near fist back to his hip, twisting the torso, the far fist guarding his face. Frame 3: stepping forward with the front foot, the punch starting. Frame 4: KEY FRAME — a powerful straight punch: the near arm fully extended forward at enemy chest height, fist forward, body leaning into the punch, front foot planted, mane and tail flung back. Frame 5: follow-through, the arm still extended. Frame 6: pulling the arm back. Frame 7: both fists back up in guard. Frame 8: back to the combat ready stance.
```

### 3 · sprite-move.png — chạy lặp
```
ANIMATION: HEAVY RUN CYCLE, 8 frames, seamless loop (frame 8 flows back into frame 1). A powerful charging run, upper body leaning forward, fists pumping, heavy steps, the mane and tail bouncing behind him. Frame 1: near leg forward, heel down. Frame 2: down position, knees bent. Frame 3: passing position. Frame 4: up position, pushing off. Frame 5: far leg forward, heel down. Frame 6: down position. Frame 7: passing position. Frame 8: up position.
```

### 4 · sprite-hurt-stun.png — trúng đòn + choáng
```
TOP ROW = ANIMATION 1, HURT, 4 frames: Frame 1: combat ready stance. Frame 2: just got hit — flinches backward, head snapped back, one eye squeezed shut, gritted fangs, arms raised to guard. Frame 3: skids half a step back, the tail swinging forward. Frame 4: recovering, almost back to the ready stance, an angry frown.
BOTTOM ROW = ANIMATION 2, STUNNED (seamless loop), 4 frames: dazed swirly eyes, tongue slightly out, arms hanging loosely, knees wobbly, the tail drooping. Frame 5: swaying to the left. Frame 6: back to center. Frame 7: swaying to the right. Frame 8: back to center. No stars or symbols.
```

### 5 · sprite-grab.png — Bá Vương Quật, khung 7 = quật xuống đất
```
ANIMATION: KING SLAM (grab, lift, leap and slam), 8 frames. His hands grip EMPTY AIR where the opponent would be — do NOT draw the opponent. Frame 1: combat ready stance. Frame 2: lunging forward low, both arms reaching forward with open hands to grab an enemy at waist height. Frame 3: pulling back and lifting, both hands clenched around empty air at chest height, knees bent, straining. Frame 4: both arms raised straight up above his head, hands gripping empty air as if holding a heavy opponent overhead, knees bent, ready to jump. Frame 5: LEAPING high into the air, legs tucked, both arms still raised overhead. Frame 6: at the top of the jump, body arched back, arms overhead starting to swing forward. Frame 7: KEY FRAME — the SLAM: landed in a deep wide squat, both arms swung down hard in front of him with the hands near the ground, knees bent, mane and tail flung up. Frame 8: rising from the squat back toward the ready stance, fists clenched.
```

### 6 · sprite-charge-stomp.png — gồng (hàng trên) + Chấn Địa (hàng dưới)
```
TOP ROW = ANIMATION 1, POWER CHARGE (held while casting), 4 frames: Frame 1: dropping into a deep low squat, one fist touching the ground (this frame is also used when he lands on the battlefield). Frame 2: rising into a wide sumo stance, fists clenched at his hips. Frame 3: the wide sumo stance flexing every muscle, head lowered, gritted fangs, the mane lifted slightly upward. Frame 4: almost identical to frame 3 with a tiny tremble (used for a steady hold loop).
BOTTOM ROW = ANIMATION 2, EARTH STOMP, 4 frames: Frame 5: crouching low, arms swung down and back, ready to jump. Frame 6: high in the air, knees tucked up, both fists raised above his head. Frame 7: KEY FRAME — landing with a massive stomp: both feet slammed into the ground in a deep wide squat, both fists punched down toward the ground between his knees, mane and tail flung up. Frame 8: standing back up into the sumo stance.
```

### 7 · sprite-roar-taunt.png — gầm hoá Khổng Lồ (hàng trên) + Tiếng Hét Bảo Hộ (hàng dưới)
```
TOP ROW = ANIMATION 1, DRAGON ROAR (transforming into his giant form), 4 frames: Frame 1: hunching forward, fists clenched at his sides, muscles tensing. Frame 2: inhaling deeply, chest expanding, head lifting. Frame 3: KEY FRAME — a mighty roar: head thrown back, mouth wide open showing his fangs, both arms flexed out wide with clenched fists, chest out, mane and tail blasted upward. Frame 4: almost identical to frame 3, still roaring (held).
BOTTOM ROW = ANIMATION 2, PROTECTIVE WAR CRY (taunting all enemies), 4 frames: Frame 5: combat ready stance facing the enemies. Frame 6: pounding his chest with both fists. Frame 7: KEY FRAME — roaring at the enemies with one arm thrust forward and the hand beckoning "come at me", the other fist on his chest, eyes blazing, fangs bared. Frame 8: back toward the ready stance with a confident grin.
```

### 8 · sprite-dead-victory.png — gục (hàng trên) + thắng (hàng dưới)
```
TOP ROW = ANIMATION 1, DEFEAT, 4 frames: his face shows pain (eyes squeezed shut, gritted teeth, frowning) — not smiling. Frame 1: hit hard, staggering backward. Frame 2: knees buckling, falling backward. Frame 3: falling, almost on the ground. Frame 4: lying flat on his back on the ground, eyes closed, arms spread, the tail limp (final frame, held).
BOTTOM ROW = ANIMATION 2, VICTORY, 4 frames: Frame 5: raising one fist high. Frame 6: pounding his chest with a big laugh. Frame 7: champion pose: a double-biceps flex, a huge grin showing his fangs, the tail curled up proudly. Frame 8: almost identical to frame 7 with a tiny change (breathing loop).
```

### 9 · sprite-giant-ready-move.png — KHỔNG LỒ: thủ thế (hàng trên) + chạy (hàng dưới)
```
He is in his GIANT FORM in every frame (as in the attached giant image): much bulkier, bronze rocky scales cracked with glowing lava-orange veins on his skin, glowing white eyes, the mane blazing upward like molten lava. The glow stays on his body only — no glow, steam clouds or particles around him. Fill the cell height like the attached sprite-idle sheet.
TOP ROW = ANIMATION 1, GIANT COMBAT STANCE (seamless loop), 4 frames: a massive low stance, huge fists raised in front of his chest, shoulders hunched forward, a small puff of steam from his nose, four almost identical frames with only a tiny breathing difference.
BOTTOM ROW = ANIMATION 2, GIANT RUN (seamless loop), 4 frames: a heavy pounding run, body leaning forward, huge fists swinging. Frame 5: near leg forward, heel down. Frame 6: passing position. Frame 7: far leg forward, heel down. Frame 8: passing position.
```

### 10 · sprite-giant-attack.png — KHỔNG LỒ: đấm (hàng trên) + móc ngược (hàng dưới)
```
He is in his GIANT FORM in every frame (as in the attached giant image): much bulkier, bronze rocky scales cracked with glowing lava-orange veins on his skin, glowing white eyes, the mane blazing upward like molten lava. The glow stays on his body only — no glow, steam clouds or particles around him. Fill the cell height like the attached sprite-idle sheet.
TOP ROW = ANIMATION 1, GIANT PUNCH, 4 frames: Frame 1: winding the near fist back behind his shoulder. Frame 2: stepping in, the huge fist swinging forward. Frame 3: KEY FRAME — the giant straight punch fully extended forward at enemy chest height, body leaning in, front foot planted. Frame 4: pulling back into the giant combat stance.
BOTTOM ROW = ANIMATION 2, GIANT UPPERCUT (launching the enemy into the air), 4 frames: Frame 5: a deep crouch, the near fist low near the ground. Frame 6: rising, the fist sweeping upward. Frame 7: KEY FRAME — the uppercut: the fist thrust high above his head, body stretched upward onto his toes, the other arm pulled back. Frame 8: landing back into the giant combat stance.
```

## 4. Mình làm khi nhận tấm
- **Ráp:** tách nền, căn chân, chỉnh cỡ (như Lyra, Seraphine, Zerith). Đuôi rồng chạm đất không làm lệch chân (`solidFeet`).
- **Điểm gắn `fist`** (nắm đấm) ở khung chính: đấm khung 4, đấm khổng lồ khung 3, móc ngược khung 7 → tia lửa đá loé đúng nắm đấm. **Điểm `hands`** (giữa 2 bàn tay) ở khung túm / nhấc → quái bị túm nằm đúng giữa 2 tay.
- **Bá Vương Quật:** nhảy vọt + quật theo nhịp server như cũ (quật 0,85s); quái bị túm đi theo tay.
- **Chấn Địa:** gồng 1s (khung 3–4 rung) → bật cao → dậm đúng 0,6s.
- **Thần Lực Khổng Lồ:** gầm (khung 3 = 0,3s) → đổi sang tranh khổng lồ (thủ thế / chạy / đấm / móc ngược) suốt 10s. Động tác khác lúc khổng lồ dùng tranh thường phóng to + phủ ánh dung nham.
- **Tiếng Hét Bảo Hộ:** tranh khiêu khích riêng (hàng dưới tấm 7) thay cho động tác gầm cũ.
- **Gửi duyệt:** video từng động tác (`tools/test-sprite.html?char=wrestler`). Khung nào hỏng mình báo số khung để tạo lại.
- **Bản khung xương cũ:** vẫn xem được bằng `?brakk=cutout`.
