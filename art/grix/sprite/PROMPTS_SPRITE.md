# Grix (Lục Độc) — TẠO HÌNH + bộ tấm SPRITE

Tài liệu liên quan:
- Luật chung, đoạn prompt chung, câu sửa khi AI vẽ sai: `art/HUONG_DAN_VE_NHAN_VAT.md`.
- Hiệu ứng dùng chung cả đội (bụi, khói, sao choáng...): `art/common/PROMPTS_FX_CHUNG.md`.

**Đã vẽ đủ (27/10/2026, Codex vẽ)** tạo hình + 9 tấm dưới đây, đã vào game. Muốn vẽ lại tấm nào: dùng đúng đoạn prompt của tấm đó, đính kèm `01-character-v3.png` + `sprite/sprite-idle.png`, rồi đóng gói lại (DOCUMENTATION §4.10).

## 0. Tạo hình (làm TRƯỚC mọi tấm khác)

**Grix — goblin giả kim sư độc dược** (chủ đề **độc · đầm lầy · bình thuốc · mẹo vặt**), tộc **Goblin** (tộc đầu tiên của game):
- **Dáng:** goblin nhỏ con, lưng hơi gù, **tai nhọn rất dài cụp xuống**, mũi khoằm, da **xanh rêu**. **Mắt vàng chanh to**, cười nhe răng tinh quái (1 răng nanh mẻ).
- **Đầu:** **kính bảo hộ giả kim** tròn đeo trên trán (tròng kính xanh lục phát sáng), tóc trắng xám dựng lởm chởm.
- **Trang phục:**
  - Áo choàng ngắn **nâu da** vá chằng chịt, khăn quàng **tím mận** quấn cổ che nửa miệng khi cần.
  - **Đai chéo ngực gắn 5–6 lọ thuốc** nhỏ (xanh lục, tím, vàng), có lọ nứt rỉ giọt.
  - Tạp dề da cháy sém, găng tay da dày tới khuỷu, quần túm, chân trần to bè có móng.
  - Sau lưng đeo **nồi giả kim nhỏ bằng đồng** (vạc tròn có ống khói, hơi xanh bốc lên nhẹ — chỉ vẽ ở tranh thiết kế, KHÔNG vẽ khói trong sprite).
- **Vũ khí:** **gậy muôi khuấy bằng gỗ xoắn** cao gần bằng người, đầu gậy treo **1 bình cầu thuỷ tinh** chứa chất lỏng **xanh lục phát sáng**.
- **Phối màu:** xanh rêu (da) · xanh lục độc (phát sáng) · nâu da · tím mận · đồng thau.
  - Tách khỏi Lyra (xanh ngọc lục bảo, thanh thoát) và Nerissa (xanh nước biển): Grix **xỉn, bụi bặm, lục độc chói**.

Lưu vào `art/grix/` với tên **`01-character-v3.png`**.

### 01-character-v3.png (1024×1536, nền trong suốt)
Đính kèm `art/rok/01-character-v3.png`: **chỉ để lấy phong cách chibi của cả đội**.
```
Chibi 2D game character art in exactly the same style as the attached reference: big head about one third of the total height (about 3 heads tall), large expressive anime eyes, short arms and legs, highly detailed clothing and accessories, crisp clean line art, soft cel shading, vibrant colors. Use the attached image ONLY as a style reference — do NOT copy its character, outfit or colors. NEW CHARACTER: Grix, a small mischievous goblin alchemist. Moss-green skin, very long pointed ears drooping down, a hooked nose, big lime-yellow eyes, a cheeky toothy grin with one chipped fang, spiky messy grey-white hair, round brass alchemist goggles with glowing toxic-green lenses pushed up on his forehead. A short patched brown leather cloak, a plum-purple scarf around his neck, a cross-body bandolier holding five or six small potion vials (toxic green, purple, yellow; one cracked and dripping), a scorched leather apron, thick leather gloves up to the elbows, baggy pants, big bare goblin feet with claws. A small round brass alchemy cauldron strapped on his back. His weapon: a twisted wooden stirring staff almost as tall as himself with a glass flask hanging from its top, filled with glowing toxic-green liquid, held in his FAR hand. Three-quarter side view facing RIGHT, full body, standing slightly hunched in a sneaky playful pose, both legs visible. Transparent background, no ground shadow, no text.
```

### 01b-portrait-v3.png (1024×1536, nền trong suốt) — ảnh màn chọn đội (tuỳ chọn)
Đính kèm `01-character-v3.png` vừa tạo.
```
Chibi 2D game character art, the SAME character as the attached image (Grix, small moss-green goblin alchemist with long drooping ears, lime-yellow eyes, brass goggles with green lenses, patched brown cloak, plum scarf, potion bandolier, brass cauldron on his back, twisted wooden staff with a glowing green flask). Dynamic pose: holding up a bubbling green potion vial to his eye and grinning mischievously, the staff leaning on his shoulder. Full body, transparent background, no text.
```

**Mô tả dán vào chỗ `<...>` của đoạn prompt chung sprite** (dùng cho mọi tấm dưới):
```
Grix, a chibi moss-green goblin alchemist with long drooping pointed ears, big lime-yellow eyes, spiky grey-white hair, brass goggles with green lenses on his forehead, a patched brown leather cloak, a plum-purple scarf, a bandolier of small potion vials, a scorched leather apron, a small brass cauldron on his back, and a twisted wooden staff with a glass flask of glowing green liquid hanging from its top
```

