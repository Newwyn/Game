// ============================================================
// HIỆU ỨNG LỤC ĐỘC — Grix (Phù Thủy Độc Goblin) — bản 2: chạy khung (flipbook)
// ============================================================
// Hình lấy từ atlas grix_fx2.webp (src/vfx/grixFx2.json):
//   vial (lọ độc nhỏ 4 lặp) · hit (trúng độc 4) · flask (bình độc 4 lặp) · flaskAlly (bình hồi máu 4 lặp)
//   splash (bình vỡ 8, đáy = mặt đất) · warn (vòng báo đất) · puddle (vũng axit đất) · bog (đầm lầy 4 lặp đất)
//   wardRing (vòng lục giác chân khiên) · shock (vòng sóng độc lan) · cauldronIn (vạc hiện ra 4) · cauldronBoil (vạc sôi 4 lặp)
//   glob (cục bùn độc 4 lặp) · fumes (khói độc bốc lên 4 lặp) · boom (nổ độc đầu lâu 8) · vortex (lốc độc quanh người 4 lặp)
//   snap (loé búng tay) · rotSkull (ấn đầu lâu mục rữa) · dome (vòm giáp độc lục giác) · wisp (hồn độc bay)
import * as THREE from 'three';
import fxUrl from '../assets/sprites/grix_fx2.webp';
import FX from './grixFx2.json';
import { GROUND_Y, gameNow } from '../config.js';
import {
    addAnim, fxPlane, glowTexture,
    easeOut, spawnHitSpark, spawnShockwave, fxBudget,
} from './vfx.js';
import { makeFlipbook, FLOOR, loopFrame, weighted, fadeInOut } from './flipbook.js';

const FB = makeFlipbook(fxUrl, FX);
FB.tex('vial');
export const grixFrames = FB.frames;
const setFx = FB.set;
const groundDecal = FB.decal;

const LIME = 0xa3e635;
const ACID = 0x84cc16;
const PURPLE_LIGHT = 0xa855f7;
const ALLY_GOLD = 0xfde047;
const ALLY_MINT = 0x4ade80;

const SPLASH_W = [0.75, 0.85, 0.95, 1.05, 1.15, 1.3, 1.45, 1.6];
const BOOM_W = [0.7, 0.8, 0.95, 1.15, 1.35, 1.3, 1.45, 1.6];
const NUM_TEX = new Map();

function makeCanvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

// ------------------------------------------------------------
// 1. ĐÁNH THƯỜNG — ném lọ thuốc độc nhỏ (`vial`) + trúng (`hit`)
// ------------------------------------------------------------
/**
 * Lọ thuốc độc nhỏ (`vial` 4 khung lặp) bay vòng cung từ `from` tới `to`, chạm mục tiêu sau `duration` giây.
 * Hình vẽ bay sang PHẢI (vệt đuôi bên trái); bay sang trái thì lật `scale.x = -1`.
 */
export function spawnGoblinVial(from, to, { duration = 0.27, size = 0.72, onHit } = {}) {
    const m = grixFrames('vial', size);
    const glow = fxPlane(glowTexture(), size * 1.3, size * 1.3, { color: ACID, opacity: 0.45 });
    const g = new THREE.Group();
    g.add(glow, m);

    const dx = to.x - from.x;
    const y0 = from.y ?? 1.1;
    const dy = (to.y ?? 0.9) - y0;
    const z0 = (from.z ?? 0) + 0.55;
    const z1 = (to.z ?? 0) + 0.6;
    const arc = 0.95 + Math.min(0.8, Math.abs(dx) * 0.06);
    const left = dx < 0;
    m.scale.x = left ? -1 : 1;
    const ph = Math.random() * 4;
    let hit = false;

    addAnim(g, duration, (p, fx) => {
        const x = from.x + dx * p;
        const y = y0 + dy * p + Math.sin(p * Math.PI) * arc;
        const z = z0 + (z1 - z0) * p;
        fx.mesh.position.set(x, y, z);

        const vy = dy + Math.cos(p * Math.PI) * Math.PI * arc;
        const ax = Math.max(0.001, Math.abs(dx));
        m.rotation.z = (left ? -Math.atan2(vy, ax) : Math.atan2(vy, ax)) * 0.65;
        setFx(m, loopFrame(p * duration, 16, 4, ph));
        glow.scale.setScalar(0.9 + 0.16 * Math.sin(p * 26));

        if (p >= 1 && !hit) {
            hit = true;
            onHit?.();
        }
    });
}

/** Bọt độc bắn tung khi lọ độc / bình độc trúng mục tiêu (`hit` 4 khung ~0.3s) */
export function spawnPoisonSplash(pos, { size = 1, tint = null } = {}) {
    const y0 = (pos.y ?? 0) + 0.85;
    const z0 = (pos.z ?? 0) + 0.65;

    const m = grixFrames('hit', 1.35 * size);
    if (tint) m.material.color.set(tint);
    m.position.set(pos.x, y0, z0);
    addAnim(m, 0.3, (p, fx) => {
        setFx(fx.mesh, Math.min(3, Math.floor(p * 4)));
        fx.mesh.material.opacity = p > 0.82 ? (1 - p) / 0.18 : 1;
    });

    const flash = fxPlane(glowTexture(), 1.05 * size, 1.05 * size, { color: tint ?? LIME, opacity: 0.65 });
    flash.position.set(pos.x, y0, z0 - 0.02);
    addAnim(flash, 0.22, (p, fx) => {
        fx.mesh.scale.setScalar(0.6 + easeOut(p) * 0.9);
        fx.mesh.material.opacity = 0.65 * (1 - p);
    });

    spawnHitSpark(pos, { count: fxBudget(4, 2), color: tint ?? LIME, size: 0.78 * size });
}

// ------------------------------------------------------------
// 2. KN1: BÌNH ĐỘC VĂNG — `flask` / `flaskAlly` + `warn` decal + `splash` + `puddle`
// ------------------------------------------------------------
const recentFlaskSplashes = [];

/**
 * Ném bình độc lớn (`flask` / `flaskAlly`) tới điểm `{ x, z }`, chạm đất sau `duration` giây;
 * vòng cảnh báo `warn` lớn dần dưới điểm rơi.
 */
