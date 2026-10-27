// ============================================================
// HIỆU ỨNG LÂM LINH — Sylva (Triệu Hồi Sư) & các linh thú rừng thiêng
// ============================================================
// Toàn bộ hiệu ứng vẽ bằng thủ tục (procedural canvas + Three.js):
//   Màu rừng thiêng: lá xanh (#22c55e / #86efac), nâu vỏ cây (#78350f / #a16207), ánh vàng (#fde047 / #facc15).
//   Tái sử dụng geometry (planeGeo qua fxPlane), texture canvas lưu cache, tự thu hồi trong updateVfx(dt).
import * as THREE from 'three';
import deerUrl from '../assets/sprites/deer_sprite.webp';
import deerMeta from '../characters/sprite/deerSprite.json';
import { GROUND_Y, gameNow, gameTimeout } from '../config.js';
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
            fx.mesh.position.set(
                x0 + vx * e + Math.sin(p * 8 + i) * 0.1,
                y0 + vy * e - p * p * 0.55,
                z0 + vz * e,
            );
            fx.mesh.rotation.z = spin0 + spinV * p;
            const sc = 1 - p * 0.35;
            fx.mesh.scale.setScalar(sc);
            fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 0.95;
        });
    }
}

// ------------------------------------------------------------
// ĐÁNH THƯỜNG CỦA SYLVA: phi tiêu gai lá xanh bay tới mục tiêu
// ------------------------------------------------------------
export function spawnSylvaDart(from, to, { duration = 0.22, onHit } = {}) {
    const g = new THREE.Group();
    const dart = fxPlane(leafDartTexture(), 0.95, 0.36, { additive: false });
    const glow = fxPlane(glowTexture(), 0.75, 0.5, { color: LEAF_GREEN, opacity: 0.55 });
    g.add(glow, dart);
    const dx = to.x - from.x;
    const dy = (to.y ?? 0.95) - (from.y ?? 1.15);
    const z0 = (from.z ?? 0) + 0.5;
    const z1 = (to.z ?? 0) + 0.55;
    g.rotation.z = Math.atan2(dy, dx);
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(
            from.x + dx * p,
            (from.y ?? 1.15) + dy * p,
            z0 + (z1 - z0) * p,
        );
        if (p >= 1 && !hit) {
            hit = true;
            onHit?.();
        }
    });
}

// ---- Bản tạm (vẽ bằng code) — sẽ thay bằng tranh vẽ tay atlas sylva_fx2 khi đủ 9 tấm (art/sylva/fx2/PROMPTS_FX.md) ----
/** Đại Bàng đánh thường: lông vũ vàng bay thẳng tới mục tiêu */
export function spawnEagleFeather(from, to, { duration = 0.2, onHit } = {}) {
    const g = new THREE.Group();
    const f = fxPlane(featherTexture(), 0.34, 0.95, { additive: false });
    f.rotation.z = -Math.PI / 2;
    const glow = fxPlane(glowTexture(), 0.8, 0.45, { color: GOLD_WARM, opacity: 0.5 });
    g.add(glow, f);
    const dx = to.x - from.x;
    const dy = (to.y ?? 0.95) - (from.y ?? 1.5);
    const z0 = (from.z ?? 0) + 0.5, z1 = (to.z ?? 0) + 0.55;
    g.rotation.z = Math.atan2(dy, dx);
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(from.x + dx * p, (from.y ?? 1.5) + dy * p, z0 + (z1 - z0) * p);
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}
/** Sylva dùng chiêu: vòng cổ ngữ rừng xoay dưới chân + lá cuốn lên */
export function spawnSylvaCast(view, type) {
    if (!view) return;
    const p = view.position;
    const rune = fxPlane(forestRuneTexture(), 2.6, 2.6, { color: type === 'sylva_deer' ? GOLD_LIGHT : 0xffffff, opacity: 0 });
    rune.rotation.x = -Math.PI / 2;
    rune.position.set(p.x, FLOOR, p.z ?? 0);
    addAnim(rune, 0.8, (q, fx, dt) => {
        const s = 0.5 + easeOut(Math.min(1, q * 2)) * 0.6;
        fx.mesh.scale.set(s, s * 0.8, 1);
        fx.mesh.rotation.z += dt * 2;
        fx.mesh.material.opacity = q < 0.15 ? q / 0.15 : (1 - q) / 0.85;
    });
    spawnLeafBurst({ x: p.x, y: 0.6, z: p.z ?? 0 }, { count: 8, radius: 0.9, rise: 1.6, life: 0.7, gold: type === 'sylva_deer' });
}
/** Dấu khiêu khích (Hộ Chủ của Gấu) trên đầu kẻ bị ủi */
export function spawnBearTauntMark(view) {
    if (!view) return;
    spawnHitSpark(view.position, { count: fxBudget(5, 2), color: ARMOR_RED, size: 0.9 });
    const ic = fxPlane(armorBreakTexture(), 0.7, 0.7, { additive: false, opacity: 0 });
    addAnim(ic, 1.0, (q, fx) => {
        const cur = view.position;
        fx.mesh.position.set(cur.x, GROUND_Y + (view.height ?? 2.2) + 0.6 + q * 0.25, (cur.z ?? 0) + 0.65);
        fx.mesh.material.opacity = q < 0.1 ? q / 0.1 : q > 0.7 ? (1 - q) / 0.3 : 1;
    });
}

