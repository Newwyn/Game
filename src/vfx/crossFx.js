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
import { makeFlipbook, loopFrame } from './flipbook.js';
import auraUrl from '../assets/sprites/caelum_cross_fx.webp';
import AURA from './caelumCrossFx.json';

// Hào quang vẽ tay quanh từng loại Thánh giá (tranh Flow, art/caelum/fx_spec.json): 7 khung chạy vòng
const AURA_FB = makeFlipbook(auraUrl, AURA);
const AURA_GROUP = { 1: 'life', 2: 'power', 3: 'lightning', 4: 'purify' };

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
/** Tranh Thánh giá theo cấp (caelum_cross_<loại>_<cấp>.webp); chưa có tranh cấp đó thì dùng tranh gốc của loại */
function crossTexFor(type, level = 1) {
    const k = `${type}_${level}`;
    return optionalUrl(k) ? makePlaceholderCrossTex(k) : makePlaceholderCrossTex(String(type));
}
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
// camera tự lùi cho thấy trọn Thánh giá (đỉnh cây) và cây Thần Quang khổng lồ
cameraRig.addFitSource(() => {
    const pts = [];
    for (const v of activeCrosses.values()) {
        const h = levelConfig(v.level).height;
        pts.push([v.x, GROUND_Y + h + 0.3, v.z], [v.x, GROUND_Y, v.z]);
    }
    for (const r of activeRadiances.values()) {
        if (!r.landed) continue;   // đang rơi từ trời: không kéo camera lùi theo
        const p = r.group.position, b = r.billboard;
        const half = 2.25 * b.scale.y / 2;
        pts.push([p.x, GROUND_Y + b.position.y + half + 0.4, p.z + b.position.z], [p.x - half * 0.77, GROUND_Y + b.position.y, p.z + b.position.z], [p.x + half * 0.77, GROUND_Y + b.position.y, p.z + b.position.z]);
    }
    return pts;
});

function levelConfig(level) {
    // người chơi 21/11: thánh giá to hơn (x1,5) và đặc (không trong suốt)
    if (level >= 3) return { height: 3.9, ringOp: 0.34, pillarOp: 1, glowScale: 2.2 };
    if (level === 2) return { height: 3.35, ringOp: 0.24, pillarOp: 1, glowScale: 1.7 };
    return { height: 2.8, ringOp: 0.16, pillarOp: 1, glowScale: 1.3 };
}

