import { TAU, noise2, burst, fly, flyV, seg, ease, clamp } from "../../core/index.js";
import { IGNAR, ramp7, heatColor, streak, speck } from "./_ignar.js";

export const meta = {
  name: "Ignar fireball hit",
  desc: "A fireball impact: a white-yellow star flash, then a ring of flame tongues bursting outward and cooling to red, embers flung out, gone in a third of a second.",
  tags: ["fire", "impact", "hit", "explosion", "ignar"],
  size: [32, 32],
  origin: [16, 16],
  duration: 0.3,
  loop: false,
  fps: 20,
  bg: "dark",
  options: { palette: IGNAR, seed: 11 },
};

const D = meta.duration, NT = 9; // flame tongues round the ring

export function draw(p, t, o) {
  const C = ramp7(o.palette), S = o.seed;
  // 1. the flash: a white disc and an 8-ray star, first two frames only
  const f = 1 - seg(t, 0, 0.09);
  if (f > 0) {
    const r = 3 + 3 * (1 - f);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.2, len = (i % 2 ? 7 : 11) * (0.6 + 0.4 * f);
      p.line(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, Math.cos(a) * len, Math.sin(a) * len, (u) => (u < 0.4 ? C[6] : u < 0.75 ? C[5] : C[4]));
    }
    p.circle(0, 0, r, (d) => (d < 0.6 ? C[6] : C[5]));
    p.glow(0, 0, 16, C[5], 0.7 * f);
  }
  // 2. the ring: flame tongues pushed outward, curling a little, breaking apart into pieces and cooling
  const u = seg(t, 0.03, 0.29);
  if (u > 0 && u < 1) {
    const R = 2.5 + 8.5 * ease.outQuart(u), th = 3.2 * (1 - u) + 1, heat = 1 - u, swirl = 0.35 * ease.outQuad(u);
    p.shade(-15, -15, 15, 15, (x, y, out) => {
      const d = Math.hypot(x, y);
      // the pieces curl as they fly: angle twisted by distance
      const a = Math.atan2(y, x) - swirl * (d / 10);
      const g = (a / TAU) * NT + 0.3 + noise2(d * 0.2, 1, S) * 0.15;
      const fr = g - Math.floor(g), id = ((Math.floor(g) % NT) + NT) % NT;
      const across = Math.abs(fr - 0.5) * 2; // 0 mid-tongue, 1 between tongues
      const tl = (0.7 + 0.5 * noise2(id, 3, S)) * 5 * Math.min(1, u * 3);
      const spike = Math.max(0, 1 - across * 1.4);
      const outer = R + th * (0.6 + 0.4 * spike) + tl * spike * spike;
      const inner = R - th * 0.7 - u * 2 + (u > 0.35 ? across * (u - 0.35) * 14 : 0);
      if (d > outer || d < inner) return;
      const n = noise2(x * 0.55, y * 0.55 + t * 30, S + 4);
      const k = 1 - (d - inner) / Math.max(0.5, outer - inner);
      // gaps open between the tongues as the ring breaks
      const gap = u > 0.38 ? (u - 0.38) * 2 * across : 0;
      const h = (0.3 + 0.7 * k) * (0.38 + 0.72 * heat) + 0.14 * n - gap - (u > 0.62 ? (u - 0.62) * 1.3 * (0.6 + 0.4 * n) : 0);
      const c = heatColor(C, h, [0.08, 0.18, 0.34, 0.54, 0.74, 0.92]);
      if (!c) return;
      out.c = c;
      out.k = h > 0.54 ? 0.12 : 0;
    });
  }
  // 3. embers flung out, slowing, falling a little, cooling
  burst(14, S + 20, (r, i) => {
    const a = (i / 14) * TAU + r.range(-0.2, 0.2), sp = r.range(110, 190), life = r.range(0.18, 0.27), t0 = 0.02;
    const age = t - t0;
    if (age < 0 || age > life) return;
    const [x, y] = fly(Math.cos(a) * 3, Math.sin(a) * 3, Math.cos(a) * sp, Math.sin(a) * sp, age, 160, 7);
    if (Math.abs(x) > 15 || Math.abs(y) > 15) return;
    const k = 1 - age / life, [vx, vy] = flyV(Math.cos(a) * sp, Math.sin(a) * sp, age, 160, 7);
    if (i % 3) streak(p, x, y, vx, vy, k, C, 2.5);
    else speck(p, x, y, k, C);
  });
  // light: a flare at contact that dies away
  const L = 1 - seg(t, 0, 0.26);
  p.glow(0, 0, 18, C[4], 0.4 * L * L);
}