export function spawnSylvaDartHit(pos) {
    spawnHitSpark(pos, { count: fxBudget(6, 2), color: LEAF_LIGHT, size: 0.85 });
    spawnLeafBurst(pos, { count: 4, radius: 0.65, rise: 0.7, life: 0.4 });
}

// ------------------------------------------------------------
// 1. SUMMON & SUMMON END — triệu hồi & tan biến linh thú
// ------------------------------------------------------------
/** `summon`: vòng cổ ngữ rừng xanh-vàng dưới đất + cột sáng + lá bung */
export function spawnSylvaSummon(x, z, { summonType = 'wolf' } = {}) {
    const pos = { x, y: 0, z: z ?? 0 };
    const isBear = summonType === 'bear';
    const R = isBear ? 2.6 : 1.9;

    // Vòng cổ ngữ rừng xoay dưới đất
    const rune = fxPlane(forestRuneTexture(), R * 1.4, R * 1.4, { color: 0xffffff, opacity: 0 });
    rune.rotation.x = -Math.PI / 2;
    rune.position.set(x, FLOOR, pos.z);
    addAnim(rune, 0.75, (p, fx, dt) => {
        const s = 0.45 + easeOut(Math.min(1, p * 2.2)) * 0.65;
        fx.mesh.scale.set(s, s * 0.82, 1);
        fx.mesh.rotation.z += dt * 2.2;
        fx.mesh.material.opacity = p < 0.15 ? p / 0.15 : (1 - p) / 0.85;
    });

    // Cột ánh sáng xanh-vàng bừng lên
    const pillar = fxPlane(sparkTexture(), isBear ? 1.5 : 1.1, isBear ? 4.2 : 3.2, { color: LEAF_LIGHT, opacity: 0.85 });
    pillar.position.set(x, GROUND_Y + (isBear ? 1.8 : 1.4), pos.z + 0.45);
    addAnim(pillar, 0.48, (p, fx) => {
        fx.mesh.scale.set(1 - p * 0.55, 0.6 + easeOut(p) * 0.55, 1);
        fx.mesh.material.opacity = 0.85 * (1 - p);
    });

    spawnShockwave(pos, { color: LEAF_GREEN, radius: R * 1.15, life: 0.48 });
    spawnLeafBurst(pos, { count: isBear ? 14 : 10, radius: isBear ? 1.5 : 1.1, rise: 1.5, gold: true });
    spawnRisingSparkles(pos, { count: fxBudget(8, 3), color: GOLD_LIGHT, radius: 0.9 });
}

