// A pair of fire wings, spread behind a figure and flapping gently. Each wing has an arm (shoulder, elbow, wrist)
// with a white-hot leading edge along its top, rows of short hot coverts tucked under it, secondaries hanging off
// the forearm and long primaries fanning from the wrist, every feather a leaf-shaped flame with a 1 px dark rim
// and a hot shaft, overlapping the next like real plumage. Licks rise off the leading edge, embers and licks
// shed from the feather tips. Seen from the side; the anchor is the wing root between the shoulder blades.
// Drawn at the hero's pixel density (about 30 px per game unit), detail at the 1 px level.
import { fit, mix, clamp, WHITE, TAU } from "../../core/index.js";
import { noiseFor, hotFirst, flameBlade, looped, lick, ember } from "./_lib.js";

export const meta = {
  name: "Ignar wing",
  desc: "Fire wings spread behind a figure, flapping gently: a white-hot leading edge, layered rows of dark-rimmed flame feathers, licks and embers shed off the tips.",
  tags: ["fire", "wings", "transform", "god", "buff", "loop"],
  size: [120, 100],
  origin: [88, 74],
  duration: 0.8,
  loop: true,
  fps: 15,
  bg: "dark",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#f05a10", "#ff7a18", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    seed: 5,
  },
};

const D = meta.duration, NL = noiseFor(D);

// feather layers [width share, length share, hot-first ramp step], outside in: dark rim, red, orange, gold, shaft
const PRIM = [[1, 1, 8], [0.8, 0.96, 6], [0.6, 0.84, 5], [0.36, 0.66, 4], [0.12, 0.52, 2]];
const SEC = [[1, 1, 8], [0.8, 0.95, 7], [0.6, 0.88, 6], [0.38, 0.72, 5], [0.12, 0.56, 3]];
const COV = [[1, 1, 8], [0.78, 0.94, 5], [0.52, 0.84, 3], [0.26, 0.7, 2], [0.08, 0.5, 1]];
const COV2 = [[1, 1, 8], [0.76, 0.93, 3], [0.5, 0.82, 2], [0.24, 0.66, 1], [0.08, 0.45, 0]];
// the far wing, a step or two darker and without the white
const FPRIM = [[1, 1, 8], [0.76, 0.95, 7], [0.5, 0.84, 6], [0.24, 0.7, 5]];
const FSEC = [[1, 1, 8], [0.74, 0.94, 7], [0.48, 0.82, 6], [0.22, 0.66, 4]];
const FCOV = [[1, 1, 8], [0.74, 0.92, 6], [0.46, 0.8, 4], [0.2, 0.6, 3]];
const LICK = [[1, 1, 7], [0.7, 0.85, 4], [0.36, 0.55, 2]];

/**
 * A leaf-shaped feather from (x, y) along (ux, uy): narrow at the quill, widest a third of the way, a pointed
 * tip swept `bend` px to the left of its direction; layers drawn outside in, edges crackling by `jit` px.
 */
function plume(p, x, y, ux, uy, len, w, bend, N, n, H, layers, jit) {
  const nx = -uy, ny = ux;
  for (const [lw, lh, ri] of layers) {
    const L = len * lh, c = H[ri];
    for (let r = 0; r <= L; r += 0.5) {
      const u = r / len, prof = u < 0.32 ? 0.45 + 0.55 * Math.sin((u / 0.32) * Math.PI * 0.5) : Math.pow(Math.max(0, (lh - u) / (lh - 0.32)), 0.75);
      const half = w * lw * prof + N(8, n, r * 0.4) * jit * u;
      if (half < 0.3) continue;
      const off = bend * u * u, cx = x + ux * r + nx * off, cy = y + uy * r + ny * off;
      for (let q = -half; q <= half; q += 0.5) p.px(cx + nx * q, cy + ny * q, c);
    }
  }
}

