// Location-specific battle scenery. All geometry is static and merged by material.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { scene, dirLight } from './scene.js';
import { toonMaterial } from '../render/toon.js';
import { GROUND_Y } from '../config.js';
import { cameraRig } from './cameraRig.js';
import { softwareGL } from './gpu.js';
import { BATTLE_THEMES } from './battleThemes.js';
export { themeForBattle } from './battleThemes.js';
import { BG3D, MODEL_SCENES, createModelScene } from './battleScene3d.js';
import { PAINT } from '../world3d/assets.js';   // demo: sân đấu dựng bằng mô hình 3D của bản đồ (?bg3d=1)
// 🎨 Cảnh VẼ BẰNG CODE (tools/battle_bg.py): lớp xa + lớp gần (2 tấm tranh) + đất lặp — có tranh thì thay khối 3D
import PAINTED from '../assets/battle/battle_bg.json';
const BG_URL = import.meta.glob('../assets/battle/*.webp', { eager: true, import: 'default' });   // chỉ là đường dẫn, tải khi cần
const loader = new THREE.TextureLoader();
// (14/11/2026) mặt sân vẽ tay (Codex, ô lát liền): src/assets/battle3d/<bộ>_ground.webp — dùng cho cảnh 3D cùng bộ phông
const GROUND3D_URL = import.meta.glob('../assets/battle3d/*_ground.webp', { eager: true, import: 'default' });
const GROUND3D_OF = { forest: 'forest', square: 'town', market: 'town', castle: 'town', gate: 'town', well: 'town', meadow: 'forest', field: 'forest' };
function ground3d(key) {
    const url = GROUND3D_URL[`../assets/battle3d/${GROUND3D_OF[key]}_ground.webp`];
    if (!url) return null;
    const t = loader.load(url);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const n = GROUND3D_OF[key] === 'town' ? 2 : 1;   // đá lát: viên nhỏ hơn (lặp dày gấp đôi) cho vừa cỡ nhân vật
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(22 * n, 14 * n);   // 1 ô ảnh ≈ 10 đơn vị sân
    return t;
}

// Server ARENA_BOUNDS: x +/-48, z +/-13. Every solid prop stays beyond it.
const cache = new Map();
const shapes = {
    box: new THREE.BoxGeometry(1, 1, 1),
    ball: new THREE.IcosahedronGeometry(1, 0),
    cone: new THREE.ConeGeometry(1, 1, 7),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 8),
};
// Normalize shared primitives once; polyhedra are non-indexed, boxes are indexed.
for (const [key, geometry] of Object.entries(shapes)) {
    if (geometry.index) { shapes[key] = geometry.toNonIndexed(); geometry.dispose(); }
}
const materials = new Map();
function material(color, glow = false) {
    const key = `${color}:${glow}`;
    if (!materials.has(key)) materials.set(key, toonMaterial(color, glow ? { emissive: color, emissiveIntensity: 0.7 } : {}));
    return materials.get(key);
}
const C = { wood: 0x71513a, leaf: 0x56894c, pine: 0x376b55, rock: 0x85858a,
    wall: 0xc7b79b, roof: 0x955c50, gold: 0xcda353, cloth: 0x883e51,
    glow: 0x6de5da, water: 0x396d86, white: 0xdce5eb, dark: 0x343442 };
let active, ground, originalGround, originalSky, hemi, ambient, started = false;
const weakDevice = () => softwareGL() || (globalThis.navigator?.deviceMemory ?? 8) <= 4;

