# Zerith (U Minh) — TẠO HÌNH MỚI (thiếu niên quỷ tộc dẫn hồn) + bộ tấm SPRITE

Tài liệu liên quan:
- Luật chung, đoạn prompt chung, câu sửa khi AI vẽ sai: `art/HUONG_DAN_VE_NHAN_VAT.md`.
- Hiệu ứng riêng của Zerith: `art/zerith/fx2/PROMPTS_FX.md`.
- Hiệu ứng dùng chung cả đội (bụi, khói, sao choáng...): `art/common/PROMPTS_FX_CHUNG.md`.

Tranh Zerith cũ (`art/zerith/01-character.png`, tấm bộ phận, `05-guardian.png`, `fx-a/b.png`) giữ nguyên, không dùng nữa khi bản mới vào game.

## 0. Tạo hình mới (làm TRƯỚC mọi tấm khác)

**Zerith bản 3 — thiếu niên quỷ tộc (Devil), kẻ dẫn hồn của U Minh giới** (chủ đề **thần chết · linh hồn · đồng hồ cát**):
- **Tóc:** trắng như xương, rối, mái dài che hờ 1 bên mắt, **đuôi tóc nhuộm đỏ thẫm**. **Mắt đỏ thẫm phát sáng**, đồng tử dọc. Vẻ mặt lạnh, cười nhếch.
- **Quỷ tộc:** 2 **sừng đen cong ra sau**, có vân nứt đỏ phát sáng; tai nhọn; **đuôi quỷ** đen, mũi đuôi hình mũi giáo đỏ thẫm.
- **Trang phục kiểu thần chết:**
  - Áo khoác dài đen cổ dựng cao, **vạt sau rách tua** bay theo chuyển động, lót **đỏ thẫm**.
  - **Giáp vai trắng xương hình đầu lâu nhỏ** ở 1 bên vai; xích bạc quấn chéo người.
  - Thắt lưng treo **đèn lồng hồn** nhỏ (lửa đỏ thẫm bên trong) + **đồng hồ cát** bạc nhỏ.
  - Găng tay đen ngón móng vuốt bạc; quần đen; bốt đen mũi nhọn khoá bạc.
- **Vũ khí:** **lưỡi hái lớn** (cao hơn người).
  - Cán đen quấn xích bạc, khớp nối có đồng hồ cát nhỏ, đầu cán dưới có mũi nhọn.
  - Lưỡi cong dài **trắng xương**, **mép lưỡi ánh đỏ thẫm**.
- **Phối màu cả bộ:** đen · trắng xương · đỏ thẫm · bạc.
  - Tách hẳn khỏi tông tím đen của Jessica (bản cũ của Zerith cũng tím).
  - Hợp kỹ năng: vệt chém đỏ thẫm, linh hồn, Hộ Vệ Thần Chết, Ấn Tử, đồng hồ cát "không thể chết".

Lưu vào `art/zerith/` với tên **`01-character-v3.png`**.

