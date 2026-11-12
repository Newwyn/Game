# Dựng bản đồ kiểu Pokémon: ảnh nền (Flow) + lưới đi được (tự đoán bằng tools/map_mask.py) + sửa tay + vị trí NPC / đồ vật / lối ra
# Dùng: python tools/build_maps.py   -> src/assets/maps/<khu>.webp + src/world/maps.js   (+ .team/art/maps/final_<khu>.png để soi)
# Sửa bản đồ: đổi OPS (ô 'walk' / 'block' theo hình chữ nhật x1,y1,x2,y2 tính bằng ô 32px) hoặc LAYOUT rồi chạy lại.
import json, os, shutil



# Demo Ashford: lưới theo hình 3D, cửa trước nhà và lối nối từng ô.
# AUDIT_CHANGES_BEGIN
# (12,1): # → .
# (11,2): # → .
# (12,2): # → .
# (10,3): # → .
# (11,3): # → .
# (12,3): # → .
# (29,3): # → .
# (11,4): # → .
# (12,4): # → .
# (18,4): # → .
# (29,4): # → .
# (30,4): # → .
# (31,4): # → .
# (12,5): # → .
# (29,5): # → .
# (30,5): # → .
# (7,6): # → .
# (12,6): # → .
# (13,6): # → .
# (16,6): # → .
# (17,6): # → .
# (29,6): # → .
# (34,6): # → .
# (7,7): # → .
# (27,7): # → .
# (34,7): # → .
# (35,7): # → .
# (6,8): # → .
# (7,8): # → .
# (29,8): # → .
# (35,8): # → .
# (36,8): # → .
# (5,9): # → .
# (6,9): # → .
# (7,9): # → .
# (26,9): . → #
# (32,9): . → #
# (37,9): # → .
# (5,10): # → .
# (6,10): # → .
# (35,10): . → #
# (7,11): # → .
# (33,11): # → .
# (36,11): # → .
# (9,13): # → .
# (10,13): # → .
# (26,13): . → #
# (8,14): # → .
# (9,14): # → .
# (11,14): # → .
# (29,14): # → .
# (30,14): # → .
# (31,14): # → .
# (32,14): # → .
# (33,14): # → .
# (35,15): # → .
# (38,15): # → .
# (39,15): # → .
# (12,16): . → #
# (25,16): # → .
# (35,16): # → .
# (35,17): # → .
# (38,17): # → .
# (39,17): # → .
# (40,17): # → .
# (31,18): . → #
# (35,18): # → .
# (38,18): # → .
# (30,19): . → #
# (35,19): # → .
# (38,19): # → .
# (38,20): # → .
# (21,21): . → #
# (30,21): # → .
# (34,21): # → .
# (21,22): . → #
# (25,22): # → .
# (31,22): # → .
# (33,22): # → .
# (21,23): . → #
# (31,23): # → .
# AUDIT_CHANGES_END
DEMO_FIX = json.loads(r'''{
  "ashford": {
    "grid": [
      "###########################################",
      "############.##############################",
      "###########..##############################",
      "##########...################.#############",
      "###########..#####.##########...###########",
      "############.#####.#.########..############",
      "#######.####..##........#####.####.########",
      "#######.#####............##...####..#######",
      "######..#####.................#####..######",
      "#####...#####.............#..######...#####",
      "#####.............###......##....#.########",
      "#######...........###......##..............",
      "########..........###......................",
      "#########.................#................",
      "########..#................##.....#.#......",
      "############...............########.#...###",
      "#############.............#########.#..####",
      "############.###........###########.#....##",
      "################........###########.##.####",
      "#################......######.#.....##.####",
      "##################..................##.####",
      "##################...#.............########",
      "##################...#.##.##.##.#.#########",
      "##################...#.########.###########"
    ],
    "npcs": [
      {
        "id": "mira",
        "x": 19,
        "y": 9,
        "face": "down"
      },
      {
        "id": "borin",
        "x": 31,
        "y": 11,
        "face": "down"
      },
      {
        "id": "lena",
        "x": 33,
        "y": 19,
        "face": "down"
      },
      {
        "id": "sera",
        "x": 8,
        "y": 12,
        "face": "left"
      },
      {
        "id": "rok",
        "x": 36,
        "y": 12,
        "face": "left"
      },
      {
        "id": "villager_m",
        "x": 14,
        "y": 15,
        "face": "down"
      },
      {
        "id": "villager_f",
        "x": 25,
        "y": 13,
        "face": "down"
      },
      {
        "id": "kid",
        "x": 23,
        "y": 17,
        "face": "down"
      }
    ],
    "exits": [
      {
        "tiles": [
          [
            31,
            19
          ]
        ],
        "scene": "tavern_in",
        "at": [
          7,
          8
        ],
        "face": "up",
        "door": true
      },
      {
        "tiles": [
          [
            32,
            10
          ]
        ],
        "scene": "forge_in",
        "at": [
          7,
          8
        ],
        "face": "up",
        "door": true
      },
      {
        "tiles": [
          [
            20,
            5
          ]
        ],
        "scene": "mira_in",
        "at": [
          7,
          8
        ],
        "face": "up",
        "door": true
      },
      {
        "edge": "right",
        "a": 12,
        "b": 12,
        "scene": "outskirts",
        "at": [
          1,
          10
        ],
        "face": "right"
      },
      {
        "edge": "right",
        "a": 13,
        "b": 13,
        "scene": "outskirts",
        "at": [
          1,
          11
        ],
        "face": "right"
      },
      {
        "edge": "down",
        "a": 20,
        "b": 20,
        "scene": "road",
        "at": [
          10,
          1
        ],
        "face": "down"
      }
    ]
  },
  "outskirts": {
    "exits": [
      {
        "edge": "right",
        "a": 0,
        "b": 23,
        "scene": "forest",
        "at": [
          1,
          11
        ],
        "face": "right"
      },
      {
        "edge": "left",
        "a": 10,
        "b": 10,
        "scene": "ashford",
        "at": [
          41,
          12
        ],
        "face": "left"
      },
      {
        "edge": "left",
        "a": 11,
        "b": 11,
        "scene": "ashford",
        "at": [
          41,
          13
        ],
        "face": "left"
      }
    ]
  },
  "road": {
    "exits": [
      {
        "edge": "right",
        "a": 0,
        "b": 23,
        "scene": "capital",
        "at": [
          35,
          42
        ],
        "face": "up"
      },
      {
        "edge": "up",
        "a": 10,
        "b": 10,
        "scene": "ashford",
        "at": [
          20,
          22
        ],
        "face": "up"
      }
    ]
  },
  "tavern_in": {
    "exits": [
      {
        "tiles": [
          [
            7,
            9
          ]
        ],
        "scene": "ashford",
        "at": [
          31,
          20
        ],
        "face": "down",
        "door": true
      }
    ]
  },
  "forge_in": {
    "exits": [
      {
        "tiles": [
          [
            7,
            9
          ]
        ],
        "scene": "ashford",
        "at": [
          32,
          11
        ],
        "face": "down",
        "door": true
      }
    ]
  }
}''')

