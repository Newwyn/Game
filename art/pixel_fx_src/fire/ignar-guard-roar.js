// The fire guardian (the same body as fire/ignar-guard, from ./_guard.js) roars: it hunches, fists drawn in, then
// throws its head back with its jaw open, flings both arms up and wide with clawed open hands, and its flames flare
// up off its shoulders and crest while waves of heat roll out of its mouth; then it settles. The body dissolves
// over the last few frames so the one-shot ends empty. Faces right; the anchor is the floor under it.
import { fit, seg, ease, bump, mix, WHITE, TAU } from "../../core/index.js";
import { hotFirst, looped, ember, lick } from "./_lib.js";
import { drawGuard, poseAt, blade, headPt, K, NEAR_REST, CREST, CREST_B } from "./_guard.js";

export const meta = {
  name: "Ignar guard roar",
  desc: "The fire guardian hunches, then throws its head back and roars, arms flung up and wide, its flames flaring up while waves of heat roll from its open jaw.",
  tags: ["fire", "spirit", "elemental", "summon", "guardian", "creature", "roar", "taunt", "buff"],
  size: [72, 104],
  origin: [36, 101],
  duration: 0.6,
  loop: false,
  fps: 20,
  bg: "dark",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#f05a10", "#ff7a18", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    seed: 9,
  },
};

// the beats: hunch, the roar bursts out, held, settles, gone
const HUNCH = 0.12, ROAR = 0.18, HELD = 0.42, SETTLE = 0.53, END = meta.duration, FADE = END - 0.06;

const START = { near: { ...NEAR_REST } };
// hunched: head down, shoulders forward, fists drawn in to the chest
const CROUCH = {
  lean: 1.2, hx: 0.3, hy: 1.2, tilt: -0.22, flare: 0.9,
  near: { e: [8.5, -31], w: [10.5, -35.5], h: [11, -37.5] },
  far: { e: [-8.5, -33], w: [-6.5, -37], h: [-6, -38.5] },
};
// the roar: head thrown back, jaw wide, both arms flung up and out, hands open like claws
const ROARING = {
  lean: -1.6, hx: -1, hy: -1.2, tilt: 0.45, mouth: 1, flare: 1.32,
  near: { e: [12.5, -41], w: [17, -45.5], h: [18.3, -47.6], open: 1, fd: [0.5, -1] },
  far: { e: [-11.5, -43], w: [-15.5, -48], h: [-16.4, -50.4], open: 1, fd: [-0.55, -1] },
};
const ROARING2 = {
  ...ROARING, tilt: 0.4, hy: -1, flare: 1.28,
  near: { e: [12.8, -41.6], w: [17.2, -46.4], h: [18.4, -48.6], open: 1, fd: [0.6, -1] },
  far: { e: [-11.8, -43.6], w: [-15.8, -48.8], h: [-16.6, -51.2], open: 1, fd: [-0.65, -1] },
};
// settling: arms coming down, head level, the jaw closing
const SETTLED = {
  lean: 0, hx: -0.3, hy: -0.3, tilt: 0.1, mouth: 0.25, flare: 1.08,
  near: { e: [11, -36], w: [15, -40], h: [16, -41.5], open: 1 },
  far: { e: [-10.5, -38], w: [-13.5, -34], h: [-14, -32] },
};
const KEYS = [
  [0.02, START],
  [HUNCH, CROUCH, ease.inOutSine],
  [ROAR, ROARING, ease.outQuart],
  [HELD, ROARING2, ease.inOutSine],
  [SETTLE, SETTLED, ease.inOutSine],
];

