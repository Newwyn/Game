# 📝 NHẬT KÝ CẬP NHẬT — Legend of Capsules

Mỗi lần sửa game, Claude ghi thêm 1 mục ở ĐẦU file này (mới nhất ở trên) để bạn nhớ đã thay đổi gì.
Mô tả cho lần đẩy GitHub kế tiếp nằm trong `mo_ta_cap_nhat.txt` — `cap_nhat_github.bat` tự đọc file đó, không cần gõ gì.

---

## 12/11/2026 (toi 4) — VALORIA dot 2: pho co day dac

- Codex (tai khoan moi) lam lai `tools/build_capital.py`: 73 nha nho (3x3 / 3x4 o) xep thanh day thay 17 khoi lon; 265 do dac 24 loai (31 den duong, sap, ghe, bon hoa, thung, bao, day phoi, dong cui, gieng, xe, bang thong bao, tuong...); cho 10 sap 2 hang; ke da hai bo kenh + 5 bac thang; hang cay doc dai lo, cong vien, vuon tao; ban do nho ve lai tung mai nha. 38,4% o di duoc, mot mang lien thong. 192 bai kiem tra dat. So do: `Claude outputs/so_do_thanh_valoria_dot2.png`.
- Thanh da co nha tho lon (khu phia tay, co So Agnes + cua ham mo) — hop tuyen truyen cua Seraphine.
- Da xem tan mat mot goc khu dan cu: nha khung go san sat, ong khoi co khoi, bon hoa, ghe, tuong da, cay tao — ra dang pho co. CHUA di het thanh (cho, kenh, cau, cung dien, cong).
- Loi con treo: console bao mot hinh co toa do NaN (`computeBoundingSphere`), chua tim ra la hinh nao; chua thay anh huong tren man hinh.

---

## 12/11/2026 (toi 3) — BO DO DAC PHO CO (Codex) + THANH VALORIA MOI 72x44 + quyet dinh cau truc Chuong

- Bo do dac pho co: 32 mo hinh Codex dung bang code (`tools/models/make_town_kit.py`): sap cho, dai phun nuoc, den, ghe, bon hoa, bien hieu, xe, thung, cau da/go, tuong thap, day co... Da dua vao: sap cho / dai phun / den duong tu doi; moi nha co den tuong + chau hoa (+ bien hieu, ghe); o trong sat duong rai do; canh chien dau lang / cho / quang truong them do.
- Thanh Valoria ve lai 72x44 o (truoc 43x24) bang `tools/build_capital.py` (Codex): tuong thanh + thap, cong nam, dai lo 4 o, quang truong cho, kenh + 2 cau, cung dien, nha tho + nghia dia, khu hoc gia, khu dan cu; du moi NPC / vat pham / loi ra; ban do nho moi; 189 bai kiem tra dat. So do: `Claude outputs/so_do_thanh_valoria_moi.png`.
- Tren ban do (kieu ve tay): cong trinh lon (`hall`) = day nha da mai ngoi + 2 thap; `spire` / `tower` = thap da mai ngoi; `castleWall` = tuong da bo ham nguc. Trang vao game giu tranh thanh cu (`src/assets/ui/landing_city.webp`).
- SU CO (da khac phuc): Claude xoa nham thu muc lam viec cua Codex khi phan viec chua luu; khoi phuc du 12 file tu kho git (`git fsck --lost-found`). Da ghi bai hoc vao bo nho.
- Codex het luot giua chung (tai khoan cu); nguoi choi doi tai khoan -> dang chay dot 2 cho Valoria: 70-90 nha nho thay 17 khoi lon, 250+ do dac, cho 10 sap, bo ke kenh.
- Quyet dinh cua nguoi choi ve cau truc Chuong (1 chuong = ca phan Toc nguoi, ~1 thang choi, lang + 4 ban do + mo + thanh + 3 ham nguc + ham nguc an; 6 loai nhiem vu + hang ngay + hang tuan): da ghi vao bo nho; dang cho nguoi choi chot 3 cau (ban do thu 4, ham nguc di lai hay chuoi tran, cach keo 1 thang).

---

## 12/11/2026 (toi 2) — HANG MO toi nhu dem, sang nho den dau, co doi bay va da roi

- Canh `mine` / `deepMine`: anh sang chung rat thap (`PAINT_PROFILE` + `hemi` / `ambient` theo canh trong `environment.js`); 5 ngon den dau la den diem that + quang sang + vung sang tren nen, lua chap chon; 7-16 giay mot dan doi 2-5 con bay ngang; 9-20 giay vai vien da roi tu tran, nay, boc bui (`paintMineLife` trong `src/world3d/paint.js`). Nhan vat va quai van sang ro (hinh khong an den).
- Da xem tan mat: canh toi, vach am quanh den, cua ham + den treo + duong ray. CHUA bat duoc luc doi bay / da roi trong anh chup.
- Dang cho: Codex dung bo do dac cho thanh (sap cho, dai phun nuoc, den duong, ghe, bon hoa, bien hieu, xe, thung, tuong, cau da / cau go...) de thanh Ashford chi tiet hon.
- Y nguoi choi (ghi lai): tuong + quai + NPC giu hinh 2D; MOI thu khac (sinh vat, do vat, song suoi, duong di, cau, thanh) deu phai la 3D dep.

---

## 12/11/2026 (toi) — NEN CHIEN DAU HANG MO dung tu bo mo hinh Codex tu dung

- Codex dung 10 mo hinh bang code (`tools/models/make_mine_kit.py`, ham dung chung `tools/models/meshkit.py`): 3 doan vach da (1 co mach quang, 1 co khung go), cua ham khung go (ben trong toi), xe goong, duong ray, khung chong treo den, cum pha le, hang nhu da, dong quang. 19.616 tam giac, 2,4 MB. Anh ghep canh: `Claude outputs/xem_truoc_hang_mo_codex.png`.
- Canh `mine` / `deepMine` dung lai tu bo nay (`PAINTED.mine` trong `src/core/battleScene3d.js`), bo vach nui khoi cu. Hang sau co them pha le + nam sang + suong.
- Da xem tan mat trong tran (`?scene=mine` -> Dau Tap): vach da, cua ham co den, xe goong cho pha le, thung go, duong ray — ra dang hang mo that. CHUA xem `deepMine`.
- Muon bien the moi (mau da khac, vach khac): chay lai script voi so khac, khong ton luot Codex.
- Commit ed9967b (da ghep). Ai lam: Codex (mo hinh) · Claude (xep canh, ghep, xem).

---

## 12/11/2026 (chieu muon) — THU CODEX DUNG MO HINH 3D: gieng lang trung co

- Codex (chay tren may nay, khong co Blender) dung mo hinh bang code Python: `tools/models/make_well.py` -> `src/assets/world3d/custom/well.glb` (5.328 tam giac, 640 KB, mau to theo dinh, khong can hinh dan). Co anh xem truoc: `Claude outputs/xem_truoc_gieng_codex.png`. Co san cac ham dung hinh (hop, tru, vong da, mai) de lam tiep mon khac.
- `BUILD.well` gio dung mo hinh nay (thay gieng khoi cu) o ban do va canh chien dau.
- Da xem: anh xem truoc (thanh da xep, cot go, truc quay, xo, mai ngoi — on). CHUA nhin thay cai gieng trong game (luc chup bi che); canh lang trong tran thi da xem, nha moi dep.
- Commit 502a6fc (da ghep vao main). Ai lam: Codex (mo hinh) · Claude (giao viec, ghep).

---

## 12/11/2026 (khuya 7) — TOOL THU thanh APP RIENG (tool.html), chia the theo chuc nang