function createPlacedCrossMesh(c) {
    const meta = CROSS_TYPE_META[c.type] ?? CROSS_TYPE_META[1];
    const tex = crossTexFor(c.type, c.level ?? 1);
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

    const billboard = fxPlane(tex, 1.58, 2.1, { additive: false, opacity: lv.pillarOp });
    billboard.position.set(0, lv.height * 0.5, 0);
    billboard.scale.setScalar(lv.height / 2.1);

    // Hào quang vẽ tay theo loại (đứng sau Thánh giá, chân vòng sáng trùng mặt đất)
    // lớp chính vẽ thường (giữ đúng màu trên nền cỏ) + lớp cộng sáng mỏng cho ánh hào quang
    const aura = AURA_FB.frames(AURA_GROUP[c.type] ?? 'life', 1, { opacity: 1 });
    aura.position.set(0, -0.02, -0.05);
    const auraGlow = AURA_FB.frames(AURA_GROUP[c.type] ?? 'life', 1, { additive: true, opacity: 0.3 });
    auraGlow.position.set(0, -0.02, -0.04);
    group.add(aura, auraGlow);

    // Vài đốm sáng nhỏ bay nhẹ quanh vòng (rất thưa, không che trận đấu) — hào quang đã có đốm sáng nên chỉ giữ 2
    const motes = [];
    for (let i = 0; i < 2; i++) {
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
        group, ring, halo, billboard, aura, auraGlow, motes, age: 0, pulseBoost: 0, dead: false,
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
            // người chơi 21/11: Thánh giá RƠI TỪ TRÊN TRỜI XUỐNG rồi cắm đất (hào quang hiện sau khi cắm)
            const FALL = 0.32, fk = Math.min(1, v.age / FALL);
            if (fk >= 1 && !v.landed) { v.landed = true; landCross(v); }
            const s = 1 + v.pulseBoost * 0.15;
            v.billboard.scale.setScalar((lv.height / 2.1) * s);
            v.billboard.position.y = lv.height * 0.5 + (1 - fk * fk) * 12 + (v.landed ? Math.sin(t * 2.4 + v.id) * 0.05 : 0);
            v.billboard.material.opacity = Math.min(1, v.age / 0.08);
            const show = v.landed ? Math.min(1, (v.age - FALL) / 0.25) : 0;
            v.aura.visible = v.auraGlow.visible = show > 0;
            v.aura.material.opacity = show;
            const af = loopFrame(t + (v.id % 7) * 0.13, 9, AURA_FB.count(v.aura.userData.fx.group));
            AURA_FB.set(v.aura, af); AURA_FB.set(v.auraGlow, af);
            v.aura.scale.setScalar(lv.height * 1.3 * s);
            v.auraGlow.scale.setScalar(lv.height * 1.3 * s);
            v.auraGlow.material.opacity = (0.25 + v.level * 0.08 + v.pulseBoost * 0.3) * show;
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
            // người chơi 21/11: cây Thần Quang KHỔNG LỒ (cao ~11 đơn vị, lùi sau trận) RƠI TỪ TRÊN TRỜI XUỐNG rồi cắm xuống đất
            const FALL = 0.55, k = Math.min(1, r.age / FALL);
            const drop = (1 - k * k) * 18;   // rơi nhanh dần
            r.billboard.position.y = 5.7 + drop + (k >= 1 ? Math.sin(t * 2.0) * 0.12 : 0);
            r.billboard.scale.setScalar(5 * (1 + r.boost * 0.08));
            r.billboard.material.opacity = Math.min(1, r.age / 0.12);
            if (k >= 1 && !r.landed) { r.landed = true; r.landedAt = r.age; landRadiance(r); }
            const ak = r.landed ? Math.min(1, (r.age - r.landedAt) / 0.4) : 0;
            const af = loopFrame(t, 9, AURA_FB.count('radiance'));
            AURA_FB.set(r.aura, af); AURA_FB.set(r.auraGlow, af);
            r.aura.material.opacity = ak;
            r.auraGlow.material.opacity = ak * (0.12 + r.boost * 0.12);
            r.halo.scale.setScalar((7 + 0.5 * Math.sin(t * 3.2)) * (r.landed ? 1 : 0.01));
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

/** Vụ nổ Thần Phạt vẽ tay (Flow, art/caelum/fx-cross-judgement.png): 8 khung chạy 1 lần tại `pos`, cao `height` */
function spawnJudgement(pos, height = 4.5, delay = 0) {
    const go = () => {
        const m = AURA_FB.frames('judgement', height, { opacity: 1 });
        m.position.set(pos.x, GROUND_Y - 0.02, (pos.z ?? 0) + 0.5);
        const glow = AURA_FB.frames('judgement', height, { additive: true, opacity: 0.5 });
        glow.position.set(0, 0, 0.01);
        m.add(glow);
        const n = AURA_FB.count('judgement'), LIFE = 0.85;
        addAnim(m, LIFE, (p) => {
            const f = Math.min(n - 1, Math.floor(p * n));
            AURA_FB.set(m, f); AURA_FB.set(glow, f);
            m.material.opacity = p > 0.85 ? (1 - p) / 0.15 : 1;
        });
    };
    if (delay > 0) gameTimeout(go, delay); else go();
}

// Thánh giá Sấm Sét: tia sét kiểu cuộn Tesla quanh viên ngọc (pixelfx tự vẽ, đơn vị: nhân vật cao 2,9 = 44 điểm ảnh)
const PX = 2.9 / 44;
const gemHeight = (level) => levelConfig(level).height * 0.66;   // viên ngọc ở chỗ giao 2 thanh
function startTeslaArcs(v) {
    if (v.type !== 3) return;
    const gen = (v.arcGen = (v.arcGen ?? 0) + 1);
    spawnPixelFx('custom/cross-arcs', {
        pos: { x: v.x, y: GROUND_Y, z: v.z + 0.06 }, height: 2.9, maxLife: 9999,
        opts: { gemY: -gemHeight(v.level) / PX, seed: 4 + (v.id % 7) },
        until: () => !activeCrosses.has(v.id) || v.arcGen !== gen,
    });
}

/** Thánh giá nhỏ cắm xuống đất: sóng chấn màu theo loại + loé sáng + rung nhẹ */
function landCross(v) {
    const meta = CROSS_TYPE_META[v.type] ?? CROSS_TYPE_META[1];
    spawnShockwave({ x: v.x, z: v.z }, { color: meta.color, radius: Math.max(2.2, v.radius * 0.8), life: 0.45 });
    spawnPixelFx('custom/cast-flash', { pos: { x: v.x, y: GROUND_Y, z: v.z }, scale: 0.9 });
    v.pulseBoost = 1;
    cameraRig.shake(0.08, 120);
    startTeslaArcs(v);
}

/** Thần Quang cắm xuống đất: sóng chấn, rung màn hình, cột sáng thánh (pixelfx) ở chân cây */
function landRadiance(r) {
    const p = r.group.position, bz = p.z + r.billboard.position.z;
    spawnShockwave({ x: p.x, z: bz }, { color: 0xfef08a, radius: 9, life: 0.7 });
    spawnShockwave({ x: p.x, z: bz }, { color: 0xffffff, radius: 5, life: 0.45 });
    // (người chơi 21/11: bỏ Holy Pillar — rối mắt)
    cameraRig.shake(0.3, 280);
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
    halo.position.set(0, 5.8, -4.1);

    const billboard = fxPlane(makePlaceholderCrossTex('big'), 1.73, 2.25, { additive: false, opacity: 1 });
    billboard.position.set(0, 5.7, -4);

    // hào quang vàng vẽ tay (Flow) sau cây khổng lồ: hiện khi cây đã cắm xuống
    const aura = AURA_FB.frames('radiance', 1, { opacity: 0 });
    aura.position.set(0, -0.02, -4.1);
    aura.scale.setScalar(14);
    const auraGlow = AURA_FB.frames('radiance', 1, { additive: true, opacity: 0 });
    auraGlow.position.set(0, -0.02, -4.08);
    auraGlow.scale.setScalar(14);
    group.add(ring, aura, auraGlow, halo, billboard);
    scene.add(group);
    activeRadiances.set(data.id, { id: data.id, group, ring, halo, billboard, aura, auraGlow, age: 0, boost: 0.6, landedAt: 0 });
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
            break;
        }
        case 'levelUp': {
            const c = data.cross;
            if (!c) break;
            const v = activeCrosses.get(c.id);
            if (v) {
                v.level = c.level;
                v.billboard.material.map = crossTexFor(v.type, v.level);   // lên cấp -> đổi sang tranh cấp mới
                if (v.landed) startTeslaArcs(v);
                v.radius = c.radius;
                v.pulseBoost = 1;
            }
            // (người chơi 21/11: bỏ tia nắng sunburst trên Thánh giá — lên cấp chỉ đổi sang tranh cấp mới + nhấp sáng)
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
                    // người chơi 21/11: Thánh giá Sinh Mệnh hồi máu = vòng hồi máu (pixelfx Healing ring) lan ra từ chân Thánh giá
                    if (v && (ev.heals ?? []).some(h => h.heal > 0)) { const sc = v.radius * 0.16; spawnPixelFx('holy/heal-aoe', { pos: { x: v.x, y: GROUND_Y, z: v.z + 0.4 }, scale: sc, lift: 2.2 * sc, maxLife: 3 }); }   // vòng ~ khít vùng tác dụng; nâng lên cho nửa dưới vòng không bị mặt đất che
                    for (const h of ev.heals ?? []) {
                        const tv = getView?.(data.casterId, h.targetIndex);
                        if (!tv) continue;
                        if (h.heal > 0) onHealNumber?.(tv, h.heal);
                    }
                } else if (ev.type === 3) {
                    for (const eff of ev.effects ?? []) {
                        const tv = oppId != null ? getView?.(oppId, eff.targetIndex) : null;
                        if (!tv) continue;
                        // người chơi 21/11: tia giật kiểu cuộn Tesla (pixelfx tự vẽ) từ viên ngọc xuống đối thủ, bỏ tia sét cũ
                        const gy = gemHeight(ev.level ?? 1);
                        spawnPixelFx('custom/cross-zap', {
                            pos: { x: tv.position.x, y: GROUND_Y, z: (tv.position.z + ev.z) / 2 + 0.3 }, height: 2.9, maxLife: 1.2,
                            opts: { dx: (ev.x - tv.position.x) / PX, dy: (gy + (tv.position.z - ev.z) * 0.35) / PX, seed: (ev.id ?? 0) * 13 + (eff.targetIndex ?? 0) },
                        });
                        if (v) v.pulseBoost = 1;
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
            // người chơi 21/11: bỏ vòng sóng vàng (xấu) -> lông vũ thánh bung quanh Caelum + mỗi Thánh giá (và cây Thần Quang)
            // bừng sáng 3 nhịp (hào quang vẽ tay sáng lên), mỗi nhịp 1 vòng sáng mảnh đúng màu loại
            // (23/11) người chơi: bỏ "hiệu ứng tượng" (Blessing vẽ thêm bóng trắng hình nhân vật) + lông vũ — rối, xấu
            const list = [];
            for (const c of data.crosses ?? []) {
                const v = activeCrosses.get(c.id);
                if (v) { if (v.level !== c.level) v.billboard.material.map = crossTexFor(v.type, c.level); v.level = c.level; v.radius = c.radius; list.push(v); }
            }
            const BEAT = 300;
            for (let k = 0; k < 3; k++) {
                gameTimeout(() => {
                    for (const v of list) {
                        if (!activeCrosses.has(v.id)) continue;
                        v.pulseBoost = 1.4;
                        const meta = CROSS_TYPE_META[v.type] ?? CROSS_TYPE_META[1];
                        spawnShockwave({ x: v.x, z: v.z }, { color: meta.color, radius: Math.max(1.6, v.radius * 0.55), life: 0.4 });
                    }
                    for (const r of activeRadiances.values()) r.boost = 1.4;
                }, k * BEAT);
            }
            // 3 đợt tác dụng của Thánh giá (số hồi máu / sát thương...) theo đúng 3 nhịp sáng
            (data.waves ?? []).forEach((wave, k) => {
                gameTimeout(() => {
                    playCrossFxEvent({ ...data, kind: 'pulse', events: wave }, { getView, opponentIdOf, onDamageNumber, onHealNumber });
                }, k * BEAT);
            });
            break;
        }
        case 'radianceStart': {
            // Tâm sân của máy chủ (x 0) thường nằm ngoài khung hình (trận đánh lệch về 1 bên) -> hình cây Thần Quang
            // đứng GIỮA HAI ĐỘI, lùi ra sau trận đánh (tác dụng vẫn là toàn sân như máy chủ tính)
            const xs = [], zs = [];
            for (const id of [data.casterId, oppId]) {
                if (id == null) continue;
                for (let i = 0; i < 8; i++) {
                    const tv = getView?.(id, i);
                    if (tv?.position && tv.visible !== false) { xs.push(tv.position.x); zs.push(tv.position.z); }
                }
            }
            const at = xs.length
                ? { x: (Math.min(...xs) + Math.max(...xs)) / 2, z: Math.min(...zs) }
                : { x: data.x ?? 0, z: data.z ?? 0 };
            spawnRadianceVisual({ ...data, x: at.x, z: at.z });
            for (let i = 0; i < 8; i++) {
                const av = getView?.(data.casterId, i);
                if (av?.member?.alive) spawnPixelFx('holy/blessing', { view: av, until: () => !activeRadiances.has(data.id), maxLife: (data.duration ?? 10000) / 1000 + 1 });
            }
            cameraRig.shake(0.14, 180);
            break;
        }
        case 'radianceTick': {
            // Thánh Ca kích thêm 3 đợt cùng lúc -> giãn ra mỗi đợt 0,25 s cho dễ nhìn
            const r0 = activeRadiances.get(data.id);
            const nowMs = performance.now();
            if (r0 && !data._staggered) {
                const slot = Math.max(nowMs, (r0.nextFxAt ?? 0));
                r0.nextFxAt = slot + 300;
                if (slot - nowMs > 5) { gameTimeout(() => playCrossFxEvent({ ...data, _staggered: true }, { getView, opponentIdOf, onDamageNumber, onHealNumber }), slot - nowMs); break; }
            }
            const r = activeRadiances.get(data.id);
            if (r) r.boost = data.explode ? 1.4 : data.hymn ? 1.6 : 0.7;
            // Thánh Ca kích cây Thần Quang: mỗi phát cây bừng sáng + sóng vàng lớn toả từ chân cây (thấy rõ 3 phát liền)
            if (r?.landed && data.hymn) {
                const gp = r.group.position, bz = gp.z + r.billboard.position.z;
                spawnShockwave({ x: gp.x, z: bz }, { color: 0xfde047, radius: 10, life: 0.5 });
                cameraRig.shake(0.12, 140);
            }
            for (const eff of data.effects ?? []) {
                const tv = oppId != null ? getView?.(oppId, eff.targetIndex) : null;
                if (!tv) continue;
                // tia sáng từ viên ngọc giữa cây Thần Quang bắn tới mục tiêu -> thấy rõ cây khổng lồ đang "bắn" (kể cả 3 phát của Thánh Ca)
                if (r?.landed) {
                    const gp = r.group.position, gem = { x: gp.x, y: GROUND_Y + r.billboard.position.y + 1.2, z: gp.z + r.billboard.position.z };
                    spawnLightning(gem, { x: tv.position.x, y: GROUND_Y + CHEST_Y + 0.6, z: tv.position.z }, { width: 0.5, life: 0.22 });
                }
                // người chơi 21/11: dùng Holy Smite của pixelfx (bỏ sunburst); số sát thương hiện lúc tia sáng chạm đất (~0,54 s)
                spawnPixelFx('holy/smite', { pos: { x: tv.position.x, y: GROUND_Y, z: tv.position.z + 0.3 }, scale: 1.1, lift: 1.9, maxLife: 3 });
                gameTimeout(() => onDamageNumber?.(tv, eff), 520);
            }
            if (data.explode) {
                const rp = r?.group?.position ?? { x: 0, z: 0 };
                spawnShockwave({ x: rp.x, z: rp.z + 4 }, { color: 0xfef08a, radius: 14, life: 0.6 });
                cameraRig.shake(0.22, 220);
                // người chơi 21/11: vụ nổ diện rộng của Thần Quang = hiệu ứng vẽ tay (Flow) nổ trên MỌI đối thủ trúng đòn
                for (const eff of data.explodeEffects ?? []) {
                    const tv = oppId != null ? getView?.(oppId, eff.targetIndex) : null;
                    if (!tv) continue;
                    spawnJudgement(tv.position, 8, 0);
                    gameTimeout(() => onDamageNumber?.(tv, eff), 260);
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
        radius: (skillDef?.dragTarget?.radii?.[0] ?? 3) * (t === 3 ? 1.5 : 1),   // Sấm Sét vùng rộng x1,5 (khớp máy chủ)
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
