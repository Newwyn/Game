// ============================================================
// Bản đồ 3D — dựng cảnh 1 bản đồ: mặt đất theo ô (src/world/terrain3d.js) + công trình đặt tay (layouts.js) + cây / cỏ tự rải
//   Toạ độ: ô (x, y) của lưới 2D = vùng [x, x+1] × [y, y+1] trên mặt phẳng XZ (y lưới = z 3D). 1 ô = 1 đơn vị.
//   Mọi mô hình gom theo loại thành InstancedMesh -> cả bản đồ chỉ vài chục lệnh vẽ.
// ============================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { proto, loadModels, addSway } from './assets.js';

const M = 10;   // viền trang trí ngoài mép bản đồ (ô)
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const Y = new THREE.Vector3(0, 1, 0);

export const GROUND = {   // màu mặt đất theo loại ô
    g: [0.24, 0.48, 0.33], p: [0.08, 0.36, 0.47], s: [0.1, 0.06, 0.6], w: [0.11, 0.3, 0.32], f: [0.12, 0.5, 0.42], d: [0.36, 0.32, 0.26],
    t: [0.25, 0.45, 0.27], b: [0.24, 0.48, 0.33],
};

/** Gom đặt mô hình -> InstancedMesh */
class Batch {
    constructor() { this.list = new Map(); }
    put(key, x, y, z, rot = 0, sx = 1, sy = sx, sz = sx) {
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(Y, rot), new THREE.Vector3(sx, sy, sz));
        if (!this.list.has(key)) this.list.set(key, []);
        this.list.get(key).push(m);
    }
    keys() { return [...this.list.keys()]; }
    flush(group) {
        for (const [key, mats] of this.list) for (const p of proto(key)) {
            const im = new THREE.InstancedMesh(p.geo, p.mat, mats.length);
            mats.forEach((m, k) => im.setMatrixAt(k, m));
            im.castShadow = im.receiveShadow = true;
            im.computeBoundingSphere();
            group.add(im);
        }
    }
}

// vật liệu tự dựng (hình khối đơn giản: đống rơm, giếng, cột, mái vòm…)
const MAT = new Map();
const lam = (hex, opts = {}) => {
    const k = hex + JSON.stringify(opts);
    if (!MAT.has(k)) MAT.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9, metalness: 0, flatShading: true, ...opts }));
    return MAT.get(k);
};

/**
 * Dựng cảnh. map: MAPS[id] (cols, rows, grid) · terrain: TERRAIN[id] · layout: LAYOUTS[id]
 * Trả { group, water, anim: [fn(t)], top } — top: InstancedMesh mặt đất (để bấm chuột chọn ô)
 */
