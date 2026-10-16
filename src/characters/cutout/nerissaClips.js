// ============================================================
// ĐỘNG TÁC NERISSA (Thủy Vũ) — Tu Sĩ nước, vũ công dải lụa
// ============================================================
// Góc khớp (rad): 0 = tay / chân buông thẳng xuống, dương = đưa ra TRƯỚC (thân / đầu: dương = ngả ra SAU).
// Dải lụa (ribN*, ribF*) và tóc sau / vạt váy là LÒ XO (SECONDARY) -> tự bay theo tay, không cần khoá động tác.
// Mỗi bước giữa 2 khoá của 1 khớp phải < π (nội suy quaternion đi đường ngắn) -> vòng tay qua đầu có khoá trung gian.
// Kỹ năng là các ĐIỆU MÚA lặp (server giữ trạng thái 'dancing' + danceKey):
//   dance1 Vũ Khúc Sóng Triều · dance2 Lưu Thủy Hồi Xuân · dance3 Thủy Thần Vũ
//   dance12 / dance13 / dance23 / dance123: các điệu múa khi nhiều kỹ năng chạy cùng lúc (mỗi tổ hợp 1 điệu riêng)
import { buildPoseClip } from './poseClip.js';

const BASE = { hips: [0, 0], torso: 0, head: 0, hairBack: 0, armN: 0, foreN: 0, handN: 0, armF: 0, foreF: 0, handF: 0,
    thighN: 0, shinN: 0, thighF: 0, shinF: 0 };
const pose = (o) => ({ ...BASE, ...o });

// ---------- Đứng / thủ thế ----------
const IDLE = pose({ torso: 0.02, head: -0.02, armN: 0.25, foreN: 0.9, handN: 0.2, armF: -0.3, foreF: 0.35, handF: 0.3,
    thighN: 0.1, shinN: -0.05, thighF: -0.12, shinF: 0.06 });
const IDLE_IN = pose({ ...IDLE, hips: [0, -0.004], torso: 0.04, head: -0.05, armN: 0.3, foreN: 0.95, armF: -0.26 });
const READY = pose({ hips: [0, -0.01], torso: -0.06, head: 0.04, armN: 1.1, foreN: 0.55, handN: 0.3, armF: -0.75, foreF: 0.45, handF: 0.4,
    thighN: 0.28, shinN: -0.25, thighF: -0.25, shinF: 0.05 });
const READY_IN = pose({ ...READY, hips: [0, -0.016], armN: 1.2, foreN: 0.45, armF: -0.82, thighN: 0.32, shinN: -0.3 });

// ---------- Chạy nhẹ nhàng (bước múa) ----------
const RUN_BODY = { torso: -0.12, head: 0.08, foreN: 0.6, foreF: 0.5 };
const RUN = [
    pose({ ...RUN_BODY, hips: [0, -0.01], thighN: 0.6, shinN: -0.25, thighF: -0.45, shinF: -0.65, armN: -0.45, armF: 0.55 }),
    pose({ ...RUN_BODY, hips: [0, 0.014], thighN: 0.05, shinN: -0.25, thighF: 0.15, shinF: -1.15, armN: 0.05, armF: 0.05 }),
    pose({ ...RUN_BODY, hips: [0, -0.01], thighN: -0.45, shinN: -0.65, thighF: 0.6, shinF: -0.25, armN: 0.55, armF: -0.45 }),
    pose({ ...RUN_BODY, hips: [0, 0.014], thighN: 0.15, shinN: -1.15, thighF: 0.05, shinF: -0.25, armN: 0.05, armF: 0.05 }),
];
const FALL = pose({ air: true, torso: -0.1, head: 0.1, armN: 2.2, foreN: 0.4, armF: -1.6, foreF: 0.3, thighN: 0.8, shinN: -1.3, thighF: 0.3, shinF: -1.1 });
const LAND = pose({ hips: [0, -0.08], torso: -0.3, head: 0.25, armN: 1.4, foreN: 0.4, armF: -1.2, foreF: 0.3, thighN: 1.1, shinN: -1.5, thighF: -0.15, shinF: -1.4 });
const LAND_HOLD = pose({ ...LAND, hips: [0, -0.07], torso: -0.25 });

