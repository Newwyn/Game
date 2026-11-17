// ============================================================
// HIỆU ỨNG HƯ KHÔNG — Nyx (voidmage, Phù Thủy Hư Không tộc Goblin)
// ============================================================
// Hiệu ứng lấy từ thư viện pixelfx (src/vendor/pixelfx):
//   Bảng màu: 'arcane' cho kỹ năng 1–2 (Ma Đạn Tinh Tú, Sao Rơi), 'shadow' cho kỹ năng 3 (Hố Đen) và thiên phú.
import * as THREE from 'three';
import { GROUND_Y, gameTimeout } from '../config.js';
import { spawnPixelFx, pixelLayer, pixelMod } from './pixelFx.js';
import { addAnim, fxPlane, glowTexture, easeOut, spawnRisingGlyph } from './vfx.js';

const activeChannels = new Map();
const activeHoles = new Map();   // Hố Đen đang mở / vừa khép (còn xúc tu chưa quất): { x, z, lashTimes, lashRadius, duration, broken, closed, lashAimed }
const activeVanishes = new Map();
const ERODE_TEX = new Map();

function casterKey(casterId, casterIdx) {
    return `${casterId ?? 'v'}:${casterIdx ?? 0}`;
}

/** Tọa độ bàn tay phóng phép của Nyx (bản sprite hoặc khung xương tạm mượn Ignar) */
export function nyxHandPoint(view) {
    if (!view) return { x: 0, y: GROUND_Y + 1.2, z: 0 };
    const spPt = view.pointWorld?.('hand', { sticky: true }) ?? view.pointWorld?.('palm', { sticky: true });
    if (spPt) return { x: spPt.x, y: spPt.y, z: view.position.z };
    const joint = view.parts?.handF ?? view.parts?.handN;
    if (joint) {
        const p = new THREE.Vector3();
        joint.getWorldPosition(p);
        return { x: p.x, y: p.y, z: view.position.z };
    }
    return {
        x: view.position.x + (view.facingLeft ? -0.6 : 0.6),
        y: GROUND_Y + 1.2 + (view._lift ?? 0) + (view._hover ?? 0),
        z: view.position.z,
    };
}

/**
 * Đầu gậy pha lê của Nyx lúc GIƠ GẬY NIỆM (khung starfall3..6: gậy giơ cao quá đầu, hơi chếch về phía trước).
 * Điểm `hand` trong atlas do máy tự dò nên rơi vào tai / tay trước chứ không phải đầu gậy -> dùng bảng đo tay dưới đây
 * ([về phía trước, lên trên] tính bằng điểm ảnh của tấm tranh, gốc ở chân); khung khác: điểm trên đầu ~1,05 × chiều cao, hơi chếch trước.
 */
const STAFF_TIP = { starfall3: [29, 384], starfall4: [29, 384], starfall5: [54, 384], starfall6: [48, 384] };
export function nyxStaffPoint(view) {
    if (!view) return { x: 0, y: GROUND_Y + 2.4, z: 0 };
    const h = view.height ?? 2.3, dir = view.facingLeft ? -1 : 1;
    const tip = STAFF_TIP[view._frame];
    if (tip && view._leanG && view._u && view._spMesh) {
        // cùng cách tính với FrameSpriteView.pointWorld: theo đúng tấm tranh đang hiện (lật theo hướng nhìn, nhún, nghiêng người)
        const s = view._spMesh.scale, u = view._u;
        const w = view._leanG.localToWorld(new THREE.Vector3(tip[0] * u * s.x, tip[1] * u * s.y, 0.2));
        return { x: w.x, y: w.y, z: view.position.z };
    }
    return {
        x: view.position.x + dir * h * 0.11,
        y: GROUND_Y + h * 1.05 + (view._lift ?? 0) + (view._hover ?? 0),
        z: view.position.z,
    };
}

// ------------------------------------------------------------
// 1. KN1: MA ĐẠN TINH TÚ — `missiles` (từng tia custom/void-bolt bay vòng cung) + `burst` (mana-burst)
// ------------------------------------------------------------
/**
 * 1 tia ma đạn: đốm sáng thành hình ở `slot` (sau lưng Nyx), lơ lửng `hold` giây rồi phóng đi theo đường cong tới `getTo()`
 * (đọc vị trí mới nhất của mục tiêu) trong `flight` giây; tới nơi loé 1 chớp nhỏ.
 */
