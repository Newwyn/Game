# Sinh việc vẽ tranh BẬC (S / SS) cho Codex: mỗi tấm động tác SSS -> 1 tấm mới cùng lưới 4x2, cùng dáng, đổi trang phục
# Dùng: python tools/tier_jobs.py > .team/art/jobs_tier.json   (ảnh mẫu ghi vào .team/art/tier_ref/)
#   rồi: node tools/codex_batch.js .team/art/jobs_tier.json 4
#   rồi: python tools/tier_jobs.py install   (chép ảnh Codex về art/<tên>/sprite_<bậc>/, đưa về 1536x1024)
import json, os, sys
from PIL import Image

REF = '.team/art/tier_ref'
RAW = '.team/art/raw_tier'
# trang phục theo bậc cho nhân vật CHƯA có tranh bậc
OUTFIT = {
    'lyra': {
        's': 'a simple beginner ranger outfit: plain green linen tunic, brown leather vest, plain brown boots, a simple plain wooden longbow; no gold, no feather ornaments, no jewelry',
        'ss': 'an upgraded elven ranger outfit: polished silver elven armor pieces (shoulder guard, bracers, greaves) over a green tunic, and a finer silver-trimmed longbow',
    },
    'nerissa': {
        's': 'a simple beginner dancer outfit: plain light-blue cotton top and skirt with a simple cloth sash, plain sandals; no gold, no pearls, no jewelry',
        'ss': 'an upgraded water dancer outfit: flowing teal silk with silver trim, a silver circlet and simple silver bracelets and anklets',
    },
    'elarion': {
        's': 'a simple apprentice mage robe: plain dark-blue cotton robe with a rope belt, no gold trim, no ornaments, and a plain brown leather-bound book',
        'ss': 'an upgraded sage robe: dark-blue robe with silver trim and silver shoulder ornaments, and a spellbook with silver corners',
    },
    'grix': {
        's': 'a simple ragged goblin outfit: patched plain brown cloth vest and trousers, simple leather goggles, a plain wooden walking stick with a single small glass flask, fewer potion bottles; same green goblin skin',
        'ss': 'an upgraded goblin alchemist outfit: leather armor with silver buckles, silver-rimmed goggles, a staff with silver fittings and one glowing flask; same green goblin skin',
    },
    'sylva': {
        's': 'a simple beginner druid outfit: a plain green leaf-and-cloth dress, only a few small flowers in her hair, a plain wooden staff with no glowing orb; same small fairy wings',
        'ss': 'an upgraded druid outfit: a dress of leaves with silver vine jewelry, a silver circlet, and a staff with a small silver-wrapped green crystal; same fairy wings',
    },
}
# tấm còn thiếu của nhân vật ĐÃ có tranh bậc: dùng tranh bậc đó làm mẫu trang phục
FIX = {'jessica': ['sprite-dead-victory.png'], 'ignar': ['sprite-dead-victory.png'], 'zerith': ['sprite-hover.png'],
       'lyra': ['sprite-attack.png', 'sprite-dead-victory.png']}

BASE = ('Exactly ONE output image, size 1536x1024 (landscape 3:2): a 2D game sprite sheet, a neat grid of 4 columns x 2 rows = 8 equal cells, '
        'read left to right, top row then bottom row, ONE full-body frame per cell. Keep the art style (chibi anime, clean line art, soft shading) '
        'and every pose EXACTLY as described. Flat pure green #00FF00 background everywhere, no ground shadow, no magic effects, no text, no numbers, no grid lines.')


def on_green(path):
    im = Image.open(path).convert('RGBA')
    bg = Image.new('RGBA', im.size, (0, 255, 0, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def sheets(hero):
    sp = json.load(open(f'art/{hero}/sprite/sprite_spec.json', encoding='utf8'))
    return sorted({os.path.basename(s['file']) for s in sp['sheets'].values()})


def jobs():
    os.makedirs(REF, exist_ok=True)
    out = []
    for hero, tiers in OUTFIT.items():
        if hero in FIX:
            continue
        for sheet in sheets(hero):
            ref = f'{REF}/{hero}_{sheet}'
            if not os.path.exists(ref):
                on_green(f'art/{hero}/sprite/{sheet}').save(ref)
            for t, outfit in tiers.items():
                if os.path.exists(f'art/{hero}/sprite_{t}/{sheet}'):
                    continue
                out.append({'out': f'{RAW}/{hero}_{t}_{sheet}', 'image': ref, 'prompt':
                    f'The attached image is a sprite sheet of {hero.capitalize()} (4 columns x 2 rows, 8 frames). Redraw the WHOLE sheet keeping the same 8 cells, '
                    f'the same pose, position, size, body proportions, face and hair in every frame, and anything held in the same hand and position. '
                    f'ONLY change the clothing and gear to: {outfit}. ' + BASE})
    for hero, missing in FIX.items():
        for sheet in missing:
            for t in ('s', 'ss'):
                if os.path.exists(f'art/{hero}/sprite_{t}/{sheet}'):
                    continue
                ref = f'{REF}/{hero}_{t}_{sheet}'
                if not os.path.exists(ref):   # trên: tranh bậc (mẫu trang phục) · dưới: tấm động tác cần vẽ
                    top = on_green(f'art/{hero}/sprite_{t}/sprite-idle.png').resize((1536, 1024))
                    bot = on_green(f'art/{hero}/sprite/{sheet}').resize((1536, 1024))
                    c = Image.new('RGB', (1536, 2080), (255, 255, 255))
                    c.paste(top, (0, 0)); c.paste(bot, (0, 1056))
                    c.save(ref)
                out.append({'out': f'{RAW}/{hero}_{t}_{sheet}', 'image': ref, 'prompt':
                    'The attached image has TWO sprite sheets stacked vertically (white strip between them). TOP sheet = OUTFIT reference: the character wearing the '
                    'clothing, armor, weapon and colors you must use. BOTTOM sheet = POSE reference: 8 frames (4 columns x 2 rows). Create a NEW sprite sheet with '
                    'the 8 poses of the BOTTOM sheet exactly (same cell, same pose, position, size and facing in every frame — including lying down / falling / '
                    'celebrating / floating poses), but dressed EXACTLY like the TOP character. Do not copy the top sheet poses. ' + BASE})
    return out


def install():
    n = 0
    for f in sorted(os.listdir(RAW)):
        hero, t, sheet = f.split('_', 2)
        dst = f'art/{hero}/sprite_{t}/{sheet}'
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(f'{RAW}/{f}'):
            continue
        Image.open(f'{RAW}/{f}').convert('RGB').resize((1536, 1024), Image.LANCZOS).save(dst)
        n += 1
    print('chép', n, 'tấm')


if __name__ == '__main__':
    if sys.argv[1:] == ['install']:
        install()
    else:
        print(json.dumps(jobs(), ensure_ascii=False, indent=1))
