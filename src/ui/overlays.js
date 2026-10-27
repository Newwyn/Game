// ============================================================
// OVERLAY — màn hình chờ, đếm ngược, tạm dừng, kết quả trận
// ============================================================
import { socket } from '../net/socket.js';
import { myId } from '../state.js';
import { playBeep } from '../audio/sfx.js';

const $ = (id) => document.getElementById(id);

export function showWaiting(message) {
    $('loading-text').textContent = message;
}

/** Gọi khi trận bắt đầu: ẩn màn chờ và các hộp thoại, hiện HUD */
export function enterBattleUI(data) {
    const loading = $('loading-screen');
    loading.style.opacity = '0';
    setTimeout(() => { loading.style.display = 'none'; }, 500);
    $('battle-result').style.display = 'none';
    $('pause-menu').style.display = 'none';
    $('combat-hud').style.display = 'flex';
    $('top-bar').style.display = 'flex';

    const badge = document.querySelector('.top-label');
    if (badge) {
        const hasNPC = Object.values(data.players).some(p => p.isNPC);
        badge.textContent = data.mode === 'duel_monster' ? '⚔️ ĐẤU · VỚI QUÁI'
            : data.mode === 'duel_hero' ? '⚔️ ĐẤU · 1P vs 2P'
            : hasNPC ? '🧪 TEST MODE' : '⚔️ PVP BATTLE';
    }
}

export function hideBattleResult() {
    $('battle-result').style.display = 'none';
    $('pause-menu').style.display = 'none';
}

export function isBattleResultOpen() {
    const el = $('battle-result');
    return !!el && el.style.display !== 'none' && el.style.display !== '';
}

function onCountdown(data) {
    const overlay = $('countdown-overlay');
    const text = $('countdown-text');
    overlay.style.display = 'flex';
    if (data.count === 'START') {
        text.textContent = 'CHIẾN!';
        playBeep(800, 'square', 0.5);
        setTimeout(() => { overlay.style.display = 'none'; }, 1000);
    } else {
        text.textContent = data.count;
        playBeep(400, 'square', 0.1);
    }
}

/** Luật Sinh Tử bắt đầu (1 đấu 1 quá 15s): chữ lớn giữa màn hình 1,6s (dùng chung khung chữ đếm ngược) */
function onSuddenDeath(data) {
    if (data.kind !== 'start') return;
    const overlay = $('countdown-overlay');
    const text = $('countdown-text');
    overlay.style.display = 'flex';
    text.textContent = '⚔️ SINH TỬ!';
    playBeep(300, 'sawtooth', 0.4);
    setTimeout(() => { if (text.textContent === '⚔️ SINH TỬ!') overlay.style.display = 'none'; }, 1600);
}

function onPauseState(data) {
    const pauseMenu = $('pause-menu');
    const container = $('game-container');
    const btn = $('btn-pause');
    if (data.paused && data.isBotMatch) {
        pauseMenu.style.display = 'flex';
    } else if (data.paused) {
        // Trận online: chỉ làm mờ màn hình
        container.style.filter = 'blur(5px)';
        if (btn) btn.textContent = '▶ Tiếp tục trận';
    } else {
        pauseMenu.style.display = 'none';
        container.style.filter = 'none';
        if (btn) btn.textContent = '⏸ PAUSE';
    }
}

function onBattleEnd(data) {
    const isWin = data.winnerId === myId();
    const resultEl = $('battle-result');
    resultEl.style.display = 'flex';
    if (data.draw) {
        // cả 2 bên cùng gục trong cùng 1 nhịp -> HOÀ
        const t = resultEl.querySelector('.result-text');
        if (t) { t.textContent = '🤝 HOÀ!'; t.style.color = '#e2e8f0'; }
        const sub = $('result-subtext');
        if (sub) sub.textContent = 'Cả hai đội cùng gục ngã trong cùng một khoảnh khắc.';
        const retry = $('btn-retry');
        if (retry) {
            retry.innerHTML = '<span>🔄</span> Đấu Lại';
            retry.style.background = 'linear-gradient(135deg, #64748b, #475569)';
            retry.style.boxShadow = '0 8px 25px rgba(100, 116, 139, 0.6)';
        }
        return;
    }

    const textEl = resultEl.querySelector('.result-text');
    if (textEl) {
        textEl.textContent = isWin ? '🏆 CHIẾN THẮNG!' : '💀 THẤT BẠI!';
        textEl.style.color = isWin ? '#ffd700' : '#ef4444';
    }
    const sub = $('result-subtext');
    if (sub) {
        sub.textContent = isWin
            ? 'Tuyệt vời! Đội hình của bạn đã tiêu diệt toàn bộ đối thủ.'
            : 'Đội hình của bạn đã bị tiêu diệt hoàn toàn trong giao tranh.';
    }
    const retry = $('btn-retry');
    if (retry) {
        retry.innerHTML = isWin ? '<span>⚔️</span> Tiếp Tục Trận Mới' : '<span>🔄</span> Thử Lại (Chơi Lại Trận Này)';
        retry.style.background = isWin ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #e11d48, #be123c)';
        retry.style.boxShadow = isWin ? '0 8px 25px rgba(16, 185, 129, 0.6)' : '0 8px 25px rgba(225, 29, 72, 0.6)';
    }
}

export function registerOverlayEvents() {
    socket.on('countdown', onCountdown);
    socket.on('suddenDeath', onSuddenDeath);
    socket.on('pauseState', onPauseState);
    socket.on('battleEnd', onBattleEnd);
}
