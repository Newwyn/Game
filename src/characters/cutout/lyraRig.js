// ============================================================
// RIG LYRA (Phong Tiễn) — Xạ Thủ, 2D nhìn nghiêng
// ============================================================
// Ảnh gốc: art/lyra/*.png  ->  tools/build_atlas.py art/lyra/atlas_spec.json  ->  lyra_atlas.png + lyraAtlas.json
// Tay XA (F) cầm CUNG (luôn đưa lên trước thân: liftPart 'foreF'), tay GẦN (N) kéo dây / cầm tên.
// Dây cung + mũi tên đặt trên dây được vẽ bằng code (CutoutCharacterView, rig.bowString) để kéo căng / bật lại.
import atlasUrl from '../../assets/sprites/lyra_atlas.png';
import atlas from './lyraAtlas.json';

const D2R = Math.PI / 180;
const parts = {};

function atlasPivot(name, src) {
    const m = atlas.parts[name];
    return [m.rect[0] + (src[0] - m.src[0]) * m.scale, m.rect[1] + (src[1] - m.src[1]) * m.scale];
}
function art(name, srcPivot, { angle = 0, scale = 1, flipX = false, sx = 1 } = {}) {
    return { rect: atlas.parts[name].rect, pivot: atlasPivot(name, srcPivot), angle, scale, flipX, sx, _art: name, _src: srcPivot };
}
/** Điểm `src` (ảnh gốc) trên mảnh, tính trong hệ toạ độ của khớp chứa mảnh (px rig, y hướng xuống) */
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

// ---------- Tỉ lệ ----------
const BOW = 0.74, ARROW = 0.5, EYE = 0.5, HEAD = 1.15;
const FAR = 0.84, ARM = 0.82, LEG = 1.22, HAND = 0.85;

// ---------- Chân ----------
const THIGH_N = { hip: [425, 790], knee: [402, 930] }, THIGH_F = { hip: [950, 792], knee: [930, 930] };
const SHIN_N = { knee: [670, 768], sole: 999 }, SHIN_F = { knee: [1162, 768], sole: 997 };
const shinLen = SHIN_N.sole - SHIN_N.knee[1];
const thighLen = LEG * Math.hypot(THIGH_N.knee[0] - THIGH_N.hip[0], THIGH_N.knee[1] - THIGH_N.hip[1]);
const ORIGIN = [500, 1000];
const HIP = [500, ORIGIN[1] - shinLen - thighLen];

add('hips', { pos: HIP });
add('thighN', { ...art('thighN', THIGH_N.hip, { angle: upright(THIGH_N.hip, THIGH_N.knee), scale: LEG }), pos: [HIP[0] + 8, HIP[1]], parent: 'hips', z: 9 });
add('shinN', { ...art('shinN', SHIN_N.knee), pos: at('thighN', THIGH_N.knee), parent: 'thighN', z: 8.5 });
add('thighF', { ...art('thighF', THIGH_F.hip, { angle: upright(THIGH_F.hip, THIGH_F.knee), scale: LEG }), pos: [HIP[0] - 8, HIP[1]], parent: 'hips', z: 5, shade: FAR });
add('shinF', { ...art('shinF', SHIN_F.knee), pos: at('thighF', THIGH_F.knee), parent: 'thighF', z: 4.5, shade: FAR });

// ---------- Thân ----------
add('belt', { ...art('belt', [1370, 300], { scale: 0.8 }), pos: [HIP[0] - 2, HIP[1] - 14], parent: 'hips', z: 12 });
add('torso', { ...art('torso', [1115, 340]), pos: at('belt', [1372, 262]), parent: 'hips', z: 10 });
const NECK = at('torso', [1108, 128]);
add('cape', { ...art('cape', [330, 470], { angle: 8, scale: 0.85 }), pos: at('torso', [1080, 145]), parent: 'torso', z: 11 });
add('quiver', { ...art('quiver', [520, 640], { angle: 30, scale: 0.8 }), pos: at('torso', [1035, 175]), parent: 'torso', z: 11.5 });

