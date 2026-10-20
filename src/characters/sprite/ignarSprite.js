// ============================================================
// IGNAR kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân (tranh AI của người dùng, chỉ tách nền + căn chân)
// Atlas: tools/sprite_pack.py art/ignar/sprite/sprite_spec.json -> src/assets/sprites/ignar_sprite.webp + ignarSprite.json
// ============================================================
import imageUrl from '../../assets/sprites/ignar_sprite.webp';
import meta from './ignarSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const IGNAR_SPRITE = {
    image: imageUrl,
    meta,
    // Đứng / thủ thế: 3 cách (chọn bằng ?ignarIdle=A|B|C, mặc định C)
    //   A: đủ 8 khung (AI vẽ lại tóc / mắt / hoạ tiết mỗi khung -> nhấp nháy)
    //   B: 3 khung giống nhau nhất, chạy chậm
    //   C: 1 khung + thở bằng code (co giãn rất nhẹ) -> không nhấp nháy
    idle: {
        A: { frames: r('idle', 8), fps: 8 },
        B: { frames: ['idle1', 'idle4', 'idle6', 'idle4'], fps: 5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Khung theo clip của khung xương (chạy ẩn). mode:
    //   strike : khung 1..release-1 trải tới hitTime, khung "release" ĐÚNG hitTime, phần còn lại trải tới hết clip
    //   clip   : trải đều theo thời gian clip (clip lặp thì lặp theo)
    //   hold   : intro (introTime giây) rồi lặp frames theo fps (động tác giữ: gồng)
    //   once   : chạy theo fps rồi giữ khung cuối · loop : lặp theo fps
    // fire: khung (đếm từ 1) ngửa tay giữ lửa · gather: khung nắm lửa · còn lại lửa ẩn, điểm cầu lửa = bàn tay xa
    // noLift: không nhún theo hông khung xương (khung đã vẽ sẵn độ nhún) · drawnDeath: gục vẽ sẵn (bỏ xoay ngã của khung xương)
    clips: {
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4, fire: [1, 8], gather: [2, 3] },   // ném cầu lửa (0,25s)
        summon:  { mode: 'strike', frames: r('summon', 8), release: 5, fire: [1, 8] },                   // Thiên Hỏa Cầu (0,35s)
        bolt:    { mode: 'strike', frames: r('bolt', 8), release: 4, fire: [1, 8] },                     // Cột Lửa (0,25s)
        palm:    { mode: 'strike', frames: r('palm', 8), release: 3, fire: [1, 8] },                     // Hỏa Chưởng (0,2s)
        volley:  { mode: 'strike', frames: r('volley', 8), release: 4, fire: [1, 8] },                   // chưởng toàn thể (0,3s)
        move:    { mode: 'clip', frames: r('move', 8), fire: 'all', noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4), fire: [1, 4] },
        stunned: { mode: 'clip', frames: r('stun', 4), fire: [] },
        charge:  { mode: 'hold', intro: ['charge1', 'charge2'], introTime: 0.24, frames: ['charge3', 'charge4'], fps: 8, fire: [] },
        fall:    { mode: 'clip', frames: ['land1'], fire: [] },
        land:    { mode: 'clip', frames: ['land2', 'land3', 'land4'], fire: [3] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, fire: [], drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'], fire: [] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5, fire: [] },
    },
    // Chưa có tấm riêng -> dùng khung đứng + nghiêng / nhún theo khung xương ẩn
    lean: ['guard', 'cast', 'channel'],
    // Lửa trên tay (px theo cỡ tấm attack; code nhân atlasScale)
    fire: { palmOffset: [-8, -30], gatherOffset: [0, 6] },
};
