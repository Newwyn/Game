// ============================================================
// ĐỘNG TÁC IGNAR (Hỏa Ngục) — Phù Thủy lửa
// ============================================================
// Góc khớp (rad): 0 = buông thẳng xuống, dương = đưa ra TRƯỚC, 1.57 = ngang ra trước.
// Tay XA (armF) = tay ngửa giữ cầu lửa / ném / đẩy chưởng. Tay GẦN (armN) thả lỏng, giơ lên khi gọi thiên hỏa cầu.
import { buildPoseClip } from './poseClip.js';
import { REST } from './ignarBones.js';

const BASE = { hips: [0, 0], liftF: 1, torso: 0, head: 0, capelet: 0, ...REST };
const pose = (over) => ({ ...BASE, ...over });
const R = REST;

// Đứng chờ = y tranh (ngửa tay, quả cầu lửa lơ lửng trên lòng bàn tay)
const IDLE = pose({});
const IDLE_IN = pose({ hips: [0, -0.004], torso: -0.015, head: 0.025, armF: R.armF - 0.05, handF: 0.06, armN: R.armN - 0.03, foreN: R.foreN + 0.05 });
// Thủ thế
const READY = pose({ torso: -0.05, head: 0.05, armF: 1.35, handF: 0.1, armN: 0.15, foreN: 0.5,
    thighN: -0.05, shinN: 0.05, thighF: -0.12, shinF: 0.05 });
const READY_IN = pose({ ...READY, hips: [0, -0.005], torso: -0.07, armF: 1.3 });

// Đánh thường: kéo tay ra sau rồi ném cầu lửa ra trước
const THROW_UP = pose({ torso: 0.12, head: -0.05, armF: 0.4, handF: -0.3, armN: 0.5, foreN: 0.6, thighN: -0.15, thighF: 0.1 });
const THROW = pose({ torso: -0.14, head: 0.08, armF: 1.75, handF: -0.2, armN: -0.3, foreN: 0.4, thighN: 0.15, shinN: -0.1, thighF: -0.3 });
// Thiên Hỏa Cầu: giơ tay gần lên trời gọi cầu lửa, tay xa chỉ về phía quái
const SUMMON = pose({ torso: 0.08, head: -0.2, armF: 2.2, handF: 0.3, armN: 0.9, foreN: 0.5, thighN: -0.05, thighF: -0.15 });
const SUMMON_B = pose({ ...SUMMON, hips: [0, 0.008], armF: 2.3, head: -0.25 });
// Cột Lửa: giơ tay lên rồi CHƯỞNG MẠNH XUỐNG ĐẤT phía trước (khuỵu gối)
const BOLT_UP = pose({ torso: 0.12, head: -0.1, armF: 2.6, handF: 0.2, armN: 0.5, foreN: 0.6, thighN: -0.1, thighF: 0.05 });
const BOLT = pose({ hips: [0, -0.05], torso: -0.35, head: 0.25, armF: 0.75, handF: 0.9, armN: -0.3, foreN: 0.5,
    thighN: 0.7, shinN: -0.9, thighF: -0.2, shinF: -0.5 });
// Gồng Hỏa Thần: hạ thấp người, hai tay dang ra hai bên
const CHARGE = pose({ hips: [0, -0.03], torso: 0.05, head: -0.1, armF: 1.1, handF: 0.4, armN: 1.2, foreN: 0.4,
    thighN: 0.45, shinN: -0.6, thighF: -0.35, shinF: -0.4 });