const FORCE_SCENE = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('scene') : null;
// (12/11/2026) cảnh trong nhà / lâu đài: trước đây nền và trời xanh đen lạnh, nhìn "oải" -> nền đá ấm, trời tối ấm, ánh đèn vàng
const PAINT_PROFILE = {
    tower: { ground: 0x8d8478, sky: 0x2b2a3a, sun: 0xffd9a8, intensity: 1.35, near: 40, far: 110 },
    hall: { ground: 0x9a8f80, sky: 0x33293a, sun: 0xffd9a8, intensity: 1.4 },
    library: { ground: 0x8e7f6c, sky: 0x3a2f2e, sun: 0xffd9a0, intensity: 1.3 },
    crypt: { ground: 0x6f7480, sky: 0x232636, sun: 0xc6cff0, intensity: 1.0, near: 32, far: 80 },
    // (12/11, người chơi) hang phải TỐI NHƯ ĐÊM, chỉ sáng nhờ đèn dầu: ánh sáng chung rất thấp, ngả lam; đèn thật do paintMineLife đặt
    mine: { ground: 0x6a6258, sky: 0x06070b, sun: 0x7f93c4, intensity: 0.16, hemi: 0.22, ambient: 0.05, near: 55, far: 150 },
    deepMine: { ground: 0x565a68, sky: 0x04050a, sun: 0x6f86c8, intensity: 0.12, hemi: 0.18, ambient: 0.04, near: 50, far: 140 },
    gate: { ground: 0xa8a294, sky: 0xbfd6ea }, castle: { ground: 0xb4ab9b, sky: 0xc3dbee }, battlement: { ground: 0xa39d92, sky: 0xb5cde6 }, bridge: { sky: 0xbdd6ea },
};

/** Nền sân kiểu TRANH VẼ TAY (12/11/2026): cỏ / đất = các vệt cọ đậm nhạt chồng nhau; đá = viên đá lát so le; ván = tấm ván có vân */
function paintedGround(profile) {
    const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    let seed = 4711; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const base = new THREE.Color(profile.ground), hsl = {}; base.getHSL(hsl);
    const s = profile.surface, soft = !(s === 'stone' || s === 'cobble' || s === 'planks');
    if (soft && (s === 'grass' || s === 'moss')) { hsl.s = Math.min(1, hsl.s * 1.15 + 0.05); hsl.l = Math.min(0.5, hsl.l * 1.08); }
    hsl.l = Math.max(hsl.l, 0.26);   // nền hang / hầm ngục không được đen kịt: phải còn thấy viên đá, vệt cọ
    const css = (dh, ds, dl) => `hsl(${((hsl.h + dh + 1) % 1) * 360}, ${Math.max(0, Math.min(1, hsl.s + ds)) * 100}%, ${Math.max(0, Math.min(1, hsl.l + dl)) * 100}%)`;
    g.fillStyle = css(0, 0, 0); g.fillRect(0, 0, S, S);
    const wrap = (draw) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.save(); g.translate(ox, oy); draw(); g.restore(); } };
    if (soft) {
        for (let i = 0; i < 520; i++) {   // vệt cọ: dài theo chiều ngang sân, đậm nhạt xen kẽ
            const x = R() * S, y = R() * S, w = 18 + R() * 46, h = 5 + R() * 11, a = (R() - 0.5) * 0.5, dl = (R() - 0.5) * 0.14, dh = (R() - 0.5) * 0.035;
            g.fillStyle = css(dh, (R() - 0.5) * 0.1, dl); g.globalAlpha = 0.55;
            wrap(() => { g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); g.fill(); });
        }
        g.globalAlpha = 1;
    } else if (s === 'planks') {
        for (let y = 0; y < S; y += 64) {
            let x = -R() * 120;
            while (x < S) { const w = 150 + R() * 140; g.fillStyle = css((R() - 0.5) * 0.02, 0, (R() - 0.5) * 0.09); g.fillRect(x + 2, y + 2, w - 4, 60);
                g.strokeStyle = css(0, 0, -0.1); g.globalAlpha = 0.35; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + 6, y + 12 + k * 18 + R() * 6); g.lineTo(x + w - 6, y + 12 + k * 18 + R() * 6); g.stroke(); } g.globalAlpha = 1; x += w; }
        }
        g.fillStyle = css(0, 0, -0.16); for (let y = 0; y < S; y += 64) g.fillRect(0, y, S, 3);
    } else {
        g.fillStyle = css(0, -0.02, -0.09); g.fillRect(0, 0, S, S);   // mạch vữa
        const rowH = s === 'cobble' ? 40 : 64, colW = s === 'cobble' ? 58 : 128;
        for (let r = 0, y = 0; y < S; y += rowH, r++) for (let x = -(r % 2) * colW / 2; x < S; x += colW) {
            g.fillStyle = css((R() - 0.5) * 0.03, (R() - 0.5) * 0.05, (R() - 0.5) * 0.13);
            const rad = s === 'cobble' ? 12 : 6; g.beginPath(); g.roundRect(x + 3, y + 3, colW - 6, rowH - 6, rad); g.fill();
            g.fillStyle = 'rgba(255,255,255,0.07)'; g.beginPath(); g.roundRect(x + 5, y + 5, colW - 10, (rowH - 6) * 0.4, rad); g.fill();
        }
    }
    const texture = new THREE.CanvasTexture(cv);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(7, 4.5);
    texture.anisotropy = 4;
    return texture;
}

