// ============================================================
// GOLEM NGUYÊN TỐ (bản 3, giữ tạo hình 05-golem-v2) kiểu SPRITE — triệu hồi của Elarion (phép 🔥❄️⚡, 20s)
// (tranh AI của người dùng, chỉ cắt + căn chân + chỉnh cỡ)
// Atlas: tools/sprite_pack.py art/elarion/sprite/golem_sprite_spec.json -> src/assets/sprites/golem_sprite.webp + golemSprite.json
// Cách chạy khung: xem src/characters/sprite/ignarSprite.js. Golem không có khung đứng riêng: khung đi 1 (walk1) = thủ thế / đứng
//   (heightFrames: chiều cao 4,7 tính theo walk1, tới đỉnh pha lê).
// Điểm gắn (events.js): handN = nắm đấm dung nham (lửa quanh tay lúc gồng Nộ Lửa) · handF = nắm đấm phía trước (vệt đấm lửa khi
//   lao, sét giật lúc Hào Quang Sét) · mouth (hít khí lạnh, phun bão tuyết) · core (ngọc ngực: sét trời giáng). stickyPts như Elarion.
// Nộ Lửa: gồng (charge1–2 rung) -> lao: lấy đà (dash1–2) -> vung (punch2) -> nắm đấm lửa duỗi thẳng suốt đường lao (punch3)
// Hào Quang Sét: niệm 1s giơ 2 nắm đấm lên trời (cast = aura1) -> nện xuống đúng 0,4s (aura2)
// Triệu hồi: cuộn tròn như tảng đá (form1) -> đứng dậy gầm dang tay (roar1) -> thủ thế · gục / tan: vỡ dần -> đống đá
// Bản khung xương cũ (1 tranh liền cử động cả thân): ?golem=cutout
// ============================================================
import imageUrl from '../../assets/sprites/golem_sprite.webp';
import meta from './golemSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const GOLEM_SPRITE = {
    image: imageUrl,
    meta,
    stickyPts: true,
    heightFrames: ['walk1'],
    idle: {
        A: { frames: ['walk1'], breath: true },
        C: { frames: ['walk1'], breath: true },
    },
    defaultIdle: 'C',
    // Mốc ra đòn (registry ELEM_GOLEM.anims): đấm 0,3s · Hào Quang Sét nện 0,4s
    clips: {
        ready:   { mode: 'still', frames: ['walk1'] },
        move:    { mode: 'clip', frames: r('walk', 4), noLift: true },                   // đi nặng nề (lặp)
        attack:  { mode: 'strike', frames: r('punch', 4), release: 3 },                  // đấm: khung 3 = nắm đấm duỗi thẳng
        charge:  { mode: 'hold', intro: ['charge1'], introTime: 0.05, frames: ['charge1', 'charge2'], fps: 10 },   // gồng nắm đấm lửa (rung)
        dash:    { mode: 'strike', frames: ['dash1', 'dash2', 'punch2', 'punch3'], at: [0, 0.12, 0.24, 0.34], release: 4, noLift: true },
        inhale:  { mode: 'hold', intro: ['inhale1'], introTime: 0.4, frames: ['inhale1', 'inhale2'], fps: 1.5 },  // hít khí lạnh (giữ)
        breath:  { mode: 'hold', intro: ['breath1'], introTime: 0.1, frames: ['breath1', 'breath2'], fps: 6 },    // phun bão tuyết (giữ)
        breathEnd: { mode: 'clip', frames: ['breath1', 'walk1'] },
        cast:    { mode: 'still', frames: ['aura1'] },                                    // niệm Hào Quang Sét: giơ 2 nắm đấm lên trời
        aura:    { mode: 'strike', frames: ['aura1', 'aura2', 'walk1'], release: 2 },     // nện xuống đúng 0,4s
        summon:  { mode: 'clip', frames: ['form1', 'roar1', 'roar1', 'walk1'] },          // trồi lên từ vòng triệu hồi
        hurt:    { mode: 'clip', frames: ['hurt1', 'hurt1', 'walk1'] },
        stunned: { mode: 'still', frames: ['stun1'] },
        dead:    { mode: 'once', frames: r('crumble', 2), fps: 3, drawnDeath: true },     // vỡ dần -> đống đá (ngọc ngực mờ)
        victory: { mode: 'clip', frames: ['aura1', 'aura2', 'walk1'] },
        victoryIdle: { mode: 'still', frames: ['walk1'] },
    },
    lean: [],
};
