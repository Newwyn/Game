// ============================================================
// REGISTRY — classId -> cách vẽ nhân vật
// ============================================================
// Toàn bộ nhân vật vẽ theo kiểu 2D nhìn nghiêng, ghép mảnh + gắn xương bằng code (CutoutCharacterView).
//   - Sát Thủ: tranh thật (art/assassin2 -> tools/build_atlas.py -> cutout/assassin2Rig.js)
//   - Quái    : tạm vẽ bằng code (cutout/creatureRig.js) cho tới khi có tranh
//
// Tên hành động dùng chung (combat/events.js gọi view.playAction):
//   lặp theo trạng thái : idle, move (tự chọn chạy / lướt theo tốc độ), cast, dead
//   một lần             : attack, throw, vanish, appear, stealth, hurt, land, victory
// Mỗi hành động trỏ tới một clip + thời điểm trúng đòn (hitTime, giây).
import { CutoutCharacterView } from './CutoutCharacterView.js';
import { FrameSpriteView } from './FrameSpriteView.js';
import { IGNAR_SPRITE } from './sprite/ignarSprite.js';
import { ROK_SPRITE } from './sprite/rokSprite.js';
import { JESSICA_SPRITE } from './sprite/jessicaSprite.js';
import { NERISSA_SPRITE } from './sprite/nerissaSprite.js';
import { LYRA_SPRITE } from './sprite/lyraSprite.js';
import { SERAPHINE_SPRITE } from './sprite/seraphineSprite.js';
import { ZERITH_SPRITE } from './sprite/zerithSprite.js';
import { GRIX_SPRITE } from './sprite/grixSprite.js';
import { SYLVA_SPRITE } from './sprite/sylvaSprite.js';
import { WOLF_SPRITE, EAGLE_SPRITE, BEAR_SPRITE } from './sprite/sylvaPetSprites.js';
import { BRAKK_SPRITE } from './sprite/brakkSprite.js';
import { ELARION_SPRITE } from './sprite/elarionSprite.js';
import { GOLEM_SPRITE } from './sprite/golemSprite.js';
import { makeDivineShield } from '../vfx/rokFx.js';
import { makeStealthAura } from '../vfx/jessicaFx.js';
import { makeWindSpirit } from '../vfx/lyraFx.js';
import { makeSeraphGuardian } from '../vfx/seraphineFx.js';
import { PlaceholderCharacterView } from './PlaceholderCharacterView.js';
import { ASSASSIN2_RIG } from './cutout/assassin2Rig.js';
import {
    assassin2Clips, SKIN_KEYS as ASSASSIN2_SKINS, DEFAULT_SKINS as ASSASSIN2_DEFAULT_SKINS,
    SECONDARY as ASSASSIN2_SECONDARY, LOCOMOTION as ASSASSIN2_LOCOMOTION,
} from './cutout/assassin2Clips.js';
import { creatureVisual } from './cutout/creatureRig.js';
import { ROK2_RIG as ROK_RIG } from './cutout/rok2Rig.js'; // bản 2: bộ tranh vẽ riêng cho gắn xương
import {
    rokClips, SKIN_KEYS as ROK_SKINS, DEFAULT_SKINS as ROK_DEFAULT_SKINS,
    SECONDARY as ROK_SECONDARY, LOCOMOTION as ROK_LOCOMOTION,
} from './cutout/rokClips.js';
import { makeTalismanMesh } from '../vfx/vfx.js';
import { LYRA_RIG } from './cutout/lyraRig.js';
import { SERA_RIG } from './cutout/seraRig.js';
import { IGNAR_RIG, PALM_FIRE } from './cutout/ignarRig.js';
import {
    ignarClips, SKIN_KEYS as IGNAR_SKINS, DEFAULT_SKINS as IGNAR_DEFAULT_SKINS,
    SECONDARY as IGNAR_SECONDARY, LOCOMOTION as IGNAR_LOCOMOTION,
} from './cutout/ignarClips.js';
import {
    seraClips, SKIN_KEYS as SERA_SKINS, DEFAULT_SKINS as SERA_DEFAULT_SKINS,
    SECONDARY as SERA_SECONDARY, LOCOMOTION as SERA_LOCOMOTION,
} from './cutout/seraClips.js';
import { ZERITH_RIG } from './cutout/zerithRig.js';
import {
    zerithClips, SKIN_KEYS as ZERITH_SKINS, DEFAULT_SKINS as ZERITH_DEFAULT_SKINS,
    SECONDARY as ZERITH_SECONDARY, LOCOMOTION as ZERITH_LOCOMOTION,
} from './cutout/zerithClips.js';
import { BRAKK_RIG } from './cutout/brakkRig.js';
import {
    brakkClips, SKIN_KEYS as BRAKK_SKINS, DEFAULT_SKINS as BRAKK_DEFAULT_SKINS,
    SECONDARY as BRAKK_SECONDARY, LOCOMOTION as BRAKK_LOCOMOTION,
} from './cutout/brakkClips.js';
import { NERISSA_RIG } from './cutout/nerissaRig.js';
import {
    nerissaClips, SKIN_KEYS as NERISSA_SKINS, DEFAULT_SKINS as NERISSA_DEFAULT_SKINS,
    SECONDARY as NERISSA_SECONDARY, LOCOMOTION as NERISSA_LOCOMOTION,
} from './cutout/nerissaClips.js';
import { ELARION_RIG } from './cutout/elarionRig.js';
import {
    elarionClips, SKIN_KEYS as ELARION_SKINS, DEFAULT_SKINS as ELARION_DEFAULT_SKINS,
    SECONDARY as ELARION_SECONDARY, LOCOMOTION as ELARION_LOCOMOTION, FLOAT as ELARION_FLOAT,
} from './cutout/elarionClips.js';
import { GOLEM_RIG } from './cutout/golemRig.js';
import {
    golemClips, LOCOMOTION as GOLEM_LOCOMOTION,
} from './cutout/golemClips.js';
import {
    lyraClips, SKIN_KEYS as LYRA_SKINS, DEFAULT_SKINS as LYRA_DEFAULT_SKINS,
    SECONDARY as LYRA_SECONDARY, LOCOMOTION as LYRA_LOCOMOTION,
} from './cutout/lyraClips.js';

