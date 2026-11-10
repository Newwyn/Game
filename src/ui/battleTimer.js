// ============================================================
// ⏱️ ĐỒNG HỒ ẢI — mỗi ải tối đa 3 phút (server: battleTimer { limitMs, leftMs } mỗi giây; hết giờ = thua)
//   Hiện dưới tên ải ở đầu màn hình · còn 30 giây: đỏ · còn 10 giây: nhấp nháy · ẩn khi hết trận / về menu
// ============================================================
import { socket } from '../net/socket.js';
import '../styles/battleTimer.css';

let el = null;
function box() {
    if (el) return el;
    el = document.createElement('div');
    el.id = 'battle-timer';
    el.setAttribute('aria-live', 'off');
    document.body.appendChild(el);
    return el;
}
const fmt = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function hide() { if (el) el.className = ''; }

export function setupBattleTimer() {
    socket.on('battleTimer', ({ leftMs, limitMs } = {}) => {
        if (leftMs == null) return;
        const b = box();
        b.textContent = `⏱ ${fmt(leftMs)}`;
        b.title = `Mỗi ải tối đa ${Math.round((limitMs ?? 180000) / 60000)} phút — hết giờ là thua`;
        b.className = `on${leftMs <= 30000 ? ' low' : ''}${leftMs <= 10000 ? ' crit' : ''}`;
    });
    for (const ev of ['battleEnd', 'mainMenu', 'stageResult', 'campaignState']) socket.on(ev, hide);
    socket.on('battleStart', (d) => { if (d?.mode !== 'campaign') hide(); });
}
