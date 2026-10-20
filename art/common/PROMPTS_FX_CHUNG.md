# Bộ HIỆU ỨNG DÙNG CHUNG cho cả đội (4 tấm)

Hiện các hiệu ứng này vẽ bằng code, dùng cho mọi nhân vật, nên mỗi người một kiểu. Thay bằng tranh thì cả đội đồng bộ, và từng nhân vật đỡ phải vẽ lặp.

**Màu:** phần "tô màu được" vẽ **TRẮNG / xám bạc**, game tự nhuộm theo màu từng nhân vật (lửa cam, sấm tím, gió xanh ngọc, thánh quang vàng...). Bụi, khói, sao choáng giữ màu thật.

Lưu vào `art/common/fx/` đúng tên, hoặc gửi vào chat. Đính kèm `art/ignar/fx2/fx-boom.png` làm mẫu phong cách.

## Hiệu ứng ↔ chỗ dùng

| Tấm | Ô | Thay cho (code hiện tại) | Dùng ở |
|---|---|---|---|
| 1 `fx-common-hit` | 1–4 nổ trúng đòn | `spawnHitSpark`, `spawnImpact` | mọi đòn trúng (23 + 5 chỗ) |
| | 5–8 vệt chém cong | `spawnSlashVfx` | Jessica, Rok, Zerith, Brakk... |
| 2 `fx-common-dust` | 1–4 bụi đáp đất | `spawnLandingDust`, `spawnFootDust` | rơi vào trận, nhảy, lướt (14 chỗ) |
| | 5–8 khói bùng | `spawnSmokeBurst` | biến mất / hiện ra, tàng hình (12 chỗ) |
| 3 `fx-common-status` | 1–4 sao choáng lặp | sao vẽ code trên đầu | mọi nhân vật bị choáng |
| | 5–8 cột sáng lấp lánh lặp | `spawnRisingSparkles`, `spawnHealLight` | buff, hồi máu, hồi sinh (18 + 4 chỗ) |
| 4 `fx-common-ground` | 8 hình trên đất | `spawnShockwave`, vòng niệm dưới chân, `spawnReviveLight`, `spawnShieldShatter` | 27 chỗ sóng xung kích + vòng niệm của mọi nhân vật |

## Đoạn chung
Tấm 1–3 dùng **Lưới A**, tấm 4 dùng **Lưới B**. Hai đoạn chung nằm ở `art/HUONG_DAN_VE_NHAN_VAT.md` mục 6: dán đoạn chung trước, rồi dán đoạn riêng bên dưới.

## Đoạn riêng

### Tấm 1 · `fx-common-hit.png` (Lưới A) ★★★
```
All effects in this sheet are drawn in WHITE and pale silver-grey only (no other colors), so the game can tint them per character.
TOP ROW, frames 1-4: a generic HIT IMPACT burst at the center of the cell: frame 1 a sharp bright star flash, frame 2 a burst ring of short sharp spikes and sparks flying outward, frame 3 the spikes thinning and spreading with small sparks, frame 4 last tiny sparks fading.
BOTTOM ROW, frames 5-8: a curved SWORD SLASH arc swiping from upper-left to lower-right across the cell, a crescent-shaped streak thick in the middle and tapering at both ends: frame 5 the arc just starting, short and thin, frame 6 the full bright crescent, frame 7 the crescent fading and breaking into thin streaks, frame 8 last faint wisps.
```

### Tấm 2 · `fx-common-dust.png` (Lưới A) ★★★
```
TOP ROW, frames 1-4: a LANDING DUST CLOUD on the ground (natural light brown-grey dust, soft cartoon puffs), bottoms aligned on the same ground line near the bottom of each cell: frame 1 small puffs bursting sideways from the ground, frame 2 a wide low dust cloud spreading left and right, frame 3 the cloud bigger and thinner, frame 4 faint thin dust fading.
BOTTOM ROW, frames 5-8: a SMOKE BURST for vanishing / appearing (soft grey-white cartoon smoke puffs), centered: frame 5 a small tight puff, frame 6 a big round burst of puffy smoke, frame 7 the smoke drifting apart into separate puffs, frame 8 last faint wisps.
```

### Tấm 3 · `fx-common-status.png` (Lưới A) ★★
```
TOP ROW, frames 1-4: DIZZY STARS for a stunned character: 4 small yellow cartoon stars orbiting on a flat ellipse (seen from a low side angle), with a thin faint orbit trail; a seamless 4-frame loop where the stars move a quarter step around the ellipse each frame, same size and same center in every frame.
BOTTOM ROW, frames 5-8: a rising COLUMN OF SPARKLES for buffs and healing, drawn in WHITE only (the game tints it): a soft vertical beam of light with small four-pointed sparkles and tiny dots floating upward, bottom aligned on the same ground line; a seamless 4-frame loop with the sparkles moving up each frame.
```

### Tấm 4 · `fx-common-ground.png` (Lưới B) ★★
```
All items except cell 7 are drawn in WHITE and pale silver-grey only (the game tints them per character).
Cell 1: a thin SHOCKWAVE RING lying flat on the ground, a clean bright ring with a soft inner glow, empty in the middle.
Cell 2: a CASTING MAGIC CIRCLE lying flat on the ground: two thin concentric rings with simple runes and a small star in the middle, elegant and clean.
Cell 3: a HEALING CIRCLE lying flat on the ground: a soft glowing ring with small leaf and cross symbols around it.
Cell 4: a REVIVE CIRCLE lying flat on the ground: a bright ring with rays of light pointing outward and small feathers.
Cell 5: a wide SPEED DASH STREAK lying flat on the ground: several long parallel speed lines, thick at the left and tapering to the right.
Cell 6: a GROUND STOMP RING of dust and small rock chips spreading flat along the ground (natural brown-grey, not white).
Cell 7: GROUND CRACKS from a heavy impact lying flat on the ground (dark brown-grey cracked earth with small debris, not white).
Cell 8: a SHIELD SHATTER burst (front view, NOT on the ground): glass-like white shards flying outward from the center with a bright flash.
```

## Mình làm khi nhận tấm
- Cắt lưới, tách nền đen.
- Thay các hiệu ứng code ở bảng trên. Phần trắng nhuộm đúng màu cũ của từng nhân vật nên không lệch màu kỹ năng.
- Gửi video so trước / sau cho bạn duyệt.
