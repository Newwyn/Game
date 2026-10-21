// ============================================================
// HIỆU ỨNG SERAPHINE (bản 3: nữ tu sĩ ánh mặt trời) — chạy khung (flipbook)
// ============================================================
// Hình lấy từ atlas seraphine_fx2.webp (tools/fx_grid_pack.py art/seraphine/fx2/fx2_spec.json — 5 tấm tranh AI của người dùng):
//   orbFly (cầu ánh sáng bay 4 lặp) · orbHit (nổ sáng 4)
//   sunlight (tia nắng hồi máu rọi xuống 4, đáy = mặt đất) · bubble (khiên ánh sáng: hiện ra 0 · giữ lặp 1-3, đáy = mặt đất)
//   guardIn (Hộ Vệ Thiên Sứ hiện ra 4) · guardHold (giữ lặp 4) — cùng gốc đáy giữa
//   angelFly (thiên thần nhỏ bay 4 lặp) · angelGive (trao ánh sáng 4)
//   holyCircle · reviveCircle (vòng vẽ nghiêng sẵn) · shieldWings · dmgUp · defUp · cleanse · healPlus · sunFlare (hình lẻ)
// Mọi hình vẽ nhìn sang PHẢI; nhìn trái thì lật gương. Mốc hồi máu / khiên / thời gian do server + events.js quyết định — ở đây chỉ vẽ.
import * as THREE from 'three';
import fxUrl from '../assets/sprites/seraphine_fx2.webp';
import FX from './seraphineFx2.json';
import { textureView } from './texView.js';
import { addAnim, fxPlane, glowTexture, easeOut, spawnHitSpark, fxBudget } from './vfx.js';
import { makeFlipbook, loopFrame, weighted, fadeInOut, FLOOR } from './flipbook.js';

const FB = makeFlipbook(fxUrl, FX);
FB.tex('holyCircle');   // tải atlas ngay khi vào game (khung đầu không bị trống)
export const seraFrames = FB.frames;
const setFx = FB.set;
const CHEST = 0.75;
const GOLD = 0xffd56b, WARM = 0xffe9b0;
const seqFrame = (p, w) => weighted(Math.min(0.999, Math.max(0, p)), w);
/** cao (đơn vị thế giới) để nhóm có bề NGANG `w` */
const hForW = (group, w) => w * FX.groups[group].size[1] / FX.groups[group].size[0];

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
/** Loé sáng cộng màu (quầng phụ) */
function flash(pos, { color = GOLD, size = 1.4, y = CHEST, life = 0.25, z = 0.6 } = {}) {
    const c = fxPlane(glowTexture(), size, size, { color });
    c.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + z);
    addAnim(c, life, (p, fx) => { fx.mesh.scale.setScalar(0.6 + easeOut(p) * 1.1); fx.mesh.material.opacity = 1 - p; });
}

// ------------------------------------------------------------
// ĐÁNH THƯỜNG: CẦU ÁNH SÁNG
// ------------------------------------------------------------
/** Cầu ánh sáng (4 khung lặp, vòng vàng xoay) bay từ `from` tới `to`; trúng thì gọi onHit */
export function spawnSunOrb(from, to, { duration = 0.25, size = 0.95, onHit } = {}) {
    const m = seraFrames('orbFly', size);
    const dx = to.x - from.x, dy = to.y - from.y;
    m.scale.x = dx < 0 ? -1 : 1;   // đuôi sáng luôn ở phía sau
    const z0 = (from.z ?? 0) + 0.5, z1 = (to.z ?? from.z ?? 0) + 0.5;
    const ph = Math.random() * 4;
    let hit = false;
    addAnim(m, duration, (p, fx) => {
        fx.mesh.position.set(from.x + dx * p, from.y + dy * p, z0 + (z1 - z0) * p);
        setFx(fx.mesh, loopFrame(p * duration, 18, 4, ph));
        fx.mesh.material.opacity = Math.min(1, p * 8 + 0.2);
        if (p >= 1 && !hit) { hit = true; onHit?.(); }
    });
}

/** Nổ sáng (4 khung: loé · tia + cánh hoa · tan) tại ngực mục tiêu */
export function spawnSunBurst(pos, { size = 1.3 } = {}) {
    const m = seraFrames('orbHit', size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + CHEST, (pos.z ?? 0) + 0.55);
    m.rotation.z = Math.random() * 0.6 - 0.3;
    addAnim(m, 0.42, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.6, 1, 1, 1]));
        fx.mesh.scale.setScalar(0.85 + 0.2 * easeOut(Math.min(1, p * 2)));
        fx.mesh.material.opacity = fadeInOut(p, 0.05, 0.8);
    });
}