def apply_demo(out):
    for scene, patch in DEMO_FIX.items():
        out[scene].update(patch)
    # Hành lang phía bắc Vương Đạo nối Ashford.
    for y in range(3):
        row = list(out['road']['grid'][y])
        row[10] = '.'
        out['road']['grid'][y] = ''.join(row)

EXTRA_ANCHORS = {'forest': [{'id': 'sp_bandage', 'x': 6, 'y': 11, 'sprite': 'bandage', 'solid': True}, {'id': 'clue_wheel', 'x': 9, 'y': 12, 'sprite': 'wheel_tracks', 'solid': True}, {'id': 'sp_wolf', 'x': 29, 'y': 8, 'solid': True, 'char': 'npc_wolfboss', 'foe': True, 'face': 'down', 'group': [[0, 0], [-1, -1, 'npc_wolf'], [1, -1, 'npc_wolf']]}, {'id': 'sp_swamp', 'x': 8, 'y': 18, 'solid': True, 'char': 'ow_sera', 'solo': True, 'face': 'down', 'foeChars': ['npc_goblin'], 'group': [[0, 0], [-1, 0, 'npc_goblin'], [1, 0, 'npc_goblin']]}, {'id': 'sp_grix', 'x': 26, 'y': 16, 'solid': True, 'char': 'npc_grix', 'solo': True, 'face': 'down'}], 'outskirts': [{'id': 'sp_smoke', 'x': 39, 'y': 11, 'sprite': 'smoke', 'big': True, 'solid': True}, {'id': 'clue_arrows', 'x': 38, 'y': 13, 'sprite': 'ash_arrows', 'solid': True}], 'ashford': [{'id': 'clue_ledger', 'x': 30, 'y': 13, 'sprite': 'ledger', 'solid': True}], 'road': [{'id': 'sp_bridge', 'x': 12, 'y': 11, 'solid': True, 'char': 'npc_thug', 'foe': True, 'face': 'left', 'group': [[0, 0], [-1, -1], [-2, 0]]}], 'capital': [{'id': 'pages', 'x': 12, 'y': 11, 'sprite': 'pages', 'solid': True}, {'id': 'sp_square', 'x': 29, 'y': 22, 'solid': True, 'char': 'npc_villager_m', 'solo': True, 'face': 'down'}, {'id': 'sp_archive', 'x': 15, 'y': 11, 'sprite': 'archive_door', 'solid': True, 'big': True}, {'id': 'sp_relief', 'x': 31, 'y': 37, 'solid': True, 'char': 'npc_guard', 'solo': True, 'face': 'down'}, {'id': 'sp_tower', 'x': 48, 'y': 11, 'sprite': 'stairs', 'big': True, 'solid': True}, {'id': 'clue_poster', 'x': 33, 'y': 38, 'sprite': 'poster', 'solid': True}, {'id': 'pg1', 'x': 18, 'y': 11, 'sprite': 'pages', 'solid': True}, {'id': 'pg2', 'x': 46, 'y': 21, 'sprite': 'pages', 'solid': True}, {'id': 'pg3', 'x': 58, 'y': 21, 'sprite': 'pages', 'solid': True}, {'id': 'ch1', 'x': 8, 'y': 21, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch2', 'x': 16, 'y': 21, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch3', 'x': 50, 'y': 19, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch4', 'x': 8, 'y': 39, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch5', 'x': 59, 'y': 39, 'sprite': 'i_blanket', 'solid': True}, {'id': 'pk_hoa', 'x': 25, 'y': 14, 'sprite': 'i_bellflower', 'solid': True}, {'id': 'p_thuky', 'x': 46, 'y': 12, 'solid': True, 'char': 'npc_merchant', 'solo': True, 'face': 'down'}, {'id': 'so_no', 'x': 44, 'y': 12, 'sprite': 'ledger', 'solid': True}, {'id': 'g_tao4', 'x': 25, 'y': 6, 'sprite': 'i_appletree', 'solid': True, 'big': True}, {'id': 'n_tuong', 'x': 27, 'y': 25, 'sprite': 'i_stele', 'solid': True}, {'id': 'n_cho', 'x': 43, 'y': 20, 'sprite': 'i_sign', 'solid': True}, {'id': 'hc_cho', 'x': 46, 'y': 24, 'sprite': 'chest', 'solid': True}, {'id': 'n_thu_vien', 'x': 8, 'y': 11, 'sprite': 'i_stele', 'solid': True}, {'id': 'g_capital_tao_1', 'x': 26, 'y': 8, 'sprite': 'i_appletree', 'solid': True, 'big': True}, {'id': 'g_capital_tao_2', 'x': 25, 'y': 12, 'sprite': 'i_appletree', 'solid': True, 'big': True}]}

