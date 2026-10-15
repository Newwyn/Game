// ============================================================
// RIG BRAKK (Cuồng Đấu) — Chiến Binh đô vật, tộc Dragon, 2D nhìn nghiêng
// ============================================================
// BẢN 2: ghép từ TẤM BỘ PHẬN vẽ riêng cho gắn xương (không cắt từ tranh toàn thân nữa):
//   art/brakk/02-body-parts.png : đầu, thân (có hốc vai + quần), đuôi, bắp tay, cẳng tay, đùi, cẳng chân + giày
//                                 — mọi đầu khớp vẽ TRÒN (nắp khớp) -> xoay khuỷu / gối không hở, không lộ đường cắt
//   art/brakk/03-hands-eyes.png : bàn tay (vồ / nắm / thả lỏng / xoè / giơ ngón cái) kèm băng cổ tay, mắt biểu cảm
//   art/brakk/04b-giant-parts.png : DẠNG KHỔNG LỒ (tay / chân vẽ liền -> cắt kèm ĐĨA TRÒN quanh khớp)
// Cắt: tools/cut_reference.py art/brakk/ref_spec.json -> brakk_atlas.png + brakkAtlas.json
// Điểm khớp ghi theo TOẠ ĐỘ TẤM GỐC. Tay / chân vẽ nghiêng -> `angle` dựng thẳng: góc khớp 0 = buông thẳng xuống.
// Mỗi mảnh cơ thể có 2 "da": 'normal' và 'giant' (Thần Lực Khổng Lồ) — CutoutCharacterView đổi cả bộ khi có giant_form.
// Mảnh khổng lồ được co / xoay sao cho KHỚP TRÙNG KHỚP dạng thường (cùng bộ xương, cùng động tác).
import atlasUrl from '../../assets/sprites/brakk_atlas.png';
import atlas from './brakkAtlas.json';

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
/** Lấy da `skin` làm hình chuẩn của khớp (để at() tính được) */
function borrow(name, skin) {
    const s = parts[name].skins[skin];
    Object.assign(parts[name], { _art: s._art, _src: s._src, angle: s.angle, scale: s.scale, sx: s.sx, flipX: false });
}
/** góc (độ) cần xoay để đoạn a->b (vẽ nghiêng trong ảnh) dựng thẳng đứng */
const upright = (a, b) => -Math.atan2(b[0] - a[0], b[1] - a[1]) / D2R;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const sc = (name) => atlas.parts[name].scale;
/** Hai da cho 1 khớp: normal + giant */
const two = (normal, giant) => ({ skin: 'normal', skins: { normal, giant } });

// ============================================================
// ĐIỂM KHỚP trên tấm bộ phận (02) và tấm khổng lồ (04b)
// ============================================================
const N = {
    torso: { waist: [805, 420], neck: [828, 74], shN: [630, 152], shF: [905, 150], hipN: [742, 492], hipF: [866, 494], tail: [655, 462] },
    head: { neck: [380, 402], eye: [432, 292] },
    armN: { sh: [272, 482], el: [97, 665] }, foreN: { el: [420, 492], wr: [494, 590] },
    armF: { sh: [1085, 477], el: [962, 675] }, foreF: { el: [1225, 495], wr: [1290, 590] },
    thighN: { hip: [222, 765], knee: [120, 985] }, shinN: { knee: [817, 765], sole: 1015 },
    thighF: { hip: [482, 762], knee: [585, 995] }, shinF: { knee: [1177, 762], sole: 1005 },
    tail: [1420, 325],
};
const G = {
    torso: { waist: [822, 414], neck: [841, 92], shN: [626, 152] },
    head: { neck: [395, 405] },
    armN: { sh: [1446, 108], el: [1405, 285] }, foreN: { el: [1405, 285], wr: [1410, 368] }, handN: { wr: [1410, 368], end: [1420, 585] },
    armF: { sh: [1078, 100], el: [1100, 262] }, foreF: { el: [1100, 262], wr: [1120, 365] }, handF: { wr: [1120, 365], end: [1110, 562] },
    thighN: { hip: [1017, 597], knee: [942, 716] }, shinN: { knee: [942, 716], sole: 960 },
    thighF: { hip: [1106, 624], knee: [1241, 721] }, shinF: { knee: [1241, 721], sole: 960 },
    tail: [765, 800],
};
const FAR = 0.84;          // tay / chân xa: tối hơn một chút
const TAIL_A = 22;         // đuôi vẽ chĩa lên -> hạ xuống cho rủ sau mông
const GIRTH = 1.0;         // mảnh khổng lồ: đã bè sẵn trong tranh

