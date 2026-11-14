// ============================================================
// Bản đồ 3D — đồ trang trí đặc trưng 7 vùng, hiệu ứng sức sống (chim, thú nhỏ, bóng cây, nước, hạt bay) & vẽ ô nhảy
// ============================================================
import * as THREE from 'three';
import { MESHY_HAS, MESHY_ON, meshyPut } from './meshy.js';
import { uTime, uHeroPos, uQuality, patchMaterial, PAINT } from './assets.js';

const Y = new THREE.Vector3(0, 1, 0);

const mesh = (ctx, geo, mat, x, y, z, rotY = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.castShadow = m.receiveShadow = true;
    ctx.group.add(m);
    return m;
};

let CANOPY_TEX = null;
function canopyShadowTexture() {
    if (CANOPY_TEX) return CANOPY_TEX;
    const S = 128, c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.clearRect(0, 0, S, S);
    // các đốm lá cây chồng lên nhau tạo bóng tán cây mềm có kẽ nắng
    const blobs = [
        [64, 64, 48, 0.42], [44, 52, 28, 0.32], [82, 54, 26, 0.32],
        [52, 80, 28, 0.30], [78, 76, 25, 0.28], [64, 42, 24, 0.25],
    ];
    for (const [bx, by, br, a] of blobs) {
        const gr = g.createRadialGradient(bx, by, br * 0.1, bx, by, br);
        gr.addColorStop(0, `rgba(18, 28, 12, ${a})`);
        gr.addColorStop(0.65, `rgba(18, 28, 12, ${a * 0.55})`);
        gr.addColorStop(1, 'rgba(18, 28, 12, 0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, S, S);
    }
    // vài đốm nắng xuyên qua tán lá
    g.globalCompositeOperation = 'destination-out';
    for (const [sx, sy, sr] of [[56, 58, 9], [74, 66, 8], [50, 72, 7]]) {
        const gr = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
        gr.addColorStop(0, 'rgba(0,0,0,0.55)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, S, S);
    }
    CANOPY_TEX = new THREE.CanvasTexture(c);
    return CANOPY_TEX;
}

// ============================================================
// 1. Đồ trang trí đặc trưng cho 6 vùng còn lại (bổ sung vào BUILD)
// ============================================================
export const EXTRA_BUILD = {
    /** Kho thóc nhỏ kê sàn gỗ cao (Outskirts) */
    granary(ctx, x, z, r = 0) {
        if (meshyPut(ctx, 'prop_granary', x, z, 3.2, r, [x - 1.2, z - 1.2, x + 1.2, z + 1.2])) return;   // (14/11) Meshy
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; ctx.group.add(g);
        const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
        [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].forEach(([dx, dz]) => {
            add(new THREE.CylinderGeometry(0.1, 0.12, 0.55, 6), ctx.lam(0x5e3e26), dx, 0.27, dz);
            add(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 8), ctx.lam(0x8a857a), dx, 0.55, dz);
        });
        add(new THREE.BoxGeometry(1.5, 0.1, 1.5), ctx.lam(0x7d5230), 0, 0.62, 0);
        add(new THREE.CylinderGeometry(0.68, 0.72, 1.25, 8), ctx.lam(0xa8743f), 0, 1.28, 0);
        add(new THREE.ConeGeometry(0.95, 0.85, 8), ctx.lam(0xd4a448), 0, 2.25, 0);
        add(new THREE.BoxGeometry(0.38, 0.52, 0.06), ctx.lam(0x5a3a1e), 0, 1.15, 0.68);
        ctx.cover(x - 0.85, z - 0.85, x + 0.85, z + 0.85);
    },
    /** Xe goòng chở quặng ở mỏ đá (Outskirts) */
    mineCart(ctx, x, z, r = 0) {
        if (meshyPut(ctx, 'prop_minecart', x, z, 1.0, r)) return;   // (14/11) Meshy
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; ctx.group.add(g);
        const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
        add(new THREE.BoxGeometry(0.85, 0.48, 0.62), ctx.lam(0x4a4e54), 0, 0.38, 0);
        add(new THREE.BoxGeometry(0.92, 0.07, 0.68), ctx.lam(0x2f3338), 0, 0.62, 0);
        [[-0.28, -0.32], [0.28, -0.32], [-0.28, 0.32], [0.28, 0.32]].forEach(([dx, dz]) => {
            const w = add(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 8), ctx.lam(0x2b2d30), dx, 0.14, dz);
            w.rotation.x = Math.PI / 2;
        });
        // đá & quặng vàng nhô trên miệng xe
        const oreMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, emissive: 0x9a7400, emissiveIntensity: 0.25, roughness: 0.4, flatShading: true });
        patchMaterial(oreMat, { sway: 0, occlude: true, cloud: true });
        [[-0.18, 0.66, 0.05], [0.15, 0.68, -0.06], [0.02, 0.72, 0.08]].forEach(([ox, oy, oz], i) => {
            add(new THREE.DodecahedronGeometry(0.16, 0), i % 2 === 0 ? oreMat : ctx.lam(0x75726b), ox, oy, oz);
        });
        ctx.cover(x - 0.55, z - 0.55, x + 0.55, z + 0.55);
    },
    /** Đống quặng lấp lánh ở mỏ đá (Outskirts) */
    orePile(ctx, x, z, color = 0xd4a038) {
        if (meshyPut(ctx, 'prop_orepile', x, z, 0.85, (x + z) % 6.28)) return;   // (14/11) Meshy
        const rockMat = ctx.lam(0x6e6b64);
        const oreMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.22, roughness: 0.45, flatShading: true });
        patchMaterial(oreMat, { sway: 0, occlude: true, cloud: true });
        const pts = [[0, 0.22, 0, 0.38], [-0.28, 0.15, 0.18, 0.26], [0.26, 0.16, 0.14, 0.25], [0.08, 0.14, -0.24, 0.24]];
        pts.forEach(([dx, dy, dz, r], i) => {
            const m = mesh(ctx, new THREE.DodecahedronGeometry(r, 0), i === 0 ? rockMat : oreMat, x + dx, dy, z + dz, i * 1.1);
            m.scale.y = 0.78;
        });
        ctx.B.put('survival/tool-pickaxe', x + 0.38, 0, z - 0.15, 0.6, 2.0);
        ctx.cover(x - 0.55, z - 0.55, x + 0.55, z + 0.55);
    },
    /** Giàn gỗ trục kéo ở mỏ đá (Outskirts) */
    mineRig(ctx, x, z, r = 0) {
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; ctx.group.add(g);
        const wood = ctx.lam(0x6a4526), dark = ctx.lam(0x4a3219), rope = ctx.lam(0xc8b48a);
        const add = (geo, mat, px, py, pz, rx = 0, rz = 0) => {
            const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.rotation.x = rx; m.rotation.z = rz;
            m.castShadow = m.receiveShadow = true; g.add(m); return m;
        };
        add(new THREE.BoxGeometry(0.14, 2.3, 0.14), wood, -0.65, 1.1, -0.35, 0.15, 0);
        add(new THREE.BoxGeometry(0.14, 2.3, 0.14), wood, -0.65, 1.1, 0.35, -0.15, 0);
        add(new THREE.BoxGeometry(0.14, 2.3, 0.14), wood, 0.65, 1.1, -0.35, 0.15, 0);
        add(new THREE.BoxGeometry(0.14, 2.3, 0.14), wood, 0.65, 1.1, 0.35, -0.15, 0);
        add(new THREE.BoxGeometry(1.6, 0.16, 0.16), dark, 0, 2.18, 0);
        const wheel = add(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 10), dark, 0, 1.98, 0, Math.PI / 2, 0);
        const bucketG = new THREE.Group(); bucketG.position.set(0, 1.95, 0); g.add(bucketG);
        const line = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 5), rope); line.position.y = -0.55; bucketG.add(line);
        const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.28, 8), wood); bucket.position.y = -1.15; bucket.castShadow = true; bucketG.add(bucket);
        ctx.anim.push((t) => {
            bucketG.rotation.z = Math.sin(t * 1.5 + x) * 0.08;
            wheel.rotation.y = Math.sin(t * 1.5 + x) * 0.4;
        });
        ctx.cover(x - 0.8, z - 0.6, x + 0.8, z + 0.6);
    },

    /** Khúc gỗ đổ phủ rêu + nấm nhỏ (Rừng Sương) */
    mossyLog(ctx, x, z, r = 0, s = 1.8) {
        ctx.B.put('nature/log_large', x, 0, z, r, s);
        const moss = mesh(ctx, new THREE.BoxGeometry(0.75 * (s / 1.8), 0.12, 0.28 * (s / 1.8)), ctx.lam(0x4b8b3b), x, 0.32 * (s / 1.8), z, r);
        moss.scale.set(1, 0.7, 1);
        ctx.B.put('nature/mushroom_tanGroup', x + Math.cos(r) * 0.35, 0, z - Math.sin(r) * 0.35, r, 1.4);
        ctx.cover(x - 0.6, z - 0.6, x + 0.6, z + 0.6);
    },
    /** Tảng đá phủ rêu xanh (Rừng Sương) */
    mossyRock(ctx, x, z, s = 1.5) {
        ctx.B.put('nature/rock_largeA', x, 0, z, ctx.rnd() * 6, s);
        const cap = mesh(ctx, new THREE.SphereGeometry(0.38 * s, 7, 5), ctx.lam(0x4a8538), x, 0.36 * s, z);
        cap.scale.set(1.15, 0.38, 1.05);
        ctx.cover(x - 0.55, z - 0.55, x + 0.55, z + 0.55);
    },
    /** Bụi dương xỉ xoè tán rộng (Rừng Sương) */
    fernCluster(ctx, x, z, s = 1.5) {
        ctx.B.put('nature/plant_flatTall', x, 0, z, ctx.rnd() * 6, s * 1.15);
        ctx.B.put('nature/grass_leafsLarge', x + 0.22, 0, z - 0.15, ctx.rnd() * 6, s);
        ctx.B.put('nature/grass_leafsLarge', x - 0.2, 0, z + 0.18, ctx.rnd() * 6, s * 0.95);
    },
    /** Trại bỏ hoang trong Rừng Sương */
    abandonedCamp(ctx, x, z, r = 0) {
        ctx.B.put('nature/tent_smallClosed', x, 0, z, r + 0.25, 1.9);
        ctx.B.put('nature/campfire_stones', x + 1.15, 0, z + 0.45, 0, 1.8);
        ctx.B.put('nature/log', x + 1.15, 0, z + 1.15, 0.2, 1.6);
        ctx.B.put('survival/box', x - 0.85, 0, z + 0.55, 0.6, 1.9);
        ctx.B.put('survival/bucket', x + 0.55, 0, z + 0.75, 1.1, 1.6);
        ctx.cover(x - 1.1, z - 0.8, x + 1.6, z + 1.4);
    },
    /** Đom đóm lập loè bay lơ lửng trong Rừng Sương */
    fireflies(ctx, spots) {
        const geo = new THREE.SphereGeometry(0.055, 6, 5);
        const list = [];
        for (let i = 0; i < spots.length; i++) {
            const [bx, bz] = spots[i];
            for (let j = 0; j < 2; j++) {
                const mat = new THREE.MeshBasicMaterial({ color: j === 0 ? 0xb8ff66 : 0x7ef9ff, transparent: true, opacity: 0.9, depthWrite: false });
                const m = new THREE.Mesh(geo, mat);
                ctx.group.add(m);
                list.push({ m, mat, x: bx + (j - 0.5) * 0.6, z: bz + (j - 0.5) * 0.4, ph: i * 1.9 + j * 2.7 });
            }
        }
        ctx.anim.push((t) => {
            const low = uQuality.value < 0.5;
            for (let i = 0; i < list.length; i++) {
                const f = list[i];
                if (low && i % 2 === 1) { f.m.visible = false; continue; }
                f.m.visible = true;
                const a = t * 0.85 + f.ph;
                f.m.position.set(f.x + Math.cos(a) * 0.75, 0.45 + Math.sin(t * 1.9 + f.ph) * 0.28, f.z + Math.sin(a * 0.9) * 0.65);
                const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(t * 3.8 + f.ph * 1.3));
                f.mat.opacity = pulse;
                f.m.scale.setScalar(0.6 + pulse * 0.65);
            }
        });
    },
    /** Lớp sương mỏng là là sát mặt đất */
    groundFog(ctx, x, z, rx = 4.2, rz = 3.0) {
        const g = new THREE.CircleGeometry(1, 16); g.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xdff7f2, transparent: true, opacity: 0.13, depthWrite: false, fog: false });
        const m = new THREE.Mesh(g, mat);
        m.position.set(x, 0.18, z);
        m.scale.set(rx, 1, rz);
        m.renderOrder = 4;
        ctx.group.add(m);
        const ph = x * 0.37 + z * 0.51;
        ctx.anim.push((t) => {
            m.position.x = x + Math.sin(t * 0.22 + ph) * 0.75;
            m.position.z = z + Math.cos(t * 0.18 + ph) * 0.45;
            mat.opacity = 0.09 + 0.05 * Math.sin(t * 0.45 + ph);
        });
    },

    /** Cột mốc đá ven Đường Vương Đạo */
    milestone(ctx, x, z) {
        if (meshyPut(ctx, 'prop_milestone', x, z, 1.1, 0)) return;   // (14/11) Meshy
        mesh(ctx, new THREE.BoxGeometry(0.52, 0.18, 0.52), ctx.lam(0x8a857a), x, 0.09, z);
        mesh(ctx, new THREE.BoxGeometry(0.36, 0.82, 0.28), ctx.lam(0xb5afa2), x, 0.56, z);
        mesh(ctx, new THREE.CylinderGeometry(0.18, 0.18, 0.28, 8), ctx.lam(0xb5afa2), x, 0.97, z).rotation.x = Math.PI / 2;
        mesh(ctx, new THREE.BoxGeometry(0.24, 0.22, 0.03), ctx.lam(0xc0392b), x, 0.66, z + 0.14);
        ctx.cover(x - 0.35, z - 0.35, x + 0.35, z + 0.35);
    },
    /** Xe hàng hỏng ven đường (Đường Vương Đạo) */
    brokenCart(ctx, x, z, r = 0.35) {
        if (meshyPut(ctx, 'prop_cart', x, z, 1.1, r)) return;   // (14/11) Meshy
        ctx.B.put('town/cart', x, 0.05, z, r, 1.25);
        ctx.B.put('town/wheel', x + 0.85, 0.08, z + 0.35, r + 0.8, 1.2);
        ctx.B.put('survival/box', x - 0.65, 0, z + 0.45, 0.4, 2.0);
        const g = new THREE.SphereGeometry(0.22, 7, 6), mat = ctx.lam(0xc8ad7f);
        for (let i = 0; i < 2; i++) {
            const s = mesh(ctx, g, mat, x + 0.45 + i * 0.26, 0.18, z - 0.55 + (i % 2) * 0.15, i);
            s.scale.set(1.05, 0.85, 0.95);
        }
        ctx.cover(x - 0.9, z - 0.7, x + 1.0, z + 0.7);
    },
    /** Lửa trại đang cháy bập bùng + khói ấm (Đường Vương Đạo) */
    campfireLit(ctx, x, z) {
        if (MESHY_ON && MESHY_HAS.has('prop_campfire')) { meshyPut(ctx, 'prop_campfire', x, z, 1.0, 0); const l = new THREE.PointLight(0xff9a40, 1.4, 6, 2); l.position.set(x, 0.8, z); ctx.group.add(l); ctx.anim.push((t) => { l.intensity = 1.3 + Math.sin(t * 11) * 0.2 + Math.sin(t * 7.3) * 0.15; }); return; }   // (14/11) Meshy
        ctx.B.put('nature/campfire_stones', x, 0, z, 0, 1.9);
        ctx.B.put('nature/campfire_logs', x, 0.04, z, 0.4, 1.85);
        const fMat1 = new THREE.MeshBasicMaterial({ color: 0xff6b1a });
        const fMat2 = new THREE.MeshBasicMaterial({ color: 0xffe066 });
        const f1 = mesh(ctx, new THREE.ConeGeometry(0.24, 0.58, 6), fMat1, x, 0.36, z);
        const f2 = mesh(ctx, new THREE.ConeGeometry(0.15, 0.44, 5), fMat2, x + 0.04, 0.38, z - 0.03);
        f1.castShadow = f2.castShadow = false;
        const light = new THREE.PointLight(0xff8c3b, 1.1, 4.5, 2);
        light.position.set(x, 0.75, z);
        ctx.group.add(light);
        ctx.anim.push((t) => {
            const s1 = 0.85 + Math.sin(t * 9.5 + x) * 0.18;
            const s2 = 0.85 + Math.cos(t * 12.3 + z) * 0.22;
            f1.scale.set(1, s1, 1);
            f2.scale.set(1, s2, 1);
            light.intensity = 0.95 + Math.sin(t * 8.2 + x) * 0.28;
        });
        ctx.cover(x - 0.65, z - 0.65, x + 0.65, z + 0.65);
    },
    /** Đuốc lửa ven đường / đầu cầu (Đường Vương Đạo) */
    roadTorch(ctx, x, z) {
        if (MESHY_ON && MESHY_HAS.has('prop_torch')) { meshyPut(ctx, 'prop_torch', x, z, 2.0, 0); const l = new THREE.PointLight(0xffa040, 1.1, 5, 2); l.position.set(x, 2.0, z); ctx.group.add(l); ctx.anim.push((t) => { l.intensity = 1 + Math.sin(t * 9 + x) * 0.15; }); return; }   // (14/11) Meshy
        mesh(ctx, new THREE.CylinderGeometry(0.06, 0.08, 1.55, 6), ctx.lam(0x5a3a1e), x, 0.77, z);
        mesh(ctx, new THREE.CylinderGeometry(0.14, 0.09, 0.16, 6), ctx.lam(0x3a3d42), x, 1.55, z);
        const flame = mesh(ctx, new THREE.ConeGeometry(0.12, 0.32, 5), new THREE.MeshBasicMaterial({ color: 0xffaa2b }), x, 1.74, z);
        flame.castShadow = false;
        ctx.anim.push((t) => {
            flame.scale.set(1 + Math.sin(t * 10 + x) * 0.12, 0.88 + Math.cos(t * 13 + z) * 0.2, 1);
        });
        ctx.cover(x - 0.25, z - 0.25, x + 0.25, z + 0.25);
    },
    /** Giá giáo mác & khiên ở trạm gác (Đường Vương Đạo) */
    weaponRack(ctx, x, z, r = 0) {
        if (meshyPut(ctx, 'prop_weaponrack', x, z, 1.6, r)) return;   // (14/11) Meshy
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; ctx.group.add(g);
        const wood = ctx.lam(0x6a4526), steel = ctx.lam(0xb8c2cc), shield = ctx.lam(0xc0392b), gold = ctx.lam(0xf1c40f);
        const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
        add(new THREE.BoxGeometry(1.1, 0.9, 0.12), wood, 0, 0.45, 0);
        for (const dx of [-0.36, 0, 0.36]) {
            add(new THREE.CylinderGeometry(0.025, 0.025, 1.65, 5), wood, dx, 0.85, 0.07);
            add(new THREE.ConeGeometry(0.06, 0.24, 4), steel, dx, 1.74, 0.07);
        }
        add(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 10), shield, 0, 0.52, 0.12).rotation.x = Math.PI / 2;
        add(new THREE.SphereGeometry(0.07, 6, 5), gold, 0, 0.52, 0.16);
        ctx.cover(x - 0.65, z - 0.35, x + 0.65, z + 0.35);
    },

    /** Tượng hiệp sĩ trên bệ đá cẩm thạch (Kinh thành Valoria) */
    statue(ctx, x, z, r = 0) {
        if (meshyPut(ctx, 'town_statue', x, z, 2.4, r)) return;   // (14/11) Meshy
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; ctx.group.add(g);
        const stone = ctx.lam(0xdcd6c8), marble = ctx.lam(0xede9df), gold = ctx.lam(0xd4af37);
        const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
        add(new THREE.BoxGeometry(1.1, 0.28, 1.1), stone, 0, 0.14, 0);
        add(new THREE.BoxGeometry(0.82, 0.72, 0.82), marble, 0, 0.64, 0);
        add(new THREE.BoxGeometry(0.92, 0.12, 0.92), stone, 0, 1.04, 0);
        // thân tượng hiệp sĩ
        add(new THREE.CylinderGeometry(0.22, 0.26, 0.95, 8), marble, 0, 1.56, 0);
        add(new THREE.BoxGeometry(0.56, 0.24, 0.32), marble, 0, 1.88, 0);
        add(new THREE.SphereGeometry(0.18, 8, 6), marble, 0, 2.22, 0);
        // thanh kiếm chống phía trước
        add(new THREE.BoxGeometry(0.06, 0.95, 0.04), gold, 0, 1.55, 0.24);
        add(new THREE.BoxGeometry(0.28, 0.05, 0.05), gold, 0, 1.92, 0.24);
        ctx.cover(x - 0.65, z - 0.65, x + 0.65, z + 0.65);
    },
    /** Chậu cây cắt tỉa hoàng gia (Kinh thành Valoria) */
    topiary(ctx, x, z, shape = 'sphere') {
        if (meshyPut(ctx, 'town_topiary', x, z, 1.5, 0)) return;   // (14/11) Meshy
        ctx.B.put('nature/pot_large', x, 0, z, 0, 1.55);
        const leafMat = ctx.lam(0x3b8c3b);
        if (shape === 'cone') {
            mesh(ctx, new THREE.ConeGeometry(0.42, 1.15, 8), leafMat, x, 1.05, z);
        } else {
            mesh(ctx, new THREE.DodecahedronGeometry(0.42, 1), leafMat, x, 0.85, z);
            mesh(ctx, new THREE.DodecahedronGeometry(0.28, 1), leafMat, x, 1.42, z);
        }
        ctx.cover(x - 0.45, z - 0.45, x + 0.45, z + 0.45);
    },
    /** Ghế đá chạm khắc (Kinh thành / Vùng Elf) */
    stoneBench(ctx, x, z, r = 0) {
        if (meshyPut(ctx, 'town_bench', x, z, 0.9, r)) return;   // (14/11) Meshy
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; ctx.group.add(g);
        const mat = ctx.lam(0xd8d2c5);
        const add = (geo, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
        add(new THREE.BoxGeometry(1.25, 0.1, 0.46), 0, 0.42, 0);
        add(new THREE.BoxGeometry(1.25, 0.36, 0.08), 0, 0.64, -0.19);
        add(new THREE.BoxGeometry(0.14, 0.4, 0.42), -0.5, 0.2, 0);
        add(new THREE.BoxGeometry(0.14, 0.4, 0.42), 0.5, 0.2, 0);
        ctx.cover(x - 0.65, z - 0.35, x + 0.65, z + 0.35);
    },
    /** Cờ phướn hoàng gia đung đưa nhẹ theo gió (Kinh thành) */
    royalBanner(ctx, x, z, color = 0x3f6fc6) {
        if (meshyPut(ctx, 'town_banner', x, z, 2.6, 0)) return;   // (14/11) Meshy
        mesh(ctx, new THREE.CylinderGeometry(0.06, 0.07, 2.5, 6), ctx.lam(0x5a3e28), x, 1.25, z);
        mesh(ctx, new THREE.BoxGeometry(0.75, 0.07, 0.07), ctx.lam(0xd4af37), x, 2.42, z);
        const piv = new THREE.Group(); piv.position.set(x, 2.4, z + 0.06); ctx.group.add(piv);
        const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.35, 0.04), ctx.lam(color));
        cloth.position.y = -0.68; cloth.castShadow = true; piv.add(cloth);
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.05), ctx.lam(0xf1c40f));
        crest.position.y = -0.55; piv.add(crest);
        ctx.anim.push((t) => { piv.rotation.x = 0.06 + Math.sin(t * 2.0 + x * 0.7) * 0.1; });
        ctx.cover(x - 0.35, z - 0.35, x + 0.35, z + 0.35);
    },

    /** Đèn lồng treo phát sáng kiểu Elf (Sylvaren / Lunaria) */
    elfLantern(ctx, x, z, color = 0x7ef9ff) {
        if (MESHY_ON && MESHY_HAS.has('prop_elflantern')) { meshyPut(ctx, 'prop_elflantern', x, z, 2.2, 0); const l = new THREE.PointLight(color, 0.8, 4, 2); l.position.set(x, 1.8, z); ctx.group.add(l); return; }   // (14/11) Meshy
        const wood = ctx.lam(0x6e5544), gold = ctx.lam(0xd8c398);
        mesh(ctx, new THREE.CylinderGeometry(0.06, 0.09, 2.15, 6), wood, x, 1.07, z);
        const arm = mesh(ctx, new THREE.BoxGeometry(0.62, 0.07, 0.07), wood, x + 0.26, 2.12, z);
        arm.rotation.z = 0.18;
        const piv = new THREE.Group(); piv.position.set(x + 0.52, 2.15, z); ctx.group.add(piv);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 6), gold); cap.position.y = -0.14; piv.add(cap);
        const glowMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.85, roughness: 0.2 });
        patchMaterial(glowMat, { sway: 0, occlude: true, cloud: false });
        const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glowMat); orb.position.y = -0.32; piv.add(orb);
        ctx.anim.push((t) => {
            piv.rotation.z = Math.sin(t * 1.8 + x) * 0.1;
            glowMat.emissiveIntensity = 0.7 + Math.sin(t * 3.1 + z) * 0.25;
        });
        ctx.cover(x - 0.35, z - 0.35, x + 0.55, z + 0.35);
    },
    /** Khóm hoa phát quang (Sylvaren / Lunaria) */
    glowFlower(ctx, x, z, color = 0x80ffea) {
        const stemMat = ctx.lam(0x2f7d4f);
        const petalMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.65, roughness: 0.35 });
        patchMaterial(petalMat, { sway: 0.08, occlude: false, cloud: false });
        for (let i = 0; i < 3; i++) {
            const a = i * 2.1 + x, dx = Math.cos(a) * 0.18, dz = Math.sin(a) * 0.18, h = 0.28 + (i % 2) * 0.08;
            mesh(ctx, new THREE.CylinderGeometry(0.02, 0.025, h, 5), stemMat, x + dx, h / 2, z + dz);
            const fl = mesh(ctx, new THREE.SphereGeometry(0.1, 6, 5), petalMat, x + dx, h + 0.04, z + dz);
            fl.scale.set(1.3, 0.65, 1.3);
            fl.castShadow = false;
        }
    },
    /** Cột đá khắc cổ ngữ phát sáng (Sylvaren / Lunaria) */
    runePillar(ctx, x, z, color = 0x6ee7ff) {
        if (meshyPut(ctx, 'prop_runepillar', x, z, 2.2, (x * 2 + z) % 6.28)) return;   // (14/11) Meshy
        ctx.B.put('nature/statue_obelisk', x, 0, z, 0, 1.85);
        const runeMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.85, roughness: 0.3 });
        patchMaterial(runeMat, { sway: 0, occlude: true, cloud: false });
        for (let i = 0; i < 3; i++) {
            const band = mesh(ctx, new THREE.BoxGeometry(0.36, 0.06, 0.36), runeMat, x, 0.55 + i * 0.42, z);
            band.castShadow = false;
        }
        ctx.anim.push((t) => { runeMat.emissiveIntensity = 0.65 + Math.sin(t * 2.4 + x) * 0.3; });
        ctx.cover(x - 0.45, z - 0.45, x + 0.45, z + 0.45);
    },
    /** Cụm pha lê phát sáng (Sylvaren / Lunaria) */
    crystalCluster(ctx, x, z, color = 0x64dfdf, s = 1) {
        if (MESHY_ON && MESHY_HAS.has('prop_crystal')) { meshyPut(ctx, 'prop_crystal', x, z, 1.2 * s, (x + z * 2) % 6.28); const l = new THREE.PointLight(color, 0.7, 3.5, 2); l.position.set(x, 0.9 * s, z); ctx.group.add(l); return; }   // (14/11) Meshy
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.2, flatShading: true });
        patchMaterial(mat, { sway: 0, occlude: true, cloud: false });
        const shards = [
            [0, 0.42, 0, 0.16, 0.85, 0, 0],
            [-0.18, 0.28, 0.1, 0.12, 0.58, 0.2, 0.28],
            [0.18, 0.3, -0.08, 0.13, 0.62, -0.18, -0.25],
            [0.05, 0.22, 0.18, 0.1, 0.45, 0.32, -0.1],
        ];
        for (const [dx, dy, dz, r, h, rx, rz] of shards) {
            const c = new THREE.Mesh(new THREE.ConeGeometry(r * s, h * s, 5), mat);
            c.position.set(x + dx * s, dy * s, z + dz * s);
            c.rotation.set(rx, 0, rz);
            c.castShadow = true;
            ctx.group.add(c);
        }
        ctx.cover(x - 0.4 * s, z - 0.4 * s, x + 0.4 * s, z + 0.4 * s);
    },
    /** Cổng vòm đá cổ ngữ Elf (Sylvaren / Lunaria) */
    moonArch(ctx, x, z, r = 0) {
        if (meshyPut(ctx, 'prop_moonarch', x, z, 3.8, r)) return;   // (14/11) Meshy
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; ctx.group.add(g);
        const stone = ctx.lam(0xe4ddd3), glow = new THREE.MeshStandardMaterial({ color: 0x8ef9ff, emissive: 0x56cfe1, emissiveIntensity: 0.75 });
        patchMaterial(glow, { sway: 0, occlude: true, cloud: false });
        const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
        add(new THREE.CylinderGeometry(0.2, 0.24, 2.4, 8), stone, -0.95, 1.2, 0);
        add(new THREE.CylinderGeometry(0.2, 0.24, 2.4, 8), stone, 0.95, 1.2, 0);
        add(new THREE.BoxGeometry(2.35, 0.24, 0.42), stone, 0, 2.45, 0);
        add(new THREE.OctahedronGeometry(0.22, 0), glow, 0, 2.78, 0);
        ctx.cover(x - 1.1, z - 0.4, x + 1.1, z + 0.4);
    },
};

