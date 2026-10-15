// ============================================================
// HIỆU ỨNG LỬA — Ignar (Hỏa Ngục)
// ============================================================
// Hình lấy từ atlas ignar_fx.png (tools/build_fx_atlas.py art/ignar/fx_spec.json): cầu lửa, thiên hỏa cầu,
// nổ 4 khung, cột lửa 6 khung, vòng triệu hồi, hào quang 3 khung, cánh lửa, Hộ Vệ Thần Lửa 3 tư thế...
// Hình lửa vẽ chế độ THƯỜNG (giữ màu cam đỏ đậm, không bị bạc trắng trên nền cỏ sáng);
// quầng sáng phía dưới vẽ CỘNG SÁNG (additive) để lửa rực.
import * as THREE from 'three';
import fxUrl from '../assets/sprites/ignar_fx.png';
import fxMeta from './ignarFx.json';
import { addAnim, fxPlane, glowTexture, sparkTexture, ringTexture, easeOut, spawnHitSpark, spawnShockwave } from './vfx.js';

let base = null;
const texCache = {};
/** Texture 1 hình trong atlas lửa */
function fireTex(name) {
    if (texCache[name]) return texCache[name];
    base ??= new THREE.TextureLoader().load(fxUrl, t => { t.colorSpace = THREE.SRGBColorSpace; });
    base.colorSpace = THREE.SRGBColorSpace;
    const [W, H] = fxMeta.atlasSize;
    const [x, y, w, h] = fxMeta.parts[name].rect;
    const t = base.clone();
    t.repeat.set(w / W, h / H);
    t.offset.set(x / W, 1 - (y + h) / H);
    t.needsUpdate = true;
    return (texCache[name] = { texture: t, aspect: w / h });
}
/** Mặt phẳng hiện 1 hình lửa, cao `height` đơn vị */
export function fireSprite(name, height, { additive = false, opacity = 1 } = {}) {
    const { texture, aspect } = fireTex(name);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(height * aspect, height), new THREE.MeshBasicMaterial({
        map: texture, transparent: true, depthWrite: false, fog: false, opacity,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide }));
    m.userData.sharedTexture = true;
    return m;
}
/** Đổi hình của sprite (chạy khung hình) — giữ chiều cao */
function setFrame(mesh, name, height) {
    const { texture, aspect } = fireTex(name);
    mesh.material.map = texture;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(height * aspect, height);
}
const FLOOR = -0.45;
/** Hình nằm trên mặt đất (vòng phép, vết cháy): rộng 2r theo x, sâu 1.5r theo z (camera nhìn xiên sẽ ép thành elip) */
function groundDecal(name, x, z, r, { lift = 0.04 } = {}) {
    const m = fireSprite(name, 1);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, FLOOR + lift, z);
    m.scale.set(2 * r / fireTex(name).aspect, 1.5 * r, 1);
    return m;
}

/** Quả cầu lửa bay từ `from` tới `to` (đánh thường / Hộ Vệ ném / Hỏa Chưởng xoáy) */
export function spawnFireball(from, to, { duration = 0.25, size = 0.7, swirl = false, onHit } = {}) {
    const name = swirl ? 'fireSwirl' : 'fireBall';
    const m = fireSprite(name, size);
    const dx = to.x - from.x, dy = to.y - from.y;
    const left = dx < 0;
    m.scale.x = left ? -1 : 1;
    m.rotation.z = left ? -Math.atan2(dy, -dx) : Math.atan2(dy, dx);
    const glow = fxPlane(glowTexture(), size * 1.6, size * 1.6, { color: 0xff7a1a, opacity: 0.55 });
    const g = new THREE.Group();
    g.add(glow, m);
    // hình cầu lửa có đuôi dài phía sau: dời để đầu cầu đúng tâm đường bay
    m.position.x = (left ? 1 : -1) * size * fireTex(name).aspect * 0.32;
    const z = (from.z ?? 0) + 0.6;
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(from.x + dx * p, from.y + dy * p + Math.sin(p * Math.PI) * 0.25, z);
        glow.scale.setScalar(1 + 0.15 * Math.sin(p * 40));
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}