const ASSASSIN = {
    rig: ASSASSIN2_RIG,
    clips: assassin2Clips,
    height: 2.9,
    shadowSize: 1.4,
    skinKeys: ASSASSIN2_SKINS,
    defaultSkins: ASSASSIN2_DEFAULT_SKINS,
    secondary: ASSASSIN2_SECONDARY,
    locomotion: ASSASSIN2_LOCOMOTION,
    blink: true,
    // Kỹ năng 1 ném BÙA (không phải phi tiêu): lá bùa hiện trên tay xa lúc vung, rồi bay đi
    projectile: 'talisman',
    ghostTint: 0xc4a1ff,     // dư ảnh tím nhạt
    circleTint: 0xb07cff,    // vòng ấn chú tím
    stealthAura: true,       // tàng hình: hào quang sấm tím + mắt phát sáng
    props: [{ name: 'talisman', joint: 'handF', make: () => makeTalismanMesh(0.55), offset: [0.04, -0.3], z: 0.05 }],
    // Kiểu sprite (bản 3: nữ ninja sấm tím) — ?jessica=cutout về bản khung xương, ?jessicaIdle=A|B|C đổi cách đứng
    sprite: JESSICA_SPRITE,
    spriteParam: 'jessica',
    spriteIdleParam: 'jessicaIdle',
    // Tàng hình: hào quang sấm tím vẽ bằng tranh (art/jessica/fx2) thay bản code
    stealthFx: makeStealthAura,
    anims: {
        attack:  { clip: 'attack',  hitTime: 0.18 },
        throw:   { clip: 'throw',   hitTime: 0.42 },  // lộn mèo ra sau rồi quăng bùa giữa không trung
        throwStand: { clip: 'throwStand', hitTime: 0.2 },
        vanish:  { clip: 'vanish' },  // thụp người xuống (như lúc đáp đất) rồi biến mất
        appear:  { clip: 'appear',  hitTime: 0.18 },
        stealth: { clip: 'stealth', hitTime: 0.38 },
    },
};

