"""Cung điện Valoria: Sảnh ngai + 6 phòng (13/11/2026). Được tools/build_interiors.py gọi.

Mỗi phòng = bản vẽ ký tự + bảng đồ treo tường. Ô đi được: '.', '=', chữ số (lối sang phòng khác), N (người), E (cửa ra thành).
Đồ đạc lấy từ bộ custom/palace_* (tools/models/make_palace_kit.py — 1 đơn vị = 1 ô, mặt trước quay +Z).
Tường dùng dwall s=.75: mỗi mảng dài 3 ô -> rộng phòng chia hết cho 3, cao phòng = 3k+2, đồ treo đặt giữa mảng (x = 1.5 + 3i trên tường sau, z = 2 + 3i trên tường bên).
"""
HP = 1.57079632679
PI = 3.14159265359
K = 'custom/palace_'
WF = .5 + .30 + .005   # mặt trong của tường cung điện (custom/palace_wall_royal dày .6, tâm ở z=.5)

# ký tự -> (mô hình, số ô ngang, số ô dọc, góc quay)
LEG = {
    'P': ('column', 1, 1, 0), 'c': ('chair', 1, 1, 0), 'u': ('chair', 1, 1, PI), 'h': ('chair', 1, 1, HP), 'j': ('chair', 1, 1, -HP),
    'a': ('armchair', 1, 1, 0), 'q': ('armchair', 1, 1, PI),
    'T': ('dining_table', 6, 2, 0), 'R': ('council_table', 3, 3, 0), 'S': ('stairs_up', 3, 2, 0), 'D': ('stairwell_down', 3, 2, PI),
    'F': ('fireplace', 3, 1, 0), 'B': ('bookcase', 3, 1, 0), 'W': ('wardrobe', 1, 2, HP), 'V': ('vanity', 3, 1, 0), 'k': ('desk', 2, 1, 0),
    't': ('side_table', 1, 1, 0), 'v': ('vase_floor', 1, 1, 0), 'A': ('armor_stand', 1, 1, 0), 'K': ('candelabra', 1, 1, 0),
    'b': ('bench_cushion', 2, 1, 0), 'U': ('bust_pedestal', 1, 1, 0), 'H': ('harp', 1, 1, 0), 'G': ('globe_stand', 1, 1, 0),
    'p': ('planter_topiary', 1, 1, 0), 'y': ('bed_royal', 3, 3, 0), 'e': ('bed_princess', 3, 3, 0),
    'l': ('balustrade', 2, 1, 0), 'i': ('balustrade', 1, 2, HP),
    'Q': ('column_grand', 1, 1, 0), 'g': ('statue_knight', 2, 2, 0), 'L': ('statue_lion', 1, 2, 0), 'f': ('brazier', 1, 1, 0), 'm': ('torchere', 1, 1, 0),
}
WALK = '.=NE0123456789!?*'   # !?* = vật xem được của nhiệm vụ: đứng trên ô đi được (luật của tests/quests.test.js), tự nó chặn lối
FRAME = {'portrait': (1.0, 1.4, .76, 1.16, 1.6), 'landscape': (1.9, 1.3, 1.62, 1.02, 1.4)}   # khung ngoài rộng × cao, lòng khung rộng × cao

