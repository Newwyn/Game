// ============================================================
// VFX — số sát thương, vệt chém, phi tiêu, vụ nổ, dấu Ấn Chiếu
// ============================================================
// Mọi hiệu ứng được cập nhật trong updateVfx(dt) mỗi frame — không dùng setInterval.
import * as THREE from 'three';
import seraFxUrl from '../assets/sprites/sera_fx.png';
import seraFxMeta from './seraFx.json';
import { scene } from '../core/scene.js';
import { drawLionHead } from './lionSpirit.js';
import { drawGuardian } from './guardianSpirit.js';
import { drawWindSpirit } from './windSpirit.js';

let damageNumbers = [];
let effects = [];
let seals = [];

/** Gỡ object khỏi scene và giải phóng bộ nhớ GPU (texture canvas, geometry, material) */
function disposeObject(obj) {
    obj.removeFromParent();
    obj.traverse(o => {
        o.geometry?.dispose?.();
        if (o.material) {
            if (!o.userData.sharedTexture) o.material.map?.dispose?.();
            o.material.dispose?.();
        }
    });
}

function canvasSprite(width, height, draw, materialOpts = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    draw(canvas.getContext('2d'));
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, ...materialOpts }));
}

// ------------------------------------------------------------
// Số sát thương
// ------------------------------------------------------------
const DMG_STYLE = {
    heal:   { color: '#22c55e', text: v => `+${v}` },
    crit:   { color: '#fb923c', text: v => `-${v}` },
    block:  { color: '#94a3b8', text: v => (v > 0 ? `BLOCK -${v}` : 'BLOCK') },
    absorb: { color: '#fcd34d', text: v => `◆ ${v}` },   // sát thương bị khiên (Dựng Khiên) hứng
    shield: { color: '#fef08a', text: v => `◇ +${v}` },  // nhận khiên ánh sáng (Tu Sĩ)
    miss:   { color: '#f8fafc', text: () => 'MISS' },
    normal: { color: '#ef4444', text: v => `-${v}` },
    magic:  { color: '#60a5fa', text: v => `-${v}` },   // sát thương PHÉP (xanh dương); vật lý = đỏ
    hpcost: { color: '#f97316', text: v => `♥ -${v}` }, // tự trừ máu để dùng chiêu (Brakk)
};

export function spawnDamageNumber(pos, value, type = 'normal') {
    const style = DMG_STYLE[type] ?? DMG_STYLE.normal;
    const isCrit = type === 'crit';
    const sprite = canvasSprite(128, 64, ctx => {
        ctx.font = isCrit ? '900 42px Outfit' : '900 28px Outfit';
        ctx.textAlign = 'center';
        ctx.fillStyle = style.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = isCrit ? 6 : 4;
        const text = style.text(value);
        ctx.strokeText(text, 64, 44);
        ctx.fillText(text, 64, 44);
    });

    if (isCrit) sprite.scale.set(3.0, 1.5, 1);
    else if (type === 'miss' || type === 'block' || type === 'absorb' || type === 'shield' || type === 'hpcost') sprite.scale.set(2.0, 1.0, 1);
    else sprite.scale.set(1.8, 0.9, 1);

    sprite.position.set(pos.x + (Math.random() - 0.5) * 0.5, pos.y + 3, pos.z + 0.5);
    scene.add(sprite);
    damageNumbers.push({ sprite, life: 1.2, vy: isCrit ? 0.06 : 0.04 });
}

// ------------------------------------------------------------
// Bộ khung chung: hiệu ứng có hàm cập nhật riêng theo tiến độ 0..1
// ------------------------------------------------------------
/** Thêm hiệu ứng `mesh` sống `life` giây; tick(p, fx, dt) với p = 0..1 */
function addAnim(mesh, life, tick, parent = scene) {
    parent.add(mesh);
    const fx = { mesh, type: 'anim', age: 0, life, tick };
    tick(0, fx, 0);
    effects.push(fx);
    return fx;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const CHEST_Y = 0.75; // ngực nhân vật (mặt đất ở y = -0.5)

function canvasTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function fxPlane(texture, w, h, { additive = true, color = 0xffffff, opacity = 1 } = {}) {
    const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
            map: texture, transparent: true, depthWrite: false, opacity, color, fog: false,
            blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide,
        }),
    );
    m.userData.sharedTexture = true;
    return m;
}

// ---------- Texture dùng chung ----------
const TEX = {};
/** Vệt chém hình lưỡi liềm: lõi trắng, viền màu, đuôi thon */
function slashTexture(key, core, edge) {
    return TEX[key] ??= canvasTexture(256, 256, (ctx) => {
        ctx.translate(128, 128);
        for (let pass = 0; pass < 2; pass++) {
            ctx.save();
            ctx.shadowColor = edge; ctx.shadowBlur = pass ? 0 : 22;
            ctx.beginPath();
            // cung ngoài từ -150° tới 40°, cung trong lệch tâm -> mảnh ở hai đầu, dày ở giữa
            ctx.arc(0, 0, 112, -2.2, 0.15);
            ctx.arc(-24, 18, 104, 0.05, -2.05, true);
            ctx.closePath();
            const g = ctx.createLinearGradient(-110, -60, 110, 60);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.45, pass ? core : edge);
            g.addColorStop(1, pass ? core : edge);
            ctx.fillStyle = g;
            if (pass) { ctx.scale(0.98, 0.94); }
            ctx.fill();
            ctx.restore();
        }
    });
}
function glowTexture() {
    return TEX.glow ??= canvasTexture(128, 128, (ctx) => {
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.25, 'rgba(255,240,200,0.8)');
        g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    });
}
function sparkTexture() {
    return TEX.spark ??= canvasTexture(32, 128, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 128);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.7, 'rgba(255,240,190,0.9)');
        g.addColorStop(1, 'rgba(255,255,255,1)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(22, 110); ctx.lineTo(16, 128); ctx.lineTo(10, 110); ctx.closePath(); ctx.fill();
    });
}
function ringTexture() {
    return TEX.ring ??= canvasTexture(128, 128, (ctx) => {
        ctx.strokeStyle = 'rgba(255,255,255,1)'; ctx.lineWidth = 6;
        ctx.shadowColor = 'white'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(64, 64, 52, 0, Math.PI * 2); ctx.stroke();
    });
}

const SLASH_STYLE = {
    normal:   { core: 'rgba(255,255,255,1)', edge: 'rgba(255,196,90,1)', color: 0xffffff },
    crit:     { core: 'rgba(255,255,240,1)', edge: 'rgba(255,120,40,1)', color: 0xffffff },
    backstab: { core: 'rgba(255,240,255,1)', edge: 'rgba(170,60,255,1)', color: 0xffffff },
    blade:    { core: 'rgba(240,250,255,1)', edge: 'rgba(80,200,255,1)', color: 0xffffff },
    // Sát Thủ: sấm sét tối — lõi tím nhạt, viền tím đậm, có lớp bóng đen phía sau
    void:     { core: 'rgba(221,190,255,1)', edge: 'rgba(124,58,237,1)', color: 0xffffff, dark: true, bolt: true },
    voidCrit: { core: 'rgba(255,240,255,1)', edge: 'rgba(168,85,247,1)', color: 0xffffff, dark: true, bolt: true },
};

// ---------- Sấm sét ----------
const BOLT_VARIANTS = 8;
/** Tia sét ngang (từ trái sang phải) vẽ lên canvas: đường gấp khúc + nhánh phụ, lõi trắng, quầng tím */
function boltTexture(i) {
    return TEX['bolt' + i] ??= canvasTexture(512, 96, (ctx, w, h) => {
        const pts = [[0, h / 2]];
        const n = 12;
        for (let k = 1; k < n; k++) pts.push([(k / n) * w, h / 2 + (Math.random() - 0.5) * h * 0.7]);
        pts.push([w, h / 2]);
        const stroke = (lw, color, blur) => {
            ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = blur;
            ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            ctx.beginPath(); pts.forEach(([x, y], k) => ctx[k ? 'lineTo' : 'moveTo'](x, y)); ctx.stroke();
            // nhánh phụ
            for (let b = 0; b < 3; b++) {
                const k = 2 + Math.floor(Math.random() * (n - 4));
                let [x, y] = pts[k];
                ctx.beginPath(); ctx.moveTo(x, y);
                for (let j = 0; j < 3; j++) { x += 20 + Math.random() * 25; y += (Math.random() - 0.5) * 40; ctx.lineTo(x, y); }
                ctx.lineWidth = lw * 0.5; ctx.stroke();
            }
            ctx.restore();
        };
        stroke(14, 'rgba(91,33,182,0.55)', 24);
        stroke(6, 'rgba(192,132,252,0.95)', 12);
        stroke(2.2, 'rgba(255,255,255,1)', 4);
    });
}

/** Vòng sét quanh chân: đường tròn gấp khúc, lõi trắng, quầng tím */
function boltRingTexture() {
    return TEX.boltRing ??= canvasTexture(256, 256, (ctx) => {
        ctx.translate(128, 128);
        const ring = (r, jag, lw, color, blur) => {
            ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = blur;
            ctx.beginPath();
            for (let i = 0; i <= 48; i++) {
                const a = (i / 48) * Math.PI * 2, rr = r + (Math.random() - 0.5) * jag;
                ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
            }
            ctx.stroke(); ctx.restore();
        };
        ring(100, 22, 10, 'rgba(91,33,182,0.6)', 20);
        ring(100, 22, 4, 'rgba(192,132,252,1)', 10);
        ring(100, 18, 1.6, 'rgba(255,255,255,1)', 3);
        ring(78, 16, 3, 'rgba(167,139,250,0.9)', 8);
    });
}

/**
 * Hào quang sấm tím quanh người (Sát Thủ khi tàng hình):
 * quầng tối + quầng tím rực + lõi sáng sau lưng, vòng sét xoay dưới chân, vầng sáng tím trên mặt đất.
 * Cập nhật bằng updateThunderAura(group, t, strength).
 */