// ---------- Đánh thường: quất lụa (vung tay gần ra sau-lên -> quất ra trước, giọt nước bay đi) ----------
const WHIP_WIND = pose({ hips: [-0.01, -0.01], torso: 0.12, head: -0.05, armN: -1.2, foreN: 0.9, armF: 0.5, foreF: 0.4,
    thighN: 0.2, shinN: -0.2, thighF: -0.3, shinF: 0.05 });
const WHIP_MID = pose({ torso: 0.0, armN: 0.6, foreN: 0.4, armF: 0.1, foreF: 0.3, thighN: 0.3, shinN: -0.25, thighF: -0.3 });
const WHIP_HIT = pose({ hips: [0.02, -0.015], torso: -0.18, head: 0.12, armN: 1.7, foreN: 0.05, handN: -0.2, armF: -0.6, foreF: 0.4,
    thighN: 0.45, shinN: -0.35, thighF: -0.4, shinF: -0.05 });
const WHIP_END = pose({ ...WHIP_HIT, armN: 1.45, foreN: 0.25 });

// ---------- Niệm (vào điệu múa) ----------
const CAST = pose({ hips: [0, -0.02], torso: 0.08, head: -0.15, armN: 2.6, foreN: 0.5, armF: 2.4, foreF: 0.6, handF: 0.2,
    thighN: 0.15, shinN: -0.1, thighF: -0.15 });
const CAST_B = pose({ ...CAST, hips: [0, -0.012], torso: 0.12, armN: 2.7, armF: 2.55 });
const SPIN_MID = pose({ ...READY, armN: 1.8, armF: 0.9, foreF: 0.6 });   // khoá trung gian (tay xa vòng ra trước, tránh bước > π)

