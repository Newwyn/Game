// ============================================================
// INPUT — nút bấm trên HUD, phím tắt, kéo thả bảng debug
// ============================================================
// Thay cho onclick="..." trong HTML: mọi nút khai báo data-action / data-skill
// và được xử lý tập trung ở đây.
import { net } from '../net/socket.js';
import { resumeAudio } from '../audio/sfx.js';
import { hideBattleResult, isBattleResultOpen } from './overlays.js';
import { cameraRig } from '../core/cameraRig.js';
import { GAME_SPEEDS, timeState } from '../config.js';
import { toggleStatPanel, setAllStatPanels } from './hud.js';

// Tốc độ trận người chơi chọn (nhớ theo trình duyệt), gửi lên server mỗi khi vào trận
const SPEED_KEY = 'loc.gameSpeed';
let preferredSpeed = 1;
try { const v = Number(localStorage.getItem(SPEED_KEY)); if (GAME_SPEEDS.includes(v)) preferredSpeed = v; } catch { /* bỏ qua */ }

export function updateSpeedButton(speed = timeState.speed) {
    const btn = document.getElementById('btn-speed');
    if (btn) btn.textContent = `⏩ x${speed.toFixed(1)}`;
}

/** Gọi khi bắt đầu trận: áp tốc độ đã chọn */
export function applyPreferredSpeed() {
    net.setSpeed(preferredSpeed);
    updateSpeedButton(preferredSpeed);
}

const debugState = { noMana: false, godMode: false, auto: false };

function queueSkill(memberIndex, skillIndex) {
    net.queueSkill(memberIndex, skillIndex);
    resumeAudio(); // tận dụng thao tác người dùng để mở khoá âm thanh
}

function requestReset() {
    hideBattleResult();
    net.requestReset();
}

function setToggleLabel(id, on, label) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('active', on);
    btn.innerHTML = `${label}: ${on ? 'ON' : 'OFF'}`;
}

const ACTIONS = {
    toggleAuto: () => { debugState.auto = !debugState.auto; net.toggleAuto(debugState.auto); },
    togglePause: () => net.togglePause(),
    cycleSpeed: () => {
        const i = GAME_SPEEDS.indexOf(timeState.speed);
        preferredSpeed = GAME_SPEEDS[(i + 1) % GAME_SPEEDS.length];
        try { localStorage.setItem(SPEED_KEY, String(preferredSpeed)); } catch { /* bỏ qua */ }
        net.setSpeed(preferredSpeed);
        updateSpeedButton(preferredSpeed);
    },
    requestReset,
    fillMana: () => net.debugAction('fillMana'),
    toggleNoMana: () => {
        debugState.noMana = !debugState.noMana;
        setToggleLabel('btn-debug-no-mana', debugState.noMana, '✨ Dùng Skill Miễn Phí');
        net.debugAction('noMana', debugState.noMana);
    },
    toggleGodMode: () => {
        debugState.godMode = !debugState.godMode;
        setToggleLabel('btn-debug-god-mode', debugState.godMode, '🛡️ Bất Tử (Bỏ Qua Sát Thương)');
        net.debugAction('godMode', debugState.godMode);
    },
    spawnEnemy: (arg) => net.debugEnemyAction(arg),
    toggleMember: (classId) => net.debugAction('toggleMember', classId),
    toggleEnemyGod: () => {
        debugState.enemyGod = !debugState.enemyGod;
        setToggleLabel('btn-enemy-god', debugState.enemyGod, '🛡️ Quái Bất Tử');
        net.debugEnemyAction('godMode', debugState.enemyGod);
    },
};


// Kỹ năng ra lệnh bằng CLICK CHUỘT vào thẻ kỹ năng (cho mọi nhân vật) — không còn phím tắt số / chữ.
// (Game chiến thuật tự hành động: người chơi chỉ ra lệnh skill hoặc bật AUTO, không điều khiển di chuyển.)

function onKeyDown(e) {
    if (e.repeat) return; // giữ phím không xếp skill liên tục
    if (isBattleResultOpen() && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR')) {
        e.preventDefault();
        requestReset();
        return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') ACTIONS.togglePause();
    else if (e.code === 'KeyT') ACTIONS.cycleSpeed();
    // V: xem thử góc camera chéo (dành cho bản đồ thế giới sau này) <-> góc ngang khi combat
    else if (e.code === 'KeyV') cameraRig.setMode(cameraRig.getMode() === 'combat' ? 'explore' : 'combat');
}

function onClick(e) {
    const skillBtn = e.target.closest('[data-skill]');
    if (skillBtn) {
        const [m, s] = skillBtn.dataset.skill.split(',').map(Number);
        queueSkill(m, s);
        return;
    }
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) ACTIONS[actionBtn.dataset.action]?.(actionBtn.dataset.arg);
}

function makeDraggable(el) {
    let lastX = 0, lastY = 0;
    el.style.cursor = 'grab';
    el.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return; // bấm nút thì không kéo
        e.preventDefault();
        lastX = e.clientX; lastY = e.clientY;
        el.style.cursor = 'grabbing';
        const move = (ev) => {
            ev.preventDefault();
            const dx = ev.clientX - lastX, dy = ev.clientY - lastY;
            lastX = ev.clientX; lastY = ev.clientY;
            el.style.top = `${el.offsetTop + dy}px`;
            el.style.left = `${el.offsetLeft + dx}px`;
            el.style.right = 'auto';
            el.style.bottom = 'auto';
        };
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            el.style.cursor = 'grab';
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    });
}

