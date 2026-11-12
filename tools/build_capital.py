"""Deterministic Valoria city generator. Run from any working directory.
Plan: W masonry, H buildings, D reserved props, t trees, w canal,
B bridge deck, s cobbles, g lawn, N NPC, O object. Half-open building bounds.
All original IDs retained; former jump chests now accessible on foot.
"""
from pathlib import Path
import json, re, math
from collections import deque
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[1]
PLAN = """
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWttttttttttttttttttttttttttttssssssssssssssssssssssssttttttttttttttttWW
WWttttttttttttttttttttttttttttssssssssssssssssssssssssttttttttttttttttWW
WWttHHHHHHHHHHHHHHHHssttggggttWWHHHHHHHHHHHHHHHHHHHHssHHHHHHssHHHHHHttWW
WWttHHHHHHHHHHHHHHHHssttggggttWWHHHHHHHHHHHHHHHHHHHHssHHHHHHssHHHHHHttWW
WWttHHHHHHHHHHHHHHHHssttgOggttWWHHHHHHHHHHHHHHHHHHHHssHHHHHHssHHHHHHttWW
WWttHHHHHHHHHHHHHHHHssttggggttWWHHHHHHHHHHHHHHHHHHHHssHHHHHHssHHHHHHttWW
WWttHHHHHHHHHHHHHHHHssttggggttWWHHHHHHHHHHHHHHHHHHHHssHHHHHHssHHHHHHttWW
WWttHHHHHHHHHHHHHHHHssttggggttWWHHHHHHHHHHHHHHHHHHHHssDHHHHHssDHHHHHttWW
WWttDsssssssssssssssssggggggggWWDsssssDsssssssssssssWsssssssssssssssttWW
WWttssOsOsNsOssOssOsssggggggggWWssssssssssssssssOsOsWsssssssssssssssttWW
WWttssssssssssssssssssttggggttWWssssssssssNsOsOsHHHHWHHssHHHHHssHHHHttWW
WWttHHHHHHHHHHHHssWWWWWWggggttWWssssssssssssssssHHHHWHHssHHHHHssHHHHttWW
WWttHHHHHHHHHHHHssWttttWgOggttWWWWssssWWWWWWWWWWWWWWWHHssHHHHHssHHHHttWW
WWttHHHHHHHHHHHHssWttttWggggttssssssssssssssssssHHHHHHHssHHHHHssHHHHttWW
WWttHHHHHHHHHHHHssWttttWttttttssssssssssssssssssHHHHHHHssHHHHHssHHHHttWW
WWttHHHHHHHHHHHHssWDDDDWsssDDssDDssssssDDssDDsssHHHHHHHssHHHHHssHHHHttWW
WWttHHHHHHHHHHHHssWggOgWsssDDssDDssssssDDssDDsssssssssssssssDsssDsssssWW
WWttHHHHHHHHHHHHssWggggWssssssssssssssssssssssssssOsssssssssssssssssssWW
WWttssssssssssssssssssssssssssNssssssssssssOssDsssssssssssssssssssssssss
WWttssssOsNsssssOsssssssssssssssssssssssssssssOsssssssssssOsssssssssssss
WWttsssssssssssssssssssssssssOssssssssssssssssssssssssssssssssssssssssss
WWttHHHHHHssHHHHHHssHHHHsssDDDDssssssssDDDssDDssHHHHHHHssHHHHHssHHHHttWW
WWttHHHHHHssHHHHHHssHHHHsssssssssssssssDDDssssOsHHHHHHHssHHHHHssHHHHttWW
WWttHHHHHHssHHHHHHssHHHHsssOsssssssssssDDDssOsssHHHHHHHssHHHHHssHHHHttWW
WWttHHHHHHssHHHHHHssHHHHssDDDssDDDsssssDDssDDsssHHHHHHHssHHHHHssHHHHttWW
WWttHHHHHHssHHHHHHssHHHHsssDDssDDssssssDDssDDsssHHHHHHHssHHHHHssHHHHttWW
WWsssssssssssssssssssssssssssssssssssstsssssssssssssssssssssssssssssssWW
WWssssssssDBBBBBBsDssssssssssssssBBBBBBsssssssssssssssssssssssssssssssWW
WWwwwwwwwwwBBBBBBwwwwwwwwwwwwwwwwBBBBBBwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwWW
WWwwwwwwwwwBBBDBBwwwwwwwwwwwwwwwwBBBDBBwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwWW
WWsssssssssBBBBBBssssssssssssssssBBBBBBsssssssssssssssssssssssssssssssWW
WWssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssWW
WWssHHHHHHHssHHHHHHHssHHHHHHHDDDssssssDssDDHHHHHHHssHHHHHHHssHHHHHHHssWW
WWssHHHHHHHssHHHHHHHssHHHHHHHDDssssssssssDDHHHHHHHssHHHHHHHssHHHHHHHssWW
WWssHHHHHHHssHHHHHHHssHHHHHHHssssssssssssssHHHHHHHssHHHHHHHssHHHHHHHssWW
WWssHHHHHHHssHHHHHHHssHHHHHHHssODsssssssNssHHHHHHHssHHHHHHHssHHHHHHHssWW
WWssHHHHHHHssHHHHHHHssHHHHHHHsssDOssssssssDHHHHHHHssHHHHHHHssHHHHHHHssWW
WWssDsssOssssDDDssssssDsssssssssssssssssOsssDssssssssDsssssOssDsssssssWW
WWssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssWW
WWssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWssssWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWssssWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
""".strip().splitlines()
POSITIONS = {'corvin': [10, 11], 'elise': [42, 12], 'nun': [10, 21], 'villager_m2': [40, 37], 'merchant2': [30, 20], 'gate_board': [40, 39], 'market_chest': [44, 25], 'crypt': [21, 18], 'jump_capital_step1': [6, 11], 'jump_capital_step2': [50, 11], 'pages': [12, 11], 'sp_square': [29, 22], 'sp_archive': [15, 11], 'sp_relief': [31, 37], 'sp_tower': [48, 11], 'clue_poster': [33, 38], 'pg1': [18, 11], 'pg2': [46, 21], 'pg3': [58, 21], 'ch1': [8, 21], 'ch2': [16, 21], 'ch3': [50, 19], 'ch4': [8, 39], 'ch5': [59, 39], 'pk_hoa': [25, 14], 'p_thuky': [46, 12], 'so_no': [44, 12], 'g_tao4': [25, 6], 'n_tuong': [27, 25], 'n_cho': [43, 20], 'hc_cho': [46, 24], 'n_thu_vien': [8, 11], 'g_capital_tao_1': [23, 8], 'g_capital_tao_2': [23, 12]}
ORIGINAL = {'image': 'capital', 'tile': 32, 'cols': 43, 'rows': 24, 'spawn': [21, 17], 'grid': ['.#.#####.###...#...#.###############.######', '#.######...........#.###############.#.....', '.#..####...#...#...#.###############.#..#.#', '#####.#...######...#.###############.######', '....####..######..###.##...........#.######', '##..#####.#######.###.....#..........#####.', '.########.######..########################.', '..#.#.#...........#.#.....##...#.....#.....', '###.#...##......................##.########', '###.########..#..###..#.....#..######.####.', '#####.#######..######.#####...#######.####.', '#.#.#.#######..###.#....#.#...#######.#####', '....#.#######...#.#..#...#....#######.#####', '#...########.........#.....................', '....#########....##..##..#.....##..#.......', '.#..#.##..#.#...###.....###...###.#########', '##..##.#........#.###.#####...####.##.#....', '#.#..##..####.#.............#.######.###...', '.##...##.####.................#.###.###....', '.#.....###########################.###..#.#', '#...................###...........###....#.', '####.#..........#...###.....#.....##....###', '##.####.....######...#...#.###....#...###.#', '#.#..#.#...######..#......####........####.'], 'npcs': [{'id': 'corvin', 'x': 8, 'y': 16, 'face': 'down'}, {'id': 'elise', 'x': 28, 'y': 8, 'face': 'down'}, {'id': 'nun', 'x': 13, 'y': 8, 'face': 'down'}, {'id': 'villager_m2', 'x': 23, 'y': 18, 'face': 'left'}, {'id': 'merchant2', 'x': 19, 'y': 14, 'face': 'down'}], 'objects': [{'id': 'gate_board', 'x': 25, 'y': 18, 'sprite': 'board', 'big': True, 'solid': True}, {'id': 'market_chest', 'x': 29, 'y': 16, 'sprite': 'chest', 'solid': True}, {'id': 'crypt', 'x': 16, 'y': 8, 'sprite': 'mine', 'solid': True}, {'id': 'jump_capital_step1', 'x': 10, 'y': 2, 'sprite': 'chest', 'solid': True, 'optional': True}, {'id': 'jump_capital_step2', 'x': 14, 'y': 2, 'sprite': 'chest', 'solid': True, 'optional': True}], 'exits': [{'edge': 'right', 'a': 13, 'b': 13, 'scene': 'sylvaren', 'at': [1, 13], 'face': 'right'}, {'edge': 'right', 'a': 14, 'b': 14, 'scene': 'sylvaren', 'at': [1, 14], 'face': 'right'}, {'tiles': [[21, 18]], 'scene': 'road', 'at': [41, 11], 'face': 'left'}], 'heights': ['0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000012201220000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000'], 'gaps': [[15, 13], [16, 13], [21, 8]], 'stones': [], 'jumpSites': [{'kind': 'steps', 'tiles': [[8, 2], [9, 2], [10, 2]], 'chest': 'jump_capital_step1'}, {'kind': 'steps', 'tiles': [[12, 2], [13, 2], [14, 2]], 'chest': 'jump_capital_step2'}, {'kind': 'gap', 'tiles': [[21, 8]], 'start': [18, 8], 'landing': [22, 8]}, {'kind': 'run', 'tiles': [[15, 13], [16, 13]], 'start': [12, 13], 'landing': [17, 13]}]}
ORIGINAL_EXTRA = [{'id': 'pages', 'x': 14, 'y': 16, 'sprite': 'pages', 'solid': True}, {'id': 'sp_square', 'x': 13, 'y': 11, 'solid': True, 'char': 'npc_villager_m', 'solo': True, 'face': 'down'}, {'id': 'sp_archive', 'x': 17, 'y': 17, 'sprite': 'archive_door', 'solid': True, 'big': True}, {'id': 'sp_relief', 'x': 37, 'y': 13, 'solid': True, 'char': 'npc_guard', 'solo': True, 'face': 'down'}, {'id': 'sp_tower', 'x': 17, 'y': 4, 'sprite': 'stairs', 'big': True, 'solid': True}, {'id': 'clue_poster', 'x': 16, 'y': 7, 'sprite': 'poster', 'solid': True}, {'id': 'pg1', 'x': 23, 'y': 11, 'sprite': 'pages', 'solid': True}, {'id': 'pg2', 'x': 28, 'y': 11, 'sprite': 'pages', 'solid': True}, {'id': 'pg3', 'x': 34, 'y': 14, 'sprite': 'pages', 'solid': True}, {'id': 'ch1', 'x': 5, 'y': 7, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch2', 'x': 24, 'y': 7, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch3', 'x': 30, 'y': 9, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch4', 'x': 11, 'y': 15, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch5', 'x': 39, 'y': 13, 'sprite': 'i_blanket', 'solid': True}, {'id': 'pk_hoa', 'x': 19, 'y': 7, 'sprite': 'i_bellflower', 'solid': True}, {'id': 'p_thuky', 'x': 27, 'y': 14, 'solid': True, 'char': 'npc_merchant', 'solo': True, 'face': 'down'}, {'id': 'so_no', 'x': 28, 'y': 16, 'sprite': 'ledger', 'solid': True}, {'id': 'g_tao4', 'x': 26, 'y': 9, 'sprite': 'i_appletree', 'solid': True, 'big': True}, {'id': 'n_tuong', 'x': 23, 'y': 12, 'sprite': 'i_stele', 'solid': True}, {'id': 'n_cho', 'x': 29, 'y': 12, 'sprite': 'i_sign', 'solid': True}, {'id': 'hc_cho', 'x': 33, 'y': 15, 'sprite': 'chest', 'solid': True}, {'id': 'n_thu_vien', 'x': 9, 'y': 15, 'sprite': 'i_stele', 'solid': True}, {'id': 'g_capital_tao_1', 'x': 26, 'y': 10, 'sprite': 'i_appletree', 'solid': True, 'big': True}, {'id': 'g_capital_tao_2', 'x': 26, 'y': 7, 'sprite': 'i_appletree', 'solid': True, 'big': True}]


