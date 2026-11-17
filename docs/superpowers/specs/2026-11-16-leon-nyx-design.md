# Thiết kế 2 anh hùng mới: Leon (Kỳ Vương) và Nyx (Hư Không)

Ngày 16/11/2026. Người dùng đã chốt ý tưởng trong buổi thảo luận và bảo bắt tay làm ngay.
Mục nào ghi **(Claude quyết)** là Claude tự chọn để lấp chỗ trống: người dùng đổi được, người làm không tự đổi.
Anh hùng thứ ba (Kiếm tiên) chưa thảo luận, KHÔNG nằm trong bản này.

## 1. Mục đích
Thêm 2 anh hùng có lối chơi chưa ai có trong 11 anh hùng hiện tại:
- **Leon**: triệu hồi sư kiểu đánh cờ. Người chơi "khai cuộc" bằng cách chọn cánh thủ hay cánh công, rồi ra lệnh từng nước cờ. Thiên về thủ, bảo vệ đồng đội, dễ chơi nhưng có chiến thuật.
- **Nyx**: pháp sư thuần sát thương, chiêu lớn phải niệm lâu (4–5 giây), đổi lại rất mạnh. Hiệu ứng lấy từ thư viện pixelfx có sẵn trong game.

## 2. Mục tiêu / Không làm / Phải tránh
**Mục tiêu**
- Cả hai chơi được đầy đủ ở mọi chế độ đang có (ải, trùm, đấu tập, đấu người), có AUTO, có trong cửa hàng anh hùng (mua bằng Kim Cương), có thiên phú cấp 20 / 40.
- Đủ 3 bộ hình theo bậc (Thường + S dùng chung, SS, SSS), đủ icon kỹ năng / thiên phú / đánh thường, có chân dung.
- Có test tự động cho luật chính của từng chiêu.

**Không làm trong đợt này**
- Kiếm tiên. Làm lại giao diện ải / trang bị / túi đồ. Âm thanh riêng cho 2 anh hùng (âm thanh là việc cuối cùng của Chương 1).
- Quân cờ KHÔNG vẽ lại theo bậc: 6 quân chỉ có 1 bộ hình **(Claude quyết — vẽ lại 6 quân × 3 bậc là thêm khoảng 50 tấm)**.

**Phải tránh**
- Leon thành "Sylva thứ hai" (bấm là ra thú, hết giờ thì mất). Quân cờ phải ở lại tới khi bị giết và nút phải đổi theo thế cờ.
- Nyx niệm 5 giây rồi bị một cú choáng làm mất chiêu (luật hiện tại: choáng lúc niệm = mất chiêu + chiêu vào hồi).
- Không dùng confirm() / alert() / prompt(). Không đụng `data/`.

## 3. Ràng buộc
- Luật trận nằm ở `server.js` (một file lớn). Anh hùng, quân triệu hồi khai báo trong `CLASS_DEFS`.
- 1 Orb = 1000 MP. Giá chiêu theo Orb. Chỉ số bạo kích, tốc đánh... ghi theo phần nghìn (150 = 15%).
- Thiên phú 1 có 3 mức theo bậc S / SS / SSS; thiên phú 2 có 2 mức.
- Quái và trùm không dùng Orb (quái chỉ đánh thường, trùm ra chiêu theo đồng hồ). Mọi chiêu "đốt / hút Orb" phải có nghĩa khi đánh quái.
- Anh hùng và quân cờ là hình 2D (không dùng 3D). Hiệu ứng pixelfx vẽ bằng mã, giấy phép MIT, đã có ở `src/vendor/pixelfx`.
- Mảng hồi chiêu của một anh hùng chỉ có 3 ô (`skillCooldowns`), nút đổi chức năng phải tự giữ đồng hồ riêng cho từng chức năng (như `spellCd` của Elarion).

