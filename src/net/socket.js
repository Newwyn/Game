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

/** Vào server (trang vào game, src/ui/landing.js): kết nối lại kèm mã đăng nhập -> server đổi sang bản lưu của tài khoản
 *  server: 'main' | 'test' · token null = khách (bản lưu theo trình duyệt như cũ) */
export function enterServer(token, server) {
    socket.auth = { clientId: clientId(), ...(token ? { token, server } : {}) };
    socket.disconnect();
    socket.connect();
}

/** Các lệnh gửi lên server — gom về một chỗ để dễ tìm */
export const net = {
    queueSkill: (memberIndex, skillIndex) => socket.emit('queueSkill', { memberIndex, skillIndex }),
    toggleAuto: (value) => socket.emit('toggleAuto', { value }),   // bật / tắt AUTO cho TẤT CẢ tướng
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
    campaignOpen: (chapter) => socket.emit('campaignOpen', chapter ? { chapter } : {}),
    startStage: (data) => socket.emit('startStage', data),
    buyStamina: () => socket.emit('buyStamina'),
    // 🎒 Trang bị + Lò rèn
    gearOpen: () => socket.emit('gearOpen'),
    gearEquip: (hero, itemId) => socket.emit('gearEquip', { hero, itemId }),
    gearUnequip: (hero, slot) => socket.emit('gearUnequip', { hero, slot }),
    gearLock: (itemId) => socket.emit('gearLock', { itemId }),
    gearSalvage: (itemIds) => socket.emit('gearSalvage', { itemIds }),
    gearEnhance: (itemId, charm) => socket.emit('gearEnhance', { itemId, charm }),
    gearRefine: (itemId, line) => socket.emit('gearRefine', { itemId, line }),
    gearDebugGive: (data) => socket.emit('gearDebugGive', data),
    // 🗺️ Bản đồ thế giới
    worldOpen: () => socket.emit('worldOpen'),
    worldMove: (scene, x, y, face, full = false) => socket.emit('worldMove', { scene, x, y, face, full }),
    worldInteract: (scene, target, answer) => socket.emit('worldInteract', { scene, target, answer }),
    // 🏰 Hầm ngục · 🍲 Quán ăn · 🛒 Cửa hàng anh hùng
    extrasOpen: () => socket.emit('extrasOpen'),
    dungeonBuyRun: () => socket.emit('dungeonBuyRun'),
    tavernFeed: (hero, food) => socket.emit('tavernFeed', { hero, food }),
    shopBuy: (hero) => socket.emit('shopBuy', { hero }),
};
