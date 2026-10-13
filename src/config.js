// ============================================================
// HẰNG SỐ DÙNG CHUNG PHÍA CLIENT
// ============================================================

/** 1000 MP = 1 Orb (khớp với server.js) */
export const ORB_COST = 1000;

/** Nhịp tick của server (ms) — dùng để quy đổi hệ số nội suy */
export const SERVER_TICK_MS = 50;

/** Số thành viên tối đa trong đội (số thẻ HUD có sẵn trong index.html) */
export const MAX_SQUAD = 4;

/** Thời gian dấu Ấn Chiếu hiển thị trên đầu mục tiêu (ms) */
export const SEAL_DURATION_MS = 7000;

/**
 * Tốc độ trận (server quyết định, gửi kèm mỗi gói stateUpdate).
 *   speed : 1 | 1.5 | 2 (mức người chơi chọn)     scale : hệ số thời gian so với mức thiết kế x1.5
 *   clock : đồng hồ trận của server (ms) lúc nhận gói gần nhất
 * Mọi animation / hiệu ứng / hẹn giờ phía client nhân với scale để khớp nhịp server.
 */
export const GAME_SPEEDS = [1, 1.5, 2];
export const timeState = { speed: 1, scale: 1 / 1.5, clock: 0, recvAt: 0 };

/** Giờ trận hiện tại (ms) — so sánh với hồi chiêu, castEndTime, endTime của hiệu ứng */
export function gameNow() {
    if (!timeState.recvAt) return Date.now();
    return timeState.clock + (performance.now() - timeState.recvAt) * timeState.scale;
}

/** Hẹn giờ theo thời gian trận (ms trận -> ms thật) */
export function gameTimeout(fn, ms) {
    return setTimeout(fn, ms / Math.max(0.05, timeState.scale));
}

/** Mặt đất nằm ở y = -0.5 (chân nhân vật đặt tại đây) */
export const GROUND_Y = -0.5;
