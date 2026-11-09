// ============================================================
// 🧪 BẢNG TOOL THỬ — chỉ ở Server test (body.srv-test, chọn ở trang vào game src/ui/landing.js)
//   Nút 🧪 nổi bên trái (phím ` để bật/tắt), dùng được MỌI LÚC: bản đồ, bảng ải, trong trận.
//   5 ngăn: 📖 Ải · 🦸 Nhân vật · 🎒 Đồ & tiền · ⚔️ Trận · 🗺️ Bản đồ
//   Server: testCatalog -> testCatalogResult (danh sách ải, nhân vật, vật phẩm, bộ đồ, khu bản đồ)
//           testTool { op, ... } -> testToolResult { ok, text } (+ gửi lại tiến trình / bảng ải / bản đồ)
// ============================================================
import { socket, net } from '../net/socket.js';
import { hideWorld, worldOpen } from './world.js';
import '../styles/testPanel.css';

const TABS = [['stage', '📖', 'Ải'], ['hero', '🦸', 'Nhân vật'], ['items', '🎒', 'Đồ & tiền'], ['battle', '⚔️', 'Trận'], ['map', '🗺️', 'Bản đồ']];
const RANKS = ['Thường', 'S', 'SS', 'SSS'];
const LS = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } } };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let fab = null, panel = null, open = false;
let tab = LS.get('tp.tab') ?? 'stage';
let chapter = LS.get('tp.ch') ?? 'c1';
let cat = null;                 // testCatalogResult
let msg = null, msgTimer = null;
let resetArmed = false, resetTimer = null;
let god = false, noMana = false;
let heroes = null;              // progressUpdate.heroes (cấp / bậc hiện tại)
let inBattle = false;
let focusAfterJump = null;      // ải vừa nhảy tới -> mở bảng ải khoanh ải đó

const tool = (op, extra = {}) => { socket.emit('testTool', { op, ...extra }); flash('⏳ Đang làm…', true); };

function flash(text, ok = true) {
    msg = { text, ok }; clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { msg = null; renderMsg(); }, 6000);
    renderMsg();
}
function renderMsg() {
    const m = panel?.querySelector('.tp-msg');
    if (m) { m.textContent = msg?.text ?? ''; m.className = `tp-msg${msg ? (msg.ok ? ' ok' : ' bad') : ''}`; }
}