- Nguoi choi muon: game la ung dung chinh, tool la ung dung ho tro dung rieng, chia theo chuc nang. Lam trang `tool.html` (`src/tool/main.js`, `src/tool/tool.css`): 6 the — Nhanh · Nhan vat (chon Ca doi / tung tuong) · Ban do & Ai (dich chuyen, nhay ai theo so, cap tai khoan) · Trong tran · Do & tien · Kich ban; co o tim lenh; dong trang thai "da noi voi game / dang o dau".
- Cach noi: app tool KHONG tu noi voi may chu, no gui lenh sang cua so GAME dang mo (cung trinh duyet) qua BroadcastChannel `loc-tool`; game chay bang dung bo may cua bang tool cu (`setupBridge` trong `src/ui/testHub.js`) -> hai noi luon cho cung ket qua, khong phai sua may chu.
- Nut but chi trong game: bam = mo app tool o cua so rieng; Shift + bam hoac phim ` = bang nhanh trong game nhu cu.
- Ban dong goi co ca 2 trang (`vite.config.mjs`: index.html + tool.html).
- Da bam thu that: mo game o 1 the, mo tool.html o the khac -> hien "Da noi voi game · Dang o ban do"; bam "Ca doi Lv60 SSS" trong app tool -> bao thanh cong; xem the Nhan vat, Ban do & Ai. CHUA thu: nut but chi mo cua so moi, cac the Trong tran / Do & tien / Kich ban, va dung khi game dang trong tran.
- Gioi han: game va tool phai mo trong CUNG mot trinh duyet tren cung may.

---

## 12/11/2026 (khuya 6) — TOOL THU gon lai: hang BAM NHANH, "Ca doi Lv60 SSS" bam 1 lan o bat cu dau

- Dau bang tool co hang 6 nut to: Ca doi Lv60 SSS · Nhan do cam Lv60 · Vang + Kim Cuong · Thang ngay · Du moi tuong · Choi lai tu dau (`QUICK` trong `src/ui/testHubCore.mjs`).
- "Ca doi Lv60 SSS" (lenh `maxTeam` trong `game/testTools.js`): du moi tuong + tat ca cap 60 bac SSS, dung o ban do, bang ai va giua tran (giua tran ap ngay len nhan vat dang danh), khong nhay man hinh.
- Chua go gi thi bang KHONG do ca ~270 lenh ra nua, chi con hang bam nhanh + vua dung + kich ban; muon lenh khac thi go vai chu.
- Sua 2 loi cu cua lenh "Ca doi cap N": vao bang Server test ma dang trong tran Cot truyen thi lenh bi bo qua; tuong chua tung dung thi khong duoc len cap.
- Da bam thu that: dung o ban do, bam "Ca doi Lv60 SSS" -> bao thanh cong, mo bang Nhan vat thay du 11 tuong Lv60 SSS, van o ban do. CHUA bam thu giua tran.
- 186 bai kiem tra dat.

---

## 12/11/2026 (khuya 5) — VAO GAME NHANH (khong cho tai het tranh) + nhe may ma khong giam hinh

- Truoc: mo game phai cho tai + day len card do hoa toan bo tranh nhan vat / hieu ung (~150 MB) roi moi vao duoc (30-40 giay o che do phat trien). Gio bam vao la vao ngay; tranh tai tiep o nen, co dong nho "dang tai" o goc duoi phai. `?waitLoad=1` = cho nhu cu. (`src/ui/landing.js`, `src/styles/index.css`)
- May chu (ban build, `npm start`): file trong `dist/assets` duoc trinh duyet giu 30 ngay -> lan sau mo khong phai tai lai tranh. (`server.js`)
- Nhe may, hinh khong doi: co / hoa / tan cay chia theo khoanh, khoanh ngoai man hinh khong phai ve; lop net co giam so lan lay mau (25 -> 9 moi goc). (`src/world3d/paint.js`)
- Da bam thu: mo trang, 3 giay sau bam Server test -> Cot truyen, khoang 9 giay la dung trong ban do (truoc ~35-40 giay). Chua do so khung hinh / giay truoc - sau.
- Luu y: neu vao tran trong vai giay dau, hinh nhan vat co the hien cham mot nhip vi tranh chua tai xong.
- 186 bai kiem tra dat. Ai lam: Claude.

---

## 12/11/2026 (khuya 4) — DUNG LAI canh lau dai / trong nha · quai chuong 2 het di nguoc · xem nhanh mot canh

- Nguoi choi gui anh ai 20 (dinh thap) che xau: toi xanh, tuong thap, cot den + co kieu khoi lan vao, khoi trang to o goc. Dung lai HAN 8 canh bang bo KayKit Dungeon + thap bo Village (`PAINTED` trong `src/core/battleScene3d.js`): dinh thap, sanh, thu vien (ai "So luong thuc"), ham mo, cong thanh, san lau dai, cau, tuong luy. Khong con mon nao cua bo khoi cu trong 8 canh nay.
- Mau nen / troi / den cua canh trong nha doi sang am (`PAINT_PROFILE` trong `environment.js`); nhu da + pha le chi con o hang mo.
- Loi tat xem nhanh: them `?scene=<ten>` vao dia chi (tower, hall, library, crypt, gate, castle, bridge, battlement, mine, village...) roi vao Dau Tap -> moi tran dung canh do.
- Quai chuong 2 di nguoc: tranh 10 con (c2cultist, c2guard, c2scout, c2shroom, c2spiritwolf, c2treant, c2wisp, malkor, thalor, hollow) ve quay trai, game quy uoc tranh quay phai. Da lat tranh bang `tools/flip_enemy_art.py` (co danh dau `flipped` de khong lat 2 lan).
- Da xem tan mat: dinh thap (tuong da cao, cua go lon, khien kiem, duoc — am han), cong thanh (tuong da + cong go lon, nen da lat). CHUA xem: sanh, thu vien, ham mo, san lau dai, cau, tuong luy, va quai chuong 2 trong tran sau khi lat.
- 186 bai kiem tra dat. Ai lam: Claude.

---

## 12/11/2026 (khuya 3) — NHA "CO NGUOI O" + ap bo mo hinh moi cho cac canh con lai va ban do

- Nha bo Lang Trung Co het ve hoang tan: canh cua go + khung cua, khung cua so co kinh + canh chop mo, day leo tren tuong, khoi bep, long nha toi am (khong con nhin xuyen qua cua so ra troi).
- `BUILD.house` (nha khoi cu) gio tu doi sang nha bo moi va co gian cho khit khung cu (`vhouseFit`) -> ap cho MOI nha dat tay: ban do (lang Ashford, kinh thanh...) va canh chien dau.
- Canh chien dau: tuong thanh -> tuong da bo ham nguc (`dwall`, moi huong); thap -> thap da mai ngoi (`vtower`).
- Da xem tan mat: lang Ashford tren ban do (nha khung go, mai ngoi that), tran ai 1 (nha co cua so, cua). CHUA xem: canh co tuong thanh / thap (cong thanh, lau dai, cau, tuong luy), ham mo, sanh, cac vung ban do khac.
- Biet con chua on: mai nha tren ban do kha to (che bot loi di, da co vung mo quanh nguoi); gieng cu o ai 1 dung sat nha giua.
- 186 bai kiem tra dat. Ai lam: Claude.

---

## 12/11/2026 (khuya 2) — BO MO HINH MOI cho canh chien dau: nha lang trung co + ham nguc (CC0)

- Tai 3 bo mien phi giay phep CC0 (dung thuong mai duoc, khong can ghi ten): Quaternius Medieval Village MegaKit, Quaternius Stylized Nature MegaKit, KayKit Dungeon Remastered. Dong goi 82 mo hinh (~8 MB) bang `tools/pack_kits.py` vao `src/assets/world3d/{village,qnature,dungeon}`; ghi nguon trong `src/assets/world3d/LICENSE.txt`.
- `BUILD.vhouse` (build.js): nha ghep tu mang tuong trat voi khung go / tuong da, cua vom, cua so vom, mai ngoi ong, dau hoi, ong khoi. Moi canh chien dau co day nha (lang, gieng lang, quang truong, cho) gio dung nha nay.
- `BUILD.dwall` + `dprops` (ham mo, sanh lau dai, mo): tuong da ham nguc co cua vom, song sat, tru da, duoc, co; thung ruou, ruong, da vun doc chan tuong.
- Da xem tan mat: tran ai 1 (nha moi: tuong voi, da op goc, cua so vom, mai ngoi). CHUA xem: tuong ham nguc o ham mo / sanh, do dac ham nguc trong mo, cac canh quang truong / cho.
- Chua lam: dung bo nay cho nha tren BAN DO (thanh Ashford) — moi ap cho canh chien dau.
- 186 bai kiem tra dat.

---

## 12/11/2026 (khuya) — TOOL THU: "Nhan do thu" nhan duoc ngay, khong can tai lai

- Loi: vao bang nut Server test roi bam "Nhan do thu" o ngoai tran thi may chu lang le bo qua (chi nhan khi dang nhap admin hoac dang trong Dau Tap). Da sua cong chan trong `server.js` (`gearDebugGive`).
- Nhan do / doi du lieu bang tool thu xong, may chu gui lai moi bang (tui trang bi, bang nhan vat, bang ai, ban do) qua `pushAllState` -> thay ngay. Bang ai khong tu bat len che man hinh dang dung (`quiet` trong `campaignState`).
- Da bam thu that: dung o ban do, mo tui do, bam "Nhan do thu" -> do hien ngay, van o ban do. 186 bai kiem tra dat.

---

## 12/11/2026 (đêm) — NGÀY / ĐÊM · HẦM NGỤC, HANG · NỀN + TRỜI CẢNH CHIẾN ĐẤU · HOA DẠI, HẠT BAY · ĐỒ ĐẠC PHỐ CỔ · THÊM THÚ NHỎ

- **Ngày / đêm trên bản đồ**: một ngày trong game = 24 phút thật (sáng, trưa, chiều vàng, hoàng hôn, đêm, rạng sáng). Ban đêm cảnh ngả xanh tối, đèn lồng có quầng sáng. Xem thử từng giờ: `?hour=noon | gold | sunset | night | dawn`, tắt: `?hour=off`. Code: `dayAt()` trong `src/world3d/view.js`, `setNight()` trong `build.js`.
- **Hầm ngục / hang trong trận** (mỏ, mỏ sâu, sảnh, thư viện, hầm mộ, tháp, phế tích, suối trăng): luồng sáng rọi chéo, bụi sáng lơ lửng, quầng lửa đuốc, nhũ đá, cụm pha lê phát sáng; nền không còn đen kịt (`paintDungeon` trong `paint.js`).
- **Cảnh chiến đấu ngoài trời**: nền sân vẽ bằng vệt cọ / đá lát / ván (`paintedGround` trong `environment.js`), nền trời chuyển màu + mây, hạt bay.
- **Hoa dại** mọc thành đám trong cỏ (trắng, vàng, hồng, tím); **hạt bồ công anh** bay quanh nhân vật.
- **Đồ đạc phố cổ**: thùng gỗ, thùng rượu, đèn lồng, bồn cây, xe kéo tự đặt ở các ô bị chặn sát đường (không chắn lối).
- **Thú nhỏ**: mỗi vùng thêm vài con cùng loài của vùng đó, rải ở ô cỏ.
- Đã xem tận mắt: ban đêm ở làng Ashford (có quầng đèn), hang mỏ ải 4 (pha lê, măng đá, quầng đuốc), làng ban ngày có hoa. CHƯA xem: nền trời + mây trong trận ngoài trời, nước, thông vẽ tay, đồ đạc phố cổ, thú thêm, đá lát ở kinh thành, 6 vùng khác, máy yếu.
- Chưa làm: soát từng vật cản đi xuyên được / vật không hợp thời; viền nét mực quanh nhân vật (của Painted Valley, chỉ hợp nhân vật 3D).
- 186 bài kiểm tra tự động đạt. Ai làm: Claude.

---

## 12/11/2026 (tối) — MỘT NÉT VẼ CHO MỌI LOẠI CÂY · CÂY TÁO · ĐÁ LÁT · NƯỚC · TÀI NGUYÊN THEO CỤM, 3 NGÀY HỒI LẠI

- **Cây**: mọi mô hình cây cũ (kể cả thông, cây trong cảnh chiến đấu, cây đặt tay trong làng) đều đổi sang cây vẽ tay; vẫn nhiều loại (tán tròn, thông xếp tầng, cây tối màu, cây lá vàng, cây táo) nhưng cùng một nét. Đổi ở một chỗ: `Batch.put` trong `src/world3d/build.js`.
- **Cây táo / cây sồi hái được** giờ là cây vẽ tay có quả đỏ (hình 2D cũ được ẩn); lác đác có thêm cây táo trang trí mọc lẫn trong rừng.
- **Đá lát kiểu phố cổ châu Âu** cho mọi mặt nền màu đá (viên so le, mạch vữa, mỗi viên một tông); đường đất có sỏi nhỏ.
- **Nước**: hai tông lam nông / sâu, vệt sáng trôi, lấp lánh, viền bọt sát bờ (`paintWater`). CHƯA xem tận mắt.
- **Đồ trang trí trên ô đi được**: bỏ bụi cây nhỏ / cây thấp trông như vật cản; đá trên đường ít hơn và nhỏ hơn.
- **Tài nguyên** (Codex làm): 25 -> 73 điểm hái, xếp theo cụm (vườn táo, mạch đồng, mạch sắt, vòng nấm, bụi quả mọng, luống rau thơm, đống củi...), hái xong 72 giờ thật mới mọc lại; save cũ không lỗi; câu cá giữ nguyên theo ngày. Bảng cụm: xem commit 2fd1379.
- Đã xem tận mắt: làng Ashford (cây táo, mái ngói), trận Đấu Tập ở đồng cỏ (cây, cỏ, nền xanh). CHƯA xem: thông vẽ tay, nước, đá lát ở kinh thành, các điểm tài nguyên mới, hầm ngục / hang.
- Còn nợ: thành Ashford thêm chi tiết (đồ đạc phố cổ), thú nhỏ, soát vật cản đi xuyên được + vật không hợp thời, hầm ngục / hang, nền + trời cảnh chiến đấu.
- 186 bài kiểm tra tự động đạt. Ai làm: Claude (đồ hoạ) · Codex (tài nguyên).

---

## 12/11/2026 (chiều) — ĐỒ HOẠ KIỂU "TRANH VẼ TAY" cho bản đồ + cảnh chiến đấu (BẬT sẵn, `?paint=0` xem kiểu cũ)

Học cách làm từ game mã mở Painted Valley của @blendi (mã MIT), viết lại cho game mình trong `src/world3d/paint.js`. Người chơi đã xem và khen đẹp.

- **Tán cây**: cây tự mọc thành tán nhiều cụm lá, phía nắng xanh vàng, phía khuất xanh lam, lá rung theo gió.
- **Cỏ**: ô cỏ mọc ngọn cỏ dày, gốc đậm ngọn sáng; trong trận cỏ nhỏ hơn và thưa ở giữa sân.
- **Nhà cửa**: mái có từng hàng ngói so le, tường gỗ có ván dọc, tường đá có hàng đá, có vệt ố cũ (vẽ bằng code trong `assets.js`, áp cho bộ nhà, lâu đài, nghĩa địa và các khối tự dựng như tháp, tường thành).
- **Màu**: gom về ít tông, chỗ khuất ngả lam. Lớp nét cọ phủ lên bản đồ, chừa nhân vật.
- **Mây**: vài đám mây trôi trên bản đồ (tự mờ khi tới gần nhân vật); cảnh chiến đấu ngoài trời có mây tích phía sau.
- **Vòng mờ quanh người**: bỏ viền sáng, giờ là vùng tròn mờ dịu, giữa còn 50%, ra mép tan dần.
- **Bảng ải / bảng việc hôm nay** đứng yên, không nhấp nhô nữa.
- Đã xem tận mắt: làng Ashford (khu cổng đông), trận ải 1. CHƯA xem: 6 vùng còn lại, các cảnh hầm ngục / hang mỏ / lâu đài trong trận, máy yếu có giật không.
- Còn nợ: làm đẹp riêng cho hầm ngục và hang; nền đất + bầu trời của cảnh chiến đấu; cây đặt tay trong làng.
- Ai làm: Claude.

---

## 12/11/2026 — THƯỞNG CHÍNH TUYẾN 3 MỨC · BÌNH EXP SIÊU LỚN · VÒNG TRÒN MỜ QUANH NGƯỜI · MỞ TỪNG TƯỚNG TRONG TOOL THỬ

- **Thưởng chính tuyến chia 3 mức** (thay cho "mỗi bước +20 Kim Cương"), số nằm ở `MAIN_TIERS` trong `game/questData1.js`:
  - Bước NHỎ (35 bước): 150 Vàng + 1 Bình EXP nhỏ. Không có Kim Cương.
  - Bước TRUNG BÌNH (8 bước, là bước cuối của ải 2, 5, 7, 8, 12, 14, 17, 18): 500 Vàng + 30 Kim Cương + 1 Bình EXP lớn.
  - Bước QUAN TRỌNG (3 bước, cuối ải 10 Skarn, ải 15 Morwen, ải 20 kết chương): 1.500 Vàng + 100 Kim Cương + 1 Bình EXP siêu lớn.
  - Cả chương: 540 Kim Cương từ chính tuyến (trước là 920), chưa kể 50 / 100 / 150 mỗi ải.
- **Bình EXP siêu lớn** (mới, màu tím): +25.000 EXP, chỉ có từ bước quan trọng, không bán. Bình nhỏ 500 và bình lớn 5.000 giữ nguyên. Dùng ở bảng Nhân vật.
- **Báo xong mới cộng**: Vàng và Kim Cương trên thanh đầu bản đồ chỉ nhảy số lúc dòng báo thưởng hiện lên (số nảy nhẹ). Dòng báo cách nhau 1,4 giây cho dễ đọc.
- **Vòng tròn quanh người**: vật che nhân vật giờ mờ 50% trong MỘT hình tròn gọn quanh người, có viền sáng mảnh (trước là vùng mờ loang). `?seeThrough=off` để tắt.
- **Tool thử**: gõ "mở tướng" ra lệnh mở TỪNG tướng (11 tướng), "cất tướng" để bỏ lại; "Có đủ mọi anh hùng" vẫn còn. Đã có tướng mà ải tặng nữa thì không có gì xảy ra (đã bấm thử với Jessica ở ải 2).
- Đã bấm thử thật: ải 1 + 2, về báo Bà Mira (dòng báo "+500 Vàng · +30 Kim Cương · +1 Bình EXP lớn", số cộng đúng lúc báo), mở Jessica + Lyra, vòng tròn ở làng Ashford và Ngoại ô. 183 bài kiểm tra tự động đạt.
- Chưa bấm thử: bước quan trọng (ải 10) và dùng Bình siêu lớn trên một tướng.
- Ai làm: Claude.

---

## 11/11/2026 — ĐỢT LỚN: BẢN ĐỒ SỐNG ĐỘNG · NHẢY · NHIỆM VỤ KIỂU MMO · SÂN ĐẤU 3D · LỜI THOẠI VIẾT LẠI · TOOL THỬ MỘT BẢNG

**Bản đồ thế giới**
- Sửa lỗi di chuyển cả 7 vùng (dịch chuyển không còn kẹt trong rừng, ra vào vùng về đúng chỗ, ra khỏi nhà đứng trước cửa). Công cụ soát: `node tools/world_audit.mjs` (Ngoại ô còn 2 ô lệch do 1 hàng rào).
- Thêm chi tiết cho 7 vùng (40–46 món mỗi vùng), chim bay, thú nhỏ, bóng cây, khói bếp, bóng mây. Vật che nhân vật được LÀM MỜ (không trong suốt). Xem bản cũ: `?mapDetail=old`, `?seeThrough=off`.
- NHẢY: lên xuống bậc, qua khe, đá nhảy, chạy đà nhảy xa; thanh thể lực 5 nấc; mỗi vùng 4–5 chỗ nhảy có rương 120 vàng.
- Nhân vật theo nhiệm vụ ẩn / hiện theo tiến độ (còn nhiệm vụ để giao thì ở lại).

**Nhiệm vụ chương 1 (kiểu MMO)**
- Chính tuyến 46 bước, mỗi bước +20 Kim Cương (save cũ không được trả bù). 15 nhiệm vụ phụ · 7 chuỗi nhánh (2 ải nhánh mới c1-n6 Rok, c1-n7 Jessica) · 10 nhiệm vụ ẩn (không dùng giờ thật) · việc hằng ngày 4 việc = đúng 100 Kim Cương, làm mới 05:00.
- Sổ nhiệm vụ (J) 5 thẻ; dấu ! / ? vàng (chính) · xanh (phụ) · tím (nhánh).
- Kim Cương mỗi ải lần đầu: 50 Cốt truyện · 100 Khó · 150 Địa ngục. Làm hết chương 1 khoảng 11.000 Kim Cương.
- Lời thoại nhiệm vụ mới là bản TẠM, chưa viết lại theo giọng đã duyệt. Hình vật phẩm nhiệm vụ còn tạm (mèo = thùng gỗ…).

**Trận đấu**
- Sân đấu 3D cho 23 cảnh, dựng bằng chính nhà / tháp / tường / sạp của bản đồ (`src/core/battleScene3d.js`). Xem nền vẽ cũ: `?bg3d=0`.
- Lớp chau chuốt động tác bằng code (thở, lấy đà, bật tới, khựng khi trúng, nhún khi chạy) cho 11 tướng + quái có bộ hình đầy đủ. So bản cũ: `?<tên>Anim=old`.
- Dọn hiệu ứng chồng nhau cho Rok / Jessica / Sera / Lyra (`?fxClean=0` xem bản cũ). Rok chiêu 3 bỏ vòm lục giác. Sera nhỏ lại 7%, Sera dạng S hết bị to hơn 12%.
- Nút AUTO 2 trạng thái: bật hết / tắt hết.
- Quái đánh xa ném vật bay tới (Goblin Ném Bom: quả bom bay rồi nổ) — CHƯA nhìn tận mắt trong ải.

**Truyện**
- Lời thoại chương 1 + 2 viết lại tự nhiên (391 câu): bỏ câu chốt, bỏ gạch ngang, mỗi người một giọng.
- 13 tranh minh hoạ truyện (Codex vẽ): tỉnh dậy ở miếu (bản tay nam + nữ), ải 1, 2, 5, 7, 8, 10, 12, 14, 15, 18, 20. Đặt ở `src/assets/story/`, tự hiện ở đoạn thoại trước ải. Tranh có nhân vật chính thì cần 2 bản `_m` / `_f`.

**Tranh quái (Flow)**: Chiến Binh Lửa đủ 40 khung · trùm Skarn đủ 5 tấm cơ bản (khung attack5 thiếu rìu, chưa có tấm kỹ năng) · Morwen mới có tấm đứng (đã tải về Downloads, chưa đóng gói). Tiến độ: `art/enemies/TIEN_DO.md`.

**Tool thử**: gom về MỘT bảng (phím `): ô gõ lệnh khoảng 270 lệnh, 5 kịch bản bấm một lần, nhớ công tắc, mục "Vừa dùng". Gỡ 3 bảng cũ. Test: màn đầu chỉ còn Cốt truyện + Test.

**Nấu ăn + khai thác (ghép 17:30, CHƯA ai bấm thử trong game)**
- Nấu ở bếp quán cô Lena + 3 lửa trại; 10 món; túi đồ ăn 3 món / trận, dùng cách nhau 8 giây (chỉ ải cốt truyện / nhánh / quái hoang); món tủ của Rok / Jessica / Sera / Lyra +50%.
- 27 điểm nhặt / hái / chặt / đào mọc lại 05:00 · 3 chỗ câu cá · 13 ghi chép (thẻ "Ghi chép") · 3 rương ẩn · câu nói của dân làng · Đồi Gió ở Rừng Sương (leo dây lên đỉnh).
- Dụng cụ cuốc / rìu / cần câu 3 bậc, rèn ở lò (bậc 2 cấp 8–10, bậc 3 cấp 14–16).
- Hình riêng cho vật phẩm; túi đồ chia Nguyên liệu / Món ăn / Dụng cụ / Vật phẩm nhiệm vụ.
- Mốc mở chức năng mới: tự động 3 · trang bị 5 · lò rèn 7 · nấu ăn 8 · quán 9 · Khó 10 · hầm đồ bộ 12 · hầm trang sức 15 · Địa ngục 18 · PVP 25 (sẽ đổi khi làm người gác cổng Arena cấp 10).
- Còn thiếu: hình 3D cho đồi, dây leo, lửa trại, phao câu (đang là hình phẳng / khối).

