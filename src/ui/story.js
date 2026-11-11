// ============================================================
// 📜 HỘI THOẠI CỐT TRUYỆN (P4) — khung thoại có chân dung người nói, bấm / Space để qua câu, nút "Bỏ qua"
//   playStory(lines, speakers, onDone, { bg }) — lines: [[người nói, lời], ...] (game/story.js)
// ============================================================
const PORTRAITS = import.meta.glob('../assets/portraits/*.png', { eager: true, import: 'default' });
const ART = import.meta.glob('../assets/world/*.webp', { eager: true, import: 'default' });
const HERO = import.meta.glob('../assets/overworld/*.webp', { eager: true, import: 'default' });
import { tierPortrait } from '../characters/sprite/tiers.js';

let root = null, lines = [], speakers = {}, i = 0, done = null;

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'story-screen';
    document.body.appendChild(root);
    root.addEventListener('click', (e) => {
        if (e.target.closest('[data-st-skip]')) { skipped = true; return finish(); }
        next();
    });
    window.addEventListener('keydown', (e) => {
        if (root.style.display !== 'flex') return;
        if ([' ', 'Enter', 'ArrowRight', 'e', 'E'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); next(); }
        if (e.key === 'Escape') finish();
    }, true);
    return root;
}
function face(sp) {
    // nhân vật chính: dáng đứng nhìn thẳng trong bộ tranh đi bộ Nam / Nữ
    if (sp?.me) return `<span class="st-hero" style="background-image:url(${HERO[`../assets/overworld/hero_${sp.gender === 'f' ? 'f' : 'm'}.webp`]})"></span>`;
    // NPC chỉ có tranh đi bộ (3 cột x 4 hàng): lấy dáng đứng nhìn thẳng
    if (sp?.sheet && HERO[`../assets/overworld/${sp.sheet}.webp`]) return `<span class="st-hero" style="background-image:url(${HERO[`../assets/overworld/${sp.sheet}.webp`]})"></span>`;
    const tp = sp?.portrait && tierPortrait(sp.portrait);   // anh hùng: hình đúng bậc S / SS của bạn
    if (tp) return `<img src="${tp}" alt="">`;
    if (sp?.portrait && PORTRAITS[`../assets/portraits/${sp.portrait}.png`]) return `<img src="${PORTRAITS[`../assets/portraits/${sp.portrait}.png`]}" alt="">`;
    if (sp?.art && ART[`../assets/world/npc_${sp.art}.webp`]) return `<img class="npc" src="${ART[`../assets/world/npc_${sp.art}.webp`]}" alt="">`;
    return `<span>${sp?.emoji ?? '💬'}</span>`;
}
function render() {
    const [who, text] = lines[i] ?? [];
    const sp = speakers[who] ?? { name: who };
    const sys = who === 'sys';
    root.innerHTML = `
    <div class="st-box${sys ? ' sys' : ''}">
        ${sys ? '' : `<div class="st-face">${face(sp)}</div>`}
        <div class="st-body">
            ${sys ? '' : `<b>${sp.name}</b>`}
            <p class="st-text"></p>
            <div class="st-foot"><span>${i + 1}/${lines.length}</span><span class="st-next">${i >= lines.length - 1 ? 'Xong ✓' : 'Tiếp ▶'}</span></div>
        </div>
    </div>
    <button class="st-skip" data-st-skip>Bỏ qua ⏭</button>`;
    typeText(text ?? '');
}
// chữ hiện dần (tốc độ chọn ở ⚙️ Cài đặt trên bản đồ: localStorage 'st_speed')
const SPEED = { slow: 28, normal: 55, fast: 110, instant: 0 };   // ký tự / giây
let typing = null;
function typeText(full) {
    clearInterval(typing?.timer);
    const p = root.querySelector('.st-text');
    let speed = SPEED.normal;
    try { speed = SPEED[localStorage.getItem('st_speed')] ?? SPEED.normal; } catch { /* bỏ qua */ }
    if (!speed) { p.textContent = full; typing = null; return; }
    const chars = [...full];
    let n = 0;
    typing = { full, timer: setInterval(() => {
        n = Math.min(chars.length, n + Math.max(1, Math.round(speed / 30)));
        p.textContent = chars.slice(0, n).join('');
        if (n >= chars.length) { clearInterval(typing.timer); typing = null; }
    }, 1000 / 30) };
}
function next() {
    if (typing) {   // đang hiện chữ: bấm lần đầu thì hiện hết câu
        clearInterval(typing.timer);
        root.querySelector('.st-text').textContent = typing.full;
        typing = null;
        return;
    }
    if (i < lines.length - 1) { i++; render(); } else finish();
}
function finish() {
    clearInterval(typing?.timer); typing = null;
    if (root) root.style.display = 'none';
    const cb = done; done = null;
    cb?.();
}

