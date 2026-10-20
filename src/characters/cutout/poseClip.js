// ============================================================
// DỰNG ANIMATION TỪ CÁC "TƯ THẾ" (pose) — dùng chung cho mọi nhân vật 2D ghép mảnh
// ============================================================
// Một tư thế = { tênKhớp: góc (rad), hips: [dx, dy], liftF?: 0|1 }
//   góc  : xoay quanh trục z (dương = ngược chiều kim đồng hồ)
//   hips : dịch cả người, tính theo tỉ lệ chiều cao nhân vật (dy dương = nhấc lên)
//   liftF: 1 = đưa cả tay xa (armF và mọi thứ nó cầm) lên lớp TRƯỚC thân người
//          (VD: tay xa đưa ấn ra trước ngực), nhưng vẫn sau tay gần
//   air  : true = tư thế đang ở trên không (nhảy, rơi) -> KHÔNG tự đặt chân chạm đất
//   sq   : [sx, sy] = co giãn cả người quanh gốc hông (nhân vật 1 hình liền như Golem: nhún, phồng, dẹp)
//
// Tự chạm đất: với nhân vật có chân 2 đốt (thigh + shin), mỗi tư thế (trừ air) được dịch hips lên/xuống
// sao cho điểm thấp nhất của hai bàn chân (gót hoặc mũi) nằm đúng mặt đất -> không lơ lửng, không lún.
import * as THREE from 'three';

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const SPECIAL = new Set(['hips', 'liftF', 'dropN', 'air', 'sq']);
export const LIFT_Z = 0.38;
// dropN: 1 = đưa cả tay GẦN (armN + mọi thứ nó cầm) xuống SAU đầu (nhưng vẫn trước thân) — dùng khi giơ tay/kiếm
//        qua đầu để cánh tay không che mặt. Rig nào cần thì khai báo rig.dropNZ (độ lùi z).
export const DROP_Z = 0.285; // tay xa (z 1-3) -> 0.40-0.44: trên thân/đầu/khăn (<= 0.36), dưới tay gần (>= 0.44)

// ---------- Đường cong tốc độ (tuỳ chọn, mặc định TẮT) ----------
// ease: mảng tên đường cong cho từng đoạn giữa 2 khoá (dài = số khoá − 1), null = tuyến tính như cũ.
// Khi bật: lấy mẫu dày (sampleRate khoá / giây) theo đường cong -> clip vẫn nội suy tuyến tính giữa các mẫu,
// mốc thời gian của khoá gốc (và hitTime của động tác) giữ nguyên.
export const EASE = {
    linear: (t) => t,
    in: (t) => t * t * t,                                            // tăng tốc dần (bung ra)
    out: (t) => 1 - Math.pow(1 - t, 3),                              // chậm dần (dừng êm)
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),                  // thở / đung đưa đều
    outQuad: (t) => 1 - (1 - t) * (1 - t),
};
const lerp = (a, b, u) => a + (b - a) * u;
/** Tư thế xen giữa a -> b ở tỉ lệ u (góc + hips + sq nội suy; liftF / dropN / air giữ theo a) */
function lerpPose(a, b, u) {
    const o = { ...a };
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (k === 'liftF' || k === 'dropN' || k === 'air') continue;
        const va = a[k], vb = b[k] ?? va;
        if (Array.isArray(va)) o[k] = va.map((x, i) => lerp(x, (vb ?? va)[i] ?? x, u));
        else if (typeof va === 'number') o[k] = lerp(va, typeof vb === 'number' ? vb : va, u);
        else if (va === undefined && typeof vb === 'number') o[k] = vb;
    }
    return o;
}
function easeSample(times, poses, ease, rate) {
    const T = [], P = [];
    for (let i = 0; i < times.length - 1; i++) {
        const t0 = times[i], t1 = times[i + 1];
        const f = EASE[ease[i]] ?? (typeof ease[i] === 'function' ? ease[i] : null);
        if (!f || t1 - t0 <= 0) { T.push(t0); P.push(poses[i]); continue; }
        const n = Math.max(1, Math.ceil((t1 - t0) * rate));
        for (let k = 0; k < n; k++) { T.push(t0 + (t1 - t0) * k / n); P.push(lerpPose(poses[i], poses[i + 1], f(k / n))); }
    }
    T.push(times[times.length - 1]); P.push(poses[poses.length - 1]);
    return [T, P];
}

