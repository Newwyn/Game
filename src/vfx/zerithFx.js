// ============================================================
// HIỆU ỨNG U MINH — Zerith (bản 3: thiếu niên quỷ tộc dẫn hồn, lưỡi hái trắng xương mép đỏ thẫm) — chạy khung (flipbook)
// ============================================================
// Hình lấy từ atlas zerith_fx2.webp (tools/fx_grid_pack.py art/zerith/fx2/fx2_spec.json — 6 tấm tranh AI của người dùng):
//   slash (vệt chém lưỡi hái 4) · rend (xé hồn 4: loé · chém + hồn bị xé · hồn bay lên · tan)
//   reapUp (quét hất lên 4, đáy = mặt đất) · slamDown (bổ xuống 4: cung trên cao · bổ · nứt đất · tan)
//   phForm (lưỡi hái khổng lồ hiện ra 4) · phHold (giữ lặp 4) — cùng gốc = chỗ NẮM trên cán
//   gIn (Hộ Vệ Thần Chết hiện ra 4) · gPose (đứng · giương liềm · chém ngang · chém bổ) — cùng gốc = đáy giữa áo choàng
//   exec (nhát chém phán quyết 4) · nightAura (hào quang + cánh bóng tối Đêm Tử Thần 4 lặp, đáy = mặt đất)
//   deathMark · summonCircle (vòng vẽ nghiêng sẵn) · dashTrail · souls · hourglass · shatter · freeDash · groundCrack (hình lẻ)
// Mọi hình vẽ nhìn sang PHẢI; nhìn trái thì lật gương (scale.x = -1). Mốc sát thương / thời gian do server + events.js quyết định.
// Màu bản 3: đỏ thẫm · đen khói · trắng xương (bỏ tím — tím là màu của Jessica).
import * as THREE from 'three';
import fxUrl from '../assets/sprites/zerith_fx2.webp';
import FX from './zerithFx2.json';
import { textureView } from './texView.js';
import { gameTimeout } from '../config.js';
import { addAnim, fxPlane, glowTexture, easeOut, spawnHitSpark, spawnShockwave, spawnRisingSparkles, fxBudget } from './vfx.js';
import { makeFlipbook, loopFrame, weighted, fadeInOut, FLOOR } from './flipbook.js';

const FB = makeFlipbook(fxUrl, FX);
FB.tex('deathMark');   // tải atlas ngay khi vào game (khung đầu không bị trống)
export const zerithFrames = FB.frames;
const setFx = FB.set;
const CRIMSON = 0xe11d48, BLOOD = 0xff3048, SOUL = 0xffc9d2;
const seqFrame = (p, w) => weighted(Math.min(0.999, Math.max(0, p)), w);
/** cao (đơn vị thế giới) để nhóm có bề NGANG `w` */
const hForW = (group, w) => w * FX.groups[group].size[1] / FX.groups[group].size[0];
/** đơn vị thế giới / điểm ảnh atlas khi nhóm `group` cao `h` */
const uOf = (group, h) => h / FX.groups[group].size[1];

/** Phần dưới (`frac`) của 1 hình vòng vẽ nghiêng — đặt TRƯỚC nhân vật, phần còn lại đặt sau (vòng bao quanh chân) */
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
function flash(pos, { color = CRIMSON, size = 1.4, y = 1.0, life = 0.25, z = 0.65 } = {}) {
    const c = fxPlane(glowTexture(), size, size, { color });
    c.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + z);
    addAnim(c, life, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.1); fx.mesh.material.opacity = 1 - p; });
}
/** Chạy 1 nhóm khung tại `pos` (đã đặt sẵn vị trí gốc nhóm), trọng số thời lượng `w` */
function playGroup(group, height, x, y, z, { dir = 1, life = 0.45, w = [0.6, 1, 1, 1.1], rot = 0, a = 0.04, b = 0.8 } = {}) {
    const m = zerithFrames(group, height, { opacity: 0 });
    m.scale.x = dir;
    m.rotation.z = rot * dir;
    m.position.set(x, y, z);
    addAnim(m, life, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, w));
        fx.mesh.material.opacity = fadeInOut(p, a, b);
    });
    return m;
}

