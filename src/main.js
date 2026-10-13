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

import { mountRenderer } from './core/scene.js';
import { buildEnvironment } from './core/environment.js';
import { cameraRig } from './core/cameraRig.js';
import { timeState } from './config.js';
import { registerCombatEvents } from './combat/events.js';
import { updateViews } from './combat/battleScene.js';
import { updateVfx } from './vfx/vfx.js';
import { updateHUD } from './ui/hud.js';
import { registerOverlayEvents, enterBattleUI, showWaiting } from './ui/overlays.js';
import { setupInput, applyPreferredSpeed, updateSpeedButton, renderMemberToggles } from './ui/input.js';
import { socket } from './net/socket.js';
import { myId } from './state.js';

mountRenderer(document.getElementById('game-container'));
buildEnvironment();
setupInput();
registerOverlayEvents();
registerCombatEvents({
    onWaiting: (data) => showWaiting(data.message),
    onBattleStart: (data) => {
        enterBattleUI(data); updateHUD(data.players); applyPreferredSpeed();
        renderMemberToggles(data.classDefs, data.players?.[myId()]?.disabledClasses);
    },
    onSpeed: (speed) => updateSpeedButton(speed),
    onState: (players) => updateHUD(players),
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
