// ============================================================
// ĐỘNG TÁC LYRA (Phong Tiễn) — Xạ Thủ
// ============================================================
// Góc khớp (rad): 0 = buông thẳng xuống, dương = xoay ngược chiều kim đồng hồ (tay đưa ra TRƯỚC), 1.57 = ngang ra trước.
// Tay XA cầm cung (liftF=1: cẳng tay + cung luôn ở trước thân). Hướng cung = torso + armF + foreF + handF:
//   1.57 = cung dựng đứng (ngắm bắn).   bowDir(p, góc) tự tính handF.
// Tay GẦN kéo dây. Bật 'pull' (skinKeys) -> dây cung kéo về điểm kẹp của tay gần + hiện mũi tên trên dây.
import { buildPoseClip } from './poseClip.js';

const BASE = {
    hips: [0, 0], liftF: 1, torso: 0, head: 0,
    armF: 0.35, foreF: 0.35, handF: 0, bow: 0,
    armN: -0.1, foreN: 0.25, handN: 0,
    thighN: 0.12, shinN: -0.06, thighF: -0.12, shinF: 0.04, cape: 0, hairBack: 0, quiver: 0,
};
const bowDir = (p, dir) => ({ ...p, handF: dir - ((p.torso ?? 0) + p.armF + p.foreF) });
const pose = (over) => ({ ...BASE, ...over });

// Đứng chờ: cung cầm nghiêng trước người, tay kia thả lỏng
const IDLE = pose(bowDir({ armF: 0.75, foreF: 0.55, armN: 0.05, foreN: 0.15, thighN: 0.1, shinN: -0.05, thighF: -0.14, shinF: 0.04 }, 1.55));
const IDLE_IN = pose(bowDir({ hips: [0, -0.006], torso: -0.02, head: 0.03, armF: 0.73, foreF: 0.57, armN: 0.02, foreN: 0.2, thighN: 0.13, shinN: -0.09, thighF: -0.14, shinF: 0.04 }, 1.52));

// Thủ thế: hạ trọng tâm, cung đưa ra trước nửa chừng, tay gần đặt sẵn lên dây
const READY = pose(bowDir({ torso: -0.06, head: 0.06, armF: 1.05, foreF: 0.25, armN: -0.55, foreN: 2.35, handN: -0.55,
    thighN: 0.32, shinN: -0.28, thighF: -0.26, shinF: 0.05 }, 1.45));
const READY_IN = pose(bowDir({ ...READY, hips: [0, -0.006], torso: -0.08, armF: 1.02, thighN: 0.35, shinN: -0.32 }, 1.42));

// Kéo căng hết cỡ: tay cung duỗi thẳng ra trước, khuỷu tay gần kéo ra sau ngang vai, kẹp dây sát má
const DRAW = pose(bowDir({ torso: 0.03, head: -0.04, armF: 1.53, foreF: 0.02, armN: -1.62, foreN: 3.55, handN: -0.38,
    thighN: 0.36, shinN: -0.3, thighF: -0.3, shinF: 0.04 }, 1.57));
const DRAW_B = pose(bowDir({ ...DRAW, hips: [0, -0.004], torso: 0.04, armN: -1.66, foreN: 3.6 }, 1.57));
// Nhả dây: tay gần bật ra sau, cung giật nhẹ
const RELEASE = pose(bowDir({ ...DRAW, armN: -1.95, foreN: 2.6, handN: 0.2, armF: 1.6, torso: 0.0 }, 1.62));
const RELEASE_F = pose(bowDir({ ...RELEASE, armN: -1.2, foreN: 1.7, armF: 1.45, foreF: 0.08 }, 1.5));

// Chạy: cung giữ trước người, chạy nhẹ nhàng
const RUN_BODY = bowDir({ torso: -0.15, head: 0.12, armF: 0.75, foreF: 0.4, armN: -0.45, foreN: 0.9 }, 1.3);
const RUN = [
    pose({ ...RUN_BODY, hips: [0, -0.012], thighN: 0.55, shinN: -0.25, thighF: -0.5, shinF: -0.7, armN: -0.65 }),
    pose({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.0, shinN: -0.3, thighF: 0.15, shinF: -1.25, armN: -0.3 }),
    pose({ ...RUN_BODY, hips: [0, -0.012], thighN: -0.5, shinN: -0.7, thighF: 0.55, shinF: -0.25, armN: -0.05 }),
    pose({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.15, shinN: -1.25, thighF: 0.0, shinF: -0.3, armN: -0.3 }),
];