// Rok (Thiết Hộ) — Chiến Binh khiên lớn
const ROK = {
    rig: ROK_RIG,
    clips: rokClips,
    height: 2.9,
    shadowSize: 1.6,
    skinKeys: ROK_SKINS,
    defaultSkins: ROK_DEFAULT_SKINS,
    secondary: ROK_SECONDARY,
    locomotion: ROK_LOCOMOTION,
    blink: true,
    circleTint: 0xffc94a,
    // Kiểu sprite (bản 3: hiệp sĩ châu Âu) — ?rok=cutout về bản khung xương, ?rokIdle=A|B|C đổi cách đứng
    sprite: ROK_SPRITE,
    spriteParam: 'rok',
    spriteIdleParam: 'rokIdle',
    // Dựng Khiên: Khiên Thần vẽ bằng tranh (art/rok/fx2) thay Thần Hộ Vệ + vòm lục giác
    guardFx: makeDivineShield,
    anims: {
        attack:   { clip: 'attack',   hitTime: 0.24 },
        taunt:    { clip: 'taunt',    hitTime: 0.42 },
        bash:     { clip: 'bash',     hitTime: 0.22 },
        fortress: { clip: 'fortress', hitTime: 0.12 },
        guardStart: { clip: 'guardStart', hitTime: 0.14 },
    },
};

// Lyra (Phong Tiễn) — Xạ Thủ. Tay xa cầm cung, tay gần kéo dây (dây cung + mũi tên vẽ bằng code: rig.bowString)
const ARCHER = {
    rig: LYRA_RIG,
    clips: lyraClips,
    height: 2.9,
    shadowSize: 1.4,
    skinKeys: LYRA_SKINS,
    defaultSkins: LYRA_DEFAULT_SKINS,
    secondary: LYRA_SECONDARY,
    locomotion: LYRA_LOCOMOTION,
    blink: true,
    ghostTint: 0x99f6e4,
    circleTint: 0x5eead4,
    // Kiểu sprite (bản 3: nữ xạ thủ tiên tộc của gió) — ?lyra=cutout về bản khung xương, ?lyraIdle=A|B|C đổi cách đứng
    sprite: LYRA_SPRITE,
    spriteParam: 'lyra',
    spriteIdleParam: 'lyraIdle',
    // Thần Phong: Vệ Thần Gió cánh chim ưng + vòng gió dưới chân vẽ bằng tranh (art/lyra/fx2) thay bản canvas
    windFx: makeWindSpirit,
    anims: {
        attack:   { clip: 'attack',   hitTime: 0.2 },   // kéo căng -> nhả tên
        snipe:    { clip: 'snipe',    hitTime: 0.42 },  // bật nhảy lộn, bắn giữa không trung
        windCall: { clip: 'windCall', hitTime: 0.38 },  // giơ cung gọi Vệ Thần Gió
        cast:     { clip: 'cast' },                     // gồng Thần Tiễn (lặp)
        release:  { clip: 'release',  hitTime: 0.16 },  // nhả Thần Tiễn
    },
};

// Seraphine (Thánh Quang) — Tu Sĩ. Tay xa cầm gậy phép, tay gần niệm phép / chắp tay cầu nguyện
const PRIEST = {
    rig: SERA_RIG,
    clips: seraClips,
    height: 2.9,
    shadowSize: 1.4,
    skinKeys: SERA_SKINS,
    defaultSkins: SERA_DEFAULT_SKINS,
    secondary: SERA_SECONDARY,
    locomotion: SERA_LOCOMOTION,
    blink: true,
    ghostTint: 0xfde68a,
    circleTint: 0xfacc15,
    // Kiểu sprite (bản 3: nữ tu sĩ ánh mặt trời) — ?seraphine=cutout về bản khung xương, ?seraphineIdle=A|B|C đổi cách đứng
    sprite: SERAPHINE_SPRITE,
    spriteParam: 'seraphine',
    spriteIdleParam: 'seraphineIdle',
    // Thánh Niệm: Hộ Vệ Thiên Sứ sáu cánh + vòng thánh vẽ bằng tranh (art/seraphine/fx2) thay Hộ vệ ánh sáng cũ
    prayFx: makeSeraphGuardian,
    anims: {
        attack: { clip: 'attack', hitTime: 0.22 },  // giơ gậy -> phóng cầu sáng
        heal:   { clip: 'heal',   hitTime: 0.3 },
        shield: { clip: 'shield', hitTime: 0.28 },
        raise:  { clip: 'raise',  hitTime: 0.45 },  // giơ gậy cao -> vào niệm
        pray:   { clip: 'pray' },                    // niệm (giữ lặp)
    },
};

