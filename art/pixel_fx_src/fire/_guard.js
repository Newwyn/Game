// The fire guardian's body, shared by fire/ignar-guard (hover loop), fire/ignar-guard-throw and fire/ignar-guard-roar
// so all three draw exactly the same spirit (the leading _ keeps the tools from listing it as an effect).
// A broad flame body with a 1 px dark outline, a charred visor with two glowing eyes, a burning heart, flame arms
// with charred bracers, a tail of fire for legs, a crest streaming back off the head. Faces right; the anchor is the
// floor under it. Laid out in half-size units (K), drawn at 1 px detail: about 30 px per game unit.
import { mix, clamp, lerp, WHITE, TAU, tileFbm } from "../../core/index.js";
import { noiseFor, looped, lick, ember, floorLight } from "./_lib.js";

/** The hover loop's length: the body's churn, bob and flicker run on this clock in every guard effect. */
export const HOVER = 0.8;
export const K = 1.5;
const NL = noiseFor(HOVER);
// crest tongues: a dark rim, red, orange, gold heart; the back ones a step darker
const CREST = [[1, 1, 7], [0.8, 0.95, 6], [0.58, 0.82, 4], [0.34, 0.6, 3], [0.14, 0.36, 1]];
const CREST_B = [[1, 1, 8], [0.78, 0.94, 7], [0.54, 0.8, 5], [0.3, 0.56, 4]];

// a flame tongue lying along (ux, uy), like flameBlade in ./_lib.js but stepped a little coarser (still gap-free)
export function blade(p, x, y, ux, uy, len, w, bend, N, n, H, layers, jit, wob) {
  if (len < 1) return;
  const nx = -uy, ny = ux, st = 0.66;
  for (const [lw, lh, ri] of layers) {
    const L = len * lh, c = H[ri];
    for (let r = 0; r <= L; r += st) {
      const u = r / Math.max(1, L);
      const half = w * lw * Math.pow(1 - u, 0.85) * Math.min(1, (r + 1.5) / 3.5) + N(9, n, r * 0.45) * jit;
      if (half < 0.3) continue;
      const off = bend * u * u * lh + N(4, n + 7, r * 0.2) * u * wob, cx = x + ux * r + nx * off, cy = y + uy * r + ny * off;
      for (let q = -half; q <= half; q += st) p.px(cx + nx * q, cy + ny * q, c);
    }
  }
}
export { CREST, CREST_B };

// distance from (x, y) to a cone-capped segment a -> b whose radius runs r0 -> r1 (negative inside)
function seg(x, y, ax, ay, bx, by, r0, r1) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const h = clamp(((x - ax) * dx + (y - ay) * dy) / l2, 0, 1);
  const ex = x - ax - dx * h, ey = y - ay - dy * h;
  return Math.sqrt(ex * ex + ey * ey) - (r0 + (r1 - r0) * h);
}
const circ = (x, y, cx, cy, r) => Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) - r;
// a smooth union, so the parts melt into one body
function smin(a, b, k = 2.5) {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return b + (a - b) * h - k * h * (1 - h);
}
const px = (f) => (x, y) => f(x / K, y / K) * K;

/** The hover's own motion at t: bob, breathing, tail swing (half-size units), and the far arm's swing. */
export function hover(t) {
  const ph = t / HOVER, bob = Math.sin(ph * TAU) * 1.5, br = Math.sin(ph * TAU * 2) * 0.3;
  const sw = (k) => Math.sin(ph * TAU - k * 1.6) * (1 + k * 2.5);
  return { ph, bob, br, sw, fs: Math.sin(ph * TAU - 0.8) * 0.8 };
}

/**
 * The guardian's pose: what differs from the hover. All in half-size units, relative to the bob.
 * lean: the upper body's shift in x (+ forward); hx, hy: the head's extra offset; tilt: the head tipped back
 * (radians, + chin up); near / far: { e, w, h } elbow, wrist and hand centre, open (an open palm, fingers along
 * the forearm); mouth 0..1; flare: crest and licks grow; fade 1..0 dissolves the body.
 * classic: the hover's own arms, bracers and fists, drawn exactly as the loop always was.
 */
