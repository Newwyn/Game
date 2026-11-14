# ============================================================
# CẢNH NỀN TRẬN — BẢN VẼ MỚI kiểu "anime tô màu nước" (thay dần cho tools/battle_bg.py)
#   uv run --no-project --with numpy --with pillow --with scipy python tools/battle_bg2.py [tên ...]
#   ra: src/assets/battle/<tên>_back.webp · <tên>_mid.webp · <tên>_ground.webp + cập nhật battle_bg.json
# Khổ ảnh: lớp xa 4096x368 (tấm 200x18 ở z=-50) · lớp gần 4096x246 (tấm 150x9 ở z=-30) · đất 512 lặp.
# Lưu ý bố cục (máy quay trận chúc xuống 14°): lớp xa chỉ thấy khoảng 5%..75% tính từ đáy; lớp gần thấy từ 11% trở lên.
# ============================================================
import sys, json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from paintkit import *

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'assets' / 'battle'
BACK = (4096, 368)
MID = (4096, 246)
BH, MH = BACK[1], MID[1]
BG = BH - 20            # đường chân đất trên lớp xa (dưới đó bị mặt sân che)
MG = MH - 27            # đường chân đất trên lớp gần


# ---------------- đất lặp ----------------
class Tile:
    """Ô đất 512 lặp liền mép: mọi nét vẽ được nhân bản qua 4 mép."""

    def __init__(self, base, seed=0, size=512):
        self.n = size; self.N = size * SS
        self.rgb = np.broadcast_to(hx(base), (self.N, self.N, 3)).astype(F).copy()
        self.rng = np.random.default_rng(seed); self.seed = seed

    def noise(self, cell, k=0, oct=4):
        return fbm(self.N, self.N, cell * SS, self.seed * 13 + k, oct, tile=True)

    def patches(self, col, cell, lo, hi, k=0, alpha=1.0):
        t = sstep(lo, hi, self.noise(cell, k))[..., None] * alpha
        self.rgb = self.rgb * (1 - t) + hx(col) * t

    def stamp(self, draw_fn, col, alpha=1.0, blur=0.0):
        im = Image.new('L', (self.N, self.N), 0); d = ImageDraw.Draw(im)
        for ox in (-self.N, 0, self.N):
            for oy in (-self.N, 0, self.N):
                draw_fn(d, lambda x, o=ox: x * SS + o, lambda y, o=oy: y * SS + o)
        m = np.asarray(im, F) / 255
        if blur:
            m = ndi.gaussian_filter(m, blur * SS, mode='wrap')
        m = (m * alpha)[..., None]
        c = hx(col) if isinstance(col, str) else col
        self.rgb = self.rgb * (1 - m) + c * m
        return m[..., 0]

    def done(self, grain=0.05):
        n = self.noise(6, 91, 3)
        rgb = np.clip(self.rgb * (1 + grain * 2 * (n - 0.5))[..., None], 0, 1)
        return Image.fromarray((rgb * 255 + 0.5).astype(np.uint8)).resize((self.n, self.n), Image.LANCZOS)


# ============================================================
# RỪNG
# ============================================================
def forest():
    FOG = '#8db472'
    W, H = BACK
    c = Cv(W, H, seed=3)
    rng = np.random.default_rng(7)
    c.grad([(0, '#6fb0ac'), (0.3, '#a6d6c0'), (0.55, '#d2ecc0'), (0.8, '#c4e2b4'), (1, '#b0d4a4')])
    sunx = 1750
    c.glow(sunx, 150, 1300, '#fff7b8', 0.7, 1.5, sy=0.3)
    c.glow(sunx, 150, 260, '#ffffee', 0.7, 2.0, sy=0.6)

    # --- đồi xa ---
    for i, (yb, amp, col) in enumerate([(205, 46, '#9ccbc0'), (232, 38, '#8cc0b2')]):
        xs = np.linspace(0, W, 200)
        n = fbm(1, 200, 30, 40 + i, 3)[0]
        pts = [(x, yb - amp * v) for x, v in zip(xs, n)] + [(W, H), (0, H)]
        c.wash(c.poly(pts, 1.0), col, mixh(col, '#cfe8c4', 0.6), grain=0.05)

    # --- 3 rặng cây bóng mờ (xa -> gần), giữa các rặng có sương ---
    def row(base, hmin, hmax, step, dark, lit, seed):
        r = np.random.default_rng(seed)
        x = -60.0
        polys, crowns = [], []
        while x < W + 60:
            h = hmin + r.random() * (hmax - hmin)
            if r.random() < 0.4:
                polys.append(conifer_pts(x, base, h * 1.15, h * 0.34, r))
            else:
                w = h * (0.6 + r.random() * 0.35)
                polys.append(trunk_pts(x, base, base - h * 0.6, max(3, h * 0.06)))
                crowns += canopy_clumps(r, x, base - h * 0.66, w * 0.5, h * 0.36, n=7)
            x += step * (0.5 + r.random())
        c.wash(c.polys(polys, 0.6), dark, mixh(dark, lit, 0.5), grain=0.08)
        foliage(c, crowns, [dark, mixh(dark, lit, 0.45), lit], r, jitter=0.03, grain=0.06)

    row(262, 60, 105, 50, '#7fb5aa', '#a4d2ba', 21)
    c.haze(170, 275, '#cdeac4', 0.42, wavy=0.5)
    row(292, 105, 170, 66, '#559686', '#8cc49a', 31)
    c.haze(200, 305, '#c6e6b4', 0.40, wavy=0.6)
    c.glow(sunx, 170, 800, '#fffbd2', 0.4, 1.5, sy=0.4)
    row(320, 160, 240, 92, '#2f6f62', '#6fb07a', 37)
    c.haze(245, 338, '#c9e6a8', 0.5, wavy=0.7)
    c.glow(sunx, BG - 20, 1500, '#fbffcf', 0.45, 1.4, sy=0.06)      # trảng sáng sau hàng cây

    # --- tia nắng xiên (sau hàng cây lớn) ---
    def rays(n, k, seed):
        r = np.random.default_rng(seed)
        for i in range(n):
            x = sunx + (r.random() - 0.5) * 3400
            dx = (x - sunx) * 0.5 - 150
            c.ray(x, x + dx, 24 + r.random() * 50, 120 + r.random() * 200, '#fffbd0', k * (0.6 + r.random() * 0.8), 0, BG + 6, blur=6)
    rays(30, 0.5, 1)

    # --- hàng cây lớn phía trước: thân to, tán tối đậm (nổi trên nền sáng), tán vượt mép trên ---
    leafs = [('#123a35', '#1f5a45', '#3f8a52', '#9ccf66'), ('#143c38', '#256349', '#4c9656', '#b4dc70'), ('#103633', '#1c5244', '#377d52', '#86c264')]
    x = -40.0; k = 0
    while x < W + 100:
        h = 300 + rng.random() * 70
        w = 300 + rng.random() * 150
        base = BG - 4 + rng.random() * 14
        tree(c, x, base, h, w, leafs[k % 3], trunk=('#6d4f3a', '#2a1f1c'), seed=100 + k, lean=(rng.random() - 0.5) * 0.45, canopy=0.6, tw=22 + rng.random() * 12, lit='#e8d29a')
        x += 300 + rng.random() * 330; k += 1
    # --- vòm lá tối trên cùng (kín mép trên, rủ lởm chởm) ---
    cl = []
    for x in np.arange(-40, W + 40, 34):
        cl.append((x + rng.random() * 20, -6 + rng.random() * 22, 30 + rng.random() * 14))
        if rng.random() < 0.6:
            cl.append((x + rng.random() * 30, 26 + rng.random() * 30, 20 + rng.random() * 14))
    foliage(c, cl, ('#0f3231', '#1a4d40', '#2f7049', '#6fae58'), rng)
    for i in range(70):                                               # dây leo rủ từ vòm lá
        vine(c, rng.random() * W, 30 + rng.random() * 40, 40 + rng.random() * 110, rng,
             flower=('#fff2b0' if i % 3 == 0 else '#f6b6d0' if i % 3 == 1 else None))
    rays(12, 0.16, 2)
    for i in range(22):                                               # chim bay trong nắng
        bird(c, rng.random() * W, 90 + rng.random() * 120, 4 + rng.random() * 4, '#2f5a50')

    # --- bụi rậm + cỏ + hoa dưới gốc ---
    bcols = [('#1b4a3c', '#2f7048', '#62a653', '#bfe070'), ('#184539', '#2a6646', '#559a54', '#a6d468')]
    for i in range(60):
        x = (i // 4) * 280 + rng.random() * 170
        bush(c, x, BG + 8, 80 + rng.random() * 100, 30 + rng.random() * 36, bcols[i % 2], seed=300 + i)
    for i in range(14):                                               # gốc cây cụt, đá rêu
        x = rng.random() * W
        if i % 2:
            stump(c, x, BG + 6, 34 + rng.random() * 16, 22 + rng.random() * 12, rng=rng)
        else:
            rock(c, x, BG + 8, 50 + rng.random() * 50, 22 + rng.random() * 16, seed=350 + i, cols=('#3f5148', '#6c8072', '#9cb09c', '#cfdcc0'), moss=('#2f6a44', '#58994e', '#a6d264'))
    for i in range(46):
        broadleaf(c, rng.random() * W, BG + 8, 16 + rng.random() * 12, ('#3f8a4c', '#6fb458'), rng)
    grass(c, 0, W, BG + 8, 12, 30, 1500, ['#2f6d46', '#4f9250', '#8fc662', '#25593f'], seed=5)
    for i in range(80):
        foxglove(c, rng.random() * W, BG + 8, 26 + rng.random() * 22, ['#e889c0', '#b48cf0', '#fff0c8'][i % 3], rng)
    for i in range(40):
        butterfly(c, rng.random() * W, 200 + rng.random() * 130, 3.5 + rng.random() * 2.5, ['#fff6c0', '#ffd0e4', '#bfe8ff'][i % 3], rng)
    for i in range(60):                                               # đốm nắng rơi trên bụi cỏ
        c.glow(rng.random() * W, BG - 4 - rng.random() * 30, 16 + rng.random() * 26, '#f6ffb8', 0.22, 1.6, sy=0.45)
    fl = [(rng.random() * W, BG - 2 - rng.random() * 26) for _ in range(380)]
    c.dots(fl[:150], '#fff8dc', 1.5); c.dots(fl[150:260], '#ffe27a', 1.4); c.dots(fl[260:], '#f6b6d0', 1.4)
    c.haze(BG - 22, H - 6, FOG, 0.75, wavy=0.3)
    for _ in range(300):                                              # bụi sáng lơ lửng
        c.glow(rng.random() * W, 60 + rng.random() * 250, 2 + rng.random() * 3, '#fffde0', 0.55, 1.5)
    back = c.finish(sat=1.06)

    # ================= lớp gần =================
    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=9)
    rng = np.random.default_rng(17)
    tl = [('#1a4a3a', '#2f7448', '#5aa452', '#b6e06c'), ('#1f4f3c', '#398049', '#6cb050', '#d0ea78')]
    # cây non (thấp hơn mép trên để không bị cắt ngọn)
    xs = [140, 520, 1010, 1660, 2380, 2900, 3420, 3900]
    for i, x in enumerate(xs):
        x += (rng.random() - 0.5) * 120
        h = 176 + rng.random() * 30
        tree(m, x, MG + 8, h, 170 + rng.random() * 70, tl[i % 2], trunk=('#7d5a40', '#2f2220'), seed=500 + i, lean=(rng.random() - 0.5) * 0.5, canopy=0.62, tw=15)
        for k in range(3):
            vine(m, x + (rng.random() - 0.5) * 110, MG - h * 0.45 + rng.random() * 12, 24 + rng.random() * 40, rng, flower='#fff2b0' if k == 0 else None, sway=6)
    # đá phủ rêu
    for i in range(9):
        x = 200 + i * 460 + rng.random() * 200
        rock(m, x, MG + 10, 60 + rng.random() * 60, 26 + rng.random() * 22, seed=600 + i,
             cols=('#49574f', '#74857a', '#a3b3a2', '#d3ddc4'), moss=('#2f6a44', '#58994e', '#a6d264'))
    # khúc gỗ đổ
    for x in (820, 2650, 3650):
        L = 190
        body = m.poly([(x - L / 2, MG + 8), (x - L / 2 + 4, MG - 22), (x + L / 2, MG - 26), (x + L / 2 + 6, MG + 6)])
        m.wash(body, '#96704a', '#3e2a1e', grain=0.35, edge=0.8)
        m.wash(m.ells([(x + L / 2 + 2, MG - 10, 9, 17)]), '#d9b684', '#b08a5a', edge=0.9)
        m.wash(m.ells([(x + L / 2 + 2, MG - 10, 4, 8)]), '#b88f60', alpha=0.8)
        m.relief([(x - 70 + j * 26 + rng.random() * 8, MG - 25, 9 + rng.random() * 5) for j in range(6)], ('#2f6a44', '#58994e', '#a6d264'), squash=0.5)
    for i, x in enumerate((330, 1320, 2050, 3180)):                   # gốc cụt + nấm bám
        x += rng.random() * 100
        stump(m, x, MG + 10, 46, 30 + rng.random() * 10, rng=rng)
        for k in range(3):
            m.relief([(x - 28 - k * 3, MG - 4 - k * 8, 6 - k)], ('#b8703a', '#e8a05a', '#ffd9a0'), squash=0.6)
    # bụi
    for i in range(46):
        x = rng.random() * W2
        bush(m, x, MG + 12, 60 + rng.random() * 80, 26 + rng.random() * 32, bcols[i % 2], seed=700 + i, n=5)
    # dương xỉ
    for i in range(90):
        x = rng.random() * W2
        segs = []
        for j in range(7):
            a = -math.pi / 2 + (j - 3) * 0.33 + (rng.random() - 0.5) * 0.1
            Ln = 22 + rng.random() * 20
            segs.append([(x - 1.5, MG + 12), (x + math.cos(a) * Ln * 0.5 - 2.5, MG + 12 + math.sin(a) * Ln * 0.5),
                         (x + math.cos(a) * Ln, MG + 12 + math.sin(a) * Ln * 0.85), (x + math.cos(a) * Ln * 0.5 + 2.5, MG + 12 + math.sin(a) * Ln * 0.5), (x + 1.5, MG + 12)])
        m.wash(m.polys(segs), ['#4f9550', '#79b858', '#3a7d4a'][i % 3], grain=0.15)
    for i in range(70):
        broadleaf(m, rng.random() * W2, MG + 14, 18 + rng.random() * 14, ('#3f8a4c', '#74ba58'), rng)
    grass(m, 0, W2, MG + 14, 12, 30, 1700, ['#3f8048', '#63a554', '#9bd066', '#2c6642'], seed=8)
    for i in range(90):
        foxglove(m, rng.random() * W2, MG + 12, 30 + rng.random() * 28, ['#e889c0', '#b48cf0', '#fff0c8', '#7fb8ff'][i % 4], rng)
    for i in range(34):
        butterfly(m, rng.random() * W2, 70 + rng.random() * (MG - 90), 4.5 + rng.random() * 3, ['#fff6c0', '#ffd0e4', '#bfe8ff', '#ffc070'][i % 4], rng)
    for x in (820, 2650, 3650):                                       # nấm + dây leo trên khúc gỗ
        for k in range(4):
            px = x - 60 + k * 34 + rng.random() * 10; s_ = 0.6 + rng.random() * 0.4
            m.wash(m.rect(px - 1.5 * s_, MG - 34, px + 1.5 * s_, MG - 24), '#f6eeda')
            m.relief([(px, MG - 34, 6 * s_)], ('#a82f2a', '#d8483a', '#f27a5c'), squash=0.7, clip=lambda yy, xx: (yy < MG - 33).astype(F))
    # nấm đỏ + hoa
    for _ in range(26):
        x = rng.random() * W2; s = 0.8 + rng.random() * 0.7
        m.wash(m.poly([(x - 2 * s, MG + 6), (x - 1.6 * s, MG - 8 * s), (x + 1.6 * s, MG - 8 * s), (x + 2 * s, MG + 6)]), '#f6eeda', '#cfc3a6')
        m.relief([(x, MG - 8 * s, 7 * s)], ('#a82f2a', '#d8483a', '#f27a5c'), squash=0.7, clip=lambda yy, xx, yb=MG - 8 * s: (yy < yb + 1).astype(F))
        m.dots([(x - 3 * s, MG - 11 * s), (x + 2 * s, MG - 12.5 * s), (x + 4 * s, MG - 9.5 * s)], '#fff6ea', 1.1 * s)
    fl = [(rng.random() * W2, MG + 8 - rng.random() * 24) for _ in range(420)]
    m.dots(fl[:160], '#fffbe6', 1.6); m.dots(fl[160:290], '#ffe070', 1.5); m.dots(fl[290:], '#c9b8ff', 1.5)
    # đom đóm
    for _ in range(70):
        x, y = rng.random() * W2, 40 + rng.random() * (MG - 50)
        m.glow(x, y, 7, '#f4ffb0', 0.55, 2.0); m.glow(x, y, 2.2, '#ffffff', 0.9, 1.2)
    mid = m.finish(sat=1.06)

    # ================= đất =================
    t = Tile('#73a052', seed=41)
    t.patches('#557f48', 150, 0.36, 0.7, 1, 0.8)            # mảng rêu tối
    t.patches('#93bb5e', 120, 0.44, 0.74, 2, 0.75)           # mảng nắng
    t.patches('#c6dc7c', 60, 0.58, 0.76, 3, 0.5)            # đốm nắng xuyên tán
    t.patches('#86754e', 170, 0.64, 0.8, 4, 0.45)           # đất trống
    r = t.rng
    blades = [(r.random() * 512, r.random() * 512, r.random()) for _ in range(2600)]
    for col, lo in (('#3c6238', 0.0), ('#86b05a', 0.4), ('#b7d274', 0.8)):
        t.stamp(lambda d, X, Y: [d.line([(X(x), Y(y)), (X(x + (v - 0.5) * 5), Y(y - 5 - v * 5))], fill=255, width=2) for x, y, v in blades if lo <= v < lo + 0.4], col, 0.55)
    leaves = [(r.random() * 512, r.random() * 512, r.random() * 3.14) for _ in range(90)]
    for i, col in enumerate(('#b0862e', '#8a6a2c', '#c9a03a')):
        t.stamp(lambda d, X, Y: [d.ellipse([X(x - 3), Y(y - 1.6), X(x + 3), Y(y + 1.6)], fill=255) for j, (x, y, a) in enumerate(leaves) if j % 3 == i], col, 0.8)
    clv = [(r.random() * 512, r.random() * 512) for _ in range(120)]
    def clover(d, X, Y, pts, rad):
        for x, y in pts:
            for a in (0, 2.1, 4.2):
                d.ellipse([X(x + math.cos(a) * rad - rad), Y(y + math.sin(a) * rad - rad), X(x + math.cos(a) * rad + rad), Y(y + math.sin(a) * rad + rad)], fill=255)
    t.stamp(lambda d, X, Y: clover(d, X, Y, clv[:70], 2.6), '#3f7a40', 0.75)
    t.stamp(lambda d, X, Y: clover(d, X, Y, clv[70:], 2.4), '#a2cc66', 0.7)
    peb = [(r.random() * 512, r.random() * 512, 2 + r.random() * 3) for _ in range(40)]
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - q), Y(y - q * 0.7), X(x + q), Y(y + q * 0.7)], fill=255) for x, y, q in peb], '#5f6a58', 0.9)
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - q * 0.7), Y(y - q * 0.6), X(x + q * 0.4), Y(y + q * 0.1)], fill=255) for x, y, q in peb], '#aab4a0', 0.9)
    tw_ = [(r.random() * 512, r.random() * 512, r.random() * 6.28) for _ in range(22)]
    t.stamp(lambda d, X, Y: [d.line([(X(x), Y(y)), (X(x + math.cos(a) * 12), Y(y + math.sin(a) * 12))], fill=255, width=3) for x, y, a in tw_], '#5a4630', 0.8)
    fl = [(r.random() * 512, r.random() * 512) for _ in range(46)]
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - 1.8), Y(y - 1.8), X(x + 1.8), Y(y + 1.8)], fill=255) for x, y in fl[:26]], '#fff8dc')
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - 1.6), Y(y - 1.6), X(x + 1.6), Y(y + 1.6)], fill=255) for x, y in fl[26:]], '#ffe27a')
    return back, mid, t.done(), dict(sky='#6fb0ac', sun='#f6f8d8', light=1.45, fog=FOG)