// DataTexture avoids canvas / external assets. A 64x64 tile is enough at this scale.
function groundTexture(profile) {
    if (PAINT && typeof document !== 'undefined') return paintedGround(profile);
    const size = 64, pixels = new Uint8Array(size * size * 4);
    let seed = 701;
    const rgb = [(profile.ground >> 16) & 255, (profile.ground >> 8) & 255, profile.ground & 255];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        seed = (seed * 16807) % 2147483647;
        let shade = 0.91 + (seed / 2147483647) * 0.16;
        const s = profile.surface;
        if (s === 'stone' || s === 'cobble') {
            const row = Math.floor(y / 16);
            if (y % 16 < 1 || (x + (row % 2) * 8) % (s === 'stone' ? 32 : 16) < 1) shade *= 0.68;
        } else if (s === 'planks') {
            if (y % 8 === 0) shade *= 0.55;
            shade += Math.sin(x * 0.7 + y * 2) * 0.035;
        } else if (s === 'moss' || s === 'grass') {
            shade += Math.sin(x * 0.19) * Math.cos(y * 0.29) * 0.11;
        } else {
            // Broad dusty center stripe; tiles align into paths along arena X.
            shade += Math.cos(y * Math.PI * 2 / size) * 0.09;
        }
        const i = (y * size + x) * 4;
        for (let c = 0; c < 3; c++) pixels[i + c] = Math.min(255, rgb[c] * shade);
        pixels[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, size, size);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(28, 18);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
}

function bake(buckets) {
    const group = new THREE.Group();
    for (const [mat, pieces] of buckets) {
        const geometry = mergeGeometries(pieces);
        pieces.forEach(g => g.dispose());
        geometry.computeBoundingSphere();
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.matrixAutoUpdate = false;
        group.add(mesh);
    }
    return group;
}

function paintedTex(key, part, repeat = null) {
    const t = loader.load(BG_URL[`../assets/battle/${key}_${part}.webp`]);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
    else t.wrapS = THREE.RepeatWrapping;
    return t;
}
/** Tấm tranh đứng (không nhận đèn / sương — màu đã vẽ sẵn sương xa) */
function painting(map, w, h, z, transparent) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map, transparent, alphaTest: transparent ? 0.02 : 0, depthWrite: !transparent, fog: false }));
    m.position.set(0, GROUND_Y - 1 + h / 2, z);
    return m;
}
/** Cảnh vẽ bằng code: lớp xa 200x18 ở z=-50 · lớp gần 150x9 ở z=-30 (máy quay đi ngang -> lệch nhau, có chiều sâu) */
function createPainted(key, profile, start) {
    const info = PAINTED[key];
    const rear = new THREE.Group(), foreground = new THREE.Group(), root = new THREE.Group();
    rear.add(painting(paintedTex(key, 'back'), 200, 18, -50, false), painting(paintedTex(key, 'mid'), 150, 9, -30, true));
    root.add(rear, foreground);
    root.visible = false;
    root.traverse(o => { o.userData.persistent = true; });
    const map = paintedTex(key, 'ground', [27.5, 17.5]);
    const sun = info.sun ? new THREE.Color(info.sun).getHex() : profile.sun;
    const p = { ...profile, sun, intensity: info.light ?? profile.intensity, ground: 0x8a8a8a };
    return { key, root, foreground, map, profile: p, background: new THREE.Color(info.sky ?? profile.sky),
        fog: new THREE.Fog(info.fog ?? profile.sky, profile.near, Math.max(profile.far, 90)),
        metrics: { buildMs: +(performance.now() - start).toFixed(2), drawCalls: 3, painted: true } };
}

