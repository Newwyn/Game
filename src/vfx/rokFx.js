// ============================================================
// HIỆU ỨNG ROK (bản 3: hiệp sĩ châu Âu) — chạy khung (flipbook)
// ============================================================
// Hình lấy từ atlas rok_fx2.webp (tools/fx_grid_pack.py art/rok/fx2/fx2_spec.json — 4 tấm tranh AI nền đen của người dùng):
//   aegisA (Khiên Thần: hiện ra 0-3 · giữ lặp 4-7) · aegisB (nổ sóng 0-3 · vỡ tan 4-7) — cùng gốc = sư tử vàng giữa khiên
//   lion (linh hồn sư tử 4: hiện · lao · GẦM · tan) · roarWave (sóng gầm 4)
//   holyCircle · goldRing · quakeRing (hình trên đất) · tauntIcon · buffIcon · bashBurst · chain · healCross
// Mốc sát thương / thời gian do server + events.js quyết định — ở đây chỉ vẽ.
import * as THREE from 'three';
import fxUrl from '../assets/sprites/rok_fx2.webp';
import FX from './rokFx2.json';
import { addAnim, fxPlane, glowTexture, easeOut, spawnHitSpark } from './vfx.js';
import { makeFlipbook, loopFrame, weighted, fadeInOut } from './flipbook.js';
import { gameTimeout } from '../config.js';

const FB = makeFlipbook(fxUrl, FX);
FB.tex('holyCircle');   // tải atlas ngay khi vào game (không đợi lần đầu dùng chiêu -> khung đầu không bị trống)
export const rokFrames = FB.frames;
const setFx = FB.set;
const GROUND = -0.5;
/** Cỡ chung: đơn vị thế giới trên 1 điểm ảnh atlas (thân Khiên Thần ~1,9 đơn vị — 2/3 Rok, linh hồn sư tử ~2 đơn vị) */
const U_AEGIS = 0.012, U_LION = 0.0101;
/** Cỡ Khiên Thần so với bản đầu (người dùng: to gấp 3 rồi "nhỏ lại chút"): thân khiên ~4,8 đơn vị (~1,7 lần Rok), cả cánh + hào quang ~10,7 */
const GUARD_SCALE = 2.5;
/** Khiên Thần: từ gốc (sư tử giữa khiên) xuống đáy khung, để mũi khiên chạm đất */
const AEGIS_BELOW = (FX.groups.aegisA.size[1] - FX.groups.aegisA.pivot[1]) * U_AEGIS * GUARD_SCALE;
const hOf = (group, u) => FX.groups[group].size[1] * u;

/** Chạy chuỗi khung theo trọng số thời lượng: trả về chỉ số khung (0..n-1) tại tiến độ p */
const seqFrame = (p, weights) => weighted(Math.min(0.999, p), weights);

// ------------------------------------------------------------
// KHIÊN THẦN (Dựng Khiên)
// ------------------------------------------------------------
/**
 * Khiên Thần KHỔNG LỒ (GUARD_SCALE) đứng trước Rok (về phía quái), lùi sâu ra sau theo chiều sâu để Rok + quái vẫn rõ.
 * Trả về { group, raise(), pulse(), shatter(), hit(), update(dt, { on, frac, dir }), dispose() } — group gắn vào view.root.
 *   raise  : hiện ra (4 khung) rồi giữ lặp (4 khung) — gọi đúng lúc Rok cắm khiên (mốc 0,14s)
 *   pulse  : mỗi lần khiên nổ (mất 1/6 máu khiên): nổ sóng 4 khung rồi về giữ
 *   shatter: lần nổ cuối: vỡ tan 4 khung rồi tắt
 *   frac   : máu khiên còn lại 0..1 -> khiên mờ dần
 */
