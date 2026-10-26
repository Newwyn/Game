# ICON KỸ NĂNG — cả đội (11 tấm, 66 icon)

Icon hình ảnh cho **mọi kỹ năng + thiên phú + đánh thường** của 9 nhân vật và Golem. Dùng ngay cho **nút kỹ năng trong trận** (thẻ nhân vật dưới màn hình), sau này dùng chung cho mọi tính năng khác (bảng thông tin kỹ năng, thiên phú, nâng cấp, cửa hàng...).

## 1. Quy cách chung

- **1 tấm = 6 icon**, canvas **1536×1024**, lưới **3 cột × 2 hàng**, mỗi ô **512×512**, đánh số 1–6 từ trái sang phải, trên xuống dưới.
- Mỗi icon là **1 hình vuông vẽ kín** (~448×448, bo góc nhẹ) nằm giữa ô; **ngoài hình vuông trong suốt** (hoặc đen thuần nếu không xuất được trong suốt).
- **Không khung viền** quanh icon (game tự vẽ khung, vòng hồi chiêu, viền màu theo nhân vật), không chữ, không số.
- **1 hình chính to, rõ, ở giữa**: thu nhỏ còn 48×48 (cỡ nút trong trận) vẫn nhận ra.
- 6 icon trong 1 tấm cùng ánh sáng, cùng độ chi tiết, cùng độ rực để cả bộ đồng đều; màu chủ đạo theo màu nhân vật / nguyên tố.
- **Đính kèm mỗi lần tạo:** ảnh tạo hình nhân vật (`art/<tên>/01-character-v3.png`, Ignar: `art/ignar/01-character.png`) + 1 tấm hiệu ứng của nhân vật đó (ghi ở từng tấm) để icon khớp màu, khớp phép trong game.
- **Lưu tên:** `art/icons/icons-<tên>.png` (ghi ở từng tấm).

### Đoạn prompt chung (dán ĐẦU mỗi prompt)
```
Game skill ICON sheet in the same polished 2D anime game art style as the attached character reference (crisp clean line art, soft cel shading, rich saturated colors, bright glowing magic). Use the attached effect sheet only for the look and colors of the magic. Canvas 1536x1024 with a genuine TRANSPARENT background. The canvas is an invisible grid of 3 columns x 2 rows = 6 equal square cells of 512x512 pixels, read left to right, top row then bottom row. In each cell draw exactly ONE skill icon: a SQUARE painted icon about 448x448 pixels centered in its cell, slightly rounded corners, the inside of the square fully painted with a dark vignette background tinted by the icon's main color. Leave transparent empty space around each square: squares never touch each other or the canvas edge. Each icon shows ONE bold, instantly readable focal subject, large and centered, readable even when shrunk to 48x48 pixels: strong silhouette, high contrast, glowing highlights. NO frame or border around the icons (the game draws its own frame), no text, no letters, no numbers, no UI elements, no watermark. All 6 icons share the same lighting, level of detail and color saturation so the set looks unified. Do not draw the full character in the icons unless asked; hands, weapons and silhouettes are fine.
```

## 2. Từng tấm

### Tấm 1 · `icons-jessica.png` — Jessica (Lôi Ám) · đính kèm `art/jessica/01-character-v3.png` + `art/jessica/fx2/fx-thunder-slash.png`
| Ô | Dùng cho |
|---|---|
| 1 | KN1 Phóng Bùa |
| 2 | KN2 Đột Kích |
| 3 | KN3 Tàng Hình |
| 4 | Thiên phú 1 Đánh Lén |
| 5 | Thiên phú 2 Sát Ý |
| 6 | Đánh thường |
```
Palette: deep violet, black, silver, crackling purple lightning. 1 TALISMAN THROW: a paper talisman charm marked with a glowing violet lightning seal flying diagonally, a small kunai pinned through it, violet sparks trailing. 2 SHADOW RAID: a long crescent slash of a violet-glowing dagger streaking across the icon through swirling purple smoke, with faint afterimages of the blade. 3 STEALTH: a ninja hand seal (two fingers raised) in front of a dark purple smoke cloud, two glowing violet eyes in the smoke, thin purple lightning around. 4 BACKSTAB: a dagger stabbing out of a dark shadow toward a bright red critical spark, the shadow hiding the attacker. 5 KILLING INTENT: a menacing glowing violet eye with a blood-red aura and a dagger's reflection across the pupil. 6 BASIC ATTACK: two crossed silver daggers wrapped in violet lightning.
```

