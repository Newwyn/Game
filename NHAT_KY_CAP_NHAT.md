# 📝 NHẬT KÝ CẬP NHẬT — Legend of Capsules

Mỗi lần sửa game, Claude ghi thêm 1 mục ở ĐẦU file này (mới nhất ở trên) để bạn nhớ đã thay đổi gì.
Mô tả cho lần đẩy GitHub kế tiếp nằm trong `mo_ta_cap_nhat.txt` — `cap_nhat_github.bat` tự đọc file đó, không cần gõ gì.

---

## 27/10/2026 — Nhân vật mới SYLVA (Lâm Linh) · class mới TRIỆU HỒI SƯ · hệ thống Triệu hồi · luật thua mới
- **Luật thắng / thua mới:** hết **tướng** là THUA, kể cả còn Golem / thú triệu hồi (trước đây còn Golem là chưa thua). Triệu hồi bên thua biến mất. Luật Sinh Tử cũng chỉ đếm tướng.
- **Hệ thống Triệu hồi:** nhãn chung **"Triệu hồi"** (hiện trên đầu): Golem, Vạc của Grix, Hộ Vệ Thần Chết của Zerith (chỉ thêm nhãn), thú của Sylva. Mỗi triệu hồi có luật riêng: có bị đánh không, có nhận buff / debuff không. **Golem** không nhận buff / debuff nào trừ Ấn Tử, nhưng **nhận hiệu ứng của Sylva**.
- **Sylva (Lâm Linh)** — tiên nữ rừng, tộc Elf, class **Triệu Hồi Sư**, sát thương phép, đánh xa:
  - **KN1 Gọi Sói & Đại Bàng** (1 Orb): gọi cả 2 con, mỗi con 18s. Sói: ra sân tru (địch −15% thủ 10s), cứ 4 đòn ngẫu nhiên Cắn (hồi máu) / Vồ (nhảy vào hàng sau). Đại Bàng: cứ 4 đòn niệm 1s → Cầu Gió (đẩy lùi) / Bão Lông Vũ (5 đợt, −10% tốc đánh); Ưng Nhãn (ra sân + mỗi 15s): 5s +30% tốc đánh, bắn cả bản đồ, mục tiêu ngẫu nhiên.
  - **KN2 Gấu Hộ Vệ** (2 Orb): ủi xuyên qua mọi địch rồi ủi về (hất tung → choáng 0,5s), rồi đánh 20s. Địch đứng sát Sylva quá 3s → gấu ủi đẩy + khiêu khích 5s.
  - **KN3 Thần Hươu** (3 Orb): hươu ánh sáng không bị đánh, 10s, mỗi giây hồi 3% máu tướng / 8% máu triệu hồi (cả Golem); triệu hồi +25% sát thương, +30% thủ.
  - **Thiên phú 1:** mỗi triệu hồi ra sân → cả đội +4% tấn công (triệu hồi +8%), tối đa 5 tầng. **Thiên phú 2:** mỗi 10s khiên lá 25% máu cho 1 triệu hồi, có khiên +20% sát thương, +25% tốc đánh.
  - Thú **không theo chỉ số Sylva**, có chỉ số riêng tăng theo cấp.
- **Bảng chọn tướng** 11 nhân vật: 2 hàng 6 + 5, vẫn vừa màn hình 1280×720.
- **Sửa sau khi bạn thử (27/10 chiều):** Gấu ủi trước đây không hiện (lệnh ủi tới trước khi hình Gấu kịp xuất hiện) → giờ chờ hình Gấu rồi chạy, bù phần trễ; Sói tru / Ưng Nhãn cũng vậy. Gấu ủi có thêm **0,6s phanh + quay đầu** (tranh mới) giữa lượt đi và lượt về. **Đại Bàng thành con riêng**: ra sân phía trước, lệch hàng, tầm đánh 7, bay nhanh hơn (không còn đi dính theo Sylva); bắn **lông vũ vàng** riêng (không bắn lá như Sylva); đạn đối thủ nhắm đúng chỗ nó bay.
- **ĐANG LÀM DỞ — hiệu ứng vẽ tay của Sylva** (9 tấm nền đen, `art/sylva/fx2/`): đã có 4 tấm (lông vũ, cột lá triệu hồi, bụi đá + cú húc của Gấu, khiên lá + dấu buff), còn 5 tấm chờ vẽ (Antigravity + Codex hết lượt). Trong lúc chờ, hiệu ứng vẫn là bản vẽ bằng code.
- **Hình vẽ tay:** tạo hình 5 nhân vật (bạn đã duyệt) + **25 tấm động tác** (200 khung): Sylva 9 tấm, Sói 5, Đại Bàng 5 (bay lơ lửng), Gấu 5, Thần Hươu 1 (đứng thở + ngẩng sừng ban phước mỗi lần hồi máu). Codex vẽ 20 tấm; Codex hết lượt nên **Antigravity vẽ 5 tấm** (Đại Bàng niệm gió + 4 tấm Gấu). Ảnh chọn đội mới cho Sylva. Hiệu ứng (lá, sóng tru, lông vũ, khiên lá…) vẫn vẽ bằng code.
- Đội làm: Claude (toàn bộ phần server vì Codex hết lượt dùng; sửa AI chọn chiêu; sửa 1 lỗi của Antigravity làm màn hình đứng hình số hồi chiêu); Antigravity (hiệu ứng, nhãn Triệu hồi, biểu tượng trạng thái, bảng chọn tướng).
- Đã thử: trận tự động có Sylva (quái bất tử, 60s): đủ 3 kỹ năng, 2 thiên phú, mọi chiêu của Sói / Đại Bàng / Gấu đều ra, không lỗi; 2 đấu 2 thua khi còn Đại Bàng sống → xử thua đúng luật; 1 đấu 1 với 10 tướng: Sylva **thắng 4** (Rok, Seraphine, Nerissa, Elarion), thua 6. Trận thật trên trình duyệt (Sylva + Elarion đấu Rok + Brakk, AUTO): thắng, hiệu ứng + nhãn "Triệu hồi" hiện, không lỗi.
## 27/10/2026 — Elarion: Bóng Nguyên Tố + mưa sống động + Thiên Thạch lăn chậm · bảng chọn tướng vừa màn hình · Sinh Tử chỉ trong Đấu
- **Sinh Tử chỉ áp dụng trong ĐẤU** (chế độ Test không có).
- **Bảng chọn tướng** (nhất là Đấu với tướng 2 đội): vừa màn hình 1280×720 / 1366×768 / 1920×1080, không cần thu nhỏ trình duyệt. Tiêu đề + nút "Vào đấu" / "Chọn chế độ" luôn hiện, thẻ tướng tự co theo màn hình, quá chật thì cuộn bên trong.
- **Thiên Thạch lăn chậm:** 15 ô trong 5 giây (trước 3 giây).
- **Bóng Nguyên Tố** (khi đang bật Bão Nguyên Tố): dùng **Hơi Nước Bỏng** (mưa) hoặc **Băng Hoại Hỏa Thiên** (tia) → Elarion để lại **một cái bóng** (bản sao tím mờ của chính Elarion) ở chỗ đang đứng rồi **lùi về sau 4 ô**; bóng tự niệm và thi triển phép từ chỗ của nó. Bóng không bị đánh, không bị ngắt; Elarion tự do đánh, nhặt ngọc, dùng phép khác. **Mỗi lúc chỉ 1 bóng**: bóng đang bận thì phép niệm kia Elarion tự niệm như bình thường. Elarion gục thì bóng tan.
- **Phép mưa hết cứng đơ:** đám mây giông 3D cuồn cuộn có sét bên trong, cột mưa rơi từ mây + nước bắn dưới đất, sương hồi máu quanh đồng đội; Elarion / bóng có nhịp thở, đung đưa, luân phiên 2 tư thế giơ tay.
- Đội làm: Codex (server bóng — còn bắt được 1 lỗi Claude gây ra: chú thích chèn giữa dòng Thiên Thạch làm hỏng server); Antigravity (hình bóng, lùi dư ảnh, mưa mới, bảng chọn tướng — lần đầu bị chặn đọc file, giao lại); Claude (giao kèo, việc nhỏ, sửa 5 lỗi chạy thật trong code hiệu ứng: hàm không tồn tại / chưa nạp, tạo bóng sai cách, thanh máu trên bóng, dư ảnh sai cách gọi; trang thử `fx-elarion.html?s=shadow` / `s=shadowbeam`).
- Đã thử: trận tự động 75s (quái bất tử): bóng hiện 5 lần, tan 5 lần, không lần nào 2 bóng, bóng và Elarion cùng thi triển 2 phép khác nhau được; trang thử: bóng làm mưa / bóng chưởng tia / Elarion tự mưa chạy hết không lỗi; bảng chọn tướng Đấu với tướng vừa khung 1280×720 và 1366×620, bấm chọn + Vào đấu chạy; Sinh Tử: Đấu bắt đầu giây 15, Test không có. Build không lỗi.

## 27/10/2026 — Luật Sinh Tử (1 đấu 1 quá 15s) + Độc rút máu mỗi 0,5s
- **Luật Sinh Tử:** trên sân chỉ còn 1 quân ta và 1 địch (Golem triệu hồi cũng tính là 1) mà sau **15 giây** chưa ai thắng → **cả hai mất 5% máu tối đa mỗi 0,5 giây** (trừ thẳng vào máu, khiên không đỡ) cho tới khi 1 bên gục; cùng gục = hoà. Có người hồi sinh / triệu hồi thêm → đếm lại từ đầu. Màn hình hiện chữ **⚔️ SINH TỬ!** + số máu mất màu cam.
- **Độc của Grix:** rút máu **mỗi 0,5 giây** (trước 1 giây), mỗi lần vẫn ×0,12 / tầng → sát thương Độc mỗi giây **gấp đôi** (bạn muốn thử xem có bá quá không).
- Đã thử: 5 trận 1 đấu 1 (Rok – Brakk, Grix – Brakk, Seraphine – Nerissa, Grix – Seraphine, Grix – Lyra): Sinh Tử bắt đầu đúng giây 15 ở 3 trận kéo dài, trừ máu đều tới khi 1 bên gục, không lỗi; 2 trận còn lại xong trước 15s. Grix giờ **thắng Brakk 1 đấu 1** (trước thua đậm), thắng Seraphine (13,9s), thua Lyra (6,3s). Build không lỗi.
- Chưa xem tận mắt chữ "SINH TỬ!" trên màn hình (cần dựng 1 đấu 1 kéo dài quá 15s trong trận thật).

## 27/10/2026 — Luật mới: có địch trong TẦM ĐÁNH mới dùng được kỹ năng (mọi nhân vật) + Grix tác dụng khắp bản đồ
- **Luật chung cho MỌI nhân vật:** kỹ năng chỉ dùng được khi có kẻ địch trong **tầm đánh của chính nhân vật đó** (cận chiến 2,4–2,8 · Seraphine 9 · Lyra 11 · Grix 12 · Elarion 14 · Ignar 15). Bấm sớm thì lệnh chờ, nhân vật vẫn tiến lên đánh; địch vào tầm là dùng ngay. AUTO cũng theo luật này.
  - Trước đây chỉ điệu múa (Nerissa) và Tàng Hình (Jessica) có luật "gặp địch" (đo theo tầm Lyra), các chiêu khác dùng lúc nào cũng được.
- **Bỏ nhãn đỏ "chưa gặp địch"** trên nút kỹ năng — nút chỉ mờ đi như lúc thiếu Orb.
- **Grix tác dụng khắp bản đồ:** có địch trong tầm đánh (12) là Grix dùng tại chỗ; bình độc (KN1) và phát bắn của vạc (KN2) rơi vào kẻ địch ngẫu nhiên **ở bất kỳ đâu trên bản đồ**. Đại Bộc Phá vốn đã nổ trên mọi kẻ địch; giờ dùng theo luật chung (trước: chỉ cần có địch trúng độc). AI Grix: vạc trước, rồi bình (không cần tìm cụm địch nữa).
- Đã thử: 2 trận 4 đấu 4 cấp 60 với đủ 10 nhân vật — ai cũng dùng đủ kỹ năng, không ai bị kẹt, không lỗi. Trận thật trên trình duyệt: nút mờ khi quái còn xa, sáng khi quái vào tầm, không còn nhãn, không lỗi. Build không lỗi.
- Lưu ý cân bằng: nhân vật cận chiến giờ phải áp sát mới dùng được cả chiêu tự buff (VD Rok Dựng Khiên, Brakk Khổng Lồ, Jessica Phóng Bùa từ xa); Seraphine phải có địch trong tầm 9 mới hồi máu.

## 27/10/2026 — Grix: nhắm ngẫu nhiên + hiệu ứng VẼ TAY theo khung (như cả đội)
- **Nhắm ngẫu nhiên:** mỗi bình của Bình Độc Văng (2 bình + 50% bình thứ 3) và mỗi phát bắn của vạc rơi vào **1 kẻ địch ngẫu nhiên** trong tầm (đủ địch thì mỗi phát 1 người khác nhau). Hết địch thì vạc không bắn.
- **Hiệu ứng vẽ tay:** bỏ hiệu ứng vẽ bằng code, thay bằng **8 tấm tranh nền đen do Codex vẽ** (64 khung, như Ignar / Zerith): lọ độc xoay, bình độc đầu lâu, bình vàng hồi máu, bình vỡ 8 khung, vòng ấn giả kim, vũng axit, đầm lầy sủi bọt 4 khung, vạc đồng hiện ra + sôi, cục bùn đầu lâu, khói độc, nổ độc lớn có đầu lâu trong khói, lốc xoáy độc khi bay, loé búng tay, đầu lâu Mục Rữa, vòm Giáp Độc tổ ong, hồn độc lây. Prompt: `art/grix/fx2/PROMPTS_FX.md`.
- **Đóng gói:** `tools/fx_grid_pack.py art/grix/fx2/fx2_spec.json` → `grix_fx2.webp` (1,9 MB). Vạc đồng sẫm bị thủng khi tách nền đen → hạ ngưỡng giữ đặc, vạc liền lại.
- Đội làm: Codex vẽ 8 tấm; Antigravity chuyển hiệu ứng sang chạy khung tranh; Claude đổi cách nhắm (server), viết prompt, đóng gói, kiểm tra, chỉnh đầu lâu Mục Rữa to + cao hơn thanh máu.
- Đã thử: trận tự động (2–4 bình mỗi lần ném vào địch ngẫu nhiên, vạc 3 đợt 6 phát) không lỗi; trang xem thử `tools/fx-grix.html`: mọi hiệu ứng tranh hiện đúng, không lỗi; build không lỗi.

