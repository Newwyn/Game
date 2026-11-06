// A half-dome ward of glowing leaves bound by thin gold vines, turning slowly over its wearer.
import { fit, cycle, clamp, TAU, WHITE, hex, mix, rand } from "../../core/index.js";

export const meta = {
  name: "Sylva leaf dome",
  desc: "A translucent half-dome of overlapping glowing leaves laced with thin gold vines turns slowly over its wearer; a shimmer sweeps across the leaves and motes drift up.",
  tags: ["nature", "leaf", "shield", "barrier", "dome", "ward", "buff", "ground", "loop"],
  size: [64, 48],
  origin: [32, 42],
  duration: 1,
  loop: true,
  fps: 24,
  bg: "ground",
  options: {
    palette: ["#0f2e1a", "#166534", "#22c55e", "#4ade80", "#bbf7d0", "#f0fdf4"],
    gold: ["#a16207", "#facc15", "#fde68a"],
    seed: 4,
  },
};

const RX = 26, RY = 35;
// rings of leaves from the floor up: latitude, how many, slots they turn per loop (sign: which way)
const RINGS = [[0.12, 14, 1], [0.44, 13, -1], [0.76, 11, 1], [1.06, 8, -1], [1.36, 4, 1]];
const VINES = 4;

// a point on the dome: x, y on screen, z towards us (-1 back .. 1 front)
const onDome = (phi, lat) => [RX * Math.cos(lat) * Math.sin(phi), -RY * Math.sin(lat), Math.cos(lat) * Math.cos(phi)];

const GRID = new Uint8Array(32 * 32);
// a leaf drawn truly translucent: len long, wid across, along ang; sq is how face-on it is (0 edge on .. 1)
function leaf(p, x, y, len, wid, ang, sq, C, a, hot) {
  const ca = Math.cos(ang), sa = Math.sin(ang), w = Math.max(0.6, sq * wid), R = Math.ceil(len / 2 + 1);
  const X = Math.round(x), Y = Math.round(y);
  const inside = (i, j) => {
    const u = i * ca + j * sa + len / 2, v = -i * sa + j * ca;
    if (u < 0 || u > len) return 0;
    const half = w * Math.pow(Math.sin((Math.PI * u) / len), 0.8);
    return Math.abs(v) <= half ? (v < 0 ? 1 : 2) : 0;
  };
  const N = 2 * R + 3;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) GRID[j * 32 + i] = inside(i - R - 1, j - R - 1);
  const g = (i, j) => GRID[(j + R + 1) * 32 + i + R + 1];
  for (let j = -R; j <= R; j++)
    for (let i = -R; i <= R; i++) {
      const s = g(i, j);
      if (!s) {
        if (g(i - 1, j) || g(i + 1, j) || g(i, j - 1) || g(i, j + 1)) p.blend(X + i, Y + j, C[0], Math.min(1, a * 1.1));
        continue;
      }
      const u = i * ca + j * sa + len / 2, v = -i * sa + j * ca, rib = Math.abs(v) < 0.5 && u > len * 0.15 && u < len * 0.85 && w > 1.1;
      const c = rib ? (hot ? C[5] : C[4]) : s === 1 ? (hot ? C[4] : C[3]) : C[2];
      p.blend(X + i, Y + j, c, Math.min(1, rib ? a * 1.15 : a * (s === 1 ? 1.05 : 0.9)));
    }
  if (hot) p.glow(x, y, len * 0.7, C[4], 0.25 * a);
}

function leaves(p, ph, C, front) {
  for (let r = 0; r < RINGS.length; r++) {
    const [lat, n, dir] = RINGS[r];
    for (let i = 0; i < n; i++) {
      // each ring slides along by whole slots, so the loop meets itself; rows are staggered
      const phi = ((i + (r % 2) * 0.5 + dir * ph) / n) * TAU;
      const [x, y, z] = onDome(phi, lat);
      if (front !== z >= 0) continue;
      // the leaf lies along the ring's curve, tipped up a little, wavering on its stem
      const tx = Math.cos(phi) * Math.cos(lat), ty = 0, wob = Math.sin(phi * 3 + ph * TAU * 2 + r) * 0.25;
      const ang = Math.atan2(ty + 0.0001, tx * (dir > 0 ? 1 : -1)) - dir * 0.55 + wob;
      const facing = Math.abs(z) * 0.75 + 0.25;
      // the shimmer: a bright band sweeps across the dome once a loop
      const sweep = Math.cos(phi - ph * TAU + lat * 0.8), hot = front && sweep > 0.82;
      const len = 9.5 - r * 0.8 + rand(i, r, 7) * 1.2, wid = 2.6 - r * 0.15;
      const a = front ? 0.42 + z * 0.33 : 0.3 + (1 + z) * 0.22;
      leaf(p, x, y, len, wid, ang, facing, front ? C : C.map((c) => mix(c, C[0], 0.35)), a, hot);
      if (hot && sweep > 0.95 && r % 2 === 0) {
        p.px(x, y - 1, WHITE);
        p.light(x, y - 1, C[4], 0.6);
      }
    }
  }
}

