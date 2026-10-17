// ============================================================
// DÂY LIÊN KẾT của Rok (thiên phú Ý Chí Thép): sợi xích ánh sáng vàng nối Rok với đồng đội ATK cao nhất
// ============================================================
// Vẽ bằng code: chuỗi đốm sáng dọc một đường cong võng nhẹ (ngang ngực 2 người), các đốm chạy từ Rok sang người được nối.
// Tạm thời — khi có tranh hiệu ứng riêng sẽ thay.
import * as THREE from 'three';
import { glowTexture, addAnim, fxPlane } from './vfx.js';

const N = 18;
export function makeRokTether() {
    const g = new THREE.Group();
    const mat = () => new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd36b, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const dots = Array.from({ length: N }, () => { const sp = new THREE.Sprite(mat()); g.add(sp); return sp; });
    // 2 vòng sáng ở 2 đầu dây
    const ends = [0, 1].map(() => { const sp = new THREE.Sprite(mat()); sp.material.color.set(0xfff0b8); g.add(sp); return sp; });
    let t = 0, k = 0;
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    return {
        group: g,
        /** pa, pb: vị trí chân 2 người; ya, yb: độ cao ngực; on: dây còn (mờ dần khi đứt) */
        update(dt, pa, pb, ya, yb, on = true) {
            t += dt;
            k += ((on ? 1 : 0) - k) * Math.min(1, dt * (on ? 4 : 8));
            a.set(pa.x, ya, (pa.z ?? 0) + 0.2);
            b.set(pb.x, yb, (pb.z ?? 0) + 0.2);
            const len = a.distanceTo(b);
            const sag = Math.min(0.9, len * 0.06);
            dots.forEach((d, i) => {
                const u = ((i / N) + t * 0.45) % 1;   // các đốm chạy từ Rok sang người được nối
                d.position.lerpVectors(a, b, u);
                d.position.y -= Math.sin(u * Math.PI) * sag;
                const pulse = 0.7 + 0.3 * Math.sin(t * 8 + i * 1.7);
                d.scale.setScalar(0.32 * pulse);
                d.material.opacity = k * 0.85 * Math.sin(u * Math.PI) ** 0.35;
            });
            ends[0].position.copy(a); ends[1].position.copy(b);
            ends.forEach((e, i) => { e.scale.setScalar(0.65 + 0.12 * Math.sin(t * 5 + i)); e.material.opacity = k * 0.8; });
            return k;
        },
        dispose() { g.parent?.remove(g); dots.concat(ends).forEach(d => d.material.dispose()); },
    };
}

/** Kiên Cường: đòn đánh vào người được nối dây -> 1 khối sáng chạy dọc dây về Rok (from, to: view) */
export function spawnLinkPulse(from, to) {
    const m = fxPlane(glowTexture(), 0.9, 0.9, { color: 0xffd36b });
    const yA = (from._lift ?? 0) + (from._hover ?? 0) + 0.9, yB = (to._lift ?? 0) + 0.9;   // cùng độ cao với dây (battleScene)
    addAnim(m, 0.28, (p, fx) => {
        const a = from.position, b = to.position;
        const len = Math.hypot(b.x - a.x, (b.z ?? 0) - (a.z ?? 0));
        fx.mesh.position.set(a.x + (b.x - a.x) * p, yA + (yB - yA) * p - Math.sin(p * Math.PI) * Math.min(0.9, len * 0.06), (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * p + 0.4);
        fx.mesh.scale.setScalar(1 + 0.4 * Math.sin(p * Math.PI));
        fx.mesh.material.opacity = p > 0.8 ? (1 - p) / 0.2 : 1;
    });
}