WORLD_ANCHORS = {'outskirts': {'npcs': [{'id': 'farmer', 'x': 18, 'y': 14, 'face': 'down'}, {'id': 'jessica', 'x': 26, 'y': 14, 'face': 'left'}], 'objects': [{'id': 'ambush', 'x': 27, 'y': 15, 'char': 'npc_goblin', 'trigger': [[22, 13], [22, 14], [22, 15], [22, 16], [23, 13], [23, 14], [23, 15], [23, 16], [24, 13], [24, 14], [24, 15], [24, 16], [25, 13], [25, 14], [25, 15], [25, 16]], 'solid': False}, {'id': 'wheat', 'x': 10, 'y': 6, 'sprite': 'wheat', 'solid': True}, {'id': 'hammer', 'x': 12, 'y': 20, 'sprite': 'hammer', 'solid': True}, {'id': 'mine', 'x': 32, 'y': 7, 'sprite': 'mine', 'big': True, 'solid': True}, {'id': 'field_chest', 'x': 35, 'y': 14, 'sprite': 'chest', 'solid': True}]}, 'forest': {'npcs': [], 'objects': [{'id': 'mushroom', 'x': 7, 'y': 6, 'sprite': 'mushroom', 'solid': True}, {'id': 'herb', 'x': 28, 'y': 18, 'sprite': 'herb', 'solid': True}, {'id': 'forest_chest', 'x': 33, 'y': 7, 'sprite': 'chest', 'solid': True}]}, 'ashford': {'npcs': [{'id': 'mira', 'x': 19, 'y': 9, 'face': 'down'}, {'id': 'borin', 'x': 31, 'y': 11, 'face': 'down'}, {'id': 'lena', 'x': 33, 'y': 19, 'face': 'down'}, {'id': 'sera', 'x': 8, 'y': 12, 'face': 'left'}, {'id': 'rok', 'x': 36, 'y': 12, 'face': 'left'}, {'id': 'villager_m', 'x': 14, 'y': 15, 'face': 'down'}, {'id': 'villager_f', 'x': 25, 'y': 13, 'face': 'down'}, {'id': 'kid', 'x': 23, 'y': 17, 'face': 'down'}], 'objects': [{'id': 'board', 'x': 19, 'y': 12, 'area': [[18, 11], [18, 12], [19, 11], [19, 12], [20, 11], [20, 12]]}, {'id': 'well', 'x': 5, 'y': 12, 'area': [[4, 10], [4, 11], [4, 12], [4, 13], [5, 10], [5, 11], [5, 12], [5, 13], [6, 10], [6, 11], [6, 12], [6, 13]]}, {'id': 'sq_chest', 'x': 13, 'y': 9, 'sprite': 'chest', 'solid': True}, {'id': 'well_chest', 'x': 7, 'y': 10, 'sprite': 'chest', 'solid': True}]}, 'road': {'npcs': [{'id': 'guard', 'x': 27, 'y': 12, 'face': 'left'}, {'id': 'merchant', 'x': 33, 'y': 7, 'face': 'down'}], 'objects': [{'id': 'bridge_chest', 'x': 8, 'y': 4, 'sprite': 'chest', 'solid': True}]}, 'capital': {'npcs': [{'id': 'corvin', 'x': 10, 'y': 11, 'face': 'down'}, {'id': 'elise', 'x': 42, 'y': 12, 'face': 'down'}, {'id': 'nun', 'x': 10, 'y': 21, 'face': 'down'}, {'id': 'villager_m2', 'x': 40, 'y': 37, 'face': 'left'}, {'id': 'merchant2', 'x': 30, 'y': 20, 'face': 'down'}], 'objects': [{'id': 'gate_board', 'x': 40, 'y': 39, 'sprite': 'board', 'big': True, 'solid': True}, {'id': 'market_chest', 'x': 44, 'y': 25, 'sprite': 'chest', 'solid': True}, {'id': 'crypt', 'x': 21, 'y': 18, 'sprite': 'mine', 'solid': True}, {'id': 'jump_capital_step1', 'x': 6, 'y': 11, 'sprite': 'chest', 'solid': True, 'optional': True}, {'id': 'jump_capital_step2', 'x': 50, 'y': 11, 'sprite': 'chest', 'solid': True, 'optional': True}]}, 'sylvaren': {'npcs': [{'id': 'aeris', 'x': 31, 'y': 9, 'face': 'down'}, {'id': 'elfmerchant', 'x': 24, 'y': 7, 'face': 'down'}, {'id': 'elfkid', 'x': 11, 'y': 9, 'face': 'down'}], 'objects': [{'id': 'moonwell', 'x': 12, 'y': 7, 'area': [[8, 5], [8, 6], [9, 5], [9, 6], [10, 5], [10, 6], [11, 5], [11, 6], [12, 5], [12, 6], [13, 5], [13, 6], [14, 5], [14, 6], [15, 5], [15, 6], [16, 5], [16, 6]]}, {'id': 'syl_chest', 'x': 5, 'y': 19, 'sprite': 'chest', 'solid': True}, {'id': 'ruin_stone', 'x': 20, 'y': 13, 'sprite': 'pages', 'solid': True}, {'id': 'shroom_glow', 'x': 34, 'y': 18, 'sprite': 'mushroom', 'solid': True}]}, 'lunaria': {'npcs': [{'id': 'oren', 'x': 21, 'y': 6, 'face': 'down'}, {'id': 'lun_guard', 'x': 32, 'y': 8, 'face': 'down'}, {'id': 'elfkid2', 'x': 9, 'y': 15, 'face': 'down'}], 'objects': [{'id': 'moon_fountain', 'x': 21, 'y': 14, 'area': [[19, 14], [20, 14], [21, 14], [22, 14], [23, 14], [24, 14]]}, {'id': 'lun_chest', 'x': 40, 'y': 20, 'sprite': 'chest', 'solid': True}, {'id': 'star_tome', 'x': 33, 'y': 9, 'sprite': 'pages', 'solid': True}, {'id': 'lun_board', 'x': 16, 'y': 12, 'sprite': 'board', 'big': True, 'solid': True}]}, 'tavern_in': {'npcs': [{'id': 'bard', 'x': 11, 'y': 6, 'face': 'left'}, {'id': 'hank', 'x': 4, 'y': 5, 'face': 'left'}], 'objects': [{'id': 'tavern_counter', 'x': 11, 'y': 3, 'area': [[8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3]], 'solid': True}, {'id': 'tavern_chest', 'x': 13, 'y': 8, 'sprite': 'chest', 'solid': True}]}, 'forge_in': {'npcs': [{'id': 'mae', 'x': 4, 'y': 5, 'face': 'right'}], 'objects': [{'id': 'forge_anvil', 'x': 7, 'y': 4, 'area': [[6, 3], [6, 4], [7, 3], [7, 4], [8, 3], [8, 4]], 'solid': True}, {'id': 'forge_chest', 'x': 12, 'y': 8, 'sprite': 'chest', 'solid': True}]}, 'mira_in': {'npcs': [{'id': 'ella', 'x': 6, 'y': 5, 'face': 'down'}], 'objects': [{'id': 'mira_shelf', 'x': 7, 'y': 2, 'area': [[4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2]], 'solid': True}, {'id': 'mira_chest', 'x': 10, 'y': 7, 'sprite': 'chest', 'solid': True}]}}

