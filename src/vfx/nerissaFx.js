// ============================================================
// HIỆU ỨNG THỦY VŨ — Nerissa (Tu Sĩ nước, vũ công dải lụa)
// ============================================================
// Hình lấy từ atlas nerissa_fx.png (tools/build_fx_atlas.py art/nerissa/fx_spec.json):
//   giọt nước + nước bắn, vòng sóng lụa 3 khung, MP bay lên, mưa hồi máu, bong bóng giáp nước, vòng thuỷ triều,
//   ấn hoa sen, 3 nốt nhạc, hào quang Thủy Thần, biểu tượng −M.DEF / +sát thương phép, hút Orb, giải khống chế, tim +máu.
// Mọi hình vẽ nhìn sang PHẢI; nhìn trái thì lật gương (scale.x = -1).
import * as THREE from 'three';
import fxUrl from '../assets/sprites/nerissa_fx.png';
import fxMeta from './nerissaFx.json';
import { addAnim, fxPlane, glowTexture, easeOut, spawnHitSpark, spawnShockwave, spawnRisingSparkles } from './vfx.js';

const FLOOR = -0.45;
const AQUA = 0x5eead4, WATER = 0x38bdf8, GOLD = 0xfde68a;

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
export function waterSprite(name, height, { additive = true, opacity = 1 } = {}) {
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
function pop(name, pos, { size = 1.6, life = 0.5, y = 1.0, z = 0.7, grow = 0.5, rise = 0, dir = 1, additive = true, opacity = 1 } = {}) {
    const m = waterSprite(name, size, { additive, opacity });
    m.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + z);
    const y0 = m.position.y;
    addAnim(m, life, (p, fx) => {
        const s = 0.6 + easeOut(Math.min(1, p / 0.3)) * (0.4 + grow * p);
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.position.y = y0 + rise * p;
        fx.mesh.material.opacity = opacity * (p > 0.6 ? (1 - p) / 0.4 : 1);
    });
    return m;
}
function groundDecal(name, pos, { width = 4, life = 1, grow = 0.4, opacity = 0.9, spin = 0 } = {}) {
    const T = tex(name);
    const m = waterSprite(name, width / T.aspect, { opacity });
    m.rotation.x = -Math.PI / 2;
    m.position.set(pos.x, FLOOR + 0.04, pos.z ?? 0);
    addAnim(m, life, (p, fx) => {
        const s = 0.5 + easeOut(Math.min(1, p / 0.4)) * 0.5 * (1 + grow);
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.rotation.z += spin * 0.016;
        fx.mesh.material.opacity = opacity * (p > 0.6 ? (1 - p) / 0.4 : 1);
    });
    return m;
}
function flash(pos, { color = AQUA, size = 1.4, y = 1.0, life = 0.25 } = {}) {
    const c = fxPlane(glowTexture(), size, size, { color });
    c.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + 0.65);
    addAnim(c, life, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.1); fx.mesh.material.opacity = 1 - p; });
}

