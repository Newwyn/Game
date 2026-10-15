// ============================================================
// ĐỘNG TÁC ZERITH (U Minh) — Sát Thủ lưỡi liềm
// ============================================================
// Góc khớp (rad): 0 = buông thẳng xuống, dương = đưa ra TRƯỚC. Tay GẦN (armN) cầm liềm, tay XA (armF) thả lỏng / xoè phép.
import { buildPoseClip } from './poseClip.js';
import { REST } from './zerithBones.js';

const BASE = { hips: [0, 0], torso: 0, head: 0, cape: 0, tail: 0, scy: 0, ...REST };
const pose = (over) => ({ ...BASE, ...over });
const R = REST;
// LƯỠI HÁI xoay trong nắm tay (khớp 'scy', không có hình — bàn tay giữ nguyên, chỉ cán liềm xoay quanh nắm tay).
// Viết tư thế theo GÓC CÁN LIỀM ngoài thế giới θ (0 = dựng đứng như tranh, lưỡi trên đầu cong ra trước;
//   âm = đầu liềm đổ ra TRƯỚC (−1.57: cán nằm ngang, lưỡi ở đầu trước móc xuống); dương = đổ ra SAU):
//   scy = θ − (armN − R.armN) − torso
const S = (theta, armN, torso = 0) => theta - (armN - R.armN) - torso;
const P = (o) => pose({ ...o, scy: S(o.theta ?? 0, o.armN ?? R.armN, o.torso ?? 0), theta: undefined });

const IDLE = pose({});
const IDLE_IN = pose({ hips: [0, -0.004], torso: -0.015, head: 0.02, armN: R.armN - 0.04, armF: R.armF + 0.04, tail: 0.08 });
// thủ thế: đầu liềm nghiêng ra trước
const READY = P({ theta: -0.35, torso: -0.08, head: 0.06, armN: R.armN + 0.35, armF: 0.25, thighN: R.thighN + 0.12, shinN: R.shinN - 0.1, thighF: R.thighF - 0.15, tail: 0.15 });
const READY_IN = P({ ...READY, theta: -0.33, hips: [0, -0.006], torso: -0.1, armN: R.armN + 0.3 });

// Đánh thường — BỔ LIỀM: giơ tay lên, lưỡi liềm vòng ra sau đầu -> quét qua đỉnh đầu -> lưỡi móc bổ xuống trước mặt
const WIND = P({ theta: 0.45, torso: 0.12, head: -0.05, armN: -2.2, armF: 0.6, thighN: -0.1, thighF: 0.15, tail: -0.2 });
const SWING = P({ theta: -0.5, torso: -0.05, head: 0.05, armN: -0.3, armF: 0.2, thighN: 0.1, thighF: -0.05, tail: 0 });
const CUT = P({ theta: -1.45, torso: -0.22, head: 0.12, armN: 1.15, armF: -0.3, thighN: 0.3, shinN: -0.2, thighF: -0.3, tail: 0.3 });
// Lướt (skill 1): đổ người ra trước, cán liềm nằm ngang SAU lưng, lưỡi kéo lê
const DASH_IN = P({ theta: 0.6, hips: [0, -0.01], torso: -0.3, head: 0.15, armN: -0.9, armF: -0.3, tail: -0.2 });
const DASH = P({ theta: 1.7, hips: [0, -0.02], torso: -0.5, head: 0.3, armN: -1.3, armF: -0.6, thighN: 0.7, shinN: -0.5, thighF: -0.7, shinF: -0.6, tail: -0.5, cape: -0.4 });
// Gồng (skill 2 / skill 3): hạ thấp, giơ liềm cao trên đầu
const CHARGE = P({ theta: 0.4, hips: [0, -0.03], torso: 0.08, head: -0.1, armN: -2.6, armF: 1.1, thighN: 0.45, shinN: -0.6, thighF: -0.35, shinF: -0.4, tail: 0.3 });
const CHARGE_B = P({ ...CHARGE, theta: 0.45, hips: [0, -0.035], armN: -2.7, armF: 1.2 });
// Chém hất (skill 2): liềm hạ thấp trước mặt -> quét NGƯỢC lên trời (cùng lưỡi hái lớn)
const REAP_MID = P({ theta: -0.9, hips: [0, -0.035], torso: -0.1, head: 0.05, armN: -1.0, armF: 0.4, thighN: 0.5, shinN: -0.55, thighF: -0.4, tail: 0.25 });
const REAP_LOW = P({ theta: -2.1, hips: [0, -0.04], torso: -0.3, head: 0.15, armN: 0.5, armF: -0.4, thighN: 0.6, shinN: -0.5, thighF: -0.4, tail: 0.2 });
const REAP_UP = P({ theta: 0.5, air: true, hips: [0, 0.06], torso: 0.15, head: -0.2, armN: 2.6, armF: -0.6, thighN: 0.3, shinN: -0.6, thighF: -0.2, shinF: -0.3, tail: -0.3 });
// Bổ xuống (skill 2 lúc Đêm Tử Thần)
const SLAM = P({ theta: -2.0, hips: [0, -0.05], torso: -0.4, head: 0.25, armN: 0.7, armF: 0.4, thighN: 0.7, shinN: -0.8, thighF: -0.4, shinF: -0.5, tail: 0.4 });
// Gọi Thần Chết (skill 3): giơ cao liềm
const SUMMON = P({ theta: 0.2, torso: 0.1, head: -0.25, armN: -1.6, armF: 2.4, thighN: R.thighN, thighF: R.thighF, tail: 0.4 });
// Ấn Tử (thiên phú 1): chỉ tay về phía địch
const MARK = P({ theta: -0.2, torso: -0.05, head: 0.05, armN: R.armN + 0.2, armF: 1.6, tail: 0.2 });

