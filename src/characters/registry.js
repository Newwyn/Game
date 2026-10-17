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
    anims: {
        attack: { clip: 'attack', hitTime: 0.25 },  // ném cầu lửa
        summon: { clip: 'summon', hitTime: 0.35 },  // Thiên Hỏa Cầu
        bolt:   { clip: 'bolt',   hitTime: 0.25 },  // Cột Lửa
        charge: { clip: 'charge' },                  // gồng Hỏa Thần (giữ)
        palm:   { clip: 'palm',   hitTime: 0.2 },   // Hỏa Chưởng
        volley: { clip: 'volley', hitTime: 0.3 },   // nhảy chưởng toàn thể
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
    ghostTint: 0xc084fc,     // dư ảnh tím
    circleTint: 0xa855f7,
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

// Brakk (Cuồng Đấu) — Chiến Binh đô vật, tộc Dragon. Thần Lực Khổng Lồ: view tự đổi cả bộ mảnh sang dạng khổng lồ
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
    ghostTint: 0xff7a1a,
    circleTint: 0xff5a1a,
    anims: {
        attack: { clip: 'attack', hitTime: 0.2 },    // đấm
        uplift: { clip: 'uplift', hitTime: 0.2 },    // móc ngược hất tung (Khổng Lồ)
        grab:   { clip: 'grab',   hitTime: 0.85 },   // túm -> nhảy vọt -> quật (Bá Vương Quật)
        charge: { clip: 'charge' },                  // niệm Chấn Địa (giữ)
        stomp:  { clip: 'stomp',  hitTime: 0.6 },    // bật cao -> dậm đất
        roar:   { clip: 'roar',   hitTime: 0.3 },    // hoá khổng lồ
    },
};

// Nerissa (Thủy Vũ) — Tu Sĩ nước, vũ công dải lụa, tộc Elf. Khi múa: view chạy clip 'dance' + tổ hợp điệu (1, 12, 123...)
const DANCER = {
    rig: NERISSA_RIG,
    clips: nerissaClips,
    height: 2.9,
    shadowSize: 1.3,
    skinKeys: NERISSA_SKINS,
    defaultSkins: NERISSA_DEFAULT_SKINS,
    secondary: NERISSA_SECONDARY,
    locomotion: NERISSA_LOCOMOTION,
    blink: true,
    ghostTint: 0x5eead4,
    circleTint: 0x38bdf8,
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
    monster_tank: (m) => creatureVisual('monster_tank', m.color),
    monster_archer: (m) => creatureVisual('monster_archer', m.color),
    monster_supporter: (m) => creatureVisual('monster_supporter', m.color),
    monster_dummy: (m) => creatureVisual('monster_dummy', m.color),
};

export function createCharacterView(member, classDef, isMyTeam) {
    const make = CHARACTER_VISUALS[member.classId];
    if (make) return new CutoutCharacterView(member, classDef, isMyTeam, make(member));
    return new PlaceholderCharacterView(member, classDef, isMyTeam);
}
