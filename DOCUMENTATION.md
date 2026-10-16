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
| Rok | **Ý Chí Thép + Dây liên kết:** vào trận nối dây với đồng đội ATK cao nhất; Rok & người được nối: máu < 30% → +15% / 20% / 25% chặn đòn, kèm 5s hồi 3% máu/giây (hồi 10s); còn dây → thiên phú 1 & 2 trên riêng Rok ×2 | **Kiên Cường:** (Rok & người được nối) giảm 15% / 25% sát thương nhận & thời gian khống chế (sau 10 đòn, bật 10s, hồi 15s) |
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
| Jessica | Sát Thủ · Human | 1.260 | 231 vật lý | 53 / 53 | 35% | 20% | 15% | 5% | 0,80s | 2,4 |
| Rok | Chiến Binh · Dragon | 3.680 | 150 vật lý | 242 / 176 | 8% | 5% | 5% | 25% | 1,26s | 2,4 |
| Lyra | Cung Thủ · Elf | 1.000 | 200 vật lý | 40 / 60 | 25% | 20% | 0% | 0% | 0,90s | 11 |
| Seraphine | Tu Sĩ · Human | 1.155 | 189 phép | 47 / 95 | 10% | 10% | 0% | 0% | 1,00s | 9 |
| Ignar | Phù Thủy · Human | 998 | 231 phép | 37 / 74 | 15% | 8% | 10% | 0% | 1,10s | 13 |
| Zerith | Sát Thủ phép · Devil | 1.150 | 235 phép | 46 / 55 | 25% | 16% | 12% | 3% | 0,85s | 2,8 |
| Brakk | Chiến Binh · Dragon | 4.600 | 180 vật lý | 198 / 154 | 10% | 5% | 8% | 10% | 1,21s | 2,4 |
| Nerissa | Tu Sĩ (vũ công) · Elf | 1.050 | 170 phép | 45 / 100 | 8% | 22% | 0% | 0% | 1,00s | 8 |

Riêng: Lyra chính xác 122% · Nerissa chính xác 112% · Zerith hút máu 5%. Mọi nhân vật: sát thương chí mạng ×2,0.

Lv60 · bậc SSS:

| Nhân vật | HP | ATK | P.DEF / M.DEF |
|---|---|---|---|
| Jessica | 7.028 | 1.280 | 363 / 363 |
| Rok | 17.644 | 754 | 1.238 / 844 |
| Lyra | 5.969 | 1.100 | 239 / 358 |
| Seraphine | 8.375 | 1.030 | 455 / 811 |
| Ignar | 5.708 | 1.478 | 244 / 587 |
| Zerith | 6.630 | 1.351 | 318 / 330 |
| Brakk | 18.812 | 793 | 1.182 / 816 |
| Nerissa | 7.913 | 968 | 433 / 785 |

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
| *Thiên phú 2 (Lv40): Kiên Cường* | — | Rok **và người được nối dây** (mỗi người tự đếm): **nhận đủ 10 đòn → bật 10s**, giảm 15/25% sát thương nhận và thời gian bị khống chế. Hết 10s thì **hồi 15s**. |

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
Lv1: HP ~1.000 · M.ATK ~231 · P.DEF/M.DEF 37/74 · chí mạng 15% · né 8% · xuyên 10% · tốc đánh 1100ms · tầm 13 · khiêu khích 100.

| Kỹ năng | Orb / hồi | Mô tả |
|---|---|---|
| Đánh thường | — | Ném cầu lửa ×1.0 |
| **1. Thiên Hỏa Cầu** | 1 / 7s · niệm 1s (Hỏa Thần: tức thì) | Cầu lửa lớn rơi xuống chỗ quái đông nhất, nổ bán kính 5,5: **×2.0**, để lại biển lửa cháy thêm 3 lần ×0.3 (mỗi 0,6s). Quả thứ 2 (thiên phú) cũng để lại biển lửa |
| **2. Cột Lửa Phá Ma** | 2 / 14s · niệm 1s (Hỏa Thần: tức thì) | Chưởng xuống đất → vòng phép hiện 1s → nhiều cột lửa bùng **7 lần** (mỗi 0,4s, ×0.45, bán kính 5). Mỗi lần trúng −5% M.DEF, tối đa −25%, giữ 10s |
| **3. Hỏa Thần Giáng Lâm** | 3 / 25s · gồng 1,5s | Hộ Vệ Thần Lửa 15s (ném cầu lửa ×0.5 mỗi 1,5s), Ignar +25% M.ATK + **Khiên Lửa** (+30% M.DEF, −40% thời gian bị khống chế). Đánh thường → **Hỏa Chưởng** ×1.1 + lan ×0.6 (bán kính 2,5). **Cứ 3 đòn**: chưởng mọi quái ×1.3, choáng 0,5s, KN1 & KN2 hồi nhanh 1s |