// ------------------------------------------------------------
// ĐÁNH THƯỜNG · LƯỚT CHÉM
// ------------------------------------------------------------
/** Lưỡi Hái Xuyên Hồn: vệt lướt khói đỏ dài từ `from` tới `to` (đầu vệt ở phía `to`) */
export function spawnReaperDashTrail(from, to, { life = 0.5, y = 1.0 } = {}) {
    const dx = to.x - from.x, dz = (to.z ?? 0) - (from.z ?? 0);
    const len = Math.max(1, Math.hypot(dx, dz));
    const dir = dx < 0 ? -1 : 1;
    const H = 1.35;
    const m = zerithFrames('dashTrail', H, { opacity: 0 });
    const w = H * FX.groups.dashTrail.size[0] / FX.groups.dashTrail.size[1];
    m.position.set((from.x + to.x) / 2, y, ((from.z ?? 0) + (to.z ?? 0)) / 2 + 0.6);
    addAnim(m, life, (p, fx) => {
        const grow = Math.min(1, p / 0.18);
        fx.mesh.scale.set(dir * Math.max(0.01, (len * 1.15 / w) * grow), 1 - 0.3 * p, 1);
        fx.mesh.position.x = from.x + dx * (0.5 * grow) + (dir * len * 0.075) * grow;
        fx.mesh.material.opacity = p < 0.5 ? Math.min(1, p * 12) : (1 - p) / 0.5;
    });
}
/** Trúng nhát lướt: loé ngang -> nhát chém đỏ + linh hồn bị xé ra bay lên -> tan */
export function spawnReaperDashHit(pos, dir = 1, { size = 1.2 } = {}) {
    playGroup('rend', 1.8 * size, pos.x, (pos.y ?? 0) + 1.0, (pos.z ?? 0) + 0.75, { dir, life: 0.48, w: [0.45, 1, 1.1, 1] });
    spawnHitSpark(pos, { count: fxBudget(6, 2), color: 0xff8a95, size: 0.9 });
}
/** Nhát liềm thường: vệt chém lưỡi liềm đỏ thẫm bổ chéo xuống (4 khung) */
export function spawnScytheSlash(pos, dir = 1, { size = 1.5, crit = false } = {}) {
    const s = size * (crit ? 1.25 : 1);
    playGroup('slash', 1.5 * s, pos.x - dir * 0.1, (pos.y ?? 0) + 1.05, (pos.z ?? 0) + 0.75, { dir, life: 0.32, w: [0.55, 1, 1, 0.9], a: 0.02 });
    if (crit) flash(pos, { color: CRIMSON, size: 1.6 });
}
/** Đánh thường lúc Đêm Tử Thần: chém lan — vệt liềm lớn quét qua quái quanh mục tiêu */
export function spawnCleave(pos, dir = 1, { size = 2.2 } = {}) {
    playGroup('slash', 1.25 * size, pos.x, (pos.y ?? 0) + 1.0, (pos.z ?? 0) + 0.7, { dir, life: 0.3, w: [0.5, 1, 1, 0.8], a: 0.02 });
}

// ------------------------------------------------------------
// LƯỠI HÁI HẤT HỒN: QUÉT HẤT LÊN · BỔ XUỐNG
// ------------------------------------------------------------
/** Quét hất ngược lên trời (4 khung, đáy chạm đất) */
export function spawnReapUp(pos, dir = 1, { size = 2.6 } = {}) {
    playGroup('reapUp', size * 1.12, pos.x, FLOOR + 0.02, (pos.z ?? 0) + 0.7, { dir, life: 0.52, w: [0.55, 1, 1, 1.2], a: 0.03, b: 0.75 });
    spawnShockwave(pos, { color: CRIMSON, radius: 2.2, life: 0.4 });
}
/** Bổ xuống (Đêm Tử Thần): cung trên cao -> bổ xuống -> nứt đất + hồn bốc lên (4 khung) + vết nứt đọng lại */
export function spawnReapSlam(pos, dir = 1, { size = 2.8 } = {}) {
    playGroup('slamDown', size * 1.12, pos.x, FLOOR + 0.02, (pos.z ?? 0) + 0.7, { dir, life: 0.62, w: [0.45, 0.7, 1.2, 1.3], a: 0.02, b: 0.8 });
    gameTimeout(() => spawnGroundCrack(pos, { width: size * 1.15 }), 150);
    spawnShockwave(pos, { color: CRIMSON, radius: 3, life: 0.5 });
}
/** Vết nứt đất đỏ thẫm (vẽ nghiêng sẵn) đọng lại rồi mờ dần */
export function spawnGroundCrack(pos, { width = 3, life = 1.0 } = {}) {
    const m = zerithFrames('groundCrack', hForW('groundCrack', width), { opacity: 0 });
    m.position.set(pos.x, FLOOR + 0.01, (pos.z ?? 0) + 0.3);
    addAnim(m, life, (p, fx) => { fx.mesh.material.opacity = 0.95 * fadeInOut(p, 0.06, 0.55); });
}

