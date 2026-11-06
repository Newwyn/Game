// The fire guardian (the same body as fire/ignar-guard, from ./_guard.js) throws: it coils, drawing its open hand
// back to the shoulder while fire gathers in the palm, then snaps forward with its whole upper body into a palm
// thrust to the right, a white flash and a burst of flame and sparks at the palm, then eases part of the way back.
// The body dissolves over the last few frames so the one-shot ends empty. Faces right; the anchor is the floor.
import { fit, clamp, seg, ease, mix, WHITE, TAU } from "../../core/index.js";
import { hotFirst, looped, lick } from "./_lib.js";
import { drawGuard, poseAt, K, NEAR_REST } from "./_guard.js";

export const meta = {
  name: "Ignar guard throw",
  desc: "The fire guardian winds up, drawing its palm back as fire gathers in it, then thrusts the open palm forward with a white flash and a burst of flame, and recovers.",
  tags: ["fire", "spirit", "elemental", "summon", "guardian", "creature", "attack", "throw", "palm"],
  size: [72, 104],
  origin: [36, 101],
  duration: 0.5,
  loop: false,
  fps: 20,
  bg: "dark",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#f05a10", "#ff7a18", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    seed: 9,
  },
};

// the beats: wind-up held, the thrust lands, recovery, gone
const COIL = 0.15, HIT = 0.25, HOLD = 0.32, BACK = 0.42, END = meta.duration, FADE = END - 0.06;

const START = { near: { ...NEAR_REST, open: 0 } };
// coiled: the upper body pulled back, chin down, the open hand drawn back beside the shoulder, the far arm forward
const WIND = {
  lean: -3.5, hx: -0.6, hy: 0.6, tilt: -0.14, flare: 1.1,
  near: { e: [-1.5, -33], w: [1, -29.2], h: [3, -28.6], open: 1 },
  far: { e: [-10, -38], w: [-12.5, -44], h: [-12.5, -46] },
};
// the thrust: the whole upper body thrown forward, the arm straight out, the palm flat to the right
const THRUST = {
  lean: 4, hx: 1, hy: 0, tilt: 0.04, flare: 1.15,
  near: { e: [14, -39.4], w: [17.6, -38.6], h: [19.6, -38.2], open: 1, fd: [0.25, -1] },
  far: { e: [-8.5, -34.5], w: [-12, -30.5], h: [-13, -29] },
};
// part of the way back: still leaning in, the palm still open
const RECOVER = {
  lean: 1.6, hx: 0.4, tilt: 0, flare: 1,
  near: { e: [11.5, -34], w: [15.8, -36.2], h: [17.4, -36.8], open: 1, fd: [0.6, -1] },
};
const KEYS = [
  [0.02, START],
  [COIL, WIND, ease.outCubic],
  [HIT - 0.04, WIND],
  [HIT, THRUST, ease.outQuart],
  [HOLD, THRUST],
  [BACK, RECOVER, ease.inOutSine],
];

export function draw(p, t, o) {
  if (t >= END) return;
  const H = hotFirst(fit(o.palette, 9)), S = o.seed;
  const G = poseAt(KEYS, t);
  G.fade = 1 - seg(t, FADE, END);
  drawGuard(p, t, o, H, G, { back: (p, I) => palmFlash(p, t, H, S, I), front: (p, I) => palmFire(p, t, H, S, I) });
}

// keep the palm's fire inside the canvas (72 x 104 about the anchor, with a margin)
const IN = (x, y) => x >= -35 && x <= 34.5 && y >= -100 && y <= 1;
const px = (p, x, y, c) => IN(x, y) && p.px(x, y, c);

// the palm's centre in px, the forearm's direction and the point of the blast (on the palm's face)
function palm(I) {
  const { G, B } = I, [hx, hy] = G.near.h, [wx, wy] = G.near.w;
  const dl = Math.hypot(hx - wx, hy - wy) || 1, ux = (hx - wx) / dl, uy = (hy - wy) / dl;
  const PX = hx * K, PY = hy * K + B;
  return { PX, PY, ux, uy, fx: Math.min(29.5, PX), fy: PY - 2.5 };
}