Lúc Hỏa Thần: quả cầu nhỏ của KN1 xuất hiện 80% (chưa có thiên phú: 50%); KN2 vòng phép chỉ 0,4s và cột lửa +25% sát thương.
Thiên phú 1 (Lv20) **Thiên Hỏa Song Tinh**: +8/12/16% M.ATK · Thiên Hỏa Cầu 50% rơi thêm quả 2 (70%) · **Cột Lửa Phá Ma bùng thêm 3 lần** (7 → 10).
Thiên phú 2 (Lv40) **Hỏa Tốc**: lúc Hỏa Thần +20/30% tốc đánh · **Giáp Lửa** (riêng Ignar): máu **dưới 50%** → khiên lửa **10s** (máu khiên **30 / 40% máu tối đa**, +30% M.DEF, −40% thời gian khống chế) và **+1 Orb**; vừa bật **hất văng** đối thủ trong 4 đơn vị ra xa 3,5 đơn vị; khiên hết (vỡ / hết giờ / bị phá) → **nổ choáng 1s** đối thủ trong 4,5 đơn vị và **+1 Orb**. Hồi **25s** tính từ lúc bật.
Hình: `art/ignar/` (tranh toàn thân nền trong suốt, tấm bộ phận, tay & mắt, hộ vệ, 3 tấm hiệu ứng) → `tools/cut_reference.py art/ignar/ref_spec.json` (nhân vật) và `tools/build_fx_atlas.py art/ignar/fx_spec.json` (hiệu ứng → `ignar_fx.png`, vẽ ở `src/vfx/fireFx.js`).

### 4.6 Zerith (U Minh) — Sát Thủ 💀 · tộc Devil · sát thương PHÉP
Sát Thủ cầm **lưỡi hái tử thần**, đánh cận chiến bằng sát thương **phép**. Nhóm class Sát Thủ nhưng vì đánh phép nên mỗi level tăng **M.ATK** thay cho P.ATK.
Lv1: HP 1.150 · M.ATK ~235 · P.DEF/M.DEF 46/55 · chí mạng 25% · né 16% · xuyên 12% · hút máu 5% (Devil) · tốc đánh 850ms · tầm 2,8 · khiêu khích 100.

| Kỹ năng | Orb / hồi | Mô tả |
|---|---|---|
| Đánh thường | — | Bổ liềm ×1.0 (phép): giơ liềm ra sau đầu → quét qua đỉnh đầu → lưỡi móc bổ xuống trước mặt |
| **1. Lưỡi Hái Xuyên Hồn** | **0 (miễn phí)** / 7s · chỉ dùng khi quái **trong tầm đánh** | Lướt tối đa **15 đơn vị**, chém **mọi quái trên đường lướt** ×1.6. **Tự chọn đường lướt**: thử lướt về phía từng đối thủ trong tầm lướt, chọn đường xuyên được nhiều quái nhất, ưu tiên đích là tướng đánh xa / yếu máu ở hàng sau (vd Lyra); **dừng ngay sau lưng** con xa nhất trên đường (không lướt lố). Lướt xong tự đánh con gần nhất. AI chỉ lướt khi đáng (xuyên ≥ 2 quái hoặc tới được tướng đánh xa / con dưới 40% máu). Lúc Đêm Tử Thần: lướt lần 1 (tốn Orb) → **hồi chiêu ngay** + trong **5s** được lướt lần 2 **miễn phí** (tự bấm, nút nháy tím "MIỄN PHÍ"); lướt lần 2 xong mới hồi chiêu bình thường |
| **2. Lưỡi Hái Hất Hồn** | 2 / 10s · niệm 0,7s | Niệm: **lưỡi hái khổng lồ** hiện dần sau lưng, lưỡi trên đầu → vọt ra trước quét từ dưới lên: quái phía trước trong 3,5 đơn vị trúng ×2.2 và bị **hất tung 1s**. Lúc Đêm Tử Thần: **không cần niệm** (lưỡi hái hiện ngay), phạm vi **rộng 6 đơn vị**, quét lên rồi **bổ xuống** thêm ×1.2 |
| **3. Đêm Tử Thần** | 3 / 25s · niệm 1s | 10s: **Hộ Vệ Thần Chết** chiến đấu cùng (chém ×0.6 mỗi 1,2s; cứ chém đủ 2 nhát → 50% **tự dùng Lưỡi Hái Hất Hồn** miễn phí: hất tung quái quanh mục tiêu (4,5 đơn vị) ×2.2 rồi chém bổ xuống ×1.2), Zerith bay lơ lửng · +20% sát thương · +30% tốc đánh · −40% thời gian bị khống chế · **không thể chết** (máu tối thiểu 1, hiện đồng hồ cát). Đánh thường **chém lan** ×0.5 lên quái quanh mục tiêu (3 đơn vị) |