# ============================================================
# KIẾN TRÚC ĐÁ (dùng chung)
# ============================================================
def stone_hint(c, x0, y0, x1, y1, rng, dark, light, n=None, bw=16, bh=8, alpha=0.3):
    """Gợi gạch đá: vài viên sáng / tối rải rác (không kẻ ô kín -> giữ chất màu nước)."""
    n = n or int((x1 - x0) * (y1 - y0) / 420)
    for col, k in ((dark, 0.55), (light, 0.45)):
        rs = []
        for _ in range(int(n * k)):
            x = x0 + rng.random() * (x1 - x0 - bw); y = y0 + int(rng.random() * (y1 - y0 - bh) / bh) * bh
            w = bw * (0.6 + rng.random() * 0.7)
            rs.append([(x, y), (x + w, y), (x + w, y + bh - 1.5), (x, y + bh - 1.5)])
        if rs:
            c.wash(c.polys(rs, 0.4), col, alpha=alpha, grain=0.2)


def crenels(c, x0, x1, y, mw, mh, top, bot, alpha=1.0):
    ps = []
    x = x0
    while x < x1 - mw * 0.5:
        ps.append([(x, y - mh), (min(x + mw, x1), y - mh), (min(x + mw, x1), y + 1), (x, y + 1)])
        x += mw * 1.9
    c.wash(c.polys(ps), top, bot, alpha=alpha, grain=0.1, edge=0.4)


def arch_win(c, x, y, w, h, col='#2a3552', glow=None, frame='#fff8ea'):
    if frame and w >= 5:
        f = max(1.2, w * 0.16)
        c.wash(c.rect(x - w / 2 - f, y - h + w / 2, x + w / 2 + f, y + f * 0.9), frame, alpha=0.75, grain=0.05)
        c.wash(c.ells([(x, y - h + w / 2, w / 2 + f, w / 2 + f)]), frame, alpha=0.75, grain=0.05)
    c.wash(c.rect(x - w / 2, y - h + w / 2, x + w / 2, y), col, grain=0.05)
    c.wash(c.ells([(x, y - h + w / 2, w / 2, w / 2)]), col, grain=0.05)
    if w >= 5:
        c.wash(c.poly([(x - w * 0.38, y - h * 0.35), (x - w * 0.38, y - h * 0.78), (x - w * 0.05, y - h * 0.88), (x - w * 0.05, y - h * 0.5)], 0.3), '#a9cdf2', alpha=0.55, grain=0)
        c.wash(c.lines([(x, y - h + 1, x, y, max(0.8, w * 0.1)), (x - w / 2, y - h * 0.45, x + w / 2, y - h * 0.45, max(0.8, w * 0.1))]), mixh(col, '#000000', 0.3), alpha=0.8)
    if glow:
        c.glow(x, y - h / 2, w * 2.2, glow, 0.5)


def cone_roof(c, x, y, w, h, cols, flag=None, rng=None):
    """Mái nón: 3 mảng tối - vừa - sáng + diềm mái."""
    d, m, l = cols
    c.wash(c.poly([(x - w / 2 - 3, y), (x, y - h), (x + w / 2 + 3, y)]), m, grain=0.12, edge=0.5)
    c.wash(c.poly([(x - w / 2 - 3, y), (x, y - h), (x - w * 0.12, y)]), l, grain=0.12)
    c.wash(c.poly([(x + w * 0.2, y), (x, y - h), (x + w / 2 + 3, y)]), d, grain=0.12)
    segs = []
    for t in np.linspace(0.2, 0.93, int(max(3, h / 8))):                # hàng ngói cong
        hw = (w / 2 + 3) * t; yy = y - h * (1 - t)
        pts = [(x + hw * u, yy + (1 - u * u) * h * 0.035 * t) for u in np.linspace(-1, 1, 7)]
        segs += [(*pts[i], *pts[i + 1], 1.0) for i in range(6)]
    c.wash(c.lines(segs), mixh(d, '#000000', 0.3), alpha=0.42)
    c.wash(c.lines([(x - w * 0.03, y - h * 0.97, x - w * 0.3, y - 2, 1.2)], 0.5), '#ffffff', alpha=0.35)
    if w > 60:                                                          # cửa mái
        dx, dy, q = x - w * 0.07, y - h * 0.26, w * 0.1
        c.wash(c.poly([(dx - q * 1.3, dy), (dx, dy - q * 2.1), (dx + q * 1.3, dy)]), d)
        c.wash(c.rect(dx - q * 0.9, dy - q * 0.2, dx + q * 0.9, dy + q * 1.5), '#f6ecd6', '#b9a98e')
        c.wash(c.rect(dx - q * 0.45, dy + q * 0.1, dx + q * 0.45, dy + q * 1.3), '#2a3552')
    c.wash(c.ells([(x, y, w / 2 + 4, max(2, w * 0.07))]), d, grain=0.05)
    c.wash(c.ells([(x, y - h - 1, max(1.5, w * 0.035), max(1.5, w * 0.035))]), '#f2d070')
    if flag:
        c.wash(c.lines([(x, y - h, x, y - h - 20, 1.3)]), '#4a4038')
        c.wash(c.poly([(x, y - h - 20), (x + 20, y - h - 16), (x + 13, y - h - 12), (x + 21, y - h - 8), (x, y - h - 9)]), flag, mixh(flag, '#000000', 0.25), grain=0.1)


