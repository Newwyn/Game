# Elarion (bản 3) + Golem Nguyên Tố — HIỆU ỨNG KỸ NĂNG (7 tấm)

Luật chung + đoạn prompt chung hiệu ứng (Lưới A / Lưới B): `art/HUONG_DAN_VE_NHAN_VAT.md` mục 6.

Mỗi lần tạo, đính kèm:
- `art/ignar/fx2/fx-boom.png`: mẫu phong cách hiệu ứng (nét, độ rực);
- **tấm hiệu ứng bản 2 cùng hệ** (ghi ở từng tấm bên dưới): để màu Hỏa / Băng / Lôi khớp các hình bản 2 vẫn giữ lại.

**Màu 3 nguyên tố (giữ đúng như bản 2):**
- **Hỏa:** lửa cam đỏ, lõi trắng vàng.
- **Băng:** pha lê lam băng, sương trắng, bông tuyết.
- **Lôi:** sét tím, lõi trắng.
- Phần chung (Sách, ấn): vàng cổ.

Bụi, sao choáng, sóng xung kích chung: dùng **4 tấm hiệu ứng chung cả đội** (`art/common/PROMPTS_FX_CHUNG.md`). Ở đây chỉ vẽ phần riêng của Elarion và Golem.

## 1. Hiệu ứng → kỹ năng

Chỉ vẽ lại những hiệu ứng **chạy khung** (nổ, vỡ, xoáy, giữ lặp). Hình lẻ bản 2 đang tốt thì **giữ nguyên, không vẽ lại** (danh sách ở mục 3).

| Tấm | Khung | Dùng ở | Thay cho (hình bản 2) |
|---|---|---|---|
| 1 `fx-elem-hits` | trúng Hỏa 4 · trúng Băng 4 | **đánh thường** tia Hỏa / Băng · Thiên Thạch lăn + vệt lửa trúng · mảnh Băng Phong, tia băng trúng | nổ lửa / vỡ băng 1 hình |
| 2 `fx-zap-storm` | trúng Lôi 4 · lốc 3 nguyên tố 4 lặp | **đánh thường** tia Lôi · Lôi Xích · sét Mưa Giông · phản đòn Giáp Băng Sét · đòn Hào Quang Sét của Golem · **Bão Nguyên Tố** (KN3) | nổ sét + lốc 3 màu 1 hình |
| 3 `fx-meteor-frost` | thiên thạch nổ 4 · khối băng vỡ 4 | **Thiên Thạch** (nổ lớn), **Hỏa Lôi Cầu** nổ · **Băng Phong** | nổ thiên thạch / vỡ băng 1 hình |
| 4 `fx-orb-tornado` | cầu hỏa lôi 4 lặp · lốc xoáy 4 lặp | **Hỏa Lôi Cầu** (to dần 2s) · **Lốc Xoáy** | cầu 1 hình · lốc 2 hình |
| 5 `fx-book-ward` | Sách loé 4 · Giáp Băng Sét 4 (hiện 2 + giữ 2 lặp) | **đọc Sách** (KN1) · **Giáp Băng Sét** | ấn chữ vàng · vòm 1 hình |
| 6 `fx-golem-fire-frost` | Lưới B: vệt đấm lửa 4 lặp · luồng bão tuyết 4 lặp | Golem **Nộ Lửa** · **Bão Tuyết** | vệt đấm · luồng bão 1 hình |
| 7 `fx-golem-storm-summon` | sét giáng 4 · triệu hồi Golem 4 | Golem **Hào Quang Sét** · **Nguyên Tố Hợp Nhất** (gọi Golem) | sét giáng · cột triệu hồi 1 hình |

Thứ tự nên làm: 1 → 2 → 3 → 4 → 5 → 7 → 6.

## 2. Đoạn riêng từng tấm

### Tấm 1 · `fx-elem-hits.png` (Lưới A) ★★★ — đính kèm thêm `art/elarion/fx-b.png` + `fx-c.png`
```
TOP ROW, frames 1-4 = FIRE HIT (a fire bolt bursting on an enemy), centered in each cell at the same point: Frame 1: a small bright yellow-white flash with a few orange flame tongues. Frame 2: a round burst of orange-red flames bursting outward with small embers. Frame 3: the burst at its biggest, flames curling outward, embers flying. Frame 4: fading wisps of flame, thin dark smoke curls and scattered embers.
BOTTOM ROW, frames 5-8 = ICE HIT (an ice shard shattering on an enemy), centered at the same point: Frame 5: a small bright white-cyan flash with a few thin ice slivers. Frame 6: a burst of icy cyan crystal shards exploding outward with frost mist. Frame 7: the biggest shatter: sharp ice crystals and snowflakes flying outward, a thin ring of frost. Frame 8: fading frost mist and small falling ice fragments.
```

