"""Doi anh sang vang bi ngam nen xanh (thanh xanh chanh sau khi tach nen) ve lai mau VANG, chi trong cac khung chi dinh.
   Da xanh nhat cua Pary (G chi hon R/B mot chut) khong bi dong toi.
   python art/pary/goldspill.py <atlas.webp> <meta.json> whirl colossus   (ghi de atlas)"""
import sys, json, numpy as np
from PIL import Image

atlas, meta_p, *prefixes = sys.argv[1:]
meta = json.load(open(meta_p, encoding='utf8'))
im = Image.open(atlas).convert('RGBA')
a = np.asarray(im).astype(np.float32)
n = 0
for name, f in meta['frames'].items():
    if not any(name.startswith(p) for p in prefixes):
        continue
    x, y, w, h = f['rect']
    reg = a[y:y + h, x:x + w]
    r, g, b, al = reg[..., 0], reg[..., 1], reg[..., 2], reg[..., 3]
    over = g - np.maximum(r, b)
    # vet xanh chanh: G cao hon han B (da Pary: B gan bang R nen G-B nho) -> doi sang vang; da / toc giu nguyen
    t = np.clip((g - b - 55) / 45, 0, 1) * (over > 12) * (al > 0)
    L = g
    gold = np.stack([L, L * 0.82, L * 0.38], -1)
    reg[..., :3] = reg[..., :3] * (1 - t[..., None]) + gold * t[..., None]
    n += int((t > 0).sum())
Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(atlas, quality=92)
print(atlas, 'doi mau', n, 'diem')
