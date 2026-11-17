// ============================================================
// NYX (Hư Không — nữ Goblin pháp sư) kiểu SPRITE, bậc SSS. Tấm đứng do Codex vẽ, tấm động tác do Flow vẽ (art/nyx/sprite, art/nyx/sprite_flow).
// Atlas: tools/sprite_pack.py art/nyx/sprite/sprite_spec.json -> src/assets/sprites/nyx_sprite.webp + nyxSprite.json
// Khung xương ẩn mượn của Ignar — tên clip tranh = tên clip khung xương:
//   attack = chọc gậy (đánh thường) · palm = Ma Đạn Tinh Tú · summon / charge = Sao Rơi (giơ gậy niệm) · bolt = Hố Đen
// ============================================================
import imageUrl from '../../assets/sprites/nyx_sprite.webp';
import meta from './nyxSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);
const STAR_HOLD = { mode: 'hold', intro: ['starfall1', 'starfall2'], introTime: 0.3, frames: ['starfall3', 'starfall4', 'starfall5', 'starfall6'], fps: 5 };

export const NYX_SPRITE = {
    image: imageUrl,
    meta,
    topScale: 1,
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'C',
    juice: 'ranged',
    clips: {
        ready:   { mode: 'still', frames: ['ready1'] },
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },
        palm:    { mode: 'strike', frames: r('missiles', 8), release: 4 },
        summon:  STAR_HOLD,
        bolt:    { mode: 'hold', intro: ['blackhole1', 'blackhole2'], introTime: 0.3, frames: ['blackhole3', 'blackhole4', 'blackhole5', 'blackhole6'], fps: 5 },
        charge:  STAR_HOLD,
        move:    { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt:    { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4), dur: 0.8 },
        fall:    { mode: 'clip', frames: ['land1'] },
        land:    { mode: 'clip', frames: ['land2', 'land3', 'land4'] },
        dead:    { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
    },
    lean: ['guard', 'cast', 'channel'],
};