**Chờ làm**: các quyết định ở `demo/Y_TUONG_TAI_NGUYEN_VA_TRANG_BI.md` mục 11 (hộp trang bị chọn cấp, tài nguyên tộc để chế đồ hầm ngục, vật phẩm chọn dòng chỉ số 4 lần / tháng, người gác cổng Arena cấp 10, Guild cấp 20: 2 hội đối đầu + guild người chơi).

- Ai làm: Claude (trưởng nhóm, sân đấu 3D, động tác, ghép + thử) · Codex (lỗi di chuyển, nhảy, tranh truyện) · Antigravity (chi tiết bản đồ, chim thú, mờ vật che) · trợ lý Claude (lời thoại, nhiệm vụ, tool thử).
- 183 bài kiểm tra tự động đạt. Nhiều phần mới CHƯA được bấm thử hết — danh sách ở `TIEP_TUC.md`.

---

## 10/11/2026 (tối) — HIỆU ỨNG ĐIỂM ẢNH CHO CẢ 11 NHÂN VẬT + QUÁI · SỬA NỘ LỬA GOLEM · TEST CÓ ĐẤU PVP

- **Đánh thường có hiệu ứng ra đòn** cho mọi nhân vật và quái (vệt chém / cú đấm / vết cào / loé ở tay), màu theo nhân vật; quái lấy theo màu của nó.
- **Rok:** sư tử + khiên cũ giữ nguyên, thêm vệt chém, tia va chạm, vòm khiên lục giác vàng, nổ vàng khi khiên bùng.
- **Jessica:** vệt chém lưỡi liềm như Rok; sét chỉ có khi đang Tàng Hình; sửa hiệu ứng KN2 bị nhảy lung tung khi quay trái; tia sét ở ngang ngực.
- **Seraphine:** thiên thần bay tới -> hiệu ứng hồi máu; hồi sinh có cột sáng hồi sinh.
- **Lyra:** KN2 bỏ lốc gió, thay lông vũ bung; Mắt Ưng Gió tự vẽ (vòng ngắm trên đầu).
- **Ignar:** nổ lửa nhỏ / lớn, cột lửa, vòng lửa, tụ lửa ở tay lúc niệm.
- **Zerith, Brakk, Grix, Sylva:** thêm hiệu ứng điểm ảnh cho đòn đánh và các chiêu chính.
- **Nerissa:** đánh thường "Giọt Thủy Vũ" (tự vẽ); lúc múa có "Thủy Vũ Hoàn" (3 dải nước xoắn quanh người, tự vẽ) thay vòng dưới chân; giáp nước = khiên bong bóng màu nước.
- **Elarion:**
  - Thiên Thạch pixel (đá lăn giữ như cũ); đánh thường bỏ giật sét.
  - Băng Hoại Hỏa Thiên: bỏ vòng xoay ở tay, quả cầu tụ băng ngay lòng bàn tay.
  - Giáp Băng Sét: khiên bong bóng như Sera, màu xanh điện + sét chạy quanh.
  - Lốc Xoáy: lốc pixel bay tới mép bản đồ, vùng trúng rộng 1,8 -> 3,5 ô.
  - Hơi Nước: thêm mưa / sét Storm; Hỏa Lôi Cầu: Void Orb + Thunderclap; Tốc Lôi: Electrified; Lôi Xích: Zap trên từng mục tiêu; lướt lùi có Haste.
- **Golem:**
  - **Sửa lỗi Nộ Lửa:** lúc gọi Golem, server ghi phe của nó là số (1/-1) thay vì 'left'/'right' -> Golem lùi về phía địch rồi lao ngược về phía đồng đội. Giờ lùi về phía mình rồi lao đấm sang địch.
  - Vệt lửa cũ (ảnh bị xén ở đầu) thay bằng cầu lửa pixel; đánh thường = cú đấm nặng; phun băng = Frost breath bám đúng miệng + Blizzard, bỏ luồng phun cũ.
- **Test:** màn đầu chỉ còn Cốt truyện + Test. Bấm Test -> **Đấu Tập** (Test như cũ) hoặc **Đấu PVP** (Đấu với quái / tướng, luôn mở trong Test).
- **Tool thử:** thêm 3 nút "Golem — dùng kỹ năng ngay" (Nộ Lửa / Bão Tuyết / Hào Quang Sét).
- **Sửa lỗi nút Bất tử / Skill miễn phí / Quái bất tử** hiện ON mà không chạy: server tự tắt tool (vào ải, Đấu, server khởi động lại) nhưng nút không biết. Giờ nút tự khớp với server mỗi lần nhận trạng thái trận.
- Nguồn hiệu ứng: thư viện pixelfx của Patch (MIT) — chép đủ vào src/vendor/pixelfx/; hiệu ứng tự vẽ cùng phong cách ở src/vfx/pixelfx-custom/. Xem bản cũ: ?<tên>Fx=old (VD ?elarionFx=old, ?nerissaFx=old, ?swingFx=old).
- Đã thử: bấm thật trong trận Test cho từng nhân vật / phép; trang xem riêng tools/pixelfx-gallery.html?set=nerissa; 118 bài kiểm tra tự động đạt.

---

## 10/11/2026 (khuya) — HIỆU ỨNG ĐIỂM ẢNH CHO SERAPHINE (Divine Shield · Blessing)

- Khiên Ánh Sáng -> **Divine Shield**: bong bóng vàng kiểu điểm ảnh quanh đồng đội được che (viền sáng, kinh tuyến xoay, vệt bóng lướt), khiên vỡ thì mờ dần.
- Thánh Niệm -> **Blessing**: cột sáng vàng rủ xuống từng đồng đội, hạt sáng rơi và tắt đúng trên đầu / vai (dùng hình bóng thật của nhân vật).
- Nguồn: thư viện pixelfx của Patch (patch.gg/patch/pixel-effects, github.com/patch-gg/pixelfx), giấy phép MIT — mã gốc để nguyên ở src/vendor/pixelfx/ (kèm LICENSE).
- Kỹ thuật: src/vfx/pixelHoly.js (vẽ vào khung điểm ảnh -> 2 tấm sau / trước nhân vật, NearestFilter) · CutoutCharacterView._updatePixelHoly. So với bản cũ: ?seraFx=old.

---

## 10/11/2026 (đêm) — QUÁI CÓ BỘ HÌNH ĐỘNG ĐẦY ĐỦ NHƯ NHÂN VẬT (đợt 1: 4/22)

- Trước: mỗi quái chỉ 4 khung (đứng · đánh · 2 bước). Giờ quái được vẽ đủ như nhân vật: đứng + thủ thế, đánh thường 8 khung, chạy 8, trúng đòn + choáng, gục + ăn mừng (tranh Flow).
- Xong: Goblin Cướp, Goblin Ném Bom, Lính Valoria, Mật Thám. Chiến Binh Lửa dở (2/5 tấm). Còn 17 loại — xem art/enemies/TIEN_DO.md.
- Quái thường chỉ đánh thường; trùm giữ kỹ năng đang có (sẽ có tấm động tác riêng cho từng kỹ năng).
- Flow chặn khi tạo liên tục (~25 tấm) -> làm tiếp đợt sau.
- Kỹ thuật: tools/enemy_refs.py (hình mẫu) · art/enemies/prompts.py (câu lệnh) · tools/flow_mark_sheet.py (xoá dấu Flow trên tấm 1200x896) · tools/enemy_spec.py + tools/enemy_ingest.sh (đóng gói) · src/characters/sprite/enemySprites.js (fullSpriteOf: có enemyfull_<art> thì dùng) · tools/enemy-viewer.html (xem thử).

---

## 10/11/2026 (khuya) — VALDRIC NHẢY LÊN BỔ XUỐNG · NGƯỜI CHẾT Ở ĐÒN CUỐI NGÃ XUỐNG ĐÚNG

- Thánh Hỏa Phán Quyết: hết 5 giây niệm -> khiên tan, Valdric bật nhảy vút lên (vòng đỏ báo chỗ đáp giữa đội địch) rồi bổ kiếm xuống — chạm đất mới nổ + trừ máu, bổ xong nhảy về chỗ cũ. Lúc đang nhảy không phá khiên được nữa. Số liệu: game/judgment.js slamMs 900.
- Sửa lỗi: đòn cuối làm cả đội gục (nổ Phán Quyết, hoặc bất kỳ đòn nào kết thúc trận) -> trước đây máy chủ báo hết trận mà không gửi trạng thái cuối, nhân vật đứng im với thanh máu cũ. Giờ gửi trạng thái cuối trước (checkWinCondition) + nhân vật gục khi đang diễn dở động tác thì bỏ động tác để ngã xuống (CharacterView).
- Tool thử: bấm nút bất kỳ trong lúc đang đánh (Bất tử, Thắng/Thua ngay...) không còn bật bảng ải đè lên trận.
- Kỹ thuật: server.js (processJudgment phase 'leap', damageJudgmentShield, checkWinCondition, testTool), src/vfx/bossFx.js (leap / blast / cancel), src/characters/CutoutCharacterView.js (leapTo hold), src/characters/CharacterView.js, tests/judgment.test.js.

---

## 10/11/2026 (tối) — BẢNG THẮNG / THUA CHỜ 2 GIÂY

- Trận vừa kết thúc: màn hình trận đứng thêm 2 giây (thấy cảnh gục ngã / ăn mừng) rồi mới hiện bảng Thắng / Thua — cả Test, Cốt truyện, hầm ngục (bảng kết quả ải và lời thoại sau ải cũng chờ).
- Tool thử: "Thắng ngay / Thua ngay" không còn gửi lại bảng ải (trước đây bảng ải đè lên bảng kết quả).
- Kỹ thuật: src/ui/overlays.js (RESULT_DELAY_MS 2000, afterBattleEnd), src/ui/campaign.js (stageResult chờ afterBattleEnd), server.js (testTool battleWin/battleLose).

---

## 10/11/2026 — GIỚI HẠN 3 PHÚT · TUYỆT KỸ VALDRIC "THÁNH HỎA PHÁN QUYẾT" · HIỆU ỨNG TRÙM VẼ BẰNG FLOW · XOÁ DẤU MỜ FLOW

### 1. Mỗi ải tối đa 3 phút
- Cốt truyện, nhánh, hầm ngục, cỏ cao: đồng hồ ⏱ đếm ngược dưới tên ải (còn 30 giây chuyển đỏ, 10 giây nhấp nháy). Tạm dừng thì đồng hồ dừng.
- Hết giờ chưa thắng = thua, màn kết quả ghi "⏰ HẾT GIỜ!". Test / Đấu không giới hạn.

### 2. Valdric: chiêu khống chế + tuyệt kỹ
- **Cột Lửa**: đứng trong vòng đỏ lúc lửa phun -> choáng 1,5 giây. **Vòng Lửa Huy Hiệu** (cả 2 dạng): phong ấn kỹ năng 2 giây (vẫn đánh thường).
- Nhịp: chiêu – chiêu – Vòng Lửa (phong ấn) -> **Thánh Hỏa Phán Quyết**: Valdric niệm 5 giây trong khiên lửa (Cốt truyện 5%, Khó 20%, Địa ngục 25% máu tối đa).
  Khiên chặn hết sát thương; chiêu **choáng / hất / đẩy / túm** phá khiên ×3 + 5%. Phá kịp: Valdric choáng 2,5 giây + nhận thêm 25% sát thương 4 giây.
  Không kịp: nổ lửa thánh — cả đội mất 60% máu (Cốt truyện), 85% (Khó), **chết cả đội (Địa ngục)**.
- Trên màn hình: khung tên chiêu + thanh máu khiên + đếm ngược + gợi ý dùng chiêu choáng.
- Giả lập ải 20 (đội Lv19, bấm chiêu ngẫu nhiên): thắng 6/6 + 2/2.

### 3. Hiệu ứng kỹ năng trùm vẽ lại bằng Flow
- 9 tấm tranh Flow (nền đen) -> cắt + tách nền bằng tools/fx_grid_pack.py (art/boss/fx/make_specs.py): vết cào, tiếng hú, cuồng nộ, chém bóng tối, cột lửa, khiên đen, ấn nguyền, sao choáng, ổ khoá phong ấn, linh hồn, vòng cảnh báo, hố nứt, vòng lửa, vòng phép phán quyết, sóng xung kích, vết cháy, khiên lửa thánh (4 mức nứt), vụ nổ phán quyết, vỡ khiên, tia lửa trúng người.
- Bản vẽ bằng code bỏ (cất ở art/boss/fx/code_ve_cu).

### 4. Xoá dấu mờ (ngôi sao) của Flow
- tools/remove_flow_mark.py: lấy khuôn dấu từ tranh gốc rồi trừ ngược lớp trắng mờ + lấp viền — 20 tranh bản đồ / tranh nền cốt truyện, 125 tấm hình động nhân vật S/SS (đóng gói lại atlas). Bản gốc sao lưu ở .team/backup_flow_mark/.

### Kỹ thuật
- Codex: server.js (đồng hồ, tuyệt kỹ, khiên, phong ấn) + game/judgment.js (số liệu) + tests/judgment.test.js.
- Claude: src/vfx/bossFx.js (handleBossUlt, phát hiệu ứng Flow), src/ui/battleTimer.js + src/styles/battleTimer.css, src/ui/hud.js (biểu tượng Phong ấn / Vỡ khiên), màn kết quả hết giờ.
- 118 bài kiểm tra tự động.

---

## 09/11/2026 (khuya) — CẢNH NỀN TRẬN VẼ BẰNG CODE (thay khối 3D)
- Bạn chê bản khối 3D của Codex xấu → vẽ lại **23 cảnh bằng code** (`tools/battle_bg.py`, cách vẽ kiểu beanfx): mỗi nơi 3 lớp — **lớp xa** (trời, núi, rặng cây / thành phố / tường), **lớp gần** (bụi, đá, cột, chậu lửa — lệch nhẹ khi máy quay di chuyển nên có chiều sâu), **đất lặp** (rêu + cỏ + hoa + lá rụng, đá lát, ván gỗ).
- Chi tiết: viền sáng phía nắng + mép tối phía khuất, chùm lá sáng tối, nhà có ngói từng hàng / khung gỗ / ống khói có khói / hộp hoa, tường xây từng viên đá, mây có mặt sáng, chim bay, ánh đèn / lửa / trăng toả sáng.
- Cảnh: rừng thông, làng, cánh đồng lúa (cối xay gió), mỏ, mỏ sâu, trạm canh, đầm lầy, trại Goblin, quảng trường, giếng cổ, chợ, cầu đá, cổng thành, tường thành, phố kinh thành, thư viện, đại sảnh, đỉnh tháp đêm, hầm mộ, phế tích, rừng Elf (nấm phát sáng), thành trăng Lunaria, đường cái. Test / Đấu giữ bãi cỏ cũ.
- Nhẹ máy: mỗi cảnh chỉ 3 tấm tranh (2,8 MB cho cả 23 cảnh), nạp khi cần, giữ tối đa 2 cảnh trong card đồ hoạ.
- Vẽ lại / thêm cảnh: `uv run --no-project --with numpy --with pillow python tools/battle_bg.py [tên cảnh]`.

---

## 09/11/2026 (đêm) — BỎ HIỆU ỨNG PIXEL CỦA ROK · VALDRIC 2 DẠNG · VỀ BÁO LẠI NPC SAU TRẬN · CẮT CẢNH KẾT CHƯƠNG · CẢNH NỀN TRẬN THEO BẢN ĐỒ

### 1. Rok về hiệu ứng cũ
- Bỏ bản hiệu ứng pixel (sư tử pixel, atlas vẽ bằng code). File pixel cất ở `.team/rac_rok_pixel` (chưa xoá hẳn, muốn lấy lại thì báo).