/** Nổ lửa 4 khung tại chân mục tiêu */
export function spawnFireExplosion(pos, { size = 2.2, life = 0.55 } = {}) {
    const m = fireSprite('boom0', size);
    m.position.set(pos.x, FLOOR + size * 0.45, (pos.z ?? 0) + 0.7);
    let frame = 0;
    addAnim(m, life, (p, fx) => {
        const f = Math.min(3, Math.floor(p * 4));
        if (f !== frame) { frame = f; setFrame(fx.mesh, 'boom' + f, size); }
        fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 1;
    });
    const flash = fxPlane(glowTexture(), size * 1.5, size * 1.5, { color: 0xffb347 });
    flash.position.set(pos.x, FLOOR + size * 0.4, (pos.z ?? 0) + 0.8);
    addAnim(flash, 0.25, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p)); fx.mesh.material.opacity = 1 - p; });
}

/** Trúng cầu lửa nhỏ: loé cam + tia lửa */
export function spawnFireHit(pos, { size = 1 } = {}) {
    spawnHitSpark(pos, { count: 7, color: 0xff9a3c, size: 0.9 * size });
    const c = fxPlane(glowTexture(), 1.2 * size, 1.2 * size, { color: 0xff6a00 });
    c.position.set(pos.x, (pos.y ?? 0) + 0.75, (pos.z ?? 0) + 0.6);
    addAnim(c, 0.28, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.2); fx.mesh.material.opacity = 1 - p; });
}

/**
 * Thiên Hỏa Cầu: quả cầu lửa khổng lồ rơi từ trên trời xuống (x, z) trong `duration` giây rồi nổ to.
 */
export function spawnSkyFireball(x, z, { duration = 0.6, size = 3.2, onLand } = {}) {
    const m = fireSprite('meteor', size);
    const glow = fxPlane(glowTexture(), size, size, { color: 0xff5a00, opacity: 0.7 });
    glow.position.y = -size * 0.28;
    const g = new THREE.Group();
    g.add(glow, m);
    const y0 = 9, y1 = FLOOR + size * 0.25, x0 = x - 1.2;
    let landed = false;
    // vòng báo trước trên mặt đất
    const mark = fxPlane(glowTexture(), 1, 1, { color: 0xff4400, opacity: 0 });
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(x, FLOOR + 0.02, z);
    addAnim(mark, duration, (p, fx) => { const s = 1.5 + p * 5; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.25 + 0.5 * p; });
    addAnim(g, duration, (p, fx) => {
        const e = p * p;
        fx.mesh.position.set(x0 + (x - x0) * e, y0 + (y1 - y0) * e, z + 0.8);
        if (p >= 1 && !landed) { landed = true; onLand?.(); }
    });
}
/** Thiên Hỏa Cầu chạm đất: nổ lớn + sóng lửa lan + đá văng + tàn lửa bay lên */
export function spawnMeteorImpact(x, z, { size = 4.2, radius = 5.5 } = {}) {
    spawnFireExplosion({ x, z }, { size, life: 0.75 });
    spawnFireExplosion({ x: x - radius * 0.35, z: z + 0.4 }, { size: size * 0.55, life: 0.55 });
    spawnFireExplosion({ x: x + radius * 0.35, z: z - 0.4 }, { size: size * 0.55, life: 0.55 });
    spawnShockwave({ x, z }, { color: 0xff6a1a, radius: radius * 0.5, life: 0.5 });
    // vòng lửa lan sát mặt đất
    const ring = fxPlane(ringTexture(), 1, 1, { color: 0xff7a1a });
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, FLOOR + 0.05, z);
    addAnim(ring, 0.6, (p, fx) => { const s = 1 + easeOut(p) * radius * 2.2; fx.mesh.scale.set(s, s * 0.9, 1); fx.mesh.material.opacity = 1 - p; });
    spawnEmbers(x, z, { count: 26, radius: radius * 0.7, life: 1.1 });
}

/** Tàn lửa nhỏ bay lên */
export function spawnEmbers(x, z, { count = 16, radius = 2, life = 1, y = FLOOR + 0.3 } = {}) {
    for (let i = 0; i < count; i++) {
        const sp = fxPlane(glowTexture(), 0.16, 0.16, { color: Math.random() < 0.5 ? 0xffb347 : 0xff5a1a });
        const a = Math.random() * Math.PI * 2, r = Math.random() * radius;
        const sx = x + Math.cos(a) * r, sz = z + Math.sin(a) * r * 0.5;
        const vy = 1.5 + Math.random() * 2.5, vx = (Math.random() - 0.5) * 1.2, l = life * (0.6 + Math.random() * 0.6);
        addAnim(sp, l, (p, fx) => {
            const t = p * l;
            fx.mesh.position.set(sx + vx * t, y + vy * t - 0.6 * t * t, sz + 0.5);
            fx.mesh.material.opacity = 1 - p;
        });
    }
}

