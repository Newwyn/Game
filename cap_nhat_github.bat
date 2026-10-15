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