## 27/10/2026 — Grix bản 2: 3 bình độc, vạc đầm lầy, bay lên búng tay, Mục Rữa, Giáp Độc + hiệu ứng mới
- **Bình Độc Văng:** ném **2 bình** (1 bình gần, 1 bình xa hơn để phủ cả hàng sau), **50% ném thêm bình thứ 3** (mọi cấp). Mỗi bình ×1.0 (trước 1 bình ×1.3) + 2 tầng Độc.
- **Đầm Lầy Thối Rữa:** Grix giơ gậy gọi **2 vạc**; vạc bắn **3 đợt**, mỗi đợt gồng 2s rồi bắn bùn ra thành đầm lầy (5s, hiệu ứng như cũ) → tối đa 6 đầm. Hồi chiêu giữ 13s.
- **Đại Bộc Phá Độc:** Grix **bay lên niệm**, **búng tay** là nổ (số liệu giữ nguyên).
- **Thiên phú 1:** địch đủ **7 tầng** → **Mục Rữa** thêm −40% hồi máu 5s (cộng dồn với đầm lầy, tối đa −90%), mỗi địch 10s/lần. Bình độc **hồi máu đồng minh** 60 / 80 / 100% M.ATK, **50% ném thêm 1 bình** về đồng minh ít máu nhất.
- **Thiên phú 2 → Giáp Độc** (thay bom khói): máu dưới 50% → khiên = 100% máu đã mất (8s); ai đánh Grix dính Độc; Độc hồi máu cho Grix **30 / 40%**; giáp nổ: +2 tầng Độc + choáng 1s quanh mình. Hồi 20s.
- **Hiệu ứng mới toàn bộ** (Antigravity làm, mình chỉnh: vạc to hơn, đầu lâu Mục Rữa to hơn, vòm Giáp Độc trong hơn để thấy Grix).
- **Trang xem thử mới** `tools/fx-grix.html` (giống fx-ignar) + trận đánh thử tự động báo thêm số bình / máu hồi.
- Đội làm: Codex (server), Antigravity (hiệu ứng — lần 1 không sửa được file nào do bị chặn chạy lệnh, giao lại lần 2 thì xong), Claude (thiết kế giao kèo, công cụ thử, kiểm tra, chỉnh hiệu ứng, tài liệu).
- Mình tự chọn (bạn chưa nói rõ): bình "ngắn / dài" = khoảng ném; 2 vạc; Mục Rữa CỘNG dồn; hồi máu bình 60–100% M.ATK; Giáp Độc 8s, hút 30/40%.
- Đã thử: 4 trận tự động (2–4 bình mỗi lần ném, bình đồng minh hồi 5.212 máu, vạc 3 đợt 6 phát, Mục Rữa, Giáp Độc bật / phản độc / hút 1.534 máu / nổ choáng, bay lên, kích nổ) — không lỗi. Trang xem thử: mọi hiệu ứng hiện đúng, không lỗi. Build không lỗi.
- Lưu ý cân bằng: Grix 1 đấu 1 với Brakk vẫn thua đậm (Brakk còn 96% máu).

## 27/10/2026 — Grix có tranh thật (Codex vẽ)
- **Codex vẽ tranh:** bạn nhắc "Codex vẽ được" — đúng (công cụ vẽ ảnh của Codex), hôm trước mình nói nhầm là cả đội không vẽ được.
  - Tạo hình `art/grix/01-character-v3.png` (nền trong suốt) + 9 tấm động tác nền xanh (72 khung): đứng, ném lọ, chạy, trúng đòn / choáng, gục / thắng, gồng / rơi vào trận, Bình Độc Văng, Đầm Lầy, Đại Bộc Phá. Prompt: `art/grix/sprite/PROMPTS_SPRITE.md`.
  - Mình duyệt từng tấm: đúng nhân vật ở mọi khung, đúng thứ tự khung ra đòn. Lệch nhỏ: khung 5 tấm Đại Bộc Phá kính lại nằm trên trán (khung khác sụp xuống mắt).
- **Vào game:** Grix hết là con nhộng — chạy bằng tranh thật, ảnh màn chọn đội cũng là tranh mới. Tách nền kiểu "jade" để giữ màu xanh độc (kiểu thường biến xanh thành vàng).
- **Cài thêm:** thư viện xử lý ảnh cho Python (bạn đồng ý) — cài vào môi trường riêng `.team/pyenv` vì Python của máy bị khoá.
- Đã thử: đóng gói 72 khung (soi từng khung: tách rời, căn chân đúng), build không lỗi, trận thật + trang xem cảnh: Grix hiện đúng, ném lọ / giơ gậy / đứng thủ thế đổi khung đúng. Còn 1 cảnh báo hình 3D (toạ độ NaN) hiện đúng 1 lần ở trận đầu lúc đổi cỡ khung trình duyệt liên tục — thử lại 3 lần (cả đổi cỡ) không gặp lại, game không bị ảnh hưởng.

## 26/10/2026 — Nhân vật mới Grix (Lục Độc) — Goblin độc dược + trận đánh thử tự động
- **Grix (Lục Độc) 🧪** — Phù Thủy tộc **Goblin** (nhân vật Goblin đầu tiên), đánh xa tầm 12, sát thương phép. Bạn chọn hướng "Goblin Độc Dược". Làm theo đội AI: Codex làm phần server, Antigravity làm phần hiển thị, Claude thiết kế + ghép + kiểm tra.
  - **Độc:** đánh thường / kỹ năng gắn tầng Độc (tối đa 5, thiên phú 1: 7), mỗi giây trừ máu theo số tầng. Grix gục thì Độc vẫn chạy hết giờ. Thánh Quang Trị Liệu giải được.
  - **Bình Độc Văng** (1 Orb): ném vào chỗ địch đông nhất, +2 tầng Độc.
  - **Đầm Lầy Thối Rữa** (2 Orb): đầm độc 5s, mỗi giây trừ máu + 1 tầng Độc + **−40% hồi máu** — khắc chế Seraphine / Nerissa.
  - **Đại Bộc Phá Độc** (3 Orb): kích nổ toàn bộ Độc trên mọi địch (×0,5 mỗi tầng), địch chết vì nổ thì lây độc sang người bên cạnh, Grix +20% M.ATK 6s. Chỉ dùng được khi có địch đang trúng Độc.
  - Thiên phú: **Độc Tố Ngấm Sâu** (Độc mạnh thêm 15–35%, 7 tầng) · **Mẹo Vặt Goblin** (máu dưới 50% → bom khói choáng quanh mình 0,8s, +né 5s).
  - AUTO: tích độc → đủ độc thì kích nổ; biết **để dành 3 Orb** cho chiêu cuối.
  - Chi tiết số: `DOCUMENTATION.md` §4.10, bảng hiệu ứng §6.
- **Hình tạm:** chưa có tranh nên Grix là **con nhộng xanh vẽ bằng code**; hiệu ứng độc (lọ bay, bình vỡ, đầm lầy sủi bọt, nổ độc, lây độc, bom khói) cũng vẽ bằng code. Prompt vẽ tạo hình + 9 tấm sprite: `art/grix/sprite/PROMPTS_SPRITE.md` — vẽ xong tấm nào gửi tấm đó.
- **Công cụ mới `tools/sim_battle.js`:** trận đánh thử tự động không cần trình duyệt (bật AUTO x2, báo kỹ năng đã dùng, sát thương, hiệu ứng, lỗi NaN / máu âm). Cách dùng: DOCUMENTATION §8.2.
- **Lỗi đã bắt khi thử:** chiêu cuối của Grix ban đầu không bao giờ dùng được (điều kiện "gặp địch" tính theo tầm Lyra 11 trong khi Grix đứng xa 12) → đổi thành "có địch đang trúng Độc".
- Đã thử: 4 trận tự động (Grix Lv1 + Seraphine đánh quái · Lv60 SSS + Rok · Đấu với tướng có Grix ở CẢ 2 phe · Grix 1 đấu 1 với Rok): đủ 3 kỹ năng + 2 thiên phú, độc chồng đúng tối đa, không lỗi. Trận thật trên trình duyệt: hiệu ứng hiện đúng, không lỗi console. Build: không lỗi. Chưa xem tận mắt hiệu ứng bom khói và lây độc (server đã chạy đúng trong trận tự động).

## 24/10/2026 — Elarion thành nhân vật đặc biệt + Hỏa Lôi Cầu khổng lồ + Nerissa nhỏ lại + bảng chọn đội + prompt icon kỹ năng
- **Elarion ⭐ nhân vật đặc biệt** (bạn chọn: mạnh hơn rõ rệt, đủ 4 hướng):
  - **Trâu hơn:** máu ×1,3, thủ ×1,35–1,4, M.ATK ×1,15 ở MỌI level (Lv60 SSS: máu 8.249 → 10.724, M.ATK 1.433 → 1.648).
  - **Ra phép nhanh hơn:** ngọc rơi 2s/viên (trước 3s), Sách Nguyên Tố không tốn Orb.
  - **Phép mạnh hơn ~35%:** Thiên Thạch ×3,8 (lăn ×1,1), Băng Phong ×1,5, Lôi Xích ×2,0, Hỏa Lôi Cầu ×2,7 nổ rộng 4,5, Lốc Xoáy ×1,5, Giáp Băng Sét khiên 32%, Băng Hoại Hỏa Thiên băng ×0,4 / lửa ×0,57, Tốc Lôi +35% tốc đánh, Hơi Nước Bỏng hồi ×0,4 / sét ×0,95.
  - **Golem mạnh hơn:** ở lại 25s (trước 20s), máu 5× (trước 4,67×), ATK 1,4× (trước 1,1×), Nộ Lửa ×2,3, Bão Tuyết ×0,65 mỗi giây, Hào Quang Sét ×0,6.
  - Đo trận thử AUTO (Lv60 SSS, 1 mình đánh 3 quái Lv60, 240 giây): sát thương ~1,75× bản trước, ~1,25× trung bình 4 nhân vật đánh chính (Lyra, Zerith, Jessica, Ignar) — chưa kể khiên, khống chế, Orb tặng đội.
  - Cách sở hữu đặc biệt: ghi vào lộ trình, làm khi có hệ thống ngoài trận.
- **Hỏa Lôi Cầu khổng lồ:** quả cầu to dần từ cao 1,6 tới ~7,6 (trùm cả hàng địch), vùng nổ bán kính 3,5 → 4,5, nổ to tương ứng.
- **Nerissa nhỏ lại** (cao 2,9 → 2,65): tóc bồng tới gối + 2 dải lụa dài + đầu to làm cô trông to hơn mọi người dù cùng chiều cao.
- **Bảng chọn đội:**
  - Bỏ nút "Chọn 4 người đầu", thay bằng **✕ Bỏ chọn tất cả** (xoá hết lựa chọn, cả 2P khi Đấu với tướng; mờ đi khi chưa chọn ai).
  - Ảnh Jessica + Rok đổi sang tạo hình bản 3 (trước còn hình cũ).
- **Icon kỹ năng:** prompt 11 tấm (66 icon: kỹ năng, thiên phú, đánh thường, 10 phép Elarion, Golem) ở `art/icons/PROMPTS_ICONS.md`. Có tranh thì mình gắn lên nút kỹ năng trong trận, dùng chung cho các tính năng sau.
- Đã thử: trận AUTO (Elarion + Rok + Lyra + Nerissa), trang thử Hỏa Lôi Cầu, bảng chọn đội, build: không lỗi.

## 24/10/2026 — Elarion + Golem: 7 tấm hiệu ứng tranh vào game
- **Tranh của bạn đã ráp** (giữ nguyên, chỉ cắt + căn + chỉnh cỡ): 7 tấm hiệu ứng (56 khung, nền trong suốt thật) → 14 hiệu ứng chạy khung.
  - Vài khung AI vẽ lệch tâm (nổ trúng đòn, lốc xoáy trôi dần sang trái, vệt đấm / bão tuyết hàng dưới cao hơn hàng trên) → dời cả khung cho trùng tâm, không sửa hình.
  - Lửa sát đất của thiên thạch và băng vụn của khối băng vẽ chồng sang ô bên cạnh → cắt ở chỗ mỏng nhất, mờ dần mép cắt.
- **Elarion:**
  - Đánh thường: nổ đúng màu ngọc đang giữ (lửa / băng / sét), chí mạng to hơn.
  - Đọc Sách: ánh vàng + chữ cổ + 3 cầu nguyên tố bốc lên đúng giữa trang Sách lúc Sách mở.
  - Bão Nguyên Tố: lốc 3 nguyên tố xoáy quanh người, bùng lên đúng lúc dang tay — lốc ở sau lưng + ánh sáng mờ phía trước nên vẫn thấy rõ Elarion.
  - Thiên Thạch: nổ lớn 4 khung (loé → bùng → cột lửa khói → khói tàn). Hỏa Lôi Cầu: cầu lửa sét xoáy to dần rồi nổ.
  - Băng Phong: khối băng rơi chạm đất vỡ 4 khung, mảnh văng trúng ai thì nổ băng ở người đó.
  - Lốc Xoáy: phễu sét xoáy liên tục. Giáp Băng Sét: pha lê trồi lên thành vòm rồi giữ lặp sau lưng người được che.
  - Lôi Xích, sét Mưa Giông, phản đòn Giáp Băng Sét, tia lửa Băng Hoại Hỏa Thiên: dùng nổ sét / nổ lửa mới.
- **Golem:**
  - Triệu hồi: vòng 3 màu → 3 cột sáng → nổ đá đúng lúc Golem đứng dậy gầm → bụi lắng.
  - Nộ Lửa: lửa bùng quanh nắm đấm lúc gồng, vệt lửa trùm nắm đấm suốt đường lao.
  - Bão Tuyết: luồng bão tuyết phun ra từ miệng. Hào Quang Sét: sét trời giáng trúng ngọc ngực.
