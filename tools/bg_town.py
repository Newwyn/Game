# ============================================================
# CẢNH PHỐ & THÀNH: quảng trường · giếng làng · chợ · cổng thành · mặt thành · cầu
# ============================================================
from bgparts import *
from bg_nature import lily, reeds, shroom, dead_tree, foot

DAY = [(0, '#3f86d2'), (0.35, '#74b1ea'), (0.62, '#b6daf4'), (0.82, '#e6f0f0'), (1, '#f1ecd9')]
WALLS = ['#f4ead2', '#ecdcc0', '#f8f0de', '#e4d4b6', '#f0dcc8', '#dfe6e0']
ROOFS = ['#c8603e', '#b2503a', '#d0744a', '#7a8fb0', '#a84a3c', '#5f7f9a', '#8a5a7a']
AWN = [('#c0392b', '#f6ecd8'), ('#2d6fb3', '#f6ecd8'), ('#2f8f5a', '#f6ecd8'), ('#d9a032', '#8a2a2a'), ('#7a4a9a', '#f6ecd8')]
S3 = ('#eadfc8', '#8f8377')
R3 = ('#243a78', '#3a5cae', '#86aaea')
HED = ('#2a6048', '#44905a', '#7cc068', '#c6ea86')


def townhouse(c, x, base, w, h, wall_c, roof_c, rng, floors=2, shop=None, far=0.0):
    """Nhà phố nhiều tầng: khung gỗ, cửa sổ có cánh + bồn hoa, mái dốc có cửa mái, biển hiệu / mái hiên."""
    T = (lambda col: mixh(col, '#cfdff0', far)) if far else (lambda col: hx(col))
    rh = h * (0.30 + rng.random() * 0.08)
    top = base - h; wt = top + rh
    c.wash(c.rect(x - w / 2, wt, x + w / 2, base), T(wall_c), T(mixh(wall_c, '#7a6a5c', 0.4)), grain=0.12, edge=0.3, side=0.4)
    fh = (base - wt) / floors
    beams = [(x - w / 2, wt + fh * k, x + w / 2, wt + fh * k, 2.4) for k in range(floors)] + [(x + sg * w / 2 - sg * 1.5, wt, x + sg * w / 2 - sg * 1.5, base, 3) for sg in (-1, 1)]
    if rng.random() < 0.7:
        beams += [(x - w / 2, wt + 2, x - w * 0.2, wt + fh, 1.8), (x + w / 2, wt + 2, x + w * 0.2, wt + fh, 1.8)]
    c.wash(c.lines(beams), T('#6a4a38'), alpha=0.85)
    ridge_ = w * (0.1 + rng.random() * 0.2)
    c.wash(c.poly([(x - w / 2 - 7, wt + 3), (x - ridge_, top), (x + ridge_, top), (x + w / 2 + 7, wt + 3)]), T(roof_c), T(mixh(roof_c, '#3a2222', 0.45)), grain=0.2, edge=0.5)
    c.wash(c.poly([(x - w / 2 - 7, wt + 3), (x - ridge_, top), (x - ridge_ + w * 0.14, top), (x - w * 0.18, wt + 3)]), T(mixh(roof_c, '#fff0d0', 0.35)), alpha=0.8, grain=0.2)
    tl = []
    for t in np.linspace(0.2, 0.9, max(3, int(rh / 9))):
        hw0 = ridge_ + (w / 2 + 7 - ridge_) * t
        tl.append((x - hw0, top + (rh + 3) * t, x + hw0, top + (rh + 3) * t, 0.9))
    c.wash(c.lines(tl), T(mixh(roof_c, '#2a1414', 0.6)), alpha=0.4)
    c.wash(c.rect(x - w / 2 - 7, wt + 1, x + w / 2 + 7, wt + 5), T(mixh(roof_c, '#2a1414', 0.55)), alpha=0.85)
    dx = x - w * 0.1; q = max(6, w * 0.075)                                # cửa mái
    c.wash(c.poly([(dx - q * 1.5, top + rh * 0.62), (dx, top + rh * 0.62 - q * 1.9), (dx + q * 1.5, top + rh * 0.62)]), T(mixh(roof_c, '#3a2222', 0.4)))
    c.wash(c.rect(dx - q, top + rh * 0.62 - 1, dx + q, top + rh * 0.62 + q * 1.5), T('#f6ecd6'), T('#b9a98e'))
    c.wash(c.rect(dx - q * 0.55, top + rh * 0.62 + 1, dx + q * 0.55, top + rh * 0.62 + q * 1.3), T('#3a4a6a'))
    chx = x + ridge_ + w * 0.12
    c.wash(c.rect(chx, top - 12, chx + 9, top + rh * 0.4), T(mixh(wall_c, '#6a5a50', 0.5)), grain=0.1, side=0.6)
    c.wash(c.rect(chx - 2, top - 15, chx + 11, top - 11), T('#8a7a6c'))
    if rng.random() < 0.45:
        for k in range(5):
            c.glow(chx + 5 + k * 3 + rng.random() * 4, top - 22 - k * 12, 8 + k * 3, '#ffffff', 0.26 - k * 0.04, 1.6)
    nw = max(2, int(w / 34))
    for f in range(floors):
        fy = wt + fh * f
        ground_f = (f == floors - 1)
        for k in range(nw):
            wx = x - w / 2 + w * (k + 0.5) / nw
            if ground_f and (k == nw // 2 or shop):
                continue
            ww, wh = min(9, w / nw * 0.26), fh * 0.46
            y0 = fy + fh * 0.24
            c.wash(c.rect(wx - ww - 1.4, y0 - 1.4, wx + ww + 1.4, y0 + wh + 1.4), T('#fff8e8'), alpha=0.9)
            c.wash(c.rect(wx - ww, y0, wx + ww, y0 + wh), T('#3a4a6a'), grain=0.05)
            c.wash(c.rect(wx - ww, y0, wx - 1, y0 + wh * 0.45), T('#9fc4e6'), alpha=0.7)
            c.wash(c.lines([(wx, y0, wx, y0 + wh, 0.9), (wx - ww, y0 + wh * 0.5, wx + ww, y0 + wh * 0.5, 0.9)]), T('#fff8e8'), alpha=0.85)
            sc = T(['#4a7a5a', '#8a4a3a', '#3a5a8a', '#7a5a34'][int(rng.random() * 4)])
            for sg in (-1, 1):
                c.wash(c.rect(wx + sg * (ww + 1.5), y0, wx + sg * (ww + 1.5 + ww * 0.7), y0 + wh), sc, alpha=0.9)
            if rng.random() < 0.6:
                c.wash(c.rect(wx - ww - 2, y0 + wh + 1, wx + ww + 2, y0 + wh + 5), T('#7a5236'))
                cl = [(wx - ww + j * ww * 0.5, y0 + wh - 1, 3.2) for j in range(5)]
                foliage(c, cl, [T(k_) for k_ in HED], rng, grain=0.04)
                c.dots([(wx - ww + j * ww * 0.5, y0 + wh - 3 - (j % 2)) for j in range(5)], T(['#ff7f9c', '#ffd85a', '#ffffff', '#c9a0ff'][int(rng.random() * 4)]), 1.6)
    dh = fh * 0.72
    if shop:
        a, b_ = shop
        c.wash(c.rect(x - w * 0.42, base - dh, x + w * 0.42, base), T('#5a4030'), T('#2e2018'), grain=0.1)
        c.wash(c.rect(x - w * 0.38, base - dh + 4, x - w * 0.06, base - 8), T('#b8d4ec'), T('#6f94b8'), edge=0.4)
        c.wash(c.rect(x + w * 0.04, base - dh + 4, x + w * 0.36, base), T('#7a5236'), T('#4a2f20'), edge=0.5)
        n = 7
        sw = (w + 16) / n
        for k in range(n):
            x0 = x - w / 2 - 8 + k * sw
            c.wash(c.poly([(x0 + 2, base - dh - 6), (x0 + sw + 2, base - dh - 6), (x0 + sw - 1, base - dh + 12), (x0 - 1, base - dh + 12)]), T(a if k % 2 == 0 else b_), T(mixh(a if k % 2 == 0 else b_, '#402020', 0.3)), grain=0.1)
            c.wash(c.ells([(x0 + sw / 2 - 1, base - dh + 12, sw / 2, 4)]), T(a if k % 2 == 0 else b_))
    else:
        dw = min(11, w * 0.12)
        c.wash(c.rect(x - dw - 2, base - dh - 2, x + dw + 2, base), T('#fff8e8'), alpha=0.8)
        c.wash(c.rect(x - dw, base - dh, x + dw, base), T('#7a5236'), T('#4a2f20'), edge=0.5)
        c.wash(c.ells([(x, base - dh, dw, dw * 0.8)]), T('#7a5236'))
        c.dots([(x + dw * 0.55, base - dh * 0.5)], T('#e8c060'), 1.4)
        c.wash(c.rect(x - dw - 6, base - 4, x + dw + 6, base), T('#cfc4b2'), T('#93897c'))
    if rng.random() < 0.5:                                                 # biển hiệu treo
        sx = x + w / 2 + 1; sy = wt + fh * (floors - 1) + 6
        c.wash(c.lines([(sx - 2, sy, sx + 22, sy, 1.8)]), T('#3a3742'))
        col = T(['#d8b250', '#8a4a3a', '#3a6a8a', '#4a7a5a'][int(rng.random() * 4)])
        c.wash(c.rect(sx + 4, sy + 3, sx + 22, sy + 19), col, mixh(col, '#201008', 0.4), edge=0.6)
        c.wash(c.ells([(sx + 13, sy + 11, 4.5, 4.5)]), T('#fff6e0'), alpha=0.85)


def bunting(c, x0, y0, x1, y1, sag=22, n=None, cols=('#d8483a', '#f2d070', '#3a6ab0', '#4a9a6a', '#f6f0e0')):
    n = n or max(6, int(abs(x1 - x0) / 20))
    pts = [(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + math.sin(t * math.pi) * sag) for t in np.linspace(0, 1, n + 1)]
    c.wash(c.lines([(*pts[i], *pts[i + 1], 0.9) for i in range(n)]), '#5a4a3a')
    for k, col in enumerate(cols):
        fl = [[pts[i], pts[i + 1], ((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2 + 13)] for i in range(n) if i % len(cols) == k]
        if fl:
            c.wash(c.polys(fl), col, mixh(col, '#301818', 0.3), grain=0.05)


def clock_tower(c, x, base, w, h, rng, stone=S3, roof=R3):
    lit, dark = stone
    top = base - h
    c.wash(c.rect(x - w / 2, top, x + w / 2, base), lit, mixh(lit, dark, 0.45), grain=0.14, edge=0.35, side=0.8)
    stone_hint(c, x - w / 2 + 2, top + 4, x + w / 2 - 2, base, rng, dark, '#fff4e2', bw=w * 0.18, bh=w * 0.09)
    for yy in (top + h * 0.3, top + h * 0.62):
        c.wash(c.rect(x - w / 2 - 3, yy, x + w / 2 + 3, yy + 5), mixh(lit, '#ffffff', 0.35), mixh(lit, dark, 0.6), side=0.7)
    cy = top + h * 0.16
    c.wash(c.ells([(x, cy, w * 0.36, w * 0.36)]), '#3a3742'); c.wash(c.ells([(x, cy, w * 0.31, w * 0.31)]), '#fffaf0', '#e0d6c0', edge=0.5)
    c.wash(c.lines([(x + math.cos(a) * w * 0.24, cy + math.sin(a) * w * 0.24, x + math.cos(a) * w * 0.29, cy + math.sin(a) * w * 0.29, 1.3) for a in np.linspace(0, 6.283, 13)[:-1]]), '#3a3742')
    c.wash(c.lines([(x, cy, x + w * 0.03, cy - w * 0.22, 1.8), (x, cy, x + w * 0.15, cy + w * 0.05, 1.8)]), '#3a3742'); c.dots([(x, cy)], '#c9a23a', 2.2)
    for k in range(2):
        arch_win(c, x, top + h * (0.5 + 0.28 * k), w * 0.2, w * 0.5)
    c.wash(c.rect(x - w / 2 - 5, top - 6, x + w / 2 + 5, top + 3), mixh(lit, '#ffffff', 0.3), mixh(lit, dark, 0.5), side=0.7)
    c.wash(c.poly([(x - w / 2 - 7, top - 5), (x - w * 0.14, top - h * 0.34), (x, top - h * 0.52), (x + w * 0.14, top - h * 0.34), (x + w / 2 + 7, top - 5)]), roof[1], roof[0], grain=0.15, edge=0.5)
    c.wash(c.poly([(x - w / 2 - 7, top - 5), (x - w * 0.14, top - h * 0.34), (x, top - h * 0.52), (x - w * 0.1, top - 5)]), roof[2], alpha=0.8)
    c.wash(c.lines([(x, top - h * 0.52, x, top - h * 0.52 - 16, 1.4)]), '#4a4038'); c.dots([(x, top - h * 0.52 - 16)], '#f2d070', 2.6)


def town_back(seed, sun_x=900, feature=None, shops=0.25):
    """Phố thị: trời + núi + phố xa mờ + dãy nhà chính + cây + cờ dây + mép sân lát đá."""
    FOG = '#c4bcab'
    W, H = BACK
    c = Cv(W, H, seed=seed)
    rng = np.random.default_rng(seed * 7 + 1)
    sky(c, DAY, sun=(sun_x, 60, '#fff8dc'), far=12, big=[((x + seed * 370) % W, y, w, h) for x, y, w, h in
        [(380, 170, 560, 140), (1250, 120, 420, 100), (2050, 150, 520, 120), (2950, 110, 600, 110), (3750, 160, 460, 130)]], seed=seed)
    ridge(c, 250, 110, '#9bb9e0', seed + 70, snow=True)
    c.haze(190, 290, '#e4eef2', 0.42, wavy=0.3)
    # phố xa (mờ sương)
    x = -20.0
    while x < W + 40:
        w = 70 + rng.random() * 50; h = 96 + rng.random() * 60
        townhouse(c, x, 300, w, h, WALLS[int(rng.random() * 6)], ROOFS[int(rng.random() * 7)], rng, floors=2 + (h > 130), far=0.42)
        x += w * (0.8 + rng.random() * 0.5)
    for i, tx in enumerate(np.arange(500 + seed * 97 % 400, W, 1150)):
        far = lambda col: mixh(col, '#cfdff0', 0.42)
        tower(c, tx, 300, 56, 190 + rng.random() * 40, (far(S3[0]), far(S3[1])), tuple(far(k) for k in R3), 86, None, 2, flag='#c8372f' if i % 2 else '#e0b03a')
    c.haze(230, 304, '#e8eef0', 0.34, wavy=0.4)
    # dãy nhà chính
    spots = []
    x = 30.0; k = 0
    cx = W // 2
    while x < W + 60:
        w = 104 + rng.random() * 64; h = 150 + rng.random() * 70
        if feature == 'clock' and abs(x - cx) < 130:
            x = cx + 150; continue
        sh = AWN[int(rng.random() * 5)] if rng.random() < shops else None
        townhouse(c, x, BG - 8, w, h, WALLS[int(rng.random() * 6)], ROOFS[int(rng.random() * 7)], rng, floors=2 + (h > 185), shop=sh)
        spots.append((x, BG - 8 - h))
        gap = rng.random()
        if gap < 0.3:
            tree(c, x + w * 0.5 + 44, BG - 6, 120 + rng.random() * 50, 100 + rng.random() * 40, GREEN[k % 2], trunk=('#7a5c44', '#3a2a22'), seed=seed * 50 + k, canopy=0.66, tw=9)
            x += 90
        x += w * (0.98 + rng.random() * 0.2); k += 1
    if feature == 'clock':
        clock_tower(c, cx, BG - 8, 104, 230, rng)
    for i in range(0, len(spots) - 2, 3):                                  # cờ dây giăng phố
        (xa, ya), (xb, yb) = spots[i], spots[i + 2]
        bunting(c, xa, ya + 60, xb, yb + 60, sag=26)
    # vỉa hè: bồn cây, thùng, hoa
    c.wash(c.rect(0, BG - 12, W, H), '#d4cab6', '#bdb29e', grain=0.15)
    c.wash(c.lines([(x, BG - 12, x, BG - 4, 1.0) for x in np.arange(0, W, 26)] + [(0, BG - 4, W, BG - 4, 1.2)]), '#93897c', alpha=0.5)
    for i in range(40):
        x = rng.random() * W
        if i % 4 == 0:
            barrel(c, x, BG - 2, 0.7)
        elif i % 4 == 1:
            crate(c, x, BG - 2, 0.6)
        else:
            c.wash(c.poly([(x - 12, BG - 2), (x - 15, BG - 16), (x + 15, BG - 16), (x + 12, BG - 2)]), '#d98f5c', '#8a4a30', grain=0.2, edge=0.7, side=0.8)
            bush(c, x, BG - 14, 38, 22, HED, seed=seed * 90 + i, n=4)
            c.dots([(x + (rng.random() - 0.5) * 30, BG - 22 - rng.random() * 12) for _ in range(8)], ['#ff7f9c', '#fff2a0', '#c9a0ff'][i % 3], 1.9)
    for i in range(20):
        bird(c, rng.random() * W, 50 + rng.random() * 120, 4 + rng.random() * 4, '#4a5878')
    c.haze(BG - 8, H - 4, FOG, 0.85, wavy=0.2)
    return c, rng, FOG


def monument(m, x, by, ST=('#f0e8d8', '#8e8478')):
    """Tượng đài anh hùng giữa quảng trường."""
    for k, (w, h) in enumerate(((150, 16), (116, 16), (84, 56))):
        y1 = by + 10 - sum(v[1] for v in ((150, 16), (116, 16), (84, 56))[:k])
        m.wash(m.rect(x - w / 2, y1 - h, x + w / 2, y1), ST[0], ST[1], grain=0.14, edge=0.6, side=0.6)
        m.wash(m.rect(x - w / 2 - 3, y1 - h - 3, x + w / 2 + 3, y1 - h + 3), '#fffaf0', '#b9ad9c', edge=0.5)
    top = by + 10 - 88
    m.wash(m.rect(x - 28, top + 14, x + 28, top + 40), '#c9a23a', '#7a5a1a', edge=0.6)
    m.wash(m.lines([(x - 20, top + 22 + j * 6, x + 20 - j * 8, top + 22 + j * 6, 1.1) for j in range(3)]), '#5a4010', alpha=0.8)
    BZ = ('#8ab8a4', '#3a5a52')
    body = [(x - 16, top - 3), (x - 20, top - 44), (x - 26, top - 52), (x - 20, top - 74), (x - 9, top - 80), (x - 8, top - 94), (x, top - 100), (x + 8, top - 94),
            (x + 9, top - 80), (x + 20, top - 74), (x + 24, top - 52), (x + 19, top - 44), (x + 16, top - 3)]
    m.wash(m.poly([(x - 20, top - 72), (x - 44, top - 30), (x - 36, top - 6), (x - 14, top - 8)]), '#7aa894', '#2f4a44', edge=0.7)          # áo choàng
    m.wash(m.poly(body), BZ[0], BZ[1], grain=0.12, edge=0.7, side=0.9)
    m.wash(m.lines([(x + 20, top - 70, x + 46, top - 120, 3.2)]), BZ[0], BZ[1]); m.wash(m.poly([(x + 43, top - 118), (x + 52, top - 150), (x + 50, top - 116)]), '#c4e0d4', '#6a9484')   # kiếm giơ cao
    m.wash(m.lines([(x + 38, top - 112, x + 54, top - 120, 2.6)]), '#c9a23a')
    m.glow(x + 51, top - 148, 16, '#ffffff', 0.6, 1.5)


def well(m, x, by, ST=('#e4dccb', '#857c70'), rng=None):
    m.wash(m.rect(x - 60, by - 44, x + 60, by + 8), ST[0], ST[1], grain=0.2, edge=0.6, side=0.8)
    stone_hint(m, x - 60, by - 44, x + 60, by + 8, rng, ST[1], '#fffaf0', bw=22, bh=11, alpha=0.5)
    m.wash(m.ells([(x, by - 44, 64, 11)]), '#fbf5e8', '#b9ad9c', edge=0.6)
    m.wash(m.ells([(x, by - 44, 50, 7)]), '#1e2a3a', '#3a5a7a')
    for sg in (-1, 1):
        m.wash(m.rect(x + sg * 54 - 5, by - 150, x + sg * 54 + 5, by - 42), '#a67c52', '#4a3424', grain=0.3, side=0.8)
    m.wash(m.poly([(x - 84, by - 142), (x, by - 190), (x + 84, by - 142)]), '#c8603e', '#7a3424', grain=0.25, edge=0.6)
    m.wash(m.poly([(x - 84, by - 142), (x, by - 190), (x - 10, by - 142)]), '#e89a6a', alpha=0.6)
    m.wash(m.lines([(x - 84 * t, by - 142 - 48 * (1 - t) + 2, x + 84 * t, by - 142 - 48 * (1 - t) + 2, 0.9) for t in (0.35, 0.6, 0.85)]), '#5a2418', alpha=0.5)
    m.wash(m.rect(x - 56, by - 128, x + 56, by - 118), '#8a6444', '#4a3424', grain=0.3, edge=0.5)                  # trục quay
    m.wash(m.lines([(x + 56, by - 123, x + 74, by - 123, 3), (x + 74, by - 123, x + 74, by - 106, 3)]), '#3a3742')
    m.wash(m.lines([(x - 6, by - 118, x - 6, by - 74, 1.2)]), '#c8b890')
    m.wash(m.poly([(x - 16, by - 74), (x + 4, by - 74), (x + 1, by - 54), (x - 13, by - 54)]), '#b98858', '#5e3e28', grain=0.3, edge=0.7, side=0.8)
    m.wash(m.lines([(x - 16, by - 68, x + 4, by - 68, 1.6)]), '#4a4a52')
    for dx in (-104, 110):                                                 # xô, chậu
        m.wash(m.poly([(x + dx - 13, by - 22), (x + dx + 13, by - 22), (x + dx + 10, by + 8), (x + dx - 10, by + 8)]), '#b98858', '#5e3e28', grain=0.3, edge=0.7, side=0.8)
        m.wash(m.ells([(x + dx, by - 22, 13, 3.5)]), '#9fdcf4', '#6fb6e0'); m.wash(m.lines([(x + dx - 12, by - 8, x + dx + 12, by - 8, 1.6)]), '#4a4a52')
    if rng is not None:
        cl = [(x - 60 + rng.random() * 40, by + 6 - rng.random() * 30, 4 + rng.random() * 5) for _ in range(12)]
        foliage(m, cl, HED, rng, grain=0.06)


def stall(m, x, by, w, cols, rng, goods=0):
    a, b = cols
    m.wash(m.rect(x - w / 2, by - 50, x + w / 2, by + 8), '#b98858', '#5e3e28', grain=0.3, edge=0.6, side=0.4)
    m.wash(m.lines([(x - w / 2 + k * w / 6, by - 50, x - w / 2 + k * w / 6, by + 8, 1.2) for k in range(1, 6)]), '#5e3e28', alpha=0.6)
    m.wash(m.rect(x - w / 2 - 6, by - 56, x + w / 2 + 6, by - 48), '#d8ac7a', '#8a6444', edge=0.5)
    for sg in (-1, 1):
        m.wash(m.rect(x + sg * (w / 2 - 2) - 3, by - 176, x + sg * (w / 2 - 2) + 3, by + 8), '#8a6444', '#4a3424', grain=0.3, side=0.8)
    n = 8; sw = (w + 36) / n
    for k in range(n):
        x0 = x - w / 2 - 18 + k * sw
        col = a if k % 2 == 0 else b
        m.wash(m.poly([(x0 + 8, by - 190), (x0 + sw + 8, by - 190), (x0 + sw - 2, by - 150), (x0 - 2, by - 150)]), col, mixh(col, '#402020', 0.3), grain=0.12, edge=0.3)
        m.wash(m.ells([(x0 + sw / 2 - 2, by - 150, sw / 2, 7)]), mixh(col, '#402020', 0.15))
    m.wash(m.rect(x - w / 2 - 10, by - 194, x + w / 2 + 26, by - 188), '#8a6444', '#4a3424')
    G = [(('#a82f2a', '#d8483a', '#f27a5c'), ('#b8703a', '#f0a04a', '#ffd27a'), ('#4a7a3a', '#7ab04a', '#b8dc78')),
         (('#6a4a8a', '#9a70c0', '#d0b0f0'), ('#b89a3a', '#e8cc5a', '#fff0a0'), ('#8a3a4a', '#c85a6a', '#f09aa8')),
         (('#8a6a4a', '#c8a070', '#f0d4a8'), ('#a8a8b0', '#d8d8e0', '#ffffff'), ('#3a6a8a', '#6a9ac0', '#a8d0f0'))][goods % 3]
    for k in range(3):                                                    # hàng bày trên quầy
        bx = x - w * 0.3 + k * w * 0.3
        m.wash(m.poly([(bx - 22, by - 56), (bx + 22, by - 56), (bx + 18, by - 68), (bx - 18, by - 68)]), '#d8ac7a', '#8a6444', edge=0.6)
        m.relief([(bx - 13 + j * 9, by - 72 - (j % 2) * 4, 6.5) for j in range(4)] + [(bx - 8 + j * 9, by - 80, 6) for j in range(3)], G[k], grain=0.06)
    for k in range(5):                                                    # đồ treo dưới mái
        hx_ = x - w * 0.36 + k * w * 0.18; L = 14 + rng.random() * 14
        m.wash(m.lines([(hx_, by - 150, hx_, by - 150 + L, 0.9)]), '#5a4a3a')
        if goods % 3 == 2:
            m.wash(m.poly([(hx_ - 5, by - 150 + L), (hx_ + 5, by - 150 + L), (hx_ + 7, by - 150 + L + 16), (hx_ - 7, by - 150 + L + 16)]), ['#c8a070', '#8a6a4a'][k % 2], '#5a4030', edge=0.6)
        else:
            m.relief([(hx_, by - 150 + L + 6, 6)], G[k % 3], grain=0.05)
    m.wash(m.rect(x - 26, by - 38, x + 26, by - 16), '#f6ecd8', '#cdbf9e', edge=0.5)                               # bảng giá
    m.wash(m.lines([(x - 18, by - 31 + j * 6, x + 18 - j * 8, by - 31 + j * 6, 1.1) for j in range(3)]), '#5a4030', alpha=0.8)


def plaza_mid(seed, center):
    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=seed)
    rng = np.random.default_rng(seed * 3 + 2)
    by = MG + 8
    gx = W2 // 2
    if center == 'monument':
        monument(m, gx, by)
        for sx in (gx - 240, gx + 240):
            lamp_post(m, sx, by, 150, lit=False, banner='#2f52a0')
    elif center == 'well':
        well(m, gx, by, rng=rng)
        for dx in (-250, 250):
            m.wash(m.rect(gx + dx - 54, by - 24, gx + dx + 54, by + 8), '#e4dccb', '#857c70', grain=0.2, edge=0.6, side=0.6)      # máng nước
            m.wash(m.ells([(gx + dx, by - 24, 54, 7)]), '#fbf5e8', '#b9ad9c', edge=0.6); m.wash(m.ells([(gx + dx, by - 24, 46, 4.5)]), '#9fdcf4', '#6fb6e0')
    xs = [x for x in np.arange(250, W2, 500) if abs(x - gx) > 330]
    for i, lx in enumerate(xs):
        lamp_post(m, lx, by, 150, lit=False, banner='#b8322e' if i % 2 else '#2f52a0')
    for i, bx in enumerate([x for x in np.arange(500, W2, 500) if abs(x - gx) > 330]):
        if i % 2 == 0:                                                     # ghế gỗ
            m.wash(m.rect(bx - 50, by - 24, bx + 50, by - 17), '#c89a62', '#7a5234', grain=0.3, edge=0.6)
            m.wash(m.rect(bx - 50, by - 46, bx + 50, by - 32), '#c89a62', '#7a5234', grain=0.3, edge=0.6)
            m.wash(m.lines([(bx + sg * 40, by + 8, bx + sg * 40, by - 46, 3.4) for sg in (-1, 1)]), '#3a3742')
        else:                                                              # bồn cây đá
            m.wash(m.rect(bx - 44, by - 22, bx + 44, by + 8), '#e4dccb', '#857c70', grain=0.2, edge=0.6, side=0.6)
            m.wash(m.rect(bx - 48, by - 26, bx + 48, by - 20), '#fbf5e8', '#b9ad9c', edge=0.5)
            cl = [(bx - 36 + j * 9, by - 30 - rng.random() * 6, 8 + rng.random() * 4) for j in range(9)]
            foliage(m, cl, HED, rng, grain=0.06)
            pts = [(bx + (rng.random() - 0.5) * 80, by - 34 - rng.random() * 12) for _ in range(18)]
            m.dots(pts[:9], '#ff7f9c', 2.2); m.dots(pts[9:], '#fff2a0', 2.0)
    for i, x in enumerate((130, 900, 1500, 2640, 3260, 3960)):
        crate(m, x, by); barrel(m, x + 46, by, 0.95)
        if i % 2:
            sack(m, x - 40, by)
    for i, tx in enumerate((390, 1160, 2900, 3620)):                       # cây tỉa trong chậu
        m.wash(m.poly([(tx - 15, by + 8), (tx - 19, by - 16), (tx + 19, by - 16), (tx + 15, by + 8)]), '#d98f5c', '#8a4a30', grain=0.2, edge=0.7, side=0.8)
        m.wash(m.rect(tx - 2, by - 40, tx + 2, by - 16), '#6a4a34')
        cl = [(tx + (rng.random() - 0.5) * 16, by - 44 - j * 7, 15 - abs(j - 3) * 2) for j in range(7)]
        foliage(m, cl, HED, rng, grain=0.06)
    for i in range(9):                                                     # bồ câu
        px = rng.random() * W2; f = 1 if i % 2 else -1
        m.wash(m.ells([(px, by + 3, 7, 4.5)]), '#e8ecf2', '#aab2c0', edge=0.6); m.wash(m.ells([(px + f * 5, by - 2, 3, 3)]), '#f4f6fa')
        m.wash(m.poly([(px - f * 5, by + 2), (px - f * 12, by + 5), (px - f * 5, by + 5)]), '#9aa4b4'); m.dots([(px + f * 7.5, by - 2)], '#e89a4a', 1.0)
    grass(m, 0, W2, by + 12, 4, 10, 400, ['#5f9a56', '#8cc468'], seed=seed)
    return m, rng


def square():
    c, rng, FOG = town_back(11, 900, feature='clock')
    back = c.finish(sat=1.05)
    m, _ = plaza_mid(12, 'monument')
    g = tile_cobble(('#bcb09a', '#cbbfa8', '#d8ccb4', '#c2b4a2'), '#9a8f7e', '#eee6d4', '#746a5c', 23, accent='#c8a890', petals=('#ffc4d4', '#b8a04a'))
    return back, m.finish(sat=1.05), g, dict(sky='#74b1ea', sun='#fff2dc', light=1.55, fog=FOG)


def well_scene():
    c, rng, FOG = town_back(13, 3100, feature=None, shops=0.12)
    back = c.finish(sat=1.05)
    m, _ = plaza_mid(14, 'well')
    g = tile_cobble(('#b8ac94', '#c8bca2', '#d4c8ae', '#beb09c'), '#968a78', '#ece4d0', '#70665a', 27, nx=9, ny=7, accent='#b8a48c', moss='#7c9460', petals=('#b8a04a',))
    return back, m.finish(sat=1.05), g, dict(sky='#74b1ea', sun='#fff2dc', light=1.55, fog=FOG)


def market():
    c, rng, FOG = town_back(17, 2000, feature=None, shops=0.7)
    back = c.finish(sat=1.06)
    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=18)
    rng = np.random.default_rng(55)
    by = MG + 8
    for i, x in enumerate(np.arange(230, W2, 520)):
        stall(m, x + rng.random() * 40, by, 210 + rng.random() * 40, AWN[i % 5], rng, goods=i)
        bx = x + 190
        if i % 2:
            crate(m, bx, by); crate(m, bx + 8, by - 36, 0.8); barrel(m, bx + 50, by)
            m.relief([(bx - 8 + k * 9, by - 68 - (k % 2) * 3, 6.5) for k in range(3)], ('#a82f2a', '#d8483a', '#f27a5c'), grain=0.05)
        else:
            sack(m, bx, by); sack(m, bx + 26, by, 0.85); barrel(m, bx + 66, by, 1.05)
            m.wash(m.poly([(bx - 46, by + 8), (bx - 52, by - 20), (bx - 20, by - 20), (bx - 26, by + 8)]), '#c8a070', '#7a5a34', grain=0.3, edge=0.7)          # giỏ mây
            m.relief([(bx - 44 + k * 8, by - 24, 6) for k in range(3)], ('#4a7a3a', '#7ab04a', '#b8dc78'), grain=0.05)
    for a in (120, 1420, 2460, 3500):
        bunting(m, a, by - 196, a + 420, by - 196, sag=30)
    for i in range(9):
        px = rng.random() * W2; f = 1 if i % 2 else -1
        m.wash(m.ells([(px, by + 3, 7, 4.5)]), '#e8ecf2', '#aab2c0', edge=0.6); m.wash(m.ells([(px + f * 5, by - 2, 3, 3)]), '#f4f6fa')
        m.wash(m.poly([(px - f * 5, by + 2), (px - f * 12, by + 5), (px - f * 5, by + 5)]), '#9aa4b4'); m.dots([(px + f * 7.5, by - 2)], '#e89a4a', 1.0)
    g = tile_cobble(('#b4aa98', '#c4baa6', '#d2c8b4', '#bcae9e'), '#94897a', '#eae2d2', '#6e6458', 29, accent='#c4a488', petals=('#d8483a', '#7ab04a', '#f0a04a'))
    return back, m.finish(sat=1.06), g, dict(sky='#74b1ea', sun='#fff2dc', light=1.55, fog=FOG)