## 4. Các cách làm đã cân nhắc
**Luật trận**
- **A (chọn)** — Viết theo đúng kiểu đang có: thêm vào `server.js`, kỹ năng đi qua nhánh theo tiền tố (`chess_…` → `castChessSkill` + `processChess`, `void_…` → `castVoidSkill` + `processVoid`), quân cờ là thành viên thật của đội như thú của Sylva (`summonSylvaUnit`). Lý do: dùng lại được toàn bộ luật sẵn có (nhắm mục tiêu, khiên, buff, thắng thua, AUTO), test hiện tại nạp thẳng `server.js`.
- B — Tách file riêng trong `game/heroes/`. Sạch hơn nhưng các hàm trợ giúp đang là hàm nội bộ của `server.js`, phải tách lại cả lõi trận: rủi ro cao, ngoài phạm vi.
- C — Quân cờ chỉ là "vật đặt trên sân" không có máu (như Thần Hươu, vạc của Grix). Rẻ nhất, nhưng trái ý người dùng: quân cờ phải là quân thật, có máu, chịu đòn thay đồng đội.

**Tranh**
- **A (chọn, theo lời người dùng)** — Codex vẽ phần chính: tranh thiết kế (2 anh hùng × 3 bậc, 6 quân cờ), bộ tấm động tác bậc SSS, hiệu ứng chính của Leon, icon. Flow vẽ phần phụ: bộ tấm bậc S và SS (dựa trên tấm SSS + tranh thiết kế bậc đó), tấm động tác phụ của quân cờ nếu Codex hết lượt, hiệu ứng phụ. Codex hay báo xong mà không ra tranh: mỗi tấm phải kiểm tra file có thật, đúng cỡ, và mở xem; hỏng thì vẽ lại, hết lượt thì chuyển Antigravity.
- B — Toàn bộ bằng Flow (miễn phí) như đợt vẽ bậc S / SS trước. Rẻ hơn nhưng trái lời dặn "Codex vẽ nhân vật và hiệu ứng chính".
- Hiệu ứng của Nyx và hai chiêu của Tượng KHÔNG cần vẽ: dùng pixelfx.

---

## 5. LEON — Kỳ Vương
**Mã lớp:** `chessmaster` · **Tộc:** Người · **Nhóm:** Triệu Hồi Sư (`summoner`) · **Sát thương:** phép (STP) · **Danh hiệu:** Kỳ Vương **(Claude quyết)** · **Thư mục tranh:** `art/leon/`

### 5.1 Con người (người dùng chốt)
Nam, còn trẻ, ngoại hình tươi sáng ưa nhìn. Sôi động, nhiệt huyết, hòa đồng, hoạt bát, thân thiện, rất thích giúp người khác. Sống trong hoàng tộc Valoria nhưng đã bỏ danh phận để theo đam mê đánh cờ. **Không liên quan tới Vua Aldric II hay Công chúa Elise.**
**(Claude quyết)** Bộ cờ là đồ gia truyền của nhà anh. Trong trận anh đứng hàng sau, bàn cờ lơ lửng bên tay, đòn thường là búng một quân cờ ánh sáng (yếu); sức mạnh nằm ở quân cờ.

**3 bộ hình (Claude quyết, duyệt qua tranh thiết kế):**
- Thường / S: áo du hành sáng màu, bàn cờ gỗ.
- SS: áo choàng thêu ô cờ, bàn cờ ngọc phát sáng.
- SSS: lễ phục trắng vàng, bàn cờ ánh sáng, vương miện lơ lửng TRÊN BÀN CỜ chứ không đội trên đầu.

### 5.2 Chỉ số gốc cấp 1 (Claude quyết, lấy Sylva làm mốc)
maxHp 1000 · maxMp 5000 · pAtk 0 · mAtk 170 · pDef 45 · mDef 75 · crit 100 · critDmg 500 · acc 1000 · dodge 100 · pen 50 · block 0 · lifesteal 0 · threat 100 · mpAtk 200 · mpSec 140 · atkSpeed 1100 · đánh xa, atkRange 11 · moveSpeed 0.01.

### 5.3 Ba nút (người dùng chốt luật; giá Orb và hồi chiêu là Claude quyết)
Mỗi loại quân chỉ có 1 quân trên sân. Quân ở lại tới khi bị giết (không hết giờ). Quân chết thì nút quay về "gọi quân đó". Gọi lại một loại quân phải chờ 5 giây sau khi nó chết.

