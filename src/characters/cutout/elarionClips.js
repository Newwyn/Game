// ============================================================
// ĐỘNG TÁC ELARION (Tam Nguyên) — Pháp Sư Nguyên Tố tộc Elf
// ============================================================
// Góc khớp (rad): 0 = tay / chân buông thẳng xuống, dương = đưa ra TRƯỚC (thân / đầu: dương = ngả ra SAU).
// Tóc sau, 2 vạt áo choàng và Sách Nguyên Tố là LÒ XO (SECONDARY) -> tự đung đưa; sách còn nhấp nhô (view.floatPart).
// Tay gần (armN) ngửa lòng bàn tay dưới quyển sách như tranh mẫu; tay xa thả lỏng / kết ấn khi niệm.
// dropN: 1 = giơ tay gần qua đầu thì tay lùi ra SAU đầu (không che mặt).
import { buildPoseClip } from './poseClip.js';

const BASE = { hips: [0, 0], torso: 0, head: 0, armN: 0, foreN: 0, handN: 0, armF: 0, foreF: 0, handF: 0,
    thighN: 0, shinN: 0, thighF: 0, shinF: 0 };
const pose = (o) => ({ ...BASE, ...o });

// ---------- Đứng / thủ thế ----------
const IDLE = pose({ torso: 0.03, head: -0.02, armN: 0.35, foreN: 1.25, handN: -0.15, armF: -0.18, foreF: 0.3, handF: 0.15,
    thighN: 0.12, shinN: -0.06, thighF: -0.14, shinF: 0.06 });
const IDLE_IN = pose({ ...IDLE, hips: [0, -0.004], torso: 0.05, head: -0.05, armN: 0.4, foreN: 1.3, armF: -0.14 });
const READY = pose({ hips: [0, -0.008], torso: -0.04, head: 0.03, armN: 0.75, foreN: 0.95, handN: -0.1, armF: -0.45, foreF: 0.55, handF: 0.3,
    thighN: 0.25, shinN: -0.2, thighF: -0.25, shinF: 0.05 });
const READY_IN = pose({ ...READY, hips: [0, -0.013], armN: 0.82, foreN: 0.9, armF: -0.5, thighN: 0.28, shinN: -0.25 });

// ---------- Chạy (bước ngắn, áo choàng bay ra sau) ----------
const RUN_BODY = { torso: -0.14, head: 0.1, foreN: 1.0, foreF: 0.7, handN: -0.1 };
const RUN = [
    pose({ ...RUN_BODY, hips: [0, -0.01], thighN: 0.65, shinN: -0.3, thighF: -0.5, shinF: -0.7, armN: -0.2, armF: 0.45 }),
    pose({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.05, shinN: -0.3, thighF: 0.15, shinF: -1.2, armN: 0.2, armF: 0.05 }),
    pose({ ...RUN_BODY, hips: [0, -0.01], thighN: -0.5, shinN: -0.7, thighF: 0.65, shinF: -0.3, armN: 0.5, armF: -0.35 }),
    pose({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.15, shinN: -1.2, thighF: 0.05, shinF: -0.3, armN: 0.2, armF: 0.05 }),
];
const FALL = pose({ air: true, torso: -0.1, head: 0.1, armN: 2.0, foreN: 0.4, armF: -1.4, foreF: 0.3, thighN: 0.8, shinN: -1.3, thighF: 0.3, shinF: -1.1 });
const LAND = pose({ hips: [0, -0.08], torso: -0.3, head: 0.25, armN: 1.3, foreN: 0.5, armF: -1.1, foreF: 0.3, thighN: 1.1, shinN: -1.5, thighF: -0.15, shinF: -1.4 });
const LAND_HOLD = pose({ ...LAND, hips: [0, -0.07], torso: -0.25 });

