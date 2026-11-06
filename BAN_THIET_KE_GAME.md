# 📘 BẢN THIẾT KẾ GAME (bản nháp đang bàn)

> File này ghi lại **những gì đã chốt** khi bàn hướng đi mới của game (06/11/2026). Có thay đổi thì sửa thẳng vào đây.
> Ký hiệu: **(đã chốt)** = bạn quyết · **(đề xuất)** = Claude đề xuất, bạn chưa phản đối · **(chưa quyết)** = còn để ngỏ.
> Con số chỉ số / tỉ lệ là **bản nháp**, sẽ chỉnh khi chạy giả lập trận (`tools/sim_battle.js`).

---

## 1. Tên game
- **(đã chốt)** Bỏ tên cũ "Legend of Capsules", đặt **tên mới**.
- **(chưa quyết)** Tên mới.

## 2. Phong cách hình ảnh
- **(đã chốt)** Tranh **vẽ tay bản 3** (chibi) cho mọi nhân vật — **không** Pixel, **không** 3D, **không** ghép mảnh xương.
- **(đã chốt)** Làm mượt bằng code (nhịp khung có lấy đà — đã làm) + khung chen giữa ở chỗ giật nhất (vẽ thêm có giới hạn, làm sau cùng).
- **(đã chốt)** Không khựng hình khi trúng đòn (game nhịp nhanh, nhiều hiệu ứng choáng / đóng băng).

## 3. Cách chơi — 2 lớp bản đồ
### 3.1 Bản đồ thế giới **(đã chốt)**
- Màn hình **ngang kiểu MapleStory**: nhân vật đi lại, **nói chuyện với NPC**, tương tác.
- **Giải đố, tìm tài nguyên**. Có đánh nhưng **ít**, thường phải **dùng chiến thuật / mẹo** để vượt qua.
- **(đề xuất)** Không tốn thể lực — luôn có việc để làm.
- Tranh nhân vật bản 3 vẽ nhìn nghiêng, có sẵn động tác chạy / đứng → dùng lại được. Cần vẽ mới: **phong cảnh** (nền, mặt đất, nhà cửa), **NPC**.
- **(chưa quyết)** Câu đố trông ra sao, tài nguyên gồm những gì, bản đồ rộng cỡ nào.

### 3.2 Bản đồ ải **(đã chốt)**
- Đánh ải **theo cốt truyện**, dùng cách đánh hiện tại: **đội tự lao vào đánh, người chơi ra lệnh kỹ năng** (KHÔNG tự điều quân).
- Mỗi ải **3 độ khó: Cốt truyện → Khó → Địa ngục**.
- **(đề xuất)** Quét nhanh ải đã đánh qua ở mức tốt nhất (vẫn tốn thể lực).

### 3.3 Phó bản 20 ải (mỗi tộc 1 phó bản cốt truyện) **(đã chốt)**
- **20 ải**: 1–4 làm quen → **5 trùm nhỏ** → 6–9 → **10 trùm giữa chương** (mở tính năng mới) → 11–14 → **15 trùm nhỏ** → 16–19 → **20 trùm cuối tộc**.
- **Khó** mở khi qua ải đó ở mức Cốt truyện; **Địa ngục** mở khi qua **hết 20 ải mức Khó**.
- **Nhánh ải**: mỗi phó bản **3–5 nhánh**, **mở bằng việc làm ngoài bản đồ thế giới** (giải câu đố, giúp NPC, tìm vật phẩm ẩn). Thưởng: **mở tính năng** (VD lò rèn, quán ăn), **anh hùng gia nhập** (VD Lyra), **cốt truyện ẩn** (manh mối Thất Thánh, tộc cổ xưa).

