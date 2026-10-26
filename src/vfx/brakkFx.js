// ============================================================
// HIỆU ỨNG CUỒNG ĐẤU — Brakk (bản 3: đô vật tộc Rồng Đất – dung nham) — chạy khung (flipbook)
// ============================================================
// Hình lấy từ atlas brakk_fx2.webp (tools/fx_grid_pack.py art/brakk/fx2/fx2_spec.json — 6 tấm tranh AI của người dùng):
//   punchHit (đấm trúng 4, giữa = điểm trúng) · uppercut (móc ngược 4, đáy = mặt đất)
//   slamHit (quật đất nổ tung 4) · spikes (gai đá trồi 4) — đáy = mặt đất
//   giantRise (rồng đất bốc lên lúc hoá khổng lồ 4) · giantAura (hào quang khổng lồ 4 lặp) — quanh chỗ trống cỡ 1 nhân vật
//   warCry (tiếng hét: đầu rồng đá + sóng âm 4, gốc = miệng) · dome (khiên vảy rồng: hiện ra 2 + giữ lặp 2)
//   bloodSurge (cột máu rồng 4) · heal (hồi máu 4)
//   crater · ring · seal (vẽ nghiêng sẵn trên mặt đất) · shieldIcon · crown · tauntIcon · orb · dust (hình lẻ)
// Mọi hình vẽ nhìn sang PHẢI; nhìn trái thì lật gương (scale.x = -1). Mốc sát thương / thời gian do server + events.js quyết định.
// Màu bản 3: cam dung nham · hổ phách · đồng · đá (bỏ đỏ — đỏ là màu của Ignar, Zerith).
// Lớp đặt SAU lưng (z âm) nghiêng cùng góc với mặt phẳng nhân vật (camTilt) — không thì phần trên chồi ra trước đầu Brakk.
// Hình vẽ nghiêng sẵn trên mặt đất (hố nứt, vòng chấn động, ấn rồng) nằm PHẲNG, tâm đúng chân (flatDecal).
import * as THREE from 'three';
import fxUrl from '../assets/sprites/brakk_fx2.webp';
import FX from './brakkFx2.json';
import { textureView } from './texView.js';
import { gameTimeout } from '../config.js';
import { addAnim, fxPlane, glowTexture, easeOut, spawnHitSpark, spawnRisingSparkles, spawnLandingDust, fxBudget } from './vfx.js';
import { makeFlipbook, loopFrame, weighted, fadeInOut, FLOOR, camTilt } from './flipbook.js';

const FB = makeFlipbook(fxUrl, FX);
FB.tex('shieldIcon');   // tải atlas ngay khi vào game (khung đầu không bị trống)
const frames = FB.frames;
const setFx = FB.set;
const LAVA = 0xff8a1f, EMBER = 0xffb347, AMBER = 0xffc061, HEAL = 0xb7f28a;
const seqFrame = (p, w) => weighted(Math.min(0.999, Math.max(0, p)), w);
/** cao (đơn vị thế giới) để nhóm có bề NGANG `w` */
const hForW = (group, w) => w * FX.groups[group].size[1] / FX.groups[group].size[0];

function flash(pos, { color = LAVA, size = 1.4, y = 1.0, life = 0.22, z = 0.65 } = {}) {
    const c = fxPlane(glowTexture(), size, size, { color });
    c.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + z);
    addAnim(c, life, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.1); fx.mesh.material.opacity = 0.8 * (1 - p); });
}
/** Chạy 1 nhóm 4 khung (gốc nhóm đặt ở x, y, z), trọng số thời lượng `w` */
function playGroup(group, height, x, y, z, { dir = 1, life = 0.5, w = [0.6, 1, 1, 1.1], a = 0.04, b = 0.8, grow = 0, opacity = 1, additive = false, tilt = false } = {}) {
    const m = frames(group, height, { opacity: 0, additive });
    m.scale.x = dir;
    m.position.set(x, y, z);
    if (tilt) m.rotation.x = camTilt();   // lớp sau lưng: song song mặt phẳng nhân vật
    addAnim(m, life, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, w));
        const s = 1 + grow * easeOut(p);
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.material.opacity = opacity * fadeInOut(p, a, b);
    });
    return m;
}
/**
 * Hình vẽ nghiêng sẵn (hố nứt) NẰM PHẲNG trên mặt đất, điểm (giữa ; cy) của tranh đặt đúng gốc toạ độ.
 * Người đứng giữa hố che phần hố phía sau (nhân vật ghi chiều sâu) — không còn tấm hình dựng đứng trùm lên người.
 * Camera trận chúc ~15° ép mặt đất dẹt lại: hình được kéo sâu `deep` lần so với tỉ lệ tranh (2,4 -> trên màn hình còn ~3/4 chiều cao tranh).
 */