### Tấm 2 · `icons-rok.png` — Rok (Thiết Hộ) · đính kèm `art/rok/01-character-v3.png` + `art/rok/fx2/fx-lion.png`
| Ô | Dùng cho |
|---|---|
| 1 | KN1 Sư Tử Gầm |
| 2 | KN2 Đẩy Khiên |
| 3 | KN3 Dựng Khiên |
| 4 | Thiên phú 1 Ý Chí Thép |
| 5 | Thiên phú 2 Kiên Cường |
| 6 | Đánh thường |
```
Palette: royal blue, polished silver, warm gold, golden light. 1 LION ROAR: the head of a golden lion spirit roaring forward, mane of golden light, circular sound-wave rings bursting from its mouth. 2 SHIELD BASH: a blue-and-gold lion-crest knight shield slamming forward, a white impact burst and speed lines in front of it. 3 RAISE GUARD: a golden guardian angel spirit holding a huge shield above a translucent hexagonal golden dome. 4 IRON WILL: a glowing golden chain of light binding a knight shield and a sword together, a small heart of light at the link. 5 TENACITY: a battered dented knight shield with cracks, still standing firm and glowing gold from inside, sparks bouncing off it. 6 BASIC ATTACK: a silver longsword cutting a bright steel arc.
```

### Tấm 3 · `icons-lyra.png` — Lyra (Phong Tiễn) · đính kèm `art/lyra/01-character-v3.png` + `art/lyra/fx2/fx-wind-spirit.png`
| Ô | Dùng cho |
|---|---|
| 1 | KN1 Tiễn Gió Chớp |
| 2 | KN2 Thần Phong Giáng Thế |
| 3 | KN3 Thần Tiễn Phá Thiên |
| 4 | Thiên phú 1 Phong Tiễn |
| 5 | Thiên phú 2 Ưng Nhãn |
| 6 | Đánh thường |
```
Palette: jade green, white feathers, gold, pale wind swirls. 1 SWIFT WIND ARROW: a sharp white-feathered arrow flying fast, wrapped in a tight green wind spiral, leaves whipping behind it. 2 WIND SPIRIT DESCENT: a graceful wind spirit with huge jade-green feathered wings spread wide, glowing, wind swirling around it. 3 HEAVEN-PIERCING ARROWS: six glowing green arrows fanned out in an arc, launching upward like missiles with bright trails. 4 PIERCING GALE: one wind arrow piercing straight through three dark target silhouettes in a row, a spiral of wind along its path. 5 HAWK EYE: the sharp golden eye of a hawk with a subtle aiming reticle of wind around the pupil. 6 BASIC ATTACK: a white-feathered elven bow fully drawn with a green arrow nocked.
```

### Tấm 4 · `icons-seraphine.png` — Seraphine (Thánh Quang) · đính kèm `art/seraphine/01-character-v3.png` + `art/seraphine/fx2/fx-heal-shield.png`
| Ô | Dùng cho |
|---|---|
| 1 | KN1 Thánh Quang Trị Liệu |
| 2 | KN2 Khiên Ánh Sáng |
| 3 | KN3 Thánh Niệm |
| 4 | Thiên phú 1 Ân Điển |
| 5 | Thiên phú 2 Thiên Thần Hộ Mệnh |
| 6 | Đánh thường |
```
Palette: warm gold, soft pink, ivory white, holy light. 1 HOLY HEAL: a beam of golden light shining down onto a glowing heart of light, sparkles and small feathers around. 2 LIGHT SHIELD: a translucent golden bubble shield with two small angel wings on its sides, gleaming. 3 HOLY PRAYER: two hands joined in prayer under a radiant sun halo, a tall guardian of light faintly behind. 4 GRACE: a glowing white lily flower releasing a golden droplet of grace, soft sparkles. 5 GUARDIAN ANGEL: a small cherub angel holding a glowing feather, a ring of reviving light behind it. 6 BASIC ATTACK: the top of a golden sun staff releasing a small orb of holy light.
```