def tower(c, x, base, w, h, stone, roof=None, roof_h=None, rng=None, win=2, flag=None, crenel=True, alpha=1.0, ivy=None):
    """Tháp tròn: thân sáng trái - tối phải, đai đá, cửa sổ vòm, mái nón hoặc lỗ châu mai."""
    lit, dark = stone
    top = base - h
    c.wash(c.rect(x - w / 2, top, x + w / 2, base), lit, mixh(lit, dark, 0.35), grain=0.14, edge=0.35, side=0.75)
    c.wash(c.rect(x + w * 0.22, top, x + w / 2, base, 1.5), dark, alpha=0.55, grain=0.1)          # mặt khuất
    c.wash(c.rect(x - w / 2, top, x - w * 0.36, base, 1.0), '#fff6e0', alpha=0.25, grain=0.1)     # mép nắng
    if rng is not None:
        stone_hint(c, x - w / 2 + 2, top + 6, x + w / 2 - 2, base, rng, dark, '#fff4e2', bw=max(7, w * 0.16), bh=max(4, w * 0.09))
    # đai nhô đầu tháp
    c.wash(c.rect(x - w / 2 - 4, top - 2, x + w / 2 + 4, top + max(5, w * 0.12)), mixh(lit, '#ffffff', 0.25), mixh(lit, dark, 0.6), grain=0.1, edge=0.5, side=0.7)
    c.wash(c.rect(x - w / 2, top + max(5, w * 0.12), x + w / 2, top + max(5, w * 0.12) + 5, 1.2), dark, alpha=0.5)
    bt = top + max(5, w * 0.12)
    cor = [[(x - w / 2 + k * w / 7 + 1, bt), (x - w / 2 + (k + 0.55) * w / 7, bt), (x - w / 2 + (k + 0.55) * w / 7, bt + max(2.5, w * 0.07)), (x - w / 2 + k * w / 7 + 1, bt + max(2.5, w * 0.07))] for k in range(7)]
    c.wash(c.polys(cor), mixh(lit, dark, 0.75), alpha=0.8)                                         # gờ đỡ dưới đầu tháp
    sy = top + h * 0.62
    c.wash(c.rect(x - w / 2 - 1.5, sy, x + w / 2 + 1.5, sy + max(2, w * 0.05)), mixh(lit, '#ffffff', 0.35), mixh(lit, dark, 0.6), grain=0.05, side=0.7)   # đai giữa thân
    c.wash(c.rect(x - w / 2, sy + max(2, w * 0.05), x + w / 2, sy + max(2, w * 0.05) + 2.5, 0.8), dark, alpha=0.4)
    c.wash(c.rect(x - w / 2 - 2.5, base - max(4, w * 0.1), x + w / 2 + 2.5, base), mixh(lit, dark, 0.2), mixh(lit, dark, 0.7), grain=0.1, side=0.7)      # chân tháp
    for i in range(win):
        wy = top + h * (0.28 + 0.3 * i)
        arch_win(c, x - w * 0.08, wy, max(4, w * 0.13), max(9, w * 0.3))
    if w >= 30:
        sl = [(x + w * 0.24, top + h * 0.34), (x - w * 0.3, top + h * 0.5), (x + w * 0.2, top + h * 0.8)]
        c.wash(c.polys([[(px - 1, py), (px + 1, py), (px + 1, py + w * 0.2), (px - 1, py + w * 0.2)] for px, py in sl]), '#2a3552', alpha=0.85)   # khe bắn
    if ivy and rng is not None:
        cl = [(x - w * 0.5 + rng.random() * w * 0.55, base - rng.random() ** 1.6 * h * 0.6, 5 + rng.random() * 6) for _ in range(16)]
        foliage(c, cl, ivy, rng, grain=0.06)
    if roof:
        cone_roof(c, x, top - 2, w + 8, roof_h or w * 1.1, roof, flag)
    elif crenel:
        crenels(c, x - w / 2 - 4, x + w / 2 + 4, top - 2, max(5, w * 0.16), max(5, w * 0.13), mixh(lit, '#ffffff', 0.2), mixh(lit, dark, 0.5))


def wall(c, x0, x1, top, base, stone, rng, mw=11, mh=9, hint=True):
    lit, dark = stone
    c.wash(c.rect(x0, top, x1, base), lit, mixh(lit, dark, 0.55), grain=0.14, edge=0.25)
    if hint:
        stone_hint(c, x0, top + 4, x1, base, rng, dark, '#fff4e2', bw=mw * 1.5, bh=mh * 0.85)
    ch = mh * 0.85
    segs = [(x0, y, x1, y, 0.8) for y in np.arange(top + ch, base, ch)]
    for j, y in enumerate(np.arange(top, base, ch)):
        for x in np.arange(x0 + (mw * 0.9 if j % 2 else 0), x1, mw * 1.8):
            if rng.random() < 0.55:
                segs.append((x, y, x, min(base, y + ch), 0.8))
    c.wash(c.lines(segs), dark, alpha=0.2)                                                         # mạch xây mờ
    sl = [[(x - 1.2, top + (base - top) * 0.3), (x + 1.2, top + (base - top) * 0.3), (x + 1.2, top + (base - top) * 0.3 + mh * 1.3), (x - 1.2, top + (base - top) * 0.3 + mh * 1.3)] for x in np.arange(x0 + 40, x1 - 20, mw * 7.5)]
    if sl:
        c.wash(c.polys(sl), '#2a3552', alpha=0.8)
    c.wash(c.rect(x0, top, x1, top + 4), mixh(lit, '#ffffff', 0.35), alpha=0.7)
    c.wash(c.rect(x0, top + 4, x1, top + 7, 0.8), dark, alpha=0.35)
    crenels(c, x0, x1, top, mw, mh, mixh(lit, '#ffffff', 0.2), mixh(lit, dark, 0.35))


def house(c, x, base, w, h, wall_c, roof_c, rng, timber=True):
    """Nhà phố mái ngói: tường + mái dốc 2 mảng + cửa sổ + ống khói."""
    rh = h * (0.42 + rng.random() * 0.12)
    top = base - h
    c.wash(c.rect(x - w / 2, top + rh, x + w / 2, base), wall_c, mixh(wall_c, '#7a6a5c', 0.4), grain=0.12, edge=0.3, side=0.4)
    if timber:
        segs = [(x - w / 2, top + rh + (base - top - rh) * 0.5, x + w / 2, top + rh + (base - top - rh) * 0.5, 1.6)]
        segs += [(x + s * w * 0.25, top + rh, x + s * w * 0.25, base, 1.4) for s in (-1, 1)]
        c.wash(c.lines(segs), '#6a4a38', alpha=0.7)
    ridge = w * (0.25 + rng.random() * 0.15)
    c.wash(c.poly([(x - w / 2 - 5, top + rh + 2), (x - ridge, top), (x + ridge, top), (x + w / 2 + 5, top + rh + 2)]), roof_c, mixh(roof_c, '#3a2222', 0.45), grain=0.2, edge=0.5)
    c.wash(c.poly([(x - w / 2 - 5, top + rh + 2), (x - ridge, top), (x - ridge + w * 0.12, top), (x - w * 0.2, top + rh + 2)]), mixh(roof_c, '#fff0d0', 0.35), alpha=0.8, grain=0.2)
    cx = x + ridge * 0.5
    c.wash(c.rect(cx, top - 10, cx + 7, top + 8), mixh(wall_c, '#6a5a50', 0.5), grain=0.1)
    tl = []
    for t in (0.3, 0.55, 0.8):                                                                     # hàng ngói
        hw0 = ridge + (w / 2 + 5 - ridge) * t
        tl.append((x - hw0, top + (rh + 2) * t, x + hw0, top + (rh + 2) * t, 0.9))
    c.wash(c.lines(tl), mixh(roof_c, '#2a1414', 0.6), alpha=0.4)
    c.wash(c.rect(x - w / 2 - 5, top + rh + 1, x + w / 2 + 5, top + rh + 4), mixh(roof_c, '#2a1414', 0.55), alpha=0.8)
    for s in (-1, 1):
        wx = x + s * w * 0.22
        c.wash(c.rect(wx - 5.2, top + rh + 5.8, wx + 5.2, top + rh + 20.2), '#fff8e8', alpha=0.85)
        c.wash(c.rect(wx - 4, top + rh + 7, wx + 4, top + rh + 19), '#3a4a6a', grain=0.05)
        c.wash(c.rect(wx - 4, top + rh + 7, wx - 0.5, top + rh + 12), '#9fc4e6', alpha=0.7)
        c.wash(c.lines([(wx, top + rh + 7, wx, top + rh + 19, 0.8)]), '#fff8e8', alpha=0.8)
        c.wash(c.rect(wx - 6, top + rh + 19.5, wx + 6, top + rh + 23), '#7a5236')                 # bồn hoa cửa sổ
        c.dots([(wx - 4 + k * 2.7, top + rh + 18.5 - (k % 2)) for k in range(4)], ['#ff7f9c', '#ffd85a', '#ffffff'][int(rng.random() * 3)], 1.5)
    if base - top - rh > 34:
        c.wash(c.rect(x - 4.5, base - 17, x + 4.5, base), '#7a5236', '#4a2f20', edge=0.5)         # cửa
        c.wash(c.ells([(x, base - 17, 4.5, 4.5)]), '#7a5236')
    if rng.random() < 0.4:                                                                         # khói bếp
        for k in range(5):
            c.glow(cx + 3 + k * 3 + rng.random() * 4, top - 16 - k * 11, 7 + k * 2.5, '#ffffff', 0.28 - k * 0.04, 1.6)


