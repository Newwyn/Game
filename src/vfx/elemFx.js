// ============================================================
// HIỆU ỨNG TAM NGUYÊN — Elarion (pháp sư nguyên tố) + Golem Nguyên Tố
// ============================================================
// Hình lấy từ atlas elarion_fx.png (tools/build_fx_atlas.py art/elarion/fx_spec.json), 5 tấm + ngọc:
//   fx-a ngọc / sách / bão : vòng lửa · vòng băng · vòng sét · vòng vàng rê chuột · bùng sáng · vệt bay · ngọc tan · ấn chữ trên sách · lốc 3 nguyên tố
//   fx-b hỏa               : thiên thạch rơi · tảng đá lửa lăn · nổ thiên thạch · dải lửa · cầu hỏa lôi nhỏ / lớn · nổ hỏa lôi · tia lửa · hàng nổ lửa
//   fx-c băng              : khối băng · băng vỡ · mảnh băng bay · tia băng · hàng gai băng · ngục băng · băng nổ tung · biểu tượng Hàn Khí · vòm băng sét
//   fx-d lôi / mưa         : 2 tia sét xích · tia sét nổ · 2 khung lốc xoáy · mây giông · sét từ mây · giọt mưa hồi máu · tia sét nhỏ
//   fx-e Golem / Tốc Lôi   : cột triệu hồi · đáp đất · vệt đấm lửa · khí lạnh xoáy · bão tuyết phun · sét đánh tay · song chưởng · vòng sét · golem vỡ
//   ngọc (tấm 04)          : ngọc Hỏa / Băng / Lôi
// Hình vẽ GIỮ NGUYÊN MÀU như tranh: trộn thường (alpha), không cộng sáng (cộng sáng trên nền cỏ / trời sáng làm cháy trắng, mất màu).
// Chỉ các quầng sáng phụ (glow) mới cộng sáng nhẹ. Đá / mây / khối băng có ruột đặc (fx_spec "core").
// Mọi hình vẽ nhìn sang PHẢI; nhìn trái thì lật gương (scale.x = -1).
//   Ngọc Nguyên Tố: f = Hỏa · i = Băng · b = Lôi
import * as THREE from 'three';
import { textureView } from './texView.js';
import fxUrl from '../assets/sprites/elarion_fx.png';
import fxMeta from './elarionFx.json';
import {
    addAnim, fxPlane, glowTexture, ringTexture, sparkTexture, easeOut,
    spawnHitSpark, spawnShockwave, spawnLightning, spawnRisingSparkles, spawnLandingDust,
} from './vfx.js';
import { spawnEmbers, spawnFireHit } from './fireFx.js';
import { startBlizzard, startStorm } from './screenFx.js';
import { gameTimeout } from '../config.js';

const FLOOR = -0.45;
export const ELEM_COLOR = { f: 0xff6a2a, i: 0x67e8f9, b: 0xb784ff };
const ICE = 0x9be7ff, VIOLET = 0xb784ff, FIRE = 0xff7a1a, GOLD = 0xfde68a;
const GEM = { f: 'gemF', i: 'gemI', b: 'gemB' };
const RING = { f: 'ringFire', i: 'ringIce', b: 'ringBolt' };

// ---------- Atlas ----------
let base = null;
const texCache = {};
function tex(name) {
    if (texCache[name]) return texCache[name];
    // nạp xong atlas: tạo sẵn mọi hình (hình dùng lần đầu không bị trễ 1 nhịp)
    base ??= new THREE.TextureLoader().load(fxUrl, t => { t.colorSpace = THREE.SRGBColorSpace; Object.keys(fxMeta.parts).forEach(tex); });
    base.colorSpace = THREE.SRGBColorSpace;
    base.anisotropy = 4;
    const [W, H] = fxMeta.atlasSize;
    const [x, y, w, h] = fxMeta.parts[name].rect;
    const t = textureView(base);   // không tải lại atlas lên GPU (xem texView.js)
    t.repeat.set(w / W, h / H);
    t.offset.set(x / W, 1 - (y + h) / H);
    return (texCache[name] = { texture: t, aspect: w / h });
}
/** Mặt phẳng hiện 1 hình, cao `height` đơn vị (tâm ở giữa hình). Mặc định trộn thường (giữ màu tranh) */
function sprite(name, height, { additive = false, opacity = 1, color = 0xffffff, width } = {}) {
    const { texture, aspect } = tex(name);
    return fxPlane(texture, width ?? height * aspect, height, { additive, opacity, color });
}
function setFrame(mesh, name) { mesh.material.map = tex(name).texture; }
/** Hình bật lên rồi tàn tại pos (+y), to dần `grow`, bay lên `rise`. glow > 0: thêm quầng cộng sáng màu glowColor */
function pop(name, pos, { size = 1.6, life = 0.5, y = 1.0, z = 0.7, grow = 0.4, rise = 0, dir = 1, spin = 0, additive = false, opacity = 1, color = 0xffffff, glow = 0, glowColor = 0xffffff, hold = 0.6 } = {}) {
    const m = sprite(name, size, { additive, opacity, color });
    m.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + z);
    const y0 = m.position.y;
    addAnim(m, life, (p, fx) => {
        const s = 0.6 + easeOut(Math.min(1, p / 0.25)) * (0.4 + grow * p);
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.position.y = y0 + rise * p;
        fx.mesh.rotation.z = spin * p;
        fx.mesh.material.opacity = opacity * (p > hold ? (1 - p) / (1 - hold) : 1);
    });
    if (glow) flash({ x: pos.x, y: (pos.y ?? 0) + y - 1, z: pos.z }, glowColor, { size: size * glow, y: 1, life: life * 0.6 });
    return m;
}
const at = (pos, y = 0, z = 0.6) => new THREE.Vector3(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + z);
function flash(pos, color, { size = 1.4, y = 1, life = 0.3, opacity = 0.8 } = {}) {
    const c = fxPlane(glowTexture(), size, size, { color, opacity });
    c.position.copy(at(pos, y, 0.65));
    addAnim(c, life, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.1); fx.mesh.material.opacity = opacity * (1 - p); });
}
function groundRing(pos, color, radius, life = 0.6) {
    const r = fxPlane(ringTexture(), 1, 1, { color });
    r.rotation.x = -Math.PI / 2;
    r.position.set(pos.x, FLOOR + 0.05, pos.z ?? 0);
    addAnim(r, life, (p, fx) => { const s = 0.5 + easeOut(p) * radius * 2; fx.mesh.scale.set(s, s * 0.85, 1); fx.mesh.material.opacity = 1 - p; });
}
/** Tia sét (hình fx-d) kéo giãn từ a tới b, nhấp nháy — hình gốc + 1 lớp cộng sáng mỏng cho rực */
function boltSeg(a, b, { width = 1.2, life = 0.28, name } = {}) {
    const dx = b.x - a.x, dy = (b.y ?? 0) - (a.y ?? 0);
    const len = Math.max(0.3, Math.hypot(dx, dy));
    const nm = name ?? (Math.random() < 0.5 ? 'bolt1' : 'bolt2');
    const g = new THREE.Group();
    const m = sprite(nm, width, { width: len });
    const hot = sprite(nm, width, { width: len, additive: true, opacity: 0.55 });
    hot.position.z = 0.01;
    g.add(m, hot);
    g.position.set((a.x + b.x) / 2, ((a.y ?? 0) + (b.y ?? 0)) / 2, ((a.z ?? 0) + (b.z ?? 0)) / 2 + 0.6);
    g.rotation.z = Math.atan2(dy, dx);
    if (Math.random() < 0.5) g.scale.y = -1;
    addAnim(g, life, (p) => {
        const f = p < 0.15 ? 1 : p < 0.3 ? 0.35 : p < 0.45 ? 1 : 1 - (p - 0.45) / 0.55;
        m.material.opacity = f; hot.material.opacity = 0.55 * f;
    });
    return g;
}

