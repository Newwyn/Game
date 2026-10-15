// Cài đặt người chơi (lưu theo trình duyệt)
const KEY = 'loc.settings';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { saved = {}; }
export const settings = { shake: true, ...saved };
export function setSetting(k, v) {
    settings[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* bỏ qua */ }
}
