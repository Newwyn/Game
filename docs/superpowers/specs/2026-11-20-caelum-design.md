# Thiết kế anh hùng mới: CAELUM (Tu sĩ chiến – thánh giá)

Ngày 20/11/2026, người dùng duyệt 21/11/2026. Người dùng chốt qua trò chuyện; chỗ ghi **(Claude đề xuất)** là số / chi tiết Claude tự điền, sẽ chỉnh khi thử.

## 1. Ý định
Nhân vật thứ 16 (mục tiêu 20). Một tu sĩ chiến **dựng trận địa bằng thánh giá**: người chơi tự kéo thả thánh giá xuống sân, chọn đúng chỗ để vừa buff đồng đội vừa phá đối thủ. Kỹ năng chính của người chơi là **chọn vị trí và loại thánh giá**.

## 2. Con người và tạo hình (người dùng chốt)
- Tên **Caelum**. Elf nam, đã mấy ngàn tuổi nhưng dáng nhỏ nhắn như cậu bé. Tóc vàng ngắn, tai nhọn, **mắt xanh vô hồn**, lạnh lùng, ít nói, sùng đạo.
- Áo tu sĩ tay dài phủ kín bàn tay (chắp trước ngực), quần short, mũ tu sĩ; **lơ lửng** chứ không đi bộ (vẫn bị đánh trúng bình thường).
- Cây thánh giá khổng lồ đeo sau lưng (đai da + xích).
- Tạo hình đã duyệt: `art/crosspriest/01-character-s.jpg` (dép da, vải quấn chân), `01-character-ss.jpg` (dép đính đinh), `01-character-sss.jpg` (ủng trắng vàng). Bản thử khác nằm trong `art/crosspriest/old/`.
- Lớp nhân vật: **pháp sư hỗ trợ**, sát thương phép, đánh xa. **(Claude đề xuất)** mã lớp `crosspriest`, tộc Elf, `classGroup: 'priest'`.

## 3. Kéo thả trên sân (tính năng mới)
- Chiêu 1 dùng bằng **kéo thả**: giữ nút chiêu, kéo ra sân, thả để cắm thánh giá đúng chỗ.
- **Khi đang kéo:** hiện vùng ảnh hưởng dạng **dễ nhìn** (vòng tròn rõ nét, màu theo loại thánh giá) và bóng mờ thánh giá đi theo con trỏ / ngón tay. Ngoài tầm đặt thì vòng đổi màu đỏ và tự ghim về mép tầm. Kéo ngược về nút rồi thả = huỷ, không mất Orb.
- **Khi đã cắm xuống:** vùng vẫn hiện, nhưng là **hiệu ứng nhẹ nhàng** (vòng mờ, vài đốm sáng), không che trận.
- **Bấm mà không kéo**, hoặc đang bật **AUTO**: game tự đặt vào chỗ hợp lý.
- Trận vẫn chạy bình thường khi đang kéo (không dừng hình). Máy chủ kiểm lại vị trí (trong tầm, trong sân).
- **(Claude quyết)** làm phần kéo thả thành tính năng dùng chung được, nhưng hiện chỉ Caelum dùng.

## 4. Chiêu thức

### Chiêu 1 – Đặt thánh giá (2 Orb, hồi 5 giây)
- Trên nút chiêu 1 có **4 nút nhỏ chọn loại** (giống cách chọn của Elarion). Chọn loại rồi kéo thả.
- **Mỗi thánh giá có vùng tròn tầm trung** (người dùng: không to, để người chơi phải tính chỗ đặt). Vùng **to dần theo cấp** (người dùng chốt). **(Claude đề xuất)** bán kính cấp 1 / 2 / 3 = 3 / 3,6 / 4,2 đơn vị; tầm đặt 14 đơn vị quanh Caelum.
- Mỗi thánh giá tác động **cả hai phe cùng lúc**: đồng đội trong vùng nhận phần có lợi, đối thủ trong vùng chịu phần bất lợi.

| Loại | Đồng đội trong vùng | Đối thủ trong vùng | Nhịp **(Claude đề xuất trừ sấm sét)** |
|---|---|---|---|
| 1 – Sinh mệnh | hồi máu, hồi Orb | giảm hồi máu, giảm hồi Orb | mỗi 2 giây |
| 2 – Uy lực | tăng tấn công, phòng thủ, tốc đánh | giảm tấn công, phòng thủ, tốc đánh | hào quang: đứng trong là có, ra khỏi 1 giây thì mất |
| 3 – Sấm sét | — | 1 tia sét / giây vào 1 đối thủ ngẫu nhiên trong vùng, choáng 0,5 giây (mỗi đối thủ 2 giây mới bị choáng lại) | mỗi 1 giây (người dùng chốt) |
| 4 – Thanh tẩy | tạo khiên, xoá hiệu ứng xấu | xoá hiệu ứng tốt, giảm kháng hiệu ứng | khiên mỗi 5 giây, xoá mỗi 3 giây |