// Ignar (Hỏa Ngục) — Phù Thủy lửa. Tay xa ngửa giữ quả cầu lửa (hiệu ứng), ném / chưởng lửa
const MAGE = {
    rig: IGNAR_RIG,
    clips: ignarClips,
    height: 2.9,
    shadowSize: 1.4,
    skinKeys: IGNAR_SKINS,
    defaultSkins: IGNAR_DEFAULT_SKINS,
    secondary: IGNAR_SECONDARY,
    locomotion: IGNAR_LOCOMOTION,
    blink: true,
    ghostTint: 0xff7a1a,
    circleTint: 0xff5a00,
    palmFire: { joint: 'handF', offset: [PALM_FIRE[0], PALM_FIRE[1] - 70] },
    // Bản thử SPRITE (tranh AI, mỗi khung 1 hình): mặc định bật. ?ignar=cutout -> về khung xương · ?ignarIdle=A|B|C -> cách đứng
    sprite: IGNAR_SPRITE,
    spriteParam: 'ignar',
    spriteIdleParam: 'ignarIdle',
    anims: {
        attack: { clip: 'attack', hitTime: 0.25 },  // ném cầu lửa
        summon: { clip: 'summon', hitTime: 0.35 },  // Thiên Hỏa Cầu
        bolt:   { clip: 'bolt',   hitTime: 0.25 },  // Cột Lửa
        charge: { clip: 'charge' },                  // gồng Hỏa Thần (giữ)
        palm:   { clip: 'palm',   hitTime: 0.2 },   // Hỏa Chưởng
        volley: { clip: 'volley', hitTime: 0.3 },   // nhảy chưởng toàn thể
    },
};

// Grix (Lục Độc) — Phù Thủy goblin độc dược. Tranh sprite do Codex vẽ; khung xương ẩn mượn của Ignar (cùng kiểu phù thủy đánh xa)
//   tên clip khung xương: attack = ném lọ · summon = Bình Độc Văng · bolt = Đầm Lầy · palm = Đại Bộc Phá · charge = gồng (khuấy gậy)
const ALCHEMIST = {
    rig: IGNAR_RIG,
    clips: ignarClips,
    height: 2.6,             // goblin nhỏ con, khom lưng
    shadowSize: 1.3,
    skinKeys: IGNAR_SKINS,
    defaultSkins: IGNAR_DEFAULT_SKINS,
    secondary: IGNAR_SECONDARY,
    locomotion: IGNAR_LOCOMOTION,
    blink: false,            // mắt vẽ sẵn trong tranh
    ghostTint: 0x84cc16,     // dư ảnh xanh lục độc
    circleTint: 0x65a30d,
    sprite: GRIX_SPRITE,
    spriteParam: 'grix',
    spriteIdleParam: 'grixIdle',
    anims: {
        attack:   { clip: 'attack', hitTime: 0.25 },   // ném lọ độc (khung 4)
        flask:    { clip: 'summon', hitTime: 0.35 },   // Bình Độc Văng (khung 5)
        bog:      { clip: 'bolt',   hitTime: 0.25 },   // Đầm Lầy Thối Rữa: cắm gậy (khung 4)
        detonate: { clip: 'palm',   hitTime: 0.2 },    // Đại Bộc Phá Độc: búng tay (khung 5)
        charge:   { clip: 'charge' },                   // gồng (giữ)
    },
};