// Chạy: cán liềm ngả ra sau lưng
const RUN_BODY = { theta: 1.2, torso: -0.2, head: 0.12, armN: -0.6, armF: -0.4 };
const RUN = [
    P({ ...RUN_BODY, hips: [0, -0.012], thighN: 0.55, shinN: -0.25, thighF: -0.5, shinF: -0.7, armF: -0.6, tail: -0.2 }),
    P({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.0, shinN: -0.3, thighF: 0.15, shinF: -1.25, armF: -0.3, tail: -0.35 }),
    P({ ...RUN_BODY, hips: [0, -0.012], thighN: -0.5, shinN: -0.7, thighF: 0.55, shinF: -0.25, armF: 0.0, tail: -0.2 }),
    P({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.15, shinN: -1.25, thighF: 0.0, shinF: -0.3, armF: -0.3, tail: -0.35 }),
];
const FALL = P({ theta: 0.6, air: true, torso: -0.15, head: 0.15, armN: -1.0, armF: -0.9, thighN: 1.0, shinN: -1.5, thighF: 0.5, shinF: -1.3, tail: 0.4 });
const LAND = P({ theta: 0.8, hips: [0, -0.1], torso: -0.35, head: 0.3, armN: -0.6, armF: -0.7, thighN: 1.3, shinN: -1.8, thighF: -0.1, shinF: -1.6 });
const LAND_HOLD = P({ ...LAND, theta: 0.7, hips: [0, -0.09], torso: -0.3 });
const HURT = P({ theta: 0, hips: [-0.03, -0.01], torso: 0.25, head: 0.22, armN: R.armN - 0.3, armF: 0.4, thighN: 0.15, shinN: -0.3, thighF: -0.1, tail: 0.4 });
const STUN_A = pose({ torso: 0.13, head: 0.28, armN: R.armN + 0.1, armF: 0.1, tail: -0.2 });
const STUN_B = pose({ ...STUN_A, torso: -0.05, head: -0.1 });
const WIN = P({ theta: 0.1, torso: 0.05, head: -0.1, armN: R.armN - 0.2, armF: 1.3, tail: 0.5 });
const WIN_B = P({ ...WIN, theta: 0.1, hips: [0, -0.005], tail: 0.3 });
const DEAD = pose({ air: true, torso: 0.2, head: 0.35, armN: 0.3, armF: 0.4, thighN: 0.25, shinN: -0.4, thighF: -0.1, shinF: -0.2, tail: -0.4 });

