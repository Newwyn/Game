# ============================================================
# BỘ CỌ VẼ NỀN TRẬN KIỂU "ANIME TÔ MÀU NƯỚC" (dùng cho tools/battle_bg2.py)
#   - Vẽ ở 2x rồi thu nhỏ (khử răng cưa)
#   - Khối nổi (tán cây, mây, đá): dựng "độ cao" từ các bán cầu -> tô 3-4 mảng sáng tối như tranh anime
#   - Mép đọng màu, hạt giấy, sương nhiều lớp, ánh sáng cộng
# ============================================================
import math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

SS = 2
F = np.float32
LIGHT = np.array([-0.55, -0.62, 0.56], F)          # nắng từ trên-trái (y màn hình hướng xuống)
LIGHT /= np.linalg.norm(LIGHT)


def hx(h):
    if not isinstance(h, str):
        return np.asarray(h, F)
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], F)


def mix(a, b, t):
    return a + (b - a) * t


def mixh(a, b, t):
    return mix(hx(a), hx(b), t)


def sstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0 + 1e-9), 0, 1)
    return t * t * (3 - 2 * t)


def fbm(h, w, cell, seed, octaves=4, tile=False):
    """Nhiễu mượt 0..1 (cell = cỡ hạt lớn nhất, tính theo điểm ảnh)."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), F); amp = 1.0; tot = 0.0
    for o in range(octaves):
        c = max(2.0, cell / 2 ** o)
        gh, gw = max(2, int(round(h / c))), max(2, int(round(w / c)))
        g = rng.random((gh, gw)).astype(F)
        if tile:
            g = np.pad(g, 2, mode='wrap')
            im = Image.fromarray(g).resize((int(w * (gw + 4) / gw), int(h * (gh + 4) / gh)), Image.BICUBIC)
            a = np.asarray(im, F)
            oy, ox = int(2 * h / gh), int(2 * w / gw)
            a = a[oy:oy + h, ox:ox + w]
        else:
            a = np.asarray(Image.fromarray(g).resize((w, h), Image.BICUBIC), F)
        out += a * amp; tot += amp; amp *= 0.5
    return np.clip(out / tot, 0, 1)


def ramp(t, cols, soft=0.05):
    """Tô mảng: t (0..1) -> màu, chuyển mảng gọn (kiểu cel) với mép mềm `soft`."""
    cols = [hx(c) for c in cols]
    n = len(cols)
    out = np.broadcast_to(cols[0], t.shape + (3,)).astype(F).copy()
    for i in range(1, n):
        k = sstep(i / n - soft, i / n + soft, t)[..., None]
        out = out * (1 - k) + cols[i] * k
    return out


class Cv:
    """Tấm vẽ: toạ độ nhận vào là điểm ảnh của ảnh XUẤT (tự nhân SS)."""

    def __init__(self, w, h, opaque=True, seed=1):
        self.w, self.h = w, h
        self.W, self.H = w * SS, h * SS
        self.rgb = np.zeros((self.H, self.W, 3), F)
        self.a = (np.ones if opaque else np.zeros)((self.H, self.W), F)
        self.opaque = opaque
        self.nz = fbm(self.H, self.W, 90 * SS, seed + 11, 5)          # nhiễu vừa
        self.nf = fbm(self.H, self.W, 7 * SS, seed + 23, 3)           # nhiễu mịn (hạt cọ)
        self.rng = np.random.default_rng(seed)

    # ---------- khung con ----------
    def _clip(self, y0, x0, m):
        y1, x1 = y0 + m.shape[0], x0 + m.shape[1]
        cy0, cx0, cy1, cx1 = max(0, y0), max(0, x0), min(self.H, y1), min(self.W, x1)
        if cy0 >= cy1 or cx0 >= cx1:
            return None
        return (slice(cy0, cy1), slice(cx0, cx1)), (slice(cy0 - y0, cy1 - y0), slice(cx0 - x0, cx1 - x0))

    def over(self, y0, x0, m, col):
        """Phủ màu (m = độ phủ 0..1, toạ độ SS)."""
        c = self._clip(y0, x0, m)
        if c is None:
            return
        S, s = c
        m = m[s]
        col = hx(col) if isinstance(col, str) else col
        if col.ndim == 3:
            col = col[s]
        A = self.a[S]
        oa = m + A * (1 - m)
        self.rgb[S] = (col * m[..., None] + self.rgb[S] * (A * (1 - m))[..., None]) / np.maximum(oa, 1e-5)[..., None]
        self.a[S] = oa

    def light(self, y0, x0, m, col, alpha_gain=0.9):
        """Cộng sáng (kiểu screen). Tấm trong suốt: chỗ sáng tự có độ phủ."""
        c = self._clip(y0, x0, m)
        if c is None:
            return
        S, s = c
        m = m[s][..., None]
        col = hx(col)
        if self.opaque:
            self.rgb[S] = 1 - (1 - self.rgb[S]) * (1 - col * m)
        else:
            A = self.a[S][..., None]
            la = np.clip(m * alpha_gain, 0, 1)
            oa = la + A * (1 - la)
            self.rgb[S] = (np.broadcast_to(col, self.rgb[S].shape) * la + (1 - (1 - self.rgb[S]) * (1 - col * m)) * A * (1 - la)) / np.maximum(oa, 1e-5)
            self.a[S] = oa[..., 0]

    def mul(self, y0, x0, k):
        """Nhân màu (bóng đổ / nhuộm)."""
        c = self._clip(y0, x0, k[..., 0] if k.ndim == 3 else k)
        if c is None:
            return
        S, s = c
        self.rgb[S] *= k[s] if k.ndim == 3 else k[s][..., None]

    # ---------- mặt nạ ----------
    def mask(self, draw_fn, box, blur=0.0):
        """draw_fn(d, ox, oy, s): vẽ bằng ImageDraw trong khung box=(x0,y0,x1,y1) (đv ảnh xuất). Trả (y0, x0, m)."""
        p = 4 + int(blur * SS * 3)
        x0 = int(math.floor(box[0] * SS)) - p; y0 = int(math.floor(box[1] * SS)) - p
        x1 = int(math.ceil(box[2] * SS)) + p; y1 = int(math.ceil(box[3] * SS)) + p
        im = Image.new('L', (max(1, x1 - x0), max(1, y1 - y0)), 0)
        draw_fn(ImageDraw.Draw(im), lambda x: x * SS - x0, lambda y: y * SS - y0)
        m = np.asarray(im, F) / 255
        if blur:
            m = ndi.gaussian_filter(m, blur * SS)
        return y0, x0, m

    def rect(self, x0, y0, x1, y1, blur=0.0):
        return self.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], blur)

    def poly(self, pts, blur=0.0):
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        return self.mask(lambda d, X, Y: d.polygon([(X(x), Y(y)) for x, y in pts], fill=255),
                         (min(xs), min(ys), max(xs), max(ys)), blur)

    def polys(self, plist, blur=0.0):
        xs = [p[0] for pts in plist for p in pts]; ys = [p[1] for pts in plist for p in pts]

        def fn(d, X, Y):
            for pts in plist:
                d.polygon([(X(x), Y(y)) for x, y in pts], fill=255)
        return self.mask(fn, (min(xs), min(ys), max(xs), max(ys)), blur)

    def lines(self, segs, blur=0.0):
        """segs = [(x0,y0,x1,y1,width), ...]"""
        xs = [v for s in segs for v in (s[0], s[2])]; ys = [v for s in segs for v in (s[1], s[3])]
        wmax = max(s[4] for s in segs)

        def fn(d, X, Y):
            for x0, y0, x1, y1, w in segs:
                d.line([(X(x0), Y(y0)), (X(x1), Y(y1))], fill=255, width=max(1, int(round(w * SS))))
        return self.mask(fn, (min(xs) - wmax, min(ys) - wmax, max(xs) + wmax, max(ys) + wmax), blur)

    def ells(self, es, blur=0.0):
        """es = [(cx,cy,rx,ry), ...]"""
        def fn(d, X, Y):
            for cx, cy, rx, ry in es:
                d.ellipse([X(cx - rx), Y(cy - ry), X(cx + rx), Y(cy + ry)], fill=255)
        return self.mask(fn, (min(e[0] - e[2] for e in es), min(e[1] - e[3] for e in es),
                              max(e[0] + e[2] for e in es), max(e[1] + e[3] for e in es)), blur)

    # ---------- tô ----------
    def noise_at(self, y0, x0, shape, fine=False, scale=1):
        src = self.nf if fine else self.nz
        yy = (np.arange(shape[0]) * scale + y0 * 3 + 977).astype(int) % self.H
        xx = (np.arange(shape[1]) * scale + x0 + 131).astype(int) % self.W
        return src[yy][:, xx]

    def wash(self, shp, top, bot=None, alpha=1.0, grain=0.06, edge=0.0, side=0.0):
        """Tô phẳng kiểu màu nước: dải dọc top->bot + loang nhiễu + mép đọng màu (edge) + mặt khuất bên phải (side)."""
        y0, x0, m = shp
        h, w = m.shape
        t = np.linspace(0, 1, h, dtype=F)[:, None, None]
        col = mix(hx(top), hx(bot if bot is not None else top), t) * np.ones((1, w, 1), F)
        n = self.noise_at(y0, x0, m.shape)
        nf = self.noise_at(y0, x0, m.shape, True)
        col = col * (1 + grain * 2.2 * (n - 0.5) + grain * (nf - 0.5))[..., None]
        if side:
            xs = np.linspace(0, 1, w, dtype=F)[None, :, None]
            col = col * (1 + side * (0.5 - xs))
        if edge:
            e = np.clip(m - ndi.gaussian_filter(m, 2.2 * SS), 0, 1) * 2
            col = col * (1 - edge * e)[..., None]
        self.over(y0, x0, m * alpha, np.clip(col, 0, 1))

    def relief(self, circles, cols, alpha=1.0, soft=0.05, grain=0.22, bias=0.0, squash=1.0, ybias=0.25, clip=None, rim=0.0, rimcol='#ffffff', smooth=1.0):
        """Khối nổi từ các bán cầu circles=[(cx,cy,r)] (đv ảnh xuất). cols: tối -> sáng (3-4 màu).
        clip(yy, xx) -> mặt nạ nhân thêm (vd cắt phẳng đáy mây)."""
        cs = [(cx * SS, cy * SS, r * SS) for cx, cy, r in circles]
        x0 = int(min(c[0] - c[2] for c in cs)) - 3; x1 = int(max(c[0] + c[2] for c in cs)) + 3
        y0 = int(min(c[1] - c[2] for c in cs)) - 3; y1 = int(max(c[1] + c[2] for c in cs)) + 3
        x0c, y0c, x1c, y1c = max(x0, -8), max(y0, -8), min(x1, self.W + 8), min(y1, self.H + 8)
        if x1c <= x0c or y1c <= y0c:
            return
        Hh = np.zeros((y1c - y0c, x1c - x0c), F)
        for cx, cy, r in cs:
            a0, a1 = max(int(cy - r), y0c), min(int(cy + r) + 2, y1c)
            b0, b1 = max(int(cx - r), x0c), min(int(cx + r) + 2, x1c)
            if a0 >= a1 or b0 >= b1:
                continue
            yy = (np.arange(a0, a1, dtype=F) - cy)[:, None]; xx = (np.arange(b0, b1, dtype=F) - cx)[None, :]
            hh = np.sqrt(np.maximum(r * r - yy * yy - xx * xx, 0)) * squash
            sub = Hh[a0 - y0c:a1 - y0c, b0 - x0c:b1 - x0c]
            np.maximum(sub, hh, out=sub)
        m = np.clip(Hh / (1.2 * SS), 0, 1)
        Hs = ndi.gaussian_filter(Hh, smooth * SS)
        gy, gx = np.gradient(Hs)
        nrm = np.sqrt(gx * gx + gy * gy + 1)
        lam = (-gx * LIGHT[0] - gy * LIGHT[1] + LIGHT[2]) / nrm
        yy = np.linspace(0, 1, Hh.shape[0], dtype=F)[:, None]
        t = lam * 0.62 + 0.30 + ybias * (0.5 - yy) + bias
        t = t + grain * (self.noise_at(y0c, x0c, Hh.shape) - 0.5) + grain * 0.6 * (self.noise_at(y0c, x0c, Hh.shape, True) - 0.5)
        col = ramp(np.clip(t, 0, 0.999), cols, soft)
        if rim:
            e = np.clip(m - ndi.gaussian_filter(m, 2.5 * SS), 0, 1) * 2 * np.clip(lam, 0, 1)
            col = mix(col, hx(rimcol), np.clip(e * rim, 0, 1)[..., None])
        if clip is not None:
            m = m * clip(np.arange(y0c, y1c, dtype=F)[:, None] / SS, np.arange(x0c, x1c, dtype=F)[None, :] / SS)
        self.over(y0c, x0c, m * alpha, col)

    def grad(self, stops):
        y = np.linspace(0, 1, self.H, dtype=F)
        col = np.zeros((self.H, 3), F)
        for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
            mk = (y >= p0) & (y <= p1)
            col[mk] = mix(hx(c0), hx(c1), ((y[mk] - p0) / max(1e-6, p1 - p0))[:, None])
        self.rgb[:] = col[:, None, :]
        self.rgb *= (1 + 0.05 * (self.nz - 0.5))[..., None]

    def haze(self, y0, y1, col, k, wavy=0.0, x_fade=None):
        """Sương: đậm dần từ y0 xuống y1 (đv ảnh xuất). wavy: mép sương gợn theo nhiễu."""
        y = np.arange(self.H, dtype=F)[:, None] / SS
        t = (y - y0) / max(1e-6, y1 - y0)
        if wavy:
            t = t + wavy * (self.nz - 0.5)
        t = sstep(0, 1, t) * k
        if not self.opaque:
            t = t * self.a
        self.rgb[:] = self.rgb * (1 - t[..., None]) + hx(col) * t[..., None]

    def band(self, y0, y1, col, k, wavy=0.5, feather=0.35):
        """Dải sương nằm ngang (mờ cả trên lẫn dưới)."""
        y = np.arange(self.H, dtype=F)[:, None] / SS
        c = (y - y0) / max(1e-6, y1 - y0)
        t = sstep(0, feather, c) * (1 - sstep(1 - feather, 1, c))
        t = t * np.clip(0.5 + wavy * (self.nz - 0.5) * 2, 0, 1) * k
        if self.opaque:
            self.rgb[:] = self.rgb * (1 - t[..., None]) + hx(col) * t[..., None]
        else:
            self.over(0, 0, t, col)

    def glow(self, x, y, r, col, k=1.0, power=2.0, sy=1.0):
        R = int(r * SS)
        Ry = int(R * sy)
        yy = np.linspace(-1, 1, 2 * Ry + 1, dtype=F)[:, None]; xx = np.linspace(-1, 1, 2 * R + 1, dtype=F)[None, :]
        d = np.clip(1 - np.sqrt(yy * yy + xx * xx), 0, 1) ** power * k
        self.light(int(y * SS) - Ry, int(x * SS) - R, d, col)

    def ray(self, x_top, x_bot, w_top, w_bot, col, k, y0=0, y1=None, blur=6):
        y1 = self.h if y1 is None else y1
        shp = self.poly([(x_top - w_top / 2, y0), (x_top + w_top / 2, y0), (x_bot + w_bot / 2, y1), (x_bot - w_bot / 2, y1)], blur)
        yy, xx, m = shp
        fade = np.linspace(1, 0.25, m.shape[0], dtype=F)[:, None]
        n = 0.6 + 0.8 * self.noise_at(yy, xx, m.shape)
        self.light(yy, xx, m * fade * n * k, col, alpha_gain=0.55)

    def dots(self, pts, col, r=1.2, alpha=1.0):
        """pts=[(x,y)] chấm nhỏ (hoa, lá sáng)."""
        if not len(pts):
            return
        self.over(*self.ells([(x, y, r, r) for x, y in pts]), col) if alpha >= 1 else self.wash(self.ells([(x, y, r, r) for x, y in pts]), col, alpha=alpha, grain=0)

    def lightmap(self, lights, ambient):
        """Chiếu sáng cả tấm: màu *= ambient + tổng các đèn [(x, y, bán kính, '#màu', cường độ)]."""
        L = np.zeros((self.H, self.W, 3), F)
        for x, y, r, col, k in lights:
            R = int(r * SS)
            yy = np.linspace(-1, 1, 2 * R + 1, dtype=F)[:, None]; xx = np.linspace(-1, 1, 2 * R + 1, dtype=F)[None, :]
            d = np.clip(1 - np.sqrt(yy * yy + xx * xx), 0, 1) ** 2 * k
            c = self._clip(int(y * SS) - R, int(x * SS) - R, d)
            if c:
                L[c[0]] += d[c[1]][..., None] * hx(col)
        self.rgb *= hx(ambient) + L

    def finish(self, grain=0.035, sat=1.0, bleed=0.0):
        """Hạt giấy + thu nhỏ. Trả PIL RGBA / RGB."""
        rgb = self.rgb
        rgb = rgb * (1 + grain * 2 * (self.nf - 0.5) + grain * (self.nz - 0.5))[..., None]
        if sat != 1.0:
            g = rgb.mean(-1, keepdims=True)
            rgb = g + (rgb - g) * sat
        rgb = np.clip(rgb, 0, 1)
        if self.opaque:
            im = Image.fromarray((rgb * 255 + 0.5).astype(np.uint8), 'RGB')
            return im.resize((self.w, self.h), Image.LANCZOS)
        a = np.clip(self.a, 0, 1)
        # thu nhỏ theo màu nhân sẵn độ phủ -> mép không viền đen
        pm = np.dstack([rgb * a[..., None], a[..., None]])
        small = np.stack([np.asarray(Image.fromarray(pm[..., i]).resize((self.w, self.h), Image.LANCZOS), F) for i in range(4)], -1)
        al = np.clip(small[..., 3:4], 0, 1)
        out = np.where(al > 1e-4, small[..., :3] / np.maximum(al, 1e-4), 0)
        return Image.fromarray((np.clip(np.dstack([out, al]), 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')


# ============================================================
# VẬT VẼ SẴN
# ============================================================
def canopy_circles(rng, cx, cy, rx, ry, n=9, leaf=0.16):
    """Tán lá: vài chùm lớn + rất nhiều bướu lá nhỏ ở rìa (mép tán lởm chởm tự nhiên)."""
    out = []
    for _ in range(n):
        a = rng.random() * 2 * math.pi; d = math.sqrt(rng.random()) * 0.72
        x = cx + math.cos(a) * rx * d; y = cy + math.sin(a) * ry * d * 0.9 - ry * 0.05
        r = min(rx, ry) * (0.34 + rng.random() * 0.24)
        out.append((x, y, r))
        for _ in range(9):
            b = rng.random() * 2 * math.pi
            rr = r * (leaf + rng.random() * leaf)
            out.append((x + math.cos(b) * r * 0.93, y + math.sin(b) * r * 0.93, rr))
    return out


def trunk_pts(x, base, top, w, lean=0.0, flare=1.9):
    """Thân cây hơi cong, loe ở gốc."""
    L, R = [], []
    n = 7
    for i in range(n + 1):
        t = i / n
        y = base + (top - base) * t
        ww = w * (0.5 + 0.5 * (1 - t)) * (1 + (flare - 1) * max(0, 1 - t * 5) ** 2)
        xx = x + lean * (t ** 1.6) * (base - top) * 0.3
        L.append((xx - ww / 2, y)); R.append((xx + ww / 2, y))
    return L + R[::-1]


def foliage(c, clumps, cols, rng, alpha=1.0, jitter=0.07, grain=0.10):
    """Tán lá kiểu anime: mỗi chùm lá = mảng tối (mép lởm chởm) + mảng vừa + mảng sáng lệch về phía nắng + vài nhát sáng.
    Chùm vẽ lần lượt (dưới trước, trên sau) nên giữa các chùm có mép tối tách khối."""
    base = [hx(k) for k in cols]
    for x, y, r in sorted(clumps, key=lambda q: -(q[1] - q[0] * 0.25)):
        j = 1 + jitter * (rng.random() - 0.5) * 2
        warm = (rng.random() - 0.5) * jitter
        cc = [np.clip(k * j + np.array([warm, warm * 0.4, -warm], F), 0, 1) for k in base]

        def ragged(cx, cy, rr, a0=0.0, a1=2 * math.pi, n=12, big=0.26):
            es = [(cx, cy, rr, rr * 0.94)]
            for _ in range(n):
                a = a0 + rng.random() * (a1 - a0)
                q = rr * (0.12 + rng.random() * big)
                es.append((cx + math.cos(a) * rr * 0.92, cy + math.sin(a) * rr * 0.88, q, q * (0.7 + rng.random() * 0.3)))
            return es
        c.wash(c.ells(ragged(x, y, r, n=14)), cc[0], mix(cc[0], cc[0] * 0.8, 1), alpha=alpha, grain=grain)
        c.wash(c.ells(ragged(x - r * 0.13, y - r * 0.17, r * 0.80, -0.3, 2.2, 10)), cc[1], alpha=alpha, grain=grain)
        c.wash(c.ells(ragged(x - r * 0.26, y - r * 0.33, r * 0.54, 0.0, 2.4, 8, 0.3)), cc[2], alpha=alpha, grain=grain)
        if len(cc) > 3:
            hs = []
            for _ in range(5):
                a = math.pi * (1.05 + rng.random() * 0.5); d = r * (0.25 + rng.random() * 0.5)
                q = r * (0.07 + rng.random() * 0.1)
                hs.append((x + math.cos(a) * d - r * 0.1, y + math.sin(a) * d * 0.9 - r * 0.05, q * 1.3, q))
            c.wash(c.ells(hs), cc[3], alpha=alpha * 0.95, grain=grain)
            if r > 9:      # lá li ti: nhát sáng phía nắng, nhát tối phía khuất, vài lá rìa
                fl, fd = [], []
                for _ in range(int(6 + r * 0.22)):
                    a = math.pi * (0.85 + rng.random() * 0.9); d = r * (0.1 + rng.random() * 0.8)
                    q = max(0.9, r * (0.025 + rng.random() * 0.03)); t = rng.random() * 3.14
                    fl.append([(x + math.cos(a) * d + math.cos(t + u) * q * (2.2 if i % 2 == 0 else 0.9), y + math.sin(a) * d * 0.9 + math.sin(t + u) * q * (2.2 if i % 2 == 0 else 0.9))
                               for i, u in enumerate((0, 1.57, 3.14, 4.71))])
                for _ in range(int(5 + r * 0.16)):
                    a = math.pi * (-0.15 + rng.random() * 0.8); d = r * (0.2 + rng.random() * 0.7)
                    q = max(0.9, r * (0.03 + rng.random() * 0.035)); t = rng.random() * 3.14
                    fd.append([(x + math.cos(a) * d + math.cos(t + u) * q * (2.2 if i % 2 == 0 else 0.9), y + math.sin(a) * d * 0.9 + math.sin(t + u) * q * (2.2 if i % 2 == 0 else 0.9))
                               for i, u in enumerate((0, 1.57, 3.14, 4.71))])
                c.wash(c.polys(fl), mix(cc[3], hx('#f6ffc0'), 0.35), alpha=alpha * 0.9, grain=0.05)
                c.wash(c.polys(fd), cc[0] * 0.72, alpha=alpha * 0.8, grain=0.05)


def canopy_clumps(rng, cx, cy, rx, ry, n=14, rmin=0.24, rmax=0.42):
    out = []
    s = min(rx, ry)
    for i in range(n):
        a = rng.random() * 2 * math.pi; d = math.sqrt(rng.random()) * 0.78
        r = s * (rmin + rng.random() * (rmax - rmin)) * (1.15 - 0.4 * d)
        out.append((cx + math.cos(a) * (rx - r * 0.6) * d, cy + math.sin(a) * (ry - r * 0.6) * d, r))
    return out


def tree(c, x, base, h, w, leaf_cols, trunk=('#6b513c', '#3a2a20'), seed=0, lean=0.0, canopy=0.55, alpha=1.0, branch=True, tw=None, lit='#c9a877', detail=True, moss=('#2f6a44', '#58994e', '#a6d264')):
    """Cây lá rộng kiểu anime: thân chẻ nhánh + tán nhiều chùm lá."""
    rng = np.random.default_rng(seed)
    top = base - h
    tw = tw or max(3.0, w * 0.10)
    cy = top + h * canopy * 0.5
    cx = x + lean * h * 0.3
    tp = trunk_pts(x, base, cy, tw, lean)
    c.wash(c.poly(tp), trunk[0], trunk[1], alpha=alpha, grain=0.3, edge=0.6, side=0.7)
    if lit:   # vệt nắng mép trái thân
        n = len(tp) // 2
        strip = tp[:n] + [(px + tw * 0.16, py) for px, py in tp[:n]][::-1]
        c.wash(c.poly(strip, 0.5), lit, alpha=alpha * 0.55, grain=0.3)
    if detail and tw >= 6:
        fx = lambda t: x + lean * (t ** 1.6) * (base - cy) * 0.3            # tâm thân theo độ cao t (0 = gốc)
        hw = lambda t: tw * (0.5 + 0.5 * (1 - t)) * 0.5
        segs = []
        for _ in range(int(tw * 0.9)):                                      # vân vỏ dọc
            u = (rng.random() - 0.5) * 1.6; t0 = rng.random() * 0.85; L = 0.05 + rng.random() * 0.12
            for k in range(3):
                ta, tb = t0 + L * k / 3, t0 + L * (k + 1) / 3
                segs.append((fx(ta) + u * hw(ta) + math.sin(ta * 40 + u * 9) * 0.8, base + (cy - base) * ta, fx(tb) + u * hw(tb) + math.sin(tb * 40 + u * 9) * 0.8, base + (cy - base) * tb, 0.9 + tw * 0.02))
        c.wash(c.lines(segs), mixh(trunk[1], '#000000', 0.35), alpha=alpha * 0.5)
        for _ in range(2):                                                  # mắt gỗ
            t = 0.15 + rng.random() * 0.6; u = (rng.random() - 0.5) * 0.7
            c.wash(c.ells([(fx(t) + u * hw(t), base + (cy - base) * t, tw * 0.13, tw * 0.2)]), mixh(trunk[1], '#000000', 0.4), alpha=alpha * 0.8)
            c.wash(c.ells([(fx(t) + u * hw(t) - tw * 0.02, base + (cy - base) * t - tw * 0.03, tw * 0.07, tw * 0.11)]), trunk[0], alpha=alpha * 0.8)
        roots = []
        for sg in (-1, 1, -0.5, 0.6):                                       # rễ nổi
            rx = x + sg * tw * (0.7 + rng.random() * 0.5)
            roots.append([(x + sg * tw * 0.2, base - tw * 0.9), (rx, base - tw * 0.12), (rx + sg * tw * 0.7, base + 2), (x + sg * tw * 0.1, base + 2)])
        c.wash(c.polys(roots), trunk[0], trunk[1], alpha=alpha, grain=0.3, edge=0.6)
        dap = [(fx(t) - hw(t) * 0.3 * rng.random(), base + (cy - base) * t, tw * (0.10 + rng.random() * 0.12), tw * (0.16 + rng.random() * 0.2)) for t in rng.random(5) * 0.8 + 0.08]
        c.wash(c.ells(dap, 0.8), '#f6e6a8', alpha=alpha * 0.5, grain=0.2)   # đốm nắng trên thân
        if moss:
            ms = [(x + (rng.random() - 0.7) * tw * 1.3, base - rng.random() * tw * 1.4, tw * (0.12 + rng.random() * 0.16)) for _ in range(9)]
            c.relief(ms, moss, squash=0.5, alpha=alpha)
    cl = canopy_clumps(rng, cx, cy, w * 0.5, h * canopy * 0.5, n=20)
    if branch:
        segs = []
        for s in (-1, 1, -0.4):
            by = cy + h * (0.12 + rng.random() * 0.10)
            bx = x + lean * (base - by) * 0.2
            ex, ey = cx + s * w * (0.2 + rng.random() * 0.1), cy + h * 0.02 * rng.random()
            segs.append((bx, by, ex, ey, tw * 0.42))
            cl.append((ex, ey - w * 0.04, w * 0.13))
        c.wash(c.lines(segs), trunk[1], alpha=alpha, grain=0.1)
    # khối tối lót sau tán (kín, không hở trời giữa các chùm)
    c.wash(c.ells([(cx, cy, w * 0.36, h * canopy * 0.34)] + [(px, py, r * 0.8, r * 0.8) for px, py, r in cl]), mixh(leaf_cols[0], '#0a1f24', 0.25), alpha=alpha, grain=0.1)
    foliage(c, cl, leaf_cols, rng, alpha=alpha)


def bush(c, x, base, w, h, cols, seed=0, alpha=1.0, n=5):
    rng = np.random.default_rng(seed)
    cl = [(x + (rng.random() - 0.5) * w * 0.7, base - h * (0.25 + rng.random() * 0.45), h * (0.3 + rng.random() * 0.22)) for _ in range(n)]
    foliage(c, cl, cols, rng, alpha=alpha)


def conifer_pts(x, base, h, w, rng, tiers=6):
    """Bóng cây lá kim (tầng lá rủ)."""
    L, R = [(x, base - h)], [(x, base - h)]
    for i in range(1, tiers + 1):
        t = i / tiers
        y = base - h + h * 0.92 * t
        ww = w * 0.5 * (0.18 + 0.82 * t) * (0.85 + rng.random() * 0.3)
        L += [(x - ww, y + h * 0.02), (x - ww * 0.55, y - h * 0.035)]
        R += [(x + ww, y + h * 0.02), (x + ww * 0.55, y - h * 0.035)]
    return L + [(x - w * 0.05, base - h * 0.08), (x - w * 0.05, base), (x + w * 0.05, base), (x + w * 0.05, base - h * 0.08)] + R[::-1]


def grass(c, x0, x1, base, hmin, hmax, n, cols, seed=0, lean=0.5):
    """Bụi cỏ: lá nhọn cong (đa giác mảnh)."""
    rng = np.random.default_rng(seed)
    groups = [[] for _ in cols]
    for _ in range(n):
        x = x0 + rng.random() * (x1 - x0)
        h = hmin + rng.random() * (hmax - hmin)
        l = (rng.random() - 0.5) * 2 * lean * h
        w = 1.0 + h * 0.07
        groups[rng.integers(len(cols))].append([(x - w, base + 1), (x - w * 0.3 + l * 0.45, base - h * 0.6), (x + l, base - h),
                                                 (x + w * 0.5 + l * 0.5, base - h * 0.55), (x + w, base + 1)])
    for g, col in zip(groups, cols):
        if g:
            c.wash(c.polys(g), col, grain=0.1)


def rock(c, x, base, w, h, cols=('#4d5560', '#7d8690', '#aab2b6', '#d5d8d2'), seed=0, moss=None):
    """Tảng đá góc cạnh: đa giác nhiều mặt, mỗi mặt một sắc độ."""
    rng = np.random.default_rng(seed)
    n = 7
    pts = []
    for i in range(n):
        a = math.pi + math.pi * i / (n - 1)
        r = 0.78 + rng.random() * 0.3
        pts.append((x + math.cos(a) * w * 0.5 * r, base + math.sin(a) * h * r))
    pts = [(x - w * 0.5, base + 1)] + pts[1:-1] + [(x + w * 0.5, base + 1)]
    c.wash(c.poly(pts), cols[1], cols[0], grain=0.25, edge=0.7)
    apex = (x - w * 0.08 + rng.random() * w * 0.1, base - h * 0.55)
    k = len(pts)
    for i in range(k - 1):
        t = i / (k - 2)
        face = [pts[i], pts[i + 1], apex]
        col = mixh(cols[3], cols[0], min(1, t * 1.25))
        c.wash(c.poly(face), col, grain=0.3, alpha=0.85)
    c.wash(c.poly([pts[0], apex, pts[-1]]), cols[1], cols[0], grain=0.3, alpha=0.9)
    if moss:
        cs = [(x + (rng.random() - 0.6) * w * 0.5, base - h * (0.75 + rng.random() * 0.2), w * (0.07 + rng.random() * 0.06)) for _ in range(6)]
        c.relief(cs, moss, squash=0.5)


def cloud(c, x, y, w, h, cols=('#9db4d6', '#c9d8ec', '#f3f6fa', '#ffffff'), seed=0, alpha=1.0):
    """Mây tích kiểu anime: đỉnh cuộn, đáy phẳng mờ."""
    rng = np.random.default_rng(seed)
    cs = []
    n = int(6 + w / 40)
    for i in range(n):
        t = (i + rng.random() * 0.6) / n
        px = x - w / 2 + w * t
        env = math.sin(math.pi * min(1, max(0, t))) ** 0.7
        hh = h * env * (0.45 + rng.random() * 0.55)
        r = max(6, hh * (0.4 + rng.random() * 0.25))
        cs.append((px, y - hh * 0.55, r))
        for _ in range(4):
            b = -math.pi * rng.random()
            cs.append((px + math.cos(b) * r * 0.9, y - hh * 0.55 + math.sin(b) * r * 0.9, r * (0.3 + rng.random() * 0.3)))
        cs.append((px, y - r * 0.3, r * 0.8))
    c.relief(cs, cols, alpha=alpha, soft=0.10, grain=0.12, ybias=0.55, smooth=4.5,
             clip=lambda yy, xx: 1 - sstep(y - h * 0.22, y + h * 0.06, yy + 10 * np.sin(xx * 0.05)))


# ============================================================
# CHI TIẾT NHỎ (thêm sức sống cho cảnh)
# ============================================================
def vine(c, x, y0, L, rng, stem='#1f5a45', leaf=('#2f7048', '#62a653'), flower=None, sway=10):
    """Dây leo rủ: thân cong + lá hai bên (+ hoa)."""
    ph = rng.random() * 6
    pts = [(x + math.sin(t * 3.2 + ph) * sway * t, y0 + L * t) for t in np.linspace(0, 1, 12)]
    c.wash(c.lines([(*pts[i], *pts[i + 1], 1.3) for i in range(11)]), stem, grain=0.05)
    lv = [[], []]
    for i, (px, py) in enumerate(pts[1:]):
        sg = -1 if i % 2 else 1
        lv[i % 2].append([(px, py), (px + sg * 5.5, py + 1.5), (px + sg * 8, py + 6), (px + sg * 2.5, py + 4.5)])
    for g, col in zip(lv, leaf):
        c.wash(c.polys(g), col, grain=0.08)
    if flower:
        c.dots([pts[i] for i in (4, 8, 11)], flower, 2.0)


def stump(c, x, base, w, h, cols=('#a67c52', '#4a3324'), moss=('#2f6a44', '#58994e', '#a6d264'), rng=None):
    """Gốc cây cụt: thân + mặt cắt có vòng tuổi + rêu."""
    c.wash(c.poly([(x - w * 0.62, base + 2), (x - w * 0.5, base - h * 0.3), (x - w * 0.46, base - h), (x + w * 0.46, base - h), (x + w * 0.5, base - h * 0.3), (x + w * 0.66, base + 2)]),
           cols[0], cols[1], grain=0.3, edge=0.7, side=0.8)
    c.wash(c.lines([(x + dx, base - h * 0.9, x + dx * 1.15, base - 2, 1.0) for dx in (-w * 0.3, -w * 0.1, w * 0.12, w * 0.3)]), cols[1], alpha=0.6)
    c.wash(c.ells([(x, base - h, w * 0.47, w * 0.15)]), '#e2c493', '#c09a66', edge=0.6)
    for k in (0.72, 0.45, 0.2):
        c.wash(c.ells([(x, base - h, w * 0.47 * k, w * 0.15 * k)]), '#b8894f' if k != 0.45 else '#dcb983', alpha=0.75)
    if rng is not None:
        c.relief([(x + (rng.random() - 0.5) * w, base - rng.random() * h * 0.5, w * (0.07 + rng.random() * 0.07)) for _ in range(6)], moss, squash=0.5)


def foxglove(c, x, base, h, col, rng, stem='#3f8048'):
    """Hoa chuông mọc thành cột."""
    lean = (rng.random() - 0.5) * h * 0.25
    c.wash(c.lines([(x, base, x + lean, base - h, 1.4)]), stem)
    bells = []
    for k in range(6):
        t = 0.35 + 0.65 * k / 5; sg = -1 if k % 2 else 1; s = 3.4 * (1.25 - t * 0.6)
        px, py = x + lean * t + sg * 2.5, base - h * t
        bells.append([(px - s * 0.5, py - s), (px + s * 0.5, py - s), (px + s * 0.9 * 1, py + s), (px - s * 0.9, py + s)])
    c.wash(c.polys(bells, 0.3), col, mixh(col, '#ffffff', 0.35), grain=0.05)
    c.wash(c.polys([[(x, base), (x - 7, base - 7), (x - 2, base - 12)], [(x, base), (x + 8, base - 6), (x + 2, base - 11)]]), stem)


def butterfly(c, x, y, s, col, rng):
    a = (rng.random() - 0.5) * 0.8
    for sg in (-1, 1):
        c.wash(c.poly([(x, y), (x + sg * s * math.cos(a), y - s * 0.9), (x + sg * s * 1.25, y - s * 0.1), (x + sg * s * 0.55, y + s * 0.55)], 0.3), col, mixh(col, '#ffffff', 0.5), grain=0)
    c.wash(c.lines([(x, y - s * 0.4, x, y + s * 0.5, 1.0)]), '#3a2a20')


def broadleaf(c, x, base, s, cols, rng):
    """Cụm lá bản to toả tròn."""
    g = [[], []]
    for k in range(7):
        a = -math.pi * (0.08 + 0.84 * k / 6) + (rng.random() - 0.5) * 0.2; L = s * (0.7 + rng.random() * 0.5)
        ex, ey = x + math.cos(a) * L, base + math.sin(a) * L * 0.8
        nx, ny = -math.sin(a) * L * 0.22, math.cos(a) * L * 0.22
        g[k % 2].append([(x, base), ((x + ex) / 2 + nx, (base + ey) / 2 + ny), (ex, ey), ((x + ex) / 2 - nx, (base + ey) / 2 - ny)])
    for gg, col in zip(g, cols):
        c.wash(c.polys(gg), col, grain=0.1, edge=0.4)


def bird(c, x, y, s, col='#3a4a5a'):
    c.wash(c.lines([(x - s, y - s * 0.45, x - s * 0.3, y - s * 0.1, 1.2), (x - s * 0.3, y - s * 0.1, x, y + s * 0.1, 1.2), (x, y + s * 0.1, x + s * 0.35, y - s * 0.15, 1.2), (x + s * 0.35, y - s * 0.15, x + s, y - s * 0.5, 1.2)]), col, alpha=0.8)
