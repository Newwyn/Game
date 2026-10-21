# Seraphine (Thánh Quang) — TẠO HÌNH MỚI (nữ tu sĩ ánh mặt trời) + bộ tấm SPRITE

Tài liệu liên quan:
- Luật chung, đoạn prompt chung, câu sửa khi AI vẽ sai: `art/HUONG_DAN_VE_NHAN_VAT.md`.
- Hiệu ứng riêng của Seraphine: `art/seraphine/fx2/PROMPTS_FX.md`.
- Hiệu ứng dùng chung cả đội (bụi, khói, sao choáng...): `art/common/PROMPTS_FX_CHUNG.md`.

Tranh Seraphine cũ (`art/seraphine/01-character.png`, tấm bộ phận, `04-guardian-angels.png`) giữ nguyên, không dùng nữa khi bản mới vào game.

## 0. Tạo hình mới (làm TRƯỚC mọi tấm khác)

**Seraphine bản 3 — nữ tu sĩ trẻ của ánh mặt trời** (người, chủ đề **mặt trời mọc**: hợp Thánh Quang, hồi máu, thiên thần):
- **Tóc:** vàng mật ong, rất dài (tới gối), gợn sóng mềm, vài lọn ôm mặt.
  - **Vương miện tia nắng** nhỏ: đĩa mặt trời vàng giữa trán, các tia nắng toả ra.
  - **Mắt hổ phách vàng ấm**, nụ cười hiền.
- **Trang phục tu sĩ:**
  - Váy tu sĩ trắng cổ cao, thêu **mặt trời vàng**; tay áo rộng xoè, lót **hồng phấn**.
  - Áo choàng ngắn trắng có mũ trùm (mũ hạ xuống), viền vàng.
  - **Khăn choàng cầu nguyện màu hồng phấn** vắt qua vai, 2 đầu buông tới gối, đính hình mặt trời vàng nhỏ (bay theo chuyển động: đẹp khi niệm, bay lên).
  - Đai vàng khoá hình mặt trời. Tất trắng, ủng ngắn trắng viền vàng.
- **Vũ khí:** gậy phép dài thon trắng vàng.
  - Đầu gậy là **vòng mặt trời vàng có tia nhọn**, giữa vòng là **viên pha lê trắng vàng phát sáng lơ lửng**.
  - Cầm ở **tay xa**; tay gần để trống (làm phép, chắp tay cầu nguyện).
- **Phối màu cả bộ:** trắng · vàng kim · hồng phấn · ánh sáng hổ phách.
  - Khác hẳn cả đội: Rok trắng xanh hoàng gia, Nerissa trắng xanh ngọc, Lyra xanh ngọc nâu.
  - Hợp kỹ năng: cầu ánh sáng, tia nắng hồi máu, khiên ánh sáng, Hộ Vệ Thiên Sứ, thiên thần nhỏ.

Lưu vào `art/seraphine/` với tên **`01-character-v3.png`**.

