# 📝 NHẬT KÝ CẬP NHẬT — Legend of Capsules

Mỗi lần sửa game, Claude ghi thêm 1 mục ở ĐẦU file này (mới nhất ở trên) để bạn nhớ đã thay đổi gì.
Mô tả cho lần đẩy GitHub kế tiếp nằm trong `mo_ta_cap_nhat.txt` — `cap_nhat_github.bat` tự đọc file đó, không cần gõ gì.

---

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
