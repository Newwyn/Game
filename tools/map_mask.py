# Lưới ô "đi được / chặn" cho bản đồ kiểu Pokémon (ảnh nhìn từ trên xuống) — tự đoán theo màu rồi sửa tay
# Dùng: python tools/map_mask.py <ảnh> <ô_px> <ra.json> [debug.png] [tỉ_lệ_tối=0.06]
#   ô đi được = phần lớn điểm ảnh giống màu cỏ / đường đất / đá lát (lấy mẫu tự động: các màu phổ biến nhất, sáng, ít bão hoà tối)
# Kết quả: { "tile": 32, "cols": .., "rows": .., "grid": ["..##..", ...] } ('.' đi được, '#' chặn) — sửa tay thêm trong game/maps.js
import sys, json
from PIL import Image, ImageDraw

src, T, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
dbg = sys.argv[4] if len(sys.argv) > 4 else None
DARK = float(sys.argv[5]) if len(sys.argv) > 5 else 0.06   # tỉ lệ điểm tối cho phép trong 1 ô (cỏ vẽ nét đậm -> tăng lên)
im = Image.open(src).convert('RGB')
W, H = im.size
cols, rows = W // T, H // T
px = im.load()


def kind(r, g, b):
    mx, mn = max(r, g, b), min(r, g, b)
    # cỏ sáng: xanh lá trội, khá sáng
    if g > 130 and g > r + 20 and g > b + 30 and mx > 130:
        return 'grass'
    # đường đất: nâu cam nhạt
    if r > 95 and g > 75 and b < 140 and r > b + 25 and r >= g:
        return 'path'
    # nền rừng xanh ngọc / sương mù
    if g > 140 and b > 100 and g > r + 50:
        return 'grass'
    # đá lát / sỏi: xám sáng ít màu
    if mx - mn < 40 and mx > 105:
        return 'stone'
    return 'other'


grid = []
for ty in range(rows):
    row = ''
    for tx in range(cols):
        n = good = dark = 0
        for y in range(ty * T + 1, ty * T + T - 1, 2):
            for x in range(tx * T + 1, tx * T + T - 1, 2):
                n += 1
                r, g, b = px[x, y]
                if kind(r, g, b) != 'other':
                    good += 1
                if r * .3 + g * .59 + b * .11 < 75:   # viền / bóng cây, mái nhà tối
                    dark += 1
        row += '.' if good / max(1, n) > 0.7 and dark / max(1, n) < DARK else '#'
    grid.append(row)
# chỉ giữ vùng đi được liền nhau lớn nhất (bỏ các đốm cỏ lọt giữa rừng cây)
seen, best = set(), set()
for sy in range(rows):
    for sx in range(cols):
        if grid[sy][sx] != '.' or (sx, sy) in seen:
            continue
        comp, st = set(), [(sx, sy)]
        seen.add((sx, sy))
        while st:
            x, y = st.pop(); comp.add((x, y))
            for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
                if 0 <= nx < cols and 0 <= ny < rows and (nx, ny) not in seen and grid[ny][nx] == '.':
                    seen.add((nx, ny)); st.append((nx, ny))
        if len(comp) > len(best):
            best = comp
grid = [''.join('.' if (x, y) in best else '#' for x in range(cols)) for y in range(rows)]
json.dump({'tile': T, 'cols': cols, 'rows': rows, 'grid': grid}, open(out, 'w'), indent=0)
if dbg:
    ov = im.copy().convert('RGBA')
    layer = Image.new('RGBA', ov.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for ty, row in enumerate(grid):
        for tx, c in enumerate(row):
            if c == '#':
                d.rectangle([tx * T, ty * T, tx * T + T - 1, ty * T + T - 1], fill=(255, 0, 0, 90))
            d.rectangle([tx * T, ty * T, tx * T + T - 1, ty * T + T - 1], outline=(0, 0, 0, 40))
    for tx in range(0, cols, 5):
        d.text((tx * T + 2, 2), str(tx), fill=(255, 255, 255, 255))
    for ty in range(0, rows, 5):
        d.text((2, ty * T + 2), str(ty), fill=(255, 255, 255, 255))
    ov = Image.alpha_composite(ov, layer)
    ov.convert('RGB').save(dbg)
print(cols, rows)