export function makeThunderAura(height = 2.9) {
    const g = new THREE.Group();
    const dark = fxPlane(glowTexture(), 3.0, height * 1.25, { additive: false, color: 0x14052a, opacity: 0.5 });
    dark.position.set(0, height * 0.45, -0.16);
    const glow = fxPlane(glowTexture(), 2.8, height * 1.3, { color: 0x7c3aed, opacity: 0.6 });
    glow.position.set(0, height * 0.48, -0.14);
    const core = fxPlane(glowTexture(), 1.5, height * 0.95, { color: 0xc4b5fd, opacity: 0.5 });
    core.position.set(0, height * 0.45, -0.12);
    // dưới chân: vầng sáng tím + 2 vòng sét xoay ngược chiều (nằm trên mặt đất)
    const floorGlow = fxPlane(glowTexture(), 3.2, 3.2, { color: 0x6d28d9, opacity: 0.6 });
    const ringA = fxPlane(boltRingTexture(), 2.4, 2.4, { color: 0xffffff });
    const ringB = fxPlane(boltRingTexture(), 1.7, 1.7, { color: 0xd8b4fe });
    for (const m of [floorGlow, ringA, ringB]) { m.rotation.x = -Math.PI / 2; m.position.y = 0.03; }
    g.add(dark, glow, core, floorGlow, ringA, ringB);
    g.userData = { dark, glow, core, floorGlow, ringA, ringB, surge: 0 };
    return g;
}
/** Nhịp "bùng" của hào quang (gọi khi có tia sét lớn) */
export function surgeThunderAura(g) { g.userData.surge = 1; }
export function updateThunderAura(g, t, strength, dt = 0.016) {
    const u = g.userData;
    u.surge = Math.max(0, u.surge - dt * 4);
    const pulse = 0.8 + 0.2 * Math.sin(t * 9) + 0.12 * Math.sin(t * 23) + 0.6 * u.surge;
    u.dark.material.opacity = 0.5 * strength;
    u.glow.material.opacity = Math.min(1, 0.85 * strength * pulse);
    u.core.material.opacity = Math.min(1, 0.45 * strength * pulse);
    const s = 1 + 0.06 * Math.sin(t * 13) + 0.18 * u.surge;
    u.glow.scale.set(s, 1 + 0.05 * Math.sin(t * 7) + 0.12 * u.surge, 1);
    u.floorGlow.material.opacity = 0.65 * strength * pulse;
    u.ringA.rotation.z += dt * 2.2;
    u.ringB.rotation.z -= dt * 3.1;
    const flick = Math.random() < 0.15 ? 0.35 : 1;
    u.ringA.material.opacity = strength * flick;
    u.ringB.material.opacity = 0.8 * strength * (Math.random() < 0.15 ? 0.3 : 1);
    u.ringA.scale.setScalar(1 + 0.25 * u.surge);
}

/** Lưỡi "lửa sét" tím bốc lên từ chân (rải liên tục quanh người khi có hào quang) */
export function spawnAuraFlame(pos, height = 2.9) {
    const x = pos.x + (Math.random() - 0.5) * 1.1, z = (pos.z ?? 0) + (Math.random() < 0.5 ? -0.15 : 0.55);
    const h = height * (0.35 + Math.random() * 0.35);
    const m = fxPlane(sparkTexture(), 0.22 + Math.random() * 0.15, h, { color: Math.random() < 0.3 ? 0xe9d5ff : 0x8b5cf6 });
    const y0 = -0.5 + h * 0.5, rise = 0.6 + Math.random() * 0.8, sway = (Math.random() - 0.5) * 0.4;
    m.rotation.z = Math.PI; // đầu nhọn hướng lên
    addAnim(m, 0.35 + Math.random() * 0.2, (p, fx) => {
        fx.mesh.position.set(x + sway * p, y0 + rise * p, z);
        fx.mesh.scale.set(1 - p * 0.5, 1 - p * 0.3, 1);
        fx.mesh.material.opacity = (p < 0.2 ? p * 5 : 1 - (p - 0.2) / 0.8) * 0.9;
    });
}

/** Mắt phát sáng sấm tím: chấm sáng + vệt sáng kéo dài ra sau đuôi mắt (gắn vào khớp mắt) */
export function makeEyeGlow(size = 0.42) {
    const g = new THREE.Group();
    const dot = fxPlane(glowTexture(), size, size, { color: 0xd8b4fe });
    const trail = fxPlane(sparkTexture(), size * 0.3, size * 3.6, { color: 0xc084fc });
    trail.rotation.z = -Math.PI / 2;         // nằm ngang, kéo ra phía sau đầu
    trail.position.set(-size * 1.7, size * 0.05, 0);
    g.add(trail, dot);
    g.userData = { dot, trail };
    return g;
}
export function updateEyeGlow(g, t, strength) {
    const { dot, trail } = g.userData;
    const flick = Math.random() < 0.08 ? 0.3 : 1;
    dot.material.opacity = strength * flick;
    trail.material.opacity = strength * (0.6 + 0.4 * Math.sin(t * 30)) * flick;
    trail.scale.y = 0.8 + 0.4 * Math.random();
}

/** Tia sét nối hai điểm, nhấp nháy rồi tắt */
export function spawnLightning(from, to, { width = 0.55, life = 0.2 } = {}) {
    const dx = to.x - from.x, dy = (to.y ?? 0) - (from.y ?? 0);
    const len = Math.max(0.2, Math.hypot(dx, dy));
    const m = fxPlane(boltTexture(Math.floor(Math.random() * BOLT_VARIANTS)), len, width);
    m.position.set((from.x + to.x) / 2, ((from.y ?? 0) + (to.y ?? 0)) / 2, ((from.z ?? 0) + (to.z ?? 0)) / 2 + 0.5);
    m.rotation.z = Math.atan2(dy, dx);
    addAnim(m, life, (p, fx) => {
        // nhấp nháy kiểu sét: sáng - tắt - sáng rồi tàn
        const flick = p < 0.15 ? 1 : p < 0.3 ? 0.35 : p < 0.45 ? 1 : 1 - (p - 0.45) / 0.55;
        fx.mesh.material.opacity = flick;
        fx.mesh.scale.y = 1 + 0.3 * Math.sin(p * 40);
    });
    return m;
}

/** Chùm sét ngắn toả ra từ điểm trúng + chớp tối */
export function spawnLightningBurst(pos, { count = 4, size = 1 } = {}) {
    const c = { x: pos.x, y: (pos.y ?? 0) + CHEST_Y, z: pos.z ?? 0 };
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, r = (0.7 + Math.random() * 0.6) * size;
        spawnLightning(c, { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, z: c.z }, { width: 0.32 * size, life: 0.16 + Math.random() * 0.08 });
    }
    const dark = fxPlane(glowTexture(), 1.5 * size, 1.5 * size, { additive: false, color: 0x2e1065, opacity: 0.55 });
    dark.position.set(c.x, c.y, c.z + 0.38);
    addAnim(dark, 0.22, (p, fx) => { const s = 0.6 + p * 0.8; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.55 * (1 - p); });
}

// ---------- Chiến Binh ----------
/** Sóng xung kích tròn lan trên mặt đất (Khiêu Khích: đỏ, Thành Trì: vàng) */
export function spawnShockwave(pos, { color = 0xff4d4d, radius = 9, life = 0.55 } = {}) {
    const ring = fxPlane(ringTexture(), 1, 1, { color });
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, -0.45, pos.z ?? 0);
    addAnim(ring, life, (p, fx) => { const s = 0.5 + easeOut(p) * radius * 2; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 1 - p; });
    const ring2 = fxPlane(ringTexture(), 1, 1, { color });
    ring2.position.set(pos.x, 1.0, (pos.z ?? 0) + 0.3);
    addAnim(ring2, life * 0.7, (p, fx) => { const s = 0.6 + easeOut(p) * 4; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.9 * (1 - p); });
}

/** Vệt sóng âm hình cung ")" (tiếng gầm) */
function roarArcTexture() {
    return TEX.roarArc ??= canvasTexture(128, 256, (ctx) => {
        ctx.strokeStyle = 'rgba(255,236,180,1)'; ctx.shadowColor = 'rgba(255,170,40,1)'; ctx.shadowBlur = 14;
        ctx.lineCap = 'round'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(-60, 128, 150, -0.75, 0.75); ctx.stroke();
        ctx.lineWidth = 4; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(-80, 128, 150, -0.7, 0.7); ctx.stroke();
    });
}
export function getLionTexture() { return TEX.lion ??= canvasTexture(512, 512, (ctx) => drawLionHead(ctx, 512)); }

/**
 * SƯ TỬ GẦM (Kỹ năng 1 của Rok): linh hồn sư tử vàng hiện ra trước ngực, há miệng gầm và lao về phía trước,
 * kèm các vòng sóng âm ")" toả ra + sóng vàng cam lan trên đất.
 * @param {{x,z}} pos chân Rok   @param {1|-1} dir hướng Rok nhìn
 */
export function spawnLionRoar(pos, dir = 1, { radius = 9 } = {}) {
    const z = (pos.z ?? 0) + 0.7;
    const x0 = pos.x + dir * 0.9, y0 = 1.25;
    // quầng sáng sau đầu sư tử
    const glow = fxPlane(glowTexture(), 3.6, 3.6, { color: 0xff8a20, opacity: 0 });
    glow.position.set(x0, y0, z - 0.02);
    addAnim(glow, 1.05, (p, fx) => {
        const e = easeOut(Math.min(1, p / 0.2));
        fx.mesh.position.x = x0 + dir * 2.4 * easeOut(p);
        fx.mesh.scale.setScalar(0.4 + e * 0.9 + p * 0.6);
        fx.mesh.material.opacity = 0.55 * e * (p > 0.5 ? (1 - p) / 0.5 : 1);
    });
    // đầu sư tử (2 lớp: lớp thường để thấy rõ nét mặt + lớp cộng sáng cho cảm giác linh hồn)
    const mk = (additive, op) => {
        const m = fxPlane(getLionTexture(), 2.3, 2.3, { additive, opacity: 0 });
        m.position.set(x0, y0, z + (additive ? 0.02 : 0));
        addAnim(m, 1.05, (p, fx) => {
            const pop = p < 0.16 ? easeOut(p / 0.16) : 1;
            const s = 0.35 + pop * 0.85 + p * 0.55;
            const shake = p < 0.6 ? Math.sin(p * 90) * 0.04 * (1 - p) : 0; // rung khi gầm
            fx.mesh.scale.set(s * (1 + shake), s * (1 - shake), 1);
            fx.mesh.position.x = x0 + dir * 2.4 * easeOut(p);
            fx.mesh.position.y = y0 + 0.15 * pop;
            fx.mesh.material.opacity = op * pop * (p > 0.5 ? Math.max(0, (1 - p) / 0.5) : 1);
        });
    };
    mk(false, 0.9);
    mk(true, 0.22);
    // sóng âm ")" toả ra từ miệng sư tử
    for (let i = 0; i < 4; i++) {
        const arc = fxPlane(roarArcTexture(), 0.9, 1.8, { color: 0xffd38a, opacity: 0 });
        arc.scale.x = dir;
        const delay = 0.12 + i * 0.09;
        addAnim(arc, 0.6 + delay, (p, fx) => {
            const t = Math.max(0, (p * (0.6 + delay) - delay) / 0.6);
            fx.mesh.position.set(x0 + dir * (0.6 + 3.2 * easeOut(t)), y0 - 0.1, z + 0.05);
            const s = 0.6 + 1.6 * easeOut(t);
            fx.mesh.scale.set(s * dir, s, 1);
            fx.mesh.material.opacity = t <= 0 ? 0 : 0.9 * (1 - t);
        });
    }
    spawnShockwave(pos, { color: 0xffa230, radius, life: 0.7 });
}

