# Nerissa (Thủy Vũ) — VẼ LẠI CHIBI (giữ tạo hình) + bộ tấm SPRITE (13 tấm)

Luật chung, đoạn prompt chung, câu sửa khi AI vẽ sai: `art/HUONG_DAN_VE_NHAN_VAT.md`. Hiệu ứng riêng của Nerissa: `art/nerissa/fx2/PROMPTS_FX.md`. Hiệu ứng dùng chung cả đội (bụi, sao choáng...): `art/common/PROMPTS_FX_CHUNG.md`.

Tranh cũ (`art/nerissa/01-character.png`, tấm bộ phận, dải lụa...) giữ nguyên. Tranh cũ vẽ người lớn, không chibi như cả đội. Bản 3 **giữ nguyên tạo hình**, chỉ vẽ lại tỉ lệ chibi.

## 0. Vẽ lại chibi (làm TRƯỚC mọi tấm khác)

**Giữ nguyên:**
- **Tóc và mặt:** tóc rất dài, gợn sóng, xanh biển chuyển dần sang xanh ngọc ở đuôi; cài vỏ sò + ngọc trai; tai elf nhọn; mắt xanh ngọc.
- **Trang phục:** đồ vũ công trắng phối xanh ngọc đậm, viền vàng, đính đá xanh ngọc (aquamarine). Váy ngắn xếp bèo trắng, có các tà voan xanh ngọc trong suốt rủ dài.
- **Trang sức:** vòng tay, vòng bắp tay vàng; dây cổ chân vàng; giày múa trắng quấn dây vàng.
- **2 dải lụa** voan xanh ngọc trong suốt, hoạ tiết sóng nước trắng, viền vàng, đuôi treo hạt ngọc. Dải lụa vắt từ cổ tay / bắp tay, rất dài, bay theo động tác.

Lưu vào `art/nerissa/` với tên **`01-character-v3.png`**.

### 01-character-v3.png (1024×1536, nền trong suốt)
Đính kèm 2 ảnh:
- `art/nerissa/01-character.png`: thiết kế gốc (lấy trang phục, màu);
- `art/rok/01-character-v3.png`: **chỉ để lấy tỉ lệ chibi + phong cách của cả đội**.
```
Chibi 2D game character art. Redraw EXACTLY the character, outfit, colors and accessories of the FIRST attached image, but in the chibi proportions and drawing style of the SECOND attached image: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed outfit and accessories, crisp clean line art, soft cel shading, vibrant colors. Use the second image ONLY for proportions and style — do NOT copy its character, outfit or colors. CHARACTER: Nerissa, a graceful elf water dancer: very long wavy ocean-blue hair fading to aqua at the tips, a seashell and pearl hair ornament, pointed elf ears, aqua eyes, gentle smile; a white and deep-teal dancer top with gold trim and aquamarine gems, a short white ruffled skirt with long sheer aqua panels hanging down, gold arm cuffs and bracelets, gold anklets, white dance slippers laced with gold; two very long translucent aqua silk ribbons with white wave patterns, gold edges and small jewel tassels at the ends, draped from her wrists and flowing around her. Three-quarter side view facing RIGHT, full body, standing lightly on her toes in a calm graceful pose, both legs visible, the ribbons flowing behind her. Transparent background, no ground shadow, no text.
```

### 01b-portrait-v3.png (1024×1536, nền trong suốt) — ảnh màn chọn đội (tuỳ chọn)
Đính kèm `01-character-v3.png` vừa tạo.
```
Chibi 2D game character art, the SAME character as the attached image (Nerissa, chibi elf water dancer with very long wavy ocean-blue hair, seashell ornament, white and teal dancer outfit with gold trim, two long translucent aqua silk ribbons). Elegant dancing pose: spinning on one toe, one arm raised high, the two silk ribbons swirling around her in big graceful spirals, hair flowing. Full body, transparent background, no text.
```

