// ============================================================
// CAELUM (Tu Sĩ Thánh Giá, crosspriest) kiểu SPRITE, bậc SSS — tranh Flow 21/11/2026
// Atlas: src/assets/sprites/caelum_sprite.webp + src/characters/sprite/caelumSprite.json (tools/sprite_pack.py art/caelum/sprite/sprite_spec.json)
// Cậu bé lơ lửng: mọi động tác đều bay (không bước chân).
// ============================================================
import imageUrl from '../../assets/sprites/caelum_sprite.webp';
import meta from './caelumSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const CAELUM_SPRITE = {
    image: imageUrl,
    meta,
    topScale: 1,
    idle: {
        A: { frames: r('idle', 4), fps: 4 },
        B: { frames: ['idle1', 'idle3'], fps: 1.5 },
        C: { frames: ['idle1'], breath: true },
    },
    defaultIdle: 'A',
    juice: 'ranged',
    clips: {
        ready:       { mode: 'loop', frames: r('idle', 4), fps: 4 },
        attack:      { mode: 'strike', frames: r('attack', 8), release: 4, noLift: true },   // vung tay áo phóng ánh sáng
        move:        { mode: 'loop', frames: r('move', 8), fps: 9, noLift: true },           // lướt bay
        place:       { mode: 'strike', frames: r('place', 8), release: 4, noLift: true },    // KN1: rút thánh giá nhỏ ném xuống
        hymn:        { mode: 'strike', frames: r('pray', 8), release: 4, noLift: true },     // KN2: Thánh Ca — dang tay
        raise:       { mode: 'strike', frames: r('smite', 8), release: 4, noLift: true },    // KN3: giơ tay gọi Thần Quang
        hurt:        { mode: 'clip', frames: r('hurt', 4) },
        stunned:     { mode: 'loop', frames: r('stun', 4), fps: 4 },
        dead:        { mode: 'once', frames: r('dead', 4), fps: 6, drawnDeath: true },
        victory:     { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 2.5 },
    },
    lean: [],
};
