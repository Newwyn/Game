"""Generate Valoria rooms from ASCII plans; preserve every other map entry verbatim."""
import json
import re
from pathlib import Path
from PIL import Image, ImageDraw
import palace_rooms

ROOT = Path(__file__).resolve().parents[1]
# # wall, P pillar, F standing torch, B pew, A altar/dais, T table, S shelf, K crates,
# C chest, O note, N NPC, = carpet, E exit. South walls are omitted in 3D.
PLANS = {
    'cathedral_in': '''
###############
#.............#
#....AAAAA....#
#....AAAAA....#
#.............#
#.T....N....T.#
#.............#
#...P.....P...#
#.............#
#.BBB..=..BBB.#
#......=......#
#...P..=..P...#
#.BBB..=..BBB.#
#......=......#
#...P..=..P...#
#.BBB..=..BBB.#
#......=......#
#.O....=....C.#
#......=......#
#......=......#
#......=......#
#######E#######
''',
    'archive_in': '''
###############
#.SSS.SSS.SSS.#
#.............#
#S...........S#
#S..TT...TT..S#
#.............#
#S..TT...TT..S#
#S...........S#
#.K..O.....C..#
#.............#
#.............#
#######E#######
''',
}
DOORS = {'cathedral_in': [8, 20], 'palace_in': [42, 10], 'archive_in': [8, 10]}
NAMES = {'cathedral_in': 'Nhà thờ lớn Valoria', 'palace_in': 'Cung điện Valoria — Sảnh ngai', 'archive_in': 'Thư khố Hoàng gia'}


def replace_entry(path, name, value, export):
    """Splice only one JSON value, never reformat unrelated generated data."""
    p = ROOT / path
    text = p.read_bytes().decode('utf8')
    start = text.index('export const ' + export + ' = ')
    match = re.search(r'"' + name + r'"\s*:\s*', text[start:])
    encoded = json.dumps(value, ensure_ascii=False)
    if match:
        pos = start + match.end()
        _, length = json.JSONDecoder().raw_decode(text[pos:])
        text = text[:pos] + encoded + text[pos + length:]
    else:
        pos = text.rindex('}')
        text = text[:pos].rstrip() + ', ' + json.dumps(name) + ': ' + encoded + text[pos:]
    p.write_bytes(text.encode('utf8'))


