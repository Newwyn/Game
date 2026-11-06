// ============================================================
// LEGEND OF CAPSULES — ĐIỂM KHỞI ĐỘNG CLIENT
// ============================================================
// Cấu trúc thư mục src/:
//   core/        scene, camera, renderer, camera rig (bám theo + rung)
//   net/         kết nối Socket.io
//   characters/  CharacterView + CutoutCharacterView (2D ghép mảnh) + registry
//   render/      shader
//   vfx/         hiệu ứng: số sát thương, chém, phi tiêu, Ấn Chiếu
//   combat/      dựng trận + xử lý sự kiện chiến đấu từ server
//   ui/          HUD, overlay, input
// CSS được nạp qua <link> trong index.html (tránh nháy giao diện khi tải)

import { mountRenderer, renderer } from './core/scene.js';
import { runLoadingScreen } from './ui/loading.js';
import { buildEnvironment } from './core/environment.js';
import { cameraRig } from './core/cameraRig.js';
import { timeState } from './config.js';
import { registerCombatEvents } from './combat/events.js';
import { updateViews } from './combat/battleScene.js';
import { updateVfx } from './vfx/vfx.js';
import { updateHUD, resetMemberAuto } from './ui/hud.js';
import { registerOverlayEvents, enterBattleUI, showWaiting } from './ui/overlays.js';
import { setupInput, applyPreferredSpeed, updateSpeedButton, renderMemberToggles, resetDebugToggles, applyStatsPreference } from './ui/input.js';
import { socket } from './net/socket.js';
import { setupProgressTool } from './ui/progressTool.js';
import { setupSquadSelect } from './ui/squadSelect.js';
import { setupModeMenu } from './ui/modeMenu.js';
import { setupCampaign } from './ui/campaign.js';
import { setupGear } from './ui/gear.js';
import { setupWorld } from './ui/world.js';
import { setupExtras } from './ui/extras.js';
import { myId } from './state.js';

mountRenderer(document.getElementById('game-container'));
// ⏳ tải trước mọi tranh (thanh %), đẩy sẵn lên card đồ hoạ -> vào trận không khựng
runLoadingScreen(renderer);
buildEnvironment();
setupInput();
registerOverlayEvents();
registerCombatEvents({
    onWaiting: (data) => showWaiting(data.message),
    onBattleStart: (data) => {
        resetMemberAuto();   // AUTO từng tướng: gửi lại lựa chọn đã nhớ cho trận mới
        // Chế độ: ĐẤU / CỐT TRUYỆN -> ẩn mọi tool test (CSS body.mode-duel)
        const duel = data.mode === 'duel_monster' || data.mode === 'duel_hero' || data.mode === 'campaign' || data.mode === 'prologue';
        // Cốt truyện: AUTO chỉ có khi đã mở (qua ải 2)
        document.body.classList.toggle('no-auto', data.mode === 'campaign' && !(data.features ?? []).includes('auto'));
        document.body.classList.toggle('mode-duel', duel);
        if (duel) resetDebugToggles();
        applyStatsPreference();   // Đấu: ẩn bảng chỉ số mặc định (phím I để hiện, nhớ lựa chọn)
        enterBattleUI(data); updateHUD(data.players); applyPreferredSpeed();
        if (data.mode === 'prologue') {
            const badge = document.querySelector('.top-label');
            if (badge) badge.textContent = '✴️ MỞ MÀN · ĐẤU THẦN';
        }
        if (data.mode === 'campaign') {
            const badge = document.querySelector('.top-label');
            if (badge) {
                const st = data.stage;
                badge.textContent = st ? `📖 ẢI ${st.no ?? ''} · ${(st.name ?? 'CỐT TRUYỆN').toUpperCase()}` : '📖 CỐT TRUYỆN';
            }
        }
        renderMemberToggles(data.classDefs, data.players?.[myId()]?.disabledClasses);
    },
    onSpeed: (speed) => updateSpeedButton(speed),
    onState: (players) => updateHUD(players),
});

// 📈 Tool Nhân Vật (level / bậc / tộc)
setupProgressTool();
// ⚔️ Chọn đội hình trước trận (1-4 nhân vật)
setupSquadSelect();
// 📖 Chế độ Cốt truyện (chọn ải + kết quả)
setupCampaign();
// 🎒 Trang bị + Lò rèn (mở từ màn chọn ải)
setupGear();
// 🗺️ Bản đồ thế giới (nơi xuất phát của Cốt truyện)
setupWorld();
// 🏰 Hầm ngục · Quán ăn · Cửa hàng anh hùng
setupExtras();
// 🏠 Chọn chế độ (Cốt truyện / Test / Đấu) — đăng ký SAU bảng chọn đội để hiện đè lên
setupModeMenu();
// Tool phe quái: cấp quái hiện tại
socket.on('monsterLevel', (d) => {
    const a = document.getElementById('monster-level-label'), b = document.getElementById('monster-level-big');
    if (a) a.textContent = `Lv${d.level}`;
    if (b) b.textContent = d.level;
});

// Trùm vào giai đoạn 2 (P5): băng chữ giữa màn hình 2,5 giây
socket.on('bossPhase', (d) => {
    const el = document.createElement('div');
    el.className = 'boss-phase-banner';
    el.innerHTML = `<b>💢 ${d.name}</b><small>${d.text ?? ''}</small>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
});

// Server xác nhận danh sách nhân vật bị tắt (sau khi bấm nút bật/tắt)
socket.on('memberToggles', (d) => renderMemberToggles(null, d.disabled));

// ------------------------------------------------------------
// Vòng lặp render — mọi chuyển động dùng dt thật (giây)
// ------------------------------------------------------------
let lastTime = performance.now();
function frame(now) {
    requestAnimationFrame(frame);
    // Giới hạn 0.1s: chuyển tab rồi quay lại không bị "tua nhanh"
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Hiệu ứng + động tác chạy theo tốc độ trận (x1 / x1.5 / x2); camera dùng thời gian thật
    updateVfx(dt * timeState.scale);
    updateViews(dt);   // cập nhật nhân vật + điểm camera bám theo
    cameraRig.update(dt);
    cameraRig.render();
}
requestAnimationFrame(frame);
