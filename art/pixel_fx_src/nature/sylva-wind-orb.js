import { fit, cycle, rng, TAU, WHITE } from "../../core/index.js";
import { drawLeaf } from "./_lib.js";

export const meta = {
  name: "Sylva wind orb",
  desc: "A spinning orb of golden-green wind flying right: streaks swirl round a bright mint core, two leaves tumble inside it, wisps peel off behind.",
  tags: ["nature", "wind", "projectile", "orb", "spirit", "directional", "loop"],
  size: [32, 32],
  origin: [20, 16],
  duration: 0.3,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0f2e1a", "#166534", "#22c55e", "#4ade80", "#bbf7d0", "#f0fdf4"],
    gold: ["#facc15", "#fde68a"],
    leaves: ["#0f2e1a", "#166534", "#22c55e", "#86efac"],
    seed: 4,
  },
};

const R = 7.5;

export function draw(p, t, o) {
  const C = fit(o.palette, 6), G = fit(o.gold, 2), L = fit(o.leaves, 4), S = o.seed, D = meta.duration, ph = t / D;
  const spin = -TAU * ph; // one whole turn per loop, counter-clockwise: the top rolls back against the flight

  // the trail: wisps peeling off the orb's top and bottom and streaming back, cooling and thinning
  cycle(t, D, 9, S + 3, (g) => g.range(0.14, 0.24), (age, life, r) => {
    const k = age / life, side = r.chance(0.5) ? -1 : 1, y0 = side * r.range(3, 7), x0 = -3 - age * r.range(70, 100);
    const len = r.range(4, 8) * (0.6 + k), y = y0 + side * k * 1.5;
    if (x0 - len < -19) return;
    const c = k < 0.35 ? (r.chance(0.4) ? G[1] : C[4]) : k < 0.7 ? C[3] : C[2];
    for (let i = 0; i <= len; i++) { const u = i / len; p.blend(x0 - i, y, c, (1 - k * 0.7) * (u < 0.5 ? 1 : (1 - u) * 2)); }
  });
  p.glowLine(-2, 0, -16, 0, 7, C[3], 0.3);

  // a dim body of air so the orb has a volume, lit up and to the left
  p.disc(0, 0, R + 0.5, C[1], 0.35);
  p.disc(-1.5, -1.5, R - 3, C[2], 0.2);

  // swirling streaks: arcs at different radii chasing round, white-gold at the head, green behind
  for (let j = 0; j < 4; j++) {
    const g = rng(S, j), r0 = R + 0.5 - (j % 2) * 1.5, head = (j * TAU) / 4 + g.range(-0.3, 0.3) + spin * (j < 2 ? 1 : 2), span = g.range(2.2, 3), gold = j === 0 || j === 3;
    for (let s = 0; s <= span; s += 0.5 / r0) {
      const th = head + s, k = s / span, rr = r0 - k * 4.2, wob = 1;
      const x = Math.cos(th) * rr * wob, y = Math.sin(th) * rr * wob * 0.9;
      const c = k < 0.12 ? (gold ? G[1] : C[5]) : k < 0.4 ? (gold ? G[0] : C[4]) : k < 0.75 ? C[3] : C[2];
      p.px(x, y, c);
    }
    p.light(Math.cos(head) * r0, Math.sin(head) * r0 * 0.9, gold ? G[0] : C[4], 0.35);
  }

  // two leaves caught in the swirl, tumbling round on opposite sides
  for (let j = 0; j < 2; j++) {
    const a = spin + j * Math.PI + 0.6, rr = 5.5, x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.85;
    drawLeaf(p, x, y, 6, 2.2, a + Math.PI / 2 + ph * TAU * 2, ph * TAU * (j ? 2 : 1), L);
  }

  // the core: a mint ball, white at its heart, a lit rim on the upper left
  p.circle(0, 0, 2.6, C[4]);
  p.circle(-0.5, -0.5, 1.6, C[5]);
  p.px(-1, -1, WHITE);
  p.px(0, -1, WHITE);
  p.glow(0, 0, 15, C[3], 0.3);
  p.glow(0, 0, 3.5, C[5], 0.35);

}
