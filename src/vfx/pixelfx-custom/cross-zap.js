// ============================================================
// "Thánh giá giật sét" — 1 tia sét từ viên ngọc Thánh giá Sấm Sét giáng xuống đối thủ (lấy phần "zap to the floor" của tesla-coil.js):
//   tia đầy đủ chớp 6 khung, loé + vòng sáng nơi trúng, tia lửa văng và nảy trên đất.
//   Gốc (0, 0) = chân đối thủ. opts.dx / opts.dy = vị trí viên ngọc so với gốc (điểm ảnh, dy dương = lên trên).
// ============================================================
import { fit, rng, clamp, WHITE, hex } from '../../vendor/pixelfx/core/index.js';
import { VOLT, PLASMA, zigzag, stroke, flight, spark } from '../../vendor/pixelfx/fx/lightning/_lib.js';

export const meta = {
    name: 'Cross zap',
    desc: 'Tia sét từ thánh giá giáng xuống đối thủ, loé sáng và văng tia lửa.',
    tags: ['lightning', 'zap', 'one-shot'],
    size: [440, 280],
    origin: [220, 250],
    duration: 0.7,
    loop: false,
    fps: 30,
    options: { palette: VOLT, sparks: PLASMA, seed: 7, dx: 60, dy: 70 },
};

export function draw(p, t, o) {
    const C = fit(o.palette, 8), S = o.sparks.map(hex), age = Math.floor(t * 30 + 1e-6);
    const x0 = clamp(o.dx, -215, 215), y0 = -clamp(o.dy, 4, 245), tx = 0, ty = -14;   // trúng ngang ngực đối thủ
    if (age < 6) {
        const k = [1, 0.75, 1, 0.6, 0.85, 0.4][age], r = rng(o.seed, 41, age);
        stroke(p, zigzag(r, x0, y0, tx, ty, 0.22, 0.55), k, C, age === 0 ? 0.95 : 0.8, { hero: age === 0 });
        p.glow(x0, y0, 12, C[5], 0.6 * k);
        p.circle(tx, ty, 3 * k + 1.5, C[2]);
        p.circle(tx, ty, 3 * k + 0.5, C[5]);
        p.circle(tx, ty, 2 * k, WHITE);
        p.glow(tx, ty, 34, C[4], 0.5 * k);
        p.glow(tx, ty, 12, C[6], 0.5 * k);
    }
    for (let j = 0; j < 16; j++) {
        const r = rng(o.seed, 51, j), life = r.range(0.3, 0.6);
        if (t >= life) continue;
        const a = -Math.PI / 2 + r.range(-1.4, 1.4), sp = r.range(50, 170), [x, y, vx, vy] = flight(tx, ty, Math.cos(a) * sp, Math.sin(a) * sp, t, { floor: 0 });
        spark(p, x, y, vx, vy, 1 - t / life, S);
    }
}