**Đoạn luật vũ khí** (dán ngay SAU đoạn chung sprite, ở MỌI tấm):
```
STAFF AND POTION RULES: the same twisted wooden staff with the same green flask in every frame; when a frame says he throws a vial, draw ONLY the small vial in his hand at that moment (no flying vial, no splash, no liquid trails, no smoke, no bubbles, no glow — the game adds all effects). The whole staff stays inside the cell.
```

## 1. Bảng động tác (9 tấm)

Mọi tấm 1536×1024, nền xanh #00FF00, lưới 4×2. **Khung chính** = khung trùng mốc gây sát thương của server.

| # | File | Động tác (dùng khi) | Khung | Khung chính | Ưu tiên |
|---|---|---|---|---|---|
| 1 | `sprite-idle.png` | hàng trên: đứng thường (lắc lọ thuốc) · hàng dưới: thủ thế khom người | 4 + 4 | — | ★★★ làm ĐẦU TIÊN |
| 2 | `sprite-attack.png` | đánh thường: rút lọ nhỏ ở đai → ném vòng cung | 8 | **khung 4** (tay vừa buông lọ) @0,2s | ★★★ |
| 3 | `sprite-move.png` | chạy lon ton khom lưng, nồi sau lưng nảy | 8 lặp | — | ★★★ |
| 4 | `sprite-hurt-stun.png` | trúng đòn · choáng (tai cụp, lảo đảo) | 4 + 4 | — | ★★★ |
| 5 | `sprite-dead-victory.png` | gục (ngã ngửa, lọ lăn ra) · thắng (nhảy cẫng, giơ bình) | 4 + 4 | — | ★★ |
| 6 | `sprite-cast-land.png` | gồng: khuấy gậy như khuấy nồi 4 (khung 3–4 gần giống) · rơi vào trận → đáp đất 4 | 4 + 4 | — | ★★ |
| 7 | `sprite-flask.png` | **KN1 Bình Độc Văng**: tháo bình cầu ở đầu gậy → xoay người ném mạnh qua đầu | 8 | **khung 5** (buông bình) @0,2s | ★★★ |
| 8 | `sprite-bog.png` | **KN2 Đầm Lầy Thối Rữa**: cắm gậy xuống đất, 2 tay ấn gậy, đất dưới chân sụt | 8 | **khung 4** (gậy chạm đất) @0,4s | ★★ |
| 9 | `sprite-detonate.png` | **KN3 Đại Bộc Phá Độc**: giơ 2 tay búng ngón, cười điên dại, kính sụp xuống mắt | 8 | **khung 5** (búng tay) @0,5s | ★★ |

### Đoạn mô tả riêng từng tấm (dán SAU đoạn chung + luật vũ khí)
- **sprite-idle:** `Top row frames 1-4: relaxed idle, gently shaking a small green vial next to his ear, staff in the other hand. Bottom row frames 5-8: battle-ready crouch, staff held forward, grinning.`
- **sprite-attack:** `Frames 1-3: reaches to the bandolier and pulls out a small vial; frame 4: throws it overhand, arm fully extended forward, hand just opened; frames 5-8: follow-through and back to ready stance.`
- **sprite-move:** `A looping run cycle: hunched sneaky jog, big feet, cauldron bouncing on his back, staff held diagonally.`
- **sprite-hurt-stun:** `Top row frames 1-4: hit reaction, flinching backward, ears flattened. Bottom row frames 5-8: dizzy stunned loop, wobbling, eyes swirled, ears drooping.`
- **sprite-dead-victory:** `Top row frames 1-4: falls backward, frame 4 lying on his back, a vial rolled beside him. Bottom row frames 5-8: victory hop, raising the staff with the glowing flask high, laughing.`
- **sprite-cast-land:** `Top row frames 1-4: channeling, stirring the air with the staff in a circle as if stirring a cauldron (frames 3 and 4 almost identical). Bottom row frames 5-8: drops into battle from above, lands crouched, stands up.`
- **sprite-flask:** `Frames 1-2: unhooks the glass flask from the staff top; frames 3-4: winds up, twisting the body backward; frame 5: hurls the flask forward overhead, hand open; frames 6-8: follow-through, recovering.`
- **sprite-bog:** `Frames 1-3: raises the staff high with both hands; frame 4: slams the staff tip into the ground, both hands pressing down; frames 5-8: keeps pressing, leaning on the staff, grinning at the ground.`
- **sprite-detonate:** `Frames 1-4: raises both hands, goggles slide down over his eyes, manic grin growing; frame 5: snaps his fingers, arms spread; frames 6-8: cackles with his head thrown back.`

## 2. Hiệu ứng (sau khi có nhân vật — chưa bắt buộc)
Game đang tự vẽ hiệu ứng độc bằng code. Nếu muốn đẹp hơn, sau này tạo `art/grix/fx2/PROMPTS_FX.md` theo `art/HUONG_DAN_VE_NHAN_VAT.md` §6: bình độc bay + vỡ (lưới A), vũng đầm độc trên mặt đất (lưới B), nổ độc xanh (lưới A), làn khói xám (lưới A).