/** `summonEnd`: lá rừng bung tán loạn khi thú triệu hồi hết giờ / bị thay */
export function spawnSylvaSummonEnd(pos) {
    if (!pos) return;
    const p0 = { x: pos.x, y: 0, z: pos.z ?? 0 };
    spawnLeafBurst(p0, { count: 12, radius: 1.25, rise: 1.1, life: 0.6, gold: true });
    const ring = fxPlane(ringTexture(), 1, 1, { color: LEAF_LIGHT, opacity: 0.7 });
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p0.x, FLOOR, p0.z);
    addAnim(ring, 0.42, (p, fx) => {
        const s = 0.6 + easeOut(p) * 2.2;
        fx.mesh.scale.set(s, s * 0.8, 1);
        fx.mesh.material.opacity = 0.7 * (1 - p);
    });
}

// ------------------------------------------------------------
// 2. SÓI RỪNG: howl · bite · pounce
// ------------------------------------------------------------
/** `howl`: sóng âm lan ra từ Sói Rừng + biểu tượng khiên nứt đỏ trên đầu các mục tiêu */
export function spawnWolfHowl(wolfPos, targetViews = []) {
    if (wolfPos) {
        const x0 = wolfPos.x;
        const y0 = (wolfPos.y ?? 0) + 1.15;
        const z0 = (wolfPos.z ?? 0) + 0.6;
        for (let i = 0; i < 3; i++) {
            const delay = i * 0.09;
            const ring = fxPlane(ringTexture(), 1, 1, { color: i === 0 ? GOLD_LIGHT : LEAF_LIGHT, opacity: 0 });
            addAnim(ring, 0.55 + delay, (p, fx) => {
                const t = Math.max(0, (p * (0.55 + delay) - delay) / 0.55);
                if (t <= 0) return;
                const s = 0.5 + easeOut(t) * 3.8;
                fx.mesh.position.set(x0, y0, z0);
                fx.mesh.scale.set(s, s, 1);
                fx.mesh.material.opacity = 0.85 * (1 - t);
            });
        }
        spawnShockwave(wolfPos, { color: LEAF_GREEN, radius: 5.5, life: 0.5 });
    }

    const iconTex = armorBreakTexture();
    targetViews.forEach((tv, k) => {
        if (!tv) return;
        gameTimeout(() => {
            const p = tv.position;
            const h = (tv.height ?? 2.2) + 0.55;
            const ic = fxPlane(iconTex, 0.72, 0.72, { additive: false, opacity: 0 });
            addAnim(ic, 0.95, (q, fx) => {
                const cur = tv.position;
                const pop = q < 0.18 ? easeOut(q / 0.18) * 1.25 : 1.25 - 0.25 * Math.min(1, (q - 0.18) * 3);
                fx.mesh.position.set(cur.x, GROUND_Y + h + q * 0.28, (cur.z ?? 0) + 0.65);
                fx.mesh.scale.setScalar(pop);
                fx.mesh.material.opacity = q > 0.72 ? (1 - q) / 0.28 : 1;
            });
            spawnHitSpark(p, { count: fxBudget(4, 2), color: ARMOR_RED, size: 0.75 });
        }, 80 + k * 45);
    });
}

/** `bite`: hàm răng nanh sói khép mạnh trên mục tiêu + vòng lục hồi máu trên sói */
export function spawnWolfBite(wolfPos, targetPos, { healed = false } = {}) {
    if (targetPos) {
        const x = targetPos.x;
        const y = (targetPos.y ?? 0) + 0.95;
        const z = (targetPos.z ?? 0) + 0.65;
        const jaws = fxPlane(fangBiteTexture(), 1.55, 1.55, { additive: false });
        jaws.position.set(x, y, z);
        addAnim(jaws, 0.34, (p, fx) => {
            // Hàm răng khép nhanh rồi mờ
            const sy = p < 0.35 ? 1.35 - (p / 0.35) * 0.6 : 0.75;
            const sx = p < 0.35 ? 0.9 + (p / 0.35) * 0.25 : 1.15;
            fx.mesh.scale.set(sx, sy, 1);
            fx.mesh.material.opacity = p > 0.65 ? (1 - p) / 0.35 : 1;
        });
        spawnHitSpark(targetPos, { count: fxBudget(7, 3), color: ARMOR_RED, size: 1.0 });
    }
    if (healed && wolfPos) {
        spawnRisingSparkles(wolfPos, { count: fxBudget(7, 3), color: LEAF_GREEN, radius: 0.7 });
    }
}