// ---------- ĐIỆU MÚA ----------
// dance1 — Sóng Triều: hai tay quay vòng như sóng cuộn (tay gần vòng qua đầu ra trước, tay xa ngược pha), bước nhún
const D1 = [
    pose({ hips: [0, -0.01], torso: -0.05, head: 0.05, armN: 0.4, foreN: 0.6, armF: -1.0, foreF: 0.4, thighN: 0.25, shinN: -0.3, thighF: -0.2 }),
    pose({ hips: [0, 0.01], torso: 0.08, head: -0.08, armN: 1.9, foreN: 0.3, armF: -0.3, foreF: 0.6, thighN: 0.1, shinN: -0.1, thighF: -0.1 }),
    pose({ dropN: 1, hips: [0, 0.015], torso: 0.15, head: -0.15, armN: 3.0, foreN: 0.2, armF: 0.8, foreF: 0.5, thighN: -0.05, shinN: -0.05, thighF: 0.05 }),
    pose({ hips: [0, -0.005], torso: 0.02, head: 0.0, armN: 1.4, foreN: 0.8, armF: 1.9, foreF: 0.3, thighN: 0.2, shinN: -0.25, thighF: -0.2 }),
];
// dance2 — Lưu Thủy: chậm, uyển chuyển, tay buông rủ như suối, nghiêng người sang hai bên, khuỵu gối mềm
const D2 = [
    pose({ hips: [-0.01, -0.02], torso: 0.1, head: 0.05, armN: -0.6, foreN: 0.5, handN: 0.4, armF: -1.1, foreF: 0.3, thighN: 0.4, shinN: -0.55, thighF: -0.15, shinF: -0.1 }),
    pose({ hips: [0, -0.01], torso: 0.0, head: -0.05, armN: 0.5, foreN: 0.9, handN: 0.5, armF: -0.4, foreF: 0.6, thighN: 0.2, shinN: -0.2, thighF: -0.1 }),
    pose({ hips: [0.01, -0.025], torso: -0.15, head: 0.12, armN: 1.3, foreN: 0.3, handN: 0.3, armF: 0.6, foreF: 0.7, thighN: 0.1, shinN: -0.2, thighF: -0.45, shinF: -0.4 }),
    pose({ hips: [0, -0.01], torso: -0.02, head: 0.0, armN: 0.4, foreN: 0.8, handN: 0.5, armF: -0.3, foreF: 0.6, thighN: 0.25, shinN: -0.3, thighF: -0.15 }),
];
// dance3 — Thủy Thần Vũ: hai tay giơ cao trên đầu thay phiên, nhón chân, ngửa người — lụa bay cao
const D3 = [
    pose({ dropN: 1, hips: [0, 0.01], torso: 0.12, head: -0.2, armN: 2.8, foreN: 0.35, armF: 2.2, foreF: 0.5, thighN: 0.05, shinN: -0.05, thighF: -0.1, shinF: 0.05 }),
    pose({ dropN: 1, hips: [0, 0.025], torso: 0.2, head: -0.28, armN: 3.2, foreN: 0.2, armF: 2.9, foreF: 0.3, thighN: -0.05, shinN: 0.0, thighF: 0.0 }),
    pose({ dropN: 1, hips: [0, 0.01], torso: 0.08, head: -0.15, armN: 2.3, foreN: 0.6, armF: 3.1, foreF: 0.25, thighN: 0.1, shinN: -0.1, thighF: -0.15 }),
    pose({ dropN: 1, hips: [0, 0.02], torso: 0.16, head: -0.22, armN: 2.9, foreN: 0.3, armF: 2.6, foreF: 0.4, thighN: 0.0, shinN: 0.0, thighF: -0.05 }),
];
// dance12 — xoay + vẩy nước: dang rộng 2 tay, xoay nửa vòng (thân ngả trước/sau), bước nhanh
const D12 = [
    pose({ hips: [0, -0.01], torso: -0.15, head: 0.1, armN: 1.6, foreN: 0.1, armF: -1.6, foreF: 0.1, thighN: 0.45, shinN: -0.4, thighF: -0.3, shinF: -0.2 }),
    pose({ hips: [0, 0.012], torso: 0.05, head: -0.05, armN: 2.4, foreN: 0.2, armF: -0.6, foreF: 0.8, thighN: 0.0, shinN: -0.1, thighF: 0.2, shinF: -0.9 }),
    pose({ hips: [0, -0.01], torso: 0.18, head: -0.12, armN: 0.6, foreN: 0.9, armF: 1.6, foreF: 0.1, thighN: -0.3, shinN: -0.2, thighF: 0.45, shinF: -0.4 }),
    pose({ hips: [0, 0.012], torso: 0.0, head: 0.0, armN: -0.6, foreN: 0.8, armF: 1.0, foreF: 0.6, thighN: 0.2, shinN: -0.9, thighF: 0.0, shinF: -0.1 }),
];
// dance13 — nhảy bật: bật lên (air), co 1 chân, 2 tay vung cao; đáp xuống khuỵu
const D13 = [
    pose({ hips: [0, -0.05], torso: -0.2, head: 0.15, armN: 0.8, foreN: 0.6, armF: -0.9, foreF: 0.4, thighN: 0.8, shinN: -1.0, thighF: -0.1, shinF: -0.9 }),
    pose({ air: true, dropN: 1, hips: [0, 0.12], torso: 0.15, head: -0.2, armN: 2.9, foreN: 0.2, armF: 2.0, foreF: 0.4, thighN: 1.2, shinN: -1.8, thighF: -0.35, shinF: -0.1 }),
    pose({ air: true, dropN: 1, hips: [0, 0.1], torso: 0.1, head: -0.15, armN: 2.6, foreN: 0.3, armF: 2.9, foreF: 0.2, thighN: 0.3, shinN: -0.2, thighF: 0.9, shinF: -1.6 }),
    pose({ hips: [0, -0.04], torso: -0.15, head: 0.1, armN: 1.2, foreN: 0.5, armF: 0.3, foreF: 0.6, thighN: 0.7, shinN: -0.9, thighF: -0.2, shinF: -0.7 }),
];
// dance23 — lả lướt trên mặt nước: bước dài, thân hạ thấp, 2 tay quét ngang như rẽ sóng
const D23 = [
    pose({ hips: [0, -0.06], torso: -0.3, head: 0.25, armN: 1.5, foreN: 0.0, armF: -1.4, foreF: 0.1, thighN: 0.9, shinN: -0.8, thighF: -0.5, shinF: -0.05 }),
    pose({ hips: [0, -0.04], torso: -0.18, head: 0.15, armN: 1.0, foreN: 0.5, armF: -0.8, foreF: 0.6, thighN: 0.5, shinN: -0.6, thighF: -0.3, shinF: -0.4 }),
    pose({ hips: [0, -0.06], torso: -0.05, head: 0.05, armN: -1.2, foreN: 0.2, armF: 1.5, foreF: 0.0, thighN: -0.5, shinN: -0.05, thighF: 0.9, shinF: -0.8 }),
    pose({ hips: [0, -0.04], torso: -0.15, head: 0.12, armN: -0.6, foreN: 0.6, armF: 0.9, foreF: 0.5, thighN: -0.3, shinN: -0.4, thighF: 0.5, shinF: -0.6 }),
];
// dance123 — Đại Vũ: bật cao + quay tay vòng lớn + tung lụa, nốt nhạc bay quanh
const D123 = [
    pose({ dropN: 1, hips: [0, -0.03], torso: -0.1, head: 0.05, armN: 2.2, foreN: 0.2, armF: -1.8, foreF: 0.2, thighN: 0.6, shinN: -0.7, thighF: -0.3, shinF: -0.3 }),
    pose({ air: true, dropN: 1, hips: [0, 0.14], torso: 0.2, head: -0.25, armN: 3.1, foreN: 0.1, armF: -0.4, foreF: 0.9, thighN: 1.1, shinN: -1.7, thighF: -0.4, shinF: -0.2 }),
    pose({ air: true, dropN: 1, hips: [0, 0.12], torso: 0.12, head: -0.2, armN: 2.3, foreN: 0.5, armF: 1.4, foreF: 0.3, thighN: -0.3, shinN: -0.2, thighF: 1.0, shinF: -1.6 }),
    pose({ hips: [0, -0.02], torso: -0.05, head: 0.0, armN: 1.2, foreN: 0.7, armF: 1.0, foreF: 0.6, thighN: 0.3, shinN: -0.4, thighF: -0.2, shinF: -0.2 }),
];