**Mô tả dán vào chỗ `<...>` của đoạn prompt chung sprite** (dùng cho mọi tấm dưới):
```
Nerissa, a chibi elf water dancer with very long wavy ocean-blue hair fading to aqua, a seashell and pearl hair ornament, pointed elf ears, aqua eyes, a white and deep-teal dancer outfit with gold trim and aquamarine gems, a short white ruffled skirt with sheer aqua panels, gold bracelets and anklets, and two very long translucent aqua silk ribbons with white wave patterns flowing from her wrists
```
**Dán thêm câu này ở cuối đoạn chung** (giữ dải lụa đồng nhất):
```
The two long silk ribbons are ALWAYS drawn in every frame, attached to her wrists, the same color and pattern, flowing with the movement; they may curve around her but stay inside her own cell.
```

## 1. Bảng động tác (13 tấm)

Mọi tấm 1536×1024, nền xanh #00FF00 (hoặc trong suốt), lưới 4×2. **Khung chính** = khung trùng mốc gây sát thương của server.

| # | File | Động tác (dùng khi) | Khung | Khung chính | Ưu tiên |
|---|---|---|---|---|---|
| 1 | `sprite-idle.png` | hàng trên: đứng thường · hàng dưới: thủ thế trong trận | 4 + 4 | — | ★★★ làm ĐẦU TIÊN |
| 2 | `sprite-attack.png` | đánh thường: quất dải lụa bắn giọt nước | 8 | **khung 4** @0,24s (đầu dải lụa vươn xa nhất) | ★★★ |
| 3 | `sprite-move.png` | chạy nhẹ nhàng kiểu vũ công (lướt trên mũi chân) | 8 lặp | — | ★★★ |
| 4 | `sprite-hurt-stun.png` | trúng đòn · choáng | 4 + 4 | — | ★★★ |
| 5 | `sprite-spin-land.png` | hàng trên: xoay người VÀO ĐIỆU MÚA (mọi điệu) · hàng dưới: rơi vào trận → đáp đất | 4 + 4 | xoay: **khung 3** @0,3s | ★★★ |
| 6 | `sprite-dance1.png` | **Vũ Khúc Sóng Triều** (KN1, hồi MP cả đội) | 8 lặp | — | ★★★ |
| 7 | `sprite-dance2.png` | **Lưu Thủy Hồi Xuân** (KN2, hồi máu cả đội) | 8 lặp | — | ★★★ |
| 8 | `sprite-dance3.png` | **Thủy Thần Vũ** (KN3, gọi Thủy Thần) | 8 lặp | — | ★★★ |
| 9 | `sprite-dance12.png` | múa 1 + 2 cùng lúc (giáp nước cả đội) | 8 lặp | — | ★★ |
| 10 | `sprite-dance13.png` | múa 1 + 3 (phe ta đánh nhanh, phe địch chậm) | 8 lặp | — | ★★ |
| 11 | `sprite-dance23.png` | múa 2 + 3 (hút Orb của đối thủ) | 8 lặp | — | ★★ |
| 12 | `sprite-dance123.png` | múa cả 3 điệu (bắn nốt nhạc) | 8 lặp | — | ★★ |
| 13 | `sprite-dead-victory.png` | gục · thắng | 4 + 4 | gục: giữ khung 4 · thắng: giữ khung 7–8 | ★ |

**Điệu múa lặp liền:** khung 8 nối mượt về khung 1. Nerissa **múa tại chỗ** (game tự cho cô lượn qua lại), chân đặt cùng 1 đường đáy ở mọi khung.

**Game tự vẽ** (tranh ở `art/nerissa/fx2/` + `art/common/`): giọt nước bay, nước bắn khi trúng, vòng sóng lúc vào điệu, mưa hồi máu, Thủy Thần, bong bóng giáp nước, nốt nhạc, biểu tượng buff / debuff, bụi, sao choáng. Ở đây chỉ vẽ Nerissa.

