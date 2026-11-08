# Quái 4 dáng trên 1 hàng (đứng · đánh · bước trái · bước phải) nền xanh lá -> atlas + json cho FrameSpriteView
# Dùng: python tools/enemy_pack4.py <ảnh.png> <tên> [--strict]
#   -> src/assets/sprites/enemy_<tên>.webp + src/characters/sprite/enemy_<tên>.json (khung idle1, attack1, walk1, walk2)
#   --strict: chỉ xoá đúng màu nền #00FF00 (quái có màu xanh lá trên người)
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, name = sys.argv[1], sys.argv[2]
strict = '--strict' in sys.argv
H = 300   # chiều cao khung đứng trong atlas
a = np.asarray(Image.open(src).convert('RGBA')).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
if strict:
    bg = (g > 200) & (r < 110) & (b < 110)
    fringe = (g > 170) & (g > r + 60) & (g > b + 60) & ~bg
else:
    bg = (g > 120) & (g > r * 1.35) & (g > b * 1.35)
    fringe = (g > r * 1.1) & (g > b * 1.1) & (g > 90) & ~bg
out = a.copy()
out[bg, 3] = 0
out[fringe, 1] = np.maximum(out[fringe, 0], out[fringe, 2])
out[fringe, 3] = 150
# tách 4 dáng: cột không có điểm ảnh nào -> khe giữa các dáng
fg = out[..., 3] > 40
cols = ndi.binary_dilation(fg.any(axis=0), iterations=6)
lab, n = ndi.label(cols)
spans = sorted([(sl[0].start, sl[0].stop) for sl in ndi.find_objects(lab)], key=lambda s: s[0])
spans = [s for s in spans if s[1] - s[0] > 60]
if len(spans) != 4:
    # dự phòng: chia đều 4 phần
    w = a.shape[1] // 4
    spans = [(i * w, (i + 1) * w) for i in range(4)]
img = Image.fromarray(out.astype('uint8'))
frames, poses = {}, []
for (x0, x1) in spans:
    p = img.crop((x0, 0, x1, a.shape[0]))
    bb = p.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    poses.append(p.crop(bb))
# cùng tỉ lệ cho cả 4 dáng: dáng ĐỨNG cao H px
k = H / poses[0].height
scaled = [p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS) for p in poses]
W = sum(p.width for p in scaled) + 4 * (len(scaled) + 1)
Ht = max(p.height for p in scaled) + 8
atlas = Image.new('RGBA', (W, Ht), (0, 0, 0, 0))
x = 4
for key, p in zip(['idle1', 'attack1', 'walk1', 'walk2'], scaled):
    atlas.alpha_composite(p, (x, 4))
    frames[key] = {'org': [p.width // 2, p.height], 'top': p.height, 'rect': [x, 4, p.width, p.height]}
    x += p.width + 4
atlas.save(f'src/assets/sprites/enemy_{name}.webp', quality=90)
json.dump({'image': f'enemy_{name}.webp', 'size': [W, Ht], 'atlasScale': 1, 'frames': frames}, open(f'src/characters/sprite/enemy_{name}.json', 'w'))
print(name, atlas.size, len(spans), 'dáng')
