// ============================================================
// SERAPHINE (bản 3: nữ tu sĩ ánh mặt trời) kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân
// (tranh AI của người dùng, PNG trong suốt — chỉ bỏ quầng mờ + căn chân)
// Atlas: tools/sprite_pack.py art/seraphine/sprite/sprite_spec.json -> src/assets/sprites/seraphine_sprite.webp + seraphineSprite.json
// Cách chạy khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// Điểm 'staff' (pha lê giữa vòng mặt trời đầu gậy) ở khung ra phép: attack4, heal3, shield3 -> events.js staffPoint()
// Thánh Niệm (10s, bay lơ lửng): bảng `hover` đổi sang tranh niệm lơ lửng (chắp tay niệm lặp · ra phép khi hồi máu / khiên)
// Bản khung xương cũ: ?seraphine=cutout · cách đứng: ?seraphineIdle=A|B|C
// ============================================================
import imageUrl from '../../assets/sprites/seraphine_sprite.webp';
import meta from './seraphineSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const SERAPHINE_SPRITE = {
    image: imageUrl,
    meta,
    // chiều cao nhân vật tính tới đỉnh TÓC (đầu gậy vòng mặt trời cao hơn tóc ~11%): đỉnh hình khung đứng × 0,89
    topScale: 0.89,
    // Đứng thả lỏng (ngoài trận): A = 4 khung thở · B = 2 khung chậm · C = 1 khung + thở bằng code (không nhấp nháy)
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle2'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra phép (registry PRIEST.anims): cầu sáng 0,22s · hồi máu 0,3s · khiên 0,28s · giơ gậy vào niệm 0,45s
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                   // thủ thế: gậy chĩa chéo, tay gần mở sẵn
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                  // chĩa gậy: khung 4 = cầu ánh sáng bay ra
        heal:    { mode: 'strike', frames: r('heal', 4), release: 3 },                    // giơ gậy lên trời: khung 3 = tia nắng rọi
        shield:  { mode: 'strike', frames: r('shield', 4), release: 3 },                  // đẩy tay dựng khiên: khung 3
        raise:   { mode: 'strike', frames: ['raise1', 'raise2', 'raise3', 'raiseUp1'], release: 3, noLift: true },   // giơ gậy -> bay lên niệm
        pray:    { mode: 'loop', frames: r('pray', 4), fps: 3, noLift: true },            // niệm lơ lửng (lặp)
        prayCast: { mode: 'strike', frames: r('prayCast', 4), release: 3, noLift: true }, // đang niệm mà hồi máu / khiên
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4), dur: 0.8 },
        fall:    { mode: 'clip', frames: ['fall1'] },
        land:    { mode: 'clip', frames: ['land1', 'landEnd1', 'landEnd2'] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
    },
    // đang bay niệm: clip khung xương -> clip tranh (mốc ra phép vẫn theo clip khung xương gốc)
    hover: { idle: 'pray', ready: 'pray', move: 'pray', hurt: 'pray', heal: 'prayCast', shield: 'prayCast' },
    lean: [],
};
