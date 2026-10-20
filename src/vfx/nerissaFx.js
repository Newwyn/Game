// ============================================================
// HIỆU ỨNG THỦY VŨ — Nerissa (bản 3) — chạy khung (flipbook)
// ============================================================
// Hình lấy từ atlas nerissa_fx2.webp (tools/fx_grid_pack.py art/nerissa/fx2/fx2_spec.json — 5 tấm tranh AI của người dùng):
//   dropFly (giọt nước bay 4 lặp) · splash (nước bắn tung 4)
//   danceWave (vòng sóng vào điệu 4) · healRain (mưa hồi máu 4 lặp)
//   goddessRise (Thủy Thần hiện ra 4) · goddessHold (Thủy Thần giữ 4 lặp)
//   bubble (bong bóng giáp nước: khung 1 thành hình, 2-4 lặp) · note1..4 (nốt đơn, 2 nốt nối, nốt đen, khoá Sol)
//   tideRing · lotusRing (vòng thủy triều / hoa sen, vẽ nghiêng sẵn) · manaRise · orbGift · mdefDown · atkUp · orbDrain · cleanse
// Mọi hình vẽ nhìn sang PHẢI; nhìn trái thì lật gương (scale.x = -1). Mốc sát thương / thời gian do server + events.js quyết định.
import * as THREE from 'three';
import fxUrl from '../assets/sprites/nerissa_fx2.webp';
import FX from './nerissaFx2.json';
import { textureView } from './texView.js';
import { addAnim, fxPlane, glowTexture, easeOut, spawnShockwave, spawnRisingSparkles } from './vfx.js';
import { makeFlipbook, loopFrame, weighted, fadeInOut, FLOOR } from './flipbook.js';

const FB = makeFlipbook(fxUrl, FX);
FB.tex('dropFly');   // tải atlas ngay khi vào game (khung đầu không bị trống)
const frames = FB.frames, setFx = FB.set;
const AQUA = 0x5eead4, WATER = 0x38bdf8;
const seqFrame = (p, w) => weighted(Math.min(0.999, Math.max(0, p)), w);

/** Phần ĐÁY (tỉ lệ `frac`) của 1 hình vòng vẽ nghiêng — đặt TRƯỚC nhân vật để vòng "ôm" quanh chân (nửa sau đặt sau lưng) */
function frontArc(group, height, frac, { opacity = 1 } = {}) {
    const g = FX.groups[group];
    const [w, h] = g.size, [px, py] = g.pivot, u = height / h;
    const geo = new THREE.PlaneGeometry(w * u, h * frac * u);
    geo.translate((w / 2 - px) * u, (py - h + (h * frac) / 2) * u, 0);
    const t = textureView(FB.tex(group, 0));
    t.repeat.y *= frac;
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false, opacity, side: THREE.DoubleSide }));
    m.userData.sharedTexture = true;
    return m;
}
/** Loé sáng cộng màu (quầng phụ) */
function flash(pos, { color = AQUA, size = 1.4, y = 1.0, life = 0.25, z = 0.65 } = {}) {
    const c = fxPlane(glowTexture(), size, size, { color });
    c.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + z);
    addAnim(c, life, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.1); fx.mesh.material.opacity = 1 - p; });
}
/** 1 hình lẻ bật lên rồi mờ (biểu tượng buff / debuff, Orb...) */
function pop(group, pos, { size = 1, life = 0.6, y = 1.0, z = 0.7, grow = 0.25, rise = 0, opacity = 1 } = {}) {
    const m = frames(group, size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + z);
    const y0 = m.position.y;
    addAnim(m, life, (p, fx) => {
        const s = 0.55 + easeOut(Math.min(1, p / 0.25)) * (0.45 + grow * p);
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.position.y = y0 + rise * p;
        fx.mesh.material.opacity = opacity * fadeInOut(p, 0.08, 0.65);
    });
    return m;
}

