# Lấy file vừa tải về (Downloads, thường là .tmp của trình duyệt trong app) -> đổi tên + nén webp vào thư mục game
# Dùng: python tools/grab_download.py <đích.webp> [rộng_tối_đa] [--key]   (--key: xoá nền xanh lá #00ff00 thành trong suốt)
import sys, os, glob, time
from PIL import Image

dst = sys.argv[1]
max_w = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 0
key = '--key' in sys.argv
dl = os.path.join(os.path.expanduser('~'), 'Downloads')
files = [f for f in glob.glob(os.path.join(dl, '*')) if os.path.isfile(f) and time.time() - os.path.getmtime(f) < 600]
if not files:
    sys.exit('Không thấy file mới trong Downloads')
src = max(files, key=os.path.getmtime)
im = Image.open(src).convert('RGBA')
if key:
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # nền xanh lá: g trội hẳn r, b -> trong suốt; viền pha xanh -> bớt xanh, mờ dần
            if g > 120 and g > r * 1.35 and g > b * 1.35:
                px[x, y] = (r, g, b, 0)
            elif g > r * 1.1 and g > b * 1.1 and g > 90:
                px[x, y] = (r, min(g, max(r, b)), b, 140)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
if max_w and im.width > max_w:
    im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
os.makedirs(os.path.dirname(dst), exist_ok=True)
im.save(dst, 'WEBP', quality=86, method=6)
os.remove(src)
print(dst, im.size, os.path.getsize(dst))
