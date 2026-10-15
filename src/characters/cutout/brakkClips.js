// ============================================================
// ĐỘNG TÁC BRAKK (Cuồng Đấu) — Chiến Binh đô vật, tộc Dragon
// ============================================================
// Góc khớp (rad): 0 = buông thẳng xuống, dương = đưa ra TRƯỚC (thân/đầu: dương = ngả ra SAU).
// Tư thế REST = đúng dáng tranh gốc (art/brakk/01-character.png).
// Mỗi bước giữa 2 khoá của một khớp phải < π (nội suy quaternion đi đường ngắn) -> giơ tay qua đầu có khoá trung gian.
// Kỹ năng:  Bá Vương Quật -> grab (đập ở 0.8s)   Chấn Địa -> charge (niệm, lặp) + stomp (0.4s)
//           Thần Lực Khổng Lồ -> roar (0.3s)      đòn đánh thường hất tung (khổng lồ) -> uplift (0.2s)
import { buildPoseClip } from './poseClip.js';
import { REST } from './brakkBones.js';

const R = REST;
const BASE = { hips: [0, 0], torso: 0, head: 0, tail: 0, ...REST };
const pose = (over) => ({ ...BASE, ...over });

// Đứng: dáng tranh gốc, thở mạnh (ngực phồng)
const IDLE = pose({});
const IDLE_IN = pose({ hips: [0, -0.005], torso: 0.02, head: -0.02, armN: R.armN - 0.05, foreN: R.foreN + 0.05, armF: R.armF + 0.05, tail: 0.06 });

// Thủ thế đô vật: khuỵu thấp, hai nắm đấm đưa trước ngực
const READY = pose({ hips: [0, -0.02], torso: -0.12, head: 0.1, armN: 0.15, foreN: 1.75, armF: 0.45, foreF: 1.5,
    thighN: 0.42, shinN: -0.45, thighF: -0.28, shinF: -0.1, tail: 0.12 });
const READY_IN = pose({ ...READY, hips: [0, -0.026], torso: -0.15, head: 0.13, armN: 0.12, foreN: 1.8, armF: 0.42, thighN: 0.46, shinN: -0.5 });

// Chạy nặng nề: đổ người, hai tay vung đối nhau
const RUN_BODY = { torso: -0.22, head: 0.16, foreN: 1.4, foreF: 1.3 };
const RUN = [
    pose({ ...RUN_BODY, hips: [0, -0.014], thighN: 0.6, shinN: -0.3, thighF: -0.5, shinF: -0.75, armN: -0.55, armF: 0.65, tail: -0.15 }),
    pose({ ...RUN_BODY, hips: [0, 0.012], thighN: 0.05, shinN: -0.3, thighF: 0.15, shinF: -1.25, armN: 0.0, armF: 0.1, tail: -0.3 }),
    pose({ ...RUN_BODY, hips: [0, -0.014], thighN: -0.5, shinN: -0.75, thighF: 0.6, shinF: -0.3, armN: 0.6, armF: -0.5, tail: -0.15 }),
    pose({ ...RUN_BODY, hips: [0, 0.012], thighN: 0.15, shinN: -1.25, thighF: 0.05, shinF: -0.3, armN: 0.0, armF: 0.1, tail: -0.3 }),
];

// Rơi xuống đầu trận / đáp đất (đáp nặng, nứt đất)
const FALL = pose({ air: true, torso: -0.1, head: 0.1, armN: 1.2, foreN: 1.2, armF: 1.4, foreF: 1.0, thighN: 1.0, shinN: -1.5, thighF: 0.5, shinF: -1.3, tail: 0.4 });
const LAND = pose({ hips: [0, -0.12], torso: -0.45, head: 0.38, armN: 0.9, foreN: 0.3, armF: 0.4, foreF: 0.2,
    thighN: 1.35, shinN: -1.85, thighF: -0.15, shinF: -1.6, tail: 0.3 });
const LAND_HOLD = pose({ ...LAND, hips: [0, -0.11], torso: -0.4 });

// Đánh thường: đấm móc tay gần (thu nắm đấm về -> phóng thẳng ra trước)
const PUNCH_WIND = pose({ hips: [-0.015, -0.02], torso: 0.05, head: 0.05, armN: -0.75, foreN: 2.0, armF: 0.75, foreF: 1.2,
    thighN: 0.35, shinN: -0.4, thighF: -0.25, shinF: -0.05, tail: 0.15 });
