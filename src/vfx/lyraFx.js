// ============================================================
// HIỆU ỨNG LYRA (bản 3: nữ xạ thủ tiên tộc của gió) — chạy khung (flipbook)
// ============================================================
// Hình lấy từ atlas lyra_fx2.webp (tools/fx_grid_pack.py art/lyra/fx2/fx2_spec.json — 5 tấm tranh AI nền đen của người dùng):
//   arrowFly (mũi tên gió bay 4 lặp) · arrowHit (trúng tên 4: loé · gió xoáy · tan)
//   galeFly (tên gió chớp 4 lặp) · galeBlast (nổ gió đẩy lùi 4, mạnh về bên phải)
//   spiritIn (Vệ Thần Gió hiện ra 4) · spiritHold (bay chờ 0-1 · kéo cung 2-3) — cùng gốc trong ô
//   skyArrow (mũi tên ánh sáng: thành hình 0-1 · bay 2-3 lặp) · skyBlast (nổ lớn 4, đáy = mặt đất)
//   windCircle · gustPuff · windLance · windStreak · reticle · resetIcon · accUp · featherBurst (hình lẻ)
// Mốc sát thương / thời gian do server + events.js quyết định — ở đây chỉ vẽ.
import * as THREE from 'three';
import fxUrl from '../assets/sprites/lyra_fx2.webp';
import FX from './lyraFx2.json';
import { addAnim, fxPlane, glowTexture, easeOut, spawnHitSpark, fxBudget } from './vfx.js';
import { makeFlipbook, loopFrame, weighted } from './flipbook.js';

const FB = makeFlipbook(fxUrl, FX);
FB.tex('windCircle');   // tải atlas ngay khi vào game (khung đầu không bị trống)
export const lyraFrames = FB.frames;
const setFx = FB.set;
const GROUND = -0.5, CHEST = 0.75;
const JADE = 0x5eead4, MINT = 0xb6fff0;
const seqFrame = (p, w) => weighted(Math.min(0.999, Math.max(0, p)), w);
const fade = (p, a = 0.06, b = 0.82) => (p < a ? p / a : p > b ? (1 - p) / (1 - b) : 1);
/** cao (đơn vị thế giới) để nhóm có bề NGANG `w` */
const hForW = (group, w) => w * FX.groups[group].size[1] / FX.groups[group].size[0];

// ------------------------------------------------------------
// MŨI TÊN GIÓ (đánh thường · mũi tên phụ của Vệ Thần)
// ------------------------------------------------------------
/** Mũi tên gió bay (4 khung lặp) từ `from` tới `to`, thân xoay theo hướng bay; trúng thì gọi onHit */
export function spawnLyraArrow(from, to, { duration = 0.2, size = 0.8, onHit } = {}) {
    const w = 1.6 * size;
    const m = lyraFrames('arrowFly', hForW('arrowFly', w));
    const dx = to.x - from.x, dy = to.y - from.y;
    m.rotation.z = Math.atan2(dy, dx);
    const z0 = (from.z ?? 0) + 0.5, z1 = (to.z ?? from.z ?? 0) + 0.5;
    const ph = Math.random() * 4;
    let hit = false;
    addAnim(m, duration, (p, fx) => {
        // mũi tên (đầu mũi ở bên phải hình) chạm đích đúng lúc p = 1
        fx.mesh.position.set(from.x + dx * p - Math.cos(m.rotation.z) * w * 0.4, from.y + dy * p - Math.sin(m.rotation.z) * w * 0.4, z0 + (z1 - z0) * p);
        setFx(fx.mesh, loopFrame(p * duration, 24, 4, ph));
        fx.mesh.material.opacity = Math.min(1, p * 6 + 0.3);
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}

/** Trúng tên gió: loé ngọc -> gió xoáy + lông vũ -> tan (4 khung) */
export function spawnLyraArrowHit(pos, { size = 1 } = {}) {
    const m = lyraFrames('arrowHit', 1.45 * size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + CHEST, (pos.z ?? 0) + 0.55);
    m.rotation.z = Math.random() * 0.6 - 0.3;
    addAnim(m, 0.42, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.6, 1, 1, 1]));
        fx.mesh.scale.setScalar(0.85 + 0.25 * easeOut(Math.min(1, p * 2)));
        fx.mesh.material.opacity = fade(p, 0.05, 0.8);
    });
}

