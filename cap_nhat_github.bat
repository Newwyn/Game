@echo off
chcp 65001 >nul
REM ============================================================
REM  Đẩy toàn bộ dự án lên GitHub (https://github.com/Newwyn/Game)
REM  Bấm đúp file này: dọn file cũ không dùng nữa rồi commit + push.
REM  Thư mục tải bằng ZIP (chưa có .git): lần đầu tự nối với GitHub, giữ nguyên file trên máy.
REM ============================================================
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo.
  echo *** May chua cai Git. Tai tai https://git-scm.com/download/win
  echo     Cai xong - bam Next het - roi bam dup lai file nay.
  echo.
  pause
  exit /b 1
)

if not exist ".git" (
  echo.
  echo [0/4] Lan dau: noi thu muc nay voi GitHub - giu nguyen file tren may...
  git init -q
  git remote add origin https://github.com/Newwyn/Game.git
  git fetch -q origin main
  if errorlevel 1 (
    rmdir /s /q .git
    echo.
    echo *** Khong tai duoc tu GitHub. Kiem tra mang roi bam dup lai file nay.
    echo.
    pause
    exit /b 1
  )
  git reset -q origin/main
  git branch -M main
  git branch -q -u origin/main
)

REM Ten + email ghi trong commit: may moi chua co thi dung ten tai khoan GitHub cu
git config user.name >nul 2>&1
if errorlevel 1 git config user.name "newwyn"
git config user.email >nul 2>&1
if errorlevel 1 git config user.email "newwyn2410@gmail.com"

echo.
echo [1/4] Don cac file cu khong con dung (3D, sprite cu, public/, tool 3D, model Tripo)...
for %%F in (
  "src\characters\ModelCharacterView.js"
  "src\characters\SpriteCharacterView.js"
  "src\characters\cutout\sideClips.js"
  "src\render\chromaKeyMaterial.js"
  "src\ui\movement.js"
  "tools\export-glb.mjs"
  "tools\preview-glb.html"
  "tools\preview-rig.html"
  "tools\preview.html"
  "tools\preview.js"
  "tools\rig_character.py"
  "src\assets\sprites\ignar_fx.png"
  "src\vfx\ignarFx.json"
  "src\assets\sprites\nerissa_fx.png"
  "src\vfx\nerissaFx.json"
  "src\characters\cutout\rokRig.js"
  "src\characters\cutout\rokAtlas.json"
  "src\assets\sprites\rok_atlas.png"
  "tools\fx-lion.html"
  "tools\fx-guardian.html"
  "Claude outputs\ignar_hieu_ung_khung_chinh-1.jpg"
  "Claude outputs\ignar_hieu_ung_moi-1.mp4"
  "Claude outputs\ignar_sprite_3_cach_dung-1.gif"
  "Claude outputs\ignar_sprite_soi_khung-1.png"
  "Claude outputs\ignar_sprite_vs_khungxuong_phongto-1.gif"
  "Claude outputs\nerissa_hieu_ung_moi-1.mp4"
  "Claude outputs\nerissa_sprite_moi_dong_tac-1.mp4"
  "src\assets\sprites\ignar_sprite.png"
  "src\assets\sprites\ignar_fx2.png"
  "make_gdd_word.js"
  "PROJECT_PLAN.md"
  "PHOI_HOP_AI.md"
  "BAN_GIAO_CLAUDE.md"
  "BAN_GIAO_CODEX.md"
) do if exist %%F del /q %%F
for %%D in (
  "src\animation"
  "src\characters\models"
  "src\assets\models"
  "public"
  "art\assassin"
  "tools\__pycache__"
  "tools\sprite-test"
) do if exist %%D rmdir /s /q %%D

echo.
echo [2/4] Kiem tra thay doi...
REM dist/ la ket qua build (da nam trong .gitignore) -> go khoi GitHub, van giu tren may
git rm -r -q --cached dist >nul 2>&1
git add -A
git status --short

echo.
echo [3/4] Tao commit (khong can go gi)...
REM Mo ta lay tu mo_ta_cap_nhat.txt (Claude ghi san moi lan sua game; chi tiet trong NHAT_KY_CAP_NHAT.md).
REM Khong co file do -> mo ta mac dinh theo ngay gio.
if exist "mo_ta_cap_nhat.txt" (
  git reset -q -- mo_ta_cap_nhat.txt >nul 2>&1
  git commit -q -F "mo_ta_cap_nhat.txt"
  if not errorlevel 1 del /q "mo_ta_cap_nhat.txt"
) else (
  git commit -q -m "Cap nhat %date% %time%" -m "Chi tiet: xem NHAT_KY_CAP_NHAT.md" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
)
git log -1 --pretty=format:"   Commit: %%s"
echo.

echo.
echo [4/4] Day len GitHub...
git push origin main
if errorlevel 1 (
  echo.
  echo *** Push loi. Neu GitHub hoi dang nhap, hay dang nhap trong cua so hien ra roi chay lai file nay.
) else (
  echo.
  echo === Xong! Xem tai https://github.com/Newwyn/Game ===
)
echo.
pause
