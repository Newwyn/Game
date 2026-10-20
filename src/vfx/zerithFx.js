// ============================================================
// HIỆU ỨNG U MINH — Zerith (Sát Thủ lưỡi hái, phép tím)
// ============================================================
// Hình lấy từ atlas zerith_fx.png (tools/build_fx_atlas.py art/zerith/fx_spec.json):
//   vệt lướt + 3 khung trúng đòn, Ấn Tử, lưỡi hái lớn (kết liễu), linh hồn bay, chém hất 4 khung, bổ xuống 4 khung,
//   hào quang 3 khung, vòng triệu hồi, cánh, nhát chém ngang, 3 khung kết liễu, khiên vỡ, đồng hồ cát "bất tử",
//   Hộ Vệ Thần Chết 4 tư thế (đứng / giương liềm / chém ngang / chém bổ).
// Mọi hình vẽ nhìn sang PHẢI; nhìn trái thì lật gương (scale.x = -1).
import * as THREE from 'three';
import { textureView } from './texView.js';
import fxUrl from '../assets/sprites/zerith_fx.png';
import fxMeta from './zerithFx.json';
import { gameTimeout } from '../config.js';
import { addAnim, fxPlane, glowTexture, ringTexture, easeOut, spawnHitSpark, spawnShockwave, spawnRisingSparkles } from './vfx.js';

const FLOOR = -0.45;
const PURPLE = 0xa855f7, CRIMSON = 0xe11d48;

let base = null;
const texCache = {};
function tex(name) {
    if (texCache[name]) return texCache[name];
    base ??= new THREE.TextureLoader().load(fxUrl, t => { t.colorSpace = THREE.SRGBColorSpace; });
    base.colorSpace = THREE.SRGBColorSpace;
    const [W, H] = fxMeta.atlasSize;
    const [x, y, w, h] = fxMeta.parts[name].rect;
    const t = textureView(base);   // không tải lại atlas lên GPU (xem texView.js)
    t.repeat.set(w / W, h / H);
    t.offset.set(x / W, 1 - (y + h) / H);
    return (texCache[name] = { texture: t, aspect: w / h, w, h });
}
/** Mặt phẳng hiện 1 hình, cao `height` đơn vị (tâm ở giữa hình) */
export function reaperSprite(name, height, { additive = false, opacity = 1 } = {}) {
    const { texture, aspect } = tex(name);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(height * aspect, height), new THREE.MeshBasicMaterial({
        map: texture, transparent: true, depthWrite: false, fog: false, opacity,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide }));
    m.userData.sharedTexture = true;
    return m;
}
function setFrame(mesh, name, height) {
    const { texture, aspect } = tex(name);
    mesh.material.map = texture;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(height * aspect, height);
}
/** Chạy các khung `names` trong `life` giây tại `pos` (cao `size`), lật theo `dir` */
function playFrames(names, pos, { size = 2, life = 0.4, dir = 1, y = null, z = 0.7, opacity = 1, rot = 0 } = {}) {
    const m = reaperSprite(names[0], size, { opacity });
    m.scale.x = dir;
    m.rotation.z = rot * dir;
    m.position.set(pos.x, y ?? FLOOR + size * 0.5, (pos.z ?? 0) + z);
    let cur = 0;
    addAnim(m, life, (p, fx) => {
        const f = Math.min(names.length - 1, Math.floor(p * names.length));
        if (f !== cur) { cur = f; setFrame(fx.mesh, names[f], size); }
        fx.mesh.material.opacity = opacity * (p > 0.75 ? (1 - p) / 0.25 : 1);
    });
    return m;
}
function flash(pos, { color = PURPLE, size = 1.4, y = 1.0, life = 0.25 } = {}) {
    const c = fxPlane(glowTexture(), size, size, { color });
    c.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + 0.65);
    addAnim(c, life, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.1); fx.mesh.material.opacity = 1 - p; });
}