## 4. Cốt truyện
- **(đã chốt)** **Chiến tranh giữa các chủng tộc** — tộc nào cũng muốn mạnh nhất. Song song có **những người muốn hòa bình**, cùng phát triển, khám phá thế giới.
- **(đã chốt)** Phản diện: **thần thánh** và **phản thần** — **không ác tuyệt đối**; có quy luật, mong muốn riêng nên vô tình thành phản diện.
- **(đã chốt)** Có **Thất Thánh** (7 vị thánh) gắn với cốt truyện; một **tộc cổ xưa** làm phản diện; có **cú lật** (chưa nghĩ ra).
- **(đã chốt)** **Nhân vật chính = ẩn số**: mất hết ký ức, thật ra là người **gỡ mọi nút thắt**, mang sức mạnh **thay đổi thế giới** nhưng **đang bị phong ấn**. Mở sức mạnh dần; về sau **tự ra trận được** (để sau).
- **(đề xuất)** Giải thích cách chơi bằng cốt truyện: sức mạnh bị phong ấn còn sót lại = **mối liên kết** giúp nhân vật chính **dẫn dắt** các anh hùng → người chơi "ra lệnh kỹ năng".

### 4.1 Mở đầu game **(đã chốt — cách 2)**
1. **Đoạn mở màn (1–2 phút)**: người chơi điều khiển **bản thân lúc còn đủ sức mạnh**, đánh với **một vị thần** — chiêu cực mạnh, cực đẹp. Cao trào → bị **phong ấn**, màn hình trắng xoá.
2. **Tỉnh dậy mất trí nhớ** giữa đống đổ nát ở **làng biên giới tộc Người**; **đội tuần tra của Rok** tìm thấy, đưa về làng.
3. **Hướng dẫn 10 phút đầu**: làm quen thế giới, đi lại, nói chuyện NPC, câu đố nhỏ → làng bị tấn công → **trận đầu tiên**: phát hiện mình "ra lệnh" được cho Rok, Jessica, Seraphine (Lyra gia nhập ở ải 12).
- Đoạn mở màn dùng làm **video giới thiệu game** được.

### 4.2 Chương 1 **(đã chốt)**
- Bắt đầu ở **tộc Người** = phó bản 20 ải đầu tiên (mục 3.3).
- **(đã chốt — hướng A, Claude viết chi tiết)** Toàn bộ chương 1: xem **`CHUONG_1_TOC_NGUOI.md`** (20 ải, nhánh ải, NPC, bản đồ, thứ tự mở tính năng). Lyra gia nhập ở **ải 12** (cốt truyện chính, không phải nhánh).

## 5. Chủng tộc
| Tộc | Chỉ số tộc | Đặc tính | Anh hùng |
|---|---|---|---|
| 🧑 Người | +5% Máu, Tấn công, Thủ | **Thích Nghi**: vào trận +500 MP (nửa Orb) | Jessica, **Rok**, Seraphine, Ignar |
| 🧝 Elf | +12% chính xác, +8% né, +10% hồi MP | **Linh Mẫn**: né được → đòn kế +20% sát thương | Lyra, Nerissa, Elarion, Sylva |
| 🐉 Rồng | +15% Máu, +10% thủ, −5% tốc đánh | **Vảy Rồng**: chí mạng nhận vào −25% | Brakk |
| 👺 Goblin | +10% chí mạng, +10% xuyên giáp, +10% tốc chạy, −10% Máu | **Thừa Cơ**: đánh kẻ bị khống chế +15% | Grix |
| 😈 Quỷ | +12% tấn công, +5% hút máu, −8% thủ | **Khế Ước Máu**: máu < 30% → +15% sát thương | Zerith |

- **(cần sửa)** Dữ liệu game đang ghi **Rok = tộc Rồng** → nhầm, **Rok là tộc Người** (sửa khi bắt tay làm).
- **(chưa quyết)** Thêm tộc mới sau. Thần thánh, phản thần, Thất Thánh, tộc cổ xưa chưa có trong game.
- **(đề xuất)** Lyra là Elf sống giữa tộc Người → điểm truyện riêng.

