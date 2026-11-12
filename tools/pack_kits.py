# Đóng gói mô hình 3D của 3 bộ tài nguyên CC0 vào src/assets/world3d/<bộ>/<tên>.glb (12/11/2026)
#   - Quaternius "Medieval Village MegaKit" (bản Standard, CC0)  -> bộ `village`
#   - Quaternius "Stylized Nature MegaKit" (bản Standard, CC0)   -> bộ `qnature`
#   - KayKit "Dungeon Remastered" 1.0 (Kay Lousberg, CC0)        -> bộ `dungeon`
# Dùng: python tools/pack_kits.py <thư mục chứa village/ nature/ dungeon/ đã giải nén>
#   (tải: opengameart.org/content/medieval-village-megakit · opengameart.org/content/stylized-nature-megakit ·
#         github.com/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0)
# Việc làm: chỉ giữ hình dán MÀU (bỏ normal / roughness cho nhẹ), thu về 512 px, nhúng vào trong file .glb.
import io, json, os, struct, sys
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', 'assets', 'world3d')
TEX = 512

LIST = {
    'village': ('village/glTF', [
        'Wall_Plaster_Straight', 'Wall_Plaster_Door_Round', 'Wall_Plaster_Window_Wide_Round', 'Wall_Plaster_Window_Thin_Round', 'Wall_Plaster_WoodGrid',
        'Wall_UnevenBrick_Straight', 'Wall_UnevenBrick_Door_Round', 'Wall_UnevenBrick_Window_Wide_Round', 'Wall_Arch',
        'Corner_Exterior_Wood', 'Corner_Exterior_Brick',
        'Roof_RoundTiles_4x4', 'Roof_RoundTiles_4x6', 'Roof_RoundTiles_6x8', 'Roof_Front_Brick4', 'Roof_Front_Brick6', 'Roof_Tower_RoundTiles',
        'Prop_Chimney', 'Prop_Wagon', 'Prop_Crate', 'Prop_WoodenFence_Single', 'Prop_Vine1', 'Prop_Vine2', 'Prop_MetalFence_Simple', 'Prop_Support',
        'Window_Wide_Round1', 'WindowShutters_Wide_Round_Open', 'DoorFrame_Round_WoodDark', 'DoorFrame_Round_Brick', 'Door_2_Round', 'Window_Roof_Wide',
        'Balcony_Simple_Straight', 'Overhang_Plaster_Long', 'Stairs_Exterior_Straight', 'Floor_UnevenBrick',
    ]),
    'qnature': ('nature/glTF', [
        'Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3', 'Bush_Common', 'Bush_Common_Flowers', 'Fern_1', 'Mushroom_Common', 'Plant_1_Big', 'Plant_7_Big',
        'RockPath_Round_Wide', 'Pebble_Round_1', 'Pebble_Round_3',
    ]),
    'dungeon': ('dungeon/addons/kaykit_dungeon_remastered/Assets/gltf', [
        'wall', 'wall_doorway', 'wall_corner', 'wall_arched', 'wall_half', 'wall_cracked', 'wall_broken', 'wall_gated', 'wall_pillar', 'wall_shelves', 'wall_window_closed',
        'pillar', 'pillar_decorated', 'column', 'torch_mounted', 'torch_lit', 'barrel_large', 'barrel_small_stack', 'box_stacked', 'crates_stacked', 'chest', 'chest_gold',
        'banner_patternA_red', 'banner_shield_blue', 'banner_triple_green', 'rubble_large', 'rubble_half', 'trunk_large_A', 'table_long_decorated_A', 'shelf_large', 'keg_decorated',
        'sword_shield', 'stairs', 'floor_tile_large', 'floor_tile_large_rocks', 'floor_dirt_large_rocky', 'barrier', 'candle_triple',
    ]),
}

def pad4(b, fill=b'\x00'):
    return b + fill * ((4 - len(b) % 4) % 4)

def read_glb(path):
    d = open(path, 'rb').read()
    assert d[:4] == b'glTF'
    off, js, bn = 12, None, b''
    while off < len(d):
        ln, tp = struct.unpack('<II', d[off:off + 8]); chunk = d[off + 8:off + 8 + ln]; off += 8 + ln
        if tp == 0x4E4F534A: js = json.loads(chunk)
        elif tp == 0x004E4942: bn = chunk
    return js, bn

