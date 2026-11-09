# ============================================================
# CẢNH NỀN TRẬN VẼ BẰNG CODE — mỗi nơi 3 lớp: xa (trời + cảnh xa, kín) · gần (bóng cây / cột, trong suốt) · đất (ô lặp)
#   uv run --no-project --with numpy --with pillow python tools/battle_bg.py [tên ...]
#   ra: src/assets/battle/<tên>_back.webp · <tên>_mid.webp · <tên>_ground.webp + battle_bg.json (màu sương / trời)
# Nét mịn: vẽ ở 2x rồi thu nhỏ; ánh sáng là lớp cộng riêng (toả mềm) như hiệu ứng Rok cũ.
# src/core/environment.js dán: lớp xa lên tấm 200x18 ở z=-50, lớp gần 150x9 ở z=-30, đất lặp trên mặt sân.
# Màu sương (fog) tự lấy từ chân lớp xa để mặt đất tan liền vào tranh.
# ============================================================
import sys, json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'assets' / 'battle'
SS = 2                                  # vẽ gấp đôi rồi thu nhỏ (khử răng cưa)
BACK = (3072, 276)                      # lớp xa (200 x 18 đơn vị)
MID = (3072, 184)                       # lớp gần (150 x 9 đơn vị)
GROUND = 512                            # ô đất lặp