### 01-character-v3.png (1024×1536, nền trong suốt)
Đính kèm `art/rok/01-character-v3.png`: **chỉ để lấy phong cách chibi của cả đội**.
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed clothing and accessories, crisp clean line art, soft cel shading, vibrant colors. Use the attached image ONLY as a style reference — do NOT copy its character, outfit or colors. NEW CHARACTER: Seraphine, a young priestess of holy sunlight (human). Very long flowing honey-gold hair reaching her knees with soft waves, a few strands framing her face, a small golden sun-ray tiara on her forehead (a little sun disc with radiating rays), warm amber-gold eyes, a gentle kind smile. A white high-collared priestess dress with golden sun embroidery, wide flowing sleeves lined with soft rose-pink, a short white hooded capelet (hood down) with gold trim, a long rose-pink prayer stole draped over her shoulders with both ends hanging down to her knees, decorated with small golden sun symbols, a golden belt with a sun-shaped clasp, white tights and short white-and-gold boots. Her weapon: a tall slender white-and-gold staff topped by a golden sun ring with sharp rays, a glowing white-gold crystal floating in the center of the ring — held vertically in her FAR hand; her near hand is free. Three-quarter side view facing RIGHT, full body, standing in a calm gentle pose, both legs visible. Transparent background, no ground shadow, no text.
```

### 01b-portrait-v3.png (1024×1536, nền trong suốt) — ảnh màn chọn đội (tuỳ chọn)
Đính kèm `01-character-v3.png` vừa tạo.
```
Chibi 2D game character art, the SAME character as the attached image (Seraphine, young sun priestess with very long honey-gold hair, golden sun-ray tiara, amber eyes, white and gold priestess dress with rose-pink sleeve linings, long rose-pink prayer stole, white-gold staff topped by a golden sun ring with a glowing crystal). Dynamic pose: floating slightly above the ground, raising her staff high with the far hand, the near hand held open toward the viewer as if blessing, eyes softly closed with a serene smile, her long hair and the prayer stole floating upward. Full body, transparent background, no text.
```

**Mô tả dán vào chỗ `<...>` của đoạn prompt chung sprite** (dùng cho mọi tấm dưới):
```
Seraphine, a chibi young sun priestess with very long honey-gold hair, a golden sun-ray tiara, amber eyes, a white and gold priestess dress with rose-pink sleeve linings, a long rose-pink prayer stole, and a tall white-gold staff topped by a golden sun ring with a glowing crystal
```

**Đoạn luật gậy phép** (dán ngay SAU đoạn chung sprite, ở MỌI tấm):
```
STAFF RULES: the staff is always held in her FAR hand (the hand farther from the viewer), the same staff in every frame (same length, same golden sun ring and crystal on top); her near hand stays free for gestures. Do not draw any light, beams, orbs or magic around the staff or hands (the game adds all effects).
```

## 1. Bảng động tác (8 tấm)

Mọi tấm 1536×1024, nền xanh #00FF00 (hoặc trong suốt), lưới 4×2. **Khung chính** = khung trùng mốc gây sát thương / hồi máu của server.

| # | File | Động tác (dùng khi) | Khung | Khung chính | Ưu tiên |
|---|---|---|---|---|---|
| 1 | `sprite-idle.png` | hàng trên: đứng thường · hàng dưới: thủ thế trong trận | 4 + 4 | — | ★★★ làm ĐẦU TIÊN |
| 2 | `sprite-attack.png` | đánh thường: chĩa gậy phóng cầu ánh sáng | 8 | **khung 4** @0,22s | ★★★ |
| 3 | `sprite-move.png` | chạy nhẹ nhàng | 8 lặp | — | ★★★ |
| 4 | `sprite-hurt-stun.png` | trúng đòn · choáng | 4 + 4 | — | ★★★ |
| 5 | `sprite-heal-shield.png` | hàng trên: **Thánh Quang Trị Liệu** (KN1) · hàng dưới: **Khiên Ánh Sáng** (KN2) | 4 + 4 | hồi máu: **khung 3** @0,3s · khiên: **khung 7** @0,28s | ★★★ |
| 6 | `sprite-raise-land.png` | hàng trên: **Thánh Niệm** (KN3) giơ gậy → bay lên · hàng dưới: rơi vào trận → đáp đất | 4 + 4 | giơ gậy: **khung 3** @0,45s | ★★ |
| 7 | `sprite-pray.png` | lơ lửng niệm suốt 10s Thánh Niệm: hàng trên: chắp tay niệm · hàng dưới: hồi máu / khiên khi đang niệm | 4 + 4 | ra phép: **khung 7** | ★★★ |
| 8 | `sprite-dead-victory.png` | gục · thắng | 4 + 4 | gục: giữ khung 4 · thắng: giữ khung 7–8 | ★ |

**Game tự vẽ** (tranh ở `art/seraphine/fx2/` + `art/common/`): cầu ánh sáng đang bay, tia nắng hồi máu, khiên ánh sáng, Hộ Vệ Thiên Sứ sau lưng, thiên thần nhỏ, vòng thánh dưới chân, loé trúng, bụi, sao choáng. Ở đây chỉ vẽ Seraphine.

**Khung trên không** (bay lên, niệm, rơi): vẽ trong ô như các khung khác. Game tự nhấc Seraphine lên cao.

## 2. Cách tạo
1. **Tấm 1 (`sprite-idle`):** đính kèm `art/seraphine/01-character-v3.png` + `art/rok/sprite/sprite-idle.png` (chỉ lấy cỡ / nét).
2. **Tấm 2–8:** đính kèm `art/seraphine/01-character-v3.png` + `sprite-idle.png` **của Seraphine** vừa tạo.
3. Dán **đoạn chung sprite** (mục 5 của hướng dẫn) với mô tả ở mục 0, rồi **đoạn luật gậy phép**, rồi **đoạn riêng** dưới đây.

## 3. Đoạn riêng từng tấm

### 1 · sprite-idle.png
```
TOP ROW, frames 1-4 = RELAXED STANDING (out of combat): standing upright and graceful, the staff held vertically at her side in her far hand with its foot resting on the ground, the near hand resting gently on her chest, eyes soft, kind smile, four almost identical frames with only a tiny breathing difference (chest and shoulders rise slightly), the prayer stole hanging down.
BOTTOM ROW, frames 5-8 = COMBAT READY STANCE: feet slightly apart, the staff held forward at an angle in her far hand with the sun ring pointing up and toward the right, the near hand raised open at chest height ready to cast, focused determined eyes, four almost identical frames with only a tiny breathing difference.
```

### 2 · sprite-attack.png — khung 4 = cầu ánh sáng bay ra
```
ANIMATION: STAFF LIGHT SHOT, 8 frames. Frame 1: combat ready stance. Frame 2: lifting the staff up and back, the near hand drawing toward her chest. Frame 3: the staff raised high at the top of the swing, body leaning back slightly, the prayer stole swinging. Frame 4: KEY FRAME — the staff swept forward and pointed straight at the enemy on the right, the arm extended, the near hand open behind her for balance, body leaning forward, hair and stole flowing back (the game adds the orb of light flying from the sun ring). Frame 5: follow-through, the staff still pointing forward. Frame 6: pulling the staff back. Frame 7: settling, almost back to the ready stance. Frame 8: back to the combat ready stance.
```

### 3 · sprite-move.png — chạy lặp
```
ANIMATION: GENTLE RUN CYCLE, 8 frames, seamless loop (frame 8 flows back into frame 1). Light graceful running steps holding up the hem of her dress slightly with the near hand, the staff held upright in her far hand, the upper body leaning slightly forward, the long hair and the prayer stole streaming back. Frame 1: near leg forward, heel down. Frame 2: down position, knees bent. Frame 3: passing position. Frame 4: up position, pushing off. Frame 5: far leg forward, heel down. Frame 6: down position. Frame 7: passing position. Frame 8: up position.
```

### 4 · sprite-hurt-stun.png — trúng đòn + choáng
```
TOP ROW = ANIMATION 1, HURT, 4 frames: Frame 1: combat ready stance. Frame 2: just got hit — flinches backward, head snapped back, eyes squeezed shut in pain, the staff pulled close to her body, the near hand raised to protect herself. Frame 3: stumbles half a step back, hair and stole swinging forward. Frame 4: recovering, almost back to the ready stance, worried frown.
BOTTOM ROW = ANIMATION 2, STUNNED (seamless loop), 4 frames: dazed swirly eyes, mouth slightly open, leaning on the staff for support, knees wobbly. Frame 5: swaying to the left. Frame 6: back to center. Frame 7: swaying to the right. Frame 8: back to center. No stars or symbols.
```

### 5 · sprite-heal-shield.png — hồi máu (hàng trên) + khiên ánh sáng (hàng dưới)
```
TOP ROW = ANIMATION 1, HEALING PRAYER, 4 frames: Frame 1: combat ready stance. Frame 2: raising the staff high above her head, looking up, the near hand opening upward. Frame 3: KEY FRAME — the staff held straight up toward the sky at full height, the near hand stretched out toward the right with the palm open and facing up, a warm smile, eyes looking at the ally she heals, hair and stole lifting softly (the game adds the falling sunlight). Frame 4: lowering the staff, back toward the ready stance.
BOTTOM ROW = ANIMATION 2, SHIELD OF LIGHT, 4 frames: Frame 5: combat ready stance. Frame 6: sweeping the staff forward in front of her body. Frame 7: KEY FRAME — the staff held upright in front of her, the near hand pushed forward with the palm facing out toward the right as if raising a barrier, feet planted firmly, determined eyes, stole flying back. Frame 8: relaxing back toward the ready stance.
```

### 6 · sprite-raise-land.png — Thánh Niệm (hàng trên) + rơi vào trận (hàng dưới)
```
TOP ROW = ANIMATION 1, HOLY PRAYER BEGINS, 4 frames: Frame 1: combat ready stance. Frame 2: gripping the staff with both hands and lifting it, looking up. Frame 3: KEY FRAME — the staff raised high above her head with both hands, body stretched upward on her toes, eyes closed, her long hair and the prayer stole lifted upward by a soft rising wind (the game adds the burst of light). Frame 4: floating just above the ground, legs together with toes pointed down, both hands clasped in prayer in front of her chest, the staff floating upright beside her far side, eyes closed (she starts to pray in the air).
BOTTOM ROW = ANIMATION 2, ENTRANCE LANDING, 4 frames: Frame 5: falling from the sky, body upright, knees bent, the staff held out to the side, hair and stole blown upward. Frame 6: touchdown in a soft low crouch, the staff planted on the ground for balance. Frame 7: rising from the crouch. Frame 8: confident combat ready stance.
```

### 7 · sprite-pray.png — niệm lơ lửng (hàng trên) + ra phép khi niệm (hàng dưới)
```
All 8 frames show her FLOATING in the air while praying (drawn in the cell like the other frames; the game lifts her into the air): legs together with knees softly bent and toes pointed down, feet NOT touching anything, the staff floating upright beside her far side (not held), her very long hair and the prayer stole floating gently upward and outward.
TOP ROW = ANIMATION 1, PRAYING (seamless loop), 4 frames: both hands clasped in prayer in front of her chest, eyes closed, serene expression; the four frames form a gentle floating loop (frame 2 a little higher, frame 4 a little lower), only the hair and stole move slightly.
BOTTOM ROW = ANIMATION 2, CASTING WHILE PRAYING, 4 frames: Frame 5: eyes opening, starting to unclasp her hands. Frame 6: the near hand drawing back toward her shoulder, palm open. Frame 7: KEY FRAME — the near arm extended toward the right with the palm open and glowing gently, a kind determined look, the staff still floating beside her. Frame 8: hands returning together in prayer, eyes closing.
```

### 8 · sprite-dead-victory.png — gục (hàng trên) + thắng (hàng dưới)
```
TOP ROW = ANIMATION 1, DEFEAT, 4 frames: her face shows pain (eyes squeezed shut, frowning, mouth tense) — not smiling. Frame 1: hit hard, staggering backward. Frame 2: knees buckling, falling backward, the staff slipping from her hand. Frame 3: falling, almost on the ground. Frame 4: lying flat on her back on the ground, eyes closed, the staff lying beside her (final frame, held).
BOTTOM ROW = ANIMATION 2, VICTORY, 4 frames: Frame 5: a light happy hop, big smile. Frame 6: spinning once with the staff, hair and stole twirling. Frame 7: joyful victory pose: the staff raised high in the far hand, the near hand making a cheerful V sign, eyes closed with a big smile, hair and stole flowing. Frame 8: almost identical to frame 7 with a tiny change (breathing loop).
```

## 4. Mình làm khi nhận tấm
- **Ráp:** tách nền, căn chân, chỉnh cỡ (như Lyra).
- **Điểm gắn `staff`** (vòng mặt trời đầu gậy) ở khung ra phép: đánh thường khung 4, hồi máu khung 3, khiên khung 7 → cầu ánh sáng / thiên thần bay ra đúng đầu gậy. Điểm **`palm`** (lòng bàn tay) ở khung 7 tấm niệm.
- **Thánh Niệm (10s):** Seraphine bay lên như cũ; lúc niệm dùng tấm 7 (chắp tay niệm lặp, ra phép khi hồi máu / khiên) thay khung đứng.
- **Gửi duyệt:** video từng động tác (`tools/test-sprite.html?char=priest`). Khung nào hỏng mình báo số khung để tạo lại.
- **Bản khung xương cũ:** vẫn xem được bằng `?seraphine=cutout`.