- Giữ hình lẻ bản 2 còn tốt: ngọc, vòng, tia đánh thường, Lôi Xích, thiên thạch rơi, tảng đá lăn, dải lửa, khối băng, ngục băng, mây giông, mưa hồi máu, vòng sét Tốc Lôi, chưởng đôi, xoáy hít khí, Golem tan rã.
- Đã thử: trang thử phép (mọi phép + Golem), trận AUTO (Elarion + Rok + Seraphine), build: không lỗi. Video duyệt: `elarion_v3_fx.mp4`.

## 24/10/2026 — Elarion hiền giả + Golem vào game (động tác sprite)
- **Tranh của bạn đã ráp** (giữ nguyên, chỉ cắt + căn chân + chỉnh cỡ): 9 tấm Elarion (72 khung) + 3 tấm Golem (24 khung) + ảnh màn chọn đội mới (hiền giả tung 3 nguyên tố).
  - 2 ảnh tạo hình có nền trong suốt thật — phần nền tối loang vàng chỉ là màu thừa bên dưới vùng trong suốt mà khung xem trước hiện ra, trong game không thấy.
  - AI vẽ mỗi tấm to nhỏ khác nhau → đo lại bằng khuôn mặt (Elarion) / ngọc ngực + chồng hình (Golem): tấm tung phép nhỏ hơn ~17%, tấm sét – triệu hồi của Golem nhỏ hơn ~12%... đều chỉnh về cùng cỡ.
  - 3 tấm có 2 khung vẽ chạm nhau (tay áo rộng, tóc dài, cuốn Sách) → thêm cách tách tự động theo ô lưới trong công cụ ráp.
- **Elarion:** đứng, thủ thế (Sách mở bên tay), đẩy chưởng (tia Hỏa / Băng / Lôi bay ra đúng lòng bàn tay), chạy (tóc dài + tay áo bay), đọc Sách, tung phép, gọi Bão Nguyên Tố, đứng thi triển Mưa Giông, Băng Hoại Hỏa Thiên (khum tay dồn lực → chưởng giữ tia, tia phát ra đúng giữa 2 bàn tay), niệm, rơi vào trận → quỳ đáp đất, trúng đòn, choáng, gục (Sách rơi xuống đất), thắng (giơ tay ban phước).
- **Golem:** đi nặng nề, đấm, Nộ Lửa (gồng → lấy đà → nắm đấm lửa duỗi thẳng suốt đường lao), Bão Tuyết (hít khí → há miệng phun, luồng bão ra đúng miệng), Hào Quang Sét (giơ 2 nắm đấm → nện xuống đúng lúc sét giáng), trồi lên lúc triệu hồi (cuộn tròn như tảng đá → đứng dậy gầm), trúng đòn, choáng, gục / tan thành đống đá.
- **Hiệu ứng phép vẫn là bản cũ** — chờ 7 tấm hiệu ứng mới (`art/elarion/fx2/PROMPTS_FX.md`).
- Đã thử: trang thử động tác Elarion + Golem, trang thử phép (đánh thường 3 hệ, đọc Sách, Băng Hoại Hỏa Thiên, Lôi Xích, Nộ Lửa, Bão Tuyết, Hào Quang Sét, triệu hồi), trận AUTO 4 người (Elarion + Rok + Seraphine + Lyra): không lỗi. Video duyệt: `elarion_v3_sprite.mp4`, `golem_v3_sprite.mp4`.
- Bản cũ vẫn xem được: `?elarion=cutout`, `?golem=cutout`.

## 24/10/2026 — Elarion bản 3: tạo hình hiền giả tóc bạch kim + prompt 9 tấm sprite, Golem 3 tấm, 7 tấm hiệu ứng
- **Tạo hình mới** (bạn chọn): **hiền giả tinh linh từ thời xưa**, sống cả nghìn năm nhưng dung mạo vẫn trẻ.
  - Tóc **bạch kim** thẳng dài chấm gối, đuôi buộc khoen vàng; tai nhọn đeo khuyên vàng hình lá.
  - **Vòng miện vàng cổ** ngang trán, giữa có ngọc giọt nước pha 3 màu cam · lam · tím; mắt tím nhạt hiền hoà.
  - **Áo bào xanh đêm** tay rất rộng, thêu cổ tự + chòm sao bằng chỉ vàng; áo trong trắng ngà cổ chéo.
  - Khăn choàng trắng ngà thêu ngọn lửa · bông tuyết · tia sét; đai vàng đeo ngọc bội có tua; giày vải mũi cong.
  - **Sách Nguyên Tố** tự lơ lửng: bìa đồng sẫm, huy hiệu tam giác vàng gắn 3 viên đá.
  - (Bản nháp đầu là học giả tóc đen áo xám — bạn thấy không đẹp, đã đổi sang hiền giả tóc bạch kim, áo bào xanh đêm + vàng cổ.)
- **Prompt sprite** `art/elarion/sprite/PROMPTS_SPRITE.md`: tạo hình (01-character-v3, chân dung 01b) + 9 tấm:
  - đứng / thủ thế, đẩy chưởng (khung 4), chạy, trúng đòn / choáng;
  - đọc Sách (khung 3) + gọi Bão Nguyên Tố (khung 7, dùng luôn khi đứng thi triển Mưa Giông);
  - tung phép (khung 5, dùng cho mọi phép);
  - Băng Hoại Hỏa Thiên: khum tay dồn lực → chưởng giữ tia;
  - niệm + rơi vào trận → đáp đất; gục / thắng.
  - Có **đoạn luật Sách** dán vào mọi tấm: Sách tự bay, cùng thiết kế mọi khung, chỉ mở khi được dặn, không vẽ phép.
- **Golem giữ tạo hình cũ**, thêm 3 tấm động tác riêng (bạn chọn): đi + đấm · Nộ Lửa (lùi gồng → lao đấm) + Bão Tuyết (hít → phun) · Hào Quang Sét + trúng đòn + choáng + trồi lên + tan rã.
- **Prompt hiệu ứng** `art/elarion/fx2/PROMPTS_FX.md` (7 tấm, chỉ vẽ lại phần chạy khung):
  - trúng Hỏa / Băng / Lôi, lốc 3 nguyên tố;
  - thiên thạch nổ, khối băng vỡ, cầu hỏa lôi, lốc xoáy;
  - Sách loé, Giáp Băng Sét;
  - vệt đấm lửa, luồng bão tuyết, sét giáng, triệu hồi Golem.
  - Hình lẻ bản 2 còn tốt (ngọc, tia đánh thường, thiên thạch rơi, khối băng, mây giông, ngục băng...) giữ nguyên, đỡ tốn lượt vẽ.
- Chưa đổi game (chờ tranh).

## 24/10/2026 — Khiên Seraphine không còn che người · Brakk Khổng Lồ dùng kỹ năng không cần niệm
- **Khiên Ánh Sáng (Seraphine) che người được che** — đúng như bạn thấy. Nguyên nhân: nhân vật được ngả nhẹ ra sau theo góc camera (đầu lùi ~0,75 đơn vị), còn bong bóng khiên đặt "sau lưng" lại dựng thẳng → nửa trên bong bóng chồi ra TRƯỚC đầu / vai, phủ một lớp sáng mờ lên người.
  - Sửa: cả bong bóng + đôi cánh nghiêng cùng góc với nhân vật → nằm sau lưng thật; tóc, mặt người bên trong rõ nét lại (khiên 1 người lẫn khiên cả đội có cánh lúc Thánh Niệm).
  - Cùng lỗi, sửa luôn: hào quang + cánh bóng tối của Zerith (lúc gồng / gọi Đêm Tử Thần / suốt 10s bay), nữ thần nước sau lưng Nerissa (Thủy Thần Vũ). Hình hiệu ứng giữ nguyên, chỉ không phủ lên người nữa.
- **Brakk lúc Khổng Lồ: mọi kỹ năng dùng ngay, không cần niệm** (cả Khổng Lồ do Độc Long). Thực tế là **Chấn Địa** (bình thường gồng 1s) — giờ đang Khổng Lồ thì bật lên dậm luôn; Bá Vương Quật vốn không niệm.
  - Đã thử trận thật (Brakk một mình, AUTO): ngoài Khổng Lồ Chấn Địa vẫn gồng 1s; trong Khổng Lồ dùng ngay.
  - Trang thử `fx-brakk.html?s=giant`: đoạn Chấn Địa lúc Khổng Lồ bỏ phần gồng.

## 24/10/2026 — Brakk bản 3 vào game: sprite + hiệu ứng tranh
- **Tranh của bạn đã ráp** (giữ nguyên, chỉ tách nền + căn chân + chỉnh cỡ): 10 tấm sprite (80 khung, có 2 tấm Khổng Lồ) + 6 tấm hiệu ứng + ảnh màn chọn đội (cắt từ tranh nhân vật mới).
  - Mỗi tấm AI vẽ to nhỏ khác nhau → đo lại bằng khuôn mặt + đai vô địch: hàng thủ thế, tấm Bá Vương Quật, 2 tấm Khổng Lồ đều chỉnh về cùng cỡ.
  - Tấm đấm Khổng Lồ: nắm đấm khung 3 chạm tóc khung 4 → thêm cách "vạch tách" trong công cụ ráp để tách đúng 8 khung.
  - Tấm máu rồng: chân cột máu hàng trên tràn xuống ô hồi máu → cắt bỏ phần tràn (không còn vệt cam lơ lửng trên hiệu ứng hồi máu).
- **Động tác:** đứng, thủ thế, đấm thẳng, chạy, trúng đòn, choáng, gục, thắng; Bá Vương Quật (vồ → nhấc qua đầu → nhảy vọt → quật đúng 0,85s); gồng + Chấn Địa (bật cao → dậm đúng 0,6s); gầm hoá Khổng Lồ; Tiếng Hét Bảo Hộ (đấm ngực → vẫy khiêu khích).
- **Thần Lực Khổng Lồ** dùng tranh khổng lồ riêng cho thủ thế, chạy, đấm, móc ngược; động tác khác (trúng đòn, túm quật, dậm) dùng tranh thường phóng to + ánh dung nham.
- **Hiệu ứng mới** (màu cam dung nham · đồng · đá): nổ đá ở đúng nắm đấm; quật đất + hố nứt + vòng chấn động; gai đá trồi hai bên lúc dậm; vòm khiên vảy rồng; rồng đất bốc lên lúc hoá khổng lồ + hào quang khổng lồ; đầu rồng đá gầm ra từ miệng lúc Tiếng Hét + dấu "!" trên đầu đối thủ; cột máu rồng + hồi máu.
- **Sửa lỗi hiệu ứng che người** (lúc thử thấy Brakk bị khối cam che kín):
  - Hố nứt / vòng chấn động / ấn rồng giờ **nằm phẳng trên đất**, tâm đúng chân (trước là tấm dựng đứng trước người).
  - Hiệu ứng **sau lưng** giờ nghiêng theo góc camera như nhân vật — trước đây phần trên của chúng chồi ra trước đầu (cột máu rồng, hào quang khổng lồ, vòm khiên). Thêm hàm dùng chung `camTilt()` để các nhân vật sau dùng.
  - Vòm khiên lúc bật lên + hồi máu: tranh đặt sau người, phía trước chỉ còn ánh sáng mờ. Đầu rồng của Tiếng Hét đặt trước mặt Brakk thay vì đè lên mặt.
- Đã thử: trang thử động tác, trang thử 7 nhóm kỹ năng, trận AUTO 4 người (Brakk + Rok + Seraphine + Lyra): không lỗi. Video duyệt: `brakk_v3_sprite.mp4`, `brakk_v3_fx.mp4`.
- Bản khung xương cũ vẫn xem được: `?brakk=cutout`. Atlas hiệu ứng cũ (`brakk_fx.png`, `brakkFx.json`) bỏ → `cap_nhat_github.bat` tự xoá trên máy.

## 24/10/2026 — Brakk bản 3: tạo hình mới rồng Đất – dung nham + prompt 10 tấm sprite + 6 tấm hiệu ứng
- **Tạo hình mới** (bạn chọn): đô vật trẻ **tộc Rồng Đất – dung nham**, nhà vô địch đấu trường dung nham.
  - Bờm nâu cát dựng ngược, ngọn cam dung nham; sừng rồng đá xám vân nứt cam; mắt hổ phách; răng nanh, sẹo trên má.
  - Cởi trần cơ bắp; vảy rồng nâu đồng như đá phiến trên vai, tay, lưng; đuôi rồng to có gai đá, chóp cam dung nham.
  - Đai vô địch đồng mặt đầu rồng đá ngậm ngọc hổ phách; quần đùi đen viền đồng; băng tay trắng; giày đấu vật nâu – đồng.
  - Phối màu nâu cát · đồng · đen than · xám đá · cam dung nham: **bỏ đỏ** để khỏi trùng Ignar và Zerith.
- **Dạng Khổng Lồ** vẽ riêng (bạn chọn 2 tấm): vạm vỡ hẳn, vảy đá nứt dung nham sáng rực, mắt trắng rực, bờm bốc như dung nham. Có ảnh tham chiếu riêng `01c-giant-v3.png` để 2 tấm khổng lồ giống nhau.
- **Prompt sprite** `art/brakk/sprite/PROMPTS_SPRITE.md`: tạo hình (01-character-v3, dạng khổng lồ 01c, chân dung 01b) + 10 tấm:
  - đứng / thủ thế, đấm thẳng (khung 4), chạy, trúng đòn / choáng;
  - **Bá Vương Quật**: vồ → nhấc qua đầu → nhảy vọt → quật (khung 7);
  - **gồng** + **Chấn Địa** bật cao dậm (khung 7);
  - **gầm hoá Khổng Lồ** + **Tiếng Hét Bảo Hộ** riêng (đấm ngực, vẫy tay khiêu khích);
  - gục (mặt đau) / thắng (khoe cơ);
  - **Khổng Lồ:** thủ thế + chạy · đấm + móc ngược.
  - Có **đoạn luật tay không** dán vào mọi tấm: không vẽ vũ khí, không vẽ quái bị túm (tay nắm vào khoảng trống, game tự vẽ quái).
