# Rok (bản 3) — HIỆU ỨNG KỸ NĂNG (4 tấm)

Luật chung + đoạn prompt chung hiệu ứng (Lưới A / Lưới B): `art/HUONG_DAN_VE_NHAN_VAT.md` mục 6.

Mỗi lần tạo, đính kèm:
- `art/ignar/fx2/fx-boom.png`: mẫu phong cách hiệu ứng;
- `art/rok/01-character-v3.png`: để khiên / sư tử đúng thiết kế của Rok.

**Màu chủ đạo:** vàng ánh kim, trắng sáng, điểm xanh hoàng gia — hợp giáp bạc, áo trắng sư tử vàng của Rok.

## 1. Hiệu ứng → kỹ năng (thay bản vẽ bằng code)

| Tấm | Khung | Dùng ở | Thay cho |
|---|---|---|---|
| 1 `fx-aegis-a` | **Khiên Thần** hiện ra 4 · giữ lặp 4 | **Dựng Khiên** (KN3): khiên hiện lúc Rok cắm khiên (0,14s), đứng trước Rok suốt tối đa 6s | Thần Hộ Vệ trên đầu + vòm lục giác |
| 2 `fx-aegis-b` | Khiên Thần nổ sóng 4 · vỡ tan 4 | mỗi lần khiên mất 1/6 máu → nổ lan (choáng, hồi máu đội); hết khiên → nổ cuối + vỡ | loé vòm + sóng vàng |
| 3 `fx-lion` | linh hồn sư tử gầm 4 · sóng gầm 4 | **Sư Tử Gầm** (KN1) | đầu sư tử vẽ bằng code |
| 4 `fx-rok-ground` | 8 hình (Lưới B) | vòng thánh dưới chân, sóng vàng, nứt đất, dấu khiêu khích, khiên nhỏ buff đội, loé húc khiên, xích liên kết, dấu hồi máu | vòng / dấu / dây vẽ bằng code |

Khiên Thần là **bản phóng to, toả sáng của chính chiếc khiên Rok cầm** (heater shield trắng, viền xanh vàng, sư tử vàng). Thêm đôi cánh ánh sáng và vầng hào quang chữ cổ phía sau. Đứng trước Rok về phía quái.

## 2. Đoạn riêng từng tấm

### Tấm 1 · `fx-aegis-a.png` — Khiên Thần hiện ra + giữ (Lưới A) ★★★
```
THE DIVINE SHIELD: a giant radiant divine version of the heater shield from the attached character image — flat top and pointed bottom, white-gold metal with ornate golden filigree, a royal-blue border set with small sapphire gems, a glowing golden rampant lion in the center; a pair of large feathered WINGS OF LIGHT spreading from its upper sides; a faint golden halo ring of runes behind it; glowing edges and soft golden light. Front view (facing the viewer), slightly turned to the right, the shield standing upright, centered in each cell, the bottom tip at the same height in every frame.
TOP ROW, frames 1-4 = APPEARING: Frame 1: a tall beam of golden light with sparkles, only the glowing outline of the shield starting to form. Frame 2: the shield half materialized, translucent, wings still folded. Frame 3: the shield fully formed with a bright flash, the wings opening. Frame 4: the shield complete, wings fully spread, halo glowing.
BOTTOM ROW, frames 5-8 = HOLDING, seamless loop: the complete divine shield exactly as in frame 4, the same size and position in every frame; only small changes: the feathers of the wings sway gently, the runes of the halo glow brighter and dimmer, light shimmers along the edges.
```

