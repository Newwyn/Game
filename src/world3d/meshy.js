// (14/11/2026) Mô hình Meshy (dựng 3D từ tranh Codex vẽ — art/battle3d) dùng chung cho bản đồ thế giới + sân đấu.
//   File nằm ở src/assets/world3d/meshy/<tên>.glb, khoá mô hình 'meshy/<tên>' (assets.js chuẩn hoá: chân ở y = 0, cao 1).
//   Món nào chưa có file thì giữ kiểu cũ. Tắt để so: thêm ?meshy=0 vào địa chỉ trang.
const MESHY_GLB = import.meta.glob('../assets/world3d/meshy/*.glb', { query: '?url', import: 'default', eager: true });
export const MESHY_HAS = new Set(Object.keys(MESHY_GLB).map(k => k.match(/meshy\/([a-z0-9_]+)\.glb$/)?.[1]).filter(Boolean));
export const MESHY_ON = typeof location === 'undefined' || new URLSearchParams(location.search).get('meshy') !== '0';
/** Đặt mô hình Meshy `name` cao h ô (xoay r) nếu có file; cover = [x0,z0,x1,z1] chặn rải cây. Trả true nếu đã đặt. */
export function meshyPut(ctx, name, x, z, h, r = 0, cover = null) {
    if (!MESHY_ON || !MESHY_HAS.has(name)) return false;
    ctx.B.put('meshy/' + name, x, 0, z, r, h);
    if (cover) ctx.cover?.(...cover);
    return true;
}
