# ============================================================
# CẢNH NGOÀI TRỜI: làng · đồng lúa · đường cái · tiền đồn · trại goblin · đầm lầy · rừng tiên
# ============================================================
from bgparts import *

DAY = [(0, '#3f86d2'), (0.35, '#74b1ea'), (0.62, '#b6daf4'), (0.82, '#e6f0f0'), (1, '#f1ecd9')]
BIG = [(380, 196, 560, 150), (1250, 150, 420, 110), (2050, 120, 520, 100), (2950, 185, 640, 160), (3750, 150, 460, 120), (800, 95, 300, 60), (3350, 80, 280, 56)]


def foot(c, fog, k=0.8, y=None):
    c.haze((BG - 18) if y is None else y, c.h - 6, fog, k, wavy=0.3)


def cart(c, x, base, hay=True, s=1.0):
    c.wash(c.poly([(x - 46 * s, base - 22 * s), (x + 46 * s, base - 22 * s), (x + 40 * s, base - 44 * s), (x - 52 * s, base - 46 * s)]), '#b98858', '#5e3e28', grain=0.3, edge=0.7, side=0.5)
    c.wash(c.lines([(x - 50 * s + k * 16 * s, base - 46 * s, x - 46 * s + k * 15 * s, base - 22 * s, 1.4) for k in range(7)]), '#5e3e28', alpha=0.7)
    c.wash(c.lines([(x + 44 * s, base - 30 * s, x + 86 * s, base - 14 * s, 3 * s)]), '#8a6444', '#5e3e28')
    if hay:
        c.relief([(x - 28 * s + k * 18 * s, base - 54 * s - (k % 2) * 6 * s, 15 * s) for k in range(4)], ('#a8843a', '#d8b250', '#f2d878', '#fff0a8'), grain=0.35)
    for wx in (x - 28 * s, x + 26 * s):
        c.wash(c.ells([(wx, base - 12 * s, 15 * s, 15 * s)]), '#6a4a34', '#3a2a20', edge=0.8)
        c.wash(c.ells([(wx, base - 12 * s, 10.5 * s, 10.5 * s)]), '#c9a070', '#8a6444')
        c.wash(c.lines([(wx + math.cos(a) * 11 * s, base - 12 * s + math.sin(a) * 11 * s, wx - math.cos(a) * 11 * s, base - 12 * s - math.sin(a) * 11 * s, 1.6) for a in (0, 0.79, 1.57, 2.36)]), '#4a3424')
        c.wash(c.ells([(wx, base - 12 * s, 3 * s, 3 * s)]), '#3a2a20')


def chicken(c, x, base, s=1.0, flip=1, col='#fbf6ea'):
    c.wash(c.ells([(x, base - 7 * s, 8 * s, 6 * s)]), col, mixh(col, '#8a7a6a', 0.5), edge=0.6)
    c.wash(c.poly([(x - flip * 6 * s, base - 9 * s), (x - flip * 14 * s, base - 15 * s), (x - flip * 9 * s, base - 5 * s)]), col, mixh(col, '#8a7a6a', 0.4))
    c.wash(c.ells([(x + flip * 6 * s, base - 13 * s, 4 * s, 4 * s)]), col)
    c.wash(c.poly([(x + flip * 9.5 * s, base - 14 * s), (x + flip * 13 * s, base - 12.5 * s), (x + flip * 9.5 * s, base - 11.5 * s)]), '#e8a03a')
    c.dots([(x + flip * 5 * s, base - 17 * s), (x + flip * 7 * s, base - 17.5 * s)], '#d8402e', 1.8 * s)
    c.dots([(x + flip * 7 * s, base - 13.5 * s)], '#2a2018', 0.9 * s)
    c.wash(c.lines([(x - 2 * s, base - 2 * s, x - 2 * s, base + 2, 1.0), (x + 2 * s, base - 2 * s, x + 2 * s, base + 2, 1.0)]), '#e8a03a')


def scarecrow(c, x, base, s=1.0):
    c.wash(c.lines([(x, base + 2, x, base - 96 * s, 3.4 * s), (x - 40 * s, base - 70 * s, x + 40 * s, base - 70 * s, 3 * s)]), '#8a6444', '#5e3e28')
    c.wash(c.poly([(x - 34 * s, base - 76 * s), (x + 34 * s, base - 76 * s), (x + 30 * s, base - 62 * s), (x + 15 * s, base - 62 * s), (x + 18 * s, base - 26 * s), (x - 18 * s, base - 26 * s), (x - 15 * s, base - 62 * s), (x - 30 * s, base - 62 * s)]),
           '#b8553e', '#6a2a22', grain=0.3, edge=0.7, side=0.5)
    c.wash(c.polys([[(x - 6 * s, base - 50 * s), (x + 5 * s, base - 50 * s), (x + 5 * s, base - 40 * s), (x - 6 * s, base - 40 * s)]]), '#e2c25a', alpha=0.9)
    c.wash(c.lines([(x + sg * 34 * s, base - 69 * s, x + sg * 44 * s, base - 62 * s + k * 4, 1.2) for sg in (-1, 1) for k in range(3)] + [(x + dx, base - 26 * s, x + dx * 1.3, base - 16 * s, 1.2) for dx in range(-14, 15, 5)]), '#e2c25a')
    c.wash(c.ells([(x, base - 88 * s, 11 * s, 11 * s)]), '#ecd9a8', '#b89a62', edge=0.7)
    c.dots([(x - 4 * s, base - 90 * s), (x + 4 * s, base - 90 * s)], '#3a2a20', 1.5 * s)
    c.wash(c.lines([(x - 5 * s, base - 84 * s, x + 5 * s, base - 84 * s, 1.0)]), '#3a2a20')
    c.wash(c.poly([(x - 18 * s, base - 96 * s), (x + 18 * s, base - 96 * s), (x + 9 * s, base - 99 * s), (x + 5 * s, base - 114 * s), (x - 5 * s, base - 114 * s), (x - 9 * s, base - 99 * s)]), '#c9a04a', '#7a5a2a', edge=0.7)


def dead_tree(c, x, base, h, rng, cols=('#6a6a58', '#26261e'), moss=('#4a6a4a', '#7a9a6a'), lean=0.0, w=None):
    """Cây chết xoắn: thân + cành khẳng khiu + rêu rủ."""
    w = w or h * 0.11
    top = base - h * 0.72
    c.wash(c.poly(trunk_pts(x, base, top, w, lean, flare=2.4)), cols[0], cols[1], grain=0.3, edge=0.6, side=0.8)
    tx = x + lean * (base - top) * 0.3
    segs, tips = [], []

    def br(px, py, a, L, wd, d):
        ex, ey = px + math.cos(a) * L, py + math.sin(a) * L
        segs.append((px, py, ex, ey, wd))
        if d > 0:
            for da in (-0.5 - rng.random() * 0.3, 0.35 + rng.random() * 0.4):
                br(ex, ey, a + da, L * 0.62, wd * 0.6, d - 1)
        else:
            tips.append((ex, ey))
    for a, t in ((-2.3, 0.0), (-0.8, 0.0), (-1.55, 0.0), (-2.8, 0.3), (-0.3, 0.38)):
        br(tx - lean * t * 20, top + (base - top) * t, a + (rng.random() - 0.5) * 0.3, h * (0.24 if t == 0 else 0.2), w * 0.42, 2)
    c.wash(c.lines(segs), cols[1], grain=0.1)
    c.wash(c.lines([(a + 0.6, b - 0.6, e + 0.6, f - 0.6, max(0.8, wd * 0.3)) for a, b, e, f, wd in segs[:6]]), cols[0], alpha=0.7)
    if moss:
        for ex, ey in tips[::2]:
            vine(c, ex, ey, 14 + rng.random() * 30, rng, stem=moss[0], leaf=moss, sway=4)


def reeds(c, x0, x1, base, n, rng, hmin=30, hmax=70, cols=('#4e6a3e', '#7a9a52'), cat='#5a3a26'):
    g = [[], []]; heads = []
    for _ in range(n):
        x = x0 + rng.random() * (x1 - x0); h = hmin + rng.random() * (hmax - hmin); l = (rng.random() - 0.5) * h * 0.3
        g[int(rng.random() * 2)].append((x, base + 2, x + l, base - h, 1.3))
        if rng.random() < 0.35:
            heads.append((x + l, base - h + 2, 2.2, 7))
    for gg, col in zip(g, cols):
        if gg:
            c.wash(c.lines(gg), col)
    if heads and cat:
        c.wash(c.ells(heads), cat, mixh(cat, '#000000', 0.3))


def lily(c, x, y, s, rng, flower=True):
    c.wash(c.ells([(x, y, 11 * s, 3.6 * s)]), '#5f9a5a', '#3f7848', edge=0.5)
    c.wash(c.poly([(x, y), (x + 11 * s, y - 2 * s), (x + 11 * s, y + 1.5 * s)]), '#4a6a5c', alpha=0.9)
    if flower:
        c.wash(c.polys([[(x - 3 * s, y - 1), (x - 6 * s + k * 3 * s, y - 8 * s), (x + k * 2 * s - 1 * s, y - 1)] for k in range(3)]), '#ffd0e4', '#f090b8')
        c.dots([(x - 2 * s, y - 4 * s)], '#ffe27a', 1.3 * s)