// gold vines spiralling from the floor up over the dome, sliding round with the loop
function vines(p, ph, G, front) {
  for (let v = 0; v < VINES; v++) {
    const base = ((v + ph * 0.5) / VINES) * TAU * 1;
    let prev = null;
    for (let s = 0; s <= 1.0001; s += 1 / 40) {
      const lat = s * 1.5, phi = base + s * 2.2 + Math.sin(s * 9 + v) * 0.12;
      const [x, y, z] = onDome(phi, lat);
      const cur = [x, y, z];
      if (prev && (front ? prev[2] >= 0 && z >= 0 : prev[2] < 0 || z < 0)) {
        const lit = front && x < 0 && y < -RY * 0.25;
        if (front) p.line(prev[0], prev[1], x, y, lit ? G[2] : G[1]);
        else p.blend(x, y, G[0], 0.45);
      }
      prev = cur;
    }
  }
}

function floorRing(p, C, front, pulse) {
  // where the dome meets the floor: a flat ellipse, its near half bright
  const ry = 3.5;
  for (let x = -RX - 1; x <= RX + 1; x++) {
    const u = x / (RX + 0.5);
    if (Math.abs(u) > 1) continue;
    const d = Math.sqrt(1 - u * u) * ry;
    if (front) {
      p.px(x, d, Math.abs(u) < 0.55 ? C[4] : C[3]);
      p.blend(x, d + 1, C[1], 0.5);
    } else p.blend(x, -d, C[2], 0.45);
  }
  p.glow(0, 0, RX + 4, C[2], 0.12 + 0.05 * pulse);
}

export function drawBack(p, t, o) {
  const C = fit(o.palette, 6), G = fit(o.gold, 3), ph = t / meta.duration, pulse = Math.sin(ph * TAU);
  floorRing(p, C, false, pulse);
  vines(p, ph, G, false);
  leaves(p, ph, C, false);
}

export function draw(p, t, o) {
  const C = fit(o.palette, 6), G = fit(o.gold, 3), ph = t / meta.duration, pulse = Math.sin(ph * TAU);
  // the shell: barely there in the middle, thicker towards its rim, a lit rim line on the silhouette
  for (let y = -RY; y <= 0; y++)
    for (let x = -RX; x <= RX; x++) {
      const d = Math.hypot((x + 0.5) / RX, (y + 0.5) / RY);
      if (d > 1) continue;
      const rim = Math.pow(d, 5);
      p.blend(x, y, rim > 0.6 ? C[3] : C[2], 0.03 + rim * 0.22 + 0.02 * pulse);
    }
  for (let k = 0; k <= 120; k++) {
    const g = Math.PI + (k / 120) * Math.PI, x = Math.cos(g) * RX, y = Math.sin(g) * RY;
    const lit = g < Math.PI * 1.45;
    p.blend(x, Math.min(0, y), lit ? C[4] : C[3], lit ? 0.75 : 0.5);
  }
  vines(p, ph, G, true);
  leaves(p, ph, C, true);
  floorRing(p, C, true, pulse);
  p.glow(-8, -RY * 0.6, 16, C[4], 0.08);
  p.glow(0, -RY * 0.45, RX + 6, C[3], 0.06 + 0.02 * pulse);
  // motes lift off the leaves and drift up
  cycle(t, meta.duration, 9, o.seed, 0.9, (age, life, r) => {
    const k = age / life, phi = r.range(-1.3, 1.3), lat = r.range(0.1, 1.2), [x0, y0] = onDome(phi, lat);
    const x = x0 + Math.sin(k * 5 + r.range(0, TAU)) * 1.5, y = y0 - k * 9;
    const c = r.chance(0.35) ? G[2] : C[4];
    if (k < 0.8 || ((age * 24) | 0) % 2) p.px(x, y, k < 0.5 ? c : C[3]);
    p.light(x, y, c, 0.5 * (1 - k));
  });
}
