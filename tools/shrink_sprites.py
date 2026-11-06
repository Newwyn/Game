# Thu nhỏ atlas sprite nhân vật (giảm bộ nhớ card đồ hoạ + thời gian tải) — nhân mọi số liệu điểm ảnh trong json cùng tỉ lệ
# Dùng: python tools/shrink_sprites.py 0.75            (mọi atlas rộng > 3000px; quái chương 1 enemy_* đã nhỏ -> bỏ qua)
# Kích thước nhân vật trong trận không đổi (FrameSpriteView tính theo tỉ lệ chiều cao), chỉ ảnh mịn hơn một chút khi phóng to.
import sys, json, os
from PIL import Image

k = float(sys.argv[1])
D = 'src/characters/sprite/'
S = 'src/assets/sprites/'


def scale(v):
    if isinstance(v, (int, float)):
        return round(v * k, 1)
    if isinstance(v, list):
        return [scale(x) for x in v]
    if isinstance(v, dict):
        return {a: scale(b) for a, b in v.items()}
    return v


for f in sorted(os.listdir(D)):
    if not f.endswith('.json') or f.startswith('enemy_'):
        continue
    meta = json.load(open(D + f, encoding='utf-8'))
    if meta['size'][0] <= 3000:
        continue
    im = Image.open(S + meta['image'])
    W, H = round(im.width * k), round(im.height * k)
    im.resize((W, H), Image.LANCZOS).save(S + meta['image'], 'WEBP', quality=90, method=6)
    meta['size'] = [W, H]
    meta['atlasScale'] = round(meta.get('atlasScale', 1) * k, 4)
    for fr in meta['frames'].values():
        for key in ('org', 'hand', 'pts', 'top'):
            if key in fr and fr[key] is not None:
                fr[key] = scale(fr[key])
        x, y, w, h = fr['rect']
        fr['rect'] = [round(x * k), round(y * k), max(1, round(w * k)), max(1, round(h * k))]
    json.dump(meta, open(D + f, 'w', encoding='utf-8'), separators=(',', ':'))
    print(f, meta['image'], (W, H), os.path.getsize(S + meta['image']) // 1024, 'KB')