def apply_world(out):
    # Valoria owns its hand-designed grid, anchors and jump-free streets.
    from build_capital import city
    out['capital'], capital_extra, _ = city()
    import copy
    for sid, anchors in WORLD_ANCHORS.items():
        if sid != 'capital': out[sid].update(copy.deepcopy(anchors))
    # Đọc hình 3D chỉ để tính lưới; không sửa lớp vẽ.
    import subprocess
    js = "import {TERRAIN,footprint,bridgeCells} from './tools/world_audit.mjs'; console.log(JSON.stringify(Object.fromEntries(Object.keys(TERRAIN).map(id=>[id,{terrain:TERRAIN[id],foot:[...footprint(id)],bridge:[...bridgeCells(id)]}]))));"
    art = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], text=True, encoding='utf-8'))
    for sid, m in out.items():
        if m.get('interior') or sid in ('ashford','capital'): continue
        a = art[sid]; foot = set(a['foot']); bridges = set(a['bridge'])
        m['grid'] = [''.join('#' if f'{x},{y}' in foot or (t in 'tbw' and f'{x},{y}' not in bridges) else '.' if t in 'gpsfd' or f'{x},{y}' in bridges else '#' for x,t in enumerate(row)) for y,row in enumerate(a['terrain'])]
    for y in [11,12]:
        row=list(out['outskirts']['grid'][y]); row[6]='.'; out['outskirts']['grid'][y]=''.join(row)
    # Mỗi làn có điểm quay về riêng.
    def link(a,b,edge,lanes,other=None):
        other = lanes if other is None else other
        opposite = dict(left='right',right='left',up='down',down='up')
        def cell(m,e,k,inset=0):
            return [inset,k] if e=='left' else [m['cols']-1-inset,k] if e=='right' else [k,inset] if e=='up' else [k,m['rows']-1-inset]
        for src,dst,e,ls,rs in [(a,b,edge,lanes,other),(b,a,opposite[edge],other,lanes)]:
            out[src]['exits']=[v for v in out[src]['exits'] if v['scene']!=dst]
            for k,r in zip(ls,rs): out[src]['exits'].append(dict(edge=e,a=k,b=k,scene=dst,at=cell(out[dst],opposite[e],r,1),face=e))
    link('outskirts','forest','right',[11,12])
    link('capital','sylvaren','right',[20,21],[13,14])
    link('sylvaren','lunaria','right',[13,14],[11,12])
    out['road']['exits']=[e for e in out['road']['exits'] if e['scene']!='capital']+[dict(tiles=[[42,11]],scene='capital',at=[35,42],face='up')]
    out['capital']['exits']=[e for e in out['capital']['exits'] if e['scene']!='road']+[dict(tiles=[[35,43]],scene='road',at=[41,11],face='left')]
    # Dời vật động sang ô trống gần nhất; giữ vùng tương tác công trình.
    xp='src/world/mapsExtra.js'
    text=open(xp,encoding='utf-8').read()
    extra=copy.deepcopy(EXTRA_ANCHORS)
    extra['capital']=capital_extra
    for sid,m in out.items():
        if m.get('interior'): continue
        seen=component_world(m)
        if sid in ('ashford','capital'): continue
        taken={tuple(m['spawn'])}
        for src in out.values():
            for e in src['exits']:
                if e['scene']==sid: taken.add(tuple(e['at']))
        for e in m['exits']:
            taken.update(tuple(p) for p in e.get('tiles',[]))
        objs={o['id']:o for o in m['objects'] if not o['id'].startswith('jump_')}
        objs.update({o['id']:o for o in extra.get(sid,[])})
        for o in [*m['npcs'],*objs.values()]:
            if 'area' in o: continue
            x,y=o['x'],o['y']
            choices=sorted(seen,key=lambda p:(abs(p[0]-x)+abs(p[1]-y),p[1],p[0]))
            pos=next(p for p in choices if p not in taken and sum((p[0]+dx,p[1]+dy) in seen for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)])>=3)
            o['x'],o['y']=pos; taken.add(pos)
            if 'trigger' in o: o['trigger']=[p for p in o['trigger'] if tuple(p) in seen]
        m['objects']=[o for k,o in objs.items() if k not in {o['id'] for o in extra.get(sid,[])}]
    add_jump_sites(out,extra)
    open(xp,'w',encoding='utf-8').write(text.split('export const EXTRA = ')[0]+'export const EXTRA = '+json.dumps(extra,ensure_ascii=False)+';\n')