### Tấm 2 · `fx-aegis-b.png` — Khiên Thần nổ sóng + vỡ (Lưới A) ★★★
```
The SAME divine shield as in the attached divine shield sheet (heater shield of white-gold with a golden lion, wings of light, halo), same size and same position in every cell.
TOP ROW, frames 1-4 = PULSE BURST (the shield releases a protective blast and stays): Frame 1: the shield flashes bright white-gold. Frame 2: a golden shockwave ring bursts outward from the shield with sparkles and small feathers. Frame 3: the ring expands wider and thinner, the shield still glowing. Frame 4: the ring fading into sparkles, the shield back to normal.
BOTTOM ROW, frames 5-8 = SHATTER (the shield breaks at the end): Frame 5: bright cracks of light spread across the shield. Frame 6: the shield breaks into large golden shards, the wings bursting into feathers. Frame 7: shards and feathers flying apart in all directions. Frame 8: last fading sparkles and floating feathers.
```
Khi tạo tấm 2: đính kèm thêm `fx-aegis-a.png` vừa tạo.

### Tấm 3 · `fx-lion.png` — Sư Tử Gầm (Lưới A) ★★
```
TOP ROW, frames 1-4 = a golden SPIRIT LION made of light and flowing golden flames, side view facing RIGHT, majestic mane like fire, bright eyes, same size and same ground line in every frame: Frame 1: the lion forming from golden light, faint and translucent, crouching. Frame 2: the lion leaping forward, mouth opening. Frame 3: KEY — the lion roaring with its mouth wide open, mane blazing, at its biggest and brightest. Frame 4: the lion dissolving into golden sparks and wisps.
BOTTOM ROW, frames 5-8 = ROAR SOUND WAVES travelling to the RIGHT: curved golden arc waves like ")))" with small sparkles, starting at the left side of the cell: Frame 5: one small bright arc. Frame 6: three arcs spreading. Frame 7: the arcs bigger and fainter, reaching the right side. Frame 8: last faint arcs fading.
```

### Tấm 4 · `fx-rok-ground.png` (Lưới B) ★★
```
Cell 1: a HOLY GUARD CIRCLE lying flat on the ground: golden rings with lion and shield runes and soft white light, elegant.
Cell 2: a GOLDEN SHOCKWAVE RING lying flat on the ground: a bright clean ring of golden light with a soft inner glow, empty in the middle.
Cell 3: a GROUND QUAKE RING lying flat on the ground: cracked earth in a ring with small rocks and dust kicked up (natural brown-grey with a faint golden glow in the cracks).
Cell 4: a TAUNT MARK icon (front view, NOT on the ground): an angry red-and-gold exclamation emblem with a small lion head, bold and readable.
Cell 5: a small DIVINE SHIELD BUFF icon (front view, NOT on the ground): a mini white-gold heater shield with a golden lion and a small upward arrow of light.
Cell 6: a SHIELD BASH IMPACT burst (front view, NOT on the ground): a bright golden star burst with sharp rays and sparks, wide horizontally.
Cell 7: a CHAIN OF LIGHT segment (front view, NOT on the ground): a horizontal golden glowing chain of interlocking links across the whole cell, soft glow around it.
Cell 8: a HEALING CROSS icon (front view, NOT on the ground): a soft golden-white plus sign with small sparkles and a gentle glow.
```

## 3. Mình làm khi nhận tấm
- **Cắt và tách nền:** cắt theo ô, tách nền đen. Không tô sửa.
- **Dựng Khiên:**
  - Khiên Thần hiện ra đúng lúc Rok cắm khiên (khung chính 0,14s), đứng trước Rok, giữ lặp suốt thời gian khiên.
  - Khiên mờ dần theo máu khiên còn lại.
  - Mỗi lần nổ chạy 4 khung nổ sóng (+ sóng vàng trên đất, choáng, hồi máu đội); hết khiên thì vỡ tan.
  - Bỏ Thần Hộ Vệ và vòm lục giác cũ.
- **Sư Tử Gầm:** sư tử phóng ra phía quái lúc gầm (0,42s), sóng gầm lan theo; quái trúng hiện dấu khiêu khích.
- **Đẩy Khiên:** loé húc khiên ở mặt khiên (0,22s); quái rơi xuống đất → vòng nứt địa chấn.
- **Mốc sát thương giữ nguyên.** Gửi video từng kỹ năng để bạn duyệt.