function spawnVoidBolt(slot, ang, getTo, { hold = 0.3, flight = 0.4, seed = 1 } = {}) {
    const moteMod = pixelMod('custom/void-mote'), boltMod = pixelMod('custom/void-bolt');
    if (!moteMod || !boltMod) return;
    const mote = pixelLayer(moteMod, { front: true, palette: 'arcane', seed, scale: 1.15 });
    const bolt = pixelLayer(boltMod, { front: true, palette: 'arcane', seed, scale: 1.15 });
    const g = new THREE.Group();
    g.add(mote.group); g.add(bolt.group);
    bolt.group.visible = false;
    const out = { x: Math.cos(ang), y: Math.sin(ang) };
    const total = hold + flight;
    let from = null, p1, p2, to, age = 0, puffT = 0, hit = false;
    const bez = (t) => {
        const u = 1 - t;
        return {
            x: u * u * u * from.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * to.x,
            y: u * u * u * from.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * to.y,
            z: from.z + (to.z - from.z) * t,
        };
    };
    addAnim(g, total + 0.02, (p, fx, dt = 0) => {
        age += dt;
        if (age < hold) {
            // thành hình: phình ra rồi lơ lửng
            const k = Math.min(1, age / 0.12), bob = Math.sin(age * 22 + seed) * 0.04;
            mote.group.scale.setScalar(0.35 + 0.65 * k);
            g.position.set(slot.x + out.x * bob, slot.y + out.y * bob, (slot.z ?? 0) + 0.45);
            if (dt > 0) mote.step(dt);
            return;
        }
        if (!from) {
            const live = getTo();
            from = { x: slot.x, y: slot.y, z: slot.z ?? 0 };
            to = { x: live.x, y: live.y, z: live.z ?? 0 };
            // vọt ra theo hướng đang chĩa rồi vòng xuống mục tiêu từ phía trên
            p1 = { x: from.x + out.x * 3.0, y: from.y + out.y * 3.0 };
            p2 = { x: to.x - Math.sign(to.x - from.x || 1) * 2.2, y: to.y + 3.2 };
            mote.group.visible = false;
            bolt.group.visible = true;
        }
        const live = getTo();
        to.x += (live.x - to.x) * 0.25; to.y += (live.y - to.y) * 0.25; to.z += ((live.z ?? 0) - to.z) * 0.25;
        const t = Math.min(1, (age - hold) / flight);
        const e = t * t * (3 - 2 * t) * 0.35 + t * 0.65;
        const a = bez(e), b = bez(Math.min(1, e + 0.02)), c = bez(Math.max(0, e - 0.02));
        const dir = e >= 0.98 ? Math.atan2(a.y - c.y, a.x - c.x) : Math.atan2(b.y - a.y, b.x - a.x);
        g.position.set(a.x, a.y, a.z + 0.45);
        bolt.group.rotation.z = dir;
        if (dt > 0) bolt.step(dt);
        // bụi sáng rớt lại dọc đường bay
        puffT += dt;
        if (puffT > 0.03) {
            puffT = 0;
            const puff = fxPlane(glowTexture(), 0.34, 0.34, { color: 0xa855f7 });
            puff.position.set(a.x - Math.cos(dir) * 0.5, a.y - Math.sin(dir) * 0.5, a.z + 0.44);
            addAnim(puff, 0.28, (q, f2) => { const sc = 1 + q * 1.2; f2.mesh.scale.set(sc, sc, 1); f2.mesh.material.opacity = 0.55 * (1 - q); });
        }
        if (t >= 1 && !hit) {
            hit = true;
            spawnPixelFx('impacts/hit-spark', { pos: { x: to.x, z: to.z }, palette: 'arcane', scale: 0.75, flip: Math.cos(dir) < 0 });
            fx.life = fx.age;
        }
    });
}

/**
 * `missiles`: các tia ma đạn hiện thành vòng cung SAU LƯNG / quanh Nyx rồi phóng LẦN LƯỢT, mỗi tia bay vòng tới mục tiêu riêng.
 * shots: [{ target (view), delay (ms từ lúc ra chiêu tới lúc tia rời chỗ), flight (ms bay) }] · form: ms giơ tay trước khi tia đầu hiện.
 */
