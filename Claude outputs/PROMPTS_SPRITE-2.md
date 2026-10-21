# Lyra (Phong Tiễn) — TẠO HÌNH MỚI (nữ xạ thủ tiên tộc của gió) + bộ tấm SPRITE

Tài liệu liên quan:
- Luật chung, đoạn prompt chung, câu sửa khi AI vẽ sai: `art/HUONG_DAN_VE_NHAN_VAT.md`.
- Hiệu ứng riêng của Lyra: `art/lyra/fx2/PROMPTS_FX.md`.
- Hiệu ứng dùng chung cả đội (bụi, khói, sao choáng...): `art/common/PROMPTS_FX_CHUNG.md`.

Tranh Lyra cũ (`art/lyra/01-character.png`, tấm bộ phận) giữ nguyên, không dùng nữa khi bản mới vào game.

## 0. Tạo hình mới (làm TRƯỚC mọi tấm khác)

**Lyra bản 3 — nữ xạ thủ tiên tộc (Elf) của gió, chủ đề chim ưng** (hợp thiên phú Ưng Nhãn):
- **Tộc Elf:** tai nhọn dài, mắt xanh lục bảo, vẻ mặt điềm tĩnh, cười nhẹ tự tin.
- **Tóc:** nâu hạt dẻ ánh đồng, dài, vài lọn ôm mặt, tết thành **1 bím tóc dày dài** đung đưa sau lưng, buộc ruy băng xanh ngọc. Sau tai cài **lông chim ưng trắng** + kẹp lá vàng nhỏ.
  - Màu tóc này khác hẳn cả đội: tóc vàng (Seraphine), bạch kim (Rok), bạc (Zerith, Elarion), xanh biển (Nerissa), đỏ (Ignar, Brakk), đen tím (Jessica).
- **Trang phục kiểu du hiệp gió:**
  - Áo choàng ngắn có mũ trùm (mũ hạ xuống) màu **xanh ngọc lục**, viền **lông vũ trắng** như đôi cánh nhỏ trên vai.
  - Áo trắng thêu hoạ tiết **xoáy gió vàng**. Đai da nâu khoá vàng.
  - Váy ngắn xanh ngọc + **2 dải thắt lưng dài màu bạc hà** bay theo gió (đẹp khi chạy, nhảy, bay).
  - Quần ngắn tối màu. Bao tay da + găng bắn cung ở tay gần.
  - Ủng da nâu cao, mũi bọc vàng, **cánh lông vũ nhỏ ở cổ chân**.
  - Ống tên da nâu đeo sau lưng, tên đuôi lông trắng xanh ngọc.
- **Vũ khí:** cung lớn cong 2 đầu (recurve) **hình đôi cánh chim ưng dang rộng**.
  - Thân cung trắng vàng chạm khắc như lông vũ, đầu cung là lông vũ xanh ngọc.
  - **Ngọc xanh tròn** ở tay cầm, dây cung bạc mảnh.
  - Cầm ở **tay xa**, kéo dây bằng **tay gần** (người thuận tay phải).
- **Phối màu cả bộ:** xanh ngọc lục · trắng · vàng · nâu da.
  - Hợp kỹ năng: gió xanh ngọc, Vệ Thần Gió cánh chim ưng, mũi tên ánh sáng.

Lưu vào `art/lyra/` với tên **`01-character-v3.png`**.

