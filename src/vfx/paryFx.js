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
import auraRunesUrl from '../assets/sprites/pary_aura_runes.webp';
import lightWallUrl from '../assets/sprites/pary_light_wall.webp';
import impactRingUrl from '../assets/sprites/pary_impact_ring.webp';

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
    // (23/11) người dùng: "xấu quá" — vòng cộng sáng trên cỏ thành xanh chanh + mảng sáng phủ trong vòng. Giờ: ảnh có nền
    // trong suốt (giữ đúng vàng kim), hoà trộn thường, bỏ mảng sáng; vòng bung từ nhỏ ra lúc mở, mờ dần lúc hết.
    const ringMat = new THREE.MeshBasicMaterial({
        map: getTexture(auraRingUrl), transparent: true, depthWrite: false, opacity: 0, fog: false,
    });
    const RS = radius * 2 / 0.727;
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(RS, RS), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    // (23/11) người dùng: "quá đơn giản, thêm hình trong vòng + hào quang dạng bức tường": vòng phép búa thánh khắc chữ
    // (tranh Flow art/pary/aura-ring.png) nằm trong vòng, quay ngược chiều; tường ánh sáng vàng (tranh Flow art/pary/light-wall.png)
    // dựng thẳng đứng quanh mép vòng, chạy chậm vòng quanh, mọc lên lúc mở và hạ xuống lúc hết.
    const runeMat = new THREE.MeshBasicMaterial({ map: getTexture(auraRunesUrl), transparent: true, depthWrite: false, opacity: 0, fog: false });
    const runes = new THREE.Mesh(new THREE.PlaneGeometry(radius * 1.85, radius * 1.85), runeMat);
    runes.rotation.x = -Math.PI / 2;
    runes.position.y = 0.04;
    const WALL_H = 2.4;
    const wallTex = getTexture(lightWallUrl).clone();
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.repeat.set(5, 1);
    wallTex.needsUpdate = true;
    const glowMat = new THREE.MeshBasicMaterial({ map: wallTex, transparent: true, depthWrite: false, opacity: 0, fog: false, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, WALL_H, 72, 1, true), glowMat);
    group.add(runes, glow, ring);
    scene.add(group);

    let elapsed = 0;
    const maxSec = duration / 1000;
    let alive = true;
    const dispose = () => {
        if (!alive) return;
        alive = false;
        scene.remove(group);
        ringMat.dispose();
        runeMat.dispose(); runes.geometry.dispose(); wallTex.dispose();
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
        const open = Math.min(1, elapsed / 0.35), grow = 1 - (1 - open) * (1 - open);
        ring.scale.setScalar(0.35 + 0.65 * grow);
        const fade = Math.min(1, (maxSec - elapsed) / 0.5);
        ringMat.opacity += ((0.9 + 0.1 * Math.sin(elapsed * 3)) * fade - ringMat.opacity) * Math.min(1, dt * 8);
        runes.rotation.z -= dt * 0.18;
        runes.scale.setScalar(0.35 + 0.65 * grow);
        runeMat.opacity = 0.62 * grow * fade;
        // tường: mọc từ đất lên trong 0,45s, hạ xuống khi hết; ánh sáng chạy chậm quanh vòng
        const up = Math.min(1, elapsed / 0.45) * fade, hh = Math.max(0.02, up);
        glow.scale.set(0.35 + 0.65 * grow, hh, 0.35 + 0.65 * grow);
        glow.position.y = WALL_H * hh / 2;
        wallTex.offset.x += dt * 0.04;
        glowMat.opacity = (0.78 + 0.12 * Math.sin(elapsed * 4)) * fade;
        return false;
    });
}