### Tấm 5 · `icons-ignar.png` — Ignar (Hỏa Ngục) · đính kèm `art/ignar/01-character.png` + `art/ignar/fx2/fx-meteor.png`
| Ô | Dùng cho |
|---|---|
| 1 | KN1 Thiên Hỏa Cầu |
| 2 | KN2 Cột Lửa Phá Ma |
| 3 | KN3 Hỏa Thần Giáng Lâm |
| 4 | Thiên phú 1 Thiên Hỏa Song Tinh |
| 5 | Thiên phú 2 Hỏa Tốc |
| 6 | Đánh thường |
```
Palette: crimson red, molten orange, gold sparks, charcoal smoke. 1 SKY FIREBALL: a huge blazing fireball falling diagonally from the sky with a long fire tail. 2 DEMON-BREAKING FIRE PILLAR: several pillars of roaring fire erupting upward from a glowing red magic circle on the ground. 3 FIRE GOD DESCENDS: a towering fire god silhouette made of flames with a crown of fire and burning eyes. 4 TWIN METEORS: two fireballs falling side by side, the second one slightly smaller. 5 FIRE HASTE: a shield made of flames with fast orange speed streaks sweeping past it. 6 BASIC ATTACK: an open palm holding a swirling fireball.
```

### Tấm 6 · `icons-zerith.png` — Zerith (U Minh) · đính kèm `art/zerith/01-character-v3.png` + `art/zerith/fx2/fx-phantom-scythe.png`
| Ô | Dùng cho |
|---|---|
| 1 | KN1 Lưỡi Hái Xuyên Hồn |
| 2 | KN2 Lưỡi Hái Hất Hồn |
| 3 | KN3 Đêm Tử Thần |
| 4 | Thiên phú 1 Phán Quyết Tử Thần |
| 5 | Thiên phú 2 Linh Hồn Báo Thù |
| 6 | Đánh thường |
```
Palette: black, blood crimson, bone white, ghostly red mist. 1 SOUL-PIERCING SCYTHE: a black scythe dashing horizontally, leaving a long crimson slash trail and dark motion streaks. 2 SOUL-LIFTING SCYTHE: a giant phantom crimson scythe sweeping upward, flinging ghostly souls into the air. 3 NIGHT OF DEATH: a hooded death guardian with glowing red eyes in front of a huge crimson moon. 4 DEATH JUDGMENT: a glowing crimson skull sigil (death mark) with thin chains around it. 5 AVENGING SOUL: a ghostly reaper spirit with a scythe rising from red mist, eyes burning. 6 BASIC ATTACK: a crimson scythe slash in an X shape.
```

### Tấm 7 · `icons-brakk.png` — Brakk (Cuồng Đấu) · đính kèm `art/brakk/01-character-v3.png` + `art/brakk/fx2/fx-giant.png`
| Ô | Dùng cho |
|---|---|
| 1 | KN1 Bá Vương Quật |
| 2 | KN2 Chấn Địa |
| 3 | KN3 Thần Lực Khổng Lồ |
| 4 | Thiên phú 1 Khí Thế Đấu Trường |
| 5 | Thiên phú 2 Long Huyết Bất Khuất |
| 6 | Đánh thường |
```
Palette: bronze, brown stone, molten lava orange, amber glow (no red). 1 OVERLORD SLAM: a huge bandaged fist slamming down into lava-cracked ground, rocks and lava splashing up. 2 EARTHQUAKE STOMP: a heavy boot stomping the ground, a shockwave ring spreading and jagged rock spikes bursting up. 3 GIANT DIVINE STRENGTH: a huge earth dragon made of bronze rock plates and lava coiling upward, roaring, amber light. 4 ARENA SPIRIT: a roaring stone dragon head with curved amber sound-wave arcs bursting from its mouth. 5 INDOMITABLE DRAGON BLOOD: a glowing lava dragon heart wrapped in bronze dragon scales, embers rising. 6 BASIC ATTACK: a bandaged fist punching forward with lava sparks and a small shockwave.
```