export function draw(p, t, o) {
  if (t >= END) return;
  const H = hotFirst(fit(o.palette, 9)), S = o.seed;
  const G = poseAt(KEYS, t);
  // the roar shakes it: a fast tremor through the upper body while it's held
  const shake = bump(t, ROAR - 0.02, SETTLE);
  G.lean += Math.sin(t * TAU * 22) * 0.45 * shake;
  G.hy += Math.sin(t * TAU * 17 + 1) * 0.3 * shake;
  G.fade = 1 - seg(t, FADE, END);
  const F = seg(t, ROAR - 0.03, ROAR + 0.03) * (1 - seg(t, HELD, SETTLE + 0.04)); // how hard the flames flare
  drawGuard(p, t, o, H, G, { back: (p, I) => flaresBack(p, t, H, S, I, F), front: (p, I) => roarFront(p, t, H, S, I, F) });
}

// flames flaring up behind it: tall tongues off the shoulders and the back, roaring upward
function flaresBack(p, t, H, S, I, F) {
  if (F <= 0.02) return;
  const { G, N, Y, X } = I;
  for (let i = 0; i < 4; i++) {
    const x = X(-8.5 + i * 4.2 + G.lean), y = Y(-41.5 + Math.abs(i - 1.5) * 0.8);
    const len = (12 + 9 * Math.sin(t * TAU * 6 + i * 1.9) * 0.5 + 6 * (1 - Math.abs(i - 1.5) / 1.5)) * F + N(8, S + 70 + i) * 2;
    blade(p, x, y, -0.3 + (i - 1.5) * 0.12, -1, Math.min(len, 50 + y), 3 + F, -2 + N(4, S + 80 + i) * 2, N, S * 31 + i, H, CREST, 0.5, 1.2);
  }
  // a hot pool of light behind the head and shoulders
  p.glow(X(G.lean - 4), Y(-40), 26, mix(H[3], WHITE, 0.1), 0.12 * F);
}

// in front: waves of heat rolling out of the open jaw, licks and embers thrown up by the roar, the light
function roarFront(p, t, H, S, I, F) {
  const { G, B } = I;
  const [mx, my0] = headPt(G, 7, 3.4), my = my0 + B; // the mouth's corner
  if (F > 0.02 && G.mouth > 0.4) {
    // three arcs rolling out to the right, growing and cooling (clipped at the canvas edge)
    for (let w = 0; w < 2; w++) {
      const age = (t - ROAR + 0.02 + w * 0.09) % 0.18;
      if (age < 0 || t - ROAR + 0.02 < w * -0.09) continue;
      const k = age / 0.18, r = 6 + 10 * k, c = k < 0.35 ? H[1] : k < 0.7 ? H[3] : H[5];
      for (let a = -0.75; a <= 0.75; a += 0.08) {
        const x = mx + Math.cos(a) * r, y = my + Math.sin(a) * r * 1.1;
        if (x < 34 && y > -100) p.px(x, y, c);
      }
    }
    p.glow(mx + 5, my, 7, H[2], 0.12 * F);
  }
  // licks flung up off the hands and shoulders
  looped(t, 0.3, 10, S + 500, (r, i) => ({ hand: i % 2, vx: r.range(-12, 12), vy: -r.range(40, 70), s: r.range(1, 1.8), life: r.range(0.14, 0.24) }), (q, age) => {
    const A = q.hand ? G.near : G.far, hx = A.h[0] * K, hy = A.h[1] * K + B - 4;
    const k = 1 - age / q.life, x = hx + q.vx * age, y = hy + q.vy * age;
    if (F < 0.2 || y < -96 || x > 32 || x < -32) return;
    lick(p, x, y, k, q.s * F, H);
  });
  // embers thrown up by the roar
  looped(t, 0.4, 16, S + 600, (r) => ({ x: r.range(-20, 22), y: r.range(-70, -40), vx: r.range(-20, 20), vy: -r.range(50, 90), life: r.range(0.25, 0.4), s: r.chance(0.25) ? 2 : 1, a: r.range(0, TAU) }), (q, age) => {
    const x = q.x + q.vx * age, y = q.y + B + q.vy * age;
    if (F < 0.15 || y < -97 || x < -33 || x > 33) return;
    ember(p, x, y, (1 - age / q.life) * F, q.s, [H[1], H[2], H[4], H[6]], age * 40 + q.a);
  });
}