// Rơi / đáp đất (đầu trận)
const FALL = pose(bowDir({ air: true, torso: -0.15, head: 0.15, armF: 0.9, foreF: 0.4, armN: -1.2, foreN: 0.8,
    thighN: 1.2, shinN: -1.7, thighF: 0.7, shinF: -1.5 }, 1.3));
const LAND = pose(bowDir({ hips: [0, -0.12], torso: -0.4, head: 0.35, armF: 0.9, foreF: 0.5, armN: -0.9, foreN: 0.6,
    thighN: 1.4, shinN: -1.9, thighF: -0.1, shinF: -1.7 }, 1.2));
const LAND_HOLD = pose(bowDir({ ...LAND, hips: [0, -0.11], torso: -0.35 }, 1.2));

// Tiễn Gió Chớp: lấy đà -> cuộn người lộn trên không -> bung ra kéo cung bắn -> đáp
const CROUCH = pose(bowDir({ hips: [0, -0.08], torso: -0.35, head: 0.3, armF: 0.8, foreF: 0.5, armN: -0.6, foreN: 1.2,
    thighN: 1.2, shinN: -1.6, thighF: 0.3, shinF: -1.2 }, 1.2));
const TUCK = pose(bowDir({ air: true, torso: -0.3, head: 0.3, armF: 1.3, foreF: 1.0, armN: 0.5, foreN: 1.8,
    thighN: 1.9, shinN: -2.3, thighF: 1.7, shinF: -2.2 }, 2.0));
const AIR_DRAW = pose({ ...DRAW, air: true, thighN: 0.7, shinN: -1.0, thighF: 0.2, shinF: -0.9 });
const AIR_REL = pose({ ...RELEASE, air: true, thighN: 0.6, shinN: -0.9, thighF: 0.1, shinF: -0.8 });

// Gọi Vệ Thần Gió: dang 2 tay, ngửa mặt
const CALL = pose(bowDir({ torso: 0.12, head: -0.22, armF: 2.3, foreF: 0.3, armN: 2.6, foreN: 0.4, handN: 0,
    thighN: 0.2, shinN: -0.1, thighF: -0.2 }, 2.6));
const CALL_B = pose(bowDir({ ...CALL, hips: [0, 0.01], torso: 0.16, head: -0.28, armN: 2.75, armF: 2.4 }, 2.7));

// Trúng đòn / choáng / thắng / chết
const HURT = pose(bowDir({ hips: [-0.03, -0.01], torso: 0.3, head: 0.25, armF: 0.5, foreF: 0.6, armN: 0.3, foreN: 0.5,
    thighN: 0.35, shinN: -0.45, thighF: -0.1 }, 1.0));
const STUN_A = pose(bowDir({ torso: 0.15, head: 0.3, armF: 0.2, foreF: 0.3, armN: 0.2, foreN: 0.3 }, 0.6));
const STUN_B = pose(bowDir({ ...STUN_A, torso: -0.05, head: -0.1 }, 0.7));
const WIN_UP = pose(bowDir({ air: true, hips: [0, 0.06], torso: 0.1, head: -0.1, armF: 2.9, foreF: 0.1, armN: -0.3, foreN: 1.8,
    thighN: 0.5, shinN: -0.9, thighF: -0.2, shinF: -0.5 }, 3.1));
const WIN = pose(bowDir({ torso: 0.06, head: -0.06, armF: 2.85, foreF: 0.1, armN: -0.2, foreN: 1.9, handN: 0.3 }, 3.05));
const WIN_B = pose(bowDir({ ...WIN, hips: [0, -0.006], armF: 2.8 }, 3.0));
const DEAD = pose(bowDir({ air: true, torso: 0.2, head: 0.4, armF: 0.4, foreF: 0.3, armN: 0.3, foreN: 0.3,
    thighN: 0.35, shinN: -0.5, thighF: -0.1, shinF: -0.2 }, 0.8));

