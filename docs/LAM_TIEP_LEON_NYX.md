# Làm tiếp Leon + Nyx ở máy khác (ghi 17/11/2026)

Luật hiện tại của 2 nhân vật, phần đã thử và phần còn nợ: xem mục **16–17/11/2026** ở đầu `NHAT_KY_CAP_NHAT.md`.
File này chỉ ghi CÁCH LÀM để bạn (hoặc Claude ở máy nhà) bắt tay vào ngay.

## 1. Lấy về và chạy
1. `git pull` (nhánh `main`).
2. `npm install` (lần đầu ở máy đó).
3. `npm test` — phải ra 276 bài qua.
4. Chạy game như thường lệ (bản web), hoặc bản ứng dụng: `npx vite build` rồi `npm run app`.
5. Thư mục `data/` (tiến trình chơi) KHÔNG nằm trên GitHub — máy nhà dùng tiến trình riêng của máy đó.

## 2. Vào thử nhanh 2 nhân vật
1. Vào game, bấm **Server test**.
2. Bấm nút công cụ ở góc (mở "Tool thử"). Tab Nhanh: **⚡ Cả đội Lv60 SSS**, bật **🛡️ Bất tử** và **✨ Skill miễn phí** nếu muốn bấm chiêu thoải mái.
3. **🦸 Nhân vật** -> chọn Leon hoặc Nyx -> **🎯 Vào Đấu Tập thử chiêu**.
4. Trong trận: phím `i` bật / tắt bảng chỉ số; nút 📷 đổi góc Ngang / Chéo; bấm thẻ anh hùng để camera bám theo.

Thứ nên thử trước (chưa ai nhìn tận mắt): gọi Hậu rồi dùng Vũ Điệu; có cả Vua + Hậu rồi bấm Chiếu Tướng (xem Eclipse, đối thủ bị nâng lên, toà thành bay ở góc sân); Tốt / Mã sống 12 giây có phong cấp không; đấu với đội có anh hùng để xem Tượng hút Orb.

## 3. Thử bằng máy khi cửa sổ Claude bị ẩn (dành cho Claude)
Khung trình duyệt trong app không vẽ khi cửa sổ bị ẩn, nên mở bản ứng dụng có cổng gỡ lỗi:

```
npx vite build
npx electron . --remote-debugging-port=9333 --user-data-dir=<thư mục tạm>/electron-profile --disable-features=CalculateNativeWinOcclusion --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling
node tools/app_cdp.mjs 9333 "text=Server test" "css=#th-fab" "tab=tool.html" "text=Nhân vật" ... "shot=anh.jpg" errors
```

Lệnh của `tools/app_cdp.mjs`: `text=` (bấm phần tử có chữ đó), `css=`, `xy=x,y`, `key=`, `wait=ms`, `shot=file`, `eval=js`, `errors`, `tab=tool.html`. Tất cả là cú bấm chuột THẬT. Cửa sổ 1264×761 thì 3 nút chiêu ở khoảng x 553 / 632 / 711, y 710. Công tắc Bất tử / Skill miễn phí chỉ bấm 1 lần mỗi lần mở ứng dụng (bấm lần nữa là tắt).

## 4. Vẽ tranh
- **Codex** (hay hết lượt, hay "vẽ hụt" — luôn kiểm tra file có thật và mở ra xem): chỉ dùng cho tạo hình, icon, ảnh hiệu ứng chính, ảnh mẫu cho Meshy. `node tools/codex_draw.js <ra.png> "<đề bài | @file>" [ảnh mẫu...]`, nhiều tấm: `node tools/codex_batch.js jobs.json <số luồng>`.
- **Flow** (tấm động tác — đẹp hơn Codex): ảnh mẫu phải nằm trên GitHub (kho công khai, lấy bằng `https://raw.githubusercontent.com/Newwyn/Game/main/<đường dẫn>`), thả vào trang, gắn vào ô nhập lệnh, gõ đề bài, bấm THẬT nút tạo, tải ảnh kết quả (JPEG 1200×896) về `art/<nhân vật>/sprite_flow/` hoặc `art/leon/<quân>/flow/`. Cài đặt: Hình ảnh, 4:3, Cao, x1, Nano Banana. **Mỗi lần 1 tấm, nghỉ 20–30 giây giữa 2 tấm. Flow báo hoạt động bất thường / đòi xác minh thì DỪNG HẲN, không tìm cách vượt.** Đề bài mẫu: `art/leon/jobs_rest.json`.
- **Đóng gói hình:** `art/<x>/sprite_spec.json` -> `python tools/sprite_pack.py <spec> --debug <ảnh soát.png>` (tấm của Flow cần `scale: 1.28`). Bảng khung hình: `src/characters/sprite/leonSprite.js`, `nyxSprite.js`, `chessPieceSprites.js`; đăng ký ở `src/characters/registry.js`. Sinh spec cho 6 quân cờ: `node art/leon/pack_specs.mjs`.
- **Icon chiêu:** `node art/icons/icon_jobs_leon_nyx.mjs` -> `codex_batch` -> `node tools/icon_cut.mjs` (bảng `CELLS` = tên file cắt ra).
- **Meshy** (chỉ cho đồ vật / công trình, nhân vật vẫn là hình 2D): đưa ảnh mẫu từ GitHub, bật công tắc **Texture** (tổng 35 lượt / món), Generate -> Remesh 30K hoặc 10K (không tốn lượt) -> Download glb vào `art/battle3d/meshy/<tên>_raw.glb` (thư mục này không đẩy GitHub) -> chép sang `src/assets/world3d/meshy/<tên>.glb` -> `node tools/meshy_pack.mjs <tên>`. Tài khoản đang còn khoảng 575 lượt.

## 5. Mã nằm ở đâu
- Luật đánh: `server.js` — `CLASS_DEFS` (`voidmage`, `chessmaster`), `castVoidSkill`, `castChessSkill`, `CHESS_MODES`, `summonChessPiece`, `chessSiphonStart`.
- Hiệu ứng: `src/vfx/voidFx.js`, `src/vfx/chessFx.js` (sa bàn `warTableMaterial`, gươm `makeKingSword`, cầu `makeSunburstOrb`, hào quang `syncRoyalAuras`, `spawnBishopDisc`, `spawnKnightCharge`); nhận sự kiện ở `src/combat/events.js` (`onVoidFx`, `onChessFx`); hiệu ứng pixelfx đăng ký trong `LIB` của `src/vfx/pixelFx.js`.
- Camera: `src/core/cameraRig.js`, `src/combat/battleScene.js`, `src/ui/input.js`, `src/ui/hud.js`.
- Mô tả chiêu hiện trong game: `src/ui/heroPanel.js`; tên trạng thái: `src/ui/hud.js`.

## 6. Dọn dẹp còn lại (không gấp)
- Máy cơ quan còn 3 thư mục làm việc tạm `.team/wt/server|client|integ` (nhánh `team/*` đã ghép hết vào `main`) — xoá được; nhớ gỡ liên kết `node_modules` bên trong bằng `cmd /c rmdir` TRƯỚC khi `git worktree remove`, không thì mất `node_modules` thật.
- `.claude/launch.json` còn cấu hình "integ" thừa.
