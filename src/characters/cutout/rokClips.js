// ============================================================
// ĐỘNG TÁC ROK (Thiết Hộ) — Chiến Binh khiên lớn
// ============================================================
// Tay GẦN (N) cầm KIẾM (luôn trước thân), tay XA (F) cầm KHIÊN (liftF=1: khiên trước thân, sau tay kiếm). Quy ước góc giống assassin2Clips.js.
// Khiên tự giữ THẲNG ĐỨNG: góc khiên = SHIELD_TILT - (torso + armN + foreN + handN) (trừ khi tư thế ghi rõ `shield`).
// Kỹ năng:  Khiêu Khích -> taunt   Đập Khiên -> bash   Thành Trì -> fortress (niệm ~1s, clip lặp 'cast')
import { buildPoseClip } from './poseClip.js';

const SHIELD_KEEP = (p, tilt = 0) => tilt - ((p.torso ?? 0) + (p.armF ?? 0) + (p.foreF ?? 0) + (p.handF ?? 0));

// Thế thủ: khiên trước ngực, kiếm chĩa ra trước dưới mép khiên (như ảnh mẫu)
const IDLE = {
    hips: [0, 0], liftF: 1, torso: -0.03, head: 0.03,
    armF: 0.12, foreF: 1.2, handF: 0, shield: 0,
    armN: 0.22, foreN: 0.55, handN: -1.2, sword: 0,   // tay kiếm buông bên hông, lưỡi chĩa chéo xuống phía trước
    thighN: 0.16, shinN: -0.1, thighF: -0.16, shinF: 0.04, cape: 0,
};
IDLE.shield = -(IDLE.torso + IDLE.armF + IDLE.foreF + IDLE.handF);
const pose = (over, tilt = 0) => {
    const p = { ...IDLE, ...over };
    if (over.shield === undefined) p.shield = SHIELD_KEEP(p, tilt);
    return p;
};
const IDLE_IN = pose({ hips: [0, -0.006], torso: -0.05, head: 0.05, armF: 0.1, foreF: 1.24, armN: 0.2, handN: -1.18, shinN: -0.14, thighN: 0.18 });

// Hướng LƯỠI KIẾM (rad, 0 = chĩa ra trước, 1.57 = thẳng lên, -1.57 = cắm xuống, 3.14 = ra sau)
//   = torso + armN + foreN + handN  -> tự tính handN cho đúng hướng lưỡi muốn có
const blade = (p, dir) => ({ ...p, handN: dir - ((p.torso ?? IDLE.torso) + p.armN + p.foreN) });

// Thủ thế trong trận: khuỵu nhẹ, khiên áp trước ngực, kiếm dựng chéo lên phía trước bên hông
const READY = pose(blade({ torso: -0.08, head: 0.07, armF: 0.25, foreF: 1.15, armN: 0.2, foreN: 0.75,
    thighN: 0.26, shinN: -0.2, thighF: -0.24, shinF: 0.04 }, 0.15));
const READY_IN = pose(blade({ ...READY, hips: [0, -0.006], torso: -0.1, head: 0.09, armF: 0.23, armN: 0.18, thighN: 0.28, shinN: -0.24 }, 0.12));

// Chạy nặng nề: khiên giữ trước người, chân bước ngắn
const RUN_BODY = blade({ torso: -0.2, head: 0.14, armF: 0.2, foreF: 1.1, armN: 0.15, foreN: 0.9 }, 0.35);
const RUN = [
    pose({ ...RUN_BODY, hips: [0, -0.012], thighN: 0.5, shinN: -0.25, thighF: -0.45, shinF: -0.7 }),
    pose({ ...RUN_BODY, hips: [0, 0.014], thighN: 0.0, shinN: -0.3, thighF: 0.15, shinF: -1.2, armF: 0.24 }),
    pose({ ...RUN_BODY, hips: [0, -0.012], thighN: -0.45, shinN: -0.7, thighF: 0.5, shinF: -0.25 }),
    pose({ ...RUN_BODY, hips: [0, 0.014], thighN: 0.15, shinN: -1.2, thighF: 0.0, shinF: -0.3, armF: 0.24 }),
];

// Rơi xuống đầu trận / đáp đất
const FALL = pose({ air: true, torso: -0.2, head: 0.2, armF: 0.6, foreF: 1.2, armN: -1.2, foreN: 0.6, handN: -1.0,
    thighN: 1.3, shinN: -1.8, thighF: 0.8, shinF: -1.6 });
const LAND = pose({ hips: [0, -0.13], torso: -0.45, head: 0.38, armF: 0.9, foreF: 0.9, armN: -0.8, foreN: 0.4, handN: -1.2,
    thighN: 1.45, shinN: -1.95, thighF: -0.1, shinF: -1.8 }, -0.1);
const LAND_HOLD = pose({ ...LAND, hips: [0, -0.12], torso: -0.4 }, -0.1);

