// Shared by the fire/ignar-* effects (the leading _ keeps the tools from listing it as an effect).
import { fit, hex, clamp, rand } from "../../core/index.js";

/** Ignar's fire ramp, dark to bright. */
export const IGNAR = ["#2a0a05", "#6b1408", "#b8260b", "#f05a10", "#ff9a1f", "#ffd84a", "#fff6c8"];

/** The palette as 7 colors, dark to bright. */
export const ramp7 = (pal) => fit(pal, 7);

/**
 * Heat (0..1+) to a ramp step with hard bands: below `cut` nothing; then rim, body, gold, white core.
 * steps: thresholds for C[1]..C[6] (dark red rim .. white).
 */
export function heatColor(C, h, steps = [0.06, 0.2, 0.38, 0.56, 0.74, 0.9]) {
  if (h < steps[0]) return 0;
  let i = 1;
  while (i < 6 && h >= steps[i]) i++;
  return C[i];
}

/** A spark streak along (vx, vy): hot head, cooler 1 px tail. k: life left. */
export function streak(p, x, y, vx, vy, k, C, len = 3) {
  const s = Math.hypot(vx, vy) || 1, ux = vx / s, uy = vy / s, L = Math.max(1, len * (0.5 + 0.5 * k));
  const head = k > 0.6 ? C[6] : k > 0.35 ? C[5] : C[4];
  p.line(x - ux * L, y - uy * L, x - ux, y - uy, k > 0.5 ? C[3] : C[2]);
  p.px(x, y, head);
  p.glow(x, y, 3, C[4], 0.35 * k);
}

/** An ember: one hot pixel cooling through the ramp, with a speck of light. */
export function speck(p, x, y, k, C) {
  p.px(x, y, k > 0.66 ? C[6] : k > 0.4 ? C[5] : k > 0.2 ? C[4] : C[3]);
  p.glow(x, y, 2.5, C[4], 0.3 * k);
}

export { clamp, hex };

/**
 * Paint a heat field as crisp pixel art, the way the hero is drawn: hard ramp bands and a 1 px outline.
 * heat: Float32Array, W x H cells, cell (i, j) is local pixel (X0 + i, Y0 + j). A cell is flame when heat > 0, and
 * needs two flame neighbours to stay (no lone pixels). cols[b] is used for heat >= bands[b] (bands rising, bands[0]
 * usually 0); `outline` goes on every empty cell touching the flame (0 for none), inside the grid: keep flame off its edges. A cell may hold -1 for "nothing".
 */
export function paintHeat(p, heat, W, H, X0, Y0, cols, bands, outline) {
  const PW = W + 2, keep = new Uint8Array(PW * (H + 2)), nb = bands.length;
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const k = j * W + i;
      if (!(heat[k] > 0)) continue;
      const n = (i > 0 && heat[k - 1] > 0) + (i < W - 1 && heat[k + 1] > 0) + (j > 0 && heat[k - W] > 0) + (j < H - 1 && heat[k + W] > 0);
      if (n >= 2) keep[(j + 1) * PW + i + 1] = 1;
    }
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const q = (j + 1) * PW + i + 1;
      if (keep[q]) {
        const h = heat[j * W + i];
        let b = 0;
        while (b < nb - 1 && h >= bands[b + 1]) b++;
        p.px(X0 + i, Y0 + j, cols[b]);
      } else if (outline) {
        const l = keep[q - 1], r = keep[q + 1], u = keep[q - PW], d = keep[q + PW];
        if (l || r || u || d) p.px(X0 + i, Y0 + j, outline);
      }
    }
}

/**
 * tileFbm(x, y, per, 0, seed, 3) with its lattice built once per (seed, per, rows) and cached: the same numbers,
 * several times faster per pixel. Repeats every `per` along x; y must stay in 0..rows. Returns (x, y) => [-1, 1].
 */
const LATTICES = new Map();
export function fastFbm(seed, per, rows) {
  const key = seed + "/" + per + "/" + rows;
  let l = LATTICES.get(key);
  if (!l) {
    l = [];
    for (let o = 0, P = per; o < 3; o++, P *= 2) {
      const R = (rows + 2) << o, a = new Float32Array(P * R);
      for (let y = 0; y < R; y++) for (let x = 0; x < P; x++) a[y * P + x] = rand(x, y, seed + o * 101);
      l.push([a, P]);
    }
    LATTICES.set(key, l);
  }
  const [[a0, p0], [a1, p1], [a2, p2]] = l;
  const oct = (a, P, X, Y) => {
    const ix = Math.floor(X), iy = Math.floor(Y), fx = X - ix, fy = Y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    let x0 = ix % P;
    if (x0 < 0) x0 += P;
    const x1 = x0 + 1 === P ? 0 : x0 + 1, r0 = iy * P, r1 = r0 + P;
    const top = a[r0 + x0] + (a[r0 + x1] - a[r0 + x0]) * ux, bot = a[r1 + x0] + (a[r1 + x1] - a[r1 + x0]) * ux;
    return (top + (bot - top) * uy) * 2 - 1;
  };
  return (x, y) => (oct(a0, p0, x, y) * 0.5 + oct(a1, p1, x * 2, y * 2) * 0.25 + oct(a2, p2, x * 4, y * 4) * 0.125) / 0.875;
}