export async function buildScene(id, map, terrain, layout) {
    seed = 7 + id.length * 131;
    const cols = map.cols, rows = map.rows;
    const group = new THREE.Group(), anim = [];
    const B = new Batch();
    const cover = new Uint8Array(cols * rows);   // ô có công trình -> không rải cây / cỏ
    const coverRect = (x0, z0, x1, z1) => { for (let z = Math.floor(z0); z < Math.ceil(z1); z++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) if (x >= 0 && z >= 0 && x < cols && z < rows) cover[x + z * cols] = 1; };
    const T = (x, z) => terrain[Math.max(0, Math.min(rows - 1, z))][Math.max(0, Math.min(cols - 1, x))];
    const inside = (x, z) => x >= 0 && z >= 0 && x < cols && z < rows;
    const style = layout.style ?? {};

    for (const o of map.objects ?? []) for (const [x, y] of o.area ?? [[o.x, o.y]]) coverRect(x, y, x + 1, y + 1);
    for (const n of map.npcs ?? []) coverRect(n.x, n.y, n.x + 1, n.y + 1);
    // ---------- công trình đặt tay ----------
    const ctx = { B, group, anim, cover: coverRect, lam, rnd, pick, style };
    for (const [kind, ...args] of layout.items ?? []) {
        const f = BUILD[kind];
        if (!f) { console.warn('[world3d] không có kiểu', kind); continue; }
        f(ctx, ...args);
    }

    // ---------- mặt đất (thân đất nâu + lớp mặt) ----------
    const W = cols + 2 * M, H = rows + 2 * M;
    const box = new THREE.BoxGeometry(1, 1, 1);
    const body = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: 0xffffff }), W * H);
    const top = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: 0xffffff }), W * H);
    body.receiveShadow = top.receiveShadow = true; body.castShadow = true;
    const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), col = new THREE.Color();
    const tint = style.ground ?? {};
    let k = 0;
    const tileType = [];
    for (let z = -M; z < rows + M; z++) for (let x = -M; x < cols + M; x++) {
        let t = T(x, z);
        if (!inside(x, z)) {
            const d = Math.max(x < 0 ? -x : x - cols + 1, z < 0 ? -z : z - rows + 1);
            if (t === 'b' || t === 's') t = 'g';
            if (t !== 'w' && t !== 'p' && d > 2 && rnd() < Math.min(0.85, d * 0.12)) t = 't';
        }
        tileType.push(t);
        const y = t === 'w' ? -0.9 : t === 'p' ? -0.03 : t === 's' ? 0.0 : 0;
        m4.compose(v1.set(x + 0.5, (y - 0.14 - 3) / 2, z + 0.5), q0, v2.set(1, y - 0.14 + 3, 1)); body.setMatrixAt(k, m4);
        body.setColorAt(k, col.setHSL(0.07, 0.36, 0.28 + rnd() * 0.05));
        m4.compose(v1.set(x + 0.5, y - 0.07, z + 0.5), q0, v2.set(1, 0.14, 1)); top.setMatrixAt(k, m4);
        const [h, s, l] = tint[t] ?? GROUND[t] ?? GROUND.g;
        const n = (Math.sin(x * 0.31 + z * 0.12) * Math.cos(z * 0.27 - x * 0.08) + Math.sin(x * 0.9) * Math.sin(z * 0.8) * 0.4) * 0.03;
        top.setColorAt(k, col.setHSL(h + n * 0.5, s, l + n + rnd() * 0.025));
        k++;
    }
    group.add(body, top);
    top.userData.ground = true;

    // ---------- nước ----------
    let water = null;
    if (tileType.includes('w')) {
        water = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ color: style.water ?? 0x4f9ab0, transparent: true, opacity: 0.84, roughness: 0.1, metalness: 0.05, normalMap: waterNormals(), normalScale: new THREE.Vector2(0.55, 0.55) }));
        water.rotation.x = -Math.PI / 2; water.position.set(cols / 2, -0.32, rows / 2); water.receiveShadow = true;
        group.add(water);
        anim.push((t) => water.material.normalMap.offset.set(t * 0.012, t * 0.02));
    }

    // ---------- cây, cỏ, hoa tự rải ----------
    const trees = style.trees ?? ['nature/tree_oak', 'nature/tree_default', 'nature/tree_detailed', 'nature/tree_fat'];
    const edgeTrees = style.edgeTrees ?? trees;
    const treeScale = style.treeScale ?? [2.1, 2.9];
    const flowers = ['nature/flower_redA', 'nature/flower_yellowA', 'nature/flower_purpleA', 'nature/flower_redB', 'nature/flower_yellowB'];
    const wheatAt = [];
    k = 0;
    for (let z = -M; z < rows + M; z++) for (let x = -M; x < cols + M; x++, k++) {
        let t = tileType[k];
        const ins = inside(x, z), cx = x + 0.5, cz = z + 0.5;
        if (t === 't' && (style.noTrees ?? []).some(([a0, b0, a1, b1]) => x >= a0 && x < a1 && z >= b0 && z < b1)) t = 'b';   // trong phố: bụi thay cây
        if (ins && cover[x + z * cols]) continue;
        if (t === 't') {
            const far = !ins;
            if (far && rnd() < 0.35) continue;
            B.put(pick(far ? edgeTrees : trees), cx + (rnd() - 0.5) * 0.5, 0, cz + (rnd() - 0.5) * 0.5, rnd() * 6, treeScale[0] + rnd() * (treeScale[1] - treeScale[0]));
            if (rnd() < 0.3) B.put(rnd() < 0.5 ? 'nature/plant_bushLarge' : 'nature/grass_leafsLarge', cx + (rnd() - 0.5), 0, cz + (rnd() - 0.5), rnd() * 6, 1.8);
        } else if (t === 'b') {
            B.put(pick(['nature/plant_bushLarge', 'nature/plant_bushDetailed', 'nature/rock_smallC']), cx, 0, cz, rnd() * 6, 2.2 + rnd() * 0.6);
        } else if (t === 'f') {
            for (let j = 0; j < 4; j++) wheatAt.push([cx + (rnd() - 0.5) * 0.8, cz + (rnd() - 0.5) * 0.8, rnd() * 6, 0.9 + rnd() * 0.35]);
        } else if ((t === 'g' || t === 'd') && ins) {   // cỏ / hoa chỉ trong bản đồ (ngoài viền đã mờ sương, bỏ cho nhẹ)
            const n = t === 'd' ? 2 : 2;
            for (let j = 0; j < n; j++) {
                const r = rnd();
                if (r > 0.75) continue;
                const name = t === 'd' ? (r < 0.4 ? 'nature/grass_leafs' : r < 0.6 ? 'nature/grass_large' : 'nature/plant_flatTall')
                    : r < 0.45 ? (rnd() < 0.5 ? 'nature/grass' : 'nature/grass_large') : r < 0.6 ? 'nature/grass_leafs' : r < 0.7 ? pick(flowers) : 'nature/plant_bushSmall';
                B.put(name, cx + (rnd() - 0.5) * 0.9, 0, cz + (rnd() - 0.5) * 0.9, rnd() * 6, 1.3 + rnd() * 0.8);
            }
        } else if (t === 'p' && rnd() < 0.08) {
            B.put('nature/stone_smallA', cx + (rnd() - 0.5) * 0.8, -0.03, cz + (rnd() - 0.5) * 0.8, rnd() * 6, 1 + rnd());
        } else if (t === 'w' && rnd() < (style.lilies ?? 0.04)) {
            B.put(rnd() < 0.5 ? 'nature/lily_large' : 'nature/lily_small', cx, -0.31, cz, rnd() * 6, 1.8);
        }
        // đá viền bờ nước
        if ((t === 'g' || t === 'd') && ins && rnd() < 0.35 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => T(x + dx, z + dz) === 'w'))
            B.put(rnd() < 0.5 ? 'nature/rock_smallA' : 'nature/rock_smallFlatA', cx + (rnd() - 0.5) * 0.5, 0, cz + (rnd() - 0.5) * 0.5, rnd() * 6, 1.5 + rnd());
    }

    if (wheatAt.length) group.add(wheatField(wheatAt));
    await loadModels(B.keys());
    B.flush(group);
    return { group, water, anim, top };
}