// ============================================================
// 2. Vẽ tính năng NHẢY: heights ("0"|"1"|"2"), gaps (khe suối / hố), stones (phiến đá nổi)
// ============================================================
export function buildJumpFeatures(ctx, map, terrain, H_AT, gapSet, stoneSet) {
    const cols = map.cols, rows = map.rows;
    const T = (x, z) => terrain[Math.max(0, Math.min(rows - 1, z))][Math.max(0, Math.min(cols - 1, x))];

    // 2.1. Ô cao 1 (khối thấp ~0,45 ô) và ô cao 2 (bệ cao ~0,9 ô có vách bên)
    if (map.heights?.length) {
        const rimMat1 = ctx.lam(0x8a7962, { occlude: false });
        const wallMat2 = ctx.lam(0x7c756a, { occlude: false });
        const ledgeMat2 = ctx.lam(0x9a9284, { occlude: false });
        for (let z = 0; z < rows; z++) for (let x = 0; x < cols; x++) {
            const h = H_AT(x, z);
            if (h <= 0) continue;
            const elev = h * 0.45;
            const cx = x + 0.5, cz = z + 0.5;
            if (h === 1) {
                // bậc đá / gỗ thấp (0,45 ô): thêm viền đá bo quanh mép bậc
                const rim = mesh(ctx, new THREE.BoxGeometry(1.04, 0.1, 1.04), rimMat1, cx, elev - 0.06, cz);
                rim.castShadow = true;
            } else if (h >= 2) {
                // bệ cao (0,9 ô): thêm vách đá phân tầng ở các cạnh tiếp giáp ô thấp hơn
                const cap = mesh(ctx, new THREE.BoxGeometry(1.06, 0.12, 1.06), ledgeMat2, cx, elev - 0.06, cz);
                cap.castShadow = true;
                for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    if (H_AT(x + dx, z + dz) < h) {
                        const wx = cx + dx * 0.49, wz = cz + dz * 0.49;
                        const sx = dx !== 0 ? 0.08 : 1.02, sz = dz !== 0 ? 0.08 : 1.02;
                        mesh(ctx, new THREE.BoxGeometry(sx, elev * 0.9, sz), wallMat2, wx, elev * 0.42, wz);
                    }
                }
            }
        }
    }

    // 2.2. Ô khe (gaps): lòng suối trũng có nước chảy (nếu nối với ô nước) hoặc hố / rãnh tối
    if (map.gaps?.length) {
        // tìm các ô gap nối với ô nước 'w'
        const waterGaps = new Set();
        const q = [];
        for (const [gx, gz] of map.gaps) {
            if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => T(gx + dx, gz + dz) === 'w')) {
                const k = `${gx},${gz}`;
                waterGaps.add(k);
                q.push([gx, gz]);
            }
        }
        while (q.length) {
            const [gx, gz] = q.shift();
            for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nk = `${gx + dx},${gz + dz}`;
                if (gapSet.has(nk) && !waterGaps.has(nk)) {
                    waterGaps.add(nk);
                    q.push([gx + dx, gz + dz]);
                }
            }
        }

        const bankMat = ctx.lam(0x7c7468, { occlude: false });
        const pitMat = ctx.lam(0x181512, { occlude: false, cloud: false });
        const streamMat = new THREE.MeshStandardMaterial({ color: 0x3f95c8, emissive: 0x164a6e, emissiveIntensity: 0.28, transparent: true, opacity: 0.88, roughness: 0.15 });
        patchMaterial(streamMat, { sway: 0, occlude: false, cloud: false });
        const foams = [];
        const foamGeo = new THREE.PlaneGeometry(0.55, 0.12); foamGeo.rotateX(-Math.PI / 2);
        const foamMat = new THREE.MeshBasicMaterial({ color: 0xe6f9ff, transparent: true, opacity: 0.65, depthWrite: false });

        for (const [gx, gz] of map.gaps) {
            const cx = gx + 0.5, cz = gz + 0.5, isStream = waterGaps.has(`${gx},${gz}`);
            // bờ đá hai bên rãnh / suối
            for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nk = `${gx + dx},${gz + dz}`;
                if (!gapSet.has(nk) && T(gx + dx, gz + dz) !== 'w') {
                    const sx = dx !== 0 ? 0.14 : 1.0, sz = dz !== 0 ? 0.14 : 1.0;
                    mesh(ctx, new THREE.BoxGeometry(sx, 0.28, sz), bankMat, cx + dx * 0.44, -0.1, cz + dz * 0.44);
                }
            }
            if (isStream && PAINT) {
                // nước kiểu tranh vẽ đã phủ cả lòng suối (build.js) -> không đặt tấm nước + vạch bọt riêng từng ô
            } else if (isStream) {
                const wPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96), streamMat);
                wPlane.rotation.x = -Math.PI / 2;
                wPlane.position.set(cx, -0.26, cz);
                ctx.group.add(wPlane);
                const fm = new THREE.Mesh(foamGeo, foamMat);
                fm.position.set(cx, -0.24, cz);
                ctx.group.add(fm);
                foams.push({ fm, cx, cz, ph: gx * 0.7 + gz * 1.1 });
            } else {
                // đáy hố / rãnh tối
                const pit = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.1, 0.88), pitMat);
                pit.position.set(cx, -0.58, cz);
                ctx.group.add(pit);
            }
        }
        if (foams.length) {
            ctx.anim.push((t) => {
                for (const f of foams) {
                    const p = (t * 0.9 + f.ph) % 1;
                    f.fm.position.x = f.cx + (p - 0.5) * 0.35;
                    f.fm.scale.x = 0.65 + Math.sin(p * Math.PI) * 0.5;
                }
            });
        }
    }

    // 2.3. Phiến đá nổi trên nước (stones): tròn dẹt, nhô khỏi mặt nước, hơi bập bềnh
    if (map.stones?.length) {
        const stoneGeo = new THREE.CylinderGeometry(0.41, 0.47, 0.18, 9);
        const topGeo = new THREE.CylinderGeometry(0.35, 0.39, 0.05, 8);
        const ringGeo = new THREE.RingGeometry(0.43, 0.52, 14); ringGeo.rotateX(-Math.PI / 2);
        const stoneMat = ctx.lam(0x9e988c, { occlude: false });
        const mossMat = ctx.lam(0x7c8a66, { occlude: false });
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0.45, depthWrite: false });
        const wPatchMat = new THREE.MeshStandardMaterial({ color: ctx.style.water ?? 0x4f9ab0, transparent: true, opacity: 0.85, roughness: 0.15 });
        patchMaterial(wPatchMat, { sway: 0, occlude: false, cloud: true });

        const list = [];
        map.stones.forEach(([sx, sz], i) => {
            const cx = sx + 0.5, cz = sz + 0.5;
            if (T(sx, sz) !== 'w' && !PAINT) {
                const wp = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 1.02), wPatchMat);
                wp.rotation.x = -Math.PI / 2; wp.position.set(cx, -0.31, cz);
                ctx.group.add(wp);
            }
            const g = new THREE.Group();
            g.position.set(cx, -0.04, cz);
            const base = new THREE.Mesh(stoneGeo, stoneMat); base.castShadow = base.receiveShadow = true;
            const cap = new THREE.Mesh(topGeo, mossMat); cap.position.y = 0.1; cap.receiveShadow = true;
            const ring = new THREE.Mesh(ringGeo, ringMat); ring.position.y = -0.22;
            g.add(base, cap, ring);
            ctx.group.add(g);
            list.push({ g, ring, ph: i * 1.4 + sx * 0.5 });
        });
        ctx.anim.push((t) => {
            for (const s of list) {
                s.g.position.y = -0.04 + Math.sin(t * 2.3 + s.ph) * 0.024;
                s.g.rotation.z = Math.sin(t * 1.7 + s.ph) * 0.025;
                s.ring.scale.setScalar(0.95 + Math.sin(t * 2.3 + s.ph) * 0.08);
            }
        });
    }
}