export function spawnGoblinFlask(from, to, { duration = 0.47, radius = 3.5, kind = 'near', onLand } = {}) {
    const isAlly = kind === 'ally';
    const tx = to.x, tz = to.z ?? 0;

    // Vòng cảnh báo `warn` trên mặt đất lớn dần dưới điểm rơi
    const warn = groundDecal('warn', tx, tz, radius * 0.92, { lift: 0.03, opacity: 0 });
    if (isAlly) warn.material.color.set(ALLY_GOLD);
    const wsx = warn.scale.x, wsy = warn.scale.y;
    addAnim(warn, duration, (p, fx) => {
        const k = 0.42 + 0.58 * easeOut(Math.min(1, p * 1.5));
        fx.mesh.scale.set(wsx * k, wsy * k, 1);
        fx.mesh.material.opacity = (0.4 + 0.45 * p) * (p > 0.9 ? (1 - p) / 0.1 : 1);
    });

    // Bình độc (`flask` hoặc `flaskAlly`) bay theo quỹ đạo vòng cung
    const flask = grixFrames(isAlly ? 'flaskAlly' : 'flask', 1.15);
    const glow = fxPlane(glowTexture(), 1.35, 1.35, { color: isAlly ? ALLY_GOLD : LIME, opacity: 0.5 });
    const g = new THREE.Group();
    g.add(glow, flask);

    const dx = tx - from.x;
    const y0 = from.y ?? 1.2;
    const y1 = FLOOR + 0.25;
    const z0 = (from.z ?? 0) + 0.6;
    const z1 = tz + 0.65;
    const arc = 2.45 + Math.min(1.7, Math.hypot(dx, z1 - z0) * 0.11);
    const left = dx < 0;
    flask.scale.x = left ? -1 : 1;
    const ph = Math.random() * 4;
    let landed = false;

    addAnim(g, duration, (p, fx) => {
        const x = from.x + dx * p;
        const y = y0 + (y1 - y0) * p + Math.sin(p * Math.PI) * arc;
        const z = z0 + (z1 - z0) * p;
        fx.mesh.position.set(x, y, z);

        setFx(flask, loopFrame(p * duration, 14, 4, ph));
        const vy = (y1 - y0) + Math.cos(p * Math.PI) * Math.PI * arc;
        const ax = Math.max(0.001, Math.abs(dx));
        flask.rotation.z = (left ? -Math.atan2(vy, ax) : Math.atan2(vy, ax)) * 0.35;
        glow.scale.setScalar(0.95 + 0.18 * Math.sin(p * 28));

        if (p >= 1 && !landed) {
            landed = true;
            onLand?.();
        }
    });
}

/**
 * Bình độc chạm đất vỡ tung: `splash` 8 khung (~0.75s, gốc ở đáy trên mặt đất) + `puddle` decal mờ dần ~0.8s.
 * Bình `ally`: nhuộm vàng-ngọc (`ALLY_GOLD`) + loé `hit` hạt sáng hồi máu.
 */
export function spawnFlaskSplash(pos, { radius = 3.5, kind = 'near' } = {}) {
    const x = pos.x, z = pos.z ?? 0;
    const now = performance.now();
    for (let i = recentFlaskSplashes.length - 1; i >= 0; i--) {
        if (now - recentFlaskSplashes[i].t > 260) recentFlaskSplashes.splice(i, 1);
    }
    if (recentFlaskSplashes.some(s => Math.hypot(s.x - x, s.z - z) < 0.35 && s.kind === kind)) return;
    recentFlaskSplashes.push({ x, z, kind, t: now });

    const isAlly = kind === 'ally';

    // 1. Vũng axit `puddle` loang trên mặt đất rồi mờ dần (~0.8s)
    const puddle = groundDecal('puddle', x, z, radius * 0.92, { lift: 0.03, opacity: 0 });
    if (isAlly) puddle.material.color.set(ALLY_GOLD);
    const psx = puddle.scale.x, psy = puddle.scale.y;
    addAnim(puddle, 0.82, (p, fx) => {
        const k = 0.6 + 0.4 * easeOut(Math.min(1, p * 2.8));
        fx.mesh.scale.set(psx * k, psy * k, 1);
        fx.mesh.material.opacity = 0.9 * fadeInOut(p, 0.08, 0.55);
    });

    // 2. Bình vỡ `splash` 8 khung (~0.75s, pivot ở đáy chạm đất)
    const H = Math.max(2.2, radius * 0.86);
    const sp = grixFrames('splash', H);
    sp.position.set(x, FLOOR + 0.02, z + 0.55);
    if (isAlly) sp.material.color.set(ALLY_GOLD);
    addAnim(sp, 0.75, (p, fx) => {
        setFx(fx.mesh, weighted(p, SPLASH_W));
        fx.mesh.material.opacity = p > 0.78 ? (1 - p) / 0.22 : 1;
    });

    if (isAlly) {
        // Lớp cộng sáng vàng + hiệu ứng `hit` lấp lánh cho bình đồng minh
        const shine = grixFrames('splash', H, { additive: true, opacity: 0 });
        shine.material.color.set(ALLY_GOLD);
        shine.position.set(x, FLOOR + 0.02, z + 0.56);
        addAnim(shine, 0.75, (p, fx) => {
            setFx(fx.mesh, weighted(p, SPLASH_W));
            fx.mesh.material.opacity = 0.45 * (1 - p);
        });
        spawnPoisonSplash({ x, y: 0.15, z }, { size: 0.85, tint: ALLY_GOLD });
        spawnHitSpark({ x, y: 0.3, z }, { count: fxBudget(6, 3), color: ALLY_GOLD, size: 0.95 });
    }

    // 3. Quầng sáng phụ nhẹ ở tâm
    const flash = fxPlane(glowTexture(), radius * 0.95, radius * 0.95, { color: isAlly ? ALLY_GOLD : LIME, opacity: 0.6 });
    flash.position.set(x, FLOOR + 0.65, z + 0.5);
    addAnim(flash, 0.26, (p, fx) => {
        fx.mesh.scale.setScalar(0.55 + easeOut(p) * 0.95);
        fx.mesh.material.opacity = 0.6 * (1 - p);
    });
}

// ------------------------------------------------------------
// 3. KN2: ĐẦM LẦY THỐI RỮA — `cauldronIn` · `cauldronBoil` · `glob` · `bog` · `fumes`
// ------------------------------------------------------------
const activeCauldrons = new Map();

function cauldronKey(casterId, casterIdx) {
    return `${casterId ?? 'g'}:${casterIdx ?? 0}`;
}

/**
 * Triệu hồi 2 vạc đồng tại `spots = [{x,z}, {x,z}]`:
 * `cauldronIn` (4 khung ~0.35s) rồi chuyển sang `cauldronBoil` lặp (~8 fps).
 */
