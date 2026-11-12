// ============================================================
// Bản đồ 3D — dựng cảnh 1 bản đồ: mặt đất theo ô (src/world/terrain3d.js) + công trình đặt tay (layouts.js) + cây / cỏ tự rải
//   Toạ độ: ô (x, y) của lưới 2D = vùng [x, x+1] × [y, y+1] trên mặt phẳng XZ (y lưới = z 3D). 1 ô = 1 đơn vị.
//   Mọi mô hình gom theo loại thành InstancedMesh -> cả bản đồ chỉ vài chục lệnh vẽ.
// ============================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { proto, loadModels, addSway, patchMaterial, uHeroPos } from './assets.js';
import { PAINT, paintTrees, paintGrass, paintMapClouds, paintWater, paintSeeds, treeStyleOf } from './paint.js';
import { EXTRA_BUILD, buildJumpFeatures, buildRegionLife } from './life.js';

export const isOldDetail = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('mapDetail') === 'old';

const M = 10;   // viền trang trí ngoài mép bản đồ (ô)
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const Y = new THREE.Vector3(0, 1, 0);

export const GROUND = {   // màu mặt đất theo loại ô
    g: [0.24, 0.48, 0.33], p: [0.08, 0.36, 0.47], s: [0.1, 0.06, 0.6], w: [0.11, 0.3, 0.32], f: [0.12, 0.5, 0.42], d: [0.36, 0.32, 0.26],
    t: [0.25, 0.45, 0.27], b: [0.24, 0.48, 0.33],
};

// ---------- ĐÈN ĐÊM: quầng sáng ấm quanh đèn lồng, chỉ hiện khi trời tối (view.js gọi setNight mỗi khung hình) ----------
let nightMat = null;
function nightGlowMat() {
    if (nightMat) return nightMat;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.3, 'rgba(255,255,255,0.5)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    nightMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color: 0xffb060, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    nightMat.color.setRGB(2.4, 1.1, 0.25);   // sang manh (HDR) de van am sau khi ca canh bi nhuom lam ban dem
    return nightMat;
}
/** k: 0 (ban ngày) .. 1 (đêm) */
export function setNight(k) { if (nightMat) { nightMat.opacity = Math.min(1, k * 1.5); nightMat.visible = k > 0.02; } }

