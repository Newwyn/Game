# ============================================================
# Tạo sprite_spec.json cho bộ hình động đầy đủ của quái (art/enemies/<art>/sprite/*.jpg, tranh Flow 1200x896 nền xanh)
#   python tools/enemy_spec.py <art> [<art> ...]      -> art/enemies/<art>/sprite/sprite_spec.json
#   rồi: uv run --no-project --with numpy --with pillow --with scipy --with scikit-image python tools/sprite_pack.py art/enemies/<art>/sprite/sprite_spec.json
#   -> src/assets/sprites/enemyfull_<art>.webp + src/characters/sprite/enemyfull_<art>.json (enemySprites.js tự nhận)
# Tấm chuẩn: idle (đứng 4 · thủ thế 4) · attack 8 · move 8 · hurt-stun (4 · 4) · dead-victory (4 · 4) · skill-<id> 8 (trùm)
# ============================================================
import json, os, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GROUPS = {
    'idle': [['idle', 4, 'toe'], ['ready', 4, 'toe']],
    'hurt-stun': [['hurt', 4, 'toe'], ['stun', 4, 'toe']],
    'dead-victory': [['dead', 4, 'toe'], ['victory', 4, 'toe']],
}
ANCHOR = {'attack': 'heel', 'move': 'body'}
# quái có da / đồ XANH LÁ: tách nền kiểu 'jade' (giữ màu xanh); còn lại 'matte' (viền tối sạch, không ám xanh)
GREEN = {'goblin', 'trapper', 'spy', 'c2scout', 'c2guard', 'c2treant', 'hollow'}


def build(art, scales=None):
    d = os.path.join(ROOT, 'art', 'enemies', art, 'sprite')
    old = {}
    sp = os.path.join(d, 'sprite_spec.json')
    if os.path.exists(sp):   # giữ chỉnh tay (scale / cuts / anchorX...) của lần trước
        old = json.load(open(sp, encoding='utf-8')).get('sheets', {})
    sheets = {}
    for f in sorted(glob.glob(os.path.join(d, 'sprite-*.jpg')) + glob.glob(os.path.join(d, 'sprite-*.png'))):
        name = os.path.splitext(os.path.basename(f))[0][len('sprite-'):]
        s = {'file': os.path.relpath(f, ROOT).replace(os.sep, '/'), 'scale': 1.0, 'split': True}
        if name in GROUPS:
            s['groups'] = GROUPS[name]
        else:
            s['anchor'] = ANCHOR.get(name, 'toe')
            if name.startswith('skill-'):
                s['groups'] = [[name[len('skill-'):].replace('-', '_'), 8, 'toe']]
        if name in ('dead-victory',):
            s['ground'] = 'group'
        keep = old.get(name, {})
        s.update({k: v for k, v in keep.items() if k not in ('file',)})
        sheets[name] = s
    spec = {'note': f'Quái {art}: bộ hình động đầy đủ (Flow, 10/11/2026) — tools/enemy_spec.py', 'atlasScale': 0.8, 'maxWidth': 4096,
            'pad': 4, 'calib': 'idle1', 'key': 'jade' if art in GREEN else 'matte', 'out': f'src/assets/sprites/enemyfull_{art}',
            'meta': f'src/characters/sprite/enemyfull_{art}.json', 'format': 'webp', 'sheets': sheets}
    json.dump(spec, open(sp, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    return sp


if __name__ == '__main__':
    for a in sys.argv[1:]:
        print(build(a))