ROOMS = {
    'palace_in': dict(
        name='Cung điện Valoria — Sảnh ngai', floor='marble', light=(0xffe0b0, 1.05, .85), prefix='palace', cam=[1.4, 4], npcs=['queen_elise', 'palace_guard_left', 'palace_guard_right'],
        spots={'!': ('ngai_kiem', 'i_stele')},
        plan='''
###########################
#.SSS....ZZZZZZZZZ....SSS.#
#.SSS.gg.ZZZZZZZZZ.gg.SSS.#
#.444.gg.ZZZZZZZZZ.gg.444.#
#........ZZZZZZZZZ........#
#........ZZZZZZZZZ........#
#.......f.L.!=..L.f.......#
#.........L..=N.L.........#
#......Q.....=.....Q......#
#m...........=...........m#
#2.....Q.....=.....Q.....3#
#2...........=...........3#
#m.....Q.....=.....Q.....m#
#............=............#
#......Q.....=.....Q......#
#............=............#
#......Q.....=.....Q......#
#..O.........=.........C..#
#............=............#
#.........N..=..N.........#
#............=............#
#............=............#
#############E#############''',
        exits={'E': dict(scene='capital', at=[42, 10], face='down'), '2': dict(scene='palace_dining', at=[15, 8], face='left'),
               '3': dict(scene='palace_council', at=[2, 8], face='right'), '4': dict(scene='palace_gallery', at=[10, 6], face='up')},
        # (13/11, lần 3) người chơi: "cần hoành tráng hơn, xung quanh cũng tráng lệ hơn" -> sảnh rộng 27×23, bệ 9×5, ngai lớn, tượng hiệp sĩ, sư tử vàng, lư lửa
        wall=[('N', 13.5, 'cloth_of_state_grand', .15), ('N', 10.5, 'banner_grand', .5), ('N', 16.5, 'banner_grand', .5),
              ('N', 7.5, 'window_grand', .35), ('N', 19.5, 'window_grand', .35), ('N', 1.5, 'banner_royal', 1.4), ('N', 25.5, 'banner_royal', 1.4),
              ('W', 2, 'sconce', 1.9), ('W', 5, 'window_grand', .35), ('W', 8, 'banner_grand', .5), ('W', 11, 'door_double', 0),
              ('W', 14, 'banner_grand', .5), ('W', 17, 'window_grand', .35), ('W', 20, 'sconce', 1.9),
              ('E', 2, 'sconce', 1.9), ('E', 5, 'window_grand', .35), ('E', 8, 'banner_grand', .5), ('E', 11, 'door_double', 0),
              ('E', 14, 'banner_grand', .5), ('E', 17, 'window_grand', .35), ('E', 20, 'sconce', 1.9)],
        ),
    'palace_dining': dict(
        name='Cung điện — Phòng ăn hoàng gia', floor='wood', light=(0xffd9a8, 1.0, .82), prefix='palace_dining', npcs=['palace_cook'], spawn=[15, 8], spots={'?': ('nhac1', 'pages')},
        plan='''
##################
#v....FFF.......v#
#.?..............#
#................#
#..c.c.c.c.c.c...#
#..TTTTTTTTTTTT..#
#..TTTTTTTTTTTT..#
#..u.u.u.u.u.u..1#
#K......N....O..1#
#..............C.#
##################''',
        exits={'1': dict(scene='palace_in', at=[2, 11], face='right')},
        wall=[('N', 1.5, 'window_drapes', .7), ('N', 13.5, 'window_drapes', .7), ('N', 16.5, 'sconce', 1.9),
              ('W', 2, 'sconce', 1.9), ('W', 5, 'window_drapes', .7), ('W', 8, 'sconce', 1.9),
              ('E', 2, 'banner_royal', 1.2), ('E', 5, 'banner_royal', 1.2), ('E', 8, 'door_double', 0)],
        paintings=[('N', 4.5, 'stilllife', 'landscape', 1.25), ('N', 10.5, 'hunt', 'landscape', 1.25)],
        hang=[(6, 6), (12, 6)]),
    'palace_council': dict(
        name='Cung điện — Phòng hội đồng', floor='stone', light=(0xffdcae, .98, .8), prefix='palace_council', npcs=['palace_scribe'], spawn=[2, 8], spots={'!': ('kiem_vo_danh', 'i_sign')},
        plan='''
##################
#A.BBB......BBB.A#
#................#
#.......c........#
#......RRR.......#
#.....hRRRj...G.!#
#......RRR.......#
#1......u....N...#
#1..kk........O..#
#..............C.#
##################''',
        exits={'1': dict(scene='palace_in', at=[24, 11], face='left')},
        wall=[('N', 10.5, 'banner_royal', 1.2), ('W', 2, 'weapon_rack', 1.6), ('W', 5, 'banner_royal', 1.2), ('W', 8, 'door_double', 0),
              ('E', 2, 'window_drapes', .7), ('E', 5, 'weapon_rack', 1.6), ('E', 8, 'window_drapes', .7)],
        paintings=[('N', 7.5, 'castle', 'landscape', 1.25)],
        rugs=[('rug_blue', 8.5, 5.5, 0)], hang=[(8.5, 5.5)]),
    'palace_gallery': dict(
        name='Cung điện — Hành lang tranh (tầng 2)', floor='marble', light=(0xffe6c0, 1.05, .88), prefix='palace_gallery', npcs=['palace_painter'], spawn=[10, 6], spots={'?': ('nhac2', 'pages')},
        plan='''
#####################
#K.U..U.....U..U.SSS#
#.........O......SSS#
#................555#
#.........N.........#
#.?...bb.....bb.....#
#...................#
#2.......444.......3#
#2.......DDD.......3#
#........DDD........#
#####################''',
        exits={'4': dict(scene='palace_in', at=[3, 4], face='down'), '2': dict(scene='palace_elise', at=[12, 8], face='left'),
               '3': dict(scene='palace_balcony', at=[2, 5], face='right'), '5': dict(scene='palace_king', at=[12, 6], face='up')},
        wall=[('N', 1.5, 'sconce', 1.9), ('W', 2, 'sconce', 1.9), ('W', 8, 'door_double', 0),
              ('E', 2, 'window_drapes', .7), ('E', 5, 'window_drapes', .7), ('E', 8, 'door_double', 0)],
        paintings=[('N', 4.5, 'castle', 'landscape', 1.25), ('N', 7.5, 'queen', 'portrait', 1.2), ('N', 10.5, 'king', 'portrait', 1.2),
                   ('N', 13.5, 'princess', 'portrait', 1.2), ('W', 5, 'hunt', 'landscape', 1.25)],
        carpets=[(1, 6, 20, 7)]),
    'palace_elise': dict(
        name='Cung điện — Phòng công chúa Elise', floor='wood', light=(0xffe4d0, 1.02, .88), prefix='palace_elise', npcs=['palace_maid'], spawn=[12, 8],
        plan='''
###############
#..eee...VVV.H#
#..eee........#
#..eee.t......#
#W............#
#W....a.......#
#.............#
#............1#
#.kkO..N.....1#
#.............#
###############''',
        exits={'1': dict(scene='palace_gallery', at=[2, 8], face='right')},
        wall=[('N', 1.5, 'window_drapes', .7), ('N', 7.5, 'window_drapes', .7), ('W', 2, 'sconce', 1.9), ('W', 8, 'sconce', 1.9), ('E', 8, 'door_double', 0)],
        paintings=[('E', 2, 'queen', 'portrait', 1.2), ('E', 5, 'castle', 'landscape', 1.25)],
        rugs=[('rug_blue', 9.5, 5.5, 0)]),
    'palace_king': dict(
        name='Cung điện — Tẩm cung nhà vua (tầng 3)', floor='wood', light=(0xffd2a0, .95, .78), prefix='palace_king', npcs=['king_aldric', 'palace_physician', 'palace_guard_king'], spawn=[12, 6], spots={'*': ('den_ho_menh', 'i_spark')},
        plan='''
##################
#..FFF...yyy..t.v#
#........yyy.*...#
#..q.q...yyy.....#
#...N..N.........#
#................#
#W...............#
#W.........444...#
#..kkO.....DDD.N.#
#..........DDD...#
##################''',
        exits={'4': dict(scene='palace_gallery', at=[18, 4], face='down')},
        wall=[('N', 1.5, 'window_drapes', .7), ('N', 13.5, 'window_drapes', .7), ('N', 16.5, 'banner_royal', 1.2),
              ('W', 2, 'banner_royal', 1.2), ('W', 5, 'sconce', 1.9), ('E', 2, 'window_drapes', .7), ('E', 8, 'sconce', 1.9)],
        paintings=[('N', 7.5, 'queen', 'portrait', 1.2), ('E', 5, 'hunt', 'landscape', 1.25)],
        rugs=[('rug_red', 6.5, 5.5, 0)]),
    'palace_balcony': dict(
        name='Cung điện — Ban công thượng uyển', floor='stone', light=(0xfff2d8, 1.6, 1.1), prefix='palace_balcony', npcs=['palace_guard_balcony'], spawn=[2, 5], spots={'?': ('nhac3', 'pages')},
        walls='W', sky=0x9ecbea, backdrop='balcony_view',
        plan='''
############
#llllllllll#
#p.......pi#
#.........i#
#1.....bb.i#
#1........i#
#......N?.i#
#.........i#
#p.......pi#
#.........i#
############''',
        exits={'1': dict(scene='palace_gallery', at=[18, 8], face='left')},
        wall=[('W', 2, 'sconce', 1.9), ('W', 5, 'door_double', 0), ('W', 8, 'sconce', 1.9)]),
}