// ---------- Ngọc ----------
/** Ngọc lơ lửng (trên sân / 3 quả cầu quanh người). hit = khối vô hình to hơn để dễ bấm */
export function makeGem(el, size = 0.5, { hit = false } = {}) {
    const group = new THREE.Group();
    const glow = fxPlane(glowTexture(), size * 2.2, size * 2.2, { color: ELEM_COLOR[el], opacity: 0.6 });
    const core = sprite(GEM[el], size * 1.35);
    core.position.z = 0.02;
    group.add(glow, core);
    let hitMesh = null;
    if (hit) {
        hitMesh = new THREE.Mesh(new THREE.SphereGeometry(size * 1.2, 10, 8), new THREE.MeshBasicMaterial());
        hitMesh.material.visible = false;   // không vẽ nhưng vẫn bắt được tia chuột
        group.add(hitMesh);
    }
    return { group, core, glow, hit: hitMesh };
}
/** Vòng vàng lấp lánh quanh viên ngọc đang rê chuột (bấm để nhặt) */
export function makeHoverRing(size = 0.5) {
    const g = new THREE.Group();
    const ring = sprite('hoverRing', size * 1.9, { opacity: 0.95 });
    const glow = fxPlane(glowTexture(), size * 3, size * 3, { color: GOLD, opacity: 0.35 });
    ring.position.z = 0.05; glow.position.z = -0.06;
    g.add(glow, ring);
    let t = 0;
    return {
        group: g,
        update(dt) { t += dt; const s = 1 + 0.08 * Math.sin(t * 8); ring.scale.setScalar(s); ring.rotation.z = Math.sin(t * 2) * 0.15; glow.material.opacity = 0.3 + 0.15 * Math.sin(t * 6); },
        dispose() { g.removeFromParent(); [ring, glow].forEach(o => { o.material.dispose(); o.geometry.dispose(); }); },
    };
}
export function disposeGem(g) {
    g.group.removeFromParent();
    g.group.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
}
export function spawnGemAppear(pos, el) {
    pop('gemBurst', pos, { size: 1.3, y: 0, life: 0.4, grow: 0.2 });
    flash(pos, ELEM_COLOR[el], { size: 1.0, y: 0, life: 0.3 });
}
export function spawnGemFade(pos, el) {
    pop('gemFade', pos, { size: 1.1, y: 0, life: 0.55, rise: -0.3, grow: 0.3 });
}
/** Ngọc bay từ chỗ bấm vào quả cầu quanh người (getTo trả về vị trí đích mỗi khung hình) — vệt sáng kéo theo */
export function spawnGemFly(from, getTo, el, { duration = 0.28, onDone } = {}) {
    const g = makeGem(el, 0.42);
    const streak = sprite('streak', 0.45);
    g.group.add(streak);
    let done = false, prev = null;
    addAnim(g.group, duration, (p, fx) => {
        const to = getTo();
        const e = easeOut(p);
        const pos = new THREE.Vector3(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e + Math.sin(p * Math.PI) * 0.5, from.z + (to.z - from.z) * e);
        if (prev) {
            const a = Math.atan2(pos.y - prev.y, pos.x - prev.x);
            streak.rotation.z = a;
            streak.position.set(-Math.cos(a) * 0.6, -Math.sin(a) * 0.6, -0.01);
        }
        prev = pos.clone();
        fx.mesh.position.copy(pos);
        fx.mesh.scale.setScalar(1 - 0.35 * p);
        if (p >= 1 && !done) {
            done = true;
            pop(RING[el], to, { size: 1.0, y: 0, life: 0.4, grow: 0.5 });
            onDone?.();
        }
    });
}

// ---------- Sách / Bão ----------
/** Đọc Sách: ấn chữ vàng bốc lên từ trang sách + 3 vòng nguyên tố của 3 viên vừa đọc */
export function spawnBookFlash(pos, recipe = [], from = null) {
    const o = from ?? { x: pos.x, y: 2.0, z: pos.z };
    groundRing(pos, GOLD, 1.4, 0.6);
    pop('bookRune', o, { size: 2.3, y: 0.45, life: 0.85, rise: 0.45, grow: 0.25, glow: 0.8, glowColor: GOLD });
    recipe.forEach((el, k) => gameTimeout(() => pop(RING[el], { x: o.x + (k - 1) * 0.7, y: o.y, z: o.z }, { size: 0.95, y: 1.4, life: 0.5, grow: 0.6 }), 60 + k * 80));
}
/** Bão Nguyên Tố: lốc 3 nguyên tố xoáy quanh pháp sư */
export function spawnStormStart(pos) {
    const v = sprite('stormVortex', 4.4, { opacity: 0.95 });
    v.position.set(pos.x, 1.4, (pos.z ?? 0) + 0.7);
    addAnim(v, 1.1, (p, fx) => {
        const s = 0.5 + easeOut(Math.min(1, p / 0.35)) * 0.7;
        fx.mesh.scale.setScalar(s);
        fx.mesh.rotation.z -= 0.12;
        fx.mesh.material.opacity = 0.95 * (p > 0.65 ? (1 - p) / 0.35 : 1);
    });
    flash(pos, 0xffffff, { size: 4, y: 1.3, life: 0.4, opacity: 0.5 });
    [FIRE, ICE, VIOLET].forEach((c, k) => gameTimeout(() => spawnShockwave(pos, { color: c, radius: 4 + k, life: 0.6 }), k * 90));
}

// ---------- Đánh thường: tia nguyên tố ----------
export function spawnElemBolt(from, to, el = 'b', { duration = 0.16, onHit } = {}) {
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 1.1, 1.1, { color: ELEM_COLOR[el], opacity: 0.7 });
    const name = el === 'f' ? 'orbSmall' : el === 'i' ? 'iceShard' : 'zapSmall';
    const core = sprite(name, el === 'i' ? 0.55 : 0.9);
    g.add(glow, core);
    const ang = Math.atan2((to.y ?? 0) - (from.y ?? 0), to.x - from.x);
    if (el === 'i') core.rotation.z = ang;
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(from.x + (to.x - from.x) * p, from.y + (to.y - from.y) * p, (from.z ?? 0) + ((to.z ?? 0) - (from.z ?? 0)) * p + 0.6);
        if (el !== 'i') core.rotation.z -= 0.35;
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}
export function spawnElemHit(pos, el = 'b') {
    const name = el === 'f' ? 'fireBlast' : el === 'i' ? 'iceBreak' : 'zapBurst';
    pop(name, pos, { size: 1.5, y: 1.0, life: 0.32, grow: 0.3 });
}