/** Hình khiên ánh sáng (bầu dục, viền vàng, chữ thập) — dùng cho Đẩy Khiên */
function shieldBurstTexture() {
    return TEX.shieldBurst ??= canvasTexture(192, 256, (ctx) => {
        ctx.translate(96, 128);
        const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 110);
        g.addColorStop(0, 'rgba(255,250,220,0.55)'); g.addColorStop(0.7, 'rgba(255,215,120,0.35)'); g.addColorStop(1, 'rgba(255,170,40,0.9)');
        ctx.save(); ctx.scale(1, 1.3);
        ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(255,240,180,1)'; ctx.shadowColor = 'rgba(255,170,40,1)'; ctx.shadowBlur = 18; ctx.stroke();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,235,0.95)'; ctx.shadowColor = 'rgba(255,190,60,1)'; ctx.shadowBlur = 12;
        ctx.fillRect(-7, -64, 14, 128); ctx.fillRect(-40, -12, 80, 14);
    });
}

/**
 * ĐẨY KHIÊN (Kỹ năng 2): khiên ánh sáng to bật ra phía trước cùng luồng gió, đập trúng mục tiêu.
 * @param {{x,z}} from chân Rok   @param {1|-1} dir
 */
export function spawnShieldPush(from, dir = 1) {
    const z = (from.z ?? 0) + 0.6;
    const x0 = from.x + dir * 0.9;
    for (const [k, delay] of [[1, 0], [0.75, 0.05]]) {
        const m = fxPlane(shieldBurstTexture(), 2.1 * k, 2.8 * k, { color: 0xffe2a0, opacity: 0 });
        m.rotation.y = -dir * 0.5; // nghiêng như mặt khiên quay ra trước
        addAnim(m, 0.42 + delay, (p, fx) => {
            const t = Math.max(0, (p * (0.42 + delay) - delay) / 0.42);
            fx.mesh.position.set(x0 + dir * 1.6 * easeOut(t), 0.95, z);
            const s = 0.7 + 0.6 * easeOut(t);
            fx.mesh.scale.set(s, s, 1);
            fx.mesh.material.opacity = t <= 0 ? 0 : (t < 0.15 ? t / 0.15 : (1 - t) / 0.85);
        });
    }
    // luồng gió (vệt ngang) phía sau khiên
    for (let i = 0; i < 6; i++) {
        const y = 0.2 + Math.random() * 1.4;
        const len = 1.2 + Math.random() * 1.2;
        const l = fxPlane(sparkTexture(), 0.07, len, { color: 0xfff0c8, opacity: 0 });
        l.rotation.z = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        const d0 = Math.random() * 0.1;
        addAnim(l, 0.3 + d0, (p, fx) => {
            const t = Math.max(0, (p * (0.3 + d0) - d0) / 0.3);
            fx.mesh.position.set(from.x + dir * (0.4 + 2.2 * easeOut(t)), y, z + 0.05);
            fx.mesh.material.opacity = t <= 0 ? 0 : 0.9 * (1 - t);
        });
    }
}

/** Khiên nhỏ phát sáng (bay quanh đồng đội khi Rok Dựng Khiên) */
export function getMiniShieldTexture() {
    return TEX.miniShield ??= canvasTexture(128, 160, (ctx) => {
        ctx.translate(64, 80);
        ctx.shadowColor = 'rgba(255,190,60,1)'; ctx.shadowBlur = 16;
        ctx.save(); ctx.scale(1, 1.25);
        let g = ctx.createRadialGradient(-10, -12, 4, 0, 0, 50);
        g.addColorStop(0, '#9fc3ff'); g.addColorStop(1, '#2f4f8f');
        ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 9; ctx.strokeStyle = '#ffd56a'; ctx.stroke();
        ctx.restore();
        ctx.shadowBlur = 6; ctx.fillStyle = '#ffe9a8';
        ctx.fillRect(-5, -40, 10, 80); ctx.fillRect(-28, -9, 56, 10);
        ctx.beginPath(); ctx.arc(0, -4, 10, 0, Math.PI * 2); ctx.fill();
    });
}
/** Dải gió hình lưỡi liềm mảnh (vệt gió bay vòng quanh đồng đội được Gió dẫn đường) */
export function getWindRibbonTexture() {
    return TEX.windRibbon ??= canvasTexture(256, 96, (ctx, w, h) => {
        ctx.translate(w / 2, h * 0.95);
        for (let pass = 0; pass < 3; pass++) {
            ctx.save();
            ctx.shadowColor = 'rgba(94,234,212,1)'; ctx.shadowBlur = pass === 0 ? 14 : 4;
            ctx.beginPath();
            const R = 118 - pass * 10, r = R - (pass === 0 ? 20 : 12 - pass * 3);
            ctx.arc(0, 40, R, Math.PI * 1.12, Math.PI * 1.88);
            ctx.arc(14, 46, r, Math.PI * 1.83, Math.PI * 1.17, true);
            ctx.closePath();
            const g = ctx.createLinearGradient(-R, 0, R, 0);
            const col = ['rgba(94,234,212,', 'rgba(204,251,241,', 'rgba(255,255,255,'][pass];
            g.addColorStop(0, col + '0)'); g.addColorStop(0.6, col + (pass === 2 ? '0.9)' : '0.7)')); g.addColorStop(1, col + '0.1)');
            ctx.fillStyle = g; ctx.fill();
            ctx.restore();
        }
    });
}
/** Tia sét nhỏ zig-zag tím trắng (đồng đội được Tàng Hình của Jessica phù trợ). 3 dạng để nháy luân phiên */
export function getBoltTexture(variant = 0) {
    return TEX['bolt' + variant] ??= canvasTexture(64, 160, (ctx, w, h) => {
        let seed = 7 + variant * 13;
        const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
        const pts = [[w / 2, 6]];
        for (let i = 1; i <= 6; i++) pts.push([w / 2 + (rnd() - 0.5) * 34, 6 + i * (h - 12) / 6]);
        const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(176,124,255,1)'; ctx.shadowBlur = 14;
        path(); ctx.strokeStyle = 'rgba(176,124,255,0.9)'; ctx.lineWidth = 9; ctx.stroke();
        ctx.shadowBlur = 4;
        path(); ctx.strokeStyle = '#f5edff'; ctx.lineWidth = 3; ctx.stroke();
        // nhánh phụ
        const [bx, by] = pts[3];
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + (variant % 2 ? 16 : -16), by + 22); ctx.lineTo(bx + (variant % 2 ? 10 : -12), by + 38);
        ctx.strokeStyle = 'rgba(220,200,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
    });
}
/** Lưới lục giác vàng cho vòm Aura Thiết Vệ */
export function getHexDomeTexture() {
    if (TEX.hexDome) return TEX.hexDome;
    const t = canvasTexture(512, 256, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(255,210,100,0.05)'); g.addColorStop(0.75, 'rgba(255,200,90,0.25)'); g.addColorStop(1, 'rgba(255,220,130,0.85)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(255,240,190,0.75)'; ctx.lineWidth = 2;
        const r = 22;
        for (let y = -r; y < h + r; y += r * 1.5) for (let x = -r; x < w + r; x += r * 1.732) {
            const ox = (Math.round((y + r) / (r * 1.5)) % 2) * r * 0.866;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](x + ox + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); }
            ctx.closePath(); ctx.stroke();
        }
    });
    t.wrapS = THREE.RepeatWrapping;
    return (TEX.hexDome = t);
}

export function getGuardianTexture() { return TEX.guardian ??= canvasTexture(512, 768, (ctx) => drawGuardian(ctx, 512, 768)); }

/** Mảnh lục giác vàng (vụn khiên) */
function hexShardTexture() {
    return TEX.hexShard ??= canvasTexture(64, 64, (ctx) => {
        ctx.translate(32, 32);
        ctx.shadowColor = 'rgba(255,190,60,1)'; ctx.shadowBlur = 10;
        const g = ctx.createRadialGradient(-6, -6, 2, 0, 0, 26);
        g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(1, 'rgba(255,200,80,0.85)');
        ctx.fillStyle = g; ctx.strokeStyle = 'rgba(255,245,200,1)'; ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 22, Math.sin(a) * 22); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
    });
}
function spawnHexShards(c, { count = 12, speed = 3, life = 0.6, size = 0.32 } = {}) {
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const v = speed * (0.6 + Math.random() * 0.6);
        const m = fxPlane(hexShardTexture(), size, size, { opacity: 1 });
        const spin = (Math.random() - 0.5) * 12;
        addAnim(m, life, (p, fx) => {
            const e = easeOut(p);
            fx.mesh.position.set(c.x + Math.cos(a) * v * e, c.y + Math.sin(a) * v * e * 0.8 - p * p * 0.8, c.z + 0.1);
            fx.mesh.rotation.z = spin * p;
            const sc = 1 - p * 0.5; fx.mesh.scale.set(sc, sc, 1);
            fx.mesh.material.opacity = 1 - p;
        });
    }
}

/**
 * KHIÊN PHÁT NỔ (Dựng Khiên mất mỗi 100 máu khiên): chớp vàng lớn, khiên ánh sáng bung ra,
 * cột sáng, vụn lục giác bắn tung + sóng vàng lan trên đất tới bán kính nổ.
 */
export function spawnGuardBurst(pos, { radius = 4.5 } = {}) {
    const c = { x: pos.x, y: (pos.y ?? 0) + 1.0, z: (pos.z ?? 0) + 0.7 };
    // chớp + khiên ánh sáng bung ra đặt SAU lưng Rok (người vẫn rõ), vụn khiên bay phía trước
    const back = (pos.z ?? 0) - 0.4;
    const flash = fxPlane(glowTexture(), 1, 1, { color: 0xffb63a });
    flash.position.set(c.x, c.y, back);
    addAnim(flash, 0.3, (p, fx) => { const s = 1 + easeOut(p) * 3.4; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.6 * (1 - p); });
    const sh = fxPlane(shieldBurstTexture(), 1.6, 2.1, { color: 0xfff0c0 });
    sh.position.set(c.x, c.y + 0.2, back + 0.02);
    addAnim(sh, 0.45, (p, fx) => { const s = 1.0 + easeOut(p) * 1.8; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = (1 - p) * 0.8; });
    const pillar = fxPlane(sparkTexture(), 0.9, 6, { color: 0xfff1c2 });
    pillar.position.set(c.x, 2.4, c.z - 0.05);
    addAnim(pillar, 0.5, (p, fx) => { fx.mesh.scale.set(1 + p * 1.5, 0.6 + easeOut(p) * 0.6, 1); fx.mesh.material.opacity = 0.35 * (1 - p); });
    spawnHexShards(c, { count: 14, speed: radius * 0.75 });
    spawnShockwave(pos, { color: 0xffc94a, radius, life: 0.5 });
    spawnRisingSparkles(pos, { count: 6, color: 0xffd36b, radius: 1.8 });
}

