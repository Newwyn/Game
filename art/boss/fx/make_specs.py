# Hiệu ứng trùm vẽ bằng Flow (tranh AI nền đen, 1200x896, lưới 4x2 / 2x4) -> 2 atlas qua tools/fx_grid_pack.py
#   uv run --no-project --with numpy --with pillow --with scipy python art/boss/fx/make_specs.py
#   (xoá dấu lấp lánh của Flow ở góc phải dưới mỗi tấm, ghi *_clean.png + 2 tệp spec, rồi chạy fx_grid_pack)
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

D = Path(__file__).resolve().parent
ROOT = D.parent.parent.parent
for p in D.glob('boss-*.png'):
    if p.stem.endswith('_clean'):
        continue
    im = Image.open(p).convert('RGB')
    W, H = im.size
    # dấu lấp lánh của Flow (ngôi sao 4 cánh XÁM ở góc phải dưới): chỉ xoá điểm ít màu trong góc, giữ hiệu ứng có màu
    a = np.asarray(im).astype(np.int16).copy()
    y0, x0 = int(H * 0.78), int(W * 0.88)
    c = a[y0:, x0:]
    sat = c.max(-1) - c.min(-1)
    gray = (sat < 28) & (c.max(-1) > 40) & (c.max(-1) < 225)   # trắng sáng (lõi hiệu ứng) giữ lại
    c[gray] = 0
    a[y0:, x0:] = c
    Image.fromarray(a.astype(np.uint8)).save(D / f'{p.stem}_clean.png')

f = lambda n: f'art/boss/fx/{n}_clean.png'
G = lambda name, cells, align='cell', pivot='center', **kw: {'name': name, 'cells': cells, 'align': align, 'pivot': pivot, **kw}
fx = {
    'note': 'Hieu ung trum chuong 1-2 (Flow, nen den). Nhom giu ten cu cho src/vfx/bossFx.js.',
    'out': 'src/assets/sprites/boss_fx.webp', 'meta': 'src/vfx/bossFxAtlas.json', 'maxWidth': 2048,
    'sheets': {
        'clawhowl': {'file': f('boss-fx-claw-howl'), 'grid': [4, 2], 'scale': 0.6,
                     'cuts': [[296, 448, 304, 896], [596, 448, 604, 896], [896, 448, 904, 896]], 'cutFeather': 16,
                     'groups': [G('claw', [0, 1, 2, 3], 'core'), G('howl', [4, 5, 6, 7], 'core')]},
        'rageshadow': {'file': f('boss-fx-rage-shadow'), 'grid': [4, 2], 'scale': 0.6,
                       'groups': [G('rage', [0, 1, 2, 3], 'bottom', 'bottom'), G('shadow', [4, 5, 6, 7], 'cell')]},
        'pillar': {'file': f('boss-fx-pillar'), 'grid': [4, 2], 'scale': 0.6,
                   'groups': [G('pillar', [0, 1, 2, 3, 4, 5, 6, 7], 'bottom', 'bottom', smoke=[6, 7])]},
        'shieldcurse': {'file': f('boss-fx-shield-curse'), 'grid': [4, 2], 'scale': 0.6,
                        'groups': [G('dshield', [0, 1, 2, 3], 'bottom', 'bottom'), G('curse', [4, 5, 6, 7], 'core')]},
        'status': {'file': f('boss-fx-status'), 'grid': [4, 2], 'scale': 0.5,
                   'groups': [G('stun', [0, 1, 2, 3]), G('seal', [4, 5]), G('wisp', [6, 7], 'core')]},
        'ground': {'file': f('boss-fx-ground'), 'grid': [2, 4], 'scale': 0.6, 'regionThr': 28,
                   'groups': [G('warn', [0]), G('slam', [1]), G('firering', [2]), G('ucircle', [3]),
                              G('ushock', [4]), G('burn', [5]), G('sealring', [6]), G('target', [7])]},
    },
}
ult = {
    'note': 'Tuyet ky Valdric "Thanh Hoa Phan Quyet" (Flow, nen den).',
    'out': 'src/assets/sprites/boss_ult.webp', 'meta': 'src/vfx/bossUltAtlas.json', 'maxWidth': 2048,
    'sheets': {
        'shield': {'file': f('boss-ult-shield'), 'grid': [4, 2], 'scale': 0.6,
                   'groups': [G('ushield', [0, 1, 2, 3], 'bottom', 'bottom'), G('ushieldDmg', [4, 5, 6, 7], 'bottom', 'bottom')]},
        'blast': {'file': f('boss-ult-blast'), 'grid': [4, 2], 'scale': 0.6, 'cuts': [[896, 0, 904, 448], [596, 0, 604, 448]], 'cutFeather': 20,
                  'groups': [G('ublast', [0, 1, 2, 3, 4, 5, 6, 7], 'bottom', 'bottom', smoke=[6, 7])]},
        'shatter': {'file': f('boss-ult-shatter'), 'grid': [4, 2], 'scale': 0.6,
                    'groups': [G('ushatter', [0, 1, 2, 3], 'core'), G('uhit', [4, 5, 6, 7], 'core')]},
    },
}
for name, spec in (('fx_spec.json', fx), ('ult_spec.json', ult)):
    (D / name).write_text(json.dumps(spec, indent=1))
    r = subprocess.run([sys.executable, str(ROOT / 'tools' / 'fx_grid_pack.py'), str(D / name), '--preview', str(D / name.replace('.json', '_preview.png'))], cwd=ROOT)
    if r.returncode:
        sys.exit(r.returncode)