# Pass two: explicit residential rows, reserved street furniture, unchanged IDs.
BASE_PLAN = PLAN
plan = [list(row) for row in PLAN]
for y in range(2,42):
    for x in range(2,70):
        if plan[y][x] in 'HD' and (x,y) not in ((14,31),(36,31)): plan[y][x] = 's'
BUILDINGS = []
PROPS = []
protected = {tuple(p) for p in POSITIONS.values()} | {(35,42),(35,43),(70,20),(70,21)}
# Keep the three principal pedestrian axes and the canal crossings.
protected |= {(x,y) for y in (20,21,22,28,33,41) for x in range(2,70)}
protected |= {(x,y) for x in (34,35,36,37) for y in range(10,44)}
# Preserve lane continuities and courtyard reservations before filling blocks.
protected |= {(x,y) for y in (5,9,15) for x in range(53,70)}
protected |= {(x,37) for x in range(2,70)}
protected |= {(53,y) for y in range(2,20)} | {(69,y) for y in range(2,29)}
protected |= {(26,y) for y in range(4,17)} | {(28,y) for y in range(14,21)} | {(27,16)}
protected |= {(30,35),(55,39),(29,18),(29,19)} | {(39,y) for y in range(34,41)}
for x,y in protected:
    if plan[y][x] not in 'WwBNO' and (x,y) not in ((14,31),(36,31)): plan[y][x]='s'
