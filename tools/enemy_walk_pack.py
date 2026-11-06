# Thêm 2 khung ĐI BỘ (walk1, walk2) vào atlas quái có sẵn
# Dùng: python tools/enemy_walk_pack.py <tên> [ảnh.png] [--strict]   (mặc định .team/art/raw/walk_<tên>.png — 2 dáng cạnh nhau trên nền xanh lá)
#   -> cập nhật src/assets/sprites/enemy_<tên>.webp + src/characters/sprite/enemy_<tên>.json (giữ nguyên các khung cũ)
import sys, json
from PIL import Image

name = sys.argv[1]
strict = '--strict' in sys.argv   # quái da xanh lá (goblin): chỉ xoá đúng màu nền #00FF00
args = [a for a in sys.argv[2:] if a != '--strict']
src = args[0] if args else f'.team/art/raw/walk_{name}.png'
meta_p = f'src/characters/sprite/enemy_{name}.json'
atlas_p = f'src/assets/sprites/enemy_{name}.webp'
meta = json.load(open(meta_p))
atlas = Image.open(atlas_p).convert('RGBA')

im = Image.open(src).convert('RGBA')
px = im.load()
w, h = im.size
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if strict:
            if g > 200 and r < 110 and b < 110:
                px[x, y] = (0, 0, 0, 0)
            elif g > 170 and r < 150 and b < 150 and g > r + 60 and g > b + 60:
                px[x, y] = (r, min(g, max(r, b) + 40), b, 140)
        elif g > 120 and g > r * 1.35 and g > b * 1.35:
            px[x, y] = (0, 0, 0, 0)
        elif g > r * 1.1 and g > b * 1.1 and g > 90:
            px[x, y] = (r, min(g, max(r, b)), b, 150)
alpha = im.getchannel('A')
cols = [sum(1 for y in range(0, h, 2) if alpha.getpixel((x, y)) > 40) for x in range(w)]
best = min(range(int(w * 0.3), int(w * 0.7)), key=lambda x: (cols[x], abs(x - w // 2)))
poses = [im.crop((0, 0, best, h)), im.crop((best, 0, w, h))]
poses = [p.crop(p.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()) for p in poses]

idle_h = meta['frames']['idle1']['rect'][3]
x0 = atlas.width + 4
new_w = x0 + sum(round(p.width * idle_h / p.height) + 4 for p in poses)
out = Image.new('RGBA', (new_w, max(atlas.height, idle_h + 8)), (0, 0, 0, 0))
out.alpha_composite(atlas, (0, 0))
x = x0
for i, p in enumerate(poses):
    pw = round(p.width * idle_h / p.height)
    p = p.resize((pw, idle_h), Image.LANCZOS)
    out.alpha_composite(p, (x, 4))
    meta['frames'][f'walk{i + 1}'] = {'org': [pw // 2, idle_h], 'top': idle_h, 'rect': [x, 4, pw, idle_h]}
    x += pw + 4
meta['size'] = [out.width, out.height]
out.save(atlas_p, quality=90)
json.dump(meta, open(meta_p, 'w'))
print(name, out.size, [meta['frames'][f'walk{i}']['rect'] for i in (1, 2)])
