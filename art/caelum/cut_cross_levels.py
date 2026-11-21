"""Cat tranh 3 cap cua tung loai Thanh gia (Flow, nen hong #ff00ff) -> src/assets/sprites/caelum_cross_<loai>_<cap>.webp
   art/caelum/cross-levels-{life,power,lightning,purify}.png: 3 cay trai -> phai = cap 1, 2, 3.
   Moi hinh dat vao khung chung 300x400 (chan giua day) de cung ti le tren san. Chi tach nen + cat, khong ve lai."""
import os, sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TYPES = {'life': 1, 'power': 2, 'lightning': 3, 'purify': 4}
W, H = 300, 400
for name, t in TYPES.items():
    src = os.path.join(ROOT, f'art/caelum/cross-levels-{name}.png')
    if not os.path.exists(src): print('thieu', src); continue
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mag = np.minimum(r, b) - g
    alpha = np.clip((140 - mag) / 90, 0, 1)
    spill = np.clip(np.minimum(r, b) - g - 40, 0, None) * (1 - alpha)
    out = im.copy(); out[..., 0] -= spill; out[..., 2] -= spill
    mask = ndi.binary_opening(alpha > 0.5, iterations=2)
    # gom theo 3 cot (canh cung mot cay co the tach roi khoi than)
    cols = np.array_split(np.arange(im.shape[1]), 3)
    rgba = np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8)
    for lv, cx in enumerate(cols, 1):
        sub = mask[:, cx[0]:cx[-1] + 1]
        lab, n = ndi.label(sub)
        sizes = ndi.sum(sub, lab, range(1, n + 1))
        # giu canh nho (> 400 px) nhung bo dau sao / chu "AI" cua Flow o goc duoi phai tam tranh
        cent = ndi.center_of_mass(sub, lab, range(1, n + 1))
        Hh, Ww = im.shape[0], im.shape[1]
        def ok(i):
            cy, cxx = cent[i]; gx = cxx + cx[0]
            corner = cy > Hh * 0.78 and gx > Ww * 0.8 and sizes[i] < 6000
            return sizes[i] > 400 and not corner
        keep = np.isin(lab, [i + 1 for i in range(n) if ok(i)])
        ys, xs = np.nonzero(keep)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min() + cx[0], xs.max() + 1 + cx[0]
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = (crop[..., 3] * ndi.binary_dilation(keep[y0:y1, x0 - cx[0]:x1 - cx[0]], iterations=3)).astype(np.uint8)
        c = Image.fromarray(crop)
        s = min(W / c.width, H / c.height)
        c = c.resize((round(c.width * s), round(c.height * s)), Image.LANCZOS)
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        canvas.alpha_composite(c, ((W - c.width) // 2, H - c.height))
        p = os.path.join(ROOT, f'src/assets/sprites/caelum_cross_{t}_{lv}.webp')
        canvas.save(p, quality=90); print(p, c.size)