function flatDecal(group, width, { cy = 0.55, deep = 2.4, lift = 0.03, opacity = 1 } = {}) {
    const [w, h] = FX.groups[group].size;
    const D = width * h / w * deep;
    const geo = new THREE.PlaneGeometry(width, D);
    geo.translate(0, (cy - 0.5) * D, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: FB.tex(group, 0), transparent: true, depthWrite: false, fog: false, opacity, side: THREE.DoubleSide }));
    m.userData.sharedTexture = true;
    m.rotation.x = -Math.PI / 2;
    m.position.y = FLOOR + lift;
    return m;
}
/** Hố nứt dung nham đọng lại trên mặt đất, tâm hố đúng `pos` */
function spawnCrater(pos, { width = 3, life = 1.5, opacity = 1 } = {}) {
    const m = flatDecal('crater', width, { opacity: 0 });
    m.position.x = pos.x; m.position.z = pos.z ?? 0;
    addAnim(m, life, (p, fx) => { fx.mesh.material.opacity = opacity * fadeInOut(p, 0.05, 0.6); });
}
/** Vòng chấn động lan ra quanh `pos` (nằm phẳng trên đất, tâm đúng chân; to dần từ 30% tới bề rộng 2×radius rồi mờ) */
function spawnRing(pos, { radius = 3, life = 0.55, opacity = 0.95 } = {}) {
    const m = flatDecal('ring', radius * 2, { cy: 0.52, deep: 1.85, opacity: 0 });
    m.position.x = pos.x; m.position.z = pos.z ?? 0;
    addAnim(m, life, (p, fx) => {
        const k = 0.3 + 0.7 * easeOut(p);
        fx.mesh.scale.set(k, k, 1);
        fx.mesh.material.opacity = opacity * (p < 0.1 ? p / 0.1 : 1 - p);
    });
}
/** Ấn rồng đá dưới chân (hoá khổng lồ, tiếng hét, máu rồng) — nằm phẳng, tâm đúng chân */
function spawnSeal(pos, { width = 3.6, life = 1.1 } = {}) {
    const m = flatDecal('seal', width, { cy: 0.5, deep: 1.67, opacity: 0, lift: 0.025 });
    m.position.x = pos.x; m.position.z = pos.z ?? 0;
    addAnim(m, life, (p, fx) => {
        const k = 0.6 + 0.4 * easeOut(Math.min(1, p * 3));
        fx.mesh.scale.set(k, k, 1);
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : Math.min(1, p * 6);
    });
}

// ------------------------------------------------------------
// NHẢY / QUẬT / DẬM
// ------------------------------------------------------------
/** Bụi bật lên khi Brakk dậm nhảy (vệt bụi kéo về phía sau lưng) */
export function spawnBrakkLeapDust(pos, dir = 1) {
    const m = frames('dust', hForW('dust', 2.2), { opacity: 0 });
    m.scale.x = dir;   // tranh vệt bụi kéo sang TRÁI = phía sau lưng khi nhìn phải
    m.position.set(pos.x - dir * 0.5, FLOOR + 0.02, (pos.z ?? 0) + 0.4);
    addAnim(m, 0.5, (p, fx) => {
        const s = 0.8 + 0.4 * easeOut(p);
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.material.opacity = fadeInOut(p, 0.08, 0.5);
    });
    spawnLandingDust(pos, 6);
}

