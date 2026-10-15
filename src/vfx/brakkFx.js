// ============================================================
// HIỆU ỨNG CUỒNG ĐẤU — Brakk (Chiến Binh đô vật, tộc Dragon, lửa đỏ cam)
// ============================================================
// Hình lấy từ atlas brakk_fx.png (tools/build_fx_atlas.py art/brakk/fx_spec.json):
//   bụi lướt 2 khung, nổ đất 2 khung, hố nứt, vòng chấn địa, gai đá 3 khung, vòm khiên vảy rồng, biểu tượng khiên,
//   bụi đá nổ 2 khung, hào quang rồng 3 khung, bùng nổ hoá khổng lồ, móc ngược, cột lửa, rồng bay lên, bùng lửa,
//   hồi máu, vòng rồng, quả Orb, vương miện.
// Mọi hình vẽ nhìn sang PHẢI; nhìn trái thì lật gương (scale.x = -1).
import * as THREE from 'three';
import fxUrl from '../assets/sprites/brakk_fx.png';
import fxMeta from './brakkFx.json';
import { gameTimeout } from '../config.js';
import { addAnim, fxPlane, glowTexture, ringTexture, easeOut, spawnHitSpark, spawnShockwave, spawnRisingSparkles, spawnLandingDust } from './vfx.js';

const FLOOR = -0.45;
const FIRE = 0xff7a1a, EMBER = 0xffb347, HEAL = 0x86efac;

let base = null;
const texCache = {};
function tex(name) {
    if (texCache[name]) return texCache[name];
    base ??= new THREE.TextureLoader().load(fxUrl, t => { t.colorSpace = THREE.SRGBColorSpace; });
    base.colorSpace = THREE.SRGBColorSpace;
    const [W, H] = fxMeta.atlasSize;
    const [x, y, w, h] = fxMeta.parts[name].rect;
    const t = base.clone();
    t.repeat.set(w / W, h / H);
    t.offset.set(x / W, 1 - (y + h) / H);
    t.needsUpdate = true;
    return (texCache[name] = { texture: t, aspect: w / h, w, h });
}
/** Mặt phẳng hiện 1 hình, cao `height` đơn vị (tâm ở giữa hình) */
export function brakkSprite(name, height, { additive = false, opacity = 1 } = {}) {
    const { texture, aspect } = tex(name);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(height * aspect, height), new THREE.MeshBasicMaterial({
        map: texture, transparent: true, depthWrite: false, fog: false, opacity,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide }));
    m.userData.sharedTexture = true;
    return m;
}
function setFrame(mesh, name, height) {
    const { texture, aspect } = tex(name);
    mesh.material.map = texture;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(height * aspect, height);
}
/** Chạy các khung `names` trong `life` giây tại `pos` (cao `size`, chân hình chạm đất), lật theo `dir` */
function playFrames(names, pos, { size = 2, life = 0.4, dir = 1, y = null, z = 0.7, opacity = 1, grow = 0, additive = false } = {}) {
    const m = brakkSprite(names[0], size, { opacity, additive });
    m.scale.x = dir;
    m.position.set(pos.x, y ?? FLOOR + size * 0.5, (pos.z ?? 0) + z);
    let cur = 0;
    addAnim(m, life, (p, fx) => {
        const f = Math.min(names.length - 1, Math.floor(p * names.length));
        if (f !== cur) { cur = f; setFrame(fx.mesh, names[f], size); }
        const s = 1 + grow * easeOut(p);
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.material.opacity = opacity * (p > 0.7 ? (1 - p) / 0.3 : 1);
    });
    return m;
}
/** Hình nằm phẳng trên mặt đất (hố nứt, vòng chấn địa) */
function groundDecal(name, pos, { width = 4, life = 1.2, grow = 0, opacity = 1, spin = 0 } = {}) {
    const T = tex(name);
    const m = brakkSprite(name, width / T.aspect, { opacity });
    m.rotation.x = -Math.PI / 2;
    m.position.set(pos.x, FLOOR + 0.03, pos.z ?? 0);
    addAnim(m, life, (p, fx) => {
        const s = (grow ? 0.5 + easeOut(Math.min(1, p / 0.35)) * 0.5 * (1 + grow) : 1);
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.rotation.z += spin * 0.016;
        fx.mesh.material.opacity = opacity * (p > 0.6 ? (1 - p) / 0.4 : 1);
    });
    return m;
}
function flash(pos, { color = FIRE, size = 1.6, y = 1.0, life = 0.25 } = {}) {
    const c = fxPlane(glowTexture(), size, size, { color });
    c.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + 0.65);
    addAnim(c, life, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.1); fx.mesh.material.opacity = 1 - p; });
}