Thiên phú 1 (Lv20) **Phán Quyết Tử Thần**: vào giao tranh (có địch trong tầm 9) và mỗi 15s, Zerith chỉ tay gắn **Ấn Tử** lên **tất cả** nhân vật phe địch: **−5 / 7,5 / 10% hồi máu nhận được**; Ấn Tử **không thể bị gỡ bằng bất kỳ cách nào** (chỉ hết theo thời gian). **Lưỡi Hái Hất Hồn lúc Đêm Tử Thần** (cả nhát hất lên lẫn nhát bổ xuống) lên mục tiêu có Ấn Tử **phá sạch khiên** — các đòn khác của Zerith không phá khiên. Thanh máu mục tiêu hiện **vạch NGƯỠNG TỬ** (5 / 7 / 10%). Máu chạm ngưỡng tử (bởi **bất kỳ đòn nào**) → **THẦN CHẾT PHÁN QUYẾT**: Thần Chết hiện sau lưng, **nhấc mục tiêu lên không trung từ từ (1,1s)** rồi **chém**: có khiên → **vỡ khiên, rơi xuống** (sống); không khiên → **chết**. Trong lúc bị nhấc: mục tiêu **không bị đánh trúng, không bị chọn làm mục tiêu, không nhận hiệu ứng mới**, trận bên dưới vẫn diễn ra. Xong thì **mất Ấn Tử**, chờ lượt gắn sau. Đang có **2 giây bất tử sau hồi sinh** (Thiên Thần Hộ Mệnh của Sera) thì **kháng được** phán quyết.
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
Thiên phú 2 (Lv40) **Long Huyết Bất Khuất**: máu tụt **dưới 50%** → Brakk hồi **25%** (SSS **30%**) máu, đồng đội hồi **10%** (SSS **15%**), **cả đội +1 Orb** (SSS **+2**) và được **giải mọi hiệu ứng bất lợi** (Ấn Tử thì không). Hồi 20s. Thêm **Độc Long**: khi đồng đội đã gục hết, **chỉ còn 1 mình Brakk trên sân** → mọi sát thương của Brakk **×2** (hào quang rồng lửa nhạt quanh người; đồng đội được hồi sinh thì tắt).
AI: áp sát (≤ 4 đơn vị) → Khổng Lồ → Chấn Địa khi có ≥ 2 quái quanh mình / đang bị đánh dồn / máu < 70% / đang Khổng Lồ → Bá Vương Quật quái trước mặt (khi Khổng Lồ, dư Orb hoặc mục tiêu yếu máu).
Hình (bản 2): ghép từ **tấm bộ phận vẽ riêng** (đầu khớp tròn, không cắt từ tranh toàn thân nữa) — `art/brakk/` (tranh nhìn nghiêng + 3/4, tấm bộ phận, tay & mắt, tranh + tấm bộ phận **dạng khổng lồ**, 3 tấm hiệu ứng — fx-c là Tiếng Hét Bảo Hộ) → `tools/cut_reference.py art/brakk/ref_spec.json` (mỗi mảnh có 2 da `normal` / `giant`, `brakkRig.js`) và `tools/build_fx_atlas.py art/brakk/fx_spec.json` (→ `brakk_fx.png`, vẽ ở `src/vfx/brakkFx.js`). Xem thử dạng khổng lồ: `/tools/preview-cutout.html?rig=../src/characters/cutout/brakkRig.js&clip=roar&t=0.4&giant=1`; xem thử kỹ năng + hiệu ứng theo từng mốc: `/tools/fx-brakk.html?s=grab` (grab / stomp / giant / ggrab / gstomp / gup / blood / shout / end).

