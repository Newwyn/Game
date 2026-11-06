// A heavy beast's ram landing: a golden-white burst, a shock ring, earth, stones and moss thrown out, a ring of dust.
import { Particles, Bits, Lights, P, B, Rng, fit, clamp, smooth, ease, TAU, WHITE, hex, mix } from "../../core/index.js";
import { stoneShape, drawRock } from "./_lib.js";

export const meta = {
  name: "Sylva bear ram",
  desc: "A heavy ram lands to the right: a golden-white impact star and shock ring, then stones, clods and moss burst up and out over a rolling ring of dust, fall and settle.",
  tags: ["nature", "earth", "impact", "ram", "charge", "hit", "ground", "directional", "one-shot"],
  size: [84, 56],
  origin: [42, 46],
  duration: 0.5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#3b2414", "#6b4423", "#92400e", "#c08a5a", "#e2c9a0"],
    moss: ["#0f2e1a", "#166534", "#22c55e", "#4ade80"],
    gold: ["#92400e", "#facc15", "#fde68a", "#ffffff"],
    seed: 5,
  },
};

const END = 0.5, HY = -11; // the blow lands at head height of a big beast

// a ring lying flat on the floor: radius r across, r * sy deep, w px thick; c(near) picks near/far colour
function floorRing(p, r, sy, w, c, a) {
  const ry = r * sy;
  p.shade(-r - 1, -ry - 1, r + 1, ry + 1, (x, y, o) => {
    const d = Math.hypot(x / r, y / ry);
    const e = (d - 1) * r;
    if (e > 0 || e < -w) return;
    o.c = c(y > 0, -e / w);
    o.a = a;
  });
}

