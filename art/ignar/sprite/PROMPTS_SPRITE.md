# Ignar kiểu SPRITE — bộ tấm đầy đủ cho mọi động tác

Đã có, đang chạy trong game:
- `sprite-idle.png`: đứng.
- `sprite-attack.png`: đánh thường. Tấm này tạm dùng chung cho mọi kỹ năng.

Còn **8 tấm**. Tấm nào xong thì gửi vào chat như lần trước, mình ráp ngay, không cần chờ đủ.

## 1. Bảng động tác

Mọi tấm 1536×1024, lưới 4×2 = 8 khung, đọc trái → phải, hàng trên rồi hàng dưới.

- **Khung chính** = khung trùng đúng mốc ra đòn của game.
- Mình tự trải các khung trước và sau cho khớp mốc. Bạn chỉ cần vẽ đúng thứ tự.
- Ưu tiên: ★★★ = làm trước.

| # | File | Động tác (dùng khi) | Khung | Khung chính / ghi chú | Ưu tiên |
|---|---|---|---|---|---|
| 1 | `sprite-move.png` | Chạy (di chuyển trong trận) | 8, lặp | vòng chạy 0,52s | ★★★ |
| 2 | `sprite-hurt-stun.png` | Hàng trên: trúng đòn · Hàng dưới: choáng | 4 + 4 | trúng đòn 0,4s · choáng lặp, sao do game vẽ | ★★★ |
| 3 | `sprite-summon.png` | Thiên Hỏa Cầu (KN1): giơ tay gọi thiên thạch | 8 | **khung 5** = 0,35s | ★★ |
| 4 | `sprite-bolt.png` | Cột Lửa Phá Ma (KN2): chưởng xuống đất | 8 | **khung 4** = 0,25s | ★★ |
| 5 | `sprite-charge-land.png` | Hàng trên: gồng Hỏa Thần (KN3, giữ) · Hàng dưới: rơi vào trận → đáp đất | 4 + 4 | gồng: khung 3–4 rung khi giữ · khung 5 = lúc rơi | ★★ |
| 6 | `sprite-palm.png` | Hỏa Chưởng (đánh thường lúc Hỏa Thần) | 8 | **khung 3** = 0,2s | ★★ |
| 7 | `sprite-volley.png` | Chưởng toàn thể (cứ 3 đòn lúc Hỏa Thần): nhảy lên chưởng | 8 | **khung 4** = 0,3s · độ cao cú nhảy do game | ★★ |
| 8 | `sprite-dead-victory.png` | Hàng trên: gục · Hàng dưới: thắng | 4 + 4 | gục: giữ khung 4 · thắng: giữ khung 7–8 | ★ |

**Game tự vẽ, không cần có trong tranh:**
- lửa trên tay, cầu lửa, thiên thạch, cột lửa, vòng phép;
- hào quang, cánh lửa, Hộ Vệ Thần Lửa, khiên lửa;
- sao choáng, bóng dưới chân, độ cao khi nhảy / rơi.

## 2. Cách tạo (để các tấm khớp nhau)
1. Mỗi tấm tạo trong **1 lần**, đủ 8 khung. Không tạo từng khung riêng.
2. Đính kèm **2 ảnh** mỗi lần:
   - `art/ignar/01-character.png`: thiết kế nhân vật;
   - `art/ignar/sprite/sprite-attack.png`: để AI vẽ **cùng cỡ, cùng nét**. Lần trước tấm attack nhỏ hơn tấm idle khoảng 6,5%.
3. Dán **đoạn chung** (mục 3) rồi dán thêm **đoạn của tấm đó** (mục 4).
4. Lệch 1 khung thì nhắn tiếp: `Keep everything identical, only redraw frame 6 so that ...`.
5. AI không xếp đúng lưới cũng được, miễn mỗi khung **tách rời** và **đúng thứ tự**.