const PUNCH_HIT = pose({ hips: [0.035, -0.025], torso: -0.3, head: 0.22, armN: 1.45, foreN: 0.1, armF: -0.2, foreF: 1.6,
    thighN: 0.6, shinN: -0.55, thighF: -0.45, shinF: -0.05, tail: 0.25 });
const PUNCH_FOLLOW = pose({ ...PUNCH_HIT, hips: [0.03, -0.024], torso: -0.26, armN: 1.3, foreN: 0.25 });

// Đánh thường KHỔNG LỒ (hất tung): hạ thấp -> móc ngược nắm đấm từ dưới lên trời
const UP_LOW = pose({ hips: [0, -0.05], torso: -0.35, head: 0.25, armN: -0.6, foreN: 0.3, armF: 0.6, foreF: 1.4,
    thighN: 0.8, shinN: -0.95, thighF: -0.35, shinF: -0.3, tail: 0.3 });
const UP_MID = pose({ hips: [0.02, -0.01], torso: -0.05, head: 0.05, armN: 1.2, foreN: 1.1, armF: 0.2, foreF: 1.4,
    thighN: 0.45, shinN: -0.4, thighF: -0.35, shinF: -0.1, tail: 0.1 });
const UP_HIT = pose({ dropN: 1, hips: [0.03, 0.01], torso: 0.2, head: -0.2, armN: 1.97, foreN: 0.0, armF: -0.3, foreF: 1.2,
    thighN: 0.3, shinN: -0.2, thighF: -0.45, shinF: -0.1, tail: -0.1 });

// K1 Bá Vương Quật: vồ tới túm -> nhảy vọt lên, giơ địch qua đầu -> quật mạnh xuống đất trước mặt
const GRAB_REACH = pose({ hips: [0.03, -0.04], torso: -0.5, head: 0.35, armN: 1.3, foreN: 0.35, armF: 1.45, foreF: 0.3,
    thighN: 0.85, shinN: -0.75, thighF: -0.55, shinF: -0.15, tail: 0.3 });
const GRAB_PULL = pose({ hips: [0, -0.06], torso: -0.15, head: 0.1, armN: 1.9, foreN: 0.9, armF: 2.0, foreF: 0.9,
    thighN: 1.0, shinN: -1.3, thighF: 0.2, shinF: -1.1, tail: 0.3 });
const GRAB_UP = pose({ dropN: 1, air: true, hips: [0, 0.08], torso: 0.12, head: -0.18, armN: 3.0, foreN: 0.25, armF: 3.05, foreF: 0.2,
    thighN: 0.6, shinN: -1.3, thighF: -0.1, shinF: -0.9, tail: -0.4 });
const GRAB_TOP = pose({ dropN: 1, air: true, hips: [0.02, 0.1], torso: 0.22, head: -0.25, armN: 3.35, foreN: 0.35, armF: 3.4, foreF: 0.3,
    thighN: 0.9, shinN: -1.6, thighF: 0.3, shinF: -1.4, tail: -0.5 });
const GRAB_DOWN = pose({ air: true, hips: [0.05, 0.04], torso: -0.35, head: 0.25, armN: 2.1, foreN: 0.1, armF: 2.15, foreF: 0.1,
    thighN: 1.1, shinN: -1.3, thighF: 0.2, shinF: -1.0, tail: 0.1 });
const SLAM = pose({ hips: [0.06, -0.12], torso: -0.7, head: 0.5, armN: 1.05, foreN: 0.1, armF: 1.1, foreF: 0.1,
    thighN: 1.4, shinN: -1.75, thighF: -0.2, shinF: -1.55, tail: 0.5 });
const SLAM_HOLD = pose({ ...SLAM, hips: [0.06, -0.11], torso: -0.62, head: 0.45, armN: 1.0 });

// K2 Chấn Địa: niệm — hạ trọng tâm, hai tay siết nắm đấm gồng lên (lặp) -> nhảy lên -> dậm cả hai chân xuống
const CHARGE = pose({ hips: [0, -0.06], torso: -0.05, head: 0.1, armN: -0.35, foreN: 2.15, armF: 0.35, foreF: 2.0,
    thighN: 0.85, shinN: -1.0, thighF: -0.55, shinF: -0.35, tail: 0.25 });
