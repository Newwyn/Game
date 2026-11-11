// ============================================================
// SÂN ĐẤU DỰNG BẰNG MÔ HÌNH 3D CỦA BẢN ĐỒ THẾ GIỚI (demo 11/2026 — người chơi thích phong cách bản đồ, chê nền trận)
//   Dùng lại bộ mô hình src/assets/world3d (Kenney CC0) + vật liệu lay gió của src/world3d/assets.js
//   -> trận đấu và bản đồ cùng một phong cách. Bật thử: thêm ?bg3d=1 vào địa chỉ trang (cảnh: meadow, forest).
//   Sân đánh (server ARENA_BOUNDS): x ±48, z ±13 — mọi vật cao đặt NGOÀI sân; trong sân chỉ có cỏ / hoa thấp.
//   Mỗi mô hình gom thành InstancedMesh theo (hình, vật liệu) -> vài chục lần vẽ cho cả cảnh.
// ============================================================
import * as THREE from 'three';
import { GROUND_Y } from '../config.js';
import { loadModels, proto, uTime } from '../world3d/assets.js';

export const BG3D = typeof location !== 'undefined' && new URLSearchParams(location.search).get('bg3d') === '1';

const ROUND = ['nature/tree_oak', 'nature/tree_default', 'nature/tree_detailed', 'nature/tree_fat'];
const DARK = ['nature/tree_oak_dark', 'nature/tree_default_dark', 'nature/tree_detailed_dark'];
const PINES = ['nature/tree_pineRoundA', 'nature/tree_pineRoundB', 'nature/tree_pineDefaultA', 'nature/tree_pineDefaultB'];
const BUSH = ['nature/plant_bush', 'nature/plant_bushDetailed', 'nature/plant_bushLarge', 'nature/plant_bushSmall'];
const ROCK = ['nature/rock_largeA', 'nature/rock_largeB', 'nature/rock_largeC', 'nature/rock_tallA', 'nature/rock_smallA', 'nature/rock_smallFlatA'];
const FLOWER = ['nature/flower_purpleA', 'nature/flower_redA', 'nature/flower_yellowA', 'nature/flower_purpleB', 'nature/flower_redB', 'nature/flower_yellowB'];
const GRASS = ['nature/grass', 'nature/grass_large'];
const SHROOM = ['nature/mushroom_red', 'nature/mushroom_redGroup', 'nature/mushroom_tan', 'nature/mushroom_tanGroup'];

function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