| Nút | Thế cờ | Nút làm gì | Giá | Hồi |
|---|---|---|---|---|
| 1 — Cánh THỦ | chưa có Tốt | Gọi **Tốt** | 1 Orb | 1 s |
| | có Tốt, chưa có Xe | Gọi **Xe** | 2 Orb | 1 s |
| | có cả hai | **Nước cờ thủ**: luân phiên, lần này Tốt dùng *Giữ Lối*, lần sau Xe dùng *Nhập Thành* | 1 Orb | 8 s |
| 2 — Cánh CÔNG | chưa có Mã | Gọi **Mã** | 1 Orb | 1 s |
| | có Mã, chưa có Tượng | Gọi **Tượng** | 2 Orb | 1 s |
| | có cả hai | **Nước cờ công**: luân phiên Mã *Chiếu Đôi* → Tượng *Trói Buộc* | 1 Orb | 8 s |
| 3 — Quân chúa | chưa cánh nào từng đủ 2 quân | Khoá | — | — |
| | cánh thủ đã TỪNG gọi đủ Tốt + Xe | Gọi **Vua** | 3 Orb | 1 s |
| | cánh công đã TỪNG gọi đủ Mã + Tượng | Gọi **Hậu** | 3 Orb | 1 s |
| | đang có đúng 1 quân chúa | Chiêu 2 của quân chúa đó | 2 Orb | 12 s |
| | đang có cả Vua và Hậu | **Chiếu Tướng** (chiêu kết hợp) | 3 Orb | 20 s |

- "Đã từng gọi" là đủ: Tốt chết rồi vẫn gọi được Vua.
- **(Claude quyết)** Cả hai cánh đều đã đủ thì nút 3 gọi quân chúa của cánh ĐỦ TRƯỚC. Quân chúa còn lại chỉ có được nhờ Tốt phong cấp (đúng lời người dùng: "có cả Vua và Hậu hiện tại chỉ khi Tốt phong được Hậu hoặc Vua").
- Quân chúa gọi bằng nút 3 mà chết thì nút 3 gọi lại đúng quân đó.
- Có cả Vua và Hậu: Chiếu Tướng dùng được NGAY lúc quân chúa thứ hai xuất hiện (xoá hồi chiêu nút 3). Lúc này chiêu 2 riêng của Vua và Hậu do chúng tự dùng, mỗi 14 giây **(Claude quyết)**.

### 5.4 Bàn cờ (người dùng chốt)
Gọi quân chúa thì một bàn cờ ánh sáng phủ khắp sân, hiện suốt lúc còn Vua hoặc Hậu.
- Có Vua: cả đội và quân cờ nhận ít hơn 15% sát thương.
- Có Hậu: quân cờ +20% sát thương, +20% tốc đánh.
(Con số là Claude quyết.)

### 5.5 Chiếu Tướng (người dùng chốt)
Hậu nâng TẤT CẢ đối thủ lên không 1,5 giây; Vua gọi thanh gươm ánh sáng khổng lồ (kiểu Excalibur) chém xuống. **(Claude quyết)** Sát thương vật lý ×3.0 P.ATK của Vua lên mọi đối thủ, rơi xuống choáng 1 giây. Đối thủ miễn khống chế không bị nâng nhưng vẫn ăn sát thương.

### 5.6 Sáu quân cờ
Chỉ số quân tăng theo CẤP của Leon như thú của Sylva (gốc + mỗi cấp × (cấp − 1)). Mọi con số trong mục này là Claude quyết; luật chiêu là người dùng chốt.
Quân nhận buff / debuff như thú của Sylva (`summonRules: { targetable: true, buffs: true, debuffs: true }`).

