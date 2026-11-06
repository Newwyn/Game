// ============================================================
// HIỆU ỨNG LÂM LINH — Sylva (Triệu Hồi Sư) & các linh thú rừng thiêng
// ============================================================
// Toàn bộ hiệu ứng vẽ bằng thủ tục (procedural canvas + Three.js):
//   Màu rừng thiêng: lá xanh (#22c55e / #86efac), nâu vỏ cây (#78350f / #a16207), ánh vàng (#fde047 / #facc15).
//   Tái sử dụng geometry (planeGeo qua fxPlane), texture canvas lưu cache, tự thu hồi trong updateVfx(dt).
import * as THREE from 'three';
import { getTexture } from '../core/textures.js';
import deerUrl from '../assets/sprites/deer_sprite.webp';
import deerMeta from '../characters/sprite/deerSprite.json';
import { GROUND_Y, gameNow, gameTimeout } from '../config.js';
import fxUrl from '../assets/sprites/sylva_fx2.webp';
import FXM from './sylvaFx2.json';
import { makeFlipbook, FLOOR as FB_FLOOR, loopFrame } from './flipbook.js';
import {
    addAnim, fxPlane, glowTexture, ringTexture, sparkTexture,
    easeOut, spawnHitSpark, spawnShockwave, spawnRisingSparkles,
    spawnLandingDust, fxBudget,
} from './vfx.js';

const FLOOR = GROUND_Y + 0.04;
const LEAF_GREEN = 0x22c55e;
const LEAF_LIGHT = 0x86efac;
const BARK_BROWN = 0x854d0e;
const GOLD_LIGHT = 0xfde047;
const GOLD_WARM = 0xfacc15;
const ARMOR_RED = 0xef4444;

// Hiệu ứng vẽ tay (atlas sylva_fx2: art/sylva/fx2/PROMPTS_FX.md, tools/fx_grid_pack.py art/sylva/fx2/fx2_spec.json)
const FBH = makeFlipbook(fxUrl, FXM);
const fbOf = () => FBH;
const FB = {
    count: (g) => fbOf(g).count(g),
    frames: (g, h, o) => { const fb = fbOf(g), m = fb.frames(g, h, o); m.userData.fb = fb; return m; },
    set: (m, i) => (m.userData.fb ?? FBH).set(m, i),
    decal: (g, ...a) => { const fb = fbOf(g), m = fb.decal(g, ...a); m.userData.fb = fb; return m; },
};
const art = FB.frames;
const setArt = FB.set;
const artDecal = FB.decal;

const TEX = {};

function makeCanvasTex(key, w, h, draw) {
    if (TEX[key]) return TEX[key];
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    TEX[key] = t;
    return t;
}

// ---------- Các texture thủ tục (lưu cache dùng lại) ----------

/** Chiếc lá rừng nhọn hai đầu, có gân sáng ở giữa */
function leafTexture() {
    return makeCanvasTex('leaf', 64, 64, (ctx) => {
        ctx.translate(32, 32);
        ctx.rotate(-0.35);
        const g = ctx.createLinearGradient(-22, 0, 22, 0);
        g.addColorStop(0, '#15803d');
        g.addColorStop(0.5, '#22c55e');
        g.addColorStop(1, '#86efac');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.quadraticCurveTo(-4, -15, 24, 0);
        ctx.quadraticCurveTo(-4, 15, -24, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#dcfce7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.stroke();
    });
}

/** Phi tiêu gai lá (đòn đánh thường của Sylva) */
function leafDartTexture() {
    return makeCanvasTex('leafDart', 128, 48, (ctx) => {
        ctx.translate(64, 24);
        const g = ctx.createLinearGradient(-56, 0, 56, 0);
        g.addColorStop(0, 'rgba(22,163,74,0)');
        g.addColorStop(0.35, '#22c55e');
        g.addColorStop(0.8, '#86efac');
        g.addColorStop(1, '#fef08a');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(58, 0);
        ctx.lineTo(10, -13);
        ctx.lineTo(-56, 0);
        ctx.lineTo(10, 13);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-36, 0);
        ctx.lineTo(54, 0);
        ctx.stroke();
    });
}

/** Vòng cổ ngữ rừng thiêng (vòng lá + ký tự cổ ngữ xanh-vàng) */
function forestRuneTexture() {
    return makeCanvasTex('forestRune', 256, 256, (ctx) => {
        ctx.translate(128, 128);
        ctx.strokeStyle = '#4ade80';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 110, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, 88, 0, Math.PI * 2);
        ctx.stroke();

        // 8 cánh lá quanh tâm
        for (let i = 0; i < 8; i++) {
            ctx.save();
            ctx.rotate((i / 8) * Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? 'rgba(74,222,128,0.85)' : 'rgba(253,224,71,0.85)';
            ctx.beginPath();
            ctx.moveTo(0, -88);
            ctx.quadraticCurveTo(10, -100, 0, -112);
            ctx.quadraticCurveTo(-10, -100, 0, -88);
            ctx.fill();
            ctx.restore();
        }

        // Ngôi sao 6 cánh mảnh ở lòng vòng
        ctx.strokeStyle = 'rgba(134,239,172,0.75)';
        ctx.lineWidth = 2;
        for (let k = 0; k < 2; k++) {
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI * 2 + (k * Math.PI) / 3;
                const x = Math.cos(a) * 84;
                const y = Math.sin(a) * 84;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }
    });
}

/** Biểu tượng khiên nứt màu đỏ (phá giáp từ tiếng hú Sói Rừng) */
function armorBreakTexture() {
    return makeCanvasTex('armorBreak', 96, 96, (ctx) => {
        ctx.translate(48, 48);
        ctx.shadowColor = '#7f1d1d';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -34);
        ctx.lineTo(28, -22);
        ctx.lineTo(24, 10);
        ctx.quadraticCurveTo(0, 34, 0, 36);
        ctx.quadraticCurveTo(0, 34, -24, 10);
        ctx.lineTo(-28, -22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Vết nứt zíc-zắc ở giữa khiên
        ctx.strokeStyle = '#fef2f2';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-4, -30);
        ctx.lineTo(6, -10);
        ctx.lineTo(-6, 6);
        ctx.lineTo(5, 28);
        ctx.stroke();
    });
}

