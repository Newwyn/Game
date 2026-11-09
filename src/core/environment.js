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
// 🎨 Cảnh VẼ BẰNG CODE (tools/battle_bg.py): lớp xa + lớp gần (2 tấm tranh) + đất lặp — có tranh thì thay khối 3D
import PAINTED from '../assets/battle/battle_bg.json';
const BG_URL = import.meta.glob('../assets/battle/*.webp', { eager: true, import: 'default' });   // chỉ là đường dẫn, tải khi cần
const loader = new THREE.TextureLoader();

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
let active, ground, originalGround, originalSky, hemi, started = false;
const weakDevice = () => softwareGL() || (globalThis.navigator?.deviceMemory ?? 8) <= 4;

// DataTexture avoids canvas / external assets. A 64x64 tile is enough at this scale.
function groundTexture(profile) {
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
    const profile = BATTLE_THEMES[key] ?? BATTLE_THEMES.meadow;
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
        hemi.intensity = Math.max(0.65, next.profile.intensity * 0.75);
    }
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