/** `pounce`: vệt nhảy vồ của Sói Rừng + chấn động móng vuốt khi đáp */
export function spawnWolfPounce(from, to) {
    spawnLeafBurst(from, { count: 6, radius: 0.8, rise: 0.8, life: 0.45 });
    spawnLandingDust({ x: from.x, y: 0, z: from.z ?? 0 }, 6);

    const dx = to.x - from.x;
    const dz = (to.z ?? 0) - (from.z ?? 0);
    const trail = fxPlane(leafDartTexture(), 1.3, 0.42, { color: LEAF_LIGHT, opacity: 0.75 });
    const left = dx < 0;
    trail.scale.x = left ? -1 : 1;
    addAnim(trail, 0.34, (p, fx) => {
        const arc = Math.sin(p * Math.PI) * 1.65;
        fx.mesh.position.set(
            from.x + dx * p,
            GROUND_Y + 0.8 + arc,
            (from.z ?? 0) + dz * p + 0.5,
        );
        fx.mesh.material.opacity = 0.75 * (1 - p * 0.5);
    });
}

export function spawnWolfPounceImpact(pos) {
    if (!pos) return;
    spawnLandingDust({ x: pos.x, y: 0, z: pos.z ?? 0 }, 8);
    spawnShockwave(pos, { color: LEAF_LIGHT, radius: 2.2, life: 0.38 });
    spawnHitSpark(pos, { count: fxBudget(7, 3), color: GOLD_LIGHT, size: 1.05 });
}

// ------------------------------------------------------------
// 3. ĐẠI BÀNG: windOrb · featherWave · eagleEye
// ------------------------------------------------------------
/** `windOrb`: quả cầu gió xoáy bay từ Đại Bàng tới mục tiêu, chạm thì bung lốc đẩy lùi */
export function spawnEagleWindOrb(from, to, { duration = 0.26, onHit } = {}) {
    const g = new THREE.Group();
    const orb = fxPlane(windOrbTexture(), 1.25, 1.25, { additive: false });
    const glow = fxPlane(glowTexture(), 1.6, 1.6, { color: LEAF_LIGHT, opacity: 0.55 });
    g.add(glow, orb);

    const dx = to.x - from.x;
    const dy = (to.y ?? 1.0) - (from.y ?? 1.35);
    const z0 = (from.z ?? 0) + 0.58;
    const z1 = (to.z ?? 0) + 0.62;
    let hit = false;

    addAnim(g, duration, (p, fx, dt) => {
        fx.mesh.position.set(
            from.x + dx * p,
            (from.y ?? 1.35) + dy * p + Math.sin(p * Math.PI) * 0.35,
            z0 + (z1 - z0) * p,
        );
        orb.rotation.z -= dt * 14;
        glow.scale.setScalar(0.92 + 0.15 * Math.sin(p * 24));
        if (p >= 1 && !hit) {
            hit = true;
            // Nổ gió tại điểm trúng
            spawnShockwave(to, { color: LEAF_LIGHT, radius: 2.5, life: 0.38 });
            spawnLeafBurst(to, { count: 7, radius: 0.95, rise: 1.0, life: 0.45 });
            spawnHitSpark(to, { count: fxBudget(7, 3), color: LEAF_LIGHT, size: 1.0 });
            onHit?.();
        }
    });
}