/** Lưỡi Hái Xuyên Hồn: vệt lướt tím dài từ `from` tới `to` (đầu vệt ở phía `to`) */
export function spawnReaperDashTrail(from, to, { life = 0.5, y = 1.0 } = {}) {
    const dx = to.x - from.x, dz = (to.z ?? 0) - (from.z ?? 0);
    const len = Math.max(1, Math.hypot(dx, dz));
    const dir = dx < 0 ? -1 : 1;
    const H = 1.35;
    const m = reaperSprite('dashTrail', H);
    const w = H * tex('dashTrail').aspect;
    m.position.set((from.x + to.x) / 2, y, ((from.z ?? 0) + (to.z ?? 0)) / 2 + 0.6);
    addAnim(m, life, (p, fx) => {
        const grow = Math.min(1, p / 0.18);
        fx.mesh.scale.set(dir * (len * 1.15 / w) * grow, 1 - 0.3 * p, 1);
        fx.mesh.position.x = from.x + dx * (0.5 * grow) + (dir * len * 0.075) * grow;
        fx.mesh.material.opacity = p < 0.5 ? 1 : (1 - p) / 0.5;
    });
}
/** Trúng nhát lướt: tia chém tím + tia lửa */
export function spawnReaperDashHit(pos, dir = 1, { size = 1.2 } = {}) {
    const n = 'dashHit' + Math.floor(Math.random() * 3);
    const m = reaperSprite(n, size);
    m.scale.x = dir;
    m.position.set(pos.x, (pos.y ?? 0) + 1.0, (pos.z ?? 0) + 0.75);
    addAnim(m, 0.3, (p, fx) => { fx.mesh.scale.set(dir * (0.7 + easeOut(p) * 0.5), 1, 1); fx.mesh.material.opacity = 1 - p; });
    spawnHitSpark(pos, { count: 6, color: 0xd8b4fe, size: 0.9 });
}
/** Nhát liềm thường: vệt chém ngang hình lưỡi liềm */
export function spawnScytheSlash(pos, dir = 1, { size = 1.5, crit = false } = {}) {
    const m = reaperSprite('cleave', size * (crit ? 1.25 : 1));
    m.scale.x = dir;
    m.rotation.z = dir * -0.35;
    m.position.set(pos.x - dir * 0.15, (pos.y ?? 0) + 1.05, (pos.z ?? 0) + 0.75);
    addAnim(m, 0.28, (p, fx) => {
        fx.mesh.scale.set(dir * (0.75 + easeOut(p) * 0.4), 0.85 + easeOut(p) * 0.25, 1);
        fx.mesh.material.opacity = p > 0.5 ? (1 - p) / 0.5 : 1;
    });
    if (crit) flash(pos, { color: CRIMSON, size: 1.6 });
}
/** Lưỡi Hái Hất Hồn: vệt chém hất ngược lên trời (4 khung) */
export function spawnReapUp(pos, dir = 1, { size = 2.6 } = {}) {
    playFrames(['up0', 'up1', 'up2', 'up3'], pos, { size, life: 0.42, dir, y: FLOOR + size * 0.55 });
    spawnShockwave(pos, { color: PURPLE, radius: 2.2, life: 0.4 });
}
/** Đêm Tử Thần — bổ xuống thêm: vệt chém bổ + nổ đất (4 khung) */
export function spawnReapSlam(pos, dir = 1, { size = 2.8 } = {}) {
    playFrames(['slam0', 'slam1', 'slam2', 'slam3'], pos, { size, life: 0.55, dir, y: FLOOR + size * 0.45 });
    spawnShockwave(pos, { color: CRIMSON, radius: 3, life: 0.5 });
}
/** Đánh thường lúc Đêm Tử Thần: chém lan — vệt liềm lớn quét qua */
export function spawnCleave(pos, dir = 1, { size = 2.2 } = {}) {
    playFrames(['slam0'], pos, { size, life: 0.3, dir, y: (pos.y ?? 0) + 1.0, opacity: 0.95 });
}

