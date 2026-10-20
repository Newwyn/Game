// ============================================================
// HIỆU ỨNG LỬA — Ignar (Hỏa Ngục) · bản 2: chạy khung (flipbook)
// ============================================================
// Hình lấy từ atlas ignar_fx2.png (tools/fx_grid_pack.py art/ignar/fx2/fx2_spec.json — 9 tấm tranh AI nền đen của người dùng):
//   hand (lửa tay 4 lặp) · ball (cầu lửa 4 lặp) · hit (trúng 4) · swirl (cầu xoáy 4 lặp) · boom (nổ 8)
//   meteor (thiên thạch 4 lặp) · flame (lửa biển lửa 4 lặp) · pillar (cột lửa 8: bùng 3 · cháy lặp 3 · tắt 2)
//   aura (hào quang 4 lặp) · wing (cánh bung 4) · palm (luồng chưởng 4) · shield (khiên 4 lặp) · guard (Hộ Vệ 8)
//   hình trên đất: warn · scorch · circleDim · circleLit · summonCircle · shockRing · slam · breakIcon
// Mỗi nhóm khung cùng cỡ, có điểm gốc "pivot" (lõi cầu lửa, chân cột lửa, gốc cánh...) -> mesh đặt pivot ở gốc toạ độ.
// Hình lửa vẽ chế độ THƯỜNG (giữ màu cam đỏ đậm trên nền cỏ sáng); quầng sáng phụ vẽ CỘNG SÁNG (additive).
import * as THREE from 'three';
import fxUrl from '../assets/sprites/ignar_fx2.webp';
import FX from './ignarFx2.json';
import { addAnim, fxPlane, glowTexture, easeOut, spawnHitSpark, spawnShockwave } from './vfx.js';

import { makeFlipbook, FLOOR, loopFrame, weighted, fadeInOut } from './flipbook.js';

const FB = makeFlipbook(fxUrl, FX);
/** Mặt phẳng hiện nhóm khung `group` của atlas lửa (xem flipbook.js) */
export const fxFrames = FB.frames;
const setFx = FB.set;
const groundDecal = FB.decal;

// ------------------------------------------------------------
// Cầu lửa / trúng / nổ
// ------------------------------------------------------------
/** Quả cầu lửa bay từ `from` tới `to` (đánh thường / Hộ Vệ ném / Hỏa Chưởng xoáy) — lõi cầu đúng đường bay */
export function spawnFireball(from, to, { duration = 0.25, size = 0.7, swirl = false, onHit } = {}) {
    const group = swirl ? 'swirl' : 'ball';
    const m = fxFrames(group, swirl ? size * 1.15 : size * 0.95);
    const dx = to.x - from.x, dy = to.y - from.y;
    const left = dx < 0;
    m.scale.x = left ? -1 : 1;
    m.rotation.z = left ? -Math.atan2(dy, -dx) : Math.atan2(dy, dx);
    const glow = fxPlane(glowTexture(), size * 1.5, size * 1.5, { color: 0xff7a1a, opacity: 0.5 });
    const g = new THREE.Group();
    g.add(glow, m);
    const z = (from.z ?? 0) + 0.6;
    const ph = Math.random() * 4;
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(from.x + dx * p, from.y + dy * p + Math.sin(p * Math.PI) * 0.25, z);
        setFx(m, loopFrame(p * duration, 16, 4, ph));
        glow.scale.setScalar(1 + 0.15 * Math.sin(p * 40));
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}

/** Trúng cầu lửa (Ignar): bùng lửa 4 khung + loé cam + vài tia lửa */
export function spawnIgnarHit(pos, { size = 1 } = {}) {
    const m = fxFrames('hit', 1.35 * size);
    m.position.set(pos.x, (pos.y ?? 0) + 0.8, (pos.z ?? 0) + 0.65);
    addAnim(m, 0.3, (p, fx) => { setFx(fx.mesh, Math.floor(p * 4)); fx.mesh.material.opacity = p > 0.85 ? (1 - p) / 0.15 : 1; });
    const c = fxPlane(glowTexture(), 1.1 * size, 1.1 * size, { color: 0xff6a00, opacity: 0.8 });
    c.position.set(pos.x, (pos.y ?? 0) + 0.8, (pos.z ?? 0) + 0.6);
    addAnim(c, 0.22, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p)); fx.mesh.material.opacity = 0.8 * (1 - p); });
    spawnHitSpark(pos, { count: 4, color: 0xff9a3c, size: 0.8 * size });
}