// ---------- Phép ----------
/** Thiên Thạch: thiên thạch KHỔNG LỒ rơi chéo từ trời -> nổ lớn -> tảng đá lửa lăn thẳng về phía trước -> dải lửa cháy sau lưng */
export function spawnMeteor(m) {
    const fall = (m.fall ?? 800) / 1000, roll = (m.rollTime ?? 1000) / 1000;
    const dir = Math.sign((m.xEnd ?? m.x + 1) - m.x) || 1;
    const z = (m.z ?? 0) + 0.7;
    // rơi: vẽ sẵn chúi ~35° xuống phải -> xoay thêm cho khớp đường rơi
    const x0 = m.x - dir * 9, y0 = 15, y1 = FLOOR + 2.0;
    const ball = sprite('meteorFall', 5.5);
    const drawn = Math.atan2(-330, 471), path = Math.atan2(y1 - y0, (m.x - x0) * dir);
    ball.rotation.z = (path - drawn) * dir;
    ball.scale.x = dir;
    addAnim(ball, Math.max(0.3, fall - 0.05), (p, fx) => {
        const e = p * p;
        fx.mesh.position.set(x0 + (m.x - x0) * e, y0 + (y1 - y0) * e, z);
    });
    gameTimeout(() => {
        pop('meteorBoom', { x: m.x, z: m.z }, { size: 6.4, y: FLOOR + 2.8, life: 0.85, grow: 0.2, z: 0.75, hold: 0.55 });
        flash({ x: m.x, z: m.z }, FIRE, { size: 8, y: 1.2, life: 0.45, opacity: 0.6 });
        spawnShockwave({ x: m.x, z: m.z }, { color: FIRE, radius: (m.radius ?? 4) * 1.2, life: 0.65 });
        spawnEmbers(m.x, m.z, { count: 24, radius: 2.4, life: 1.1 });
        spawnLandingDust({ x: m.x, z: m.z }, 14);
    }, fall * 1000);
    // tảng đá lửa lăn + dải lửa
    const rock = sprite('rockBall', 2.8);
    const glow = fxPlane(glowTexture(), 4.2, 4.2, { color: FIRE, opacity: 0.45 });
    const g = new THREE.Group(); g.add(glow, rock);
    const trailLife = (m.trailTime ?? 2200) / 1000;
    let trailT = 0, lastX = m.x;
    gameTimeout(() => {
        addAnim(g, roll, (p, fx, dt) => {
            const x = m.x + (m.xEnd - m.x) * p;
            fx.mesh.position.set(x, FLOOR + 1.35 + Math.abs(Math.sin(p * 9)) * 0.15, z);
            rock.rotation.z -= dir * dt * 5;
            trailT -= dt;
            if (trailT <= 0 && Math.abs(x - lastX) > 1.0) {
                trailT = 0.1; lastX = x;
                spawnFireTrailPatch(x - dir * 1.0, m.z, Math.max(0.4, trailLife - p * roll), dir);
                spawnEmbers(x, m.z, { count: 3, radius: 0.6, life: 0.6 });
            }
        });
    }, fall * 1000);
}
function spawnFireTrailPatch(x, z, life, dir = 1) {
    const f = sprite('fireStrip', 1.3, { width: 3.0 });
    f.position.set(x, FLOOR + 0.6, (z ?? 0) + 0.35);
    f.scale.x = dir;
    addAnim(f, life, (p, fx) => {
        fx.mesh.scale.y = 0.85 + 0.2 * Math.sin(p * 40 + x);
        fx.mesh.material.opacity = Math.min(1, p * 10) * (p > 0.7 ? (1 - p) / 0.3 : 1);
    });
}
/** Trúng băng: băng vỡ bung dưới chân */
export function spawnIceHit(pos) {
    pop('iceSmash', pos, { size: 1.9, y: 0.4, life: 0.5, grow: 0.25 });
}
/** Lôi Xích: sét nảy lần lượt qua các điểm (points = [{x,y,z}...], gap = giây giữa 2 lần nảy) */
export function spawnChainLightning(points, gap = 0.12) {
    for (let k = 1; k < points.length; k++) {
        gameTimeout(() => {
            boltSeg(points[k - 1], points[k], { width: 1.6, life: 0.32 });
            pop('zapBurst', points[k], { size: 1.6, y: 0, life: 0.28, grow: 0.3 });
        }, (k - 1) * gap * 1000);
    }
}
/** Sét giật ngắn (Giáp Băng Sét phản đòn / Hào Quang Sét của Golem) */
export function spawnZap(from, to) {
    boltSeg(from, to, { width: 0.9, life: 0.22 });
    pop('zapSmall', to, { size: 1.0, y: 0, life: 0.22, grow: 0.3 });
}
/** Lốc Xoáy: phễu gió xoáy KHỔNG LỒ (2 khung luân phiên) quét thẳng tới */
export function spawnTornado(t) {
    const H = 6.6;
    const m = sprite('tornado1', H);
    let cur = 'tornado1', k = 0;
    const travel = (t.travel ?? 900) / 1000;
    addAnim(m, travel + 0.3, (p, fx, dt) => {
        k += dt;
        const n = Math.floor(k / 0.07) % 2 ? 'tornado2' : 'tornado1';
        if (n !== cur) { cur = n; setFrame(fx.mesh, n); }
        const q = Math.min(1, p * (travel + 0.3) / travel);
        fx.mesh.position.set(t.x0 + t.ux * t.length * q + Math.sin(k * 25) * 0.1, FLOOR + H * 0.48, t.z0 + t.uz * t.length * q + 0.75);
        const s = Math.min(1, p * 5);
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.material.opacity = p > 0.85 ? (1 - p) / 0.15 : 1;
    });
}
/** Hỏa Lôi Cầu nổ */
export function spawnFireBoltBlast(x, z, radius = 3) {
    pop('fireBlast', { x, z }, { size: radius * 1.9, y: 1.3, life: 0.65, grow: 0.25, hold: 0.5 });
    flash({ x, z }, FIRE, { size: radius * 2.4, y: 1.2, life: 0.4, opacity: 0.6 });
    spawnShockwave({ x, z }, { color: VIOLET, radius: radius * 0.9, life: 0.5 });
    for (let k = 0; k < 4; k++) boltSeg({ x, y: 1, z }, { x: x + (Math.random() - 0.5) * radius * 2, y: 2.2 + Math.random() * 1.5, z }, { width: 0.8, life: 0.25 });
    spawnEmbers(x, z, { count: 16, radius: radius * 0.6, life: 0.9 });
}
/** Tốc Lôi: vòng sét quanh người */
export function spawnHasteBurst(pos) {
    pop('hasteRing', pos, { size: 2.6, y: 1.3, life: 0.6, grow: 0.5 });
    groundRing(pos, VIOLET, 1.4, 0.5);
}
/** Giáp Băng Sét vừa bật */
export function spawnWardPop(pos, height = 2.4) {
    pop('wardDome', pos, { size: height * 0.95, y: height * 0.45, life: 0.5, grow: 0.3 });
    spawnZap({ x: pos.x - 0.6, y: height, z: pos.z ?? 0 }, { x: pos.x + 0.6, y: 0.3, z: pos.z ?? 0 });
}