def add_jump_sites(out,extra):
    dirs=[(1,0),(-1,0),(0,1),(0,-1)]
    for sid,m in out.items():
        if sid=='capital': continue
        h=[['0']*m['cols'] for _ in range(m['rows'])]; gaps=set(); sites=[]; stones=[]
        m['heights']=[''.join(r) for r in h]; m['gaps']=[]; m['stones']=[]; m['jumpSites']=[]
        if m.get('interior'): continue
        objects={o['id']:o for o in m['objects']}; objects.update({o['id']:o for o in extra.get(sid,[])})
        required=[*m['npcs'],*objects.values()]
        reserved={tuple(m['spawn'])}
        for src in out.values():
            for e in src['exits']:
                if e['scene']==sid: reserved.add(tuple(e['at']))
        for e in m['exits']:
            reserved.update(tuple(p) for p in e.get('tiles',[]))
            if 'edge' in e:
                for k in range(e['a'],e['b']+1):
                    reserved.add((0,k) if e['edge']=='left' else (m['cols']-1,k) if e['edge']=='right' else (k,0) if e['edge']=='up' else (k,m['rows']-1))
        for o in required:
            reserved.add((o['x'],o['y']))
            reserved.update(tuple(p) for p in o.get('trigger',o.get('area',[])))
            for dx,dy in dirs: reserved.add((o['x']+dx,o['y']+dy))
        seen=component_world(m)
        used=set(reserved)
        def good(cells):
            if any(p not in seen or p in used for p in cells): return False
            # Chỗ phụ không được cắt đường đi bộ hiện có.
            banned=gaps|set(cells)|{(x,y) for y,row in enumerate(h) for x,c in enumerate(row) if c!='0'}
            q=[tuple(m['spawn'])]; reached=set(q)
            for x,y in q:
                for dx,dy in dirs:
                    p=(x+dx,y+dy)
                    if p in seen and p not in banned and p not in reached: reached.add(p);q.append(p)
            return (seen-banned)<=reached
        # Hai bệ thưởng: bậc 1 -> bậc 2 để đứng -> rương ở bậc 2.
        for n in range(2):
            found=False
            for y in range(2,m['rows']-2):
                for x in range(2,m['cols']-4):
                    cells=[(x,y),(x+1,y),(x+2,y)]
                    if not good(cells) or not any(p in seen and p not in used for p in [(x-1,y),(x,y-1),(x,y+1)]): continue
                    h[y][x]='1';h[y][x+1]=h[y][x+2]='2'
                    chest=dict(id=f'jump_{sid}_step{n+1}',x=x+2,y=y,sprite='chest',solid=True,optional=True)
                    m['objects'].append(chest)
                    sites.append(dict(kind='steps',tiles=[list(p) for p in cells],chest=chest['id']))
                    used.update((xx+dx,yy+dy) for xx,yy in cells for dx,dy in [*dirs,(0,0)])
                    found=True;break
                if found: break
            assert found,(sid,'steps',n)
        for width in [1,2]:
            found=False
            for y in range(2,m['rows']-2):
                for x in range(3,m['cols']-width-2):
                    cells=[(x+i,y) for i in range(width)]
                    lane=[(x+i,y) for i in range(-3,width+2)]
                    if any(p not in seen or p in used for p in lane) or not good(cells): continue
                    gaps.update(cells);used.update(lane)
                    sites.append(dict(kind='gap' if width==1 else 'run',tiles=[list(p) for p in cells],start=[x-3,y],landing=[x+width,y]))
                    found=True;break
                if found:break
            assert found,(sid,'gap',width)
        if sid=='road':
            # Ao có sẵn bên bắc cầu: ba đá nổi và đảo hai ô, chỉ có thưởng phụ.
            stones=[(12,7),(14,7),(16,7)]
            island=[(18,7),(18,8)]
            pond={(x,y) for y in range(6,10) for x in range(11,20)}
            gaps.update(pond-set(stones)-set(island))
            grid=[list(r) for r in m['grid']]
            for x,y in stones+island: grid[y][x]='.'
            m['grid']=[''.join(r) for r in grid]
            chest=dict(id='jump_road_island',x=18,y=8,sprite='chest',solid=True,optional=True)
            m['objects'].append(chest)
            sites.append(dict(kind='pond',tiles=[list(p) for p in stones+island],chest=chest['id']))
        m['heights']=[''.join(r) for r in h];m['gaps']=[list(p) for p in sorted(gaps)];m['stones']=[list(p) for p in (stones+island if sid=='road' else stones)];m['jumpSites']=sites


