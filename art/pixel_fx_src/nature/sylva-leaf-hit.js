// Sylva's leaf dart landing: a mint star flashes, a thin ring snaps out, torn leaf scraps spin away on a
// gust and green and gold sparks scatter and fade. Original design for Legend of Capsules.
import { drawLeaf } from "./_lib.js";
import { Particles, Lights, P, Rng, fit, hex, clamp, ease, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Sylva leaf hit",
  desc: "A leaf blade strikes: a bright mint star flash and a snapping ring, then torn leaf scraps tumble outward with green and gold sparks, fading to nothing.",
  tags: ["nature", "impact", "hit", "leaf", "magic", "one-shot"],
  size: [32, 32],
  origin: [16, 14],
  duration: 0.4,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0f2e1a", "#166534", "#22c55e", "#4ade80", "#bbf7d0", "#f0fdf4"],
    gold: ["#a16207", "#facc15", "#fde68a"],
    seed: 11,
  },
};

const FLASH = 0.1;

// a 4-point star: long arms left/right/up/down, short diagonal nubs, a white heart
function star(p, L, C) {
  const n = Math.round(L);
  if (n < 1) return;
  for (let d = 1; d <= n; d++) {
    const c = d <= n * 0.4 ? WHITE : d <= n * 0.75 ? C[4] : C[3];
    p.px(d, 0, c), p.px(-d, 0, c), p.px(0, d, c), p.px(0, -d, c);
  }
  const m = Math.max(1, Math.round(n * 0.35));
  for (let d = 1; d <= m; d++) {
    const c = d === 1 ? C[5] : C[4];
    p.px(d, d, c), p.px(-d, d, c), p.px(d, -d, c), p.px(-d, -d, c);
  }
  if (n >= 3) p.circle(0, 0, 1.2, WHITE);
  p.px(0, 0, WHITE);
}

export function create(o) {
  const C = fit(o.palette, 6).map(hex), G = fit(o.gold, 3).map(hex), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, sparks: [WHITE, C[4], C[3], C[2]] }), lights = new Lights();
  lights.add(0, 0, 14, C[3], 0.45, 0.22);
  lights.add(0, 0, 5, WHITE, 0.5, 0.06);

  // torn leaf scraps: little two-tone slivers flung out in a ring, spinning, slowing on the air, dropping a little
  const scraps = [];
  const N = 8, a0 = R.range(0, TAU);
  for (let i = 0; i < N; i++) {
    const a = a0 + (i / N) * TAU + R.range(-0.25, 0.25), sp = R.range(48, 70);
    scraps.push({ x: Math.cos(a) * 4, y: Math.sin(a) * 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 15, rot: R.range(0, TAU), vr: R.range(14, 26) * R.sign(), len: R.range(4, 5.5), life: R.range(0.3, 0.38), gold: i % 4 === 1 });
  }
  // sparks: fast short streaks, and a few golden twinkles that hang
  for (let i = 0; i < 7; i++) {
    const a = R.range(0, TAU), sp = R.range(70, 120);
    ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.08, 0.15));
  }
  for (let i = 0; i < 5; i++) {
    const a = R.range(0, TAU), d = R.range(4, 9);
    ps.spawn(P.STAR, Math.cos(a) * d, Math.sin(a) * d, Math.cos(a) * 12, Math.sin(a) * 12 - 4, R.range(0.18, 0.28), i % 2 ? G[2] : G[1], R.range(0.8, 1.6), R.range(0.03, 0.1));
  }

  let t = 0;
  return {
    update(dt) {
      t += dt;
      for (const s of scraps) {
        const drag = 7;
        s.vx -= s.vx * drag * dt;
        s.vy += (40 - s.vy * drag) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += s.vr * dt * Math.max(0.3, 1 - t * 2);
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      // flash: a white burst on the first frames, the star shrinking back fast
      if (t < 0.04) p.circle(0, 0, 3, C[5]);
      if (t < FLASH) {
        const e = t / FLASH;
        star(p, 8 * (1 - ease.inQuad(e)) + 1, C);
        p.glow(0, 0, 7, C[4], 0.4 * (1 - e));
      }
      // the ring: snaps out whole, then breaks into six arcs that shorten and vanish
      if (t < 0.2) {
        const e = t / 0.2, r = 3 + 9 * ease.outCubic(e), c = e < 0.3 ? C[4] : C[3];
        if (e < 0.25) p.ring(0, 0, r, 1.2, c);
        else for (let i = 0; i < 6; i++) {
          const m = (i / 6) * TAU + 0.3, h = (TAU / 12) * (1 - (e - 0.25) / 0.75);
          p.arc(0, 0, r, 1, m - h, m + h, c);
        }
      }
      ps.draw(p);
      // scraps
      for (const s of scraps) {
        const k = t / s.life;
        if (k >= 1 || t < 0.035) continue;
        const a = 1, ca = Math.cos(s.rot), sa = Math.sin(s.rot), flip = Math.sin(s.rot * 1.3) > 0;
        const pal = s.gold ? [C[0], G[0], G[1], G[2]] : flip ? [C[0], C[1], C[3], C[4]] : [C[0], C[1], C[2], C[3]], lit = pal[3];
        const fade = k > 0.6 ? (k > 0.82 ? [C[0], C[0], C[1], C[1]] : [C[0], C[0], C[1], C[2]]) : pal;
        drawLeaf(p, s.x, s.y, s.len * (1 - 0.55 * k), k > 0.7 ? 1 : 1.6, s.rot, s.rot * 1.3, fade, a);
        if (k < 0.5) p.glow(s.x, s.y, 3, lit, 0.25 * (1 - k));
      }
      lights.draw(p);
    },
  };
}