/** `featherWave`: đợt mưa lông vũ vàng-nâu lao từ trên cao xuống các điểm `points` (bán kính `radius`) */
export function spawnFeatherWave(points = [], { radius = 2.5, onLand } = {}) {
    const fTex = featherTexture();
    const fallDur = 0.24;
    let triggered = false;

    points.forEach((pt, idx) => {
        const tx = pt.x ?? 0;
        const tz = pt.z ?? 0;

        // Vòng báo nhẹ trên đất
        const ring = fxPlane(ringTexture(), 1, 1, { color: GOLD_WARM, opacity: 0.55 });
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(tx, FLOOR, tz);
        addAnim(ring, fallDur + 0.18, (p, fx) => {
            const s = radius * (0.5 + 0.5 * easeOut(Math.min(1, p * 1.5)));
            fx.mesh.scale.set(s * 2, s * 1.5, 1);
            fx.mesh.material.opacity = 0.55 * (1 - p);
        });

        // 5 chiếc lông vũ cắm chéo xuống vùng nổ
        const count = fxBudget(5, 2);
        for (let k = 0; k < count; k++) {
            const ox = (Math.random() - 0.5) * radius * 1.2;
            const oz = (Math.random() - 0.5) * radius * 0.7;
            const sx = tx + ox - 1.2;
            const sy = 4.6 + Math.random() * 1.4;
            const ex = tx + ox;
            const ey = GROUND_Y + 0.25;
            const f = fxPlane(fTex, 0.34, 0.9, { additive: false });
            f.rotation.z = Math.atan2(ey - sy, ex - sx) + Math.PI / 2;
            const d0 = k * 0.025;
            addAnim(f, fallDur + d0, (p, fx) => {
                const t = Math.max(0, (p * (fallDur + d0) - d0) / fallDur);
                fx.mesh.position.set(
                    sx + (ex - sx) * t,
                    sy + (ey - sy) * t,
                    tz + oz + 0.55,
                );
                fx.mesh.material.opacity = t <= 0 ? 0 : 1;
            });
        }

        gameTimeout(() => {
            spawnHitSpark({ x: tx, y: 0, z: tz }, { count: fxBudget(5, 2), color: GOLD_LIGHT, size: 0.85 });
            if (!triggered && idx === 0) {
                triggered = true;
                onLand?.();
            }
        }, fallDur * 1000);
    });

    if (!points.length && onLand) onLand();
}

const activeEagleEyes = new WeakMap();

/** `eagleEye`: hào quang mắt ưng vàng rực lơ lửng trên đầu Đại Bàng suốt `duration` ms */
export function spawnEagleEyeAura(eagleView, durationMs = 5000) {
    if (!eagleView) return;
    activeEagleEyes.get(eagleView)?.stop?.();

    const dur = Math.max(0.5, durationMs / 1000);
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 1.35, 1.35, { color: GOLD_WARM, opacity: 0.65 });
    const eye = fxPlane(eagleEyeTexture(), 1.15, 0.58, { additive: false });
    eye.position.z = 0.02;
    g.add(glow, eye);

    let stopped = false;
    activeEagleEyes.set(eagleView, { stop: () => { stopped = true; g.visible = false; } });

    spawnShockwave(eagleView.position, { color: GOLD_LIGHT, radius: 2.2, life: 0.38 });

    addAnim(g, dur, (p, fx) => {
        if (stopped || eagleView.member?.alive === false) {
            fx.mesh.visible = false;
            return;
        }
        const pos = eagleView.position;
        const h = (eagleView.height ?? 1.85) + 0.75 + Math.sin(p * dur * 5) * 0.07;
        fx.mesh.position.set(pos.x, GROUND_Y + h, (pos.z ?? 0) + 0.65);
        const fade = p < 0.08 ? p / 0.08 : p > 0.88 ? (1 - p) / 0.12 : 1;
        const pulse = 0.92 + 0.12 * Math.sin(p * dur * 8);
        eye.scale.setScalar(pulse);
        glow.scale.setScalar(pulse * 1.1);
        eye.material.opacity = fade;
        glow.material.opacity = 0.6 * fade;
    });
}

// ------------------------------------------------------------
// 4. GẤU HỘ VỆ: bearCharge · bearGuard
// ------------------------------------------------------------
/**
 * `bearCharge`: di chuyển Gấu Hộ Vệ dọc theo `path = [{x,z,at}...]` (đồng bộ giờ trận),
 * tung bụi nâu + lá rừng dọc đường húc.
 */
