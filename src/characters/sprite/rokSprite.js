// ============================================================
// ROK (bản 3: hiệp sĩ châu Âu) kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân (tranh AI của người dùng, chỉ tách nền + căn chân)
// Atlas: tools/sprite_pack.py art/rok/sprite/sprite_spec.json -> src/assets/sprites/rok_sprite.webp + rokSprite.json
// Cách chạy khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// Bản khung xương cũ: ?rok=cutout · cách đứng: ?rokIdle=A|B|C
// ============================================================
import imageUrl from '../../assets/sprites/rok_sprite.webp';
import meta from './rokSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const ROK_SPRITE = {
    image: imageUrl,
    meta,
    // Đứng thả lỏng (ngoài trận): A = 4 khung thở · B = 2 khung chậm · C = 1 khung + thở bằng code (không nhấp nháy)
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra đòn (registry ROK.anims): đánh thường 0,24s · Sư Tử Gầm 0,42s · Đẩy Khiên 0,22s · Dựng Khiên 0,14s
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                   // thủ thế trong trận (khiên trước ngực)
        cast:    { mode: 'still', frames: ['ready1'] },
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                  // bổ kiếm: khung 4 = chém trúng
        taunt:   { mode: 'strike', frames: r('taunt', 8), release: 4 },                   // gầm: khung 4 = tiếng gầm
        bash:    { mode: 'strike', frames: r('bash', 8), release: 3 },                    // húc khiên: khung 3 = chạm
        guardStart: { mode: 'strike', frames: ['guard1', 'guard2', 'guard3'], release: 2 }, // giơ khiên -> cắm khiên (Khiên Thần hiện)
        guard:   { mode: 'loop', frames: ['guard3', 'guard4'], fps: 2.5 },                // giữ thế thủ sau khiên
        fortress: { mode: 'strike', frames: ['guard1', 'guard2', 'guard3', 'guard4'], release: 2 },
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4) },
        fall:    { mode: 'clip', frames: ['land1'] },
        land:    { mode: 'clip', frames: ['land2', 'land3', 'land4'] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
    },
    lean: [],
};