// ------------------------------------------------------------
// TIỄN GIÓ CHỚP (KN1)
// ------------------------------------------------------------
/** Tên gió chớp (4 khung lặp, vòng khí xé gió ở mũi) lao cực nhanh từ `from` tới `to` */
export function spawnGaleShot(from, to, { duration = 0.12, size = 1.9, onHit } = {}) {
    const m = lyraFrames('galeFly', size);
    const dx = to.x - from.x, dy = to.y - from.y;
    const ang = Math.atan2(dy, dx);
    m.rotation.z = ang;
    const w = size * FX.groups.galeFly.size[0] / FX.groups.galeFly.size[1];
    const z0 = (from.z ?? 0) + 0.55, z1 = (to.z ?? from.z ?? 0) + 0.55;
    let hit = false;
    addAnim(m, duration, (p, fx) => {
        fx.mesh.position.set(from.x + dx * p - Math.cos(ang) * w * 0.35, from.y + dy * p - Math.sin(ang) * w * 0.35, z0 + (z1 - z0) * p);
        setFx(fx.mesh, loopFrame(p * duration, 30, 4));
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
    // loé ở dây cung lúc nhả
    const f = fxPlane(glowTexture(), 1.2, 1.2, { color: MINT, opacity: 0.9 });
    f.position.set(from.x, from.y, z0);
    addAnim(f, 0.18, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 0.9); fx.mesh.material.opacity = 0.9 * (1 - p); });
}

/** Nổ gió đẩy lùi (4 khung, mạnh về phía `dir`: 1 phải / -1 trái) */
export function spawnGaleBlast(pos, { dir = 1, size = 2.6 } = {}) {
    const m = lyraFrames('galeBlast', size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + CHEST, (pos.z ?? 0) + 0.6);
    m.scale.x = dir;
    addAnim(m, 0.5, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.55, 1, 1.1, 1.1]));
        const s = 0.9 + 0.15 * easeOut(Math.min(1, p * 2));
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.material.opacity = fade(p, 0.04, 0.8);
    });
    spawnHitSpark(pos, { count: fxBudget(6, 2), color: MINT, size: 1.1 });
}

/** Dấu ngắm loé trên mục tiêu (Tiễn Gió Chớp khoá mục tiêu) — chụm lại rồi tan */
export function spawnReticle(pos, { size = 1.0, life = 0.55 } = {}) {
    const m = lyraFrames('reticle', size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + CHEST + 0.1, (pos.z ?? 0) + 0.65);
    addAnim(m, life, (p, fx) => {
        const s = p < 0.25 ? 1.6 - 0.6 * easeOut(p / 0.25) : 1;
        fx.mesh.scale.setScalar(s);
        fx.mesh.rotation.z = (1 - Math.min(1, p / 0.25)) * 0.8;
        fx.mesh.material.opacity = p < 0.12 ? p / 0.12 : p > 0.7 ? (1 - p) / 0.3 : 1;
    });
}

/** Gió bật trên đất (lúc nhảy / đáp / bay lên): gió ngọc + lá bung sang 2 bên */
export function spawnGust(pos, { width = 2.4, life = 0.45 } = {}) {
    const m = lyraFrames('gustPuff', hForW('gustPuff', width), { opacity: 0 });
    m.position.set(pos.x, GROUND + 0.02, (pos.z ?? 0) + 0.5);
    addAnim(m, life, (p, fx) => {
        const s = 0.6 + 0.5 * easeOut(p);
        fx.mesh.scale.set(s, 0.7 + 0.4 * easeOut(p), 1);
        fx.mesh.material.opacity = fade(p, 0.08, 0.5);
    });
}