def shroom(c, x, base, s, cap, glow=None, spots='#f4fff8', stem=('#e6f0e2', '#8aa69a')):
    c.wash(c.poly([(x - 3 * s, base + 2), (x - 2.2 * s, base - 12 * s), (x + 2.2 * s, base - 12 * s), (x + 3 * s, base + 2)]), stem[0], stem[1], side=0.6)
    yb = base - 11 * s
    c.relief([(x, yb, 11 * s)], cap, squash=0.75, clip=lambda yy, xx: (yy < yb + 1).astype(F), grain=0.1)
    c.wash(c.ells([(x, yb, 11 * s, 2.2 * s)]), mixh(cap[0], '#000000', 0.3), alpha=0.8)
    if spots:
        c.dots([(x - 5 * s, yb - 5 * s), (x + 3 * s, yb - 7.5 * s), (x + 6.5 * s, yb - 3 * s)], spots, 1.3 * s)
    if glow:
        c.glow(x, yb - 2 * s, 34 * s, glow, 0.5, 1.8)


# ============================================================
# LÀNG
# ============================================================
def village():
    FOG = '#c4b68e'
    W, H = BACK
    c = Cv(W, H, seed=21)
    rng = np.random.default_rng(101)
    sky(c, DAY, sun=(900, 60, '#fff8dc'), far=12, big=BIG, seed=1)
    ridge(c, 262, 110, '#9bb9e0', 71, snow=True)
    ridge(c, 276, 60, '#8fb4c8', 72, fade='#dcecd8')
    c.haze(210, 300, '#e4eee6', 0.4, wavy=0.3)
    h1 = roll(c, 290, 50, '#a8d08a', '#8cbc76', 3)
    tree_row(c, 0, 26, 46, 60, '#6fa37a', '#9cc890', 5, conifer=0.15, basefn=lambda x: h1(x) + 4)
    for x in (640, 3380):
        windmill(c, x, h1(x) + 6, 0.8, ang=0.3 + x)
    # ruộng bậc màu
    h2 = roll(c, 312, 34, '#d9c86a', '#b8b25a', 7, cell=50)
    h3 = roll(c, 322, 22, '#8cc46c', '#6fae5c', 9, cell=40)
    tree_row(c, 0, 40, 70, 150, '#4f8a62', '#8cc47c', 11, conifer=0.1, basefn=lambda x: h3(x) + 4)
    # nhà làng mái rạ / mái ngói
    walls = ['#f4ead2', '#ecdcc0', '#f8f0de', '#e4d4b6']
    roofs = ['#d8b860', '#c8a850', '#c8603e', '#b2503a', '#d9bc6a']
    x = 60.0
    while x < W:
        w = 70 + rng.random() * 50; h = 74 + rng.random() * 34
        if rng.random() < 0.72:
            house(c, x, 332, w, h, walls[int(rng.random() * 4)], roofs[int(rng.random() * 5)], rng, timber=rng.random() < 0.7)
            x += w * (0.9 + rng.random() * 1.6)
        else:
            tree(c, x, 334, 110 + rng.random() * 40, 100 + rng.random() * 40, GREEN[int(rng.random() * 2)], trunk=('#7a5c44', '#3a2a22'), seed=int(x), canopy=0.66, tw=9)
            x += 90 + rng.random() * 90
    # nhà nguyện có tháp chuông
    cx = 2080
    house(c, cx, 334, 150, 120, '#f6f0e0', '#7a8fb0', rng, timber=False)
    tower(c, cx + 96, 334, 44, 150, ('#f6f0e0', '#a09484'), ('#3a4f7a', '#5a78a8', '#9ab4dc'), 70, rng, 2)
    c.wash(c.lines([(cx + 96, 110, cx + 96, 92, 2), (cx + 90, 99, cx + 102, 99, 2)]), '#f2d070')
    c.wash(c.ells([(cx + 96, 214, 6, 7)]), '#c9a23a', '#7a5a1a')
    # sân làng: hàng rào, đống rơm, dây phơi
    c.wash(c.rect(0, 330, W, H), '#9ccc74', '#84b862', grain=0.15)
    for a, b in ((40, 560), (760, 1500), (1700, 1950), (2260, 2900), (3080, 3700), (3860, 4096)):
        fence(c, a, b, 340, 22, 30, rng=rng)
    for i in range(12):
        haystack(c, rng.random() * W, 342, 44 + rng.random() * 20, 30 + rng.random() * 12)
    for lx in (1560, 2960):
        c.wash(c.lines([(lx, 342, lx, 296, 2.4), (lx + 130, 342, lx + 130, 296, 2.4)]), '#8a6444')
        pts = [(lx + t * 130, 298 + math.sin(t * math.pi) * 8) for t in np.linspace(0, 1, 9)]
        c.wash(c.lines([(*pts[i], *pts[i + 1], 1.0) for i in range(8)]), '#5e3e28')
        for i, col in zip((1, 3, 4, 6), ('#f6f0e0', '#d8605a', '#7fb0e0', '#f2d878')):
            c.wash(c.rect(pts[i][0] - 7, pts[i][1], pts[i][0] + 7, pts[i][1] + 18), col, mixh(col, '#5a4a4a', 0.35), edge=0.4)
    undergrowth(c, BG + 8, n_bush=34, n_grass=1300, seed=3, fox=30, nfl=420, flowers=('#ffffff', '#ffe27a', '#ff8fa8'), bh=(20, 38))
    for i in range(20):
        bird(c, rng.random() * W, 60 + rng.random() * 150, 4 + rng.random() * 4, '#4a5878')
    c.wash(c.rect(0, BG - 4, W, H, 4), '#bfa878', alpha=0.75)             # mép đường đất
    foot(c, FOG, 0.8, BG - 8)
    back = c.finish(sat=1.05)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=22)
    rng = np.random.default_rng(102)
    by = MG + 8
    for i, x in enumerate((220, 1250, 2740, 3800)):
        tree(m, x + rng.random() * 80, by, 178 + rng.random() * 26, 180 + rng.random() * 50, GREEN[i % 2], trunk=('#7d5a40', '#2f2220'), seed=40 + i, lean=(rng.random() - 0.5) * 0.4, canopy=0.62, tw=15)
    for a, b in ((0, 150), (330, 1130), (1420, 1800), (2300, 2640), (2900, 3700), (3900, 4096)):
        fence(m, a, b, by, 50, 56, rng=rng)
    for i in range(30):
        bush(m, rng.random() * W2, by + 4, 60 + rng.random() * 70, 24 + rng.random() * 26, GREEN[i % 2], seed=60 + i, n=5)
    cart(m, 620, by, True); cart(m, 3320, by, False)
    for x in (640, 3250):
        sack(m, x + 110, by); sack(m, x + 134, by, 0.8)
    for x in (1000, 1880, 2460, 3560):
        barrel(m, x, by); crate(m, x + 44, by, 0.9)
        m.relief([(x + 34 + k * 9, by - 36 - (k % 2) * 3, 6) for k in range(3)], ('#b8703a', '#f0a04a', '#ffd27a'), grain=0.05)   # bí ngô / cam
    for i, x in enumerate((1560, 2080)):                                  # giếng nước nhỏ / máng
        signpost(m, x, by, 124)
    haystack(m, 2160, by, 80, 54); haystack(m, 440, by, 64, 42)
    for i in range(9):
        chicken(m, 1900 + rng.random() * 500 if i < 5 else 500 + rng.random() * 400, by + 2, 0.9 + rng.random() * 0.3, 1 if i % 2 else -1, '#fbf6ea' if i % 3 else '#c98a52')
    for i in range(60):
        broadleaf(m, rng.random() * W2, by + 6, 14 + rng.random() * 10, ('#3f8a4c', '#74ba58'), rng)
    grass(m, 0, W2, by + 6, 8, 22, 1500, ['#3f8048', '#63a554', '#9bd066'], seed=8)
    for i in range(70):
        foxglove(m, rng.random() * W2, by + 4, 24 + rng.random() * 22, ['#e889c0', '#fff0c8', '#7fb8ff', '#ffb050'][i % 4], rng)
    for i in range(24):
        butterfly(m, rng.random() * W2, 80 + rng.random() * (MG - 100), 4.5 + rng.random() * 3, ['#fff6c0', '#ffd0e4', '#bfe8ff'][i % 3], rng)
    mid = m.finish(sat=1.05)
    g = tile_dirt('#b89e74', '#9a8058', '#d0b88c', 3, tufts='#86a85c', flowers=('#ffffff', '#f2c040', '#e0586a'))
    return back, mid, g, dict(sky='#74b1ea', sun='#fff2dc', light=1.55, fog=FOG)