for key in ('g_capital_tao_1','g_capital_tao_2'):
    x,y=POSITIONS[key];plan[y][x]='t'
doors = set()
def building(kind,x,y,w,d):
    b=dict(x0=x,z0=y,x1=x+w,z1=y+d,door=x+w/2,
           wall='stone' if len(BUILDINGS)%3==0 else 'plaster',roof='red',h=2.1+(len(BUILDINGS)%4)*.18)
    BUILDINGS.append([kind,b])
    for yy in range(y,y+d):
        for xx in range(x,x+w): plan[yy][xx]='H'
    doors.add((int(b['door']),y+d))
    plan[y+d][int(b['door'])]='s'
# Smaller landmark courts leave space for attached townhouses.
building('hall',4,4,8,6)
building('hall',32,4,20,6)
building('hall',4,13,8,7)
# A continuous public lane south of every three-tile-deep terrace.
rows = [(2,54,69),(6,54,69),(12,54,69),(16,48,69),(24,48,69),
        (23,4,24),(34,3,33),(34,40,69),(38,3,33),(38,43,69),
        (2,13,21),(6,13,21),(13,13,18),(17,13,18),
        (12,48,51),(15,24,29)]
for y,left,right in rows:
    depth = 4 if y in (23,24) else 3
    for x in range(left,right-2,3):
        cells={(xx,yy) for yy in range(y,y+depth) for xx in range(x,x+3)}
        if cells & (protected|doors) or any(plan[yy][xx] in 'HWwB' for xx,yy in cells): continue
        if plan[y+depth][x+1] in 'HWwB': continue
        building('house',x,y,3,depth)
    for x in range(left,right):
        if plan[y+depth][x] not in 'HWwB' and (x,y+depth) not in protected: plan[y+depth][x]='s'
