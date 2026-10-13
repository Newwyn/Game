// ============================================================
// ĐỘNG TÁC SÁT THỦ (bản 2D nhìn nghiêng)
// ============================================================
// Giống ảnh mẫu: tay GẦN (N, vai phía lưng) cầm PHI TIÊU LỚN; tay XA (F, vai phía ngực) KẾT ẤN / ném phi tiêu nhỏ.
// Quy ước góc (nhân vật nhìn sang PHẢI, tư thế gốc: tay chân buông thẳng):
//   dương = đưa chi ra TRƯỚC / ngả người ra SAU; âm = ngược lại
//   shin âm = gập gối; fore dương = gập khuỷu đưa cẳng tay ra trước
//   hips: [dx, dy] theo tỉ lệ chiều cao (dy dương = nhấc lên)   liftF: 1 = tay xa lên trước thân
// Tóc tết, ruy băng, vạt áo, tua rua KHÔNG nằm trong clip: CutoutCharacterView tự cho chúng đung đưa.
//
// Ánh xạ kỹ năng (theo loại kỹ năng ở server):
//   đánh thường -> attack (bổ phi tiêu lớn)       projectile (Phóng Bùa) -> throw (vung tay xa quăng lá bùa)
//   stealth (Tàng Hình) -> stealth (kết ấn nhanh)  melee_strike (Đột Kích) -> vanish rồi appear
import { buildPoseClip } from './poseClip.js';

const TAU = Math.PI * 2;

// ---------- Tư thế ----------
// Đứng chờ (như ảnh mẫu): tay gần buông, cầm phi tiêu lớn bên hông; tay xa kết ấn trước cằm; chân mở rộng
const IDLE = {
    hips: [0, 0], liftF: 1, torso: -0.04, head: 0.03,
    armN: 0.1, foreN: -0.8, handN: 0.2, shuriken: 0,
    armF: -0.25, foreF: 2.85, handF: -1.1,
    thighN: 0.22, shinN: -0.22, thighF: -0.14, shinF: 0.02,
};
const pose = (over) => ({ ...IDLE, ...over });
const IDLE_IN = pose({ hips: [0, -0.007], torso: -0.07, head: 0.06, armN: 0.12, foreN: -0.76, armF: -0.28, foreF: 2.9, handF: -1.15, shinN: -0.25, thighN: 0.25 });

// Thủ thế khi đã vào trận (đếm ngược / giữa các đòn): đứng thẳng lưng, hai chân mở (bàn chân phẳng),
// phi tiêu lớn kéo ra sau hông (để lộ dáng người), tay kia chìa ấn ra trước hướng về địch.
// Không khom người, không khuỵu sâu (ống quần phồng + vạt áo che đùi nên khuỵu sâu trông như ngồi xổm).
const READY = pose({
    torso: -0.1, head: 0.08,
    armN: -0.35, foreN: -0.5, handN: 0.2, shuriken: 0,
    armF: 0.55, foreF: 1.75, handF: -0.7,
    thighN: 0.4, shinN: -0.42, thighF: -0.28, shinF: 0.1,
});
const READY_IN = pose({ ...READY, torso: -0.12, head: 0.1, armN: -0.32, foreN: -0.46, armF: 0.52, foreF: 1.8, shuriken: -0.05, thighN: 0.42, shinN: -0.47 });

// Chạy: tay vung NGƯỢC với chân cùng bên. Tay gần ôm phi tiêu nên vung ít; tay xa nắm lại, vung mạnh (sau thân)
const RUN_BODY = { liftF: 0, torso: -0.22, head: 0.16, handN: 0.1, handF: 0.1, shuriken: 0.2 };
const RUN = [
    // chân gần chạm đất phía trước
    pose({ ...RUN_BODY, hips: [0, -0.012], thighN: 0.55, shinN: -0.25, thighF: -0.5, shinF: -0.75, armN: -0.75, foreN: -0.45, armF: 0.6, foreF: 1.3 }),
    // chân xa co lên vượt qua
    pose({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.0, shinN: -0.3, thighF: 0.15, shinF: -1.35, armN: -0.55, foreN: -0.5, armF: 0.0, foreF: 1.2 }),
    // chân xa chạm đất phía trước
    pose({ ...RUN_BODY, hips: [0, -0.012], thighN: -0.5, shinN: -0.75, thighF: 0.55, shinF: -0.25, armN: -0.3, foreN: -0.55, armF: -0.65, foreF: 1.3 }),
    // chân gần co lên vượt qua
    pose({ ...RUN_BODY, hips: [0, 0.016], thighN: 0.15, shinN: -1.35, thighF: 0.0, shinF: -0.3, armN: -0.55, foreN: -0.5, armF: 0.0, foreF: 1.2 }),
];

