# Prompt vẽ Elarion (Tam Nguyên) + Golem Nguyên Tố — bản 2 (CHIBI)

## Quan trọng: giữ đúng phong cách CHIBI của game
Mọi nhân vật trong game là **chibi**: đầu to (khoảng 1/3 chiều cao, cao khoảng 3 cái đầu), mắt to, tay chân ngắn, trang phục chi tiết.
Tranh Nerissa lần trước bị vẽ người lớn vì prompt thiếu dòng này.
- Khi vẽ **01** và **01b**, đính kèm `art/ignar/01-character.png` làm **ảnh mẫu phong cách**: chỉ lấy nét vẽ và tỉ lệ chibi, không lấy nhân vật.
- Khi vẽ **02, 03, 04**, đính kèm **01 của Elarion** vừa vẽ.
- Khi vẽ **05**, đính kèm `art/brakk/01-character.png` làm mẫu phong cách. Khi vẽ **06**, đính kèm **05** vừa vẽ.
- Khi vẽ các tấm **fx**, đính kèm `art/ignar/fx-a.png` làm mẫu phong cách hiệu ứng.

Lưu tất cả vào **một thư mục** (ví dụ `elarion-all-resources`), đặt đúng tên file như dưới.
- Tấm `fx-*`: **nền đen tuyền**.
- Các tấm còn lại: **nền trong suốt** (không được thì nền trắng trơn).

Dòng phong cách (đã gắn sẵn trong từng prompt):
`Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed outfit and accessories, crisp clean line art, soft cel shading, vibrant saturated colors.`

---

## 01-character.png (1024×1536)
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed outfit and accessories, crisp clean line art, soft cel shading, vibrant saturated colors. The attached image is ONLY a style reference — draw a completely NEW character. Character: Elarion, a young male elf elemental mage, strict side view (profile) facing RIGHT, full body, standing in a relaxed ready pose, both arms slightly away from the body so each arm is clearly visible. Silver-white hair, long pointed elf ears, calm confident face, amber eyes. Outfit: high-collared dark navy mage coat with gold trim and small accents of ruby red, icy cyan and violet, split coat tails at the back, dark trousers, short boots. No weapon. A thick spellbook (the Book of Elements) floats beside his front hand: dark leather cover, gold corners, three gem sockets (ruby red, icy cyan, violet). Transparent background, no ground shadow, no text.
```

## 01b-character-cast.png (1024×1536) — ảnh chân dung
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height, large expressive anime eyes, short arms and legs, highly detailed outfit, crisp clean line art, soft cel shading, vibrant colors. Same character as the attached Elarion image, dynamic spell-casting pose, one hand raised with swirling red, cyan and violet elemental energy, the Book of Elements floating open with pages fluttering. Full body, transparent background, no text.
```

## 02-body-parts.png (1536×1024)
```
Chibi 2D game art, same character, same chibi proportions and colors as the attached reference. Character parts sheet for 2D cutout skeletal animation (Spine style). Strict side view facing RIGHT. Every part drawn separately with generous empty space between parts, nothing overlapping, nothing cropped. Every joint end is drawn as a full ROUNDED cap (circular end) so parts can rotate without gaps. Parts: (1) big chibi head with front bangs and pointed ear, short neck stub with round bottom, without back hair; (2) back hair as a separate piece; (3) torso: coat upper body from collar to hips, NO arms, NO legs, NO coat tails, rounded shoulders and rounded hip bottom; (4) back coat tail panel; (5) front coat tail panel; (6) upper arm with sleeve, near side; (7) upper arm with sleeve, far side; (8) forearm with wide sleeve cuff, near side, open at the wrist; (9) forearm with wide sleeve cuff, far side; (10) thigh near; (11) thigh far; (12) shin with boot near, foot pointing right; (13) shin with boot far. Arrange in neat rows. Flat even lighting, transparent background, no text, no labels, no numbers.
```

## 03-hands-eyes.png (1536×1024)
```
Chibi 2D game art, same character as the attached reference. Sheet of separate hands and eye expressions for 2D cutout animation. TOP ROW, 6 small chibi bare hands drawn HORIZONTALLY with the wrist on the LEFT and fingers pointing to the RIGHT, side view, each with a short rounded wrist stub: (1) relaxed hand, (2) open palm facing up holding a small glow, (3) open palm pushing forward, (4) pointing index finger, (5) closed fist, (6) two-finger mudra with index and middle finger raised. BOTTOM ROW, 6 close-up chibi eye patches of the same side-view face (one big anime eye on a small patch of skin, same angle and skin tone as the head): (1) open normal, (2) closed blink, (3) determined narrowed, (4) happy closed smile, (5) pain squeezed shut, (6) casting with the iris glowing red, cyan and violet. Everything separated with space, transparent background, no text.
```

## 04-book-gems.png (1536×1024)
```
Chibi 2D game art props sheet matching the attached character, all items separated with space: (1) the Book of Elements closed, floating, side view; (2) the book half open; (3) the book fully open with glowing runic pages; (4) the open book with pages flipping and red, cyan and violet light rising; (5) FIRE gem: faceted ruby crystal with a flame inside; (6) ICE gem: faceted icy cyan crystal with frost; (7) LIGHTNING gem: faceted violet crystal with crackling arcs inside. The three gems the same size and shape, cute game-icon style, crisp line art, cel shading, transparent background, no text.
```

