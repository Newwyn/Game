// ============================================================
// HIỆU ỨNG TẠM (PLACEHOLDER) CHO PARY — BÚA THÁNH (`holyhammer`)
//   · Vòng Hào Quang Thánh Thần (4.5 đơn vị) di chuyển theo Pary
//   · Búa Khổng Lồ 3 nhịp giáng xuống + sóng vàng pixelFx
//   · Búa Bay Hậu Tuyến: phóng tới địch -> bay về Pary
//   · Chặn dịch chuyển: loé sáng tại mép + chữ nổi "Bị chặn!"
// ============================================================
import * as THREE from 'three';
import { GROUND_Y } from '../config.js';
import { scene } from '../core/scene.js';
import { getView } from '../state.js';
import { addAnim, spawnShockwave, ringTexture, glowTexture } from './vfx.js';
import { spawnPixelFx } from './pixelFx.js';
import { getTexture } from '../core/textures.js';
import { cameraRig } from '../core/cameraRig.js';
import { camera } from '../core/scene.js';
import hammerUrl from '../assets/sprites/pary_giant_hammer.webp';
import hammerS from '../assets/sprites/pary_hammer_s.webp';
import hammerSS from '../assets/sprites/pary_hammer_ss.webp';
import hammerSSS from '../assets/sprites/pary_hammer_sss.webp';
import swirlUrl from '../assets/sprites/pary_swirl.webp';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import auraRingUrl from '../assets/sprites/pary_aura_ring.webp';

const auras = new Map();
let _hammerTex = null;

// Búa thánh vẽ tay (Flow, art/pary/giant-hammer.png): dựng đứng, ĐẦU BÚA Ở DƯỚI, tỉ lệ rộng/cao ~0,57
const HAMMER_ASPECT = 294 / 512;
function hammerTexture() {
    _hammerTex ??= getTexture(hammerUrl);
    return _hammerTex;
}

function safePixelFx(candidates, opts) {
    try {
        if (candidates?.[0]) spawnPixelFx(candidates[0], opts);
    } catch { /* placeholder fallback */ }
}

/** Chạy fn(dt) mỗi khung qua addAnim (addAnim cần 1 vật thể + thời lượng); fn trả true = xong */
function runLoop(fn) {
    addAnim(new THREE.Object3D(), 600, (p, fx, dt) => { if (fn(dt ?? 0)) fx.age = fx.life; });
}

function spawnBlockedText(x, y, z) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#0f172a';
    ctx.strokeText('🚫 Bị chặn!', 128, 32);
    ctx.fillStyle = '#fde047';
    ctx.fillText('🚫 Bị chặn!', 128, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
    const sp = new THREE.Sprite(mat);
    sp.position.set(x, y, z);
    sp.scale.set(3.4, 0.85, 1);
    scene.add(sp);
    let t = 0;
    runLoop((dt) => {
        t += dt;
        sp.position.y = y + t * 1.45;
        mat.opacity = Math.max(0, 1 - Math.max(0, t - 0.35) / 0.55);
        if (t < 0.9) return false;
        scene.remove(sp);
        mat.dispose();
        tex.dispose();
        return true;
    });
}

export function clearParyFx() {
    for (const entry of auras.values()) entry.dispose?.();
    auras.clear();
    for (const c of [...charges.values()]) c.dispose?.();
    for (const c of [...colossi.values()]) c.dispose?.();
}

export function playParyCast(data) {
    const view = getView(data.casterId, data.casterIdx);
    if (!view) return;
    const p = view.position;
    if (data.type === 'holy_smash') {
        spawnShockwave({ x: p.x, z: p.z }, { color: 0xfbbf24, radius: 2.4, life: 0.55 });
        safePixelFx(['scifi/force-field'], { pos: { x: p.x, z: p.z }, palette: 'gold', scale: 1.2, maxLife: (data.castTime ?? 2000) / 1000 });
    } else if (data.type === 'holy_colossus') {
        spawnShockwave({ x: p.x, z: p.z }, { color: 0xf59e0b, radius: 3.2, life: 0.65 });
        startColossusHammer(data.casterId, data.casterIdx, (data.castTime ?? 2000) / 1000);
    }
}