// ============================================================
// 3. Sức sống cho cả 7 vùng: bóng cây, đàn chim, chim đậu, thú nhỏ theo vùng, nước & hạt bay
// ============================================================
export function buildRegionLife(ctx, id, map, terrain, treeSpots, roofPerches) {
    buildCanopyShadows(ctx, treeSpots);
    buildFlyingBirds(ctx, id, map);
    buildPerchedBirds(ctx, id, map, treeSpots, roofPerches);
    buildCritters(ctx, id, map, terrain);
    buildWaterLife(ctx, id, map, terrain);
    buildAmbientParticles(ctx, id, map);
}

/** 3.1. Bóng tán cây mềm đung đưa nhẹ theo gió trên mặt đất (1 InstancedMesh cho cả bản đồ) */
function buildCanopyShadows(ctx, treeSpots) {
    if (!treeSpots.length) return;
    const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
        map: canopyShadowTexture(),
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
    });
    mat.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = uTime;
        sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec4 wp = instanceMatrix * vec4(position, 1.0);
            transformed.x += sin(uTime * 1.6 + wp.x * 0.55 + wp.z * 0.35) * 0.08;
            transformed.z += cos(uTime * 1.2 + wp.x * 0.4) * 0.06;
          #endif`);
    };
    mat.customProgramCacheKey = () => 'canopy_shadow_sway';
    const im = new THREE.InstancedMesh(geo, mat, treeSpots.length);
    im.renderOrder = 1;
    const m4 = new THREE.Matrix4(), v1 = new THREE.Vector3(), q = new THREE.Quaternion(), v2 = new THREE.Vector3();
    treeSpots.forEach(([tx, tz, sc], i) => {
        const r = sc * 0.82;
        m4.compose(v1.set(tx + 0.25, 0.014, tz + 0.18), q.setFromAxisAngle(Y, (i * 1.7) % 6.28), v2.set(r, 1, r * 0.88));
        im.setMatrixAt(i, m4);
    });
    im.computeBoundingSphere();
    ctx.group.add(im);
}