/** CPU-only builder is also used by the offline performance audit. */
export function createTheme(key, weak = false) {
    const start = performance.now();
    const profile = PAINT ? { ...(BATTLE_THEMES[key] ?? BATTLE_THEMES.meadow), ...(PAINT_PROFILE[key] ?? {}) } : (BATTLE_THEMES[key] ?? BATTLE_THEMES.meadow);
    if (BG3D && MODEL_SCENES.has(key)) {
        // demo ?bg3d=1: cây / bụi / đá / cỏ lấy từ bộ mô hình của bản đồ thế giới -> cùng phong cách với bản đồ
        const { rear, foreground } = createModelScene(key), root = new THREE.Group();
        root.add(rear, foreground); root.visible = false;
        root.traverse(o => { o.userData.persistent = true; });   // không bị dọn khi vào trận mới
        return { key, root, foreground, map: ground3d(key) ?? groundTexture(profile), profile, background: new THREE.Color(profile.sky),
            fog: new THREE.Fog(profile.sky, Math.max(profile.near, 34), Math.max(profile.far, 96)), metrics: { buildMs: +(performance.now() - start).toFixed(2), model3d: true } };
    }
    if (PAINTED[key] && typeof document !== 'undefined') return createPainted(key, profile, start);
    const back = new Map(), front = new Map();
    let bucket = back;
    const transform = new THREE.Object3D();
    function part(shape, color, x, y, z, sx, sy, sz, glow = false, angle = 0) {
        transform.position.set(x, y + GROUND_Y, z);
        transform.scale.set(sx, sy, sz);
        transform.rotation.set(0, angle, 0);
        transform.updateMatrix();
        const mat = material(color, glow);
        if (!bucket.has(mat)) bucket.set(mat, []);
        bucket.get(mat).push(shapes[shape].clone().applyMatrix4(transform.matrix));
    }
    const box = (color, x, y, z, sx, sy, sz) => part('box', color, x, y, z, sx, sy, sz);
    function tree(x, z, elf = false, pine = false) {
        const h = elf ? 9 : 4;
        part('cylinder', C.wood, x, h / 2, z, elf ? 0.7 : 0.25, h, elf ? 0.7 : 0.25);
        if (pine) {
            for (let i = 0; i < 3; i++) part('cone', C.pine, x, 3 + i, z, 1.8 - i * 0.35, 3, 1.8 - i * 0.35);
        } else {
            part('ball', C.leaf, x, h, z, elf ? 4 : 2, elf ? 2.4 : 1.7, elf ? 3 : 1.8);
            part('ball', C.pine, x + 0.8, h + 1.2, z, elf ? 3 : 1.4, elf ? 2 : 1.3, elf ? 2.5 : 1.4);
        }
        if (elf) for (let j = 0; j < 3; j++) part('ball', C.glow, x + (j - 1) * 1.1, 2 + j * 1.5, z + 0.9, 0.13, 0.13, 0.13, true);
    }
    function rock(x, z, scale = 1) { part('ball', C.rock, x, scale * 0.45, z, scale, scale * 0.7, scale * 0.8); }
    function house(x, z) {
        box(C.wall, x, 2.3, z, 7, 4.6, 5);
        part('cone', C.roof, x, 5.6, z, 5, 2.8, 4, false, Math.PI / 4);
        box(C.wood, x, 1.3, z + 2.55, 1.4, 2.6, 0.15);
        box(C.gold, x - 2, 2.8, z + 2.57, 1, 1.2, 0.16);
    }
    function column(x, z, white = false, broken = false) {
        const color = white ? C.white : C.rock;
        box(color, x, 0.25, z, 2, 0.5, 2);
        part('cylinder', color, x, broken ? 1.7 : 3.1, z, 0.65, broken ? 3 : 6, 0.65);
        box(color, x, broken ? 3.2 : 6.2, z, 1.8, 0.5, 1.8);
    }
    function brazier(x, z) {
        part('cylinder', C.dark, x, 1, z, 0.25, 2, 0.25);
        part('cone', C.gold, x, 2, z, 0.7, 0.6, 0.7);
        part('ball', 0xffaa4f, x, 2.55, z, 0.48, 0.8, 0.48, true);
        part('cone', 0xffde8a, x, 3.15, z, 0.23, 0.8, 0.23, true);
    }
    const kind = profile.kind;
    const woods = ['meadow', 'forest', 'swamp', 'camp', 'elf', 'field', 'road', 'outpost'];
    const step = weak ? 14 : 8;
    if (woods.includes(kind)) {
        for (let x = -52; x <= 52; x += step) {
            tree(x, -20 - Math.abs(Math.sin(x)) * 3, kind === 'elf', ['forest', 'swamp', 'outpost'].includes(kind));
            if (['forest', 'elf'].includes(kind) && !weak) tree(x + 3, -29, kind === 'elf', kind === 'forest');
        }
        for (const x of [-53, 53]) for (let z = -9; z <= 12; z += step) tree(x, z, kind === 'elf');
        if (['field', 'road'].includes(kind)) for (let x = -44; x < 48; x += weak ? 8 : 4) {
            for (let i = 0; i < 3; i++) {
                box(C.gold, x + i * 0.35, 0.65, -16 - i * 0.3, 0.06, 1.3, 0.06);
                part('ball', C.gold, x + i * 0.35, 1.3, -16 - i * 0.3, 0.14, 0.35, 0.14);
            }
        }
        if (kind === 'elf') for (let x = -44; x < 48; x += step) {
            part('cylinder', C.white, x, 0.45, -16, 0.12, 0.9, 0.12);
            part('ball', C.glow, x, 0.95, -16, 0.7, 0.3, 0.7, true);
            part('ball', C.glow, x + 1.5, 2.3, -16.5, 0.07, 0.07, 0.07, true);
        }
        if (kind === 'swamp') box(C.water, 0, 0.01, -18, 90, 0.02, 4);
        if (['camp', 'outpost'].includes(kind)) {
            for (let x = -44; x <= 44; x += weak ? 8 : 4) part('cone', C.wood, x, 1.4, -16, 0.35, 2.8, 0.35);
            for (const x of [-30, 30]) { house(x, -24); box(C.cloth, x + 5, 3, -21, 1.4, 2, 0.1); brazier(x + 6, -17); }
        }
    } else if (kind === 'mine') {
        for (let x = -48; x <= 48; x += weak ? 16 : 10) {
            rock(x, -23, 4);
            box(C.wood, x - 2, 2.5, -19, 0.6, 5, 0.6);
            box(C.wood, x + 2, 2.5, -19, 0.6, 5, 0.6);
            box(C.wood, x, 5, -19, 5.2, 0.7, 0.8);
            part('cone', C.glow, x + 3, 1, -17, 0.6, 2, 0.5, true);
        }
        for (const z of [-16, -18]) box(C.dark, 0, 0.12, z, 98, 0.15, 0.12);
        for (let x = -48; x <= 48; x += 3) box(C.wood, x, 0.06, -17, 0.5, 0.12, 3);
        for (const x of [-54, 54]) for (const z of [-7, 5]) rock(x, z, 4);
    } else if (kind === 'bridge') {
        // Water remains below the deck, beyond both railings; no overlapping floor.
        for (const z of [-24, 24]) box(C.water, 0, -0.8, z, 130, 0.2, 18);
        for (const z of [-15, 15]) {
            if (z > 0) bucket = front;
            box(C.wood, 0, 1.5, z, 100, 0.25, 0.3);
            for (let x = -50; x <= 50; x += 5) box(C.rock, x, 0.85, z, 0.6, 1.7, 0.6);
            bucket = back;
        }
    } else {
        const settlement = ['village', 'square', 'well', 'market', 'castle'].includes(kind);
        if (settlement) {
            for (let x = -42; x <= 42; x += weak ? 28 : 14) house(x, -24);
            if (kind === 'market') for (const x of [-32, -16, 0, 16, 32]) {
                box(C.wood, x, 0.8, -17, 5, 1.6, 2);
                for (const dx of [-2.2, 2.2]) box(C.wood, x + dx, 1.9, -17, 0.15, 3.8, 0.15);
                box(C.cloth, x, 3.8, -17, 5.8, 0.25, 3);
                box(C.gold, x + 3.8, 0.6, -17, 1.1, 1.2, 1.1);
            }
            if (kind === 'well' || kind === 'square') {
                // Open well: four stone sides with a dark recessed center.
                box(C.dark, 0, 0.1, -17.5, 3, 0.1, 3);
                for (const dx of [-1.5, 1.5]) box(C.rock, dx, 0.7, -17.5, 0.4, 1.4, 3.4);
                for (const dz of [-19, -16]) box(C.rock, 0, 0.7, dz, 3.4, 1.4, 0.4);
                for (const dx of [-2, 2]) box(C.wood, dx, 2, -17.5, 0.25, 4, 0.25);
                box(C.roof, 0, 4, -17.5, 5, 0.3, 4);
            }
        } else {
            const white = kind === 'moon';
            const ruined = ['ruins', 'crypt'].includes(kind);
            for (let x = -44; x <= 44; x += weak ? 22 : 11) column(x, -19, white, ruined && x % 2 === 0);
            if (['hall', 'library', 'crypt', 'ruins'].includes(kind)) {
                box(C.dark, 0, 5, -25, 110, 10, 1);
                // Rear ceiling strip establishes an interior without covering the camera/arena.
                box(C.rock, 0, 9.8, -21, 110, 0.5, 8);
                if (kind === 'hall') {
                    box(C.cloth, 0, 0.015, -18, 10, 0.025, 9);
                    for (const x of [-22, 0, 22]) {
                        box(C.gold, x, 7.5, -20, 4, 0.2, 0.4);
                        for (const dx of [-1.5, 0, 1.5]) part('ball', 0xffde8a, x + dx, 7.8, -20, 0.16, 0.3, 0.16, true);
                    }
                }
                if (kind === 'library') for (let x = -38; x <= 38; x += 12) {
                    box(C.wood, x, 3, -23, 8, 6, 1.5);
                    for (let y = 1; y < 6; y += 1.5) for (let j = 0; j < 8; j++) box(j % 2 ? C.cloth : C.gold, x - 3 + j * 0.85, y, -22.15, 0.55, 1, 0.25);
                }
                if (ruined) for (const x of [-32, -12, 12, 32]) { box(C.rock, x, 0.65, -16, 3, 1.3, 1.8); rock(x + 3, -18, 1.4); }
            }
            if (['gate', 'battlement', 'tower'].includes(kind)) {
                box(C.rock, 0, 1.2, -17, 104, 2.4, 1.3);
                for (let x = -50; x <= 50; x += 4) box(C.rock, x, 2.9, -17, 2, 1, 1.3);
                if (kind === 'gate') {
                    for (const x of [-10, 10]) box(C.rock, x, 5, -23, 6, 10, 5);
                    box(C.rock, 0, 9, -23, 18, 2, 5);
                }
                if (kind === 'battlement') { box(C.wood, 0, 5, -22, 0.4, 10, 0.4); box(C.cloth, 2, 8, -22, 4, 2, 0.1); }
                for (const x of [-36, -12, 12, 36]) brazier(x, -15.5);
            }
            if (white) {
                part('ball', C.white, 0, 20, -42, 4, 4, 1, true);
                for (const x of [-33, -11, 11, 33]) box(C.white, x, 7, -26, 13, 0.6, 2);
            }
        }
    }
    // Low foreground dressing hides with the combat camera, like the original meadow.
    bucket = front;
    if (!['bridge', 'hall', 'library', 'tower', 'battlement', 'moon'].includes(kind)) {
        for (let x = -45; x <= 45; x += weak ? 15 : 9) {
            rock(x, 16, 0.6);
            if (woods.includes(kind)) part('ball', C.leaf, x + 2, 0.4, 16, 0.8, 0.5, 0.7);
        }
    }
    const root = new THREE.Group(), rear = bake(back), foreground = bake(front);
    root.add(rear, foreground);
    root.visible = false;
    root.traverse(o => { o.userData.persistent = true; });
    const map = groundTexture(profile);
    const result = { key, root, foreground, map, profile, background: new THREE.Color(profile.sky),
        fog: new THREE.Fog(profile.sky, profile.near, profile.far) };
    result.metrics = { buildMs: +(performance.now() - start).toFixed(2),
        drawCalls: rear.children.length + foreground.children.length + 1,
        triangles: [...rear.children, ...foreground.children].reduce((n, m) => n + m.geometry.attributes.position.count / 3, 2), weak };
    return result;
}