# ============================================================
# ĐỒNG LÚA
# ============================================================
def field():
    FOG = '#bcbb70'
    W, H = BACK
    c = Cv(W, H, seed=31)
    rng = np.random.default_rng(111)
    sky(c, [(0, '#3a84d4'), (0.35, '#6eb0ec'), (0.62, '#b4dbf4'), (0.82, '#eaf2e6'), (1, '#f8efc8')], sun=(2700, 70, '#fff6d0'), far=14,
        big=[(300, 150, 520, 130), (1050, 200, 640, 170), (1900, 110, 460, 100), (2600, 170, 560, 140), (3500, 190, 620, 160), (1500, 70, 300, 56)], seed=2)
    ridge(c, 268, 90, '#9dbbdc', 81)
    c.haze(215, 300, '#eaf0dc', 0.4, wavy=0.3)
    h1 = roll(c, 292, 44, '#b4d484', '#9cc474', 13)
    tree_row(c, 0, 24, 44, 70, '#74a878', '#a4cc8c', 15, conifer=0.1, basefn=lambda x: h1(x) + 4)
    cols = [('#ecd070', '#d4b450'), ('#a8cc74', '#8cb862'), ('#f2dc84', '#d8bc5c'), ('#c8d878', '#a8c060')]
    hs = []
    for i in range(4):                                                   # ruộng bậc thang nhiều màu
        hs.append(roll(c, 300 + i * 12, 26 - i * 3, cols[i][0], cols[i][1], 17 + i, cell=44 - i * 4))
        if i < 3:
            c.wash(c.lines([(x, hs[i](x) + 3 + j * 4, x + 110, hs[i](x + 110) + 3 + j * 4, 0.8) for x in range(0, W, 110) for j in range(3)]), cols[i][1], alpha=0.5)
    for x in (520, 1700, 3050):
        windmill(c, x, hs[1](x) + 4, 1.0, ang=x * 0.01)
    for x in (1100, 2350, 3700):                                          # nhà kho đỏ + nhà nông
        b = hs[2](x) + 6
        house(c, x, b, 96, 80, '#c8553e', '#8a4a3a', rng, timber=False)
        house(c, x + 90, b, 70, 62, '#f4ead2', '#d8b860', rng)
        tree(c, x - 80, b, 100, 90, GREEN[0], trunk=('#7a5c44', '#3a2a22'), seed=int(x), canopy=0.66, tw=8)
    for i in range(16):
        x = rng.random() * W
        haystack(c, x, hs[3](x) + 10, 40 + rng.random() * 16, 28 + rng.random() * 10)
    tree_row(c, 0, 40, 64, 420, '#4f8a62', '#8cc47c', 19, conifer=0.0, basefn=lambda x: hs[3](x) + 8)
    c.wash(c.rect(0, 326, W, H), '#d8b850', '#b8963c', grain=0.2)
    wheat(c, 0, W, 344, 22, 40, 2600, 4, cols=('#c09a3c', '#e6c65a', '#f8e48c'))
    wheat(c, 0, W, BG + 8, 30, 54, 3200, 5)
    pts = [(rng.random() * W, BG + 4 - rng.random() * 40) for _ in range(260)]
    c.dots(pts[:150], '#e8483a', 2.0); c.dots(pts[150:], '#6f9cf0', 1.8)
    for i in range(26):
        bird(c, rng.random() * W, 50 + rng.random() * 170, 4 + rng.random() * 5, '#4a5878')
    c.glow(2700, 330, 1300, '#fff2b0', 0.25, 1.4, sy=0.08)
    foot(c, FOG, 0.7)
    back = c.finish(sat=1.06)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=32)
    rng = np.random.default_rng(112)
    by = MG + 8
    patches = [(0, 420), (700, 1300), (1620, 2020), (2420, 3080), (3400, 4096)]
    for a, b in patches:
        m.wash(m.rect(a + 30, by - 10, b - 30, by + 6, 8), '#c09a3c', alpha=0.7)
        wheat(m, a, b, by + 4, 50, 96, int((b - a) * 1.6), int(a) + 1, cols=('#b8923a', '#e2c25a', '#f6e08a'), taper=110)
    for x in (560, 2220):
        scarecrow(m, x, by, 1.25)
        for k in range(2):                                              # quạ đậu
            px, py = x + (-48 if k else 44), by - 92
            m.wash(m.ells([(px, py - 5, 7, 4.5)]), '#2a2a34'); m.wash(m.ells([(px + 5, py - 9, 3, 3)]), '#2a2a34')
            m.wash(m.poly([(px + 7.5, py - 9.5), (px + 12, py - 8), (px + 7.5, py - 7)]), '#c9a23a'); m.wash(m.poly([(px - 6, py - 6), (px - 14, py - 2), (px - 6, py - 2)]), '#1a1a22')
    for x in (1460, 3240):                                               # cuộn rơm
        for k, (dx, s) in enumerate(((0, 1.0), (62, 0.8))):
            m.wash(m.ells([(x + dx, by - 26 * s, 28 * s, 28 * s)]), '#f2d878', '#b8923a', grain=0.35, edge=0.8)
            for q in (20, 12, 5):
                m.wash(m.ells([(x + dx, by - 26 * s, q * s, q * s)]), '#c9a23a' if q != 12 else '#fff0a8', alpha=0.55)
    fence(m, 1340, 1600, by, 46, 52, rng=rng); fence(m, 3100, 3380, by, 46, 52, rng=rng)
    grass(m, 0, W2, by + 6, 8, 22, 1300, ['#7f9a48', '#a8b85a', '#d4cc74'], seed=9)
    for i in range(110):                                                 # hoa anh túc + xa cúc
        x = rng.random() * W2; h = 16 + rng.random() * 26; col = ['#e8483a', '#f05a48', '#6f9cf0', '#ffffff'][i % 4]
        m.wash(m.lines([(x, by + 4, x + 2, by + 4 - h, 1.1)]), '#6f9a48')
        m.wash(m.ells([(x + 2, by + 4 - h, 4.2, 3.6)]), col, mixh(col, '#401010', 0.3)); m.dots([(x + 2, by + 4 - h)], '#2a2018' if i % 4 < 2 else '#ffe27a', 1.1)
    for i in range(30):
        butterfly(m, rng.random() * W2, 70 + rng.random() * (MG - 90), 4.5 + rng.random() * 3, ['#fff6c0', '#ffffff', '#ffd27a'][i % 3], rng)
    mid = m.finish(sat=1.06)
    g = tile_grass('#93a052', '#78883e', '#b0b860', '#d8cc7c', '#a89058', 5, blades=('#5c7a34', '#a8b85a', '#e0d480'), flowers=('#e04a4a', '#4a7ae0', '#ffffff', '#f2c040'), nfl=64, dirt_k=0.5)
    return back, mid, g, dict(sky='#6eb0ec', sun='#fff4d2', light=1.6, fog=FOG)


