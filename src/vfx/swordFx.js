// ============================================================
// HIỆU ỨNG KIẾM TIÊN — YunYou (swordsage)
//   Chỉ dùng tranh thật (yunyou_qi.webp, yunyou_spiritsword.webp, yunyou_swordbolt.webp,
//   yunyou_sword.webp, yunyou_formation.webp, yunyou_giantsword.webp)
//   và thư viện điểm ảnh pixelfx ở tỉ lệ chuẩn (JADE_PAL, không phóng khối pixel khổng lồ).
// ============================================================
import * as THREE from 'three';
import swordUrl from '../assets/sprites/yunyou_sword.webp';
import spiritSwordUrl from '../assets/sprites/yunyou_spiritsword.webp';
import swordBoltUrl from '../assets/sprites/yunyou_swordbolt.webp';
import qiUrl from '../assets/sprites/yunyou_qi.webp';
import formationUrl from '../assets/sprites/yunyou_formation.webp';
import giantSwordUrl from '../assets/sprites/yunyou_giantsword.webp';
import { getTexture } from '../core/textures.js';
import { cameraRig } from '../core/cameraRig.js';
import { GROUND_Y, gameNow } from '../config.js';
import { fxScale } from '../core/settings.js';
import { addAnim, easeOut, glowTexture } from './vfx.js';
import { camTilt } from './flipbook.js';
import { spawnPixelFx, pixelLayer, pixelMod } from './pixelFx.js';