export function startBearCharge(bearView, path = []) {
    if (!bearView || path.length < 2) return;
    const lastAt = path[path.length - 1].at ?? 2400;
    const totalSec = Math.max(0.2, lastAt / 1000);

    bearView.teleport(path[0].x, path[0].z ?? 0, true);
    if (!bearView.playAction?.('ram', { hold: true })) bearView.playAction?.('move', { hold: true });

    let dustTimer = 0;
    const dummy = new THREE.Group();
    addAnim(dummy, totalSec, (p, _fx, dt) => {
        if (bearView.member?.alive === false) return;
        const elapsedMs = p * lastAt;
        // Tìm đoạn trong path ứng với elapsedMs
        let segIdx = 0;
        while (segIdx < path.length - 2 && elapsedMs > (path[segIdx + 1].at ?? 0)) segIdx++;
        const a = path[segIdx];
        const b = path[segIdx + 1] ?? a;
        const t0 = a.at ?? 0;
        const t1 = Math.max(t0 + 1, b.at ?? t0 + 1);
        const u = Math.max(0, Math.min(1, (elapsedMs - t0) / (t1 - t0)));

        const nx = a.x + (b.x - a.x) * u;
        const nz = (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * u;
        if (Math.abs(b.x - a.x) > 0.05) bearView.facingLeft = b.x < a.x;
        bearView.basePos.set(nx, 0, nz);
        bearView.root.position.x = nx;
        bearView.root.position.z = nz;

        dustTimer -= dt;
        if (dustTimer <= 0) {
            dustTimer = 0.085;
            spawnLandingDust({ x: nx, y: 0, z: nz }, 3);
        }

        if (p >= 1) {
            const endPt = path[path.length - 1];
            bearView.teleport(endPt.x, endPt.z ?? 0, false);
            bearView._interruptOneShot?.();
        }
    });
}

/** Va chạm khi Gấu Hộ Vệ húc trúng mục tiêu */
export function spawnBearHitImpact(pos) {
    if (!pos) return;
    spawnHitSpark(pos, { count: fxBudget(8, 3), color: GOLD_WARM, size: 1.15 });
    spawnShockwave(pos, { color: BARK_BROWN, radius: 2.2, life: 0.35 });
    spawnLandingDust({ x: pos.x, y: 0, z: pos.z ?? 0 }, 5);
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
        deerTexCache = new THREE.TextureLoader().load(deerUrl);
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
    const rune = fxPlane(forestRuneTexture(), 3.6, 3.6, { color: 0xffffff, opacity: 0 });
    rune.rotation.x = -Math.PI / 2;
    rune.position.set(0, 0.04, -0.35);
    rune.scale.set(1, 0.8, 1);

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

/** `deerTick`: sóng hồi máu xanh lá toả ra từ Thần Hươu + vòng sáng trên từng đồng đội */
export function spawnDeerTick(casterId, casterIdx, allyViews = []) {
    const st = activeDeers.get(deerKey(casterId, casterIdx));
    if (st && !st.dead) {
        st.blessT = 0.8;
        const ring = fxPlane(ringTexture(), 1, 1, { color: LEAF_LIGHT, opacity: 0.75 });
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(st.x, FLOOR + 0.02, st.z);
        addAnim(ring, 0.55, (p, fx) => {
            const s = 0.8 + easeOut(p) * 4.8;
            fx.mesh.scale.set(s, s * 0.8, 1);
            fx.mesh.material.opacity = 0.75 * (1 - p);
        });
    }

    allyViews.forEach((v) => {
        if (!v) return;
        const pos = v.position;
        const r = fxPlane(ringTexture(), 1, 1, { color: LEAF_GREEN, opacity: 0.8 });
        r.rotation.x = -Math.PI / 2;
        r.position.set(pos.x, FLOOR + 0.02, pos.z ?? 0);
        addAnim(r, 0.48, (p, fx) => {
            const s = 0.5 + easeOut(p) * 2.1;
            fx.mesh.scale.set(s, s * 0.8, 1);
            fx.mesh.material.opacity = 0.8 * (1 - p);
        });
        spawnRisingSparkles(pos, { count: fxBudget(4, 2), color: LEAF_LIGHT, radius: 0.65 });
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
    spawnLeafBurst({ x: st.x, y: 0.6, z: st.z }, { count: 10, radius: 1.2, rise: 1.3, gold: true });
}

// ------------------------------------------------------------
// 6. THIÊN PHÚ 1 & 2: leafShield · forestMight
// ------------------------------------------------------------
const activeLeafShields = new WeakMap();

/** `leafShield` (Thiên phú 2): vòm Khiên Lá xanh lục bao quanh thú triệu hồi + lá xoay quanh */
export function spawnLeafShield(targetView, durationMs = 7000) {
    if (!targetView) return;
    activeLeafShields.get(targetView)?.stop?.();

    const pos0 = targetView.position;
    spawnLeafBurst(pos0, { count: 10, radius: 1.1, rise: 1.2, gold: true });
    spawnShockwave(pos0, { color: LEAF_GREEN, radius: 2.2, life: 0.42 });

    const dur = Math.max(0.6, durationMs / 1000);
    const h = targetView.height ?? 2.0;
    const domeSz = h * 1.22;

    const g = new THREE.Group();
    const dome = fxPlane(leafDomeTexture(), domeSz, domeSz, { additive: false, opacity: 0 });
    dome.position.set(0, domeSz * 0.48, 0.45);
    g.add(dome);

    let stopped = false;
    activeLeafShields.set(targetView, { stop: () => { stopped = true; g.visible = false; } });

    addAnim(g, dur, (p, fx, dt) => {
        const now = gameNow();
        const hasShield = targetView.member?.statusEffects?.some(
            e => e.type === 'leaf_shield' && e.endTime > now && (e.hp ?? 1) > 0,
        );
        // Trong 0.6s đầu có thể gói stateUpdate chưa kịp tới -> vẫn giữ hiển thị
        if (stopped || targetView.member?.alive === false || (p * dur > 0.6 && !hasShield)) {
            fx.mesh.visible = false;
            return;
        }
        const tp = targetView.position;
        fx.mesh.position.set(tp.x, GROUND_Y + (targetView._lift ?? 0), tp.z ?? 0);
        dome.rotation.z += dt * 0.45;
        const fade = p < 0.08 ? p / 0.08 : p > 0.9 ? (1 - p) / 0.1 : 1;
        const breathe = 1 + 0.03 * Math.sin(p * dur * 5);
        dome.scale.set(breathe, 2 - breathe, 1);
        dome.material.opacity = 0.62 * fade;
    });
}

/** `forestMight` (Thiên phú 1): các mũi tên xanh lá nhỏ bay lên trên toàn bộ đồng minh còn sống */
export function spawnForestMight(allyViews = [], stacks = 1) {
    const tex = greenArrowUpTexture();
    allyViews.forEach((v, idx) => {
        if (!v) return;
        gameTimeout(() => {
            const p0 = v.position;
            const n = Math.min(3, Math.max(2, stacks));
            for (let k = 0; k < n; k++) {
                const ox = (k - (n - 1) / 2) * 0.48;
                const d0 = k * 0.06;
                const arr = fxPlane(tex, 0.42, 0.64, { additive: false, opacity: 0 });
                addAnim(arr, 0.65 + d0, (p, fx) => {
                    const t = Math.max(0, (p * (0.65 + d0) - d0) / 0.65);
                    if (t <= 0) return;
                    const cur = v.position;
                    fx.mesh.position.set(
                        cur.x + ox,
                        GROUND_Y + 0.85 + easeOut(t) * 1.45,
                        (cur.z ?? 0) + 0.62,
                    );
                    fx.mesh.material.opacity = t < 0.2 ? t / 0.2 : (1 - t) / 0.8;
                });
            }
            spawnRisingSparkles(p0, { count: fxBudget(4, 2), color: LEAF_LIGHT, radius: 0.6 });
        }, idx * 40);
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