export function create(o) {
  const D = fit(o.palette, 5), M = fit(o.moss, 4), G = fit(o.gold, 4), R = new Rng(o.seed), floor = () => 0;
  const STONE = [D[0], D[0], hex("#4a2e19"), D[1], mix(D[1], D[2], 0.4), mix(D[2], D[3], 0.5), D[3], D[4]];
  const ps = new Particles({ rng: R, ground: floor, sparks: [G[3], G[2], G[1], G[0]] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  const life = (a, b) => Math.min(R.range(a, b), END - 0.02 - 0);
  // the dust ring: puffs thrown along the floor both ways, most to the front, swelling, rising, thinning
  const puffs = [];
  for (let i = 0; i < 14; i++) {
    const side = i < 9 ? 1 : -1, sp = R.range(30, 125), tall = R.chance(0.3);
    puffs.push({ t0: R.range(0.02, 0.08), x: R.range(-3, 3), y: -R.range(1, 3), vx: side * sp, vy: -R.range(4, 26) - (tall ? R.range(30, 60) : 0), r0: R.range(1.4, 2.8), r1: tall ? R.range(3.5, 5) : R.range(4, 8), life: 0 });
  }
  for (const q of puffs) q.life = Math.min(R.range(0.3, 0.42), END - 0.02 - q.t0);
  // the star's rays: eight, the long ones along the blow
  const rays = [];
  for (let i = 0; i < 8; i++) rays.push({ a: (i / 8) * TAU + R.range(-0.12, 0.12), L: (i % 2 ? 0.55 : 1) * R.range(0.85, 1.15) * (Math.abs(Math.cos((i / 8) * TAU)) > 0.9 ? 1.25 : 1) });
  let t = 0, hit = false;
  return {
    update(dt) {
      t += dt;
      if (!hit) {
        hit = true;
        lights.add(0, HY, 34, G[1], 0.4, 0.3);
        lights.add(0, HY, 18, WHITE, 0.7, 0.08);
        // stones: up and out, most of them thrown forward with the blow
        for (let i = 0; i < 6; i++) {
          const fwd = i < 4 ? 1 : -1, a = -Math.PI / 2 + fwd * R.range(0.2, 0.75), sp = R.range(150, 230);
          bits.add({ kind: B.CHUNK, x: R.range(-3, 4), y: -R.range(1, 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 1.2, drag: 1.3, bounce: 0.3, life: R.range(0.36, 0.46) - i * 0.01, a: R.range(0, TAU), va: R.range(-20, 20), s: i < 2 ? R.range(2.8, 3.4) : R.range(1.8, 2.6), pts: stoneShape(R) });
        }
        // clods and grit
        for (let i = 0; i < 26; i++) {
          const a = -Math.PI / 2 + R.range(-0.95, 0.95) + 0.1, sp = R.range(90, 200);
          ps.spawn(P.GRIT, R.range(-4, 4), -R.range(1, 8), Math.cos(a) * sp, Math.sin(a) * sp, life(0.3, 0.45), R.pick([D[0], D[1], D[1], D[2], D[3]]), R.chance(0.4) ? 2 : 1, R.range(0, 0.04));
        }
        // torn moss: green flecks, a couple of them big tufts
        for (let i = 0; i < 9; i++) {
          const a = -Math.PI / 2 + R.range(-0.9, 0.9) + 0.1, sp = R.range(100, 190);
          ps.spawn(P.GRIT, R.range(-3, 3), -R.range(2, 9), Math.cos(a) * sp, Math.sin(a) * sp, life(0.3, 0.44), R.pick([M[2], M[3], M[1]]), R.chance(0.45) ? 2 : 1, R.range(0, 0.03));
        }
        // gold sparks off the blow
        for (let i = 0; i < 10; i++) {
          const a = R.range(-Math.PI, 0.3) + (R.chance(0.6) ? 0.4 : 0), sp = R.range(120, 260);
          ps.spawn(P.SPARK, R.range(-2, 2), HY + R.range(-2, 2), Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.12, 0.26));
        }
      }
      ps.update(dt);
      bits.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // a dent kicked into the floor: dark scuff and a lit lip, closing up
      const dk = 1 - smooth(0.25, 0.46, t);
      if (dk > 0) {
        const w = 6 + ease.outCubic(clamp(t / 0.08)) * 8;
        p.ellipse(0, 1, w, 1.6, D[0], 0.7 * dk);
        p.line(-w + 1, 0, w - 1, 0, D[3], (u) => dk * 0.8 * Math.sin(u * Math.PI));
      }
      // the shock ring on the floor: a flat ellipse rushing out, gold at first, then just dust at its edge
      const sk = clamp(t / 0.22);
      if (sk < 1) {
        const r = 4 + ease.outCubic(sk) * 27, a = 1 - sk;
        floorRing(p, r, 0.22, Math.max(1, 2.4 * (1 - sk)), (near, v) => (sk < 0.3 ? (v < 0.5 ? G[2] : G[1]) : near ? D[3] : D[2]), a * 0.9);
      }
      for (const q of puffs) {
        const age = t - q.t0;
        if (age < 0 || age > q.life) continue;
        const k = age / q.life, dr = 6, ex = (1 - Math.exp(-dr * age)) / dr;
        const r = q.r0 + (q.r1 - q.r0) * ease.outCubic(k);
        const x = q.x + q.vx * ex, y = Math.min(-r * 0.5, q.y + q.vy * ex - 40 * age * age);
        const a = Math.min(1, 0.4 + age * 40) * Math.pow(1 - k, 1.25);
        p.disc(x + r * 0.15, y + r * 0.2, r, D[0], a * 0.35);
        p.disc(x, y, r * 0.85, k < 0.4 ? D[2] : D[1], a * 0.55);
        p.disc(x - r * 0.25, y - r * 0.3, r * 0.55, D[3], a * 0.55);
        if (k < 0.5) p.disc(x - r * 0.35, y - r * 0.45, r * 0.28, D[4], a * 0.6 * (1 - k * 2));
      }
      ps.draw(p, "back");
    },
    draw(p) {
      for (const b of bits.list) drawRock(p, b.x, b.y - b.s * 0.7, b.s, b.a, b.pts, STONE, Math.min(1, b.life / 0.1), t < 0.04);
      ps.draw(p, "front");
      // the impact star: a white hero frame, then a gold star with a white heart that shrinks and spins a little
      const k = clamp(t / 0.18);
      if (k < 1) {
        const s = (t < 0.035 ? 1.15 : 1 - ease.inQuad(k) * 0.9) * 13, rot = k * 0.35;
        const pts = (sc) => rays.flatMap((r, i) => {
          const a = r.a + rot, a2 = a + TAU / 16, L = s * r.L * sc;
          return [[Math.cos(a) * L, HY + Math.sin(a) * L], [Math.cos(a2) * s * 0.28 * sc, HY + Math.sin(a2) * s * 0.28 * sc]];
        });
        if (t < 0.035) p.poly(pts(1), WHITE);
        else {
          p.poly(pts(1), k < 0.5 ? G[1] : G[0]);
          p.poly(pts(0.66), G[2]);
          p.poly(pts(0.36), WHITE);
        }
        p.glow(0, HY, s * 1.4, G[1], 0.5 * (1 - k));
        // the shockwave in the air: a thin ring racing out from the star
        const rr = 7 + ease.outQuart(k) * 16, gap = -0.6 + k * 2.2;
        const seg = (v, ang) => (Math.sin(ang * 5 + 0.7) > gap && HY + Math.sin(ang) * rr < 0.5 ? 1 : 0);
        if (k < 0.65) p.ring(0, HY, rr, k < 0.2 ? 2 : 1, k < 0.15 ? WHITE : k < 0.35 ? G[2] : k < 0.5 ? G[1] : D[3], seg);
      }
      lights.draw(p);
    },
  };
}