/** Hàm răng nanh sói táp (cắn trên + dưới) */
function fangBiteTexture() {
    return makeCanvasTex('fangBite', 128, 128, (ctx) => {
        ctx.translate(64, 64);
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        // 4 răng nanh trên
        for (const [x, len] of [[-28, 34], [-10, 22], [10, 22], [28, 34]]) {
            ctx.beginPath();
            ctx.moveTo(x - 8, -42);
            ctx.lineTo(x + 8, -42);
            ctx.lineTo(x, -42 + len);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        // 4 răng nanh dưới
        for (const [x, len] of [[-26, 30], [-9, 20], [9, 20], [26, 30]]) {
            ctx.beginPath();
            ctx.moveTo(x - 7, 42);
            ctx.lineTo(x + 7, 42);
            ctx.lineTo(x, 42 - len);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    });
}

/** Lông vũ Đại Bàng (nâu vàng kim, đầu nhọn hướng xuống) */
function featherTexture() {
    return makeCanvasTex('feather', 48, 128, (ctx) => {
        ctx.translate(24, 64);
        const g = ctx.createLinearGradient(0, -56, 0, 56);
        g.addColorStop(0, '#fde047');
        g.addColorStop(0.55, '#ca8a04');
        g.addColorStop(1, '#713f12');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#422006';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 56);
        ctx.quadraticCurveTo(16, 10, 10, -48);
        ctx.quadraticCurveTo(0, -58, -10, -48);
        ctx.quadraticCurveTo(-16, 10, 0, 56);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#fef9c3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -52);
        ctx.lineTo(0, 54);
        ctx.stroke();
    });
}

/** Quả cầu gió xoáy (Wind Orb của Đại Bàng) */
function windOrbTexture() {
    return makeCanvasTex('windOrb', 128, 128, (ctx) => {
        ctx.translate(64, 64);
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 58);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.4, '#bbf7d0');
        g.addColorStop(0.75, 'rgba(34,197,94,0.65)');
        g.addColorStop(1, 'rgba(34,197,94,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 58, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f0fdf4';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate((i / 3) * Math.PI * 2);
            ctx.beginPath();
            ctx.arc(6, 0, 38, -0.4, 1.8);
            ctx.stroke();
            ctx.restore();
        }
    });
}

