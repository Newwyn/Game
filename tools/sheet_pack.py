# Cắt bộ dáng đi (lưới cột x hàng trên nền xanh lá) -> atlas đều ô, căn giữa chân, nền trong suốt
# Dùng: python tools/sheet_pack.py <ảnh_gốc> <ra.webp> [cột=3] [hàng=4] [cao_ô=96]
#   hàng mặc định: xuống · trái · phải · lên ; cột: bước trái · đứng · bước phải
import sys, json
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
C = int(sys.argv[3]) if len(sys.argv) > 3 else 3
R = int(sys.argv[4]) if len(sys.argv) > 4 else 4
CH = int(sys.argv[5]) if len(sys.argv) > 5 else 96

im = Image.open(src).convert('RGBA')
px = im.load()
W, H = im.size
for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]
        if g > 120 and g > r * 1.35 and g > b * 1.35:
            px[x, y] = (0, 0, 0, 0)
        elif g > r * 1.15 and g > b * 1.15 and g > 100:
            px[x, y] = (r, min(g, max(r, b)), b, 255)

cells = []
for ry in range(R):
    for cx in range(C):
        box = (round(cx * W / C), round(ry * H / R), round((cx + 1) * W / C), round((ry + 1) * H / R))
        c = im.crop(box)
        bb = c.getbbox()
        cells.append(c.crop(bb) if bb else c)
mh = max(c.height for c in cells)
k = CH / mh
cells = [c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.NEAREST) for c in cells]
cw = max(c.width for c in cells)
atlas = Image.new('RGBA', (cw * C, CH * R), (0, 0, 0, 0))
for i, c in enumerate(cells):
    ry, cx = divmod(i, C)
    atlas.paste(c, (cx * cw + (cw - c.width) // 2, ry * CH + (CH - c.height)), c)
atlas.save(out, 'WEBP', lossless=True)
json.dump({'cols': C, 'rows': R, 'cw': cw, 'ch': CH}, open(out.rsplit('.', 1)[0] + '.json', 'w'))
print(out, atlas.size, cw, CH)