def hexc(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def mix(a, b, t):
    return a + (b - a) * t


# ---------------- nhiễu mượt (lặp được theo chiều ngang) ----------------
def vnoise1(n, period, seed, octaves=4):
    rng = np.random.default_rng(seed)
    x = np.arange(n) / n
    out = np.zeros(n)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        p = period * 2 ** o
        v = rng.random(p + 1); v[-1] = v[0]
        t = x * p; i = np.floor(t).astype(int); f = t - i; f = f * f * (3 - 2 * f)
        out += amp * mix(v[i % (p + 1)], v[(i + 1) % (p + 1)], f)
        tot += amp; amp *= 0.5
    return out / tot


def vnoise2(h, w, period, seed, octaves=4):
    """Nhiễu 2D đều hai chiều: period = số ô theo cạnh NGẮN (cạnh dài nhiều ô hơn theo tỉ lệ -> hạt tròn, không bị kéo sọc)."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w)); amp, tot = 1.0, 0.0
    for o in range(octaves):
        base = period * 2 ** o
        py = max(1, round(base * h / min(h, w))); px = max(1, round(base * w / min(h, w)))
        g = rng.random((py, px))
        ys = np.arange(h) / h * py; xs = np.arange(w) / w * px
        yi = np.floor(ys).astype(int); xi = np.floor(xs).astype(int)
        fy = ys - yi; fx = xs - xi; fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
        a = g[yi % py][:, xi % px]; b = g[yi % py][:, (xi + 1) % px]
        c = g[(yi + 1) % py][:, xi % px]; d = g[(yi + 1) % py][:, (xi + 1) % px]
        out += amp * mix(mix(a, b, fx[None]), mix(c, d, fx[None]), fy[:, None])
        tot += amp; amp *= 0.5
    return out / tot


# ---------------- tấm vẽ ----------------
class Canvas:
    """Màu RGB + độ phủ A (float 0..1) + ánh sáng L (RGB cộng)."""

    def __init__(self, w, h, opaque=True):
        self.w, self.h = w * SS, h * SS
        self.rgb = np.zeros((self.h, self.w, 3))
        self.a = np.ones((self.h, self.w)) if opaque else np.zeros((self.h, self.w))
        self.L = np.zeros((self.h, self.w, 3))

    def grad(self, stops, y0=0.0, y1=1.0):
        """Dải màu dọc: stops = [(vị trí 0..1, '#hex'), ...]"""
        y = np.linspace(0, 1, self.h)
        t = np.clip((y - y0) / max(1e-6, y1 - y0), 0, 1)
        col = np.zeros((self.h, 3))
        for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
            m = (t >= p0) & (t <= p1)
            k = ((t[m] - p0) / max(1e-6, p1 - p0))[:, None]
            col[m] = mix(hexc(c0), hexc(c1), k)
        self.rgb[:] = col[:, None, :]

    def mask_poly(self, pts_list):
        im = Image.new('L', (self.w, self.h), 0); d = ImageDraw.Draw(im)
        for pts in pts_list:
            d.polygon([(x * SS, y * SS) for x, y in pts], fill=255)
        return np.asarray(im, float) / 255

    def mask_ellipses(self, ells):
        im = Image.new('L', (self.w, self.h), 0); d = ImageDraw.Draw(im)
        for cx, cy, rx, ry in ells:
            d.ellipse([(cx - rx) * SS, (cy - ry) * SS, (cx + rx) * SS, (cy + ry) * SS], fill=255)
        return np.asarray(im, float) / 255

    def mask_rects(self, rects):
        im = Image.new('L', (self.w, self.h), 0); d = ImageDraw.Draw(im)
        for x0, y0, x1, y1 in rects:
            d.rectangle([x0 * SS, y0 * SS, x1 * SS, y1 * SS], fill=255)
        return np.asarray(im, float) / 255

    @staticmethod
    def bbox(m, pad=0):
        ys = np.flatnonzero(m.any(1)); xs = np.flatnonzero(m.any(0))
        if not len(ys):
            return None
        return (max(0, ys[0] - pad), min(m.shape[0], ys[-1] + 1 + pad), max(0, xs[0] - pad), min(m.shape[1], xs[-1] + 1 + pad))

    def fill(self, m, col, alpha=1.0):
        """Đổ màu (col: '#hex' | mảng HxWx3) vào vùng mặt nạ m (chỉ tính trong khung bao — nhanh)."""
        b = self.bbox(m)
        if b is None:
            return
        y0, y1, x0, x1 = b
        c = hexc(col) if isinstance(col, str) else col[y0:y1, x0:x1]
        mm = m[y0:y1, x0:x1]
        k = (mm * alpha)[..., None]
        self.rgb[y0:y1, x0:x1] = self.rgb[y0:y1, x0:x1] * (1 - k) + c * k
        A = self.a[y0:y1, x0:x1]
        self.a[y0:y1, x0:x1] = np.maximum(A, mm * alpha) if alpha >= 1 else A + (1 - A) * mm * alpha

    def noise(self, period, seed, octaves=4):
        """Nhiễu dùng lại (tính 1 lần / cỡ) — vẽ nhanh."""
        self._nz = getattr(self, '_nz', {})
        k = (period, seed % 7, octaves)
        if k not in self._nz:
            self._nz[k] = vnoise2(self.h, self.w, period, seed % 7, octaves)
        return self._nz[k]

    def shade(self, m, top, bot, y0, y1, side=None, alpha=1.0, detail=1.0, outline=0.45, clumps=0.0, clump_period=90):
        """Đổ dải màu dọc trong vùng m + CHI TIẾT: viền sáng phía nắng (trên-trái), mép tối phía khuất (dưới-phải),
        đường viền mảnh cho rõ hình, chùm sáng tối (lá cây, đá) nếu clumps > 0."""
        bb = self.bbox(m, 8 * SS)
        if bb is None:
            return
        Y0, Y1, X0, X1 = bb
        full_m = m
        m = m[Y0:Y1, X0:X1]
        y = np.clip(((np.arange(Y0, Y1)) / SS - y0) / max(1, y1 - y0), 0, 1)[:, None, None]
        col = mix(hexc(top), hexc(bot), y) * np.ones((1, X1 - X0, 1))
        if detail:
            s = 3 * SS
            up = np.roll(np.roll(m, s, 0), s, 1)          # điểm phía trên-trái có thuộc hình không
            dn = np.roll(np.roll(m, -s, 0), -s, 1)
            rim = np.clip(m - up, 0, 1)[..., None]
            shadow = np.clip(m - dn, 0, 1)[..., None]
            col = col * (1 + rim * 0.38 * detail) * (1 - shadow * 0.32 * detail)
            if side is not None:
                s2 = int(side) * 2 * SS
                rim2 = np.clip(m - np.roll(m, s2, 1), 0, 1)[..., None]
                col = col * (1 + rim2 * 0.15)
        if clumps:
            n = self.noise(clump_period, int(top[1:3], 16))[Y0:Y1, X0:X1]
            fine = self.noise(clump_period * 3, int(bot[1:3], 16), 2)[Y0:Y1, X0:X1]   # period: số hạt theo chiều cao tranh
            v = (n * 0.7 + fine * 0.3 - 0.5) * 2
            yy = np.roll(n, 2 * SS, 0)                        # mỗi chùm: mặt trên sáng, bụng tối
            lit = np.clip((n - yy) * 6, -1, 1)
            col = col * (1 + (v * 0.25 + lit * 0.22) * clumps)[..., None]
        if outline:
            mm = (m * 255).astype(np.uint8)
            er = np.asarray(Image.fromarray(mm).filter(ImageFilter.MinFilter(3)), float) / 255
            edge = np.clip(m - er, 0, 1)[..., None]
            col = col * (1 - edge * outline)
        big = np.zeros((self.h, self.w, 3)); big[Y0:Y1, X0:X1] = np.clip(col, 0, 1.2)
        self.fill(full_m, big, alpha)

    def texture(self, m, amount, period, seed):
        n = self.noise(period, seed)[..., None]
        self.rgb = np.where(m[..., None] > 0, self.rgb * (1 + (n - 0.5) * amount * m[..., None]), self.rgb)

    def blocks(self, m, bw, bh, mortar='#2a2420', seed=0, k=0.22):
        """Xây đá từng viên trong vùng m: mỗi viên một sắc, mạch vữa, gờ sáng trên mỗi viên."""
        rng = np.random.default_rng(seed)
        y, x = np.mgrid[:self.h, :self.w]
        bwS, bhS = int(bw * SS), int(bh * SS)
        row = y // bhS
        xo = x + (row % 2) * (bwS // 2)
        cell = (row * 131 + xo // bwS) % 4093
        tone = rng.random(4096)[cell]
        mm = m[..., None]
        self.rgb = self.rgb * (1 + (tone[..., None] - 0.5) * k * mm)
        joint = (((y % bhS) < SS * 1.5) | ((xo % bwS) < SS * 1.5)).astype(float)
        hi = (((y % bhS) >= SS * 1.5) & ((y % bhS) < SS * 3.5)).astype(float)
        self.rgb = self.rgb * (1 + hi[..., None] * 0.18 * mm)
        self.fill(joint * m, mortar, 0.55)

    def glow(self, cx, cy, r, col, k=1.0, core=None):
        """Ánh sáng toả: (1 - d)^2 * k, cộng vào lớp sáng."""
        R = r * SS
        y0, y1 = max(0, int(cy * SS - R)), min(self.h, int(cy * SS + R) + 1)
        x0, x1 = max(0, int(cx * SS - R)), min(self.w, int(cx * SS + R) + 1)
        if y0 >= y1 or x0 >= x1:
            return
        y, x = np.ogrid[y0:y1, x0:x1]
        d = np.sqrt((x - cx * SS) ** 2 + (y - cy * SS) ** 2) / R
        f = np.clip(1 - d, 0, 1) ** 2 * k
        self.L[y0:y1, x0:x1] += f[..., None] * hexc(col)
        if core:
            d2 = d * r / core
            self.L[y0:y1, x0:x1] += (np.clip(1 - d2, 0, 1) ** 2 * k * 1.4)[..., None] * np.array([1, 1, 1.0])

    def haze(self, y0, y1, col, k):
        """Sương phủ dải ngang (cảnh xa nhạt dần)."""
        y = np.arange(self.h) / SS
        t = np.clip((y - y0) / max(1, y1 - y0), 0, 1)
        t = np.sin(t * math.pi)[:, None, None] * k
        self.rgb = mix(self.rgb, hexc(col), t * self.a[..., None])

    def image(self, size):
        rgb = np.clip(self.rgb + self.L * (1 - np.clip(self.rgb, 0, 1)) * 1.1 + self.L * 0.25, 0, 1)
        a = np.clip(np.maximum(self.a, np.clip(self.L.max(-1) * 0.9, 0, 1) if self.a.min() < 1 else self.a), 0, 1)
        arr = np.dstack([rgb, a]) * 255
        im = Image.fromarray(arr.astype(np.uint8), 'RGBA')
        return im.resize(size, Image.LANCZOS)


# ---------------- hình dựng sẵn ----------------
def ridge(c, y_base, amp, period, seed, col_top, col_bot, sharp=1.0):
    """Dãy núi / rặng cây xa (lặp ngang)."""
    w = c.w // SS
    n = vnoise1(w, period, seed, 5) ** sharp
    top = y_base - n * amp
    pts = [(0, c.h // SS + 2)] + [(x, top[x]) for x in range(w)] + [(w, top[0]), (w, c.h // SS + 2)]
    m = c.mask_poly([pts])
    c.shade(m, col_top, col_bot, float(top.min()), c.h / SS, clumps=0.55, clump_period=10, outline=0.15)
    return top


def pine(cx, base, h, w, jag=5, seed=0):
    """Thông: chồng tầng tán răng cưa."""
    rng = np.random.default_rng(seed)
    pts = []
    tiers = jag
    for i in range(tiers):
        t0 = i / tiers
        y_top = base - h * (1 - t0) - h * 0.08
        y_bot = base - h * (1 - (i + 1) / tiers) * 0.92 - h * 0.05
        hw = w * (0.25 + 0.75 * (i + 1) / tiers) * (0.9 + rng.random() * 0.2)
        pts.append([(cx, y_top), (cx + hw, y_bot), (cx + hw * 0.35, y_bot - h * 0.03), (cx - hw * 0.35, y_bot - h * 0.03), (cx - hw, y_bot)])
    return pts


def forest_row(c, n, y_base, hmin, hmax, wfac, col_top, col_bot, seed, trunk=None, alpha=1.0):
    rng = np.random.default_rng(seed)
    w = c.w // SS
    polys, trunks = [], []
    xs = np.sort(rng.random(n) * (w + 80) - 40)
    for i, x in enumerate(xs):
        h = hmin + rng.random() * (hmax - hmin)
        b = y_base + rng.random() * 6
        polys += pine(x, b, h, h * wfac, 5, seed + i)
        if trunk: trunks.append((x - h * 0.025, b - h * 0.12, x + h * 0.025, b))
    if trunk and trunks:
        c.fill(c.mask_rects(trunks), trunk, alpha)
    m = c.mask_poly(polys)
    c.shade(m, col_top, col_bot, y_base - hmax, y_base + 6, side=2, alpha=alpha, clumps=0.85, clump_period=34)
    return m


def clouds(c, y0, y1, col, k, seed, period=6):
    n = vnoise2(c.h, c.w, period, seed, 5)
    y = np.arange(c.h)[:, None] / SS
    band = np.clip(1 - np.abs((y - (y0 + y1) / 2) / ((y1 - y0) / 2)), 0, 1)
    m = np.clip((n - 0.52) * 4, 0, 1) * band
    c.fill(m, col, k)
    lit = np.clip(m - np.roll(m, 4 * SS, 0), 0, 1)                 # mép trên mây sáng hơn
    c.fill(lit, '#ffffff', k * 0.7)
    belly = np.clip(m - np.roll(m, -5 * SS, 0), 0, 1)
    c.fill(belly, mix_hex(col, '#7a8aa0', 0.5), k * 0.35)


def birds(c, n, y0, y1, seed, col='#3a3a48'):
    rng = np.random.default_rng(seed)
    im = Image.new('L', (c.w, c.h), 0); d = ImageDraw.Draw(im)
    for _ in range(n):
        x, y, s = rng.random() * c.w / SS, y0 + rng.random() * (y1 - y0), 4 + rng.random() * 5
        d.line([((x - s) * SS, (y - s * 0.4) * SS), (x * SS, y * SS), ((x + s) * SS, (y - s * 0.5) * SS)], fill=255, width=SS)
    c.fill(np.asarray(im, float) / 255, col, 0.8)


def stars(c, n, y1, seed):
    rng = np.random.default_rng(seed)
    for _ in range(n):
        x, y = rng.random() * c.w / SS, rng.random() * y1
        c.glow(x, y, 1.6 + rng.random() * 2.2, '#cfe1ff', 0.25 + rng.random() * 0.5)


# ============================================================
# CÁC CẢNH — lớp xa 200x18 đơn vị (3072x276), lớp gần 150x9 (3072x184): máy quay trận nhìn thấp (nghiêng 14°)
# nên chỉ thấy ~13-16 đơn vị chiều cao ở xa -> trời mỏng, cảnh chính nằm ở 2/3 dưới
# ============================================================
def forest():
    W, H = BACK
    b = Canvas(W, H)
    b.grad([(0, '#9ec1c0'), (0.35, '#d4e2cf'), (0.62, '#e4eacf'), (1, '#b9c9ad')])
    clouds(b, 6, 70, '#f6f7ee', 0.5, 3, period=8)
    b.glow(W * 0.3, 10, 520, '#fff1c2', 0.4)                            # nắng xuyên sương
    ridge(b, 150, 70, 6, 11, '#93ada8', '#b3c4b3')                       # núi xa
    b.haze(80, 200, '#dbe5d6', 0.35)
    forest_row(b, 120, 205, 55, 95, 0.30, '#7b9a8e', '#90a99a', 21)      # rặng thông xa (nhạt)
    b.haze(130, 230, '#d0dccb', 0.5)
    forest_row(b, 90, 250, 90, 150, 0.30, '#4b7262', '#5d806e', 31, trunk='#4a4438')
    forest_row(b, 70, 282, 120, 185, 0.31, '#2f5747', '#3c6453', 37, trunk='#3d332b')
    for i, x in enumerate([500, 1100, 1900, 2500]):                      # tia nắng chéo
        m = b.mask_poly([[(x, 0), (x + 80, 0), (x - 140, H), (x - 260, H)]])
        b.fill(m * 0.55, '#fff6d6', 0.09 + 0.03 * (i % 2))
    b.haze(200, 300, '#b5c6b0', 0.35)
    birds(b, 10, 10, 70, 3)
    mid = Canvas(*MID, opaque=False)
    W2, H2 = MID
    rng = np.random.default_rng(5)
    for x in list(rng.random(4) * 380) + list(W2 - rng.random(4) * 380):   # thân thông lớn hai bên (khung)
        mt = mid.mask_poly([[(x - 16, H2), (x - 11, 0), (x + 11, 0), (x + 16, H2)]])
        mid.shade(mt, '#5a4636', '#2f251d', 0, H2, side=4)
        mid.texture(mt, 0.35, 60, int(x))
    bushes = [(x, H2 - 6, 26 + rng.random() * 50, 14 + rng.random() * 22) for x in rng.random(70) * W2]
    mb = mid.mask_ellipses(bushes)
    mid.shade(mb, '#5f8a4f', '#2c4a2e', H2 - 50, H2, side=3)
    mid.texture(mb, 0.3, 50, 9)
    rocks = [(x, H2 - 4, 18 + rng.random() * 24, 10 + rng.random() * 9) for x in rng.random(16) * W2]
    mr = mid.mask_ellipses(rocks)
    mid.shade(mr, '#a3a69a', '#5d6158', H2 - 30, H2, side=3)
    for x in (700, 2300):                                                # khúc gỗ đổ phủ rêu
        mid.shade(mid.mask_poly([[(x - 150, H2 - 10), (x - 140, H2 - 44), (x + 150, H2 - 50), (x + 156, H2 - 14)]]), '#7a5a3e', '#3e2c1e', H2 - 50, H2, side=3)
        mid.fill(mid.mask_ellipses([(x + 150, H2 - 32, 10, 18)]), '#c8a070')
        mid.shade(mid.mask_ellipses([(x - 60 + k * 40, H2 - 50, 26, 8) for k in range(5)]), '#7aa050', '#4a6a34', H2 - 58, H2 - 42, clumps=0.6, clump_period=30)
    for x in rng.random(18) * W2:                                        # nấm đỏ
        mid.fill(mid.mask_rects([(x - 2, H2 - 16, x + 2, H2)]), '#efe6d2')
        mid.shade(mid.mask_ellipses([(x, H2 - 16, 9, 6)]), '#e0483a', '#9a2a22', H2 - 22, H2 - 10)
        mid.fill(mid.mask_ellipses([(x - 3, H2 - 18, 1.6, 1.4), (x + 3, H2 - 16, 1.4, 1.2)]), '#ffffff')
    fern = Image.new('L', (mid.w, mid.h), 0); d = ImageDraw.Draw(fern)
    for _ in range(120):                                                 # dương xỉ
        x = rng.random() * W2
        for k in range(5):
            a = -math.pi / 2 + (k - 2) * 0.35
            L = 28 + rng.random() * 18
            d.line([(x * SS, H2 * SS), ((x + math.cos(a) * L) * SS, (H2 + math.sin(a) * L) * SS)], fill=255, width=3 * SS)
    mid.shade(np.asarray(fern, float) / 255, '#7aa85a', '#3e6a3a', H2 - 50, H2, outline=0.2)
    for _ in range(40):                                                  # đom đóm / phấn hoa
        mid.glow(rng.random() * W2, H2 - 20 - rng.random() * 120, 3, '#fff3b0', 0.6)
    g = ground_tex('#5a7a4a', '#3c5634', '#7d9a5c', seed=41, moss=True, tufts='#86a65e', pebbles=True, leaves=['#8a6a2a', '#a8842e', '#6a7a2e'], flowers=['#ffffff', '#f2d45a'])
    return b, mid, g, dict(sky='#9ec1c0', sun='#ecf5d8', light=1.25)


def hall():
    W, H = BACK
    b = Canvas(W, H)
    b.grad([(0, '#30263a'), (0.25, '#4b3c48'), (1, '#6f5b4c')])
    wall = b.mask_rects([(0, 18, W, H)])
    b.shade(wall, '#5f4f4c', '#82705c', 18, H)
    b.texture(wall, 0.2, 30, 3)
    b.fill(b.mask_rects([(0, y, W, y + 2) for y in range(40, H, 26)]), '#4a3b39', 0.5)
    b.fill(b.mask_rects([(0, 14, W, 22)]), '#a88a5a')                    # gờ trần mạ vàng
    cx = W // 2
    for x in range(110, W, 300):
        if abs(x - cx) < 260:
            continue
        arch = [(x - 40, 200), (x - 40, 80)] + [(x + 40 * math.cos(math.pi - t), 80 - 40 * math.sin(t)) for t in np.linspace(0, math.pi, 20)] + [(x + 40, 80), (x + 40, 200)]
        b.shade(b.mask_poly([arch]), '#5876ab', '#2c3b63', 40, 200)
        b.fill(b.mask_rects([(x - 2, 40, x + 2, 200), (x - 40, 140, x + 40, 143)]), '#2a2030')
        b.glow(x, 120, 110, '#9ab8ff', 0.22)
        bx = x + 150
        if bx < W - 30 and abs(bx - cx) > 240:
            ban = [(bx - 30, 26), (bx + 30, 26), (bx + 30, 170), (bx, 192), (bx - 30, 170)]
            b.shade(b.mask_poly([ban]), '#3563b3', '#1d3870', 26, 192, side=2)
            b.fill(b.mask_poly([[(bx, 70), (bx + 14, 96), (bx, 122), (bx - 14, 96)]]), '#e2b75a')
    b.shade(b.mask_poly([[(cx - 210, 22), (cx + 210, 22), (cx + 170, 230), (cx - 170, 230)]]), '#8d2430', '#561620', 22, 230, side=4)
    b.fill(b.mask_rects([(cx - 8, 22, cx + 8, 230)]), '#6a1a24', 0.6)
    th = [(cx - 54, 236), (cx - 54, 120), (cx - 32, 96), (cx, 80), (cx + 32, 96), (cx + 54, 120), (cx + 54, 236)]
    b.shade(b.mask_poly([th]), '#c23b42', '#701c26', 80, 236, side=3)
    b.fill(b.mask_rects([(cx - 62, 116, cx - 54, 236), (cx + 54, 116, cx + 62, 236)]), '#e0ad46')
    b.glow(cx, 84, 10, '#ffe7a0', 0.9)
    for k in range(3):
        y = 236 + k * 13
        b.shade(b.mask_rects([(cx - 260 - k * 40, y, cx + 260 + k * 40, y + 13)]), '#9a8672', '#655648', y, y + 13)
    b.fill(b.mask_poly([[(cx - 70, 236), (cx + 70, 236), (cx + 120, H), (cx - 120, H)]]), '#97222e')
    for x in (cx - 560, cx + 560, 300, W - 300):                         # đèn chùm
        b.fill(b.mask_rects([(x - 1, 0, x + 1, 34)]), '#3a2c22')
        b.fill(b.mask_ellipses([(x, 40, 52, 9)]), '#c99a3e')
        for j in range(-4, 5):
            b.glow(x + j * 12, 34, 9, '#ffd38a', 0.95)
        b.glow(x, 46, 300, '#ffb86a', 0.25)
    mid = Canvas(*MID, opaque=False)
    W2, H2 = MID
    for i, x in enumerate([70, 360, 650, W2 - 650, W2 - 360, W2 - 70]):   # cột đá khung hai bên
        m = mid.mask_rects([(x - 40, 0, x + 40, H2)])
        mid.shade(m, '#d2c2a8', '#7c6c5e', 0, H2, side=5)
        mid.texture(m, 0.12, 30, i)
        mid.fill(mid.mask_rects([(x - 22, 0, x - 15, H2 - 26), (x + 10, 0, x + 17, H2 - 26)]), '#8f7f6b', 0.6)
        mid.fill(mid.mask_rects([(x - 52, H2 - 26, x + 52, H2)]), '#a8977f')
        mid.fill(mid.mask_rects([(x - 4, 60, x + 4, 92)]), '#3a2a20')
        mid.fill(mid.mask_ellipses([(x, 54, 8, 14)]), '#ffb347')
        mid.glow(x, 54, 16, '#fff0b0', 1.0, core=5)
        mid.glow(x, 62, 120, '#ff9a3c', 0.45)
    g = ground_tex('#a69886', '#7d7064', '#c0b19c', seed=9, tiles=128, polish=True)
    return b, mid, g, dict(sky='#30263a', sun='#ffd6a0', light=1.3)


def tower():
    W, H = BACK
    b = Canvas(W, H)
    b.grad([(0, '#0a1024'), (0.45, '#1a2a55'), (0.8, '#34477a'), (1, '#2a3560')])
    stars(b, 220, 120, 4)
    b.glow(W * 0.7, 40, 34, '#f6f3ff', 1.0, core=22)                     # trăng
    b.glow(W * 0.7, 40, 360, '#8ea7ff', 0.25)
    clouds(b, 20, 110, '#3a4878', 0.55, 8, period=6)
    top = ridge(b, 200, 60, 9, 13, '#1e2748', '#141a32', sharp=1.4)      # đồi + thành phố đêm dưới tháp
    rng = np.random.default_rng(2)
    for _ in range(260):
        x = rng.random() * W
        y = top[int(x) % W] + 6 + rng.random() * 80
        if y < H - 4:
            b.glow(x, y, 2.5 + rng.random() * 3, '#ffcf7a', 0.45 + rng.random() * 0.5)
    for x in (420, 2300):                                               # lửa doanh trại xa
        b.glow(x, 240, 200, '#ff7a3a', 0.2)
    mid = Canvas(*MID, opaque=False)
    W2, H2 = MID
    merl = [(x, 40, x + 80, 80) for x in range(0, W2, 140)]             # tường lỗ châu mai
    m = mid.mask_rects([(0, 80, W2, H2)] + merl)
    mid.shade(m, '#66708e', '#2e3550', 40, H2, side=3)
    mid.texture(m, 0.22, 34, 3)
    mid.fill(mid.mask_rects([(0, y, W2, y + 2) for y in range(104, H2, 24)]) * m, '#262c44', 0.55)
    for x in (300, 900, 2170, 2770):                                    # chậu lửa
        mid.fill(mid.mask_poly([[(x - 28, 70), (x + 28, 70), (x + 18, 98), (x - 18, 98)]]), '#3a3030')
        mid.fill(mid.mask_poly([[(x - 20, 70), (x - 7, 26), (x, 6), (x + 9, 30), (x + 20, 70)]]), '#ff8a2a')
        mid.fill(mid.mask_poly([[(x - 9, 70), (x, 34), (x + 9, 70)]]), '#ffe28a')
        mid.glow(x, 52, 22, '#fff2c0', 1.0, core=8)
        mid.glow(x, 56, 170, '#ff7a2a', 0.55)
    mid.fill(mid.mask_rects([(2470, 0, 2478, 60)]), '#3a2e26')          # cột cờ hiệu
    mid.fill(mid.mask_poly([[(2478, 4), (2560, 18), (2478, 34)]]), '#9b2b2b')
    g = ground_tex('#646d82', '#454c60', '#7d879c', seed=17, tiles=128)
    return b, mid, g, dict(sky='#0a1024', sun='#a9c2ff', light=0.95)


# ---------------- đất (ô lặp) ----------------
def ground_tex(base, dark, light, seed=0, tiles=0, moss=False, tufts=None, pebbles=False, polish=False, planks=False, flowers=None, leaves=None):
    n = GROUND
    big = vnoise2(n, n, 3, seed, 5)
    fine = vnoise2(n, n, 24, seed + 1, 3)
    t = np.clip(big * 0.75 + fine * 0.35 - 0.05, 0, 1)[..., None]
    col = mix(hexc(dark), hexc(light), t)
    col = mix(col, hexc(base), 0.3)
    rng = np.random.default_rng(seed)
    if tiles:   # đá lát: mạch vữa + mỗi viên một sắc + gờ sáng
        s = tiles
        y, x = np.mgrid[:n, :n]
        row = y // s
        xo = (x + (row % 2) * (s // 2)) % n
        cell = (row * 97 + xo // s) % 977
        tone = rng.random(1000)[cell][..., None]
        col = col * (0.82 + tone * 0.3)
        joint = ((y % s) < 4) | ((xo % s) < 4)
        col[joint] = col[joint] * 0.5
        hi = (((y % s) >= 4) & ((y % s) < 7)) | (((xo % s) >= 4) & ((xo % s) < 7))
        col[hi & ~joint] = np.clip(col[hi & ~joint] * 1.15, 0, 1)
        if polish:   # sàn bóng: vệt sáng phản chiếu
            col = col + (np.clip(vnoise2(n, n, 2, seed + 9, 2) - 0.5, 0, 1) * 0.25)[..., None]
    if moss:
        m = np.clip((vnoise2(n, n, 6, seed + 5, 4) - 0.5) * 3, 0, 1)[..., None]
        col = mix(col, hexc('#87a85c'), m * 0.45)
    if planks:   # ván gỗ: thớ gỗ + khe ván + đinh
        y, x = np.mgrid[:n, :n]
        board = y // 64
        grain = np.sin((x + board * 37) * 0.09 + vnoise2(n, n, 8, seed + 3, 3) * 9) * 0.06
        col = col * (1 + grain[..., None]) * (0.85 + (rng.random(64)[board % 64] * 0.3))[..., None]
        gap = (y % 64) < 4
        col[gap] = col[gap] * 0.4
        ends = ((x + board * 173) % 256) < 3
        col[ends & ~gap] = col[ends & ~gap] * 0.55
    im = Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8), 'RGB')
    d = ImageDraw.Draw(im, 'RGBA')
    offs = [(ox, oy) for ox in (-n, 0, n) for oy in (-n, 0, n)]   # vẽ cả 9 bản để ô lặp liền mép
    if pebbles:
        for _ in range(60):
            x, y, r = rng.random() * n, rng.random() * n, 2 + rng.random() * 5
            for ox, oy in offs:
                d.ellipse([x + ox - r, y + oy - r * 0.7, x + ox + r, y + oy + r * 0.7], fill=(150, 150, 135, 255))
                d.ellipse([x + ox - r * 0.6, y + oy - r * 0.6, x + ox + r * 0.2, y + oy], fill=(190, 190, 175, 255))
    if flowers:
        for _ in range(70):
            x, y = rng.random() * n, rng.random() * n
            fc = tuple(int(v * 255) for v in hexc(flowers[int(rng.random() * len(flowers))]))
            for ox, oy in offs:
                for k in range(5):
                    a = k * 1.256
                    d.ellipse([x + ox + math.cos(a) * 3 - 2, y + oy + math.sin(a) * 3 - 2, x + ox + math.cos(a) * 3 + 2, y + oy + math.sin(a) * 3 + 2], fill=fc + (255,))
                d.ellipse([x + ox - 1.5, y + oy - 1.5, x + ox + 1.5, y + oy + 1.5], fill=(255, 230, 120, 255))
    if leaves:
        for _ in range(90):
            x, y, a = rng.random() * n, rng.random() * n, rng.random() * math.pi
            lc = tuple(int(v * 255) for v in hexc(leaves[int(rng.random() * len(leaves))]))
            for ox, oy in offs:
                d.polygon([(x + ox + math.cos(a) * 7, y + oy + math.sin(a) * 7), (x + ox + math.cos(a + 1.7) * 3, y + oy + math.sin(a + 1.7) * 3),
                           (x + ox - math.cos(a) * 7, y + oy - math.sin(a) * 7), (x + ox + math.cos(a - 1.4) * 3, y + oy + math.sin(a - 1.4) * 3)], fill=lc + (230,))
    if tufts:
        tc = tuple(int(v * 255) for v in hexc(tufts))
        dc = tuple(int(v * 160) for v in hexc(tufts))
        for _ in range(420):
            x, y = rng.random() * n, rng.random() * n
            for k in range(3):
                a = -math.pi / 2 + (k - 1) * 0.45 + rng.normal() * 0.15
                L = 6 + rng.random() * 8
                for ox, oy in offs:
                    d.line([(x + ox, y + oy), (x + ox + math.cos(a) * L, y + oy + math.sin(a) * L)], fill=dc + (255,), width=2)
                    d.line([(x + ox + 1, y + oy), (x + ox + 1 + math.cos(a) * L * 0.8, y + oy + math.sin(a) * L * 0.8)], fill=tc + (255,), width=1)
    return im


# ---------------- hình dựng sẵn: nhà cửa, tường, cột… (toạ độ theo pixel thiết kế) ----------------
def house(c, x, base, w, h, wall='#d8c7a6', roof='#a4553f', lit=False, seed=0):
    """Nhà mái ngói: tường + mái tam giác + cửa sổ (sáng đèn nếu lit)."""
    rng = np.random.default_rng(seed)
    mw = c.mask_rects([(x - w / 2, base - h, x + w / 2, base)])
    c.shade(mw, wall, mix_hex(wall, '#5a4a3a', 0.35), base - h, base, side=3)
    c.texture(mw, 0.15, 40, seed)
    rh = h * (0.55 + rng.random() * 0.2)
    mr = c.mask_poly([[(x - w / 2 - 10, base - h + 2), (x, base - h - rh), (x + w / 2 + 10, base - h + 2)]])
    c.shade(mr, roof, mix_hex(roof, '#2a1a14', 0.45), base - h - rh, base - h, side=3)
    c.fill(c.mask_rects([(x - w / 2 - 10, base - h - 2, x + w / 2 + 10, base - h + 3)]), '#3a2a22', 0.6)
    # ngói từng hàng
    for ry in np.arange(base - h - rh + 8, base - h, 9):
        c.fill(c.mask_rects([(x - w / 2 - 10, ry, x + w / 2 + 10, ry + 1.5)]) * mr, '#1e120c', 0.35)
    # khung gỗ (nhà kiểu làng)
    if w > 80 and rng.random() < 0.6:
        beams = [(x - w / 2, base - h + 4, x + w / 2, base - h + 9), (x - w / 2, base - h * 0.45, x + w / 2, base - h * 0.45 + 5)]
        beams += [(x - w / 2 + k * w / 4, base - h + 4, x - w / 2 + k * w / 4 + 5, base) for k in range(5)]
        c.fill(c.mask_rects(beams) * mw, '#5a3a26', 0.85)
    # ống khói + khói
    if rng.random() < 0.55:
        chx = x + w * (0.15 + rng.random() * 0.2)
        c.shade(c.mask_rects([(chx - 8, base - h - rh * 0.8, chx + 8, base - h)]), '#9a8a7a', '#5a4a3e', base - h - rh, base - h)
        for k in range(5):
            c.fill(c.mask_ellipses([(chx + k * 6 + rng.random() * 4, base - h - rh * 0.8 - 12 - k * 13, 7 + k * 3, 5 + k * 2)]), '#e8ecef', 0.22 - k * 0.03)
    nwin = max(1, int(w // 46))
    for i in range(nwin):
        wx = x - w / 2 + (i + 0.5) * w / nwin
        wy = base - h * 0.62
        c.fill(c.mask_rects([(wx - 9, wy - 11, wx + 9, wy + 11)]), '#ffcf7a' if lit else '#3d4a5c')
        c.fill(c.mask_rects([(wx - 1, wy - 11, wx + 1, wy + 11), (wx - 9, wy - 1, wx + 9, wy + 1)]), '#4a3428')
        c.fill(c.mask_rects([(wx - 11, wy + 11, wx + 11, wy + 16)]), '#6a4a30')   # bậu cửa + hộp hoa
        c.fill(c.mask_ellipses([(wx - 7 + k * 7, wy + 11, 3.5, 3) for k in range(3)]), ['#e0586a', '#f2c040', '#d06ad0', '#ffffff'][int(wx) % 4])
        if lit:
            c.glow(wx, wy, 34, '#ffb35a', 0.35)
    if w > 70:
        c.fill(c.mask_rects([(x - 15, base - 37, x + 15, base)]), '#3a2618')
        c.fill(c.mask_rects([(x - 12, base - 34, x + 12, base)]), '#6a4430')
        c.fill(c.mask_rects([(x - 1, base - 34, x + 1, base)]), '#3a2618', 0.6)
        if lit:
            c.glow(x + 20, base - 30, 26, '#ffc06a', 0.6)


def mix_hex(a, b, t):
    v = mix(hexc(a), hexc(b), t)
    return '#%02x%02x%02x' % tuple(int(x * 255) for x in v)


def village_row(c, base, n, hmin, hmax, seed, lit=False, walls=None, roofs=None):
    rng = np.random.default_rng(seed)
    W = c.w // SS
    walls = walls or ['#d8c7a6', '#cbb594', '#e2d3b5', '#c2a888']
    roofs = roofs or ['#a4553f', '#8f4a3a', '#b4683f', '#6f5a4a']
    xs = np.sort(rng.random(n) * (W + 200) - 100)
    for i, x in enumerate(xs):
        h = hmin + rng.random() * (hmax - hmin)
        house(c, x, base + rng.random() * 6, h * (1.1 + rng.random() * 0.6), h, walls[i % len(walls)], roofs[(i * 7) % len(roofs)], lit, seed + i)


def crenel_wall(c, y_top, y_bot, col_top, col_bot, merlon=60, gap=40, seed=0, x0=0, x1=None, alpha=1.0):
    x1 = x1 if x1 is not None else c.w // SS
    rects = [(x0, y_top + 26, x1, y_bot)] + [(x, y_top, x + merlon, y_top + 28) for x in range(int(x0), int(x1), merlon + gap)]
    m = c.mask_rects(rects)
    c.shade(m, col_top, col_bot, y_top, y_bot, side=3, alpha=alpha)
    c.texture(m, 0.15, 36, seed)
    c.blocks(m, 34, 16, mix_hex(col_bot, '#000000', 0.45), seed)
    return m


def round_tower(c, x, base, w, h, col_top, col_bot, roof=None, seed=0):
    m = c.mask_rects([(x - w / 2, base - h, x + w / 2, base)])
    c.shade(m, col_top, col_bot, base - h, base, side=4)
    c.texture(m, 0.15, 30, seed)
    c.blocks(m, 28, 14, mix_hex(col_bot, '#000000', 0.45), seed)
    if roof:
        c.shade(c.mask_poly([[(x - w / 2 - 8, base - h), (x, base - h - w * 1.1), (x + w / 2 + 8, base - h)]]), roof, mix_hex(roof, '#101020', 0.5), base - h - w * 1.1, base - h, side=3)
    else:
        crenel_wall(c, base - h - 28, base - h + 4, col_top, col_bot, 18, 12, seed, x - w / 2 - 6, x + w / 2 + 6)
    for k in range(2):
        wy = base - h * (0.35 + 0.3 * k)
        c.fill(c.mask_rects([(x - 4, wy - 12, x + 4, wy + 12)]), '#1c1c26')


def column(c, x, top, base, w, col_top='#e8e2d6', col_bot='#9c9486', broken=False, seed=0):
    t = top + (np.random.default_rng(seed).random() * 60 if broken else 0)
    m = c.mask_rects([(x - w / 2, t, x + w / 2, base)])
    c.shade(m, col_top, col_bot, t, base, side=4)
    c.fill(c.mask_rects([(x - w / 2 + w * 0.22, t + 10, x - w / 2 + w * 0.3, base - 14), (x + w * 0.1, t + 10, x + w * 0.18, base - 14)]), col_bot, 0.4)
    c.fill(c.mask_rects([(x - w / 2 - 8, base - 14, x + w / 2 + 8, base)]), col_bot)
    if not broken:
        c.fill(c.mask_rects([(x - w / 2 - 8, t - 10, x + w / 2 + 8, t + 2)]), col_top)


def leafy_tree(c, x, base, h, col_top, col_bot, trunk='#5a4030', seed=0, alpha=1.0):
    rng = np.random.default_rng(seed)
    c.fill(c.mask_rects([(x - h * 0.04, base - h * 0.5, x + h * 0.04, base)]), trunk, alpha)
    ells = [(x + (rng.random() - 0.5) * h * 0.5, base - h * (0.55 + rng.random() * 0.35), h * (0.16 + rng.random() * 0.12), h * (0.13 + rng.random() * 0.1)) for _ in range(9)]
    m = c.mask_ellipses(ells)
    c.shade(m, col_top, col_bot, base - h, base - h * 0.4, side=4, alpha=alpha, clumps=0.95, clump_period=22)


def leafy_row(c, n, base, hmin, hmax, col_top, col_bot, seed, trunk='#5a4030', alpha=1.0):
    rng = np.random.default_rng(seed)
    W = c.w // SS
    for i, x in enumerate(np.sort(rng.random(n) * (W + 160) - 80)):
        leafy_tree(c, x, base + rng.random() * 6, hmin + rng.random() * (hmax - hmin), col_top, col_bot, trunk, seed + i, alpha)


def wheat(c, base, h, n, col, dark, seed):
    rng = np.random.default_rng(seed)
    W = c.w // SS
    m = c.mask_rects([(0, base - h * 0.55, W, base + 4)])
    c.shade(m, col, dark, base - h * 0.55, base)
    im = Image.new('L', (c.w, c.h), 0); d = ImageDraw.Draw(im)
    for _ in range(n):
        x = rng.random() * W; hh = h * (0.6 + rng.random() * 0.5); lean = (rng.random() - 0.5) * 14
        d.line([(x * SS, base * SS), ((x + lean) * SS, (base - hh) * SS)], fill=255, width=2 * SS)
        d.ellipse([((x + lean) - 3) * SS, (base - hh - 9) * SS, ((x + lean) + 3) * SS, (base - hh + 2) * SS], fill=255)
    c.fill(np.asarray(im, float) / 255, col)


def water(c, y0, y1, top, bot, seed, shine='#e8f4ff'):
    m = c.mask_rects([(0, y0, c.w // SS, y1)])
    c.shade(m, top, bot, y0, y1)
    rng = np.random.default_rng(seed)
    lines = [(x, y, x + 20 + rng.random() * 60, y + 2) for x, y in zip(rng.random(160) * c.w / SS, y0 + rng.random(160) * (y1 - y0))]
    c.fill(c.mask_rects(lines), shine, 0.35)


def ghost_mushroom(c, x, base, s, cap='#7fe3d4', seed=0):
    c.fill(c.mask_rects([(x - s * 0.12, base - s * 0.8, x + s * 0.12, base)]), '#d9efe6')
    c.shade(c.mask_ellipses([(x, base - s * 0.8, s * 0.55, s * 0.32)]), cap, mix_hex(cap, '#1d3b46', 0.5), base - s * 1.1, base - s * 0.6)
    c.glow(x, base - s * 0.8, s * 2.2, cap, 0.45)



def city_skyline(c, base, seed):
    """Kinh thành xa: mái nhà san sát + tháp chuông + lâu đài trên đồi (màu xanh xám, có sương)."""
    W = c.w // SS
    rng = np.random.default_rng(seed + 90)
    ridge(c, base + 10, 30, 6, seed + 3, '#9aa8b8', '#8a98a8')
    polys = []
    x = -40
    while x < W + 40:
        w = 40 + rng.random() * 70; h = 20 + rng.random() * 40
        polys.append([(x, base + 20), (x, base - h), (x + w / 2, base - h - 18 - rng.random() * 14), (x + w, base - h), (x + w, base + 20)])
        x += w * 0.8
    m = c.mask_poly(polys)
    c.shade(m, '#8f9cb0', '#7a879c', base - 80, base + 20, outline=0.25)
    cx = W * (0.3 + 0.4 * rng.random())
    for k, (dx, h) in enumerate([(-120, 110), (-40, 150), (40, 130), (120, 100)]):   # lâu đài xa
        round_tower(c, cx + dx, base, 46, h, '#a4b0c2', '#7c889c', roof='#5a6e96', seed=k)
    c.haze(base - 160, base + 30, '#d6e0ea', 0.3)

# ============================================================
# 20 CẢNH CÒN LẠI
# ============================================================
def sky_day(b, top='#9cc6e6', mid='#d8ecf2', low='#f2ead2', sun_x=0.3):
    W, H = BACK
    b.grad([(0, top), (0.4, mid), (1, low)])
    clouds(b, 4, 70, '#ffffff', 0.6, 7, period=7)
    b.glow(W * sun_x, 6, 600, '#fff3cc', 0.35)


def village():
    W, H = BACK
    b = Canvas(W, H); sky_day(b)
    ridge(b, 120, 60, 5, 2, '#a3b8c8', '#bfcdd0')                       # núi xa xanh lam
    b.haze(60, 160, '#dfe7e4', 0.3)
    ridge(b, 175, 40, 7, 4, '#9cbc7c', '#7c9c5c')                        # đồi cỏ
    leafy_row(b, 46, 190, 50, 90, '#86a870', '#5e8250', 3)
    ridge(b, 225, 22, 11, 6, '#8fb06a', '#6f8e50')                       # bãi cỏ sau làng
    village_row(b, 236, 14, 60, 90, 5)
    leafy_row(b, 12, 250, 70, 110, '#78a062', '#4e7444', 15)
    village_row(b, 274, 10, 80, 120, 9)
    rng = np.random.default_rng(12)
    for x in rng.random(8) * W:                                          # đống rơm
        b.shade(b.mask_ellipses([(x, 270, 26, 18)]), '#e8c86a', '#a8843a', 252, 288, clumps=0.6, clump_period=40)
    birds(b, 14, 20, 90, 4)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    rng = np.random.default_rng(1)
    fence = [(x, H2 - 46, x + 8, H2) for x in range(0, W2, 46)] + [(0, H2 - 40, W2, H2 - 34), (0, H2 - 22, W2, H2 - 16)]
    mid.shade(mid.mask_rects(fence), '#9c7a52', '#5a4430', H2 - 46, H2, side=2)
    mid.shade(mid.mask_ellipses([(x, H2 - 4, 24 + rng.random() * 30, 12 + rng.random() * 12) for x in rng.random(30) * W2]), '#7aa060', '#3f5c36', H2 - 40, H2)
    for x in (260, W2 - 260):
        leafy_tree(mid, x, H2, 200, '#6e9a5a', '#3b5c34', seed=int(x))
    g = ground_tex('#b39a72', '#8a7454', '#cdb68c', seed=3, tufts='#8aa060', pebbles=True, flowers=['#e0586a', '#f2c040', '#ffffff'])
    return b, mid, g, dict(sky='#9cc6e6', sun='#fff0d6', light=1.55)


def field():
    W, H = BACK
    b = Canvas(W, H); sky_day(b, '#8fc3ea', '#d9eef5', '#f6ecc8', 0.65)
    ridge(b, 150, 70, 4, 7, '#9fb7c6', '#c1cfcf')
    leafy_row(b, 50, 190, 50, 90, '#83a36c', '#66865a', 13)
    b.haze(110, 210, '#e8ebd8', 0.35)
    wheat(b, 250, 70, 900, '#e2c25a', '#b08d3a', 4)
    for x in (700, 2200):                                               # cối xay gió xa
        b.shade(b.mask_poly([[(x - 30, 230), (x - 18, 150), (x + 18, 150), (x + 30, 230)]]), '#e6dccb', '#a69a86', 150, 230, side=2)
        b.fill(b.mask_poly([[(x - 22, 152), (x, 128), (x + 22, 152)]]), '#8f4a3a')
        for a in (0.4, 2.0, 3.6, 5.2):
            b.fill(b.mask_poly([[(x, 150), (x + math.cos(a) * 70, 150 + math.sin(a) * 70), (x + math.cos(a + 0.18) * 70, 150 + math.sin(a + 0.18) * 70)]]), '#f2eadb')
    wheat(b, 284, 90, 1200, '#efcf62', '#a88232', 8)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    wheat(mid, H2, 110, 1400, '#f2d36a', '#9c7a2c', 11)
    mid.a[:] = np.clip(mid.a, 0, 1)
    g = ground_tex('#8e9a50', '#6c7a3c', '#adb065', seed=5, tufts='#b7b862', flowers=['#e04a4a', '#4a7ae0', '#ffffff', '#f2c040'])
    return b, mid, g, dict(sky='#8fc3ea', sun='#fff2cf', light=1.6)


def mine(deep=False):
    W, H = BACK
    b = Canvas(W, H)
    b.grad([(0, '#14151d'), (0.5, '#2a2a33' if not deep else '#1c2030'), (1, '#3b362f' if not deep else '#262a38')])
    rock = b.mask_poly([[(0, 0), (W, 0), (W, 40)] + [(x, 30 + 25 * math.sin(x / 130) + 15 * math.sin(x / 47)) for x in range(W, -1, -40)]])
    b.shade(rock, '#3e3a36', '#24221f', 0, 80)
    b.texture(b.mask_rects([(0, 0, W, H)]), 0.35, 20, 4)
    for i, x in enumerate(range(150, W, 420)):                           # cột chống gỗ
        b.shade(b.mask_rects([(x - 12, 40, x + 12, H), (x + 220 - 12, 40, x + 220 + 12, H)]), '#7a5a3a', '#3e2c1e', 40, H, side=3)
        b.shade(b.mask_rects([(x - 24, 34, x + 244, 54)]), '#86643f', '#4a3424', 34, 54)
        b.fill(b.mask_ellipses([(x + 110, 74, 10, 14)]), '#ffbf5a')
        b.glow(x + 110, 74, 160, '#ffa040', 0.4)
        b.glow(x + 110, 74, 14, '#fff0c0', 0.9)
    rng = np.random.default_rng(9)
    for _ in range(40):                                                  # tinh thể quặng
        x, y = rng.random() * W, 120 + rng.random() * 140
        s = 8 + rng.random() * 14
        col = '#6fd2ff' if not deep else '#a78bff'
        b.fill(b.mask_poly([[(x, y - s * 1.6), (x + s * 0.5, y), (x, y + s * 0.4), (x - s * 0.5, y)]]), col)
        b.glow(x, y, s * 4, col, 0.3)
    b.fill(b.mask_rects([(0, 250, W, 254), (0, 262, W, 266)]), '#5a5048')   # đường ray
    b.fill(b.mask_rects([(x, 248, x + 14, 270) for x in range(0, W, 40)]), '#4a3424', 0.8)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    rocks = [(x, H2 - 6, 30 + rng.random() * 50, 18 + rng.random() * 26) for x in rng.random(40) * W2]
    mr = mid.mask_ellipses(rocks)
    mid.shade(mr, '#6a625a', '#2e2a26', H2 - 60, H2, side=4)
    mid.texture(mr, 0.3, 40, 2)
    for x in (400, W2 - 520):                                           # xe goòng
        mid.shade(mid.mask_poly([[(x - 70, H2 - 70), (x + 70, H2 - 70), (x + 56, H2 - 20), (x - 56, H2 - 20)]]), '#6a5a4a', '#3a3028', H2 - 70, H2 - 20, side=3)
        mid.fill(mid.mask_ellipses([(x - 36, H2 - 16, 14, 14), (x + 36, H2 - 16, 14, 14)]), '#2a2420')
        mid.fill(mid.mask_ellipses([(x - 30 + k * 18, H2 - 74, 16, 10) for k in range(4)]), '#7fd8ff' if not deep else '#b39bff')
    g = ground_tex('#6d655a', '#4a443d', '#857b6c', seed=21, pebbles=True)
    return b, mid, g, dict(sky='#14151d', sun='#ffc890' if not deep else '#b0c0ff', light=0.95 if not deep else 0.8)


def deepMine():
    return mine(True)


def outpost():
    W, H = BACK
    b = Canvas(W, H); sky_day(b, '#a8c4d8', '#dfe6dc', '#e8dcc2', 0.7)
    ridge(b, 150, 70, 5, 17, '#9fb0b2', '#bfc8c0')
    forest_row(b, 80, 220, 60, 110, 0.3, '#6a8a7a', '#7c988a', 41)
    b.haze(120, 230, '#dee2d6', 0.4)
    rng = np.random.default_rng(3)
    pal = [(x, 175 + rng.random() * 10, x + 16, 270) for x in range(0, W, 18)]   # hàng rào cọc nhọn
    m = b.mask_rects(pal)
    m = np.maximum(m, b.mask_poly([[(x, 175), (x + 8, 160), (x + 16, 175)] for x in range(0, W, 18)]))
    b.shade(m, '#9a7650', '#5a4030', 160, 270, side=2)
    round_tower(b, 600, 250, 90, 150, '#9a7a56', '#5a442e', roof='#6a3a2a', seed=1)
    round_tower(b, 2300, 250, 90, 140, '#9a7a56', '#5a442e', roof='#6a3a2a', seed=2)
    for x in (900, 1600, 2000):                                          # lều + cờ
        b.shade(b.mask_poly([[(x - 80, 270), (x, 200), (x + 80, 270)]]), '#d8c8a0', '#8a7a5a', 200, 270, side=2)
        b.fill(b.mask_rects([(x - 2, 170, x + 2, 205)]), '#4a3424')
        b.fill(b.mask_poly([[(x + 2, 172), (x + 40, 180), (x + 2, 190)]]), '#b03a3a')
    b.haze(240, 290, '#cfc8b0', 0.25)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    for x in (200, 700, W2 - 700, W2 - 200):                             # chậu lửa + thùng
        mid.shade(mid.mask_rects([(x - 30, H2 - 60, x + 30, H2)]), '#8a6a48', '#4a3424', H2 - 60, H2, side=3)
        mid.fill(mid.mask_poly([[(x + 50, H2 - 50), (x + 62, H2 - 90), (x + 74, H2 - 50)]]), '#ff9a3a')
        mid.glow(x + 62, H2 - 66, 90, '#ff8a3a', 0.4)
    mid.shade(mid.mask_ellipses([(x, H2 - 4, 30 + rng.random() * 40, 12 + rng.random() * 14) for x in rng.random(26) * W2]), '#8aa064', '#4a5c36', H2 - 36, H2)
    g = ground_tex('#9b8a64', '#776849', '#b4a27a', seed=7, pebbles=True, tufts='#8f9a5a')
    return b, mid, g, dict(sky='#a8c4d8', sun='#fff0d0', light=1.5)


def swamp():
    W, H = BACK
    b = Canvas(W, H)
    b.grad([(0, '#6f8a80'), (0.5, '#9db3a2'), (1, '#7d9284')])
    forest_row(b, 70, 200, 60, 110, 0.32, '#5b7468', '#6c8476', 51)
    b.haze(80, 220, '#b2c4b4', 0.55)
    forest_row(b, 40, 240, 110, 170, 0.33, '#3c5446', '#465e50', 53, trunk='#3a3a30')
    water(b, 236, H, '#6b8478', '#3f554c', 2, shine='#cfe2d2')
    rng = np.random.default_rng(4)
    reeds = Image.new('L', (b.w, b.h), 0); d = ImageDraw.Draw(reeds)
    for _ in range(500):
        x = rng.random() * W; hh = 20 + rng.random() * 50
        d.line([(x * SS, 270 * SS), ((x + (rng.random() - 0.5) * 10) * SS, (270 - hh) * SS)], fill=255, width=SS * 2)
    b.fill(np.asarray(reeds, float) / 255, '#4e6a3e')
    for _ in range(30):                                                  # đom đóm đầm lầy
        b.glow(rng.random() * W, 150 + rng.random() * 110, 4, '#d8ff9a', 0.7)
    b.haze(180, 290, '#a6bba8', 0.35)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    for x in list(rng.random(5) * 400) + list(W2 - rng.random(5) * 400):   # cây chết xoắn
        mid.shade(mid.mask_poly([[(x - 14, H2), (x - 6, 0), (x + 6, 0), (x + 14, H2)]]), '#4a4a3a', '#26261e', 0, H2, side=3)
        mid.fill(mid.mask_poly([[(x, 60), (x + 70, 30), (x + 74, 36), (x + 4, 70)]]), '#3a3a2e')
    mid.shade(mid.mask_ellipses([(x, H2 - 4, 30 + rng.random() * 50, 10 + rng.random() * 18) for x in rng.random(40) * W2]), '#5c7a48', '#2e4228', H2 - 30, H2)
    g = ground_tex('#55684a', '#3c4c36', '#6f8358', seed=11, moss=True, tufts='#6f8a4e')
    return b, mid, g, dict(sky='#6f8a80', sun='#cfe6c8', light=1.05)


def camp():
    W, H = BACK
    b = Canvas(W, H); sky_day(b, '#b4bfae', '#d6d6c0', '#c9bd9c', 0.2)
    forest_row(b, 90, 210, 60, 110, 0.3, '#5c7462', '#6a826e', 61)
    b.haze(100, 220, '#d0cfba', 0.45)
    rng = np.random.default_rng(6)
    pal = [(x, 165 + rng.random() * 14, x + 18, 270) for x in range(0, W, 20)]
    m = np.maximum(b.mask_rects(pal), b.mask_poly([[(x, 175), (x + 9, 150 + rng.random() * 12), (x + 18, 175)] for x in range(0, W, 20)]))
    b.shade(m, '#8a6a44', '#4a3622', 150, 270, side=2)
    for x in (500, 1200, 1900, 2600):                                    # lều da thú goblin
        b.shade(b.mask_poly([[(x - 110, 275), (x - 20, 175), (x + 20, 175), (x + 110, 275)]]), '#9a7a56', '#5a3e2a', 175, 275, side=3)
        b.fill(b.mask_poly([[(x - 20, 275), (x, 220), (x + 20, 275)]]), '#2a1a12')
        for k in (-1, 1):
            b.fill(b.mask_poly([[(x + k * 8, 180), (x + k * 30, 140), (x + k * 26, 182)]]), '#e8dcc0')   # xương / sừng
    for x in (850, 2250):
        b.glow(x, 250, 220, '#ff7a2a', 0.35); b.glow(x, 250, 20, '#ffe0a0', 0.9)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    for x in (180, 640, W2 - 640, W2 - 180):                             # cọc đầu lâu + đuốc
        mid.shade(mid.mask_rects([(x - 6, 20, x + 6, H2)]), '#6a4a30', '#3a2818', 20, H2, side=2)
        mid.fill(mid.mask_ellipses([(x, 22, 14, 13)]), '#e8e0cc')
        mid.fill(mid.mask_ellipses([(x - 5, 20, 3, 4), (x + 5, 20, 3, 4)]), '#2a2018')
        mid.fill(mid.mask_poly([[(x + 20, H2 - 60), (x + 30, H2 - 100), (x + 40, H2 - 60)]]), '#ff9a3a')
        mid.glow(x + 30, H2 - 76, 100, '#ff7a2a', 0.45)
    mid.shade(mid.mask_ellipses([(x, H2 - 4, 30 + rng.random() * 40, 12 + rng.random() * 12) for x in rng.random(30) * W2]), '#6a7a4a', '#3a4428', H2 - 30, H2)
    g = ground_tex('#7c7552', '#5a5438', '#968e66', seed=13, pebbles=True)
    return b, mid, g, dict(sky='#b4bfae', sun='#ffe0b8', light=1.35)


def square(well=False):
    W, H = BACK
    b = Canvas(W, H); sky_day(b, '#8fbce6', '#cfe2ee', '#e6dcc4', 0.5)
    city_skyline(b, 150, 0)
    village_row(b, 215, 16, 70, 100, 21, walls=['#d2bf9c', '#c4ab86', '#dcc8a6', '#b89c7a'])
    b.fill(b.mask_rects([(0, 214, W, H)]), '#b3a48c')                   # mặt quảng trường lát đá
    b.blocks(b.mask_rects([(0, 214, W, H)]), 22, 8, '#6e6250', 3)
    village_row(b, 268, 11, 95, 130, 25, walls=['#d6c4a2', '#c8b08a', '#e0ccaa', '#bea07c'])
    birds(b, 12, 10, 80, 21)
    cx = W // 2
    if well:
        b.shade(b.mask_ellipses([(cx, 262, 120, 26)]), '#b8b0a2', '#7a7266', 236, 288, side=3)
        b.shade(b.mask_rects([(cx - 110, 200, cx - 96, 262), (cx + 96, 200, cx + 110, 262)]), '#8a6a48', '#4a3424', 200, 262)
        b.shade(b.mask_poly([[(cx - 140, 205), (cx, 150), (cx + 140, 205)]]), '#a4553f', '#5a2a20', 150, 205, side=3)
    else:   # đài phun nước giữa quảng trường
        b.shade(b.mask_ellipses([(cx, 266, 160, 24)]), '#c8c0b2', '#8a8276', 242, 290, side=3)
        b.shade(b.mask_rects([(cx - 18, 180, cx + 18, 262)]), '#d8d0c2', '#9a9286', 180, 262, side=3)
        b.fill(b.mask_ellipses([(cx, 182, 60, 12)]), '#c8c0b2')
        for k in range(-3, 4):
            b.fill(b.mask_poly([[(cx, 176), (cx + k * 30, 238), (cx + k * 30 + 4, 238)]]), '#cfeaff', 0.5)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    rng = np.random.default_rng(2)
    for x in (300, 900, W2 - 900, W2 - 300):                             # cột đèn đường
        mid.shade(mid.mask_rects([(x - 5, 30, x + 5, H2)]), '#3a3a40', '#1e1e24', 30, H2)
        mid.fill(mid.mask_rects([(x - 14, 14, x + 14, 36)]), '#ffd27a')
        mid.glow(x, 26, 80, '#ffbf6a', 0.4)
    for x in rng.random(12) * W2:                                       # chậu hoa, thùng gỗ
        mid.shade(mid.mask_rects([(x - 24, H2 - 40, x + 24, H2)]), '#9a7650', '#5a4430', H2 - 40, H2, side=2)
        mid.fill(mid.mask_ellipses([(x - 10 + k * 10, H2 - 44, 9, 7) for k in range(3)]), ['#e05a6a', '#f2c040', '#b06ad0'][int(x) % 3])
    g = ground_tex('#b2a48e', '#8a7c68', '#cbbca4', seed=23, tiles=64)
    return b, mid, g, dict(sky='#a2c8e8', sun='#fff0d8', light=1.55)


def well():
    return square(True)


def market():
    b, mid, g, info = square()
    W2, H2 = MID
    rng = np.random.default_rng(31)
    cols = [('#c0392b', '#f2e6d0'), ('#2d6fb3', '#f2e6d0'), ('#2f8f5a', '#f2e6d0'), ('#d9a032', '#7a2a2a')]
    for i, x in enumerate(range(240, W2, 520)):                          # sạp hàng mái vải sọc
        if 1100 < x < 2000: continue
        c1, c2 = cols[i % 4]
        for k in range(6):
            mid.fill(mid.mask_poly([[(x - 120 + k * 40, 40), (x - 80 + k * 40, 40), (x - 80 + k * 40, 70), (x - 120 + k * 40, 70)]]), c1 if k % 2 else c2)
        mid.shade(mid.mask_rects([(x - 120, 70, x + 120, H2 - 30)]), '#8a6a48', '#4a3424', 70, H2, side=2)
        mid.fill(mid.mask_rects([(x - 124, 36, x - 116, H2), (x + 116, 36, x + 124, H2)]), '#4a3424')
        mid.fill(mid.mask_ellipses([(x - 90 + k * 26, 72, 12, 9) for k in range(8)]), ['#e05a3a', '#f2c040', '#7ab04a'][i % 3])
    return b, mid, g, info


def bridge():
    W, H = BACK
    b = Canvas(W, H); sky_day(b, '#9cc8ea', '#d6ecf4', '#e6eee6', 0.4)
    ridge(b, 160, 80, 4, 33, '#9eb4c4', '#bccad0')
    leafy_row(b, 50, 200, 60, 100, '#7fa06a', '#5f7f52', 35)
    b.haze(110, 210, '#e0e8e0', 0.4)
    water(b, 214, H, '#6aa0c0', '#3a6a8a', 6)
    for x in (500, 1600, 2600):                                          # nhịp cầu đá xa
        b.shade(b.mask_poly([[(x - 260, 214)] + [(x + 220 * math.cos(math.pi - t), 214 - 40 * math.sin(t)) for t in np.linspace(0, math.pi, 24)] + [(x + 260, 214), (x + 260, 196), (x - 260, 196)]]), '#b0a898', '#7a7266', 180, 214, side=2)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    m = mid.mask_rects([(0, H2 - 70, W2, H2 - 58)] + [(x, H2 - 80, x + 26, H2) for x in range(0, W2, 220)])   # lan can + trụ đá
    mid.shade(m, '#c8bca8', '#7a6e5e', H2 - 80, H2, side=3)
    mid.fill(mid.mask_rects([(x, H2 - 58, x + 8, H2) for x in range(0, W2, 44)]), '#8a6a48')
    for x in range(110, W2, 660):                                        # đèn lồng trên trụ
        mid.fill(mid.mask_rects([(x - 8, H2 - 104, x + 8, H2 - 82)]), '#ffcf6a')
        mid.glow(x, H2 - 92, 60, '#ffb34a', 0.35)
    g = ground_tex('#a08a68', '#7a654a', '#b8a07a', seed=37, planks=True)
    return b, mid, g, dict(sky='#9cc8ea', sun='#fff2da', light=1.55)


def gate(battle=False):
    W, H = BACK
    b = Canvas(W, H); sky_day(b, '#9ab8d8', '#d0dfec', '#e6e2d8', 0.6)
    ridge(b, 120, 60, 4, 41, '#a6b6c6', '#c4ccd4')
    crenel_wall(b, 100, H, '#c2bcb2', '#7c766c', 54, 34, 5)
    cx = W // 2
    for x in (cx - 260, cx + 260, 300, W - 300):
        round_tower(b, x, H, 130, 230, '#ccc6bc', '#86807a', roof='#3e5a8a', seed=int(x))
    if not battle:   # cổng vòm lớn + cửa sắt
        arch = [(cx - 150, H), (cx - 150, 150)] + [(cx + 150 * math.cos(math.pi - t), 150 - 70 * math.sin(t)) for t in np.linspace(0, math.pi, 30)] + [(cx + 150, 150), (cx + 150, H)]
        b.fill(b.mask_poly([arch]), '#2a2420')
        b.fill(b.mask_rects([(cx - 150 + k * 30, 90, cx - 146 + k * 30, H) for k in range(11)] + [(cx - 150, y, cx + 150, y + 4) for y in range(110, H, 36)]), '#4a4440')
    for x in range(200, W, 380):                                         # cờ trên tường
        b.shade(b.mask_poly([[(x - 22, 112), (x + 22, 112), (x + 22, 200), (x, 216), (x - 22, 200)]]), '#3563b3', '#1d3870', 112, 216, side=2)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    for x in (260, 760, W2 - 760, W2 - 260):                             # chậu lửa trên chân tường
        mid.shade(mid.mask_rects([(x - 40, H2 - 50, x + 40, H2)]), '#a8a29a', '#5e5a54', H2 - 50, H2, side=3)
        mid.fill(mid.mask_poly([[(x - 18, H2 - 50), (x, H2 - 100), (x + 18, H2 - 50)]]), '#ff9a3a')
        mid.glow(x, H2 - 70, 110, '#ff8a3a', 0.4)
    g = ground_tex('#a2a3a4', '#7c7d80', '#bcbcbe', seed=43, tiles=64)
    return b, mid, g, dict(sky='#9ab8d8', sun='#f6f0e6', light=1.45)


def battlement():
    b, mid, g, info = gate(True)
    info = dict(info, sky='#8e9cb4', light=1.3)
    return b, mid, g, info


def castle():
    W, H = BACK
    b = Canvas(W, H); sky_day(b, '#8db4dc', '#cfdcea', '#e2dccf', 0.55)
    cx = W // 2
    city_skyline(b, 170, 1)
    crenel_wall(b, 60, 200, '#bdb6aa', '#7e776c', 40, 30, 7, cx - 600, cx + 600)
    for x in (cx - 560, cx - 220, cx + 220, cx + 560):
        round_tower(b, x, 200, 110, 190, '#c8c1b5', '#7e776c', roof='#2f4f8a', seed=int(x))
    b.haze(40, 210, '#dfe3ea', 0.12)
    b.fill(b.mask_rects([(0, 200, W, H)]), '#ada290')
    b.blocks(b.mask_rects([(0, 200, W, H)]), 22, 8, '#6a6050', 5)
    village_row(b, 268, 16, 85, 125, 47, lit=True, walls=['#e0d4c0', '#d6c8b0', '#cbbca2'], roofs=['#4a6a9a', '#7a4a3a', '#5a6a7a'])
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    rng = np.random.default_rng(8)
    for x in rng.random(16) * W2:                                       # bao gạo, thùng cứu tế
        mid.shade(mid.mask_ellipses([(x, H2 - 22, 30, 22)]), '#e2d6b8', '#9a8a6a', H2 - 44, H2, side=3)
    for x in (350, W2 - 350):
        mid.shade(mid.mask_rects([(x - 5, 20, x + 5, H2)]), '#3a3a40', '#1e1e24', 20, H2)
        mid.fill(mid.mask_rects([(x - 14, 6, x + 14, 28)]), '#ffd27a'); mid.glow(x, 18, 80, '#ffbf6a', 0.4)
    g = ground_tex('#b8b0a2', '#8e877b', '#cec6b8', seed=49, tiles=64)
    return b, mid, g, dict(sky='#a0bcd8', sun='#fff2e0', light=1.5)


def library():
    W, H = BACK
    b = Canvas(W, H)
    b.grad([(0, '#2a2028'), (1, '#4a3a34')])
    rng = np.random.default_rng(12)
    spine_cols = ['#8a2a2a', '#2a4a7a', '#2f6a4a', '#7a5a2a', '#5a2a6a', '#9a7a3a']
    for x0 in range(0, W, 260):                                         # giá sách cao kín tường
        b.shade(b.mask_rects([(x0 + 6, 10, x0 + 254, H)]), '#6a4a32', '#3a2818', 10, H, side=3)
        for sy in range(26, H - 20, 46):
            xx = x0 + 16
            while xx < x0 + 244:
                bw = 8 + rng.random() * 10; bh = 30 + rng.random() * 10
                b.fill(b.mask_rects([(xx, sy + 40 - bh, xx + bw, sy + 40)]), spine_cols[int(rng.random() * 6)])
                b.fill(b.mask_rects([(xx + 2, sy + 44 - bh, xx + bw - 2, sy + 46 - bh)]), '#e2c070', 0.6)
                xx += bw + 1
            b.fill(b.mask_rects([(x0 + 6, sy + 40, x0 + 254, sy + 46)]), '#4a3222')
    cx = W // 2
    b.shade(b.mask_poly([[(cx - 120, H), (cx - 120, 90)] + [(cx + 120 * math.cos(math.pi - t), 90 - 60 * math.sin(t)) for t in np.linspace(0, math.pi, 24)] + [(cx + 120, 90), (cx + 120, H)]]), '#6a7aa8', '#2a3456', 30, H)
    b.glow(cx, 120, 300, '#a6c0ff', 0.3)
    for x in (600, W - 600, 1100, W - 1100):                              # nến
        b.glow(x, 200, 120, '#ffb860', 0.35); b.glow(x, 200, 8, '#fff0c0', 1.0)
    for _ in range(60):                                                  # bụi bay trong nắng
        b.glow(cx + (rng.random() - 0.5) * 300, 60 + rng.random() * 200, 2.5, '#fff6d8', 0.5)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    for x in (250, 800, W2 - 800, W2 - 250):                             # bàn đọc + chồng sách
        mid.shade(mid.mask_rects([(x - 110, H2 - 70, x + 110, H2 - 56)]), '#7a5a3a', '#4a3424', H2 - 70, H2 - 56)
        mid.fill(mid.mask_rects([(x - 100, H2 - 56, x - 88, H2), (x + 88, H2 - 56, x + 100, H2)]), '#4a3424')
        for k in range(4):
            mid.fill(mid.mask_rects([(x - 60 + k * 4, H2 - 84 - k * 10, x - 10 + k * 4, H2 - 74 - k * 10)]), spine_cols[k])
        mid.fill(mid.mask_rects([(x + 40, H2 - 100, x + 46, H2 - 70)]), '#f2ead8'); mid.glow(x + 43, H2 - 104, 50, '#ffb860', 0.5)
    g = ground_tex('#8a6a4c', '#6a4e36', '#a07e5c', seed=53, planks=True)
    return b, mid, g, dict(sky='#2a2028', sun='#ffd6a0', light=1.15)


def crypt(ruins=False):
    W, H = BACK
    b = Canvas(W, H)
    b.grad([(0, '#0e0e16'), (1, '#2a2a36' if not ruins else '#2a2620')])
    m = b.mask_rects([(0, 0, W, H)])
    b.texture(m, 0.4, 18, 3)
    b.fill(b.mask_rects([(0, y, W, y + 3) for y in range(20, H, 30)]), '#000000', 0.3)
    rng = np.random.default_rng(14)
    for i, x in enumerate(range(140, W, 330)):
        column(b, x, 40, H - 10, 60, '#7a7a8a' if not ruins else '#8a8070', '#3a3a46' if not ruins else '#4a4236', broken=(i % 3 == 1), seed=i)
    for x in range(300, W, 660):                                         # quan tài đá / bia mộ
        b.shade(b.mask_rects([(x - 90, H - 60, x + 90, H - 10)]), '#6a6a78', '#34343e', H - 60, H - 10, side=3)
        b.fill(b.mask_rects([(x - 6, H - 56, x + 6, H - 14), (x - 30, H - 42, x + 30, H - 34)]), '#9a9aaa', 0.6)
    col = '#7ab0ff' if not ruins else '#ffb060'
    for x in rng.random(10) * W:                                         # lửa ma / đuốc
        y = 80 + rng.random() * 120
        b.glow(x, y, 120, col, 0.3); b.glow(x, y, 8, '#ffffff', 0.8)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    rubble = [(x, H2 - 4, 20 + rng.random() * 40, 12 + rng.random() * 20) for x in rng.random(40) * W2]
    mr = mid.mask_ellipses(rubble)
    mid.shade(mr, '#6a6a74' if not ruins else '#7a7060', '#2a2a30', H2 - 40, H2, side=3)
    mid.texture(mr, 0.3, 40, 5)
    for x in (300, W2 - 300):
        column(mid, x, 0, H2, 70, '#8a8a98' if not ruins else '#9a8e7a', '#3a3a46' if not ruins else '#4a4236', seed=int(x))
    g = ground_tex('#5a5c66', '#3c3e48', '#70727c', seed=59, tiles=96)
    return b, mid, g, dict(sky='#0e0e16', sun='#b8c0ff' if not ruins else '#ffc890', light=0.8)


def ruins():
    return crypt(True)


def elf():
    W, H = BACK
    b = Canvas(W, H)
    b.grad([(0, '#123642'), (0.5, '#1f5a5e'), (1, '#2c6a5e')])
    rng = np.random.default_rng(15)
    for i, x in enumerate(range(100, W, 360)):                           # cây cổ thụ khổng lồ xa
        w = 70 + rng.random() * 50
        b.shade(b.mask_poly([[(x - w, H), (x - w * 0.55, 0), (x + w * 0.55, 0), (x + w, H)]]), '#2f5048', '#1a302a', 0, H, side=4, alpha=0.8)
        b.texture(b.mask_rects([(x - w, 0, x + w, H)]), 0.25, 30, i)
    b.haze(0, H, '#2a6a66', 0.45)
    for x in range(260, W, 360):                                         # tán lá phát sáng
        b.glow(x, 30, 240, '#5ae0c0', 0.25)
    for _ in range(120):                                                 # đom đóm / bào tử
        b.glow(rng.random() * W, rng.random() * H, 3 + rng.random() * 3, '#b8ffd8', 0.6)
    for x in rng.random(30) * W:
        ghost_mushroom(b, x, 270, 18 + rng.random() * 24, ['#7fe3d4', '#b49cff', '#ffd27a'][int(x) % 3], int(x))
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    for x in (120, 520, W2 - 520, W2 - 120):                             # rễ cây lớn + nấm
        mid.shade(mid.mask_poly([[(x - 80, H2), (x - 30, H2 - 120), (x, H2 - 140), (x + 30, H2 - 120), (x + 80, H2)]]), '#3a5a4a', '#1a2e26', H2 - 140, H2, side=4)
    for x in rng.random(26) * W2:
        ghost_mushroom(mid, x, H2, 26 + rng.random() * 40, ['#7fe3d4', '#b49cff', '#ffd27a'][int(x) % 3], int(x))
    mid.shade(mid.mask_ellipses([(x, H2 - 4, 30 + rng.random() * 40, 10 + rng.random() * 14) for x in rng.random(40) * W2]), '#3f7a5a', '#1e3e2e', H2 - 30, H2)
    g = ground_tex('#3e6a58', '#2a4a3e', '#527e66', seed=61, moss=True, tufts='#5aa07a')
    return b, mid, g, dict(sky='#123642', sun='#b8f0e0', light=1.1)


def moon():
    W, H = BACK
    b = Canvas(W, H)
    b.grad([(0, '#0c1636'), (0.6, '#25407a'), (1, '#3c5a96')])
    stars(b, 200, 140, 9)
    b.glow(W * 0.5, 50, 70, '#f6f6ff', 1.0, core=48)                      # trăng tròn lớn
    b.glow(W * 0.5, 50, 520, '#8eb0ff', 0.3)
    rng = np.random.default_rng(16)
    for i, x in enumerate(range(150, W, 240)):                           # tháp trắng thành Lunaria
        h = 120 + rng.random() * 110
        b.shade(b.mask_rects([(x - 26, 260 - h, x + 26, 270)]), '#e8eeff', '#8a9ac8', 260 - h, 270, side=3, alpha=0.9)
        b.shade(b.mask_poly([[(x - 34, 262 - h), (x, 210 - h), (x + 34, 262 - h)]]), '#c8d4ff', '#6a7ab0', 210 - h, 262 - h)
        b.glow(x, 250 - h, 40, '#bcd2ff', 0.35)
        for k in range(3):
            b.glow(x, 270 - h + 30 + k * 34, 4, '#ffe8b0', 0.8)
    b.haze(150, 280, '#5a74b0', 0.3)
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    for x in (180, 600, W2 - 600, W2 - 180):
        column(mid, x, 0, H2, 64, '#c6d0ec', '#6a78a6', seed=int(x))
        mid.glow(x, 40, 60, '#cfe0ff', 0.3)
    mid.fill(mid.mask_rects([(0, 0, 700, 16), (W2 - 700, 0, W2, 16)]), '#b8c4e4')
    for _ in range(40):
        mid.glow(rng.random() * W2, rng.random() * H2, 2.5, '#d8e6ff', 0.6)
    g = ground_tex('#b8c6da', '#8e9cb4', '#d2dcec', seed=67, tiles=96, polish=True)
    return b, mid, g, dict(sky='#0c1636', sun='#c8dcff', light=1.3)


def road():
    W, H = BACK
    b = Canvas(W, H); sky_day(b, '#9cc4e4', '#dceaf0', '#f0e6cc', 0.45)
    ridge(b, 150, 80, 4, 71, '#9eb4c6', '#bccad2')
    leafy_row(b, 30, 200, 60, 110, '#7fa06a', '#5f7f52', 73)
    b.haze(110, 210, '#e4e8dc', 0.4)
    wheat(b, 250, 50, 600, '#cdbf62', '#8f8a3c', 75)
    leafy_row(b, 18, 276, 120, 180, '#6f9a5a', '#3f6a3a', 77, trunk='#5a4030')
    mid = Canvas(*MID, opaque=False); W2, H2 = MID
    rng = np.random.default_rng(19)
    for x in (500, W2 - 500):                                            # cột mốc + biển chỉ đường
        mid.shade(mid.mask_rects([(x - 6, 40, x + 6, H2)]), '#8a6a48', '#4a3424', 40, H2)
        mid.shade(mid.mask_poly([[(x - 70, 46), (x + 60, 46), (x + 80, 60), (x + 60, 74), (x - 70, 74)]]), '#b08a5a', '#6a4a30', 46, 74)
    mid.shade(mid.mask_ellipses([(x, H2 - 4, 30 + rng.random() * 50, 12 + rng.random() * 20) for x in rng.random(40) * W2]), '#7aa060', '#3c5a34', H2 - 36, H2)
    g = ground_tex('#b09c74', '#8a7854', '#c8b48a', seed=79, pebbles=True, tufts='#94a462', flowers=['#ffffff', '#f2c040'])
    return b, mid, g, dict(sky='#9cc4e4', sun='#fff2d8', light=1.55)


SCENES = {'forest': forest, 'hall': hall, 'tower': tower, 'village': village, 'field': field, 'mine': mine, 'deepMine': deepMine,
          'outpost': outpost, 'swamp': swamp, 'camp': camp, 'square': square, 'well': well, 'market': market, 'bridge': bridge,
          'gate': gate, 'battlement': battlement, 'castle': castle, 'library': library, 'crypt': crypt, 'ruins': ruins,
          'elf': elf, 'moon': moon, 'road': road}


def main(names):
    OUT.mkdir(parents=True, exist_ok=True)
    meta_path = OUT / 'battle_bg.json'
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
    for name in names:
        back, mid, ground, info = SCENES[name]()
        bim = back.image(BACK).convert('RGB')
        bim.save(OUT / f'{name}_back.webp', 'WEBP', quality=88)
        foot = np.asarray(bim, float)[-6:].reshape(-1, 3).mean(0).astype(int)
        info.setdefault('fog', '#%02x%02x%02x' % tuple(foot))
        mid.image(MID).save(OUT / f'{name}_mid.webp', 'WEBP', quality=90)
        ground.save(OUT / f'{name}_ground.webp', 'WEBP', quality=86)
        meta[name] = info
        print('ve xong', name)
    meta_path.write_text(json.dumps(meta, indent=1, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1:] or list(SCENES))
