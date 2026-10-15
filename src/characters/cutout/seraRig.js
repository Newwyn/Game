// ============================================================
// RIG SERAPHINE (Thánh Quang) — Tu Sĩ, 2D nhìn nghiêng
// ============================================================
// Mảnh được cắt TRỰC TIẾP từ tranh toàn thân art/seraphine/01-character.png
//   tools/cut_reference.py art/seraphine/ref_spec.json -> sera_atlas.png + seraAtlas.json
// Toạ độ trong file này = toạ độ pixel trên TRANH TOÀN THÂN. Tư thế IDLE (seraClips.REST) dựng lại đúng y tranh.
// Tấm 03-props-hands chỉ dùng cho bàn tay niệm phép / chắp tay và các biểu cảm mắt.
import atlasUrl from '../../assets/sprites/sera_atlas.png';
import atlas from './seraAtlas.json';

const D2R = Math.PI / 180;
const parts = {};

function atlasPivot(name, src) {
    const m = atlas.parts[name];
    return [m.rect[0] + (src[0] - m.src[0]) * m.scale, m.rect[1] + (src[1] - m.src[1]) * m.scale];
}
function art(name, srcPivot, { angle = 0, scale = 1, flipX = false, sx = 1 } = {}) {
    return { rect: atlas.parts[name].rect, pivot: atlasPivot(name, srcPivot), angle, scale, flipX, sx, _art: name, _src: srcPivot };
}
/** Điểm `src` trên mảnh, tính trong hệ toạ độ của khớp chứa mảnh (px rig, y hướng xuống) */
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
/** Góc (độ) xoay mảnh để xương a->b dựng thẳng đứng (đầu khớp ở trên) */
const upright = (a, b) => -Math.atan2(b[0] - a[0], b[1] - a[1]) / D2R;

import { BONES } from './seraBones.js';
const B = BONES;
const ORIGIN = [735, 1075];

// ---------- Chân (gần = chân trái trong tranh, đứng trước) ----------
add('hips', { pos: B.hip });
add('thighF', { ...art('thighF', B.thighF[0], { angle: upright(...B.thighF) }), pos: B.thighF[0], parent: 'hips', z: 3 });
add('shinF', { ...art('shinF', B.shinF[0], { angle: upright(...B.shinF) }), pos: at('thighF', B.thighF[1]), parent: 'thighF', z: 3.5 });
add('thighN', { ...art('thighN', B.thighN[0], { angle: upright(...B.thighN) }), pos: B.thighN[0], parent: 'hips', z: 5 });
add('shinN', { ...art('shinN', B.shinN[0], { angle: upright(...B.shinN) }), pos: at('thighN', B.thighN[1]), parent: 'thighN', z: 5.5 });

// ---------- Thân / áo choàng / đầu / tóc ----------
add('torso', { ...art('torso', B.waist), pos: B.waist, parent: 'hips', z: 10 });
add('capelet', { ...art('capelet', B.cape), pos: B.cape, parent: 'torso', z: 22 });
add('head', { ...art('head', B.neck), pos: B.neck, parent: 'torso', z: 24 });
add('hairBack', { ...art('hairBack', B.tie), pos: B.tie, parent: 'head', z: 1 });
const eye = (n) => art(n, B.eye);
add('eye', {
    pos: B.eye, parent: 'head', z: 25, skin: 'open',
    skins: {
        open: eye('eyeOpen'), blink: eye('eyeBlink'), angry: eye('eyeAngry'),
        determined: eye('eyeDetermined'), pain: eye('eyePain'), happy: eye('eyeHappy'),
    },
});

// ---------- Tay gần (tay trống: thả lỏng / niệm phép / chắp tay) ----------
const HAND = 1;
add('armN', { ...art('armN', B.armN[0], { angle: upright(...B.armN) }), pos: B.armN[0], parent: 'torso', z: 18 });
add('foreN', { ...art('foreN', B.foreN[0], { angle: upright(...B.foreN) }), pos: at('armN', B.armN[1]), parent: 'armN', z: 23.5 });
const FORE_A = upright(...B.foreN);
add('handN', {
    pos: at('foreN', B.foreN[1]), parent: 'foreN', z: 23, skin: 'relax',
    skins: {
        relax: art('handN', B.foreN[1], { angle: FORE_A }),
        cast: art('handCast', [834, 296], { angle: -90, scale: HAND }),
        fist: art('handFist', [578, 578], { angle: -90, scale: HAND }),
        pray: art('handPray', [1110, 636], { angle: 180, scale: HAND }),
    },
});
borrow('handN', 'relax');

// ---------- Tay xa cầm gậy (ống tay áo trước người) ----------
// foreF = khớp cổ tay (không có hình) — giữ tên để liftF / staffDir dùng chung với các nhân vật khác.
// Bàn tay + gậy xoay -90° trong khớp tay: tổng góc torso+armF+foreF+handF = 1.57 -> gậy dựng đứng như tranh.
add('armF', { ...art('armF', B.armF[0], { angle: upright(...B.armF) }), pos: B.armF[0], parent: 'torso', z: 26 });
add('foreF', { pos: at('armF', B.armF[1]), parent: 'armF', z: 26 });
add('handF', { ...art('handF', B.armF[1], { angle: -90 }), pos: parts.foreF.pos, parent: 'foreF', z: 28 });
// Gậy: lấy bản sạch nguyên cây (tấm v2, nền trong suốt) — đặt khớp theo vị trí gậy trong tranh (đo bằng so khớp ảnh)
add('staff', { ...art('staffClean', [137, 610], { scale: 0.98, angle: -91.9 }), pos: at('handF', B.grip), parent: 'handF', z: 27 });
export const STAFF_TIP = local('staff', [167, 139]);   // pha lê đầu gậy (điểm phát phép)

// ---------- Xuất ----------
const out = {};
for (const [k, p] of Object.entries(parts)) {
    const { _art, _src, ...rest } = p;
    if (rest.skins) rest.skins = Object.fromEntries(Object.entries(rest.skins).map(([n, s]) => { const { _art: a, _src: b, ...r } = s; return [n, r]; }));
    out[k] = rest;
}
const TOP = 72; // đỉnh tóc trên tranh

export const SERA_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: ORIGIN,
    heightPx: ORIGIN[1] - TOP,
    parts: out,
};
export const ASSASSIN_RIG = SERA_RIG; // tên chung cho tools/preview-cutout.html
export { seraClips as CLIPS, SKIN_KEYS, DEFAULT_SKINS } from './seraClips.js';
