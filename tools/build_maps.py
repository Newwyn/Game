# Dựng bản đồ kiểu Pokémon: ảnh nền (Flow) + lưới đi được (tự đoán bằng tools/map_mask.py) + sửa tay + vị trí NPC / đồ vật / lối ra
# Dùng: python tools/build_maps.py   -> src/assets/maps/<khu>.webp + src/world/maps.js   (+ .team/art/maps/final_<khu>.png để soi)
# Sửa bản đồ: đổi OPS (ô 'walk' / 'block' theo hình chữ nhật x1,y1,x2,y2 tính bằng ô 32px) hoặc LAYOUT rồi chạy lại.
import json, os, shutil
from PIL import Image, ImageDraw

ART = '.team/art/maps'
SRC = {'outskirts': 'm0', 'forest': 'm1', 'ashford': 'm2', 'road': 'm3', 'capital': 'm4'}

OPS = {
    'outskirts': [('walk', 3, 0, 5, 22), ('walk', 0, 10, 5, 11), ('walk', 6, 11, 6, 12), ('walk', 36, 11, 42, 13),
                  ('block', 27, 0, 34, 5)],
    'forest': [('walk', 0, 11, 10, 12), ('walk', 9, 10, 22, 10), ('walk', 21, 10, 23, 16), ('walk', 23, 15, 31, 16),
               ('walk', 29, 12, 32, 15), ('walk', 31, 11, 39, 12), ('walk', 24, 6, 35, 8), ('walk', 29, 9, 35, 10),
               ('walk', 25, 17, 31, 19), ('block', 40, 0, 42, 23), ('block', 11, 11, 17, 14)],
    'ashford': [('walk', 37, 11, 42, 13), ('walk', 19, 19, 21, 23)],
    'road': [('walk', 7, 3, 10, 9), ('walk', 2, 7, 10, 9), ('walk', 2, 14, 10, 15), ('walk', 0, 10, 11, 13), ('walk', 10, 11, 21, 12), ('walk', 36, 10, 42, 13), ('block', 11, 0, 20, 9), ('block', 11, 14, 20, 23)],
    'capital': [('block', 0, 0, 5, 23), ('block', 0, 19, 42, 23), ('block', 18, 0, 38, 7), ('block', 37, 0, 42, 8),
                ('block', 36, 14, 42, 18), ('block', 34, 16, 36, 18), ('walk', 20, 17, 23, 20)],
}

