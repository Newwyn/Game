// Eight ground marks for a fire mage, one per frame (frame i = mark i), each lying flat on the floor seen from a
// low angle (ellipses four times wider than tall), except the last, an upright icon:
// 0 warning ring, 1 scorched patch, 2 dim magic circle, 3 the same circle lit, 4 fiery summoning circle,
// 5 fire shockwave ring, 6 ground slam crack burst, 7 cracked shield (armor break).
// Drawn at the hero's pixel density (about 30 px per game unit; the marks are stretched over ~10 units in game),
// so the rings are 1 px lines and the rune band holds real little glyphs.
import { fit, clamp, WHITE, TAU, rng, rand, fbm } from "../../core/index.js";
import { hotFirst, flameTongue, ember, solid, LAYERS, BACK_LAYERS } from "./_lib.js";

export const meta = {
  name: "Ignar ground",
  desc: "Eight static fire ground marks, one per frame: warning ring, scorch, dim and lit magic circle, summoning circle, shockwave ring, slam burst, cracked shield icon.",
  tags: ["fire", "ground", "decal", "circle", "marker", "icon", "set"],
  size: [288, 96],
  origin: [144, 58],
  duration: 1,
  loop: true,
  fps: 8,
  bg: "dark",
  options: {
    palette: ["#2a0a05", "#6b1408", "#b8260b", "#f05a10", "#ff7a18", "#ff9a1f", "#ffd84a", "#fff6c8", "#ffffff"],
    metal: ["#15131c", "#2e2b38", "#4f4b5e", "#837e94", "#c4c0d2", "#f2f0f8"],
    seed: 2,
  },
};

const SQ = 4; // the floor is squashed four to one
const MARKS = 8;
const R0 = 132; // the outer radius every mark is laid out against (px across; R0 / SQ px deep)
// small floor flames with no white heart, so a row of them doesn't fizz with white
const LOW = [[1, 1, 6], [0.72, 0.8, 4], [0.42, 0.55, 2]];
const LOWB = [[1, 1, 7], [0.72, 0.8, 5], [0.42, 0.55, 4]];

