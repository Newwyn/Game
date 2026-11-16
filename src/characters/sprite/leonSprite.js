// ============================================================
// LEON (Ky Vuong - Ky Thu trieu hoi quan co) kieu SPRITE - moi khung la 1 hinh ve tron than
// (tranh AI do Codex ve theo art/leon/sheet_jobs.mjs, chi tach nen + can chan)
// Atlas: tools/sprite_pack.py art/leon/sprite/sprite_spec.json -> src/assets/sprites/leon_sprite.webp + leonSprite.json
// Khung xuong an: muon cua Ignar (IGNAR_RIG + ignarClips) nhu Sylva - ten clip tranh = ten clip khung xuong:
//   attack = bung quan co (danh thuong) - summon = nut 1 (dat quan canh thu) - bolt = nut 2 (ra lenh canh cong) - palm = nut 3 (quan chua / Chieu Tuong) - charge = niem
// Cach chay khung (mode strike / clip / hold / once / loop / still): xem src/characters/sprite/ignarSprite.js
// ============================================================
import imageUrl from '../../assets/sprites/leon_sprite.webp';
import meta from './leonSprite.json';

const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`);

export const LEON_SPRITE = {
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
        attack:  { mode: 'strike', frames: r('attack', 8), release: 4 },   // khung 4 = bung quan co
        summon:  { mode: 'strike', frames: r('guard', 8), release: 5 },    // khung 5 = dap quan co xuong dat
        bolt:    { mode: 'strike', frames: r('strike', 8), release: 5 },   // khung 5 = vung tay ra lenh
        palm:    { mode: 'strike', frames: r('royal', 8), release: 5 },    // khung 5 = an quan Vua xuong
        charge:  { mode: 'hold', intro: ['cast1', 'cast2'], introTime: 0.24, frames: ['cast3', 'cast4'], fps: 4 },
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