export function spawnGoblinCauldrons(casterId, casterIdx, spots = [], { totalLife = 9.0 } = {}) {
    endGoblinCauldrons(casterId, casterIdx, true);
    if (!spots.length) return;

    const H = 2.05;
    const Hin = H * (FX.groups.cauldronIn.size[1] / FX.groups.cauldronBoil.size[1]);

    const entries = spots.map((sp, idx) => {
        const x = sp.x ?? 0;
        const z = sp.z ?? 0;

        const root = new THREE.Group();
        root.position.set(x, FLOOR + 0.02, z + 0.45);

        const pivot = new THREE.Group();
        const backGlow = fxPlane(glowTexture(), 2.1, 2.1, { color: LIME, opacity: 0.4 });
        backGlow.position.set(0, H * 0.45, -0.03);

        const inMesh = grixFrames('cauldronIn', Hin);
        const boilMesh = grixFrames('cauldronBoil', H);
        boilMesh.visible = false;
        const shineMesh = grixFrames('cauldronBoil', H, { additive: true, opacity: 0 });
        shineMesh.material.color.set(LIME);
        shineMesh.position.z = 0.01;
        shineMesh.visible = false;

        pivot.add(backGlow, inMesh, boilMesh, shineMesh);
        root.add(pivot);

        const state = {
            x,
            z,
            idx,
            root,
            pivot,
            inMesh,
            boilMesh,
            shineMesh,
            backGlow,
            chargeElapsed: 0,
            chargeDur: 0,
            recoil: 0,
            sinking: false,
            sinkT: 0,
            fumeTimer: 0.35 + idx * 0.15,
            dead: false,
        };

        addAnim(root, totalLife, (p, fx, dt) => {
            if (state.dead) return;
            const age = p * totalLife;

            // `cauldronEnd`: chạy `cauldronIn` ngược (3 -> 0) + mờ dần (~0.35s)
            if (state.sinking) {
                state.sinkT = Math.min(1, state.sinkT + dt / 0.35);
                const k = 1 - state.sinkT;
                inMesh.visible = true;
                boilMesh.visible = false;
                shineMesh.visible = false;
                setFx(inMesh, Math.max(0, Math.min(3, 3 - Math.floor(state.sinkT * 4))));
                inMesh.material.opacity = k;
                backGlow.material.opacity = 0.4 * k;
                pivot.scale.set(1 + 0.08 * state.sinkT, 0.9 + 0.1 * k, 1);
                if (state.sinkT >= 1) {
                    state.dead = true;
                    root.visible = false;
                }
                return;
            }

            // Giai đoạn hiện ra: `cauldronIn` 4 khung trong 0.35s đầu
            if (age < 0.35) {
                const u = age / 0.35;
                inMesh.visible = true;
                boilMesh.visible = false;
                shineMesh.visible = false;
                setFx(inMesh, Math.min(3, Math.floor(u * 4)));
                inMesh.material.opacity = Math.min(1, u * 3);
                backGlow.material.opacity = 0.38 * u;
                return;
            }

            inMesh.visible = false;
            boilMesh.visible = true;
            const boilT = age - 0.35;
            const bf = loopFrame(boilT, 8, 4, idx * 2);
            setFx(boilMesh, bf);

            // Gồng nạp (`cauldronCharge`): rung + phập phồng + sáng rực hơn (lớp additive + nhân màu > 1)
            let chargeRatio = 0;
            if (state.chargeDur > 0) {
                state.chargeElapsed += dt;
                chargeRatio = Math.min(1, state.chargeElapsed / state.chargeDur);
                if (state.chargeElapsed >= state.chargeDur) state.chargeDur = 0;
            }

            // Độ giật lùi khi vừa bắn (`cauldronShot`)
            state.recoil = Math.max(0, state.recoil - dt * 5);

            const pulse = Math.sin(age * (7 + chargeRatio * 14) + idx * 1.5) * (0.03 + 0.065 * chargeRatio);
            const shakeX = chargeRatio > 0.05 ? (Math.random() - 0.5) * 0.08 * chargeRatio : 0;
            const sx = 1 + pulse + 0.2 * state.recoil;
            const sy = 1 - pulse - 0.18 * state.recoil;
            pivot.scale.set(sx, sy, 1);
            pivot.position.x = shakeX;
            pivot.rotation.z = Math.sin(age * (5 + chargeRatio * 12) + idx) * (0.025 + 0.06 * chargeRatio);

            const bright = 1 + 0.35 * chargeRatio;
            boilMesh.material.color.setRGB(bright, bright, bright);
            shineMesh.visible = chargeRatio > 0.02 || state.recoil > 0.05;
            if (shineMesh.visible) {
                setFx(shineMesh, bf);
                shineMesh.material.opacity = Math.min(0.85, 0.58 * chargeRatio + 0.45 * state.recoil);
            }

            backGlow.scale.setScalar(1 + 0.3 * chargeRatio + 0.1 * Math.sin(age * 10));
            backGlow.material.opacity = 0.38 + 0.38 * chargeRatio;

            // Thỉnh thoảng nhả làn khói `fumes` mảnh khi đang gồng mạnh
            state.fumeTimer -= dt * (1 + chargeRatio * 1.2);
            if (state.fumeTimer <= 0) {
                state.fumeTimer = 0.55 + Math.random() * 0.25;
                spawnCauldronFume(x, z, { height: 1.05 + 0.25 * chargeRatio });
            }
        });

        return state;
    });

    activeCauldrons.set(cauldronKey(casterId, casterIdx), entries);
}

function spawnCauldronFume(x, z, { height = 1.1 } = {}) {
    const f = grixFrames('fumes', height, { opacity: 0 });
    if (Math.random() < 0.5) f.scale.x = -1;
    const sx = f.scale.x;
    const ph = Math.random() * 4;
    const ox = (Math.random() - 0.5) * 0.35;
    addAnim(f, 0.55, (p, fx) => {
        setFx(fx.mesh, loopFrame(p * 0.55, 8, 4, ph));
        fx.mesh.position.set(x + ox, FLOOR + 1.1 + p * 0.55, z + 0.48);
        fx.mesh.scale.set(sx * (0.85 + 0.25 * p), 0.85 + 0.3 * p, 1);
        fx.mesh.material.opacity = 0.72 * fadeInOut(p, 0.15, 0.65);
    });
}

/** `cauldronCharge`: cả 2 vạc đồng của Grix rung + sáng rực dần trong `chargeMs` ms */
export function chargeGoblinCauldrons(casterId, casterIdx, { chargeMs = 2000, fallbackPos = null } = {}) {
    const key = cauldronKey(casterId, casterIdx);
    if (!activeCauldrons.has(key) && fallbackPos) {
        spawnGoblinCauldrons(casterId, casterIdx, [
            { x: fallbackPos.x - 1.4, z: (fallbackPos.z ?? 0) - 1.2 },
            { x: fallbackPos.x - 1.4, z: (fallbackPos.z ?? 0) + 1.2 },
        ]);
    }
    const list = activeCauldrons.get(key);
    if (!list) return;
    const dur = Math.max(0.2, chargeMs / 1000);
    for (const c of list) {
        c.chargeElapsed = 0;
        c.chargeDur = dur;
    }
}

/**
 * `cauldronShot`: vạc thứ `cauldronIdx` giật nhẹ và bắn cục bùn sọ độc (`glob` 4 khung lặp)
 * bay theo quỹ đạo tới `(to.x, to.z)` trong `flightMs` ms, rồi tạo đầm lầy (`spawnGoblinBog`).
 */