// a clean 1 px ellipse outline (the inner edge of a filled ellipse); c may be a function of the angle
function ell(p, rx, ry, c) {
  // row by row: a pixel is on the outline when it is inside and a 4-neighbour is not
  const W = (yc) => (Math.abs(yc) > ry ? -1 : rx * Math.sqrt(1 - (yc * yc) / (ry * ry))), fc = typeof c === "function";
  for (let j = Math.floor(-ry - 1); j <= Math.ceil(ry + 1); j++) {
    const yc = j + 0.5, w = W(yc);
    if (w < 0) continue;
    const inner = Math.min(w - 1, W(yc - 1), W(yc + 1));
    // only the two short spans at the row's ends: inner < |xc| <= w
    for (let i = Math.floor(Math.max(0, inner) - 0.5); i <= Math.ceil(w); i++) {
      const ax = i + 0.5;
      if (ax > w || ax <= inner) continue;
      for (const xc of ax === 0 ? [ax] : [-ax, ax]) {
        const col = fc ? c(Math.atan2(yc * (rx / ry), xc), xc, yc) : c;
        if (col) p.px(xc, yc, col);
      }
    }
  }
}
const ring = (p, r, c) => ell(p, r, r / SQ, c);
// a floor band between flattened radii r0..r1: fn(r, ang, x, y) returns a color or 0 (row spans, no shader)
function band(p, r0, r1, fn) {
  const D = Math.ceil(r1 / SQ) + 1;
  for (let j = -D; j <= D; j++) {
    const yc = j + 0.5, Y = yc * SQ, w1 = r1 * r1 - Y * Y;
    if (w1 < 0) continue;
    const xo = Math.sqrt(w1), w0 = r0 * r0 - Y * Y, xi = w0 > 0 ? Math.sqrt(w0) : -1;
    for (let i = Math.floor(-xo - 1); i <= Math.ceil(xo); i++) {
      const xc = i + 0.5, ax = Math.abs(xc);
      if (ax > xo || ax < xi) continue;
      const c = fn(Math.sqrt(xc * xc + Y * Y), Math.atan2(Y, xc), xc, yc);
      if (c) p.px(xc, yc, c);
    }
  }
}
// a flame tongue along (ux, uy), like flameBlade in ./_lib.js but stepped a little coarser (still gap-free)
function blade(p, x, y, ux, uy, len, w, N, n, H, layers, jit, wob) {
  const nx = -uy, ny = ux, st = 0.7;
  for (const [lw, lh, ri] of layers) {
    const L = len * lh, c = H[ri];
    for (let r = 0; r <= L; r += st) {
      const u = r / Math.max(1, L);
      const half = w * lw * Math.pow(1 - u, 0.85) * Math.min(1, (r + 1.5) / 3.5) + N(9, n, r * 0.45) * jit;
      if (half < 0.3) continue;
      const off = N(4, n + 7, r * 0.2) * u * wob, cx = x + ux * r + nx * off, cy = y + uy * r + ny * off;
      for (let q = -half; q <= half; q += st) p.px(cx + nx * q, cy + ny * q, c);
    }
  }
}
// a pool of light on the floor (like floorLight in ./_lib.js, as a tight loop: these pools are wide)
function pool(p, rx, ry, c, k) {
  const cx = p.toX(0, 0), cy = p.toY(0, 0);
  for (let sy = Math.floor(cy - ry); sy <= Math.ceil(cy + ry); sy++) {
    const dy = (sy + 0.5 - cy) / ry;
    for (let sx = Math.floor(cx - rx); sx <= Math.ceil(cx + rx); sx++) {
      const dx = (sx + 0.5 - cx) / rx, d = dx * dx + dy * dy;
      if (d >= 1) continue;
      const f = 1 - Math.sqrt(d);
      p.add(sx, sy, c, f * f * k);
    }
  }
}
const onFloor = (r, a) => [Math.cos(a) * r, (Math.sin(a) * r) / SQ];
// a line on the floor between flattened polar points
function floorLine(p, r0, a0, r1, a1, c) {
  const [x0, y0] = onFloor(r0, a0), [x1, y1] = onFloor(r1, a1);
  p.line(x0, y0, x1, y1, c);
}

// rune glyphs, 5 x 5, drawn upright on the floor band (made-up sigils, read as "runes" at a glance)
const GLYPHS = [
  ["..#..", ".#.#.", "#.#.#", ".#.#.", "..#.."],
  ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  ["..#..", "#.#.#", ".###.", "..#..", ".#.#."],
  ["#..#.", "#.#..", "##...", "#.#..", "#..#."],
  ["..#..", "..##.", "..#.#", "..##.", "..#.."],
  ["#....", "##...", "#.#..", "#..#.", "#####"],
  [".###.", "#...#", "..#..", "#...#", ".###."],
  ["#.#.#", ".###.", "..#..", ".###.", "#.#.#"],
  ["##.##", "..#..", ".###.", "..#..", "##.##"],
  ["#...#", ".#.#.", "..#..", "..#..", ".###."],
  ["###..", "..#..", "..###", "..#..", "###.."],
  [".#.#.", ".#.#.", "#####", "..#..", "..#.."],
];
function glyph(p, x, y, k, c, shadow) {
  const g = GLYPHS[k % GLYPHS.length], X = Math.round(x) - 2, Y = Math.round(y) - 2;
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
    if (g[j][i] !== "#") continue;
    if (shadow) p.px(X + i, Y + j + 1, shadow);
  }
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (g[j][i] === "#") p.px(X + i, Y + j, c);
}

