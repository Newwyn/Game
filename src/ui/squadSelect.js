// ============================================================
// CHỌN ĐỘI HÌNH TRƯỚC TRẬN — chọn 1 đến 4 nhân vật, bấm "Xác nhận" mới vào trận
// ============================================================
// Server gửi 'squadSelect' (sau khi chọn chế độ / bấm chơi lại) -> hiện bảng chọn.
//   Test / Đấu với quái : 1 bảng (đội của bạn)
//   Đấu với tướng      : 2 bảng 1P (bạn) và 2P (AI điều khiển)
// Bấm thẻ để chọn / bỏ chọn, nút "Bỏ chọn tất cả" xoá hết (cả 1P lẫn 2P), nhớ lựa chọn lần trước (server lưu).
// Phím: 1-9 chọn cho 1P, Enter = xác nhận.
import { socket } from '../net/socket.js';

const PORTRAITS = import.meta.glob('../assets/portraits/*.png', { eager: true, import: 'default' });
const portrait = (id) => PORTRAITS[`../assets/portraits/${id}.png`];
const RANK_COLORS = ['#94a3b8', '#60a5fa', '#c084fc', '#fbbf24'];
const MODE_TITLE = { test: '🧪 TEST · CHỌN ĐỘI HÌNH', duel_monster: '⚔️ ĐẤU VỚI QUÁI', duel_hero: '⚔️ ĐẤU VỚI TƯỚNG' };

let state = null;   // { heroes, sides: { p1:Set, p2:Set }, min, max, mode, dual }
let root = null;

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'squad-select';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    return root;
}

function grid(side, compact) {
    const { heroes, max } = state;
    const selected = state.sides[side];
    const n = selected.size;
    const order = heroes.filter(h => selected.has(h.id)).map(h => h.id);
    const cols = compact ? Math.min(heroes.length, 3) : Math.min(heroes.length, 5);
    return `<div class="ss-grid${compact ? ' compact' : ''}" style="grid-template-columns: repeat(${cols}, minmax(${compact ? 112 : 150}px, 1fr))">
        ${heroes.map((h, i) => {
            const on = selected.has(h.id);
            const full = !on && n >= max;
            return `
            <button class="ss-card${on ? ' on' : ''}${full ? ' full' : ''}" data-ss="${h.id}" data-side="${side}" style="--cc:${h.color}">
                ${side === 'p1' ? `<span class="ss-key">${i + 1}</span>` : ''}
                ${on ? `<span class="ss-check">✓ ${order.indexOf(h.id) + 1}</span>` : ''}
                <div class="ss-art">${portrait(h.id) ? `<img src="${portrait(h.id)}" alt="${h.name}" draggable="false">` : `<span class="ss-emoji">${h.emoji}</span>`}</div>
                <div class="ss-name">${h.emoji} ${h.name}</div>
                ${compact ? '' : `<div class="ss-title">${h.title}</div>`}
                <div class="ss-tags"><span>${h.className}</span>${compact ? '' : `<span>${h.raceEmoji} ${h.race}</span>`}</div>
                <div class="ss-lv">Lv ${h.level} <b style="color:${RANK_COLORS[h.rank]}">${h.rankName}</b></div>
                ${compact ? '' : `<div class="ss-stats"><span>❤ ${h.hp.toLocaleString()}</span><span>${h.dmgType === 'magic' ? '✦' : '⚔'} ${h.atk}</span></div>`}
            </button>`;
        }).join('')}
    </div>`;
}

