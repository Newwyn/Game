// ============================================================
// BRAKK (bản 3: đô vật tộc Rồng Đất – dung nham) kiểu SPRITE — mỗi khung là 1 hình vẽ trọn thân
// (tranh AI của người dùng, chỉ tách nền + căn chân)
// Atlas: tools/sprite_pack.py art/brakk/sprite/sprite_spec.json -> src/assets/sprites/brakk_sprite.webp + brakkSprite.json
// Cách chạy khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// Thần Lực Khổng Lồ (10s): bảng `giant` đổi sang tranh khổng lồ (thủ thế · chạy · đấm · móc ngược); động tác khác lúc
//   khổng lồ dùng tranh thường + ánh dung nham (`giantTint`); view phóng to cả người ×1.25 như bản khung xương
// Rơi vào trận: khung nhảy vọt (grabAir1) lúc rơi -> khung gồng 1 (ngồi thụp, nắm tay chống đất) lúc đáp -> thủ thế
// Bản khung xương cũ: ?brakk=cutout · cách đứng: ?brakkIdle=A|B|C
// ============================================================
import imageUrl from '../../assets/sprites/brakk_sprite.webp';
import meta from './brakkSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const BRAKK_SPRITE = {
    image: imageUrl,
    meta,
    // Đứng thả lỏng (ngoài trận): A = 4 khung thở · B = 2 khung chậm · C = 1 khung + thở bằng code (không nhấp nháy)
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra đòn (registry BRAKK.anims): đấm 0,2s · Bá Vương Quật quật 0,85s · Chấn Địa dậm 0,6s · gầm 0,3s · khiêu khích 0,3s · móc ngược 0,2s
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                   // thủ thế: 2 nắm đấm thủ trước ngực
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                  // đấm thẳng: khung 4 = nắm đấm trúng
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4), dur: 0.8 },
        // Bá Vương Quật: vồ -> nhấc qua đầu -> nhảy vọt (code nhấc lên 5,2) -> quật đúng 0,85s; `at` = giây bắt đầu từng khung
        //   (khớp nhịp events.js: túm 0,12s · bật nhảy 0,26s · đỉnh nhảy ~0,65s · chạm đất 0,85s)
        grab:    { mode: 'strike', frames: ['grab1', 'grab2', 'grab3', 'grab4', 'grabAir1', 'grabAir2', 'grabLand1', 'grabLand2'], release: 7,
                   at: [0, 0.06, 0.16, 0.24, 0.3, 0.6, 0.85, 1.05], noLift: true },
        charge:  { mode: 'hold', intro: ['charge1', 'charge2'], introTime: 0.2, frames: ['charge3', 'charge4'], fps: 3 },   // gồng (giữ)
        // Chấn Địa: khuỵu 0,1s -> bật cao (code nhấc lên 4,8) -> dậm đúng 0,6s -> đứng dậy
        stomp:   { mode: 'strike', frames: ['stomp1', 'stompAir1', 'stompLand1', 'stompLand2'], release: 3, at: [0, 0.1, 0.6, 0.85], noLift: true },
        roar:    { mode: 'strike', frames: r('roar', 4), release: 3 },                    // gầm (hoá Khổng Lồ, Độc Long): khung 3
        taunt:   { mode: 'strike', frames: r('taunt', 4), release: 3 },                   // Tiếng Hét Bảo Hộ: đấm ngực -> vẫy khiêu khích, khung 3
        uplift:  { mode: 'strike', frames: r('gUpper', 4), release: 3 },                  // móc ngược (chỉ có lúc Khổng Lồ)
        fall:    { mode: 'clip', frames: ['grabAir1'] },
        land:    { mode: 'clip', frames: ['charge1', 'charge2', 'ready1'] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
        // dạng Khổng Lồ (tranh riêng)
        gReady:  { mode: 'still', frames: ['gReady1'] },
        gMove:   { mode: 'clip', frames: r('gMove', 4), noLift: true },
        gPunch:  { mode: 'strike', frames: r('gPunch', 4), release: 3 },                  // đấm khổng lồ: khung 3 = 0,2s
        gUpper:  { mode: 'strike', frames: r('gUpper', 4), release: 3 },                  // móc ngược: khung 3 = 0,2s
    },
    // đang Khổng Lồ: clip khung xương -> clip tranh khổng lồ (mốc ra đòn vẫn theo clip khung xương gốc)
    giant: { ready: 'gReady', move: 'gMove', attack: 'gPunch', uplift: 'gUpper' },
    giantIdle: { frames: ['gReady1'], breath: true },
    giantTint: 0xffc89a,     // tranh thường lúc Khổng Lồ (trúng đòn, túm quật, dậm...): ám cam dung nham
    lean: [],
};
