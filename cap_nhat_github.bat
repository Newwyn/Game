@echo off
chcp 65001 >nul
REM ============================================================
REM  Đẩy toàn bộ dự án lên GitHub (https://github.com/Newwyn/Game)
REM  Bấm đúp file này. Lần đầu: dọn file cũ không dùng nữa rồi commit + push.
REM ============================================================
cd /d "%~dp0"

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
  "make_gdd_word.js"
  "PROJECT_PLAN.md"
) do if exist %%F del /q %%F
for %%D in (
  "src\animation"
  "src\characters\models"
  "src\assets\models"
  "public"
  "art\assassin"
  "tools\__pycache__"
) do if exist %%D rmdir /s /q %%D

echo.
echo [2/4] Kiem tra thay doi...
git add -A
git status --short

echo.
echo [3/4] Tao commit...
git commit -m "Rok (Thiet Ho) hoan thien + tai lieu v3.0" -m "- Rok: sua ty le than, tay chan, kiem to hon; don bo doc ve qua dau khong che mat" -m "- Ky nang Rok: Su Tu Gam (linh hon su tu, -10%% thu), Day Khien (hat vang + choang 1s), Dung Khien (Aura Thiet Ve, ca doi +20%% thu)" -m "- Danh thu: bat/tat tung nhan vat, quai bat tu, phong to/thu nho bang, chi click de dung ky nang" -m "- Tai lieu: viet lai DOCUMENTATION.md, README, file Word GDD; xoa file 3D/sprite cu" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

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