def component_world(m):
    seen={tuple(m['spawn'])}; q=list(seen)
    for x,y in q:
        for p in [(x+1,y),(x-1,y),(x,y+1),(x,y-1)]:
            xx,yy=p
            if 0<=xx<m['cols'] and 0<=yy<m['rows'] and m['grid'][yy][xx]=='.' and p not in seen:
                seen.add(p); q.append(p)
    return seen


def write_maps(out):
    with open('src/world/maps.js', 'w', encoding='utf-8') as f:
        f.write('// Tự sinh bởi tools/build_maps.py — sửa nguồn rồi sinh lại\nexport const MAPS = ' + json.dumps(out, ensure_ascii=False) + ';\n')

# Thiếu tranh nguồn: chỉ cập nhật dữ liệu, không ghi lại ảnh.
if '--data-only' in __import__('sys').argv:
    text = open('src/world/maps.js', encoding='utf-8').read()
    out = json.loads(text.split('export const MAPS = ', 1)[1].rstrip().rstrip(';'))
    apply_demo(out)
    apply_world(out)
    write_maps(out)
    raise SystemExit(0)

from PIL import Image, ImageDraw

ART = '.team/art/maps'
SRC = {'outskirts': 'm0', 'forest': 'm1', 'ashford': 'm2', 'road': 'm3', 'capital': 'm4', 'sylvaren': 'm5', 'lunaria': 'm6'}

