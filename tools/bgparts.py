# ============================================================
# MẢNH GHÉP DÙNG CHUNG CHO CÁC CẢNH (trời, núi, hàng cây, ô đất, đồ vật)
# ============================================================
from battle_bg2 import *

GREEN = [('#1b4a3c', '#2f7048', '#62a653', '#bfe070'), ('#184539', '#2a6646', '#559a54', '#a6d468')]
MOSS3 = ('#2f6a44', '#58994e', '#a6d264')


# ---------------- trời / núi / đồi / hàng cây ----------------
def sky(c, stops, sun=None, far=10, big=(), seed=0, ccols=('#8fb0de', '#c4d9f0', '#f4f8fc', '#ffffff'), fcols=('#b9d0ea', '#d6e6f4', '#f1f6fa', '#ffffff'), far_y=(228, 256)):
    rng = np.random.default_rng(seed + 900)
    c.grad(stops)
    if sun:
        c.glow(sun[0], sun[1], 900, sun[2], 0.5, 1.6, sy=0.5)
    for i in range(far):
        cloud(c, rng.random() * c.w, far_y[0] + rng.random() * (far_y[1] - far_y[0]), 150 + rng.random() * 170, 24 + rng.random() * 22, cols=fcols, seed=seed + 40 + i, alpha=0.85)
    for i, (x, y, w, h) in enumerate(big):
        cloud(c, x, y, w, h, cols=ccols, seed=seed + 60 + i)


def ridge(c, yb, amp, col, seed, cell=22, snow=False, fade='#dfeaf2', power=1.3, k=0.75):
    W = c.w
    xs = np.linspace(0, W, 260)
    n = fbm(1, 260, cell, seed, 4)[0]
    ys = yb - amp * np.clip(n - 0.25, 0, 1) ** power * 1.6
    c.wash(c.poly(list(zip(xs, ys)) + [(W, c.h), (0, c.h)], 0.8), col, mixh(col, fade, k), grain=0.06)
    if snow:
        caps = [[(xs[j - 3], ys[j - 3] + 16), (xs[j], ys[j] - 0.5), (xs[j + 3], ys[j + 3] + 18), (xs[j + 1], ys[j] + 12), (xs[j - 1], ys[j] + 15)]
                for j in range(4, 256) if ys[j] < yb - amp * 0.62 and ys[j] <= ys[j - 1] and ys[j] <= ys[j + 1]]
        if caps:
            c.wash(c.polys(caps, 0.6), '#f4f8ff', alpha=0.85)
    return xs, ys


def roll(c, yb, amp, top, bot, seed, cell=70, grain=0.12):
    """Đồi thoải. Trả hàm y(x) để đặt vật lên sườn đồi."""
    W = c.w
    xs = np.linspace(0, W, 200)
    ys = yb - amp * fbm(1, 200, cell, seed, 2)[0]
    c.wash(c.poly(list(zip(xs, ys)) + [(W, c.h), (0, c.h)], 0.6), top, bot, grain=grain)
    return lambda x: float(np.interp(x, xs, ys))


def tree_row(c, base, hmin, hmax, step, dark, lit, seed, conifer=0.4, basefn=None, x0=-60, x1=None):
    """Rặng cây bóng mờ (lớp xa): cây lá kim + cây tán tròn."""
    r = np.random.default_rng(seed)
    x1 = c.w + 60 if x1 is None else x1
    x = float(x0)
    polys, crowns = [], []
    while x < x1:
        h = hmin + r.random() * (hmax - hmin)
        b = basefn(x) if basefn else base
        if r.random() < conifer:
            polys.append(conifer_pts(x, b, h * 1.15, h * 0.34, r))
        else:
            w = h * (0.6 + r.random() * 0.35)
            polys.append(trunk_pts(x, b, b - h * 0.6, max(2.5, h * 0.06)))
            crowns += canopy_clumps(r, x, b - h * 0.66, w * 0.5, h * 0.36, n=7)
        x += step * (0.5 + r.random())
    if polys:
        c.wash(c.polys(polys, 0.6), dark, mixh(dark, lit, 0.5), grain=0.08)
    if crowns:
        foliage(c, crowns, [dark, mixh(dark, lit, 0.45), lit], r, jitter=0.03, grain=0.06)


def undergrowth(c, base, n_bush=50, n_grass=1400, seed=0, cols=GREEN, gcols=('#2f6d46', '#4f9250', '#8fc662', '#25593f'), flowers=('#fff8dc', '#ffe27a', '#f6b6d0'),
                bw=(70, 150), bh=(26, 56), gh=(10, 26), nfl=300, leaf=30, fox=0, foxcols=('#e889c0', '#b48cf0', '#fff0c8')):
    """Bụi + lá bản + cỏ + hoa chân cảnh."""
    r = np.random.default_rng(seed + 77)
    W = c.w
    for i in range(n_bush):
        bush(c, r.random() * W, base, bw[0] + r.random() * (bw[1] - bw[0]), bh[0] + r.random() * (bh[1] - bh[0]), cols[i % len(cols)], seed=seed * 31 + i)
    for i in range(leaf):
        broadleaf(c, r.random() * W, base, 14 + r.random() * 12, (cols[0][1], cols[0][2]), r)
    grass(c, 0, W, base, gh[0], gh[1], n_grass, list(gcols), seed=seed + 5)
    for i in range(fox):
        foxglove(c, r.random() * W, base, 24 + r.random() * 24, foxcols[i % len(foxcols)], r)
    if nfl and flowers:
        pts = [(r.random() * W, base - 3 - r.random() * (gh[1] * 0.8)) for _ in range(nfl)]
        k = max(1, len(pts) // len(flowers))
        for i, col in enumerate(flowers):
            c.dots(pts[i * k:(i + 1) * k], col, 1.5)


# ---------------- ô đất lặp ----------------
def _blades(t, n, cols):
    r = t.rng
    bl = [(r.random() * 512, r.random() * 512, r.random()) for _ in range(n)]
    k = 1.0 / len(cols)
    for i, col in enumerate(cols):
        t.stamp(lambda d, X, Y: [d.line([(X(x), Y(y)), (X(x + (v - 0.5) * 5), Y(y - 5 - v * 5))], fill=255, width=2) for x, y, v in bl if i * k <= v < (i + 1) * k], col, 0.55)


def _pebbles(t, n, dark, light, smin=2, smax=5):
    r = t.rng
    peb = [(r.random() * 512, r.random() * 512, smin + r.random() * (smax - smin)) for _ in range(n)]
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - q), Y(y - q * 0.7), X(x + q), Y(y + q * 0.7)], fill=255) for x, y, q in peb], dark, 0.9)
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - q * 0.7), Y(y - q * 0.6), X(x + q * 0.4), Y(y + q * 0.1)], fill=255) for x, y, q in peb], light, 0.9)