// Lướt kiểu ninja (khi di chuyển nhanh): đổ người, hai tay quặt thẳng ra sau, bước ngắn sát đất
const DASH_BASE = {
    liftF: 0, torso: -0.62, head: 0.5, armN: -1.5, foreN: 0.1, handN: 0.25, armF: -1.4, foreF: 0.15, handF: 0.25, shuriken: 0.4,
};
const DASH = [
    pose({ ...DASH_BASE, hips: [0.0, -0.06], thighN: 0.95, shinN: -1.45, thighF: -0.55, shinF: -0.85 }),
    pose({ ...DASH_BASE, hips: [0.0, -0.048], thighN: 0.6, shinN: -1.2, thighF: -0.2, shinF: -1.25, armN: -1.43, armF: -1.33 }),
    pose({ ...DASH_BASE, hips: [0.0, -0.06], thighN: 0.95, shinN: -1.45, thighF: -0.55, shinF: -0.85 }),
];

// Trên không (rơi xuống đầu trận): co gối, hai tay dang ra sau
const FALL = pose({
    air: true, liftF: 0, torso: -0.3, head: 0.25, armN: -1.9, foreN: 0.4, handN: 0.1, armF: -1.5, foreF: 0.7, handF: 0.3, shuriken: 0.5,
    thighN: 1.4, shinN: -1.9, thighF: 0.8, shinF: -1.7,
});
// Đáp đất: khuỵu gối, tay xa chống xuống trước, phi tiêu vung ra sau
const LAND = pose({
    liftF: 1, hips: [0.01, -0.15], torso: -0.55, head: 0.48,
    armN: -1.45, foreN: -0.3, handN: 0.2, shuriken: 0.8, armF: 0.45, foreF: 0.1, handF: 0.4,
    thighN: 1.5, shinN: -2.0, thighF: -0.1, shinF: -1.9,
});
const LAND_HOLD = pose({ ...LAND, hips: [0.01, -0.14], torso: -0.48, head: 0.42, armN: -1.35 });

// Đánh thường (tay gần): giơ phi tiêu lớn lên sau đầu rồi bổ xuống phía trước; tay xa kéo về sau
const SLASH_WIND = pose({ liftF: 0, hips: [-0.012, -0.01], torso: 0.14, head: -0.04, armN: -2.35, foreN: -0.45, handN: 0.1, shuriken: 0.6, armF: 0.4, foreF: 1.5, handF: 0, thighN: 0.35, shinN: -0.3, thighF: -0.35, shinF: -0.1 });
const SLASH_HIT = pose({ liftF: 0, hips: [0.045, -0.04], torso: -0.38, head: 0.25, armN: 1.45, foreN: 0.1, handN: -0.2, shuriken: -2.2, armF: -0.9, foreF: 0.9, handF: 0, thighN: 0.9, shinN: -0.55, thighF: -0.6, shinF: -0.3 });
const SLASH_FOLLOW = pose({ ...SLASH_HIT, hips: [0.035, -0.032], torso: -0.3, armN: 0.95, foreN: 0.3, shuriken: -3.8 });
const SLASH_END = pose({ shuriken: -TAU });

// Phóng Bùa (tay xa): vung qua vai (sau thân) rồi phóng ra trước (lên lớp trước thân)
const THROW_WIND = pose({ liftF: 1, hips: [-0.01, -0.006], torso: 0.2, head: -0.02, armF: -2.6, foreF: 1.6, handF: 0.2, armN: -0.6, foreN: 0.2, thighN: 0.3, shinN: -0.2, thighF: -0.25 });
const THROW_REL = pose({ liftF: 1, hips: [0.03, -0.022], torso: -0.4, head: 0.22, armF: 1.5, foreF: 0.05, handF: -0.1, armN: -0.9, foreN: 0.1, thighN: 0.75, shinN: -0.45, thighF: -0.5, shinF: -0.2 });
const THROW_FOLLOW = pose({ ...THROW_REL, armF: 1.15, foreF: 0.35, torso: -0.32 });

