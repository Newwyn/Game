# Thiết kế anh hùng mới: PARY (Goblin cầm búa thánh – tank)

Ngày 21/11/2026. Người dùng chốt qua trò chuyện; chỗ ghi **(Claude đề xuất)** là số / chi tiết Claude tự điền, sẽ chỉnh khi thử.

## 1. Ý định
Nhân vật thứ 17 (mục tiêu 20). Một **tank gây khó chịu**: sát thương không ấn tượng nhưng rất nhiều khống chế, **hất văng tuyến trước của địch ra cuối sân để lộ tuyến sau** cho đội mình đánh, và **chặn mọi chiêu dịch chuyển** (sát thủ không lách được vào tuyến sau đội mình). Khác Rok (khiên, khiêu khích) và Brakk (đấu sĩ hoá khổng lồ).

## 2. Con người và tạo hình
- Tên **Pary**. Cô bé **tộc Goblin**, nhỏ xíu, vác **cây búa thánh** to hơn người. Goblin đầu tiên đứng hàng trước (Grix, Nyx đều đánh xa).
- **Cốt truyện (chỉ là truyện, không thành luật chơi):** cây búa thánh đã **tự chọn** Pary.
- Kiểu dáng gợi ý của người dùng: nhỏ người, búa to (giống kiểu Poppy của LoL). **(Claude quyết)** thiết kế hoàn toàn riêng của game: không chép tên, trang phục, búa hay màu của Poppy. Hướng vẽ: da xanh nhạt, tai nhọn to, bím tóc, giáp nhẹ; búa phát sáng, hoa văn cổ, to gấp đôi người bé; 3 bậc S / SS / SSS khác nhau ở giáp và độ lộng lẫy của búa.
- **(Claude đề xuất)** mã lớp `holyhammer`, `classGroup: 'warrior'`, tộc Goblin, cận chiến, sát thương vật lý, chỉ số tank tương đương Rok (máu / thủ cao, công thấp).

## 3. Chiêu thức (người dùng chốt; số Claude đề xuất)

### Chiêu 1 – Búa Thánh Phán Xét
- **Niệm 2 giây**: xoay búa rồi **đập mạnh**, **mục tiêu bị hất bay thật xa** (về tận cuối sân phía địch), rơi xuống bị choáng.
- Trong lúc niệm: Pary **giảm sát thương nhận vào** và **kháng mọi hiệu ứng** (không bị choáng / hất / ngắt).
- **(Claude đề xuất)** 2 Orb, hồi 9s, tầm cận chiến, sát thương ×1,4 công, giảm 50% sát thương khi niệm, choáng 1s khi rơi; bay tới cách mép sân phía địch 2 đơn vị (không ra ngoài sân). Khổng Lồ (Brakk) / đối tượng không thể bị đẩy vẫn ăn sát thương + choáng, không bay.

### Chiêu 2 – Hào Quang Thánh Thần
- Pary mở **vùng hào quang quanh mình**. Khi hào quang còn: **địch xung quanh không dịch chuyển được** (xem mục 4).
- Pary nhận **khiên**, **càng nhiều người (đồng minh + địch, tính lúc mở) trong vùng thì khiên càng mạnh**, tối đa 5 người.
- **Đồng minh trong vùng chỉ nhận khiên** bằng **50% phòng thủ của Pary**; mọi hiệu ứng khác là của Pary.
- **Mỗi lần chặn được 1 cú dịch chuyển, khiên của Pary hồi lại theo %.**
- **(Claude đề xuất)** 2 Orb, hồi 14s, kéo dài 6s, bán kính 4,5. Khiên Pary = 8% máu tối đa × (1 + 0,25 × số người, tối đa 5) → tối đa 18% máu. Khiên đồng minh: "50% phòng thủ" quy đổi = 50% × (thủ vật lý + thủ phép) × 6 (để khiên có giá trị so với lượng máu; chỉnh khi thử). Chặn 1 dịch chuyển → hồi 15% khiên tối đa của Pary (không vượt tối đa).

### Chiêu 3 – Búa Thánh Khổng Lồ
- **Niệm 2 giây**, hiện ra **cây búa thánh rất to**, Pary **đập xuống đất 3 lần**.
- Lần 1 và 2: **hất tung + choáng nhẹ**. Lần 3: **đập chậm**, **hất tung TẤT CẢ đối thủ trên sân** (người dùng chốt: toàn sân), rơi xuống **choáng 1,5s**.
- **(Claude đề xuất)** 4 Orb, hồi 24s. Lần 1–2 trúng địch trong bán kính 5 quanh Pary, ×0,6 công, hất 0,4s + choáng 0,5s; lần 3 toàn sân ×1,2 công. Mốc: niệm 2s → đập 1 → +0,6s đập 2 → +1s đập 3. Không có kháng hiệu ứng khi niệm chiêu này (người dùng không yêu cầu) — Pary bị choáng giữa chừng thì mất chiêu như mọi chiêu niệm khác.

