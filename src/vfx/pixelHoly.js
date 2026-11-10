// ============================================================
// Hiệu ứng điểm ảnh (pixel art vẽ bằng code) của thư viện pixelfx (Patch, MIT — src/vendor/pixelfx/LICENSE)
//   https://patch.gg/patch/pixel-effects · github.com/patch-gg/pixelfx
// Dùng cho kỹ năng của Seraphine (thử nghiệm 11/2026): Divine Shield -> Khiên Ánh Sáng · Blessing -> Thánh Niệm.
// Mỗi hiệu ứng vẽ vào khung điểm ảnh nhỏ (vài chục px) theo từng nhịp, rồi hiện lên 2 tấm phẳng trong cảnh 3D:
//   lớp SAU nhân vật ('back') và lớp TRƯỚC ('front'), phóng to giữ nét điểm ảnh (NearestFilter).
// "Người đứng giữa" của hiệu ứng = hình bóng thật của nhân vật (khung đứng trong atlas, thu nhỏ còn ~44 px cao)
//   -> hạt sáng đậu đúng lên đầu / vai, viền sáng ôm đúng dáng.
// Tắt: ?seraFx=old (dùng lại hiệu ứng cũ).
// ============================================================
import * as THREE from 'three';
import { createFrame, clearFrame, createFx, composite } from '../vendor/pixelfx/core/index.js';
import * as blessing from '../vendor/pixelfx/fx/holy/blessing.js';
import * as divineShield from '../vendor/pixelfx/fx/holy/divine-shield.js';

export const PIXEL_HOLY = typeof location === 'undefined' || new URLSearchParams(location.search).get('seraFx') !== 'old';

const ACTOR_H = 44;   // chiều cao người đứng giữa trong khung điểm ảnh (bằng nhân vật mẫu của thư viện)
const EFFECTS = { shield: divineShield, bless: blessing };
const actorCache = new WeakMap();

/** Hình bóng nhân vật cho pixelfx: { mask:{w,h,data}, pixels (ABGR), x, y, w, h, head, chest } — chân ở (0, 0) */
function actorOf(view) {
    const sp = view?.sprite;
    const f = sp?.meta?.frames?.idle1 ?? sp?.meta?.frames?.[Object.keys(sp?.meta?.frames ?? {})[0]];
    const img = view?._spTex?.image;   // atlas của khung đang dùng (FrameSpriteView)
    if (!f || !img || !(img.naturalWidth || img.width)) return null;
    const hit = actorCache.get(view);
    if (hit?.img === img) return hit.A;
    const [sx, sy, sw, sh] = f.rect;
    const k = ACTOR_H / sh, w = Math.max(4, Math.round(sw * k)), h = ACTOR_H;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const data = new Uint8Array(w * h), pixels = new Uint32Array(w * h);
    for (let i = 0; i < w * h; i++) {
        if (d[i * 4 + 3] < 128) continue;
        data[i] = 1;
        pixels[i] = ((255 << 24) | (d[i * 4 + 2] << 16) | (d[i * 4 + 1] << 8) | d[i * 4]) >>> 0;
    }
    const ox = Math.round((f.org?.[0] ?? sw / 2) * k);
    const A = { mask: { w, h, data }, pixels, x: -ox, y: -h, w, h, k: 2, head: [0, -h], chest: [0, -Math.round(h * 0.6)] };
    actorCache.set(view, { img, A });
    return A;
}

function layerMesh(tex, order) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
    m.renderOrder = order;
    return m;
}

/**
 * 1 hiệu ứng điểm ảnh gắn vào nhân vật: { group, update(dt, on, camera), dispose() }.
 * kind: 'shield' | 'bless'. height: chiều cao nhân vật (đơn vị thế giới) -> cỡ 1 điểm ảnh.
 */
export function makePixelHoly(kind, view, height = 2.9) {
    const mod = EFFECTS[kind];
    const [W, H] = mod.meta.size, [OX, OY] = mod.meta.origin;
    const pad = 6, fw = W + pad * 2, fh = H + pad * 2;
    // khung đặt sao cho gốc hiệu ứng (chân nhân vật) = (0, 0) của thế giới điểm ảnh
    const frames = { back: createFrame(fw, fh, -OX - pad, -OY - pad), front: createFrame(fw, fh, -OX - pad, -OY - pad) };
    const canv = {}, tex = {}, img = {};
    for (const L of ['back', 'front']) {
        canv[L] = document.createElement('canvas'); canv[L].width = fw; canv[L].height = fh;
        img[L] = new ImageData(fw, fh);
        tex[L] = new THREE.CanvasTexture(canv[L]);
        tex[L].magFilter = tex[L].minFilter = THREE.NearestFilter;
        tex[L].generateMipmaps = false;
        tex[L].colorSpace = THREE.SRGBColorSpace;
    }
    const group = new THREE.Group();
    const back = layerMesh(tex.back, 1), front = layerMesh(tex.front, 3);
    const u = height / ACTOR_H;   // cỡ 1 điểm ảnh trong thế giới
    for (const m of [back, front]) {
        m.scale.set(fw * u, fh * u, 1);
        // tâm tấm so với chân: tấm rộng fw, gốc nằm ở (OX + pad) từ trái, (OY + pad) từ trên
        m.position.set((fw / 2 - OX - pad) * u, (OY + pad - fh / 2) * u, 0);
    }
    back.position.z = -0.25; front.position.z = 0.35;
    group.add(back, front);
    let fx = null, k = 0, actorTried = false;
    const start = () => {
        const actor = actorOf(view);
        actorTried = !!actor;
        fx = createFx(mod, { x: 0, y: 0, seed: (view?.member?.index ?? 0) * 13 + 7, ...(actor ? { actor } : {}) });
    };
    return {
        group,
        update(dt, on) {
            if (on && (!fx || fx.done())) start();
            if (on && fx && !actorTried && actorOf(view)) start();   // atlas vừa tải xong -> làm lại với hình bóng thật
            if (!on && fx) fx.stop();
            k += ((on ? 1 : 0) - k) * Math.min(1, dt * 6);
            group.visible = !!fx && !fx.done();
            if (!group.visible) { if (fx?.done()) fx = null; return; }
            fx.update(dt);
            for (const L of ['back', 'front']) {
                const f = clearFrame(frames[L]);
                fx.draw(f, L);
                composite(f, img[L].data, null);
                canv[L].getContext('2d').putImageData(img[L], 0, 0);
                tex[L].needsUpdate = true;
            }
            back.material.opacity = front.material.opacity = Math.min(1, k * 1.5);
        },
        dispose() {
            for (const L of ['back', 'front']) tex[L].dispose();
            back.geometry.dispose(); back.material.dispose(); front.geometry.dispose(); front.material.dispose();
        },
    };
}