// Phóng Bùa kiểu NHẢY LÙI: nhún -> bật ngửa ra sau, vung tay qua vai -> quăng bùa giữa không trung -> đáp đất
// (vị trí lùi lại do CutoutCharacterView.leapTo() di chuyển; độ cao cú nhảy cũng do leapTo tạo)
const LEAP_PREP = pose({ hips: [0, -0.06], torso: -0.3, head: 0.22, armF: -0.6, foreF: 1.2, handF: 0.1, armN: -0.5, foreN: 0.2, thighN: 0.9, shinN: -1.3, thighF: 0.5, shinF: -1.2 });
const LEAP_WIND = pose({ air: true, torso: 0.35, head: 0.02, armF: -2.6, foreF: 1.6, handF: 0.2, armN: -0.9, foreN: 0.3, shuriken: 0.4, thighN: 1.2, shinN: -1.6, thighF: 0.6, shinF: -1.4 });
// thu người tròn lại khi lộn (CutoutCharacterView xoay cả người một vòng ra sau)
const LEAP_TUCK = pose({ air: true, torso: -0.5, head: 0.4, armF: 0.9, foreF: 1.9, handF: -0.3, armN: 0.6, foreN: 1.6, shuriken: 0.4, thighN: 1.9, shinN: -2.3, thighF: 1.7, shinF: -2.2 });
const LEAP_REL = pose({ air: true, liftF: 1, torso: -0.25, head: 0.2, armF: 1.5, foreF: 0.05, handF: -0.1, armN: -1.1, foreN: 0.2, shuriken: 0.4, thighN: 0.9, shinN: -1.2, thighF: 0.2, shinF: -0.9 });
const LEAP_FOLLOW = pose({ ...LEAP_REL, armF: 1.1, foreF: 0.4, thighN: 0.6, shinN: -0.8, thighF: 0.0, shinF: -0.6 });
const LEAP_LAND = pose({ liftF: 1, hips: [0, -0.1], torso: -0.35, head: 0.28, armF: 0.6, foreF: 1.3, handF: -0.4, armN: -0.6, foreN: -0.3, thighN: 1.1, shinN: -1.5, thighF: -0.1, shinF: -1.4 });

// Kết ấn (tay xa) đưa ấn lên trước mặt; tay gần giữ phi tiêu bên hông
const SEAL = pose({ liftF: 1, hips: [0, -0.02], torso: 0.04, head: -0.06, armF: 0.15, foreF: 2.55, handF: -1.25, armN: 0.05, foreN: -0.7, thighN: 0.4, shinN: -0.38, thighF: -0.4, shinF: -0.1 });
const SEAL_B = pose({ ...SEAL, hips: [0, -0.028], armF: 0.22, foreF: 2.6, head: -0.03 });

// Trúng đòn: ngửa người, hai tay hất ra trước
const HURT = pose({ liftF: 1, hips: [-0.045, -0.012], torso: 0.45, head: 0.36, armN: 0.5, foreN: 0.6, handN: 0.1, armF: 0.9, foreF: 0.9, handF: 0.2, thighN: 0.42, shinN: -0.55, thighF: -0.1, shinF: -0.1 });

// Chiến thắng: bật nhảy, rồi chìa phi tiêu lớn ra trước cho nó xoay tít; tay xa kết ấn trước cằm
const WIN_CROUCH = pose({ hips: [0, -0.05], torso: -0.25, head: 0.2, thighN: 0.6, shinN: -0.85, thighF: 0.25, shinF: -0.75 });
const WIN_UP = pose({ air: true, hips: [0, 0.07], torso: 0.1, head: -0.05, armN: 1.3, foreN: 0.2, handN: -0.3, shuriken: -1.5, thighN: 0.45, shinN: -0.85, thighF: -0.2, shinF: -0.5 });
const WIN = pose({ torso: 0.08, head: -0.06, armN: 0.75, foreN: 0.55, handN: -0.4, shuriken: 0 });
const winSpin = (k) => pose({ ...WIN, hips: [0, k % 2 ? -0.006 : 0], shuriken: -k * (TAU / 3) });

// Ngã gục (CutoutCharacterView xoay cả người nằm xuống)
const DEAD = pose({ air: true, liftF: 0, torso: 0.2, head: 0.45, armN: 0.5, foreN: 0.3, handN: 0.2, armF: 0.7, foreF: 0.4, handF: 0.3, thighN: 0.35, shinN: -0.5, thighF: -0.1, shinF: -0.2, shuriken: 0.6 });

// Đột Kích: khuỵu thấp xuống như lúc đáp đất (tay xa chống đất, phi tiêu kéo ra sau) rồi biến mất
const CROUCH = pose({
    liftF: 1, torso: -0.55, head: 0.45,
    armN: -1.4, foreN: -0.3, handN: 0.2, shuriken: 0.8, armF: 0.45, foreF: 0.1, handF: 0.4,
    thighN: 1.5, shinN: -2.0, thighF: -0.1, shinF: -1.9,
});