// ------------------------------------------------------------
// HỒI MÁU: TIA NẮNG RỌI XUỐNG · BIỂU TƯỢNG
// ------------------------------------------------------------
/** Tia nắng rọi xuống người được hồi (4 khung, đáy chạm đất) + dấu cộng bật lên trên đầu */
export function spawnSunlight(pos, { big = false, height = 2.9 } = {}) {
    const H = (big ? 4.4 : 3.8);
    const m = seraFrames('sunlight', H, { opacity: 0 });
    m.position.set(pos.x, FLOOR + 0.02, (pos.z ?? 0) + 0.45);
    addAnim(m, 0.75, (p, fx) => {
        setFx(fx.mesh, seqFrame(p, [0.6, 1.1, 1.1, 1.2]));
        fx.mesh.material.opacity = fadeInOut(p, 0.06, 0.8);
    });
    spawnSeraIcon(pos, 'healPlus', { height, size: big ? 0.7 : 0.6, delay: 0.12 });
}

/** Biểu tượng nhỏ bật lên trên đầu rồi bay lên + mờ (healPlus · dmgUp · defUp · cleanse) */
export function spawnSeraIcon(pos, group, { height = 2.9, size = 0.7, delay = 0, life = 1.0, x = 0 } = {}) {
    const m = seraFrames(group, size, { opacity: 0 });
    const y0 = FLOOR + height + 0.45;
    m.position.set(pos.x + x, y0, (pos.z ?? 0) + 0.7);
    const T = life + delay;
    addAnim(m, T, (p, fx) => {
        const t = Math.max(0, (p * T - delay) / life);
        fx.mesh.position.y = y0 + easeOut(t) * 0.45;
        fx.mesh.scale.setScalar(t < 0.15 ? 0.5 + 3.3 * t : 1);
        fx.mesh.material.opacity = t <= 0 ? 0 : t < 0.1 ? t / 0.1 : t > 0.7 ? (1 - t) / 0.3 : 1;
    });
}

/** Loé mặt trời (sunFlare) — giơ gậy vào niệm, hồi sinh, dựng khiên */
export function spawnSunFlare(pos, { size = 1.6, y = 2.2, life = 0.5, z = 0.7 } = {}) {
    const m = seraFrames('sunFlare', size, { opacity: 0 });
    m.position.set(pos.x, (pos.y ?? 0) + y, (pos.z ?? 0) + z);
    addAnim(m, life, (p, fx) => {
        fx.mesh.scale.setScalar(0.5 + 0.8 * easeOut(Math.min(1, p * 2.5)));
        fx.mesh.rotation.z = p * 0.6;
        fx.mesh.material.opacity = fadeInOut(p, 0.06, 0.55);
    });
    flash(pos, { y, size: size * 1.2, life: life * 0.6 });
}

/** Vòng thánh (vẽ nghiêng sẵn) bùng quanh chân: nửa sau đặt sau người, vành trước đặt trước — sống `life` giây */
export function spawnHolyRing(pos, { group = 'holyCircle', width = 3.0, life = 0.9 } = {}) {
    const H = hForW(group, width);
    const back = seraFrames(group, H, { opacity: 0 });
    const front = frontArc(group, H, group === 'holyCircle' ? 0.45 : 0.3, { opacity: 0 });
    const g = new THREE.Group();
    back.position.set(0, 0, -0.35); front.position.set(0, 0, 0.35);
    g.add(back, front);
    g.position.set(pos.x, FLOOR + 0.01, pos.z ?? 0);
    addAnim(g, life, (p, fx) => {
        const s = 0.7 + 0.3 * easeOut(Math.min(1, p / 0.3));
        fx.mesh.scale.set(s, s, 1);
        back.material.opacity = front.material.opacity = fadeInOut(p, 0.1, 0.65);
    });
}

/** Hồi sinh (Thiên Thần Hộ Mệnh): vòng hồi sinh + tia nắng lớn + loé mặt trời */
export function spawnReviveFx(pos, { height = 2.9 } = {}) {
    spawnHolyRing(pos, { group: 'reviveCircle', width: 3.2, life: 1.1 });
    spawnSunlight(pos, { big: true, height });
    spawnSunFlare(pos, { y: CHEST + 0.4, size: 2.0, life: 0.6 });
}