### Tấm 8 · `icons-nerissa.png` — Nerissa (Thủy Vũ) · đính kèm `art/nerissa/01-character-v3.png` + `art/nerissa/fx2/fx-dance.png`
| Ô | Dùng cho |
|---|---|
| 1 | KN1 Vũ Khúc Sóng Triều |
| 2 | KN2 Lưu Thủy Hồi Xuân |
| 3 | KN3 Thủy Thần Vũ |
| 4 | Thiên phú 1 Hòa Âm Thủy Vũ |
| 5 | Thiên phú 2 Triều Dâng |
| 6 | Đánh thường |
```
Palette: ocean blue, aqua cyan, white foam, pearl and gold. 1 TIDE DANCE: a swirling ring of tidal waves with a flowing aqua silk ribbon spiraling through it. 2 FLOWING SPRING: a blooming lotus flower floating on water, healing droplets and sparkles rising. 3 WATER GODDESS DANCE: a graceful water goddess silhouette rising from waves, flowing silk and water veils around her. 4 WATER HARMONY: three music notes made of clear water swirling together in a circle. 5 RISING TIDE: a tall cresting wave carrying a glowing blue orb at its peak. 6 BASIC ATTACK: an aqua silk ribbon flicking forward, shooting a stream of water droplets.
```

### Tấm 9 · `icons-elarion-1.png` — Elarion (Tam Nguyên) · đính kèm `art/elarion/01-character-v3.png` + `art/elarion/fx2/fx-book-ward.png`
| Ô | Dùng cho |
|---|---|
| 1 | KN1 Sách Nguyên Tố |
| 2 | KN3 Bão Nguyên Tố |
| 3 | Thiên phú 1 Cộng Hưởng Nguyên Tố |
| 4 | Thiên phú 2 Thiên Tài Nguyên Tố |
| 5 | Đánh thường |
| 6 | Phép Nguyên Tố Hợp Nhất (gọi Golem) |
```
Palette: midnight blue, antique gold, ember orange, ice cyan, storm violet. 1 BOOK OF ELEMENTS: the thick ancient bronze tome with gold corners floating open, three small orbs rising from its pages: ember orange, ice cyan, storm violet. 2 ELEMENTAL STORM: a swirling cyclone of three intertwined ribbons: orange flame, cyan frost with snowflakes, violet lightning. 3 ELEMENTAL RESONANCE: three faceted gems (orange ruby, cyan aquamarine, violet amethyst) orbiting each other, linked by glowing resonance rings. 4 ELEMENTAL GENIUS: a golden rune circle with a bright star of insight at its center and tiny runes of fire, ice and lightning around. 5 BASIC ATTACK: an open palm releasing a bright tri-color elemental bolt. 6 ELEMENTAL FUSION: the head and raised fist of a basalt rock golem with orange, cyan and violet crystals, rising from a three-color magic circle.
```

