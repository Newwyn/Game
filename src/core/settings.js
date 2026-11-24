// Cài đặt người chơi (lưu theo trình duyệt)
const KEY = 'loc.settings';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { saved = {}; }
export const FX_LEVELS = ['soft', 'minimal', 'full'];
export const settings = { shake: true, fxLevel: 'soft', charTop: true, ...saved };
/** (23/11) Nhân vật nổi trên hiệu ứng: thứ tự vẽ mặt đất -> hiệu ứng (vòng, lửa, khói, khiên...) -> NHÂN VẬT -> loé trúng đòn -> số / thanh máu */
export const CHAR_LAYER = 20, CHAR_FRONT_FX = 26, CHAR_BAR = 27;
export function fxScale() {
    return settings.fxLevel === 'minimal' ? 0.32 : settings.fxLevel === 'soft' ? 0.58 : 1;
}
export function setSetting(k, v) {
    settings[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* bỏ qua */ }
}