const CHARGE_B = pose({ ...CHARGE, hips: [0, -0.035], armF: 1.2, armN: 1.3 });
// Hỏa Chưởng (đánh thường khi Hỏa Thần): đẩy chưởng mạnh ra trước
const PALM_PULL = pose({ torso: 0.15, armF: 0.6, handF: 0, armN: 0.3, foreN: 0.8, thighN: -0.2, thighF: 0.15 });
const PALM = pose({ torso: -0.2, head: 0.1, armF: 1.65, handF: 0, armN: -0.4, foreN: 0.3, thighN: 0.3, shinN: -0.2, thighF: -0.35 });
// Chưởng toàn thể: nhảy lên, hai tay vung ra trước
const JUMP = pose({ air: true, hips: [0, 0.18], torso: -0.1, head: 0.05, armF: 2.0, armN: 1.9, foreN: 0.3,
    thighN: 0.9, shinN: -1.3, thighF: 0.4, shinF: -1.0 });
const JUMP_HIT = pose({ air: true, hips: [0, 0.2], torso: -0.25, head: 0.15, armF: 1.45, armN: 1.4, foreN: 0.1,
    thighN: 0.7, shinN: -1.1, thighF: 0.2, shinF: -0.8 });

// Chạy
const RUN_BODY = { torso: -0.14, head: 0.1, armF: 1.0, handF: 0.1, armN: -0.4, foreN: 0.7 };
const RUN = [
    pose({ ...RUN_BODY, hips: [0, -0.012], thighN: 0.55, shinN: -0.25, thighF: -0.5, shinF: -0.7, armN: -0.6 }),
    pose({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.0, shinN: -0.3, thighF: 0.15, shinF: -1.25, armN: -0.3 }),
    pose({ ...RUN_BODY, hips: [0, -0.012], thighN: -0.5, shinN: -0.7, thighF: 0.55, shinF: -0.25, armN: 0.0 }),
    pose({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.15, shinN: -1.25, thighF: 0.0, shinF: -0.3, armN: -0.3 }),
];
// Rơi / đáp
const FALL = pose({ air: true, torso: -0.15, head: 0.15, armF: 1.4, armN: -0.9, foreN: 0.7, thighN: 1.0, shinN: -1.5, thighF: 0.5, shinF: -1.3 });
const LAND = pose({ hips: [0, -0.1], torso: -0.3, head: 0.25, armF: 1.2, armN: -0.7, foreN: 0.6, thighN: 1.3, shinN: -1.8, thighF: -0.1, shinF: -1.6 });
const LAND_HOLD = pose({ ...LAND, hips: [0, -0.09], torso: -0.25 });
// Trúng đòn / choáng / thắng / chết
const HURT = pose({ hips: [-0.03, -0.01], torso: 0.25, head: 0.22, armF: 0.8, handF: 0.3, armN: 0.1, foreN: 0.4, thighN: 0.15, shinN: -0.3, thighF: -0.1 });
const STUN_A = pose({ torso: 0.13, head: 0.28, armF: 0.5, handF: 0.5, armN: 0.0, foreN: 0.3 });
const STUN_B = pose({ ...STUN_A, torso: -0.05, head: -0.1 });
const WIN_UP = pose({ air: true, hips: [0, 0.06], torso: 0.08, head: -0.12, armF: 2.9, handF: 0, armN: 0.5, foreN: 1.2,
    thighN: 0.4, shinN: -0.8, thighF: -0.2, shinF: -0.5 });
const WIN = pose({ torso: 0.05, head: -0.08, armF: 2.8, handF: 0, armN: 0.4, foreN: 1.3 });
const WIN_B = pose({ ...WIN, hips: [0, -0.005], armF: 2.75 });
const DEAD = pose({ air: true, torso: 0.2, head: 0.35, armF: 0.6, handF: 0.4, armN: 0.2, foreN: 0.3, thighN: 0.25, shinN: -0.4, thighF: -0.1, shinF: -0.2 });

