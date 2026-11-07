"""Tranh nhân vật theo BẬC (S / SS): xếp tranh Flow vẽ lại vào đúng tấm động tác + sinh spec để ráp bằng sprite_pack.py.

Bậc SSS = tranh hiện tại (art/<tên>/sprite/). Bậc Thường + S dùng tranh S, bậc SS dùng tranh SS.
Flow vẽ lại từng tấm gốc (đã đệm thêm 64px nền xanh trên + dưới thành 4:3 1536x1152) giữ nguyên lưới 4x2 + dáng từng khung,
chỉ đổi trang phục / vũ khí -> mỗi tấm mới chồng khít tấm gốc.

    python tools/tier_art.py place <tên> <bậc> <ảnh1> [ảnh2 ...]
        So dáng (mặt nạ khác-nền-xanh, 96x72) từng ảnh với mọi tấm gốc -> chọn tấm giống nhất, đưa về 1536x1024
        (co về 1536x1152 rồi cắt 64px trên / dưới) -> art/<tên>/sprite_<bậc>/<tên tấm gốc>.png. In bảng ghép + độ giống.
    python tools/tier_art.py spec <tên> <bậc>
        Chép art/<tên>/sprite/sprite_spec.json -> art/<tên>/sprite_<bậc>/sprite_spec.json: đổi đường dẫn tấm, khoá tách nền
        (tranh gốc trong suốt "alpha" -> "matte"; nhân vật mặc đồ xanh lá giữ "jade"), out/meta -> <tên>_<bậc>_sprite / <tên>Sprite_<bậc>.json.
        Tấm nào chưa có tranh bậc này thì tạm dùng tấm SSS (báo ra).
    python tools/tier_art.py status
        Bảng: mỗi nhân vật / bậc đã có bao nhiêu tấm.
"""
import json, os, sys
from PIL import Image
import numpy as np

HEROES = ['jessica', 'rok', 'lyra', 'seraphine', 'ignar', 'zerith', 'brakk', 'nerissa', 'elarion', 'grix', 'sylva']
PAD = 64


def spec_of(hero):
    return json.load(open(f'art/{hero}/sprite/sprite_spec.json', encoding='utf8'))


def sheet_files(hero):
    sp = spec_of(hero)
    return sorted({s['file'] for s in sp['sheets'].values()})


def mask_of(im):
    """Mặt nạ "không phải nền": ảnh RGBA dùng alpha, ảnh nền xanh dùng độ xanh."""
    a = np.asarray(im.convert('RGBA')).astype(np.int16)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    green = (g > 150) & (g > r + 60) & (g > b + 60)
    return (al > 128) & ~green


def padded(path):
    im = Image.open(path).convert('RGBA')
    c = Image.new('RGBA', (im.width, im.height + 2 * PAD), (0, 255, 0, 255))
    c.alpha_composite(im, (0, PAD))
    return c


def small(m, size=(96, 72)):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize(size, Image.BILINEAR)) > 100


def place(hero, tier, files):
    refs = {f: small(mask_of(padded(f))) for f in sheet_files(hero)}
    out_dir = f'art/{hero}/sprite_{tier}'
    os.makedirs(out_dir, exist_ok=True)
    # ghép cả bộ một lượt: lần lượt chọn cặp (ảnh, tấm gốc) giống nhau nhất còn lại -> 2 dáng na ná nhau không giành nhau 1 tấm
    ims = {p: Image.open(p).convert('RGB').resize((1536, 1152), Image.LANCZOS) for p in files}
    masks = {p: small(mask_of(im)) for p, im in ims.items()}
    pairs = sorted(((m_ & r).sum() / max(1, (m_ | r).sum()), p, f) for p, m_ in masks.items() for f, r in refs.items())[::-1]
    used, done = {}, set()
    for iou, p, f in pairs:
        name = os.path.basename(f)
        if p in done or name in used:
            continue
        if iou < 0.55:
            continue
        ims[p].crop((0, PAD, 1536, 1152 - PAD)).save(os.path.join(out_dir, name))
        used[name] = (p, iou)
        done.add(p)
        print(f'  {p}  ->  {out_dir}/{name}   giống {iou:.2f}' + ('   (KIỂM TRA LẠI: lệch dáng)' if iou < 0.55 else ''))
    for p in files:
        if p not in done:
            print(f'  BỎ  {p}  (thừa hoặc lệch dáng — Flow vẽ sai tấm)')
    missing = [os.path.basename(f) for f in refs if os.path.basename(f) not in used and not os.path.exists(os.path.join(out_dir, os.path.basename(f)))]
    if missing:
        print('  còn thiếu:', ', '.join(missing))


def make_spec(hero, tier):
    sp = spec_of(hero)
    out_dir = f'art/{hero}/sprite_{tier}'
    sheets, missing = {}, []
    for k, s in sp['sheets'].items():
        f = os.path.join(out_dir, os.path.basename(s['file'])).replace('\\', '/')
        if not os.path.exists(f):
            missing.append(k)  # chưa có tranh bậc này -> tạm dùng tấm SSS (giữ khoá tách nền gốc) để bộ khung vẫn đủ
            sheets[k] = dict(s, key=s.get('key', sp.get('key', 'green')))
            continue
        s = dict(s, file=f, split=True)  # Flow hay vẽ 2 khung chạm nhau -> luôn bật tách theo lưới (chỉ tác dụng khi có vùng phủ 2 ô)
        key = s.get('key', sp.get('key', 'green'))
        if key == 'alpha':
            s['key'] = 'matte'
        sheets[k] = s
    key = sp.get('key', 'green')
    sp2 = dict(sp, sheets=sheets, key='matte' if key == 'alpha' else key,
               note=f'Bậc {tier.upper()}: Flow vẽ lại từng tấm của bản SSS (giữ lưới + dáng, đổi đồ) — tools/tier_art.py',
               out=f'src/assets/sprites/{hero}_{tier}_sprite', meta=f'src/characters/sprite/{hero}Sprite_{tier}.json')
    json.dump(sp2, open(os.path.join(out_dir, 'sprite_spec.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(f'{hero} {tier}: {len(sheets) - len(missing)}/{len(sheets)} tấm' + (f' · thiếu (tạm dùng SSS) {missing}' if missing else ''))


def status():
    for h in HEROES:
        n = len(sheet_files(h))
        row = [f'{h:10s} {n:2d} tấm']
        for t in ('s', 'ss'):
            d = f'art/{h}/sprite_{t}'
            have = len([f for f in sheet_files(h) if os.path.exists(os.path.join(d, os.path.basename(f)))])
            row.append(f'{t.upper()}: {have}/{n}')
        print('  '.join(row))


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a:
        print(__doc__)
    elif a[0] == 'place':
        place(a[1], a[2], a[3:])
    elif a[0] == 'spec':
        make_spec(a[1], a[2])
    elif a[0] == 'status':
        status()
