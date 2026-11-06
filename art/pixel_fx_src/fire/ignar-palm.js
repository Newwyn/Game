import { TAU, noise2, fbm, burst, fly, flyV, seg, ease, clamp } from "../../core/index.js";
import { IGNAR, ramp7, heatColor, streak, speck } from "./_ignar.js";

export const meta = {
  name: "Ignar palm blast",
  desc: "A forward palm blast: a star flash at the palm, then a cone of flame roars out to the right, widening into forked tongues, lets go of the palm and breaks into embers.",
  tags: ["fire", "blast", "cone", "breath", "directional", "ignar"],
  size: [72, 40],
  origin: [3, 20],
  duration: 0.35,
  loop: false,
  fps: 20,
  bg: "dark",
  options: { palette: IGNAR, seed: 17, length: 66 },
};

export function draw(p, t, o) {
  const C = ramp7(o.palette), S = o.seed, Lmax = o.length;
  // 1. the muzzle flash at the palm: a star thrown forward
  const f = 1 - seg(t, 0, 0.1);
  if (f > 0) {
    for (let i = 0; i < 7; i++) {
      const a = -1.35 + (i / 6) * 2.7, len = (i === 3 ? 11 : i % 2 ? 4 : 7) * (0.5 + 0.5 * f);
      p.line(0, 0, Math.cos(a) * len, Math.sin(a) * len, (u) => (u < 0.5 ? C[6] : C[5]));
    }
    p.circle(0.5, 0, 1.2 + 1.3 * f, C[6]);
    p.glow(0, 0, 10, C[5], 0.6 * f);
  }
  // 2. the cone: its front races out, its root lets go of the palm and chases it, it cools and tears apart
  const front = Lmax * ease.outCubic(seg(t, 0.02, 0.19));
  const back = (Lmax + 8) * ease.inQuad(seg(t, 0.13, 0.33));
  const cool = seg(t, 0.12, 0.31);
  if (front > back - 6) {
    p.shade(0, -19, 69, 19, (x, y, out) => {
      const r = Math.hypot(x, y), ang = Math.atan2(y, x);
      const u = r / Lmax; // 0 at the palm, 1 at full reach
      const half = 0.12 + 0.24 * Math.min(1, u * 1.4); // angular half-width, flaring out of the palm
      const ay = Math.abs(ang) / half;
      if (ay > 1.35) return;
      const n = fbm(r * 0.15 - t * 40, ang * 9, S, 2);
      // three lanes fan out at the end: the cone forks into tongues
      const wob = (ang + n * 0.08 + Math.sin(r * 0.25 - t * 50) * 0.04 * u) / half;
      const lanes = Math.cos(wob * Math.PI / 0.3) * 0.5 + 0.5; // peaks on the axis and at ±0.6
      const reach = front * (0.74 + 0.26 * lanes) + n * 5;
      if (r > reach + 4 || r < back - 6) return;
      let h = (1 - Math.pow(ay, 3)) * (0.95 - 0.45 * u) + 0.22 * n + (lanes - 0.5) * 0.3 * u * u + Math.max(0, 0.3 - ay) * (1 - u) * 0.8;
      h -= clamp((r - reach) / 4 + 0.5) * 0.9;
      // the end splits into forked tongues
      h -= (1 - lanes) * clamp((r - front * 0.62) / (front * 0.3 + 1)) * 0.4;
      h -= clamp((back - r) / 5 + 0.5) * 0.9 * (1 - 0.5 * n);
      // cooling: the jet drops down the ramp and tears into blobs
      h -= seg(t, 0.2, 0.31) * 0.7 + cool * (0.2 + 1.1 * Math.max(0, noise2(r * 0.14 - t * 30, ang * 22, S + 3) + 0.15));
      const c = heatColor(C, h, [0.06, 0.18, 0.34, 0.52, 0.72, 0.9]);
      if (!c) return;
      out.c = c;
      out.k = h > 0.5 ? 0.1 : 0;
    });
  }
  // 3. embers: shed along the cone, flung out of its sides and front
  burst(30, S + 30, (r, i) => {
    const t0 = r.range(0.05, 0.27), age = t - t0, life = r.range(0.06, 0.08);
    if (age < 0 || age > life) return;
    const lo = Math.max(0.3, (Lmax + 8) * ease.inQuad(seg(t0, 0.13, 0.33)) / Lmax), x0 = Lmax * ease.outCubic(seg(t0, 0.02, 0.19)) * r.range(Math.min(lo, 0.9), 0.95), side = r.range(-1, 1);
    const y0 = side * x0 * 0.3;
    const vx = r.range(60, 140), vy = side * r.range(30, 90);
    const [x, y] = fly(x0, y0, vx, vy, age, 0, 6);
    if (x > 70 || x < 0 || Math.abs(y) > 19) return;
    const k = 1 - age / life;
    if (i % 2) streak(p, x, y, ...flyV(vx, vy, age, 0, 6), k, C, 3);
    else speck(p, x, y, k, C);
  });
  // light along the jet
  const jl = clamp(seg(t, 0.02, 0.08)) * (1 - seg(t, 0.13, 0.3));
  if (jl > 0) p.glowLine(Math.max(back, 2), 0, Math.max(back + 1, front * 0.9), 0, 14, C[4], 0.25 * jl);
}