# ============================================================
# ĐƯỜNG CÁI
# ============================================================
def road():
    FOG = '#c2b68e'
    W, H = BACK
    c = Cv(W, H, seed=41)
    rng = np.random.default_rng(121)
    sky(c, DAY, sun=(1500, 60, '#fff8dc'), far=12, big=[(x + 260, y, w, h) for x, y, w, h in BIG[:6]], seed=3)
    ridge(c, 258, 130, '#98b6de', 91, snow=True)
    ridge(c, 276, 70, '#8aaed0', 92)
    c.haze(205, 300, '#e6eee8', 0.42, wavy=0.3)
    h1 = roll(c, 290, 50, '#a4cc88', '#88b874', 23)
    # kinh thành xa trên đồi
    far = lambda col, t=0.45: mixh(col, '#cfdff0', t)
    S = (far('#f0e6d2'), far('#9a8e86')); R = (far('#27407e', .3), far('#3d62b0', .3), far('#7fa4e4', .3))
    kx = 2950; kb = h1(kx) + 8
    wall(c, kx - 170, kx + 170, kb - 38, kb, S, rng, mw=7, mh=5, hint=False)
    for dx, hh, ww in ((-170, 60, 22), (170, 56, 22), (-60, 100, 26), (40, 118, 30), (100, 84, 22), (-110, 76, 20)):
        tower(c, kx + dx, kb, ww, hh, S, R, ww * 1.4, None, 1, flag='#c8372f' if dx == 40 else None)
    tree_row(c, 0, 26, 48, 64, '#6fa37a', '#9cc890', 25, conifer=0.25, basefn=lambda x: h1(x) + 4)
    h2 = roll(c, 314, 30, '#94c874', '#78b460', 27, cell=50)
    for x in (900, 3600):
        windmill(c, x, h2(x) + 4, 0.7, ang=x)
    for x in (420, 1500, 2300):                                           # trang trại ven đường
        b = h2(x) + 6
        house(c, x, b, 84, 70, '#f4ead2', '#c8603e', rng); house(c, x + 78, b, 60, 54, '#ecdcc0', '#d8b860', rng)
        haystack(c, x - 70, b + 2, 40, 28)
    tree_row(c, 0, 50, 90, 96, '#4a865e', '#88c078', 29, conifer=0.3, basefn=lambda x: h2(x) + 6)
    h3 = roll(c, 326, 16, '#e0cc70', '#c4ac54', 30, cell=36)
    wheat(c, 0, W, 338, 14, 26, 2200, 31, cols=('#c09a3c', '#e6c65a', '#f8e48c'))
    c.wash(c.rect(0, 334, W, H, 2), '#98c870', '#80b45e', grain=0.15)
    # tường đá thấp ven đường + cây lớn + cột mốc
    S3 = ('#d9d2c2', '#857c70')
    for a, b in ((0, 700), (900, 1900), (2150, 3100), (3300, 4096)):
        c.wash(c.rect(a, 324, b, 346), S3[0], S3[1], grain=0.25, edge=0.5)
        stone_hint(c, a, 324, b, 346, rng, S3[1], '#fffaf0', bw=14, bh=7, alpha=0.45)
        c.wash(c.rect(a, 322, b, 326), '#f2ecde', alpha=0.8)
    x = 120.0; k = 0
    while x < W:
        tree(c, x, 346, 190 + rng.random() * 70, 200 + rng.random() * 90, GREEN[k % 2], trunk=('#7a5a40', '#33261f'), seed=200 + k, lean=(rng.random() - 0.5) * 0.4, canopy=0.62, tw=16 + rng.random() * 6)
        x += 420 + rng.random() * 380; k += 1
    for x in np.arange(300, W, 760):
        c.wash(c.poly([(x - 9, 348), (x - 8, 318), (x, 310), (x + 8, 318), (x + 9, 348)]), '#e4ded0', '#8e867a', grain=0.2, edge=0.7, side=0.8)
        c.wash(c.lines([(x - 4, 324, x + 4, 324, 1.0), (x - 4, 329, x + 3, 329, 1.0)]), '#6a6258')
    undergrowth(c, BG + 8, n_bush=40, n_grass=1300, seed=6, fox=24, nfl=360, bh=(18, 36))
    for i in range(22):
        bird(c, rng.random() * W, 60 + rng.random() * 150, 4 + rng.random() * 4, '#4a5878')
    c.wash(c.rect(0, BG - 2, W, H, 4), '#bfa878', alpha=0.75)
    foot(c, FOG, 0.8, BG - 8)
    back = c.finish(sat=1.05)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=42)
    rng = np.random.default_rng(122)
    by = MG + 8
    for i, x in enumerate((480, 1900, 3460)):
        tree(m, x + rng.random() * 80, by, 180 + rng.random() * 24, 190 + rng.random() * 40, GREEN[i % 2], trunk=('#7d5a40', '#2f2220'), seed=70 + i, lean=(rng.random() - 0.5) * 0.4, canopy=0.62, tw=15)
    for a, b in ((0, 300), (700, 1500), (2250, 3200), (3700, 4096)):
        fence(m, a, b, by, 46, 58, rng=rng)
    signpost(m, 1060, by, 150, n=3); signpost(m, 2960, by, 140, n=2)
    for x in (1640, 3320):                                               # cột đèn lồng ven đường
        lamp_post(m, x, by, 150, lit=False, cols=('#8a6444', '#4a3424'))
    for i in range(10):
        rock(m, 150 + i * 400 + rng.random() * 200, by + 4, 40 + rng.random() * 50, 18 + rng.random() * 16, seed=600 + i, cols=('#59605a', '#8a9088', '#b8bcb0', '#e0e2d6'), moss=MOSS3)
    cart(m, 2520, by, False)
    c2 = (2440, by - 16)                                                  # bánh xe gãy dựa xe
    m.wash(m.ells([(c2[0], c2[1], 17, 17)]), '#6a4a34', '#3a2a20', edge=0.8); m.wash(m.ells([(c2[0], c2[1], 12, 12)]), '#c9a070', '#8a6444')
    for x in (820, 3840):
        crate(m, x, by); barrel(m, x + 46, by, 0.9); sack(m, x - 40, by)
    for i in range(34):
        bush(m, rng.random() * W2, by + 4, 60 + rng.random() * 70, 22 + rng.random() * 24, GREEN[i % 2], seed=90 + i, n=5)
    for i in range(50):
        broadleaf(m, rng.random() * W2, by + 6, 14 + rng.random() * 10, ('#3f8a4c', '#74ba58'), rng)
    grass(m, 0, W2, by + 6, 8, 24, 1500, ['#3f8048', '#63a554', '#9bd066'], seed=10)
    for i in range(60):
        foxglove(m, rng.random() * W2, by + 4, 24 + rng.random() * 22, ['#fff0c8', '#ffe070', '#e889c0'][i % 3], rng)
    for i in range(20):
        butterfly(m, rng.random() * W2, 80 + rng.random() * (MG - 100), 4.5 + rng.random() * 3, ['#fff6c0', '#ffd0e4', '#bfe8ff'][i % 3], rng)
    mid = m.finish(sat=1.05)
    g = tile_dirt('#b49e76', '#96825a', '#ccb68c', 79, tufts='#8ea660', flowers=('#ffffff', '#f2c040'))
    return back, mid, g, dict(sky='#74b1ea', sun='#fff2d8', light=1.55, fog=FOG)


