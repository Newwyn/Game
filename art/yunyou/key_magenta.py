# Tach nen hong #FF00FF cho hinh hieu ung kiem ngoc: fan.jpg -> src/assets/sprites/yunyou_swordfan.webp (+ 1 thanh kiem dung: yunyou_sword.webp)
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open('art/yunyou/fan.jpg').convert('RGB')).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
m = np.minimum(r, b) - g                         # do "hong": nen ~240, kiem ngoc < 0
a = np.clip(1 - (m - 40) / 90, 0, 1)
bg = a < 0.02
near = ndi.binary_dilation(bg, iterations=3) & ~bg
r2 = np.where(near, np.minimum(r, g), r); b2 = np.where(near, np.minimum(b, g + 10), b)   # khu am hong o mep
out = np.dstack([r2, g, b2, a * 255]).astype(np.uint8)
img = Image.fromarray(out, 'RGBA')
ys, xs = np.where(a > 0.05)
box = (xs.min() - 8, ys.min() - 8, xs.max() + 8, ys.max() + 8)
img.crop(box).save('src/assets/sprites/yunyou_swordfan.webp', quality=92)
print('fan', box)
# thanh kiem giua (dung thang): cot quanh x=512, che bot phan chuoi chong len nhau bang cach lay tu mui toi can
sw = img.crop((476, 120, 548, 700))
sw.save('src/assets/sprites/yunyou_sword.webp', quality=92)
print('sword', sw.size)