/** Trúng lửa (dùng chung — Elarion): loé cam + tia lửa vẽ bằng code */
export function spawnFireHit(pos, { size = 1 } = {}) {
    spawnHitSpark(pos, { count: 7, color: 0xff9a3c, size: 0.9 * size });
    const c = fxPlane(glowTexture(), 1.2 * size, 1.2 * size, { color: 0xff6a00 });
    c.position.set(pos.x, (pos.y ?? 0) + 0.75, (pos.z ?? 0) + 0.6);
    addAnim(c, 0.28, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.2); fx.mesh.material.opacity = 1 - p; });
}

/** Nổ lửa 8 khung (loé → bùng → đỉnh → vỡ → khói) tại chân `pos` */
const BOOM_W = [0.8, 0.9, 1, 1.1, 1.2, 1.5, 1.7, 1.8];
export function spawnFireExplosion(pos, { size = 2.2, life = 0.55 } = {}) {
    const L = life * 1.35;   // thêm thời gian cho khói tan
    const m = fxFrames('boom', size * 1.2);
    m.position.set(pos.x, FLOOR, (pos.z ?? 0) + 0.7);
    addAnim(m, L, (p, fx) => {
        setFx(fx.mesh, weighted(p, BOOM_W));
        fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 1;
    });
    const flash = fxPlane(glowTexture(), size * 1.5, size * 1.5, { color: 0xffb347 });
    flash.position.set(pos.x, FLOOR + size * 0.4, (pos.z ?? 0) + 0.8);
    addAnim(flash, 0.25, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p)); fx.mesh.material.opacity = 1 - p; });
}

// ------------------------------------------------------------
// Thiên Hỏa Cầu
// ------------------------------------------------------------
/** Thiên Hỏa Cầu: thiên thạch khổng lồ rơi xuống (x, z) trong `duration` giây; vòng báo trên đất lớn dần */
export function spawnSkyFireball(x, z, { duration = 0.6, size = 3.2, radius = 5.5, onLand } = {}) {
    const H = size * 1.3;
    const m = fxFrames('meteor', H);
    const glow = fxPlane(glowTexture(), size * 1.1, size * 1.1, { color: 0xff5a00, opacity: 0.7 });
    const g = new THREE.Group();
    g.add(glow, m);
    const rock = H * 0.2;                         // bán kính tảng đá (pivot = tâm đá)
    const y0 = 10, y1 = FLOOR + rock, x0 = x - 0.7;
    m.rotation.z = Math.atan2(x - x0, y0 - y1);  // đuôi lửa ngược hướng rơi
    let landed = false;
    const mark = groundDecal('warn', x, z, radius * 0.9, { lift: 0.03, opacity: 0 });
    const sx = mark.scale.x, sy = mark.scale.y;
    addAnim(mark, duration + 0.1, (p, fx) => {
        const k = 0.55 + 0.45 * easeOut(Math.min(1, p * 1.6));
        fx.mesh.scale.set(sx * k, sy * k, 1);
        fx.mesh.material.opacity = (0.45 + 0.4 * p) * (0.85 + 0.15 * Math.sin(p * 30)) * (p > 0.92 ? (1 - p) / 0.08 : 1);
    });
    const ph = Math.random() * 4;
    addAnim(g, duration, (p, fx) => {
        const e = p * p;
        fx.mesh.position.set(x0 + (x - x0) * e, y0 + (y1 - y0) * e, z + 0.8);
        setFx(m, loopFrame(p * duration, 14, 4, ph));
        if (p >= 1 && !landed) { landed = true; onLand?.(); }
    });
}
/** Thiên Hỏa Cầu chạm đất: nổ lớn + 2 nổ nhỏ + vòng lửa lan sát đất + sóng xung kích + tàn lửa */
export function spawnMeteorImpact(x, z, { size = 4.2, radius = 5.5 } = {}) {
    spawnFireExplosion({ x, z }, { size, life: 0.75 });
    spawnFireExplosion({ x: x - radius * 0.35, z: z + 0.4 }, { size: size * 0.55, life: 0.55 });
    spawnFireExplosion({ x: x + radius * 0.35, z: z - 0.4 }, { size: size * 0.55, life: 0.55 });
    spawnShockwave({ x, z }, { color: 0xff6a1a, radius: radius * 0.5, life: 0.5 });
    const ring = groundDecal('shockRing', x, z, radius * 0.3, { lift: 0.06 });
    const sx = ring.scale.x, sy = ring.scale.y;
    addAnim(ring, 0.6, (p, fx) => { const k = 1 + easeOut(p) * 2.8; fx.mesh.scale.set(sx * k, sy * k, 1); fx.mesh.material.opacity = 1 - p * p; });
    spawnEmbers(x, z, { count: 26, radius: radius * 0.7, life: 1.1 });
}