## 4. Chặn dịch chuyển (cơ chế mới)
- **Chiêu dịch chuyển** = chiêu **làm nhân vật chuyển sang chỗ khác** (lướt tới, dịch chuyển tức thời, nhảy lùi / nhảy ra sau lưng). Nhảy lên rồi đáp đúng chỗ cũ **không tính**.
- Danh sách hiện tại: Jessica (Phóng Bùa nhảy lùi, Đột Kích lướt, bước bóng ra sau lưng), Lyra (Tiễn Gió Chớp nhảy lùi), Zerith (lướt lưỡi hái), quái có chiêu vồ / lướt. **Brakk Bá Vương Quật KHÔNG tính** (người dùng chốt).
- Khi hào quang của Pary còn:
  - Địch **dịch chuyển vào / băng qua vùng** → **bị chặn**, dừng ở mép vùng, choáng ngắn **(Claude đề xuất 1s)**; Pary hồi khiên (chiêu 2).
  - Địch **đứng trong vùng** → **không dùng được chiêu dịch chuyển** (nút tối lại; AI không chọn chiêu đó); vẫn đi bộ, đánh thường, dùng chiêu khác bình thường.
- **Cho người chơi biết** (người dùng đồng ý): nhãn **"↗ Dịch chuyển"** trên các chiêu loại này trong bảng nhân vật; trạng thái **"🚫 Khoá dịch chuyển"** trên địch đứng trong vùng; chữ nổi **"Bị chặn!"** khi chặn được.

## 5. Thiên phú
- **Thiên phú 1:** cứ **3 đòn đánh thường** thì Pary **quăng búa vào 1 địch ngẫu nhiên ở hàng sau**, choáng 1s, búa quay về và Pary nhận **khiên**. **(Claude đề xuất)** hàng sau = các địch đánh được, trừ người gần Pary nhất; ×0,8 công; khiên 6% máu tối đa, 6s.
- **Thiên phú 2 – Càng bị vây càng cứng (người dùng chọn hướng a):** mỗi địch đứng gần Pary **+8% thủ vật lý và thủ phép**, tối đa 5 địch (+40%). **(Claude đề xuất)** "gần" = trong 4,5 đơn vị (bằng bán kính hào quang).

## 6. Mục tiêu / không làm / phải tránh
- **Mục tiêu:** chơi được trọn vẹn (mua, lên cấp, thiên phú, AUTO, PvP), có bài kiểm tra, tranh S / SS / SSS + bộ động tác + icon (vẽ bằng Flow), hiệu ứng pixelfx.
- **Không làm lúc này:** cốt truyện riêng / nhiệm vụ nhân vật.
- **Phải tránh:** khoá chết đối thủ bằng choáng liên tục (dùng kháng hiệu ứng / thời gian miễn choáng sẵn có của game); hất địch ra ngoài sân; chặn nhầm chiêu không đổi chỗ; trận PvP không kết thúc.

## 7. Cách làm đã cân nhắc
1. **Đánh dấu sẵn từng chiêu dịch chuyển (`relocate: true`) + trạng thái "khoá dịch chuyển" do hào quang Pary gắn lên địch (chọn):** chắc chắn, dễ kiểm tra, nhân vật mới chỉ cần thêm 1 dấu.
2. Để game tự phát hiện nhân vật đổi chỗ lúc chạy rồi kéo lại: không phải sửa từng chiêu, nhưng dễ bắt nhầm (bị đẩy, bị kéo, đứng hàng) và khó báo trước cho người chơi.

## 8. Việc để người làm tự quyết (ghi trong báo cáo)
- Chỉ số gốc, số liệu từng chiêu, giá mua (như các nhân vật trước: 1200): cân bằng bằng giả lập so với Rok.
- Cách vẽ hiệu ứng: ưu tiên pixelfx, thiếu thì vẽ bằng Flow.

## 9. Tranh cần vẽ (Flow)
3 tấm tạo hình S / SS / SSS cho người dùng duyệt trước → bộ tấm động tác SSS (đứng, đánh thường, chạy, niệm xoay búa + đập, mở hào quang, niệm búa khổng lồ + 3 cú đập, ném búa, trúng đòn / choáng, gục / thắng) → bộ S / SS vẽ lại theo tấm SSS → 6 icon → hiệu ứng vẽ tay khi pixelfx thiếu (búa khổng lồ, hào quang).
