// Sylva's summoning: a seed of green light wakes on the ground, two glowing vines twist up out of it with a
// spiral of leaves riding round them and gold motes climbing, the column peaks in a burst of light at its crown,
// then the leaves are flung out and drift down while the vines wither from the root. Original design for Legend of Capsules.
import { fit, hex, fly, rng, clamp, lerp, smooth, ease, TAU, WHITE, sparkle } from "../../core/index.js";
import { drawLeaf } from "./_lib.js";

export const meta = {
  name: "Sylva summon",
  desc: "A seed of green light sprouts twisting glowing vines and a rising spiral of leaves with gold motes; it flashes at the crown, then the leaves burst out and flutter down.",
  tags: ["nature", "summon", "spawn", "leaf", "vine", "magic", "ground", "one-shot"],
  size: [48, 96],
  origin: [24, 90],
  duration: 0.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#0f2e1a", "#166534", "#22c55e", "#4ade80", "#bbf7d0", "#f0fdf4"],
    gold: ["#a16207", "#facc15", "#fde68a"],
    seed: 7,
  },
};

const SEED = 0.1, TB = 0.46, END = 0.8, TOP = 74, SY = 0.32, NL = 20;
const colR = (h) => 4 + 7 * clamp(h / TOP); // the column widens as it climbs

// where leaf i is at time t: riding the spiral until the burst, then flung outward and fluttering down
function leafAt(i, t, seed) {
  const R = rng(seed, i), born = SEED * 0.6 + R.range(0, 0.26), th0 = R.range(0, TAU), w = R.range(9, 13), rise = R.range(0.3, 0.42), hmax = R.range(0.45, 1) * TOP;
  const len = R.range(4.5, 6.5), out = R.range(36, 62), up = R.range(-40, 10), spin = R.range(8, 16) * R.sign(), tone = R.int(0, 2);
  const helix = (age) => {
    const k = clamp(age / rise), h = hmax * ease.outCubic(k) + 1, th = th0 + age * w, r = colR(h) * (0.6 + 0.4 * Math.min(1, k * 3));
    return { x: Math.cos(th) * r, y: -h + Math.sin(th) * r * SY, th, depth: Math.sin(th) };
  };
  if (t < born) return null;
  if (t < TB) {
    const q = helix(t - born);
    return { ...q, ang: q.th + Math.PI / 2, fl: (t - born) * 9, len, tone, a: 1, k: 0 };
  }
  const q = helix(TB - born), dt = t - TB, dir = Math.cos(q.th) >= 0 ? 1 : -1;
  const [x, y] = fly(q.x, q.y, dir * out * (0.5 + 0.5 * Math.abs(Math.cos(q.th))), up, dt, 70, 4);
  const k = dt / (END - TB - 0.04);
  return { x: x + Math.sin(dt * 14 + i) * 2 * dt * 3, y: Math.min(y, 0), depth: q.depth, ang: q.th + spin * dt, fl: dt * 11 + i, len: len * (1 - 0.5 * k), tone, a: 1, k };
}

function leaves(p, t, o, C, G, back) {
  for (let i = 0; i < NL; i++) {
    const L = leafAt(i, t, o.seed);
    if (!L || L.k >= 1 || (L.depth > 0) === back) continue;
    let pal = L.tone === 2 ? [C[0], C[1], C[3], C[4]] : L.tone === 1 ? [C[0], C[1], C[2], C[3]] : [C[0], C[1], C[2], C[4]];
    if (back) pal = [C[0], C[0], C[1], C[2]];
    if (L.k > 0.55) pal = L.k > 0.8 ? [C[0], C[0], C[0], C[1]] : [C[0], C[0], C[1], C[2]];
    drawLeaf(p, L.x, L.y, L.len, back ? 1.6 : 2, L.ang, L.fl, pal, 1);
    if (!back && t < TB + 0.08 && Math.abs(Math.cos(L.fl)) > 0.96) {
      p.px(L.x, L.y, WHITE);
      p.glow(L.x, L.y, 4, C[4], 0.3);
    }
  }
}