/** Biểu tượng hồi chiêu (Tiễn Gió Chớp hạ gục) bay lên trên đầu */
export function spawnLyraReset(pos, { height = 2.9 } = {}) {
    const m = lyraFrames('resetIcon', 0.8, { opacity: 0 });
    m.position.set(pos.x, GROUND + height + 0.4, (pos.z ?? 0) + 0.6);
    addAnim(m, 1.0, (p, fx) => {
        fx.mesh.position.y = GROUND + height + 0.4 + easeOut(p) * 0.5;
        fx.mesh.scale.setScalar(p < 0.15 ? 0.6 + 2.6 * p : 1);
        fx.mesh.rotation.z = -p * 1.5;
        fx.mesh.material.opacity = p < 0.1 ? p / 0.1 : p > 0.7 ? (1 - p) / 0.3 : 1;
    });
}

// ------------------------------------------------------------
// PHONG TIỄN (thiên phú): MŨI GIÓ XUYÊN
// ------------------------------------------------------------
/** Ngọn giáo gió quét ngang `length` đơn vị theo hướng `dir` trong 0,32s */
export function spawnWindLance(from, dir, length = 14, { scale = 1 } = {}) {
    const w = 3.4 * scale;
    const m = lyraFrames('windLance', hForW('windLance', w), { opacity: 0 });
    m.scale.x = dir;
    const z = (from.z ?? 0) + 0.55;
    addAnim(m, 0.32, (p, fx) => {
        fx.mesh.position.set(from.x + dir * (length * p - w * 0.3), from.y, z);
        fx.mesh.scale.set(dir * (0.8 + 0.3 * Math.min(1, p * 4)), 1 + 0.08 * Math.sin(p * 40), 1);
        fx.mesh.material.opacity = p < 0.08 ? p / 0.08 : p > 0.82 ? (1 - p) / 0.18 : 1;
    });
}

/** Lông vũ trắng + ngọc bung ra (Vệ Thần bắn trúng, gọi gió) */
export function spawnFeatherBurst(pos, { size = 0.7, y = CHEST } = {}) {
    const m = lyraFrames('featherBurst', size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + 0.6);
    addAnim(m, 0.45, (p, fx) => {
        fx.mesh.scale.setScalar(0.6 + 0.7 * easeOut(p));
        fx.mesh.material.opacity = fade(p, 0.06, 0.55);
    });
}

// ------------------------------------------------------------
// GỒNG / GỌI GIÓ: vòng gió dưới chân + vệt gió hút vào người
// ------------------------------------------------------------
/** Vòng gió xoáy nằm trên đất (`radius`), sống `life` giây */
export function spawnWindCircle(pos, { radius = 1.5, life = 0.8, grow = true } = {}) {
    const d = FB.decal('windCircle', pos.x, pos.z ?? 0, 1, { lift: 0.05, opacity: 0 });
    const aspect = FX.groups.windCircle.size[0] / FX.groups.windCircle.size[1];
    addAnim(d, life, (p, fx) => {
        const r = radius * (grow ? 0.55 + 0.45 * easeOut(Math.min(1, p / 0.35)) : 1);
        const pulse = 1 + 0.04 * Math.sin(p * life * 9);
        fx.mesh.scale.set(2 * r * pulse / aspect, 1.5 * r * pulse, 1);
        fx.mesh.material.opacity = 0.9 * fade(p, 0.12, 0.75);
    });
}

