// ============================================================
// RIG ELARION (Tam Nguyên) — Pháp Sư Nguyên Tố tộc Elf, 2D nhìn nghiêng
// ============================================================
// Ghép từ TẤM BỘ PHẬN vẽ riêng cho gắn xương:
//   art/elarion/02-body-parts.png : đầu (kèm tóc mái, tai nhọn), tóc sau (có đuôi tóc), thân áo choàng, 2 vạt áo,
//                                   bắp tay, cẳng tay ống loe, đùi, cẳng chân + bốt — đầu khớp vẽ TRÒN -> xoay không hở
//   art/elarion/03-hands-eyes.png : 6 bàn tay (thả lỏng / ngửa / đẩy / chỉ / nắm / kết ấn 2 ngón) + mắt biểu cảm
//                                   (mắt đã căn sẵn lên đầu bằng tools/make_overlay_eyes.py -> art/elarion/gen/)
//   art/elarion/04-book-gems.png  : Sách Nguyên Tố (đóng / hé / mở / mở bốc 3 luồng nguyên tố) — lơ lửng trước người
// Cắt: tools/cut_reference.py art/elarion/ref_spec.json -> elarion_atlas.png + elarionAtlas.json
// Điểm khớp ghi theo TOẠ ĐỘ TẤM GỐC. Góc khớp 0 = tay / chân buông thẳng xuống.
import atlasUrl from '../../assets/sprites/elarion_atlas.png';
import atlas from './elarionAtlas.json';