/**
 * BIỂN LỬA còn đọng lại sau Thiên Hỏa Cầu: đất cháy đỏ + nhiều ngọn lửa nhỏ bập bùng trong bán kính,
 * mỗi nhịp gây sát thương (server) thì bùng lên 1 chút (pulseBurn).
 */
export function spawnBurnField(x, z, { radius = 5.5, life = 2 } = {}) {
    const glow = fxPlane(glowTexture(), 1, 1, { color: 0xff4000, opacity: 0 });
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, FLOOR + 0.03, z);
    glow.scale.set(radius * 2.4, radius * 1.6, 1);
    addAnim(glow, life, (p, fx) => { fx.mesh.material.opacity = 0.75 * (p < 0.1 ? p / 0.1 : p > 0.75 ? (1 - p) / 0.25 : 1) * (0.85 + 0.15 * Math.sin(p * 40)); });
    const scorch = groundDecal('scorch', x, z, radius * 0.9);
    addAnim(scorch, life + 0.8, (p, fx) => { fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 0.95; });
    const n = Math.round(radius * 2.4);
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, r = radius * (0.25 + Math.random() * 0.7);
        const fx0 = x + Math.cos(a) * r, fz0 = z + Math.sin(a) * r * 0.55;
        const h = 0.8 + Math.random() * 0.7;
        const f = fireSprite(Math.random() < 0.5 ? 'pillar1' : 'pillar4', h);
        f.position.set(fx0, FLOOR + h * 0.45, fz0 + 0.3);
        const ph = Math.random() * 6, delay = Math.random() * 0.25;
        addAnim(f, life, (p, fx) => {
            const t = p * life;
            const on = t < delay ? 0 : Math.min(1, (t - delay) / 0.15);
            const end = p > 0.75 ? (1 - p) / 0.25 : 1;
            fx.mesh.scale.set(0.9 + 0.12 * Math.sin(t * 11 + ph), (0.85 + 0.2 * Math.sin(t * 9 + ph)) * on, 1);
            fx.mesh.material.opacity = on * end;
        });
    }
    spawnEmbers(x, z, { count: 18, radius: radius * 0.8, life: life });
}
/** 1 nhịp cháy của biển lửa */
export function pulseBurn(x, z, { radius = 5.5 } = {}) {
    spawnEmbers(x, z, { count: 10, radius: radius * 0.8, life: 0.7 });
    const f = fxPlane(glowTexture(), 1, 1, { color: 0xff6a00 });
    f.rotation.x = -Math.PI / 2;
    f.position.set(x, FLOOR + 0.06, z);
    addAnim(f, 0.35, (p, fx) => { fx.mesh.scale.set(radius * 2 * (0.8 + p * 0.3), radius * 1.3, 1); fx.mesh.material.opacity = 0.6 * (1 - p); });
}

/** Ignar chưởng xuống đất: loé lửa + sóng xung kích tại tay */
export function spawnGroundSlam(pos, dir = 1) {
    const x = pos.x + dir * 0.9;
    spawnFireExplosion({ x, z: pos.z }, { size: 1.4, life: 0.4 });
    spawnShockwave({ x, z: pos.z ?? 0 }, { color: 0xff7a1a, radius: 1.6, life: 0.4 });
    spawnEmbers(x, pos.z ?? 0, { count: 10, radius: 0.6, life: 0.6 });
}

/**
 * Cột Lửa Phá Ma — giai đoạn 1: vòng phép hiện trên đất ở chỗ quái trong `time` giây, sáng dần, tia lửa hút vào giữa.
 */
