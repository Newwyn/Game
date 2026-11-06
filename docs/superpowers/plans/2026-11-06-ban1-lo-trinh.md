# Bản 1 (tộc Người) — Lộ trình chia phần

Spec: `BAN_THIET_KE_GAME.md` + `CHUONG_1_TOC_NGUOI.md`. Bản 1 gồm nhiều hệ thống độc lập → mỗi phần một kế hoạch riêng, mỗi phần xong là **chơi thử được**.

| Phần | Nội dung | Phụ thuộc | Kế hoạch |
|---|---|---|---|
| **P1** | Nền chiến dịch: ví tiền (Vàng / Kim Cương / Đá Cường Hoá), thể lực, dữ liệu 20 ải + nhánh chương 1, luật mở khoá 3 độ khó, thưởng, sở hữu anh hùng (Lyra ở ải 12), sửa Rok = tộc Người, màn chọn ải + màn kết quả | — | `2026-11-06-ban1-p1-chien-dich.md` |
| P2 | Trang bị: sinh đồ (ô, cấp, độ hiếm, dòng phụ), cộng chỉ số, mặc / tháo, 3 bộ tộc Người, phân giải, tinh luyện, cường hoá, túi đồ + lò rèn | P1 | ✅ `2026-11-06-ban1-p2-trang-bi.md` |
| P3 | Bản đồ thế giới màn ngang: đi lại, chuyển màn, NPC, rương, mỏ đá, câu đố, cổng vào ải / nhánh (đặt cờ mở nhánh) | P1 | ✅ `game/world.js` · `src/ui/world.js` |
| P4 | Cốt truyện: hệ thống hội thoại, cảnh ngắn, trận mở màn với thần, hướng dẫn mở dần tính năng | P1, P3 | ✅ `game/story.js` · `src/ui/story.js` |
| P5 | Nội dung chương 1: kẻ địch mới (Goblin, sói, lính, mật thám, chiến binh lửa), 5 trùm, phong cảnh, NPC — tranh + chỉ số + kỹ năng | P1 (thay tạm), P3 | ✅ `server.js` (c1_*, b_*) · `game/chapter1.js` · `src/characters/sprite/enemySprites.js` — trùm có giai đoạn 2, chưa có kỹ năng riêng |
| P6 | Hầm ngục đồ bộ + hầm ngục nhẫn / dây chuyền (lượt / ngày), quán ăn (thân mật), cửa hàng anh hùng | P1, P2 | ✅ `game/dungeon.js` · `game/tavern.js` · `game/shop.js` · `src/ui/extras.js` |
