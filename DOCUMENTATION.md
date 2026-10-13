# 📖 LEGEND OF CAPSULES — TÀI LIỆU THIẾT KẾ & KỸ THUẬT

> **Mã dự án:** `legend-of-capsules` · **Kho mã:** [github.com/Newwyn/Game](https://github.com/Newwyn/Game)
> **Phiên bản tài liệu:** 3.0 — cập nhật 13/10/2026 (thay toàn bộ bản 2.0: bỏ hướng 3D / spritesheet cũ)
> **Trạng thái:** Đang hoàn thiện bộ nhân vật cơ bản (Jessica — Sát Thủ, Rok — Chiến Binh)

---

## 📌 MỤC LỤC
1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Lối chơi cốt lõi](#2-lối-chơi-cốt-lõi)
3. [Hệ thống chiến đấu](#3-hệ-thống-chiến-đấu)
4. [Class & nhân vật](#4-class--nhân-vật)
5. [Quái vật](#5-quái-vật)
6. [Hiệu ứng trạng thái](#6-hiệu-ứng-trạng-thái)
7. [Đồ hoạ: nhân vật 2D ghép mảnh](#7-đồ-hoạ-nhân-vật-2d-ghép-mảnh)
8. [Kiến trúc kỹ thuật](#8-kiến-trúc-kỹ-thuật)
9. [Chế độ đánh thử (Test Mode)](#9-chế-độ-đánh-thử-test-mode)
10. [Quy trình thêm nhân vật mới](#10-quy-trình-thêm-nhân-vật-mới)
11. [Lộ trình](#11-lộ-trình)

---

## 1. TỔNG QUAN DỰ ÁN

| Hạng mục | Chi tiết |
| :--- | :--- |
| **Tên game** | Legend of Capsules |
| **Thể loại** | Nhập vai **chiến thuật tự đánh (tactical auto-battle)** theo đội hình |
| **Góc nhìn** | **Ngang (side view)** khi chiến đấu — nhân vật 2D ghép mảnh đứng trong cảnh 3D |
| **Nền tảng** | Web (HTML5 / WebGL), chạy trên trình duyệt máy tính & điện thoại |
| **Công nghệ** | Client: Three.js + Vite · Server: Node.js + Express + Socket.io |
| **Phong cách** | Chibi đầu to, giáp & phụ kiện chi tiết, hiệu ứng kỹ năng rực rỡ |

**Ý tưởng chính:** người chơi xây đội hình nhiều nhân vật thuộc các *class* khác nhau. Trong trận, nhân vật **tự di chuyển và tự đánh thường**; người chơi chỉ quyết định **khi nào dùng kỹ năng nào** (hoặc bật AUTO). Chiều sâu nằm ở việc phối hợp kỹ năng giữa các nhân vật (gắn Ấn → lướt chém, khiêu khích → bảo vệ đồng đội...).

---

## 2. LỐI CHƠI CỐT LÕI

- **Đội hình:** tối đa **4 nhân vật** ra trận; một trận có thể gặp **5–6 quái**.
- **Không điều khiển di chuyển** (không WASD). Người chơi **click vào thẻ kỹ năng** của từng nhân vật để ra lệnh — áp dụng cho mọi nhân vật, không có phím tắt kỹ năng.
- **AUTO:** tự dùng kỹ năng khi đủ Orb (ưu tiên Kỹ năng 3 → 2 → 1).
- **Hàng đợi kỹ năng:** click nhiều kỹ năng sẽ xếp hàng; click lại kỹ năng đang chờ để huỷ.
- **Tốc độ trận:** x1.0 / x1.5 / x2.0 (nút ⏩ hoặc phím **T**). Chỉ số được cân bằng ở mức **x1.5**; mọi hồi chiêu, tốc đánh, hiệu ứng, di chuyển đều chạy theo "đồng hồ trận".
- **Kiểu niệm chú:**
  - **Niệm nhanh** — dùng ngay lập tức (toàn bộ kỹ năng của Jessica và Rok).
  - **Niệm trung bình** — đứng niệm một khoảng ngắn, có thanh niệm.
  - **Niệm lâu** — niệm dài, có thể bị ngắt (choáng).
- **Mở màn:** đếm ngược 3‑2‑1, camera lướt vào, từng nhân vật rơi xuống đáp đất rồi vào thế sẵn sàng.

---

## 3. HỆ THỐNG CHIẾN ĐẤU

Toàn bộ tính toán diễn ra **trên server** (vòng lặp 50ms); client chỉ hiển thị.

### 3.1 Chỉ số (thang 1000 = 100%)

| Chỉ số | Ý nghĩa |
| :--- | :--- |
| HP / MP | Máu / năng lượng (MP tối đa 5000 = 5 Orb) |
| P.ATK / M.ATK | Công vật lý / phép |
| P.DEF / M.DEF | Thủ vật lý / phép |
| Crit | Tỉ lệ chí mạng (‰) |
| Crit DMG | Sát thương chí mạng cộng thêm (‰) — hệ số chí mạng = **1.5 + Crit DMG** |
| Accuracy | Chính xác (1000 = 100%); phần **vượt 100%** trừ thẳng vào Né của mục tiêu |
| Dodge | Né (‰) |
| Penetration | Xuyên giáp (‰) |
| Block | Chặn đòn (‰) — chặn giảm 50% sát thương |
| Lifesteal | Hút máu (chưa dùng) |
| MP/Atk, MP/s | Hồi MP mỗi đòn đánh / mỗi giây |
| Atk Speed | Thời gian giữa 2 đòn đánh (ms, càng nhỏ càng nhanh) |

### 3.2 Quy trình tính sát thương

```
1. Né       : tỉ lệ né = max(0, Dodge_mục_tiêu − max(0, Acc_kẻ_đánh − 1000))  -> MISS
2. Gốc      : ATK × hệ số kỹ năng
3. Chí mạng : (Crit + nội tại) -> × (1.5 + Crit DMG)
4. Chặn     : chỉ khi KHÔNG chí mạng, theo Block -> × 0.5
5. Giáp     : DEF hiệu dụng = DEF × (1 − Xuyên giáp);  giảm = DEF / (DEF + 300)
6. Đặc biệt : Dựng Khiên -> 0 sát thương (BLOCK);  Thành Trì -> giảm theo %
7. Kết quả  : max(1, sát thương × (1 − giảm))
```

Quái **Hỗ Trợ** đánh phép (M.ATK vs M.DEF); còn lại đánh vật lý.

### 3.3 Orb & hàng đợi kỹ năng
- **1 Orb = 1000 MP**, tối đa 5 Orb. MP hồi theo giây (MP/s) và mỗi đòn đánh trúng (MP/Atk).
- Kỹ năng tốn 1 / 2 / 3 Orb (Kỹ năng 1 / 2 / 3) và có hồi chiêu riêng.
- Kỹ năng cần cự ly (VD Đẩy Khiên) → nhân vật tự đi tới tầm rồi mới dùng.

### 3.4 Chọn mục tiêu
- Mặc định đánh mục tiêu tốt nhất gần nhất; mục tiêu **đang tàng hình không thể bị chọn**.
- Bị **Khiêu Khích / Sư Tử Gầm**: buộc đánh người gầm.
- Sau khi lướt (Đột Kích) nhân vật **khoá mục tiêu** cuối cùng.

---

## 4. CLASS & NHÂN VẬT

**Class = vai trò** (Sát Thủ, Chiến Binh...). Mỗi class có **nhiều nhân vật** khác nhau với ngoại hình và bộ kỹ năng riêng.

### 4.1 Jessica (Lôi Ám) — Sát Thủ 🥷
*Lối chơi: COMBO BỘC PHÁ — gắn Ấn bằng bùa → tàng hình → lướt chém nổ to. Màu chủ đạo: sấm sét tím đen.*

| HP | MP | P.ATK | P.DEF | M.DEF | Crit | Crit DMG | Dodge | Pen | Block | Tốc đánh | Tầm |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 1200 | 5000 | 220 | 50 | 50 | 35% | ×2.0 | 20% | 15% | 5% | 800ms | 2.4 |

| Kỹ năng | Orb / Hồi | Mô tả |
| :--- | :-: | :--- |
| **1. Phóng Bùa** | 1 / 7s | Lộn mèo nhảy lùi 5 đơn vị rồi phóng bùa thẳng vào quái **ít máu nhất** (×1.5). Trúng: gắn **Ấn** 7s (−15% P.DEF). Đang tàng hình: phóng 2 lá vào 2 quái ít máu nhất. |
| **2. Đột Kích** | 2 / 7s | Khuỵu người, biến mất trong khói rồi **lướt chém lần lượt mọi quái có Ấn**: máu nhiều trước, dừng lại sau lưng quái **ít máu nhất** (×2.5 ×1.8 với quái có Ấn). Không có Ấn: lướt ra sau mục tiêu tốt nhất (×2.5). Đang tàng hình: **chắc chắn chí mạng**. |
| **3. Tàng Hình** | 3 / 10s | Kết ấn, nhắm mắt, khói bùng → tàng hình **5s**: không thể bị chọn, +20% P.ATK, +10% tốc đánh. **Không bị phá khi ra đòn.** Có hào quang sấm tím + mắt phát sáng; đòn chém đổi sang vệt sấm tím đen. |
| *Nội tại: Đánh Lén* | — | +50% tỉ lệ chí mạng khi đánh **sau lưng** hoặc **đang tàng hình**. |

### 4.2 Rok (Thiết Hộ) — Chiến Binh 🛡️
*Lối chơi: đứng đầu hàng giữ quái, máu & thủ cao, đánh chậm. Tay gần cầm kiếm, tay xa cầm khiên tròn lớn. Màu chủ đạo: vàng kim.*

| HP | MP | P.ATK | P.DEF | M.DEF | Crit | Crit DMG | Dodge | Pen | Block | Tốc đánh | Tầm |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 3200 | 5000 | 150 | 220 | 160 | 8% | ×2.0 | 5% | 5% | 25% | 1200ms | 2.4 |

| Kỹ năng | Orb / Hồi | Mô tả |
| :--- | :-: | :--- |
| **1. Sư Tử Gầm** | 1 / 9s | Giơ kiếm gầm vang, **linh hồn sư tử vàng** lao ra kèm sóng âm. Mọi quái trong bán kính 9 phải đánh Rok trong **4s** và bị **−10% P.DEF / M.DEF**. |
| **2. Đẩy Khiên** | 2 / 8s | Húc khiên vào quái **trước mặt (đang đánh)**: sát thương ×1.0, **hất văng ra sau 5 đơn vị** (bằng cú nhảy lùi của Jessica); đáp đất xong **choáng 1s**. Hiệu ứng khiên ánh sáng + luồng gió. |
| **3. Dựng Khiên** | 3 / 15s | **Aura Thiết Vệ**: vòm lục giác vàng lớn, **đỡ mọi đòn** vào Rok trong **5s** (hiện BLOCK); Rok đứng thủ, không đánh. **Cả đội +20% P.DEF / M.DEF** (đồng đội có 3 khiên nhỏ bay quanh người). Dùng Kỹ năng 1 hoặc 2 trong lúc này → **khiên tự hạ** (mất cả buff đội). AUTO không tự hạ khiên. |
| *Nội tại: Ý Chí Thép* | — | Máu dưới 30%: +25% chặn đòn. |

**Đòn đánh thường của Rok:** bổ dọc — vung kiếm qua đầu (lưỡi ngả ra sau) rồi bổ mạnh xuống phía trước, vệt chém thép sáng gần thẳng đứng.

---

## 5. QUÁI VẬT

| Quái | HP | ATK | P.DEF / M.DEF | Đặc điểm |
| :--- | :-: | :-: | :-: | :--- |
| **Tanker** 🛡️ | 5000 | 150 (vật lý) | 300 / 200 | Chặn 40%, đánh chậm (1500ms), cận chiến |
| **Xạ Thủ** 🏹 | 3000 | 250 (vật lý) | 100 / 100 | Tầm xa 10, chính xác 110%, xuyên giáp 30% |
| **Hỗ Trợ** 🪄 | 3000 | 120 (phép) | 100 / 200 | Tầm 6, đánh phép |
| **Cọc Gỗ** 🪵 | 9.999.999 | 0 | 500 / 500 | Chỉ để test, không đánh, bất tử; máu đặt sẵn 100%, 85%, 70%... |

Quái hiện vẽ bằng code (hình "capsule" dễ thương) cho tới khi có tranh.

---

## 6. HIỆU ỨNG TRẠNG THÁI

| Hiệu ứng | Nguồn | Tác dụng |
| :--- | :--- | :--- |
| **Ấn** | Phóng Bùa | 7s, −15% P.DEF; Đột Kích lướt qua mọi quái có Ấn |
| **Tàng Hình** | Tàng Hình | 5s, không thể bị chọn, +20% P.ATK, +10% tốc đánh |
| **Sư Tử Gầm** (taunted) | Sư Tử Gầm | 4s, buộc đánh Rok, −10% P.DEF / M.DEF |
| **Bị hất văng** (knocked) | Đẩy Khiên | 0.45s đang bay, không hành động |
| **Choáng** | Đẩy Khiên | Đứng im, không đánh, bị ngắt niệm (sao xoay trên đầu) |
| **Dựng Khiên** (guard) | Dựng Khiên | 5s, miễn toàn bộ sát thương, đứng thủ |
| **Khiên Hộ Đội** (guard_aura) | Dựng Khiên | 5s, +20% P.DEF / M.DEF cho cả đội |
| **Thành Trì** (fortress) | (dự phòng) | Giảm sát thương nhận theo % |

Bảng chỉ số trong trận tô **xanh** khi được buff, **đỏ** khi bị giảm, kèm thẻ hiệu ứng và thời gian còn lại.

---

## 7. ĐỒ HOẠ: NHÂN VẬT 2D GHÉP MẢNH

Mọi nhân vật được vẽ theo kiểu **2D nhìn nghiêng, ghép mảnh (cutout) + gắn xương bằng code** — giống các game anime 2D. Đổi skin / hiệu ứng sau này chỉ cần thay hình.

### 7.1 Quy trình tranh → nhân vật
1. **Thiết kế** (`art/<tên>/`): 1 ảnh nhân vật hoàn chỉnh (mẫu) + bảng mảnh rời (đầu, tóc, thân, tay trên/dưới, bàn tay nhiều kiểu, chân, vũ khí) + bảng biểu cảm mắt.
2. **Đóng gói atlas:** `python tools/build_atlas.py art/<tên>/atlas_spec.json` → `src/assets/sprites/<tên>_atlas.png` + `src/characters/cutout/<tên>Atlas.json` (tự tách mảnh, xoá nền, vá lỗ).
3. **Lắp ráp (rig):** `src/characters/cutout/<tên>Rig.js` — khai báo từng mảnh theo **toạ độ ảnh gốc**: điểm khớp (pivot), vị trí, lớp (z), độ tối tay/chân phía xa, các "da" thay thế (bàn tay nắm/xoè, biểu cảm mắt). Hỗ trợ nới ngang `sx` khi mảnh vẽ gầy hơn ảnh mẫu.
4. **Động tác (clips):** `src/characters/cutout/<tên>Clips.js` — mỗi động tác là chuỗi **tư thế** (góc từng khớp) dựng bằng `poseClip.js`.
5. **Đăng ký:** `src/characters/registry.js` (classId → rig, clips, chiều cao, hiệu ứng riêng, bảng hành động).

### 7.2 Quy ước tư thế (`poseClip.js`)
- Góc khớp tính bằng radian, dương = ngược chiều kim đồng hồ; `hips: [dx, dy]` dịch cả người.
- **Tự chạm đất:** mỗi tư thế tự dịch hông để bàn chân thấp nhất chạm đất (trừ tư thế `air`).
- `liftF: 1` — đưa cả tay xa (và đồ nó cầm) lên **trước thân** (khiên của Rok).
- `dropN: 1` — đưa cả tay gần xuống **sau đầu** khi giơ tay/kiếm qua đầu, để không che mặt.
- Rok: `blade(pose, hướng)` tự tính góc bàn tay sao cho **lưỡi kiếm** chĩa đúng hướng (0 = ra trước, 1.57 = lên trời); khiên tự giữ thẳng đứng.

### 7.3 Hành động dùng chung
Lặp: `idle, ready, move, cast, guard, stunned, dead, victoryIdle` · Một lần: `attack, hurt, land, victory` + hành động riêng (`throw, vanish, appear, stealth` của Jessica; `taunt, bash, guardStart` của Rok).
`CutoutCharacterView` lo: chuyển động mềm, chớp mắt, khăn/áo choàng đung đưa, rơi xuống đầu trận, nhảy/lộn, tàng hình, hiệu ứng trạng thái (sao choáng, hào quang sấm, vòm Aura Thiết Vệ, khiên nhỏ bay quanh...).

### 7.4 Hiệu ứng (VFX) chính — `src/vfx/`
Số sát thương, vệt chém (thường / chí mạng / sấm tím / thép), sét, hào quang sấm, bùa bay, dấu Ấn, khói, dư ảnh, sóng xung kích, **linh hồn sư tử** (`lionSpirit.js`, vẽ bằng canvas), khiên ánh sáng đẩy, vòm lục giác.

---

## 8. KIẾN TRÚC KỸ THUẬT

```
Trình duyệt (Three.js)                       Server (Node.js)
┌───────────────────────────┐   Socket.io   ┌──────────────────────────────┐
│ HUD / click kỹ năng        │ ───lệnh────▶ │ Phòng đấu, vòng lặp 50ms      │
│ Hiển thị nhân vật + VFX    │ ◀──trạng thái │ Đồng hồ trận (theo tốc độ)    │
│ Camera ngang ôm 2 phe      │ ◀──sự kiện── │ Tính sát thương, hiệu ứng, AI │
└───────────────────────────┘               └──────────────────────────────┘
```

- Server gửi `stateUpdate` 20 lần/giây (vị trí, máu, MP, hiệu ứng, đồng hồ trận) và sự kiện `autoAttack`, `skillExecuted`, `castStart`, `squadResized`...
- Client nội suy vị trí, phát động tác đúng **khoảnh khắc trúng đòn (hitTime)**, mọi hẹn giờ dùng `gameTimeout()` để khớp tốc độ trận.

### 8.1 Cấu trúc mã nguồn
```
server.js                 Server: CLASS_DEFS (chỉ số + kỹ năng), phòng đấu, vòng lặp, sát thương
index.html                Khung HTML + HUD
src/
  main.js                 Khởi động client + vòng lặp render
  config.js               Hằng số, đồng hồ trận (gameNow / gameTimeout)
  state.js                Trạng thái client dùng chung
  core/                   scene, camera rig (ngang / chéo, zoom, rung), cảnh quan
  net/socket.js           Kết nối & lệnh gửi server
  characters/
    CharacterView.js          lớp cơ sở (vị trí, máu, hướng mặt, đồng bộ server)
    CutoutCharacterView.js    nhân vật 2D ghép mảnh + hiệu ứng trạng thái
    registry.js               classId -> cách vẽ + bảng hành động
    cutout/                   rig, clips, atlas của từng nhân vật + poseClip.js; creatureRig.js (quái)
  combat/                 dựng trận, xử lý sự kiện chiến đấu -> động tác + VFX
  vfx/                    hiệu ứng (vfx.js, lionSpirit.js)
  ui/                     HUD, overlay, input (nút, kéo thả & phóng to bảng test)
  render/toon.js          vật liệu toon cho cảnh
  assets/sprites/         atlas nhân vật
art/                      tranh gốc + atlas_spec.json (không đóng gói vào game)
tools/                    build_atlas.py, slice_parts.py, trang xem thử (preview-cutout / preview-scene / fx-lion)
```

### 8.2 Công cụ xem thử (chạy `npm run dev`)
- `/tools/preview-cutout.html?rig=../src/characters/cutout/rokRig.js&clip=attack&t=0.1,0.2` — xem từng khung động tác.
- `/tools/preview-scene.html?team=assassin,warrior|monster_dummy` — xem nhân vật trong cảnh trận (console: `act(0,'attack')`, `step(0.5)`).
- `/tools/fx-lion.html` — xem hình linh hồn sư tử.

---

## 9. CHẾ ĐỘ ĐÁNH THỬ (TEST MODE)

Bật bằng `TEST_MODE = true` trong `server.js` (mặc định). Đội mình: Jessica + Rok; phe địch: Tanker, Xạ Thủ, Hỗ Trợ.

**⚙️ Công cụ Test** (trái): Bơm đầy Mana · Dùng skill miễn phí · Bất tử phe mình · **Nhân vật ra trận** — mỗi nhân vật 1 nút ON/OFF (luôn giữ ít nhất 1 người).
**👹 Tool Phe Địch** (phải): Triệu hồi 3 quái · Triệu hồi cọc gỗ · **Quái Bất Tử** · Thêm / bớt cọc (tối đa 8, cách nhau 3 đơn vị).
Mọi bảng **kéo thả được**, bấm tiêu đề để thu gọn, nút **−/+** (🔍−/🔍+ ở bảng chỉ số) để phóng to/thu nhỏ 0.5–1.5× (nhớ theo trình duyệt).

| Phím | Tác dụng |
| :--- | :--- |
| Click thẻ kỹ năng | Ra lệnh kỹ năng |
| Lăn chuột | Zoom camera |
| T | Đổi tốc độ trận |
| V | Đổi góc camera ngang ↔ chéo |
| I | Ẩn / hiện bảng chỉ số |
| P / Esc | Tạm dừng |

---

## 10. QUY TRÌNH THÊM NHÂN VẬT MỚI

1. **Server** (`server.js` → `CLASS_DEFS`): thêm classId với chỉ số, 3 kỹ năng (`name, orbCost, cooldown, castTime, type, ...`), nội tại; thêm vào `SQUAD_ORDER`. Kiểu kỹ năng mới → xử lý trong `executeSkill()`.
2. **Tranh** → `art/<tên>/` → `build_atlas.py` → `<tên>Rig.js` + `<tên>Clips.js` (mục 7).
3. **Đăng ký** trong `registry.js`: chiều cao, clips, bảng `anims` (tên hành động → clip + hitTime).
4. **Diễn xuất kỹ năng** trong `combat/events.js` (`onSkillExecuted` → hàm riêng gọi `playAction` + VFX).
5. **HUD:** tên nhân vật và kỹ năng tự lấy từ `CLASS_DEFS`; nút bật/tắt trong Công cụ Test tự xuất hiện.
6. Kiểm tra bằng các trang xem thử (mục 8.2) rồi vào trận thử.

---

## 11. LỘ TRÌNH

| Giai đoạn | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| **1. Lõi chiến đấu** | Server tick 50ms, sát thương 7 bước, Orb, hàng đợi kỹ năng, AUTO, tốc độ trận x1/x1.5/x2 | ✅ Xong |
| **2. Nhân vật cơ bản** | Hệ 2D ghép mảnh; Jessica (Sát Thủ); Rok (Chiến Binh); công cụ đánh thử | 🔄 Đang hoàn thiện động tác & hiệu ứng |
| **3. Mở rộng đội hình** | Thêm class (Pháp Sư, Xạ Thủ, Hỗ Trợ...), đội 4 người, xếp đội hình tránh chồng nhau, quái 5–6 con có tranh riêng | ⏳ Tiếp theo |
| **4. Hệ thống ngoài trận** | Skin, trang bị, nâng cấp nhân vật, bản đồ thế giới (góc camera chéo) | ⏳ |
| **5. Trực tuyến** | Tài khoản, lưu dữ liệu, PvP | ⏳ |