const CHARGE_B = pose({ ...CHARGE, hips: [0, -0.07], torso: -0.02, armN: -0.4, foreN: 2.25, armF: 0.3, foreF: 2.1, thighN: 0.9, shinN: -1.1 });
// lấy đà: khuỵu sâu -> bật cao (co gối, tay vung lên) -> trên đỉnh duỗi chân, hai tay giơ cao -> dậm cả người xuống
const STOMP_CROUCH = pose({ hips: [0, -0.1], torso: -0.3, head: 0.25, armN: -0.6, foreN: 1.4, armF: -0.3, foreF: 1.3,
    thighN: 1.3, shinN: -1.6, thighF: 0.5, shinF: -1.5, tail: 0.4 });
const STOMP_UP = pose({ air: true, hips: [0, 0.06], torso: 0.1, head: -0.12, armN: 2.0, foreN: 1.3, armF: 2.1, foreF: 1.2,
    thighN: 1.3, shinN: -1.5, thighF: 0.6, shinF: -1.6, tail: -0.3 });
const STOMP_APEX = pose({ dropN: 1, air: true, hips: [0, 0.06], torso: 0.18, head: -0.2, armN: 2.9, foreN: 0.5, armF: 2.95, foreF: 0.45,
    thighN: 0.5, shinN: -0.4, thighF: -0.2, shinF: -0.3, tail: -0.5 });
const STOMP_HIT = pose({ hips: [0, -0.1], torso: -0.35, head: 0.3, armN: 0.75, foreN: 0.35, armF: 0.8, foreF: 0.3,
    thighN: 1.0, shinN: -1.2, thighF: -0.8, shinF: -0.5, tail: 0.45 });

// K3 Thần Lực Khổng Lồ: ưỡn ngực gầm lên, hai cánh tay gồng cơ bắp (tư thế "double biceps")
const ROAR_IN = pose({ hips: [0, -0.04], torso: -0.3, head: 0.25, armN: -0.2, foreN: 2.2, armF: 0.2, foreF: 2.1,
    thighN: 0.6, shinN: -0.65, thighF: -0.45, shinF: -0.2, tail: 0.2 });
const ROAR = pose({ hips: [0, 0.0], torso: 0.22, head: -0.35, armN: 0.5, foreN: 2.05, armF: 0.75, foreF: 1.95,
    thighN: 0.4, shinN: -0.3, thighF: -0.45, shinF: -0.05, tail: -0.3 });
const ROAR_B = pose({ ...ROAR, torso: 0.26, head: -0.4, armN: 0.55, foreN: 2.15, armF: 0.8, foreF: 2.05 });

// Trúng đòn / choáng
const HURT = pose({ hips: [-0.03, -0.012], torso: 0.25, head: 0.2, armN: -0.3, foreN: 1.2, armF: 0.6, foreF: 1.0,
    thighN: 0.3, shinN: -0.4, thighF: -0.15, tail: 0.35 });
const STUN_A = pose({ torso: 0.12, head: 0.3, armN: -0.2, foreN: 0.5, armF: 0.3, foreF: 0.4, tail: -0.2 });
const STUN_B = pose({ ...STUN_A, torso: -0.06, head: -0.1 });

// Thắng: gồng tay khoe cơ (tay gần giơ nắm đấm, tay xa giơ ngón cái)
const WIN_UP = pose({ air: true, hips: [0, 0.05], torso: 0.1, head: -0.15, armN: 0.7, foreN: 2.1, armF: 1.3, foreF: 1.0,
    thighN: 0.4, shinN: -0.8, thighF: -0.2, shinF: -0.5, tail: -0.2 });
const WIN = pose({ torso: 0.12, head: -0.15, armN: 0.65, foreN: 2.2, armF: 1.35, foreF: 1.0, tail: 0.3 });
const WIN_B = pose({ ...WIN, hips: [0, -0.005], torso: 0.15, foreN: 2.3, tail: 0.15 });

const DEAD = pose({ air: true, torso: 0.2, head: 0.4, armN: 0.3, foreN: 0.4, armF: 0.4, foreF: 0.3,
    thighN: 0.3, shinN: -0.5, thighF: -0.1, shinF: -0.2, tail: -0.4 });