/**
 * Cú QUẬT xuống đất (Bá Vương Quật): nổ tung đá + dung nham (4 khung) + hố nứt đọng lại + vòng chấn động lan ra.
 * @param {{x,z}} pos điểm chạm   @param size độ to (Khổng Lồ: to hơn)   @param radius bán kính chấn động
 */
export function spawnBrakkSlam(pos, { size = 1, dir = 1, radius = 3, giant = false } = {}) {
    playGroup('slamHit', 2.3 * size, pos.x, FLOOR + 0.02, (pos.z ?? 0) + 0.6, { dir, life: 0.7, w: [0.45, 1, 1.2, 1.3], a: 0.02, b: 0.75 });
    spawnCrater(pos, { width: 3.0 * size, life: 1.6 });
    spawnRing(pos, { radius: radius * (giant ? 1 : 0.9), life: 0.55 });
    flash(pos, { color: LAVA, size: 2.0 * size, y: 0.4 });
    spawnHitSpark({ x: pos.x, y: -0.5, z: pos.z }, { count: fxBudget(10, 3), color: EMBER, size: 1.3 * size });
    spawnLandingDust(pos, 12);
}

/** Chấn Địa: vòng chấn động lan trên đất + hố nứt dưới chân + cụm gai đá trồi lên quanh Brakk */
export function spawnStompWave(pos, { radius = 4, giant = false } = {}) {
    spawnRing(pos, { radius: radius * 1.05, life: 0.65 });
    spawnCrater(pos, { width: 3.2, life: 1.4 });
    // gai đá trồi ở HAI BÊN Brakk (xen kẽ trái/phải, cách ≥ nửa bán kính) — không trồi ngay trước người kẻo che mất Brakk
    const n = fxBudget(giant ? 7 : 5, 3);
    for (let k = 0; k < n; k++) {
        const side = k % 2 ? -1 : 1;
        const at = { x: pos.x + side * radius * (0.5 + 0.4 * Math.random()), z: (pos.z ?? 0) + radius * (Math.random() - 0.6) * 0.5 };
        gameTimeout(() => playGroup('spikes', 1.5 + Math.random() * 0.5, at.x, FLOOR + 0.02, at.z + 0.3,
            { dir: side, life: 0.75, w: [0.5, 0.9, 1.2, 1.1], a: 0.03, b: 0.75 }), 30 + k * 35);
    }
    flash(pos, { color: LAVA, size: 2.0, y: 0.3 });
    spawnLandingDust(pos, 14);
}

/** Quái bị hất tung rơi xuống đất: bụi + đá vụn nhỏ */
export function spawnFallImpact(pos) {
    spawnCrater(pos, { width: 1.5, life: 0.8 });
    spawnHitSpark({ x: pos.x, y: -0.6, z: pos.z }, { count: fxBudget(6, 2), color: EMBER, size: 0.9 });
    spawnLandingDust(pos, 5);
}

// ------------------------------------------------------------
// ĐẤM · MÓC NGƯỢC
// ------------------------------------------------------------
/**
 * Cú đấm thường: nổ đá + tia dung nham (4 khung) ngay chỗ nắm đấm chạm.
 * @param at điểm nắm đấm trong tranh (view.pointWorld('fist')) — không có thì lấy ngực mục tiêu
 */
export function spawnPunchHit(pos, dir = 1, { crit = false, giant = false, at = null } = {}) {
    const s = (crit ? 1.3 : 1) * (giant ? 1.3 : 1);
    const p = at ? { x: at.x + dir * 0.15, y: at.y, z: (at.z ?? pos.z ?? 0) } : { x: pos.x - dir * 0.25, y: (pos.y ?? 0) + FLOOR + 1.55, z: pos.z ?? 0 };
    playGroup('punchHit', 1.25 * s, p.x, p.y, p.z + 0.7, { dir, life: 0.36, w: [0.45, 1, 1, 0.9], a: 0.02, b: 0.7 });
    if (crit) flash({ x: p.x, y: p.y, z: p.z }, { color: AMBER, size: 1.6, y: 0, life: 0.2 });
}