export function spawnVoidMissiles(casterView, shots, { form = 200, formTime = 300 } = {}) {
    if (!casterView || !shots?.length) return;
    const first = shots.find(s => s.target)?.target;
    if (first) casterView.facingLeft = first.position.x < casterView.position.x;
    const n = shots.length;
    shots.forEach((s, k) => {
        if (!s.target) return;
        const appear = (form ?? 0) + (k / Math.max(1, n)) * (formTime ?? 0) * 0.8;   // hiện lần lượt trong lúc xếp hàng
        gameTimeout(() => {
            if (casterView.member?.alive === false) return;
            const dir = casterView.facingLeft ? -1 : 1;
            const h = casterView.height ?? 2.3;
            // vòng cung sau lưng: từ chếch trên-trước (~65°) vòng qua đỉnh đầu xuống sau lưng (~195°), lật theo hướng nhìn
            const f = n > 1 ? k / (n - 1) : 0.5, r = (65 + f * 130) * Math.PI / 180, ang = dir > 0 ? r : Math.PI - r;
            const cx = casterView.position.x - dir * 0.25, cy = GROUND_Y + h * 0.62 + (casterView._lift ?? 0) + (casterView._hover ?? 0);
            const slot = { x: cx + Math.cos(ang) * h * 0.78, y: cy + Math.sin(ang) * h * 0.78, z: casterView.position.z };
            const yOff = 0.75 + ((k * 37) % 5) * 0.1;
            const t = s.target;
            spawnVoidBolt(slot, ang, () => ({ x: t.position.x, y: (t.position.y ?? GROUND_Y) + yOff + (t.sprite?.lift ?? 0), z: t.position.z }), {
                hold: Math.max(0.05, (s.delay - appear) / 1000), flight: Math.max(0.08, (s.flight ?? 400) / 1000), seed: k * 7 + 3,
            });
        }, appear);
    });
}

/** `burst`: Mana Burst nổ tại chỗ mục tiêu của tia CUỐI (1 chớp lớn + 9 ấn chú nổ ~1.8s, giữ nguyên thời lượng gốc) */
export function spawnVoidBurst(pos) {
    return spawnPixelFx('arcane/mana-burst', {
        pos: { x: pos?.x ?? 0, z: pos?.z ?? 0 },
        palette: 'arcane',
    });
}

/** `bolt`: tia ma đạn vừa đốt Orb của mục tiêu -> chữ nhỏ "−0.3◆" bay lên */
export function spawnVoidOrbLoss(pos, orbLost) {
    if (!(orbLost > 0)) return;
    spawnRisingGlyph({ x: pos?.x ?? 0, y: 0, z: pos?.z ?? 0 }, `−${Math.round(orbLost * 10) / 10}◆`, '#e9d5ff', '#6d28d9');
}

// ------------------------------------------------------------
// 2. NIỆM KÊNH — `channel` (spell-charge + void-orb) & `channelEnd`
// ------------------------------------------------------------
/**
 * `channel`: Nyx giữ tư thế niệm trong `duration` ms, lặp `spell-charge` ở bàn tay tới `channelEnd`;
 * khi `shell` = true (Thiên phú 2 — Vỏ Hư Không) bọc thêm `void-orb` quanh người cùng thời gian.
 */