export function playParySkill(data) {
    const view = getView(data.casterId, data.casterIdx);
    const p = view?.position ?? new THREE.Vector3(data.newX ?? 0, GROUND_Y, data.newZ ?? 0);
    if (data.type === 'holy_aura') {
        attachAuraRing(data.casterId, data.casterIdx, data.radius ?? 4.5, data.duration ?? 6000);   // vòng tự bung ra (không thêm sóng cộng sáng)
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
const STAGE_REV = [0, 5.5, 6.2, 7];     // vòng / giây theo nấc — người dùng: "luôn xoay nhanh" (nấc sau nhanh hơn chút)
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
        // đầu búa = đầu to bè hơn -> đưa về +X (lật X và Y để không lật mặt tam giác)
        let wLo = 0, wHi = 0;
        for (let i = 0; i < n; i++) {
            const w = Math.hypot(Q[i * 3 + 1], Q[i * 3 + 2]);
            if (Q[i * 3] < -0.3) wLo = Math.max(wLo, w); else if (Q[i * 3] > 0.3) wHi = Math.max(wHi, w);
        }
        if (wLo > wHi) for (let i = 0; i < n; i++) { Q[i * 3] = -Q[i * 3]; Q[i * 3 + 1] = -Q[i * 3 + 1]; }
        // (23/11) "đập không phải bằng mặt đầu búa": khối đầu búa phải nằm DỌC trục Y (trong mặt phẳng vung) để 2 MẶT ĐẬP
        // (2 đầu khối) hướng xuống đất khi bổ. Đo bề dài khối đầu búa theo Y và Z; Z dài hơn -> xoay 90° quanh cán.
        let eY = 0, eZ = 0;
        for (let i = 0; i < n; i++) if (Q[i * 3] > 0.3) { eY = Math.max(eY, Math.abs(Q[i * 3 + 1])); eZ = Math.max(eZ, Math.abs(Q[i * 3 + 2])); }
        if (eZ > eY) { for (let i = 0; i < n; i++) { const y = Q[i * 3 + 1]; Q[i * 3 + 1] = Q[i * 3 + 2]; Q[i * 3 + 2] = -y; } [eY, eZ] = [eZ, eY]; }
        let hx0 = 1, hx1 = 0;   // khoảng X của khối đầu búa (điểm có |Y| lớn)
        for (let i = 0; i < n; i++) if (Math.abs(Q[i * 3 + 1]) > eY * 0.6) { hx0 = Math.min(hx0, Q[i * 3]); hx1 = Math.max(hx1, Q[i * 3]); }
        var headInfo = { half: eY, center: (hx0 + hx1) / 2 };
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(Q, 3));
        if (mesh.geometry.attributes.uv) geo.setAttribute('uv', mesh.geometry.attributes.uv);
        if (mesh.geometry.index) geo.setIndex(mesh.geometry.index);
        geo.computeBoundingSphere();
        HAMMER3D = { geo, map: mesh.material.map ?? null, headHalf: headInfo.half, headX: headInfo.center };
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
    const swMat = new THREE.MeshBasicMaterial({ map: getTexture(swirlUrl), transparent: true, depthWrite: false, fog: false, opacity: 0, side: THREE.DoubleSide });   // ảnh nền trong suốt -> giữ vàng kim
    const swirl = new THREE.Mesh(new THREE.PlaneGeometry(HAMMER_LEN * 1.25, HAMMER_LEN * 1.25), swMat);
    swirl.rotation.x = -Math.PI / 2;
    swirl.position.y = -0.04;
    rotor.add(swirl, hammer);
    const rMat = new THREE.MeshBasicMaterial({ map: getTexture(auraRingUrl), transparent: true, depthWrite: false, fog: false, opacity: 0 });
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
        gMat.opacity = 0;   // (bỏ mảng sáng cộng trên cỏ — thành xanh chanh)
        return false;
    });
}

function endParyCharge(d) {
    charges.get(chargeKey(d))?.dispose?.();
}