| Quân | Mã | Vai | maxHp | Công | pDef | mDef | atkSpeed | Tầm |
|---|---|---|---|---|---|---|---|---|
| Tốt | `chess_pawn` | cận chiến, chắn | 1500 (+95) | pAtk 130 (+8) | 110 (+6) | 90 (+5) | 1000 | 2.2 |
| Xe | `chess_rook` | cận chiến, trâu nhất, đánh bằng khiên lớn | 3600 (+230) | pAtk 150 (+9) | 260 (+13) | 200 (+10) | 1400 | 2.6 |
| Mã | `chess_knight` | cận chiến, đột kích hàng sau | 1500 (+95) | pAtk 185 (+11) | 90 (+5) | 80 (+4) | 900 | 2.4 |
| Tượng | `chess_bishop` | pháp sư bí ẩn hình quân Tượng, cầm trượng, đánh xa | 1000 (+65) | mAtk 165 (+10) | 50 (+3) | 90 (+5) | 1200 | 10 |
| Vua | `chess_king` | cận chiến, cầm kiếm | 4200 (+260) | pAtk 210 (+12) | 240 (+12) | 220 (+11) | 1300 | 2.8 |
| Hậu | `chess_queen` | pháp sư đánh xa | 1400 (+90) | mAtk 230 (+13) | 60 (+3) | 110 (+6) | 1100 | 11 |

**Tốt**
- *Bắt Chéo* (tự dùng): đòn thứ 3 chém chéo ×1.3, trúng thêm 1 đối thủ gần mục tiêu (bán kính 3). Chém xong Tốt được khiên 12% máu tối đa, 4 giây.
- *Giữ Lối* (nước cờ): bước lên 2 ô, khiêu khích đối thủ trong bán kính 5 đánh Tốt 3 giây. Không có khiên.

**Xe**
- *Thành Lũy* (tự có): đồng đội đứng SAU Xe (xa phía địch hơn Xe, trong 8 ô) nhận ít hơn 15% sát thương.
- *Nhập Thành* (nước cờ): nhảy tới đồng đội có % máu thấp nhất (anh hùng hoặc quân cờ, trừ chính Xe) và dựng khiên. Xe và người đó mỗi bên được khiên = 15% máu tối đa của Xe trong 5 giây; người đó còn nhận ít hơn 25% sát thương trong 5 giây.

**Mã**
- *Nhảy Mã* (tự dùng): cứ 4 đòn lại nhảy chữ L tới một đối thủ hàng sau, đánh ×1.4.
- *Chiếu Đôi* (nước cờ): nhảy vào hàng sau, kéo 2 đối thủ gần nhất (trong 7 ô) lại sát Mã, mỗi đứa ×1.2 và choáng 1 giây.

**Tượng**
- *Hút Hồn* (tự dùng, mỗi 12 giây): hai bàn tay ma thuật từ cây trượng bám một đối thủ 4 giây (hiệu ứng pixelfx **Soul Drain**), mỗi giây hút 0,5 Orb (tổng 2 Orb). Orb hút được KHÔNG chuyển cho ai. Mục tiêu không có Orb hoặc hết Orb (quái, trùm luôn vậy) thì chuyển sang **hút máu**: mỗi giây ×0.5 M.ATK, Tượng hồi đúng lượng máu đó **(Claude quyết phần hồi)**. Ưu tiên anh hùng địch nhiều Orb nhất. Tượng đứng yên lúc hút; bị choáng thì đứt.
- *Trói Buộc* (nước cờ): trói một đối thủ 2 giây (hiệu ứng pixelfx **Grasping Hands**). Trong 2 giây đó cả Tượng lẫn kẻ bị trói đều không hành động. Kẻ bị trói −30% thủ vật lý và thủ phép trong lúc trói và 2 giây sau. Ưu tiên đối thủ có công cao nhất. Mục tiêu miễn khống chế thì không bị trói nhưng vẫn bị giảm thủ.

**Vua**
- *Vương Miện* (tự dùng mỗi 15 giây): cả đội TRỪ Vua (anh hùng + quân cờ) đội vương miện 8 giây: +15% thủ vật lý và thủ phép, nhận khiên có độ bền = (pDef + mDef) của Vua. Mỗi lần Vua BỊ ĐÁNH TRÚNG, ai còn khiên vương miện được hồi 2% máu tối đa (nhiều nhất 2 lần mỗi giây). Tốt và Xe đội vương miện: mọi hiệu ứng ×2.
- *Phán Quyết* (chiêu 2): giơ kiếm niệm 3 giây, không bị ngắt. Bị đánh vẫn mất máu nhưng tích lại; hết 3 giây chém xuống đất: ×2.0 P.ATK + 100% lượng máu đã mất khi niệm (trần = 30% máu tối đa của Vua), vùng trước mặt dài 7 rộng 5, hất tung 1 giây.

