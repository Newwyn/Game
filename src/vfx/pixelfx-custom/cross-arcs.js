// ============================================================
// "Thánh giá Tesla" — Thánh giá Sấm Sét của Caelum (người chơi 21/11: lấy Tesla coil của pixelfx, BỎ cái trụ, thay bằng thánh giá)
//   Chỉ giữ phần tia sét của tesla-coil.js: các tia phân nhánh quất ra từng loạt quanh viên ngọc giữa thánh giá, chớp tắt, bắn tia lửa,
//   quầng điện tím bò quanh, vài tia nhỏ xì ra liên tục. Hình thánh giá là tranh vẽ (crossFx.js) đứng ngay sau hiệu ứng này.
//   Gốc (0, 0) = chân thánh giá; viên ngọc ở (0, GY). Lặp vòng.
// ============================================================
import { fit, rng, TAU, ease } from '../../vendor/pixelfx/core/index.js';
import { VOLT, PLASMA, zigzag, stroke, crackle, flight, spark } from '../../vendor/pixelfx/fx/lightning/_lib.js';
import { hex } from '../../vendor/pixelfx/core/index.js';

export const meta = {
    name: 'Cross arcs',
    desc: 'Tia sét kiểu cuộn Tesla quất ra từ viên ngọc giữa thánh giá (không có trụ).',
    tags: ['lightning', 'tesla', 'cross', 'loop'],
    size: [224, 150],
    origin: [112, 140],
    duration: 2.4,
    loop: true,
    fps: 30,
    options: { palette: VOLT, sparks: PLASMA, seed: 4, gemY: -62 },
};

const FPS = 30, N = 72, P = N / FPS, RR = 6;
const FL = [1, 0.7, 0.95, 0.55, 0.85, 0.45, 0.7, 0.35];

function plan(seed) {
    const r = rng(seed, 1), arcs = [];
    for (const [v, n] of [[2, 3], [20, 3], [30, 1], [38, 3], [56, 3], [66, 1]])
        for (let j = 0; j < n + r.int(0, 1); j++) {
            const side = r.chance(0.5) ? 1 : -1, front = r.chance(0.55), a = r.range(0.15, 1.1);
            const phi = side > 0 ? (front ? a : -a) : front ? Math.PI - a : Math.PI + a, th0 = r.range(-1.15, 0.6);
            arcs.push({ f0: (v + j * r.int(2, 4)) % N, len: r.int(3, 7), side, phi, front, th0, th1: th0 + r.range(-0.6, 0.6), L: r.range(16, 38) });
        }
    return arcs;
}
const ageOf = (f, f0) => (((f - f0) % N) + N) % N;

export function draw(p, t, o) {
    const C = fit(o.palette, 8), S = o.sparks.map(hex), f = Math.floor(t * FPS + 1e-6) % N, GY = o.gemY;
    const arcs = plan(o.seed);
    const live = arcs.filter((a) => ageOf(f, a.f0) < a.len);
    const root = (phi) => [Math.cos(phi) * RR, GY + Math.sin(phi) * RR * 0.5];
    const act = Math.min(1, live.reduce((s, a) => s + FL[ageOf(f, a.f0)] * 0.3, 0));

    p.glow(0, GY, 30, C[3], 0.16 + 0.3 * act);
    const drawArc = (a) => {
        const age = ageOf(f, a.f0), u = age / Math.max(1, a.len - 1), th = a.th0 + (a.th1 - a.th0) * ease.outQuad(u), ang = a.side > 0 ? th : Math.PI - th;
        const [x0, y0] = root(a.phi), L = a.L * (age === 0 ? 0.75 : 1), r = rng(o.seed, 21, a.f0, f);
        stroke(p, zigzag(r, x0, y0, x0 + Math.cos(ang) * L, y0 + Math.sin(ang) * L, 0.32, 0.75), FL[age], C, 0.6, { light: 0.4 });
        p.glow(x0, y0, 10, C[5], 0.5 * FL[age]);
    };
    for (const a of live) if (!a.front) drawArc(a);
    // quầng điện tím bò quanh viên ngọc + tia nhỏ xì ra mỗi khung
    const rc = rng(o.seed, 9, f);
    for (let i = 0; i < 6; i++) {
        const phi = rc.range(0, TAU), d = rc.range(2, 6), x = Math.cos(phi) * (RR + d), y = GY + Math.sin(phi) * (RR + d) * 0.8;
        p.px(x, y, rc.chance(0.3) ? C[5] : C[3]);
        p.glow(x, y, 4, C[3], 0.3);
    }
    for (let i = 0; i < 2; i++) {
        const phi = rc.range(0, TAU), x0 = Math.cos(phi) * RR, y0 = GY + Math.sin(phi) * RR * 0.6, a = phi + rc.range(-0.5, 0.5), l = rc.range(4, 10);
        crackle(p, zigzag(rc, x0, y0, x0 + Math.cos(a) * l, y0 + Math.sin(a) * l, 0.4, 0.4), rc.range(0.35, 0.65), C, 0.3);
    }
    for (const a of live) if (a.front) drawArc(a);
    // tia lửa bắn ra từ đầu tia sét
    for (const a of arcs) {
        const age = (((t - a.f0 / FPS) % P) + P) % P, ang = a.side > 0 ? a.th0 : Math.PI - a.th0, [x0, y0] = root(a.phi);
        for (let j = 0; j < 3; j++) {
            const r = rng(o.seed, 61, a.f0, j), life = r.range(0.15, 0.35);
            if (age >= life) continue;
            const tx = x0 + Math.cos(ang) * a.L * 0.75, ty = y0 + Math.sin(ang) * a.L * 0.75, b = ang + r.range(-0.9, 0.9), sp = r.range(50, 150);
            const [x, y, vx, vy] = flight(tx, ty, Math.cos(b) * sp, Math.sin(b) * sp, age, { floor: 0 });
            spark(p, x, y, vx, vy, 1 - age / life, S);
        }
    }
}