export function lyraClips(parts, height) {
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height, { liftPart: 'foreF' });
    return [
        c('idle', [0, 0.9, 1.8], [IDLE, IDLE_IN, IDLE]),
        c('ready', [0, 0.8, 1.6], [READY, READY_IN, READY]),
        c('move', [0, 0.13, 0.26, 0.39, 0.52], [...RUN, RUN[0]]),
        c('fall', [0, 0.3], [FALL, FALL]),
        c('land', [0, 0.06, 0.35, 0.65], [LAND, LAND, LAND_HOLD, IDLE]),
        // bắn thường: đặt tên -> kéo căng -> nhả (hitTime 0.2) -> về thủ thế
        c('attack', [0, 0.1, 0.18, 0.22, 0.34, 0.55], [READY, DRAW, DRAW, RELEASE, RELEASE_F, READY]),
        // Tiễn Gió Chớp (đồng bộ với leapTo 0.62s, lộn 1 vòng 0.12–0.6) — nhả tên ở 0.42
        c('snipe', [0, 0.07, 0.13, 0.3, 0.36, 0.42, 0.5, 0.58, 0.8], [READY, CROUCH, TUCK, TUCK, AIR_DRAW, AIR_REL, AIR_REL, LAND, READY]),
        c('windCall', [0, 0.15, 0.38, 0.6], [READY, CALL, CALL_B, READY]),
        c('cast', [0, 0.25, 0.5], [DRAW, DRAW_B, DRAW]),        // gồng Thần Tiễn (lặp trong lúc niệm)
        c('release', [0, 0.12, 0.2, 0.35, 0.6], [DRAW, DRAW, RELEASE, RELEASE_F, READY]),
        c('hurt', [0, 0.06, 0.18, 0.4], [IDLE, HURT, pose({ ...HURT, torso: 0.2, hips: [-0.015, -0.006] }), IDLE]),
        c('stunned', [0, 0.35, 0.7], [STUN_A, STUN_B, STUN_A]),
        c('victory', [0, 0.2, 0.45, 0.8], [IDLE, WIN_UP, WIN, WIN]),
        c('victoryIdle', [0, 0.9, 1.8], [WIN, WIN_B, WIN]),
        c('dead', [0, 1], [DEAD, DEAD]),
    ];
}

export const DEFAULT_SKINS = { handN: 'fist', eye: 'open', pull: 'off' };
export const SKIN_KEYS = {
    ready: [[0, 'eye', 'determined'], [0, 'handN', 'pinch']],
    move: [[0, 'eye', 'determined']],
    land: [[0, 'eye', 'determined'], [0.5, 'eye', 'open']],
    attack: [[0, 'eye', 'determined'], [0, 'handN', 'pinch'], [0.06, 'pull', 'on'], [0.2, 'pull', 'off'], [0.2, 'handN', 'open'], [0.45, 'handN', 'pinch']],
    snipe: [[0, 'eye', 'angry'], [0.3, 'handN', 'pinch'], [0.33, 'pull', 'on'], [0.42, 'pull', 'off'], [0.42, 'handN', 'open']],
    windCall: [[0, 'eye', 'determined'], [0, 'handN', 'open']],
    cast: [[0, 'eye', 'angry'], [0, 'handN', 'pinch'], [0, 'pull', 'on']],
    release: [[0, 'eye', 'angry'], [0, 'handN', 'pinch'], [0, 'pull', 'on'], [0.16, 'pull', 'off'], [0.16, 'handN', 'open']],
    hurt: [[0.03, 'eye', 'pain'], [0.32, 'eye', 'open']],
    stunned: [[0, 'eye', 'pain'], [0, 'handN', 'open']],
    victory: [[0, 'eye', 'happy'], [0, 'handN', 'fist']],
    victoryIdle: [[0, 'eye', 'happy'], [0, 'handN', 'fist']],
    dead: [[0, 'eye', 'blink'], [0, 'handN', 'open']],
};

export const SECONDARY = {
    hairBack: { speed: -0.06, fall: -0.12, gravity: 0.6, sway: 0.05, phase: 0.2, limit: [-0.9, 0.4], stiff: 35, damp: 5 },
    cape:     { speed: -0.04, fall: -0.08, gravity: 0.6, sway: 0.03, phase: 1.0, limit: [-0.8, 0.3], stiff: 45, damp: 6 },
};

export const LOCOMOTION = { runSpeed: 7, dashSpeed: 99, runClip: 'move', dashClip: 'move' };
