# Nhật ký Dự án: Hệ thống Chiến đấu Pet Battle Online (Cập nhật 19/04/2026)

Hôm nay chúng ta đã tập trung vào việc chuyển đổi toàn bộ nhân vật Assassin từ dạng 3D thô sơ sang nhân vật 2D Animated hoàn chỉnh với các hiệu ứng kỹ năng đặc kịch.

## ✅ Các hạng mục đã hoàn thành (Cập nhật 19/04 - Big Refactor)

### 1. Kiến trúc Combat "Logic-First" (Giai đoạn 1 & 2)
- **Tách rời Logic và Visual**: Sát thương được tính toán trên Server và gửi về Client. Client sẽ **Buffer (đệm)** các sự kiện này và chỉ kích hoạt con số sát thương + thanh máu tụt khi Animation đạt đến đúng **Hit-Frame**.
- **Hệ thống Hit-Frame Sync**: Đồng bộ hóa chính xác thời điểm gây sát thương với từng khung hình cụ thể của Assassin (Ví dụ: Frame 4 của đòn đánh thường).
- **Damage Pipeline Chuyên nghiệp**: Tách biệt logic tính toán sát thương trên Server thành 7 bước: `Base -> Crit -> Block -> Penetration -> Mitigation -> Final`. Giúp việc cân bằng game cực kỳ dễ dàng.

### 2. Hệ thống Animator Thế hệ mới
- **Pivot Offset System**: Cơ chế cho phép "Nhích" tọa độ nhân vật theo từng Row hoạt ảnh. Giải quyết triệt để lỗi AI vẽ khung hình không đều (Ví dụ: bộ chạy bị lùi về sau, bộ đánh bị nhô lên trước).
- **UV Stability Fix (Bản vá cuối cùng)**:
    *   **Vô hiệu hóa Mipmaps**: Loại bỏ hiện tượng mờ và dính viền khi nhìn xa.
    *   **0.001 UV Inset**: Thêm vùng đệm an toàn trong Shader để khóa nhân vật trong đúng khung hình, xóa bỏ hoàn toàn lỗi "người bị chia đôi".
    *   **Strict Indexing**: Chốt cứng logic đếm frame theo Cột/Hàng (Idle=4, Run=6, Attack=5), không còn hiện tượng teleport do tràn chỉ số UV.

### 3. Cảm giác Chiến đấu (Combat Feel)
- **Hit-Flash**: Hiệu ứng nháy trắng khi nhân vật trúng đòn.
- **Camera Shake**: Rung màn hình khi Assassin thực hiện đòn chí mạng hoặc Backstab.

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