## 3. Đoạn chung (dán ĐẦU mỗi prompt)
```
Sprite sheet for a 2D game. Exactly the same character, outfit, colors and drawing style as the attached images (Ignar, a chibi fire mage): the first image is his character design, the second image is a sprite sheet of him — draw him at the SAME SIZE, SAME proportions and SAME line style as in that sprite sheet. Canvas 1536x1024, a neat grid of 4 columns x 2 rows = 8 equal cells, read left to right, top row then bottom row. ONE full-body frame per cell, same three-quarter side view facing RIGHT, same scale in every frame, the character centered in his cell with his feet near the bottom of the cell, nothing cropped, nothing touching the cell borders. Keep every detail identical between frames: same face, same spiky hair shape, same gold flame patterns, same chains and red gems; only the pose changes. Hands EMPTY: no fire, no fireball, no magic effects, no projectiles (the game adds all effects). Flat pure green #00FF00 background, no ground shadow, no text, no numbers, no grid lines.
```

## 4. Đoạn riêng từng tấm

### 1 · sprite-move.png — chạy (lặp)
```
ANIMATION: RUN CYCLE, 8 frames, seamless loop (frame 8 flows back into frame 1). A light, quick jog of a young mage, body leaning slightly forward, far hand held in front of the chest palm up (empty), near arm swinging naturally. Frame 1: near leg forward, heel touching the ground. Frame 2: down position, both knees bent, body at its lowest. Frame 3: passing position, far leg swinging forward under the body. Frame 4: up position, pushing off, body at its highest. Frame 5: far leg forward, heel touching the ground. Frame 6: down position. Frame 7: passing position, near leg swinging forward. Frame 8: up position. The coat tails, shoulder capelet, hanging chains and spiky hair bounce and trail behind with the motion.
```

### 2 · sprite-hurt-stun.png — trúng đòn (hàng trên) + choáng (hàng dưới)
```
TOP ROW = ANIMATION 1, HURT (hit reaction), 4 frames: Frame 1: calm combat ready stance. Frame 2: just got hit — flinches backward, head snapped back, eyes squeezed shut in pain, gritted teeth, arms pulled in. Frame 3: stumbles half a step back, still recoiling, coat swinging forward. Frame 4: recovering, almost back to the ready stance, frowning.
BOTTOM ROW = ANIMATION 2, STUNNED (dizzy, seamless loop), 4 frames: dazed swirly eyes, mouth slightly open, arms hanging limp, knees wobbly. Frame 5: swaying to the left. Frame 6: back to center. Frame 7: swaying to the right. Frame 8: back to center (flows into frame 5). No stars or symbols (the game adds them).
```

### 3 · sprite-summon.png — Thiên Hỏa Cầu (khung 5 = gọi thiên thạch)
```
ANIMATION: SUMMON A METEOR spell, 8 frames. Frame 1: calm combat ready stance, far hand palm up in front of the chest. Frame 2: angry focused eyes, looks up, the far arm starts rising. Frame 3: far arm rising above the shoulder, body leaning back slightly, near arm reaching forward. Frame 4: anticipation — far arm almost straight up, fingers curling, gathering power. Frame 5: KEY FRAME — the far arm thrust straight up to the sky, fingers spread like a claw, head tilted up, the near arm pointing forward at the enemy, coat, capelet and hair blown upward as if by a strong rising wind. Frame 6: holding the pose, slight overshoot. Frame 7: arm coming down, looking forward. Frame 8: back to the calm ready stance.
```

### 4 · sprite-bolt.png — Cột Lửa Phá Ma (khung 4 = chưởng xuống đất)
```
ANIMATION: FIRE PILLAR spell, 8 frames. Frame 1: calm combat ready stance. Frame 2: the far hand rises high above the head, body stretching up. Frame 3: anticipation at the highest point, far hand above the head, knees starting to bend. Frame 4: KEY FRAME — drops into a deep crouch and SLAMS the open far palm onto the ground in front of him, the near arm thrown back for balance, coat and capelet flaring outward, fierce face. Frame 5: holding the slam, coat settling. Frame 6: still crouched, head up, looking forward. Frame 7: standing back up. Frame 8: back to the calm ready stance.
```