# ============================================================
# CỔNG THÀNH
# ============================================================
def gate():
    FOG = '#b4b0a8'
    W, H = BACK
    c = Cv(W, H, seed=91)
    rng = np.random.default_rng(171)
    sky(c, [(0, '#447fc4'), (0.4, '#7cb0e0'), (0.75, '#c4dcee'), (1, '#e8eaea')], sun=(700, 50, '#fff8e4'), far=0,
        big=[(500, 100, 600, 90), (1700, 70, 520, 70), (2900, 110, 640, 96), (3800, 60, 420, 60)], seed=6)
    S = ('#e2dccf', '#7e7870')
    cx = W // 2
    top = 150
    # tường thành khổng lồ
    wall(c, 0, W, top, BG + 2, S, rng, mw=30, mh=22)
    c.wash(c.rect(0, top + 22, W, top + 34, 3), '#5a544c', alpha=0.3)
    for xb in np.arange(170, W, 340):                                      # trụ ốp + máng xối
        if abs(xb - cx) < 420:
            continue
        c.wash(c.poly([(xb - 26, BG + 2), (xb - 18, top + 30), (xb + 18, top + 30), (xb + 26, BG + 2)]), '#eee8da', '#8a847a', grain=0.14, edge=0.4, side=0.9)
        stone_hint(c, xb - 18, top + 34, xb + 18, BG, rng, S[1], '#fffaf0', bw=16, bh=9)
    for i, xt in enumerate((420, 1180, 2916, 3676)):
        tower(c, xt, BG + 2, 150, 224, S, R3, 112, rng, 3, flag='#c8372f' if i % 2 else '#2f52a0', ivy=HED if i % 2 else None)
    # cổng vòm + song sắt kéo lửng + phố bên trong
    for sg in (-1, 1):
        tower(c, cx + sg * 260, BG + 2, 190, 246, S, R3, 96, rng, 3, flag=None)
    c.wash(c.rect(cx - 170, top - 40, cx + 170, BG + 2), '#e8e2d4', '#8a847a', grain=0.14, edge=0.3)
    stone_hint(c, cx - 170, top - 36, cx + 170, BG, rng, S[1], '#fffaf0', bw=26, bh=13)
    crenels(c, cx - 170, cx + 170, top - 40, 26, 20, '#f4eee2', '#a8a298')
    gw, gh = 230, 210
    go, gi = gothic(cx, BG + 2, gw + 50, gh + 34, 14), gothic(cx, BG + 2, gw, gh, 14)
    c.wash(c.poly(go), '#f6f0e4', '#a09a90', grain=0.15, edge=0.6)
    c.wash(c.lines([(*go[i], *gi[i], 1.4) for i in range(1, len(go) - 1)]), '#6a645c', alpha=0.6)
    c.wash(c.poly(gi), '#cfe0ee', '#e8dcc0', grain=0.1)                                           # ánh sáng phố trong
    in_r = np.random.default_rng(5)
    for k, hx_ in enumerate((cx - 48, cx + 2, cx + 50)):
        townhouse(c, hx_, BG - 6, 48, 84 + k % 2 * 20, WALLS[k], ROOFS[k], in_r, floors=2, far=0.35)
    c.wash(c.rect(cx - 100, BG - 14, cx + 100, BG + 2, 3), '#d8ccb4', alpha=0.8)
    # song sắt: kéo lên một nửa
    bars = [(cx - gw / 2 + 12 + k * 20, BG + 2 - gh, cx - gw / 2 + 12 + k * 20, BG - 96, 3.0) for k in range(11)]
    c.wash(c.lines(bars + [(cx - gw / 2, yv, cx + gw / 2, yv, 3.0) for yv in (BG - 190, BG - 160, BG - 130, BG - 100)]), '#3a3a44', '#1e1e26')
    c.wash(c.polys([[(b[0] - 4, BG - 97), (b[0], BG - 84), (b[0] + 4, BG - 97)] for b in bars]), '#3a3a44')
    c.wash(c.poly([(cx - 12, BG - gh - 60), (cx + 12, BG - gh - 60), (cx + 8, BG - gh - 26), (cx - 8, BG - gh - 26)]), '#fffaf0', '#a8a298', edge=0.7, side=0.8)
    c.wash(c.poly([(cx - 30, 150), (cx + 30, 150), (cx + 30, 186), (cx, 202), (cx - 30, 186)]), '#2f52a0', '#1a2f66', edge=0.6)          # huy hiệu trên cổng
    c.wash(c.poly([(cx, 158), (cx + 12, 172), (cx, 190), (cx - 12, 172)]), '#f2d070', '#c89a3a')
    for sg in (-1, 1):
        banner(c, cx + sg * 150, top - 2, 44, 150, '#b8322e')
        for dx in (175, 350):                                              # đuốc gắn tường
            x = cx + sg * dx
            c.wash(c.poly([(x - 9, 262), (x + 9, 262), (x + 5, 276), (x - 5, 276)]), '#3a3a44', '#1e1e26'); c.wash(c.lines([(x, 276, x, 290, 3)]), '#2a2a32')
            fire(c, x, 262, 0.7, gr=70, gk=0.4)
    for xb in np.arange(120, W, 250):
        if abs(xb - cx) < 480 or rng.random() < 0.3:
            continue
        banner(c, xb, top + 40, 34, 96, '#2f52a0' if int(xb) % 500 < 250 else '#b8322e')
    for i in range(24):
        x0 = rng.random() * W
        if abs(x0 - cx) < 300:
            continue
        cl = [(x0 + (rng.random() - 0.5) * 80, top + 4 + rng.random() ** 1.5 * 60, 6 + rng.random() * 8) for _ in range(16)]
        foliage(c, cl, HED, rng, grain=0.06)
        for k in range(3):
            vine(c, x0 + (rng.random() - 0.5) * 60, top + 30 + rng.random() * 20, 20 + rng.random() * 40, rng, stem='#245a44', leaf=('#3a8050', '#6ab45e'), sway=5)
    for i, xg in enumerate(np.arange(90, W, 150)):                         # lính gác trên mặt thành
        if rng.random() < 0.4 or abs(xg - cx) < 380:
            continue
        gy = top
        c.wash(c.lines([(xg + 8, gy - 44, xg + 8, gy, 1.4)]), '#5a4a3a'); c.wash(c.poly([(xg + 5.5, gy - 44), (xg + 8, gy - 53), (xg + 10.5, gy - 44)]), '#dfe4ea')
        c.wash(c.rect(xg - 6, gy - 22, xg + 6, gy), '#b8322e' if i % 2 else '#2f52a0', grain=0.05)
        c.wash(c.ells([(xg, gy - 27, 5.5, 6)]), '#c9d0d8'); c.wash(c.ells([(xg - 1.4, gy - 28, 2.6, 2.6)]), '#f2f5f8')
    c.wash(c.rect(0, BG - 16, W, BG + 2, 4), '#5a544c', alpha=0.35)
    for i in range(30):
        x = rng.random() * W
        if abs(x - cx) > 130:
            bush(c, x, BG + 6, 60 + rng.random() * 60, 22 + rng.random() * 16, HED, seed=300 + i, n=5)
    for i in range(18):
        bird(c, rng.random() * W, 20 + rng.random() * 90, 4 + rng.random() * 4, '#4a5878')
    c.haze(BG - 8, H - 4, FOG, 0.85, wavy=0.2)
    back = c.finish(sat=1.04)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=92)
    rng = np.random.default_rng(172)
    by = MG + 8
    ST = ('#e8e2d4', '#7e7870')
    for x in (300, 1100, 1700, 2400, 3000, 3800):                          # chậu lửa trên bệ đá
        m.wash(m.rect(x - 34, by - 40, x + 34, by + 8), ST[0], ST[1], grain=0.2, edge=0.6, side=0.8)
        m.wash(m.rect(x - 39, by - 46, x + 39, by - 38), '#fbf7ee', '#a8a298', edge=0.5)
        brazier(m, x, by - 46, 46, 1.0)
    for a, b in ((480, 900), (1280, 1560), (2540, 2840), (3180, 3620)):    # rào chắn gỗ sơn sọc
        m.wash(m.rect(a, by - 52, b, by - 36), '#f2ecd8', '#b8ae96', grain=0.2, edge=0.6)
        m.wash(m.polys([[(x, by - 52), (x + 18, by - 52), (x + 8, by - 36), (x - 10, by - 36)] for x in np.arange(a + 10, b - 16, 44)]), '#c8372f', alpha=0.9)
        m.wash(m.rect(a, by - 22, b, by - 12), '#b98858', '#5e3e28', grain=0.3, edge=0.6)
        for x in (a + 14, (a + b) / 2, b - 14):
            m.wash(m.lines([(x - 16, by + 8, x, by - 60, 5), (x + 16, by + 8, x, by - 60, 5)]), '#a67c52', '#4a3424', grain=0.3)
    for x in (1960, 2140):                                                 # chòi gác sọc
        m.wash(m.rect(x - 30, by - 120, x + 30, by + 8), '#f2ecd8', '#b8ae96', grain=0.2, edge=0.6, side=0.6)
        m.wash(m.polys([[(x - 30, by - 110 + k * 36), (x + 30, by - 128 + k * 36), (x + 30, by - 110 + k * 36), (x - 30, by - 92 + k * 36)] for k in range(4)]), '#2f52a0', alpha=0.85)
        m.wash(m.rect(x - 14, by - 76, x + 14, by + 8), '#2a2430', '#141018')
        m.wash(m.poly([(x - 40, by - 118), (x, by - 152), (x + 40, by - 118)]), '#3a5cae', '#243a78', edge=0.6); m.dots([(x, by - 154)], '#f2d070', 3)
    for x in (700, 1420, 2700, 3420):
        crate(m, x, by); crate(m, x + 44, by, 0.85); barrel(m, x - 44, by)
    for x in (140, 3960):
        m.wash(m.lines([(x, by + 8, x, by - 190, 3.4)]), '#8a6444', '#4a3424'); banner(m, x + 22, by - 186, 36, 80, '#b8322e')
    grass(m, 0, W2, by + 12, 4, 10, 300, ['#5f9a56', '#8cc468'], seed=4)
    mid = m.finish(sat=1.04)
    g = tile_cobble(('#a8a8a8', '#b6b6b4', '#c4c4c0', '#aeaaa6'), '#868684', '#e2e2de', '#5e5e5c', 43, nx=9, ny=7, accent='#9a9690', moss='#7a8a66')
    return back, mid, g, dict(sky='#7cb0e0', sun='#f8f2e8', light=1.45, fog=FOG)


