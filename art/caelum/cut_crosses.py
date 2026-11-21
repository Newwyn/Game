"""Cat 5 cay thanh gia cua Caelum tu art/caelum/sheet-crosses.jpg (nen hong #ff00ff) -> src/assets/sprites/caelum_cross_*.webp
   Chi tach nen + cat sat, khong ve lai. Thu tu tren tranh: xanh la (1 Sinh Menh), do (2 Uy Luc), tim co van set (3 Sam Set),
   bac xanh nhat (4 Thanh Tay), vang co canh (big = Than Quang)."""
import os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
im = np.asarray(Image.open(os.path.join(ROOT, 'art/caelum/sheet-crosses.jpg')).convert('RGB')).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
# "do hong": r va b cao hon g -> nen; alpha = 1 - do hong (mem 2 nguong)
mag = np.minimum(r, b) - g
alpha = np.clip((140 - mag) / 90, 0, 1)
# go mau hong lan o vien (despill): ha r, b ve muc g + phan con lai
spill = np.clip(np.minimum(r, b) - np.maximum(g, 0) - 40, 0, None) * (1 - alpha)
out = im.copy(); out[..., 0] -= spill; out[..., 2] -= spill
mask = alpha > 0.5
mask = ndi.binary_opening(mask, iterations=2)
lab, n = ndi.label(mask)
objs = [(s, (lab[s] > 0).sum()) for s in ndi.find_objects(lab)]
objs = [o for o in objs if o[1] > 5000]
objs.sort(key=lambda o: (round(o[0][0].start / 300), o[0][1].start))
names = ['1', '2', '3', '4', 'big']
assert len(objs) == 5, len(objs)
rgba = np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8)
for name, (sl, _) in zip(names, objs):
    y0, y1 = max(0, sl[0].start - 6), sl[0].stop + 6; x0, x1 = max(0, sl[1].start - 6), sl[1].stop + 6
    crop = Image.fromarray(rgba[y0:y1, x0:x1])
    h = 320 if name != 'big' else 420
    crop = crop.resize((round(crop.width * h / crop.height), h), Image.LANCZOS)
    p = os.path.join(ROOT, f'src/assets/sprites/caelum_cross_{name}.webp')
    crop.save(p, quality=90); print(p, crop.size)
