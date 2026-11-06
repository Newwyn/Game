// ============================================================
// Quái chương 1 (P5) kiểu SPRITE: mỗi quái 2 khung (đứng · tấn công) vẽ trên Google Flow, cắt bằng tools/enemy_pack.py
//   -> src/assets/sprites/enemy_<art>.webp + enemy_<art>.json. Trùm Valdric có thêm 2 khung bùng lửa (p2_idle1 · p2_attack1).
// Khung xương ẩn mượn của quái cũ (creatureVisual) để giữ mốc ra đòn / nhún / ngã. Sói dùng lại bộ tranh sói của Sylva.
// ============================================================
import { creatureVisual } from '../cutout/creatureRig.js';
import { GOLEM_RIG } from '../cutout/golemRig.js';
import { golemClips, LOCOMOTION as GOLEM_LOCOMOTION } from '../cutout/golemClips.js';
import { WOLF_SPRITE } from './sylvaPetSprites.js';

const IMAGES = import.meta.glob('../../assets/sprites/enemy_*.webp', { eager: true, import: 'default' });
const METAS = import.meta.glob('./enemy_*.json', { eager: true, import: 'default' });

function spriteOf(art) {
    const meta = METAS[`./enemy_${art}.json`], image = IMAGES[`../../assets/sprites/enemy_${art}.webp`];
    if (!meta || !image) return null;
    const p2 = !!meta.frames.p2_idle1;
    const still = (f) => ({ mode: 'still', frames: [f] });
    return {
        image, meta,
        idle: { C: { frames: ['idle1'], breath: true } },
        defaultIdle: 'C',
        clips: {
            attack: { mode: 'strike', frames: ['idle1', 'attack1', 'attack1', 'idle1'], release: 2 },
            move: still('idle1'), ready: still('idle1'), hurt: still('idle1'), stunned: still('idle1'),
            dead: still('idle1'), fall: still('idle1'), land: still('idle1'), victory: still('idle1'), victoryIdle: still('idle1'),
            ...(p2 ? {
                p2_idle: still('p2_idle1'),
                p2_attack: { mode: 'strike', frames: ['p2_idle1', 'p2_attack1', 'p2_attack1', 'p2_idle1'], release: 2 },
            } : {}),
        },
        // giai đoạn 2 (Valdric bùng lửa): dùng khung p2_* — FrameSpriteView đọc `phase2`
        phase2: p2 ? { idle1: 'p2_idle1', attack1: 'p2_attack1' } : null,
        lean: [],
    };
}

const cache = new Map();
/** Hình hiển thị cho quái có `art` trong CLASS_DEFS (null nếu chưa có tranh -> dùng hình quái cũ) */
export function enemyVisual(classDef, member) {
    const key = `${classDef.art}|${classDef.scale ?? 1}`;
    if (cache.has(key)) return cache.get(key);
    const scale = classDef.scale ?? 1;
    let visual = null;
    if (classDef.art === 'wolf') {
        visual = { rig: GOLEM_RIG, clips: golemClips, height: 1.75 * scale, shadowSize: 1.5 * scale, locomotion: GOLEM_LOCOMOTION,
            sprite: WOLF_SPRITE, spriteParam: 'enemy', anims: { attack: { clip: 'attack', hitTime: 0.3 }, throw: { clip: 'attack', hitTime: 0.3 } } };
    } else {
        const sp = spriteOf(classDef.art);
        if (sp) {
            const base = creatureVisual(classDef.base ?? 'monster_tank', member?.color ?? classDef.color);
            visual = { ...base, height: 1.85 * scale, shadowSize: 1.5 * scale, sprite: sp, spriteParam: 'enemy' };
        }
    }
    cache.set(key, visual);
    return visual;
}