// 40 angles evenly spaced by arc length round the rune band's ellipse (starting at angle 0)
const ARC = (() => {
  const M = 4000, cum = [0];
  for (let k = 1; k <= M; k++) {
    const [x0, y0] = onFloor(115.5, ((k - 1) / M) * TAU), [x1, y1] = onFloor(115.5, (k / M) * TAU);
    cum.push(cum[k - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const out = [];
  for (let i = 0, k = 0; i < 40; i++) {
    const want = (i / 40) * cum[M];
    while (cum[k] < want) k++;
    out.push((k / M) * TAU);
  }
  return out;
})();

// the magic circle, in three strengths: 0 dim, 1 lit, 2 blazing
function magicCircle(p, H, lit) {
  // [ring, ring hot, white accents, deep lines, band fill]
  const [main, hot, white, deep] = lit === 0 ? [H[6], H[6], H[5], H[7]] : lit === 1 ? [H[3], H[2], H[1], H[5]] : [H[2], H[1], H[0], H[4]];
  if (lit) {
    pool(p, 138, 36, H[3], lit === 1 ? 0.28 : 0.42);
    p.glow(0, 0, 44, H[3], lit === 1 ? 0.1 : 0.16);
  }
  // the rune band between two double rings
  ring(p, 131, deep);
  ring(p, 128, main);
  ring(p, 103, main);
  ring(p, 100, deep);
  // glyphs round the band, upright, skipping the four quarter jewels
  // spaced evenly along the ellipse (by arc length, not angle), so the sides aren't crowded
  ARC.forEach((a, i) => {
    if (i % 10 === 0) return;
    const [x, y] = onFloor(115.5, a);
    glyph(p, x, y, i * 7 + 3, lit ? (i % 3 ? main : hot) : main, 0);
  });
  // a hexagram inscribed in the inner ring, squashed onto the floor
  for (const off of [-Math.PI / 2, Math.PI / 2]) {
    const pts = [0, 1, 2, 3].map((k) => onFloor(98, off + (k * TAU) / 3));
    p.polyline(pts, lit ? deep : H[7]);
  }
  // an inner ring with ticks
  ring(p, 66, main);
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU;
    floorLine(p, 66, a, i % 4 === 0 ? 76 : 71, a, i % 4 === 0 ? hot : deep);
  }
  ring(p, 58, deep);
  // an eight-point compass star, its long points reaching the inner ring
  const star = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU, r = k % 4 === 0 ? 52 : k % 2 === 0 ? 30 : 13;
    star.push(onFloor(r, a));
  }
  p.polyline([...star, star[0]], lit ? main : deep);
  // the hub: two rings round a sigil
  ring(p, 24, hot);
  ring(p, 18, deep);
  const sig = ["..#.#..", ".#.#.#.", "#..#..#", ".#.#.#.", "..###.."];
  for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) if (sig[j][i] === "#") p.px(i - 3, j - 3, lit ? white : hot);
  // jewels at the four quarters of the rune band
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU, [x, y] = onFloor(115.5, a);
    p.px(x, y - 2, deep), p.px(x - 2, y, deep), p.px(x + 2, y, deep), p.px(x, y + 2, deep);
    p.px(x, y - 1, hot), p.px(x - 1, y, hot), p.px(x + 1, y, hot), p.px(x, y + 1, hot), p.px(x, y, lit ? white : hot);
    if (lit) p.glow(x, y, 8, H[2], 0.4);
  }
  if (lit) {
    // light running along the rings
    p.glow(-100, -4, 30, H[2], 0.1), p.glow(100, 4, 30, H[2], 0.1), p.glow(0, 0, 26, H[1], 0.2 * lit);
  }
}

