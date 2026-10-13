// ============================================================
// TRẠNG THÁI CLIENT DÙNG CHUNG GIỮA CÁC MODULE
// ============================================================
import { socket } from './net/socket.js';

export const game = {
    /** Dữ liệu phòng mới nhất từ server ({ players, classDefs, ... }) */
    roomData: null,
    /** Định nghĩa lớp nhân vật (chỉ số, skill, hitFrame) — server gửi khi bắt đầu trận */
    classDefs: null,
    /** playerId -> CharacterView[] (theo thứ tự trong squad) */
    views: {},
    /** 'left' | 'right' — phe của người chơi này */
    mySide: 'left',
    /** Camera combat đã chuyển sang ôm cả hai phe chưa */
    cameraEngaged: false,
};

export const myId = () => socket.id;

export function getView(playerId, index) {
    return game.views[playerId]?.[index] ?? null;
}

export function opponentIdOf(playerId) {
    if (!game.roomData?.players) return null;
    return Object.keys(game.roomData.players).find(id => id !== playerId) ?? null;
}

export function forEachView(fn) {
    Object.entries(game.views).forEach(([playerId, list]) => list.forEach((v, i) => fn(v, playerId, i)));
}