def build(sid):
    R = ROOMS[sid]
    plan = R['plan'].strip().splitlines()
    w, h = len(plan[0]), len(plan)
    assert all(len(r) == w for r in plan), (sid, [len(r) for r in plan])
    walls = R.get('walls', 'NWE')
    assert w % 3 == 0, sid
    assert (h - 2) % 3 == 0, sid
    grid = [''.join('.' if c in WALK else '#' for c in r) for r in plan]
    items, npcs, objects, exits = [], [], [], {}

    def model(key, x, z, r=0, y=0, cover=None, free=False, s=1):
        o = dict(s=s, r=round(r, 5), y=y)
        if cover: o['cover'] = cover
        if free: o['free'] = True
        items.append(['model', K + key, round(x, 3), round(z, 3), o])

    def box(x0, z0, x1, z1, height, color, y=0, floor=False):
        items.append(['roomBox', dict(x0=x0, z0=z0, x1=x1, z1=z1, height=height, color=color, y=y, floor=floor)])

    items.append(['roomFloor', dict(x0=0, z0=0, x1=w, z1=h, kind=R['floor'])])
    # tường cung điện: mỗi mảng 3 ô (ốp đá hoa + gấm đỏ viền vàng, cao 4.2) + trụ ốp ở chỗ nối
    if 'N' in walls:
        for i in range(w // 3): model('wall_royal', 1.5 + 3 * i, .5, 0, cover=[3 * i, 0, 3 * i + 3, 1], free=True)
        for i in range(w // 3 + 1): model('wall_royal_pilaster', 3 * i, .5, 0, cover=[min(w - 1, 3 * i), 0, min(w - 1, 3 * i) + 1, 1], free=True)
    for side, wx, r in (('W', .5, HP), ('E', w - .5, -HP)):
        if side not in walls: continue
        cx = 0 if side == 'W' else w - 1
        for i in range((h - 2) // 3): model('wall_royal', wx, 2 + 3 * i, r, cover=[cx, 1 + 3 * i, cx + 1, 3 + 3 * i], free=True)
        for i in range(1, (h - 2) // 3 + 1): model('wall_royal_pilaster', wx, .5 + 3 * i, r, cover=[cx, min(h - 2, 3 * i), cx + 1, min(h - 2, 3 * i) + 1], free=True)

    seen = set(); names = iter(R['npcs'])
    for z, row in enumerate(plan):
        for x, c in enumerate(row):
            if (x, z) in seen: continue
            if c in LEG:
                key, cw, cd, r = LEG[c]
                for dz in range(cd):
                    for dx in range(cw):
                        assert plan[z + dz][x + dx] == c, (sid, c, x, z)
                        seen.add((x + dx, z + dz))
                model(key, x + cw / 2, z + cd / 2, r, cover=[x, z, x + cw, z + cd])
            elif c == 'Z':   # bệ ngai lớn 9×5 (mặt bệ cao .9) + ngai kiếm lớn + 2 rương báu
                for dz in range(5):
                    for dx in range(9): assert plan[z + dz][x + dx] == 'Z', (sid, x, z); seen.add((x + dx, z + dz))
                cov = [x, z, x + 9, z + 5]
                model('dais_grand', x + 4.5, z + 2.5, cover=cov)
                model('throne_grand', x + 4.5, z + 1.75, y=.9, cover=cov, s=1.25)
                for cx in (x + 1.6, x + 7.4): model('chest_treasure', cx, z + 1.5, y=.9, cover=cov)
            elif c == '=' and plan[z - 1][x] != '=':
                end = z
                while end < h and plan[end][x] in '=E': end += 1
                box(x - .12, z, x + 1.12, end, .06, 0x8d2637, floor=True)
                for gx in (x - .12, x + 1.02): box(gx, z, gx + .1, end, .07, 0xd9a93a, floor=True)
            elif c == 'N': npcs.append(dict(id=next(names), x=x, y=z, face='down'))
            elif c in 'CO': objects.append(dict(id=R['prefix'] + ('_chest' if c == 'C' else '_note'), x=x, y=z, sprite='chest' if c == 'C' else 'pages', solid=True))
            if c in R.get('spots', {}): sid_, spr = R['spots'][c]; objects.append(dict(id=sid_, x=x, y=z, sprite=spr, solid=True))   # vật xem được của nhiệm vụ / truyện (game/questData1.js QUEST_OBJECTS)
            if c in R['exits']: exits.setdefault(c, []).append([x, z])
    assert next(names, None) is None, sid

    def on_wall(side, pos):   # -> x, z, góc quay, ô tường
        if side == 'N': return pos, WF, 0, [int(pos), 0, int(pos) + 1, 1]
        if side == 'W': return WF, pos, HP, [0, int(pos), 1, int(pos) + 1]
        return w - WF, pos, -HP, [w - 1, int(pos), w, int(pos) + 1]

    for side, pos, key, y in R.get('wall', []):
        x, z, r, cov = on_wall(side, pos)
        model(key, x, z, r, y=y, cover=cov, free=True)
    for side, pos, name, kind, y in R.get('paintings', []):
        x, z, r, cov = on_wall(side, pos)
        ow, oh, iw, ih, fs = FRAME[kind]   # fs: phóng to khung + tranh (nhìn từ trên xuống tranh cỡ thật quá bé)
        y = 1.0 if kind == 'portrait' else 1.25
        oh, iw, ih = oh * fs, iw * fs, ih * fs
        model('frame_' + kind, x, z, r, y=y, cover=cov, free=True, s=fs)
        off = .035 * fs
        px, pz = (x, z + off) if side == 'N' else (x + off, z) if side == 'W' else (x - off, z)
        items.append(['painting', name, round(px, 3), round(pz, 3), dict(y=y + oh / 2, w=iw, h=ih, r=round(r, 5))])
    for key, x, z, r in R.get('rugs', []): model(key, x, z, r, y=.035, free=True)
    for x0, z0, x1, z1 in R.get('carpets', []):
        box(x0, z0 - .12, x1, z1 + .12, .06, 0x8d2637, floor=True)
        for gz in (z0 - .12, z1 + .02): box(x0, gz, x1, gz + .1, .07, 0xd9a93a, floor=True)
    for x, z in R.get('hang', []): model('chandelier', x, z, free=True)

    ex = []
    for c in sorted(R['exits'], key=lambda c: c != 'E'):   # cửa ra thành (nếu có) đứng đầu
        assert c in exits, (sid, c)
        ex.append(dict(tiles=exits[c], **R['exits'][c], door=True))
    m = dict(image=sid, tile=48, cols=w, rows=h, spawn=R.get('spawn', [w // 2, h - 2]), interior=True, interior3d=True,
             grid=grid, npcs=npcs, objects=objects, exits=ex,
             heights=['0' * w for _ in plan], gaps=[], stones=[], jumpSites=[])
    sun, sunI, hemi = R['light']
    sky = R.get('sky', 0x100e13)
    style = dict(sky=sky, fog=[sky, 45, 90], sun=sun, sunI=sunI, hemi=hemi, ground=dict(s=[.08, .12, .27]))
    if 'backdrop' in R: style['backdrop'] = R['backdrop']   # tranh cảnh tĩnh làm nền (src/assets/world3d/backdrops)
    if 'cam' in R: style['cam'] = R['cam']   # [lùi xa gấp mấy lần, nhìn lệch lên phía bắc mấy ô]
    layout = dict(style=style, items=items, detailItems=[])
    return m, ['s' * w for _ in plan], layout


COLORS = {'#': '#39333b', 'Q': '#d8d2c6', 'g': '#c9c3b8', 'L': '#d9a93a', 'f': '#e8862c', 'm': '#d9a93a', 'P': '#b9b2a6', 'Z': '#a69a83', '=': '#8d2637', 'E': '#c99b50', 'S': '#8a7d70', 'D': '#2c2730', 'T': '#e8dfc9', 'R': '#7b5a3c',
          'F': '#c96a2c', 'B': '#68492f', 'W': '#5b3d26', 'V': '#b9a27c', 'k': '#77513c', 'y': '#8d2637', 'e': '#3a5d9c', 'l': '#b9b2a6', 'i': '#b9b2a6',
          'b': '#7a4a55', 'U': '#d8d2c6', 'A': '#8f98a3', 'p': '#3f7a3a', 'v': '#5d7fb0', 'K': '#d9a93a', 'H': '#d9a93a', 'G': '#4d7a8a', 't': '#8a6a48',
          'c': '#7a3b3b', 'u': '#7a3b3b', 'h': '#7a3b3b', 'j': '#7a3b3b', 'a': '#3a5d9c', 'q': '#3a5d9c'}


def render(sid, m, root):
    from PIL import Image, ImageDraw
    S = m['tile']; plan = ROOMS[sid]['plan'].strip().splitlines()
    floor = {'marble': '#cbbd9d', 'wood': '#7a5d43', 'stone': '#85848f'}[ROOMS[sid]['floor']]
    im = Image.new('RGB', (m['cols'] * S, m['rows'] * S), '#17151b'); d = ImageDraw.Draw(im)
    for z, row in enumerate(plan):
        for x, c in enumerate(row):
            col = '#c99b50' if c.isdigit() else COLORS.get(c, floor)
            d.rectangle((x * S, z * S, (x + 1) * S - 1, (z + 1) * S - 1), fill=col, outline='#423d39')
    im.save(root / f'src/assets/maps/{sid}.webp', quality=90)