/** Gồng Thần Tiễn / gọi Vệ Thần: vệt gió (tranh) hút vào quanh người + quầng ngọc lớn dần + vòng gió dưới chân */
export function spawnLyraCharge(pos, seconds = 2, { y = 1.1 } = {}) {
    const c = { x: pos.x, y, z: (pos.z ?? 0) + 0.6 };
    const glow = fxPlane(glowTexture(), 1, 1, { color: JADE });
    glow.position.set(c.x, c.y, c.z);
    addAnim(glow, seconds, (p, fx) => { const s = 0.6 + p * 2.2 + 0.15 * Math.sin(p * 40); fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.3 + 0.45 * p; });
    spawnWindCircle(pos, { radius: 1.7, life: seconds + 0.15 });
    const n = fxBudget(Math.round(7 * seconds) + 3, 3);
    const hS = hForW('windStreak', 1.1);
    for (let i = 0; i < n; i++) {
        const delay = Math.random() * Math.max(0.05, seconds - 0.4);
        const a = Math.random() * Math.PI * 2, r = 2.0 + Math.random() * 1.1;
        const st = lyraFrames('windStreak', hS, { opacity: 0 });
        addAnim(st, delay + 0.4, (p, fx) => {
            const t = Math.max(0, (p * (delay + 0.4) - delay) / 0.4);
            const rr = r * (1 - easeOut(t));
            const aa = a + t * 1.2;   // xoáy vào
            fx.mesh.position.set(c.x + Math.cos(aa) * rr, c.y + Math.sin(aa) * rr * 0.8, c.z);
            fx.mesh.rotation.z = aa + Math.PI * 0.5;
            fx.mesh.material.opacity = t <= 0 ? 0 : (1 - t * 0.7);
        });
    }
}

/** Biểu tượng +chính xác (mắt chim ưng) bật lên trên đầu đồng đội (Thần Phong: cả đội +20% chính xác) */
export function spawnAccUp(pos, { height = 2.9, delay = 0 } = {}) {
    const m = lyraFrames('accUp', 0.75, { opacity: 0 });
    m.position.set(pos.x, GROUND + height + 0.35, (pos.z ?? 0) + 0.6);
    addAnim(m, 1.2 + delay, (p, fx) => {
        const t = Math.max(0, (p * (1.2 + delay) - delay) / 1.2);
        fx.mesh.position.y = GROUND + height + 0.35 + easeOut(t) * 0.45;
        fx.mesh.scale.setScalar(t < 0.15 ? 0.5 + 3.3 * t : 1);
        fx.mesh.material.opacity = t <= 0 ? 0 : t < 0.1 ? t / 0.1 : t > 0.7 ? (1 - t) / 0.3 : 1;
    });
}

// ------------------------------------------------------------
// THẦN TIỄN PHÁ THIÊN (KN3): MŨI TÊN ÁNH SÁNG + NỔ LỚN
// ------------------------------------------------------------
/**
 * Mũi tên ánh sáng TÊN LỬA (thay spawnMissileArrow của vfx.js, cùng đường bay):
 *   1) thành hình ở `slot` sau lưng (khung 0 -> 1), mũi chĩa ra ngoài theo góc `ang`, lơ lửng `hold` giây (khung 2-3 nhấp nháy)
 *   2) phóng đi: vọt ra rồi bẻ lái đuổi theo mục tiêu (đường cong bậc 3, `getTo()` đọc vị trí mới nhất), vệt gió phụt sau đuôi
 */