// Đánh thường (bổ dọc): vung kiếm qua đầu (lưỡi ngả ra sau) -> bổ mạnh xuống phía trước, bước tới 1 nhịp.
// Khiên thu sát ngực trong lúc chém để kiếm vung PHÍA TRƯỚC khiên, nhìn rõ đường kiếm.
const SLASH_LEGS = { thighN: 0.3, shinN: -0.3, thighF: -0.25, shinF: 0.0 };
const SLASH_WIND = pose(blade({ liftF: 1, dropN: 1, hips: [-0.015, 0.0], torso: 0.16, head: -0.04, armN: 3.35, foreN: -0.45,
    armF: 0.05, foreF: 1.0, ...SLASH_LEGS, thighF: -0.15 }, 2.85));
const SLASH_MID = pose(blade({ liftF: 1, dropN: 1, hips: [0.01, -0.01], torso: 0.0, head: 0.04, armN: 2.3, foreN: -0.1,
    armF: 0.0, foreF: 0.95, thighN: 0.45, shinN: -0.4, thighF: -0.3, shinF: -0.05 }, 1.45));
const SLASH_HIT = pose(blade({ liftF: 1, dropN: 0, hips: [0.04, -0.035], torso: -0.3, head: 0.2, armN: 1.5, foreN: 0.05,
    armF: -0.05, foreF: 0.9, thighN: 0.62, shinN: -0.6, thighF: -0.4, shinF: -0.1 }, -0.3));
const SLASH_FOLLOW = pose(blade({ ...SLASH_HIT, liftF: 1, torso: -0.26, armN: 1.05, foreN: 0.1 }, -0.95));

// K1 Khiêu Khích: ngửa người, giơ kiếm lên trời hét lớn, khiên dang sang bên
const TAUNT_UP = pose({ liftF: 1, dropN: 1, hips: [0, 0.01], torso: 0.25, head: -0.25, armN: 3.45, foreN: -0.35, handN: -1.6,
    armF: 0.4, foreF: 1.0, thighN: 0.4, shinN: -0.3, thighF: -0.3 });
const TAUNT_SHOUT = pose({ ...TAUNT_UP, torso: 0.3, head: -0.32, armN: 3.5, handN: -1.65, hips: [0, -0.01] });
// gõ kiếm vào khiên
const TAUNT_BANG = pose({ liftF: 1, hips: [0.01, -0.02], torso: -0.15, head: 0.1, armN: 1.3, foreN: 0.9, handN: -2.4,
    armF: 0.5, foreF: 1.3, thighN: 0.45, shinN: -0.4, thighF: -0.3 });

// K2 Đập Khiên: thủ thế -> lao tới, đẩy thẳng khiên ra trước
const BASH_PREP = pose({ hips: [-0.03, -0.05], torso: 0.05, armF: -0.1, foreF: 1.9, armN: 0.3, foreN: 0.8,
    thighN: 0.8, shinN: -1.1, thighF: 0.2, shinF: -1.0 });
const BASH_HIT = pose({ hips: [0.06, -0.06], torso: -0.45, head: 0.35, armF: 1.45, foreF: 0.15, armN: -0.7, foreN: 0.5, handN: 2.4,
    thighN: 1.1, shinN: -0.6, thighF: -0.8, shinF: -0.3 }, 0);
const BASH_FOLLOW = pose({ ...BASH_HIT, hips: [0.05, -0.05], torso: -0.38, armF: 1.3, foreF: 0.3 });

// K3 Thành Trì (niệm): quỳ một gối, cắm khiên xuống đất trước mặt, kiếm giơ cao
const FORT = pose({ hips: [0, -0.16], torso: -0.15, head: 0.1, armF: 0.9, foreF: 0.5, handF: 0,
    armN: 2.4, foreN: 0.4, handN: -1.3, thighN: 1.5, shinN: -1.5, thighF: -0.2, shinF: -1.9 }, 0);
const FORT_B = pose({ ...FORT, hips: [0, -0.165], armN: 2.45 }, 0);

// K3 Dựng Khiên: hạ thấp trọng tâm, khiên đưa thẳng ra trước, kiếm thu sau lưng; giữ 5 giây (clip lặp 'guard')
const GUARD = pose({ hips: [0.01, -0.07], torso: -0.22, head: 0.18, armF: 0.5, foreF: 1.05, handF: 0,
    armN: -0.7, foreN: 0.5, handN: 2.5, thighN: 0.95, shinN: -1.0, thighF: -0.55, shinF: -0.15 }, 0);
const GUARD_B = pose({ ...GUARD, hips: [0.01, -0.075], torso: -0.24, armF: 0.53 }, 0);
const GUARD_RAISE = pose({ hips: [0, -0.02], torso: 0.05, armF: 2.3, foreF: 0.3, armN: -0.3, foreN: 1.2, handN: -1.4,
    thighN: 0.5, shinN: -0.4, thighF: -0.3 }, 0);

// Trúng đòn: lùi sau khiên
const HURT = pose({ hips: [-0.04, -0.012], torso: 0.3, head: 0.25, armF: 0.6, foreF: 1.3, armN: 0.2, foreN: 0.8,
    thighN: 0.4, shinN: -0.5, thighF: -0.1 });

