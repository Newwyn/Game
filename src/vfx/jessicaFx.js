// ============================================================
// HIỆU ỨNG JESSICA (bản 3: nữ ninja sấm tím) — chạy khung (flipbook)
// ============================================================
// Hình lấy từ atlas jessica_fx2.webp (tools/fx_grid_pack.py art/jessica/fx2/fx2_spec.json — 4 tấm tranh AI nền đen của người dùng):
//   taliFly (lá bùa bay 4 lặp) · taliHit (bùa trúng 4: loé · vỡ · hiện Ấn · tan)
//   thunderSlash (vệt chém sấm 4) · thunderX (chí mạng chém chữ X 4)
//   stealthBurst (khói sấm bùng 4) · stealthAura (hào quang tàng hình 4 lặp)
//   sealMark · shadowRing · dashStreak · bolt · dodgeWing · resetIcon · sparkBurst · afterimage (hình lẻ)
// Mốc sát thương / thời gian do server + events.js quyết định — ở đây chỉ vẽ.
import * as THREE from 'three';
import fxUrl from '../assets/sprites/jessica_fx2.webp';
import FX from './jessicaFx2.json';
import { addAnim, fxPlane, glowTexture, easeOut, spawnHitSpark, setSealIconFactory } from './vfx.js';
import { makeFlipbook, loopFrame, weighted, fadeInOut } from './flipbook.js';

const FB = makeFlipbook(fxUrl, FX);
FB.tex('sealMark');   // tải atlas ngay khi vào game (khung đầu không bị trống)
export const jessicaFrames = FB.frames;
const setFx = FB.set;
const GROUND = -0.5, CHEST = 0.75;
const seqFrame = (p, w) => weighted(Math.min(0.999, Math.max(0, p)), w);

/** Texture tia sét nhỏ (dùng cho Sấm phù trợ: tia sét nháy quanh đồng đội) — cao gấp đôi rộng */
export const jessicaBoltTexture = () => FB.tex('bolt');

// Dấu Ấn trên đầu quái (vfx.js spawnSealVfx): thay lá bùa vẽ bằng code bằng ấn sấm tím của tranh
setSealIconFactory(() => jessicaFrames('sealMark', 0.78));

// ------------------------------------------------------------
// PHÓNG BÙA
// ------------------------------------------------------------
/** Lá bùa bay xoay (4 khung lặp) từ `from` tới `to` (toạ độ thế giới), trúng thì gọi onHit */
export function spawnTalismanShot(from, to, { duration = 0.2, size = 0.85, onHit } = {}) {
    const m = jessicaFrames('taliFly', size);
    const glow = fxPlane(glowTexture(), size * 1.4, size * 1.4, { color: 0x9b5cff, opacity: 0.5 });
    const g = new THREE.Group();
    g.add(glow, m);
    const dx = to.x - from.x, dy = to.y - from.y, left = dx < 0;
    m.scale.x = left ? -1 : 1;
    m.rotation.z = left ? -Math.atan2(dy, -dx) : Math.atan2(dy, dx);
    const z0 = from.z ?? 0, z1 = to.z ?? z0;
    const ph = Math.random() * 4;
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(from.x + dx * p, from.y + dy * p, z0 + (z1 - z0) * p + 0.1);
        setFx(m, loopFrame(p * duration, 20, 4, ph));
        glow.material.opacity = 0.45 + 0.15 * Math.sin(p * 30);
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}

/** Bùa trúng: loé tím -> vỡ thành giấy vụn + sét -> hiện vòng Ấn -> tan */
export function spawnTalismanImpact(pos, { size = 1.5 } = {}) {
    const m = jessicaFrames('taliHit', size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + CHEST, (pos.z ?? 0) + 0.5);
    addAnim(m, 0.62, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.7, 0.9, 1.4, 1]));
        fx.mesh.scale.setScalar(0.85 + 0.2 * easeOut(Math.min(1, p * 3)));
        fx.mesh.material.opacity = p < 0.06 ? p / 0.06 : p > 0.85 ? (1 - p) / 0.15 : 1;
    });
    spawnHitSpark(pos, { count: 5, color: 0xc4a1ff, size: 0.8 });
}

// ------------------------------------------------------------
// VỆT CHÉM SẤM (tàng hình / Đột Kích) · CHÍ MẠNG CHỮ X
// ------------------------------------------------------------
/** Vệt chém sấm tím (4 khung) trên người mục tiêu; dir = hướng chém (1 phải / -1 trái) */
export function spawnThunderSlash(pos, { dir = 1, size = 1.6 } = {}) {
    const m = jessicaFrames('thunderSlash', size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + CHEST + 0.1, (pos.z ?? 0) + 0.55);
    m.scale.x = dir;
    addAnim(m, 0.3, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.6, 1, 1, 1]));
        fx.mesh.material.opacity = p < 0.05 ? p / 0.05 : 1;
    });
}

