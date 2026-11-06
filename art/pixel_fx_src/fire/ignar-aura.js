// A fire god's aura: tall tongues of flame licking up both sides of a standing figure, a low ring of flame round
// the feet, licks tearing off the tips and heat sparks climbing. The flames are one heat field per layer, painted
// with hard ramp bands and a 1 px dark-red outline (the hero's own style) at his pixel size. Drawn from t alone.
import { fit, mix, clamp, TAU, WHITE } from "../../core/index.js";
import { looped, floorLight } from "./_lib.js";
import { paintHeat, fastFbm } from "./_ignar.js";

export const meta = {
  name: "Ignar aura",
  desc: "A rising fire aura round a standing figure: tall outlined tongues licking up both sides of an empty middle, a ring of flame at the feet, licks and heat sparks climbing.",
  tags: ["fire", "aura", "buff", "transform", "god", "loop"],
  size: [64, 100],
  origin: [32, 94],
  duration: 0.5,
  loop: true,
  fps: 20,
  bg: "dark",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#e0400d", "#f05a10", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    seed: 3,
  },
};

const D = meta.duration, X0 = -32, Y0 = -94, W = 64, HH = 100;
// rising noise: CELL px cells, PER cells a period, one period per loop
const CELL = 6, PER = 10, VEL = (CELL * PER) / D;
const BANDS = [0, 0.14, 0.3, 0.46, 0.62, 0.78, 0.94];
const RX = 22, RY = 5; // the floor ring

// the tongues: [root x, root y, height, half-width, lean (px the tip swings, + outward), front?, phase]
const SIDE = [
  // the tall pair hugging the figure, the outer ones shorter, a few in front lower down
  [17, -1, 80, 3.6, -1, false, 0.0],
  [21.5, -2, 58, 3.4, 1.5, false, 0.37],
  [26, -1, 38, 2.8, 1, false, 0.71],
  [19, 1, 34, 3.2, 1, true, 0.53],
  [24, 2, 20, 2.8, 1, true, 0.19],
];

function tongues(S) {
  const out = [];
  for (const sgn of [-1, 1])
    SIDE.forEach(([x, y, h, w, lean, front, ph], i) => {
      // the two sides are not mirror twins: heights and timing differ a little
      const k = sgn > 0 ? 1 : 0.93 + 0.05 * (i % 2);
      out.push({ x: sgn * x, y, h: h * k, w, lean: sgn * lean, front, ph: ph + (sgn > 0 ? 0 : 0.5), n: S * 7 + i * 13 + (sgn > 0 ? 0 : 100) });
    });
  // the ring at the feet: low tongues round the floor ellipse, the back ones taller
  const n = 18;
  for (let k = 0; k < n; k++) {
    const a = ((k + 0.5) / n) * TAU, s = Math.sin(a), c = Math.cos(a);
    if (Math.abs(c) > 0.85) continue; // the sides already burn tall
    out.push({ x: c * RX, y: s * RY, h: s < 0 ? 10 + 4 * ((k * 5) % 3) : 5 + 2 * ((k * 7) % 3), w: 2.8, lean: 0, front: s > 0, ph: (k * 0.29) % 1, n: S * 7 + 300 + k * 11 });
  }
  return out;
}

// stamp one tongue into a heat field: a tapering column with a hot base, cooling up to its tip
function stamp(heat, q, t, fbm, scroll, cool) {
  const ph = t / D + q.ph;
  const h = q.h * (0.84 + 0.12 * Math.sin(ph * TAU * 2) + 0.06 * Math.sin(ph * TAU * 4 + q.n));
  const top = Math.ceil(h * 1.1);
  for (let r = -2; r <= top; r++) {
    const u = clamp(r / h), Y = Math.round(q.y - r), j = Y - Y0;
    if (j < 1 || j >= HH - 1) continue;
    // the column sways: a wave running up it, more at the top
    const sway = q.lean * u * u + (0.6 + 2.4 * u) * u * Math.sin(ph * TAU * 2 - r * 0.12 + q.n);
    // a teardrop body: full in its lower third, drawn out to a point
    const cx = q.x + sway, half = q.w * Math.pow(1 - u, 0.7) * (1 + 0.35 * Math.sin(Math.min(1, u * 2.2) * Math.PI)) * Math.min(1, (r + 3) / 4) + 0.6;
    for (let i = Math.max(1, Math.floor(cx - half - 4 - X0)); i <= Math.min(W - 2, Math.ceil(cx + half + 4 - X0)); i++) {
      const x = X0 + i + 0.5, base = 1 - Math.abs(x - cx) / half;
      const n = fbm((r - scroll) / CELL, x / 5 + 40);
      const v = (base * (1.08 - 0.66 * u) + n * (0.12 + 0.36 * u) - 0.06 * u) * cool;
      const k = j * W + i;
      if (v > heat[k]) heat[k] = v;
    }
  }
}