export function startVoidChannel(casterId, casterIdx, casterView, {
    skill = 'starfall',
    duration = 5000,
    shell = false,
} = {}) {
    endVoidChannel(casterId, casterIdx);
    const key = casterKey(casterId, casterIdx);
    const durMs = Math.max(300, duration ?? 5000);
    const durSec = durMs / 1000;
    const palette = skill === 'blackhole' ? 'shadow' : 'arcane';

    if (casterView) {
        if (!casterView.playAction?.('charge', { hold: true })) {
            casterView.playAction?.('cast', { hold: true });
        }
        casterView.flashMagicCircle?.(durSec);
    }

    const state = {
        casterView,
        stopped: false,
        chargeLayer: null,
        shellLayer: null,
        holeLayer: null,
    };
    activeChannels.set(key, state);

    const sc = 0.85;
    const h = casterView?.height ?? 2.3;
    const u = (h / 44) * sc;
    const flipSign = casterView?.facingLeft ? -1 : 1;   // hiệu ứng lật theo hướng nhìn lúc bắt đầu niệm (đứng niệm thì không quay người)
    // Quả cầu tụ lực của spell-charge nằm ở (15, -22) px từ gốc -> dời gốc để tâm cầu trùng ĐẦU GẬY Nyx đang giơ cao (cả 2 hướng nhìn)
    state.chargeLayer = spawnPixelFx('arcane/spell-charge', {
        view: casterView,
        pos: casterView?.position ?? { x: 0, z: 0 },
        bare: true,
        palette,
        scale: sc,
        maxLife: durSec,
        getPos: casterView ? () => {
            const q = nyxStaffPoint(casterView);
            return { x: q.x - flipSign * 15 * u, y: q.y - 22 * u, z: (q.z ?? 0) + 0.3 };
        } : null,
        until: () => state.stopped || (casterView ? casterView.member?.alive === false : false),
    });

    if (shell) {
        // void-orb có tâm ở Y = -62 px phía trên gốc -> hạ gốc xuống để tâm quả cầu đen nằm GIỮA THÂN Nyx (nửa chiều cao)
        const shellScale = 0.75;
        const shellLift = h * 0.5 - 62 * (h / 44) * shellScale;
        state.shellLayer = spawnPixelFx('shadow/void-orb', {
            view: casterView,
            pos: casterView?.position ?? { x: 0, z: 0 },
            palette: 'shadow',
            scale: shellScale,
            lift: shellLift,
            maxLife: durSec,
            until: () => state.stopped || (casterView ? casterView.member?.alive === false : false),
        });
    }

    gameTimeout(() => {
        if (activeChannels.get(key) === state) endVoidChannel(casterId, casterIdx);
    }, durMs + 150);

    return state;
}

/**
 * `channelEnd`: dừng mọi hiệu ứng lặp của lần niệm (spell-charge, void-orb, black-hole) + nhả tư thế niệm.
 * reason khác 'done' (bị choáng / gục / Mượn Mạng lúc đang niệm) -> Hố Đen đang mở bị huỷ hẳn: không có xúc tu.
 */
export function endVoidChannel(casterId, casterIdx, casterView = null, reason = 'done') {
    const key = casterKey(casterId, casterIdx);
    const state = activeChannels.get(key);
    const view = casterView ?? state?.casterView;
    if (state) {
        const hole = activeHoles.get(key);
        if (hole && !hole.closed && reason !== 'done') { hole.broken = true; activeHoles.delete(key); }
        state.stopped = true;
        state.chargeLayer?.stop?.();
        state.shellLayer?.stop?.();
        state.holeLayer?.stop?.();
        activeChannels.delete(key);
    }
    if (view) {
        view.releaseHold?.('charge');
        view.releaseHold?.('cast');
    }
}

// ------------------------------------------------------------
// 3. KN2: SAO RƠI — `starWave` (star-fall)
// ------------------------------------------------------------
/** `starWave`: 1 đợt sao rơi trên vùng (x, z, radius) — chỉ dùng khi chưa nhận được `starAim` (bình thường sao đã thả trước từ `starAim`) */
export function spawnVoidStarWave(x, z, { n = 1, radius = 5.5, aimed = false } = {}) {
    if (aimed) return null;   // sao của đợt này đã được thả trước từ `starAim`
    const scale = Math.max(0.85, (radius ?? 5.5) / 3.2);
    return spawnPixelFx('arcane/star-fall', {
        pos: { x: x ?? 0, z: z ?? 0 },
        palette: 'arcane',
        scale,
        maxLife: 0.85,
        seed: (n ?? 1) * 7 + 13,
    });
}

