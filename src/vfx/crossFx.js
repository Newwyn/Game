// ============================================================
// CROSS FX (Caelum — Thánh Giá):
//   · Bảng vẽ Thánh giá trên sân (ưu tiên ảnh caelum_cross_1..4.webp & caelum_cross_big.webp nếu có,
//     thiếu ảnh vẫn tự vẽ quad màu đẹp theo từng loại).
//   · Vòng vùng tác dụng mảnh nhẹ + vài đốm sáng (không che trận đấu), kích thước & độ sáng tăng theo cấp 1->2->3.
//   · Ưu tiên pixelfx ở tỉ lệ chuẩn (từ LIB của src/vfx/pixelFx.js).
//   · Đăng ký bộ xem trước kéo thả cho kỹ năng đặt Thánh giá (cross_place).
// ============================================================
import * as THREE from 'three';
import { GROUND_Y, gameTimeout } from '../config.js';

const CHEST_Y = 1.0;
import { scene } from '../core/scene.js';
import { getTexture } from '../core/textures.js';
import { cameraRig } from '../core/cameraRig.js';
import { registerDragCustomizer } from '../ui/dragCast.js';
import { addAnim, fxPlane, glowTexture, spawnLightning, spawnShockwave } from './vfx.js';
import { spawnPixelFx } from './pixelFx.js';

function disposeGroup(obj) {
    obj?.traverse?.((child) => {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) child.material.forEach(m => m?.dispose?.());
        else child.material?.dispose?.();
    });
}

const CROSS_GLOB = import.meta.glob('../assets/sprites/caelum_cross_*.webp', { eager: true, import: 'default' });
const optionalUrl = (name) => CROSS_GLOB[`../assets/sprites/caelum_cross_${name}.webp`] ?? null;

export const CROSS_TYPE_META = {
    1: { id: 1, name: 'Sinh Mệnh', short: 'Sinh Mệnh', color: 0x22c55e, css: '#22c55e', glow: 0x86efac },
    2: { id: 2, name: 'Uy Lực', short: 'Uy Lực', color: 0xf59e0b, css: '#f59e0b', glow: 0xfde047 },
    3: { id: 3, name: 'Sấm Sét', short: 'Sấm Sét', color: 0x38bdf8, css: '#38bdf8', glow: 0xbae6fd },
    4: { id: 4, name: 'Thanh Tẩy', short: 'Thanh Tẩy', color: 0xd946ef, css: '#d946ef', glow: 0xf5d0fe },
};