/** KHIÊN VỠ (hết máu khiên): vụn lục giác văng mạnh + chớp trắng */
export function spawnShieldShatter(pos) {
    const c = { x: pos.x, y: (pos.y ?? 0) + 1.2, z: (pos.z ?? 0) + 0.7 };
    spawnHexShards(c, { count: 22, speed: 3.6, life: 0.85, size: 0.4 });
    const flash = fxPlane(glowTexture(), 1, 1, { color: 0xffc04a });
    flash.position.set(c.x, c.y, (pos.z ?? 0) - 0.4); // sau lưng Rok
    addAnim(flash, 0.3, (p, fx) => { const s = 1 + easeOut(p) * 3; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.6 * (1 - p); });
}

/** Trúng sóng gầm: chớp cam + vòng âm nhỏ trên người quái */
export function spawnRoarHit(pos) {
    const c = { x: pos.x, y: (pos.y ?? 0) + CHEST_Y, z: (pos.z ?? 0) + 0.5 };
    const ring = fxPlane(ringTexture(), 1, 1, { color: 0xffa94d });
    ring.position.set(c.x, c.y, c.z);
    addAnim(ring, 0.35, (p, fx) => { const s = 0.6 + easeOut(p) * 2.2; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 1 - p; });
    spawnHitSpark(pos, { count: 8, color: 0xffc46b, size: 1.1 });
}

// ---------- Xạ Thủ (Lyra) ----------
/** Cây cung tạm (vẽ bằng code) cầm trên tay — dùng cho Lyra cho tới khi có tranh riêng */
export function makeBowMesh(height = 1.3) {
    const tex = TEX.bow ??= canvasTexture(128, 384, (ctx) => {
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(40, 14); ctx.lineTo(40, 370); ctx.stroke();               // dây cung
        const g = ctx.createLinearGradient(0, 0, 0, 384);
        g.addColorStop(0, '#5eead4'); g.addColorStop(0.5, '#0f766e'); g.addColorStop(1, '#5eead4');
        ctx.strokeStyle = g; ctx.lineWidth = 12;
        ctx.beginPath(); ctx.moveTo(40, 14); ctx.quadraticCurveTo(150, 192, 40, 370); ctx.stroke(); // thân cung
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(92, 170); ctx.lineTo(92, 214); ctx.stroke();               // chuôi
        ctx.fillStyle = '#ccfbf1';
        for (const y of [20, 364]) { ctx.beginPath(); ctx.ellipse(44, y, 8, 16, 0, 0, Math.PI * 2); ctx.fill(); }
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(height / 3, height),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, fog: false }));
    m.userData.sharedTexture = true;
    return m;
}
export function getWindSpiritTexture(drawn = false) {
    const key = drawn ? 'windSpiritDrawn' : 'windSpirit';
    return TEX[key] ??= canvasTexture(512, 768, (ctx) => drawWindSpirit(ctx, 512, 768, drawn ? 1 : 0.15));
}
/** Mũi tên (nằm ngang, mũi hướng phải) */
function arrowTexture() {
    return TEX.arrow ??= canvasTexture(256, 48, (ctx) => {
        ctx.strokeStyle = '#7c5a32'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(34, 24); ctx.lineTo(214, 24); ctx.stroke();
        ctx.fillStyle = '#e8f6f4'; ctx.strokeStyle = '#5b7f7a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(250, 24); ctx.lineTo(206, 10); ctx.lineTo(214, 24); ctx.lineTo(206, 38); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#5eead4';
        for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(10, 24 + sy * 16); ctx.lineTo(56, 24); ctx.lineTo(30, 24 + sy * 2); ctx.closePath(); ctx.fill(); }
    });
}
/** Vệt gió dài (đuôi mũi tên) */
function windStreakTexture() {
    return TEX.windStreak ??= canvasTexture(256, 32, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 256, 0);
        g.addColorStop(0, 'rgba(94,234,212,0)'); g.addColorStop(0.75, 'rgba(160,255,235,0.8)'); g.addColorStop(1, 'rgba(255,255,255,1)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0, 16); ctx.quadraticCurveTo(128, 2, 256, 12); ctx.lineTo(256, 20); ctx.quadraticCurveTo(128, 30, 0, 16); ctx.fill();
    });
}
/**
 * Mũi tên bay từ `from` tới `to` (toạ độ thế giới, y = độ cao), kèm vệt gió; gọi onHit khi tới.
 * size: độ to; wind: có vệt gió + vòng gió; glow: màu quầng.
 */
export function spawnArrow(from, to, { duration = 0.22, size = 1, wind = true, color = 0x5eead4, onHit } = {}) {
    const ang = Math.atan2(to.y - from.y, to.x - from.x);
    const g = new THREE.Group();
    const arrow = fxPlane(arrowTexture(), 1.1 * size, 0.2 * size, { additive: false });
    g.add(arrow);
    if (wind) {
        const tail = fxPlane(windStreakTexture(), 2.2 * size, 0.32 * size, { color });
        tail.position.x = -1.1 * size;
        g.add(tail);
        const glow = fxPlane(glowTexture(), 0.9 * size, 0.6 * size, { color });
        glow.position.x = 0.4 * size;
        g.add(glow);
    }
    g.rotation.z = ang;
    const z = (from.z ?? 0) + 0.5;
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(from.x + (to.x - from.x) * p, from.y + (to.y - from.y) * p, z);
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}
/**
 * Mũi tên bay VÒNG CUNG (Thần Tiễn Phá Thiên): đường cong bậc 2 từ dây cung vồng lên `arc` đơn vị rồi cắm xuống mục tiêu,
 * thân tên luôn xoay theo hướng bay, kéo vệt gió phía sau.
 */
export function spawnArcArrow(from, to, { duration = 0.45, arc = 3, size = 1.4, color = 0x5eead4, onHit } = {}) {
    const g = new THREE.Group();
    const arrow = fxPlane(arrowTexture(), 1.1 * size, 0.2 * size, { additive: false });
    const tail = fxPlane(windStreakTexture(), 2.4 * size, 0.34 * size, { color });
    tail.position.x = -1.2 * size;
    const glow = fxPlane(glowTexture(), 0.9 * size, 0.6 * size, { color });
    glow.position.x = 0.4 * size;
    g.add(tail, glow, arrow);
    const z = (from.z ?? 0) + 0.5, z2 = (to.z ?? 0) + 0.5;
    // điểm kiểm soát: giữa đường, nhấc cao `arc`
    const cx = (from.x + to.x) / 2, cy = Math.max(from.y, to.y) + arc;
    const at = (t) => {
        const u = 1 - t;
        return { x: u * u * from.x + 2 * u * t * cx + t * t * to.x, y: u * u * from.y + 2 * u * t * cy + t * t * to.y };
    };
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        const t = p;   // tốc độ đều theo tham số
        const a = at(t), b = at(Math.min(1, t + 0.02)), c = t >= 0.98 ? at(t - 0.02) : null;
        const ang = c ? Math.atan2(a.y - c.y, a.x - c.x) : Math.atan2(b.y - a.y, b.x - a.x);
        fx.mesh.position.set(a.x, a.y, z + (z2 - z) * t);
        fx.mesh.rotation.z = ang;
        tail.material.opacity = Math.min(1, p * 4);
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}
/**
 * Mũi tên TÊN LỬA (Thần Tiễn Phá Thiên):
 *   1) hiện ra ở `slot` sau lưng (xếp hình vòng cung), mũi chĩa ra ngoài theo góc `ang`, lơ lửng `hold` giây
 *   2) phóng đi: vọt tiếp ra ngoài rồi bẻ lái đuổi theo mục tiêu (đường cong bậc 3, `getTo()` đọc vị trí mới nhất),
 *      thân tên xoay theo hướng bay, xả vệt gió + đốm khói như tên lửa; chạm thì gọi onHit.
 */