# ============================================================
# TIỀN ĐỒN
# ============================================================
def outpost():
    FOG = '#b9ad8c'
    W, H = BACK
    c = Cv(W, H, seed=51)
    rng = np.random.default_rng(131)
    sky(c, [(0, '#4f8cc8'), (0.35, '#84b4dc'), (0.62, '#bcd8ea'), (0.82, '#e4ece6'), (1, '#ece4cc')], sun=(3100, 70, '#fff4d8'), far=12,
        big=[(500, 170, 600, 150), (1500, 120, 480, 110), (2400, 190, 560, 150), (3500, 140, 520, 120)], seed=4)
    ridge(c, 250, 150, '#94b0d4', 95, snow=True)
    ridge(c, 272, 90, '#86a6c6', 96, snow=True)
    c.haze(200, 300, '#e2eae4', 0.42, wavy=0.3)
    tree_row(c, 290, 50, 90, 40, '#7fa69c', '#a8c8b4', 33, conifer=0.9)
    c.haze(230, 310, '#dce6d8', 0.4, wavy=0.5)
    tree_row(c, 312, 90, 150, 56, '#4f8272', '#84b090', 35, conifer=0.85)
    c.haze(260, 330, '#d4dcc4', 0.35, wavy=0.5)
    c.wash(c.rect(0, 322, W, H), '#a8a070', '#94885e', grain=0.2)
    # lều trại sau rào
    for i, x in enumerate(np.arange(180, W, 330)):
        x += rng.random() * 120
        tent(c, x, 330, 120 + rng.random() * 50, 70 + rng.random() * 30, flag=['#c8372f', '#2f52a0', None][i % 3], stripes='#c8372f' if i % 4 == 0 else None)
    cxm = W // 2
    tent(c, cxm - 420, 332, 260, 120, cols=('#ecdcb8', '#8a7654'), flag='#e0b03a', stripes='#2f52a0')
    # hàng rào cọc + cổng + chòi canh
    for a, b in ((0, cxm - 110), (cxm + 110, W)):
        palisade(c, a, b, 344, 62, rng)
    for sg in (-1, 1):
        watchtower(c, cxm + sg * 150, 344, 120, 78, flag='#c8372f')
    c.wash(c.rect(cxm - 112, 252, cxm + 112, 266), '#a67c52', '#4a3424', grain=0.3, edge=0.5)
    banner(c, cxm, 268, 40, 52, '#2f52a0')
    for x in (520, 1200, 2900, 3620):
        watchtower(c, x, 344, 100 + rng.random() * 30, 70, flag='#2f52a0' if x % 2 else '#c8372f')
    for xb in np.arange(260, W, 300):                                     # khiên treo trên rào
        if abs(xb - cxm) < 240:
            continue
        col = '#b8322e' if int(xb) % 600 < 300 else '#2f52a0'
        c.wash(c.poly([(xb - 9, 300), (xb + 9, 300), (xb + 9, 314), (xb, 324), (xb - 9, 314)]), col, mixh(col, '#200818', 0.5), edge=0.6)
        c.wash(c.lines([(xb, 302, xb, 320, 1.4)]), '#e8c060')
    for i in range(18):                                                   # cọc chống ngựa trước rào
        x = rng.random() * W
        if abs(x - cxm) < 120:
            continue
        c.wash(c.lines([(x - 16, 350, x + 10, 326, 3), (x + 16, 350, x - 10, 326, 3), (x - 22, 344, x + 22, 344, 3)]), '#9a7450', '#4a3424', grain=0.3)
    undergrowth(c, BG + 8, n_bush=20, n_grass=900, seed=7, nfl=120, bh=(16, 30), cols=[('#2a5244', '#4a7a52', '#7ea860', '#b8d078')], leaf=14)
    for i in range(16):
        bird(c, rng.random() * W, 60 + rng.random() * 140, 4 + rng.random() * 4, '#4a5878')
    foot(c, FOG, 0.85, BG - 14)
    back = c.finish(sat=1.04)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=52)
    rng = np.random.default_rng(132)
    by = MG + 8
    for x in (260, 1360, 2740, 3840):
        brazier(m, x, by, 86, 1.1)
    for x in (700, 2050, 3300):                                           # giá vũ khí
        m.wash(m.lines([(x - 50, by + 2, x - 50, by - 70, 4), (x + 50, by + 2, x + 50, by - 70, 4), (x - 56, by - 62, x + 56, by - 62, 4), (x - 56, by - 22, x + 56, by - 22, 3.4)]), '#a67c52', '#4a3424', grain=0.3)
        for k in range(5):
            sx = x - 36 + k * 18
            m.wash(m.lines([(sx, by, sx + 4, by - 120 - (k % 2) * 12, 2.2)]), '#8a6444')
            m.wash(m.poly([(sx + 0.5, by - 118 - (k % 2) * 12), (sx + 4.5, by - 136 - (k % 2) * 12), (sx + 8, by - 118 - (k % 2) * 12)]), '#e4e8ee', '#8a929c', edge=0.7)
        col = '#b8322e' if x < 2000 else '#2f52a0'
        m.wash(m.ells([(x + 74, by - 20, 20, 22)]), col, mixh(col, '#200818', 0.5), edge=0.8); m.wash(m.ells([(x + 74, by - 20, 6, 6.5)]), '#e8c060', '#a67a2a')
    for a, b in ((930, 1250), (2330, 2640), (3460, 3740)):                # bao cát xếp
        for j in range(3):
            for k, x in enumerate(np.arange(a + j * 18, b - j * 18, 40)):
                m.wash(m.ells([(x + 20, by - 6 - j * 15, 22, 9.5)]), '#e0d0a8', '#8a7654', grain=0.3, edge=0.8)
    for x in (470, 1640, 2880, 3980):
        crate(m, x, by); crate(m, x + 14, by - 36, 0.8); barrel(m, x + 52, by)
    for x in (1080, 2480):                                                # hình nộm tập kiếm
        m.wash(m.lines([(x, by + 2, x, by - 92, 4), (x - 30, by - 66, x + 30, by - 66, 3.4)]), '#a67c52', '#4a3424')
        m.wash(m.ells([(x, by - 50, 17, 24)]), '#e2c878', '#a8843a', grain=0.35, edge=0.8); m.wash(m.ells([(x, by - 88, 11, 11)]), '#e2c878', '#a8843a', grain=0.3, edge=0.8)
        m.wash(m.ells([(x, by - 50, 8, 8)]), '#d8483a'); m.wash(m.ells([(x, by - 50, 3.5, 3.5)]), '#fff6e0')
    for x in (1840, 3120):
        m.wash(m.lines([(x, by + 2, x, by - 176, 3.4)]), '#8a6444', '#4a3424')
        banner(m, x + 20, by - 172, 34, 70, '#b8322e' if x < 2000 else '#2f52a0')
    for i in range(22):
        bush(m, rng.random() * W2, by + 6, 50 + rng.random() * 60, 18 + rng.random() * 18, ('#2a5244', '#4a7a52', '#7ea860', '#b8d078'), seed=120 + i, n=4)
    grass(m, 0, W2, by + 6, 6, 18, 1100, ['#5f8048', '#8aa85a', '#b4c470'], seed=11)
    mid = m.finish(sat=1.04)
    g = tile_dirt('#a08c66', '#84704c', '#b8a47c', 7, tufts='#8a9858', grass_k=0.35, pebbles=90)
    return back, mid, g, dict(sky='#84b4dc', sun='#fff0d4', light=1.5, fog=FOG)


