// ============================================================
// 📜 HỘI THOẠI CỐT TRUYỆN (P4) — khung thoại có chân dung người nói, bấm / Space để qua câu, nút "Bỏ qua"
//   playStory(lines, speakers, onDone, { bg }) — lines: [[người nói, lời], ...] (game/story.js)
// ============================================================
const PORTRAITS = import.meta.glob('../assets/portraits/*.png', { eager: true, import: 'default' });
const ART = import.meta.glob('../assets/world/*.webp', { eager: true, import: 'default' });
const HERO = import.meta.glob('../assets/overworld/*.webp', { eager: true, import: 'default' });

let root = null, lines = [], speakers = {}, i = 0, done = null;

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'story-screen';
    document.body.appendChild(root);
    root.addEventListener('click', (e) => {
        if (e.target.closest('[data-st-skip]')) return finish();
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

/** Phát một đoạn hội thoại; không có câu nào thì gọi onDone ngay */
export function playStory(list, sp, onDone, { dim = true } = {}) {
    if (!list?.length) { onDone?.(); return; }
    el();
    lines = list; speakers = sp ?? {}; i = 0; done = onDone;
    root.classList.toggle('dim', dim);
    root.style.display = 'flex';
    render();
}
export const storyPlaying = () => root?.style.display === 'flex';
