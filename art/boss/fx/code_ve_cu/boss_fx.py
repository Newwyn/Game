# ============================================================
# HIỆU ỨNG KỸ NĂNG TRÙM — VẼ BẰNG CODE (kiểu beanfx: hình + lớp sáng cộng mềm, lõi trắng, toả màu)
#   uv run --no-project --with numpy --with pillow python tools/boss_fx.py
#   ra: src/assets/sprites/boss_fx.webp + src/vfx/bossFxAtlas.json   (chiêu thường + choáng / phong ấn)
#       src/assets/sprites/boss_ult.webp + src/vfx/bossUltAtlas.json (tuyệt kỹ Valdric "Thánh Hỏa Phán Quyết")
#   json giống atlas Rok (src/vfx/flipbook.js): { size, groups: { tên: { size, pivot, frames: [[x,y,w,h]...] } } }
# ============================================================
import json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SS = 2
TAU = math.tau


def hexc(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def ease_out(t):
    return 1 - (1 - t) ** 3


def ease_in(t):
    return t ** 2


def env(t, a, b):
    """0 trước a, lên 1 ở giữa, về 0 sau b (sin)."""
    if t <= a or t >= b:
        return 0.0
    return math.sin(math.pi * (t - a) / (b - a))


class Cell:
    """1 khung: màu + độ phủ + ánh sáng cộng (vẽ gấp đôi rồi thu nhỏ)."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.W, self.H = w * SS, h * SS
        self.rgb = np.zeros((self.H, self.W, 3)); self.a = np.zeros((self.H, self.W)); self.L = np.zeros((self.H, self.W, 3))

    def _mask(self, draw_fn):
        im = Image.new('L', (self.W, self.H), 0); d = ImageDraw.Draw(im)
        draw_fn(d)
        return np.asarray(im, float) / 255

    def paint(self, m, col, alpha=1.0):
        k = (m * alpha)[..., None]
        c = hexc(col) if isinstance(col, str) else col
        self.rgb = self.rgb * (1 - k) + c * k
        self.a = self.a + (1 - self.a) * m * alpha

    def poly(self, pts, col, alpha=1.0):
        self.paint(self._mask(lambda d: d.polygon([(x * SS, y * SS) for x, y in pts], fill=255)), col, alpha)

    def ellipse(self, cx, cy, rx, ry, col, alpha=1.0):
        self.paint(self._mask(lambda d: d.ellipse([(cx - rx) * SS, (cy - ry) * SS, (cx + rx) * SS, (cy + ry) * SS], fill=255)), col, alpha)

    def line(self, pts, width, col, alpha=1.0):
        self.paint(self._mask(lambda d: d.line([(x * SS, y * SS) for x, y in pts], fill=255, width=max(1, int(width * SS)), joint='curve')), col, alpha)

    def ring(self, cx, cy, rx, ry, width, col, alpha=1.0, a0=0, a1=TAU, n=96):
        pts = [(cx + math.cos(a0 + (a1 - a0) * i / n) * rx, cy + math.sin(a0 + (a1 - a0) * i / n) * ry) for i in range(n + 1)]
        self.line(pts, width, col, alpha)

    def glow(self, cx, cy, r, col, k=1.0, sy=1.0):
        """Ánh sáng toả (1-d)^2·k, sy < 1 = elip dẹt (trên mặt đất)."""
        if r <= 0.5 or k <= 0:
            return
        R = r * SS
        y0, y1 = max(0, int(cy * SS - R * sy)), min(self.H, int(cy * SS + R * sy) + 1)
        x0, x1 = max(0, int(cx * SS - R)), min(self.W, int(cx * SS + R) + 1)
        if y0 >= y1 or x0 >= x1:
            return
        y, x = np.ogrid[y0:y1, x0:x1]
        d = np.sqrt((x - cx * SS) ** 2 + ((y - cy * SS) / sy) ** 2) / R
        self.L[y0:y1, x0:x1] += (np.clip(1 - d, 0, 1) ** 2 * k)[..., None] * hexc(col)

    def glow_line(self, pts, r, col, k=1.0, step=3):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(1, int(math.hypot(x1 - x0, y1 - y0) / step))
            for i in range(n):
                t = i / n
                self.glow(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, col, k / max(1, r / step) * 1.6)

    def image(self):
        L = self.L
        rgb = np.clip(self.rgb * self.a[..., None] + L, 0, 1)
        lum = np.clip(L.max(-1), 0, 1)
        a = np.clip(np.maximum(self.a, lum), 0, 1)
        rgb = np.where(a[..., None] > 1e-4, rgb / np.maximum(a[..., None], 1e-4), 0)   # bỏ nhân trước (ảnh thường, không nhân alpha)
        arr = np.dstack([np.clip(rgb, 0, 1), a]) * 255
        return Image.fromarray(arr.astype(np.uint8), 'RGBA').resize((self.w, self.h), Image.LANCZOS)


def rng_for(*k):
    return np.random.default_rng(abs(hash(k)) % (2 ** 32))


# ============================================================
# CHIÊU THƯỜNG
# ============================================================
def warn(t, w=256, h=192):
    """Vòng cảnh báo đỏ (nằm đất): 2 vòng + vạch xoay + nền đỏ nhạt nhấp nháy."""
    c = Cell(w, h); cx, cy = w / 2, h / 2; rx, ry = w * 0.46, h * 0.46
    pul = 0.5 + 0.5 * math.sin(t * TAU)
    c.ellipse(cx, cy, rx, ry, '#ff2a3c', 0.16 + 0.1 * pul)
    c.ring(cx, cy, rx, ry, 3.2, '#ff5a64', 0.95)
    c.ring(cx, cy, rx * 0.86, ry * 0.86, 1.4, '#ff8a8a', 0.7)
    for i in range(16):
        a = i / 16 * TAU + t * TAU / 4
        c.line([(cx + math.cos(a) * rx * 0.86, cy + math.sin(a) * ry * 0.86), (cx + math.cos(a) * rx * 0.97, cy + math.sin(a) * ry * 0.97)], 2.2, '#ffd0d0', 0.85)
    for i in range(3):   # mũi nhọn chỉ vào tâm
        a = i / 3 * TAU - t * TAU / 3
        x, y = cx + math.cos(a) * rx * 0.66, cy + math.sin(a) * ry * 0.66
        c.poly([(x + math.cos(a) * 10, y + math.sin(a) * 7), (x - math.cos(a + 0.5) * 8, y - math.sin(a + 0.5) * 6), (x - math.cos(a - 0.5) * 8, y - math.sin(a - 0.5) * 6)], '#ff7a7a', 0.8)
    c.glow(cx, cy, rx * 1.02, '#ff3040', 0.25 + 0.15 * pul, sy=ry / rx)
    return c


def claw(t, w=192, h=192):
    """3 vết cào chéo lần lượt: lõi trắng, viền đỏ, máu bắn."""
    c = Cell(w, h); r = rng_for('claw')
    for i in range(3):
        st = i * 0.12; p = (t - st) / 0.35
        if p <= 0:
            continue
        reach = min(1, ease_out(min(1, p)))
        fade = 1 - max(0, (t - st - 0.3) / 0.5)
        if fade <= 0:
            continue
        x0, y0 = 40 + i * 30, 30; x1, y1 = 70 + i * 30, 165
        pts = []
        for k in range(17):
            s = k / 16 * reach
            pts.append((x0 + (x1 - x0) * s + math.sin(s * math.pi) * -22, y0 + (y1 - y0) * s))
        if len(pts) > 1:
            for k in range(len(pts) - 1):
                wdt = 9 * math.sin(math.pi * (k + 0.5) / 16) + 1
                c.line(pts[k:k + 2], wdt, '#8a0e1e', fade)
                c.line(pts[k:k + 2], wdt * 0.45, '#ffe8e8', fade)
            c.glow_line(pts, 14, '#ff3a3a', 0.9 * fade)
    for k in range(14):   # giọt máu bắn
        p = max(0, t - 0.25)
        a = r.random() * TAU; sp = 30 + r.random() * 60
        x, y = 100 + math.cos(a) * sp * p * 2, 100 + math.sin(a) * sp * p * 2 + 60 * p * p
        if 0 < p < 0.6:
            c.ellipse(x, y, 2.5, 3, '#b0141f', 1 - p / 0.6)
    return c


def howl(t, w=256, h=192):
    """Tiếng hú: sóng âm lưỡi liềm dày toả ra 2 bên, lõi đỏ trắng loé, sương đỏ lan."""
    c = Cell(w, h); cx, cy = w / 2, h * 0.55
    c.glow(cx, cy, 120 * ease_out(min(1, t * 1.5)), '#ff4020', 0.45 * (1 - t), sy=0.8)
    for i in range(5):
        p = (t * 1.5 - i * 0.16)
        if not 0 < p < 1:
            continue
        r = 14 + p * 112; al = (1 - p) ** 1.1
        for side in (-1, 1):
            a0 = math.pi - 0.9 if side < 0 else -0.9
            c.ring(cx, cy, r, r * 0.82, 14 * (1 - p) + 3, '#ff3a2a', al * 0.8, a0, a0 + 1.8, 40)
            c.ring(cx, cy, r, r * 0.82, 6 * (1 - p) + 1.5, '#fff0e6', al, a0 + 0.15, a0 + 1.65, 40)
    c.glow(cx, cy, 34, '#fff6ee', 1.2 * env(t, 0, 0.55))
    c.glow(cx, cy, 70, '#ff6a40', 0.7 * env(t, 0, 0.7))
    return c


def slam(t, w=320, h=240):
    """Đập đất (nằm đất): vết nứt toả tia, lõi đỏ cam, vòng bụi lan."""
    c = Cell(w, h); cx, cy = w / 2, h / 2; r = rng_for('slam')
    reach = ease_out(min(1, t / 0.3)); fade = 1 - max(0, (t - 0.55) / 0.45)
    for i in range(11):
        a = i / 11 * TAU + r.random() * 0.3
        pts = [(cx, cy)]; x, y = cx, cy
        L = (70 + r.random() * 70) * reach
        for k in range(6):
            a2 = a + (r.random() - 0.5) * 0.6
            x += math.cos(a2) * L / 6; y += math.sin(a2) * L / 6 * 0.75
            pts.append((x, y))
        c.line(pts, 5, '#2a1a12', 0.9 * fade)
        c.line(pts, 2, '#ffb050', fade)
        c.glow_line(pts, 8, '#ff6a20', 0.7 * fade)
    d = ease_out(t)
    c.ring(cx, cy, 30 + d * 120, (30 + d * 120) * 0.75, 14 * (1 - d) + 2, '#cbb79a', 0.6 * (1 - d))
    c.glow(cx, cy, 70, '#ffd0a0', env(t, 0, 0.35))
    for k in range(18):   # đá vụn văng
        a = r.random() * TAU; sp = 50 + r.random() * 70
        x, y = cx + math.cos(a) * sp * d, cy + math.sin(a) * sp * d * 0.75
        if t < 0.8:
            c.ellipse(x, y, 3, 2.5, '#6a5a4a', 1 - t / 0.8)
    return c


def flame_tongue(c, x, base, hgt, wid, col_out, col_mid, col_core, alpha=1.0, lean=0.0):
    pts = [(x - wid, base)]
    for k in range(1, 8):
        s = k / 8
        pts.append((x - wid * (1 - s) + lean * s * hgt, base - hgt * s))
    pts += [(x + lean * hgt, base - hgt * 1.05)]
    for k in range(7, 0, -1):
        s = k / 8
        pts.append((x + wid * (1 - s) + lean * s * hgt, base - hgt * s))
    pts.append((x + wid, base))
    c.poly(pts, col_out, alpha)
    inner = [(x + (px - x) * 0.6, base - (base - py) * 0.8) for px, py in pts]
    c.poly(inner, col_mid, alpha)
    core = [(x + (px - x) * 0.3, base - (base - py) * 0.5) for px, py in pts]
    c.poly(core, col_core, alpha)


def rage(t, w=160, h=256):
    """Cuồng nộ (vòng lặp): lưỡi lửa đỏ cuộn quanh chân, bốc lên + tàn lửa."""
    c = Cell(w, h); cx, base = w / 2, h - 18; r = rng_for('rage')
    for i in range(9):
        ph = (t + i / 9) % 1
        x = cx + math.sin(i * 2.1) * 42
        hgt = 60 + 70 * math.sin(math.pi * ph)
        flame_tongue(c, x, base - ph * 30, hgt, 13, '#8a1010', '#e8401a', '#ffd070', 0.75 * math.sin(math.pi * ph), lean=math.sin(i + t * TAU) * 0.15)
    c.glow(cx, base - 40, 90, '#ff3a10', 0.35)
    for k in range(14):
        ph = (t + r.random()) % 1
        x = cx + (r.random() - 0.5) * 100; y = base - ph * 200
        c.glow(x, y, 4, '#ffb060', 0.9 * (1 - ph))
    c.ring(cx, base, 55, 14, 3, '#ff6030', 0.6)
    return c


def shadow(t, w=384, h=128):
    """Lướt chém bóng tối: vệt chém tím đen quét ngang, lõi tím sáng, mảnh bóng vỡ."""
    c = Cell(w, h); cy = h / 2
    head = ease_out(min(1, t / 0.4)); tail = ease_in(max(0, (t - 0.25) / 0.6))
    x0, x1 = 10 + tail * (w - 20), 10 + head * (w - 20)
    if x1 - x0 > 2:
        pts = [(x, cy + math.sin((x / w) * math.pi) * -10) for x in np.linspace(x0, x1, 24)]
        for k in range(len(pts) - 1):
            s = (k + 0.5) / (len(pts) - 1)
            wd = 30 * math.sin(math.pi * s) + 3
            c.line(pts[k:k + 2], wd, '#1a0a26', 0.9)
            c.line(pts[k:k + 2], wd * 0.4, '#9a4aff', 0.95)
            c.line(pts[k:k + 2], wd * 0.12, '#f4e6ff', 1.0)
        c.glow_line(pts, 22, '#7a2aff', 0.7)
    r = rng_for('shadow')
    for k in range(16):
        x = x0 + r.random() * max(1, x1 - x0); y = cy + (r.random() - 0.5) * 60
        c.poly([(x, y), (x + 8, y - 3), (x + 4, y + 6)], '#2a1240', 0.8 * (1 - t))
    return c


def dshield(t, w=256, h=256):
    """Khiên đen (lặp): bong bóng lục giác tím, viền sáng, vân lục giác lấp lánh."""
    c = Cell(w, h); cx, cy = w / 2, h * 0.52; rx, ry = w * 0.42, h * 0.46
    c.ellipse(cx, cy, rx, ry, '#2a1040', 0.28)
    for gy in range(-6, 7):
        for gx in range(-6, 7):
            hx = cx + gx * 20 + (gy % 2) * 10; hy = cy + gy * 17
            if ((hx - cx) / rx) ** 2 + ((hy - cy) / ry) ** 2 > 0.92:
                continue
            on = 0.5 + 0.5 * math.sin(t * TAU + gx * 0.7 + gy * 1.1)
            pts = [(hx + math.cos(a) * 9, hy + math.sin(a) * 9) for a in np.linspace(0, TAU, 7)]
            c.line(pts, 1.2, '#b98aff', 0.25 + 0.5 * on)
    c.ring(cx, cy, rx, ry, 4, '#c6a0ff', 0.9)
    c.ring(cx - 6, cy - 8, rx * 0.8, ry * 0.75, 3, '#ffffff', 0.35, math.pi * 1.05, math.pi * 1.45)
    c.glow(cx, cy, rx * 1.05, '#8a4aff', 0.22, sy=ry / rx)
    return c


def pillar(t, w=128, h=320):
    """Cột lửa phun từ đất: mọc nhanh, lưỡi lửa cuộn, lõi trắng, tàn lửa, tắt thành khói."""
    c = Cell(w, h); cx, base = w / 2, h - 10; r = rng_for('pillar')
    grow = ease_out(min(1, t / 0.25)); die = max(0, (t - 0.6) / 0.4)
    hgt = 280 * grow * (1 - die * 0.6)
    if hgt > 4:
        for i in range(7):
            ph = (t * 3 + i / 7) % 1
            flame_tongue(c, cx + math.sin(i * 1.7 + t * 9) * 14, base - ph * hgt * 0.3, hgt * (0.55 + 0.45 * math.sin(math.pi * (0.3 + ph * 0.7))), 22 * (1 - die * 0.5), '#9a1a08', '#ff5a10', '#ffe6a0', (1 - die) * 0.9)
        c.glow(cx, base - hgt * 0.45, 80, '#ff6a20', 0.5 * (1 - die))
        c.glow(cx, base - 20, 40, '#fff2c0', 0.9 * (1 - die))
    for k in range(10):   # khói
        ph = (t + r.random() * 0.4)
        if die > 0:
            c.ellipse(cx + (r.random() - 0.5) * 50, base - hgt - 20 - ph * 60, 18 + ph * 14, 14 + ph * 10, '#4a3a38', 0.35 * die * (1 - die))
    for k in range(16):
        ph = (t * 2 + r.random()) % 1
        c.glow(cx + (r.random() - 0.5) * 70, base - ph * 300 * grow, 3.5, '#ffc070', (1 - ph) * (1 - die))
    c.ellipse(cx, base, 46, 10, '#ff8030', 0.5 * (1 - die))
    return c


def firering(t, w=320, h=240):
    """Vòng lửa (nằm đất): vòng lửa nở ra từ tâm, mép có lưỡi lửa liếm, để lại vệt cháy."""
    c = Cell(w, h); cx, cy = w / 2, h / 2
    p = ease_out(min(1, t / 0.5)); fade = 1 - max(0, (t - 0.5) / 0.5)
    rx, ry = 20 + p * 130, (20 + p * 130) * 0.75
    c.ring(cx, cy, rx, ry, 18 * fade + 2, '#7a1608', 0.7 * fade)
    c.ring(cx, cy, rx, ry, 10 * fade + 1, '#ff6a1a', 0.95 * fade)
    c.ring(cx, cy, rx, ry, 3, '#fff0b0', fade)
    for i in range(40):
        a = i / 40 * TAU
        x, y = cx + math.cos(a) * rx, cy + math.sin(a) * ry
        c.glow(x, y, 10 + 6 * math.sin(i * 3 + t * 20), '#ff8a30', 0.5 * fade)
    c.ellipse(cx, cy, rx * 0.95, ry * 0.95, '#ff7a30', 0.08 * fade * p)
    return c


def curse(t, w=160, h=160):
    """Lời nguyền (lặp): ấn sọ tím xoay + vòng chữ cổ + giọt tím rơi."""
    c = Cell(w, h); cx, cy = w / 2, h / 2
    c.ring(cx, cy, 62, 62, 3, '#c07aff', 0.9)
    c.ring(cx, cy, 50, 50, 1.5, '#e0b0ff', 0.6)
    for i in range(12):
        a = i / 12 * TAU + t * TAU / 3
        x, y = cx + math.cos(a) * 56, cy + math.sin(a) * 56
        c.line([(x - 3, y - 4), (x + 3, y), (x - 2, y + 4)], 1.6, '#e8c8ff', 0.9)
    tri = [(cx + math.cos(a - t * TAU / 4) * 48, cy + math.sin(a - t * TAU / 4) * 48) for a in (-math.pi / 2, math.pi / 6, math.pi * 5 / 6, -math.pi / 2)]
    c.line(tri, 2, '#b06aff', 0.7)
    # sọ
    c.ellipse(cx, cy - 6, 20, 19, '#2a103a', 0.95)
    c.ellipse(cx, cy - 7, 17, 16, '#d8b8f0', 0.95)
    c.poly([(cx - 10, cy + 6), (cx + 10, cy + 6), (cx + 8, cy + 18), (cx - 8, cy + 18)], '#d8b8f0', 0.95)
    c.ellipse(cx - 7, cy - 6, 5, 5.5, '#3a0a5a'); c.ellipse(cx + 7, cy - 6, 5, 5.5, '#3a0a5a')
    c.glow(cx - 7, cy - 6, 8, '#ff60ff', 0.8); c.glow(cx + 7, cy - 6, 8, '#ff60ff', 0.8)
    c.glow(cx, cy, 70, '#8a30d0', 0.25)
    return c


def wisp(t, w=96, h=96):
    """Linh hồn (lặp): đốm xanh lá có đuôi uốn."""
    c = Cell(w, h); cx, cy = w / 2, h / 2
    tail = [(cx + 30 - k * 6, cy + math.sin(t * TAU + k * 0.6) * 8) for k in range(10)]
    for k in range(len(tail) - 1):
        c.line(tail[k:k + 2], 12 * (1 - k / 10) + 1, '#5aff9a', 0.5 * (1 - k / 10))
    c.ellipse(cx + 30, cy + math.sin(t * TAU) * 8, 9, 9, '#c8ffd8')
    c.glow(cx + 30, cy + math.sin(t * TAU) * 8, 26, '#40ff80', 0.8)
    return c


def stun(t, w=128, h=64):
    """Choáng (lặp): 3 ngôi sao vàng xoay quanh elip trên đầu."""
    c = Cell(w, h); cx, cy = w / 2, h / 2
    c.ring(cx, cy, 44, 13, 1.5, '#fff2a0', 0.4)
    for i in range(3):
        a = t * TAU + i / 3 * TAU
        x, y = cx + math.cos(a) * 44, cy + math.sin(a) * 13
        s = 9 if math.sin(a) > 0 else 7
        pts = []
        for k in range(10):
            rr = s if k % 2 == 0 else s * 0.45
            aa = -math.pi / 2 + k / 10 * TAU
            pts.append((x + math.cos(aa) * rr, y + math.sin(aa) * rr))
        c.poly(pts, '#ffd23a'); c.poly([(x + (px - x) * 0.5, y + (py - y) * 0.5) for px, py in pts], '#fff6c8')
        c.glow(x, y, 14, '#ffe060', 0.6)
    return c


def seal(t, w=128, h=128):
    """Phong ấn (lặp): vòng xích + ổ khoá ấn lửa trên đầu."""
    c = Cell(w, h); cx, cy = w / 2, h / 2
    for i in range(14):
        a = i / 14 * TAU + t * TAU / 6
        x, y = cx + math.cos(a) * 46, cy + math.sin(a) * 18
        c.ring(x, y, 7, 4.5, 2.4, '#d8a040' if i % 2 else '#a87020', 0.95, 0, TAU, 20)
    c.poly([(cx - 16, cy - 2), (cx + 16, cy - 2), (cx + 16, cy + 22), (cx - 16, cy + 22)], '#8a5a1a')
    c.poly([(cx - 13, cy + 1), (cx + 13, cy + 1), (cx + 13, cy + 19), (cx - 13, cy + 19)], '#e8b04a')
    c.ring(cx, cy - 4, 10, 12, 4, '#c08a30', 1, math.pi, TAU, 24)
    c.ellipse(cx, cy + 9, 3, 3, '#3a1a08'); c.line([(cx, cy + 9), (cx, cy + 16)], 2.4, '#3a1a08')
    c.glow(cx, cy + 6, 40, '#ffa030', 0.4 + 0.2 * math.sin(t * TAU))
    return c


# ============================================================
# TUYỆT KỸ VALDRIC — Thánh Hỏa Phán Quyết
# ============================================================
def ucircle(t, w=384, h=288):
    """Vòng phép lửa thánh (nằm đất, lặp): 2 vòng, ngôi sao 8 cánh, chữ cổ xoay, lửa liếm mép."""
    c = Cell(w, h); cx, cy = w / 2, h / 2; rx, ry = w * 0.46, h * 0.46
    c.ellipse(cx, cy, rx, ry, '#6a1a08', 0.25)
    c.ring(cx, cy, rx, ry, 5, '#ffb040', 0.95)
    c.ring(cx, cy, rx * 0.9, ry * 0.9, 2, '#ffe0a0', 0.8)
    c.ring(cx, cy, rx * 0.55, ry * 0.55, 3, '#ff8a30', 0.9)
    rot = t * TAU / 4
    star = []
    for k in range(17):
        a = rot + k / 16 * TAU * 3
        star.append((cx + math.cos(a) * rx * 0.88, cy + math.sin(a) * ry * 0.88))
    c.line(star, 2, '#ffd070', 0.75)
    for i in range(24):
        a = -rot * 1.5 + i / 24 * TAU
        x, y = cx + math.cos(a) * rx * 0.72, cy + math.sin(a) * ry * 0.72
        c.line([(x - 4, y - 3), (x + 4, y - 3), (x, y + 4), (x - 4, y - 3)], 1.6, '#fff0c0', 0.85)
    for i in range(48):
        a = i / 48 * TAU
        x, y = cx + math.cos(a) * rx, cy + math.sin(a) * ry
        c.glow(x, y - 4, 9 + 5 * math.sin(i * 2.3 + t * TAU * 2), '#ff7a20', 0.55)
    c.glow(cx, cy, rx * 0.6, '#ffb050', 0.3 + 0.1 * math.sin(t * TAU), sy=ry / rx)
    return c


def ushield(t, w=256, h=320):
    """Khiên lửa thánh (lặp): mái vòm vàng cam, vân lục giác chạy, lửa cuộn chân khiên."""
    c = Cell(w, h); cx, base = w / 2, h - 16; rx, ry = w * 0.45, h * 0.48
    cy = base - ry * 0.95
    c.ellipse(cx, cy, rx, ry, '#7a3008', 0.25)
    for gy in range(-8, 9):
        for gx in range(-6, 7):
            hx = cx + gx * 22 + (gy % 2) * 11; hy = cy + gy * 19
            if ((hx - cx) / rx) ** 2 + ((hy - cy) / ry) ** 2 > 0.9:
                continue
            on = 0.5 + 0.5 * math.sin(t * TAU * 2 - gy * 0.8 + gx * 0.3)
            pts = [(hx + math.cos(a) * 10, hy + math.sin(a) * 10) for a in np.linspace(0, TAU, 7)]
            c.line(pts, 1.3, '#ffe2a0', 0.2 + 0.5 * on)
    c.ring(cx, cy, rx, ry, 5, '#ffc050', 0.95)
    c.ring(cx - 8, cy - 14, rx * 0.8, ry * 0.8, 4, '#ffffff', 0.4, math.pi * 1.05, math.pi * 1.5)
    for i in range(8):
        ph = (t + i / 8) % 1
        flame_tongue(c, cx + (i - 3.5) * 24, base, 40 + 30 * math.sin(math.pi * ph), 10, '#a83008', '#ff7a1a', '#ffe8a0', 0.8)
    c.glow(cx, cy, rx * 1.05, '#ff9a30', 0.25, sy=ry / rx)
    return c


def ucrack(stage, w=256, h=320):
    """Vết nứt khiên theo 5 mức (khung i = mức hư hại)."""
    c = Cell(w, h); cx, base = w / 2, h - 16; ry = h * 0.48; cy = base - ry * 0.95
    r = rng_for('crack')
    n = [0, 3, 6, 10, 15][stage]
    for i in range(n):
        a = r.random() * TAU
        pts = [(cx + math.cos(a) * 20, cy + math.sin(a) * 20)]
        x, y = pts[0]
        for k in range(5):
            a += (r.random() - 0.5) * 0.9
            x += math.cos(a) * 20; y += math.sin(a) * 20
            pts.append((x, y))
        c.line(pts, 3, '#3a1408', 0.9)
        c.line(pts, 1.2, '#ffffff', 0.95)
        c.glow_line(pts, 8, '#ffe0a0', 0.6)
    return c


def ushatter(t, w=320, h=320):
    """Vỡ khiên: loé trắng + mảnh khiên vàng văng ra xoay + vòng sóng."""
    c = Cell(w, h); cx, cy = w / 2, h / 2; r = rng_for('shatter')
    c.glow(cx, cy, 130, '#fff6d0', 1.2 * env(t, 0, 0.3))
    p = ease_out(t)
    c.ring(cx, cy, 20 + p * 140, 20 + p * 140, 10 * (1 - p) + 1, '#ffd070', 0.8 * (1 - p))
    for k in range(26):
        a = r.random() * TAU; sp = 80 + r.random() * 90; sz = 6 + r.random() * 10; spin = r.random() * 6
        x, y = cx + math.cos(a) * sp * p, cy + math.sin(a) * sp * p + 50 * p * p
        al = 1 - max(0, (t - 0.5) / 0.5)
        pts = [(x + math.cos(spin * t * 6 + j * 2.1) * sz, y + math.sin(spin * t * 6 + j * 2.1) * sz * 0.7) for j in range(3)]
        c.poly(pts, '#ffd890', al)
        c.glow(x, y, 8, '#ffb040', 0.5 * al)
    return c


def ublast(t, w=384, h=448):
    """Nổ lửa thánh: co lại -> loé -> cột lửa trắng vàng phụt lên + quả cầu lửa nở + tàn lửa + khói."""
    c = Cell(w, h); cx, base = w / 2, h - 20; r = rng_for('blast')
    if t < 0.15:   # co lại (gom sáng)
        k = t / 0.15
        c.glow(cx, base - 60, 60 * (1 - k) + 15, '#ffe8b0', 0.6 + k)
        c.ring(cx, base - 60, 120 * (1 - k) + 10, 120 * (1 - k) + 10, 3, '#ffd070', 0.7)
        return c
    p = (t - 0.15) / 0.85
    col_h = 400 * ease_out(min(1, p / 0.35)) * (1 - max(0, (p - 0.6) / 0.4) * 0.4)
    fade = 1 - max(0, (p - 0.55) / 0.45)
    # cột lửa
    for i in range(9):
        ph = (p * 4 + i / 9) % 1
        flame_tongue(c, cx + math.sin(i * 1.9) * 26, base, col_h * (0.6 + 0.4 * math.sin(math.pi * (0.4 + ph * 0.6))), 40 * fade + 6, '#a82a08', '#ff7a18', '#fff4c8', 0.9 * fade)
    # quả cầu lửa
    rr = 40 + ease_out(min(1, p / 0.5)) * 150
    c.ellipse(cx, base - 80, rr, rr * 0.7, '#ff7a20', 0.5 * fade)
    c.ellipse(cx, base - 80, rr * 0.7, rr * 0.5, '#ffc860', 0.6 * fade)
    c.ellipse(cx, base - 80, rr * 0.4, rr * 0.3, '#fffbe8', 0.7 * fade)
    c.glow(cx, base - 100, rr * 1.3, '#ff9030', 0.7 * fade)
    c.glow(cx, base - 60, 90, '#ffffff', 1.0 * env(p, 0, 0.25))
    for k in range(40):   # tàn lửa
        a = -math.pi / 2 + (r.random() - 0.5) * 2.6; sp = 100 + r.random() * 200
        x, y = cx + math.cos(a) * sp * p, base - 80 + math.sin(a) * sp * p + 120 * p * p
        c.glow(x, y, 4 + r.random() * 3, '#ffd080', (1 - p) * 1.2)
    for k in range(10):   # khói cuối
        if p > 0.5:
            q = (p - 0.5) / 0.5
            c.ellipse(cx + (r.random() - 0.5) * 220, base - 120 - q * 120 - r.random() * 100, 30 + q * 30, 22 + q * 20, '#4a3430', 0.4 * q * (1 - q))
    return c


def ushock(t, w=384, h=288):
    """Sóng xung kích trên đất khi nổ (nằm đất)."""
    c = Cell(w, h); cx, cy = w / 2, h / 2
    p = ease_out(t)
    for k in range(2):
        q = max(0, p - k * 0.15)
        rx = 20 + q * 170
        c.ring(cx, cy, rx, rx * 0.75, 16 * (1 - q) + 2, '#ffb050', 0.85 * (1 - q))
        c.ring(cx, cy, rx, rx * 0.75, 4, '#fff4d0', 0.9 * (1 - q))
    c.ellipse(cx, cy, 120 * p, 90 * p, '#ffb050', 0.12 * (1 - t))
    return c


# ============================================================
# Đóng gói atlas
# ============================================================
def build(name, items, json_out, width=2048, scale=0.65):
    cells = []   # (group, frame index, image, pivot)
    meta_groups = {}
    for group, fn, n, pivot, kind in items:
        imgs = []
        for i in range(n):
            t = i / n if kind == 'loop' else (i / (n - 1) if n > 1 else 0)
            im = (fn(i) if kind == 'stage' else fn(t)).image()
            imgs.append(im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS))
        meta_groups[group] = {'size': list(imgs[0].size), 'pivot': [round(pivot[0] * scale, 1), round(pivot[1] * scale, 1)], 'frames': []}
        cells += [(group, im) for im in imgs]
    x = y = 4; row_h = 0; placed = []
    for group, im in cells:
        w, h = im.size
        if x + w + 4 > width:
            x = 4; y += row_h + 4; row_h = 0
        placed.append((group, im, x, y))
        meta_groups[group]['frames'].append([x, y, w, h])
        x += w + 4; row_h = max(row_h, h)
    H = (y + row_h + 4 + 3) // 4 * 4   # vừa đủ (WebGL2 nhận ảnh không luỹ thừa 2) -> đỡ bộ nhớ card đồ hoạ
    atlas = Image.new('RGBA', (width, H), (0, 0, 0, 0))
    for group, im, x, y in placed:
        atlas.paste(im, (x, y))
    out = ROOT / 'src' / 'assets' / 'sprites' / f'{name}.webp'
    atlas.save(out, 'WEBP', quality=90)
    (ROOT / 'src' / 'vfx' / json_out).write_text(json.dumps({'size': [width, H], 'groups': meta_groups}))
    print(name, width, H, out.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    # (nhóm, hàm, số khung, pivot [x, y] theo pixel ô, loop | once | stage)
    build('boss_fx', [
        ('warn', warn, 8, [128, 96], 'loop'),
        ('claw', claw, 9, [96, 96], 'once'),
        ('howl', howl, 10, [128, 105], 'once'),
        ('slam', slam, 10, [160, 120], 'once'),
        ('rage', rage, 10, [80, 238], 'loop'),
        ('shadow', shadow, 8, [0, 64], 'once'),
        ('dshield', dshield, 10, [128, 252], 'loop'),
        ('pillar', pillar, 12, [64, 310], 'once'),
        ('firering', firering, 10, [160, 120], 'once'),
        ('curse', curse, 8, [80, 80], 'loop'),
        ('wisp', wisp, 8, [48, 48], 'loop'),
        ('stun', stun, 8, [64, 32], 'loop'),
        ('seal', seal, 8, [64, 64], 'loop'),
    ], 'bossFxAtlas.json')
    build('boss_ult', [
        ('ucircle', ucircle, 12, [192, 144], 'loop'),
        ('ushield', ushield, 12, [128, 304], 'loop'),
        ('ucrack', ucrack, 5, [128, 304], 'stage'),
        ('ushatter', ushatter, 10, [160, 160], 'once'),
        ('ublast', ublast, 14, [192, 428], 'once'),
        ('ushock', ushock, 8, [192, 144], 'once'),
    ], 'bossUltAtlas.json')
