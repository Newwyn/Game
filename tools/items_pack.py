# Cắt bộ đồ vật (lưới cột x hàng trên nền xanh lá) -> items*.webp ô vuông đều, căn đáy, nền trong suốt
# Dùng: python tools/items_pack.py <ảnh_gốc> <ra.webp> [cột=4] [hàng=3] [ô=96]
import sys, json
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
C = int(sys.argv[3]) if len(sys.argv) > 3 else 4
R = int(sys.argv[4]) if len(sys.argv) > 4 else 3
CS = int(sys.argv[5]) if len(sys.argv) > 5 else 96
im = Image.open(src).convert('RGBA'); px = im.load(); W, H = im.size
for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]
        if g > 110 and g > r * 1.3 and g > b * 1.3: px[x, y] = (0, 0, 0, 0)
        elif g > r * 1.1 and g > b * 1.1 and g > 90: px[x, y] = (r, min(g, max(r, b) + 10), b, 255)
# dấu lấp lánh của Flow ở góc phải dưới
for y in range(int(H * 0.9), H):
    for x in range(int(W * 0.94), W): px[x, y] = (0, 0, 0, 0)
sheet = Image.new('RGBA', (C * CS, R * CS))
pad = 4
for ry in range(R):
    for cx in range(C):
        c = im.crop((round(cx * W / C), round(ry * H / R), round((cx + 1) * W / C), round((ry + 1) * H / R)))
        # bỏ đốm nhỏ lẻ: lấy hộp bao của kênh alpha đã lọc
        a = c.getchannel('A').point(lambda v: 255 if v > 40 else 0)
        bb = a.getbbox()
        if not bb: continue
        c = c.crop(bb)
        k = min((CS - pad * 2) / c.width, (CS - pad * 2) / c.height)
        c = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.NEAREST if k >= 1 else Image.LANCZOS)
        sheet.alpha_composite(c, (cx * CS + (CS - c.width) // 2, ry * CS + CS - pad - c.height))
sheet.save(out, 'WEBP', lossless=True)
json.dump({'cols': C, 'rows': R, 'cw': CS, 'ch': CS}, open(out.rsplit('.', 1)[0] + '.json', 'w'))
print(out, sheet.size)