// ---------- Chiêu 3 Búa Thánh Khổng Lồ (người dùng 23/11: "cây búa to khổng lồ mới đúng ý"): tranh Pary tay KHÔNG
//            (Flow, art/pary/sprite/sss-colossus.png, điểm 'grip' = nắm tay từng khung) + búa thánh 3D (Meshy) dài ~2,4 lần
//            người gắn vào nắm tay. Góc búa theo khung tranh đang hiện: niệm -> búa mọc từ ánh sáng giơ trên đầu; mỗi nhịp:
//            nhảy, vung ra sau, bổ xuống, đầu búa cắm đất trước mặt (sóng chấn động); nhịp 3 to hơn, xong thì tan. ----------
const colossi = new Map();   // "casterId:idx" -> trạng thái búa khổng lồ
const GIANT_LEN = 6.4;       // chiều dài búa khổng lồ (Pary cao ~2,6)
// góc búa theo khung (độ; 0 = chĩa thẳng lên, dương = ngả về phía trước mặt Pary)
const GIANT_ANG = { colossus1: 0, colossus2: 18, colossus3: 28, colossus4: 32, colossus5: -60, colossus6: 0, colossus7: 105, colossus8: 142 };
// camera tự lùi cho thấy trọn cây búa khổng lồ
cameraRig.addFitSource?.(() => {
    const pts = [];
    for (const c of colossi.values()) if (c.head) pts.push([c.pivot.position.x, c.pivot.position.y, c.pivot.position.z], [c.head.x, c.head.y, c.head.z]);
    return pts;
});