### 2. Valdric 2 dạng
- Hạ Valdric lần đầu → huy hiệu nuốt lấy ông → **sống lại DẠNG 2**: đổi tranh bùng lửa, hồi 60% máu, +30% tấn công, +20% tốc đánh, 2,5 giây không nhận sát thương, có băng chữ "Huy Hiệu Bùng Cháy · Dạng 2". Hạ tiếp mới thắng.
- Giả lập: đội Lv19 thắng 6/6, đội Lv15 thua — vẫn hợp với cấp người chơi tới ải 20.

### 3. Lời thoại sau trận đúng chỗ — "về báo lại"
- Thắng ải: chỉ phần xảy ra **tại chỗ** phát ngay, cuối có dòng 📍 chỉ đường. Phần diễn ra ở nơi khác → NPC đó hiện dấu **!**, phải tới nói chuyện mới xem, rồi ải sau mới mở.
- Ải 1, 2, 10 → Bà Mira · ải 7 → Sera ở làng · ải 14 → Sơ Agnes dẫn vào gặp Elise · **ải 20 → về cung gặp Elise**.
- Save cũ: các ải đã qua coi như đã báo, không bị bắt quay lại.

### 4. Cắt cảnh kết chương 1
- Gặp Elise sau trận Valdric: màn hình chuyển hẳn sang **phòng bệnh nhà vua** (tranh mới — Elise ngồi bên giường nắm tay vua cha), tới đoạn Elise lên ngôi thì chuyển sang **đại sảnh ngai vàng**. Bấm Bỏ qua là bỏ cả cắt cảnh.

### 5. Cảnh nền trận theo bản đồ (Codex)
- 24 kiểu: làng, cánh đồng, rừng thông, mỏ, mỏ sâu, trạm canh, đầm lầy, trại Goblin, quảng trường, cầu đá (sàn ván + nước), chợ, cổng thành, thư viện, phố nhà cứu tế, đại sảnh (trong nhà), tường thành, đỉnh tháp ban đêm, giếng cổ, hầm mộ, rừng Elf phát sáng, thành trăng Lunaria, phế tích hầm ngục, đường cái; Test / Đấu giữ bãi cỏ cũ.
- Nhẹ: đổi cảnh ≤ 1,2 ms (đã dựng sẵn lúc rảnh), ≤ 13 lượt vẽ / cảnh, máy yếu tự giảm cây / nhà.

### Kỹ thuật
- `server.js`: `phase2.form2` + `enterSecondForm` (gọi đầu `killMember`), tách lời sau trận theo `WD.REPORTS` / `WD.postNow`.
- `game/world.js`: `REPORTS`, `pendingReport`, `storyNo`, `syncReports` (công cụ thử nhảy ải tự đánh dấu đã báo), dấu ! + mục tiêu nhiệm vụ.
- `src/ui/story.js`: `playCutscene`, `worldArt`; `src/ui/world.js` phát cắt cảnh. Tranh `src/assets/world/king_bedroom.webp` (Codex vẽ).
- `src/core/environment.js` + `src/core/battleThemes.js` (Codex), `src/main.js` đổi cảnh lúc vào trận.
- 111 bài kiểm tra tự động.

---

## 09/11/2026 (tối muộn) — TRANG VÀO GAME + TÀI KHOẢN + SERVER TEST VỚI BẢNG TOOL 🧪

### 1. Trang vào game
- Mở game là thấy ngay: bản đồ kinh thành trôi chậm, 5 anh hùng đứng dưới, tàn lửa bay, tia nắng; logo chữ vàng óng. Tranh vẫn tải ngầm (thanh % ngay trong khung).
- Đăng nhập / Tạo tài khoản. **Để trống cả 2 ô rồi bấm = vào luôn** bằng bản lưu của trình duyệt (như trước giờ).
- Nút **⚔️ Vào game** (server chính) và **🧪 Server test** (chỉ chủ game — tài khoản tạo ĐẦU TIÊN).
- Nhớ đăng nhập 30 ngày; có nút Đăng xuất. Mật khẩu được mã hoá, sai 5 lần khoá 1 phút.

### 2. Hai server, hai bản lưu riêng
- Mỗi tài khoản có bản lưu **Server chính** và bản lưu **Server test** riêng. Lần đầu vào, cả hai được chép từ bản lưu hiện có trên trình duyệt (không mất tiến trình cũ).
- Server chính: không còn ô Test, không còn Thử nhanh, máy chủ chặn mọi lệnh thử.

### 3. Bảng tool 🧪 (Server test) — nút nổi bên trái hoặc phím `
- **📖 Ải**: chọn chương, bấm số ải = nhảy tới ải đó và mở Bảng ải khoanh sẵn (nhảy lùi cũng được) · Mở hết chương (cả Khó, Địa ngục, nhánh) · Chơi lại từ đầu (bấm 2 lần). Ở Server test, Bảng ải hiện đủ mọi ải, vào đánh luôn không cần ra bản đồ.
- **🦸 Nhân vật**: cấp / bậc cả đội, mốc nhanh Lv1 · Lv40 S · Lv60 SS · Lv60 SSS, có đủ mọi anh hùng, chỉnh từng người.
- **🎒 Đồ & tiền**: +vàng / kim cương / đá, đầy thể lực, cấp tài khoản, vật phẩm, trang bị (bộ, món, cấp, độ hiếm), đủ chứng cứ.
- **⚔️ Trận**: Thắng ngay / Thua ngay (chạy đúng luồng thật: thưởng, lời thoại), Bất tử, kỹ năng không tốn mana, đầy mana.
- **🗺️ Bản đồ**: dịch chuyển tới mọi khu.

### Phân công
- Codex: máy chủ (tài khoản, 2 server, chặn lệnh thử ở server chính, các lệnh tool, 8 bài kiểm tra mới).
- Claude: trang vào game, bảng tool, sửa lỗi máy chủ sập khi ngắt kết nối (trùng tên biến với thư viện Socket.io).

### Kỹ thuật
- Mới: `game/accounts.js` (lưu `data/accounts.json`), `game/testTools.js`, `src/ui/landing.js` + `src/styles/landing.css`, `src/ui/testPanel.js` + `src/styles/testPanel.css`, tests `accounts*.test.js`, `testTools.test.js`.
- Sửa: `server.js` (authLogin/Register/Resume/Logout, `serverInfo`, `socket.lcServer`, `testCatalog` / `testTool`), `src/net/socket.js` (`enterServer`), `src/ui/loading.js` (`loadState`), `src/ui/campaign.js`, `src/main.js`.
- 102 bài kiểm tra tự động.

---

## 09/11/2026 (chiều) — ẢI CHỈ MỞ TỪ BẢN ĐỒ · HÌNH CHO MỌI ĐIỂM NHIỆM VỤ · SÓI & GOBLIN TRÊN BẢN ĐỒ · TAN PIXEL · HIỆU ỨNG KỸ NĂNG TRÙM · QUÁI CAO ĐÚNG TỈ LỆ

### 1. Ải chính chương 1 chỉ bắt đầu từ bản đồ
- Ải nào có người / chỗ cần gặp ngoài bản đồ thì **phải ra nói chuyện mới vào đánh được**. Bảng ải chỉ còn hiện **ải đã qua** (để đánh lại, đánh Khó / Địa ngục) + 1 thẻ **🗺️ Ngoài bản đồ** chỉ chỗ cần tới (bấm thẻ là ra bản đồ).
- Bỏ chữ "(hoặc mở Bảng ải)" ở nhiệm vụ chính. Chương 2 chưa có điểm truyện nên vẫn chọn ải như cũ.

### 2. Hình cho mọi điểm nhiệm vụ trên bản đồ
- Người thật đứng tại chỗ: **Sera bị 2 tên goblin canh ở đầm lầy (ải 7)**, **Grix** (ải 8, Codex vẽ mới), **bầy sói: Sói Đầu Đàn + 2 sói rừng** (ải 5, Codex vẽ mới), **3 tên côn đồ chặn Cầu Đá** (ải 11), dân la ở quảng trường (ải 13), lính gác nhà cứu tế (ải 17).
- Vật nhỏ vẽ bằng **Flow**: dải băng dính máu, khói, vết bánh xe, đống tro cắm tên, sổ tay, cửa kho lưu trữ, cầu thang tháp, áp phích truy nã (+ bụi sậy, dấu chân sói, thùng hàng, đuốc để dành).

### 3. ✨ Tan pixel
- Thắng xong, **quái / kẻ địch đứng trên bản đồ vỡ thành ô pixel bay lên rồi biến mất** (bầy sói, côn đồ, goblin canh Sera, nhóm phục kích ải 2). Sera, Grix, lính, dân thì không tan.
- Nhẹ: cả 6 con cùng tan chỉ tốn ~1,3 ms/khung hình.

### 4. Hiệu ứng kỹ năng trùm (Codex)
- 10 chiêu của 9 trùm có hiệu ứng riêng, đúng màu từng trùm (Hú Gọi Bầy có sóng âm, Vồ Cổ có vết cào, Đập Đất nứt đất, Khiên Đen có lồng khiên, Cột Lửa, Lời Nguyền, Hút Hồn…). Giới hạn ≤ 60 hạt / chiêu, tự dọn bộ nhớ.

### 5. Quái cao đúng tỉ lệ
- Trước đây mọi quái cao như nhau và thấp hơn nhân vật. Giờ: lính / mật thám / trùm người cao ngang anh hùng, goblin thấp hơn, sói thấp, cây cổ thụ cao nhất.

### 6. Thử nhanh
- Thêm nút **Nhảy tới Ải 5** (xem bầy sói) và **Ải 11** (côn đồ Cầu Đá).

### Kỹ thuật
- `game/world.js` `spotHints()` + `server.js` gửi `spots` cho Bảng ải; `src/ui/campaign.js` ẩn ải chưa qua có điểm truyện.
- `src/ui/world.js`: bộ vật thứ 2 `items2.webp` (`ITEM2_CELL`, `itemSrc`), vật dạng người `char` + `solo` / `group` ([dx, dy, char riêng]) + `foe` / `foeChars`, tan pixel (`snapObjects`, `dissolves`); `src/world3d/view.js`: shader tan pixel cho hình 3D.
- Ảnh mới: `src/assets/overworld/items2.webp`, `npc_grix`, `npc_wolf`, `npc_wolfboss`; công cụ `tools/items_pack.py`.
- `src/vfx/bossFx.js` + khối `bossFx` trong `src/combat/events.js` (Codex); `src/characters/sprite/enemySprites.js` (`ART_HEIGHT`).
- 94 bài kiểm tra tự động.

---

## 09/11/2026 (tối) — NHIỆM VỤ NGOÀI BẢN ĐỒ SONG SONG BẢNG ẢI · SỔ CHỨNG CỨ · ĐỐI CHẤT TRƯỚC NHÀ VUA
Bạn thấy game thiếu chiều sâu (toàn chọn ải ở bảng) → chọn hướng B: **song song** Bảng ải + làm nhiệm vụ với người / nơi ngoài bản đồ, kèm Sổ chứng cứ.
(Antigravity bị chặn quyền chạy lệnh ở chế độ chạy ngầm nên không làm được — Claude tự làm hết.)

### 1. Điểm truyện ngoài bản đồ (chương 1)
- Mỗi ải chính có 1 **điểm truyện**: gặp đúng người (Rok, bác Borin, Bà Mira, lính gác trạm, Sơ Agnes, lão Corvin, Elise) hoặc tới đúng chỗ (dải vải băng & dấu chân sói trong Rừng Sương, cột khói trạm canh, lối mòn vào đầm lầy, Cầu Đá, quảng trường kinh thành, kho lưu trữ, nhà cứu tế, tháp hiệu lệnh). Ải 2 vẫn là trận phục kích ngoài cánh đồng.
- Gặp xong → xem lời thoại → **mở Bảng ải như bình thường, ải đó được khoanh vàng sẵn** — bấm vào là chọn đội (không phát lại lời thoại), thắng xong quay lại bản đồ. Bảng ải vẫn dùng song song.
- Khung nhiệm vụ chính + 🧭 Tự đi tới chỉ thẳng tới điểm truyện của ải kế tiếp.

### 2. 🔎 Sổ chứng cứ (phím J → tab Chứng cứ)
- 17 chứng cứ: 13 nhận khi thắng ải (dây buộc công văn, số lô trên hòm, vòng cổ thánh huy, quân lệnh rút quân, bảng mục tiêu, thẻ môi giới, thư Morwen, lệnh tập kết, lời khai Daren, lịch gây rối, lệnh đốt hồ sơ, phiếu xuất linh kiện, lệnh điều chuyển lương) + **4 chứng cứ ẩn phải tự đi điều tra** (vết bánh xe trong Rừng Sương, đống tro trạm canh, phiến đá kho giam Skarn, áp phích ở kinh thành). Mỗi chứng cứ có lời bình của đồng đội; chưa tìm thấy thì hiện "???" + gợi ý.

### 3. ⚖️ Đối chất trước nhà vua (trước ải 18, gặp Elise)
- 4 câu hỏi, mỗi câu chọn 1 chứng cứ. Đúng càng nhiều → +10 Kim Cương + 500 Vàng mỗi câu (lần đầu) và lời đối chất khác nhau (4/4 Valdric hết đường chối). Sai vẫn đi tiếp truyện bình thường.

### 4. Sửa lỗi cũ
- **Không tới được lão Corvin** ở kinh thành (tấm "Trang sách bị xé" chắn lối hẹp duy nhất) → đã dời.
- Thêm bài kiểm tra: các vật trên bản đồ không được chặn đường tới người / đồ vật / lối ra.
- 🧪 Thử nhanh có thêm nút **Nhảy tới Ải 18** (kèm sẵn chứng cứ các ải đã qua) để thử phần đối chất.

### Kỹ thuật
- Mới: `game/evidence.js` (chứng cứ, câu hỏi, chấm điểm), `src/world/mapsExtra.js` (vị trí điểm truyện + vật điều tra + dời vật chắn lối), `src/ui/evidence.js` + `src/styles/evidence.css` (khung đối chất).
- Sửa: `game/world.js` (`STORY_SPOTS`, `CLUES`, `nextStoryNo`, `presentTrial`), `server.js` (nhận chứng cứ khi thắng ải, socket `worldPresent`), `src/ui/world.js`, `src/ui/campaign.js` (mở Bảng ải đúng ải), `src/ui/questLog.js` (tab Chứng cứ).
- 94 bài kiểm tra tự động.

---

## 09/11/2026 (chiều muộn) — LỜI THOẠI CHƯƠNG 1 TỰ NHIÊN HƠN · ẢI 1–10 NHẸ MỘT NỬA
- **Lời thoại chương 1 viết lại cho tự nhiên, rõ cá tính** (mạch truyện giữ nguyên): Rok ít lời, chắc nịch, đùa mặt lạnh · Jessica lém, mỉa, né chuyện mình · Sera dịu mà cứng đầu · Lyra kiêu, lạnh, xưng "ta" · Grix chua chát · nhân vật chính thật thà, hay tự giễu vụ mất trí nhớ. Sera hiện là "Nữ tu" cho tới khi tự giới thiệu ở ải 7.
- Đọc toàn bộ lời thoại trong game: **`docs/LOI_THOAI_CHUONG_1_TRONG_GAME.md`** (xuất lại bằng `node tools/export_story.js` mỗi khi sửa `game/story.js`).
- **Ải 1–10 chương 1 (mức Cốt truyện): sức quái giảm một nửa** (`HALF` trong `game/chapter1.js`).

---

## 09/11/2026 (chiều) — CỐT TRUYỆN CHƯƠNG 1 MỚI "NGỌN LỬA DƯỚI THÁNH HUY" · CẤP TÀI KHOẢN · PHẦN THƯỞNG MỚI · CÂN BẰNG 3 ĐỘ KHÓ
Bạn gửi bản cốt truyện chương 1 hoàn chỉnh (`docs/CHUONG_1_NGON_LUA_DUOI_THANH_HUY.md`) + yêu cầu cấp tài khoản, phần thưởng, cân độ khó.
Chia việc: **Claude** đưa cốt truyện vào game + cân bằng (giả lập hàng trăm trận) · **Codex** làm cấp tài khoản + phần thưởng (Codex hết lượt giữa chừng → Claude tự làm phần cân bằng).

