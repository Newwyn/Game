// One flame of Ignar's sea of fire: a small tuft of tongues burning on the floor, made to be tiled side by side
// with different seeds. Drawn from t alone with the shared fire helpers in ./_lib.js.
import { fit, rng, mix, TAU, WHITE } from "../../core/index.js";
import { noiseFor, hotFirst, looped, flameTongue, lick, ember, floorLight, BACK_LAYERS } from "./_lib.js";

export const meta = {
  name: "Ignar flame",
  desc: "A tuft of ground fire for a burning field: a tall licking tongue between two smaller ones and a dim back row, blobs of flame torn off the tips, an ember, a warm pool on the floor.",
  tags: ["fire", "flame", "ground", "burning", "field", "ignar", "loop"],
  size: [24, 32],
  origin: [12, 30],
  duration: 0.4,
  loop: true,
  fps: 20,
  bg: "ground",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#e0400d", "#f05a10", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    height: 22,
    seed: 2,
  },
};

const D = meta.duration, NL = noiseFor(D);
// layers [width, height, hot-first step]: the main tongue keeps a slim white heart, the side ones none
const MAIN = [[1, 1, 6], [0.78, 0.88, 4], [0.55, 0.7, 2], [0.28, 0.4, 1], [0.12, 0.2, 0]];
const SIDE = [[1, 1, 6], [0.7, 0.8, 4], [0.4, 0.55, 2]];
// [x, height share, half-width, tip sweep, row: 0 back, 1 front]
const TONGUES = [
  [-3, 0.72, 1.9, -2.2, 0],
  [3.5, 0.64, 1.9, 2.4, 0],
  [-5, 0.44, 1.5, -3.4, 1],
  [5.5, 0.38, 1.5, 3.4, 1],
  [0.5, 1, 3.2, 0.5, 1],
];

export function draw(p, t, o) {
  const F = fit(o.palette, 9), H = hotFirst(F), S = o.seed, HC = o.height;
  const N = (rate, seed = 0, off = 0) => NL(t, rate, seed, off);
  const NT = (tt, rate, seed = 0) => NL(tt, rate, seed);
  const fl = 0.8 + 0.12 * N(7.5, S + 1) + 0.08 * N(17.5, S + 2);

  // how tall tongue i is at time tt: a breath, a crackle, and now and then a leap
  const height = (i, tt) => {
    const hs = TONGUES[i][1], n = S * 11 + i * 7;
    const leap = Math.max(0, NT(tt, 5, n + 3) - 0.4) * 0.9;
    return HC * hs * (0.82 + 0.18 * NT(tt, 7.5, n) + leap);
  };
  const sweep = (i, tt) => TONGUES[i][3] + NT(tt, 5, S * 11 + i * 7 + 40) * 1.6;

  floorLight(p, 0, 0, 13, 2.5, H[3], 0.5 * fl);
  // embers at the root: a glowing bed
  for (let x = -7; x <= 7; x++) {
    const g = 0.5 + 0.5 * Math.sin((t / D) * TAU * (x % 2 ? 1 : 2) + x * 1.7);
    p.px(x, 0, g > 0.66 ? H[3] : g > 0.33 ? H[5] : H[7]);
  }
  TONGUES.forEach(([x, , w, , row], i) => {
    if (row) return;
    flameTongue(p, x, 0, height(i, t), w, sweep(i, t), N, S * 13 + i * 5, H, BACK_LAYERS, 0.45, 0.9);
  });
  TONGUES.forEach(([x, , w, , row], i) => {
    if (!row) return;
    flameTongue(p, x, 0, height(i, t), w, sweep(i, t), N, S * 13 + i * 5, H, w > 3 ? MAIN : SIDE, 0.55, 1.2);
  });

  // blobs torn off the tips, rising and shrinking
  looped(t, D, 6, S + 220, (r, j) => ({ i: [4, 4, 2, 3, 0, 1][j], vx: r.range(-6, 6), vy: -r.range(26, 40), s: r.range(0.7, 1.2), life: r.range(0.14, 0.2) }), (q, age) => {
    const tt = t - age, h = height(q.i, tt), x0 = TONGUES[q.i][0] + sweep(q.i, tt) * 0.9;
    const y = -h * 0.9 + q.vy * age;
    if (y < -29) return;
    lick(p, x0 + q.vx * age, y, 1 - age / q.life, q.s, H);
  });
  // an ember or two drifting up
  looped(t, D, 1, S + 500, (r) => ({ x: r.range(-5, 5), vx: r.range(-10, 10), life: D * 0.9, ph: r.range(0, 6) }), (q, age) => {
    const k = 1 - age / q.life, y = -10 - age * 40;
    ember(p, q.x + q.vx * age + Math.sin(age * 14 + q.ph) * 1.2, y, k, 1, [H[0], H[2], H[4], H[6]], age * 50 + q.ph);
  });

  // light: a warm wash and a hot heart at the root
  p.glow(0, -HC * 0.45, 13, mix(H[3], WHITE, 0.2), 0.3 * fl);
  p.glow(0, -3, 6, H[1], 0.25 * fl);
}