/** Bụi bật lên khi Brakk dậm nhảy (vệt bụi kéo về phía sau) */
export function spawnBrakkLeapDust(pos, dir = 1) {
    playFrames(['dust0', 'dust1'], pos, { size: 1.3, life: 0.45, dir: -dir, z: 0.4 });
    spawnLandingDust(pos, 6);
}

/**
 * Cú QUẬT / DẬM xuống đất: hố nứt dung nham + nổ đá lửa + bụi + sóng chấn động.
 * @param {{x,z}} pos điểm chạm   @param size độ to (theo bán kính chấn động)
 */
export function spawnBrakkSlam(pos, { size = 1, dir = 1, radius = 3, giant = false } = {}) {
    groundDecal('crater', pos, { width: 3.2 * size, life: 1.6, grow: 0.15 });
    playFrames(['burst0', 'burst1'], pos, { size: 2.2 * size, life: 0.55, dir, z: 0.8 });
    gameTimeout(() => playFrames(['dustBurst0', 'dustBurst1'], pos, { size: 1.9 * size, life: 0.7, dir: -dir, z: 0.5 }), 60);
    spawnShockwave(pos, { color: giant ? 0xff4d1a : FIRE, radius: radius * 0.55, life: 0.5 });
    flash(pos, { size: 2.6 * size, y: 0.4 });
    spawnHitSpark({ x: pos.x, y: -0.5, z: pos.z }, { count: 10, color: EMBER, size: 1.3 * size });
    spawnLandingDust(pos, 12);
}

/** Chấn Địa: vòng lửa lan trên đất + gai đá trồi lên quanh Brakk (+ hố nứt dưới chân) */
export function spawnStompWave(pos, { radius = 4, giant = false } = {}) {
    groundDecal('ring', pos, { width: radius * 2.2, life: 0.9, grow: 0.4 });
    groundDecal('crater', pos, { width: 3.0, life: 1.4 });
    playFrames(['burst0', 'burst1'], pos, { size: 2.0, life: 0.5, z: 0.8 });
    const n = giant ? 7 : 5;
    for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + Math.random() * 0.4;
        const r = radius * (0.55 + Math.random() * 0.35);
        const at = { x: pos.x + Math.cos(a) * r, z: (pos.z ?? 0) + Math.sin(a) * r * 0.45 };
        gameTimeout(() => playFrames(['spike0', 'spike1', 'spike2'], at, { size: 1.4 + Math.random() * 0.5, life: 0.6, dir: Math.cos(a) < 0 ? -1 : 1, z: 0.3 }), 40 + k * 35);
    }
    spawnShockwave(pos, { color: giant ? 0xff4d1a : FIRE, radius: radius * 0.5, life: 0.55 });
    flash(pos, { size: 3.2, y: 0.3 });
    spawnLandingDust(pos, 14);
}

/** Quái bị hất tung / rơi xuống đất: bụi + đá vụn nhỏ */
export function spawnFallImpact(pos) {
    playFrames(['dustBurst0'], pos, { size: 1.1, life: 0.45, z: 0.4 });
    spawnHitSpark({ x: pos.x, y: -0.6, z: pos.z }, { count: 6, color: EMBER, size: 0.9 });
}

/** Cú đấm thường: tia lửa + chớp sáng ở ngực mục tiêu */
export function spawnPunchHit(pos, dir = 1, { crit = false, giant = false } = {}) {
    flash({ x: pos.x, y: pos.y, z: pos.z }, { color: crit ? 0xffe08a : FIRE, size: crit ? 1.8 : 1.3, y: 1.1 });
    spawnHitSpark(pos, { count: crit ? 10 : 7, color: crit ? 0xfff1c2 : EMBER, size: (crit ? 1.2 : 1) * (giant ? 1.25 : 1) });
}