// ------------------------------------------------------------
// ẤN TỬ (Phán Quyết Tử Thần)
// ------------------------------------------------------------
/** Ấn Tử: ấn đầu lâu loé to rồi thu về trên đầu mục tiêu */
export function spawnDeathMarkCast(target, { height = 2.9 } = {}) {
    const m = zerithFrames('deathMark', 1.6);
    const p0 = target.position;
    m.position.set(p0.x, (p0.y ?? 0) + 1.3, (p0.z ?? 0) + 0.8);
    addAnim(m, 0.55, (p, fx) => {
        const k = easeOut(p);
        fx.mesh.scale.setScalar(1.4 - 0.9 * k);
        fx.mesh.position.y = (p0.y ?? 0) + 1.3 + (height - 1.3 + 0.3) * k;
        fx.mesh.rotation.z = (1 - k) * 0.8;
        fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 1;
    });
    flash(p0, { color: CRIMSON, size: 2, y: 1.3 });
}
/** Ấn Tử trên đầu (giữ suốt thời gian hiệu lực) — view tự cập nhật */
export function makeDeathMarkIcon() {
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 0.9, 0.9, { color: CRIMSON, opacity: 0.5 });
    const icon = zerithFrames('deathMark', 0.62);
    g.add(glow, icon);
    let t = 0;
    return {
        group: g,
        update(dt) {
            t += dt;
            icon.position.y = Math.sin(t * 3) * 0.05;
            icon.rotation.z = Math.sin(t * 1.3) * 0.12;
            glow.material.opacity = 0.35 + 0.2 * Math.sin(t * 6);
        },
        dispose() { g.parent?.remove(g); icon.geometry.dispose(); icon.material.dispose(); glow.geometry.dispose(); glow.material.dispose(); },
    };
}
/** Loé ở đầu ngón tay lúc chỉ tay gắn Ấn Tử */
export function spawnFingerFlare(p) {
    const m = zerithFrames('deathMark', 0.55, { opacity: 0 });
    m.position.set(p.x, p.y, (p.z ?? 0) + 0.7);
    addAnim(m, 0.35, (q, fx) => { fx.mesh.scale.setScalar(0.4 + easeOut(q) * 0.8); fx.mesh.rotation.z = q * 1.5; fx.mesh.material.opacity = fadeInOut(q, 0.1, 0.5); });
    flash(p, { color: BLOOD, size: 0.9, y: 0, life: 0.25, z: 0.65 });
}

