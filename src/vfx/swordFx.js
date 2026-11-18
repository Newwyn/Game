// ============================================================
// HIỆU ỨNG KIẾM TIÊN — YunYou (swordsage)
//   Chỉ dùng tranh thật (yunyou_qi.webp, yunyou_swordfan.webp, yunyou_swordarray.webp, yunyou_sword.webp, yunyou_giantsword.webp)
//   và thư viện điểm ảnh pixelfx ở tỉ lệ chuẩn (JADE_PAL, không phóng khối pixel khổng lồ).
// ============================================================
import * as THREE from 'three';
import swordUrl from '../assets/sprites/yunyou_sword.webp';
import fanUrl from '../assets/sprites/yunyou_swordfan.webp';
import qiUrl from '../assets/sprites/yunyou_qi.webp';
import arrayUrl from '../assets/sprites/yunyou_swordarray.webp';
import giantSwordUrl from '../assets/sprites/yunyou_giantsword.webp';
import { getTexture } from '../core/textures.js';
import { scene } from '../core/scene.js';
import { cameraRig } from '../core/cameraRig.js';
import { GROUND_Y, gameNow, gameTimeout } from '../config.js';
import { fxScale } from '../core/settings.js';
import { addAnim, easeOut, glowTexture } from './vfx.js';
import { camTilt } from './flipbook.js';
import { spawnPixelFx } from './pixelFx.js';

