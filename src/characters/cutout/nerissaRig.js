// ============================================================
// RIG NERISSA (Thủy Vũ) — Tu Sĩ nước, vũ công dải lụa, tộc Elf, 2D nhìn nghiêng
// ============================================================
// Ghép từ TẤM BỘ PHẬN vẽ riêng cho gắn xương:
//   art/nerissa/02-body-parts.png : đầu (kèm tóc mái), tóc sau, thân + váy, bắp tay, cẳng tay (vòng cổ tay), đùi, cẳng chân + giày,
//                                   2 vạt lụa váy — đầu khớp vẽ TRÒN -> xoay không hở
//   art/nerissa/03-hands-eyes.png : 5 bàn tay (thả lỏng / múa / nắm lụa / xoè / chỉ) + mắt biểu cảm
//                                   (mắt đã căn sẵn lên đầu bằng tools/make_overlay_eyes.py -> art/nerissa/gen/)
//   art/nerissa/04-ribbon.png      : 8 đoạn DẢI LỤA thẳng + đầu lụa có ngọc -> chuỗi khớp đung đưa (lò xo) nối từ bàn tay
// Cắt: tools/cut_reference.py art/nerissa/ref_spec.json -> nerissa_atlas.png + nerissaAtlas.json
// Điểm khớp ghi theo TOẠ ĐỘ TẤM GỐC. Góc khớp 0 = tay / chân buông thẳng xuống.
import atlasUrl from '../../assets/sprites/nerissa_atlas.png';
import atlas from './nerissaAtlas.json';

const D2R = Math.PI / 180;
const parts = {};
function atlasPivot(name, src) {
    const m = atlas.parts[name];
    return [m.rect[0] + (src[0] - m.src[0]) * m.scale, m.rect[1] + (src[1] - m.src[1]) * m.scale];
}
function art(name, srcPivot, { angle = 0, scale = 1, flipX = false, sx = 1 } = {}) {
    return { rect: atlas.parts[name].rect, pivot: atlasPivot(name, srcPivot), angle, scale, flipX, sx, _art: name, _src: srcPivot };
}
/** Vị trí (toạ độ rig) của điểm `src` trên hình của khớp `partName` lúc mọi khớp ở góc 0 */
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
    Object.assign(parts[name], { _art: s._art, _src: s._src, angle: s.angle, scale: s.scale, sx: s.sx, flipX: s.flipX ?? false });
}
/** góc (độ) cần xoay để đoạn a->b (vẽ nghiêng trong ảnh) dựng thẳng đứng */
const upright = (a, b) => -Math.atan2(b[0] - a[0], b[1] - a[1]) / D2R;

// ---------- Tỉ lệ (tấm bộ phận vẽ đầu to / chân ngắn hơn tranh mẫu -> chỉnh lại cho thanh mảnh như tranh) ----------
const HEAD = 0.74, ARM = 0.88, FORE = 0.92, THIGH = 1.4, THIGH_W = 0.82, SHIN = 1.14, SHIN_W = 0.9, HAND = 0.6;
const FAR = 0.86;   // tay / chân xa: tối hơn một chút

// ---------- Điểm khớp trên tấm 02 ----------
const T = { waist: [850, 330], neck: [842, 54], shN: [789, 118], shF: [800, 112], hipN: [838, 420], hipF: [872, 415], beltN: [820, 360], beltF: [882, 356] };
const HEAD_NECK = [188, 248];
const HAIR_PIN = { head: [88, 108], hair: [535, 88] };   // trâm vỏ sò: cùng 1 món trên đầu & tóc sau
const LIMB = {
    armN: [[1060, 133], [1075, 323]], foreN: [[1331, 194], [1358, 372]],
    armF: [[1177, 139], [1212, 324]], foreF: [[1439, 193], [1471, 376]],
    thighN: [[95, 567], [115, 844]], thighF: [[231, 571], [291, 854]],
    shinN: [482, 598], shinF: [654, 598],
};
const SOLE = { shinN: 975, shinF: 985 };