## 2. Cách tạo
1. **Tấm 1 (`sprite-idle`):** đính kèm `art/nerissa/01-character-v3.png` + `art/jessica/sprite/sprite-idle.png` (chỉ lấy cỡ / nét).
2. **Tấm 2–13:** đính kèm `art/nerissa/01-character-v3.png` + `sprite-idle.png` **của Nerissa** vừa tạo.
3. Dán **đoạn chung sprite** (mục 5 của hướng dẫn) với mô tả ở mục 0 + câu dải lụa, rồi dán **đoạn riêng** dưới đây.

## 3. Đoạn riêng từng tấm

### 1 · sprite-idle.png
```
TOP ROW, frames 1-4 = RELAXED STANDING (out of combat): standing gracefully on her toes, one hand resting near her chest, the other arm lowered, the ribbons hanging and drifting softly, gentle smile, four almost identical frames with only a tiny breathing difference (chest and shoulders rise slightly, ribbon ends sway slightly).
BOTTOM ROW, frames 5-8 = COMBAT READY STANCE: a light dancer's stance, knees slightly bent, both arms held out to the sides holding the ribbons ready like a dancer about to begin, focused eyes, four almost identical frames with only a tiny breathing difference.
```

### 2 · sprite-attack.png — khung 4 = đầu dải lụa vươn xa nhất
```
ANIMATION: RIBBON WHIP, 8 frames. Frame 1: combat ready stance. Frame 2: draws the near arm back behind her, the ribbon trailing behind, body turning. Frame 3: steps forward, the arm swinging forward, the ribbon arcing over her head. Frame 4: KEY FRAME — the arm fully extended forward toward the right, the ribbon whipped straight out toward the right, its tip reaching far ahead at chest height (the game adds the water drop shooting from the ribbon tip). Frame 5: the ribbon snapping back in a wave. Frame 6: the ribbon curling back toward her. Frame 7: a small graceful turn. Frame 8: back to the combat ready stance.
```

### 3 · sprite-move.png — chạy lặp
```
ANIMATION: GRACEFUL DANCER RUN CYCLE, 8 frames, seamless loop (frame 8 flows back into frame 1). Light quick steps on her toes, body leaning slightly forward, both arms held slightly back and out like wings, the ribbons and long hair streaming back. Frame 1: near leg forward, toe down. Frame 2: down position. Frame 3: passing position. Frame 4: up position, light hop. Frame 5: far leg forward, toe down. Frame 6: down position. Frame 7: passing position. Frame 8: up position.
```

### 4 · sprite-hurt-stun.png — trúng đòn + choáng
```
TOP ROW = ANIMATION 1, HURT, 4 frames: Frame 1: combat ready stance. Frame 2: just got hit — flinches backward, head snapped back, eyes squeezed shut, arms pulled in, ribbons flung forward. Frame 3: stumbles half a step back. Frame 4: recovering, almost back to the ready stance, pained frown.
BOTTOM ROW = ANIMATION 2, STUNNED (seamless loop), 4 frames: dazed swirly eyes, mouth slightly open, arms hanging limp, ribbons drooping, knees wobbly. Frame 5: swaying to the left. Frame 6: back to center. Frame 7: swaying to the right. Frame 8: back to center. No stars or symbols.
```

### 5 · sprite-spin-land.png — xoay vào điệu múa (hàng trên) + rơi vào trận (hàng dưới)
```
TOP ROW = ANIMATION 1, SPIN INTO THE DANCE, 4 frames: Frame 1: combat ready stance, gathering the ribbons. Frame 2: starts a pirouette on one toe, body turning away, ribbons beginning to swirl. Frame 3: KEY FRAME — mid-pirouette facing the viewer, both arms spread wide, the two ribbons flying out in a big circle all around her (the game adds the water wave). Frame 4: finishing the turn in an elegant dance pose, one arm raised.
BOTTOM ROW = ANIMATION 2, ENTRANCE LANDING, 4 frames: Frame 5: falling from the sky, body upright, legs together, arms raised, ribbons and hair blown upward. Frame 6: touchdown on her toes in a soft deep bow, ribbons settling around her. Frame 7: rising gracefully. Frame 8: combat ready stance.
```