export const JADE_PAL = ['#042f2e', '#115e59', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#e6fffb'];

const ARRAY_ANGLE = (40 * Math.PI) / 180;   // góc ~40° của thanh kiếm trong yunyou_swordarray.webp (hướng xuống-phải)

const activeFans = new Map();
const activeFormations = new Map();
const activeRainTimers = new Set();
const activeOneShots = new Set();
let rainGen = 0;

const keyOf = (id, idx) => `${id ?? 's'}:${idx ?? 0}`;
const swordTex = () => getTexture(swordUrl);
const fanTex = () => getTexture(fanUrl);
const qiTex = () => getTexture(qiUrl);
const arrayTex = () => getTexture(arrayUrl);
const giantSwordTex = () => getTexture(giantSwordUrl);

function aspectOf(tex, fallback) {
    const im = tex?.image;
    const w = im?.naturalWidth || im?.width, h = im?.naturalHeight || im?.height;
    return w && h ? w / h : fallback;
}

/** Tạo tấm phẳng hiển thị ảnh vẽ (sharedTexture: dùng chung bộ nhớ GPU) */
function artQuad(tex, w, h, { opacity = 1, additive = false, renderOrder = 6, color = 0xffffff, isVfx = true } = {}) {
    const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        fog: false,
        color,
        opacity,
        side: THREE.DoubleSide,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    mat.userData.isVfx = isVfx;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.userData.sharedTexture = true;
    m.renderOrder = renderOrder;
    return m;
}

/** Tỉ lệ quy đổi khi người dùng đổi mức hiệu ứng (full = 1 · soft = 0.58 · minimal = 0.32) */
const kFx = () => 0.65 + 0.35 * fxScale();

/** Vecto hướng chéo ~40° đi xuống về phía địch (`dirX`: +1 = sang phải, -1 = sang trái) */
function diagDir(dirX) {
    return {
        vx: dirX * Math.cos(ARRAY_ANGLE),
        vy: -Math.sin(ARRAY_ANGLE),
        slope: Math.cos(ARRAY_ANGLE) / Math.sin(ARRAY_ANGLE),
    };
}

/** Đặt trận đồ trên cao về phía YunYou (phía sau trung điểm giữa YunYou và cụm địch) */
function formationPlacement(x, z, radius = 8, casterView = null) {
    const hasCaster = !!casterView?.root;
    const cx = hasCaster ? casterView.position.x : (x - 9);
    const cz = hasCaster ? (casterView.position.z ?? 0) : z;
    const dxToTarget = x - cx;
    const dirX = Math.abs(dxToTarget) > 0.25 ? (dxToTarget >= 0 ? 1 : -1) : (casterView?.facingLeft ? -1 : 1);
    const sep = Math.abs(dxToTarget);
    const midX = (cx + x) * 0.5;
    const shiftBack = Math.min(2.4, Math.max(0.8, sep * 0.16));
    const idealX = midX - dirX * shiftBack;
    const horzFromTarget = Math.max(5.4, (x - idealX) * dirX);
    const arrX = x - dirX * horzFromTarget;
    const arrAboveGround = Math.min(5.8, Math.max(4.7, horzFromTarget * Math.tan(ARRAY_ANGLE)));
    const arrY = GROUND_Y + arrAboveGround;
    const arrZ = (cz + z) * 0.5 - 1.0;
    const arrW = Math.min(16, Math.max(10.5, radius * 1.65));
    return { dirX, arrX, arrY, arrZ, arrW };
}

/** Toạ độ thế giới trên mặt phẳng nhân vật đang nghiêng theo camera */
function tiltedOffsetPos(view, lx, ly, lz) {
    const tilt = camTilt();
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    return {
        x: view.position.x + lx,
        y: GROUND_Y + (view._hover ?? 0) + (view._lift ?? 0) + ly * ct - lz * st,
        z: (view.position.z ?? 0) + ly * st + lz * ct,
        tilt,
    };
}

// ------------------------------------------------------------
// 0. KIẾM KHÍ DƯỚI CHÂN KHI BAY (yunyou_qi.webp — gắn vào flip của CutoutCharacterView)
// ------------------------------------------------------------
/** Tạo dải kiếm khí ngọc nhạt dài ~1.6× chiều cao cơ thể dưới chân YunYou (tự nghiêng + lật theo view.flip) */
export function makeSwordFlightQi(height = 2.9) {
    const tex = qiTex();
    const fallbackAspect = 1160 / 300;
    const w = height * 1.6;
    const initH = w / fallbackAspect;
    const group = new THREE.Group();
    // Giữ isVfx = false (không bị fxLevel 'soft' làm mờ nhạt dải kiếm khí chính), dùng shared image texture
    const aura = artQuad(tex, w * 1.06, initH * 1.18, {
        opacity: 0, additive: true, renderOrder: 1, color: 0x99f6e4, isVfx: false,
    });
    aura.position.z = -0.02;
    const core = artQuad(tex, w, initH, {
        opacity: 0, additive: false, renderOrder: 2, isVfx: false,
    });
    group.add(aura, core);
    group.position.set(0, -0.04, -0.05);
    group.visible = false;

    return {
        group,
        update(_dt, { k = 0, time = 0, opacity = 1 } = {}) {
            group.visible = k > 0.01 && opacity > 0.01;
            if (!group.visible) return;
            const aspectScaleY = fallbackAspect / aspectOf(tex, fallbackAspect);
            const pulse = 0.88 + 0.12 * Math.sin(time * 4.2);
            const s = 0.96 + 0.04 * k + 0.02 * Math.sin(time * 3.1);
            group.position.y = -0.04 + Math.sin(time * 2.5) * 0.015 * k;
            group.scale.set(s, s * aspectScaleY, 1);
            core.material.opacity = 0.92 * k * pulse * opacity;
            aura.material.opacity = 0.28 * k * pulse * opacity;
        },
    };
}

// ------------------------------------------------------------
// 1. ĐÁNH THƯỜNG: kiếm khí / linh kiếm ngọc nhạt bay tới mục tiêu
// ------------------------------------------------------------
export function spawnSwordAutoProjectile(from, to, { duration = 0.24, length = 1.65, crit = false, targetView = null, onHit } = {}) {
    const tex = swordTex();
    const h = length * kFx();
    const w = h * aspectOf(tex, 0.18);
    const m = artQuad(tex, w, h, { opacity: 0.96, additive: true, renderOrder: 8 });
    const dx = to.x - from.x, dy = to.y - from.y, dz = (to.z ?? 0) - (from.z ?? 0);
    // ảnh yunyou_sword.webp mũi kiếm hướng LÊN (+Y) -> trừ PI/2 để mũi kiếm hướng về mục tiêu
    m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
    let hit = false;
    addAnim(m, duration, (p, fx) => {
        const s = 0.9 + 0.15 * Math.sin(p * Math.PI);
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.position.set(from.x + dx * p, from.y + dy * p, (from.z ?? 0) + dz * p + 0.45);
        fx.mesh.material.opacity = (p > 0.85 ? (1 - p) / 0.15 : 1) * 0.96;
        if (p >= 1 && !hit) {
            hit = true;
            onHit?.();
            const estLift = Math.max(0, to.y - GROUND_Y - 1.3);
            spawnPixelFx(crit ? 'impacts/crit-hit' : 'impacts/hit-spark', {
                ...(targetView ? { view: targetView, follow: false } : { lift: estLift }),
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
        view: casterView,
        follow: false,
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
/** Quạt kiếm lớn đứng SAU LƯNG YunYou (~2.2× chiều cao), nghiêng song song nhân vật ở cả 2 góc camera */
export function spawnSwordFan(casterId, casterIdx, casterView, durationMs = 8000) {
    if (!casterView) return;
    const key = keyOf(casterId, casterIdx);
    const prev = activeFans.get(key);
    if (prev) { prev.stopping = true; activeFans.delete(key); }

    const tex = fanTex();
    const H = casterView.height ?? 2.9;
    const w = H * 2.2;
    const fallbackAspect = 1.33;
    const h = w / fallbackAspect;
    const group = new THREE.Group();
    const mesh = artQuad(tex, w, h, { opacity: 0, additive: false, renderOrder: 2 });
    const flashMesh = artQuad(tex, w * 1.04, h * 1.04, { opacity: 0, additive: true, renderOrder: 3, color: 0x99f6e4 });
    flashMesh.position.z = 0.01;
    group.add(mesh, flashMesh);

    const entry = {
        group,
        mesh,
        flashMesh,
        flash: 0.7,
        stopping: false,
        fadeOut: 1,
        endAt: gameNow() + durationMs,
    };
    activeFans.set(key, entry);

    const maxSec = durationMs / 1000 + 2;
    addAnim(group, maxSec, (_p, fx, dt = 0.016) => {
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
        const pos = tiltedOffsetPos(casterView, -dir * 0.14, H * 0.56, -0.34);
        fx.mesh.position.set(pos.x, pos.y, pos.z);
        fx.mesh.rotation.x = pos.tilt;

        const aspectScaleY = fallbackAspect / aspectOf(tex, fallbackAspect);
        const sway = Math.sin(fx.age * 2.1) * 0.048;
        const s = (0.92 + 0.08 * easeOut(fadeIn) + 0.025 * Math.sin(fx.age * 2.8)) * (1 + 0.09 * entry.flash);
        mesh.rotation.z = sway;
        flashMesh.rotation.z = sway;
        mesh.scale.set(dir * s, s * aspectScaleY, 1);
        flashMesh.scale.set(dir * s, s * aspectScaleY, 1);

        const viewAlpha = casterView.opacity ?? 1;
        mesh.material.opacity = (0.76 + 0.24 * entry.flash) * fadeIn * entry.fadeOut * viewAlpha;
        flashMesh.material.opacity = entry.flash * 0.85 * fadeIn * entry.fadeOut * viewAlpha;
    });
}

export function flashSwordFan(casterId, casterIdx) {
    const entry = activeFans.get(keyOf(casterId, casterIdx));
    if (entry) entry.flash = 1.0;
}

/** Vị trí từng thanh kiếm trên quạt nghiêng phía sau lưng YunYou */
function fanSlotPoint(casterView, k, n) {
    const H = casterView.height ?? 2.9;
    const frac = n <= 1 ? 0 : (k / (n - 1)) * 2 - 1;   // -1 .. 1
    const angle = frac * 1.05;
    const rad = H * 0.82;
    const dir = casterView.facingLeft ? -1 : 1;
    const lx = -dir * 0.14 + Math.sin(angle) * rad * 0.88;
    const ly = H * 0.56 + Math.cos(angle) * rad * 0.65;
    return tiltedOffsetPos(casterView, lx, ly, -0.22);
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
        const m = artQuad(tex, w, h, { opacity: 0.96, additive: true, renderOrder: 8 });
        let done = false;
        addAnim(m, duration, (p, fx) => {
            const toX = targetView.position.x;
            const toY = GROUND_Y + (targetView._hover ?? 0) + (targetView._lift ?? 0) + (targetView.sprite?.lift ?? 0) + (targetView.height ?? 2.6) * 0.5;
            const toZ = targetView.position.z ?? 0;
            const dx = toX - from.x, dy = toY - from.y, dz = toZ - from.z;
            fx.mesh.position.set(from.x + dx * p, from.y + dy * p, from.z + dz * p + 0.35);
            fx.mesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
            fx.mesh.material.opacity = (p < 0.12 ? p / 0.12 : p > 0.85 ? (1 - p) / 0.15 : 1) * 0.96;
            if (p >= 1 && !done) {
                done = true;
                onImpact?.(targetView, eff);
                if (!eff?.isMiss) {
                    spawnPixelFx(eff?.isCrit ? 'impacts/crit-hit' : 'impacts/hit-spark', {
                        view: targetView,
                        follow: false,
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
// 4. KỸ NĂNG 3 — TRẬN ĐỒ KIẾM: yunyou_swordarray.webp trên trời + mưa kiếm chéo + đại kiếm cuối
// ------------------------------------------------------------
/**
 * Trận đồ kiếm trên bầu trời phía bên YunYou (yunyou_swordarray.webp, ~40 kiếm chéo ~40° hướng xuống phía địch).
 * Trôi nhẹ trên không với quầng sáng ngọc nhạt nhấp nháy, lật ngang nếu địch ở bên trái YunYou.
 */
export function spawnSkyFormation(casterId, casterIdx, x, z, { radius = 8, duration = 7.5, castTime = 2000, casterView = null } = {}) {
    const key = keyOf(casterId, casterIdx);
    const old = activeFormations.get(key);
    if (old && !old.stopping && Math.hypot(old.x - x, old.z - z) < 0.25) {
        old.endAt = Math.max(old.endAt, gameNow() + duration * 1000);
        if (casterView) old.casterView = casterView;
        return;
    }
    if (old) old.stopping = true;

    const tex = arrayTex();
    const fallbackAspect = 1536 / 1024;
    const { dirX, arrX, arrY, arrZ, arrW } = formationPlacement(x, z, radius, casterView);
    const initH = arrW / fallbackAspect;

    const group = new THREE.Group();
    const halo = artQuad(glowTexture(), arrW * 0.92, initH * 0.85, { opacity: 0, additive: true, renderOrder: 4, color: 0x5eead4 });
    halo.position.z = -0.05;
    const mesh = artQuad(tex, arrW, initH, { opacity: 0, additive: false, renderOrder: 5 });
    const flashMesh = artQuad(tex, arrW * 1.02, initH * 1.02, { opacity: 0, additive: true, renderOrder: 6, color: 0xccfbf1 });
    flashMesh.position.z = 0.03;
    group.add(halo, mesh, flashMesh);

    const entry = {
        group,
        halo,
        mesh,
        flashMesh,
        dirX,
        arrX,
        arrY,
        arrZ,
        arrW,
        arrH: initH,
        x,
        z,
        radius,
        casterView,
        flash: 0,
        stopping: false,
        fadeOut: 1,
        rainAt: gameNow() + castTime,
        endAt: gameNow() + duration * 1000,
    };
    activeFormations.set(key, entry);

    addAnim(group, Math.max(duration + 6, 15), (_p, fx, dt = 0.016) => {
        const castDead = !!entry.casterView?.member && !entry.casterView.member.alive && gameNow() < entry.rainAt;
        if (entry.stopping || gameNow() >= entry.endAt || castDead) {
            entry.fadeOut = Math.max(0, entry.fadeOut - dt * 2.2);
            if (entry.fadeOut <= 0.01) {
                if (activeFormations.get(key) === entry) activeFormations.delete(key);
                fx.life = fx.age;
                return;
            }
        }
        entry.flash = Math.max(0, entry.flash - dt * 4.5);
        const fadeIn = Math.min(1, fx.age / 0.55);
        const driftX = Math.sin(fx.age * 0.75) * 0.22;
        const driftY = Math.sin(fx.age * 1.25) * 0.14;
        group.position.set(entry.arrX + driftX, entry.arrY + driftY, entry.arrZ);
        group.rotation.x = camTilt();

        const curAspect = aspectOf(tex, fallbackAspect);
        const aspectScaleY = fallbackAspect / curAspect;
        entry.arrH = entry.arrW / curAspect;
        const ps = 1 + 0.018 * Math.sin(fx.age * 2.1) + 0.045 * entry.flash;
        mesh.scale.set(dirX * ps, ps * aspectScaleY, 1);
        flashMesh.scale.set(dirX * ps, ps * aspectScaleY, 1);

        const vis = fadeIn * entry.fadeOut;
        const glowPulse = 0.75 + 0.25 * Math.sin(fx.age * 3.4);
        mesh.material.opacity = Math.min(1, 0.92 + 0.08 * entry.flash) * vis;
        halo.material.opacity = (0.34 * glowPulse + 0.4 * entry.flash) * vis;
        flashMesh.material.opacity = entry.flash * 0.85 * vis;
    });
}

export function endSkyFormation(casterId, casterIdx) {
    const entry = activeFormations.get(keyOf(casterId, casterIdx));
    if (entry) entry.stopping = true;
}

function findFormation(casterId, casterIdx, x, z) {
    if (casterId != null && casterIdx != null) {
        const hit = activeFormations.get(keyOf(casterId, casterIdx));
        if (hit) return hit;
    }
    for (const f of activeFormations.values()) {
        if (Math.hypot(f.x - x, f.z - z) < 4) return f;
    }
    return null;
}

/** Mưa kiếm: 10–14 thanh yunyou_sword.webp lao từ trận đồ theo đúng góc chéo ~40° xuống vùng mục tiêu */
export function spawnSwordRainTick(x, z, radiusOrOpts = 8) {
    const opts = typeof radiusOrOpts === 'object' ? (radiusOrOpts ?? {}) : { radius: radiusOrOpts };
    const radius = opts.radius ?? 8;
    const entry = findFormation(opts.casterId, opts.casterIdx, x, z);
    if (entry) entry.flash = 1.0;

    const place = entry ?? formationPlacement(x, z, radius, opts.casterView);
    const dirX = place.dirX;
    const arrX = place.arrX, arrY = place.arrY, arrZ = place.arrZ, arrW = place.arrW;
    const arrH = entry?.arrH ?? (arrW / (1536 / 1024));
    const { vx, vy, slope } = diagDir(dirX);
    const baseRotZ = Math.atan2(vy, vx) - Math.PI / 2;   // yunyou_sword mũi hướng +Y -> trừ PI/2 để mũi lao tới trước

    const count = 10 + Math.floor(Math.random() * 5);   // 10–14 thanh mỗi nhịp
    const tex = swordTex();
    const rSpread = Math.min(7.2, Math.max(3.0, radius * 0.82));
    const gen = rainGen;

    for (let i = 0; i < count; i++) {
        const delayMs = i * 26 + Math.random() * 22;
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * rSpread;
        const txBase = x + Math.cos(ang) * dist;
        const tz = z + Math.sin(ang) * dist * 0.55;
        const endY = GROUND_Y + 0.14 + Math.random() * 0.2;

        // Xuất phát từ trong trận đồ đang lơ lửng và lao đúng theo góc chéo ~40°
        const startY = arrY + (Math.random() - 0.5) * arrH * 0.42;
        const dropH = Math.max(2.5, startY - endY);
        const idealSx = txBase - dirX * dropH * slope;
        const halfSpan = arrW * 0.38;
        const sx = Math.max(arrX - halfSpan, Math.min(arrX + halfSpan, idealSx));
        const lx = sx + dirX * dropH * slope;
        const startZ = arrZ + (tz - arrZ) * 0.25;

        const len = 1.65 + Math.random() * 0.45;
        const w = len * aspectOf(tex, 0.18);

        const timer = gameTimeout(() => {
            activeRainTimers.delete(timer);
            if (!scene || gen !== rainGen || entry?.stopping) return;
            const m = artQuad(tex, w, len, { opacity: 0.96, additive: false, renderOrder: 7 });
            m.scale.x = dirX;
            m.rotation.z = baseRotZ;
            const dur = 0.21 + Math.random() * 0.06;
            const totalDur = dur + 0.15;
            const shot = { stopping: false };
            activeOneShots.add(shot);
            let sparked = false;
            addAnim(m, totalDur, (_p, fx) => {
                if (shot.stopping) {
                    activeOneShots.delete(shot);
                    fx.life = fx.age;
                    return;
                }
                const k = Math.min(1, fx.age / dur);
                const e = k * k;
                fx.mesh.position.set(sx + (lx - sx) * e, startY + (endY - startY) * e, startZ + (tz - startZ) * e + 0.35);
                fx.mesh.material.opacity = k < 1 ? 0.96 : Math.max(0, 0.96 * (1 - (fx.age - dur) / 0.15));
                if (k >= 1 && !sparked) {
                    sparked = true;
                    spawnPixelFx('impacts/hit-spark', {
                        pos: { x: lx, z: tz },
                        flip: dirX < 0,
                        palette: JADE_PAL,
                        scale: (0.50 + Math.random() * 0.12) * kFx(),
                    });
                }
                if (fx.age >= totalDur) activeOneShots.delete(shot);
            });
        }, delayMs);
        activeRainTimers.add(timer);
    }
}

/** Đại kiếm khổng lồ cuối cùng (yunyou_giantsword.webp ~3× chiều cao tướng) lao chéo cắm tâm trận, rung màn hình rồi tan */
export function spawnFinalGiantSword(x, z, opts = {}) {
    const { onImpact, radius = 8, casterId = null, casterIdx = null, casterView = null } = opts;
    const entry = findFormation(casterId, casterIdx, x, z);
    const place = entry ?? formationPlacement(x, z, radius, casterView);
    if (entry) entry.stopping = true;

    const dirX = place.dirX;
    const { vx, vy } = diagDir(dirX);
    const tex = giantSwordTex();
    const fallbackAspect = 1024 / 1536;
    const len = 3.0 * (casterView?.height ?? 2.9);   // ~3× chiều cao nhân vật
    const initW = len * fallbackAspect;

    const group = new THREE.Group();
    const mesh = artQuad(tex, initW, len, { opacity: 0, additive: false, renderOrder: 12 });
    const glowMesh = artQuad(tex, initW * 1.05, len * 1.03, { opacity: 0, additive: true, renderOrder: 13, color: 0x99f6e4 });
    glowMesh.position.z = 0.02;
    group.add(mesh, glowMesh);
    // yunyou_giantsword.webp mũi hướng XUỐNG (-Y) -> cộng PI/2 để mũi hướng theo (vx, vy)
    group.rotation.z = Math.atan2(vy, vx) + Math.PI / 2;

    const tipOffset = len * 0.40;
    const landX = x - vx * tipOffset;
    const landY = GROUND_Y - vy * tipOffset;
    const plungeDist = 7.2;
    const startX = landX - vx * plungeDist;
    const startY = landY - vy * plungeDist;
    const landZ = z + 0.55;
    const startZ = (place.arrZ + landZ) * 0.5;

    const appearDur = 0.14;
    const dropDur = 0.20;
    const stickDur = 0.42;
    const fadeDur = 0.36;
    const totalDur = appearDur + dropDur + stickDur + fadeDur;

    const shot = { stopping: false };
    activeOneShots.add(shot);
    let slammed = false;

    addAnim(group, totalDur, (_p, fx) => {
        if (shot.stopping) {
            activeOneShots.delete(shot);
            fx.life = fx.age;
            return;
        }
        const aspectScaleX = aspectOf(tex, fallbackAspect) / fallbackAspect;
        mesh.scale.set(dirX * aspectScaleX, 1, 1);
        glowMesh.scale.set(dirX * aspectScaleX, 1, 1);

        const age = fx.age;
        if (age < appearDur) {
            const k = easeOut(age / appearDur);
            fx.mesh.position.set(startX - vx * 0.4 * (1 - k), startY - vy * 0.4 * (1 - k), startZ);
            mesh.material.opacity = k;
            glowMesh.material.opacity = 0.45 * k;
        } else if (age < appearDur + dropDur) {
            const k = (age - appearDur) / dropDur;
            const e = k * k * k;
            fx.mesh.position.set(
                startX + (landX - startX) * e,
                startY + (landY - startY) * e,
                startZ + (landZ - startZ) * e,
            );
            mesh.material.opacity = 1;
            glowMesh.material.opacity = 0.42;
        } else {
            fx.mesh.position.set(landX, landY, landZ);
            const after = age - appearDur - dropDur;
            if (!slammed) {
                slammed = true;
                onImpact?.();
                cameraRig.shake(0.30, 280);
                // Rải nhiều cụm pixelfx cỡ chuẩn quanh điểm giáng (tránh phóng 1 khối điểm ảnh quá lớn)
                spawnPixelFx('impacts/ground-slam', { pos: { x, z }, flip: dirX < 0, palette: JADE_PAL, scale: 1.05 * kFx() });
                spawnPixelFx('impacts/crit-hit', { pos: { x, z }, flip: dirX < 0, palette: JADE_PAL, scale: 1.0 * kFx() });
                spawnPixelFx('impacts/hit-spark', { pos: { x: x - dirX * 1.1, z: z - 0.3 }, flip: dirX < 0, palette: JADE_PAL, scale: 0.8 * kFx() });
                spawnPixelFx('impacts/hit-spark', { pos: { x: x + dirX * 1.1, z: z + 0.3 }, flip: dirX < 0, palette: JADE_PAL, scale: 0.8 * kFx() });
            }
            const glowFade = Math.max(0, 1 - after / 0.25);
            const vis = after <= stickDur ? 1 : Math.max(0, 1 - (after - stickDur) / fadeDur);
            mesh.material.opacity = vis;
            glowMesh.material.opacity = 0.55 * glowFade * vis;
        }
        if (age >= totalDur) activeOneShots.delete(shot);
    });
}

export function clearSwordFx() {
    rainGen++;
    for (const id of activeRainTimers) clearTimeout(id);
    activeRainTimers.clear();
    for (const f of activeFans.values()) f.stopping = true;
    activeFans.clear();
    for (const f of activeFormations.values()) f.stopping = true;
    activeFormations.clear();
    for (const s of activeOneShots) s.stopping = true;
    activeOneShots.clear();
}