function attachAuraRing(casterId, casterIdx, radius = 4.5, duration = 6000) {
    const key = `${casterId}:${casterIdx}`;
    auras.get(key)?.dispose?.();
    const group = new THREE.Group();
    // vòng sáng vàng mỏng (tranh Flow art/pary/aura-ring-thin.png, vòng nằm ở 0,727 bán kính ảnh) -> khớp đúng bán kính hào quang
    const ringMat = new THREE.MeshBasicMaterial({
        map: getTexture(auraRingUrl), transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0, fog: false,
    });
    const RS = radius * 2 / 0.727;
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(RS, RS), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    const glowMat = new THREE.MeshBasicMaterial({
        map: glowTexture(), color: 0xfbbf24, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0.1, fog: false,
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2.05, radius * 2.05), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.04;
    group.add(glow, ring);
    scene.add(group);

    let elapsed = 0;
    const maxSec = duration / 1000;
    let alive = true;
    const dispose = () => {
        if (!alive) return;
        alive = false;
        scene.remove(group);
        ringMat.dispose();
        glowMat.dispose();
        ring.geometry.dispose();
        glow.geometry.dispose();
        auras.delete(key);
    };
    auras.set(key, { dispose, pulse: () => { ringMat.opacity = 1.6; } });
    runLoop((dt) => {
        if (!alive) return true;
        elapsed += dt;
        const view = getView(casterId, casterIdx);
        if (!view || elapsed >= maxSec) { dispose(); return true; }
        group.position.set(view.position.x, GROUND_Y, view.position.z);
        ring.rotation.z += dt * 0.25;
        ringMat.opacity += ((0.85 + 0.12 * Math.sin(elapsed * 3)) - ringMat.opacity) * Math.min(1, dt * 6);
        return false;
    });
}

export function playParySkill(data) {
    const view = getView(data.casterId, data.casterIdx);
    const p = view?.position ?? new THREE.Vector3(data.newX ?? 0, GROUND_Y, data.newZ ?? 0);
    if (data.type === 'holy_aura') {
        attachAuraRing(data.casterId, data.casterIdx, data.radius ?? 4.5, data.duration ?? 6000);
        spawnShockwave({ x: p.x, z: p.z }, { color: 0xfde047, radius: data.radius ?? 4.5, life: 0.5 });
    } else if (data.type === 'holy_smash') {
        const hit = data.effects?.[0];
        const tx = hit?.toX ?? p.x, tz = hit?.toZ ?? p.z;
        spawnShockwave({ x: p.x, z: p.z }, { color: 0xfbbf24, radius: 3.2, life: 0.45 });
        safePixelFx(['impacts/heavy-landing'], { pos: { x: tx, z: tz }, scale: 1.2 });
        if (hit?.knockback) spawnShockwave({ x: tx, z: tz }, { color: 0xf59e0b, radius: 2.4, life: 0.45 });
    }
}


// ---------- Chiêu 1 Búa Thánh Phán Quyết — TỤ LỰC (người dùng 23/11: "như cánh quạt trực thăng, Pary không cầm,
//            đứng đưa tay lên, cây búa xoay trên tay"): Pary giơ tay; cây búa LƠ LỬNG NẰM NGANG ngay trên bàn tay và
//            quay tròn quanh điểm giữa thân búa (trục đứng) như cánh quạt trực thăng. Búa là tấm phẳng nằm ngang trong
//            không gian 3D (tranh Flow theo bậc S / SS / SSS) nên camera nhìn chéo tự cho phối cảnh đúng. Vệt xoáy vàng
//            quay cùng búa; hào quang vàng dưới chân lớn + sáng dần theo 3 nấc; nấc càng cao quay càng nhanh. ----------
const charges = new Map();
const TIER_HAMMER = { s: hammerS, ss: hammerSS, sss: hammerSSS };
const HAMMER_LEN = 2.2;                 // chiều dài búa (đầu búa -> núm cán)
const HOVER = 0.55;                     // búa lơ lửng cao hơn nắm tay
const STAGE_REV = [0, 2.2, 3.6, 5.5];   // vòng / giây theo nấc (người dùng: "xoay nhanh lắm luôn")
const STAGE_RING = [0, 1.25, 1.7, 2.3];

function chargeKey(d) { return `${d.casterId}:${d.casterIdx}`; }

// ---- Búa thánh 3D (Meshy, người dùng 23/11: "chỗ xoay đó cho là cây búa 3D") — nạp 1 lần, chuẩn hoá: tâm ở gốc toạ độ,
//      trục dài nhất (cán) nằm theo X, dài 1 đơn vị. Chưa có file / nạp lỗi -> dùng tấm tranh búa như cũ.
const HAMMER_GLB = Object.values(import.meta.glob('../assets/world3d/meshy/pary_hammer.glb', { eager: true, query: '?url', import: 'default' }))[0];
let HAMMER3D = null;   // { geo, map }
if (HAMMER_GLB) {
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(HAMMER_GLB).then((gltf) => {
        gltf.scene.updateMatrixWorld(true);
        let mesh = null;
        gltf.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
        if (!mesh) return;
        const src = mesh.geometry.attributes.position, n = src.count, P = new Float32Array(n * 3), v = new THREE.Vector3(), box = new THREE.Box3();
        for (let i = 0; i < n; i++) { v.fromBufferAttribute(src, i).applyMatrix4(mesh.matrixWorld); P.set([v.x, v.y, v.z], i * 3); box.expandByPoint(v); }
        const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
        const ax = size.x >= size.y && size.x >= size.z ? 0 : size.y >= size.z ? 1 : 2;   // trục cán
        const o1 = (ax + 1) % 3, o2 = (ax + 2) % 3, len = size.getComponent(ax) || 1;
        const Q = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            Q[i * 3] = (P[i * 3 + ax] - c.getComponent(ax)) / len;        // cán -> X
            Q[i * 3 + 1] = (P[i * 3 + o1] - c.getComponent(o1)) / len;
            Q[i * 3 + 2] = (P[i * 3 + o2] - c.getComponent(o2)) / len;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(Q, 3));
        if (mesh.geometry.attributes.uv) geo.setAttribute('uv', mesh.geometry.attributes.uv);
        if (mesh.geometry.index) geo.setIndex(mesh.geometry.index);
        geo.computeBoundingSphere();
        HAMMER3D = { geo, map: mesh.material.map ?? null };
    }).catch(e => console.warn('[paryFx] không nạp được búa 3D — dùng búa tranh', e));
}

