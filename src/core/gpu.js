// Máy / trình duyệt đang vẽ 3D bằng PHẦN MỀM (không dùng card đồ hoạ): Chrome tắt tăng tốc phần cứng, card lỗi driver…
// -> vẽ cực chậm (mỗi khung 200-300ms). Game tự giảm đồ hoạ: bản đồ phẳng 2D, trận đấu vẽ ít điểm ảnh hơn.
let cached = null;
export function softwareGL() {
    if (cached != null) return cached;
    try {
        const gl = document.createElement('canvas').getContext('webgl');
        const ext = gl?.getExtension('WEBGL_debug_renderer_info');
        const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
        cached = /basic render driver|swiftshader|llvmpipe|software|microsoft basic/i.test(name);
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch { cached = false; }
    return cached;
}
// trận đấu: máy vẽ phần mềm -> 0,6 điểm ảnh / điểm màn hình (nhẹ ~3 lần)
/** Đồ hoạ trận đấu người chơi chọn (Cài đặt): 'auto' = Tự động (mặc định), 'high' = Đẹp, 'low' = Nhẹ — lưu trong máy (localStorage 'gfx_battle') */
export function battleGfx() { try { const v = localStorage.getItem('gfx_battle'); return v === 'low' || v === 'high' ? v : 'auto'; } catch { return 'auto'; } }
// Tự động: bắt đầu nét như Đẹp; trận nào đo thấy giật thì hạ dần độ nét (nhớ trong lần chơi này, mở lại game thì đo lại)
let autoScale = 1;
export const battleAutoScale = () => autoScale;
/** Tự động: hạ 1 bậc độ nét (1 -> 0,85 -> 0,7). Trả true nếu đã hạ. */
export function battleAutoLower() {
    if (battleGfx() !== 'auto' || autoScale <= 0.71) return false;
    autoScale = Math.max(0.7, +(autoScale - 0.15).toFixed(2));
    return true;
}
// Nhẹ: vẽ 70% điểm ảnh (đỡ ~một nửa việc cho card đồ hoạ), nét hơi mềm hơn
export const battlePixelRatio = () => (softwareGL() ? 0.6 : battleGfx() === 'low' ? 0.7
    : battleGfx() === 'auto' ? Math.min(window.devicePixelRatio, 1.5) * autoScale : Math.min(window.devicePixelRatio, 1.5));

/**
 * Đo khung hình/giây để tự giảm đồ hoạ (trận đấu "Tự động"). Gọi sample(now) mỗi khung.
 *  - đo theo từng cửa sổ `windowMs` (3 giây); dưới `minFps` thì gọi onSlow(fps)
 *  - bỏ qua `settleMs` (2,5 giây) sau khi vừa vào trận / bị khựng (2 khung cách nhau > `gapMs`) / tab ẩn
 */
export function createFpsWatch(onSlow, { windowMs = 3000, settleMs = 2500, gapMs = 250, minFps = 40 } = {}) {
    const w = { t0: 0, n: 0, last: 0, skipUntil: 0, lastFps: 0 };
    w.sample = (now, hidden = false) => {
        const gap = now - w.last;
        w.last = now;   // luôn ghi lại (kể cả lúc đang chờ) — nếu không, hết lúc chờ lại tưởng "bị khựng" và chờ mãi
        if (hidden) { w.t0 = 0; return; }
        if (gap > gapMs) { w.t0 = 0; w.skipUntil = now + settleMs; return; }
        if (now < w.skipUntil) { w.t0 = 0; return; }
        if (!w.t0) { w.t0 = now; w.n = 0; return; }
        w.n++;
        if (now - w.t0 < windowMs) return;
        const fps = w.n * 1000 / (now - w.t0);
        w.t0 = 0; w.lastFps = Math.round(fps);
        if (fps < minFps && onSlow(fps)) w.skipUntil = now + 1500;   // vừa giảm -> chờ chút rồi đo tiếp
    };
    return w;
}