# ============================================================
# LÂU ĐÀI (sân trước hoàng thành)
# ============================================================
def castle():
    FOG = '#c4bcab'
    W, H = BACK
    c = Cv(W, H, seed=5)
    rng = np.random.default_rng(12)
    c.grad([(0, '#3f86d2'), (0.35, '#74b1ea'), (0.62, '#b6daf4'), (0.82, '#e6f0f0'), (1, '#f1ecd9')])
    c.glow(1100, 60, 900, '#fff8dc', 0.5, 1.6, sy=0.5)
    # mây xa (nhỏ, nhạt) -> mây lớn
    for i in range(14):
        cloud(c, rng.random() * W, 232 + rng.random() * 26, 150 + rng.random() * 170, 26 + rng.random() * 22,
              cols=('#b9d0ea', '#d6e6f4', '#f1f6fa', '#ffffff'), seed=40 + i, alpha=0.85)
    big = [(380, 196, 560, 150), (1250, 150, 420, 110), (2050, 120, 520, 100), (2950, 185, 640, 160), (3750, 150, 460, 120), (800, 95, 300, 60), (3350, 80, 280, 56)]
    for i, (x, y, w, h) in enumerate(big):
        cloud(c, x, y, w, h, cols=('#8fb0de', '#c4d9f0', '#f4f8fc', '#ffffff'), seed=60 + i)
    # núi xa
    for i, (yb, amp, col, snow) in enumerate([(262, 120, '#9bb9e0', True), (276, 70, '#89a9cf', False)]):
        xs = np.linspace(0, W, 260)
        n = fbm(1, 260, 22, 70 + i, 4)[0]
        ys = yb - amp * np.clip(n - 0.25, 0, 1) ** 1.3 * 1.6
        c.wash(c.poly(list(zip(xs, ys)) + [(W, H), (0, H)], 0.8), col, mixh(col, '#dfeaf2', 0.75), grain=0.06)
        if snow:
            caps = [[(xs[j - 3], ys[j - 3] + 16), (xs[j], ys[j] - 0.5), (xs[j + 3], ys[j + 3] + 18), (xs[j + 1], ys[j] + 12), (xs[j - 1], ys[j] + 15)] for j in range(4, 256) if ys[j] < yb - amp * 0.62 and ys[j] <= ys[j - 1] and ys[j] <= ys[j + 1]]
            if caps:
                c.wash(c.polys(caps, 0.6), '#f4f8ff', alpha=0.85)
    c.haze(210, 300, '#e4eef2', 0.45, wavy=0.3)

    far = lambda col, t=0.38: mixh(col, '#cfdff0', t)
    S1 = (far('#f0e6d2'), far('#9a8e86'))            # đá lâu đài (xa, phủ sương xanh)
    R1 = (far('#27407e', .2), far('#3d62b0', .2), far('#7fa4e4', .2))
    cx = W // 2
    # đồi dưới lâu đài
    c.wash(c.ells([(cx, 372, 980, 92)]), far('#6f9a62', 0.3), far('#4f7a50', 0.2), grain=0.2)
    hb = 300
    # --- thành chính ---
    def castle_at(cx, s=1.0, seed=0, flag='#c8372f'):
        r = np.random.default_rng(seed)
        X = lambda v: cx + v * s
        Y = lambda v: hb - v * s
        # tháp sau
        for dx, hh, ww in ((-150, 205, 44), (150, 195, 44), (-62, 232, 40), (70, 222, 38)):
            tower(c, X(dx), hb, ww * s, hh * s, S1, R1, ww * s * 1.5, r, 2, flag=flag if dx == -62 else None)
        # khối giữa
        c.wash(c.rect(X(-112), Y(170), X(112), hb), S1[0], mixh(S1[0], S1[1], 0.45), grain=0.14, edge=0.3, side=0.35)
        stone_hint(c, X(-112), Y(165), X(112), hb, r, S1[1], '#fffaf0', bw=15 * s, bh=7 * s)
        crenels(c, X(-116), X(116), Y(170), 10 * s, 8 * s, mixh(S1[0], '#ffffff', 0.3), S1[0])
        for i in range(5):
            arch_win(c, X(-72 + i * 36), Y(118), 9 * s, 26 * s, '#31406a')
        # tháp chính giữa
        tower(c, X(0), Y(150), 62 * s, 110 * s, S1, R1, 96 * s, r, 2, flag='#e0b03a')
        # cánh hai bên
        for sg in (-1, 1):
            c.wash(c.rect(X(sg * 112), Y(104), X(sg * 300), hb) if sg > 0 else c.rect(X(-300), Y(104), X(-112), hb), S1[0], mixh(S1[0], S1[1], 0.5), grain=0.14, edge=0.3)
            x0, x1 = sorted((X(sg * 112), X(sg * 300)))
            stone_hint(c, x0, Y(100), x1, hb, r, S1[1], '#fffaf0', bw=15 * s, bh=7 * s)
            crenels(c, x0, x1, Y(104), 10 * s, 8 * s, mixh(S1[0], '#ffffff', 0.3), S1[0])
            for i in range(3):
                arch_win(c, X(sg * (160 + i * 44)), Y(56), 8 * s, 22 * s, '#31406a')
            tower(c, X(sg * 300), hb, 68 * s, 150 * s, S1, R1, 84 * s, r, 3, flag=flag)
            tower(c, X(sg * 215), hb, 34 * s, 128 * s, S1, R1, 50 * s, r, 1)
        # cổng thành
        for sg in (-1, 1):
            tower(c, X(sg * 46), hb, 40 * s, 92 * s, S1, None, None, r, 1)
        c.wash(c.rect(X(-28), Y(70), X(28), hb), mixh(S1[0], S1[1], 0.3), grain=0.1)
        arch_win(c, X(0), hb, 34 * s, 56 * s, '#2a2f48')
        c.wash(c.lines([(X(dx), Y(50), X(dx), hb, 1.1) for dx in (-11, -5.5, 0, 5.5, 11)] + [(X(-16), Y(yy), X(16), Y(yy), 1.1) for yy in (10, 22, 34)]), '#8a8ea0', alpha=0.7)   # song cổng
        for dx in (-140, -185, -250, 140, 185, 250):                                             # cửa sổ sáng đèn tầng dưới
            arch_win(c, X(dx), Y(18), 7 * s, 16 * s, '#3a4a78')
        for i in range(5):
            arch_win(c, X(-72 + i * 36), Y(62), 8 * s, 20 * s, '#31406a')
        # cờ treo
        for dx in (-84, 84):
            c.wash(c.poly([(X(dx - 9), Y(92)), (X(dx + 9), Y(92)), (X(dx + 9), Y(46)), (X(dx), Y(36)), (X(dx - 9), Y(46))]), far(flag, 0.15), far(mixh(flag, '#400000', 0.4), 0.15), grain=0.1, edge=0.4)
            c.dots([(X(dx), Y(70))], far('#f2d070', 0.1), 3.2 * s)
    castle_at(cx, 1.0, 1)
    # hai pháo đài phụ hai đầu
    S2 = S1
    for x0, sd in ((560, 3), (3560, 4)):
        r = np.random.default_rng(sd)
        wall(c, x0 - 240, x0 + 240, 236, 306, S2, r)
        for dx, hh, ww, rf in ((-240, 120, 56, True), (240, 108, 52, True), (0, 170, 70, True), (-110, 96, 40, False), (120, 92, 40, False)):
            tower(c, x0 + dx, 306, ww, hh, S2, R1 if rf else None, ww * 1.25, r, 2, flag='#c8372f' if dx == 0 else None)
    c.haze(250, 312, '#e6eef2', 0.30, wavy=0.4)

    # --- phố mái ngói (giữa lâu đài và tường thành) + cây ---
    walls = ['#f2e6cc', '#e9d9bc', '#f6eedc', '#e2d2b6']
    roofs = ['#c8603e', '#b2503a', '#d0744a', '#7a8fb0', '#a84a3c']
    x = -20.0
    tcols = [('#2a5a4c', '#3f7f58', '#6fae62', '#b6dc7a'), ('#2f6050', '#4a8a5a', '#80b866', '#c8e486')]
    while x < W + 40:
        if abs(x - cx) < 120:
            x += 60; continue
        w = 52 + rng.random() * 34; h = 56 + rng.random() * 34
        if rng.random() < 0.22:
            foliage(c, canopy_clumps(rng, x, 290 - rng.random() * 14, 34, 26, n=7), [far(k, 0.18) for k in tcols[int(rng.random() * 2)]], rng)
        else:
            house(c, x, 318, w, h, far(walls[int(rng.random() * 4)], 0.14), far(roofs[int(rng.random() * 5)], 0.14), rng, timber=rng.random() < 0.6)
        x += w * (0.62 + rng.random() * 0.5)
    c.haze(280, 322, '#e9ecdf', 0.22, wavy=0.5)

    # --- tường thành sân trước (gần, nét rõ) ---
    S3 = ('#eadfc8', '#8f8377')
    R3 = ('#243a78', '#3a5cae', '#86aaea')
    wall(c, 0, W, 286, BG + 2, S3, rng, mw=14, mh=11)
    c.wash(c.rect(0, BG - 16, W, BG + 2, 3), '#6a6258', alpha=0.35)                    # bóng chân tường
    for xb in np.arange(60, W, 205):                                                 # trụ ốp tường
        c.wash(c.rect(xb - 9, 288, xb + 9, BG + 2), '#f4ead6', '#a79b8b', grain=0.12, edge=0.4, side=0.9)
        c.wash(c.rect(xb - 12, 284, xb + 12, 291), '#fffaf0', '#b9ad9c', edge=0.5)
    IVY = ('#245a44', '#3a8050', '#6ab45e', '#b4dc78')
    for i in range(26):                                                              # thường xuân rủ trên tường
        x0 = rng.random() * W
        if abs(x0 - cx) < 200:
            continue
        cl = [(x0 + (rng.random() - 0.5) * 60, 288 + rng.random() ** 1.5 * 34, 5 + rng.random() * 7) for _ in range(14)]
        foliage(c, cl, IVY, rng, grain=0.06)
        for k in range(3):
            vine(c, x0 + (rng.random() - 0.5) * 50, 300 + rng.random() * 10, 14 + rng.random() * 20, rng, stem='#245a44', leaf=('#3a8050', '#6ab45e'), sway=4)
    for i, xg in enumerate(np.arange(110, W, 163)):                                  # lính gác trên mặt thành
        if rng.random() < 0.45 or abs(xg - cx) < 60:
            continue
        gy = 286
        c.wash(c.lines([(xg + 5, gy - 26, xg + 5, gy, 1.0)]), '#5a4a3a')
        c.wash(c.poly([(xg + 3.6, gy - 26), (xg + 5, gy - 31), (xg + 6.4, gy - 26)]), '#dfe4ea')
        c.wash(c.rect(xg - 3.4, gy - 13, xg + 3.4, gy), '#b8322e' if i % 2 else '#2f52a0', grain=0.05)
        c.wash(c.ells([(xg, gy - 16, 3.2, 3.4)]), '#c9d0d8')
        c.wash(c.ells([(xg - 0.8, gy - 16.6, 1.6, 1.6)]), '#f2f5f8')
    xt = 150.0; i = 0
    while xt < W:
        if abs(xt - cx) > 560:
            tower(c, xt, BG + 2, 84, 118 + (i % 2) * 22, S3, R3 if i % 2 == 0 else None, 96, rng, 2, flag='#c8372f' if i % 4 == 0 else None, ivy=('#245a44', '#3a8050', '#6ab45e', '#b4dc78') if i % 3 else None)
        xt += 430 + rng.random() * 120; i += 1
    # cổng lớn giữa: hai tháp + vòm, nhìn xuyên thấy lâu đài
    for sg in (-1, 1):
        tower(c, cx + sg * 420, BG + 2, 96, 140, S3, R3, 112, rng, 2, flag='#e0b03a')
    # cờ rủ trên tường
    for xb in np.arange(120, W, 205):
        if abs(xb - cx) < 150 or rng.random() < 0.35:
            continue
        col = '#b8322e' if int(xb) % 2 else '#2f52a0'
        c.wash(c.poly([(xb - 10, 292), (xb + 10, 292), (xb + 10, 326), (xb, 336), (xb - 10, 326)]), col, mixh(col, '#200818', 0.45), grain=0.12, edge=0.5)
        c.wash(c.rect(xb - 10, 292, xb + 10, 295), '#e8c060')
        c.dots([(xb, 310)], '#f2d070', 3.4)
    # --- hàng cây cảnh + bồn hoa sát tường ---
    for i in range(34):
        x = (i + rng.random() * 0.7) * W / 34
        if abs(x - cx) < 90:
            continue
        if i % 3 == 0:
            tree(c, x, BG + 4, 86 + rng.random() * 30, 76 + rng.random() * 30, tcols[i % 2], trunk=('#7a5c44', '#3a2a22'), seed=800 + i, canopy=0.66, tw=7, branch=False)
        else:
            bush(c, x, BG + 6, 60 + rng.random() * 50, 24 + rng.random() * 14, tcols[i % 2], seed=820 + i, n=5)
    fl = [(rng.random() * W, BG + 2 - rng.random() * 16) for _ in range(520)]
    c.dots(fl[:180], '#ffffff', 1.6); c.dots(fl[180:340], '#ff8fa8', 1.6); c.dots(fl[340:], '#ffd85a', 1.6)
    c.haze(BG - 10, H - 4, FOG, 0.85, wavy=0.2)
    c.glow(1100, 60, 1500, '#fff4d0', 0.16, 1.4, sy=0.3)
    for _ in range(26):                                             # đàn chim
        x, y = rng.random() * W, 60 + rng.random() * 150
        sz = 4 + rng.random() * 4
        c.wash(c.lines([(x - sz, y - sz * 0.5, x, y, 1.1), (x, y, x + sz, y - sz * 0.6, 1.1)]), '#4a5878', alpha=0.7)
    back = c.finish(sat=1.05)

    # ================= lớp gần: lan can đá, đèn, cờ, đài phun nước, tượng =================
    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=6)
    rng = np.random.default_rng(31)
    ST = ('#f0e8d8', '#8e8478')
    gx = W2 // 2
    # lan can: nhịp 26px, bỏ trống quanh đài phun + vài lối đi
    gaps = [(gx - 330, gx + 330), (700, 900), (3200, 3400)]
    ingap = lambda x: any(a < x < b for a, b in gaps)
    by = MG + 6
    x = 0
    seg0 = None
    while x <= W2:
        if not ingap(x) and not ingap(x + 26):
            m.wash(m.poly([(x + 8, by), (x + 9, by - 24), (x + 6, by - 30), (x + 9, by - 36), (x + 17, by - 36), (x + 20, by - 30), (x + 17, by - 24), (x + 18, by)]), ST[0], ST[1], grain=0.1, edge=0.6, side=0.7)
        x += 26
    for a, b in [(0, gaps[1][0]), (gaps[1][1], gaps[0][0]), (gaps[0][1], gaps[2][0]), (gaps[2][1], W2)]:
        m.wash(m.rect(a, by - 44, b, by - 35), '#fbf5e8', '#b9ad9c', grain=0.1, edge=0.6)
        m.wash(m.rect(a, by - 6, b, by + 14), '#e4dac8', '#93897c', grain=0.12, edge=0.4)
        for px in (a + 12, b - 12):                                 # trụ đầu lan can + chậu hoa
            m.wash(m.rect(px - 14, by - 62, px + 14, by + 12), ST[0], ST[1], grain=0.12, edge=0.6, side=0.7)
            m.wash(m.rect(px - 18, by - 68, px + 18, by - 60), '#fffaf0', '#b9ad9c', edge=0.6)
            bush(m, px, by - 66, 44, 26, ('#2a6048', '#44905a', '#7cc068', '#c6ea86'), seed=int(px), n=4)
            pts = [(px + (rng.random() - 0.5) * 34, by - 74 - rng.random() * 18) for _ in range(14)]
            m.dots(pts[:7], '#ff7f9c', 2.2); m.dots(pts[7:], '#fff2a0', 2.0)
    # cột đèn
    for lx in np.arange(260, W2, 520):
        if ingap(lx):
            continue
        m.wash(m.rect(lx - 3, by - 150, lx + 3, by + 10), '#4a4650', '#25232c', grain=0.1, side=0.8)
        m.wash(m.poly([(lx - 9, by + 10), (lx - 5, by - 14), (lx + 5, by - 14), (lx + 9, by + 10)]), '#55505c', '#25232c')
        m.wash(m.lines([(lx, by - 140, lx + 26, by - 150, 2.4), (lx + 26, by - 150, lx + 26, by - 138, 2)]), '#3a3742')
        m.wash(m.poly([(lx + 17, by - 138), (lx + 35, by - 138), (lx + 32, by - 112), (lx + 20, by - 112)]), '#ffe9a8', '#ffc45c', edge=0.9)
        m.wash(m.poly([(lx + 14, by - 138), (lx + 26, by - 148), (lx + 38, by - 138)]), '#3a3742')
        m.glow(lx + 26, by - 124, 46, '#ffd98a', 0.5, 1.8)
        # cờ treo cột
        col = '#b8322e' if int(lx) % 1040 < 520 else '#2f52a0'
        m.wash(m.lines([(lx - 30, by - 128, lx, by - 128, 2)]), '#3a3742')
        m.wash(m.poly([(lx - 30, by - 126), (lx - 6, by - 126), (lx - 6, by - 70), (lx - 18, by - 58), (lx - 30, by - 70)]), col, mixh(col, '#200818', 0.5), grain=0.12, edge=0.6, side=0.4)
        m.wash(m.rect(lx - 30, by - 126, lx - 6, by - 122), '#eac566')
        m.wash(m.poly([(lx - 18, by - 108), (lx - 11, by - 96), (lx - 18, by - 84), (lx - 25, by - 96)]), '#f2d070', '#c89a3a')
    # luống hoa chân lan can + cây cảnh tỉa nón trong chậu + ghế đá
    HED = ('#2a6048', '#44905a', '#7cc068', '#c6ea86')
    for a, b in [(0, gaps[1][0]), (gaps[1][1], gaps[0][0]), (gaps[0][1], gaps[2][0]), (gaps[2][1], W2)]:
        xq = a + 40
        while xq < b - 40:
            Lq = 90 + rng.random() * 110
            if rng.random() < 0.6:
                cl = [(xq + t * Lq, by + 6 - rng.random() * 5, 7 + rng.random() * 4) for t in np.linspace(0, 1, int(Lq / 9))]
                foliage(m, cl, HED, rng, grain=0.06)
                pts = [(xq + rng.random() * Lq, by - 2 - rng.random() * 10) for _ in range(int(Lq / 5))]
                k3 = len(pts) // 3
                m.dots(pts[:k3], '#ff7f9c', 2.0); m.dots(pts[k3:2 * k3], '#fff6c0', 1.9); m.dots(pts[2 * k3:], ['#c9a0ff', '#ffb050'][int(rng.random() * 2)], 1.9)
            xq += Lq + 40 + rng.random() * 120
    for i, tx in enumerate((150, 610, 990, 1420, 2680, 3110, 3490, 3950)):
        m.wash(m.poly([(tx - 15, by + 12), (tx - 19, by - 12), (tx + 19, by - 12), (tx + 15, by + 12)]), '#d98f5c', '#8a4a30', grain=0.2, edge=0.7, side=0.8)
        m.wash(m.rect(tx - 21, by - 16, tx + 21, by - 10), '#eaa672', '#a45c3a', edge=0.6)
        m.wash(m.rect(tx - 2, by - 34, tx + 2, by - 14), '#6a4a34')
        cl = [(tx + (rng.random() - 0.5) * 30 * (1 - t), by - 34 - t * 74, 12 * (1 - t) + 5) for t in np.linspace(0, 1, 14)]
        foliage(m, cl, HED, rng, grain=0.06)
    for bx in (1080, 3010):                                           # ghế đá
        m.wash(m.rect(bx - 60, by - 22, bx + 60, by - 14), '#fbf5e8', '#b9ad9c', grain=0.1, edge=0.6)
        for dx in (-46, 46):
            m.wash(m.poly([(bx + dx - 9, by + 12), (bx + dx - 6, by - 14), (bx + dx + 6, by - 14), (bx + dx + 9, by + 12)]), ST[0], ST[1], grain=0.1, edge=0.6, side=0.8)
    # đài phun nước giữa sân
    fx, fy = gx, by + 8
    m.wash(m.ells([(fx, fy - 8, 150, 20)]), '#8fd0ee', '#5fa8d8', grain=0.1)
    m.wash(m.poly([(fx - 158, fy - 8), (fx + 158, fy - 8), (fx + 150, fy + 16), (fx - 150, fy + 16)]), '#efe6d4', '#93897c', grain=0.14, edge=0.6, side=0.5)
    m.wash(m.ells([(fx, fy - 8, 158, 9)]), '#fffaf0', '#cfc4b2', edge=0.5)
    m.wash(m.ells([(fx, fy - 8, 144, 6)]), '#9fdcf4', '#6fb6e0')
    m.wash(m.poly([(fx - 14, fy - 8), (fx - 9, fy - 70), (fx + 9, fy - 70), (fx + 14, fy - 8)]), ST[0], ST[1], grain=0.12, edge=0.6, side=0.8)
    m.wash(m.ells([(fx, fy - 70, 56, 8)]), '#fffaf0', '#a59a8c', edge=0.6)
    m.wash(m.poly([(fx - 56, fy - 70), (fx + 56, fy - 70), (fx + 24, fy - 54), (fx - 24, fy - 54)]), '#ddd3c0', '#8e8478', grain=0.1, side=0.6)
    m.wash(m.poly([(fx - 7, fy - 70), (fx - 5, fy - 108), (fx + 5, fy - 108), (fx + 7, fy - 70)]), ST[0], ST[1], side=0.8)
    m.wash(m.ells([(fx, fy - 108, 24, 5)]), '#fffaf0', '#a59a8c', edge=0.6)
    for sg in (-1, 1):                                              # tia nước
        for k, (r0, y0, y1) in enumerate(((22, fy - 108, fy - 72), (52, fy - 70, fy - 10))):
            pts = [(fx + sg * (r0 * t ** 0.6 + (4 if k else 2)), y0 + (y1 - y0) * t ** 2) for t in np.linspace(0, 1, 9)]
            m.wash(m.lines([(*pts[j], *pts[j + 1], 3.2 - k) for j in range(8)], 0.8), '#eafaff', alpha=0.85)
    m.glow(fx, fy - 116, 12, '#ffffff', 0.5)
    m.wash(m.lines([(fx - 150 + k * 20, fy - 2, fx - 150 + k * 20, fy + 14, 1.2) for k in range(16)]), '#93897c', alpha=0.5)     # ô chia thành bể
    m.wash(m.ells([(fx - 150 + k * 20 + 10, fy + 6, 5, 4) for k in range(15)]), '#fffaf0', alpha=0.5)
    m.wash(m.poly([(fx - 172, fy + 16), (fx + 172, fy + 16), (fx + 176, fy + 24), (fx - 176, fy + 24)]), '#e4dac8', '#93897c', edge=0.5)        # bậc thềm
    m.wash(m.ells([(fx + dx, fy - 9 + (k % 2), 16 - k * 3, 2.2) for k, dx in enumerate((-90, -40, 50, 100))], 0.6), '#eafaff', alpha=0.7)       # gợn nước
    for i in range(7):                                                # bồ câu
        px = fx + (-250, -215, -190, 196, 226, 260, -120)[i]; py = by + 10 if i < 6 else fy - 12
        m.wash(m.ells([(px, py - 5, 7, 4.5)]), '#e8ecf2', '#aab2c0', edge=0.6)
        m.wash(m.ells([(px + (5 if i % 2 else -5), py - 10, 3, 3)]), '#f4f6fa')
        m.wash(m.poly([(px - (5 if i % 2 else -5), py - 6), (px - (12 if i % 2 else -12), py - 3), (px - (5 if i % 2 else -5), py - 3)]), '#9aa4b4')
        m.dots([(px + (7.5 if i % 2 else -7.5), py - 10)], '#e89a4a', 1.0)
    for _ in range(40):
        m.dots([(fx + (rng.random() - 0.5) * 240, fy - 14 - rng.random() * 10)], '#ffffff', 1.0 + rng.random())
    # tượng kỵ sĩ hai bên đài phun
    for sx in (gx - 300, gx + 300):
        m.wash(m.rect(sx - 26, by - 50, sx + 26, by + 12), ST[0], ST[1], grain=0.12, edge=0.6, side=0.7)
        m.wash(m.rect(sx - 31, by - 56, sx + 31, by - 48), '#fffaf0', '#b9ad9c', edge=0.6)
        body = [(sx - 13, by - 56), (sx - 15, by - 96), (sx - 20, by - 100), (sx - 17, by - 116), (sx - 8, by - 122), (sx - 7, by - 136), (sx, by - 142), (sx + 7, by - 136),
                (sx + 8, by - 122), (sx + 17, by - 116), (sx + 20, by - 100), (sx + 15, by - 96), (sx + 13, by - 56)]
        m.wash(m.poly(body), '#e6e0d6', '#847c74', grain=0.12, edge=0.7, side=0.9)
        m.wash(m.lines([(sx + 24, by - 150, sx + 24, by - 56, 2.4)]), '#c9c2b6')
        m.wash(m.poly([(sx + 20, by - 150), (sx + 24, by - 164), (sx + 28, by - 150)]), '#f4efe6')
        m.wash(m.poly([(sx - 24, by - 108), (sx - 8, by - 108), (sx - 8, by - 84), (sx - 16, by - 72), (sx - 24, by - 84)]), '#d8d0c4', '#8a8278', edge=0.7)
    # thùng gỗ, bao hàng
    for i, x in enumerate((480, 1180, 1500, 2700, 3050, 3760)):
        x += rng.random() * 60
        m.wash(m.rect(x - 22, by - 24, x + 22, by + 12), '#c89a62', '#7a5234', grain=0.25, edge=0.7, side=0.5)
        m.wash(m.lines([(x - 22, by - 12, x + 22, by - 12, 2), (x - 22, by, x + 22, by, 2)]), '#5a3a26', alpha=0.7)
        m.wash(m.lines([(x - 22, by - 24, x + 22, by + 12, 1.6), (x + 22, by - 24, x - 22, by + 12, 1.6)]), '#7a5234', alpha=0.6)
        m.dots([(x - 19, by - 21), (x + 19, by - 21), (x - 19, by + 9), (x + 19, by + 9)], '#3a2a20', 1.3)
        cs = [(x - 8 + k * 9, by - 30 - (k % 2) * 3, 6.5) for k in range(3)]                       # táo trên thùng
        m.relief(cs, ('#a82f2a', '#d8483a', '#f27a5c'), grain=0.05)
        m.wash(m.poly([(x + 26, by + 12), (x + 24, by - 14), (x + 30, by - 30), (x + 46, by - 30), (x + 52, by - 14), (x + 50, by + 12)]), '#b98858', '#6a452c', grain=0.25, edge=0.7, side=0.7)
        m.wash(m.lines([(x + 25, by - 10, x + 51, by - 10, 2.2), (x + 26, by + 4, x + 50, by + 4, 2.2)]), '#4a4a52')
    grass(m, 0, W2, by + 14, 5, 12, 500, ['#5f9a56', '#8cc468'], seed=3)
    mid = m.finish(sat=1.05)

    # ================= đất: sân lát đá cuội =================
    t = Tile('#9a9184', seed=49)
    r = t.rng
    stones = []
    cw, ch = 512 / 11, 512 / 8
    for j in range(8):
        for i in range(11):
            x = (i + (0.5 if j % 2 else 0)) * cw + (r.random() - 0.5) * 6; y = j * ch + (r.random() - 0.5) * 6
            stones.append((x, y, cw * (0.86 + r.random() * 0.08), ch * (0.86 + r.random() * 0.08), r.random()))
    def rr(d, X, Y, x, y, w, h, rad):
        d.rounded_rectangle([X(x - w / 2), Y(y - h / 2), X(x + w / 2), Y(y + h / 2)], radius=rad * SS, fill=255)
    t.stamp(lambda d, X, Y: [rr(d, X, Y, x + 2.2, y + 2.8, w, h, 9) for x, y, w, h, v in stones], '#6f675b', 0.75, 0.8)      # bóng viên đá
    for lo, col in ((0.0, '#b9b0a0'), (0.22, '#c9c0af'), (0.5, '#d6cdbb'), (0.75, '#bfb3a6'), (0.93, '#c8ad98')):
        t.stamp(lambda d, X, Y: [rr(d, X, Y, x, y, w, h, 9) for x, y, w, h, v in stones if lo <= v < lo + 0.3 and (lo > 0.9 or v < 0.93)], col, 1.0, 0.6)
    t.stamp(lambda d, X, Y: [d.line([(X(x - w / 2 + 7), Y(y - h / 2 + 3)), (X(x + w / 2 - 9), Y(y - h / 2 + 3))], fill=255, width=3) for x, y, w, h, v in stones], '#f6f0e2', 0.6, 0.8)   # mép sáng
    t.stamp(lambda d, X, Y: [d.line([(X(x - w / 2 + 3), Y(y - h / 2 + 8)), (X(x - w / 2 + 3), Y(y + h / 2 - 10))], fill=255, width=3) for x, y, w, h, v in stones], '#f6f0e2', 0.45, 0.8)
    ck = []
    for x, y, w, h, v in stones:
        if (v * 97) % 1 < 0.22:
            px, py = x + (r.random() - 0.5) * w * 0.5, y - h * 0.3
            for j in range(4):
                nx, ny = px + (r.random() - 0.5) * 9, py + 5 + r.random() * 7
                ck.append((px, py, nx, ny)); px, py = nx, ny
    t.stamp(lambda d, X, Y: [d.line([(X(a), Y(b)), (X(e), Y(f))], fill=255, width=2) for a, b, e, f in ck], '#7a7266', 0.7)
    spk = [(r.random() * 512, r.random() * 512) for _ in range(500)]
    t.stamp(lambda d, X, Y: [d.point((X(x), Y(y)), fill=255) for x, y in spk[:250]], '#8f8676', 0.8)
    t.stamp(lambda d, X, Y: [d.point((X(x), Y(y)), fill=255) for x, y in spk[250:]], '#f6f0e2', 0.8)
    t.stamp(lambda d, X, Y: [rr(d, X, Y, x - w * 0.06, y - h * 0.08, w * 0.74, h * 0.7, 8) for x, y, w, h, v in stones], '#e6dfd0', 0.42, 2.5)   # mặt đá sáng
    t.patches('#9a8f7e', 200, 0.42, 0.75, 1, 0.5)
    t.patches('#efe8d8', 160, 0.5, 0.8, 2, 0.4)
    t.patches('#7f8f62', 60, 0.68, 0.8, 3, 0.35)                 # rêu khe đá
    tf = [((i + (0.5 if j % 2 else 0)) * cw + cw / 2 + (r.random() - 0.5) * 8, j * ch + ch / 2 + (r.random() - 0.5) * 20) for j in range(8) for i in range(11) if r.random() < 0.2]
    t.stamp(lambda d, X, Y: [d.line([(X(x + k * 2 - 3), Y(y)), (X(x + k * 2.6 - 4), Y(y - 6 - k % 2 * 3))], fill=255, width=2) for x, y in tf for k in range(4)], '#6f9a52', 0.9)   # cỏ mọc khe
    pet = [(r.random() * 512, r.random() * 512) for _ in range(34)]
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - 2), Y(y - 1.3), X(x + 2), Y(y + 1.3)], fill=255) for x, y in pet[:20]], '#ffc4d4', 0.9)       # cánh hoa rơi
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - 2.4), Y(y - 1.5), X(x + 2.4), Y(y + 1.5)], fill=255) for x, y in pet[20:]], '#b8a04a', 0.8)   # lá khô
    return back, mid, t.done(0.04), dict(sky='#74b1ea', sun='#fff4e2', light=1.5, fog=FOG)