- **Prompt hiệu ứng** `art/brakk/fx2/PROMPTS_FX.md` (6 tấm, màu cam dung nham · đồng · đá, không đỏ):
  - đấm trúng (mảnh đá + tia dung nham) + móc ngược;
  - quật đất nổ tung + gai đá trồi;
  - rồng đất bốc lên lúc hoá khổng lồ + hào quang khổng lồ lặp;
  - tiếng hét đầu rồng đá + khiên vảy rồng;
  - máu rồng bùng (Long Huyết) + hồi máu;
  - 8 hình nhỏ: hố nứt, vòng chấn động, ấn rồng, khiên, vương miện, dấu "!", Orb, bụi bật nhảy.
- Chưa đổi game (chờ tranh).

## 24/10/2026 — Zerith: lướt lần 2 miễn phí lúc Đêm Tử Thần chạy thật
- Trước đây tài liệu ghi có nhưng server chưa bao giờ bật (thiếu chỗ tạo trạng thái `reaper_echo`). Giờ:
  - Đang Đêm Tử Thần, lướt lần 1 → Lưỡi Hái Xuyên Hồn **hồi chiêu ngay** khi diễn xong cú lướt, trong **5 giây** được lướt lần 2 **miễn phí**.
  - Nút kỹ năng hiện **"MIỄN PHÍ"**, biểu tượng vòng lưỡi hái bật trên đầu Zerith. AUTO tự lướt luôn; chơi tay thì tự bấm.
  - Lướt lần 2 xong (hoặc hết 5 giây không lướt) → hồi chiêu bình thường 7 giây. Lướt lần 2 không tạo thêm lượt miễn phí.
- Đã thử trận thật (Zerith một mình, AUTO, quái bất tử): mỗi lần Đêm Tử Thần đều lướt 2 cú liền nhau.

## 21/10/2026 — Zerith bản 3 vào game: sprite + hiệu ứng tranh
- **Tranh của bạn đã ráp** (giữ nguyên, chỉ tách nền + căn chân + chỉnh cỡ): 9 tấm sprite (72 khung) + 6 tấm hiệu ứng + ảnh chân dung màn chọn đội.
- **Động tác:** đứng, thủ thế, bổ liềm, chạy, trúng đòn, choáng, lướt chém, chỉ tay gắn Ấn Tử, gồng, quét hất lên, bổ xuống, gọi Thần Chết, rơi vào trận, gục, thắng.
- **Bay lơ lửng suốt 10s Đêm Tử Thần:** dùng tấm bay riêng — bay chờ lặp, đánh thường thì chém khi bay.
- **Khớp mốc cũ:** bổ liềm 0,22s · quét hất 0,15s · bổ xuống 0,2s · gọi Thần Chết 0,2s · gắn Ấn Tử 0,15s (loé đúng **đầu ngón tay** trên tranh). Sát thương, thời gian, cơ chế không đổi.
- **Hiệu ứng mới** (đỏ thẫm · khói đen · trắng xương, bỏ hẳn tím):
  - Đánh thường: vệt chém lưỡi liềm đỏ thẫm; lúc Đêm Tử Thần chém lan.
  - Lưỡi Hái Xuyên Hồn: vệt khói đỏ dài + dư ảnh; mỗi con trúng bị **xé hồn** (linh hồn bay lên).
  - Lưỡi Hái Hất Hồn: vòng ấn tử thần quanh chân + **lưỡi hái khổng lồ** hiện dần sau lưng → quét hất lên; Đêm Tử Thần: bổ xuống + **nứt đất**.
  - Đêm Tử Thần: cánh bóng tối bung ra → hào quang cánh bóng tối quanh Zerith + **Hộ Vệ Thần Chết** (áo choàng đen, lưỡi hái trắng xương) bay sau lưng, giương liềm / chém ngang / chém bổ; chặn đòn chí tử: đồng hồ cát.
  - Phán Quyết Tử Thần: Ấn Tử đầu lâu bay lên đầu mọi đối thủ; Thần Chết hiện sau lưng mục tiêu, nhấc lên rồi chém phán quyết; có khiên thì khiên vỡ.
  - Linh Hồn Báo Thù: Thần Chết trong mờ, ánh hồng.
- **Giữ khói đen trong tranh:** 6 tấm hiệu ứng của bạn là PNG trong suốt thật (khói đen, áo choàng tối) → tool giữ nguyên độ trong suốt gốc. Cách cũ (đặt lên nền đen rồi tách đen) làm mất hết phần tối — Hộ Vệ Thần Chết gần như vô hình.
- **Màu đỏ thẫm khắp nơi:** dư ảnh, vòng chọn, biểu tượng trạng thái (Đêm Tử Thần, Lướt lần 2), màu thẻ nhân vật ở màn chọn đội.
- **Phát hiện (chưa sửa, chờ bạn quyết):** lướt lần 2 miễn phí lúc Đêm Tử Thần ghi trong tài liệu nhưng server chưa bao giờ bật (thiếu chỗ tạo trạng thái `reaper_echo`; AI, nút "MIỄN PHÍ", biểu tượng đều đã sẵn).
- Xem thử: `/tools/test-sprite.html?char=reaper&auto=1` · `/tools/fx-zerith.html?s=all&auto=1`. Bản khung xương cũ: thêm `?zerith=cutout`.
- 2 file hiệu ứng bản 2 không còn dùng (`zerith_fx.png`, `src/vfx/zerithFx.json`) được thêm vào danh sách dọn của `cap_nhat_github.bat`.

## 21/10/2026 — Zerith bản 3: tạo hình mới + prompt 9 tấm sprite + 6 tấm hiệu ứng
- **Tạo hình mới** (bạn chọn): thiếu niên **quỷ tộc dẫn hồn của U Minh giới** (chủ đề thần chết · linh hồn · đồng hồ cát).
  - Tóc trắng xương rối, đuôi tóc nhuộm đỏ thẫm, mắt đỏ thẫm đồng tử dọc; sừng đen vân nứt đỏ, tai nhọn, đuôi quỷ.
  - Áo khoác thần chết đen cổ dựng, vạt rách tua, lót đỏ thẫm; giáp vai đầu lâu; xích bạc; **đèn lồng hồn** + **đồng hồ cát** ở thắt lưng.
  - **Lưỡi hái** cán đen quấn xích, lưỡi trắng xương mép đỏ thẫm.
  - Phối màu đen · trắng xương · **đỏ thẫm** · bạc: bỏ tím để khỏi trùng tông với Jessica.
- **Prompt sprite** `art/zerith/sprite/PROMPTS_SPRITE.md`: prompt tạo hình (01-character-v3, ảnh chân dung 01b) + 9 tấm:
  - đứng / thủ thế, bổ liềm (khung 4), chạy, trúng đòn / choáng;
  - **lướt chém** (Lưỡi Hái Xuyên Hồn) + **chỉ tay gắn Ấn Tử**;
  - **quét hất lên** + **bổ xuống**;
  - **gồng** + **gọi Thần Chết** → bay lên;
  - **bay** suốt Đêm Tử Thần (bay chờ + chém khi bay);
  - gục (mặt đau) / thắng.
  - Có **đoạn luật lưỡi hái** dán vào mọi tấm; dặn AI vẽ cùng cỡ với `sprite-idle` (rút kinh nghiệm tấm đánh thường của Seraphine).
- **Prompt hiệu ứng** `art/zerith/fx2/PROMPTS_FX.md` (6 tấm):
  - vệt chém lưỡi hái + xé hồn;
  - quét hất lên + bổ xuống (nứt đất);
  - lưỡi hái khổng lồ (hiện ra + giữ);
  - **Hộ Vệ Thần Chết** (hiện ra + đứng / giương liềm / chém ngang / chém bổ) — dùng cả cho Phán Quyết và Linh Hồn Báo Thù;
  - nhát chém phán quyết + hào quang cánh bóng tối Đêm Tử Thần;
  - 8 hình nhỏ: Ấn Tử, vòng triệu hồi, vệt lướt, linh hồn bay, đồng hồ cát, khiên vỡ, lướt miễn phí, nứt đất.
- Chưa đổi game (chờ tranh).

## 21/10/2026 — Seraphine bản 3 vào game: sprite + hiệu ứng tranh
- **Tranh của bạn đã ráp** (giữ nguyên, chỉ bỏ quầng mờ + căn chân + chỉnh cỡ): 8 tấm sprite (64 khung) + 5 tấm hiệu ứng + ảnh chân dung màn chọn đội.
- **Động tác:** đứng, thủ thế, chĩa gậy phóng cầu sáng, chạy, trúng đòn, choáng, giơ gậy hồi máu, đẩy tay dựng khiên, giơ gậy vào Thánh Niệm, rơi vào trận, gục (mặt đau), thắng.
- **Niệm lơ lửng suốt 10s Thánh Niệm:** dùng tấm niệm riêng — chắp tay niệm, khi hồi máu / khiên thì đưa tay ra phép (cầu sáng / thiên thần bay ra từ bàn tay).
- **Khớp mốc cũ:** cầu sáng 0,22s (bay ra đúng **pha lê đầu gậy**) · hồi máu 0,3s · khiên 0,28s · vào niệm 0,45s. Hồi máu, khiên, thời gian, cơ chế không đổi.
- **Hiệu ứng mới:**
  - Đánh thường: cầu ánh sáng có vòng vàng xoay → nổ sáng + cánh hoa.
  - Hồi máu: **tia nắng rọi xuống** người được hồi + dấu cộng; đang bị choáng thì hiện xích vỡ.
  - Khiên: loé mặt trời + **bong bóng ánh sáng** quanh người được che (người bên trong vẫn nhìn rõ), mờ dần theo máu khiên; khiên lúc niệm mọc **đôi cánh**.
  - Thánh Niệm: loé mặt trời + vòng thánh bùng → **Hộ Vệ Thiên Sứ sáu cánh** chắp tay niệm sau lưng suốt 10s, vòng thánh quanh chân; cả đội hiện +sát thương (+thủ nếu có Ân Điển); mỗi giây hồi máu: dấu cộng nhỏ.
  - Đang niệm dùng hồi máu / khiên: **thiên thần nhỏ** bay tới từng người rồi trao ánh sáng.
  - Thiên Thần Hộ Mệnh: thiên thần bay tới xác → vòng hồi sinh + tia nắng lớn.
- **Xem:** `/tools/test-sprite.html?char=priest&auto=1` · `/tools/fx-seraphine.html?s=all&auto=1`. Video: `Claude outputs/seraphine_sprite_moi_dong_tac.mp4`, `Claude outputs/seraphine_hieu_ung_moi.mp4`. Bản cũ: `?seraphine=cutout`.
- Đã chơi thử trận AUTO (Seraphine + Rok + Jessica + Lyra) + build: không lỗi.
- **Cần xem lại (tranh, không bắt buộc):** tấm `sprite-attack` AI vẽ Seraphine **nhỏ hơn các tấm khác ~30%** — mình đã phóng to cho bằng, nhưng nét hơi mềm hơn khi chơi; muốn sắc hẳn thì tạo lại tấm đó (dặn AI vẽ cùng cỡ với `sprite-idle`).

## 21/10/2026 — Seraphine bản 3: tạo hình mới + prompt 8 tấm sprite + 5 tấm hiệu ứng
- **Tạo hình mới** (bạn chọn): nữ tu sĩ trẻ của **ánh mặt trời** (chủ đề mặt trời mọc, hợp Thánh Quang).
  - Tóc vàng mật ong rất dài, **vương miện tia nắng**, mắt hổ phách.
  - Váy tu sĩ trắng thêu mặt trời vàng, tay áo lót hồng phấn, **khăn choàng cầu nguyện hồng phấn** bay theo gió.
  - **Gậy trắng vàng đầu vòng mặt trời**, pha lê lơ lửng giữa vòng.
  - Phối màu trắng · vàng kim · hồng phấn: khác hẳn Rok (trắng xanh hoàng gia), Nerissa (trắng xanh ngọc), Lyra (xanh ngọc nâu).
- **Prompt sprite** `art/seraphine/sprite/PROMPTS_SPRITE.md`: prompt tạo hình (01-character-v3, ảnh chân dung 01b) + 8 tấm:
  - đứng / thủ thế, đánh thường (phóng cầu sáng khung 4), chạy, trúng đòn / choáng;
  - **hồi máu + khiên** chung 1 tấm;
  - **giơ gậy vào Thánh Niệm** + rơi vào trận;
  - **niệm lơ lửng** suốt 10s (chắp tay niệm + ra phép khi đang niệm);
  - gục / thắng (đã ghi rõ mặt đau, không cười — rút kinh nghiệm từ Lyra).
  - Có **đoạn luật gậy phép** dán vào mọi tấm (gậy luôn ở tay xa, cùng 1 cây, không vẽ phép).
- **Prompt hiệu ứng** `art/seraphine/fx2/PROMPTS_FX.md` (5 tấm):
  - cầu ánh sáng bay + nổ sáng;
  - tia nắng hồi máu + khiên ánh sáng (bong bóng);
  - **Hộ Vệ Thiên Sứ** sáu cánh, hào quang mặt trời (hiện ra + giữ lặp);
  - thiên thần nhỏ (bay + trao ánh sáng) cho hồi máu lúc niệm và hồi sinh;
  - 8 hình nhỏ: vòng thánh, vòng hồi sinh, đôi cánh khiên, +sát thương, +thủ, xích vỡ, dấu cộng hồi máu, loé mặt trời.
- Chưa đổi game (chờ tranh).