/** Móc ngược (Khổng Lồ): vệt lửa cong vút lên trời + bụi đá dưới chân mục tiêu */
export function spawnUppercut(pos, dir = 1) {
    playFrames(['uppercut'], pos, { size: 2.8, life: 0.55, dir, z: 0.8, grow: 0.1 });
    flash(pos, { color: 0xffd27a, size: 2.0, y: 1.3 });
    spawnHitSpark(pos, { count: 10, color: EMBER, size: 1.3 });
}

/** Hoá Khổng Lồ: rồng lửa bốc lên quanh người + bùng nổ vảy rồng + vòng rồng dưới chân */
export function spawnGiantTransform(pos, dir = 1) {
    playFrames(['dragonRise'], pos, { size: 4.2, life: 0.9, dir, z: -0.3, grow: 0.08 });
    gameTimeout(() => playFrames(['transform'], pos, { size: 3.0, life: 0.7, dir, z: 0.9, grow: 0.2 }), 180);
    groundDecal('dragonRing', pos, { width: 5.5, life: 1.2, grow: 0.3 });
    spawnShockwave(pos, { color: 0xff3b1a, radius: 4, life: 0.6 });
    flash(pos, { color: 0xff6a00, size: 4, y: 1.4, life: 0.4 });
    spawnRisingSparkles(pos, { count: 22, color: EMBER, radius: 1.5 });
}

/** Khiên vảy rồng: biểu tượng khiên bật lên trên đầu + vòm vảy loé sáng */
export function spawnBrakkShieldPop(pos, { height = 3.2 } = {}) {
    const icon = brakkSprite('shieldIcon', 0.9);
    icon.position.set(pos.x, FLOOR + height + 0.4, (pos.z ?? 0) + 0.9);
    const y0 = icon.position.y;
    addAnim(icon, 1.0, (p, fx) => {
        const s = p < 0.15 ? 0.4 + easeOut(p / 0.15) * 0.8 : 1.2 - 0.2 * Math.min(1, (p - 0.15) / 0.2);
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.position.y = y0 + 0.4 * p;
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 1;
    });
    const dome = brakkSprite('bubble', height * 1.05, { opacity: 0.9, additive: true });
    dome.position.set(pos.x, FLOOR + height * 0.5, (pos.z ?? 0) + 0.55);
    addAnim(dome, 0.5, (p, fx) => { const s = 0.7 + easeOut(p) * 0.4; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.9 * (1 - p); });
}

/** Vòm khiên vảy rồng bao quanh Brakk khi còn khiên (gắn vào view, cập nhật theo máu khiên) */
export function makeBrakkBubble(height = 3.2) {
    const g = new THREE.Group();
    // vòm vẽ nền đỏ sẫm bên trong -> cộng sáng (additive): chỉ viền vảy rồng rực lên, người bên trong vẫn rõ
    const dome = brakkSprite('bubble', height, { opacity: 0, additive: true });
    dome.position.set(0, height * 0.5 - 0.1, 0.5);
    g.add(dome);
    let t = 0;
    return {
        group: g,
        update(dt, k, frac = 1, scale = 1) {
            t += dt;
            dome.material.opacity = k * (0.14 + 0.2 * frac) * (0.9 + 0.1 * Math.sin(t * 4));
            g.scale.setScalar(scale * (1 + 0.015 * Math.sin(t * 3)));
        },
        dispose() { g.parent?.remove(g); },
    };
}

/** Hào quang rồng lửa (dạng Khổng Lồ): 3 khung lặp sau lưng + vòng rồng xoay dưới chân */
export function makeGiantAura() {
    const g = new THREE.Group();
    const H = 3.0;
    const aura = brakkSprite('aura0', H, { opacity: 0, additive: true });   // cộng sáng: viền lửa rực, không che người
    aura.position.set(0, H * 0.5 - 0.1, -0.45);
    const ring = brakkSprite('dragonRing', 1.6, { opacity: 0 });
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    const glow = fxPlane(glowTexture(), 4.5, 4.5, { color: 0xff5a1a, opacity: 0 });
    glow.position.set(0, 1.6, -0.45);
    g.add(glow, ring, aura);
    let t = 0, cur = 'aura0';
    return {
        group: g,
        update(dt, k, scale = 1) {
            t += dt;
            const n = 'aura' + (Math.floor(t * 8) % 3);
            if (n !== cur) { cur = n; setFrame(aura, n, H); }
            aura.material.opacity = 0.42 * k;
            ring.material.opacity = 0.7 * k * (0.85 + 0.15 * Math.sin(t * 5));
            ring.scale.setScalar(1 + 0.04 * Math.sin(t * 3));
            glow.material.opacity = 0.14 * k * (0.8 + 0.2 * Math.sin(t * 6));
            g.scale.setScalar(scale);
        },
        dispose() { g.parent?.remove(g); },
    };
}