# Royal park and the existing apple orchard stay green.
for y in range(2,4):
    for x in range(30,53): plan[y][x]='g'
# Street props occupy explicit D niches; footprints are kept off roads.
def prop(name,x,z,s=.48,r=0,**opts):
    y=z
    assert (int(x),int(y)) not in protected|doors,(name,x,y)
    assert plan[int(y)][int(x)] not in 'HWwB',(name,x,y)
    plan[int(y)][int(x)]='D'
    PROPS.append(['model',name if '/' in name else 'custom/town_'+name,x,y,dict(s=s,r=r,**opts)])
# Ten stalls, two rows, six clear tiles between their inner edges.
for y in (17,26):
    for i,x in enumerate((26,30,38,42,46)):
        for yy in (y,y+1):
            for xx in (x,x+1): plan[yy][xx]='D'
        prop('stall_'+('fruit','bread','cloth','fish')[i%4],x+1,y+1,.62)
for yy in range(23,26):
    for xx in range(38,41): plan[yy][xx]='D'
prop('fountain',39.5,24.5,.8)
# Quays: one tile deep, interrupted only at the six-tile bridge decks.
for y in (29,32):
    for x in range(2,70):
        if 11<=x<17 or 33<=x<39: continue
        prop('wall_low',x+.5,y+.5,1/3)
for x in (9,19,31,41,66):
    prop('steps',x+.5,29.5,.42)
