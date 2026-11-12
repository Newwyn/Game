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
BUILDINGS = [['hall', {'x0': 4, 'z0': 4, 'x1': 20, 'z1': 10, 'door': 12.0, 'wall': 'plaster', 'roof': 'red'}], ['hall', {'x0': 32, 'z0': 4, 'x1': 52, 'z1': 10, 'door': 42.0, 'wall': 'plaster', 'roof': 'red'}], ['hall', {'x0': 4, 'z0': 13, 'x1': 16, 'z1': 20, 'door': 10.0, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 54, 'z0': 4, 'x1': 60, 'z1': 10, 'door': 57.0, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 62, 'z0': 4, 'x1': 68, 'z1': 10, 'door': 65.0, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 48, 'z0': 12, 'x1': 55, 'z1': 18, 'door': 51.5, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 48, 'z0': 23, 'x1': 55, 'z1': 28, 'door': 51.5, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 57, 'z0': 12, 'x1': 62, 'z1': 18, 'door': 59.5, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 57, 'z0': 23, 'x1': 62, 'z1': 28, 'door': 59.5, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 64, 'z0': 12, 'x1': 68, 'z1': 18, 'door': 66.0, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 64, 'z0': 23, 'x1': 68, 'z1': 28, 'door': 66.0, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 4, 'z0': 23, 'x1': 10, 'z1': 28, 'door': 7.0, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 12, 'z0': 23, 'x1': 18, 'z1': 28, 'door': 15.0, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 20, 'z0': 23, 'x1': 24, 'z1': 28, 'door': 22.0, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 4, 'z0': 34, 'x1': 11, 'z1': 39, 'door': 7.5, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 13, 'z0': 34, 'x1': 20, 'z1': 39, 'door': 16.5, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 22, 'z0': 34, 'x1': 29, 'z1': 39, 'door': 25.5, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 43, 'z0': 34, 'x1': 50, 'z1': 39, 'door': 46.5, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 52, 'z0': 34, 'x1': 59, 'z1': 39, 'door': 55.5, 'wall': 'plaster', 'roof': 'red'}], ['house', {'x0': 61, 'z0': 34, 'x1': 68, 'z1': 39, 'door': 64.5, 'wall': 'plaster', 'roof': 'red'}]]
PROPS = [['model', 'custom/town_stall_fruit', 28.0, 18.0, {'s': 0.62, 'r': 0}], ['model', 'custom/town_stall_cloth', 28.0, 27.0, {'s': 0.62, 'r': 0}], ['model', 'custom/town_stall_fruit', 32.0, 18.0, {'s': 0.62, 'r': 0}], ['model', 'custom/town_stall_cloth', 32.0, 27.0, {'s': 0.62, 'r': 0}], ['model', 'custom/town_stall_fruit', 40.0, 18.0, {'s': 0.62, 'r': 0}], ['model', 'custom/town_stall_cloth', 40.0, 27.0, {'s': 0.62, 'r': 0}], ['model', 'custom/town_stall_fruit', 44.0, 18.0, {'s': 0.62, 'r': 0}], ['model', 'custom/town_stall_cloth', 44.0, 27.0, {'s': 0.62, 'r': 0}], ['model', 'custom/town_fountain', 40.5, 24.5, {'s': 0.9, 'r': 0}], ['model', 'custom/town_statue', 28.0, 23.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 32.5, 14.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 38.5, 14.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 33.5, 26.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 46.5, 20.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 60.5, 18.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 64.5, 18.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 31.5, 34.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 38.5, 34.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 32.5, 42.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 38.5, 42.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 32.5, 10.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 38.5, 10.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 10.5, 29.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_lamp_post', 18.5, 29.5, {'s': 0.5, 'r': 0}], ['model', 'custom/town_bench', 30.0, 23.5, {'s': 0.62, 'r': 0}], ['model', 'custom/town_bench', 45, 23.5, {'s': 0.62, 'r': 0}], ['model', 'custom/town_noticeboard', 26.5, 26.5, {'s': 0.44, 'r': 0}], ['model', 'custom/town_cart_goods', 42, 35, {'s': 0.62, 'r': 0}], ['model', 'custom/town_cart_hay', 32.5, 38, {'s': 0.48, 'r': 0}], ['model', 'custom/town_woodpile', 4.5, 10.5, {'s': 0.48, 'r': 0}], ['model', 'custom/town_laundry', 14.5, 39.5, {'s': 0.62, 'r': 0}], ['model', 'custom/town_barrels', 54.5, 9.5, {'s': 0.6, 'r': 0}], ['model', 'custom/town_crates', 62.5, 9.5, {'s': 0.62, 'r': 0}], ['model', 'custom/town_sacks', 4.5, 39.5, {'s': 0.62, 'r': 0}], ['model', 'custom/town_trough', 22.5, 39.5, {'s': 0.48, 'r': 0}], ['model', 'custom/town_planter_a', 44.5, 39.5, {'s': 0.62, 'r': 0}], ['model', 'custom/town_planter_b', 62.5, 39.5, {'s': 0.62, 'r': 0}], ['model', 'custom/town_sign_inn', 42.5, 38.5, {'s': 0.62, 'r': 0}], ['model', 'custom/town_flowerpots', 53.5, 39.5, {'s': 0.62, 'r': 0}]]
POSITIONS = {'corvin': [10, 11], 'elise': [42, 12], 'nun': [10, 21], 'villager_m2': [40, 37], 'merchant2': [30, 20], 'gate_board': [40, 39], 'market_chest': [44, 25], 'crypt': [21, 18], 'jump_capital_step1': [6, 11], 'jump_capital_step2': [50, 11], 'pages': [12, 11], 'sp_square': [29, 22], 'sp_archive': [15, 11], 'sp_relief': [31, 37], 'sp_tower': [48, 11], 'clue_poster': [33, 38], 'pg1': [18, 11], 'pg2': [46, 21], 'pg3': [58, 21], 'ch1': [8, 21], 'ch2': [16, 21], 'ch3': [50, 19], 'ch4': [8, 39], 'ch5': [59, 39], 'pk_hoa': [25, 14], 'p_thuky': [46, 12], 'so_no': [44, 12], 'g_tao4': [25, 6], 'n_tuong': [27, 25], 'n_cho': [43, 20], 'hc_cho': [46, 24], 'n_thu_vien': [8, 11], 'g_capital_tao_1': [23, 8], 'g_capital_tao_2': [23, 12]}
ORIGINAL = {'image': 'capital', 'tile': 32, 'cols': 43, 'rows': 24, 'spawn': [21, 17], 'grid': ['.#.#####.###...#...#.###############.######', '#.######...........#.###############.#.....', '.#..####...#...#...#.###############.#..#.#', '#####.#...######...#.###############.######', '....####..######..###.##...........#.######', '##..#####.#######.###.....#..........#####.', '.########.######..########################.', '..#.#.#...........#.#.....##...#.....#.....', '###.#...##......................##.########', '###.########..#..###..#.....#..######.####.', '#####.#######..######.#####...#######.####.', '#.#.#.#######..###.#....#.#...#######.#####', '....#.#######...#.#..#...#....#######.#####', '#...########.........#.....................', '....#########....##..##..#.....##..#.......', '.#..#.##..#.#...###.....###...###.#########', '##..##.#........#.###.#####...####.##.#....', '#.#..##..####.#.............#.######.###...', '.##...##.####.................#.###.###....', '.#.....###########################.###..#.#', '#...................###...........###....#.', '####.#..........#...###.....#.....##....###', '##.####.....######...#...#.###....#...###.#', '#.#..#.#...######..#......####........####.'], 'npcs': [{'id': 'corvin', 'x': 8, 'y': 16, 'face': 'down'}, {'id': 'elise', 'x': 28, 'y': 8, 'face': 'down'}, {'id': 'nun', 'x': 13, 'y': 8, 'face': 'down'}, {'id': 'villager_m2', 'x': 23, 'y': 18, 'face': 'left'}, {'id': 'merchant2', 'x': 19, 'y': 14, 'face': 'down'}], 'objects': [{'id': 'gate_board', 'x': 25, 'y': 18, 'sprite': 'board', 'big': True, 'solid': True}, {'id': 'market_chest', 'x': 29, 'y': 16, 'sprite': 'chest', 'solid': True}, {'id': 'crypt', 'x': 16, 'y': 8, 'sprite': 'mine', 'solid': True}, {'id': 'jump_capital_step1', 'x': 10, 'y': 2, 'sprite': 'chest', 'solid': True, 'optional': True}, {'id': 'jump_capital_step2', 'x': 14, 'y': 2, 'sprite': 'chest', 'solid': True, 'optional': True}], 'exits': [{'edge': 'right', 'a': 13, 'b': 13, 'scene': 'sylvaren', 'at': [1, 13], 'face': 'right'}, {'edge': 'right', 'a': 14, 'b': 14, 'scene': 'sylvaren', 'at': [1, 14], 'face': 'right'}, {'tiles': [[21, 18]], 'scene': 'road', 'at': [41, 11], 'face': 'left'}], 'heights': ['0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000012201220000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000'], 'gaps': [[15, 13], [16, 13], [21, 8]], 'stones': [], 'jumpSites': [{'kind': 'steps', 'tiles': [[8, 2], [9, 2], [10, 2]], 'chest': 'jump_capital_step1'}, {'kind': 'steps', 'tiles': [[12, 2], [13, 2], [14, 2]], 'chest': 'jump_capital_step2'}, {'kind': 'gap', 'tiles': [[21, 8]], 'start': [18, 8], 'landing': [22, 8]}, {'kind': 'run', 'tiles': [[15, 13], [16, 13]], 'start': [12, 13], 'landing': [17, 13]}]}
ORIGINAL_EXTRA = [{'id': 'pages', 'x': 14, 'y': 16, 'sprite': 'pages', 'solid': True}, {'id': 'sp_square', 'x': 13, 'y': 11, 'solid': True, 'char': 'npc_villager_m', 'solo': True, 'face': 'down'}, {'id': 'sp_archive', 'x': 17, 'y': 17, 'sprite': 'archive_door', 'solid': True, 'big': True}, {'id': 'sp_relief', 'x': 37, 'y': 13, 'solid': True, 'char': 'npc_guard', 'solo': True, 'face': 'down'}, {'id': 'sp_tower', 'x': 17, 'y': 4, 'sprite': 'stairs', 'big': True, 'solid': True}, {'id': 'clue_poster', 'x': 16, 'y': 7, 'sprite': 'poster', 'solid': True}, {'id': 'pg1', 'x': 23, 'y': 11, 'sprite': 'pages', 'solid': True}, {'id': 'pg2', 'x': 28, 'y': 11, 'sprite': 'pages', 'solid': True}, {'id': 'pg3', 'x': 34, 'y': 14, 'sprite': 'pages', 'solid': True}, {'id': 'ch1', 'x': 5, 'y': 7, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch2', 'x': 24, 'y': 7, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch3', 'x': 30, 'y': 9, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch4', 'x': 11, 'y': 15, 'sprite': 'i_blanket', 'solid': True}, {'id': 'ch5', 'x': 39, 'y': 13, 'sprite': 'i_blanket', 'solid': True}, {'id': 'pk_hoa', 'x': 19, 'y': 7, 'sprite': 'i_bellflower', 'solid': True}, {'id': 'p_thuky', 'x': 27, 'y': 14, 'solid': True, 'char': 'npc_merchant', 'solo': True, 'face': 'down'}, {'id': 'so_no', 'x': 28, 'y': 16, 'sprite': 'ledger', 'solid': True}, {'id': 'g_tao4', 'x': 26, 'y': 9, 'sprite': 'i_appletree', 'solid': True, 'big': True}, {'id': 'n_tuong', 'x': 23, 'y': 12, 'sprite': 'i_stele', 'solid': True}, {'id': 'n_cho', 'x': 29, 'y': 12, 'sprite': 'i_sign', 'solid': True}, {'id': 'hc_cho', 'x': 33, 'y': 15, 'sprite': 'chest', 'solid': True}, {'id': 'n_thu_vien', 'x': 9, 'y': 15, 'sprite': 'i_stele', 'solid': True}, {'id': 'g_capital_tao_1', 'x': 26, 'y': 10, 'sprite': 'i_appletree', 'solid': True, 'big': True}, {'id': 'g_capital_tao_2', 'x': 26, 'y': 7, 'sprite': 'i_appletree', 'solid': True, 'big': True}]

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
    items += [['spire',8,15,dict(w=2,h=7)],['spire',14,15,dict(w=2,h=6)],
              ['spire',42,6,dict(w=2,h=6.5)],['vtower',33.5,5.5,dict(r=1.3,h=5)],
              ['vtower',50.5,5.5,dict(r=1.3,h=5)]]
    # Six-tile bridge decks widen around a visible planter traffic island.
    # The model anchor and planter share that blocked tile; all passage cells
    # remain clear, including at least two cells on either side of the island.
    for x in (14,36):
        items.append(['model','custom/town_bridge_stone',x,31,
                      dict(s=.67,sz=2,sy=.25,r=math.pi/2,y=-.30,cover=[x-3,29,x+3,33])])
        detail.append(['model','custom/town_planter_a',x+.5,31.5,dict(s=.4,y=.1)])
    items += PROPS
    items.append(['well',30,35])
    for x,y in [(19.5,17.5),(20.5,17.5),(21.5,17.5),(22.5,17.5)]:detail.append(['model','graveyard/gravestone-cross',x,y,dict(s=.6)])
    # These ornaments share reserved stall tiles, above the street-level pieces.
    for x in (28,40):detail.append(['model','custom/town_bunting',x,17.5,dict(s=.62,y=1)])
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
    # Market cobble medallion, reserved fountain basin and radial paving.
    d.ellipse((37*S,22*S,43*S,28*S),outline='#d8cfb8',width=3)
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
            for k in range(7):d.rectangle((X-14+k*4,Y-12,X-11+k*4,Y+4),fill='#e4c98d' if k%2 else '#9d5142')
        elif 'fountain' in name:
            d.ellipse((X-20,Y-20,X+20,Y+20),fill='#e1d8c0',outline='#77776f',width=3)
            d.ellipse((X-15,Y-15,X+15,Y+15),fill='#739daa');d.ellipse((X-5,Y-5,X+5,Y+5),fill='#e4ddc7')
        else:d.rounded_rectangle((X-5,Y-5,X+5,Y+5),radius=2,fill='#685e4c',outline='#ded0ac')
    for x in (14,36):
        d.rectangle(((x-3)*S,29*S,(x+3)*S-1,33*S-1),fill='#c7bea7',outline='#8d887c',width=2)
        for y in range(29*S,33*S,7):d.line(((x-3)*S+3,y,(x+3)*S-4,y),fill='#a59e8c')
        for xx in ((x-3)*S,(x+3)*S-4):d.rectangle((xx,29*S,xx+3,33*S-1),fill='#e4d6bb')
        d.rectangle((x*S+2,31*S+2,x*S+13,31*S+13),fill='#748458',outline='#d9cbaa')
    for x,y in [(8,15),(14,15),(42,6),(33.5,5.5),(50.5,5.5)]:
        X,Y=int(x*S),int(y*S);d.ellipse((X-10,Y-10,X+10,Y+10),fill='#485768',outline='#c9c4b7',width=2)
    d.ellipse((29*S,34*S,31*S,36*S),fill='#9a9486',outline='#ded4bd',width=4)
    for x,y in [(1,1),(71,1),(1,43),(71,43),(32.5,43),(39.5,43),(71,18),(71,25)]:
        X,Y=int(x*S),int(y*S);d.ellipse((X-14,Y-14,X+14,Y+14),fill='#727b84',outline='#dbd4c2',width=3)
    im.save(ROOT/'src/assets/maps/capital.webp',lossless=True,method=6)
    preview=Image.new('RGB',(1840,1180),'#eee7d6');preview.paste(im.resize((1440,880)),(20,55));d=ImageDraw.Draw(preview)
    try:
        font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16);title=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',23)
    except OSError:font=ImageFont.load_default();title=font
    d.text((20,15),'KINH THANH VALORIA | 72 x 44 | north up | numbered interaction points',font=title,fill='#333b43')
    for text,x,y in [('ARCHIVES',5,5),('ORCHARD',23,4),('PALACE',36,5),('CATHEDRAL',5,14),('GUILD QUARTER',49,13),('GRAND MARKET',29,18),('WEST HOMES',5,35),('GATE PLAZA',31,35),('EAST HOMES',48,35),('CANAL / QUAYS',47,30)]:
        X,Y=20+x*20,55+y*20;box=d.textbbox((X,Y),text,font=font);d.rectangle((box[0]-3,box[1]-3,box[2]+3,box[3]+3),fill='#f2e9d5');d.text((X,Y),text,font=font,fill='#343c43')
    targets=m['npcs']+m['objects']+extra+[dict(id='EXIT road',x=35,y=43),dict(id='EXIT sylvaren',x=71,y=20),dict(id='SPAWN',x=35,y=42)]
    for i,o in enumerate(targets,1):
        X,Y=20+o['x']*20+10,55+o['y']*20+10
        d.ellipse((X-9,Y-9,X+9,Y+9),fill='#163f58',outline='#fff3cf')
        d.text((X-6,Y-8),str(i),font=font,fill='white')
        d.text((1480,55+(i-1)*27),f"{i:02}  {o['id']} ({o['x']},{o['y']})",font=font,fill='#273b47')
    d.text((20,970),'Cream plaster / terracotta roofs / slate landmarks / warm grey cobbles',font=title,fill='#4a4a40')
    d.text((20,1010),'Four-tile royal avenue. Three-tile east-west avenue. Two canal bridges. Gates at south and east.',font=font,fill='#4a4a40')
    d.text((20,1045),'Trees and props occupy blocked cells. All streets form one connected pedestrian network.',font=font,fill='#4a4a40')
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
    write('src/world3d/layouts.js',text)
    text=read('src/world3d/life.js')
    text=re.sub(r'    capital: \[[\s\S]*?\n    \],',"    capital: [\n        ['pigeon', 30.5, 21.5], ['pigeon', 31.5, 22.5], ['pigeon', 41.5, 20.5], ['pigeon', 43.5, 21.5],\n        ['pigeon', 40.5, 12.5], ['pigeon', 46.5, 11.5], ['cat', 56.5, 21.5], ['dog', 36.5, 38.5],\n    ],",text)
    write('src/world3d/life.js',text)
    render(m,extra)
    print(f"Valoria: 72 x 44, {sum(r.count('.') for r in m['grid'])/3168:.1%} walkable; {len(items)} structures, {len(detail)} details")

if __name__=='__main__':generate()