const STAR_FALL_FIRST_HIT = 390;   // ms: ngôi sao đầu của hiệu ứng star-fall chạm đất sau khi hiệu ứng bắt đầu
/** `starAim`: máy chủ báo trước vùng rơi `lead` ms -> thả sao sao cho ngôi sao ĐẦU của mỗi đợt chạm đất đúng lúc đợt đó gây sát thương */
export function aimVoidStars(casterId, casterIdx, x, z, { radius = 5.5, lead = 450, waves = [0, 500, 1000, 1500] } = {}) {
    const key = casterKey(casterId, casterIdx);
    const state = activeChannels.get(key);
    if (state) state.starsAimed = true;
    const scale = Math.max(0.85, (radius ?? 5.5) / 3.2);
    (waves ?? []).forEach((w, k) => gameTimeout(() => {
        if (state && (state.stopped || activeChannels.get(key) !== state)) return;   // niệm bị ngắt: thôi không thả sao nữa
        spawnPixelFx('arcane/star-fall', { pos: { x: x ?? 0, z: z ?? 0 }, palette: 'arcane', scale, maxLife: 1.15, seed: (k + 1) * 7 + 13 });
    }, Math.max(0, (lead ?? 0) + w - STAR_FALL_FIRST_HIT)));
}
/** Lần niệm hiện tại của Nyx đã được báo trước vùng sao rơi / lịch xúc tu chưa (để `starWave` / `lash` khỏi thả hiệu ứng lần nữa) */
export const voidAimed = (casterId, casterIdx, what) => !!(activeChannels.get(casterKey(casterId, casterIdx))?.[what] ?? activeHoles.get(casterKey(casterId, casterIdx))?.[what]);

// ------------------------------------------------------------
// 4. KN3: HỐ ĐEN — `hole` (black-hole) · `pull` (nhịp hút) · `holeEnd` (hố khép, nổ) · `lash` (shadow-tendrils, SAU khi hố khép)
// ------------------------------------------------------------
const TENDRIL_LEAD = 300;   // ms: xúc tu trồi lên trước cú quất chừng này
const HOLE_Y = 1.65;        // tâm đĩa hố đen lơ lửng cao chừng này so với mặt đất (ngang ngực đội hình địch)
/** `hole`: hố đen lặp trong `duration` ms tại (x, z), phóng theo `radius`; ghi lại lịch xúc tu (lashTimes, tính từ lúc bắt đầu niệm) để `holeEnd` dùng */
export function spawnVoidHole(casterId, casterIdx, x, z, { radius = 8, duration = 4000, lashTimes = null, lashRadius = 4 } = {}) {
    const key = casterKey(casterId, casterIdx);
    const state = activeChannels.get(key);
    const durSec = Math.max(0.3, (duration ?? 4000) / 1000);
    const scale = Math.max(0.85, (radius ?? 8) / 4.8);
    // Tâm đĩa hố đen ở Y = -70 px trên gốc -> hạ lift để tâm hố đen lơ lửng ngang tầm ngực đội hình địch
    const u = (2.9 / 44) * scale;
    const lift = HOLE_Y - 70 * u;
    const hole = { x: x ?? 0, z: z ?? 0, radius, duration, lashTimes, lashRadius, broken: false, closed: false, lashAimed: false };
    activeHoles.set(key, hole);
    const layer = spawnPixelFx('shadow/black-hole', {
        pos: { x: x ?? 0, z: z ?? 0 },
        palette: 'shadow',
        scale,
        lift,
        maxLife: durSec,
        until: () => !!state?.stopped || hole.broken || hole.closed,
    });
    if (state) state.holeLayer = layer;
    // dọn sổ nếu vì lý do nào đó không nhận được holeEnd / channelEnd
    gameTimeout(() => { if (activeHoles.get(key) === hole) activeHoles.delete(key); }, Math.max(duration ?? 4000, ...(lashTimes ?? [0])) + 2500);
    return layer;
}

/**
 * `pull`: 1 nhịp hút — vòng sáng co về tâm hố đen + các vệt bị kéo vào (custom/void-pull, vẽ ngang tầm hố đen),
 * cộng 1 vệt tím kéo từ từng đối thủ vừa bị giật (`movedViews`) về phía tâm.
 */
export function spawnVoidPull(x, z, { radius = 8, n = 1, movedViews = [] } = {}) {
    const mod = pixelMod('custom/void-pull');
    if (mod) {
        // vòng ngoài của hiệu ứng rộng 100 px -> phóng để vòng đó trùng bán kính hút
        const scale = (radius ?? 8) / (100 * (2.9 / 44));
        const layer = pixelLayer(mod, { front: true, palette: 'shadow', seed: (n ?? 1) * 3 + 2, scale });
        layer.group.position.set(x ?? 0, GROUND_Y + HOLE_Y, (z ?? 0) + 0.2);
        addAnim(layer.group, 1.2, (p, fx, dt = 0) => {
            if (dt > 0) layer.step(dt);
            if (layer.done()) fx.life = fx.age;
        });
    }
    for (const v of movedViews) {
        if (!v) continue;
        const sx = v.position.x, sz = v.position.z, y = GROUND_Y + 1.0 + (v._lift ?? 0);
        const dx = (x ?? 0) - sx, len = Math.max(0.8, Math.min(2.6, Math.abs(dx)));
        const streak = fxPlane(glowTexture(), len, 0.22, { color: 0xc084fc, opacity: 0 });
        addAnim(streak, 0.32, (q, fx) => {
            // vệt chạy từ chỗ đứng cũ về phía tâm rồi tan
            const k = easeOut(q);
            fx.mesh.position.set(sx + Math.sign(dx || 1) * (len * 0.5 + k * 1.2), y, sz + 0.4);
            fx.mesh.scale.set(1 - 0.5 * q, 1, 1);
            fx.mesh.material.opacity = q < 0.2 ? q / 0.2 * 0.85 : 0.85 * (1 - q);
        });
    }
}

