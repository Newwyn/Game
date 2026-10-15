// ============================================================
// ĐỘNG TÁC SERAPHINE (Thánh Quang) — Tu Sĩ
// ============================================================
// Góc khớp (rad): 0 = buông thẳng xuống, dương = đưa ra TRƯỚC, 1.57 = ngang ra trước.
// Tay XA cầm gậy (liftF=1: cẳng tay + gậy luôn ở trước thân). Hướng gậy = torso + armF + foreF + handF:
//   1.57 = gậy dựng đứng.   staffDir(p, góc) tự tính handF.
// Tay GẦN: thả lỏng (relax) / xoè tay niệm phép (cast) / chắp tay cầu nguyện (pray).
import { buildPoseClip } from './poseClip.js';
import { REST } from './seraBones.js';

// Tư thế gốc = đúng dáng đứng trong tranh (góc tính sẵn trong seraRig từ các mốc xương trên tranh)
const BASE = { hips: [0, 0], liftF: 1, torso: 0, head: 0, staff: 0, capelet: 0, hairBack: 0, ...REST };
const staffDir = (p, dir) => ({ ...p, handF: dir - ((p.torso ?? 0) + p.armF + (p.foreF ?? 0)) });
const pose = (over) => ({ ...BASE, ...over });
const R = REST;

// Đứng chờ: y như tranh — gậy dựng trước người, tay kia thả lỏng
const IDLE = pose(staffDir({ armF: R.armF }, 1.57));
const IDLE_IN = pose(staffDir({ hips: [0, -0.004], torso: -0.015, head: 0.025, armF: R.armF - 0.03, armN: R.armN - 0.03, foreN: R.foreN + 0.05 }, 1.55));
// Thủ thế giữa các đòn: gậy nghiêng ra trước, tay gần hơi nâng
const READY = pose(staffDir({ torso: -0.04, head: 0.04, armF: 1.3, armN: 0.1, foreN: 0.5,
    thighN: -0.1, shinN: 0.0, thighF: -0.12, shinF: 0.05 }, 1.42));
const READY_IN = pose(staffDir({ ...READY, hips: [0, -0.005], torso: -0.06, armF: 1.27 }, 1.4));

// Phóng cầu ánh sáng: giơ gậy lên rồi chĩa ra trước
const CAST_UP = pose(staffDir({ torso: 0.05, head: -0.05, armF: 2.3, armN: 0.5, foreN: 1.1, thighN: -0.05, shinN: 0.0, thighF: -0.2 }, 2.1));
const CAST_HIT = pose(staffDir({ torso: -0.08, head: 0.05, armF: 1.45, armN: 0.35, foreN: 0.9, thighN: 0.05, shinN: -0.1, thighF: -0.3 }, 1.05));
// Hồi máu: xoè tay gần ra trước, gậy dựng cao
const HEAL = pose(staffDir({ torso: 0.04, head: -0.06, armF: 1.6, armN: 1.25, foreN: 0.35, thighN: -0.1, thighF: -0.15 }, 1.75));
const HEAL_B = pose(staffDir({ ...HEAL, hips: [0, 0.006], torso: 0.07, armN: 1.4, foreN: 0.25 }, 1.8));
// Khiên: gậy đẩy ra trước, tay gần đưa lên ngực
const SHIELD = pose(staffDir({ torso: -0.06, armF: 1.55, armN: 0.8, foreN: 1.5, thighN: 0.05, shinN: -0.1, thighF: -0.28 }, 1.57));
// Niệm: chắp tay trước ngực, gậy dựng bên cạnh, ngửa mặt nhẹ (lơ lửng)
const PRAY = pose(staffDir({ air: true, torso: 0.05, head: -0.08, armF: 1.0, armN: 0.25, foreN: 1.7, handN: -0.4,
    thighN: 0.1, shinN: -0.35, thighF: -0.1, shinF: -0.3 }, 1.6));
const PRAY_B = pose(staffDir({ ...PRAY, hips: [0, 0.01], torso: 0.07, head: -0.12 }, 1.62));
// Bắt đầu niệm: giơ gậy cao quá đầu
const RAISE = pose(staffDir({ torso: 0.1, head: -0.2, armF: 2.6, armN: 1.7, foreN: 0.5 }, 1.75));

// Chạy
const RUN_BODY = staffDir({ torso: -0.12, head: 0.1, armF: 1.1, armN: -0.4, foreN: 0.7 }, 1.35);
const RUN = [
    pose({ ...RUN_BODY, hips: [0, -0.012], thighN: 0.55, shinN: -0.25, thighF: -0.5, shinF: -0.7, armN: -0.6 }),
    pose({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.0, shinN: -0.3, thighF: 0.15, shinF: -1.25, armN: -0.3 }),
    pose({ ...RUN_BODY, hips: [0, -0.012], thighN: -0.5, shinN: -0.7, thighF: 0.55, shinF: -0.25, armN: 0.0 }),
    pose({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.15, shinN: -1.25, thighF: 0.0, shinF: -0.3, armN: -0.3 }),
];

// Rơi / đáp (đầu trận)
const FALL = pose(staffDir({ air: true, torso: -0.15, head: 0.15, armF: 1.3, armN: -0.9, foreN: 0.7,
    thighN: 1.0, shinN: -1.5, thighF: 0.5, shinF: -1.3 }, 1.3));
const LAND = pose(staffDir({ hips: [0, -0.1], torso: -0.3, head: 0.25, armF: 1.2, armN: -0.7, foreN: 0.6,
    thighN: 1.3, shinN: -1.8, thighF: -0.1, shinF: -1.6 }, 1.25));
