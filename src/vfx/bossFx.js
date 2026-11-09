import * as THREE from 'three';
import { addAnim, fxBudget } from './vfx.js';

const COLORS = { b_wolf: 0xb84b37, b_skarn: 0x9aa34b, b_morwen: 0x713cb4,
    b_valdric: 0xff741e, b_warden: 0x78aaa5, b_hollow: 0x57b65e,
    b_vexa: 0xb45bfa, b_thalor: 0x8bcaff, b_malkor: 0xffe8a0 };
const TAU = Math.PI * 2;
// Retained module resources. addAnim owns each cloned material, never these geometries.
const GEO = {
    disc: new THREE.CircleGeometry(1, 40), ring: new THREE.RingGeometry(0.94, 1, 48),
    arc: new THREE.RingGeometry(0.90, 1, 24, 0, Math.PI * 1.4),
    hex: new THREE.RingGeometry(0.83, 1, 6), plane: new THREE.PlaneGeometry(1, 1),
    bubble: new THREE.IcosahedronGeometry(1, 1),
    column: new THREE.CylinderGeometry(0.35, 1, 1, 12, 1, true),
};
const BASE = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending });
const pending = new WeakMap();
function mesh(geometry, color, opacity = 1) {
    const material = BASE.clone(); material.color.setHex(color); material.opacity = opacity;
    const object = new THREE.Mesh(geometry, material);
    object.userData.sharedGeometry = true;
    return object;
}
function at(object, pos, y = 0) { object.position.set(pos.x, y, pos.z); return object; }
function ground(object) { object.rotation.x = -Math.PI / 2; return object; }
function fade(object, life, update, alpha = 1) {
    addAnim(object, life, (p, fx, dt) => {
        object.material.opacity = alpha * (1 - p);
        update?.(p, fx, dt);
    });
    return object;
}
function pulse(pos, color, radius = 3, life = 0.8, vertical = false, delay = 0) {
    const ring = at(mesh(vertical ? GEO.arc : GEO.ring, color), pos, vertical ? 1.5 : -0.38);
    if (!vertical) ground(ring);
    fade(ring, life, p => {
        const t = Math.max(0, (p - delay) / (1 - delay));
        ring.visible = p >= delay;
        ring.scale.setScalar(0.2 + radius * t);
        if (vertical) ring.rotation.z = t * 0.7;
    }, 0.85);
}
// A single Points draw per burst, <= 24 particles; positions and seeds allocated only at spawn.
function particles(pos, color, count = 20, mode = 'burst', life = 0.9, end = null) {
    count = fxBudget(Math.min(count, 24), 3);
    const data = new Float32Array(count * 3), seed = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        seed[i * 3] = Math.random() * TAU;
        seed[i * 3 + 1] = 0.4 + Math.random() * 1.5;
        seed[i * 3 + 2] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    const attribute = new THREE.BufferAttribute(data, 3).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', attribute);
    const material = new THREE.PointsMaterial({ color, size: mode === 'dust' ? 0.24 : 0.12,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const points = new THREE.Points(geometry, material); points.frustumCulled = false;
    addAnim(points, life, p => {
        material.opacity = (1 - p) * 0.85;
        for (let i = 0; i < count; i++) {
            const j = i * 3, a = seed[j], speed = seed[j + 1], phase = seed[j + 2];
            let r = speed * p * 2, y = 0.2 + Math.sin(p * Math.PI) * speed;
            let x = pos.x, z = pos.z;
            if (mode === 'gather') { r = speed * (1 - p); y = 0.5 + p * 1.7; }
            if (mode === 'drip') { r = phase * 0.5; y = 1.6 - p * 2; }
            if (mode === 'dust') y = -0.2 + Math.sin(p * Math.PI) * 0.6;
            if (mode === 'ring') { r = (end?.radius ?? 4) * p; y = -0.3 + Math.sin(p * Math.PI) * (0.3 + phase); }
            if (mode === 'soul' && end) {
                const t = Math.max(0, Math.min(1, p * 1.4 - phase * 0.35));
                x += (end.x - pos.x) * t; z += (end.z - pos.z) * t;
                r = Math.sin(t * Math.PI) * 0.3; y = 1 + Math.sin(t * Math.PI) * 1.4;
            }
            data[j] = x + Math.cos(a + p * 3) * r;
            data[j + 1] = y; data[j + 2] = z + Math.sin(a + p * 3) * r;
        }
        attribute.needsUpdate = true;
    });
}
function streak(from, to, color, width = 0.3, life = 0.65, y = 0.8) {
    const dx = to.x - from.x, dz = to.z - from.z;
    const slash = ground(mesh(GEO.plane, color));
    slash.position.set((from.x + to.x) / 2, y, (from.z + to.z) / 2);
    slash.rotation.z = -Math.atan2(dz, dx);
    const length = Math.max(0.1, Math.hypot(dx, dz));
    return fade(slash, life, p => slash.scale.set(length, width * (1 - p), 1), 0.8);
}
function aura(view, pos, color, life = 0.7) {
    const glow = at(mesh(GEO.bubble, color), pos, 1);
    fade(glow, life, p => {
        if (view) { glow.position.x = view.position.x; glow.position.z = view.position.z; }
        glow.scale.set(0.6 + p * 0.5, 1.4 + p * 0.4, 0.6 + p * 0.5);
    }, 0.22);
}
export function spawnBossBanner(pos, name) {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(50,0,10,0.85)'; ctx.fillRect(0, 0, 768, 96);
    ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#fff0e5'; ctx.fillText(name, 384, 62);
    const map = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, depthWrite: false }));
    sprite.position.set(pos.x, (pos.y ?? 0) + 3.6, pos.z); sprite.scale.set(7, 0.875, 1);
    addAnim(sprite, 1.2, p => { sprite.material.opacity = Math.min(1, (1 - p) * 5); });
}
function telegraph(shape, seconds) {
    const line = shape.kind === 'line';
    const length = line ? Math.hypot(shape.toX - shape.x, shape.toZ - shape.z) : shape.radius;
    // Ring damage is a filled disk on the server, so retain the interior warning.
    const fill = ground(mesh(line ? GEO.plane : GEO.disc, 0xff243e));
    fill.material.blending = THREE.NormalBlending;
    fill.position.set(line ? (shape.x + shape.toX) / 2 : shape.x, -0.43, line ? (shape.z + shape.toZ) / 2 : shape.z);
    fill.rotation.z = line ? -Math.atan2(shape.toZ - shape.z, shape.toX - shape.x) : 0;
    fill.scale.set(Math.max(0.01, length), line ? shape.width : length, 1);
    addAnim(fill, seconds, p => { fill.material.opacity = 0.18 + p * 0.27; });
    const edge = ground(mesh(line ? GEO.plane : GEO.ring, 0xff6573));
    edge.position.copy(fill.position); edge.position.y += 0.015; edge.rotation.copy(fill.rotation);
    addAnim(edge, seconds, p => {
        edge.scale.set(Math.max(0.01, length * (line ? p : 1)), line ? 0.06 : length, 1);
        edge.material.opacity = 0.8;
    });
}
function chooseTarget(foes, skill) {
    let chosen = null, score = skill === 'pounce' ? Infinity : -Infinity;
    for (const v of foes) {
        if (!v?.member?.alive || v.member.summon) continue;
        const m = v.member;
        const s = skill === 'pounce' ? m.hp / Math.max(1, m.maxHp) : Math.max(m.pAtk || 0, m.mAtk || 0);
        if (skill === 'pounce' ? s < score : s > score) { chosen = v; score = s; }
    }
    return chosen;
}
function windup(d, boss, target, color, seconds) {
    const pos = boss?.position ?? d;
    aura(boss, pos, color, Math.min(seconds, 0.45));
    particles(pos, color, 12, 'gather', seconds);
    const cue = at(mesh(d.skill === 'shield' ? GEO.bubble : d.skill === 'curse' ? GEO.hex : GEO.arc, color), pos, 1.2);
    if (['slam', 'ring', 'pillars'].includes(d.skill)) { ground(cue); cue.position.y = -0.30; }
    addAnim(cue, seconds, p => {
        cue.material.opacity = 0.2 + p * 0.4;
        const s = d.skill === 'slam' ? 1.6 - p : 0.5 + p * 0.6;
        cue.scale.setScalar(s); // Rotation updates below are absolute, frame-rate independent.
        if (d.skill === 'cry') cue.scale.y = 1 + p * 1.5;
        if (d.skill === 'howl') cue.position.y = 1.2 + p;
        if (d.skill === 'curse') cue.rotation.z = p * TAU;
        if (d.skill === 'shield') { cue.scale.y = s * 1.5; cue.material.wireframe = true; }
        if (d.skill === 'drain') cue.rotation.y = p * TAU;
        if (d.skill === 'pillars') cue.position.y = -0.3 + p * 1.4;
        if (d.skill === 'ring') cue.rotation.z = -p * TAU;
        if (d.skill === 'pounce') cue.rotation.z = -p * Math.PI;
        if (d.skill === 'dash') { cue.scale.set(1.8, 0.3 + p * 0.2, 1); cue.rotation.y = Math.atan2(d.shapes?.[0]?.toZ - d.z || 0, d.shapes?.[0]?.toX - d.x || 1); }
    });
    if (target && ['pounce', 'curse'].includes(d.skill)) {
        const mark = at(mesh(d.skill === 'curse' ? GEO.hex : GEO.arc, color), target.position, 2.8);
        addAnim(mark, seconds, p => { mark.position.x = target.position.x; mark.position.z = target.position.z; mark.rotation.z = p * 2; mark.material.opacity = 0.4 + p * 0.5; });
    }
}
function lasting(view, color, shield) {
    if (!view) return;
    const duration = shield ? 5 : 6;
    const life = shield ? duration + 0.35 : duration;
    const object = at(mesh(shield ? GEO.bubble : GEO.hex, color), view.position, shield ? 1 : 3);
    object.material.wireframe = shield;
    const type = shield ? 'boss_shield' : 'boss_curse';
    let seen = false, ending = -1;
    addAnim(object, life, (p, fx) => {
        let active = false;
        for (const effect of view.member?.statusEffects ?? []) {
            if (effect.type === type && (!shield || effect.hp > 0)) { active = true; break; }
        }
        seen ||= !!active;
        if (ending < 0 && (view.member?.alive === false || (seen && !active) || fx.age >= duration - (shield ? 0 : 0.35))) ending = fx.age;
        const shatter = ending < 0 ? 0 : Math.min(1, (fx.age - ending) / 0.35);
        object.position.x = view.position.x; object.position.z = view.position.z;
        object.rotation.y = p * TAU; object.rotation.z = shield ? 0 : p * TAU;
        object.scale.set(1.15 + shatter, (shield ? 1.7 : 0.65) + shatter, 1.15 + shatter);
        object.material.opacity = (shield ? 0.35 : 0.8) * (1 - shatter);
        if (ending >= 0 && !object.userData.broken) {
            object.userData.broken = true;
            particles(view.position, color, 16, shield ? 'burst' : 'drip', 0.35);
        }
        if (shatter >= 1) fx.life = fx.age;
    });
    if (!shield) {
        // Hanging chain links below the sigil; short-lived so they do not obscure attacks.
        for (let i = 0; i < 6; i++) {
            const link = at(mesh(GEO.hex, color), view.position, 2.6 - (i % 3) * 0.4);
            link.position.x += i < 3 ? -0.5 : 0.5; link.scale.set(0.13, 0.24, 0.13);
            fade(link, 1.1, null, 0.75);
        }
        particles(view.position, 0xa355d5, 10, 'drip', 1.1);
    }
}
// Existing warning entry point also accepts the complete boss event + resolved views.
// Keeping dispatch here confines combat integration to the authorized handler block.
export function spawnBossWarning(d, seconds, context) {
    if (!context) { telegraph(d, seconds); return; }
    const { boss, allies = [], foes = [], shake } = context;
    const color = COLORS[boss?.member?.classId] ?? 0xb55b86;
    const pos = boss?.position ?? d;
    let casts = boss && pending.get(boss);
    if (d.kind === 'warning') {
        const target = chooseTarget(foes, d.skill);
        if (boss) {
            if (!casts) { casts = new Map(); pending.set(boss, casts); }
            casts.set(d.skill, { target, summons: new Set(allies.filter(v => v?.member?.summon && v.member.alive).map(v => v.member.summonId)) });
        }
        for (const shape of d.shapes ?? []) telegraph(shape, seconds);
        windup(d, boss, target, color, Math.min(1.2, seconds));
        return;
    }
    const cast = casts?.get(d.skill); casts?.delete(d.skill);
    const hits = (d.effects ?? []).map(e => ({ e, view: foes[e.targetIndex] })).filter(h => h.view);
    // DoT packets have no telegraphs and no pending cast. Never replay a leap/pillar/sigil.
    if (!cast && !(d.shapes?.length) && ['pounce', 'pillars', 'curse'].includes(d.skill) && hits.length) {
        for (const { view } of hits.slice(0, 3)) particles(view.position, d.skill === 'pounce' ? 0xa92032 : color, 6, 'drip', 0.45);
        return;
    }
    const target = hits[0]?.view ?? cast?.target;
    switch (d.skill) {
    case 'howl': {
        pulse(pos, color, 3.5); pulse(pos, color, 3, 1.1, true); pulse(pos, color, 4, 1.1, true, 0.25);
        // Wait in the normal VFX loop for the next squad snapshot; no timers or guessed spawn point.
        const watcher = new THREE.Group();
        addAnim(watcher, 1.2, (p, fx) => {
            let summoned;
            for (const v of context.getAllies?.() ?? allies) {
                if (cast && v?.member?.alive && v.member.bossOwner === d.casterIdx && !cast.summons.has(v.member.summonId)) { summoned = v; break; }
            }
            if (summoned && !watcher.userData.done) { watcher.userData.done = true; particles(summoned.position, color, 20, 'dust', 0.7); pulse(summoned.position, color, 1.2, 0.6); fx.life = fx.age; }
        });
        break;
    }
    case 'pounce':
        if (target) {
            streak(d, target.position, color, 0.65);
            for (let i = 0; i < 3; i++) {
                const claw = at(mesh(GEO.arc, color), target.position, 1.1 + i * 0.23);
                claw.scale.set(0.8, 0.18, 1); claw.rotation.z = -0.8;
                fade(claw, 0.65, p => { claw.position.x = target.position.x + (p - 0.5) * 0.9; });
            }
            if (!hits[0]?.e.isMiss) particles(target.position, 0xae1b32, 14, 'drip', 1.1);
        }
        break;
    case 'slam':
        pulse(d, color, d.shapes?.[0]?.radius ?? 3.5);
        for (let i = 0; i < 12; i++) {
            const a = i * TAU / 12, r = d.shapes?.[0]?.radius ?? 3.5;
            const crack = ground(at(mesh(GEO.plane, color), d, -0.36));
            crack.rotation.z = -a;
            fade(crack, 0.85, p => { const reach = r * Math.min(1, p * 4); crack.position.x = d.x + Math.cos(a) * reach / 2; crack.position.z = d.z + Math.sin(a) * reach / 2; crack.scale.set(reach, 0.04 + (i % 3) * 0.02, 1); }, 0.9);
        }
        particles(d, 0xb5a38c, 24, 'dust'); shake?.(); break;
    case 'cry':
        for (const ally of allies) if (ally?.member?.alive) { aura(ally, ally.position, color, 1); pulse(ally.position, color, 1.3, 1); }
        break;
    case 'dash': {
        const line = d.shapes?.[0]; if (!line) break;
        const end = { x: line.toX, z: line.toZ };
        streak(line, end, 0x291337, 1.1, 0.6).material.blending = THREE.NormalBlending; streak(line, end, color, 0.16, 0.8);
        for (let i = 1; i <= 4; i++) {
            const ghost = at(mesh(GEO.bubble, color), { x: line.x + (end.x - line.x) * i / 5, z: line.z + (end.z - line.z) * i / 5 }, 1);
            ghost.scale.set(0.45, 1.2, 0.4); fade(ghost, 0.3 + i * 0.12, null, 0.22);
        }
        break;
    }
    case 'shield': lasting(boss, color, true); break;
    case 'pillars':
        for (const shape of (d.shapes ?? []).slice(0, 3)) {
            pulse(shape, color, shape.radius, 0.8);
            const column = at(mesh(GEO.column, color), shape);
            fade(column, 1.1, p => { const h = 5 * Math.sin(Math.PI * Math.min(1, p * 1.5)); column.position.y = -0.4 + h / 2; column.scale.set(shape.radius * (0.7 - p * 0.3), Math.max(0.01, h), shape.radius * (0.7 - p * 0.3)); }, 0.5);
            particles(shape, color, 12, 'burst', 1);
        }
        break;
    case 'ring':
        pulse(d, color, d.shapes?.[0]?.radius ?? 4, 1.1);
        pulse(d, color, d.shapes?.[0]?.radius ?? 4, 1.1, false, 0.18);
        particles(d, color, 24, 'ring', 1.1, d.shapes?.[0]); break;
    case 'curse': lasting(cast?.target ?? chooseTarget(foes, 'curse'), color, false); break;
    case 'drain':
        for (const { view } of hits.slice(0, 10)) particles(view.position, color, 6, 'soul', 1.1, pos);
        aura(boss, pos, 0xbfffc9, 1.2); pulse(pos, color, 1.5, 1.1, true); break;
    }
}
