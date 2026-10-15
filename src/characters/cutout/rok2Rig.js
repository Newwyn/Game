// ============================================================
// RIG ROK (Thiết Hộ) — BẢN 2: bộ tranh vẽ RIÊNG cho gắn xương
// ============================================================
// Ảnh gốc: art/rok2/*.png  ->  tools/build_atlas.py art/rok2/atlas_spec.json  ->  rok2_atlas.png + rok2Atlas.json
// Khác bản 1: mọi đầu khớp đều TRÒN và vẽ đủ (khuỷu, gối) -> xoay không hở / không chồng 2 nắp;
//             găng tay cổ ngắn, nắm tay vẽ sẵn tư thế nắm chuôi kiếm (kiếm xoay riêng trong nắm tay).
// Điểm khớp ghi theo TOẠ ĐỘ ẢNH GỐC. Các mảnh tay/chân vẽ hơi nghiêng -> `angle` dựng thẳng lại.
// Tên khớp giống bản 1 nên dùng chung toàn bộ động tác trong rokClips.js.
import atlasUrl from '../../assets/sprites/rok2_atlas.png';
import atlas from './rok2Atlas.json';

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
function borrow(name, skin) {
    const s = parts[name].skins[skin];
    Object.assign(parts[name], { _art: s._art, _src: s._src, angle: s.angle, scale: s.scale, sx: s.sx, flipX: false });
}
/** góc (độ) cần xoay để đoạn a->b (vẽ nghiêng trong ảnh) dựng thẳng đứng */
const upright = (a, b) => -Math.atan2(b[0] - a[0], b[1] - a[1]) / D2R;

// ---------- Tỉ lệ ----------
const SWORD = 0.8, SHIELD = 0.92, EYE = 0.46;
const FAR = 0.82;

// ---------- Chân ----------
const THIGH_N = { hip: [410, 735], knee: [440, 846] }, THIGH_F = { hip: [970, 735], knee: [1000, 846] };
const SHIN_N = { knee: [625, 737], sole: 984 }, SHIN_F = { knee: [1182, 742], sole: 986 };
const shinLen = SHIN_N.sole - SHIN_N.knee[1];
const thighLen = Math.hypot(THIGH_N.knee[0] - THIGH_N.hip[0], THIGH_N.knee[1] - THIGH_N.hip[1]);
const ORIGIN = [500, 1000];
const HIP = [500, ORIGIN[1] - shinLen - thighLen];

add('hips', { pos: HIP });
add('thighN', { ...art('thighN', THIGH_N.hip, { angle: upright(THIGH_N.hip, THIGH_N.knee) }), pos: [HIP[0] + 6, HIP[1]], parent: 'hips', z: 9 });
add('shinN', { ...art('shinN', SHIN_N.knee), pos: at('thighN', THIGH_N.knee), parent: 'thighN', z: 9.5 });
add('thighF', { ...art('thighF', THIGH_F.hip, { angle: upright(THIGH_F.hip, THIGH_F.knee) }), pos: [HIP[0] - 8, HIP[1]], parent: 'hips', z: 5, shade: FAR });
add('shinF', { ...art('shinF', SHIN_F.knee), pos: at('thighF', THIGH_F.knee), parent: 'thighF', z: 5.5, shade: FAR });

// ---------- Thân ----------
// Đai + váy giáp ôm hông (che đầu đùi); thân giáp đặt trên đai
add('belt', { ...art('belt', [1360, 240]), pos: [HIP[0] - 4, HIP[1] + 6], parent: 'hips', z: 12 });
add('torso', { ...art('torso', [1110, 320]), pos: at('belt', [1360, 185]), parent: 'hips', z: 10 });
const NECK = at('torso', [1105, 108]);
add('cape', { ...art('cape', [492, 380], { angle: 38, scale: 0.9 }), pos: at('torso', [1045, 135]), parent: 'torso', z: 0.5 });
add('scarf', { ...art('scarf', [752, 392], { scale: 0.75 }), pos: [NECK[0] - 4, NECK[1] + 6], parent: 'torso', z: 24.5 });