// a feather row: n feathers, roots along the arm from u0 to u1 (0 shoulder .. 1 wing tip), angles a0..a1
// (screen radians, y down), lengths l0..l1, half-widths w0..w1. Rows are listed from the tip inward.
function row(n, u0, u1, a0, a1, l0, l1, w0, w1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const k = n > 1 ? i / (n - 1) : 0;
    out.push({ u: u0 + (u1 - u0) * k, a: a0 + (a1 - a0) * k, len: l0 + (l1 - l0) * k, w: w0 + (w1 - w0) * k, k });
  }
  return out;
}
// primaries fan from the wrist: up-and-back at the top to straight back at the bottom
const PRIMS = row(7, 1, 0.66, -0.06, -0.95, 37, 27, 4.6, 5); // angles relative to the hand
// secondaries hang off the forearm: back-and-down, steeper toward the body
const SECS = row(7, 0.62, 0.08, -3.3, -4.2, 28, 22, 5, 5.2);
// two rows of coverts over the quills
const COVS = row(8, 0.95, 0.1, -2.8, -4.0, 15, 12, 3.8, 4.2);
const COVS2 = row(7, 0.85, 0.12, -2.85, -3.9, 8, 7, 3, 3.2);

function wing(p, t, o, far) {
  const H = hotFirst(fit(o.palette, 9)), S = o.seed + (far ? 50 : 0), ph = t / D;
  const N = (rate, seed = 0, off = 0) => NL(t, rate, seed, off);
  // the beat: the arm rises and falls, the hand a little behind it, the feather tips further behind
  const beat = Math.sin(ph * TAU), lag = Math.sin(ph * TAU - 1.1), lag2 = Math.sin(ph * TAU - 2);
  const ox = far ? 10 : 0, oy = far ? -6 : 0, sc = far ? 0.8 : 1, A = beat * 0.08 + (far ? 0.42 : 0);
  // the arm: shoulder -> elbow (steep, up and back) -> wing tip (flatter); the wrist bends with the beat
  const a1 = -1.85 + A, a2 = -2.5 + A + lag * 0.07;
  const ex = ox + Math.cos(a1) * 24 * sc, ey = oy + Math.sin(a1) * 24 * sc;
  const tx = ex + Math.cos(a2) * 30 * sc, ty = ey + Math.sin(a2) * 30 * sc;
  const at = (u) => (u <= 0.44 ? [ox + (ex - ox) * (u / 0.44), oy + (ey - oy) * (u / 0.44)] : [ex + (tx - ex) * ((u - 0.44) / 0.56), ey + (ty - ey) * ((u - 0.44) / 0.56)]);
  const swing = (f, prim) => (prim ? a2 : 0) + f.a + (prim ? 0 : A) * (0.7 + 0.3 * f.u) + lag * 0.05 * f.u + lag2 * 0.05 * (1 - f.k * 0.5);
  const feather = (f, layers, salt, bend, prim) => {
    const [x, y] = at(f.u), a = swing(f, prim), ln = f.len * sc * (0.96 + 0.05 * N(5, S + salt + f.k * 9));
    plume(p, x, y, Math.cos(a), Math.sin(a), ln, f.w * sc, bend, N, S * 13 + salt + Math.round(f.k * 20), H, layers, 0.35);
  };
  // back to front: primaries, secondaries, coverts, inner coverts; each row from its back feather forward
  for (const f of PRIMS) feather(f, far ? FPRIM : PRIM, 0, -2.5, true);
  for (const f of [...SECS].reverse()) feather(f, far ? FSEC : SEC, 30, -2);
  for (const f of COVS) feather(f, far ? FCOV : COV, 60, -1);
  if (!far) for (const f of COVS2) feather(f, COV2, 90, -0.5);
  // licks rising off the leading edge
  for (let i = 0; i < 7; i++) {
    const u = 0.1 + i * 0.13, [x, y] = at(u), h = (3.5 + 2.5 * Math.sin(ph * TAU * 2 + i * 1.9) + 2 * N(6, S + 90 + i)) * sc;
    if (h > 1.5) flameBlade(p, x, y - 1.5, 0.3, -1, h, 1.5 * sc, 1.5, N, S * 13 + 120 + i, H, far ? FCOV : LICK, 0.3, 0.6);
  }
  // the leading edge along the top of the arm: a dark rim, a white-hot line, then yellow and gold under it
  const edge = (d, c0, c1) => {
    const n1x = Math.sin(a1), n1y = -Math.cos(a1), n2x = Math.sin(a2), n2y = -Math.cos(a2);
    p.line(ox + n1x * d, oy + n1y * d, ex + n1x * d, ey + n1y * d, c0);
    p.line(ex + n2x * d, ey + n2y * d, tx + n2x * d, ty + n2y * d, c1);
  };
  if (far) {
    edge(1.2, H[8], H[8]);
    edge(0, H[3], H[4]);
    edge(-1, H[5], H[6]);
  } else {
    edge(1.6, H[7], H[7]);
    edge(0.6, H[0], H[1]);
    edge(-0.4, H[1], H[2]);
    edge(-1.4, H[3], H[4]);
    // the wrist: a hot knot
    p.px(ex, ey, H[0]), p.px(ex - 1, ey, H[0]), p.px(ex, ey + 1, H[1]);
  }
  const mx = (ox + ex + tx) / 3 - 6 * sc, my = (oy + ey + ty) / 3 + 8 * sc;
  if (!far) {
    p.glow(mx, my, 50, mix(H[3], WHITE, 0.15), 0.18);
    p.glowLine(ox, oy, ex, ey, 6, H[1], 0.22);
    p.glowLine(ex, ey, tx, ty, 5, H[2], 0.16);
    p.glow(ox, oy, 14, H[1], 0.3);
    p.glow(ex, ey, 7, WHITE, 0.25);
  } else p.glow(mx, my, 34, H[3], 0.1);
  const tip = (k, d) => {
    const all = [...PRIMS, ...SECS], j = clamp(Math.round(k * (all.length - 1)), 0, all.length - 1), f = all[j], a = swing(f, j < PRIMS.length), [x, y] = at(f.u);
    return [x + Math.cos(a) * f.len * sc * d, y + Math.sin(a) * f.len * sc * d];
  };
  return { tip };
}