/** Tạo 1 con chim low-poly (thân + 2 cánh vỗ) */
function makeBirdMesh(ctx, color = 0x4a6580, wingSpan = 0.28) {
    const g = new THREE.Group();
    const mat = ctx.lam(color, { occlude: false });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 5), mat);
    body.rotation.x = Math.PI / 2;
    const wGeo = new THREE.BoxGeometry(wingSpan, 0.02, 0.11);
    const wL = new THREE.Mesh(wGeo, mat); wL.position.set(-wingSpan * 0.48, 0, 0);
    const wR = new THREE.Mesh(wGeo, mat); wR.position.set(wingSpan * 0.48, 0, 0);
    g.add(body, wL, wR);
    return { g, wL, wR };
}

/** 3.2. Chim bay ngang trời theo đàn 3–6 con + bóng chim lướt trên mặt đất */
function buildFlyingBirds(ctx, id, map) {
    const cols = map.cols, rows = map.rows;
    const birdColor = id === 'sylvaren' || id === 'lunaria' ? 0x74d2e7 : id === 'forest' ? 0x3d5a58 : 0x4e5d6c;
    const shadowGeo = new THREE.CircleGeometry(0.22, 8); shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x141810, transparent: true, opacity: 0.22, depthWrite: false });

    const flocks = [
        { count: 5, y: 6.2, speed: 2.3, dirX: 1, dirZ: 0.28, startX: 6, startZ: 7, lowHide: false },
        { count: 4, y: 6.8, speed: 2.0, dirX: -0.9, dirZ: 0.35, startX: 34, startZ: 15, lowHide: true },
    ];
    const flockList = flocks.map((cfg, fi) => {
        const container = new THREE.Group();
        ctx.group.add(container);
        const members = [];
        for (let i = 0; i < cfg.count; i++) {
            const b = makeBirdMesh(ctx, birdColor, 0.26);
            const sh = new THREE.Mesh(shadowGeo, shadowMat);
            sh.scale.set(1.2, 1, 0.75);
            container.add(b.g, sh);
            // xếp đội hình chữ V
            const row = Math.ceil(i / 2), side = i % 2 === 1 ? -1 : 1;
            members.push({ ...b, sh, ox: -row * 0.65, oz: i === 0 ? 0 : side * row * 0.55, ph: i * 1.1 + fi * 2 });
        }
        return { ...cfg, container, members, ang: Math.atan2(cfg.dirX, cfg.dirZ) };
    });

    const spanX = cols + 16, spanZ = rows + 12;
    ctx.anim.push((t) => {
        const low = uQuality.value < 0.5;
        for (const f of flockList) {
            if (f.lowHide && low) { f.container.visible = false; continue; }
            f.container.visible = true;
            const cx = ((f.startX + t * f.speed * f.dirX) % spanX + spanX) % spanX - 8;
            const cz = ((f.startZ + t * f.speed * f.dirZ) % spanZ + spanZ) % spanZ - 6;
            for (const m of f.members) {
                const bx = cx + m.ox, bz = cz + m.oz;
                const by = f.y + Math.sin(t * 2.5 + m.ph) * 0.18;
                m.g.position.set(bx, by, bz);
                m.g.rotation.y = f.ang;
                const flap = Math.sin(t * 11.5 + m.ph) * 0.62;
                m.wL.rotation.z = flap;
                m.wR.rotation.z = -flap;
                // bóng chim lướt trên mặt đất (lệch nhẹ theo hướng nắng)
                m.sh.position.set(bx + 1.4, 0.03, bz + 0.8);
            }
        }
    });
}