OPS = {
    'outskirts': [('walk', 3, 0, 5, 22), ('walk', 0, 10, 5, 11), ('walk', 6, 11, 6, 12), ('walk', 36, 11, 42, 13),
                  ('block', 27, 0, 34, 5)],
    'forest': [('walk', 0, 11, 10, 12), ('walk', 9, 10, 22, 10), ('walk', 21, 10, 23, 16), ('walk', 23, 15, 31, 16),
               ('walk', 29, 12, 32, 15), ('walk', 31, 11, 39, 12), ('walk', 24, 6, 35, 8), ('walk', 29, 9, 35, 10),
               ('walk', 25, 17, 31, 19), ('block', 40, 0, 42, 23), ('block', 11, 11, 17, 14)],
    'ashford': [('walk', 37, 11, 42, 13), ('walk', 19, 19, 21, 23)],
    'road': [('walk', 7, 3, 10, 9), ('walk', 2, 7, 10, 9), ('walk', 2, 14, 10, 15), ('walk', 0, 10, 11, 13), ('walk', 10, 11, 21, 12), ('walk', 36, 10, 42, 13), ('block', 11, 0, 20, 9), ('block', 11, 14, 20, 23)],
    # --- Chương 2: vùng Elf (tranh Codex, lưới vẽ tay theo tranh) ---
    'sylvaren': [('walk', 0, 12, 15, 14), ('walk', 3, 7, 14, 11), ('walk', 4, 15, 13, 20), ('walk', 10, 7, 13, 12), ('walk', 17, 6, 26, 8),
                 ('walk', 27, 9, 37, 17), ('walk', 38, 13, 42, 15), ('walk', 23, 17, 37, 20), ('walk', 19, 13, 21, 22), ('walk', 28, 6, 36, 7), ('walk', 29, 6, 31, 13),
                 ('block', 7, 1, 17, 6), ('block', 13, 9, 18, 17), ('block', 22, 9, 26, 16), ('block', 19, 9, 21, 12), ('block', 26, 11, 28, 13),
                 ('block', 28, 1, 33, 5), ('block', 34, 0, 37, 6), ('block', 26, 7, 28, 8), ('block', 32, 7, 37, 8), ('block', 0, 0, 6, 6), ('block', 18, 0, 24, 5)],
    'lunaria': [('block', 0, 0, 42, 23), ('walk', 0, 11, 17, 12), ('walk', 16, 8, 27, 15), ('walk', 20, 5, 22, 8), ('walk', 26, 7, 33, 9), ('walk', 31, 6, 33, 9),
                ('walk', 26, 12, 42, 14), ('walk', 30, 14, 41, 21), ('walk', 20, 14, 22, 23), ('walk', 3, 14, 15, 16), ('walk', 2, 14, 4, 21), ('walk', 6, 21, 21, 22),
                ('walk', 15, 19, 22, 22), ('block', 18, 9, 25, 14), ('block', 32, 14, 34, 16), ('block', 37, 14, 40, 16), ('block', 31, 17, 35, 19), ('block', 37, 17, 41, 19), ('block', 35, 12, 38, 16)],
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
        'npcs': {'mira': (19, 9, 'down'), 'borin': (32, 11, 'down'), 'lena': (33, 19, 'down'), 'sera': (8, 12, 'left'),
                 'rok': (36, 12, 'left'), 'villager_m': (14, 15, 'down'), 'villager_f': (26, 13, 'down'), 'kid': (23, 17, 'down')},
        'objects': [
            {'id': 'board', 'x': 19, 'y': 12, 'area': [[x, y] for x in range(18, 21) for y in range(11, 13)]},
            {'id': 'well', 'x': 5, 'y': 12, 'area': [[x, y] for x in range(4, 7) for y in range(10, 14)]},
            {'id': 'sq_chest', 'x': 12, 'y': 9, 'sprite': 'chest'},
            {'id': 'well_chest', 'x': 7, 'y': 14, 'sprite': 'chest'},
        ],
        'exits': [{'edge': 'right', 'a': 0, 'b': 23, 'scene': 'outskirts', 'at': [1, 11], 'face': 'right'},
                  {'edge': 'down', 'a': 0, 'b': 42, 'scene': 'road', 'at': [1, 11], 'face': 'right'},
                  # cửa nhà -> trong nhà
                  {'tiles': [[31, 18]], 'scene': 'tavern_in', 'at': [7, 8], 'face': 'up', 'door': True},
                  {'tiles': [[32, 9]], 'scene': 'forge_in', 'at': [7, 8], 'face': 'up', 'door': True},
                  {'tiles': [[20, 5]], 'scene': 'mira_in', 'at': [7, 8], 'face': 'up', 'door': True}],
    },
    'road': {
        'spawn': [3, 11],
        'npcs': {'guard': (27, 12, 'left'), 'merchant': (32, 8, 'down')},
        'objects': [{'id': 'bridge_chest', 'x': 8, 'y': 4, 'sprite': 'chest'}],
        'exits': [{'edge': 'left', 'a': 0, 'b': 23, 'scene': 'ashford', 'at': [20, 22], 'face': 'up'},
                  {'edge': 'right', 'a': 0, 'b': 23, 'scene': 'capital', 'at': [35, 42], 'face': 'up'}],
    },
    'sylvaren': {
        'spawn': [2, 13],
        'npcs': {'aeris': (31, 9, 'down'), 'elfmerchant': (24, 7, 'down'), 'elfkid': (11, 9, 'down')},
        'objects': [{'id': 'moonwell', 'x': 12, 'y': 7, 'area': [[x, y] for x in range(8, 17) for y in range(5, 7)]},
                    {'id': 'syl_chest', 'x': 5, 'y': 19, 'sprite': 'chest'},
                    {'id': 'ruin_stone', 'x': 20, 'y': 13, 'sprite': 'pages'},
                    {'id': 'shroom_glow', 'x': 34, 'y': 18, 'sprite': 'mushroom'}],
        'exits': [{'edge': 'left', 'a': 0, 'b': 23, 'scene': 'capital', 'at': [70, 20], 'face': 'left'},
                  {'edge': 'right', 'a': 0, 'b': 23, 'scene': 'lunaria', 'at': [1, 11], 'face': 'right'}],
    },
    'lunaria': {
        'spawn': [2, 11],
        'npcs': {'oren': (21, 6, 'down'), 'lun_guard': (32, 8, 'down'), 'elfkid2': (9, 15, 'down')},
        'objects': [{'id': 'moon_fountain', 'x': 21, 'y': 14, 'area': [[x, 14] for x in range(19, 25)]},
                    {'id': 'lun_chest', 'x': 40, 'y': 20, 'sprite': 'chest'},
                    {'id': 'star_tome', 'x': 33, 'y': 9, 'sprite': 'pages'},
                    {'id': 'lun_board', 'x': 16, 'y': 12, 'sprite': 'board', 'big': True}],
        'exits': [{'edge': 'left', 'a': 0, 'b': 23, 'scene': 'sylvaren', 'at': [41, 14], 'face': 'left'}],
    },
    'capital': {'spawn': [35, 42], 'npcs': {'corvin': (10, 11, 'down'), 'elise': (42, 12, 'down'), 'nun': (10, 21, 'down'), 'villager_m2': (40, 37, 'left'), 'merchant2': (30, 20, 'down')}, 'objects': [{'id': 'gate_board', 'x': 40, 'y': 39, 'sprite': 'board', 'big': True, 'solid': True}, {'id': 'market_chest', 'x': 44, 'y': 25, 'sprite': 'chest', 'solid': True}, {'id': 'crypt', 'x': 21, 'y': 18, 'sprite': 'mine', 'solid': True}, {'id': 'jump_capital_step1', 'x': 6, 'y': 11, 'sprite': 'chest', 'solid': True, 'optional': True}, {'id': 'jump_capital_step2', 'x': 50, 'y': 11, 'sprite': 'chest', 'solid': True, 'optional': True}], 'exits': [{'edge': 'right', 'a': 20, 'b': 20, 'scene': 'sylvaren', 'at': [1, 13], 'face': 'right'}, {'edge': 'right', 'a': 21, 'b': 21, 'scene': 'sylvaren', 'at': [1, 14], 'face': 'right'}, {'tiles': [[35, 43]], 'scene': 'road', 'at': [41, 11], 'face': 'left'}]},
}