def _specks(t, n, col, r0=1.6, alpha=1.0):
    r = t.rng
    pts = [(r.random() * 512, r.random() * 512) for _ in range(n)]
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - r0), Y(y - r0), X(x + r0), Y(y + r0)], fill=255) for x, y in pts], col, alpha)


def tile_grass(base, dark, light, sun, dirt, seed, blades=('#3c6238', '#86b05a', '#b7d274'), flowers=('#fff8dc', '#ffe27a'), nfl=40, leaves=None, pebbles=30, dirt_k=0.45, wet=None, glow=None):
    t = Tile(base, seed=seed)
    t.patches(dark, 150, 0.36, 0.7, 1, 0.8)
    t.patches(light, 120, 0.44, 0.74, 2, 0.75)
    t.patches(sun, 60, 0.58, 0.76, 3, 0.5)
    t.patches(dirt, 170, 0.64, 0.8, 4, dirt_k)
    if wet:
        t.patches(wet, 100, 0.68, 0.78, 6, 0.5)
    _blades(t, 2600, blades)
    if glow:
        t.patches(glow, 40, 0.72, 0.84, 8, 0.35)
    if leaves:
        for col in leaves:
            r = t.rng
            lv = [(r.random() * 512, r.random() * 512) for _ in range(30)]
            t.stamp(lambda d, X, Y: [d.ellipse([X(x - 3), Y(y - 1.6), X(x + 3), Y(y + 1.6)], fill=255) for x, y in lv], col, 0.8)
    if pebbles:
        _pebbles(t, pebbles, mixh(dirt, '#202020', 0.4), mixh(dirt, '#ffffff', 0.45))
    for col in flowers:
        _specks(t, nfl // max(1, len(flowers)), col, 1.7)
    return t.done()


def tile_dirt(base, dark, light, seed, tufts='#8aa060', pebbles=70, ruts=True, flowers=(), grass_k=0.5, cracks=0):
    """Đất nện: mảng sáng tối, vệt bánh xe chạy ngang, sỏi, túm cỏ."""
    t = Tile(base, seed=seed)
    t.patches(dark, 160, 0.38, 0.7, 1, 0.8)
    t.patches(light, 120, 0.46, 0.76, 2, 0.7)
    t.patches(mixh(light, '#ffffff', 0.3), 50, 0.62, 0.78, 3, 0.4)
    if ruts:
        for yy in (150, 196, 330, 372):
            t.stamp(lambda d, X, Y: [d.line([(X(x), Y(yy + math.sin(x * 0.045) * 5)), (X(x + 18), Y(yy + math.sin((x + 18) * 0.045) * 5))], fill=255, width=9) for x in range(0, 512, 16)], dark, 0.38, 3)
    if tufts:
        t.patches(tufts, 90, 0.66, 0.78, 5, grass_k)
        r = t.rng
        tf = [(r.random() * 512, r.random() * 512) for _ in range(60)]
        t.stamp(lambda d, X, Y: [d.line([(X(x + k * 2 - 4), Y(y)), (X(x + k * 2.8 - 6), Y(y - 6 - (k % 2) * 4))], fill=255, width=2) for x, y in tf for k in range(5)], tufts, 0.9)
        t.stamp(lambda d, X, Y: [d.line([(X(x + k * 2 - 3), Y(y)), (X(x + k * 2.4 - 4), Y(y - 5))], fill=255, width=2) for x, y in tf for k in (1, 3)], mixh(tufts, '#f0ffb0', 0.4), 0.9)
    _pebbles(t, pebbles, mixh(dark, '#202020', 0.45), mixh(light, '#ffffff', 0.5))
    _specks(t, 220, mixh(dark, '#000000', 0.3), 0.9, 0.6)
    _specks(t, 180, mixh(light, '#ffffff', 0.5), 0.9, 0.6)
    if cracks:
        r = t.rng
        ck = []
        for _ in range(cracks):
            x, y = r.random() * 512, r.random() * 512
            for j in range(5):
                nx, ny = x + (r.random() - 0.5) * 24, y + (r.random() - 0.3) * 18
                ck.append((x, y, nx, ny)); x, y = nx, ny
        t.stamp(lambda d, X, Y: [d.line([(X(a), Y(b)), (X(e), Y(f))], fill=255, width=2) for a, b, e, f in ck], mixh(dark, '#000000', 0.5), 0.7)
    for col in flowers:
        _specks(t, 14, col, 1.7)
    return t.done()


def tile_cobble(cols, grout, hi, shadow, seed, nx=11, ny=8, moss='#7f8f62', accent=None, petals=None, big=0.0):
    """Đá cuội / đá lát viên: bóng viên, mép sáng, nứt, cỏ khe."""
    t = Tile(grout, seed=seed)
    r = t.rng
    cw, ch = 512 / nx, 512 / ny
    st = []
    for j in range(ny):
        for i in range(nx):
            st.append(((i + (0.5 if j % 2 else 0)) * cw + (r.random() - 0.5) * 6, j * ch + (r.random() - 0.5) * 6, cw * (0.86 + r.random() * 0.08), ch * (0.86 + r.random() * 0.08), r.random()))

    def rr(d, X, Y, x, y, w, h, rad):
        d.rounded_rectangle([X(x - w / 2), Y(y - h / 2), X(x + w / 2), Y(y + h / 2)], radius=rad * SS, fill=255)
    rad = min(cw, ch) * 0.2
    t.stamp(lambda d, X, Y: [rr(d, X, Y, x + 2.2, y + 2.8, w, h, rad) for x, y, w, h, v in st], shadow, 0.75, 0.8)
    n = len(cols)
    for i, col in enumerate(cols):
        t.stamp(lambda d, X, Y: [rr(d, X, Y, x, y, w, h, rad) for x, y, w, h, v in st if i / n <= v < (i + 1) / n], col, 1.0, 0.6)
    if accent:
        t.stamp(lambda d, X, Y: [rr(d, X, Y, x, y, w, h, rad) for x, y, w, h, v in st if v > 0.93], accent, 0.8, 0.6)
    t.stamp(lambda d, X, Y: [rr(d, X, Y, x - w * 0.06, y - h * 0.08, w * 0.74, h * 0.7, rad * 0.9) for x, y, w, h, v in st], hi, 0.42, 2.5)
    t.stamp(lambda d, X, Y: [d.line([(X(x - w / 2 + rad * 0.8), Y(y - h / 2 + 3)), (X(x + w / 2 - rad), Y(y - h / 2 + 3))], fill=255, width=3) for x, y, w, h, v in st], hi, 0.6, 0.8)
    t.stamp(lambda d, X, Y: [d.line([(X(x - w / 2 + 3), Y(y - h / 2 + rad * 0.9)), (X(x - w / 2 + 3), Y(y + h / 2 - rad))], fill=255, width=3) for x, y, w, h, v in st], hi, 0.45, 0.8)
    ck = []
    for x, y, w, h, v in st:
        if (v * 97) % 1 < 0.22:
            px, py = x + (r.random() - 0.5) * w * 0.5, y - h * 0.3
            for j in range(4):
                nx_, ny_ = px + (r.random() - 0.5) * 9, py + 5 + r.random() * 7
                ck.append((px, py, nx_, ny_)); px, py = nx_, ny_
    t.stamp(lambda d, X, Y: [d.line([(X(a), Y(b)), (X(e), Y(f))], fill=255, width=2) for a, b, e, f in ck], shadow, 0.7)
    _specks(t, 250, shadow, 0.7, 0.7); _specks(t, 250, hi, 0.7, 0.7)
    t.patches(mixh(grout, cols[0], 0.5), 200, 0.42, 0.75, 1, 0.5)
    t.patches(hi, 160, 0.5, 0.8, 2, 0.4)
    if moss:
        t.patches(moss, 60, 0.68, 0.8, 3, 0.35)
        tf = [((i + (0.5 if j % 2 else 0)) * cw + cw / 2 + (r.random() - 0.5) * 8, j * ch + ch / 2 + (r.random() - 0.5) * 20) for j in range(ny) for i in range(nx) if r.random() < 0.2]
        t.stamp(lambda d, X, Y: [d.line([(X(x + k * 2 - 3), Y(y)), (X(x + k * 2.6 - 4), Y(y - 6 - k % 2 * 3))], fill=255, width=2) for x, y in tf for k in range(4)], mixh(moss, '#60a040', 0.5), 0.9)
    if petals:
        for col in petals:
            _specks(t, 18, col, 1.9, 0.9)
    return t.done(0.04)


def tile_slab(cols, grout, hi, dark, seed, nx=4, ny=3, wet=None, moss=None, rune=None, checker=None, polish=0.0, cracks=14, debris=True):
    """Phiến đá lớn (sàn điện, hầm, mặt thành): mép vát, nứt, vũng nước, ấn khắc, ô cờ, bóng loáng."""
    t = Tile(grout, seed=seed)
    r = t.rng
    cw, ch = 512 / nx, 512 / ny
    sl = [((i + (0.5 if (j % 2 and not checker) else 0)) * cw + (0 if checker else 0), j * ch, cw - 5, ch - 6, r.random(), (i + j) % 2) for j in range(ny) for i in range(nx)]
    if checker:
        sl = [(x + cw / 2, y + ch / 2, w, h, v, p) for x, y, w, h, v, p in sl]
    n = len(cols)
    for i, col in enumerate(cols):
        t.stamp(lambda d, X, Y: [d.rounded_rectangle([X(x - w / 2), Y(y - h / 2), X(x + w / 2), Y(y + h / 2)], radius=5 * SS, fill=255) for x, y, w, h, v, p in sl if i / n <= v < (i + 1) / n], col, 1.0, 0.7)
    if checker:
        t.stamp(lambda d, X, Y: [d.rounded_rectangle([X(x - w / 2), Y(y - h / 2), X(x + w / 2), Y(y + h / 2)], radius=5 * SS, fill=255) for x, y, w, h, v, p in sl if p], checker, 0.85, 0.7)
    t.stamp(lambda d, X, Y: [d.rounded_rectangle([X(x - w * 0.42), Y(y - h * 0.44), X(x + w * 0.36), Y(y + h * 0.3)], radius=12 * SS, fill=255) for x, y, w, h, v, p in sl], hi, 0.3, 6)
    t.stamp(lambda d, X, Y: [d.line([(X(x - w / 2 + 6), Y(y - h / 2 + 3)), (X(x + w / 2 - 8), Y(y - h / 2 + 3))], fill=255, width=3) for x, y, w, h, v, p in sl], hi, 0.55, 0.8)
    t.stamp(lambda d, X, Y: [d.line([(X(x - w / 2 + 3), Y(y - h / 2 + 6)), (X(x - w / 2 + 3), Y(y + h / 2 - 8))], fill=255, width=3) for x, y, w, h, v, p in sl], hi, 0.4, 0.8)
    t.stamp(lambda d, X, Y: [d.line([(X(x - w / 2 + 6), Y(y + h / 2 - 3)), (X(x + w / 2 - 4), Y(y + h / 2 - 3))], fill=255, width=3) for x, y, w, h, v, p in sl], dark, 0.5, 0.8)
    if rune:
        sx_, sy_ = sl[min(5, len(sl) - 1)][:2]

        def rn(d, X, Y):
            for q in (38, 30):
                d.ellipse([X(sx_ - q), Y(sy_ - q * 1.25), X(sx_ + q), Y(sy_ + q * 1.25)], outline=255, width=3)
            for a in np.linspace(0, 6.283, 9)[:-1]:
                d.line([(X(sx_ + math.cos(a) * 12), Y(sy_ + math.sin(a) * 15)), (X(sx_ + math.cos(a) * 26), Y(sy_ + math.sin(a) * 32))], fill=255, width=3)
        t.stamp(rn, rune, 0.45, 0.6)
    t.patches(mixh(grout, cols[0], 0.4), 150, 0.45, 0.75, 1, 0.5)
    t.patches(hi, 90, 0.6, 0.82, 2, 0.3)
    if polish:      # vệt bóng loáng dọc (phản chiếu đèn)
        t.stamp(lambda d, X, Y: [d.line([(X(x), Y(0)), (X(x + 20), Y(512))], fill=255, width=int(26 * SS)) for x in (90, 300, 430)], '#ffffff', polish, 14)
    if moss:
        t.patches(moss, 70, 0.7, 0.82, 3, 0.4)
    if wet:
        t.patches(wet, 110, 0.72, 0.8, 7, 0.3)
    ck = []
    for _ in range(cracks):
        x, y = r.random() * 512, r.random() * 512
        for j in range(6):
            nx_, ny_ = x + (r.random() - 0.5) * 26, y + (r.random() - 0.3) * 22
            ck.append((x, y, nx_, ny_)); x, y = nx_, ny_
    t.stamp(lambda d, X, Y: [d.line([(X(a), Y(b)), (X(e), Y(f))], fill=255, width=2) for a, b, e, f in ck], dark, 0.8)
    if debris:
        _specks(t, 70, dark, 1.6, 0.8); _specks(t, 50, hi, 1.4, 0.7)
    return t.done(0.05)


def tile_planks(cols, gap, hi, seed, nrow=6, nails='#3a2a20'):
    """Ván gỗ chạy ngang: vân gỗ, mắt gỗ, đinh, khe tối."""
    t = Tile(gap, seed=seed)
    r = t.rng
    ph = 512 / nrow
    bd = []
    for j in range(nrow):
        x = -r.random() * 200
        while x < 512:
            L = 170 + r.random() * 160
            bd.append((x, j * ph, L, r.random())); x += L
    n = len(cols)
    for i, col in enumerate(cols):
        t.stamp(lambda d, X, Y: [d.rounded_rectangle([X(x + 1.5), Y(y + 2), X(x + L - 1.5), Y(y + ph - 2)], radius=2 * SS, fill=255) for x, y, L, v in bd if i / n <= v < (i + 1) / n], col, 1.0, 0.5)
    gr = [(r.random() * 512, r.random() * 512, 30 + r.random() * 90) for _ in range(260)]
    t.stamp(lambda d, X, Y: [d.line([(X(x), Y(y)), (X(x + L), Y(y + math.sin(x) * 2))], fill=255, width=2) for x, y, L in gr[:150]], mixh(cols[0], '#000000', 0.35), 0.35)
    t.stamp(lambda d, X, Y: [d.line([(X(x), Y(y)), (X(x + L), Y(y + math.cos(x) * 2))], fill=255, width=2) for x, y, L in gr[150:]], hi, 0.35)
    kn = [(r.random() * 512, (int(r.random() * nrow) + 0.5) * ph) for _ in range(9)]
    t.stamp(lambda d, X, Y: [d.ellipse([X(x - 7), Y(y - 4), X(x + 7), Y(y + 4)], fill=255) for x, y in kn], mixh(cols[0], '#000000', 0.45), 0.7, 0.8)
    t.stamp(lambda d, X, Y: [d.line([(X(x + 3), Y(y + 4)), (X(x + L - 3), Y(y + 4))], fill=255, width=3) for x, y, L, v in bd], hi, 0.45, 0.8)
    t.stamp(lambda d, X, Y: [d.ellipse([X(x + dx - 2), Y(y + dy - 2), X(x + dx + 2), Y(y + dy + 2)], fill=255) for x, y, L, v in bd for dx in (8, L - 8) for dy in (ph * 0.28, ph * 0.72)], nails, 0.8)
    t.patches(mixh(cols[0], '#000000', 0.3), 150, 0.5, 0.78, 1, 0.4)
    t.patches(hi, 120, 0.55, 0.8, 2, 0.3)
    return t.done(0.05)


# ---------------- đồ vật ----------------
WOOD = ('#b98858', '#5e3e28')


def fence(c, x0, x1, base, h=38, step=48, cols=WOOD, rails=2, rng=None):
    posts = []
    x = x0
    while x <= x1:
        hh = h * (0.92 + (rng.random() * 0.16 if rng is not None else 0))
        posts.append([(x - 4, base + 2), (x - 4, base - hh + 4), (x, base - hh), (x + 4, base - hh + 4), (x + 4, base + 2)])
        x += step
    for k in range(rails):
        y = base - h * (0.72 - 0.4 * k)
        c.wash(c.rect(x0, y - 2.6, x1, y + 2.6), cols[0], cols[1], grain=0.25, edge=0.5)
    c.wash(c.polys(posts), cols[0], cols[1], grain=0.3, edge=0.6, side=0.6)


def barrel(c, x, base, s=1.0, cols=WOOD):
    c.wash(c.poly([(x - 12 * s, base + 2), (x - 15 * s, base - 16 * s), (x - 11 * s, base - 34 * s), (x + 11 * s, base - 34 * s), (x + 15 * s, base - 16 * s), (x + 12 * s, base + 2)]), cols[0], cols[1], grain=0.25, edge=0.7, side=0.8)
    c.wash(c.lines([(x - 14 * s, base - 9 * s, x + 14 * s, base - 9 * s, 2.2 * s), (x - 14 * s, base - 25 * s, x + 14 * s, base - 25 * s, 2.2 * s)]), '#4a4a52')
    c.wash(c.lines([(x + dx * s, base - 33 * s, x + dx * 1.2 * s, base, 0.9) for dx in (-6, 0, 6)]), cols[1], alpha=0.5)
    c.wash(c.ells([(x, base - 34 * s, 11 * s, 3 * s)]), mixh(cols[0], '#ffffff', 0.25), cols[0], edge=0.5)


def crate(c, x, base, s=1.0, cols=('#c89a62', '#7a5234')):
    c.wash(c.rect(x - 20 * s, base - 34 * s, x + 20 * s, base + 2), cols[0], cols[1], grain=0.25, edge=0.7, side=0.5)
    c.wash(c.lines([(x - 20 * s, base - 34 * s, x + 20 * s, base + 2, 2 * s), (x + 20 * s, base - 34 * s, x - 20 * s, base + 2, 2 * s)]), cols[1], alpha=0.6)
    c.wash(c.lines([(x - 20 * s, base - 31 * s, x + 20 * s, base - 31 * s, 3 * s), (x - 20 * s, base - 1, x + 20 * s, base - 1, 3 * s), (x - 18 * s, base - 34 * s, x - 18 * s, base, 3 * s), (x + 18 * s, base - 34 * s, x + 18 * s, base, 3 * s)]), mixh(cols[0], '#ffffff', 0.15), cols[1], grain=0.2)
    c.dots([(x - 17 * s, base - 31 * s), (x + 17 * s, base - 31 * s), (x - 17 * s, base - 2), (x + 17 * s, base - 2)], '#3a2a20', 1.2)


def sack(c, x, base, s=1.0, cols=('#e2d2ac', '#8a7654')):
    c.wash(c.poly([(x - 15 * s, base + 2), (x - 17 * s, base - 14 * s), (x - 8 * s, base - 26 * s), (x - 4 * s, base - 32 * s), (x + 5 * s, base - 31 * s), (x + 9 * s, base - 25 * s), (x + 17 * s, base - 12 * s), (x + 15 * s, base + 2)]),
           cols[0], cols[1], grain=0.25, edge=0.8, side=0.8)
    c.wash(c.lines([(x - 6 * s, base - 26 * s, x + 7 * s, base - 25 * s, 1.6)]), cols[1])


def fire(c, x, y, s=1.0, cols=('#ff5a1e', '#ffa02e', '#ffe89a'), glow='#ff8a3a', gr=110, gk=0.5):
    c.glow(x, y - 12 * s, gr * s, glow, gk, 1.8)
    for k, col in zip((1.0, 0.64, 0.32), cols):
        c.wash(c.poly([(x - 10 * s * k, y), (x - 12 * s * k, y - 10 * s * k), (x - 5 * s * k, y - 20 * s * k), (x - 7 * s * k, y - 30 * s * k), (x + 1 * s, y - 44 * s * k),
                       (x + 3 * s * k, y - 26 * s * k), (x + 9 * s * k, y - 30 * s * k), (x + 8 * s * k, y - 14 * s * k), (x + 12 * s * k, y - 6 * s * k), (x + 9 * s * k, y)], 0.8), col, grain=0)
    c.glow(x, y - 12 * s, 16 * s, '#fff6d0', 0.6, 1.5)


def campfire(c, x, base, s=1.0, rng=None):
    c.wash(c.ells([(x + math.cos(a) * 22 * s, base - 1 + math.sin(a) * 5 * s, 6 * s, 4.5 * s) for a in np.linspace(0, 6.28, 9)[:-1]]), '#8a8a8a', '#3a3a3e', edge=0.7)
    c.wash(c.lines([(x - 18 * s, base - 2, x + 14 * s, base - 12 * s, 5 * s), (x + 18 * s, base - 2, x - 14 * s, base - 12 * s, 5 * s)]), '#6a4a30', '#2a1c14', grain=0.3)
    fire(c, x, base - 8 * s, s * 1.1)
    if rng is not None:
        for _ in range(8):
            c.glow(x + (rng.random() - 0.5) * 40 * s, base - 40 * s - rng.random() * 70 * s, 2.5, '#ffd27a', 0.8, 1.4)


def brazier(c, x, base, h=70, s=1.0, cols=('#5a5560', '#1e1c24'), flame=None, **kw):
    c.wash(c.lines([(x - 12 * s, base + 2, x, base - h + 16 * s, 3 * s), (x + 12 * s, base + 2, x, base - h + 16 * s, 3 * s), (x, base + 2, x, base - h + 16 * s, 3 * s)]), cols[0], cols[1])
    c.wash(c.poly([(x - 20 * s, base - h), (x + 20 * s, base - h), (x + 12 * s, base - h + 18 * s), (x - 12 * s, base - h + 18 * s)]), cols[0], cols[1], edge=0.7, side=0.9)
    c.wash(c.rect(x - 22 * s, base - h - 3 * s, x + 22 * s, base - h + 2 * s), mixh(cols[0], '#ffffff', 0.25), cols[0])
    (flame or fire)(c, x, base - h - 2 * s, s, **kw)


def lamp_post(c, x, base, h=150, glow='#ffd98a', lit=True, cols=('#4a4650', '#25232c'), banner=None):
    c.wash(c.rect(x - 3, base - h, x + 3, base + 2), cols[0], cols[1], grain=0.1, side=0.8)
    c.wash(c.poly([(x - 9, base + 2), (x - 5, base - 22), (x + 5, base - 22), (x + 9, base + 2)]), mixh(cols[0], '#ffffff', 0.1), cols[1])
    c.wash(c.rect(x - 6, base - h * 0.55, x + 6, base - h * 0.55 + 4), cols[0])
    c.wash(c.lines([(x, base - h + 10, x + 26, base - h, 2.4), (x + 26, base - h, x + 26, base - h + 12, 2)]), cols[1])
    c.wash(c.poly([(x + 17, base - h + 12), (x + 35, base - h + 12), (x + 32, base - h + 38), (x + 20, base - h + 38)]), '#ffe9a8' if lit else '#cfd8e0', '#ffc45c' if lit else '#8f9aa8', edge=0.9)
    c.wash(c.lines([(x + 26, base - h + 12, x + 26, base - h + 38, 1.0)]), cols[1], alpha=0.7)
    c.wash(c.poly([(x + 14, base - h + 12), (x + 26, base - h + 2), (x + 38, base - h + 12)]), cols[1])
    c.wash(c.rect(x + 19, base - h + 38, x + 33, base - h + 41), cols[1])
    if lit:
        c.glow(x + 26, base - h + 26, 46, glow, 0.5, 1.8)
    if banner:
        c.wash(c.lines([(x - 30, base - h + 22, x, base - h + 22, 2)]), cols[1])
        c.wash(c.poly([(x - 30, base - h + 24), (x - 6, base - h + 24), (x - 6, base - h + 80), (x - 18, base - h + 92), (x - 30, base - h + 80)]), banner, mixh(banner, '#200818', 0.5), grain=0.12, edge=0.6, side=0.4)
        c.wash(c.rect(x - 30, base - h + 24, x - 6, base - h + 28), '#eac566')
        c.wash(c.poly([(x - 18, base - h + 42), (x - 11, base - h + 54), (x - 18, base - h + 66), (x - 25, base - h + 54)]), '#f2d070', '#c89a3a')


def banner(c, x, y, w, h, col, emblem='#f2d070', fringe=True):
    c.wash(c.poly([(x - w / 2, y), (x + w / 2, y), (x + w / 2, y + h * 0.8), (x, y + h), (x - w / 2, y + h * 0.8)]), col, mixh(col, '#200818', 0.45), grain=0.12, edge=0.5, side=0.3)
    c.wash(c.rect(x - w / 2 - 2, y - 2, x + w / 2 + 2, y + 2), '#e8c060')
    if emblem:
        q = w * 0.26
        c.wash(c.poly([(x, y + h * 0.4 - q * 1.3), (x + q, y + h * 0.4), (x, y + h * 0.4 + q * 1.3), (x - q, y + h * 0.4)]), emblem, mixh(emblem, '#804000', 0.4))


def tent(c, x, base, w, h, cols=('#e2d6b4', '#8a7a5a'), door='#2a1e16', flag=None, stripes=None, rng=None):
    c.wash(c.poly([(x - w / 2, base + 2), (x - w * 0.08, base - h), (x + w * 0.08, base - h), (x + w / 2, base + 2)]), cols[0], cols[1], grain=0.2, edge=0.6, side=0.7)
    c.wash(c.poly([(x + w * 0.1, base + 2), (x + w * 0.02, base - h), (x + w * 0.08, base - h), (x + w / 2, base + 2)], 1.0), cols[1], alpha=0.45)
    if stripes:
        c.wash(c.polys([[(x - w * 0.5 * t - 3, base - h * (1 - t)), (x - w * 0.5 * t + 3, base - h * (1 - t)), (x - w * 0.5 * (t + 0.12) + 3, base - h * (1 - t - 0.12)), (x - w * 0.5 * (t + 0.12) - 3, base - h * (1 - t - 0.12))] for t in (0.3, 0.6)]), stripes, alpha=0.7)
    c.wash(c.poly([(x - w * 0.13, base + 2), (x - w * 0.01, base - h * 0.62), (x + w * 0.1, base + 2)]), door, grain=0.1)
    c.wash(c.lines([(x - w * 0.01, base - h * 0.62, x - w * 0.01, base - h, 1.2), (x - w * 0.3, base - h * 0.42, x - w * 0.62, base + 2, 1.0), (x + w * 0.3, base - h * 0.42, x + w * 0.62, base + 2, 1.0)]), cols[1], alpha=0.8)
    c.wash(c.lines([(x, base - h - 2, x, base - h - (26 if flag else 8), 1.6)]), '#4a3424')
    if flag:
        c.wash(c.poly([(x, base - h - 26), (x + 24, base - h - 20), (x, base - h - 13)]), flag, mixh(flag, '#000000', 0.3))


def palisade(c, x0, x1, base, h, rng, cols=('#a67c52', '#4a3424'), step=17, jag=10):
    ps = []
    x = x0
    while x < x1:
        hh = h + rng.random() * jag
        ps.append([(x, base + 2), (x, base - hh + 9), (x + step * 0.45, base - hh), (x + step * 0.9, base - hh + 9), (x + step * 0.9, base + 2)])
        x += step
    c.wash(c.polys(ps), cols[0], cols[1], grain=0.3, edge=0.5)
    c.wash(c.lines([(p[0][0] + 1, p[1][1] + 2, p[0][0] + 1, base, 1.2) for p in ps]), mixh(cols[0], '#fff0c0', 0.4), alpha=0.5)
    c.wash(c.lines([(p[3][0], p[3][1] + 2, p[3][0], base, 1.4) for p in ps]), mixh(cols[1], '#000000', 0.3), alpha=0.6)
    for yy in (0.35, 0.72):
        c.wash(c.rect(x0, base - h * yy - 3, x1, base - h * yy + 3), mixh(cols[0], cols[1], 0.3), cols[1], grain=0.2, edge=0.4)


def watchtower(c, x, base, h, w=70, cols=('#a67c52', '#4a3424'), roof=('#6a3a2a', '#9a5a3c'), flag=None):
    for sg in (-1, 1):
        c.wash(c.poly([(x + sg * w * 0.5 - 4, base + 2), (x + sg * w * 0.34 - 4, base - h), (x + sg * w * 0.34 + 4, base - h), (x + sg * w * 0.5 + 4, base + 2)]), cols[0], cols[1], grain=0.3, edge=0.5, side=0.6)
    c.wash(c.lines([(x - w * 0.46, base - h * 0.1, x + w * 0.38, base - h * 0.5, 3), (x + w * 0.46, base - h * 0.1, x - w * 0.38, base - h * 0.5, 3), (x - w * 0.4, base - h * 0.52, x + w * 0.4, base - h * 0.52, 4)]), cols[1])
    c.wash(c.rect(x - w * 0.56, base - h - 4, x + w * 0.56, base - h + 6), cols[0], cols[1], grain=0.2, edge=0.5)
    c.wash(c.rect(x - w * 0.5, base - h - 26, x + w * 0.5, base - h - 4), mixh(cols[0], '#ffffff', 0.1), cols[1], grain=0.3, edge=0.5, side=0.5)
    c.wash(c.lines([(x - w * 0.5 + k * w / 6, base - h - 26, x - w * 0.5 + k * w / 6, base - h - 4, 1.0) for k in range(1, 6)]), cols[1], alpha=0.6)
    for sg in (-1, 1):
        c.wash(c.rect(x + sg * w * 0.44 - 2.5, base - h - 58, x + sg * w * 0.44 + 2.5, base - h - 24), cols[0], cols[1])
    c.wash(c.poly([(x - w * 0.68, base - h - 56), (x, base - h - 92), (x + w * 0.68, base - h - 56)]), roof[1], roof[0], grain=0.25, edge=0.6)
    c.wash(c.poly([(x + w * 0.1, base - h - 56), (x, base - h - 92), (x + w * 0.68, base - h - 56)], 0.6), roof[0], alpha=0.6)
    if flag:
        c.wash(c.lines([(x, base - h - 92, x, base - h - 118, 1.6)]), '#4a3424')
        c.wash(c.poly([(x, base - h - 118), (x + 28, base - h - 111), (x, base - h - 102)]), flag, mixh(flag, '#000000', 0.3))


def signpost(c, x, base, h=120, cols=WOOD, n=2):
    c.wash(c.rect(x - 4, base - h, x + 4, base + 2), cols[0], cols[1], grain=0.3, side=0.7)
    for k in range(n):
        y = base - h + 12 + k * 30; sg = 1 if k % 2 == 0 else -1
        c.wash(c.poly([(x - sg * 34, y), (x + sg * 38, y), (x + sg * 54, y + 11), (x + sg * 38, y + 22), (x - sg * 34, y + 22)]), mixh(cols[0], '#ffffff', 0.15), cols[1], grain=0.3, edge=0.7)
        c.wash(c.lines([(x - sg * 24, y + 8, x + sg * 30, y + 8, 1.2), (x - sg * 24, y + 14, x + sg * 18, y + 14, 1.2)]), cols[1], alpha=0.8)


def haystack(c, x, base, w, h):
    c.relief([(x, base - h * 0.45, w * 0.5), (x - w * 0.2, base - h * 0.3, w * 0.4), (x + w * 0.2, base - h * 0.3, w * 0.4), (x, base - h * 0.75, w * 0.32)], ('#a8843a', '#d8b250', '#f2d878', '#fff0a8'),
             grain=0.35, clip=lambda yy, xx: (yy < base + 1).astype(F), squash=0.9)
    c.wash(c.lines([(x + dx, base - h * 0.9, x + dx * 1.6, base, 0.9) for dx in np.linspace(-w * 0.28, w * 0.28, 9)]), '#8a6a2a', alpha=0.45)


def wheat(c, x0, x1, base, hmin, hmax, n, seed, cols=('#b08d3a', '#e2c25a', '#f6e08a'), taper=0):
    """Lúa mì: thân nghiêng + bông hạt."""
    r = np.random.default_rng(seed)
    g = [[] for _ in cols]; ears = [[] for _ in cols]
    for _ in range(n):
        x = x0 + r.random() * (x1 - x0); h = hmin + r.random() * (hmax - hmin)
        if taper:
            h *= 0.35 + 0.65 * min(1.0, min(x - x0, x1 - x) / taper) ** 0.6 * (0.8 + 0.2 * math.sin(x * 0.02))
        l = (r.random() - 0.3) * h * 0.35
        k = int(r.random() * len(cols))
        g[k].append((x, base + 2, x + l, base - h, 1.1))
        ears[k].append((x + l + l * 0.12, base - h - 3, 2.2, 6.5))
    for k, col in enumerate(cols):
        if g[k]:
            c.wash(c.lines(g[k]), col, grain=0.05)
            c.wash(c.ells(ears[k]), mixh(col, '#fff2b0', 0.25), grain=0.05)


def windmill(c, x, base, s=1.0, ang=0.5, cols=('#f0e6d4', '#a69a86'), roof='#8f4a3a', sail='#f6efe0'):
    c.wash(c.poly([(x - 30 * s, base), (x - 18 * s, base - 84 * s), (x + 18 * s, base - 84 * s), (x + 30 * s, base)]), cols[0], cols[1], grain=0.15, edge=0.5, side=0.8)
    c.wash(c.poly([(x - 22 * s, base - 82 * s), (x, base - 108 * s), (x + 22 * s, base - 82 * s)]), roof, mixh(roof, '#301010', 0.4), edge=0.5)
    c.wash(c.rect(x - 5 * s, base - 16 * s, x + 5 * s, base), '#6a4a34'); c.wash(c.rect(x - 4 * s, base - 56 * s, x + 4 * s, base - 46 * s), '#3a4a6a')
    hx_, hy_ = x, base - 86 * s
    for k in range(4):
        a = ang + k * math.pi / 2
        dx, dy = math.cos(a), math.sin(a); nx_, ny_ = -dy, dx
        c.wash(c.lines([(hx_, hy_, hx_ + dx * 72 * s, hy_ + dy * 72 * s, 2 * s)]), '#6a4a34')
        c.wash(c.poly([(hx_ + dx * 16 * s, hy_ + dy * 16 * s), (hx_ + dx * 72 * s, hy_ + dy * 72 * s), (hx_ + dx * 72 * s + nx_ * 15 * s, hy_ + dy * 72 * s + ny_ * 15 * s), (hx_ + dx * 16 * s + nx_ * 15 * s, hy_ + dy * 16 * s + ny_ * 15 * s)]),
               sail, mixh(sail, '#8a7a6a', 0.4), grain=0.15, edge=0.5)
        c.wash(c.lines([(hx_ + dx * (16 + j * 14) * s, hy_ + dy * (16 + j * 14) * s, hx_ + dx * (16 + j * 14) * s + nx_ * 15 * s, hy_ + dy * (16 + j * 14) * s + ny_ * 15 * s, 0.9) for j in range(1, 4)]), '#8a7a6a', alpha=0.7)
    c.wash(c.ells([(hx_, hy_, 4 * s, 4 * s)]), '#4a3424')


def pillar(c, x, top, base, w, cols=('#e8e2d6', '#8c8478'), flutes=3, cap=1.5, broken=None, rng=None):
    lit, dark = cols
    if broken:
        t0 = top + broken
        c.wash(c.poly([(x - w / 2, base), (x - w / 2, t0), (x - w * 0.2, t0 - w * 0.3), (x + w * 0.05, t0 + w * 0.1), (x + w * 0.3, t0 - w * 0.2), (x + w / 2, t0 + w * 0.2), (x + w / 2, base)]), lit, mixh(lit, dark, 0.5), grain=0.25, edge=0.7, side=1.0)
    else:
        t0 = top
        c.wash(c.rect(x - w / 2, top, x + w / 2, base), lit, mixh(lit, dark, 0.5), grain=0.22, edge=0.5, side=1.0)
    if flutes:
        c.wash(c.lines([(x + dx, t0 + w * 0.7, x + dx, base - w * 0.5, max(1.2, w * 0.04)) for dx in np.linspace(-w * 0.3, w * 0.3, flutes)], 0.8), dark, alpha=0.45)
    if not broken:
        c.wash(c.rect(x - w * cap / 2, top, x + w * cap / 2, top + w * 0.3), mixh(lit, '#ffffff', 0.3), mixh(lit, dark, 0.5), grain=0.2, edge=0.7, side=0.8)
        c.wash(c.rect(x - w * 0.62, top + w * 0.3, x + w * 0.62, top + w * 0.46), lit, dark, edge=0.6, side=0.8)
    c.wash(c.rect(x - w * 0.62, base - w * 0.44, x + w * 0.62, base - w * 0.26), lit, dark, edge=0.6, side=0.8)
    c.wash(c.rect(x - w * cap / 2, base - w * 0.26, x + w * cap / 2, base + 2), mixh(lit, '#ffffff', 0.15), dark, grain=0.2, edge=0.6, side=0.8)


def stars(c, n, y1, seed, col='#ffffff'):
    r = np.random.default_rng(seed)
    pts = [(r.random() * c.w, r.random() ** 1.3 * y1, 0.5 + r.random() ** 3 * 1.6) for _ in range(n)]
    c.wash(c.ells([(x, y, s, s) for x, y, s in pts]), col, alpha=0.9, grain=0)
    for x, y, s in pts:
        if s > 1.5:
            c.glow(x, y, 7, '#cfe0ff', 0.6, 1.6)


def water(c, y0, y1, top, bot, seed, shine='#e8f4ff', n=320, sun=None):
    """Mặt nước: dải màu + vệt sóng ngang + ánh lấp lánh."""
    r = np.random.default_rng(seed)
    c.wash(c.rect(0, y0, c.w, y1), top, bot, grain=0.08)
    segs_d, segs_l = [], []
    for _ in range(n):
        y = y0 + 2 + r.random() ** 0.8 * (y1 - y0 - 3); x = r.random() * c.w; L = 14 + r.random() * 60 * (0.4 + (y - y0) / (y1 - y0))
        (segs_l if r.random() < 0.55 else segs_d).append((x, y, x + L, y, 0.9 + (y - y0) / (y1 - y0) * 1.4))
    c.wash(c.lines(segs_d), mixh(bot, '#000010', 0.3), alpha=0.35)
    c.wash(c.lines(segs_l, 0.4), shine, alpha=0.6)
    if sun:
        for _ in range(120):
            y = y0 + r.random() * (y1 - y0); x = sun + (r.random() - 0.5) * 700 * (0.3 + (y - y0) / (y1 - y0))
            c.glow(x, y, 4 + r.random() * 5, '#ffffff', 0.5, 1.5, sy=0.4)