const D2R = Math.PI / 180;
const parts = {};
function atlasPivot(name, src) {
    const m = atlas.parts[name];
    return [m.rect[0] + (src[0] - m.src[0]) * m.scale, m.rect[1] + (src[1] - m.src[1]) * m.scale];
}
function art(name, srcPivot, { angle = 0, scale = 1, flipX = false, sx = 1 } = {}) {
    // scale ghi theo tấm gốc (mảnh nào đã thu nhỏ trong atlas thì bù lại)
    const m = atlas.parts[name];
    return { rect: m.rect, pivot: atlasPivot(name, srcPivot), angle, scale: scale / m.scale, flipX, sx, _art: name, _src: srcPivot };
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

// ---------- Tỉ lệ (chibi: đầu to, chân ngắn — tấm bộ phận vẽ chân dài hơn tranh mẫu) ----------
const HEAD = 0.95, ARM = 0.74, FORE = 0.72, THIGH = 0.6, THIGH_W = 0.92, SHIN = 0.86, SHIN_W = 0.9, HAND = 0.36, TAIL = 0.92, BOOK = 0.56;
const FAR = 0.82;   // tay / chân xa: tối hơn một chút

// ---------- Điểm khớp trên tấm 02 ----------
const T = { waist: [800, 400], neck: [800, 150], shN: [748, 236], shF: [770, 230], hipN: [800, 440], hipF: [772, 440],
    tailB: [752, 392], tailF: [884, 392] };
const HEAD_NECK = [181, 392];
const HAIR_PIN = { head: [170, 72], hair: [536, 70] };   // đỉnh tóc: tóc sau lùi ra sau gáy
const LIMB = {
    armN: [[235, 548], [153, 722]], foreN: [[790, 548], [845, 700]],
    armF: [[456, 550], [552, 728]], foreF: [[1088, 548], [1195, 688]],
    thighN: [[185, 842], [235, 1048]], thighF: [[500, 842], [505, 1048]],
    shinN: [830, 815], shinF: [1120, 838],
};
const SOLE = { shinN: 1100, shinF: 1096 };
const TAIL_TOP = { tailB: [1100, 186], tailF: [1288, 194] };

// ---------- Thân ----------
const HIP = T.waist;
add('hips', { pos: HIP });
add('torso', { ...art('torso', T.waist), pos: HIP, parent: 'hips', z: 10 });
const NECK = at('torso', T.neck);
add('head', { ...art('head', HEAD_NECK, { scale: HEAD }), pos: NECK, parent: 'torso', z: 24 });
// tóc sau: đỉnh tóc lùi ra sau, đuôi tóc rủ sau gáy; khớp lò xo (đung đưa) nằm sau thân
add('hairBack', { ...art('hairBack', HAIR_PIN.hair, { scale: HEAD }), pos: at('head', HAIR_PIN.head), parent: 'head', z: 0.5 });
// Mắt: 'open' = mắt vẽ sẵn trên đầu; biểu cảm dán đè (pivot = con ngươi, đã căn sẵn trong file gen)
const EYE_IRIS = [268, 307];
const EYE_PIVOT = [42, 33];
const eyeAt = (n) => {
    const m = atlas.parts['eye_' + n];
    return { rect: m.rect, pivot: [m.rect[0] + EYE_PIVOT[0], m.rect[1] + EYE_PIVOT[1]], angle: 0, scale: HEAD, flipX: false, sx: 1 };
};
add('eye', {
    pos: at('head', EYE_IRIS), parent: 'head', z: 25, skin: 'open',
    skins: {
        open: art('eyeOpen', [0, 0]), blink: eyeAt('blink'), happy: eyeAt('happy'), determined: eyeAt('determined'),
        pain: eyeAt('pain'), cast: eyeAt('cast'),
    },
});

// ---------- Vạt áo choàng: vạt sau bay ra SAU lưng, vạt trước (chuỗi ngọc) rủ trước đùi ----------
add('tailB', { ...art('tailB', TAIL_TOP.tailB, { scale: TAIL }), pos: at('torso', T.tailB), parent: 'hips', z: 2 });
add('tailF', { ...art('tailF', TAIL_TOP.tailF, { scale: TAIL * 0.86 }), pos: at('torso', T.tailF), parent: 'hips', z: 11 });

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
// Ống tay loe (viền ren) đè lên gốc bàn tay (bàn tay z thấp hơn cẳng tay).
const HAND_SKIN = {
    relax: ['hRelax', [60, 328], -84], palm: ['hPalm', [355, 335], -90], push: ['hPush', [685, 340], -90],
    point: ['hPoint', [955, 330], -90], fist: ['hFist', [1255, 335], -90], mudra: ['hMudra', [1535, 330], -90],
};
const handSkins = () => Object.fromEntries(Object.entries(HAND_SKIN).map(([k, [n, p, a]]) => [k, art(n, p, { angle: a, scale: HAND })]));
const arm = (side, z, shade, skin) => {
    const [s0, e0] = LIMB['arm' + side], [e1, w1] = LIMB['fore' + side];
    add('arm' + side, { ...art('arm' + side, s0, { angle: upright(s0, e0), scale: ARM }), pos: at('torso', T['sh' + side]), parent: 'torso', z, shade });
    add('fore' + side, { ...art('fore' + side, e1, { angle: upright(e1, w1), scale: FORE }), pos: at('arm' + side, e0), parent: 'arm' + side, z: z + 0.5, shade });
    add('hand' + side, { pos: at('fore' + side, w1), parent: 'fore' + side, z: z + 0.3, shade, skin, skins: handSkins() });
    borrow('hand' + side, skin);
};
arm('F', 1, FAR, 'relax');
arm('N', 26, 1, 'palm');

// ---------- Sách Nguyên Tố: lơ lửng trước ngực, cao ngang đầu (không cầm tay) ----------
const BOOK_SKIN = { closed: ['bookClosed', [200, 270]], half: ['bookHalf', [505, 268]], open: ['bookOpen', [898, 305]], glow: ['bookGlow', [1325, 300]] };
add('book', {
    pos: at('torso', [1110, 215]), parent: 'hips', z: 28, skin: 'closed',
    skins: Object.fromEntries(Object.entries(BOOK_SKIN).map(([k, [n, p]]) => [k, art(n, p, { scale: BOOK })])),
});
borrow('book', 'closed');

// ---------- Xuất ----------
const out = {};
for (const [k, p] of Object.entries(parts)) {
    const { _art, _src, ...rest } = p;
    if (rest.skins) {
        rest.skins = Object.fromEntries(Object.entries(rest.skins).map(([n, s]) => { const { _art: a, _src: b, ...r } = s; return [n, r]; }));
        delete rest.rect; delete rest.pivot; delete rest.angle; delete rest.scale; delete rest.sx; delete rest.flipX;
    }
    out[k] = rest;
}
const SOLE_Y = Math.max(at('shinN', [LIMB.shinN[0], SOLE.shinN])[1], at('shinF', [LIMB.shinF[0], SOLE.shinF])[1]);
const ORIGIN = [HIP[0], SOLE_Y];
const TOP = at('head', [200, 75])[1];
export const ELARION_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: ORIGIN,
    heightPx: ORIGIN[1] - TOP,
    parts: out,
};
/** Điểm giữa trang sách (toạ độ khớp 'book', px) — chỗ phép bốc lên */
export const BOOK_CENTER = [0, -40];
export const ASSASSIN_RIG = ELARION_RIG; // tên chung cho tools/preview-cutout.html
export { elarionClips as CLIPS, SKIN_KEYS, DEFAULT_SKINS, SECONDARY } from './elarionClips.js';