// ---------- Phép bản 2 ----------
/** Băng Phong: khối băng KHỔNG LỒ thành hình trên đầu đội địch -> rơi -> vỡ, các khối nhỏ văng ra rơi xuống */
export function spawnIceBlockDrop(f) {
    const form = (f.form ?? 1500) / 1000, fall = (f.fall ?? 300) / 1000;
    const H = 4.6, top = 7.2;
    const block = sprite('iceChunk', H);
    const glow = fxPlane(glowTexture(), H * 1.8, H * 1.8, { color: ICE, opacity: 0.35 });
    const g = new THREE.Group(); g.add(glow, block);
    gameTimeout(() => {
        addAnim(g, form + fall, (p, fx) => {
            const t = p * (form + fall);
            if (t < form) {   // thành hình: to dần, xoay nhẹ
                const q = t / form;
                fx.mesh.position.set(f.x, top, (f.z ?? 0) + 0.8);
                fx.mesh.scale.setScalar(0.2 + 0.8 * easeOut(q));
                block.rotation.z = Math.sin(q * 6) * 0.1;
            } else {           // rơi
                const q = (t - form) / fall;
                fx.mesh.position.set(f.x, top + (FLOOR + H * 0.4 - top) * q * q, (f.z ?? 0) + 0.8);
            }
        });
        spawnRisingSparkles({ x: f.x, z: f.z, y: top - 2 }, { count: 12, color: ICE, radius: 1.6 });
    }, f.start ?? 0);
    const land = (f.start ?? 0) + (f.form ?? 1500) + (f.fall ?? 300);
    gameTimeout(() => {
        pop('iceSmash', { x: f.x, z: f.z }, { size: 5.4, y: FLOOR + 2.4, life: 0.7, grow: 0.2, z: 0.85, hold: 0.55 });
        flash({ x: f.x, z: f.z }, ICE, { size: 6, y: 1, life: 0.4, opacity: 0.5 });
        spawnShockwave({ x: f.x, z: f.z }, { color: ICE, radius: 7, life: 0.6 });
        spawnLandingDust({ x: f.x, z: f.z }, 12);
        (f.shards ?? []).forEach((p, k) => {
            const sh = sprite('iceChunk', 1.3);
            const fly = 0.35 + k * 0.07;
            addAnim(sh, fly, (q, fx) => {
                fx.mesh.position.set(f.x + (p.x - f.x) * q, FLOOR + 1 + Math.sin(q * Math.PI) * 3.6, (f.z ?? 0) + ((p.z ?? 0) - (f.z ?? 0)) * q + 0.8);
                fx.mesh.rotation.z += 0.25;
            });
            gameTimeout(() => pop('iceBreak', { x: p.x, z: p.z }, { size: 1.8, y: 0.6, life: 0.4 }), fly * 1000);
        });
    }, land);
}
/** Hỏa Lôi Cầu: quả cầu hiện ở điểm cách Elarion 1 khoảng phía trước, to dần `grow` rồi nổ tại chỗ */
export function spawnGrowingOrb(b) {
    const grow = (b.grow ?? 2000) / 1000;
    const orb = sprite('orbSmall', 1);
    const glow = fxPlane(glowTexture(), 1.6, 1.6, { color: FIRE, opacity: 0.45 });
    const g = new THREE.Group(); g.add(glow, orb);
    gameTimeout(() => {
        let zt = 0, cur = 'orbSmall';
        addAnim(g, grow, (p, fx, dt) => {
            const s = 1.0 + p * p * 3.6;
            const n = p > 0.4 ? 'orbBig' : 'orbSmall';
            if (n !== cur) { cur = n; setFrame(orb, n); }
            fx.mesh.position.set(b.x, FLOOR + 1.8 + p * 0.9, (b.z ?? 0) + 0.8);
            orb.scale.setScalar(s * (1 + 0.06 * Math.sin(p * 70)));
            orb.rotation.z -= dt * (2 + p * 6);
            glow.scale.setScalar(s * 1.2);
            zt -= dt;
            if (zt <= 0) {
                zt = 0.14 - p * 0.08;
                const a = Math.random() * Math.PI * 2, r = s * 0.6;
                const c = { x: b.x, y: FLOOR + 1.8 + p * 0.9, z: b.z ?? 0 };
                boltSeg(c, { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, z: c.z }, { width: 0.6, life: 0.14 });
            }
        });
        groundRing(b, VIOLET, b.radius ?? 3.5, grow);
    }, b.start ?? 0);
}
// ---------- Băng Hoại Hỏa Thiên: SolarBeam băng-hỏa kiểu Kamehameha ----------
// Tia vẽ bằng texture lặp ngang (canvas) cuộn về phía trước: vỏ BĂNG ngoài cùng · lõi LỬA · lõi trắng nóng ·
// 2 dải băng / lửa XOẮN quanh lõi (helix) · bùng sáng ở lòng bàn tay · nổ ở cuối tia (mép bản đồ) · vệt sáng dưới đất.
const BEAM_TEX = {};
function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function beamTexture(key, w, h, draw) {
    if (BEAM_TEX[key]) return BEAM_TEX[key];
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    return (BEAM_TEX[key] = t);
}
/** Vẽ ở x-w, x, x+w để ảnh nối liền khi lặp ngang */
const wrapX = (w, x, fn) => [-w, 0, w].forEach(d => fn(x + d));
/** Dải màu đối xứng theo chiều dọc (stops chỉ cho nửa trên 0..0.5) */
function bandGradient(ctx, H, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    stops.forEach(([o, c]) => { g.addColorStop(o, c); if (o < 0.5) g.addColorStop(1 - o, c); });
    return g;
}
function fireBeamTexture() {
    return beamTexture('fire', 512, 128, (ctx, W, H) => {
        const r = seeded(11);
        ctx.fillStyle = bandGradient(ctx, H, [[0, 'rgba(190,20,0,0)'], [0.12, 'rgba(210,40,5,0.5)'], [0.24, 'rgba(250,95,15,0.95)'],
            [0.36, 'rgba(255,165,40,1)'], [0.46, 'rgba(255,225,130,1)'], [0.5, 'rgba(255,248,215,1)']]);
        ctx.fillRect(0, 0, W, H);
        // lưỡi lửa liếm ra 2 mép, ngả ra sau (tia chảy về phía trước)
        for (let i = 0; i < 36; i++) {
            const x = r() * W, top = i % 2 === 0, base = H * (top ? 0.24 : 0.76), tip = top ? H * (0.02 + r() * 0.1) : H * (0.88 + r() * 0.1);
            const lean = 16 + r() * 30, wd = 7 + r() * 12, col = r() < 0.5 ? 'rgba(255,125,25,0.92)' : 'rgba(225,55,10,0.85)';
            wrapX(W, x, (xx) => {
                ctx.beginPath();
                ctx.moveTo(xx - wd, base);
                ctx.quadraticCurveTo(xx - wd * 0.3, (base + tip) / 2, xx - lean, tip);
                ctx.quadraticCurveTo(xx + wd * 0.2, (base + tip) / 2, xx + wd, base);
                ctx.closePath();
                ctx.fillStyle = col; ctx.fill();
            });
        }
        // vệt lửa chạy dọc tia
        for (let i = 0; i < 95; i++) {
            const y = H * (0.2 + r() * 0.6), len = 30 + r() * 150, th = 1.5 + r() * 6, x = r() * W, d = Math.abs(y / H - 0.5);
            const col = d < 0.08 ? `rgba(255,255,${200 + r() * 55 | 0},${0.55 + r() * 0.45})`
                : d < 0.17 ? `rgba(255,${190 + r() * 50 | 0},${60 + r() * 60 | 0},${0.5 + r() * 0.5})`
                : r() < 0.6 ? `rgba(255,${70 + r() * 70 | 0},10,${0.5 + r() * 0.4})` : `rgba(170,${20 + r() * 25 | 0},0,${0.35 + r() * 0.4})`;
            ctx.fillStyle = col;
            wrapX(W, x, (xx) => { ctx.beginPath(); ctx.ellipse(xx, y, len / 2, th / 2, 0, 0, Math.PI * 2); ctx.fill(); });
        }
    });
}
function iceBeamTexture() {
    return beamTexture('ice', 512, 128, (ctx, W, H) => {
        const r = seeded(29);
        ctx.fillStyle = bandGradient(ctx, H, [[0, 'rgba(30,90,230,0)'], [0.1, 'rgba(40,120,240,0.32)'], [0.22, 'rgba(70,175,255,0.72)'],
            [0.34, 'rgba(150,225,255,0.9)'], [0.44, 'rgba(215,245,255,0.95)'], [0.5, 'rgba(245,253,255,1)']]);
        ctx.fillRect(0, 0, W, H);
        // vệt sáng lạnh chạy dọc
        for (let i = 0; i < 60; i++) {
            const y = H * (0.15 + r() * 0.7), len = 40 + r() * 170, th = 1 + r() * 3.5, x = r() * W;
            const col = r() < 0.5 ? `rgba(255,255,255,${0.4 + r() * 0.5})` : `rgba(120,${200 + r() * 50 | 0},255,${0.4 + r() * 0.5})`;
            ctx.fillStyle = col;
            wrapX(W, x, (xx) => { ctx.beginPath(); ctx.ellipse(xx, y, len / 2, th / 2, 0, 0, Math.PI * 2); ctx.fill(); });
        }
        // mảnh băng nhọn (thoi dẹt dọc theo tia), nhiều ở 2 mép
        for (let i = 0; i < 48; i++) {
            const edge = r() < 0.7;
            const y = edge ? (r() < 0.5 ? H * (0.08 + r() * 0.16) : H * (0.76 + r() * 0.16)) : H * (0.3 + r() * 0.4);
            const len = 16 + r() * 46, th = 3 + r() * 7, x = r() * W, tilt = (r() - 0.5) * 0.5;
            const fill = r() < 0.5 ? 'rgba(235,250,255,0.95)' : 'rgba(150,215,255,0.92)';
            wrapX(W, x, (xx) => {
                ctx.save(); ctx.translate(xx, y); ctx.rotate(tilt);
                ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(0, -th / 2); ctx.lineTo(len / 2, 0); ctx.lineTo(0, th / 2); ctx.closePath();
                ctx.fillStyle = fill; ctx.fill();
                ctx.strokeStyle = 'rgba(40,110,220,0.85)'; ctx.lineWidth = 1; ctx.stroke();
                ctx.restore();
            });
        }
        // đốm lấp lánh 4 cánh
        for (let i = 0; i < 28; i++) {
            const x = r() * W, y = H * (0.12 + r() * 0.76), s = 3 + r() * 6;
            wrapX(W, x, (xx) => {
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.beginPath(); ctx.moveTo(xx - s, y); ctx.lineTo(xx, y - s * 0.22); ctx.lineTo(xx + s, y); ctx.lineTo(xx, y + s * 0.22); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(xx, y - s); ctx.lineTo(xx + s * 0.22, y); ctx.lineTo(xx, y + s); ctx.lineTo(xx - s * 0.22, y); ctx.closePath(); ctx.fill();
            });
        }
    });
}
/** Lõi sáng (dải trắng mềm, đều theo chiều dài) */
function beamCoreTexture() {
    return beamTexture('core', 16, 64, (ctx, W, H) => {
        ctx.fillStyle = bandGradient(ctx, H, [[0, 'rgba(255,255,255,0)'], [0.22, 'rgba(255,255,255,0.22)'], [0.38, 'rgba(255,255,255,0.8)'], [0.5, 'rgba(255,255,255,1)']]);
        ctx.fillRect(0, 0, W, H);
    });
}
/** Bùng sáng ở lòng bàn tay / cuối tia: tia gai băng (lam) xen lửa (cam), tâm trắng */
function beamFlareTexture() {
    return beamTexture('flare', 256, 256, (ctx, W, H) => {
        const r = seeded(5), c = W / 2;
        const g = ctx.createRadialGradient(c, c, 0, c, c, c);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,240,200,0.95)'); g.addColorStop(0.4, 'rgba(255,150,60,0.45)'); g.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 22; i++) {
            const a = (i / 22) * Math.PI * 2 + (r() - 0.5) * 0.2, L = c * (0.45 + r() * 0.5), w = 0.05 + r() * 0.06;
            const iceSpike = i % 2 === 0;
            ctx.beginPath();
            ctx.moveTo(c + Math.cos(a - w) * c * 0.12, c + Math.sin(a - w) * c * 0.12);
            ctx.lineTo(c + Math.cos(a) * L, c + Math.sin(a) * L);
            ctx.lineTo(c + Math.cos(a + w) * c * 0.12, c + Math.sin(a + w) * c * 0.12);
            ctx.closePath();
            const sg = ctx.createLinearGradient(c, c, c + Math.cos(a) * L, c + Math.sin(a) * L);
            sg.addColorStop(0, 'rgba(255,255,255,1)');
            sg.addColorStop(0.35, iceSpike ? 'rgba(150,230,255,0.95)' : 'rgba(255,190,80,0.95)');
            sg.addColorStop(1, iceSpike ? 'rgba(60,150,255,0)' : 'rgba(255,70,10,0)');
            ctx.fillStyle = sg; ctx.fill();
        }
    });
}
/** 1 lớp tia (mặt phẳng 1×1, kéo giãn bằng scale). Mỗi tia có bản texture riêng (repeat / offset riêng) */
function beamLayer(tex, { additive = false, opacity = 1, color = 0xffffff, order = 0, seg = 0 } = {}) {
    const t = textureView(tex);
    const m = new THREE.Mesh(seg ? new THREE.PlaneGeometry(1, 1, seg, 1) : new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
        map: t, transparent: true, depthWrite: false, opacity, color, fog: false, side: THREE.DoubleSide,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    }));
    m.renderOrder = 6 + order;
    m.userData.base = opacity;
    return m;
}
/** Lớp tia thẳng, TÚM NHỎ ở lòng bàn tay rồi nở ra (taper giây đầu), cột dày ở đoạn đầu -> mép đầu tia không bị cắt thẳng.
 *  Lần đầu gọi đặt luôn uv theo chiều dài (texture lặp đều) */