## 21/10/2026 — Lyra bản 3 vào game: sprite + hiệu ứng tranh
- **Tranh của bạn đã ráp** (giữ nguyên, chỉ tách nền + căn chân + chỉnh cỡ): 9 tấm sprite (72 khung) + 5 tấm hiệu ứng + ảnh chân dung màn chọn đội.
- **Động tác:** đứng, thủ thế (tên đặt sẵn trên dây), bắn cung, chạy, trúng đòn, choáng, Tiễn Gió Chớp nhảy lùi bắn trên không, giơ cung gọi gió, gồng + nhả Thần Tiễn, rơi vào trận, gục, thắng.
- **Bay suốt Thần Phong (8s):** dùng tấm bay riêng — lơ lửng nhấp nhô, bắn khi bay (trước đây là khung đứng nâng lên). Thanh máu bay lên theo, không đè lên đầu.
- **Khớp mốc cũ:** nhả tên 0,2s (mũi tên bay ra đúng **dây cung trên tranh**) · Tiễn Gió Chớp 0,42s · gọi gió 0,38s · nhả Thần Tiễn 0,16s. Sát thương, thời gian, cơ chế không đổi.
- **Tách nền kiểu mới cho đồ xanh lá:** kiểu cũ làm áo choàng / váy xanh ngọc của Lyra trong suốt một phần và bạc màu; kiểu mới (`jade`) chỉ bỏ nền xanh thuần, vải xanh giữ nguyên 100%.
- **Hiệu ứng mới:**
  - Đánh thường: mũi tên gió bay → trúng thì gió xoáy + lông vũ. Phong Tiễn: ngọn giáo gió quét ngang cả hàng quái.
  - Tiễn Gió Chớp: dấu ngắm khoá mục tiêu, gió bật dưới chân lúc nhảy / đáp, tên gió chớp → nổ gió đẩy lùi; hạ gục → biểu tượng hồi chiêu.
  - Thần Phong: **Vệ Thần Gió cánh chim ưng** hiện ra sau lưng (cao hơn Lyra), kéo cung bắn phụ mỗi khi Lyra bắn, cùng kéo căng khi gồng Thần Tiễn; vòng gió xoáy dưới chân; cả đội hiện mắt chim ưng (+chính xác).
  - Thần Tiễn Phá Thiên: gió xoáy hút vào lúc gồng → mũi tên ánh sáng thành hình sau lưng → phóng như tên lửa → mũi cuối nổ lớn (cột sáng + nổ gió).
- **Xem:** `/tools/test-sprite.html?char=archer&auto=1` · `/tools/fx-lyra.html?s=all&auto=1`. Video: `Claude outputs/lyra_sprite_moi_dong_tac.mp4`, `Claude outputs/lyra_hieu_ung_moi.mp4`. Bản cũ: `?lyra=cutout`.
- Đã chơi thử trận AUTO (Lyra + Rok + Jessica + Nerissa) + build: không lỗi.
- **Cần xem lại (tranh, không bắt buộc):** tấm `sprite-dead-victory` hàng trên (gục) khung 1–3 Lyra **nhắm mắt há miệng như đang cười** → lúc gục trông vui; muốn đẹp hẳn thì tạo lại hàng gục (mặt đau, nhăn).

## 21/10/2026 — Lyra bản 3: tạo hình mới + prompt 9 tấm sprite + 5 tấm hiệu ứng
- **Tạo hình mới** (bạn chọn): nữ xạ thủ **tiên tộc (Elf) của gió**, chủ đề **chim ưng** (hợp thiên phú Ưng Nhãn).
  - Tai nhọn, mắt lục bảo, **bím tóc nâu hạt dẻ dài** cài lông chim ưng trắng. Màu tóc này chưa ai trong đội có.
  - Áo choàng ngắn xanh ngọc viền lông vũ, áo trắng thêu xoáy gió vàng, 2 dải thắt lưng bạc hà bay theo gió.
  - **Cung trắng vàng hình đôi cánh chim ưng**, ngọc xanh ở tay cầm.
- **Prompt sprite** `art/lyra/sprite/PROMPTS_SPRITE.md`: prompt tạo hình (01-character-v3, ảnh chân dung 01b) + 9 tấm:
  - đứng / thủ thế, đánh thường (nhả tên khung 5), chạy, trúng đòn / choáng;
  - **Tiễn Gió Chớp** nhảy lùi bắn giữa không trung (khung 6);
  - **gọi gió** + rơi vào trận;
  - **gồng + nhả Thần Tiễn**;
  - **bay** suốt Thần Phong (bay chờ + bắn khi bay);
  - gục / thắng.
  - Có **đoạn luật cung tên** dán vào mọi tấm (cung ở tay xa, dây 1 sợi, khung nhả không vẽ mũi tên) vì AI hay vẽ sai dây cung.
- **Prompt hiệu ứng** `art/lyra/fx2/PROMPTS_FX.md` (5 tấm):
  - mũi tên gió bay + trúng;
  - tên gió chớp + nổ gió đẩy lùi;
  - **Vệ Thần Gió** cánh chim ưng (hiện ra, bay chờ, kéo cung);
  - mũi tên ánh sáng Thần Tiễn + nổ lớn;
  - 8 hình nhỏ: vòng gió dưới chân, gió bật, mũi gió xuyên, vệt gió, dấu ngắm, hồi chiêu, +chính xác, lông vũ bung.
- Chưa đổi game (chờ tranh).

## 21/10/2026 — Thêm `lay_ve_tu_github.bat` (kéo bản mới từ GitHub về máy)
- **File mới** `lay_ve_tu_github.bat`: bấm đúp → tải bản mới nhất trên GitHub về máy, liệt kê các lần cập nhật mới, rồi kéo về.
- **An toàn:** chỉ kéo về khi trên máy không sửa trùng file với bản mới; có trùng thì dừng lại và báo, **không ghi đè file nào**.
- **Cách dùng 2 file:** đầu ngày bấm `lay_ve_tu_github.bat` (nếu GitHub có bản mới hơn máy) · cuối ngày bấm `cap_nhat_github.bat` (đẩy lên). Kéo về trước, đẩy lên sau (chi tiết: `DOCUMENTATION.md` mục 8.3).
- Đã dùng lần đầu: máy kéo về bản "Nerissa bản 3 vào game + giảm lag" (3409bf8). Game không đổi.

## 20/10/2026 — Giảm lag / tụt FPS + dọn file cũ
- **Cảnh nền:** cây, đá, bụi gộp lại → từ ~660 xuống ~24 lần vẽ mỗi khung (nhìn y hệt).
- **Màn hình độ phân giải cao** (laptop chỉnh 150–200%): vẽ tối đa 1,5 điểm ảnh / điểm → bớt tới ~44% điểm ảnh phải tô.
- **Hết giật giữa trận:** shader không bị xoá rồi biên dịch lại mỗi lần hiệu ứng xuất hiện; atlas hiệu ứng tải lên GPU ngay lúc vào trận.
- **Hiệu ứng đông:** mặt phẳng trong suốt chỉ vẽ 1 lần (trước vẽ 2 lần + tính lại shader mỗi khung); khi trên sân quá nhiều tia lửa / đốm sáng thì hiệu ứng phụ tự giảm bớt; tối đa 36 số sát thương cùng lúc.
- Kết quả đo (4v4 tự đánh): số lần vẽ mỗi khung 666 → 230 (lúc đông 1.110 → 355), thời gian xử lý mỗi khung 19 → 7,5ms.
- **Dọn file không dùng:** Rok bản 1 (`rokRig.js`, `rokAtlas.json`, `rok_atlas.png`), trang thử cũ `tools/fx-lion.html`, `tools/fx-guardian.html` (đã thêm vào danh sách dọn của `cap_nhat_github.bat`).

## 20/10/2026 — Nerissa bản 3 vào game: sprite + hiệu ứng tranh
- **Tranh của bạn đã ráp** (giữ nguyên, chỉ tách nền + căn chân + chỉnh cỡ): 13 tấm sprite (104 khung) + 5 tấm hiệu ứng + ảnh chân dung màn chọn đội.
- **Động tác:** đứng, thủ thế, quất lụa, chạy, trúng đòn, choáng, xoay vào điệu, rơi vào trận, gục, thắng và **đủ 7 điệu múa** (Sóng Triều, Lưu Thủy, Thủy Thần, 1+2, 1+3, 2+3, cả 3). Dải lụa vẽ sẵn trong tranh nên bỏ dải lụa lò xo cũ.
- **Khớp mốc cũ:** quất lụa 0,24s (giọt nước bay ra đúng **đầu dải lụa**) · xoay vào điệu 0,3s · mỗi điệu múa lặp đúng nhịp cũ. Sát thương, thời gian, cơ chế không đổi.
- **Căn khung:** tua ngọc / dải lụa rủ sát đất nên căn theo **giữa váy** (hông đứng yên, chân không trượt khi múa). Khung **xoạc chân giữa không trung** (cả 3 điệu) và **nhảy mừng thắng** giữ đúng độ cao tranh vẽ.
- **Hiệu ứng mới:**
  - Đánh thường: giọt nước bay xoay → nước bắn tung.
  - Vào điệu: vòng sóng nước bung quanh người.
  - Sóng Triều: vòng thủy triều dưới chân suốt điệu + giọt MP bay lên đồng đội.
  - Lưu Thủy: vòng hoa sen dưới chân + mưa hồi máu (mây, giọt nước, cánh hoa) trên đồng đội được hồi.
  - Thủy Thần Vũ: Thủy Thần hiện ra sau lưng rồi giữ suốt 10s.
  - Hòa Âm: bong bóng giáp nước (1+2) · Orb bị xoáy nước hút (2+3) · cả 3 điệu: 4 nốt nhạc nước khác nhau, dấu −M.DEF / +ATK, xích nước vỡ khi giải khống chế · Orb tặng cả đội.
- **Ảnh màn chọn đội:** dùng chân dung mới (Nerissa xoay một chân).
- **Xem:** `/tools/test-sprite.html?char=dancer&auto=1` (thêm 7 điệu múa) · `/tools/fx-nerissa.html?s=d3`. Video: `Claude outputs/nerissa_sprite_moi_dong_tac.mp4`, `Claude outputs/nerissa_hieu_ung_moi.mp4`. Bản cũ: `?nerissa=cutout`.
- **Công cụ ráp:** `sprite_pack.py` thêm mốc căn `hip`, `footBand` / `footMin`, `ground`; `fx_grid_pack.py` thêm `rect` / `feather` (cắt hình vẽ tràn sang ô bên cạnh).
- Đã chơi thử trận AUTO (đấu với quái + đấu tướng, Nerissa cả 2 phe) + build: không lỗi.
- **Cần xem lại (tranh):** ô 1 tấm `fx-nerissa-icons` (vòng thủy triều) AI vẽ bị **cắt cụt ở mép trái** và chạm vòng hoa sen → mình làm mờ 2 mép cho đỡ lộ; muốn đẹp hẳn thì tạo lại ô đó (vòng nằm gọn trong ô). Tấm `sprite-dance12` khung 5 là quay lưng (đúng prompt).
- **Không còn dùng:** hiệu ứng bản 1 (`src/assets/sprites/nerissa_fx.png`, `src/vfx/nerissaFx.json`) — `cap_nhat_github.bat` tự xoá khi đẩy.

## 20/10/2026 — Nerissa bản 3: prompt vẽ lại chibi + 13 tấm sprite + 5 tấm hiệu ứng
- **Giữ tạo hình** (bạn chọn): elf tóc xanh biển dài gợn sóng, vỏ sò ngọc trai, đồ vũ công trắng xanh ngọc viền vàng, 2 dải lụa nước — chỉ **vẽ lại chibi** cho đồng bộ cả đội.
- **Prompt sprite** `art/nerissa/sprite/PROMPTS_SPRITE.md`: vẽ lại tạo hình + 13 tấm — đứng / thủ thế, quất lụa bắn giọt nước, chạy, trúng đòn / choáng, xoay vào điệu + rơi vào trận, **7 điệu múa mỗi điệu 1 tấm 8 khung** (Sóng Triều, Lưu Thủy, Thủy Thần, 1+2, 1+3, 2+3, cả 3), gục / thắng.
- **Prompt hiệu ứng** `art/nerissa/fx2/PROMPTS_FX.md` (5 tấm): giọt nước bay + nước bắn, vòng sóng vào điệu + mưa hồi máu, Thủy Thần hiện ra + giữ, bong bóng giáp nước + 4 nốt nhạc nước, 8 hình nhỏ (vòng thủy triều, vòng hoa sen, giọt MP, Orb tặng, −M.DEF, +ATK, Orb bị hút, xích vỡ).
- Chưa đổi game (chờ tranh).

## 20/10/2026 — Sửa giật / tụt FPS khi đánh nhau
- **Nguyên nhân:** mỗi khi một hiệu ứng tranh (lửa Ignar, Khiên Thần, sư tử, sấm Jessica...) hiện khung nào LẦN ĐẦU, game tải lại NGUYÊN tấm atlas hiệu ứng (4096×1024, ~16 MB) lên card đồ hoạ. Đo 30 giây trận đấu: 31 lần tải lại atlas lớn + 15 lần atlas Jessica → giật từng nhịp. Càng thêm nhân vật có hiệu ứng tranh càng lag.
- **Sửa:** mọi atlas hiệu ứng chỉ tải lên card đồ hoạ 1 lần (`src/vfx/texView.js`); áp dụng cho hiệu ứng của Ignar, Rok, Jessica, Elarion / Golem, Brakk, Nerissa, Zerith, Seraphine.
- **Kết quả đo lại (cùng trận thử 3 nhân vật):** thời gian vẽ mỗi khung lúc giao tranh giảm ~10–20 lần; không còn lần tải lại atlas nào ngoài lần đầu.
- Hình hiệu ứng không đổi (đã soi lại từng trang xem thử). Đã chơi thử AUTO + build: không lỗi.

## 20/10/2026 — Jessica bản 3 vào game: sprite + hiệu ứng tranh
- **Tranh của bạn đã ráp** (giữ nguyên, chỉ tách nền + căn chân + chỉnh cỡ): 9 tấm sprite (72 khung) + 4 tấm hiệu ứng.
- **Động tác:** đứng, thủ thế, chém dao, chạy, trúng đòn, choáng, Phóng Bùa lộn mèo (vòng lộn vẽ sẵn), phóng bùa đứng, thụp người biến mất, lướt chém, hiện ra chém, Tàng Hình kết ấn, rơi vào trận, gục, thắng.
- **Khớp mốc cũ:** chém 0,18s · quăng bùa 0,42s / 0,2s · hiện ra chém 0,18s · Tàng Hình 0,38s. Lá bùa bay ra đúng bàn tay ném.
- **Hiệu ứng mới:**
  - Phóng Bùa: lá bùa bay xoay → trúng loé, vỡ, hiện vòng Ấn; dấu Ấn trên đầu quái thành ấn sấm tím.
  - Đột Kích: khói sấm lúc biến mất, vệt lướt sấm, vệt chém sấm trên từng quái, hiện ra từ vòng bóng tối, chí mạng chém chữ X; chém chết hiện mũi tên vòng.
  - Tàng Hình: khói sấm bùng + hào quang sấm quanh người; đồng đội +né hiện cánh sét, tia sét nháy quanh người.