/** Tàn lửa nhỏ bay lên (dùng chung — Elarion) */
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
 * BIỂN LỬA còn đọng lại sau Thiên Hỏa Cầu: đất cháy nứt dung nham + nhiều cụm lửa bập bùng trong bán kính,
 * mỗi nhịp gây sát thương (server) thì bùng lên 1 chút (pulseBurn).
 */
export function spawnBurnField(x, z, { radius = 5.5, life = 2 } = {}) {
    const glow = fxPlane(glowTexture(), 1, 1, { color: 0xff4000, opacity: 0 });
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, FLOOR + 0.03, z);
    glow.scale.set(radius * 2.4, radius * 1.6, 1);
    addAnim(glow, life, (p, fx) => { fx.mesh.material.opacity = 0.6 * fadeInOut(p, 0.1, 0.75) * (0.85 + 0.15 * Math.sin(p * 40)); });
    const scorch = groundDecal('scorch', x, z, radius * 0.95, { lift: 0.035 });
    addAnim(scorch, life + 0.8, (p, fx) => { fx.mesh.material.opacity = (p < 0.05 ? p / 0.05 : p > 0.7 ? (1 - p) / 0.3 : 1) * 0.95; });
    const n = Math.round(radius * 2.4);
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, r = radius * (0.2 + Math.random() * 0.7);
        const fx0 = x + Math.cos(a) * r, fz0 = z + Math.sin(a) * r * 0.55;
        const h = 0.75 + Math.random() * 0.6;
        const f = fxFrames('flame', h);
        f.position.set(fx0, FLOOR, fz0 + 0.3);
        if (Math.random() < 0.5) f.scale.x = -1;
        const ph = Math.random() * 4, delay = Math.random() * 0.25, fps = 9 + Math.random() * 3;
        addAnim(f, life, (p, fx) => {
            const t = p * life;
            const on = t < delay ? 0 : Math.min(1, (t - delay) / 0.15);
            const end = p > 0.75 ? (1 - p) / 0.25 : 1;
            setFx(fx.mesh, loopFrame(t, fps, 4, ph));
            fx.mesh.scale.y = (0.85 + 0.15 * on) * (0.9 + 0.1 * Math.sin(t * 9 + ph));
            fx.mesh.material.opacity = on * end;
        });
    }
    spawnEmbers(x, z, { count: 18, radius: radius * 0.8, life });
}
/** 1 nhịp cháy của biển lửa */
export function pulseBurn(x, z, { radius = 5.5 } = {}) {
    spawnEmbers(x, z, { count: 10, radius: radius * 0.8, life: 0.7 });
    const f = fxPlane(glowTexture(), 1, 1, { color: 0xff6a00 });
    f.rotation.x = -Math.PI / 2;
    f.position.set(x, FLOOR + 0.06, z);
    addAnim(f, 0.35, (p, fx) => { fx.mesh.scale.set(radius * 2 * (0.8 + p * 0.3), radius * 1.3, 1); fx.mesh.material.opacity = 0.6 * (1 - p); });
}