/** Móc ngược (Khổng Lồ): vệt dung nham cong vút lên + đá bắn tung dưới chân mục tiêu */
export function spawnUppercut(pos, dir = 1) {
    playGroup('uppercut', 2.6, pos.x - dir * 0.3, FLOOR + 0.02, (pos.z ?? 0) + 0.7, { dir, life: 0.6, w: [0.5, 1, 1.1, 1.1], a: 0.02, b: 0.75 });
    flash(pos, { color: AMBER, size: 1.6, y: 1.2 });
    spawnHitSpark(pos, { count: fxBudget(10, 3), color: EMBER, size: 1.3 });
}

// ------------------------------------------------------------
// THẦN LỰC KHỔNG LỒ · KHIÊN · VƯƠNG MIỆN
// ------------------------------------------------------------
/** Hoá Khổng Lồ: rồng đất bốc lên xoắn quanh người (4 khung) + ấn rồng dưới chân + vòng chấn động */
export function spawnGiantTransform(pos, dir = 1) {
    playGroup('giantRise', 4.3, pos.x, FLOOR + 0.02, (pos.z ?? 0) - 0.3, { dir, life: 1.0, w: [0.6, 1, 1.1, 1.2], a: 0.04, b: 0.72, tilt: true });
    spawnSeal(pos, { width: 4.4, life: 1.2 });
    spawnRing(pos, { radius: 3.6, life: 0.6 });
    flash(pos, { color: LAVA, size: 2.4, y: 1.4, life: 0.3 });
    spawnRisingSparkles(pos, { count: fxBudget(18, 5), color: EMBER, radius: 1.5 });
}

/** Khiên vảy rồng (Chấn Địa / Khí Thế Đấu Trường): biểu tượng khiên bật lên trên đầu + vòm vảy hiện ra nhanh */
export function spawnBrakkShieldPop(pos, { height = 3.2 } = {}) {
    const icon = frames('shieldIcon', 0.95);
    icon.position.set(pos.x, FLOOR + height + 0.45, (pos.z ?? 0) + 0.9);
    const y0 = icon.position.y;
    addAnim(icon, 1.0, (p, fx) => {
        const s = p < 0.15 ? 0.4 + easeOut(p / 0.15) * 0.8 : 1.2 - 0.2 * Math.min(1, (p - 0.15) / 0.2);
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.position.y = y0 + 0.35 * p;
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 1;
    });
    // vòm hiện ra (khung 1 -> 2 -> 3) rồi nhường cho vòm giữ (makeBrakkBubble): lớp vảy SAU lưng + ánh cộng sáng phía trước
    // (không trùm lớp vảy thường lên người — Brakk vẫn rõ)
    const H = height * 1.05;
    const d = frames('dome', H, { opacity: 0 });
    d.position.set(pos.x, FLOOR + 0.02, (pos.z ?? 0) - 0.4);
    d.rotation.x = camTilt();
    addAnim(d, 0.5, (p, fx) => { setFx(fx.mesh, seqFrame(p, [1, 1, 1.2])); fx.mesh.material.opacity = 0.9 * fadeInOut(p, 0.08, 0.6); });
    const sh = frames('dome', H, { opacity: 0, additive: true });
    sh.position.set(pos.x, FLOOR + 0.02, (pos.z ?? 0) + 0.5);
    addAnim(sh, 0.5, (p, fx) => { setFx(fx.mesh, seqFrame(p, [1, 1, 1.2])); fx.mesh.material.opacity = 0.45 * fadeInOut(p, 0.06, 0.35); });
}

/** Vòm khiên vảy rồng bao quanh Brakk khi còn khiên (gắn vào view, độ rõ theo máu khiên) — lớp sau người + ánh cộng sáng mờ phía trước */
export function makeBrakkBubble(height = 3.2) {
    const g = new THREE.Group();
    const back = frames('dome', height * 1.05, { opacity: 0 });
    back.position.set(0, 0.02, -0.4);   // nghiêng theo camera mỗi khung (update)
    const sheen = frames('dome', height * 1.05, { opacity: 0, additive: true });
    sheen.position.set(0, 0.02, 0.5);
    g.add(back, sheen);
    let t = 0;
    return {
        group: g,
        update(dt, k, frac = 1, scale = 1) {
            t += dt;
            const f = 2 + loopFrame(t, 3, 2);
            setFx(back, f); setFx(sheen, f);
            back.rotation.x = camTilt();
            back.material.opacity = k * (0.45 + 0.4 * frac);
            sheen.material.opacity = k * (0.08 + 0.12 * frac) * (0.85 + 0.15 * Math.sin(t * 4));
            g.scale.setScalar(scale * (1 + 0.012 * Math.sin(t * 3)));
        },
        dispose() { g.parent?.remove(g); },
    };
}

