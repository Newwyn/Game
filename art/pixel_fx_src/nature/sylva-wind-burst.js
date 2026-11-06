import { fit, burst, rng, clamp, smooth, ease, TAU, WHITE } from "../../core/index.js";
import { drawLeaf } from "./_lib.js";

export const meta = {
  name: "Sylva wind burst",
  desc: "A gust bursting open: a white flash, spiral lines of wind unwinding from the center, a swirling ring blasting outward with leaves, thinning to nothing.",
  tags: ["nature", "wind", "burst", "impact", "spirit"],
  size: [56, 56],
  origin: [28, 28],
  duration: 0.42,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0f2e1a", "#166534", "#22c55e", "#4ade80", "#bbf7d0", "#f0fdf4"],
    gold: ["#facc15", "#fde68a"],
    leaves: ["#0f2e1a", "#166534", "#22c55e", "#86efac"],
    seed: 6,
  },
};

const D = 0.42, MAXR = 25;

export function draw(p, t, o) {
  const C = fit(o.palette, 6), G = fit(o.gold, 2), L = fit(o.leaves, 4), S = o.seed, k = t / D;

  // the flash: a white ball for two frames, then a mint glow that drains away
  if (t < 0.07) {
    const f = t / 0.07;
    p.circle(0, 0, 5 - 2 * f, f < 0.5 ? WHITE : C[5]);
    p.ring(0, 0, 6 + 4 * f, 1, C[4]);
  }
  p.glow(0, 0, 26, C[3], 0.55 * (1 - smooth(0, 0.3, t)));
  p.glow(0, 0, 8, WHITE, 0.7 * (1 - smooth(0, 0.12, t)));

  // spiral wind lines: five arms unwinding out of the center, the whole spiral turning and growing, each arm
  // white-gold at its outer head and green toward the middle, eaten away from the inside as it goes
  const grow = ease.outQuart(clamp(t / 0.3)), turn = 1.6 * ease.outCubic(clamp(t / D)), eat = 1.05 * smooth(0.08, 0.34, t);
  for (let j = 0; j < 5; j++) {
    const g = rng(S, j), a0 = (j * TAU) / 5 + g.range(-0.25, 0.25) + turn, len = g.range(2.4, 3.2), gold = j % 2 === 0;
    for (let s = eat * len; s <= len; ) {
      const u = s / len, r = (2 + u * u * MAXR * 0.95) * grow, th = a0 + s;
      s += Math.min(0.2, 0.7 / Math.max(1, r));
      if (r < 1.5) continue;
      const x = Math.cos(th) * r, y = Math.sin(th) * r;
      const c = u > 0.9 ? (gold ? G[1] : WHITE) : u > 0.7 ? (gold ? G[0] : C[5]) : u > 0.45 ? C[4] : C[3];
      const a = 1 - smooth(0.5, 0.85, k);
      if (a <= 0.02) break;
      if (a > 0.97) p.px(x, y, c);
      else p.blend(x, y, c, a);
    }
    const hr = (2 + MAXR * 0.95) * grow, hth = a0 + len;
    p.light(Math.cos(hth) * hr, Math.sin(hth) * hr, gold ? G[0] : C[4], 0.5 * (1 - k));
  }

  // the ring: a swirling band of wind blasting out, dashes chasing round it, thinning as it goes
  const rk = clamp((t - 0.02) / 0.38);
  if (rk > 0 && rk < 1) {
    const R = 5 + (MAXR - 6) * ease.outQuart(rk), W = 3.2 * (1 - rk) + 0.6, spin = 2.2 * ease.outCubic(rk);
    p.shade(-R - 1, -R - 1, R + 1, R + 1, (x, y) => {
      const d = Math.hypot(x, y), dr = R - d;
      if (dr < 0 || dr > W) return;
      const th = Math.atan2(y, x), dash = Math.sin(th * 6 + spin * 6 - dr * 0.9);
      const keep = 0.95 - 1.4 * rk;
      if (dash < -keep) return;
      const q = dr / W;
      const c = q < 0.3 ? (dash > 0.7 ? WHITE : C[5]) : q < 0.65 ? C[4] : C[3];
      if (rk < 0.6) return c;
      p.blend(x, y, c, 1 - (rk - 0.6) / 0.4);
    });
    p.glowRing(0, 0, R - 1, 4, C[4], 0.3 * (1 - rk));
  }

  // leaves flung out on the swirl: they spiral outward, tumbling, slowing, shrinking away
  burst(6, S + 17, (R, j) => {
    const t0 = R.range(0.02, 0.06), age = t - t0, life = R.range(0.33, 0.38);
    if (age < 0 || age > life) return;
    const q = age / life, a = (j * TAU) / 6 + R.range(-0.3, 0.3) + 1.4 * ease.outCubic(q), r = 4 + R.range(15, 20) * ease.outCubic(q);
    const x = Math.cos(a) * r, y = Math.sin(a) * r, sc = 1 - smooth(0.55, 1, q) * 0.55;
    if (q > 0.9) return;
    drawLeaf(p, x, y, R.range(5, 6.5) * sc, R.range(1.9, 2.4) * sc, a + Math.PI / 2 + age * R.range(10, 18), age * R.range(14, 22), L);
  });

  // motes of gold and mint spat out along the gust
  burst(12, S + 29, (R) => {
    const t0 = R.range(0, 0.1), age = t - t0, life = R.range(0.15, 0.28);
    if (age < 0 || age > life) return;
    const q = age / life, a = R.range(0, TAU) + 1.2 * q, r = 6 + R.range(14, 21) * ease.outCubic(q);
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    p.dot(x, y, q < 0.4 ? WHITE : R.chance(0.5) ? G[1] : C[4], 1 - q * q);
    p.light(x, y, C[4], 0.35 * (1 - q));
  });
}