# ============================================================
# TRẠI GOBLIN
# ============================================================
def camp():
    FOG = '#9a8c6a'
    W, H = BACK
    c = Cv(W, H, seed=61)
    rng = np.random.default_rng(141)
    sky(c, [(0, '#6f8a9a'), (0.4, '#a8b4a8'), (0.7, '#d8ccac'), (1, '#e8cc98')], sun=(2300, 150, '#ffe0a0'), far=10,
        big=[(400, 160, 700, 130), (1500, 120, 600, 110), (2700, 170, 760, 140), (3700, 130, 520, 110)], seed=5,
        ccols=('#7f8a94', '#a8aeb0', '#d4d0c4', '#f0e8d4'), fcols=('#a8aeb0', '#c4c4bc', '#e0dccc', '#f4ecd8'))
    ridge(c, 266, 110, '#8a9aa8', 99, fade='#d8d0b8')
    c.haze(205, 300, '#dcd2b4', 0.45, wavy=0.3)
    tree_row(c, 292, 54, 96, 40, '#74887a', '#a4b094', 43, conifer=0.75)
    c.haze(232, 312, '#d0c8a8', 0.42, wavy=0.5)
    tree_row(c, 314, 100, 170, 60, '#46604e', '#7c8e68', 45, conifer=0.7)
    c.haze(262, 332, '#c4b890', 0.4, wavy=0.5)
    c.wash(c.rect(0, 320, W, H), '#948660', '#7e7050', grain=0.2)
    HIDE = [('#b08c62', '#5a3e2a'), ('#a47a54', '#523624'), ('#bc9a70', '#644832')]
    fires = []
    for i, x in enumerate(np.arange(220, W, 430)):
        x += rng.random() * 140
        w, h = 190 + rng.random() * 60, 104 + rng.random() * 36
        tent(c, x, 338, w, h, cols=HIDE[i % 3], door='#1e120c')
        c.wash(c.polys([[(x + sg * w * 0.2 + dx, 338 - h * 0.45 + dy), (x + sg * w * 0.2 + dx + 16, 338 - h * 0.45 + dy + 3), (x + sg * w * 0.2 + dx + 13, 338 - h * 0.45 + dy + 17), (x + sg * w * 0.2 + dx - 2, 338 - h * 0.45 + dy + 13)]
                         for sg, dx, dy in ((-1, 0, 0), (1, -6, 14), (-1, -18, 30))]), '#7a5a3c', alpha=0.7)       # miếng vá da
        for sg in (-1, 1):                                                # sừng / xương đầu lều
            c.wash(c.poly([(x + sg * 5, 338 - h + 2), (x + sg * 30, 338 - h - 34), (x + sg * 22, 338 - h + 4)]), '#f0e6cc', '#a89a7c', edge=0.6)
        fires.append(x + w * 0.62)
    # rào cọc thô + cọc đầu lâu + cột totem
    for a in np.arange(0, W, 520):
        palisade(c, a + 60, a + 60 + 200 + rng.random() * 120, 344, 46, rng, cols=('#8a6a48', '#3a2a1c'), step=15, jag=22)
    for x in np.arange(380, W, 700):
        c.wash(c.rect(x - 9, 232, x + 9, 344), '#8a6444', '#3a2818', grain=0.35, edge=0.6, side=0.8)
        for j, col in enumerate(('#c8483a', '#e8c060', '#4a8a6a')):
            y = 244 + j * 30
            c.wash(c.rect(x - 14, y, x + 14, y + 24), col, mixh(col, '#201008', 0.5), grain=0.3, edge=0.7, side=0.6)
            c.dots([(x - 5, y + 9), (x + 5, y + 9)], '#fff6e0', 2.4); c.dots([(x - 5, y + 9), (x + 5, y + 9)], '#1e120c', 1.1)
            c.wash(c.lines([(x - 6, y + 18, x + 6, y + 18, 1.6)]), '#1e120c')
        c.wash(c.polys([[(x + sg * 14, 250), (x + sg * 34, 236), (x + sg * 14, 262)] for sg in (-1, 1)]), '#8a6444', '#3a2818')
    for i in range(24):                                                   # cọc cắm sọ
        x = rng.random() * W; h = 40 + rng.random() * 30
        c.wash(c.lines([(x, 346, x + 2, 346 - h, 2.4)]), '#6a4a30')
        c.relief([(x + 2, 346 - h - 5, 6)], ('#8a8068', '#c8c0a8', '#f0e8d4')); c.dots([(x, 346 - h - 5), (x + 4.4, 346 - h - 5)], '#1e120c', 1.2)
    for x in fires:                                                       # lửa trại + khói
        for k in range(9):
            c.wash(c.ells([(x + 6 + k * 5 + rng.random() * 10, 300 - k * 22, 12 + k * 4, 9 + k * 3)], 5), '#d8d0c0', alpha=0.20 - k * 0.016)
        campfire(c, x, 346, 0.9, rng)
    for i in range(10):                                                   # đống xương, chiến lợi phẩm
        x = rng.random() * W
        c.relief([(x + (k - 2) * 9, 344 - (k % 2) * 6, 6) for k in range(5)], ('#8a8068', '#c8c0a8', '#f0e8d4'))
    undergrowth(c, BG + 8, n_bush=16, n_grass=800, seed=8, nfl=0, flowers=(), bh=(14, 26), cols=[('#3a4a34', '#5a6a40', '#86904e', '#b0b068')], leaf=8, gcols=('#5a6a40', '#86904e', '#a8a860'))
    for i in range(14):
        bird(c, rng.random() * W, 70 + rng.random() * 120, 5 + rng.random() * 5, '#2a2a30')
    foot(c, FOG, 0.85, BG - 14)
    back = c.finish(sat=1.0)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=62)
    rng = np.random.default_rng(142)
    by = MG + 8
    for x in (200, 1100, 1960, 2900, 3780):                                # cọc đầu lâu + đuốc
        m.wash(m.rect(x - 5, by - 150, x + 5, by + 2), '#8a6444', '#3a2818', grain=0.35, side=0.8)
        m.relief([(x, by - 158, 13)], ('#8a8068', '#c8c0a8', '#f0e8d4'), grain=0.1); m.dots([(x - 5, by - 159), (x + 5, by - 159)], '#1e120c', 2.6)
        m.wash(m.polys([[(x + sg * 9, by - 166), (x + sg * 26, by - 186), (x + sg * 15, by - 160)] for sg in (-1, 1)]), '#f0e6cc', '#a89a7c')
        m.wash(m.lines([(x - 14, by - 122, x + 14, by - 122, 3), (x - 12, by - 122, x - 16, by - 100, 1.2), (x + 12, by - 122, x + 17, by - 104, 1.2)]), '#6a4a30')
        m.dots([(x - 16, by - 98), (x + 17, by - 102)], '#c8483a', 3)
    for x in (560, 1500, 2400, 3340):
        m.wash(m.lines([(x, by + 2, x + 4, by - 84, 3.4)]), '#6a4a30', '#3a2818')
        fire(m, x + 4, by - 84, 0.8, gr=90)
    for a, b in ((700, 1000), (1640, 1860), (2560, 2800), (3460, 3700)):  # chướng ngại cọc chéo
        m.wash(m.lines([(a, by - 14, b, by - 14, 5)]), '#8a6444', '#3a2818', grain=0.3)
        for x in np.arange(a + 12, b, 34):
            m.wash(m.lines([(x - 18, by + 2, x + 16, by - 44, 3.4), (x + 18, by + 2, x - 16, by - 44, 3.4)]), '#9a7450', '#3a2818', grain=0.3)
            m.wash(m.polys([[(x + 13, by - 40), (x + 21, by - 54), (x + 19, by - 38)], [(x - 13, by - 40), (x - 21, by - 54), (x - 19, by - 38)]]), '#d8d0c0')
    for x in (380, 2180):                                                 # nồi hầm trên lửa
        m.wash(m.lines([(x - 32, by + 2, x, by - 78, 3), (x + 32, by + 2, x, by - 78, 3), (x, by - 78, x, by - 44, 1.4)]), '#4a3424')
        campfire(m, x, by, 0.8, rng)
        m.wash(m.ells([(x, by - 34, 21, 15)]), '#4a4a54', '#1e1e26', edge=0.8); m.wash(m.ells([(x, by - 42, 19, 5)]), '#8aa85a', '#5a7a3a')
        for k in range(4):
            m.wash(m.ells([(x + 4 + k * 4, by - 60 - k * 14, 7 + k * 3, 5 + k * 2)], 3), '#e8e4d8', alpha=0.3 - k * 0.05)
    for x in (880, 1760, 3060, 3900):                                     # chiến lợi phẩm
        crate(m, x, by, cols=('#a8805a', '#5a3e28')); sack(m, x + 40, by); sack(m, x + 62, by, 0.8)
        m.dots([(x - 8 + k * 6, by - 37 - (k % 2) * 2) for k in range(4)], '#f2d070', 3)
    for x in (1300, 2700):                                                # trống da
        m.wash(m.poly([(x - 22, by + 2), (x - 26, by - 30), (x + 26, by - 30), (x + 22, by + 2)]), '#b05a3a', '#5a2a1c', grain=0.3, edge=0.7, side=0.7)
        m.wash(m.ells([(x, by - 30, 26, 7)]), '#f0e0b8', '#b89a6a', edge=0.6)
        m.wash(m.lines([(x - 24 + k * 8, by - 28, x - 20 + k * 8, by, 1.0) for k in range(7)]), '#f0e0b8', alpha=0.6)
    for i in range(40):
        x = rng.random() * W2; a = rng.random() * 3.14
        m.wash(m.lines([(x - math.cos(a) * 9, by + 2 - abs(math.sin(a)) * 5, x + math.cos(a) * 9, by + 2, 2.4)]), '#e8e0cc', '#a89a7c')
        m.dots([(x - math.cos(a) * 9, by + 2 - abs(math.sin(a)) * 5), (x + math.cos(a) * 9, by + 2)], '#f0e8d4', 2.2)
    for i in range(18):
        rock(m, rng.random() * W2, by + 4, 20 + rng.random() * 30, 9 + rng.random() * 10, seed=700 + i, cols=('#4a4638', '#7a7460', '#a8a088', '#d0c8b0'))
    grass(m, 0, W2, by + 6, 6, 18, 900, ['#5a6a40', '#86904e', '#a8a860'], seed=12)
    mid = m.finish(sat=1.0)
    g = tile_dirt('#80785a', '#665e42', '#9a9070', 13, tufts='#7a8450', grass_k=0.3, pebbles=100, ruts=False, cracks=10)
    return back, mid, g, dict(sky='#a8b4a8', sun='#ffe2ba', light=1.35, fog=FOG)


# ============================================================
# ĐẦM LẦY
# ============================================================
def swamp():
    FOG = '#6f8a74'
    W, H = BACK
    c = Cv(W, H, seed=71)
    rng = np.random.default_rng(151)
    c.grad([(0, '#5f8078'), (0.35, '#8fae9c'), (0.6, '#bcd0b0'), (0.8, '#a4bea0'), (1, '#86a488')])
    c.glow(2500, 130, 420, '#f6ffd8', 0.55, 1.6); c.glow(2500, 130, 70, '#ffffff', 0.8, 1.4)
    tree_row(c, 262, 60, 110, 46, '#86a898', '#a8c4ac', 53, conifer=0.5)
    c.haze(170, 280, '#c4d8ba', 0.5, wavy=0.5)
    tree_row(c, 286, 100, 170, 64, '#5f8474', '#8aae90', 55, conifer=0.4)
    c.haze(210, 300, '#b4ccac', 0.5, wavy=0.6)
    # mặt nước + bóng cây đổ
    water(c, 290, H, '#7fa08c', '#3f5a4c', 2, shine='#dcecd4', sun=2500)
    for i in range(70):
        x = rng.random() * W; w = 8 + rng.random() * 26
        c.wash(c.poly([(x - w / 2, 290), (x + w / 2, 290), (x + w * 0.3, 330 + rng.random() * 30), (x - w * 0.3, 330 + rng.random() * 30)], 3), '#2f4a40', alpha=0.3)
    c.band(270, 312, '#d4e4c8', 0.55, wavy=1.0)
    # cây chết giữa đầm + đảo cỏ
    x = 100.0; k = 0
    while x < W:
        b = 300 + rng.random() * 34
        c.wash(c.ells([(x, b + 2, 70 + rng.random() * 60, 9)]), '#4f7050', '#3a5840', grain=0.2)
        dead_tree(c, x, b + 2, 190 + rng.random() * 110, rng, cols=('#5a6456', '#232a24'), lean=(rng.random() - 0.5) * 0.7)
        reeds(c, x - 90, x + 90, b + 4, 50, rng, 20, 50)
        x += 260 + rng.random() * 360; k += 1
    for i in range(130):
        lily(c, rng.random() * W, 304 + rng.random() * 42, 0.6 + rng.random() * 0.7, rng, flower=rng.random() < 0.3)
    for i in range(40):
        x = rng.random() * W
        reeds(c, x - 40, x + 40, BG + 6, 26, rng, 26, 64)
    for i in range(30):
        bush(c, rng.random() * W, BG + 8, 70 + rng.random() * 80, 20 + rng.random() * 20, ('#243e36', '#3a5e46', '#5e8658', '#94b470'), seed=140 + i)
    c.band(300, 372, '#c8dcc0', 0.45, wavy=1.0)
    for _ in range(70):                                                   # ma trơi / đom đóm
        x, y = rng.random() * W, 170 + rng.random() * 160
        c.glow(x, y, 9 + rng.random() * 8, '#c8ff9a', 0.5, 2.0); c.glow(x, y, 2.4, '#ffffff', 0.9, 1.2)
    for i in range(10):
        bird(c, rng.random() * W, 60 + rng.random() * 110, 5 + rng.random() * 5, '#34463e')
    foot(c, FOG, 0.8)
    back = c.finish(sat=0.98)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=72)
    rng = np.random.default_rng(152)
    by = MG + 8
    for i, x in enumerate((180, 980, 1700, 2500, 3250, 3920)):
        dead_tree(m, x + rng.random() * 100, by, 170 + rng.random() * 30, rng, cols=('#6a705e', '#22261e'), lean=(rng.random() - 0.5) * 0.8, w=20)
    for x in (620, 2100, 2900):                                           # rễ vòm
        for sg in (-1, 1):
            pts = [(x + sg * (10 + 70 * t), by + 2 - math.sin(t * math.pi) * 44) for t in np.linspace(0, 1, 9)]
            m.wash(m.lines([(*pts[i], *pts[i + 1], 9 - i * 0.7) for i in range(8)]), '#5a6252', '#22261e', grain=0.3)
    for x in (1340, 3560):
        stump(m, x, by, 52, 34, cols=('#7a7862', '#33352a'), moss=('#2f5a44', '#4f8a56', '#94c470'), rng=rng)
    for i in range(46):
        x = rng.random() * W2
        reeds(m, x - 46, x + 46, by + 4, 26, rng, 40, 96)
    for i in range(30):
        bush(m, rng.random() * W2, by + 6, 60 + rng.random() * 70, 20 + rng.random() * 22, ('#243e36', '#3a5e46', '#5e8658', '#94b470'), seed=160 + i, n=5)
    for i in range(22):
        x = rng.random() * W2
        shroom(m, x, by + 2, 0.8 + rng.random() * 0.7, [('#3a6a5a', '#6ab890', '#c4f4d0'), ('#6a4a7a', '#a880c8', '#e0c8f8')][i % 2], glow=['#8affc0', '#c8a0ff'][i % 2])
    for i in range(40):
        broadleaf(m, rng.random() * W2, by + 6, 16 + rng.random() * 12, ('#3a6a4a', '#5e9058'), rng)
    grass(m, 0, W2, by + 6, 8, 24, 1200, ['#3a5e46', '#5e8658', '#86a868'], seed=13)
    m.band(MG - 40, H2 + 14, '#c8dcc0', 0.5, wavy=1.0)
    for _ in range(60):
        x, y = rng.random() * W2, 40 + rng.random() * (MG - 50)
        m.glow(x, y, 8, '#c8ff9a', 0.55, 2.0); m.glow(x, y, 2.2, '#ffffff', 0.9, 1.2)
    mid = m.finish(sat=0.98)
    g = tile_grass('#586c4c', '#40523a', '#70865a', '#8a9c68', '#4c4c3c', 11, blades=('#2f4a34', '#6a8a52', '#94aa68'), flowers=('#d8e8c0',), nfl=16,
                   leaves=('#6a5a34', '#4a4a30'), wet='#7c9a94', dirt_k=0.5)
    return back, mid, g, dict(sky='#5f8078', sun='#d6ecd0', light=1.1, fog=FOG)