## 05-golem.png (1024×1536)
```
Chibi 2D game character art in exactly the same style as the attached reference (cute chunky proportions, crisp clean line art, soft cel shading, vibrant colors). The attached image is ONLY a style reference — draw a NEW creature: an Elemental Golem summoned by a mage. Massive chunky stone golem made of dark basalt plates, about 1.4 times taller than a chibi hero, very wide body, huge fists, short thick legs, small head sunk between broad shoulders with glowing eyes. Strict side view facing RIGHT, standing ready pose. Three elements on its body: glowing orange-red magma cracks on the near arm and shoulder, icy cyan crystal clusters on the far arm and on its back, violet lightning runes on the chest, a glowing tri-color core (red, cyan, violet) in the middle of the chest. Transparent background, no text.
```

## 06-golem-parts.png (1536×1024)
```
Chibi 2D game art, same golem as the attached reference. Parts sheet for 2D cutout skeletal animation, strict side view facing RIGHT, every part separated with generous space, every joint end drawn as a full ROUNDED cap: (1) head with mouth closed; (2) head with mouth wide open breathing frost; (3) torso with the chest core, NO arms, NO legs; (4) upper arm near (magma); (5) upper arm far (ice crystals); (6) forearm with fist near (magma); (7) forearm with fist far (ice crystals); (8) alternate near forearm with a BURNING FIRE FIST engulfed in flames; (9) alternate near forearm with the fist crackling with violet lightning; (10) thigh near; (11) thigh far; (12) lower leg with heavy stone foot near; (13) lower leg with heavy stone foot far; (14) separate back crystal cluster piece. Flat lighting, transparent background, no text, no labels.
```

---

## Năm tấm hiệu ứng (mỗi tấm 1536×1024, nền đen tuyền)
Dán câu này lên **đầu mỗi prompt** hiệu ứng (đính kèm `art/ignar/fx-a.png` làm mẫu phong cách):
```
Game VFX sprite sheet in the same 2D anime game style as the attached reference, on a pure black background, bright glowing effects, each effect isolated with plenty of black space around it, nothing touching the edges, no text, no labels, arranged in a 3x3 grid:
```

### fx-a.png — ngọc, sách, bão
```
(1) fire gem glow aura: soft red-orange round halo with tiny sparks; (2) ice gem glow aura: cyan frosty round halo; (3) lightning gem glow aura: violet crackling round halo; (4) gem hover highlight: thin golden ring with small twinkling stars, to show a gem can be clicked; (5) gem appear burst: small white-gold sparkle burst; (6) gem pickup streak: comet-like white light streak, horizontal; (7) gem fade: small crystal fragments dissolving into dust; (8) book invoke flash: golden rune circle rising above open pages; (9) elemental storm vortex: swirling ring of fire, ice and lightning.
```

### fx-b.png — hỏa
```
(1) large meteor falling diagonally down-right with a long fiery tail; (2) round flaming rock boulder for rolling, side view; (3) huge meteor impact explosion with fire, rocks and shockwave, side view; (4) long horizontal strip of burning ground flames, side view; (5) small fire-lightning orb: fireball wrapped in violet lightning; (6) huge unstable fire-lightning orb about to explode, crackling, bigger and brighter; (7) fire and lightning explosion; (8) long horizontal beam of fire (solar beam), straight, very long; (9) row of fire explosions along a line on the ground, side view.
```

### fx-c.png — băng
```
(1) huge jagged ice block (giant ice crystal chunk) for falling from the sky; (2) the huge ice block smashing into the ground and shattering, side view; (3) small ice chunk shard flying; (4) long horizontal beam of freezing ice (ice laser), straight, very long; (5) row of ice spikes bursting from the ground along a line, side view; (6) tall semi-transparent ice crystal prison shell, shaped to encase a small chibi character; (7) the ice prison shattering into fragments; (8) frost stack icon: snowflake inside a small ice ring; (9) ice dome shield with violet lightning cracks, front view.
```

### fx-d.png — lôi và mưa
```
(1) chain lightning bolt, horizontal, jagged, violet-white; (2) second chain lightning bolt with a different shape; (3) lightning hit spark burst; (4) tall tornado funnel with violet sparks, side view; (5) second tornado frame with a different twist; (6) wide dark storm cloud with falling rain streaks, side view; (7) lightning strike falling straight down from a cloud, tall; (8) glowing healing raindrops, soft green and cyan; (9) small electric zap spark.
```

### fx-e.png — Golem và Tốc Lôi
```
(1) summon portal: pillar of red, cyan and violet light rising from a magic circle, side view; (2) heavy landing burst of dust and rocks; (3) flaming fist dash trail, horizontal fire streak with a fist-shaped front pointing right; (4) icy wind spiral being inhaled, swirling toward a point; (5) blizzard breath: wide cone of snowstorm blowing to the right, side view; (6) lightning bolt striking down onto a stone fist, sparks around it; (7) two violet lightning palm blasts side by side (double palm strike); (8) crackling violet haste ring aura; (9) golem crumbling into falling rocks and dust.
```
