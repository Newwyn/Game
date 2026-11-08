// Ảnh đại diện (icon vẽ bằng AI) cho tài nguyên, nguyên liệu, vật phẩm nhiệm vụ, ô trang bị, nút chức năng
//   src/assets/icons/<mã>.webp (128px) — thiếu ảnh thì hiện biểu tượng chữ (emoji) thay thế
const ICONS = import.meta.glob('../assets/icons/*.webp', { eager: true, import: 'default' });
export const iconUrl = (key) => ICONS[`../assets/icons/${key}.webp`] ?? null;
/** <img> icon, hoặc emoji dự phòng */
export function icon(key, fallback = '❔', cls = 'ic') {
    const url = iconUrl(key);
    return url ? `<img class="${cls}" src="${url}" alt="" draggable="false">` : `<span class="${cls} ic-emoji">${fallback}</span>`;
}