function getTheme(key) {
    if (!cache.has(key)) {
        const built = createTheme(key, weakDevice());
        cache.set(key, built);
        scene.add(built.root);
        console.debug('[battle-theme]', key, built.metrics);
    }
    return cache.get(key);
}

export function setBattleTheme(key = 'meadow') {
    if (FORCE_SCENE) key = FORCE_SCENE;   // ?scene=tower -> mọi trận dùng cảnh đó (để xem thử từng cảnh)
    if (!started) buildEnvironment();
    if (!Object.hasOwn(BATTLE_THEMES, key)) key = 'meadow';
    if (active?.key === key) return;
    const next = getTheme(key);
    if (active) active.root.visible = false;
    active = next;
    // giữ tối đa 2 cảnh vẽ tranh trong bộ nhớ: cảnh cũ hơn trả lại bộ nhớ card đồ hoạ
    const painted = [...cache.values()].filter(t => t.metrics?.painted && t !== active);
    for (const old of painted.slice(0, Math.max(0, painted.length - 1))) {
        scene.remove(old.root);
        old.root.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.map?.dispose(); o.material.dispose(); } });
        old.map.dispose();
        cache.delete(old.key);
    }
    active.root.visible = true;
    active.foreground.visible = cameraRig.getMode() !== 'combat';
    // Keep the original grass and painted sky cached for the meadow fallback.
    ground.material.map = key === 'meadow' ? originalGround : next.map;
    ground.material.color.set(0xffffff);
    const narrow = key === 'bridge' && !next.metrics?.painted;   // cầu khối 3D cũ: sàn hẹp; cầu vẽ tranh: sàn ván kín sân
    ground.scale.set(narrow ? 104 / 220 : 1, narrow ? 28 / 140 : 1, 1);
    scene.background = key === 'meadow' ? originalSky : next.background;
    scene.fog = next.fog;
    if (hemi) {
        hemi.color.set(next.profile.sun);
        hemi.groundColor.set(next.profile.ground);
        hemi.intensity = next.profile.hemi ?? Math.max(0.65, next.profile.intensity * 0.75);   // hemi: cảnh tối (hang) tự đặt ánh sáng nền thấp
    }
    if (ambient) ambient.intensity = next.profile.ambient ?? 0.25;
    dirLight.color.set(next.profile.sun);
    dirLight.intensity = next.profile.intensity;
}