export function zerithClips(parts, height) {
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height);
    return [
        c('idle', [0, 1.0, 2.0], [IDLE, IDLE_IN, IDLE]),
        c('ready', [0, 0.8, 1.6], [READY, READY_IN, READY]),
        c('move', [0, 0.13, 0.26, 0.39, 0.52], [...RUN, RUN[0]]),
        c('fall', [0, 0.3], [FALL, FALL]),
        c('land', [0, 0.06, 0.35, 0.65], [LAND, LAND, LAND_HOLD, IDLE]),
        c('attack', [0, 0.12, 0.17, 0.22, 0.34, 0.5], [READY, WIND, SWING, CUT, CUT, READY]),        // bổ liềm (hit 0.22)
        c('dash', [0, 0.04, 0.08, 0.6], [READY, DASH_IN, DASH, DASH]),                               // lướt (giữ)
        c('charge', [0, 0.2, 0.5, 0.8], [READY, CHARGE, CHARGE_B, CHARGE]),                          // gồng (giữ)
        c('reap', [0, 0.03, 0.06, 0.15, 0.32, 0.55], [CHARGE, REAP_MID, REAP_LOW, REAP_UP, REAP_UP, READY]), // chém hất (hit 0.15)
        c('slam', [0, 0.1, 0.2, 0.45], [REAP_UP, REAP_UP, SLAM, READY]),                             // bổ xuống (hit 0.2)
        c('summon', [0, 0.2, 0.5, 0.8], [CHARGE, SUMMON, SUMMON, READY]),                            // gọi Thần Chết (hit 0.2)
        c('mark', [0, 0.15, 0.35, 0.5], [READY, MARK, MARK, READY]),                                 // gắn Ấn Tử (hit 0.15)
        c('hurt', [0, 0.06, 0.18, 0.4], [IDLE, HURT, P({ ...HURT, theta: 0, torso: 0.2, hips: [-0.015, -0.006] }), IDLE]),
        c('stunned', [0, 0.35, 0.7], [STUN_A, STUN_B, STUN_A]),
        c('victory', [0, 0.25, 0.6], [IDLE, WIN, WIN]),
        c('victoryIdle', [0, 0.9, 1.8], [WIN, WIN_B, WIN]),
        c('dead', [0, 1], [DEAD, DEAD]),
    ];
}

export const DEFAULT_SKINS = { handF: 'relax', eye: 'open', armF: 'long' };
export const SKIN_KEYS = {
    ready: [[0, 'eye', 'determined']],
    move: [[0, 'eye', 'determined']],
    attack: [[0, 'eye', 'angry'], [0.4, 'eye', 'determined']],
    dash: [[0, 'eye', 'angry'], [0, 'handF', 'fist']],
    charge: [[0, 'eye', 'angry'], [0, 'handF', 'open']],
    reap: [[0, 'eye', 'angry'], [0, 'handF', 'fist'], [0.5, 'handF', 'relax']],
    slam: [[0, 'eye', 'angry']],
    summon: [[0, 'eye', 'angry'], [0, 'handF', 'open'], [0.7, 'handF', 'relax']],
    mark: [[0, 'eye', 'determined'], [0.05, 'handF', 'point'], [0.45, 'handF', 'relax']],
    hurt: [[0.03, 'eye', 'pain'], [0.32, 'eye', 'open']],
    stunned: [[0, 'eye', 'pain']],
    victory: [[0, 'eye', 'happy'], [0, 'handF', 'open']],
    victoryIdle: [[0, 'eye', 'happy'], [0, 'handF', 'open']],
    dead: [[0, 'eye', 'blink'], [0, 'handF', 'relax']],
};
export const SECONDARY = {
    cape: { speed: -0.06, fall: -0.1, gravity: 0.5, sway: 0.04, phase: 0.4, limit: [-0.7, 0.35], stiff: 30, damp: 5 },
    tail: { speed: -0.05, fall: -0.1, gravity: 0.4, sway: 0.08, phase: 1.3, limit: [-0.8, 0.6], stiff: 22, damp: 4 },
};
export const LOCOMOTION = { runSpeed: 7, dashSpeed: 99, runClip: 'move', dashClip: 'move' };