# npcs: id -> (x, y, hướng) · objects: id, x, y, sprite (ô trong items.webp) hoặc area (vật vẽ sẵn trên nền), trigger (đi vào là kích hoạt)
# exits: edge 'left'/'right'/'up'/'down' với khoảng ô a..b, hoặc tiles; scene + at (ô xuất hiện) + face
LAYOUT = {
    'outskirts': {
        'spawn': [3, 12],
        'npcs': {'farmer': (18, 15, 'down'), 'jessica': (26, 14, 'left')},
        'objects': [
            {'id': 'ambush', 'x': 27, 'y': 15, 'char': 'npc_goblin', 'trigger': [[x, y] for x in range(22, 26) for y in range(13, 17)]},
            {'id': 'wheat', 'x': 10, 'y': 6, 'sprite': 'wheat'},
            {'id': 'hammer', 'x': 12, 'y': 20, 'sprite': 'hammer'},
            {'id': 'mine', 'x': 32, 'y': 7, 'sprite': 'mine', 'big': True},
            {'id': 'field_chest', 'x': 35, 'y': 14, 'sprite': 'chest'},
        ],
        'exits': [{'edge': 'left', 'a': 0, 'b': 23, 'scene': 'ashford', 'at': [41, 12], 'face': 'left'},
                  {'edge': 'right', 'a': 0, 'b': 23, 'scene': 'forest', 'at': [1, 11], 'face': 'right'}],
    },
    'forest': {
        'spawn': [1, 11],
        'npcs': {},
        'objects': [{'id': 'mushroom', 'x': 7, 'y': 6, 'sprite': 'mushroom'}, {'id': 'herb', 'x': 28, 'y': 18, 'sprite': 'herb'},
                    {'id': 'forest_chest', 'x': 33, 'y': 7, 'sprite': 'chest'}],
        'exits': [{'edge': 'left', 'a': 0, 'b': 23, 'scene': 'outskirts', 'at': [41, 12], 'face': 'left'}],
    },
    'ashford': {
        'spawn': [19, 15],
        'npcs': {'mira': (19, 9, 'down'), 'borin': (32, 11, 'down'), 'lena': (31, 19, 'down'), 'sera': (8, 12, 'left'),
                 'rok': (36, 12, 'left'), 'villager_m': (14, 15, 'down'), 'villager_f': (26, 13, 'down'), 'kid': (23, 17, 'down')},
        'objects': [
            {'id': 'board', 'x': 19, 'y': 12, 'area': [[x, y] for x in range(18, 21) for y in range(11, 13)]},
            {'id': 'well', 'x': 5, 'y': 12, 'area': [[x, y] for x in range(4, 7) for y in range(10, 14)]},
            {'id': 'sq_chest', 'x': 12, 'y': 9, 'sprite': 'chest'},
            {'id': 'well_chest', 'x': 7, 'y': 14, 'sprite': 'chest'},
        ],
        'exits': [{'edge': 'right', 'a': 0, 'b': 23, 'scene': 'outskirts', 'at': [1, 11], 'face': 'right'},
                  {'edge': 'down', 'a': 0, 'b': 42, 'scene': 'road', 'at': [1, 11], 'face': 'right'}],
    },
    'road': {
        'spawn': [3, 11],
        'npcs': {'guard': (27, 12, 'left'), 'merchant': (32, 8, 'down')},
        'objects': [{'id': 'bridge_chest', 'x': 8, 'y': 4, 'sprite': 'chest'}],
        'exits': [{'edge': 'left', 'a': 0, 'b': 23, 'scene': 'ashford', 'at': [20, 22], 'face': 'up'},
                  {'edge': 'right', 'a': 0, 'b': 23, 'scene': 'capital', 'at': [21, 18], 'face': 'up'}],
    },
    'capital': {
        'spawn': [21, 17],
        'npcs': {'corvin': (8, 16, 'down'), 'elise': (28, 9, 'down'), 'nun': (13, 8, 'down'), 'villager_m2': (23, 18, 'left'),
                 'merchant2': (19, 15, 'down')},
        'objects': [{'id': 'gate_board', 'x': 25, 'y': 17, 'sprite': 'board', 'big': True},
                    {'id': 'market_chest', 'x': 31, 'y': 16, 'sprite': 'chest'},
                    {'id': 'pages', 'x': 11, 'y': 17, 'sprite': 'pages'},
                    {'id': 'crypt', 'x': 16, 'y': 9, 'sprite': 'mine'}],
        'exits': [{'tiles': [[20, 20], [21, 20], [22, 20], [23, 20]], 'scene': 'road', 'at': [41, 11], 'face': 'left'}],
    },
}


def nearest(grid, x, y, taken):
    cols, rows = len(grid[0]), len(grid)
    best = None
    for yy in range(rows):
        for xx in range(cols):
            if grid[yy][xx] == '.' and (xx, yy) not in taken:
                d = abs(xx - x) + abs(yy - y)
                if best is None or d < best[0]:
                    best = (d, xx, yy)
    return best[1], best[2]


def component(grid, sx, sy):
    cols, rows = len(grid[0]), len(grid)
    seen, st = {(sx, sy)}, [(sx, sy)]
    while st:
        x, y = st.pop()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < cols and 0 <= ny < rows and (nx, ny) not in seen and grid[ny][nx] == '.':
                seen.add((nx, ny)); st.append((nx, ny))
    return seen