// Zerith (U Minh) — Sát Thủ phép, lưỡi hái. Tay gần cầm liềm, tay xa thả lỏng / xoè phép / chỉ tay (Ấn Tử)
const REAPER = {
    rig: ZERITH_RIG,
    clips: zerithClips,
    height: 2.9,
    shadowSize: 1.4,
    skinKeys: ZERITH_SKINS,
    defaultSkins: ZERITH_DEFAULT_SKINS,
    secondary: ZERITH_SECONDARY,
    locomotion: ZERITH_LOCOMOTION,
    blink: true,
    ghostTint: 0xfb7185,     // dư ảnh đỏ hồng (bản 3: đỏ thẫm · đen khói · trắng xương — tím là màu của Jessica)
    circleTint: 0xe11d48,
    // Kiểu sprite (bản 3: thiếu niên quỷ tộc dẫn hồn) — ?zerith=cutout về bản khung xương, ?zerithIdle=A|B|C đổi cách đứng
    sprite: ZERITH_SPRITE,
    spriteParam: 'zerith',
    spriteIdleParam: 'zerithIdle',
    anims: {
        attack: { clip: 'attack', hitTime: 0.22 },   // vung liềm ra sau -> bổ xuống
        dash:   { clip: 'dash' },                     // lướt (giữ tư thế)
        charge: { clip: 'charge' },                   // gồng (giữ)
        reap:   { clip: 'reap',   hitTime: 0.15 },   // chém hất lên trời
        slam:   { clip: 'slam',   hitTime: 0.2 },    // bổ xuống (Đêm Tử Thần)
        summon: { clip: 'summon', hitTime: 0.2 },    // gọi Thần Chết
        mark:   { clip: 'mark',   hitTime: 0.15 },   // chỉ tay gắn Ấn Tử
    },
};

// Brakk (Cuồng Đấu) — Chiến Binh đô vật, tộc Dragon (bản 3: rồng Đất – dung nham). Thần Lực Khổng Lồ: view tự đổi sang dạng khổng lồ
const BRAKK = {
    rig: BRAKK_RIG,
    clips: brakkClips,
    height: 2.9,
    shadowSize: 1.7,
    skinKeys: BRAKK_SKINS,
    defaultSkins: BRAKK_DEFAULT_SKINS,
    secondary: BRAKK_SECONDARY,
    locomotion: BRAKK_LOCOMOTION,
    blink: true,
    ghostTint: 0xffa040,     // bản 3: cam dung nham (bỏ đỏ — đỏ là màu của Ignar, Zerith)
    circleTint: 0xf59e0b,
    // Kiểu sprite (bản 3: đô vật tộc Rồng Đất – dung nham) — ?brakk=cutout về bản khung xương, ?brakkIdle=A|B|C đổi cách đứng
    sprite: BRAKK_SPRITE,
    spriteParam: 'brakk',
    spriteIdleParam: 'brakkIdle',
    anims: {
        attack: { clip: 'attack', hitTime: 0.2 },    // đấm
        uplift: { clip: 'uplift', hitTime: 0.2 },    // móc ngược hất tung (Khổng Lồ)
        grab:   { clip: 'grab',   hitTime: 0.85 },   // túm -> nhảy vọt -> quật (Bá Vương Quật)
        charge: { clip: 'charge' },                  // niệm Chấn Địa (giữ)
        stomp:  { clip: 'stomp',  hitTime: 0.6 },    // bật cao -> dậm đất
        roar:   { clip: 'roar',   hitTime: 0.3 },    // hoá khổng lồ (cả Độc Long)
        taunt:  { clip: 'taunt',  hitTime: 0.3 },    // Tiếng Hét Bảo Hộ: đấm ngực -> vẫy tay khiêu khích
    },
};

// Nerissa (Thủy Vũ) — Tu Sĩ nước, vũ công dải lụa, tộc Elf. Khi múa: view chạy clip 'dance' + tổ hợp điệu (1, 12, 123...)
const DANCER = {
    rig: NERISSA_RIG,
    clips: nerissaClips,
    // 2,65 (thấp hơn mọi người 2,9): tóc xoăn bồng tới gối + 2 dải lụa dài + đầu to -> cùng chiều cao trông TO hơn cả đội
    height: 2.65,
    shadowSize: 1.3,
    skinKeys: NERISSA_SKINS,
    defaultSkins: NERISSA_DEFAULT_SKINS,
    secondary: NERISSA_SECONDARY,
    locomotion: NERISSA_LOCOMOTION,
    blink: true,
    ghostTint: 0x5eead4,
    circleTint: 0x38bdf8,
    // Kiểu sprite (bản 3: vũ công nước chibi) — ?nerissa=cutout về bản khung xương, ?nerissaIdle=A|B|C đổi cách đứng
    sprite: NERISSA_SPRITE,
    spriteParam: 'nerissa',
    spriteIdleParam: 'nerissaIdle',
    anims: {
        attack: { clip: 'attack', hitTime: 0.24 },   // vung lụa bắn giọt nước
        spin:   { clip: 'spin',   hitTime: 0.3 },    // xoay người vào điệu múa
        cast:   { clip: 'cast',   hitTime: 0.3 },
    },
};