function startParyCharge(d) {
    const key = chargeKey(d);
    charges.get(key)?.dispose?.();
    const v0 = getView(d.casterId, d.casterIdx);
    if (!v0) return;
    v0.playAction?.('spin', { hold: true });
    const tier = v0.sprite?.tier ?? 'sss';
    const hTex = getTexture(TIER_HAMMER[tier] ?? hammerSSS);
    const aspect = hTex.image?.width && hTex.image?.height ? hTex.image.width / hTex.image.height : 0.58;
    // rotor: nhóm quay quanh trục đứng (rotation.y); búa = tấm phẳng nằm ngang, chiều dài búa dọc theo trục x của nhóm
    const rotor = new THREE.Group();
    let hMat, hammer;
    if (HAMMER3D) {
        // búa 3D thật: cán nằm ngang theo X, quay quanh trục đứng đi qua giữa thân búa
        hMat = new THREE.MeshBasicMaterial({ map: HAMMER3D.map, color: HAMMER3D.map ? 0xffffff : 0xf5e7c0, transparent: true, opacity: 0, fog: false });
        hammer = new THREE.Mesh(HAMMER3D.geo, hMat);
        hammer.scale.setScalar(HAMMER_LEN);
        hammer.rotation.x = -0.25;   // nghiêng nhẹ mặt búa về phía camera cho thấy hoa văn
    } else {
        hMat = new THREE.MeshBasicMaterial({ map: hTex, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, opacity: 0, alphaTest: 0.02 });
        hammer = new THREE.Mesh(new THREE.PlaneGeometry(HAMMER_LEN * aspect, HAMMER_LEN), hMat);
        hammer.rotation.set(-Math.PI / 2, 0, Math.PI / 2);   // nằm ngang, đầu búa về một phía, núm cán phía kia
    }
    const swMat = new THREE.MeshBasicMaterial({ map: getTexture(swirlUrl), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0, side: THREE.DoubleSide });
    const swirl = new THREE.Mesh(new THREE.PlaneGeometry(HAMMER_LEN * 1.25, HAMMER_LEN * 1.25), swMat);
    swirl.rotation.x = -Math.PI / 2;
    swirl.position.y = -0.04;
    rotor.add(swirl, hammer);
    const rMat = new THREE.MeshBasicMaterial({ map: getTexture(auraRingUrl), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), rMat);
    ring.rotation.x = -Math.PI / 2;
    const gMat = new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0xfbbf24, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), gMat);
    glow.rotation.x = -Math.PI / 2;
    scene.add(glow, ring, rotor);
    const st = { stage: 1, angle: 0, t: 0, flash: 0, alive: true };
    st.dispose = () => {
        if (!st.alive) return;
        st.alive = false;
        scene.remove(glow, ring, rotor);
        hMat.dispose(); swMat.dispose(); rMat.dispose(); gMat.dispose();
        if (hammer.geometry !== HAMMER3D?.geo) hammer.geometry.dispose();
        swirl.geometry.dispose(); ring.geometry.dispose(); glow.geometry.dispose();
        charges.delete(key);
    };
    st.setStage = (n) => {
        if (n <= st.stage) return;
        st.stage = Math.min(3, n); st.flash = 1;
        const v = getView(d.casterId, d.casterIdx);
        if (v) {
            spawnShockwave({ x: v.position.x, z: v.position.z }, { color: n >= 3 ? 0xfff7c2 : 0xfbbf24, radius: STAGE_RING[st.stage] + 1.2, life: 0.45 });
            if (n >= 3) cameraRig.shake(0.12, 160);
        }
    };
    charges.set(key, st);
    const maxSec = (d.chargeMax ?? 5000) / 1000 + 1.5;
    runLoop((dt) => {
        if (!st.alive) return true;
        st.t += dt;
        const v = getView(d.casterId, d.casterIdx);
        if (!v || st.t > maxSec) { st.dispose(); return true; }
        // điểm bàn tay giơ lên trên tranh (đánh dấu 'fist' ở tấm whirl) -> búa lơ lửng ngay phía trên
        const hand = v.pointWorld?.('fist', { sticky: true }) ?? new THREE.Vector3(v.position.x, v.position.y + 2.4, v.position.z);
        const bob = 0.05 * Math.sin(st.t * 7);
        rotor.position.set(hand.x, hand.y + HOVER + bob, hand.z);
        st.angle += dt * Math.PI * 2 * STAGE_REV[st.stage] * (v.facingLeft ? 1 : -1);
        rotor.rotation.y = st.angle;
        hMat.opacity = Math.min(1, st.t / 0.15);
        if (hMat.opacity >= 1 && HAMMER3D && hMat.transparent) { hMat.transparent = false; hMat.needsUpdate = true; }   // hiện rõ rồi -> vẽ đặc (đúng chiều sâu)
        swMat.opacity += ((0.65 + 0.15 * st.stage) - swMat.opacity) * Math.min(1, dt * 6);
        // hào quang dưới chân: lớn + sáng dần theo nấc, loé khi lên nấc
        st.flash = Math.max(0, st.flash - dt * 2.5);
        const R = STAGE_RING[st.stage] * (1 + 0.06 * Math.sin(st.t * 6)) + st.flash * 0.6;
        ring.position.set(v.position.x, GROUND_Y + 0.06, v.position.z);
        ring.scale.setScalar(R);
        ring.rotation.z += dt * 0.8;
        rMat.opacity += ((0.45 + 0.18 * st.stage + st.flash * 0.4) - rMat.opacity) * Math.min(1, dt * 6);
        glow.position.set(v.position.x, GROUND_Y + 0.05, v.position.z);
        glow.scale.setScalar(R * 1.25);
        gMat.opacity = 0.12 + 0.08 * st.stage + st.flash * 0.25;
        return false;
    });
}

