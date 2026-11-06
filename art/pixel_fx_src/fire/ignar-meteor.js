// Ignar's meteor: a blazing comet diving almost straight down. A white-hot core at the bottom, wrapped in roaring flame drawn as one heat field (hard ramp bands, a 1 px dark-red outline like the
// hero's), a long tapering tail streaming straight up (a 3 degree lean) that tears into flame licks, sparks and
// embers, and thin vertical motion streaks. Drawn from t alone; the anchor is the core.
import { fit, clamp, smooth, tileNoise, TAU } from "../../core/index.js";
import { looped } from "./_lib.js";
import { paintHeat, fastFbm } from "./_ignar.js";

export const meta = {
  name: "Ignar meteor",
  desc: "A blazing comet falling straight down: a white-hot core, roaring outlined flame, a long tapering tail streaming up and tearing into licks, sparks and embers.",
  tags: ["fire", "meteor", "comet", "projectile", "falling", "ignar", "loop"],
  size: [96, 160],
  origin: [48, 138],
  duration: 0.3,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#e0400d", "#f05a10", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    seed: 5,
  },
};

const D = meta.duration;
const X0 = -48, Y0 = -138, W = 96, HH = 160; // the canvas in local px
const R = 13, L = 128; // head radius, tail length
// the flight: falling down and a touch right, so the tail leans a touch left of straight up
const LEAN = (3 * Math.PI) / 180, TX = -Math.sin(LEAN), TY = -Math.cos(LEAN); // unit vector up the tail
const NX = -TY, NY = TX; // across the tail
// noise scrolls up the tail: CELL px cells, PER cells a period, one period per loop
const CELL = 8, PER = 8, VEL = (CELL * PER) / D;
// heat thresholds for the bands above the outline: deep red, red, orange, amber, gold, pale, white
const BANDS = [0, 0.13, 0.27, 0.42, 0.58, 0.74, 0.9];

// along the tail (u, + up) and across it (v)
const toU = (x, y) => x * TX + y * TY, toV = (x, y) => x * NX + y * NY;
const fromUV = (u, v) => [u * TX + v * NX, u * TY + v * NY];
// inside the canvas with a 2 px margin (for the particles' tails and crosses)
const inside = (x, y) => x >= X0 + 2 && y >= Y0 + 2 && x <= X0 + W - 3 && y <= Y0 + HH - 3;

// the tail's half-width at u: it swells just behind the head, then tapers to a point
const width = (u) => R * (1 + 0.12 * smooth(0, 20, u)) * Math.pow(Math.max(0, 1 - u / L), 1.15);
// tables over u in half-px steps (u runs about -20..150 on this canvas)
const UQ = 2, U0 = -24, NU = (180 * UQ) | 0;
const WT = new Float32Array(NU);
for (let k = 0; k < NU; k++) { const u = U0 + k / UQ; WT[k] = u > 0 ? width(u) : 0; }
const ui = (u) => Math.max(0, Math.min(NU - 1, Math.round((u - U0) * UQ)));

// the nugget in the core: a lumpy outline, px from its centre
const ROCK = (a) => 4.2 + 0.5 * Math.sin(a * 2 + 0.4) + 0.4 * Math.sin(a * 3 + 2.3) + 0.3 * Math.sin(a * 5 + 1);