// Elarion (Tam Nguyên) — Pháp Sư Nguyên Tố tộc Elf. Sách Nguyên Tố lơ lửng trước người (mở ra khi đọc / tung phép)
const ELEMENTALIST = {
    rig: ELARION_RIG,
    clips: elarionClips,
    height: 2.9,
    shadowSize: 1.4,
    skinKeys: ELARION_SKINS,
    defaultSkins: ELARION_DEFAULT_SKINS,
    secondary: ELARION_SECONDARY,
    locomotion: ELARION_LOCOMOTION,
    floatParts: ELARION_FLOAT,
    blink: true,
    ghostTint: 0xc4b5fd,
    circleTint: 0xa78bfa,
    // Kiểu sprite (bản 3: hiền giả tinh linh tóc bạch kim) — ?elarion=cutout về bản khung xương, ?elarionIdle=A|B|C đổi cách đứng
    sprite: ELARION_SPRITE,
    spriteParam: 'elarion',
    spriteIdleParam: 'elarionIdle',
    anims: {
        attack: { clip: 'attack', hitTime: 0.22 },   // đẩy chưởng -> tia nguyên tố
        book:   { clip: 'book',   hitTime: 0.2 },    // đọc Sách Nguyên Tố
        spell:  { clip: 'spell',  hitTime: 0.38 },   // tung phép
        storm:  { clip: 'storm',  hitTime: 0.3 },    // Bão Nguyên Tố
        cast:   { clip: 'cast' },
    },
};

// Golem Nguyên Tố — triệu hồi của Elarion: NGUYÊN TRANH (1 hình liền), cử động cả thân; nắm đấm lửa / sét, hơi băng là hiệu ứng phủ lên
const ELEM_GOLEM = {
    rig: GOLEM_RIG,
    clips: golemClips,
    height: 4.7,
    shadowSize: 3.6,
    locomotion: GOLEM_LOCOMOTION,
    circleTint: 0xb784ff,
    // Kiểu sprite (bản 3: 3 tấm động tác, giữ tạo hình) — ?golem=cutout về bản 1 tranh liền cử động cả thân
    sprite: GOLEM_SPRITE,
    spriteParam: 'golem',
    spriteIdleParam: 'golemIdle',
    anims: {
        attack:  { clip: 'attack',  hitTime: 0.3 },   // chồm tới nện
        charge:  { clip: 'charge' },                  // gồng (rung, giữ)
        dash:    { clip: 'dash' },                    // lao đấm
        inhale:  { clip: 'inhale' },                  // hít khí lạnh (giữ)
        breath:  { clip: 'breath' },                  // phun bão tuyết (giữ)
        aura:    { clip: 'aura',    hitTime: 0.4 },   // ngửa đón sét -> nện xuống
        summon:  { clip: 'summon' },
    },
};

// Sylva (Lâm Linh) — Triệu Hồi Sư, tiên nữ rừng. Tranh sprite do Codex vẽ; khung xương ẩn mượn của Ignar (như Grix)
//   tên clip khung xương: attack = chĩa gậy · summon = Gọi Sói & Đại Bàng · bolt = Gấu Hộ Vệ · palm = Thần Hươu · charge = niệm
const SUMMONER = {
    rig: IGNAR_RIG,
    clips: ignarClips,
    height: 2.75,
    shadowSize: 1.4,
    skinKeys: IGNAR_SKINS,
    defaultSkins: IGNAR_DEFAULT_SKINS,
    secondary: IGNAR_SECONDARY,
    locomotion: IGNAR_LOCOMOTION,
    blink: false,            // mắt vẽ sẵn trong tranh
    ghostTint: 0x86efac,     // dư ảnh xanh lá non
    circleTint: 0x22c55e,
    sprite: SYLVA_SPRITE,
    spriteParam: 'sylva',
    spriteIdleParam: 'sylvaIdle',
    anims: {
        attack: { clip: 'attack', hitTime: 0.25 },   // chĩa gậy phóng gai lá (khung 4)
        call:   { clip: 'summon', hitTime: 0.35 },   // Gọi Sói & Đại Bàng (khung 5)
        bear:   { clip: 'bolt',   hitTime: 0.25 },   // Gấu Hộ Vệ: cắm gậy (khung 4)
        deer:   { clip: 'palm',   hitTime: 0.2 },    // Thần Hươu: giơ gậy (khung 5)
        charge: { clip: 'charge' },
    },
};