### 4.8 Nerissa (Thủy Vũ) — Tu Sĩ nước, vũ công dải lụa 🌊 · tộc Elf · sát thương PHÉP
Tu sĩ nước múa dải lụa: **buff MP** cho cả đội và **đốt MP để hồi máu**. Ba kỹ năng là **3 điệu múa chạy SONG SONG** — múa nhiều điệu cùng lúc thì mỗi **tổ hợp** có điệu múa (animation) riêng và hiệu ứng riêng (thiên phú 1). Trong lúc múa Nerissa **lượn qua lại thật** quanh chỗ bắt đầu múa (±1,5 ngang, ±0,7 sâu, 1 vòng 3s — quái phải đuổi theo), **không đánh thường**, vẫn bấm thêm được các điệu khác. Bị **choáng** hoặc **gục** → dừng mọi điệu.
Lv1: HP 1.050 · M.ATK 170 · P.DEF/M.DEF 45/100 · chí mạng 8% · né 22% · chính xác 112% · tốc đánh 1000ms · tầm 8.

| Kỹ năng | Orb / hồi | Mô tả |
|---|---|---|
| Đánh thường | — | Vung lụa bắn **giọt nước** ×1.0 (phép) |
| **1. Vũ Khúc Sóng Triều** | 2 / 10s (tính **sau khi múa xong** hoặc bị ngắt) | Múa **5s**: cả đội (kể cả Nerissa) **tăng tốc hồi MP** +400 / 600 / 800 / 1.000 MP mỗi giây theo bậc Thường / S / SS / SSS → múa đủ 5s mỗi người thêm **2 / 3 / 4 / 5 Orb** (nhận dần, không nhận ngay) |
| **2. Lưu Thủy Hồi Xuân** | cần **≥ 1 Orb**, **không hồi chiêu** | Múa tới khi **hết Orb**: cứ **0,5s đốt 0,5 Orb** → cả đội hồi ×0.35 M.ATK + 1% máu tối đa. Đang múa thì không bấm lại được |
| **3. Thủy Thần Vũ** | 4 / 12s (tính **sau khi múa xong** hoặc bị ngắt) | Múa **10s**: cả đội **+20% máu tối đa** (hồi đúng phần tăng; hết giờ / Nerissa gục thì trả lại), **+30% lượng hồi máu nhận**, **+20% ATK** (P.ATK & M.ATK), **kháng khống chế** Nerissa 100% (giải luôn khống chế đang dính) · đồng đội 50% |
| **Cả 3 điệu cùng múa** | — | Mỗi **1s** bắn **nốt nhạc**: mọi đối thủ ×0.4 phép + **−15% M.DEF 3s**; mọi đồng đội **+10% sát thương phép 3s** + **50%** giải 1 hiệu ứng khống chế ngẫu nhiên (choáng / hất tung / hất văng / khiêu khích / bị túm) |

Thiên phú 1 (Lv20) **Hòa Âm Thủy Vũ** — hiệu ứng theo tổ hợp điệu đang múa:
- **1 + 2**: cả đội có **giáp nước 6 / 8 / 10%** máu (theo cấp thiên phú), giáp **tự hồi 1% máu mỗi giây** khi tổ hợp còn chạy (bong bóng nước quanh người).
- **2 + 3**: mỗi đối thủ **mất 0,15 Orb mỗi giây** (tối đa **2 Orb** mỗi lần tổ hợp) — Sóng Triều của tu sĩ nước phe bên kia luôn hồi nhanh hơn mức bị hút.
- **1 + 3**: phe ta **+15% tốc đánh**, phe địch **−10% tốc đánh**.
- **1 + 2 + 3**: cả đội **+1 Orb ngay** (1 lần mỗi trận; cấp tối đa 2 lần).

