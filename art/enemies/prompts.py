# ============================================================
# Câu lệnh Flow cho bộ hình động đầy đủ của quái (chuẩn giống nhân vật: art/HUONG_DAN_VE_NHAN_VAT.md)
#   python art/enemies/prompts.py <art> <tấm>   -> in câu lệnh
#   Tấm đầu (idle): đính kèm art/enemies/<art>/ref.png (quai-<art>.png trên Flow) + mẫu phong cách (mau-phong-cach-idle.png)
#   Các tấm sau: mở tấm idle vừa tạo trong Flow, gõ câu lệnh vào ô "Bạn muốn thay đổi điều gì?" (Flow tự đính kèm tấm idle + ảnh mẫu)
# Tấm chuẩn của 1 quái: idle (đứng 4 · thủ thế 4), attack (8), move (8), hurt-stun (trúng đòn 4 · choáng 4), dead-victory (gục 4 · thắng 4)
#   trùm thêm 1 tấm cho mỗi kỹ năng (SKILLS bên dưới)
# ============================================================
import sys

# mô tả ngắn để Flow giữ đúng nhân vật · weapon = thứ cầm trên tay · attack = 8 khung đánh thường (khung 4 = khung ra đòn)
M = {
    'goblin': dict(desc='a goblin bandit: green skin, long pointed ears, red bandana, ragged brown leather armor and belts, wrist wraps, one curved dagger', pron='he',
        attack='1 ready crouch, 2 pulls the dagger back over his shoulder (wind-up), 3 springs forward low, 4 KEY FRAME: big lunging slash, arm fully extended forward, dagger at the far right, 5 follow-through, dagger swept down, body leaning forward, 6 small step forward, 7 pulls back, 8 back to ready crouch',
        move='a sneaky fast scurrying run, hunched forward, dagger held low behind him'),
    'trapper': dict(desc='a goblin bomber: green skin, long pointed ears, brass aviator goggles on his forehead, a big brown satchel full of round black bombs, holds one black bomb', pron='he',
        attack='1 ready, holding a bomb, 2 reaches back with the bomb (wind-up), 3 leans back further, 4 KEY FRAME: throws, arm fully extended forward-up, the bomb just leaving his hand, 5 follow-through, empty hand forward, 6 reaches into the satchel, 7 pulls out a new bomb, 8 back to ready holding the bomb',
        move='a waddling run, one hand holding the satchel against his hip, the other holding a bomb'),
    'soldier': dict(desc='a Valoria soldier: dark steel kettle helmet hiding the face, black plate armor, red tabard, round black shield on the left arm, steel longsword', pron='he',
        attack='1 guard stance behind the shield, 2 raises the sword high over his head, 3 steps forward, 4 KEY FRAME: heavy downward-forward sword chop, sword extended forward, 5 follow-through, sword low, 6 recovers, raising the shield, 7 steps back, 8 back to guard stance',
        move='a disciplined marching run, shield held in front, sword at his side'),
    'spy': dict(desc='a masked spy: green hooded cloak, black face mask over nose and mouth, pointed elf-like ears, leather gear, a small crossbow', pron='he',
        attack='1 crouched aiming the crossbow, 2 raises the crossbow to the eye, 3 steadies, 4 KEY FRAME: shoots, crossbow string snapped forward, slight recoil, 5 recoil pushes the arms back, 6 lowers the crossbow, 7 reloads a bolt, 8 back to crouched aiming',
        move='a low silent sprint, cloak flowing behind, crossbow held in both hands'),
    'fire': dict(desc='a fire warrior: short brown hair, dark red armor with glowing orange cracks, a long sword whose blade is wrapped in fire (draw the flaming blade as part of the weapon)', pron='he',
        attack='1 ready stance, flaming sword low, 2 swings the sword back and up behind him, 3 steps in, 4 KEY FRAME: wide horizontal slash, flaming blade swept fully forward, 5 follow-through, blade past his body, 6 turns back, 7 lifts the sword, 8 back to ready',
        move='a heavy determined run, flaming sword held low behind him'),
    'wolf': dict(desc='a grey forest wolf (the wolf design in the attached image), lean, shaggy grey fur, yellow eyes, sharp fangs, four legs', pron='it',
        attack='1 low growl crouch, 2 pulls back on its hind legs, 3 leaps forward, 4 KEY FRAME: mid-air bite, jaws wide open at the far right, front paws reaching out, 5 lands biting, head shaking, 6 tugs back, 7 lets go, 8 back to low growl',
        move='a fast four-legged gallop loop'),
    'wolfboss': dict(desc='the wolf pack leader (the wolf design in the attached image but much bigger and darker): dark charcoal fur with a red tint, glowing red eyes, scars, a magic collar with glowing runes', pron='it',
        attack='1 low growl crouch, 2 rears back, 3 lunges, 4 KEY FRAME: huge bite with jaws wide open at the far right, 5 claw swipe follow-through, 6 tugs back, 7 shakes its head, 8 back to low growl',
        move='a powerful four-legged gallop loop'),
    'skarn': dict(desc='Skarn, a huge brutish orc-like warlord: horned iron helmet, thick brown fur cloak, bare muscular arms, iron jaw plate, a heavy double-bladed battle axe', pron='he',
        attack='1 ready, axe held in both hands, 2 lifts the axe high over his head, 3 leans back, 4 KEY FRAME: smashes the axe down-forward, blades at the far right near the ground, 5 the axe bites the ground, 6 pulls it up, 7 rests it on his shoulder, 8 back to ready',
        move='a heavy stomping run, axe on his shoulder'),
    'morwen': dict(desc='Morwen the Black Knight: full dark steel plate armor with a closed visor helmet, long purple cape, a slim black longsword', pron='she',
        attack='1 fencing guard, 2 draws the sword back, 3 fast step forward, 4 KEY FRAME: deep thrust, sword fully extended at the far right, 5 turns the thrust into a rising slash, 6 spins back, cape swirling, 7 resets the sword, 8 back to fencing guard',
        move='a swift graceful run, cape flowing, sword held back'),
    'valdric': dict(desc='General Valdric: older man with short brown hair, ornate dark red plate armor with gold trim and a glowing red emblem on the chest, long red cape, a huge broad greatsword', pron='he',
        attack='1 ready, greatsword held low in front, 2 lifts the greatsword over his right shoulder, 3 steps forward, 4 KEY FRAME: huge diagonal downward slash, greatsword fully extended forward, 5 follow-through, sword low on the left, cape swinging, 6 turns back, 7 lifts the sword, 8 back to ready',
        move='a commanding heavy run, cape flowing, greatsword held low'),
    'warden': dict(desc='the Tomb Warden: an undead skeleton warrior with a glowing blue skull, rusted bronze armor, a ragged blue cloak, a long halberd', pron='it',
        attack='1 ready, halberd held diagonally, 2 pulls the halberd back, 3 steps in, 4 KEY FRAME: long sweeping halberd strike, blade at the far right, 5 follow-through, halberd low, 6 pulls back, 7 straightens, 8 back to ready',
        move='a stiff lurching undead march, halberd held upright'),
    'c2scout': dict(desc='an elf border scout: green hood, braided light brown hair, pointed ears, green and brown leather ranger outfit, a wooden longbow and a quiver', pron='she',
        attack='1 ready with bow, 2 draws an arrow from the quiver, 3 nocks and draws the bow, 4 KEY FRAME: releases the shot, bowstring snapped forward, arms extended, 5 follow-through, 6 lowers the bow, 7 reaches for the next arrow, 8 back to ready',
        move='a light quick run, bow in the left hand'),
    'c2treant': dict(desc='a small rotten treant: dark purple-brown bark body, stump head with glowing purple eyes, twig branches on top, long clawed root arms and root legs', pron='it',
        attack='1 ready, arms spread, 2 raises a clawed root arm high, 3 leans in, 4 KEY FRAME: claw swipe, root arm extended at the far right, 5 follow-through, 6 the other arm swings, 7 recovers, 8 back to ready',
        move='a creaking shuffling walk on root legs'),
    'c2wisp': dict(desc='a purple will-o-wisp ghost: swirling purple flame body, two glowing white eyes, wispy tail, no legs, floats', pron='it',
        attack='1 floating, 2 swells bigger, 3 pulls back, 4 KEY FRAME: lunges forward with a wispy arm stretched out to the far right, 5 recoils, 6 shrinks, 7 floats back, 8 back to floating',
        move='a fast floating glide forward, tail streaming behind'),
    'c2spiritwolf': dict(desc='a spirit wolf: translucent icy blue-white wolf with glowing spectral flame tail and mane, four legs', pron='it',
        attack='1 low growl crouch, 2 pulls back, 3 leaps, 4 KEY FRAME: mid-air bite, jaws open at the far right, 5 lands, 6 tugs back, 7 shakes, 8 back to crouch',
        move='a fast ghostly gallop loop, spectral tail streaming'),
    'c2shroom': dict(desc='a grumpy mushroom monster: big red cap with white spots, beige stubby body with small arms and legs, angry face', pron='it',
        attack='1 ready, fists up, 2 winds up a punch, 3 hops forward, 4 KEY FRAME: punches forward, small arm fully extended to the far right, 5 cap bounces, 6 hops back, 7 shakes the cap, 8 back to ready',
        move='a bouncy hopping run'),
    'c2guard': dict(desc='a Moonlight elf guard: silver winged helmet, green and silver elven plate armor, a long glaive spear', pron='he',
        attack='1 guard stance, glaive forward, 2 pulls the glaive back, 3 steps in, 4 KEY FRAME: long thrust, glaive blade at the far right, 5 turns it into a sweep, 6 spins the glaive, 7 resets, 8 back to guard stance',
        move='a disciplined run, glaive held diagonally'),
    'c2cultist': dict(desc='a Varkos sun cultist: white and gold hooded robe, golden sun mask, swinging a golden censer on a chain', pron='he',
        attack='1 ready, censer hanging, 2 swings the censer back, 3 swings it around, 4 KEY FRAME: hurls the censer forward on its chain to the far right, 5 the chain pulls back, 6 catches the swing, 7 censer hangs again, 8 back to ready',
        move='a gliding robed walk-run, censer swinging'),
    'hollow': dict(desc='the Old Hollow Treant: a huge mossy ancient tree giant, thick bark body, glowing green heart in a hollow chest, long branch arms with claws', pron='it',
        attack='1 ready, branch arms raised, 2 lifts both arms high, 3 leans forward, 4 KEY FRAME: slams a huge branch arm forward-down to the far right, 5 the arm hits the ground, 6 drags it back, 7 straightens, 8 back to ready',
        move='a slow heavy lumbering walk'),
    'vexa': dict(desc='Vexa the shadow huntress: dark-elf, grey-purple skin, long white hair, dark purple leather armor, a black recurve bow', pron='she',
        attack='1 ready with bow, 2 draws an arrow, 3 draws the bow fully, 4 KEY FRAME: releases, bowstring forward, 5 follow-through, 6 lowers the bow, 7 reaches for the next arrow, 8 back to ready',
        move='a fast agile run, bow in hand'),
    'thalor': dict(desc='Thalor the archmage: elf with long silver hair, a dark blue star-patterned robe, a tall staff with a glowing crescent moon on top', pron='he',
        attack='1 ready, staff upright, 2 raises the staff, 3 swings the staff back, 4 KEY FRAME: thrusts the staff forward, crescent pointed at the far right, 5 follow-through, 6 pulls the staff back, 7 plants it, 8 back to ready',
        move='a quick robed run, staff held upright'),
    'malkor': dict(desc='Malkor the high priest: blond hair with a golden halo, white and gold armored robes, large white angel wings, a golden holy spear', pron='he',
        attack='1 ready, spear upright, wings half open, 2 pulls the spear back, wings spread, 3 steps in, 4 KEY FRAME: holy spear thrust, spear at the far right, wings fully spread, 5 follow-through, 6 pulls back, 7 wings fold, 8 back to ready',
        move='a gliding run with wings slightly open'),
}
# kỹ năng hiện có của trùm (server.js BOSS_SKILLS) -> 1 tấm động tác mỗi kỹ năng (khung 4-5 = lúc chiêu bung ra)
SKILLS = {
    'wolfboss': [('howl', 'HOWL to summon the pack: sits back and howls at the sky, head raised high, mouth open (frames 3-6 the loud howl)'),
                 ('pounce', 'POUNCE: crouches, leaps high and far forward, lands pinning the prey with its front paws and biting (frame 5 the landing bite)')],
    'skarn': [('slam', 'GROUND SLAM: lifts the axe with both hands high over his head, jumps a little, smashes the axe into the ground (frame 5 impact), stays bent over the axe'),
              ('cry', 'WAR CRY: plants the axe, beats his chest, throws his head back and roars with fists raised (frames 4-6 roaring)')],
    'morwen': [('dash', 'SHADOW DASH SLASH: crouches low, dashes far forward in a low line, a huge horizontal slash at the end (frame 5 the slash), cape flowing behind'),
               ('shield', 'DARK SHIELD: plants the sword in the ground, both hands on the pommel, head bowed, channeling power (frames 3-8 holding the pose with tiny changes)')],
    'valdric': [('pillars', 'FIRE PILLARS: raises the greatsword straight up to the sky with both hands, then stabs it into the ground in front of him (frame 5 the stab), kneeling on one knee'),
                ('ring', 'EMBLEM FIRE RING: spreads his arms wide, the chest emblem flares, then he raises the greatsword overhead and spins once (frames 4-6 the spin)'),
                ('judgment', 'HOLY JUDGMENT LEAP: crouches deep, jumps high into the air with the greatsword raised overhead with both hands (frames 2-4 rising, 5 at the top), then falls and slams the sword down into the ground (frame 7 the slam), frame 8 kneeling after the impact')],
    'warden': [('curse', 'CURSE: raises one bony hand forward with fingers spread, the other hand holds the halberd, the skull tilts (frames 4-6 casting pose)'),
               ('drain', 'SOUL DRAIN: holds the halberd up high horizontally, leans back, the skull opens its jaw wide (frames 4-7 draining pose)')],
    'hollow': [('slam', 'ROOT SLAM: raises both branch arms and slams them into the ground (frame 5 impact), body bent forward'),
               ('howl', 'CALL SAPLINGS: spreads both branch arms wide and leans back, the hollow heart glows brighter (frames 4-7 holding the pose)')],
    'vexa': [('dash', 'SHADOW ARROW: kneels, draws the bow fully with a long pull, shoots a powerful shot (frame 5 release), recoil slides her back'),
             ('pillars', 'ARROW RAIN: aims the bow straight up at the sky, shoots three times quickly (frames 3, 5, 7 releases)')],
    'thalor': [('pillars', 'MOONLIGHT PILLARS: raises the staff high with both hands, then slams its butt on the ground (frame 5), robe flaring'),
               ('shield', 'MOON BARRIER: holds the staff in front of him horizontally with both hands, eyes closed, channeling (frames 3-8 holding the pose)')],
    'malkor': [('curse', 'JUDGMENT: points the holy spear forward at the enemy, the other hand raised, wings spread (frames 4-6 pointing)'),
               ('ring', 'HOLY RING: rises slightly with wings fully spread, spear held overhead with both hands, then slams it down (frame 6 slam)')],
}