/** Ấn Tử: biểu tượng đầu lâu + lưỡi hái loé to rồi thu về trên đầu mục tiêu */
export function spawnDeathMarkCast(target, { height = 2.9 } = {}) {
    const m = reaperSprite('deathMark', 1.6);
    const p0 = target.position;
    m.position.set(p0.x, (p0.y ?? 0) + 1.3, (p0.z ?? 0) + 0.8);
    addAnim(m, 0.55, (p, fx) => {
        const k = easeOut(p);
        fx.mesh.scale.setScalar(1.4 - 0.9 * k);
        fx.mesh.position.y = (p0.y ?? 0) + 1.3 + (height - 1.3 + 0.3) * k;
        fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 1;
    });
    flash(p0, { color: CRIMSON, size: 2, y: 1.3 });
}
/** Ấn Tử trên đầu (giữ suốt thời gian hiệu lực) — view tự cập nhật */
export function makeDeathMarkIcon() {
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 0.9, 0.9, { color: CRIMSON, opacity: 0.5 });
    const icon = reaperSprite('deathMark', 0.62);
    g.add(glow, icon);
    let t = 0;
    return {
        group: g,
        update(dt) {
            t += dt;
            icon.position.y = Math.sin(t * 3) * 0.05;
            glow.material.opacity = 0.35 + 0.2 * Math.sin(t * 6);
        },
        dispose() { g.parent?.remove(g); icon.geometry.dispose(); icon.material.dispose(); glow.geometry.dispose(); glow.material.dispose(); },
    };
}
/** Kết liễu: lưỡi hái lớn chém xuống + 3 khung chém đỏ + loé đỏ */
export function spawnExecution(pos, dir = 1) {
    const s = reaperSprite('bigScythe', 3.4);
    s.scale.x = dir;
    const x0 = pos.x - dir * 0.6, z = (pos.z ?? 0) + 0.85, yOff = pos.y ?? 0;   // pos.y: mục tiêu đang ở trên không (phán quyết)
    addAnim(s, 0.45, (p, fx) => {
        const k = Math.min(1, p / 0.35);
        fx.mesh.position.set(x0, FLOOR + 1.7 + yOff + (1 - easeOut(k)) * 2.5, z);
        fx.mesh.rotation.z = dir * (0.9 - 0.9 * easeOut(k));
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 1;
    });
    gameTimeout(() => {
        playFrames(['exec0', 'exec1', 'exec2'], pos, { size: 2.8, life: 0.5, dir, y: FLOOR + 1.4 + yOff });
        flash(pos, { color: CRIMSON, size: 3, y: 1.0, life: 0.35 });
        spawnHitSpark(pos, { count: 12, color: 0xfb7185, size: 1.4 });
    }, 160);
}
/** Ấn Tử phá khiên: mảnh pha lê vỡ tung */
export function spawnShieldShatterZ(pos) {
    const m = reaperSprite('shatter', 1.6);
    m.position.set(pos.x, (pos.y ?? 0) + 1.1, (pos.z ?? 0) + 0.9);
    addAnim(m, 0.5, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.1); fx.mesh.material.opacity = 1 - p * p; });
}
/** Đêm Tử Thần chặn đòn chí tử: đồng hồ cát tử thần hiện trên đầu */
export function spawnHourglass(pos, { y = 3.3 } = {}) {
    const m = reaperSprite('hourglass', 1.3);
    m.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + 0.9);
    addAnim(m, 0.9, (p, fx) => {
        fx.mesh.scale.setScalar(p < 0.15 ? 0.5 + p / 0.15 * 0.5 : 1);
        fx.mesh.position.y = (pos.y ?? 0) + y + p * 0.25;
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 1;
    });
}
/** Linh hồn đầu lâu bay vụt qua (gọi Thần Chết / linh hồn báo thù) */
export function spawnSouls(pos, dir = 1, { size = 1.8, life = 0.8 } = {}) {
    const m = reaperSprite('souls', size);
    m.scale.x = dir;
    const x0 = pos.x - dir * 1.5;
    addAnim(m, life, (p, fx) => {
        fx.mesh.position.set(x0 + dir * 3 * easeOut(p), (pos.y ?? 0) + 1.4 + p * 1.2, (pos.z ?? 0) + 0.6);
        fx.mesh.material.opacity = p < 0.2 ? p / 0.2 : (1 - p) / 0.8;
    });
}
/** Niệm Đêm Tử Thần / Lưỡi Hái Hất Hồn: vòng ấn tử thần dưới chân + hào quang tím bốc lên */
export function spawnReaperSummon(pos, { life = 1.1, size = 3.6, aura = true } = {}) {
    const c = reaperSprite('summonCircle', 1);
    c.rotation.x = -Math.PI / 2;
    c.position.set(pos.x, FLOOR + 0.05, pos.z ?? 0);
    const r = size * 0.55;
    c.scale.set(2 * r / tex('summonCircle').aspect, 1.5 * r, 1);
    const sx = c.scale.x, sy = c.scale.y;
    addAnim(c, life, (p, fx) => {
        const k = 0.4 + easeOut(Math.min(1, p * 3)) * 0.6;
        fx.mesh.scale.set(sx * k, sy * k, 1);
        fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 1;
    });
    if (!aura) return;
    const H = 2.6;
    const a = reaperSprite('aura0', H, { opacity: 0.85 });
    a.position.set(pos.x, FLOOR + H * 0.5, (pos.z ?? 0) + 0.3);
    let cur = 'aura0';
    addAnim(a, life, (p, fx) => {
        const n = 'aura' + (Math.floor(p * life * 10) % 3);
        if (n !== cur) { cur = n; setFrame(fx.mesh, n, H); }
        fx.mesh.material.opacity = 0.85 * (p < 0.1 ? p / 0.1 : p > 0.85 ? (1 - p) / 0.15 : 1);
    });
}
/** Hóa Thần Chết: cánh tử thần bung sau lưng + sóng + linh hồn */
export function spawnReaperWings(pos, dir = 1) {
    ['wingL', 'wingR'].forEach((n, i) => {
        const w = reaperSprite(n, 2.0);
        const side = i === 0 ? -1 : 1;
        addAnim(w, 1.0, (p, fx) => {
            const k = easeOut(Math.min(1, p * 2.5));
            fx.mesh.position.set(pos.x + side * (0.4 + 0.9 * k), (pos.y ?? 0) + 1.9, (pos.z ?? 0) - 0.3);
            fx.mesh.scale.setScalar(0.4 + 0.7 * k);
            fx.mesh.material.opacity = p > 0.55 ? (1 - p) / 0.45 : 1;
        });
    });
    spawnShockwave(pos, { color: PURPLE, radius: 3.2, life: 0.6 });
    spawnSouls(pos, dir);
    spawnRisingSparkles(pos, { count: 16, color: 0xc084fc, radius: 1.2 });
}