/** Gom đặt mô hình -> InstancedMesh */
class Batch {
    constructor() { this.list = new Map(); this.trees = []; this.lights = []; }
    put(key, x, y, z, rot = 0, sx = 1, sy = sx, sz = sx, near = true) {
        if (PAINT && (key === 'town/lantern' || key === 'graveyard/lightpost-single')) this.lights.push([x, y + 1.25 * sy, z, sx]);
        if (PAINT && key === 'custom/town_lamp_post') this.lights.push([x, y + 2.6 * sy, z, sx * 1.6]);
        if (PAINT && key === 'custom/town_lamp_wall') this.lights.push([x, y + 0.4 * sy, z, sx * 1.2]);
        if (PAINT && /^nature\/tree_/.test(key)) { this.trees.push([x, z, sx * 0.95, near, ...treeStyleOf(key)]); return; }   // tranh vẽ: chỉ MỘT kiểu cây
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(Y, rot), new THREE.Vector3(sx, sy, sz));
        if (!this.list.has(key)) this.list.set(key, []);
        this.list.get(key).push(m);
    }
    keys() { return [...this.list.keys()]; }
    flush(group) {
        if (this.trees.length) paintTrees(group, this.trees);
        for (const [x, y, z, sc] of this.lights) { const sp = new THREE.Sprite(nightGlowMat()); sp.position.set(x, y, z); sp.scale.setScalar(2.6 * sc); sp.renderOrder = 7; group.add(sp); }
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
    if (!MAT.has(k)) {
        const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9, metalness: 0, flatShading: true, ...opts });
        patchMaterial(m, { sway: 0, occlude: opts.occlude !== false, cloud: opts.cloud !== false, detail: !!PAINT && opts.detail !== false });
        MAT.set(k, m);
    }
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

    // Dữ liệu tính năng nhảy (heights, gaps, stones — có thể chưa có trong map)
    const H_AT = (x, z) => inside(x, z) ? (Number(map.heights?.[z]?.[x]) || 0) : 0;
    const gapSet = new Set((map.gaps ?? []).map(([x, y]) => `${x},${y}`));
    const stoneSet = new Set((map.stones ?? []).map(([x, y]) => `${x},${y}`));
    const isSpecialTile = (x, z) => inside(x, z) && (gapSet.has(`${x},${z}`) || stoneSet.has(`${x},${z}`) || H_AT(x, z) > 0);
    for (let z = 0; z < rows; z++) for (let x = 0; x < cols; x++) if (isSpecialTile(x, z)) coverRect(x, z, x + 1, z + 1);

    // ---------- công trình đặt tay ----------
    const oldMode = isOldDetail();
    const roofPerches = [], treeSpots = [];
    const ctx = { B, group, anim, cover: coverRect, lam, rnd, pick, style, oldMode, roofPerches };
    // Chốt an toàn: vật trang trí thêm (detailItems) mà rơi vào ô ĐI ĐƯỢC hoặc ô nhảy đặc biệt thì bỏ — không để nhân vật đi xuyên vật.
    //   (vật phẳng / bay trên cao thì không cần chặn)
    const FLAT = new Set(['dirtPatch', 'steppingStones', 'butterflies', 'fireflies', 'groundFog', 'smoke', 'chickens', 'clothesline']);
    const posOf = (it) => {
        if (it[0] === 'model') return [it[2], it[3]];
        if (Array.isArray(it[1])) return it[1];
        if (it[1] && typeof it[1] === 'object') return [it[1].x ?? it[1].x0, it[1].z ?? it[1].z0];
        return [it[1], it[2]];
    };
    const walkable = (it) => { const [x, z] = posOf(it); return map.grid?.[Math.floor(z)]?.[Math.floor(x)] === '.'; };
    const onSpecial = (it) => { const [x, z] = posOf(it); return isSpecialTile(Math.floor(x), Math.floor(z)); };
    const details = oldMode ? [] : (layout.detailItems ?? []).filter(it => !onSpecial(it) && (FLAT.has(it[0]) || !walkable(it)));
    const itemsList = [...(layout.items ?? []), ...details];
    for (const [kind, ...args] of itemsList) {
        const f = BUILD[kind];
        if (!f) { console.warn('[world3d] không có kiểu', kind); continue; }
        f(ctx, ...args);
    }

    // ---------- mặt đất (thân đất nâu + lớp mặt) ----------
    const W = cols + 2 * M, H = rows + 2 * M;
    const box = new THREE.BoxGeometry(1, 1, 1);
    const bodyMat = patchMaterial(new THREE.MeshLambertMaterial({ color: 0xffffff }), { sway: 0, occlude: false, cloud: true });
    const topMat = patchMaterial(new THREE.MeshLambertMaterial({ color: 0xffffff }), { sway: 0, occlude: false, cloud: true, detail: !!PAINT });
    const body = new THREE.InstancedMesh(box, bodyMat, W * H);
    const top = new THREE.InstancedMesh(box, topMat, W * H);
    body.receiveShadow = top.receiveShadow = true; body.castShadow = true;
    const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), col = new THREE.Color();
    const tint = style.ground ?? {};
    let k = 0;
    const tileType = [];
    for (let z = -M; z < rows + M; z++) for (let x = -M; x < cols + M; x++) {
        let t = T(x, z);
        const ins = inside(x, z);
        if (!ins) {
            const d = Math.max(x < 0 ? -x : x - cols + 1, z < 0 ? -z : z - rows + 1);
            if (t === 'b' || t === 's') t = 'g';
            if (t !== 'w' && t !== 'p' && d > 2 && rnd() < Math.min(0.85, d * 0.12)) t = 't';
        }
        tileType.push(t);
        const keyXZ = `${x},${z}`;
        const isGap = ins && gapSet.has(keyXZ);
        const isStone = ins && stoneSet.has(keyXZ);
        const elev = H_AT(x, z) * 0.45;
        const y = (t === 'w' || isStone) ? -0.9 : isGap ? -0.78 : (t === 'p' ? -0.03 : 0) + elev;
        m4.compose(v1.set(x + 0.5, (y - 0.14 - 3) / 2, z + 0.5), q0, v2.set(1, y - 0.14 + 3, 1)); body.setMatrixAt(k, m4);
        body.setColorAt(k, col.setHSL(0.07, 0.36, 0.28 + rnd() * 0.05));
        const bump = !oldMode && !isGap && !isStone && (t === 'g' || t === 'd' || t === 't' || t === 'b') ? (Math.sin(x * 0.7 + z * 0.5) * 0.015) : 0;
        m4.compose(v1.set(x + 0.5, y - 0.07 + bump * 0.5, z + 0.5), q0, v2.set(1, 0.14 + bump, 1)); top.setMatrixAt(k, m4);
        let [h, s, l] = tint[t] ?? GROUND[t] ?? GROUND.g;
        if (PAINT && (t === 'g' || t === 't' || t === 'b')) {   // tranh vẽ: đất cỏ cùng bảng màu với ngọn cỏ (mảng đậm / sáng lớn)
            const tn = 0.5 + 0.5 * Math.sin(x * 0.31 + z * 0.12) * Math.cos(z * 0.27 - x * 0.08);
            h = 0.275 - tn * 0.05; s = 0.5; l = 0.25 + tn * 0.1;
        }
        const n = (Math.sin(x * 0.31 + z * 0.12) * Math.cos(z * 0.27 - x * 0.08) + Math.sin(x * 0.9) * Math.sin(z * 0.8) * 0.4) * 0.035;
        top.setColorAt(k, col.setHSL(h + n * 0.5, s, l + n + rnd() * 0.025));
        k++;
    }
    group.add(body, top);
    top.userData.ground = true;

    // ---------- bậc nhảy (heights), khe suối / hố (gaps), phiến đá nổi (stones) ----------
    buildJumpFeatures(ctx, map, terrain, H_AT, gapSet, stoneSet);

    // ---------- mép đường mòn lởm chởm & đá lát lẫn cỏ cho mọi vùng (khi !oldMode) ----------
    if (!oldMode) {
        const edgeStones = [];
        const grassPatches = [];
        for (let z = 0; z < rows; z++) for (let x = 0; x < cols; x++) {
            if (isSpecialTile(x, z)) continue;
            const t = T(x, z);
            if (t === 'p') {
                // mép đường mòn tiếp giáp cỏ -> thêm sỏi / vệt đất lởm chởm ở rìa
                for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nt = T(x + dx, z + dz);
                    if ((nt === 'g' || nt === 'b' || nt === 't') && rnd() < 0.55) {
                        edgeStones.push([x + 0.5 + dx * (0.42 + (rnd() - 0.5) * 0.14), z + 0.5 + dz * (0.42 + (rnd() - 0.5) * 0.14), rnd() * 6, 0.22 + rnd() * 0.18, 0.08]);
                    }
                }
                if (rnd() < 0.28) {
                    edgeStones.push([x + 0.2 + rnd() * 0.6, z + 0.2 + rnd() * 0.6, rnd() * 6, 0.18 + rnd() * 0.16, 0.05]);
                }
            } else if (t === 's' && rnd() < 0.22) {
                grassPatches.push([x + 0.2 + rnd() * 0.6, z + 0.2 + rnd() * 0.6, rnd() * 6, 0.25 + rnd() * 0.2]);
            }
        }
        if (edgeStones.length) {
            const sg = new THREE.CylinderGeometry(0.5, 0.6, 0.04, 6);
            const sm = lam(0x9a8e7a, { occlude: false });
            const sim = new THREE.InstancedMesh(sg, sm, edgeStones.length);
            sim.receiveShadow = true;
            edgeStones.forEach(([px, pz, r, sx, sy], idx) => {
                m4.compose(v1.set(px, -0.008, pz), new THREE.Quaternion().setFromAxisAngle(Y, r), v2.set(sx, 1, sx * (0.75 + sy * 2)));
                sim.setMatrixAt(idx, m4);
                sim.setColorAt(idx, col.setHSL(0.09 + (rnd() - 0.5) * 0.03, 0.22, 0.52 + (rnd() - 0.5) * 0.12));
            });
            group.add(sim);
        }
        if (grassPatches.length) {
            const gg = new THREE.CircleGeometry(0.5, 7); gg.rotateX(-Math.PI / 2);
            const gm = lam(0x6c9c38, { occlude: false });
            const gim = new THREE.InstancedMesh(gg, gm, grassPatches.length);
            gim.receiveShadow = true;
            grassPatches.forEach(([px, pz, r, s], idx) => {
                m4.compose(v1.set(px, 0.006, pz), new THREE.Quaternion().setFromAxisAngle(Y, r), v2.set(s, 1, s * 0.8));
                gim.setMatrixAt(idx, m4);
            });
            group.add(gim);
        }
    }

    // ---------- nước ----------
    let water = null;
    if (tileType.includes('w')) {
        water = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ color: style.water ?? 0x4f9ab0, transparent: true, opacity: 0.84, roughness: 0.1, metalness: 0.05, normalMap: waterNormals(), normalScale: new THREE.Vector2(0.55, 0.55) }));
        if (PAINT) {   // nước kiểu tranh vẽ: mặt nạ ô nước (làm mượt) -> biết chỗ nào sát bờ để vẽ bọt, chỗ nào sâu
            const mk = new Uint8Array(W * H); tileType.forEach((tt, i) => { mk[i] = tt === 'w' ? 255 : 0; });
            water.material = paintWater(W, H, mk, -M, -M, style.water ?? 0x4f9ab0);
        }
        water.rotation.x = -Math.PI / 2; water.position.set(cols / 2, -0.32, rows / 2); water.receiveShadow = true;
        group.add(water);
        if (!PAINT) anim.push((t) => water.material.normalMap.offset.set(t * 0.012, t * 0.02));
    }

    // ---------- cây, cỏ, hoa tự rải ----------
    const trees = style.trees ?? ['nature/tree_oak', 'nature/tree_default', 'nature/tree_detailed', 'nature/tree_fat'];
    const edgeTrees = style.edgeTrees ?? trees;
    const treeScale = style.treeScale ?? [2.1, 2.9];
    const flowers = ['nature/flower_redA', 'nature/flower_yellowA', 'nature/flower_purpleA', 'nature/flower_redB', 'nature/flower_yellowB'];
    const wheatAt = [], paintTiles = [];
    k = 0;
    for (let z = -M; z < rows + M; z++) for (let x = -M; x < cols + M; x++, k++) {
        let t = tileType[k];
        const ins = inside(x, z), cx = x + 0.5, cz = z + 0.5;
        if (t === 't' && (style.noTrees ?? []).some(([a0, b0, a1, b1]) => x >= a0 && x < a1 && z >= b0 && z < b1)) t = 'b';   // trong phố: bụi thay cây
        if (PAINT && (t === 'g' || t === 't' || t === 'b') && x >= -4 && x < cols + 4 && z >= -4 && z < rows + 4 && !isSpecialTile(x, z))
            paintTiles.push([x, z, 0, 0.5 + 0.5 * Math.sin(x * 0.31 + z * 0.12) * Math.cos(z * 0.27 - x * 0.08)]);
        if (ins && cover[x + z * cols]) continue;
        if (t === 't') {
            const far = !ins;
            if (far && rnd() < 0.35) continue;
            const tx = cx + (rnd() - 0.5) * 0.5, tz = cz + (rnd() - 0.5) * 0.5, tsc = treeScale[0] + rnd() * (treeScale[1] - treeScale[0]);
            B.put(pick(far ? edgeTrees : trees), tx, 0, tz, rnd() * 6, tsc, tsc, tsc, x >= -3 && x < cols + 3 && z >= -3 && z < rows + 3);
            // tranh vẽ: lác đác vài cây TÁO mọc lẫn giữa rừng (trang trí)
            if (PAINT && ins && B.trees.length && B.trees[B.trees.length - 1][4] === 'round' && B.trees[B.trees.length - 1][5] === 'green' && (x * 7 + z * 13) % 9 === 0) { const tr = B.trees[B.trees.length - 1]; tr[4] = 'apple'; tr[5] = 'apple'; }
            if (x >= -2 && x < cols + 2 && z >= -2 && z < rows + 2) treeSpots.push([tx, tz, tsc]);
            if (rnd() < 0.3) B.put(rnd() < 0.5 ? 'nature/plant_bushLarge' : 'nature/grass_leafsLarge', cx + (rnd() - 0.5), 0, cz + (rnd() - 0.5), rnd() * 6, 1.8);
        } else if (t === 'b') {
            B.put(pick(['nature/plant_bushLarge', 'nature/plant_bushDetailed', 'nature/rock_smallC']), cx, 0, cz, rnd() * 6, 2.2 + rnd() * 0.6);
        } else if (t === 'f') {
            for (let j = 0; j < 4; j++) wheatAt.push([cx + (rnd() - 0.5) * 0.8, cz + (rnd() - 0.5) * 0.8, rnd() * 6, 0.9 + rnd() * 0.35]);
        } else if ((t === 'g' || t === 'd') && ins) {   // cỏ / hoa chỉ trong bản đồ (ngoài viền đã mờ sương, bỏ cho nhẹ)
            const n = !oldMode ? 3 : 2;
            const cluster = !oldMode ? Math.sin(x * 0.45 + z * 0.38) * Math.cos(z * 0.52 - x * 0.25) : 0;
            for (let j = 0; j < n; j++) {
                const r = rnd();
                if (r > (cluster > 0.2 ? 0.88 : 0.72)) continue;
                const name = t === 'd' ? (r < 0.4 ? 'nature/grass_leafs' : r < 0.6 ? 'nature/grass_large' : 'nature/plant_flatTall')
                    : r < 0.42 ? (rnd() < 0.5 ? 'nature/grass' : 'nature/grass_large') : r < 0.58 ? 'nature/grass_leafs' : r < (cluster > 0.15 ? 0.78 : 0.68) ? pick(flowers) : 'nature/plant_bushSmall';
                const sc = !oldMode ? 1.0 + rnd() * 1.25 : 1.3 + rnd() * 0.8;
                if (!oldMode && map.grid?.[z]?.[x] === '.' && /plant_bushSmall|plant_flatTall/.test(name)) continue;   // ô đi được: không đặt thứ trông như vật cản
                B.put(name, cx + (rnd() - 0.5) * 0.9, 0, cz + (rnd() - 0.5) * 0.9, rnd() * 6, sc, sc * (0.85 + rnd() * 0.35), sc);
            }
        } else if (t === 'p' && rnd() < (!oldMode ? 0.14 : 0.08)) {
            const stSc = 1 + rnd(), stX = cx + (rnd() - 0.5) * 0.8, stZ = cz + (rnd() - 0.5) * 0.8, stR = rnd() * 6;
            if (oldMode || (x * 5 + z * 3) % 4 === 0) B.put('nature/stone_smallA', stX, -0.05, stZ, stR, oldMode ? stSc : stSc * 0.55);   // (12/11) đường đi: ít đá hơn, nhỏ hơn để không tưởng là vật cản
        } else if (t === 'w' && rnd() < (style.lilies ?? 0.04)) {
            B.put(rnd() < 0.5 ? 'nature/lily_large' : 'nature/lily_small', cx, -0.31, cz, rnd() * 6, 1.8);
        }
        // đá viền bờ nước
        if ((t === 'g' || t === 'd') && ins && rnd() < 0.35 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => T(x + dx, z + dz) === 'w'))
            B.put(rnd() < 0.5 ? 'nature/rock_smallA' : 'nature/rock_smallFlatA', cx + (rnd() - 0.5) * 0.5, 0, cz + (rnd() - 0.5) * 0.5, rnd() * 6, 1.5 + rnd());
    }

    if (wheatAt.length) group.add(wheatField(wheatAt));
    if (PAINT) {
        // cây hái được (cây táo, cây sồi già) cũng là cây vẽ tay, đứng đúng ô của vật trên bản đồ (hình 2D của chúng được ẩn ở src/ui/world.js)
        for (const o of map.objects ?? []) if (o.sprite === 'i_appletree' || o.sprite === 'i_oak') B.trees.push([o.x + 0.5, o.y + 0.5, 2.3, true, o.sprite === 'i_appletree' ? 'apple' : 'round', o.sprite === 'i_appletree' ? 'apple' : 'dark']);
        paintGrass(group, paintTiles, 12); anim.push(paintMapClouds(group, cols, rows));
        anim.push(paintSeeds(group, [0, 0, cols, rows], { count: 46, y0: 0.5, y1: 2.6, size: 0.06, follow: true }));   // hạt bồ công anh bay quanh nhân vật
        // ĐỒ ĐẠC PHỐ CỔ: ô bị chặn nằm sát đường lát đá / đường đất mà còn trống -> thùng gỗ, thùng rượu, đèn lồng, bồn cây, xe kéo (vật thời xưa, không chắn lối vì ô vốn đã không đi được)
        const street = (x, z) => inside(x, z) && map.grid?.[z]?.[x] === '.' && (T(x, z) === 's' || T(x, z) === 'p');
        for (let z = 1; z < rows - 1; z++) for (let x = 1; x < cols - 1; x++) {
            if (map.grid?.[z]?.[x] === '.' || cover[x + z * cols] || isSpecialTile(x, z)) continue;
            const tt = T(x, z); if (tt !== 's' && tt !== 'g' && tt !== 'p') continue;
            if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => street(x + dx, z + dz))) continue;
            const h = ((x * 73856093) ^ (z * 19349663)) >>> 0, r = (h % 1000) / 1000;
            if (id === 'capital' || r > 0.3) continue;   // (12/11) người chơi: quá nhiều đồ trên đường -> thưa hẳn; Valoria dùng sơ đồ đồ đạc riêng
            const cx = x + 0.5, cz = z + 0.5, rot = ((h >> 8) % 628) / 100, q = (h >> 4) % 16, T2 = 'custom/town_';
            // quay mặt đồ vật về phía đường
            const side = [[0, 1], [1, 0], [0, -1], [-1, 0]].find(([dx, dz]) => street(x + dx, z + dz)) ?? [0, 1], face = Math.atan2(side[0], side[1]);
            const pool = ['barrels', 'crates', 'sacks', 'planter_a', 'planter_b', 'flowerpots', 'bench', 'lamp_post', 'woodpile', 'haybale', 'trough', 'cart_hay', 'cart_goods', 'noticeboard', 'table_set', 'laundry'];
            const name = pool[q];
            const sc = { cart_hay: 0.62, cart_goods: 0.6, laundry: 0.5, table_set: 0.6, lamp_post: 0.7, noticeboard: 0.62 }[name] ?? 0.62;
            B.put(T2 + name, cx, 0, cz, /cart|sacks|barrels|woodpile|haybale/.test(name) ? rot : face, sc);
            coverRect(x, z, x + 1, z + 1);
        }
    }
    if (!oldMode) buildRegionLife(ctx, id, map, terrain, treeSpots, roofPerches);
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