// ------------------------------------------------------------
// Cột Lửa Phá Ma
// ------------------------------------------------------------
/** Ignar chưởng xuống đất: lửa + đá văng ngang mặt đất + nổ nhỏ + vòng lửa lan */
export function spawnGroundSlam(pos, dir = 1) {
    const x = pos.x + dir * 0.9, z = pos.z ?? 0;
    const s = fxFrames('slam', 1.1);
    s.position.set(x, FLOOR, z + 0.75);
    addAnim(s, 0.42, (p, fx) => {
        fx.mesh.scale.set(dir * (0.55 + easeOut(Math.min(1, p * 2.5)) * 0.6), 0.6 + easeOut(Math.min(1, p * 2.5)) * 0.5, 1);
        fx.mesh.material.opacity = p > 0.55 ? (1 - p) / 0.45 : 1;
    });
    spawnFireExplosion({ x, z }, { size: 1.3, life: 0.35 });
    const ring = groundDecal('shockRing', x, z, 0.6, { lift: 0.06 });
    const sx = ring.scale.x, sy = ring.scale.y;
    addAnim(ring, 0.45, (p, fx) => { const k = 1 + easeOut(p) * 2.2; fx.mesh.scale.set(sx * k, sy * k, 1); fx.mesh.material.opacity = 1 - p; });
    spawnEmbers(x, z, { count: 10, radius: 0.6, life: 0.6 });
}

/**
 * Cột Lửa Phá Ma — giai đoạn 1: vòng phép mờ hiện trên đất ở chỗ quái, sáng dần thành vòng phép rực (`time` giây),
 * tia lửa hút vào giữa.
 */
export function spawnPillarCircle(x, z, { radius = 5, time = 1 } = {}) {
    const dim = groundDecal('circleDim', x, z, radius);
    const lit = groundDecal('circleLit', x, z, radius, { lift: 0.045, opacity: 0 });
    const s0 = [dim.scale.x, dim.scale.y], s1 = [lit.scale.x, lit.scale.y];
    addAnim(dim, time, (p, fx) => {
        const k = 0.35 + easeOut(Math.min(1, p * 2.5)) * 0.65;
        fx.mesh.scale.set(s0[0] * k, s0[1] * k, 1);
        fx.mesh.material.opacity = Math.min(1, p * 4) * (p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1);
    });
    addAnim(lit, time, (p, fx) => {
        const k = 0.35 + easeOut(Math.min(1, p * 2.5)) * 0.65;
        fx.mesh.scale.set(s1[0] * k, s1[1] * k, 1);
        fx.mesh.material.opacity = p < 0.45 ? 0 : Math.min(1, (p - 0.45) / 0.45);
    });
    const glow = fxPlane(glowTexture(), 1, 1, { color: 0xff3d00, opacity: 0 });
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, FLOOR + 0.03, z);
    addAnim(glow, time, (p, fx) => { fx.mesh.scale.set(radius * 2.6, radius * 1.8, 1); fx.mesh.material.opacity = 0.15 + 0.5 * p; });
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

/** Tia lửa nhỏ bắn chéo xuống đất (không còn dùng — giữ cho tương thích) */
export function spawnFireBolt(from, to, { duration = 0.3, onHit } = {}) {
    spawnFireball(from, to, { duration, size: 0.6, onHit });
}

/**
 * Cột Lửa Phá Ma — giai đoạn 2: vòng phép rực + NHIỀU cột lửa phủ kín bán kính (1 cột lớn giữa + vòng cột nhỏ).
 * Mỗi cột: bùng 3 khung -> cháy lặp 3 khung -> tắt 2 khung. Kéo dài hits × gap giây.
 */
