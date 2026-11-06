// Ignar's fire pillar: the floor cracks and flashes, a column of fire erupts to full height, roars (its middle
// repeats every LOOP seconds, so a game can hold it), then collapses into embers and smoke. Drawn from t alone;
// the column is a scrolling, tiling noise field cut to a flame profile; the flame bits come from ./_lib.js.
import { fit, rng, clamp, ease, mix, hex, tileFbm, TAU, WHITE } from "../../core/index.js";
import { hotFirst, looped, flameTongue, lick, ember, spark, sparkAt, smokePuff, drift, floorLight, solid, LAYERS } from "./_lib.js";

export const meta = {
  name: "Ignar pillar",
  desc: "A fire pillar: the floor flashes, a roaring column of fire shoots up and keeps burning, licks and embers streaming off it, then collapses into embers and thin smoke.",
  tags: ["fire", "pillar", "column", "eruption", "ground", "ignar", "one-shot"],
  size: [48, 128],
  origin: [24, 124],
  duration: 1.4,
  loop: false,
  fps: 20,
  bg: "ground",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#e0400d", "#f05a10", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    smoke: "#6a5f66",
    height: 112,
    seed: 4,
  },
};

const D = meta.duration;
// phases: rise until UP, hold (repeats every LOOP s) until FALL, collapsed by GONE
const UP = 0.3, LOOP = 0.35, FALL = UP + LOOP * 2, GONE = FALL + 0.3;
const sm = (x) => ((x = clamp(x)), x * x * (3 - 2 * x));
const PY = 4, SPEED = PY / LOOP; // noise cells scrolled per second: whole periods every LOOP

