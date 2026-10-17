# 📝 NHẬT KÝ CẬP NHẬT — Legend of Capsules

Mỗi lần sửa game, Claude ghi thêm 1 mục ở ĐẦU file này (mới nhất ở trên) để bạn nhớ đã thay đổi gì.
Mô tả cho lần đẩy GitHub kế tiếp nằm trong `mo_ta_cap_nhat.txt` — `cap_nhat_github.bat` tự đọc file đó, không cần gõ gì.

---

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