// a vine: a helix of 1 px light from its root up to its growing tip; the half behind is dim and drawn behind
function vines(p, t, C, G, back) {
  if (t < SEED * 0.8) return;
  const g = clamp((t - SEED * 0.8) / (TB - SEED * 0.8)), tip = TOP * 1.04 * ease.outCubic(g);
  const wither = smooth(TB, END - 0.06, t), root = tip * ease.inQuad(wither); // withers away from the root up
  for (let v = 0; v < 2; v++) {
    const ph = v * Math.PI + t * 7;
    let prev = null;
    if (wither >= 0.98) continue;
    for (let h = root; h < tip; h += 0.5) {
      const th = ph + h * 0.15, r = colR(h) * 0.82, d = Math.sin(th), x = Math.cos(th) * r, y = -h + d * r * SY;
      const isBack = d > 0;
      if (isBack === back) {
        const nearTip = tip - h, hot = wither > 0 ? 0 : nearTip < 3 ? 2 : nearTip < 10 ? 1 : 0;
        const c = back ? (wither > 0.4 ? C[0] : C[1]) : wither > 0.5 ? C[1] : wither > 0.15 ? C[2] : hot === 2 ? WHITE : hot === 1 ? C[4] : C[3];
        p.px(x, y, c);
        // a darker underside on the near strand gives it a little thickness
        if (!back && wither < 0.5) p.px(x, y + 1, C[1]);
        // little curled tendrils and buds along the near strand
        if (!back && wither < 0.3 && prev !== null && Math.floor(h) % 13 === 5 + v * 3 && h - Math.floor(h) < 0.5) {
          const s = Math.cos(th) > 0 ? 1 : -1;
          p.px(x + s, y - 1, C[3]), p.px(x + 2 * s, y - 2, C[2]), p.px(x + 2 * s, y - 3, C[4]);
        }
      }
      prev = h;
    }
    // the tip's light while it grows
    if (!back && wither === 0 && tip > 2) {
      const th = ph + tip * 0.15, r = colR(tip) * 0.82;
      p.glow(Math.cos(th) * r, -tip + Math.sin(th) * r * SY, 6, C[4], 0.45);
    }
  }
}

// gold motes climbing the column, then drifting down after the burst
function motes(p, t, G, C) {
  for (let i = 0; i < 16; i++) {
    const R = rng(77, i), born = SEED + R.range(0, 0.34), life = Math.min(R.range(0.3, 0.5), 0.7 - born), age = t - born;
    if (age < 0 || age > life) continue;
    const k = age / life, th = R.range(0, TAU) + age * 8, r = R.range(2, 10), h = 4 + age * R.range(110, 170);
    const x = Math.cos(th) * r, y = -Math.min(h, TOP + 6) + (t > TB ? (t - TB) * 20 : 0);
    const c = k < 0.3 ? WHITE : k < 0.7 ? G[2] : G[1];
    if (k < 0.5 && i % 3 === 0) {
      p.px(x, y, WHITE), p.px(x - 1, y, c), p.px(x + 1, y, c), p.px(x, y - 1, c), p.px(x, y + 1, c);
    } else p.px(x, y, k > 0.85 ? G[0] : c);
    p.glow(x, y, 3, G[1], 0.3 * (1 - k));
  }
}