function render() {
    const box = el();
    const { min, max, dual, mode } = state;
    const n1 = state.sides.p1.size, n2 = state.sides.p2.size;
    const ok = n1 >= min && (!dual || n2 >= min);
    const sub = mode === 'test' ? `Chọn ${min} – ${max} nhân vật ra trận`
        : mode === 'duel_monster' ? `Chọn ${min} – ${max} nhân vật · mọi nhân vật Lv60 SSS · quái Lv60 · không có tool`
        : `Mỗi bên ${min} – ${max} nhân vật · Lv60 SSS · 2P do AI điều khiển · không có tool`;
    box.innerHTML = `
    <div class="ss-box${dual ? ' dual' : ''}">
        <h2>${MODE_TITLE[mode] ?? 'CHỌN ĐỘI HÌNH'}</h2>
        <p class="ss-sub">${sub}</p>
        ${dual ? `
        <div class="ss-dual">
            <div class="ss-side p1"><div class="ss-side-h">🔵 1P <span>(bạn) · ${n1}/${max}</span></div>${grid('p1', true)}</div>
            <div class="ss-vs">VS</div>
            <div class="ss-side p2"><div class="ss-side-h">🔴 2P <span>(AI) · ${n2}/${max}</span></div>${grid('p2', true)}</div>
        </div>` : grid('p1', false)}
        <div class="ss-foot">
            <button class="ss-quick" data-ss-back>← Chọn chế độ</button>
            <span class="ss-count">${dual ? '' : `Đã chọn <b>${n1}</b> / ${max}`}</span>
            <button class="ss-quick" data-ss-clear ${n1 + (dual ? n2 : 0) ? '' : 'disabled'}>✕ Bỏ chọn tất cả</button>
            <button class="ss-go" data-ss-go ${ok ? '' : 'disabled'}>⚔️ ${mode === 'test' ? 'Xác nhận vào trận' : 'Vào đấu'}</button>
        </div>
        ${state.error ? `<div class="ss-err">${state.error}</div>` : ''}
    </div>`;
}

function toggle(side, id) {
    const selected = state.sides[side];
    if (selected.has(id)) selected.delete(id);
    else if (selected.size < state.max) selected.add(id);
    state.error = null;
    render();
}

function confirm() {
    if (!state) return;
    const { min, dual } = state;
    if (state.sides.p1.size < min || (dual && state.sides.p2.size < min)) return;
    // giữ thứ tự đội hình chuẩn của server (đứng trước / sau)
    const list = (side) => state.heroes.map(h => h.id).filter(id => state.sides[side].has(id));
    socket.emit('confirmSquad', { classes: list('p1'), enemyClasses: dual ? list('p2') : undefined });
    hide();
}

function onClick(e) {
    const card = e.target.closest('[data-ss]');
    if (card) return toggle(card.dataset.side ?? 'p1', card.dataset.ss);
    if (e.target.closest('[data-ss-clear]')) {
        state.sides.p1 = new Set();
        if (state.dual) state.sides.p2 = new Set();
        state.error = null;
        return render();
    }
    if (e.target.closest('[data-ss-back]')) { hide(); socket.emit('backToMenu'); return; }
    if (e.target.closest('[data-ss-go]')) confirm();
}

function onKey(e) {
    if (!state || !root || root.style.display === 'none') return;
    if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); confirm(); return; }
    const i = Number(e.key) - 1;
    if (i >= 0 && i < Math.min(9, state.heroes.length)) { e.preventDefault(); e.stopImmediatePropagation(); toggle('p1', state.heroes[i].id); }
}

function show(data) {
    state = {
        heroes: data.heroes, min: data.min ?? 1, max: data.max ?? 4, mode: data.mode ?? 'test', dual: !!data.dual, error: null,
        sides: { p1: new Set(data.selected), p2: new Set(data.enemySelected ?? data.selected) },
    };
    render();
    root.style.display = 'flex';
    document.body.classList.add('selecting-squad');
}

function hide() {
    if (root) root.style.display = 'none';
    document.body.classList.remove('selecting-squad');
}

export const isSquadSelectOpen = () => !!root && root.style.display !== 'none';

export function setupSquadSelect() {
    socket.on('squadSelect', show);
    socket.on('squadSelectError', (d) => { if (state) { state.error = d.text; render(); root.style.display = 'flex'; } });
    socket.on('countdown', hide);
    socket.on('mainMenu', hide);
    window.addEventListener('keydown', onKey, true);
}