// ------------------------------------------------------------
// THIÊN THẦN NHỎ (KN1 / KN2 lúc niệm · Thiên Thần Hộ Mệnh)
// ------------------------------------------------------------
/**
 * Thiên thần nhỏ bay (4 khung lặp) từ `from` tới `getTo()` (đọc vị trí mới nhất) trong `duration` giây, vòng lên một chút;
 * tới nơi: gọi onArrive + trao ánh sáng (4 khung: đưa cầu · loé · vẫy tay mờ dần · tan).
 */
export function spawnLittleAngel(from, getTo, { duration = 0.45, size = 1.1, onArrive } = {}) {
    const H = 1.05 * size;
    const m = seraFrames('angelFly', H);
    const z0 = (from.z ?? 0) + 0.6;
    const ph = Math.random() * 4;
    let arrived = false;
    addAnim(m, duration, (p, fx) => {
        const to = getTo();
        const e = p * p * (3 - 2 * p);
        const x = from.x + (to.x - from.x) * e, y = from.y + (to.y - from.y) * e + Math.sin(p * Math.PI) * 0.8;
        fx.mesh.position.set(x, y, z0 + ((to.z ?? 0) + 0.6 - z0) * e);
        fx.mesh.scale.x = to.x < from.x ? -1 : 1;
        setFx(fx.mesh, loopFrame(p * duration, 14, 4, ph));
        fx.mesh.material.opacity = Math.min(1, p * 6 + 0.2);
        if (p >= 1 && !arrived) {
            arrived = true;
            onArrive?.();
            const dir = to.x < from.x ? -1 : 1;
            const g = seraFrames('angelGive', H * 1.15, { opacity: 1 });
            g.position.set(to.x - dir * 0.15, to.y, (to.z ?? 0) + 0.65);
            g.scale.x = dir;
            addAnim(g, 0.55, (q, f2) => {
                setFx(f2.mesh, seqFrame(q, [0.7, 1, 1.2, 1.1]));
                f2.mesh.position.y = to.y + q * 0.25;
                f2.mesh.material.opacity = q > 0.8 ? (1 - q) / 0.2 : 1;
            });
        }
    });
}

// ------------------------------------------------------------
// KHIÊN ÁNH SÁNG (trạng thái holy_shield trên MỌI đồng đội được che)
// ------------------------------------------------------------
/**
 * Bong bóng khiên ánh sáng (hiện ra 1 khung → giữ lặp 3 khung) bao quanh người + đôi cánh sau lưng khi khiên lúc niệm.
 * { group (gắn vào view.root), update(dt, { k (0..1 độ hiện), w (0..1 cánh), frac (máu khiên còn lại), lift, time, height }) }
 */
export function makeLightShield(height = 2.9) {
    const g = new THREE.Group();
    // bong bóng: lớp SAU người (đủ màu, viền + quầng sáng quanh dáng) + lớp TRƯỚC cộng sáng nhẹ (ánh bóng phủ lên người)
    //   -> người bên trong vẫn rõ (lớp sương sáng trong lòng bong bóng không phủ đục lên nhân vật)
    const bubble = seraFrames('bubble', height * 1.32, { opacity: 0 });
    bubble.position.z = -0.3;
    const sheen = seraFrames('bubble', height * 1.32, { opacity: 0, additive: true });
    sheen.position.z = 0.45;
    const wings = seraFrames('shieldWings', height * 0.62, { opacity: 0 });
    wings.position.z = -0.4;
    const glow = fxPlane(glowTexture(), height * 0.9, height * 1.15, { color: WARM, opacity: 0 });
    glow.position.z = -0.25;
    g.add(wings, glow, bubble, sheen);
    g.visible = false;
    let shown = 0, t = 0;
    return {
        group: g,
        update(dt, { k = 0, w = 0, frac = 1, lift = 0, time = 0 } = {}) {
            g.visible = k > 0.02;
            if (!g.visible) { shown = 0; return; }
            t = time;
            shown += dt;
            const f = shown < 0.14 ? 0 : 1 + loopFrame(time, 6, 3);
            setFx(bubble, f); setFx(sheen, f);
            g.position.set(0, FLOOR + lift, 0);
            const op = k * (0.55 + 0.4 * Math.max(0.25, frac)) * (0.92 + 0.08 * Math.sin(time * 4));
            bubble.material.opacity = op;
            sheen.material.opacity = op * 0.22;
            glow.material.opacity = 0.18 * k;
            glow.position.y = height * 0.5;
            const flap = Math.sin(time * 5) * 0.04;
            wings.position.y = height * 0.62;
            const sc = (0.6 + 0.4 * w) * (1 + flap);
            wings.scale.set(sc, sc, 1);
            wings.material.opacity = k * w * 0.95;
        },
    };
}

