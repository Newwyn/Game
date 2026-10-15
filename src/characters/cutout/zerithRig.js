// ============================================================
// RIG ZERITH (U Minh) — Sát Thủ phép, tộc Devil, 2D nhìn nghiêng
// ============================================================
// Cắt TRỰC TIẾP từ tranh toàn thân (nền trong suốt) art/zerith/01-character.png -> tools/cut_reference.py art/zerith/ref_spec.json
// Đầu: lấy từ tấm bộ phận (không bị lưỡi liềm che), biến đổi về đúng chỗ trên tranh (so khớp ảnh).
// Lưỡi liềm: bản sạch nguyên cây từ tấm bộ phận, đặt theo cán liềm trong tranh.
import atlasUrl from '../../assets/sprites/zerith_atlas.png';
import atlas from './zerithAtlas.json';
import { BONES, REST } from './zerithBones.js';

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
const ORIGIN = [820, 1190];

// ---------- Chân ----------
add('hips', { pos: B.hip });
add('thighF', { ...art('thighF', B.thighF[0], { angle: upright(...B.thighF) }), pos: B.thighF[0], parent: 'hips', z: 3 });
add('shinF', { ...art('shinF', B.shinF[0], { angle: upright(...B.shinF) }), pos: at('thighF', B.thighF[1]), parent: 'thighF', z: 3.5 });
add('thighN', { ...art('thighN', B.thighN[0], { angle: upright(...B.thighN) }), pos: B.thighN[0], parent: 'hips', z: 5 });
add('shinN', { ...art('shinN', B.shinN[0], { angle: upright(...B.shinN) }), pos: at('thighN', B.thighN[1]), parent: 'thighN', z: 5.5 });

// ---------- Thân / áo choàng rách / đuôi / đầu ----------
add('torso', { ...art('torso', B.waist), pos: B.waist, parent: 'hips', z: 10 });
add('cape', { ...art('cape', B.cape), pos: B.cape, parent: 'torso', z: 2 });
add('tail', { ...art('tail', B.tail), pos: B.tail, parent: 'hips', z: 1 });
add('head', { ...art('head', B.neck), pos: B.neck, parent: 'torso', z: 24 });
const EYE_C = { eyeBlink: [509, 610], eyeAngry: [839, 611], eyeDetermined: [1159, 610], eyePain: [1490, 612], eyeSmirk: [1818, 612] };   // tâm mắt trên tấm 03
const eye = (n) => art(n, EYE_C[n]);
add('eye', {
    pos: B.eye, parent: 'head', z: 25, skin: 'open',
    skins: {
        open: art('eyeOpen', [0, 0]), blink: eye('eyeBlink'), angry: eye('eyeAngry'),
        determined: eye('eyeDetermined'), pain: eye('eyePain'), happy: eye('eyeSmirk'),
    },
});

// ---------- Tay cầm liềm (gần, phía trước) ----------
add('armN', { ...art('armN', B.armN[0], { angle: upright(...B.armN) }), pos: B.armN[0], parent: 'torso', z: 26 });
add('foreN', { pos: at('armN', B.armN[1]), parent: 'armN', z: 26 });          // khớp cổ tay (không hình)
add('handN', { ...art('handN', B.armN[1], { angle: upright(...B.armN) }), pos: parts.foreN.pos, parent: 'foreN', z: 27 });
// Lưỡi liềm sạch (tấm 02): cán qua nắm tay, nghiêng như tranh (8.8°, trừ góc khớp tay lúc đứng yên), phóng 1.18
// khớp 'scy' (không hình) ở chỗ nắm: xoay cán liềm quanh nắm tay mà bàn tay giữ nguyên (động tác vung liềm)
add('scy', { pos: at('handN', B.grip), parent: 'handN', z: 22 });
add('scythe', { ...art('scythe', [1350, 655], { scale: 1.18, angle: 8.8 - REST.armN / D2R }), pos: parts.scy.pos, parent: 'scy', z: 22 });
export const SCYTHE_TIP = local('scythe', [1500, 410]);    // mũi lưỡi liềm

// ---------- Tay thả lỏng (xa) ----------
const HAND = 1;
const SHEET_HANDS = {   // [tên, cổ tay trên tấm 03, góc để ngón tay chỉ dọc xương]
    open:  ['handOpen',  [455, 300], -80],
    fist:  ['handFist',  [1245, 275], -90],
    point: ['handPoint', [1600, 285], -90],
    grip:  ['handGrip',  [90, 270], -90],
};
const sheetHand = (k) => { const [n, p, a] = SHEET_HANDS[k]; return art(n, p, { angle: a, scale: HAND }); };
// Ống tay xa: 'rest' = đúng tranh, 'long' = kéo dài lên tới vai (giơ tay ra trước không bị hở khúc vai)
const ARMF_A = upright(...B.armF);
add('armF', {
    pos: B.armF[0], parent: 'torso', z: 12, skin: 'long',
    skins: { rest: art('armF', B.armF[0], { angle: ARMF_A }), long: art('armFLong', B.armF[0], { angle: ARMF_A }) },
});
borrow('armF', 'long');
add('foreF', { pos: at('armF', B.armF[1]), parent: 'armF', z: 12 });
add('handF', {
    pos: parts.foreF.pos, parent: 'foreF', z: 12.5, skin: 'relax',
    skins: { relax: art('handF', B.armF[1], { angle: upright(...B.armF) }), open: sheetHand('open'), fist: sheetHand('fist'), point: sheetHand('point'), grip: sheetHand('grip') },
});
borrow('handF', 'relax');

// ---------- Xuất ----------
const out = {};
for (const [k, p] of Object.entries(parts)) {
    const { _art, _src, ...rest } = p;
    if (rest.skins) rest.skins = Object.fromEntries(Object.entries(rest.skins).map(([n, s]) => { const { _art: a, _src: b, ...r } = s; return [n, r]; }));
    out[k] = rest;
}
const TOP = 95;
export const ZERITH_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: ORIGIN,
    heightPx: ORIGIN[1] - TOP,
    parts: out,
};
export const ASSASSIN_RIG = ZERITH_RIG; // tên chung cho tools/preview-cutout.html
export { zerithClips as CLIPS, SKIN_KEYS, DEFAULT_SKINS } from './zerithClips.js';