export function makeDivineShield() {
    const g = new THREE.Group();
    const glow = fxPlane(glowTexture(), 4.2 * GUARD_SCALE, 4.2 * GUARD_SCALE, { color: 0xffcf5a, opacity: 0 });
    const A = rokFrames('aegisA', hOf('aegisA', U_AEGIS) * GUARD_SCALE, { opacity: 0 });
    const B = rokFrames('aegisB', hOf('aegisB', U_AEGIS) * GUARD_SCALE, { opacity: 0 });
    B.position.z = 0.002;
    const body = new THREE.Group();
    body.add(glow, A, B);
    // vòng thánh dưới chân (Rok + khiên đứng trong vòng)
    const circle = rokFrames('holyCircle', 1, { opacity: 0 });
    circle.rotation.x = -Math.PI / 2;
    const cw = FX.groups.holyCircle.size[0] / FX.groups.holyCircle.size[1];
    g.add(body, circle);
    g.visible = false;

    let phase = 'off', t = 0, time = 0, k = 0, grace = 0, auto = -1, prevOn = false, cool = 0, flash = 0;
    const go = (ph) => { phase = ph; t = 0; };
    const api = {
        group: g,
        raise() { if (phase === 'shatter') return; go('in'); grace = 0.8; auto = -1; },
        pulse() { if (phase === 'off' || phase === 'shatter') return; go('pulse'); flash = 1; },
        shatter() { go('shatter'); cool = 1.5; auto = -1; },
        hit() { flash = Math.max(flash, 0.6); },
        get state() { return { phase, t, k, a: A.visible && A.material.opacity, b: B.visible && B.material.opacity, fa: A.userData.fx.frame, fb: B.userData.fx.frame }; },
        update(dt, { on = false, frac = 1, dir = 1 } = {}) {
            time += dt; t += dt;
            grace = Math.max(0, grace - dt); cool = Math.max(0, cool - dt); flash = Math.max(0, flash - dt * 2.5);
            // khiên có trên server mà chưa thấy mốc cắm khiên (VD vào trận giữa chừng) -> tự hiện sau 0,3s
            if (on && !prevOn && phase === 'off' && cool <= 0) auto = 0.3;
            prevOn = on;
            if (auto >= 0) { auto -= dt; if (auto < 0 && on && phase === 'off') go('in'); }
            if (!on && grace <= 0 && (phase === 'in' || phase === 'hold' || phase === 'pulse')) go('fade');

            let show = A, f = 0, op = 1, s = 1;
            if (phase === 'in') {
                const d = 0.34, p = t / d;
                f = seqFrame(p, [0.8, 0.8, 1, 1.2]);
                s = 0.9 + 0.1 * easeOut(Math.min(1, p));
                if (p >= 1) go('hold');
            } else if (phase === 'hold' || phase === 'fade') {
                f = 4 + loopFrame(time, 6, 4);
            } else if (phase === 'pulse') {
                const d = 0.36, p = t / d;
                show = B; f = seqFrame(p, [0.7, 1, 1, 1]);
                s = 1 + 0.05 * Math.sin(Math.min(1, p) * Math.PI);
                if (p >= 1) go('hold');
            } else if (phase === 'shatter') {
                const d = 0.6, p = t / d;
                show = B; f = 4 + seqFrame(p, [0.8, 1, 1.2, 1.4]);
                op = p > 0.75 ? Math.max(0, (1 - p) / 0.25) : 1;
                if (p >= 1) go('off');
            }
            // độ hiện chung: vào nhanh, ra (fade) nhanh
            const target = phase === 'off' || phase === 'fade' ? 0 : 1;
            k += (target - k) * Math.min(1, dt * (target ? 14 : 7));
            if (phase === 'shatter') k = 1;
            if (phase === 'fade' && k < 0.02) go('off');
            g.visible = phase !== 'off' || k > 0.02;
            if (!g.visible) return api;

            const hp = phase === 'hold' || phase === 'fade' ? 0.62 + 0.38 * frac : 1;   // càng mất máu khiên càng mờ
            setFx(show, f);
            A.visible = show === A; B.visible = show === B;
            show.material.opacity = k * op * hp;
            // khiên khổng lồ đứng trước Rok về phía quái, mũi khiên chạm đất; lùi sâu ra sau (Rok + quái vẫn vẽ đè lên, rõ)
            body.position.set(dir * 3.0, GROUND + AEGIS_BELOW - 0.3 + Math.sin(time * 2.2) * 0.1, -2.2);
            body.scale.set(dir * s, s, 1);
            glow.material.opacity = k * op * (0.14 + 0.04 * Math.sin(time * 4) + 0.25 * flash);
            glow.position.set(0, 0.1, -0.02);
            // vòng thánh: hiện theo khiên, mờ khi vỡ
            const cr = 4.0;
            circle.position.set(dir * 1.8, GROUND + 0.04, -0.6);
            circle.scale.set(2 * cr / cw, 1.5 * cr, 1);
            circle.material.opacity = (phase === 'shatter' ? op * 0.7 : k * (0.55 + 0.15 * Math.sin(time * 3))) * (0.7 + 0.3 * frac) + 0.3 * flash * k;
            return api;
        },
        dispose() {
            g.parent?.remove(g);
            [A, B, circle, glow].forEach(m => { m.geometry.dispose(); m.material.dispose(); });
        },
    };
    return api;
}