export function spawnPillarCircle(x, z, { radius = 5, time = 1 } = {}) {
    const c = groundDecal('pillarCircle', x, z, radius);
    const sx = c.scale.x, sy = c.scale.y;
    const glow = fxPlane(glowTexture(), 1, 1, { color: 0xff3d00, opacity: 0 });
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, FLOOR + 0.03, z);
    addAnim(glow, time, (p, fx) => { fx.mesh.scale.set(radius * 2.6, radius * 1.8, 1); fx.mesh.material.opacity = 0.2 + 0.6 * p; });
    addAnim(c, time, (p, fx) => {
        const k = 0.3 + easeOut(Math.min(1, p * 2.5)) * 0.7;
        fx.mesh.scale.set(sx * k, sy * k, 1);
        fx.mesh.material.opacity = 0.6 + 0.4 * p;
    });
    // tia lửa bay vào tâm
    for (let i = 0; i < 16; i++) {
        const sp = fxPlane(glowTexture(), 0.2, 0.2, { color: 0xffa040 });
        const a = Math.random() * Math.PI * 2, d0 = Math.random() * time * 0.6;
        addAnim(sp, time, (p, fx) => {
            const t = Math.max(0, p * time - d0) / (time - d0);
            const r = radius * (1 - easeOut(t));
            fx.mesh.position.set(x + Math.cos(a) * r, FLOOR + 0.2 + t * 0.6, z + Math.sin(a) * r * 0.55 + 0.3);
            fx.mesh.material.opacity = t > 0 ? 1 - t * 0.5 : 0;
        });
    }
}

