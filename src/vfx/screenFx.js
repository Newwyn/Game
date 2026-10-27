// ============================================================
// HIỆU ỨNG TOÀN MÀN HÌNH — lớp vẽ 2D phủ lên cảnh 3D (dưới HUD, không chặn chuột)
// ============================================================
//   startBlizzard : bão tuyết toàn màn hình (Golem phun Bão Tuyết) — tuyết quất ngang theo hướng phun + sương giá viền màn hình
//   startStorm    : trời giông (Elarion — Hơi Nước Bỏng): trời tối sầm phía trên + mưa xiên dày + chớp sáng khi sét đánh
// Cả hai trả về { stop() } (tắt dần) — tự tắt sau `duration` ms TRẬN (theo tốc độ game).
import { gameTimeout } from '../config.js';

function makeLayer(z = 5) {
    const host = document.getElementById('game-container') ?? document.body;
    const c = document.createElement('canvas');
    c.style.cssText = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:${z}`;
    host.appendChild(c);
    const fit = () => { c.width = Math.max(1, Math.round(c.clientWidth * 0.75)); c.height = Math.max(1, Math.round(c.clientHeight * 0.75)); };
    fit();
    return { c, ctx: c.getContext('2d'), fit };
}

/** Vòng lặp vẽ: draw(ctx, w, h, dt, k) với k = độ hiện (0..1, mờ vào / mờ ra) */
function runLayer(draw, { duration, fadeIn = 0.4, fadeOut = 0.7, z } = {}) {
    const L = makeLayer(z);
    let k = 0, want = 1, last = performance.now(), dead = false, frame = 0;
    const tick = (now) => {
        if (dead) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        k += Math.sign(want - k) * dt / (want > k ? fadeIn : fadeOut);
        k = Math.max(0, Math.min(1, k));
        if ((frame++ & 31) === 0) L.fit();
        L.ctx.clearRect(0, 0, L.c.width, L.c.height);
        if (k > 0) draw(L.ctx, L.c.width, L.c.height, dt, k);
        if (want === 0 && k <= 0) { dead = true; L.c.remove(); return; }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const stop = () => { want = 0; };
    if (duration) gameTimeout(stop, duration);
    return { stop };
}

/** Bông tuyết mềm (vẽ sẵn 1 lần) */
let FLAKE = null;
function flakeSprite() {
    if (FLAKE) return FLAKE;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(240,250,255,0.85)');
    g.addColorStop(1, 'rgba(220,240,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (FLAKE = c);
}

/** Bão tuyết toàn màn hình. dir = 1: tuyết quất sang phải · alive(): false thì tắt ngay (Golem gục / tan) */
export function startBlizzard({ dir = 1, duration = 6000, alive } = {}) {
    const LAYERS = [   // xa -> gần: nhỏ, chậm, mờ -> to, nhanh, nhoè
        { n: 140, r: [1.2, 2.4], v: [420, 620], a: 0.55, blur: 1.0 },
        { n: 110, r: [2.8, 5], v: [700, 1000], a: 0.85, blur: 1.6 },
        { n: 30, r: [8, 15], v: [1100, 1500], a: 0.6, blur: 2.6 },
    ];
    const flakes = [];
    const winds = [];
    let t = 0;
    const img = flakeSprite();
    const handle = runLayer((ctx, w, h, dt, k) => {
        t += dt;
        if (alive && !alive()) handle.stop();
        const s = w / 900;
        // sương giá: phủ trắng xanh, dày ở viền
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
        g.addColorStop(0, `rgba(215,240,255,${0.12 * k})`);
        g.addColorStop(0.65, `rgba(205,235,255,${0.3 * k})`);
        g.addColorStop(1, `rgba(240,250,255,${0.7 * k})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        // làn gió tuyết: dải trắng mảnh uốn lượn quét ngang
        while (winds.length < 9) winds.push({ x: Math.random() * w * 1.5 - w * 0.25, y: Math.random() * h, L: (180 + Math.random() * 260) * s, v: (900 + Math.random() * 500) * s, ph: Math.random() * 6, th: (1.5 + Math.random() * 2.5) * s });
        ctx.lineCap = 'round';
        for (const q of winds) {
            q.x += dir * q.v * dt;
            if (dir > 0 && q.x - q.L > w) { q.x = -Math.random() * w * 0.3; q.y = Math.random() * h; }
            if (dir < 0 && q.x + q.L < 0) { q.x = w + Math.random() * w * 0.3; q.y = Math.random() * h; }
            const x0 = q.x - dir * q.L, x1 = q.x;
            const gr = ctx.createLinearGradient(x0, 0, x1, 0);
            gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, `rgba(255,255,255,${0.35 * k})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = gr; ctx.lineWidth = q.th;
            ctx.beginPath();
            for (let i = 0; i <= 12; i++) {
                const xx = x0 + (x1 - x0) * i / 12, yy = q.y + Math.sin(i * 0.6 + q.ph + t * 3) * 10 * s;
                i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
            }
            ctx.stroke();
        }
        // bông tuyết 3 lớp, bay ngang + chao lượn, kéo vệt nhẹ theo tốc độ
        if (!flakes.length) LAYERS.forEach((L, li) => { for (let i = 0; i < L.n; i++) flakes.push({ li, x: Math.random() * w, y: Math.random() * h, r: L.r[0] + Math.random() * (L.r[1] - L.r[0]), v: L.v[0] + Math.random() * (L.v[1] - L.v[0]), ph: Math.random() * 6 }); });
        for (const f of flakes) {
            const L = LAYERS[f.li];
            f.x += dir * f.v * s * dt;
            f.y += (80 + Math.sin(t * 2 + f.ph) * 120) * s * dt * (0.5 + f.li * 0.4);
            if (f.x > w + 40) { f.x = -40; f.y = Math.random() * h; } else if (f.x < -40) { f.x = w + 40; f.y = Math.random() * h; }
            if (f.y > h + 30) f.y = -30; else if (f.y < -30) f.y = h + 30;
            const r = f.r * s, stretch = 1 + L.blur * 1.2;
            ctx.globalAlpha = L.a * k;
            ctx.drawImage(img, f.x - r * stretch * (dir > 0 ? 1.6 : 0.4), f.y - r, r * 2 * stretch, r * 2);
        }
        ctx.globalAlpha = 1;
    }, { duration, fadeIn: 0.35, fadeOut: 0.6 });
    return handle;
}

/** Trời giông: tối dịu phía trên + mưa xiên theo nhịp gió + chớp giông khi sét đánh (mờ vào 0.4s, mờ ra 0.6s) */
export function startStorm({ duration = 7000 } = {}) {
    const drops = [];
    let flashK = 0, t = 0;
    const handle = runLayer((ctx, w, h, dt, k) => {
        t += dt;
        const s = w / 900;
        const gust = 0.16 + 0.04 * Math.sin(t * 2.2);
        // trời giông dịu phía trên, nhạt nhanh xuống sân đấu để nổi bật mây giông 3D và cột mưa
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, `rgba(12,16,36,${0.48 * k})`);
        g.addColorStop(0.38, `rgba(22,28,54,${0.22 * k})`);
        g.addColorStop(1, `rgba(18,32,48,${0.06 * k})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        // mưa xiên nền có nhịp gió lượn (giới hạn 140 hạt để nhẹ và không che khuất cột mưa 3D)
        while (drops.length < 140) drops.push({ x: Math.random() * w * 1.2, y: Math.random() * h, d: Math.random(), ph: Math.random() * 6.28 });
        ctx.lineCap = 'round';
        for (const r of drops) {
            const v = (780 + r.d * 760) * s;
            const slant = gust + 0.03 * Math.sin(t * 3 + r.ph);
            r.x -= v * slant * dt; r.y += v * dt;
            if (r.y > h + 20) { r.y = -20; r.x = Math.random() * w * 1.2; }
            const len = (12 + r.d * 22) * s;
            const pulse = 0.8 + 0.2 * Math.sin(t * 4 + r.ph);
            ctx.strokeStyle = `rgba(185,225,255,${(0.14 + r.d * 0.24) * pulse * k})`;
            ctx.lineWidth = (0.7 + r.d * 1.1) * s;
            ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + len * slant, r.y - len); ctx.stroke();
        }
        // chớp giông lan từ vòm trời phía trên khi sét đánh
        if (flashK > 0) {
            const fg = ctx.createRadialGradient(w * 0.5, h * 0.12, w * 0.05, w * 0.5, h * 0.2, w * 0.75);
            fg.addColorStop(0, `rgba(220,210,255,${0.46 * flashK * k})`);
            fg.addColorStop(0.5, `rgba(165,180,255,${0.22 * flashK * k})`);
            fg.addColorStop(1, 'rgba(120,140,220,0)');
            ctx.fillStyle = fg;
            ctx.fillRect(0, 0, w, h);
            flashK = Math.max(0, flashK - dt * 5.5);
        }
    }, { duration, fadeIn: 0.4, fadeOut: 0.6, z: 4 });
    handle.flash = () => { flashK = 1; };
    return handle;
}