def room(sid):
    plan = PLANS[sid].strip().splitlines()
    w, h = len(plan[0]), len(plan)
    assert all(len(r) == w for r in plan), sid
    grid = [''.join('.' if c in '.=NE' else '#' for c in r) for r in plan]
    HP = 1.57079632679
    items, npcs, objects = [], [], []

    def model(key, x, z, s=.5, r=0, y=0, cover=None, sy=None):
        items.append(['model', key, x, z, dict(s=s, r=r, y=y, **({'sy': sy, 'sz': s} if sy else {}), **({'cover': cover} if cover else {}))])

    def box(x0, z0, x1, z1, height, color, y=0, floor=False):
        items.append(['roomBox', dict(x0=x0, z0=z0, x1=x1, z1=z1, height=height, color=color, y=y, floor=floor)])

    # Same KayKit wall / pillar / table kit as PAINTED.hall and library.
    # (13/11) phòng trông trống và thấp -> tường cao gấp rưỡi, sàn lát riêng từng phòng, cửa kính màu, cột cao
    floor = dict(cathedral_in='stone', palace_in='marble', archive_in='wood')[sid]
    items += [['roomFloor', dict(x0=0, z0=0, x1=w, z1=h, kind=floor)],
              ['dwall', [0, .5], [w, .5], dict(s=.75, door=False, deco=sid=='archive_in', shelves=sid=='archive_in')],
              ['dwall', [.5, .5], [.5, h-1.5], dict(s=.75, door=False, deco=False)],
              ['dwall', [w-.5, .5], [w-.5, h-1.5], dict(s=.75, door=False, deco=False)]]
    WZ = .5 + .375 + .04   # mặt trong của tường sau
    if sid == 'cathedral_in':
        for x, pool in [(3.5, 3.4), (7.5, 0), (11.5, 3.4)]: items.append(['glassWindow', x, WZ, dict(y=1.65, w=1.15 if pool == 0 else 1.0, h=2.3 if pool == 0 else 2.0, kind='holy', pool=pool)])
    if sid == 'palace_in':
        for x in [3.5, 17.5]: items.append(['glassWindow', x, WZ, dict(y=1.6, w=1.0, h=2.0, kind='gold', pool=3.0)])
    guards = iter(['palace_guard_left', 'palace_guard_right'])
    for z, row in enumerate(plan):
        for x, c in enumerate(row):
            if c == 'P': model('dungeon/pillar_decorated', x+.5, z+.5, .44, sy=.74)
            if c == 'F': model('dungeon/torch_lit', x+.5, z+.5, .6)
            if c == '=' and plan[z-1][x] != '=':
                end=z
                while end < h and plan[end][x] in '=E': end+=1
                box(x-.12,z,x+1.12,end,.06,0x8d2637,floor=True)
                for gx in [x-.12,x+1.02]: box(gx,z,gx+.1,end,.07,0xd9a93a,floor=True)
            if c == 'B' and row[x-1] != 'B':
                model('custom/town_bench', x+1.5,z+.5,1.4,cover=[x,z,x+3,z+1])
            if c == 'T' and row[x-1] != 'T':
                end=x+1
                while row[end]=='T': end+=1
                model('dungeon/table_long_decorated_A', (x+end)/2,z+.5,.23 if end-x==1 else .45,r=1.57079632679,cover=[x,z,end,z+1])
                model('dungeon/candle_triple',(x+end)/2,z+.5,.3,y=.6)
            if c == 'S' and (row[x-1]!='S'):
                end=x+1
                while row[end]=='S': end+=1
                model('dungeon/wall_shelves',(x+end)/2,z+.5,.24 if end-x==1 else .55,r=1.57079632679 if end-x==1 else 0,cover=[x,z,end,z+1])
            if c == 'K': model('dungeon/crates_stacked',x+.5,z+.5,.35)
            if c == 'N':
                npcs.append(dict(id='sister_anna' if sid=='cathedral_in' else next(guards),x=x,y=z,face='down'))
            if c in 'CO':
                objects.append(dict(id=sid.replace('_in','')+('_chest' if c=='C' else '_note'),x=x,y=z,sprite='chest' if c=='C' else 'pages',solid=True))
    if sid != 'archive_in':
        cx=w//2+.5
        box(cx-2.5,2,cx+2.5,4,.25,0x69605a)
        if sid=='cathedral_in':
            model('custom/town_statue',cx,2.6,.5,y=.25)
            model('dungeon/table_long_decorated_A',cx,3.4,.45,r=1.57079632679,y=.25,cover=[w//2-2,2,w//2+3,4])
            for dx in [-1.5,1.5]: model('dungeon/candle_triple',cx+dx,3.4,.4,y=1)
            for x in [2,12]: model('dungeon/candle_triple',x+.5,5.5,.4,y=.65)
        else:
            box(cx-1.3,2.05,cx+1.3,3.5,.14,0x8d2637,y=.25)   # tấm thảm đỏ trên bệ
            items.append(['throne', cx, 2.75, dict(y=.39, s=.95)])
            for dx in [-1.9,1.9]: model('dungeon/chest_gold',cx+dx,3.3,.42,y=.25,cover=[w//2-2,2,w//2+3,4])
            box(cx-2.5,4,cx+2.5,4.3,.12,0x7a7068,floor=True)   # bậc thấp trước bệ (đi qua được)
        for x in [w//2-3,w//2+3]: model('dungeon/banner_patternA_red',x+.5,.5,.72,y=.1)
        # cờ treo dọc hai tường bên
        for z in range(4,h-3,4):
            model('dungeon/banner_shield_blue' if sid=='palace_in' else 'dungeon/banner_patternA_red',.5,z+.5,.72,r=HP,y=.1,cover=[0,z,1,z+1])
            model('dungeon/banner_shield_blue' if sid=='palace_in' else 'dungeon/banner_patternA_red',w-.5,z+.5,.72,r=-HP,y=.1,cover=[w-1,z,w,z+1])
    # Wall-mounted candles provide warm persistent indoor glows.
    for z in range(2,h-2,4):
        model('dungeon/torch_mounted',.53,z+.5,.75,r=HP,y=1.6,cover=[0,z,1,z+1])
        model('dungeon/torch_mounted',w-.53,z+.5,.75,r=-HP,y=1.6,cover=[w-1,z,w,z+1])
    if sid == 'archive_in':   # thảm xanh dưới hai cụm bàn đọc
        for x0 in [3.4, 8.4]: box(x0,3.5,x0+3.2,7.5,.06,0x2f4a6b,floor=True)
    m = dict(image=sid,tile=48,cols=w,rows=h,spawn=[w//2,h-2],interior=True,interior3d=True,
             grid=grid,npcs=npcs,objects=objects,
             exits=[dict(tiles=[[w//2,h-1]],scene='capital',at=DOORS[sid],face='down',door=True)],
             heights=['0'*w for _ in plan],gaps=[],stones=[],jumpSites=[])
    sun, sunI, hemi = dict(cathedral_in=(0xffd0a0,.9,.72), palace_in=(0xffe0b0,1.05,.85), archive_in=(0xffc98a,.95,.78))[sid]
    layout = dict(style=dict(sky=0x100e13,fog=[0x100e13,35,70],sun=sun,sunI=sunI,hemi=hemi,ground=dict(s=[.08,.12,.27])),items=items,detailItems=[])
    return m, ['s'*w for _ in plan], layout


def render(sid, m):
    S=m['tile']; im=Image.new('RGB',(m['cols']*S,m['rows']*S),'#17151b'); d=ImageDraw.Draw(im)
    colors={'#':'#39333b','P':'#97918a','B':'#79513a','A':'#a69a83','T':'#77513c','S':'#68492f','K':'#967043','F':'#e0a040','=':'#8d2637','E':'#c99b50'}
    for z,row in enumerate(PLANS[sid].strip().splitlines()):
        for x,c in enumerate(row):
            color=colors.get(c,'#59534e')
            d.rectangle((x*S,z*S,(x+1)*S-1,(z+1)*S-1),fill=color,outline='#423d39')
            if c=='S':
                for i in range(5): d.rectangle((x*S+4+i*8,z*S+8,x*S+9+i*8,z*S+38),fill=['#af6852','#6c8590','#b29e64'][i%3])
            if c in 'TB': d.rectangle((x*S+4,z*S+9,x*S+S-5,z*S+S-10),outline='#bf9c6b',width=2)
            if c=='P': d.ellipse((x*S+8,z*S+8,x*S+40,z*S+40),fill='#b0a598',outline='#d1c6b0',width=2)
    im.save(ROOT/f'src/assets/maps/{sid}.webp',quality=90)


def generate():
    layouts={}
    for sid in PLANS:
        m,t,layouts[sid]=room(sid)
        replace_entry('src/world/maps.js',sid,m,'MAPS')
        replace_entry('src/world/terrain3d.js',sid,t,'TERRAIN')
        render(sid,m)
    for sid in palace_rooms.ROOMS:   # cung điện: Sảnh ngai + 6 phòng (tools/palace_rooms.py)
        m,t,layouts[sid]=palace_rooms.build(sid)
        replace_entry('src/world/maps.js',sid,m,'MAPS')
        replace_entry('src/world/terrain3d.js',sid,t,'TERRAIN')
        palace_rooms.render(sid,m,ROOT)
    (ROOT/'src/world3d/interiorLayouts.js').write_text('// Generated by tools/build_interiors.py.\nexport const INTERIOR_LAYOUTS = '+json.dumps(layouts,ensure_ascii=False,indent=2)+';\n',encoding='utf8')


if __name__=='__main__': generate()