function floor(p, t, C, back) {
  // the seed: a bead of light on the ground and a flat ring that breathes out round it
  const grow = ease.outBack(clamp(t / SEED)), fade = 1 - smooth(TB - 0.05, END - 0.1, t);
  if (fade <= 0) return;
  const R = (3 + 9 * grow) * (0.8 + 0.2 * fade);
  for (let g = 0; g < TAU; g += 0.04) {
    const s = Math.sin(g);
    if ((s < 0) !== back) continue;
    const x = Math.cos(g) * R, y = s * R * 0.25;
    p.px(x, y, s < 0 ? (fade > 0.5 ? C[1] : C[0]) : fade > 0.6 ? (t < TB ? C[3] : C[2]) : fade > 0.3 ? C[1] : C[0]);
  }
  if (!back) {
    if (t < TB + 0.04) {
      const r = 1 + 1.4 * grow;
      p.circle(0, -1, r + 0.6, C[3]);
      p.circle(0, -1.3, r * 0.6, t < SEED * 0.5 ? WHITE : C[5]);
    }
    p.glow(0, -1, 14, C[3], 0.35 * fade);
  }
}

export function drawBack(p, t, o) {
  if (t >= END) return;
  const C = fit(o.palette, 6).map(hex), G = fit(o.gold, 3).map(hex);
  floor(p, t, C, true);
  vines(p, t, C, G, true);
  leaves(p, t, o, C, G, true);
}

export function draw(p, t, o) {
  if (t >= END) return;
  const C = fit(o.palette, 6).map(hex), G = fit(o.gold, 3).map(hex);
  // gathering: short streaks of light sliding in to the seed
  if (t < SEED) {
    const k = t / SEED;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4, d = 14 * (1 - ease.inQuad(k)) + 2, x = Math.cos(a) * d, y = -1 + Math.sin(a) * d * 0.3;
      p.line(x, y, x + Math.cos(a) * 3, y + Math.sin(a) * 1, C[3]);
      p.px(x, y, C[5]);
    }
  }
  floor(p, t, C, false);
  // the column's light: a soft pillar that swells as it climbs
  if (t > SEED * 0.8 && t < TB + 0.15) {
    const g = clamp((t - SEED * 0.8) / (TB - SEED * 0.8)), k = t < TB ? 0.25 + 0.25 * g : 0.5 * (1 - (t - TB) / 0.15), top = TOP * ease.outCubic(g);
    for (let h = 0; h < top; h += 10) p.glow(0, -h, 12, C[2], k * 0.5);
  }
  vines(p, t, C, G, false);
  leaves(p, t, o, C, G, false);
  motes(p, t, G, C);
  // the peak: the crown flashes white and a ring of light snaps out from it
  const q = t - (TB - 0.03);
  if (q > 0 && q < 0.2) {
    const e = q / 0.2, y = -TOP + 2;
    if (e < 0.2) p.circle(0, y, 4 * (1 - e / 0.2) + 1.5, WHITE);
    if (e < 0.6) sparkle(p, 0, y, 9 * (1 - e / 0.6) + 1, C[4], C[3], 0.6 * (1 - e));
    const rr = 3 + 12 * ease.outCubic(e), rc = e < 0.35 ? C[4] : e < 0.7 ? C[3] : C[2];
    if (e < 0.35) p.ring(0, y, rr, e < 0.2 ? 1.4 : 1, rc);
    else for (let i = 0; i < 8; i++) {
      const m = (i / 8) * TAU + 0.2, hh = (TAU / 16) * (1 - (e - 0.35) / 0.65);
      p.arc(0, y, rr, 1, m - hh, m + hh, rc);
    }
    p.glow(0, y, 22, C[3], 0.6 * (1 - e));
    // sparks thrown from the crown
    for (let i = 0; i < 10; i++) {
      const R = rng(o.seed + 31, i), a = R.range(0, TAU), sp = R.range(60, 110), [x, yy] = fly(0, y, Math.cos(a) * sp, Math.sin(a) * sp - 20, q, 120, 5);
      if (q > R.range(0.12, 0.2)) continue;
      p.px(x, yy, i % 3 === 0 ? G[2] : C[4]);
      p.glow(x, yy, 3, i % 3 === 0 ? G[1] : C[3], 0.3);
    }
  }
  void lerp;
}
