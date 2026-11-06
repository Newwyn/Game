// A sphere of swirling fire round a figure: a faint glassy shell, a hot rim of flame whose tongues sweep round it
// and lick higher on top (heat rises), flame ribbons orbiting on tilted paths (the far halves dim behind, the near
// halves thin in front), licks flung off and glints drifting inside. The flame is a heat field painted with hard
// ramp bands and a 1 px dark-red outline, at the hero's own pixel size. Centered on the figure's chest.
import { fit, mix, clamp, TAU, WHITE } from "../../core/index.js";
import { looped } from "./_lib.js";
import { paintHeat, fastFbm } from "./_ignar.js";

export const meta = {
  name: "Ignar shield",
  desc: "A translucent sphere of swirling fire round a figure: an outlined rim whose tongues sweep round and lick up, flame ribbons orbiting on tilted paths, the middle left clear.",
  tags: ["fire", "shield", "barrier", "sphere", "buff", "loop"],
  size: [100, 100],
  origin: [50, 50],
  duration: 0.6,
  loop: true,
  fps: 20,
  bg: "dark",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#e0400d", "#f05a10", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    radius: 36,
    seed: 4,
  },
};

const D = meta.duration, X0 = -50, Y0 = -50, W = 100, HH = 100;
// noise round the rim: PER cells a turn; K tongues round it
const PER = 18, K = 18;
const BANDS = [0, 0.14, 0.3, 0.46, 0.62, 0.78, 0.94];
// orbits: [tilt about x, roll about the view axis, turns per loop, heads, tail length (rad)]
const ORBITS = [
  [1.15, 0.45, 1, 2, 1.6],
  [1.28, -0.8, 1, 1, 2.0],
];

// a point on a great circle: angle th on a circle of radius R tilted by tx about x then rolled by rz about z
function orbitAt(th, R, tx, rz) {
  const x0 = Math.cos(th) * R, y0 = Math.sin(th) * R;
  const y1 = y0 * Math.cos(tx), z1 = y0 * Math.sin(tx);
  return [x0 * Math.cos(rz) - y1 * Math.sin(rz), x0 * Math.sin(rz) + y1 * Math.cos(rz), z1];
}

const cell = (x, y) => [Math.round(x - 0.5) - X0, Math.round(y - 0.5) - Y0];
function blob(heat, x, y, r, v) {
  const [ci, cj] = cell(x, y), e = Math.ceil(r);
  for (let j = Math.max(1, cj - e); j <= Math.min(HH - 2, cj + e); j++)
    for (let i = Math.max(1, ci - e); i <= Math.min(W - 2, ci + e); i++) {
      const dx = X0 + i + 0.5 - x, dy = Y0 + j + 0.5 - y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > r) continue;
      const h = v * (1 - 0.35 * (d / r)), k = j * W + i;
      if (h > heat[k]) heat[k] = h;
    }
}

// the orbiting ribbons on one side: hot fat heads, thinning and cooling tails, ragged at the end
function ribbons(heat, t, R, front) {
  const ph = t / D;
  for (const [tx, rz, turns, heads, len] of ORBITS)
    for (let h = 0; h < heads; h++) {
      const head = ph * TAU * turns + (h * TAU) / heads + rz * 2, steps = Math.ceil(len * R * 0.8);
      for (let s = steps; s >= 0; s--) {
        const u = s / steps, [x, y, z] = orbitAt(head - u * len, R, tx, rz);
        if ((z > 0) !== front) continue;
        if (u > 0.6 && (s + Math.round(ph * 12)) % 4 === 0) continue;
        const w = (front ? 0.5 : 0.8) + (front ? 0.9 : 1.4) * Math.pow(1 - u, 1.6);
        blob(heat, x, y, w, (1.05 - 0.85 * u) * (front ? 0.88 : 0.72));
      }
    }
}

export function drawBack(p, t, o) {
  const F = fit(o.palette, 9), R = o.radius, ph = t / D;
  const fl = 0.9 + 0.1 * Math.sin(ph * TAU * 2);
  p.glow(0, 0, R * 1.3, mix(F[4], WHITE, 0.1), 0.08 * fl);
  // the far wall of the shell: clear in the middle, warming toward the edge like glass
  p.disc(0, 0, R - 1, (d) => (d > 0.82 ? F[4] : F[5]), (d) => 0.03 + 0.22 * Math.pow(d, 6) + (d > 0.88 ? 0.15 * Math.pow((d - 0.88) / 0.12, 2) : 0));
  const heat = new Float32Array(W * HH).fill(-1);
  ribbons(heat, t, R - 2, false);
  paintHeat(p, heat, W, HH, X0, Y0, F.slice(2), BANDS, F[1]);
}