export const REST = { lean: 0, hx: 0, hy: 0, tilt: 0, mouth: 0, flare: 1, fade: 1, classic: true, near: null, far: null };
export const NEAR_REST = { e: [10, -32], w: [15.5, -34.5], h: [17, -35], open: 0 };
export const farRest = (fs) => ({ e: [-10.5, -35 + fs], w: [-13.5, -28 + fs * 1.5], h: [-14, -26 + fs * 1.5] });

const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const lerpArm = (a, b, u) => {
  const o = { e: lp(a.e, b.e, u), w: lp(a.w, b.w, u), h: lp(a.h, b.h, u), open: lerp(a.open ?? 0, b.open ?? 0, u) };
  // fingers swing from one key's direction to the next (a missing one is along the forearm)
  if (a.fd || b.fd) {
    const dir = (A) => A.fd ?? [A.h[0] - A.w[0], A.h[1] - A.w[1]], da = dir(a), db = dir(b), la = Math.hypot(...da) || 1, lb = Math.hypot(...db) || 1;
    o.fd = [lerp(da[0] / la, db[0] / lb, u), lerp(da[1] / la, db[1] / lb, u)];
  }
  return o;
};
/** A pose between a and b (u 0..1); arms default to the rest arms. */
export function mixPose(a, b, u, fs) {
  const A = { ...REST, ...a }, B = { ...REST, ...b }, o = {};
  for (const k of ["lean", "hx", "hy", "tilt", "mouth", "flare", "fade"]) o[k] = lerp(A[k], B[k], u);
  o.near = lerpArm(A.near ?? NEAR_REST, B.near ?? NEAR_REST, u);
  o.far = lerpArm(A.far ?? farRest(fs), B.far ?? farRest(fs), u);
  o.classic = false;
  return o;
}

/**
 * Fill a field (px distances) with layered flame: a 1 px dark outline, a red rim, then orange, gold and pale
 * yellow toward a hot centre (hx, hy), the inside churning upward. dim: a step darker throughout (far parts).
 */
function fillField(p, f, box, H, ph, S, dim, hx, hy, hr, amp = 1.6) {
  const [x0, y0, x1, y1] = box, o = dim ? 1 : 0;
  p.shade(x0, y0, x1, y1, (x, y, out) => {
    const d0 = f(x, y);
    if (d0 > amp + 1) return;
    const n = tileFbm(x * 0.19, y * 0.19 + ph * 6, 0, 6, S, 2);
    const d = d0 - n * amp;
    if (d > 1) return;
    if (d > 0) return void ((out.c = H[8]), (out.a = 1));
    // depth inside the outline, plus noise, minus a falloff away from the hot centre; light from the upper right
    const v = -d + n * 2.4 - Math.max(0, Math.sqrt((x - hx) * (x - hx) + (y - hy) * (y - hy) * 0.49) - hr) * 0.09 + (x - hx) * 0.03 - (y - hy) * 0.02 - o * 1.2;
    let i = v < 1.2 ? 6 : v < 2.8 ? 5 : v < 4.4 ? 4 : v < 6.4 ? 3 : v < 8.6 ? 2 : 1;
    // thin flame contours licking up through the body: a step darker along a stretched noise's zero line
    if (v > 1.2) {
      const m = tileFbm(x * 0.32, y * 0.11 + ph * 6, 0, 6, S + 17, 1);
      if (Math.abs(m) < 0.07) i = Math.min(7, i + 1);
      else if (Math.abs(m - 0.32) < 0.05 && i > 2) i--;
    }
    out.c = H[Math.min(8, i + o)];
    out.a = 1;
  });
}