function endParyCharge(d) {
    charges.get(chargeKey(d))?.dispose?.();
}

// ---------- Chiêu 3 Búa Thánh Khổng Lồ (người dùng 21/11): niệm -> búa thánh hiện ra TRÊN TAY, to dần;
//            mỗi nhịp đập: Pary NHẢY LÊN, búa giáng xuống đất trước mặt; xong nhịp 3 búa tan. ----------
const colossi = new Map();   // "casterId:idx" -> trạng thái búa khổng lồ
const COLOSSUS_H = 5.6;      // chiều cao búa khi đã hiện đủ (Pary cao ~2,6)
// camera tự lùi cho thấy trọn cây búa khổng lồ
cameraRig.addFitSource?.(() => {
    const pts = [];
    for (const c of colossi.values()) {
        const p = c.sp.position, h = c.sp.scale.y * 0.55;
        pts.push([p.x, p.y + h, p.z], [p.x, p.y - h, p.z]);
    }
    return pts;
});

function startColossusHammer(casterId, casterIdx, castSec) {
    const key = `${casterId}:${casterIdx}`;
    colossi.get(key)?.dispose?.();
    const mat = new THREE.SpriteMaterial({ map: hammerTexture(), transparent: true, depthWrite: false, fog: false, opacity: 0 });
    const sp = new THREE.Sprite(mat);
    const gmat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfde68a, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const glow = new THREE.Sprite(gmat);
    sp.visible = false;   // (23/11) búa ánh sáng đã vẽ trong tranh động tác (Pary cầm búa) -> chỉ giữ quầng sáng đi theo búa
    scene.add(glow, sp);
    const st = { sp, glow, mat, gmat, mode: 'grow', t: 0, castSec: Math.max(0.3, castSec), slamT: 0, slamN: 0, landed: false };
    let alive = true;
    st.dispose = () => {
        if (!alive) return;
        alive = false;
        scene.remove(sp, glow); mat.dispose(); gmat.dispose(); colossi.delete(key);
    };
    colossi.set(key, st);
    runLoop((dt) => {
        if (!alive) return true;
        st.t += dt;
        const v = getView(casterId, casterIdx);
        if (!v) { st.dispose(); return true; }
        const dir = v.facingLeft ? -1 : 1;
        const px = v.root.position.x, pz = v.root.position.z, lift = v._lift ?? 0;
        if (st.mode === 'grow') {
            // búa hiện ra trên tay, ĐẦU BÚA HƯỚNG LÊN (lật ảnh), to dần trong lúc niệm
            const k = Math.min(1, st.t / st.castSec), e = 1 - (1 - k) * (1 - k);
            const H = COLOSSUS_H * (0.25 + 0.75 * e);
            mat.rotation = Math.PI;
            sp.center.set(0.5, 0.5);
            sp.scale.set(H * HAMMER_ASPECT, H, 1);
            sp.position.set(px + dir * 0.35, GROUND_Y + lift + 1.2 + H * 0.42, pz + 0.05);
            mat.opacity = Math.min(1, st.t / 0.3);
            glow.position.set(sp.position.x, sp.position.y + H * 0.3, pz);
            glow.scale.setScalar(H * (1.1 + 0.08 * Math.sin(st.t * 9)));
            gmat.opacity = 0.3 + 0.25 * e;
            if (st.t > st.castSec + 3) st.dispose();   // niệm bị ngắt -> tan
        } else {
            // nhịp đập: 0..UP giơ búa cao theo cú nhảy, UP..HIT bổ xuống trước mặt, sau đó đầu búa cắm đất
            st.slamT += dt;
            const big = st.slamN === 3, UP = big ? 0.3 : 0.16, HIT = big ? 0.42 : 0.24;
            const H = COLOSSUS_H * (big ? 1.25 : 1);
            const tx = px + dir * 1.9, tz = pz + 0.3;
            sp.scale.set(H * HAMMER_ASPECT, H, 1);
            sp.center.set(0.5, 0.5);
            if (st.slamT < UP) {
                const k = st.slamT / UP;
                mat.rotation = Math.PI;
                sp.position.set(px + dir * 0.2, GROUND_Y + lift + 1.2 + H * (0.42 + 0.06 * k), pz + 0.05);
            } else if (st.slamT < HIT) {
                const k = (st.slamT - UP) / (HIT - UP), e = k * k;
                mat.rotation = Math.PI * (1 - e);   // lật búa: đầu từ trên xuống dưới
                sp.position.set(px + (tx - px) * e, GROUND_Y + lift + 1.2 + H * 0.48 - (1.2 - 0.02 * H) * e, pz + 0.05 + 0.25 * e);
            } else {
                mat.rotation = 0;
                sp.position.set(tx, GROUND_Y - 0.15 + H * 0.5, tz);   // đầu búa (ở đáy ảnh) cắm đất
                if (!st.landed) {
                    st.landed = true;
                    spawnShockwave({ x: tx, z: tz }, { color: 0xfacc15, radius: big ? 14 : 5, life: big ? 0.75 : 0.5 });
                    if (big) spawnShockwave({ x: tx, z: tz }, { color: 0xffffff, radius: 7, life: 0.45 });
                    safePixelFx(['impacts/heavy-landing'], { pos: { x: tx, z: tz }, scale: big ? 2 : 1.3 });
                }
                if (big) {
                    mat.opacity = Math.max(0, 1 - (st.slamT - HIT - 0.45) / 0.35);
                    if (st.slamT > HIT + 0.8) { st.dispose(); return true; }
                }
            }
            glow.position.set(sp.position.x, sp.position.y, pz);
            glow.scale.setScalar(H * 0.9);
            gmat.opacity = 0.3 * mat.opacity;
        }
        return false;
    });
    return st;
}