**Hậu**
- *Quang Cầu* (tự dùng): mỗi 3 giây thả 1 quả cầu ánh sáng ở vị trí ngẫu nhiên trong vùng đối thủ đang đứng. Mỗi quả tồn tại 10 giây, bán kính 2.5, mỗi giây gây ×0.35 M.ATK lên đối thủ trong vùng và choáng nhẹ 0,2 giây. Đứng trong vùng nhiều quả thì ăn đủ từng quả. **(Claude quyết)** Một mục tiêu bị cầu làm choáng nhẹ nhiều nhất 1 lần mỗi 1,5 giây, để không thành choáng vĩnh viễn.
- *Vũ Điệu Quang Cầu* (chiêu 2): niệm 1 giây, thu về mọi quả cầu đang còn trên sân, tạo thêm đúng 2 quả, cho xoay sau lưng rồi bắn hết vào các đối thủ ngẫu nhiên (thu 3 → bắn 5; không còn quả nào → bắn 2). Mỗi quả trúng gây ×0.9 M.ATK, rồi rơi xuống chỗ đó và hoạt động như một quả Quang Cầu mới (10 giây).

### 5.7 Thiên phú
- **Thiên phú 1 — Thí Quân** (người dùng chốt): một quân cờ bị giết → mọi đồng đội (anh hùng + quân cờ) được khiên 6% / 8% / 10% máu tối đa của mình trong 5 giây, và Leon hồi 0,5 Orb.
- **Thiên phú 2 — Phong Cấp** (người dùng chốt): khi trên sân có ĐÚNG 1 quân chúa và Tốt còn sống đủ 15 / 12 giây (tính từ lúc quân chúa đó ra sân, hoặc từ lúc gọi Tốt nếu Tốt ra sau), Tốt hoá thành quân chúa còn thiếu với ĐẦY ĐỦ sức mạnh và các chiêu của quân chúa thật: có Vua → Tốt phong Hậu; có Hậu → Tốt xưng Vua. Ô Tốt trống lại, gọi được Tốt mới. **(Claude quyết — "kế vị")** Ghế nào trống mà có Tốt sống đủ lâu thì lại phong cấp, không giới hạn số lần.

### 5.8 AUTO (Claude quyết)
- Mở cánh thủ trước nếu đội không có Chiến Binh còn sống, ngược lại mở cánh công. Sau quân chúa đầu tiên thì xây nốt cánh kia.
- Quân chết: gọi lại ngay khi đủ Orb. Có Chiếu Tướng thì dùng ngay.
- Nước cờ thủ: khi có đồng đội dưới 60% máu. Nước cờ công: khi đủ Orb và không còn quân nào cần gọi.

---

## 6. NYX — Hư Không
**Mã lớp:** `voidmage` · **Tộc:** Goblin · **Nhóm:** Phù Thủy (`mage`) · **Sát thương:** phép (STP) · **Danh hiệu:** Hư Không · **Thư mục tranh:** `art/nyx/`
**Tên "Nyx" là Claude tạm đặt**, người dùng chưa chọn tên. Tên chỉ là chữ hiển thị, đổi lúc nào cũng được.

### 6.1 Con người
Người dùng chốt: nữ Goblin, pháp sư thuần sát thương, tình cờ học được phép Hư Không.
**(Claude quyết, duyệt qua tranh thiết kế)** Nhỏ con, da xanh, tai dài, mắt tím sáng. Tò mò, lém lỉnh, liều. Nhặt được một mảnh sao rơi rồi "lỡ tay" mở ra Hư Không. Vũ khí ở cả 3 bậc: gậy ngắn gắn mảnh sao.
- Thường / S: áo choàng vá của dân nhặt phế liệu Goblin, mũ trùm.
- SS: áo choàng tím thêu chòm sao.
- SSS: áo choàng như bầu trời đêm, vòng hố đen sau lưng.

### 6.2 Chỉ số gốc cấp 1 (Claude quyết, lấy Ignar và Grix làm mốc)
maxHp 900 · maxMp 5000 · pAtk 0 · mAtk 230 · pDef 35 · mDef 80 · crit 150 · critDmg 500 · acc 1000 · dodge 110 · pen 100 · block 0 · lifesteal 0 · threat 100 · mpAtk 200 · mpSec 130 · atkSpeed 1100 · đánh xa, atkRange 13 · moveSpeed 0.01. Đòn thường: một tia Hư Không nhỏ.

