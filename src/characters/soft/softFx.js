// ============================================================
// HIỆU ỨNG ĐI KÈM KHUNG XƯƠNG MỀM (thử nghiệm): vệt chém, tia lửa khi trúng, bụi chân, tàn lửa vũ khí
// ============================================================
// Tất cả cộng sáng (additive), tự tan — nhẹ máy, nhìn rõ đường kiếm mà không che nhân vật.
import * as THREE from 'three';

function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
}
function dustTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    r.addColorStop(0, 'rgba(235,222,190,0.85)'); r.addColorStop(1, 'rgba(235,222,190,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
}
let GLOW = null, DUST = null;

// ---------- Vệt chém: dải sáng nối các vị trí (chuôi -> mũi kiếm) gần nhất ----------
export class SwordTrail {
    constructor(scene, max = 64) {
        this.max = max;
        this.samples = [];      // { base, tip, t }
        this.life = 0.16;
        const geo = new THREE.BufferGeometry();
        this.pos = new Float32Array(max * 2 * 3);
        this.col = new Float32Array(max * 2 * 4);
        geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(this.col, 4));
        const idx = [];
        for (let i = 0; i < max - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        geo.setIndex(idx);
        this.mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending,
            depthWrite: false, side: THREE.DoubleSide, fog: false });
        this.mesh = new THREE.Mesh(geo, this.mat);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 50;
        scene.add(this.mesh);
        this.colIn = new THREE.Color(0xffffff); this.colOut = new THREE.Color(0xbfd6ff);
    }
    setColors(inner, outer) { this.colIn.set(inner); this.colOut.set(outer); }
    push(base, tip, t) {
        // kiếm quay nhanh: giữa 2 khung có thể lệch cả chục độ -> chèn điểm trên CUNG TRÒN cho vệt cong mượt
        const last = this.samples[this.samples.length - 1];
        if (last) {
            const a0 = Math.atan2(last.tip.y - last.base.y, last.tip.x - last.base.x);
            const a1 = Math.atan2(tip.y - base.y, tip.x - base.x);
            let da = a1 - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
            const l0 = last.tip.distanceTo(last.base), l1 = tip.distanceTo(base);
            const n = Math.min(8, Math.floor(Math.abs(da) / 0.1));
            for (let k = 1; k <= n; k++) {
                const u = k / (n + 1), a = a0 + da * u, l = l0 + (l1 - l0) * u;
                const b = last.base.clone().lerp(base, u);
                const tp = new THREE.Vector3(b.x + Math.cos(a) * l, b.y + Math.sin(a) * l, b.z + (tip.z - base.z));
                this.samples.push({ base: b, tip: tp, t: last.t + (t - last.t) * u });
            }
        }
        this.samples.push({ base: base.clone(), tip: tip.clone(), t });
        while (this.samples.length > this.max) this.samples.shift();
    }
    update(t) {
        while (this.samples.length && t - this.samples[0].t > this.life) this.samples.shift();
        const n = this.samples.length;
        this.mesh.geometry.setDrawRange(0, Math.max(0, (n - 1) * 6));
        for (let i = 0; i < n; i++) {
            const s = this.samples[i];
            const age = 1 - (t - s.t) / this.life;               // 1 = mới nhất
            const a = Math.max(0, age) * Math.pow(i / Math.max(1, n - 1), 0.6);
            // mép trong (gần chuôi) mờ, mép ngoài (mũi kiếm) sáng
            this.pos.set([s.base.x, s.base.y, s.base.z, s.tip.x, s.tip.y, s.tip.z], i * 6);
            // mép chuôi trong suốt, mép mũi kiếm mang màu vũ khí; khúc mới nhất sáng lõi (màu trong)
            const hot = Math.pow(Math.max(0, age), 3);
            const tr = this.colOut.r + (this.colIn.r - this.colOut.r) * hot, tg = this.colOut.g + (this.colIn.g - this.colOut.g) * hot,
                tb = this.colOut.b + (this.colIn.b - this.colOut.b) * hot;
            this.col.set([this.colOut.r, this.colOut.g, this.colOut.b, 0, tr, tg, tb, a * 0.7], i * 8);
        }
        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.attributes.color.needsUpdate = true;
    }
}

// ---------- Hạt: tia lửa, bụi, tàn lửa ----------
export class Particles {
    constructor(scene) {
        GLOW ??= glowTexture(); DUST ??= dustTexture();
        this.scene = scene;
        this.list = [];
    }
    _sprite(tex, color, additive) {
        const m = new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, fog: false,
            blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
        const s = new THREE.Sprite(m);
        s.renderOrder = 60;
        this.scene.add(s);
        return s;
    }
    /** Loé + tia lửa văng ra tại điểm trúng */
    burst(at, color = 0xfff2c0, dir = 1, n = 14) {
        const flash = this._sprite(GLOW, color, true);
        flash.position.copy(at);
        this.list.push({ s: flash, life: 0.16, age: 0, size: [0.4, 1.5], vel: new THREE.Vector3(), g: 0 });
        const ring = this._sprite(GLOW, 0xffffff, true);
        ring.position.copy(at);
        this.list.push({ s: ring, life: 0.09, age: 0, size: [0.2, 0.8], vel: new THREE.Vector3(), g: 0 });
        for (let i = 0; i < n; i++) {
            const a = (Math.random() - 0.5) * 2.4;
            const sp = 3 + Math.random() * 5;
            const p = this._sprite(GLOW, color, true);
            p.position.copy(at);
            this.list.push({ s: p, life: 0.22 + Math.random() * 0.2, age: 0, size: [0.13, 0.02],
                vel: new THREE.Vector3(Math.cos(a) * sp * dir, Math.sin(a) * sp + 1.5, (Math.random() - 0.5) * 2), g: -14 });
        }
    }
    /** Bụi dưới chân (bước chạy, đáp đất, dậm) */
    dust(at, n = 4, spread = 1) {
        for (let i = 0; i < n; i++) {
            const p = this._sprite(DUST, 0xffffff, false);
            p.position.set(at.x + (Math.random() - 0.5) * 0.3 * spread, at.y + 0.05, at.z + (Math.random() - 0.5) * 0.2);
            this.list.push({ s: p, life: 0.45 + Math.random() * 0.25, age: 0, size: [0.25, 0.7 + Math.random() * 0.3],
                vel: new THREE.Vector3((Math.random() - 0.5) * 1.6 * spread, 0.5 + Math.random() * 0.4, 0), g: -0.6, fade: 0.55 });
        }
    }
    /** Tàn lửa / bụi băng bay lên từ lưỡi kiếm */
    ember(at, color) {
        const p = this._sprite(GLOW, color, true);
        p.position.copy(at);
        this.list.push({ s: p, life: 0.4 + Math.random() * 0.3, age: 0, size: [0.07, 0.01],
            vel: new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.6 + Math.random() * 0.6, 0), g: 0.3 });
    }
    update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const p = this.list[i];
            p.age += dt;
            const u = p.age / p.life;
            if (u >= 1) { this.scene.remove(p.s); p.s.material.dispose(); this.list.splice(i, 1); continue; }
            p.vel.y += p.g * dt;
            p.s.position.addScaledVector(p.vel, dt);
            const sz = p.size[0] + (p.size[1] - p.size[0]) * u;
            p.s.scale.set(sz, sz, 1);
            p.s.material.opacity = (p.fade ?? 1) * (1 - u * u);
        }
    }
}