## 6. Anh hùng
- **(đã chốt)** **4 anh hùng gia nhập theo cốt truyện** để đủ đội từ đầu: **Jessica, Rok, Seraphine, Lyra**.
- **(đã chốt)** Anh hùng khác: **mua bằng Kim Cương ở cửa hàng chung** + **tăng độ thân mật ở quán ăn**.
- **(chưa quyết)** Quán ăn & độ thân mật hoạt động thế nào (thân mật để mở khoá mua, hay mua rồi mới tăng thân mật?).
- **(đã chốt)** Mỗi nhân vật có **tag loại sát thương**:
  - **STVL** (sát thương vật lý): Jessica, Rok, Lyra, Brakk
  - **STP** (sát thương phép): Seraphine, Ignar, Zerith, Nerissa, Elarion, Grix, Sylva
- Hiện có: cấp tối đa 60, bậc Thường / S / SS / SSS (đột phá), thiên phú.

## 7. Quay thưởng (gacha) & cửa hàng **(đã chốt)**
- Gacha **chỉ** cho **vũ khí độc quyền (unique)** và **thời trang**.
- Thời trang: có loại **mua thẳng**, có loại **phải quay**.

## 7b. Tiền tệ **(đã chốt)**
| | Vàng | Kim Cương |
|---|---|---|
| Độ hiếm | Phổ biến | Hiếm — chủ yếu **nạp** |
| Kiếm ở đâu | Ải, **bản đồ thế giới**, bán đồ | Nạp; miễn phí một ít: lần đầu qua ải, rương ẩn / câu đố trên **bản đồ thế giới**, thành tựu, nhiệm vụ ngày |
| Dùng để | Phí cường hoá, phí tinh luyện, cửa hàng NPC, quán ăn | Mua anh hùng, quay thưởng, thể lực, thêm lượt hầm ngục nhẫn |
- Kim Cương miễn phí phải **đủ** để người không nạp vẫn mua được anh hùng mới sau vài tuần chơi.

## 8. Thể lực **(đã chốt có thể lực; chi tiết là đề xuất)**
- **(đã chốt)** Tối đa **360**, tự hồi **1 điểm / 5 phút**, mua thêm bằng Kim Cương (50 Kim Cương → +60).
- **(đã chốt)** Mỗi trận tốn **Cốt truyện 4 · Khó 6 · Địa ngục 10**; thua / bỏ trận hoàn lại (chi phí − 1).
- Tốn thể lực: **ải cốt truyện** (Cốt truyện < Khó < Địa ngục), **hầm ngục đồ bộ**. **(đề xuất)** đánh thua chỉ mất một ít.
- **Không** tốn: bản đồ thế giới (đề xuất); **hầm ngục nhẫn / dây chuyền** tính theo **lượt mỗi ngày** (đề xuất 3 lượt, mua thêm bằng Kim Cương).

## 9. Trang bị
### 9.1 Ô & cấp **(đã chốt)**
- **6 ô**: Vũ khí · Áo · Tay · Chân · Nhẫn · Dây chuyền.
- **Cấp đồ**: 10 · 20 · 30 · 40 · 50 · 60 (tối đa), mở dần theo cốt truyện. **(đề xuất)** chỉ mặc được đồ ≤ cấp anh hùng.
- **Nguồn đồ**: cốt truyện → đồ thường **không theo bộ**; **hầm ngục từng tộc** → **đồ bộ**; **hầm ngục riêng** → nhẫn, dây chuyền + nguyên liệu nâng cấp chúng (**giới hạn số lần vào**).

### 9.2 Độ hiếm **(đề xuất)**
Thường (trắng) → Tốt (xanh lá) → Hiếm (xanh dương) → Sử thi (tím) → Huyền thoại (cam). Độ hiếm quyết định **số dòng phụ (1–4)** và độ mạnh. Cốt truyện: trắng → xanh dương; hầm ngục: tím trở lên.

