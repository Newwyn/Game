# 📜 PROJECT PLAN: Pet Battle Online (2.5D RPG)
*Cập nhật trạng thái: 20/04/2026*

## 🎬 Tóm tắt Dự án
Xây dựng một Engine chiến đấu RPG 2.5D lấy cảm hứng từ **King's Raid**, tập trung vào sự kết hợp giữa hoạt ảnh Sprite 2D chất lượng cao và môi trường 3D.

---

## ✅ Giai đoạn 1 & 2: Core Engine & Sprite Animation (Hoàn thành)

### 🎨 Hệ thống Visual & Animation
- **Animated Sprites**: Nhân vật Assassin đã được tích hợp đầy đủ bộ hoạt ảnh (Idle, Run, Attack, Cast, Skill VFX).
- **Shader Chroma Key**: Shader chuyên dụng để xóa nền Magenta và xử lý **Hit-Flash** (nháy trắng khi trúng đòn).
- **Pixel-Perfect Scaling**: Cơ chế ổn định UV (0.001 inset) giúp loại bỏ hiện tượng vỡ hình và "chia đôi người" khi zoom.
- **Pivot Offset System**: Giải quyết lỗi AI vẽ không đều bằng cách tinh chỉnh tọa độ X/Y theo từng Row hoạt ảnh.

### ⚔️ Cơ chế Chiến đấu "Logic-First"
- **7-Layer Damage Pipeline**: `Base -> Crit -> Block -> Penetration -> Defense Mitigation -> Buffs -> Final DMG`.
- **Hit-Frame Sync**: Đồng bộ hóa sát thương theo từng Frame cụ thể. Sát thương chỉ xẩy ra khi nhân vật thực sự "chém trúng" (Frame 3/4).
- **Combat Feel**: Tích hợp Camera Shake (Rung màn hình) và Hit-Flash mang lại cảm giác lực đánh mạnh mẽ.

### ⚡ Kỹ năng Assassin (Prototype)
- **Skill 1 (Phi Tiêu)**: Gây Ấn Chiếu (Seal) + Ném đôi khi Tàng Hình.
- **Skill 2 (Đột Kích)**: Chain Dash (Lướt chuỗi) qua tất cả kẻ địch dính Ấn.
- **Skill 3 (Tàng Hình)**: Trở nên không thể bị chọn làm mục tiêu + Buff mạnh sát thương.

---

## 🚀 Giai đoạn 3: Trang bị & Thám hiểm (Sắp thực hiện)

### 1. Hệ thống Trang bị (Equipment System)
- Xây dựng 4 slot trang bị: **Vũ khí, Giáp, Trang sức, Orb**.
- Các trang bị sẽ cộng trực tiếp vào Stat Engine (Chi tiết 1000 điểm).

### 2. Chế độ Thám hiểm (Explore Mode)
- Xây dựng Map 2.5D di chuyển tự do (Làng, Rừng, Hầm ngục).
- Cơ chế chuyển cảnh mượt mà giữa Explore Mode và Battle Mode.

### 3. Chuẩn hóa Quái vật (Monster Refactor)
- Chuyển đổi các quái vật (Tanker, Archer, Supporter) sang dạng Animated Sprites giống Assassin.

---

## 🛠 Fix Log (Nhật ký sửa lỗi)
- **Fix**: Lỗi `socket.id` null gây kẹt màn hình Loading.
- **Fix**: Lỗi nhân vật bị trượt tọa độ khi chuyển từ hoạt ảnh Run sang Attack.
- **Fix**: Lỗi quái vật vẫn đánh người tàng hình (CanBeTargeted Fix).

---
**Trạng thái hệ thống**: 🟢 Normal (Đã đồng bộ GitHub).
**Tiếp theo**: Phát triển Module Trang bị hoặc Explore Map.