# ============================================================
# MẶT THÀNH (trên tường, nhìn ra đồng bằng lúc chiều)
# ============================================================
def battlement():
    FOG = '#8c8a8e'
    W, H = BACK
    c = Cv(W, H, seed=95)
    rng = np.random.default_rng(175)
    sky(c, [(0, '#3a5a9a'), (0.3, '#6a86c0'), (0.55, '#b0a8c8'), (0.75, '#f0c0a0'), (1, '#ffe0a8')], sun=(2900, 250, '#ffd89a'), far=14,
        big=[(400, 150, 640, 130), (1400, 110, 520, 100), (2300, 170, 600, 120), (3500, 130, 560, 120)], seed=8,
        ccols=('#6a6a9a', '#a894b4', '#f0c4b0', '#fff0dc'), fcols=('#a894b4', '#d8b0b0', '#f8d4b8', '#fff4e0'), far_y=(210, 250))
    c.glow(2900, 262, 500, '#fff0c0', 0.6, 1.6); c.glow(2900, 264, 60, '#ffffff', 0.9, 1.3)
    ridge(c, 272, 120, '#7a84b4', 97, snow=True, fade='#e8c8b0')
    ridge(c, 284, 70, '#6a7aa4', 98, fade='#e0c0a8')
    c.haze(220, 300, '#f0d0b0', 0.4, wavy=0.3)
    # đồng bằng xa: rừng, ruộng, sông, làng
    h1 = roll(c, 296, 26, '#7a9a84', '#94aa84', 61, cell=60)
    tree_row(c, 0, 14, 26, 26, '#5a7c74', '#86a488', 63, conifer=0.5, basefn=lambda x: h1(x) + 3)
    c.wash(c.rect(0, 302, W, 330), '#a8b47c', '#8a9c6c', grain=0.2)
    for i in range(40):                                                   # ô ruộng
        x = rng.random() * W; w = 80 + rng.random() * 160; y = 304 + rng.random() * 20
        c.wash(c.poly([(x, y), (x + w, y - 2), (x + w + 20, y + 6), (x + 14, y + 8)], 0.6), ['#d8c070', '#9ab870', '#c4b060', '#88a868'][i % 4], alpha=0.75, grain=0.15)
    pts = [(x, 316 + math.sin(x * 0.004) * 8 + math.sin(x * 0.011) * 3) for x in np.arange(0, W + 40, 40)]
    c.wash(c.lines([(*pts[i], *pts[i + 1], 6) for i in range(len(pts) - 1)], 0.6), '#f8dcb0')                # sông phản chiếu nắng
    for x in np.arange(200, W, 520):
        for k in range(4):
            house(c, x + k * 26 + rng.random() * 10, 312 + rng.random() * 6, 24, 20, '#f0e4cc', ['#b8604a', '#8a7090'][k % 2], rng, timber=False)
    tree_row(c, 326, 16, 30, 30, '#4a6a62', '#7a9878', 65, conifer=0.4)
    c.haze(280, 334, '#e8c8a8', 0.3, wavy=0.4)
    # tường chắn mái (gần): lỗ châu mai lớn
    S = ('#d8d2cc', '#6e6a6c')
    pt = 300
    c.wash(c.rect(0, pt + 30, W, BG + 2), S[0], S[1], grain=0.16, edge=0.2)
    stone_hint(c, 0, pt + 32, W, BG, rng, S[1], '#fff6ea', bw=30, bh=11, alpha=0.4)
    ms = []
    x = 0
    while x < W:
        ms.append([(x, pt), (x + 62, pt), (x + 62, pt + 32), (x, pt + 32)]); x += 108
    c.wash(c.polys(ms), '#e6e0d8', '#8a8688', grain=0.16, edge=0.5)
    c.wash(c.polys([[(p[0][0], pt), (p[1][0], pt), (p[1][0], pt + 4), (p[0][0], pt + 4)] for p in ms]), '#fff0d8', alpha=0.8)       # mép bắt nắng chiều
    c.wash(c.polys([[(p[1][0] - 9, pt + 4), (p[1][0], pt + 4), (p[1][0], pt + 32), (p[1][0] - 9, pt + 32)] for p in ms], 1.0), '#4a464c', alpha=0.4)
    c.wash(c.lines([(p[0][0] + 31, pt + 9, p[0][0] + 31, pt + 24, 2.4) for p in ms]), '#2a2830', alpha=0.8)
    c.wash(c.rect(0, pt + 30, W, pt + 35), '#f4ece0', alpha=0.7); c.wash(c.rect(0, pt + 35, W, pt + 40, 1.5), '#3a363c', alpha=0.4)
    for i, xt in enumerate((640, 2048, 3456)):                             # tháp canh nhô lên
        tower(c, xt, BG + 2, 170, 200, S, ('#3a2c50', '#5a4878', '#a88cb0') if i != 1 else None, 150, rng, 2, flag='#c8372f', crenel=True)
        if i == 1:
            c.wash(c.lines([(xt, 146, xt, 70, 3)]), '#5a4a3a'); banner(c, xt + 26, 76, 44, 70, '#2f52a0')
    for x in np.arange(300, W, 430):                                       # lửa hiệu trên tường
        if min(abs(x - t) for t in (640, 2048, 3456)) < 160:
            continue
        c.wash(c.poly([(x - 13, pt - 2), (x + 13, pt - 2), (x + 8, pt + 10), (x - 8, pt + 10)]), '#3a3a44', '#1e1e26')
        fire(c, x, pt - 2, 0.8, gr=90, gk=0.45)
    for i in range(30):
        bird(c, rng.random() * W, 60 + rng.random() * 170, 4 + rng.random() * 5, '#2a2a40')
    c.haze(BG - 10, H - 4, FOG, 0.8, wavy=0.2)
    back = c.finish(sat=1.05)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=96)
    rng = np.random.default_rng(176)
    by = MG + 8
    for x in (240, 1240, 2100, 2960, 3860):
        brazier(m, x, by, 80, 1.1)
    for x in (640, 1700, 2540, 3440):                                      # giá giáo + khiên
        m.wash(m.lines([(x - 50, by + 8, x - 50, by - 70, 4), (x + 50, by + 8, x + 50, by - 70, 4), (x - 56, by - 62, x + 56, by - 62, 4), (x - 56, by - 22, x + 56, by - 22, 3.4)]), '#a67c52', '#4a3424', grain=0.3)
        for k in range(5):
            sx = x - 36 + k * 18
            m.wash(m.lines([(sx, by + 6, sx + 4, by - 120 - (k % 2) * 12, 2.2)]), '#8a6444')
            m.wash(m.poly([(sx + 0.5, by - 118 - (k % 2) * 12), (sx + 4.5, by - 136 - (k % 2) * 12), (sx + 8, by - 118 - (k % 2) * 12)]), '#e4e8ee', '#8a929c', edge=0.7)
        col = '#b8322e' if x < 2000 else '#2f52a0'
        m.wash(m.poly([(x + 60, by - 44), (x + 92, by - 44), (x + 92, by - 14), (x + 76, by + 6), (x + 60, by - 14)]), col, mixh(col, '#200818', 0.5), edge=0.8)
        m.wash(m.lines([(x + 76, by - 40, x + 76, by, 2)]), '#e8c060')
    for x in (980, 3160):                                                  # nỏ lớn
        m.wash(m.poly([(x - 60, by + 8), (x - 46, by - 26), (x + 46, by - 26), (x + 60, by + 8)]), '#a67c52', '#4a3424', grain=0.3, edge=0.6, side=0.6)
        m.wash(m.lines([(x - 70, by - 30, x + 70, by - 62, 7)]), '#b98858', '#5e3e28', grain=0.3)
        pts = [(x - 50 + math.sin(t * math.pi) * 14 - t * 20, by - 96 + t * 80) for t in np.linspace(0, 1, 9)]
        m.wash(m.lines([(*pts[i], *pts[i + 1], 5) for i in range(8)]), '#8a6444', '#4a3424')
        m.wash(m.lines([(pts[0][0], pts[0][1], x + 40, by - 56, 1.0), (pts[-1][0], pts[-1][1], x + 40, by - 56, 1.0)]), '#e8e0cc')
        m.wash(m.lines([(x - 76, by - 30, x + 60, by - 60, 2.4)]), '#dfe4ea'); m.wash(m.poly([(x - 90, by - 27), (x - 74, by - 36), (x - 72, by - 25)]), '#e4e8ee', '#8a929c')
        for sg in (-1, 1):
            m.wash(m.ells([(x + sg * 40, by - 4, 13, 13)]), '#6a4a34', '#3a2a20', edge=0.8); m.wash(m.ells([(x + sg * 40, by - 4, 5, 5)]), '#3a2a20')
    for x in (440, 1480, 2340, 3660):
        barrel(m, x, by)
        m.wash(m.lines([(x - 8 + k * 4, by - 34, x - 10 + k * 5, by - 62 - (k % 2) * 6, 1.2) for k in range(5)]), '#c8b890')                    # tên trong thùng
        m.wash(m.polys([[(x - 12 + k * 5, by - 62 - (k % 2) * 6), (x - 10 + k * 5, by - 70 - (k % 2) * 6), (x - 8 + k * 5, by - 62 - (k % 2) * 6)] for k in range(5)]), '#d8483a')
        crate(m, x + 46, by, 0.9)
    for x in (1880, 2760):
        m.wash(m.lines([(x, by + 8, x, by - 196, 3.4)]), '#8a6444', '#4a3424'); banner(m, x + 22, by - 192, 36, 84, '#2f52a0' if x < 2000 else '#b8322e')
    for i in range(14):                                                    # đá đạn xếp chồng
        x = rng.random() * W2
        m.relief([(x + k * 13, by - 2, 7.5) for k in range(4)] + [(x + 6.5 + k * 13, by - 13, 7.5) for k in range(3)] + [(x + 13 + k * 13, by - 24, 7.5) for k in range(2)], ('#4a484e', '#807c84', '#b4b0b4', '#e0dcdc'), grain=0.1)
    mid = m.finish(sat=1.04)
    g = tile_slab(('#96928e', '#a29e9a', '#aeaaa6', '#9a9692'), '#5a5858', '#d4cec8', '#3a383a', 47, nx=5, ny=4, moss='#6a7a5c', cracks=18)
    return back, mid, g, dict(sky='#6a86c0', sun='#ffe8c8', light=1.35, fog=FOG)


