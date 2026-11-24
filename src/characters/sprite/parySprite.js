// ============================================================
// PARY (Búa Thánh, holyhammer) kiểu SPRITE, bậc SSS — tranh Flow 21/11/2026
// Atlas: src/assets/sprites/pary_sprite.webp + src/characters/sprite/parySprite.json (tools/sprite_pack.py art/pary/sprite/sprite_spec.json)
// ============================================================
import imageUrl from '../../assets/sprites/pary_sprite.webp';
import meta from './parySprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const PARY_SPRITE = {
    image: imageUrl,
    meta,
    topScale: 1,
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'A',
    juice: 'melee',
    synthClips: true,   // động tác riêng (spin / smash / slam...) không có trong khung xương Rok -> FrameSpriteView tự tạo động tác ẩn
    clips: {
        ready:       { mode: 'loop', frames: r('ready', 4), fps: 5 },
        attack:      { mode: 'strike', frames: r('attack', 8), release: 4 },                      // búa đập xuống
        move:        { mode: 'loop', frames: r('run', 8), fps: 11 },
        // KN1 tụ lực: giơ tay nắm đuôi cán (búa thật vẽ riêng, paryFx quay vòng bầu dục quanh điểm 'fist' trên đầu)
        spin:        { mode: 'hold', intro: ['whirl1'], introTime: 0.08, frames: r('whirl', 4), fps: 4 },
        smash:       { mode: 'strike', frames: ['whirl5', 'whirl6', 'whirl7', 'whirl8'], release: 3, dur: 0.6 },   // KN1 đập xuống
        aura:        { mode: 'strike', frames: r('aura', 8), release: 4 },                        // KN2 cắm búa mở hào quang
        // KN3: niệm gọi búa ánh sáng (giữ) -> mỗi nhịp: nhảy lên, cầm búa gõ xuống -> giữa 2 nhịp vẫn cầm búa trên đầu
        colossusCast: { mode: 'hold', intro: ['colossus1', 'colossus2'], introTime: 1.1, frames: ['colossus3', 'colossus4'], fps: 2.5 },
        colossusHold: { mode: 'hold', intro: ['colossus4'], introTime: 0.12, frames: ['colossus3'], fps: 1 },
        // 1 nhịp: thủ (0) -> vung ra sau (0,07) -> giơ qua đầu (0,17) -> bổ xuống (0,25) -> búa NẰM trên đất (0,3 -> 0,8)
        slam:        { mode: 'strike', frames: ['colossus4', 'colossus5', 'colossus6', 'colossus7', 'colossus8'], release: 4, at: [0, 0.07, 0.17, 0.25, 0.3], dur: 0.8 },
        throw:       { mode: 'strike', frames: ['attack2', 'attack3', 'attack4', 'attack8'], release: 3 },   // TP1 quăng búa
        hurt:        { mode: 'clip', frames: r('hurt', 4) },
        stunned:     { mode: 'loop', frames: r('stun', 4), fps: 4 },
        dead:        { mode: 'once', frames: r('dead', 4), fps: 6, drawnDeath: true },
        victory:     { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 3 },
    },
    lean: [],
};