// ---------- Đánh thường: kéo tay về ngực tụ phép -> đẩy chưởng ra trước (tia nguyên tố bay đi) ----------
const BOLT_WIND = pose({ hips: [-0.01, -0.01], torso: 0.1, head: -0.04, armN: 0.15, foreN: 1.9, handN: 0.1, armF: -0.6, foreF: 0.6,
    thighN: 0.2, shinN: -0.2, thighF: -0.3, shinF: 0.05 });
const BOLT_HIT = pose({ hips: [0.02, -0.014], torso: -0.16, head: 0.1, armN: 1.5, foreN: 0.08, handN: -0.05, armF: -0.75, foreF: 0.45,
    thighN: 0.42, shinN: -0.35, thighF: -0.38, shinF: -0.05 });
const BOLT_END = pose({ ...BOLT_HIT, armN: 1.35, foreN: 0.25 });

// ---------- Đọc Sách: tay xa kết ấn trước ngực, tay gần ngửa dưới sách ----------
const BOOK_A = pose({ hips: [0, -0.01], torso: 0.06, head: -0.08, armN: 0.95, foreN: 1.15, handN: -0.25, armF: 0.6, foreF: 1.7, handF: 0.2, liftF: 1,
    thighN: 0.18, shinN: -0.12, thighF: -0.18 });
const BOOK_B = pose({ ...BOOK_A, torso: 0.1, head: -0.12, armN: 1.15, foreN: 1.0, armF: 0.7, foreF: 1.8 });

// ---------- Tung phép: giơ tay gần lên cao gom nguyên tố -> phóng thẳng về phía trước ----------
const SPELL_UP = pose({ dropN: 1, hips: [0, -0.012], torso: 0.14, head: -0.16, armN: 2.75, foreN: 0.35, handN: 0.1, armF: -0.7, foreF: 0.5,
    thighN: 0.2, shinN: -0.15, thighF: -0.25 });
const SPELL_MID = pose({ ...SPELL_UP, armN: 2.2, foreN: 0.2, torso: 0.02 });
const SPELL_HIT = pose({ hips: [0.025, -0.02], torso: -0.22, head: 0.14, armN: 1.6, foreN: 0.0, handN: -0.1, armF: -0.9, foreF: 0.35,
    thighN: 0.5, shinN: -0.45, thighF: -0.42, shinF: -0.05 });
const SPELL_END = pose({ ...SPELL_HIT, armN: 1.4, foreN: 0.25, torso: -0.15 });

// ---------- Bão Nguyên Tố / Mưa Giông: 2 tay giơ cao gọi bão ----------
const STORM_A = pose({ hips: [0, -0.02], torso: 0.18, head: -0.25, armN: 1.75, foreN: 0.55, handN: -0.2, armF: 1.45, foreF: 0.7, handF: -0.2,
    thighN: 0.25, shinN: -0.2, thighF: -0.28, shinF: 0.02 });
const STORM_B = pose({ ...STORM_A, hips: [0, -0.012], torso: 0.22, head: -0.3, armN: 1.85, foreN: 0.5, armF: 1.55 });
const STORM_MID = pose({ ...READY, armN: 1.8, armF: 1.2, foreF: 0.6 });   // khoá trung gian (tay xa vòng ra trước, tránh bước > π)

// ---------- Băng Hoại Hỏa Thiên (SolarBeam kiểu Kamehameha): khum 2 tay về hông sau dồn lực -> đẩy thẳng 2 tay ra trước giữ tia ----------
const BEAM_CHARGE = pose({ hips: [-0.025, -0.03], torso: 0.16, head: -0.04, armN: -0.55, foreN: 1.75, handN: 0.1, armF: -0.45, foreF: 1.8, handF: 0.1,
    thighN: 0.6, shinN: -0.6, thighF: -0.5, shinF: -0.12 });