- **Lên cấp:** cấp 1 khi đặt, cấp 2 sau 10 giây, cấp 3 sau 10 giây nữa; chỉ số tăng theo cấp. Ở cấp 3 tồn tại 10 giây rồi tan.
- **Tối đa 4 thánh giá** từ chiêu 1, được trùng loại. Đặt cái thứ 5 thì **cái đặt sớm nhất bị huỷ**; cái mới **nhận cấp và thời gian đang đếm** của cái bị huỷ. Nếu cái bị huỷ đang cấp 3 thì cái mới vẫn có **đủ 10 giây**.
- **Chồng vùng:** nhiều thánh giá cùng loại chồng nhau thì **chỉ sấm sét và hồi máu cộng dồn**; các hiệu ứng khác lấy cái cấp cao nhất.
- **Thánh giá không bị đánh** (không máu, không bị chọn làm mục tiêu). Sẽ theo dõi khi thử; nếu quá mạnh thì thu nhỏ vùng, giảm số cây tối đa hoặc cho thánh giá có máu.
- **AUTO đặt ở đâu (Claude đề xuất):** chọn loại theo tình hình (đồng đội mất máu → Sinh mệnh; đối thủ tụm lại → Sấm sét; có hiệu ứng xấu trên đồng đội hoặc tốt trên đối thủ → Thanh tẩy; còn lại → Uy lực), đặt vào điểm bao được nhiều người nhất ở phe cần tác động, không trùng chỗ một cây cùng loại đang có.

### Chiêu 2 – Thánh ca (2 Orb, hồi 7 giây, giảm theo cấp chiêu)
- Mọi thánh giá trên sân **lập tức kích hoạt hiệu ứng 3 lần**.
- Thánh giá chưa tới cấp 3: **rút ngắn thời gian chờ lên cấp**. Đã cấp 3: **kéo dài thời gian còn lại**. **(Claude đề xuất)** 4 giây mỗi lần dùng.

### Chiêu 3 – Thần quang (4 Orb, hồi 20 giây)
- Một thánh giá thần quang khổng lồ **rơi giữa sân**, tác dụng **toàn sân**, tồn tại 10 giây.
- Mỗi giây đánh **Holy Smite** vào toàn đội địch: kẻ trúng bị giảm sát thương gây ra, giảm phòng thủ và mất hiệu ứng tốt.
- Đồng đội được tăng % tấn công và % phòng thủ trong 10 giây.
- Cứ **5 đợt đánh thì nổ một lần** lên toàn đội địch, đồng thời **xoá mọi hiệu ứng xấu trên đồng đội**. Trong 10 giây nổ 2 lần.
- Không tính vào giới hạn 4 thánh giá của chiêu 1.

## 5. Thiên phú
- **Thiên phú 1 – Đức tin lan toả (người dùng chốt):** mỗi thánh giá đang có trên sân tăng tấn công cho toàn đội. **(Claude đề xuất)** +4% mỗi cây, tối đa +16%.
- **Thiên phú 2 – Thánh lễ dâng hiến (người dùng chốt):**
  - Mỗi lần một thánh giá của chiêu 1 bị huỷ (bị thay hoặc hết giờ), Caelum hồi 1 Orb.
  - **Hồi sinh:** khi Caelum gục, cậu ấy bay lên; các thánh giá còn trên sân bay về phía cậu ấy và hồi sinh cậu ấy. Máu hồi lại tính theo **số thánh giá đang có**. **(Claude đề xuất)** mỗi cây 20% máu tối đa (tối đa 80%); các thánh giá dùng để hồi sinh thì tan. Không còn thánh giá nào thì không hồi sinh.
  - Hồi sinh có **thời gian hồi 30 giây** (người dùng chốt).

## 6. Mục tiêu / không làm / điều phải tránh
- **Mục tiêu:** chơi được trọn vẹn (mua, lên cấp, thiên phú, AUTO, PvP), có bài kiểm tra, có hình S / SS / SSS và icon; kéo thả chạy được bằng chuột và cảm ứng.
- **Không làm lúc này:** cốt truyện riêng, skin Giấy cho Caelum.
- **Phải tránh:** vòng vùng che trận; khoá chết đối thủ bằng choáng liên tục; đặt thánh giá ra ngoài sân hoặc ngoài tầm; trận PvP không kết thúc vì hồi sinh liên tục.

## 7. Cách làm đã cân nhắc
1. **Thánh giá là vật thể trên sân do máy chủ quản lý (chọn):** giống quân cờ của Leon và vòng kiếm trận của YunYou (vật tồn tại độc lập, có nhịp riêng). Dùng lại được cách viết và bài kiểm tra kiểu cũ.
2. Thánh giá là "người" trong đội (như quân cờ của Leon): dễ dùng lại phần đánh nhau, nhưng làm rối số thành viên, hồi sinh, thanh máu; mà thánh giá lại không bị đánh.
3. Chỉ là hiệu ứng tạm trên người chơi: không thể hiện được "vùng trên sân".

## 8. Việc để người làm tự quyết (ghi trong báo cáo)
- Số máu / tấn công / phòng thủ gốc, sát thương sấm sét, Holy Smite và vụ nổ, độ mạnh từng cấp của 4 loại thánh giá: cân bằng bằng giả lập.
- Giá mua trong cửa hàng.

## 9. Tranh và hiệu ứng cần làm
- Bộ tấm động tác SSS (đứng lơ lửng, đánh thường, di chuyển, trúng đòn / choáng, chiêu 1 đặt thánh giá, chiêu 2 cầu nguyện, chiêu 3 gọi thần quang, gục / bay lên được hồi sinh, thắng).
- 4 thánh giá nhỏ khác màu theo loại + thánh giá thần quang khổng lồ (tranh vẽ).
- Hiệu ứng: vòng vùng khi kéo (rõ) và khi đã cắm (nhẹ), tia sét, hồi máu, khiên, Holy Smite, vụ nổ thần quang, hồi sinh (pixelfx khi được, tranh vẽ khi cần).
- 6 icon + 4 icon nhỏ cho nút chọn loại thánh giá.