/** Mắt Ưng Nhãn vàng rực phát sáng */
function eagleEyeTexture() {
    return makeCanvasTex('eagleEye', 128, 64, (ctx) => {
        ctx.translate(64, 32);
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-46, 0);
        ctx.quadraticCurveTo(0, -24, 46, 0);
        ctx.quadraticCurveTo(0, 22, -46, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4.5, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(5, -4, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

/** Vòm Khiên Lá (lưới lá xanh lục + viền vàng dịu) */
function leafDomeTexture() {
    return makeCanvasTex('leafDome', 256, 256, (ctx) => {
        ctx.translate(128, 128);
        const g = ctx.createRadialGradient(0, 0, 36, 0, 0, 120);
        g.addColorStop(0, 'rgba(34,197,94,0.06)');
        g.addColorStop(0.7, 'rgba(34,197,94,0.28)');
        g.addColorStop(0.92, 'rgba(134,239,172,0.75)');
        g.addColorStop(1, 'rgba(253,224,71,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 120, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(134,239,172,0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 108, 0, Math.PI * 2);
        ctx.stroke();

        // 6 chiếc lá xếp vòng quanh vòm
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate((i / 6) * Math.PI * 2);
            ctx.translate(0, -82);
            ctx.fillStyle = 'rgba(74,222,128,0.75)';
            ctx.strokeStyle = '#dcfce7';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-18, 0);
            ctx.quadraticCurveTo(0, -10, 18, 0);
            ctx.quadraticCurveTo(0, 10, -18, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    });
}

/** Mũi tên xanh lá hướng lên (Gắn Kết Rừng Thiêng — forestMight) */
function greenArrowUpTexture() {
    return makeCanvasTex('greenArrowUp', 64, 96, (ctx) => {
        ctx.translate(32, 48);
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
        const g = ctx.createLinearGradient(0, -38, 0, 38);
        g.addColorStop(0, '#fef08a');
        g.addColorStop(0.45, '#4ade80');
        g.addColorStop(1, 'rgba(34,197,94,0.1)');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -38);
        ctx.lineTo(22, -10);
        ctx.lineTo(9, -10);
        ctx.lineTo(9, 34);
        ctx.lineTo(-9, 34);
        ctx.lineTo(-9, -10);
        ctx.lineTo(-22, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
}

/**
 * Thần Hươu ánh sáng (billboard vẽ thủ tục bằng canvas):
 * Thân hươu linh hồn xanh ngọc - vàng kim, cặp sừng lớn toả sáng như cành cây thần + đốm sao.
 */
function spiritDeerTexture() {
    return makeCanvasTex('spiritDeer', 384, 384, (ctx) => {
        ctx.translate(192, 230);

        // Quầng hào quang dịu sau thân
        const aura = ctx.createRadialGradient(0, -30, 10, 0, -30, 155);
        aura.addColorStop(0, 'rgba(254,240,138,0.45)');
        aura.addColorStop(0.5, 'rgba(74,222,128,0.22)');
        aura.addColorStop(1, 'rgba(34,197,94,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, -30, 155, 0, Math.PI * 2);
        ctx.fill();

        // Thân + cổ + đầu + 4 chân thanh mảnh nhìn sang phải
        const bodyGrad = ctx.createLinearGradient(-60, -110, 60, 110);
        bodyGrad.addColorStop(0, '#fef9c3');
        bodyGrad.addColorStop(0.45, '#86efac');
        bodyGrad.addColorStop(1, '#22c55e');

        ctx.save();
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 18;
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Thân hươu
        ctx.beginPath();
        ctx.moveTo(-58, -8);
        ctx.quadraticCurveTo(-52, -38, -8, -36);
        ctx.lineTo(26, -34);
        // Cổ vươn cao
        ctx.quadraticCurveTo(42, -72, 40, -104);
        // Đầu & mõm
        ctx.quadraticCurveTo(56, -114, 76, -100);
        ctx.quadraticCurveTo(72, -86, 52, -86);
        // Ngực
        ctx.quadraticCurveTo(56, -42, 44, -8);
        // Bụng
        ctx.quadraticCurveTo(6, 6, -44, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tai hươu
        ctx.beginPath();
        ctx.ellipse(32, -108, 12, 5, -0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Đuôi nhỏ phát sáng
        ctx.beginPath();
        ctx.moveTo(-56, -22);
        ctx.quadraticCurveTo(-78, -32, -68, -8);
        ctx.closePath();
        ctx.fill();

        // 4 chân thon dài
        const legs = [
            [[-42, -2], [-50, 52], [-44, 108]],
            [[-24, 0], [-20, 52], [-18, 104]],
            [[24, -4], [28, 52], [26, 106]],
            [[38, -6], [48, 48], [54, 104]],
        ];
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#bbf7d0';
        for (const [a, b, c] of legs) {
            ctx.beginPath();
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(b[0], b[1]);
            ctx.lineTo(c[0], c[1]);
            ctx.stroke();
        }
        ctx.restore();

        // Mắt vàng sáng
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(54, -99, 4, 0, Math.PI * 2);
        ctx.fill();

        // Cặp sừng lớn toả ánh vàng kim như nhánh cây thần
        ctx.save();
        ctx.strokeStyle = '#fde047';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 20;
        ctx.lineCap = 'round';
        ctx.lineWidth = 6;
        // Nhánh chính sau & trước
        const branches = [
            [[42, -110], [20, -148], [-12, -182], [-34, -206]],
            [[46, -112], [44, -154], [30, -190], [18, -214]],
            [[20, -148], [2, -168]],
            [[-12, -182], [-4, -206]],
            [[44, -154], [64, -176]],
            [[30, -190], [52, -206]],
        ];
        branches.forEach((pts, idx) => {
            ctx.lineWidth = idx < 2 ? 6 : 4;
            ctx.beginPath();
            pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.stroke();
        });
        // Đốm ngọc sáng đầu mỗi nhánh sừng
        ctx.fillStyle = '#ffffff';
        for (const [gx, gy] of [[-34, -206], [18, -214], [2, -168], [-4, -206], [64, -176], [52, -206]]) {
            ctx.beginPath();
            ctx.arc(gx, gy, 4.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
}

// ---------- Hạt lá bay (dùng chung cho summon, summonEnd, pounce, leafShield...) ----------
export function spawnLeafBurst(pos, { count = 12, radius = 1.1, rise = 1.3, life = 0.65, gold = false } = {}) {
    const n = fxBudget(count, 3);
    const tex = leafTexture();
    const x0 = pos.x;
    const y0 = (pos.y ?? 0) + 0.35;
    const z0 = (pos.z ?? 0) + 0.55;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const dist = radius * (0.45 + Math.random() * 0.75);
        const vx = Math.cos(a) * dist;
        const vz = Math.sin(a) * dist * 0.45;
        const vy = rise * (0.55 + Math.random() * 0.65);
        const sz = 0.28 + Math.random() * 0.16;
        const tint = gold && i % 3 === 0 ? GOLD_LIGHT : (i % 2 === 0 ? 0xffffff : LEAF_LIGHT);
        const m = fxPlane(tex, sz, sz, { additive: false, color: tint, opacity: 0.95 });
        const spin0 = Math.random() * Math.PI * 2;
        const spinV = (Math.random() - 0.5) * 9;
        addAnim(m, life * (0.85 + Math.random() * 0.3), (p, fx) => {
            const e = easeOut(p);
            fx.mesh.position.set(x0 + vx * e + Math.sin(p * 8 + i) * 0.1, y0 + vy * e - p * p * 0.55, z0 + vz * e);
            fx.mesh.rotation.z = spin0 + spinV * p;
            fx.mesh.scale.setScalar(1 - p * 0.35);
            fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 0.95;
        });
    }
}

// ------------------------------------------------------------
// Trình chạy tranh khung dùng chung (atlas sylva_fx2)
// ------------------------------------------------------------
/** Chạy 1 lượt nhóm khung `group` (từ khung `from`) tại (x, y, z), cao `height`, trong `life` giây */
function playArt(group, x, y, z, height, life, { from = 0, flip = false, opacity = 1, rot = 0, additive = false, grow = 0 } = {}) {
    const m = art(group, height, { additive, frame: from });
    m.position.set(x, y, z);
    m.rotation.z = rot;
    const sx = flip ? -1 : 1;
    m.scale.set(sx, 1, 1);
    const n = FB.count(group) - from;
    addAnim(m, life, (p, fx) => {
        setArt(fx.mesh, from + Math.min(n - 1, Math.floor(p * n)));
        const k = 1 + grow * easeOut(p);
        fx.mesh.scale.set(sx * k, k, 1);
        fx.mesh.material.opacity = opacity * (p > 0.82 ? (1 - p) / 0.18 : 1);
    });
    return m;
}
/** Hình nằm trên mặt đất (nhóm 1 khung): nở ra rồi mờ dần, `spin` rad/giây */
function groundArt(group, x, z, r, life, { grow = 0.35, opacity = 0.95, spin = 0, hold = 0.6 } = {}) {
    const d = artDecal(group, x, z, r, { opacity: 0 });
    const sx = d.scale.x, sy = d.scale.y;
    addAnim(d, life, (p, fx, dt) => {
        const k = 1 - grow + grow * easeOut(Math.min(1, p * 2.5));
        fx.mesh.scale.set(sx * k, sy * k, 1);
        fx.mesh.material.opacity = opacity * (p < 0.12 ? p / 0.12 : p > hold ? (1 - p) / (1 - hold) : 1);
        if (spin) fx.mesh.rotation.z += dt * spin;
    });
    return d;
}
/** Đạn bay (nhóm 4 khung lặp, vẽ bay sang PHẢI) từ `from` tới `to`, chạm sau `duration` giây */
function shootArt(group, from, to, { size = 0.9, duration = 0.22, arc = 0, onHit, glow = LEAF_GREEN, fps = 16 } = {}) {
    const m = art(group, size);
    const halo = fxPlane(glowTexture(), size * 1.25, size * 0.9, { color: glow, opacity: 0.42 });
    const g = new THREE.Group();
    g.add(halo, m);
    const dx = to.x - from.x;
    const y0 = from.y ?? 1.1;
    const dy = (to.y ?? 0.95) - y0;
    const z0 = (from.z ?? 0) + 0.55;
    const z1 = (to.z ?? 0) + 0.6;
    const left = dx < 0;
    m.scale.x = left ? -1 : 1;
    const ph = Math.random() * 4;
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(from.x + dx * p, y0 + dy * p + Math.sin(p * Math.PI) * arc, z0 + (z1 - z0) * p);
        const vy = dy + Math.cos(p * Math.PI) * Math.PI * arc;
        const ax = Math.max(0.001, Math.abs(dx));
        m.rotation.z = (left ? -1 : 1) * Math.atan2(vy, ax);
        setArt(m, loopFrame(p * duration, fps, FB.count(group), ph));
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}
/** Biểu tượng 1 khung (eye · might · heal · claw) bật lên rồi bay lên, mờ dần */
function popIcon(group, view, { size = 0.8, life = 0.9, rise = 0.35, dy = 0.55, ox = 0, delay = 0 } = {}) {
    const m = art(group, size, { opacity: 0 });
    addAnim(m, life + delay, (q, fx) => {
        const t = Math.max(0, (q * (life + delay) - delay) / life);
        if (t <= 0) return;
        const cur = view.position;
        const pop = t < 0.18 ? easeOut(t / 0.18) * 1.2 : 1.2 - 0.2 * Math.min(1, (t - 0.18) * 3);
        fx.mesh.position.set(cur.x + ox, GROUND_Y + (view.height ?? 2) + (view.sprite?.lift ?? 0) + dy + t * rise, (cur.z ?? 0) + 0.7);
        fx.mesh.scale.setScalar(pop);
        fx.mesh.material.opacity = t < 0.1 ? t / 0.1 : t > 0.7 ? (1 - t) / 0.3 : 1;
    });
}

// ------------------------------------------------------------
// ĐÁNH THƯỜNG: Sylva phi tiêu lá (`leaf` + `leafHit`) · Đại Bàng lông vũ vàng (`feather` + `featherHit`)
// ------------------------------------------------------------
export function spawnSylvaDart(from, to, { duration = 0.24, onHit } = {}) {
    shootArt('leaf', from, to, { size: 0.95, duration, arc: 0.18, onHit, glow: LEAF_GREEN });
}
export function spawnEagleFeather(from, to, { duration = 0.2, onHit } = {}) {
    shootArt('feather', from, to, { size: 1.05, duration, arc: 0, onHit, glow: GOLD_WARM, fps: 20 });
}
export function spawnSylvaDartHit(pos, { eagle = false } = {}) {
    playArt(eagle ? 'featherHit' : 'leafHit', pos.x, pos.y ?? 0.95, (pos.z ?? 0) + 0.65, 1.45, 0.32);
}

/** Sylva dùng chiêu: vòng phép dưới chân (gọi thú: vòng triệu hồi · Thần Hươu: vòng ban phước) + lá cuốn lên */
export function spawnSylvaCast(view, type) {
    if (!view) return;
    const p = view.position;
    const deer = type === 'sylva_deer';
    groundArt(deer ? 'deerRing' : 'summonRing', p.x, p.z ?? 0, deer ? 2.4 : 1.9, 0.9, { spin: 1.6, grow: 0.5 });
    spawnLeafBurst({ x: p.x, y: 0.6, z: p.z ?? 0 }, { count: 8, radius: 0.9, rise: 1.6, life: 0.7, gold: deer });
}

// ------------------------------------------------------------
// 1. SUMMON & SUMMON END — cột lá triệu hồi (`summon` 8 khung) trên vòng triệu hồi
// ------------------------------------------------------------
export function spawnSylvaSummon(x, z, { summonType = 'wolf' } = {}) {
    const zz = z ?? 0;
    const big = summonType === 'bear' || summonType === 'deer';
    groundArt(summonType === 'deer' ? 'deerRing' : 'summonRing', x, zz, big ? 2.4 : 1.8, 1.0, { spin: 1.4, grow: 0.5 });
    playArt('summon', x, FB_FLOOR, zz + 0.5, big ? 4.2 : 3.3, 0.75);
    spawnRisingSparkles({ x, y: 0, z: zz }, { count: fxBudget(6, 2), color: GOLD_LIGHT, radius: 0.9 });
}

/** `summonEnd`: thú tan thành lá (nửa sau cột triệu hồi: bung lá rồi rơi) */
export function spawnSylvaSummonEnd(pos) {
    if (!pos) return;
    playArt('summon', pos.x, FB_FLOOR, (pos.z ?? 0) + 0.5, 3.0, 0.5, { from: 4 });
    spawnLeafBurst({ x: pos.x, y: 0, z: pos.z ?? 0 }, { count: 8, radius: 1.1, rise: 1.0, life: 0.6, gold: true });
}

// ------------------------------------------------------------
// 2. SÓI RỪNG: howl · bite · pounce
// ------------------------------------------------------------
/** `howl`: sóng tru (`howl` 4 khung) phóng về phía đối thủ + vòng chấn động dưới đất + dấu giảm thủ trên đầu địch */
export function spawnWolfHowl(wolfPos, targetViews = [], { left = false } = {}) {
    if (wolfPos) {
        const dir = left ? -1 : 1;
        playArt('howl', wolfPos.x + dir * 1.6, GROUND_Y + 1.35, (wolfPos.z ?? 0) + 0.6, 2.6, 0.6, { flip: left, grow: 0.25 });
        groundArt('howlRing', wolfPos.x, wolfPos.z ?? 0, 3.6, 0.7, { grow: 0.7 });
    }
    const iconTex = armorBreakTexture();
    targetViews.forEach((tv, k) => {
        if (!tv) return;
        gameTimeout(() => {
            const h = (tv.height ?? 2.2) + (tv.sprite?.lift ?? 0) + 0.55;
            const ic = fxPlane(iconTex, 0.72, 0.72, { additive: false, opacity: 0 });
            addAnim(ic, 0.95, (q, fx) => {
                const cur = tv.position;
                const pop = q < 0.18 ? easeOut(q / 0.18) * 1.25 : 1.25 - 0.25 * Math.min(1, (q - 0.18) * 3);
                fx.mesh.position.set(cur.x, GROUND_Y + h + q * 0.28, (cur.z ?? 0) + 0.65);
                fx.mesh.scale.setScalar(pop);
                fx.mesh.material.opacity = q > 0.72 ? (1 - q) / 0.28 : 1;
            });
        }, 180 + k * 45);
    });
}

/** `bite`: nanh sói khép (`fang` 4 khung) trên mục tiêu; hồi máu -> dấu hồi máu trên sói */
export function spawnWolfBite(wolfPos, targetPos, { healed = false, wolfView = null } = {}) {
    if (targetPos) playArt('fang', targetPos.x, (targetPos.y ?? 0) + 1.0, (targetPos.z ?? 0) + 0.7, 2.3, 0.38, { grow: 0.15 });
    if (healed && wolfView) popIcon('heal', wolfView, { size: 0.95, life: 0.9 });
}

/** `pounce`: lá + bụi bật lên lúc nhảy */
export function spawnWolfPounce(from, to) {
    spawnLeafBurst(from, { count: 6, radius: 0.8, rise: 0.8, life: 0.45 });
    groundArt('dustTrail', from.x, from.z ?? 0, 1.4, 0.45, { grow: 0.3, opacity: 0.8 });
}
export function spawnWolfPounceImpact(pos) {
    if (!pos) return;
    groundArt('crater', pos.x, pos.z ?? 0, 1.5, 0.7, { grow: 0.4 });
    playArt('fang', pos.x, (pos.y ?? 0) + 1.0, (pos.z ?? 0) + 0.7, 1.6, 0.34);
}

// ------------------------------------------------------------
// 3. ĐẠI BÀNG: windOrb · featherWave · eagleEye
// ------------------------------------------------------------
/** `windOrb`: Cầu Gió (`windOrb` 4 khung lặp) bay tới mục tiêu, chạm thì nổ gió (`windBurst`) + vòng gió dưới đất */
export function spawnEagleWindOrb(from, to, { duration = 0.26, onHit } = {}) {
    shootArt('windOrb', from, to, { size: 1.45, duration, arc: 0.25, glow: LEAF_LIGHT, fps: 14, onHit: () => {
        playArt('windBurst', to.x, to.y ?? 1.0, (to.z ?? 0) + 0.7, 2.6, 0.42);
        groundArt('windRing', to.x, to.z ?? 0, 2.4, 0.6, { grow: 0.6, spin: 2.5 });
        onHit?.();
    } });
}

/** `featherWave`: mỗi điểm: vòng báo vàng (`stormWarn`) rồi chùm lông vũ lao xuống cắm đất (`storm` 8 khung, chạm ở khung 4) */
export function spawnFeatherWave(points = [], { radius = 2.5, onLand } = {}) {
    const life = 0.62, landAt = 0.24;
    points.forEach((pt) => {
        const tx = pt.x ?? 0, tz = pt.z ?? 0;
        groundArt('stormWarn', tx, tz, radius, life, { grow: 0.4, hold: 0.5 });
        playArt('storm', tx, FB_FLOOR, tz + 0.55, radius * 1.45, life);
    });
    if (onLand) gameTimeout(onLand, landAt * 1000);
}

const activeEagleEyes = new WeakMap();
/** `eagleEye`: mắt ưng vàng (`eye`) lơ lửng trên đầu Đại Bàng suốt `duration` ms */
export function spawnEagleEyeAura(eagleView, durationMs = 5000) {
    if (!eagleView) return;
    activeEagleEyes.get(eagleView)?.stop?.();
    const dur = Math.max(0.5, durationMs / 1000);
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 1.3, 1.3, { color: GOLD_WARM, opacity: 0.5 });
    const eye = art('eye', 0.95);
    eye.position.z = 0.02;
    g.add(glow, eye);
    let stopped = false;
    activeEagleEyes.set(eagleView, { stop: () => { stopped = true; g.visible = false; } });
    groundArt('windRing', eagleView.position.x, eagleView.position.z ?? 0, 2.2, 0.55, { grow: 0.6, spin: 3 });
    addAnim(g, dur, (p, fx) => {
        if (stopped || eagleView.member?.alive === false) { fx.mesh.visible = false; return; }
        const pos = eagleView.position;
        const h = (eagleView.height ?? 1.8) + (eagleView.sprite?.lift ?? 0) + 0.7 + Math.sin(p * dur * 5) * 0.06;
        fx.mesh.position.set(pos.x, GROUND_Y + h, (pos.z ?? 0) + 0.65);
        const fade = p < 0.08 ? p / 0.08 : p > 0.88 ? (1 - p) / 0.12 : 1;
        const pulse = 0.94 + 0.1 * Math.sin(p * dur * 8);
        eye.scale.setScalar(pulse);
        eye.material.opacity = fade;
        glow.material.opacity = 0.5 * fade;
    });
}

// ------------------------------------------------------------
// 4. GẤU HỘ VỆ: bearCharge (ủi đi -> phanh, quay đầu -> ủi về) · bearGuard
// ------------------------------------------------------------
/**
 * `bearCharge`: di chuyển Gấu dọc `path = [{x,z,at,turn?}...]` (mốc ms theo server). Đoạn đứng yên (`turn`) = phanh + quay đầu
 * (động tác 'turn': tranh vẽ quay mặt sẵn -> đổi hướng nhìn khi xong). Suốt lúc ủi: bụi đá cuộn sau lưng (`dust` 4 khung lặp).
 * `elapsedMs`: hình con Gấu tới muộn so với server -> bắt đầu từ giữa đường.
 */
export function startBearCharge(bearView, path = [], { elapsedMs = 0 } = {}) {
    if (!bearView || path.length < 2) return;
    const lastAt = path[path.length - 1].at ?? 2400;
    const start = Math.min(lastAt - 1, elapsedMs);
    const totalSec = Math.max(0.2, (lastAt - start) / 1000);
    let phase = '';
    let dustTimer = 0;
    addAnim(new THREE.Group(), totalSec, (p, _fx, dt) => {
        if (bearView.member?.alive === false) return;
        const ms = start + p * (lastAt - start);
        let i = 0;
        while (i < path.length - 2 && ms > (path[i + 1].at ?? 0)) i++;
        const a = path[i], b = path[i + 1] ?? a;
        const t0 = a.at ?? 0, t1 = Math.max(t0 + 1, b.at ?? t0 + 1);
        const u = Math.max(0, Math.min(1, (ms - t0) / (t1 - t0)));
        const nx = a.x + (b.x - a.x) * u, nz = (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * u;
        const moving = Math.abs(b.x - a.x) > 0.05;
        const want = moving ? 'ram' : 'turn';
        if (want !== phase) {
            if (want === 'turn') {
                // phanh: bụi tung + hố cào đất; giữ hướng cũ (tranh tự quay mặt), xong đoạn quay mới lật hướng
                groundArt('crater', nx, nz, 1.6, 0.8, { grow: 0.3 });
                playArt('dust', nx, FB_FLOOR, nz + 0.4, 2.2, 0.5, { flip: bearView.facingLeft });
                if (!bearView.playAction?.('turn')) bearView.playAction?.('ram', { hold: true });
            } else {
                bearView.facingLeft = b.x < a.x;
                if (!bearView.playAction?.('ram', { hold: true })) bearView.playAction?.('move', { hold: true });
            }
            phase = want;
        }
        // giữa đoạn phanh: lật hướng sang đường ủi về (tranh khung 5-8 là gầm hướng mới)
        if (!moving && u >= 0.5) { const c = path[i + 2]; if (c) bearView.facingLeft = c.x < b.x; }
        bearView.basePos.set(nx, 0, nz);
        bearView.root.position.x = nx;
        bearView.root.position.z = nz;
        dustTimer -= dt;
        if (moving && dustTimer <= 0) {
            dustTimer = 0.11;
            const left = b.x < a.x;
            const puff = art('dust', 1.9, { opacity: 0.95 });
            puff.position.set(nx + (left ? 0.9 : -0.9), FB_FLOOR, nz + 0.35);
            puff.scale.x = left ? -1 : 1;
            addAnim(puff, 0.42, (q, fx) => {
                setArt(fx.mesh, Math.min(FB.count('dust') - 1, Math.floor(q * FB.count('dust'))));   // bụi cuộn lớn dần
                fx.mesh.material.opacity = 0.95 * (1 - q);
            });
        }
        if (p >= 1) {
            const endPt = path[path.length - 1];
            bearView.teleport(endPt.x, endPt.z ?? 0, false);
            bearView._interruptOneShot?.();
        }
    });
}

/** Va chạm khi Gấu húc trúng (`ram` 4 khung: loé vàng -> đá văng -> bụi) + hố nứt đất */
export function spawnBearHitImpact(pos) {
    if (!pos) return;
    playArt('ram', pos.x, FB_FLOOR, (pos.z ?? 0) + 0.7, 2.7, 0.5);
    groundArt('crater', pos.x, pos.z ?? 0, 1.7, 0.9, { grow: 0.3 });
}
/** Dấu vuốt khiêu khích (Hộ Chủ) trên đầu kẻ bị Gấu ủi */
export function spawnBearTauntMark(view) {
    if (view) popIcon('claw', view, { size: 0.9, life: 1.1, rise: 0.25 });
}

// ------------------------------------------------------------
// 5. THẦN HƯƠU (Field Summon): deer · deerTick · deerEnd
// ------------------------------------------------------------
const activeDeers = new Map();

function deerKey(casterId, casterIdx) {
    return `${casterId ?? 's'}:${casterIdx ?? 0}`;
}

// ---------- Thần Hươu vẽ tay (atlas deer_sprite: idle1-4 · bless1-4) ----------
let deerTexCache = null;
function deerTexture() {
    if (!deerTexCache) {
        deerTexCache = getTexture(deerUrl);
        deerTexCache.colorSpace = THREE.SRGBColorSpace;
    }
    return deerTexCache;
}
/** Trả về hàm đổi khung cho hình học geo: gốc = tâm đứng dưới chân, cao h (đỉnh sừng khung đứng) */
function deerFramer(geo, h) {
    const [W, H] = deerMeta.size;
    const tops = Object.keys(deerMeta.frames).filter(k => k.startsWith('idle')).map(k => deerMeta.frames[k].top).sort((a, b) => a - b);
    const u = h / tops[tops.length >> 1];
    let cur = '';
    return (name) => {
        const f = deerMeta.frames[name];
        if (!f || name === cur) return;
        cur = name;
        const [x, y, w, fh] = f.rect, [ox, oy] = f.org;
        geo.attributes.position.array.set([-ox * u, oy * u, 0, (w - ox) * u, oy * u, 0, -ox * u, (oy - fh) * u, 0, (w - ox) * u, (oy - fh) * u, 0]);
        geo.attributes.position.needsUpdate = true;
        geo.attributes.uv.array.set([x / W, 1 - y / H, (x + w) / W, 1 - y / H, x / W, 1 - (y + fh) / H, (x + w) / W, 1 - (y + fh) / H]);
        geo.attributes.uv.needsUpdate = true;
    };
}

/**
 * `deer`: Thần Hươu ánh sáng đứng tại `(x, z)` trong `duration` ms.
 * Có vòng cổ ngữ rừng xoay dưới chân, thân hươu phát sáng, sừng lấp lánh đốm vàng-lục.
 */
export function spawnSpiritDeer(casterId, casterIdx, x, z, durationMs = 10000, { faceLeft = false } = {}) {
    endSpiritDeer(casterId, casterIdx, true);

    const totalSec = Math.max(0.8, durationMs / 1000);
    const tz = z ?? 0;

    const root = new THREE.Group();
    root.position.set(x, GROUND_Y, tz + 0.38);

    // Vòng cổ ngữ rừng xoay dưới chân Thần Hươu
    // Vòng ban phước vẽ tay (deerRing) dưới chân Thần Hươu
    const rune = artDecal('deerRing', 0, -0.35, 2.6, { opacity: 0 });
    rune.position.y = 0.04;

    // Quầng sáng nền
    const backGlow = fxPlane(glowTexture(), 3.8, 3.8, { color: LEAF_GREEN, opacity: 0 });
    backGlow.position.set(0, 1.65, -0.05);

    // Thân Thần Hươu (lớp chính + lớp cộng sáng dịu ở sừng)
    // Thân Thần Hươu = tranh Codex vẽ (art/sylva/deer, atlas deer_sprite): đứng thở + ban phước mỗi lần hồi máu.
    //   Lớp chính + lớp cộng sáng vàng dùng chung 1 hình học (gốc dưới chân, đổi khung = đổi toạ độ + UV)
    const deerH = 3.0;
    const deerGeo = new THREE.PlaneGeometry(1, 1);
    const deerTex = deerTexture();
    const body = new THREE.Mesh(deerGeo, new THREE.MeshBasicMaterial({ map: deerTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    const shine = new THREE.Mesh(deerGeo, new THREE.MeshBasicMaterial({ map: deerTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, color: GOLD_LIGHT }));
    body.userData.sharedTexture = shine.userData.sharedTexture = true;
    const dir = faceLeft ? -1 : 1;
    body.scale.set(dir, 1, 1);
    shine.scale.set(dir * 1.03, 1.03, 1);
    body.position.set(0, 0, 0);
    shine.position.set(0, 0, 0.02);
    const setDeerFrame = deerFramer(deerGeo, deerH);
    setDeerFrame('idle1');

    // Nhãn nhỏ "Triệu hồi" trên đầu Thần Hươu
    const tagTex = makeCanvasTex('summonTag', 128, 32, (ctx) => {
        ctx.fillStyle = 'rgba(6,78,59,0.82)';
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(6, 4, 116, 24, 12);
        ctx.fill();
        ctx.stroke();
        ctx.font = '800 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#bbf7d0';
        ctx.fillText('🦌 Triệu hồi', 64, 16);
    });
    const tag = fxPlane(tagTex, 1.35, 0.34, { additive: false, opacity: 0 });
    tag.position.set(0, deerH + 0.35, 0.05);

    root.add(rune, backGlow, body, shine, tag);

    const state = {
        x,
        z: tz,
        root,
        fading: false,
        fadeT: 0,
        sparkTimer: 0.25,
        dead: false,
    };

    spawnSylvaSummon(x, tz, { summonType: 'deer' });

    addAnim(root, totalSec + 0.6, (p, _fx, dt) => {
        if (state.dead) return;
        const age = p * (totalSec + 0.6);

        if (state.fading || age >= totalSec) {
            state.fading = true;
            state.fadeT = Math.min(1, state.fadeT + dt / 0.45);
            const k = 1 - state.fadeT;
            body.material.opacity = 0.95 * k;
            shine.material.opacity = 0.35 * k;
            backGlow.material.opacity = 0.45 * k;
            rune.material.opacity = 0.8 * k;
            tag.material.opacity = 0.9 * k;
            root.position.y = GROUND_Y + state.fadeT * 0.35;
            if (state.fadeT >= 1) {
                state.dead = true;
                root.visible = false;
            }
            return;
        }

        const fadeIn = Math.min(1, age / 0.35);
        const bob = Math.sin(age * 2.6) * 0.08;
        const pulse = 0.85 + 0.15 * Math.sin(age * 4.5);

        body.position.y = bob;
        shine.position.y = bob;
        // ban phước (cúi đầu -> ngẩng sừng lên trời) 0,8s sau mỗi lần hồi máu, còn lại đứng thở
        state.blessT = Math.max(0, (state.blessT ?? 0) - dt);
        setDeerFrame(state.blessT > 0 ? `bless${Math.min(4, 1 + Math.floor((0.8 - state.blessT) / 0.2))}` : `idle${1 + (Math.floor(age * 2.5) % 4)}`);
        tag.position.y = deerH + 0.35 + bob;
        body.material.opacity = 0.95 * fadeIn;
        shine.material.opacity = (0.28 + 0.16 * Math.sin(age * 6)) * fadeIn;
        backGlow.material.opacity = 0.42 * fadeIn * pulse;
        backGlow.scale.setScalar(0.95 + 0.1 * pulse);
        rune.rotation.z += dt * 1.1;
        rune.material.opacity = 0.82 * fadeIn;
        tag.material.opacity = 0.92 * fadeIn;

        state.sparkTimer -= dt;
        if (state.sparkTimer <= 0) {
            state.sparkTimer = 0.45 + Math.random() * 0.25;
            spawnRisingSparkles({ x, y: 0.4, z: tz }, { count: fxBudget(3, 1), color: GOLD_LIGHT, radius: 1.1 });
        }
    });

    activeDeers.set(deerKey(casterId, casterIdx), state);
}

/** `deerTick`: Thần Hươu ban phước (tranh tự ngẩng sừng) + vòng ban phước toả dưới hươu + dấu hồi máu trên từng đồng đội */
export function spawnDeerTick(casterId, casterIdx, allyViews = []) {
    const st = activeDeers.get(deerKey(casterId, casterIdx));
    if (st && !st.dead) {
        st.blessT = 0.8;
        groundArt('deerRing', st.x, st.z, 3.2, 0.7, { grow: 0.6, opacity: 0.85 });
    }
    allyViews.forEach((v, k) => {
        if (!v) return;
        groundArt('deerRing', v.position.x, v.position.z ?? 0, 1.1, 0.55, { grow: 0.5, opacity: 0.8 });
        popIcon('heal', v, { size: 0.7, life: 0.75, rise: 0.45, dy: 0.2, delay: k * 0.04 });
    });
}

/** `deerEnd`: Thần Hươu mờ dần và tan thành lá sáng */
export function endSpiritDeer(casterId, casterIdx, immediate = false) {
    const key = deerKey(casterId, casterIdx);
    const st = activeDeers.get(key);
    if (!st) return;
    activeDeers.delete(key);
    if (immediate) {
        st.dead = true;
        st.root.visible = false;
        return;
    }
    st.fading = true;
    playArt('summon', st.x, FB_FLOOR, st.z + 0.5, 3.4, 0.55, { from: 4 });
}

// ------------------------------------------------------------
// 6. THIÊN PHÚ 1 & 2: leafShield · forestMight
// ------------------------------------------------------------
const activeLeafShields = new WeakMap();

/** `leafShield` (Thiên phú 2): vòm Khiên Lá (`dome` 4 khung lặp) + vòng lá dưới chân, bám theo thú suốt lúc còn khiên */
export function spawnLeafShield(targetView, durationMs = 7000) {
    if (!targetView) return;
    activeLeafShields.get(targetView)?.stop?.();
    const dur = Math.max(0.6, durationMs / 1000);
    const h = (targetView.height ?? 2.0) + (targetView.sprite?.lift ?? 0);
    const domeH = h * 1.15;
    const dome = art('dome', domeH, { opacity: 0 });
    const ring = artDecal('shieldRing', 0, 0, 1.5, { opacity: 0 });
    const rsx = ring.scale.x, rsy = ring.scale.y;
    let stopped = false;
    activeLeafShields.set(targetView, { stop: () => { stopped = true; dome.visible = false; ring.visible = false; } });
    spawnLeafBurst(targetView.position, { count: 8, radius: 1.0, rise: 1.1, gold: true });
    const ph = Math.random() * 4;
    addAnim(ring, dur, () => {});
    addAnim(dome, dur, (p, fx) => {
        const now = gameNow();
        const hasShield = targetView.member?.statusEffects?.some(e => e.type === 'leaf_shield' && e.endTime > now && (e.hp ?? 1) > 0);
        // 0,6s đầu gói stateUpdate có thể chưa tới -> vẫn hiện
        if (stopped || targetView.member?.alive === false || (p * dur > 0.6 && !hasShield)) {
            fx.mesh.visible = false; ring.visible = false;
            return;
        }
        const tp = targetView.position;
        const fade = p < 0.08 ? p / 0.08 : p > 0.92 ? (1 - p) / 0.08 : 1;
        fx.mesh.position.set(tp.x, FB_FLOOR, (tp.z ?? 0) + 0.75);
        setArt(fx.mesh, loopFrame(p * dur, 6 * FB.count('dome') / 4, FB.count('dome'), ph));
        fx.mesh.material.opacity = 0.72 * fade;
        ring.position.x = tp.x;
        ring.position.z = tp.z ?? 0;
        ring.scale.set(rsx, rsy, 1);
        ring.material.opacity = 0.75 * fade;
    });
}

/** `forestMight` (Thiên phú 1): mũi tên lá (`might`) bật lên trên mọi đồng minh còn sống (nhiều tầng -> nhiều mũi tên) */
export function spawnForestMight(allyViews = [], stacks = 1) {
    const n = Math.min(3, Math.max(1, stacks >= 4 ? 3 : stacks >= 2 ? 2 : 1));
    allyViews.forEach((v, idx) => {
        if (!v) return;
        for (let k = 0; k < n; k++) {
            popIcon('might', v, { size: 0.6, life: 0.8, rise: 0.7, dy: 0.1, ox: (k - (n - 1) / 2) * 0.45, delay: idx * 0.04 + k * 0.06 });
        }
    });
}

/** Nhãn chữ "Triệu hồi" (nền xanh lá bo tròn) — 1 texture dùng chung */
function summonTagTexture() {
    return makeCanvasTex('summonTagUnit', 256, 64, (g, w, h) => {
        const r = 26;
        g.beginPath();
        g.moveTo(r, 4); g.lineTo(w - r, 4); g.arc(w - r, h / 2, h / 2 - 4, -Math.PI / 2, Math.PI / 2);
        g.lineTo(r, h - 4); g.arc(r, h / 2, h / 2 - 4, Math.PI / 2, Math.PI * 1.5); g.closePath();
        g.fillStyle = 'rgba(20, 83, 45, 0.85)'; g.fill();
        g.lineWidth = 3; g.strokeStyle = '#86efac'; g.stroke();
        g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#dcfce7'; g.fillText('Triệu hồi', w / 2, h / 2 + 2);
    });
}

/**
 * Gắn nhãn nhỏ "Triệu hồi" phía trên thanh máu cho mọi đơn vị có `member.summon = true` (Golem, Sói, Ưng, Gấu).
 */
export function ensureSummonTag(view) {
    if (!view?.root || !view?.member?.summon) return;
    if (!view._summonTagSprite) {
        const mat = new THREE.SpriteMaterial({
            map: summonTagTexture(),
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        const sp = new THREE.Sprite(mat);
        sp.scale.set(1.22, 0.31, 1);
        sp.renderOrder = 22;
        view.root.add(sp);
        view._summonTagSprite = sp;
    }
    const hpY = view.hpBar?.position?.y ?? ((view.height ?? 2.2) + 0.8);
    view._summonTagSprite.position.set(0, hpY + 0.32, 0.02);
    view._summonTagSprite.visible = view.member?.alive !== false;
}