// ------------------------------------------------------------
// KẾT LIỄU · KHIÊN VỠ · ĐỒNG HỒ CÁT · LINH HỒN · LƯỚT MIỄN PHÍ
// ------------------------------------------------------------
/** Kết liễu: lưỡi hái khổng lồ chém bổ xuống + nhát chém phán quyết (4 khung) + loé đỏ */
export function spawnExecution(pos, dir = 1) {
    const H = 3.4;
    const s = zerithFrames('phHold', H);
    s.scale.x = dir;
    const x0 = pos.x - dir * 0.9, z = (pos.z ?? 0) + 0.85, yOff = pos.y ?? 0;   // pos.y: mục tiêu đang ở trên không (phán quyết)
    addAnim(s, 0.45, (p, fx) => {
        const k = Math.min(1, p / 0.35);
        fx.mesh.position.set(x0, FLOOR + 1.9 + yOff + (1 - easeOut(k)) * 1.6, z);
        fx.mesh.rotation.z = dir * (0.9 - 1.9 * easeOut(k));    // giơ ngả sau -> bổ xuống trước mặt
        setFx(fx.mesh, loopFrame(p * 0.45, 12, 4));
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : Math.min(1, p * 8);
    });
    gameTimeout(() => {
        playGroup('exec', 3.0, pos.x, FLOOR + 1.4 + yOff, z + 0.05, { dir, life: 0.55, w: [0.55, 1, 1.1, 1.1], a: 0.02 });
        flash(pos, { color: CRIMSON, size: 3, y: 1.0 + yOff, life: 0.35 });
        spawnHitSpark({ x: pos.x, y: yOff, z: pos.z }, { count: fxBudget(12, 4), color: 0xff8a95, size: 1.4 });
    }, 160);
}
/** Phá khiên: mảnh khiên vỡ tung giữa loé đỏ */
export function spawnShieldShatterZ(pos) {
    const m = zerithFrames('shatter', 1.6);
    m.position.set(pos.x, (pos.y ?? 0) + 1.1, (pos.z ?? 0) + 0.9);
    addAnim(m, 0.5, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.1); fx.mesh.material.opacity = 1 - p * p; });
}
/** Đêm Tử Thần chặn đòn chí tử: đồng hồ cát tử thần hiện trên đầu */
export function spawnHourglass(pos, { y = 3.3 } = {}) {
    const m = zerithFrames('hourglass', 1.3);
    m.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + 0.9);
    addAnim(m, 0.9, (p, fx) => {
        fx.mesh.scale.setScalar(p < 0.15 ? 0.5 + p / 0.15 * 0.5 : 1);
        fx.mesh.position.y = (pos.y ?? 0) + y + p * 0.25;
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 1;
    });
}
/** Linh hồn đầu lâu bay vụt qua (gọi Thần Chết / linh hồn báo thù / phán quyết) */
export function spawnSouls(pos, dir = 1, { size = 1.8, life = 0.8 } = {}) {
    const m = zerithFrames('souls', size, { opacity: 0 });
    m.scale.x = dir;
    const x0 = pos.x - dir * 1.5;
    addAnim(m, life, (p, fx) => {
        fx.mesh.position.set(x0 + dir * 3 * easeOut(p), (pos.y ?? 0) + 1.4 + p * 1.2, (pos.z ?? 0) + 0.6);
        fx.mesh.material.opacity = p < 0.2 ? p / 0.2 : (1 - p) / 0.8;
    });
}
/** Lướt lần 2 MIỄN PHÍ (Đêm Tử Thần): mũi tên vòng lưỡi hái bật lên trên đầu */
export function spawnFreeDash(pos, { height = 2.9 } = {}) {
    const m = zerithFrames('freeDash', 0.85, { opacity: 0 });
    const y0 = FLOOR + height + 0.45 + (pos.y ?? 0);
    m.position.set(pos.x, y0, (pos.z ?? 0) + 0.7);
    addAnim(m, 1.0, (p, fx) => {
        fx.mesh.position.y = y0 + easeOut(p) * 0.45;
        fx.mesh.scale.setScalar(p < 0.15 ? 0.5 + 3.3 * p : 1);
        fx.mesh.rotation.z = -p * 2.2;
        fx.mesh.material.opacity = p < 0.1 ? p / 0.1 : p > 0.7 ? (1 - p) / 0.3 : 1;
    });
}