/** 1 nhịp đập (server báo lúc trúng đòn): Pary nhảy lên + búa bổ xuống trước mặt */
function colossusSlam(data) {
    let st = colossi.get(`${data.casterId}:${data.casterIdx}`);
    if (!st) st = startColossusHammer(data.casterId, data.casterIdx, 0.01);
    st.mode = 'slam'; st.slamT = 0; st.slamN = data.slam ?? 1; st.landed = false; st.mat.opacity = 1;
    const v = getView(data.casterId, data.casterIdx);
    if (v?.leapTo && v.basePos) {
        const big = st.slamN === 3;
        v.leapTo(v.basePos.x, v.basePos.z, { duration: big ? 0.45 : 0.28, height: big ? 2.6 : 1.2, apex: 0.62 });
    }
}

function playHammerThrow(data) {
    const view = getView(data.casterId, data.casterIdx);
    const sx = view?.position.x ?? data.fromX ?? 0;
    const sz = view?.position.z ?? data.fromZ ?? 0;
    const tx = data.x ?? sx, tz = data.z ?? sz;
    const impactSec = Math.max(0.15, (data.impact ?? 280) / 1000);
    const mat = new THREE.SpriteMaterial({ map: hammerTexture(), transparent: true, depthWrite: false, fog: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(1.6 * HAMMER_ASPECT, 1.6, 1);
    scene.add(sp);
    let t = 0, sparked = false;
    runLoop((dt) => {
        t += dt;
        const cView = getView(data.casterId, data.casterIdx);
        const rx = cView?.position.x ?? sx, rz = cView?.position.z ?? sz;
        if (t <= impactSec) {
            const p = t / impactSec;
            sp.position.set(sx + (tx - sx) * p, GROUND_Y + 1.2 + Math.sin(p * Math.PI) * 1.4, sz + (tz - sz) * p);
        } else {
            if (!sparked) {
                sparked = true;
                spawnShockwave({ x: tx, z: tz }, { color: 0xfbbf24, radius: 1.8, life: 0.35 });
                safePixelFx(['lightning/zap-hit'], { pos: { x: tx, z: tz }, scale: 0.8 });
            }
            const p = Math.min(1, (t - impactSec) / 0.22);
            sp.position.set(tx + (rx - tx) * p, GROUND_Y + 1.2 + Math.sin(p * Math.PI) * 1.1, tz + (rz - tz) * p);
            if (p >= 1) { scene.remove(sp); mat.dispose(); return true; }
        }
        sp.material.rotation += dt * 16;
        return false;
    });
}

export function playParyFxEvent(data) {
    if (!data) return;
    if (data.kind === 'relocateBlocked') {
        const bx = data.x ?? 0, bz = data.z ?? 0;
        spawnShockwave({ x: bx, z: bz }, { color: 0xfde047, radius: 2.2, life: 0.45 });
        safePixelFx(['scifi/force-field'], { pos: { x: bx, z: bz }, palette: 'gold', scale: 0.9, maxLife: 0.6 });
        spawnBlockedText(bx, GROUND_Y + 2.2, bz);
        auras.get(`${data.ownerId}:${data.ownerIdx}`)?.pulse?.();
    } else if (data.kind === 'chargeStart') {
        startParyCharge(data);
    } else if (data.kind === 'chargeStage') {
        charges.get(chargeKey(data))?.setStage?.(data.stage ?? 2);
    } else if (data.kind === 'chargeRelease' || data.kind === 'chargeCancel') {
        endParyCharge(data);
        if (data.kind === 'chargeCancel') getView(data.casterId, data.casterIdx)?.releaseHold?.('spin');
    } else if (data.kind === 'slam') {
        colossusSlam(data);
    } else if (data.kind === 'throw') {
        playHammerThrow(data);
    } else if (data.kind === 'auraEnd') {
        auras.get(`${data.casterId}:${data.casterIdx}`)?.dispose?.();
    }
}