// ------------------------------------------------------------
// HỘ VỆ THẦN CHẾT — 4 tư thế, đứng sau lưng Zerith (Đêm Tử Thần) hoặc là linh hồn báo thù (ghost)
// ------------------------------------------------------------
const G_POSE = {           // điểm neo (tỉ lệ ngang của thân trong hình), neo đáy hình
    gIdle: 0.5, gWind: 0.47, gSwing: 0.3, gExec: 0.45,
};
export function makeReaperGuardian({ height = 3.4, ghost = false } = {}) {
    const k = height / tex('gIdle').h;      // đơn vị / pixel (giữ cùng tỉ lệ giữa các tư thế)
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), height * 1.2, height * 1.2, { color: ghost ? 0xc084fc : 0x7c3aed, opacity: 0.4 });
    glow.position.y = height * 0.5;
    const body = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
        transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, opacity: 0 }));
    body.userData.sharedTexture = true;
    // linh hồn (ghost): thêm 1 lớp cộng sáng tím phủ lên cho rực, dễ thấy trên nền cỏ
    const shine = ghost ? new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
        transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, opacity: 0,
        blending: THREE.AdditiveBlending, color: 0xb46cff })) : null;
    if (shine) { shine.userData.sharedTexture = true; shine.position.z = 0.01; }
    g.add(glow, body);
    if (shine) g.add(shine);
    let pose = null, poseLeft = 0, t = 0, appear = 0, queue = [];
    const setPose = (n) => {
        if (pose === n) return;
        pose = n;
        const T = tex(n);
        body.material.map = T.texture;
        body.material.needsUpdate = true;
        body.geometry.dispose();
        const w = T.w * k, h = T.h * k;
        body.geometry = new THREE.PlaneGeometry(w, h);
        body.geometry.translate((0.5 - G_POSE[n]) * w, h / 2, 0);
        if (shine) { shine.material.map = T.texture; shine.material.needsUpdate = true; shine.geometry.dispose(); shine.geometry = body.geometry.clone(); }
    };
    setPose('gIdle');
    if (ghost) { body.material.color.set(0xd8b4fe); glow.material.color.set(0xc084fc); }
    return {
        group: g,
        /** chém: giương liềm (0.18s) -> chém ngang / chém bổ (0.35s) -> đứng */
        slash(kind = 0) {
            queue = [['gWind', 0.18], [kind === 1 ? 'gExec' : 'gSwing', 0.38]];
            poseLeft = 0;
        },
        execute() { queue = [['gWind', 0.12], ['gExec', 0.5]]; poseLeft = 0; },
        /** tự dùng Lưỡi Hái Hất Hồn: giương liềm (0.3s) -> quét hất lên (0.3s) -> giương lại -> chém bổ xuống (khớp server 420 / 980ms) */
        reap() { queue = [['gWind', 0.3], ['gSwing', 0.3], ['gWind', 0.28], ['gExec', 0.45]]; poseLeft = 0; },
        /** điểm lưỡi liềm (toạ độ thế giới) */
        bladePoint() { const p = new THREE.Vector3(); g.getWorldPosition(p); return { x: p.x + (g.scale.x < 0 ? -1.6 : 1.6), y: p.y + 1.2, z: p.z }; },
        update(dt, facingLeft, { alpha = 1 } = {}) {
            t += dt; appear = Math.min(1, appear + dt * 2.2);
            poseLeft -= dt;
            if (poseLeft <= 0) {
                if (queue.length) { const [n, d] = queue.shift(); setPose(n); poseLeft = d; }
                else setPose('gIdle');
            }
            g.scale.set((facingLeft ? -1 : 1) * (0.7 + 0.3 * appear), 0.7 + 0.3 * appear, 1);
            const a = appear * alpha;
            body.material.opacity = (ghost ? 0.85 : 0.95) * a;
            glow.material.opacity = (0.25 + 0.08 * Math.sin(t * 5)) * a;
            body.position.y = Math.sin(t * 2.1) * 0.12;
            if (shine) { shine.position.y = body.position.y; shine.material.opacity = (0.4 + 0.15 * Math.sin(t * 9)) * a; }
        },
        dispose() {
            g.parent?.remove(g);
            body.geometry.dispose(); body.material.dispose(); glow.geometry.dispose(); glow.material.dispose();
            if (shine) { shine.geometry.dispose(); shine.material.dispose(); }
        },
    };
}
/** Hào quang Đêm Tử Thần dưới chân Zerith (3 khung lặp + vòng ấn) */
export function makeReaperAura() {
    const g = new THREE.Group();
    const H = 2.2;
    const aura = reaperSprite('aura0', H, { opacity: 0 });
    aura.position.set(0, H * 0.5 - 0.05, 0.25);
    const ring = fxPlane(ringTexture(), 2.6, 2.6, { color: PURPLE, opacity: 0 });
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    g.add(ring, aura);
    let t = 0, cur = 'aura0';
    return {
        group: g,
        update(dt, k) {
            t += dt;
            const n = 'aura' + (Math.floor(t * 9) % 3);
            if (n !== cur) { cur = n; setFrame(aura, n, H); }
            aura.material.opacity = 0.6 * k;
            ring.material.opacity = 0.45 * k * (0.8 + 0.2 * Math.sin(t * 5));
            ring.rotation.z += dt * 1.4;
        },
        dispose() { g.parent?.remove(g); },
    };
}

