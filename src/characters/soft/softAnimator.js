// ============================================================
// BỘ CHẠY ĐỘNG TÁC MỀM — nội suy tư thế bằng đường cong tốc độ, chuyển động tác hoà dần (không giật)
// ============================================================
// Một động tác (clip) = { name, loop?, keys: [{ t, p, e? }], hit?, eyes?: [[t, skin]] }
//   t : mốc thời gian (giây) · p : tư thế (cùng quy ước với cutout/poseClip.js: góc khớp + hips/liftF/dropN/air)
//   e : đường cong đi TỪ khoá trước TỚI khoá này: linear | in | out | inOut | sine | back (vượt quá rồi bật lại) | snap
//   hit: mốc ra đòn (bộ chạy báo về để làm loé / rung / khựng hình)
import { LIFT_Z, DROP_Z } from '../cutout/poseClip.js';
import { setSkin } from '../CutoutCharacterView.js';

export const EASE = {
    linear: t => t,
    in: t => t * t * t,
    out: t => 1 - Math.pow(1 - t, 3),
    inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    sine: t => 0.5 - 0.5 * Math.cos(Math.PI * t),
    back: t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    snap: t => 1 - Math.pow(2, -10 * t),
};
const SPECIAL = new Set(['hips', 'liftF', 'dropN', 'air', 'sq', 'noTuck']);
const lerp = (a, b, u) => a + (b - a) * u;

function lerpPose(a, b, u) {
    const o = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (k === 'liftF' || k === 'dropN' || k === 'air' || k === 'noTuck') { o[k] = u < 0.5 ? a[k] : b[k]; continue; }
        const va = a[k], vb = b[k];
        if (Array.isArray(va) || Array.isArray(vb)) {
            const A = va ?? [0, 0], B = vb ?? A;
            o[k] = A.map((x, i) => lerp(x, B[i] ?? x, u));
        } else o[k] = lerp(va ?? 0, vb ?? va ?? 0, u);
    }
    return o;
}

export class SoftAnimator {
    /** parts: khớp (THREE.Group) của buildSoftRig · skins: bảng da (mắt, bàn tay) */
    constructor(parts, skins, height) {
        this.parts = parts;
        this.skins = skins;
        this.height = height;
        this.rest = Object.fromEntries(Object.entries(parts).map(([k, j]) => [k, j.position.clone()]));
        this.grounder = makeGrounder(parts);
        this.clip = null;
        this.time = 0;
        this.fadeFrom = null;
        this.fadeT = 0;
        this.fadeDur = 0;
        this.freezeT = 0;
        this.pose = null;
        this.events = [];
        this.speed = 1;
        this.onEnd = null;
    }

    /** Đổi động tác, hoà từ tư thế đang hiện sang động tác mới trong `fade` giây */
    play(clip, { fade = 0.14, onEnd = null } = {}) {
        if (this.pose && fade > 0) { this.fadeFrom = this.pose; this.fadeT = 0; this.fadeDur = fade; }
        else this.fadeFrom = null;
        this.clip = clip;
        this.time = 0;
        this._hitDone = false;
        this.onEnd = onEnd;
        this._eyeIdx = -1;
    }

    /** khựng hình (cú đánh trúng): đứng yên `s` giây */
    freeze(s) { this.freezeT = Math.max(this.freezeT, s); }

    sample(clip, t) {
        const K = clip.keys;
        const dur = K[K.length - 1].t;
        if (clip.loop && dur > 0) t %= dur;
        if (t <= K[0].t) return { pose: K[0].p, key: K[0] };
        for (let i = 1; i < K.length; i++) {
            if (t <= K[i].t) {
                const a = K[i - 1], b = K[i];
                const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
                const f = EASE[b.e ?? 'inOut'] ?? EASE.inOut;
                return { pose: lerpPose(a.p, b.p, f(u)), key: u < 0.5 ? a : b };
            }
        }
        return { pose: K[K.length - 1].p, key: K[K.length - 1] };
    }

    update(dt) {
        this.events.length = 0;
        if (!this.clip) return;
        if (this.freezeT > 0) { this.freezeT -= dt; return; }
        dt *= this.speed;
        this.time += dt;
        const clip = this.clip;
        const dur = clip.keys[clip.keys.length - 1].t;

        if (clip.hit != null && !this._hitDone && this.time >= clip.hit) { this._hitDone = true; this.events.push({ type: 'hit', clip: clip.name }); }
        if (!clip.loop && this.time >= dur && this.onEnd) { const f = this.onEnd; this.onEnd = null; f(); return; }

        let { pose } = this.sample(clip, this.time);
        if (this.fadeFrom) {
            this.fadeT += dt;
            const u = Math.min(1, this.fadeT / this.fadeDur);
            pose = lerpPose(this.fadeFrom, pose, EASE.inOut(u));
            if (u >= 1) this.fadeFrom = null;
        }
        this.pose = pose;
        this.apply(pose);

        // mắt / bàn tay đổi theo mốc thời gian
        if (clip.eyes) {
            const t = clip.loop ? this.time % dur : this.time;
            const all = { eye: 'open', handN: 'fist' };
            for (const [tk, part, skin] of clip.eyes) if (tk <= t + 1e-4) all[part] = skin;
            for (const [p, s] of Object.entries(all)) setSkin(this.skins, p, s);
        } else { setSkin(this.skins, 'eye', 'open'); setSkin(this.skins, 'handN', 'fist'); }
    }

    apply(pose) {
        const P = this.parts, R = this.rest, H = this.height;
        for (const k of Object.keys(P)) {
            if (k === 'hips') continue;
            if (!SPECIAL.has(k)) P[k].rotation.z = pose[k] ?? 0;
        }
        const hips = pose.hips ?? [0, 0];
        let x = R.hips.x + hips[0] * H, y = R.hips.y + hips[1] * H;
        if (this.grounder && !pose.air) y += this.grounder(pose, x, y);
        P.hips.position.set(x, y, R.hips.z);
        const sq = pose.sq ?? [1, 1];
        P.hips.scale.set(sq[0], sq[1], 1);
        if (P.foreF) P.foreF.position.z = R.foreF.z + (pose.liftF ? LIFT_Z : 0);
        if (P.armN) P.armN.position.z = R.armN.z - (pose.dropN ? DROP_Z : 0);
    }
}

/** Đặt chân chạm đất (giống cutout/poseClip.js) */
function makeGrounder(parts) {
    const legs = [['thighN', 'shinN'], ['thighF', 'shinF']].filter(([t, s]) => parts[t] && parts[s]);
    if (legs.length < 2 || !parts.hips) return null;
    const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    const info = legs.map(([t, s]) => {
        const thigh = parts[t].position.clone(), shin = parts[s].position.clone();
        const depth = parts.hips.position.y + thigh.y + shin.y;
        return { t, s, thigh, shin, sole: [[-0.29 * depth, -depth], [0.58 * depth, -depth]] };
    });
    return (pose, hx, hy) => {
        let minY = Infinity;
        for (const L of info) {
            const at = pose[L.t] ?? 0, as = pose[L.s] ?? 0;
            const [kx, ky] = rot(L.shin.x, L.shin.y, at);
            for (const [sx, sy] of L.sole) {
                const [, fy] = rot(sx, sy, at + as);
                minY = Math.min(minY, hy + L.thigh.y + ky + fy);
            }
        }
        return -minY;
    };
}