export function draw(p, t, o) {
  const F = fit(o.palette, 9), H = hotFirst(F), S = o.seed, HM = o.height, SM = hex(o.smoke);
  const EMB = [H[0], H[2], H[4], H[6]], SPK = [H[0], H[1], H[3], H[6]];
  const ph = ((t - UP) / LOOP) * TAU;
  const roar = 1 + 0.04 * Math.sin(ph) + 0.03 * Math.sin(ph * 2 + 1);

  // the column's height, width and heat over its life
  const rise = ease.outExpo(clamp((t - 0.02) / (UP - 0.04)));
  const fall = sm((t - FALL) / (GONE - FALL));
  const h = HM * rise * roar * (1 - ease.inQuad(fall) * 0.85) * (1 - sm((t - GONE + 0.08) / 0.08));
  const W = (3 + 8.5 * ease.outQuart(clamp(t / 0.14))) * (1 - fall * 0.35);
  const cool = fall * 0.75, rush = 1 - sm((t - 0.05) / (UP + 0.05)); // rush: extra heat while it erupts

  // floor: a glowing crack-ring, then scorch fading out
  const floorK = sm(t / 0.04) * (1 - sm((t - FALL) / (D - 0.05 - FALL)));
  if (floorK > 0.02) {
    p.ellipse(0, 0.5, 15, 2, mix(hex("#1a0d0b"), H[6], 0.3), 0.85 * floorK);
    p.ellipse(0, 0.2, 11, 1.2, H[5], floorK);
    p.ellipse(0, 0, 7, 0.7, fall > 0.5 ? H[4] : H[2], floorK);
  }
  floorLight(p, 0, 0, 22, 4, H[3], 0.7 * floorK);

  // smoke at the end: thin puffs left where the column stood, gone before the last frame
  for (let i = 0; i < 9; i++) {
    const r = rng(S + 40, i), born = FALL + r.range(0.05, 0.25), L = Math.min(D - 0.03 - born, r.range(0.3, 0.45)), age = t - born;
    if (age < 0 || age >= L) continue;
    const y0 = -r.range(8, HM * 0.65 * (1 - (born - FALL) / 0.35));
    const [x, y] = drift(r.range(-8, 8), y0, r.range(-10, 10), -r.range(20, 40), age, 0, -16, 1.6, 1.2);
    smokePuff(p, x, y, 1 - age / L, r.range(3, 5), SM, true, 1.1);
  }

  // side tongues bursting out at the base during the eruption, and a fringe of flames while it roars
  const baseH = 18 * ease.outQuart(clamp((t - 0.02) / 0.1)) * (1 - 0.45 * sm((t - 0.15) / 0.2)) * (1 - fall);
  if (baseH > 1) {
    const N = (rate, seed = 0, off = 0) => Math.sin(ph * Math.round(rate / 3) + seed + off * 1.9) * 0.7 + Math.sin(ph * 2 + seed * 1.3 + off) * 0.3;
    [[-8, 0.7, -5], [8, 0.75, 5], [-13, 0.45, -5], [13, 0.4, 5]].forEach(([x, hs, sx], i) =>
      flameTongue(p, x * (0.6 + 0.4 * rise), 0, baseH * hs * (0.9 + 0.1 * Math.sin(ph * 2 + i)), 2.4, sx, N, S * 7 + i * 13, H, LAYERS, 0.5, 1));
  }

  // the column: a scrolling noise field cut to a flame profile, hottest in the middle
  if (h > 1) {
    const top = -h - 6;
    p.shade(-W - 6, top, W + 6, 0, (x, y, out) => {
      const u = -y / h;
      if (u > 1.08) return;
      const n = tileFbm(x * 0.16 + 7, y * 0.06 + t * SPEED, 0, PY, S, 3), n2 = tileFbm(x * 0.35, y * 0.16 + t * SPEED * 2, 0, PY * 2, S + 9, 2);
      // the profile: a flared foot, a straight trunk that sways, a ragged pointed crown
      const sway = Math.sin(y * 0.07 + ph) * 1.2 * u;
      const w = W * (1 + 0.45 * Math.pow(Math.max(0, 1 - u * 4), 2)) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 3))) + n * 4.2;
      const d = Math.abs(x - sway) / Math.max(0.5, w);
      let heat = 1 - d + n2 * 0.22 - u * 0.32 - cool + rush * 0.25 * u;
      if (heat <= 0) return;
      out.k = 0.05 + heat * 0.15;
      return heat > 0.84 ? (heat > 0.95 ? WHITE : H[0]) : heat > 0.7 ? H[1] : heat > 0.55 ? H[2] : heat > 0.4 ? H[3] : heat > 0.26 ? H[4] : heat > 0.12 ? H[5] : H[6];
    });
  }

  // licks torn off the column's sides and crown, repeating with the hold
  const hold = sm((t - 0.15) / 0.15) * (1 - sm((t - FALL) / 0.18));
  if (hold > 0.02) {
    looped(t, LOOP, 9, S + 220, (r) => ({ u: r.range(0.35, 1), side: r.chance(0.5) ? 1 : -1, vx: r.range(4, 14), vy: -r.range(40, 70), s: r.range(1, 1.8), life: r.range(0.14, 0.24) }), (q, age) => {
      const k = 1 - age / q.life, x0 = q.side * W * (1 - q.u * 0.6), y0 = -HM * q.u * 0.95;
      lick(p, x0 + q.side * q.vx * age, y0 + q.vy * age, k * hold, q.s, H);
    });
    looped(t, LOOP, 6, S + 500, (r) => ({ x: r.range(-8, 8), y: -r.range(10, 70), vx: r.range(-30, 30), vy: -r.range(60, 110), life: LOOP * 0.95, s: r.chance(0.3) ? 2 : 1, ph: r.range(0, 6) }), (q, age) => {
      const [x, y] = drift(q.x, q.y, q.vx, q.vy, age, 0, -30, 1.6, 1.6);
      if (y < -122) return;
      ember(p, clamp(x, -22, 22), y, (1 - age / q.life) * hold, q.s, EMB, age * 50 + q.ph);
    });
  }
  // sparks thrown at the eruption
  for (let i = 0; i < 10; i++) {
    const r = rng(S + 70, i), L = r.range(0.3, 0.55), age = t - r.range(0.02, 0.08);
    if (age < 0 || age >= L) continue;
    const a = -Math.PI / 2 + r.range(-0.9, 0.9), sp = r.range(70, 140);
    const [x, y, vx, vy] = sparkAt(0, -2, Math.cos(a) * sp * 0.6, Math.sin(a) * sp, age);
    spark(p, x, y, vx, vy, 1 - age / L, SPK);
  }
  // embers falling out of the collapse
  for (let i = 0; i < 6; i++) {
    const r = rng(S + 90, i), born = FALL + r.range(0, 0.2), L = Math.min(D - 0.02 - born, r.range(0.25, 0.4)), age = t - born;
    if (age < 0 || age >= L) continue;
    const [x, y] = drift(r.range(-12, 12), -r.range(10, HM * 0.7), r.range(-25, 25), -r.range(10, 40), age, 0, -20, 1.6, 1.6);
    ember(p, x, y, 1 - age / L, 1, [H[2], H[3], H[5], H[6]], age * 40 + i);
  }

  // the flash at the eruption
  if (t < 0.08) {
    const k = 1 - t / 0.08;
    p.ellipse(0, -1, 6 + 10 * (1 - k), 2 + 2 * k, WHITE);
    p.glow(0, -10, 22, H[1], 0.8 * k);
  }

  // light along the column, warm and breathing
  const lk = (rise * (1 - fall)) * (0.92 + 0.08 * Math.sin(ph * 2));
  if (lk > 0.01) {
    p.glow(0, -h * 0.35, 22, mix(H[3], WHITE, 0.2), 0.35 * lk);
    p.glow(0, -h * 0.75, 18, mix(H[3], WHITE, 0.2), 0.25 * lk);
    p.glow(0, -6, 10, H[1], 0.3 * lk);
  }
}