// ------------------------------------------------------------
// TRIỆU HỒI: VÒNG ẤN TỬ THẦN · HÀO QUANG ĐÊM TỬ THẦN · CÁNH BÓNG TỐI
// ------------------------------------------------------------
/** Vòng ấn tử thần (vẽ nghiêng sẵn) quanh chân: nửa sau đặt sau người, vành trước đặt trước */
function makeSummonRing(width) {
    const H = hForW('summonCircle', width);
    const back = zerithFrames('summonCircle', H, { opacity: 0 });
    const front = frontArc('summonCircle', H, 0.42, { opacity: 0 });
    back.position.set(0, 0, -0.35); front.position.set(0, 0, 0.35);
    const g = new THREE.Group();
    g.add(back, front);
    return { g, set(op) { back.material.opacity = front.material.opacity = op; } };
}
/** Niệm Lưỡi Hái Hất Hồn / Đêm Tử Thần: vòng ấn tử thần dưới chân (+ aura: hào quang cánh bóng tối bốc lên) */
export function spawnReaperSummon(pos, { life = 1.1, size = 3.6, aura = true } = {}) {
    const R = makeSummonRing(size * 0.85);
    R.g.position.set(pos.x, FLOOR + 0.01, pos.z ?? 0);
    addAnim(R.g, life, (p, fx) => {
        const k = 0.45 + easeOut(Math.min(1, p * 3)) * 0.55;
        fx.mesh.scale.set(k, k, 1);
        R.set(p > 0.8 ? (1 - p) / 0.2 : Math.min(1, p * 6));
    });
    if (!aura) return;
    const H = 3.5;
    const a = zerithFrames('nightAura', H, { opacity: 0 });
    a.position.set(pos.x, FLOOR + 0.02, (pos.z ?? 0) - 0.3);
    addAnim(a, life, (p, fx) => {
        setFx(fx.mesh, loopFrame(p * life, 9, 4));
        const k = 0.6 + 0.4 * easeOut(Math.min(1, p * 2));
        fx.mesh.scale.set(k, k, 1);
        fx.mesh.material.opacity = 0.85 * fadeInOut(p, 0.12, 0.85);
    });
}
/** Hóa Thần Chết (mốc gọi 0,2s): cánh bóng tối bung to sau lưng + sóng + linh hồn */
export function spawnReaperWings(pos, dir = 1) {
    const a = zerithFrames('nightAura', 3.6, { opacity: 0 });
    a.position.set(pos.x, FLOOR + 0.02, (pos.z ?? 0) - 0.35);
    addAnim(a, 0.9, (p, fx) => {
        setFx(fx.mesh, loopFrame(p * 0.9, 10, 4));
        const k = 0.5 + 0.75 * easeOut(Math.min(1, p * 2.5));
        fx.mesh.scale.set(k, k, 1);
        fx.mesh.material.opacity = p < 0.08 ? p / 0.08 : p > 0.5 ? (1 - p) / 0.5 : 1;
    });
    flash(pos, { color: CRIMSON, size: 1.4, y: 1.5, life: 0.25 });   // loé nhỏ: cánh bóng tối vẽ tay đã đủ mạnh, không phủ đỏ lên tranh
    spawnShockwave(pos, { color: CRIMSON, radius: 3.2, life: 0.6 });
    spawnSouls(pos, dir);
    spawnRisingSparkles(pos, { count: fxBudget(14, 4), color: 0xff8a95, radius: 1.2 });
}
/** Hào quang Đêm Tử Thần quanh Zerith (cánh bóng tối + lửa hồn, 4 khung lặp) — view tự cập nhật, đặt ở chân (đi theo độ bay) */
export function makeReaperAura(height = 2.9) {
    const g = new THREE.Group();
    const H = height * 1.25;
    const aura = zerithFrames('nightAura', H, { opacity: 0 });
    aura.position.set(0, 0, -0.3);
    const glow = fxPlane(glowTexture(), height * 1.1, height * 1.3, { color: CRIMSON, opacity: 0 });
    glow.position.set(0, height * 0.55, -0.35);
    g.add(glow, aura);
    let t = 0;
    return {
        group: g,
        update(dt, k) {
            t += dt;
            setFx(aura, loopFrame(t, 8, 4));
            aura.material.opacity = 0.7 * k * (0.9 + 0.1 * Math.sin(t * 4));   // khói đen giữ 10s: hơi trong để Zerith + Hộ Vệ vẫn rõ
            glow.material.opacity = 0.12 * k;
        },
        dispose() { g.parent?.remove(g); },
    };
}