export function spawnMissileArrow(slot, ang, getTo, { hold = 0.3, flight = 0.55, size = 1.3, color = 0x5eead4, z = 0, onHit } = {}) {
    const g = new THREE.Group();
    const arrow = fxPlane(arrowTexture(), 1.1 * size, 0.2 * size, { additive: false });
    const tail = fxPlane(windStreakTexture(), 2.2 * size, 0.34 * size, { color });
    tail.position.x = -1.1 * size;
    const glow = fxPlane(glowTexture(), 1.0 * size, 0.7 * size, { color });
    glow.position.x = 0.35 * size;
    g.add(tail, glow, arrow);
    const zz = z + 0.5;
    const out = { x: Math.cos(ang), y: Math.sin(ang) };
    let from = null, p1, p2, to, hit = false, puffT = 0;
    const bez = (t) => {
        const u = 1 - t;
        return {
            x: u * u * u * from.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * to.x,
            y: u * u * u * from.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * to.y,
        };
    };
    const total = hold + flight;
    addAnim(g, total, (p, fx, dt = 0) => {
        const time = p * total;
        if (time < hold) {
            // hiện ra + lơ lửng, rung nhẹ như đang nạp
            const k = Math.min(1, time / 0.12);
            g.scale.set(k, k, 1);
            const bob = Math.sin(time * 30) * 0.03;
            fx.mesh.position.set(slot.x + out.x * bob, slot.y + out.y * bob, zz);
            fx.mesh.rotation.z = ang;
            tail.material.opacity = 0.25;
            glow.material.opacity = 0.6 + 0.4 * Math.sin(time * 40);
            return;
        }
        if (!from) {
            from = { x: slot.x, y: slot.y };
            to = getTo();
            // vọt ra ngoài theo hướng chĩa, rồi lao xuống / ngang vào mục tiêu từ phía trên
            p1 = { x: from.x + out.x * 3.2, y: from.y + out.y * 3.2 };
            p2 = { x: to.x - Math.sign(to.x - from.x || 1) * 2.5, y: to.y + 3.5 };
            tail.material.opacity = 1;
        }
        const live = getTo();                     // bám theo mục tiêu đang di chuyển
        to.x += (live.x - to.x) * 0.25; to.y += (live.y - to.y) * 0.25;
        const t = (time - hold) / flight;
        const e = t * t * (3 - 2 * t) * 0.35 + t * 0.65; // tăng tốc nhẹ
        const a = bez(e), b = bez(Math.min(1, e + 0.02)), c = bez(Math.max(0, e - 0.02));
        const dir = e >= 0.98 ? Math.atan2(a.y - c.y, a.x - c.x) : Math.atan2(b.y - a.y, b.x - a.x);
        fx.mesh.position.set(a.x, a.y, zz);
        fx.mesh.rotation.z = dir;
        // khói / gió phụt sau đuôi
        puffT += dt;
        if (puffT > 0.025) {
            puffT = 0;
            const puff = fxPlane(glowTexture(), 0.45 * size, 0.45 * size, { color });
            puff.position.set(a.x - Math.cos(dir) * 0.6 * size, a.y - Math.sin(dir) * 0.6 * size, zz - 0.01);
            addAnim(puff, 0.3, (q, f2) => { const sc = 1 + q * 1.4; f2.mesh.scale.set(sc, sc, 1); f2.mesh.material.opacity = 0.55 * (1 - q); });
        }
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}
/** Trúng tên gió: chớp + vòng gió xoáy */
export function spawnWindHit(pos, { size = 1, color = 0x5eead4 } = {}) {
    const c = { x: pos.x, y: (pos.y ?? 0) + CHEST_Y, z: (pos.z ?? 0) + 0.55 };
    const ring = fxPlane(ringTexture(), 1, 1, { color });
    ring.position.set(c.x, c.y, c.z);
    addAnim(ring, 0.28, (p, fx) => { const s = 0.4 + easeOut(p) * 1.8 * size; fx.mesh.scale.set(s, s * 0.6, 1); fx.mesh.material.opacity = 1 - p; });
    spawnHitSpark(pos, { count: 6, color: 0xb6fff0, size: 0.9 * size });
}
/** Mũi tên gió XUYÊN (nội tại Phong Tiễn): luồng gió dài quét ngang qua cả hàng quái */
export function spawnPierceWind(from, dir, length = 14, { color = 0x5eead4, scale = 1 } = {}) {
    const y = from.y, z = (from.z ?? 0) + 0.55;
    const beam = fxPlane(windStreakTexture(), 3.2 * scale, 0.7 * scale, { color });
    beam.scale.x = dir;
    const head = fxPlane(arrowTexture(), 1.3 * scale, 0.26 * scale, { additive: false });
    head.scale.x = dir;
    const g = new THREE.Group(); g.add(beam, head);
    beam.position.x = -1.6 * scale * dir; head.position.x = 0.2 * dir;
    addAnim(g, 0.32, (p, fx) => {
        fx.mesh.position.set(from.x + dir * length * p, y, z);
        beam.material.opacity = p > 0.8 ? (1 - p) * 5 : 1;
    });
}
/** Gồng Thần Tiễn: gió hút vào quanh người + quầng ngọc lớn dần (giữ `seconds`) */
export function spawnChargeWind(pos, seconds = 2, { y = 1.1 } = {}) {
    const c = { x: pos.x, y, z: (pos.z ?? 0) + 0.6 };
    const glow = fxPlane(glowTexture(), 1, 1, { color: 0x5eead4 });
    glow.position.set(c.x, c.y, c.z);
    addAnim(glow, seconds, (p, fx) => { const s = 0.6 + p * 2.4 + 0.15 * Math.sin(p * 40); fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.35 + 0.5 * p; });
    for (let i = 0; i < 18; i++) {
        const delay = Math.random() * (seconds - 0.4);
        const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 1.2;
        const st = fxPlane(windStreakTexture(), 1.0, 0.16, { color: 0xb6fff0, opacity: 0 });
        addAnim(st, delay + 0.4, (p, fx) => {
            const t = Math.max(0, (p * (delay + 0.4) - delay) / 0.4);
            const rr = r * (1 - easeOut(t));
            fx.mesh.position.set(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr * 0.8, c.z);
            fx.mesh.rotation.z = a + Math.PI;
            fx.mesh.material.opacity = t <= 0 ? 0 : 1 - t * 0.6;
        });
    }
}
/** Thần Tiễn nổ: cột sáng + vòng gió + vụn sáng */
export function spawnBigArrowBlast(pos, { radius = 3 } = {}) {
    const c = { x: pos.x, y: (pos.y ?? 0) + CHEST_Y, z: (pos.z ?? 0) + 0.6 };
    const flash = fxPlane(glowTexture(), 1, 1, { color: 0x99fff0 });
    flash.position.set(c.x, c.y, c.z);
    addAnim(flash, 0.4, (p, fx) => { const s = 1 + easeOut(p) * 4.5; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.9 * (1 - p); });
    const pillar = fxPlane(sparkTexture(), 1.2, 7, { color: 0xcffff6 });
    pillar.position.set(c.x, 2.6, c.z - 0.05);
    addAnim(pillar, 0.55, (p, fx) => { fx.mesh.scale.set(1 + p * 2, 0.5 + easeOut(p) * 0.7, 1); fx.mesh.material.opacity = 0.8 * (1 - p); });
    spawnShockwave(pos, { color: 0x5eead4, radius, life: 0.5 });
    spawnHitSpark(pos, { count: 14, color: 0xb6fff0, size: 1.6 });
}

/** Dấu "!" đỏ bật lên trên đầu quái bị khiêu khích */
export function spawnTauntMark(view) {
    const tex = TEX.taunt ??= canvasTexture(64, 128, (ctx) => {
        ctx.fillStyle = '#ff3b3b'; ctx.strokeStyle = '#3a0a0a'; ctx.lineWidth = 6;
        ctx.font = '900 104px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeText('!', 32, 66); ctx.fillText('!', 32, 66);
    });
    const m = fxPlane(tex, 0.45, 0.9, { additive: false });
    m.position.set(0, 3.0, 0.3);
    addAnim(m, 1.1, (p, fx) => {
        const pop = p < 0.15 ? easeOut(p / 0.15) * 1.3 : 1.3 - 0.3 * Math.min(1, (p - 0.15) * 4);
        fx.mesh.scale.set(pop, pop, 1);
        fx.mesh.position.y = 3.0 + 0.15 * Math.sin(p * 20) * (1 - p);
        fx.mesh.material.opacity = p > 0.75 ? (1 - p) * 4 : 1;
    }, view.root);
}

/** Va chạm mạnh (Đập Khiên): chớp trắng lớn + vòng sóng + tia lửa */
export function spawnImpact(pos, { size = 1.4, color = 0xfff1c2 } = {}) {
    spawnHitSpark(pos, { count: 12, color, size });
    const ring = fxPlane(ringTexture(), 1, 1, { color });
    ring.position.set(pos.x, (pos.y ?? 0) + CHEST_Y, (pos.z ?? 0) + 0.5);
    addAnim(ring, 0.3, (p, fx) => { const s = 0.5 + easeOut(p) * 3 * size; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 1 - p; });
}

/** Mesh cắt từ atlas nhân vật (VD khiên cắm đất), hiện tại chỗ rồi mờ dần */
export function spawnAtlasFx(mesh, pos, { life = 1.4, rise = 0 } = {}) {
    mesh.position.set(pos.x, pos.y ?? 0, (pos.z ?? 0) + 0.6);
    const y0 = mesh.position.y;
    addAnim(mesh, life, (p, fx) => {
        const s = p < 0.12 ? 0.6 + easeOut(p / 0.12) * 0.4 : 1;
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.position.y = y0 + rise * p;
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 1;
    });
}

/** Tia sáng nhỏ bắn ra từ điểm trúng + chớp sáng */
export function spawnHitSpark(pos, { count = 7, color = 0xffe7a8, size = 1 } = {}) {
    const at = new THREE.Vector3(pos.x, (pos.y ?? 0) + CHEST_Y, (pos.z ?? 0) + 0.4);
    const flash = fxPlane(glowTexture(), 1.1 * size, 1.1 * size, { color });
    flash.position.copy(at);
    addAnim(flash, 0.16, (p, fx) => { const s = 0.6 + p * 0.9; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 1 - p; });
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = fxPlane(sparkTexture(), 0.09 * size, 0.7 * size, { color });
        sp.rotation.z = a - Math.PI / 2;
        const dist = (0.6 + Math.random() * 0.5) * size;
        addAnim(sp, 0.22 + Math.random() * 0.1, (p, fx) => {
            const e = easeOut(p);
            fx.mesh.position.set(at.x + Math.cos(a) * dist * e, at.y + Math.sin(a) * dist * e, at.z);
            fx.mesh.scale.set(1, 1 - p * 0.7, 1);
            fx.mesh.material.opacity = 1 - p;
        });
    }
}

/**
 * Vệt chém lưỡi liềm quét qua mục tiêu.
 * @param {{x,y?,z?}} pos chân mục tiêu
 * @param {{dir?:1|-1, style?:string, size?:number, angle?:number}} opts dir: hướng người chém (1 = sang phải)
 */
export function spawnSlashVfx(pos, { dir = 1, style = 'normal', size = 1, angle } = {}) {
    const st = SLASH_STYLE[style] ?? SLASH_STYLE.normal;
    const tex = slashTexture('slash_' + style, st.core, st.edge);
    const m = fxPlane(tex, 1.9 * size, 1.9 * size, { color: st.color });
    const base = angle ?? (-0.5 + (Math.random() - 0.5) * 0.5); // mặc định: chém chéo từ trên xuống
    m.scale.x = dir;
    m.position.set(pos.x, (pos.y ?? 0) + CHEST_Y, (pos.z ?? 0) + 0.45);
    if (st.dark) {
        // bóng tối loang phía sau nhát chém (blend thường -> thực sự tối trên nền sáng)
        const d = fxPlane(tex, 2.15 * size, 2.15 * size, { additive: false, color: 0x1a0b2e, opacity: 0.7 });
        d.position.set(pos.x, (pos.y ?? 0) + CHEST_Y, (pos.z ?? 0) + 0.43);
        addAnim(d, 0.26, (p, fx) => {
            const e = easeOut(Math.min(1, p * 1.6));
            fx.mesh.rotation.z = (base + 0.6 * e - 0.3) * dir;
            const s = 0.8 + 0.35 * e;
            fx.mesh.scale.set(s * dir, s, 1);
            fx.mesh.material.opacity = 0.7 * (1 - p);
        });
    }
    if (st.bolt) spawnLightningBurst(pos, { count: 3, size: 0.9 * size });
    addAnim(m, 0.2, (p, fx) => {
        const e = easeOut(Math.min(1, p * 1.6));
        fx.mesh.rotation.z = (base + 0.6 * e - 0.3) * dir;
        const s = 0.75 + 0.35 * e;
        fx.mesh.scale.set(s * dir, s * (1 - p * 0.35), 1);
        fx.mesh.material.opacity = p < 0.35 ? 1 : 1 - (p - 0.35) / 0.65;
    });
    spawnHitSpark(pos, { size: 0.8 * size, color: st.bolt ? 0xc4a1ff : style === 'backstab' ? 0xe2b8ff : style === 'blade' ? 0xbfe9ff : 0xffe7a8 });
}

/** Chém chí mạng / đánh lén: hai nhát chéo chữ X + vòng sóng xung kích */
export function spawnBackstabVfx(pos, { dir = 1, style = 'backstab', size = 1.15 } = {}) {
    spawnSlashVfx(pos, { dir, style, size, angle: -0.9 });
    setTimeout(() => spawnSlashVfx(pos, { dir: -dir, style, size, angle: -0.9 }), 60);
    const ring = fxPlane(ringTexture(), 1, 1, { color: style === 'backstab' || style.startsWith('void') ? 0xa77bff : 0xffc070 });
    ring.position.set(pos.x, (pos.y ?? 0) + CHEST_Y, (pos.z ?? 0) + 0.5);
    addAnim(ring, 0.3, (p, fx) => { const s = 0.4 + easeOut(p) * 2.2; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 1 - p; });
}

// ------------------------------------------------------------
// Vệt lướt / vụ nổ / phi tiêu
// ------------------------------------------------------------
export function spawnShadowTrail(from, to) {
    const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(from.x, from.y + 1, from.z),
        new THREE.Vector3(to.x, from.y + 1, to.z),
    ]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 }));
    scene.add(line);
    effects.push({ mesh: line, life: 1.0, type: 'line' });
}