/**
 * `holeEnd`: niệm xong — hố đen khép lại, nổ 1 chớp bóng tối tại tâm; từ đây mới cho xúc tu trồi lên, mỗi đợt sớm TENDRIL_LEAD ms
 * so với lúc máy chủ gây sát thương (`lash`) để cú quất khớp con số.
 */
export function closeVoidHole(casterId, casterIdx, x, z, { radius = 4 } = {}) {
    const key = casterKey(casterId, casterIdx);
    const hole = activeHoles.get(key);
    spawnPixelFx('shadow/dark-explosion', { pos: { x: x ?? 0, z: z ?? 0 }, palette: 'shadow', scale: Math.max(0.8, (radius ?? 4) / 3.4), maxLife: 1.2 });
    if (!hole || hole.broken) return;
    hole.closed = true;
    if (Array.isArray(hole.lashTimes) && hole.lashTimes.length) {
        hole.lashAimed = true;
        hole.lashTimes.forEach((t, k) => gameTimeout(() => {
            spawnVoidLash(hole.x, hole.z, { n: k + 1, radius: hole.lashRadius ?? radius });
        }, Math.max(0, t - (hole.duration ?? 4000) - TENDRIL_LEAD)));
        const last = Math.max(...hole.lashTimes) - (hole.duration ?? 4000);
        gameTimeout(() => { if (activeHoles.get(key) === hole) activeHoles.delete(key); }, last + 400);
    }
}

/** `lash`: xúc tu bóng tối quất lên tại (x, z) */
export function spawnVoidLash(x, z, { n = 1, radius = 4 } = {}) {
    const scale = Math.max(0.85, (radius ?? 4) / 2.8);
    return spawnPixelFx('shadow/shadow-tendrils', {
        pos: { x: x ?? 0, z: z ?? 0 },
        palette: 'shadow',
        scale,
        maxLife: 1.4,
        seed: (n ?? 1) * 5 + 3,
    });
}

// ------------------------------------------------------------
// 5. THIÊN PHÚ 2 (MƯỢN MẠNG): `vanish` (portal) & `return` (blink-in)
// ------------------------------------------------------------
function setViewHidden(view, hidden) {
    if (!view) return;
    view._voidVanished = hidden;
    if (hidden) {
        view.opacityOverride = 0;
        view.opacity = 0;
        view.setOpacity?.(0);
        if (view.stand) view.stand.visible = false;
        if (view.shadow) view.shadow.visible = false;
        if (view.hpBar) view.hpBar.visible = false;
        if (view.castBar) view.castBar.visible = false;
        if (view.shieldBar) view.shieldBar.visible = false;
        if (view.teamDisc) view.teamDisc.visible = false;
    } else {
        view.opacityOverride = null;
        view.opacity = 1;
        view.setOpacity?.(1);
        if (view.stand) view.stand.visible = true;
        if (view.shadow) view.shadow.visible = true;
        if (view.hpBar && view.member?.alive !== false) view.hpBar.visible = true;
        if (view.teamDisc && view.member?.alive !== false) view.teamDisc.visible = true;
    }
}