const marks = [
  // 0: the warning ring, a red-orange ellipse with an inner dashed ring and four chevrons pointing in
  (p, H) => {
    pool(p, 134, 34, H[5], 0.22);
    ring(p, 131, H[6]);
    ring(p, 129, (a) => (Math.cos(a * 8) > 0.94 ? H[2] : H[3]));
    ring(p, 127, H[5]);
    // a dashed inner ring
    ring(p, 112, (a) => (Math.sin(a * 36) > 0 ? H[5] : 0));
    // chevrons: > and < at the sides, v and ^ at the back and front, squashed by the floor
    const side = (x, d) => {
      for (let j = 0; j < 3; j++) {
        const cx = x + d * j * 4;
        for (let k = 0; k < 5; k++) {
          p.px(cx + d * k, -k * 0.6, j ? H[4] : H[2]), p.px(cx + d * k, k * 0.6, j ? H[4] : H[2]);
          p.px(cx + d * k - d, -k * 0.6, H[6]), p.px(cx + d * k - d, k * 0.6, H[6]);
        }
      }
    };
    side(-120, 1), side(120, -1);
    const fb = (y, d) => {
      for (let k = 0; k < 9; k++) {
        p.px(-k, y + d * k * 0.3, H[2]), p.px(k, y + d * k * 0.3, H[2]);
        p.px(-k, y + d * k * 0.3 - d, H[6]), p.px(k, y + d * k * 0.3 - d, H[6]);
      }
    };
    fb(-26, -1), fb(26, 1);
    for (const [x, y] of [[-112, 0], [112, 0], [0, -27], [0, 27]]) p.glow(x, y, 12, H[3], 0.35);
    for (let i = 0; i < 8; i++) {
      const [x, y] = onFloor(129, (i / 8) * TAU + TAU / 16);
      p.glow(x, y, 8, H[3], 0.25);
    }
  },
  // 1: a scorched patch, char broken into plates by glowing cracks, embers and a few small flames
  (p, H, o) => {
    const S = o.seed;
    pool(p, 124, 32, H[4], 0.12);
    // voronoi plates in the flattened floor: cracks where two cells meet
    // plates: one jittered seed per grid cell (in the floor's own space, X across, Y deep), nearest two found
    // among the 3 x 3 cells round a pixel
    const G = 19, GX = 10, GY = 7, SX = new Float32Array((2 * GX + 1) * (2 * GY + 1)), SY = SX.slice();
    for (let j = -GY; j <= GY; j++) for (let i = -GX; i <= GX; i++) {
      const k = (j + GY) * (2 * GX + 1) + i + GX;
      SX[k] = (i + 0.15 + 0.7 * rand(i, j, S)) * G, SY[k] = (j + 0.15 + 0.7 * rand(i, j, S + 1)) * G;
    }
    // the patch's ragged edge, by angle (a table, so the noise isn't run per pixel)
    const EDGE = new Float32Array(721);
    for (let k = 0; k <= 720; k++) {
      const ang = (k / 720) * TAU - Math.PI;
      EDGE[k] = 112 + fbm(Math.cos(ang) * 2.2 + 3, Math.sin(ang) * 2.2 + 3, S, 3) * 40;
    }
    p.shade(-134, -36, 134, 36, (x, y) => {
      const X = x, Y = y * SQ, r = Math.sqrt(X * X + Y * Y);
      if (r > 152) return;
      const ang = Math.atan2(Y, X);
      const edge = EDGE[Math.round(((ang + Math.PI) / TAU) * 720)];
      if (r > edge) return;
      let f1 = 1e9, f2 = 1e9, id = 0, idY = 0;
      const Yq = Y * 0.6, ci = Math.floor(X / G), cj = Math.floor(Yq / G);
      for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) {
        const q = (j + GY) * (2 * GX + 1) + i + GX, sx = SX[q], sy = SY[q], dx = X - sx, dy = Yq - sy, d = Math.sqrt(dx * dx + dy * dy);
        if (d < f1) (f2 = f1), (f1 = d), (id = i * 131 + j), (idY = sy / 0.6);
        else if (d < f2) f2 = d;
      }
      const rim = r / edge, crack = f2 - f1;
      // the cracks: 1 px, white-hot near the heart, cooling to red toward the rim
      if (crack < 1.6 && rim < 0.88) return rim < 0.25 ? H[1] : rim < 0.45 ? H[2] : rim < 0.65 ? H[4] : H[6];
      if (crack < 3.2 && rim < 0.6) return H[7];
      // the ragged edge: soot crumbling into the floor
      if (rim > 0.9) return rand(Math.floor(x), Math.floor(y * 2), S) > 0.55 ? H[8] : undefined;
      // plates: char, the ones near the heart still glowing, their far edge catching light
      const lip = crack < 6 && Y < idY;
      return rim < 0.3 && rand(id, S) > 0.55 ? H[6] : lip ? H[7] : H[8];
    });
    p.glow(0, 0, 50, H[3], 0.14);
    // small flames still licking at the cracks
    const N = (rate, seed = 0, off = 0) => Math.sin(off * 1.7 + seed) * 0.6;
    for (const [x, y, h] of [[-78, -9, 14], [52, -12, 18], [94, 5, 10], [-24, 11, 9], [10, -4, 12], [-104, 6, 7]]) flameTongue(p, x, y, h, 3.4, 2, N, S + x, H, y < 0 ? BACK_LAYERS : LAYERS, 0.5, 0.8);
    const R2 = rng(S, 12), EMB = [H[1], H[2], H[4], H[6]];
    for (let i = 0; i < 18; i++) ember(p, R2.range(-110, 110), R2.range(-40, -6), R2.range(0.4, 1), R2.chance(0.3) ? 2 : 1, EMB, 1);
  },
  // 2: the magic circle, dim
  (p, H) => magicCircle(p, H, 0),
  // 3: the magic circle, lit
  (p, H) => magicCircle(p, H, 1),
  // 4: a fiery summoning circle: the circle blazing, flames all round its rim, a bright star at the middle
  (p, H, o) => {
    const S = o.seed, N = (rate, seed = 0, off = 0) => Math.sin(off * 1.3 + seed * 0.7) * 0.7;
    const sites = [];
    for (let i = 0; i < 46; i++) {
      const a = ((i + rand(i, S + 7) * 0.7) / 46) * TAU, [x, y] = onFloor(131, a), big = rand(i, S + 8);
      sites.push({ x, y, back: y < 0, h: 6 + 6 * Math.abs(Math.cos(a)) + 12 * big * big, w: 2.6 + 1.6 * big, sx: (rand(i, S + 9) - 0.5) * 6, n: S * 9 + i });
    }
    sites.sort((u, v) => u.y - v.y);
    for (const s of sites) if (s.back) flameTongue(p, s.x, s.y, s.h * 0.75, s.w, s.sx, N, s.n, H, LOWB, 0.5, 0.8);
    magicCircle(p, H, 2);
    // the star at the hub, standing a little proud
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU, L = i % 2 ? 26 : 48, [x, y] = onFloor(L, a);
      p.line(0, 0, x, y, i % 2 ? H[2] : H[1]);
    }
    solid(p, 0, -1, 2.5, H[1]), p.px(0, -1, H[0]), p.px(-1, -1, H[0]), p.px(1, -1, H[0]);
    p.glow(0, 0, 30, H[1], 0.4);
    for (const s of sites) if (!s.back) flameTongue(p, s.x, s.y, s.h * 0.85, s.w, s.sx, N, s.n, H, LOW, 0.5, 0.8);
  },
  // 5: an expanding shockwave ring of fire: a hot leading edge, flame tongues leaning outward, a dying trail inside
  (p, H, o) => {
    const S = o.seed, N = (rate, seed = 0, off = 0) => Math.sin(off * 1.9 + seed * 0.3) * 0.7;
    pool(p, 136, 36, H[4], 0.28);
    const RAG = new Float32Array(1441);
    for (let k = 0; k <= 1440; k++) {
      const a = (k / 1440) * TAU - Math.PI;
      RAG[k] = fbm(Math.cos(a) * 4 + 9, Math.sin(a) * 4 + 9, S + 4, 3) * 0.22;
    }
    band(p, 64, 132, (r, a, x, y) => {
      const u = (r - 64) / 68, rag = RAG[Math.round(((a + Math.PI) / TAU) * 1440)];
      const v = u + rag;
      if (v < 0.35) return v > 0.22 && rand(Math.floor(x), Math.floor(y * 2), S) > 0.7 ? H[7] : 0;
      // streaks of heat dragged outward: a stripe pattern by angle, broken by the noise
      const streak = Math.sin(a * 60 + rag * 30) > 0.6 ? 1 : 0;
      return v < 0.5 ? (streak ? H[6] : H[7]) : v < 0.64 ? (streak ? H[5] : H[6]) : v < 0.76 ? (streak ? H[4] : H[5]) : v < 0.86 ? H[4] : v < 0.94 ? H[2] : H[1];
    });
    ring(p, 132, (a) => (Math.sin(a) > 0 ? H[1] : H[2]));
    ring(p, 134, H[6]);
    // tongues along the ring, leaning outward, the far ones dimmer and drawn first
    const sites = [];
    for (let i = 0; i < 30; i++) {
      const a = ((i + rand(i, S + 2) * 0.6) / 30) * TAU, [x, y] = onFloor(126, a);
      sites.push({ x, y, a, h: 8 + 12 * rand(i, S + 3) + 5 * Math.abs(Math.cos(a)), n: S * 5 + i });
    }
    sites.sort((u, v) => u.y - v.y);
    for (const s of sites) flameTongue(p, s.x, s.y, s.h, 3.4, Math.cos(s.a) * 6, N, s.n, H, s.y < 0 ? LOWB : LOW, 0.5, 0.8);
    p.glow(-114, 0, 30, H[2], 0.2), p.glow(114, 0, 30, H[2], 0.2), p.glow(0, 30, 40, H[2], 0.16);
  },
  // 6: a ground slam: cracks shooting out from a white-hot point, a fan of flame spikes, rocks thrown up
  (p, H, o) => {
    const S = o.seed, R = rng(S, 66), N = (rate, seed = 0, off = 0) => Math.sin(off * 2.1 + seed) * 0.6;
    pool(p, 120, 30, H[3], 0.4);
    // a scorched blot and radial cracks on the floor, forking as they run out
    band(p, 0, 54, (r, a) => (r < 54 - 18 * rand(Math.floor(a * 9), S) ? H[8] : 0));
    const crack = (r, a, len, depth) => {
      while (r < len) {
        const r2 = r + R.range(8, 15), a2 = a + R.range(-0.12, 0.12);
        const c = r < 30 ? H[1] : r < 55 ? H[2] : r < 80 ? H[4] : H[6];
        floorLine(p, r, a, r2, a2, c);
        if (r < 60) floorLine(p, r, a + 0.01, r2, a2 + 0.01, H[7]);
        if (depth < 1 && R.chance(0.3)) crack(r2, a2 + R.range(-0.4, 0.4), r2 + R.range(14, 26), depth + 1);
        r = r2, a = a2;
      }
    };
    for (let i = 0; i < 13; i++) crack(5, (i / 13) * TAU + R.range(-0.2, 0.2), R.range(50, 100), 0);
    // the fan of flame spikes, tall in the middle, leaning out at the sides
    for (let i = 0; i < 15; i++) {
      const u = (i / 14) * 2 - 1, ux = u * 0.95, uy = -Math.sqrt(Math.max(0.05, 1 - ux * ux)) * 0.9;
      const len = (46 - Math.abs(u) * 24) * R.range(0.78, 1), L = Math.hypot(ux, uy);
      blade(p, u * 10, 0, ux / L, uy / L, len, 3.4, N, S * 3 + i, H, Math.abs(u) > 0.55 ? BACK_LAYERS : LAYERS, 0.5, 0.7);
    }
    // the white-hot heart of the blow
    solid(p, 0, -2, 8, H[2]), solid(p, 0, -2, 5, H[1]), solid(p, 0, -2, 2.5, H[0]);
    p.line(-26, 0, 26, 0, H[1]), p.line(-16, 1, 16, 1, H[0]);
    p.glow(0, -4, 44, H[2], 0.45), p.glow(0, -2, 14, WHITE, 0.45);
    // rocks thrown up, dark with an outline and a lit top edge
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1, x = side * R.range(22, 80), y = -R.range(4, 34) * (1 - Math.abs(x) / 110), s = R.range(1.8, 3.6);
      // an angular chunk: 5 corners at jittered angles, a dark outline, a lit top face, a hot edge
      const rot = R.range(0, TAU), pts = [0, 1, 2, 3, 4].map((k) => {
        const a = rot + (k / 5) * TAU + R.range(-0.3, 0.3), rr = s * R.range(0.75, 1.15);
        return [x + Math.cos(a) * rr * 1.2, y + Math.sin(a) * rr];
      });
      p.poly(pts, H[8]);
      p.poly(pts.map(([px, py]) => [x + (px - x) * 0.6, y + (py - y) * 0.6 - 0.5]), H[7]);
      p.line(x - s * 0.8, y - s * 0.55, x + s * 0.3, y - s * 0.75, H[4]);
      p.px(x - side * s * 0.3, y - s * 0.7, H[2]);
    }
    const EMB = [H[1], H[2], H[4], H[6]];
    for (let i = 0; i < 16; i++) ember(p, R.range(-60, 60), -R.range(8, 46), R.range(0.5, 1), R.chance(0.25) ? 2 : 1, EMB, 1);
  },
  // 7: armor break: a cracked shield standing upright in the middle, shards breaking off, a down arrow
  (p, H, o) => {
    const M = fit(o.metal, 6), cy = 48 - meta.origin[1]; // the canvas's vertical middle
    p.glow(0, cy, 22, H[4], 0.2);
    // the shield: a heater shape, rim, face lit from the top left
    const shield = (x, y) => {
      const yy = y - cy;
      if (yy < -10 || yy > 10) return false;
      const half = yy < 2 ? 8 : 8 * Math.sqrt(Math.max(0, 1 - (yy - 2) / 8.5));
      return Math.abs(x) <= half && !(yy < -9 && Math.abs(x) > 7);
    };
    // the crack: a jagged line down the middle, the right half knocked a pixel down and out
    const crackX = (yy) => [-1, 0, 1, 0, -1, -2, -1, 0, 1, 1, 0, -1, 0, 1, 0, -1, 0, 0, 1, 0, 0][clamp(Math.round(yy + 10), 0, 20)];
    p.shade(-11, cy - 12, 11, cy + 13, (x, y) => {
      const yy = y - cy, cx = crackX(yy), right = x > cx + 0.5;
      const sx = right ? x - 1 : x, sy = right ? y - 1 : y;
      if (Math.abs(x - cx) < 0.6) return Math.abs(yy) < 9 ? H[3] : undefined;
      if (!shield(sx, sy)) return;
      const edge = !shield(sx - 1, sy) || !shield(sx + 1, sy) || !shield(sx, sy - 1) || !shield(sx, sy + 1);
      if (edge) return M[0];
      const e2 = !shield(sx - 2, sy) || !shield(sx + 2, sy) || !shield(sx, sy - 2) || !shield(sx, sy + 2);
      if (e2) return sx + (sy - cy) < 0 ? M[4] : M[2];
      const lit = -(sx * 0.08) - (sy - cy) * 0.09;
      return lit > 0.5 ? M[4] : lit > 0 ? M[3] : lit > -0.6 ? M[2] : M[1];
    });
    // glow leaking from the crack
    p.glow(0, cy, 8, H[2], 0.35);
    for (let yy = -8; yy <= 8; yy += 4) p.px(crackX(yy), cy + yy, H[1]);
    // shards flying off
    for (const [x, y, s] of [[12, cy - 6, 1], [13, cy + 1, 0], [-12, cy - 3, 0], [11, cy + 6, 0]]) {
      p.px(x, y, M[4]), p.px(x + 1, y, M[2]);
      if (s) p.px(x, y + 1, M[2]), p.px(x + 1, y - 1, M[3]);
    }
    // the down arrow, bottom right, red-hot with a dark outline
    const ax = 13, ay = cy + 9;
    p.rect(ax - 2, ay - 7, 5, 5, H[8]), p.tri(ax - 4.5, ay - 2.5, ax + 5.5, ay - 2.5, ax + 0.5, ay + 3, H[8]);
    p.rect(ax - 1, ay - 6, 3, 4, H[4]), p.tri(ax - 3, ay - 2, ax + 4, ay - 2, ax + 0.5, ay + 1.6, H[4]);
    p.line(ax - 1, ay - 6, ax - 1, ay - 3, H[2]);
    p.glow(ax, ay - 2, 6, H[4], 0.3);
  },
];

export function draw(p, t, o) {
  const H = hotFirst(fit(o.palette, 9));
  const i = clamp(Math.floor((t / meta.duration) * MARKS + 1e-6), 0, MARKS - 1);
  marks[i](p, H, o);
}
