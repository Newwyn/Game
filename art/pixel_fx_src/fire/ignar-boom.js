// Ignar's fire explosion: a short, punchy ground blast for a chibi fire mage. Drawn from t alone with the shared
// fire helpers (flame tongues, flame puffs, smoke puffs, embers, sparks) in ./_lib.js.
import { fit, rng, clamp, ease, mix, hex, WHITE, TAU } from "../../core/index.js";
import { hotFirst, flameTongue, firePuff, smokePuff, ember, spark, sparkAt, drift, floorLight, solid, soft, BIG_LAYERS, LAYERS } from "./_lib.js";

export const meta = {
  name: "Ignar boom",
  desc: "A ground fire explosion: a white flash, a fireball mushrooming up on a stem of flame, tongues licking out, sparks and embers, then dark smoke that thins to nothing.",
  tags: ["fire", "explosion", "blast", "ground", "ignar", "one-shot"],
  size: [80, 80],
  origin: [40, 74],
  duration: 0.6,
  loop: false,
  fps: 20,
  bg: "ground",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#e0400d", "#f05a10", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    smoke: "#6a5f66",
    seed: 3,
  },
};

const D = meta.duration, sm = (x) => ((x = clamp(x)), x * x * (3 - 2 * x));
// still noise for a one-shot: a wobble that keeps moving with t
const mkN = (t) => (rate, seed = 0, off = 0) => Math.sin(t * rate * 2.1 + seed * 1.7 + off * 2.3) * 0.6 + Math.sin(t * rate * 3.7 + seed * 0.9 + off * 1.3) * 0.4;

