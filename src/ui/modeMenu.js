// ============================================================
// MÀN HÌNH CHỌN CHẾ ĐỘ — lúc mới vào game / bấm 🏠 Menu
// ============================================================
//   🧪 Test : đánh quái, có Tool Phe Mình / Phe Quái, nhân vật theo level / bậc đang có
//   ⚔️ Đấu  : không có tool, mọi nhân vật Lv60 SSS
//        - Đấu với quái : đội của bạn vs 3 quái mặc định (Lv60)
//        - Đấu với tướng: chọn đội 1P (bạn) và 2P (AI) rồi đấu
import { net, socket } from '../net/socket.js';
import { showCampaign, openWorldHub } from './campaign.js';

let account = null;
export function unlockText(feature) {
    const entry = account?.unlocks?.find(u => u.feature === feature);
    return entry ? `Mở ở cấp tài khoản ${entry.level}` : 'Đang tải cấp mở khóa…';
}
const pvpOpen = () => !!account && account.level >= (account.unlocks.find(u => u.feature === 'pvp')?.level ?? Infinity);
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
        if (m.startsWith('duel') && !pvpOpen()) return;
        if (m === 'duel') { step = 'duel'; render(); return; }
        if (m === 'back') { step = 'main'; render(); return; }
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
    return `<button class="mm-card ${cls}" data-mode="${mode}" ${mode.startsWith('duel') && !pvpOpen() ? 'disabled aria-disabled="true"' : ''}><span class="mm-icon">${icon}</span><b>${title}</b><small>${desc}</small></button>`;
}

// 🧪 Thử nhanh (cho người thử game): đặt cấp tài khoản · nhảy tới ải (kèm cấp đội hợp lý) · chơi lại từ đầu
const JUMPS = [['Ải 1', 0, 1], ['Ải 5', 4, 6], ['Ải 7', 6, 9], ['Ải 11', 10, 12], ['Ải 12', 11, 13], ['Ải 18', 17, 17], ['Ải 20', 19, 19], ['Ch2 · Ải 1', 20, 21], ['Ch2 · Ải 20', 39, 39]];
let resetArmed = false, resetTimer = null, testMsg = null;
function testStrip() {
    const seg = (pt, v, t, on = false) => `<button class="mm-t${on ? ' on' : ''}" data-mt="${pt}" data-v="${v}">${t}</button>`;
    return `<div class="mm-test">
        <div class="mm-test-row"><b>🧪 Thử nhanh</b><span>Cấp tài khoản <b>${account?.level ?? '?'}</b></span>
            ${[1, 10, 20, 25, 60].map(l => seg('acc', l, l, account?.level === l)).join('')}</div>
        <div class="mm-test-row"><span>Nhảy tới</span>${JUMPS.map(([t, up, lv], i) => seg('jump', i, t)).join('')}
            ${resetArmed ? `${seg('resetGo', 1, '⚠️ Bấm lần nữa để XOÁ HẾT')}${seg('resetNo', 1, 'Huỷ')}` : seg('reset', 1, '🔄 Chơi lại từ đầu')}</div>
        ${testMsg ? `<div class="mm-test-msg">${testMsg}</div>` : ''}
    </div>`;
}
function onTest(b) {
    const { mt, v } = b.dataset;
    if (mt === 'acc') socket.emit('debugAccount', { level: Number(v) });
    else if (mt === 'jump') { const [, upTo, level] = JUMPS[Number(v)]; socket.emit('debugCampaign', { upTo, level }); }
    else if (mt === 'reset') { resetArmed = true; render(); clearTimeout(resetTimer); resetTimer = setTimeout(() => { resetArmed = false; render(); }, 8000); }
    else if (mt === 'resetNo') { resetArmed = false; render(); }
    else if (mt === 'resetGo') { resetArmed = false; clearTimeout(resetTimer); testMsg = '⏳ Đang xoá tiến trình…'; render(); socket.emit('debugReset'); }
}

function render() {
    const box = el();
    box.innerHTML = step === 'main' ? `
    <div class="mm-box">
        <h1>LEGEND OF CAPSULES</h1>
        <p>Chọn chế độ</p>
        <div class="mm-row">
            ${card('campaign', '📖', 'Cốt truyện', 'Chương 1: Ngọn Lửa Dưới Thánh Huy · vượt ải nhận thưởng, mở khoá tính năng & anh hùng', 'campaign')}
            ${card('test', '🧪', 'Test', 'Đánh quái · có tool tăng cấp, bất tử, skill miễn phí… để thử nhân vật', 'test')}
            ${card('duel', pvpOpen() ? '⚔️' : '🔒', 'Đấu', pvpOpen() ? 'Không có tool · mọi nhân vật Lv60 SSS' : unlockText('pvp'), 'duel')}
        </div>
        ${testStrip()}
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
    socket.on('progressMsg', (m) => { testMsg = `${m.ok ? '✅' : '⚠️'} ${m.text}`; if (root?.style.display !== 'none') render(); setTimeout(() => { testMsg = null; if (root?.style.display !== 'none') render(); }, 5000); });
    socket.on('debugResetDone', () => location.reload());
    socket.on('squadSelect', hide);
    socket.on('campaignState', hide);
}