// ---------- Đầu ----------
add('head', { ...art('head', [160, 372], { scale: HEAD }), pos: [NECK[0] - 2, NECK[1] + 16], parent: 'torso', z: 14 });
add('hairBack', { ...art('hairBack', [880, 190], { scale: HEAD }), pos: at('head', [140, 150]), parent: 'head', z: 2 });
add('hairFront', { ...art('hairFront', [455, 190], { scale: HEAD }), pos: at('head', [180, 175]), parent: 'head', z: 16 });
const eye = (n, c) => art(n, c, { scale: EYE * HEAD / 1.15 });
add('eye', {
    pos: at('head', [250, 252]), parent: 'head', z: 15, skin: 'open',
    skins: {
        open: eye('eyeOpen', [430, 845]), blink: eye('eyeBlink', [632, 842]), angry: eye('eyeAngry', [831, 850]),
        determined: eye('eyeDetermined', [1032, 845]), pain: eye('eyePain', [1230, 842]), happy: eye('eyeHappy', [1424, 834]),
    },
});

// ---------- Tay ----------
const ARM_N = { sh: [775, 508], el: [730, 665] }, FORE_N = { el: [945, 522], wr: [955, 728] };
const ARM_F = { sh: [1195, 508], el: [1150, 665] }, FORE_F = { el: [1395, 522], wr: [1382, 728] };
const SHOULDER_N = at('torso', [1062, 178]), SHOULDER_F = at('torso', [1092, 172]);
add('armN', { ...art('armN', ARM_N.sh, { angle: upright(ARM_N.sh, ARM_N.el), scale: ARM }), pos: SHOULDER_N, parent: 'torso', z: 25 });
add('foreN', { ...art('foreN', FORE_N.el, { angle: upright(FORE_N.el, FORE_N.wr), scale: ARM }), pos: at('armN', ARM_N.el), parent: 'armN', z: 24.6 });
add('handN', {
    pos: at('foreN', FORE_N.wr), parent: 'foreN', z: 24.3, skin: 'open',
    skins: {
        pinch: art('handPinch', [716, 392], { angle: -90, scale: HAND }),
        open: art('handOpen', [1016, 392], { angle: -90, scale: HAND }),
        fist: art('handFist', [1332, 405], { angle: -90, scale: HAND }),
    },
});
borrow('handN', 'pinch');
const PINCH = local('handN', [836, 326]);   // điểm ngón cái + trỏ kẹp dây

add('armF', { ...art('armF', ARM_F.sh, { angle: upright(ARM_F.sh, ARM_F.el), scale: ARM }), pos: SHOULDER_F, parent: 'torso', z: 3, shade: FAR });
add('foreF', { ...art('foreF', FORE_F.el, { angle: upright(FORE_F.el, FORE_F.wr), scale: ARM }), pos: at('armF', ARM_F.el), parent: 'armF', z: 2.6, shade: FAR });
add('handF', { ...art('fistBow', [468, 395], { angle: -90, scale: HAND }), pos: at('foreF', FORE_F.wr), parent: 'foreF', z: 4.4 });
// Cung: chuôi cung nằm trong nắm tay (mảnh tay có sẵn đoạn chuôi vẽ đè lên)
add('bow', { ...art('bow', [245, 500], { scale: BOW, angle: -90 }), pos: at('handF', [540, 386]), parent: 'handF', z: 4 });
const BOW_TIPS = [local('bow', [212, 120]), local('bow', [84, 866])];   // 2 chốt móc dây
// Mũi tên đặt trên dây (khớp riêng, vị trí / hướng do code tính mỗi khung hình)
add('arrow', { ...art('arrow', [452, 616], { scale: ARROW }), pos: [0, 0], z: 24.4 });

// ---------- Xuất ----------
const out = {};
for (const [k, p] of Object.entries(parts)) {
    const { _art, _src, ...rest } = p;
    if (rest.skins) rest.skins = Object.fromEntries(Object.entries(rest.skins).map(([n, s]) => { const { _art: a, _src: b, ...r } = s; return [n, r]; }));
    out[k] = rest;
}
const TOP = Math.min(at('hairFront', [455, 70])[1], at('hairBack', [900, 22])[1]);

export const LYRA_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: ORIGIN,
    heightPx: ORIGIN[1] - TOP,
    parts: out,
    // Dây cung vẽ bằng code: nối 2 chốt (toạ độ trong khớp 'bow'); khi 'pull' bật thì kéo về điểm kẹp của tay gần
    bowString: { joint: 'bow', tips: BOW_TIPS, pullJoint: 'handN', pull: PINCH, arrow: 'arrow', arrowLen: (1477 - 452) * ARROW },
};
export const ASSASSIN_RIG = LYRA_RIG; // tên chung cho tools/preview-cutout.html
export { lyraClips as CLIPS, SKIN_KEYS, DEFAULT_SKINS } from './lyraClips.js';