// tranh nền cho lời thoại TRƯỚC ải (không thì sau khung thoại lộ cảnh trận cũ còn đứng hình)
const MAPS = import.meta.glob('../assets/maps/*.webp', { eager: true, import: 'default' });
const C1_BG = [null, 'village_street', 'outskirts_field', 'outskirts_forest', 'outskirts_mine', 'outskirts_forest', 'road_outpost', 'outskirts_forest', 'outskirts_forest',
    'village_square', 'outskirts_mine', 'road_bridge', 'road_outpost', 'capital_market', 'capital_market', 'capital_gate', 'capital_library', 'capital_castle', 'capital_castle', 'capital_gate', 'capital_castle'];
/** Tranh nền theo tên (src/assets/world/<tên>.webp) — cắt cảnh "về báo lại" (game/world.js REPORTS.cutscene) */
export const worldArt = (name) => ART[`../assets/world/${name}.webp`] ?? null;
/** Cắt cảnh nhiều đoạn: segs = [[tên tranh, từ câu thứ mấy], …] — mỗi đoạn phát với tranh nền riêng kín màn */
export function playCutscene(list, segs, sp, onDone) {
    const parts = (segs ?? []).map(([bg, from], i) => ({ bg: worldArt(bg) ?? 'dark', lines: list.slice(from, segs[i + 1]?.[1] ?? list.length) })).filter(p => p.lines.length);
    const next = (k) => (k >= parts.length ? onDone?.() : playStory(parts[k].lines, sp, () => (skipped ? onDone?.() : next(k + 1)), { bg: parts[k].bg }));
    next(0);
}
// 🎨 Tranh minh hoạ theo ĐOẠN TRUYỆN (có nhân vật, kiểu tranh Elise bên giường vua): src/assets/story/<khoá>.webp
//   khoá: c1_wake (tỉnh dậy ở miếu) · c1_07_pre / c1_07_post (trước / sau ải 7)… Có tranh thì dùng thay tranh phong cảnh.
const STORY_ART = import.meta.glob('../assets/story/*.webp', { eager: true, import: 'default' });
export const storyArt = (key) => STORY_ART[`../assets/story/${key}.webp`] ?? null;
const artKey = (id, phase) => `${String(id ?? '').replace('-', '_')}_${phase}`;
/** Ải -> ảnh nền (c1-05 -> rừng, c2-15 -> Lunaria…); phase 'pre' | 'post': có tranh minh hoạ riêng thì ưu tiên */
export function stageBackdrop(id, phase = 'pre') {
    const own = storyArt(artKey(id, phase));
    if (own) return own;
    const m = /^c(\d)-(\d+)/.exec(id ?? '');
    if (m?.[1] === '1') return ART[`../assets/world/${C1_BG[+m[2]] ?? 'village_square'}.webp`];
    if (m?.[1] === '2') return MAPS[`../assets/maps/${+m[2] <= 12 ? 'sylvaren' : 'lunaria'}.webp`];
    return ART['../assets/world/village_square.webp'];
}

/** Phát một đoạn hội thoại; không có câu nào thì gọi onDone ngay.
 *  bg: đường dẫn ảnh nền (che cảnh phía sau) · 'dark' = nền tối kín · bỏ trống = làm mờ cảnh đang có */
let skipped = false;   // lần phát gần nhất kết thúc bằng nút "Bỏ qua" (cắt cảnh nhiều đoạn bỏ luôn các đoạn sau)
export function playStory(list, sp, onDone, { dim = true, bg = null } = {}) {
    skipped = false;
    if (!list?.length) { onDone?.(); return; }
    el();
    lines = list; speakers = sp ?? {}; i = 0; done = onDone;
    root.classList.toggle('dim', dim);
    root.classList.toggle('st-bg', !!bg);
    root.style.backgroundImage = !bg ? '' : bg === 'dark'
        ? 'radial-gradient(circle at 50% 35%, #1e1b4b, #020617 70%)'
        : `linear-gradient(to top, rgba(2, 6, 23, .9), rgba(2, 6, 23, .25) 60%), url("${bg}")`;
    root.style.display = 'flex';
    render();
}
export const storyPlaying = () => root?.style.display === 'flex';
