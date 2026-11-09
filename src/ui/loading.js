// ============================================================
// ⏳ MÀN TẢI TRƯỚC — lúc mở game: nạp + giải nén + đẩy sẵn mọi tranh lên card đồ hoạ (src/core/textures.js)
// Có thanh % ; tải xong tự ẩn. Vào trận sau đó không còn khựng vì tải tranh lần đầu.
// ============================================================
import { preloadAll } from '../core/textures.js';

/** tiến độ tải cho trang vào game (src/ui/landing.js): p 0..1, done */
export const loadState = { p: 0, msg: 'Đang tải…', done: false };

export function runLoadingScreen(renderer) {
    const el = document.createElement('div');
    el.id = 'loading-screen';
    el.innerHTML = `<div class="ld-box">
        <h1>LEGEND OF CAPSULES</h1>
        <div class="ld-bar"><i></i></div>
        <p class="ld-text">Đang tải…</p>
        <small>Lần đầu có thể mất vài giây — sau đó vào trận sẽ mượt.</small>
    </div>`;
    document.body.appendChild(el);
    const bar = el.querySelector('.ld-bar i'), text = el.querySelector('.ld-text');
    const t0 = performance.now();
    return preloadAll(renderer, (p, msg) => {
        loadState.p = p; loadState.msg = msg;
        bar.style.width = `${Math.round(p * 100)}%`;
        text.textContent = `${msg} ${Math.round(p * 100)}%`;
    }).catch(e => console.warn('preload', e)).finally(() => {
        console.info(`[loading] xong sau ${Math.round(performance.now() - t0)} ms`);
        loadState.done = true; loadState.p = 1;
        el.classList.add('done');
        setTimeout(() => el.remove(), 400);
    });
}