### Tấm 2 · `fx-zap-storm.png` (Lưới A) ★★★ — đính kèm thêm `art/elarion/fx-d.png` + `fx-a.png`
```
TOP ROW, frames 1-4 = LIGHTNING HIT (a lightning bolt striking an enemy), centered at the same point: Frame 1: a small bright white-violet flash. Frame 2: a starburst of jagged storm-violet lightning arcs crackling outward around a white core. Frame 3: the biggest burst, branching violet arcs and tiny sparks. Frame 4: a few fading thin arcs and violet sparks.
BOTTOM ROW, frames 5-8 = ELEMENTAL STORM VORTEX, seamless loop, around an EMPTY center the size of a small character (the mage stands inside), bottoms on the same ground line near the bottom of each cell: a tall swirling cyclone made of three intertwined ribbons — ember-orange flames, icy cyan frost with snowflakes and storm-violet lightning — spiraling upward around the empty center, wider at the top, a faint ring on the ground at its base; each frame turns the ribbons a quarter turn further. The same size and position in all 4 frames.
```

### Tấm 3 · `fx-meteor-frost.png` (Lưới A) ★★★ — đính kèm thêm `art/elarion/fx-b.png` + `fx-c.png`
```
TOP ROW, frames 1-4 = METEOR IMPACT (a giant flaming meteor crashing into the ground), bottoms on the same ground line near the bottom of each cell: Frame 1: a blinding yellow-white flash on the ground with a dome of fire starting. Frame 2: a huge fiery explosion bursting upward, chunks of burning rock flying out, a ring of fire spreading along the ground. Frame 3: the explosion at its biggest — a towering column of orange-red fire and smoke with molten rocks flying. Frame 4: the fire collapsing into dark smoke and embers, a glowing crater edge on the ground.
BOTTOM ROW, frames 5-8 = GIANT ICE BLOCK SHATTERING (a huge ice block slamming down and breaking), bottoms on the same ground line: Frame 5: the bottom of a huge cyan ice block hitting the ground with a white flash and cracks. Frame 6: the block cracking apart into big faceted chunks with frost mist bursting outward. Frame 7: the chunks flying apart and shattering into smaller shards, snowflakes and frost mist. Frame 8: fading small ice shards on the ground and drifting frost mist.
```

### Tấm 4 · `fx-orb-tornado.png` (Lưới A) ★★ — đính kèm thêm `art/elarion/fx-b.png` + `fx-d.png`
```
TOP ROW, frames 1-4 = FIRE-LIGHTNING ORB, seamless loop, centered at the same point: a round magic orb of swirling orange-red fire and molten rock fragments wrapped in crackling storm-violet lightning arcs around a bright yellow-white core; each frame the fire swirls further and the lightning arcs change. The same size in all 4 frames (the game makes it grow).
BOTTOM ROW, frames 5-8 = LIGHTNING TORNADO, seamless loop, the narrow bottom tip on the same ground point near the bottom of each cell: a tall grey-violet whirlwind funnel, wide at the top and narrow at the bottom, storm-violet lightning crackling inside it, dust and leaves whipping around the base; each frame the spiral bands rotate further and the lightning changes. The same size in all 4 frames.
```

### Tấm 5 · `fx-book-ward.png` (Lưới A) ★★ — đính kèm thêm `art/elarion/fx-a.png` + `fx-c.png`
```
TOP ROW, frames 1-4 = SPELLBOOK READING FLASH (light rising from the open pages of a floating spellbook — do NOT draw the book itself, only the light), every frame rising from the same point near the lower middle of the cell: Frame 1: a small golden glow with a few golden rune symbols lifting up. Frame 2: golden runes and three small glowing orbs (ember orange, ice cyan, storm violet) spiraling upward. Frame 3: a bright column of golden light rising with a ring of golden runes, the three colored orbs merging at its top into a white star. Frame 4: fading golden runes drifting upward and sparkles.
BOTTOM ROW, frames 5-8 = ICE-LIGHTNING WARD (a protective dome around one ally), around an EMPTY space the size of a small character, bottoms on the same ground line: Frame 5: icy cyan crystal plates rising from a frost ring on the ground with violet sparks. Frame 6: the dome almost complete. Frame 7: the complete see-through dome of icy cyan crystal hexagon plates with crackling storm-violet lightning veins, the inside clear and empty. Frame 8: the same complete dome with the lightning veins in a different pattern (frames 7-8 loop).
```

### Tấm 6 · `fx-golem-fire-frost.png` (Lưới B) ★★ — đính kèm thêm `art/elarion/fx-e.png`
Dùng đoạn chung **Lưới B**, nhưng thay câu "Ground items lie FLAT ON THE GROUND..." bằng câu: `These two effects are seen from the SIDE, flying horizontally — they do NOT lie on the ground.`
```
CELLS 1-4 (rows 1-2) = BURNING FIST TRAIL, seamless loop (the golem's flaming fist rushing to the RIGHT — do not draw the fist): a long horizontal comet of roaring orange-red fire, its bright yellow-white head at the RIGHT end of the cell and its fiery tail streaming to the left with embers and black smoke; the head at the same point in every frame, only the flames flicker.
CELLS 5-8 (rows 3-4) = BLIZZARD BREATH, seamless loop (frost breath blown to the RIGHT from a mouth at the LEFT edge — do not draw the mouth): a widening cone of icy cyan-white wind, swirling frost and snowflakes blasting from a narrow point at the left edge toward the right, getting wider and mistier; the narrow point at the same place in every frame, only the swirls and snowflakes move.
```

