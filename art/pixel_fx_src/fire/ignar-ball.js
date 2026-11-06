import { TAU, tileFbm, tileNoise, cycle, clamp } from "../../core/index.js";
import { IGNAR, ramp7, heatColor, streak, speck } from "./_ignar.js";

export const meta = {
  name: "Ignar fireball",
  desc: "A small fireball flying right: a round white-hot core with a churning gold rim, a tail of flame torn into tongues streaming left, sparks shed behind.",
  tags: ["fire", "fireball", "projectile", "directional", "loop", "ignar"],
  size: [32, 20],
  origin: [23, 10],
  duration: 0.3,
  loop: true,
  fps: 20,
  bg: "dark",
  options: { palette: IGNAR, seed: 7, radius: 5.4, tail: 20 },
};

const D = meta.duration;
// tail tongues [length share, spread, half-width share, wave phase]
const BLADES = [[1, 0, 0.8, 0], [0.74, -1.9, 0.5, 0.33], [0.66, 1.9, 0.5, 0.66]];

export function draw(p, t, o) {
  const C = ramp7(o.palette), S = o.seed, ph = t / D, R = o.radius, L = o.tail;
  p.shade(-22, -9, 8, 9, (x, y, out) => {
    // the flow streams left past the ball: noise scrolled 3 cells to the left per loop
    const n = tileFbm(x * 0.28 + ph * 3, y * 0.42, 3, 0, S, 2);
    const d = Math.hypot(x, y);
    // the head: a round ball, swept a little back
    let h = 1.1 * (1 - Math.hypot(Math.min(x, 0) * 0.8 + Math.max(x, 0), y) / (R + 0.5 * n));
    // the tail: three tongues streaming back from the head, the middle one longest, each waving
    if (x < 1) BLADES.forEach(([len, dy, w, sp], j) => {
      const u = (-x + 1) / (L * len);
      if (u > 1) return;
      const yc = dy * u * R * 0.5 + Math.sin(u * 5.5 - (ph + sp) * TAU) * 1.3 * u;
      const ww = w * R * Math.pow(1 - u, 1.1) + n * 1.2 * u;
      h = Math.max(h, (1 - Math.abs(y - yc) / Math.max(0.4, ww)) * (0.82 - 0.6 * u));
    });
    if (h <= 0) return;
    h += 0.2 * n;
    // the heart is white, a crisp red skin on the nose
    const c = heatColor(C, h, [0.02, 0.14, 0.3, 0.48, 0.66, 0.82]);
    if (!c) return;
    out.c = c;
    out.k = h > 0.6 ? 0.1 : 0;
  });
  // sparks shed behind, flying back and drifting
  cycle(t, D, 6, S + 30, (r) => r.range(0.16, 0.3), (age, life, r) => {
    const k = 1 - age / life, vx = -r.range(60, 110), vy = r.range(-30, 30);
    const sy = r.chance(0.5) ? 1 : -1, x = -r.range(1, 6) + vx * age, y = sy * r.range(4, 6) + vy * age * 0.5 + sy * 20 * age;
    if (x < -21 || Math.abs(y) > 9) return;
    if (r.chance(0.5)) streak(p, x, y, vx, vy, k, C, 2);
    else speck(p, x, y, k, C);
  });
  // light
  p.glowLine(-2, 0, -16, 0, 7, C[4], 0.18);
  p.glow(0, 0, 14, C[4], 0.35);
  p.glow(1, 0, 5, C[6], 0.4);
}