// the fingers' direction: A.fd if given (normalised), else along the forearm
function fdir(A, ux, uy) {
  if (!A.fd) return [ux, uy];
  const l = Math.hypot(A.fd[0], A.fd[1]) || 1;
  return [A.fd[0] / l, A.fd[1] / l];
}
// an arm's field: shoulder s, elbow, wrist, then a fist (closed) or a palm with fingers and a thumb (open)
function armField(s, A, b, r, near, k1) {
  const [sx, sy] = s, [ex, ey] = A.e, [wx, wy] = A.w, [hx, hy] = A.h;
  const dx = hx - wx, dy = hy - wy, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
  const open = (A.open ?? 0) > 0.5;
  return px((x, y) => {
    y -= b;
    // a cheap bound first: far from a fat capsule over the whole arm, skip the real field
    const bd = Math.min(seg(x, y, sx, sy, ex, ey, 0, 0), seg(x, y, ex, ey, hx, hy, 0, 0)) - 8.5;
    if (bd > 2) return bd;
    let d = smin(seg(x, y, sx, sy, ex, ey, r[0], r[1]), seg(x, y, ex, ey, wx, wy, r[1], r[2]), k1);
    if (!open) return smin(d, circ(x, y, hx, hy, r[3]), 1.2);
    // an open hand: a flat palm, four fingers held together (along the forearm, or along A.fd: a palm strike
    // has the wrist bent back and the fingers up), the thumb cocked off it
    const [fx, fy] = fdir(A, ux, uy);
    d = smin(d, circ(x, y, hx, hy, r[3] * 0.78), 1);
    d = smin(d, seg(x, y, hx + fx * 0.6, hy + fy * 0.6, hx + fx * 3.6, hy + fy * 3.6, 1.35, 1), 0.8);
    if (near && !A.fd) d = Math.min(d, seg(x, y, hx - ux * 0.4, hy - uy * 0.4, hx + uy * 1.8 + ux * 1.4, hy - ux * 1.8 + uy * 1.4, 0.95, 0.7));
    if (near && A.fd) d = Math.min(d, seg(x, y, hx, hy, hx + ux * 2.2 + fx * 0.6, hy + uy * 2.2 + fy * 0.6, 0.95, 0.75));
    return d;
  });
}
const boxOf = (pts, b, m) => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
  return [(x0 - m) * K, (y0 + b - m) * K, (x1 + m) * K, (y1 + b + m) * K];
};
// a charred bracer: a band across the forearm a little behind the wrist, lit along its upper edge
function bracer(p, A, b, CHAR, CHAR2, hot, glint, len = 3.5, half = 2) {
  const [ex, ey] = A.e, [wx, wy] = A.w, dx = wx - ex, dy = wy - ey, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
  let nx = -uy, ny = ux;
  if (ny > 0) (nx = -nx), (ny = -ny); // n points up
  const cx = wx * K - ux * 1.2, cy = (wy + b) * K - uy * 1.2;
  for (let a = 0; a <= len; a += 0.5)
    for (let q = -half; q <= half; q += 0.5) p.px(cx - ux * a + nx * q, cy - uy * a + ny * q, q > half - 0.6 ? CHAR2 : CHAR);
  p.px(cx - ux * len * 0.5 - nx * 0.5, cy - uy * len * 0.5 - ny * 0.5, hot);
  p.px(cx - ux * 0.5 + nx * (half - 1), cy - uy * 0.5 + ny * (half - 1), glint);
}

// a point of the head (offset from the head's centre, half-size units) after the tilt, in px
export function headPt(G, ox, oy) {
  const c = Math.cos(-G.tilt), s = Math.sin(-G.tilt);
  return [(2 + G.lean + G.hx + ox * c - oy * s) * K, (-49 + G.hy + ox * s + oy * c) * K];
}