const STRAIGHT_COLS = 16;
function shapeStraight(mesh, len, h, taper) {
    const geo = mesh.geometry, pos = geo.attributes.position, uv = geo.attributes.uv;
    const N = STRAIGHT_COLS, head = 11, T = Math.min(taper * 1.6, len * 0.5);
    for (let i = 0; i <= N; i++) {
        const x = i <= head ? (i / head) * T : T + ((i - head) / (N - head)) * (len - T);
        const q = Math.min(1, x / taper), w = h * (0.18 + 0.82 * q * q * (3 - 2 * q));
        pos.setXYZ(i, x, w / 2, 0); pos.setXYZ(N + 1 + i, x, -w / 2, 0);
        if (!mesh.userData.uvSet) { uv.setXY(i, x / len, 1); uv.setXY(N + 1 + i, x / len, 0); }
    }
    pos.needsUpdate = true;
    if (!mesh.userData.uvSet) { uv.needsUpdate = true; mesh.userData.uvSet = true; }
}
/** Dải xoắn (helix giả 2D): uốn sin dọc tia, dày lên khi "ở phía trước" */
function bendRibbon(mesh, len, t, { amp, h, lambda, speed, phase }) {
    const pos = mesh.geometry.attributes.position;
    const seg = pos.count / 2 - 1;
    for (let i = 0; i <= seg; i++) {
        const x = (i / seg) * len;
        const ph = (x / lambda) * Math.PI * 2 - t * speed + phase;
        const a = amp * Math.min(1, x / 1.6);                      // xoắn túm lại ở lòng bàn tay
        const y = a * Math.sin(ph), th = h * (0.62 + 0.4 * Math.cos(ph)), z = 0.06 * Math.cos(ph);
        pos.setXYZ(i, x, y + th / 2, z);
        pos.setXYZ(seg + 1 + i, x, y - th / 2, z);
    }
    pos.needsUpdate = true;
}
/**
 * Băng Hoại Hỏa Thiên — SolarBeam băng-hỏa kiểu Kamehameha.
 * getOrigin(): lòng bàn tay mỗi khung hình · (ux, uz): hướng tia (mặt đất) · len: dài tới mép bản đồ ·
 * charge: giây dồn lực (cầu băng + cầu lửa xoay quanh nhau tụ vào tay) · duration: giây giữ tia · alive(): false -> tắt ngay.
 * Trả về { stop(), setStacks(n, big), pulse() }: n = tầng lửa (tia lửa dày dần), big = đủ tầng (tia lửa TO hẳn).
 */
