// Cài đặt người chơi (lưu theo trình duyệt)
const KEY = 'loc.settings';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { saved = {}; }
const migratedPaper = saved.paperHeroes !== undefined ? !!saved.paperHeroes
    : (saved.rokPaper !== undefined ? !!saved.rokPaper : true);
const hadLegacyRokPaper = 'rokPaper' in saved;
const { rokPaper: _legacyRokPaper, ...restSaved } = saved;
export const FX_LEVELS = ['soft', 'minimal', 'full'];
export const settings = { shake: true, fxLevel: 'soft', ...restSaved, paperHeroes: migratedPaper };
if (hadLegacyRokPaper) {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* bỏ qua */ }
}
export function fxScale() {
    return settings.fxLevel === 'minimal' ? 0.32 : settings.fxLevel === 'soft' ? 0.58 : 1;
}
export function setSetting(k, v) {
    settings[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* bỏ qua */ }
    if (typeof window !== 'undefined' && window.dispatchEvent && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('setting-change', { detail: { k, v } }));
    }
}