// ---------- Trúng đòn / choáng / thắng / chết ----------
const HURT = pose({ hips: [-0.03, -0.01], torso: 0.25, head: 0.2, armN: -0.4, foreN: 0.7, armF: 0.4, foreF: 0.6, thighN: 0.3, shinN: -0.35, thighF: -0.1 });
const STUN_A = pose({ torso: 0.12, head: 0.3, armN: 0.1, foreN: 0.3, armF: 0.2, foreF: 0.3 });
const STUN_B = pose({ ...STUN_A, torso: -0.05, head: -0.1 });
const WIN_UP = pose({ air: true, dropN: 1, hips: [0, 0.05], torso: 0.12, head: -0.2, armN: 2.9, foreN: 0.3, armF: 2.4, foreF: 0.4, thighN: 0.6, shinN: -1.2, thighF: -0.1, shinF: -0.4 });
const WIN = pose({ torso: 0.08, head: -0.1, armN: 2.0, foreN: 0.5, armF: 1.3, foreF: 0.2, thighN: 0.05, shinN: 0.0, thighF: -0.35, shinF: -0.6 });
const WIN_B = pose({ ...WIN, hips: [0, 0.008], armN: 2.15, armF: 1.4 });
const DEAD = pose({ air: true, torso: 0.2, head: 0.4, armN: 0.3, foreN: 0.4, armF: 0.4, foreF: 0.3, thighN: 0.3, shinN: -0.5, thighF: -0.1, shinF: -0.2 });

const loop = (keys, T) => ({ times: [0, T / 4, T / 2, (3 * T) / 4, T], poses: [...keys, keys[0]] });

