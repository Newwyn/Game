import { TAU, tileFbm, cycle, clamp } from "../../core/index.js";
import { IGNAR, ramp7, heatColor, speck } from "./_ignar.js";

export const meta = {
  name: "Ignar hand flame",
  desc: "A small flame held above an open palm: a white-gold heart at the base, three orange tongues licking upward with red tips, licks tearing off the top, a few sparks rising.",
  tags: ["fire", "flame", "hand", "loop", "ignar"],
  size: [24, 28],
  origin: [12, 22],
  duration: 0.4,
  loop: true,
  fps: 20,
  bg: "dark",
  options: { palette: IGNAR, seed: 3, height: 18 },
};

const D = meta.duration;
// tongues [base x, height share, half-width, sway phase, sway amount]
const TONGUES = [[0, 1, 5.2, 0, 1.4], [-2.6, 0.62, 3.2, 0.37, 1.8], [2.8, 0.7, 3.2, 0.71, 1.8]];

// heat of one tongue at (x, y): 1 on its axis near the base, 0 at its edge
function tongue(x, y, bx, Ht, w0, sw, ph, n) {
  const v = -y / Ht;
  if (v > 1.1 || v < -0.4) return 0;
  const vb = clamp(v, 0, 0.999);
  // a round bulb: below the base the width closes like a circle
  const w = v < 0 ? w0 * Math.sqrt(Math.max(0, 1 - (v / 0.3) ** 2)) : w0 * Math.pow(1 - vb, 0.9);
  const cx = bx * (1 - vb * 0.3) + sw * Math.sin(ph * TAU + vb * 2.6) * vb * vb;
  const dx = Math.abs(x - cx) / Math.max(0.5, w + n * vb * 1.2);
  return (1 - dx) * (1.08 - 0.75 * vb) - (v < 0 ? -v * 1.2 : 0);
}

export function draw(p, t, o) {
  const C = ramp7(o.palette), S = o.seed, ph = t / D, H = o.height;
  p.shade(-11, -22, 11, 5, (x, y, out) => {
    const n = tileFbm(x * 0.4 + 7, y * 0.33 + ph * 4, 0, 4, S, 2);
    let h = 0;
    TONGUES.forEach(([bx, hs, w, sp, sw], i) => {
      h = Math.max(h, tongue(x, y, bx, H * hs * (0.92 + 0.08 * Math.sin((ph + sp) * TAU * 2)), w, sw, ph + sp, n) * (i ? 0.85 : 1));
    });
    if (h <= 0) return;
    h += 0.18 * n;
    const c = heatColor(C, h, [0.05, 0.14, 0.32, 0.52, 0.7, 0.86]);
    if (!c) return;
    out.c = c;
    out.k = h > 0.52 ? 0.1 : 0;
  });
  // licks torn off the tips: small blobs rising and shrinking, red rim round orange
  cycle(t, D, 3, S + 20, D * 0.9, (age, life, r, i) => {
    const k = 1 - age / life, bx = [0, -3, 3][i] + r.range(-1, 1);
    const x = bx + Math.sin((age / life) * TAU * 0.5) * (i ? Math.sign(bx) : 1);
    const y = -H * [0.95, 0.6, 0.68][i] - 1 - 18 * age;
    if (y < -21) return;
    if (k > 0.55) p.px(x, y - 1, C[2]), p.px(x, y, C[3]), p.px(x, y + 1, C[4]), p.px(x + 1, y + 1, C[3]), p.px(x - 1, y + 1, C[2]);
    else if (k > 0.25) p.px(x, y, C[2]), p.px(x, y + 1, C[3]);
    else p.px(x, y, C[2]);
  });
  // sparks rising off the flame's shoulders, wandering
  cycle(t, D, 4, S + 40, (r) => r.range(0.28, 0.4), (age, life, r) => {
    const k = 1 - age / life, side = r.chance(0.5) ? 1 : -1, x0 = side * r.range(4, 6), vy = r.range(30, 46);
    const x = x0 + side * age * 10 + Math.sin(age * r.range(14, 22) + r.range(0, 6)) * 1.2;
    const y = -8 - r.range(0, 4) - vy * age;
    if (y < -21 || Math.abs(x) > 11) return;
    speck(p, x, y, k, C);
  });
  // light: a hot heart at the palm, a warm halo
  const fl = 0.9 + 0.1 * Math.sin(ph * TAU * 3);
  p.glow(0, -6, 15, C[4], 0.32 * fl);
  p.glow(0, -3, 5, C[6], 0.35 * fl);
}