export function draw(p, t, o) {
  const F = fit(o.palette, 9), H = hotFirst(F), S = o.seed, SM = hex(o.smoke), N = mkN(t);
  const HS = [...H.slice(0, 6), mix(H[6], SM, 0.45), mix(H[7], SM, 0.7), mix(H[8], SM, 0.85)];
  const EMB = [H[0], H[2], H[4], H[6]], SPK = [H[0], H[1], H[3], H[6]];
  const life = 1 - sm((t / D));

  // the cap: where the fireball's head is and how big
  const up = ease.outQuart(clamp(t / 0.32));
  const capY = -8 - up * 33 - Math.max(0, t - 0.32) * 16, capR = 5 + 13 * ease.outExpo(clamp(t / 0.16)) - 7 * sm(((t - 0.28) / 0.28));

  // floor: scorch and warm light pool
  const sk = 1 - sm(((t - 0.3) / 0.26));
  if (t > 0.03 && sk > 0.02) {
    p.ellipse(0, 0.5, 12 + up * 8, 1.6, mix(hex("#1a0d0b"), H[6], 0.3), 0.75 * sk);
    if (t < 0.4) p.ellipse(0, 0, 7 + up * 6, 0.8, H[5], 0.9 * (1 - t / 0.4));
  }
  floorLight(p, 0, 0, 30, 5, H[3], 0.6 * life);

  // dark smoke: born off the cap and the stem once the fire has peaked, rising and thinning out by the end
  for (let i = 0; i < 16; i++) {
    const r = rng(S + 40, i), born = 0.1 + r.next() * 0.2, L = Math.min(D - 0.02 - born, r.range(0.28, 0.42)), age = t - born;
    if (age < 0 || age >= L) continue;
    const a = r.range(0, TAU), rr = r.range(0.3, 1);
    const bx = Math.cos(a) * capR * rr * 1.1, by = capY + Math.sin(a) * capR * rr * 0.7 + (i % 4 === 0 ? r.range(8, 22) : 0);
    const [x, y] = drift(bx, by, bx * 0.8, -r.range(14, 30), age, 0, -18, 1.6, 1.2);
    smokePuff(p, x, y, 1 - age / L, r.range(5, 8), SM, true, 1.3);
  }

  // flame tongues licking up and out from the ground: big at the peak, then sinking
  const tongueH = 46 * ease.outQuart(clamp((t - 0.02) / 0.12)) * (1 - sm(((t - 0.14) / 0.3)));
  const TONG = [[-11, 0.5, 3.6, -8], [11, 0.55, 3.6, 8], [-19, 0.32, 2.8, -9], [19, 0.3, 2.8, 9], [-4, 0.85, 4.6, -3], [5, 0.78, 4.6, 3]];
  if (tongueH > 1)
    TONG.forEach(([x, hs, w, sx], i) => {
      const h = tongueH * hs * (0.9 + 0.15 * N(3, i));
      flameTongue(p, x * (0.7 + up * 0.4), 0, h, w, sx * (0.6 + up * 0.6), N, S * 7 + i * 13, H, w > 3 ? BIG_LAYERS : LAYERS, 0.5, 1);
    });

  // the fireball: a stem of puffs climbing to a mushroom cap of puffs rolling outward
  const puffs = [];
  for (let i = 0; i < 26; i++) {
    const r = rng(S + 10, i), cap = i < 16, born = cap ? r.range(0, 0.06) : r.range(0.02, 0.16), L = cap ? r.range(0.24, 0.38) : r.range(0.2, 0.32), age = t - born;
    if (age < 0 || age >= L) continue;
    let x, y;
    if (cap) {
      const a = (i / 16) * TAU + r.range(-0.2, 0.2), rr = r.range(0.45, 1);
      x = Math.cos(a) * capR * rr * 1.25 + N(2, i) * 0.8;
      y = capY + Math.sin(a) * capR * rr * 0.75 - (Math.sin(a) > 0 ? 0 : 2) - age * 8;
    } else {
      const f = r.next();
      [x, y] = drift(r.range(-3, 3), -2, r.range(-14, 14), -r.range(60, 120), age, 0, -60, 4, 3);
      y = Math.max(y, capY + f * 8);
    }
    puffs.push([x, y, 1 - age / L, cap ? r.range(6.5, 9.5) : r.range(4, 6), r.next(), cap ? 1 : 0]);
  }
  puffs.sort((a, b) => a[5] - b[5] || b[2] - a[2]);
  for (const [x, y, k, s, f] of puffs) firePuff(p, x, y, k, s, f, HS, 0.12);
  // the hot heart of the cap while it's young
  if (t < 0.22) {
    const k = 1 - t / 0.22;
    solid(p, -1, capY - 1, capR * 0.55 * k + 0.5, H[1]);
    solid(p, -1.5, capY - 1.5, capR * 0.3 * k, H[0]);
  }

  // sparks flung out and bouncing, embers carried up
  for (let i = 0; i < 14; i++) {
    const r = rng(S + 70, i), L = r.range(0.25, 0.5), age = t - r.range(0, 0.05);
    if (age < 0 || age >= L) continue;
    const a = -Math.PI / 2 + r.range(-1.15, 1.15), sp = r.range(80, 165);
    const [x, y, vx, vy] = sparkAt(0, -3, Math.cos(a) * sp, Math.sin(a) * sp, age);
    spark(p, x, y, vx, vy, 1 - age / L, SPK);
  }
  for (let i = 0; i < 9; i++) {
    const r = rng(S + 90, i), born = r.range(0.05, 0.2), L = Math.min(D - 0.08 - born, r.range(0.2, 0.32)), age = t - born;
    if (age < 0 || age >= L) continue;
    const [x, y] = drift(r.range(-22, 22), capY + r.range(-2, 14), r.range(-40, 40), -r.range(20, 50), age, 0, -30, 1.6, 1.6);
    ember(p, x + 3 * Math.sin(age * 9 + i), y, 1 - age / L, r.chance(0.25) ? 2 : 1, EMB, age * 40 + i);
  }

  // the flash: a white star at the ground for the first frames
  if (t < 0.09) {
    const k = 1 - t / 0.09, L = 10 + 14 * (1 - k);
    for (let i = 0; i < 8; i++) {
      const an = Math.PI + (i / 7) * Math.PI, len = (i % 2 ? 0.55 : 1) * L * k + 2;
      p.line(0, -2, Math.cos(an) * len * 1.3, -2 + Math.sin(an) * len, i % 2 ? H[2] : H[0]);
    }
    solid(p, 0, -3, 1.5 + 5 * k, H[1]);
    solid(p, 0, -3, 0.5 + 3.5 * k, WHITE);
    p.glow(0, -12, 24, H[1], 0.9 * k);
  }

  // light: a big pool that flares and falls, a hot one in the cap
  const lk = t < 0.05 ? 1 : Math.pow(life, 2.2);
  p.glow(0, capY * 0.7, 30, mix(H[3], WHITE, 0.2), 0.45 * lk);
  p.glow(0, capY, capR * 1.4 + 2, H[2], 0.35 * lk);
}
