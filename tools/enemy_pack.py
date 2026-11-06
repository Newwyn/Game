# Ảnh quái (2 dáng cạnh nhau trên nền xanh lá: trái = đứng, phải = tấn công) -> atlas webp + json khung cho FrameSpriteView
# Dùng: python tools/enemy_pack.py <tên>      (lấy file mới nhất trong Downloads)
#   -> src/assets/sprites/enemy_<tên>.webp + src/characters/sprite/enemy_<tên>.json
import sys, os, glob, time, json
from PIL import Image

name = sys.argv[1]
TARGET_H = 300          # chiều cao khung đứng trong atlas (px)
dl = os.path.join(os.path.expanduser('~'), 'Downloads')
files = [f for f in glob.glob(os.path.join(dl, '*')) if os.path.isfile(f) and time.time() - os.path.getmtime(f) < 600]
if not files:
    sys.exit('Không thấy file mới trong Downloads')
src = max(files, key=os.path.getmtime)
im = Image.open(src).convert('RGBA')
px = im.load()
w, h = im.size
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if g > 120 and g > r * 1.35 and g > b * 1.35:
            px[x, y] = (r, g, b, 0)
        elif g > r * 1.1 and g > b * 1.1 and g > 90:
            px[x, y] = (r, min(g, max(r, b)), b, 150)

# tách 2 dáng: tìm cột trống (alpha = 0) gần giữa ảnh nhất
alpha = im.getchannel('A')
cols = [sum(1 for y in range(0, h, 2) if alpha.getpixel((x, y)) > 40) for x in range(w)]
mid = w // 2
best = min(range(int(w * 0.3), int(w * 0.7)), key=lambda x: (cols[x], abs(x - mid)))
halves = [im.crop((0, 0, best, h)), im.crop((best, 0, w, h))]
crops = []
for part in halves:
    bb = part.getbbox()
    crops.append(part.crop(bb) if bb else part)
k = TARGET_H / crops[0].height
crops = [c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.LANCZOS) for c in crops]
pad = 4
aw = sum(c.width for c in crops) + pad * 3
ah = max(c.height for c in crops) + pad * 2
atlas = Image.new('RGBA', (aw, ah), (0, 0, 0, 0))
frames, x = {}, pad
for key, c in zip(['idle1', 'attack1'], crops):
    atlas.paste(c, (x, pad))
    frames[key] = {'org': [round(c.width / 2), c.height], 'top': c.height, 'rect': [x, pad, c.width, c.height]}
    x += c.width + pad
out_img = f'src/assets/sprites/enemy_{name}.webp'
atlas.save(out_img, 'WEBP', quality=88, method=6)
with open(f'src/characters/sprite/enemy_{name}.json', 'w', encoding='utf-8') as f:
    json.dump({'image': f'enemy_{name}.webp', 'size': [aw, ah], 'atlasScale': 1, 'frames': frames}, f)
os.remove(src)
print(out_img, atlas.size, {k: v['rect'] for k, v in frames.items()})
