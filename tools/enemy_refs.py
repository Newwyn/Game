# ============================================================
# Hình mẫu cho Flow vẽ bộ hình động đầy đủ của quái (art/enemies/<art>/ref.png)
#   lấy khung idle1 + attack1 từ atlas quái hiện có, phóng to, đặt cạnh nhau trên nền xanh #00FF00
#   uv run --no-project --with pillow python tools/enemy_refs.py
# Sói thường / Sói Đầu Đàn chưa có atlas trận -> dùng thiết kế sói "mẫu 1" trong dự án Flow của Rok
# ============================================================
import json, os, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'art', 'enemies')
H = 700   # chiều cao 1 dáng trong hình mẫu


def frames_of(img_path, meta_path, names):
    im = Image.open(img_path).convert('RGBA')
    meta = json.load(open(meta_path, encoding='utf-8'))
    out = []
    for n in names:
        f = meta['frames'].get(n)
        if not f:
            continue
        x, y, w, h = f['rect']
        out.append(im.crop((x, y, x + w, y + h)))
    return out


def sheet(parts, dst):
    parts = [p.resize((max(1, round(p.width * H / p.height)), H), Image.LANCZOS) for p in parts]
    W = sum(p.width for p in parts) + 80 * (len(parts) + 1)
    bg = Image.new('RGBA', (W, H + 120), (0, 255, 0, 255))
    x = 80
    for p in parts:
        bg.alpha_composite(p, (x, 60)); x += p.width + 80
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    bg.convert('RGB').save(dst)


n = 0
for meta in sorted(glob.glob(os.path.join(ROOT, 'src/characters/sprite/enemy_*.json'))):
    art = os.path.basename(meta)[6:-5]
    img = os.path.join(ROOT, 'src/assets/sprites', f'enemy_{art}.webp')
    sheet(frames_of(img, meta, ['idle1', 'attack1']), os.path.join(OUT, art, 'ref.png')); n += 1
print('ref', n)