// ---------- Đầu ----------
add('head', { ...art('head', [140, 292]), pos: [NECK[0], NECK[1] + 10], parent: 'torso', z: 14 });
add('hairBack', { ...art('hairBack', [826, 170]), pos: at('head', [150, 128]), parent: 'head', z: 13.5 });
add('hairFront', { ...art('hairFront', [480, 160]), pos: at('head', [172, 112]), parent: 'head', z: 16 });
const eye = (n, c) => art(n, c, { scale: EYE });
add('eye', {
    pos: at('head', [233, 184]), parent: 'head', z: 15, skin: 'open',
    skins: {
        open: eye('eyeOpen', [187, 774]), blink: eye('eyeBlink', [458, 770]), pain: eye('eyePain', [1306, 768]),
        angry: eye('eyeAngry', [744, 774]), determined: eye('eyeDetermined', [1028, 776]), happy: eye('eyeHappy', [1584, 770]),
    },
});

// ---------- Tay ----------
// Tay GẦN (N): cầm KIẾM, vẽ trước thân. Bắp tay có nắp khuỷu tròn che đầu tròn của cẳng tay.
// Tay XA  (F): cầm KHIÊN; clip nâng cẳng tay + khiên lên trước thân (liftPart 'foreF'), bắp tay vẫn sau thân.
const ARM_N = { sh: [972, 425], el: [1025, 545] }, FORE_N = { el: [1305, 592], wr: [1352, 706] };
const ARM_F = { sh: [1183, 425], el: [1220, 532] }, FORE_F = { el: [1465, 585], wr: [1500, 700] };
const SHOULDER_N = at('torso', [1058, 182]), SHOULDER_F = at('torso', [1088, 176]);
add('armN', { ...art('armN', ARM_N.sh, { angle: upright(ARM_N.sh, ARM_N.el) }), pos: SHOULDER_N, parent: 'torso', z: 25 });
add('foreN', { ...art('foreN', FORE_N.el, { angle: upright(FORE_N.el, FORE_N.wr) }), pos: at('armN', ARM_N.el), parent: 'armN', z: 24.6 });
// Nắm tay nằm DƯỚI cẳng tay (cổ găng ngắn chui vào ống tay giáp)
add('handN', {
    pos: at('foreN', FORE_N.wr), parent: 'foreN', z: 24.3, skin: 'fist',
    skins: {
        fist: art('fistN', [76, 560], { angle: -90 }),
        open: art('handOpen', [512, 565], { angle: -90 }),
    },
});
borrow('handN', 'fist');
// Kiếm dài: chuôi nằm trong nắm tay, vẽ dưới nắm tay; khớp 'sword' xoay được trong nắm tay
add('sword', { ...art('sword', [358, 566], { scale: SWORD, angle: -90 }), pos: at('handN', [132, 560]), parent: 'handN', z: 24.15 });

add('armF', { ...art('armF', ARM_F.sh, { angle: upright(ARM_F.sh, ARM_F.el) }), pos: SHOULDER_F, parent: 'torso', z: 2, shade: FAR });
add('foreF', { ...art('foreF', FORE_F.el, { angle: upright(FORE_F.el, FORE_F.wr) }), pos: at('armF', ARM_F.el), parent: 'armF', z: 1.6, shade: FAR });
const fistF = art('handFist', [786, 578], { angle: -90 });
add('handF', {
    pos: at('foreF', FORE_F.wr), parent: 'foreF', z: 4, shade: FAR, skin: 'fist',
    skins: { fist: fistF, open: fistF, bash: fistF },
});
borrow('handF', 'fist');
// Khiên (vẽ nghiêng 3/4): tâm khiên ở nắm tay xa, đè lên bàn tay
add('shield', { ...art('shield', [1597, 405], { scale: SHIELD }), pos: at('handF', [850, 578]), parent: 'handF', z: 5 });

// ---------- Xuất ----------
const out = {};
for (const [k, p] of Object.entries(parts)) {
    const { _art, _src, ...rest } = p;
    if (rest.skins) rest.skins = Object.fromEntries(Object.entries(rest.skins).map(([n, s]) => { const { _art: a, _src: b, ...r } = s; return [n, r]; }));
    out[k] = rest;
}
const TOP = Math.min(at('hairFront', [500, 12])[1], at('hairBack', [826, 16])[1]);

export const ROK2_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: ORIGIN,
    heightPx: ORIGIN[1] - TOP,
    parts: out,
    extras: { planted: { rect: atlas.parts.shieldFront.rect, scale: 0.55 } },
};
export const ASSASSIN_RIG = ROK2_RIG; // tên chung cho tools/preview-cutout.html
export { rokClips as CLIPS, SKIN_KEYS, DEFAULT_SKINS } from './rokClips.js';