const BEAM_CHARGE_B = pose({ ...BEAM_CHARGE, hips: [-0.03, -0.036], torso: 0.2, head: -0.07, armN: -0.62, armF: -0.52 });
// 2 lòng bàn tay đẩy ra ngang ngực, ngay dưới Sách (Sách lơ lửng phía trên không che tay)
const BEAM_HOLD = pose({ hips: [0.03, -0.034], torso: -0.18, head: 0.12, armN: 1.1, foreN: 0.35, handN: -0.05, armF: 1.0, foreF: 0.42, handF: -0.05,
    thighN: 0.68, shinN: -0.62, thighF: -0.62, shinF: -0.04 });
const BEAM_HOLD_B = pose({ ...BEAM_HOLD, hips: [0.026, -0.038], torso: -0.15, armN: 1.14, foreN: 0.31, armF: 1.04 });

// ---------- Trúng đòn / choáng / thắng / chết ----------
const HURT = pose({ hips: [-0.03, -0.01], torso: 0.25, head: 0.2, armN: -0.3, foreN: 0.9, armF: 0.35, foreF: 0.6, thighN: 0.3, shinN: -0.35, thighF: -0.1 });
const STUN_A = pose({ torso: 0.12, head: 0.3, armN: 0.1, foreN: 0.4, armF: 0.15, foreF: 0.3 });
const STUN_B = pose({ ...STUN_A, torso: -0.05, head: -0.1 });
const WIN_UP = pose({ dropN: 1, hips: [0, -0.01], torso: 0.1, head: -0.18, armN: 2.6, foreN: 0.5, armF: 0.9, foreF: 1.5, liftF: 1, thighN: 0.15, shinN: -0.1, thighF: -0.2 });
const WIN = pose({ torso: 0.06, head: -0.1, armN: 1.9, foreN: 0.7, handN: -0.2, armF: 0.6, foreF: 1.6, liftF: 1, thighN: 0.1, shinN: -0.05, thighF: -0.25, shinF: 0.05 });
const WIN_B = pose({ ...WIN, hips: [0, 0.006], armN: 2.0, foreN: 0.65 });
const DEAD = pose({ air: true, torso: 0.2, head: 0.4, armN: 0.3, foreN: 0.4, armF: 0.4, foreF: 0.3, thighN: 0.3, shinN: -0.5, thighF: -0.1, shinF: -0.2 });

export function elarionClips(parts, height) {
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height);
    return [
        c('idle', [0, 1.2, 2.4], [IDLE, IDLE_IN, IDLE]),
        c('ready', [0, 0.9, 1.8], [READY, READY_IN, READY]),
        c('move', [0, 0.16, 0.32, 0.48, 0.64], [...RUN, RUN[0]]),
        c('fall', [0, 0.3], [FALL, FALL]),
        c('land', [0, 0.06, 0.35, 0.65], [LAND, LAND, LAND_HOLD, IDLE]),
        c('attack', [0, 0.12, 0.22, 0.34, 0.55], [READY, BOLT_WIND, BOLT_HIT, BOLT_END, READY]),                  // chưởng tia nguyên tố (hit 0.22)
        c('book', [0, 0.14, 0.4, 0.6], [READY, BOOK_A, BOOK_B, READY]),                                           // đọc Sách (0.2)
        c('spell', [0, 0.18, 0.3, 0.38, 0.5, 0.75], [READY, SPELL_UP, SPELL_MID, SPELL_HIT, SPELL_END, READY]),   // tung phép (0.38)
        c('storm', [0, 0.1, 0.25, 0.5, 0.8, 0.95], [READY, STORM_MID, STORM_A, STORM_B, STORM_A, READY]),        // gọi bão (0.3)
        c('channel', [0, 0.6, 1.2], [STORM_A, STORM_B, STORM_A]),                                                   // Mưa Giông: đứng thi triển (lặp)
        c('beamCharge', [0, 0.14, 0.6, 0.7], [READY, BEAM_CHARGE, BEAM_CHARGE_B, BEAM_CHARGE_B]),                   // SolarBeam: dồn lực 0,7s
        c('beam', [0, 0.1, 0.2], [BEAM_HOLD, BEAM_HOLD_B, BEAM_HOLD]),                                             // SolarBeam: giữ tia (lặp, rung giật)
        c('cast', [0, 0.5, 1.0], [BOOK_A, BOOK_B, BOOK_A]),                                                         // niệm (lặp)
        c('hurt', [0, 0.06, 0.18, 0.4], [IDLE, HURT, pose({ ...HURT, torso: 0.18, hips: [-0.015, -0.006] }), IDLE]),
        c('stunned', [0, 0.35, 0.7], [STUN_A, STUN_B, STUN_A]),
        c('victory', [0, 0.25, 0.5, 0.8], [IDLE, WIN_UP, WIN, WIN]),
        c('victoryIdle', [0, 0.9, 1.8], [WIN, WIN_B, WIN]),
        c('dead', [0, 1], [DEAD, DEAD]),
    ];
}