function startColossusHammer(casterId, casterIdx, castSec) {
    const key = `${casterId}:${casterIdx}`;
    colossi.get(key)?.dispose?.();
    if (!HAMMER3D) return null;
    const pivot = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ map: HAMMER3D.map, color: 0xfff1c4, transparent: true, opacity: 0, fog: false });
    const mesh = new THREE.Mesh(HAMMER3D.geo, mat);
    mesh.position.x = 0.46;          // nắm gần đuôi cán: đuôi cán (x = -0,5) nằm ngay sau nắm tay
    mesh.rotation.x = 0;             // khối đầu búa nằm trong mặt phẳng vung (mặt đập hướng theo chiều vung)
    const inner = new THREE.Group();
    inner.add(mesh);
    pivot.add(inner);
    const gmat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfde68a, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const glow = new THREE.Sprite(gmat);
    // hào quang ôm cả cây búa (quầng sáng vàng dọc thân búa) + vệt sáng vàng theo đường vung (tranh Flow pary_swirl)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff1b0, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    const trailMat = new THREE.MeshBasicMaterial({ map: getTexture(swirlUrl), transparent: true, depthWrite: false, fog: false, opacity: 0, side: THREE.DoubleSide });
    const trail = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), trailMat);
    scene.add(pivot, glow, halo, trail);
    const st = { pivot, inner, mat, gmat, glow, halo, trail, trailMat, mode: 'grow', t: 0, castSec: Math.max(0.3, castSec), slamT: 0, slamN: 0, landed: false, ang: 0, head: null };
    let alive = true;
    st.dispose = () => {
        if (!alive) return;
        alive = false;
        scene.remove(pivot, glow, halo, trail); mat.dispose(); gmat.dispose(); halo.material.dispose(); trailMat.dispose(); trail.geometry.dispose(); colossi.delete(key);
    };
    colossi.set(key, st);
    const _h = new THREE.Vector3();
    runLoop((dt) => {
        if (!alive) return true;
        st.t += dt;
        const v = getView(casterId, casterIdx);
        if (!v) { st.dispose(); return true; }
        const frame = v._frame ?? '';
        if (!frame.startsWith('colossus') && st.t > 0.3) {
            if (st.mode === 'grow' || v._clipName === 'dead') { st.dispose(); return true; }   // niệm bị ngắt (choáng...) / gục -> tan
            v.playAction?.('colossusHold', { hold: true });   // giữa các nhịp: đòn đánh thường xen vào -> vẫn giơ búa khổng lồ
        }
        const grip = v.pointWorld?.('grip', { sticky: true }) ?? new THREE.Vector3(v.position.x, v.position.y + 2.2, v.position.z);
        pivot.position.set(grip.x, grip.y, grip.z + 0.35);   // trước thân Pary một chút
        const dir = v.facingLeft ? -1 : 1;
        let target = (GIANT_ANG[frame] ?? st.ang * 180 / Math.PI) * Math.PI / 180;
        // (23/11) người dùng: búa đập xuống "sai logic" — góc cố định làm đầu búa dài 6,4 cắm xuyên xuống dưới đất.
        // Khung bổ xuống / chạm đất: tính góc để ĐẦU BÚA nằm vừa trên mặt đất trước mặt (theo độ cao nắm tay lúc đó)
        if (frame === 'colossus7' || frame === 'colossus8') {
            const Lnow = inner.scale.x || GIANT_LEN;
            const d = (0.46 + (HAMMER3D.headX ?? 0.4)) * Lnow, hh = (HAMMER3D.headHalf ?? 0.15) * Lnow;
            // đầu búa ở d theo cán, khối đầu búa vuông góc cán: điểm thấp nhất = grip.y + d·cos a - hh·|sin a|
            let ground = Math.PI * 0.75;
            for (let a = 0.6; a < Math.PI; a += 0.01) { if (grip.y + d * Math.cos(a) - hh * Math.abs(Math.sin(a)) <= GROUND_Y + 0.05) { ground = a; break; } }
            target = frame === 'colossus8' ? ground : ground * 0.8;
        }
        st.ang += (target - st.ang) * Math.min(1, dt * 28);
        pivot.rotation.z = Math.PI / 2 - st.ang * dir;      // trục +X của búa (về phía đầu búa) xoay theo góc
        // to dần khi niệm (búa mọc từ ánh sáng), nhịp 3 to hơn
        const big = st.mode === 'slam' && st.slamN === 3;
        const grow = st.mode === 'grow' ? 1 - Math.pow(1 - Math.min(1, st.t / (st.castSec * 0.6)), 2) : 1;
        const L = GIANT_LEN * (0.15 + 0.85 * grow) * (big ? 1.15 : 1);
        inner.scale.setScalar(L);
        mat.opacity = Math.min(1, st.t / 0.25);
        if (mat.opacity >= 1 && mat.transparent) { mat.transparent = false; mat.needsUpdate = true; }
        // đầu búa (thế giới) -> quầng sáng + điểm cắm đất
        _h.set(0.92 * L, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), pivot.rotation.z).add(pivot.position);
        st.head = _h.clone();
        glow.position.copy(_h);
        glow.scale.setScalar(L * (0.75 + 0.06 * Math.sin(st.t * 9)));
        // quầng sáng dọc thân búa (giữa cán) — búa thánh luôn toả hào quang
        st.halo.position.copy(pivot.position).lerp(_h, 0.55);
        st.halo.scale.set(L * 1.05, L * 1.05, 1);
        st.halo.material.opacity = 0.35 + 0.1 * Math.sin(st.t * 6);
        // vệt sáng: đĩa đứng (mặt phẳng vung) tâm ở nắm tay, đầu sáng của vệt bám theo đầu búa; hiện khi vung / bổ
        const swing = frame === 'colossus5' || frame === 'colossus6' || frame === 'colossus7' || (frame === 'colossus8' && st.mode === 'slam' && (st.slamT - (st.landAt ?? st.slamT)) < 0.15);
        st.trail.position.set(pivot.position.x, pivot.position.y, pivot.position.z + 0.05);
        // tranh vệt xoáy: đầu sáng ở góc ~80° (gần đỉnh), vòng xoáy bán kính ~0,36 cạnh ảnh -> phóng cho khớp đầu búa (0,86·L)
        const TS = L * 1.2, bright = v.facingLeft ? Math.PI - 1.4 : 1.4;
        st.trail.scale.set(TS * (v.facingLeft ? -1 : 1), TS, 1);
        st.trail.rotation.set(0, 0, pivot.rotation.z - bright);
        st.trailMat.opacity += ((swing ? 0.95 : 0) - st.trailMat.opacity) * Math.min(1, dt * (swing ? 30 : 8));
        gmat.opacity = st.mode === 'grow' ? 0.55 * (1 - grow) + 0.25 : 0.25;
        if (st.mode === 'grow') {
            if (st.t > st.castSec + 3) st.dispose();
        } else {
            st.slamT += dt;
            if (!st.landed && frame === 'colossus8') {
                st.landed = true;
                const gx = _h.x, gz = v.position.z + 0.3;
                spawnShockwave({ x: gx, z: gz }, { color: 0xfacc15, radius: big ? 14 : 5, life: big ? 0.75 : 0.5 });
                if (big) spawnShockwave({ x: gx, z: gz }, { color: 0xffffff, radius: 7, life: 0.45 });
                safePixelFx(['impacts/heavy-landing'], { pos: { x: gx, z: gz }, scale: big ? 2.2 : 1.4 });
                spawnImpactHalo(gx, gz, big);
                st.landAt = st.slamT;
            }
            if (big && st.landed && st.slamT - st.landAt > 0.55) {
                const f = 1 - (st.slamT - st.landAt - 0.55) / 0.35;
                if (!mat.transparent) { mat.transparent = true; mat.needsUpdate = true; }
                mat.opacity = Math.max(0, f);
                if (f <= 0) { st.dispose(); v.releaseHold?.('colossusHold'); return true; }
            }
        }
        return false;
    });
    return st;
}