// ------------------------------------------------------------
// Bật / tắt từng nhân vật ra trận (Công cụ Test) — mỗi nhân vật phe mình có 1 nút
// ------------------------------------------------------------
let memberDefs = null;
export function renderMemberToggles(classDefs, disabled = []) {
    if (classDefs) memberDefs = classDefs;
    const box = document.getElementById('member-toggles');
    if (!box || !memberDefs) return;
    const off = new Set(disabled);
    const heroes = Object.entries(memberDefs).filter(([id]) => !id.startsWith('monster_'));
    box.innerHTML = '<div class="mt-title">Nhân vật ra trận</div>' + heroes.map(([id, d]) => {
        const on = !off.has(id);
        return `<button class="debug-btn toggle${on ? ' active' : ' off'}" data-action="toggleMember" data-arg="${id}">${d.emoji ?? ''} ${d.name}${d.title ? ` (${d.title})` : ''}: ${on ? 'ON' : 'OFF'}</button>`;
    }).join('');
}

// ------------------------------------------------------------
// Phóng to / thu nhỏ các bảng test
// ------------------------------------------------------------
const SCALE_KEY = 'loc.panelScale';
let panelScale = {};
try { panelScale = JSON.parse(localStorage.getItem(SCALE_KEY) || '{}'); } catch { panelScale = {}; }
export function scaleButtonsHTML(id) {
    return `<span class="ui-scale-btns"><button class="stat-toggle" data-ui-scale="${id}" data-step="-1" title="Thu nhỏ">−</button><button class="stat-toggle" data-ui-scale="${id}" data-step="1" title="Phóng to">+</button></span>`;
}
function applyPanelScale(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const s = panelScale[id] ?? 1;
    el.style.transform = s === 1 ? '' : `scale(${s})`;
    el.style.transformOrigin = id.startsWith('right') || id.startsWith('enemy') ? 'top right' : 'top left';
}
function changePanelScale(id, step) {
    const s = Math.round(Math.min(1.5, Math.max(0.5, (panelScale[id] ?? 1) + step * 0.1)) * 10) / 10;
    panelScale[id] = s;
    try { localStorage.setItem(SCALE_KEY, JSON.stringify(panelScale)); } catch { /* bỏ qua */ }
    applyPanelScale(id);
}

export function setupInput() {
    document.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    // Lăn chuột để zoom camera
    document.getElementById('game-container')?.addEventListener('wheel', (e) => {
        e.preventDefault();
        cameraRig.zoomBy(e.deltaY > 0 ? 1.1 : 1 / 1.1);
    }, { passive: false });
    // Nút thu gọn bảng chỉ số: dùng pointerdown vì bảng được vẽ lại liên tục (click có thể bị mất)
    for (const id of ['left-stats', 'right-stats']) {
        document.getElementById(id)?.addEventListener('pointerdown', (e) => {
            const one = e.target.closest('[data-stat-toggle]');
            const all = e.target.closest('[data-stat-all]');
            if (!one && !all) return;
            e.preventDefault(); e.stopPropagation();
            if (one) toggleStatPanel(one.dataset.statToggle, one.dataset.statSide);
            else setAllStatPanels(all.dataset.statAll, all.dataset.all === '1');
        });
    }
    // Phóng to / thu nhỏ từng bảng (nhớ theo trình duyệt)
    for (const id of ['debug-controls', 'enemy-debug-controls', 'left-stats', 'right-stats']) applyPanelScale(id);
    document.addEventListener('pointerdown', (e) => {
        const b = e.target.closest('[data-ui-scale]');
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        changePanelScale(b.dataset.uiScale, Number(b.dataset.step));
    }, true);
    for (const id of ['debug-controls', 'enemy-debug-controls']) {
        const h3 = document.getElementById(id)?.querySelector('h3');
        if (h3) h3.insertAdjacentHTML('beforeend', scaleButtonsHTML(id));
    }
    // Bảng công cụ test: bấm tiêu đề để thu gọn / mở
    for (const id of ['debug-controls', 'enemy-debug-controls']) {
        const panel = document.getElementById(id);
        const title = panel?.querySelector('h3');
        if (!title) continue;
        title.classList.add('panel-title-toggle');
        title.addEventListener('click', (e) => { if (!e.target.closest('[data-ui-scale]')) panel.classList.toggle('panel-collapsed'); });
    }
    // Phím I: ẩn / hiện toàn bộ bảng chỉ số
    window.addEventListener('keydown', (e) => {
        if (e.code !== 'KeyI' || e.target.closest?.('input, textarea')) return;
        for (const id of ['left-stats', 'right-stats']) {
            const el = document.getElementById(id);
            if (el) el.style.visibility = el.style.visibility === 'hidden' ? '' : 'hidden';
        }
    });
    ['debug-controls', 'enemy-debug-controls', 'left-stats', 'right-stats'].forEach(id => {
        const el = document.getElementById(id);
        if (el) makeDraggable(el);
    });
}