export function draw(p, t, o) {
  const F = fit(o.palette, 9), S = o.seed, ph = t / D;
  const scroll = VEL * t, pulse = Math.sin(ph * TAU);
  const heat = new Float32Array(W * HH), fbm = fastFbm(S, PER, 128);

  // flame licks torn off the sheath: blobs of heat streaming up, shrinking and cooling
  const blobs = [];
  looped(t, D, 14, S + 200, (r, i) => ({ u0: r.range(2, 26), side: i % 2 ? 1 : -1, v0: r.range(0.6, 0.95), vu: r.range(180, 280), vv: r.range(3, 16), s: r.range(2, 3.6), life: r.range(0.2, 0.34) }), (q, age) => {
    const u = q.u0 + q.vu * age, k = 1 - age / q.life;
    const v = q.side * (width(q.u0) * q.v0 + q.vv * age);
    blobs.push([u, v, q.s * (0.45 + 0.55 * k), 0.55 + 0.35 * k]);
  });

  // the tail's edges wave: the whole cross-section shifts with a slow noise (per quarter px of u, this frame)
  const SW = new Float32Array(NU);
  for (let k = 0; k < NU; k++) { const u = U0 + k / UQ; SW[k] = u > 0 ? 3 * tileNoise((u + 40 - scroll) / CELL / 2, 7.3, PER / 2, 0, S + 9) * clamp(u / 30) : 0; }

  heat.fill(-1);
  for (let j = 0; j < HH; j++) {
    // only the columns the flame can reach on this row: the tail's centre here, give or take its widest
    const yc = Y0 + j + 0.5, uc = -yc / -TY, xc = uc * TX, ww = (uc < R ? R : WT[ui(uc)] * 1.35) + 6;
    const i0 = Math.max(0, Math.floor(xc - ww - X0)), i1 = Math.min(W - 1, Math.ceil(xc + ww - X0));
    for (let i = i0; i <= i1; i++) {
      const x = X0 + i + 0.5, y = yc, u = toU(x, y), v = toV(x, y);
      if (u < -R - 1 || Math.abs(v) > R * 2.4 || u > L + 4) { heat[j * W + i] = -1; continue; } // far outside the flame
      const d = Math.sqrt(x * x + y * y), k = ui(u);
      // the envelope: a squashed nose ahead (below), the tail behind (above)
      let base;
      if (u < 0) base = 1 - Math.sqrt(u * u * 1.8225 + v * v) / R;
      else {
        const w = WT[k], tail = w > 0.4 ? 1 - Math.abs(v + SW[k]) / w : -1;
        base = Math.max(1 - d / R, tail);
      }
      const fu = clamp(u / L), amp = (0.18 + 0.5 * fu) * (u < 0 ? 0.35 : 1);
      if (base + amp * 0.9 < 0 && d > 9.5) { heat[j * W + i] = -1; continue; } // noise can't lift it into the flame
      const n = fbm((u + 40 - scroll) / CELL, v / 3 + 40);
      // hot down the middle near the head, cooling to red towards the tip
      let h = base * (1 - 0.7 * Math.sqrt(fu)) + n * amp - 0.08 * fu;
      h += (1.1 + 0.08 * pulse) * Math.max(0, 1 - Math.sqrt(x * x + (y + 1.5) * (y + 1.5)) / 9.5); // the white-hot heart, breathing
      heat[j * W + i] = h;
    }
  }
  // the licks: tongue-shaped (stretched along the flow), stamped over the field
  for (const [bu, bv, br, bk] of blobs) {
    const [cx, cy] = fromUV(bu, bv), ext = br * 3.2;
    for (let j = Math.max(0, Math.floor(cy - ext - Y0)); j <= Math.min(HH - 1, Math.ceil(cy + ext - Y0)); j++)
      for (let i = Math.max(0, Math.floor(cx - ext - X0)); i <= Math.min(W - 1, Math.ceil(cx + ext - X0)); i++) {
        const x = X0 + i + 0.5, y = Y0 + j + 0.5, du = toU(x, y) - bu, dv = toV(x, y) - bv;
        // a teardrop: round at the front, drawn out behind
        const eu = du / (br * (du > 0 ? 3 : 1.2)), ev = dv / br, e = Math.sqrt(eu * eu + ev * ev);
        if (e < 1) heat[j * W + i] = Math.max(heat[j * W + i], (1 - e) * bk);
      }
  }

  // crisp bands and a 1 px dark-red outline, no lone pixels
  paintHeat(p, heat, W, HH, X0, Y0, F.slice(2), BANDS, F[1]);

  // motion streaks: thin pale lines parallel to the fall, sliding up past the head
  looped(t, D, 8, S + 600, (r, i) => ({ v: (i % 2 ? 1 : -1) * r.range(R + 2, R + 10), u0: r.range(-20, -6), len: r.range(7, 16), sp: r.range(380, 540), life: r.range(0.12, 0.2) }), (q, age) => {
    const k = 1 - age / q.life, u1 = q.u0 + q.sp * age, u2 = u1 + q.len;
    const [ax, ay] = fromUV(u1, q.v), [bx, by] = fromUV(u2, q.v);
    if (!inside(bx, by)) return;
    const c0 = k > 0.5 ? F[7] : F[6];
    p.line(ax, ay, bx, by, (s) => (s < 0.25 ? c0 : s < 0.6 ? F[6] : F[4]));
  });

  // sparks shed upward off the head's sides: hot heads, cooler 1 px tails
  looped(t, D, 16, S + 700, (r) => ({ v0: (r.chance(0.5) ? 1 : -1) * r.range(R * 0.5, R * 1.1), u0: r.range(-4, 10), vu: r.range(160, 300), vv: r.range(10, 70), life: r.range(0.18, 0.34) }), (q, age) => {
    const k = 1 - age / q.life, u = q.u0 + q.vu * age, v = q.v0 + Math.sign(q.v0) * q.vv * age;
    const [x, y] = fromUV(u, v), sp = Math.hypot(q.vu, q.vv), len = 2 + 4 * k;
    if (!inside(x, y)) return;
    const [tx, ty] = fromUV(u - (q.vu / sp) * len, v - Math.sign(q.v0) * (q.vv / sp) * len);
    p.line(tx, ty, x, y, k > 0.5 ? F[5] : F[3]);
    p.px(x, y, k > 0.6 ? F[8] : k > 0.3 ? F[7] : F[6]);
    p.glow(x, y, 3, F[5], 0.4 * k);
  });

  // embers peeling off the tail, drifting outward and up, cooling; a few big ones as crosses
  looped(t, D, 18, S + 500, (r) => ({ u0: r.range(14, 70), side: r.chance(0.5) ? 1 : -1, vu: r.range(90, 170), vv: r.range(8, 30), life: r.range(0.22, 0.4), big: r.chance(0.25), ph: r.range(0, TAU) }), (q, age) => {
    const k = 1 - age / q.life;
    if (k < 0.25 && Math.sin(age * 60 + q.ph) < 0) return;
    const u = q.u0 + q.vu * age, v = q.side * (width(q.u0) * 0.9 + q.vv * age + 2 * Math.sin(age * 25 + q.ph));
    const [x, y] = fromUV(u, v), c = k > 0.6 ? F[7] : k > 0.35 ? F[6] : F[4];
    if (!inside(x, y)) return;
    if (q.big) {
      const rim = k > 0.5 ? F[4] : F[2];
      p.px(x - 1, y, rim), p.px(x + 1, y, rim), p.px(x, y - 1, rim), p.px(x, y + 1, rim);
    }
    p.px(x, y, c);
    p.glow(x, y, q.big ? 6 : 3, F[5], 0.35 * k);
  });

  // light: a hot pool round the core, a warm wash up the tail
  const fl = 0.9 + 0.1 * Math.sin(ph * TAU * 2);
  p.glow(0, 0, 14, F[6], 0.22 * fl);
  p.glow(0, 0, 30, F[4], 0.12 * fl);
  const [mx, my] = fromUV(40, 0);
  p.glow(mx, my, 28, F[4], 0.08 * fl);
}