// ------------------------------------------------------------
// ĐÁNH THƯỜNG: giọt nước bay ra từ đầu dải lụa -> trúng thì nước bắn tung
// ------------------------------------------------------------
/** Giọt nước bay (4 khung lặp) từ `from` tới `to` (vòng cung nhẹ), chạm thì gọi onHit */
export function spawnWaterBolt(from, to, { duration = 0.18, onHit } = {}) {
    const m = frames('dropFly', 0.5);
    const glow = fxPlane(glowTexture(), 0.75, 0.75, { color: WATER, opacity: 0.45 });
    const g = new THREE.Group();
    g.add(glow, m);
    const dx = to.x - from.x, dy = (to.y ?? 1) - (from.y ?? 1), left = dx < 0;
    m.scale.x = left ? -1 : 1;
    const z0 = (from.z ?? 0) + 0.1, z1 = (to.z ?? 0) + 0.6;
    const ph = Math.random() * 4;
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        const arc = Math.sin(p * Math.PI) * 0.3;
        fx.mesh.position.set(from.x + dx * p, (from.y ?? 1) + dy * p + arc, z0 + (z1 - z0) * p);
        // nghiêng theo hướng bay (đạo hàm vòng cung)
        const slope = (dy + Math.cos(p * Math.PI) * 0.3 * Math.PI) / Math.max(0.5, Math.abs(dx));
        m.rotation.z = Math.atan(slope) * (left ? -1 : 1) * 0.7;
        setFx(m, loopFrame(p * duration, 18, 4, ph));
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}
/** Nước bắn tung (4 khung): mặc định trên ngực mục tiêu; ground: true -> trên mặt đất (dừng điệu múa) */
export function spawnSplash(pos, { size = 1.1, ground = false } = {}) {
    const H = 1.25 * size;
    const m = frames('splash', H, { opacity: 0 });
    m.position.set(pos.x, ground ? FLOOR + 0.02 : (pos.y ?? 0) + 0.2, (pos.z ?? 0) + 0.65);
    addAnim(m, 0.42, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.7, 1, 1, 1.1]));
        fx.mesh.material.opacity = fadeInOut(p, 0.05, 0.8);
    });
    flash(pos, { size: 0.9 * size, y: ground ? 0.3 : 0.75, life: 0.2 });
}

// ------------------------------------------------------------
// VÀO ĐIỆU MÚA (mọi điệu): vòng sóng nước bung quanh Nerissa lúc xoay (khung chính 0,3s)
// ------------------------------------------------------------
export function spawnDanceStart(pos, dance, dir = 1) {
    const H = dance === 3 ? 3.4 : 3.0;
    const m = frames('danceWave', H, { opacity: 0 });
    m.position.set(pos.x, FLOOR, (pos.z ?? 0) + 0.35);
    m.scale.x = dir;
    addAnim(m, 0.8, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.8, 1.1, 1, 1.2]));
        fx.mesh.material.opacity = 0.92 * fadeInOut(p, 0.06, 0.75);
    });
    if (dance === 1) spawnManaRise(pos, { size: 1.4, opacity: 0.9 });                 // Sóng Triều: MP bay lên
    if (dance === 2) spawnHealRain(pos);                                                // Lưu Thủy: mưa hồi máu
    if (dance === 3) spawnShockwave(pos, { color: AQUA, radius: 4, life: 0.6 });        // Thủy Thần Vũ: sóng lan (Thủy Thần hiện sau lưng — makeGoddessAura)
    flash(pos, { size: 2.2, y: 1.2 });
}

/** Sóng Triều: giọt MP bay lên trên đồng đội (mỗi nhịp nhận MP) */
export function spawnManaRise(pos, { size = 1.5, opacity = 0.85 } = {}) {
    const H = 1.7 * size;
    const m = frames('manaRise', H, { opacity: 0 });
    m.position.set(pos.x, FLOOR, (pos.z ?? 0) + 0.5);
    addAnim(m, 0.9, (p, fx) => {
        fx.mesh.position.y = FLOOR + 0.5 * easeOut(p);
        fx.mesh.scale.set(1, 0.85 + 0.25 * easeOut(p), 1);
        fx.mesh.material.opacity = opacity * fadeInOut(p, 0.15, 0.55);
    });
}
/** Lưu Thủy: mưa nước hồi máu rơi trên đồng đội (mây + giọt nước + cánh hoa, 4 khung lặp) */
export function spawnHealRain(pos) {
    // cao hơn người một chút: mây nằm trên đầu, mưa rơi phủ người (mờ vừa để vẫn thấy mặt)
    const m = frames('healRain', 3.7, { opacity: 0 });
    m.position.set(pos.x, FLOOR, (pos.z ?? 0) + 0.45);
    const ph = Math.random() * 4;
    addAnim(m, 0.95, (p, fx) => {
        setFx(fx.mesh, loopFrame(p * 0.95, 9, 4, ph));
        fx.mesh.material.opacity = 0.72 * fadeInOut(p, 0.12, 0.7);
    });
}