- **Sửa thêm:** nhân vật sprite giờ hiện được động tác choáng dù khung xương không có (Jessica).
- Đã chơi thử trận AUTO + build: không lỗi. Sát thương / thời gian không đổi.
- **Cần xem lại:** tấm đánh thường (`sprite-attack`) khung 3–5 dao luôn ở phía sau lưng, chưa thấy nhát chém về phía quái (xem mục báo cáo trong chat).

## 20/10/2026 — Jessica bản 3: tạo hình mới nữ ninja sấm tím (prompt)
- **Tạo hình mới** (bạn chọn để mình đề xuất): nữ ninja trẻ, tóc đen ánh tím buộc đuôi ngựa cao, mắt tím, đồ ninja đen phối tím viền vàng tia sét, khăn quàng tím 2 đuôi dài, xấp bùa giấy chữ tím, dao găm lưỡi tím cầm ngược.
- **Prompt sprite** `art/jessica/sprite/PROMPTS_SPRITE.md`: tạo hình + 9 tấm — đứng / thủ thế, chém dao, chạy, trúng đòn / choáng, Phóng Bùa (lộn mèo), phóng đứng + thụp người biến mất, lướt chém + hiện ra chém, Tàng Hình + rơi vào trận, gục / thắng. Khung chính khớp mốc ra đòn cũ.
- **Prompt hiệu ứng** `art/jessica/fx2/PROMPTS_FX.md`: lá bùa bay + trúng hiện Ấn, vệt chém sấm + chí mạng chữ X, khói sấm + hào quang tàng hình, 8 hình nhỏ (dấu Ấn, vòng bóng tối, vệt lướt, tia sét, buff né, hồi chiêu, tia lửa sấm, bóng mờ).
- Làm cùng đợt: 4 tấm hiệu ứng chung cả đội (`art/common/PROMPTS_FX_CHUNG.md`).
- Chưa đổi game (chờ tranh).

## 20/10/2026 — Khiên Thần (Dựng Khiên) to gấp 2,5
- Khiên Thần to gấp 2,5 (thử gấp 3 thấy hơi to, chỉnh nhỏ lại chút): thân khiên cao ~1,7 lần Rok, mũi khiên chạm đất, đứng giữa Rok và quái.
- Khiên lùi ra sau theo chiều sâu nên Rok và quái vẫn hiện rõ phía trước; vòng thánh dưới chân to theo.
- Hiện ra / giữ / nổ sóng / vỡ tan giữ nguyên nhịp; thời gian, sát thương không đổi.

## 20/10/2026 — Sư Tử Gầm to hơn
- Linh hồn sư tử to gấp ~3,3 lần: cao hơn 2 lần Rok, đứng sau Rok và quái (theo chiều sâu) nên vẫn thấy rõ nhân vật.
- Sóng gầm bật ra đúng từ miệng sư tử lúc gầm; rung màn hình mạnh hơn.
- Sửa lỗi nhỏ: số sát thương hiện trước hiệu ứng lớn bị khung chữ nhật sáng (khung chữ khoét lỗ hiệu ứng) — nay hết.
- Thời gian, sát thương không đổi.

## 20/10/2026 — Rok bản 3: hiệu ứng mới (hoàn chỉnh nhân vật)
- **4 tấm hiệu ứng của bạn** đã ráp vào game (chỉ tách nền đen, cắt khung, căn — không tô sửa). Mọi hiệu ứng Rok giờ là tranh chạy khung.
- **Dựng Khiên — Khiên Thần:**
  - đúng lúc Rok cắm khiên: khiên thần hiện ra, rồi đứng trước Rok về phía quái suốt thời gian khiên;
  - vòng thánh dưới chân; khiên mờ dần theo máu khiên còn lại;
  - mỗi lần khiên nổ: khiên nổ sóng + sóng vàng trên đất; lần cuối: khiên vỡ tan thành mảnh và lông vũ;
  - cả đội hiện khiên nhỏ "+thủ" trên đầu; khi khiên nổ hồi máu: dấu thập vàng bay lên.
  - Bỏ Thần Hộ Vệ + vòm lục giác cũ.
- **Sư Tử Gầm:** linh hồn sư tử lửa vàng lao ra, gầm, tan; sóng gầm + sóng vàng trên đất; quái bị khiêu khích hiện dấu đầu sư tử + "!".
- **Đẩy Khiên:** loé vàng ở mặt khiên lúc húc; quái rơi xuống → vòng nứt địa chấn.
- **Ý Chí Thép:** dây liên kết thành xích ánh sáng vàng.
- Thời gian, sát thương không đổi. Xem: `/tools/fx-rok.html?s=all&auto=1`.
- Đã chơi thử trận AUTO + build: không lỗi.

## 20/10/2026 — Rok bản 3 vào game kiểu sprite
- **Tranh của bạn đã ráp** (giữ nguyên, chỉ tách nền + căn chân + chỉnh cỡ): đủ 8 tấm, 64 khung — đứng, thủ thế, đánh thường, chạy, trúng đòn, choáng, Sư Tử Gầm, Đẩy Khiên, Dựng Khiên, rơi vào trận, gục, thắng.
- **Khung chính đúng mốc ra đòn cũ:** chém 0,24s · gầm 0,42s · húc khiên 0,22s · cắm khiên 0,14s. Sát thương, thời gian không đổi.
- **Tách nền tốt hơn:** cách mới giữ viền đen mảnh quanh lưỡi kiếm (cách cũ làm mép kiếm lởm chởm). Ignar vẫn dùng cách cũ, hình không đổi.
- **Dùng được PNG trong suốt** từ app vẽ mới (tấm đứng + tấm chém), bỏ quầng sáng mờ quanh nhân vật.
- **Xem:** `/tools/test-sprite.html?char=warrior&auto=1`; trong trận thêm `?rok=cutout` để xem lại bản khung xương.
- Đã chơi thử trận AUTO + build: không lỗi.
- **Chưa đổi:** hiệu ứng kỹ năng (đầu sư tử, Thần Hộ Vệ + vòm lục giác...) vẫn bản cũ — chờ 4 tấm hiệu ứng Khiên Thần / sư tử.

## 19/10/2026 — Rok bản 3: tạo hình mới hiệp sĩ châu Âu + Khiên Thần
- **Tạo hình mới:**
  - tóc bạch kim, mắt xanh;
  - giáp tấm bạc viền vàng, áo trắng có sư tử vàng, áo choàng xanh hoàng gia;
  - trường kiếm chuôi vàng, khiên heater trắng có sư tử vàng.
- **Prompt tạo hình:** `01-character-v3.png` (đính kèm tranh Ignar chỉ để lấy phong cách chibi) + chân dung tuỳ chọn. Tranh Rok cũ giữ nguyên.
- **8 tấm sprite viết lại theo tạo hình mới** (`art/rok/sprite/PROMPTS_SPRITE.md`). Dựng Khiên: giơ khiên lên trời gọi Khiên Thần → cắm khiên thủ thế.
- **Hiệu ứng Rok** (`art/rok/fx2/PROMPTS_FX.md`, 4 tấm):
  - **Khiên Thần:** hiện ra, giữ lặp, nổ sóng, vỡ tan. Thay Thần Hộ Vệ + vòm lục giác.
  - **Sư tử:** linh hồn sư tử vàng gầm + sóng gầm.
  - **8 hình khác:** vòng thánh, sóng vàng, nứt đất, dấu khiêu khích, khiên nhỏ buff đội, loé húc khiên, xích liên kết, dấu hồi máu.
- Chưa đổi game (chờ tranh).

## 19/10/2026 — Giai đoạn 0: khuôn chung để đồng bộ cả đội theo Ignar
- **Bỏ phối hợp với Codex:** 3 file `PHOI_HOP_AI.md`, `BAN_GIAO_CLAUDE.md`, `BAN_GIAO_CODEX.md` sẽ được `cap_nhat_github.bat` xoá khi bạn đẩy (máy không cho Claude xoá trực tiếp). Tài liệu bỏ phần nhắc tới Codex.
- **Hướng dẫn vẽ mới** `art/HUONG_DAN_VE_NHAN_VAT.md` (quy trình sprite):
  - bộ tấm chuẩn của 1 nhân vật;
  - ảnh đính kèm (tấm đầu lấy cỡ theo Ignar, tấm sau theo chính nhân vật);
  - đoạn prompt chung sprite + hiệu ứng;
  - câu sửa khi AI vẽ sai.
- **Code dùng chung cho mọi nhân vật:**
  - `src/vfx/flipbook.js`: hiệu ứng chạy khung (tách từ hiệu ứng Ignar, Ignar dùng lại, không đổi hình).
  - `FrameSpriteView`: lửa tay tuỳ chọn; thủ thế 1 khung + thở; điểm gắn từng khung (mũi kiếm, đầu cung, tay cầm lụa...) — `events.js` tự dùng khi có; dư ảnh khi lướt giữ đúng khung.
  - `tools/sprite_pack.py`: đánh dấu điểm gắn, xuất WebP, chống viền tối khi thu nhỏ.
  - `tools/fx_grid_pack.py`: xuất WebP.
  - **Trang thử chung** `tools/test-sprite.html?char=...`: lần lượt mọi động tác của bất kỳ nhân vật nào (đã chạy thử cả 10 nhân vật, không lỗi).
- **Nhẹ hơn:** atlas Ignar chuyển sang WebP — sprite 9 MB → 3,5 MB, hiệu ứng 3,6 MB → 1,6 MB, hình không đổi (đã so). PNG cũ bat dọn khi đẩy.
- **Prompt hiệu ứng dùng chung cả đội** `art/common/PROMPTS_FX_CHUNG.md` (4 tấm, phần trắng nhuộm theo màu nhân vật).
- **Bắt đầu giai đoạn 1:** prompt sprite Rok `art/rok/sprite/PROMPTS_SPRITE.md` (8 tấm, khung chính ↔ mốc ra đòn).

## 19/10/2026 — Ignar hiệu ứng mới (hoàn chỉnh nhân vật)
- **9 tấm hiệu ứng của bạn** đã ráp vào game. Mọi hiệu ứng giờ chạy khung, không còn 1 hình đứng yên.
  - **Luôn thấy:** lửa trên tay; cầu lửa bay; trúng cầu lửa.
  - **Thiên Hỏa Cầu:** vòng báo, thiên thạch rơi, nổ 8 khung từ lửa thành khói, biển lửa đất nứt.
  - **Cột Lửa:** chưởng đất, vòng phép mờ → rực, cột lửa bùng → cháy → tắt.
  - **Hỏa Thần:** hào quang, cánh lửa bung sau lưng (theo hướng mặt), Hộ Vệ bay / lấy đà / ném / gầm, khiên lửa vòng lửa.
  - **Đòn Hỏa Thần:** Hỏa Chưởng có luồng chưởng + cầu xoáy.
- **Hết viền đỏ đục:** tranh nền đen tuyền. Đá, giáp Hộ Vệ, đất cháy giữ đặc; khói giữ màu xám.
- **Ráp tranh:** chỉ cắt theo ô, tách nền, căn khung, không tô sửa. Hình AI vẽ lấn sang ô bên cạnh vẫn đủ.
- **Mốc sát thương không đổi** (vẫn theo server).
  - Hiệu ứng trúng mới chỉ dành cho Ignar; Elarion giữ hiệu ứng cũ.
- **Xem:** `/tools/fx-ignar.html?s=all&auto=1`. Video: `Claude outputs/ignar_hieu_ung_moi.mp4`.
- **Không còn dùng:** hiệu ứng bản 1 (`src/assets/sprites/ignar_fx.png`, `src/vfx/ignarFx.json`). `cap_nhat_github.bat` tự xoá khi đẩy; tranh gốc `art/ignar/fx-a/b/c.png` vẫn giữ.

## 19/10/2026 — Bộ prompt hiệu ứng mới cho Ignar
- **`art/ignar/fx2/PROMPTS_FX.md`:** kiểm kê mọi hiệu ứng của Ignar — dùng ở kỹ năng nào, đang có mấy khung, lỗi gì.
  - Lỗi cũ: viền đỏ đục do nền tấm cũ không đen tuyền; ít khung.
- **9 tấm mới:** lưới cố định để cắt tự động, nền đen tuyền, nhiều khung hơn.
  - Lửa tay, cầu lửa bay, trúng cầu lửa, cầu xoáy: 4 khung lặp / 4 khung.
  - Nổ: 8 khung. Thiên thạch: 4 khung lặp. Lửa biển lửa: 4 khung lặp.
  - 8 hình nằm trên đất. Cột lửa: 8 khung.
  - Hào quang 4, cánh lửa 4, luồng chưởng 4, khiên lửa 4.
  - Hộ Vệ Thần Lửa: 8 khung.
- Chưa đổi game (chờ tranh).

## 19/10/2026 — Ignar sprite đủ mọi động tác
- **8 tấm mới** của bạn đã ráp vào game:
  - chạy, trúng đòn, choáng;
  - Thiên Hỏa Cầu, Cột Lửa, gồng Hỏa Thần, Hỏa Chưởng, chưởng toàn thể;
  - rơi vào trận / đáp đất, thắng, gục.
- **Mốc ra đòn đúng từng chiêu** (đo lại trên trang thử):
  - đánh thường 0,25s · Thiên Hỏa Cầu 0,35s · Cột Lửa 0,25s · Hỏa Chưởng 0,2s · chưởng toàn thể 0,3s;
  - cầu lửa / chưởng bay ra từ đúng bàn tay.
- **Gục:** dùng tranh nằm ra đất, không còn xoay ngã kiểu khung xương. **Chạy:** có bước chân thật.
- **Ráp tranh:**
  - chỉ tách nền, đưa các tấm về cùng cỡ, căn chân (chạy / nhảy / gồng / Hỏa Chưởng căn theo đầu cho thân không giật);
  - atlas cắt sát từng khung, thu 0,75 cho nhẹ;
  - không tô sửa tranh.
- **Xem nhanh:** `/tools/test-ignar-sprite.html?mode=tour&auto=1` (hoặc `xem_thu_ignar.bat`). Video: `Claude outputs/ignar_sprite_moi_dong_tac.mp4`.