export function shootGoblinCauldron(casterId, casterIdx, cauldronIdx, from, to, {
    flightMs = 550,
    radius = 4.5,
    durationMs = 5000,
    onLand,
} = {}) {
    const list = activeCauldrons.get(cauldronKey(casterId, casterIdx));
    const c = list?.[cauldronIdx ?? 0] ?? list?.[0];
    if (c) {
        c.recoil = 1;
        c.chargeDur = 0;
    }

    const sx = from?.x ?? c?.x ?? to.x;
    const sz = from?.z ?? c?.z ?? (to.z ?? 0);
    const tx = to.x;
    const tz = to.z ?? 0;
    const flight = Math.max(0.18, flightMs / 1000);

    // Vòng cảnh báo `warn` nơi cục bùn sắp rơi
    const warn = groundDecal('warn', tx, tz, radius * 0.9, { lift: 0.03, opacity: 0 });
    const wsx = warn.scale.x, wsy = warn.scale.y;
    addAnim(warn, flight, (p, fx) => {
        const k = 0.4 + 0.6 * easeOut(p);
        fx.mesh.scale.set(wsx * k, wsy * k, 1);
        fx.mesh.material.opacity = 0.55 * Math.sin(p * Math.PI);
    });

    // Cục bùn độc có mặt đầu lâu (`glob` 4 khung lặp; bay phải, lật gương khi bay trái)
    const glob = grixFrames('glob', 1.15);
    const halo = fxPlane(glowTexture(), 1.45, 1.45, { color: ACID, opacity: 0.5 });
    const g = new THREE.Group();
    g.add(halo, glob);

    const dx = tx - sx;
    const y0 = FLOOR + 1.15;
    const y1 = FLOOR + 0.22;
    const z0 = sz + 0.58;
    const z1 = tz + 0.62;
    const arc = 2.1 + Math.min(1.5, Math.hypot(dx, z1 - z0) * 0.1);
    const left = dx < 0;
    glob.scale.x = left ? -1 : 1;
    const ph = Math.random() * 4;
    let landed = false;

    addAnim(g, flight, (p, fx) => {
        const x = sx + dx * p;
        const y = y0 + (y1 - y0) * p + Math.sin(p * Math.PI) * arc;
        const z = z0 + (z1 - z0) * p;
        fx.mesh.position.set(x, y, z);

        setFx(glob, loopFrame(p * flight, 14, 4, ph));
        const vy = (y1 - y0) + Math.cos(p * Math.PI) * Math.PI * arc;
        const ax = Math.max(0.001, Math.abs(dx));
        glob.rotation.z = (left ? -Math.atan2(vy, ax) : Math.atan2(vy, ax)) * 0.45;
        halo.scale.setScalar(0.95 + 0.18 * Math.sin(p * 24));

        if (p >= 1 && !landed) {
            landed = true;
            spawnFlaskSplash({ x: tx, z: tz }, { radius: Math.min(radius * 0.72, 2.7), kind: 'bog_land' });
            spawnGoblinBog(tx, tz, { radius, duration: Math.max(0.5, durationMs / 1000) });
            onLand?.();
        }
    });
}

/** `cauldronEnd`: 2 vạc đồng chạy ngược `cauldronIn` (khung 3 -> 0) và mờ dần */
export function endGoblinCauldrons(casterId, casterIdx, immediate = false) {
    const key = cauldronKey(casterId, casterIdx);
    const list = activeCauldrons.get(key);
    if (!list) return;
    activeCauldrons.delete(key);

    for (const c of list) {
        if (immediate) {
            c.dead = true;
            c.root.visible = false;
            continue;
        }
        c.sinking = true;
        c.sinkT = 0;
    }
}

/**
 * Đầm lầy độc tại `(x, z)` bán kính `radius` tồn tại `duration` giây:
 * `bog` decal lặp (~6 fps) + 3 cột khói `fumes` bốc lên trên mặt đầm, hiện/tắt mượt mà.
 */
export function spawnGoblinBog(x, z, { radius = 4.5, duration = 5.0 } = {}) {
    const tz = z ?? 0;
    const fadeIn = Math.min(0.12, 0.35 / Math.max(0.5, duration));
    const fadeOut = Math.max(0.82, 1 - 0.55 / Math.max(0.5, duration));

    const pool = groundDecal('bog', x, tz, radius, { lift: 0.035, opacity: 0 });
    const psx = pool.scale.x, psy = pool.scale.y;
    const ph0 = Math.random() * 4;
    addAnim(pool, duration, (p, fx) => {
        const t = p * duration;
        const alpha = fadeInOut(p, fadeIn, fadeOut);
        const k = 0.65 + 0.35 * easeOut(Math.min(1, p / fadeIn));
        fx.mesh.scale.set(psx * k, psy * k, 1);
        setFx(fx.mesh, loopFrame(t, 6, 4, ph0));
        fx.mesh.material.opacity = 0.94 * alpha;
    });

    const glow = fxPlane(glowTexture(), 1, 1, { color: ACID, opacity: 0 });
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, FLOOR + 0.02, tz);
    addAnim(glow, duration, (p, fx) => {
        const alpha = fadeInOut(p, fadeIn, fadeOut);
        fx.mesh.scale.set(radius * 2.1, radius * 1.4, 1);
        fx.mesh.material.opacity = 0.3 * alpha * (0.85 + 0.15 * Math.sin(p * duration * 5));
    });

    // 3 tấm khói độc (`fumes` 4 khung lặp) bốc lên trên mặt đầm lầy
    const fumeSpots = [
        { dx: -radius * 0.36, dz: 0.12, h: 1.45, flip: 1 },
        { dx: radius * 0.38, dz: -0.18, h: 1.35, flip: -1 },
        { dx: 0.05, dz: 0.28, h: 1.6, flip: 1 },
    ];
    fumeSpots.forEach((fs, i) => {
        const fume = grixFrames('fumes', fs.h, { opacity: 0 });
        fume.scale.x = fs.flip;
        const ph = i * 1.3 + Math.random();
        const fps = 6.5 + i * 0.7;
        addAnim(fume, duration, (p, fx) => {
            const t = p * duration;
            const alpha = fadeInOut(p, fadeIn, fadeOut);
            const cycle = (t * 0.85 + i * 0.33) % 1;
            const cFade = Math.sin(cycle * Math.PI);
            setFx(fx.mesh, loopFrame(t, fps, 4, ph));
            fx.mesh.position.set(
                x + fs.dx + Math.sin(t * 2 + i) * 0.16,
                FLOOR + 0.04 + cycle * 0.42,
                tz + fs.dz + 0.35,
            );
            const sy = 0.85 + 0.25 * cycle;
            fx.mesh.scale.set(fs.flip * (0.9 + 0.15 * cFade), sy, 1);
            fx.mesh.material.opacity = 0.85 * alpha * (0.35 + 0.65 * cFade);
        });
    });
}

