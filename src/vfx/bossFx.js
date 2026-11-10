// ============================================================
// HIỆU ỨNG KỸ NĂNG TRÙM — tranh vẽ bằng Google Flow (nền đen, art/boss/fx/*.png) cắt bằng art/boss/fx/make_specs.py
//   boss_fx.webp: claw · howl · rage · shadow · pillar · dshield · curse · stun · seal · wisp
//                 + hình nằm đất (1 khung, code tự cho nở / mờ): warn · slam · firering · ucircle · ushock · burn · sealring · target
//   boss_ult.webp: tuyệt kỹ Valdric "Thánh Hỏa Phán Quyết" — ushield (lặp) · ushieldDmg (4 mức nứt) · ublast · ushatter · uhit
// events.js gọi: spawnBossBanner (tên chiêu) · spawnBossWarning (cảnh báo + đòn trúng của 10 chiêu) · handleBossUlt (sự kiện bossUlt)
// Mỗi hiệu ứng = 1 mặt phẳng flipbook (1 lượt vẽ), tự huỷ khi hết — nhẹ cho điện thoại.
// ============================================================
import * as THREE from 'three';
import { addAnim } from './vfx.js';
import { makeFlipbook, FLOOR } from './flipbook.js';
import fxUrl from '../assets/sprites/boss_fx.webp';
import FX from './bossFxAtlas.json';
import ultUrl from '../assets/sprites/boss_ult.webp';
import ULT from './bossUltAtlas.json';
import '../styles/battleTimer.css';   // khung tuyệt kỹ (#ult-hud) dùng chung tệp kiểu với đồng hồ ải

const FB = makeFlipbook(fxUrl, FX);
const UB = makeFlipbook(ultUrl, ULT);
const TINT = { b_hollow: 0x9dffb0, b_vexa: 0xe0b0ff, b_thalor: 0xb0d4ff, b_malkor: 0xfff0c0 };   // trùm chương 2 dùng chung hình, nhuộm nhẹ
const pending = new WeakMap();

// ---------- trình phát ----------
// zOff: đẩy về phía máy quay (hình nhân vật che mất hiệu ứng đặt đúng chỗ đứng của họ)
function place(m, pos, y = 0, zOff = 0) { m.position.set(pos.x, FLOOR + y, (pos.z ?? 0) + zOff); m.userData.zOff = zOff; return m; }
/** Phát 1 lượt hết các khung trong `life` giây (mờ vào / mờ ra) */
function once(fb, m, life, { follow = null, y = 0, fadeOut = 0.2, update = null } = {}) {
    const n = fb.count(m.userData.fx.group);
    addAnim(m, life, (p, fx) => {
        fb.set(m, Math.floor(p * n));
        m.material.opacity = Math.min(1, (1 - p) / fadeOut);
        if (follow) { m.position.x = follow.position.x; m.position.z = follow.position.z + (m.userData.zOff ?? 0); m.position.y = FLOOR + y; }
        update?.(p, fx);
    });
    return m;
}
/** Phát lặp `fps` khung/giây; until(fx) trả true thì mờ dần rồi tắt */
function loop(fb, m, life, { fps = 12, follow = null, y = 0, until = null, update = null } = {}) {
    const n = fb.count(m.userData.fx.group);
    let end = -1;
    addAnim(m, life, (p, fx) => {
        fb.set(m, Math.floor(fx.age * fps) % n);
        if (end < 0 && until?.(fx)) end = fx.age;
        const out = end < 0 ? 1 : 1 - (fx.age - end) / 0.25;
        m.material.opacity = Math.min(1, fx.age / 0.12, out, (fx.life - fx.age) / 0.2);
        if (out <= 0) fx.life = fx.age;
        if (follow) { m.position.x = follow.position.x; m.position.z = follow.position.z + (m.userData.zOff ?? 0); m.position.y = FLOOR + y; }
        update?.(p, fx);
    });
    return m;
}
/** Hình nằm đất 1 khung: nở từ `from` lên 1 rồi mờ dần (vòng lửa, sóng xung kích, hố nứt) */
function grow(m, life, from = 0.3, { fadeAt = 0.55 } = {}) {
    const sx = m.scale.x, sy = m.scale.y;
    addAnim(m, life, (p) => {
        const k = from + (1 - from) * (1 - (1 - Math.min(1, p / 0.45)) ** 3);
        m.scale.set(sx * k, sy * k, 1);
        m.material.opacity = p < fadeAt ? Math.min(1, p * 8) : 1 - (p - fadeAt) / (1 - fadeAt);
    });
    return m;
}
const tint = (m, classId) => { if (TINT[classId]) m.material.color.setHex(TINT[classId]); return m; };