// Thú triệu hồi của Sylva — tranh sprite do Codex vẽ; khung xương ẩn mượn của Golem (src/characters/sprite/sylvaPetSprites.js)
const PET_ANIMS = {
    attack: { clip: 'attack', hitTime: 0.3 },
    howl:   { clip: 'aura',   hitTime: 0.4 },    // Sói tru
    pounce: { clip: 'summon' },                  // Sói vồ
    cast:   { clip: 'charge' },                  // Đại Bàng niệm 1s (giữ)
    release: { clip: 'aura', hitTime: 0.05 },    // Đại Bàng vỗ cánh phóng Cầu Gió / Bão Lông Vũ
    ram:    { clip: 'dash' },                    // Gấu ủi (giữ)
    turn:   { clip: 'summon' },                  // Gấu phanh + quay đầu giữa 2 lượt ủi
};
const SYLVA_WOLF = { rig: GOLEM_RIG, clips: golemClips, height: 1.75, shadowSize: 1.5, locomotion: GOLEM_LOCOMOTION, circleTint: 0x22c55e,
    sprite: WOLF_SPRITE, spriteParam: 'sylvaPet', anims: PET_ANIMS };
const SYLVA_EAGLE = { rig: GOLEM_RIG, clips: golemClips, height: 1.7, shadowSize: 1.0, locomotion: GOLEM_LOCOMOTION, circleTint: 0xeab308,
    sprite: EAGLE_SPRITE, spriteParam: 'sylvaPet', anims: PET_ANIMS };
const SYLVA_BEAR = { rig: GOLEM_RIG, clips: golemClips, height: 2.55, shadowSize: 2.2, locomotion: GOLEM_LOCOMOTION, circleTint: 0x84cc16,
    sprite: BEAR_SPRITE, spriteParam: 'sylvaPet', anims: PET_ANIMS };
/** classId -> hàm tạo dữ liệu hiển thị (member để lấy màu cho quái) */
export const CHARACTER_VISUALS = {
    assassin: () => ASSASSIN,
    warrior: () => ROK,
    archer: () => ARCHER,
    priest: () => PRIEST,
    mage: () => MAGE,
    reaper: () => REAPER,
    wrestler: () => BRAKK,
    dancer: () => DANCER,
    elementalist: () => ELEMENTALIST,
    elem_golem: () => ELEM_GOLEM,
    alchemist: () => ALCHEMIST,
    summoner: () => SUMMONER,
    sylva_wolf: () => SYLVA_WOLF,
    sylva_eagle: () => SYLVA_EAGLE,
    sylva_bear: () => SYLVA_BEAR,
    monster_tank: (m) => creatureVisual('monster_tank', m.color),
    monster_archer: (m) => creatureVisual('monster_archer', m.color),
    monster_supporter: (m) => creatureVisual('monster_supporter', m.color),
    monster_dummy: (m) => creatureVisual('monster_dummy', m.color),
};

/** Nhân vật có bản sprite: bật trừ khi URL có ?<spriteParam>=cutout (VD ?ignar=cutout) */
function useSprite(visual) {
    if (!visual.sprite) return false;
    try { return new URLSearchParams(location.search).get(visual.spriteParam) !== 'cutout'; } catch { return true; }
}

export function createCharacterView(member, classDef, isMyTeam) {
    const make = CHARACTER_VISUALS[member.classId];
    if (make) {
        const visual = make(member);
        return useSprite(visual) ? new FrameSpriteView(member, classDef, isMyTeam, visual) : new CutoutCharacterView(member, classDef, isMyTeam, visual);
    }
    return new PlaceholderCharacterView(member, classDef, isMyTeam);
}