export function ignarClips(parts, height) {
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height, { liftPart: 'foreF' });
    return [
        c('idle', [0, 1.0, 2.0], [IDLE, IDLE_IN, IDLE]),
        c('ready', [0, 0.8, 1.6], [READY, READY_IN, READY]),
        c('move', [0, 0.13, 0.26, 0.39, 0.52], [...RUN, RUN[0]]),
        c('fall', [0, 0.3], [FALL, FALL]),
        c('land', [0, 0.06, 0.35, 0.65], [LAND, LAND, LAND_HOLD, IDLE]),
        c('attack', [0, 0.14, 0.25, 0.36, 0.6], [READY, THROW_UP, THROW, THROW, READY]),       // ném cầu lửa (hit 0.25)
        c('summon', [0, 0.18, 0.35, 0.5, 0.75], [READY, SUMMON, SUMMON_B, SUMMON, READY]),     // Thiên Hỏa Cầu (hit 0.35)
        c('bolt', [0, 0.14, 0.25, 0.4, 0.62], [READY, BOLT_UP, BOLT, BOLT, READY]),             // Cột Lửa (hit 0.25)
        c('charge', [0, 0.25, 0.6, 0.95], [READY, CHARGE, CHARGE_B, CHARGE]),                    // gồng Hỏa Thần (giữ)
        c('palm', [0, 0.1, 0.2, 0.32, 0.5], [READY, PALM_PULL, PALM, PALM, READY]),            // Hỏa Chưởng (hit 0.2)
        c('volley', [0, 0.15, 0.3, 0.45, 0.7], [READY, JUMP, JUMP_HIT, JUMP_HIT, READY]),       // nhảy chưởng toàn thể (hit 0.3)
        c('hurt', [0, 0.06, 0.18, 0.4], [IDLE, HURT, pose({ ...HURT, torso: 0.2, hips: [-0.015, -0.006] }), IDLE]),
        c('stunned', [0, 0.35, 0.7], [STUN_A, STUN_B, STUN_A]),
        c('victory', [0, 0.2, 0.45, 0.8], [IDLE, WIN_UP, WIN, WIN]),
        c('victoryIdle', [0, 0.9, 1.8], [WIN, WIN_B, WIN]),
        c('dead', [0, 1], [DEAD, DEAD]),
    ];
}

export const DEFAULT_SKINS = { handN: 'relax', handF: 'palm', eye: 'open' };
export const SKIN_KEYS = {
    ready: [[0, 'eye', 'determined'], [0, 'handF', 'palm']],
    move: [[0, 'eye', 'determined'], [0, 'handF', 'palm']],
    land: [[0, 'eye', 'determined'], [0.5, 'eye', 'open']],
    attack: [[0, 'eye', 'determined'], [0.1, 'handF', 'thrust'], [0.5, 'handF', 'palm']],
    summon: [[0, 'eye', 'angry'], [0.08, 'handF', 'raise'], [0.6, 'handF', 'palm']],
    bolt: [[0, 'eye', 'angry'], [0.05, 'handF', 'raise'], [0.2, 'handF', 'thrust'], [0.55, 'handF', 'palm']],
    charge: [[0, 'eye', 'angry'], [0, 'handN', 'fist'], [0, 'handF', 'fist']],
    palm: [[0, 'eye', 'angry'], [0.08, 'handF', 'thrust'], [0.45, 'handF', 'palm']],
    volley: [[0, 'eye', 'angry'], [0.1, 'handF', 'thrust'], [0.1, 'handN', 'thrust'], [0.6, 'handN', 'relax'], [0.6, 'handF', 'palm']],
    hurt: [[0.03, 'eye', 'pain'], [0.32, 'eye', 'open']],
    stunned: [[0, 'eye', 'pain'], [0, 'handF', 'relax']],
    victory: [[0, 'eye', 'happy'], [0, 'handF', 'raise']],
    victoryIdle: [[0, 'eye', 'happy'], [0, 'handF', 'raise']],
    dead: [[0, 'eye', 'blink'], [0, 'handF', 'relax']],
};
export const SECONDARY = {};
export const LOCOMOTION = { runSpeed: 7, dashSpeed: 99, runClip: 'move', dashClip: 'move' };