/** 3.3. Chim đậu mái nhà / cành cây, bay vọt lên khi nhân vật tới gần */
function buildPerchedBirds(ctx, id, map, treeSpots, roofPerches) {
    const perches = [...roofPerches];
    for (let i = 0; i < treeSpots.length && perches.length < 8; i += Math.max(1, Math.floor(treeSpots.length / 6))) {
        const [tx, tz, sc] = treeSpots[i];
        if (tx > 2 && tx < map.cols - 2 && tz > 2 && tz < map.rows - 2) {
            perches.push([tx, sc * 0.95, tz]);
        }
    }
    const birdCol = id === 'capital' ? 0x8c9ba5 : id === 'sylvaren' || id === 'lunaria' ? 0x80ffea : 0xc05a3b;
    const birds = perches.slice(0, 8).map(([px, py, pz], i) => {
        const b = makeBirdMesh(ctx, birdCol, 0.2);
        b.g.position.set(px, py, pz);
        ctx.group.add(b.g);
        return { ...b, px, py, pz, flyAt: -99, dir: (i % 2 === 0 ? 1 : -1) * (0.6 + (i % 3) * 0.3), ph: i * 1.7 };
    });

    ctx.anim.push((t) => {
        const hx = uHeroPos.value.x, hz = uHeroPos.value.z;
        for (const b of birds) {
            const dist = Math.hypot(hx - b.px, hz - b.pz);
            if (dist < 4.5 && t - b.flyAt > 7.0) b.flyAt = t;
            const dt = t - b.flyAt;
            if (dt >= 0 && dt < 6.5) {
                // vỗ cánh bay vọt lên trời rồi lượn vòng quay về chỗ đậu
                const p = dt < 4.0 ? dt / 4.0 : 1 - (dt - 4.0) / 2.5;
                const arc = Math.sin(Math.min(1, p) * Math.PI * 0.5);
                b.g.position.set(
                    b.px + Math.cos(dt * 1.4 + b.ph) * arc * 4.2 * b.dir,
                    b.py + arc * 4.8,
                    b.pz - Math.sin(dt * 1.2 + b.ph) * arc * 3.5
                );
                b.g.rotation.y = dt * 1.4 + b.ph;
                const flap = Math.sin(t * 18 + b.ph) * 0.75;
                b.wL.rotation.z = flap;
                b.wR.rotation.z = -flap;
            } else {
                // đứng rỉa lông / nhảy nhẹ trên mái nhà / cành cây
                b.g.position.set(b.px, b.py + Math.abs(Math.sin(t * 3.2 + b.ph)) * 0.03, b.pz);
                b.g.rotation.y = b.ph + Math.sin(t * 1.1 + b.ph) * 0.4;
                b.wL.rotation.z = 0.15;
                b.wR.rotation.z = -0.15;
            }
        }
    });
}