const DASH_STRIKE = pose({
    liftF: 0, hips: [0.02, -0.07], torso: -0.6, head: 0.48,
    armN: 1.25, foreN: 0.15, handN: -0.2, shuriken: -1.2, armF: -1.5, foreF: 0.2, handF: 0.2,
    thighN: 1.0, shinN: -0.7, thighF: -0.7, shinF: -0.6,
});

/** Danh sách clip */
export function assassin2Clips(parts, height) {
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height);
    return [
        c('idle', [0, 0.8, 1.6], [IDLE, IDLE_IN, IDLE]),
        c('ready', [0, 0.7, 1.4], [READY, READY_IN, READY]),
        c('move', [0, 0.125, 0.25, 0.375, 0.5], [...RUN, RUN[0]]),
        c('dash', [0, 0.09, 0.18], DASH),
        c('fall', [0, 0.15, 0.3], [FALL, pose({ ...FALL, thighN: 1.3, thighF: 0.9 }), FALL]),
        c('land', [0, 0.06, 0.32, 0.6], [LAND, LAND, LAND_HOLD, IDLE]),
        c('attack', [0, 0.1, 0.18, 0.28, 0.46], [pose({ liftF: 0 }), SLASH_WIND, SLASH_HIT, SLASH_FOLLOW, SLASH_END]),
        // nhún -> lộn mèo ra sau (thu người) -> bung người vung tay -> quăng bùa trên không -> đáp đất
        c('throw', [0, 0.07, 0.13, 0.3, 0.36, 0.42, 0.5, 0.58, 0.8], [IDLE, LEAP_PREP, LEAP_TUCK, LEAP_TUCK, LEAP_WIND, LEAP_REL, LEAP_FOLLOW, LEAP_LAND, IDLE]),
        // quăng tại chỗ (dùng khi không lùi được, VD sát mép sân)
        c('throwStand', [0, 0.12, 0.2, 0.3, 0.5], [IDLE, THROW_WIND, THROW_REL, THROW_FOLLOW, IDLE]),
        c('cast', [0, 0.3, 0.6], [SEAL, SEAL_B, SEAL]),
        // Tàng Hình: kết ấn, nhắm mắt, (0.38s) khói bùng quanh người rồi mờ dần
        c('stealth', [0, 0.1, 0.38, 0.6], [IDLE, SEAL, SEAL_B, SEAL]),
        c('hurt', [0, 0.06, 0.16, 0.36], [IDLE, HURT, pose({ ...HURT, torso: 0.3, hips: [-0.03, -0.008] }), IDLE]),
        c('victory', [0, 0.15, 0.35, 0.55, 0.8], [IDLE, WIN_CROUCH, WIN_UP, pose({ ...WIN, hips: [0, -0.02] }), WIN]),
        // phi tiêu xoay 1 vòng mỗi 0.9 giây (mỗi khoá < nửa vòng để không xoay ngược)
        c('victoryIdle', [0, 0.3, 0.6, 0.9], [winSpin(0), winSpin(1), winSpin(2), winSpin(3)]),
        c('dead', [0, 1], [DEAD, DEAD]),
        c('vanish', [0, 0.14, 0.32], [IDLE, CROUCH, CROUCH]),
        // Tư thế lướt chém (dùng cho dư ảnh Đột Kích): đổ người, phi tiêu chém ngang về trước
        c('dashStrike', [0, 1], [DASH_STRIKE, DASH_STRIKE]),
        c('appear', [0, 0.1, 0.18, 0.28, 0.46], [{ ...CROUCH, liftF: 0 }, SLASH_WIND, SLASH_HIT, SLASH_FOLLOW, SLASH_END]),
    ];
}

