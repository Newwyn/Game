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
    clips: {
        ready:       { mode: 'loop', frames: r('ready', 4), fps: 5 },
        attack:      { mode: 'strike', frames: r('attack', 8), release: 4 },                      // búa đập xuống
        move:        { mode: 'loop', frames: r('run', 8), fps: 11 },
        spin:        { mode: 'hold', intro: ['spin1', 'spin2'], introTime: 0.25, frames: ['spin2', 'spin3', 'spin4'], fps: 9 },   // KN1 niệm: xoay búa
        smash:       { mode: 'strike', frames: ['spin5', 'spin6', 'spin7', 'spin8'], release: 2 }, // KN1 đập
        aura:        { mode: 'strike', frames: r('aura', 8), release: 4 },                        // KN2 cắm búa mở hào quang
        slam:        { mode: 'strike', frames: r('slam', 8), release: 3 },                        // KN3 đập 3 lần
        throw:       { mode: 'strike', frames: ['attack2', 'attack3', 'attack4', 'attack8'], release: 3 },   // TP1 quăng búa
        hurt:        { mode: 'clip', frames: r('hurt', 4) },
        stunned:     { mode: 'loop', frames: r('stun', 4), fps: 4 },
        dead:        { mode: 'once', frames: r('dead', 4), fps: 6, drawnDeath: true },
        victory:     { mode: 'clip', frames: ['victory1', 'victory2', 'victory3'] },
        victoryIdle: { mode: 'loop', frames: ['victory3', 'victory4'], fps: 3 },
    },
    lean: [],
};