// ------------------------------------------------------------
// Sóng vàng trên đất (Dựng Khiên cắm khiên / khiên nổ / Sư Tử Gầm)
// ------------------------------------------------------------
/** Vòng sóng vàng nằm trên đất loang từ `pos` tới bán kính `radius` */
export function spawnGoldRing(pos, { radius = 5.5, life = 0.5, from = 0.25 } = {}) {
    const m = FB.decal('goldRing', pos.x, pos.z ?? 0, 1, { lift: 0.05 });
    const aspect = FX.groups.goldRing.size[0] / FX.groups.goldRing.size[1];
    addAnim(m, life, (p, fx) => {
        const r = radius * (from + (1 - from) * easeOut(p));
        fx.mesh.scale.set(2 * r / aspect, 1.5 * r, 1);
        fx.mesh.material.opacity = p < 0.12 ? p / 0.12 : Math.max(0, (1 - p) / 0.88) ** 0.8;
    });
}

// ------------------------------------------------------------
// SƯ TỬ GẦM
// ------------------------------------------------------------
/** Cỡ Sư Tử Gầm so với bản đầu (người dùng muốn to gấp 3-4): sư tử ~6,5 đơn vị (cao hơn 2 lần Rok) */
const ROAR_SCALE = 3.3;
/**
 * Linh hồn sư tử vàng KHỔNG LỒ hiện sau Rok, lao về phía quái, GẦM (khung lớn nhất) rồi tan; sóng gầm ")))" lan theo,
 * sóng vàng loang trên đất tới bán kính khiêu khích. Sư tử đứng SAU nhân vật theo chiều sâu (Rok + quái vẫn rõ). `view` = Rok.
 */
export function spawnRokRoar(view, { radius = 9 } = {}) {
    const K = ROAR_SCALE;
    const dir = view.facingLeft ? -1 : 1;
    const pos = view.position, z = (pos.z ?? 0) - 0.9;
    const x0 = pos.x + dir * 1.2;
    const life = 1.0;
    const lion = rokFrames('lion', hOf('lion', U_LION) * K, { opacity: 0 });
    const glow = fxPlane(glowTexture(), 2.7 * K, 2.7 * K, { color: 0xffa630, opacity: 0 });
    const g = new THREE.Group();
    g.add(glow, lion);
    glow.position.set(dir * 0.1 * K, 1.38 * K, -0.05);   // đáy quầng sáng trên mặt đất (không bị đất cắt thẳng)
    addAnim(g, life, (p, fx) => {
        setFx(lion, seqFrame(p, [0.13, 0.17, 0.42, 0.28]));
        const run = easeOut(Math.min(1, p / 0.55));
        fx.mesh.position.set(x0 + dir * 4.2 * run, GROUND, z);
        lion.scale.set(dir, 1, 1);
        const o = fadeInOut(p, 0.08, 0.72);
        lion.material.opacity = o;
        glow.material.opacity = 0.3 * o * (p > 0.3 && p < 0.7 ? 1.3 : 1);
        glow.scale.setScalar(0.8 + 0.5 * Math.sin(Math.min(1, p) * Math.PI));
    });
    // sóng gầm bật ra từ miệng lúc gầm (khung 3), 2 lớp lệch nhịp — cùng cỡ sư tử
    for (const [delay, k] of [[0.3, 1], [0.44, 0.8]]) {
        const w = rokFrames('roarWave', 2.6 * k * K * 0.6, { opacity: 0 });
        addAnim(w, 0.65 + delay, (p, fx) => {
            const tt = Math.max(0, (p * (0.65 + delay) - delay) / 0.65);
            setFx(w, Math.floor(Math.min(0.999, tt) * 4));
            // gốc sóng (mép trái) ngay trước miệng sư tử đang gầm (miệng ~ +2,2 đơn vị, cao ~6)
            fx.mesh.position.set(x0 + dir * (4.2 + 0.8 + 2.8 * easeOut(tt)), GROUND + 5.5, z + 0.05);
            fx.mesh.scale.set(dir * (0.9 + 0.4 * tt), 0.9 + 0.4 * tt, 1);
            fx.mesh.material.opacity = tt <= 0 ? 0 : fadeInOut(tt, 0.08, 0.6);
        });
    }
    // sóng vàng trên đất tới đúng tầm khiêu khích
    const at0 = { x: pos.x, z: pos.z ?? 0 };
    gameTimeout(() => spawnGoldRing(at0, { radius, life: 0.7, from: 0.15 }), 280);
}