/** Nhịp sát thương của Đầm Lầy (`bogTick`): vòng `shock` lan nhẹ + khói `fumes` bốc lên */
export function pulseGoblinBog(x, z, { radius = 4.5 } = {}) {
    const tz = z ?? 0;
    const ring = groundDecal('shock', x, tz, radius * 0.45, { lift: 0.05, opacity: 0.78 });
    const rsx = ring.scale.x, rsy = ring.scale.y;
    addAnim(ring, 0.45, (p, fx) => {
        const k = 1 + easeOut(p) * 1.25;
        fx.mesh.scale.set(rsx * k, rsy * k, 1);
        fx.mesh.material.opacity = 0.78 * (1 - p);
    });
    spawnCauldronFume(x + (Math.random() - 0.5) * radius * 0.7, tz, { height: 1.25 });
}

// ------------------------------------------------------------
// 4. NIỆM PHÉP & KN3: ĐẠI BỘC PHÁ ĐỘC (`vortex` · `snap` · `boom` · `wisp`)
// ------------------------------------------------------------
/**
 * Gắn bộ cập nhật riêng cho view của Grix:
 *   - Điều khiển `view._hover` + lốc xoáy `vortex` theo độ cao khi đang bay KN3 (`goblin_float` hoặc `_goblinFloatUntil`)
 *   - Duy trì vòm Giáp Độc `dome` + `wardRing` (`goblin_ward` hoặc `_goblinWardUntil`)
 */
export function ensureGoblinView(view) {
    if (!view || view._goblinHooked) return;
    view._goblinHooked = true;
    const origUpdateStatus = view._updateStatusFx?.bind(view);
    view._updateStatusFx = function (dt) {
        if (origUpdateStatus) origUpdateStatus(dt);
        updateGoblinViewState(this, dt);
    };
}

function updateGoblinViewState(view, dt) {
    const now = gameNow();
    const effs = view.member?.statusEffects ?? [];
    const alive = !!view.member?.alive;
    const stunned = alive && effs.some(e => e.type === 'stun' && e.endTime > now);

    // 1. Bay lơ lửng ~1.2 đơn vị khi niệm & búng tay KN3 (goblin_float) + lốc `vortex` cuốn quanh người
    const hasServerFloat = alive && effs.some(e => e.type === 'goblin_float' && e.endTime > now);
    if (hasServerFloat) view._goblinSawServerFloat = true;
    if (!alive || stunned || (view._goblinSawServerFloat && !hasServerFloat && (view._goblinFloatHoldUntil ?? 0) <= now)) {
        view._goblinFloatUntil = 0;
    }
    const floatOn = alive && !stunned && (hasServerFloat || now < (view._goblinFloatUntil ?? 0));
    if (floatOn || (view._goblinHover ?? 0) > 0.005) {
        const bob = floatOn ? Math.sin((view._time ?? 0) * 6) * 0.06 : 0;
        const target = floatOn ? 1.2 + bob : 0;
        const rate = floatOn ? 5.5 : 7.5;
        view._goblinHover = (view._goblinHover ?? 0) + (target - (view._goblinHover ?? 0)) * Math.min(1, dt * rate);
        if (!floatOn && view._goblinHover < 0.01) view._goblinHover = 0;
        view._hover = view._goblinHover;
        view._barHover = view._hover;
        if (view.stand) view.stand.position.y = GROUND_Y + (view._lift ?? 0) + view._hover;
        if (view.shadow) {
            const shadowScale = 1 - Math.min(0.7, ((view._lift ?? 0) + view._hover) / 10);
            view.shadow.scale.setScalar(shadowScale);
        }
        view.setBarHeight?.(GROUND_Y + (view.height ?? 2.6) + 0.35 + view._hover);
    }
    updateGoblinFloatVortex(view, dt, floatOn);

    // 2. Vòm Giáp Độc (goblin_ward) tồn tại suốt khi có hiệu ứng goblin_ward
    const wardEf = alive ? effs.find(e => e.type === 'goblin_ward' && e.endTime > now && (e.hp ?? 1) > 0) : null;
    if (wardEf) view._goblinSawServerWard = true;
    const wardOn = alive && (!!wardEf || (!view._goblinSawServerWard && now < (view._goblinWardUntil ?? 0)));
    updateGoblinWardDome(view, dt, wardOn, wardEf);
}

/** Lốc xoáy độc `vortex` (4 khung lặp) bám theo độ cao bay (`_hover`) của Grix trong suốt KN3 */
function updateGoblinFloatVortex(view, dt, floatOn) {
    if (floatOn && !view._goblinVortexFx) {
        const g = new THREE.Group();
        const h = (view.height ?? 2.6) * 1.08;
        const glow = fxPlane(glowTexture(), h * 0.95, h * 0.95, { color: ACID, opacity: 0 });
        const vortex = grixFrames('vortex', h, { opacity: 0 });
        g.add(glow, vortex);
        view.root.add(g);
        view._goblinVortexFx = { g, glow, vortex, k: 0, t: 0 };
    }
    const V = view._goblinVortexFx;
    if (!V) return;
    V.t += dt;
    V.k += ((floatOn ? 1 : 0) - V.k) * Math.min(1, dt * (floatOn ? 7 : 9));
    V.g.visible = V.k > 0.02;
    if (!V.g.visible) return;

    const lift = (view._lift ?? 0) + (view._hover ?? 0);
    setFx(V.vortex, loopFrame(V.t, 10, 4));
    V.vortex.position.set(0, GROUND_Y + 0.02 + lift, 0.42);
    V.glow.position.set(0, GROUND_Y + 1.15 + lift, -0.1);
    V.vortex.material.opacity = 0.9 * V.k;
    V.glow.material.opacity = 0.42 * V.k * (0.85 + 0.15 * Math.sin(V.t * 12));
}

/** Bắt đầu cho Grix bay lên ~1.2 đơn vị khi niệm KN3 (`castStart`) */
export function startGoblinFloat(view, durationMs = 1500) {
    if (!view) return;
    ensureGoblinView(view);
    const now = gameNow();
    view._goblinSawServerFloat = false;
    view._goblinFloatUntil = now + durationMs;
    view._goblinFloatHoldUntil = now + durationMs;
}

/** Giữ Grix trên không lúc búng tay rồi hạ xuống đất mượt mà (~0.4s) */
export function stopGoblinFloat(view, delayMs = 280) {
    if (!view) return;
    ensureGoblinView(view);
    const until = gameNow() + delayMs;
    view._goblinFloatUntil = until;
    view._goblinFloatHoldUntil = until;
}

/**
 * Hiệu ứng tụ lực khi niệm `goblin_bog` / `goblin_detonate`:
 * Vòng `wardRing` dưới chân + lốc xoáy `vortex` cuốn quanh Grix theo độ cao bay.
 */