// ------------------------------------------------------------
// CẢ 3 ĐIỆU: nốt nhạc bay tới đối thủ (−M.DEF) / đồng đội (+sát thương phép, giải khống chế)
// ------------------------------------------------------------
/** Nốt nhạc bay từ Nerissa tới `getTo()` (đối thủ: nốt đơn / 2 nốt / nốt đen ; đồng đội: khoá Sol) */
export function spawnNote(from, getTo, { ally = false, duration = 0.35, kind = 0, onHit } = {}) {
    const name = ally ? 'note4' : 'note' + (1 + (kind % 3));
    const m = frames(name, ally ? 0.7 : 0.8);
    const a = { x: from.x, y: (from.y ?? 0) + 2.2, z: (from.z ?? 0) + 0.9 };
    const lift = 0.8 + Math.random() * 0.8;
    addAnim(m, duration, (p, fx) => {
        const t = getTo();
        const b = { x: t.x, y: (t.y ?? 0) + 1.4, z: (t.z ?? 0) + 0.9 };
        const e = easeOut(p);
        fx.mesh.position.set(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e + Math.sin(p * Math.PI) * lift, a.z + (b.z - a.z) * e);
        fx.mesh.rotation.z = Math.sin(p * 10) * 0.25;
        fx.mesh.material.opacity = p > 0.85 ? (1 - p) / 0.15 : 1;
        if (p >= 1 && onHit) { const f = onHit; onHit = null; f(); }
    });
}
/** Nốt nhạc trúng: biểu tượng −M.DEF (đối thủ) / +sát thương (đồng đội) trên đầu */
export function spawnNoteMark(pos, ally = false) {
    pop(ally ? 'atkUp' : 'mdefDown', pos, { size: 0.75, life: 0.9, y: 3.0, rise: 0.35 });
}
/** Giải khống chế: xiềng xích nước tối vỡ tan thành giọt nước */
export function spawnCleanseChains(pos) {
    pop('cleanse', pos, { size: 1.6, life: 0.6, y: 0.8, grow: 0.35 });
}
/** Hòa Âm 2+3: Orb đối thủ bị xoáy nước hút đi */
export function spawnOrbDrain(pos) {
    pop('orbDrain', pos, { size: 1.15, life: 0.8, y: 2.6, rise: -0.4 });
}
/** Hòa Âm 1+2: giáp nước vừa xuất hiện (bong bóng thành hình) */
export function spawnWaterShieldPop(pos, { height = 2.9 } = {}) {
    const m = frames('bubble', height * 1.2, { opacity: 0 });
    m.position.set(pos.x, FLOOR, (pos.z ?? 0) + 0.5);
    addAnim(m, 0.5, (p, fx) => {
        setFx(fx.mesh, p < 0.5 ? 0 : 1);
        const s = 0.8 + easeOut(p) * 0.25;
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.material.opacity = 0.6 * fadeInOut(p, 0.1, 0.6);
    });
}
/** Orb cả đội (Hòa Âm 1+2+3 / Triều Dâng): Orb xanh vàng bung sáng + MP bay lên */
export function spawnOrbGift(pos) {
    pop('orbGift', pos, { size: 1.0, life: 0.8, y: 2.5, rise: 0.4 });
    spawnManaRise(pos, { size: 1.1, opacity: 0.7 });
    spawnRisingSparkles(pos, { count: 10, color: WATER, radius: 0.8 });
}

