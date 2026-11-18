// ============================================================
// HIỆU ỨNG KIẾM TIÊN — YunYou (swordsage)
//   Chỉ dùng tranh thật (yunyou_sword.webp, yunyou_swordfan.webp) + thư viện điểm ảnh pixelfx (JADE_PAL).
//   Không dùng hình khối dựng sẵn hay canvas vẽ tay làm hình cuối.
// ============================================================
import * as THREE from 'three';
import swordUrl from '../assets/sprites/yunyou_sword.webp';
import fanUrl from '../assets/sprites/yunyou_swordfan.webp';
import { getTexture } from '../core/textures.js';
import { scene } from '../core/scene.js';
import { GROUND_Y, gameNow, gameTimeout } from '../config.js';
import { fxScale } from '../core/settings.js';
import { addAnim, easeOut } from './vfx.js';
import { spawnPixelFx, pixelLayer, pixelMod } from './pixelFx.js';

export const JADE_PAL = ['#042f2e', '#115e59', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#e6fffb'];

const activeFans = new Map();
const activeFormations = new Map();

const keyOf = (id, idx) => `${id ?? 's'}:${idx ?? 0}`;
const swordTex = () => getTexture(swordUrl);
const fanTex = () => getTexture(fanUrl);

function aspectOf(tex, fallback) {
    const im = tex?.image;
    const w = im?.naturalWidth || im?.width, h = im?.naturalHeight || im?.height;
    return w && h ? w / h : fallback;
}

/** Tạo tấm phẳng hiển thị ảnh vẽ (sharedTexture: dùng chung bộ nhớ GPU; userData.isVfx: giảm sáng theo fxDim) */
function artQuad(tex, w, h, { opacity = 1, additive = false, renderOrder = 6 } = {}) {
    const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        fog: false,
        opacity,
        side: THREE.DoubleSide,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    mat.userData.isVfx = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.userData.sharedTexture = true;
    m.renderOrder = renderOrder;
    return m;
}

/** Tỉ lệ quy đổi khi người dùng đổi mức hiệu ứng (full = 1 · soft = 0.58 · minimal = 0.32) */
const kFx = () => 0.65 + 0.35 * fxScale();

// ------------------------------------------------------------
// 1. ĐÁNH THƯỜNG: kiếm khí / linh kiếm ngọc nhạt bay tới mục tiêu
// ------------------------------------------------------------
export function spawnSwordAutoProjectile(from, to, { duration = 0.24, length = 1.65, crit = false, onHit } = {}) {
    const tex = swordTex();
    const h = length * kFx();
    const w = h * aspectOf(tex, 0.18);
    const m = artQuad(tex, w, h, { opacity: 0.95, additive: true, renderOrder: 8 });
    const dx = to.x - from.x, dy = to.y - from.y, dz = (to.z ?? 0) - (from.z ?? 0);
    // ảnh yunyou_sword.webp mũi kiếm hướng LÊN (+Y) -> trừ PI/2 để mũi kiếm hướng về mục tiêu
    m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
    let hit = false;
    addAnim(m, duration, (p, fx) => {
        const s = 0.9 + 0.15 * Math.sin(p * Math.PI);
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.position.set(from.x + dx * p, from.y + dy * p, (from.z ?? 0) + dz * p + 0.45);
        fx.mesh.material.opacity = (p > 0.85 ? (1 - p) / 0.15 : 1) * 0.95;
        if (p >= 1 && !hit) {
            hit = true;
            onHit?.();
            spawnPixelFx(crit ? 'impacts/crit-hit' : 'impacts/hit-spark', {
                pos: { x: to.x, z: to.z ?? 0 },
                flip: dx < 0,
                palette: JADE_PAL,
                scale: (crit ? 0.85 : 0.72) * kFx(),
            });
        }
    });
}

// ------------------------------------------------------------
// 2. KỸ NĂNG 1 — NGỰ KIẾM TỐC: quầng tăng tốc ngọc nhạt (pixelfx)
// ------------------------------------------------------------
export function spawnSwordHaste(casterView, durationMs = 6000) {
    if (!casterView) return;
    spawnPixelFx('impacts/hit-spark', {
        pos: casterView.position,
        palette: JADE_PAL,
        scale: 1.0 * kFx(),
    });
    spawnPixelFx('status/haste', {
        view: casterView,
        palette: JADE_PAL,
        scale: 0.92 * kFx(),
        maxLife: Math.max(0.5, durationMs / 1000),
        until: () => !casterView.member?.alive || !casterView.member?.statusEffects?.some(e => e.type === 'sword_haste' && e.endTime > gameNow()),
    });
}

// ------------------------------------------------------------
// 3. KỸ NĂNG 2 — VẠN KIẾM ĐỒNG QUY: quạt 7 thanh kiếm sau lưng (yunyou_swordfan.webp) + phóng kiếm phụ
// ------------------------------------------------------------
/** Quạt kiếm lớn đứng SAU LƯNG YunYou như đuôi công (~2.2× chiều cao), hơi mờ, lắc nhẹ, chớp khi đánh thường */
export function spawnSwordFan(casterId, casterIdx, casterView, durationMs = 8000) {
    if (!casterView) return;
    const key = keyOf(casterId, casterIdx);
    const prev = activeFans.get(key);
    if (prev) { prev.stopping = true; activeFans.delete(key); }

    const tex = fanTex();
    const H = casterView.height ?? 2.9;
    const w = H * 2.2;
    const h = w / aspectOf(tex, 1.33);
    const mesh = artQuad(tex, w, h, { opacity: 0, renderOrder: 2 });
    const entry = {
        mesh,
        flash: 0.6,
        stopping: false,
        fadeOut: 1,
        endAt: gameNow() + durationMs,
    };
    activeFans.set(key, entry);

    const maxSec = durationMs / 1000 + 2;
    addAnim(mesh, maxSec, (p, fx, dt = 0.016) => {
        const m = casterView.member;
        const alive = !!m?.alive && !!casterView.root?.parent;
        const hasBuff = !!m?.statusEffects?.some(e => e.type === 'sword_multi' && e.endTime > gameNow());
        const expired = gameNow() >= entry.endAt && !hasBuff;
        if (entry.stopping || !alive || expired || fx.age > durationMs / 1000) {
            entry.fadeOut = Math.max(0, entry.fadeOut - dt * 3.2);
            if (entry.fadeOut <= 0.01) {
                if (activeFans.get(key) === entry) activeFans.delete(key);
                fx.life = fx.age;
                return;
            }
        }
        entry.flash = Math.max(0, entry.flash - dt * 4.5);
        const fadeIn = Math.min(1, fx.age / 0.3);
        const dir = casterView.facingLeft ? -1 : 1;
        const px = casterView.position.x - dir * 0.14;
        const py = GROUND_Y + (casterView._hover ?? 0) + (casterView._lift ?? 0) + H * 0.48;
        const pz = (casterView.position.z ?? 0) - 0.34;
        fx.mesh.position.set(px, py, pz);
        // đung đưa nhẹ như quạt sau lưng
        fx.mesh.rotation.z = Math.sin(fx.age * 2.1) * 0.045;
        const s = (0.94 + 0.06 * easeOut(fadeIn) + 0.03 * Math.sin(fx.age * 2.8)) * (1 + 0.09 * entry.flash);
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.material.opacity = (0.64 + 0.34 * entry.flash) * fadeIn * entry.fadeOut * (0.75 + 0.25 * fxScale());
    });
}

export function flashSwordFan(casterId, casterIdx) {
    const entry = activeFans.get(keyOf(casterId, casterIdx));
    if (entry) entry.flash = 1.0;
}

/** Vị trí từng thanh kiếm trong quạt 7 kiếm phía sau YunYou */
function fanSlotPoint(casterView, k, n) {
    const H = casterView.height ?? 2.9;
    const frac = n <= 1 ? 0 : (k / (n - 1)) * 2 - 1;   // -1 .. 1
    const angle = frac * 1.05;
    const rad = H * 0.85;
    const dir = casterView.facingLeft ? -1 : 1;
    const cy = GROUND_Y + (casterView._hover ?? 0) + (casterView._lift ?? 0) + H * 0.42;
    return {
        x: casterView.position.x - dir * 0.14 + Math.sin(angle) * rad * 0.9,
        y: cy + Math.cos(angle) * rad * 0.72,
        z: (casterView.position.z ?? 0) - 0.18,
    };
}

/** Phóng kiếm phụ (yunyou_sword.webp) từ quạt sau lưng tới TẤT CẢ các đối thủ khác + hit burst pixelfx */
export function spawnExtraSwords(casterId, casterIdx, casterView, items, { duration = 0.24, onImpact } = {}) {
    if (!casterView || !items?.length) return;
    flashSwordFan(casterId, casterIdx);
    const tex = swordTex();
    const h = 1.45 * kFx();
    const w = h * aspectOf(tex, 0.18);
    items.forEach(({ targetView, eff }, idx) => {
        if (!targetView) return;
        const from = fanSlotPoint(casterView, idx, items.length);
        const m = artQuad(tex, w, h, { opacity: 0.95, additive: true, renderOrder: 8 });
        let done = false;
        addAnim(m, duration, (p, fx) => {
            const toX = targetView.position.x;
            const toY = GROUND_Y + (targetView._hover ?? 0) + (targetView._lift ?? 0) + (targetView.height ?? 2.6) * 0.48;
            const toZ = targetView.position.z ?? 0;
            const dx = toX - from.x, dy = toY - from.y, dz = toZ - from.z;
            fx.mesh.position.set(from.x + dx * p, from.y + dy * p, from.z + dz * p + 0.35);
            fx.mesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
            fx.mesh.material.opacity = (p < 0.12 ? p / 0.12 : p > 0.85 ? (1 - p) / 0.15 : 1) * 0.95;
            if (p >= 1 && !done) {
                done = true;
                onImpact?.(targetView, eff);
                if (!eff?.isMiss) {
                    spawnPixelFx(eff?.isCrit ? 'impacts/crit-hit' : 'impacts/hit-spark', {
                        pos: { x: toX, z: toZ },
                        flip: dx < 0,
                        palette: JADE_PAL,
                        scale: (eff?.isCrit ? 0.88 : 0.68) * kFx(),
                    });
                }
            }
        });
    });
}

// ------------------------------------------------------------
// 4. KỸ NĂNG 3 — TRẬN ĐỒ KIẾM: pháp trận nghiêng trên trời (pixelfx) + mưa kiếm + đại kiếm cuối
// ------------------------------------------------------------
/**
 * Pháp trận trên trời phía trên cụm địch, nghiêng hướng về camera.
 * Ghi chú (theo pixelFx LIB): thư viện pixelfx không có hiệu ứng magic-circle thực sự,
 * nên dùng `arcane/portal` (nhuộm xanh ngọc nhạt, nghiêng ngang về camera) làm bản thay thế gần nhất.
 */
export function spawnSkyFormation(casterId, casterIdx, x, z, { radius = 8, duration = 7.5 } = {}) {
    const key = keyOf(casterId, casterIdx);
    const old = activeFormations.get(key);
    if (old && !old.stopping && Math.hypot(old.x - x, old.z - z) < 0.2) {
        old.endAt = Math.max(old.endAt, gameNow() + duration * 1000);
        return;
    }
    if (old) { old.layer.stop(); old.stopping = true; }

    const mod = pixelMod('arcane/portal');
    if (!mod) return;
    const layer = pixelLayer(mod, {
        height: 2.9,
        scale: Math.max(1.8, Math.min(4.0, radius * 0.42)) * kFx(),
        palette: JADE_PAL,
        seed: 9,
    });
    const g = layer.group;
    g.position.set(x, GROUND_Y + 5.6, z);
    // xoay portal thành mặt đĩa ngang nghiêng về phía camera chéo / ngang
    g.rotation.x = -Math.PI * 0.36;
    g.rotation.z = Math.PI / 2;

    const entry = { layer, stopping: false, endAt: gameNow() + duration * 1000, x, z };
    activeFormations.set(key, entry);

    addAnim(g, Math.max(duration + 6, 15), (p, fx, dt = 0.016) => {
        if (entry.stopping || gameNow() >= entry.endAt) layer.stop();
        if (dt > 0) layer.step(dt);
        if (layer.done()) {
            if (activeFormations.get(key) === entry) activeFormations.delete(key);
            fx.life = fx.age;
        }
    });
}

export function endSkyFormation(casterId, casterIdx) {
    const entry = activeFormations.get(keyOf(casterId, casterIdx));
    if (entry) {
        entry.stopping = true;
        entry.layer.stop();
    }
}

/** Mưa kiếm: nhiều thanh yunyou_sword.webp mũi hướng xuống rơi khắp vùng trận đồ */
export function spawnSwordRainTick(x, z, radius = 8) {
    const count = Math.max(4, Math.round(6 + 6 * fxScale()));
    const tex = swordTex();
    const rSpread = Math.min(7.5, Math.max(3.2, radius * 0.85));
    for (let i = 0; i < count; i++) {
        const delayMs = i * 55 + Math.random() * 40;
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * rSpread;
        const tx = x + Math.cos(ang) * dist;
        const tz = z + Math.sin(ang) * dist * 0.55;
        const len = (1.5 + Math.random() * 0.5) * kFx();
        const w = len * aspectOf(tex, 0.18);
        gameTimeout(() => {
            if (!scene) return;
            const m = artQuad(tex, w, len, { opacity: 0.92, additive: true, renderOrder: 7 });
            // Mũi kiếm hướng XUỐNG DƯỚI (Math.PI vì ảnh gốc mũi hướng LÊN)
            m.rotation.z = Math.PI + (Math.random() - 0.5) * 0.12;
            const topY = GROUND_Y + 5.3 + Math.random() * 0.6;
            const endY = GROUND_Y + 0.15;
            const dur = 0.22 + Math.random() * 0.08;
            let sparked = false;
            addAnim(m, dur + 0.16, (p, fx) => {
                const k = Math.min(1, (p * (dur + 0.16)) / dur);
                const ease = k * k;
                fx.mesh.position.set(tx, topY + (endY - topY) * ease, tz + 0.35);
                fx.mesh.material.opacity = k < 1 ? 0.92 : 0.92 * Math.max(0, 1 - (p * (dur + 0.16) - dur) / 0.16);
                if (k >= 1 && !sparked) {
                    sparked = true;
                    if (i % 3 === 0) {
                        spawnPixelFx('impacts/hit-spark', {
                            pos: { x: tx, z: tz },
                            palette: JADE_PAL,
                            scale: 0.65 * kFx(),
                        });
                    }
                }
            });
        }, delayMs);
    }
}

/** Đại kiếm khổng lồ cuối cùng (yunyou_sword.webp cỡ đại) giáng thẳng xuống tâm + chấn động pixelfx */
export function spawnFinalGiantSword(x, z, { onImpact } = {}) {
    const tex = swordTex();
    const len = 6.4 * (0.78 + 0.22 * fxScale());
    const w = len * aspectOf(tex, 0.18);
    const m = artQuad(tex, w, len, { opacity: 0.98, renderOrder: 12 });
    m.rotation.z = Math.PI;   // mũi hướng xuống
    const startY = GROUND_Y + 9.4;
    const landY = GROUND_Y + len * 0.34;
    const dropDur = 0.24, totalDur = 1.05;
    let slammed = false;
    addAnim(m, totalDur, (p, fx) => {
        const age = p * totalDur;
        if (age <= dropDur) {
            const k = age / dropDur;
            const e = k * k * k;
            fx.mesh.position.set(x, startY + (landY - startY) * e, z + 0.6);
            fx.mesh.material.opacity = 0.98;
        } else {
            fx.mesh.position.set(x, landY, z + 0.6);
            const holdLeft = (age - dropDur) / (totalDur - dropDur);
            fx.mesh.material.opacity = holdLeft < 0.55 ? 0.98 : Math.max(0, 0.98 * (1 - (holdLeft - 0.55) / 0.45));
            if (!slammed) {
                slammed = true;
                onImpact?.();
                spawnPixelFx('impacts/ground-slam', { pos: { x, z }, palette: JADE_PAL, scale: 1.35 * kFx() });
                spawnPixelFx('impacts/crit-hit', { pos: { x, z }, palette: JADE_PAL, scale: 1.25 * kFx() });
            }
        }
    });
}

export function clearSwordFx() {
    for (const f of activeFans.values()) f.stopping = true;
    activeFans.clear();
    for (const f of activeFormations.values()) { f.stopping = true; f.layer?.stop(); }
    activeFormations.clear();
}
