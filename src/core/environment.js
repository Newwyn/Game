// ============================================================
// CẢNH QUAN ĐẤU TRƯỜNG — cây, đá, bụi hoa quanh rìa (giải thích "bức tường vô hình")
// ============================================================
// Dựng bằng khối cơ bản + toon shading cho cùng phong cách với nhân vật.
// HIỆU NĂNG: ~70 cây × (thân + 4 tán) × 2 (viền) = ~700 lần vẽ mỗi khung nếu để từng khối riêng (máy yếu tụt FPS rõ).
// Cảnh quan đứng yên nên dựng xong thì GỘP mọi khối cùng vật liệu thành 1 khối (bake) -> còn ~30 lần vẽ, hình y hệt.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { scene } from './scene.js';
import { toonMaterial, addOutline } from '../render/toon.js';
import { GROUND_Y } from '../config.js';
import { cameraRig } from './cameraRig.js';

// Khớp ARENA_BOUNDS trong server.js
const BOUNDS = { minX: -48, maxX: 48, minZ: -13, maxZ: 13 };

let seed = 1234;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const geo = {
    trunk: new THREE.CylinderGeometry(0.18, 0.28, 1.4, 8),
    leafA: new THREE.SphereGeometry(1, 12, 10),
    leafB: new THREE.IcosahedronGeometry(1, 1),
    rock: new THREE.DodecahedronGeometry(1, 0),
    flower: new THREE.SphereGeometry(0.09, 6, 5),
};
const mats = {
    trunk: toonMaterial(0x7a5434),
    leaves: [0x5f9a3e, 0x6fae48, 0x4f8a3a, 0x83b552].map(c => toonMaterial(c)),
    rock: [0x9a9a92, 0x8a8f86, 0xa9a69a].map(c => toonMaterial(c)),
    flower: [0xfff1b8, 0xffc7d6, 0xffffff, 0xffd86b].map(c => toonMaterial(c)),
    bush: toonMaterial(0x5a9440),
};

function mesh(g, m, outline = true) {
    const o = new THREE.Mesh(g, m);
    if (outline) addOutline(o, 0.02);
    return o;
}

function makeTree(scale) {
    const tree = new THREE.Group();
    const trunk = mesh(geo.trunk, mats.trunk);
    trunk.position.y = 0.7;
    tree.add(trunk);
    const leaf = pick(mats.leaves);
    [[0, 2.0, 0, 1.15], [0.45, 2.55, 0.1, 0.8], [-0.4, 2.45, -0.15, 0.85], [0.05, 3.05, 0, 0.65]].forEach(([x, y, z, r]) => {
        const l = mesh(rand() > 0.5 ? geo.leafA : geo.leafB, leaf);
        l.position.set(x, y, z);
        l.scale.setScalar(r);
        tree.add(l);
    });
    tree.scale.setScalar(scale);
    tree.rotation.y = rand() * Math.PI * 2;
    return tree;
}

function makeRock(scale) {
    const r = mesh(geo.rock, pick(mats.rock));
    r.scale.set(scale * (0.9 + rand() * 0.5), scale * (0.5 + rand() * 0.3), scale * (0.9 + rand() * 0.4));
    r.rotation.set(rand(), rand() * Math.PI, rand() * 0.3);
    r.position.y = r.scale.y * 0.4;
    return r;
}

function makeBush(scale) {
    const b = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const s = mesh(geo.leafA, mats.bush);
        s.scale.setScalar(0.45 + rand() * 0.2);
        s.position.set((i - 1) * 0.45, 0.35, rand() * 0.2);
        b.add(s);
    }
    for (let i = 0; i < 4; i++) {
        const f = mesh(geo.flower, pick(mats.flower), false);
        f.position.set((rand() - 0.5) * 1.2, 0.6 + rand() * 0.2, 0.3 + rand() * 0.2);
        b.add(f);
    }
    b.scale.setScalar(scale);
    return b;
}

// Đồ trang trí phía trước (gần camera): ẩn khi camera nhìn ngang để không che trận đấu
const frontProps = [];
const backProps = [];