export function spawnAoeExplosion(x, z) {
    const circle = new THREE.Mesh(
        new THREE.CircleGeometry(3, 32),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(x, 0.1, z);
    scene.add(circle);
    effects.push({ mesh: circle, life: 1.0, type: 'expand' });
}

/**
 * Đạn bay THẲNG tới mục tiêu. `customMesh`: mesh riêng (VD lá bùa) — tự xoay theo hướng bay
 * (userData.alongPath = true: trục dài của mesh nằm dọc đường bay; userData.trail = màu vệt sáng phía sau).
 */
export function spawnProjectile(from, to, color, duration = 0.4, customMesh = null) {
    const mesh = customMesh ?? new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color }));
    mesh.position.copy(from);
    if (mesh.userData.alongPath) {
        const ang = Math.atan2(to.y - from.y, to.x - from.x);
        mesh.rotation.z = ang - Math.PI / 2; // mesh dựng đứng (cao > rộng) -> nằm dọc đường bay
    }
    scene.add(mesh);
    effects.push({ mesh, type: 'projectile', from: from.clone(), to: to.clone(), t: 0, duration, trailT: 0 });
}

/** Vệt sáng mờ dần sau đạn */
function spawnTrailDot(at, color) {
    const g = fxPlane(glowTexture(), 0.55, 0.55, { color });
    g.position.copy(at);
    g.position.z -= 0.02;
    addAnim(g, 0.28, (p, fx) => { const s = 1 - p * 0.7; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.75 * (1 - p); });
}

/** Lá bùa trúng đích: chớp chữ 封 + vụn giấy bay ra */
export function spawnTalismanHit(pos) {
    const at = new THREE.Vector3(pos.x, (pos.y ?? 0) + CHEST_Y, (pos.z ?? 0) + 0.45);
    const glyph = fxPlane(TEX.glyphSeal ??= canvasTexture(128, 128, (ctx) => {
        ctx.fillStyle = '#e9d5ff'; ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 22;
        ctx.font = 'bold 92px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('封', 64, 68);
    }), 1.3, 1.3);
    glyph.position.copy(at);
    addAnim(glyph, 0.45, (p, fx) => { const s = 0.6 + easeOut(p) * 0.8; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = p < 0.3 ? 1 : 1 - (p - 0.3) / 0.7; });
    spawnHitSpark(pos, { count: 5, color: 0xc4a1ff, size: 0.8 });
    spawnLightningBurst(pos, { count: 3, size: 0.8 });
    for (let i = 0; i < 9; i++) {
        const bit = fxPlane(null, 0.09, 0.15, { additive: false, color: i % 3 ? 0x2a1747 : 0xc4a1ff });
        bit.material.map = null;
        const vx = (Math.random() - 0.5) * 3.2, spin = (Math.random() - 0.5) * 18;
        let vy = 1 + Math.random() * 2.2, px = at.x, py = at.y;
        bit.position.copy(at);
        addAnim(bit, 0.6 + Math.random() * 0.3, (p, fx, dt) => {
            vy -= 7 * dt; px += vx * dt; py += vy * dt;
            fx.mesh.position.set(px, py, at.z);
            fx.mesh.rotation.z += spin * dt;
            fx.mesh.material.opacity = 1 - p * p;
        });
    }
}

/** Chớp sáng nhỏ ở tay lúc phóng bùa */
export function spawnHandFlash(at, color = 0xb48cff) {
    const g = fxPlane(glowTexture(), 0.9, 0.9, { color });
    g.position.set(at.x, at.y, at.z + 0.5);
    addAnim(g, 0.18, (p, fx) => { const s = 0.5 + p; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 1 - p; });
    const r = fxPlane(ringTexture(), 0.5, 0.5, { color });
    r.position.copy(g.position);
    addAnim(r, 0.22, (p, fx) => { const s = 0.4 + easeOut(p) * 1.4; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 1 - p; });
}

/** Chữ (ấn chú) bay lên rồi tan — VD 隠 khi tàng hình */
export function spawnRisingGlyph(pos, char = '隠', color = '#e9d5ff', glow = '#7c3aed') {
    const tex = TEX['glyph_' + char + color] ??= canvasTexture(128, 128, (ctx) => {
        ctx.fillStyle = color; ctx.shadowColor = glow; ctx.shadowBlur = 20;
        ctx.font = 'bold 92px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(char, 64, 68);
    });
    const m = fxPlane(tex, 1.2, 1.2);
    const x = pos.x, z = (pos.z ?? 0) + 0.5;
    addAnim(m, 0.9, (p, fx) => {
        fx.mesh.position.set(x, 1.6 + easeOut(p) * 1.2, z);
        const s = 0.7 + easeOut(Math.min(1, p * 3)) * 0.4;
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.material.opacity = p < 0.2 ? p * 5 : 1 - (p - 0.2) / 0.8;
    });
}

/** Đốm sáng bay lên quanh người (kết ấn) */
export function spawnRisingSparkles(pos, { count = 14, color = 0xa78bfa, radius = 0.8 } = {}) {
    for (let i = 0; i < count; i++) {
        const g = fxPlane(glowTexture(), 0.22, 0.22, { color });
        const x = pos.x + (Math.random() - 0.5) * radius * 2, z = (pos.z ?? 0) + 0.3 + Math.random() * 0.3;
        const y0 = -0.4 + Math.random() * 0.6, rise = 1.4 + Math.random() * 1.4, delay = Math.random() * 0.35;
        addAnim(g, 0.9 + delay, (p, fx) => {
            const t = Math.max(0, (p * (0.9 + delay) - delay) / 0.9);
            fx.mesh.position.set(x + Math.sin(t * 6 + i) * 0.08, y0 + rise * easeOut(t), z);
            fx.mesh.material.opacity = t <= 0 ? 0 : (t < 0.2 ? t * 5 : 1 - (t - 0.2) / 0.8);
        });
    }
}

/** Bóng mờ (dư ảnh) của nhân vật khi lướt: `object` là bản sao đã đổi vật liệu, tự mờ dần */
export function spawnGhost(object, life = 0.38, startOpacity = 0.6) {
    const mats = [];
    object.traverse(o => { if (o.material) mats.push(o.material); });
    addAnim(object, life, (p) => { for (const m of mats) m.opacity = startOpacity * (1 - p); });
}

// ------------------------------------------------------------
// Vào trận: vệt lướt kiểu ninja khi rơi xuống + bụi khi đáp đất
// ------------------------------------------------------------
let streakTexture = null;
function getStreakTexture() {
    if (streakTexture) return streakTexture;
    const c = document.createElement('canvas');
    c.width = 64; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.75, 'rgba(255,236,190,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.fillStyle = g;
    // thân vệt thon hai đầu
    ctx.beginPath(); ctx.moveTo(32, 0); ctx.quadraticCurveTo(58, 200, 32, 256); ctx.quadraticCurveTo(6, 200, 32, 0); ctx.fill();
    streakTexture = new THREE.CanvasTexture(c);
    return streakTexture;
}

/** Vệt sáng dọc phía sau nhân vật đang lao xuống (gắn vào view, tự mờ dần) */
export function spawnDashStreak(view, height = 9) {
    const group = new THREE.Group();
    const lines = [[0, 1.0, 1.0], [-0.45, 0.55, 0.7], [0.4, 0.45, 0.6]];
    for (const [x, w, len] of lines) {
        const m = new THREE.Mesh(
            new THREE.PlaneGeometry(w, height * len),
            new THREE.MeshBasicMaterial({ map: getStreakTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }),
        );
        m.userData.sharedTexture = true;
        m.position.set(x, height * len / 2 + 0.8, -0.1);
        group.add(m);
    }
    group.position.copy(view.root.position);
    scene.add(group);
    effects.push({ mesh: group, type: 'streak', view, life: 0.7, height });
}

let puffTexture = null;
function getPuffTexture() {
    if (puffTexture) return puffTexture;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(236,222,196,0.95)');
    g.addColorStop(0.6, 'rgba(214,196,164,0.6)');
    g.addColorStop(1, 'rgba(214,196,164,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    puffTexture = new THREE.CanvasTexture(c);
    return puffTexture;
}

/** Bụi nhỏ sau gót khi lướt (dir = hướng bụi bay: ngược hướng chạy) */
export function spawnFootDust(pos, dir) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: getPuffTexture(), transparent: true, depthWrite: false, opacity: 0.8 }));
    sprite.userData.sharedTexture = true;
    const s = 0.3 + Math.random() * 0.25;
    sprite.scale.set(s, s, 1);
    sprite.position.set(pos.x + dir * 0.2, -0.4 + Math.random() * 0.1, pos.z + 0.1);
    scene.add(sprite);
    effects.push({ mesh: sprite, type: 'puff', life: 0.35 + Math.random() * 0.15, vx: dir * (1 + Math.random()), vy: 0.4 + Math.random() * 0.4, grow: 1.2 });
}

/** Bụi tung hai bên chân khi đáp đất */
export function spawnLandingDust(pos, count = 9) {
    for (let i = 0; i < count; i++) {
        const side = i % 2 ? 1 : -1;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: getPuffTexture(), transparent: true, depthWrite: false }));
        sprite.userData.sharedTexture = true;
        const s = 0.5 + Math.random() * 0.5;
        sprite.scale.set(s, s, 1);
        sprite.position.set(pos.x + side * (0.2 + Math.random() * 0.3), -0.35 + Math.random() * 0.15, pos.z + 0.15 + (Math.random() - 0.5) * 0.4);
        scene.add(sprite);
        effects.push({
            mesh: sprite, type: 'puff', life: 0.55 + Math.random() * 0.25, maxLife: 0.8,
            vx: side * (2.2 + Math.random() * 2.2), vy: 0.5 + Math.random() * 0.9, grow: 1.6 + Math.random(),
        });
    }
}