# ============================================================
# HẦM MỘ
# ============================================================
def gothic(x, base, w, h, n=10):
    """Vòm nhọn gô-tích: chân thẳng + hai cung chụm đỉnh."""
    sh = h - w * 0.75
    L = [(x - w / 2, base), (x - w / 2, base - sh)]
    R = []
    for i in range(1, n + 1):
        t = i / n
        a = t * math.pi / 2.6
        px = w / 2 - w * (1 - math.cos(a)) * 0.5 / (1 - math.cos(math.pi / 2.6))
        py = sh + (h - sh) * math.sin(a) / math.sin(math.pi / 2.6)
        L.append((x - px, base - py)); R.append((x + px, base - py))
    return L + R[::-1] + [(x + w / 2, base - sh), (x + w / 2, base)]


def blue_flame(c, x, y, s=1.0, cols=('#2f6cff', '#7fd0ff', '#ffffff'), glow='#4f9cff', gr=120):
    c.glow(x, y - 8 * s, gr * s, glow, 0.55, 1.8)
    for k, col in zip((1.0, 0.62, 0.3), cols):
        c.wash(c.poly([(x - 8 * s * k, y), (x - 9 * s * k, y - 9 * s * k), (x - 3 * s * k, y - 20 * s * k), (x + 1 * s, y - 34 * s * k),
                       (x + 5 * s * k, y - 18 * s * k), (x + 9 * s * k, y - 8 * s * k), (x + 7 * s * k, y)], 0.8), col, grain=0)
    c.glow(x, y - 10 * s, 20 * s, '#ffffff', 0.7, 1.5)