Thiên phú 2 (Lv40) **Triều Dâng**: mỗi khi **đối thủ gục** → cả đội **+1 Orb ngay**; Nerissa tự hồi MP nhanh hơn **25%** (SSS **40%**).
AI: đã giao tranh / quái trong 12 đơn vị → Thủy Thần Vũ → Sóng Triều (đang Thủy Thần, ít Orb hoặc đang đánh) → Lưu Thủy khi có ≥ 2 Orb và đồng đội dưới 85% máu (hoặc đã múa 1+3 để thành đủ 3 điệu).
Nút kỹ năng **đang chạy** có **vòng sáng chạy quanh viền** + **vạch thời gian còn lại** ở đáy nút (Lưu Thủy: vạch = MP còn lại); cả 3 điệu cùng chạy → vòng **vàng**. Trong lúc múa, nút đó không bấm được và chưa đếm hồi chiêu.
Hình: ghép từ **tấm bộ phận vẽ riêng** — `art/nerissa/` (tranh nhìn nghiêng + tư thế múa, tấm bộ phận, bàn tay & mắt, 8 đoạn dải lụa + đầu lụa, 2 tấm hiệu ứng). Mắt biểu cảm căn sẵn lên đầu bằng `tools/make_overlay_eyes.py art/nerissa/eyes_spec.json` → `art/nerissa/gen/`; cắt mảnh `tools/cut_reference.py art/nerissa/ref_spec.json` (→ `nerissa_atlas.png`, `nerissaRig.js`, `nerissaClips.js`); hiệu ứng `tools/build_fx_atlas.py art/nerissa/fx_spec.json` (→ `nerissa_fx.png`, vẽ ở `src/vfx/nerissaFx.js`). **Dải lụa** là chuỗi 7 khớp lò xo (tay gần) + 4 khớp (tay xa) nối từ bàn tay → tự bay theo động tác. Động tác múa: `dance1, dance2, dance3, dance12, dance13, dance23, dance123`. Xem thử: `/tools/preview-cutout.html?rig=../src/characters/cutout/nerissaRig.js&clip=dance123&t=0.3`; kỹ năng + hiệu ứng theo từng mốc: `/tools/fx-nerissa.html?s=d123` (auto / d1 / d2 / d3 / d12 / d123 / notes / shield / flow / drain / gift / end).

### 4.9 Elarion (Tam Nguyên) — Phù Thủy nguyên tố 🔮 · tộc Elf · sát thương PHÉP — ĐANG LÀM (tạm ẩn khỏi đội hình)
Cơ chế kiểu Invoker. Server đã xong (`CLASS_DEFS.elementalist`, `elem_golem`); còn thiếu hình + giao diện → thêm `'elementalist'` vào `SQUAD_ORDER` khi xong.
- **Ngọc Nguyên Tố** (🔥 Hỏa · ❄️ Băng · ⚡ Lôi):
  - Lơ lửng quanh pháp sư, cứ 3s rơi 1 viên ngẫu nhiên; một hệ không rơi quá 2 lần liền.
  - Tối đa 5 viên, mỗi viên sống 8s **giờ thật**.
  - Bấm vào ngọc để nhặt vào 3 ô; nhặt viên thứ 4 thì viên cũ nhất bị đẩy ra. Chỉ phe mình thấy ngọc của mình.
- **KN1 Sách Nguyên Tố** (0 Orb, hồi 2s): đọc 3 viên đang giữ (mất 3 viên) → phép tương ứng vào nút KN2.
- **KN2:** phép vừa ghép, mỗi phép có Orb và hồi chiêu riêng.
- **KN3 Bão Nguyên Tố** (3 Orb, hồi 30s): ngọc đủ 7 viên ngay; trong 7s cứ bớt là tung thêm; Sách hồi 1s.
- **10 phép:**