/** Hào quang lúc búa khổng lồ cắm đất: mặt đất nứt toác + sóng sáng vàng (tranh Flow art/pary/impact-ring.png — người dùng 23/11:
 *  "vòng khi đập khác đi", không dùng lại vòng phép của chiêu 2) loé to ra + vòng tường ánh sáng bung lên rồi tắt */
function spawnImpactHalo(x, z, big) {
    const R = big ? 4.2 : 2.6;
    const rMat = new THREE.MeshBasicMaterial({ map: getTexture(impactRingUrl), transparent: true, depthWrite: false, fog: false, opacity: 1 });
    const runes = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), rMat);
    runes.rotation.z = Math.random() * Math.PI * 2;
    runes.rotation.x = -Math.PI / 2;
    runes.position.set(x, GROUND_Y + 0.06, z);
    const wTex = getTexture(lightWallUrl).clone();
    wTex.wrapS = THREE.RepeatWrapping; wTex.repeat.set(3, 1); wTex.needsUpdate = true;
    const wMat = new THREE.MeshBasicMaterial({ map: wTex, transparent: true, depthWrite: false, fog: false, opacity: 1, side: THREE.DoubleSide });
    const H = big ? 3.2 : 2.2;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, H, 48, 1, true), wMat);
    wall.position.set(x, GROUND_Y + H / 2, z);
    scene.add(runes, wall);
    let t = 0;
    const life = big ? 1.3 : 0.95;
    runLoop((dt) => {
        t += dt;
        const k = Math.min(1, t / life), e = 1 - (1 - k) * (1 - k);
        runes.scale.setScalar(R * 1.25 * (0.55 + 0.45 * e));
        rMat.opacity = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;   // đất nứt giữ rõ một lúc rồi mới mờ
        const wr = R * (0.3 + 0.75 * e);
        wall.scale.set(wr, Math.max(0.05, 1 - k * 0.6), wr);
        wall.position.y = GROUND_Y + H * wall.scale.y / 2;
        wMat.opacity = (1 - k) * 0.95;
        if (k >= 1) { scene.remove(runes, wall); rMat.dispose(); wMat.dispose(); wTex.dispose(); runes.geometry.dispose(); wall.geometry.dispose(); return true; }
        return false;
    });
}

/** 1 nhịp đập (server báo lúc trúng đòn): Pary nhảy lên cầm búa khổng lồ bổ xuống trước mặt */
function colossusSlam(data) {
    let st = colossi.get(`${data.casterId}:${data.casterIdx}`);
    if (!st) st = startColossusHammer(data.casterId, data.casterIdx, 0.01);
    if (st) { st.mode = 'slam'; st.slamT = 0; st.slamN = data.slam ?? 1; st.landed = false; }
    const v = getView(data.casterId, data.casterIdx);
    if (v?.leapTo && v.basePos) {
        const big = (data.slam ?? 1) === 3;
        v.leapTo(v.basePos.x, v.basePos.z, { duration: 0.3, height: big ? 2.4 : 1.2, apex: 0.55 });   // chạm đất đúng lúc búa cắm đất (0,3s)
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