// ------------------------------------------------------------
// HỘ VỆ THẦN CHẾT — hiện ra (4) rồi đứng / giương liềm / chém ngang / chém bổ; sau lưng Zerith (Đêm Tử Thần), linh hồn báo thù (ghost)
// ------------------------------------------------------------
const POSE_I = { gWind: 1, gSwing: 2, gExec: 3 };
export function makeReaperGuardian({ height = 3.4, ghost = false } = {}) {
    // cùng tỉ lệ điểm ảnh giữa 2 nhóm (hiện ra / tư thế); thân Thần Chết ~ height đơn vị
    const Hp = height * 1.05, U = uOf('gPose', Hp);
    const inM = zerithFrames('gIn', FX.groups.gIn.size[1] * U, { opacity: 0 });
    const pose = zerithFrames('gPose', Hp, { opacity: 0 });
    const glow = fxPlane(glowTexture(), height * 1.2, height * 1.2, { color: ghost ? 0xff8fa3 : CRIMSON, opacity: 0.4 });
    glow.position.set(0, height * 0.5, -0.05);
    const body = new THREE.Group();
    body.add(glow, inM, pose);
    const g = new THREE.Group();
    g.add(body);
    // linh hồn (ghost): nhạt + hồng ma mị, thêm lớp cộng sáng cho dễ thấy trên nền cỏ
    const shine = ghost ? zerithFrames('gPose', Hp, { opacity: 0, additive: true }) : null;
    if (shine) { shine.material.color.set(0xff6b81); shine.position.z = 0.01; body.add(shine); }
    if (ghost) { inM.material.color.set(SOUL); pose.material.color.set(SOUL); }
    let cur = null, poseLeft = 0, t = 0, appear = 0, queue = [];
    return {
        group: g,
        /** chém: giương liềm (0.18s) -> chém ngang / chém bổ (0.38s) -> đứng */
        slash(kind = 0) { queue = [['gWind', 0.18], [kind === 1 ? 'gExec' : 'gSwing', 0.38]]; poseLeft = 0; },
        execute() { queue = [['gWind', 0.12], ['gExec', 0.5]]; poseLeft = 0; },
        /** tự dùng Lưỡi Hái Hất Hồn: giương liềm (0.3s) -> quét (0.3s) -> giương lại -> chém bổ xuống (khớp server 420 / 980ms) */
        reap() { queue = [['gWind', 0.3], ['gSwing', 0.3], ['gWind', 0.28], ['gExec', 0.45]]; poseLeft = 0; },
        /** điểm lưỡi liềm (toạ độ thế giới) */
        bladePoint() { const p = new THREE.Vector3(); g.getWorldPosition(p); return { x: p.x + (g.scale.x < 0 ? -1.6 : 1.6), y: p.y + 1.2, z: p.z }; },
        update(dt, facingLeft, { alpha = 1 } = {}) {
            t += dt; appear = Math.min(1, appear + dt / 0.55);
            poseLeft -= dt;
            if (poseLeft <= 0) {
                if (queue.length) { const [n, d] = queue.shift(); cur = n; poseLeft = d; }
                else cur = null;
            }
            g.scale.set(facingLeft ? -1 : 1, 1, 1);
            const a = alpha * (ghost ? 0.62 : 0.95);   // linh hồn: trong mờ (khói đen nhạt đi) + lớp cộng sáng hồng
            let useIn = false;
            if (appear < 1 && !cur) {
                setFx(inM, seqFrame(appear, [0.9, 1, 1, 0.8])); useIn = true;      // hiện ra: cổng đỏ -> trồi lên -> loé -> đủ hình
            } else if (!cur) {
                // đứng: khung 4 (hiện xong) <-> khung 5 (đứng) lặp chậm — áo choàng, khói lay động
                useIn = loopFrame(t, 2.5, 2) === 0;
                if (useIn) setFx(inM, 3); else setFx(pose, 0);
            } else setFx(pose, POSE_I[cur] ?? 0);
            inM.material.opacity = useIn ? a : 0;
            pose.material.opacity = useIn ? 0 : a;
            if (shine) { setFx(shine, pose.userData.fx.frame); shine.material.opacity = useIn ? 0 : (0.3 + 0.12 * Math.sin(t * 9)) * alpha; }
            glow.material.opacity = (0.22 + 0.08 * Math.sin(t * 5)) * alpha;
            body.position.y = Math.sin(t * 2.1) * 0.12;
        },
        dispose() {
            g.parent?.remove(g);
            [inM, pose, glow, shine].forEach(m => { if (m) { m.geometry.dispose(); m.material.dispose(); } });
        },
    };
}

