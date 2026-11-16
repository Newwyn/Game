// ============================================================
// HIỆU ỨNG HƯ KHÔNG — Nyx (voidmage, Phù Thủy Hư Không tộc Goblin)
// ============================================================
// Hiệu ứng lấy từ thư viện pixelfx (src/vendor/pixelfx):
//   Bảng màu: 'arcane' cho kỹ năng 1–2 (Ma Đạn Tinh Tú, Sao Rơi), 'shadow' cho kỹ năng 3 (Hố Đen) và thiên phú.
import * as THREE from 'three';
import { GROUND_Y, gameTimeout } from '../config.js';
import { spawnPixelFx, spawnPixelMover } from './pixelFx.js';
import { addAnim, fxPlane, easeOut, spawnRisingGlyph } from './vfx.js';

const activeChannels = new Map();
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

// ------------------------------------------------------------
// 1. KN1: MA ĐẠN TINH TÚ — `missiles` (arcane-missiles) + `burst` (mana-burst)
// ------------------------------------------------------------
/** `missiles`: 5 tia tím bay từ tay Nyx tới mục tiêu trong `flight` ms */
export function spawnVoidMissiles(casterView, targetView, { flight = 600, toPos = null } = {}) {
    const from = nyxHandPoint(casterView);
    const to = targetView
        ? { x: targetView.position.x, y: GROUND_Y + 0.95, z: targetView.position.z }
        : (toPos ?? { x: from.x + (casterView?.facingLeft ? -6 : 6), y: GROUND_Y + 0.95, z: from.z });
    const flip = to.x < from.x;
    if (casterView) casterView.facingLeft = flip;
    return spawnPixelMover('arcane-missiles', {
        from,
        to,
        time: flight,
        palette: 'arcane',
        flip,
        scale: 1.0,
    });
}

/** `burst`: Mana Burst nổ tại mục tiêu (1 chớp lớn + 9 ấn chú nổ ~1.8s, giữ nguyên thời lượng gốc) */
export function spawnVoidBurst(pos, { orbLost = 0 } = {}) {
    const x = pos?.x ?? 0;
    const z = pos?.z ?? 0;
    const layer = spawnPixelFx('arcane/mana-burst', {
        pos: { x, z },
        palette: 'arcane',
    });
    if (orbLost > 0) {
        spawnRisingGlyph({ x, y: 0, z }, `−${orbLost}◆`, '#e9d5ff', '#6d28d9');
    }
    return layer;
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
    // Quả cầu tụ lực của spell-charge nằm ở (15, -22) px từ gốc -> dời gốc để tâm cầu trùng lòng bàn tay Nyx
    state.chargeLayer = spawnPixelFx('arcane/spell-charge', {
        view: casterView,
        pos: casterView?.position ?? { x: 0, z: 0 },
        bare: true,
        palette,
        scale: sc,
        maxLife: durSec,
        getPos: casterView ? () => {
            const fl = !!casterView.facingLeft;
            const q = nyxHandPoint(casterView);
            return { x: q.x - (fl ? -1 : 1) * 15 * u, y: q.y - 22 * u, z: (q.z ?? 0) + 0.3 };
        } : null,
        until: () => state.stopped || (casterView ? casterView.member?.alive === false : false),
    });

    if (shell) {
        // void-orb có tâm ở Y = -62 px phía trên gốc -> hạ gốc xuống để quả cầu đen bọc giữa thân Nyx
        const shellScale = 0.75;
        const shellLift = 1.1 - 62 * (h / 44) * shellScale;
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

/** `channelEnd`: dừng mọi hiệu ứng lặp của lần niệm (spell-charge, void-orb, black-hole) + nhả tư thế niệm */
export function endVoidChannel(casterId, casterIdx, casterView = null) {
    const key = casterKey(casterId, casterIdx);
    const state = activeChannels.get(key);
    const view = casterView ?? state?.casterView;
    if (state) {
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
/** `starWave`: 1 đợt sao rơi trên vùng (x, z, radius); 4 đợt cách nhau 0,5s nên dùng đợt ngắn (~0,85s) */
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
        spawnPixelFx('arcane/star-fall', { pos: { x: x ?? 0, z: z ?? 0 }, palette: 'arcane', scale, maxLife: 0.95, seed: (k + 1) * 7 + 13 });
    }, Math.max(0, (lead ?? 0) + w - STAR_FALL_FIRST_HIT)));
}
/** Lần niệm hiện tại của Nyx đã được báo trước vùng sao rơi / lịch xúc tu chưa (để `starWave` / `lash` khỏi thả hiệu ứng lần nữa) */
export const voidAimed = (casterId, casterIdx, what) => !!activeChannels.get(casterKey(casterId, casterIdx))?.[what];

// ------------------------------------------------------------
// 4. KN3: HỐ ĐEN — `hole` (black-hole) & `lash` (shadow-tendrils)
// ------------------------------------------------------------
/** `hole`: hố đen lặp trong `duration` ms tại (x, z), phóng theo `radius` */
const TENDRIL_LEAD = 300;   // ms: xúc tu trồi lên trước cú quất chừng này
export function spawnVoidHole(casterId, casterIdx, x, z, { radius = 8, duration = 4000, lashTimes = null, lashRadius = 4 } = {}) {
    const key = casterKey(casterId, casterIdx);
    const state = activeChannels.get(key);
    const durSec = Math.max(0.3, (duration ?? 4000) / 1000);
    const scale = Math.max(0.85, (radius ?? 8) / 4.8);
    // Tâm đĩa hố đen ở Y = -70 px trên gốc -> hạ lift để tâm hố đen lơ lửng ngang tầm ngực đội hình địch
    const u = (2.9 / 44) * scale;
    const lift = 1.65 - 70 * u;
    const layer = spawnPixelFx('shadow/black-hole', {
        pos: { x: x ?? 0, z: z ?? 0 },
        palette: 'shadow',
        scale,
        lift,
        maxLife: durSec,
        until: () => !!state?.stopped,
    });
    if (state) state.holeLayer = layer;
    // máy chủ gửi kèm lịch quất -> cho xúc tu trồi lên sớm TENDRIL_LEAD ms để cú quất khớp lúc gây sát thương
    if (state && Array.isArray(lashTimes)) {
        state.lashAimed = true;
        lashTimes.forEach((t, k) => gameTimeout(() => {
            if (state.stopped || activeChannels.get(key) !== state) return;
            spawnVoidLash(x, z, { n: k + 1, radius: lashRadius });
        }, Math.max(0, t - TENDRIL_LEAD)));
    }
    return layer;
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
    endVoidChannel(casterId, casterIdx, casterView);
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
