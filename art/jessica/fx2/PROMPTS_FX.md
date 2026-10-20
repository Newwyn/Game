# Jessica (bản 3) — HIỆU ỨNG KỸ NĂNG (4 tấm)

Luật chung + đoạn prompt chung hiệu ứng (Lưới A / Lưới B): `art/HUONG_DAN_VE_NHAN_VAT.md` mục 6.

Mỗi lần tạo, đính kèm:
- `art/rok/fx2/fx-aegis-a.png`: mẫu phong cách hiệu ứng (nét, độ rực);
- `art/jessica/01-character-v3.png`: để lá bùa / màu tím đúng thiết kế của Jessica.

**Màu chủ đạo:** tím điện, tím đen, điểm trắng sáng ở lõi tia sét — hợp bộ đồ đen tím của Jessica.

Khói biến mất / hiện ra, vệt chém thường, bụi, sao choáng: dùng **4 tấm hiệu ứng chung cả đội** (`art/common/PROMPTS_FX_CHUNG.md`), game nhuộm tím cho Jessica. Ở đây chỉ vẽ phần riêng của Jessica.

## 1. Hiệu ứng → kỹ năng (thay bản vẽ bằng code)

| Tấm | Khung | Dùng ở | Thay cho |
|---|---|---|---|
| 1 `fx-talisman` | lá bùa bay 4 lặp · trúng bùa + hiện Ấn 4 | **Phóng Bùa** (KN1): lá bùa bay tới quái ít máu nhất, trúng thì gắn **Ấn** 7s | lá bùa + loé trúng vẽ bằng code |
| 2 `fx-thunder-slash` | vệt chém sấm 4 · chí mạng chém chữ X 4 | đòn chém lúc **tàng hình**, **Đột Kích** lướt chém, chí mạng | vệt chém tím vẽ bằng code |
| 3 `fx-stealth` | bùng khói sấm 4 · hào quang tàng hình 4 lặp | **Tàng Hình** (KN3): bùng lúc kết ấn, hào quang quanh người suốt 5s | hào quang + tia sét vẽ bằng code |
| 4 `fx-jessica-ground` | 8 hình (Lưới B) | dấu Ấn trên quái, vòng bóng tối dưới chân, vệt lướt, tia sét nhỏ, biểu tượng buff né, biểu tượng hồi chiêu, tia lửa sấm, bóng mờ | dấu / vệt / biểu tượng vẽ bằng code |

## 2. Đoạn riêng từng tấm

### Tấm 1 · `fx-talisman.png` (Lưới A) ★★★
```
THE TALISMAN: a narrow rectangular white paper talisman (ofuda) with bold purple ink glyphs and a thin gold border, glowing with a soft violet aura, as on the attached character's belt.
TOP ROW, frames 1-4 = FLYING TALISMAN, seamless loop, flying horizontally toward the RIGHT: the paper spinning and fluttering, a short trail of small violet sparks and tiny lightning crackles behind it, same size and same center in every frame: Frame 1: seen flat. Frame 2: turned a quarter. Frame 3: seen edge-on. Frame 4: turned three quarters.
BOTTOM ROW, frames 5-8 = TALISMAN HIT + SEAL MARK, centered in each cell: Frame 5: the talisman slaps flat against the target point and flashes bright violet. Frame 6: the paper bursts into violet light with small paper scraps and crackling purple lightning. Frame 7: a glowing violet circular seal sigil (a ring of glyphs around a lightning symbol) appears where the paper was. Frame 8: the sigil fading into small violet sparks.
```

### Tấm 2 · `fx-thunder-slash.png` (Lưới A) ★★★
```
TOP ROW, frames 1-4 = THUNDER SLASH: a curved crescent slash arc from upper-left to lower-right across the cell, made of violet lightning with a black-purple core and white-hot edges, small branching lightning crackles along it: Frame 1: the arc just starting, thin and short. Frame 2: the full bright crescent. Frame 3: the crescent breaking into crackling lightning streaks. Frame 4: last faint violet sparks.
BOTTOM ROW, frames 5-8 = CRITICAL X-SLASH: two crossing violet-black lightning slashes forming a big X at the center of the cell, with a bright white-violet flash where they cross: Frame 5: the first diagonal slash. Frame 6: the second slash crossing it, bright flash in the middle. Frame 7: the X bursting outward with lightning sparks and dark purple shards. Frame 8: fading sparks.
```

### Tấm 3 · `fx-stealth.png` (Lưới A) ★★★
```
TOP ROW, frames 1-4 = STEALTH BURST (the ninja vanishes into thunder smoke), centered, bottoms on the same ground line near the bottom of each cell: Frame 1: a small tight puff of dark purple smoke with a bright violet lightning flash in the middle. Frame 2: a big round burst of purple-black smoke with crackling violet lightning arcs. Frame 3: the smoke drifting apart into separate puffs, lightning fading. Frame 4: last faint purple wisps and sparks.
BOTTOM ROW, frames 5-8 = STEALTH AURA, seamless loop: a tall oval aura of crackling violet electricity surrounding an EMPTY space the size of a small character (the game draws the character inside), thin purple flames rising, small lightning arcs jumping around the edge, same size and same position in every frame; only the lightning arcs and flames move between frames.
```

### Tấm 4 · `fx-jessica-ground.png` (Lưới B) ★★
```
Cell 1: a SEAL MARK sigil (front view, NOT on the ground): a glowing violet circular seal with a ring of small glyphs around a lightning-bolt symbol, crisp and readable.
Cell 2: a SHADOW RING lying flat on the ground: a dark purple-black ring with crackling violet lightning around its edge, darker in the middle (where the ninja vanishes or appears).
Cell 3: a DASH STREAK (front view, NOT on the ground): a long horizontal streak of violet lightning across the whole cell, thick and bright at the right end, thin and fading at the left end.
Cell 4: a small vertical LIGHTNING BOLT (front view): a zigzag violet bolt with a white-hot core and tiny sparks.
Cell 5: a DODGE BUFF icon (front view): a small violet feathered wing with a lightning bolt across it, soft glow.
Cell 6: a COOLDOWN RESET icon (front view): a violet circular arrow (counter-clockwise) with small lightning sparks.
Cell 7: a THUNDER SPARK BURST (front view): a bright violet and white star-shaped burst with short jagged lightning rays.
Cell 8: a SHADOW AFTERIMAGE (front view): a soft translucent purple-black silhouette smear, like a blurred dark ghost streak, wide horizontally.
```

## 3. Mình làm khi nhận tấm
- **Cắt và tách nền:** cắt theo ô, tách nền đen. Không tô sửa.
- **Phóng Bùa:** lá bùa bay xoay từ tay ném (khung chính 0,42s / 0,2s) tới quái; trúng → bùng tím → hiện dấu Ấn. Quái có Ấn mang dấu Ấn nhỏ trên đầu suốt 7s.
- **Đột Kích:** vệt lướt sấm nối các quái bị chém; mỗi quái trúng vệt chém sấm (chí mạng: chữ X); chém chết → biểu tượng hồi chiêu.
- **Tàng Hình:** bùng khói sấm lúc kết ấn (0,38s); hào quang sấm lặp quanh Jessica suốt 5s, Jessica mờ đi; đồng đội nhận buff né hiện biểu tượng cánh sét + tia sét nhỏ nháy quanh người.
- **Mốc sát thương giữ nguyên.** Gửi video từng kỹ năng để bạn duyệt.
