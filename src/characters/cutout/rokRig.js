// ============================================================
// RIG ROK (Thiết Hộ) — Chiến Binh khiên lớn, 2D nhìn nghiêng
// ============================================================
// Ảnh gốc: art/rok/*.png  ->  tools/build_atlas.py art/rok/atlas_spec.json  ->  rok_atlas.png + rokAtlas.json
// Điểm khớp ghi theo TOẠ ĐỘ ẢNH GỐC (pixel trong bảng mảnh rời). Cách lắp giống assassin2Rig.js.
//   Tay GẦN (N): cầm KHIÊN tròn lớn (khiên che trước người)   Tay XA (F): cầm KIẾM ngắn
import atlasUrl from '../../assets/sprites/rok_atlas.png';
import atlas from './rokAtlas.json';

const D2R = Math.PI / 180;
const parts = {};

function atlasPivot(name, src) {
    const m = atlas.parts[name];
    return [m.rect[0] + (src[0] - m.src[0]) * m.scale, m.rect[1] + (src[1] - m.src[1]) * m.scale];
}
function art(name, srcPivot, { angle = 0, scale = 1, flipX = false, sx = 1 } = {}) {
    return { rect: atlas.parts[name].rect, pivot: atlasPivot(name, srcPivot), angle, scale, flipX, sx, _art: name, _src: srcPivot };
}
function at(partName, src) {
    const p = parts[partName];
    const m = atlas.parts[p._art];
    let dx = (src[0] - p._src[0]) * m.scale * p.scale * (p.sx ?? 1);
    const dy = (src[1] - p._src[1]) * m.scale * p.scale;
    if (p.flipX) dx = -dx;
    const a = p.angle * D2R, c = Math.cos(a), s = Math.sin(a);
    return [p.pos[0] + dx * c + dy * s, p.pos[1] - dx * s + dy * c];
}
function add(name, spec) { parts[name] = spec; return spec; }
/** Mượn hình của 1 "da" để tính điểm trên khớp không có hình riêng (bàn tay) */
function borrow(name, skin) {
    const s = parts[name].skins[skin];
    Object.assign(parts[name], { _art: s._art, _src: s._src, angle: s.angle, scale: s.scale, sx: s.sx, flipX: false });
}

// ---------- Tỉ lệ ----------
const LEG = 0.74, ARM = 0.7, HAND = 0.6, HAND_N = 0.68, SHIELD = 0.52, SWORD = 0.92; // kiếm dài
// Ảnh mẫu: thân & tay chân Rok to ngang, chắc nịch hơn bảng mảnh rời -> nới ngang các mảnh giáp
const WIDE = 1.16;
const HEAD = 1.0; // đầu to kiểu chibi giống ảnh mẫu (đầu ~1/3 chiều cao, như Jessica)
const FAR = 0.82;

// ---------- Chân ----------
// đùi: khớp hông ở nắp giáp trên cùng; khớp gối đặt hơi cao để bốt chồng lên đầu gối
const THIGH_N = { hip: [160, 735], knee: [160, 905] }, THIGH_F = { hip: [714, 735], knee: [714, 900] };
const BOOT_N = { top: [445, 745], sole: 972 }, BOOT_F = { top: [1000, 755], sole: 972 };
const shinLen = (BOOT_N.sole - BOOT_N.top[1]) * LEG;
const thighLen = (THIGH_N.knee[1] - THIGH_N.hip[1]) * LEG;
const ORIGIN = [500, 1000];
const HIP = [500, ORIGIN[1] - shinLen - thighLen];

add('hips', { pos: HIP });
add('thighN', { ...art('thighN', THIGH_N.hip, { scale: LEG, sx: WIDE }), pos: [HIP[0] + 6, HIP[1]], parent: 'hips', z: 9 });
add('shinN', { ...art('shinN', BOOT_N.top, { scale: LEG, sx: WIDE }), pos: at('thighN', THIGH_N.knee), parent: 'thighN', z: 9.5 });
add('thighF', { ...art('thighF', THIGH_F.hip, { scale: LEG, sx: WIDE }), pos: [HIP[0] - 6, HIP[1]], parent: 'hips', z: 5, shade: FAR });
add('shinF', { ...art('shinF', BOOT_F.top, { scale: LEG, sx: WIDE }), pos: at('thighF', THIGH_F.knee), parent: 'thighF', z: 5.5, shade: FAR });

// ---------- Thân ----------
const BODY = 0.82;
add('torso', { ...art('torso', [1045, 335], { scale: BODY, sx: WIDE }), pos: [HIP[0], HIP[1] + 4], parent: 'hips', z: 10 });
add('belt', { ...art('belt', [450, 482], { scale: BODY, sx: WIDE }), pos: [HIP[0] - 4, HIP[1] - 14], parent: 'hips', z: 12 });
const NECK = at('torso', [1038, 135]);
add('cape', { ...art('cape', [1428, 72], { scale: BODY, angle: -6 }), pos: at('torso', [1000, 150]), parent: 'torso', z: 0.5 });
add('scarf', { ...art('scarf', [228, 448], { scale: BODY * 0.8, angle: -18 }), pos: [NECK[0] + 4, NECK[1] + 4], parent: 'torso', z: 24.5 }); // khăn quấn cổ: trên đầu/thân, dưới tay gần