### 01-character-v3.png (1024×1536, nền trong suốt)
Đính kèm `art/rok/01-character-v3.png`: **chỉ để lấy phong cách chibi của cả đội**.
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed clothing and accessories, crisp clean line art, soft cel shading, vibrant colors. Use the attached image ONLY as a style reference — do NOT copy its character, outfit or colors. NEW CHARACTER: Zerith, a young devil boy, a soul reaper of the underworld. Messy bone-white hair with long bangs half covering one eye and blood-crimson dyed hair tips, glowing crimson eyes with slit pupils, a cold confident smirk; two black horns curving backward with glowing red cracks, pointed ears, a black devil tail with a crimson spade tip. A long black high-collared reaper coat with tattered torn coattails and crimson lining, a bone-white skull-shaped shoulder guard on one shoulder, silver chains wrapped across his body, a belt holding a small soul lantern with a crimson flame inside and a small silver hourglass charm, black gloves with silver claw fingertips, black pants, black pointed boots with silver buckles. His weapon: a large scythe taller than himself — a black shaft wrapped in silver chains, a small hourglass ornament at the joint, a spike at the bottom end, and a long curved bone-white blade with a glowing crimson edge — held in his FAR hand, blade above his head curving forward. Three-quarter side view facing RIGHT, full body, standing in a calm confident pose, both legs visible. Transparent background, no ground shadow, no text.
```

### 01b-portrait-v3.png (1024×1536, nền trong suốt) — ảnh màn chọn đội (tuỳ chọn)
Đính kèm `01-character-v3.png` vừa tạo.
```
Chibi 2D game character art, the SAME character as the attached image (Zerith, young devil boy reaper with messy bone-white hair with crimson tips, crimson eyes, black horns with red cracks, devil tail, long black tattered reaper coat with crimson lining, skull shoulder guard, soul lantern, large bone-white scythe with a crimson edge). Dynamic pose: the scythe resting across his shoulders behind his neck with both arms draped over it, leaning slightly forward with a sly smirk, the tattered coattails and tail swaying. Full body, transparent background, no text.
```

**Mô tả dán vào chỗ `<...>` của đoạn prompt chung sprite** (dùng cho mọi tấm dưới):
```
Zerith, a chibi young devil boy reaper with messy bone-white hair with crimson tips, glowing crimson eyes, black horns with red cracks, a black devil tail, a long black tattered reaper coat with crimson lining, a skull shoulder guard, a small soul lantern at the belt, and a large scythe with a black chained shaft and a long bone-white blade with a crimson edge
```

**Đoạn luật lưỡi hái** (dán ngay SAU đoạn chung sprite, ở MỌI tấm):
```
SCYTHE RULES: the same scythe in every frame (same length — taller than him — same black chained shaft, same long curved bone-white blade with a crimson edge); hold it exactly as each frame describes (one hand or both hands); the whole scythe stays inside the cell. Do not draw any slash trails, motion arcs, smoke, souls or glow around the blade (the game adds all effects).
```

## 1. Bảng động tác (9 tấm)

Mọi tấm 1536×1024, nền xanh #00FF00 (hoặc trong suốt), lưới 4×2. **Khung chính** = khung trùng mốc gây sát thương của server.

| # | File | Động tác (dùng khi) | Khung | Khung chính | Ưu tiên |
|---|---|---|---|---|---|
| 1 | `sprite-idle.png` | hàng trên: đứng thường · hàng dưới: thủ thế trong trận | 4 + 4 | — | ★★★ làm ĐẦU TIÊN |
| 2 | `sprite-attack.png` | đánh thường: vung lưỡi hái bổ xuống | 8 | **khung 4** @0,22s | ★★★ |
| 3 | `sprite-move.png` | chạy, lưỡi hái kéo sau lưng | 8 lặp | — | ★★★ |
| 4 | `sprite-hurt-stun.png` | trúng đòn · choáng | 4 + 4 | — | ★★★ |
| 5 | `sprite-dash-mark.png` | hàng trên: **Lưỡi Hái Xuyên Hồn** (KN1) lướt chém, lặp · hàng dưới: chỉ tay gắn **Ấn Tử** (thiên phú) | 4 + 4 | Ấn Tử: **khung 7** @0,15s | ★★★ |
| 6 | `sprite-reap-slam.png` | hàng trên: **Lưỡi Hái Hất Hồn** (KN2) quét hất lên · hàng dưới: bổ xuống (lúc Đêm Tử Thần) | 4 + 4 | quét lên: **khung 3** @0,15s · bổ xuống: **khung 7** @0,2s | ★★★ |
| 7 | `sprite-charge-summon.png` | hàng trên: gồng niệm (KN2 0,7s, KN3 1s) · hàng dưới: **Đêm Tử Thần** (KN3) gọi Thần Chết → bay lên | 4 + 4 | gồng: khung 3–4 giữ · gọi: **khung 7** @0,2s | ★★ |
| 8 | `sprite-hover.png` | bay lơ lửng suốt 10s Đêm Tử Thần: hàng trên: bay chờ · hàng dưới: chém khi bay | 4 + 4 | chém: **khung 7** @0,22s | ★★★ |
| 9 | `sprite-dead-victory.png` | gục · thắng | 4 + 4 | gục: giữ khung 4 · thắng: giữ khung 7–8 | ★ |

**Rơi vào trận:** dùng lại khung bay (rơi) + khung 1 tấm gồng (ngồi thụp đáp đất) — không cần tấm riêng.

**Game tự vẽ** (tranh ở `art/zerith/fx2/` + `art/common/`): vệt chém đỏ thẫm, linh hồn bị xé ra, lưỡi hái khổng lồ, Hộ Vệ Thần Chết, hào quang + cánh bóng tối Đêm Tử Thần, Ấn Tử, đồng hồ cát, vòng triệu hồi, bụi, sao choáng. Ở đây chỉ vẽ Zerith.

**Khung trên không** (bay, chém khi bay): vẽ trong ô như các khung khác. Game tự nhấc Zerith lên cao.

## 2. Cách tạo
1. **Tấm 1 (`sprite-idle`):** đính kèm `art/zerith/01-character-v3.png` + `art/rok/sprite/sprite-idle.png` (chỉ lấy cỡ / nét).
2. **Tấm 2–9:** đính kèm `art/zerith/01-character-v3.png` + `sprite-idle.png` **của Zerith** vừa tạo. Dặn thêm: `Draw him at exactly the same size as in the attached sprite-idle sheet.`
3. Dán **đoạn chung sprite** (mục 5 của hướng dẫn) với mô tả ở mục 0, rồi **đoạn luật lưỡi hái**, rồi **đoạn riêng** dưới đây.

## 3. Đoạn riêng từng tấm

### 1 · sprite-idle.png
```
TOP ROW, frames 1-4 = RELAXED STANDING (out of combat): standing relaxed with a cool posture, the scythe held upright beside him in his far hand with its bottom spike resting on the ground and the blade above his head, the near hand in his coat pocket, a calm smirk, tail curled, four almost identical frames with only a tiny breathing difference (chest and shoulders rise slightly).
BOTTOM ROW, frames 5-8 = COMBAT READY STANCE: a low wide stance leaning slightly forward, the scythe gripped with both hands and held diagonally in front of him with the blade high and pointing forward toward the right, glowing crimson eyes focused on the enemy, coat tails hanging, four almost identical frames with only a tiny breathing difference.
```

### 2 · sprite-attack.png — khung 4 = lưỡi hái bổ trúng
```
ANIMATION: SCYTHE CHOP, 8 frames. Frame 1: combat ready stance. Frame 2: raising the scythe up and back behind his head with both hands, body leaning back. Frame 3: swinging the scythe over his head, the blade starting to curve forward, coat tails flying. Frame 4: KEY FRAME — the blade chopped down in front of him at enemy chest height, the hooked blade pointing down and forward, arms extended, body leaning forward, front foot planted. Frame 5: follow-through, the blade low near the ground. Frame 6: pulling the scythe back. Frame 7: swinging it back up to his shoulder. Frame 8: back to the combat ready stance.
```

### 3 · sprite-move.png — chạy lặp
```
ANIMATION: REAPER RUN CYCLE, 8 frames, seamless loop (frame 8 flows back into frame 1). Fast running steps, the upper body leaning far forward, the scythe held low in one hand trailing behind him with the blade near the ground behind, the other arm swinging, the tattered coattails, hair and tail streaming back. Frame 1: near leg forward, heel down. Frame 2: down position, knees bent. Frame 3: passing position. Frame 4: up position, pushing off. Frame 5: far leg forward, heel down. Frame 6: down position. Frame 7: passing position. Frame 8: up position.
```

### 4 · sprite-hurt-stun.png — trúng đòn + choáng
```
TOP ROW = ANIMATION 1, HURT, 4 frames: Frame 1: combat ready stance. Frame 2: just got hit — flinches backward, head snapped back, eyes squeezed shut, gritted teeth, the scythe pulled close to his body. Frame 3: skids half a step back, coat tails swinging forward. Frame 4: recovering, almost back to the ready stance, angry frown.
BOTTOM ROW = ANIMATION 2, STUNNED (seamless loop), 4 frames: dazed swirly eyes, mouth slightly open, leaning on the scythe for support, knees wobbly, tail drooping. Frame 5: swaying to the left. Frame 6: back to center. Frame 7: swaying to the right. Frame 8: back to center. No stars or symbols.
```

### 5 · sprite-dash-mark.png — lướt chém (hàng trên) + gắn Ấn Tử (hàng dưới)
```
TOP ROW = ANIMATION 1, PHANTOM DASH (seamless loop while dashing through enemies), 4 frames: a lightning-fast low dash toward the right, body almost horizontal and close to the ground, the scythe held in both hands horizontally behind him with the blade trailing back, coat tails, hair and tail streaming straight back, fierce glowing eyes; the 4 frames are small variations of the same pose (legs and coat shift slightly) for a smooth loop. No speed lines, no afterimages.
BOTTOM ROW = ANIMATION 2, DEATH MARK, 4 frames: Frame 5: combat ready stance, the scythe resting on his shoulder in one hand. Frame 6: lifting the free hand in front of his face. Frame 7: KEY FRAME — pointing his index finger straight at the enemies on the right with the arm extended, a cruel smirk, crimson eyes wide (the game adds the death marks). Frame 8: lowering the hand, back toward the ready stance.
```

### 6 · sprite-reap-slam.png — quét hất lên (hàng trên) + bổ xuống (hàng dưới)
```
TOP ROW = ANIMATION 1, SOUL REAP (upward sweep that launches enemies), 4 frames: Frame 1: a deep crouch, the scythe gripped with both hands and the blade held low behind him near the ground. Frame 2: lunging forward, sweeping the blade low along the ground. Frame 3: KEY FRAME — a powerful upward sweep: the blade swung high above and in front of him, body stretched upward on his toes, arms raised, coat and tail flying up. Frame 4: holding the scythe high above his head with both hands, blade pointing up and back.
BOTTOM ROW = ANIMATION 2, REAPER SLAM (smashing down), 4 frames: Frame 5: the scythe raised high above his head with both hands (same as frame 4). Frame 6: a small jump, bringing the scythe down hard. Frame 7: KEY FRAME — the blade slammed down into the ground in front of him, crouched low, knees bent, coat tails and hair flying up. Frame 8: pulling the blade out, rising back to the ready stance.
```

### 7 · sprite-charge-summon.png — gồng (hàng trên) + Đêm Tử Thần (hàng dưới)
```
TOP ROW = ANIMATION 1, DARK CHARGE (held while casting), 4 frames: Frame 1: dropping into a deep low crouch, one knee bent deep, the scythe held horizontally across his body with both hands (this frame is also used when he lands on the battlefield). Frame 2: rising halfway, gripping the scythe tighter, head lowered. Frame 3: standing firm with feet apart, the scythe held diagonally in front of him, head lowered, crimson eyes glowing under his bangs, hair and coat tails lifted upward as if by a rising dark wind. Frame 4: almost identical to frame 3 with a tiny tremble (used for a steady hold loop).
BOTTOM ROW = ANIMATION 2, NIGHT OF DEATH (summoning the Death Guardian), 4 frames: Frame 5: raising the scythe high in one hand. Frame 6: spreading the other arm wide, head thrown back. Frame 7: KEY FRAME — both arms flung wide open, the scythe held up high, rising onto his toes, an evil grin, eyes blazing, coat tails, hair and tail blasted upward (the game adds the dark wings and the Death Guardian). Frame 8: floating just above the ground, legs together with toes pointed down, the scythe resting on his shoulder (he starts to fly).
```

### 8 · sprite-hover.png — bay chờ (hàng trên) + chém khi bay (hàng dưới)
```
All 8 frames show him FLYING, floating in the air (drawn in the cell like the other frames; the game lifts him into the air): legs bent with toes pointed down, feet NOT touching anything, the tattered coattails, hair and tail floating and fluttering upward and backward, crimson eyes glowing.
TOP ROW = ANIMATION 1, HOVER (seamless loop), 4 frames: the scythe resting on his shoulder in one hand, the other hand relaxed, a cold smirk; the four frames form a gentle floating loop (frame 2 a little higher, frame 4 a little lower), only the coat, hair, tail and feet move slightly.
BOTTOM ROW = ANIMATION 2, AERIAL CHOP, 4 frames: Frame 5: raising the scythe up behind his head with both hands. Frame 6: swinging it over his head. Frame 7: KEY FRAME — the blade chopped down in front of him toward the right, arms extended, body leaning forward in the air. Frame 8: back to the hover pose with the scythe on his shoulder.
```

### 9 · sprite-dead-victory.png — gục (hàng trên) + thắng (hàng dưới)
```
TOP ROW = ANIMATION 1, DEFEAT, 4 frames: his face shows pain (eyes squeezed shut, gritted teeth, frowning) — not smiling. Frame 1: hit hard, staggering backward. Frame 2: knees buckling, falling backward, the scythe slipping from his hand. Frame 3: falling, almost on the ground. Frame 4: lying flat on his back on the ground, eyes closed, the scythe lying beside him (final frame, held).
BOTTOM ROW = ANIMATION 2, VICTORY, 4 frames: Frame 5: twirling the scythe in one hand, smirking. Frame 6: spinning once, coat tails swirling. Frame 7: cool victory pose: the scythe resting across his shoulders behind his neck with both arms draped over it, a sly grin with one fang showing, tail curled. Frame 8: almost identical to frame 7 with a tiny change (breathing loop).
```

## 4. Mình làm khi nhận tấm
- **Ráp:** tách nền, căn chân, chỉnh cỡ (như Lyra, Seraphine).
- **Điểm gắn `blade`** (mũi lưỡi hái) ở khung chính: đánh thường khung 4, quét lên khung 3, bổ xuống khung 7, chém khi bay khung 7 → vệt chém đỏ thẫm loé đúng lưỡi hái. Điểm **`finger`** (đầu ngón tay) ở khung gắn Ấn Tử.
- **Lưỡi Hái Xuyên Hồn:** lướt theo đường server gửi, tranh lướt lặp + dư ảnh như cũ.
- **Đêm Tử Thần (10s):** Zerith bay lên như cũ; lúc bay dùng tấm 8 (bay chờ + chém khi bay) thay khung đứng / đánh thường.
- **Rơi vào trận:** khung bay 1 lúc rơi → khung gồng 1 (ngồi thụp) lúc đáp → thủ thế.
- **Gửi duyệt:** video từng động tác (`tools/test-sprite.html?char=reaper`). Khung nào hỏng mình báo số khung để tạo lại.
- **Bản khung xương cũ:** vẫn xem được bằng `?zerith=cutout`.