/** 3.4. Thú nhỏ theo vùng (chỉ ở trên ô BỊ CHẶN '#', chạy / bay khi nhân vật tới gần) */
const REGION_CRITTERS = {
    ashford: [
        ['cat', 28.2, 16.5], ['cat', 12.2, 8.8], ['dog', 29.4, 9.2], ['dog', 11.2, 19.5],
        ['duck', 4.5, 12.2], ['duck', 4.8, 12.8],
    ],
    outskirts: [
        ['dog', 14.5, 11.8], ['chicken', 16.5, 10.2], ['chicken', 16.8, 10.6],
        ['rabbit', 6.4, 3.5], ['rabbit', 6.4, 15.5], ['squirrel', 1.8, 8.5],
        ['fawn', 26.5, 22.2], ['fawn', 35.5, 15.5],
    ],
    forest: [
        ['rabbit', 4.5, 8.5], ['rabbit', 21.5, 8.5], ['squirrel', 5.5, 5.5], ['squirrel', 26.5, 10.5],
        ['fawn', 19.5, 7.5], ['fawn', 20.4, 7.8], ['fawn', 34.5, 14.5],
    ],
    road: [
        ['dog', 25.5, 8.5], ['rabbit', 4.5, 4.5], ['rabbit', 6.5, 17.5],
        ['squirrel', 2.5, 16.5], ['duck', 11.5, 8.5], ['duck', 20.5, 14.5],
    ],
    capital: [
        ['pigeon', 30.5, 21.5], ['pigeon', 31.5, 22.5], ['pigeon', 41.5, 20.5], ['pigeon', 43.5, 21.5],
        ['pigeon', 40.5, 12.5], ['pigeon', 46.5, 11.5], ['cat', 56.5, 21.5], ['dog', 36.5, 38.5],
    ],
    sylvaren: [
        ['glowButterfly', 14.5, 10.2], ['glowButterfly', 25.5, 10.2], ['glowButterfly', 17.5, 16.2],
        ['glowButterfly', 24.5, 16.2], ['glowButterfly', 12.5, 6.2], ['glowButterfly', 34.5, 6.2],
        ['fawn', 16.5, 11.5], ['rabbit', 24.5, 11.5],
        ['jumpingFish', 8.5, 2.5], ['jumpingFish', 22.5, 2.5], ['jumpingFish', 10.5, 22.5], ['jumpingFish', 28.5, 22.5],
    ],
    lunaria: [
        ['glowButterfly', 19.5, 9.8], ['glowButterfly', 23.5, 9.8], ['glowButterfly', 19.5, 13.2],
        ['glowButterfly', 23.5, 13.2], ['glowButterfly', 32.5, 15.2], ['glowButterfly', 38.5, 15.2],
        ['fawn', 14.5, 8.5], ['rabbit', 14.5, 10.5],
        ['jumpingFish', 20.5, 11.5], ['jumpingFish', 21.5, 12.2],
    ],
};

