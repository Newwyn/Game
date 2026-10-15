// ============================================================
// THANH MÁU / THANH VẬN CHIÊU TRÊN ĐẦU NHÂN VẬT
// ============================================================
import * as THREE from 'three';

export function createBarSprite(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(1.5, 0.18, 1);
    sprite.userData = { canvas, ctx, texture, color, lastPct: -1 };
    updateBarSprite(sprite, 1);
    return sprite;
}

/** mark: vạch NGƯỠNG TỬ (Ấn Tử của Zerith) tại tỉ lệ máu `mark` (0 = không vẽ) */
export function updateBarSprite(sprite, percent, mark = 0) {
    const { ctx, texture, color } = sprite.userData;
    const pct = Math.max(0, Math.min(1, percent || 0));
    // Chỉ vẽ lại khi giá trị đổi (tránh upload texture lên GPU 20 lần/giây vô ích)
    if (Math.abs(pct - sprite.userData.lastPct) < 0.002 && mark === (sprite.userData.lastMark ?? 0)) return;
    sprite.userData.lastPct = pct;
    sprite.userData.lastMark = mark;
    ctx.clearRect(0, 0, 128, 16);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, 128, 16);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, 128, 16);
    ctx.fillStyle = color;
    ctx.fillRect(2, 2, 124 * pct, 12);
    if (mark > 0) {
        // vùng dưới ngưỡng tử tô tím mờ + vạch đỏ tía nổi bật
        const x = 2 + 124 * mark;
        ctx.fillStyle = 'rgba(168,85,247,0.35)'; ctx.fillRect(2, 2, x - 2, 12);
        ctx.fillStyle = '#ff1f6b'; ctx.fillRect(x - 1.5, 0, 3, 16);
        ctx.fillStyle = '#fff'; ctx.fillRect(x - 0.5, 1, 1, 14);
    }
    texture.needsUpdate = true;
}