// ---------- Đầu ----------
add('head', { ...art('head', [150, 325], { scale: HEAD }), pos: [NECK[0] - 4, NECK[1] + 16], parent: 'torso', z: 14 });
add('hairBack', { ...art('hairBack', [722, 205], { scale: HEAD }), pos: at('head', [140, 205]), parent: 'head', z: 13.5 });
add('hairFront', { ...art('hairFront', [450, 190], { scale: HEAD }), pos: at('head', [160, 185]), parent: 'head', z: 16 });
const eye = (n, c) => art(n, c, { scale: HEAD / 0.82 });
add('eye', {
    pos: at('head', [205, 235]), parent: 'head', z: 15, skin: 'open',
    skins: {
        open: eye('eyeOpen', [292, 300]), blink: eye('eyeBlink', [790, 315]), pain: eye('eyePain', [1272, 310]),
        angry: eye('eyeAngry', [300, 702]), determined: eye('eyeDetermined', [785, 735]), happy: eye('eyeHappy', [1275, 724]),
    },
});

// ---------- Tay ----------
// Tay GẦN (N, phía camera): cầm KIẾM — luôn vẽ trước thân để thấy rõ kiếm
// Tay XA  (F): cầm KHIÊN — clip bật liftF để khiên nằm TRƯỚC thân nhưng SAU tay cầm kiếm
const SHOULDER_N = at('torso', [995, 195]), SHOULDER_F = at('torso', [1055, 185]);
add('armN', { ...art('armN', [705, 468], { scale: ARM, sx: WIDE }), pos: SHOULDER_N, parent: 'torso', z: 25 });
// Cẳng tay nằm DƯỚI bắp tay: nắp khuỷu tròn của bắp tay che đầu cẳng tay -> khớp khuỷu liền, không bị 2 nắp chồng nhau
add('foreN', { ...art('foreN', [933, 470], { scale: ARM, sx: WIDE }), pos: at('armN', [688, 636]), parent: 'armN', z: 24.6 });
add('handN', {
    // Bàn tay nằm DƯỚI cẳng tay: phần ống cổ găng của bàn tay bị cổ tay giáp che -> chỉ thấy nắm tay chui ra từ ống tay
    // (trước đây 2 ống cổ tay nối tiếp nhau nhìn như cẳng tay dài thượt + bàn tay gãy rời)
    pos: at('foreN', [948, 640]), parent: 'foreN', z: 24.3, skin: 'fist',
    skins: {
        // găng THÉP cùng bộ với giáp tay (găng da nâu trước đây lệch tông, nhìn như bàn tay nhỏ thòng xuống)
        fist: art('handFist', [178, 185], { angle: -90, scale: HAND_N }),
        open: art('handOpen', [445, 182], { angle: -90, scale: HAND_N }),
    },
});
borrow('handN', 'fist');
// Kiếm: chuôi xuyên qua giữa nắm tay (giữa mu bàn tay và các ngón), lưỡi vuông góc cẳng tay khi cổ tay thẳng.
// Khớp 'sword' xoay được trong nắm tay -> chém nghiêng lưỡi mà không phải bẻ gập cổ tay.
add('sword', { ...art('sword', [700, 790], { scale: SWORD, angle: -90 }), pos: at('handN', [222, 188]), parent: 'handN', z: 24.15 });

add('armF', { ...art('armF', [1178, 478], { scale: ARM, sx: WIDE }), pos: SHOULDER_F, parent: 'torso', z: 2, shade: FAR });
add('foreF', { ...art('foreF', [1405, 478], { scale: ARM, sx: WIDE }), pos: at('armF', [1178, 636]), parent: 'armF', z: 1.6, shade: FAR });
add('handF', {
    pos: at('foreF', [1438, 645]), parent: 'foreF', z: 4, shade: FAR, skin: 'fist',
    skins: {
        fist: art('handFist', [128, 185], { angle: -90, scale: HAND }),
        open: art('handOpen', [392, 182], { angle: -90, scale: HAND }),
        bash: art('handBash', [1272, 185], { angle: -90, scale: HAND }),
    },
});
borrow('handF', 'fist');
// Khiên: tâm khiên ở nắm tay xa, vẽ đè lên bàn tay xa
add('shield', { ...art('shield', [278, 637], { scale: SHIELD }), pos: at('handF', [205, 188]), parent: 'handF', z: 5 });

// ---------- Xuất ----------
const out = {};
for (const [k, p] of Object.entries(parts)) {
    const { _art, _src, ...rest } = p;
    if (rest.skins) rest.skins = Object.fromEntries(Object.entries(rest.skins).map(([n, s]) => { const { _art: a, _src: b, ...r } = s; return [n, r]; }));
    out[k] = rest;
}
const TOP = at('hairBack', [740, 85])[1];

export const ROK_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: ORIGIN,
    heightPx: ORIGIN[1] - TOP,
    parts: out,
    // Khiên cắm đất phát sáng (Thành Trì) — vẽ thành hiệu ứng riêng
    extras: { planted: { rect: atlas.parts.shieldPlanted.rect, scale: 0.75 } },
};
export const ASSASSIN_RIG = ROK_RIG; // tên chung cho tools/preview-cutout.html
export { rokClips as CLIPS, SKIN_KEYS, DEFAULT_SKINS } from './rokClips.js';