# ============================================================
# CẦU
# ============================================================
def bridge():
    FOG = '#9cb6c4'
    W, H = BACK
    c = Cv(W, H, seed=99)
    rng = np.random.default_rng(179)
    sky(c, DAY, sun=(1300, 60, '#fff8dc'), far=12, big=[(600, 160, 560, 130), (1700, 110, 480, 100), (2700, 170, 620, 140), (3700, 120, 460, 100)], seed=9)
    ridge(c, 236, 120, '#9bb9e0', 103, snow=True)
    ridge(c, 250, 70, '#8aaed0', 104)
    c.haze(180, 270, '#e4eef2', 0.42, wavy=0.3)
    h1 = roll(c, 262, 40, '#a4cc88', '#84b470', 71)
    tree_row(c, 0, 22, 40, 44, '#6fa37a', '#9cc890', 73, conifer=0.3, basefn=lambda x: h1(x) + 3)
    # làng ven sông + lâu đài nhỏ
    for x in (300, 1500, 3300):
        for k in range(5):
            house(c, x + k * 54 + rng.random() * 16, 276 + rng.random() * 4, 50 + rng.random() * 14, 44 + rng.random() * 16, WALLS[k % 6], ROOFS[k % 7], rng)
    far = lambda col, t=0.3: mixh(col, '#cfdff0', t)
    S = (far('#f0e6d2'), far('#9a8e86')); R = tuple(far(k, .2) for k in R3)
    kx = 2460
    wall(c, kx - 130, kx + 130, 240, 278, S, rng, mw=7, mh=5, hint=False)
    for dx, hh, ww in ((-130, 70, 26), (130, 64, 26), (-40, 110, 30), (50, 90, 24)):
        tower(c, kx + dx, 278, ww, hh, S, R, ww * 1.4, None, 1, flag='#c8372f' if dx == -40 else None)
    tree_row(c, 280, 30, 56, 70, '#4a865e', '#88c078', 75, conifer=0.25)
    # sông
    wy = 278
    water(c, wy, H, '#8fc4e4', '#3f7ca8', 6, sun=1300, n=520)
    for i in range(60):                                                   # bóng cây / nhà in xuống nước
        x = rng.random() * W; w = 14 + rng.random() * 40
        c.wash(c.poly([(x - w / 2, wy), (x + w / 2, wy), (x + w * 0.3, wy + 14 + rng.random() * 16), (x - w * 0.3, wy + 14 + rng.random() * 16)], 2.5), '#3f7a5e', alpha=0.3)
    # cầu đá vòm phía xa
    by0 = 296; SB = ('#e4dccb', '#857c70')
    for x0 in (420, 2600):
        L = 1000
        c.wash(c.rect(x0, by0 - 26, x0 + L, by0 + 12), SB[0], SB[1], grain=0.2, edge=0.4)
        stone_hint(c, x0, by0 - 24, x0 + L, by0 + 12, rng, SB[1], '#fffaf0', bw=14, bh=7, alpha=0.4)
        for k in range(5):
            ax = x0 + 100 + k * 200
            c.wash(c.ells([(ax, by0 + 14, 74, 30)]), '#5f9ac0', '#3f7ca8')                    # nhịp vòm (thấy nước)
            c.wash(c.ells([(ax, by0 + 14, 74, 30)], 0), '#1e3a50', alpha=0.25)
            c.wash(c.rect(ax + 86, by0 - 26, ax + 114, by0 + 26), SB[0], SB[1], grain=0.2, edge=0.5, side=0.8)   # trụ cầu
            c.wash(c.poly([(ax + 80, by0 + 26), (ax + 100, by0 + 14), (ax + 120, by0 + 26)]), '#cfc6b4')
        c.wash(c.rect(x0 - 10, by0 - 34, x0 + L + 10, by0 - 26), '#fbf5e8', '#b9ad9c', edge=0.5)
        c.wash(c.polys([[(x, by0 - 44), (x + 6, by0 - 44), (x + 6, by0 - 34), (x, by0 - 34)] for x in np.arange(x0, x0 + L, 22)]), '#efe8d8', '#a89e8e')
        c.wash(c.rect(x0 - 10, by0 - 47, x0 + L + 10, by0 - 43), '#fbf5e8')
        for lx in np.arange(x0 + 100, x0 + L, 200):
            c.wash(c.rect(lx - 2, by0 - 74, lx + 2, by0 - 46), '#4a4650'); c.wash(c.rect(lx - 5, by0 - 84, lx + 5, by0 - 72), '#ffe9a8', '#ffc45c', edge=0.8)
        c.wash(c.rect(x0, by0 + 12, x0 + L, by0 + 30, 3), '#2f5a7c', alpha=0.4)                  # bóng cầu
    # thuyền buồm, vịt, lau sậy
    for i, bx in enumerate((1800, 2250, 3780, 200)):
        y = 318 + (i % 2) * 12; s = 1.0 + (i % 2) * 0.3
        c.wash(c.poly([(bx - 34 * s, y - 8 * s), (bx + 34 * s, y - 8 * s), (bx + 24 * s, y + 4 * s), (bx - 26 * s, y + 4 * s)]), '#a67c52', '#4a3424', grain=0.3, edge=0.7)
        c.wash(c.lines([(bx, y - 8 * s, bx, y - 70 * s, 2)]), '#5e3e28')
        c.wash(c.poly([(bx + 2, y - 68 * s), (bx + 34 * s, y - 16 * s), (bx + 2, y - 14 * s)]), '#fffaf0', '#d8ccb4', edge=0.5, grain=0.1)
        c.wash(c.poly([(bx - 2, y - 60 * s), (bx - 24 * s, y - 16 * s), (bx - 2, y - 14 * s)]), ['#e8785a', '#f2d070'][i % 2], ['#a84a3a', '#c89a3a'][i % 2], edge=0.5)
        c.wash(c.poly([(bx - 30 * s, y + 4 * s), (bx + 28 * s, y + 4 * s), (bx + 20 * s, y + 14 * s), (bx - 22 * s, y + 14 * s)], 2), '#2f5a7c', alpha=0.35)
    for i in range(16):
        dx = rng.random() * W; dy = 322 + rng.random() * 20; f = 1 if i % 2 else -1
        c.wash(c.ells([(dx, dy, 7, 3.6)]), '#fbf8f0', '#c4bcae', edge=0.6); c.wash(c.ells([(dx + f * 6, dy - 4, 2.8, 2.8)]), '#fbf8f0'); c.dots([(dx + f * 9, dy - 3.6)], '#f0a03a', 1.2)
        c.wash(c.lines([(dx - 14, dy + 3, dx + 14, dy + 3, 0.9)]), '#e8f4ff', alpha=0.7)
    for i in range(24):
        lily(c, rng.random() * W, 330 + rng.random() * 16, 0.7 + rng.random() * 0.5, rng, flower=rng.random() < 0.4)
    for i in range(22):
        bird(c, rng.random() * W, 60 + rng.random() * 150, 4 + rng.random() * 4, '#4a5878')
    c.haze(BG - 14, H - 4, FOG, 0.8, wavy=0.3)
    back = c.finish(sat=1.06)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=100)
    rng = np.random.default_rng(180)
    by = MG + 8
    ST = ('#efe8d8', '#857c70')
    x = 6
    while x < W2:                                                          # con tiện lan can
        m.wash(m.poly([(x + 8, by + 6), (x + 9, by - 22), (x + 6, by - 28), (x + 9, by - 34), (x + 17, by - 34), (x + 20, by - 28), (x + 17, by - 22), (x + 18, by + 6)]), ST[0], ST[1], grain=0.1, edge=0.6, side=0.7)
        x += 26
    m.wash(m.rect(0, by - 44, W2, by - 34), '#fbf5e8', '#b9ad9c', grain=0.1, edge=0.6)
    m.wash(m.rect(0, by - 4, W2, by + 14), '#e4dac8', '#93897c', grain=0.12, edge=0.4)
    for i, px in enumerate(np.arange(110, W2, 330)):                       # trụ lan can + đèn lồng / chậu hoa
        m.wash(m.rect(px - 16, by - 70, px + 16, by + 12), ST[0], ST[1], grain=0.14, edge=0.6, side=0.8)
        stone_hint(m, px - 16, by - 68, px + 16, by + 10, rng, ST[1], '#fffaf0', bw=12, bh=8, alpha=0.4)
        m.wash(m.rect(px - 21, by - 78, px + 21, by - 68), '#fffaf0', '#b9ad9c', edge=0.6)
        if i % 2 == 0:
            m.wash(m.rect(px - 2.5, by - 150, px + 2.5, by - 78), '#4a4650', '#25232c', side=0.8)
            m.wash(m.poly([(px - 11, by - 150), (px + 11, by - 150), (px + 8, by - 124), (px - 8, by - 124)]), '#ffe9a8', '#ffc45c', edge=0.9)
            m.wash(m.poly([(px - 15, by - 150), (px, by - 164), (px + 15, by - 150)]), '#3a3742'); m.wash(m.rect(px - 10, by - 124, px + 10, by - 120), '#3a3742')
            m.wash(m.lines([(px, by - 150, px, by - 124, 1.0)]), '#3a3742', alpha=0.7)
            m.glow(px, by - 137, 44, '#ffd98a', 0.45, 1.8)
        else:
            bush(m, px, by - 76, 46, 28, HED, seed=int(px), n=4)
            pts = [(px + (rng.random() - 0.5) * 36, by - 86 - rng.random() * 18) for _ in range(14)]
            m.dots(pts[:7], '#ff7f9c', 2.2); m.dots(pts[7:], '#fff2a0', 2.0)
            for k in range(2):
                vine(m, px - 12 + k * 22, by - 74, 20 + rng.random() * 22, rng, stem='#245a44', leaf=('#3a8050', '#6ab45e'), flower='#ff9ab4', sway=4)
    for x in (560, 1900, 3200):
        crate(m, x, by + 10); barrel(m, x + 46, by + 10, 0.95); sack(m, x - 38, by + 10)
    for x in (1240, 2560):                                                 # cần câu + xô cá
        m.wash(m.lines([(x, by - 40, x + 70, by - 190, 2)]), '#8a6444'); m.wash(m.lines([(x + 70, by - 190, x + 78, by - 60, 0.7)]), '#f0f4f8', alpha=0.7)
        m.wash(m.poly([(x - 34, by - 12), (x - 8, by - 12), (x - 11, by + 12), (x - 31, by + 12)]), '#b98858', '#5e3e28', grain=0.3, edge=0.7, side=0.8)
        m.wash(m.ells([(x - 21, by - 12, 13, 3.5)]), '#9fdcf4', '#6fb6e0')
    for i in range(7):                                                     # hải âu đậu lan can
        px = 200 + i * 560 + rng.random() * 120; f = 1 if i % 2 else -1
        m.wash(m.ells([(px, by - 50, 9, 5.5)]), '#fbf8f0', '#b4b8c4', edge=0.6); m.wash(m.ells([(px + f * 7, by - 56, 3.6, 3.6)]), '#fffdf6')
        m.wash(m.poly([(px - f * 6, by - 51), (px - f * 16, by - 47), (px - f * 6, by - 47)]), '#8a94a4'); m.wash(m.poly([(px + f * 10, by - 57), (px + f * 16, by - 55), (px + f * 10, by - 54)]), '#f0a03a')
    mid = m.finish(sat=1.05)
    g = tile_planks(('#a88c66', '#b4986e', '#9c8058', '#bca27a'), '#4a3a2a', '#dcc8a0', 37)
    return back, mid, g, dict(sky='#74b1ea', sun='#fff4de', light=1.55, fog=FOG)


SCENES = {'square': square, 'well': well_scene, 'market': market, 'gate': gate, 'battlement': battlement, 'bridge': bridge}