// ------------------------------------------------------------
// HIỆU ỨNG BÁM NGƯỜI (CutoutCharacterView._updateWaterFx gắn vào view, gốc ở mặt đất) — update(dt, k) với k = độ hiện 0..1
// ------------------------------------------------------------
/** Bong bóng giáp nước quanh 1 nhân vật khi còn giáp (sáng theo máu giáp còn lại) */
export function makeWaterBubble(height = 2.9) {
    const g = new THREE.Group();
    const dome = frames('bubble', height * 1.2, { opacity: 0, frame: 1 });
    dome.position.set(0, -0.06, 0.5);
    g.add(dome);
    let t = 0;
    return {
        group: g,
        update(dt, k, frac = 1) {
            t += dt;
            setFx(dome, 1 + loopFrame(t, 3, 3));
            dome.material.opacity = k * (0.22 + 0.28 * frac);   // còn thấy rõ người bên trong
        },
        dispose() { g.parent?.remove(g); },
    };
}
/** Thủy Thần Vũ: nữ thần nước hiện ra sau lưng Nerissa (4 khung) rồi giữ lặp suốt điệu múa */
export function makeGoddessAura() {
    const g = new THREE.Group();
    const H = 4.6;
    const god = frames('goddessRise', H, { opacity: 0 });
    god.position.set(0, -0.08, -0.7);
    g.add(god);
    let t = 0, hold = null;
    return {
        group: g,
        update(dt, k) {
            t += dt;
            if (t < 0.8) { setFx(god, seqFrame(t / 0.8, [1, 1, 0.9, 1.1])); god.material.opacity = 0.95 * k; return; }
            if (!hold) { hold = frames('goddessHold', H, { opacity: 0 }); hold.position.copy(god.position); g.remove(god); g.add(hold); }
            setFx(hold, loopFrame(t, 4, 4));
            hold.material.opacity = 0.9 * k;
        },
        dispose() { g.parent?.remove(g); },
    };
}
/** Sóng Triều / Lưu Thủy: vòng thủy triều / vòng hoa sen dưới chân Nerissa suốt điệu múa (nửa sau sau lưng, vành trước trước chân) */
export function makeDanceRing(group = 'tideRing') {
    const g = new THREE.Group();
    const W = group === 'lotusRing' ? 2.6 : 2.8;
    const sz = FX.groups[group].size, H = (W * sz[1]) / sz[0];
    // gốc hình = đáy giữa: đáy chạm đất (phần dưới mặt đất sẽ bị cỏ che) -> vành trước nằm ngay trước chân
    const back = frames(group, H, { opacity: 0 });
    const front = frontArc(group, H, 0.32, { opacity: 0 });
    back.position.set(0, FLOOR + 0.01, -0.35);
    front.position.set(0, FLOOR + 0.01, 0.35);
    g.add(back, front);
    let t = 0;
    return {
        group: g,
        update(dt, k) {
            t += dt;
            const s = 1 + 0.03 * Math.sin(t * 2.4);
            back.scale.set(s, s, 1); front.scale.set(s, s, 1);
            back.material.opacity = 0.85 * k;
            front.material.opacity = 0.85 * k;
        },
        dispose() { g.parent?.remove(g); },
    };
}
/** Cả 3 điệu: 4 nốt nhạc nước bay vòng quanh Nerissa */
export function makeNoteHalo() {
    const g = new THREE.Group();
    const notes = ['note1', 'note2', 'note3', 'note4'].map(n => { const m = frames(n, 0.55, { opacity: 0 }); g.add(m); return m; });
    let t = 0;
    return {
        group: g,
        update(dt, k) {
            t += dt;
            notes.forEach((n, i) => {
                const a = t * 1.8 + (i / notes.length) * Math.PI * 2;
                n.position.set(Math.cos(a) * 1.2, 1.4 + Math.sin(a * 2) * 0.5, Math.sin(a) * 0.6 + 0.3);
                n.material.opacity = k * (0.6 + 0.4 * (Math.sin(a) * 0.5 + 0.5));
            });
        },
        dispose() { g.parent?.remove(g); },
    };
}