/** Ruộng lúa vàng: mỗi khóm = vài cọng (thân + bông) gộp 1 hình, rải bằng InstancedMesh, lay theo gió */
let WHEAT = null;
function wheatField(list) {
    if (!WHEAT) {
        const parts = [];
        for (let i = 0; i < 6; i++) {
            const a = i / 6 * Math.PI * 2, r = 0.09 + (i % 2) * 0.06, h = 0.62 + (i % 3) * 0.08;
            const stem = new THREE.CylinderGeometry(0.018, 0.026, h, 3); stem.translate(Math.cos(a) * r, h / 2, Math.sin(a) * r);
            const head = new THREE.ConeGeometry(0.065, 0.26, 4); head.rotateX(Math.PI); head.translate(Math.cos(a) * r, h + 0.06, Math.sin(a) * r);
            parts.push(stem, head);
        }
        const geo = mergeGeometries(parts.map(g => g.toNonIndexed()));
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true });
        addSway(mat, 0.09);
        WHEAT = { geo, mat };
    }
    const im = new THREE.InstancedMesh(WHEAT.geo, WHEAT.mat, list.length), m = new THREE.Matrix4(), c = new THREE.Color();
    list.forEach(([x, z, r, s], k) => {
        im.setMatrixAt(k, m.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(Y, r), new THREE.Vector3(s, s, s)));
        im.setColorAt(k, c.setHSL(0.115 + rnd() * 0.025, 0.85, 0.5 + rnd() * 0.08));
    });
    im.castShadow = im.receiveShadow = true;
    return im;
}

function waterNormals() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), img = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        const a = Math.sin((x + Math.sin(y * 0.098) * 12) * 0.098) * 0.5 + Math.sin((y + x * 0.3) * 0.147) * 0.5;
        const b = Math.cos((y + Math.sin(x * 0.0736) * 10) * 0.123) * 0.5 + Math.cos((x - y * 0.2) * 0.0736) * 0.5;
        const k = (y * 256 + x) * 4; img.data[k] = 128 + a * 40; img.data[k + 1] = 128 + b * 40; img.data[k + 2] = 255; img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 8); return t;
}

// ============================================================
// Các kiểu công trình (gọi từ layouts.js). Toạ độ theo ô: x0..x1 (trái->phải), z0..z1 (trên->dưới = xa->gần máy quay)
// ============================================================
const mesh = (ctx, geo, mat, x, y, z, rotY = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = rotY;
    m.castShadow = m.receiveShadow = true; ctx.group.add(m); return m;
};
const along = (a, b, step, f) => {   // rải đều dọc đoạn a->b
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), n = Math.max(1, Math.round(L / step));
    for (let i = 0; i <= n; i++) f(a[0] + dx * i / n, a[1] + dz * i / n, Math.atan2(-dz, dx), L / n);
};