/**
 * Draw the guardian at t (its own clock: the hover's bob and churn run on t / HOVER) in pose G.
 * hooks.back(p, info) draws behind the body (after the far arm), hooks.front(p, info) on top of everything.
 */
export function drawGuard(p, t, o, H, G = REST, hooks = {}) {
  const S = o.seed, M = hover(t), { ph, bob, br, sw, fs } = M, b = bob, B = bob * K;
  const N = (rate, seed = 0, off = 0) => NL(t, rate, seed, off);
  const fl = 0.85 + 0.15 * N(7, S + 1), CHAR = H[8], CHAR2 = H[7], EMB = [H[1], H[2], H[4], H[6]];
  const X = (v) => v * K, Y = (v) => v * K + B; // half-size layout -> px, with the bob
  const Lx = G.lean, FL = G.flare;
  const near = G.classic ? NEAR_REST : G.near, far = G.classic ? farRest(fs) : G.far;
  const info = { b, B, X, Y, N, M, G, near, far, fl };
  const fade0 = p.fade;
  p.fade = fade0 * G.fade;

  // light: a broad warm wash and a pool on the floor beneath it
  p.glow(X(1 + Lx), Y(-34), 42, mix(H[3], WHITE, 0.15), 0.22 * fl);
  floorLight(p, 0, 0, 24, 4, H[3], 0.3 * fl);
  // the far arm, swinging a little behind the beat, a step darker, behind everything
  const fS = [-4 + Lx, -41];
  fillField(p, armField(fS, far, b, [2.8, 2.3, 2, 2.7], false, 1.2), boxOf([fS, far.e, far.w, far.h], b, 5), H, ph, S + 3, true, X(far.e[0] - 1.5), Y(G.classic ? -33 : far.e[1] + 2), 2, 0.8);
  if (G.classic) {
    // its charred bracer, a band round the forearm, and a hot crack in the fist
    const fbx = X(-12.2), fby = Y(-31 + fs * 1.2);
    p.line(fbx - 3, fby - 1, fbx + 2, fby + 1, CHAR), p.line(fbx - 3, fby, fbx + 2, fby + 2, CHAR), p.line(fbx - 3, fby + 1, fbx + 1, fby + 3, CHAR2);
    p.px(fbx - 1, fby + 1, H[4]);
    const ffx = X(-14), ffy = Y(-26 + fs * 1.5);
    p.line(ffx - 2, ffy, ffx + 1, ffy, H[7]), p.px(ffx - 1, ffy + 1, H[7]);
  } else bracer(p, far, b, CHAR, CHAR2, H[4], H[6], 3, 1.6);
  // the crest: tongues streaming up and back off the head, behind it (tipped with the head)
  const ct = Math.cos(-G.tilt), st = Math.sin(-G.tilt);
  for (let i = 0; i < 6; i++) {
    const [hx, hy] = headPt(G, 0.5 - i * 1.7, -4.5 + i * 1.2);
    const ux = -0.5 - i * 0.06, uy = -0.86 + i * 0.04;
    const len = (17 - i * 1.8) * (0.85 + 0.15 * Math.sin(ph * TAU * 2 + i * 1.7)) * FL + N(6, S + 20 + i) * 2;
    blade(p, hx, hy + B, ux * ct - uy * st, ux * st + uy * ct, len, (3.4 - i * 0.3) * (0.85 + 0.15 * FL), -3 + N(3, S + 30 + i) * 2, N, S * 19 + i, H, i % 2 ? CREST_B : CREST, 0.4, 1);
  }
  // shoulder and back licks
  for (let i = 0; i < 4; i++) {
    const x = X(-8 + i * 3.2 + Lx), len = (7 + 4 * Math.sin(ph * TAU * 2 + i * 2.1) + N(5, S + 40 + i) * 1.5) * FL;
    blade(p, x, Y(-42.5), -0.35, -1, len, 2.4, -1.5, N, S * 19 + 10 + i, H, CREST_B, 0.4, 0.7);
  }
  // licks streaming up off the back of the tail
  for (let i = 0; i < 4; i++) {
    const k = 0.42 + i * 0.16, sx = X(-1 + sw(k * 0.9) - 5.5 * (1 - k) - 3), sy = Y(-24 + k * 17) - B * k * 0.6;
    const len = 6 + 3 * Math.sin(ph * TAU * 2 + i * 2.3) + N(6, S + 60 + i) * 1.5;
    blade(p, sx, sy, -0.72, -0.69, len * (1.9 - k * 0.8), 2.6 - k * 0.9, 1.5, N, S * 19 + 50 + i, H, CREST, 0.35, 0.6);
  }
  if (hooks.back) hooks.back(p, info);
  // the body: head, shoulders and chest shift with the lean, the tail pours down and swings
  {
    const t1 = [-1 + sw(0.3), -24 + b], t2 = [-4 + sw(0.6), -16 + b * 0.7], t3 = [-1 + sw(0.85), -9 + b * 0.4], t4 = [4 + sw(1), -4.5 + b * 0.2];
    const mx = (t1[0] + t4[0]) / 2, hcx = 2 + Lx + G.hx, hcy = -49 + b + G.hy;
    const f = px((x, y) => {
      const bd = y < t1[1] ? seg(x, y, 1 + Lx, -50 + b, t1[0], t1[1], 13 + Math.abs(G.hx) + Math.abs(G.hy), 11) : seg(x, y, t1[0], t1[1], mx, t4[1], 8, 6);
      if (bd > 3) return bd;
      let d = circ(x, y, hcx, hcy, 5.3); // head
      d = smin(d, seg(x, y, -6 + Lx, -40 + b, 6 + Lx, -40 + b, 4 + br, 4 + br), 3); // shoulders
      d = smin(d, seg(x, y, Lx, -39 + b, t1[0], t1[1], 6.2 + br, 5), 3); // chest to waist
      d = smin(d, seg(x, y, t1[0], t1[1], t2[0], t2[1], 5, 3.6), 2.5);
      d = smin(d, seg(x, y, t2[0], t2[1], t3[0], t3[1], 3.6, 2.4), 2);
      d = smin(d, seg(x, y, t3[0], t3[1], t4[0], t4[1], 2.4, 0.5), 1.5);
      return d;
    });
    fillField(p, f, [-19 + Math.min(0, Lx + G.hx) * K, Y(-60 + Math.min(0, G.hy)), 18 + Math.max(0, Lx + G.hx) * K, -1], H, ph, S, false, X(1 + Lx), Y(-37), 7);
  }
  // the heart burning in the chest: a dark socket, a white core, little rays
  const hb = 0.8 + 0.2 * Math.sin(ph * TAU * 2), cx = X(1 + Lx * 0.8), cy = Y(-36);
  p.circle(cx, cy, 4.6 * hb + 0.6, H[6]);
  p.circle(cx, cy, 3.6 * hb + 0.4, H[3]);
  p.circle(cx, cy, 2.8 * hb + 0.4, H[2]);
  p.circle(cx, cy, 2 * hb + 0.4, H[1]);
  p.px(cx, cy, H[0]), p.px(cx - 1, cy, H[0]), p.px(cx, cy - 1, H[0]), p.px(cx - 1, cy - 1, H[0]);
  for (const [dx, dy] of [[0, -7], [6, -1], [-7, 0], [1, 6]]) p.px(cx + dx * hb, cy + dy * hb, H[1]);
  p.glow(cx, cy, 14, H[2], 0.4 * hb), p.glow(cx, cy, 4, WHITE, 0.3 * hb);
  // charred plates: a belt where the body turns to tail, with a hot buckle
  p.line(X(-6.5), Y(-27), X(4.5), Y(-26), CHAR), p.line(X(-6.5), Y(-27) + 1, X(4.5), Y(-26) + 1, CHAR), p.line(X(-6), Y(-27) + 2, X(4), Y(-26) + 2, CHAR2);
  p.rect(X(-1) - 1, Y(-26.5), 3, 3, H[7]), p.px(X(-1), Y(-26.5) + 1, H[2]);
  // the near arm and its hand
  const nS = [6 + Lx, -40];
  fillField(p, armField(nS, near, b, [3.2, 2.8, 2.4, 3.1], true, 1.5), boxOf([nS, near.e, near.w, near.h], b, 5.5), H, ph, S + 5, false, X(near.e[0] + 2), Y(near.e[1] - 3), 3, 0.7);
  // a pauldron on the near shoulder, lit along its top edge
  const PX = (v) => X(v + Lx);
  p.poly([[PX(4), Y(-44.5)], [PX(9.5), Y(-45.5)], [PX(11.5), Y(-41)], [PX(7), Y(-38.5)], [PX(3.8), Y(-40)]], CHAR);
  p.line(PX(4.6), Y(-44), PX(9.5), Y(-45), H[5]), p.line(PX(5), Y(-43), PX(9.5), Y(-43.5), CHAR2);
  p.px(PX(8), Y(-41.5), H[3]), p.px(PX(6), Y(-41), H[6]);
  if (G.classic) {
    // the near bracer and the knuckles
    const bx = X(12.3), by = Y(-36.5);
    p.rect(bx, by, 4, 5, CHAR), p.line(bx, by, bx + 3, by, CHAR2), p.px(bx + 1, by + 2, H[3]), p.px(bx + 3, by + 3, H[6]);
    p.line(X(17.8), Y(-36.5), X(17.8), Y(-33.5), H[6]), p.line(X(16.6), Y(-36.8), X(16.6), Y(-33.2), H[7]);
  } else {
    bracer(p, near, b, CHAR, CHAR2, H[3], H[6]);
    const [hx, hy] = near.h;
    if ((near.open ?? 0) <= 0.5) {
      // knuckles of the fist, facing the way the forearm points
      p.line(X(hx + 0.8), Y(hy - 1.5), X(hx + 0.8), Y(hy + 0.5), H[6]);
    } else if (near.fd) {
      // the fingers held up: two dark creases between them, a lit edge on the leading finger
      const [ux, uy] = fdir(near, 0, 0), nx = -uy, ny = ux;
      for (const q of [-0.55, 0.45]) p.line(X(hx + ux * 2.2 + nx * q), Y(hy + uy * 2.2 + ny * q), X(hx + ux * 3.6 + nx * q), Y(hy + uy * 3.6 + ny * q), H[6]);
      p.line(X(hx + ux * 1.2 + nx * 1.1), Y(hy + uy * 1.2 + ny * 1.1), X(hx + ux * 3.4 + nx * 1.1), Y(hy + uy * 3.4 + ny * 1.1), H[1]);
    }
  }
  // the face: a charred visor with a ridge, two glowing eyes looking ahead (tipped with the head)
  const V = (ox, oy) => { const [x, y] = headPt(G, ox, oy); return [x, y + B]; };
  p.poly([V(-1, -2), V(6.8, -2), V(6.8, 1.2), V(4.2, 2.4), V(0, 1.6)], CHAR);
  p.line(...V(-0.5, -2.5), ...V(5.5, -2.5), CHAR2);
  p.line(...V(0, 2.2), ...V(4, 2.7), CHAR2);
  if (G.mouth > 0.05) {
    // a roaring jaw: a dark maw under the visor, glowing deep inside
    const m = G.mouth;
    p.poly([V(0.6, 2.4), V(7.4, 1.4), V(7.2, 2.4 + 4.2 * m), V(1.4, 3 + 3.2 * m)], CHAR);
    p.line(...V(1.2, 3.2 + 3 * m), ...V(7, 2.6 + 4 * m), CHAR2); // the jaw's lit lower edge
    const [ax, ay] = V(2.6, 3.2 + 1.6 * m), [bx2, by2] = V(6.2, 2.6 + 2.2 * m);
    p.line(ax, ay, bx2, by2, H[2]);
    p.line(ax + 0.5, ay + 1, bx2 - 0.5, by2 + 1, H[4]);
    p.glow((ax + bx2) / 2, (ay + by2) / 2, 5, H[1], 0.3 * m);
  }
  const blink = G.classic && Math.sin(ph * TAU) > 0.97;
  if (!blink) {
    for (const exo of [1.4, 4.6]) {
      const [exf, eyf] = V(exo, -0.3), ex = Math.round(exf), ey = Math.round(eyf);
      p.px(ex, ey, H[0]), p.px(ex + 1, ey, H[0]), p.px(ex, ey + 1, H[2]), p.px(ex + 1, ey + 1, H[1]), p.px(ex + 2, ey, H[3]);
    }
    const [gx, gy] = V(3.2, -0.3);
    const eg = 1 - 0.5 * G.mouth; // dimmer while roaring, so the open jaw reads
    p.glow(gx, Math.round(gy), 10, H[1], 0.5 * eg), p.glow(gx, Math.round(gy), 4, WHITE, 0.4 * eg);
  } else {
    const [ax, ay] = V(1.4, -0.3), [bx2] = V(5.8, -0.3);
    p.line(ax, Math.round(ay) + 1, bx2, Math.round(ay) + 1, H[3]);
  }
  // licks breaking off the tail tip and the crest
  const chx = -10 + (Lx + G.hx) * K, chy = -88 + G.hy * K;
  looped(t, HOVER, 12, S + 200, (r, i) => ({ crest: i % 2 === 0, vx: r.range(-16, -5), vy: -r.range(18, 34) * (0.8 + 0.2 * FL), s: r.range(0.8, 1.5) * (0.85 + 0.15 * FL), life: r.range(0.2, 0.3) }), (q, age) => {
    const pb = hover(t - age);
    const x = q.crest ? chx : X(4 + pb.sw(1)), y = q.crest ? chy + pb.bob * K : -7 + pb.bob * 0.3;
    const k = 1 - age / q.life, LX = x + q.vx * age, LY = y + q.vy * age;
    if (LY < -96 || LX < -32) return;
    lick(p, LX, LY, k, q.s, H);
  });
  // embers rising off the body
  looped(t, HOVER, 14, S + 400, (r) => ({ x: r.range(-15, 18), y: r.range(-66, -14), vx: r.range(-14, 6), vy: -r.range(26, 50), life: r.range(0.5, 0.8), a: r.range(0, TAU), s: r.chance(0.2) ? 2 : 1 }), (q, age) => {
    const x = q.x + q.vx * age + Math.sin(age * 8 + q.a) * 1.5, y = q.y + B + q.vy * age;
    if (y < -97 || x < -33 || x > 33) return;
    ember(p, x, y, 1 - age / q.life, q.s, EMB, age * 40 + q.a);
  });
  if (hooks.front) hooks.front(p, info);
  p.fade = fade0;
}

/**
 * The pose at t from keys [[time, pose, ease?]] (ease shapes the move arriving at that key; "snap" jumps on it).
 * Before the first key: the first pose; after the last: the last.
 */
export function poseAt(keys, t) {
  const fs = hover(t).fs;
  if (t <= keys[0][0]) return mixPose(keys[0][1], keys[0][1], 0, fs);
  for (let i = 1; i < keys.length; i++) {
    const [t1, b, e] = keys[i];
    if (t < t1) {
      const [t0, a] = keys[i - 1];
      if (e === "snap") return mixPose(a, a, 0, fs);
      const u = (t - t0) / (t1 - t0);
      return mixPose(a, b, e ? e(u) : u, fs);
    }
  }
  const last = keys[keys.length - 1][1];
  return mixPose(last, last, 0, fs);
}