// ------------------------------------------------------------
// LƯỠI HÁI KHỔNG LỒ (Lưỡi Hái Hất Hồn): hiện dần SAU LƯNG Zerith trong lúc niệm (khói đỏ tụ lại, linh hồn xoáy quanh)
// -> vọt ra trước quét từ dưới thấp ngược lên trời (hất tung quái) -> [Đêm Tử Thần] bổ mạnh xuống -> tan thành khói.
// ------------------------------------------------------------
/**
 * @param getPos () => {x, z} vị trí Zerith (theo dõi khi nhân vật di chuyển)
 * @param dir 1 = nhìn phải, -1 = nhìn trái
 * @returns {{ swing(), slam(), expectSlam(), cancel() }}
 */
export function spawnPhantomScythe(getPos, dir = 1, { formTime = 0.7, height = 4.2 } = {}) {
    // gốc hình = chỗ NẮM trên cán (xoay quanh đó); lưỡi hái ~ height đơn vị
    const Hh = height * 1.08, U = uOf('phHold', Hh);
    const g = new THREE.Group();
    g.scale.x = dir;
    const pivot = new THREE.Group();
    g.add(pivot);
    const form = zerithFrames('phForm', FX.groups.phForm.size[1] * U, { opacity: 0 });
    const hold = zerithFrames('phHold', Hh, { opacity: 0 });
    const shine = zerithFrames('phHold', Hh, { opacity: 0, additive: true });
    shine.material.color.set(0xff5a70); shine.position.z = 0.01;
    const glow = fxPlane(glowTexture(), height * 0.9, height * 0.9, { color: CRIMSON, opacity: 0 });
    glow.position.set(0, height * 0.2, -0.05);
    pivot.add(glow, form, hold, shine);
    // góc (nhìn phải): dựng đứng hơi ngả sau lúc niệm -> hạ thấp trước mặt -> quét lên ngả sau -> bổ xuống trước
    const A_FORM = 0.15, A_LOW = -2.0, A_UP = 0.75, A_SLAM = -1.9;
    const X_BACK = -0.35, X_FRONT = 1.35;   // lúc niệm: hiện SAU LƯNG (lưỡi trên đầu); lúc chém: vọt ra TRƯỚC mặt
    let ox = X_BACK, oz = -0.3, oy = 1.5;
    let state = 'form', t = 0, st = 0, ang = A_FORM, wisp = 0, life = 0, slamQueued = false;
    const set = (s) => { state = s; st = 0; };
    addAnim(g, formTime + 4, (p, fx) => {
        const now = p * (formTime + 4);
        const dt = Math.max(0, now - t); t = now; st += dt; life += dt;
        const pos = getPos();
        fx.mesh.position.set(pos.x + dir * ox, FLOOR + oy, (pos.z ?? 0) + oz);
        let op = 1, forming = false;
        if (state === 'form') {
            const k = Math.min(1, st / Math.max(0.05, formTime));
            op = Math.min(1, k * 2.5);
            forming = k < 1;
            setFx(form, seqFrame(k, [1, 1, 0.8, 0.6]));
            pivot.scale.set(0.75 + 0.25 * easeOut(k), 0.75 + 0.25 * easeOut(k), 1);
            ang = A_FORM + Math.sin(life * 6) * 0.04;
            if ((wisp -= dt) <= 0) { wisp = 0.12; spawnRisingSparkles({ x: pos.x + dir * ox, z: pos.z ?? 0 }, { count: 3, color: 0xff8a95, radius: 1.0 }); }
        } else if (state === 'swing') {
            // hạ thấp (0.07s) -> quét lên (0.14s) -> giữ
            pivot.scale.set(1, 1, 1);
            const k0 = Math.min(1, st / 0.07);
            ox = X_BACK + (X_FRONT - X_BACK) * easeOut(k0); oz = -0.3 + 0.85 * k0; oy = 1.5 + 0.1 * k0;
            if (st < 0.07) ang = A_FORM + (A_LOW - A_FORM) * easeOut(k0);
            else ang = A_LOW + (A_UP - A_LOW) * easeOut(Math.min(1, (st - 0.07) / 0.14));
            if (st > 0.6 && !slamQueued) set('fade');
        } else if (state === 'slam') {
            ang = A_UP + (A_SLAM - A_UP) * Math.min(1, st / 0.12) ** 2;
            if (st > 0.45) set('fade');
        } else if (state === 'fade') {
            op = Math.max(0, 1 - st / 0.35);
            if (op <= 0) { fx.mesh.visible = false; }
        }
        if (!forming) { const f = loopFrame(life, 8, 4); setFx(hold, f); setFx(shine, f); }
        pivot.rotation.z = ang;
        form.material.opacity = forming ? 0.95 * op : 0;
        hold.material.opacity = forming ? 0 : 0.95 * op;
        // tranh đã đủ khói đen + đỏ: lớp cộng sáng chỉ loé lúc quét / bổ, quầng đỏ nhẹ (không phủ đỏ lên Zerith)
        shine.material.opacity = forming ? 0 : (state === 'swing' || state === 'slam' ? 0.3 : 0) * op;
        glow.material.opacity = 0.16 * op;
    });
    return {
        swing() { set('swing'); },
        slam() { slamQueued = false; set('slam'); },
        expectSlam() { slamQueued = true; },
        cancel() { set('fade'); },
    };
}

