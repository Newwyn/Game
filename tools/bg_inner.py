# ============================================================
# CẢNH TRONG NHÀ & ĐÊM: đại điện · thư viện · hầm mỏ · mỏ sâu · đỉnh tháp · đền trăng · phế tích
# ============================================================
from bgparts import *
from bg_nature import shroom

P = 512


def block_wall(c, rng, bh=30, bw=(52, 102), lo=104, hi=152, mortar=56, edge=168):
    """Tường đá khối: mỗi viên một sắc độ + mạch tối + mép trên bắt sáng."""
    im = Image.new('L', (c.W, c.H), 128); d = ImageDraw.Draw(im)
    b = bh * SS
    for j in range(c.H // b + 1):
        x = -int(rng.random() * 80) * SS
        while x < c.W:
            w = int((bw[0] + rng.random() * (bw[1] - bw[0])) * SS)
            d.rectangle([x, j * b, x + w, (j + 1) * b], fill=int(lo + rng.random() * (hi - lo)))
            d.line([x, j * b, x, (j + 1) * b], fill=mortar, width=3)
            x += w
        d.line([0, j * b, c.W, j * b], fill=mortar - 4, width=3)
        d.line([0, j * b + 4, c.W, j * b + 4], fill=edge, width=2)
    tone = ndi.gaussian_filter(np.asarray(im, F) / 128, 1.2)
    c.rgb *= (tone * (0.88 + 0.24 * c.nz))[..., None]


def stained_glass(c, x, base, w, h, rng, pal, cell=13, lead='#2a1c20'):
    y0, x0, m = c.poly(gothic(x, base, w, h))
    hh, ww = m.shape
    cs = cell * SS
    gy, gx = hh // cs + 2, ww // cs + 2
    idx = rng.integers(0, len(pal), (gy, gx))
    # hoa văn đối xứng trái-phải + dải viền
    idx = np.where(np.arange(gx)[None, :] < gx // 2, idx, idx[:, ::-1])
    cols = np.array([hx(p) for p in pal], F)[idx]
    big = np.repeat(np.repeat(cols, cs, 0), cs, 1)[:hh, :ww]
    big = big * (0.8 + 0.4 * c.noise_at(y0, x0, m.shape))[..., None]
    c.over(y0, x0, m, np.clip(big, 0, 1))
    segs = [(x - w / 2 + k * cell, base - h, x - w / 2 + k * cell, base, 1.0) for k in range(int(w / cell) + 1)] + [(x - w / 2, base - k * cell, x + w / 2, base - k * cell, 1.0) for k in range(int(h / cell) + 1)]
    yy, xx, lm = c.lines(segs)
    oy, ox = y0 - yy, x0 - xx
    sub = lm[max(0, oy):max(0, oy) + hh, max(0, ox):max(0, ox) + ww]
    mm = m[:sub.shape[0], :sub.shape[1]] * sub
    c.over(y0, x0, mm * 0.8, lead)
    cy = base - h * 0.62
    for r_, wd in ((w * 0.3, 2.4), (w * 0.17, 1.8)):                         # hoa hồng kính
        pts = [(x + math.cos(a) * r_, cy + math.sin(a) * r_) for a in np.linspace(0, 6.283, 30)]
        c.wash(c.lines([(*pts[i], *pts[i + 1], wd) for i in range(29)]), lead)
    c.wash(c.lines([(x + math.cos(a) * w * 0.17, cy + math.sin(a) * w * 0.17, x + math.cos(a) * w * 0.3, cy + math.sin(a) * w * 0.3, 1.6) for a in np.linspace(0, 6.283, 9)[:-1]]), lead)
    c.wash(c.ells([(x, cy, w * 0.1, w * 0.1)]), '#fff6d0', '#ffd27a')
    c.wash(c.lines([(x, base - h * 0.4, x, base, 2.4)]), lead)


def chandelier(c, x, y, s=1.0, n=7, col='#e0ad46'):
    c.wash(c.lines([(x, 0, x, y - 10 * s, 1.6)]), '#3a2c22')
    c.wash(c.ells([(x, y, 58 * s, 9 * s)]), col, mixh(col, '#5a3a10', 0.5), edge=0.6)
    c.wash(c.ells([(x, y - 2 * s, 46 * s, 5 * s)]), '#3a2814')
    c.wash(c.poly([(x - 10 * s, y - 12 * s), (x + 10 * s, y - 12 * s), (x + 4 * s, y + 16 * s), (x - 4 * s, y + 16 * s)]), col, mixh(col, '#5a3a10', 0.5), side=0.8)
    c.dots([(x, y + 20 * s)], '#fff0b0', 3.5 * s)
    for k in range(n):
        cx_ = x + (k - (n - 1) / 2) * 17 * s
        cy_ = y - 8 * s - (1 - abs(k - (n - 1) / 2) / n * 2) * 3 * s
        c.wash(c.rect(cx_ - 2 * s, cy_ - 13 * s, cx_ + 2 * s, cy_), '#f6ecd0', '#b8a880')
        c.wash(c.poly([(cx_ - 2.2 * s, cy_ - 13 * s), (cx_, cy_ - 22 * s), (cx_ + 2.2 * s, cy_ - 13 * s)], 0.4), '#ffe9a0')
        c.glow(cx_, cy_ - 17 * s, 12 * s, '#fff0c0', 0.8, 1.4)
    c.glow(x, y - 10 * s, 150 * s, '#ffb86a', 0.3, 1.8)


# ============================================================
# ĐẠI ĐIỆN (phòng ngai vàng)
# ============================================================
def hall():
    FOG = '#6a5648'
    W, H = BACK
    c = Cv(W, H, seed=201)
    rng = np.random.default_rng(301)
    c.grad([(0, '#7a6a66'), (0.5, '#a8927a'), (1, '#b49c80')])
    block_wall(c, rng)
    cx = W // 2
    lights = []
    GOLD = ('#f0c860', '#8a5a1a')
    # diềm vàng + phào trần
    c.wash(c.rect(0, 28, W, 58), GOLD[0], GOLD[1], grain=0.15, edge=0.5)
    c.wash(c.polys([[(x, 43), (x + 9, 35), (x + 18, 43), (x + 9, 51)] for x in np.arange(6, W, 36)]), '#7a2430', alpha=0.9)
    c.wash(c.ells([(x + 27, 43, 3, 3) for x in np.arange(6, W, 36)]), '#fff0b0')
    c.wash(c.rect(0, 0, W, 28), '#4a3a40', '#6a5650', grain=0.2)
    # cửa kính màu + rèm + cờ
    PAL = [('#2f52a0', '#4f7ad0', '#86aaea', '#c8372f', '#f2d070', '#3a8a6a', '#7a4a9a'), ('#c8372f', '#e8785a', '#f2d070', '#2f52a0', '#86aaea', '#7a4a9a', '#3a8a6a')]
    for k in range(W // P):
        x = P // 2 + k * P
        if abs(x - cx) < 300:
            continue
        w, h = 150, 250
        go, gi = gothic(x, BG - 30, w + 40, h + 28, 14), gothic(x, BG - 30, w, h, 14)
        c.wash(c.poly(go), '#e8dcc4', '#8a7a66', grain=0.2, edge=0.6, side=0.3)
        c.wash(c.lines([(*go[i], *gi[i], 1.3) for i in range(1, len(go) - 1)]), '#5a4a40', alpha=0.6)
        stained_glass(c, x, BG - 30, w, h, rng, PAL[k % 2])
        c.wash(c.rect(x - w / 2 - 26, BG - 30, x + w / 2 + 26, BG - 20), '#f0e4cc', '#8a7a66', edge=0.6, side=0.5)
        lights.append((x, BG - 170, 340, '#ffe8c0', 0.9))
    # trụ ốp + cờ + đuốc
    for k in range(W // P + 1):
        x = k * P
        if abs(x - cx) < 200:
            continue
        pillar(c, x, 58, BG + 4, 62, cols=('#f0e4cc', '#7a6a58'), flutes=3, cap=1.6)
        col = '#2f52a0' if k % 2 else '#8d2430'
        banner(c, x, 106, 40, 120, col)
        lights.append((x, 250, 220, '#ffb060', 1.0))
    # bệ ngai: rèm đỏ, bậc thềm, ngai vàng, huy hiệu
    c.wash(c.poly([(cx - 300, 58), (cx + 300, 58), (cx + 250, BG - 20), (cx - 250, BG - 20)]), '#a02a36', '#5a141e', grain=0.2, edge=0.4)
    c.wash(c.lines([(cx + dx, 60, cx + dx * 0.84, BG - 22, 5) for dx in range(-280, 281, 40)], 2.0), '#4a0e18', alpha=0.4)      # nếp rèm
    c.wash(c.lines([(cx + dx + 14, 60, cx + (dx + 14) * 0.84, BG - 22, 4) for dx in range(-280, 261, 40)], 2.0), '#d84a56', alpha=0.3)
    for sg in (-1, 1):
        c.wash(c.poly([(cx + sg * 300, 58), (cx + sg * 200, 58), (cx + sg * 250, 160), (cx + sg * 300, 230), (cx + sg * 318, 120)]), '#b83440', '#6a1a24', grain=0.2, edge=0.6)
        c.wash(c.ells([(cx + sg * 286, 226, 9, 9)]), GOLD[0], GOLD[1])
    c.wash(c.rect(cx - 310, 54, cx + 310, 66), GOLD[0], GOLD[1], edge=0.5)
    c.wash(c.polys([[(x, 66), (x + 10, 80), (x + 20, 66)] for x in np.arange(cx - 300, cx + 290, 20)]), GOLD[0], GOLD[1])
    cy0 = 120                                                              # huy hiệu vương quốc
    c.wash(c.poly([(cx - 44, cy0 - 40), (cx + 44, cy0 - 40), (cx + 44, cy0 + 10), (cx, cy0 + 50), (cx - 44, cy0 + 10)]), GOLD[0], GOLD[1], edge=0.7)
    c.wash(c.poly([(cx - 36, cy0 - 33), (cx + 36, cy0 - 33), (cx + 36, cy0 + 6), (cx, cy0 + 40), (cx - 36, cy0 + 6)]), '#2f52a0', '#1a2f66', edge=0.5)
    c.wash(c.poly([(cx, cy0 - 26), (cx + 8, cy0 - 6), (cx + 26, cy0 - 6), (cx + 12, cy0 + 6), (cx + 18, cy0 + 26), (cx, cy0 + 13), (cx - 18, cy0 + 26), (cx - 12, cy0 + 6), (cx - 26, cy0 - 6), (cx - 8, cy0 - 6)]), '#fff0b0', GOLD[0])
    for k in range(4):                                                     # bậc thềm
        y = BG - 26 + k * 8
        c.wash(c.rect(cx - 250 - k * 30, y, cx + 250 + k * 30, y + 9), '#e8dcc4', '#8a7a66', grain=0.15, edge=0.5)
    c.wash(c.poly([(cx - 60, BG - 28), (cx + 60, BG - 28), (cx + 110, H), (cx - 110, H)]), '#a82a36', '#7a1c26', grain=0.2)      # thảm đỏ
    c.wash(c.lines([(cx - 54, BG - 28, cx - 100, H, 3), (cx + 54, BG - 28, cx + 100, H, 3)]), GOLD[0])
    tb = BG - 26                                                           # ngai
    c.wash(c.poly([(cx - 46, tb), (cx - 46, tb - 130), (cx - 30, tb - 156), (cx, tb - 170), (cx + 30, tb - 156), (cx + 46, tb - 130), (cx + 46, tb)]), GOLD[0], GOLD[1], grain=0.15, edge=0.7, side=0.6)
    c.wash(c.poly([(cx - 36, tb - 40), (cx - 36, tb - 126), (cx - 22, tb - 146), (cx, tb - 156), (cx + 22, tb - 146), (cx + 36, tb - 126), (cx + 36, tb - 40)]), '#c23b42', '#701c26', grain=0.2, edge=0.5)
    c.dots([(cx - 22 + (i % 3) * 22, tb - 120 + (i // 3) * 26) for i in range(9)], '#8a2430', 2.2)
    c.wash(c.rect(cx - 62, tb - 62, cx + 62, tb - 40), GOLD[0], GOLD[1], edge=0.6); c.wash(c.rect(cx - 50, tb - 40, cx + 50, tb), '#b8323c', '#701c26', edge=0.5)
    for sg in (-1, 1):
        c.wash(c.rect(cx + sg * 56 - 9, tb - 84, cx + sg * 56 + 9, tb), GOLD[0], GOLD[1], edge=0.6, side=0.7)
        c.wash(c.ells([(cx + sg * 56, tb - 86, 11, 11)]), '#fff0b0', GOLD[0], edge=0.6)
    c.wash(c.ells([(cx, tb - 172, 9, 9)]), '#fff6d0', GOLD[0]); c.glow(cx, tb - 172, 26, '#ffe7a0', 0.7)
    for sg in (-1, 1):                                                     # giáp trụ đứng chầu + chậu lửa
        for dx in (150, 420):
            x = cx + sg * dx
            if dx == 150:
                c.wash(c.rect(x - 22, BG - 44, x + 22, BG - 20), '#e8dcc4', '#8a7a66', edge=0.6, side=0.6)
                c.wash(c.poly([(x - 14, BG - 44), (x - 16, BG - 84), (x - 22, BG - 90), (x - 18, BG - 108), (x - 8, BG - 114), (x - 7, BG - 126), (x, BG - 132), (x + 7, BG - 126), (x + 8, BG - 114), (x + 18, BG - 108), (x + 22, BG - 90), (x + 16, BG - 84), (x + 14, BG - 44)]),
                       '#d8dce4', '#5a606c', grain=0.12, edge=0.8, side=1.0)
                c.wash(c.lines([(x + 26, BG - 150, x + 26, BG - 44, 2.2)]), '#8a6444'); c.wash(c.poly([(x + 22, BG - 148), (x + 26, BG - 166), (x + 30, BG - 148)]), '#f0f2f6')
                c.wash(c.poly([(x - 5, BG - 132), (x, BG - 148), (x + 5, BG - 132)]), '#c8372f')
            else:
                lights.append((x, BG - 100, 260, '#ffa050', 1.0))
    c.lightmap(lights, '#8e8078')
    for sg in (-1, 1):
        brazier(c, cx + sg * 420, BG - 16, 70, 1.1)
    for k in range(W // P + 1):
        x = k * P
        if abs(x - cx) < 200:
            continue
        c.wash(c.poly([(x - 14, 262), (x + 14, 262), (x + 8, 276), (x - 8, 276)]), '#4a3a30', '#1e1612'); c.wash(c.lines([(x, 276, x, 292, 3)]), '#2a2018')
        fire(c, x, 262, 0.75, gr=90, gk=0.45)
    for k in range(W // P):                                                # nắng xuyên kính màu
        x = P // 2 + k * P
        if abs(x - cx) < 300:
            continue
        c.ray(x, x + 190, 90, 260, ['#ffe0b0', '#c8d8ff'][k % 2], 0.26, BG - 250, BG + 10, blur=7)
    for x in (cx - 760, cx + 760, 420, W - 420, cx - 1500, cx + 1500):
        chandelier(c, x, 96, 1.1)
    for _ in range(220):                                                   # bụi vàng trong nắng
        c.glow(rng.random() * W, 60 + rng.random() * 270, 2 + rng.random() * 2.5, '#ffe9b0', 0.5, 1.5)
    c.haze(BG - 10, H - 4, FOG, 0.85, wavy=0.2)
    back = c.finish(grain=0.04, sat=1.04)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=202)
    rng = np.random.default_rng(302)
    by = MG + 8
    GD = ('#f0c860', '#8a5a1a')
    for a, b in ((300, 1500), (2600, 3800)):                               # cọc vàng + dây nhung đỏ
        xs = list(np.arange(a, b + 1, 150))
        for i in range(len(xs) - 1):
            pts = [(xs[i] + (xs[i + 1] - xs[i]) * t, by - 58 + math.sin(t * math.pi) * 18) for t in np.linspace(0, 1, 10)]
            m.wash(m.lines([(*pts[j], *pts[j + 1], 5) for j in range(9)]), '#b8323c', '#701c26')
        for x in xs:
            m.wash(m.rect(x - 3.5, by - 62, x + 3.5, by + 4), GD[0], GD[1], side=0.9)
            m.wash(m.ells([(x, by - 66, 7, 7)]), '#fff0b0', GD[0], edge=0.6); m.wash(m.ells([(x, by + 5, 13, 4.5)]), GD[0], GD[1], edge=0.6)
    for x in (150, 1700, 2400, 3950):                                      # chân nến cao nhiều nhánh
        m.wash(m.rect(x - 3, by - 168, x + 3, by + 2), GD[0], GD[1], side=0.9)
        m.wash(m.poly([(x - 20, by + 8), (x - 4, by - 18), (x + 4, by - 18), (x + 20, by + 8)]), GD[0], GD[1], edge=0.6)
        for k, dx in enumerate((-34, -17, 0, 17, 34)):
            yy = by - 150 - (2 - abs(k - 2)) * 12
            m.wash(m.lines([(x, by - 130, x + dx, yy + 8, 2.4)]), GD[1]); m.wash(m.ells([(x + dx, yy + 8, 6, 2.6)]), GD[0], GD[1])
            m.wash(m.rect(x + dx - 2.2, yy - 10, x + dx + 2.2, yy + 7), '#f6ecd0', '#b8a880')
            m.wash(m.poly([(x + dx - 2.4, yy - 10), (x + dx, yy - 20), (x + dx + 2.4, yy - 10)], 0.4), '#ffe9a0')
            m.glow(x + dx, yy - 14, 30, '#ffa040', 0.5, 1.8); m.glow(x + dx, yy - 14, 6, '#fff6d0', 0.9, 1.3)
    for i, x in enumerate((640, 1160, 2940, 3460)):                        # bình sứ lớn + cây cảnh
        col = ('#3a5ab0', '#1a2f66') if i % 2 else ('#f4f0e4', '#9a9484')
        m.wash(m.poly([(x - 12, by + 8), (x - 26, by - 26), (x - 16, by - 62), (x - 10, by - 74), (x + 10, by - 74), (x + 16, by - 62), (x + 26, by - 26), (x + 12, by + 8)]), col[0], col[1], grain=0.1, edge=0.7, side=0.9)
        m.wash(m.lines([(x - 22, by - 34, x + 22, by - 34, 2.4), (x - 14, by - 64, x + 14, by - 64, 2)]), GD[0])
        for k in range(7):
            a = -math.pi * (0.15 + 0.7 * k / 6); L = 46 + rng.random() * 30
            ex, ey = x + math.cos(a) * L, by - 74 + math.sin(a) * L
            nx_, ny_ = -math.sin(a) * 7, math.cos(a) * 7
            m.wash(m.poly([(x, by - 74), ((x + ex) / 2 + nx_, (by - 74 + ey) / 2 + ny_), (ex, ey), ((x + ex) / 2 - nx_, (by - 74 + ey) / 2 - ny_)]), ['#3a8050', '#5aa860'][k % 2], '#245a44', edge=0.4)
    for x in (900, 3200):                                                  # bệ trưng vương miện / kiếm báu
        m.wash(m.rect(x - 34, by - 60, x + 34, by + 8), '#f0e4cc', '#7a6a58', grain=0.15, edge=0.6, side=0.7)
        m.wash(m.rect(x - 40, by - 68, x + 40, by - 58), '#fff8e8', '#a89880', edge=0.5)
        m.wash(m.ells([(x, by - 70, 30, 7)]), '#a02a36', '#5a141e', edge=0.5)
        if x < 2000:
            m.wash(m.poly([(x - 20, by - 72), (x - 22, by - 92), (x - 11, by - 82), (x, by - 98), (x + 11, by - 82), (x + 22, by - 92), (x + 20, by - 72)]), GD[0], GD[1], edge=0.7)
            m.dots([(x - 22, by - 93), (x, by - 99), (x + 22, by - 93)], '#c8372f', 2.6); m.glow(x, by - 86, 40, '#ffe7a0', 0.4)
        else:
            m.wash(m.lines([(x - 26, by - 74, x + 30, by - 96, 4)]), '#f0f2f6', '#8a929c'); m.wash(m.lines([(x - 22, by - 84, x - 14, by - 66, 4)]), GD[0]); m.glow(x + 6, by - 86, 40, '#cfe8ff', 0.4)
    mid = m.finish(grain=0.04, sat=1.04)
    g = tile_slab(('#b8a890', '#c4b49c', '#ccbca4', '#beae96'), '#5a4a40', '#f0e4cc', '#3a2c26', 9, nx=4, ny=4, checker='#8a6a5a', polish=0.14, cracks=5, debris=False)
    return back, mid, g, dict(sky='#3a2c34', sun='#ffd9a8', light=1.3, fog=FOG)


# ============================================================
# THƯ VIỆN
# ============================================================
def library():
    FOG = '#3c2e24'
    W, H = BACK
    c = Cv(W, H, seed=211)
    rng = np.random.default_rng(311)
    c.grad([(0, '#3a2c2a'), (0.5, '#5a4436'), (1, '#6a5040')])
    WD = ('#9a6e48', '#4a2f1e')
    cx = W // 2
    lights = []
    BAY = 320
    SP = ['#8a2a2a', '#2a4a7a', '#2f6a4a', '#7a5a2a', '#5a2a6a', '#9a7a3a', '#3a5a6a', '#a84a3a', '#d8c8a0']
    books = {k: [] for k in SP}; gold = []; things = []
    shelf_y = [72, 112, 172, 216, 260, 304, BG - 2]       # 0-1: gác trên · 2..: tầng dưới
    for b0 in np.arange(0, W, BAY):
        if abs(b0 + BAY / 2 - cx) < 200:
            continue
        x0, x1 = b0 + 22, b0 + BAY - 22
        c.wash(c.rect(x0 - 8, 30, x1 + 8, BG + 2), '#3a2618', '#2a1a10', grain=0.2)                 # lòng kệ tối
        for j in range(len(shelf_y) - 1):
            if j == 1:
                continue
            sy = shelf_y[j + 1] if j else shelf_y[1] - 4
            top = shelf_y[j] + 6
            x = x0
            while x < x1 - 6:
                r = rng.random()
                if r < 0.07:                                                # khoảng trống có đồ
                    things.append((x + 16, sy, int(rng.random() * 4))); x += 34; continue
                bw = 6 + rng.random() * 8; bh = (sy - top) * (0.62 + rng.random() * 0.34)
                lean = 3.5 if rng.random() < 0.08 else 0
                col = SP[int(rng.random() * len(SP))]
                books[col].append([(x, sy), (x + lean, sy - bh), (x + bw + lean, sy - bh), (x + bw, sy)])
                if rng.random() < 0.55:
                    gold.append([(x + 1.2 + lean * 0.3, sy - bh * 0.72), (x + bw - 1.2 + lean * 0.3, sy - bh * 0.72), (x + bw - 1.2 + lean * 0.25, sy - bh * 0.64), (x + 1.2 + lean * 0.25, sy - bh * 0.64)])
                x += bw + 0.8
    for col, lst in books.items():
        if lst:
            c.wash(c.polys(lst), col, mixh(col, '#100808', 0.45), grain=0.25, edge=0.5)
    c.wash(c.polys(gold), '#e8c060', alpha=0.8)
    for x, sy, k in things:
        if k == 0:
            c.relief([(x, sy - 9, 9)], ('#8a8068', '#c8c0a8', '#f0e8d4')); c.dots([(x - 3, sy - 10), (x + 3, sy - 10)], '#1e120c', 1.6)
        elif k == 1:
            c.wash(c.poly([(x - 7, sy), (x - 9, sy - 12), (x - 3, sy - 18), (x - 3, sy - 24), (x + 3, sy - 24), (x + 3, sy - 18), (x + 9, sy - 12), (x + 7, sy)]), ['#5fd0ff', '#c070ff', '#70e090'][int(x) % 3], '#203050', edge=0.6)
            c.glow(x, sy - 10, 18, ['#5fd0ff', '#c070ff', '#70e090'][int(x) % 3], 0.4, 1.8)
        elif k == 2:
            c.wash(c.ells([(x - 6 + j * 6, sy - 5 - (j % 2) * 7, 5, 5) for j in range(4)]), '#e8dcc0', '#a89878', edge=0.7); c.dots([(x - 6 + j * 6, sy - 5 - (j % 2) * 7) for j in range(4)], '#8a6a4a', 1.5)
        else:
            c.wash(c.rect(x - 2, sy - 16, x + 2, sy), '#f4e8c8', '#a89474'); c.glow(x, sy - 20, 22, '#ffa040', 0.5, 1.8); c.glow(x, sy - 20, 4, '#fff6d0', 0.9, 1.3)
    # khung kệ, ván ngang, trụ đứng
    for b0 in np.arange(0, W + 1, BAY):
        if abs(b0 - cx) < 190 and abs(b0 - cx) > 10:
            pass
        c.wash(c.rect(b0 - 22, 30, b0 + 22, BG + 4), WD[0], WD[1], grain=0.3, edge=0.5, side=0.8)
        c.wash(c.lines([(b0 + dx, 60, b0 + dx, BG - 20, 1.6) for dx in (-10, 0, 10)], 0.8), WD[1], alpha=0.5)
        c.wash(c.rect(b0 - 28, BG - 22, b0 + 28, BG + 4), '#a87a52', WD[1], grain=0.3, edge=0.6, side=0.8)
        lights.append((b0, 232, 200, '#ffb060', 1.0))
    for j, sy in enumerate(shelf_y[1:]):
        if j == 0:
            continue
        c.wash(c.rect(0, sy - 2, W, sy + 5), '#a87a52', WD[1], grain=0.25, edge=0.4)
    # gác lửng: sàn + lan can
    c.wash(c.rect(0, 112, W, 126), '#b0825a', WD[1], grain=0.3, edge=0.5)
    c.wash(c.rect(0, 126, W, 132, 1.5), '#1a100a', alpha=0.5)
    c.wash(c.polys([[(x, 84), (x + 5, 84), (x + 5, 112), (x, 112)] for x in np.arange(0, W, 20)]), '#b0825a', WD[1], grain=0.2)
    c.wash(c.rect(0, 78, W, 86), '#c8966a', WD[1], grain=0.25, edge=0.5)
    c.wash(c.rect(0, 24, W, 34), '#c8966a', WD[1], grain=0.25, edge=0.5)
    c.wash(c.rect(0, 0, W, 24), '#2a1c18', '#3a2820')
    # thang trượt
    for lx in (520, 1320, 2760, 3540):
        c.wash(c.lines([(lx - 14, BG, lx + 6, 134, 4), (lx + 18, BG, lx + 38, 134, 4)]), '#c89a68', '#6a4628', grain=0.3)
        c.wash(c.lines([(lx - 12 + (BG - y) * 0.095, y, lx + 20 + (BG - y) * 0.095, y, 3) for y in np.arange(BG - 16, 140, -22)]), '#b08454', '#6a4628')
    # cửa sổ vòm lớn giữa: trời đêm + trăng
    gw, gh = 250, 280
    go, gi = gothic(cx, BG - 24, gw + 46, gh + 30, 14), gothic(cx, BG - 24, gw, gh, 14)
    c.wash(c.rect(cx - 180, 30, cx + 180, BG + 2), '#6a5a52', '#4a3c36', grain=0.25)
    c.wash(c.poly(go), '#d8c8ac', '#7a6a58', grain=0.2, edge=0.6, side=0.3)
    c.wash(c.lines([(*go[i], *gi[i], 1.3) for i in range(1, len(go) - 1)]), '#4a3c36', alpha=0.6)
    c.wash(c.poly(gi), '#16224a', '#4a5a9a', grain=0.1)
    y0_, x0_, mm = c.poly(gi)
    rs = np.random.default_rng(3)
    c.dots([(cx + (rs.random() - 0.5) * 150, BG - 60 - rs.random() * 190) for _ in range(40)], '#ffffff', 0.9)
    c.wash(c.ells([(cx + 36, BG - 196, 26, 26)], 0.6), '#f6f8ff'); c.wash(c.ells([(cx + 28, BG - 202, 6, 5), (cx + 44, BG - 188, 4, 3.4)]), '#c8d4f0', alpha=0.7)
    c.wash(c.lines([(cx + dx, BG - 24 - gh, cx + dx, BG - 24, 3) for dx in (-62, 0, 62)] + [(cx - gw / 2, BG - 24 - yy, cx + gw / 2, BG - 24 - yy, 3) for yy in (70, 150)]), '#2a2018')
    c.wash(c.rect(cx - 150, BG - 24, cx + 150, BG - 12), '#d8c8ac', '#7a6a58', edge=0.6)
    lights.append((cx, BG - 150, 420, '#9ab8ff', 1.1))
    c.lightmap(lights, '#857a72')
    for b0 in np.arange(0, W + 1, BAY):                                    # đèn dầu trên trụ kệ
        c.wash(c.lines([(b0, 238, b0 + 14, 238, 2), (b0 + 14, 238, b0 + 14, 230, 2)]), '#3a2c22')
        c.wash(c.poly([(b0 + 8, 230), (b0 + 20, 230), (b0 + 18, 212), (b0 + 10, 212)]), '#ffe9a8', '#ffc45c', edge=0.9)
        c.glow(b0 + 14, 220, 60, '#ffb86a', 0.5, 1.8); c.glow(b0 + 14, 220, 8, '#fff6d0', 0.9, 1.3)
    c.ray(cx, cx + 230, 180, 520, '#a8c4ff', 0.30, BG - 290, BG + 10, blur=8)
    c.ray(cx - 30, cx - 180, 120, 380, '#a8c4ff', 0.18, BG - 290, BG + 10, blur=8)
    for x in (cx - 900, cx + 900, 500, W - 500):
        chandelier(c, x, 60, 0.8, n=5)
    for _ in range(260):
        c.glow(cx + (rng.random() - 0.5) * 700, 80 + rng.random() * 250, 2 + rng.random() * 2, '#e8f0ff', 0.5, 1.5)
    for _ in range(200):
        c.glow(rng.random() * W, 60 + rng.random() * 270, 1.8 + rng.random() * 2, '#ffe0a8', 0.4, 1.5)
    c.haze(BG - 10, H - 4, FOG, 0.85, wavy=0.2)
    back = c.finish(grain=0.045, sat=1.04)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=212)
    rng = np.random.default_rng(312)
    by = MG + 8

    def stack(x, y, n, lean=0.0):
        for k in range(n):
            col = SP[int(rng.random() * len(SP))]; w = 30 + rng.random() * 14; dx = (rng.random() - 0.5) * 8 + lean * k
            m.wash(m.rect(x - w / 2 + dx, y - (k + 1) * 8, x + w / 2 + dx, y - k * 8 - 0.8), col, mixh(col, '#100808', 0.5), grain=0.2, edge=0.6)
            m.wash(m.rect(x + w / 2 + dx - 4, y - (k + 1) * 8 + 1.6, x + w / 2 + dx - 0.8, y - k * 8 - 2.2), '#f4ecd8')
            m.wash(m.rect(x - w / 2 + dx + 4, y - (k + 1) * 8 + 2.6, x - w / 2 + dx + 12, y - k * 8 - 3.2), '#e8c060', alpha=0.8)
        return y - n * 8
    for i, x in enumerate((420, 1500, 2600, 3660)):                        # bàn đọc: sách, nến, quả địa cầu / kính
        m.wash(m.rect(x - 130, by - 70, x + 130, by - 58), '#b0825a', '#5a3a22', grain=0.3, edge=0.6)
        for sg in (-1, 1):
            m.wash(m.poly([(x + sg * 116 - 7, by + 8), (x + sg * 112 - 6, by - 58), (x + sg * 112 + 6, by - 58), (x + sg * 116 + 7, by + 8)]), '#9a6e48', '#4a2f1e', grain=0.3, side=0.8)
        m.wash(m.rect(x - 110, by - 54, x + 110, by - 44), '#8a5e3c', '#4a2f1e')
        t = stack(x - 84, by - 70, 3 + i % 3)
        stack(x + 70, by - 70, 2 + (i + 1) % 3, 0.6)
        m.wash(m.poly([(x - 34, by - 71), (x - 2, by - 77), (x + 30, by - 71), (x + 30, by - 74), (x - 2, by - 81), (x - 34, by - 74)]), '#f6eed8', '#c8b890', edge=0.5)      # sách mở
        m.wash(m.lines([(x - 28, by - 75 + j * 0.0, x - 6, by - 79, 0.8) for j in range(1)] + [(x - 2, by - 80, x - 2, by - 72, 0.9)]), '#8a7a5a')
        cx_ = x + 104                                                      # nến
        m.wash(m.ells([(cx_, by - 71, 9, 2.6)]), '#c9a23a', '#7a5a1a'); m.wash(m.rect(cx_ - 2.4, by - 96, cx_ + 2.4, by - 71), '#f6ecd0', '#b8a880')
        m.wash(m.poly([(cx_ - 2.6, by - 96), (cx_, by - 107), (cx_ + 2.6, by - 96)], 0.4), '#ffe9a0')
        m.glow(cx_, by - 100, 60, '#ffa040', 0.5, 1.8); m.glow(cx_, by - 100, 7, '#fff6d0', 0.9, 1.3)
        if i % 2 == 0:                                                     # quả địa cầu
            gx_, gy_ = x - 112, by - 104
            m.wash(m.lines([(gx_, by - 70, gx_, gy_ + 20, 2.4)]), '#c9a23a'); m.wash(m.ells([(gx_, by - 71, 12, 3)]), '#c9a23a', '#7a5a1a')
            m.relief([(gx_, gy_, 22)], ('#2a4a7a', '#4a7ab0', '#86b4e0', '#d0e8ff'), grain=0.2)
            m.wash(m.polys([[(gx_ - 12, gy_ - 8), (gx_ - 2, gy_ - 14), (gx_ + 4, gy_ - 4), (gx_ - 6, gy_ + 4)], [(gx_ + 4, gy_ + 4), (gx_ + 14, gy_), (gx_ + 10, gy_ + 12)]]), '#6aa860', alpha=0.8)
            pts = [(gx_ + math.cos(a) * 26, gy_ + math.sin(a) * 26) for a in np.linspace(-1.2, 2.0, 14)]
            m.wash(m.lines([(*pts[j], *pts[j + 1], 2) for j in range(13)]), '#c9a23a')
        for sg in (-1, 1):                                                 # ghế tựa
            sx = x + sg * 178
            m.wash(m.rect(sx - 20, by - 36, sx + 20, by - 28), '#8d2430', '#4a1018', edge=0.5)
            m.wash(m.rect(sx + sg * 16 - 3, by - 88, sx + sg * 16 + 3, by + 8), '#9a6e48', '#4a2f1e', side=0.8); m.wash(m.rect(sx - sg * 16 - 3, by - 30, sx - sg * 16 + 3, by + 8), '#9a6e48', '#4a2f1e')
            m.wash(m.poly([(sx + sg * 12, by - 86), (sx + sg * 20, by - 86), (sx + sg * 20, by - 40), (sx + sg * 12, by - 40)]), '#8d2430', '#4a1018')
    for x in (900, 2060, 3140):                                            # bục đọc sách phép (sách phát sáng)
        m.wash(m.poly([(x - 9, by + 8), (x - 6, by - 70), (x + 6, by - 70), (x + 9, by + 8)]), '#9a6e48', '#4a2f1e', grain=0.3, side=0.8)
        m.wash(m.poly([(x - 30, by + 8), (x - 8, by - 6), (x + 8, by - 6), (x + 30, by + 8)]), '#8a5e3c', '#4a2f1e')
        m.wash(m.poly([(x - 34, by - 66), (x + 30, by - 86), (x + 34, by - 78), (x - 30, by - 58)]), '#b0825a', '#5a3a22', edge=0.6)
        m.wash(m.poly([(x - 28, by - 70), (x, by - 84), (x + 26, by - 88), (x + 24, by - 94), (x - 2, by - 90), (x - 30, by - 76)]), '#f6f2e4', '#c8c0a0', edge=0.5)
        col = ['#8fd8ff', '#d0a0ff', '#a0ffc0'][int(x) % 3]
        m.glow(x - 2, by - 100, 70, col, 0.5, 1.8)
        for k in range(7):
            m.glow(x - 20 + rng.random() * 40, by - 104 - rng.random() * 50, 3, '#ffffff', 0.8, 1.3)
    for i in range(16):                                                    # chồng sách trên sàn, cuộn giấy
        x = rng.random() * W2
        if i % 3:
            stack(x, by + 8, 2 + int(rng.random() * 5), (rng.random() - 0.5) * 1.2)
        else:
            m.wash(m.poly([(x - 16, by + 8), (x - 20, by - 26), (x + 20, by - 26), (x + 16, by + 8)]), '#b08454', '#5a3a22', grain=0.3, edge=0.7, side=0.7)
            for k in range(5):
                m.wash(m.rect(x - 15 + k * 7, by - 46 - (k % 2) * 8, x - 10 + k * 7, by - 24), '#f4ecd8', '#c8b890', edge=0.5)
    mid = m.finish(grain=0.045, sat=1.04)
    g = tile_planks(('#8e6c4c', '#9a7854', '#846244', '#a2805a'), '#3a281a', '#c8a478', 53)
    return back, mid, g, dict(sky='#2a2028', sun='#ffd8a4', light=1.2, fog=FOG)


# ============================================================
# HẦM MỎ / MỎ SÂU
# ============================================================
def crystal(c, x, base, s, cols, rng, glow=None, n=5):
    lo, mid_, hi = cols
    for k in range(n):
        a = -math.pi / 2 + (k - (n - 1) / 2) * 0.42 + (rng.random() - 0.5) * 0.2
        L = s * (0.55 + rng.random() * 0.6) * (1.2 - abs(k - (n - 1) / 2) / n)
        w = s * (0.13 + rng.random() * 0.08)
        ex, ey = x + math.cos(a) * L, base + math.sin(a) * L
        nx_, ny_ = -math.sin(a) * w, math.cos(a) * w
        bx, by_ = x + math.cos(a) * L * 0.1 + (k - (n - 1) / 2) * w * 0.6, base + 2
        tip = (ex + math.cos(a) * w * 1.4, ey + math.sin(a) * w * 1.4)
        c.wash(c.poly([(bx - nx_, by_ - ny_), (ex - nx_, ey - ny_), tip, (ex + nx_, ey + ny_), (bx + nx_, by_ + ny_)]), mid_, lo, grain=0.1, edge=0.5)
        c.wash(c.poly([(bx - nx_, by_ - ny_), (ex - nx_, ey - ny_), tip, (ex - nx_ * 0.2, ey - ny_ * 0.2), (bx - nx_ * 0.2, by_ - ny_ * 0.2)]), hi, alpha=0.75, grain=0.05)
    if glow:
        c.glow(x, base - s * 0.5, s * 1.6, glow, 0.5, 1.8)


def minecart(c, x, base, s, ore, rng, glow=None):
    c.wash(c.poly([(x - 50 * s, base - 56 * s), (x + 50 * s, base - 56 * s), (x + 40 * s, base - 16 * s), (x - 40 * s, base - 16 * s)]), '#7a6a5a', '#33291f', grain=0.3, edge=0.7, side=0.7)
    c.wash(c.lines([(x - 50 * s, base - 54 * s, x + 50 * s, base - 54 * s, 4 * s), (x - 44 * s, base - 34 * s, x + 44 * s, base - 34 * s, 2.4 * s)]), '#4a4a52', '#22222a')
    c.dots([(x - 40 * s + k * 20 * s, base - 54 * s) for k in range(5)], '#9a9aa4', 1.6 * s)
    c.relief([(x - 30 * s + k * 15 * s, base - 62 * s - (k % 2) * 6 * s, 12 * s) for k in range(5)], ore, grain=0.2)
    for wx in (x - 26 * s, x + 26 * s):
        c.wash(c.ells([(wx, base - 10 * s, 12 * s, 12 * s)]), '#4a4a52', '#1e1e24', edge=0.8); c.wash(c.ells([(wx, base - 10 * s, 4.5 * s, 4.5 * s)]), '#8a8a94')
    if glow:
        c.glow(x, base - 66 * s, 60 * s, glow, 0.45, 1.8)


def mine(deep=False):
    FOG = '#2e2c38' if deep else '#3e362e'
    W, H = BACK
    c = Cv(W, H, seed=221 + deep)
    rng = np.random.default_rng(321 + deep)
    c.grad([(0, '#3a3a48'), (0.5, '#55556a'), (1, '#666478')] if deep else [(0, '#4a4440'), (0.5, '#6e6458'), (1, '#80746a')])
    RK = ('#2c2c3a', '#56566e', '#80809c', '#aeaec8') if deep else ('#3a342e', '#6e6456', '#988c7c', '#c4b8a4')
    CR = ('#5a3aa8', '#9a70f0', '#e0c8ff') if deep else ('#2a7aa8', '#5fc8f0', '#d0f4ff')
    CG = '#a070ff' if deep else '#4fc0ff'
    LAMP = '#8fb0ff' if deep else '#ffb060'
    # vách đá: nhiều tầng tảng đá chồng nhau
    for row, (yb, hh) in enumerate(((120, 130), (200, 120), (275, 110), (BG + 6, 100))):
        x = -40.0
        while x < W + 60:
            w = 150 + rng.random() * 170
            rock(c, x, yb + rng.random() * 14, w, hh * (0.7 + rng.random() * 0.5), cols=RK, seed=abs(int(x)) + row * 77)
            x += w * (0.5 + rng.random() * 0.25)
    for _ in range(90):                                                    # khe nứt đá
        x, y = rng.random() * W, 20 + rng.random() * 290
        segs = []
        for j in range(6):
            nx_, ny_ = x + (rng.random() - 0.5) * 22, y + 6 + rng.random() * 14
            segs.append((x, y, nx_, ny_, 1.2)); x, y = nx_, ny_
        c.wash(c.lines(segs), '#15141c' if deep else '#1c1814', alpha=0.6)
    lights = []
    # cửa hầm + khung chống gỗ + đường ray
    WDc = ('#b08a5c', '#4a3220')
    tun = list(np.arange(360, W, 660))
    for i, tx in enumerate(tun):
        c.wash(c.ells([(tx, BG - 4, 118, 172)], 1.0), '#0a090e', '#17151c')
        c.wash(c.rect(tx - 120, BG - 6, tx + 120, BG + 4), '#17151c')
        c.wash(c.ells([(tx, BG - 30, 60, 90)], 6), CG if deep else '#ff9a50', alpha=0.10)                         # ánh sáng sâu trong hầm
        for sg in (-1, 1):
            c.wash(c.rect(tx + sg * 118 - 11, 162, tx + sg * 118 + 11, BG + 4), WDc[0], WDc[1], grain=0.35, edge=0.5, side=0.8)
            c.wash(c.lines([(tx + sg * 118, 196, tx + sg * 62, 162, 9)]), WDc[0], WDc[1], grain=0.3)
        c.wash(c.rect(tx - 146, 146, tx + 146, 168), WDc[0], WDc[1], grain=0.35, edge=0.5)
        c.dots([(tx + sg * 118 + dx, 157) for sg in (-1, 1) for dx in (-5, 5)], '#2a2a32', 2.2)
        c.wash(c.polys([[(tx - 14, BG + 4), (tx - 5, BG - 70), (tx - 2, BG - 70), (tx - 8, BG + 4)], [(tx + 14, BG + 4), (tx + 5, BG - 70), (tx + 2, BG - 70), (tx + 8, BG + 4)]]), '#8a8a94', '#3a3a44')    # ray chạy vào hầm
        c.wash(c.lines([(tx - 14 + t * 9, BG + 2 - t * 70, tx + 14 - t * 9, BG + 2 - t * 70, 2.4 - t * 1.4) for t in np.linspace(0, 0.95, 9)]), '#5a4028', alpha=0.9)
        c.wash(c.lines([(tx + 60, 168, tx + 60, 196, 1.2)]), '#2a2a32')                                           # đèn treo
        lights.append((tx + 60, 206, 280, LAMP, 1.2))
        lights.append((tx - 330, 250, 240, CG, 0.7))
    # giàn giáo + thang giữa các cửa hầm
    for i, tx in enumerate(tun[:-1]):
        sx = tx + 330
        if i % 2 == 0:
            for dx in (-70, 70):
                c.wash(c.rect(sx + dx - 6, 150, sx + dx + 6, BG + 4), WDc[0], WDc[1], grain=0.35, side=0.8)
            for yy in (176, 256):
                c.wash(c.rect(sx - 90, yy, sx + 90, yy + 9), '#c09a6a', WDc[1], grain=0.35, edge=0.5)
            c.wash(c.lines([(sx - 66, 256, sx + 66, 186, 4), (sx + 66, 256, sx - 66, 186, 4)]), WDc[1], alpha=0.8)
            c.wash(c.lines([(sx + 20, BG + 2, sx + 30, 262, 3.4), (sx + 44, BG + 2, sx + 54, 262, 3.4)] + [(sx + 21 + (BG - y) * 0.11, y, sx + 45 + (BG - y) * 0.11, y, 2.4) for y in np.arange(BG - 10, 268, -14)]), '#c09a6a', WDc[1])
            crate(c, sx - 40, 256, 0.7); barrel(c, sx + 4, 256, 0.6)
    c.lightmap(lights, '#606478' if deep else '#70685f')
    # nhũ đá
    st = []
    for x in np.arange(0, W, 26):
        if rng.random() < 0.75:
            L = 16 + rng.random() ** 2 * 80; w = 6 + rng.random() * 9
            st.append([(x - w, 0), (x + w, 0), (x + (rng.random() - 0.5) * 3, L)])
    c.wash(c.polys(st), RK[1], RK[0], grain=0.3, edge=0.6)
    c.wash(c.polys([[p[0], ((p[0][0] + p[1][0]) / 2 - 1, 0), p[2]] for p in st]), RK[3], alpha=0.4)
    # tinh thể + mạch quặng
    for _ in range(70):
        x, y = rng.random() * W, 60 + rng.random() * 270
        if min(abs(x - t) for t in tun) < 135 and y > 180:
            continue
        crystal(c, x, y, 16 + rng.random() * 30, CR, rng, glow=CG, n=3 + int(rng.random() * 3))
    for _ in range(46):
        x, y = rng.random() * W, 40 + rng.random() * 280
        pts = [(x + k * 7 + rng.random() * 4, y + k * 3 + rng.random() * 6) for k in range(6)]
        c.dots(pts, '#ffe27a' if not deep else '#c8f4ff', 1.6)
        for px, py in pts[::2]:
            c.glow(px, py, 7, '#ffd24a' if not deep else '#a0e8ff', 0.5, 1.6)
    for i, tx in enumerate(tun):                                           # đèn lồng
        lx = tx + 60
        c.wash(c.poly([(lx - 9, 196), (lx + 9, 196), (lx + 7, 218), (lx - 7, 218)]), '#fff0c0' if not deep else '#e0ecff', LAMP, edge=0.8)
        c.wash(c.poly([(lx - 12, 196), (lx, 186), (lx + 12, 196)]), '#2a2a32'); c.wash(c.rect(lx - 9, 218, lx + 9, 221), '#2a2a32')
        c.glow(lx, 207, 70, LAMP, 0.6, 1.8); c.glow(lx, 207, 9, '#ffffff', 0.8, 1.3)
    # ray ngang chân vách + xe goòng
    c.wash(c.lines([(x, BG - 6, x, BG + 6, 7) for x in np.arange(0, W, 30)]), '#6a4e30', '#33241a', grain=0.3)
    c.wash(c.lines([(0, BG - 5, W, BG - 5, 3), (0, BG + 4, W, BG + 4, 3)]), '#9a9aa4', '#4a4a54')
    for i, x in enumerate((700, 1700, 2700, 3700)):
        minecart(c, x, BG + 2, 0.9, ('#3a3a44', '#6a6a78', '#9a9aac') if i % 2 else CR, rng, glow=None if i % 2 else CG)
    for _ in range(40):                                                    # giọt nước
        x = rng.random() * W; y = 30 + rng.random() * 200
        c.wash(c.lines([(x, y, x, y + 8, 0.9)], 0.4), '#c8e0ff', alpha=0.6)
    c.band(BG - 50, H + 20, '#8a8aa8' if deep else '#a89880', 0.22, wavy=1.0)
    for _ in range(180):
        c.glow(rng.random() * W, 40 + rng.random() * 290, 2 + rng.random() * 2.5, CG if deep else '#ffe0a8', 0.45, 1.5)
    c.haze(BG - 12, H - 4, FOG, 0.9, wavy=0.2)
    back = c.finish(grain=0.05)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=223 + deep)
    rng = np.random.default_rng(323 + deep)
    by = MG + 8
    for i in range(34):
        rock(m, rng.random() * W2, by + 4, 40 + rng.random() * 90, 18 + rng.random() * 40, cols=RK, seed=800 + i + deep * 50)
    for i, x in enumerate((240, 880, 1560, 2300, 2980, 3700)):
        crystal(m, x + rng.random() * 80, by + 4, 60 + rng.random() * 50, CR, rng, glow=CG, n=6)
        crystal(m, x + 60 + rng.random() * 40, by + 4, 30 + rng.random() * 20, CR, rng, n=4)
    for i, x in enumerate((560, 2000, 3340)):
        minecart(m, x, by + 4, 1.2, CR if i % 2 == 0 else ('#6a5a2a', '#c8a84a', '#ffe9a0'), rng, glow=CG if i % 2 == 0 else '#ffd24a')
        m.wash(m.lines([(xx, by - 2, xx, by + 10, 8) for xx in np.arange(x - 150, x + 151, 34)]), '#6a4e30', '#33241a', grain=0.3)
        m.wash(m.lines([(x - 160, by - 1, x + 160, by - 1, 3.4), (x - 160, by + 9, x + 160, by + 9, 3.4)]), '#9a9aa4', '#4a4a54')
    for x in (1240, 2640, 3900, 100):                                      # cuốc, xẻng, đèn bão, thùng
        m.wash(m.lines([(x, by + 6, x + 26, by - 96, 3.6)]), '#b08a5c', '#4a3220')
        m.wash(m.poly([(x - 4, by - 92), (x + 26, by - 104), (x + 58, by - 88), (x + 56, by - 82), (x + 26, by - 94), (x - 2, by - 86)]), '#b4b8c4', '#4a4e5a', edge=0.7)
        m.wash(m.lines([(x + 60, by + 6, x + 48, by - 80, 3.4)]), '#b08a5c', '#4a3220'); m.wash(m.poly([(x + 40, by - 78), (x + 56, by - 80), (x + 54, by - 102), (x + 40, by - 100)]), '#b4b8c4', '#4a4e5a', edge=0.7)
        crate(m, x - 50, by + 6, 0.95, cols=('#a8845c', '#4a3220'))
        lx = x - 50
        m.wash(m.poly([(lx - 8, by - 44), (lx + 8, by - 44), (lx + 6, by - 30), (lx - 6, by - 30)]), '#fff0c0' if not deep else '#e0ecff', LAMP, edge=0.8)
        m.wash(m.poly([(lx - 10, by - 44), (lx, by - 54), (lx + 10, by - 44)]), '#2a2a32')
        m.glow(lx, by - 38, 60, LAMP, 0.55, 1.8); m.glow(lx, by - 38, 7, '#ffffff', 0.8, 1.3)
    if deep:
        for i in range(24):
            shroom(m, rng.random() * W2, by + 4, 0.9 + rng.random() * 1.0, ('#3a2a7a', '#7a5ad0', '#d0c0ff'), glow='#9070ff')
    m.band(MG - 30, H2 + 12, '#9a9ac0' if deep else '#b8a890', 0.3, wavy=1.0)
    for _ in range(50):
        x, y = rng.random() * W2, 30 + rng.random() * (MG - 40)
        m.glow(x, y, 5, CG if deep else '#ffe0a8', 0.5, 2.0)
    mid = m.finish(grain=0.05)
    if deep:
        g = tile_dirt('#565a68', '#3e4250', '#70748a', 22, tufts=None, pebbles=120, ruts=False, cracks=16)
    else:
        g = tile_dirt('#746a5e', '#544c42', '#8e8272', 21, tufts=None, pebbles=120, ruts=True, cracks=10)
    return back, mid, g, dict(sky='#14151d', sun='#b4c2ff' if deep else '#ffcc98', light=0.85 if deep else 1.0, fog=FOG)


def deepMine():
    return mine(True)


# ============================================================
# ĐỈNH THÁP (đêm trăng)
# ============================================================
NIGHT_C = ('#141c40', '#26346a', '#4a5a98', '#9aa8dc')


def night_sky(c, rng, moon=(2800, 92, 46), seed=0, n_cloud=8, stops=((0, '#060a1c'), (0.4, '#12204c'), (0.75, '#2c3e7a'), (1, '#4a4e86'))):
    c.grad(list(stops))
    stars(c, 620, 250, seed + 5)
    mx, my, mr = moon
    c.glow(mx, my, mr * 9, '#8ea7ff', 0.35, 1.6); c.glow(mx, my, mr * 3, '#c8d8ff', 0.4, 1.8)
    c.wash(c.ells([(mx, my, mr, mr)], 0.6), '#fbfcff', '#dfe6fa', grain=0.1)
    c.wash(c.ells([(mx - mr * 0.3, my - mr * 0.25, mr * 0.2, mr * 0.17), (mx + mr * 0.25, my + mr * 0.2, mr * 0.26, mr * 0.2), (mx + mr * 0.1, my - mr * 0.45, mr * 0.12, mr * 0.1), (mx - mr * 0.35, my + mr * 0.4, mr * 0.14, mr * 0.11)], 0.8), '#bcc8ea', alpha=0.6)
    for i in range(n_cloud):
        cloud(c, rng.random() * c.w, 120 + rng.random() * 120, 300 + rng.random() * 400, 40 + rng.random() * 50, cols=NIGHT_C, seed=seed + 20 + i, alpha=0.9)


def tower_scene():
    FOG = '#242a48'
    W, H = BACK
    c = Cv(W, H, seed=231)
    rng = np.random.default_rng(331)
    night_sky(c, rng, seed=1)
    # sao băng
    for sx, sy in ((900, 60), (3500, 110)):
        c.ray(sx, sx - 150, 2, 10, '#ffffff', 0.7, sy, sy + 60, blur=1.5); c.glow(sx, sy, 10, '#ffffff', 0.8, 1.4)
    ridge(c, 290, 130, '#1c2850', 107, snow=True, fade='#3a4680', k=0.6)
    ridge(c, 300, 70, '#162042', 108, fade='#34407a', k=0.5)
    c.haze(240, 320, '#3a4a88', 0.35, wavy=0.4)
    # thành phố đêm dưới chân tháp + sông ánh trăng
    c.wash(c.rect(0, 306, W, H), '#141c3c', '#1c2444', grain=0.15)
    pts = [(x, 326 + math.sin(x * 0.003) * 9 + math.sin(x * 0.009) * 3) for x in np.arange(0, W + 40, 40)]
    c.wash(c.lines([(*pts[i], *pts[i + 1], 7) for i in range(len(pts) - 1)], 0.8), '#8ea7e8', alpha=0.8)
    blocks = []
    for _ in range(520):
        x = rng.random() * W; y = 308 + rng.random() * 34; w = 8 + rng.random() * 18; h = 6 + rng.random() * 14
        blocks.append([(x, y), (x + w / 2, y - h * 0.6), (x + w, y), (x + w, y + h), (x, y + h)])
    c.wash(c.polys(blocks), '#1e2850', '#121a36', grain=0.2)
    for _ in range(1500):                                                  # đèn nhà
        x = rng.random() * W; y = 310 + rng.random() * 36
        c.glow(x, y, 2.4 + rng.random() * 2.4, ['#ffcf7a', '#ffe6a8', '#ff9a50'][int(rng.random() * 3)], 0.8, 1.4)
    for x in (520, 1700, 3300):
        c.glow(x, 330, 220, '#ff9a50', 0.16, 1.6, sy=0.25)
    # các tháp khác của lâu đài vươn lên trong đêm
    SN = ('#5a6490', '#1e2444'); RN = ('#141a3c', '#26346e', '#5a70b8')
    for i, (x, hh, ww) in enumerate(((300, 250, 110), (1180, 190, 80), (2260, 220, 96), (3620, 270, 120), (1560, 130, 60), (3120, 150, 66))):
        tower(c, x, BG + 4, ww, hh, SN, RN, ww * 1.3, rng, 3, flag='#8a2a3a' if i % 2 == 0 else None)
        for k in range(3):                                                 # cửa sổ sáng đèn
            wy = BG + 4 - hh + hh * (0.28 + 0.3 * k)
            if rng.random() < 0.7:
                c.wash(c.rect(x - ww * 0.08 - ww * 0.05, wy - ww * 0.22, x - ww * 0.08 + ww * 0.05, wy - 1), '#ffd98a'); c.glow(x - ww * 0.08, wy - ww * 0.12, ww * 0.4, '#ffb050', 0.5, 1.8)
        c.wash(c.rect(x - ww / 2, BG + 4 - hh, x - ww * 0.36, BG + 4, 1.0), '#a8c0ff', alpha=0.3)        # viền trăng
    for i in range(14):                                                    # dơi / quạ đêm
        bird(c, rng.random() * W, 80 + rng.random() * 160, 5 + rng.random() * 5, '#0a0e22')
    c.band(260, 330, '#5a6aa8', 0.3, wavy=1.0)
    c.haze(BG - 14, H - 4, FOG, 0.85, wavy=0.3)
    back = c.finish(grain=0.045, sat=1.05)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=232)
    rng = np.random.default_rng(332)
    by = MG + 8
    SM = ('#7e88ac', '#262c48')
    wt = by - 70
    m.wash(m.rect(0, wt, W2, by + 10), SM[0], SM[1], grain=0.22, edge=0.2)
    stone_hint(m, 0, wt + 4, W2, by + 8, rng, SM[1], '#c8d4f8', bw=32, bh=12, alpha=0.4)
    ms = []
    x = 0
    while x < W2:
        ms.append([(x, wt - 34), (x + 70, wt - 34), (x + 70, wt + 2), (x, wt + 2)]); x += 124
    m.wash(m.polys(ms), '#8a94b8', '#343a5a', grain=0.22, edge=0.5)
    m.wash(m.polys([[(p[0][0], wt - 34), (p[1][0], wt - 34), (p[1][0], wt - 30), (p[0][0], wt - 30)] for p in ms]), '#c8d8ff', alpha=0.8)        # mép bắt ánh trăng
    m.wash(m.polys([[(p[0][0], wt - 34), (p[0][0] + 4, wt - 34), (p[0][0] + 4, wt + 2), (p[0][0], wt + 2)] for p in ms]), '#b0c4f8', alpha=0.5)
    m.wash(m.lines([(p[0][0] + 35, wt - 24, p[0][0] + 35, wt - 6, 2.6) for p in ms]), '#12152a', alpha=0.85)
    m.wash(m.rect(0, wt, W2, wt + 5), '#b0c0f0', alpha=0.6); m.wash(m.rect(0, wt + 5, W2, wt + 11, 1.5), '#12152a', alpha=0.45)
    for x in (310, 1178, 2046, 2914, 3782):                                # chậu lửa trên lỗ châu mai
        m.wash(m.poly([(x - 30, wt - 34), (x + 30, wt - 34), (x + 20, wt - 58), (x - 20, wt - 58)]), '#3a3640', '#16141c', edge=0.6)
        m.wash(m.rect(x - 34, wt - 62, x + 34, wt - 56), '#5a5560', '#2a2630')
        fire(m, x, wt - 60, 1.3, gr=54, gk=0.6)
    px = 2480                                                              # cột cờ
    m.wash(m.lines([(px, wt - 34, px, 14, 4)]), '#5a4a3a', '#2a2018'); banner(m, px + 28, 20, 48, 96, '#8a2a3a')
    for tx in (1560, 3400):                                                # kính thiên văn trên giá ba chân
        m.wash(m.lines([(tx - 30, wt - 34, tx, wt - 96, 3), (tx + 30, wt - 34, tx, wt - 96, 3), (tx, wt - 34, tx, wt - 96, 3)]), '#8a6444', '#3a2818')
        m.wash(m.lines([(tx - 44, wt - 86, tx + 44, wt - 128, 10)]), '#c9a23a', '#6a4a14')
        m.wash(m.lines([(tx + 30, wt - 121, tx + 52, wt - 132, 13)]), '#e0bc5a', '#6a4a14'); m.wash(m.ells([(tx + 54, wt - 133, 4, 7)]), '#a8d0ff')
        m.wash(m.lines([(tx - 44, wt - 86, tx - 54, wt - 81, 6)]), '#3a3640')
    for i in range(24):
        cl = [(rng.random() * W2, wt + 6 + rng.random() * 40, 3 + rng.random() * 4) for _ in range(1)]
        x0 = cl[0][0]
        foliage(m, [(x0 + (rng.random() - 0.5) * 30, wt + 4 + rng.random() * 50, 3 + rng.random() * 4) for _ in range(7)], ('#16263a', '#24404a', '#3a6a62', '#5a9a84'), rng, grain=0.05)
    mid = m.finish(grain=0.045, sat=1.05)
    g = tile_slab(('#5e6880', '#687288', '#727c92', '#646e84'), '#2a2e44', '#aab8dc', '#161a2c', 17, nx=4, ny=3, rune='#8fb0ff', wet='#8ea0d0', cracks=16)
    return back, mid, g, dict(sky='#060a1c', sun='#b0c6ff', light=1.0, fog=FOG)


# ============================================================
# ĐỀN TRĂNG (thành Lunaria)
# ============================================================
def moon():
    FOG = '#4a64a0'
    W, H = BACK
    c = Cv(W, H, seed=241)
    rng = np.random.default_rng(341)
    cx = W // 2
    night_sky(c, rng, moon=(cx, 120, 110), seed=2, n_cloud=5, stops=((0, '#081030'), (0.4, '#162a66'), (0.75, '#30509a'), (1, '#5a7ac0')))
    for i in range(5):                                                     # cực quang
        xs = np.linspace(0, W, 90); ph = rng.random() * 6
        ys = 60 + i * 26 + np.sin(xs * 0.0028 + ph) * 28 + np.sin(xs * 0.0071 + ph * 2) * 10
        yy, xx, mk = c.poly(list(zip(xs, ys)) + list(zip(xs[::-1], ys[::-1] + 50)), 14)
        c.light(yy, xx, mk * (0.22 - i * 0.02) * (0.5 + c.noise_at(yy, xx, mk.shape)), ['#6affd0', '#8ab0ff', '#c090ff', '#6affd0', '#8ab0ff'][i])
    ridge(c, 292, 110, '#27407e', 111, snow=True, fade='#6a88cc', k=0.6)
    c.haze(230, 320, '#6a8ad0', 0.4, wavy=0.4)
    # thành phố tháp trắng (hai lớp) + vòm tròn + cầu vòm
    def city(base, hmin, hmax, step, t, seed):
        r = np.random.default_rng(seed)
        far = lambda col: mixh(col, '#5a7ac0', t)
        S = (far('#f4f8ff'), far('#7a8cc0')); R = (far('#3a4a9a'), far('#6a84d8'), far('#c0d4ff'))
        x = -20.0; prev = None
        while x < W + 40:
            if abs(x - cx) < 150 and t < 0.3:
                x = cx + 160; prev = None; continue
            hh = hmin + r.random() * (hmax - hmin); ww = 26 + r.random() * 30
            if r.random() < 0.22:                                          # vòm tròn
                c.wash(c.rect(x - ww * 0.9, base - hh * 0.4, x + ww * 0.9, base), S[0], S[1], grain=0.12, edge=0.3, side=0.6)
                yb = base - hh * 0.4
                c.relief([(x, yb, ww * 0.9)], (R[0], R[1], R[2], far('#ffffff')), squash=0.9, clip=lambda a, b, y0=yb: (a < y0 + 1).astype(F), grain=0.1)
                c.wash(c.lines([(x, yb - ww * 0.9, x, yb - ww * 0.9 - 14, 1.4)]), far('#f2d070')); c.dots([(x, yb - ww * 0.9 - 14)], far('#fff0b0'), 2.4)
                top = yb
            else:
                tower(c, x, base, ww, hh, S, R, ww * 1.8, None, 3)
                top = base - hh
            for k in range(3):
                if r.random() < 0.6:
                    wy = base - hh * (0.2 + 0.25 * k)
                    c.glow(x - ww * 0.08, wy, 9, '#ffe8b0', 0.7, 1.5)
            if prev and r.random() < 0.45:                                 # cầu vòm nối tháp
                (px, pt) = prev; yb = max(pt, top) + 40
                pts = [(px + (x - px) * q, yb - math.sin(q * math.pi) * 16) for q in np.linspace(0, 1, 14)]
                c.wash(c.lines([(*pts[i], *pts[i + 1], 3.2) for i in range(13)]), S[0], S[1])
            prev = (x, top)
            x += ww * (1.2 + r.random() * 1.6) + step * r.random()
    city(322, 90, 190, 50, 0.5, 1)
    c.haze(200, 330, '#6a8ad0', 0.3, wavy=0.5)
    city(338, 110, 230, 80, 0.2, 2)
    # điện chính giữa dưới trăng
    SW = ('#f4f8ff', '#7a8cc0'); RW = ('#3a4a9a', '#6a84d8', '#c0d4ff')
    c.wash(c.rect(cx - 120, 250, cx + 120, 340), SW[0], SW[1], grain=0.12, edge=0.3)
    yb = 250
    c.relief([(cx, yb, 104)], ('#3a4a9a', '#6a84d8', '#c0d4ff', '#ffffff'), squash=0.9, clip=lambda a, b: (a < yb + 1).astype(F), grain=0.1)
    c.wash(c.lines([(cx + dx, yb, cx + dx * 0.2, yb - 100, 1.2) for dx in (-80, -40, 0, 40, 80)]), '#e0ecff', alpha=0.5)
    c.wash(c.lines([(cx, yb - 104, cx, yb - 132, 2)]), '#f2d070')
    c.wash(c.ells([(cx, yb - 140, 9, 9)]), '#ffffff'); c.wash(c.ells([(cx + 4, yb - 142, 7.5, 7.5)]), '#6a84d8'); c.glow(cx, yb - 140, 40, '#c8dcff', 0.7, 1.6)
    for dx in np.arange(-100, 101, 40):
        pillar(c, cx + dx, 262, 340, 14, cols=SW, flutes=2, cap=1.5)
    arch_win(c, cx, 340, 26, 56, '#ffe9a8', frame=None); c.glow(cx, 314, 60, '#ffd98a', 0.5, 1.8)
    for sg in (-1, 1):
        tower(c, cx + sg * 150, 340, 44, 190, SW, RW, 80, None, 3)
    c.band(280, 345, '#9ab4f0', 0.35, wavy=1.0)
    # hàng cột trắng tiền cảnh + lan can + hồ trăng
    for x in np.arange(100, W, 300):
        if abs(x - cx) < 240:
            continue
        pillar(c, x, 150, BG + 2, 40, cols=SW, flutes=3, cap=1.6)
        c.wash(c.rect(x - 20, 150, x - 14, BG, 1.0), '#ffffff', alpha=0.5)
    for a in np.arange(100, W - 300, 600):
        if abs(a + 150 - cx) < 380:
            continue
        c.wash(c.rect(a - 34, 128, a + 334, 152), SW[0], SW[1], grain=0.12, edge=0.5)
        c.wash(c.polys([[(x, 140), (x + 8, 133), (x + 16, 140), (x + 8, 147)] for x in np.arange(a - 20, a + 320, 32)]), '#6a84d8', alpha=0.8)
        c.wash(c.poly([(a - 40, 128), (a + 150, 96), (a + 340, 128)]), '#fbfdff', '#9aaad8', grain=0.1, edge=0.5)
        c.wash(c.ells([(a + 150, 116, 9, 9)]), '#c0d4ff'); c.wash(c.ells([(a + 154, 114, 7.5, 7.5)]), '#fbfdff')
    x = 0
    while x < W:
        if abs(x - cx) > 130:
            c.wash(c.poly([(x + 8, BG + 4), (x + 9, BG - 20), (x + 6, BG - 25), (x + 9, BG - 30), (x + 17, BG - 30), (x + 20, BG - 25), (x + 17, BG - 20), (x + 18, BG + 4)]), SW[0], SW[1], grain=0.1, edge=0.5, side=0.7)
        x += 26
    for a, b in ((0, cx - 130), (cx + 130, W)):
        c.wash(c.rect(a, BG - 38, b, BG - 29), '#ffffff', '#a8b8e4', edge=0.5)
    for i in range(30):                                                    # pha lê lơ lửng phát sáng
        x, y = rng.random() * W, 150 + rng.random() * 150
        s = 5 + rng.random() * 6
        c.wash(c.poly([(x, y - s * 1.6), (x + s * 0.7, y), (x, y + s * 1.6), (x - s * 0.7, y)]), '#ffffff', '#9ab8ff', edge=0.4); c.glow(x, y, 28, '#a8c8ff', 0.55, 1.8)
    for _ in range(360):
        c.glow(rng.random() * W, 40 + rng.random() * 300, 2 + rng.random() * 3, '#d8e6ff', 0.5, 1.5)
    c.haze(BG - 12, H - 4, FOG, 0.8, wavy=0.3)
    back = c.finish(grain=0.04, sat=1.06)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=242)
    rng = np.random.default_rng(342)
    by = MG + 8
    SW = ('#f8fbff', '#7486bc')
    for i, x in enumerate((220, 820, 1420, 2676, 3276, 3876)):             # cột cẩm thạch đội cầu pha lê
        pillar(m, x, by - 150, by + 8, 50, cols=SW, flutes=3, cap=1.6)
        m.wash(m.rect(x - 25, by - 150, x - 18, by + 4, 1.0), '#ffffff', alpha=0.6)
        m.relief([(x, by - 170, 20)], ('#5a78d8', '#9ab8ff', '#e0ecff', '#ffffff'), grain=0.08)
        m.glow(x, by - 170, 52, '#a8c8ff', 0.6, 1.8); m.glow(x, by - 170, 10, '#ffffff', 0.9, 1.3)
        for k in range(2):
            vine(m, x - 20 + k * 40, by - 128, 30 + rng.random() * 40, rng, stem='#6a8ad0', leaf=('#8ab0f0', '#c8dcff'), flower='#ffffff', sway=5)
    gx = W2 // 2                                                           # hồ trăng giữa sân
    m.wash(m.poly([(gx - 250, by - 14), (gx + 250, by - 14), (gx + 240, by + 12), (gx - 240, by + 12)]), SW[0], SW[1], grain=0.12, edge=0.6, side=0.4)
    m.wash(m.ells([(gx, by - 14, 250, 14)]), '#ffffff', '#b0c0ec', edge=0.5)
    m.wash(m.ells([(gx, by - 14, 232, 10)]), '#3a5ab8', '#1a2f7a')
    m.wash(m.ells([(gx + 20, by - 14, 44, 5)], 0.8), '#f4f8ff', alpha=0.9); m.glow(gx + 20, by - 14, 120, '#c8dcff', 0.45, 1.8, sy=0.2)
    m.wash(m.lines([(gx - 200 + k * 50, by - 13 + (k % 2) * 3, gx - 170 + k * 50, by - 13 + (k % 2) * 3, 1.0) for k in range(9)], 0.4), '#c8dcff', alpha=0.7)
    for sg in (-1, 1):                                                     # tượng nữ thần trăng nâng trăng khuyết
        sx = gx + sg * 340
        m.wash(m.rect(sx - 28, by - 46, sx + 28, by + 8), SW[0], SW[1], grain=0.12, edge=0.6, side=0.7)
        m.wash(m.rect(sx - 33, by - 52, sx + 33, by - 44), '#ffffff', '#a8b8e4', edge=0.5)
        m.wash(m.poly([(sx - 20, by - 52), (sx - 15, by - 110), (sx - 9, by - 128), (sx - 7, by - 144), (sx, by - 150), (sx + 7, by - 144), (sx + 9, by - 128), (sx + 15, by - 110), (sx + 20, by - 52)]), '#fbfdff', '#8496c8', grain=0.1, edge=0.7, side=1.0)
        m.wash(m.lines([(sx + dx, by - 106, sx + dx * 1.5, by - 56, 1.0) for dx in (-8, -2, 5, 10)], 0.4), '#8496c8', alpha=0.6)
        m.wash(m.lines([(sx - 9, by - 126, sx - 20, by - 160, 3), (sx + 9, by - 126, sx + 20, by - 160, 3)]), '#fbfdff', '#8496c8')
        yy, xx, mk = m.ells([(sx, by - 172, 17, 17)], 0.5)
        y2, x2, cut = m.ells([(sx + 7, by - 176, 14, 14)], 0.5)
        mk2 = mk.copy()
        a0, b0 = max(yy, y2), max(xx, x2); a1, b1 = min(yy + mk.shape[0], y2 + cut.shape[0]), min(xx + mk.shape[1], x2 + cut.shape[1])
        mk2[a0 - yy:a1 - yy, b0 - xx:b1 - xx] *= 1 - cut[a0 - y2:a1 - y2, b0 - x2:b1 - x2]
        m.wash((yy, xx, mk2), '#ffffff', grain=0); m.glow(sx, by - 172, 50, '#c8dcff', 0.6, 1.8)
    x = 0
    gaps = [(gx - 420, gx + 420), (1040, 1240), (2860, 3060)]
    while x < W2:                                                          # lan can trắng
        if not any(a < x < b for a, b in gaps):
            m.wash(m.poly([(x + 8, by + 6), (x + 9, by - 22), (x + 6, by - 28), (x + 9, by - 34), (x + 17, by - 34), (x + 20, by - 28), (x + 17, by - 22), (x + 18, by + 6)]), SW[0], SW[1], grain=0.1, edge=0.6, side=0.7)
        x += 26
    for a, b in [(0, 1040), (1240, gx - 420), (gx + 420, 2860), (3060, W2)]:
        m.wash(m.rect(a, by - 44, b, by - 35), '#ffffff', '#a8b8e4', edge=0.6); m.wash(m.rect(a, by - 4, b, by + 12), '#eef3ff', '#8496c8', edge=0.4)
    for i in range(18):                                                    # cụm pha lê + hoa trăng
        x = rng.random() * W2
        if abs(x - gx) < 260:
            continue
        crystal(m, x, by + 6, 26 + rng.random() * 30, ('#5a78d8', '#9ab8ff', '#f0f6ff'), rng, glow='#8ab0ff', n=5)
    for i in range(110):
        x = rng.random() * W2
        if abs(x - gx) < 250:
            continue
        foxglove(m, x, by + 6, 22 + rng.random() * 26, ['#ffffff', '#c8dcff', '#e0c8ff'][i % 3], rng, stem='#6a9ab0')
        if i % 3 == 0:
            m.glow(x, by - 16, 16, '#c8dcff', 0.4, 1.8)
    for _ in range(80):
        x, y = rng.random() * W2, 20 + rng.random() * (MG - 30)
        m.glow(x, y, 6, '#c8dcff', 0.5, 2.0); m.glow(x, y, 1.8, '#ffffff', 0.9, 1.2)
    mid = m.finish(grain=0.04, sat=1.06)
    g = tile_slab(('#b4c2d8', '#c0cce0', '#cad6e8', '#bac6dc'), '#6a7aa0', '#ffffff', '#4a5a84', 67, nx=4, ny=4, checker='#8fa2cc', polish=0.2, rune='#ffffff', cracks=4, debris=False)
    return back, mid, g, dict(sky='#081030', sun='#cadeff', light=1.3, fog=FOG)


# ============================================================
# PHẾ TÍCH (hầm ngục vật phẩm): dựng như hầm mộ nhưng bố cục khác + đổi tông ấm (lửa cam, đá nâu)
# ============================================================
def ruins():
    import battle_bg2 as B
    back, mid, g, info = B.crypt(ruins=True)

    def warm(im):
        a = np.asarray(im).astype(F) / 255
        r, g_, b = a[..., 0], a[..., 1], a[..., 2]
        out = a.copy()
        out[..., 0] = b * 0.92 + g_ * 0.10
        out[..., 1] = g_ * 0.94 + b * 0.04
        out[..., 2] = r * 0.86 + g_ * 0.06
        return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), im.mode)
    h = lambda s: '#%02x%02x%02x' % tuple(int(v) for v in np.asarray(warm(Image.new('RGB', (1, 1), s))).reshape(3))
    return warm(back), warm(mid), warm(g), dict(sky=h(info['sky']), sun='#ffcc94', light=0.9, fog=h(info['fog']))


SCENES = {'hall': hall, 'library': library, 'mine': mine, 'deepMine': deepMine, 'tower': tower_scene, 'moon': moon, 'ruins': ruins}