// ---------- Thân ----------
const HIP = [850, 330];
add('hips', { pos: HIP });
add('torso', { ...art('torso', T.waist), pos: HIP, parent: 'hips', z: 10 });
const NECK = at('torso', T.neck);
add('head', { ...art('head', HEAD_NECK, { scale: HEAD }), pos: NECK, parent: 'torso', z: 24 });
// tóc sau: đặt sao cho trâm vỏ sò trùng trâm trên đầu; khớp lò xo (đung đưa) nằm sau thân
add('hairBack', { ...art('hairBack', HAIR_PIN.hair, { scale: HEAD }), pos: at('head', HAIR_PIN.head), parent: 'head', z: 0.5 });
// Mắt: 'open' = mắt vẽ sẵn trên đầu; biểu cảm dán đè (pivot = con ngươi, đã căn sẵn trong file gen)
const EYE_IRIS = [237, 152];
const eyeSkin = (n) => {
    const m = atlas.parts['eye_' + n];
    return { rect: m.rect, pivot: [m.rect[0], m.rect[1]], angle: 0, scale: HEAD, flipX: false, sx: 1 };
};
const EYE_META = { blink: [26, 26], happy: [26, 26], determined: [26, 26], pain: [26, 26], sing: [26, 26] };
const eyeAt = (n) => { const s = eyeSkin(n); const [px, py] = EYE_META[n]; s.pivot = [s.rect[0] + px, s.rect[1] + py]; return s; };
add('eye', {
    pos: at('head', EYE_IRIS), parent: 'head', z: 25, skin: 'open',
    skins: {
        open: art('eyeOpen', [0, 0]), blink: eyeAt('blink'), happy: eyeAt('happy'), determined: eyeAt('determined'),
        pain: eyeAt('pain'), sing: eyeAt('sing'),
    },
});

// ---------- Vạt lụa váy (2 bên hông, rủ ra SAU lưng) ----------
add('panelF', { ...art('panelF', [1072, 548], { flipX: true, scale: 0.92 }), pos: at('torso', T.beltF), parent: 'hips', z: 1, shade: FAR });
add('panelN', { ...art('panelN', [948, 545], { flipX: true, scale: 0.92 }), pos: at('torso', T.beltN), parent: 'hips', z: 4.5 });

// ---------- Chân ----------
const leg = (side, z, shade) => {
    const [h, k] = LIMB['thigh' + side];
    add('thigh' + side, { ...art('thigh' + side, h, { angle: upright(h, k), scale: THIGH, sx: THIGH_W / THIGH }), pos: at('torso', T['hip' + side]), parent: 'hips', z, shade });
    add('shin' + side, { ...art('shin' + side, LIMB['shin' + side], { scale: SHIN, sx: SHIN_W / SHIN }), pos: at('thigh' + side, k), parent: 'thigh' + side, z: z + 0.5, shade });
};
leg('F', 3, FAR);
leg('N', 5, 1);

// ---------- Tay ----------
// Bàn tay tấm 03 vẽ NẰM NGANG chỉ sang phải, cổ tay bên trái -> xoay -90° cho chỉ xuống dọc cẳng tay.
// Vòng cổ tay của cẳng tay đè lên gốc bàn tay (bàn tay z thấp hơn cẳng tay).
const HAND_SKIN = {
    relax: ['hRelax', [156, 290], -88], dance: ['hDance', [506, 284], -96], grip: ['hGrip', [936, 282], -90],
    palm: ['hPalm', [1250, 292], -90], point: ['hPoint', [1546, 292], -90],
};
const handSkins = () => Object.fromEntries(Object.entries(HAND_SKIN).map(([k, [n, p, a]]) => [k, art(n, p, { angle: a, scale: HAND })]));
const arm = (side, z, shade) => {
    const [s0, e0] = LIMB['arm' + side], [e1, w1] = LIMB['fore' + side];
    add('arm' + side, { ...art('arm' + side, s0, { angle: upright(s0, e0), scale: ARM }), pos: at('torso', T['sh' + side]), parent: 'torso', z, shade });
    add('fore' + side, { ...art('fore' + side, e1, { angle: upright(e1, w1), scale: FORE }), pos: at('arm' + side, e0), parent: 'arm' + side, z: z + 0.5, shade });
    add('hand' + side, { pos: at('fore' + side, w1), parent: 'fore' + side, z: z + 0.3, shade, skin: side === 'N' ? 'grip' : 'dance', skins: handSkins() });
    borrow('hand' + side, side === 'N' ? 'grip' : 'dance');
};
arm('F', 2, FAR);
arm('N', 26, 1);