const _texCache = new Map();
function makePlaceholderCrossTex(key) {
    if (_texCache.has(key)) return _texCache.get(key);
    const url = optionalUrl(key);
    if (url) {
        const tex = getTexture(url);
        _texCache.set(key, tex);
        return tex;
    }
    const meta = CROSS_TYPE_META[key] ?? { color: 0xfef08a, css: '#fef08a', glow: 0xffffff };
    const isBig = key === 'big';
    const c = document.createElement('canvas');
    c.width = 160; c.height = 240;
    const ctx = c.getContext('2d');
    const mainCss = isBig ? '#fde047' : meta.css;
    const g = ctx.createRadialGradient(80, 90, 6, 80, 90, 74);
    g.addColorStop(0, isBig ? 'rgba(255,255,230,0.65)' : 'rgba(255,255,255,0.4)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 160, 240);

    ctx.save();
    ctx.shadowColor = mainCss;
    ctx.shadowBlur = isBig ? 22 : 14;
    ctx.fillStyle = mainCss;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    // Thân dọc Thánh giá
    ctx.beginPath();
    ctx.roundRect(66, 20, 28, 200, 6);
    ctx.fill();
    ctx.stroke();
    // Thanh ngang
    ctx.beginPath();
    ctx.roundRect(24, 62, 112, 26, 6);
    ctx.fill();
    ctx.stroke();
    // Lõi sáng
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillRect(74, 30, 12, 178);
    ctx.fillRect(36, 70, 88, 10);
    ctx.restore();

    const tex = new THREE.CanvasTexture(c);
    _texCache.set(key, tex);
    return tex;
}

let _softRingTex = null;
function softAreaRingTexture() {
    if (_softRingTex) return _softRingTex;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    // Viền mảnh dịu + ánh tỏa rất nhẹ ở rìa để không che nhân vật
    const g = ctx.createRadialGradient(128, 128, 104, 128, 128, 127);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.12)');
    g.addColorStop(0.86, 'rgba(255,255,255,0.68)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    _softRingTex = new THREE.CanvasTexture(c);
    return _softRingTex;
}

const activeCrosses = new Map();
const activeRadiances = new Map();

function levelConfig(level) {
    if (level >= 3) return { height: 2.65, ringOp: 0.34, pillarOp: 0.96, glowScale: 1.5 };
    if (level === 2) return { height: 2.25, ringOp: 0.24, pillarOp: 0.86, glowScale: 1.15 };
    return { height: 1.85, ringOp: 0.16, pillarOp: 0.76, glowScale: 0.85 };
}

function createPlacedCrossMesh(c) {
    const meta = CROSS_TYPE_META[c.type] ?? CROSS_TYPE_META[1];
    const tex = makePlaceholderCrossTex(String(c.type));
    const lv = levelConfig(c.level ?? 1);
    const r = c.radius ?? 3;

    const group = new THREE.Group();
    group.position.set(c.x, GROUND_Y, c.z);
    group.userData.isVfx = true;

    const ring = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({
            map: softAreaRingTexture(),
            color: meta.color,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            opacity: lv.ringOp,
            side: THREE.DoubleSide,
            fog: false,
        }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.025;
    ring.scale.set(r, r, 1);

    const halo = fxPlane(glowTexture(), 1.6, 1.6, { color: meta.glow, opacity: 0.25 });
    halo.position.set(0, lv.height * 0.52, -0.02);
    halo.scale.setScalar(lv.glowScale);

    const billboard = fxPlane(tex, 1.4, 2.1, { additive: false, opacity: lv.pillarOp });
    billboard.position.set(0, lv.height * 0.5, 0);
    billboard.scale.setScalar(lv.height / 2.1);

    // Vài đốm sáng nhỏ bay nhẹ quanh vòng (rất thưa, không che trận đấu)
    const motes = [];
    for (let i = 0; i < 4; i++) {
        const m = fxPlane(glowTexture(), 0.24, 0.24, { color: meta.glow, opacity: 0.45 });
        const ang = (i / 4) * Math.PI * 2;
        m.userData = { ang, phase: i * 1.6, radiusFrac: 0.65 + (i % 2) * 0.2 };
        motes.push(m);
        group.add(m);
    }

    group.add(ring, halo, billboard);
    scene.add(group);
    return {
        id: c.id, type: c.type, level: c.level ?? 1, radius: r, x: c.x, z: c.z,
        group, ring, halo, billboard, motes, age: 0, pulseBoost: 0, dead: false,
    };
}

let _driver = null;
function ensureDriver() {
    if (_driver) return;
    const dummy = new THREE.Object3D();
    dummy.userData.isVfx = true;
    scene.add(dummy);
    _driver = dummy;
    let prevElapsed = 0;
    addAnim(dummy, 1e9, (p) => {
        const t = p * 1e9;
        const dt = Math.min(0.05, Math.max(0.001, t - prevElapsed));
        prevElapsed = t;
        for (const v of activeCrosses.values()) {
            v.age += dt;
            v.pulseBoost = Math.max(0, v.pulseBoost - dt * 2.2);
            const lv = levelConfig(v.level);
            const pop = Math.min(1, v.age / 0.18);
            const s = (0.65 + 0.35 * pop) * (1 + v.pulseBoost * 0.15);
            v.billboard.scale.setScalar((lv.height / 2.1) * s);
            v.billboard.position.y = lv.height * 0.5 + Math.sin(t * 2.4 + v.id) * 0.05;
            v.ring.scale.set(v.radius, v.radius, 1);
            v.ring.material.opacity = lv.ringOp * (0.85 + 0.15 * Math.sin(t * 2.8 + v.id) + v.pulseBoost * 0.45);
            v.halo.scale.setScalar(lv.glowScale * (1 + 0.08 * Math.sin(t * 3.5) + v.pulseBoost * 0.3));
            v.halo.material.opacity = (0.18 + v.level * 0.06) + v.pulseBoost * 0.25;
            for (const m of v.motes) {
                const { ang, phase, radiusFrac } = m.userData;
                const rr = v.radius * radiusFrac;
                const a = ang + t * 0.55;
                const y = 0.12 + ((t * 0.45 + phase) % 1) * (lv.height * 0.85);
                m.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
                m.material.opacity = 0.32 * (1 - ((y - 0.12) / (lv.height * 0.85))) * (v.level >= 2 ? 1.2 : 0.85);
            }
        }
        for (const r of activeRadiances.values()) {
            r.age += dt;
            r.boost = Math.max(0, r.boost - dt * 2);
            const fadeIn = Math.min(1, r.age / 0.25);
            r.billboard.position.y = 2.6 + Math.sin(t * 2.0) * 0.08;
            r.billboard.scale.setScalar(2.45 * fadeIn * (1 + r.boost * 0.08));
            r.halo.scale.setScalar((3.8 + 0.3 * Math.sin(t * 3.2)) * fadeIn);
            r.halo.material.opacity = (0.28 + r.boost * 0.22) * fadeIn;
            r.ring.material.opacity = (0.18 + 0.05 * Math.sin(t * 2.6) + r.boost * 0.18) * fadeIn;
        }
    });
}

function removeCrossVisual(id) {
    const v = activeCrosses.get(id);
    if (!v) return;
    activeCrosses.delete(id);
    if (v.group.parent) v.group.parent.remove(v.group);
    disposeGroup(v.group);
}

function removeRadianceVisual(id) {
    const r = activeRadiances.get(id);
    if (!r) return;
    activeRadiances.delete(id);
    if (r.group.parent) r.group.parent.remove(r.group);
    disposeGroup(r.group);
}

export function clearCrossFx() {
    for (const id of [...activeCrosses.keys()]) removeCrossVisual(id);
    for (const id of [...activeRadiances.keys()]) removeRadianceVisual(id);
    _driver = null;
}

function spawnRadianceVisual(data) {
    ensureDriver();
    const group = new THREE.Group();
    group.position.set(data.x ?? 0, GROUND_Y, data.z ?? 0);
    group.userData.isVfx = true;

    const ring = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({
            map: softAreaRingTexture(),
            color: 0xfde047,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            opacity: 0.18,
            side: THREE.DoubleSide,
            fog: false,
        }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.scale.set(16, 10, 1);

    const halo = fxPlane(glowTexture(), 2.2, 2.2, { color: 0xfef08a, opacity: 0.28 });
    halo.position.set(0, 2.7, -0.45);

    const billboard = fxPlane(makePlaceholderCrossTex('big'), 1.5, 2.25, { additive: false, opacity: 0.94 });
    billboard.position.set(0, 2.6, -0.4);

    group.add(ring, halo, billboard);
    scene.add(group);
    activeRadiances.set(data.id, { id: data.id, group, ring, halo, billboard, age: 0, boost: 0.6 });
    spawnShockwave({ x: data.x ?? 0, z: data.z ?? 0 }, { color: 0xfef08a, radius: 6, life: 0.55 });
    spawnPixelFx('holy/sunburst', { pos: { x: data.x ?? 0, y: GROUND_Y, z: data.z ?? 0 }, scale: 0.95 });
}

export function playCrossFxEvent(data, { getView, opponentIdOf, onDamageNumber, onHealNumber } = {}) {
    ensureDriver();
    const caster = data.casterId != null ? getView?.(data.casterId, data.casterIdx) : null;
    const oppId = data.targetId ?? (data.casterId != null ? opponentIdOf?.(data.casterId) : null);

    switch (data.kind) {
        case 'place': {
            if (data.replacedId != null) removeCrossVisual(data.replacedId);
            const c = data.cross;
            if (!c) break;
            if (activeCrosses.has(c.id)) removeCrossVisual(c.id);
            activeCrosses.set(c.id, createPlacedCrossMesh(c));
            spawnPixelFx('custom/cast-flash', { pos: { x: c.x, y: GROUND_Y, z: c.z }, scale: 0.75 });
            break;
        }
        case 'levelUp': {
            const c = data.cross;
            if (!c) break;
            const v = activeCrosses.get(c.id);
            if (v) {
                v.level = c.level;
                v.radius = c.radius;
                v.pulseBoost = 1;
            }
            spawnPixelFx('holy/sunburst', { pos: { x: c.x, y: GROUND_Y, z: c.z }, scale: 0.72 });
            break;
        }
        case 'crossEnd': {
            if (data.id != null) removeCrossVisual(data.id);
            break;
        }
        case 'pulse': {
            for (const ev of data.events ?? []) {
                const v = activeCrosses.get(ev.id);
                if (v) v.pulseBoost = 0.8;
                if (ev.type === 1) {
                    for (const h of ev.heals ?? []) {
                        const tv = getView?.(data.casterId, h.targetIndex);
                        if (!tv) continue;
                        if (h.heal > 0) {
                            onHealNumber?.(tv, h.heal);
                            spawnPixelFx('holy/heal', { pos: tv.position, scale: 0.75 });
                        }
                    }
                } else if (ev.type === 3) {
                    for (const eff of ev.effects ?? []) {
                        const tv = oppId != null ? getView?.(oppId, eff.targetIndex) : null;
                        if (!tv) continue;
                        const topY = GROUND_Y + levelConfig(ev.level ?? 1).height * 0.85;
                        spawnLightning(
                            { x: ev.x, y: topY, z: ev.z },
                            { x: tv.position.x, y: GROUND_Y + CHEST_Y, z: tv.position.z },
                            { width: 0.55, life: 0.22 },
                        );
                        spawnPixelFx('lightning/zap-hit', { pos: tv.position, scale: 0.8 });
                        onDamageNumber?.(tv, eff);
                    }
                } else if (ev.type === 4) {
                    for (const i of ev.cleansed ?? []) {
                        const tv = getView?.(data.casterId, i);
                        if (tv) spawnPixelFx('holy/feather-burst', { pos: tv.position, scale: 0.7 });
                    }
                }
            }
            break;
        }
        case 'shield': {
            const v = activeCrosses.get(data.id);
            if (v) v.pulseBoost = 0.75;
            for (const s of data.shields ?? []) {
                const tv = getView?.(data.casterId, s.targetIndex);
                if (tv) spawnPixelFx('holy/divine-shield', { pos: tv.position, scale: 0.85 });
            }
            break;
        }
        case 'hymn': {
            if (caster) {
                spawnShockwave(caster.position, { color: 0xfde047, radius: 5.5, life: 0.5 });
                spawnPixelFx('holy/sunburst', { pos: caster.position, scale: 0.85 });
            }
            for (const c of data.crosses ?? []) {
                const v = activeCrosses.get(c.id);
                if (v) { v.level = c.level; v.radius = c.radius; v.pulseBoost = 1.2; }
            }
            // Phát 3 đợt hiệu ứng gọn mắt (tách nhẹ theo nhịp nhìn)
            (data.waves ?? []).forEach((wave, k) => {
                gameTimeout(() => {
                    playCrossFxEvent({ ...data, kind: 'pulse', events: wave }, { getView, opponentIdOf, onDamageNumber, onHealNumber });
                }, k * 110);
            });
            break;
        }
        case 'radianceStart': {
            spawnRadianceVisual(data);
            cameraRig.shake(0.14, 180);
            break;
        }
        case 'radianceTick': {
            const r = activeRadiances.get(data.id);
            if (r) r.boost = data.explode ? 1.4 : 0.7;
            for (const eff of data.effects ?? []) {
                const tv = oppId != null ? getView?.(oppId, eff.targetIndex) : null;
                if (!tv) continue;
                spawnLightning(
                    { x: tv.position.x, y: GROUND_Y + 5.5, z: tv.position.z },
                    { x: tv.position.x, y: GROUND_Y + CHEST_Y, z: tv.position.z },
                    { width: 0.45, life: 0.2 },
                );
                spawnPixelFx('holy/sunburst', { pos: tv.position, scale: 0.72 });
                onDamageNumber?.(tv, eff);
            }
            if (data.explode) {
                spawnShockwave({ x: 0, z: 0 }, { color: 0xfef08a, radius: 14, life: 0.6 });
                spawnPixelFx('holy/sunburst', { pos: { x: 0, y: GROUND_Y, z: 0 }, scale: 1.0 });
                cameraRig.shake(0.22, 220);
                for (const eff of data.explodeEffects ?? []) {
                    const tv = oppId != null ? getView?.(oppId, eff.targetIndex) : null;
                    if (tv) onDamageNumber?.(tv, eff);
                }
                for (const i of data.cleansed ?? []) {
                    const tv = getView?.(data.casterId, i);
                    if (tv) spawnPixelFx('holy/heal', { pos: tv.position, scale: 0.8 });
                }
            }
            break;
        }
        case 'radianceEnd': {
            if (data.id != null) removeRadianceVisual(data.id);
            break;
        }
        case 'revive': {
            for (const c of data.crosses ?? []) {
                const v = activeCrosses.get(c.id);
                if (v) removeCrossVisual(c.id);
                if (!caster) continue;
                const meta = CROSS_TYPE_META[c.type] ?? CROSS_TYPE_META[1];
                const flyer = fxPlane(makePlaceholderCrossTex(String(c.type)), 1.2, 1.8, { additive: false });
                const sx = c.x, sz = c.z;
                addAnim(flyer, 0.45, (p, fx) => {
                    const tx = caster.position.x, tz = caster.position.z;
                    const e = p * (2 - p);
                    fx.mesh.position.set(sx + (tx - sx) * e, GROUND_Y + 1.0 + Math.sin(p * Math.PI) * 2.2, sz + (tz - sz) * e);
                    fx.mesh.material.color.setHex(meta.glow);
                    fx.mesh.material.opacity = 1 - p * 0.4;
                });
            }
            if (caster) {
                spawnPixelFx('holy/resurrection', { pos: caster.position, scale: 0.95 });
                spawnShockwave(caster.position, { color: 0xfef08a, radius: 4, life: 0.5 });
                if (data.hp > 0) onHealNumber?.(caster, data.hp);
            }
            break;
        }
    }
}

// Đăng ký tuỳ biến xem trước kéo thả cho Thánh Giá (từng loại có màu & bóng riêng)
registerDragCustomizer('cross_place', ({ member, skillDef }) => {
    const t = Number(member?.crossType ?? 1);
    const meta = CROSS_TYPE_META[t] ?? CROSS_TYPE_META[1];
    return {
        range: skillDef?.dragTarget?.range ?? 14,
        radius: skillDef?.dragTarget?.radii?.[0] ?? 3,
        color: meta.color,
        ghostKey: `cross_${t}`,
        extraPayload: () => ({ crossType: member?.crossType ?? 1 }),
        createGhost: () => {
            const mat = new THREE.MeshBasicMaterial({
                map: makePlaceholderCrossTex(String(t)),
                transparent: true,
                depthWrite: false,
                opacity: 0.72,
                side: THREE.DoubleSide,
                fog: false,
            });
            const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), mat);
            m.position.y = 1.0;
            m.userData.isVfx = true;
            return m;
        },
    };
});
