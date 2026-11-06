// ============================================================
// ROK — BẢN KHUNG XƯƠNG MỀM (thử nghiệm)
// ============================================================
// Dùng lại tranh tách bộ phận + tư thế của bản ghép mảnh (cutout/rok2Rig.js, cutout/rokClips.js),
// nhưng: nhịp động tác có lấy đà / vượt quá / khựng khi trúng, tóc + áo choàng + khăn uốn cong theo quán tính,
// đổi skin bằng màu, đổi vũ khí.
import { ROK2_RIG } from '../cutout/rok2Rig.js';
import { ROK_POSES as P, rokPrep, rokPose, rokBlade } from '../cutout/rokClips.js';

export const ROK_SOFT_RIG = ROK2_RIG;

// ---------- Mảnh nào đổi màu kiểu gì, mảnh nào uốn cong ----------
const ARMOR = ['torso', 'belt', 'armN', 'armF', 'foreN', 'foreF', 'thighN', 'thighF', 'shinN', 'shinF', 'handN', 'handF', 'shield'];
export const ROK_SOFT = {
    kinds: { ...Object.fromEntries(ARMOR.map(k => [k, 'armor'])), cape: 'cloth', scarf: 'cloth', sword: 'weapon' },
    bend: {
        // áo choàng: mềm nhất, gợn sóng khi chạy, rủ theo trọng lực
        cape: { seg: [10, 10], stiff: 26, damp: 4.2, gravity: 0.55, inertiaX: 0.06, inertiaY: 0.015, spin: 0.12, drag: 0.03,
            wave: 0.1, waveSpeed: 6.5, waveLen: 1.6, pow: 1.35, limit: [-0.8, 0.8], breath: 0.015 },
        scarf: { seg: [6, 10], stiff: 40, damp: 5, gravity: 0.6, inertiaX: 0.05, inertiaY: 0.01, spin: 0.1, drag: 0.02,
            wave: 0.08, waveSpeed: 8, waveLen: 1.4, pow: 1.5, limit: [-0.7, 0.7] },
        // tóc: cứng hơn, nảy nhẹ khi nhún / chém
        hairFront: { seg: [8, 6], stiff: 110, damp: 7, gravity: 0, inertiaX: 0.012, inertiaY: 0.012, spin: 0.05,
            pow: 2.0, limit: [-0.18, 0.18], breath: 0.01 },
        hairBack: { seg: [8, 6], stiff: 85, damp: 6, gravity: 0.1, inertiaX: 0.016, inertiaY: 0.014, spin: 0.06,
            pow: 1.8, limit: [-0.22, 0.22], breath: 0.012 },
    },
};

// ---------- Skin (chỉ đổi màu, không vẽ lại) ----------
export const ROK_SKINS = {
    goc:     { label: 'Gốc · Áo đỏ', clothHue: 0, clothSat: 1, clothVal: 1, metal: [1, 1, 1], metalMix: 0, metalVal: 1 },
    hoangGia:{ label: 'Hoàng Gia · Xanh', clothHue: 0.62, clothSat: 1.05, clothVal: 0.92, metal: [0.95, 0.97, 1.0], metalMix: 0.35, metalVal: 1.08 },
    hoangKim:{ label: 'Hoàng Kim', clothHue: 0.97, clothSat: 1.1, clothVal: 0.7, metal: [1.0, 0.78, 0.32], metalMix: 0.85, metalVal: 1.05 },
    hacKy:   { label: 'Hắc Kỵ Sĩ', clothHue: 0.76, clothSat: 0.9, clothVal: 0.62, metal: [0.42, 0.45, 0.55], metalMix: 0.9, metalVal: 0.85 },
};
// ---------- Vũ khí: màu lưỡi, ánh sáng, màu vệt chém ----------
export const ROK_WEAPONS = {
    thep: { label: 'Kiếm Thép', tint: [1, 1, 1], mix: 0, glow: [0, 0, 0], trail: [0xffffff, 0xbfd6ff], spark: 0xfff2c0 },
    lua:  { label: 'Kiếm Lửa', tint: [1.0, 0.55, 0.25], mix: 0.75, glow: [0.35, 0.1, 0.0], trail: [0xffe08a, 0xff5a1a], spark: 0xffa040, embers: 0xff7a20 },
    bang: { label: 'Kiếm Băng', tint: [0.6, 0.9, 1.0], mix: 0.8, glow: [0.05, 0.2, 0.32], trail: [0xffffff, 0x5ad2ff], spark: 0xbff4ff, embers: 0xaef0ff },
    loi:  { label: 'Kiếm Sấm', tint: [0.8, 0.7, 1.0], mix: 0.75, glow: [0.22, 0.1, 0.4], trail: [0xf4e8ff, 0xa060ff], spark: 0xe0c8ff, embers: 0xc890ff },
};

// ---------- Động tác ----------
const k = (t, p, e) => ({ t, p: rokPrep(p), e });
// Thêm tư thế lấy đà / vượt quá cho chém (mượt hơn bản cũ: có chuẩn bị, có dư âm)
const SLASH_ANTIC = rokPose(rokBlade({ ...P.SLASH_WIND, hips: [-0.03, -0.02], torso: 0.24, head: -0.08, armN: 3.5, foreN: -0.55,
    thighN: 0.2, shinN: -0.35, thighF: -0.1, shinF: -0.05 }, 3.0));