/** Chí mạng: hai nhát sấm chéo chữ X + loé sáng + rung nhẹ cỡ */
export function spawnThunderX(pos, { dir = 1, size = 1.9 } = {}) {
    const m = jessicaFrames('thunderX', size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + CHEST + 0.1, (pos.z ?? 0) + 0.55);
    addAnim(m, 0.42, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.7, 1, 1.1, 1]));
        const s = 1 + 0.08 * Math.sin(Math.min(1, p * 2) * Math.PI);
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.material.opacity = p < 0.04 ? p / 0.04 : 1;
    });
    const c = fxPlane(glowTexture(), 1.6, 1.6, { color: 0xb26bff, opacity: 0.9 });
    c.position.set(pos.x, (pos.y ?? 0) + CHEST + 0.1, (pos.z ?? 0) + 0.5);
    addAnim(c, 0.25, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.2); fx.mesh.material.opacity = 0.9 * (1 - p); });
}

// ------------------------------------------------------------
// TÀNG HÌNH / BIẾN MẤT / HIỆN RA
// ------------------------------------------------------------
/** Khói sấm tím bùng lên dưới chân (4 khung) + vòng bóng tối trên đất */
export function spawnStealthBurst(pos, { size = 2.4, ring = true } = {}) {
    const m = jessicaFrames('stealthBurst', size, { opacity: 0 });
    m.position.set(pos.x, GROUND + 0.02, (pos.z ?? 0) + 0.45);
    addAnim(m, 0.6, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.7, 1.1, 1.1, 1.2]));
        fx.mesh.material.opacity = p < 0.05 ? p / 0.05 : p > 0.85 ? (1 - p) / 0.15 : 1;
    });
    if (ring) spawnShadowRing(pos, { radius: 1.3, life: 0.7 });
}

/** Vòng bóng tối sấm tím nằm trên đất (chỗ biến mất / hiện ra) */
export function spawnShadowRing(pos, { radius = 1.3, life = 0.7 } = {}) {
    const d = FB.decal('shadowRing', pos.x, pos.z ?? 0, 1, { lift: 0.04 });
    const aspect = FX.groups.shadowRing.size[0] / FX.groups.shadowRing.size[1];
    addAnim(d, life, (p, fx) => {
        const r = radius * (0.6 + 0.4 * easeOut(Math.min(1, p / 0.3)));
        fx.mesh.scale.set(2 * r / aspect, 1.5 * r, 1);
        fx.mesh.material.opacity = p < 0.1 ? p / 0.1 : p > 0.6 ? (1 - p) / 0.4 : 1;
    });
}

/**
 * Hào quang tàng hình quanh Jessica: vòng sét tím (4 khung lặp) + tia sét nhỏ nháy quanh người.
 * { group, update(dt, k, time, lift), surge() } — group gắn vào view.stand (không lật).
 */
export function makeStealthAura(height = 2.9) {
    const g = new THREE.Group();
    const H = height * 1.25;
    const ring = jessicaFrames('stealthAura', H, { opacity: 0 });
    const glow = fxPlane(glowTexture(), height * 1.1, height * 1.4, { color: 0x8b3dff, opacity: 0 });
    glow.position.z = -0.3;
    const body = new THREE.Group();
    body.add(glow, ring);
    g.add(body);
    const bolts = [0, 1, 2].map(() => { const b = jessicaFrames('bolt', 0.6, { opacity: 0 }); g.add(b); return { m: b, t: Math.random() * 0.3, life: 0 }; });
    let surge = 0;
    return {
        group: g,
        surge() { surge = 1; },
        update(dt, k, time, lift = 0) {
            surge = Math.max(0, surge - dt * 3);
            setFx(ring, loopFrame(time, 10, 4));
            body.position.set(0, GROUND + lift + height * 0.52, 0.05);
            ring.material.opacity = k * (0.75 + 0.15 * Math.sin(time * 7) + 0.1 * surge);
            ring.scale.setScalar(1 + 0.03 * Math.sin(time * 5) + 0.06 * surge);
            glow.material.opacity = k * (0.16 + 0.12 * surge);
            bolts.forEach((b) => {
                b.t -= dt;
                if (b.t <= 0) {
                    b.t = 0.18 + Math.random() * 0.3; b.life = 0.14;
                    const side = Math.random() < 0.5 ? -1 : 1;
                    b.m.position.set(side * (0.5 + Math.random() * 0.35), GROUND + lift + height * (0.2 + Math.random() * 0.65), 0.25);
                    b.m.rotation.z = (Math.random() - 0.5) * 0.9;
                    b.m.scale.setScalar(0.7 + Math.random() * 0.6);
                }
                b.life = Math.max(0, b.life - dt);
                b.m.material.opacity = k * (b.life > 0 ? 1 : 0);
            });
        },
        dispose() { g.parent?.remove(g); },
    };
}