export function draw(p, t, o) {
  const F = fit(o.palette, 9), R = o.radius, S = o.seed, ph = t / D, fbm = fastFbm(S, PER, 64);
  const heat = new Float32Array(W * HH).fill(-1);
  // the rim: a hot band at R and K tongues outside it. The ring of tongues turns one place per loop, and every
  // tongue's look is a function of (its index + ph), so after a loop each one has become its neighbour: seamless.
  const span = (TAU * R) / K;
  // each tongue's length and width this frame (index ti, wrapped round the ring)
  const TL = new Float32Array(K), TG = new Float32Array(K), TW = new Float32Array(K);
  for (let k = 0; k < K; k++) {
    const idx = k + ph, up = Math.max(0, -Math.sin((idx / K) * TAU));
    const g = clamp(0.5 + 0.3 * Math.sin(TAU * (3 * idx) / K + 1.3) + 0.25 * Math.sin(TAU * (2 + 5 / K) * idx) + 0.15 * Math.sin(TAU * (7 * idx) / K));
    TL[k] = 2.5 + 4 * up * up + (4 + 5 * up) * g * g;
    TG[k] = g;
    TW[k] = TAU * (3 * ph + idx * 0.37);
  }
  for (let j = 1; j < HH - 1; j++)
    for (let i = 1; i < W - 1; i++) {
      const x = X0 + i + 0.5, y = Y0 + j + 0.5, d = Math.sqrt(x * x + y * y);
      if (d < R - 6 || d > R + 13) continue;
      const a = Math.atan2(y, x), dr = d - R;
      let h = dr > 0 ? 1 - dr / 2 : 1 + dr / 3.6;
      if (dr > 0) {
        // the tongues bend upward as they leave the rim (heat rises): tips swing towards the top of the circle
        const sp = (a / TAU) * K - ph + dr * 0.11 * Math.cos(a), t0 = Math.round(sp);
        const n = fbm((((a / TAU) * PER * 2 + dr * 0.2) % PER + PER) % PER, dr / 2.5 + 20); // fixed: the tongues move through it
        for (let ti = t0 - 1; ti <= t0 + 1; ti++) {
          const k = ((ti % K) + K) % K, L = TL[k], g = TG[k];
          if (dr >= L) continue;
          const u = dr / L, wob = 0.7 * u * Math.sin(TW[k] + dr * 0.5);
          const half = span * (0.42 + 0.2 * g) * Math.pow(1 - u, 0.8) + 0.3, off = (sp - ti) * span - wob;
          h = Math.max(h, (1 - Math.abs(off) / half) * (1.05 - 0.6 * u) + n * 0.12);
        }
      } else h += fbm((((a / TAU) * PER * 2 - ph * PER) % PER + PER) % PER, -dr / 2 + 30) * 0.2;
      heat[j * W + i] = h;
    }
  ribbons(heat, t, R - 2, true);
  paintHeat(p, heat, W, HH, X0, Y0, F.slice(2), BANDS, F[1]);
  p.glowRing(0, 0, R + 2, 5, F[4], 0.08);

  // licks flung off the rim along the spin, rising as they go
  looped(t, D, 10, S + 300, (r) => ({ a: r.range(0, TAU), s: r.range(0.8, 1.4), life: r.range(0.18, 0.3) }), (q, age) => {
    const k = 1 - age / q.life, a = q.a + age * 1.6, rr = R + 6 + age * 14;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr - age * 20;
    if (Math.abs(x) > 47 || Math.abs(y) > 47) return;
    p.px(x, y, k > 0.6 ? F[7] : k > 0.3 ? F[5] : F[3]);
    if (k > 0.5) p.px(x, y + 1, F[3]), p.px(x - 1, y, F[3]);
    p.glow(x, y, 3, F[5], 0.3 * k);
  });
  // glints drifting up inside the shell
  looped(t, D, 8, S + 400, (r) => ({ x: r.range(-R * 0.7, R * 0.7), y: r.range(-R * 0.2, R * 0.7), vy: -r.range(20, 40), life: r.range(0.35, 0.6), a: r.range(0, TAU) }), (q, age) => {
    const x = q.x + Math.sin(age * 7 + q.a) * 1.2, y = q.y + q.vy * age, k = 1 - age / q.life;
    if (x * x + y * y > (R - 4) * (R - 4)) return;
    p.px(x, y, k > 0.6 ? F[7] : F[5]);
    p.glow(x, y, 3, F[5], 0.3 * k);
  });
}
