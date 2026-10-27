// ============================================================
// Thú triệu hồi của Sylva kiểu SPRITE: Sói Rừng · Đại Bàng · Gấu Hộ Vệ
// (tranh AI do Codex vẽ; Đại Bàng niệm gió + 4 tấm Gấu do Antigravity vẽ — art/sylva/<wolf|eagle|bear>/, chỉ tách nền + căn chân)
// Atlas: tools/sprite_pack.py art/sylva/<thú>/sprite_spec.json -> src/assets/sprites/<thú>_sprite.webp + <thú>Sprite.json
// Khung xương ẩn: mượn của Golem (GOLEM_RIG + golemClips) — tên clip tranh = tên clip khung xương:
//   attack = cắn / vỗ cánh (0,3s) · aura = tru / vỗ cánh phóng (0,4s) · summon = vồ (0,9s) · charge = gồng (giữ) · dash = ủi (Gấu)
// Động tác dùng trong events.js / sylvaFx.js đặt ở registry (anims): howl · pounce · cast · ram
// ============================================================
import wolfUrl from '../../assets/sprites/wolf_sprite.webp';
import wolfMeta from './wolfSprite.json';
import eagleUrl from '../../assets/sprites/eagle_sprite.webp';
import eagleMeta from './eagleSprite.json';
import bearUrl from '../../assets/sprites/bear_sprite.webp';
import bearMeta from './bearSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const WOLF_SPRITE = {
    image: wolfUrl,
    meta: wolfMeta,
    idle: {
        A: { frames: r('idle', 4), fps: 3 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                   // khom người gầm gừ
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },                    // phi nước đại
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                  // khung 4 = lao tới cắn
        aura:    { mode: 'strike', frames: [...r('howl', 4), 'ready1'], release: 3 },     // tru (ra sân: địch giảm thủ)
        summon:  { mode: 'clip', frames: r('pounce', 4), noLift: true },                  // vồ vào hàng sau (events.js nhảy vòng cung)
        charge:  { mode: 'still', frames: ['ready1'] },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'loop', frames: ['hurt3', 'hurt4'], fps: 3 },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: r('howl', 4) },
        victoryIdle: { mode: 'still', frames: ['idle1'] },
    },
    lean: [],
};

export const EAGLE_SPRITE = {
    image: eagleUrl,
    meta: eagleMeta,
    // bay lơ lửng: nâng cả hình khỏi mặt đất + nhấp nhô nhẹ (khung gục nằm trên đất)
    lift: 0.85,
    bob: 0.1,
    idle: {
        A: { frames: r('idle', 4), fps: 6 },                                             // vỗ cánh tại chỗ
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'A',
    clips: {
        ready:   { mode: 'loop', frames: r('ready', 4), fps: 6 },
        move:    { mode: 'loop', frames: r('move', 8), fps: 10, noLift: true },
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },                  // khung 4 = vỗ mạnh cánh phóng lông vũ
        charge:  { mode: 'hold', intro: ['cast1', 'cast2'], introTime: 0.3, frames: ['cast3', 'cast4'], fps: 4 },   // niệm 1s: giơ cánh, kêu gọi gió (tấm cast do Antigravity vẽ)
        aura:    { mode: 'strike', frames: r('release', 4), release: 1 },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'loop', frames: ['hurt1', 'hurt2'], fps: 3 },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 6, drawnDeath: true },
        victory: { mode: 'loop', frames: r('ready', 4), fps: 6 },
        victoryIdle: { mode: 'loop', frames: r('idle', 4), fps: 6 },
    },
    lean: [],
};

export const BEAR_SPRITE = {
    image: bearUrl,
    meta: bearMeta,
    idle: {
        A: { frames: r('idle', 4), fps: 2.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },                                   // cúi đầu gầm gừ
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },                    // chạy nặng nề
        attack:  { mode: 'strike', frames: r('attack', 8), release: 5 },                  // đứng dậy giơ vuốt -> khung 5 = vả xuống
        dash:    { mode: 'hold', intro: ['charge1', 'charge2'], introTime: 0.2, frames: ['charge3', 'charge4', 'charge5', 'charge6'], fps: 8, noLift: true },   // ủi (giữ suốt đường ủi)
        summon:  { mode: 'clip', frames: r('turn', 8), dur: 0.6, noLift: true },          // phanh -> quay đầu -> gầm (startBearCharge lật hướng giữa chừng)
        charge:  { mode: 'still', frames: ['ready1'] },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'loop', frames: ['hurt2', 'hurt3'], fps: 3 },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 5, drawnDeath: true },
        victory: { mode: 'clip', frames: ['charge7', 'charge8'] },
        victoryIdle: { mode: 'still', frames: ['idle1'] },
    },
    lean: [],
};