function makeCritterMesh(ctx, kind, isElf) {
    const g = new THREE.Group();
    const add = (geo, mat, px, py, pz, sx = 1, sy = 1, sz = 1) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(px, py, pz); m.scale.set(sx, sy, sz);
        m.castShadow = true; g.add(m); return m;
    };
    if (kind === 'cat') {
        const fur = ctx.lam(0xd97f38), ear = ctx.lam(0x8a4b1c);
        add(new THREE.BoxGeometry(0.18, 0.16, 0.34), fur, 0, 0.14, 0);
        add(new THREE.SphereGeometry(0.11, 6, 5), fur, 0, 0.24, 0.16);
        add(new THREE.ConeGeometry(0.04, 0.08, 4), ear, -0.06, 0.34, 0.16);
        add(new THREE.ConeGeometry(0.04, 0.08, 4), ear, 0.06, 0.34, 0.16);
        const tail = add(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 5), fur, 0, 0.24, -0.18);
        tail.rotation.x = -0.35;
    } else if (kind === 'dog') {
        const fur = ctx.lam(0x9c6a3e), dark = ctx.lam(0x4a301a);
        add(new THREE.BoxGeometry(0.22, 0.2, 0.42), fur, 0, 0.18, 0);
        add(new THREE.BoxGeometry(0.18, 0.16, 0.18), fur, 0, 0.3, 0.2);
        add(new THREE.BoxGeometry(0.1, 0.08, 0.12), dark, 0, 0.28, 0.31);
        add(new THREE.BoxGeometry(0.05, 0.1, 0.07), dark, -0.1, 0.28, 0.18);
        add(new THREE.BoxGeometry(0.05, 0.1, 0.07), dark, 0.1, 0.28, 0.18);
        add(new THREE.CylinderGeometry(0.028, 0.02, 0.22, 5), fur, 0, 0.26, -0.22).rotation.x = -0.5;
    } else if (kind === 'duck') {
        const white = ctx.lam(0xf5f2e8), head = ctx.lam(0x27ae60), bill = ctx.lam(0xf39c12);
        add(new THREE.SphereGeometry(0.14, 7, 6), white, 0, 0.14, 0, 0.9, 0.8, 1.2);
        add(new THREE.SphereGeometry(0.085, 6, 5), head, 0, 0.25, 0.12);
        add(new THREE.BoxGeometry(0.07, 0.03, 0.09), bill, 0, 0.24, 0.21);
    } else if (kind === 'rabbit') {
        const fur = ctx.lam(isElf ? 0xf2f6fa : 0xc8b092), tail = ctx.lam(0xffffff);
        add(new THREE.SphereGeometry(0.13, 7, 6), fur, 0, 0.13, 0, 0.9, 0.85, 1.15);
        add(new THREE.SphereGeometry(0.085, 6, 5), fur, 0, 0.21, 0.11);
        add(new THREE.BoxGeometry(0.035, 0.15, 0.04), fur, -0.04, 0.32, 0.1);
        add(new THREE.BoxGeometry(0.035, 0.15, 0.04), fur, 0.04, 0.32, 0.1);
        add(new THREE.SphereGeometry(0.05, 5, 5), tail, 0, 0.14, -0.14);
    } else if (kind === 'squirrel') {
        const fur = ctx.lam(0xb85d28);
        add(new THREE.SphereGeometry(0.1, 6, 5), fur, 0, 0.11, 0, 0.85, 0.85, 1.15);
        add(new THREE.SphereGeometry(0.07, 6, 5), fur, 0, 0.19, 0.09);
        add(new THREE.SphereGeometry(0.11, 6, 5), fur, 0, 0.22, -0.12, 0.7, 1.3, 0.9);
    } else if (kind === 'fawn') {
        const fur = ctx.lam(isElf ? 0xf5efe2 : 0xc68642), spot = ctx.lam(0xfff8e8);
        add(new THREE.BoxGeometry(0.24, 0.24, 0.52), fur, 0, 0.38, 0);
        [[-0.08, -0.18], [0.08, -0.18], [-0.08, 0.18], [0.08, 0.18]].forEach(([dx, dz]) => {
            add(new THREE.CylinderGeometry(0.03, 0.025, 0.32, 5), fur, dx, 0.16, dz);
        });
        add(new THREE.CylinderGeometry(0.06, 0.08, 0.26, 6), fur, 0, 0.56, 0.2);
        add(new THREE.SphereGeometry(0.11, 6, 5), fur, 0, 0.68, 0.26, 0.85, 0.85, 1.2);
        add(new THREE.SphereGeometry(0.04, 5, 4), spot, 0.06, 0.5, -0.05);
        add(new THREE.SphereGeometry(0.04, 5, 4), spot, -0.06, 0.5, 0.06);
    } else if (kind === 'pigeon') {
        const grey = ctx.lam(0x8e9eab), neck = ctx.lam(0x5f7a8a);
        add(new THREE.SphereGeometry(0.11, 6, 5), grey, 0, 0.12, 0, 0.85, 0.8, 1.2);
        add(new THREE.SphereGeometry(0.07, 6, 5), neck, 0, 0.21, 0.09);
    } else if (kind === 'chicken') {
        const white = ctx.lam(0xf7f3e8), comb = ctx.lam(0xd63031);
        add(new THREE.SphereGeometry(0.12, 6, 5), white, 0, 0.13, 0, 0.9, 0.85, 1.15);
        add(new THREE.SphereGeometry(0.075, 6, 5), white, 0, 0.22, 0.1);
        add(new THREE.BoxGeometry(0.03, 0.05, 0.06), comb, 0, 0.28, 0.1);
    }
    return g;
}

function buildCritters(ctx, id, map, terrain) {
    const base = REGION_CRITTERS[id] ?? [];
    if (!base.length) return;
    // (12/11/2026) thêm thú nhỏ rải ở các ô cỏ đi được, cùng loài với vùng đó — cho bản đồ sinh động hơn
    const kinds = [...new Set(base.map(c => c[0]).filter(k => !/Fish|glow|duck/.test(k)))];
    const list = [...base];
    if (kinds.length) {
        let sd = 9001 + id.length * 97;
        const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        const want = Math.max(4, Math.round(base.length * 0.8));
        for (let tries = 0, n = 0; n < want && tries < 400; tries++) {
            const x = 2 + Math.floor(R() * (map.cols - 4)), z = 2 + Math.floor(R() * (map.rows - 4));
            if (map.grid?.[z]?.[x] !== '.' || terrain[z]?.[x] !== 'g') continue;
            if (list.some(c => Math.hypot(c[1] - x, c[2] - z) < 4)) continue;
            list.push([kinds[Math.floor(R() * kinds.length)], x + 0.5, z + 0.5]); n++;
        }
    }
    const isElf = id === 'sylvaren' || id === 'lunaria';
    const isBlocked = (x, z) => map.grid?.[Math.floor(z)]?.[Math.floor(x)] === '#';

    const groundCritters = [];
    const glowButterflies = [];
    const fishes = [];

    for (let i = 0; i < list.length; i++) {
        const [kind, hx, hz] = list[i];
        if (kind === 'glowButterfly') {
            const g = new THREE.Group();
            const col = i % 2 === 0 ? 0x72efdd : 0xe0aaff;
            const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
            const wGeo = new THREE.PlaneGeometry(0.14, 0.18);
            const wL = new THREE.Mesh(wGeo, mat); wL.position.x = -0.06;
            const wR = new THREE.Mesh(wGeo, mat); wR.position.x = 0.06;
            g.add(wL, wR);
            ctx.group.add(g);
            glowButterflies.push({ g, wL, wR, hx, hz, ph: i * 1.9 });
        } else if (kind === 'jumpingFish') {
            const g = new THREE.Group();
            const mat = new THREE.MeshStandardMaterial({ color: 0x74d2e7, emissive: 0x2a6f97, emissiveIntensity: 0.35, roughness: 0.2, flatShading: true });
            patchMaterial(mat, { sway: 0, occlude: false, cloud: false });
            const body = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 6), mat); body.rotation.x = Math.PI / 2;
            const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), mat); tail.rotation.x = -Math.PI / 2; tail.position.z = -0.16;
            g.add(body, tail);
            const ringGeo = new THREE.RingGeometry(0.08, 0.22, 12); ringGeo.rotateX(-Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0, depthWrite: false });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(hx, -0.3, hz);
            ctx.group.add(g, ring);
            fishes.push({ g, ring, ringMat, hx, hz, ph: i * 2.4 });
        } else {
            if (!isBlocked(hx, hz)) continue;
            const g = makeCritterMesh(ctx, kind, isElf);
            g.position.set(hx, 0, hz);
            ctx.group.add(g);
            groundCritters.push({ g, kind, hx, hz, ph: i * 2.1, fleeAt: -99 });
        }
    }

    if (groundCritters.length) {
        ctx.anim.push((t) => {
            const heroX = uHeroPos.value.x, heroZ = uHeroPos.value.z;
            for (const c of groundCritters) {
                const dist = Math.hypot(heroX - c.hx, heroZ - c.hz);
                if (dist < 3.6 && t - c.fleeAt > 5.0) c.fleeAt = t;
                const dt = t - c.fleeAt;
                const spd = dt >= 0 && dt < 2.5 ? 4.2 : 0.85;
                const a = t * spd + c.ph;
                let nx = c.hx + Math.cos(a) * 0.34;
                let nz = c.hz + Math.sin(a * 0.85) * 0.3;
                // đảm bảo thú nhỏ CHỈ đi trên ô bị chặn '#'
                if (!isBlocked(nx, nz)) { nx = c.hx; nz = c.hz; }
                const hop = (c.kind === 'rabbit' || c.kind === 'squirrel' || dt < 2.5)
                    ? Math.abs(Math.sin(t * 6.5 + c.ph)) * 0.08
                    : Math.abs(Math.sin(t * 3.5 + c.ph)) * 0.02;
                const flyY = c.kind === 'pigeon' && dt >= 0 && dt < 2.5 ? Math.sin((dt / 2.5) * Math.PI) * 1.8 : 0;
                c.g.position.set(nx, hop + flyY, nz);
                c.g.rotation.y = Math.atan2(Math.cos(a) * 0.3, -Math.sin(a) * 0.34);
            }
        });
    }

    if (glowButterflies.length) {
        ctx.anim.push((t) => {
            const heroX = uHeroPos.value.x, heroZ = uHeroPos.value.z;
            for (const b of glowButterflies) {
                const dist = Math.hypot(heroX - b.hx, heroZ - b.hz);
                const lift = dist < 3.5 ? (3.5 - dist) * 0.45 : 0;
                const a = t * 1.4 + b.ph;
                b.g.position.set(b.hx + Math.cos(a) * 0.6, 0.65 + lift + Math.sin(t * 2.8 + b.ph) * 0.22, b.hz + Math.sin(a * 0.8) * 0.5);
                b.g.rotation.y = -a + Math.PI / 2;
                const flap = Math.sin(t * 14 + b.ph) * 0.85;
                b.wL.rotation.y = flap;
                b.wR.rotation.y = -flap;
            }
        });
    }

    if (fishes.length) {
        ctx.anim.push((t) => {
            for (const f of fishes) {
                const cycle = (t * 0.55 + f.ph) % 3.2;
                if (cycle < 1.0) {
                    const p = cycle;
                    const arc = Math.sin(p * Math.PI);
                    f.g.visible = true;
                    f.g.position.set(f.hx + (p - 0.5) * 0.85, -0.32 + arc * 0.72, f.hz);
                    f.g.rotation.y = Math.PI / 2;
                    f.g.rotation.x = -(p - 0.5) * 1.8;
                    f.ring.scale.setScalar(0.5 + p * 1.6);
                    f.ringMat.opacity = Math.sin(p * Math.PI) * 0.55;
                } else {
                    f.g.visible = false;
                    f.ringMat.opacity = 0;
                }
            }
        });
    }
}