function place(obj, x, z, list = backProps) {
    obj.position.x = x;
    obj.position.z = z;
    obj.position.y += GROUND_Y;
    obj.updateMatrixWorld(true);
    list.push(obj);
}

/** Gộp mọi khối của `objects` theo vật liệu (viền: theo màu + độ dày) thành ít khối lớn đã đặt sẵn vị trí -> 1 Group */
function bake(objects) {
    const buckets = new Map();   // khoá -> { material, geos, renderOrder }
    for (const root of objects) {
        root.traverse(o => {
            if (!o.isMesh) return;
            const m = o.material;
            const key = (o.userData.isOutline
                ? 'o' + m.uniforms.outlineColor.value.getHexString() + m.uniforms.thickness.value
                : 'm' + m.uuid) + (o.geometry.index ? 'i' : 'n');
            if (!buckets.has(key)) buckets.set(key, { material: m, geos: [], renderOrder: o.renderOrder });
            // chỉ giữ thuộc tính chung (vị trí, pháp tuyến, uv) để gộp được mọi loại khối
            const g = new THREE.BufferGeometry();
            for (const a of ['position', 'normal', 'uv']) g.setAttribute(a, o.geometry.getAttribute(a).clone());   // bản sao: khối gốc dùng chung
            if (o.geometry.index) g.setIndex(o.geometry.index);
            buckets.get(key).geos.push(g.applyMatrix4(o.matrixWorld));
        });
    }
    const group = new THREE.Group();
    for (const { material, geos, renderOrder } of buckets.values()) {
        const merged = new THREE.Mesh(mergeGeometries(geos), material);
        merged.renderOrder = renderOrder;
        merged.matrixAutoUpdate = false;
        group.add(merged);
        geos.forEach(g => g.dispose());
    }
    group.userData.persistent = true;
    group.traverse(o => { o.userData.persistent = true; });
    return group;
}

/** Dựng cảnh quan một lần khi khởi động */
export function buildEnvironment() {
    // Hàng cây dày phía sau (xa camera) và hai bên
    for (let x = BOUNDS.minX - 4; x <= BOUNDS.maxX + 4; x += 2.6 + rand() * 1.4) {
        place(makeTree(1.1 + rand() * 0.6), x, BOUNDS.minZ - 3 - rand() * 3);
        if (rand() > 0.5) place(makeTree(0.9 + rand() * 0.5), x + 1.3, BOUNDS.minZ - 7 - rand() * 4);
    }
    for (const side of [-1, 1]) {
        const edgeX = side < 0 ? BOUNDS.minX : BOUNDS.maxX;
        for (let z = BOUNDS.minZ - 2; z <= BOUNDS.maxZ + 4; z += 2.4 + rand() * 1.2) {
            place(makeTree(1 + rand() * 0.6), edgeX + side * (3 + rand() * 2.5), z);
        }
    }
    // Phía trước (gần camera): chỉ đá + bụi thấp để không che nhân vật
    for (let x = BOUNDS.minX; x <= BOUNDS.maxX; x += 3 + rand() * 3) {
        const prop = rand() > 0.55 ? makeRock(0.5 + rand() * 0.5) : makeBush(0.8 + rand() * 0.4);
        place(prop, x, BOUNDS.maxZ + 1.6 + rand() * 1.5, frontProps);
    }

    // Vài tảng đá, bụi hoa lác đác ngoài rìa sau
    for (let i = 0; i < 14; i++) {
        place(makeRock(0.5 + rand() * 0.9), BOUNDS.minX + rand() * (BOUNDS.maxX - BOUNDS.minX), BOUNDS.minZ - 1.2 - rand() * 1.2);
    }

    // Gộp: phía sau + hai bên (luôn hiện) · phía trước (ẩn khi camera nhìn ngang)
    scene.add(bake(backProps));
    const front = bake(frontProps);
    scene.add(front);
    const syncFront = (mode) => { front.visible = mode !== 'combat'; };
    syncFront(cameraRig.getMode());
    cameraRig.onModeChange(syncFront);
}