/** Dấu khiêu khích (đầu sư tử + "!") bật lên trên đầu quái bị khiêu khích */
export function spawnTauntIcon(view) {
    const m = rokFrames('tauntIcon', 0.95);
    m.position.set(0, 3.0, 0.35);
    addAnim(m, 1.4, (p, fx) => {
        const pop = p < 0.12 ? easeOut(p / 0.12) * 1.25 : 1.25 - 0.25 * Math.min(1, (p - 0.12) * 5);
        fx.mesh.scale.set(pop, pop, 1);
        fx.mesh.position.y = 3.0 + 0.12 * Math.sin(p * 18) * (1 - p);
        fx.mesh.material.opacity = p > 0.78 ? (1 - p) / 0.22 : 1;
    }, view.root);
}

// ------------------------------------------------------------
// ĐẨY KHIÊN / ĐẬP KHIÊN
// ------------------------------------------------------------
/** Loé húc khiên ở mặt khiên Rok (khung húc khiên có điểm "shield") */
export function spawnRokBash(view) {
    const dir = view.facingLeft ? -1 : 1;
    const w = view.pointWorld?.('shield');
    const at = w ? { x: w.x + dir * 0.35, y: w.y, z: w.z + 0.3 } : { x: view.position.x + dir * 1.4, y: 0.75, z: (view.position.z ?? 0) + 0.5 };
    const m = rokFrames('bashBurst', 1.35, { opacity: 0 });
    m.position.set(at.x, at.y, at.z);
    addAnim(m, 0.34, (p, fx) => {
        const s = 0.55 + 0.6 * easeOut(Math.min(1, p / 0.5));
        fx.mesh.scale.set(dir * s, s, 1);
        fx.mesh.material.opacity = p < 0.08 ? p / 0.08 : Math.max(0, (1 - p) / 0.92);
    });
    const glow = fxPlane(glowTexture(), 1.6, 1.6, { color: 0xffe08a, opacity: 0.9 });
    glow.position.set(at.x, at.y, at.z - 0.02);
    addAnim(glow, 0.22, (p, fx) => { fx.mesh.scale.setScalar(0.7 + easeOut(p) * 1.3); fx.mesh.material.opacity = 0.9 * (1 - p); });
    spawnHitSpark({ x: at.x, y: at.y - 0.75, z: at.z - 0.4 }, { count: 6, color: 0xffe08a, size: 1.0 });
}

/** Vòng nứt địa chấn nơi quái bị hất văng rơi xuống */
export function spawnRokQuake(pos, { radius = 3 } = {}) {
    const m = FB.decal('quakeRing', pos.x, pos.z ?? 0, 1, { lift: 0.03 });
    const aspect = FX.groups.quakeRing.size[0] / FX.groups.quakeRing.size[1];
    addAnim(m, 0.95, (p, fx) => {
        const r = radius * (0.7 + 0.3 * easeOut(Math.min(1, p / 0.18)));
        fx.mesh.scale.set(2 * r / aspect, 1.5 * r, 1);
        fx.mesh.material.opacity = p > 0.6 ? (1 - p) / 0.4 : 1;
    });
}