// ---------- Đổi hình bàn tay / biểu cảm mắt theo thời gian trong clip ----------
// [thời điểm (giây), mảnh, da]. Mảnh không có trong danh sách -> dùng DEFAULT_SKINS.
export const DEFAULT_SKINS = { handN: 'fist', handF: 'seal', eye: 'open', talisman: 'off' };
export const SKIN_KEYS = {
    ready: [[0, 'handF', 'seal'], [0, 'eye', 'determined']],
    move: [[0, 'handF', 'fist'], [0, 'eye', 'determined']],
    dash: [[0, 'handF', 'open'], [0, 'handN', 'fist'], [0, 'eye', 'determined']],
    fall: [[0, 'handF', 'open'], [0, 'eye', 'determined']],
    land: [[0, 'handF', 'open'], [0, 'eye', 'determined'], [0.45, 'handF', 'seal'], [0.5, 'eye', 'open']],
    attack: [[0, 'handF', 'fist'], [0.05, 'eye', 'determined'], [0.42, 'eye', 'open'], [0.42, 'handF', 'seal']],
    // ném bùa: nắm lá bùa từ đầu, buông ra đúng lúc phóng (0.19s)
    throw: [[0, 'handF', 'fist'], [0, 'talisman', 'on'], [0, 'eye', 'determined'], [0.41, 'handF', 'open'], [0.41, 'talisman', 'off'], [0.66, 'handF', 'seal'], [0.66, 'eye', 'open']],
    throwStand: [[0, 'handF', 'fist'], [0, 'talisman', 'on'], [0, 'eye', 'determined'], [0.19, 'handF', 'open'], [0.19, 'talisman', 'off'], [0.45, 'handF', 'seal'], [0.45, 'eye', 'open']],
    cast: [[0, 'handF', 'seal'], [0, 'eye', 'determined']],
    stealth: [[0, 'handF', 'seal'], [0, 'eye', 'determined'], [0.12, 'eye', 'blink']],
    hurt: [[0.03, 'eye', 'pain'], [0.03, 'handF', 'open'], [0.3, 'eye', 'open']],
    victory: [[0, 'eye', 'happy']],
    victoryIdle: [[0, 'eye', 'happy']],
    dead: [[0, 'eye', 'blink'], [0, 'handF', 'open']],
    vanish: [[0, 'eye', 'determined'], [0.1, 'handF', 'open']],
    dashStrike: [[0, 'eye', 'determined'], [0, 'handF', 'open']],
    appear: [[0, 'handF', 'fist'], [0, 'eye', 'determined'], [0.42, 'eye', 'open'], [0.42, 'handF', 'seal']],
};

// ---------- Mảnh đung đưa theo quán tính ----------
// speed: góc thêm theo tốc độ chạy (rad trên mỗi đơn vị/giây, âm = bay ra sau)
// fall : góc thêm khi rơi (âm = hất lên)   gravity: tỉ lệ "giữ rủ thẳng xuống" khi thân nghiêng
// sway : biên độ đung đưa nhẹ lúc đứng     limit: giới hạn [min, max]
export const SECONDARY = {
    braidA:    { speed: -0.05, fall: -0.12, gravity: 0.75, sway: 0.03, phase: 0.0, limit: [-1.6, 0.6], stiff: 55, damp: 7 },
    braidB:    { speed: -0.03, fall: -0.08, gravity: 0.6, sway: 0.05, phase: 0.6, limit: [-1.2, 0.8], stiff: 45, damp: 6 },
    ribbonA:   { speed: -0.06, fall: -0.14, gravity: 0.7, sway: 0.06, phase: 1.1, limit: [-1.8, 0.6], stiff: 40, damp: 5 },
    ribbonB:   { speed: -0.06, fall: -0.14, gravity: 0.7, sway: 0.07, phase: 1.9, limit: [-1.8, 0.6], stiff: 38, damp: 5 },
    coatFront: { speed: -0.035, fall: -0.07, gravity: 0.8, sway: 0.03, phase: 0.4, limit: [-1.2, 0.5], stiff: 60, damp: 8 },
    coatBack:  { speed: -0.045, fall: -0.08, gravity: 0.8, sway: 0.035, phase: 1.4, limit: [-1.3, 0.5], stiff: 55, damp: 7 },
    tasselA:   { speed: -0.02, fall: -0.05, gravity: 0.9, sway: 0.05, phase: 2.2, limit: [-1.5, 1.5], stiff: 70, damp: 6 },
    tasselB:   { speed: -0.02, fall: -0.05, gravity: 0.9, sway: 0.05, phase: 2.7, limit: [-1.5, 1.5], stiff: 70, damp: 6 },
};

// ---------- Tốc độ di chuyển -> động tác ----------
// RUN_SPEED: tốc độ (đơn vị/giây) mà clip 'move' khớp bước chân ở timeScale 1
// DASH_SPEED: nhanh hơn mức này thì chuyển sang lướt ninja (clip 'dash')
export const LOCOMOTION = { runSpeed: 6.5, dashSpeed: 14, runClip: 'move', dashClip: 'dash' };