/** Hào quang khổng lồ (cả Độc Long, bản nhạt): 4 khung lặp sau lưng + ấn rồng dưới chân + quầng cam */
export function makeGiantAura() {
    const g = new THREE.Group();
    const H = 3.5;
    const aura = frames('giantAura', H, { opacity: 0 });
    aura.position.set(0, 0.02, -0.45);   // sau lưng: nghiêng theo camera mỗi khung (update)
    const seal = flatDecal('seal', 2.6, { cy: 0.5, deep: 1.67, opacity: 0 });
    seal.position.set(0, 0.05, 0);    // nằm phẳng dưới chân (nhóm đặt ở mặt đất của view)
    const glow = fxPlane(glowTexture(), 4.2, 4.2, { color: LAVA, opacity: 0 });
    glow.position.set(0, 1.7, -0.5);
    g.add(glow, seal, aura);
    let t = 0;
    return {
        group: g,
        update(dt, k, scale = 1) {
            t += dt;
            setFx(aura, loopFrame(t, 7, 4));
            aura.rotation.x = camTilt();
            aura.material.opacity = 0.7 * k;
            seal.material.opacity = 0.55 * k * (0.85 + 0.15 * Math.sin(t * 5));
            glow.material.opacity = 0.1 * k * (0.8 + 0.2 * Math.sin(t * 6));
            g.scale.setScalar(scale);
        },
        dispose() { g.parent?.remove(g); [seal, aura].forEach(m => { m.geometry.dispose(); m.material.dispose(); }); },
    };
}

/** 5 giây đầu Khổng Lồ MIỄN KHỐNG CHẾ: vương miện vảy rồng sáng trên đầu */
export function makeImmuneCrown() {
    const m = frames('crown', 0.75, { opacity: 0 });
    let t = 0;
    return {
        mesh: m,
        update(dt, k) { t += dt; m.material.opacity = k * (0.85 + 0.15 * Math.sin(t * 8)); m.scale.setScalar(1 + 0.05 * Math.sin(t * 5)); },
        dispose() { m.parent?.remove(m); },
    };
}

// ------------------------------------------------------------
// TIẾNG HÉT BẢO HỘ · LONG HUYẾT · HỒI MÁU
// ------------------------------------------------------------
/**
 * Tiếng Hét Bảo Hộ (thiên phú 1): từ miệng Brakk loé lên -> ĐẦU RỒNG ĐÁ gầm lao ra trước + sóng âm toả xa (4 khung),
 * ấn rồng sáng dưới chân + vòng chấn động lan ra.
 * @param at điểm miệng trong tranh (view.pointWorld('mouth')) — không có thì ước theo chiều cao
 * Gốc tranh = hàm rồng; đầu rồng chiếm ~0,45H phía sau gốc -> gốc đặt TRƯỚC miệng 0,35H rồi lao tới 0,75H
 * (đầu rồng hiện trước mặt Brakk, không đè lên mặt).
 */
export function spawnBattleCry(pos, dir = 1, { height = 3, at = null } = {}) {
    const k = height / 2.9;
    const mouth = at ? { x: at.x, y: at.y } : { x: pos.x + dir * 0.45 * k, y: FLOOR + height * 0.8 };
    const H = 2.4 * k;
    const m = frames('warCry', H, { opacity: 0 });
    m.position.set(mouth.x + dir * 0.35 * H, mouth.y, (pos.z ?? 0) + 0.85);
    addAnim(m, 0.8, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.5, 1, 1.2, 1.2]));
        const e = easeOut(p), s = 0.9 + 0.25 * e;
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.position.x = mouth.x + dir * (0.35 + 0.4 * e) * H;
        fx.mesh.material.opacity = fadeInOut(p, 0.04, 0.75);
    });
    spawnSeal(pos, { width: 3.4 * k, life: 1.1 });
    spawnRing(pos, { radius: 3.6, life: 0.7, opacity: 0.8 });
}

