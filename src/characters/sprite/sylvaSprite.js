// ============================================================
// SYLVA (Lâm Linh — tiên nữ rừng, Triệu Hồi Sư) kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân
// (tranh AI do Codex vẽ theo art/sylva/sprite/PROMPTS_SPRITE.md, chỉ tách nền + căn chân)
// Atlas: tools/sprite_pack.py art/sylva/sprite/sprite_spec.json -> src/assets/sprites/sylva_sprite.webp + sylvaSprite.json
// Khung xương ẩn: mượn của Ignar (IGNAR_RIG + ignarClips) như Grix — tên clip tranh = tên clip khung xương:
//   attack = chĩa gậy (đánh thường) · summon = Gọi Sói & Đại Bàng · bolt = Gấu Hộ Vệ (cắm gậy) · palm = Thần Hươu · charge = niệm
// Cách chạy khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// ============================================================
import imageUrl from '../../assets/sprites/sylva_sprite.webp';
import meta from './sylvaSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const SYLVA_SPRITE = {
    image: imageUrl,
    meta,
    topScale: 1,
    // Đứng thả lỏng: A = 4 khung · B = 2 khung chậm · C = 1 khung + thở bằng code (không nhấp nháy)
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra đòn (registry SUMMONER.anims): chĩa gậy 0,25s · gọi Sói & Đại Bàng 0,35s · cắm gậy gọi Gấu 0,25s · Thần Hươu 0,2s
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                  // khung 4 = gậy chĩa thẳng
        summon:  { mode: 'strike', frames: r('call', 8), release: 5 },                    // khung 5 = vung gậy xuống gọi thú
        bolt:    { mode: 'strike', frames: r('bear', 8), release: 4 },                    // khung 4 = cắm gậy xuống đất
        palm:    { mode: 'strike', frames: r('deer', 8), release: 5 },                    // khung 5 = giơ gậy cao, dang cánh
        charge:  { mode: 'hold', intro: ['cast1', 'cast2'], introTime: 0.24, frames: ['cast3', 'cast4'], fps: 4 },
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4), dur: 0.8 },
        fall:    { mode: 'clip', frames: ['land1'] },
        land:    { mode: 'clip', frames: ['land2', 'land3', 'land4'] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
    },
    lean: ['guard', 'cast', 'channel'],
};