/** Danh sách vật: [khoá mô hình, x, z, cao (đơn vị thế giới), xoay] — cùng 1 công thức cho đồng cỏ và rừng (rừng: thông + tối hơn) */
function layout(kind) {
    const R = rng(kind === 'forest' ? 911 : 407), items = [];
    const pick = (a) => a[Math.floor(R() * a.length)];
    const put = (key, x, z, h, ry = R() * 6.28) => items.push([key, x, z, h, ry]);
    const forest = kind === 'forest';
    // 1) Hàng cây sát sân (z -17..-21): thân to, tán rõ -> viền sân
    for (let x = -56; x <= 56; x += 5 + R() * 3) put(pick(forest ? [...PINES, ...ROUND] : ROUND), x + R() * 2, -17.5 - R() * 3.5, 8 + R() * 3.5);
    // 2) Rừng giữa (z -23..-33): dày hơn, cao hơn, màu tối dần
    for (let x = -64; x <= 64; x += 3.6 + R() * 2.4) put(pick(forest ? [...PINES, ...DARK] : [...ROUND, ...DARK]), x, -23 - R() * 10, 10 + R() * 5);
    // 3) Rừng xa (z -36..-52): bóng cây thẫm chìm trong sương
    for (let x = -80; x <= 80; x += 4 + R() * 3) put(pick(forest ? PINES : DARK), x, -36 - R() * 16, 13 + R() * 7);
    // 4) Hai bên sân (ngoài x ±52): cây + bụi khép cảnh
    for (const side of [-1, 1]) for (let z = -14; z <= 16; z += 4 + R() * 2.5) {
        put(pick(forest ? PINES : ROUND), side * (54 + R() * 6), z, 8 + R() * 4);
        put(pick(BUSH), side * (51.5 + R() * 2), z + 2, 1.6 + R() * 1.2);
    }
    // 5) Viền sau sân (z -14..-17): bụi, đá, gốc cây, khúc gỗ, nấm, hoa — lớp chi tiết gần nhân vật nhất
    for (let x = -52; x <= 52; x += 2.2 + R() * 2.6) {
        const t = R(), z = -14.4 - R() * 2.4;
        if (t < 0.42) put(pick(BUSH), x, z, 1.4 + R() * 1.5);
        else if (t < 0.62) put(pick(ROCK), x, z, 0.9 + R() * 1.6);
        else if (t < 0.72) put(pick(['nature/stump_old', 'nature/stump_round', 'nature/log', 'nature/log_large']), x, z, 0.8 + R() * 0.5);
        else if (t < 0.84) put(pick(SHROOM), x, z, 0.6 + R() * 0.4);
        else put(pick(FLOWER), x, z, 0.8 + R() * 0.4);
    }
    // 6) Vài điểm nhấn: đống củi + lửa trại tắt, lều nhỏ (đồng cỏ) / đá dựng (rừng)
    put('nature/log_stackLarge', -30, -16.5, 2.2, 0.4);
    put('nature/campfire_stones', 22, -15.8, 0.7, 0);
    put('nature/campfire_logs', 22, -15.8, 0.8, 0.6);
    if (forest) { put('nature/rock_tallB', -12, -17.5, 4.2, 1); put('nature/rock_tallA', 38, -18, 3.6, 2); put('nature/statue_obelisk', 6, -18.5, 5, 0); }
    else { put('nature/tent_detailedOpen', -6, -18.5, 3.6, 0.2); put('nature/sign', 36, -15.6, 1.8, -0.3); }
    // 7) Trong sân: cỏ + hoa THẤP rải thưa (không che nhân vật, lay theo gió) — dày hơn ở mép, thưa ở giữa lối đánh
    for (let i = 0; i < 360; i++) {
        const x = -52 + R() * 104, z = -13.5 + R() * 28;
        if (Math.abs(z) < 6 && R() < 0.8) continue;   // giữa sân (nơi nhân vật đứng): gần như để trống
        if (z > 8 && R() < 0.5) continue;              // sát máy quay: thưa bớt cho đỡ che
        if (R() < 0.16) put(pick(FLOWER), x, z, 0.3 + R() * 0.2); else put(pick(GRASS), x, z, 0.16 + R() * 0.16);
    }
    return items;
}
/** Lớp trước mặt (sát máy quay, chỉ hiện ngoài lúc đánh): bụi + đá mờ khung dưới */
function frontLayout(kind) {
    const R = rng(77), items = [];
    for (let x = -50; x <= 50; x += 6 + R() * 5) items.push([BUSH[Math.floor(R() * BUSH.length)], x, 16.5 + R() * 2, 1.6 + R() * 1.4, R() * 6.28]);
    return items;
}

let swaying = false;
const heights = new Map();
function modelHeight(key) {
    if (heights.has(key)) return heights.get(key);
    const box = new THREE.Box3();
    for (const p of proto(key)) { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox); }
    const h = Math.max(0.05, box.max.y - Math.max(0, box.min.y));
    heights.set(key, h);
    return h;
}
function fill(group, items) {
    const byKey = new Map();
    for (const it of items) { if (!byKey.has(it[0])) byKey.set(it[0], []); byKey.get(it[0]).push(it); }
    const o = new THREE.Object3D();
    for (const [key, list] of byKey) {
        const parts = proto(key);
        if (!parts.length) continue;
        const mh = modelHeight(key);
        for (const p of parts) {
            const mesh = new THREE.InstancedMesh(p.geo, p.mat, list.length);
            list.forEach(([, x, z, h, ry], i) => {
                const s = h / mh;
                o.position.set(x, GROUND_Y, z); o.rotation.set(0, ry, 0); o.scale.set(s, s, s); o.updateMatrix();
                mesh.setMatrixAt(i, o.matrix);
            });
            mesh.instanceMatrix.needsUpdate = true;
            mesh.frustumCulled = false;   // cảnh trải rộng 2 bên máy quay: tính khung bao theo từng bản sao tốn hơn là vẽ luôn
            mesh.userData.persistent = true;
            group.add(mesh);
        }
    }
}

/** Dựng cảnh 3D cho `kind` ('meadow' | 'forest'); trả về ngay 2 nhóm rỗng, mô hình hiện ra khi tải xong */
export function createModelScene(kind) {
    const rear = new THREE.Group(), foreground = new THREE.Group();
    const items = layout(kind), front = frontLayout(kind);
    loadModels([...items, ...front].map(i => i[0])).then(() => { fill(rear, items); fill(foreground, front); });
    if (!swaying) { swaying = true; const tick = () => { uTime.value = performance.now() / 1000; requestAnimationFrame(tick); }; requestAnimationFrame(tick); }   // gió lay cỏ cây
    return { rear, foreground };
}
export const MODEL_SCENES = new Set(['meadow', 'forest']);