// ------------------------------------------------------------
// LƯỠI HÁI KHỔNG LỒ (Lưỡi Hái Hất Hồn): hiện dần trước mặt Zerith trong lúc niệm (khói tím tụ lại, linh hồn xoáy quanh)
// -> quét từ dưới thấp ngược lên trời (hất tung quái) -> [Đêm Tử Thần] bổ mạnh xuống -> tan thành khói.
// ------------------------------------------------------------
const PH_PIVOT = [0.37, 0.7];   // điểm "nắm" trên hình bigScythe (tỉ lệ từ trái / từ trên)
/**
 * @param getPos () => {x, z} vị trí Zerith (theo dõi khi nhân vật di chuyển)
 * @param dir 1 = nhìn phải, -1 = nhìn trái
 * @returns {{ swing(), slam(), cancel() }}
 */
export function spawnPhantomScythe(getPos, dir = 1, { formTime = 0.7, height = 4.2 } = {}) {
    const T = tex('bigScythe');
    const w = height * T.aspect;
    const g = new THREE.Group();
    g.scale.x = dir;
    const pivot = new THREE.Group();
    g.add(pivot);
    const mk = (additive, color, op) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, height), new THREE.MeshBasicMaterial({
            map: T.texture, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, opacity: op,
            blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, color }));
        m.geometry.translate((0.5 - PH_PIVOT[0]) * w, (PH_PIVOT[1] - 0.5) * height, 0);
        m.userData.sharedTexture = true;
        return m;
    };
    const body = mk(false, 0xffffff, 0), shine = mk(true, 0xb46cff, 0);
    shine.position.z = 0.01;
    pivot.add(body, shine);
    const glow = fxPlane(glowTexture(), height * 0.9, height * 0.9, { color: PURPLE, opacity: 0 });
    glow.position.set(0, height * 0.2, -0.05);
    pivot.add(glow);
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
        let op = 1;
        if (state === 'form') {
            const k = Math.min(1, st / Math.max(0.05, formTime));
            op = easeOut(k);
            pivot.scale.set(0.55 + 0.45 * easeOut(k), 0.3 + 0.7 * easeOut(k), 1);
            ang = A_FORM + Math.sin(life * 6) * 0.04;
            if ((wisp -= dt) <= 0) { wisp = 0.12; spawnRisingSparkles({ x: pos.x + dir * ox, z: pos.z ?? 0 }, { count: 3, color: 0xc084fc, radius: 1.0 }); }
        } else if (state === 'swing') {
            // hạ thấp (0.06s) -> quét lên (0.14s) -> giữ
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
        pivot.rotation.z = ang;
        body.material.opacity = 0.92 * op;
        shine.material.opacity = (state === 'swing' || state === 'slam' ? 0.55 : 0.3 + 0.1 * Math.sin(life * 10)) * op;
        glow.material.opacity = 0.35 * op;
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
 * @param getPos () => {x, z} chân mục tiêu (lúc bắt đầu)   @param dir hướng Thần Chết nhìn (1 = sang phải)
 */
export function spawnJudgement(pos, dir = 1, { lift = 1.1, fall = 0.5, height = 3.8 } = {}) {
    const guard = makeReaperGuardian({ height });
    const holder = new THREE.Group();
    holder.add(guard.group);
    holder.position.set(pos.x - dir * 1.25, FLOOR + 0.6, (pos.z ?? 0) - 0.5);
    const life = lift + fall;
    let raised = false, slashed = false;
    addAnim(holder, life, (p, fx, dt) => {
        const t = p * life;
        if (!raised && t >= lift - 0.25) { raised = true; guard.slash(1); }   // giương liềm (0.18s) -> chém bổ
        if (!slashed && t >= lift) slashed = true;
        const alpha = t < 0.25 ? t / 0.25 : t > lift + fall * 0.4 ? Math.max(0, 1 - (t - lift - fall * 0.4) / (fall * 0.6)) : 1;
        guard.update(dt ?? 1 / 60, dir < 0, { alpha });
        holder.position.y = FLOOR + 0.6 + Math.min(1, t / lift) * 0.9;   // Thần Chết bay lên theo
    });
    spawnReaperSummon(pos, { life: life + 0.2, size: 3.2, aura: false });
    // linh hồn xoáy quanh mục tiêu trong lúc bị nhấc lên
    for (let k = 0; k < 3; k++) gameTimeout(() => spawnSouls({ x: pos.x, y: 0.6 + k * 0.7, z: pos.z }, k % 2 ? -dir : dir, { size: 1.6, life: 0.6 }), k * 300);
    flash({ x: pos.x, y: 0, z: pos.z }, { color: PURPLE, size: 2.4, y: 0.6, life: 0.4 });
}
