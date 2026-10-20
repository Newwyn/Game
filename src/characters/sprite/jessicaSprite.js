// ============================================================
// JESSICA (bản 3: nữ ninja sấm tím) kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân (tranh AI của người dùng, chỉ tách nền + căn chân)
// Atlas: tools/sprite_pack.py art/jessica/sprite/sprite_spec.json -> src/assets/sprites/jessica_sprite.webp + jessicaSprite.json
// Cách chạy khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// Bản khung xương cũ: ?jessica=cutout · cách đứng: ?jessicaIdle=A|B|C
// ============================================================
import imageUrl from '../../assets/sprites/jessica_sprite.webp';
import meta from './jessicaSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const JESSICA_SPRITE = {
    image: imageUrl,
    meta,
    // Đứng thả lỏng (ngoài trận): A = 4 khung thở · B = 2 khung chậm · C = 1 khung + thở bằng code (không nhấp nháy)
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra đòn (registry ASSASSIN.anims): chém 0,18s · Phóng Bùa lộn 0,42s · phóng đứng 0,2s · hiện ra chém 0,18s · Tàng Hình 0,38s
    // noSpin: tranh đã vẽ sẵn vòng lộn -> bỏ xoay lộn của khung xương (leapTo flip) · noLift: không nhún theo hông
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                   // thủ thế trong trận (thấp người, dao trước ngực)
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                  // chém dao: khung 4 = trúng
        throw:   { mode: 'strike', frames: r('throw', 8), release: 6, noSpin: true, noLift: true },   // lộn mèo ra sau, khung 6 = quăng bùa
        throwStand: { mode: 'strike', frames: r('throwStand', 4), release: 3 },          // phóng bùa đứng: khung 3 = quăng
        vanish:  { mode: 'clip', frames: r('vanish', 4) },                                // Đột Kích: thụp người kết ấn -> biến mất
        dashStrike: { mode: 'loop', frames: r('dash', 4), fps: 14, noLift: true },        // lướt chém (dư ảnh)
        dash:    { mode: 'loop', frames: r('dash', 4), fps: 14, noLift: true },
        appear:  { mode: 'strike', frames: r('appear', 4), release: 3 },                  // hiện ra sau lưng: khung 3 = chém hất lên
        stealth: { mode: 'strike', frames: r('stealth', 4), release: 3 },                 // Tàng Hình: kết ấn, khung 3 = mở mắt (khói sấm bùng)
        cast:    { mode: 'hold', intro: ['stealth1', 'stealth2'], introTime: 0.2, frames: ['stealth3', 'stealth4'], fps: 3 },
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4), dur: 0.8 },   // khung xương Jessica không có clip choáng -> tranh tự chạy
        fall:    { mode: 'clip', frames: ['land1'] },
        land:    { mode: 'clip', frames: ['land2', 'land3', 'land4'] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
    },
    lean: [],
};