## 19/10/2026 — Bộ prompt sprite đầy đủ cho Ignar
- **`art/ignar/sprite/PROMPTS_SPRITE.md`:** bảng mọi động tác Ignar dùng trong game.
  - Gồm: chạy, trúng đòn, choáng, 3 kỹ năng, gồng, rơi vào trận, Hỏa Chưởng, chưởng toàn thể, gục, thắng.
  - Mỗi động tác ghi số khung, **khung chính trùng mốc ra đòn**, độ ưu tiên.
- **8 tấm còn lại**, mỗi tấm 4×2 khung. Có đoạn prompt chung + đoạn riêng từng tấm, cách tạo để các tấm cùng cỡ, cùng nét.
- Chưa đổi game.

## 19/10/2026 — Ignar kiểu sprite đã vào game (bản thử, mặc định bật)
- **Chơi là thấy:** Ignar trong trận giờ dùng tranh sprite của bạn (`npm run dev` hoặc `npm start` đều được).
- **Cơ chế không đổi:** khung xương vẫn chạy ẩn để giữ mốc ra đòn, lúc rơi vào trận, chết, choáng... Chỉ phần hình đổi.
- **Ra đòn** (đánh thường, Thiên Hỏa Cầu, Cột Lửa, Hỏa Chưởng, nhảy chưởng): dùng tấm đánh thường, khung đẩy chưởng trùng đúng mốc ra đòn của từng chiêu. **Gồng Hỏa Thần:** đứng nắm lửa.
- **Chưa có tấm riêng** (chạy, trúng đòn, choáng, thắng): dùng khung đứng, nghiêng / nhún theo động tác cũ. Chạy hiện là lướt, chưa bước chân.
- **Cách đứng:** mặc định C (1 khung + thở bằng code). Đổi: thêm `?ignarIdle=A` hoặc `?ignarIdle=B` vào địa chỉ game. Về khung xương: `?ignar=cutout`.
- **`xem_thu_ignar.bat`:** bấm đúp để chạy game + mở trang xem thử (mở file html trực tiếp sẽ ra trang trắng).
- **Dọn:** thư mục `tools/sprite-test/` không dùng nữa, `cap_nhat_github.bat` tự xoá khi đẩy.

## 19/10/2026 — Ignar thử kiểu sprite (chưa vào game)
- **Lý do:** bạn thấy kiểu khung xương vẫn khựng, thích sprite (mỗi khung 1 hình vẽ trọn thân).
- **Tranh của bạn** (tạo bằng AI, nền xanh, giữ nguyên): `art/ignar/sprite/sprite-idle.png`, `sprite-attack.png`.
- **`tools/sprite_pack.py`:** tách nền xanh, tách 8 khung mỗi tấm, căn chân, chỉnh tỉ lệ 2 tấm cho bằng nhau, đo điểm bàn tay. Không tô sửa tranh.
- **`tools/test-ignar-sprite.html`:** xem sprite trong cùng cảnh với cầu lửa thật; mở `&view=cutout` để so với bản khung xương.
- **Mốc ra đòn giữ nguyên:** đánh thường 12 khung/giây, khung 4 (đẩy chưởng) bắt đầu đúng 0,25s.
- **Lửa trên tay:** đứng thì ngửa tay giữ lửa → nắm lửa ở khung 2–3 → cầu lửa rời tay ở khung 4.
- **GIF so sánh** trong `Claude outputs/`.
- **Game chưa đổi:** trận đấu vẫn dùng khung xương.

## 17/10/2026 — Ignar bản thử chuyển động (đứng → đánh thường → về) — Claude làm, chờ Codex kiểm
- **Mục tiêu:** hết cảm giác mảnh cứng / rời, giữ thiết kế + thần thái pháp sư điềm tĩnh. Không đổi cơ chế, chỉ số, mốc sát thương (ra đòn 0,25s, cầu lửa bay 0,23s).
- **Tay xa gập được khuỷu:** tách thành bắp tay (ẩn dưới vạt vai) + ống tay + bàn tay. Động tác cũ giữ y hình (đã so từng điểm ảnh).
- **Bàn tay ngửa giữ lửa** lấy từ tấm 03 — hết chỗ khuyết ở lòng bàn tay.
- **Hết vệt sáng ở cổ áo và đường ngang ở thắt lưng** khi nhân vật nhỏ trên màn hình (atlas nới khoảng trống + mảnh chồng mép rộng hơn).
- **Đứng / thủ thế / đánh thường viết lại:**
  - tay gần + chân giữ sát dáng tranh nên không lộ lỗ sau lưng;
  - đánh: gom lửa về (khuỷu gập, cổ tay ngửa) → đẩy cẳng tay + bật cổ tay → quá đà nhẹ → về;
  - có đường cong tốc độ; thân / đầu gần như đứng yên.
- **Khăn vai** lắc rất nhẹ (lò xo).
- **Công cụ:** `tools/test-ignar.html` (xem / quay đoạn thử). `tools/cut_reference.py` thêm tuỳ chọn `"pad"` (mặc định như cũ).
- **Ảnh / GIF trước–sau** trong `Claude outputs/`.
- **Chưa chỉnh:** gọi Thiên Hỏa Cầu, Cột Lửa, gồng, Hỏa Chưởng, nhảy chưởng, chạy, trúng đòn — vẫn như cũ (có lỗ sau lưng khi tay gần giơ cao).

## 17/10/2026 — Phối hợp Claude ↔ Codex · bàn giao Ignar
- **`PHOI_HOP_AI.md`:** yêu cầu Ignar đã chốt (giữ 2D, thiết kế, thần thái điềm tĩnh; sửa hiển thị / animation, giữ nguyên cơ chế, thông số, mốc sát thương), phân công, luật chung (khoá file, không tự đẩy GitHub), tin nhắn.
- **`BAN_GIAO_CLAUDE.md`:** hiện trạng rig Ignar, 6 nguyên nhân cứng / rời, mốc thời gian không được đổi, tranh tận dụng được (tấm 02 chưa dùng), đánh giá Spine / nâng cấp hệ hiện tại / sprite sheet, đề xuất bản thử đứng → đánh thường → về đứng.
- Ảnh hiện trạng: `Claude outputs/ignar_hien_trang_dong_tac.png`, `Claude outputs/ignar_hien_trang_danh_thuong.png`.
- Chưa sửa code, chưa tạo tranh mới — chờ Codex phản hồi trong `BAN_GIAO_CODEX.md`.

## 17/10/2026 — Hướng dẫn vẽ nhân vật + bộ prompt Ignar bản 2
- **`art/HUONG_DAN_VE_NHAN_VAT.md`:** luật vẽ để tranh ráp thẳng vào game, Claude không phải sửa tranh. Gồm: bộ tranh cần có, bộ mảnh chuẩn và đầu khớp tròn, bàn tay / mắt, chuỗi khung hiệu ứng, cách gửi.
- **`art/ignar/PROMPTS.md`:** bộ prompt vẽ lại Ignar.
  - Bảng động tác có sẵn trong code, bảng hiệu ứng ↔ kỹ năng.
  - Thêm khung cho mượt: lửa tay 3 khung, nổ 6, hào quang 4, Hộ Vệ 4 dáng, thêm vòm Giáp Lửa.
  - Thêm mảnh lò xo: tóc sau, khăn vai, 2 vạt áo.
- Chưa đổi code / hình trong game — chờ tranh mới.

## 17/10/2026 — Thiên Thạch chạm đất luôn chí mạng
- **Elarion — Thiên Thạch:** cú rơi chạm đất (×2,8) **luôn chí mạng**; lăn, vệt lửa và va chạm với Lốc Xoáy vẫn tính bình thường (có thể chí mạng theo tỉ lệ).

## 17/10/2026 — Elarion & Golem mạnh hơn · Bão hồi 10s +2 Orb · Ngọc từ kỹ năng
- **Elarion sát thương cao hơn:**
  - M.ATK 215 → **240** (đánh thường mạnh hơn ~12%).
  - Thiên Thạch ×2,2 → **2,8** (lăn 0,6 → **0,8**, vệt lửa 0,3 → **0,4**, va Lốc Xoáy 0,9 → **1,2**).
  - Băng Phong ×0,8 → **1,1** (mảnh 0,25 → **0,35**).
  - Lôi Xích ×1,2 → **1,5**.
  - Lốc Xoáy ×0,8 → **1,1**.
  - Hỏa Lôi Cầu ×1,6 → **2,0**.
  - Sét Mưa Giông ×0,5 → **0,7**.
  - Phản đòn Giáp Băng Sét ×0,3 → **0,4**.
- **Băng Hoại Hỏa Thiên:** chưởng **10s** (trước 7s); mỗi giây băng ×0,22 → **0,3**, lửa ×0,3 → **0,42**.
- **Sửa lỗi:** một số hệ số phép của Elarion không tăng theo bậc kỹ năng (băng / lửa SolarBeam, mảnh Băng Phong, va chạm Thiên Thạch, sét Mưa Giông) — giờ tăng ×1,2 / 1,45 / 1,75 như mọi kỹ năng.
- **Golem:** ATK 0,8× → **1,1×** M.ATK Elarion; Nộ Lửa ×1,4 → **1,8**; Bão Tuyết ×0,35 → **0,5**/giây; Hào Quang Sét ×0,3 → **0,45** mỗi đòn.
- **Bão Nguyên Tố (KN3):** hồi 30s → **10s**; dùng xong **+2 Orb ngay** (thực tốn 1 Orb).
- **Thiên phú 2 Thiên Tài Nguyên Tố:** 35% / 50% → **40% / 70%**.
- **Ngọc từ kỹ năng:** đồng đội dùng đủ **5 kỹ năng** → +1 ngọc ngẫu nhiên; đối thủ dùng đủ **10 kỹ năng** → +1 ngọc ngẫu nhiên. Có luồng nguyên tố bay về Elarion, viên thưởng loé vàng trên khay; bộ đếm `🤝x/5 ⚔x/10` trên thẻ. Không tính kỹ năng của Elarion và Golem.

## 17/10/2026 — Băng Hoại Hỏa Thiên thành SolarBeam (kiểu Kamehameha)
- **Elarion ❄️❄️🔥 Băng Hoại Hỏa Thiên (3 Orb / 14s) làm lại hoàn toàn:**
  - Khum 2 tay về hông **dồn lực 0,7s** (cầu băng + cầu lửa xoay quanh nhau tụ vào lòng bàn tay) → **"HA!"** đẩy 2 lòng bàn tay ra trước.
  - **Đứng yên chưởng tia băng-hỏa 7s thẳng tới cuối bản đồ**: vỏ băng ngoài, lõi lửa, 2 dải băng / lửa xoắn quanh nhau, mảnh băng + tàn lửa bay dọc tia, nổ liên tục ở cuối tia, vệt sáng dưới đất chỉ đường tia.
  - Tự ngắm hướng quét trúng nhiều đối thủ nhất (lệch tối đa ~26°). **Người đang bay không dính.**
  - Mỗi giây, mọi đối thủ trong tia:
    - **Băng** ×0,22 — không tăng; +1 tầng Hàn Khí (đủ 5 tầng đóng băng) + −15% tốc đánh.
    - **Hỏa** ×0,3 — mỗi giây +1 tầng, +3% sát thương lửa mỗi tầng; **đủ 5 tầng: tia lửa to hẳn, sát thương lửa +30%** (tổng +45%).
  - Đang chưởng: không đánh / chạy; bị choáng / đóng băng hoặc dùng kỹ năng khác thì ngắt; Elarion gục thì tắt (mưa giông cũng vậy).
  - AI tự dùng khi có từ 1 đối thủ thẳng hàng (càng nhiều càng ưu tiên).
- Xem thử: `/tools/fx-elarion.html?s=beams` (tia chéo: thêm `&uz=0.3`).

## 17/10/2026 — Máu tướng ×1,5 · Orb cho Nerissa / Elarion · Brakk Độc Long
- **Máu:** mọi tướng không phải Chiến Binh (Jessica, Lyra, Seraphine, Ignar, Zerith, Nerissa, Elarion) **máu ×1,5**. Rok, Brakk giữ nguyên.
- **Golem:** máu gấp đôi bản trước (= 4,67× máu Elarion).
- **Brakk — Độc Long:** vừa còn 1 mình trên sân → **tự hoá Khổng Lồ miễn phí** (không tốn Orb / máu, không tính hồi chiêu); đang Khổng Lồ thì làm mới thời gian.
- **Nerissa — Thủy Thần Vũ:** vừa vào điệu, **cả đội +2 Orb** ngay.
- **Elarion:**
  - **Hỏa Lôi Cầu** nổ: cả đội +1 Orb, riêng Elarion +2 Orb.
  - **Tốc Lôi:** tốc độ hồi Orb của Elarion ×2 trong 10s.
  - **Nhặt ngọc Lôi** (thiên phú 1): mỗi tầng +10 / 15 / 20% tốc độ hồi Orb.

## 17/10/2026 — AUTO từng tướng · Múa / Tàng Hình phải gặp địch
- **Nút AUTO trên mỗi thẻ tướng:** AUTO MODE cả đội tắt vẫn bật được AUTO riêng cho từng tướng (tự dùng kỹ năng), tướng khác bấm tay. Nhớ theo trình duyệt, trận sau tự bật lại.
- **Điệu múa (Nerissa) và Tàng Hình (Jessica) phải gặp đối thủ** trong tầm bắn của Lyra (11) mới dùng — bấm sớm thì lệnh nằm chờ, gặp địch là dùng; nút hiện nhãn "chưa gặp địch". Camera không bị chạy loạn lúc chưa giao tranh.

## 17/10/2026 — Khay ngọc Elarion trên thẻ
- **Ngọc Nguyên Tố chuyển lên KHAY NGỌC ngay phía trên thẻ Elarion** (không còn nằm trong cảnh 3D): bấm dễ, không bị camera / góc nhìn / động tác ảnh hưởng.
  - Mỗi viên có chỗ cố định (5 ô dưới + 4 ô trên so le) — viên khác rơi / tan không làm xê dịch.
  - Vòng quanh viên ngọc = thời gian còn lại, sắp tan thì nhấp nháy; rê chuột vào thì to lên + viền vàng; bấm thì viên ngọc bay vào ô trên thẻ.
  - AI tự nhặt cũng thấy ngọc bay từ khay vào ô. 3 quả cầu đang giữ vẫn bay quanh đầu Elarion (2 phe đều thấy).

