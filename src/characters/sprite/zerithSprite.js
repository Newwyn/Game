// ============================================================
// ZERITH (bản 3: thiếu niên quỷ tộc dẫn hồn của U Minh giới) kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân
// (tranh AI của người dùng, chỉ tách nền + căn chân)
// Atlas: tools/sprite_pack.py art/zerith/sprite/sprite_spec.json -> src/assets/sprites/zerith_sprite.webp + zerithSprite.json
// Cách chạy khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// Đêm Tử Thần (10s, bay lơ lửng): bảng `hover` đổi sang tranh bay (bay chờ lặp · chém khi bay)
// Rơi vào trận: khung bay 1 lúc rơi -> khung gồng 1 (ngồi thụp) lúc đáp -> thủ thế (không có tấm riêng)
// Bản khung xương cũ: ?zerith=cutout · cách đứng: ?zerithIdle=A|B|C
// ============================================================
import imageUrl from '../../assets/sprites/zerith_sprite.webp';
import meta from './zerithSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const ZERITH_SPRITE = {
    image: imageUrl,
    meta,
    // chiều cao nhân vật tính tới đỉnh TÓC (lưỡi hái dựng cao hơn tóc ~14%): đỉnh hình khung đứng × 0,87
    topScale: 0.87,
    // Đứng thả lỏng (ngoài trận): A = 4 khung thở · B = 2 khung chậm · C = 1 khung + thở bằng code (không nhấp nháy)
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra đòn (registry REAPER.anims): bổ liềm 0,22s · quét hất 0,15s · bổ xuống 0,2s · gọi Thần Chết 0,2s · gắn Ấn Tử 0,15s
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                   // thủ thế: 2 tay cầm liềm chéo trước người
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                  // bổ liềm: khung 4 = lưỡi chạm
        dash:    { mode: 'loop', frames: r('dash', 4), fps: 14, noLift: true },           // Lưỡi Hái Xuyên Hồn: lướt (lặp, dư ảnh)
        mark:    { mode: 'strike', frames: r('mark', 4), release: 3 },                    // chỉ tay gắn Ấn Tử: khung 3
        reap:    { mode: 'strike', frames: r('reap', 4), release: 3, noLift: true },      // quét hất lên: khung 3
        slam:    { mode: 'strike', frames: r('slam', 4), release: 3, noLift: true },      // bổ xuống (khung 2 bật nhảy vẽ sẵn): khung 3
        charge:  { mode: 'hold', intro: ['charge1', 'charge2'], introTime: 0.2, frames: ['charge3', 'charge4'], fps: 3 },   // gồng (giữ)
        summon:  { mode: 'strike', frames: r('summon', 4), release: 3, noLift: true },    // gọi Thần Chết: khung 3 · khung 4 bắt đầu bay
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4), dur: 0.8 },
        fall:    { mode: 'clip', frames: ['hover1'] },
        land:    { mode: 'clip', frames: ['charge1', 'charge2', 'ready1'] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
        // bay lơ lửng (Đêm Tử Thần): lặp nhấp nhô · chém khi bay (khung 3, cùng mốc 0,22s của đánh thường)
        hover:   { mode: 'loop', frames: r('hover', 4), fps: 5, noLift: true },
        hoverAtk: { mode: 'strike', frames: r('hoverAtk', 4), release: 3, noLift: true },
    },
    // đang bay: clip khung xương -> clip tranh bay (mốc ra đòn vẫn theo clip khung xương gốc)
    hover: { idle: 'hover', ready: 'hover', move: 'hover', hurt: 'hover', attack: 'hoverAtk' },
    lean: [],
};
