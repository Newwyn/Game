# Nhật ký Dự án: Hệ thống Chiến đấu Pet Battle Online (Cập nhật 19/04/2026)

Hôm nay chúng ta đã tập trung vào việc chuyển đổi toàn bộ nhân vật Assassin từ dạng 3D thô sơ sang nhân vật 2D Animated hoàn chỉnh với các hiệu ứng kỹ năng đặc kịch.

## ✅ Các hạng mục đã hoàn thành

### 1. Hệ thống Hoạt ảnh 2D (Sprite Animation)
- **SpriteAnimator Engine**: Xây dựng bộ điều khiển hoạt ảnh (logic frame-by-frame) cực kỳ linh hoạt, hỗ trợ chuyển đổi giữa nhiều Sprite Sheet (Main và Extra).
- **Chroma-Key Rendering**: Triển khai Shader xử lý màu Magenta (#FF00FF) để tẩy nền trong suốt thời gian thực, khắc phục lỗi hình nền ô vuông (checkerboard).
- **Safe-Crop UV Mapping**: Cập nhật logic lấy 90% phần lõi của mỗi khung hình để loại bỏ triệt để hiện tượng dính viền hoặc bị chia đôi nhân vật do sai lệch pixel.
- **Billboarding**: Đảm bảo nhân vật luôn hướng về phía Camera trong không gian 2.5D.

### 2. Kỹ năng Assassin (Visual Effects)
- **Tấn công thường**: Hiệu ứng vung kiếm theo hướng mặt nhân vật.
- **Skill 1 (Phi Tiêu)**: Animation Ném (Throw) kết hợp phóng vật thể.
- **Skill 2 (Đột Kích - Shadow Blink)**: 
    - Hiệu ứng **Vanish** (Mờ dần).
    - Cơ chế **Teleport** tức thời.
    - Hiệu ứng **Appear** (Hiện hình) kết hợp bóng mờ (After-images).
- **Skill 3 (Tàng Hình)**: Hoạt ảnh Niệm chú (Cast) sau đó mờ dần về độ trong suốt 30% (mắt thường phe mình vẫn thấy mờ, phe địch sẽ thấy mất hút).

### 3. Công cụ Test & Giao diện
- **Bảng Công cụ Phe Địch**: Bổ sung bảng điều khiển kéo thả riêng cho phe địch.
- **Cọc Gỗ (Training Dummy)**: Tạo thực thể bất tử để test sát thương, tự động hiển thị bảng chỉ số chi tiết của Dummy.
- **Stat Table**: Cập nhật hiển thị màu xanh (Buff) và màu đỏ (Debuff) trực quan cho các chỉ số nhân vật.
- **No Cooldown Mode**: Tắt thời gian hồi chiêu để test skill liên tục.

## ⚠️ Các vấn đề cần xử lý tiếp (Tồn đọng)
- **Căn chỉnh Frame**: Một vài tư thế vẫn bị nhảy hoặc lệch nhẹ (do ảnh AI tạo ra không đều 100%). Sẽ thực hiện tinh chỉnh lại tọa độ chuẩn trong buổi tới.
- **Skill Execution**: Tối ưu lại thời gian trễ giữa Animation và thời điểm gây sát thương để cảm giác chiến đấu "đã" hơn.

## ⚔️ Chi tiết Chỉ số & Kỹ năng Assassin (As) - Thông số kỹ thuật

Nhân vật Assassin (As) là "cỗ máy sát thương" với các chỉ số cơ bản cực cao về bạo kích và tốc độ.

### 📊 Chỉ số cơ bản (Base Stats)
- **HP**: 1200 | **P.Atk**: 250 (Sát thương vật lý cao nhất nhóm prototype).
- **Tỷ lệ Chí mạng**: 35% (Gấp 2-3 lần các class khác).
- **Sát thương Chí mạng**: +50% (Mặc định gây 200% damage khi bạo kích).
- **Né tránh**: 20% | **Xuyên giáp**: 15%.
- **Tốc độ đánh**: 0.8 giây/đòn (Rất nhanh).

### ⚡ Hệ thống Kỹ năng Chi tiết

#### 1. Skill 1: Lưỡi Dao Tử Thần (Death Dagger)
- **Mana**: 1 Orb (1000 MP) | **Hồi chiêu**: 7 giây.
- **Sát thương**: 150% P.Atk.
- **Cơ chế Ẩn (Seal)**: Đánh dấu **Ấn Chiếu (Seal)** lên mục tiêu trong **7 giây**. Mục tiêu bị dính Ấn sẽ chịu thêm sát thương từ kỹ năng số 2.
- **Buff Tàng Hình**: Nếu đang trong trạng thái Tàng Hình, Assassin sẽ ném **2 phi tiêu** cùng lúc vào **2 kẻ địch có HP thấp nhất**.

#### 2. Skill 2: Đột Kích (Shadow Blink)
- **Mana**: 2 Orbs (2000 MP) | **Hồi chiêu**: 7 giây.
- **Sát thương Gốc**: 250% P.Atk.
- **Cơ chế Chuỗi (Chain Dash)**:
    - Nếu trên sân có kẻ địch bị dính **Ấn Chiếu (Seal)**, Assassin sẽ **dịch chuyển và chém tất cả** các mục tiêu đó trong một chuỗi combo liên hoàn.
    - Sát thương lên các mục tiêu bị dính Ấn tăng vọt lên **450% P.Atk** (Multiplier 2.5 x 1.8).
    - Sau khi kết thúc chuỗi, Assassin sẽ xuất hiện sau lưng kẻ địch yếu máu nhất.
- **Nội tại kèm theo**: Luôn kích hoạt **Backstab** (+50% Crit DMG) vì dịch chuyển ra sau lưng.

#### 3. Skill 3: Tàng Hình (Stealth)
- **Mana**: 3 Orbs (3000 MP) | **Hồi chiêu**: 10 giây.
- **Thời gian**: 5 giây.
- **Cơ chế Ẩn (Untargetable)**:
    - Kẻ địch không thể chọn làm mục tiêu cho các kỹ năng đơn lẻ.
    - Giảm 70% khả năng bị AI nhắm tới.
- **Buff**: Tăng mạnh Né tránh và Bạo kích trong suốt 5 giây. Đòn đánh đầu tiên khi hiện hình sau tàng hình được cộng thêm sát thương đột biến.

#### 4. Nội tại: Đánh Lén (Backstab Passive)
- Tăng **50% Sát thương Chí mạng** mỗi khi Assassin đứng ở phía sau mục tiêu (Dựa trên tọa độ X).

---
**Trạng thái**: Tạm dừng (Chờ chỉnh sửa Asset hoàn thiện vào ngày mai).