const LAND_HOLD = pose(staffDir({ ...LAND, hips: [0, -0.09], torso: -0.25 }, 1.25));

// Trúng đòn / choáng / thắng / chết
const HURT = pose(staffDir({ hips: [-0.03, -0.01], torso: 0.25, head: 0.22, armF: 0.95, armN: 0.1, foreN: 0.4,
    thighN: 0.15, shinN: -0.3, thighF: -0.1 }, 1.2));
const STUN_A = pose(staffDir({ torso: 0.13, head: 0.28, armF: 0.8, armN: 0.0, foreN: 0.3 }, 0.95));
const STUN_B = pose(staffDir({ ...STUN_A, torso: -0.05, head: -0.1 }, 1.05));
const WIN_UP = pose(staffDir({ air: true, hips: [0, 0.06], torso: 0.08, head: -0.1, armF: 2.9, armN: 0.6, foreN: 1.5,
    thighN: 0.4, shinN: -0.8, thighF: -0.2, shinF: -0.5 }, 1.72));
const WIN = pose(staffDir({ torso: 0.05, head: -0.06, armF: 2.8, armN: 0.65, foreN: 1.6 }, 1.7));
const WIN_B = pose(staffDir({ ...WIN, hips: [0, -0.005], armF: 2.75 }, 1.68));
const DEAD = pose(staffDir({ air: true, torso: 0.2, head: 0.35, armF: 0.8, armN: 0.2, foreN: 0.3,
    thighN: 0.25, shinN: -0.4, thighF: -0.1, shinF: -0.2 }, 0.8));

export function seraClips(parts, height) {
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height, { liftPart: 'foreF' });
    return [
        c('idle', [0, 0.9, 1.8], [IDLE, IDLE_IN, IDLE]),
        c('ready', [0, 0.8, 1.6], [READY, READY_IN, READY]),
        c('move', [0, 0.13, 0.26, 0.39, 0.52], [...RUN, RUN[0]]),
        c('fall', [0, 0.3], [FALL, FALL]),
        c('land', [0, 0.06, 0.35, 0.65], [LAND, LAND, LAND_HOLD, IDLE]),
        // đánh thường: giơ gậy -> chĩa ra trước phóng cầu sáng (hit 0.22)
        c('attack', [0, 0.12, 0.22, 0.32, 0.55], [READY, CAST_UP, CAST_HIT, CAST_HIT, READY]),
        c('heal', [0, 0.15, 0.3, 0.45, 0.65], [READY, HEAL, HEAL_B, HEAL, READY]),          // hit 0.3
        c('shield', [0, 0.14, 0.28, 0.42, 0.6], [READY, CAST_UP, SHIELD, SHIELD, READY]),  // hit 0.28
        c('raise', [0, 0.2, 0.45, 0.7], [READY, RAISE, RAISE, PRAY]),                       // vào trạng thái niệm (hit 0.45)
        c('pray', [0, 0.8, 1.6], [PRAY, PRAY_B, PRAY]),                                     // niệm (lặp)
        c('hurt', [0, 0.06, 0.18, 0.4], [IDLE, HURT, pose({ ...HURT, torso: 0.2, hips: [-0.015, -0.006] }), IDLE]),
        c('stunned', [0, 0.35, 0.7], [STUN_A, STUN_B, STUN_A]),
        c('victory', [0, 0.2, 0.45, 0.8], [IDLE, WIN_UP, WIN, WIN]),
        c('victoryIdle', [0, 0.9, 1.8], [WIN, WIN_B, WIN]),
        c('dead', [0, 1], [DEAD, DEAD]),
    ];
}

export const DEFAULT_SKINS = { handN: 'relax', eye: 'open' };
export const SKIN_KEYS = {
    ready: [[0, 'eye', 'determined'], [0, 'handN', 'relax']],
    move: [[0, 'eye', 'determined'], [0, 'handN', 'relax']],
    land: [[0, 'eye', 'determined'], [0.5, 'eye', 'open']],
    attack: [[0, 'eye', 'determined'], [0.1, 'handN', 'cast'], [0.5, 'handN', 'relax']],
    heal: [[0, 'eye', 'happy'], [0.1, 'handN', 'cast'], [0.6, 'handN', 'relax'], [0.6, 'eye', 'open']],
    shield: [[0, 'eye', 'determined'], [0.1, 'handN', 'fist'], [0.55, 'handN', 'relax']],
    raise: [[0, 'eye', 'determined'], [0, 'handN', 'cast'], [0.6, 'handN', 'pray'], [0.6, 'eye', 'blink']],
    pray: [[0, 'eye', 'blink'], [0, 'handN', 'pray']],
    hurt: [[0.03, 'eye', 'pain'], [0.32, 'eye', 'open']],
    stunned: [[0, 'eye', 'pain'], [0, 'handN', 'relax']],
    victory: [[0, 'eye', 'happy'], [0, 'handN', 'cast']],
    victoryIdle: [[0, 'eye', 'happy'], [0, 'handN', 'cast']],
    dead: [[0, 'eye', 'blink'], [0, 'handN', 'relax']],
};

export const SECONDARY = {
    hairBack: { speed: -0.05, fall: -0.1, gravity: 0.5, sway: 0.035, phase: 0.2, limit: [-0.9, 0.4], stiff: 35, damp: 5 },
};

export const LOCOMOTION = { runSpeed: 7, dashSpeed: 99, runClip: 'move', dashClip: 'move' };