export const DEFAULT_SKINS = { handN: 'palm', handF: 'relax', eye: 'open', book: 'closed' };
export const SKIN_KEYS = {
    ready: [[0, 'eye', 'determined'], [0, 'book', 'half']],
    move: [[0, 'handN', 'relax']],
    attack: [[0, 'eye', 'determined'], [0, 'book', 'half'], [0.12, 'handN', 'push']],
    book: [[0, 'eye', 'cast'], [0, 'handF', 'mudra'], [0, 'book', 'open'], [0.18, 'book', 'glow']],
    spell: [[0, 'eye', 'cast'], [0, 'book', 'glow'], [0.3, 'handN', 'push'], [0.5, 'book', 'open']],
    storm: [[0, 'eye', 'cast'], [0, 'book', 'glow'], [0.2, 'handN', 'push'], [0.2, 'handF', 'push']],
    channel: [[0, 'eye', 'cast'], [0, 'book', 'glow'], [0, 'handN', 'push'], [0, 'handF', 'push']],
    beamCharge: [[0, 'eye', 'determined'], [0, 'book', 'glow'], [0, 'handN', 'palm'], [0, 'handF', 'palm']],
    beam: [[0, 'eye', 'determined'], [0, 'book', 'glow'], [0, 'handN', 'push'], [0, 'handF', 'push']],
    cast: [[0, 'eye', 'cast'], [0, 'handF', 'mudra'], [0, 'book', 'open']],
    hurt: [[0.03, 'eye', 'pain'], [0.32, 'eye', 'open']],
    stunned: [[0, 'eye', 'pain'], [0, 'handN', 'relax']],
    victory: [[0, 'eye', 'happy'], [0, 'handF', 'mudra'], [0, 'book', 'glow']],
    victoryIdle: [[0, 'eye', 'happy'], [0, 'handF', 'mudra'], [0, 'book', 'open']],
    dead: [[0, 'eye', 'blink'], [0, 'handN', 'relax']],
};

// Lò xo: tóc sau, 2 vạt áo choàng (bay ra sau khi chạy), sách lơ lửng (lắc nhẹ)
export const SECONDARY = {
    hairBack: { speed: -0.04, fall: -0.1, gravity: 0.35, sway: 0.035, phase: 0.2, limit: [-0.45, 0.3], stiff: 26, damp: 5 },
    tailB: { speed: -0.045, fall: -0.1, gravity: 0.5, sway: 0.06, phase: 0.9, limit: [-0.9, 0.35], stiff: 22, damp: 4.5 },
    tailF: { speed: -0.05, fall: -0.1, gravity: 0.6, sway: 0.05, phase: 1.7, limit: [-0.9, 0.4], stiff: 24, damp: 4.5 },
    book: { speed: -0.012, fall: 0, gravity: 0, sway: 0.08, phase: 0.4, limit: [-0.35, 0.35], stiff: 18, damp: 4 },
};
/** Sách nhấp nhô lên xuống (biên độ theo chiều cao nhân vật, chu kỳ giây) */
export const FLOAT = { book: { amp: 0.025, period: 2.2 } };
export const LOCOMOTION = { runSpeed: 7, dashSpeed: 99, runClip: 'move', dashClip: 'move' };
