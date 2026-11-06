// ============================================================
// 📜 HỘI THOẠI CỐT TRUYỆN (P4) — khung thoại có chân dung người nói, bấm / Space để qua câu, nút "Bỏ qua"
//   playStory(lines, speakers, onDone, { bg }) — lines: [[người nói, lời], ...] (game/story.js)
// ============================================================
const PORTRAITS = import.meta.glob('../assets/portraits/*.png', { eager: true, import: 'default' });
const ART = import.meta.glob('../assets/world/*.webp', { eager: true, import: 'default' });

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
            <p>${text ?? ''}</p>
            <div class="st-foot"><span>${i + 1}/${lines.length}</span><span class="st-next">${i >= lines.length - 1 ? 'Xong ✓' : 'Tiếp ▶'}</span></div>
        </div>
    </div>
    <button class="st-skip" data-st-skip>Bỏ qua ⏭</button>`;
}
function next() {
    if (i < lines.length - 1) { i++; render(); } else finish();
}
function finish() {
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
