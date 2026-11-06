// A charging beast's heel-kick: dust puffs rolled out behind it, clods, pebbles and a torn leaf thrown back.
import { Particles, Bits, P, B, Rng, fit, clamp, smooth, ease, TAU, hex, mix } from "../../core/index.js";
import { stoneShape, drawRock, drawLeaf } from "./_lib.js";

export const meta = {
  name: "Sylva bear dust",
  desc: "A beast charges off to the right: brown dust rolls out behind its heels and streams left, clods, pebbles and a torn leaf are flung back, and it all thins away.",
  tags: ["nature", "earth", "dust", "run", "dash", "kick", "ground", "directional", "one-shot"],
  size: [64, 40],
  origin: [52, 34],
  duration: 0.42,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#3b2414", "#6b4423", "#92400e", "#c08a5a", "#e2c9a0"],
    moss: ["#0f2e1a", "#166534", "#22c55e", "#4ade80"],
    seed: 3,
  },
};

const END = 0.42;

export function create(o) {
  const D = fit(o.palette, 5), M = fit(o.moss, 4), R = new Rng(o.seed), floor = () => 0;
  const STONE = [D[0], D[0], hex("#4a2e19"), D[1], mix(D[1], D[2], 0.5), D[2], D[3], D[4]];
  const ps = new Particles({ rng: R, ground: floor }), bits = new Bits({ ground: floor });
  // the puffs: kicked from under the heels, thrown back and up, dragging to a stop as they swell and thin
  const puffs = [];
  const kicks = [0, 0.04, 0.08, 0.12];
  kicks.forEach((t0, j) => {
    const n = j === 0 ? 4 : 3;
    for (let i = 0; i < n; i++)
      puffs.push({
        t0: t0 + R.range(0, 0.03), x: R.range(-3, 3) - j * 2, y: -R.range(1, 3),
        vx: -R.range(110, 330) * (1 - j * 0.15), vy: -R.range(6, 34), r0: R.range(1.6, 2.6), r1: R.range(4.5, 8) * (1 - j * 0.1),
        life: 0, seed: R.next(),
      });
  });
  for (const q of puffs) q.life = Math.min(R.range(0.26, 0.36), END - 0.02 - q.t0);
  let t = 0, thrown = false;
  const leaf = { x: 0, y: -3, vx: -150, vy: -95, a: 0.6, va: -16, fl: 0 };
  return {
    update(dt) {
      t += dt;
      if (!thrown) {
        thrown = true;
        // clods and grit, a couple of pebbles, the odd fleck of moss
        for (let i = 0; i < 16; i++) {
          const a = Math.PI + R.range(0.15, 0.95), sp = R.range(70, 190);
          ps.spawn(P.GRIT, R.range(-2, 3), -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.22, 0.38), R.pick([D[1], D[1], D[2], D[3], D[0], D[3]]), R.chance(0.4) ? 2 : 1, R.range(0, 0.08));
        }
        for (let i = 0; i < 3; i++) {
          const a = Math.PI + R.range(0.2, 0.6), sp = R.range(110, 170);
          ps.spawn(P.GRIT, R.range(-1, 2), -2, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.2, 0.3), M[3], 1, R.range(0.02, 0.07));
        }
        for (let i = 0; i < 3; i++) {
          const a = Math.PI + R.range(0.25, 0.7), sp = R.range(110, 160);
          bits.add({ kind: B.CHUNK, x: R.range(-2, 2), y: -2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 1, drag: 0.6, bounce: 0.35, life: R.range(0.3, 0.38) - i * 0.02, a: R.range(0, TAU), va: R.range(-18, 18), s: R.range(2, 3), pts: stoneShape(R) });
        }
      }
      // the leaf flutters: drag, light gravity, a sideways sway
      leaf.vy += 420 * dt;
      leaf.vx -= leaf.vx * 2.2 * dt;
      leaf.vy -= leaf.vy * 2.6 * dt;
      leaf.x += leaf.vx * dt;
      leaf.y = Math.min(-1, leaf.y + leaf.vy * dt);
      leaf.a += leaf.va * dt;
      leaf.fl = 0.85 * Math.sin(t * 15);
      ps.update(dt);
      bits.update(dt);
    },
    drawBack(p) {
      // skid marks scraped into the floor under the heels, fading
      const sk = 1 - smooth(0.12, 0.34, t);
      if (sk > 0) {
        const L = ease.outCubic(clamp(t / 0.08)) * 14;
        p.line(-L, 0, 2, 0, (u) => (u > 0.7 ? D[0] : D[1]), (u) => sk * (0.3 + 0.7 * u));
        p.line(-L * 0.6, 1, 1, 1, D[0], (u) => sk * 0.6 * u);
      }
      // the heel strike: a squashed puff of loose earth right under the foot
      if (t < 0.1) {
        const k = t / 0.1;
        p.disc(-1 - k * 4, -1.5 - k, 3 + k * 3, D[1], 0.6 * (1 - k));
        p.disc(-2 - k * 4, -2.5 - k, 1.8 + k * 2, D[3], 0.6 * (1 - k));
      }
      // the dust: a dark settled belly, the body, a lit cap upper left, a pale rim while it's fresh
      for (const q of puffs) {
        const age = t - q.t0;
        if (age < 0 || age > q.life) continue;
        const k = age / q.life, dr = 5.5;
        const ex = (1 - Math.exp(-dr * age)) / dr;
        const x = q.x + q.vx * ex, y = Math.min(-q.r0 * 0.5, q.y + q.vy * ex - 50 * age * age);
        const r = q.r0 + (q.r1 - q.r0) * ease.outCubic(k);
        const a = Math.min(1, 0.35 + age * 50) * Math.pow(1 - k, 1.2);
        const yy = Math.min(y, -r * 0.45);
        p.disc(x + r * 0.15, yy + r * 0.2, r, D[0], a * 0.35);
        p.disc(x, yy, r * 0.85, k < 0.45 ? D[2] : D[1], a * 0.55);
        p.disc(x - r * 0.25, yy - r * 0.3, r * 0.55, D[3], a * 0.55);
        if (k < 0.5) p.disc(x - r * 0.35, yy - r * 0.45, r * 0.28, D[4], a * 0.6 * (1 - k * 2));
      }
    },
    draw(p) {
      for (const b of bits.list) drawRock(p, b.x, b.y - b.s * 0.7, b.s, b.a, b.pts, STONE, Math.min(1, b.life / 0.12));
      ps.draw(p, "front");
      const la = 1 - smooth(0.28, END - 0.02, t);
      if (la > 0 && t < END - 0.02) {
        drawLeaf(p, leaf.x, leaf.y, 6, 1.8, leaf.a, leaf.fl, M, la);
        // a bite torn out of it: a notch of nothing on its edge
        p.glow(leaf.x, leaf.y, 4, M[3], 0.15 * la);
      }
    },
  };
}
