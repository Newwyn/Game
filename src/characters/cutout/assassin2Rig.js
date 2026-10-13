// ============================================================
// RIG SÁT THỦ (bản 2D nhìn nghiêng, phi tiêu lớn)
// ============================================================
// Ảnh gốc: art/assassin2/*.png  ->  tools/build_atlas.py  ->  atlas + assassin2Atlas.json
// Mọi điểm khớp ở đây ghi theo TOẠ ĐỘ ẢNH GỐC (pixel trong bảng mảnh rời) cho dễ đo lại.
// Vị trí lắp ráp được tính dây chuyền: khớp con = 1 điểm trên mảnh cha (sau khi xoay/phóng).
import atlasUrl from '../../assets/sprites/assassin2_atlas.png';
import atlas from './assassin2Atlas.json';

const D2R = Math.PI / 180;
const parts = {};

/** pivot trong ảnh gốc -> pixel trong atlas */
function atlasPivot(name, src) {
    const m = atlas.parts[name];
    return [m.rect[0] + (src[0] - m.src[0]) * m.scale, m.rect[1] + (src[1] - m.src[1]) * m.scale];
}

/** Mô tả hình của 1 mảnh (dùng cho part hoặc skin) */
function art(name, srcPivot, { angle = 0, scale = 1, flipX = false } = {}) {
    return { rect: atlas.parts[name].rect, pivot: atlasPivot(name, srcPivot), angle, scale, flipX, _art: name, _src: srcPivot };
}

/** Toạ độ lắp ráp của 1 điểm (toạ độ ảnh gốc) trên mảnh `partName` */
function at(partName, src) {
    const p = parts[partName];
    const m = atlas.parts[p._art];
    let dx = (src[0] - p._src[0]) * m.scale * p.scale;
    const dy = (src[1] - p._src[1]) * m.scale * p.scale;
    if (p.flipX) dx = -dx;
    // xoay ngược chiều kim đồng hồ trong hệ y hướng xuống
    const a = p.angle * D2R, c = Math.cos(a), s = Math.sin(a);
    return [p.pos[0] + dx * c + dy * s, p.pos[1] - dx * s + dy * c];
}

function add(name, spec) { parts[name] = spec; return spec; }

// ---------- Tỉ lệ ----------
const LEG = 0.85, ARM = 0.62, HAND = 0.62;
const FAR = 0.78; // làm tối tay/chân phía xa

// ---------- Chân (tính từ bàn chân lên) ----------
// Bốt: khớp gối = nắp da trên cùng; đế giày ~ y 980 trong ảnh gốc
// Điểm khớp đo tự động từ "núm da" ở hai đầu mỗi mảnh (xem tools/build_atlas.py, mục erase)
const BOOT_N = { top: [458, 814], sole: 980 }, BOOT_F = { top: [938, 818], sole: 980 };
const THIGH_N = { hip: [703, 783], knee: [717, 955] }, THIGH_F = { hip: [158, 773], knee: [155, 955] };
const shinLen = (BOOT_N.sole - BOOT_N.top[1]) * LEG;
const thighLen = Math.hypot(THIGH_N.knee[0] - THIGH_N.hip[0], THIGH_N.knee[1] - THIGH_N.hip[1]) * LEG;
const ORIGIN = [500, 1000];
const HIP = [500, ORIGIN[1] - shinLen - thighLen];

add('hips', { pos: HIP });
add('thighN', { ...art('thighN', THIGH_N.hip, { angle: -4.7, scale: LEG }), pos: [HIP[0] + 6, HIP[1]], parent: 'hips', z: 10 });
add('shinN', { ...art('shinN', BOOT_N.top, { scale: LEG }), pos: at('thighN', THIGH_N.knee), parent: 'thighN', z: 11 });
add('thighF', { ...art('thighF', THIGH_F.hip, { angle: 1, scale: LEG }), pos: [HIP[0] - 6, HIP[1]], parent: 'hips', z: 4, shade: FAR });
add('shinF', { ...art('shinF', BOOT_F.top, { scale: LEG }), pos: at('thighF', THIGH_F.knee), parent: 'thighF', z: 5, shade: FAR });

// ---------- Thân ----------
const WAIST = [765, 530];
add('torso', { ...art('torso', WAIST), pos: [HIP[0], HIP[1] - 26], parent: 'hips', z: 12 });
const NECK = at('torso', [768, 392]);
add('sash', { ...art('sash', [1370, 468], { scale: 0.75 }), pos: at('torso', [725, 545]), parent: 'hips', z: 13 });
add('coatFront', { ...art('coatFront', [955, 378], { angle: -12, scale: 0.62 }), pos: at('torso', [800, 540]), parent: 'hips', z: 14 });
add('tasselA', { ...art('tasselA', [1182, 842], { scale: 0.5 }), pos: at('coatFront', [1088, 628]), parent: 'coatFront', z: 14.5 });
add('coatBack', { ...art('coatBack', [1172, 368], { angle: 8, scale: 0.62, flipX: true }), pos: at('torso', [725, 540]), parent: 'hips', z: 6, shade: 0.88 });
add('tasselB', { ...art('tasselB', [1355, 842], { scale: 0.5 }), pos: at('coatBack', [1288, 632]), parent: 'coatBack', z: 6.5, shade: 0.88 });

