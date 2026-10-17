// ============================================================
// NGỌC NGUYÊN TỐ (Elarion) — phần 3D: 3 quả cầu đang giữ bay quanh đầu pháp sư
// ============================================================
//   · Ngọc rơi ra để NHẶT nằm trên KHAY NGỌC của thẻ Elarion (HUD — src/ui/hud.js, updateGemTray):
//     bấm chuột trên thẻ, không phụ thuộc camera / góc nhìn / động tác nhân vật.
//   · Ở đây chỉ vẽ 3 quả cầu đang giữ bay quanh đầu pháp sư (cả 2 phe đều thấy, như Invoker)
//     + chớp sáng ở quả cầu mới khi vừa nhặt.
import * as THREE from 'three';
import { scene } from '../core/scene.js';
import { game, myId, getView } from '../state.js';
import { GROUND_Y } from '../config.js';
import { makeGem, disposeGem, spawnGemAppear } from '../vfx/elemFx.js';
import { hudGemPicked } from '../ui/hud.js';

const ORBIT = new Map();   // view -> { list: [{ el, gem }], sig, t }

/** Vị trí quả cầu thứ k (trong n quả) bay quanh đầu pháp sư */
export function orbitPoint(view, k, n = 3, t = ORBIT.get(view)?.t ?? 0) {
    const a = t * 2.2 + (k / Math.max(1, n)) * Math.PI * 2;
    const h = view.height ?? 2.4;
    return new THREE.Vector3(view.position.x + Math.cos(a) * 0.8, GROUND_Y + h + 0.3 + Math.sin(a * 2) * 0.08, (view.position.z ?? 0) + Math.sin(a) * 0.5 + 0.3);
}

function updateOrbit(view, m, dt) {
    let o = ORBIT.get(view);
    if (!o) { o = { list: [], sig: '', t: Math.random() * 6 }; ORBIT.set(view, o); }
    o.t += dt;
    const held = m.alive ? (m.held ?? []) : [];
    const sig = held.join('');
    if (o.sig !== sig) {
        o.list.forEach(x => disposeGem(x.gem));
        o.list = held.map(el => { const gem = makeGem(el, 0.26); scene.add(gem.group); return { el, gem }; });
        o.sig = sig;
    }
    o.list.forEach((x, k) => x.gem.group.position.copy(orbitPoint(view, k, o.list.length, o.t)));
}

/** Mỗi khung hình (battleScene.updateViews) */
export function updateElemGems(dt) {
    const players = game.roomData?.players;
    const views = new Set();
    if (players) for (const [pid, pd] of Object.entries(players)) {
        pd.squad.forEach((m, idx) => {
            if (m.classId !== 'elementalist') return;
            const view = getView(pid, idx);
            if (!view) return;
            views.add(view);
            updateOrbit(view, m, dt);
        });
    }
    for (const [v, o] of ORBIT) if (!views.has(v)) { o.list.forEach(x => disposeGem(x.gem)); ORBIT.delete(v); }
}

/** Server báo đã nhặt (bấm trên khay hoặc AI tự nhặt): chớp sáng ở quả cầu mới quanh đầu + ngọc trên khay bay vào ô */
export function onGemPicked(d) {
    const v = getView(d.casterId, d.casterIdx);
    if (v) {
        const n = Math.max(1, d.held?.length ?? 3);
        spawnGemAppear(orbitPoint(v, n - 1, n), d.el);
    }
    if (d.casterId === myId()) hudGemPicked(d);
}

/** Trận mới: dọn hết */
export function clearElemGems() {
    for (const o of ORBIT.values()) o.list.forEach(x => disposeGem(x.gem));
    ORBIT.clear();
}