function layer(p, t, o, front) {
  const F = fit(o.palette, 9), S = o.seed, scroll = VEL * t, fbm = fastFbm(S, PER, 128);
  const heat = new Float32Array(W * HH).fill(-1);
  for (const q of tongues(S)) if (q.front === front) stamp(heat, q, t, fbm, scroll, front ? 1 : 0.9);
  // licks torn off the tall tongues' tips, rising and shrinking: teardrops pointed up
  if (!front)
    looped(t, D, 10, S + 200, (r, i) => ({ x: (i % 2 ? 1 : -1) * r.range(15, 26), y: -r.range(36, 62), vy: -r.range(60, 100), s: r.range(1.3, 2.2), life: r.range(0.18, 0.3) }), (q, age) => {
      const k = 1 - age / q.life, cx = q.x, cy = q.y + q.vy * age, br = q.s * (0.5 + 0.5 * k);
      for (let j = Math.max(1, Math.floor(cy - br * 3 - Y0)); j <= Math.min(HH - 2, Math.ceil(cy + br - Y0)); j++)
        for (let i = Math.max(1, Math.floor(cx - br - 1 - X0)); i <= Math.min(W - 2, Math.ceil(cx + br + 1 - X0)); i++) {
          const dx = X0 + i + 0.5 - cx, dy = Y0 + j + 0.5 - cy, e = Math.hypot(dx / br, dy / (br * (dy < 0 ? 3.2 : 1.2)));
          if (e < 1) heat[j * W + i] = Math.max(heat[j * W + i], (1 - e) * (0.45 + 0.3 * k));
        }
    });
  paintHeat(p, heat, W, HH, X0, Y0, F.slice(2), BANDS, F[1]);
}

export function drawBack(p, t, o) {
  const F = fit(o.palette, 9), ph = t / D;
  const fl = 0.9 + 0.1 * Math.sin(ph * TAU * 2);
  p.glow(0, -40, 46, mix(F[4], WHITE, 0.1), 0.12 * fl);
  for (const sgn of [-1, 1]) p.glow(sgn * 22, -30, 18, F[5], 0.14 * fl);
  floorLight(p, 0, 0, 30, 7, F[5], 0.3 * fl);
  layer(p, t, o, false);
}

export function draw(p, t, o) {
  const F = fit(o.palette, 9), S = o.seed;
  layer(p, t, o, true);
  // heat sparks: fast and thin, twinkling up the sides (a few up the middle, behind nothing, over the figure)
  looped(t, D, 16, S + 400, (r, i) => ({ x: i % 5 === 0 ? r.range(-12, 12) : (i % 2 ? 1 : -1) * r.range(14, 29), y: -r.range(10, 50), vy: -r.range(70, 120), w: r.range(0, TAU), life: r.range(0.3, 0.5) }), (q, age) => {
    const k = 1 - age / q.life, y = q.y + q.vy * age, x = q.x + Math.sin(age * 10 + q.w) * 1.5;
    if (y < Y0 + 2 || x < X0 + 1 || x > X0 + W - 2) return;
    if (k < 0.3 && Math.sin(age * 60 + q.w) < 0) return;
    p.px(x, y, k > 0.6 ? F[8] : k > 0.35 ? F[7] : F[5]);
    if (k > 0.5) p.px(x, y + 1, F[4]);
    p.glow(x, y, 3, F[5], 0.35 * k);
  });
}