### 9.3 Cách ghi chỉ số **(đã chốt)**
- Chỉ số **số lượng** (Tấn công, Máu, Thủ, Hồi năng lượng) ghi **số**; chỉ số **tỉ lệ** (chí mạng, sát thương chí mạng, né, chặn, xuyên giáp, chính xác, tốc đánh) ghi **%**.
- **Tấn công** (cả dạng số lẫn %) **cộng chung** cho STVL và STP — tự cộng vào loại sát thương của nhân vật. **(đề xuất)** gộp luôn dòng Tấn công trên đồ thành 1 dòng. **Thủ vẫn tách** vật lý / phép.

### 9.4 Chỉ số chính (cố định theo ô — mốc cấp 60, cam) **(đề xuất)**
| Ô | Chỉ số chính |
|---|---|
| Vũ khí | +300 Tấn công |
| Áo | +2500 Máu |
| Chân | +90 Thủ vật lý, +90 Thủ phép |
| Tay | +6% Xuyên giáp |
| Nhẫn | +8% Tỉ lệ chí mạng |
| Dây chuyền | +40 Hồi năng lượng mỗi đòn |

### 9.5 Dòng phụ (4 dòng ngẫu nhiên, giá trị ngẫu nhiên trong khoảng) **(đã chốt cách; số là đề xuất)**
Mốc cấp 60, cam:
| Dòng | Thấp nhất | Cao nhất |
|---|---|---|
| Tấn công | 50 | 100 |
| Máu | 450 | 900 |
| Thủ vật lý | 20 | 40 |
| Thủ phép | 20 | 40 |
| Hồi năng lượng (mỗi đòn) | 8 | 16 |
| Tỉ lệ chí mạng | 3% | 6% |
| Sát thương chí mạng | 6% | 12% |
| Né | 1,5% | 3% |
| Chặn | 1,5% | 3% |
| Xuyên giáp | 2% | 4% |
| Chính xác | 2% | 4% |
| Tốc đánh | 2% | 4% |

- **Hệ số cấp đồ**: cấp 10 = 20% · 20 = 35% · 30 = 50% · 40 = 65% · 50 = 80% · 60 = 100%.
- **Hệ số độ hiếm**: trắng 60% · xanh lá 70% · xanh dương 80% · tím 90% · cam 100%.
- Ví dụ: dòng Máu trên đồ cấp 30 xanh dương = 50% × 80% → **180 – 360**.
- Né / Chặn để thấp vì game giới hạn **Né tối đa 50%, Chặn tối đa 60%**.
- **(đề xuất)** Mỗi dòng có thanh nhỏ cho biết con số nằm đâu trong khoảng; dòng ≥ 90% → **chữ vàng lấp lánh**.

### 9.6 Roll dòng **(đã chốt có roll; loại đá là đề xuất)**
- **Đá Tinh Luyện**: roll **hoàn toàn ngẫu nhiên** 1 dòng — có thể **đổi sang dòng khác** hoặc **tăng / giảm số**.
- **(đề xuất)** **Đá Hoàn Mỹ** (hiếm): **giữ loại dòng, chỉ roll lại con số**.
- **(đề xuất)** **Khoá dòng** ưng ý (tốn thêm đá).

