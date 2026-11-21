"""Xoa dau "AI" cua Flow (o bo goc ban trong suot, goc duoi phai tam 1152x864) -> to nen xanh ca khung dau.
   Tim khung: diem nhat mau xanh (trang de len nen xanh) trong goc duoi phai -> khung bao + 4px. Hinh nhan vat chi bi
   mat vai px ngay sau dau (dau nam o goc, chi cham chan cay thanh gia o o cuoi).
   python art/caelum/clean_flow_mark.py <anh.png> [...]   (ghi de)"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
for p in sys.argv[1:]:
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.int16); H, W = a.shape[:2]
    y0, x0 = int(H * 0.88), int(W * 0.89)
    reg = a[y0:, x0:]
    r, g, b = reg[..., 0], reg[..., 1], reg[..., 2]
    pale = (reg.mean(-1) > 150) & (g - np.maximum(r, b) > 8) & (g - np.maximum(r, b) < 120) & (np.minimum(r, b) > 90)
    lab, n = ndi.label(ndi.binary_closing(pale, iterations=3))
    if n == 0: print(p, 'khong thay dau'); continue
    sizes = ndi.sum(pale, lab, range(1, n + 1)); k = int(np.argmax(sizes)) + 1
    if sizes[k - 1] < 150: print(p, 'khong thay dau'); continue
    ys, xs = np.nonzero(lab == k)
    by0, by1, bx0, bx1 = max(0, ys.min() - 4), ys.max() + 5, max(0, xs.min() - 4), xs.max() + 5
    reg[by0:by1, bx0:bx1] = [0, 255, 0]
    a[y0:, x0:] = reg
    Image.fromarray(a.astype(np.uint8)).save(p)
    print(p, 'xoa khung', (bx0 + x0, by0 + y0, bx1 + x0, by1 + y0))