# Cách làm đã thử (10/11): đính kèm 2 ảnh -> 1 = quai-<art>.png (thiết kế quái), 2 = tấm động tác MẪU của nhân vật (mau-dong-tac-*.png:
#   chỉ lấy bố cục lưới, cỡ khung, độ lớn động tác). Sửa từ tấm idle ("Bạn muốn thay đổi điều gì?") thì Flow chép gần y nguyên -> KHÔNG dùng.
RANGED = {'spy': 'mau-ban-cung-attack', 'c2scout': 'mau-ban-cung-attack', 'vexa': 'mau-ban-cung-attack',
          'c2wisp': 'mau-phep-attack', 'c2cultist': 'mau-phep-attack', 'thalor': 'mau-phep-attack', 'c2shroom': 'mau-dong-tac-attack'}


def motion_ref(art, sheet):
    if sheet == 'idle':
        return 'mau-phong-cach-idle'
    if sheet == 'attack':
        return RANGED.get(art, 'mau-dong-tac-attack')
    if sheet == 'move':
        return 'mau-dong-tac-run'
    if sheet in ('hurt-stun', 'dead-victory'):
        return 'mau-dong-tac-' + sheet
    return 'mau-dong-tac-attack'


def head(art, what):
    m = M[art]
    return (f'Sprite sheet for a 2D game: the {what} of the {"creature" if m["pron"] == "it" else "character"} from the FIRST attached image '
            f'({m["desc"]}) - exactly the same face, outfit, weapon, colors and drawing style. The SECOND attached image is ONLY a reference for the '
            'canvas layout (4x2 grid), the frame size, chibi proportions and HOW MUCH the body moves between frames - do NOT copy its character, '
            'outfit or weapon. Landscape canvas, a neat grid of 4 columns x 2 rows = 8 equal cells, read left to right, top row then bottom row, '
            'ONE full-body frame per cell, three-quarter side view facing RIGHT, feet near the bottom of each cell, nothing cropped, nothing touching '
            'the cell borders. Big, clearly different poses: ')


