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
import { ROK_RIG } from './cutout/rokRig.js';
import {
    rokClips, SKIN_KEYS as ROK_SKINS, DEFAULT_SKINS as ROK_DEFAULT_SKINS,
    SECONDARY as ROK_SECONDARY, LOCOMOTION as ROK_LOCOMOTION,
} from './cutout/rokClips.js';
import { makeTalismanMesh } from '../vfx/vfx.js';

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

/** classId -> hàm tạo dữ liệu hiển thị (member để lấy màu cho quái) */
export const CHARACTER_VISUALS = {
    assassin: () => ASSASSIN,
    warrior: () => ROK,
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
