@echo off
chcp 65001 >nul
REM ============================================================
REM  LẤY BẢN MỚI NHẤT TỪ GITHUB VỀ MÁY (https://github.com/Newwyn/Game)
REM  Chỉ TẢI VỀ, không đẩy gì lên. Bấm đúp file này.
REM  An toàn: chỉ cập nhật khi máy không có thay đổi trùng với bản trên GitHub
REM  (git merge --ff-only). Nếu đụng nhau thì dừng, KHÔNG ghi đè file nào.
REM ============================================================
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo.
  echo *** May chua cai Git. Tai tai https://git-scm.com/download/win
  echo.
  pause
  exit /b 1
)
if not exist ".git" (
  echo.
  echo *** Thu muc nay chua noi voi GitHub. Bam dup cap_nhat_github.bat mot lan truoc.
  echo.
  pause
  exit /b 1
)

echo.
echo [1/3] Tai ve tu GitHub...
git fetch origin main
if errorlevel 1 (
  echo.
  echo *** Khong tai duoc tu GitHub. Kiem tra mang roi bam dup lai file nay.
  echo.
  pause
  exit /b 1
)

echo.
echo [2/3] Cac ban moi tren GitHub chua co tren may:
git log --oneline HEAD..origin/main

echo.
echo [3/3] Cap nhat file tren may...
git merge --ff-only origin/main
if errorlevel 1 (
  echo.
  echo *** Chua cap nhat duoc: tren may co thay doi trung voi ban tren GitHub.
  echo     Khong file nao bi ghi de. Chup man hinh nay gui Claude de xu ly.
) else (
  echo.
  echo === Xong! May da giong ban moi nhat tren GitHub ===
)
echo.
pause