export const BUILD = {
    /** Nhà lắp từ mảnh bộ thị trấn: khung x0..x1 × z0..z1, cửa ở mặt trước (phía z1) tại cột doorX */
    house(ctx, { x0, z0, x1, z1, door, wall = 'wood', roof = 'red', h = 2.0, chimney = true, sign = null }) {
        const { B } = ctx;
        const w = x1 - x0, d = z1 - z0, n = Math.max(1, Math.round(w / 1.6)), sw = w / n, cz = (z0 + z1) / 2;
        const W = wall === 'stone' ? 'town/wall' : wall === 'plaster' ? 'town/wall' : 'town/wall-wood';
        const DOOR = wall === 'wood' ? 'town/wall-wood-door' : 'town/wall-door';
        const WIN = wall === 'wood' ? 'town/wall-wood-window-shutters' : 'town/wall-window-shutters';
        const R = '@' + roof;
        const dk = door == null ? -1 : Math.max(0, Math.min(n - 1, Math.floor((door - x0) / sw)));
        for (let k = 0; k < n; k++) {
            const x = x0 + sw * (k + 0.5);
            B.put(k === dk ? DOOR : WIN, x, 0, cz, -Math.PI / 2, d, h, sw);
            B.put(k % 2 ? WIN : W, x, 0, cz, Math.PI / 2, d, h, sw);
        }
        // mái: nóc chạy theo chiều sâu (z) -> đầu hồi tam giác quay ra phía trước như tranh gốc
        const nz = Math.max(1, Math.round(d / 1.6)), sl = d / nz, rh = Math.min(2.4, w * 0.42);
        for (let j = 0; j < nz; j++) {
            const z = z0 + sl * (j + 0.5);
            const rk = nz === 1 ? 'town/roof-high-gable' : j === 0 ? 'town/roof-high-gable-end' : j === nz - 1 ? 'town/roof-high-gable-end' : 'town/roof-high-gable';
            B.put(rk + R, (x0 + x1) / 2, h, z, nz > 1 && j === nz - 1 ? Math.PI / 2 : -Math.PI / 2, sl, rh, w);
        }
        if (chimney) B.put('town/chimney', x1 - w * 0.22, h + rh * 0.25, z0 + d * 0.3, 0, 1.6, 1.5, 1.6);
        B.put(WIN, x0 + sw * (n - 0.5), 0, cz, 0, sw, h, d);
        B.put(W, x0 + sw * 0.5, 0, cz, Math.PI, sw, h, d);

        if (sign) BUILD.model(ctx, 'survival/signpost-single', sign[0], sign[1], { s: 3 });
        ctx.cover(x0, z0, x1, z1);
    },
    /** Dọn vùng: không tự rải cây / bụi / cỏ trong khung này */
    clear(ctx, x0, z0, x1, z1) { ctx.cover(x0, z0, x1, z1); },
    /** Một mô hình bất kỳ */
    model(ctx, key, x, z, { s = 1, r = 0, y = 0, sy = s, sz = s, cover = null } = {}) {
        ctx.B.put(key, x, y, z, r, s, sy, sz);
        ctx.cover(...(cover ?? [x - 0.5, z - 0.5, x + 0.5, z + 0.5]));
    },
    /** Hàng rào dọc đoạn thẳng */
    fence(ctx, a, b, key = 'nature/fence_simple', s = 1.4) {
        along(a, b, s, (x, z, rot, step) => ctx.B.put(key, x, 0, z, rot, step * 1.02, s, s));
    },
    /** Hàng rào cọc nhọn (trại lính) */
    palisade(ctx, a, b) {
        along(a, b, 0.5, (x, z, rot) => ctx.B.put('survival/fence-fortified', x, 0, z, rot, 2.1, 3.2, 2.1));
    },
    /** Sân lát đá tròn (quảng trường) */
    plaza(ctx, x, z, r, color = 0xffffff) {
        const tex = brickTexture();
        const m = mesh(ctx, new THREE.CylinderGeometry(r, r, 0.1, 48), [lam(0x8a877e), new THREE.MeshStandardMaterial({ map: tex, color, roughness: 0.95 }), lam(0x8a877e)], x, 0.02, z);
        m.castShadow = false;
        ctx.cover(x - r * 0.75, z - r * 0.75, x + r * 0.75, z + r * 0.75);
    },
    /** Giếng đá có mái gỗ */
    well(ctx, x, z) {
        mesh(ctx, new THREE.CylinderGeometry(0.95, 1.05, 0.8, 12), lam(0x9a958a), x, 0.4, z);
        mesh(ctx, new THREE.CylinderGeometry(0.75, 0.75, 0.06, 12), lam(0x3f7fa8, { flatShading: false, roughness: 0.2 }), x, 0.72, z);
        [-0.85, 0.85].forEach(dx => mesh(ctx, new THREE.BoxGeometry(0.14, 1.9, 0.14), lam(0x5a3a1e), x + dx, 0.95, z));
        const roof = mesh(ctx, new THREE.CylinderGeometry(0.01, 1.35, 0.7, 4, 1), lam(0x8a4a2a), x, 2.2, z, Math.PI / 4); roof.scale.set(1.2, 1, 0.8);
        mesh(ctx, new THREE.CylinderGeometry(0.06, 0.06, 1.7, 6), lam(0x6a4526), x, 1.55, z).rotation.z = Math.PI / 2;
        ctx.cover(x - 1.2, z - 1.2, x + 1.2, z + 1.2);
    },
    /** Bảng thông báo / bảng ải */
    board(ctx, x, z, s = 1) {
        [-0.75, 0.75].forEach(dx => mesh(ctx, new THREE.BoxGeometry(0.14, 1.5 * s, 0.14), lam(0x5a3a1e), x + dx * s, 0.75 * s, z));
        mesh(ctx, new THREE.BoxGeometry(1.8 * s, 1.0 * s, 0.12), lam(0x8a5a2e), x, 1.15 * s, z);
        mesh(ctx, new THREE.BoxGeometry(2.0 * s, 0.12, 0.3), lam(0x6e4522), x, 1.72 * s, z);
        [[-0.45, 1.3, 0xf3e6c8], [0.35, 1.2, 0xf6efd8], [-0.05, 0.98, 0xeadcb8]].forEach(([dx, y, c]) => mesh(ctx, new THREE.BoxGeometry(0.42 * s, 0.32 * s, 0.02), lam(c), x + dx * s, y * s, z + 0.08));
        ctx.cover(x - 1, z - 0.5, x + 1, z + 0.5);
    },
    /** Đống rơm (vòm thấp) */
    haystack(ctx, x, z, r = 0.8) {
        const m = mesh(ctx, new THREE.IcosahedronGeometry(r, 1), lam(0xe0b440), x, r * 0.35, z, ctx.rnd() * 6);
        m.scale.set(1, 0.85, 1);
        ctx.cover(x - r, z - r, x + r, z + r);
    },
    /** Cối xay gió: thân gỗ + mái nhọn + cánh quạt quay */
    windmill(ctx, x, z) {
        mesh(ctx, new THREE.CylinderGeometry(1.0, 1.45, 3.4, 8), lam(0xa8743f), x, 1.7, z);
        mesh(ctx, new THREE.ConeGeometry(1.25, 1.3, 8), lam(0x7d5230), x, 4.05, z);
        mesh(ctx, new THREE.BoxGeometry(0.8, 1.1, 0.1), lam(0x3a2414), x, 0.55, z + 1.38);
        const hub = new THREE.Group(); hub.position.set(x, 3.3, z + 1.25); ctx.group.add(hub);
        for (let i = 0; i < 4; i++) {
            const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; hub.add(arm);
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.6, 0.06), lam(0xe8dcc0)); blade.position.set(0.2, 1.5, 0); blade.castShadow = true; arm.add(blade);
            const spar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.9, 0.1), lam(0x7d5230)); spar.position.set(0, 1.45, 0.04); spar.castShadow = true; arm.add(spar);
        }
        ctx.anim.push((t) => { hub.rotation.z = -t * 0.8; });
        ctx.cover(x - 1.5, z - 1.5, x + 1.5, z + 1.5);
    },
    /** Khối núi đá (mỏ): chồng các khối vách đá */
    cliff(ctx, x0, z0, x1, z1, h = 2) {
        for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
            const hh = h + (ctx.rnd() - 0.5) * 0.6;
            ctx.B.put('nature/cliff_block_rock', x + 0.5, 0, z + 0.5, Math.floor(ctx.rnd() * 4) * Math.PI / 2, 1, hh, 1);
        }
        ctx.cover(x0, z0, x1, z1);
    },
    /** Cửa hầm mỏ: khung gỗ + lòng tối */
    mineEntrance(ctx, x, z) {
        mesh(ctx, new THREE.BoxGeometry(1.8, 1.9, 0.6), lam(0x0d0a08), x, 0.95, z);
        [-1.0, 1.0].forEach(dx => mesh(ctx, new THREE.BoxGeometry(0.28, 2.2, 0.35), lam(0x6a4526), x + dx, 1.1, z + 0.2));
        mesh(ctx, new THREE.BoxGeometry(2.6, 0.3, 0.4), lam(0x7d5230), x, 2.25, z + 0.2);
    },
    /** Đường ray (2 thanh sắt + tà vẹt) theo các điểm */
    rails(ctx, pts) {
        for (let i = 0; i < pts.length - 1; i++) along(pts[i], pts[i + 1], 0.45, (x, z, rot) => {
            mesh(ctx, new THREE.BoxGeometry(0.16, 0.06, 1.0), lam(0x6a4526), x, 0.03, z, rot);
            [-0.32, 0.32].forEach(o => mesh(ctx, new THREE.BoxGeometry(0.5, 0.06, 0.06), lam(0x77736c), x + Math.sin(rot) * o, 0.08, z + Math.cos(rot) * o, rot));
        });
    },
    /** Cầu đá vòm qua sông: x0..x1, z0..z1 (lòng cầu) */
    stoneBridge(ctx, x0, z0, x1, z1) {
        const L = x1 - x0, W = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        mesh(ctx, new THREE.BoxGeometry(L + 0.6, 0.35, W), [lam(0xb5a584), lam(0xb5a584), new THREE.MeshStandardMaterial({ map: brickTexture(), color: 0xf0e2c4, roughness: 0.95 }), lam(0xb5a584), lam(0xb5a584), lam(0xb5a584)], cx, -0.155, cz);   // mặt cầu ngang mặt đất (nhân vật đi ở y = 0)
        [z0, z1].forEach(zz => {
            mesh(ctx, new THREE.BoxGeometry(L + 0.6, 0.55, 0.3), lam(0xb5a584), cx, 0.27, zz);
            [x0 - 0.15, x1 + 0.15].forEach(xx => mesh(ctx, new THREE.BoxGeometry(0.5, 0.9, 0.5), lam(0xa89878), xx, 0.45, zz));
        });
        for (const ax of [x0 + L * 0.3, x0 + L * 0.7]) {   // trụ cầu
            mesh(ctx, new THREE.BoxGeometry(0.9, 1.2, W), lam(0x9a8a6c), ax, -0.75, cz);
        }
    },
    /** Lều vải */
    tent(ctx, x, z, s = 4, r = 0) { ctx.B.put('survival/tent-canvas', x, 0, z, r, s); ctx.cover(x - s * 0.3, z - s * 0.3, x + s * 0.3, z + s * 0.3); },
    /** Tháp canh gỗ */
    watchtower(ctx, x, z) {
        [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].forEach(([dx, dz]) => mesh(ctx, new THREE.BoxGeometry(0.2, 3.4, 0.2), lam(0x5e3e26), x + dx, 1.7, z + dz));
        mesh(ctx, new THREE.BoxGeometry(2.1, 0.18, 2.1), lam(0x7d5230), x, 3.4, z);
        mesh(ctx, new THREE.BoxGeometry(2.1, 0.7, 2.1), lam(0x8a5a2e), x, 3.85, z);
        mesh(ctx, new THREE.BoxGeometry(1.7, 0.5, 1.7), lam(0x241a10), x, 3.95, z + 0.06);
        mesh(ctx, new THREE.ConeGeometry(1.65, 1.1, 4), lam(0x7a5233), x, 4.85, z, Math.PI / 4);
        ctx.cover(x - 1, z - 1, x + 1, z + 1);
    },
    /** Thanh chắn đường sơn sọc */
    barrier(ctx, x, z0, z1) {
        mesh(ctx, new THREE.BoxGeometry(0.4, 1.1, 0.4), lam(0x6e7a86), x, 0.55, z0);
        mesh(ctx, new THREE.BoxGeometry(0.4, 1.1, 0.4), lam(0x6e7a86), x, 0.55, z1);
        const L = z1 - z0, n = 8;
        for (let i = 0; i < n; i++) mesh(ctx, new THREE.BoxGeometry(0.18, 0.18, L / n), lam(i % 2 ? 0xd8d2c8 : 0xc0392b), x, 1.0, z0 + L * (i + 0.5) / n);
    },
    /** Cờ hiệu (cột + lá cờ đỏ) */
    banner(ctx, x, z, color = 0xc0392b) {
        mesh(ctx, new THREE.BoxGeometry(0.1, 1.9, 0.1), lam(0x5e3e26), x, 0.95, z);
        mesh(ctx, new THREE.BoxGeometry(0.75, 0.9, 0.05), lam(color), x, 1.35, z + 0.08);
        mesh(ctx, new THREE.BoxGeometry(0.3, 0.3, 0.06), lam(0xf1c40f), x, 1.4, z + 0.12);
    },
    /** Luống hoa có viền gỗ */
    flowerbed(ctx, x0, z0, x1, z1) {
        const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        mesh(ctx, new THREE.BoxGeometry(x1 - x0, 0.32, z1 - z0), lam(0x6e4522), cx, 0.16, cz);
        mesh(ctx, new THREE.BoxGeometry(x1 - x0 - 0.16, 0.06, z1 - z0 - 0.16), lam(0x4a3220), cx, 0.32, cz);
        const fl = ['nature/flower_redA', 'nature/flower_yellowA', 'nature/flower_purpleA', 'nature/flower_redB', 'nature/flower_yellowB', 'nature/flower_purpleB'];
        for (let z = z0 + 0.25; z < z1 - 0.1; z += 0.4) for (let x = x0 + 0.25; x < x1 - 0.1; x += 0.4) ctx.B.put(ctx.pick(fl), x, 0.32, z, ctx.rnd() * 6, 1.6);
        ctx.cover(x0, z0, x1, z1);
    },
    /** Đe thợ rèn */
    anvil(ctx, x, z) { ctx.B.put('survival/workbench-anvil', x, 0, z, 0.4, 2.6); },
    /** Bù nhìn */
    scarecrow(ctx, x, z) {
        mesh(ctx, new THREE.BoxGeometry(0.12, 1.8, 0.12), lam(0x6a4526), x, 0.9, z);
        mesh(ctx, new THREE.BoxGeometry(1.2, 0.1, 0.1), lam(0x6a4526), x, 1.3, z);
        mesh(ctx, new THREE.BoxGeometry(0.6, 0.7, 0.3), lam(0x8a6a3a), x, 1.15, z);
        mesh(ctx, new THREE.SphereGeometry(0.25, 6, 5), lam(0xd8c08a), x, 1.75, z);
        mesh(ctx, new THREE.ConeGeometry(0.4, 0.35, 6), lam(0x5a4020), x, 2.0, z);
    },
    /** Nấm phát sáng xanh (Rừng Sương) */
    glowShroom(ctx, x, z, s = 1) {
        const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); ctx.group.add(g);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.32, 6), lam(0xdff4f2)); stem.position.y = 0.16;
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3fb6f0, emissive: 0x1a8fd8, emissiveIntensity: 0.55, roughness: 0.5 }));
        cap.position.y = 0.3; g.add(stem, cap);
        const light = new THREE.PointLight(0x5fd4ff, 0.9, 3.0, 2); light.position.y = 0.6; g.add(light);
        ctx.anim.push((t) => { light.intensity = 0.8 + Math.sin(t * 2 + x) * 0.3; });
    },
    /** Sương mù trôi (mảng mờ) */
    mist(ctx, x, z, r = 3) {
        const tex = mistTexture();
        for (let i = 0; i < 2; i++) {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.0, r * 1.3), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.14, depthWrite: false, color: 0xd8f6f0, fog: false }));
            m.rotation.x = -Math.PI / 2 + 0.35; m.position.set(x + (i - 1) * r * 0.5, 0.7 + i * 0.35, z + (i - 1) * 0.4); m.renderOrder = 5;
            ctx.group.add(m);
            const ph = ctx.rnd() * 6;
            ctx.anim.push((t) => { m.position.x = x + (i - 1) * r * 0.5 + Math.sin(t * 0.15 + ph) * 1.2; m.material.opacity = 0.12 + Math.sin(t * 0.3 + ph) * 0.04; });
        }
    },
    /** Đoạn tường thành trắng (lâu đài / kinh thành) */
    castleWall(ctx, a, b, h = 1.7) {
        const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
        const w = mesh(ctx, new THREE.BoxGeometry(L + 1.1, h, 1.1), lam(0xe9e5dc), (a[0] + b[0]) / 2, h / 2, (a[1] + b[1]) / 2, rot);
        w.receiveShadow = true;
        const n = Math.floor(L / 0.9);
        for (let i = 0; i <= n; i++) {   // lỗ châu mai hai bên mép
            const t = n ? i / n : 0.5, x = a[0] + dx * t, z = a[1] + dz * t;
            for (const o of [-0.42, 0.42]) mesh(ctx, new THREE.BoxGeometry(0.34, 0.32, 0.26), lam(0xf2efe8), x + Math.sin(rot) * o, h + 0.16, z + Math.cos(rot) * o, rot);
        }
        const minx = Math.min(a[0], b[0]), maxx = Math.max(a[0], b[0]), minz = Math.min(a[1], b[1]), maxz = Math.max(a[1], b[1]);
        ctx.cover(minx - 0.7, minz - 0.7, maxx + 0.7, maxz + 0.7);
    },
    /** Tháp tròn mái xanh nhọn */
    tower(ctx, x, z, { r = 1.1, h = 3.4, roof = 0x3f6fc6, wall = 0xe8e4dc } = {}) {
        mesh(ctx, new THREE.CylinderGeometry(r, r * 1.05, h, 14), lam(wall, { flatShading: false }), x, h / 2, z);
        mesh(ctx, new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.3, 14), lam(0xd8d2c6), x, h + 0.15, z);
        if (roof != null) mesh(ctx, new THREE.ConeGeometry(r * 1.2, r * 2.2, 14), lam(roof), x, h + 0.3 + r * 1.1, z);
        else for (let i = 0; i < 8; i++) {   // lỗ châu mai
            const a = i / 8 * Math.PI * 2;
            mesh(ctx, new THREE.BoxGeometry(0.32, 0.36, 0.32), lam(0xe0dbd0), x + Math.cos(a) * r * 0.98, h + 0.48, z + Math.sin(a) * r * 0.98, -a);
        }
        mesh(ctx, new THREE.BoxGeometry(0.3, 0.55, 0.05), lam(0x23324a), x, h * 0.62, z + r);
        ctx.cover(x - r, z - r, x + r, z + r);
    },
    /** Khối nhà lớn (cung điện / thư viện / nhà thờ): thân + mái */
    hall(ctx, { x0, z0, x1, z1, h = 3, wall = 0xe8e4dc, roof = 0x3f6fc6, roofH = 1.6, windows = 0x2b3a55, door = null, doorColor = 0x5a3a1e }) {
        const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
        mesh(ctx, new THREE.BoxGeometry(w, h, d), lam(wall), cx, h / 2, cz);
        const roofGeo = new THREE.CylinderGeometry(0.01, 0.5, 1, 4, 1); roofGeo.rotateY(Math.PI / 4);
        const rm = mesh(ctx, roofGeo, lam(roof), cx, h + roofH / 2, cz); rm.scale.set(w * 1.45, roofH, d * 1.45);
        const nw = Math.max(1, Math.floor(w / 1.3));
        for (let i = 0; i < nw; i++) {
            const wx = x0 + (i + 0.5) * w / nw;
            if (door != null && Math.abs(wx - door) < 0.8) continue;
            mesh(ctx, new THREE.BoxGeometry(0.42, 0.7, 0.05), lam(windows), wx, h * 0.58, z1 + 0.01);
        }
        if (door != null) mesh(ctx, new THREE.BoxGeometry(1.1, 1.6, 0.06), lam(doorColor), door, 0.8, z1 + 0.02);
        ctx.cover(x0, z0, x1, z1);
    },
    /** Mái vòm (thư viện) */
    dome(ctx, x, z, r = 1.6, y = 3, color = 0x9a6a4a) {
        mesh(ctx, new THREE.CylinderGeometry(r, r, 0.8, 16), lam(0xd8cdb6), x, y + 0.4, z);
        mesh(ctx, new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(color, { flatShading: false }), x, y + 0.8, z);
        mesh(ctx, new THREE.ConeGeometry(0.25, 0.7, 8), lam(color), x, y + 0.8 + r + 0.3, z);
    },
    /** Tháp nhọn nhà thờ */
    spire(ctx, x, z, { w = 1.4, h = 5, roofH = 2.6, wall = 0xb8b2a6, roof = 0x5f6670 } = {}) {
        mesh(ctx, new THREE.BoxGeometry(w, h, w), lam(wall), x, h / 2, z);
        mesh(ctx, new THREE.ConeGeometry(w * 0.78, roofH, 4), lam(roof), x, h + roofH / 2, z, Math.PI / 4);
        mesh(ctx, new THREE.BoxGeometry(0.4, 1.1, 0.05), lam(0x2b3a55), x, h * 0.7, z + w / 2 + 0.01);
    },
    /** Sạp chợ có mái vải màu */
    stall(ctx, x, z, color = 0xc0392b, r = 0) {
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; ctx.group.add(g);
        const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
        add(new THREE.BoxGeometry(1.6, 0.7, 0.9), lam(0x8a5a2e), 0, 0.35, 0.1);
        [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.55], [0.75, 0.55]].forEach(([dx, dz]) => add(new THREE.BoxGeometry(0.08, 1.7, 0.08), lam(0x5e3e26), dx, 0.85, dz));
        const roof = add(new THREE.BoxGeometry(1.9, 0.08, 1.3), lam(color), 0, 1.75, 0.15); roof.rotation.x = 0.25;
        const stripe = add(new THREE.BoxGeometry(1.92, 0.25, 0.04), lam(0xf3ead6), 0, 1.55, 0.8);
        stripe.visible = ctx.rnd() < 0.5;
        ['nature/crop_pumpkin', 'nature/pot_small'].forEach((k, i) => ctx.B.put(k, x + (i - 0.5) * 0.6, 0.72, z + 0.1, 0, 1.2));
        ctx.cover(x - 0.9, z - 0.6, x + 0.9, z + 0.7);
    },
    /** Đài phun nước (bộ thị trấn) */
    fountain(ctx, x, z, s = 1.3) {
        ctx.B.put('town/fountain-round', x, 0, z, 0, s);
        ctx.B.put('town/fountain-round-detail', x, 0, z, 0, s);
        ctx.B.put('town/fountain-center', x, 0, z, 0, s);
        ctx.cover(x - s, z - s, x + s, z + s);
    },
    /** Đèn đường */
    lamp(ctx, x, z) { ctx.B.put('town/lantern', x, 0, z, 0, 1.25); },
    /** Hầm mộ / phiến đá */
    crypt(ctx, x, z, s = 2.4) { ctx.B.put('graveyard/crypt', x, 0, z, 0, s); },
};

let BRICK = null;
function brickTexture() {
    if (BRICK) return BRICK;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#9d9a92'; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
        const ox = (y % 2) * 16, l = 178 + Math.floor(Math.random() * 30);
        g.fillStyle = `rgb(${l},${l - 2},${l - 8})`; g.fillRect(x * 32 + ox + 1, y * 16 + 1, 30, 14);
        g.fillStyle = `rgb(${l},${l - 2},${l - 8})`; if (ox) g.fillRect(-16 + 1, y * 16 + 1, 14, 14);
    }
    BRICK = new THREE.CanvasTexture(c); BRICK.wrapS = BRICK.wrapT = THREE.RepeatWrapping; BRICK.repeat.set(6, 6); BRICK.colorSpace = THREE.SRGBColorSpace;
    return BRICK;
}
let MIST = null;
function mistTexture() {
    if (MIST) return MIST;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    for (let i = 0; i < 9; i++) {
        const x = 30 + Math.random() * 68, y = 30 + Math.random() * 68, r = 22 + Math.random() * 26;
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    }
    MIST = new THREE.CanvasTexture(c);
    return MIST;
}