### 6.3 Kỹ năng (người dùng chốt luật; số là Claude quyết)
| # | Tên | Kiểu (`type`) | Giá | Hồi | Niệm |
|---|---|---|---|---|---|
| 1 | Ma Đạn Tinh Tú | `void_missiles` | 1 Orb | 7 s | 0 |
| 2 | Sao Rơi | `void_starfall` | 2 Orb | 16 s | 5 s |
| 3 | Hố Đen | `void_blackhole` | 3 Orb | 24 s | 4 s |

**1 — Ma Đạn Tinh Tú** (hiệu ứng **Arcane Missiles** → **Mana Burst**)
Chùm 5 tia tím bay vòng tới một mục tiêu. Trúng: ×2.2 M.ATK và đốt ngẫu nhiên 1 hoặc 2 Orb của mục tiêu. Sau đó Mana Burst nổ: 9 ấn chú nổ lần lượt (bắt đầu 0,4 giây sau cú trúng, cách nhau 0,065 giây), mỗi nhịp ×0.12 M.ATK lên mục tiêu và đối thủ trong bán kính 3. Ưu tiên anh hùng địch nhiều Orb nhất, không có thì mục tiêu đang đánh.

**2 — Sao Rơi** (**Spell Charge** lúc niệm, **Star Fall** lúc rơi)
Niệm 5 giây. Từ giây thứ 3 có 4 đợt sao rơi (giây 3,0 / 3,5 / 4,0 / 4,5), mỗi đợt ×0.9 M.ATK trong bán kính 5.5 (bằng Thiên Hỏa Cầu của Ignar) và choáng 0,5 giây. Đợt 2 và đợt 4 chắc chắn bạo kích. Vùng rơi là chỗ đông đối thủ nhất, chọn lúc đợt đầu sắp rơi (giây thứ 3). Nyx bị ngắt niệm (choáng khi chưa có Vỏ Hư Không, hoặc chết) thì các đợt chưa rơi bị huỷ.

**3 — Hố Đen** (**Black Hole** + **Shadow Tendrils**)
Niệm 4 giây. Hố đen mở ở chỗ đông đối thủ nhất, suốt 4 giây hút đối thủ trong bán kính 8 về tâm. Xúc tu bóng tối bên dưới quất 3 đợt (giây 1,2 / 2,4 / 3,6), mỗi đợt ×1.1 M.ATK lên đối thủ trong bán kính 4 quanh tâm. Mục tiêu miễn khống chế không bị hút nhưng vẫn ăn sát thương. Xúc tu theo luật "chiêu mặt đất": không trúng mục tiêu đang bay. Nyx bị ngắt niệm thì hố đen tắt.

### 6.4 Thiên phú
- **Thiên phú 1 — Xói Mòn Hư Không** (người dùng chốt ý, số Claude quyết):
  - Mỗi ĐỢT chiêu của Nyx trúng (cú trúng của chiêu 1, mỗi đợt sao, mỗi đợt xúc tu; 9 nhịp nhỏ của Mana Burst không tính): mục tiêu −6% / −8% / −10% thủ phép, cộng dồn 5 lần (−30 / −40 / −50%), giữ 8 giây.
  - Mỗi đối thủ chết: Nyx +8% M.ATK, tối đa 5 lần, tới hết trận.
  - Mỗi đồng minh (anh hùng) chết: Nyx +15% tỷ lệ bạo kích và +30% sát thương bạo kích, tối đa 3 lần.
  - Quân triệu hồi của cả hai bên không tính.
- **Thiên phú 2 — Vỏ Hư Không** (người dùng chốt: ghép hướng 1 và 3):
  - *Vỏ:* lúc đang niệm chiêu 2 / 3, quả cầu đen bọc lấy Nyx (hiệu ứng **Void Orb**): miễn khống chế (không bị ngắt niệm) và nhận ít hơn 30% / 45% sát thương.
  - *Mượn Mạng:* nhận đòn chí tử thì rơi vào cổng Hư Không 3 giây (hiệu ứng **Portal**; không ai đánh được, không hành động), rồi trở lại ở hàng sau với 30% / 50% máu. Mỗi trận 1 lần. Đang niệm dở thì chiêu đó bị huỷ.