| Công thức | Phép | Orb / hồi | Tác dụng |
|---|---|---|---|
| 🔥🔥🔥 | Thiên Thạch | 3 / 14s | Sau 0,8s rơi vào chỗ đông đối thủ nhất: ×2,2 bán kính 4. Lăn 15 ô: ×0,6 mỗi đối thủ lăn qua. Vệt lửa 2 lần ×0,3 |
| ❄️❄️❄️ | Băng Phong | 2 / 12s | Cả đội địch ×0,8 và −20% tốc đánh 3s. Cơ hội đóng băng 20% / 1s → 40% / 2s (SSS) |
| ⚡⚡⚡ | Lôi Xích | 2 / 10s | ×1,2, nảy qua 5 đối thủ. −10% M.DEF 5s → −15% (SSS), không cộng dồn |
| 🔥❄️⚡ | Nguyên Tố Hợp Nhất | 5 / 25s | Gọi Golem Nguyên Tố 20s |
| ❄️❄️⚡ | Giáp Băng Sét | 2 / 15s | Khiên 25% máu bản thân 6s. Ai đánh trúng bị giật ×0,3 + choáng 0,5s (mỗi người 1 lần/giây) |
| ⚡⚡❄️ | Lốc Xoáy | 2 / 16s | Lốc bay thẳng 12 ô: ×0,8, đẩy lùi 4 ô |
| 🔥🔥❄️ | Hơi Nước Bỏng | 2 / 14s | Mây bán kính 4 trong 4s: ×0,25 mỗi 0,5s, trong mây đánh trượt 30% |
| 🔥🔥⚡ | Hỏa Lôi Cầu | 2 / 12s | Nổ bán kính 3: ×1,6 + choáng 1s |
| ❄️❄️🔥 | Tuyết Lở | 2 / 14s | Hàng trước địch (bán kính 3,5): ×1,2 + hất tung 1s |
| ⚡⚡🔥 | Tốc Lôi | 2 / 18s | Cả đội +30% tốc đánh 5s |

- **Golem Nguyên Tố:**
  - Nhân vật bình thường trên sân: bị đánh, nhận buff, tính thắng thua. Không có thẻ HUD, không được hồi sinh.
  - Chỉ số: máu 3,5× pháp sư, ATK 0,8× M.ATK, thủ 6× / 2,3×.
  - Cứ 2 đòn đánh thường thì dùng 1 kỹ năng ngẫu nhiên đang sẵn sàng (mỗi kỹ năng hồi 10s); bị choáng lúc niệm thì mất kỹ năng.
    - **Nộ Lửa:** niệm 1s, lướt chậm 8 ô: ×1,4 + hất tung; cả đội địch −10% M.DEF.
    - **Bão Tuyết:** niệm 3s, 6 lần ×0,35 trong 6s; mỗi tầng −2% tốc đánh; đủ 4 tầng thì đóng băng 1,5s, được giải hiệu ứng thì đếm lại.
    - **Hào Quang Sét:** niệm 3s, 5s giật mọi đối thủ quanh 4 ô mỗi giây: ×0,3 + choáng 0,5s.
- **Thiên phú 1 Cộng Hưởng Nguyên Tố:**
  - Nhặt ngọc thì hệ đó +1 tầng (tối đa 3), 5s, nhặt thêm thì làm mới.
  - Mỗi tầng: Hỏa +4 / 5 / 6% ATK · Băng hồi 0,3 / 0,4 / 0,5% máu mỗi giây · Lôi +4 / 5 / 6% tốc đánh.