/** 3.5. Nước (ô 'w'): gợn sóng tròn, đốm lấp lánh, bèo tấm & hoa súng */
function buildWaterLife(ctx, id, map, terrain) {
    const cols = map.cols, rows = map.rows;
    const waterTiles = [];
    for (let z = 0; z < rows; z++) for (let x = 0; x < cols; x++) {
        if (terrain[z]?.[x] === 'w') waterTiles.push([x + 0.5, z + 0.5]);
    }
    if (!waterTiles.length) return;

    // Đốm nắng lấp lánh & vòng gợn sóng trên mặt nước
    const spkCount = Math.min(28, Math.max(8, Math.floor(waterTiles.length / 5)));
    const spkGeo = new THREE.CircleGeometry(0.08, 6); spkGeo.rotateX(-Math.PI / 2);
    const spkMat = new THREE.MeshBasicMaterial({ color: 0xe8fbff, transparent: true, opacity: 0.75, depthWrite: false });
    const spkIm = new THREE.InstancedMesh(spkGeo, spkMat, spkCount);
    const m4 = new THREE.Matrix4(), v1 = new THREE.Vector3(), q0 = new THREE.Quaternion(), v2 = new THREE.Vector3();
    const spots = [];
    for (let i = 0; i < spkCount; i++) {
        const [wx, wz] = waterTiles[(i * 7) % waterTiles.length];
        spots.push([wx + (ctx.rnd() - 0.5) * 0.7, wz + (ctx.rnd() - 0.5) * 0.7, i * 1.3]);
    }
    ctx.group.add(spkIm);

    // Bèo tấm & hoa súng nở trên mặt nước
    const lotusSpots = waterTiles.filter((_, i) => i % 9 === 0).slice(0, 14);
    const padMat = ctx.lam(0x3f8f42, { occlude: false });
    const flowerMat = ctx.lam(id === 'sylvaren' || id === 'lunaria' ? 0x9ef0ff : 0xffb3c6, { occlude: false });
    for (const [lx, lz] of lotusSpots) {
        const pad = mesh(ctx, new THREE.CylinderGeometry(0.24, 0.24, 0.02, 8), padMat, lx, -0.305, lz, ctx.rnd() * 6);
        pad.castShadow = false;
        const fl = mesh(ctx, new THREE.ConeGeometry(0.11, 0.12, 6), flowerMat, lx + 0.04, -0.25, lz - 0.03);
        fl.rotation.x = Math.PI;
        fl.castShadow = false;
    }

    ctx.anim.push((t) => {
        for (let i = 0; i < spots.length; i++) {
            const [sx, sz, ph] = spots[i];
            const s = Math.max(0.01, Math.sin(t * 3.6 + ph)) * 1.25;
            m4.compose(v1.set(sx, -0.302, sz), q0, v2.set(s, 1, s));
            spkIm.setMatrixAt(i, m4);
        }
        spkIm.instanceMatrix.needsUpdate = true;
    });
}

/** 3.6. Hạt bay trong không khí: lá rơi ở rừng, cánh hoa bay ở vùng Elf, bụi nắng ở làng/đồng/kinh thành */
function buildAmbientParticles(ctx, id, map) {
    const cols = map.cols, rows = map.rows;
    const isForest = id === 'forest';
    const isElf = id === 'sylvaren' || id === 'lunaria';
    const count = 42;
    const geo = isForest
        ? new THREE.PlaneGeometry(0.14, 0.09)
        : isElf
            ? new THREE.CircleGeometry(0.065, 5)
            : new THREE.CircleGeometry(0.042, 6);
    const color = isForest ? 0xd9822b : isElf ? (id === 'lunaria' ? 0xffb8e6 : 0x9bf6ff) : 0xfff0b8;
    const mat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isForest ? 0.85 : 0.72,
        depthWrite: false,
    });
    const im = new THREE.InstancedMesh(geo, mat, count);
    ctx.group.add(im);

    const pts = [];
    for (let i = 0; i < count; i++) {
        pts.push({
            x: 2 + ctx.rnd() * (cols - 4),
            y: 0.4 + ctx.rnd() * 4.2,
            z: 2 + ctx.rnd() * (rows - 4),
            ph: ctx.rnd() * 6.28,
            spd: 0.35 + ctx.rnd() * 0.35,
        });
    }
    const m4 = new THREE.Matrix4(), v1 = new THREE.Vector3(), q = new THREE.Quaternion(), eul = new THREE.Euler(), v2 = new THREE.Vector3(1, 1, 1);
    ctx.anim.push((t) => {
        if (uQuality.value < 0.5) { im.visible = false; return; }
        im.visible = true;
        for (let i = 0; i < count; i++) {
            const p = pts[i];
            const py = isForest || isElf
                ? 4.4 - ((t * p.spd + p.y) % 4.2)
                : 0.6 + Math.sin(t * 0.7 + p.ph) * 0.8 + (p.y % 2.2);
            const px = p.x + Math.sin(t * 0.9 + p.ph) * 0.75;
            const pz = p.z + Math.cos(t * 0.7 + p.ph) * 0.55;
            eul.set(t * 1.4 + p.ph, t * 1.1 + p.ph, 0);
            q.setFromEuler(eul);
            const sc = isForest || isElf ? 1 : 0.6 + 0.5 * Math.sin(t * 2.5 + p.ph);
            m4.compose(v1.set(px, py, pz), q, v2.setScalar(sc));
            im.setMatrixAt(i, m4);
        }
        im.instanceMatrix.needsUpdate = true;
    });
}