/** Đếm ngược MIỄN KHỐNG CHẾ (5s đầu Khổng Lồ): vương miện vảy rồng sáng trên đầu */
export function makeImmuneCrown() {
    const m = brakkSprite('crown', 0.8, { opacity: 0 });
    let t = 0;
    return {
        mesh: m,
        update(dt, k) { t += dt; m.material.opacity = k * (0.85 + 0.15 * Math.sin(t * 8)); m.scale.setScalar(1 + 0.05 * Math.sin(t * 5)); },
        dispose() { m.parent?.remove(m); },
    };
}

/**
 * Tiếng Hét Bảo Hộ (thiên phú 1) — tranh art/brakk/fx-c.png:
 *   chớp lửa ở miệng -> ĐẦU RỒNG LỬA lao ra trước gầm -> 3 khung sóng âm ")" toả ra xa dần,
 *   ẤN RỒNG sáng dưới chân (sau người) + VÒNG LỬA bụi đá lan ra (trước người). Tranh vòng / ấn đã vẽ phối cảnh -> dựng đứng sát đất.
 */
export function spawnBattleCry(pos, dir = 1, { height = 3 } = {}) {
    const k = height / 2.9;
    const mouth = { x: pos.x + dir * 0.6 * k, y: FLOOR + height * 0.8, z: (pos.z ?? 0) + 0.85 };
    // chớp lửa ở miệng
    const burst = brakkSprite('cryBurst', 1.6 * k, { additive: true });
    burst.position.set(mouth.x, mouth.y, mouth.z + 0.05);
    addAnim(burst, 0.35, (p, fx) => { const s = 0.5 + easeOut(p) * 0.9; fx.mesh.scale.set(dir * s, s, 1); fx.mesh.material.opacity = 1 - p; });
    // đầu rồng lửa lao ra trước
    const dragon = brakkSprite('cryDragon', 1.7 * k);
    dragon.position.set(mouth.x, mouth.y, mouth.z);
    addAnim(dragon, 0.75, (p, fx) => {
        const e = easeOut(p);
        const s = 0.6 + e * 0.55;
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.position.x = mouth.x + dir * (0.1 + e * 1.8) * k;
        fx.mesh.position.y = mouth.y + 0.15 * Math.sin(p * 9) * (1 - p);
        fx.mesh.material.opacity = p < 0.12 ? p / 0.12 : p > 0.6 ? (1 - p) / 0.4 : 1;
    });
    // sóng âm: 3 khung, mỗi đợt bay xa dần (2 đợt)
    for (let w = 0; w < 2; w++) gameTimeout(() => {
        const H = 1.7 * k;
        const m = brakkSprite('cryArc0', H, { additive: true });
        m.position.set(mouth.x, mouth.y, mouth.z + 0.1);
        let cur = 'cryArc0';
        addAnim(m, 0.6, (p, fx) => {
            const n = 'cryArc' + Math.min(2, Math.floor(p * 3));
            if (n !== cur) { cur = n; setFrame(fx.mesh, n, H * (1 + 0.35 * Math.min(2, Math.floor(p * 3)))); }
            fx.mesh.scale.x = dir;
            fx.mesh.position.x = mouth.x + dir * (1.0 + easeOut(p) * 3.5) * k;
            fx.mesh.material.opacity = p > 0.6 ? (1 - p) / 0.4 : 1;
        });
    }, 60 + w * 220);
    // ấn rồng dưới chân (sau lưng người) + vòng lửa bụi đá lan ra (trước người)
    const seal = brakkSprite('crySeal', 1.3 * k, { additive: true });
    seal.position.set(pos.x, FLOOR + 0.3 * k, (pos.z ?? 0) - 0.35);
    addAnim(seal, 1.2, (p, fx) => {
        const s = 0.4 + easeOut(Math.min(1, p / 0.3)) * 0.6;
        fx.mesh.scale.set(s * 1.0, s, 1);
        fx.mesh.material.opacity = p > 0.65 ? (1 - p) / 0.35 : 1;
    });
    const ring = brakkSprite('cryRing', 1.4 * k);
    ring.position.set(pos.x, FLOOR + 0.25 * k, (pos.z ?? 0) + 0.9);
    addAnim(ring, 0.8, (p, fx) => {
        const s = 0.5 + easeOut(p) * 1.4;
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.position.y = FLOOR + 0.25 * k * s;
        fx.mesh.material.opacity = p > 0.5 ? (1 - p) / 0.5 : 1;
    });
    spawnShockwave(pos, { color: FIRE, radius: 4, life: 0.7 });
}