def tombstone(c, x, base, w, h, kind, cols, rng):
    lit, dark = cols
    if kind == 0:      # bia đầu tròn
        sh = c.poly([(x - w / 2, base), (x - w / 2, base - h + w / 2)] + [(x + math.cos(a) * w / 2, base - h + w / 2 - math.sin(a) * w / 2) for a in np.linspace(math.pi, 0, 12)] + [(x + w / 2, base)])
    elif kind == 1:    # thánh giá
        a = w * 0.17
        sh = c.poly([(x - a, base), (x - a, base - h * 0.55), (x - w / 2, base - h * 0.55), (x - w / 2, base - h * 0.55 - 2 * a), (x - a, base - h * 0.55 - 2 * a), (x - a, base - h),
                     (x + a, base - h), (x + a, base - h * 0.55 - 2 * a), (x + w / 2, base - h * 0.55 - 2 * a), (x + w / 2, base - h * 0.55), (x + a, base - h * 0.55), (x + a, base)])
    else:              # bia nhọn
        sh = c.poly([(x - w / 2, base), (x - w * 0.42, base - h * 0.8), (x, base - h), (x + w * 0.42, base - h * 0.8), (x + w / 2, base)])
    c.wash(sh, lit, dark, grain=0.3, edge=0.9, side=0.9)
    c.wash(c.rect(x - w * 0.62, base - 7, x + w * 0.62, base + 4), mixh(lit, dark, 0.3), dark, grain=0.2, edge=0.6)
    if kind != 1:
        c.wash(c.lines([(x, base - h * 0.72, x, base - h * 0.42, 1.6), (x - w * 0.16, base - h * 0.62, x + w * 0.16, base - h * 0.62, 1.6)] +
                       [(x - w * 0.26, base - h * (0.3 - 0.08 * j), x + w * 0.26, base - h * (0.3 - 0.08 * j), 1.0) for j in range(2)]), dark, alpha=0.75)
    px, py = x + (rng.random() - 0.5) * w * 0.5, base - h * (0.85 if kind != 1 else 0.5)
    ck = []
    for j in range(4):
        nx, ny = px + (rng.random() - 0.5) * 8, py + 4 + rng.random() * 7
        ck.append((px, py, nx, ny, 0.9)); px, py = nx, ny
    c.wash(c.lines(ck), dark, alpha=0.8)                                                           # vết nứt
    c.wash(c.lines([(x - w * 0.5 + 1, base - h * 0.75, x - w * 0.5 + 1, base - 8, 1.0)], 0.4), '#bcd8ff', alpha=0.6 if kind != 1 else 0)   # viền sáng lạnh
    cs = [(x + (rng.random() - 0.5) * w, base - 2 + rng.random() * 4, 4 + rng.random() * 5) for _ in range(4)]
    c.relief(cs, ('#1f3a3a', '#2f5a50', '#4f8a6a'), squash=0.5)
    if rng.random() < 0.5:
        cl = [(x + w * 0.3 + (rng.random() - 0.5) * w * 0.4, base - rng.random() * h * 0.7, 3 + rng.random() * 3.5) for _ in range(8)]
        foliage(c, cl, ('#122628', '#1b3a3a', '#2a5a52', '#3f7a6c'), rng, grain=0.05)


def candles(c, x, base, n, rng, s=1.0):
    for i in range(n):
        cx = x + (i - n / 2) * 7 * s + rng.random() * 3; h = (10 + rng.random() * 16) * s
        c.wash(c.rect(cx - 2.2 * s, base - h, cx + 2.2 * s, base), '#f4e8c8', '#a89474', grain=0.1, side=0.5)
        c.wash(c.poly([(cx - 2 * s, base - h), (cx, base - h - 8 * s), (cx + 2 * s, base - h)], 0.4), '#ffe9a0')
        c.glow(cx, base - h - 4 * s, 26 * s, '#ffa040', 0.5, 1.8)
        c.glow(cx, base - h - 4 * s, 5 * s, '#fff6d0', 0.9, 1.3)


