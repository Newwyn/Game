# 📖 LEGEND OF CAPSULES — TÀI LIỆU THIẾT KẾ & KỸ THUẬT

> **Mã dự án:** `legend-of-capsules` · **Kho mã:** [github.com/Newwyn/Game](https://github.com/Newwyn/Game)
> **Phiên bản tài liệu:** 3.5 — cập nhật 14/10/2026 (hệ thống Level · Bậc S/SS/SSS · Tộc · thiên phú; logic theo animation; Cung Thủ Lyra)
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
- **AUTO (AI chiến thuật):** không bấm bừa khi đủ Orb mà xét tình huống mỗi 0.3s, mỗi lần chọn 1 kỹ năng, biết **để dành Orb** cho combo:
  - **Jessica:** chưa quái nào có Ấn → Phóng Bùa (miễn phí, hồi xong là ném) · có Ấn + đủ 4 Orb → Tàng Hình rồi Đột Kích chắc chí mạng · Đột Kích khi ≥2 quái có Ấn, quái có Ấn sắp chết, hoặc Ấn sắp hết · máu < 35% đang bị đánh → Tàng Hình / nhảy lùi thoát thân.
  - **Rok:** bị ≥2 quái đánh, máu < 60% đang bị đánh, hoặc đồng đội nguy hiểm → Dựng Khiên · quái đang đánh đồng đội → Sư Tử Gầm kéo về (gầm lấy sát thương diện rộng chỉ khi dư Orb, luôn chừa Orb cho Dựng Khiên) · quái cận chiến đè đồng đội → Đẩy Khiên · không bao giờ tự hạ khiên.
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
| **Loại sát thương** | **Vật lý** (dùng P.ATK, trừ theo P.DEF) hoặc **Phép** (M.ATK, trừ theo M.DEF). Jessica, Rok, Lyra: vật lý · quái Hỗ Trợ: phép. Số sát thương: **đỏ = vật lý, xanh dương = phép**. |
| **Khiêu khích** (Threat) | Hiện **mọi nhân vật / quái bằng nhau (100)** — chọn mục tiêu theo tầm & khoảng cách; chỉ hiệu ứng (Sư Tử Gầm...) mới ép mục tiêu (xem 3.4) |

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
- Vào trận **mọi tướng có sẵn 1,5 Orb** (1.500 MP); tộc **Human** (Thích Nghi) cộng thêm 0,5 Orb → 2 Orb.
- **1 Orb = 1000 MP**, tối đa 5 Orb. MP hồi theo giây (MP/s) và mỗi đòn đánh trúng (MP/Atk).
- Kỹ năng tốn 1 / 2 / 3 Orb (Kỹ năng 1 / 2 / 3) và có hồi chiêu riêng.
- Kỹ năng cần cự ly (VD Đẩy Khiên) → nhân vật tự đi tới tầm rồi mới dùng.
- **Phải gặp đối thủ mới dùng:** các điệu múa của Nerissa và Tàng Hình của Jessica chỉ dùng được khi có đối thủ còn sống trong **tầm bắn của Lyra (11)** quanh người dùng — tránh múa / tàng hình lúc chưa giao tranh làm camera chạy loạn. Bấm sớm thì lệnh nằm chờ (nhân vật vẫn tiến lên), gặp địch là dùng ngay; nút hiện nhãn đỏ **"chưa gặp địch"**. AUTO cũng chỉ chọn các chiêu này khi đã gặp địch.
- **AUTO từng tướng:** mỗi thẻ có nút **AUTO** (góc phải) — AUTO MODE cả đội đang tắt vẫn để riêng tướng đó tự dùng kỹ năng, các tướng khác bấm tay. Bật: nút vàng; AUTO MODE cả đội đang bật: nút viền vàng. Lựa chọn được nhớ theo trình duyệt (theo nhân vật), vào trận mới tự bật lại.

### 3.3b Logic theo animation (thời điểm chạm & thời gian diễn)
Server không trừ máu ngay lúc ra đòn mà **hẹn đúng lúc đòn chạm** — khớp với hình phía client (vung kiếm / nhả tên + thời gian tên bay):
- `impact` (ms trận): từ lúc ra chiêu tới lúc chạm. Đánh thường: `autoImpact` (Jessica 180, Rok 240, Lyra 400 = nhả tên 0.2s + bay 0.2s).
- `lock` (ms trận): thời gian diễn động tác — nhân vật **đứng yên, không đánh / chạy / ra chiêu khác** (trạng thái `acting`).
- **Hồi chiêu bắt đầu tính SAU khi diễn xong** (kỹ năng niệm: sau khi gồng + diễn xong). Bị choáng ngắt niệm → hồi chiêu tính từ lúc bị ngắt.
- Buff có thời lượng (VD Thần Phong Giáng Thế) tính từ lúc diễn xong: gọi Vệ Thần (0.38s) → bay lên → bay xong (1s) mới bắt đầu bắn, 8 giây hiệu lực tính từ đó.
- Máu, chết, đẩy lùi, choáng đều xảy ra đúng lúc chạm. Quái đã dính đòn chí tử đang bay tới thì không bị nhắm tiếp (tránh bắn thừa).

| Kỹ năng | impact | lock |
| :--- | :-: | :-: |
| Phóng Bùa | 620 (+120 mỗi lá) | 800 |
| Đột Kích | 380 (+150 mỗi mục tiêu) | 380 + 150×số mục tiêu + 460 |
| Sư Tử Gầm | 480 + 45×khoảng cách | 950 |
| Đẩy Khiên | 220 | 600 |
| Tiễn Gió Chớp | 540 | 800 |
| Thần Phong Giáng Thế | 380 (Vệ Thần hiện) | 1000 |
| Thần Tiễn Phá Thiên | 160 nhả + 300 xếp hàng + 70×thứ tự + 300 bay | 2000 gồng + 800 |

### 3.3c Luật khiên (áp dụng cho mọi nhân vật)
- Mỗi người chỉ có **1 khiên hứng sát thương** tại một thời điểm.
- Đang có khiên mà được thêm khiên → giữ **khiên nhiều máu hơn**. Khiên yếu hơn mất máu khiên nhưng **vẫn giữ hiệu ứng buff** của nó (vd +20% thủ, −30% khống chế, cánh miễn choáng) tới hết thời gian. HUD ghi "◇ Hiệu ứng khiên".
- **Khiên đặc trưng** luôn được dùng dù khiên khác nhiều máu hơn. Hiện có: **Dựng Khiên (skill 3 của Rok)**. Rok đang dựng khiên mà nhận Khiên Ánh Sáng của Seraphine → vẫn dùng khiên Rok, chỉ nhận buff từ khiên Seraphine. Rok không dựng khiên → nhận khiên Seraphine bình thường.
- Mã: `addShield()` / `activeShield()` trong `server.js` (thêm loại khiên mới vào `SHIELD_TYPES`, khiên đặc trưng ở `isSignatureShield`).

### 3.3d Kết thúc trận
- Trận kết thúc **ngay** khi một bên không còn nhân vật nào sống (linh hồn / hộ vệ không tính).
- Cả hai bên cùng gục trong cùng một nhịp → **HOÀ**.

### 3.4 Chọn mục tiêu & Khiêu khích
- **Ưu tiên mục tiêu TRONG TẦM ĐÁNH**: mục tiêu đang đánh còn trong tầm thì giữ nguyên; không ai trong tầm thì chạy tới con **gần nhất** (giữ mục tiêu cũ nếu nó chỉ xa hơn < 1,5 đơn vị để khỏi đổi qua đổi lại).
- Chỉ số **Khiêu khích** hiện bằng nhau cho mọi nhân vật / quái (100) — không còn ảnh hưởng chọn mục tiêu.
- Chỉ **hiệu ứng** mới ép mục tiêu: bị **Sư Tử Gầm** (Khiêu Khích) → buộc đánh Rok.
- Mục tiêu **đang tàng hình không thể bị chọn**.
- Sau khi lướt (Đột Kích của Jessica) nhân vật **khoá mục tiêu** cuối cùng; Lưỡi Hái Xuyên Hồn của Zerith thì **không khoá** — lướt xong tự chọn mục tiêu gần nhất (thường là con ở đích lướt).

---

### 3.5 Level · Bậc · Tộc · Class
Code: `progression.js` (bảng số liệu + hàm tính) · tiến trình người chơi lưu ở `data/progress.json` theo mã trình duyệt (`loc.clientId`).

**Thứ tự tính chỉ số:** gốc (= level 1, `CLASS_DEFS`) → + tăng theo level → × thưởng bậc → tộc → *(đồ — làm sau)* → buff/debuff trong trận → giới hạn trên.

**Level & bậc.** Level tối đa 60. Mỗi bậc có level tối đa; đầy thì phải **đột phá** (ngoài trận, có điều kiện) mới lên tiếp. Cấp kỹ năng tự lên theo bậc.

| Bậc | Level | Tăng chỉ số mỗi level | Thưởng khi đột phá lên | Cấp kỹ năng | Điều kiện đột phá lên bậc kế |
| :--- | :-: | :-: | :-: | :-: | :--- |
| Thường | 1 → 20 | ×1.0 | — | Lv1 | Đạt Lv20 |
| **S** | → 40 | ×1.25 (level 21–40) | +5% chỉ số chính | Lv2 | Đạt Lv40 |
| **SS** | → 60 | ×1.5 (level 41–60) | +8% chỉ số chính | Lv3 | Đạt Lv60 |
| **SSS** | 60 | — | +12% chỉ số chính | **Lv4 (max)** | — |

Chỉ số chính = HP, P.ATK, M.ATK, P.DEF, M.DEF. **Cấp kỹ năng chỉ tăng số liệu:** hệ số sát thương / máu khiên ×1.00 / 1.20 / 1.45 / 1.75 · % buff/debuff ×1.00 / 1.10 / 1.20 / 1.30 (Orb, hồi chiêu, hiệu ứng giữ nguyên).

**EXP.** Sau này level lên bằng vật phẩm EXP hoặc farm ải (quái test chưa cho EXP). EXP cần cho level L→L+1 = 50 × L^1.3 (làm tròn chục): Lv1 50 · Lv19 2,300 · Lv59 ~10,000 · cả 1→60 ~262,000. Đầy giới hạn bậc thì EXP giữ lại, đột phá xong dùng tiếp. *Nguyên liệu đột phá & hệ thống đồ: làm sau (chưa có trong game).*

**Tăng mỗi level theo class** (‰ = phần nghìn):

| Mỗi level | Chiến Binh | Phù Thủy | Tu Sĩ | Cung Thủ | Sát Thủ |
| :--- | :-: | :-: | :-: | :-: | :-: |
| HP | **120** | 45 | 70 | 50 | 55 |
| P.ATK / M.ATK | 6 / 0 | 0 / **12** | 2 / **8** | **9** / 0 | **10** / 0 |
| P.DEF / M.DEF | **9 / 6** | 2 / 5 | 4 / **7** | 2 / 3 | 3 / 3 |
| Chí mạng · Chính xác | 1 · 1‰ | 2 · 2‰ | 1 · 1‰ | **4 · 4‰** | **5** · 2‰ |
| Né · Xuyên giáp · Chặn | 0.5 · 1 · **3**‰ | 1 · **3** · 0‰ | 1 · 1 · 1‰ | 2 · **3** · 0‰ | **3 · 3** · 0.5‰ |
| MP/giây | 1 | **3** | **3** | 1 | 1 |

**Thiên phú.** Cơ bản chỉ có **3 kỹ năng**. **Thiên phú 1 mở ở Lv20**, **thiên phú 2 mở ở Lv40**; cấp thiên phú tăng theo bậc. **Không còn "chỉ số riêng của class"**: class chỉ quyết định cách tăng chỉ số khi lên cấp; mỗi nhân vật có 2 thiên phú của riêng mình (Kiên Cường, Sát Ý, Ưng Nhãn, Hỏa Tốc là thiên phú 2 của Rok, Jessica, Lyra, Ignar).

| | Lv20 (Thường) / S | SS | SSS |
| :--- | :-: | :-: | :-: |
| Thiên phú 1 (mở Lv20, tối đa Lv3) | Lv1 | Lv2 | **Lv3** |
| Thiên phú 2 (mở Lv40, tối đa Lv2) | — (S đạt Lv40: Lv1) | Lv1 | **Lv2** |

| Nhân vật | Thiên phú 1 · Lv1 / Lv2 / Lv3 | Thiên phú 2 · Lv1 / Lv2 |
| :--- | :--- | :--- |
| Jessica | **Đánh Lén:** +30% / 40% / 50% chí mạng khi đánh sau lưng hoặc tàng hình · **Bóng Ẩn**: máu còn 50% → tàng hình 2s, nhảy ra sau lưng đối thủ yếu máu nhất (1 lần/trận) | **Sát Ý:** +20% / 35% sát thương lên mục tiêu < 50% máu (bật 10s, hồi 20s) |
| Rok | **Ý Chí Thép + Dây liên kết:** vào trận nối dây với đồng đội ATK cao nhất; Rok & người được nối: máu < 30% → +15% / 20% / 25% chặn đòn, kèm 5s hồi 3% máu/giây (hồi 10s); còn dây → thiên phú 1 & 2 trên riêng Rok ×2 | **Kiên Cường:** (Rok & người được nối) giảm 15% / 25% sát thương nhận & thời gian khống chế (sau 10 đòn, bật 10s, hồi 15s) · **Gánh đòn:** còn dây → người được nối chỉ nhận 50% sát thương, Rok gánh 50% còn lại |
| Lyra | **Phong Tiễn:** mũi gió xuyên ×0.6 / 0.7 / 0.8 · mọi mũi tên xuyên 30% / 40% / 50% giáp | **Ưng Nhãn:** tối đa +15% / 25% sát thương ở tầm 17+ (chỉ khi bật Thần Phong Giáng Thế) |

**Tộc** (theo nhân vật, không theo class): Lyra **Elf** · Jessica **Human** · Rok **Dragon**.

| Tộc | Chỉ số khi vào trận | Đặc tính |
| :--- | :--- | :--- |
| 🧝 Elf | +12% chính xác · +8% né · +10% hồi MP | **Linh Mẫn:** né được đòn → đòn kế tiếp +20% sát thương |
| 🧑 Human | +5% HP · ATK · DEF | **Thích Nghi:** vào trận có sẵn +500 MP |
| 🐉 Dragon | +15% HP · +10% P.DEF/M.DEF · −5% tốc đánh | **Vảy Rồng:** sát thương chí mạng nhận vào giảm 25% |
| 👺 Goblin | +10% chí mạng · +10% xuyên giáp · +10% tốc chạy · −10% HP | **Thừa Cơ:** đánh mục tiêu đang bị khống chế +15% |
| 😈 Devil | +12% P.ATK/M.ATK · +5% hút máu · −8% thủ | **Khế Ước Máu:** máu < 30% → +15% sát thương |

**Giới hạn trên:** chí mạng 75% (dư → sát thương chí mạng) · né 50% (dư → chính xác) · chặn 60% (dư → Kiên Cường) · Kiên Cường 30%.

**Ví dụ Lv40 SS** (đã tính tộc): Jessica HP 4,310 · P.ATK 786 · chí mạng 57% — Rok HP 11,059 · P.DEF 768 — Lyra HP 3,629 · P.ATK 676. Thiên phú: TP1 Lv2 · TP2 Lv1.

Chỉnh level / bậc để test: xem **🛠️ Tool Phe Mình** (mục 9).

---

## 4. CLASS & NHÂN VẬT

**Class = vai trò** (Sát Thủ, Chiến Binh...). Mỗi class có **nhiều nhân vật** khác nhau với ngoại hình và bộ kỹ năng riêng.

### 4.0 Bảng chỉ số tổng hợp (đã gồm tộc)

Lv1 · bậc Thường:

| Nhân vật | Class · Tộc | HP | ATK | P.DEF / M.DEF | Chí mạng | Né | Xuyên | Chặn | Tốc đánh | Tầm |
|---|---|---|---|---|---|---|---|---|---|---|
| Jessica | Sát Thủ · Human | 1.890 | 231 vật lý | 53 / 53 | 35% | 20% | 15% | 5% | 0,80s | 2,4 |
| Rok | Chiến Binh · Dragon | 3.680 | 150 vật lý | 242 / 176 | 8% | 5% | 5% | 25% | 1,26s | 2,4 |
| Lyra | Cung Thủ · Elf | 1.500 | 200 vật lý | 40 / 60 | 25% | 20% | 0% | 0% | 0,90s | 11 |
| Seraphine | Tu Sĩ · Human | 1.733 | 189 phép | 47 / 95 | 10% | 10% | 0% | 0% | 1,00s | 9 |
| Ignar | Phù Thủy · Human | 1.496 | 231 phép | 37 / 74 | 15% | 8% | 10% | 0% | 1,10s | 15 |
| Zerith | Sát Thủ phép · Devil | 1.725 | 235 phép | 46 / 55 | 25% | 16% | 12% | 3% | 0,85s | 2,8 |
| Brakk | Chiến Binh · Dragon | 4.600 | 180 vật lý | 198 / 154 | 10% | 5% | 8% | 10% | 1,21s | 2,4 |
| Nerissa | Tu Sĩ (vũ công) · Elf | 1.575 | 170 phép | 45 / 100 | 8% | 22% | 0% | 0% | 1,00s | 8 |
| Elarion | Phù Thủy nguyên tố · Elf | 1.500 | 240 phép | 40 / 75 | 10% | 16% | 0% | 0% | 1,05s | 14 |

Riêng: Lyra chính xác 122% · Nerissa, Elarion chính xác 112% · Zerith hút máu 5%. Mọi nhân vật: sát thương chí mạng ×2,0.

**Máu:** mọi tướng **không phải Chiến Binh** (trừ Rok, Brakk) có máu **×1,5** (`NON_WARRIOR_HP` trong `progression.js`, đã tính trong 2 bảng này; bảng chỉ số riêng từng nhân vật bên dưới là số gốc trước khi ×1,5).

Lv60 · bậc SSS:

| Nhân vật | HP | ATK | P.DEF / M.DEF |
|---|---|---|---|
| Jessica | 10.542 | 1.280 | 363 / 363 |
| Rok | 17.644 | 754 | 1.238 / 844 |
| Lyra | 8.954 | 1.100 | 239 / 358 |
| Seraphine | 12.562 | 1.030 | 455 / 811 |
| Ignar | 8.562 | 1.478 | 244 / 587 |
| Zerith | 9.945 | 1.351 | 318 / 330 |
| Brakk | 18.812 | 793 | 1.182 / 816 |
| Nerissa | 11.870 | 968 | 433 / 785 |
| Elarion | 8.249 | 1.401 | 239 / 565 |

Số liệu kỹ năng ghi ở các mục dưới là ở bậc Thường; lên bậc: sát thương / máu khiên / hồi máu ×1,2 (S) · ×1,45 (SS) · ×1,75 (SSS), các buff % ×1,1 / 1,2 / 1,3.

### 4.1 Jessica (Lôi Ám) — Sát Thủ 🥷
*Lối chơi: COMBO BỘC PHÁ — gắn Ấn bằng bùa → tàng hình → lướt chém nổ to. Màu chủ đạo: sấm sét tím đen.*

| HP | MP | P.ATK | P.DEF | M.DEF | Crit | Crit DMG | Dodge | Pen | Block | Tốc đánh | Tầm |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 1200 | 5000 | 220 | 50 | 50 | 35% | ×2.0 | 20% | 15% | 5% | 800ms | 2.4 |

Khiêu khích: **100** (như mọi nhân vật).

| Kỹ năng | Orb / Hồi | Mô tả |
| :--- | :-: | :--- |
| **1. Phóng Bùa** | **0 (miễn phí)** / 7s | Lộn mèo nhảy lùi 5 đơn vị rồi phóng bùa thẳng vào quái **ít máu nhất** (×1.5). Trúng: gắn **Ấn** 7s (−15% P.DEF). Đang tàng hình: phóng 2 lá vào 2 quái ít máu nhất. |
| **2. Đột Kích** | 2 / 7s | Khuỵu người, biến mất trong khói rồi **lướt chém lần lượt mọi quái có Ấn**: máu nhiều trước, dừng lại sau lưng quái **ít máu nhất** (×2.5 ×1.8 với quái có Ấn). Không có Ấn: lướt ra sau mục tiêu tốt nhất (×2.5). Đang tàng hình: **chắc chắn chí mạng**. **Chém chết (bất kỳ mục tiêu nào trong chuỗi) → hồi chiêu chỉ còn 1s.** |
| **3. Tàng Hình** | 2 / 10s | Kết ấn, nhắm mắt, khói bùng → tàng hình **5s**: không thể bị chọn, +20% P.ATK, +10% tốc đánh. **Không bị phá khi ra đòn.** Có hào quang sấm tím + mắt phát sáng; đòn chém đổi sang vệt sấm tím đen. **Sấm phù trợ: các đồng đội khác +20% né tránh trong 5s** (tia sét tím nháy quanh người). |
| *Thiên phú 1 (Lv20): Đánh Lén* | — | +30/40/50% tỉ lệ chí mạng khi đánh **sau lưng** hoặc **đang tàng hình**. **Bóng Ẩn:** máu tụt còn **50%** (1 lần mỗi trận) → phụt khói **tàng hình 2s** và tự **nhảy ra sau lưng đối thủ yếu máu nhất** (khoá đánh nó). |
| *Thiên phú 2 (Lv40): Sát Ý* | 10s | Đòn đánh trúng đối thủ **dưới 50% máu** → **chỉ đòn đó** +20/35% sát thương, rồi hồi 10s. |

**Jessica bản 3 — kiểu SPRITE + hiệu ứng tranh (20/10/2026, mặc định bật):**
- **Tạo hình mới:** nữ ninja trẻ, tóc đen ánh tím buộc đuôi ngựa cao (ruy băng tím treo 2 lá bùa nhỏ), mắt tím; đồ ninja đen ôm người phối tím đậm, viền vàng hình tia sét; khăn quàng tím 2 đuôi dài; xấp bùa giấy trắng chữ tím ở thắt lưng; 1 dao găm lưỡi tím cầm ngược.
- **Prompt:** `art/jessica/sprite/PROMPTS_SPRITE.md` (tạo hình `01-character-v3.png` + 9 tấm sprite) và `art/jessica/fx2/PROMPTS_FX.md` (4 tấm hiệu ứng: lá bùa + Ấn, vệt chém sấm, khói sấm + hào quang tàng hình, 8 hình nhỏ).
- **Khung chính ↔ mốc ra đòn:** chém 0,18s (khung 4) · Phóng Bùa lộn mèo 0,42s (khung 6) · phóng đứng 0,2s · hiện ra chém 0,18s · Tàng Hình 0,38s. Cơ chế / thông số không đổi.
- Khói, vệt chém thường, bụi, sao choáng: lấy từ 4 tấm hiệu ứng chung cả đội (`art/common/PROMPTS_FX_CHUNG.md`), nhuộm tím — **chờ tranh** (hiện vẫn bản code).
- **Tranh của người dùng** (giữ nguyên) trong `art/jessica/`: `01-character-v3.png`, `01b-portrait-v3.png`, `sprite/` 9 tấm nền xanh (72 khung), `fx2/` 4 tấm hiệu ứng.
- **Đóng gói sprite:** `tools/sprite_pack.py art/jessica/sprite/sprite_spec.json` → `src/assets/sprites/jessica_sprite.webp` (2,2 MB) + `src/characters/sprite/jessicaSprite.json`.
  - Tách nền `matte`; cỡ từng tấm đo bằng khớp mặt + dáng thủ thế so với `sprite-idle`; hàng "rơi vào trận" vẽ to hơn ~8% → hệ số nhóm 0,92 (phần tử thứ 4 của `groups`).
  - Điểm gắn `hand` (bàn tay ném: Phóng Bùa khung 6, phóng đứng khung 3) → lá bùa bay ra đúng tay (`events.js` `throwProjectiles`).
- **Khung ↔ động tác** (`src/characters/sprite/jessicaSprite.js`):

  | Động tác | Khung | Khung chính |
  |---|---|---|
  | đứng / thủ thế | idle1 / ready1 + thở (`?jessicaIdle=A` 4 khung) | — |
  | đánh thường | attack1–8 | khung 4 = 0,18s |
  | Phóng Bùa (lộn mèo) | throw1–8 (vòng lộn vẽ sẵn → `noSpin`, bỏ xoay lộn của khung xương) | khung 6 = 0,42s |
  | phóng bùa đứng | throwStand1–4 | khung 3 = 0,2s |
  | Đột Kích | vanish1–4 (thụp người) → dash1–4 lặp (dư ảnh) → appear1–4 | hiện ra: khung 3 = 0,18s |
  | Tàng Hình | stealth1–4 | khung 3 = 0,38s |
  | chạy / trúng đòn / choáng | move1–8 / hurt1–4 / stun1–4 (khung xương không có clip choáng → `FrameSpriteView` tự chạy tranh theo trạng thái) | — |
  | rơi vào trận / gục / thắng | land1–4 / dead1–4 / victory1–4 | — |
- **Hiệu ứng tranh:** `tools/fx_grid_pack.py art/jessica/fx2/fx2_spec.json` → `src/assets/sprites/jessica_fx2.webp` (0,9 MB) + `src/vfx/jessicaFx2.json`; code `src/vfx/jessicaFx.js`:
  - **Phóng Bùa:** lá bùa bay xoay (`spawnTalismanShot`) → trúng: loé, vỡ, hiện vòng Ấn (`spawnTalismanImpact`); dấu Ấn trên đầu quái = ấn sấm tím (`setSealIconFactory` trong `vfx.js`, vòng đếm ngược giữ nguyên).
  - **Đột Kích:** khói sấm bùng lúc biến mất (`spawnStealthBurst`), vệt lướt sấm + bóng mờ (`spawnDashStreak`), mỗi quái trúng vệt chém sấm (`spawnThunderSlash`), hiện ra từ vòng bóng tối (`spawnShadowRing`) chém + loé (`spawnSparkBurst`), chí mạng chém chữ X (`spawnThunderX`); chém chết → mũi tên vòng xoay (`spawnResetIcon`).
  - **Tàng Hình:** khói sấm bùng lúc kết ấn; hào quang sấm (`makeStealthAura`, gắn qua `visual.stealthFx`, thay hào quang + mắt sáng vẽ bằng code); đồng đội +né: cánh sét bật trên đầu (`spawnDodgeIcon`), tia sét nháy quanh người dùng tranh tia sét (`jessicaBoltTexture`).
  - **Đánh thường:** đang tàng hình → vệt chém sấm; chí mạng → chữ X sấm.
- **Xem:** `/tools/test-sprite.html?char=assassin&auto=1` (động tác) · `/tools/fx-jessica.html?s=all&auto=1` (s = attack | throw | strike | stealth); `?jessica=cutout` về bản khung xương.

### 4.2 Rok (Thiết Hộ) — Chiến Binh 🛡️
*Lối chơi: đứng đầu hàng giữ quái, máu & thủ cao, đánh chậm. Tay gần cầm kiếm, tay xa cầm khiên tròn lớn. Màu chủ đạo: vàng kim.*

| HP | MP | P.ATK | P.DEF | M.DEF | Crit | Crit DMG | Dodge | Pen | Block | Tốc đánh | Tầm |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 3200 | 5000 | 150 | 220 | 160 | 8% | ×2.0 | 5% | 5% | 25% | 1200ms | 2.4 |

Khiêu khích: **100** (như mọi nhân vật).

| Kỹ năng | Orb / Hồi | Mô tả |
| :--- | :-: | :--- |
| **1. Sư Tử Gầm** | 1 / 9s | Giơ kiếm gầm vang, **linh hồn sư tử vàng** lao ra kèm sóng âm. **Sát thương diện rộng ×0.8** lên mọi quái trong bán kính 9 (sóng lan tới đâu trúng tới đó), buộc chúng đánh Rok trong **4s** và **−10% P.DEF / M.DEF**. |
| **2. Đẩy Khiên** | 2 / 8s | Húc khiên vào quái **trước mặt (đang đánh)**: **sát thương đơn ×1.6**, **hất văng ra sau 5 đơn vị**, đáp đất xong **choáng 1s**. Đối thủ **rơi xuống đất gây địa chấn nhẹ**: mọi đối thủ khác trong **3 đơn vị** quanh chỗ rơi bị **choáng 0,5s** (không gây sát thương). |
| **3. Dựng Khiên** | 3 / 15s | **Thần Hộ Vệ** hiện trên đầu Rok + vòm lục giác. **(Bản mạnh)** Khiên = **20% máu tối đa của Rok**, tối đa **6s**; cứ mất **1/6 máu khiên** → khiên **nổ ×0.8** lên mọi quái trong **5,5 đơn vị**, choáng **0,5s**, cả đội hồi **2,5% máu**; kết thúc (hết giờ / vỡ / dùng kỹ năng khác) → nổ thêm lần cuối. Cả đội **+35% P.DEF / M.DEF** khi khiên còn. |
| *Thiên phú 1 (Lv20): Ý Chí Thép* | — | **Vào trận nối dây** (sợi xích ánh sáng vàng) với **đồng đội có ATK cao nhất** (P.ATK hoặc M.ATK theo kiểu đánh). Rok và người được nối: máu **dưới 30%** → **+15/20/25% chặn đòn**; lần tụt xuống dưới 30% → **5s, mỗi giây hồi 3% máu** (hồi 10s). Còn dây: chỉ số thiên phú 1 & 2 **trên riêng Rok ×2** (chặn đòn, hồi máu, Kiên Cường — Kiên Cường khi đó tối đa 50%). **1 trong 2 chết → đứt dây**, cả trận không nối lại với ai. |
| *Thiên phú 2 (Lv40): Kiên Cường* | — | Rok **và người được nối dây** (mỗi người tự đếm): **nhận đủ 10 đòn → bật 10s**, giảm 15/25% sát thương nhận và thời gian bị khống chế. Hết 10s thì **hồi 15s**. **Gánh đòn:** còn dây → mọi đòn trúng người được nối chỉ gây **50%**, Rok **gánh 50% còn lại** (khiên của Rok — Dựng Khiên — hứng trước; Kiên Cường của Rok đang bật thì giảm tiếp). Rok hiện số vàng `◈ -x`, khối sáng chạy dọc dây về Rok. |

**Đòn đánh thường của Rok:** bổ dọc — vung kiếm qua đầu (lưỡi ngả ra sau) rồi bổ mạnh xuống phía trước, vệt chém thép sáng gần thẳng đứng.

**Cân bằng sát thương kỹ năng (cấp 1).** Rok là Chiến Binh giữ quái nên sát thương kỹ năng ở mức *vừa đủ* — khoảng 1/4–1/3 đòn bộc phá của Jessica (Đột Kích lên quái có Ấn ≈ 770). Sau này nâng cấp kỹ năng sẽ tăng hệ số.

| Kỹ năng (P.ATK 150) | Gốc | Quái thủ 100 (Xạ Thủ, Hỗ Trợ) | Tanker (thủ 300) |
| :--- | :-: | :-: | :-: |
| Đánh thường ×1.0 | 150 | ~114 | ~77 |
| Sư Tử Gầm ×0.8 (diện rộng) | 120 | ~91 mỗi quái | ~62 |
| Đẩy Khiên ×1.6 (đơn) | 240 | ~182 | ~123 |
| Dựng Khiên: 1 lần nổ ×0.5 | 75 | ~57 | ~39 |
| Dựng Khiên: khiên chịu đủ 600 (6 lần nổ + 1 lần cuối) | 525 | ~400 mỗi quái | ~270 |

Máu khiên 600 ≈ 19% máu Rok: bị 3 quái đánh dồn thì vỡ sau ~3 giây (đã đo trong trận thử).

---

**Rok bản 3 — kiểu SPRITE + hiệu ứng tranh (20/10/2026, mặc định bật):**
- **Tạo hình mới:** hiệp sĩ trẻ châu Âu, tóc bạch kim, mắt xanh. Giáp tấm bạc viền vàng, áo trắng sư tử vàng, áo choàng xanh hoàng gia, trường kiếm chuôi vàng, khiên heater trắng có sư tử vàng.
- **Prompt:** `art/rok/sprite/PROMPTS_SPRITE.md` (tạo hình `01-character-v3.png` + 8 tấm sprite) và `art/rok/fx2/PROMPTS_FX.md` (4 tấm hiệu ứng).
- **Tranh của người dùng** (giữ nguyên) trong `art/rok/`: `01-character-v3.png`, `01b-character-v3.png` (giơ kiếm) và `sprite/`, mỗi tấm 4×2 = 8 khung:
  - `sprite-idle` (đứng 4 + thủ thế 4) và `sprite-attack`: PNG trong suốt sẵn;
  - `sprite-run` (chạy), `sprite-hurt-stun`, `sprite-taunt` (Sư Tử Gầm), `sprite-bash` (Đẩy Khiên), `sprite-guard-land` (Dựng Khiên 4 + rơi / đáp 4), `sprite-dead-victory`: nền xanh;
  - `sprite-move.png` (bản chạy đầu, làm bằng ChatGPT nền đen) không dùng — tóc nhạt hơn các tấm sau.
- **Đóng gói:** `tools/sprite_pack.py art/rok/sprite/sprite_spec.json` → `src/assets/sprites/rok_sprite.webp` (64 khung, 4074×1541, 2,5 MB) + `src/characters/sprite/rokSprite.json`.
  - Tách nền `key: "matte"`: giữ viền đen mảnh của lưỡi kiếm (cách cũ làm mép kiếm lởm chởm); tấm trong suốt dùng `key: "alpha"` (bỏ quầng sáng mờ).
  - Cỡ từng tấm ("scale") đo bằng cỡ đầu + độ trùng dáng thủ thế so với `sprite-idle`.
  - Mốc chân: đánh thường / Đẩy Khiên / Dựng Khiên theo gót chân sau (bước tới), chạy / rơi theo đầu, còn lại theo mũi chân trước.
  - Điểm gắn: `tip` (mũi kiếm, chém khung 4), `shield` (tâm khiên: gầm khung 4–5, húc khiên khung 3–4, Dựng Khiên khung 2–4) — dành cho Khiên Thần / sư tử.
- **Khung ↔ động tác** (`src/characters/sprite/rokSprite.js`):

  | Động tác | Khung | Khung chính |
  |---|---|---|
  | đứng (ngoài trận) | idle1 + thở (`?rokIdle=A` 4 khung, `B` 2 khung) | — |
  | thủ thế (trong trận) | ready1 + thở | — |
  | đánh thường | attack1–8 | khung 4 = 0,24s |
  | Sư Tử Gầm | taunt1–8 | khung 4 = 0,42s |
  | Đẩy Khiên / Đập Khiên | bash1–8 | khung 3 = 0,22s |
  | Dựng Khiên | guard1–3, rồi giữ guard3–4 lặp | khung 2 = 0,14s |
  | chạy / trúng đòn / choáng | move1–8 / hurt1–4 / stun1–4 | — |
  | rơi vào trận | land1 (trên không), land2–4 (đáp) | — |
  | gục / thắng | dead1–4 (vẽ sẵn nằm đất) / victory1–3, lặp victory3–4 | — |
- **Xem:** `/tools/test-sprite.html?char=warrior&auto=1`; `?rok=cutout` về bản khung xương.
- **Hiệu ứng tranh** (4 tấm nền đen của người dùng trong `art/rok/fx2/`): `tools/fx_grid_pack.py art/rok/fx2/fx2_spec.json` → `src/assets/sprites/rok_fx2.webp` (32 khung, 1,9 MB) + `src/vfx/rokFx2.json`; code `src/vfx/rokFx.js`. Mốc sát thương / thông số không đổi.
  - **Dựng Khiên — Khiên Thần** (`makeDivineShield`, gắn qua `visual.guardFx` của ROK; `CutoutCharacterView._updateIronGuard` dùng thay Thần Hộ Vệ + vòm lục giác):
    - cắm khiên (0,14s) → khiên hiện ra 4 khung → giữ lặp 4 khung, đứng trước Rok về phía quái;
    - cỡ KHỔNG LỒ (`GUARD_SCALE` = 2,5: thân khiên ~4,8 đơn vị ≈ 1,7 lần Rok, cả cánh + hào quang ~10,7), mũi khiên chạm đất, lùi sâu ra sau theo chiều sâu nên Rok + quái vẫn vẽ đè lên, rõ;
    - vòng thánh dưới chân Rok + khiên; khiên mờ dần theo máu khiên còn lại;
    - mỗi lần nổ (1/6 máu khiên): nổ sóng 4 khung + sóng vàng trên đất bán kính 5,5; lần nổ cuối: vỡ tan 4 khung rồi tắt;
    - cả đội: khiên nhỏ "+thủ" bật trên đầu; hồi máu khi nổ: dấu thập vàng bay lên.
    - Khung 2 tấm khiên căn theo sư tử vàng giữa khiên (`"align": "blob"`) nên đổi tấm không giật.
  - **Sư Tử Gầm** (`spawnRokRoar`): linh hồn sư tử lửa vàng KHỔNG LỒ (`ROAR_SCALE` = 3,3 — cao ~6,5 đơn vị, hơn 2 lần Rok; đứng sau nhân vật theo chiều sâu nên Rok + quái vẫn rõ) hiện trước Rok, lao về phía quái, gầm (khung lớn nhất) rồi tan; sóng gầm ")))" bật ra từ miệng + sóng vàng trên đất tới bán kính 9; rung màn hình mạnh hơn; quái bị khiêu khích hiện dấu đầu sư tử + "!" (`spawnTauntIcon`).
  - Số sát thương / chữ nổi (`canvasSprite` trong `vfx.js`) không ghi chiều sâu nữa → khung chữ trong suốt không khoét lỗ hiệu ứng lớn phía sau.
  - **Đẩy Khiên / Đập Khiên** (`spawnRokBash`): loé vàng ở mặt khiên (điểm `shield` của khung húc khiên); quái bay rơi xuống → vòng nứt địa chấn (`spawnRokQuake`).
  - **Ý Chí Thép:** dây liên kết thành **xích ánh sáng** (`makeChainTether`, nhiều đoạn tranh xích nối theo đường võng + đốm sáng chạy); hồi máu có dấu thập.
  - Xem: `/tools/fx-rok.html?s=all&auto=1` (s = attack | roar | push | guard | link).
  - Bản code cũ (đầu sư tử vẽ canvas, Thần Hộ Vệ, vòm lục giác, khiên ánh sáng bung, vụn lục giác) không còn dùng cho Rok; hàm vẫn nằm trong `vfx.js` / `guardianSpirit.js` / `lionSpirit.js`, dọn ở giai đoạn 3.

### 4.3 Lyra (Phong Tiễn) — Cung Thủ 🏹 · tộc Elf
*Lối chơi: bắn xa hàng sau, sát thương VẬT LÝ đều tay, mỏng máu. Màu chủ đạo: gió xanh ngọc. Hình: bộ tranh riêng `art/lyra/` (rig `lyraRig.js`); dây cung + mũi tên trên dây vẽ bằng code nên kéo căng / bật lại thật.*

| HP | MP | P.ATK | P.DEF | M.DEF | Crit | Crit DMG | Acc | Dodge | Pen | Tốc đánh | Tầm |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 1000 | 5000 | 200 | 40 | 60 | 25% | ×2.0 | 110% | 12% | 0% (+50% thiên phú) | 900ms | 9 |

Khiêu khích: **100** (như mọi nhân vật).

| Kỹ năng | Orb / Hồi | Niệm | Mô tả |
| :--- | :-: | :-: | :--- |
| **1. Tiễn Gió Chớp** | 1 / 6s | Nhanh | **Bật nhảy lùi 3 đơn vị** (không lộn, khói gió bung lúc bật và lúc đáp), bắn giữa không trung 1 mũi tên gió vào **mục tiêu đang nhắm** (không còn tự chọn quái ít máu nhất) trong tầm 11: ×1.2, **chắc chắn chí mạng**, **+50% xuyên giáp** (cộng thiên phú = **xuyên toàn bộ giáp**), không bị chặn; **đẩy lùi 2 đơn vị (không choáng)**. **Hạ gục → hoàn 1 Orb + hồi chiêu ngay.** Đơn mục tiêu. |
| **2. Thần Phong Giáng Thế** | 2 / 16s | Nhanh | **Vệ Thần Gió** hiện sau lưng trong 8s, mỗi đòn đánh thường của Lyra Vệ Thần bắn phụ 1 mũi ×0.5. Lyra **bay lên** (né kỹ năng đánh dưới đất), **+30% tốc đánh, +20% P.ATK, tầm đánh 11 → 19, +30% tỉ lệ chí mạng (→55%), +20% sát thương chí mạng (→×2.2)**. **Cả đội +20% chính xác** (Gió dẫn đường — dải gió ngọc xoáy quanh người). |
| **3. Thần Tiễn Phá Thiên** | 3 / 18s | **Lâu (2s)** | Gồng cung 2 giây (có Vệ Thần thì Vệ Thần gồng cùng), rồi **6 mũi tên** hiện ra **sau lưng xếp thành vòng cung**, lần lượt phóng đi như **tên lửa** (vọt ra, bẻ lái, lao tới chỉ trong 0.3s) tới **ngẫu nhiên mọi quái đang có** — mỗi quái ít nhất 1 mũi, không giới hạn tầm, mỗi mũi **×0.7**, **không bị chặn** (dồn hết 1 con = ×4.2). Có Vệ Thần: thêm **4 mũi ×0.5** (tổng **10 mũi**, tối đa ×6.2). **Bị choáng khi đang gồng → mất chiêu.** Dùng được khi đang bay. |
| *Thiên phú 1 (Lv20): Phong Tiễn* | — | — | Cứ **3 mũi tên thường → 1 mũi tên gió xuyên** mọi quái phía trước (tầm 14) ×0.6/0.7/0.8 (Vệ Thần cũng bắn, ×0.5 của Lyra) · **mọi mũi tên** Lyra và Vệ Thần bắn ra **xuyên 30/40/50% giáp**. |
| *Thiên phú 2 (Lv40): Ưng Nhãn* | — | — | **Chỉ áp dụng cho kỹ năng 1-2-3** (không tính đánh thường & mũi gió xuyên của Phong Tiễn): mục tiêu càng xa sát thương càng cao, tối đa +15/25% ở tầm 17+. |

**Xuyên giáp.** Giảm sát thương = Giáp hiệu lực / (Giáp hiệu lực + 300), Giáp hiệu lực = Giáp × (1 − xuyên giáp). Lyra xuyên 50% → giáp 300 (Tanker) chỉ còn tính 150: nhận **67%** sát thương thay vì 50% (≈ **+33%**); giáp 100 → nhận 86% thay vì 75% (+14%). Thiên phú mạnh dần khi gặp quái giáp dày — đúng vai "phá giáp" của Cung Thủ. Tiễn Gió Chớp xuyên 100% → giáp coi như 0.

**Cân bằng (cấp 1, P.ATK 200, chí mạng TB ×1.25).** Đánh thường lên Tanker ~165 / phát. Tiễn Gió Chớp lên Tanker ~480 (chí mạng, bỏ qua giáp). Thần Tiễn lên Tanker: mỗi mũi ~95 (chí mạng ~190) → 6 mũi dồn 1 con ≈ **700**; có Vệ Thần (+20% ATK) cả 10 mũi ≈ **1250** (≈25% máu Tanker). Khi nhiều quái, loạt tên chia đều ngẫu nhiên → tổng sát thương như nhau nhưng trải rộng (dọn quái yếu), không dồn được 1 con như bản ×4.0 cũ.

**AUTO chung:** chỉ tính "đang bị đánh" khi quái đã **áp sát trong tầm đánh** (quái còn đang chạy tới thì không tính). **Rok** không dùng kỹ năng khi quái còn xa (ngoài 9 đơn vị); Dựng Khiên cần có quái áp sát ≤ 3 đơn vị. AI không chọn chiêu mới khi nhân vật đang diễn chiêu — đầu trận chạy lên chặn trước, giữ Orb; Dựng Khiên chỉ khi đã giao chiến sát người (bị ≥2 quái đánh, hoặc máu < 60%, hoặc đồng đội nguy hiểm và ≥2 quái quanh Rok); Đẩy Khiên chỉ khi quái đứng ngay trước mặt.

**AUTO của Lyra:** kết liễu được bằng Tiễn Gió Chớp → bắn ngay · gọi Vệ Thần trước · gồng Thần Tiễn khi **không bị quái nào đánh** (tránh bị ngắt), ưu tiên lúc có Vệ Thần · dư Orb thì Tiễn Gió Chớp.

### 4.4 Seraphine (Thánh Quang) — Tu Sĩ ✨ · tộc Human
*Lối chơi: hỗ trợ hàng sau — hồi máu, khiên, niệm buff cả đội; sát thương PHÉP (cầu ánh sáng). Màu chủ đạo: vàng kim – trắng. Tranh: `art/seraphine/` (rig `seraRig.js`, hiệu ứng thiên thần / Hộ vệ ánh sáng: `sera_fx.png`).*

| HP | MP | M.ATK | P.DEF | M.DEF | Crit | Né | Tốc đánh | Tầm | Hồi MP (đòn / giây) |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 1100 | 5000 | 180 | 45 | 90 | 10% | 10% | 1000ms | 8 | 220 / 140 |

Khiêu khích: **100** (như mọi nhân vật).

| Kỹ năng | Orb / Hồi | Bình thường | Đang Thánh Niệm |
| :--- | :-: | :--- | :--- |
| **1. Thánh Quang Trị Liệu** | 1 / 6s | Hồi **×2.0 M.ATK** cho đồng đội **yếu máu nhất** (chưa ai mất máu → tướng **nhiều máu nhất**) + **giải choáng**. Ánh sáng rọi xuống. | Hồi **×4.0 cho cả đội** + **giải mọi hiệu ứng bất lợi**; **thiên thần nhỏ** bay tới từng người. Hồi chiêu **3s**. |
| **2. Khiên Ánh Sáng** | 2 / 12s | Khiên **×2.0 M.ATK** trong 5s cho đồng đội yếu máu nhất (đầu trận → tướng nhiều máu nhất). Bong bóng sáng. | Khiên **×4.0 cho cả đội**, **mọc cánh**, +20% thủ, −30% thời gian bị khống chế. Hồi chiêu **5s**. **Tu Sĩ còn khiên cánh thì miễn choáng.** |
| **3. Thánh Niệm** | 3 / 20s | Giơ gậy → **bay lên niệm 10s** cùng **Hộ vệ ánh sáng**; chỉ **choáng** mới ngắt. Cả đội **+20% sát thương** (vật lý / phép theo từng người) và **mỗi 1s hồi ×0.2 M.ATK máu** cho cả đội (10 lần ≈ ×2.0). Dùng xong **hồi ngay Kỹ năng 1 & 2**. Trong lúc niệm không chạy / đánh thường, chỉ dùng Kỹ năng 1 & 2. | — |
| *Thiên phú 1 (Lv20): Ân Điển* | — | +10 / 15 / 20% hồi máu & khiên · hồi máu / khiên **giải mọi hiệu ứng bất lợi** · khi Niệm: cả đội **+10% thủ**, Tu Sĩ **+600 MP/giây** (đủ ~2 khiên + 3 lần hồi máu trong 10s niệm) | |
| *Thiên phú 2 (Lv40): Thiên Thần Hộ Mệnh* | 30s | Đồng đội chết → **thiên thần nhỏ bay tới xác hồi sinh** (bay 1.2s) với 30 / 50% máu + **2 giây bất tử** (miễn mọi sát thương, kháng cả Thần Chết phán quyết). | |

**AUTO của Seraphine:** đang niệm → khiên cả đội khi có quái đánh, hồi máu khi có người < 92% · niệm khi ≥2 quái đang đánh đội và mình không bị đánh (đội < 70% máu, có người < 45%, hoặc dư Orb) · hồi máu khi có người < 60% · khiên người chắn đòn khi bị đánh dồn.

**Tool:** mỗi thẻ nhân vật có nút **💀** (hạ gục ngay) để thử hồi sinh.

---

### 4.5 Ignar (Hỏa Ngục) — Phù Thủy 🔥 · tộc Human
Đứng hàng sau, sát thương **phép diện rộng**, vũ khí là quả cầu lửa trên tay.
Lv1: HP ~1.500 · M.ATK ~231 · P.DEF/M.DEF 37/74 · chí mạng 15% · né 8% · xuyên 10% · tốc đánh 1100ms · tầm 15 · khiêu khích 100.

| Kỹ năng | Orb / hồi | Mô tả |
|---|---|---|
| Đánh thường | — | Ném cầu lửa ×1.0 |
| **1. Thiên Hỏa Cầu** | 1 / 7s · niệm 1s (Hỏa Thần: tức thì) | Cầu lửa lớn rơi xuống chỗ quái đông nhất, nổ bán kính 5,5: **×2.0**, để lại biển lửa cháy thêm 3 lần ×0.3 (mỗi 0,6s). Quả thứ 2 (thiên phú) cũng để lại biển lửa |
| **2. Cột Lửa Phá Ma** | 2 / 14s · niệm 1s (Hỏa Thần: tức thì) | Chưởng xuống đất → vòng phép hiện 1s → nhiều cột lửa bùng **7 lần** (mỗi 0,4s, ×0.45, bán kính 5). Mỗi lần trúng −5% M.DEF, tối đa −25%, giữ 10s |
| **3. Hỏa Thần Giáng Lâm** | 3 / 25s · gồng 1,5s | Hộ Vệ Thần Lửa 15s (ném cầu lửa ×0.5 mỗi 1,5s), Ignar +25% M.ATK + **Khiên Lửa** (+30% M.DEF, −40% thời gian bị khống chế). Đánh thường → **Hỏa Chưởng** ×1.1 + lan ×0.6 (bán kính 2,5). **Cứ 3 đòn**: chưởng mọi quái ×1.3, choáng 0,5s, KN1 & KN2 hồi nhanh 1s |

Lúc Hỏa Thần: quả cầu nhỏ của KN1 xuất hiện 80% (chưa có thiên phú: 50%); KN2 vòng phép chỉ 0,4s và cột lửa +25% sát thương.
Thiên phú 1 (Lv20) **Thiên Hỏa Song Tinh**: +8/12/16% M.ATK · Thiên Hỏa Cầu 50% rơi thêm quả 2 (70%) · **Cột Lửa Phá Ma bùng thêm 3 lần** (7 → 10).
Thiên phú 2 (Lv40) **Hỏa Tốc**: lúc Hỏa Thần +20/30% tốc đánh · **Giáp Lửa** (riêng Ignar): máu **dưới 50%** → khiên lửa **10s** (máu khiên **30 / 40% máu tối đa**, +30% M.DEF, −40% thời gian khống chế) và **+1 Orb**; vừa bật **hất văng** đối thủ trong 4 đơn vị ra xa 3,5 đơn vị; khiên hết (vỡ / hết giờ / bị phá) → **nổ choáng 1s** đối thủ trong 4,5 đơn vị và **+1 Orb**. Hồi **25s** tính từ lúc bật.
Hình: `art/ignar/` (tranh toàn thân, tấm bộ phận, tay & mắt — bản khung xương) · `art/ignar/sprite/` (sprite, đang dùng) · `art/ignar/fx2/` (hiệu ứng bản 2, đang dùng). Hiệu ứng bản 1 (`fx-a/b/c.png`, `ignar_fx.png`) không còn dùng.
**Rig / động tác khung xương (bản thử 17/10/2026, nay chỉ dùng khi `?ignar=cutout`):**
- Tay xa 2 đốt: bắp tay `armF` (không hình, khuất dưới vạt vai) → khuỷu = gốc ống tay loe → cẳng tay `foreF` (ống tay) → `handF`. Các động tác cũ giữ y hình (`F(góc ống tay)`), động tác mới gập khuỷu + cổ tay.
- Bàn tay ngửa giữ lửa lấy từ tấm 03 (bàn tay cắt từ tranh 01 bị khuyết chỗ ngọn lửa vẽ sẵn đè lên).
- Atlas: `"pad": 24` + `"grow"` lớn hơn ở các đường cắt → hết vệt sáng ở cổ áo / thắt lưng khi nhân vật thu nhỏ (mipmap).
- **idle / ready / attack** viết lại kiểu **pháp sư điềm tĩnh**: tay gần + chân giữ sát dáng tranh (không lộ chỗ tranh gốc bị che), tay xa dẫn đòn bằng khuỷu + cổ tay, đường cong tốc độ (`poseClip` tuỳ chọn `ease`, chỉ Ignar bật). Mốc ra đòn giữ 0,25s, clip 0,6s.
- Lò xo nhỏ cho khăn vai (±0,035 rad).
- Các động tác khác (summon, bolt, charge, palm, volley, chạy, trúng đòn...) chưa chỉnh — vẫn như cũ.
- Xem thử: `/tools/test-ignar.html?mode=idle | ready | run` (`&left=1`, `&speed=1.5`, `&zoom=3&cx=..&cy=..`).

**Kiểu SPRITE (đủ mọi động tác, 19/10/2026 — mặc định bật):** người dùng thấy khung xương khựng, thích sprite (mỗi khung 1 hình vẽ trọn thân).
- **Tranh AI của người dùng** (nền xanh, giữ nguyên) trong `art/ignar/sprite/`. Mỗi tấm 4×2 = 8 khung:
  - `sprite-idle`, `sprite-attack`, `sprite-move`;
  - `sprite-hurt-stun` (trúng đòn 4 + choáng 4);
  - `sprite-summon`, `sprite-bolt`, `sprite-palm`, `sprite-volley`;
  - `sprite-charge-land` (gồng 4 + rơi / đáp 4);
  - `sprite-dead-victory` (gục 4 + thắng 4).
  - Prompt: `PROMPTS_SPRITE.md`.
- **Đóng gói:** `tools/sprite_pack.py art/ignar/sprite/sprite_spec.json [--debug soi.png]` → `src/assets/sprites/ignar_sprite.webp` (atlas cắt sát 80 khung, ×0,75, WebP) + `src/characters/sprite/ignarSprite.json`.
  - Tách nền xanh, tách khung.
  - Đưa mọi tấm về cùng cỡ ("scale" đo bằng độ trùng dáng thủ thế + bề ngang tóc).
  - Căn chân theo nhóm: `toe` mũi giày trước · `heel` gót sau · `body` giữa đầu (chạy, nhảy, gồng, Hỏa Chưởng).
  - Đo điểm bàn tay từng khung. Không tô sửa.
- **`src/characters/FrameSpriteView.js`** (kế thừa `CutoutCharacterView`): khung xương **vẫn chạy ẩn** → hitTime, onComplete, rơi vào trận, chết, choáng, hiệu ứng... giữ nguyên. Hình = 1 mặt phẳng đổi khung theo clip, bảng `clips` trong `sprite/ignarSprite.js`:

  | Clip | Khung | Cách chạy |
  |---|---|---|
  | attack · summon · bolt · palm · volley | 8 | `strike`: khung ra đòn = hitTime (khung 4 @0,25 · 5 @0,35 · 4 @0,25 · 3 @0,2 · 4 @0,3) |
  | move | 8 | theo thời gian clip chạy (0,52s), không nhún thêm |
  | hurt · stunned | 4 · 4 | theo clip |
  | charge | 2 + 2 | vào thế 0,24s rồi rung 8 khung/giây khi giữ |
  | fall / land | 1 / 3 | rơi (lộn nhào như cũ) → đáp đất |
  | victory / victoryIdle | 3 / 2 | ăn mừng → giữ dáng |
  | dead | 4 | 7 khung/giây rồi giữ khung nằm; bỏ xoay ngã 90° của khung xương |

  - Lửa trên tay: ngửa tay ở khung đứng / chạy / khung 1 và 8 các chiêu; nắm lửa khung 2–3 đánh thường.
  - Khung còn lại lửa ẩn; điểm cầu lửa / chưởng bay ra = bàn tay xa của khung ra đòn.
  - Nhảy (chưởng toàn thể, thắng) nhấc theo hông khung xương.
- **Cách đứng** `?ignarIdle=A|B|C` (A 8 khung · B 3 khung giống nhất 1-4-6 · **C 1 khung + thở bằng code, mặc định**). `?ignar=cutout` → về khung xương.
- **Xem:** `npm run dev` rồi mở `/tools/test-ignar-sprite.html?mode=tour&auto=1` (lần lượt mọi động tác, có chữ tên động tác), hoặc bấm đúp `xem_thu_ignar.bat`.
- **Hiệu ứng bản 2 (19/10/2026, đang dùng):** 9 tấm tranh AI nền đen trong `art/ignar/fx2/` (prompt `PROMPTS_FX.md`).
  - Đóng gói: `tools/fx_grid_pack.py art/ignar/fx2/fx2_spec.json [--preview soi.png]` → `src/assets/sprites/ignar_fx2.webp` + `src/vfx/ignarFx2.json`.
    - Cắt theo ô lưới; hình lấn ô bên cạnh gom theo vùng liền.
    - Tách nền đen giữ độ rực; vật tối (đá thiên thạch, giáp Hộ Vệ, đất cháy, đá văng, khiên tím) giữ đặc; khói xám giữ màu.
    - Căn khung theo ô / lõi trắng nóng / đáy; mỗi nhóm có pivot. Không tô sửa.
  - `src/vfx/fireFx.js` chạy khung (flipbook):

    | Hiệu ứng | Khung | Dùng ở |
    |---|---|---|
    | lửa tay `hand` | 4 lặp | luôn cầm (cả bản khung xương), quanh Khiên Lửa |
    | cầu lửa `ball` / xoáy `swirl` | 4 lặp | đánh thường, Hộ Vệ ném / Hỏa Chưởng, chưởng toàn thể |
    | trúng `hit` | 4 | `spawnIgnarHit` — mọi đòn Ignar trúng (Elarion vẫn dùng `spawnFireHit` cũ) |
    | nổ `boom` | 8 (lửa → khói) | Thiên Hỏa Cầu, Hỏa Chưởng, chưởng đất, Giáp Lửa vỡ |
    | thiên thạch `meteor` + vòng báo `warn` | 4 lặp | Thiên Hỏa Cầu (rơi gần thẳng, đuôi ngược hướng rơi) |
    | đất cháy `scorch` + lửa `flame` | 4 lặp | biển lửa |
    | `circleDim` → `circleLit` + cột lửa `pillar` | bùng 3 · cháy lặp 3 · tắt 2 | Cột Lửa Phá Ma |
    | `slam` + `shockRing` | — | chưởng xuống đất, sóng lửa nổ thiên thạch |
    | `summonCircle` + hào quang `aura` | 4 lặp | niệm KN1 / KN2 (nhỏ), gồng Hỏa Thần |
    | cánh `wing` | 4 (bung) | Hỏa Thần hiện, Giáp Lửa bật — 2 cánh nhìn nghiêng sau lưng, theo hướng mặt |
    | luồng chưởng `palm` | 4 | Hỏa Chưởng, chưởng toàn thể |
    | khiên `shield` | 4 lặp | lúc Hỏa Thần / Giáp Lửa |
    | Hộ Vệ `guard` | bay 4 · lấy đà 1 · ném 1 · gầm 2 | suốt Hỏa Thần; cầu lửa bay ra từ tay đang ném (`tip`) |

  - Xem: `/tools/fx-ignar.html?s=all&auto=1` (lần lượt mọi kỹ năng, mốc như server) · `s=attack | meteor | pillar | god | ward`.

### 4.6 Zerith (U Minh) — Sát Thủ 💀 · tộc Devil · sát thương PHÉP
Sát Thủ cầm **lưỡi hái tử thần**, đánh cận chiến bằng sát thương **phép**. Nhóm class Sát Thủ nhưng vì đánh phép nên mỗi level tăng **M.ATK** thay cho P.ATK.
Lv1: HP 1.725 · M.ATK ~235 · P.DEF/M.DEF 46/55 · chí mạng 25% · né 16% · xuyên 12% · hút máu 5% (Devil) · tốc đánh 850ms · tầm 2,8 · khiêu khích 100.

| Kỹ năng | Orb / hồi | Mô tả |
|---|---|---|
| Đánh thường | — | Bổ liềm ×1.0 (phép): giơ liềm ra sau đầu → quét qua đỉnh đầu → lưỡi móc bổ xuống trước mặt |
| **1. Lưỡi Hái Xuyên Hồn** | **0 (miễn phí)** / 7s · chỉ dùng khi quái **trong tầm đánh** | Lướt tối đa **15 đơn vị**, chém **mọi quái trên đường lướt** ×1.6. **Tự chọn đường lướt**: thử lướt về phía từng đối thủ trong tầm lướt, chọn đường xuyên được nhiều quái nhất, ưu tiên đích là tướng đánh xa / yếu máu ở hàng sau (vd Lyra); **dừng ngay sau lưng** con xa nhất trên đường (không lướt lố). Lướt xong tự đánh con gần nhất. AI chỉ lướt khi đáng (xuyên ≥ 2 quái hoặc tới được tướng đánh xa / con dưới 40% máu). Lúc Đêm Tử Thần: lướt lần 1 (tốn Orb) → **hồi chiêu ngay** + trong **5s** được lướt lần 2 **miễn phí** (tự bấm, nút nháy tím "MIỄN PHÍ"); lướt lần 2 xong mới hồi chiêu bình thường |
| **2. Lưỡi Hái Hất Hồn** | 2 / 10s · niệm 0,7s | Niệm: **lưỡi hái khổng lồ** hiện dần sau lưng, lưỡi trên đầu → vọt ra trước quét từ dưới lên: quái phía trước trong 3,5 đơn vị trúng ×2.2 và bị **hất tung 1s**. Lúc Đêm Tử Thần: **không cần niệm** (lưỡi hái hiện ngay), phạm vi **rộng 6 đơn vị**, quét lên rồi **bổ xuống** thêm ×1.2 |
| **3. Đêm Tử Thần** | 3 / 25s · niệm 1s | 10s: **Hộ Vệ Thần Chết** chiến đấu cùng (chém ×0.6 mỗi 1,2s; cứ chém đủ 2 nhát → 50% **tự dùng Lưỡi Hái Hất Hồn** miễn phí: hất tung quái quanh mục tiêu (4,5 đơn vị) ×2.2 rồi chém bổ xuống ×1.2), Zerith bay lơ lửng · +20% sát thương · +30% tốc đánh · −40% thời gian bị khống chế · **không thể chết** (máu tối thiểu 1, hiện đồng hồ cát). Đánh thường **chém lan** ×0.5 lên quái quanh mục tiêu (3 đơn vị) |

Thiên phú 1 (Lv20) **Phán Quyết Tử Thần**: vào giao tranh (có địch trong tầm 9) và mỗi 15s, Zerith chỉ tay gắn **Ấn Tử** lên **tất cả** nhân vật phe địch: **−20 / 27,5 / 35% hồi máu nhận được**; Ấn Tử **không thể bị gỡ bằng bất kỳ cách nào** (chỉ hết theo thời gian). **Lưỡi Hái Hất Hồn lúc Đêm Tử Thần** (cả nhát hất lên lẫn nhát bổ xuống) lên mục tiêu có Ấn Tử **phá sạch khiên** — các đòn khác của Zerith không phá khiên. Thanh máu mục tiêu hiện **vạch NGƯỠNG TỬ** (5 / 7 / 10%). Máu chạm ngưỡng tử (bởi **bất kỳ đòn nào**) → **THẦN CHẾT PHÁN QUYẾT**: Thần Chết hiện sau lưng, **nhấc mục tiêu lên không trung từ từ (1,1s)** rồi **chém**: có khiên → **vỡ khiên, rơi xuống** (sống); không khiên → **chết**. Trong lúc bị nhấc: mục tiêu **không bị đánh trúng, không bị chọn làm mục tiêu, không nhận hiệu ứng mới**, trận bên dưới vẫn diễn ra. Xong thì **mất Ấn Tử**, chờ lượt gắn sau. Đang có **2 giây bất tử sau hồi sinh** (Thiên Thần Hộ Mệnh của Sera) thì **kháng được** phán quyết.
Thiên phú 2 (Lv40) **Linh Hồn Báo Thù**: lần đầu gục ngã → hóa **linh hồn Thần Chết** chiến đấu tiếp 7s với **60/80%** sức mạnh (bay tới chém ×1.2, lan ×0.5 bán kính 2,5 mỗi 0,9s). Linh hồn **bất tử**: không có máu, không bị chọn làm mục tiêu, không bị khống chế. Được Tu Sĩ hồi sinh thì Zerith **đánh chung** với linh hồn tới hết 7s. Chỉ 1 lần mỗi trận (gục lần sau không có linh hồn nữa). Linh hồn **không giữ trận**: cả đội gục là thua ngay.
AI: áp sát → bật Đêm Tử Thần → Lưỡi Hái Hất Hồn khi có cụm quái trước mặt → Lưỡi Hái Xuyên Hồn (có lượt miễn phí thì lướt luôn).
Động tác: cán liềm xoay quanh nắm tay bằng khớp riêng `scy` (bàn tay giữ nguyên) — tư thế viết theo góc cán liềm ngoài thế giới (`zerithClips.js`). Xem thử hiệu ứng: `/tools/fx-zerith.html`.
Hình: `art/zerith/` (tranh toàn thân nền trong suốt, tấm bộ phận, tay & mắt, hộ vệ 4 tư thế, 2 tấm hiệu ứng nền đen) → `tools/cut_reference.py art/zerith/ref_spec.json` (nhân vật) và `tools/build_fx_atlas.py art/zerith/fx_spec.json` (hiệu ứng → `zerith_fx.png`, vẽ ở `src/vfx/zerithFx.js`).

### 4.7 Brakk (Cuồng Đấu) — Chiến Binh đô vật 🐉 · tộc Dragon
Đô vật cơ bắp cởi trần, **máu trâu bò**, đánh tay không. Mọi kỹ năng tốn **Orb + MÁU** (% máu tối đa, hiện số cam "♥ −x"; không bao giờ tự làm chết — tối thiểu còn 1 máu). AI không dùng chiêu khi máu < 15%.
Lv1: HP 4.000 · P.ATK 180 · P.DEF/M.DEF 180/140 · chí mạng 10% · chặn 10% · xuyên 8% · né 5% · tốc đánh 1150ms · tầm 2,4 · khiêu khích 100.

| Kỹ năng | Orb + máu / hồi | Mô tả |
|---|---|---|
| Đánh thường | — | Đấm thẳng ×1.0 (vật lý) |
| **1. Bá Vương Quật** | 1 + 4% / 8s · tầm 2,6 | **Túm** quái trước mặt → nhảy vọt RẤT CAO (camera tự nâng lên theo) nhấc nó qua đầu → **quật** xuống 1 điểm cố định phía trước (4 đơn vị), Brakk đứng lại đó. Diễn ~1s: nhảy vọt CAO, quật ở 0,85s. Mục tiêu ×1.8 + **choáng 1s**; chấn động khi chạm đất ×1.0 lên mọi quái khác trong 3 đơn vị. Khổng Lồ: **+30% sát thương**, chấn động **4,5** đơn vị. Mục tiêu đang miễn khống chế thì không túm được (chỉ ăn đòn) |
| **2. Chấn Địa** | 2 + 6% / 12s · niệm 1s | Bật **cao** rồi **dậm** xuống (chạm đất 0,6s): ×1.4 mọi quái trong 4 đơn vị, **hất tung 1s**; Brakk được **khiên = 25% máu HIỆN CÓ** (10s). Khiên **cộng dồn** với khiên thiên phú 1 thành 1 lớp dày hơn, dùng lại thì **làm mới 10s**. Khổng Lồ: quái **rơi xuống** chịu thêm ×0.8 |
| **3. Thần Lực Khổng Lồ** | 3 + 8% / 25s · niệm 0,5s | Hoá **khổng lồ** 10s (cả bộ hình đổi sang dạng khổng lồ, mắt trắng rực, to thêm 25%, hào quang rồng lửa): **+50% máu tối đa** (hồi đúng phần tăng; hết giờ thì máu tối đa trở lại cũ) · **+40% P.DEF/M.DEF** · **+25% sát thương**. **5 giây đầu miễn mọi hiệu ứng bất lợi** (choáng, hất tung, đẩy lùi, khiêu khích, debuff — trừ Ấn Tử; vương miện vảy rồng trên đầu). Đánh thường **đầu tiên** và cứ **sau 3 đòn thường**: **móc ngược** ×1.3 hất tung 0,8s + hất văng 3 đơn vị |

Thiên phú 1 (Lv20) **Khí Thế Đấu Trường**: phe địch dùng đủ **5 chiêu** → Brakk hồi **8 / 10 / 12%** máu (hồi 10s); phe mình (kể cả Brakk) dùng đủ **5 chiêu** → khiên **10 / 12 / 15%** máu trong 10s, **cộng dồn** với khiên Chấn Địa (hồi 20s). Đang hồi thì không đếm. Thêm **Tiếng Hét Bảo Hộ**: khi có **đồng đội** (không tính Brakk) **dưới 50% máu** → Brakk tự **gầm lên khiêu khích TẤT CẢ đối thủ 3s** (buộc đánh Brakk, **không gây sát thương**; địch đang miễn khống chế thì không dính), hồi **10s**.
Thiên phú 2 (Lv40) **Long Huyết Bất Khuất**: máu tụt **dưới 50%** → Brakk hồi **25%** (SSS **30%**) máu, đồng đội hồi **10%** (SSS **15%**), **cả đội +1 Orb** (SSS **+2**) và được **giải mọi hiệu ứng bất lợi** (Ấn Tử thì không). Hồi 20s. Thêm **Độc Long**: khi đồng đội đã gục hết, **chỉ còn 1 mình Brakk trên sân** → mọi sát thương của Brakk **×2** (hào quang rồng lửa nhạt quanh người; đồng đội được hồi sinh thì tắt). Vừa còn 1 mình → **tự hoá Khổng Lồ MIỄN PHÍ** (không tốn Orb / máu, không tính hồi chiêu); đang Khổng Lồ rồi thì **làm mới thời gian** Khổng Lồ (10s). Mỗi lần bị bỏ lại 1 mình kích hoạt 1 lần.
AI: áp sát (≤ 4 đơn vị) → Khổng Lồ → Chấn Địa khi có ≥ 2 quái quanh mình / đang bị đánh dồn / máu < 70% / đang Khổng Lồ → Bá Vương Quật quái trước mặt (khi Khổng Lồ, dư Orb hoặc mục tiêu yếu máu).
Hình (bản 2): ghép từ **tấm bộ phận vẽ riêng** (đầu khớp tròn, không cắt từ tranh toàn thân nữa) — `art/brakk/` (tranh nhìn nghiêng + 3/4, tấm bộ phận, tay & mắt, tranh + tấm bộ phận **dạng khổng lồ**, 3 tấm hiệu ứng — fx-c là Tiếng Hét Bảo Hộ) → `tools/cut_reference.py art/brakk/ref_spec.json` (mỗi mảnh có 2 da `normal` / `giant`, `brakkRig.js`) và `tools/build_fx_atlas.py art/brakk/fx_spec.json` (→ `brakk_fx.png`, vẽ ở `src/vfx/brakkFx.js`). Xem thử dạng khổng lồ: `/tools/preview-cutout.html?rig=../src/characters/cutout/brakkRig.js&clip=roar&t=0.4&giant=1`; xem thử kỹ năng + hiệu ứng theo từng mốc: `/tools/fx-brakk.html?s=grab` (grab / stomp / giant / ggrab / gstomp / gup / blood / shout / end).

### 4.8 Nerissa (Thủy Vũ) — Tu Sĩ nước, vũ công dải lụa 🌊 · tộc Elf · sát thương PHÉP
Tu sĩ nước múa dải lụa: **buff MP** cho cả đội và **đốt MP để hồi máu**. Ba kỹ năng là **3 điệu múa chạy SONG SONG** — múa nhiều điệu cùng lúc thì mỗi **tổ hợp** có điệu múa (animation) riêng và hiệu ứng riêng (thiên phú 1). Trong lúc múa Nerissa **lượn qua lại thật** quanh chỗ bắt đầu múa (±1,5 ngang, ±0,7 sâu, 1 vòng 3s — quái phải đuổi theo), **không đánh thường**, vẫn bấm thêm được các điệu khác. Bị **choáng** hoặc **gục** → dừng mọi điệu.
Lv1: HP 1.575 · M.ATK 170 · P.DEF/M.DEF 45/100 · chí mạng 8% · né 22% · chính xác 112% · tốc đánh 1000ms · tầm 8.

| Kỹ năng | Orb / hồi | Mô tả |
|---|---|---|
| Đánh thường | — | Vung lụa bắn **giọt nước** ×1.0 (phép) |
| **1. Vũ Khúc Sóng Triều** | 2 / 10s (tính **sau khi múa xong** hoặc bị ngắt) | Múa **5s**: cả đội (kể cả Nerissa) **tăng tốc hồi MP** +400 / 600 / 800 / 1.000 MP mỗi giây theo bậc Thường / S / SS / SSS → múa đủ 5s mỗi người thêm **2 / 3 / 4 / 5 Orb** (nhận dần, không nhận ngay) |
| **2. Lưu Thủy Hồi Xuân** | cần **≥ 1 Orb**, **không hồi chiêu** | Múa tới khi **hết Orb**: cứ **0,5s đốt 0,5 Orb** → cả đội hồi ×0.35 M.ATK + 1% máu tối đa. Đang múa thì không bấm lại được |
| **3. Thủy Thần Vũ** | 4 / 12s (tính **sau khi múa xong** hoặc bị ngắt) | Múa **10s**: cả đội **+20% máu tối đa** (hồi đúng phần tăng; hết giờ / Nerissa gục thì trả lại), **+30% lượng hồi máu nhận**, **+20% ATK** (P.ATK & M.ATK), **kháng khống chế** Nerissa 100% (giải luôn khống chế đang dính) · đồng đội 50%. **Vừa vào điệu: cả đội (kể cả Nerissa) +2 Orb ngay** |
| **Cả 3 điệu cùng múa** | — | Mỗi **1s** bắn **nốt nhạc**: mọi đối thủ ×0.4 phép + **−15% M.DEF 3s**; mọi đồng đội **+10% sát thương phép 3s** + **50%** giải 1 hiệu ứng khống chế ngẫu nhiên (choáng / hất tung / hất văng / khiêu khích / bị túm) |

**Nerissa bản 3 (đang chờ tranh, chưa đổi game):** giữ tạo hình (elf tóc xanh dài, đồ vũ công trắng xanh ngọc viền vàng, 2 dải lụa nước), **vẽ lại tỉ lệ chibi** cho đồng bộ cả đội.
- **Prompt:** `art/nerissa/sprite/PROMPTS_SPRITE.md` (vẽ lại `01-character-v3.png` + **13 tấm sprite**: đứng / thủ thế, quất lụa, chạy, trúng đòn / choáng, xoay vào điệu + rơi vào trận, **mỗi điệu múa 1 tấm 8 khung**: 1, 2, 3, 1+2, 1+3, 2+3, 1+2+3, gục / thắng) và `art/nerissa/fx2/PROMPTS_FX.md` (5 tấm: giọt nước + nước bắn, vòng sóng vào điệu + mưa hồi máu, Thủy Thần, bong bóng giáp nước + nốt nhạc, 8 hình nhỏ).
- **Khung chính ↔ mốc:** quất lụa 0,24s (khung 4, đầu dải lụa) · xoay vào điệu 0,3s (khung 3). Điệu múa lặp theo nhịp cũ (1: 1,6s · 2: 2,4s · 3: 2,0s · 1+2: 1,4s · 1+3: 1,3s · 2+3: 1,8s · 1+2+3: 1,5s). Cơ chế / thông số không đổi.

Thiên phú 1 (Lv20) **Hòa Âm Thủy Vũ** — hiệu ứng theo tổ hợp điệu đang múa:
- **1 + 2**: cả đội có **giáp nước 6 / 8 / 10%** máu (theo cấp thiên phú), giáp **tự hồi 1% máu mỗi giây** khi tổ hợp còn chạy (bong bóng nước quanh người).
- **2 + 3**: mỗi đối thủ **mất 0,15 Orb mỗi giây** (tối đa **2 Orb** mỗi lần tổ hợp) — Sóng Triều của tu sĩ nước phe bên kia luôn hồi nhanh hơn mức bị hút.
- **1 + 3**: phe ta **+15% tốc đánh**, phe địch **−10% tốc đánh**.
- **1 + 2 + 3**: cả đội **+1 Orb ngay** (1 lần mỗi trận; cấp tối đa 2 lần).

Thiên phú 2 (Lv40) **Triều Dâng**: mỗi khi **đối thủ gục** → cả đội **+1 Orb ngay**; Nerissa tự hồi MP nhanh hơn **25%** (SSS **40%**).
AI: đã giao tranh / quái trong 12 đơn vị → Thủy Thần Vũ → Sóng Triều (đang Thủy Thần, ít Orb hoặc đang đánh) → Lưu Thủy khi có ≥ 2 Orb và đồng đội dưới 85% máu (hoặc đã múa 1+3 để thành đủ 3 điệu).
Nút kỹ năng **đang chạy** có **vòng sáng chạy quanh viền** + **vạch thời gian còn lại** ở đáy nút (Lưu Thủy: vạch = MP còn lại); cả 3 điệu cùng chạy → vòng **vàng**. Trong lúc múa, nút đó không bấm được và chưa đếm hồi chiêu.
Hình: ghép từ **tấm bộ phận vẽ riêng** — `art/nerissa/` (tranh nhìn nghiêng + tư thế múa, tấm bộ phận, bàn tay & mắt, 8 đoạn dải lụa + đầu lụa, 2 tấm hiệu ứng). Mắt biểu cảm căn sẵn lên đầu bằng `tools/make_overlay_eyes.py art/nerissa/eyes_spec.json` → `art/nerissa/gen/`; cắt mảnh `tools/cut_reference.py art/nerissa/ref_spec.json` (→ `nerissa_atlas.png`, `nerissaRig.js`, `nerissaClips.js`); hiệu ứng `tools/build_fx_atlas.py art/nerissa/fx_spec.json` (→ `nerissa_fx.png`, vẽ ở `src/vfx/nerissaFx.js`). **Dải lụa** là chuỗi 7 khớp lò xo (tay gần) + 4 khớp (tay xa) nối từ bàn tay → tự bay theo động tác. Động tác múa: `dance1, dance2, dance3, dance12, dance13, dance23, dance123`. Xem thử: `/tools/preview-cutout.html?rig=../src/characters/cutout/nerissaRig.js&clip=dance123&t=0.3`; kỹ năng + hiệu ứng theo từng mốc: `/tools/fx-nerissa.html?s=d123` (auto / d1 / d2 / d3 / d12 / d123 / notes / shield / flow / drain / gift / end).

### 4.9 Elarion (Tam Nguyên) — Phù Thủy nguyên tố 🔮 · tộc Elf · sát thương PHÉP
Cơ chế kiểu Invoker. Đã có tranh riêng (`art/elarion/`): Elarion chibi + **Sách Nguyên Tố lơ lửng** trước người (đóng → mở → bốc 3 luồng nguyên tố khi đọc / tung phép), Golem đá 3 nguyên tố, 5 tấm hiệu ứng + ngọc (xem mục **Đồ hoạ** cuối phần này).
Lv1: HP 1.500 · M.ATK 240 · P.DEF/M.DEF 40/75 · chí mạng 10% · né 16% · chính xác 112% · tốc đánh 1050ms · tầm 14.
- **Ngọc Nguyên Tố** (🔥 Hỏa · ❄️ Băng · ⚡ Lôi):
  - Hiện trên **KHAY NGỌC ngay phía trên thẻ Elarion** (giao diện, không nằm trong cảnh 3D) → bấm dễ, không bị camera / góc nhìn / động tác ảnh hưởng. Mỗi viên có chỗ cố định (5 ô hàng dưới + 4 ô hàng trên so le), viên khác rơi / tan không làm xê dịch.
  - Cứ 3s rơi 1 viên ngẫu nhiên; một hệ không rơi quá 2 lần liền. Tối đa 5 viên, mỗi viên sống 8s **giờ thật**.
  - **Ngọc từ kỹ năng:** **đồng đội** dùng đủ **5 kỹ năng** → +1 ngọc ngẫu nhiên; **đối thủ** dùng đủ **10 kỹ năng** → +1 ngọc ngẫu nhiên (luồng nguyên tố bay từ người vừa dùng kỹ năng về Elarion, viên ngọc thưởng loé vàng trên khay). Không tính kỹ năng của chính Elarion và của Golem / nhân vật triệu hồi; quái không dùng kỹ năng nên đánh quái chỉ có ngọc từ đồng đội. Bộ đếm hiện trên thẻ: `🤝x/5 ⚔x/10`. Khay đầy (9 ô) thì giữ lượt, có chỗ là ra ngọc. Elarion gục thì không đếm.
  - Vòng quanh mỗi viên = thời gian còn lại; sắp tan (< 2 giây thật) thì nhấp nháy. Rê chuột vào: ngọc to lên + viền vàng; bấm để nhặt — viên ngọc bay vào 3 ô trên thẻ (viên thứ 4 đẩy viên cũ nhất ra). Chỉ phe mình thấy ngọc của mình.
- **KN1 Sách Nguyên Tố** (1 Orb, **không hồi chiêu**): đọc 3 viên đang giữ (mất 3 viên) → phép tương ứng vào nút KN2.
- **KN2:** phép vừa ghép, mỗi phép có Orb và hồi chiêu riêng. **Dùng xong là mất** — nút KN2 trở về "Chưa ghép phép", muốn dùng lại phải ghép lại bằng Sách (không giữ phép).
- **KN3 Bão Nguyên Tố** (3 Orb, hồi **10s**): ngọc đủ 7 viên ngay; trong 7s cứ bớt là tung thêm. Dùng xong **+2 Orb ngay** (thực tốn 1 Orb).
- **Hàn Khí** (hiệu ứng chung): mọi sát thương **băng** (của bất kỳ ai) cộng 1 tầng — mỗi tầng −2% tốc đánh, giữ 5s; **đủ 5 tầng → đóng băng 1,5s**; bị giải hiệu ứng thì đếm lại.
- **10 phép:**

| Công thức | Phép | Orb / hồi | Tác dụng |
|---|---|---|---|
| 🔥🔥🔥 | Thiên Thạch | 3 / 14s | Sau 0,8s rơi vào chỗ đông đối thủ nhất: ×2,8 bán kính 4, **chạm đất luôn chí mạng** (lăn / vệt lửa / va chạm thì tính bình thường). Lăn **chậm** 15 ô (3s) về phía trước (hướng phe địch), cán qua hàng địch: ×0,8 mỗi đối thủ. Vệt lửa 2 lần ×0,4. Đối thủ bị Lốc Xoáy đẩy va vào thiên thạch đang lăn: thêm ×1,2 |
| ❄️❄️❄️ | Băng Phong | 3 / 12s | Khối băng thành hình trên đầu đội địch 1,5s rồi rơi: **cả đội địch** ×1,1 (băng) + −20% tốc đánh 3s. Vỡ ra 5 khối nhỏ văng xuống ×0,35 (băng, hiệu ứng tính chung). Cơ hội đóng băng 20% / 1s → 40% / 2s (SSS) |
| ⚡⚡⚡ | Lôi Xích | 2 / 13s | ×1,5, nảy qua tối đa 5 đối thủ, sau đó mỗi lần **50% nảy tiếp** (được trúng lại, tối đa 10 lần thêm). −10% M.DEF 5s → −15% (SSS), không cộng dồn |
| 🔥❄️⚡ | Nguyên Tố Hợp Nhất | 5 / 25s | Gọi Golem Nguyên Tố 20s |
| ❄️❄️⚡ | Giáp Băng Sét | 2 / 15s | Khiên 25% máu cho **Elarion + đồng đội yếu máu nhất** 6s. Ai đánh trúng người có giáp bị giật ×0,4 + choáng 0,5s (mỗi người 1 lần/giây) |
| ⚡⚡❄️ | Lốc Xoáy | 2 / 16s | Lốc bay thẳng 12 ô: ×1,1, đẩy lùi 4 ô |
| 🔥🔥❄️ | Hơi Nước Bỏng | 3 / 14s | **Niệm 2s** → mây mưa giông 7s: Elarion **đứng thi triển** (không đánh / chạy; vẫn nhặt ngọc; dùng kỹ năng khác hoặc bị choáng thì ngắt). Mỗi giây: phe ta hồi ×0,3 M.ATK + 1,5% máu (đầy máu thì +200 MP), sét đánh 1 đối thủ ngẫu nhiên ×0,7 + choáng 0,5s |
| 🔥🔥⚡ | Hỏa Lôi Cầu | 2 / 12s | Quả cầu hiện ở **1 điểm cố định cách Elarion 12 ô phía trước** (~ hàng trước địch), to dần 2s rồi **nổ tại chỗ** (bán kính 3,5): đối thủ đứng trong vùng nổ ×2,0 + choáng 0,5s + **mất 1 Orb**. **Nổ: cả đội +1 Orb, riêng Elarion +2 Orb.** AI chỉ dùng khi có đối thủ quanh điểm nổ |
| ❄️❄️🔥 | Băng Hoại Hỏa Thiên | 3 / 14s | **SolarBeam kiểu Kamehameha:** khum 2 tay dồn lực 0,7s → **đứng yên chưởng tia băng-hỏa 10s thẳng tới cuối bản đồ** (ngắm hướng có nhiều đối thủ nhất, lệch tối đa ~26°; tia rộng 1,6 ô mỗi bên). **Người đang bay không dính.** Mỗi giây, mọi đối thủ trong tia: **Băng** ×0,3 (không tăng) + 1 tầng Hàn Khí + −15% tốc đánh 1,5s · **Hỏa** ×0,42, mỗi giây +1 tầng (+3% sát thương lửa); **đủ 5 tầng: tia lửa to hẳn (rộng 2,3 ô), sát thương lửa thêm +30%** (= +45%). Không đánh / chạy trong lúc chưởng; bị choáng / đóng băng hoặc dùng kỹ năng khác thì ngắt |
| ⚡⚡🔥 | Tốc Lôi | 2 / 13s | **Riêng Elarion 10s:** đánh thường chưởng 2 lần, +25% tốc đánh, **tốc độ hồi Orb ×2**. Cứ 5 đòn → cả đội (kể cả Elarion) +5% tốc đánh 10s (cộng dồn tối đa 5 lần) |

- **Golem Nguyên Tố:**
  - Nhân vật bình thường trên sân: bị đánh, tính thắng thua. Không có thẻ HUD, không được hồi sinh.
  - **Không nhận buff / debuff / khống chế nào**, trừ Ấn Tử của Zerith. Vẫn được hồi máu.
  - Chỉ số: máu **4,67×** máu Elarion (gấp đôi bản trước — máu Elarion đã ×1,5), ATK **1,1×** M.ATK, thủ 6× / 2,3×.
  - Cứ 2 đòn đánh thường thì dùng 1 kỹ năng ngẫu nhiên đang sẵn sàng (mỗi kỹ năng hồi 10s).
    - **Nộ Lửa:** lùi 3 ô về phía đồng minh → niệm 1s → lướt chậm 8 ô (1,2s) đấm lửa: ×1,8 + hất tung 1s; cả đội địch −10% M.DEF 5s.
    - **Bão Tuyết:** niệm 2s hút khí lạnh → đứng phun bão tuyết 6s (**bão tuyết phủ toàn màn hình**): mỗi giây ×0,5 mọi đối thủ + 1 tầng Hàn Khí. Golem gục / tan thì tắt ngay.
    - **Hào Quang Sét:** niệm 1s, sét đánh vào tay → +25% tốc đánh 5s; mỗi đòn đánh giật **toàn bộ** đối thủ ×0,45, 50% choáng 0,5s.
- **Thiên phú 1 Cộng Hưởng Nguyên Tố:**
  - Nhặt ngọc thì hệ đó +1 tầng (tối đa 3), 5s, nhặt thêm thì làm mới.
  - Mỗi tầng: Hỏa +4 / 5 / 6% ATK · Băng hồi 0,3 / 0,4 / 0,5% máu mỗi giây · Lôi +4 / 5 / 6% tốc đánh **và +10 / 15 / 20% tốc độ hồi Orb** (MP mỗi giây + MP mỗi đòn; 3 tầng Lôi = +30 / 45 / 60%).
- **Thiên phú 2 Thiên Tài Nguyên Tố:** mỗi lần ghép phép bằng Sách: **40% / 70%** phép kế tiếp giảm 1 Orb (không hồi chiêu).
- **Cấp kỹ năng:** mọi hệ số sát thương của phép (kể cả băng / lửa của Băng Hoại Hỏa Thiên, mảnh Băng Phong, va chạm Thiên Thạch, sét Mưa Giông) tăng ×1,2 / 1,45 / 1,75 theo bậc.
- **Giao diện:**
  - Ngọc rơi ra nằm trên khay ngọc phía trên thẻ, bấm chuột để nhặt; sắp tan thì nhấp nháy (`updateGemTray` trong `src/ui/hud.js`).
  - 3 viên đang giữ bay quanh đầu pháp sư (2 phe đều thấy).
  - Thẻ HUD có 3 ô ngọc; nút KN1 ghi số ngọc đang giữ (x/3); nút KN2 đổi tên, giá Orb và hồi chiêu theo phép, giảm Orb nhờ thiên phú 2 thì có dấu "↓".
  - Bấm Sách khi chưa đủ 3 viên: lệnh xếp hàng chờ, đủ 3 viên tự đọc.
- **AI (tự động):** đang giữ phép dùng được (đã hồi, đáng dùng) thì không ghép đè bằng Sách, đỡ tốn Orb; dùng phép xong thì nhặt ngọc ghép phép mới.
- **Hiệu ứng trên người:** đóng băng có ngục băng phủ người, Giáp Băng Sét có vòm băng sét, Tốc Lôi / Hào Quang Sét có vòng sét quanh người (nắm đấm Golem hoá sét).
- **Đồ hoạ:**
  - Elarion: rig `src/characters/cutout/elarionRig.js` + `elarionClips.js` (đứng, chạy, chưởng, đọc Sách, tung phép, gọi bão, đứng thi triển Mưa Giông, trúng đòn, thắng, gục). Tay gần ngửa dưới Sách; tóc sau + 2 vạt áo choàng + Sách là lò xo đung đưa, Sách còn nhấp nhô (`floatParts`). Mắt: thường / chớp / quyết tâm / vui / đau / niệm (mắt 3 màu).
  - Golem: dùng **nguyên tranh** `art/elarion/05-golem-v2.png` (1 hình liền, giữ đúng nét vẽ), cao 4,7 (gấp ~1,6 lần nhân vật). Cử động cả thân (`golemClips.js`: nghiêng, nhún, phồng / dẹp `sq`): đấm, gồng rung, lao đấm, hít khí (phồng người), chồm tới phun, ngửa đón sét rồi nện, trồi lên lúc triệu hồi. Lửa quanh nắm đấm, luồng băng từ miệng, sét giáng là hiệu ứng phủ lên (`golemRig.js` có điểm neo: nắm đấm lửa / băng, miệng, lõi ngực).
  - Hiệu ứng: atlas `elarion_fx.png` 4096 px (`tools/build_fx_atlas.py art/elarion/fx_spec.json`), vẽ **giữ nguyên màu tranh** (trộn thường, không cộng sáng); đá / mây / khối băng có ruột đặc (`core` trong fx_spec). Thiên thạch khổng lồ rơi chéo + nổ lớn + tảng đá lửa lăn + dải lửa, khối băng lớn rơi vỡ, tia sét xích, lốc xoáy cao 6,6, cầu hỏa lôi to dần, tia băng / tia lửa quẹt + hàng gai băng / hàng nổ lửa, cột triệu hồi, vệt đấm lửa...
  - Toàn màn hình (`src/vfx/screenFx.js`, lớp 2D phủ trên cảnh, dưới HUD): **Mưa Giông** = 1 mảng mây đen lớn + trời tối sầm + mưa xiên + chớp sáng mỗi lần sét đánh; **Bão Tuyết** của Golem = sương giá viền màn hình + bông tuyết 3 lớp quất ngang + làn gió tuyết.
  - Đầu khớp tròn màu da của tấm bộ phận được tô lại màu vải (`tools/recolor_caps.py art/elarion/caps_spec.json`) trước khi cắt atlas.
- **Test:** Tool Phe Mình có mục **"Elarion — đặt thẳng phép vào nút KN2"** (10 nút). Xem code ở `src/ui/hud.js` (khay ngọc), `src/combat/elemGems.js` (3 quả cầu quanh đầu), `src/vfx/elemFx.js` (hiệu ứng), `onElemFx` trong `src/combat/events.js`.

## 5. QUÁI VẬT

| Quái | HP | ATK | P.DEF / M.DEF | Khiêu khích | Đặc điểm |
| :--- | :-: | :-: | :-: | :-: | :--- |
| **Tanker** 🛡️ | 5000 | 150 (vật lý) | 300 / 200 | 100 | Chặn 40%, đánh chậm (1500ms), cận chiến |
| **Xạ Thủ** 🏹 | 3000 | 250 (vật lý) | 100 / 100 | 100 | Tầm xa 10, chính xác 110%, xuyên giáp 30% |
| **Hỗ Trợ** 🪄 | 3000 | 120 (phép) | 100 / 200 | 100 | Tầm 6, đánh phép |
| **Cọc Gỗ** 🪵 | 9.999.999 | 0 | 500 / 500 | 0 | Chỉ để test, không đánh, bất tử; máu đặt sẵn 100%, 85%, 70%... |

Quái hiện vẽ bằng code (hình "capsule" dễ thương) cho tới khi có tranh.

---

## 6. HIỆU ỨNG TRẠNG THÁI

| Hiệu ứng | Nguồn | Tác dụng |
| :--- | :--- | :--- |
| **Ấn** | Phóng Bùa | 7s, −15% P.DEF; Đột Kích lướt qua mọi quái có Ấn |
| **Tàng Hình** | Tàng Hình (5s), Bóng Ẩn (2s) — mọi kỹ năng tàng hình | Không thể bị chọn; **chỉ trúng đòn DIỆN RỘNG** (Sư Tử Gầm, khiên Rok nổ, Thiên Hỏa Cầu / Cột Lửa, tên gió xuyên, lướt / chém lan / hất của Zerith...), đòn đơn mục tiêu trượt; +20% P.ATK, +10% tốc đánh |
| **Sấm phù trợ** | Tàng Hình (đồng đội khác) | 5s, +20% né tránh · tia sét tím nháy quanh người |
| **Gió dẫn đường** | Thần Phong Giáng Thế (cả đội) | 8s, +20% chính xác · 3 dải gió ngọc xoáy quanh người |
| **Sư Tử Gầm** (taunted) | Sư Tử Gầm (Rok), Tiếng Hét Bảo Hộ (Brakk) | Rok: 4s, buộc đánh Rok, −10% P.DEF / M.DEF · Brakk: 3s, buộc đánh Brakk |
| **Bị hất văng** (knocked) | Đẩy Khiên | 0.45s đang bay, không hành động |
| **Choáng** | Đẩy Khiên (1s), khiên Dựng Khiên nổ (0.5s) | Đứng im, không đánh, bị ngắt niệm (sao xoay trên đầu) |
| **Dựng Khiên** (guard) | Dựng Khiên | Tối đa 6s, khiên = 20% máu tối đa Rok; mỗi 1/6 máu khiên mất → nổ lan ×0.8 + choáng 0.5s + cả đội hồi 2,5%; kết thúc → nổ lần cuối |
| **Khiên Hộ Đội** (guard_aura) | Dựng Khiên | 5s, +20% P.DEF / M.DEF cho cả đội |
| **Vệ Thần Gió** (windspirit) | Thần Phong Giáng Thế | 8s, đang bay (né kỹ năng dưới đất), +30% tốc đánh, +20% P.ATK, Vệ Thần bắn phụ |
| **Thành Trì** (fortress) | (dự phòng) | Giảm sát thương nhận theo % |
| **Bị hất tung** (knockup) | Lưỡi Hái Hất Hồn, Chấn Địa, móc ngược của Brakk | 1s bay lên không (kèm choáng), không hành động |
| **Ấn Tử** (death_mark) | Phán Quyết Tử Thần (Zerith) | 15s, đầu lâu trên đầu; −20/27,5/35% hồi máu nhận được; Lưỡi Hái Hất Hồn lúc Đêm Tử Thần phá sạch khiên, máu dưới 5/7/10% → kết liễu |
| **Lướt lần 2** (reaper_echo) | Lưỡi Hái Xuyên Hồn lúc Đêm Tử Thần | 5s, lướt thêm 1 lần miễn phí |
| **Đêm Tử Thần** (reaper_form) | Đêm Tử Thần | 10s, bay, Hộ Vệ Thần Chết, +20% sát thương, +30% tốc đánh, −40% khống chế, không thể chết |
| **Bị túm** (grabbed) | Bá Vương Quật (Brakk) | Bị nhấc bổng qua đầu tới lúc bị quật (~0,85s) rồi choáng 1s |
| **Thần Lực Khổng Lồ** (giant_form) | Thần Lực Khổng Lồ | 10s, +50% máu tối đa, +40% thủ, +25% sát thương, 5s đầu miễn mọi hiệu ứng bất lợi, móc ngược hất tung |
| **Khiên Vảy Rồng** (brakk_shield) | Chấn Địa, Khí Thế Đấu Trường | 10s, cộng dồn thành 1 lớp; vòm vảy rồng quanh Brakk |
| **Độc Long** (lone_dragon) | Long Huyết Bất Khuất (Brakk) | Chỉ còn 1 mình Brakk trên sân: sát thương ×2 · tự hoá Khổng Lồ miễn phí (đang Khổng Lồ thì làm mới thời gian) |
| **Ý Chí Thép** (iron_regen) | Thiên phú 1 Rok (Rok + người được nối dây) | 5s, mỗi giây hồi 3% máu (Rok còn dây: 6%) |
| **Hộ Mệnh** (revive_guard) | Thiên Thần Hộ Mệnh (Sera) | 2s sau khi hồi sinh: miễn mọi sát thương |
| **Giáp Lửa** (fire_ward) | Hỏa Tốc (Ignar) | 10s khiên lửa, +30% M.DEF, −40% khống chế; hết → nổ choáng 1s xung quanh |
| **Sóng Triều** (tide_mana) | Vũ Khúc Sóng Triều (Nerissa, cả đội) | 5s, hồi thêm 400–1.000 MP/giây theo bậc · giọt MP bay lên |
| **Phước Thủy Thần** (water_god) | Thủy Thần Vũ (cả đội) | 10s, +20% máu tối đa, +30% hồi máu nhận, +20% ATK, kháng khống chế (Nerissa 100%, đồng đội 50%) · hào quang nữ thần nước sau lưng Nerissa |
| **Giáp Nước** (water_shield) | Hòa Âm 1+2 (cả đội) | Khiên 6–10% máu, tự hồi 1%/giây, còn khi Nerissa múa Sóng Triều + Lưu Thủy · bong bóng nước |
| **Nốt Nhạc Vỡ Giáp** (note_break) | Cả 3 điệu múa (đối thủ) | 3s, −15% M.DEF |
| **Nốt Nhạc Cổ Vũ** (note_amp) | Cả 3 điệu múa (đồng đội) | 3s, +10% sát thương phép |
| **Nhịp Triều / Nước Cuốn** (tide_haste / tide_slow) | Hòa Âm 1+3 | Phe Nerissa +15% tốc đánh · phe địch −10% tốc đánh (khi tổ hợp còn chạy) |
| **Đóng Băng** (frozen) | Băng Phong, đủ 5 tầng Hàn Khí | Đứng im như choáng, lớp băng phủ người; giải được như choáng |
| **Hàn Khí** (chill) | Mọi sát thương băng (Băng Phong, tia băng, Bão Tuyết của Golem...) | Mỗi tầng −2% tốc đánh, 5s; đủ 5 tầng → đóng băng 1,5s |
| **Mưa Giông** (elem_rain) | Hơi Nước Bỏng | Elarion đứng thi triển 7s: hồi máu cả đội, sét đánh đối thủ (Elarion gục thì tắt) |
| **Tốc Lôi / Nhịp Lôi** (storm_self / storm_haste) | Tốc Lôi | Elarion chưởng 2 lần + 25% tốc đánh 10s · cả đội +5% tốc đánh mỗi tầng (tối đa 5) |
| **Cộng Hưởng Hỏa / Băng / Lôi** (attune_*) | Thiên phú 1 Elarion (nhặt ngọc) | 5s, tối đa 3 tầng mỗi hệ: +ATK / hồi máu mỗi giây / +tốc đánh |
| **Bão Nguyên Tố** (elem_storm) | Bão Nguyên Tố | 7s: ngọc luôn đủ 7 viên |
| **Lôi Xích / Nộ Lửa** (chain_break / golem_break) | Lôi Xích, Nộ Lửa của Golem | 5s, −10…15% / −10% M.DEF |
| **Băng Phong** (frost_slow) | Băng Phong | −20% tốc đánh 3s |
| **Băng Hoại Hỏa Thiên** (elem_beam / beam_slow) | Băng Hoại Hỏa Thiên | Elarion đứng chưởng SolarBeam 10s (tầng lửa 0…5) · đối thủ trúng tia băng −15% tốc đánh 1,5s (làm mới mỗi giây) |
| **Hơi Nước Bỏng** (steam_blind) | Hơi Nước Bỏng | Đứng trong mây: đánh trượt thêm 30% |
| **Giáp Băng Sét** (storm_ward) | Giáp Băng Sét | Khiên 25% máu 6s, ai đánh trúng bị sét giật + choáng 0,5s |
| **Tay Sét** (golem_haste) | Hào Quang Sét của Golem | 5s, +25% tốc đánh, mỗi đòn giật toàn bộ đối thủ |
| **Thần Chết phán quyết** (judged) | Ấn Tử chạm ngưỡng tử (Zerith) | ~1,6s bị nhấc lên không trung: không bị đánh / chọn / dính hiệu ứng; chém: có khiên → vỡ khiên, không khiên → chết |

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
Số sát thương, vệt chém (thường / chí mạng / sấm tím / thép), sét, hào quang sấm, bùa bay, dấu Ấn, khói, dư ảnh, sóng xung kích, **linh hồn sư tử** (`lionSpirit.js`) và **Thần Hộ Vệ** (`guardianSpirit.js`) — đều vẽ bằng canvas, khiên ánh sáng đẩy, vòm lục giác, khiên phát nổ / vỡ (vụn lục giác).
Khi Thần Hộ Vệ hiện, camera tự nâng khung hình lên để thấy trọn vị thần.

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
    FrameSpriteView.js        nhân vật kiểu sprite (mỗi khung 1 hình): khung xương chạy ẩn giữ mốc, hình = khung trong atlas (Ignar, Rok, Jessica)
    sprite/                   cấu hình + json khung sprite từng nhân vật (ignarSprite, rokSprite, jessicaSprite .js / .json)
    registry.js               classId -> cách vẽ + bảng hành động
    cutout/                   rig, clips, atlas của từng nhân vật + poseClip.js; creatureRig.js (quái)
  combat/                 dựng trận, xử lý sự kiện chiến đấu -> động tác + VFX
  vfx/                    hiệu ứng (vfx.js, flipbook.js = hiệu ứng chạy khung dùng chung, fireFx.js, lionSpirit.js, guardianSpirit.js...)
  ui/                     HUD, overlay, input (nút, kéo thả & phóng to bảng test)
  render/toon.js          vật liệu toon cho cảnh
  assets/sprites/         atlas nhân vật
art/                      tranh gốc + atlas_spec.json (không đóng gói vào game) · HUONG_DAN_VE_NHAN_VAT.md: luật vẽ để ráp thẳng vào game · <tên>/PROMPTS.md: prompt vẽ từng nhân vật
tools/                    build_atlas.py, slice_parts.py, make_gdd_docx.js (tạo file Word), trang xem thử (preview-cutout / preview-scene / fx-*)
```

### 8.1b Tranh nhân vật + hiệu ứng (quy trình SPRITE — đồng bộ cả đội theo Ignar)
- **Luật vẽ + đoạn prompt chung + ảnh đính kèm:** `art/HUONG_DAN_VE_NHAN_VAT.md`.
  - Sprite: nền xanh #00FF00, lưới 4×2, 3/4 nghiêng nhìn phải.
  - Hiệu ứng: nền đen, lưới A 4×2 / lưới B 2×4.
  - Khung chính = mốc ra đòn.
- **Prompt từng nhân vật:** `art/<tên>/sprite/PROMPTS_SPRITE.md` (động tác) + `art/<tên>/fx2/PROMPTS_FX.md` (hiệu ứng). Đã có: Ignar (xong), Rok bản 3 (xong: sprite + 4 tấm hiệu ứng), Jessica bản 3 (xong: sprite + 4 tấm hiệu ứng), Nerissa bản 3 (vẽ lại chibi giữ tạo hình + 13 tấm sprite + 5 tấm hiệu ứng, chờ tranh).
  - App vẽ xuất sẵn PNG trong suốt cũng dùng được (`key: "alpha"`).
- **Hiệu ứng dùng chung cả đội** (trúng đòn, vệt chém, bụi, khói, sao choáng, lấp lánh, sóng xung kích, vòng niệm...): `art/common/PROMPTS_FX_CHUNG.md`, chờ tranh. Phần trắng được nhuộm theo màu từng nhân vật.
- **Ráp (không tô sửa):**
  - Sprite: `tools/sprite_pack.py art/<tên>/sprite/sprite_spec.json --debug soi.png` → `src/assets/sprites/<tên>_sprite.webp` + `src/characters/sprite/<tên>Sprite.json`.
    - Tách nền `"key"` (cả spec hoặc từng tấm): `green` (mặc định, Ignar) · `matte` (giữ viền đen mảnh — dùng cho nhân vật mới) · `alpha` (PNG đã trong suốt).
    - Mốc căn `toe / heel / body`; nhiều tấm đưa về cùng cỡ ("scale").
    - Điểm gắn đánh dấu tay `"points"` → `view.pointWorld(tên)`; `events.js` `jointPoint()` / `ribbonPoint()` tự dùng khi có.
    - `"format": "webp"`.
  - Hiệu ứng: `tools/fx_grid_pack.py art/<tên>/fx2/fx2_spec.json --preview soi.png` → `<tên>_fx2.webp` + json. Code dùng `src/vfx/flipbook.js` (`makeFlipbook(url, meta)` → `frames / set / decal`).
    - **Hiệu năng:** cắt 1 hình / 1 khung khỏi atlas phải dùng `textureView(base)` (`src/vfx/texView.js`), KHÔNG dùng `base.clone()` + `needsUpdate`: `clone()` của three.js đánh dấu cả ảnh atlas "cần tải lại" → mỗi khung dùng lần đầu tải lại nguyên atlas 4096×1024 lên GPU (giật, tụt FPS). `flipbook.js`, `elemFx`, `brakkFx`, `nerissaFx`, `zerithFx`, `vfx.js` (sera) đã dùng `textureView`.
    - Căn khung `"align": "blob"` + `"blob": [[r,g,b thấp],[r,g,b cao]]`: trùng 1 vật có màu riêng (VD sư tử giữa Khiên Thần); `"pivot": "blob"`.
    - `"holeMax"`: chỉ lấp lỗ nhỏ khi giữ đặc (khoảng tối lớn giữa cánh / hào quang vẫn trong suốt).
    - Lưới B nhiều hình sát nhau: `"regionThr"` / `"regionDilate"` / `"keepGrow"` (theo tấm) để quầng sáng mờ không nối các hình lại.
- **Nhân vật:** thêm `sprite: <TÊN>_SPRITE` + `spriteParam` / `spriteIdleParam` vào visual trong `registry.js` → `FrameSpriteView` tự dùng.
  - `?<spriteParam>=cutout` xem lại bản khung xương.
  - Mode clip: `strike` (khung chính = hitTime) · `clip` · `hold` · `once` · `loop` · `still` (1 khung + thở).
- Bản khung xương cũ (`art/ignar/PROMPTS.md`, tấm bộ phận / tay / mắt) không cần vẽ nữa.

### 8.2 Công cụ xem thử (chạy `npm run dev`)
- `/tools/preview-cutout.html?rig=../src/characters/cutout/rokRig.js&clip=attack&t=0.1,0.2` — xem từng khung động tác.
- `/tools/test-sprite.html?char=warrior&auto=1` — **trang thử chung**: lần lượt mọi động tác của 1 nhân vật (sprite hoặc khung xương), đánh thường gọi đúng hàm game; `char` = classId (mage, warrior, assassin, archer, priest, reaper, wrestler, dancer, elementalist, elem_golem), `&only=attack,bash`, `&left=1`.
- `/tools/test-ignar.html?mode=idle` — Ignar đứng / thủ thế → đánh thường (cầu lửa thật như game), khung cố định 1/60s, console `stepTo(giây)`.
- `/tools/test-ignar-sprite.html?mode=idle | ready | tour` — Ignar kiểu sprite (đúng view trong game), cầu lửa thật; `mode=tour` lần lượt mọi động tác; `&ignarIdle=A|B|C`, `&ignar=cutout` để so với khung xương, `&mode=none` rồi gọi `view.playAction('summon')`... trong console (mục 4.5). Bấm đúp `xem_thu_ignar.bat` = chạy `npm run dev` + mở trang này. **Không mở file html trực tiếp** (ra trang trắng).
- `/tools/preview-scene.html?team=assassin,warrior|monster_dummy` — xem nhân vật trong cảnh trận (console: `act(0,'attack')`, `step(0.5)`).
- `/tools/fx-rok.html?s=all&auto=1` — mọi kỹ năng / hiệu ứng Rok bản 3 (s = attack | roar | push | guard | link).
- `/tools/fx-jessica.html?s=all&auto=1` — mọi kỹ năng / hiệu ứng Jessica bản 3 (s = attack | throw | strike | stealth).
- `/tools/fx-lion.html`, `/tools/fx-guardian.html` — hình linh hồn sư tử / Thần Hộ Vệ bản code cũ (không còn dùng).
- `/tools/fx-ignar.html?s=all` — mọi kỹ năng / hiệu ứng Ignar (s = attack | meteor | pillar | god | ward).
- `/tools/fx-brakk.html?s=grab`, `/tools/fx-nerissa.html?s=d123`, `/tools/fx-elarion.html?s=meteor` (cả Golem: `s=fist / blizzard / aura`; SolarBeam: `s=beams`, tia chéo `&uz=0.3`) — xem kỹ năng + hiệu ứng theo từng mốc (gọi đúng hàm xử lý sự kiện của game với dữ liệu giả; console `stepTo(giây)`).

---

## 8.8 TẦM ĐÁNH & ĐỘI HÌNH
| Nhân vật | Tầm đánh | Ghi chú |
|---|---|---|
| Jessica, Rok | 2,4 | cận chiến, đứng đầu |
| Seraphine | 9 | đứng sau tank |
| Nerissa | 8 | kỹ năng (điệu múa) không cần tầm; lúc múa lượn qua lại quanh chỗ đứng |
| Elarion | 14 | phép không cần tầm (tự chọn chỗ đông / hàng trước / mục tiêu đang đánh); Golem cận chiến 2,8 |
| Ignar | 15 | kỹ năng tầm 18 |
| Zerith | 2,8 | cận chiến (lưỡi hái dài); Lưỡi Hái Xuyên Hồn dùng trong tầm đánh, lướt 15 |
| Lyra | 11 (Thần Phong Giáng Thế +8 = **19**, xa nhất) | Tiễn Gió Chớp tầm 13 |
| Quái: Tanker / Xạ Thủ / Hỗ Trợ | 2,4 / 15 / 10 | |

- Vào trận: cận chiến đứng trước, đánh xa đứng lùi sau (tầm càng xa đứng càng lùi).
- Đánh xa **không tiến lên trước hàng cận chiến** của đội mình (cách ≥ 2 đơn vị).
- Đánh xa bị áp sát thì **đứng đánh tại chỗ** (đã tắt tự bỏ chạy / thả diều — `KITE_ENABLED = false` trong server.js); sau này mỗi nhân vật sẽ có kỹ năng riêng để tránh áp sát.

## 8.9 CHẾ ĐỘ CHƠI (màn hình đầu)
- **🧪 Test**: đánh 3 quái, có Tool Phe Mình / Tool Phe Quái; nhân vật theo level / bậc đang có.
- **⚔️ Đấu** (không có tool, mọi nhân vật **Lv60 SSS**):
  - **Đấu với quái**: đội bạn (1–4 người) vs 3 quái mặc định **Lv60**.
  - **Đấu với tướng**: 2 bảng chọn **1P** (bạn điều khiển) và **2P** (AI tự đánh), mỗi bên 1–4 người, có thể trùng nhân vật.
- Nút **🏠 Menu** (góc trên trái) quay về màn hình chọn chế độ. Server: `room.mode` = test / duel_monster / duel_hero; sự kiện `mainMenu`, `chooseMode`, `backToMenu`; mọi lệnh tool bị bỏ qua khi không phải test.

### Quái theo cấp (Tool Phe Quái → Cấp quái: −10 −1 +1 +10, nhanh Lv1/20/40/60)
Lv1: Tanker HP 6.500 · ATK 200 · P.DEF 320 · M.DEF 220 — Xạ Thủ HP 4.200 · ATK 290 — Hỗ Trợ HP 4.000 · M.ATK 240.
Mỗi cấp quái tăng theo đúng tỉ lệ tăng trung bình của các nhân vật cùng cấp (kèm bậc: Lv21–40 = S, 41–59 = SS, 60 = SSS), thủ tăng chậm hơn (×0.6)
→ quái luôn trâu & mạnh hơn nhân vật cùng cấp một chút (chưa có kỹ năng). Lv60: Tanker ~38.000 HP · ATK ~1.120.

## 9. CHẾ ĐỘ ĐÁNH THỬ (TEST MODE)

Bật bằng `TEST_MODE = true` trong `server.js` (mặc định). Đội mình: Jessica + Rok + Lyra + Seraphine; phe địch: Tanker, Xạ Thủ, Hỗ Trợ.

Hai bảng tool, kéo thả / thu gọn (bấm tiêu đề) / phóng to thu nhỏ (−/+):

**🛠️ Tool Phe Mình** (viền xanh ngọc):
- *Chung:* 💎 Đầy Mana · ✨ Skill miễn phí (bật lên là mọi kỹ năng sẵn sàng ngay, không tốn Orb, không hồi chiêu) · 🛡️ Bất tử.
- *Cả đội:* mốc nhanh Lv1 Thường / Lv20 S / Lv40 SS / Lv60 SSS.
- *Từng nhân vật:* nút **ON/OFF** ra trận (luôn giữ ít nhất 1 người) · level (−10 −1 +1 +10, thanh trượt) · bậc (4 nút) · chỉ số xem trước · 2 thiên phú · nút **⬆ Đột phá** (luồng thật: kiểm tra điều kiện rồi mới lên). Bấm tên để thu gọn thẻ. Chỉnh trong tool **không cần điều kiện, áp ngay vào trận**.

**👹 Tool Phe Quái** (viền đỏ): triệu hồi 3 quái / cọc gỗ · thêm / bớt cọc (tối đa 8) · 🛡️ Quái bất tử.
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

### 9.x Chọn đội hình trước trận
- Vào trận (hoặc bấm **Chơi lại / Tiếp tục trận mới**) → hiện bảng **CHỌN ĐỘI HÌNH**: chọn **1–4 nhân vật**, bấm **⚔️ Xác nhận vào trận** mới bắt đầu đếm ngược.
- Phím tắt: **1–4** chọn / bỏ chọn, **Enter** xác nhận. Lựa chọn lần trước được nhớ (lưu trong `data/progress.json`, khoá `squadPick`).
- Server: phòng có thêm trạng thái `selecting`; sự kiện `squadSelect` (server → client) và `confirmSquad { classes }` (client → server). Giới hạn `MAX_SQUAD = 4`.
- Ảnh chân dung: `src/assets/portraits/<classId>.png` (chụp từ tư thế đứng của rig, nền trong suốt). Nhân vật mới: thêm 1 ảnh cùng tên.

## 10. QUY TRÌNH THÊM NHÂN VẬT MỚI

0. Nhân vật **đánh phép** thuộc nhóm class vật lý (vd Zerith — Sát Thủ phép): đặt `dmgType: 'magic'`, `pAtk: 0`, `mAtk: …` — `computeStats` tự đổi phần tăng P.ATK theo level sang M.ATK.
1. **Server** (`server.js` → `CLASS_DEFS`): thêm classId với chỉ số, 3 kỹ năng (`name, orbCost, cooldown, castTime, type, ...`), nội tại; thêm vào `SQUAD_ORDER`. Kiểu kỹ năng mới → xử lý trong `executeSkill()`.
2. **Tranh** → `art/<tên>/` → `build_atlas.py` → `<tên>Rig.js` + `<tên>Clips.js` (mục 7).
3. **Đăng ký** trong `registry.js`: chiều cao, clips, bảng `anims` (tên hành động → clip + hitTime).
4. **Diễn xuất kỹ năng** trong `combat/events.js` (`onSkillExecuted` → hàm riêng gọi `playAction` + VFX).
5. **HUD:** tên nhân vật và kỹ năng tự lấy từ `CLASS_DEFS`; thẻ nhân vật trong Tool Phe Mình tự xuất hiện.
6. Kiểm tra bằng các trang xem thử (mục 8.2) rồi vào trận thử.

---

## 11. LỘ TRÌNH

| Giai đoạn | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| **1. Lõi chiến đấu** | Server tick 50ms, sát thương 7 bước, Orb, hàng đợi kỹ năng, AUTO, tốc độ trận x1/x1.5/x2 | ✅ Xong |
| **2. Nhân vật cơ bản** | Hệ 2D ghép mảnh; Jessica (Sát Thủ); Rok (Chiến Binh); công cụ đánh thử | 🔄 Đang hoàn thiện động tác & hiệu ứng |
| **3. Mở rộng đội hình** | Thêm class (Phù Thủy, Tu Sĩ...), đội 4 người, xếp đội hình tránh chồng nhau, quái 5–6 con có tranh riêng | ⏳ Tiếp theo |
| **4. Hệ thống ngoài trận** | Skin, trang bị, nâng cấp nhân vật, bản đồ thế giới (góc camera chéo) | ⏳ |
| **5. Trực tuyến** | Tài khoản, lưu dữ liệu, PvP | ⏳ |
