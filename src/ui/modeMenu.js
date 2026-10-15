// ============================================================
// MÀN HÌNH CHỌN CHẾ ĐỘ — lúc mới vào game / bấm 🏠 Menu
// ============================================================
//   🧪 Test : đánh quái, có Tool Phe Mình / Phe Quái, nhân vật theo level / bậc đang có
//   ⚔️ Đấu  : không có tool, mọi nhân vật Lv60 SSS
//        - Đấu với quái : đội của bạn vs 3 quái mặc định (Lv60)
//        - Đấu với tướng: chọn đội 1P (bạn) và 2P (AI) rồi đấu
import { net, socket } from '../net/socket.js';

let root = null;
let step = 'main';

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'mode-menu';
    document.body.appendChild(root);
    root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-mode]');
        if (!b) return;
        const m = b.dataset.mode;
        if (m === 'duel') { step = 'duel'; render(); return; }
        if (m === 'back') { step = 'main'; render(); return; }
        hide();
        net.chooseMode(m);
    });
    return root;
}

function card(mode, icon, title, desc, cls = '') {
    return `<button class="mm-card ${cls}" data-mode="${mode}"><span class="mm-icon">${icon}</span><b>${title}</b><small>${desc}</small></button>`;
}

function render() {
    const box = el();
    box.innerHTML = step === 'main' ? `
    <div class="mm-box">
        <h1>LEGEND OF CAPSULES</h1>
        <p>Chọn chế độ</p>
        <div class="mm-row">
            ${card('test', '🧪', 'Test', 'Đánh quái · có tool tăng cấp, bất tử, skill miễn phí… để thử nhân vật', 'test')}
            ${card('duel', '⚔️', 'Đấu', 'Không có tool · mọi nhân vật Lv60 SSS', 'duel')}
        </div>
    </div>` : `
    <div class="mm-box">
        <h1>⚔️ ĐẤU</h1>
        <p>Mọi nhân vật Lv60 SSS · không có tool</p>
        <div class="mm-row">
            ${card('duel_monster', '👹', 'Đấu với quái', 'Đội của bạn (1–4 người) vs 3 quái mặc định Lv60', 'duel')}
            ${card('duel_hero', '🆚', 'Đấu với tướng', 'Chọn đội 1P (bạn) và 2P (AI tự đánh) rồi vào đấu', 'duel')}
        </div>
        <button class="mm-back" data-mode="back">← Quay lại</button>
    </div>`;
}

function show() {
    step = 'main';
    render();
    el().style.display = 'flex';
    document.body.classList.add('selecting-squad');
}
function hide() {
    if (root) root.style.display = 'none';
}

export function setupModeMenu() {
    socket.on('mainMenu', show);
    socket.on('squadSelect', hide);
}