export function spawnSkyArrow(slot, ang, getTo, { hold = 0.3, flight = 0.3, size = 1.35, color = JADE, z = 0, onHit } = {}) {
    const H = 1.45 * size;
    const m = lyraFrames('skyArrow', H, { opacity: 0 });
    const zz = z + 0.5;
    const out = { x: Math.cos(ang), y: Math.sin(ang) };
    let from = null, p1, p2, to, hit = false, puffT = 0;
    const bez = (t) => {
        const u = 1 - t;
        return {
            x: u * u * u * from.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * to.x,
            y: u * u * u * from.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * to.y,
        };
    };
    const total = hold + flight;
    const ph = Math.random() * 2;
    addAnim(m, total, (p, fx, dt = 0) => {
        const time = p * total;
        if (time < hold) {
            const f = time < 0.08 ? 0 : time < 0.16 ? 1 : 2 + loopFrame(time, 16, 2, ph);
            setFx(fx.mesh, f);
            const k = Math.min(1, time / 0.1);
            fx.mesh.scale.setScalar(0.6 + 0.4 * k);
            fx.mesh.material.opacity = k;
            const bob = Math.sin(time * 30) * 0.03;
            fx.mesh.position.set(slot.x + out.x * bob, slot.y + out.y * bob, zz);
            fx.mesh.rotation.z = ang;
            return;
        }
        if (!from) {
            from = { x: slot.x, y: slot.y };
            to = getTo();
            p1 = { x: from.x + out.x * 3.2, y: from.y + out.y * 3.2 };
            p2 = { x: to.x - Math.sign(to.x - from.x || 1) * 2.5, y: to.y + 3.5 };
            fx.mesh.scale.setScalar(1); fx.mesh.material.opacity = 1;
        }
        const live = getTo();
        to.x += (live.x - to.x) * 0.25; to.y += (live.y - to.y) * 0.25;
        const t = (time - hold) / flight;
        const e = t * t * (3 - 2 * t) * 0.35 + t * 0.65;
        const a = bez(e), b = bez(Math.min(1, e + 0.02)), c = bez(Math.max(0, e - 0.02));
        const dir = e >= 0.98 ? Math.atan2(a.y - c.y, a.x - c.x) : Math.atan2(b.y - a.y, b.x - a.x);
        // tâm hình ~ giữa thân tên: lùi nửa thân để đầu mũi chạm đích
        fx.mesh.position.set(a.x - Math.cos(dir) * H * 0.35, a.y - Math.sin(dir) * H * 0.35, zz);
        fx.mesh.rotation.z = dir;
        setFx(fx.mesh, 2 + loopFrame(time, 20, 2, ph));
        puffT += dt;
        if (puffT > 0.035) {
            puffT = 0;
            const puff = fxPlane(glowTexture(), 0.45 * size, 0.45 * size, { color });
            puff.position.set(a.x - Math.cos(dir) * 0.9 * size, a.y - Math.sin(dir) * 0.9 * size, zz - 0.01);
            addAnim(puff, 0.3, (q, f2) => { const sc = 1 + q * 1.4; f2.mesh.scale.set(sc, sc, 1); f2.mesh.material.opacity = 0.5 * (1 - q); });
        }
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}

/** Mũi Thần Tiễn cuối cắm xuống: cột sáng + nổ gió hình vòm + vòng gió loang trên đất */
export function spawnSkyBlast(pos, { size = 3.4 } = {}) {
    const m = lyraFrames('skyBlast', size, { opacity: 0 });
    m.position.set(pos.x, GROUND + 0.02, (pos.z ?? 0) + 0.6);
    addAnim(m, 0.7, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.5, 1, 1.1, 1.2]));
        fx.mesh.material.opacity = fade(p, 0.03, 0.8);
    });
    const flash = fxPlane(glowTexture(), 1, 1, { color: 0x99fff0 });
    flash.position.set(pos.x, (pos.y ?? 0) + CHEST, (pos.z ?? 0) + 0.55);
    addAnim(flash, 0.35, (p, fx) => { const s = 1 + easeOut(p) * 4; fx.mesh.scale.set(s, s, 1); fx.mesh.material.opacity = 0.85 * (1 - p); });
    spawnWindCircle(pos, { radius: 2.2, life: 0.6 });
}

// ------------------------------------------------------------
// VỆ THẦN GIÓ (KN2 Thần Phong Giáng Thế, 8s)
// ------------------------------------------------------------
/**
 * Vệ Thần Gió sau lưng Lyra (cao hơn Lyra) + vòng gió xoáy dưới chân lúc Lyra bay.
 * { group (gắn vào view.flip: x âm = sau lưng), ground (gắn vào view.root), update(dt, { on, charging, lift, time }),
 *   shoot() (kéo cung bắn phụ ~0,35s), shotPoint() -> toạ độ thế giới chỗ tên của Vệ Thần bay ra, visible }
 */