export function buildEnvironment() {
    if (started) return;
    // scene.js owns the persistent ground but does not export it.
    ground = scene.children.find(o => o.isMesh && o.geometry.type === 'PlaneGeometry' && o.userData.persistent);
    if (!ground) throw new Error('Battle ground must exist before buildEnvironment');
    originalGround = ground.material.map;
    originalSky = scene.background;
    hemi = scene.children.find(o => o.isHemisphereLight);
    ambient = scene.children.find(o => o.isAmbientLight);
    started = true;
    setBattleTheme('meadow');
    cameraRig.onModeChange(mode => { if (active) active.foreground.visible = mode !== 'combat'; });
    // Warm the same lazy cache in idle slices AFTER the loading overlay is removed.
    // This covers first-build spikes (>30ms on slow CPUs); one theme per slice.
    const pending = Object.keys(BATTLE_THEMES).filter(key => key !== 'meadow' && !PAINTED[key]);   // cảnh vẽ tranh: nạp khi cần (đỡ bộ nhớ card đồ hoạ)
    const idle = callback => typeof requestIdleCallback === 'function'
        ? requestIdleCallback(callback, { timeout: 2000 }) : setTimeout(callback, 32);
    function warm() {
        if (document.getElementById('loading-screen')) { setTimeout(warm, 250); return; }
        const key = pending.shift();
        if (key) { getTheme(key); if (pending.length) idle(warm); }
    }
    setTimeout(() => idle(warm), 0);
}
