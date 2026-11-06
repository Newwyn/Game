import { fit, rng, burst, clamp, smooth, ease, TAU, WHITE } from "../../core/index.js";
import { drawLeaf } from "./_lib.js";

export const meta = {
  name: "Sylva howl",
  desc: "A spirit wolf's howl: a pale crescent grows into four arcs of green-silver sound sweeping right, carrying tiny leaves, thinning away at the tips.",
  tags: ["nature", "howl", "wave", "sound", "spirit", "directional"],
  size: [80, 56],
  origin: [6, 28],
  duration: 0.6,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0f2e1a", "#166534", "#22c55e", "#4ade80", "#bbf7d0", "#d1fae5", "#f0fdf4"],
    leaves: ["#0f2e1a", "#166534", "#4ade80", "#d1fae5"],
    seed: 3,
  },
};

const RINGS = [
  { t0: 0.0, w: 4.6 },
  { t0: 0.07, w: 4.0 },
  { t0: 0.14, w: 3.4 },
  { t0: 0.21, w: 2.8 },
];
const LIFE = 0.38, REACH = 66;

export function draw(p, t, o) {
  const C = fit(o.palette, 7), L = fit(o.leaves, 4), S = o.seed;
  // the throat of the howl: a small hot glow at the mouth that swells then dies
  const mouth = 1 - smooth(0.05, 0.3, t);
  if (mouth > 0) {
    p.glow(0, 0, 14, C[4], 0.5 * mouth);
    if (t < 0.05) p.px(0, 0, WHITE), p.px(0, -1, C[6]), p.px(0, 1, C[6]), p.glow(0, 0, 6, WHITE, 0.6);
  }
  for (let i = 0; i < RINGS.length; i++) {
    const g = RINGS[i], age = t - g.t0;
    if (age < 0 || age > LIFE) continue;
    // each wave is a crescent: its front at x = f, bent round a circle of radius rc whose center trails behind,
    // so it stays curved while it widens to half-height h
    const k = age / LIFE, f = 3 + REACH * ease.outQuad(k), rc = 6 + f * 0.42, h = Math.min(23, 3 + 26 * ease.outQuad(clamp(k * 1.6)));
    const span = Math.min(1.25, Math.asin(Math.min(1, h / rc))), cx = f - rc;
    const fd = 1 - smooth(0.45, 1, k), W = Math.min((g.w * (1 - 0.5 * k) + 0.7) * (0.4 + 0.6 * fd), rc * 0.6), fade = 1 - smooth(0.45, 1, k), wob = rng(S, i, 7).range(0, TAU);
    p.shade(cx + rc * Math.cos(span) - W - 2, -h - 2, f + 1, h + 2, (x, y, out) => {
      const dx = x - cx, d = Math.hypot(dx, y), th = Math.atan2(y, dx), u = Math.abs(th) / span;
      if (u > 1) return;
      const wid = W * Math.pow(1 - u * u, 0.65) * (1 + 0.15 * Math.sin(th * 7 + wob));
      const dr = rc - d;
      if (dr < 0 || dr > wid) return;
      const q = dr / Math.max(0.6, wid), tip = 1 - smooth(0.5, 1, u);
      let c = q < 0.3 ? (k < 0.3 && u < 0.3 ? WHITE : fd > 0.5 ? C[6] : C[5]) : q < 0.6 ? (fd > 0.5 ? C[5] : C[4]) : q < 0.85 ? C[4] : C[3];
      if (u > 0.7) c = q < 0.45 ? C[4] : C[3];
      const a = Math.min(1, fade * 1.6) * (0.25 + 0.75 * tip);
      if (a >= 0.97) return c;
      p.blend(x, y, c, a);
    });
    // light riding the wavefront
    const ex = cx + rc * Math.cos(span * 0.8), ey = rc * Math.sin(span * 0.8);
    p.glowLine(ex, -ey, f, 0, 5, C[4], 0.22 * fade);
    p.glowLine(f, 0, ex, ey, 5, C[4], 0.22 * fade);
    if (k < 0.5) p.glow(f, 0, 5, C[6], 0.35 * (1 - k * 2));
  }
  // tiny leaves swept along by the wave: they ride outward, flip and slow down, then fade
  burst(4, S + 11, (R, j) => {
    const t0 = 0.05 + R.range(0, 0.12), age = t - t0, life = R.range(0.34, 0.44);
    if (age < 0 || age > life) return;
    const k = age / life, th = R.range(-0.42, 0.42), dist = 10 + 52 * ease.outCubic(k) * R.range(0.75, 1);
    const x = Math.cos(th) * dist, y = Math.sin(th) * dist + Math.sin(age * 14 + j) * 1.5;
    const a = k > 0.8 ? 0 : 1, sc = 1 - smooth(0.55, 0.8, k) * 0.45;
    drawLeaf(p, x, y, R.range(5.5, 7) * sc, R.range(1.9, 2.4) * sc, th + age * R.range(8, 14) * R.sign(), age * R.range(9, 16), L, a);
    p.light(x, y, L[3], 0.3 * a);
  });
  // motes of silver flung off the arcs
  burst(7, S + 23, (R) => {
    const t0 = R.range(0.04, 0.24), age = t - t0, life = R.range(0.15, 0.3);
    if (age < 0 || age > life) return;
    const k = age / life, th = R.range(-0.85, 0.85), d = 8 + (t0 * 100) + age * R.range(70, 110);
    const x = Math.cos(th) * d, y = Math.sin(th) * d;
    if (x > 72 || Math.abs(y) > 26) return;
    p.dot(x, y, k < 0.5 ? C[6] : C[4], 1 - k);
    p.light(x, y, C[5], 0.4 * (1 - k));
  });
}