/** Da khổng lồ cho 1 đoạn xương: co theo tỉ lệ độ dài xương thường / khổng lồ, dựng thẳng như da thường */
function giantBone(name, gA, gB, nLenRig, { angle = null } = {}) {
    const k = nLenRig / (dist(gA, gB) * sc(name)) * GIRTH;
    return art(name, gA, { angle: angle ?? upright(gA, gB), scale: k });
}

// ---------- Thân ----------
const HIP = [800, 800];
add('hips', { pos: HIP });
add('torso', { ...two(art('torso', N.torso.waist), null), pos: HIP, parent: 'hips', z: 10 });
parts.torso.skins.normal = art('torso', N.torso.waist);
borrow('torso', 'normal');
// thân khổng lồ: xoay + co sao cho đường eo -> vai gần trùng dạng thường
{
    const nVec = dist(N.torso.waist, N.torso.shN) * sc('torso');
    const k = nVec / (dist(G.torso.waist, G.torso.shN) * sc('gTorso'));
    const ang = upright(G.torso.waist, G.torso.shN) - upright(N.torso.waist, N.torso.shN);
    parts.torso.skins.giant = art('gTorso', G.torso.waist, { angle: ang, scale: k });
    parts.torso._giantK = k;
}
const GK = parts.torso._giantK;   // tỉ lệ chung cho đầu / đuôi khổng lồ
const NECK = at('torso', N.torso.neck);
add('head', { ...two(art('head', N.head.neck), art('gHead', G.head.neck, { scale: GK * 1.05 })), pos: NECK, parent: 'torso', z: 24 });
borrow('head', 'normal');

// Mắt: 'open' = mắt vẽ sẵn trên đầu (mảnh trong suốt); biểu cảm dán đè lên. Dạng khổng lồ: đầu đã có mắt trắng rực -> ẩn
const EYE_C = { eyeBlink: [445, 712], eyeAngry: [750, 712], eyeDetermined: [1045, 712], eyePain: [1335, 712], eyeRoar: [1640, 712] };   // tâm mắt trên tấm 03
const eye = (n) => art(n, EYE_C[n]);
add('eye', {
    pos: at('head', N.head.eye), parent: 'head', z: 25, skin: 'open',
    skins: {
        open: art('eyeOpen', [0, 0]), blink: eye('eyeBlink'), angry: eye('eyeAngry'), determined: eye('eyeDetermined'),
        pain: eye('eyePain'), roar: eye('eyeRoar'), giant: art('eyeOpen', [0, 0]),
    },
});

// ---------- Đuôi (sau mông) ----------
add('tail', { ...two(art('tail', N.tail, { angle: TAIL_A }), art('gTail', G.tail, { angle: TAIL_A, scale: GK })),
    pos: at('torso', N.torso.tail), parent: 'hips', z: 1 });

