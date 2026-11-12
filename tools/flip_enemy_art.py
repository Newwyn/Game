# Lat guong tranh quai ve quay mat sang TRAI thanh quay sang PHAI (quy uoc cua game: tranh goc nhin sang phai, game tu lat khi can).
# 12/11/2026: toan bo quai chuong 2 ve nguoc huong nen vao tran bi "di lui". Chay 1 lan: python tools/flip_enemy_art.py
import json, sys
from PIL import Image
ARTS = sys.argv[1:] or ['c2cultist', 'c2guard', 'c2scout', 'c2shroom', 'c2spiritwolf', 'c2treant', 'c2wisp', 'malkor', 'thalor', 'hollow']
for art in ARTS:
    jp, ip = f'src/characters/sprite/enemy_{art}.json', f'src/assets/sprites/enemy_{art}.webp'
    meta = json.load(open(jp, encoding='utf-8'))
    if meta.get('flipped'): print(art, 'da lat roi, bo qua'); continue
    im = Image.open(ip).convert('RGBA')
    for name, f in meta['frames'].items():
        x, y, w, h = f['rect']
        im.paste(im.crop((x, y, x + w, y + h)).transpose(Image.FLIP_LEFT_RIGHT), (x, y))
        f['org'][0] = w - f['org'][0]
    meta['flipped'] = True
    im.save(ip, 'WEBP', quality=92, method=6)
    json.dump(meta, open(jp, 'w', encoding='utf-8'), separators=(',', ':'))
    print(art, 'xong', len(meta['frames']), 'khung')
