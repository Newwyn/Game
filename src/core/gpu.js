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
export const battlePixelRatio = () => (softwareGL() ? 0.6 : Math.min(window.devicePixelRatio, 1.5));
