# 🎮 DỰ ÁN: 2.5D RPG (Tên mã: Pet Battle Online)

## 🎯 Mục tiêu dự án
Phát triển một tựa game nhập vai 2.5D trực tuyến với định hướng nghệ thuật và gameplay kết hợp giữa ba tượng đài:
1.  **Đồ họa & Môi trường**: Phong cách 2.5D (nhân vật 2D trên nền 3D/Isometric).
2.  **Gameplay Chiến đấu**: Hành động thời gian thực (Real-time) giống **King's Raid**, người chơi điều khiển đội hình 4 nhân vật với hệ thống sử dụng kỹ năng (Skill) Chủ động (Active) và Bị động (Passive), có xếp hàng (Skill Queue) và Auto Mode.
3.  **Khám phá & Bản đồ**: Cơ chế thám hiểm thế giới kiểu bán mở (Semi-Openworld).

## 🛠 Thư viện / Công nghệ sử dụng
*   **Máy chủ (Backend):** Node.js + Socket.io.
*   **Đồ họa (Frontend):** Three.js (Lưới không gian 3D, UI nổi 2D).
*   **Quản lý mã nguồn:** Git & GitHub (Remote: `https://github.com/Newwyn/Game`).

---

## 🚀 Tiến độ hiện tại

### ✅ Giai đoạn 1: Server & Render Cơ bản (Hoàn thành)
*   Khởi tạo Server WebSocket đồng bộ nhiều người chơi.
*   Hệ thống Render nhân vật dạng Capsule với Texture tùy chỉnh theo Class.
*   Camera Isometric 45 độ, hỗ trợ zoom proximity (tự động zoom khi 2 đội áp sát).

### ✅ Giai đoạn 2: Hệ thống Combat & Kỹ năng (Hoàn thành)
*   Cơ chế chiến đấu không gian 2.5D (X, Z plane) với tính toán va chạm vật lý.
*   Hệ thống 4 Class cơ bản: Tank, Warrior, Archer, Healer (đang sử dụng mẫu Assassin làm Prototype).
*   **AI Quái vật (NPC)**: Quái có thể tự tìm mục tiêu, né tránh nhân vật tàng hình và áp sát khi là cận chiến.

### ✅ Giai đoạn 2.5: King's Raid Stat Engine & Skill Synergy (🔥 MỚI NHẤT)

#### 1. Hệ thống Stat Engine 1000 điểm
*   **Chỉ số Granular**: Chuyển đổi toàn bộ chỉ số sang thang đo 1000 (Ví dụ: 350 Crit = 35% tỷ lệ).
*   **Damage Flow Logic (4 Lớp)**:
    1.  **Né tránh (Dodge)**: Nếu mục tiêu né thành công -> Hiện `MISS`, không mất máu.
    2.  **Bạo kích (Crit)**: Kiểm tra tỷ lệ bạo kích để nhân sát thương theo `Crit DMG`.
    3.  **Chặn đứng (Block)**: Nếu chặn được -> Giảm một phần sát thương nhận vào.
    4.  **Phòng thủ (DEF)**: Tính toán giảm trừ cuối cùng dựa trên Giáp và Xuyên thấu (Penetration).

#### 2. Chi tiết kỹ năng Sát Thủ (Assassin Prototype)
*   **Skill 1 (Phi Tiêu)**: Sát thương tầm xa + Gắn **"Ấn" (Seal)** lên mục tiêu trong 7s.
    *   *Hiệu ứng Tàng Hình*: Nếu đang trong trạng thái Skill 3, sẽ ném 2 phi tiêu vào 2 mục tiêu ít máu nhất. Nếu chỉ còn 1 mục tiêu, ném bồi 2 phát vào cùng 1 kẻ địch.
*   **Skill 2 (Đột Kích)**: Dịch chuyển áp sát lưng địch.
    *   *Chain Dash*: Nếu có mục tiêu dính "Ấn", Assassin sẽ lướt chuỗi qua tất cả các mục tiêu đó trước khi dừng lại sau lưng kẻ yếu nhất.
*   **Skill 3 (Tàng Hình)**: Biến mất trong 5 giây.
    *   Khi tàng hình: Kẻ địch (Tanker) không thể chọn làm mục tiêu, cường hóa Skill 1 thành ném đôi.

#### 3. UX/UI & Cân bằng
*   **Dual Stat Panels**: Hiển thị bảng thông số (HP, ATK, DEF, Crit...) của tất cả nhân vật 2 bên trái/phải liên tục.
*   **Mana & Cooldown**: Cooldown 7s (Skill 1-2) và 10s (Skill 3). Mana khởi điểm = 0, tích lũy qua đánh tay.
*   **Combat Feedback**: Hiển thị nhãn `CRIT`, `BLOCK`, `MISS` nổi bật.

#### 4. Nhật ký sửa lỗi (Technical Bug Log)
*   **Lỗi: Kẹt màn hình Loading**: Lỗi `ReferenceError` do truy cập `socket.id` quá sớm (Race Condition). Giải quyết bằng cách dùng `socket.id` trực tiếp từ thư viện và thêm cơ chế null-check cho `cid`.
*   **Lỗi: Tàng hình vẫn bị đánh**: Cập nhật logic `canBeTargeted` để NPC bỏ qua mục tiêu tàng hình và chuyển hướng sang đồng đội khác.

---

## 📋 Nhiệm vụ tiếp theo (Giai đoạn 3)
*   [ ] **Trang bị**: Hệ thống Item (Vũ khí, Giáp, Trang sức) cộng chỉ số Stat Engine.
*   [ ] **Explore Mode**: Map thế giới mở với NPC giao nhiệm vụ.
*   [ ] **Animation Spine 2D**: Thay thế các khối Capsule bằng Artwork thật.

---

## 💡 Hướng dẫn cho người dùng mới (Khi máy không có Git)
Nếu máy bạn báo lỗi "Git not recognized", bạn cần cài đặt **Git for Windows** tại [git-scm.com](https://git-scm.com/). Sau khi cài đặt, hãy khởi động lại ứng dụng và yêu cầu AI thực hiện lệnh Push.

*Cập nhật lần cuối: 19/04/2026 bởi Antigravity AI.*
