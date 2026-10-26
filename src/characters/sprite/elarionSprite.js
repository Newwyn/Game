// ============================================================
// ELARION (bản 3: hiền giả tinh linh tóc bạch kim) kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân
// (tranh AI của người dùng, chỉ cắt + căn chân + chỉnh cỡ)
// Atlas: tools/sprite_pack.py art/elarion/sprite/sprite_spec.json -> src/assets/sprites/elarion_sprite.webp + elarionSprite.json
// Cách chạy khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// Điểm gắn: handN (lòng bàn tay: tia nguyên tố, Lôi Xích, chưởng thứ 2 Tốc Lôi) · palms (giữa 2 bàn tay: Băng Hoại Hỏa Thiên)
//   · book (giữa Sách: ánh vàng lúc đọc Sách). stickyPts: khung đang hiện không đánh dấu -> lấy điểm của khung gần nhất có đánh dấu
//   (events.js jointPoint) thay cho khớp của khung xương ẩn (dáng bản 2 khác hẳn tranh mới)
// Rơi vào trận: khung rơi (fall1) -> quỳ chống tay (land1) -> đứng dậy -> thủ thế
// Bản khung xương cũ: ?elarion=cutout · cách đứng: ?elarionIdle=A|B|C
// ============================================================
import imageUrl from '../../assets/sprites/elarion_sprite.webp';
import meta from './elarionSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const ELARION_SPRITE = {
    image: imageUrl,
    meta,
    stickyPts: true,
    // Đứng thả lỏng (ngoài trận): A = 4 khung thở · B = 2 khung chậm · C = 1 khung + thở bằng code (không nhấp nháy)
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra đòn (registry ELEMENTALIST.anims): đẩy chưởng 0,22s · đọc Sách 0,2s · tung phép 0,38s · gọi bão 0,3s
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                   // thủ thế: tay trước giơ ra, Sách mở bên tay
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                  // đẩy chưởng: khung 4 = tay duỗi thẳng
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4), dur: 0.8 },
        book:    { mode: 'strike', frames: r('book', 4), release: 3 },                    // đọc Sách: khung 3 = Sách mở trước mặt
        storm:   { mode: 'strike', frames: r('storm', 4), release: 3 },                   // gọi Bão Nguyên Tố: khung 3 = dang tay lên trời
        channel: { mode: 'loop', frames: ['storm3', 'storm4'], fps: 1.6 },                // đứng thi triển Mưa Giông (lặp)
        spell:   { mode: 'strike', frames: r('spell', 8), release: 5 },                   // tung phép (mọi phép trừ Băng Hoại Hỏa Thiên): khung 5
        // Băng Hoại Hỏa Thiên: khum tay dồn lực 0,7s (giữ khung 3–4 rung) -> chưởng giữ tia (lặp, giật lùi nhẹ)
        beamCharge: { mode: 'hold', intro: ['beamCharge1', 'beamCharge2'], introTime: 0.3, frames: ['beamCharge3', 'beamCharge4'], fps: 8 },
        beam:    { mode: 'loop', frames: r('beam', 4), fps: 9 },
        cast:    { mode: 'hold', intro: ['cast1', 'cast2'], introTime: 0.3, frames: ['cast3', 'cast4'], fps: 2 },   // niệm (Hơi Nước Bỏng 2s)
        fall:    { mode: 'clip', frames: ['fall1'] },
        land:    { mode: 'clip', frames: ['land1', 'land2', 'land3'] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
    },
    lean: [],
};