def shrink(raw, keep_alpha):
    im = Image.open(io.BytesIO(raw))
    # chi giu kenh trong suot khi vat lieu THAT SU can (la cay, day leo): nhieu hinh dan cua bo Village dung kenh alpha lam mat na, khong phai do trong
    alpha = keep_alpha and im.mode in ('RGBA', 'LA', 'P') and im.convert('RGBA').getextrema()[3][0] < 250
    im = im.convert('RGBA' if alpha else 'RGB')
    if max(im.size) > TEX: im = im.resize((TEX, TEX * im.size[1] // im.size[0]), Image.LANCZOS)
    out = io.BytesIO()
    if alpha: im.save(out, 'PNG', optimize=True); return out.getvalue(), 'image/png'
    im.save(out, 'JPEG', quality=86); return out.getvalue(), 'image/jpeg'

def pack(folder, name):
    base = os.path.join(SRC, folder)
    f_gltf, f_glb = os.path.join(base, name + '.gltf'), os.path.join(base, name + '.gltf.glb')
    if os.path.exists(f_gltf):
        js = json.load(open(f_gltf, encoding='utf-8'))
        bufs = [open(os.path.join(base, b['uri']), 'rb').read() for b in js.get('buffers', [])]
    elif os.path.exists(f_glb) or os.path.exists(os.path.join(base, name + '.glb')):
        js, bn = read_glb(f_glb if os.path.exists(f_glb) else os.path.join(base, name + '.glb')); bufs = [bn]
    else:
        print('THIEU', folder, name); return 0
    # gộp mọi buffer thành 1
    blob, offs = b'', []
    for b in bufs: offs.append(len(blob)); blob += pad4(b)
    for bv in js.get('bufferViews', []): bv['byteOffset'] = bv.get('byteOffset', 0) + offs[bv.get('buffer', 0)]; bv['buffer'] = 0
    # chỉ giữ hình dán màu
    used = {}
    for m in js.get('materials', []):
        pbr = m.setdefault('pbrMetallicRoughness', {})
        for k in ('normalTexture', 'occlusionTexture', 'emissiveTexture'): m.pop(k, None)
        pbr.pop('metallicRoughnessTexture', None); pbr['metallicFactor'] = 0; pbr['roughnessFactor'] = 0.9
        t = pbr.get('baseColorTexture')
        if t is not None: used[t['index']] = used.get(t['index'], False) or m.get('alphaMode', 'OPAQUE') != 'OPAQUE'
    texs, imgs, new_tex, new_img = js.get('textures', []), js.get('images', []), [], []
    remap = {}
    for ti in sorted(used):
        src_img = imgs[texs[ti]['source']]
        if 'uri' in src_img:
            p = os.path.join(base, src_img['uri'])
            if not os.path.exists(p): p = os.path.join(base, '..', 'Textures', os.path.basename(src_img['uri']))
            raw = open(p, 'rb').read()
        else:
            bv = js['bufferViews'][src_img['bufferView']]; raw = blob[bv['byteOffset']:bv['byteOffset'] + bv['byteLength']]
        data, mime = shrink(raw, used[ti])
        js['bufferViews'].append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': len(data)}); blob += pad4(data)
        new_img.append({'bufferView': len(js['bufferViews']) - 1, 'mimeType': mime})
        new_tex.append({'source': len(new_img) - 1, **({'sampler': texs[ti]['sampler']} if 'sampler' in texs[ti] else {})})
        remap[ti] = len(new_tex) - 1
    for m in js.get('materials', []):
        t = m['pbrMetallicRoughness'].get('baseColorTexture')
        if t is not None: t['index'] = remap[t['index']]
    js['textures'], js['images'] = new_tex, new_img
    if not new_tex: js.pop('textures', None); js.pop('images', None)
    js['buffers'] = [{'byteLength': len(blob)}]
    jb = pad4(json.dumps(js, separators=(',', ':')).encode('utf-8'), b' ')
    return jb, blob

total = 0
for kit, (folder, names) in LIST.items():
    os.makedirs(os.path.join(OUT, kit), exist_ok=True)
    for n in names:
        r = pack(folder, n)
        if not r: continue
        jb, blob = r
        out = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(jb) + 8 + len(blob)) + struct.pack('<II', len(jb), 0x4E4F534A) + jb + struct.pack('<II', len(blob), 0x004E4942) + blob
        open(os.path.join(OUT, kit, n + '.glb'), 'wb').write(out); total += len(out)
print('xong', round(total / 1e6, 2), 'MB')