### 9.7 Cường hoá **(đã chốt luật; số là đề xuất)**
Tối đa **+10**; +1 → +5 chắc chắn; từ +6 giảm dần; **từ +8 trở lên thất bại → tụt 1 cấp**; có vật phẩm tăng tỉ lệ.
| Đập lên | Tỉ lệ | Chỉ số chính tăng | Cộng dồn |
|---|---|---|---|
| +1 → +5 | 100% | +5% mỗi cấp | +25% |
| +6 | 80% | +8% | +33% |
| +7 | 65% | +9% | +42% |
| +8 | 50% (hỏng → +7) | +11% | +53% |
| +9 | 35% (hỏng → +8) | +13% | +66% |
| +10 | 20% (hỏng → +9) | +16% | +82% |
- **(đề xuất)** Mốc **+5**: 4 dòng phụ +10%. Mốc **+10**: món đồ **phát sáng** (vũ khí sáng trong trận).
- Vật phẩm: **Bùa May Mắn** (+10%, 1 bùa / lần); **(đề xuất)** **Đá Bảo Hộ** (không tụt cấp); **(đề xuất)** **tích may mắn** +5% mỗi lần hỏng (về 0 khi thành công).
- Giả lập: không bùa trung bình **~63 lần đập** / món lên +10; có tích may mắn **~56 lần**.
- **Đá Cường Hoá (đã chốt)** — 1 loại đá, số lượng tăng theo cấp đồ. Mỗi lần đập: cấp 10 = 1 · 20 = 2 · 30 = 3 · 40 = 5 · 50 = 7 · 60 = 10 viên; **×2** khi đập +6/+7, **×3** khi +8/+9, **×4** khi +10. (+ phí Vàng)
- Tổng trung bình / món: cấp 10 → +5: 5 · +7: ~10 · +10: ~150 viên | cấp 30 → 15 · ~31 · ~450 | cấp 60 → 50 · ~105 · **~1500**.
- **Nguồn đá**: rơi ở ải (Khó / Địa ngục nhiều hơn), **mỏ đá trên bản đồ thế giới**, nhiệm vụ ngày, **phân giải đồ thừa thành đá** (đồ chỉ số ngẫu nhiên → món nào nhặt cũng có giá trị, túi khỏi đầy).

## 10. Bộ đồ theo tộc — 3 bộ / tộc = 15 bộ **(đã chốt có 3 bộ; nội dung là đề xuất)**
- **(đã chốt — cách A)** Mỗi tộc đúng **1 bộ Tấn công · 1 bộ Phòng thủ · 1 bộ Hỗ trợ / Đặc biệt**, mang tính cách tộc → vùng tộc nào cũng đáng đi. Bàn kỹ từng tộc khi làm tới tộc đó; **tộc Người đã chốt**, các tộc khác là nháp, sẽ chỉnh theo cách A.
- Bộ gồm **4 món: Vũ khí · Áo · Tay · Chân** (nhẫn, dây chuyền **không** thuộc bộ). Thưởng khi mặc **2 món** và **4 món**. Ai / tộc nào cũng mặc được; phối 2 + 2 được.