// Choáng (khi bị quái làm choáng — dùng chung cho các nhân vật)
const STUN_A = pose({ torso: 0.15, head: 0.3, armF: 0.1, foreF: 0.8, armN: 0.2, foreN: 0.4, handN: -0.6 });
const STUN_B = pose({ ...STUN_A, torso: -0.05, head: -0.1 });

// Thắng trận: giơ kiếm lên cao
const WIN_UP = pose({ air: true, liftF: 1, dropN: 1, hips: [0, 0.06], torso: 0.1, armN: 3.45, foreN: -0.35, handN: -1.6, thighN: 0.4, shinN: -0.8, thighF: -0.2, shinF: -0.5 });
const WIN = pose({ liftF: 1, dropN: 1, torso: 0.08, head: -0.05, armN: 3.4, foreN: -0.3, handN: -1.6 });
const WIN_B = pose({ ...WIN, hips: [0, -0.006], armN: 3.35 });

const DEAD = pose({ air: true, torso: 0.2, head: 0.4, armF: 0.6, foreF: 0.4, armN: 0.3, foreN: 0.3, handN: -0.8,
    thighN: 0.35, shinN: -0.5, thighF: -0.1, shinF: -0.2 });

export function rokClips(parts, height) {
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height);
    return [
        c('idle', [0, 0.9, 1.8], [IDLE, IDLE_IN, IDLE]),
        c('ready', [0, 0.8, 1.6], [READY, READY_IN, READY]),
        c('move', [0, 0.14, 0.28, 0.42, 0.56], [...RUN, RUN[0]]),
        c('fall', [0, 0.3], [FALL, FALL]),
        c('land', [0, 0.06, 0.35, 0.65], [LAND, LAND, LAND_HOLD, IDLE]),
        c('attack', [0, 0.03, 0.15, 0.2, 0.24, 0.38, 0.66], [{ ...READY, dropN: 0 }, { ...READY, dropN: 1 }, SLASH_WIND, SLASH_MID, SLASH_HIT, SLASH_FOLLOW, { ...READY, dropN: 0 }]),
        c('taunt', [0, 0.15, 0.4, 0.55, 0.7, 0.95], [IDLE, TAUNT_UP, TAUNT_SHOUT, TAUNT_BANG, TAUNT_BANG, IDLE]),
        c('bash', [0, 0.12, 0.22, 0.4, 0.6], [IDLE, BASH_PREP, BASH_HIT, BASH_FOLLOW, IDLE]),
        c('cast', [0, 0.4, 0.8], [FORT, FORT_B, FORT]),
        c('fortress', [0, 0.15, 0.35, 0.7], [FORT, FORT, FORT_B, IDLE]),
        c('guardStart', [0, 0.12, 0.3], [IDLE, GUARD_RAISE, GUARD]),
        c('guard', [0, 0.5, 1.0], [GUARD, GUARD_B, GUARD]),
        c('hurt', [0, 0.06, 0.18, 0.4], [IDLE, HURT, pose({ ...HURT, torso: 0.2, hips: [-0.02, -0.006] }), IDLE]),
        c('stunned', [0, 0.35, 0.7], [STUN_A, STUN_B, STUN_A]),
        c('victory', [0, 0.2, 0.45, 0.8], [IDLE, WIN_UP, WIN, WIN]),
        c('victoryIdle', [0, 0.9, 1.8], [WIN, WIN_B, WIN]),
        c('dead', [0, 1], [DEAD, DEAD]),
    ];
}

export const DEFAULT_SKINS = { handF: 'fist', handN: 'fist', eye: 'open' };
export const SKIN_KEYS = {
    ready: [[0, 'eye', 'determined']],
    move: [[0, 'eye', 'determined']],
    land: [[0, 'eye', 'determined'], [0.5, 'eye', 'open']],
    attack: [[0.08, 'eye', 'angry'], [0.5, 'eye', 'determined']],
    taunt: [[0.1, 'eye', 'angry']],
    bash: [[0, 'eye', 'angry'], [0.1, 'handF', 'bash']],
    cast: [[0, 'eye', 'determined']],
    fortress: [[0, 'eye', 'determined']],
    guardStart: [[0, 'eye', 'angry']],
    guard: [[0, 'eye', 'determined']],
    hurt: [[0.03, 'eye', 'pain'], [0.32, 'eye', 'open']],
    stunned: [[0, 'eye', 'pain'], [0, 'handN', 'open']],
    victory: [[0, 'eye', 'happy']],
    victoryIdle: [[0, 'eye', 'happy']],
    dead: [[0, 'eye', 'blink'], [0, 'handN', 'open']],
};

export const SECONDARY = {
    cape:  { speed: -0.05, fall: -0.1, gravity: 0.8, sway: 0.03, phase: 0.3, limit: [-1.0, 0.4], stiff: 45, damp: 6 },
    scarf: { speed: -0.04, fall: -0.08, gravity: 0.7, sway: 0.04, phase: 1.1, limit: [-1.0, 0.4], stiff: 50, damp: 6 },
};

export const LOCOMOTION = { runSpeed: 6.5, dashSpeed: 99, runClip: 'move', dashClip: 'move' };