### 6.5 AUTO (Claude quyết)
Hố Đen khi có từ 2 đối thủ trở lên hoặc có trùm; ngay sau Hố Đen dùng Sao Rơi nếu đủ Orb (hút gom rồi dội sao); Ma Đạn dùng khi không phải để dành Orb cho hai chiêu trên.

---

## 7. Tranh và hiệu ứng
Quy cách tấm vẽ theo `art/HUONG_DAN_VE_NHAN_VAT.md` (tấm 1536×1024, nền xanh #00FF00, lưới 4×2, nhìn nghiêng ¾ quay phải, không vẽ hiệu ứng vào nhân vật; tấm hiệu ứng nền đen).

| Hạng mục | Số tấm | Ai vẽ |
|---|---|---|
| Tranh thiết kế Leon (S, SS, SSS) và Nyx (S, SS, SSS) | 6 | Codex |
| Tranh thiết kế 6 quân cờ | 6 | Codex |
| Bộ tấm động tác bậc SSS của Leon và của Nyx (đứng, đánh, đi, trúng đòn + choáng, chết + thắng, niệm + đáp, 3 chiêu) | 9 + 9 | Codex |
| Bộ tấm bậc S và SS của Leon và Nyx | 36 | Flow |
| Tấm động tác của 6 quân (đứng, đánh, đi, trúng đòn + chết, chiêu) | khoảng 30 | Codex vẽ đứng + đánh, Flow vẽ phần còn lại |
| Hiệu ứng chính của Leon: bàn cờ ánh sáng, vương miện, gươm ánh sáng, quang cầu, quân ra sân | khoảng 6 | Codex |
| Icon: Leon 3 tấm (18 ô: 11 trạng thái nút, 2 thiên phú, đánh thường, 4 chiêu quân cờ), Nyx 1 tấm (6 ô) | 4 | Codex |
| Hiệu ứng của Nyx, Hút Hồn và Trói Buộc của Tượng | 0 | pixelfx (vẽ bằng mã) |

Tranh thiết kế vẽ trước và gửi người dùng xem. Chỉ vẽ hàng loạt các tấm động tác sau khi người dùng đồng ý với tạo hình.
Trong lúc chưa có tranh, phần hiển thị dùng hình tạm (bộ xương mượn của Ignar / Golem như Sylva đã từng làm) để vẫn thử được luật trận.

## 8. Để người làm tự quyết
- Tên hàm, cách chia hàm, tên hiệu ứng trạng thái mới trong `server.js`.
- Thời điểm trúng đòn (`impact`), thời gian khoá (`lock`) của từng chiêu cho khớp hoạt ảnh.
- Cách ghép hiệu ứng pixelfx (cỡ, bảng màu, số lần phát) miễn nhìn ra đúng ý từng chiêu.
- Bố cục khung hình trong từng tấm động tác.
Không tự đổi: luật chiêu, con số trong bản này, tên hiển thị.

## 9. Cách kiểm tra
- `npm test` phải qua hết (hiện 215 test) cộng test mới cho: thế cờ của 3 nút Leon, phong cấp, Thí Quân, Vương Miện, Phán Quyết, Quang Cầu, Hút Hồn đổi sang hút máu, Chiếu Tướng; Ma Đạn đốt Orb và 9 nhịp, 4 đợt Sao Rơi với bạo kích đợt 2 và 4, Hố Đen hút + 3 đợt, cộng dồn giảm thủ phép, buff khi có người chết, Vỏ Hư Không chống ngắt niệm, Mượn Mạng chỉ 1 lần.
- Vào trận thật bằng cú bấm thật: đấu tập, một ải thường, một ải trùm; bật AUTO; thử cả 3 bậc hình; thử đồ hoạ Nhẹ.
- Thử trường hợp xấu: bấm nút khi không đủ Orb, bấm liên tục, Leon chết khi còn quân trên sân, Nyx bị giết lúc đang niệm, hai Leon ở hai phe.