// ------------------------------------------------------------
// Bùa (Sát Thủ - Kỹ năng 1), khói tàng hình, vệt lướt nối mục tiêu (Đột Kích)
// ------------------------------------------------------------
let talismanTexture = null;
/** Lá bùa giấy: nền vàng ngà, viền đỏ, chữ ấn đỏ, toả sáng nhẹ */
export function getTalismanTexture() {
    if (talismanTexture) return talismanTexture;
    const c = document.createElement('canvas');
    c.width = 96; c.height = 192;
    const ctx = c.getContext('2d');
    ctx.shadowColor = 'rgba(255, 220, 120, 0.9)'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#f4e6c3';
    ctx.fillRect(14, 10, 68, 172);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#b3261e'; ctx.lineWidth = 4; ctx.strokeRect(20, 16, 56, 160);
    ctx.lineWidth = 2; ctx.strokeRect(26, 22, 44, 148);
    ctx.fillStyle = '#b3261e'; ctx.font = 'bold 34px serif'; ctx.textAlign = 'center';
    ctx.fillText('封', 48, 66); ctx.fillText('印', 48, 108);
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(34, 128); ctx.quadraticCurveTo(62, 136, 40, 148); ctx.quadraticCurveTo(66, 156, 48, 168); ctx.stroke();
    talismanTexture = new THREE.CanvasTexture(c);
    talismanTexture.colorSpace = THREE.SRGBColorSpace;
    return talismanTexture;
}

/** Mesh lá bùa (dùng làm đạn bay và cầm trên tay) */
export function makeTalismanMesh(height = 0.62) {
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(height / 2, height),
        new THREE.MeshBasicMaterial({ map: getTalismanTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false }),
    );
    mesh.userData.sharedTexture = true;
    return mesh;
}

/** Khói bùng quanh người rồi tan (tàng hình / biến mất) */
/** hue/sat/light: màu khói (mặc định tím than của Jessica; Lyra dùng khói gió trắng ngọc) */
export function spawnSmokeBurst(pos, count = 12, radius = 0.8, { hue = 0.74, sat = 0.35, light = 0.22, height = 1.8 } = {}) {
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: getPuffTexture(), transparent: true, depthWrite: false, opacity: 0.75,
            color: new THREE.Color().setHSL(hue, sat, light + Math.random() * 0.14),
        }));
        sprite.userData.sharedTexture = true;
        const s = 0.45 + Math.random() * 0.35;
        sprite.scale.set(s, s, 1);
        const h = Math.random() * height;
        sprite.position.set(pos.x + Math.cos(a) * radius * 0.4, -0.35 + h, (pos.z ?? 0) + 0.3 + Math.sin(a) * 0.25);
        scene.add(sprite);
        effects.push({
            mesh: sprite, type: 'puff', life: 0.4 + Math.random() * 0.2,
            vx: Math.cos(a) * (1.4 + Math.random()), vy: 0.5 + Math.random() * 0.5, grow: 1.1 + Math.random() * 0.6,
        });
    }
}

/** Vệt sáng lướt ngang nối hai điểm (Đột Kích lao qua từng mục tiêu bị ấn) */
export function spawnDashLine(from, to, y = 0.75) {
    const dx = to.x - from.x, dz = (to.z ?? 0) - (from.z ?? 0);
    const len = Math.max(0.3, Math.hypot(dx, dz));
    const group = new THREE.Group();
    [[0.42, 0.55], [0.14, 1.0]].forEach(([h, op]) => {
        const m = new THREE.Mesh(
            new THREE.PlaneGeometry(h, len),
            new THREE.MeshBasicMaterial({ map: getStreakTexture(), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, color: 0xb48cff }),
        );
        m.userData.sharedTexture = true;
        m.rotation.z = dx >= 0 ? Math.PI / 2 : -Math.PI / 2; // nằm ngang; đầu sáng ở điểm đến, đuôi thon ở điểm xuất phát
        group.add(m);
    });
    group.position.set((from.x + to.x) / 2, y, ((from.z ?? 0) + (to.z ?? 0)) / 2 + 0.2);
    group.rotation.y = -Math.atan2(dz, Math.abs(dx)) * (dx >= 0 ? 1 : -1);
    scene.add(group);
    effects.push({ mesh: group, type: 'dashline', life: 0.35 });
}

// ------------------------------------------------------------
// Dấu Ấn (bùa phong ấn) trên mục tiêu: lá bùa lơ lửng trên đầu + vòng đếm ngược + vòng ấn dưới chân
// Thời gian còn lại đọc từ statusEffects của mục tiêu (theo đồng hồ trận) -> luôn khớp server
// ------------------------------------------------------------
function sealRingTexture() {
    return TEX.sealRing ??= canvasTexture(256, 256, (ctx) => {
        ctx.translate(128, 128);
        ctx.strokeStyle = 'rgba(167,110,255,0.95)'; ctx.shadowColor = 'rgba(124,58,237,1)'; ctx.shadowBlur = 10;
        ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 112, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 92, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(233,213,255,0.95)'; ctx.font = 'bold 22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const glyphs = '封印縛鎖符呪封印';
        for (let i = 0; i < 8; i++) {
            ctx.save(); ctx.rotate((i / 8) * Math.PI * 2); ctx.fillText(glyphs[i], 0, -102); ctx.restore();
        }
        ctx.lineWidth = 2.5; ctx.beginPath();
        for (let i = 0; i < 5; i++) { const a = (i * 2 * 2 * Math.PI) / 5 - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 88, Math.sin(a) * 88); }
        ctx.closePath(); ctx.stroke();
    });
}

/** @param view CharacterView mục tiêu  @param getRemaining () => [msCònLại, msTổng] */
export function spawnSealVfx(view, durationMs) {
    const existing = seals.find(s => s.view === view);
    if (existing) { existing.pop = 0; existing.t = 0; existing.total = durationMs; return; }

    const group = new THREE.Group();
    group.position.y = 3.25;
    // lá bùa
    const tali = new THREE.Mesh(
        new THREE.PlaneGeometry(0.34, 0.68),
        new THREE.MeshBasicMaterial({ map: getTalismanTexture(), transparent: true, depthWrite: false, fog: false }),
    );
    tali.userData.sharedTexture = true;
    // quầng sáng sau lá bùa
    const glow = fxPlane(glowTexture(), 1.3, 1.3, { color: 0x8b5cf6, opacity: 0.6 });
    glow.position.z = -0.02;
    // vòng đếm ngược (vẽ lại khi giá trị đổi)
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const ringTex = new THREE.CanvasTexture(c);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, fog: false }));
    ring.position.z = -0.01;
    group.add(glow, ring, tali);
    view.root.add(group);

    // vòng ấn dưới chân
    const floor = fxPlane(sealRingTexture(), 2.2, 2.2, { opacity: 0.0 });
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.47;
    view.root.add(floor);

    seals.push({ view, group, tali, glow, ring, ringCanvas: c, ringTex, floor, total: durationMs, pop: 0, last: -1, t: 0 });
}