export const JADE_PAL = ['#042f2e', '#115e59', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#e6fffb'];
const PALE_JADE_PAL = ['#115e59', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1', '#ffffff'];

const TAU = Math.PI * 2;
const FAN_COUNT = 7;
const ORBIT_SWORDS = 8;
const RIM_FX_COUNT = 6;

/** Độ cao bay CỐ ĐỊNH theo chế độ camera — không phụ thuộc zoom hay vị trí camera */
export const SWORD_FLIGHT_HEIGHT = {
    explore: 6.6, // Ở zoom mặc định (baseDist=15, pitch=48°), đỉnh mũ (~ndc 0.87) vừa dưới mép trên khung hình
    combat: 5.6,  // Ở góc ngang (pitch=14°, minDist=13), giữ trọn mũ & thanh máu
};

export function swordFlightHeight(mode = cameraRig.getMode()) {
    return SWORD_FLIGHT_HEIGHT[mode] ?? SWORD_FLIGHT_HEIGHT.explore;
}

const activeFans = new Map();
const activeFormations = new Map();
const activeGiantSwords = new Map();
const activeOneShots = new Set();

const keyOf = (id, idx) => `${id ?? 's'}:${idx ?? 0}`;
const swordTex = () => getTexture(swordUrl);
const spiritSwordTex = () => getTexture(spiritSwordUrl);
const swordBoltTex = () => getTexture(swordBoltUrl);
const qiTex = () => getTexture(qiUrl);
const formationTex = () => getTexture(formationUrl);
const giantSwordTex = () => getTexture(giantSwordUrl);

const _zAxis = new THREE.Vector3(0, 0, 1);

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
// 1. ĐÁNH THƯỜNG (không bật KN2): kiếm khí / linh kiếm ngọc nhạt bay tới mục tiêu
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
// 3. KỸ NĂNG 2 — VẠN KIẾM ĐỒNG QUY: quạt 7 thanh yunyou_spiritsword.webp sau lưng + tia kiếm yunyou_swordbolt.webp
// ------------------------------------------------------------
/** Kiểm tra YunYou có quạt KN2 đang hoạt động hay không */
export function hasSwordFan(casterId, casterIdx) {
    const f = activeFans.get(keyOf(casterId, casterIdx));
    return !!(f && !f.exiting && !f.stopping);
}

/** Quạt 7 thanh linh kiếm (yunyou_spiritsword.webp, ~2.2× chiều cao tổng ngang) sau lưng YunYou */
export function spawnSwordFan(casterId, casterIdx, casterView, durationMs = 8000) {
    if (!casterView) return;
    const key = keyOf(casterId, casterIdx);
    const prev = activeFans.get(key);
    if (prev) { prev.stopping = true; activeFans.delete(key); }

    const tex = spiritSwordTex();
    const fallbackAspect = 246 / 1486;
    const H = casterView.height ?? 2.9;
    const group = new THREE.Group();

    const slots = [];
    const maxSpreadRad = (72 * Math.PI) / 180;
    for (let i = 0; i < FAN_COUNT; i++) {
        const u = (i - (FAN_COUNT - 1) / 2) / ((FAN_COUNT - 1) / 2); // -1 .. +1
        const theta = -u * maxSpreadRad;
        // Khoảng bung rộng hình elip để tổng bề ngang ~2.2×H mà lưỡi giữa không chọc khỏi mép trên khung hình
        const dirX = -Math.sin(theta), dirY = Math.cos(theta);
        const targetX = dirX * (H * 0.69);
        const targetY = dirY * (H * 0.25);
        const baseRotZ = Math.atan2(-targetX, targetY);
        const ax = -Math.sin(baseRotZ), ay = Math.cos(baseRotZ);
        const baseDist = Math.hypot(targetX, targetY);
        const bladeLen = H * (1.0 - 0.06 * Math.abs(u));
        const bladeW = bladeLen * fallbackAspect;

        const holder = new THREE.Group();
        holder.position.set(ax * baseDist, ay * baseDist, -Math.abs(u) * 0.03);
        holder.rotation.z = baseRotZ;

        const mesh = artQuad(tex, bladeW, bladeLen, { opacity: 0, additive: false, renderOrder: 2 });
        const glow = artQuad(tex, bladeW * 1.45, bladeLen * 1.06, { opacity: 0, additive: true, renderOrder: 3, color: 0x5eead4 });
        glow.position.z = 0.01;
        const glint = artQuad(glowTexture(), bladeW * 3.4, bladeLen * 0.35, { opacity: 0, additive: true, renderOrder: 4, color: 0xe6fffb });
        glint.position.set(0, bladeLen * 0.22, 0.02);

        holder.add(mesh, glow, glint);
        group.add(holder);

        slots.push({
            i,
            u,
            holder,
            mesh,
            glow,
            glint,
            ax,
            ay,
            baseDist,
            baseRotZ,
            delayIn: i * 0.072,                          // xuất hiện lần lượt 72 ms mỗi thanh
            delayOut: (FAN_COUNT - 1 - i) * 0.050,       // thu vào theo thứ tự ngược lại
            phase: i * 1.37 + Math.random() * 0.5,
            bobFreq: 2.2 + (i % 3) * 0.34,
            swayFreq: 1.6 + ((i * 7) % 4) * 0.24,
        });
    }

    const entry = {
        group,
        slots,
        flash: 0.5,
        lastFlashAt: -1e9,
        stopping: false,
        exiting: false,
        exitAge: 0,
        endAt: gameNow() + durationMs,
        /** Lấy toạ độ thế giới ở đầu/giữa thân thanh kiếm thứ `slotIdx` để bắn kiếm phụ */
        slotWorldPoint(slotIdx = 3) {
            const sl = slots[slotIdx] ?? slots[3];
            if (!sl || !group.parent) return tiltedOffsetPos(casterView, -0.2, H * 0.55, -0.2);
            group.updateMatrixWorld(true);
            const v = new THREE.Vector3(0, H * 0.18, 0.05);
            sl.holder.localToWorld(v);
            return { x: v.x, y: v.y, z: v.z };
        },
    };
    activeFans.set(key, entry);

    const appearDur = 0.24;
    const foldDur = 0.26;
    const totalFoldSec = (FAN_COUNT - 1) * 0.050 + foldDur + 0.08;
    const maxSec = durationMs / 1000 + totalFoldSec + 2;

    addAnim(group, maxSec, (_p, fx, dt = 0.016) => {
        const m = casterView.member;
        const alive = !!m?.alive && !!casterView.root?.parent;
        const hasBuff = !!m?.statusEffects?.some(e => e.type === 'sword_multi' && e.endTime > gameNow());
        const expired = gameNow() >= entry.endAt && !hasBuff;
        if (!entry.exiting && (entry.stopping || !alive || expired || fx.age > durationMs / 1000)) {
            entry.exiting = true;
            entry.exitAge = 0;
        }
        if (entry.exiting) {
            entry.exitAge += dt;
            if (entry.exitAge >= totalFoldSec) {
                if (activeFans.get(key) === entry) activeFans.delete(key);
                fx.life = fx.age;
                return;
            }
        }

        entry.flash = Math.max(0, entry.flash - dt * 4.2);
        const dir = casterView.facingLeft ? -1 : 1;
        const pCenter = tiltedOffsetPos(casterView, -dir * 0.16, H * 0.36, -0.36);
        group.position.set(pCenter.x, pCenter.y, pCenter.z);
        group.rotation.x = pCenter.tilt;
        group.scale.set(dir, 1, 1);

        const aspectScaleX = aspectOf(tex, fallbackAspect) / fallbackAspect;
        for (const sl of slots) {
            let slide = 1, sc = 1, op = 0.94, rot = sl.baseRotZ, glintOp = 0;

            if (entry.exiting) {
                const tOut = Math.max(0, Math.min(1, (entry.exitAge - sl.delayOut) / foldDur));
                const f = tOut * tOut;
                slide = 1 - 0.85 * f;
                sc = 1 - 0.65 * f;
                op = 0.94 * (1 - f);
                rot = sl.baseRotZ * (1 - 0.42 * f);
            } else {
                const rawIn = (fx.age - sl.delayIn) / appearDur;
                if (rawIn <= 0) {
                    sl.holder.visible = false;
                    continue;
                }
                if (rawIn < 1) {
                    const eIn = easeOut(rawIn);
                    slide = 0.15 + 0.85 * eIn;
                    sc = 0.32 + 0.68 * eIn;
                    op = 0.94 * Math.min(1, rawIn * 1.4);
                    glintOp = Math.sin(rawIn * Math.PI) * 0.9;
                } else {
                    const bob = Math.sin(fx.age * sl.bobFreq + sl.phase) * 0.065;
                    const sway = Math.sin(fx.age * sl.swayFreq + sl.phase * 1.3) * 0.036;
                    slide = 1 + (bob + 0.22 * entry.flash) / Math.max(0.4, sl.baseDist);
                    rot = sl.baseRotZ + sway;
                    sc = 1 + 0.06 * entry.flash;
                }
            }

            sl.holder.visible = op > 0.01;
            if (!sl.holder.visible) continue;
            const d = sl.baseDist * slide;
            sl.holder.position.x = sl.ax * d;
            sl.holder.position.y = sl.ay * d;
            sl.holder.rotation.z = rot;
            sl.holder.scale.set(sc, sc, 1);
            sl.mesh.scale.set(aspectScaleX, 1, 1);
            sl.glow.scale.set(aspectScaleX * (1 + 0.1 * entry.flash), 1, 1);
            sl.mesh.material.opacity = op;
            sl.glow.material.opacity = op * (0.20 + 0.10 * Math.sin(fx.age * 3.5 + sl.phase) + 0.65 * entry.flash);
            sl.glint.material.opacity = glintOp;
            sl.glint.scale.setScalar(0.7 + 0.5 * glintOp);
        }
    });
}

/** Loé xung lực 7 thanh kiếm sau lưng khi YunYou tung đòn đánh thường lúc KN2 đang bật */
export function flashSwordFan(casterId, casterIdx) {
    const entry = activeFans.get(keyOf(casterId, casterIdx));
    if (!entry || entry.exiting || entry.stopping) return;
    const now = gameNow();
    if (now - entry.lastFlashAt < 75) return;   // tránh rung 2 lần cho cùng 1 đòn đánh (autoAttack + extraSwords)
    entry.lastFlashAt = now;
    entry.flash = 1.0;
}

/** Phóng tia kiếm yunyou_swordbolt.webp (~1.4× chiều cao tướng, bay nhanh) từ quạt 7 kiếm tới TỪNG kẻ địch bị trúng kiếm phụ */
export function spawnExtraSwords(casterId, casterIdx, casterView, items, { duration = 0.19, onImpact } = {}) {
    if (!items?.length) return;
    flashSwordFan(casterId, casterIdx);

    const tex = swordBoltTex();
    const fallbackAspect = 1478 / 233;
    const H = casterView?.height ?? 2.9;
    const len = 1.4 * H * kFx();
    const h = len / fallbackAspect;
    const entry = activeFans.get(keyOf(casterId, casterIdx));
    const slotOrder = [3, 2, 4, 1, 5, 0, 6];

    items.forEach((it, idx) => {
        const tv = it.targetView;
        if (!tv) return;
        const fallbackFrom = casterView
            ? tiltedOffsetPos(casterView, (casterView.facingLeft ? 1 : -1) * 0.25, H * 0.56, -0.25)
            : { x: tv.position.x - 5, y: 2.5, z: tv.position.z ?? 0 };
        const from = entry ? entry.slotWorldPoint(slotOrder[idx % slotOrder.length]) : fallbackFrom;
        const to = {
            x: tv.position.x,
            y: GROUND_Y + (tv._hover ?? 0) + (tv._lift ?? 0) + (tv.sprite?.lift ?? 0) + (tv.height ?? 2.6) * 0.48,
            z: tv.position.z ?? 0,
        };
        const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
        const dist2 = Math.hypot(dx, dy) || 1;
        const ux = dx / dist2, uy = dy / dist2;

        // yunyou_swordbolt.webp nằm ngang, mũi hướng PHẢI (+X), đuôi sao băng bên TRÁI (-X).
        // Xoay nhóm theo atan2(dy, dx) để mũi luôn chĩa thẳng mục tiêu; nếu bay sang trái (dx < 0) lật Y = -1 để không bị lộn ngược.
        const m = artQuad(tex, len, h, { opacity: 0.98, additive: false, renderOrder: 9 });
        const flipY = dx < 0 ? -1 : 1;

        const glow = artQuad(tex, len * 1.05, h * 1.15, { opacity: 0.45, additive: true, renderOrder: 10, color: 0x99f6e4 });
        glow.position.z = 0.01;
        const bolt = new THREE.Group();
        bolt.add(m, glow);
        bolt.rotation.z = Math.atan2(dy, dx);
        bolt.scale.y = flipY;

        let hit = false;
        const leadBack = len * 0.34;
        addAnim(bolt, duration + 0.08, (_p, fx) => {
            const p = Math.min(1, fx.age / duration);
            const e = p * (0.7 + 0.3 * p);
            const aspectScaleY = fallbackAspect / aspectOf(tex, fallbackAspect);
            m.scale.set(1, aspectScaleY, 1);
            glow.scale.set(1, aspectScaleY, 1);

            const px = from.x + dx * e - ux * leadBack * e;
            const py = from.y + dy * e - uy * leadBack * e;
            const pz = from.z + dz * e + 0.45;
            fx.mesh.position.set(px, py, pz);
            const tailFade = fx.age > duration ? Math.max(0, 1 - (fx.age - duration) / 0.08) : 1;
            const inFade = Math.min(1, p * 5 + 0.25);
            m.material.opacity = 0.98 * inFade * tailFade;
            glow.material.opacity = 0.48 * inFade * tailFade;

            if (p >= 1 && !hit) {
                hit = true;
                onImpact?.(tv, it.eff);
                if (tv.flashHit) tv.flashHit();
                const crit = !!it.eff?.isCrit;
                spawnPixelFx('impacts/hit-spark', {
                    view: tv,
                    follow: false,
                    pos: tv.position,
                    flip: dx < 0,
                    palette: JADE_PAL,
                    scale: (crit ? 1.0 : 0.72) * kFx(),
                });
            }
        });
    });
}

// ------------------------------------------------------------
// 4. KỸ NĂNG 3 — TRẬN ĐỒ KIẾM: vòng trận quay nghiêng trên không -> mưa kiếm liên tục -> đại kiếm bay chậm 1.2s nổ lớn
// ------------------------------------------------------------
function spawnGiantImpactExplosion(x, z, dirX) {
    const scaleBase = kFx();
    spawnPixelFx('explosions/big-explosion', { pos: { x, z }, flip: dirX < 0, palette: JADE_PAL, scale: 0.95 * scaleBase, seed: 11 });
    spawnPixelFx('impacts/ground-slam', { pos: { x, z }, flip: dirX < 0, palette: JADE_PAL, scale: 0.90 * scaleBase });
    spawnPixelFx('impacts/crit-hit', { pos: { x, z }, flip: dirX < 0, palette: JADE_PAL, scale: 1.0 * scaleBase });
    const ringOffsets = [
        [-dirX * 1.8, -0.7, 0.04, 0.80, 21],
        [dirX * 1.9, 0.75, 0.08, 0.78, 37],
        [0, -1.5, 0.12, 0.72, 53],
    ];
    for (const [ox, oz, delay, sc, seed] of ringOffsets) {
        spawnPixelFx('explosions/big-explosion', {
            pos: { x: x + ox, z: z + oz },
            flip: ox < 0,
            palette: JADE_PAL,
            scale: sc * scaleBase,
            delay,
            seed,
        });
    }
    cameraRig.shake(0.38, 340);
}

const _rimVec = new THREE.Vector3();

/** Loé sáng nhanh + sóng xung kích vòng tròn bằng pixelfx ở tỉ lệ pixel chuẩn (tại tâm vòng trận) */
function spawnRingPulseBurst(x, y, z, tiltQuat, seedBase = 17) {
    const scale = 0.92 * kFx();
    const u = (2.9 / 44) * scale;

    const burstLayer = pixelLayer(pixelMod('arcane/mana-burst'), {
        height: 2.9,
        scale,
        palette: PALE_JADE_PAL,
        front: true,
        seed: seedBase + 1,
    });
    burstLayer.group.traverse(o => { if (o.isMesh) o.renderOrder = 11; });
    burstLayer.group.position.set(0, -28 * u, 0);
    burstLayer.step(0.22); // bỏ qua pha gom 0.22s để vòng xung kích + loé trắng bung ngay lập tức

    const ringHolder = new THREE.Group();
    ringHolder.position.set(x, y, z + 0.08);
    if (tiltQuat) ringHolder.quaternion.copy(tiltQuat);
    ringHolder.add(burstLayer.group);

    const sparkLayer = pixelLayer(pixelMod('impacts/hit-spark'), {
        height: 2.9,
        scale: 0.90 * kFx(),
        palette: PALE_JADE_PAL,
        front: true,
        seed: seedBase,
    });
    sparkLayer.group.traverse(o => { if (o.isMesh) o.renderOrder = 12; });
    sparkLayer.group.position.set(x, y - 20 * ((2.9 / 44) * 0.90 * kFx()), z + 0.14);
    sparkLayer.step(0.016);

    const holder = new THREE.Group();
    holder.add(ringHolder, sparkLayer.group);

    const shot = { stopping: false };
    activeOneShots.add(shot);
    addAnim(holder, 1.0, (_p, fx, dt = 0.016) => {
        if (shot.stopping) {
            burstLayer.stop();
            sparkLayer.stop();
            activeOneShots.delete(shot);
            fx.life = fx.age;
            return;
        }
        if (fx.age >= 0.62) burstLayer.stop();
        if (dt > 0) {
            if (!burstLayer.done()) burstLayer.step(dt);
            if (!sparkLayer.done()) sparkLayer.step(dt);
        }
        const fade = fx.age > 0.62 ? Math.max(0, 1 - (fx.age - 0.62) / 0.28) : 1;
        holder.traverse(o => { if (o.material) o.material.opacity = fade; });
        if ((burstLayer.done() && sparkLayer.done()) || fx.age >= 0.92) {
            activeOneShots.delete(shot);
            fx.life = fx.age;
        }
    });
}

/** Bắn 1 thanh yunyou_swordbolt.webp có hào quang khí tức rời vòng trận, lao chéo xuống điểm rơi trong vùng sát thương */
function spawnOneFormationSword(entry) {
    const tex = swordBoltTex();
    const fallbackAspect = 1478 / 233;
    const ang = Math.random() * TAU;
    const rad = (0.12 + 0.78 * Math.sqrt(Math.random())) * (entry.ringD * 0.45);
    const localStart = new THREE.Vector3(Math.cos(ang) * rad, Math.sin(ang) * rad, -0.05);
    entry.tiltGroup.updateMatrixWorld(true);
    const start = entry.tiltGroup.localToWorld(localStart);

    const a2 = Math.random() * TAU;
    const rSpread = Math.min(7.2, Math.max(3.0, entry.radius * 0.85));
    const d2 = Math.sqrt(Math.random()) * rSpread;
    const endX = entry.x + Math.cos(a2) * d2;
    const endZ = entry.z + Math.sin(a2) * d2 * 0.58;
    const endY = GROUND_Y + 0.14 + Math.random() * 0.18;

    const dx = endX - start.x, dy = endY - start.y, dz = endZ - start.z;
    const dist = Math.hypot(dx, dy, dz) || 1;
    const ux = dx / dist, uy = dy / dist;
    const H = entry.charHeight ?? 2.9;
    const len = (1.22 + Math.random() * 0.26) * H * kFx();
    const h = len / fallbackAspect;
    const flipY = dx < 0 ? -1 : 1;

    // yunyou_swordbolt.webp nằm ngang, mũi hướng PHẢI (+X), đuôi sao băng bên TRÁI (-X)
    const bolt = new THREE.Group();
    const auraGlow = artQuad(glowTexture(), len * 1.12, h * 2.5, {
        opacity: 0.44, additive: true, renderOrder: 6, color: 0x5eead4,
    });
    auraGlow.position.z = -0.02;
    const trailGlow = artQuad(tex, len * 1.06, h * 1.32, {
        opacity: 0.48, additive: true, renderOrder: 7, color: 0x99f6e4,
    });
    trailGlow.position.z = -0.01;
    const m = artQuad(tex, len, h, { opacity: 0.96, additive: false, renderOrder: 8 });
    bolt.add(auraGlow, trailGlow, m);
    bolt.rotation.z = Math.atan2(dy, dx);
    bolt.scale.y = flipY;

    const dur = 0.22 + Math.random() * 0.06;
    const totalDur = dur + 0.14;
    const shot = { stopping: false };
    activeOneShots.add(shot);
    const leadBack = len * 0.30;
    let sparked = false;

    addAnim(bolt, totalDur, (_p, fx) => {
        if (shot.stopping) {
            activeOneShots.delete(shot);
            fx.life = fx.age;
            return;
        }
        const k = Math.min(1, fx.age / dur);
        const e = k * k;
        const aspectScaleY = fallbackAspect / aspectOf(tex, fallbackAspect);
        m.scale.set(1, aspectScaleY, 1);
        trailGlow.scale.set(1, aspectScaleY, 1);

        fx.mesh.position.set(
            start.x + dx * e - ux * leadBack * e,
            start.y + dy * e - uy * leadBack * e,
            start.z + dz * e + 0.25,
        );
        const inOp = Math.min(1, k * 6 + 0.2);
        const outOp = k < 1 ? inOp : Math.max(0, 1 - (fx.age - dur) / 0.14);
        m.material.opacity = 0.96 * outOp;
        trailGlow.material.opacity = 0.48 * outOp;
        auraGlow.material.opacity = 0.42 * outOp;

        if (k >= 1 && !sparked) {
            sparked = true;
            spawnPixelFx('impacts/hit-spark', {
                pos: { x: endX, z: endZ },
                flip: dx < 0,
                palette: JADE_PAL,
                scale: (0.50 + Math.random() * 0.12) * kFx(),
            });
        }
        if (fx.age >= totalDur) activeOneShots.delete(shot);
    });
}

/**
 * Tạo vòng trận đồ quay trên không (yunyou_formation.webp, đường kính ~0.8× vùng sát thương)
 * neo CỐ ĐỊNH tại điểm trung điểm tính lúc thi triển (không bám theo YunYou, nhịp nhấp nhô hay camera).
 */
export function spawnSkyFormation(casterId, casterIdx, x, z, opts = {}) {
    const {
        radius = 8,
        chargeTime = 2000,
        fireDuration = 5000,
        flightTime = 1200,
        casterView = null,
        id = null,
    } = opts;
    const key = keyOf(casterId, casterIdx);
    const prev = activeFormations.get(key);
    if (prev) { prev.stopping = true; activeFormations.delete(key); }

    const cx = casterView?.root ? casterView.position.x : x - 9;
    const cz = casterView?.root ? (casterView.position.z ?? 0) : z;
    const dirX = Math.abs(x - cx) > 0.25 ? (x >= cx ? 1 : -1) : (casterView?.facingLeft ? -1 : 1);
    const midX = (cx + x) * 0.5;
    const midZ = (cz + z) * 0.5;
    const H = casterView?.height ?? 2.9;
    const fixedHover = (casterView?._hover ?? 0) > 0.2 ? casterView._hover : swordFlightHeight();
    const midY = GROUND_Y + fixedHover + H * 0.55;

    const ringD = Math.max(6, radius * 2 * 0.8);   // ~0.8× đường kính vùng sát thương
    const tex = formationTex();
    const aspect = aspectOf(tex, 1);

    const group = new THREE.Group();
    const tiltGroup = new THREE.Group();
    // Mặt trận hướng phần mặt dưới về phía địch (+dirX, -Y) và phần mặt trên ngửa vừa đủ về phía camera (+Y, +Z)
    // để nhìn rõ dạng đĩa nghiêng ở cả camera 'explore' lẫn 'combat'
    const normal = new THREE.Vector3(-dirX * 0.535, 0.827, 0.175).normalize();
    tiltGroup.quaternion.setFromUnitVectors(_zAxis, normal);

    const outerRing = artQuad(tex, ringD * 1.24, (ringD * 1.24) / aspect, { opacity: 0, additive: true, renderOrder: 3, color: 0x99f6e4 });
    outerRing.position.z = -0.03;
    const centerGlow = artQuad(glowTexture(), ringD * 0.88, ringD * 0.88, { opacity: 0, additive: true, renderOrder: 3, color: 0x99f6e4 });
    centerGlow.position.z = -0.05;
    const ringMesh = artQuad(tex, ringD, ringD / aspect, { opacity: 0, additive: false, renderOrder: 4, color: 0xe6fffb });
    const ringGlow = artQuad(tex, ringD * 1.12, (ringD * 1.12) / aspect, { opacity: 0, additive: true, renderOrder: 5, color: 0x5eead4 });
    ringGlow.position.z = 0.02;
    const centerCore = artQuad(glowTexture(), ringD * 0.42, ringD * 0.42, { opacity: 0, additive: true, renderOrder: 5, color: 0xe6fffb });
    centerCore.position.z = 0.01;

    // 8 thanh linh kiếm nhỏ (yunyou_spiritsword.webp) bay vòng quanh mép ngoài, mũi chĩa vào tâm, hiện lần lượt lúc tích lực
    const sTex = spiritSwordTex();
    const sAspect = 246 / 1486;
    const sLen = H * 0.58;
    const sW = sLen * sAspect;
    const orbitR = ringD * 0.57;
    const orbitGroup = new THREE.Group();
    const orbitSwords = [];
    const hasCharge = chargeTime > 0;
    const chargeDur = hasCharge ? Math.max(0.1, chargeTime / 1000) : 0;

    for (let i = 0; i < ORBIT_SWORDS; i++) {
        const sh = new THREE.Group();
        const sm = artQuad(sTex, sW, sLen, { opacity: 0, additive: false, renderOrder: 6, color: 0xe6fffb });
        const sg = artQuad(sTex, sW * 1.4, sLen * 1.06, { opacity: 0, additive: true, renderOrder: 7, color: 0x5eead4 });
        sg.position.z = 0.01;
        sh.add(sm, sg);
        sh.visible = false;
        orbitGroup.add(sh);
        orbitSwords.push({
            sh, sm, sg,
            appearAt: hasCharge ? (i / ORBIT_SWORDS) * (chargeDur * 0.85) : 0,
        });
    }

    tiltGroup.add(centerGlow, outerRing, ringMesh, ringGlow, centerCore, orbitGroup);
    group.add(tiltGroup);

    // Đốm sáng / tia lửa nhỏ từ pixelfx chạy lặp dọc mép vòng (nhiều bản nhỏ quanh viền, không phóng đại)
    const rimLayers = [];
    const fxK = kFx();
    for (let i = 0; i < RIM_FX_COUNT; i++) {
        const useSun = i % 2 === 1;
        const scRim = (useSun ? 0.30 : 0.40) * fxK;
        const layer = pixelLayer(pixelMod(useSun ? 'holy/sunburst' : 'arcane/spell-charge'), {
            height: 2.9,
            scale: scRim,
            palette: PALE_JADE_PAL,
            front: true,
            seed: 21 + i * 11,
        });
        const uRim = (2.9 / 44) * scRim;
        layer.group.traverse(o => { if (o.isMesh) o.renderOrder = 8; });
        if (!useSun) layer.group.position.set(-15 * uRim, -22 * uRim, 0);
        layer.step(0.016);
        const holder = new THREE.Group();
        holder.add(layer.group);
        group.add(holder);
        rimLayers.push({ layer, holder, stopped: false });
    }

    // Neo cố định vị trí thế giới một lần duy nhất lúc tạo
    group.position.set(midX, midY, midZ);

    const entry = {
        id,
        x,
        z,
        midX,
        midY,
        midZ,
        dirX,
        charHeight: H,
        radius,
        ringD,
        group,
        tiltGroup,
        phase: hasCharge ? 'charge' : 'firing',
        chargeDur,
        chargeBurstDone: !hasCharge,
        fireDur: Math.max(0.5, fireDuration / 1000),
        flightDur: Math.max(0.2, flightTime / 1000),
        emitAcc: 0,
        emitNext: 0.08,
        spin: 0,
        outerSpin: 0,
        orbitSpin: 0,
        rimSpin: 0,
        flash: 0,
        flare: 0,
        fadeAfterLaunch: -1,
        stopping: false,
        fadeOut: 1,
        rimLayers,
    };
    activeFormations.set(key, entry);

    const maxSec = entry.chargeDur + entry.fireDur + entry.flightDur + 3;
    addAnim(group, maxSec, (_p, fx, dt = 0.016) => {
        if (entry.phase === 'charge' && fx.age >= entry.chargeDur) {
            entry.phase = 'firing';
            entry.flash = Math.max(entry.flash, 0.9);
            if (!entry.chargeBurstDone) {
                entry.chargeBurstDone = true;
                spawnRingPulseBurst(entry.midX, entry.midY, entry.midZ, entry.tiltGroup.quaternion, 17);
            }
        }

        if (entry.fadeAfterLaunch >= 0) {
            entry.fadeAfterLaunch += dt;
            if (entry.fadeAfterLaunch >= 0.18) {
                entry.stopping = true;
            }
        }
        if (entry.stopping) {
            for (const rim of rimLayers) {
                if (!rim.stopped) { rim.stopped = true; rim.layer.stop(); }
            }
            entry.fadeOut = Math.max(0, entry.fadeOut - dt * 1.85);
            if (entry.fadeOut <= 0.01) {
                if (activeFormations.get(key) === entry) activeFormations.delete(key);
                fx.life = fx.age;
                return;
            }
        }

        entry.flash = Math.max(0, entry.flash - dt * 3.0);
        entry.flare = Math.max(0, entry.flare - dt * 2.2);

        const breath = 0.86 + 0.14 * Math.sin(fx.age * 3.5);
        let sc = 1, op = 1, glowStrength = 0.48, spinSpeed = 0.6, centerStrength = 0.5;
        if (entry.phase === 'charge') {
            const pc = entry.chargeDur > 0 ? Math.min(1, fx.age / entry.chargeDur) : 1;
            sc = 0.18 + 0.82 * easeOut(pc);
            op = Math.min(1, pc * 1.35);
            glowStrength = 0.12 + 0.42 * pc;
            centerStrength = (0.14 + 0.64 * pc) * breath;
            spinSpeed = 0.55 + 0.75 * pc;
        } else if (entry.phase === 'firing') {
            sc = 1 + 0.025 * Math.sin(fx.age * 4.5) + 0.04 * entry.flash;
            op = 0.96;
            glowStrength = 0.46 + 0.20 * Math.sin(fx.age * 5) + 0.35 * entry.flash;
            centerStrength = Math.min(1, 0.52 * breath + 0.45 * entry.flash);
            spinSpeed = 2.25;
            // Mưa kiếm liên tục ~7 thanh/giây xuất phát từ mặt vòng trận
            entry.emitAcc += dt;
            while (entry.emitAcc >= entry.emitNext) {
                entry.emitAcc -= entry.emitNext;
                entry.emitNext = 0.115 + Math.random() * 0.055; // trung bình ~7.0 thanh/giây
                spawnOneFormationSword(entry);
            }
        } else {
            // Đã phóng đại kiếm: bừng sáng nhẹ rồi quay chậm dần khi mờ tan
            sc = 1 + 0.10 * entry.flare;
            op = 0.96;
            glowStrength = 0.55 + 0.65 * entry.flare;
            centerStrength = Math.min(1, 0.60 + 0.45 * entry.flare);
            spinSpeed = 1.6 * entry.fadeOut + 0.35;
        }

        tiltGroup.scale.setScalar(sc);
        entry.spin += spinSpeed * dt;
        entry.outerSpin -= (entry.phase === 'firing' ? 0.55 : 0.25) * dt;
        entry.orbitSpin += (entry.phase === 'charge' ? 0.55 : 0.95) * dt;
        entry.rimSpin += 0.28 * dt;

        ringMesh.rotation.z = entry.spin;
        ringGlow.rotation.z = entry.spin;
        outerRing.rotation.z = entry.outerSpin;

        const centerPulseSc = (0.94 + 0.06 * Math.sin(fx.age * 3.5)) * (1 + 0.18 * entry.flash + 0.25 * entry.flare);
        centerGlow.scale.setScalar(centerPulseSc);
        centerCore.scale.setScalar(centerPulseSc * (0.92 + 0.30 * entry.flash));

        const vis = op * entry.fadeOut;
        ringMesh.material.opacity = vis;
        ringGlow.material.opacity = vis * glowStrength;
        outerRing.material.opacity = vis * (0.22 + 0.12 * glowStrength);
        centerGlow.material.opacity = vis * centerStrength;
        centerCore.material.opacity = vis * Math.min(1, 0.24 + 0.55 * centerStrength + 0.35 * entry.flash);

        // 8 thanh linh kiếm quay quanh viền, mũi hướng tâm
        const aspectScaleX = aspectOf(sTex, sAspect) / sAspect;
        for (let i = 0; i < orbitSwords.length; i++) {
            const os = orbitSwords[i];
            const inProg = entry.phase === 'charge'
                ? Math.max(0, Math.min(1, (fx.age - os.appearAt) / 0.24))
                : 1;
            os.sh.visible = inProg > 0.01 && entry.fadeOut > 0.01;
            if (!os.sh.visible) continue;
            const ang = (i / ORBIT_SWORDS) * TAU + entry.orbitSpin;
            const r = orbitR + Math.sin(fx.age * 3.2 + i * 0.9) * 0.08;
            os.sh.position.set(Math.cos(ang) * r, Math.sin(ang) * r, 0.03);
            os.sh.rotation.z = ang + Math.PI / 2;
            const scSw = (0.35 + 0.65 * easeOut(inProg)) * (1 + 0.08 * entry.flash);
            os.sh.scale.set(scSw, scSw, 1);
            os.sm.scale.set(aspectScaleX, 1, 1);
            os.sg.scale.set(aspectScaleX, 1, 1);
            const opSw = 0.90 * inProg * entry.fadeOut;
            os.sm.material.opacity = opSw;
            os.sg.material.opacity = opSw * (0.32 + 0.45 * entry.flash);
        }

        // Hiệu ứng pixelfx nhỏ chạy dọc mép ngoài vòng trận (trong không gian đứng thẳng theo thế giới)
        const rimOp = Math.min(1, fx.age / 0.45) * entry.fadeOut;
        for (let i = 0; i < rimLayers.length; i++) {
            const rim = rimLayers[i];
            const a = (i / RIM_FX_COUNT) * TAU + entry.rimSpin;
            const rimR = entry.ringD * 0.50 * sc;
            _rimVec.set(Math.cos(a) * rimR, Math.sin(a) * rimR, 0.04).applyQuaternion(tiltGroup.quaternion);
            const bobRise = Math.sin(fx.age * 2.4 + i * 1.1) * 0.10 + 0.08;
            rim.holder.position.set(_rimVec.x, _rimVec.y + bobRise, _rimVec.z);
            if (dt > 0 && !rim.layer.done()) rim.layer.step(dt);
            rim.layer.group.traverse(o => { if (o.material) o.material.opacity = rimOp; });
        }
    });
}

/** Chuyển vòng trận sang pha bắn 5s (đồng bộ sự kiện formationRain của server) */
export function beginFormationRain(casterId, casterIdx, opts = {}) {
    const key = keyOf(casterId, casterIdx);
    const entry = activeFormations.get(key);
    if (entry) {
        const wasCharge = entry.phase === 'charge';
        entry.phase = 'firing';
        entry.flash = Math.max(entry.flash, 0.9);
        if (wasCharge && !entry.chargeBurstDone) {
            entry.chargeBurstDone = true;
            spawnRingPulseBurst(entry.midX, entry.midY, entry.midZ, entry.tiltGroup.quaternion, 17);
        }
        return;
    }
    if (opts.x != null) {
        spawnSkyFormation(casterId, casterIdx, opts.x, opts.z ?? 0, {
            radius: opts.radius ?? 8,
            chargeTime: 0,
            fireDuration: opts.fireDuration ?? 5000,
            flightTime: opts.flightTime ?? 1200,
            casterView: opts.casterView ?? null,
            id: opts.id ?? null,
        });
        const created = activeFormations.get(key);
        if (created) created.phase = 'firing';
    }
}

/** Nhịp sát thương 0.5s từ server: nhấp sáng mạnh ở tâm và viền vòng trận (luồng kiếm rơi đã chạy liên tục) */
export function spawnSwordRainTick(x, z, opts = {}) {
    const key = keyOf(opts.casterId, opts.casterIdx);
    const entry = activeFormations.get(key);
    if (entry) {
        entry.flash = Math.max(entry.flash, 0.92);
        return;
    }
    // Dự phòng nếu gọi đơn lẻ không có vòng trận đang chạy
    const dirX = opts.casterView?.facingLeft ? -1 : 1;
    for (let i = 0; i < 4; i++) {
        spawnPixelFx('impacts/hit-spark', {
            pos: { x: x + (Math.random() - 0.5) * 4, z: z + (Math.random() - 0.5) * 2 },
            flip: dirX < 0,
            palette: JADE_PAL,
            scale: 0.55 * kFx(),
            delay: i * 0.04,
        });
    }
}

/** Tắt vòng trận / đại kiếm đang bay nếu kết thúc sớm (YunYou gục hoặc trận kết thúc) */
export function endSkyFormation(casterId, casterIdx, reason = 'cancelled') {
    if (reason === 'done') return;   // Kết thúc bình thường: để đại kiếm & vòng trận tự mờ tự nhiên
    const key = keyOf(casterId, casterIdx);
    const entry = activeFormations.get(key);
    if (entry) entry.stopping = true;
    const gs = activeGiantSwords.get(key);
    if (gs && !gs.exploded) gs.stopping = true;
}

/**
 * Phóng đại kiếm khổng lồ (yunyou_giantsword.webp ~3× chiều cao tướng):
 * Vòng trận loé sáng -> đại kiếm trồi ra từ tâm vòng trận, mũi hướng tâm vùng địch,
 * bay CHẬM 1.2s tới tâm vùng, sau đó vòng trận mờ tắt. Nổ được kích hoạt ở `explodeFormationGiantSword`.
 */
export function launchFormationGiantSword(x, z, opts = {}) {
    const {
        casterId = null,
        casterIdx = null,
        casterView = null,
        radius = 8,
        flightTimeMs = 1200,
    } = opts;
    const key = keyOf(casterId, casterIdx);
    const entry = activeFormations.get(key);

    const cx = entry ? entry.midX : (casterView?.root ? casterView.position.x : x - 8);
    const cz = entry ? entry.midZ : (casterView?.root ? (casterView.position.z ?? 0) : z);
    const H = casterView?.height ?? 2.9;
    const cy = entry ? entry.midY : (GROUND_Y + ((casterView?._hover ?? 0) > 0.2 ? casterView._hover : swordFlightHeight()) + H * 0.55);
    const dirX = entry ? entry.dirX : (Math.abs(x - cx) > 0.25 ? (x >= cx ? 1 : -1) : (casterView?.facingLeft ? -1 : 1));

    if (entry) {
        entry.phase = 'launching';
        entry.flare = 1.25;
        entry.fadeAfterLaunch = 0;
    }
    spawnRingPulseBurst(cx, cy, cz, entry?.tiltGroup?.quaternion ?? null, 41);

    const tex = giantSwordTex();
    const fallbackAspect = 1024 / 1536;
    const len = 3.0 * H;   // ~3× chiều cao nhân vật
    const initW = len * fallbackAspect;

    const group = new THREE.Group();
    const mesh = artQuad(tex, initW, len, { opacity: 0, additive: false, renderOrder: 12 });
    const glowMesh = artQuad(tex, initW * 1.07, len * 1.04, { opacity: 0, additive: true, renderOrder: 13, color: 0x99f6e4 });
    glowMesh.position.z = 0.02;
    group.add(mesh, glowMesh);

    const origin = new THREE.Vector3(cx, cy, cz);
    const target = new THREE.Vector3(x, GROUND_Y + 0.05, z + 0.35);
    const delta = target.clone().sub(origin);
    const dx = delta.x, dy = delta.y, dz = delta.z;
    const flightLen = Math.max(0.5, Math.hypot(dx, dy));
    const ux = dx / flightLen, uy = dy / flightLen;

    // yunyou_giantsword.webp mũi hướng XUỐNG (-Y) -> xoay atan2(dx, -dy) để mũi hướng chuẩn theo vector bay
    group.rotation.z = Math.atan2(dx, -dy);

    const tipOffset = len * 0.42;
    const endCenterX = target.x - ux * tipOffset;
    const endCenterY = target.y - uy * tipOffset;
    const endCenterZ = target.z;
    // Lúc bắt đầu trồi ra từ tâm vòng trận: thân lùi lại một chút rồi tiến chậm suốt 1.2s tới điểm chạm
    const startCenterX = origin.x - ux * (tipOffset * 0.35);
    const startCenterY = origin.y - uy * (tipOffset * 0.35);
    const startCenterZ = origin.z;

    const flightDur = Math.max(0.3, flightTimeMs / 1000);
    const lingerSec = 0.45;
    const fadeSec = 0.40;
    const totalDur = flightDur + lingerSec + fadeSec + 1.0;

    const shot = {
        key,
        x,
        z,
        dirX,
        endCenterX,
        endCenterY,
        endCenterZ,
        group,
        stopping: false,
        exploded: false,
        explodeAge: -1,
        onExplodeCallback: null,
        sparkAcc: 0,
    };
    const prevShot = activeGiantSwords.get(key);
    if (prevShot) prevShot.stopping = true;
    activeGiantSwords.set(key, shot);
    activeOneShots.add(shot);

    addAnim(group, totalDur, (_p, fx, dt = 0.016) => {
        if (shot.stopping) {
            if (activeGiantSwords.get(key) === shot) activeGiantSwords.delete(key);
            activeOneShots.delete(shot);
            fx.life = fx.age;
            return;
        }

        const aspectScaleX = aspectOf(tex, fallbackAspect) / fallbackAspect;

        if (!shot.exploded) {
            const p = Math.min(1, fx.age / flightDur);
            // Bay chậm có gia tốc nhẹ cuối quãng
            const e = p * (0.72 + 0.28 * p);
            const emergeT = Math.min(1, fx.age / 0.22);
            const emergeS = 0.30 + 0.70 * easeOut(emergeT);

            const px = startCenterX + (endCenterX - startCenterX) * e;
            const py = startCenterY + (endCenterY - startCenterY) * e;
            const pz = startCenterZ + (endCenterZ - startCenterZ) * e;
            fx.mesh.position.set(px, py, pz);

            mesh.scale.set((dirX >= 0 ? 1 : -1) * aspectScaleX * emergeS, emergeS, 1);
            glowMesh.scale.set((dirX >= 0 ? 1 : -1) * aspectScaleX * emergeS, emergeS, 1);
            const op = Math.min(1, fx.age / 0.14);
            mesh.material.opacity = op;
            glowMesh.material.opacity = (0.35 + 0.20 * Math.sin(fx.age * 16)) * op;

            // Vệt ngọc lấp lánh nhẹ suốt 1.2s đại kiếm bay xuống
            shot.sparkAcc += dt;
            if (shot.sparkAcc >= 0.12 && p > 0.12 && p < 0.96) {
                shot.sparkAcc = 0;
                spawnPixelFx('impacts/hit-spark', {
                    pos: { x: px, z: pz },
                    lift: Math.max(0, py - GROUND_Y - 1.2),
                    flip: dirX < 0,
                    palette: JADE_PAL,
                    scale: 0.48 * kFx(),
                });
            }
        } else {
            if (shot.explodeAge < 0) shot.explodeAge = 0;
            shot.explodeAge += dt;
            fx.mesh.position.set(endCenterX, endCenterY, endCenterZ);
            mesh.scale.set((dirX >= 0 ? 1 : -1) * aspectScaleX, 1, 1);
            glowMesh.scale.set((dirX >= 0 ? 1 : -1) * aspectScaleX, 1, 1);

            const glowFade = Math.max(0, 1 - shot.explodeAge / 0.28);
            const vis = shot.explodeAge <= lingerSec ? 1 : Math.max(0, 1 - (shot.explodeAge - lingerSec) / fadeSec);
            mesh.material.opacity = vis;
            glowMesh.material.opacity = 0.65 * glowFade * vis;
            if (shot.explodeAge >= lingerSec + fadeSec) {
                if (activeGiantSwords.get(key) === shot) activeGiantSwords.delete(key);
                activeOneShots.delete(shot);
                fx.life = fx.age;
            }
        }
    });
}

/** Đại kiếm chạm đất nổ lớn (đồng bộ sự kiện finalSwordExplode của server): nhiều cụm pixelfx cỡ chuẩn + rung màn hình */
export function explodeFormationGiantSword(x, z, opts = {}) {
    const { casterId = null, casterIdx = null, onImpact = null } = opts;
    const key = keyOf(casterId, casterIdx);
    const shot = activeGiantSwords.get(key);
    const dirX = shot ? shot.dirX : 1;
    if (shot && !shot.exploded) {
        shot.exploded = true;
        shot.explodeAge = 0;
        shot.group.position.set(shot.endCenterX, shot.endCenterY, shot.endCenterZ);
    }
    if (activeGiantSwords.get(key) === shot) activeGiantSwords.delete(key);
    spawnGiantImpactExplosion(shot?.x ?? x, shot?.z ?? z, dirX);
    onImpact?.();
}

export function clearSwordFx() {
    for (const f of activeFans.values()) f.stopping = true;
    activeFans.clear();
    for (const f of activeFormations.values()) f.stopping = true;
    activeFormations.clear();
    for (const s of activeGiantSwords.values()) s.stopping = true;
    activeGiantSwords.clear();
    for (const s of activeOneShots) s.stopping = true;
    activeOneShots.clear();
}