export function spawnSolarBeam({ getOrigin, ux = 1, uz = 0, len = 40, charge = 0.7, duration = 7, alive } = {}) {
    const sx = ux < 0 ? -1 : 1;
    const ang = Math.atan2(uz, Math.abs(ux));
    const root = new THREE.Group();
    root.scale.x = sx;
    root.rotation.y = -ang * sx;
    const body = new THREE.Group();
    root.add(body);
    // các lớp: vỏ băng (sau cùng) · lửa · 2 dải xoắn · lõi trắng (cộng sáng)
    const ice = beamLayer(iceBeamTexture(), { opacity: 0.9, order: 0, seg: STRAIGHT_COLS });
    const fire = beamLayer(fireBeamTexture(), { opacity: 1, order: 1, seg: STRAIGHT_COLS });
    const ribIce = beamLayer(iceBeamTexture(), { opacity: 1, order: 2, seg: Math.max(60, Math.ceil(len / 0.25)) });
    const ribFire = beamLayer(fireBeamTexture(), { opacity: 1, order: 3, seg: Math.max(60, Math.ceil(len / 0.25)) });
    const core = beamLayer(beamCoreTexture(), { additive: true, opacity: 0.85, order: 4, color: 0xfff4d6, seg: STRAIGHT_COLS });
    ice.material.map.repeat.x = len / 9; fire.material.map.repeat.x = len / 7;
    ribIce.material.map.repeat.x = len / 6; ribFire.material.map.repeat.x = len / 5;
    body.add(ice, fire, ribIce, ribFire, core);
    // vệt sáng dưới đất theo đường tia (để nhìn rõ tia đi về hàng nào)
    const ground = beamLayer(beamCoreTexture(), { additive: true, opacity: 0.4, order: -1, color: 0xffb37a });
    ground.rotation.x = -Math.PI / 2;
    ground.scale.set(len, 1.6, 1);
    body.add(ground);
    body.visible = false;   // hiện khi phóng tia (hết dồn lực)
    // bùng sáng ở lòng bàn tay (nhích ra trước, không che người)
    const mGlow = fxPlane(glowTexture(), 1, 1, { color: 0xffffff, opacity: 0 });
    const mFire = fxPlane(beamFlareTexture(), 1.5, 1.5, { additive: false, opacity: 0 });
    const mIce = sprite('iceSmash', 1.5, { opacity: 0 });
    const orbF = fxPlane(glowTexture(), 1, 1, { additive: false, color: FIRE, opacity: 0 });
    const orbI = fxPlane(glowTexture(), 1, 1, { additive: false, color: 0x5fd4ff, opacity: 0 });
    [mIce, mFire, orbI, orbF, mGlow].forEach((m, i) => { m.renderOrder = 12 + i; root.add(m); });
    // nổ ở cuối tia
    const tFire = fxPlane(beamFlareTexture(), 3.6, 3.6, { additive: false, opacity: 0 });
    const tIce = sprite('iceSmash', 3.2, { opacity: 0 });
    [tIce, tFire].forEach((m, i) => { m.renderOrder = 11 + i; root.add(m); });

    const dirW = new THREE.Vector3(Math.cos(ang) * sx, 0, Math.sin(ang));
    let k = 0, ext = 0, stacks = 0, big = 0, bigT = 0, flick = 0, endAt = charge + duration, fired = false;
    let suck = 0, spark = 0, tipT = 0;
    const H = { ice: 2.2, fire: 1.05, core: 0.32, rib: 0.24, amp: 0.6 };
    const cur = { ...H };
    const fx = addAnim(root, charge + duration + 0.6, (p, f, dt) => {
        const t = f.age;
        if (alive && !alive() && endAt > t + 0.15) { endAt = t + 0.15; f.life = Math.min(f.life, t + 0.5); }
        const o = getOrigin?.() ?? { x: 0, y: 1, z: 0 };
        root.position.set(o.x, o.y ?? 1, (o.z ?? 0) + 0.35);
        ground.position.set(len / 2, FLOOR + 0.04 - (o.y ?? 1), 0);
        // ---- dồn lực: cầu băng + cầu lửa xoay quanh nhau tụ vào lòng bàn tay ----
        if (t < charge || endAt <= charge) {   // (bị ngắt lúc đang dồn lực: không phóng tia, tắt dần)
            const q = Math.min(1, t / charge), fade = t < endAt ? 1 : Math.max(0, 1 - (t - endAt) / 0.2);
            const r = 0.75 * (1 - q) + 0.1, a = q * 15;
            orbF.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.8, 0.02);
            orbI.position.set(-Math.cos(a) * r, -Math.sin(a) * r * 0.8, 0.01);
            const os = 0.45 + q * 0.75;
            orbF.scale.setScalar(os); orbI.scale.setScalar(os);
            orbF.material.opacity = orbI.material.opacity = Math.min(1, q * 4) * 0.95 * fade;
            mGlow.scale.setScalar(0.3 + q * 1.3);
            mGlow.material.opacity = (0.35 + q * 0.6) * fade;
            suck -= dt;
            if (suck <= 0 && fade === 1) {
                suck = 0.04;
                const d = fxPlane(glowTexture(), 0.3, 0.3, { color: Math.random() < 0.5 ? FIRE : ICE });
                const aa = Math.random() * Math.PI * 2, rr = 1.6 + Math.random() * 1.6;
                const ox = Math.cos(aa) * rr, oy = Math.sin(aa) * rr * 0.8;
                addAnim(d, 0.32, (q2, f2) => {
                    const oo = getOrigin?.() ?? o;
                    f2.mesh.position.set(oo.x + ox * (1 - q2), (oo.y ?? 1) + oy * (1 - q2), (oo.z ?? 0) + 0.45);
                    f2.mesh.material.opacity = 0.4 + q2 * 0.6;
                });
            }
            return;
        }
        // ---- HA! tia phóng ra ----
        if (!fired) {
            fired = true;
            body.visible = true;
            orbF.material.opacity = orbI.material.opacity = 0;
            flash({ x: o.x + dirW.x * 0.8, y: (o.y ?? 1) - 1, z: o.z }, 0xffffff, { size: 3.2, y: 1, life: 0.3, opacity: 0.75 });
            spawnShockwave({ x: o.x, z: o.z ?? 0 }, { color: 0x9be7ff, radius: 2.6, life: 0.45 });
            spawnHitSpark({ x: o.x, y: (o.y ?? 1) - 0.75, z: o.z }, { count: 14, color: 0xffd28a, size: 1.4 });
        }
        const live = t < endAt;
        const target = live ? Math.min(1, (t - charge) * 8) : Math.max(0, 1 - (t - endAt) / 0.3);
        k += (target - k) * Math.min(1, dt * 14);
        ext = Math.min(1, ext + dt / 0.16);                       // tia vươn ra hết chiều dài trong 0,16s
        body.scale.x = ext;
        // độ dày theo tầng lửa (đủ tầng: tia lửa to hẳn)
        const want = big ? { ice: 2.85, fire: 1.95, core: 0.55, rib: 0.34, amp: 1.0 }
            : { ice: H.ice + stacks * 0.06, fire: H.fire + stacks * 0.1, core: H.core + stacks * 0.025, rib: H.rib, amp: H.amp + stacks * 0.04 };
        for (const key in cur) cur[key] += (want[key] - cur[key]) * Math.min(1, dt * (big ? 6 : 4));
        bigT = Math.max(0, bigT - dt);
        flick = Math.max(0, flick - dt * 4);
        const wob = 1 + 0.06 * Math.sin(t * 47) + 0.04 * Math.sin(t * 31) + bigT * 0.5 + flick * 0.12;
        const shrink = live ? 1 : k;
        shapeStraight(ice, len, cur.ice * wob * shrink, 1.6);
        shapeStraight(fire, len, cur.fire * wob * shrink, 1.1);
        shapeStraight(core, len, cur.core * (1 + 0.15 * Math.sin(t * 60)) * shrink, 0.7);
        ice.material.opacity = 0.9 * k; fire.material.opacity = k; core.material.opacity = (0.75 + flick * 0.25) * k;
        ribIce.material.opacity = ribFire.material.opacity = k;
        ground.material.opacity = 0.4 * k;
        bendRibbon(ribIce, len, t, { amp: cur.amp * shrink, h: cur.rib * shrink, lambda: 4.6, speed: 14, phase: 0 });
        bendRibbon(ribFire, len, t, { amp: cur.amp * shrink, h: cur.rib * shrink, lambda: 4.6, speed: 14, phase: Math.PI });
        // cuộn texture về phía trước
        ice.material.map.offset.x -= dt * 1.6;
        fire.material.map.offset.x -= dt * 3.0;
        ribIce.material.map.offset.x -= dt * 4.0;
        ribFire.material.map.offset.x -= dt * 4.6;
        // lòng bàn tay: quả cầu sáng rung + lửa / băng bung
        const ms = (big ? 1.5 : 1.0 + stacks * 0.06) * (1 + 0.1 * Math.sin(t * 38)) * Math.max(0.2, shrink);
        [mGlow, mFire, mIce].forEach(m => { m.position.x = 0.45; });
        mGlow.scale.setScalar(1.6 * ms); mGlow.material.opacity = 0.85 * k;
        mFire.scale.set(ms, ms, 1); mFire.rotation.z = t * 6; mFire.material.opacity = k;
        mIce.scale.set(ms * 0.95, ms * 0.95, 1); mIce.rotation.z = -t * 3; mIce.material.opacity = 0.9 * k;
        // cuối tia (mép bản đồ): nổ liên tục
        const tipX = len * ext;
        tFire.position.set(tipX, 0, 0.02); tIce.position.set(tipX - 0.4, 0, 0.01);
        tipT += dt;
        const tp = (tipT % 0.22) / 0.22;
        const ts = (big ? 1.4 : 1) * (0.85 + tp * 0.35) * shrink;
        tFire.scale.set(ts, ts, 1); tIce.scale.set(ts * 1.1, ts * 1.1, 1);
        tFire.rotation.z = tipT * 4; tIce.rotation.z = -tipT * 2.5;
        tFire.material.opacity = k * (1 - tp * 0.4); tIce.material.opacity = k * 0.9;
        // mảnh băng + tàn lửa bay dọc tia
        spark -= dt;
        if (live && spark <= 0) {
            spark = 0.03;
            const isIce = Math.random() < 0.5;
            const s = isIce ? sprite('iceShard', 0.42) : fxPlane(glowTexture(), 0.34, 0.34, { color: Math.random() < 0.5 ? 0xffd27a : FIRE });
            const s0 = 0.6 + Math.random() * 2.5, yo = (Math.random() - 0.5) * cur.ice * 0.9, zo = (Math.random() - 0.5) * 0.4;
            const sp = 26 + Math.random() * 14;
            const o0 = { x: o.x, y: o.y ?? 1, z: (o.z ?? 0) + 0.4 };
            s.renderOrder = 14;
            s.scale.x = sx;
            addAnim(s, 0.55, (q2, f2) => {
                const d = s0 + sp * f2.age;
                f2.mesh.position.set(o0.x + dirW.x * d, o0.y + yo, o0.z + dirW.z * d + zo);
                f2.mesh.material.opacity = (1 - q2) * 0.95;
            });
        }
    });
    return {
        stop() { if (endAt > fx.age) { endAt = fx.age; fx.life = Math.min(fx.life, fx.age + 0.45); } },
        /** n = số tầng lửa; big = đủ tầng (lần đầu: bùng to) */
        setStacks(n, isBig) {
            stacks = n;
            if (isBig && !big) {
                big = 1; bigT = 0.45;
                const o = getOrigin?.() ?? { x: 0, y: 1, z: 0 };
                flash({ x: o.x + dirW.x * 1.2, y: (o.y ?? 1) - 1, z: o.z }, FIRE, { size: 5, y: 1, life: 0.4, opacity: 0.75 });
                spawnShockwave({ x: o.x, z: o.z ?? 0 }, { color: 0xff8a3d, radius: 4, life: 0.55 });
                spawnEmbers(o.x, o.z ?? 0, { count: 18, radius: 1.6, life: 0.9 });
            }
        },
        /** nhịp gây sát thương (mỗi giây): tia loé sáng */
        pulse() { flick = 1; },
    };
}
/** Hơi Nước Bỏng: 1 MẢNG MÂY ĐEN LỚN phủ trận + trời tối, mưa xiên toàn màn hình — trả về { stop(), flash() } */
export function spawnRainCloud(r) {
    const life = (r.duration ?? 7000) / 1000;
    const g = new THREE.Group();
    // 1 mảng mây đen lớn phủ ngang trận (giữ màu tranh: mây xanh đen, mưa trắng)
    const W = 28, H = 9.5;
    const c = sprite('rainCloud', H, { width: W, opacity: 0, color: 0xc8cdd8 });
    c.position.set(r.x, 5.0, -1.2);
    g.add(c);
    const clouds = [{ c, q: { x: 0, y: 5.0 } }];
    const sky = startStorm({ duration: r.duration ?? 7000 });
    let k = 0, stopAt = life;
    const fx = addAnim(g, life, (p, f, dt) => {
        const t = f.age;
        const target = t < 0.6 ? t / 0.6 : t > stopAt - 0.7 ? Math.max(0, (stopAt - t) / 0.7) : 1;
        k += (target - k) * Math.min(1, dt * 6);
        clouds.forEach(({ c, q }, i) => {
            c.material.opacity = k;
            c.position.x = r.x + q.x + Math.sin(t * 0.4 + i) * 0.4;
            c.position.y = q.y + (1 - k) * 1.5;
        });
    });
    return {
        stop() { const t = fx.age; stopAt = Math.min(stopAt, t + 0.7); fx.life = Math.min(fx.life, t + 0.75); sky.stop(); },
        flash() { sky.flash(); },
    };
}
/** Sét từ mây giông đánh xuống 1 đối thủ (sky = mây đang hiện để chớp sáng cả màn hình) */
export function spawnCloudStrike(pos, sky = null) {
    const top = { x: pos.x - 0.8 + Math.random() * 0.6, y: 6.6, z: pos.z ?? 0 };
    const mid = { x: pos.x + (Math.random() - 0.5) * 1.2, y: 3.4, z: pos.z ?? 0 };
    const bot = { x: pos.x, y: 0.2, z: pos.z ?? 0 };
    boltSeg(top, mid, { width: 1.9, life: 0.35 });
    boltSeg(mid, bot, { width: 1.9, life: 0.35 });
    pop('zapBurst', pos, { size: 2.6, y: 0.5, life: 0.35, grow: 0.3 });
    flash(pos, VIOLET, { size: 3.2, y: 0.6, life: 0.35, opacity: 0.6 });
    sky?.flash?.();
}
/** Mưa hồi máu trên 1 đồng đội (xanh) / hồi MP (lam) */
export function spawnRainHeal(pos, mana = false) {
    pop('healDrops', pos, { size: 1.6, y: 1.7, life: 0.75, rise: -0.5, grow: 0.1, color: mana ? 0x9cc9ff : 0xffffff });
}
/** Tốc Lôi: chưởng thứ 2 */
export function spawnPalmEcho(from, to, { onHit } = {}) {
    const dir = to.x >= from.x ? 1 : -1;
    pop('palmDouble', from, { size: 1.3, y: 0, life: 0.32, grow: 0.3, dir });
    spawnElemBolt(from, to, 'b', { duration: 0.14, onHit });
}
/** Hào quang sét quanh người (Tốc Lôi của Elarion / Golem — Hào Quang Sét) */
export function makeSparkAura(height = 2.4, color = VIOLET) {
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), height * 1.0, height * 1.2, { color, opacity: 0 });
    glow.position.set(0, height * 0.5, 0.3);
    const ring = sprite('ringBolt', height * 0.8, { opacity: 0 });
    ring.position.set(0, height * 0.45, 0.32);
    g.add(glow, ring);
    let t = 0, zap = 0;
    return {
        group: g,
        update(dt, k, pos) {
            t += dt; zap -= dt;
            glow.material.opacity = k * (0.18 + 0.1 * Math.sin(t * 14));
            ring.material.opacity = k * (0.55 + 0.25 * Math.sin(t * 11));
            ring.rotation.z -= dt * 2.5;
            if (k > 0.5 && zap <= 0 && pos) {
                zap = 0.2 + Math.random() * 0.22;
                const a = Math.random() * Math.PI * 2;
                spawnLightning({ x: pos.x + Math.cos(a) * height * 0.2, y: height * (0.3 + Math.random() * 0.6), z: pos.z ?? 0 },
                    { x: pos.x + Math.cos(a) * height * 0.45, y: height * (0.3 + Math.random() * 0.6), z: pos.z ?? 0 }, { width: 0.3, life: 0.1 });
            }
        },
        dispose() { g.removeFromParent(); [glow, ring].forEach(o => { o.material.dispose(); o.geometry.dispose(); }); },
    };
}
/** Golem hít khí lạnh (niệm Bão Tuyết): xoáy khí lạnh trước miệng (pos = miệng) */
export function spawnInhale(pos, dir = 1, life = 2) {
    const H = 3.2;
    const s = sprite('inhaleSpiral', H, { opacity: 0 });
    const W = H * tex('inhaleSpiral').aspect;
    addAnim(s, life, (p, fx) => {
        fx.mesh.position.set(pos.x + dir * W * 0.48, (pos.y ?? 2.2), (pos.z ?? 0) + 0.85);
        fx.mesh.material.opacity = Math.min(1, p * 5) * (p > 0.85 ? (1 - p) / 0.15 : 1);
        const k = 1 + 0.06 * Math.sin(p * 40);
        fx.mesh.scale.set(-dir * k, k, 1);   // hình vẽ hội tụ bên phải -> lật để điểm hội tụ nằm ở miệng
    });
    for (let i = 0; i < 18; i++) {
        const sp = fxPlane(glowTexture(), 0.45, 0.45, { color: i % 2 ? 0xffffff : ICE });
        const d0 = 3 + Math.random() * 4, dy = (Math.random() - 0.5) * 3;
        const delay = Math.random() * Math.max(0.1, life - 0.5);
        gameTimeout(() => addAnim(sp, 0.55, (p, fx) => {
            fx.mesh.position.set(pos.x + dir * (0.3 + d0 * (1 - p)), (pos.y ?? 2.2) + dy * (1 - p), (pos.z ?? 0) + 0.85);
            fx.mesh.material.opacity = 1 - p * 0.5;
        }), delay * 1000);
    }
}
/**
 * Golem phun bão tuyết `life` giây về hướng dir: luồng băng từ miệng + BÃO TUYẾT TOÀN MÀN HÌNH.
 * getMouth(): vị trí miệng mỗi khung hình (Golem chồm tới / lùi) · alive(): false (Golem gục / tan) -> tắt ngay
 * Trả về { stop() }.
 */
