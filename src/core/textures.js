// ============================================================
// KHO TEXTURE DÙNG CHUNG — mọi tranh nhân vật / hiệu ứng nạp qua đây (1 URL = 1 texture, 1 lần lên card đồ hoạ)
//   getTexture(url, { pixel })  -> THREE.Texture (dùng ngay; ảnh nạp xong tự cập nhật)
//   preloadAll(renderer, onProgress) -> Promise: nạp + giải nén mọi tranh trong src/assets/sprites, rồi đẩy dần lên card đồ hoạ
//     (mỗi khung hình 1 tấm) -> vào trận không còn khựng vì tải tranh lần đầu.
// ============================================================
import * as THREE from 'three';

const cache = new Map();
const loader = new THREE.TextureLoader();

export function getTexture(url, { pixel = false } = {}) {
    let tex = cache.get(url);
    if (!tex) {
        tex = loader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        cache.set(url, tex);
    }
    if (pixel && !tex.userData.pixel) {   // tranh pixel: ô vuông sắc nét, không mipmap
        tex.userData.pixel = true;
        tex.magFilter = tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
    }
    return tex;
}

const SPRITES = import.meta.glob('../assets/sprites/*.{webp,png}', { eager: true, import: 'default' });
const OTHER = import.meta.glob('../assets/{world,portraits,ui,icons,maps,overworld,skills}/*.{webp,png}', { eager: true, import: 'default' });
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));

/** Nạp trước toàn bộ tranh. onProgress(phần 0..1, chữ) */
export async function preloadAll(renderer, onProgress = () => {}) {
    const spriteUrls = [...new Set(Object.values(SPRITES))];
    const otherUrls = [...new Set(Object.values(OTHER))];
    const total = spriteUrls.length * 2 + otherUrls.length;
    let done = 0;
    const tick = (text) => onProgress(Math.min(1, ++done / total), text);
    // 1) tải + giải nén (song song): tranh nhân vật / hiệu ứng thành texture, tranh giao diện chỉ cần trình duyệt giữ sẵn
    const texs = await Promise.all(spriteUrls.map(url => new Promise(res => {
        const tex = getTexture(url);
        const finish = () => { tick('Đang tải hình nhân vật & hiệu ứng…'); res(tex); };
        if (tex.image?.complete && tex.image.naturalWidth) finish();
        else {
            const img = tex.image ?? null;
            if (img) { img.addEventListener('load', finish, { once: true }); img.addEventListener('error', finish, { once: true }); }
            else { const t = setInterval(() => { if (tex.image?.complete) { clearInterval(t); finish(); } }, 50); }
        }
    })));
    await Promise.all(otherUrls.map(url => new Promise(res => {
        const img = new Image();
        img.onload = img.onerror = () => { (img.decode?.() ?? Promise.resolve()).catch(() => {}).finally(() => { tick('Đang tải bản đồ & chân dung…'); res(); }); };
        img.src = url;
    })));
    // 2) đẩy dần lên card đồ hoạ: mỗi khung hình 1 tấm (trang không bị đơ, thanh tiến độ vẫn chạy)
    for (const [i, tex] of texs.entries()) {
        // tấm "khung xương" (*_atlas.png) chỉ dùng khi xem bản cắt mảnh -> không chiếm card đồ hoạ
        const gpu = !/_atlas\.png$/.test(spriteUrls[i]);
        try { if (gpu && tex.image) renderer.initTexture(tex); } catch (e) { console.warn('initTexture', e); }
        tick('Đang chuẩn bị đồ hoạ…');
        await nextFrame();
    }
}