// ------------------------------------------------------------
// HỘ VỆ THIÊN SỨ (KN3 Thánh Niệm, 10s)
// ------------------------------------------------------------
/**
 * Hộ Vệ Thiên Sứ sau lưng Seraphine (hiện ra 4 khung → giữ lặp 4 khung) + vòng thánh dưới chân lúc niệm.
 * { group (gắn vào view.flip: x âm = sau lưng), ground (gắn vào view.root), update(dt, { on, lift, time }) }
 */
export function makeSeraphGuardian(height = 2.9) {
    const H = height * 1.55;
    const U = H / FX.groups.guardHold.size[1];
    const inM = seraFrames('guardIn', FX.groups.guardIn.size[1] * U, { opacity: 0 });
    const hold = seraFrames('guardHold', H, { opacity: 0 });
    const glow = fxPlane(glowTexture(), height * 1.4, height * 1.8, { color: GOLD, opacity: 0 });
    glow.position.set(0, H * 0.5, -0.05);
    const body = new THREE.Group();
    body.add(glow, inM, hold);
    const g = new THREE.Group();
    g.add(body);
    g.visible = false;
    // vòng thánh nằm nghiêng quanh chân (nửa sau + vành trước)
    const RW = 2.8, RH = hForW('holyCircle', RW);
    const back = seraFrames('holyCircle', RH, { opacity: 0 });
    const front = frontArc('holyCircle', RH, 0.45, { opacity: 0 });
    back.position.set(0, FLOOR + 0.01, -0.35); front.position.set(0, FLOOR + 0.01, 0.35);
    const ground = new THREE.Group();
    ground.add(back, front);
    ground.visible = false;

    let phase = 'off', t = 0, k = 0;
    const go = (ph) => { phase = ph; t = 0; };
    const api = {
        group: g,
        ground,
        get state() { return { phase, k }; },
        update(dt, { on = false, lift = 0, time = 0 } = {}) {
            t += dt;
            if (on && (phase === 'off' || phase === 'fade')) go('in');
            if (!on && (phase === 'in' || phase === 'hold')) go('fade');
            k += ((phase === 'off' || phase === 'fade' ? 0 : 1) - k) * Math.min(1, dt * (phase === 'fade' ? 3 : 8));
            if (phase === 'fade' && k < 0.02) go('off');
            g.visible = ground.visible = phase !== 'off';
            if (!g.visible) return api;
            let useIn = false;
            if (phase === 'in') {
                const p = t / 0.6;
                setFx(inM, seqFrame(p, [0.9, 1, 1, 0.8]));
                useIn = p < 1;
                if (p >= 1) go('hold');
            }
            if (!useIn) setFx(hold, loopFrame(time, 4, 4));
            const op = k * (0.85 + 0.15 * Math.sin(time * 2.6));
            inM.material.opacity = useIn ? op : 0;
            hold.material.opacity = useIn ? 0 : op;
            glow.material.opacity = 0.2 * k;
            body.position.set(-1.25, FLOOR + lift * 0.6 + Math.sin(time * 1.6) * 0.08, -0.55);
            body.scale.setScalar(0.88 + 0.12 * k);
            const pulse = 1 + 0.04 * Math.sin(time * 3);
            ground.scale.set(pulse, pulse, 1);
            back.material.opacity = front.material.opacity = 0.9 * k;
            return api;
        },
        dispose() { g.parent?.remove(g); ground.parent?.remove(ground); },
    };
    return api;
}

/** Thánh Niệm bắt đầu (giơ gậy, mốc 0,45s): loé mặt trời trên đầu gậy + vòng thánh bùng + tia sáng lấp lánh */
export function spawnPrayStart(staff, pos) {
    spawnSunFlare(staff, { y: 0, size: 2.2, life: 0.6, z: 0.3 });
    spawnHolyRing(pos, { width: 3.4, life: 0.8 });
    spawnHitSpark({ x: pos.x, y: 0, z: pos.z ?? 0 }, { count: fxBudget(10, 3), color: WARM, size: 1.2 });
}