export function brakkClips(parts, height) {
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height);
    return [
        c('idle', [0, 1.1, 2.2], [IDLE, IDLE_IN, IDLE]),
        c('ready', [0, 0.85, 1.7], [READY, READY_IN, READY]),
        c('move', [0, 0.15, 0.3, 0.45, 0.6], [...RUN, RUN[0]]),
        c('fall', [0, 0.3], [FALL, FALL]),
        c('land', [0, 0.06, 0.35, 0.7], [LAND, LAND, LAND_HOLD, IDLE]),
        c('attack', [0, 0.12, 0.2, 0.32, 0.55], [READY, PUNCH_WIND, PUNCH_HIT, PUNCH_FOLLOW, READY]),            // đấm (hit 0.2)
        c('uplift', [0, 0.1, 0.16, 0.22, 0.4, 0.62], [READY, UP_LOW, UP_MID, UP_HIT, UP_HIT, READY]),            // móc ngược hất tung (hit 0.2)
        c('grab', [0, 0.12, 0.24, 0.4, 0.62, 0.78, 0.85, 1.05, 1.3],
            [READY, GRAB_REACH, GRAB_PULL, GRAB_UP, GRAB_TOP, GRAB_DOWN, SLAM, SLAM_HOLD, READY]),                 // vồ -> nhảy vọt nhấc qua đầu -> quật (hit 0.85)
        c('charge', [0, 0.25, 0.5], [CHARGE, CHARGE_B, CHARGE]),                                                 // niệm Chấn Địa (lặp)
        c('stomp', [0, 0.1, 0.25, 0.45, 0.6, 0.8, 1.05], [CHARGE, STOMP_CROUCH, STOMP_UP, STOMP_APEX, STOMP_HIT, STOMP_HIT, READY]), // bật cao -> dậm (hit 0.6)
        c('roar', [0, 0.15, 0.3, 0.55, 0.8], [READY, ROAR_IN, ROAR, ROAR_B, READY]),                             // hoá khổng lồ (hit 0.3)
        c('hurt', [0, 0.06, 0.18, 0.4], [IDLE, HURT, pose({ ...HURT, torso: 0.18, hips: [-0.015, -0.006] }), IDLE]),
        c('stunned', [0, 0.35, 0.7], [STUN_A, STUN_B, STUN_A]),
        c('victory', [0, 0.2, 0.45, 0.8], [IDLE, WIN_UP, WIN, WIN]),
        c('victoryIdle', [0, 0.9, 1.8], [WIN, WIN_B, WIN]),
        c('dead', [0, 1], [DEAD, DEAD]),
    ];
}

// Da mặc định (áp lại mỗi khung hình). Dạng khổng lồ: CutoutCharacterView đổi mọi khớp có da 'giant' sang 'giant'.
export const DEFAULT_SKINS = { handN: 'fist', handF: 'fist', eye: 'open' };
export const SKIN_KEYS = {
    ready: [[0, 'eye', 'determined']],
    move: [[0, 'eye', 'determined']],
    land: [[0, 'eye', 'angry'], [0.5, 'eye', 'open']],
    attack: [[0, 'eye', 'angry'], [0.45, 'eye', 'determined']],
    uplift: [[0, 'eye', 'angry']],
    grab: [[0, 'eye', 'angry'], [0.08, 'handN', 'claw'], [0.08, 'handF', 'claw'], [0.75, 'eye', 'roar'], [1.1, 'handN', 'fist'], [1.1, 'handF', 'fist']],
    charge: [[0, 'eye', 'angry']],
    stomp: [[0, 'eye', 'angry'], [0.5, 'eye', 'roar'], [0.9, 'eye', 'angry']],
    roar: [[0, 'eye', 'angry'], [0.25, 'eye', 'roar']],
    hurt: [[0.03, 'eye', 'pain'], [0.32, 'eye', 'open']],
    stunned: [[0, 'eye', 'pain'], [0, 'handN', 'relax'], [0, 'handF', 'relax']],
    victory: [[0, 'eye', 'determined'], [0, 'handF', 'thumb']],
    victoryIdle: [[0, 'eye', 'determined'], [0, 'handF', 'thumb']],
    dead: [[0, 'eye', 'blink'], [0, 'handN', 'relax'], [0, 'handF', 'relax']],
};
export const SECONDARY = {
    tail: { speed: -0.05, fall: -0.1, gravity: 0.35, sway: 0.06, phase: 1.1, limit: [-0.7, 0.6], stiff: 24, damp: 4 },
};
export const LOCOMOTION = { runSpeed: 6, dashSpeed: 99, runClip: 'move', dashClip: 'move' };