def crypt(ruins=False):
    FOG = '#262b3e'
    W, H = BACK
    sd = 40 if ruins else 0
    c = Cv(W, H, seed=8 + sd)
    rng = np.random.default_rng(14 + sd)
    c.grad([(0, '#3d4058'), (0.5, '#5a5d78'), (1, '#666a84')])
    # --- tường đá khối lớn: mỗi viên một sắc độ ---
    im = Image.new('L', (c.W, c.H), 128); d = ImageDraw.Draw(im)
    bh = 30 * SS
    for j in range(c.H // bh + 1):
        x = -int(rng.random() * 80) * SS
        while x < c.W:
            bw = int((52 + rng.random() * 50) * SS)
            d.rectangle([x, j * bh, x + bw, (j + 1) * bh], fill=int(104 + rng.random() * 48))
            d.line([x, j * bh, x, (j + 1) * bh], fill=58, width=3)
            x += bw
        d.line([0, j * bh, c.W, j * bh], fill=52, width=3)
        d.line([0, j * bh + 4, c.W, j * bh + 4], fill=168, width=2)
    tone = ndi.gaussian_filter(np.asarray(im, F) / 128, 1.2)
    c.rgb *= (tone * (0.88 + 0.24 * c.nz))[..., None]

    # diềm đá chạm chạy ngang trên đầu vòm
    c.wash(c.rect(0, 30, W, 56), '#9a9eba', '#5a5d78', grain=0.2, edge=0.5)
    c.wash(c.rect(0, 30, W, 33), '#c4c8e0', alpha=0.7); c.wash(c.rect(0, 53, W, 57, 0.8), '#1c1e2c', alpha=0.6)
    dm = [[(x, 43), (x + 9, 36), (x + 18, 43), (x + 9, 50)] for x in np.arange(6, W, 36)]
    c.wash(c.polys(dm), '#34364c', alpha=0.8)
    c.wash(c.polys([[(x + 5, 43), (x + 9, 39.5), (x + 13, 43), (x + 9, 46.5)] for x in np.arange(6, W, 36)]), '#b4b8d4', alpha=0.8)
    c.wash(c.ells([(x + 27, 43, 2.6, 2.6) for x in np.arange(6, W, 36)]), '#34364c', alpha=0.8)
    P = 512                                   # nhịp vòm
    lights = []
    stone = ('#8f93b0', '#34364c')
    for k in range(W // P):
        x = P // 2 + k * P
        big = (k == W // P // 2)
        w, h = (250, 270) if big else (190, 232)
        # khung vòm + hốc tối
        c.wash(c.poly(gothic(x, BG, w + 44, h + 30)), '#9a9eba', '#4a4d66', grain=0.2, edge=0.6, side=0.3)
        go, gi = gothic(x, BG, w + 44, h + 30, 14), gothic(x, BG, w + 16, h + 10, 14)
        vs = [(*go[i], *gi[i], 1.3) for i in range(2, len(go) - 2)]
        vs += [(x + sg * (w / 2 + 8), yy, x + sg * (w / 2 + 22), yy, 1.3) for sg in (-1, 1) for yy in np.arange(BG - 26, BG - h + w * 0.7, -30)]
        c.wash(c.lines(vs), '#2a2c40', alpha=0.6)                                                 # mạch đá nêm
        c.wash(c.poly([(x - 9, BG - h - 34), (x + 9, BG - h - 34), (x + 6, BG - h - 10), (x - 6, BG - h - 10)]), '#b4b8d4', '#5a5d78', edge=0.7, side=0.8)   # đá khoá đỉnh vòm
        c.wash(c.poly(gothic(x, BG, w + 16, h + 10)), '#3a3c52', '#2a2c40', grain=0.2)
        c.wash(c.poly(gothic(x, BG, w, h)), '#0d0f1c', '#1c1f32', grain=0.15)
        kind = 3 if big else (k + (2 if ruins else 0)) % 3
        if kind == 0:        # cửa sổ song sắt + ánh trăng
            wx, wy = x, BG - h * 0.42
            c.wash(c.poly(gothic(wx, wy, 60, 96)), '#9fd8ff', '#5f9fe0', grain=0.1)
            c.wash(c.lines([(wx + dx, wy - 96, wx + dx, wy, 2.4) for dx in (-15, 0, 15)] + [(wx - 30, wy - 30, wx + 30, wy - 30, 2.4)]), '#10121e')
            c.wash(c.ells([(wx + 8, wy - 70, 13, 13)], 0.6), '#f4fbff', alpha=0.9)                      # vầng trăng ngoài cửa sổ
            c.wash(c.ells([(wx + 4, wy - 73, 3, 2.4), (wx + 12, wy - 66, 2.2, 1.8)]), '#c4e4f8', alpha=0.7)
            c.wash(c.lines([(wx + dx, wy - 96, wx + dx, wy, 2.0) for dx in (-22.5, -7.5, 7.5, 22.5)] + [(wx - 30, wy - 60, wx + 30, wy - 60, 2.0)]), '#10121e', alpha=0.9)
            c.wash(c.rect(wx - 40, wy, wx + 40, wy + 9), '#a4a8c4', '#4a4d66', edge=0.6, side=0.5)       # bệ cửa sổ
            for kx in (-22, 20):
                vine(c, wx + kx, wy + 6, 26 + rng.random() * 30, rng, stem='#20363a', leaf=('#2a5a54', '#4a8a78'), sway=5)
            lights.append((wx, wy - 50, 330, '#7fc0ff', 1.3))
        elif kind == 1:      # tượng trùm áo choàng
            sx, sb = x, BG - 26
            c.wash(c.rect(sx - 44, sb, sx + 44, BG), '#7a7e9a', '#2e3046', grain=0.25, edge=0.6, side=0.6)
            c.wash(c.rect(sx - 50, sb - 6, sx + 50, sb + 2), '#a4a8c4', '#4a4d66', edge=0.6)
            fig = [(sx - 34, sb - 6), (sx - 30, sb - 70), (sx - 22, sb - 112), (sx - 16, sb - 134), (sx - 8, sb - 150), (sx, sb - 156), (sx + 8, sb - 150),
                   (sx + 16, sb - 134), (sx + 22, sb - 112), (sx + 30, sb - 70), (sx + 34, sb - 6)]
            c.wash(c.poly(fig), '#8a8eac', '#2a2c42', grain=0.25, edge=0.9, side=1.1)
            c.wash(c.ells([(sx, sb - 132, 7, 10)]), '#0c0d18')                                    # mặt trong mũ trùm
            c.wash(c.poly([(sx - 3, sb - 112), (sx + 3, sb - 112), (sx + 2.5, sb - 30), (sx - 2.5, sb - 30)]), '#b4b8d4', '#5a5e7a')   # kiếm chống
            c.wash(c.rect(sx - 12, sb - 104, sx + 12, sb - 99), '#b4b8d4')
            c.wash(c.lines([(sx + dx, sb - 96 + abs(dx) * 0.8, sx + dx * 1.35, sb - 8, 1.2) for dx in (-18, -11, 10, 17, 23)], 0.5), '#1c1e30', alpha=0.6)     # nếp áo
            c.wash(c.ells([(sx - 5, sb - 106, 5, 4), (sx + 5, sb - 106, 5, 4)]), '#a4a8c4', '#5a5e7a')                                                        # bàn tay
            c.wash(c.lines([(sx - 30, sb + 8 + j * 5, sx + 30 - j * 14, sb + 8 + j * 5, 1.0) for j in range(3)]), '#1c1e30', alpha=0.7)                        # chữ khắc bệ
            candles(c, sx - 62, BG - 2, 3, rng); candles(c, sx + 66, BG - 2, 2, rng)
            c.dots([(sx + 44 + k * 4, BG - 6 - (k % 2) * 3) for k in range(4)], '#d8e0ff', 1.6)
        elif kind == 2:      # hộc quan tài nhiều tầng
            for j in range(3):
                yy = BG - 34 - j * 44
                c.wash(c.rect(x - w / 2 + 14, yy - 30, x + w / 2 - 14, yy), '#06070f', '#12141f')
                c.wash(c.rect(x - w / 2 + 8, yy, x + w / 2 - 8, yy + 8), '#8a8eac', '#3a3c54', edge=0.5)
                if j < 3:
                    c.wash(c.poly([(x - 50 + j * 8, yy), (x - 44 + j * 8, yy - 20), (x + 30, yy - 22), (x + 44, yy)]), '#5a5e78', '#26283a', grain=0.3, edge=0.7)
                    c.relief([(x + 56, yy - 7, 7)], ('#6a6e86', '#a4a8bc', '#dcdfe8'))            # sọ
                    c.dots([(x + 54, yy - 7), (x + 59, yy - 7)], '#10121c', 1.5)
                    c.wash(c.lines([(x - 10, yy - 18, x - 10, yy - 6, 1.4), (x - 15, yy - 14, x - 5, yy - 14, 1.4)]), '#8a8eac', alpha=0.8)       # thánh giá trên nắp
                    ux = x - 70
                    c.wash(c.poly([(ux - 5, yy), (ux - 8, yy - 9), (ux - 4, yy - 17), (ux - 5, yy - 21), (ux + 5, yy - 21), (ux + 4, yy - 17), (ux + 8, yy - 9), (ux + 5, yy)]), '#8a7a9a', '#3a3046', grain=0.2, edge=0.7, side=0.9)   # bình tro
        else:                # cổng lớn giữa: cửa đá khắc ấn phát sáng
            c.wash(c.poly(gothic(x, BG, 150, 210)), '#4a4d68', '#20222f', grain=0.25, edge=0.8)
            c.wash(c.lines([(x, BG - 200, x, BG, 2.5)]), '#0a0b14')
            for yy in (BG - 40, BG - 172):
                c.wash(c.rect(x - 68, yy - 5, x + 68, yy + 5), '#2a2c3c', '#14151e', edge=0.5)
                c.dots([(x + dx, yy) for dx in range(-60, 61, 15)], '#8a8eac', 1.6)
            for sg in (-1, 1):
                c.wash(c.ells([(x + sg * 16, BG - 96, 6, 6)]), '#8a8eac', alpha=0.9); c.wash(c.ells([(x + sg * 16, BG - 96, 3.5, 3.5)]), '#20222f')
            c.wash(c.rect(x - 140, BG - 8, x + 140, BG + 4), '#9498b4', '#3a3c54', grain=0.2, edge=0.6)
            c.wash(c.rect(x - 110, BG - 15, x + 110, BG - 7), '#a8acc8', '#4a4d66', grain=0.2, edge=0.6)
            ry = BG - 120
            for rr_, wd in ((44, 3.0), (30, 2.0)):
                pts = [(x + math.cos(a) * rr_, ry + math.sin(a) * rr_) for a in np.linspace(0, 2 * math.pi, 40)]
                c.wash(c.lines([(*pts[j], *pts[j + 1], wd) for j in range(39)], 0.6), '#9fe8ff')
            ticks = [(x + math.cos(a) * 34, ry + math.sin(a) * 34, x + math.cos(a) * 40, ry + math.sin(a) * 40, 2.0) for a in np.linspace(0, 2 * math.pi, 13)[:-1]]
            c.wash(c.lines(ticks, 0.5), '#c8f4ff')
            moon = c.ells([(x, ry, 20, 20)], 0.5)
            cut = c.ells([(x + 9, ry - 4, 17, 17)], 0.5)
            mm = moon[2].copy(); oy, ox = cut[0] - moon[0], cut[1] - moon[1]
            sub = mm[max(0, oy):oy + cut[2].shape[0], max(0, ox):ox + cut[2].shape[1]]
            sub *= 1 - cut[2][max(0, -oy):max(0, -oy) + sub.shape[0], max(0, -ox):max(0, -ox) + sub.shape[1]]
            c.wash((moon[0], moon[1], mm), '#e4faff', grain=0)                                    # trăng khuyết
            lights.append((x, ry, 300, '#5fd0ff', 1.2))
        # mạng nhện góc vòm
        if k % 2 == 0:
            ox, oy = x - w / 2 + 2, BG - h + w * 0.72
            segs = [(ox, oy, ox + math.cos(a) * 46, oy + math.sin(a) * 46, 0.7) for a in np.linspace(-1.3, 0.3, 6)]
            for q in (16, 30, 44):
                pp = [(ox + math.cos(a) * q, oy + math.sin(a) * q) for a in np.linspace(-1.3, 0.3, 6)]
                segs += [(*pp[j], *pp[j + 1], 0.6) for j in range(5)]
            c.wash(c.lines(segs), '#c8d0e8', alpha=0.4)
    # --- trụ giữa các vòm + gân vòm ---
    for k in range(W // P + 1):
        x = k * P
        segs = []
        for sg in (-1, 1):
            pts = [(x + sg * (26 + 230 * t), 100 - 100 * math.sin(t * math.pi / 2) ** 0.8) for t in np.linspace(0, 1, 12)]
            segs += [(*pts[j], *pts[j + 1], 13) for j in range(11)]
        c.wash(c.lines(segs), '#7a7e9c', '#565a76', grain=0.2, edge=0.5)
        c.wash(c.rect(x - 34, 60, x + 34, BG + 4), stone[0], mixh(stone[0], stone[1], 0.5), grain=0.22, edge=0.5, side=1.0)
        c.wash(c.lines([(x + dx, 96, x + dx, BG - 30, 2.0) for dx in (-17, 0, 17)], 1.0), stone[1], alpha=0.45)     # rãnh trụ
        for yy, ww in ((84, 50), (BG - 22, 48)):
            c.wash(c.rect(x - ww, yy - 12, x + ww, yy + 12), '#a8acc8', '#4a4d66', grain=0.2, edge=0.7, side=0.8)
        c.wash(c.rect(x - 56, BG - 10, x + 56, BG + 6), '#9498b4', '#3a3c54', grain=0.2, edge=0.6, side=0.8)
        c.wash(c.ells([(x - 44, 84, 9, 9), (x + 44, 84, 9, 9)]), '#c4c8e0', '#6a6e8c', edge=0.8)                      # cuộn đầu trụ
        c.wash(c.ells([(x - 44, 84, 4, 4), (x + 44, 84, 4, 4)]), '#3a3c54')
        c.wash(c.lines([(x - 40, 92, x + 40, 92, 1.4), (x - 46, BG - 30, x + 46, BG - 30, 1.4)]), '#2a2c40', alpha=0.7)
        c.wash(c.rect(x - 37, 262, x + 37, 270), '#a8acc8', '#4a4d66', edge=0.6, side=0.8)                            # vòng đai
        sh = [(x - 17, 122), (x + 17, 122), (x + 17, 146), (x, 164), (x - 17, 146)]
        c.wash(c.poly(sh), '#b4b8d4', '#5a5e7a', grain=0.2, edge=0.9, side=0.8)                                       # huy hiệu khiên
        c.wash(c.lines([(x, 127, x, 157, 2.0), (x - 11, 137, x + 11, 137, 2.0)]), '#34364c', alpha=0.85)
        lights.append((x, 196, 250, '#4f8cff', 1.25))
    # vết nứt + dây xích
    for _ in range(60):
        x, y = rng.random() * W, 20 + rng.random() * 280
        segs = []
        for j in range(5):
            nx, ny = x + (rng.random() - 0.5) * 16, y + 6 + rng.random() * 12
            segs.append((x, y, nx, ny, 1.0)); x, y = nx, ny
        c.wash(c.lines(segs), '#0e0f1a', alpha=0.55)
    for xch in np.arange(130, W, 256):
        if rng.random() < 0.45:
            L = 50 + rng.random() * 90
            c.wash(c.ells([(xch, y, 2.6, 4.2) for y in np.arange(0, L, 7)]), '#8a8ea8', alpha=0.9)
            c.wash(c.ells([(xch, L + 6, 7, 7)]), '#6a6e88')
    for _ in range(46):                                               # vệt nước thấm
        x, y, L = rng.random() * W, 56 + rng.random() * 120, 50 + rng.random() * 120
        c.wash(c.poly([(x - 5, y), (x + 5, y), (x + 2 + rng.random() * 4, y + L), (x - 2, y + L)], 2.5), '#0e1220', alpha=0.34)
    MOSS = ('#122628', '#1b3a3a', '#2a5a52', '#3f7a6c')
    for _ in range(44):                                               # rêu bám chân tường
        x = rng.random() * W; y = BG - 3 - rng.random() ** 2.5 * 90
        if abs(x - W / 2) < 90:
            continue
        cl = [(x + (rng.random() - 0.5) * 40, y + (rng.random() - 0.5) * 5, 2.5 + rng.random() * 3.5) for _ in range(7)]
        foliage(c, cl, MOSS, rng, grain=0.05)
    for _ in range(140 if ruins else 44):                             # rễ cây thòng từ trần
        vine(c, rng.random() * W, 0, 20 + rng.random() * 60, rng, stem='#20363a', leaf=('#24504a', '#3f8068'), sway=7)
    for k in range(W // P + 1):                                       # bia tưởng niệm / giá nến gắn tường
        for sg in (-1, 1):
            px = k * P + sg * 92
            if (k + (sg > 0)) % 2:
                c.wash(c.rect(px - 22, 150, px + 22, 206), '#a4a8c4', '#4a4d66', grain=0.2, edge=0.8, side=0.5)
                c.wash(c.rect(px - 18, 154, px + 18, 202), '#6a6e8c', '#3a3c54', grain=0.2)
                c.wash(c.lines([(px - 13, 162 + j * 7, px + 13 - (j % 3) * 6, 162 + j * 7, 1.0) for j in range(5)]), '#c4c8e0', alpha=0.6)
                c.wash(c.ells([(px, 150, 7, 5)]), '#b4b8d4', '#5a5e7a', edge=0.8)
            else:
                c.wash(c.rect(px - 20, 196, px + 20, 201), '#a4a8c4', '#3a3c54', edge=0.6)
                c.wash(c.poly([(px - 14, 201), (px + 14, 201), (px, 214)]), '#5a5e7a', '#2a2c40')
                candles(c, px, 196, 3, rng)
    # --- chiếu sáng: nền tối + đèn lửa xanh + trăng ---
    c.lightmap(lights, '#6e7290')
    for k in range(W // P + 1):
        x = k * P
        c.wash(c.poly([(x - 16, 214), (x + 16, 214), (x + 10, 228), (x - 10, 228)]), '#3a3a48', '#15161f', edge=0.5)
        c.wash(c.lines([(x, 228, x, 244, 3)]), '#22232e')
        blue_flame(c, x, 214, 1.15)
    for k in range(W // P):                                           # vệt trăng rọi xuống sàn
        if k % 3 == 0 and k != W // P // 2:
            x = P // 2 + k * P
            c.ray(x, x + 150, 56, 210, '#a8dcff', 0.30, BG - 190, BG + 10, blur=6)
        if k % 3 == 2:
            candles(c, P // 2 + k * P - 70, BG - 2, 4, rng)
    for i in range(18):                                               # dơi
        bx, by_, q = rng.random() * W, 62 + rng.random() * 90, 6 + rng.random() * 5
        c.wash(c.poly([(bx, by_ - q * 0.35), (bx - q * 0.5, by_ - q * 0.9), (bx - q * 1.6, by_ - q * 0.5), (bx - q * 1.1, by_), (bx - q * 0.6, by_ - q * 0.15), (bx, by_ + q * 0.45),
                       (bx + q * 0.6, by_ - q * 0.15), (bx + q * 1.1, by_), (bx + q * 1.6, by_ - q * 0.5), (bx + q * 0.5, by_ - q * 0.9)], 0.3), '#0a0b14', alpha=0.85)
    c.band(BG - 60, H + 30, '#7fa8d0', 0.30, wavy=0.9)                # sương sàn
    c.haze(BG - 14, H - 4, FOG, 0.9, wavy=0.2)
    for _ in range(160):                                              # bụi sáng / đom ma
        c.glow(rng.random() * W, 40 + rng.random() * 290, 2 + rng.random() * 3, '#9fd8ff', 0.5, 1.5)
    back = c.finish(grain=0.05)

    # ================= lớp gần =================
    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=4 + sd)
    rng = np.random.default_rng(23 + sd)
    ST = ('#9ea4c4', '#2a2c42')
    by = MG + 8
    for a, b in ((560, 1120), (1640, 2260), (2980, 3560)):            # hàng rào sắt mũi giáo (sau bia mộ)
        bars = [(x, by - 62 - (8 if i % 4 == 0 else 0), x, by + 4, 2.2) for i, x in enumerate(np.arange(a, b + 1, 14))]
        m.wash(m.lines(bars + [(a, by - 50, b, by - 50, 2.6), (a, by - 12, b, by - 12, 2.6)]), '#2c2e40', '#14151e', grain=0.1)
        m.wash(m.polys([[(x - 3.2, y0 + 1), (x, y0 - 9), (x + 3.2, y0 + 1)] for x, y0, *_ in bars]), '#4a4e68')
        m.wash(m.lines([(x - 1, y0, x - 1, y1, 0.7) for x, y0, _, y1, _ in bars]), '#7f9ad0', alpha=0.55)               # viền sáng lạnh
        for px in (a, b):
            m.wash(m.rect(px - 9, by - 84, px + 9, by + 6), '#9ea4c4', '#2a2c42', grain=0.3, edge=0.8, side=1.0)
            m.wash(m.poly([(px - 12, by - 84), (px, by - 100), (px + 12, by - 84)]), '#b4bad6', '#5a5e7a', edge=0.8)
    xs = np.arange(90, W2, 150)
    for i, x in enumerate(xs):
        x = x + (rng.random() - 0.5) * 70
        q = rng.random()
        if q < 0.50:
            tombstone(m, x, by, 34 + rng.random() * 16, 52 + rng.random() * 36, int(rng.random() * 3), ST, rng)
        elif q < 0.64:   # cột gãy
            hh = 60 + rng.random() * 70
            m.wash(m.poly([(x - 20, by), (x - 20, by - hh), (x - 8, by - hh - 10), (x + 4, by - hh + 4), (x + 14, by - hh - 6), (x + 20, by - hh + 8), (x + 20, by)]), ST[0], ST[1], grain=0.3, edge=0.8, side=1.0)
            m.wash(m.lines([(x + dx, by - hh + 14, x + dx, by - 12, 1.8) for dx in (-10, 0, 10)], 0.8), ST[1], alpha=0.5)
            m.wash(m.rect(x - 28, by - 12, x + 28, by + 4), '#aeb4d0', '#3a3c54', grain=0.2, edge=0.7, side=0.8)
        elif q < 0.80:   # quan tài đá
            m.wash(m.rect(x - 62, by - 34, x + 62, by + 4), '#8d93b2', ST[1], grain=0.3, edge=0.7, side=0.6)
            m.wash(m.poly([(x - 68, by - 34), (x - 56, by - 48), (x + 56, by - 48), (x + 68, by - 34)]), '#b4bad6', '#6a6e8c', grain=0.25, edge=0.7)
            m.wash(m.lines([(x, by - 28, x, by - 4, 2.2), (x - 9, by - 20, x + 9, by - 20, 2.2)]), ST[1], alpha=0.7)
            for dx in (-40, 40):
                m.wash(m.rect(dx + x - 9, by - 28, dx + x + 9, by - 4), ST[1], alpha=0.3)
            if rng.random() < 0.7:
                candles(m, x + (rng.random() - 0.5) * 60, by - 48, 3, rng)
        else:            # đống sọ + nến
            cs = [(x + (j - 2.5) * 11 + rng.random() * 4, by - 6 - (j % 2) * 9 - rng.random() * 3, 7) for j in range(6)]
            m.relief(cs, ('#4a4e68', '#8a8ea8', '#c8ccdc', '#f0f2f8'), grain=0.1)
            m.dots([(px - 2.5, py) for px, py, _ in cs] + [(px + 2.5, py) for px, py, _ in cs], '#14151f', 1.5)
            candles(m, x + 44, by + 2, 4, rng)
    # chân nến sắt cao (lửa xanh)
    for x in (400, 1380, 2716, 3690):
        m.wash(m.rect(x - 2.5, by - 150, x + 2.5, by), '#4a4c5e', '#1a1b24', side=0.8)
        m.wash(m.poly([(x - 16, by + 4), (x - 3, by - 16), (x + 3, by - 16), (x + 16, by + 4)]), '#4a4c5e', '#1a1b24')
        m.wash(m.lines([(x - 30, by - 136, x + 30, by - 136, 2.5), (x - 30, by - 136, x - 30, by - 146, 2.5), (x + 30, by - 136, x + 30, by - 146, 2.5)]), '#3a3c4c')
        for dx in (-30, 0, 30):
            blue_flame(m, x + dx, by - 148 - (6 if dx == 0 else 0), 0.55, gr=70)
    for i in range(16):                                               # bình gốm, xương rải
        x = rng.random() * W2
        if i % 2:
            sc = 0.9 + rng.random() * 0.5
            m.wash(m.poly([(x - 6 * sc, by + 4), (x - 11 * sc, by - 10 * sc), (x - 6 * sc, by - 24 * sc), (x - 7 * sc, by - 30 * sc), (x + 7 * sc, by - 30 * sc), (x + 6 * sc, by - 24 * sc), (x + 11 * sc, by - 10 * sc), (x + 6 * sc, by + 4)]),
                   '#9a86aa', '#34283e', grain=0.25, edge=0.8, side=1.0)
            m.wash(m.lines([(x - 9 * sc, by - 14 * sc, x + 9 * sc, by - 14 * sc, 1.4)]), '#d8c8a0', alpha=0.7)
        else:
            for k in range(3):
                a = rng.random() * 3.14; px = x + k * 12
                m.wash(m.lines([(px - math.cos(a) * 9, by + 2 - abs(math.sin(a)) * 5, px + math.cos(a) * 9, by + 2, 2.4)]), '#d4d8e6', '#8a8ea8')
                m.dots([(px - math.cos(a) * 9, by + 2 - abs(math.sin(a)) * 5), (px + math.cos(a) * 9, by + 2)], '#e4e8f2', 2.2)
    # gạch vụn
    for i in range(60):
        x = rng.random() * W2
        rock(m, x, by + 4, 14 + rng.random() * 22, 7 + rng.random() * 9, cols=('#2a2c40', '#55597a', '#868aaa', '#b4b8d0'), seed=900 + i)
    m.band(MG - 34, H2 + 10, '#8fb4dc', 0.42, wavy=1.0)               # sương sàn lững lờ
    for _ in range(50):
        x, y = rng.random() * W2, 30 + rng.random() * (MG - 40)
        m.glow(x, y, 6, '#8fd0ff', 0.5, 2.0); m.glow(x, y, 2, '#ffffff', 0.8, 1.2)
    mid = m.finish(grain=0.05)

    # ================= đất: phiến đá lớn =================
    t = Tile('#262836', seed=59)
    r = t.rng
    slabs = []
    cw, ch = 512 / 4, 512 / 3
    for j in range(3):
        for i in range(4):
            slabs.append(((i + (0.5 if j % 2 else 0)) * cw, j * ch, cw - 5, ch - 6, r.random()))
    for lo, col in ((0.0, '#5a5e72'), (0.25, '#666a80'), (0.5, '#70748a'), (0.75, '#5f6278')):
        t.stamp(lambda d, X, Y: [d.rounded_rectangle([X(x - w / 2), Y(y - h / 2), X(x + w / 2), Y(y + h / 2)], radius=5 * SS, fill=255) for x, y, w, h, v in slabs if lo <= v < lo + 0.25], col, 1.0, 0.7)
    t.stamp(lambda d, X, Y: [d.rounded_rectangle([X(x - w * 0.42), Y(y - h * 0.44), X(x + w * 0.36), Y(y + h * 0.3)], radius=12 * SS, fill=255) for x, y, w, h, v in slabs], '#8085a0', 0.35, 6)
    t.stamp(lambda d, X, Y: [d.line([(X(x - w / 2 + 6), Y(y - h / 2 + 3)), (X(x + w / 2 - 8), Y(y - h / 2 + 3))], fill=255, width=3) for x, y, w, h, v in slabs], '#a4aac8', 0.55, 0.8)    # mép vát sáng
    t.stamp(lambda d, X, Y: [d.line([(X(x - w / 2 + 3), Y(y - h / 2 + 6)), (X(x - w / 2 + 3), Y(y + h / 2 - 8))], fill=255, width=3) for x, y, w, h, v in slabs], '#a4aac8', 0.4, 0.8)
    t.stamp(lambda d, X, Y: [d.line([(X(x - w / 2 + 6), Y(y + h / 2 - 3)), (X(x + w / 2 - 4), Y(y + h / 2 - 3))], fill=255, width=3) for x, y, w, h, v in slabs], '#14151e', 0.5, 0.8)
    sx_, sy_, sw_, sh_, _ = slabs[5]
    def rune(d, X, Y):
        for rr_ in (38, 30):
            d.ellipse([X(sx_ - rr_), Y(sy_ - rr_ * 1.25), X(sx_ + rr_), Y(sy_ + rr_ * 1.25)], outline=255, width=3)
        for a in np.linspace(0, 6.283, 9)[:-1]:
            d.line([(X(sx_ + math.cos(a) * 12), Y(sy_ + math.sin(a) * 15)), (X(sx_ + math.cos(a) * 26), Y(sy_ + math.sin(a) * 32))], fill=255, width=3)
    t.stamp(rune, '#6fb0d8', 0.45, 0.6)                                                             # ấn khắc mờ trên một phiến
    t.patches('#3c3f52', 150, 0.45, 0.75, 1, 0.55)
    t.patches('#9fb8e0', 110, 0.72, 0.8, 7, 0.3)                    # vũng nước đọng
    deb = [(r.random() * 512, r.random() * 512, 1 + r.random() * 2.4) for _ in range(120)]
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - q), Y(y - q * 0.8), X(x + q), Y(y + q * 0.8)], fill=255) for x, y, q in deb[:70]], '#22232e', 0.8)
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - q), Y(y - q * 0.8), X(x + q), Y(y + q * 0.8)], fill=255) for x, y, q in deb[70:]], '#9aa0be', 0.7)
    t.patches('#8f96b4', 90, 0.6, 0.82, 2, 0.3)
    t.patches('#3f6a66', 70, 0.7, 0.82, 3, 0.4)                    # rêu ẩm
    cracks = []
    for _ in range(14):
        x, y = r.random() * 512, r.random() * 512
        for j in range(6):
            nx, ny = x + (r.random() - 0.5) * 26, y + (r.random() - 0.3) * 22
            cracks.append((x, y, nx, ny)); x, y = nx, ny
    t.stamp(lambda d, X, Y: [d.line([(X(a), Y(b)), (X(e), Y(f))], fill=255, width=2) for a, b, e, f in cracks], '#1a1c28', 0.8)
    return back, mid, t.done(0.06), dict(sky='#0b0d18', sun='#bcc8ff', light=0.9, fog=FOG)


SCENES = {'forest': forest, 'castle': castle, 'crypt': crypt}


def all_scenes():
    import bg_nature, bg_town, bg_inner
    return {**SCENES, **bg_nature.SCENES, **bg_town.SCENES, **bg_inner.SCENES}


def main(names, out=OUT):
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    meta_path = out / 'battle_bg.json'
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
    scenes = all_scenes()
    for name in names or list(scenes):
        back, mid, ground, info = scenes[name]()
        back.save(out / f'{name}_back.webp', 'WEBP', quality=90, method=6)
        mid.save(out / f'{name}_mid.webp', 'WEBP', quality=92, method=6)
        ground.save(out / f'{name}_ground.webp', 'WEBP', quality=90, method=6)
        meta[name] = info
        print('ve xong', name)
    meta_path.write_text(json.dumps(meta, indent=1, ensure_ascii=False))


if __name__ == '__main__':
    args = sys.argv[1:]
    out = OUT
    if '--out' in args:
        i = args.index('--out'); out = args[i + 1]; del args[i:i + 2]
    main(args, out)