const SLASH_OVER = rokPose(rokBlade({ ...P.SLASH_HIT, hips: [0.05, -0.045], torso: -0.36, head: 0.24, armN: 1.25, foreN: 0.1,
    thighN: 0.7, shinN: -0.7 }, -0.65));
const READY_ND = { ...P.READY, dropN: 0 };
const BASH_OVER = rokPose({ ...P.BASH_HIT, noTuck: true, hips: [0.075, -0.07], torso: -0.5, armF: 1.55, foreF: 0.05 });
const HURT_B = rokPose({ ...P.HURT, torso: 0.38, head: 0.33, hips: [-0.055, -0.02] });

export const ROK_CLIPS = {
    idle: { name: 'idle', loop: true, keys: [k(0, P.IDLE), k(0.95, P.IDLE_IN, 'sine'), k(1.9, P.IDLE, 'sine')] },
    ready: { name: 'ready', loop: true, keys: [k(0, P.READY), k(0.8, P.READY_IN, 'sine'), k(1.6, P.READY, 'sine')],
        eyes: [[0, 'eye', 'determined']] },
    move: { name: 'move', loop: true, eyes: [[0, 'eye', 'determined']],
        keys: [k(0, P.RUN[0]), k(0.13, P.RUN[1], 'sine'), k(0.26, P.RUN[2], 'sine'), k(0.39, P.RUN[3], 'sine'), k(0.52, P.RUN[0], 'sine')] },
    // chém: thủ thế -> lấy đà (giơ cao, ngả người) -> giữ một nhịp -> bổ xuống CỰC NHANH -> vượt quá -> thu về
    attack: { name: 'attack', hit: 0.33, hitStop: 0.07, trail: [0.27, 0.46], eyes: [[0.05, 'eye', 'angry'], [0.7, 'eye', 'determined']],
        keys: [k(0, READY_ND), k(0.05, { ...P.READY, dropN: 1 }, 'out'), k(0.2, SLASH_ANTIC, 'out'), k(0.26, P.SLASH_WIND, 'inOut'),
            k(0.3, P.SLASH_MID, 'in'), k(0.33, P.SLASH_HIT, 'linear'), k(0.4, SLASH_OVER, 'snap'), k(0.52, P.SLASH_FOLLOW, 'out'),
            k(0.85, READY_ND, 'back')] },
    taunt: { name: 'taunt', hit: 0.5, hitStop: 0.05, eyes: [[0.08, 'eye', 'angry']],
        keys: [k(0, P.IDLE), k(0.2, P.TAUNT_UP, 'back'), k(0.45, P.TAUNT_SHOUT, 'out'), k(0.5, P.TAUNT_SHOUT, 'linear'),
            k(0.62, P.TAUNT_BANG, 'in'), k(0.8, P.TAUNT_BANG, 'linear'), k(1.15, P.IDLE, 'back')] },
    bash: { name: 'bash', hit: 0.25, hitStop: 0.08, eyes: [[0, 'eye', 'angry']],
        keys: [k(0, P.IDLE), k(0.17, P.BASH_PREP, 'out'), k(0.25, P.BASH_HIT, 'in'), k(0.32, BASH_OVER, 'snap'),
            k(0.48, P.BASH_FOLLOW, 'out'), k(0.8, P.IDLE, 'back')] },
    hurt: { name: 'hurt', eyes: [[0.02, 'eye', 'pain'], [0.4, 'eye', 'open']],
        keys: [k(0, P.IDLE), k(0.07, HURT_B, 'snap'), k(0.2, P.HURT, 'out'), k(0.55, P.IDLE, 'back')] },
    guard: { name: 'guard', eyes: [[0, 'eye', 'angry'], [0.3, 'eye', 'determined']],
        keys: [k(0, P.IDLE), k(0.14, P.GUARD_RAISE, 'out'), k(0.32, P.GUARD, 'back'), k(0.9, P.GUARD_B, 'sine'), k(1.4, P.GUARD, 'sine'),
            k(1.75, P.IDLE, 'inOut')] },
    victory: { name: 'victory', eyes: [[0, 'eye', 'happy']],
        keys: [k(0, P.IDLE), k(0.12, { ...P.LAND_HOLD, air: false }, 'out'), k(0.32, P.WIN_UP, 'out'), k(0.55, P.WIN, 'back'),
            k(1.1, P.WIN_B, 'sine'), k(1.6, P.WIN, 'sine')] },
};
export const ROK_ACTIONS = [
    ['idle', 'Đứng thở'], ['ready', 'Thủ thế'], ['move', 'Chạy'], ['attack', 'Chém'], ['bash', 'Đẩy khiên'],
    ['taunt', 'Gầm khiêu khích'], ['guard', 'Dựng khiên'], ['hurt', 'Trúng đòn'], ['victory', 'Chiến thắng'],
];