/** Tia lửa nhỏ bắn chéo xuống đất (mở Cột Lửa) */
export function spawnFireBolt(from, to, { duration = 0.3, onHit } = {}) {
    const m = fireSprite('bolt', 0.9);
    const dx = to.x - from.x, dy = to.y - from.y;
    const left = dx < 0;
    m.scale.x = left ? -1 : 1;
    // hình gốc bay chéo xuống-phải ~35°
    m.rotation.z = (left ? -1 : 1) * (Math.atan2(dy, Math.abs(dx)) + 0.62);
    const z = (from.z ?? 0) + 0.6;
    let hit = false;
    addAnim(m, duration, (p, fx) => {
        fx.mesh.position.set(from.x + dx * p, from.y + dy * p, z + (to.z - z + 0.6) * p);
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}

/**
 * Cột Lửa Phá Ma — giai đoạn 2: vòng phép rực + NHIỀU cột lửa phủ kín bán kính (1 cột lớn giữa + vòng cột nhỏ),
 * mỗi nhịp sát thương các cột bùng lại. Kéo dài hits × gap giây.
 */
export function spawnFirePillar(x, z, { hits = 7, gap = 0.4, radius = 5 } = {}) {
    const total = hits * gap + 0.45;
    const circle = groundDecal('pillarCircle', x, z, radius);
    addAnim(circle, total, (p, fx) => { fx.mesh.material.opacity = p > 0.88 ? (1 - p) / 0.12 : 1; });
    const glow = fxPlane(glowTexture(), 1, 1, { color: 0xff4a00 });
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, FLOOR + 0.03, z);
    addAnim(glow, total, (p, fx) => { fx.mesh.scale.set(radius * 2.6, radius * 1.8, 1); fx.mesh.material.opacity = 0.8 * (p > 0.85 ? (1 - p) / 0.15 : 1); });
    const cols = [{ dx: 0, dz: 0, h: 5.2, d: 0 }];
    const ring = Math.max(4, Math.round(radius * 1.1));
    for (let i = 0; i < ring; i++) {
        const a = (i / ring) * Math.PI * 2;
        cols.push({ dx: Math.cos(a) * radius * 0.62, dz: Math.sin(a) * radius * 0.4, h: 3.2 + Math.random() * 0.8, d: 0.05 + Math.random() * 0.12 });
    }
    cols.sort((p, q) => p.dz - q.dz);   // cột phía sau vẽ trước
    cols.forEach(cdef => {
        const H = cdef.h;
        const col = fireSprite('pillar0', H);
        col.position.set(x + cdef.dx, FLOOR + H * 0.47, z + cdef.dz + 0.4);
        let cur = 'pillar0';
        const ph = Math.random() * 6;
        addAnim(col, total, (p, fx) => {
            const t = p * total - cdef.d;
            let f;
            if (t < 0) f = -1;
            else if (t < 0.1) f = 0;
            else if (t < 0.2) f = 1;
            else if (t < total - cdef.d - 0.4) f = 2 + (Math.floor((t - 0.2) / gap * 2 + ph) % 2);
            else if (t < total - cdef.d - 0.2) f = 4;
            else f = 5;
            fx.mesh.visible = f >= 0;
            if (f < 0) return;
            const n = 'pillar' + f;
            if (n !== cur) { cur = n; setFrame(fx.mesh, n, H); }
            const pulse = 1 + 0.08 * Math.sin(t / gap * Math.PI * 2 + ph);
            fx.mesh.scale.set(pulse * 0.85, pulse, 1);
            // hơi trong để vẫn thấy quái đứng trong cột lửa
            fx.mesh.material.opacity = (cdef.d ? 0.78 : 0.88) * (p > 0.93 ? (1 - p) / 0.07 : 1);
        });
    });
    spawnShockwave({ x, z }, { color: 0xff5a00, radius: radius * 0.6, life: 0.45 });
    spawnEmbers(x, z, { count: 30, radius: radius * 0.8, life: total });
}
/** 1 nhịp cột lửa trúng quái: tia lửa + biểu tượng giáp phép vỡ trên đầu */
export function spawnPillarHit(pos, { stackBreak = false } = {}) {
    spawnHitSpark(pos, { count: 4, color: 0xff7b2a, size: 0.7 });
    if (!stackBreak) return;
    const icon = fireSprite('breakIcon', 0.55, { additive: false });
    icon.position.set(pos.x, (pos.y ?? 0) + 2.9, (pos.z ?? 0) + 0.7);
    const y0 = icon.position.y;
    addAnim(icon, 0.9, (p, fx) => {
        fx.mesh.position.y = y0 + p * 0.4;
        fx.mesh.scale.setScalar(p < 0.15 ? 0.5 + p / 0.15 * 0.5 : 1);
        fx.mesh.material.opacity = p > 0.6 ? (1 - p) / 0.4 : 1;
    });
}

/** Vòng triệu hồi lửa dưới chân (gồng Hỏa Thần) */
export function spawnSummonCircle(pos, { life = 1.6, size = 4.2 } = {}) {
    const c = groundDecal('summonCircle', pos.x, pos.z ?? 0, size * 0.55, { lift: 0.05 });
    const sx = c.scale.x, sy = c.scale.y;
    addAnim(c, life, (p, fx) => {
        const k = 0.4 + easeOut(Math.min(1, p * 3)) * 0.6;
        fx.mesh.scale.set(sx * k, sy * k, 1);
        fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 1;
    });
    // hào quang lửa bốc lên quanh người (3 khung lặp)
    const H = 3.4;
    const aura = fireSprite('aura0', H, { opacity: 0.85 });
    aura.position.set(pos.x, FLOOR + H * 0.5, (pos.z ?? 0) + 0.3);
    let cur = 'aura0';
    addAnim(aura, life, (p, fx) => {
        const n = 'aura' + (Math.floor(p * life * 10) % 3);
        if (n !== cur) { cur = n; setFrame(fx.mesh, n, H); }
        fx.mesh.material.opacity = 0.85 * (p < 0.1 ? p / 0.1 : p > 0.85 ? (1 - p) / 0.15 : 1);
    });
}
/** Lúc Hỏa Thần hiện ra: cánh lửa bùng sau lưng + sóng lửa */
export function spawnFireWings(pos, { size = 4 } = {}) {
    const w = fireSprite('wings', size);
    w.position.set(pos.x, (pos.y ?? 0) + 1.6, (pos.z ?? 0) - 0.3);
    addAnim(w, 0.9, (p, fx) => {
        fx.mesh.scale.setScalar(0.5 + easeOut(Math.min(1, p * 2.5)) * 0.7);
        fx.mesh.material.opacity = p > 0.5 ? (1 - p) / 0.5 : 1;
    });
    spawnShockwave(pos, { color: 0xff6a1a, radius: 3, life: 0.6 });
}
/** Hỏa Chưởng: luồng lửa hình nón phụt ra trước tay */
export function spawnPalmFlash(from, dir = 1, { size = 1.3 } = {}) {
    const m = fireSprite('palmFlash', size);
    m.scale.x = dir;
    const w = size * fireTex('palmFlash').aspect;
    m.position.set(from.x + dir * w * 0.45, from.y, (from.z ?? 0) + 0.7);
    addAnim(m, 0.28, (p, fx) => {
        fx.mesh.scale.set(dir * (0.6 + easeOut(p) * 0.5), 0.7 + easeOut(p) * 0.4, 1);
        fx.mesh.material.opacity = 1 - p;
    });
}

/**
 * Hộ Vệ Thần Lửa: bay lơ lửng sau lưng Ignar. Trả về { group, update(dt, pos, facingLeft), throwPose(), roar(), dispose() }.
 */
export function makeFireGuardian() {
    const H = 3.6;
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 4.4, 4.4, { color: 0xff5a00, opacity: 0.45 });
    glow.position.y = 0.2;
    const body = fireSprite('gIdle', H, { additive: false });
    g.add(glow, body);
    let pose = 'gIdle', poseLeft = 0, t = 0, appear = 0;
    const setPose = (n, hold) => { if (pose !== n) { pose = n; setFrame(body, n, H); } poseLeft = hold; };
    return {
        group: g,
        roar() { setPose('gRoar', 0.9); },
        throwPose() { setPose('gThrow', 0.45); },
        /** điểm tay ném cầu lửa (toạ độ thế giới) */
        handPoint() { const p = new THREE.Vector3(); body.getWorldPosition(p); return { x: p.x + (g.scale.x < 0 ? -1.1 : 1.1), y: p.y + 0.2, z: p.z }; },
        update(dt, pos, facingLeft) {
            t += dt; appear = Math.min(1, appear + dt * 2.5);
            if (poseLeft > 0) { poseLeft -= dt; if (poseLeft <= 0) setPose('gIdle', 0); }
            const side = facingLeft ? 1 : -1;   // đứng SAU lưng Ignar
            g.position.set(pos.x + side * 1.5, 2.0 + Math.sin(t * 2.2) * 0.15, (pos.z ?? 0) - 0.35);
            g.scale.set((facingLeft ? -1 : 1) * appear, appear, 1);
            body.material.opacity = appear;
            glow.material.opacity = 0.3 + 0.08 * Math.sin(t * 9);
        },
        dispose() {
            g.parent?.remove(g);
            body.geometry.dispose(); body.material.dispose(); glow.geometry.dispose(); glow.material.dispose();
        },
    };
}
/** Quả cầu lửa nhỏ lơ lửng trên lòng bàn tay (đứng chờ) */
export function makePalmFire() {
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 0.75, 0.75, { color: 0xff7a1a, opacity: 0.6 });
    const f = fireSprite('fireIdle', 0.48);
    g.add(glow, f);
    let t = 0;
    return {
        group: g,
        update(dt) {
            t += dt;
            f.scale.set(1 + 0.05 * Math.sin(t * 13), 1 + 0.08 * Math.sin(t * 11 + 1), 1);
            g.position.y += Math.sin(t * 3) * 0.0008;
            glow.material.opacity = 0.5 + 0.15 * Math.sin(t * 17);
        },
    };
}