export function spawnFirePillar(x, z, { hits = 7, gap = 0.4, radius = 5 } = {}) {
    const total = hits * gap + 0.45;
    const circle = groundDecal('circleLit', x, z, radius);
    addAnim(circle, total, (p, fx) => { fx.mesh.material.opacity = p > 0.88 ? (1 - p) / 0.12 : 1; });
    const glow = fxPlane(glowTexture(), 1, 1, { color: 0xff4a00 });
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, FLOOR + 0.03, z);
    addAnim(glow, total, (p, fx) => { fx.mesh.scale.set(radius * 2.6, radius * 1.8, 1); fx.mesh.material.opacity = 0.7 * (p > 0.85 ? (1 - p) / 0.15 : 1); });
    const cols = [{ dx: 0, dz: 0, h: 5.4, d: 0 }];
    const ring = Math.max(4, Math.round(radius * 1.1));
    for (let i = 0; i < ring; i++) {
        const a = (i / ring) * Math.PI * 2;
        cols.push({ dx: Math.cos(a) * radius * 0.62, dz: Math.sin(a) * radius * 0.4, h: 3.2 + Math.random() * 0.8, d: 0.05 + Math.random() * 0.12 });
    }
    cols.sort((p, q) => p.dz - q.dz);   // cột phía sau vẽ trước
    cols.forEach(cdef => {
        const col = fxFrames('pillar', cdef.h);
        col.position.set(x + cdef.dx, FLOOR, z + cdef.dz + 0.4);
        if (Math.random() < 0.5) col.scale.x = -1;
        const sx = col.scale.x;
        const ph = Math.random() * 3, end = total - cdef.d;
        addAnim(col, total, (p, fx) => {
            const t = p * total - cdef.d;
            fx.mesh.visible = t >= 0;
            if (t < 0) return;
            let f;
            if (t < 0.18) f = Math.floor(t / 0.06);                    // bùng: 0 1 2
            else if (t < end - 0.3) f = 3 + loopFrame(t, 11, 3, ph);   // cháy: 3 4 5 lặp
            else f = t < end - 0.15 ? 6 : 7;                           // tắt: 6 7
            setFx(fx.mesh, f);
            const pulse = 1 + 0.06 * Math.sin(t / gap * Math.PI * 2 + ph);
            fx.mesh.scale.set(sx * pulse, pulse, 1);
            // hơi trong để vẫn thấy quái đứng trong cột lửa
            fx.mesh.material.opacity = (cdef.d ? 0.8 : 0.9) * (p > 0.95 ? (1 - p) / 0.05 : 1);
        });
    });
    spawnShockwave({ x, z }, { color: 0xff5a00, radius: radius * 0.6, life: 0.45 });
    spawnEmbers(x, z, { count: 30, radius: radius * 0.8, life: total });
}
/** 1 nhịp cột lửa trúng quái: tia lửa + biểu tượng giáp phép vỡ trên đầu */
export function spawnPillarHit(pos, { stackBreak = false } = {}) {
    spawnHitSpark(pos, { count: 4, color: 0xff7b2a, size: 0.7 });
    if (!stackBreak) return;
    const icon = fxFrames('breakIcon', 0.62);
    icon.position.set(pos.x, (pos.y ?? 0) + 2.9, (pos.z ?? 0) + 0.7);
    const y0 = icon.position.y;
    addAnim(icon, 0.9, (p, fx) => {
        fx.mesh.position.y = y0 + p * 0.4;
        fx.mesh.scale.setScalar(p < 0.15 ? 0.5 + p / 0.15 * 0.5 : 1);
        fx.mesh.material.opacity = p > 0.6 ? (1 - p) / 0.4 : 1;
    });
}

