// ============================================================
// KẾT NỐI SERVER (Socket.io)
// ============================================================
// Khi chạy `npm run dev`, Vite (cổng 5173) proxy /socket.io sang server Node (cổng 3000),
// nên io() không cần địa chỉ cụ thể.
import { io } from 'socket.io-client';

export const socket = io();

/** Các lệnh gửi lên server — gom về một chỗ để dễ tìm */
export const net = {
    queueSkill: (memberIndex, skillIndex) => socket.emit('queueSkill', { memberIndex, skillIndex }),
    toggleAuto: (autoMode) => socket.emit('toggleAuto', { autoMode }),
    togglePause: () => socket.emit('togglePause'),
    setSpeed: (speed) => socket.emit('setSpeed', { speed }),
    requestReset: () => socket.emit('requestReset'),
    debugAction: (type, value) => socket.emit('debugAction', value === undefined ? { type } : { type, value }),
    debugEnemyAction: (type, value) => socket.emit('debugEnemyAction', value === undefined ? { type } : { type, value }),
};