export function spawnGoblinCharge(posOrView, { life = 0.9, big = false } = {}) {
    const isView = !!posOrView?.position;
    const getPos = () => (isView ? posOrView.position : posOrView);
    const getLift = () => (isView ? (posOrView._hover ?? 0) + (posOrView._lift ?? 0) : 0);
    const p0 = getPos();

    const ring = groundDecal('wardRing', p0.x, p0.z ?? 0, big ? 1.85 : 1.45, { lift: 0.04, opacity: 0 });
    const rsx = ring.scale.x, rsy = ring.scale.y;
    addAnim(ring, life, (p, fx) => {
        const cur = getPos();
        fx.mesh.position.x = cur.x;
        fx.mesh.position.z = cur.z ?? 0;
        const k = 0.65 + 0.35 * easeOut(Math.min(1, p * 3));
        fx.mesh.scale.set(rsx * k, rsy * k, 1);
        fx.mesh.material.opacity = 0.85 * fadeInOut(p, 0.12, 0.85);
    });

    // Nếu gọi cho `pos` rời (hoặc niệm KN2 không bật float), dựng `vortex` trực tiếp theo `getLift()`
    if (!isView || !big) {
        const vortex = grixFrames('vortex', big ? 2.75 : 2.1, { opacity: 0 });
        addAnim(vortex, life, (p, fx) => {
            const cur = getPos();
            setFx(fx.mesh, loopFrame(p * life, 10, 4));
            fx.mesh.position.set(cur.x, FLOOR + 0.02 + getLift(), (cur.z ?? 0) + 0.42);
            fx.mesh.material.opacity = (big ? 0.9 : 0.75) * fadeInOut(p, 0.12, 0.85);
        });
    } else {
        ensureGoblinView(posOrView);
    }
}

/** Tia chớp ngôi sao `snap` loé sáng tại bàn tay Grix đúng khoảnh khắc búng tay (~0.25s, scale pop) */
export function spawnSnapFlash(handPos) {
    const x = handPos.x, y = handPos.y ?? 1.8, z = (handPos.z ?? 0) + 0.7;

    const snap = grixFrames('snap', 1.65);
    snap.position.set(x, y, z);
    addAnim(snap, 0.25, (p, fx) => {
        const pop = p < 0.28 ? 0.45 + (p / 0.28) * 0.85 : 1.3 - ((p - 0.28) / 0.72) * 0.45;
        fx.mesh.scale.setScalar(pop);
        fx.mesh.material.opacity = p > 0.6 ? (1 - p) / 0.4 : 1;
    });

    const glow = fxPlane(glowTexture(), 1.5, 1.5, { color: LIME, opacity: 0.7 });
    glow.position.set(x, y, z - 0.02);
    addAnim(glow, 0.22, (p, fx) => {
        fx.mesh.scale.setScalar(0.5 + easeOut(p) * 1.15);
        fx.mesh.material.opacity = 0.7 * (1 - p);
    });
}

/** Grix phát động Đại Bộc Phá Độc: vòng `shock` lan dưới đất + sóng xung kích */
export function spawnDetonateCast(pos, { lift = 0 } = {}) {
    const ring = groundDecal('shock', pos.x, pos.z ?? 0, 1.1, { lift: 0.05, opacity: 0.9 });
    const rsx = ring.scale.x, rsy = ring.scale.y;
    addAnim(ring, 0.48, (p, fx) => {
        const k = 1 + easeOut(p) * 2.4;
        fx.mesh.scale.set(rsx * k, rsy * k, 1);
        fx.mesh.material.opacity = 0.9 * (1 - p);
    });
    spawnShockwave(pos, { color: ACID, radius: 3.6, life: 0.45 });
}

/**
 * Vụ nổ độc `boom` (8 khung ~0.8s, có hình đầu lâu ở khung 4) bùng phát trên từng kẻ địch trúng Đại Bộc Phá Độc.
 * Càng nhiều tầng Độc (`stacks`) vụ nổ càng lớn.
 */
export function spawnDetonateBurst(pos, { stacks = 1 } = {}) {
    const scale = 1 + Math.min(7, stacks) * 0.14;
    const x = pos.x;
    const z0 = (pos.z ?? 0) + 0.72;

    const m = grixFrames('boom', 2.25 * scale);
    m.position.set(x, FLOOR + 0.02, z0);
    addAnim(m, 0.8, (p, fx) => {
        setFx(fx.mesh, weighted(p, BOOM_W));
        fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 1;
    });

    const ring = groundDecal('shock', x, pos.z ?? 0, 0.75 * scale, { lift: 0.05, opacity: 0.9 });
    const rsx = ring.scale.x, rsy = ring.scale.y;
    addAnim(ring, 0.48, (p, fx) => {
        const k = 1 + easeOut(p) * 2.1;
        fx.mesh.scale.set(rsx * k, rsy * k, 1);
        fx.mesh.material.opacity = 0.9 * (1 - p);
    });

    const flash = fxPlane(glowTexture(), 1.6 * scale, 1.6 * scale, { color: LIME, opacity: 0.7 });
    flash.position.set(x, (pos.y ?? 0) + 0.95, z0 - 0.03);
    addAnim(flash, 0.28, (p, fx) => {
        fx.mesh.scale.setScalar(0.55 + easeOut(p) * 1.15);
        fx.mesh.material.opacity = 0.7 * (1 - p);
    });

    spawnHitSpark(pos, { count: fxBudget(6, 3), color: LIME, size: 1.0 * scale });
}

// ------------------------------------------------------------
// 5. THIÊN PHÚ 1 & 2: venomRot · wardUp · wardHit · wardDrain · wardBurst
// ------------------------------------------------------------
const activeVenomRots = new WeakMap();

/**
 * `venomRot` (Thiên phú 1): Ấn Đầu Lâu Mục Rữa (`rotSkull`) nhấp nhô trên đầu mục tiêu suốt `rotTime` ms.
 */
export function spawnVenomRot(targetView, { rotTime = 5000 } = {}) {
    if (!targetView) return;
    activeVenomRots.get(targetView)?.stop?.();

    const duration = Math.max(0.5, rotTime / 1000);
    const p0 = targetView.position;

    const burst = fxPlane(glowTexture(), 1.5, 1.5, { color: PURPLE_LIGHT, opacity: 0.75 });
    burst.position.set(p0.x, (p0.y ?? 0) + 1.25, (p0.z ?? 0) + 0.65);
    addAnim(burst, 0.28, (p, fx) => {
        fx.mesh.scale.setScalar(0.5 + easeOut(p) * 1.1);
        fx.mesh.material.opacity = 0.75 * (1 - p);
    });

    const group = new THREE.Group();
    const skullHalo = fxPlane(glowTexture(), 2.0, 2.0, { color: PURPLE_LIGHT, opacity: 0 });
    const skull = grixFrames('rotSkull', 1.6, { opacity: 0 });   // to hơn: nhìn rõ địch đang Mục Rữa
    skull.position.z = 0.02;

    const headGroup = new THREE.Group();
    headGroup.add(skullHalo, skull);
    group.add(headGroup);

    let stopped = false;
    const handle = { stop: () => { stopped = true; group.visible = false; } };
    activeVenomRots.set(targetView, handle);

    addAnim(group, duration, (p, fx) => {
        if (stopped || targetView.member?.alive === false) {
            fx.mesh.visible = false;
            return;
        }
        const tp = targetView.position;
        const h = (targetView.height ?? 2.6) + (targetView._lift ?? 0) + (targetView._hover ?? 0);
        const fade = fadeInOut(p, 0.08, 0.88);
        const pulse = 0.94 + 0.08 * Math.sin(p * duration * 6);

        fx.mesh.position.set(tp.x, 0, tp.z ?? 0);
        const bob = Math.sin(p * duration * 5) * 0.09;
        headGroup.position.set(0, FLOOR + h + 1.15 + bob, 0.68);   // cao hơn thanh máu (thanh máu ~ đầu + 0,35)
        headGroup.scale.setScalar((0.75 + 0.25 * easeOut(Math.min(1, p * 6))) * pulse);
        skull.rotation.z = Math.sin(p * duration * 2.5) * 0.07;
        skull.material.opacity = 0.96 * fade;
        skullHalo.material.opacity = 0.45 * fade * pulse;
    });
}