### 01-character-v3.png (1024×1536, nền trong suốt)
Đính kèm `art/rok/01-character-v3.png`: **chỉ để lấy phong cách chibi của cả đội**.
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed clothing and accessories, crisp clean line art, soft cel shading, vibrant colors. Use the attached image ONLY as a style reference — do NOT copy its character, outfit or colors. NEW CHARACTER: Lyra, a young elf archer girl of the wind. Long pointed elf ears, bright emerald-green eyes, a calm focused expression with a small confident smile. Long chestnut-copper hair with a few strands framing her face, gathered into one long thick braid that swings behind her back, tied with a jade ribbon; a white hawk feather and a small gold leaf clip tucked behind one ear. A short jade-green hooded capelet (hood down) whose edge is trimmed with white feathers like small wings on her shoulders, a white tunic with gold wind-swirl embroidery, a brown leather corset belt with a gold buckle, a short jade skirt with two long flowing pale-mint sash tails at the waist, dark shorts, a leather bracer and archer glove on her near arm, tall brown leather boots with gold toe caps and tiny feather wings at the ankles, a brown leather quiver on her back full of arrows with white-and-jade feather fletching. Her weapon: a large elegant recurve bow shaped like a pair of spread eagle wings — white and gold limbs carved like feathers, jade feather tips, a round jade gem at the grip, a thin silver bowstring — held vertically in her FAR hand. Three-quarter side view facing RIGHT, full body, standing in a calm alert pose, both legs visible. Transparent background, no ground shadow, no text.
```

### 01b-portrait-v3.png (1024×1536, nền trong suốt) — ảnh màn chọn đội (tuỳ chọn)
Đính kèm `01-character-v3.png` vừa tạo.
```
Chibi 2D game character art, the SAME character as the attached image (Lyra, young elf archer girl with long pointed ears, a long chestnut-copper braid with a white hawk feather, emerald eyes, jade-green feather-trimmed capelet, white tunic with gold wind swirls, pale-mint sash tails, white-and-gold eagle-wing bow). Dynamic pose: drawing her bow at full draw aiming to the right, one knee slightly bent, a single arrow on the string, the braid, capelet and sash tails flowing in a strong wind. Full body, transparent background, no text.
```

**Mô tả dán vào chỗ `<...>` của đoạn prompt chung sprite** (dùng cho mọi tấm dưới):
```
Lyra, a chibi young elf archer girl with long pointed ears, emerald eyes, a long chestnut-copper braid with a white hawk feather, a jade-green capelet trimmed with white feathers, a white tunic with gold wind swirls, two long pale-mint sash tails, tall brown boots, and a large white-and-gold recurve bow shaped like spread eagle wings
```

**Đoạn luật cung tên** (dán ngay SAU đoạn chung sprite, ở MỌI tấm — AI hay vẽ sai dây cung):
```
ARCHERY RULES: the bow is always held in her FAR hand (the hand farther from the viewer) and the string is pulled with her NEAR hand. The bowstring is ONE thin silver line running straight from the top tip to the bottom tip of the bow; when she draws, it forms a sharp V to her fingers. When the string is drawn, exactly one arrow lies on it, pointing where she aims. In a release frame the string is straight again and there is NO arrow (the game draws the flying arrow). Never draw a second bow, a broken string, or arrows flying in the air.
```

## 1. Bảng động tác (9 tấm)

Mọi tấm 1536×1024, nền xanh #00FF00 (hoặc trong suốt), lưới 4×2. **Khung chính** = khung trùng mốc gây sát thương của server.

| # | File | Động tác (dùng khi) | Khung | Khung chính | Ưu tiên |
|---|---|---|---|---|---|
| 1 | `sprite-idle.png` | hàng trên: đứng thường · hàng dưới: thủ thế trong trận (tên đặt sẵn trên dây) | 4 + 4 | — | ★★★ làm ĐẦU TIÊN |
| 2 | `sprite-attack.png` | đánh thường: kéo cung → nhả tên → rút tên mới | 8 | **khung 5** @0,2s | ★★★ |
| 3 | `sprite-move.png` | chạy nhẹ nhàng kiểu tiên tộc | 8 lặp | — | ★★★ |
| 4 | `sprite-hurt-stun.png` | trúng đòn · choáng | 4 + 4 | — | ★★★ |
| 5 | `sprite-snipe.png` | **Tiễn Gió Chớp** (KN1): bật nhảy lùi, bắn giữa không trung | 8 | **khung 6** @0,42s | ★★★ |
| 6 | `sprite-call-land.png` | hàng trên: **Thần Phong Giáng Thế** (KN2) giơ cung gọi gió → bay lên · hàng dưới: rơi vào trận → đáp đất | 4 + 4 | gọi gió: **khung 3** @0,38s | ★★ |
| 7 | `sprite-charge-release.png` | **Thần Tiễn Phá Thiên** (KN3): hàng trên: gồng cung · hàng dưới: nhả | 4 + 4 | gồng: khung 3–4 giữ suốt 2s niệm · nhả: **khung 6** @0,16s | ★★★ |
| 8 | `sprite-hover.png` | bay lơ lửng suốt Thần Phong (8s): hàng trên: bay chờ · hàng dưới: bắn khi đang bay | 4 + 4 | bắn: **khung 7** @0,2s | ★★ |
| 9 | `sprite-dead-victory.png` | gục · thắng | 4 + 4 | gục: giữ khung 4 · thắng: giữ khung 7–8 | ★ |

**Game tự vẽ** (tranh ở `art/lyra/fx2/` + `art/common/`): mũi tên đang bay, Vệ Thần Gió, gió xoáy, vòng gió dưới chân, mũi tên ánh sáng sau lưng, loé trúng, bụi, sao choáng. Ở đây chỉ vẽ Lyra.

**Mũi tên trên dây:**
- Khung kéo dây: vẽ **1 mũi tên** nằm trên dây.
- Khung nhả (khung chính): dây bật thẳng, **không vẽ mũi tên** (mũi tên đang bay do game vẽ).

**Khung trên không** (nhảy, bay, rơi): vẽ trong ô như các khung khác. Game tự nhấc Lyra lên cao và dời ra sau.

**Tấm 8 (bay):** chưa có thì game dùng khung đứng nâng lên như bản cũ, nên làm sau cùng cũng được.

## 2. Cách tạo
1. **Tấm 1 (`sprite-idle`):** đính kèm `art/lyra/01-character-v3.png` + `art/rok/sprite/sprite-idle.png` (chỉ lấy cỡ / nét).
2. **Tấm 2–9:** đính kèm `art/lyra/01-character-v3.png` + `sprite-idle.png` **của Lyra** vừa tạo.
3. Dán **đoạn chung sprite** (mục 5 của hướng dẫn) với mô tả ở mục 0, rồi **đoạn luật cung tên**, rồi **đoạn riêng** dưới đây.

## 3. Đoạn riêng từng tấm

### 1 · sprite-idle.png
```
TOP ROW, frames 1-4 = RELAXED STANDING (out of combat): standing upright and relaxed, the bow held lowered and vertical at her side in her far hand, the near hand resting lightly on her belt, no arrow on the string, calm gentle smile, four almost identical frames with only a tiny breathing difference (chest and shoulders rise slightly), braid and sash tails hanging down.
BOTTOM ROW, frames 5-8 = COMBAT READY STANCE: feet apart, knees slightly bent, the bow raised in front of her body and held vertically in her far hand, one arrow already resting on the string held loosely by the near hand (string NOT pulled), eyes focused on the enemy to the right, four almost identical frames with only a tiny breathing difference.
```

### 2 · sprite-attack.png — khung 5 = nhả tên
```
ANIMATION: BOW SHOT, 8 frames. Frame 1: combat ready stance, an arrow resting on the relaxed string. Frame 2: raising the bow forward to shoulder height, starting to pull the string. Frame 3: pulling the string halfway, the bow arm extending toward the right. Frame 4: FULL DRAW — the bow arm perfectly straight toward the right, the string pulled back to her cheek in a sharp V, the arrow aimed straight to the right, one eye narrowed, braid swinging. Frame 5: KEY FRAME — RELEASE: the fingers just opened, the string snapped back straight, the bow kicked slightly forward, the near hand flicked back past her ear, NO arrow (it has just left). Frame 6: follow-through, holding the release pose, sash tails fluttering. Frame 7: reaching back over her shoulder with the near hand to pull a new arrow from the quiver, bow lowered a little. Frame 8: placing the new arrow on the string — back to the combat ready stance.
```

### 3 · sprite-move.png — chạy lặp
```
ANIMATION: LIGHT ELF RUN CYCLE, 8 frames, seamless loop (frame 8 flows back into frame 1). Quick graceful light steps on the balls of her feet, the upper body leaning slightly forward, the bow held low and forward in her far hand, the near arm swinging, the braid and the sash tails streaming back. Frame 1: near leg forward, heel down. Frame 2: down position, knees bent. Frame 3: passing position. Frame 4: up position, pushing off. Frame 5: far leg forward, heel down. Frame 6: down position. Frame 7: passing position. Frame 8: up position.
```

### 4 · sprite-hurt-stun.png — trúng đòn + choáng
```
TOP ROW = ANIMATION 1, HURT, 4 frames: Frame 1: combat ready stance. Frame 2: just got hit — flinches backward, head snapped back, eyes squeezed shut, gritted teeth, the bow pulled close to her body. Frame 3: skids half a step back, braid and sash tails swinging forward. Frame 4: recovering, almost back to the ready stance, determined frown.
BOTTOM ROW = ANIMATION 2, STUNNED (seamless loop), 4 frames: dazed swirly eyes, mouth slightly open, the bow hanging loosely from her far hand, knees wobbly, elf ears drooping a little. Frame 5: swaying to the left. Frame 6: back to center. Frame 7: swaying to the right. Frame 8: back to center. No stars or symbols.
```

### 5 · sprite-snipe.png — Tiễn Gió Chớp, khung 6 = nhả tên
```
ANIMATION: BACKWARD LEAP SHOT, 8 frames (every frame drawn in its own cell like the others; the game itself moves her up and backward). Frame 1: combat ready stance. Frame 2: crouching low to jump, knees deeply bent, gathering power, eyes fierce. Frame 3: leaping backward into the air (away from the enemy on the right), body arching back gracefully, legs together, the bow held up, braid and sash tails flying upward. Frame 4: at the top of the leap, body turning to face the right, legs tucked under her, starting to draw the bow. Frame 5: still in the air, FULL DRAW aiming slightly DOWNWARD to the right, the string pulled to her cheek with one arrow, legs bent under her, sash tails floating. Frame 6: KEY FRAME — RELEASE in mid-air: the string snapped straight, the bow kicked, the near hand flung back, body recoiling slightly backward, NO arrow. Frame 7: landing on her toes in a low crouch, the near hand touching the ground for balance, skidding back. Frame 8: rising back to the combat ready stance.
```

### 6 · sprite-call-land.png — gọi gió (hàng trên) + rơi vào trận (hàng dưới)
```
TOP ROW = ANIMATION 1, CALLING THE WIND, 4 frames: Frame 1: combat ready stance. Frame 2: lifting the bow high above her head in the far hand, the near arm spreading out to the side, looking up. Frame 3: KEY FRAME — the bow raised straight up toward the sky, both arms open wide, face lifted, rising onto her toes, her braid, capelet and sash tails blown UPWARD by a strong updraft (the game adds the wind). Frame 4: floating just above the ground, toes pointed down, legs together, the bow lowered to the ready position in front of her, hair and sash tails still lifted (she starts to fly).
BOTTOM ROW = ANIMATION 2, ENTRANCE LANDING, 4 frames: Frame 5: falling from the sky, body upright, knees bent, arms out for balance, braid and sash tails blown upward. Frame 6: touchdown in a low crouch, one hand on the ground, the bow held out to the side. Frame 7: rising from the crouch. Frame 8: confident combat ready stance.
```

### 7 · sprite-charge-release.png — gồng Thần Tiễn (hàng trên) + nhả (hàng dưới)
```
TOP ROW = ANIMATION 1, POWER DRAW (held for 2 seconds), 4 frames: Frame 1: a wide strong stance, raising the bow with one arrow on the string, aiming toward the UPPER RIGHT (about 30 degrees above horizontal). Frame 2: pulling the string back hard, the back leg braced, the bow starting to bend. Frame 3: FULL POWER DRAW — the string pulled all the way past her cheek, the bow bent deeply, body leaning back, still aiming 30 degrees upward to the right, fierce determined eyes, hair, braid, capelet and sash tails blown back and up by a strong wind. Frame 4: almost identical to frame 3 with a tiny tremble (used for a steady hold loop).
BOTTOM ROW = ANIMATION 2, RELEASE, 4 frames: Frame 5: the same full power draw as frame 3. Frame 6: KEY FRAME — RELEASE: the string snapped straight, the bow kicked upward, the near hand flung far back, body recoiling, hair and sash tails whipping forward, NO arrow. Frame 7: follow-through, recovering, lowering the bow. Frame 8: back to the combat ready stance with a new arrow on the string.
```

### 8 · sprite-hover.png — bay chờ (hàng trên) + bắn khi bay (hàng dưới)
```
All 8 frames show her FLYING, floating on the wind (drawn in the cell like the other frames; the game lifts her into the air): legs together and slightly bent, toes pointed down, feet NOT touching anything, the capelet, braid and sash tails floating and fluttering upward and backward as if in a gentle updraft.
TOP ROW = ANIMATION 1, HOVER (seamless loop), 4 frames: the bow held ready in front of her body with one arrow resting on the relaxed string, calm focused eyes; the four frames form a gentle bobbing loop (frame 2 a little higher, frame 4 a little lower), only the hair, sash tails and feet move slightly.
BOTTOM ROW = ANIMATION 2, HOVER SHOT, 4 frames: Frame 5: floating, raising the bow and starting to draw. Frame 6: full draw aiming straight to the right, the string at her cheek. Frame 7: KEY FRAME — RELEASE: the string snapped straight, the near hand flicked back, NO arrow. Frame 8: back to the hover pose with a new arrow on the string.
```

### 9 · sprite-dead-victory.png — gục (hàng trên) + thắng (hàng dưới)
```
TOP ROW = ANIMATION 1, DEFEAT, 4 frames: Frame 1: hit hard, staggering backward, eyes squeezed shut. Frame 2: knees buckling, falling backward, the bow slipping from her hand. Frame 3: falling, almost on the ground. Frame 4: lying flat on her back on the ground, eyes closed, the bow lying beside her (final frame, held).
BOTTOM ROW = ANIMATION 2, VICTORY, 4 frames: Frame 5: a light happy hop, big smile. Frame 6: twirling the bow in her far hand, playful grin. Frame 7: proud victory pose: the bow raised high overhead in the far hand, the near hand giving a cheerful wave, a wink, braid and sash tails flowing. Frame 8: almost identical to frame 7 with a tiny change (breathing loop).
```

## 4. Mình làm khi nhận tấm
- **Ráp:** tách nền, căn chân, chỉnh cỡ (như Rok, Jessica).
- **Điểm gắn `bow`** (chỗ mũi tên bay ra) ở khung nhả: đánh thường khung 5, Tiễn Gió Chớp khung 6, bắn khi bay khung 7. Mũi tên bay ra đúng chỗ dây cung trên tranh.
- **Tiễn Gió Chớp:** đường nhảy lùi 3 đơn vị, cao 1,7 trong 0,62s giữ nguyên. Tranh không vẽ vòng lộn nên không cần tắt xoay.
- **Thần Phong (8s):** Lyra bay lên như cũ; lúc bay dùng tấm 8 (bay chờ + bắn khi bay) thay khung đứng.
- **Thần Tiễn:** gồng giữ khung 3–4 suốt 2s niệm; bị choáng thì thả.
- **Gửi duyệt:** video từng động tác (`tools/test-sprite.html?char=archer`). Khung nào hỏng mình báo số khung để tạo lại.
- **Bản khung xương cũ:** vẫn xem được bằng `?lyra=cutout`.