// ------------------------------------------------------------
// Hỏa Thần Giáng Lâm
// ------------------------------------------------------------
/** Vòng triệu hồi lửa dưới chân + hào quang lửa bốc quanh người (gồng Hỏa Thần; nhỏ hơn khi niệm KN1 / KN2) */
export function spawnSummonCircle(pos, { life = 1.6, size = 4.2 } = {}) {
    const c = groundDecal('summonCircle', pos.x, pos.z ?? 0, size * 0.55, { lift: 0.05 });
    const sx = c.scale.x, sy = c.scale.y;
    addAnim(c, life, (p, fx) => {
        const k = 0.4 + easeOut(Math.min(1, p * 3)) * 0.6;
        fx.mesh.scale.set(sx * k, sy * k, 1);
        fx.mesh.rotation.z = p * 0.6;
        fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 1;
    });
    const H = size >= 4 ? 3.3 : 2.6;
    const aura = fxFrames('aura', H, { opacity: 0.85 });
    aura.position.set(pos.x, FLOOR, (pos.z ?? 0) + 0.3);
    addAnim(aura, life, (p, fx) => {
        setFx(fx.mesh, loopFrame(p * life, 10, 4));
        fx.mesh.scale.y = 0.6 + 0.4 * easeOut(Math.min(1, p * 4));
        fx.mesh.material.opacity = 0.88 * fadeInOut(p, 0.1, 0.85);
    });
}
/** Lúc Hỏa Thần hiện ra / Giáp Lửa bật: đôi cánh lửa bung sau lưng (nhìn nghiêng) + sóng lửa. dir: 1 nhìn phải, -1 nhìn trái */
export function spawnFireWings(pos, { size = 4, dir = 1 } = {}) {
    const H = size * 0.85;
    const mk = (k, dx, dy, dz, op) => {
        const w = fxFrames('wing', H * k, { opacity: 0 });
        w.position.set(pos.x - dir * 0.2 + dir * dx, (pos.y ?? 0) + 1.55 + dy, (pos.z ?? 0) + dz);
        addAnim(w, 1.0, (p, fx) => {
            setFx(fx.mesh, p < 0.3 ? Math.floor(p / 0.1) : 3);
            const s = 0.75 + 0.25 * easeOut(Math.min(1, p * 2.5));
            fx.mesh.scale.set(dir * s, s, 1);
            fx.mesh.material.opacity = op * (p > 0.55 ? (1 - p) / 0.45 : 1);
        });
    };
    mk(0.82, 0.35, 0.18, -0.45, 0.75);   // cánh xa (nhô lên sau cánh gần)
    mk(1, 0, 0, -0.3, 1);
    spawnShockwave(pos, { color: 0xff6a1a, radius: 3, life: 0.6 });
}
/** Hỏa Chưởng: luồng lửa hình nón phụt ra trước tay (gốc luồng = lòng bàn tay) */
export function spawnPalmFlash(from, dir = 1, { size = 1.3 } = {}) {
    const m = fxFrames('palm', size * 1.35);
    m.position.set(from.x, from.y, (from.z ?? 0) + 0.7);
    addAnim(m, 0.3, (p, fx) => {
        setFx(fx.mesh, Math.floor(p * 4));
        fx.mesh.scale.set(dir, 1, 1);
        fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 1;
    });
}

/**
 * Hộ Vệ Thần Lửa: bay lơ lửng sau lưng Ignar. Trả về { group, update(dt, pos, facingLeft), throwPose(), roar(), handPoint(), dispose() }.
 * Khung: 0-3 bay lặp · 4 vung tay lấy đà · 5 ném · 6-7 gầm.
 */
