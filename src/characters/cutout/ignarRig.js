// ============================================================
// RIG IGNAR (Hỏa Ngục) — Phù Thủy, 2D nhìn nghiêng
// ============================================================
// Mảnh cắt TRỰC TIẾP từ tranh toàn thân (nền trong suốt) art/ignar/01-character.png
//   tools/cut_reference.py art/ignar/ref_spec.json -> ignar_atlas.png + ignarAtlas.json
// Toạ độ trong file = toạ độ pixel trên tranh. Tư thế đứng (REST) dựng lại y tranh.
// Bàn tay biểu cảm + mắt lấy từ art/ignar/03-hands-eyes.png. Quả cầu lửa trên tay = hiệu ứng (vfx), không nằm trong rig.
import atlasUrl from '../../assets/sprites/ignar_atlas.png';
import atlas from './ignarAtlas.json';
import { BONES } from './ignarBones.js';

const D2R = Math.PI / 180;
const parts = {};
function atlasPivot(name, src) {
    const m = atlas.parts[name];
    return [m.rect[0] + (src[0] - m.src[0]) * m.scale, m.rect[1] + (src[1] - m.src[1]) * m.scale];
}
function art(name, srcPivot, { angle = 0, scale = 1, flipX = false, sx = 1 } = {}) {
    return { rect: atlas.parts[name].rect, pivot: atlasPivot(name, srcPivot), angle, scale, flipX, sx, _art: name, _src: srcPivot };
}
function local(partName, src) {
    const p = parts[partName];
    const m = atlas.parts[p._art];
    let dx = (src[0] - p._src[0]) * m.scale * p.scale * (p.sx ?? 1);
    const dy = (src[1] - p._src[1]) * m.scale * p.scale;
    if (p.flipX) dx = -dx;
    const a = p.angle * D2R, c = Math.cos(a), s = Math.sin(a);
    return [dx * c + dy * s, -dx * s + dy * c];
}
function at(partName, src) {
    const [x, y] = local(partName, src);
    return [parts[partName].pos[0] + x, parts[partName].pos[1] + y];
}
function add(name, spec) { parts[name] = spec; return spec; }
function borrow(name, skin) {
    const s = parts[name].skins[skin];
    Object.assign(parts[name], { _art: s._art, _src: s._src, angle: s.angle, scale: s.scale, sx: s.sx, flipX: false });
}
const upright = (a, b) => -Math.atan2(b[0] - a[0], b[1] - a[1]) / D2R;
const B = BONES;
const ORIGIN = [700, 1100];

// ---------- Chân ----------
add('hips', { pos: B.hip });
add('thighF', { ...art('thighF', B.thighF[0], { angle: upright(...B.thighF) }), pos: B.thighF[0], parent: 'hips', z: 3 });
add('shinF', { ...art('shinF', B.shinF[0], { angle: upright(...B.shinF) }), pos: at('thighF', B.thighF[1]), parent: 'thighF', z: 3.5 });
add('thighN', { ...art('thighN', B.thighN[0], { angle: upright(...B.thighN) }), pos: B.thighN[0], parent: 'hips', z: 5 });
add('shinN', { ...art('shinN', B.shinN[0], { angle: upright(...B.shinN) }), pos: at('thighN', B.thighN[1]), parent: 'thighN', z: 5.5 });

// ---------- Thân / áo choàng vai / đầu ----------
add('torso', { ...art('torso', B.waist), pos: B.waist, parent: 'hips', z: 10 });
add('capelet', { ...art('capelet', B.cape), pos: B.cape, parent: 'torso', z: 22 });
add('head', { ...art('head', B.neck), pos: B.neck, parent: 'torso', z: 24 });
const eye = (n) => art(n, B.eye);
add('eye', {
    pos: B.eye, parent: 'head', z: 25, skin: 'open',
    skins: {
        open: eye('eyeOpen'), blink: eye('eyeBlink'), angry: eye('eyeAngry'),
        determined: eye('eyeDetermined'), pain: eye('eyePain'), happy: eye('eyeHappy'),
    },
});

