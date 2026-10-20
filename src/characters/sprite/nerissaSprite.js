// ============================================================
// NERISSA (bản 3: vũ công nước chibi) kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân (tranh AI của người dùng, chỉ tách nền + căn chân)
// Atlas: tools/sprite_pack.py art/nerissa/sprite/sprite_spec.json -> src/assets/sprites/nerissa_sprite.webp + nerissaSprite.json
// Cách chạy khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// Dải lụa đã vẽ trong tranh -> dải lụa lò xo của bản khung xương ẩn theo (FrameSpriteView ẩn mọi mảnh khung xương).
// Bản khung xương cũ: ?nerissa=cutout · cách đứng: ?nerissaIdle=A|B|C
// ============================================================
import imageUrl from '../../assets/sprites/nerissa_sprite.webp';
import meta from './nerissaSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);
// điệu múa: 8 khung lặp theo đúng nhịp clip khung xương (cutout/nerissaClips.js)
const dance = (pre, dur) => ({ mode: 'clip', frames: r(pre, 8), dur, noLift: true });

export const NERISSA_SPRITE = {
    image: imageUrl,
    meta,
    // Đứng thả lỏng (ngoài trận): A = 4 khung thở · B = 2 khung chậm · C = 1 khung + thở bằng code (không nhấp nháy)
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra đòn (registry DANCER.anims): quất lụa 0,24s (khung 4: đầu dải lụa vươn xa nhất — giọt nước bay ra từ đây)
    // · xoay vào điệu 0,3s (khung 3: dang tay, lụa bung vòng tròn — vòng sóng nước bung)
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                   // thủ thế: dang 2 tay giữ lụa
        cast:    { mode: 'still', frames: ['ready1'] },
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                  // quất lụa: khung 4 = giọt nước bay ra
        spin:    { mode: 'strike', frames: r('spin', 4), release: 3, noLift: true },      // xoay vào điệu múa (mọi điệu)
        dance1:   dance('dance1', 1.6),     // Vũ Khúc Sóng Triều
        dance2:   dance('dance2', 2.4),     // Lưu Thủy Hồi Xuân
        dance3:   dance('dance3', 2.0),     // Thủy Thần Vũ
        dance12:  dance('dance12', 1.4),    // 1 + 2: vòng lụa bảo hộ
        dance13:  dance('dance13', 1.3),    // 1 + 3: nhịp nhanh
        dance23:  dance('dance23', 1.8),    // 2 + 3: kéo thủy triều
        dance123: dance('dance123', 1.5),   // cả 3 điệu: đại vũ (khung 5 bật xoạc chân giữa không trung)
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