// ---------- Chân ----------
const leg = (side, zT, shade) => {
    const T = N['thigh' + side], Sh = N['shin' + side], gT = G['thigh' + side], gS = G['shin' + side];
    const hipPos = at('torso', N.torso['hip' + side]);
    const thighN = art('thigh' + side, T.hip, { angle: upright(T.hip, T.knee) });
    add('thigh' + side, { ...two(thighN, giantBone('gThigh' + side, gT.hip, gT.knee, dist(T.hip, T.knee) * sc('thigh' + side))),
        pos: hipPos, parent: 'hips', z: zT, shade });
    borrow('thigh' + side, 'normal');
    const shinLen = (Sh.sole - Sh.knee[1]) * sc('shin' + side);
    const gk = shinLen / ((gS.sole - gS.knee[1]) * sc('gShin' + side));
    add('shin' + side, { ...two(art('shin' + side, Sh.knee), art('gShin' + side, gS.knee, { scale: gk })),
        pos: at('thigh' + side, T.knee), parent: 'thigh' + side, z: zT + 0.5, shade });
    borrow('shin' + side, 'normal');
};
leg('F', 3, FAR);   // chân xa (sau)
leg('N', 5, 1);     // chân gần (trước)

// ---------- Tay ----------
// Bàn tay tấm 03 vẽ NẰM NGANG chỉ sang phải, băng cổ tay ở bên trái -> xoay -90° cho chỉ xuống dọc cẳng tay;
// điểm treo ở mép trái băng cổ tay để băng phủ lên đầu cẳng tay.
const HAND = {
    fist: ['hFist', [478, 342], -90], claw: ['hClaw', [52, 332], -90], relax: ['hRelax', [800, 262], -55],
    palm: ['hPalm', [1145, 400], -110], thumb: ['hThumb', [1482, 352], -90],
};
const handSkins = (gName, gWr, gEnd, k) => ({
    ...Object.fromEntries(Object.entries(HAND).map(([s, [n, p, a]]) => [s, art(n, p, { angle: a })])),
    giant: art(gName, gWr, { angle: upright(gWr, gEnd), scale: k }),
});
const arm = (side, zA, shade) => {
    const A = N['arm' + side], F = N['fore' + side], gA = G['arm' + side], gF = G['fore' + side], gH = G['hand' + side];
    const armLen = dist(A.sh, A.el) * sc('arm' + side), foreLen = dist(F.el, F.wr) * sc('fore' + side);
    add('arm' + side, { ...two(art('arm' + side, A.sh, { angle: upright(A.sh, A.el) }), giantBone('gArm' + side, gA.sh, gA.el, armLen)),
        pos: at('torso', N.torso['sh' + side]), parent: 'torso', z: zA, shade });
    borrow('arm' + side, 'normal');
    const foreG = giantBone('gFore' + side, gF.el, gF.wr, foreLen);
    add('fore' + side, { ...two(art('fore' + side, F.el, { angle: upright(F.el, F.wr) }), foreG),
        pos: at('arm' + side, A.el), parent: 'arm' + side, z: zA + 0.5, shade });
    borrow('fore' + side, 'normal');
    add('hand' + side, { pos: at('fore' + side, F.wr), parent: 'fore' + side, z: zA + 1, shade, skin: 'fist',
        skins: handSkins('gHand' + side, gH.wr, gH.end, foreG.scale * 1.05) });
};
arm('F', 2, FAR);   // tay xa: sau thân
arm('N', 26, 1);    // tay gần: trước thân (bắp tay đè lên nửa sau thân như tranh)

// ---------- Xuất ----------
const out = {};
for (const [k, p] of Object.entries(parts)) {
    const { _art, _src, _giantK, ...rest } = p;
    if (rest.skins) rest.skins = Object.fromEntries(Object.entries(rest.skins).map(([n, s]) => { const { _art: a, _src: b, ...r } = s; return [n, r]; }));
    out[k] = rest;
}
const SOLE = Math.max(at('shinN', [N.shinN.knee[0], N.shinN.sole])[1], at('shinF', [N.shinF.knee[0], N.shinF.sole])[1]);
const ORIGIN = [HIP[0], SOLE];
const TOP = at('head', [330, 40])[1];
export const BRAKK_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: ORIGIN,
    heightPx: ORIGIN[1] - TOP,
    parts: out,
};
export const ASSASSIN_RIG = BRAKK_RIG; // tên chung cho tools/preview-cutout.html
export { brakkClips as CLIPS, SKIN_KEYS, DEFAULT_SKINS } from './brakkClips.js';
