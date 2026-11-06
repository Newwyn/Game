// Sylva's leaf dart: a small enchanted leaf blade flying right, spinning on its long axis, a thin gold vein down
// its middle, shedding mint sparkles and towing a little tumbling leaf in its wake. Original design for Legend of Capsules.
import { cycle, fit, hex, clamp, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Sylva leaf dart",
  desc: "A sharp glowing leaf blade flies right, fluttering as it spins along its length, a gold vein down its middle; mint sparkles and one little leaf trail behind it.",
  tags: ["nature", "projectile", "leaf", "magic", "directional", "loop"],
  size: [32, 16],
  origin: [22, 8],
  duration: 0.3,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0f2e1a", "#166534", "#22c55e", "#4ade80", "#bbf7d0", "#f0fdf4"],
    gold: ["#a16207", "#facc15", "#fde68a"],
    seed: 3,
  },
};

const D = meta.duration;

// a pointed leaf blade centred on (x, y), length len, half width hw (may be tiny when edge on), turned by ang.
// face > 0 shows the bright top, < 0 the paler underside. The vein runs tip to stem in gold.
function blade(p, x, y, len, hw, ang, face, C, G, a = 1, bend = 0) {
  const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.ceil(len / 2 + 2), X = Math.round(x), Y = Math.round(y);
  const w = Math.max(0.5, hw);
  const uv = (i, j) => {
    const dx = i + 0.5 - (x - X), dy = j + 0.5 - (y - Y);
    const u = dx * ca + dy * sa + len / 2, q = u / len - 0.45;
    return [u, -dx * sa + dy * ca + bend * q * q * 4];
  };
  const inside = (i, j) => {
    const [u, v] = uv(i, j);
    if (u < 0 || u > len) return false;
    // fuller towards the back, a long sharp point at the front (u = len)
    const k = u / len, half = w * Math.sin(Math.PI * Math.pow(k, 0.85)) * (1.15 - 0.3 * k);
    return Math.abs(v) <= half + 0.15;
  };
  for (let j = -R; j <= R; j++)
    for (let i = -R; i <= R; i++) {
      if (!inside(i, j)) {
        if (inside(i - 1, j) || inside(i + 1, j) || inside(i, j - 1) || inside(i, j + 1)) p.dot(X + i, Y + j, C[0], a);
        continue;
      }
      const [u, v] = uv(i, j), k = u / len;
      let c;
      if (Math.abs(v) < 0.5 && k > 0.18 && k < 0.85) c = w > 1.1 ? (k > 0.6 ? G[2] : G[1]) : C[4];
      else if (k > 0.93) c = WHITE; // the hot tip
      else if (k > 0.85) c = C[5];
      else if (face >= 0) c = v < 0 ? (k > 0.5 ? C[4] : C[3]) : C[2];
      else c = v < 0 ? C[3] : C[2];
      if (w <= 1.1 && Math.abs(v) < 0.6) c = k > 0.5 ? C[5] : C[4]; // edge on: a bright sliver
      p.dot(X + i, Y + j, c, a);
    }
  // stem
  p.dot(X - ca * (len / 2 + 0.8), Y - sa * (len / 2 + 0.8), C[1], a);
}

export function draw(p, t, o) {
  const C = fit(o.palette, 6).map(hex), G = fit(o.gold, 3).map(hex), ph = (t / D) * TAU;

  // the wake: a fading line of light behind the blade
  for (let x = -16; x <= -6; x++) {
    const u = (x + 16) / 10;
    p.dot(x, Math.sin(ph * 2 + x * 0.5) * 0.6, u > 0.6 ? C[3] : C[2], u * 0.8);
  }
  p.glowLine?.(-14, 0, -4, 0, 2, C[3], 0.25);

  // sparkles shed from the blade, drifting back and fading, some golden
  cycle(t, D, 9, o.seed, (g) => g.range(0.16, 0.28), (age, life, R) => {
    const k = age / life, x = -3 - age * R.range(40, 70), y = R.range(-2.5, 2.5) + Math.sin(age * 30 + R.range(0, 6)) * 0.8 + R.range(-6, 6) * age;
    const gold = R.chance(0.3), c = k < 0.3 ? WHITE : gold ? G[1] : k < 0.6 ? C[4] : C[3];
    if (k < 0.25 && R.chance(0.5)) {
      p.px(x, y, WHITE);
      p.dot(x - 1, y, c, 0.8);
      p.dot(x + 1, y, c, 0.8);
      p.dot(x, y - 1, c, 0.8);
      p.dot(x, y + 1, c, 0.8);
    } else p.dot(x, y, c, 1 - clamp((k - 0.5) / 0.5));
    p.glow(x, y, 3, gold ? G[1] : C[3], 0.3 * (1 - k));
  });

  // the little leaf following behind: turning over once per loop, bobbing
  {
    const lx = -15 + Math.sin(ph) * 1, ly = Math.sin(ph + 1) * 2.2, ang = ph + 0.6, fl = Math.cos(ph * 2);
    blade(p, lx, ly, 6, 0.6 + 1.2 * Math.abs(fl), ang, fl, C, G, 1);
    p.glow(lx, ly, 4, C[3], 0.25);
  }

  // the blade: spinning on its long axis (width breathes), a slight nose wobble, gold vein, hot tip
  const spin = Math.cos(ph * 2), hw = 1.0 + 1.6 * Math.abs(spin), ang = 0, by = Math.round(Math.sin(ph) * 0.6);
  p.glow(0, by, 10, C[2], 0.22);
  blade(p, 0, by + 0.5, 14, hw, ang, spin, C, G, 1, 1.2);
  p.glow(5, by, 3, C[4], 0.3);
  if (spin > 0.85) p.px(-1, by - 1, WHITE); // glint as it turns face on
}