export function spawnBossBanner(pos, name) {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 112;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 768, 0);
    g.addColorStop(0, 'rgba(60,0,10,0)'); g.addColorStop(0.2, 'rgba(70,6,14,0.9)'); g.addColorStop(0.8, 'rgba(70,6,14,0.9)'); g.addColorStop(1, 'rgba(60,0,10,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 18, 768, 76);
    ctx.font = '900 46px Outfit, sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 8; ctx.strokeStyle = '#2a0006'; ctx.strokeText(name, 384, 72);
    ctx.fillStyle = '#ffe2c8'; ctx.fillText(name, 384, 72);
    const map = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, depthWrite: false }));
    sprite.position.set(pos.x, (pos.y ?? 0) + 3.8, pos.z); sprite.scale.set(7, 1.02, 1);
    addAnim(sprite, 1.4, p => { sprite.material.opacity = Math.min(1, p * 8, (1 - p) * 5); sprite.position.y = (pos.y ?? 0) + 3.8 + p * 0.3; });
}

/** Vòng / vạch cảnh báo đỏ trên đất cho tới lúc trúng */
function telegraph(shape, seconds) {
    if (shape.kind === 'line') {
        const len = Math.hypot(shape.toX - shape.x, shape.toZ - shape.z);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xff2a3c, transparent: true, depthWrite: false, fog: false }));
        m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(shape.toZ - shape.z, shape.toX - shape.x);
        m.position.set((shape.x + shape.toX) / 2, FLOOR + 0.03, (shape.z + shape.toZ) / 2);
        addAnim(m, seconds, p => { m.scale.set(len * Math.min(1, p * 3), shape.width, 1); m.material.opacity = 0.25 + 0.25 * Math.sin(p * Math.PI * 6) ** 2; });
        return;
    }
    const d = FB.decal('warn', shape.x, shape.z, shape.radius);
    addAnim(d, seconds, (p, fx) => { d.material.opacity = Math.min(1, p * 6) * (0.65 + 0.35 * Math.sin(fx.age * 14) ** 2); });
}

