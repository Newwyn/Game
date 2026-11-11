// ============================================================
// Quái chương 1 (P5) kiểu SPRITE: mỗi quái 2 khung (đứng · tấn công) vẽ trên Google Flow, cắt bằng tools/enemy_pack.py
//   -> src/assets/sprites/enemy_<art>.webp + enemy_<art>.json. Trùm Valdric có thêm 2 khung bùng lửa (p2_idle1 · p2_attack1).
// Khung xương ẩn mượn của quái cũ (creatureVisual) để giữ mốc ra đòn / nhún / ngã.
// Sói địch: tranh riêng enemy_wolf (Sói Rừng) / enemy_wolfboss (Sói Đầu Đàn, vòng cổ ma thuật) — chưa có thì tạm dùng tranh sói của Sylva.
// ============================================================
import { creatureVisual } from '../cutout/creatureRig.js';
import { GOLEM_RIG } from '../cutout/golemRig.js';
import { golemClips, LOCOMOTION as GOLEM_LOCOMOTION } from '../cutout/golemClips.js';
import { WOLF_SPRITE } from './sylvaPetSprites.js';

const IMAGES = import.meta.glob('../../assets/sprites/enemy_*.webp', { eager: true, import: 'default' });
const METAS = import.meta.glob('./enemy_*.json', { eager: true, import: 'default' });

// Bộ hình động ĐẦY ĐỦ như nhân vật (10/11/2026, tranh Flow): art/enemies/<art>/sprite/*.jpg -> tools/enemy_spec.py + tools/sprite_pack.py
//   -> src/assets/sprites/enemyfull_<art>.webp + enemyfull_<art>.json. Có bộ này thì dùng thay bộ 4 khung cũ.
const FULL_IMAGES = import.meta.glob('../../assets/sprites/enemyfull_*.webp', { eager: true, import: 'default' });
const FULL_METAS = import.meta.glob('./enemyfull_*.json', { eager: true, import: 'default' });

// khung ra đòn của tấm đánh thường (mặc định 4) — tranh nào AI vẽ nhát chém rõ nhất ở khung khác thì ghi ở đây
const RELEASE = { soldier: 6 };