/** Đánh thường: giọt nước bay từ `from` tới `to` (vòng cung nhẹ), chạm thì bắn tung */
export function spawnWaterBolt(from, to, { duration = 0.18, onHit } = {}) {
    const m = waterSprite('drop', 0.45);
    const dx = to.x - from.x, dy = (to.y ?? 1) - (from.y ?? 1);
    m.scale.x = dx < 0 ? -1 : 1;
    let hit = false;
    addAnim(m, duration, (p, fx) => {
        fx.mesh.position.set(from.x + dx * p, (from.y ?? 1) + dy * p + Math.sin(p * Math.PI) * 0.35, ((from.z ?? 0) + ((to.z ?? 0) - (from.z ?? 0)) * p) + 0.7);
        fx.mesh.rotation.z = Math.atan2(dy + Math.cos(p * Math.PI) * 0.35 * Math.PI, Math.abs(dx)) * (dx < 0 ? -1 : 1) * 0.6;
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}
export function spawnSplash(pos, { size = 1.1 } = {}) {
    pop('splash', pos, { size, life: 0.35, y: 1.0, grow: 0.3 });
}

/** Bắt đầu điệu múa: vòng sóng lụa xoáy quanh người + vòng thuỷ triều / ấn hoa sen dưới chân */
export function spawnDanceStart(pos, dance, dir = 1) {
    const H = 2.6;
    const ring = waterSprite('ring0', H);
    ring.position.set(pos.x, FLOOR + H * 0.5 + 0.2, (pos.z ?? 0) + 0.75);
    let cur = 'ring0';
    addAnim(ring, 0.6, (p, fx) => {
        const n = 'ring' + Math.min(2, Math.floor(p * 3));
        if (n !== cur) { cur = n; setFrame(fx.mesh, n, H); }
        fx.mesh.scale.set(dir, 1, 1);
        fx.mesh.material.opacity = p > 0.65 ? (1 - p) / 0.35 : 1;
    });
    if (dance === 1) { groundDecal('tideRing', pos, { width: 4.5, life: 1.0 }); pop('manaRise', pos, { size: 2.2, life: 0.9, y: 1.1, rise: 0.6 }); }
    if (dance === 2) { groundDecal('tideRing', pos, { width: 3.6, life: 0.9 }); pop('healRain', pos, { size: 2.4, life: 0.9, y: 1.2 }); }
    if (dance === 3) {
        groundDecal('lotus', pos, { width: 5.2, life: 1.4, grow: 0.3 });
        pop('heart', pos, { size: 0.8, life: 1.0, y: 3.3, rise: 0.4 });
        spawnShockwave(pos, { color: AQUA, radius: 4, life: 0.6 });
    }
    flash(pos, { size: 2.2, y: 1.2 });
}

/** Sóng Triều: MP bay lên trên đồng đội (mỗi lần nhận MP) */
export function spawnManaRise(pos, { size = 1.5, opacity = 0.85 } = {}) {
    pop('manaRise', pos, { size, life: 0.7, y: 1.2, rise: 0.5, opacity });
}
/** Lưu Thủy: mưa nước hồi máu rơi trên đồng đội */
export function spawnHealRain(pos) {
    pop('healRain', pos, { size: 1.9, life: 0.6, y: 1.3, grow: 0.1, opacity: 0.9 });
}
/** Nốt nhạc bay từ Nerissa tới `getTo()` (đối thủ: nốt xanh ; đồng đội: khoá Sol vàng nhẹ) */
export function spawnNote(from, getTo, { ally = false, duration = 0.35, kind = 0, onHit } = {}) {
    const name = 'note' + (ally ? 2 : kind % 2);
    const m = waterSprite(name, ally ? 0.6 : 0.7);
    const a = { x: from.x, y: (from.y ?? 0) + 2.2, z: (from.z ?? 0) + 0.9 };
    const lift = 0.8 + Math.random() * 0.8;
    addAnim(m, duration, (p, fx) => {
        const t = getTo();
        const b = { x: t.x, y: (t.y ?? 0) + 1.4, z: (t.z ?? 0) + 0.9 };
        const e = easeOut(p);
        fx.mesh.position.set(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e + Math.sin(p * Math.PI) * lift, a.z + (b.z - a.z) * e);
        fx.mesh.rotation.z = Math.sin(p * 10) * 0.25;
        fx.mesh.material.opacity = p > 0.85 ? (1 - p) / 0.15 : 1;
        if (p >= 1 && onHit) { const f = onHit; onHit = null; f(); }
    });
}
/** Nốt nhạc trúng: biểu tượng nhỏ −M.DEF (đối thủ) / +sát thương phép (đồng đội) */
export function spawnNoteMark(pos, ally = false) {
    pop(ally ? 'matkUp' : 'mdefDown', pos, { size: 0.65, life: 0.8, y: 3.0, rise: 0.35, additive: false });
}
/** Giải khống chế: xiềng xích vỡ */
export function spawnCleanseChains(pos) {
    pop('cleanse', pos, { size: 1.5, life: 0.55, y: 1.1, grow: 0.4 });
}
/** Hút Orb đối thủ (Hòa Âm 2+3) */
export function spawnOrbDrain(pos) {
    pop('drain', pos, { size: 1.0, life: 0.7, y: 2.9, rise: -0.4 });
}
/** Giáp nước vừa xuất hiện (Hòa Âm 1+2) */
export function spawnWaterShieldPop(pos, { height = 2.9 } = {}) {
    const m = waterSprite('bubble', height * 1.05, { opacity: 0.8 });
    m.position.set(pos.x, FLOOR + height * 0.5, (pos.z ?? 0) + 0.55);
    addAnim(m, 0.45, (p, fx) => { const s = 0.7 + easeOut(p) * 0.35; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.8 * (1 - p); });
}
/** Orb cả đội (Hòa Âm 1+2+3 / Triều Dâng): giọt nước sáng + MP bay lên */
export function spawnOrbGift(pos) {
    pop('manaRise', pos, { size: 1.8, life: 0.8, y: 1.3, rise: 0.6 });
    spawnRisingSparkles(pos, { count: 10, color: WATER, radius: 0.8 });
}

/** Bong bóng giáp nước bao quanh 1 nhân vật khi còn giáp (gắn vào view) */
export function makeWaterBubble(height = 2.9) {
    const g = new THREE.Group();
    const dome = waterSprite('bubble', height * 1.05, { opacity: 0 });
    dome.position.set(0, height * 0.5 - 0.1, 0.55);
    g.add(dome);
    let t = 0;
    return {
        group: g,
        update(dt, k, frac = 1) {
            t += dt;
            dome.material.opacity = k * (0.16 + 0.24 * frac) * (0.9 + 0.1 * Math.sin(t * 4));
            g.scale.setScalar(1 + 0.02 * Math.sin(t * 3));
        },
        dispose() { g.parent?.remove(g); },
    };
}
/** Hào quang Thủy Thần sau lưng Nerissa + ấn hoa sen xoay dưới chân (khi Thủy Thần Vũ) */
export function makeGoddessAura() {
    const g = new THREE.Group();
    const H = 3.6;
    const aura = waterSprite('goddess', H, { opacity: 0 });
    aura.position.set(0, H * 0.5 - 0.15, -0.5);
    const T = tex('lotus');
    const lotus = waterSprite('lotus', 3.2 / T.aspect, { opacity: 0 });
    lotus.rotation.x = -Math.PI / 2;
    lotus.position.y = 0.05;
    g.add(lotus, aura);
    let t = 0;
    return {
        group: g,
        update(dt, k) {
            t += dt;
            aura.material.opacity = 0.28 * k * (0.85 + 0.15 * Math.sin(t * 3));
            aura.scale.set(1 + 0.03 * Math.sin(t * 2.2), 1 + 0.04 * Math.sin(t * 2.7), 1);
            lotus.material.opacity = 0.6 * k;
            lotus.rotation.z += dt * 0.5;
        },
        dispose() { g.parent?.remove(g); },
    };
}
/** Nốt nhạc bay vòng quanh Nerissa khi cả 3 điệu múa cùng chạy */
export function makeNoteHalo() {
    const g = new THREE.Group();
    const notes = [0, 1, 2, 0].map((k, i) => { const m = waterSprite('note' + k, 0.5, { opacity: 0 }); g.add(m); return m; });
    let t = 0;
    return {
        group: g,
        update(dt, k) {
            t += dt;
            notes.forEach((n, i) => {
                const a = t * 1.8 + (i / notes.length) * Math.PI * 2;
                n.position.set(Math.cos(a) * 1.2, 1.6 + Math.sin(a * 2) * 0.5, Math.sin(a) * 0.6 + 0.3);
                n.material.opacity = k * (0.6 + 0.4 * (Math.sin(a) * 0.5 + 0.5));
            });
        },
        dispose() { g.parent?.remove(g); },
    };
}
