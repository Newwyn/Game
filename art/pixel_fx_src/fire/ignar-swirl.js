import { TAU, tileFbm, cycle, clamp } from "../../core/index.js";
import { IGNAR, ramp7, heatColor, streak, speck } from "./_ignar.js";

export const meta = {
  name: "Ignar fire swirl",
  desc: "A large spinning fire orb flying right: a white-hot core wound in three spiral flame arms that whip round and stream back into a ragged tail, embers flung off its rim.",
  tags: ["fire", "fireball", "spiral", "vortex", "projectile", "directional", "loop", "ignar"],
  size: [48, 40],
  origin: [32, 20],
  duration: 0.3,
  loop: true,
  fps: 20,
  bg: "dark",
  options: { palette: IGNAR, seed: 13, radius: 9.5, tail: 28 },
};

const D = meta.duration, ARMS = 3;

export function draw(p, t, o) {
  const C = ramp7(o.palette), S = o.seed, ph = t / D, R = o.radius, L = o.tail;
  // one third of a turn per loop: with three arms, the frame at t = D matches t = 0
  const spin = ph * (TAU / ARMS);
  p.shade(-31, -19, 15, 19, (x, y, out) => {
    const n = tileFbm(x * 0.22 + ph * 3, y * 0.3, 3, 0, S, 2);
    const d = Math.hypot(x, y), a = Math.atan2(y, x);
    // the orb: a ball whose heat follows spiral arms (angle wound by distance), rotating clockwise on screen
    const arm = Math.cos(ARMS * (a + spin - d * 0.32));
    const rr = R * (1 + 0.12 * arm) + 1.1 * n;
    let h = 0;
    if (d < rr + 4) {
      const body = 1 - d / rr;
      const m = clamp(d / R, 0, 1);
      h = body * 1.05 + 0.42 * arm * m * (1 - m * 0.4) - 0.06;
      // arm tips flick past the rim: thick at the root, reaching further on the trailing side
      const reach = x > 0 ? 0.22 : 0.1;
      if (d >= rr) h = arm > 0.15 ? (arm - 0.15) * 0.75 - (d - rr) * reach : 0;
    }
    // the tail: the arms are swept back into ragged streamers
    if (x < 2) {
      const u = (-x + 2) / L;
      if (u <= 1) {
        const half = R * 0.95 * Math.pow(1 - u, 0.9) + n * 3 * u;
        // streamers: bands that wave and slide back
        const band = Math.cos((y / Math.max(1, half)) * 3.4 + Math.sin(u * 5 - ph * TAU) * 1.2 + u * 2);
        const th = (1 - Math.abs(y) / Math.max(0.5, half)) * (0.6 - 0.45 * u) + 0.32 * band * Math.min(1, u * 2.5) - 0.12 * u;
        h = Math.max(h, th);
      }
    }
    if (h <= 0) return;
    h += 0.15 * n;
    const c = heatColor(C, h, [0.03, 0.14, 0.3, 0.48, 0.66, 0.84]);
    if (!c) return;
    out.c = c;
    out.k = h > 0.5 ? 0.12 : 0;
  });
  // embers flung off the rim, tangent to the spin, left behind as the orb flies on
  cycle(t, D, 9, S + 30, (r) => r.range(0.15, 0.28), (age, life, r) => {
    const a0 = r.range(0, TAU), k = 1 - age / life, sp = r.range(50, 90);
    // tangential (clockwise on screen) plus drift back
    const vx = -Math.sin(a0) * -sp - 70, vy = Math.cos(a0) * sp;
    const x = Math.cos(a0) * (R + 1) + vx * age, y = Math.sin(a0) * (R + 1) + vy * age;
    if (x < -30 || x > 14 || Math.abs(y) > 18) return;
    if (r.chance(0.6)) streak(p, x, y, vx, vy, k, C, 3);
    else speck(p, x, y, k, C);
  });
  // light
  p.glowLine(-4, 0, -24, 0, 10, C[4], 0.16);
  p.glow(0, 0, 24, C[4], 0.35);
  p.glow(0, 0, 8, C[6], 0.45);
}
