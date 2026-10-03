# 🎮 Legend of Capsules (2.5D Action RPG)

> Tựa game nhập vai hành động 2.5D thời gian thực đa nền tảng (Web-first) kết hợp phong cách thị giác Isometric độc đáo, chiều sâu chiến thuật đội hình và cơ chế thám hiểm thu thập sinh vật.

[![GitHub](https://img.shields.io/badge/GitHub-Newwyn%2FGame-blue?logo=github)](https://github.com/Newwyn/Game)

---

## ⚡ Khởi chạy nhanh (Quick Start)

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi động server
node server.js
```

Mở trình duyệt truy cập: **[http://localhost:3000](http://localhost:3000)**

---

## 🌟 Tính năng nổi bật ở phiên bản hiện tại (v2.0)
- **Engine chiến đấu thời gian thực (Real-time Combat Engine):** Quản lý năng lượng khối (Orb System), hàng đợi kỹ năng (Skill Queue), cơ chế tự động đánh (Auto-mode).
- **Quy trình tính sát thương 7 lớp (7-Layer Damage Pipeline):** Tính toán hoàn toàn tại Server (`Base -> Crit -> Block -> Penetration -> Armor Mitigation -> Status Effects -> Final Damage`).
- **Đồ họa Sprite 2.5D độc quyền:** Nhân vật **Sát Thủ (Assassin)** với đầy đủ Spritesheet cử động, xử lý bằng **Custom GLSL Chroma Key Shader** (xóa phông nền trên GPU) và **Hit-Flash** nháy sáng khi trúng đòn.
- **Cảm giác lực đòn đánh (Game Feel):** Rung chấn màn hình (Camera Shake), đồng bộ theo nhịp vung kiếm (Hit-Frame Sync), số nhảy sát thương nổi bật và âm thanh Web Audio phản hồi tức thì.
- **Nút Thử Lại Trận Đấu tiện lợi:** Tự động đếm ngược 3... 2... 1... CHIẾN! khi chơi lại mà không bị gián đoạn.

---

## 📚 Tài liệu Game Design Document (GDD) Toàn diện

Toàn bộ tài liệu thiết kế trò chơi chuyên nghiệp, bảng thông số 14 chỉ số chiến đấu, kiến trúc kỹ thuật Client-Server và lộ trình sản xuất được lưu trữ chi tiết tại:

👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**  
👉 **[Legend_of_Capsules_Game_Design_Document.docx](./Legend_of_Capsules_Game_Design_Document.docx)** *(File Word gửi đối tác & Đội ngũ phát triển)*