## 17/10/2026 — Tầm đánh Elarion / Ignar · Rok gánh đòn
- **Tầm đánh xa hơn:** Elarion 11 → **14**, Ignar 13 → **15** (kỹ năng Ignar 16 → 18) — đứng lùi xa tank hơn khoảng 2 ô.
- **Hỏa Lôi Cầu:** điểm nổ dời ra 12 ô trước Elarion (khớp tầm đứng mới, rơi đúng hàng trước địch).
- **Rok — Kiên Cường (thiên phú 2):** còn dây liên kết → người được nối chỉ nhận **50%** sát thương, **Rok gánh 50%** còn lại (Dựng Khiên của Rok hứng trước). Rok hiện số vàng `◈ -x`, khối sáng chạy dọc dây về Rok.

## 17/10/2026 — Làm lại hiệu ứng Elarion + Golem
- **Hiệu ứng giữ đúng màu tranh:** trước đây hình bị cộng sáng nên trên nền cỏ / trời sáng bị cháy trắng, nhạt màu — giờ vẽ đúng như tranh, độ nét gấp đôi.
- **To hơn:** thiên thạch + vụ nổ, tảng đá lăn, lốc xoáy, khối băng Băng Phong, cầu Hỏa Lôi, sét.
- **Mưa Giông:** 1 mảng mây đen lớn, trời tối sầm, mưa xiên toàn màn hình, chớp sáng mỗi lần sét đánh.
- **Hỏa Lôi Cầu:** hiện ở 1 điểm cố định cách Elarion 8 ô phía trước, to dần rồi nổ tại chỗ.
- **Golem:** dùng nguyên tranh bạn gửi (giữ đúng nét), to hơn (cao gấp ~1,6 lần nhân vật), cử động cả thân.
  - Bão Tuyết: hít vào phồng người → chồm tới phun, **bão tuyết phủ toàn màn hình**.
  - **Sửa lỗi:** Golem gục / tan giữa lúc phun thì tắt bão tuyết ngay (trước đây chết rồi vẫn phun).

## 17/10/2026 — Elarion + Golem có hình thật · phép dùng 1 lần
- **Phép dùng 1 lần:** dùng phép ở nút KN2 xong là mất, nút trở về "Chưa ghép phép" — phải ghép lại bằng Sách mới dùng tiếp.
- **Elarion có hình thật** (bộ tranh bạn gửi, lưu ở `art/elarion/`):
  - Ghép mảnh + gắn xương như các nhân vật khác; Sách Nguyên Tố lơ lửng trước người, mở ra khi đọc Sách / tung phép.
  - Động tác riêng: chưởng, đọc Sách, tung phép, gọi bão, đứng thi triển Mưa Giông; mắt đổi biểu cảm (mắt 3 màu khi niệm).
  - Ảnh chân dung ở màn chọn đội.
- **Golem có hình thật:** đấm, gồng nắm đấm lửa rồi lướt đấm, hút khí rồi há miệng phun bão tuyết, giơ tay đón sét (nắm đấm hoá sét), trồi lên lúc triệu hồi.
- **Hiệu ứng thay bằng tranh:** ngọc, Sách, Bão Nguyên Tố, 10 phép, kỹ năng Golem, ngục băng, vòm Giáp Băng Sét.
- Đầu khớp màu da của tấm bộ phận được tô lại màu vải cho khỏi lộ khi cử động.

## 17/10/2026 — Elarion: Sách không hồi chiêu, Thiên phú 2 mới
- **Thiên Thạch** lăn **về phía trước** (hướng phe địch) như cũ.
- **Sách Nguyên Tố:** không còn hồi chiêu, mỗi lần ghép tốn **1 Orb**.
- **Thiên phú 2 Thiên Tài Nguyên Tố:** mỗi lần ghép phép bằng Sách có **35% / 50%** (cấp tối đa) để phép kế tiếp giảm 1 Orb, không hồi chiêu.
- **Bão Nguyên Tố:** chỉ còn bổ sung ngọc đủ 7 viên (bỏ phần "Sách hồi 1s" vì Sách không còn hồi chiêu).
- **AI:** đang giữ phép dùng được thì không ghép lại, đỡ phí Orb.

## 17/10/2026 — Elarion bản 2 + Golem + Zerith
- **Prompt vẽ bản 2** (`art/elarion/PROMPTS.md`): thêm dòng phong cách **chibi**, dặn đính kèm ảnh mẫu (Ignar / Brakk); hình hiệu ứng đổi theo phép mới.
- **Ngọc Nguyên Tố:** thành khối riêng lơ lửng **phía trên** Elarion, không dính động tác; rê chuột vào ngọc thì ngọc to lên + vòng sáng vàng.
- **Hàn Khí** (hiệu ứng mới): mọi sát thương băng cộng tầng, mỗi tầng −2% tốc đánh, đủ 5 tầng thì đóng băng 1,5s.
- **Phép đổi:**
  - **Băng Phong:** 3 Orb; khối băng thành hình trên đầu địch 1,5s rồi rơi, vỡ ra 5 khối nhỏ.
  - **Lôi Xích:** hồi 13s; sau 5 lần nảy mỗi lần 50% nảy tiếp.
  - **Giáp Băng Sét:** khiên cho Elarion + đồng đội yếu máu nhất.
  - **Thiên Thạch:** lăn chậm; bị Lốc Xoáy đẩy va vào thì thêm sát thương.
  - **Hơi Nước Bỏng:** 3 Orb, niệm 2s rồi mưa giông 7s (hồi máu / MP, sét đánh + choáng).
  - **Hỏa Lôi Cầu:** to dần 2s rồi nổ, choáng 0,5s, trừ 1 Orb.
  - **Băng Hoại Hỏa Thiên** (thay Tuyết Lở): tia băng rồi tia lửa.
  - **Tốc Lôi:** riêng Elarion chưởng 2 lần + 25% tốc đánh 10s, cứ 5 đòn thì cả đội +5% tốc đánh.
- **Golem:** không nhận buff / debuff / khống chế nào (trừ Ấn Tử).
  - Nộ Lửa lùi về phía đồng minh trước khi lướt.
  - Bão Tuyết niệm 2s rồi đứng phun 6s.
  - Hào Quang Sét thành **tay sét** (+25% tốc đánh, mỗi đòn giật toàn bộ đối thủ, 50% choáng).
- **Zerith:** Ấn Tử giảm hồi máu **20% → 35%** (cấp tối đa).

## 16/10/2026 (tối) — Elarion chơi được (hình tạm)
- Elarion đã **vào lại danh sách chọn đội**. Elarion và Golem đang dùng **hình tạm** (capsule tím / capsule đá); có tranh thì thay.
- **Ngọc Nguyên Tố:** lơ lửng quanh pháp sư, **bấm chuột** vào để nhặt; sắp tan thì nhấp nháy. 3 viên đang giữ bay quanh đầu.
- **Thẻ HUD:**
  - Có 3 ô ngọc.
  - Nút Sách ghi số ngọc đang giữ (x/3).
  - Nút phép đổi tên, giá Orb và hồi chiêu theo phép đang giữ; giảm 1 Orb nhờ thiên phú thì có dấu ↓.
- **Hiệu ứng tạm cho cả 10 phép**, Golem (gọi ra, đấm lửa, bão tuyết, hào quang sét, tan), đóng băng (lớp băng phủ người), vòm Giáp Băng Sét.
- **Tool Phe Mình:** thêm 10 nút đặt thẳng phép cho Elarion để test nhanh.

## 16/10/2026 — Đang làm: Elarion (Tam Nguyên), pháp sư nguyên tố
- **Phần server đã xong**, gồm:
  - Ngọc Nguyên Tố: rơi mỗi 3s, một hệ không rơi quá 2 lần liền, tối đa 5 viên, sống 8s giờ thật.
  - Sách Nguyên Tố, Bão Nguyên Tố.
  - Đủ 10 phép, Golem Nguyên Tố (nhân vật triệu hồi 20s, 3 kỹ năng ngẫu nhiên).
  - 2 thiên phú, AI tự nhặt ngọc và ghép phép.
- **Chưa có hình và giao diện** (ngọc bấm được, nút phép, hiệu ứng), nên Elarion **tạm ẩn khỏi danh sách chọn đội**.
- Prompt vẽ hình nằm ở `art/elarion/PROMPTS.md`.

## 16/10/2026 — Brakk: Độc Long
- **Thiên phú 2 Long Huyết Bất Khuất** thêm **Độc Long**: đồng đội gục hết, chỉ còn 1 mình Brakk trên sân → sát thương của Brakk ×2. Lúc bật Brakk gầm lên (chữ "×2"), có hào quang rồng lửa nhạt quanh người và biểu tượng 🐲 trên bảng hiệu ứng.

## 16/10/2026 — Nhân vật mới Nerissa (Thủy Vũ)
- **Tu Sĩ nước, vũ công dải lụa, tộc Elf**, sát thương phép, tầm 8. Đánh thường vung lụa bắn giọt nước.
- **3 kỹ năng là 3 điệu múa chạy song song.** Lúc múa Nerissa lượn qua lại thật quanh chỗ đứng (quái phải đuổi theo); mỗi tổ hợp điệu có animation múa riêng.
  - **Vũ Khúc Sóng Triều** (2 Orb, hồi 10s sau khi múa xong / bị ngắt): múa 5s, cả đội tăng tốc hồi MP — đủ 5s thêm 2 / 3 / 4 / 5 Orb theo bậc.
  - **Lưu Thủy Hồi Xuân** (cần ≥ 1 Orb, không hồi chiêu): mỗi 0,5s đốt 0,5 Orb hồi máu cả đội, múa tới khi hết Orb.
  - **Thủy Thần Vũ** (4 Orb, hồi 12s sau khi múa xong / bị ngắt): múa 10s, cả đội +20% máu tối đa, +30% hồi máu nhận, +20% ATK, kháng khống chế (Nerissa 100%, đồng đội 50%).
  - **Cả 3 điệu cùng lúc:** mỗi giây bắn nốt nhạc — đối thủ ăn sát thương + −15% M.DEF; đồng đội +10% sát thương phép + 50% giải 1 khống chế.
- **Thiên phú 1 Hòa Âm Thủy Vũ:** 1+2 giáp nước cả đội (tự hồi) · 2+3 hút Orb đối thủ (tối đa 2 Orb) · 1+3 phe ta nhanh, phe địch chậm · 1+2+3 cả đội +1 Orb (1 lần/trận, cấp tối đa 2 lần).
- **Thiên phú 2 Triều Dâng:** đối thủ gục → cả đội +1 Orb; Nerissa hồi MP nhanh hơn 25% (SSS 40%).
- **Nút kỹ năng đang chạy** có vòng sáng chạy quanh viền + vạch thời gian còn lại; cả 3 điệu cùng chạy → vòng vàng.
- Hình ghép từ tấm bộ phận + dải lụa là chuỗi khớp lò xo; hiệu ứng nước / nốt nhạc / bong bóng giáp / hào quang nữ thần từ 2 tấm fx của bạn.
- Công cụ xem thử mới: `/tools/fx-nerissa.html?s=d123`.

## 15/10/2026 — Cân bằng 6 nhân vật + luật phá khiên của Zerith
- **Jessica:** Sát Ý chỉ cộng sát thương cho đúng 1 đòn (đối thủ dưới 50% máu), rồi hồi 10s.
- **Rok:**
  - Đẩy Khiên: đối thủ rơi xuống gây địa chấn, choáng 0,5s các đối thủ khác trong 3 ô.
  - Dựng Khiên bản mạnh: khiên 20% máu tối đa, 6s, nổ 6 lần ×0,8 (5,5 ô), mỗi lần hồi cả đội 2,5%, cả đội +35% thủ, choáng vẫn 0,5s.
  - Dây liên kết: vào trận nối dây với đồng đội ATK cao nhất; cả hai cùng có Ý Chí Thép (dưới 30% máu: +chặn đòn, 5s hồi 3% máu/giây, hồi 10s) và Kiên Cường; còn dây thì riêng Rok ×2; 1 trong 2 chết là đứt dây cả trận.
- **Lyra:** kỹ năng 1 bắn mục tiêu đang nhắm; Ưng Nhãn chỉ áp dụng cho kỹ năng 1-2-3.
- **Sera:** Ân Điển +600 MP/giây lúc Niệm; người được hồi sinh có 2 giây bất tử (miễn mọi sát thương, kháng cả Thần Chết phán quyết).
- **Ignar:** Cột Lửa bùng 10 lần; thiên phú 2 thêm Giáp Lửa (dưới 50% máu: khiên 10s, hất văng lúc bật, nổ choáng 1s lúc hết, +1 Orb lúc bật và lúc hết, hồi 25s).
- **Zerith:**
  - Kỹ năng 1 không tốn Orb.
  - Ấn Tử: thanh máu có vạch ngưỡng tử; chạm ngưỡng (ai đánh cũng được) thì Thần Chết nhấc lên không trung và chém — có khiên thì vỡ khiên, không khiên thì chết.
  - Chỉ kỹ năng 2 lúc đang bật Đêm Tử Thần mới phá khiên (trước đây mọi đòn của Zerith đều phá).
- **DOC:** thêm bảng chỉ số tổng hợp 7 nhân vật (mục 4.0).

## 14–15/10/2026 — Nhân vật mới Brakk (Cuồng Đấu)
- Chiến Binh đô vật tộc Dragon: Bá Vương Quật, Chấn Địa, Thần Lực Khổng Lồ (hoá khổng lồ đổi cả bộ hình).
- Thiên phú 1 Khí Thế Đấu Trường (hồi máu / khiên theo số chiêu 2 phe + Tiếng Hét Bảo Hộ khiêu khích tất cả đối thủ khi đồng đội dưới 50% máu).
- Thiên phú 2 Long Huyết Bất Khuất (dưới 50% máu: hồi máu cả đội, +Orb, giải mọi hiệu ứng bất lợi).
- Ghép lại hình từ tấm bộ phận (hết hở khớp tay chân), nhảy cao hơn, camera nâng theo cú nhảy, hiệu ứng Tiếng Hét từ tranh fx-c.