/**
 * THẦN CHẾT PHÁN QUYẾT (Ấn Tử chạm ngưỡng tử): Thần Chết hiện ra sau lưng mục tiêu, vòng ấn tử thần dưới chân,
 * linh hồn xoáy kéo mục tiêu lên không trung trong `lift` giây -> giương liềm -> CHÉM BỔ đúng lúc `lift` -> tan dần trong `fall` giây.
 * (Mục tiêu bay lên / rơi xuống do events.js điều khiển view; nhát chém + vỡ khiên / kết liễu do sự kiện judgeSlash)
 * @param pos chân mục tiêu (lúc bắt đầu)   @param dir hướng Thần Chết nhìn (1 = sang phải)
 */
export function spawnJudgement(pos, dir = 1, { lift = 1.1, fall = 0.5, height = 3.8 } = {}) {
    const guard = makeReaperGuardian({ height });
    const holder = new THREE.Group();
    holder.add(guard.group);
    holder.position.set(pos.x - dir * 1.25, FLOOR + 0.6, (pos.z ?? 0) - 0.5);
    const life = lift + fall;
    let raised = false;
    addAnim(holder, life, (p, fx, dt) => {
        const t = p * life;
        if (!raised && t >= lift - 0.25) { raised = true; guard.slash(1); }   // giương liềm (0.18s) -> chém bổ
        const alpha = t < 0.25 ? t / 0.25 : t > lift + fall * 0.4 ? Math.max(0, 1 - (t - lift - fall * 0.4) / (fall * 0.6)) : 1;
        guard.update(dt ?? 1 / 60, dir < 0, { alpha });
        holder.position.y = FLOOR + 0.6 + Math.min(1, t / lift) * 0.9;   // Thần Chết bay lên theo
    });
    spawnReaperSummon(pos, { life: life + 0.2, size: 3.2, aura: false });
    // linh hồn xoáy quanh mục tiêu trong lúc bị nhấc lên
    for (let k = 0; k < 3; k++) gameTimeout(() => spawnSouls({ x: pos.x, y: 0.6 + k * 0.7, z: pos.z }, k % 2 ? -dir : dir, { size: 1.6, life: 0.6 }), k * 300);
    flash({ x: pos.x, y: 0, z: pos.z }, { color: CRIMSON, size: 2.4, y: 0.6, life: 0.4 });
}