// ---------- Dải lụa: chuỗi khớp nối từ lòng bàn tay, mỗi đoạn là 1 lò xo (CutoutCharacterView SECONDARY) ----------
// Đoạn lụa vẽ nằm ngang (gốc bên trái) -> xoay -90° cho rủ thẳng xuống. Lụa tay gần dài (7 đoạn), lụa tay xa ngắn (4 đoạn).
const RIB_W = 1.0, RIB_L = 0.3;     // bề ngang / độ dài mỗi đoạn (so với tấm đã thu 0.5 trong atlas)
const SEG = [[13, 93], [781, 93], [13, 283], [781, 283], [13, 475], [781, 475], [13, 666], [781, 666]];   // góc trên-trái từng đoạn (tấm 04)
const SEG_ROOT = [20, 56], SEG_LEN = 744 - 40;   // gốc trên đoạn (cách mép trái 20px, giữa bề ngang) · độ dài nối (trừ 2 đầu tròn)
const segLen = SEG_LEN * 0.5 * RIB_W * RIB_L;
const ribbon = (prefix, hand, count, z, shade, grip) => {
    let parent = hand, pos = at(hand, grip);
    for (let i = 0; i < count; i++) {
        const name = `${prefix}${i}`;
        const last = i === count - 1;
        const [x0, y0] = SEG[i];
        const piece = last ? 'ribEnd' : `rib${i}`;
        const root = last ? [33, 905] : [x0 + SEG_ROOT[0], y0 + SEG_ROOT[1]];
        add(name, { ...art(piece, root, { angle: -90, scale: RIB_W, sx: RIB_L }), pos, parent, z: z + i * 0.01, shade });
        pos = [pos[0], pos[1] + segLen];   // khớp kế tiếp ở cuối đoạn này (lúc góc 0 đoạn rủ thẳng xuống)
        parent = name;
    }
};
ribbon('ribN', 'handN', 7, 27.5, 1, [1000, 300]);   // nắm tay cầm lụa (tấm 03)
ribbon('ribF', 'handF', 4, 1.5, FAR, [700, 330]);    // đầu ngón tay múa

// ---------- Xuất ----------
const out = {};
for (const [k, p] of Object.entries(parts)) {
    const { _art, _src, ...rest } = p;
    if (rest.skins) rest.skins = Object.fromEntries(Object.entries(rest.skins).map(([n, s]) => { const { _art: a, _src: b, ...r } = s; return [n, r]; }));
    out[k] = rest;
}
const SOLE_Y = Math.max(at('shinN', [LIMB.shinN[0], SOLE.shinN])[1], at('shinF', [LIMB.shinF[0], SOLE.shinF])[1]);
const ORIGIN = [HIP[0], SOLE_Y];
const TOP = at('head', [160, 22])[1];
export const NERISSA_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: ORIGIN,
    heightPx: ORIGIN[1] - TOP,
    parts: out,
};
export const ASSASSIN_RIG = NERISSA_RIG; // tên chung cho tools/preview-cutout.html
export { nerissaClips as CLIPS, SKIN_KEYS, DEFAULT_SKINS, SECONDARY } from './nerissaClips.js';
