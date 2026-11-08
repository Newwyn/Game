# Bản 1 (tộc Người) — Lộ trình chia phần

Spec: `BAN_THIET_KE_GAME.md` + `CHUONG_1_TOC_NGUOI.md`. Bản 1 gồm nhiều hệ thống độc lập → mỗi phần một kế hoạch riêng, mỗi phần xong là **chơi thử được**.

| Phần | Nội dung | Phụ thuộc | Kế hoạch |
|---|---|---|---|
| **P1** | Nền chiến dịch: ví tiền (Vàng / Kim Cương / Đá Cường Hoá), thể lực, dữ liệu 20 ải + nhánh chương 1, luật mở khoá 3 độ khó, thưởng, sở hữu anh hùng (Lyra ở ải 12), sửa Rok = tộc Người, màn chọn ải + màn kết quả | — | `2026-11-06-ban1-p1-chien-dich.md` |
| P2 | Trang bị: sinh đồ (ô, cấp, độ hiếm, dòng phụ), cộng chỉ số, mặc / tháo, 3 bộ tộc Người, phân giải, tinh luyện, cường hoá, túi đồ + lò rèn | P1 | ✅ `2026-11-06-ban1-p2-trang-bi.md` |
| P3 | Bản đồ thế giới **3D thu nhỏ** (mặc định) + bản 2D **kiểu Pokémon**, sổ nhiệm vụ + tự đi tới mục tiêu;  (nhìn từ trên, đi theo ô, nhảy, NPC đi lại), nhân vật chính Nam / Nữ, 5 bản đồ, rương, mỏ đá, câu đố, sự kiện mở ải (Jessica ải 2, Seraphine ải 3) | P1 | ✅ `game/world.js` · `src/ui/world.js` · `src/world/maps.js` (sinh bởi `tools/build_maps.py`) |
| P4 | Cốt truyện: hệ thống hội thoại, cảnh ngắn, trận mở màn với thần, hướng dẫn mở dần tính năng | P1, P3 | ✅ `game/story.js` · `src/ui/story.js` |
| P5 | Nội dung chương 1: kẻ địch mới (Goblin, sói, lính, mật thám, chiến binh lửa), 5 trùm, phong cảnh, NPC — tranh + chỉ số + kỹ năng | P1 (thay tạm), P3 | ✅ `server.js` (c1_*, b_*) · `game/chapter1.js` · `src/characters/sprite/enemySprites.js` — trùm có giai đoạn 2 + 2 chiêu riêng (`BOSS_SKILLS`, `src/vfx/bossFx.js`) |
| P6 | Hầm ngục đồ bộ + hầm ngục nhẫn / dây chuyền (lượt / ngày), quán ăn (thân mật), cửa hàng anh hùng | P1, P2 | ✅ `game/dungeon.js` · `game/tavern.js` · `game/shop.js` · `src/ui/extras.js` |

| C2 | **Chương 2 — vùng Elf**: 20 ải + 4 nhánh, 4 trùm, Nerissa / Sylva / Elarion gia nhập, bản đồ Sylvaren + Lunaria, việc / câu đố mở nhánh | P1–P6 | ✅ `game/chapter2.js` · `game/story2.js` · `game/world.js` |
| UI | Giao diện bản đồ: bản đồ nhỏ, Nhân vật (chỉ số / kỹ năng / trang bị / trang phục), Túi đồ 4 phần, Cửa hàng, Cài đặt · cỏ cao gặp quái · vào nhà | — | ✅ `src/ui/heroPanel.js` · `game/wild.js` |

**Việc tiếp theo gợi ý** (xem `TIEP_TUC.md`): nhạc nền · chương 3 (tộc Rồng) · đi thử tay nhà + vùng Elf.