/** `vanish`: mở cổng Hư Không tại chỗ Nyx và ẩn Nyx trong `duration` ms */
export function spawnVoidVanish(casterId, casterIdx, casterView, { duration = 3000 } = {}) {
    endVoidChannel(casterId, casterIdx, casterView, 'vanish');
    const key = casterKey(casterId, casterIdx);
    activeVanishes.get(key)?.stop?.();

    const durMs = Math.max(300, duration ?? 3000);
    const durSec = durMs / 1000;
    const pos = { x: casterView?.position?.x ?? 0, z: casterView?.position?.z ?? 0 };
    let done = false;
    const portalLayer = spawnPixelFx('arcane/portal', {
        pos,
        palette: 'shadow',
        scale: 1.05,
        maxLife: durSec,
        until: () => done,
    });

    setViewHidden(casterView, true);
    const entry = {
        casterView,
        stop: () => {
            if (done) return;
            done = true;
            portalLayer?.stop?.();
            setViewHidden(casterView, false);
        },
    };
    activeVanishes.set(key, entry);

    gameTimeout(() => {
        if (activeVanishes.get(key) === entry) {
            entry.stop();
            activeVanishes.delete(key);
        }
    }, durMs + 100);

    return portalLayer;
}

/** `return`: hiện lại ở (x, z) kèm hiệu ứng blink-in */
export function spawnVoidReturn(casterId, casterIdx, casterView, { x, z } = {}) {
    const key = casterKey(casterId, casterIdx);
    const entry = activeVanishes.get(key);
    if (entry) {
        entry.stop();
        activeVanishes.delete(key);
    } else {
        setViewHidden(casterView, false);
    }

    const tx = x ?? casterView?.position?.x ?? 0;
    const tz = z ?? casterView?.position?.z ?? 0;
    if (casterView && x != null) {
        casterView.teleport?.(tx, tz, false);
    }
    return spawnPixelFx('arcane/blink-in', {
        view: casterView,
        pos: { x: tx, z: tz },
        bare: true,
        palette: 'shadow',
        scale: 1.05,
    });
}

// ------------------------------------------------------------
// 6. THIÊN PHÚ 1 (XÓI MÒN HƯ KHÔNG): `erode` (dấu giảm thủ phép 1–5 tầng)
// ------------------------------------------------------------
function erodeBadgeTexture(stacks) {
    const n = Math.max(1, Math.min(5, stacks | 0));
    if (ERODE_TEX.has(n)) return ERODE_TEX.get(n);
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    const ctx = c.getContext('2d');
    ctx.translate(48, 48);

    // Khiên phép tím sẫm bị nứt (bảng màu shadow)
    ctx.shadowColor = '#2c1a4a';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#5e3290';
    ctx.strokeStyle = '#1c1230';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(28, -22);
    ctx.lineTo(24, 10);
    ctx.quadraticCurveTo(0, 34, 0, 36);
    ctx.quadraticCurveTo(0, 34, -24, 10);
    ctx.lineTo(-28, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vết nứt Hư Không sáng tím nhạt ở giữa khiên
    ctx.strokeStyle = '#ecc8ff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-4, -28);
    ctx.lineTo(5, -10);
    ctx.lineTo(-5, 6);
    ctx.lineTo(4, 26);
    ctx.stroke();

    // Số tầng cộng dồn (1–5) ở góc dưới phải
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#050308';
    ctx.fillStyle = '#ffffff';
    const label = `×${n}`;
    ctx.strokeText(label, 14, 18);
    ctx.fillText(label, 14, 18);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    ERODE_TEX.set(n, tex);
    return tex;
}

/** `erode`: hiện dấu giảm thủ phép (stacks 1–5) trên đầu mục tiêu */
export function spawnVoidErode(targetView, { stacks = 1 } = {}) {
    if (!targetView) return;
    const n = Math.max(1, Math.min(5, stacks ?? 1));
    const tex = erodeBadgeTexture(n);
    const h = (targetView.height ?? 2.2) + (targetView.sprite?.lift ?? 0) + 0.55;
    const ic = fxPlane(tex, 0.78, 0.78, { additive: false, opacity: 0 });
    addAnim(ic, 0.95, (q, fx) => {
        const cur = targetView.position;
        const pop = q < 0.18 ? easeOut(q / 0.18) * 1.25 : 1.25 - 0.25 * Math.min(1, (q - 0.18) * 3);
        fx.mesh.position.set(cur.x, GROUND_Y + h + (targetView._lift ?? 0) + q * 0.28, (cur.z ?? 0) + 0.65);
        fx.mesh.scale.setScalar(pop);
        fx.mesh.material.opacity = q > 0.72 ? (1 - q) / 0.28 : 1;
    });
}