- **Thiên phú 2 Thiên Tài Nguyên Tố:** dùng phép hoặc Bão thì 40% / 50% Sách hồi ngay và phép kế tiếp giảm 1 Orb (hồi 7s).
- **Test:** `debugAction { type: 'elemSpell', value: 'meteor' }` đặt thẳng 1 phép vào nút KN2.

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
| **Ấn Tử** (death_mark) | Phán Quyết Tử Thần (Zerith) | 15s, đầu lâu trên đầu; −5/7,5/10% hồi máu nhận được; Lưỡi Hái Hất Hồn lúc Đêm Tử Thần phá sạch khiên, máu dưới 5/7/10% → kết liễu |
| **Lướt lần 2** (reaper_echo) | Lưỡi Hái Xuyên Hồn lúc Đêm Tử Thần | 5s, lướt thêm 1 lần miễn phí |
| **Đêm Tử Thần** (reaper_form) | Đêm Tử Thần | 10s, bay, Hộ Vệ Thần Chết, +20% sát thương, +30% tốc đánh, −40% khống chế, không thể chết |
| **Bị túm** (grabbed) | Bá Vương Quật (Brakk) | Bị nhấc bổng qua đầu tới lúc bị quật (~0,85s) rồi choáng 1s |
| **Thần Lực Khổng Lồ** (giant_form) | Thần Lực Khổng Lồ | 10s, +50% máu tối đa, +40% thủ, +25% sát thương, 5s đầu miễn mọi hiệu ứng bất lợi, móc ngược hất tung |
| **Khiên Vảy Rồng** (brakk_shield) | Chấn Địa, Khí Thế Đấu Trường | 10s, cộng dồn thành 1 lớp; vòm vảy rồng quanh Brakk |
| **Độc Long** (lone_dragon) | Long Huyết Bất Khuất (Brakk) | Chỉ còn 1 mình Brakk trên sân: sát thương ×2 |
| **Ý Chí Thép** (iron_regen) | Thiên phú 1 Rok (Rok + người được nối dây) | 5s, mỗi giây hồi 3% máu (Rok còn dây: 6%) |
| **Hộ Mệnh** (revive_guard) | Thiên Thần Hộ Mệnh (Sera) | 2s sau khi hồi sinh: miễn mọi sát thương |
| **Giáp Lửa** (fire_ward) | Hỏa Tốc (Ignar) | 10s khiên lửa, +30% M.DEF, −40% khống chế; hết → nổ choáng 1s xung quanh |
| **Sóng Triều** (tide_mana) | Vũ Khúc Sóng Triều (Nerissa, cả đội) | 5s, hồi thêm 400–1.000 MP/giây theo bậc · giọt MP bay lên |
| **Phước Thủy Thần** (water_god) | Thủy Thần Vũ (cả đội) | 10s, +20% máu tối đa, +30% hồi máu nhận, +20% ATK, kháng khống chế (Nerissa 100%, đồng đội 50%) · hào quang nữ thần nước sau lưng Nerissa |
| **Giáp Nước** (water_shield) | Hòa Âm 1+2 (cả đội) | Khiên 6–10% máu, tự hồi 1%/giây, còn khi Nerissa múa Sóng Triều + Lưu Thủy · bong bóng nước |
| **Nốt Nhạc Vỡ Giáp** (note_break) | Cả 3 điệu múa (đối thủ) | 3s, −15% M.DEF |
| **Nốt Nhạc Cổ Vũ** (note_amp) | Cả 3 điệu múa (đồng đội) | 3s, +10% sát thương phép |
| **Nhịp Triều / Nước Cuốn** (tide_haste / tide_slow) | Hòa Âm 1+3 | Phe Nerissa +15% tốc đánh · phe địch −10% tốc đánh (khi tổ hợp còn chạy) |
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
    registry.js               classId -> cách vẽ + bảng hành động
    cutout/                   rig, clips, atlas của từng nhân vật + poseClip.js; creatureRig.js (quái)
  combat/                 dựng trận, xử lý sự kiện chiến đấu -> động tác + VFX
  vfx/                    hiệu ứng (vfx.js, lionSpirit.js, guardianSpirit.js)
  ui/                     HUD, overlay, input (nút, kéo thả & phóng to bảng test)
  render/toon.js          vật liệu toon cho cảnh
  assets/sprites/         atlas nhân vật
art/                      tranh gốc + atlas_spec.json (không đóng gói vào game)
tools/                    build_atlas.py, slice_parts.py, make_gdd_docx.js (tạo file Word), trang xem thử (preview-cutout / preview-scene / fx-*)
```

### 8.2 Công cụ xem thử (chạy `npm run dev`)
- `/tools/preview-cutout.html?rig=../src/characters/cutout/rokRig.js&clip=attack&t=0.1,0.2` — xem từng khung động tác.
- `/tools/preview-scene.html?team=assassin,warrior|monster_dummy` — xem nhân vật trong cảnh trận (console: `act(0,'attack')`, `step(0.5)`).
- `/tools/fx-lion.html`, `/tools/fx-guardian.html` — xem hình linh hồn sư tử / Thần Hộ Vệ.
- `/tools/fx-brakk.html?s=grab`, `/tools/fx-nerissa.html?s=d123` — xem kỹ năng + hiệu ứng theo từng mốc (gọi đúng hàm xử lý sự kiện của game với dữ liệu giả; console `stepTo(giây)`).

---

## 8.8 TẦM ĐÁNH & ĐỘI HÌNH
| Nhân vật | Tầm đánh | Ghi chú |
|---|---|---|
| Jessica, Rok | 2,4 | cận chiến, đứng đầu |
| Seraphine | 9 | đứng sau tank |
| Nerissa | 8 | kỹ năng (điệu múa) không cần tầm; lúc múa lượn qua lại quanh chỗ đứng |
| Ignar | 13 | kỹ năng tầm 16 |
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
