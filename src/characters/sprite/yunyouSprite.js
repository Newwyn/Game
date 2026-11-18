// ============================================================
// YUNYOU (Kiếm Tiên, swordsage) kiểu SPRITE, bậc SSS
// Atlas: src/assets/sprites/yunyou_sprite.webp + src/characters/sprite/yunyouSprite.json
// Lưu ý: chỉ dùng move1..4 (khung move5..8 bị mất thanh kiếm).
// ============================================================
import imageUrl from '../../assets/sprites/yunyou_sprite.webp';
import meta from './yunyouSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);
// Niệm Trận Đồ Kiếm (2s): vào thế sky1..2 rồi giữ sky2..3; đòn đại kiếm cuối dùng sky4 (bolt)
const SKY_HOLD = { mode: 'hold', intro: ['sky1', 'sky2'], introTime: 0.28, frames: ['sky2', 'sky3'], fps: 4, noLift: true };

export const YUNYOU_SPRITE = {
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
        ready:       { mode: 'still', frames: ['ready1'] },
        attack:      { mode: 'strike', frames: r('attack', 8), release: 5, noLift: true },
        move:        { mode: 'loop', frames: r('move', 4), fps: 9, noLift: true },
        palm:        { mode: 'strike', frames: r('seal', 4), release: 3, noLift: true },
        summon:      { mode: 'once', frames: r('takeoff', 4), fps: 6, noLift: true },
        charge:      SKY_HOLD,
        cast:        SKY_HOLD,
        bolt:        { mode: 'once', frames: ['sky3', 'sky4', 'sky4', 'hover1'], fps: 7, noLift: true },
        hover:       { mode: 'loop', frames: r('hover', 4), fps: 5, noLift: true },
        hurt:        { mode: 'clip', frames: r('hurt', 4) },
        stunned:     { mode: 'loop', frames: r('stun', 4), fps: 5 },
        fall:        { mode: 'clip', frames: ['takeoff1'] },
        land:        { mode: 'once', frames: ['takeoff2', 'takeoff1', 'ready1'], fps: 5, noLift: true },
        dead:        { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory:     { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
    },
    hover: { idle: 'hover', ready: 'hover', move: 'hover' },
    lean: [],
};