export function nerissaClips(parts, height) {
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height);
    const L = (name, keys, T) => { const l = loop(keys, T); return c(name, l.times, l.poses); };
    return [
        c('idle', [0, 1.1, 2.2], [IDLE, IDLE_IN, IDLE]),
        c('ready', [0, 0.85, 1.7], [READY, READY_IN, READY]),
        c('move', [0, 0.15, 0.3, 0.45, 0.6], [...RUN, RUN[0]]),
        c('fall', [0, 0.3], [FALL, FALL]),
        c('land', [0, 0.06, 0.35, 0.65], [LAND, LAND, LAND_HOLD, IDLE]),
        c('attack', [0, 0.12, 0.18, 0.24, 0.36, 0.6], [READY, WHIP_WIND, WHIP_MID, WHIP_HIT, WHIP_END, READY]),   // quất lụa (hit 0.24)
        c('cast', [0, 0.4, 0.8], [CAST, CAST_B, CAST]),
        c('spin', [0, 0.1, 0.2, 0.32, 0.42, 0.55], [READY, SPIN_MID, CAST, CAST_B, SPIN_MID, READY]),          // vào điệu múa (0.3)
        L('dance1', D1, 1.6),
        L('dance2', D2, 2.4),
        L('dance3', D3, 2.0),
        L('dance12', D12, 1.4),
        L('dance13', D13, 1.3),
        L('dance23', D23, 1.8),
        L('dance123', D123, 1.5),
        c('hurt', [0, 0.06, 0.18, 0.4], [IDLE, HURT, pose({ ...HURT, torso: 0.18, hips: [-0.015, -0.006] }), IDLE]),
        c('stunned', [0, 0.35, 0.7], [STUN_A, STUN_B, STUN_A]),
        c('victory', [0, 0.2, 0.45, 0.8], [IDLE, WIN_UP, WIN, WIN]),
        c('victoryIdle', [0, 0.9, 1.8], [WIN, WIN_B, WIN]),
        c('dead', [0, 1], [DEAD, DEAD]),
    ];
}

export const DEFAULT_SKINS = { handN: 'grip', handF: 'dance', eye: 'open' };
const danceSkins = (eye) => [[0, 'eye', eye], [0, 'handF', 'dance']];
export const SKIN_KEYS = {
    ready: [[0, 'eye', 'determined']],
    attack: [[0, 'eye', 'determined'], [0.1, 'handF', 'palm']],
    cast: [[0, 'eye', 'sing'], [0, 'handF', 'palm']],
    spin: [[0, 'eye', 'happy']],
    dance1: danceSkins('happy'),
    dance2: danceSkins('sing'),
    dance3: [[0, 'eye', 'sing'], [0, 'handF', 'palm']],
    dance12: danceSkins('happy'),
    dance13: danceSkins('happy'),
    dance23: danceSkins('sing'),
    dance123: [[0, 'eye', 'sing'], [0, 'handF', 'dance']],
    hurt: [[0.03, 'eye', 'pain'], [0.32, 'eye', 'open']],
    stunned: [[0, 'eye', 'pain'], [0, 'handF', 'relax']],
    victory: [[0, 'eye', 'happy'], [0, 'handF', 'point']],
    victoryIdle: [[0, 'eye', 'happy'], [0, 'handF', 'point']],
    dead: [[0, 'eye', 'blink'], [0, 'handF', 'relax']],
};

// Lò xo: tóc sau, 2 vạt váy, từng đoạn dải lụa (đoạn sau mềm hơn đoạn trước -> lụa uốn như sóng)
const rib = (i, n, phase) => ({ speed: -0.06, fall: -0.06, gravity: 1.0, sway: 0.1 + i * 0.05, phase: phase + i * 0.7,
    limit: [-3.1, 3.1], stiff: 34 - i * 3, damp: 4.2 - i * 0.2 });
export const SECONDARY = {
    hairBack: { speed: -0.05, fall: -0.1, gravity: 0.35, sway: 0.04, phase: 0.2, limit: [-0.5, 0.35], stiff: 26, damp: 5 },
    panelN: { speed: -0.06, fall: -0.1, gravity: 0.5, sway: 0.06, phase: 0.9, limit: [-0.9, 0.4], stiff: 24, damp: 4.5 },
    panelF: { speed: -0.06, fall: -0.1, gravity: 0.5, sway: 0.06, phase: 1.6, limit: [-0.9, 0.4], stiff: 22, damp: 4.5 },
    ...Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(i => [`ribN${i}`, rib(i, 7, 0)])),
    ...Object.fromEntries([0, 1, 2, 3].map(i => [`ribF${i}`, rib(i, 4, 2)])),
};
export const LOCOMOTION = { runSpeed: 7, dashSpeed: 99, runClip: 'move', dashClip: 'move' };
