"""Cat tranh 4 goc xoay cua bua (Flow, nen xanh, 4 cay dung thang dau bua o tren) -> dai 4 khung bang nhau, nen trong suot.
   Moi khung: day can (num) nam giua mep duoi -> trong game dat dung nam tay Pary.
   python art/pary/turn_strip.py <anh.png> <ra.webp>"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, out_p = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
over = g - np.maximum(r, b)
alpha = np.clip(1 - (over - 25) / 70, 0, 1)
fg = alpha > 0.5
lab, n = ndi.label(ndi.binary_closing(fg, iterations=2))
sizes = ndi.sum(fg, lab, range(1, n + 1))
big = sorted(range(1, n + 1), key=lambda k: -sizes[k - 1])[:4]
boxes = []
for k in big:
    ys, xs = np.nonzero(lab == k)
    boxes.append((xs.min(), xs.max() + 1, ys.min(), ys.max() + 1, k))
boxes.sort()                                  # trai -> phai = goc 0, 45, 90, 135
g2 = np.where(over > 0, np.maximum(r, b) + over * 0.15, g)
rgba = np.dstack([r, g2, b, alpha * 255]).clip(0, 255).astype(np.uint8)
frames = []
for x0, x1, y0, y1, k in boxes:
    m = ndi.binary_dilation(lab == k, iterations=3)
    f = rgba.copy(); f[..., 3] = (f[..., 3] * m).astype(np.uint8)
    # tam ngang = vi tri num can (hang duoi cung)
    bot = np.nonzero(f[y1 - 6:y1, x0:x1, 3] > 128)[1]
    cx = x0 + (bot.mean() if len(bot) else (x1 - x0) / 2)
    frames.append((f, cx, y0, y1))
H = max(y1 - y0 for _, _, y0, y1 in frames)
half = int(max(max(cx - (np.nonzero(f[y0:y1].max(0)[:, 3] > 10)[0].min()), np.nonzero(f[y0:y1].max(0)[:, 3] > 10)[0].max() - cx) for f, cx, y0, y1 in frames)) + 4
W = half * 2
strip = Image.new('RGBA', (W * 4, H), (0, 0, 0, 0))
for i, (f, cx, y0, y1) in enumerate(frames):
    crop = Image.fromarray(f).crop((int(cx - half), y1 - H, int(cx - half) + W, y1))
    strip.paste(crop, (i * W, 0), crop)
s = 512 / H
strip = strip.resize((round(strip.width * s), 512), Image.LANCZOS)
strip.save(out_p, quality=92)
print(out_p, strip.size, 'frame aspect', round(W / H, 3))