// ---------- Bàn tay biểu cảm (tấm 03): pivot = cổ tay (toạ độ trên tấm), góc = xoay để ngón tay chỉ dọc xương (xuống) ----------
const HAND = 1;
const SHEET_HANDS = {
    palm:   ['handPalm',   [140, 395], -95],   // ngửa lòng bàn tay (giữ cầu lửa)
    thrust: ['handThrust', [505, 365], -145],  // đẩy chưởng
    relax:  ['handRelax',  [760, 272], 0],     // thả lỏng
    fist:   ['handFist',   [1068, 345], -90],  // nắm tay
    raise:  ['handRaise',  [1330, 365], -150], // giơ lên trời (gọi cầu lửa)
};
const sheetHand = (k) => { const [n, p, a] = SHEET_HANDS[k]; return art(n, p, { angle: a, scale: HAND }); };

// ---------- Tay gần (thả lỏng, chưởng phụ) ----------
add('armN', { ...art('armN', B.armN[0], { angle: upright(...B.armN) }), pos: B.armN[0], parent: 'torso', z: 18 });
add('foreN', { ...art('foreN', B.foreN[0], { angle: upright(...B.foreN) }), pos: at('armN', B.armN[1]), parent: 'armN', z: 23.5 });
add('handN', {
    pos: at('foreN', B.foreN[1]), parent: 'foreN', z: 23, skin: 'relax',
    skins: {
        relax: art('handN', B.foreN[1], { angle: upright(...B.foreN) }),
        palm: sheetHand('palm'), thrust: sheetHand('thrust'), fist: sheetHand('fist'), raise: sheetHand('raise'),
    },
});
borrow('handN', 'relax');

// ---------- Tay xa (đưa ra trước, ngửa tay giữ cầu lửa) ----------
// bắp tay (armF) KHÔNG hình — nằm khuất dưới vạt vai; cẳng tay (foreF) = ống tay loe trong tranh, xoay quanh khuỷu
const lenAF = Math.hypot(B.armF[1][0] - B.armF[0][0], B.armF[1][1] - B.armF[0][1]);
add('armF', { pos: B.armF[0], parent: 'torso', z: 26 });
add('foreF', { ...art('armF', B.foreF[0], { angle: upright(...B.foreF) }), pos: [B.armF[0][0], B.armF[0][1] + lenAF], parent: 'armF', z: 26 });
add('handF', {
    pos: at('foreF', B.foreF[1]), parent: 'foreF', z: 25.5, skin: 'palm',
    skins: {
        palm: sheetHand('palm'),   // ngửa tay — lấy từ tấm 03 (bàn tay cắt từ tranh 01 bị khuyết chỗ ngọn lửa vẽ sẵn đè lên)
        thrust: sheetHand('thrust'), fist: sheetHand('fist'), raise: sheetHand('raise'), relax: sheetHand('relax'),
    },
});
borrow('handF', 'palm');
/** Điểm giữ quả cầu lửa, toạ độ trong khớp handF — tính theo bàn tay trong tranh 01 (cùng cổ tay, cùng hướng với bàn tay
 *  ngửa của tấm 03) để quả cầu nằm đúng chỗ như tranh */
parts._palm01 = { ...art('handF', B.foreF[1], { angle: upright(...B.foreF) }), pos: parts.handF.pos };
export const PALM_FIRE = local('_palm01', B.palm);
delete parts._palm01;

// ---------- Xuất ----------
const out = {};
for (const [k, p] of Object.entries(parts)) {
    const { _art, _src, ...rest } = p;
    if (rest.skins) rest.skins = Object.fromEntries(Object.entries(rest.skins).map(([n, s]) => { const { _art: a, _src: b, ...r } = s; return [n, r]; }));
    out[k] = rest;
}
const TOP = 40;
export const IGNAR_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: ORIGIN,
    heightPx: ORIGIN[1] - TOP,
    parts: out,
};
export const ASSASSIN_RIG = IGNAR_RIG; // tên chung cho tools/preview-cutout.html
export { ignarClips as CLIPS, SKIN_KEYS, DEFAULT_SKINS } from './ignarClips.js';
