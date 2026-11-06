import { fit, burst, fly, flyV, clamp, smooth, seg, ease, TAU, WHITE } from "../../core/index.js";
import { drawLeaf } from "./_lib.js";

export const meta = {
  name: "Sylva fang",
  desc: "A spirit wolf's bite: two curved rows of glowing mint fangs gape, snap shut with a white flash and spray green sparks and torn leaves.",
  tags: ["nature", "bite", "fang", "spirit", "impact", "melee"],
  size: [40, 40],
  origin: [20, 20],
  duration: 0.38,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0f2e1a", "#166534", "#22c55e", "#4ade80", "#bbf7d0", "#f0fdf4"],
    leaves: ["#0f2e1a", "#166534", "#22c55e", "#bbf7d0"],
    seed: 2,
  },
};

const OPEN = 0.1, SNAP = 0.15, FLASH = 0.19, GONE = 0.31;
const BEND = 0.022;

// how far apart the rows are: gape wider, then slam shut
function gap(t) {
  if (t < OPEN) return 7 + 4 * ease.outCubic(t / OPEN);
  if (t < SNAP) return 11 - 8.5 * ease.inQuad((t - OPEN) / (SNAP - OPEN));
  return 2.5 + 3 * ease.outCubic(smooth(FLASH - 0.02, GONE, t));
}

// one row: a gum line bent round the bite, fangs hanging off it pointing at the other row.
// s = -1 the upper row (fangs point down), 1 the lower row (fangs point up)
function row(p, C0, g, s, look, a, white, d, pass) {
  const C = C0.map((_, i) => C0[Math.max(0, i - d)]);
  const base = (x) => s * (g + 5) - s * BEND * x * x;
  const xs = s < 0 ? [-11, -5.5, 0, 5.5, 11] : [-8.5, -3, 3, 8.5];
  // gum: a lit band behind the fangs
  if (pass === 0) for (let x = -13; x <= 13; x++) {
    const y = base(x), edge = Math.abs(x) > 11;
    const c0 = white ? WHITE : edge ? C[2] : C[3], c1 = white ? C[5] : C[1];
    p.blend(x, y + s, c1, a * 0.8);
    p.blend(x, y, c0, a * (edge ? 0.6 : 1));
  }
  for (const x0 of xs) {
    const canine = Math.abs(x0) > 7 && s < 0 ? 1 : Math.abs(x0) > 7 ? 0.6 : 0;
    const len = (4.2 + canine * 2.6) * look, w = 1.8 + canine * 0.5, by = base(x0);
    // the tip hooks a little toward the middle of the bite
    const tx = x0 - Math.sign(x0) * (0.8 + canine), ty = by - s * len;
    const pts = [[x0 - w, by], [x0 + w, by], [tx, ty]];
    // a dark rim, then the fang: lit on its left face, shaded on its right, white at the tip
    if (pass === 0) {
      p.poly([[x0 - w - 1, by], [x0 + w + 1, by], [tx, ty - s]], C[1], a);
      continue;
    }
    p.poly(pts, (x, y) => {
      if (white) return WHITE;
      const u = Math.abs(y - by) / Math.max(1, len);
      return u > 0.68 ? C[5] : x < x0 + (tx - x0) * u ? C[5] : C[4];
    }, a);
    if (!white && a > 0.6) p.px(tx, ty + s * 0.5, d ? C[5] : WHITE);
    if (!d) p.glow(tx, ty, 4, C[4], 0.3 * a);
  }
}

export function draw(p, t, o) {
  const C = fit(o.palette, 6), L = fit(o.leaves, 4), S = o.seed;
  const g = gap(t), appear = 0.45 + 0.55 * ease.outCubic(clamp(t / 0.07)), white = t >= SNAP && t < FLASH - 0.02;
  // the rows: fade in while they gape, flash white on the snap, then thin out and shrink
  if (t < GONE) {
    const die = smooth(FLASH - 0.02, GONE, t), a = 1, look = appear * (1 - die * 0.6), d = Math.floor(die * 3);
    p.glow(0, 0, 18, C[3], 0.25 * a);
    for (const pass of [0, 1]) for (const s of [-1, 1]) row(p, C, g, s, look, a, white, d, pass);
  }
  // the snap: a white crack along the bite, a burst of light, a ring of mist
  if (t >= SNAP && t < FLASH + 0.02) {
    const k = (t - SNAP) / (FLASH + 0.02 - SNAP), w = 15 * (1 - k * 0.4);
    p.line(-w, 0, w, 0, WHITE, (u) => 1 - Math.abs(u - 0.5) * 2 * k);
    if (k < 0.5) p.line(-w * 0.6, -1, w * 0.6, -1, C[5]), p.line(-w * 0.6, 1, w * 0.6, 1, C[5]);
    p.glow(0, 0, 16, C[5], 0.8 * (1 - k));
    p.glow(0, 0, 5, WHITE, 0.7 * (1 - k));
  }
  const after = t - SNAP;
  if (after > 0) {
    // mist puffing out of the bite
    burst(6, S + 5, (R) => {
      const life = R.range(0.12, 0.2), k = after / life;
      if (k >= 1) return;
      const side = R.sign(), x = side * (3 + R.range(4, 10) * ease.outCubic(k)), y = R.range(-2, 2) * (1 + k);
      p.disc(x, y, 1.5 + 3 * k, C[3], 0.35 * (1 - k));
    });
    // sparks: flung mostly sideways out of the bite, stretched along their motion, cooling
    burst(16, S + 9, (R) => {
      const life = R.range(0.12, 0.22), k = after / life;
      if (k >= 1) return;
      const x0 = R.range(-11, 11), a = (x0 > 0 ? 0 : Math.PI) + R.range(-1.1, 1.1), v = R.range(90, 170);
      const [x, y] = fly(x0, R.range(-1, 1), Math.cos(a) * v, Math.sin(a) * v, after, 120, 4);
      const [vx, vy] = flyV(Math.cos(a) * v, Math.sin(a) * v, after, 120, 4), sp = Math.hypot(vx, vy) || 1;
      const len = Math.min(4, sp * 0.02);
      if (Math.abs(x) > 18 || Math.abs(y) > 18) return;
      const c = k < 0.35 ? WHITE : k < 0.7 ? C[5] : C[4];
      p.line(x - (vx / sp) * len, y - (vy / sp) * len, x, y, k < 0.5 ? C[4] : C[3]);
      p.px(x, y, c);
      p.light(x, y, C[4], 0.5 * (1 - k));
    });
    // torn leaves: bits of green that tumble out and drop
    burst(4, S + 13, (R, j) => {
      const life = R.range(0.16, 0.2), k = after / life;
      if (k >= 1) return;
      const side = j % 2 ? 1 : -1, el = j < 2 ? -0.7 : 0.35, a = side > 0 ? el + R.range(-0.2, 0.2) : Math.PI - el + R.range(-0.2, 0.2), v = R.range(60, 85);
      const [x, y] = fly(side * 8, 0, Math.cos(a) * v, Math.sin(a) * v, after, 260, 4);
      if (Math.abs(x) > 17 || Math.abs(y) > 17) return;
      const sc = 1 - k * 0.5;
      drawLeaf(p, x, y, R.range(5, 6) * sc, R.range(1.8, 2.3) * sc, a + after * R.range(14, 24), after * 20, L, k > 0.8 ? 0 : 1);
    });
  }
}