# Residential courtyards and distinct quarter furniture.
for x,y in ((30,35),(55,39)):
    
    if plan[y][x] in 'sgt':
        protected.discard((x,y)); prop('custom/well',x+.5,y+.5,.45)
for x,y in ((27,23),(45,23),(38,39)):
    prop('statue' if x==27 else 'noticeboard',x+.5,y+.5,.42)
# Lamps mark both avenues at six tile intervals, with trees between them.
for y in (19,23):
    for x in range(5,70,6):
        if plan[y][x] in 'sgt' and (x,y) not in protected|doors: prop('lamp_post',x+.5,y+.5,.5)
        tx=x+3
        if tx<70 and plan[y][tx] in 'sgt' and (tx,y) not in protected|doors: plan[y][tx]='t'
for x in (33,38):
    for y in range(11,42,6):
        if plan[y][x] in 'sgt' and (x,y) not in protected|doors: prop('lamp_post',x+.5,y+.5,.5)
# Fill niches beside terraces and plaza edges, never a door or interaction.
for y in (3,10,11,14,15,18,19,23,27,34,37,39,40):
    for x in range(3,70,2):
        if (x,y) in protected|doors or plan[y][x] not in 'sgt': continue
        if y in (10,11,14,15,18) and x>=48: continue
        if 24<=x<=47 and 16<=y<=27: continue
        if 22<=x<30 and y<16: continue
        if y<11 and 30<=x<=52: kinds=['planter_a','statue','lamp_post','planter_b']
        elif x<24 and 13<=y<=23: kinds=['flowerpots','bench','planter_b','graveyard/gravestone-cross']
        elif y>=34: kinds=['woodpile','laundry','haybale','barrels','flowerpots','sacks']
        else: kinds=['barrels','crates','sacks','planter_a','bench','lamp_post']
        name=kinds[(x//2+y)%len(kinds)]
        prop(name,x+.5,y+.5,.22 if name=='laundry' else .38)
for x,y in ((32,40),(42,36),(68,19),(24,24)):
    if plan[y][x] in 'sgt': prop('cart_goods' if x%2==0 else 'cart_hay',x+.5,y+.5,.35)
for x,y in ((30,17),(42,17),(33,11),(38,35)):
    if plan[y][x]!='H':
        # Elevated strings may span the road; their anchors stay blocked.
        prop('bunting',x+.5,y+.5,.65,y=1.1)
PLAN = [''.join(row) for row in plan]

def read(path):
    return (ROOT/path).read_bytes().decode('utf-8')

def write(path, text):
    (ROOT/path).write_bytes(text.encode('utf-8'))

def module_json(path, name):
    return json.JSONDecoder().raw_decode(read(path).split('export const '+name+' = ')[1])[0]

def replace_entry(path, key, value):
    """Splice a JSON value: preserve every byte outside the selected entry."""
    text = read(path)
    match = re.search(r'"'+re.escape(key)+r'"\s*:\s*', text)
    start = match.end()
    _, length = json.JSONDecoder().raw_decode(text[start:])
    write(path, text[:start]+json.dumps(value, ensure_ascii=False)+text[start+length:])

def city():
    assert len(PLAN)==44 and all(len(row)==72 for row in PLAN)
    grid=[''.join('.' if c in 'sgBNO' else '#' for c in row) for row in PLAN]
    terrain=[''.join({'W':'s','H':'s','D':'s','B':'s','N':'s','O':'s'}.get(c,c) for c in row) for row in PLAN]
    m=json.loads(json.dumps(ORIGINAL))
    m.update(cols=72,rows=44,tile=16,spawn=[35,42],grid=grid,
             heights=['0'*72 for _ in PLAN],gaps=[],stones=[],jumpSites=[])
    extra=json.loads(json.dumps(ORIGINAL_EXTRA))
    for obj in m['npcs']+m['objects']+extra:
        obj['x'],obj['y']=POSITIONS[obj['id']]
        assert grid[obj['y']][obj['x']]=='.' or obj.get('solid'),obj['id']
    m['exits']=[dict(edge='right',a=20,b=20,scene='sylvaren',at=[1,13],face='right'),
                dict(edge='right',a=21,b=21,scene='sylvaren',at=[1,14],face='right'),
                dict(tiles=[[35,43]],scene='road',at=[41,11],face='left')]
    seen={tuple(m['spawn'])};queue=deque(seen)
    while queue:
        x,y=queue.popleft()
        for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
            if 0<=nx<72 and 0<=ny<44 and grid[ny][nx]=='.' and (nx,ny) not in seen:
                seen.add((nx,ny));queue.append((nx,ny))
    assert len(seen)==sum(row.count('.') for row in grid), 'Disconnected streets'
    return m,extra,terrain

STYLE = dict(trees=['nature/tree_oak','nature/tree_default'], sky=0xc8d4df,
             fog=[0xd5dce1,65,135],sun=0xffe0b2,
             ground=dict(s=[.09,.10,.62],p=[.10,.28,.57],g=[.28,.30,.43],t=[.28,.26,.37]))

def layout():
    items=[];detail=[]
    for kind, source in BUILDINGS:
        b=source.copy()
        if kind=='hall':
            b.update(wall=0xe3d6b6,roof=0x626a76,h=4 if b['x0']==32 else 3.5,roofH=1.6)
        items.append([kind,b])
    # Adjacent one-tile wall courses make a continuous, visibly two-tile ring.
    # Run endpoints remain within blocked cells, including the gate openings.
    for y,row in enumerate(PLAN):
        x=0
        while x<72:
            if row[x]!='W':x+=1;continue
            end=x+1
            while end<72 and row[end]=='W':end+=1
            items.append(['castleWall',[x+.5,y+.5],[end-.5 if end>x+1 else x+.51,y+.5],2.6 if y<2 or y>=42 or x<2 or x>=70 else 1.35])
            x=end
    for x,y in [(1,1),(71,1),(1,43),(71,43),(32.5,43),(39.5,43),(71,18),(71,25)]:
        items.append(['vtower',x,y,dict(r=.9,h=4.2)])
    items += [['spire',8,15,dict(w=2,h=7)],['spire',10,15,dict(w=2,h=6)],
              ['spire',42,6,dict(w=2,h=6.5)],['vtower',33.5,5.5,dict(r=1.3,h=5)],
              ['vtower',50.5,5.5,dict(r=1.3,h=5)]]
    # Six-tile bridge decks widen around a visible planter traffic island.
    # The model anchor and planter share that blocked tile; all passage cells
    # remain clear, including at least two cells on either side of the island.
    for x in (14,36):
        items.append(['model','custom/town_bridge_stone',x,31,
                      dict(s=2/3,sz=2,sy=.25,r=math.pi/2,y=-.30,cover=[x-3,29,x+3,33])])
        detail.append(['model','custom/town_planter_a',x+.5,31.5,dict(s=.4,y=.1)])
    # Floating name plates so players can find the landmarks.
    items += [['label',42,7,'Cung điện Valoria',dict(y=6.4)],['label',8,16.5,'Nhà thờ lớn',dict(y=6.6)],
              ['label',8,7,'Thư khố Hoàng gia',dict(y=5.2)],['label',36,22,'Chợ trung tâm',dict(y=3.6)]]
    items += PROPS
    return items,detail

def render(m,extra):
    S=16;im=Image.new('RGB',(72*S,44*S));d=ImageDraw.Draw(im)
    colors={'s':'#b5b1a5','N':'#b5b1a5','O':'#b5b1a5','W':'#8c8a82','H':'#b96647','D':'#a6a18e','B':'#cac2ad','t':'#74835a','g':'#8c9b68','w':'#648e9d'}
    for y,row in enumerate(PLAN):
        for x,c in enumerate(row):
            X,Y=x*S,y*S;d.rectangle((X,Y,X+15,Y+15),fill=colors[c])
            if c in 'sNO':
                tone=(181+(x*3+y*7)%9,177+(x*3+y*7)%9,165+(x*3+y*7)%9)
                d.rectangle((X+1,Y+1,X+14,Y+7),fill=tone);d.line((X,Y+8,X+15,Y+8),fill='#9f9b90')
                d.line((X+8,Y+8,X+8,Y+15),fill='#a6a296')
            elif c=='w':d.arc((X,Y+3,X+20,Y+12),0,150,fill='#98b5ba',width=1)
            elif c=='t':
                d.ellipse((X+1,Y+2,X+15,Y+16),fill='#586b45');d.ellipse((X,Y,X+12,Y+12),fill='#7e915f')
            elif c=='W':
                d.rectangle((X+1,Y+1,X+14,Y+14),outline='#bcb7a7',width=2)
    # Market cobble medallion surrounds the new fountain basin.
    d.ellipse((37*S,22*S,42*S,27*S),outline='#d8cfb8',width=3)
    for i,(kind,b) in enumerate(BUILDINGS):
        x0,y0,x1,y1=[int(b[k]*S) for k in ('x0','z0','x1','z1')]
        color='#67717c' if kind=='hall' else ['#b56343','#a85c43','#c27a50'][i%3]
        d.rectangle((x0,y0,x1-1,y1-1),fill=color,outline='#534e46',width=2)
        for yy in range(y0+5,y1-2,6):d.line((x0+3,yy,x1-3,yy),fill='#8d6455' if kind=='house' else '#828892')
        mid=(y0+y1)//2;d.line((x0+4,mid,x1-5,mid),fill='#e0b28b' if kind=='house' else '#b5bac0',width=3)
        d.line((x0,y0,x0+12,mid,x0,y1-1),fill='#544e48',width=2)
        d.line((x1-1,y0,x1-13,mid,x1-1,y1-1),fill='#544e48',width=2)
        cx=int(b['door']*S);d.rectangle((cx-4,y1-5,cx+4,y1-1),fill='#4b4034')
    for _,name,x,y,opt in PROPS:
        X,Y=int(x*S),int(y*S)
        if 'stall' in name:
            d.rectangle((X-14,Y-12,X+14,Y+12),fill='#6f4430',outline='#4d4339')
            for k in range(7):d.rectangle((X-14+k*4,Y-12,X-11+k*4,Y+4),fill='#e4c98d' if k%2 else {'fruit':'#9d5142','bread':'#b38c46','cloth':'#786080','fish':'#507d95'}[name.rsplit('_',1)[1]])
        elif 'fountain' in name:
            d.ellipse((X-20,Y-20,X+20,Y+20),fill='#e1d8c0',outline='#77776f',width=3)
            d.ellipse((X-15,Y-15,X+15,Y+15),fill='#739daa');d.ellipse((X-5,Y-5,X+5,Y+5),fill='#e4ddc7')
        else:d.rounded_rectangle((X-5,Y-5,X+5,Y+5),radius=2,fill='#685e4c',outline='#ded0ac')
    for x in (14,36):
        d.rectangle(((x-3)*S,29*S,(x+3)*S-1,33*S-1),fill='#c7bea7',outline='#8d887c',width=2)
        for y in range(29*S,33*S,7):d.line(((x-3)*S+3,y,(x+3)*S-4,y),fill='#a59e8c')
        for xx in ((x-3)*S,(x+3)*S-4):d.rectangle((xx,29*S,xx+3,33*S-1),fill='#e4d6bb')
        d.rectangle((x*S+2,31*S+2,x*S+13,31*S+13),fill='#748458',outline='#d9cbaa')
    for x,y in [(8,15),(10,15),(42,6),(33.5,5.5),(50.5,5.5)]:
        X,Y=int(x*S),int(y*S);d.ellipse((X-10,Y-10,X+10,Y+10),fill='#485768',outline='#c9c4b7',width=2)
    for x,y in [(1,1),(71,1),(1,43),(71,43),(32.5,43),(39.5,43),(71,18),(71,25)]:
        X,Y=int(x*S),int(y*S);d.ellipse((X-14,Y-14,X+14,Y+14),fill='#727b84',outline='#dbd4c2',width=3)
    im.save(ROOT/'src/assets/maps/capital.webp',lossless=True,method=6)
    preview=Image.new('RGB',(1840,1180),'#eee7d6');preview.paste(im.resize((1440,880)),(20,55));d=ImageDraw.Draw(preview)
    try:
        font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16);title=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',23)
    except OSError:font=ImageFont.load_default();title=font
    d.text((20,15),'KINH THANH VALORIA | 72 x 44 | north up | numbered interaction points',font=title,fill='#333b43')
    for text,x,y in [('ARCHIVES',4,5),('ORCHARD',23,4),('PALACE',36,5),('CATHEDRAL',4,14),('GUILD QUARTER',49,13),('GRAND MARKET',29,18),('WEST HOMES',5,35),('GATE PLAZA',31,35),('EAST HOMES',48,35),('CANAL / QUAYS',47,30)]:
        X,Y=20+x*20,55+y*20;box=d.textbbox((X,Y),text,font=font);d.rectangle((box[0]-3,box[1]-3,box[2]+3,box[3]+3),fill='#f2e9d5');d.text((X,Y),text,font=font,fill='#343c43')
    for yy,row in enumerate(PLAN):
        for xx,c in enumerate(row):
            if c=='D': d.rectangle((20+xx*20,55+yy*20,39+xx*20,74+yy*20),outline='#c78628',width=2)
    targets=m['npcs']+m['objects']+extra+[dict(id='EXIT road',x=35,y=43),dict(id='EXIT sylvaren',x=71,y=20),dict(id='SPAWN',x=35,y=42)]
    for i,o in enumerate(targets,1):
        X,Y=20+o['x']*20+10,55+o['y']*20+10
        d.ellipse((X-9,Y-9,X+9,Y+9),fill='#163f58',outline='#fff3cf')
        label=str(i);bb=d.textbbox((0,0),label,font=font)
        d.text((X-(bb[2]-bb[0])/2,Y-10),label,font=font,fill='white')
        d.text((1480,55+(i-1)*27),f"{i:02}  {o['id']} ({o['x']},{o['y']})",font=font,fill='#273b47')
    d.text((20,970),'Cream plaster / terracotta roofs / slate landmarks / warm grey cobbles',font=title,fill='#4a4a40')
    d.text((20,1010),'Four-tile royal avenue. Three-tile east-west avenue. Two canal bridges. Gates at south and east.',font=font,fill='#4a4a40')
    d.text((20,1045),'D = reserved furniture niche (ochre); H = individual roof; t = tree. All streets form one connected network.',font=font,fill='#4a4a40')
    preview.save(ROOT/'.team/preview_capital.png')

def generate():
    m,extra,terrain=city();items,detail=layout()
    replace_entry('src/world/maps.js','capital',m)
    replace_entry('src/world/mapsExtra.js','capital',extra)
    replace_entry('src/world/terrain3d.js','capital',terrain)
    # Only landing coordinates in the two neighbouring maps are changed.
    maps=module_json('src/world/maps.js','MAPS')
    for sid in ('road','sylvaren'):
        before=json.dumps(maps[sid],ensure_ascii=False)
        for e in maps[sid]['exits']:
            if e['scene']=='capital':e['at']=[35,42] if sid=='road' else [70,20 if e.get('a')==13 else 21]
        after=json.dumps(maps[sid],ensure_ascii=False)
        text=read('src/world/maps.js');assert before in text
        write('src/world/maps.js',text.replace(before,after,1))
    declarations='\n'.join('export const '+name+' = '+json.dumps(value,ensure_ascii=False)+';' for name,value in [('CAPITAL_ITEMS',items),('CAPITAL_DETAIL',detail),('CAPITAL_STYLE',STYLE)])+'\n'
    write('src/world3d/capitalLayout.js','// Generated by tools/build_capital.py.\n'+declarations)
    # layouts.js is also consumed through a data: URL by the read-only audit.
    # Mirror these generated constants there to preserve that standalone API;
    # both copies are generated from one source and tested for exact equality.
    text=read('src/world3d/layouts.js')
    start=text.index('    capital: {');end=text.index('    sylvaren: {',start)
    text=text[:start]+'    capital: { style: CAPITAL_STYLE, items: CAPITAL_ITEMS, detailItems: CAPITAL_DETAIL },\n'+text[end:]
    text=re.sub(r'// CAPITAL_GENERATED_BEGIN[\s\S]*?// CAPITAL_GENERATED_END\r?\n','',text)
    text='// CAPITAL_GENERATED_BEGIN\n'+declarations.replace('export const ','const ')+'// CAPITAL_GENERATED_END\n'+text
    if '--sync-layouts' in __import__('sys').argv:
        write('src/world3d/layouts.js',text)
    text=read('src/world3d/life.js')
    text=re.sub(r'    capital: \[[\s\S]*?\n    \],',"    capital: [\n        ['pigeon', 30.5, 21.5], ['pigeon', 31.5, 22.5], ['pigeon', 41.5, 20.5], ['pigeon', 43.5, 21.5],\n        ['pigeon', 40.5, 12.5], ['pigeon', 46.5, 11.5], ['cat', 56.5, 21.5], ['dog', 36.5, 38.5],\n    ],",text)
    write('src/world3d/life.js',text)
    render(m,extra)
    print(f"Valoria: 72 x 44, {sum(r.count('.') for r in m['grid'])/3168:.1%} walkable; {len(items)} structures, {len(detail)} details")

if __name__=='__main__':generate()