function openBoard(stageId) {
    if (inBattle) return flash('Đang trong trận — đánh xong rồi mở bảng ải nhé', false);
    if (worldOpen()) hideWorld();
    document.querySelector('#mode-menu')?.style.setProperty('display', 'none');
    net.campaignOpen(stageId ? stageId.slice(0, 2) : chapter);
    if (stageId) {   // bảng ải hiện xong -> khoanh ải vừa nhảy tới
        const t0 = performance.now();
        const look = () => {
            const card = document.querySelector(`[data-cp-stage="${stageId}"]`);
            if (card) { card.classList.add('cp-focus'); card.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
            if (performance.now() - t0 < 4000) setTimeout(look, 150);
        };
        setTimeout(look, 200);
    }
}

// ---------- các ngăn ----------
function stageTab() {
    const chs = cat?.chapters ?? [];
    const ch = chs.find(c => c.id === chapter) ?? chs[0];
    if (!ch) return `<p class="tp-empty">Đang tải danh sách ải… (cần máy chủ có Server test)</p>`;
    return `
    <div class="tp-seg">${chs.map(c => `<button class="tp-b${c.id === ch.id ? ' on' : ''}" data-tp="ch" data-v="${esc(c.id)}">${esc(c.name)}</button>`).join('')}</div>
    <p class="tp-hint">Bấm 1 ải = nhảy tới ải đó (các ải trước coi như đã qua) rồi mở Bảng ải để vào đánh ngay.</p>
    <div class="tp-grid">${ch.stages.map(s => `<button class="tp-st" data-tp="jump" data-v="${esc(s.id)}" title="${esc(s.name)}"><b>${s.no}</b><small>${esc(s.name)}</small></button>`).join('')}</div>
    <div class="tp-row">
        <button class="tp-b main" data-tp="unlockCh" data-v="${esc(ch.id)}">🔓 Mở hết ${esc(ch.name.split(':')[0])} (cả Khó, Địa ngục, nhánh)</button>
        <button class="tp-b" data-tp="board">📖 Mở Bảng ải</button>
    </div>
    <div class="tp-row">
        ${resetArmed ? `<button class="tp-b danger" data-tp="resetGo">⚠️ Bấm lần nữa để XOÁ HẾT tiến trình test</button><button class="tp-b" data-tp="resetNo">Huỷ</button>`
            : `<button class="tp-b" data-tp="reset">🔄 Chơi lại từ đầu (xoá tiến trình test)</button>`}
    </div>`;
}
function heroTab() {
    const list = cat?.heroes ?? [];
    return `
    <div class="tp-sec"><h4>Cả đội</h4>
        <div class="tp-row"><label>Cấp <input type="number" min="1" max="60" value="${LS.get('tp.lv') ?? 60}" data-in="allLv"></label>
            <button class="tp-b main" data-tp="allLv">Đặt cấp tất cả</button></div>
        <div class="tp-seg">${RANKS.map((r, i) => `<button class="tp-b" data-tp="allRank" data-v="${i}">Bậc ${r}</button>`).join('')}</div>
        <div class="tp-row"><button class="tp-b" data-tp="ownAll">🦸 Có đủ mọi anh hùng</button>
            <button class="tp-b" data-tp="preset" data-v="1,0">Lv1</button><button class="tp-b" data-tp="preset" data-v="40,1">Lv40 S</button>
            <button class="tp-b" data-tp="preset" data-v="60,2">Lv60 SS</button><button class="tp-b" data-tp="preset" data-v="60,3">Lv60 SSS</button></div>
    </div>
    <div class="tp-sec"><h4>Từng người</h4>
        ${list.length ? list.map(h => { const cur = heroes?.[h.id]; return `<div class="tp-hero">
            <span class="tp-hn">${esc(h.name)}${cur ? ` <small>Lv${cur.level} · ${RANKS[cur.rank] ?? ''}</small>` : ''}</span>
            <input type="number" min="1" max="60" value="${cur?.level ?? 1}" data-in="lv-${esc(h.id)}" aria-label="Cấp ${esc(h.name)}">
            <select data-in="rk-${esc(h.id)}" aria-label="Bậc ${esc(h.name)}">${RANKS.map((r, i) => `<option value="${i}"${(cur?.rank ?? 0) === i ? ' selected' : ''}>${r}</option>`).join('')}</select>
            <button class="tp-b" data-tp="hero" data-v="${esc(h.id)}">Đặt</button></div>`; }).join('') : '<p class="tp-empty">Đang tải…</p>'}
    </div>`;
}
function itemsTab() {
    const opt = (arr, sel) => (arr ?? []).map(o => typeof o === 'object' ? `<option value="${esc(o.id)}"${o.id === sel ? ' selected' : ''}>${esc(o.name)}</option>` : `<option value="${esc(o)}"${o === sel ? ' selected' : ''}>${esc(o)}</option>`).join('');
    return `
    <div class="tp-sec"><h4>Tiền & thể lực</h4>
        <div class="tp-row">
            <button class="tp-b" data-tp="wallet" data-v="gold:10000">+10.000 🪙</button>
            <button class="tp-b" data-tp="wallet" data-v="diamond:1000">+1.000 💎</button>
            <button class="tp-b" data-tp="wallet" data-v="stone:100">+100 🔷</button>
            <button class="tp-b" data-tp="stamina">⚡ Đầy thể lực</button>
        </div>
    </div>
    <div class="tp-sec"><h4>Cấp tài khoản (mở chức năng)</h4>
        <div class="tp-seg">${[1, 3, 6, 10, 12, 15, 18, 20, 25, 60].map(l => `<button class="tp-b" data-tp="acc" data-v="${l}">${l}</button>`).join('')}</div>
    </div>
    <div class="tp-sec"><h4>Vật phẩm</h4>
        <div class="tp-row"><select data-in="item">${opt(cat?.items)}</select>
            <input type="number" min="1" max="999" value="10" data-in="itemN" aria-label="Số lượng">
            <button class="tp-b main" data-tp="item">Nhận</button></div>
    </div>
    <div class="tp-sec"><h4>Trang bị</h4>
        <div class="tp-row"><select data-in="gSet" aria-label="Bộ đồ">${opt(cat?.gearSets)}</select>
            <select data-in="gSlot" aria-label="Món"><option value="">Cả bộ</option>${opt(cat?.gearSlots)}</select></div>
        <div class="tp-row"><label>Cấp đồ <input type="number" min="1" max="60" value="${LS.get('tp.glv') ?? 10}" data-in="gLv"></label>
            <select data-in="gRar" aria-label="Độ hiếm">${opt(cat?.rarities)}</select>
            <button class="tp-b main" data-tp="gear">Nhận đồ</button></div>
    </div>
    <div class="tp-sec"><h4>Sổ chứng cứ</h4><button class="tp-b" data-tp="evidence">🔎 Có đủ mọi chứng cứ</button></div>`;
}
function battleTab() {
    return `
    <p class="tp-hint">${inBattle ? 'Đang trong trận — áp ngay.' : 'Chưa trong trận: bật Bất tử trước rồi vào đánh cũng được.'}</p>
    <div class="tp-row">
        <button class="tp-b main" data-tp="win">🏆 Thắng ngay</button>
        <button class="tp-b danger" data-tp="lose">💀 Thua ngay</button>
    </div>
    <div class="tp-row">
        <button class="tp-b${god ? ' on' : ''}" data-tp="god">🛡️ Bất tử: ${god ? 'BẬT' : 'tắt'}</button>
        <button class="tp-b${noMana ? ' on' : ''}" data-tp="noMana">💧 Kỹ năng không tốn mana: ${noMana ? 'BẬT' : 'tắt'}</button>
        <button class="tp-b" data-tp="fillMana">🔋 Đầy mana</button>
    </div>`;
}
function mapTab() {
    const sc = cat?.scenes ?? [];
    return `
    <p class="tp-hint">Dịch chuyển tới khu (kể cả khu chưa mở).</p>
    <div class="tp-grid wide">${sc.map(s => `<button class="tp-b" data-tp="tp" data-v="${esc(s.id)}">${esc(s.name)}</button>`).join('') || '<p class="tp-empty">Đang tải…</p>'}</div>`;
}

function render() {
    if (!panel) return;
    const body = { stage: stageTab, hero: heroTab, items: itemsTab, battle: battleTab, map: mapTab }[tab] ?? stageTab;
    panel.innerHTML = `
    <div class="tp-head"><b>🧪 Tool thử</b><small>Server test</small><button class="tp-x" data-tp="close" aria-label="Đóng">✕</button></div>
    <div class="tp-tabs" role="tablist">${TABS.map(([k, ic, t]) => `<button class="tp-tab${k === tab ? ' on' : ''}" data-tp="tab" data-v="${k}" role="tab" aria-selected="${k === tab}"><span>${ic}</span>${t}</button>`).join('')}</div>
    <div class="tp-body">${body()}</div>
    <div class="tp-msg"></div>`;
    renderMsg();
}
const val = (k) => panel.querySelector(`[data-in="${k}"]`)?.value;

function onClick(e) {
    const b = e.target.closest('[data-tp]');
    if (!b) return;
    const a = b.dataset.tp, v = b.dataset.v;
    switch (a) {
        case 'close': return toggle(false);
        case 'tab': tab = v; LS.set('tp.tab', v); return render();
        case 'ch': chapter = v; LS.set('tp.ch', v); return render();
        case 'jump': focusAfterJump = v; return tool('stageJump', { stageId: v });
        case 'unlockCh': return tool('unlockChapter', { chapter: v });
        case 'board': return openBoard();
        case 'reset': resetArmed = true; render(); clearTimeout(resetTimer); resetTimer = setTimeout(() => { resetArmed = false; render(); }, 8000); return;
        case 'resetNo': resetArmed = false; return render();
        case 'resetGo': resetArmed = false; clearTimeout(resetTimer); render(); return tool('resetAll');
        case 'allLv': { const lv = Math.max(1, Math.min(60, Number(val('allLv')) || 1)); LS.set('tp.lv', lv); return tool('heroes', { level: lv }); }
        case 'allRank': return tool('heroes', { rank: Number(v) });
        case 'ownAll': return tool('heroes', { ownAll: true });
        case 'preset': { const [level, rank] = v.split(',').map(Number); return tool('heroes', { level, rank }); }
        case 'hero': return tool('hero', { id: v, level: Math.max(1, Math.min(60, Number(val(`lv-${v}`)) || 1)), rank: Number(val(`rk-${v}`)) || 0 });
        case 'wallet': { const [k, n] = v.split(':'); return tool('wallet', { [k]: Number(n) }); }
        case 'stamina': return tool('wallet', { stamina: 'full' });
        case 'acc': return tool('account', { level: Number(v) });
        case 'item': return tool('item', { id: val('item'), count: Math.max(1, Math.min(999, Number(val('itemN')) || 1)) });
        case 'gear': { const lv = Math.max(1, Math.min(60, Number(val('gLv')) || 1)); LS.set('tp.glv', lv); return tool('gear', { set: val('gSet'), slot: val('gSlot') || undefined, level: lv, rarity: val('gRar') }); }
        case 'evidence': return tool('evidenceAll');
        case 'win': return tool('battleWin');
        case 'lose': return tool('battleLose');
        case 'god': god = !god; render(); return tool('god', { on: god });
        case 'noMana': noMana = !noMana; render(); return net.debugAction('noMana', noMana);
        case 'fillMana': net.debugAction('fillMana'); return flash('🔋 Đã bơm đầy mana');
        case 'tp': return tool('teleport', { scene: v });
    }
}

function toggle(on = !open) {
    open = on;
    panel.classList.toggle('open', open);
    fab.classList.toggle('on', open);
    fab.setAttribute('aria-expanded', String(open));
    if (open) { if (!cat) socket.emit('testCatalog', {}); render(); }
}

export function setupTestPanel() {
    fab = document.createElement('button');
    fab.id = 'tp-fab'; fab.type = 'button'; fab.title = 'Tool thử (phím `)'; fab.setAttribute('aria-label', 'Mở tool thử');
    fab.innerHTML = '🧪';
    panel = document.createElement('aside');
    panel.id = 'tp-panel'; panel.setAttribute('aria-label', 'Tool thử');
    document.body.append(fab, panel);
    fab.addEventListener('click', () => toggle());
    panel.addEventListener('click', onClick);
    // không để phím gõ trong bảng điều khiển nhân vật / bản đồ
    panel.addEventListener('keydown', (e) => e.stopPropagation());
    addEventListener('keydown', (e) => {
        if (e.key !== '`' || !document.body.classList.contains('srv-test')) return;
        if (e.target.closest?.('input, textarea, select')) return;
        e.preventDefault(); toggle();
    });
    socket.on('testCatalogResult', (c) => { cat = c; if (!c?.chapters?.some(x => x.id === chapter)) chapter = c?.chapters?.[0]?.id ?? 'c1'; if (open) render(); });
    socket.on('testToolResult', (r = {}) => {
        flash(`${r.ok ? '✅' : '⚠️'} ${r.text ?? ''}`, !!r.ok);
        if (r.ok && focusAfterJump) { const id = focusAfterJump; focusAfterJump = null; openBoard(id); }
        else focusAfterJump = null;
    });
    socket.on('progressUpdate', (d) => { if (d?.heroes) { heroes = Object.fromEntries(Object.entries(d.heroes).map(([id, h]) => [id, { level: h.level, rank: h.rank }])); if (open && tab === 'hero') render(); } });
    socket.on('battleStart', (d) => { inBattle = d?.mode && d.mode !== 'menu'; if (open && tab === 'battle') render(); });
    socket.on('mainMenu', () => { inBattle = false; });
    socket.on('stageResult', () => { inBattle = false; });
    socket.on('debugResetDone', () => location.reload());
    window.addEventListener('server-entered', (e) => { cat = null; if (e.detail?.server === 'test') socket.emit('testCatalog', {}); });
}