/** Dấu khiêu khích "!" (đá nứt dung nham) trên đầu đối thủ bị Brakk khiêu khích — bám theo người trong `life` giây */
export function spawnCryIcon(view, { life = 3, y = null } = {}) {
    const m = frames('tauntIcon', 0.8);
    const y0 = y ?? (view.height ?? 2.9) + 0.25;
    m.position.set(0, y0, 0.35);
    addAnim(m, life, (p, fx) => {
        const t = p * life;
        const pop = t < 0.18 ? 0.3 + easeOut(t / 0.18) * 1.0 : 1.3 - 0.3 * Math.min(1, (t - 0.18) * 5);
        fx.mesh.scale.set(pop, pop, 1);
        fx.mesh.position.y = y0 + 0.06 * Math.sin(t * 6) + (view._lift ?? 0);
        fx.mesh.material.opacity = p > 0.85 ? (1 - p) / 0.15 : 1;
    }, view.root);
}

/** Thiên phú Long Huyết Bất Khuất: cột máu rồng (rồng đất xoắn quanh cột dung nham) bùng trên Brakk + ấn rồng */
export function spawnBloodSurge(pos) {
    playGroup('bloodSurge', 4.0, pos.x, FLOOR + 0.02, (pos.z ?? 0) - 0.25, { life: 1.0, w: [0.6, 1, 1.2, 1.1], a: 0.04, b: 0.72, tilt: true });
    spawnSeal(pos, { width: 3.6, life: 1.1 });
    spawnRisingSparkles(pos, { count: fxBudget(16, 4), color: EMBER, radius: 1.2 });
}
/** Hồi máu (thiên phú) trên 1 người: ánh hổ phách – xanh lá bốc lên (4 khung) + Orb bay lên (khi được +Orb).
 *  Lớp tranh đặt SAU người + lớp cộng sáng mờ phía trước -> người được hồi vẫn rõ (không bị tranh che kín). */
export function spawnBrakkHeal(pos, { orb = false } = {}) {
    const o = { life: 0.9, w: [0.7, 1, 1.1, 1], a: 0.06, b: 0.7 };
    playGroup('heal', 2.5, pos.x, FLOOR + 0.02, (pos.z ?? 0) - 0.3, { ...o, tilt: true });
    playGroup('heal', 2.5, pos.x, FLOOR + 0.02, (pos.z ?? 0) + 0.5, { ...o, additive: true, opacity: 0.55 });
    spawnRisingSparkles(pos, { count: fxBudget(8, 2), color: HEAL, radius: 0.8 });
    if (!orb) return;
    const ob = frames('orb', 0.7);
    ob.position.set(pos.x, FLOOR + 2.3, (pos.z ?? 0) + 0.9);
    const y0 = ob.position.y;
    addAnim(ob, 1.0, (p, fx) => {
        fx.mesh.position.y = y0 + 0.6 * easeOut(p);
        fx.mesh.scale.setScalar(p < 0.15 ? 0.3 + p / 0.15 * 0.7 : 1);
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 1;
    });
}

/** Quái bị Brakk túm: đi theo cung nhảy của Brakk (trên đầu Brakk) rồi bị quật xuống điểm `to` */
export function arcCarry(view, from, to, { duration = 0.8, height = 3.2 } = {}) {
    if (!view?.leapTo) return;
    // nhấc lên qua đầu (nửa đầu), rơi cắm xuống (nửa sau): dùng 2 chặng leapTo
    const mid = { x: from.x + (to.x - from.x) * 0.45, z: from.z + (to.z - from.z) * 0.45 };
    view.leapTo(mid.x, mid.z, { duration: duration * 0.62, height: height * 0.8 });
    gameTimeout(() => view.leapTo(to.x, to.z, { duration: duration * 0.38, height: height * 0.35 }), duration * 620);
}