### 1. Cốt truyện chương 1 mới
- **Mở đầu là giấc mơ** (không còn trận "Đấu Thần") → tỉnh dậy ở ngôi miếu đổ, Rok đưa nước. Cách bấm kỹ năng dạy ở ải 1 (cảnh báo Rok tên bắn nỏ).
- **Sera chỉ vào đội khi được cứu — ở ải 7** (theo yêu cầu): ải 2 tìm thấy túi thuốc của Sera → ải 3–6 cả nhóm (Rok + Jessica) lần theo dấu Sera và lần ra âm mưu (Rừng Sương, mỏ đá + hòm có số, Sói Đầu Đàn đeo vòng thánh huy Varkos, trạm canh bị bỏ lại) → **ải 7 giải cứu Sera** ở trại giam đầm lầy → ải 8 gặp Grix (Sera chữa tay cho cậu) rồi vào kho hàng.
- Ải 9–20 + kết chương theo đúng bản của bạn (Jessica thú nhận, Skarn, Cầu Đá, Daren + Lyra, Elise ở kho cứu tế, Morwen, sổ lương, nhà cứu tế bị vây, đại sảnh, tháp hiệu lệnh, Varkos hiện ra, cổ vật đầu tiên, nhà vua qua đời, nữ vương Elise).
- **5 nhánh có lời thoại** (truyện phụ): Giếng Cổ (sau ải 7), Mỏ Sâu (Mae + búa Borin), Bữa Ăn Còn Đủ Chỗ (sau ải 10), Trang Sách (sau ải 20), Hầm Mộ (sau ải 20).
- Tên chương: **Ngọn Lửa Dưới Thánh Huy**; tên 20 ải theo các chặng. Lời NPC trên bản đồ đổi theo tiến trình (Bà Mira, Rok, Jessica, Elise, Corvin…). Sera ẩn khỏi làng tới khi được cứu; việc "Thuốc cho nhà cứu tế" của Sera mở sau ải 7.

### 2. Cấp tài khoản (Codex)
- Thanh **Cấp tài khoản** ở màn chọn ải + màn kết quả. Mọi trận thắng (ải, nhánh, hầm ngục) và việc phụ đều cho EXP tài khoản.
- Mở chức năng theo cấp: 3 AUTO · 6 Trang bị · 10 Lò rèn + **Khó** · 12 Quán ăn · 15 Hầm ngục đồ bộ · 18 Hầm ngục trang sức · 20 **Địa ngục** · 25 **Đấu (PvP)**. Bảng trong `game/account.js` (`UNLOCKS`). Hết chương 1 ≈ cấp 18–20, hết chương 2 ≈ cấp 34–35.
- Hồ sơ cũ được tính bù EXP tài khoản theo các ải đã qua — không mất chức năng đã mở.

### 3. Phần thưởng ải (Codex)
- Mỗi trận thắng: EXP tướng, Vàng, Đá cường hoá, **EXP tài khoản**; **Kim Cương chỉ lần đầu vượt ải**.
- Rơi thêm: **Bình EXP nhỏ** (20–65%, ải càng sau càng dễ rơi), **Bình EXP lớn** (chắc chắn 1 khi lần đầu thắng ải trùm), **Đá tinh luyện** (từ ải cấp 10).
- **Bùa may mắn không rơi**, chỉ mua ở cửa hàng — **mỗi tháng 1 lần** (giá bạn quyết sau).

### 4. Cân bằng độ khó (giả lập)
- Mọi anh hùng bắt đầu cấp 1 (cấp 60 chỉ ở Test / Đấu). EXP tướng mỗi ải = 160 + 60×cấp + cấp² → cấp đội bám cấp ải: hết chương 1 ≈ 21, hết chương 2 ≈ 40 (tính cả bình EXP).
- **Cốt truyện**: ải 1–2 nhẹ (chỉ Rok / Rok + Jessica), ải 3–6 cân cho 2 người. Trùm: ải 5 ×0,78 · 10 ×1,22 · 15 ×1,12 · 20 ×0,78 (giả lập thắng 4–6/6). Chương 2 vốn quá dễ (thắng 100% trong 15 giây) → sức nền ×1,4 (ải thường), ×1,6 (trùm), ải 10 + 20 ×1,45.
- **Khó** = cân cho đội **SS** (muốn lên SS phải cấp 40): quái cấp 39–49 (chương 1), 50–60 (chương 2). Đội S (cấp tối đa 40) vẫn đánh được nhưng thua nhiều.
- **Địa ngục** = cân cho đội **SSS cấp 60**: quái luôn cấp 60, mạnh dần theo ải.

### 5. 🧪 Thử nhanh (cho người thử game)
- Ở **màn chọn chế độ** có dải **🧪 Thử nhanh**: đặt **cấp tài khoản** (1 / 10 / 20 / 25 / 60 — mở Khó, Địa ngục, Đấu…), **nhảy tới** ải 1 / 7 / 12 / 20 / chương 2 ải 1 / 20 (cả đội lên cấp hợp lý, cấp tài khoản tự tính lại), **🔄 Chơi lại từ đầu** (bấm 2 lần — xoá tiến trình hồ sơ đang dùng, chơi lại từ giấc mơ + tạo nhân vật).
- Bảng **Tool phe mình** trong màn Test cũng có 2 mục này. Chỉ dùng được ở màn chọn chế độ / màn Test, không dùng được khi đang đánh ải.

### Kỹ thuật
- Mới: `game/account.js`, `src/styles/account.css`, `tests/account.test.js`, `tests/shop-limits.test.js`, `docs/CHUONG_1_NGON_LUA_DUOI_THANH_HUY.md`.
- Sửa: `game/story.js` (viết lại chương 1 + `branch` lời nhánh), `game/chapter1.js` / `chapter2.js` (tên ải, Sera ải 7, `power` / `base`), `game/world.js` (Sera, việc, NPC, EXP tài khoản việc phụ, đe rèn theo cấp), `game/campaign.js` (`enemyLevel`, `enemyMul`, thưởng), `server.js`, `src/ui/world.js` (bỏ trận mở màn), `src/ui/campaign.js` (thanh cấp tài khoản, cấp quái Khó / Địa ngục), `tools/sim_stage.js` (`--rank`, `--port`, Khó / Địa ngục tự mở).
- 92 bài kiểm tra tự động.

---

## 09/11/2026 — SỬA LỖI & CHAU CHUỐT CHƯƠNG 1–2 · TÀI LIỆU CỐT TRUYỆN ĐỂ SỬA
Bạn muốn chau chuốt chương 1 và 2 cho chuẩn trước khi làm chương 3. Claude chơi thử lại từ đầu (nhân vật Nữ, tên "Mai"), chạy giả lập 40 ải, sửa lỗi; một trợ lý đọc toàn bộ lời thoại + nhiệm vụ trong game viết thành tài liệu.

### 1. Tài liệu cốt truyện — `docs/COT_TRUYEN_HIEN_TAI.md`
- Thế giới, nhân vật, từng ải chương 1 và 2 (lời trước / sau trận), bản đồ, việc phụ, câu đố, kết chương, và **48 chỗ nên chau chuốt** (mục 7). Bạn sửa thẳng vào file này hoặc ghi chú, Claude đưa vào game và giữ file luôn khớp với game.

### 2. Lỗi đã sửa
- **Lời thoại trước ải** hiện đè lên cảnh trận cũ còn đứng hình (vd trước Ải 1 vẫn thấy trận "Đấu Thần") → giờ có tranh nền đúng nơi (làng, cánh đồng, rừng, mỏ, cầu, kinh thành, rừng Elf, Lunaria). Đoạn mở đầu "Rất lâu về trước…" có nền tối riêng, không lộ màn Test phía sau.
- **Chân dung anh hùng** trong khung thoại, màn chọn đội, bảng Nhân vật, quán ăn / cửa hàng giờ **đúng bậc S / SS** (trước đây luôn là tranh SSS giáp vàng dù ngoài trận đang mặc áo vải). Theo cả trang phục bạn chọn.
- **Màn chọn đội / chọn chế độ**: ẩn hẳn bảng chỉ số và nút của màn Test còn sót phía sau.
- **Ải 5 (Sói Đầu Đàn) quá khó**: giả lập thua 12/12 ở cấp 5–6 → giảm sức ải 5 còn 80% + 2 chiêu của trùm nhẹ hơn (gọi 1 sói con thay vì 2, Vồ Cổ yếu hơn). Giờ thắng ~2/3 — vẫn là trận trùm có thử thách.
- Vào **Ải 2 / Ải 3 từ sự kiện trên bản đồ** bị mất câu hướng dẫn (Orb, AUTO) → đã thêm. Jessica nói "Năm đánh hai?" trong khi chỉ có 3 Goblin → "Ba đánh hai?".
- **Nerissa** vào đội không có thông báo như những người khác → đã thêm "Nerissa gia nhập đội!".
- **Seraphine** biến khỏi làng sau khi vào đội (Rok, Jessica vẫn đứng đó) → giờ vẫn đứng ở làng như mọi người.
- **Thành Lunaria** vào được ngay từ đầu chương 2 dù truyện nói cổng đóng → giờ mở sau ải 12 chương 2 (qua Cầu Rễ), báo "mở khi qua ải 12 chương 2".
- **Sổ nhiệm vụ chương 2** bắt quay về kinh thành để chọn ải trong khi đang ở rừng → giờ hướng dẫn bấm 📖 Chọn ải ở thanh dưới. Sửa "Sứ giả Varkos" → "sứ giả Varkos" (người đó là Malkor, sứ giả *của* Varkos).
- **Búa bác Borin**: lời thoại nói "gần mỏ đá" nhưng búa nằm ở góc ruộng tây nam → sửa lời cho khớp. Borin không còn mời "ghé lò rèn bất cứ lúc nào" khi lò rèn chưa mở (Trang bị mở ở ải 6, cường hoá ở ải 10).

### Kỹ thuật
- `src/ui/story.js` (`stageBackdrop`, `playStory(..., { bg })`), `src/characters/sprite/tiers.js` (`setHeroRanks`, `tierPortrait`), `src/ui/squadSelect.js`, `heroPanel.js`, `extras.js`, `campaign.js`, `world.js`, `src/styles/index.css`, `game/world.js` (`sceneNeedText`, cảnh có `needStage`), `game/chapter1.js` (ải 5 `power: 0.8`), `server.js` (`BOSS_SKILLS.b_wolf`), `game/story2.js`.
- `src/main.js`: vòng vẽ trận chạy bằng hẹn giờ khi có `?tick` (chỉ để Claude chạy thử lúc khung xem bị ẩn).
- 82 bài kiểm tra tự động (thêm bài Lunaria mở đúng lúc; bài kỹ năng trùm đọc số từ bảng `BOSS_SKILLS`).

---

## 08/11/2026 (chiều tối) — CHƯƠNG 2 VÙNG ELF · GIAO DIỆN BẢN ĐỒ MỚI (bản đồ nhỏ, Nhân vật, Túi đồ, Cửa hàng, Cài đặt) · TRANH TRANG PHỤC S/SS CHO ĐỦ 11 ANH HÙNG · CỎ CAO GẶP QUÁI · VÀO ĐƯỢC TRONG NHÀ
Bạn ra ngoài, Claude làm tiếp (có lúc mất điện, làm lại phần dở). Tranh vẽ bằng **Codex** (không lỗi tấm nào): 90 tấm trang phục, 11 quái/trùm chương 2, 2 bản đồ, 7 NPC, 3 căn phòng, 32 icon. Máy không có `agy` → Claude tự viết giao diện.

### 1. Giao diện khi đi ngoài bản đồ
- **Bản đồ thu nhỏ** góc phải trên: chấm đỏ = bạn (mũi tên chỉ hướng), chấm vàng = NPC có việc / cửa nhà, chấm xanh = lối ra, vòng vàng nhấp nháy = mục tiêu nhiệm vụ. Bấm vào = mở bản đồ lớn.
- **Thanh chức năng** dưới màn hình (icon vẽ AI): 📖 Chọn ải · 🧑 Nhân vật (**C**) · 🎒 Túi đồ (**I**) · ⚒️ Rèn · 🏪 Cửa hàng · 🏰 Hầm ngục · 📜 Nhiệm vụ (**J**) · 🧭 Bản đồ (**M**) · ⚙️ Cài đặt (**Esc**). Trên điện thoại thanh nằm dưới thanh trên cùng, vuốt ngang được.
- **🧑 Nhân vật**: danh sách anh hùng bên trái + 4 thẻ:
  - **Chỉ số**: đủ 14 chỉ số, số xanh = phần cộng từ trang bị.
  - **Kỹ năng**: 3 chiêu có icon, mô tả tiếng Việt, tốn bao nhiêu Orb, hồi bao lâu + thiên phú (mở ở cấp nào).
  - **Trang bị**: 6 ô đồ có icon, hiệu ứng bộ 2/4 món, nút mở Mặc đồ / Lò rèn.
  - **Trang phục (skin)**: xem trước tranh bậc S / SS / SSS; bậc đã đạt thì bấm để mặc (đổi hình trong trận, không đổi chỉ số), hoặc để "Tự động theo bậc".
  - Dùng **Bình EXP** ngay trên thẻ nhân vật.
- **🎒 Túi đồ** chia 4 phần, món nào cũng có ảnh: 💰 Tài nguyên (Vàng, Kim Cương, Đá Cường Hoá, Thể lực) · 🧪 Nguyên liệu (Đá Tinh Luyện, Bùa May Mắn, Bình EXP, Đá Đột Phá) · 📜 Vật phẩm nhiệm vụ · 🛡️ Trang bị.
- **🏪 Cửa hàng**: Bình EXP nhỏ (300 Vàng) / lớn (30 KC), Bùa May Mắn (50 KC), Đá Tinh Luyện ×5, Đá Cường Hoá ×10 + lối sang Cửa hàng anh hùng, Quán ăn.
- **⚙️ Cài đặt**: đồ hoạ bản đồ, bật/tắt gặp quái ở cỏ cao, **tốc độ chữ hội thoại** (chữ giờ hiện dần như game, bấm 1 lần để hiện hết câu).

### 2. Cỏ cao gặp quái (kiểu Pokémon)
- Đi trên **ruộng lúa Ngoại ô, bãi cỏ Rừng Sương, cỏ ven Đường Vương Đạo**: mỗi bước có khả năng gặp quái (chớp sọc + dấu ❗ rồi vào trận ngay với đội lần trước). Không tốn thể lực, thắng được Vàng + EXP (đôi khi Đá Cường Hoá). Mở sau ải 1, tắt được trong ⚙️.
- Quái yếu hơn khi đi ít người (1 người ×0,45 · 2 người ×0,6 · đủ đội ×0,75). Giả lập: thắng 3/3 ở mọi mốc.

### 3. Vào được trong nhà (làng Ashford)
- Đi vào **cửa**: 🍺 **Quán cô Lena** (anh hát rong Finn, Lão Hank, rương; bấm **quầy** = mở Quán ăn) · ⚒️ **Lò rèn bác Borin** (thợ học việc Mae, rương; bấm **đe** = mở Trang bị / Lò rèn) · 🏠 **Nhà Bà Mira** (bé Ella, giá sách kể về Thất Thánh, rương).
- Trong nhà luôn vẽ tranh kiểu Pokémon (phòng Codex vẽ), kể cả khi đang chơi bản đồ 3D.