### Tấm 10 · `icons-elarion-2.png` — 6 phép Elarion · đính kèm `art/elarion/01-character-v3.png` + `art/elarion/fx2/fx-meteor-frost.png`
| Ô | Dùng cho |
|---|---|
| 1 | 🔥🔥🔥 Thiên Thạch |
| 2 | ❄️❄️❄️ Băng Phong |
| 3 | ⚡⚡⚡ Lôi Xích |
| 4 | ❄️❄️⚡ Giáp Băng Sét |
| 5 | ⚡⚡❄️ Lốc Xoáy |
| 6 | 🔥🔥❄️ Hơi Nước Bỏng |
```
Palette: midnight blue background tones with ember orange, ice cyan and storm violet magic. 1 METEOR: a huge molten boulder meteor crashing down at an angle and starting to roll, a trail of fire behind it. 2 FROST SEAL: a giant faceted cyan ice block falling from the sky onto the ground, cracks and frost mist bursting out. 3 CHAIN LIGHTNING: a violet lightning bolt jumping in a zigzag chain between three glowing points. 4 ICE-LIGHTNING WARD: a translucent dome of cyan ice-crystal hexagons with violet lightning veins crackling over it. 5 TORNADO: a tall grey-violet tornado funnel with violet lightning flashing inside, debris swirling at its base. 6 SCALDING STEAM: a dark storm cloud pouring warm rain, one violet lightning bolt striking down, steam rising.
```

### Tấm 11 · `icons-elarion-3.png` — 4 phép Elarion + 3 kỹ năng Golem (Golem dùng 2 ô cuối + ô 6 tấm 9) · đính kèm `art/elarion/sprite/golem-fire-frost.png` + `art/elarion/fx2/fx-orb-tornado.png`
| Ô | Dùng cho |
|---|---|
| 1 | 🔥🔥⚡ Hỏa Lôi Cầu |
| 2 | ❄️❄️🔥 Băng Hoại Hỏa Thiên |
| 3 | ⚡⚡🔥 Tốc Lôi |
| 4 | Golem — Nộ Lửa |
| 5 | Golem — Bão Tuyết |
| 6 | Golem — Hào Quang Sét |
```
Palette: midnight blue background tones with ember orange, ice cyan and storm violet magic; the golem is dark basalt rock with glowing lava cracks and crystals. 1 FIRE-LIGHTNING ORB: a giant swirling orb of orange fire and molten rock wrapped in crackling violet lightning, white-hot core. 2 ICE-FIRE BEAM: two open palms pushing forward a huge beam with an icy cyan outer shell and a blazing orange fire core. 3 LIGHTNING HASTE: a violet lightning bolt wrapped around a double palm strike, speed streaks behind. 4 GOLEM FIRE FURY: a huge basalt rock fist with lava cracks, engulfed in roaring fire, rushing forward like a comet. 5 GOLEM BLIZZARD: the open mouth of a basalt rock golem breathing a wide cone of icy blizzard and snowflakes. 6 GOLEM LIGHTNING AURA: two raised basalt rock fists struck by a bolt of violet lightning from above, sparks bursting.
```

## 3. Thứ tự nên làm
Tấm 9 → 10 → 11 (Elarion, nhân vật đặc biệt) → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Xong tấm nào gửi tấm đó.

## 4. Sửa khi AI vẽ sai
- **1 icon sai:** `Keep everything identical, only redraw icon 4 so that ...`
- **Có khung viền / chữ:** `Remove all frames, borders, text and letters; keep only the painted square icons`
- **Icon dính nhau:** `Keep transparent empty space between all six square icons`
- **Hình chính quá nhỏ / rối:** `Make the main subject of icon 2 bigger and simpler, filling the square`

## 5. Mình làm khi nhận tấm
- Cắt 6 ô → tìm đúng hình vuông → `src/assets/icons/skills/` (WebP, 2 cỡ cho nút trong trận và bảng thông tin), giữ nguyên tranh.
- **Bảng icon dùng chung** (`src/ui/skillIcons.js`): mã nhân vật + số kỹ năng / thiên phú / phép Elarion → icon. Mọi tính năng sau này lấy icon từ bảng này.
- Nút kỹ năng trong trận: icon bên trái tên kỹ năng, phủ vòng hồi chiêu; nút KN2 của Elarion đổi icon theo phép vừa ghép.
