"""Generate Valoria rooms from ASCII plans; preserve every other map entry verbatim."""
import json
import re
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
# # wall, P pillar, B pew, A altar/dais, T table, S shelf, K crates,
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
    'palace_in': '''
#####################
#...................#
#.......AAAAA.......#
#.......AAAAA.......#
#...................#
#....P....=....P....#
#.........=.........#
#.TTT.....=.....TTT.#
#.........=.........#
#....P....=....P....#
#.........=.........#
#..O......=......C..#
#.........=.........#
#......N..=..N......#
#.........=.........#
##########E##########
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
    items, npcs, objects = [], [], []

    def model(key, x, z, s=.5, r=0, y=0, cover=None):
        items.append(['model', key, x, z, dict(s=s, r=r, y=y, **({'cover': cover} if cover else {}))])

    def box(x0, z0, x1, z1, height, color, y=0, floor=False):
        items.append(['roomBox', dict(x0=x0, z0=z0, x1=x1, z1=z1, height=height, color=color, y=y, floor=floor)])

    # Same KayKit wall / pillar / table kit as PAINTED.hall and library.
    items += [['dwall', [.5, .5], [w-.5, .5], dict(s=.5, door=False, deco=True, shelves=sid=='archive_in')],
              ['dwall', [.5, .5], [.5, h-1.5], dict(s=.5, door=False, deco=False)],
              ['dwall', [w-.5, .5], [w-.5, h-1.5], dict(s=.5, door=False, deco=False)]]
    guards = iter(['palace_guard_left', 'palace_guard_right'])
    for z, row in enumerate(plan):
        for x, c in enumerate(row):
            if c == 'P': model('dungeon/pillar_decorated', x+.5, z+.5, .42)
            if c == '=': box(x+.04,z,x+.96,z+1,.015,0x8d2637,floor=True)
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
            # Gilded throne: seat, tall red back and two armrests, all on the dais.
            box(cx-.65,2.4,cx+.65,3.6,.5,0xb49248,y=.25)
            box(cx-.65,2.3,cx+.65,2.55,1.8,0x8d2637,y=.25)
            for dx in [-.7,.5]: box(cx+dx,2.5,cx+dx+.2,3.6,.9,0xb49248,y=.25)
        for x in [w//2-3,w//2+3]: model('dungeon/banner_patternA_red',x+.5,.5,.5,y=.25)
    # Wall-mounted candles provide warm persistent indoor glows.
    for z in range(3,h-2,4):
        for x in [.5,w-.5]: model('dungeon/torch_mounted',x,z+.5,.5,y=1.1)
    m = dict(image=sid,tile=48,cols=w,rows=h,spawn=[w//2,h-2],interior=True,interior3d=True,
             grid=grid,npcs=npcs,objects=objects,
             exits=[dict(tiles=[[w//2,h-1]],scene='capital',at=DOORS[sid],face='down',door=True)],
             heights=['0'*w for _ in plan],gaps=[],stones=[],jumpSites=[])
    layout = dict(style=dict(sky=0x100e13,fog=[0x100e13,35,70],sun=0xffbc78,sunI=.85,hemi=.65,ground=dict(s=[.08,.12,.27])),items=items,detailItems=[])
    return m, ['s'*w for _ in plan], layout


def render(sid, m):
    S=m['tile']; im=Image.new('RGB',(m['cols']*S,m['rows']*S),'#17151b'); d=ImageDraw.Draw(im)
    colors={'#':'#39333b','P':'#97918a','B':'#79513a','A':'#a69a83','T':'#77513c','S':'#68492f','K':'#967043','=':'#8d2637','E':'#c99b50'}
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
    (ROOT/'src/world3d/interiorLayouts.js').write_text('// Generated by tools/build_interiors.py.\nexport const INTERIOR_LAYOUTS = '+json.dumps(layouts,ensure_ascii=False,indent=2)+';\n',encoding='utf8')


if __name__=='__main__': generate()