function stunStars(view, ms) {
    if (!view || !ms) return;
    loop(FB, FB.frames('stun', 0.9), ms / 1000, { fps: 14, follow: view, y: 3.2 });
}
function sealIcon(view, ms) {
    if (!view || !ms) return;
    loop(FB, FB.frames('seal', 1.1), ms / 1000, { fps: 10, follow: view, y: 3.5 });
}
/** Hiệu ứng bám người cho tới khi trạng thái hết (khiên đen Morwen / lời nguyền) */
function lasting(view, group, height, y, type, classId) {
    if (!view) return;
    let seen = false;
    const m = tint(FB.frames(group, height), classId);
    loop(FB, m, 7, { fps: 12, follow: view, y, until: () => {
        const on = (view.member?.statusEffects ?? []).some(e => e.type === type && (type !== 'boss_shield' || e.hp > 0));
        seen ||= on;
        return view.member?.alive === false || (seen && !on);
    } });
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

export function spawnBossWarning(d, seconds, context) {
    if (!context) { telegraph(d, seconds); return; }
    const { boss, allies = [], foes = [], shake } = context;
    const cls = boss?.member?.classId;
    const pos = boss?.position ?? d;
    let casts = boss && pending.get(boss);
    if (d.kind === 'warning') {
        const target = chooseTarget(foes, d.skill);
        if (boss) {
            if (!casts) { casts = new Map(); pending.set(boss, casts); }
            casts.set(d.skill, { target, summons: new Set(allies.filter(v => v?.member?.summon && v.member.alive).map(v => v.member.summonId)) });
        }
        for (const shape of d.shapes ?? []) telegraph(shape, seconds);
        if (target && ['pounce', 'curse'].includes(d.skill)) {   // đánh dấu người bị nhắm
            const mk = FB.decal('target', target.position.x, target.position.z, 1.1);
            addAnim(mk, seconds, (p, fx) => { mk.position.x = target.position.x; mk.position.z = target.position.z; mk.material.opacity = 0.6 + 0.4 * Math.sin(fx.age * 12) ** 2; });
        }
        if (d.skill === 'cry' && boss) loop(FB, tint(FB.frames('rage', 3), cls), seconds, { fps: 14, follow: boss });
        return;
    }
    const cast = casts?.get(d.skill); casts?.delete(d.skill);
    const hits = (d.effects ?? []).map(e => ({ e, view: foes[e.targetIndex] })).filter(h => h.view);
    for (const { e, view } of hits) { stunStars(view, e.stun); sealIcon(view, e.seal); }
    // gói sát thương theo thời gian (không có cảnh báo trước): chỉ nhỏ giọt, không phát lại cả chiêu
    if (!cast && !(d.shapes?.length) && ['pounce', 'pillars', 'curse'].includes(d.skill) && hits.length) return;
    const target = hits[0]?.view ?? cast?.target;
    switch (d.skill) {
    case 'howl': {
        once(FB, tint(place(FB.frames('howl', 4.6, { additive: true }), pos, 0.9), cls), 0.9, { follow: boss, y: 0.9 });
        shake?.();
        const watcher = new THREE.Group();   // chờ sói con xuất hiện -> bụi đỏ chỗ nó
        addAnim(watcher, 1.2, (p, fx) => {
            for (const v of context.getAllies?.() ?? allies) {
                if (cast && v?.member?.alive && v.member.bossOwner === d.casterIdx && !cast.summons.has(v.member.summonId)) {
                    grow(FB.decal('slam', v.position.x, v.position.z, 1.4), 0.6); fx.life = fx.age; break;
                }
            }
        });
        break;
    }
    case 'pounce':
        if (target) once(FB, tint(place(FB.frames('claw', 2.6, { additive: true }), target.position, 1.0, 0.7), cls), 0.5, { follow: target, y: 1.0 });
        break;
    case 'slam':
        grow(FB.decal('slam', d.x, d.z, (d.shapes?.[0]?.radius ?? 3.5) * 1.15), 1.0, 0.5); shake?.(); break;
    case 'cry':
        for (const ally of allies) if (ally?.member?.alive) loop(FB, tint(FB.frames('rage', 3), cls), 1.4, { fps: 14, follow: ally });
        break;
    case 'dash': {
        const line = d.shapes?.[0]; if (!line) break;
        const len = Math.hypot(line.toX - line.x, line.toZ - line.z);
        const m = tint(place(FB.frames('shadow', len / 3, { additive: true }), line, 1.0), cls);
        m.rotation.y = -Math.atan2(line.toZ - line.z, line.toX - line.x);
        once(FB, m, 0.55);
        break;
    }
    case 'shield': lasting(boss, 'dshield', 3.8, 0, 'boss_shield', cls); break;
    case 'pillars':
        for (const s of (d.shapes ?? []).slice(0, 3)) {
            once(FB, tint(place(FB.frames('pillar', 5.6, { additive: true }), s, 0, 0.9), cls), 1.15);
            grow(FB.decal('burn', s.x, s.z, s.radius * 1.1), 1.6, 0.8, { fadeAt: 0.4 });
        }
        shake?.(); break;
    case 'ring':
        grow(tint(FB.decal('firering', d.x, d.z, (d.shapes?.[0]?.radius ?? 4) * 1.15), cls), 1.0, 0.15); shake?.(); break;
    case 'curse': lasting(cast?.target ?? chooseTarget(foes, 'curse'), 'curse', 1.5, 3.1, 'boss_curse', cls); break;
    case 'drain':
        for (const { view } of hits.slice(0, 8)) {
            const w = tint(FB.frames('wisp', 0.9, { additive: true }), cls);
            const from = view.position.clone(), to = pos.clone ? pos.clone() : new THREE.Vector3(pos.x, 0, pos.z);
            loop(FB, w, 0.9, { fps: 16, update: (p) => {
                const k = p * p * (3 - 2 * p);
                w.position.set(from.x + (to.x - from.x) * k, FLOOR + 1.6 + Math.sin(p * Math.PI) * 1.4, from.z + (to.z - from.z) * k);
                w.rotation.z = Math.atan2(0, to.x - from.x) + (to.x < from.x ? Math.PI : 0);
            } });
        }
        break;
    }
}

// ============================================================
// TUYỆT KỸ VALDRIC — "Thánh Hỏa Phán Quyết": vòng phép + khiên lửa + vết nứt theo máu khiên + vỡ khiên / nổ
//   + khung trên màn hình (tên chiêu · thanh máu khiên · đếm ngược 5s · gợi ý dùng chiêu choáng)
// ============================================================
const slams = new Map();  // 'casterId:idx' -> chỗ bật nhảy của cú bổ Phán Quyết
const ults = new Map();   // 'casterId:idx' -> { circle, shield, crack, hud, endsAt, ratio }
let hudEl = null;
function hud() {
    if (hudEl) return hudEl;
    hudEl = document.createElement('div');
    hudEl.id = 'ult-hud';
    hudEl.innerHTML = `<b class="ult-name">🔥 THÁNH HỎA PHÁN QUYẾT</b>
        <div class="ult-bar"><i></i><span class="ult-hp"></span></div>
        <div class="ult-row"><span class="ult-time"></span><span class="ult-hint">Phá khiên trước khi hết giờ! Chiêu <b>choáng / hất / đẩy</b> phá khiên ×3</span></div>`;
    document.body.appendChild(hudEl);
    return hudEl;
}
function hudShow(text, cls) {
    const el = hud();
    el.className = `on ${cls ?? ''}`;
    if (text) el.querySelector('.ult-name').textContent = text;
}
function hudHide(delay = 0) {
    if (!hudEl) return;
    const el = hudEl;
    setTimeout(() => { if (![...ults.values()].length) el.className = ''; }, delay);
}
function hudUpdate(u) {
    const el = hud();
    el.querySelector('.ult-bar i').style.width = `${Math.max(0, u.ratio * 100)}%`;
    el.querySelector('.ult-hp').textContent = `Khiên ${Math.round(u.shield)} / ${u.shieldMax}`;
    const left = Math.max(0, (u.endsAt - performance.now()) / 1000);
    el.querySelector('.ult-time').textContent = `⏳ ${left.toFixed(1)}s`;
}
function endUlt(key) {
    const u = ults.get(key);
    if (!u) return null;
    ults.delete(key);
    u.alive = false;
    return u;
}

/** Sự kiện bossUlt từ server: { phase: start | shield | break | blast | cancel, ... } */
export function handleBossUlt(d, { boss, foes = [], shake, showDamage } = {}) {
    const key = `${d.casterId}:${d.casterIdx}`;
    if (d.phase === 'start') {
        endUlt(key);
        const u = { alive: true, shield: d.shield, shieldMax: d.shieldMax, ratio: 1, endsAt: performance.now() + (d.durationMs ?? 5000), flash: 0 };
        ults.set(key, u);
        const life = (d.durationMs ?? 5000) / 1000 + 1;
        const still = () => !u.alive;
        if (boss) {
            const ring = FB.decal('ucircle', boss.position.x, boss.position.z, 4.4);
            let ringEnd = -1;
            addAnim(ring, life, (p, fx) => {
                if (ringEnd < 0 && !u.alive) ringEnd = fx.age;
                const out = ringEnd < 0 ? 1 : 1 - (fx.age - ringEnd) / 0.3;
                ring.material.opacity = Math.min(1, fx.age * 4, out) * (0.8 + 0.2 * Math.sin(fx.age * 9));
                if (out <= 0) fx.life = fx.age;
            });
            // khiên nguyên (lặp) khi còn > 80% · dưới đó đổi sang khiên nứt 4 mức theo máu khiên
            const sh = UB.frames('ushield', 5.4, { additive: true }), dmg = UB.frames('ushieldDmg', 5.0, { additive: true });
            sh.userData.zOff = dmg.userData.zOff = 0.9;
            const flash = (m) => m.material.color.setRGB(1 + u.flash, 1 + u.flash * 0.6, 1 + u.flash * 0.4);
            loop(UB, sh, life, { fps: 10, follow: boss, until: still, update: () => {
                u.flash = Math.max(0, u.flash - 0.08); flash(sh);
                sh.visible = u.ratio > 0.8;
            } });
            loop(UB, dmg, life, { fps: 0, follow: boss, until: still, update: () => {
                flash(dmg); dmg.visible = u.ratio <= 0.8;
                UB.set(dmg, Math.min(3, Math.floor((0.8 - u.ratio) / 0.8 * 4)));
            } });
        }
        hudShow(`🔥 ${d.name ?? 'THÁNH HỎA PHÁN QUYẾT'}`.toUpperCase(), d.blast === 'kill' ? 'deadly' : '');
        const tick = new THREE.Group();   // cập nhật khung trên màn hình theo nhịp vẽ
        addAnim(tick, life + 1, (p, fx) => { if (!u.alive) { fx.life = fx.age; return; } hudUpdate(u); });
        return;
    }
    const u = ults.get(key);
    if (d.phase === 'shield' && u) {
        u.shield = d.shield; u.shieldMax = d.shieldMax; u.ratio = d.shieldMax ? d.shield / d.shieldMax : 0;
        if (d.cc) {   // chiêu khống chế trúng khiên: loé + mảnh vỡ nhỏ
            u.flash = 1;
            if (boss) once(UB, place(UB.frames('uhit', 2.2, { additive: true }), boss.position, 2.0, 1.2), 0.4);
            hud().classList.add('cc'); setTimeout(() => hudEl?.classList.remove('cc'), 300);
        }
        return;
    }
    if (d.phase === 'break') {
        endUlt(key);
        if (boss) {
            once(UB, place(UB.frames('ushatter', 6, { additive: true }), boss.position, 2.6, 1.2), 0.8);
            stunStars(boss, d.stunMs ?? 2500);
        }
        shake?.(0.2, 260);
        hudShow('💥 VỠ KHIÊN! Valdric bị choáng — dồn sát thương!', 'broke');
        hudHide(1800);
        return;
    }
    if (d.phase === 'leap') {
        // hết giờ phá khiên: khiên tan, Valdric bật vút lên trời rồi bổ xuống giữa đội địch (vòng đỏ = chỗ sắp nổ)
        endUlt(key);
        const live = foes.filter(v => v?.member?.alive !== false && v.root?.visible !== false);
        if (boss?.leapTo) {
            const from = boss.position.clone();
            const cx = live.length ? live.reduce((a, v) => a + v.position.x, 0) / live.length : from.x;
            const cz = live.length ? live.reduce((a, v) => a + v.position.z, 0) / live.length : from.z;
            const side = Math.sign(from.x - cx) || 1;
            const tx = cx + side * 1.2, tz = cz;   // đáp sát mép đội địch (không đè lên đầu)
            boss.facingLeft = tx < from.x;
            boss.leapTo(tx, tz, { duration: (d.slamMs ?? 900) / 1000, height: 4.5, apex: 0.7, hold: true });
            slams.set(key, { from, boss });
            telegraph({ x: tx, z: tz, radius: 6.5 }, (d.slamMs ?? 900) / 1000);
            once(FB, place(FB.frames('slam', 4.5, { additive: true }), from, 0.2), 0.6);   // bụi tung chỗ bật nhảy
        }
        shake?.(0.15, 250);
        hudShow('☠️ PHÁN QUYẾT GIÁNG XUỐNG!', 'blast');
        return;
    }
    if (d.phase === 'blast') {
        endUlt(key);
        const sl = slams.get(key); slams.delete(key);
        if (boss) {
            boss.playAction?.('attack');   // nhát bổ lúc chạm đất (dạng 2 tự đổi sang khung bùng lửa)
            once(UB, place(UB.frames('ublast', 10, { additive: true }), boss.position), 1.8);
            grow(FB.decal('ushock', boss.position.x, boss.position.z, 10), 1.1, 0.1);
            // bổ xong: nhảy về chỗ cũ (rồi theo lại vị trí server)
            if (sl && boss.leapTo) setTimeout(() => {
                const bx = boss._lastServerX ?? sl.from.x, bz = boss._lastServerZ ?? sl.from.z, face = boss.facingLeft;
                boss.facingLeft = bx < boss.position.x;
                boss.leapTo(bx, bz, { duration: 0.6, height: 3 });   // đáp xong tự theo lại vị trí server
                setTimeout(() => { boss.facingLeft = face; }, 650);
            }, 800);
        }
        for (const e of d.effects ?? []) {
            const v = foes[e.targetIndex];
            if (v) { once(UB, place(UB.frames('uhit', 2.6, { additive: true }), v.position, 1.2, 0.7), 0.55); showDamage?.(v, e); }
        }
        shake?.(0.45, 600);
        const flash = document.createElement('div'); flash.className = 'ult-flash'; document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 900);
        hudShow('☠️ PHÁN QUYẾT GIÁNG XUỐNG!', 'blast');
        hudHide(1600);
        return;
    }
    if (d.phase === 'cancel') {
        endUlt(key); hudHide(0);
        const sl = slams.get(key); slams.delete(key);   // bị huỷ giữa cú nhảy (VD gục -> dạng 2): đáp xong nhảy về chỗ server
        if (sl?.boss?.leapTo) setTimeout(() => sl.boss.leapTo(sl.boss._lastServerX ?? sl.from.x, sl.boss._lastServerZ ?? sl.from.z, { duration: 0.5, height: 2 }), 900);
    }
}
/** Hết trận / rời trận: dọn khung tuyệt kỹ */
export function clearBossUlt() { ults.clear(); slams.clear(); hudHide(0); }
