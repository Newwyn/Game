// ============================================================
// FLIPBOOK — hiệu ứng chạy khung dùng chung cho MỌI nhân vật
// ============================================================
// Atlas + json do tools/fx_grid_pack.py tạo: { size: [W, H], groups: { tên: { size, pivot, frames: [[x,y,w,h]...], tip? } } }
//   const FB = makeFlipbook(urlAtlas, meta);
//   const m = FB.frames('boom', 2.4);      // mặt phẳng cao 2.4 đơn vị, pivot của nhóm ở gốc toạ độ
//   FB.set(m, 3);                          // đổi sang khung 3 (cùng nhóm cùng cỡ -> chỉ đổi texture)
//   const d = FB.decal('circle', x, z, r); // hình nằm trên mặt đất
// Hình vẽ chế độ THƯỜNG (giữ màu đậm trên nền cỏ sáng); quầng sáng phụ vẽ cộng sáng bằng fxPlane() của vfx.js.
import * as THREE from 'three';
import { textureView } from './texView.js';

export const FLOOR = -0.45;

const ALL = [];   // mọi flipbook đã tạo (để tải sẵn atlas lên card đồ hoạ lúc vào trận — warmFlipbooks)

export function makeFlipbook(url, meta) {
    let base = null;
    const cache = {};
    function tex(group, i = 0) {
        const key = group + '#' + i;
        if (cache[key]) return cache[key];
        base ??= new THREE.TextureLoader().load(url, t => { t.colorSpace = THREE.SRGBColorSpace; });
        base.colorSpace = THREE.SRGBColorSpace;
        const [W, H] = meta.size;
        const [x, y, w, h] = meta.groups[group].frames[i];
        const t = textureView(base);   // không tải lại atlas lên GPU (xem texView.js)
        t.repeat.set(w / W, h / H);
        t.offset.set(x / W, 1 - (y + h) / H);
        return (cache[key] = t);
    }
    const count = (group) => meta.groups[group].frames.length;
    /** Mặt phẳng hiện nhóm khung `group`, cao `height` đơn vị, pivot của nhóm nằm ở gốc toạ độ */
    function frames(group, height, { additive = false, opacity = 1, frame = 0 } = {}) {
        const g = meta.groups[group];
        if (!g) throw new Error('flipbook: không có nhóm ' + group);
        const [w, h] = g.size, [px, py] = g.pivot, u = height / h;
        const geo = new THREE.PlaneGeometry(w * u, h * u);
        geo.translate((w / 2 - px) * u, (py - h / 2) * u, 0);
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
            map: tex(group, frame), transparent: true, depthWrite: false, fog: false, opacity,
            blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide }));
        m.userData.sharedTexture = true;
        m.userData.fx = { group, frame, u };
        return m;
    }
    /** Đổi khung (giới hạn trong nhóm) */
    function set(mesh, i) {
        const d = mesh.userData.fx;
        i = Math.max(0, Math.min(count(d.group) - 1, i | 0));
        if (i !== d.frame) { d.frame = i; mesh.material.map = tex(d.group, i); }
    }
    /** Hình nằm trên mặt đất: rộng 2r theo x, sâu 1.5r theo z (tranh vẽ elip dẹt; camera nhìn xiên ép lại thành elip) */
    function decal(group, x, z, r, { lift = 0.04, opacity = 1 } = {}) {
        const g = meta.groups[group];
        const aspect = g.size[0] / g.size[1];
        const m = frames(group, 1, { opacity });
        m.rotation.x = -Math.PI / 2;
        m.position.set(x, FLOOR + lift, z);
        m.scale.set(2 * r / aspect, 1.5 * r, 1);
        return m;
    }
    const fb = { tex, count, frames, set, decal, meta, base: () => { tex(Object.keys(meta.groups)[0]); return base; } };
    ALL.push(fb);
    return fb;
}

/** Tải sẵn mọi atlas hiệu ứng lên card đồ hoạ (gọi lúc dựng trận, trong lúc đếm ngược). Không tải sẵn thì lần ĐẦU một kỹ năng
 *  hiện hiệu ứng, cả atlas 4096×1024 (~16 MB + mipmap) mới được tải lên giữa trận -> khựng 1 nhịp. */
export function warmFlipbooks(renderer) {
    for (const fb of ALL) {
        const b = fb.base();
        if (b?.image?.complete !== false && b?.image) renderer.initTexture(b);
    }
}

/** Khung lặp theo thời gian t (giây), `fps` khung/giây, n khung, lệch pha `phase` khung */
export const loopFrame = (t, fps, n, phase = 0) => Math.floor(t * fps + phase) % n;
/** Khung theo tiến độ p (0..1), mỗi khung có trọng số thời lượng */
export function weighted(p, weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    for (let i = 0; i < weights.length; i++) { acc += weights[i] / sum; if (p < acc) return i; }
    return weights.length - 1;
}
/** Hiện dần trong a, tắt dần sau b (p = 0..1) */
export const fadeInOut = (p, a = 0.1, b = 0.8) => (p < a ? p / a : p > b ? (1 - p) / (1 - b) : 1);
