"""Khu am xanh la con sot o mep / xich manh sau khi tach nen (Caelum khong mac do xanh la). Chi ha kenh G, khong ve lai.
   python art/caelum/despill.py src/assets/sprites/caelum_sprite.webp [...]"""
import sys, numpy as np
from PIL import Image
for p in sys.argv[1:]:
    im = Image.open(p).convert('RGBA'); a = np.asarray(im).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.maximum(r, b)
    spill = g > m + 18
    a[..., 1] = np.where(spill, m + 8, g)
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(p, quality=92)
    print(p, 'khu', int(spill.sum()), 'diem')