# ============================================================
# RỪNG TIÊN (đêm, phát sáng)
# ============================================================
def elf():
    FOG = '#2f6a5e'
    W, H = BACK
    c = Cv(W, H, seed=81)
    rng = np.random.default_rng(161)
    c.grad([(0, '#0c2a3a'), (0.35, '#16485a'), (0.65, '#256a6a'), (1, '#327a68')])
    stars(c, 260, 150, 3, '#d8fff4')
    c.glow(2048, 60, 700, '#8ff0e0', 0.35, 1.5, sy=0.5); c.glow(2048, 70, 60, '#f0fff8', 0.9, 1.3)
    # ba lớp thân cổ thụ khổng lồ
    def trunks(n, wmin, wmax, top_col, bot_col, seed, base, alpha=1.0, houses=False):
        r = np.random.default_rng(seed)
        xs = []
        x = r.random() * 200
        while x < W:
            w = wmin + r.random() * (wmax - wmin)
            pts = [(x - w * 1.5, base + 4), (x - w * 0.8, base - 60), (x - w * 0.55, base - 190), (x - w * 0.5, -10), (x + w * 0.5, -10), (x + w * 0.56, base - 190), (x + w * 0.85, base - 60), (x + w * 1.6, base + 4)]
            c.wash(c.poly(pts, 0.8), top_col, bot_col, alpha=alpha, grain=0.2, edge=0.3, side=0.7)
            c.wash(c.lines([(x + (r.random() - 0.5) * w * 0.8, 0, x + (r.random() - 0.5) * w * 1.3, base, 1.2 + w * 0.012) for _ in range(int(3 + w * 0.05))], 0.6), mixh(bot_col, '#001018', 0.4), alpha=alpha * 0.4)
            xs.append((x, w))
            x += w * 2.2 + (W / n) * (0.6 + r.random() * 0.8)
        return xs
    trunks(16, 46, 80, '#2a6a70', '#3a8478', 1, 330)
    c.haze(0, 340, '#2c7872', 0.5, wavy=0.5)
    t2 = trunks(11, 70, 120, '#1f5458', '#2f7068', 2, 338)
    c.haze(60, 345, '#2a706a', 0.35, wavy=0.6)
    for x in np.arange(120, W, 300):                                      # tán phát sáng trên cao
        c.glow(x + rng.random() * 100, 20, 260, '#5ae0c0', 0.3, 1.6)
    # cầu dây + nhà cây giữa các thân
    for i in range(len(t2) - 1):
        (xa, wa), (xb, wb) = t2[i], t2[i + 1]
        if i % 2:
            continue
        y0 = 150 + rng.random() * 50
        pts = [(xa + wa * 0.5 + t * (xb - wb * 0.5 - xa - wa * 0.5), y0 + math.sin(t * math.pi) * 26) for t in np.linspace(0, 1, 22)]
        c.wash(c.lines([(*pts[k], *pts[k + 1], 3.2) for k in range(21)]), '#7a6a52', '#4a4034')
        c.wash(c.lines([(px, py - 18 + math.sin(k / 21 * math.pi) * 4, px, py, 0.9) for k, (px, py) in enumerate(pts)]), '#a89878', alpha=0.8)
        up = [(px, py - 18 + math.sin(k / 21 * math.pi) * 4) for k, (px, py) in enumerate(pts)]
        c.wash(c.lines([(*up[k], *up[k + 1], 1.2) for k in range(21)]), '#c8b890')
        for k in (5, 11, 16):
            c.glow(up[k][0], up[k][1] + 5, 30, '#ffe6a0', 0.6, 1.8); c.wash(c.ells([(up[k][0], up[k][1] + 5, 3, 4)]), '#fff6d0')
    TH = ('#d8cdb0', '#6a6450')
    for i, (x, w) in enumerate(t2):
        y = 120 + (i % 3) * 36
        c.wash(c.ells([(x, y + 44, w * 1.25, 9)]), '#8a7a5c', '#4a4034', edge=0.6)                     # sàn gỗ quanh thân
        c.wash(c.lines([(x - w * 1.2 + k * w * 0.3, y + 26, x - w * 1.2 + k * w * 0.3, y + 42, 1.2) for k in range(9)] + [(x - w * 1.24, y + 26, x + w * 1.24, y + 26, 1.6)]), '#c8b890')
        hw = w * 0.9
        c.wash(c.rect(x - hw * 0.5, y - 6, x + hw * 0.5, y + 40), TH[0], TH[1], grain=0.2, edge=0.5, side=0.6)
        c.wash(c.poly([(x - hw * 0.72, y - 4), (x - hw * 0.1, y - 52), (x + hw * 0.1, y - 52), (x + hw * 0.72, y - 4)]), '#3f9a8a', '#1f5a58', grain=0.2, edge=0.6)
        c.wash(c.poly([(x - hw * 0.72, y - 4), (x - hw * 0.1, y - 52), (x - hw * 0.02, y - 52), (x - hw * 0.36, y - 4)]), '#7fe0c8', alpha=0.5)
        c.wash(c.poly([(x - 2, y - 52), (x, y - 72), (x + 2, y - 52)]), '#bff4e4')
        for dx in (-hw * 0.24, hw * 0.24):
            arch_win(c, x + dx, y + 30, 11, 24, '#ffe9a8', frame='#8a7a5c'); c.glow(x + dx, y + 18, 34, '#ffd27a', 0.6, 1.8)
    c.haze(120, 348, '#2c6e68', 0.22, wavy=0.5)
    t3 = trunks(6, 120, 180, '#133a40', '#1f5450', 3, 346)
    for x, w in t3:                                                       # nấm bậc thang + rêu sáng + dây đèn trên thân lớn
        for k in range(7):
            sg = -1 if k % 2 else 1; yy = 100 + k * 32 + rng.random() * 12
            px = x + sg * w * (0.5 + (yy > 250) * 0.2)
            c.relief([(px + sg * 12, yy, 15 + rng.random() * 8)], ('#2a8a8a', '#5fd8c8', '#c8fff0'), squash=0.6, clip=lambda a, b, y0=yy: (a < y0 + 1).astype(F), grain=0.1)
            c.glow(px + sg * 12, yy - 4, 44, '#5fe8d0', 0.4, 1.8)
        for k in range(4):
            vine(c, x + (rng.random() - 0.5) * w, 0, 60 + rng.random() * 150, rng, stem='#1f5a50', leaf=('#2f8a70', '#6ad8b0'), flower='#c8fff0', sway=9)
        cl = [(x + (rng.random() - 0.5) * w * 1.6, 346 - rng.random() ** 2 * 120, 6 + rng.random() * 9) for _ in range(26)]
        foliage(c, cl, ('#12403c', '#1f6a5a', '#3aa888', '#8af0cc'), rng, grain=0.06)
    # vòm lá trên cùng
    cl = []
    for x in np.arange(-40, W + 40, 34):
        cl.append((x + rng.random() * 20, -6 + rng.random() * 22, 30 + rng.random() * 14))
        if rng.random() < 0.6:
            cl.append((x + rng.random() * 30, 26 + rng.random() * 30, 20 + rng.random() * 14))
    foliage(c, cl, ('#0a2a30', '#124a48', '#1f7a68', '#5fe0b8'), rng)
    for i in range(46):                                                   # đèn lồng treo
        x = rng.random() * W; L = 40 + rng.random() * 120; col = ['#ffe6a0', '#8ff0e0', '#d0b0ff'][i % 3]
        c.wash(c.lines([(x, 30, x, 30 + L, 0.9)]), '#0a2a30')
        c.wash(c.poly([(x - 5, 30 + L), (x, 30 + L - 7), (x + 5, 30 + L), (x + 4, 30 + L + 11), (x - 4, 30 + L + 11)]), mixh(col, '#ffffff', 0.5), col, edge=0.5)
        c.glow(x, 30 + L + 5, 40, col, 0.55, 1.8)
    # nền rừng: bụi xanh ngọc, nấm sáng, hoa sáng
    EG = [('#0f3a3a', '#1a5a50', '#2f8a6c', '#6ad8a8'), ('#0c3438', '#16524e', '#2a8068', '#5ccca0')]
    for i in range(56):
        bush(c, rng.random() * W, BG + 8, 80 + rng.random() * 100, 28 + rng.random() * 34, EG[i % 2], seed=180 + i)
    for i in range(60):
        x = rng.random() * W; k = i % 3
        shroom(c, x, BG + 6, 1.0 + rng.random() * 1.4, [('#1f7a7a', '#5fd8c8', '#d0fff4'), ('#5a3a8a', '#a880e0', '#e8d4ff'), ('#8a6a2a', '#e8c060', '#fff4c0')][k], glow=['#5fe8d0', '#b890ff', '#ffd27a'][k])
    grass(c, 0, W, BG + 8, 12, 30, 1500, ['#16524e', '#2a8068', '#5ccca0', '#0f3a3a'], seed=14)
    pts = [(rng.random() * W, BG - 2 - rng.random() * 28) for _ in range(420)]
    for i, col in enumerate(('#c8fff0', '#e0c8ff', '#fff4c0')):
        for x, y in pts[i * 140:(i + 1) * 140:3]:
            c.glow(x, y, 9, col, 0.5, 1.8)
        c.dots(pts[i * 140:(i + 1) * 140], col, 1.6)
    c.band(BG - 70, H + 20, '#5fd8c0', 0.22, wavy=1.0)
    for _ in range(420):                                                  # bào tử sáng
        x, y = rng.random() * W, 40 + rng.random() * 300
        c.glow(x, y, 3 + rng.random() * 5, ['#b8ffe0', '#e0d0ff', '#fff0b0'][int(rng.random() * 3)], 0.6, 1.6)
    foot(c, FOG, 0.75)
    back = c.finish(sat=1.08)

    W2, H2 = MID
    m = Cv(W2, H2, opaque=False, seed=82)
    rng = np.random.default_rng(162)
    by = MG + 8
    for x in (160, 1180, 2140, 3060, 3940):                                # rễ cổ thụ uốn vòm
        for sg, sc in ((-1, 1.0), (1, 0.8)):
            pts = [(x + sg * (20 + 120 * sc * t), by + 2 - math.sin(t * math.pi) * 90 * sc) for t in np.linspace(0, 1, 12)]
            m.wash(m.lines([(*pts[i], *pts[i + 1], 20 - i * 1.3) for i in range(11)]), '#2f6a64', '#0f2a30', grain=0.3)
            m.wash(m.lines([(pts[i][0] - 2, pts[i][1] - 5, pts[i + 1][0] - 2, pts[i + 1][1] - 5, 2) for i in range(10)], 0.5), '#6fd8c0', alpha=0.55)
        cl = [(x + (rng.random() - 0.5) * 240, by - rng.random() ** 2 * 90, 5 + rng.random() * 7) for _ in range(20)]
        foliage(m, cl, ('#12403c', '#1f6a5a', '#3aa888', '#8af0cc'), rng, grain=0.06)
    for i, x in enumerate((620, 1660, 2620, 3520)):                        # cột đèn tiên uốn cong
        pts = [(x + math.sin(t * 2.2) * 22, by + 2 - t * 160) for t in np.linspace(0, 1, 12)]
        m.wash(m.lines([(*pts[k], *pts[k + 1], 5 - k * 0.25) for k in range(11)]), '#d8e8dc', '#6a8a84')
        ex, ey = pts[-1]
        hook = [(ex + math.sin(t * 3.0) * 26 * t + t * 10, ey - math.sin(t * 3.14) * 16 + t * 14) for t in np.linspace(0, 1, 8)]
        m.wash(m.lines([(*hook[k], *hook[k + 1], 2.6) for k in range(7)]), '#d8e8dc', '#6a8a84')
        lx, ly = hook[-1]
        col = ['#8ff0e0', '#ffe6a0'][i % 2]
        m.wash(m.lines([(lx, ly, lx, ly + 12, 1.0)]), '#d8e8dc')
        m.wash(m.poly([(lx - 9, ly + 22), (lx, ly + 10), (lx + 9, ly + 22), (lx, ly + 42)]), '#ffffff', col, edge=0.6)
        m.glow(lx, ly + 24, 70, col, 0.6, 1.8)
        vine(m, x + 6, by - 100, 40, rng, stem='#1f5a50', leaf=('#2f8a70', '#6ad8b0'), flower='#c8fff0', sway=5)
    for i in range(30):
        bush(m, rng.random() * W2, by + 6, 60 + rng.random() * 80, 24 + rng.random() * 26, EG[i % 2], seed=200 + i, n=5)
    for i in range(54):
        x = rng.random() * W2; k = i % 3
        shroom(m, x, by + 2, 1.2 + rng.random() * 2.2, [('#1f7a7a', '#5fd8c8', '#d0fff4'), ('#5a3a8a', '#a880e0', '#e8d4ff'), ('#8a6a2a', '#e8c060', '#fff4c0')][k], glow=['#5fe8d0', '#b890ff', '#ffd27a'][k])
    for i in range(60):
        broadleaf(m, rng.random() * W2, by + 6, 16 + rng.random() * 14, ('#1a5a50', '#3aa888'), rng)
    grass(m, 0, W2, by + 6, 10, 28, 1500, ['#16524e', '#2a8068', '#5ccca0'], seed=15)
    for i in range(80):                                                    # hoa chuông phát sáng
        x = rng.random() * W2; col = ['#c8fff0', '#e0c8ff', '#fff4c0', '#a8d8ff'][i % 4]
        foxglove(m, x, by + 4, 26 + rng.random() * 26, col, rng, stem='#2a8068')
        m.glow(x, by - 18, 16, col, 0.35, 1.8)
    for i in range(30):
        x, y = rng.random() * W2, 60 + rng.random() * (MG - 80)
        butterfly(m, x, y, 5 + rng.random() * 3, ['#c8fff0', '#e0c8ff', '#fff4c0'][i % 3], rng); m.glow(x, y, 14, '#c8fff0', 0.4, 1.8)
    for _ in range(90):
        x, y = rng.random() * W2, 30 + rng.random() * (MG - 40)
        m.glow(x, y, 7, '#b8ffe0', 0.5, 2.0); m.glow(x, y, 2, '#ffffff', 0.9, 1.2)
    mid = m.finish(sat=1.08)
    g = tile_grass('#3f6e5c', '#2a4e42', '#54866c', '#6aa888', '#345858', 61, blades=('#1f4a40', '#4a9078', '#7fd0a8'), flowers=('#c8fff0', '#e0c8ff', '#fff4c0'), nfl=54,
                   leaves=None, glow='#8ff0d0', pebbles=16, dirt_k=0.4)
    return back, mid, g, dict(sky='#0c2a3a', sun='#bcf2e2', light=1.15, fog=FOG)


SCENES = {'village': village, 'field': field, 'road': road, 'outpost': outpost, 'camp': camp, 'swamp': swamp, 'elf': elf}