/** Khiên Lửa của Ignar (lúc Hỏa Thần): quả cầu lửa trong suốt bao quanh + 3 ngọn lửa bay vòng */
let shieldTex = null;
function fireShieldTexture() {
    if (shieldTex) return shieldTex;
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 70, 128, 128, 126);
    g.addColorStop(0, 'rgba(255,120,30,0)');
    g.addColorStop(0.7, 'rgba(255,110,20,0.18)');
    g.addColorStop(0.9, 'rgba(255,150,40,0.7)');
    g.addColorStop(0.97, 'rgba(255,230,160,0.95)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(128, 128, 127, 0, Math.PI * 2); ctx.fill();
    shieldTex = new THREE.CanvasTexture(c); shieldTex.colorSpace = THREE.SRGBColorSpace;
    return shieldTex;
}
export function makeFireShield() {
    const g = new THREE.Group();
    const bubble = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.2), new THREE.MeshBasicMaterial({
        map: fireShieldTexture(), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    bubble.position.y = 1.35;
    g.add(bubble);
    const flames = [0, 1, 2].map(() => { const f = fireSprite('fireIdle', 0.5); g.add(f); return f; });
    let t = 0, k = 0;
    return {
        group: g,
        update(dt) {
            t += dt; k = Math.min(1, k + dt * 3);
            bubble.scale.setScalar(k * (1 + 0.03 * Math.sin(t * 6)));
            bubble.material.opacity = 0.75 + 0.2 * Math.sin(t * 4);
            flames.forEach((f, i) => {
                const a = t * 2.4 + i * (Math.PI * 2 / 3);
                f.position.set(Math.cos(a) * 1.15, 1.2 + Math.sin(a * 2) * 0.5, Math.sin(a) * 0.6);
                f.material.opacity = k * (0.55 + 0.45 * (Math.sin(a) * 0.5 + 0.5));
            });
        },
        dispose() { g.parent?.remove(g); },
    };
}
