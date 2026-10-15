# 🎮 Legend of Capsules

> Game nhập vai **chiến thuật tự đánh** theo đội hình, chạy trên trình duyệt. Nhân vật chibi **2D ghép mảnh** chiến đấu trong cảnh 3D nhìn ngang — người chơi chỉ ra lệnh kỹ năng hoặc bật AUTO.

[![GitHub](https://img.shields.io/badge/GitHub-Newwyn%2FGame-blue?logo=github)](https://github.com/Newwyn/Game)

---

## ⚡ Khởi chạy nhanh

Yêu cầu: **Node.js 18+**

```bash
npm install        # lần đầu, hoặc khi package.json thay đổi
npm run dev        # chế độ phát triển -> http://localhost:5173
npm start          # build rồi chạy thật -> http://localhost:3000
```

| Lệnh | Tác dụng |
| :--- | :--- |
| `npm run dev` | Server (cổng 3000, tự khởi động lại khi sửa `server.js`) + Vite (cổng 5173, hot reload) |
| `npm run build` | Đóng gói client vào `dist/` |
| `npm start` | Build rồi chạy server, phục vụ `dist/` ở cổng 3000 |
| `npm run serve` | Chỉ chạy server (dùng bản `dist/` đã build) |

---

## 🎮 Điều khiển

| Thao tác | Tác dụng |
| :--- | :--- |
| **Click thẻ kỹ năng** | Ra lệnh kỹ năng cho nhân vật (click lại để huỷ) |
| **AUTO MODE** | AI tự chọn kỹ năng theo tình huống (combo, cứu đồng đội, để dành Orb) |
| **⏩ / T** | Tốc độ trận x1.0 / x1.5 / x2.0 |
| **Lăn chuột** | Zoom camera |
| **V** | Đổi góc camera ngang ↔ chéo |
| **I** | Ẩn / hiện bảng chỉ số |
| **P / Esc** | Tạm dừng |

---

## ⚔️ Nhân vật hiện có

| Nhân vật | Class · Tộc | Kỹ năng |
| :--- | :--- | :--- |
| 🥷 **Jessica (Lôi Ám)** | Sát Thủ · Human | Phóng Bùa (lộn ngược + gắn Ấn) · Đột Kích (lướt chém chuỗi) · Tàng Hình (hào quang sấm tím) |
| 🛡️ **Rok (Thiết Hộ)** | Chiến Binh · Dragon | Sư Tử Gầm (sát thương diện rộng, khiêu khích, −10% thủ) · Đẩy Khiên (sát thương đơn, hất văng + choáng) · Dựng Khiên (Thần Hộ Vệ, 600 máu khiên nổ lan, cả đội +20% thủ) |
| 🏹 **Lyra (Phong Tiễn)** | Cung Thủ · Elf | Tiễn Gió Chớp (chắc chí mạng, hạ gục hồi chiêu) · Thần Phong Giáng Thế (Vệ Thần Gió bắn phụ, bay) · Thần Tiễn Phá Thiên (gồng 2s, sát thương cực lớn) |
| ✨ **Seraphine (Thánh Quang)** | Tu Sĩ · Human | Thánh Quang Trị Liệu (hồi máu + giải choáng) · Khiên Ánh Sáng · Thánh Niệm (bay lên niệm 10s, buff cả đội, hồi máu / khiên cả đội) |

Chi tiết chỉ số, công thức sát thương, quy trình làm nhân vật: **[DOCUMENTATION.md](./DOCUMENTATION.md)** · bản Word: **[Legend_of_Capsules_Game_Design_Document.docx](./Legend_of_Capsules_Game_Design_Document.docx)**

---

## 🧪 Chế độ đánh thử

- **🛠️ Tool Phe Mình:** đầy mana, skill miễn phí, bất tử · mốc nhanh cả đội · từng nhân vật: ON/OFF ra trận, level 1–60, bậc Thường / S / SS / SSS (áp ngay), thiên phú, nút Đột phá (luồng thật).
- **👹 Tool Phe Quái:** triệu hồi quái / cọc gỗ, thêm bớt cọc, **quái bất tử**.
- Bảng kéo thả được, thu gọn được, phóng to / thu nhỏ bằng nút −/+.

---

## 🗂️ Cấu trúc thư mục

```
server.js        Server: chỉ số & kỹ năng (CLASS_DEFS), vòng lặp trận, sát thương
index.html       Khung HTML + HUD
src/             Client: core (cảnh, camera), characters (nhân vật 2D ghép mảnh),
                 combat (sự kiện -> động tác), vfx (hiệu ứng), ui (HUD, input)
art/             Tranh gốc từng nhân vật + atlas_spec.json
tools/           build_atlas.py (đóng gói tranh), trang xem thử động tác / cảnh / hiệu ứng
Claude outputs/  Ảnh & gif xem trước các phiên bản
```
