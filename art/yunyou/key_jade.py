# Tach nen xanh la #00FF00 cho nhan vat co do mau ngoc (YunYou): JPG -> PNG trong suot, khu am xanh o mep.
#   python art/yunyou/key_jade.py   (doc art/yunyou/sheet-*.jpg -> art/yunyou/keyed/sheet-*.png)
import glob, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
os.makedirs('art/yunyou/keyed', exist_ok=True)
for f in sorted(glob.glob('art/yunyou/sheet-*.jpg')):
    im = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    d = g - np.maximum(r, b)                       # do "xanh la": nen ~200+, ngoc ~20-70, trang ~0
    a = np.clip(1 - (d - 85) / 60, 0, 1)           # d<=85 dac, d>=145 trong suot
    bg = a < 0.02
    near = ndi.binary_dilation(bg, iterations=4) & ~bg      # dai mep 4px sat nen
    cap = np.maximum(r, b) + np.where(near, 18, 70)         # mep: ep xanh ve gan trung tinh; ben trong: giu mau ngoc
    g2 = np.minimum(g, cap)
    a = np.where(ndi.binary_dilation(bg, iterations=1) & ~bg, a * 0.6, a)   # 1px sat nen mo bot
    out = np.dstack([r, g2, b, a * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save('art/yunyou/keyed/' + os.path.basename(f)[:-4] + '.png')
    print(os.path.basename(f), 'ok')