### Tấm 7 · `fx-golem-storm-summon.png` (Lưới A) ★★ — đính kèm thêm `art/elarion/fx-e.png` + `fx-d.png`
```
TOP ROW, frames 1-4 = SKY LIGHTNING STRIKE (a bolt from the sky striking the golem's raised fists), the bottom point of the bolt at the same place near the BOTTOM of each cell: Frame 1: a thin bright white-violet bolt from the top edge of the cell down to the bottom point. Frame 2: a thick jagged storm-violet lightning bolt with branches and a bright flash burst at the bottom point. Frame 3: the bolt fading while the burst at the bottom spreads into crackling arcs. Frame 4: a few fading arcs and violet sparks at the bottom point.
BOTTOM ROW, frames 5-8 = GOLEM SUMMONING (the golem bursting out of the ground — do NOT draw the golem), bottoms on the same ground line near the bottom of each cell: Frame 5: a three-color magic circle (orange, cyan and violet runes) lying flat on the ground, seen from a low side angle as a wide flat ellipse. Frame 6: three tall pillars of light shooting up from the circle — one fire orange, one ice cyan, one storm violet. Frame 7: the pillars bursting into a big explosion of dark basalt rocks, dust and element sparks flying upward and outward around an EMPTY center. Frame 8: settling dust, falling pebbles and fading sparks.
```

## 3. Hình bản 2 giữ nguyên (KHÔNG vẽ lại)
Lấy từ `art/elarion/fx-a … fx-e.png` (atlas `elarion_fx.png` đang chạy trong game):
- **Ngọc:** 3 viên ngọc Hỏa / Băng / Lôi; ngọc hiện ra, tan, bay về người (vệt sáng).
- **Vòng:** vòng nguyên tố quanh viên ngọc đang rê chuột.
- **Đánh thường:** tia đánh thường (cầu lửa nhỏ, mũi băng, tia sét nhỏ).
- **Lôi Xích:** 2 tia sét dài.
- **Thiên Thạch:** thiên thạch rơi chéo, tảng đá lửa lăn, dải lửa cháy.
- **Băng Phong:** khối băng lớn trên đầu đội địch, gai băng.
- **Băng Hoại Hỏa Thiên:** tia băng / tia lửa (tia chính vẽ bằng code).
- **Hiệu ứng trên người:** ngục băng khi đóng băng, biểu tượng Hàn Khí, vòng sét Tốc Lôi, chưởng đôi.
- **Hơi Nước Bỏng:** mây giông, sét từ mây, mưa hồi máu.
- **Golem:** xoáy khí lạnh lúc hít, đá vụn lúc tan rã.

Muốn đồng bộ hết sau này thì vẽ thêm, không bắt buộc.

## 4. Mình làm khi nhận tấm
- **Ráp:** `tools/fx_grid_pack.py` (tách nền đen, căn khung theo điểm gốc chung) → atlas `elarion_fx2.webp`; code `src/vfx/elemFx.js` đổi sang chạy khung, giữ tên hàm cũ.
- **Trúng đòn 3 hệ:** nổ đúng màu viên ngọc Elarion đang giữ gần nhất (đánh thường), to hơn khi chí mạng.
- **Lốc 3 nguyên tố, Giáp Băng Sét:** lớp sau lưng nghiêng theo góc camera (`camTilt`) + ánh cộng sáng mờ phía trước, như vòm khiên Brakk / khiên Seraphine. Người bên trong vẫn rõ.
- **Thiên Thạch:**
  - Thiên thạch rơi (hình bản 2) → nổ lớn 4 khung → tảng đá lăn + dải lửa.
  - Nổ lớn dùng lại cho Hỏa Lôi Cầu.
- **Băng Phong:** khối băng rơi (hình bản 2) → vỡ 4 khung → mảnh băng văng.
- **Hỏa Lôi Cầu:** cầu 4 khung lặp, to dần 2s rồi nổ.
- **Lốc Xoáy:** lốc 4 khung lặp quét thẳng 12 ô.
- **Đọc Sách:** ánh vàng + chữ cổ bốc lên đúng giữa trang Sách trong tranh (điểm `book`).
- **Golem:**
  - Vệt đấm lửa bám nắm đấm suốt đường lao.
  - Luồng bão tuyết phát từ miệng (điểm `mouth`) suốt 6s, kèm bão tuyết phủ màn hình như cũ.
  - Sét giáng trúng ngọc ngực / nắm đấm.
  - Lúc triệu hồi: vòng 3 màu → 3 cột sáng → nổ đá, Golem trồi lên ở giữa.
- **Gửi duyệt:** video mọi phép + Golem (trang thử `tools/fx-elarion.html`).