// behind the body, so the hand stands out dark-rimmed against it: the flash, its rays and a ring of heat
function palmFlash(p, t, H, S, I) {
  const a = t - (HIT - 0.01);
  if (a < 0 || a > 0.22) return;
  const { fx, fy } = palm(I);
  // the hero frames: a tall blade of white light on the palm's face (a white core, a gold rim), shrinking fast
  const sh = 1 - ease.outQuad(clamp(a / 0.11)), rx = Math.min(33.8 - fx - 1.2, 5) * (0.4 + 0.6 * sh), ry = 13 * sh;
  if (ry > 1) {
    p.shade(fx - rx - 1.5, fy - ry - 1.5, fx + rx + 1.5, fy + ry + 1.5, (x, y) => {
      const d = Math.hypot((x - fx) / Math.max(0.8, rx), (y - fy) / ry);
      if (d > 1.25) return;
      return d > 1 ? H[3] : d > 0.7 ? H[1] : H[0];
    });
  }
  // a ring of flame flung outward, thinning and cooling: its top and bottom arcs (not back through the arm)
  const rr = 4 + 12 * ease.outQuart(clamp(a / 0.16)), rw = 2.4 * (1 - clamp(a / 0.16));
  if (rw > 0.3) {
    const cRing = a < 0.06 ? H[1] : a < 0.11 ? H[3] : H[5];
    for (let s = 0; s < 64; s++) {
      const an = (s / 64) * TAU, cx = Math.cos(an), cy = Math.sin(an);
      if (cx < -0.55 || Math.abs(cy) < 0.5) continue;
      for (let w = 0; w < rw; w += 0.7) px(p, fx + cx * (rr - w), fy + cy * (rr - w) * 0.9, w < 0.7 ? H[5] : cRing);
    }
  }
  // rays: thin lines of light shooting out, longest up and down along the blast's face (the canvas ends ahead)
  if (a < 0.1) {
    const kr = 1 - a / 0.1;
    for (let i = 0; i < 9; i++) {
      const an = -1.35 + (i / 8) * 2.7 + Math.sin(i * 7.1 + S) * 0.08;
      const L = (3 + 9 * Math.sin(an) * Math.sin(an)) * (0.5 + 0.5 * kr) * (1 + 0.6 * clamp(a / 0.04));
      const r0 = 4 + 8 * (1 - kr);
      for (let s = r0; s < r0 + L; s += 0.6) {
        const u = (s - r0) / L;
        if (fx + Math.cos(an) * s > 33.5) break;
        px(p, fx + Math.cos(an) * s, fy + Math.sin(an) * s, u < 0.3 ? H[0] : u < 0.65 ? H[2] : H[4]);
      }
    }
  }
}

// in front: fire gathering in the palm through the wind-up, then flame, sparks and light off the thrust
function palmFire(p, t, H, S, I) {
  const { PX, PY, fx, fy } = palm(I);
  // a ball of fire in the cupped palm that swells, pulses and drips flame
  const g = seg(t, 0.06, COIL) * (1 - seg(t, HIT - 0.01, HIT + 0.01));
  if (g > 0) {
    const r = 1.2 + 2 * g + 0.4 * Math.sin(t * TAU * 12), bx = PX + 0.5, by = PY - 3.2 - r * 0.5;
    p.circle(bx, by, r + 2, H[8]);
    p.circle(bx, by, r + 1, H[6]);
    p.circle(bx, by, r, H[3]);
    p.circle(bx - 0.3, by - 0.3, r * 0.6, H[1]);
    if (r > 2.2) p.px(bx, by, H[0]);
    p.glow(bx, by, 8 + 6 * g, H[2], 0.35 * g);
    looped(t, 0.1, 3, S + 900, (r) => ({ vx: r.range(-10, 6), vy: -r.range(30, 50), life: r.range(0.06, 0.1) }), (q, age) => {
      lick(p, bx + q.vx * age, by - r + q.vy * age, 1 - age / q.life, 0.9 * g + 0.3, H);
    });
  }
  const a = t - (HIT - 0.01);
  if (a < 0 || a > 0.22) return;
  const k = 1 - a / 0.22;
  // flame bursting off the palm, up and down along the hand: tongues that cool as they fly
  looped(a, 1, 10, S + 300, (r, i) => ({ an: (i % 2 ? 1 : -1) * r.range(0.9, 2.1), sp: r.range(70, 140), s: r.range(1.4, 2.6), life: r.range(0.12, 0.2) }), (q, age) => {
    if (age > a) return;
    const x = fx + Math.cos(q.an) * q.sp * age, y = fy + Math.sin(q.an) * q.sp * age - 60 * age * age;
    if (!IN(x - 3, y - 3) || !IN(x + 3, y + 3)) return;
    lick(p, x, y, 1 - age / q.life, q.s, H);
  });
  // sparks: hot streaks flung forward and out, falling a little
  looped(a, 1, 14, S + 400, (r) => ({ an: r.range(-1.5, 1.5), sp: r.range(120, 260), life: r.range(0.1, 0.2) }), (q, age) => {
    if (age > a) return;
    const kk = 1 - age / q.life, vx = Math.cos(q.an) * q.sp, vy = Math.sin(q.an) * q.sp + 400 * age;
    const x = fx + Math.cos(q.an) * q.sp * age, y = fy + Math.sin(q.an) * q.sp * age + 200 * age * age;
    const sp = Math.hypot(vx, vy), L = 2 + 3 * kk;
    if (!IN(x, y) || !IN(x - (vx / sp) * L, y - (vy / sp) * L)) return;
    p.line(x - (vx / sp) * L, y - (vy / sp) * L, x, y, kk > 0.5 ? H[3] : H[5]);
    px(p, x, y, kk > 0.6 ? H[0] : H[2]);
    p.glow(x, y, 3, H[3], 0.4 * kk);
  });
  // light: a hard flare at the moment of the thrust, falling off fast
  p.glow(fx - 3, fy, 14, mix(H[2], WHITE, 0.3), 0.55 * k * k);
  p.glow(fx, fy, 6, WHITE, 0.6 * k * k * k);
}
