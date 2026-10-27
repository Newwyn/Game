// ============================================================
// GRIX (Lục Độc — goblin giả kim độc dược) kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân
// (tranh AI do Codex vẽ theo art/grix/sprite/PROMPTS_SPRITE.md, chỉ tách nền + căn chân)
// Atlas: tools/sprite_pack.py art/grix/sprite/sprite_spec.json -> src/assets/sprites/grix_sprite.webp + grixSprite.json
// Khung xương ẩn: mượn của Ignar (IGNAR_RIG + ignarClips) — tên clip tranh = tên clip khung xương:
//   attack = ném lọ (đánh thường) · summon = Bình Độc Văng · bolt = Đầm Lầy Thối Rữa · palm = Đại Bộc Phá Độc · charge = gồng
// Cách chạy khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// ============================================================
import imageUrl from '../../assets/sprites/grix_sprite.webp';
import meta from './grixSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const GRIX_SPRITE = {
    image: imageUrl,
    meta,
    // chiều cao tính tới đỉnh TÓC (đầu gậy + bình cầu cao ngang tóc): đỉnh hình khung đứng ≈ đỉnh tóc
    topScale: 1,
    // Đứng thả lỏng: A = 4 khung lắc lọ · B = 2 khung chậm · C = 1 khung + thở bằng code (không nhấp nháy)
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra đòn (registry ALCHEMIST.anims): ném lọ 0,25s · ném bình 0,35s · cắm gậy 0,25s · búng tay 0,2s
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                  // khom người, gậy chĩa trước
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                 // ném lọ: khung 4 = buông tay
        summon:  { mode: 'strike', frames: r('flask', 8), release: 5 },                  // Bình Độc Văng: khung 5 = ném bình
        bolt:    { mode: 'strike', frames: r('bog', 8), release: 4 },                    // Đầm Lầy: khung 4 = gậy cắm đất
        palm:    { mode: 'strike', frames: r('detonate', 8), release: 5 },               // Đại Bộc Phá: khung 5 = búng tay
        charge:  { mode: 'hold', intro: ['cast1', 'cast2'], introTime: 0.24, frames: ['cast3', 'cast4'], fps: 6 },   // khuấy gậy (giữ)
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4), dur: 0.8 },
        fall:    { mode: 'clip', frames: ['land1'] },
        land:    { mode: 'clip', frames: ['land2', 'land3', 'land4'] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
    },
    // chưa có tấm riêng -> khung đứng + nghiêng / nhún theo khung xương ẩn
    lean: ['guard', 'cast', 'channel'],
};