### 6 · sprite-dance1.png — Vũ Khúc Sóng Triều (lặp)
```
ANIMATION: TIDE DANCE, 8 frames, seamless loop (frame 8 flows back into frame 1), dancing in place with feet on the same ground line. A flowing rolling dance like ocean waves: her arms ripple in smooth wave motions from one side to the other, the two ribbons tracing big wave shapes, the body sways side to side and rises and dips like a tide. Frame 1: arms flowing to the left, body leaning left, ribbons rolling. Frame 2: arms rising in a wave. Frame 3: arms high, rising on her toes. Frame 4: arms rolling down to the right. Frame 5: arms flowing to the right, body leaning right. Frame 6: arms rising in a wave. Frame 7: arms high, rising on her toes. Frame 8: arms rolling down to the left, back toward frame 1. Calm happy face.
```

### 7 · sprite-dance2.png — Lưu Thủy Hồi Xuân (lặp)
```
ANIMATION: HEALING FLOW DANCE, 8 frames, seamless loop, dancing in place with feet on the same ground line. A slow, gentle, soothing dance: she cups her hands as if scooping water and raises it to the sky to pour it down on her friends, the ribbons drifting in soft circles. Frame 1: kneeling gracefully on one knee, hands cupped low in front. Frame 2: rising, cupped hands lifting. Frame 3: standing on her toes, hands raised above her head, eyes closed peacefully. Frame 4: arms opening wide and lowering like pouring water, ribbons fanning out. Frame 5: a slow half turn, arms flowing. Frame 6: arms crossing softly at the chest. Frame 7: lowering into a gentle bow. Frame 8: sinking back toward the kneel of frame 1. Kind, serene face.
```

### 8 · sprite-dance3.png — Thủy Thần Vũ (lặp)
```
ANIMATION: WATER GODDESS DANCE, 8 frames, seamless loop, dancing in place with feet on the same ground line. A majestic, powerful summoning dance: proud regal poses, arms raised high to call the water goddess, the two ribbons spiraling upward around her like rising water. Frame 1: standing tall, both arms raised high in a V, chin up. Frame 2: arms sweeping down in a big circle. Frame 3: a strong step forward, one arm pointing to the sky, the other forward. Frame 4: a full spin with ribbons spiraling up. Frame 5: both arms raised high together above her head, palms together. Frame 6: arms opening wide like wings. Frame 7: a proud pose, one arm high, one arm low. Frame 8: arms rising back toward the V of frame 1. Confident, solemn face.
```

### 9 · sprite-dance12.png — múa 1 + 2 (lặp)
```
ANIMATION: PROTECTIVE CIRCLE DANCE (tide + healing combined), 8 frames, seamless loop, dancing in place with feet on the same ground line. She turns slowly in place while the two ribbons wrap around her body in a full protective circle, like the outline of a bubble around her, her arms guiding the ribbons around. Frame 1: facing right, ribbons starting to circle. Frame 2: turning, ribbons in front of her. Frame 3: facing the viewer, ribbons forming a ring around her waist. Frame 4: turning away, ribbons rising. Frame 5: back view, ribbons circling high. Frame 6: turning back, ribbons sweeping down. Frame 7: facing the viewer, ribbons forming a ring around her shoulders. Frame 8: turning back toward frame 1. Gentle, protective expression.
```

### 10 · sprite-dance13.png — múa 1 + 3 (lặp)
```
ANIMATION: QUICK RHYTHM DANCE (tide + goddess combined), 8 frames, seamless loop, dancing in place with feet on the same ground line. An energetic, fast, joyful dance: quick light hops and sharp turns, the ribbons whipping in fast zigzags, hair bouncing. Frame 1: a quick hop, one knee raised, arms up. Frame 2: landing, ribbons snapping to the left. Frame 3: a sharp turn, arms whipping to the right. Frame 4: a high kick of one leg, arms spread. Frame 5: a quick hop the other way, arms up. Frame 6: landing, ribbons snapping to the right. Frame 7: a sharp turn, arms whipping to the left. Frame 8: a little skip back toward frame 1. Bright excited smile.
```

