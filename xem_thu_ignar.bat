@echo off
REM ============================================================
REM  Xem thu Ignar kieu sprite: bam dup file nay.
REM  - Chay game o che do phat trien (npm run dev)
REM  - Khoang 8 giay sau tu mo 2 tab: trang xem thu Ignar (lan luot moi dong tac) + game
REM  Dong cua so den nay = tat game.
REM  (Khong mo truc tiep file tools\test-ignar-sprite.html: se ra trang trang)
REM ============================================================
cd /d "%~dp0"
start "" /min cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:5173/tools/test-ignar-sprite.html?auto=1 && start http://localhost:5173/"
npm run dev