const VH_FRONT = 0;   // mặt ngoài của mảng tường bộ Village quay về -z (phần bệ / bậu cửa nhô ra phía đó)
export const BUILD = {
    /** Nhà lắp từ mảnh bộ thị trấn: khung x0..x1 × z0..z1, cửa ở mặt trước (phía z1) tại cột doorX */
    house(ctx, { x0, z0, x1, z1, door, wall = 'wood', roof = 'red', h = 2.0, chimney = true, sign = null }) {
        if (PAINT) {   // (12/11/2026) nhà bộ Làng Trung Cổ thay cho nhà khối
            BUILD.vhouseFit(ctx, { x0, z0, x1, z1, wall: wall === 'stone' ? 'brick' : 'plaster', h, door: door != null });
            if (door != null && !ctx.oldMode) BUILD.dirtPatch(ctx, door, z1 + 0.55, 1.35, 0.85);
            if (sign) BUILD.model(ctx, 'survival/signpost-single', sign[0], sign[1], { s: 3 });
            return;
        }
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
        if (chimney) {
            const chX = x1 - w * 0.22, chY = h + rh * 0.25, chZ = z0 + d * 0.3;
            B.put('town/chimney', chX, chY, chZ, 0, 1.6, 1.5, 1.6);
            if (!ctx.oldMode) BUILD.smoke(ctx, chX, chY + 1.05, chZ);
        }
        B.put(WIN, x0 + sw * (n - 0.5), 0, cz, 0, sw, h, d);
        B.put(W, x0 + sw * 0.5, 0, cz, Math.PI, sw, h, d);

        if (door != null && !ctx.oldMode) BUILD.dirtPatch(ctx, door, z1 + 0.55, 1.35, 0.85);
        if (sign) BUILD.model(ctx, 'survival/signpost-single', sign[0], sign[1], { s: 3 });
        ctx.roofPerches?.push([(x0 + x1) / 2, h + rh * 0.48, (z0 + z1) / 2]);
        ctx.cover(x0, z0, x1, z1);
    },
    /**
     * NHÀ LÀNG TRUNG CỔ (bộ Quaternius Medieval Village, CC0): tường trát vôi khung gỗ hoặc tường đá, mái ngói ống, đầu hồi gạch, ống khói.
     *   x, z: tâm nhà (ô) · w: số mảng tường ngang (2 | 3) · d: số mảng sâu (w=2: 2 | 3 · w=3: 4) · turn: 1 = xoay mái dốc ra phía trước
     *   s: tỉ lệ (1 mảng tường của bộ = 2 m; s = 0,62 -> tường cao ~1,9 ô như nhà cũ)
     */
    vhouse(ctx, { x, z, w = 2, d = 3, wall = 'plaster', turn = 0, door = true, s = 0.62, sx = s, sy = s, sz = s, chimney = true }) {
        const { B } = ctx, P = 'village/', Wn = wall === 'brick' ? 'Wall_UnevenBrick_' : 'Wall_Plaster_';
        if (w === 3) d = 4; else if (d > 3) d = 3;
        const rot = turn ? Math.PI / 2 : 0, c = Math.cos(rot), sn = Math.sin(rot), F = VH_FRONT;
        // lx, lz: toạ độ trong nhà (mét của bộ) · ry: hướng của mảnh trong nhà · along: mảnh nằm dọc trục nào của nhà ('x' | 'z') -> co giãn đúng chiều
        const put = (name, lx, ly, lz, ry, along = 'x', k = 1) => B.put(P + name, x + (lx * sx * c + lz * sz * sn), ly * sy, z + (-lx * sx * sn + lz * sz * c), ry + rot,
            (along === 'x' ? sx : sz) * k, sy * k, (along === 'x' ? sz : sx) * k);
        const putC = (name, lx, ly, lz, ry, along = 'x', k = 1) => B.put('custom/' + name, x + (lx * sx * c + lz * sz * sn), ly * sy, z + (-lx * sx * sn + lz * sz * c), ry + rot,
            (along === 'x' ? sx : sz) * k, sy * k, (along === 'x' ? sz : sx) * k);
        const plain = wall === 'brick' ? 'Straight' : 'WoodGrid';   // mảng tường trơn: tường vôi dùng loại có khung gỗ chéo cho đỡ trống
        const frame = wall === 'brick' ? 'DoorFrame_Round_Brick' : 'DoorFrame_Round_WoodDark';
        /** một mảng tường: kind = 'door' | 'win' | 'plain' — cửa có khung + cánh gỗ, cửa sổ có khung kính + cánh chớp mở (nhà có người ở, không còn lỗ trống) */
        const seg = (kind, lx, lz, ry, along) => {
            if (kind === 'door') {
                put(Wn + 'Door_Round', lx, 0, lz, ry, along); put(frame, lx, 0, lz, ry, along); const dx = Math.cos(ry) * -0.53, dz = -Math.sin(ry) * -0.53; put('Door_2_Round', lx + dx, 0, lz + dz, ry, along);
                // đồ đạc phố cổ quanh cửa (bộ Codex): đèn gắn tường, biển hiệu treo, chậu hoa -> nhà có người ở, phố có hồn
                const tx = Math.cos(ry), tz = -Math.sin(ry), ox = Math.sin(ry), oz = Math.cos(ry), hk = Math.abs(Math.round(x * 5 + z * 11));
                putC('town_lamp_wall', lx + tx * 0.86, 1.75, lz + tz * 0.86, ry, along);
                if (hk % 3 !== 1) putC(['town_sign_inn', 'town_sign_smith', 'town_sign_shop'][hk % 3 === 0 ? (hk >> 2) % 3 : 2], lx - tx * 0.86, 1.9, lz - tz * 0.86, ry, along);
                // (12/11) chậu hoa / ghế trước cửa thò ra lòng đường làm người chơi tưởng là vật cản -> bỏ; chỉ còn thứ gắn trên tường
            }
            else if (kind === 'win') { put(Wn + 'Window_Wide_Round', lx, 0, lz, ry, along); put('Window_Wide_Round1', lx, 0, lz, ry, along); put('WindowShutters_Wide_Round_Open', lx, 0, lz, ry, along); }
            else put(Wn + plain, lx, 0, lz, ry, along);
        };
        const mid = Math.floor(w / 2), dj = Math.floor(d / 2);
        // mặt nhìn về máy quay (+z thế giới): không xoay = mặt +z của nhà · xoay = mặt -x của nhà -> cửa ở giữa, hai bên là cửa sổ
        for (let i = 0; i < w; i++) {
            const lx = -w + 1 + i * 2;
            seg(!turn ? (door && i === mid ? 'door' : 'win') : 'plain', lx, d, F, 'x');
            seg(i % 2 ? 'win' : 'plain', lx, -d, F + Math.PI, 'x');
        }
        for (let j = 0; j < d; j++) {
            const lz = -d + 1 + j * 2;
            seg(j % 2 ? 'win' : 'plain', w, lz, F + Math.PI / 2, 'z');
            seg(turn ? (door && j === dj ? 'door' : 'win') : (j % 2 ? 'plain' : 'win'), -w, lz, F - Math.PI / 2, 'z');
        }
        for (const [cx, cz] of [[w, d], [-w, d], [w, -d], [-w, -d]]) put(wall === 'brick' ? 'Corner_Exterior_Brick' : 'Corner_Exterior_Wood', cx, 0, cz, 0);
        const flat = ctx.props ? 1 : 0.72;   // bản đồ nhìn từ trên xuống: mái thấp bớt để đỡ che lối đi (cảnh chiến đấu giữ nguyên)
        const putR = (name, lx, ly, lz, ry) => B.put(P + name, x + (lx * sx * c + lz * sz * sn), ly * sy, z + (-lx * sx * sn + lz * sz * c), ry + rot, sx, sy * flat, sz);
        putR(`Roof_RoundTiles_${w * 2}x${d * 2}`, 0, 3.0, 0, 0);
        putR(`Roof_Front_Brick${w * 2}`, 0, 3.0, d, F); putR(`Roof_Front_Brick${w * 2}`, 0, 3.0, -d, F + Math.PI);
        // dây leo bò trên một mảng tường bên
        put('Prop_Vine1', w + 0.02, 0, -d + 1, F + Math.PI / 2, 'z');
        // lòng nhà: khối tối ấm bên trong để nhìn qua cửa sổ thấy "trong nhà" chứ không xuyên ra trời
        const inner = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), ctx.lam(0x2b2018, { occlude: false, detail: false }));
        inner.scale.set((turn ? d : w) * 2 * (turn ? sz : sx) - 0.18, 2.9 * sy, (turn ? w : d) * 2 * (turn ? sx : sz) - 0.18); inner.position.set(x, 1.45 * sy, z);
        ctx.group.add(inner);
        if (chimney) {
            const lx = w * 0.45, lz = -d * 0.35; put('Prop_Chimney', lx, 3.4, lz, 0);
            if (!ctx.oldMode && BUILD.smoke) BUILD.smoke(ctx, x + (lx * sx * c + lz * sz * sn), 6.6 * sy, z + (-lx * sx * sn + lz * sz * c));
        }
        const ex = (turn ? d * sz : w * sx) + 0.3, ez = (turn ? w * sx : d * sz) + 0.3;
        ctx.cover(x - ex, z - ez, x + ex, z + ez);
        ctx.roofPerches?.push([x, 3.0 * sy + 1.4, z]);
    },
    /** Nhà Làng Trung Cổ vừa khít một khung x0..x1 × z0..z1 (thay cho nhà khối cũ ở cả bản đồ lẫn cảnh chiến đấu): tự chọn dáng mái gần nhất rồi co giãn cho khít */
    vhouseFit(ctx, { x0, z0, x1, z1, wall = 'plaster', h = 2.0, door = true, tall = false, shape = null }) {
        const W = x1 - x0, D = z1 - z0, want = Math.log(W / D);
        let best = null;
        for (const [w, d, turn] of shape ? [shape] : [[2, 2, 0], [2, 3, 0], [3, 4, 0], [2, 3, 1], [3, 4, 1]]) {
            const mx = (turn ? d : w) * 2, mz = (turn ? w : d) * 2, err = Math.abs(Math.log(mx / mz) - want) + (turn ? 0 : 0.05);
            if (!best || err < best.err) best = { w, d, turn, mx, mz, err };
        }
        const kx = W / best.mx, kz = D / best.mz;   // co giãn theo trục THẾ GIỚI -> đổi về trục của nhà nếu nhà xoay
        BUILD.vhouse(ctx, { x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: best.w, d: best.d, turn: best.turn, wall, door,
            sx: best.turn ? kz : kx, sz: best.turn ? kx : kz, sy: Math.max(0.5, Math.min(tall ? 0.9 : 0.8, h / 3.1)) });
    },
    /** THÁP đá mái ngói nhọn (bộ Village): mỗi tầng là một vòng tường đá 2×2 mảng, trên cùng là mái tháp */
    vtower(ctx, x, z, { r = 1.1, h = 3.4, roof = true } = {}) {
        const { B } = ctx, P = 'village/', s = r / 2, levels = Math.max(1, Math.round(h / (3.0 * s)));
        const put = (name, lx, ly, lz, ry) => B.put(P + name, x + lx * s, ly * s, z + lz * s, ry, s);
        for (let l = 0; l < levels; l++) {
            const y = l * 3.0, win = l > 0 ? 'Wall_UnevenBrick_Window_Thin_Round' : 'Wall_UnevenBrick_Straight';
            for (const lx of [-1, 1]) { put(lx < 0 ? win : 'Wall_UnevenBrick_Straight', lx, y, 2, VH_FRONT); put('Wall_UnevenBrick_Straight', lx, y, -2, VH_FRONT + Math.PI); }
            for (const lz of [-1, 1]) { put('Wall_UnevenBrick_Straight', 2, y, lz, VH_FRONT + Math.PI / 2); put('Wall_UnevenBrick_Straight', -2, y, lz, VH_FRONT - Math.PI / 2); }
            for (const [cx, cz] of [[2, 2], [-2, 2], [2, -2], [-2, -2]]) put('Corner_Exterior_Brick', cx, y, cz, 0);
        }
        if (roof) put('Roof_Tower_RoundTiles', 0, levels * 3.0, 0, 0);
        const inner = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), ctx.lam(0x2b2018, { occlude: false, detail: false }));
        inner.scale.set(4 * s - 0.15, levels * 3.0 * s, 4 * s - 0.15); inner.position.set(x, levels * 1.5 * s, z); ctx.group.add(inner);
        ctx.cover(x - r - 0.2, z - r - 0.2, x + r + 0.2, z + r + 0.2);
    },
    /**
     * TƯỜNG HẦM NGỤC (bộ KayKit Dungeon Remastered, CC0): dãy tường đá a -> b (cùng z), xen cửa vòm / song sắt / tường nứt, trụ đá giữa các mảng,
     *   đuốc và cờ treo trên tường. s: tỉ lệ (1 mảng = 4 m rộng, 4 m cao).
     */
    dwall(ctx, a, b, { s = 0.75, door = true, deco = true, half = false, shelves = false, banners = ['banner_patternA_red', 'banner_shield_blue', 'banner_triple_green'] } = {}) {
        const { B } = ctx, P = 'dungeon/', dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, rot = Math.atan2(-dz, dx);
        const step = 4 * s, n = Math.max(1, Math.round(L / step)), t0 = L / 2 - (n - 1) * step / 2, midI = Math.floor(n / 2);
        const nx = -uz, nz = ux;   // phía mặt trước của tường (+z khi tường chạy theo trục x)
        const at = (t, off = 0) => [a[0] + ux * t + nx * off, a[1] + uz * t + nz * off];
        if (half) {   // lan can / tường lũy thấp: chỉ nửa tường, không trụ, không cờ
            for (let i = 0; i < n; i++) { const [x, z] = at(t0 + i * step); B.put(P + 'wall_half', x, 0, z, rot, s); }
            return;
        }
        const cycle = shelves ? ['wall_shelves', 'wall', 'wall_shelves', 'wall_arched', 'wall_shelves', 'wall_window_closed']
            : ['wall', 'wall_arched', 'wall', 'wall_window_closed', 'wall', 'wall_arched', 'wall_gated', 'wall'];
        for (let i = 0; i < n; i++) {
            const t = t0 + i * step, [x, z] = at(t), name = door && i === midI ? 'wall_doorway' : deco ? cycle[(i * 3 + n) % cycle.length] : (i % 3 === 1 ? 'wall_arched' : 'wall');
            B.put(P + name, x, 0, z, rot, s);
            const [px, pz] = at(t - step / 2, 0.25 * s); B.put(P + 'pillar', px, 0, pz, rot, s);
            if (deco && i % 2 === 0 && i !== midI) { const [tx, tz] = at(t - step * 0.28, 0.5 * s); B.put(P + 'torch_mounted', tx, 2.3 * s, tz, rot, s * 1.2); }
            if (i % 2 === 1 && i !== midI && name !== 'wall_shelves') { const [bx, bz] = at(t, 0.12 * s); B.put(P + banners[(i >> 1) % banners.length], bx, 0.1 * s, bz, rot, s); }
        }
        const [ex, ez] = at(t0 + (n - 0.5) * step, 0.25 * s); B.put(P + 'pillar', ex, 0, ez, rot, s);
    },
    /** Bảng tên nổi trên công trình chính (Cung điện, Nhà thờ lớn…): tấm chữ luôn quay về máy quay, để người chơi biết đâu là đâu */
    label(ctx, x, z, text, { y = 4.6, color = '#fde68a' } = {}) {
        if (typeof document === 'undefined') return;
        const cv = document.createElement('canvas'), g = cv.getContext('2d');
        g.font = '800 44px Outfit, sans-serif'; const w = Math.ceil(g.measureText(text).width) + 56;
        cv.width = w; cv.height = 76;
        g.fillStyle = 'rgba(15,23,42,0.86)'; g.beginPath(); g.roundRect(2, 2, w - 4, 72, 20); g.fill();
        g.strokeStyle = 'rgba(251,191,36,0.85)'; g.lineWidth = 3; g.stroke();
        g.font = '800 44px Outfit, sans-serif'; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, 40);
        const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, fog: false, transparent: true }));
        sp.position.set(x, y, z); sp.scale.set(w / 76 * 0.6, 0.6, 1); sp.material.opacity = 0.9; sp.renderOrder = 4; sp.frustumCulled = false;
        ctx.group.add(sp);
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
        const tex = ctx.oldMode ? brickTexture() : plazaMosaicTexture();
        const topMat = patchMaterial(new THREE.MeshStandardMaterial({ map: tex, color, roughness: 0.92 }), { sway: 0, occlude: false, cloud: true });
        const m = mesh(ctx, new THREE.CylinderGeometry(r, r, 0.1, 48), [lam(0x8a877e, { occlude: false }), topMat, lam(0x8a877e, { occlude: false })], x, 0.02, z);
        m.castShadow = false;
        if (!ctx.oldMode) {
            // viền đá khắc & hoa văn la bàn giữa quảng trường
            const rimRing = mesh(ctx, new THREE.RingGeometry(r - 0.35, r + 0.08, 48), lam(0xb8ad98, { occlude: false }), x, 0.073, z);
            rimRing.rotation.x = -Math.PI / 2; rimRing.castShadow = false;
            const innerRing = mesh(ctx, new THREE.RingGeometry(r * 0.48, r * 0.53, 36), lam(0xc8b89a, { occlude: false }), x, 0.074, z);
            innerRing.rotation.x = -Math.PI / 2; innerRing.castShadow = false;
        }
        ctx.cover(x - r * 0.75, z - r * 0.75, x + r * 0.75, z + r * 0.75);
    },
    /** Giếng đá có mái gỗ + mặt nước lấp lánh */
    well(ctx, x, z) {
        if (PAINT) {   // (12/11/2026) giếng làng trung cổ do Codex dựng bằng code (tools/models/make_well.py): thành đá xếp, cột gỗ, trục quay, xô, mái ngói
            ctx.B.put('custom/well', x, 0, z, 0, 0.82); ctx.cover(x - 1.2, z - 1.2, x + 1.2, z + 1.2); return;
        }
        mesh(ctx, new THREE.CylinderGeometry(0.95, 1.05, 0.8, 12), lam(0x9a958a), x, 0.4, z);
        const wMat = new THREE.MeshStandardMaterial({ color: 0x3f8fc4, emissive: 0x1c5c88, emissiveIntensity: 0.35, flatShading: false, roughness: 0.12, metalness: 0.15 });
        patchMaterial(wMat, { sway: 0, occlude: true, cloud: false });
        const waterDisk = mesh(ctx, new THREE.CylinderGeometry(0.76, 0.76, 0.06, 16), wMat, x, 0.72, z);
        [-0.85, 0.85].forEach(dx => mesh(ctx, new THREE.BoxGeometry(0.14, 1.9, 0.14), lam(0x5a3a1e), x + dx, 0.95, z));
        const roof = mesh(ctx, new THREE.CylinderGeometry(0.01, 1.35, 0.7, 4, 1), lam(0x8a4a2a), x, 2.2, z, Math.PI / 4); roof.scale.set(1.2, 1, 0.8);
        mesh(ctx, new THREE.CylinderGeometry(0.06, 0.06, 1.7, 6), lam(0x6a4526), x, 1.55, z).rotation.z = Math.PI / 2;
        if (!ctx.oldMode) {
            ctx.B.put('survival/bucket', x + 0.95, 0, z + 0.55, 0.5, 1.7);
            const spkGeo = new THREE.CircleGeometry(0.09, 6); spkGeo.rotateX(-Math.PI / 2);
            const spkMat = new THREE.MeshBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0.85, depthWrite: false });
            const sparkles = [[-0.22, -0.15, 0], [0.24, 0.12, 2.1], [-0.08, 0.26, 4.2]].map(([dx, dz, ph]) => {
                const s = new THREE.Mesh(spkGeo, spkMat.clone());
                s.position.set(x + dx, 0.76, z + dz);
                ctx.group.add(s);
                return { s, ph };
            });
            ctx.anim.push((t) => {
                waterDisk.position.y = 0.72 + Math.sin(t * 2.6) * 0.015;
                wMat.emissiveIntensity = 0.3 + Math.sin(t * 3.4) * 0.18;
                for (const q of sparkles) {
                    const v = 0.5 + 0.5 * Math.sin(t * 4.5 + q.ph);
                    q.s.scale.setScalar(0.5 + v * 0.9);
                    q.s.material.opacity = v * 0.85;
                }
            });
        }
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
        if (PAINT) return BUILD.dwall(ctx, a, b, { s: ctx.props ? Math.max(0.6, h / 4) : Math.max(0.42, h / 4), door: false, deco: false });   // tường đá bộ hầm ngục (cả bản đồ lẫn cảnh chiến đấu)
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
        if (PAINT) return BUILD.vtower(ctx, x, z, { r: r * (ctx.props ? 1.15 : 1), h, roof: roof !== null });   // tháp đá mái ngói bộ Village (cả bản đồ lẫn cảnh chiến đấu)
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
        if (PAINT && !ctx.props) {   // (12/11/2026) bản đồ: công trình lớn (cung điện, nhà thờ, thư viện) = dãy nhà đá mái ngói liền nhau + 2 tháp hai đầu, thay cho khối hộp trơn
            // mỗi gian = nhà 3×4 mảng (6 m × 8 m) quay đầu hồi ra đường, co cho vừa chiều sâu -> ngói và cửa sổ giữ đúng cỡ, không bị kéo giãn
            const W = x1 - x0, D = z1 - z0, n = Math.max(1, Math.round(W / (D * 0.75))), seg = W / n;
            for (let i = 0; i < n; i++) BUILD.vhouseFit(ctx, { x0: x0 + i * seg, z0: z0 + (i % 2 ? 0.3 : 0), x1: x0 + (i + 1) * seg, z1, wall: 'brick', h: 2.6, door: door != null && i === Math.floor(n / 2), tall: true, shape: [3, 4, 0] });
            const r = Math.min(1.3, D * 0.2);
            BUILD.vtower(ctx, x0 + r * 0.6, z0 + r * 0.8, { r, h: h + 2.2, roof: true }); BUILD.vtower(ctx, x1 - r * 0.6, z0 + r * 0.8, { r, h: h + 2.2, roof: true });
            ctx.cover(x0, z0, x1, z1);
            return;
        }
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
        if (PAINT && !ctx.props) return BUILD.vtower(ctx, x, z, { r: w * 0.6, h: h + 1, roof: true });   // bản đồ: tháp đá mái ngói nhọn
        mesh(ctx, new THREE.BoxGeometry(w, h, w), lam(wall), x, h / 2, z);
        mesh(ctx, new THREE.ConeGeometry(w * 0.78, roofH, 4), lam(roof), x, h + roofH / 2, z, Math.PI / 4);
        mesh(ctx, new THREE.BoxGeometry(0.4, 1.1, 0.05), lam(0x2b3a55), x, h * 0.7, z + w / 2 + 0.01);
    },
    /** Sạp chợ có mái vải màu */
    stall(ctx, x, z, color = 0xc0392b, r = 0) {
        if (PAINT) {   // (12/11/2026) sạp chợ bộ đồ đạc phố cổ (Codex): mái bạt sọc, quầy đầy hàng — 4 kiểu, chọn theo vị trí
            const kinds = ['town_stall_fruit', 'town_stall_bread', 'town_stall_cloth', 'town_stall_fish'];
            ctx.B.put('custom/' + kinds[Math.abs(Math.round(x * 3 + z * 7)) % 4], x, 0, z, r, 0.7); ctx.cover(x - 0.9, z - 0.7, x + 0.9, z + 0.7); return;
        }
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
        if (PAINT) { ctx.B.put('custom/town_fountain', x, 0, z, 0, s * 0.62); ctx.cover(x - s, z - s, x + s, z + s); return; }   // đài phun nước đá xếp, có tia nước
        ctx.B.put('town/fountain-round', x, 0, z, 0, s);
        ctx.B.put('town/fountain-round-detail', x, 0, z, 0, s);
        ctx.B.put('town/fountain-center', x, 0, z, 0, s);
        ctx.cover(x - s, z - s, x + s, z + s);
    },
    /** Đèn đường */
    lamp(ctx, x, z) { ctx.B.put(PAINT ? 'custom/town_lamp_post' : 'town/lantern', x, 0, z, 0, PAINT ? 0.7 : 1.25); },
    /** Hầm mộ / phiến đá */
    crypt(ctx, x, z, s = 2.4) { ctx.B.put('graveyard/crypt', x, 0, z, 0, s); },

    // ---------- Chi tiết làng quê (dùng cho Ashford & tái sử dụng cho 6 vùng khác) ----------
    /** Vệt đất mòn trước cửa nhà / góc sân (phẳng trên mặt đất, không cản lối) */
    dirtPatch(ctx, x, z, rx = 1.2, rz = 0.85, rot = 0) {
        const g = new THREE.CircleGeometry(1, 14); g.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(g, lam(0x8b6f4e, { occlude: false }));
        m.position.set(x, 0.008, z); m.rotation.y = rot; m.scale.set(rx * 0.5, 1, rz * 0.5);
        m.receiveShadow = true; ctx.group.add(m);
        const m2 = new THREE.Mesh(g, lam(0x765c3e, { occlude: false }));
        m2.position.set(x, 0.011, z); m2.rotation.y = rot + 0.4; m2.scale.set(rx * 0.32, 1, rz * 0.3);
        m2.receiveShadow = true; ctx.group.add(m2);
    },
    /** Đá lát lẻ rải trên cỏ / đường */
    steppingStones(ctx, pts) {
        const g = new THREE.CylinderGeometry(0.28, 0.32, 0.04, 7);
        for (const [x, z, s = 1] of pts) {
            const m = mesh(ctx, g, lam(0x9d978c, { occlude: false }), x, 0.015, z, ctx.rnd() * 6);
            m.scale.set(s, 1, s * (0.78 + ctx.rnd() * 0.3));
            m.castShadow = false;
        }
    },
    /** Bao tải ngũ cốc / bột mì */
    sack(ctx, x, z, n = 2) {
        const g = new THREE.SphereGeometry(0.24, 7, 6);
        const knot = new THREE.ConeGeometry(0.1, 0.12, 5);
        const mat = lam(0xc8ad7f), rope = lam(0x7a5832);
        for (let i = 0; i < n; i++) {
            const ox = (i === 0 ? 0 : (ctx.rnd() - 0.5) * 0.38), oz = (i === 0 ? 0 : (ctx.rnd() - 0.5) * 0.32);
            const sy = i === 2 ? 0.36 : 0;
            const s = mesh(ctx, g, mat, x + ox, 0.2 + sy, z + oz, ctx.rnd() * 3);
            s.scale.set(1.05, 0.88, 0.95);
            mesh(ctx, knot, rope, x + ox, 0.42 + sy, z + oz);
        }
        ctx.cover(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
    },
    /** Đống củi xếp bên tường nhà */
    woodpile(ctx, x, z, r = 0) {
        ctx.B.put('nature/log_stack', x, 0, z, r, 1.85);
        ctx.B.put('nature/stump_round', x + Math.cos(r) * 0.55, 0, z - Math.sin(r) * 0.55, r, 1.45);
        ctx.cover(x - 0.6, z - 0.6, x + 0.6, z + 0.6);
    },
    /** Giỏ rau củ đặt góc sân / chợ */
    veggieBasket(ctx, x, z) {
        const colors = [0xd35400, 0x27ae60, 0xc0392b, 0xf39c12];
        for (let i = 0; i < 3; i++) {
            const bx = x + (i - 1) * 0.34, bz = z + (i % 2) * 0.22;
            mesh(ctx, new THREE.CylinderGeometry(0.2, 0.15, 0.24, 8), lam(0x9c6b3b), bx, 0.12, bz);
            for (let j = 0; j < 3; j++) {
                const a = j * 2.1 + i;
                mesh(ctx, new THREE.SphereGeometry(0.085, 6, 5), lam(colors[(i + j) % colors.length]), bx + Math.cos(a) * 0.07, 0.24, bz + Math.sin(a) * 0.07);
            }
        }
        ctx.cover(x - 0.5, z - 0.4, x + 0.5, z + 0.4);
    },
    /** Chậu hoa nhỏ đặt sát cửa nhà */
    flowerPot(ctx, x, z, fl = 'nature/flower_redA') {
        ctx.B.put('nature/pot_small', x, 0, z, 0, 1.5);
        ctx.B.put(fl, x, 0.26, z, ctx.rnd() * 6, 1.35);
    },
    /** Bàn ghế gỗ ngoài hiên quán cô Lena */
    tavernTable(ctx, x, z) {
        mesh(ctx, new THREE.CylinderGeometry(0.48, 0.48, 0.07, 10), lam(0x8a5a2e), x, 0.58, z);
        mesh(ctx, new THREE.CylinderGeometry(0.1, 0.14, 0.56, 6), lam(0x5e3e26), x, 0.28, z);
        // cốc bia gỗ trên bàn
        mesh(ctx, new THREE.CylinderGeometry(0.06, 0.06, 0.13, 6), lam(0xd49b38), x - 0.14, 0.67, z + 0.08);
        mesh(ctx, new THREE.CylinderGeometry(0.055, 0.055, 0.03, 6), lam(0xfff5d6), x - 0.14, 0.74, z + 0.08);
        mesh(ctx, new THREE.CylinderGeometry(0.06, 0.06, 0.13, 6), lam(0xc88a2e), x + 0.16, 0.67, z - 0.06);
        ctx.B.put('town/stall-stool', x - 0.62, 0, z, 0, 1.35);
        ctx.B.put('town/stall-stool', x + 0.62, 0, z, 0, 1.35);
        ctx.cover(x - 0.8, z - 0.6, x + 0.8, z + 0.6);
    },
    /** Dây phơi quần áo căng giữa 2 cọc / 2 nhà, đung đưa theo gió */
    clothesline(ctx, a, b) {
        const [x0, z0] = a, [x1, z1] = b;
        const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
        const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.65, 6);
        mesh(ctx, postGeo, lam(0x6a4526), x0, 0.82, z0);
        mesh(ctx, postGeo, lam(0x6a4526), x1, 0.82, z1);
        const rope = mesh(ctx, new THREE.BoxGeometry(L, 0.025, 0.025), lam(0xd8cbb8), (x0 + x1) / 2, 1.52, (z0 + z1) / 2, rot);
        rope.castShadow = false;
        const colors = [0xe74c3c, 0x3498db, 0xf1c40f, 0xf5f0e6, 0x2ecc71];
        const cloths = [];
        const n = Math.max(3, Math.floor(L / 0.72));
        for (let i = 1; i <= n; i++) {
            const t = i / (n + 1);
            const cx = x0 + dx * t, cz = z0 + dz * t;
            const piv = new THREE.Group();
            piv.position.set(cx, 1.5, cz);
            piv.rotation.y = rot;
            const w = 0.36 + (i % 2) * 0.08, h = 0.44 + (i % 3) * 0.08;
            const cMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.025), lam(colors[i % colors.length]));
            cMesh.position.y = -h / 2;
            cMesh.castShadow = true;
            piv.add(cMesh);
            ctx.group.add(piv);
            cloths.push({ piv, ph: i * 1.1 });
        }
        ctx.anim.push((t) => {
            for (const c of cloths) c.piv.rotation.x = 0.12 + Math.sin(t * 2.4 + c.ph) * 0.22;
        });
    },
    /** Bảng hiệu treo trước quán rượu hoặc lò rèn */
    shopSign(ctx, x, z, kind = 'tavern') {
        mesh(ctx, new THREE.CylinderGeometry(0.07, 0.08, 2.0, 6), lam(0x4e341e), x, 1.0, z);
        mesh(ctx, new THREE.BoxGeometry(0.65, 0.07, 0.07), lam(0x3a2818), x + 0.28, 1.88, z);
        const piv = new THREE.Group(); piv.position.set(x + 0.48, 1.84, z); ctx.group.add(piv);
        const boardCol = kind === 'forge' ? 0x3d434d : 0x9c5a2b;
        const iconCol = kind === 'forge' ? 0xf39c12 : 0xfad02c;
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.05), lam(boardCol)); b.position.y = -0.22; b.castShadow = true; piv.add(b);
        const ic = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.07), lam(iconCol)); ic.position.y = -0.22; piv.add(ic);
        ctx.anim.push((t) => { piv.rotation.x = Math.sin(t * 2.1 + x) * 0.12; });
    },
    /** Đống than hồng + giá vũ khí dựng tường cho lò rèn bác Borin */
    forgeProps(ctx, x, z) {
        // đống than đen + đốm lửa đỏ cam lập loè
        const coal = mesh(ctx, new THREE.DodecahedronGeometry(0.45, 1), lam(0x262423), x, 0.16, z);
        coal.scale.set(1.2, 0.55, 1.0);
        const emberMat = new THREE.MeshStandardMaterial({ color: 0xff5511, emissive: 0xff3300, emissiveIntensity: 0.9, roughness: 0.4 });
        patchMaterial(emberMat, { sway: 0, occlude: true, cloud: false });
        const e1 = mesh(ctx, new THREE.DodecahedronGeometry(0.18, 0), emberMat, x + 0.12, 0.26, z + 0.1);
        const e2 = mesh(ctx, new THREE.DodecahedronGeometry(0.14, 0), emberMat, x - 0.15, 0.22, z + 0.08);
        e1.castShadow = e2.castShadow = false;
        ctx.anim.push((t) => { emberMat.emissiveIntensity = 0.65 + Math.sin(t * 5.0) * 0.35; });
        // giá dựng kiếm / búa sát tường lò rèn
        const rx = x + 1.05, rz = z - 0.25;
        mesh(ctx, new THREE.BoxGeometry(0.9, 0.75, 0.12), lam(0x5c3c20), rx, 0.38, rz);
        for (let i = -1; i <= 1; i++) {
            const blade = mesh(ctx, new THREE.BoxGeometry(0.07, 0.85, 0.03), lam(0xb8c2cc), rx + i * 0.24, 0.55, rz + 0.08);
            blade.rotation.z = i * 0.08;
            mesh(ctx, new THREE.BoxGeometry(0.2, 0.05, 0.05), lam(0xd4a038), rx + i * 0.24, 0.82, rz + 0.08);
        }
        ctx.B.put('survival/tool-hammer', x - 0.55, 0, z + 0.25, 0.8, 2.2);
        ctx.B.put('survival/tool-pickaxe', x - 0.35, 0, z + 0.45, -0.5, 2.2);
        ctx.B.put('survival/bucket', x + 0.55, 0, z + 0.35, 0, 1.8);
        ctx.cover(x - 0.7, z - 0.5, x + 1.5, z + 0.6);
    },
    /** Vườn rau nhỏ sau nhà bà Mira (luống đất + cải xanh + bí đỏ) */
    gardenPatch(ctx, x0, z0, x1, z1) {
        for (let z = z0 + 0.4; z < z1 - 0.2; z += 0.75) {
            ctx.B.put('nature/crops_dirtRow', (x0 + x1) / 2, 0, z, 0, (x1 - x0) * 0.55, 1.2, 1.2);
            for (let x = x0 + 0.35; x < x1 - 0.25; x += 0.55) {
                const crop = ctx.rnd() < 0.35 ? 'nature/crop_pumpkin' : ctx.rnd() < 0.5 ? 'nature/crops_wheatStageA' : 'nature/plant_bushSmall';
                ctx.B.put(crop, x, 0.06, z, ctx.rnd() * 6, 1.25);
            }
        }
        ctx.cover(x0, z0, x1, z1);
    },
    /** Khói trắng ấm bay lên từ ống khói */
    smoke(ctx, x, y, z) {
        const puffs = [];
        const geo = new THREE.IcosahedronGeometry(0.18, 1);
        for (let i = 0; i < 5; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0.45, depthWrite: false });
            const p = new THREE.Mesh(geo, mat);
            ctx.group.add(p);
            puffs.push({ p, mat, off: i / 5 });
        }
        ctx.anim.push((t) => {
            for (const q of puffs) {
                const ph = (t * 0.38 + q.off) % 1;
                q.p.position.set(x + ph * 0.55 + Math.sin(t * 1.5 + q.off * 6) * 0.08, y + ph * 1.75, z - ph * 0.25);
                q.p.scale.setScalar(0.55 + ph * 1.35);
                q.mat.opacity = Math.sin(ph * Math.PI) * 0.38;
            }
        });
    },
    /** Đàn bướm / đom đóm lượn trên luống hoa */
    butterflies(ctx, spots) {
        const wingGeo = new THREE.PlaneGeometry(0.11, 0.14);
        const colors = [0xffe066, 0xff9ff3, 0x74b9ff, 0xffbe76];
        const list = spots.map(([x, z], i) => {
            const g = new THREE.Group();
            const m = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide });
            const wL = new THREE.Mesh(wingGeo, m); wL.position.x = -0.05;
            const wR = new THREE.Mesh(wingGeo, m); wR.position.x = 0.05;
            g.add(wL, wR);
            ctx.group.add(g);
            return { g, wL, wR, x, z, ph: i * 1.7 + ctx.rnd() * 3 };
        });
        ctx.anim.push((t) => {
            for (const b of list) {
                const a = t * 1.3 + b.ph;
                b.g.position.set(b.x + Math.cos(a) * 0.55, 0.55 + Math.sin(t * 2.7 + b.ph) * 0.18, b.z + Math.sin(a * 0.8) * 0.45);
                b.g.rotation.y = -a + Math.PI / 2;
                const flap = Math.sin(t * 15 + b.ph) * 0.85;
                b.wL.rotation.y = flap;
                b.wR.rotation.y = -flap;
            }
        });
    },
    /** Vài con gà / chim nhỏ mổ thóc ở góc sân */
    chickens(ctx, spots) {
        const bodyGeo = new THREE.SphereGeometry(0.13, 7, 6);
        const headGeo = new THREE.SphereGeometry(0.08, 6, 5);
        const beakGeo = new THREE.ConeGeometry(0.035, 0.08, 4); beakGeo.rotateX(Math.PI / 2);
        const combGeo = new THREE.BoxGeometry(0.03, 0.06, 0.07);
        const whiteMat = lam(0xf7f3e8), brownMat = lam(0xc88344), beakMat = lam(0xf39c12), combMat = lam(0xd63031);
        const hens = spots.map(([x, z], i) => {
            const g = new THREE.Group();
            const mat = i % 2 === 0 ? whiteMat : brownMat;
            const body = new THREE.Mesh(bodyGeo, mat); body.position.y = 0.14; body.scale.set(0.9, 0.85, 1.15); body.castShadow = true;
            const head = new THREE.Mesh(headGeo, mat); head.position.set(0, 0.24, 0.11);
            const beak = new THREE.Mesh(beakGeo, beakMat); beak.position.set(0, 0.23, 0.2);
            const comb = new THREE.Mesh(combGeo, combMat); comb.position.set(0, 0.31, 0.11);
            g.add(body, head, beak, comb);
            ctx.group.add(g);
            return { g, x, z, ph: i * 2.3 + ctx.rnd() * 2 };
        });
        ctx.anim.push((t) => {
            const hx = uHeroPos.value.x, hz = uHeroPos.value.z;
            for (const h of hens) {
                const dist = Math.hypot(hx - h.x, hz - h.z);
                const scared = dist < 3.6;
                const w = t * (scared ? 3.8 : 0.9) + h.ph;
                const peck = !scared && Math.max(0, Math.sin(t * 5.5 + h.ph * 2)) > 0.65 ? 0.38 : 0;
                const hop = scared ? Math.abs(Math.sin(t * 9 + h.ph)) * 0.08 : Math.abs(Math.sin(t * 4 + h.ph)) * 0.02;
                h.g.position.set(h.x + Math.cos(w) * 0.28, hop, h.z + Math.sin(w) * 0.22);
                h.g.rotation.y = Math.atan2(Math.cos(w) * 0.22, -Math.sin(w) * 0.28);
                h.g.rotation.x = peck;
            }
        });
    },
    ...EXTRA_BUILD,
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
let PLAZA_MOSAIC = null;
function plazaMosaicTexture() {
    if (PLAZA_MOSAIC) return PLAZA_MOSAIC;
    const S = 512, cx = S / 2, cy = S / 2;
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    g.fillStyle = '#8b8578'; g.fillRect(0, 0, S, S);
    // các vòng đá lát đồng tâm quanh quảng trường
    const rings = 14;
    for (let r = rings; r >= 1; r--) {
        const radOut = (r / rings) * (S * 0.49), radIn = ((r - 1) / rings) * (S * 0.49);
        const segs = Math.max(8, Math.round(r * 7.5));
        for (let i = 0; i < segs; i++) {
            const a0 = (i / segs) * Math.PI * 2 + (r % 2) * (Math.PI / segs);
            const a1 = ((i + 0.92) / segs) * Math.PI * 2 + (r % 2) * (Math.PI / segs);
            const warm = (r === 7 || r === rings) ? 12 : 0;
            const l = 175 + ((i * 17 + r * 31) % 28) + warm;
            g.fillStyle = `rgb(${l},${l - 5 - (r % 3) * 3},${l - 16 - (i % 2) * 5})`;
            g.beginPath();
            g.arc(cx, cy, radOut - 2, a0, a1);
            g.arc(cx, cy, radIn + 2, a1, a0, true);
            g.closePath();
            g.fill();
        }
    }
    // ngôi sao / hoa văn la bàn 8 cánh ở tâm quảng trường
    g.save();
    g.translate(cx, cy);
    for (let i = 0; i < 8; i++) {
        g.rotate(Math.PI / 4);
        g.fillStyle = i % 2 === 0 ? '#d8c39e' : '#a88c64';
        g.beginPath();
        g.moveTo(0, -14); g.lineTo(14, 0); g.lineTo(0, -82); g.lineTo(-14, 0);
        g.closePath(); g.fill();
    }
    g.fillStyle = '#e6d5b8';
    g.beginPath(); g.arc(0, 0, 22, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#756854'; g.lineWidth = 3; g.stroke();
    g.restore();
    // rêu xanh nhạt ở khe đá
    for (let i = 0; i < 45; i++) {
        const ang = (i * 2.399) % (Math.PI * 2), dist = 40 + ((i * 53) % 195);
        g.fillStyle = 'rgba(95, 135, 65, 0.25)';
        g.beginPath(); g.arc(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 5 + (i % 6), 0, Math.PI * 2); g.fill();
    }
    PLAZA_MOSAIC = new THREE.CanvasTexture(c);
    PLAZA_MOSAIC.colorSpace = THREE.SRGBColorSpace;
    return PLAZA_MOSAIC;
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

/**
 * Dựng 1 nhóm vật theo danh sách [kiểu, ...tham số] (cùng các kiểu BUILD của bản đồ) — dùng cho SÂN ĐẤU (src/core/battleScene3d.js):
 * trận đấu dùng lại nhà / tháp / tường / sạp / lều… của bản đồ nên cùng một phong cách. Trả { group, anim: [fn(t)] }.
 */
export async function buildProps(items, style = {}, seedNo = 7) {
    seed = seedNo;
    const group = new THREE.Group(), anim = [], B = new Batch();
    const ctx = { B, group, anim, cover() {}, lam, rnd, pick, style, oldMode: false, props: true };
    for (const [kind, ...args] of items) {
        const f = BUILD[kind];
        if (!f) { console.warn('[world3d] không có kiểu', kind); continue; }
        f(ctx, ...args);
    }
    await loadModels(B.keys());
    B.flush(group);
    return { group, anim };
}