### 11 · sprite-dance23.png — múa 2 + 3 (lặp)
```
ANIMATION: DRAWING TIDE DANCE (healing + goddess combined), 8 frames, seamless loop, dancing in place with feet on the same ground line. A hypnotic, pulling dance: she reaches far toward the enemies on the right, then draws her hands back to her chest as if pulling water (and their energy) toward her, the ribbons flowing toward her in long curves. Frame 1: leaning forward, both arms reaching far to the right. Frame 2: fingers curling, starting to pull. Frame 3: drawing the arms back, ribbons flowing toward her. Frame 4: hands gathered at her chest, eyes closed. Frame 5: a slow sway backward. Frame 6: arms circling outward. Frame 7: stepping forward again. Frame 8: reaching out toward frame 1. Mysterious calm expression.
```

### 12 · sprite-dance123.png — múa cả 3 điệu (lặp)
```
ANIMATION: GRAND FINALE DANCE (all three dances combined), 8 frames, seamless loop, dancing in place with feet on the same ground line. The most beautiful, grand dance: continuous pirouettes and a graceful leap, both ribbons forming a huge spiral around her, hair flowing wide, radiant joyful face. Frame 1: elegant pose on one toe, arms open. Frame 2: starting a pirouette, ribbons swirling. Frame 3: mid-pirouette facing the viewer, ribbons in a big spiral. Frame 4: finishing the turn, one leg extended back (arabesque). Frame 5: a graceful leap with legs split, arms high, ribbons trailing in arcs. Frame 6: landing softly on her toes. Frame 7: a second pirouette with arms raised above her head. Frame 8: flowing back toward the pose of frame 1.
```

### 13 · sprite-dead-victory.png — gục (hàng trên) + thắng (hàng dưới)
```
TOP ROW = ANIMATION 1, DEFEAT, 4 frames: Frame 1: hit hard, staggering backward, eyes squeezed shut. Frame 2: knees buckling, falling backward, ribbons fluttering. Frame 3: falling, almost on the ground. Frame 4: lying on her side on the ground, eyes closed, the ribbons spread around her (final frame, held).
BOTTOM ROW = ANIMATION 2, VICTORY, 4 frames: Frame 5: a happy little twirl, big smile. Frame 6: a light jump with arms raised, ribbons flying. Frame 7: a graceful curtsy-like victory pose, one hand on her chest, the other arm raised with the ribbon flowing, eyes closed with a happy smile. Frame 8: almost identical to frame 7 with a tiny change (breathing loop).
```

## 4. Mình làm khi nhận tấm
- **Ráp:** tách nền, căn chân, chỉnh cỡ (như Rok / Jessica). Đánh dấu điểm gắn:
  - đầu dải lụa ở khung đánh chính (attack khung 4): chỗ giọt nước bay ra.
- **Điệu múa:** mỗi điệu chạy 8 khung lặp theo đúng nhịp điệu múa cũ (điệu 1: 1,6s · 2: 2,4s · 3: 2,0s · 1+2: 1,4s · 1+3: 1,3s · 2+3: 1,8s · 1+2+3: 1,5s). Game vẫn cho Nerissa lượn qua lại khi múa.
- **Dải lụa:** đã vẽ trong tranh → bỏ dải lụa lò xo của bản khung xương khi dùng sprite.
- **Gửi duyệt:** video từng động tác + từng điệu múa (`tools/test-sprite.html?char=dancer`). Khung nào hỏng mình báo số khung để tạo lại.
- **Bản khung xương cũ:** vẫn xem được bằng `?nerissa=cutout`.