// ---------- Đầu ----------
const NECK_BASE = [150, 286];
add('head', { ...art('head', NECK_BASE), pos: [NECK[0] - 2, NECK[1] + 22], parent: 'torso', z: 15 });
add('scarf', { ...art('scarf', [520, 470], { scale: 0.68 }), pos: [NECK[0] + 2, NECK[1] + 14], parent: 'torso', z: 18 });
add('hairBack', { ...art('hairBack', [754, 160]), pos: at('head', [150, 150]), parent: 'head', z: 7 });
add('hairFront', { ...art('hairFront', [452, 165]), pos: at('head', [158, 150]), parent: 'head', z: 17 });
const EYE_AT = at('head', [214, 186]);
const eye = (n, c) => art(n, c, { scale: 1 });
add('eye', {
    pos: EYE_AT, parent: 'head', z: 16, skin: 'open',
    skins: {
        open: eye('eyeOpen', [221, 395]), blink: eye('eyeBlink', [621, 432]), pain: eye('eyePain', [1000, 415]),
        determined: eye('eyeDetermined', [1400, 425]), happy: eye('eyeHappy', [1781, 420]),
    },
});

// Tóc tết + ruy băng: buộc ở gáy, thả ra sau lưng
add('braidA', { ...art('braidA', [1142, 84], { angle: 22, scale: 0.72 }), pos: at('head', [78, 214]), parent: 'head', z: 9 });
add('braidB', { ...art('braidB', [1418, 84], { angle: 12, scale: 0.55 }), pos: at('braidA', [1010, 278]), parent: 'braidA', z: 8 });
add('ribbonA', { ...art('ribbonA', [168, 354], { angle: 10, scale: 0.75 }), pos: at('braidA', [1130, 95]), parent: 'braidA', z: 9.5 });
add('ribbonB', { ...art('ribbonB', [365, 360], { angle: 25, scale: 0.7 }), pos: at('braidA', [1130, 95]), parent: 'braidA', z: 0.5, shade: 0.85 });

// ---------- Tay ----------
// Thân vẽ nghiêng 3/4 (ngực quay sang phải, hơi hướng về camera), giống ảnh mẫu:
//   Tay GẦN (N): mọc từ vai phía sau (chỗ có lỗ tay áo trên mảnh thân), CẦM PHI TIÊU LỚN, vẽ đè lên thân.
//   Tay XA  (F): mọc từ vai phía trước ngực, KẾT ẤN / ném phi tiêu nhỏ. Bình thường nằm sau thân;
//               khi đưa ra trước ngực thì clip bật liftF để vẽ lên trước (xem poseClip.js).
const SHOULDER_N = at('torso', [716, 440]), SHOULDER_F = at('torso', [828, 446]);
add('armN', { ...art('armN', [284, 678], { angle: -68.7, scale: ARM }), pos: SHOULDER_N, parent: 'torso', z: 22 });
// Cẳng tay vẽ ĐÈ lên tay áo: viền vàng của giáp tay che khuỷu
add('foreN', { ...art('foreN', [519, 671], { angle: -72.6, scale: ARM }), pos: at('armN', [412, 728]), parent: 'armN', z: 23 });
const WRIST_N = at('foreN', [647, 711]);
add('handN', {
    pos: WRIST_N, parent: 'foreN', z: 24, skin: 'fist',
    skins: {
        fist: art('handFist', [215, 240], { angle: -90, scale: HAND }),
        open: art('handOpen', [580, 245], { angle: -90, scale: HAND }),
    },
});
// Phi tiêu lớn: tâm vòng tròn nằm trong nắm tay gần (vẽ sau bàn tay, trước thân)
add('shuriken', { ...art('shuriken', [357, 830], { scale: 0.92 }), pos: [0, 0], parent: 'handN', z: 23.5 });

const FAR_SHADE = 0.9;
add('armF', { ...art('armF', [924, 662], { angle: 64.4, scale: ARM }), pos: SHOULDER_F, parent: 'torso', z: 1, shade: FAR_SHADE });
add('foreF', { ...art('foreF', [1077, 689], { angle: -77.7, scale: ARM }), pos: at('armF', [828, 708]), parent: 'armF', z: 2, shade: FAR_SHADE });
const WRIST_F = at('foreF', [1196, 715]);
add('handF', {
    pos: WRIST_F, parent: 'foreF', z: 3, shade: FAR_SHADE, skin: 'seal',
    skins: {
        seal: art('handSeal', [1025, 265], { angle: -90, scale: HAND }),
        fist: art('handFist2', [400, 495], { angle: -90, scale: HAND }),
        open: art('handOpen2', [750, 515], { angle: -90, scale: HAND }),
    },
});

// at('handN') cần hình của bàn tay -> mượn hình "nắm" để tìm điểm cầm phi tiêu
{
    const fist = parts.handN.skins.fist;
    parts.handN._art = fist._art; parts.handN._src = fist._src; parts.handN.angle = fist.angle; parts.handN.scale = fist.scale; parts.handN.flipX = false;
    parts.shuriken.pos = at('handN', [300, 224]);
}

// Dọn trường phụ trước khi xuất
const out = {};
let minY = Infinity;
for (const [k, p] of Object.entries(parts)) {
    const { _art, _src, ...rest } = p;
    if (rest.skins) rest.skins = Object.fromEntries(Object.entries(rest.skins).map(([n, s]) => { const { _art: a, _src: b, ...r } = s; return [n, r]; }));
    out[k] = rest;
    minY = Math.min(minY, p.pos[1]);
}

export const ASSASSIN2_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: ORIGIN,
    heightPx: ORIGIN[1] - 250, // đỉnh tóc ~ y 250
    parts: out,
    // Phi tiêu nhỏ bay ra khi ném (Kỹ năng 2)
    extras: { projectile: { rect: atlas.parts.shurikenS.rect, scale: 1.0 } },
};
export const ASSASSIN_RIG = ASSASSIN2_RIG;

// Cho trang xem thử (tools/preview-cutout.html)
export { assassin2Clips as CLIPS, SKIN_KEYS, DEFAULT_SKINS } from './assassin2Clips.js';