// ------------------------------------------------------------
// Biểu tượng nhỏ: khiên buff đội · dấu hồi máu
// ------------------------------------------------------------
/** Khiên nhỏ + mũi tên (cả đội +thủ khi Dựng Khiên) bật lên trên đầu `view` */
export function spawnBuffIcon(view, { delay = 0 } = {}) {
    const m = rokFrames('buffIcon', 0.8, { opacity: 0 });
    const y0 = (view.height ?? 2.9) + 0.45;
    addAnim(m, 1.3 + delay, (p, fx) => {
        const tt = Math.max(0, (p * (1.3 + delay) - delay) / 1.3);
        const pop = tt < 0.15 ? easeOut(tt / 0.15) : 1;
        fx.mesh.scale.setScalar(0.6 + 0.4 * pop);
        fx.mesh.position.set(0, y0 + 0.35 * easeOut(tt), 0.4);
        fx.mesh.material.opacity = tt <= 0 ? 0 : tt > 0.75 ? (1 - tt) / 0.25 : pop;
    }, view.root);
}

/** Dấu thập vàng trắng bay lên khi được hồi máu (khiên nổ hồi máu đội / Ý Chí Thép) */
export function spawnHealCross(view, { delay = 0 } = {}) {
    const m = rokFrames('healCross', 0.7, { opacity: 0 });
    addAnim(m, 1.0 + delay, (p, fx) => {
        const tt = Math.max(0, (p * (1.0 + delay) - delay) / 1.0);
        fx.mesh.position.set(0.25, 1.1 + 1.1 * easeOut(tt), 0.45);
        fx.mesh.scale.setScalar(0.7 + 0.3 * Math.min(1, tt * 5));
        fx.mesh.material.opacity = tt <= 0 ? 0 : fadeInOut(tt, 0.12, 0.6);
    }, view.root);
}

// ------------------------------------------------------------
// XÍCH ÁNH SÁNG (dây liên kết của Ý Chí Thép)
// ------------------------------------------------------------
const CHAIN_SEG = 1.5;   // đơn vị thế giới mỗi đoạn tranh xích (5 mắt xích)
/**
 * Xích vàng nối ngực Rok với đồng đội: nhiều đoạn tranh xích nối nhau theo đường võng nhẹ + vài đốm sáng chạy từ Rok sang.
 * API như bản cũ: update(dt, pa, pb, ya, yb, on) -> độ hiện k · dispose()
 */
export function makeChainTether() {
    const g = new THREE.Group();
    const segs = [];
    const segH = CHAIN_SEG * FX.groups.chain.size[1] / FX.groups.chain.size[0];
    const dots = [0, 1, 2].map(() => { const d = fxPlane(glowTexture(), 0.5, 0.5, { color: 0xffe9a8, opacity: 0 }); g.add(d); return d; });
    let t = 0, k = 0;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
    const at = (u, sag, out) => { out.lerpVectors(a, b, u); out.y -= Math.sin(u * Math.PI) * sag; return out; };
    return {
        group: g,
        update(dt, pa, pb, ya, yb, on = true) {
            t += dt;
            k += ((on ? 1 : 0) - k) * Math.min(1, dt * (on ? 4 : 8));
            a.set(pa.x, ya, (pa.z ?? 0) + 0.2);
            b.set(pb.x, yb, (pb.z ?? 0) + 0.2);
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            const sag = Math.min(0.7, len * 0.05);
            const n = Math.max(1, Math.min(16, Math.round(len / CHAIN_SEG)));
            while (segs.length < n) { const m = rokFrames('chain', segH, { opacity: 0 }); g.add(m); segs.push(m); }
            segs.forEach((m, i) => {
                m.visible = i < n;
                if (!m.visible) return;
                at(i / n, sag, p0); at((i + 1) / n, sag, p1);
                const dx = p1.x - p0.x, dy = p1.y - p0.y;
                m.position.set((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2 + i * 0.001);
                m.rotation.z = Math.atan2(dy, dx);
                m.scale.set(Math.hypot(dx, dy) / CHAIN_SEG, 1, 1);
                m.material.opacity = k * (0.78 + 0.12 * Math.sin(t * 5 + i * 0.9));
            });
            dots.forEach((d, i) => {
                const u = ((i / dots.length) + t * 0.4) % 1;   // đốm sáng chạy từ Rok sang người được nối
                at(u, sag, d.position); d.position.z += 0.02;
                d.scale.setScalar(0.8 + 0.3 * Math.sin(t * 9 + i));
                d.material.opacity = k * 0.7 * Math.sin(u * Math.PI);
            });
            return k;
        },
        dispose() { g.parent?.remove(g); segs.concat(dots).forEach(m => { m.geometry.dispose(); m.material.dispose(); }); },
    };
}