export function spawnBreath(pos, dir = 1, life = 6, { getMouth, alive } = {}) {
    const H = 3.4;
    const cone = sprite('blizzard', H, { opacity: 0 });
    const W = H * tex('blizzard').aspect;
    const g = new THREE.Group();
    cone.position.x = W * 0.5;
    g.add(cone);
    g.scale.x = dir * 1.8;
    g.rotation.z = -dir * 0.16;   // chúi xuống hàng địch
    let t = 0, endAt = life, k = 0;
    const screen = startBlizzard({ dir, duration: life * 1000, alive });
    const fx = addAnim(g, life, (p, f, dt) => {
        const m = getMouth?.() ?? pos;
        if (alive && !alive() && endAt > f.age + 0.2) { endAt = f.age + 0.2; f.life = Math.min(f.life, f.age + 0.25); }
        f.mesh.position.set(m.x, (m.y ?? 2.2) - 0.25, (m.z ?? 0) + 0.85);
        const target = f.age > endAt - 0.4 ? Math.max(0, (endAt - f.age) / 0.4) : Math.min(1, f.age * 4);
        k += (target - k) * Math.min(1, dt * 12);
        cone.material.opacity = k * (0.88 + 0.12 * Math.sin(f.age * 50));
        cone.scale.y = 1 + 0.08 * Math.sin(f.age * 40);
        t -= dt;
        if (t > 0 || k < 0.3) return;
        t = 0.07;
        const s = fxPlane(glowTexture(), 0.7, 0.7, { color: Math.random() < 0.5 ? 0xffffff : ICE, opacity: 0.9 });
        const spread = (Math.random() - 0.5) * 0.6, d = 9 + Math.random() * 5;
        addAnim(s, 0.55, (q, f2) => {
            f2.mesh.position.set(m.x + dir * (0.5 + d * q), (m.y ?? 2.2) - 0.25 + spread * d * q - q * 2.2, (m.z ?? 0) + 0.9 + spread * 2 * q);
            f2.mesh.scale.setScalar(0.6 + q * 1.8);
            f2.mesh.material.opacity = 0.9 * (1 - q);
        });
    });
    return { stop() { endAt = Math.min(endAt, fx.age + 0.2); fx.life = Math.min(fx.life, fx.age + 0.25); screen.stop(); } };
}
/** Nộ Lửa: lửa bùng quanh nắm đấm trong lúc gồng (getPos(): vị trí nắm đấm) */
export function spawnFistFlame(getPos, life = 1) {
    let t = 0;
    addAnim(new THREE.Group(), life, (p, fx, dt) => {
        t -= dt;
        if (t > 0) return;
        t = 0.08;
        const q = getPos?.();
        if (!q) return;
        pop('fireBlast', q, { size: 1.4 + Math.random() * 0.6, y: 0, life: 0.3, grow: 0.3, spin: (Math.random() - 0.5) * 2 });
        spawnEmbers(q.x, q.z ?? 0, { count: 2, radius: 0.5, life: 0.5 });
    });
}