TAIL = ' NO effects, no slash trails, no speed lines, no shadow, NO TEXT, no labels, no grid lines. Flat pure green #00FF00 background.'


def prompt(art, sheet):
    m = M[art]
    if sheet == 'idle':
        return (head(art, 'IDLE and READY animations') + 'TOP ROW: idle standing breathing loop, 4 frames, relaxed stance, tiny differences. '
                'BOTTOM ROW: battle-ready stance loop, 4 frames, lower and tenser, weapon raised forward, tiny bounce.' + TAIL)
    if sheet == 'attack':
        return head(art, 'BASIC ATTACK animation') + m['attack'] + '.' + TAIL
    if sheet == 'move':
        return head(art, 'RUN cycle') + f'8 frames of a smooth looping {m["move"]}, the last frame flows back into the first.' + TAIL
    if sheet == 'hurt-stun':
        return head(art, 'HIT and STUNNED animations') + ('TOP ROW: HIT REACTION, 4 frames: 1 flinches backwards, 2 recoils further, body bent, eyes squeezed shut, '
                '3 staggers, 4 recovers to stance. BOTTOM ROW: STUNNED dizzy loop, 4 frames, wobbling on the spot, head drooping and swaying, weapon lowered, dazed eyes.') + TAIL
    if sheet == 'dead-victory':
        return head(art, 'DEATH and VICTORY animations') + ('TOP ROW: DEATH, 4 frames: 1 hit hard, staggering back, 2 knees buckle, 3 falls over, '
                '4 lying flat on the ground, defeated, eyes closed. BOTTOM ROW: VICTORY, 4 frames: a triumphant cheer, raising the weapon high, a mocking laugh, then a proud pose.') + TAIL
    for sid, text in SKILLS.get(art, []):
        if sheet == f'skill-{sid}':
            return head(art, 'SKILL animation') + text + '.' + TAIL
    raise SystemExit(f'không có tấm {sheet} cho {art}')


def sheets(art):
    return ['idle', 'attack', 'move', 'hurt-stun', 'dead-victory'] + [f'skill-{s}' for s, _ in SKILLS.get(art, [])]


if __name__ == '__main__':
    if len(sys.argv) == 2:
        print(' '.join(sheets(sys.argv[1])))
    else:
        print(motion_ref(sys.argv[1], sys.argv[2]))
        print(prompt(sys.argv[1], sys.argv[2]))