### 4. CHƯƠNG 2 — TIẾNG GỌI RỪNG THIÊNG (vùng Elf, mở sau ải 20 chương 1)
- Màn chọn ải có **thanh chọn chương** (Chương 1 / Chương 2). 20 ải (quái cấp 21–40) + 4 nhánh ẩn, 3 phần: Bìa rừng Sylvaren · Cầu Rễ Cổ · Thành cây Lunaria.
- **Truyện**: Elise nhờ đội sang vùng Elf tìm em gái Lyra. Lời thoại trước / sau cả 20 ải + kết chương (gợi mở chương 3 — tộc Rồng).
- **Gia nhập theo truyện**: **Nerissa** (ải 7 — em gái Lyra, giải cứu khỏi trại săn trộm) · **Sylva** (ải 12 — người giữ Cầu Rễ) · **Elarion** (ải 18 — học giả tháp chiêm tinh). Đều đi cùng (khách) trong ải rồi mới vào đội.
- **Quái mới** (tranh 4 dáng: đứng · đánh · 2 bước đi): Elf Tuần Biên, Mầm Rễ Mục, Ma Trơi Tím, Sói Linh Hồn, Nấm Độc, Vệ Binh Ánh Trăng, Tín Đồ Varkos.
- **4 trùm**, mỗi trùm 2 chiêu có cảnh báo + giai đoạn 2: **Treant Già Mục Rỗng** (ải 5: Rễ Trồi Lên, Gọi Mầm Rễ) · **Vexa** (ải 10: Mũi Tên Bóng Đêm, Mưa Tên Đen) · **Thalor** (ải 15: Cột Sáng Trăng, Màn Chắn Ánh Trăng) · **Sứ giả Malkor** (ải 20: Phán Xét, Vòng Thánh Quang).
- **Bản đồ vùng Elf** (2D + 3D): đi qua **cổng phía đông kinh thành** → Bìa rừng Sylvaren → Thành cây Lunaria. NPC: Đội trưởng Aeris, Trưởng lão Oren, thương nhân Lirien, bé Tavi, bé Mio, vệ binh.
- **4 nhánh ẩn mở bằng việc ngoài bản đồ**: Suối Trăng (xoay 4 pha trăng từ non tới tròn → N1) · việc của Aeris tìm Nấm phát quang (→ N2) · việc của Oren tìm Sách sao cổ (→ N3) · Đài phun trăng sau ải 19 (→ N4 Gốc Cây Mẹ, có trùm). Sổ nhiệm vụ tự chuyển sang chương 2.
- **Cân bằng (giả lập, đội 4 người AUTO ở cấp ~ cấp ải)**: ải 1, 5, 7, 10, 15, 20 đều thắng 2/2.

### 5. Tranh trang phục bậc S / SS — đủ 11 anh hùng
- Vẽ thêm Lyra, Nerissa, Elarion, Grix, Sylva (S và SS) + vẽ lại các tấm hỏng (Jessica, Ignar ngã / thắng; Zerith bay; Lyra bắn cung). 22 bộ tranh đã đóng gói, khung hình khớp 100% với bản SSS.

### 6. Máy chậm / trình duyệt không dùng card đồ hoạ
- Chrome trên máy này đang vẽ bằng **phần mềm** ("Microsoft Basic Render Driver") nên giật. Game giờ tự nhận ra: dùng bản đồ phẳng 2D, trận đấu vẽ ít điểm ảnh hơn, màn tải bỏ bước đẩy tranh lên card (trước kẹt ~78% vài phút, giờ ~14 giây) và hiện thông báo cách bật "Tăng tốc phần cứng".
- 👉 **Bạn nên**: tắt hẳn Chrome rồi mở lại; nếu vẫn giật: Cài đặt Chrome → Hệ thống → bật "Sử dụng tính năng tăng tốc đồ hoạ khi có" → Khởi chạy lại.

### Đã thử bằng chuột / phím thật (Chrome, người chơi thử)
Mở bản đồ → thanh chức năng + bản đồ nhỏ hiện đúng · phím **C** mở Nhân vật → thẻ Chỉ số / Kỹ năng (3 icon + mô tả) / Trang phục (mặc bậc S → "Đã đổi trang phục Rok sang bậc S", SS/SSS khoá có tranh xem trước) · Cửa hàng mua Bình EXP (5.500 → 5.200 Vàng) → Túi đồ / Nguyên liệu thấy bình có ảnh · màn chọn ải: thanh Chương 1 / Chương 2 → ải 1 chương 2: lời thoại (chữ hiện dần, chân dung Aeris) → vào trận, quái Elf mới hiện đúng, đội mặc trang phục bậc S. **81 bài kiểm tra tự động** đạt (thêm: quái hoang, chương 2, trùm chương 2).

### Còn lại / chưa thử bằng tay
- Chưa đi bộ thử trong 3 căn nhà và 2 bản đồ vùng Elf bằng chuột (đã có kiểm tra tự động: lối ra, ô đứng của NPC / đồ vật, việc / câu đố). Lưới đi được của 2 bản đồ Elf vẽ tay theo tranh — có thể còn vài ô lệch, sửa trong `tools/build_maps.py`.
- Chưa thử trận đánh có Nerissa / Sylva / Elarion làm khách (logic giống Jessica / Seraphine chương 1, đã có kiểm tra).
- Nhạc nền (để sau theo ý bạn). Chương 3 (tộc Rồng).
- Cảnh báo nhỏ `computeBoundingSphere NaN` trong console: không phải do bản đồ 3D (đã dựng thử cả 5 bản đồ, không có toạ độ lỗi) — có thể từ một hiệu ứng trận đấu, chưa tìm ra.
- Đã xoá 15 người chơi thử trong `data/progress.json`, giữ 4 save của bạn.

---

## 08/11/2026 — CẬP NHẬT MÁY NHÀ + KIỂM TRA LẠI
- Kéo bản mới từ GitHub về máy này (bản 07/11 trưa: kỹ năng trùm, trận đấu trên điện thoại, bản đồ 3D tự giảm đồ hoạ, tranh theo bậc). `npm install` xong, **71 bài kiểm tra đạt**, bản build không lỗi.
- Chạy thử trên máy này với người chơi mới: chọn nhân vật → trận mở màn → tỉnh dậy trên **bản đồ 3D Ngoại ô** (khung theo dõi nhiệm vụ "Chính tuyến · Ải 1" hiện đúng). Đã xoá người chơi thử; giữ nguyên save của bạn.
- Thấy 1 lỗi nhỏ trong console khi vào bản đồ 3D (`BufferGeometry.computeBoundingSphere(): radius is NaN`) — không thấy sai hình, ghi vào việc cần làm.
- Cập nhật `TIEP_TUC.md` + lộ trình: bỏ 2 việc đã xong (kỹ năng trùm, trận trên điện thoại), thêm việc còn lại của tranh bậc S / SS.

---

## 07/11/2026 (trưa) — KỸ NĂNG TRÙM · TRẬN ĐẤU TRÊN ĐIỆN THOẠI · CHỐNG GIẬT BẢN ĐỒ · CHUẨN BỊ TRANH THEO BẬC S / SS / SSS
Chia việc: **Codex** làm kỹ năng trùm · **Antigravity** làm giao diện trận đấu cho điện thoại · **Claude** chống giật bản đồ, khung tranh theo bậc, vẽ tranh trên Google Flow, kiểm tra + gắn vào game.

### 1. Mỗi trùm chương 1 có 2 chiêu riêng (có cảnh báo trước)
- **Sói Đầu Đàn**: Hú Gọi Bầy (gọi thêm sói con, tối đa 2 con) · Vồ Cổ (nhảy vào người ít máu nhất, gây chảy máu).
- **Skarn Răng Sắt**: Đập Đất (vòng đỏ cảnh báo rồi choáng 1 giây) · Hét Xung Phong (cả bầy quái đánh nhanh hơn 25%).
- **Morwen**: Chém Bóng Đêm (vạch đỏ rồi lao chém theo vạch) · Khiên Đen.
- **Valdric**: Cột Lửa (3 vòng lửa dưới chân đội mình) · Vòng Lửa Huy Hiệu (sau khi nổi giận).
- **Người Gác Mộ**: Lời Nguyền (giảm hồi máu + mất máu dần) · Hút Hồn (hút máu cả đội để tự hồi).
- Tên chiêu hiện trên đầu trùm, đòn diện rộng luôn có vòng / vạch đỏ ít nhất 1 giây để kịp né; trạng thái (chảy máu, nguyền, khiên…) có biểu tượng + mô tả tiếng Việt.

### 2. Trận đấu trên điện thoại
- 4 thẻ anh hùng xếp 2×2, nút kỹ năng to dễ bấm, ẩn dòng phím tắt, nút trên cùng gọn lại — không còn tràn ngang màn hình. Máy tính giữ nguyên.

### 3. Chống giật bản đồ 3D
- Thêm chế độ **🤖 Tự động** (mặc định): máy chậm thì tự giảm đồ hoạ bản đồ cho mượt (có thông báo). Vẫn chọn tay được ✨ Đẹp / ⚡ Nhẹ / 🗺️ Phẳng 2D.
- Bóng đổ vẽ lại thưa hơn, giảm độ phân giải trên màn hình độ nét cao → nhẹ máy hơn hẳn.

### 4. Tranh nhân vật theo bậc (ĐANG LÀM)
- Bậc Thường + S: tranh **S** (đồ đơn giản) · SS: thêm giáp / phụ kiện, vũ khí xịn hơn · SSS: tranh hiện tại. Game đã sẵn sàng tự đổi tranh theo bậc — bậc nào chưa có tranh thì tạm dùng tranh SSS.
- **Đã vào game: Rok, Jessica, Seraphine, Ignar, Zerith, Brakk** (bậc Thường/S mặc đồ đơn giản, SS giáp bạc / phụ kiện). Đã thử trong trận: Rok + Seraphine bậc S, Rok bậc SS hiện đúng.
- Vài tấm Flow vẽ sai (vẽ lại tư thế đứng thay vì tư thế cần) → tạm dùng tranh SSS: Jessica + Ignar (thua / thắng), Zerith (bay lơ lửng). Lyra thiếu tấm bắn cung nên **chưa bật** (vẫn hiện SSS). Còn Nerissa, Elarion, Grix, Sylva + sói địch / sói trùm (tranh mẫu sói đã chọn: mẫu 1 xanh xám).
- Chống giật: tranh bậc không nạp hết lúc đầu, chỉ nạp ngầm tranh đúng bậc của đội mình (mỗi tấm ~30 MB trên card đồ hoạ).
- Trùm Sói Đầu Đàn chuẩn bị dùng tranh riêng (khác sói triệu hồi của Sylva); chưa có tranh thì vẫn dùng tranh cũ.

### Kỹ thuật
- Mới: `src/vfx/bossFx.js`, `src/styles/battle-mobile.css`, `src/characters/sprite/tiers.js`, `tools/tier_art.py`, `tests/boss_skills.test.js`. Sửa: `server.js` (`BOSS_SKILLS`), `src/combat/events.js`, `src/ui/hud.js`, `src/characters/registry.js`, `src/characters/sprite/enemySprites.js`, `src/world3d/*`, `src/ui/world.js`.
- 71 bài kiểm tra tự động đều đạt.

---

## 07/11/2026 (sáng) — BẢN ĐỒ THẾ GIỚI 3D (kiểu mô hình thu nhỏ như video mẫu) · SỔ NHIỆM VỤ · TỰ ĐI TỚI MỤC TIÊU
Bạn gửi video mẫu → Claude làm 2 bản demo cho bạn chọn → bạn chọn **bản 2 (mô hình 3D có sẵn)** và **cách 1 (dựng lại 5 bản đồ, giữ nguyên bố cục)**.
Chia việc: **Claude** làm phần 3D + gắn vào game · **Codex** làm dữ liệu nhiệm vụ ở máy chủ + bài kiểm tra · **Antigravity** làm giao diện sổ nhiệm vụ.

### 1. Bản đồ 3D
- 5 bản đồ (Ngoại ô, Rừng Sương, Làng Ashford, Đường Vương Đạo, Kinh thành) **dựng lại bằng khối 3D thu nhỏ**, đúng vị trí nhà cửa / đường / NPC như tranh cũ. Nhân vật, NPC, rương, đồ nhiệm vụ vẫn là tranh 2D quen thuộc.
- Có: nhà mái ngói đỏ / nâu / xanh, quảng trường lát đá, giếng, lò rèn, quán, luống hoa, hàng rào · cánh đồng lúa vàng lay gió, cối xay gió **quay**, đống rơm, núi đá + cửa mỏ + đường ray · Rừng Sương: thông tối, ao, **nấm phát sáng xanh**, sương nhẹ · cầu đá qua sông, trại lính (lều, hàng rào cọc, tháp canh, thanh chắn sọc) · kinh thành: cung điện tháp mái xanh, nhà thờ 2 tháp nhọn, thư viện mái vòm, chợ 16 sạp nhiều màu, đài phun nước, tường thành trắng + cổng.
- Đồ hoạ: bóng đổ mềm, góc khuất tối nhẹ, nắng ấm, nước gợn lấp lánh, cỏ cây lay gió, trên/dưới màn hình mờ như chụp mô hình. Nhân vật bị nhà / tường / cây che thì hiện **bóng mờ** để vẫn thấy mình ở đâu.
- **🧭 Bản đồ → Đồ hoạ bản đồ**: ✨ Đẹp · ⚡ Nhẹ (cho điện thoại / máy yếu — điện thoại tự chọn Nhẹ) · 🗺️ Phẳng 2D (bản đồ tranh vẽ cũ, vẫn giữ).
- Mô hình 3D: bộ miễn phí của **Kenney** (giấy phép CC0 — dùng tự do, kể cả game bán tiền), tải ở OpenGameArt.

### 2. Sổ nhiệm vụ (phím **J** hoặc nút 📜)
- 3 tab: **Đang làm** (nhiệm vụ đã nhận) · **Chính tuyến** (ải cốt truyện kế tiếp) · **Phụ** (Seraphine, Lena, Borin, Giếng Cổ, Trang sách, Hầm mộ — cả việc chưa nhận / chưa mở / đã xong).
- Mỗi nhiệm vụ: người giao, mô tả, **mục tiêu hiện tại**, tiến độ (vd 1/2), phần thưởng, nút **📌 Theo dõi** và **🧭 Tự đi tới**.
- **Khung theo dõi** góc phải trên: nhiệm vụ đang theo dõi + nút 🧭 Tự đi tới. Mũi tên vàng ▼ chỉ mục tiêu trên bản đồ.

### 3. Tự đi
- **Bấm chuột / chạm xuống đất** → nhân vật tự đi tới đó (chấm vàng chỉ đường). Bấm vào NPC / đồ vật → tự tới cạnh rồi nói chuyện / nhặt.
- **🧭 Tự đi tới** → tự đi tới mục tiêu nhiệm vụ, **kể cả ở bản đồ khác** (tự qua các lối ra). Bấm phím di chuyển / D-pad là dừng.
- Đã thử trọn vẹn: nhận việc cô Lena → tự đi sang Ngoại ô nhặt lúa → sang Rừng Sương hái nấm → về làng trả việc (nhận thưởng). Và tự đi từ Ngoại ô xuyên 4 bản đồ tới Bảng ải ở Kinh thành.

### Kỹ thuật
- Mới: `src/world3d/` (view, build, layouts, assets), `src/world/terrain3d.js` (+ `tools/build_terrain3d.py`), `src/assets/world3d/` (215 mô hình, 4,5 MB, `tools/pack_world3d.mjs`), `src/ui/questLog.js` + `src/styles/questlog.css`, `questLog()` trong `game/world.js`.
- Phần 3D là gói riêng, chỉ tải khi mở bản đồ → màn hình đầu không chậm hơn.
- 66 bài kiểm tra tự động (thêm 3 bài bản đồ 3D + 5 bài sổ nhiệm vụ).

---

## 07/11/2026 (đêm) — BẢN ĐỒ KIỂU POKÉMON · NHÂN VẬT CHÍNH NAM / NỮ · TRUYỆN MỚI (Rok → Jessica ải 2 → Seraphine ải 3) · ICON KỸ NĂNG · QUÁI CÓ DÁNG ĐI · CHỐNG GIẬT LAG
Bạn đi ngủ, Claude làm một mạch rồi đẩy GitHub. Tranh vẽ bằng **Codex** (nhân vật đi bộ, đồ vật, icon kỹ năng, dáng đi của quái) và **Google Flow** (5 bản đồ). Máy không có `agy` → Claude tự viết code.