// ------------------------------------------------------------
// ĐỘT KÍCH: vệt lướt sấm
// ------------------------------------------------------------
/** Vệt lướt sấm từ `from` tới `to` (ngang ngực), đầu sáng ở đích + bóng mờ ở chỗ xuất phát */
export function spawnDashStreak(from, to, { y = CHEST } = {}) {
    const dx = to.x - from.x, dz = (to.z ?? 0) - (from.z ?? 0);
    const len = Math.max(0.6, Math.hypot(dx, dz));
    const m = jessicaFrames('dashStreak', 0.9, { opacity: 0 });
    const w = FX.groups.dashStreak.size[0] / FX.groups.dashStreak.size[1] * 0.9;   // bề ngang hình ở cao 0.9
    const left = dx < 0;
    m.position.set((from.x + to.x) / 2, y, ((from.z ?? 0) + (to.z ?? 0)) / 2 + 0.4);
    addAnim(m, 0.32, (p, fx) => {
        fx.mesh.scale.set((left ? -1 : 1) * len / w * (0.7 + 0.3 * easeOut(Math.min(1, p * 4))), 1 - 0.4 * p, 1);
        fx.mesh.material.opacity = p < 0.08 ? p / 0.08 : (1 - p) / 0.92;
    });
    const a = jessicaFrames('afterimage', 1.5, { opacity: 0 });
    a.position.set(from.x, y + 0.1, (from.z ?? 0) + 0.3);
    a.scale.x = left ? -1 : 1;
    addAnim(a, 0.4, (p, fx) => { fx.mesh.material.opacity = 0.85 * (1 - p); fx.mesh.position.x = from.x + dx * 0.15 * p; });
}

/** Loé tia lửa sấm (hiện ra chém trúng) */
export function spawnSparkBurst(pos, { size = 1.4 } = {}) {
    const m = jessicaFrames('sparkBurst', size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + CHEST + 0.1, (pos.z ?? 0) + 0.6);
    addAnim(m, 0.3, (p, fx) => {
        fx.mesh.scale.setScalar(0.5 + 0.7 * easeOut(Math.min(1, p / 0.4)));
        fx.mesh.rotation.z = p * 0.6;
        fx.mesh.material.opacity = p < 0.1 ? p / 0.1 : (1 - p) / 0.9;
    });
}

// ------------------------------------------------------------
// Biểu tượng nhỏ: buff né (đồng đội) · hồi chiêu (chém chết)
// ------------------------------------------------------------
function popIcon(group, view, { delay = 0, life = 1.2, h = 0.75, spin = 0 } = {}) {
    const m = jessicaFrames(group, h, { opacity: 0 });
    const y0 = (view.height ?? 2.9) + 0.45;
    addAnim(m, life + delay, (p, fx) => {
        const tt = Math.max(0, (p * (life + delay) - delay) / life);
        const pop = tt < 0.15 ? easeOut(tt / 0.15) : 1;
        fx.mesh.scale.setScalar(0.6 + 0.4 * pop);
        fx.mesh.position.set(0, y0 + 0.3 * easeOut(tt), 0.4);
        if (spin) fx.mesh.rotation.z = spin * easeOut(Math.min(1, tt * 2));
        fx.mesh.material.opacity = tt <= 0 ? 0 : tt > 0.75 ? (1 - tt) / 0.25 : pop;
    }, view.root);
}
/** Cánh sét tím (đồng đội +né tránh khi Jessica tàng hình) bật trên đầu `view` */
export const spawnDodgeIcon = (view, opts) => popIcon('dodgeWing', view, opts);
/** Mũi tên vòng (chém chết -> Đột Kích hồi chiêu chỉ còn 1s) bật trên đầu Jessica, xoay 1 vòng */
export const spawnResetIcon = (view, opts) => popIcon('resetIcon', view, { spin: Math.PI * 2, ...opts });