# 🏠 TRONG NHÀ: tranh phòng (Codex) 1536x1024 -> 1440x960 = 15 x 10 ô 96px, lưới vẽ tay theo tranh
ROOM_RAW = '.team/art/raw/room_{}.png'
INTERIORS = {
    'tavern_in': {
        'src': 'tavern',
        'grid': ['###############', '###############', '###############',
                 '####....#######', '####..........#', '####..........#', '####..........#', '####..........#', '####..........#', '#######.#######'],
        'npcs': {'bard': (11, 6, 'left'), 'hank': (4, 5, 'left')},
        'objects': [{'id': 'tavern_counter', 'x': 11, 'y': 3, 'area': [[x, 3] for x in range(8, 14)]},
                    {'id': 'tavern_chest', 'x': 13, 'y': 8, 'sprite': 'chest'}],
        'exits': [{'tiles': [[7, 9]], 'scene': 'ashford', 'at': [31, 19], 'face': 'down', 'door': True}],
    },
    'forge_in': {
        'src': 'forge',
        'grid': ['###############', '###############', '###.###########', '###...###.####', '###...###...###', '###..........##', '###..........##', '###..........##', '#.............#', '#######.#######'],
        'npcs': {'mae': (4, 5, 'right')},
        'objects': [{'id': 'forge_anvil', 'x': 7, 'y': 4, 'area': [[x, y] for x in range(6, 9) for y in range(3, 5)]},
                    {'id': 'forge_chest', 'x': 12, 'y': 8, 'sprite': 'chest'}],
        'exits': [{'tiles': [[7, 9]], 'scene': 'ashford', 'at': [32, 10], 'face': 'down', 'door': True}],
    },
    'mira_in': {
        'src': 'mira',
        'grid': ['###############', '###############', '############.##', '####.......##.#', '###........####', '#..........####', '###........####', '###.........###', '###.........###', '#######.#######'],
        'npcs': {'ella': (6, 5, 'down')},
        'objects': [{'id': 'mira_shelf', 'x': 7, 'y': 2, 'area': [[x, 2] for x in range(4, 12)]},
                    {'id': 'mira_chest', 'x': 10, 'y': 7, 'sprite': 'chest'}],
        'exits': [{'tiles': [[7, 9]], 'scene': 'ashford', 'at': [20, 6], 'face': 'down', 'door': True}],
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
    if scene == 'capital':
        from build_capital import city
        out[scene] = city()[0]
        continue
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
for scene, R in INTERIORS.items():
    rows = [r.ljust(15, '#')[:15] for r in R['grid']]
    assert len(rows) == 10, scene
    sx, sy = 7, 8
    grid = [list(r) for r in rows]
    for e in R['exits']:
        for x, y in e['tiles']:
            grid[y][x] = '.'
    comp = component(grid, sx, sy)
    grid = [[('.' if (x, y) in comp else '#') for x in range(15)] for y in range(10)]
    npcs = [{'id': i, 'x': x, 'y': y, 'face': f} for i, (x, y, f) in R['npcs'].items()]
    objs = [dict(o, solid=True) for o in R['objects']]
    for n in npcs:
        assert grid[n['y']][n['x']] == '.', (scene, n)
    for o in objs:
        if 'area' not in o:
            assert grid[o['y']][o['x']] == '.', (scene, o)
    out[scene] = {'image': scene, 'tile': 96, 'cols': 15, 'rows': 10, 'spawn': [sx, sy], 'interior': True, 'grid': [''.join(r) for r in grid],
                  'npcs': npcs, 'objects': objs, 'exits': R['exits']}
    Image.open(ROOM_RAW.format(R['src'])).convert('RGB').resize((1440, 960), Image.LANCZOS).save(f'src/assets/maps/{scene}.webp', quality=88)
apply_demo(out)
apply_world(out)
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
