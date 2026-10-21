# Seraphine (bản 3) — HIỆU ỨNG KỸ NĂNG (5 tấm)

Luật chung + đoạn prompt chung hiệu ứng (Lưới A / Lưới B): `art/HUONG_DAN_VE_NHAN_VAT.md` mục 6.

Mỗi lần tạo, đính kèm:
- `art/rok/fx2/fx-aegis-a.png`: mẫu phong cách hiệu ứng (nét, độ rực);
- `art/seraphine/01-character-v3.png`: để vòng mặt trời / màu đúng thiết kế của Seraphine.

**Màu chủ đạo:** vàng kim, trắng sáng, hổ phách ấm, điểm hồng phấn nhạt — hợp đồ trắng vàng hồng phấn và gậy vòng mặt trời của Seraphine.

Bụi đáp đất, sao choáng: dùng **4 tấm hiệu ứng chung cả đội** (`art/common/PROMPTS_FX_CHUNG.md`). Ở đây chỉ vẽ phần riêng của Seraphine.

## 1. Hiệu ứng → kỹ năng (thay bản vẽ bằng code)

| Tấm | Khung | Dùng ở | Thay cho |
|---|---|---|---|
| 1 `fx-light-orb` | cầu ánh sáng bay 4 lặp · nổ sáng 4 | **đánh thường**: cầu ánh sáng bay từ đầu gậy tới quái | cầu sáng + loé vẽ bằng code |
| 2 `fx-heal-shield` | tia nắng hồi máu 4 · khiên ánh sáng 4 (hiện ra · giữ lặp) | **Thánh Quang Trị Liệu** (KN1): tia nắng rọi xuống người được hồi · **Khiên Ánh Sáng** (KN2): bong bóng khiên quanh người được che suốt 5s | cột sáng + bong bóng vẽ bằng code |
| 3 `fx-guardian` | Hộ Vệ Thiên Sứ hiện ra 4 · giữ lặp 4 | **Thánh Niệm** (KN3): thiên sứ sáu cánh chắp tay niệm sau lưng Seraphine suốt 10s | Hộ vệ ánh sáng (tranh cũ) |
| 4 `fx-angel` | thiên thần nhỏ bay 4 lặp · trao ánh sáng 4 | **đang Niệm**: KN1/KN2 cho cả đội — thiên thần bay tới từng người · **Thiên Thần Hộ Mệnh** (thiên phú 2): thiên thần bay tới hồi sinh đồng đội | thiên thần nhỏ (tranh cũ) |
| 5 `fx-sera-icons` | 8 hình (Lưới B) | vòng thánh dưới chân lúc niệm, vòng hồi sinh, đôi cánh khiên, biểu tượng +sát thương / +thủ, giải hiệu ứng xấu, dấu cộng hồi máu, loé mặt trời | vòng / dấu / cánh vẽ bằng code |

## 2. Đoạn riêng từng tấm

### Tấm 1 · `fx-light-orb.png` (Lưới A) ★★★
```
TOP ROW, frames 1-4 = FLYING ORB OF HOLY LIGHT, seamless loop, flying horizontally toward the RIGHT: a round glowing golden-white orb with a tiny bright sun-shaped star at its core, a thin golden ring circling it, a short tail of golden sparkles and soft light behind it, same size and same center in every frame; only the ring turns and the sparkles flicker between frames.
BOTTOM ROW, frames 5-8 = LIGHT BURST HIT, centered: Frame 5: a bright white-gold star flash. Frame 6: a burst ring of golden light rays with small sparkles and tiny glowing petals flying outward. Frame 7: the rays thinning and spreading, sparkles drifting. Frame 8: last faint golden sparkles.
```

### Tấm 2 · `fx-heal-shield.png` (Lưới A) ★★★
```
TOP ROW, frames 1-4 = HEALING SUNLIGHT falling on an EMPTY space where a small character stands (the game draws the character), bottoms on the same ground line near the bottom of each cell: Frame 1: a thin beam of warm golden sunlight starting to shine down from the top of the cell, small sparkles. Frame 2: a wide soft column of golden-white sunlight from above with floating light motes, tiny sun symbols and soft rose-pink petals drifting down, a small glowing ring on the ground. Frame 3: the column at its brightest, motes rising upward from the ground. Frame 4: the light fading into rising sparkles.
BOTTOM ROW, frames 5-8 = SHIELD OF LIGHT around an EMPTY space the size of a small character (the game draws the character inside): a tall clear oval bubble of golden-white light with a bright golden rim, faint sun runes circling on its surface and a soft warm glow, bottoms on the same ground line: Frame 5: the bubble forming from a ring of light rising from the ground. Frame 6: the complete bubble. Frame 7: the same bubble shimmering slightly wider, runes glowing brighter. Frame 8: the same bubble shimmering slightly taller (frames 6-8 loop).
```

