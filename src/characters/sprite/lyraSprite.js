// ============================================================
// LYRA (bản 3: nữ xạ thủ tiên tộc của gió, chủ đề chim ưng) kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân
// (tranh AI của người dùng, chỉ tách nền + căn chân)
// Atlas: tools/sprite_pack.py art/lyra/sprite/sprite_spec.json -> src/assets/sprites/lyra_sprite.webp + lyraSprite.json
// Cách chạy khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// Điểm 'bow' (chỗ mũi tên rời cung) đánh dấu ở khung nhả: attack5, snipeB5, hoverShot3 -> events.js bowPoint()
// Bay (Thần Phong Giáng Thế, 8s): FrameSpriteView đổi clip theo bảng `hover` khi nhân vật đang lơ lửng.
// Bản khung xương cũ: ?lyra=cutout · cách đứng: ?lyraIdle=A|B|C
// ============================================================
import imageUrl from '../../assets/sprites/lyra_sprite.webp';
import meta from './lyraSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const LYRA_SPRITE = {
    image: imageUrl,
    meta,
    // Đứng thả lỏng (ngoài trận): A = 4 khung thở · B = 2 khung chậm · C = 1 khung + thở bằng code (không nhấp nháy)
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra đòn (registry ARCHER.anims): nhả tên 0,2s · Tiễn Gió Chớp 0,42s · gọi gió 0,38s · nhả Thần Tiễn 0,16s
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                   // thủ thế: tên đặt sẵn trên dây
        attack:  { mode: 'strike', frames: r('attack', 8), release: 5 },                  // kéo cung -> khung 5 nhả tên -> rút tên mới
        // nhảy lùi bắn giữa không trung (đường nhảy do leapTo 0,62s): khung 6 nhả tên
        snipe:   { mode: 'strike', frames: ['snipeA1', ...r('snipeB', 6), 'snipeC1'], release: 6, noLift: true },
        windCall: { mode: 'strike', frames: r('call', 4), release: 3, noLift: true },    // giơ cung gọi gió: khung 3 = Vệ Thần hiện
        cast:    { mode: 'hold', intro: ['charge1', 'charge2'], introTime: 0.25, frames: ['charge3', 'charge4'], fps: 3 },   // gồng Thần Tiễn 2s
        release: { mode: 'strike', frames: r('release', 4), release: 2 },                 // nhả Thần Tiễn: khung 2 dây bật
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4), dur: 0.8 },
        fall:    { mode: 'clip', frames: ['fall1'] },
        land:    { mode: 'clip', frames: ['land1', 'land2', 'landEnd1'] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
        // bay lơ lửng (Thần Phong): lặp nhấp nhô · bắn khi bay (khung 3 nhả tên, cùng mốc 0,2s của đánh thường)
        hover:   { mode: 'loop', frames: r('hover', 4), fps: 5, noLift: true },
        hoverShot: { mode: 'strike', frames: r('hoverShot', 4), release: 3, noLift: true },
    },
    // đang bay: clip khung xương -> clip tranh bay (mốc ra đòn vẫn theo clip khung xương gốc)
    hover: { idle: 'hover', ready: 'hover', move: 'hover', attack: 'hoverShot' },
    lean: [],
};
