// ============================================================
// MÀN HÌNH CHỌN CHẾ ĐỘ — lúc mới vào game / bấm 🏠 Menu
// ============================================================
//   🧪 Test (11/2026: thẻ Đấu bỏ khỏi màn đầu, chuyển vào trong Test — Đấu luôn mở ở đây):
//      - Đấu Tập : đánh quái, có Tool Phe Mình / Phe Quái, nhân vật theo level / bậc đang có
//      - Đấu PVP : không có tool, mọi nhân vật Lv60 SSS
//        - Đấu với quái : đội của bạn vs 3 quái mặc định (Lv60)
//        - Đấu với tướng: chọn đội 1P (bạn) và 2P (AI) rồi đấu
import { net, socket } from '../net/socket.js';
import { showCampaign, openWorldHub, suppressForfeitResult } from './campaign.js';

let account = null;
export function unlockText(feature) {
    const entry = account?.unlocks?.find(u => u.feature === feature);
    return entry ? `Mở ở cấp tài khoản ${entry.level}` : 'Đang tải cấp mở khóa…';
}
let root = null;
let step = 'main';
let returnCtx = null;          // ngữ cảnh quay lại khi mở từ trận/bản đồ/chọn ải; null lúc mới vào game
let battleLive = false;
let pendingLeaveMode = null;
let leavingBattleForMode = false;
let keyBound = false;

export function isModeMenuOpen() {
    return !!root && root.style.display !== 'none';
}
export function isBattleLive() {
    return battleLive;
}

function returnFromMenu() {
    if (!returnCtx) return;
    const ctx = returnCtx;
    returnCtx = null;
    pendingLeaveMode = null;
    hide();
    ctx.onReturn?.();
}

function enterMode(m) {
    const fromBattle = battleLive || returnCtx?.source === 'battle';
    pendingLeaveMode = null;
    returnCtx = null;
    hide();
    const go = () => {
        if (m === 'campaign') { openWorldHub(); return; }
        if (m === 'practice') { net.chooseMode('test'); return; }
        net.chooseMode(m);
    };
    if (!fromBattle) {
        go();
        return;
    }
    battleLive = false;
    leavingBattleForMode = true;
    suppressForfeitResult(true);
    socket.once('mainMenu', go);
    net.backToMenu();
}

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'mode-menu';
    document.body.appendChild(root);
    root.addEventListener('click', (e) => {
        if (e.target.closest('[data-mm-leave]')) {
            if (pendingLeaveMode) enterMode(pendingLeaveMode);
            return;
        }
        const stayEl = e.target.closest('[data-mm-stay]');
        if (stayEl) {
            if (stayEl.classList.contains('mm-confirm-backdrop') && e.target !== stayEl) return;
            pendingLeaveMode = null;
            render();
            return;
        }
        if (e.target.closest('[data-mm-return]')) {
            returnFromMenu();
            return;
        }
        const t = e.target.closest('[data-mt]');
        if (t) return onTest(t);
        const b = e.target.closest('[data-mode]');
        if (!b) return;
        const m = b.dataset.mode;
        if (m === 'test') { step = 'test'; render(); return; }      // Test -> chọn Đấu Tập / Đấu PVP
        if (m === 'duel') { step = 'duel'; render(); return; }
        if (m === 'back') { step = step === 'duel' ? 'test' : 'main'; render(); return; }
        if (battleLive) {
            pendingLeaveMode = m;
            render();
            return;
        }
        enterMode(m);
    });
    return root;
}

function onMenuKeyDown(e) {
    if (!isModeMenuOpen() || e.repeat) return;
    if (e.code !== 'Escape') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (pendingLeaveMode) {
        pendingLeaveMode = null;
        render();
        return;
    }
    if (returnCtx) {
        returnFromMenu();
        return;
    }
    if (step !== 'main') {
        step = step === 'duel' ? 'test' : 'main';
        render();
    }
}

function card(mode, icon, title, desc, cls = '') {
    return `<button class="mm-card ${cls}" data-mode="${mode}"><span class="mm-icon">${icon}</span><b>${title}</b><small>${desc}</small></button>`;
}

// 🧪 Thử nhanh: dải nút cũ (cấp tài khoản · nhảy ải · chơi lại) nay gom vào 🧪 Tool thử (src/ui/testHub.js) — ở đây chỉ còn 1 nút mở.
// (class mm-test: server chính ẩn nút này — src/styles/landing.css)
const testStrip = () => '<div class="mm-test"><button class="mm-t" data-mt="hub">🧪 Mở Tool thử <small>phím `</small></button></div>';
const returnStrip = () => (returnCtx
    ? '<div class="mm-return"><button class="mm-t mm-ret" data-mm-return="1">↩ Quay lại <small>Esc</small></button></div>'
    : '');