export function buildPoseClip(name, times, poses, parts, height, { liftPart = 'armF', ease = null, sampleRate = 60 } = {}) {
    // liftPart: khớp được nâng lớp khi liftF=1 (mặc định cả tay xa 'armF'; Rok dùng 'foreF' để bắp tay xa vẫn nằm SAU thân)
    if (ease) [times, poses] = easeSample(times, poses, ease, sampleRate);
    const tracks = [];
    const keys = Object.keys(poses[0]).filter(k => !SPECIAL.has(k));
    for (const key of keys) {
        if (!parts[key]) continue;
        const values = [];
        poses.forEach(p => { _q.setFromEuler(_e.set(0, 0, p[key] ?? 0)); values.push(_q.x, _q.y, _q.z, _q.w); });
        tracks.push(new THREE.QuaternionKeyframeTrack(`${key}.quaternion`, times, values));
    }
    if (parts.hips) {
        const p0 = parts.hips.position;
        const values = [];
        const ground = makeGrounder(parts);
        poses.forEach(p => {
            const o = p.hips ?? [0, 0];
            let y = p0.y + o[1] * height;
            if (ground && !p.air) y += ground(p, p0.x + o[0] * height, y);
            values.push(p0.x + o[0] * height, y, p0.z);
        });
        tracks.push(new THREE.VectorKeyframeTrack('hips.position', times, values));
    }
    if (parts.hips && poses.some(p => p.sq)) {
        const values = [];
        poses.forEach(p => { const [sx, sy] = p.sq ?? [1, 1]; values.push(sx, sy, 1); });
        tracks.push(new THREE.VectorKeyframeTrack('hips.scale', times, values));
    }
    if (parts[liftPart] && poses[0].liftF !== undefined) {
        const p0 = parts[liftPart].position;
        const values = [];
        poses.forEach(p => values.push(p0.x, p0.y, p0.z + (p.liftF ? LIFT_Z : 0)));
        // Đổi lớp tức thì (không trượt dần qua các lớp ở giữa)
        tracks.push(new THREE.VectorKeyframeTrack(`${liftPart}.position`, times, values, THREE.InterpolateDiscrete));
    }
    if (parts.armN && poses.some(p => p.dropN)) {
        const p0 = parts.armN.position;
        const values = [];
        poses.forEach(p => values.push(p0.x, p0.y, p0.z - (p.dropN ? DROP_Z : 0)));
        tracks.push(new THREE.VectorKeyframeTrack('armN.position', times, values, THREE.InterpolateDiscrete));
    }
    return new THREE.AnimationClip(name, times[times.length - 1], tracks);
}

/**
 * Trả về hàm (pose, hipsX, hipsY) -> độ dịch y để chân thấp nhất chạm đất (y = 0 của nhân vật).
 * Gót / mũi bàn chân ước lượng theo độ sâu từ gối xuống đế (bốt nhìn nghiêng, mũi hướng phải).
 */
function makeGrounder(parts) {
    const legs = [['thighN', 'shinN'], ['thighF', 'shinF']].filter(([t, s]) => parts[t] && parts[s]);
    if (legs.length < 2 || !parts.hips) return null;
    const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    const info = legs.map(([t, s]) => {
        const thigh = parts[t].position, shin = parts[s].position;
        const depth = parts.hips.position.y + thigh.y + shin.y; // gối -> đế giày (lúc đứng thẳng)
        return { t, s, thigh, shin, sole: [[-0.29 * depth, -depth], [0.58 * depth, -depth]] };
    });
    return (pose, hx, hy) => {
        let minY = Infinity;
        for (const L of info) {
            const at = pose[L.t] ?? 0, as = pose[L.s] ?? 0;
            const [kx, ky] = rot(L.shin.x, L.shin.y, at);
            for (const [sx, sy] of L.sole) {
                const [fx, fy] = rot(sx, sy, at + as);
                minY = Math.min(minY, hy + L.thigh.y + ky + fy);
            }
        }
        return -minY;
    };
}