/**
 * Tạo / cập nhật vòm Giáp Độc (`dome` bán trong suốt opacity ~0.55 + `wardRing` decal dưới chân) gắn vào `view.root`.
 */
function updateGoblinWardDome(view, dt, on, wardEf) {
    if (on && !view._goblinWardFx) {
        const g = new THREE.Group();
        const h = view.height ?? 2.6;

        const backGlow = fxPlane(glowTexture(), h * 1.1, h * 1.15, { color: ACID, opacity: 0 });
        backGlow.position.set(0, GROUND_Y + h * 0.52, -0.1);

        const dome = grixFrames('dome', h * 1.14, { opacity: 0 });
        dome.position.set(0, GROUND_Y + 0.02, 0.45);

        const groundRing = groundDecal('wardRing', 0, 0, 1.85, { lift: 0.04, opacity: 0 });
        groundRing.position.y = GROUND_Y + 0.04;
        const rsx = groundRing.scale.x, rsy = groundRing.scale.y;

        g.add(groundRing, backGlow, dome);
        view.root.add(g);
        view._goblinWardFx = { g, backGlow, dome, groundRing, rsx, rsy, k: 0 };
    }

    const W = view._goblinWardFx;
    if (!W) return;
    W.k += ((on ? 1 : 0) - W.k) * Math.min(1, dt * (on ? 7 : 10));
    W.g.visible = W.k > 0.02;
    if (!W.g.visible) return;

    const lift = (view._lift ?? 0) + (view._hover ?? 0);
    const h = view.height ?? 2.6;
    const pulse = Math.max(0, (view._goblinWardPulse ?? 0) - dt * 3.5);
    view._goblinWardPulse = pulse;

    const hpFrac = wardEf?.maxHp > 0 ? Math.max(0.35, Math.min(1, wardEf.hp / wardEf.maxHp)) : 1;
    const t = view._time ?? 0;
    const breathe = 1 + 0.03 * Math.sin(t * 5) + 0.07 * pulse;

    W.dome.position.y = GROUND_Y + 0.02 + lift;
    W.backGlow.position.y = GROUND_Y + h * 0.52 + lift;

    W.dome.scale.set(breathe, 2 - breathe, 1);
    W.dome.material.opacity = (0.55 + 0.14 * pulse) * W.k * hpFrac;
    W.backGlow.material.opacity = (0.28 + 0.2 * pulse) * W.k * hpFrac;

    W.groundRing.scale.set(W.rsx * breathe, W.rsy * breathe, 1);
    W.groundRing.material.opacity = 0.85 * W.k;
}

/** `wardUp` (Thiên phú 2): bật Giáp Độc bao quanh Grix */
export function spawnGoblinWardUp(view, { durationMs = 8000 } = {}) {
    if (!view) return;
    ensureGoblinView(view);
    view._goblinSawServerWard = false;
    view._goblinWardUntil = gameNow() + durationMs;
    view._goblinWardPulse = 1;

    const pos = view.position;
    const ring = groundDecal('shock', pos.x, pos.z ?? 0, 0.9, { lift: 0.05, opacity: 0.85 });
    const rsx = ring.scale.x, rsy = ring.scale.y;
    addAnim(ring, 0.42, (p, fx) => {
        const k = 1 + easeOut(p) * 1.9;
        fx.mesh.scale.set(rsx * k, rsy * k, 1);
        fx.mesh.material.opacity = 0.85 * (1 - p);
    });
    spawnShockwave(pos, { color: LIME, radius: 2.8, life: 0.42 });
}

/** `wardHit` (Thiên phú 2): Giáp Độc bắn lọ độc nhỏ `vial` trả đòn kẻ vừa tấn công + nổ `hit` */
export function spawnWardHitSpit(casterView, targetView) {
    if (!casterView || !targetView) return;
    casterView._goblinWardPulse = 1;
    const from = {
        x: casterView.position.x,
        y: (casterView.position.y ?? 0) + 1.15 + (casterView._hover ?? 0),
        z: casterView.position.z,
    };
    const to = {
        x: targetView.position.x,
        y: (targetView.position.y ?? 0) + 0.95,
        z: targetView.position.z,
    };
    spawnGoblinVial(from, to, {
        duration: 0.22,
        size: 0.58,
        onHit: () => spawnPoisonSplash(targetView.position, { size: 0.78 }),
    });
}

/** `wardDrain` (Thiên phú 2): hồn độc `wisp` bay ngược vào người Grix (lật gương theo hướng bay) để hồi máu */
export function spawnWardDrain(casterView) {
    if (!casterView) return;
    casterView._goblinWardPulse = Math.max(casterView._goblinWardPulse ?? 0, 0.65);

    const cp0 = casterView.position;
    const side = casterView.facingLeft ? -1 : 1;
    const from = {
        x: cp0.x + side * 2.35,
        y: (cp0.y ?? 0) + 0.85,
        z: (cp0.z ?? 0) + 0.15,
    };

    const wisp = grixFrames('wisp', 0.88);
    const glow = fxPlane(glowTexture(), 1.05, 1.05, { color: ALLY_MINT, opacity: 0.6 });
    const g = new THREE.Group();
    g.add(glow, wisp);

    const life = 0.38;
    addAnim(g, life, (p, fx) => {
        const cp = casterView.position;
        const lift = (casterView._hover ?? 0) + (casterView._lift ?? 0);
        const toX = cp.x;
        const toY = (cp.y ?? 0) + 1.05 + lift;
        const toZ = (cp.z ?? 0) + 0.65;

        const dx = toX - from.x;
        const dy = toY - from.y;
        const e = easeOut(p);
        const arc = Math.sin(p * Math.PI) * 0.65;
        fx.mesh.position.set(from.x + dx * e, from.y + dy * e + arc, toZ);

        const left = dx < 0;
        const vy = dy + Math.cos(p * Math.PI) * 0.65 * Math.PI;
        const ax = Math.max(0.001, Math.abs(dx));
        const sc = 1 - 0.25 * p;
        wisp.scale.set((left ? -1 : 1) * sc, sc, 1);
        wisp.rotation.z = (left ? -Math.atan2(vy, ax) : Math.atan2(vy, ax)) * 0.45;
        wisp.material.opacity = p > 0.82 ? (1 - p) / 0.18 : 0.95;
        glow.material.opacity = 0.6 * (1 - p);
    });
}