/** Biểu tượng khiêu khích (khiên vảy rồng + dấu "!") trên đầu đối thủ bị Brakk khiêu khích — bám theo người trong `life` giây */
export function spawnCryIcon(view, { life = 3, y = null } = {}) {
    const m = brakkSprite('cryIcon', 0.85);
    const y0 = y ?? (view.height ?? 2.9) + 0.25;
    m.position.set(0, y0, 0.35);
    const parent = view.root;
    addAnim(m, life, (p, fx) => {
        const t = p * life;
        const pop = t < 0.18 ? 0.3 + easeOut(t / 0.18) * 1.0 : 1.3 - 0.3 * Math.min(1, (t - 0.18) * 5);
        fx.mesh.scale.set(pop, pop, 1);
        fx.mesh.position.y = y0 + 0.06 * Math.sin(t * 6) + (view._lift ?? 0);
        fx.mesh.material.opacity = p > 0.85 ? (1 - p) / 0.15 : 1;
    }, parent);
}

/** Thiên phú Long Huyết Bất Khuất: cột lửa rồng bùng trên Brakk; đồng đội được hồi máu + Orb */
export function spawnBloodSurge(pos) {
    playFrames(['pillar'], pos, { size: 3.6, life: 0.8, z: 0.8, grow: 0.06 });
    playFrames(['flameBurst'], pos, { size: 2.6, life: 0.6, z: 0.6 });
    groundDecal('dragonRing', pos, { width: 4.5, life: 1.0, grow: 0.25 });
    spawnRisingSparkles(pos, { count: 20, color: EMBER, radius: 1.2 });
}
/** Hồi máu (thiên phú) trên 1 người: ánh xanh lá + vàng */
export function spawnBrakkHeal(pos, { orb = false } = {}) {
    playFrames(['heal'], pos, { size: 2.4, life: 0.8, z: 0.7 });
    spawnRisingSparkles(pos, { count: 10, color: HEAL, radius: 0.8 });
    if (!orb) return;
    const o = brakkSprite('orb', 0.75);
    o.position.set(pos.x, FLOOR + 2.2, (pos.z ?? 0) + 0.9);
    const y0 = o.position.y;
    addAnim(o, 1.0, (p, fx) => {
        fx.mesh.position.y = y0 + 0.6 * easeOut(p);
        fx.mesh.scale.setScalar(p < 0.15 ? 0.3 + p / 0.15 * 0.7 : 1);
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 1;
    });
}

/** Quái bị Brakk túm: đi theo cung nhảy của Brakk (trên đầu Brakk) rồi bị quật xuống điểm `to` */
export function arcCarry(view, from, to, { duration = 0.8, height = 3.2 } = {}) {
    if (!view?.leapTo) return;
    // nhấc lên qua đầu (nửa đầu), rơi cắm xuống (nửa sau): dùng 2 chặng leapTo
    const mid = { x: from.x + (to.x - from.x) * 0.45, z: from.z + (to.z - from.z) * 0.45 };
    view.leapTo(mid.x, mid.z, { duration: duration * 0.62, height: height * 0.8 });
    gameTimeout(() => view.leapTo(to.x, to.z, { duration: duration * 0.38, height: height * 0.35 }), duration * 620);
}

export { ringTexture };