### 1. Chống giật lag
- **Màn tải trước** khi vào game (thanh %): tải + giải nén toàn bộ tranh, đẩy dần lên card đồ hoạ → hết khựng 1,7 giây lúc vào trận (khung chậm nhất còn ~42 ms).
- Kho texture dùng chung (`src/core/textures.js`), tranh nhân vật thu nhỏ 75% (86 MB → 66 MB).

### 2. Bản đồ thế giới làm lại kiểu Pokémon (Game Boy Advance)
- **Nhìn từ trên xuống, đi theo ô vuông**: phím mũi tên / W A S D hoặc **D-pad ảo** góc trái. Bấm nhanh = quay mặt / đi 1 ô, giữ = đi liên tục. Camera giữ nhân vật ở giữa, dừng ở mép bản đồ.
- **Nút A** (E / Enter / Z / nút đỏ): nói chuyện, nhặt đồ, mở rương, đọc bảng ở **ô phía trước mặt**. **Nút B** (Space / X / nút tím): **nhảy** — nhảy qua được vật cản mỏng 1 ô (hàng rào…).
- **5 bản đồ** (tranh Flow, 43 × 24 ô): Ngoại ô (cánh đồng, cối xay, mỏ — **điểm bắt đầu**) · Làng Ashford (quảng trường + bảng ải, giếng, lò rèn, quán) · Rừng Sương · Đường Vương Đạo (cầu, trạm gác — mở sau ải 10) · Kinh thành Valoria (nhà thờ, thư viện, chợ, lâu đài — mở sau ải 12).
  - Đi ra **mép bản đồ** để sang khu khác: Ngoại ô ⇄ Làng (phía tây) · Ngoại ô ⇄ Rừng (phía đông) · Làng → Đường (phía nam) · Đường → Kinh thành (phía đông, vào qua cổng thành).
  - 🧭 **Bản đồ**: dịch chuyển nhanh tới khu đã mở.
- **16 NPC có tranh đi bộ 4 hướng** (Bà Mira, bác Borin, cô Lena, Seraphine, Rok, Jessica, lính gác, Lão Corvin, Công chúa Elise, Sơ Agnes, thương nhân, nông dân, dân làng, bé Pip…). Dân làng **tự đi lại** quanh chỗ đứng, **quay mặt về phía bạn** khi nói chuyện. Dấu **!** = có việc, **?** = trả việc.
- Hộp thoại kiểu Pokémon (khung trắng, tên người nói), lời thoại hiện ngay trên bản đồ.
- Rương / lúa / nấm / thảo dược / búa / trang sách / bảng ải vẽ bằng tranh AI, đứng trên ô; rương mở rồi đổi sang tranh rương mở.

### 3. Nhân vật chính Nam / Nữ
- Lần đầu vào 📖 Cốt truyện: màn **"Bạn là ai?"** — chọn **Nam / Nữ** (xem trước tranh) + **đặt tên** (2–14 chữ, sai thì báo ngay trên khung).
- **Lời thoại tự đổi theo giới tính**: Rok gọi "cậu" hay "cô", "anh"/"chị", "chàng trai"/"cô gái"… và gọi đúng tên bạn. Khung thoại cốt truyện hiện **tranh nhân vật chính** thay cho biểu tượng.
- Nhân vật chính là người đi trên bản đồ (không còn cả đội đi theo).

### 4. Truyện mới — nhận đồng đội theo ải
- **Lúc đầu chỉ có Rok** (ải 1 chỉ 2 quái, quái yếu hơn để 1 người đánh được).
- **Ải 2 — Jessica**: qua ải 1 xong ra **Ngoại ô**, đi vào đoạn đường có **3 Goblin đứng chờ** → bị vây đánh, **cô gái áo tím bí ẩn** nhảy xuống ứng cứu → vào thẳng màn chọn đội, **Jessica đánh cùng (khách)** → thắng thì **Jessica gia nhập đội**. (Danh tính của cô để dành cho truyện sau.)
- **Ải 3 — Seraphine**: sau ải 2, Seraphine ở **giếng làng Ashford** (dấu !) nhờ hái **thảo dược ở Rừng Sương** → mang về → nói chuyện tiếp → **hộ tống cô vào rừng** (ải 3, Seraphine đánh cùng) → thắng thì **Seraphine gia nhập**.
- Màn chọn đội ghi rõ "✨ Jessica đi cùng"; khách luôn có cấp bằng người cao nhất trong đội. Trận mở từ bản đồ → thắng xong **quay về bản đồ**.
- Có thể vào ải 2 / 3 thẳng từ bảng ải (khách vẫn đi cùng).
- Độ khó: ải 1 quái ×0,5, ải 2 ×0,6, ải 3 ×0,8 (chỉ mức Cốt truyện) — giả lập 4/4 trận thắng.

### 5. Icon kỹ năng + quái có dáng đi
- **33 icon kỹ năng** (11 anh hùng × 3 chiêu, Codex vẽ) hiện trên ô kỹ năng trong trận; chưa đủ Orb thì icon xám, đủ thì sáng màu.
- **9 loại quái** (Goblin, Goblin Ném Bom, Lính, Mật Thám, Chiến Binh Lửa, Skarn, Morwen, Valdric, Người Gác Mộ) có thêm **2 khung bước chân** → khi di chuyển trên trận không còn "trượt" đứng yên.

### Đã thử bằng chuột / phím thật (trình duyệt trong app, người chơi thử mới tinh)
Màn chọn Nam/Nữ (đổi giới tính giữ tên đã gõ; tên 1 chữ → báo lỗi) → mở màn → tỉnh dậy (lời thoại "Cô…" đúng giới tính Nữ) → đi bộ Ngoại ô → sang Làng → nói chuyện Rok → đọc bảng ải → **ải 1 chỉ Rok: thắng** (icon kỹ năng, quái bước chân) → ra Ngoại ô, gặp 3 Goblin → hội thoại → **ải 2 có Jessica: thắng, "Jessica gia nhập đội!"** → dịch chuyển nhanh → Seraphine nhận việc → Rừng Sương nhặt thảo dược (nút A ảo) → thử nhảy (B) → trả việc → hộ tống → **ải 3 có Seraphine (AUTO): thắng, "Seraphine gia nhập đội!"**. **58 bài kiểm tra tự động** đạt (thêm 5 bài kiểm tra bản đồ khớp dữ liệu server).

### Còn lại / chưa làm
- **Trận đấu trên điện thoại**: hàng thẻ anh hùng + dòng hướng dẫn rộng hơn màn hình (có từ trước) → trình duyệt điện thoại thu nhỏ cả trang. Bản đồ vẫn dùng được (nút, D-pad đủ), nhưng nên làm lại bố cục trận cho màn dọc.
- Việc bác Borin, trang sách, Phiến đá Hầm Mộ, lính / Corvin / Elise ở Kinh thành: logic có bài kiểm tra, chưa đi bộ tới bấm tay.
- Chưa có nhạc / tiếng bước chân; chưa có "cỏ cao gặp quái ngẫu nhiên".
- Muốn chỉnh chỗ đi được / vị trí NPC: sửa `tools/build_maps.py` (OPS, LAYOUT) rồi chạy lại — xem `TIEP_TUC.md`.

---

## 06/11/2026 (tối) — P3 → P6: BẢN ĐỒ THẾ GIỚI · CỐT TRUYỆN · QUÁI CHƯƠNG 1 · HẦM NGỤC / QUÁN ĂN / CỬA HÀNG
Bạn treo máy, Claude làm một mạch. Codex bị chặn quyền đọc/ghi file trên Windows, máy không có lệnh `agy` (Antigravity) → Claude tự làm hết. **Toàn bộ tranh vẽ trên Google Flow** (tài khoản của bạn): 12 tranh nền + quán ăn, 6 NPC, 10 quái / trùm.

### P3 — Bản đồ thế giới (bấm 📖 Cốt truyện ở Menu là vào đây)
- **Màn ngang kiểu MapleStory**: đội đi lại (Rok dẫn đầu, Jessica · Seraphine · Lyra đi theo, dùng tranh chạy có sẵn). Điều khiển: ← → (A D) hoặc nút ◀ ▶ hoặc **bấm vào nền / NPC / đồ vật để đi tới** · ↑ / E / nút vàng để tương tác.
- **12 khu**: Làng Ashford (Quảng trường · Giếng Cổ · Phố Lò rèn & Quán ăn) · Ngoại ô (Cánh đồng · Mỏ đá · Rừng Sương) · Đường Vương Đạo (Cầu Đá · Trạm gác — mở sau ải 10) · Kinh thành (Cổng thành · Khu chợ · Thư viện · Cung điện — mở sau ải 12).
- **🧭 Bản đồ**: xem các khu, **bấm khu đã mở để dịch chuyển nhanh**.
- **Rương** (mở 1 lần, có rương ẩn) · **mạch đá** ở Mỏ (đào được Đá Cường Hoá, hồi sau 4 giờ) · **NPC** có hội thoại theo tiến trình, dấu **!** (có việc) / **?** (trả việc).
- **5 việc mở 5 nhánh ẩn**: Giếng Cổ (xoay 4 biểu tượng theo bài đồng dao của Bà Mira → N1) · Búa của bác Borin ở Mỏ đá (sau ải 4 → N2) · Lúa mì + Nấm cho cô Lena (sau ải 3 → N3, mở Quán ăn) · Xếp trang sách ở Thư viện (sau ải 16 → N4) · Phiến đá lạ ở Cung điện (sau ải 18 → N5 Hầm Mộ).
- Vị trí, rương đã mở, việc đang làm đều được lưu.

### P4 — Cốt truyện
- **Mở màn** (lần đầu vào Cốt truyện): lời dẫn → **trận đấu Thần Ánh Sáng** với đội Lv60 SSS → loé trắng, *"Ngủ đi…"* → **tỉnh dậy ở Ashford**, Rok · Jessica · Seraphine tìm thấy.
- **Lời thoại trước ải** (lần đầu vào, mức Cốt truyện) và **sau khi thắng lần đầu** cho cả 20 ải, theo đúng diễn biến chương 1; sau ải 20 có **kết chương** (Thánh Varkos, mở chương 2). Có nút **Bỏ qua**.
- **Mở dần tính năng**: **AUTO chỉ có sau ải 2** (trước đó nút AUTO ẩn); màn kết quả hiện **"🔓 Mở khoá mới: …"** (AUTO, Khó, Trang bị, Lò rèn, Hầm ngục, Cửa hàng…).

### P5 — Quái + 5 trùm chương 1
- **Quái mới có tranh riêng**: Goblin Cướp · Goblin Ném Bom · Sói Rừng (dùng tranh sói của Sylva) · Lính Valoria · Mật Thám đội lốt Elf · Chiến Binh Lửa. Mỗi ải 3 quái đúng theo truyện.
- **5 trùm**: Sói Đầu Đàn (ải 5) · Skarn Răng Sắt (ải 10) · Morwen — Hiệp Sĩ Đen (ải 15) · **Đại tướng Valdric (ải 20, dưới 50% máu bùng lửa — đổi hẳn sang tranh bốc lửa, hồi 10% máu, mạnh lên)** · Người Gác Mộ (nhánh N5). Trùm nào cũng có **giai đoạn 2** khi máu thấp (băng chữ đỏ giữa màn + biểu tượng 💢).
- **Cân bằng bằng giả lập** (`node tools/sim_stage.js`): **EXP ải tăng ×4** (160 + 60n) để cấp anh hùng theo kịp cấp ải (trước đây tới ải 20 đội mới ~Lv10). Ở cấp dự kiến: ải thường thắng chắc, trùm ải 5 và ải 20 thắng khoảng 50% (chơi lại / mặc đồ là qua).

### P6 — Hầm ngục · Quán ăn · Cửa hàng anh hùng (nút **🏰 Hầm ngục** ở màn chọn ải và trên bản đồ)
- **Hầm ngục đồ bộ** (mở ở ải 15): 3 tầng (đồ cấp 10/20/30), tốn ⚡8 (thua hoàn 7), rơi **đồ 3 bộ tộc Người, Sử thi / Huyền thoại** + đá + vàng + EXP.
- **Hầm ngục trang sức** (mở ở ải 16): **3 lượt / ngày**, thua không mất lượt, **mua thêm lượt 30 Kim Cương** (tối đa 3), rơi **Nhẫn / Dây chuyền** + Đá Tinh Luyện.
- **Quán ăn** (mở sau việc của cô Lena): mời anh hùng 3 món (100 / 300 / 800 Vàng) → độ thân mật cấp 0–10, **mỗi cấp +1% Máu & Tấn công** (tính vào trận).
- **Cửa hàng anh hùng** (mở sau ải 20): mua Ignar, Grix (600 💎), Zerith, Brakk, Nerissa, Sylva (800 💎), Elarion (1.200 💎) — hộp xác nhận ngay trên trang.
- **Tool Test** thêm mục **"📖 Cốt truyện thử"**: mở khoá tới ải 6 / 10 / 16 / 20 (Lv30) + tặng 1.000 Kim Cương, 5.000 Vàng để thử nhanh.

### Đã thử bằng chuột thật
Mở màn → đấu thần → bị phong ấn → tỉnh dậy · đi lại 6 khu, mở 2 rương, đào mỏ · nhận + làm + trả việc cô Lena (đi bộ và dịch chuyển nhanh) · câu đố Giếng Cổ (sai → báo, đúng → mở nhánh) · lời thoại trước ải 1 · AUTO bị ẩn ở ải 1, hiện ở ải sau · quái mới trong trận · Valdric giai đoạn 2 · màn Hầm ngục (tầng khoá báo lý do, mua lượt, vào trận tầng 1) · Quán ăn (lên cấp thân mật, món đắt bị khoá khi thiếu vàng) · Cửa hàng (hộp xác nhận, mua Ignar). Giả lập: lời thoại sau ải + mở AUTO khi thắng ải 2 lần đầu; hầm đồ bộ / trang sức đánh trọn tới nhận thưởng. **54 bài kiểm tra tự động** đạt.

### Còn lại / chưa thử bằng tay
- Việc của bác Borin, xếp trang sách (Thư viện), Phiến đá Hầm Mộ: có bài kiểm tra tự động, chưa bấm tay từng bước.
- Giao diện điện thoại: khung giả lập điện thoại của trình duyệt trong app bị lệch nên chưa xem được thật — đã làm sẵn bố cục hẹp.
- "Đánh bằng mẹo" trên bản đồ (dụ sói vào bẫy, lẻn qua trạm gác…) và câu đố nhỏ khác: chưa làm.
- Tranh Flow có dấu ✦ nhỏ của Google ở góc phải dưới (không xoá dấu này).

---

## 06/11/2026 — TRANG BỊ (P2): rơi đồ, mặc đồ, Lò rèn (cường hoá · tinh luyện · phân giải), 3 bộ đồ tộc Người
- **Màn chọn ải có nút mới "🎒 Trang bị"** (khoá tới khi qua ải 6). Gồm 2 tab:
  - **Trang bị:** chọn anh hùng, 6 ô (Vũ khí · Áo · Tay · Chân · Nhẫn · Dây chuyền), bảng chỉ số (phần tăng nhờ đồ ghi màu xanh), bộ đồ đang mặc (2/4 món), túi đồ lọc theo ô. Bấm món đồ → thẻ chi tiết: chỉ số chính, dòng phụ có thanh "nằm đâu trong khoảng", dòng ≥ 90% chữ vàng lấp lánh, nút Mặc / Tháo / 🔒 Khoá / Lò rèn.
  - **🔨 Lò rèn** (mở khi qua ải 10): **Cường hoá** +1 → +10 (tỉ lệ 100…80/65/50/35/20%, từ +8 hỏng tụt 1 cấp, hỏng thì tích may mắn +5%, Bùa May Mắn +10%, mốc +5 dòng phụ +10%) · **Tinh luyện** (chọn 1 dòng, roll lại ngẫu nhiên, tốn Đá Tinh Luyện + Vàng) · **Phân giải** nhiều món → Đá Cường Hoá + Đá Tinh Luyện (hộp xác nhận ngay trên trang; đồ đang mặc / đã khoá không phân giải được).
