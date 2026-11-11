// ============================================================
// MÀN HÌNH CHỌN CHẾ ĐỘ — lúc mới vào game / bấm 🏠 Menu
// ============================================================
//   🧪 Test (11/2026: thẻ Đấu bỏ khỏi màn đầu, chuyển vào trong Test — Đấu luôn mở ở đây):
//      - Đấu Tập : đánh quái, có Tool Phe Mình / Phe Quái, nhân vật theo level / bậc đang có
//      - Đấu PVP : không có tool, mọi nhân vật Lv60 SSS
//        - Đấu với quái : đội của bạn vs 3 quái mặc định (Lv60)
//        - Đấu với tướng: chọn đội 1P (bạn) và 2P (AI) rồi đấu
import { net, socket } from '../net/socket.js';
import { showCampaign, openWorldHub } from './campaign.js';

let account = null;
export function unlockText(feature) {
    const entry = account?.unlocks?.find(u => u.feature === feature);
    return entry ? `Mở ở cấp tài khoản ${entry.level}` : 'Đang tải cấp mở khóa…';
}
let root = null;
let step = 'main';

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'mode-menu';
    document.body.appendChild(root);
    root.addEventListener('click', (e) => {
        const t = e.target.closest('[data-mt]');
        if (t) return onTest(t);
        const b = e.target.closest('[data-mode]');
        if (!b) return;
        const m = b.dataset.mode;
        if (m === 'test') { step = 'test'; render(); return; }      // Test -> chọn Đấu Tập / Đấu PVP
        if (m === 'duel') { step = 'duel'; render(); return; }
        if (m === 'back') { step = step === 'duel' ? 'test' : 'main'; render(); return; }
        if (m === 'practice') { hide(); net.chooseMode('test'); return; }   // Đấu Tập = Test như cũ
        if (m === 'campaign') {   // Cốt truyện: vào bản đồ thế giới (nơi xuất phát), từ đó chọn ải / trang bị
            hide();
            openWorldHub();
            return;
        }
        hide();
        net.chooseMode(m);
    });
    return root;
}

function card(mode, icon, title, desc, cls = '') {
    return `<button class="mm-card ${cls}" data-mode="${mode}"><span class="mm-icon">${icon}</span><b>${title}</b><small>${desc}</small></button>`;
}

// 🧪 Thử nhanh: dải nút cũ (cấp tài khoản · nhảy ải · chơi lại) nay gom vào 🧪 Tool thử (src/ui/testHub.js) — ở đây chỉ còn 1 nút mở.
// (class mm-test: server chính ẩn nút này — src/styles/landing.css)
const testStrip = () => '<div class="mm-test"><button class="mm-t" data-mt="hub">🧪 Mở Tool thử <small>phím `</small></button></div>';
function onTest() { window.dispatchEvent(new CustomEvent('open-test-hub')); }

function render() {
    const box = el();
    box.innerHTML = step === 'main' ? `
    <div class="mm-box">
        <h1>LEGEND OF CAPSULES</h1>
        <p>Chọn chế độ</p>
        <div class="mm-row">
            ${card('campaign', '📖', 'Cốt truyện', 'Chương 1: Ngọn Lửa Dưới Thánh Huy · vượt ải nhận thưởng, mở khoá tính năng & anh hùng', 'campaign')}
            ${card('test', '🧪', 'Test', 'Đấu Tập (có tool thử nhân vật) hoặc Đấu PVP', 'test')}
        </div>
        ${testStrip()}
    </div>` : step === 'test' ? `
    <div class="mm-box">
        <h1>🧪 TEST</h1>
        <p>Chọn kiểu đấu</p>
        <div class="mm-row">
            ${card('practice', '🧪', 'Đấu Tập', 'Đánh quái · có tool tăng cấp, bất tử, skill miễn phí… để thử nhân vật', 'test')}
            ${card('duel', '⚔️', 'Đấu PVP', 'Đấu với quái / đấu với tướng · không có tool · mọi nhân vật Lv60 SSS', 'duel')}
        </div>
        <button class="mm-back" data-mode="back">← Quay lại</button>
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

export function showModeMenu() {
    step = 'main';
    render();
    el().style.display = 'flex';
    document.body.classList.add('selecting-squad');
}
function hide() {
    if (root) root.style.display = 'none';
}

export function setupModeMenu() {
    for (const event of ['progressUpdate', 'campaignState', 'stageResult', 'heroPanel', 'gearState', 'extrasState']) socket.on(event, data => { if (data.account) { account = data.account; if (root?.style.display !== 'none') render(); } });
    socket.on('mainMenu', showModeMenu);
    socket.on('squadSelect', hide);
    socket.on('campaignState', hide);
}