### Tấm 3 · `fx-guardian.png` (Lưới A) ★★★
```
THE SERAPH GUARDIAN: a tall serene female angel made entirely of translucent glowing golden-white light, a large radiant golden sun halo behind her head, long flowing hair of light, eyes gently closed, both hands clasped in prayer in front of her chest, a long robe that dissolves into soft rays of light at the bottom (no feet), and THREE PAIRS OF WINGS of glowing golden-white feathers (one pair spread upward, one pair spread to the sides, one small pair folded below). Side view facing RIGHT. Draw her alone (no other character). Same size and the same center in every frame.
TOP ROW, frames 1-4 = APPEARING: Frame 1: a pillar of golden light with small feathers and sparkles rising. Frame 2: the light taking the shape of the seraph, faint and translucent, wings folded. Frame 3: the seraph fully formed with a bright flash, the wings opening. Frame 4: the seraph complete, all wings spread, the sun halo glowing.
BOTTOM ROW, frames 5-8 = HOLDING, seamless loop: the complete seraph exactly as in frame 4, the same size and position in every frame; only small changes: the feathers sway gently, the halo pulses softly, light ripples through the robe.
```

### Tấm 4 · `fx-angel.png` (Lưới A) ★★
```
THE LITTLE ANGEL: a small chibi cherub angel (a cute child with short golden curly hair, a thin golden halo, small white-gold feathered wings, a simple white robe with a rose-pink sash) carrying a glowing golden-white orb of light in both hands. Side view facing RIGHT.
TOP ROW, frames 1-4 = FLYING (seamless loop), flying toward the right holding the orb in front of her: the wings flapping through 4 positions (up, middle, down, middle), a short trail of sparkles behind, same size and same center in every frame.
BOTTOM ROW, frames 5-8 = GIVING THE LIGHT, centered: Frame 5: hovering, holding the orb out forward with both hands. Frame 6: the orb bursting gently into a bright golden flash in front of her. Frame 7: the angel smiling and waving, starting to fade, golden sparkles. Frame 8: the angel dissolved into golden sparkles and a few small feathers.
```

### Tấm 5 · `fx-sera-icons.png` (Lưới B) ★★
```
Cell 1: a HOLY SUN CIRCLE lying flat on the ground (very wide flat ellipse): a golden ring with sun-ray runes, small stars and soft white light, empty in the middle.
Cell 2: a REVIVE CIRCLE lying flat on the ground (very wide flat ellipse): a bright golden-white ring with rays of light pointing outward and small white feathers, empty in the middle.
Cell 3: a pair of SHIELD WINGS (front view, NOT on the ground): two small glowing golden-white feathered wings spread wide, one on the left and one on the right, with an empty gap in the middle (they attach to a character's back).
Cell 4: a DAMAGE UP icon (front view): a golden sword crossed over a small radiant sun with a golden upward arrow.
Cell 5: a DEFENSE UP icon (front view): a small white-gold shield with a sun emblem and a golden upward arrow.
Cell 6: a CLEANSE icon (front view): dark chains breaking apart into golden light and sparkles.
Cell 7: a HEALING PLUS (front view): a soft glowing golden-white plus sign with small sparkles around it.
Cell 8: a SUN FLARE (front view): a bright golden-white star burst with long sharp rays and a soft round glow.
```

## 3. Mình làm khi nhận tấm
- **Cắt và tách nền:** cắt theo ô, tách nền đen. Không tô sửa.
- **Đánh thường:** cầu ánh sáng bay từ đầu gậy (khung chính 0,22s) tới quái, trúng thì nổ sáng.
- **Thánh Quang Trị Liệu:** tia nắng rọi xuống người được hồi (khung chính 0,3s) + số hồi máu; giải hiệu ứng xấu thì hiện biểu tượng xích vỡ.
- **Khiên Ánh Sáng:** bong bóng khiên hiện ra quanh người được che (khung chính 0,28s), giữ lặp suốt 5s, mờ dần theo máu khiên; khiên lúc niệm có thêm đôi cánh.
- **Thánh Niệm:**
  - Giơ gậy (0,45s): loé mặt trời → Seraphine bay lên, vòng thánh dưới chân.
  - Hộ Vệ Thiên Sứ hiện ra sau lưng, giữ lặp suốt 10s.
  - Cả đội hiện biểu tượng +sát thương (và +thủ khi có Ân Điển); mỗi giây hồi máu: dấu cộng nhỏ.
  - Khi niệm mà dùng KN1 / KN2: thiên thần nhỏ bay từ Seraphine tới từng người, trao ánh sáng.
- **Thiên Thần Hộ Mệnh:** thiên thần (to hơn) bay tới xác đồng đội → vòng hồi sinh + tia nắng lớn → đứng dậy.
- **Mốc sát thương / hồi máu giữ nguyên.** Gửi video từng kỹ năng để bạn duyệt.
