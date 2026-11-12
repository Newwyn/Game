# Đọc tranh nền 5 bản đồ (src/assets/maps/<khu>.webp, 43 x 24 ô 32px) + lưới đi được (src/world/maps.js)
# -> đoán loại mặt đất từng ô cho bản đồ 3D: src/world/terrain3d.js
#   g cỏ · p đường đất · s đá lát / sân gạch · w nước · f ruộng lúa · d nền rừng tối · t cây (ô chặn màu xanh đậm)
#   b vật chặn khác (nhà, đá, hàng rào… — bản đồ 3D tự đặt mô hình theo tay, xem src/world3d/layouts.js)
# Dùng: .team/pyenv/Scripts/python.exe tools/build_terrain3d.py   (+ ảnh soi: .team/terrain3d_<khu>.png)
# Sửa tay: thêm vào FIX (khu -> [(ký tự, x1, y1, x2, y2)]) rồi chạy lại.
import json, colorsys, os
from PIL import Image, ImageDraw

MAPS_JS = 'src/world/maps.js'
FIX = {
    'forest': [('w', 40, 0, 42, 23)],
    'road': [('w', 11, 0, 20, 23), ('g', 10, 0, 10, 9), ('g', 10, 14, 10, 23), ('g', 21, 0, 21, 9), ('g', 21, 14, 21, 23)],
}
COLORS = {'g': (110, 190, 80), 'p': (180, 130, 80), 's': (150, 150, 155), 'w': (60, 120, 220), 'f': (230, 200, 60),
          'd': (40, 110, 90), 't': (20, 80, 30), 'b': (200, 60, 60)}


def load_maps():
    src = open(MAPS_JS, encoding='utf8').read()
    return json.loads(src[src.index('{'):src.rindex('}') + 1])


def classify(px, walk):
    r, g, b = [c / 255 for c in px]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    h *= 360
    if 180 <= h <= 250 and s > 0.35 and v > 0.4:
        return 'w'
    if s < 0.16 and v > 0.35:
        return 's'
    if 15 <= h <= 42 and 0.25 < s < 0.8 and 0.35 < v < 0.85:
        return 'p'
    if 42 < h <= 65 and s > 0.45 and v > 0.6:
        return 'f'
    if 70 <= h <= 170:
        if v < 0.42:
            return 'd' if walk else 't'
        if 150 <= h <= 170 or (h > 140 and s < 0.55):
            return 'd' if walk else 't'
        return 'g' if walk else ('t' if v < 0.62 else 'g')
    return 'g' if walk else 'b'


def main():
    maps = load_maps()
    out = {}
    for mid, m in maps.items():
        if mid == 'capital':
            from build_capital import city
            out[mid] = city()[2]
            continue
        if m.get('interior'):   # trong nhà: vẽ tranh phẳng, không dựng 3D
            continue
        im = Image.open(f"src/assets/maps/{m['image']}.webp").convert('RGB')
        T = m['tile']
        rows = []
        for y in range(m['rows']):
            row = ''
            for x in range(m['cols']):
                box = im.crop((x * T + 8, y * T + 8, x * T + T - 8, y * T + T - 8)).resize((1, 1), Image.BOX)
                walk = m['grid'][y][x] == '.'
                c = classify(box.getpixel((0, 0)), walk)
                if walk and c in ('t', 'b'):
                    c = 'g'
                row += c
            rows.append(list(row))
        # ô nước lẻ tẻ (< 4 ô liền nhau) là nhận nhầm (nấm xanh, đá lấp lánh…) -> cỏ
        seen = set()
        for y in range(m['rows']):
            for x in range(m['cols']):
                if rows[y][x] != 'w' or (x, y) in seen:
                    continue
                comp, st = [], [(x, y)]
                seen.add((x, y))
                while st:
                    cx, cy = st.pop()
                    comp.append((cx, cy))
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < m['cols'] and 0 <= ny < m['rows'] and rows[ny][nx] == 'w' and (nx, ny) not in seen:
                            seen.add((nx, ny))
                            st.append((nx, ny))
                if len(comp) < 4:
                    for cx, cy in comp:
                        rows[cy][cx] = 'd' if mid == 'forest' else 'g'
        for ch, x1, y1, x2, y2 in FIX.get(mid, []):
            for y in range(y1, y2 + 1):
                for x in range(x1, x2 + 1):
                    rows[y][x] = ch
        out[mid] = [''.join(r) for r in rows]
        # ảnh soi
        dbg = im.copy()
        d = ImageDraw.Draw(dbg, 'RGBA')
        for y, r in enumerate(out[mid]):
            for x, ch in enumerate(r):
                d.rectangle((x * T, y * T, x * T + T - 1, y * T + T - 1), fill=COLORS[ch] + (110,))
        os.makedirs('.team', exist_ok=True)
        dbg.save(f'.team/terrain3d_{mid}.png')
    with open('src/world/terrain3d.js', 'w', encoding='utf8') as f:
        f.write('// Tự sinh bởi tools/build_terrain3d.py — loại mặt đất từng ô cho bản đồ 3D (sửa FIX trong file đó rồi chạy lại)\n')
        f.write('// g cỏ · p đường đất · s đá lát · w nước · f ruộng lúa · d nền rừng tối · t cây · b vật chặn khác\n')
        f.write('export const TERRAIN = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
    print('OK', {k: len(v) for k, v in out.items()})


main()