- **Rơi đồ:** thắng ải Cốt truyện từ ải 6 trở đi rơi 1 món (ải trùm thêm 1 món), chỉ 4 ô Vũ khí/Áo/Tay/Chân, độ hiếm Thường → Hiếm (Khó / Địa ngục hiếm hơn + có Bùa May Mắn). **Lần đầu qua ải 6 chắc chắn rơi Vũ khí Tốt.** Túi tối đa 100 món, đầy thì đồ rơi tự phân giải. Màn kết quả hiện đồ rơi.
- **Cấp mặc đồ (bạn chốt):** đồ cấp 10 mặc được từ Lv1; đồ cấp 20 trở lên phải có anh hùng đủ đúng cấp đó (cấp 20 → Lv20, cấp 30 → Lv30…).
- **Đồ cộng chỉ số thật vào trận** (Cốt truyện + Test; chế độ Đấu không tính đồ). Tấn công trên đồ tự cộng vào đánh vật lý hoặc phép.
- **3 bộ tộc Người** (4 món Vũ khí/Áo/Tay/Chân): Hộ Vệ Vương Quốc (2: +10% Thủ · 4: lần đầu máu < 50% khiên 15% máu tối đa + cả đội +5% thủ 6s) · Chiến Lược Gia (2: +15% hồi năng lượng · 4: dùng kỹ năng ≥ 3 Orb hoàn 1 Orb + cả đội +10% tấn công 5s) · Lữ Khách (2: +8% Tấn công · 4: +6% sát thương mỗi đồng đội khác tộc, tối đa +18%). Có biểu tượng 🧩 trên thanh hiệu ứng trong trận. **Đồ bộ tạm chỉ lấy được bằng tool Test** — hầm ngục đồ bộ làm ở P6.
- **Tool Test** có mục "🎒 Đồ thử": nhận đồ cam cấp 10/30/60 (6 ô thường hoặc đủ 1 bộ) + đá, bùa, vàng, và mở sẵn Trang bị + Lò rèn.
- Code: `game/gear.js` (luật đồ, 15 bài kiểm tra mới → tổng **37 bài**), `src/ui/gear.js` (màn Trang bị), nối `server.js`. Lần này Codex và Antigravity không chạy được (Codex bị chặn quyền đọc/ghi file, máy không còn lệnh `agy`) nên Claude làm hết.
- Đã thử bằng chuột thật: bản lưu mới → ải 1–5 không rơi đồ → ải 6 rơi Vũ khí Tốt → mặc / tháo / khoá / chuyển cho Rok → chỉ số trong trận tăng đúng → nhận 3 bộ → đủ 4/4 → Lò rèn: +0 → +10, hỏng tụt cấp, tích may mắn, bùa, tinh luyện, phân giải (huỷ rồi xác nhận) → đồ cấp 60 bị chặn mặc kèm lý do → trận Test quái Lv60: khiên Hộ Vệ, buff Chiến Lược, Lữ Khách +6% đều bật.
- **Chưa thử bằng tay:** túi đầy 100 món tự phân giải (đã có bài kiểm tra tự động cho túi đầy); giao diện trên điện thoại thật (đã đo không tràn ngang ở khổ hẹp).

## 06/11/2026 — CHẾ ĐỘ CỐT TRUYỆN (P1): chương 1 tộc Người — 20 ải + 5 nhánh, 3 độ khó, thể lực, ví tiền, thưởng
- **Menu có thẻ mới "📖 Cốt truyện"** (đứng đầu). Màn chọn ải: ví (Vàng · Kim Cương · Đá Cường Hoá), thể lực `x/360` + thời gian hồi điểm kế + nút **Mua** (hộp xác nhận trên trang: 50 Kim Cương → +60), 3 tab **Cốt truyện / Khó / Địa ngục** (tab khoá ghi lý do), 20 ải chia 3 phần (Làng Ashford · Đường Vương Đạo · Kinh thành Valoria), ải trùm viền nổi bật, nhánh ẩn chỉ hiện khi đã mở.
- **Luật** (chi tiết `BAN_THIET_KE_GAME.md`, `CHUONG_1_TOC_NGUOI.md`): qua ải trước mới mở ải sau; Khó mở sau ải 4; Địa ngục mở khi qua hết 20 ải Khó; thể lực tối đa 360, hồi 1 điểm / 5 phút, mỗi trận tốn 4 / 6 / 10, thua hoặc bỏ trận hoàn (chi phí − 1); thưởng EXP · Vàng · Đá mỗi lần thắng, **Kim Cương chỉ lần đầu qua** (ải thường 10, trùm nhỏ 30, giữa chương 50, cuối 100).
- **Anh hùng sở hữu**: bắt đầu có Jessica, Rok, Seraphine; **Lyra gia nhập khi lần đầu qua ải 12**. Bảng chọn đội Cốt truyện chỉ hiện anh hùng đã có, dùng cấp / bậc thật, nhớ đội lần trước.
- **Rok là tộc Người** (trước ghi nhầm Rồng).
- Quái các ải **tạm dùng 3 quái cũ** (đổi tên theo truyện: Goblin Cướp, Sói Đầu Đàn, Skarn Răng Sắt, Đại tướng Valdric...); quái + trùm thật làm ở P5. Ải trùm: trùm máu ×2 / ×3 / ×4.
- Chống gian lận nhẹ: bấm "Vào trận" 2 lần chỉ trừ 1 lần; về Menu / "Chơi lại" / thoát giữa ải = bỏ trận; Cốt truyện không có tool.
- Code: `game/` (wallet, stamina, chapter1, campaign — Codex làm), `src/ui/campaign.js` + chọn đội (Antigravity làm), nối server (Claude). **22 bài kiểm tra tự động** (`npm test`).
- Sửa thêm: ở các màn chọn, bảng tool Test phía sau bị ẩn (trên điện thoại từng tràn ngang).
- Đã thử bằng chuột thật: Menu → Cốt truyện → ải 2 khoá có lý do, tab Khó khoá có lý do → ải 1 chọn đội (đúng 3 anh hùng) → thắng: +55 EXP mỗi tướng, +60 Vàng, +1 Đá, +10 Kim Cương, cả đội lên cấp → ải 2 mở → mua thể lực (Kim Cương 110 → 60, thể lực 356 → 416) → vào ải 2 rồi về Menu: THẤT BẠI, hoàn 3 thể lực. Chế độ Test / Đấu vẫn như cũ. Build + test không lỗi.
- **Còn lại**: thanh kỹ năng 4 nhân vật trong trận chưa vừa màn hình điện thoại (có từ trước).

## 06/11/2026 — Dọn thư mục game
- Xoá **117 ảnh / video xem trước cũ** trong `Claude outputs/` (so sánh các bản đã bỏ: khung xương, assassin 2D, các bản Rok / Ignar cũ...). Giữ 3 file câu lệnh vẽ (`PROMPTS_FX-3.md`, `PROMPTS_ICONS.md`, `PROMPTS_SPRITE-3.md`) + 2 ảnh trận đấu mới.
- Xoá tranh gốc + công cụ Pixel (`art/ignar/pixel`, `art/sylva/pixel`, `art/pixel_fx_src`, `tools/pixel_snap.py`, `tools/pixelfx_pack.py`) — đã chốt bỏ Pixel.
- Trên máy (không có trên GitHub): xoá đồ nháp của đội AI trong `.team/` (nhật ký, bản vá, tranh nháp ~59 MB); giữ `.team/pyenv` (Python có sẵn công cụ đóng gói tranh).
- Mọi file đã xoá vẫn lấy lại được từ lịch sử git (trừ đồ nháp `.team/`). Build không lỗi.

## 06/11/2026 — Nhịp khung đòn đánh có lực hơn (mọi nhân vật, không đổi gameplay)
- Mọi đòn đánh / kỹ năng dạng tranh từng khung (mode `strike`) chia lại thời gian từng khung: **khung đầu lướt nhanh, khung lấy đà ngay trước cú đánh giữ lâu nhất**, **khung trúng giữ lâu cho thấy lực**, các khung thu về nhanh dần.
- **Mốc gây sát thương và độ dài đòn KHÔNG đổi** (chỉ chia lại thời gian bên trong) → tốc độ đánh, choáng, đóng băng... giữ nguyên.
- Ví dụ Rok chém: trước 3 khung lấy đà 0,08s đều nhau → giờ 0,05s / 0,08s / giữ 0,11s rồi chém; khung trúng 0,12s.
- Không thêm khựng khi trúng đòn (game nhịp nhanh, có nhiều hiệu ứng choáng / đóng băng riêng).
- Đã thử: trận Đấu với tướng (Jessica, Rok, Zerith, Brakk vs đội AI), AUTO, không lỗi. Build không lỗi.

## 06/11/2026 — Bỏ chế độ Đồ họa PIXEL, Ignar + Sylva về lại tranh vẽ tay
- Chốt phong cách chung **tranh vẽ tay bản 3** cho cả đội: Ignar và hiệu ứng Ignar / Sylva luôn dùng bản vẽ tay.
- Bỏ nút **🎨 Đồ họa** trong bảng Tạm dừng và tham số `?pixel=` trên đường dẫn. Máy nào trước đây đã bật Pixel cũng tự về vẽ tay.
- Gỡ 6 file tranh pixel khỏi game (game nhẹ hơn ~1,3 MB). **Tranh gốc pixel vẫn giữ** ở `art/ignar/pixel`, `art/sylva/pixel`, `art/pixel_fx_src` + công cụ `tools/pixel_snap.py`, `tools/pixelfx_pack.py` (cần thì lấy lại từ lịch sử git).
- Đã thử (bấm thật): máy đã lưu Pixel + `?pixel=1` → vào Đấu với tướng, đội Rok / Seraphine / Ignar / Sylva: Ignar, Sylva tranh vẽ tay, không lỗi; bảng Tạm dừng không còn nút Đồ họa. Build không lỗi.

## 06/11/2026 — Trận đấu DỄ NHÌN hơn (áp cho mọi nhân vật, không vẽ thêm gì)
- **Chế độ Đấu ẩn bảng chỉ số mặc định** (trước chỉ ẩn bảng tool, bảng chỉ số vẫn che 1/5 màn hình). Phím **I** vẫn hiện / ẩn, và game **nhớ lựa chọn riêng cho Test và Đấu**. Chế độ Test vẫn hiện sẵn như cũ.
- **Số sát thương gọn:** số trúng cùng một người xếp thành CỘT (số mới đẩy số cũ lên, không đè nhau); số thường vừa, **chí mạng to + nảy**; số phụ (BLOCK, khiên, MISS...) nhỏ và mờ hơn; tối đa 28 số cùng lúc.
- **Phân biệt 2 phe:** đĩa sáng dưới chân **xanh = phe mình, đỏ = phe địch**; thanh máu phe địch màu đỏ, viền thanh máu theo màu phe. Hai bên chọn trùng tướng vẫn biết ai là ai. Chết thì đĩa tắt; tàng hình thì đĩa mờ theo. Vòng tầm đánh mờ bớt cho đỡ rối.
- **Giảm chói:** càng nhiều hiệu ứng đang nổ, mọi hiệu ứng cộng sáng tự mờ bớt (tối đa 40%), không còn phủ trắng nhân vật.
- Đã thử (bấm thật, trận Đấu với tướng 1P vs 2P, AUTO): bảng chỉ số ẩn, số đọc được, đĩa xanh / đỏ rõ; phím I đổi và nhớ đúng qua nhiều trận, cả Test lẫn Đấu. Build không lỗi.

## 02/11/2026 — Đồ họa Pixel: 1 bản rõ nhất, nút chọn trong bảng Tạm dừng, hiệu ứng Ignar cùng cỡ ô
- **Chọn đồ họa trong bảng Tạm dừng:** nút **🎨 Đồ họa: Vẽ tay / PIXEL** (trang tải lại, trận đang đánh chơi lại). Bỏ phím X và 2 bản thô / mịn — chỉ còn bản rõ nhất (độ phân giải đầy đủ, ô pixel sắc).
- **Hiệu ứng Ignar khớp với nhân vật:** vẽ lại cho cùng cỡ ô pixel với Ignar (trước đó nhiều hiệu ứng bị phóng to, ô to gấp 2-3 lần): **quả cầu lửa rơi vẽ lại hoàn toàn** (sao chổi lửa rực, không còn hòn đá tối), hào quang, khiên lửa, cánh lửa, Hộ Vệ Thần Lửa, các vòng phép dưới đất (có chữ rune).
- **Sửa sau khi bạn thử:** quả cầu lửa rơi vẽ lại cho **rơi thẳng xuống, đuôi lửa dựng lên** (khớp hướng rơi trong game — trước vẽ bay chéo); **Hộ Vệ Thần Lửa có động tác chưởng** (vung tay lấy đà → chưởng ra, lửa loé ở lòng bàn tay, cầu lửa bay ra đúng từ tay) và **gầm** (ngửa đầu, dang tay) — trước bản pixel chỉ có dáng bay.
- Đã thử (bấm thật): Tạm dừng → bấm 🎨 Đồ họa → trang tải lại, nút thành `PIXEL`, Ignar + hiệu ứng pixel hiện; chụp quả cầu lửa rơi, cánh lửa, vụ nổ, biển lửa. Build không lỗi.

## 02/11/2026 — Thử CHẾ ĐỘ PIXEL · Ignar pixel art đầy đủ (nhân vật + hiệu ứng)
- **Chế độ Pixel** (thử nghiệm, không thay bản thường): bấm **X** trong trận để đổi tắt → thô → mịn (nên dùng **mịn**); nhớ lựa chọn. Đổi xong tải lại trang để tranh pixel áp dụng đủ.
- **Ignar pixel art:** cả 10 tấm động tác (đứng, đánh, chạy, trúng đòn, choáng, gục, thắng, 3 chiêu, gồng, rơi vào trận) chuyển từ tranh vẽ tay sang pixel art thật (ô vuông sắc, 24 màu, viền tối) bằng công cụ tự viết — **không tốn lượt vẽ Codex**.
- **Toàn bộ hiệu ứng lửa của Ignar dạng pixel** (21 loại: lửa tay, cầu lửa, cầu xoáy, nổ, thiên thạch, biển lửa, cột lửa, hào quang, cánh lửa, khiên lửa, Hộ Vệ Thần Lửa, luồng chưởng, các vòng phép dưới đất...) — 3 trợ lý tự vẽ bằng code (thư viện pixelfx, giấy phép MIT), thiết kế riêng cho game.
- **Sylva:** 10 hiệu ứng pixel (lá, triệu hồi, sóng tru, nanh, cầu gió, bụi gấu, cú húc, khiên lá); tranh Sylva vẫn bản vẽ tay.
- Đã thử: chụp so sánh 3 chế độ; trận thật ở chế độ Pixel mịn (Ignar + Seraphine đấu Rok + Brakk, AUTO): thắng, hiệu ứng pixel hiện đúng, không lỗi. Build không lỗi.
- Còn lệch khi bật Pixel: các tướng khác vẫn là tranh vẽ tay bị làm vỡ hạt; cây cối có viền chấm đen; vài vòng sáng vẽ bằng code còn mềm.
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
- **Hiệu ứng vẽ tay của Sylva — XONG (29/10):** 9 tấm nền đen (Antigravity 4, Codex 5) thay toàn bộ hiệu ứng vẽ bằng code: phi tiêu lá, lông vũ vàng của Đại Bàng, cột lá triệu hồi + vòng phép dưới chân, sóng tru + nanh cắn, Cầu Gió + nổ gió, Bão Lông Vũ cắm đất, bụi đá cuộn khi Gấu ủi + cú húc + hố nứt, vòm Khiên Lá, mắt ưng, mũi tên lá buff, dấu hồi máu, vòng ban phước Thần Hươu, dấu vuốt khiêu khích. Đã chụp thử từng chiêu ở trang xem thử + 1 trận thật (Sylva + Seraphine đấu Rok + Brakk, AUTO): hiệu ứng hiện đúng, không lỗi.
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