export function makeFireGuardian() {
    const H = 3.4;
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 4.2, 4.2, { color: 0xff5a00, opacity: 0.4 });
    glow.position.y = 0.2;
    const body = fxFrames('guard', H);
    g.add(glow, body);
    const tip = FX.groups.guard.tip ?? [80, 0];
    const u = body.userData.fx.u;
    let seq = null, t = 0, appear = 0;
    const play = (steps) => { seq = { steps, i: 0, left: steps[0][1] }; setFx(body, steps[0][0]); };
    return {
        group: g,
        roar() { play([[6, 0.25], [7, 0.65]]); },
        throwPose() { play([[4, 0.2], [5, 0.32]]); },
        /** điểm bàn tay ném cầu lửa (toạ độ thế giới) */
        handPoint() {
            const p = new THREE.Vector3(); body.getWorldPosition(p);
            const fl = g.scale.x < 0 ? -1 : 1;
            return { x: p.x + fl * tip[0] * u, y: p.y - tip[1] * u, z: p.z };
        },
        update(dt, pos, facingLeft) {
            t += dt; appear = Math.min(1, appear + dt * 2.5);
            if (seq) {
                seq.left -= dt;
                if (seq.left <= 0) {
                    seq.i++;
                    if (seq.i >= seq.steps.length) seq = null;
                    else { seq.left = seq.steps[seq.i][1]; setFx(body, seq.steps[seq.i][0]); }
                }
            }
            if (!seq) setFx(body, loopFrame(t, 7, 4));
            const side = facingLeft ? 1 : -1;   // đứng SAU lưng Ignar
            g.position.set(pos.x + side * 1.5, 2.0 + Math.sin(t * 2.2) * 0.15, (pos.z ?? 0) - 0.35);
            g.scale.set((facingLeft ? -1 : 1) * appear, appear, 1);
            body.material.opacity = appear;
            glow.material.opacity = 0.28 + 0.08 * Math.sin(t * 9);
        },
        dispose() {
            g.parent?.remove(g);
            body.geometry.dispose(); body.material.dispose(); glow.geometry.dispose(); glow.material.dispose();
        },
    };
}
/** Ngọn lửa nhỏ lơ lửng trên lòng bàn tay (luôn cầm) — 4 khung lặp, gốc lửa ở lòng bàn tay */
export function makePalmFire() {
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 0.7, 0.7, { color: 0xff7a1a, opacity: 0.55 });
    glow.position.y = 0.05;
    const f = fxFrames('hand', 0.6);
    f.position.y = -0.14;
    g.add(glow, f);
    let t = Math.random() * 3;
    return {
        group: g,
        update(dt) {
            t += dt;
            setFx(f, loopFrame(t, 11, 4));
            f.scale.set(1 + 0.04 * Math.sin(t * 13), 1 + 0.05 * Math.sin(t * 11 + 1), 1);
            glow.material.opacity = 0.45 + 0.15 * Math.sin(t * 17);
        },
    };
}

/** Khiên Lửa của Ignar (lúc Hỏa Thần / Giáp Lửa): vòng lửa bao quanh người (4 khung lặp) + 3 ngọn lửa bay vòng */
export function makeFireShield() {
    const g = new THREE.Group();
    const ring = fxFrames('shield', 3.3, { opacity: 0 });
    ring.position.set(0, 1.25, 0.35);
    const inner = fxPlane(glowTexture(), 2.6, 3.0, { color: 0xff6a1a, opacity: 0 });
    inner.position.set(0, 1.25, 0.3);
    g.add(inner, ring);
    const flames = [0, 1, 2].map(() => { const f = fxFrames('hand', 0.5); g.add(f); return f; });
    let t = 0, k = 0;
    return {
        group: g,
        update(dt) {
            t += dt; k = Math.min(1, k + dt * 3);
            setFx(ring, loopFrame(t, 9, 4));
            ring.scale.setScalar(k * (1 + 0.025 * Math.sin(t * 6)));
            ring.material.opacity = k * (0.68 + 0.1 * Math.sin(t * 4));
            inner.material.opacity = k * 0.16;
            flames.forEach((f, i) => {
                const a = t * 2.4 + i * (Math.PI * 2 / 3);
                f.position.set(Math.cos(a) * 1.2, 1.0 + Math.sin(a * 2) * 0.55, 0.35 + Math.sin(a) * 0.6);
                setFx(f, loopFrame(t, 11, 4, i));
                f.material.opacity = k * (0.55 + 0.45 * (Math.sin(a) * 0.5 + 0.5));
            });
        },
        dispose() { g.parent?.remove(g); },
    };
}