export function makeWindSpirit(height = 2.9) {
    const U = (height * 1.25) / FX.groups.spiritHold.size[1];      // đơn vị thế giới / điểm ảnh atlas (thân ~3,6)
    const inM = lyraFrames('spiritIn', FX.groups.spiritIn.size[1] * U, { opacity: 0 });
    const hold = lyraFrames('spiritHold', FX.groups.spiritHold.size[1] * U, { opacity: 0 });
    const glow = fxPlane(glowTexture(), height * 1.3, height * 1.6, { color: JADE, opacity: 0 });
    glow.position.z = -0.05;
    const body = new THREE.Group();
    body.add(glow, inM, hold);
    const g = new THREE.Group();
    g.add(body);
    g.visible = false;
    // vòng gió dưới chân (Lyra đang bay)
    const aspect = FX.groups.windCircle.size[0] / FX.groups.windCircle.size[1];
    const ring = lyraFrames('windCircle', 1, { opacity: 0 });
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = GROUND + 0.05;
    const R = 1.35;
    ring.scale.set(2 * R / aspect, 1.5 * R, 1);
    const ground = new THREE.Group();
    ground.add(ring);
    ground.visible = false;
    // chỗ tên bay ra (tay cầm cung khi kéo căng) so với gốc hình (điểm ảnh tranh gốc × 0,6 atlas)
    const SHOT = new THREE.Vector3(140 * 0.6 * U, 70 * 0.6 * U, 0.05);

    let phase = 'off', t = 0, k = 0, shootT = 0, draw = 0;
    const go = (ph) => { phase = ph; t = 0; };
    const api = {
        group: g,
        ground,
        get visible() { return g.visible; },
        get state() { return { phase, k, frame: hold.userData.fx.frame, draw }; },
        shoot() { shootT = 0.38; },
        shotPoint() {
            if (!g.visible) return null;
            const v = SHOT.clone(); body.localToWorld(v); return v;
        },
        update(dt, { on = false, charging = false, lift = 0, time = 0 } = {}) {
            t += dt; shootT = Math.max(0, shootT - dt);
            if (on && (phase === 'off' || phase === 'fade')) go('in');
            if (!on && (phase === 'in' || phase === 'hold')) go('fade');
            k += ((phase === 'off' || phase === 'fade' ? 0 : 1) - k) * Math.min(1, dt * (phase === 'fade' ? 4 : 8));
            if (phase === 'fade' && k < 0.02) go('off');
            g.visible = ground.visible = phase !== 'off';
            if (!g.visible) return api;
            const drawn = charging || shootT > 0;
            draw += ((drawn ? 1 : 0) - draw) * Math.min(1, dt * 12);
            let useIn = false;
            if (phase === 'in') {
                const p = t / 0.5;
                setFx(inM, seqFrame(p, [0.9, 1, 1, 0.8]));
                useIn = p < 1;
                if (p >= 1) go('hold');
            }
            if (!useIn) setFx(hold, drawn ? 2 + loopFrame(time, 6, 2) : loopFrame(time, 3, 2));
            const op = k * (0.92 + 0.08 * Math.sin(time * 3));
            inM.material.opacity = useIn ? op : 0;
            hold.material.opacity = useIn ? 0 : op;
            glow.material.opacity = 0.22 * k * (0.8 + 0.2 * Math.sin(time * 2.5)) + 0.15 * draw * k;
            body.position.set(-1.55, GROUND + height * 0.78 + lift + Math.sin(time * 2.2) * 0.08, -0.6);   // sau lưng, cao hơn Lyra
            body.scale.setScalar(0.85 + 0.15 * k);
            ring.material.opacity = 0.85 * k * Math.min(1, lift / 0.4 + 0.25);
            const pulse = 1 + 0.05 * Math.sin(time * 4);
            ring.scale.set(2 * R * pulse / aspect, 1.5 * R * pulse, 1);
            return api;
        },
        dispose() { g.parent?.remove(g); ground.parent?.remove(ground); },
    };
    return api;
}
