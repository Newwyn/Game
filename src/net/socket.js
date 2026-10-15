// ============================================================
// KẾT NỐI SERVER (Socket.io)
// ============================================================
// Khi chạy `npm run dev`, Vite (cổng 5173) proxy /socket.io sang server Node (cổng 3000),
// nên io() không cần địa chỉ cụ thể.
import { io } from 'socket.io-client';

// Mã người chơi cố định theo trình duyệt: server dùng để giữ level / bậc / vật phẩm (data/progress.json)
function clientId() {
    try {
        let id = localStorage.getItem('loc.clientId');
        if (!id) { id = 'p-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem('loc.clientId', id); }
        return id;
    } catch { return undefined; }
}
export const socket = io({ auth: { clientId: clientId() } });

/** Các lệnh gửi lên server — gom về một chỗ để dễ tìm */
export const net = {
    queueSkill: (memberIndex, skillIndex) => socket.emit('queueSkill', { memberIndex, skillIndex }),
    toggleAuto: (autoMode) => socket.emit('toggleAuto', { autoMode }),
    togglePause: () => socket.emit('togglePause'),
    setSpeed: (speed) => socket.emit('setSpeed', { speed }),
    requestReset: () => socket.emit('requestReset'),
    debugAction: (type, value) => socket.emit('debugAction', value === undefined ? { type } : { type, value }),
    debugEnemyAction: (type, value, arg) => {
        if (type === 'monsterLevel') {   // arg: '+1' / '-10' (cộng thêm) hoặc '=40' (đặt thẳng)
            const s = String(arg ?? '+0');
            return socket.emit('debugEnemyAction', s.startsWith('=') ? { type, set: Number(s.slice(1)) } : { type, add: Number(s) });
        }
        socket.emit('debugEnemyAction', value === undefined ? { type } : { type, value });
    },
    chooseMode: (mode) => socket.emit('chooseMode', { mode }),
    backToMenu: () => socket.emit('backToMenu'),
};