| Tộc | Bộ | 2 món | 4 món |
|---|---|---|---|
| 🧑 Người ✅ | Hộ Vệ Vương Quốc (phòng thủ) | +10% Thủ | Lần đầu máu < 50%: khiên 15% máu tối đa, cả đội +5% thủ 6 giây |
| 🧑 Người ✅ | Chiến Lược Gia (hỗ trợ) | +15% Hồi năng lượng | Dùng kỹ năng 3 Orb → hoàn 1 Orb, cả đội +10% Tấn công 5 giây |
| 🧑 Người ✅ | Lữ Khách (tấn công) | +8% Tấn công | Mỗi đồng đội **khác tộc**: +6% sát thương (tối đa 3 người = +18%) |
| 🧝 Elf | Gió Rừng (tấn công) | +3% Né | Né được: hồi 3% máu, đòn kế chắc chắn chí mạng |
| 🧝 Elf | Tinh Linh Ánh Trăng (hỗ trợ) | +10% Tấn công | Hồi máu / khiên +20%; mỗi 10 giây gỡ 1 hiệu ứng xấu khỏi đồng đội ít máu nhất |
| 🧝 Elf | Mũi Tên Bạc (đánh xa) | +4% Tốc đánh | Mỗi đòn thường thứ 4 bắn thêm đòn phụ 50% vào kẻ địch ngẫu nhiên |
| 🐉 Rồng | Vảy Rồng (thủ) | +12% Máu | Mỗi lần bị chí mạng: +5% thủ (tối đa 5 lần) |
| 🐉 Rồng | Hỏa Long (tấn công) | +8% Tấn công | Đòn thường 20% gây Bỏng; càng nhiều máu sát thương càng cao |
| 🐉 Rồng | Long Huyết (hồi phục) | +15% lượng máu được hồi | Mỗi 5 giây hồi 2% máu; lần đầu máu < 30% hồi ngay 20% |
| 👺 Goblin | Mưu Kế (khống chế) | +4% Xuyên giáp | Đánh kẻ bị choáng / đóng băng: +20% sát thương chí mạng; khống chế mình gây +0,5 giây |
| 👺 Goblin | Thợ Săn (tấn công) | +4% Tỉ lệ chí mạng | Mỗi đòn chí mạng: +3% tốc đánh (tối đa 5 lần) |
| 👺 Goblin | Độc Dược (độc) | Đòn đánh 15% gây Trúng Độc 3 giây | Kẻ trúng độc: −20% hồi máu, nhận thêm 10% sát thương từ cả đội |
| 😈 Quỷ | Khế Ước Máu (cuồng chiến) | +3% Hút máu | Máu < 50%: +15% Tấn công, +15% hút máu |
| 😈 Quỷ | Vực Sâu (phá thủ) | +6% Sát thương chí mạng | Chí mạng gây Ăn Mòn: −10% thủ 4 giây (tối đa 3 lần) |
| 😈 Quỷ | Hắc Ấn (dồn thế) | +10% Tấn công | Hạ gục kẻ địch: hồi 1 Orb, +20% tốc đánh 5 giây |

## 11. Online **(đã chốt có; làm sau)**
- Bản đồ thế giới **chỉ có NPC** (chơi một mình).
- **Khu vực chung** để người chơi gặp nhau · **PVP** · **PVP xếp hạng nhận quà** (sau) · **Bang hội** · **Co-op = chiến tranh bang hội**. Co-op khác: **(chưa quyết)**.
- Cần **máy chủ online** chạy liên tục: tài khoản, lưu dữ liệu trên máy chủ, ghép trận, chống gian lận, **tiền thuê máy chủ hàng tháng**.

## 12. Lộ trình phát hành **(đề xuất)**
- **(đã chốt)** Làm **trọn từng tộc** (đủ gameplay + cốt truyện của tộc đó) rồi mới sang tộc khác.
1. **Bản 1 — tộc Người hoàn chỉnh, chơi một mình**: mở màn + hướng dẫn, vùng thế giới tộc Người (màn ngang, NPC, câu đố, tài nguyên), **phó bản 20 ải + nhánh ải**, đủ 3 độ khó, trang bị + 3 bộ đồ tộc Người, cường hoá, lưu trên máy. **Mục tiêu: cho người thật chơi thử.** Làm sẵn nền móng để lắp online sau không phải đập đi.
2. **Bản 2 — online cơ bản**: tài khoản, lưu trên máy chủ, PVP.
3. **Bản 3 — cộng đồng**: khu gặp nhau, bang hội, chiến tranh bang hội, PVP xếp hạng.
- Âm thanh: làm **sau** khi xong cốt truyện / thế giới / cách chơi.

## 13. Còn để ngỏ
- Tên game mới · cú lật cốt truyện · Thất Thánh là ai · tộc cổ xưa · tộc mới.
- Bản đồ thế giới: câu đố, tài nguyên (dùng để làm gì), cách đánh bằng mẹo.
- Quán ăn & độ thân mật · giá Kim Cương · cách kiếm Kim Cương.
- Nhẫn / dây chuyền: nâng cấp bằng nguyên liệu gì, có dòng riêng / bộ riêng không.
- Mở sức mạnh nhân vật chính & lúc nào tự ra trận.
- Vũ khí độc quyền (gacha) khác vũ khí thường thế nào.