const leaveModal = () => (pendingLeaveMode ? `
<div class="mm-confirm-backdrop" data-mm-stay="1">
    <div class="mm-confirm-box" role="dialog" aria-modal="true" aria-labelledby="mm-confirm-title">
        <h2 id="mm-confirm-title">Rời trận đang đánh?</h2>
        <p>Trận đấu hiện tại đang diễn ra. Nếu chọn chế độ mới, trận đang đánh sẽ kết thúc.</p>
        <div class="mm-confirm-actions">
            <button class="mm-c-btn stay" data-mm-stay="1">Ở lại</button>
            <button class="mm-c-btn leave" data-mm-leave="1">Rời trận</button>
        </div>
    </div>
</div>` : '');
function onTest() { window.dispatchEvent(new CustomEvent('open-test-hub')); }

function render() {
    const box = el();
    const ret = returnStrip();
    const main = step === 'main' ? `
    <div class="mm-box">
        <h1>LEGEND OF CAPSULES</h1>
        <p>Chọn chế độ</p>
        <div class="mm-row">
            ${card('campaign', '📖', 'Cốt truyện', 'Chương 1: Ngọn Lửa Dưới Thánh Huy · vượt ải nhận thưởng, mở khoá tính năng & anh hùng', 'campaign')}
            ${card('test', '🧪', 'Test', 'Đấu Tập (có tool thử nhân vật) hoặc Đấu PVP', 'test')}
        </div>
        <div class="mm-pills">${ret}${testStrip()}</div>
    </div>` : step === 'test' ? `
    <div class="mm-box">
        <h1>🧪 TEST</h1>
        <p>Chọn kiểu đấu</p>
        <div class="mm-row">
            ${card('practice', '🧪', 'Đấu Tập', 'Đánh quái · có tool tăng cấp, bất tử, skill miễn phí… để thử nhân vật', 'test')}
            ${card('duel', '⚔️', 'Đấu PVP', 'Đấu với quái / đấu với tướng · không có tool · mọi nhân vật Lv60 SSS', 'duel')}
        </div>
        <div class="mm-nav"><button class="mm-back" data-mode="back">← Quay lại</button>${ret}</div>
    </div>` : `
    <div class="mm-box">
        <h1>⚔️ ĐẤU</h1>
        <p>Mọi nhân vật Lv60 SSS · không có tool</p>
        <div class="mm-row">
            ${card('duel_monster', '👹', 'Đấu với quái', 'Đội của bạn (1–4 người) vs 3 quái mặc định Lv60', 'duel')}
            ${card('duel_hero', '🆚', 'Đấu với tướng', 'Chọn đội 1P (bạn) và 2P (AI tự đánh) rồi vào đấu', 'duel')}
        </div>
        <div class="mm-nav"><button class="mm-back" data-mode="back">← Quay lại</button>${ret}</div>
    </div>`;
    box.innerHTML = main + leaveModal();
}

export function openModeMenu(ctx = null) {
    returnCtx = ctx;
    pendingLeaveMode = null;
    step = 'main';
    render();
    el().style.display = 'flex';
    document.body.classList.add('selecting-squad');
}

export function showModeMenu() {
    openModeMenu(null);
}
function hide() {
    if (root) root.style.display = 'none';
}

export function setupModeMenu() {
    if (!keyBound) {
        keyBound = true;
        window.addEventListener('keydown', onMenuKeyDown, true);
    }
    for (const event of ['progressUpdate', 'campaignState', 'stageResult', 'heroPanel', 'gearState', 'extrasState']) socket.on(event, data => { if (data.account) { account = data.account; if (root?.style.display !== 'none') render(); } });
    socket.on('battleStart', (d) => {
        if (d && d.mode !== 'menu') battleLive = true;
        pendingLeaveMode = null;
        if (isModeMenuOpen()) {
            returnCtx = null;
            hide();
            document.body.classList.remove('selecting-squad');
        }
    });
    socket.on('battleEnd', () => {
        battleLive = false;
        pendingLeaveMode = null;
        if (isModeMenuOpen()) render();
    });
    socket.on('mainMenu', () => {
        battleLive = false;
        pendingLeaveMode = null;
        if (leavingBattleForMode) {
            leavingBattleForMode = false;
            return;
        }
        showModeMenu();
    });
    socket.on('squadSelect', () => {
        battleLive = false;
        returnCtx = null;
        pendingLeaveMode = null;
        hide();
    });
    socket.on('campaignState', () => {
        if (isModeMenuOpen()) {
            returnCtx = null;
            pendingLeaveMode = null;
            hide();
        }
    });
}