function drawSealRing(s, frac) {
    const ctx = s.ringCanvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = frac > 0.3 ? '#c084fc' : '#f43f5e'; ctx.lineWidth = 6;
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(64, 64, 50, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    s.ringTex.needsUpdate = true;
}

let sealClock = () => performance.now();
/** Cho vfx biết "giờ trận" (để đếm ngược Ấn khớp server) */
export function setVfxClock(fn) { sealClock = fn; }

function updateSeals(dt) {
    const now = sealClock();
    seals = seals.filter(s => {
        const ef = s.view.member?.statusEffects?.find(e => e.type === 'seal');
        // vừa gắn mà gói trạng thái từ server chưa tới -> tạm coi như còn đủ thời gian
        const remaining = ef ? ef.endTime - now : (s.t < 0.6 ? s.total : 0);
        if (!s.view.member?.alive || remaining <= 0 || !s.view.root.parent) {
            disposeObject(s.group); disposeObject(s.floor); return false;
        }
        s.t += dt; s.pop = Math.min(1, s.pop + dt * 5);
        const frac = Math.max(0, Math.min(1, remaining / s.total));
        const q = Math.round(frac * 60);
        if (q !== s.last) { s.last = q; drawSealRing(s, frac); }
        // bật ra khi mới gắn, rồi lơ lửng nhẹ; sắp hết thì nhấp nháy
        const popS = 1 + 0.6 * (1 - easeOut(s.pop));
        s.group.scale.setScalar(popS);
        s.group.position.y = 3.25 + Math.sin(s.t * 3) * 0.06;
        s.tali.rotation.z = Math.sin(s.t * 2.2) * 0.12;
        const blink = frac < 0.25 ? 0.55 + 0.45 * Math.sin(s.t * 18) : 1;
        s.tali.material.opacity = blink;
        s.glow.material.opacity = (0.45 + 0.15 * Math.sin(s.t * 5)) * blink;
        s.floor.rotation.z += dt * 0.8;
        s.floor.material.opacity = Math.min(0.55, s.pop * 0.55) * blink;
        // giữ dấu luôn ngay trên đầu dù nhân vật lật trái/phải
        return true;
    });
}

// ------------------------------------------------------------
// Vòng lặp + dọn dẹp
// ------------------------------------------------------------
export function updateVfx(dt) {
    const k = dt * 60; // các hằng số gốc được viết cho 60 FPS

    damageNumbers = damageNumbers.filter(dn => {
        dn.life -= 0.02 * k;
        dn.sprite.position.y += dn.vy * k;
        dn.sprite.material.opacity = Math.max(0, dn.life);
        if (dn.life <= 0) { disposeObject(dn.sprite); return false; }
        return true;
    });

    // Hiệu ứng sinh ra TRONG lúc cập nhật (vệt sau đạn...) được đưa vào mảng mới, không bị mất
    const current = effects;
    effects = [];
    const kept = current.filter(fx => {
        if (fx.type === 'projectile') {
            fx.t += dt / fx.duration;
            fx.mesh.position.lerpVectors(fx.from, fx.to, Math.min(1, fx.t));
            if (fx.mesh.userData.spin) fx.mesh.rotation.z += fx.mesh.userData.spin * dt;
            if (fx.mesh.userData.trail != null) {
                fx.trailT -= dt;
                if (fx.trailT <= 0) { fx.trailT = 0.018; spawnTrailDot(fx.mesh.position, fx.mesh.userData.trail); }
            }
            if (fx.t >= 1) { disposeObject(fx.mesh); return false; }
            return true;
        }
        if (fx.type === 'anim') {
            fx.age += dt;
            const p = Math.min(1, fx.age / fx.life);
            fx.tick(p, fx, dt);
            if (p >= 1) { disposeObject(fx.mesh); return false; }
            return true;
        }
        if (fx.type === 'streak') {
            fx.life -= dt;
            fx.mesh.position.x = fx.view.root.position.x;
            fx.mesh.children.forEach(m => { m.material.opacity = Math.max(0, fx.life / 0.7) * 0.9; });
            fx.mesh.scale.y = 0.4 + 0.6 * Math.max(0, fx.life / 0.7);
            if (fx.life <= 0) { disposeObject(fx.mesh); return false; }
            return true;
        }
        if (fx.type === 'dashline') {
            fx.life -= dt;
            const k2 = Math.max(0, fx.life / 0.35);
            fx.mesh.children.forEach((m, i) => { m.material.opacity = k2 * (i ? 1 : 0.55); });
            fx.mesh.scale.y = 0.5 + 0.5 * k2;
            if (fx.life <= 0) { disposeObject(fx.mesh); return false; }
            return true;
        }
        if (fx.type === 'puff') {
            fx.life -= dt;
            fx.mesh.position.x += fx.vx * dt;
            fx.mesh.position.y += fx.vy * dt;
            fx.vx *= Math.exp(-5 * dt);
            fx.vy *= Math.exp(-4 * dt);
            const sc = fx.mesh.scale.x + fx.grow * dt;
            fx.mesh.scale.set(sc, sc, 1);
            fx.mesh.material.opacity = Math.min(1, fx.life * 2.2);
            if (fx.life <= 0) { disposeObject(fx.mesh); return false; }
            return true;
        }
        fx.life -= 0.05 * k;
        if (fx.type === 'line') fx.mesh.material.opacity = fx.life * 0.5;
        if (fx.type === 'fade') fx.mesh.material.opacity = fx.life * 2;
        if (fx.type === 'expand') {
            fx.mesh.scale.setScalar(1 + (1 - fx.life) * 2);
            fx.mesh.material.opacity = fx.life * 0.8;
        }
        if (fx.life <= 0) { disposeObject(fx.mesh); return false; }
        return true;
    });

    effects = kept.concat(effects);
    updateSeals(dt);
}

export function clearVfx() {
    damageNumbers.forEach(dn => disposeObject(dn.sprite));
    effects.forEach(fx => disposeObject(fx.mesh));
    seals.forEach(s => { disposeObject(s.group); disposeObject(s.floor); });
    damageNumbers = []; effects = []; seals = [];
}

// ============================================================
// TU SĨ (Seraphine): cầu sáng, hồi máu, khiên ánh sáng, thiên thần nhỏ, hộ vệ ánh sáng, hồi sinh
// ============================================================
let seraFxBase = null;
/** Texture 1 mảnh trong sera_fx (guardian / angelFly / angelHold / angelGive) + tỉ lệ khung (w/h) */
export function getSeraFxTexture(name) {
    TEX.seraFx ??= {};
    if (TEX.seraFx[name]) return TEX.seraFx[name];
    seraFxBase ??= new THREE.TextureLoader().load(seraFxUrl, t => { t.colorSpace = THREE.SRGBColorSpace; });
    seraFxBase.colorSpace = THREE.SRGBColorSpace;
    const [W, H] = seraFxMeta.atlasSize;
    const [x, y, w, h] = seraFxMeta.parts[name].rect;
    const t = seraFxBase.clone();
    t.repeat.set(w / W, h / H);
    t.offset.set(x / W, 1 - (y + h) / H);
    t.needsUpdate = true;
    return (TEX.seraFx[name] = { texture: t, aspect: w / h });
}
function seraSprite(name, height, { opacity = 1, additive = false } = {}) {
    const { texture, aspect } = getSeraFxTexture(name);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(height * aspect, height), new THREE.MeshBasicMaterial({
        map: texture, transparent: true, depthWrite: false, fog: false, opacity,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide }));
    m.userData.sharedTexture = true;
    return m;
}
export { seraSprite };

/** Bong bóng khiên ánh sáng (vòng sáng + viền vàng) */
export function getHolyBubbleTexture() {
    return TEX.holyBubble ??= canvasTexture(256, 256, (ctx) => {
        const g = ctx.createRadialGradient(128, 128, 60, 128, 128, 124);
        g.addColorStop(0, 'rgba(255,250,220,0)');
        g.addColorStop(0.72, 'rgba(255,244,200,0.12)');
        g.addColorStop(0.9, 'rgba(255,224,140,0.55)');
        g.addColorStop(0.97, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(128, 128, 126, 0, Math.PI * 2); ctx.fill();
        // vệt phản chiếu
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(128, 128, 100, Math.PI * 1.1, Math.PI * 1.35); ctx.stroke();
    });
}
/** Đôi cánh lông vũ trắng viền vàng (khiên cánh khi Tu Sĩ niệm). Vẽ 1 bên, bên kia lật */
export function getWingTexture() {
    return TEX.wing ??= canvasTexture(256, 256, (ctx) => {
        ctx.translate(30, 150);
        for (let i = 0; i < 7; i++) {
            const a = -1.25 + i * 0.22, len = 150 - i * 12;
            ctx.save(); ctx.rotate(a);
            const g = ctx.createLinearGradient(0, 0, len, 0);
            g.addColorStop(0, 'rgba(255,240,200,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0.9)');
            ctx.fillStyle = g; ctx.strokeStyle = 'rgba(214,170,70,0.95)'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.ellipse(len * 0.5, 0, len * 0.5, 13 - i * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        ctx.shadowColor = 'rgba(255,220,120,1)'; ctx.shadowBlur = 18;
        ctx.fillStyle = 'rgba(255,236,170,0.9)'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    });
}

/** Cầu ánh sáng (đánh thường của Tu Sĩ) */
export function spawnLightOrb(from, to, { duration = 0.25, onHit } = {}) {
    const g = new THREE.Group();
    const core = fxPlane(glowTexture(), 0.75, 0.75, { color: 0xfff3c4 });
    const halo = fxPlane(glowTexture(), 1.5, 1.5, { color: 0xfacc15, opacity: 0.6 });
    const tail = fxPlane(windStreakTexture(), 1.8, 0.45, { color: 0xfde68a });
    tail.position.x = -0.9;
    g.add(tail, halo, core);
    g.rotation.z = Math.atan2(to.y - from.y, to.x - from.x);
    const z = (from.z ?? 0) + 0.55;
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(from.x + (to.x - from.x) * p, from.y + (to.y - from.y) * p + Math.sin(p * Math.PI) * 0.4, z);
        halo.scale.setScalar(1 + 0.2 * Math.sin(p * 30));
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}
/** Trúng cầu sáng: loé vàng nhỏ */
export function spawnLightBurst(pos, { size = 1 } = {}) {
    const c = { x: pos.x, y: (pos.y ?? 0) + CHEST_Y, z: (pos.z ?? 0) + 0.6 };
    const f = fxPlane(glowTexture(), 1, 1, { color: 0xfff1b8 });
    f.position.set(c.x, c.y, c.z);
    addAnim(f, 0.3, (p, fx) => { const s = (0.6 + easeOut(p) * 1.8) * size; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 1 - p; });
    spawnHitSpark(pos, { count: 6, color: 0xfde68a, size: 0.8 * size });
}
/** Hồi máu: cột sáng vàng rọi xuống + vòng sáng dưới chân + đốm sáng bay lên */
export function spawnHealLight(pos, { big = false } = {}) {
    const h = big ? 5 : 4;
    const pillar = fxPlane(sparkTexture(), big ? 1.6 : 1.2, h, { color: 0xfff1c1 });
    pillar.position.set(pos.x, GROUND_Y_FX + h / 2, (pos.z ?? 0) + 0.4);
    addAnim(pillar, 0.7, (p, fx) => { fx.mesh.scale.x = 1 - p * 0.6; fx.mesh.material.opacity = p < 0.2 ? p * 5 : (1 - p) * 1.25; });
    const ring = fxPlane(ringTexture(), 1, 1, { color: 0xfacc15 });
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, GROUND_Y_FX + 0.05, pos.z ?? 0);
    addAnim(ring, 0.6, (p, fx) => { const s = 0.5 + easeOut(p) * (big ? 3.2 : 2.4); fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 1 - p; });
    spawnRisingSparkles(pos, { count: big ? 16 : 10, color: 0xfde68a, radius: 0.7 });
}
const GROUND_Y_FX = -0.5;
/** Thiên thần nhỏ bay từ `from` tới `getTo()` (đuổi theo), mang quả cầu sáng; tới nơi gọi onArrive rồi tan */
export function spawnAngel(from, getTo, { duration = 0.45, size = 1.1, onArrive } = {}) {
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 1.2 * size, 1.2 * size, { color: 0xfde68a, opacity: 0.6 });
    const body = seraSprite('angelFly', size);
    g.add(glow, body);
    const z = (from.z ?? 0) + 0.8;
    let arrived = false;
    const life = duration + 0.25;
    addAnim(g, life, (p, fx) => {
        const t = Math.min(1, (p * life) / duration);
        const to = getTo();
        const e = t * t * (3 - 2 * t);
        const x = from.x + (to.x - from.x) * e, y = from.y + (to.y - from.y) * e + Math.sin(t * Math.PI) * 1.2 + Math.sin(p * 25) * 0.05;
        fx.mesh.position.set(x, y, z);
        body.scale.x = to.x >= from.x ? 1 : -1;
        const fade = t >= 1 ? 1 - ((p * life - duration) / 0.25) : Math.min(1, p * 8);
        body.material.opacity = Math.max(0, fade);
        glow.material.opacity = 0.6 * Math.max(0, fade);
        if (t >= 1 && !arrived) { arrived = true; onArrive?.(); }
    });
}
/** Hồi sinh: cột sáng lớn + sóng vàng + lông vũ / đốm sáng */
export function spawnReviveLight(pos) {
    spawnHealLight(pos, { big: true });
    spawnShockwave(pos, { color: 0xfde68a, radius: 3, life: 0.6 });
    const flash = fxPlane(glowTexture(), 1, 1, { color: 0xffffff });
    flash.position.set(pos.x, (pos.y ?? 0) + CHEST_Y, (pos.z ?? 0) + 0.6);
    addAnim(flash, 0.5, (p, fx) => { const s = 1 + easeOut(p) * 4; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 1 - p; });
}

// Dùng chung cho các module hiệu ứng riêng (vfx/fireFx.js...)
export { addAnim, fxPlane, glowTexture, sparkTexture, ringTexture, easeOut, CHEST_Y };