// ---------- Golem ----------
export function spawnGolemSummon(x, z) {
    const pos = { x, z };
    pop('summonPillar', pos, { size: 6.5, y: FLOOR + 3.2, life: 1.0, grow: 0.15 });
    groundRing(pos, GOLD, 3.2, 0.9);
    gameTimeout(() => {
        pop('landBurst', pos, { size: 3.4, y: FLOOR + 1.5, life: 0.7, grow: 0.3 });
        spawnLandingDust(pos, 18);
        spawnShockwave(pos, { color: 0xa8a29e, radius: 4, life: 0.5 });
    }, 350);
}
export function spawnGolemCrumble(pos) {
    pop('crumble', pos, { size: 4.2, y: FLOOR + 2.0, life: 1.1, grow: 0.1, hold: 0.5 });
    spawnLandingDust(pos, 16);
    spawnHitSpark(at(pos, 0.6, 0), { count: 10, color: 0x78716c, size: 1.6 });
}
/** Nộ Lửa: vệt đấm lửa phía trước Golem suốt đường lao (f.getFist() = điểm trước nắm đấm mỗi khung hình, nếu có) */
export function spawnFistDash(f) {
    const life = (f.time ?? 1200) / 1000;
    const dir = Math.sign(f.toX - f.fromX) || 1;
    const H = 2.4;
    const trail = sprite('fistTrail', H);
    const W = H * tex('fistTrail').aspect;
    trail.scale.x = dir;
    let t = 0;
    addAnim(trail, life, (p, fx, dt) => {
        const x = f.fromX + (f.toX - f.fromX) * p, z = f.fromZ + (f.toZ - f.fromZ) * p;
        const fist = f.getFist?.();
        if (fist) fx.mesh.position.set(fist.x - dir * W * 0.3, fist.y, (fist.z ?? z) + 0.5);
        else fx.mesh.position.set(x + dir * (1.4 - W * 0.3), 1.8, z + 0.9);
        fx.mesh.material.opacity = Math.min(1, p * 10) * (p > 0.85 ? (1 - p) / 0.15 : 1);
        t -= dt;
        if (t > 0) return;
        t = 0.1;
        spawnFireHit({ x: (fist?.x ?? x) - dir * 1.6, z }, { size: 1.0 });
    });
}
export function spawnBlizzardRoar(pos, dir = 1) {
    spawnShockwave(pos, { color: 0xe0f7ff, radius: 7, life: 0.7 });
}
/** Hào Quang Sét: sét từ trời giáng xuống Golem (pos = điểm trúng) */
export function spawnSkyStrike(pos) {
    const top = { x: pos.x + 0.6, y: 12, z: pos.z ?? 0 };
    const mid = { x: pos.x - 0.5, y: (pos.y ?? 2) + 4, z: pos.z ?? 0 };
    boltSeg(top, mid, { width: 2.4, life: 0.4 });
    boltSeg(mid, pos, { width: 2.4, life: 0.4 });
    pop('zapBurst', pos, { size: 3.2, y: 0, life: 0.38, grow: 0.4 });
    flash(pos, VIOLET, { size: 5, y: 0, life: 0.45, opacity: 0.7 });
    spawnShockwave({ x: pos.x, z: pos.z }, { color: VIOLET, radius: 4, life: 0.5 });
}

// ---------- Hiệu ứng bám người (view gắn vào) ----------
/** Ngục băng phủ người khi bị Đóng Băng */
export function makeIceBlock(height = 2.9) {
    const g = new THREE.Group();
    const m = sprite('icePrison', height * 1.1, { opacity: 0 });
    m.position.set(0, height * 0.52, 0.45);
    g.add(m);
    return {
        group: g,
        update(dt, k) { m.material.opacity = k; g.scale.set(1, 0.9 + 0.1 * k, 1); },
        dispose() { g.removeFromParent(); m.material.dispose(); m.geometry.dispose(); },
    };
}
/** Vòm Giáp Băng Sét quanh người (máu khiên còn nhiều -> vòm đậm) */
export function makeWardDome(height = 2.4) {
    const g = new THREE.Group();
    const dome = sprite('wardDome', height * 1.15, { opacity: 0, width: height * 1.3 });
    dome.position.set(0, height * 0.52, 0.5);
    g.add(dome);
    let t = 0;
    return {
        group: g,
        update(dt, k, frac = 1) {
            t += dt;
            dome.material.opacity = k * (0.45 + 0.4 * frac) * (0.9 + 0.1 * Math.sin(t * 9));
        },
        dispose() { g.removeFromParent(); dome.material.dispose(); dome.geometry.dispose(); },
    };
}
export { sparkTexture };