/** `wardBurst` (Thiên phú 2): Giáp Độc phát nổ — decal `shock` bung rộng + nổ `boom` nhỏ tại vị trí Grix */
export function spawnWardBurst(casterView, pos, { radius = 3.5 } = {}) {
    if (casterView) {
        casterView._goblinWardUntil = 0;
        casterView._goblinSawServerWard = true;
    }
    const x = pos?.x ?? casterView?.position.x ?? 0;
    const z = pos?.z ?? casterView?.position.z ?? 0;

    // Vòng sóng độc `shock` bung rộng tới bán kính nổ
    const ring = groundDecal('shock', x, z, radius * 0.32, { lift: 0.05, opacity: 0.95 });
    const rsx = ring.scale.x, rsy = ring.scale.y;
    addAnim(ring, 0.55, (p, fx) => {
        const k = 1 + easeOut(p) * 2.25;
        fx.mesh.scale.set(rsx * k, rsy * k, 1);
        fx.mesh.material.opacity = 0.95 * (1 - p * p);
    });

    // Nổ độc `boom` nhỏ tại Grix
    const boom = grixFrames('boom', 2.35);
    boom.position.set(x, FLOOR + 0.02, z + 0.68);
    addAnim(boom, 0.7, (p, fx) => {
        setFx(fx.mesh, weighted(p, BOOM_W));
        fx.mesh.material.opacity = p > 0.78 ? (1 - p) / 0.22 : 1;
    });

    spawnShockwave({ x, y: 0, z }, { color: ACID, radius, life: 0.48 });
}

// ------------------------------------------------------------
// 6. SỰ KIỆN GOBLINFX CƠ BẢN: poisonTick · spread · smoke
// ------------------------------------------------------------
/** Nhịp bọt độc nhỏ (`hit` thu nhỏ) trên người mục tiêu đang nhiễm độc (hoặc ánh vàng-lục khi hồi máu) */
export function spawnPoisonBubbles(pos, { count = 3, heal = false } = {}) {
    const n = Math.min(2, fxBudget(count, 1));
    for (let i = 0; i < n; i++) {
        const h = 0.62 + Math.random() * 0.22;
        const m = grixFrames('hit', h, { additive: heal });
        if (heal) m.material.color.set(ALLY_GOLD);
        if (Math.random() < 0.5) m.scale.x = -1;
        const ox = (Math.random() - 0.5) * 0.65;
        const y0 = (pos.y ?? 0) + 0.65 + Math.random() * 0.55;
        const z0 = (pos.z ?? 0) + 0.65;
        const life = 0.3 + Math.random() * 0.08;
        addAnim(m, life, (p, fx) => {
            setFx(fx.mesh, Math.min(3, Math.floor(p * 4)));
            fx.mesh.position.set(pos.x + ox, y0 + 0.32 * easeOut(p), z0);
            fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 0.92;
        });
    }
}

function poisonNumberTexture(txt, highStacks = false) {
    const key = `${txt}:${highStacks ? 1 : 0}`;
    let tex = NUM_TEX.get(key);
    if (tex) return tex;
    if (NUM_TEX.size > 160) NUM_TEX.clear();
    tex = makeCanvasTex(128, 64, (ctx) => {
        ctx.font = '900 26px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = highStacks ? '#3b0764' : '#1a2e05';
        ctx.lineWidth = 4.5;
        ctx.fillStyle = highStacks ? '#d9f99d' : '#a3e635';
        ctx.strokeText(txt, 64, 42);
        ctx.fillText(txt, 64, 42);
    });
    NUM_TEX.set(key, tex);
    return tex;
}

/**
 * Mỗi nhịp Độc rút máu (`poisonTick`): hiệu ứng `hit` nhỏ + số sát thương xanh lá trên mục tiêu.
 */
export function spawnPoisonTick(pos, damage, { stacks = 1 } = {}) {
    spawnPoisonBubbles(pos, { count: 1 });
    if (!(damage > 0)) return;

    const txt = `-${Math.round(damage)}`;
    const tex = poisonNumberTexture(txt, stacks >= 5);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    sp.userData.sharedTexture = true;
    sp.scale.set(1.45, 0.72, 1);
    const x0 = pos.x + (Math.random() - 0.5) * 0.55;
    const y0 = (pos.y ?? 0) + 2.55;
    const z0 = (pos.z ?? 0) + 0.65;
    addAnim(sp, 0.85, (p, fx) => {
        fx.mesh.position.set(x0, y0 + 0.85 * easeOut(p), z0);
        fx.mesh.material.opacity = p > 0.65 ? (1 - p) / 0.35 : 1;
    });
}

/**
 * Hồn độc `wisp` (`spread`) bay từ xác mục tiêu bị nổ chết sang các kẻ địch xung quanh (`toIndexes`).
 */
export function spawnPoisonWisp(from, getTo, { duration = 0.4, onArrive } = {}) {
    const wisp = grixFrames('wisp', 0.95);
    const halo = fxPlane(glowTexture(), 1.15, 1.15, { color: ACID, opacity: 0.55 });
    const g = new THREE.Group();
    g.add(halo, wisp);

    const z0 = (from.z ?? 0) + 0.65;
    let arrived = false;

    addAnim(g, duration, (p, fx) => {
        const to = typeof getTo === 'function' ? getTo() : getTo;
        const dx = to.x - from.x;
        const dy = (to.y ?? 0.9) - (from.y ?? 0.9);
        const z1 = (to.z ?? 0) + 0.65;
        const arc = Math.sin(p * Math.PI) * 1.1;
        const x = from.x + dx * p;
        const y = (from.y ?? 0.9) + dy * p + arc;
        const z = z0 + (z1 - z0) * p;
        fx.mesh.position.set(x, y, z);

        const left = dx < 0;
        const vy = dy + Math.cos(p * Math.PI) * 1.1 * Math.PI;
        const ax = Math.max(0.001, Math.abs(dx));
        const pulse = 1 + 0.08 * Math.sin(p * 26);
        wisp.scale.set((left ? -1 : 1) * pulse, pulse, 1);
        wisp.rotation.z = (left ? -Math.atan2(vy, ax) : Math.atan2(vy, ax)) * 0.5;
        halo.scale.setScalar(0.9 + 0.2 * Math.sin(p * 24));

        if (p >= 1 && !arrived) {
            arrived = true;
            onArrive?.();
        }
    });
}

/** Giữ lại hàm khói độc dự phòng nếu có công cụ test gọi trực tiếp */
export function spawnGoblinSmoke(pos, { radius = 3.5 } = {}) {
    spawnWardBurst(null, pos, { radius });
}