export function draw(p, t, o) {
  const H = hotFirst(fit(o.palette, 9)), S = o.seed, EMB = [H[1], H[2], H[4], H[6]];
  wing(p, t, o, true);
  const near = wing(p, t, o, false);
  const ok = (x, y) => x > -86 && x < 30 && y > -72 && y < 24;
  // licks torn off the feather tips, drifting up and back
  looped(t, D, 12, S + 300, (r) => ({ k: r.next(), d: r.range(0.85, 1), vx: -r.range(8, 20), vy: -r.range(16, 32), s: r.range(0.7, 1.3), life: r.range(0.22, 0.34) }), (q, age) => {
    const [x, y] = near.tip(q.k, q.d), X = x + q.vx * age, Y = y + q.vy * age;
    if (ok(X, Y)) lick(p, X, Y, 1 - age / q.life, q.s, H);
  });
  // embers floating off
  looped(t, D, 16, S + 400, (r) => ({ k: r.next(), d: r.range(0.95, 1.1), vx: -r.range(5, 16), vy: -r.range(14, 28), life: r.range(0.5, 0.8), a: r.range(0, TAU), s: r.chance(0.2) ? 2 : 1 }), (q, age) => {
    const [x0, y0] = near.tip(q.k, q.d), x = x0 + q.vx * age + Math.sin(age * 8 + q.a) * 1.5, y = y0 + q.vy * age;
    if (ok(x, y)) ember(p, x, y, 1 - age / q.life, q.s, EMB, age * 40 + q.a);
  });
}