function fullSpriteOf(art) {
    const meta = FULL_METAS[`./enemyfull_${art}.json`], image = FULL_IMAGES[`../../assets/sprites/enemyfull_${art}.webp`];
    if (!meta || !image) return null;
    const r = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}${i + 1}`).filter(f => meta.frames[f]);
    const clips = {
        ready: { mode: 'loop', frames: r('ready', 4), fps: 3 },
        cast: { mode: 'still', frames: ['ready1'] },
        attack: { mode: 'strike', frames: r('attack', 8), release: RELEASE[art] ?? 4 },     // khung ra đòn (khớp mốc sát thương của server)
        move: { mode: 'clip', frames: r('move', 8), noLift: true },
        hurt: { mode: 'clip', frames: r('hurt', 4) },
        stunned: { mode: 'clip', frames: r('stun', 4) },
        fall: { mode: 'still', frames: ['idle1'] }, land: { mode: 'still', frames: ['idle1'] },
        dead: { mode: 'once', frames: r('dead', 4), fps: 7, drawnDeath: true },
        victory: { mode: 'clip', frames: r('victory', 3) },
        victoryIdle: { mode: 'loop', frames: r('victory', 4).slice(-2), fps: 2.5 },
    };
    // trùm: mỗi kỹ năng 1 tấm 8 khung (skill-<id> -> khung <id>1..8), khung 5 = lúc chiêu bung ra
    const skills = new Set(Object.keys(meta.frames).map(f => f.match(/^([a-z_]+?)\d+$/)?.[1]).filter(k => k && !['idle', 'ready', 'attack', 'move', 'hurt', 'stun', 'dead', 'victory'].includes(k)));
    for (const k of skills) clips[`skill_${k}`] = { mode: 'strike', frames: r(k, 8), release: 5 };
    return { image, meta, idle: { C: { frames: ['idle1'], breath: true } }, defaultIdle: 'C', clips, phase2: null, lean: [], full: true, juice: true };   // juice: chau chuốt động tác như Rok
}

function spriteOf(art) {
    const full = fullSpriteOf(art);
    if (full) return full;
    const meta = METAS[`./enemy_${art}.json`], image = IMAGES[`../../assets/sprites/enemy_${art}.webp`];
    if (!meta || !image) return null;
    const p2 = !!meta.frames.p2_idle1;
    const walk = !!meta.frames.walk1;   // 2 khung đi bộ (tools/enemy_walk_pack.py)
    const still = (f) => ({ mode: 'still', frames: [f] });
    return {
        image, meta,
        idle: { C: { frames: ['idle1'], breath: true } },
        defaultIdle: 'C',
        clips: {
            attack: { mode: 'strike', frames: ['idle1', 'attack1', 'attack1', 'idle1'], release: 2 },
            move: walk ? { mode: 'clip', frames: ['walk1', 'idle1', 'walk2', 'idle1'], noLift: true } : still('idle1'), ready: still('idle1'), hurt: still('idle1'), stunned: still('idle1'),
            dead: still('idle1'), fall: still('idle1'), land: still('idle1'), victory: still('idle1'), victoryIdle: still('idle1'),
            ...(p2 ? {
                p2_idle: still('p2_idle1'),
                p2_attack: { mode: 'strike', frames: ['p2_idle1', 'p2_attack1', 'p2_attack1', 'p2_idle1'], release: 2 },
            } : {}),
        },
        // giai đoạn 2 (Valdric bùng lửa): dùng khung p2_* — FrameSpriteView đọc `phase2`
        phase2: p2 ? { idle1: 'p2_idle1', attack1: 'p2_attack1', walk1: 'p2_idle1', walk2: 'p2_idle1' } : null,
        lean: [],
    };
}

// Chiều cao hình theo LOẠI quái (anh hùng cao 2,9): người / Elf ngang anh hùng, Goblin thấp hơn, nấm / ma trơi nhỏ, cây ma to.
// Trùm nhân thêm classDef.scale (1,15–1,4). Trước đây mọi quái 1,85 -> lính, hiệp sĩ… trông nhỏ hơn anh hùng (vô lý).
const ART_HEIGHT = {
    soldier: 2.8, spy: 2.75, fire: 2.9, goblin: 2.3, trapper: 2.3, wolf: 2.2, wolfboss: 2.2,
    morwen: 2.85, valdric: 2.9, skarn: 2.5, warden: 2.9,
    c2cultist: 2.8, c2guard: 2.85, c2scout: 2.75, c2shroom: 2.0, c2spiritwolf: 2.4, c2treant: 3.0, c2wisp: 2.0,
    hollow: 3.0, vexa: 2.8, thalor: 2.85, malkor: 2.85,
};
const heightOf = (art) => ART_HEIGHT[art] ?? 2.6;
const cache = new Map();
/** Hình hiển thị cho quái có `art` trong CLASS_DEFS (null nếu chưa có tranh -> dùng hình quái cũ) */
export function enemyVisual(classDef, member) {
    const key = `${classDef.art}|${classDef.scale ?? 1}`;
    if (cache.has(key)) return cache.get(key);
    const scale = classDef.scale ?? 1;
    let visual = null;
    const art = classDef.art === 'wolfboss' && !spriteOf('wolfboss') ? 'wolf' : classDef.art;
    if (art === 'wolf' && !spriteOf('wolf')) {
        visual = { rig: GOLEM_RIG, clips: golemClips, height: heightOf('wolf') * scale, shadowSize: 1.5 * scale, locomotion: GOLEM_LOCOMOTION,
            sprite: WOLF_SPRITE, spriteParam: 'enemy', anims: { attack: { clip: 'attack', hitTime: 0.3 }, throw: { clip: 'attack', hitTime: 0.3 } } };
    } else {
        const sp = spriteOf(art);
        if (sp) {
            const base = creatureVisual(classDef.base ?? 'monster_tank', member?.color ?? classDef.color);
            visual = { ...base, height: heightOf(art) * scale, shadowSize: 1.5 * scale * heightOf(art) / 2.3, sprite: sp, spriteParam: 'enemy' };
        }
    }
    cache.set(key, visual);
    return visual;
}