### 5 · sprite-charge-land.png — gồng Hỏa Thần (hàng trên) + rơi vào trận (hàng dưới)
```
TOP ROW = ANIMATION 1, POWERING UP into the Fire God form (held), 4 frames: Frame 1: ready stance, eyes closed, concentrating. Frame 2: drops into a low wide stance, both arms spreading out to the sides with open palms. Frame 3: holding the low power stance, arms spread wide, fierce determined face, hair, capelet and coat lifted upward as if pushed by rising heat. Frame 4: almost identical to frame 3 with a tiny shift (used for a trembling hold loop).
BOTTOM ROW = ANIMATION 2, ENTRANCE LANDING, 4 frames: Frame 5: falling from the sky, body upright, knees slightly bent, arms out to the sides for balance, coat and hair blown upward. Frame 6: touchdown in a deep crouch, one hand touching the ground. Frame 7: rising up from the crouch. Frame 8: confident calm ready stance.
```

### 6 · sprite-palm.png — Hỏa Chưởng (khung 3 = đẩy chưởng)
```
ANIMATION: POWER PALM STRIKE, 8 frames, faster and much stronger than a normal attack. Frame 1: combat ready stance. Frame 2: anticipation — steps into a deep forward lunge, both hands pulled back to the hip. Frame 3: KEY FRAME — explosive TWO-HANDED palm thrust straight forward, both arms fully extended, palms facing forward, deep lunge, coat and capelet blasting backward. Frame 4: holding the thrust with a slight recoil. Frame 5: still holding, coat settling. Frame 6: arms starting to come back. Frame 7: rising out of the lunge. Frame 8: back to the combat ready stance.
```

### 7 · sprite-volley.png — chưởng toàn thể (khung 4 = chưởng giữa không trung)
```
ANIMATION: JUMPING FIRE BLAST, 8 frames. Frame 1: combat ready stance. Frame 2: crouching to jump, knees bent, arms swung down and back. Frame 3: leaping up, knees tucked, both arms raised over the head. Frame 4: KEY FRAME — at the top of the jump, thrusts both open palms forward and downward, body angled forward, coat and capelet flaring up. Frame 5: still in the air, arms extended. Frame 6: falling, legs extending down for the landing. Frame 7: landing in a crouch, knees bent. Frame 8: back to the combat ready stance. Draw every frame at the same size inside its own cell; the game moves him up and down for the jump.
```

### 8 · sprite-dead-victory.png — gục (hàng trên) + thắng (hàng dưới)
```
TOP ROW = ANIMATION 1, DEFEAT, 4 frames: Frame 1: hit hard, staggering backward, eyes squeezed shut. Frame 2: knees buckling, starting to fall backward. Frame 3: falling, almost on the ground. Frame 4: lying flat on his back on the ground, eyes closed, arms loose (final frame, held).
BOTTOM ROW = ANIMATION 2, VICTORY, 4 frames: Frame 5: happy little jump, big smile. Frame 6: punches the far fist straight up to the sky, big grin. Frame 7: proud victory pose, far fist raised high, near hand on the hip, eyes closed with a happy smile. Frame 8: almost identical to frame 7 with a tiny change (used for a breathing loop).
```

## 5. Mình làm gì khi nhận tấm
- Chỉ tách nền xanh, căn chân, chỉnh cỡ cho bằng các tấm khác. Không tô sửa tranh.
- Nối vào đúng động tác, đặt khung chính trùng mốc ra đòn, gắn lửa / hiệu ứng vào đúng tay từng khung.
- Gửi GIF để bạn duyệt. Khung nào hỏng (sai dáng, lệch chi tiết nhiều) mình báo số khung để tạo lại.