os.makedirs('src/assets/maps', exist_ok=True)
os.makedirs('src/world', exist_ok=True)
out = {}
for scene, m in SRC.items():
    data = json.load(open(f'{ART}/{m}.json'))
    grid = [list(r) for r in data['grid']]
    for op, x1, y1, x2, y2 in OPS[scene]:
        for y in range(y1, y2 + 1):
            for x in range(x1, x2 + 1):
                if 0 <= y < len(grid) and 0 <= x < len(grid[0]):
                    grid[y][x] = '.' if op == 'walk' else '#'
    L = LAYOUT[scene]
    sx, sy = L['spawn']
    grid[sy][sx] = '.'
    comp = component(grid, sx, sy)
    grid = [[('.' if (x, y) in comp else '#') for x in range(len(grid[0]))] for y in range(len(grid))]
    taken, moved = set(), []
    npcs = []
    for nid, (x, y, face) in L['npcs'].items():
        if grid[y][x] != '.' or (x, y) in taken:
            nx, ny = nearest(grid, x, y, taken); moved.append((nid, (x, y), (nx, ny))); x, y = nx, ny
        taken.add((x, y)); npcs.append({'id': nid, 'x': x, 'y': y, 'face': face})
    objs = []
    for o in L['objects']:
        o = dict(o)
        if 'area' not in o:
            if grid[o['y']][o['x']] != '.' or (o['x'], o['y']) in taken:
                nx, ny = nearest(grid, o['x'], o['y'], taken); moved.append((o['id'], (o['x'], o['y']), (nx, ny))); o['x'], o['y'] = nx, ny
            taken.add((o['x'], o['y']))
            o['solid'] = 'trigger' not in o
        objs.append(o)
    for e in L['exits']:
        for x, y in e.get('tiles', []):
            grid[y][x] = '.'
        ax, ay = e['at']
    rows = [''.join(r) for r in grid]
    out[scene] = {'image': scene, 'tile': 32, 'cols': len(rows[0]), 'rows': len(rows), 'spawn': L['spawn'], 'grid': rows,
                  'npcs': npcs, 'objects': objs, 'exits': L['exits']}
    shutil.copy(f'{ART}/{m}.webp', f'src/assets/maps/{scene}.webp')
    # ảnh soi
    im = Image.open(f'{ART}/{m}.webp').convert('RGBA')
    lay = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c == '#':
                d.rectangle([x * 32, y * 32, x * 32 + 31, y * 32 + 31], fill=(255, 0, 0, 80))
    for n in npcs:
        d.ellipse([n['x'] * 32 + 6, n['y'] * 32 + 6, n['x'] * 32 + 26, n['y'] * 32 + 26], fill=(0, 120, 255, 220))
    for o in objs:
        if 'area' in o:
            for x, y in o['area']:
                d.rectangle([x * 32 + 4, y * 32 + 4, x * 32 + 28, y * 32 + 28], outline=(255, 255, 0, 255), width=2)
        else:
            d.rectangle([o['x'] * 32 + 6, o['y'] * 32 + 6, o['x'] * 32 + 26, o['y'] * 32 + 26], fill=(255, 220, 0, 230))
    d.rectangle([sx * 32 + 8, sy * 32 + 8, sx * 32 + 24, sy * 32 + 24], fill=(255, 255, 255, 255))
    Image.alpha_composite(im, lay).convert('RGB').resize((688, 384)).save(f'{ART}/final_{scene}.png')
    for mv in moved:
        print(scene, 'dời', *mv)
    # kiểm tra điểm xuất hiện của các lối ra trỏ tới
open('src/world/maps.js', 'w', encoding='utf-8').write(
    '// Tự sinh bởi tools/build_maps.py — đừng sửa tay (sửa OPS / LAYOUT trong file đó rồi chạy lại)\n'
    '// grid: "." đi được, "#" chặn · toạ độ tính theo ô 32px của ảnh nền 1376x768 (43 x 24 ô)\n'
    'export const MAPS = ' + json.dumps(out, ensure_ascii=False) + ';\n')
# lối ra phải dẫn tới ô đi được
for scene, mp in out.items():
    for e in mp['exits']:
        ax, ay = e['at']
        if out[e['scene']]['grid'][ay][ax] != '.':
            print('LỖI: lối ra', scene, '->', e['scene'], 'xuất hiện ở ô chặn', e['at'])
print('xong', {k: sum(r.count('.') for r in v['grid']) for k, v in out.items()})
