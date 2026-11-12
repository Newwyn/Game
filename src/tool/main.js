// ============================================================
// 🧪 APP TOOL THỬ (cửa sổ riêng — tool.html) — 12/11/2026
//   Người chơi muốn: GAME là một ứng dụng, TOOL là ứng dụng hỗ trợ đứng riêng, chia theo chức năng (Nhân vật, Bản đồ…).
//   App này KHÔNG tự nói chuyện với máy chủ: nó gửi lệnh sang cửa sổ GAME đang mở (cùng trình duyệt) qua BroadcastChannel 'loc-tool';
//   game chạy lệnh bằng đúng bộ máy của bảng tool cũ (src/ui/testHub.js) rồi báo kết quả về. Danh sách lệnh dùng chung: src/ui/testHubCore.mjs.
// ============================================================
import { TOGGLES, SCENARIOS, QUICK, buildCommands, searchCommands, unavailable } from '../ui/testHubCore.mjs';
import './tool.css';

const root = document.getElementById('tool-app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ch = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('loc-tool') : null;

let state = null;           // { allowed, ctx, label, cat, toggles, recent, busy } do game gửi
let lastSeen = 0;           // lần cuối game trả lời
let okAt = 0;               // lần cuối game báo dùng được tool
let tab = localStorage.getItem('tool.tab') || 'quick';
let query = '';
let hero = localStorage.getItem('tool.hero') || '';        // tướng đang chọn ở thẻ Nhân vật ('' = cả đội)
let chapter = 0;
let msg = null, msgTimer = null;
let confirmReset = false;
let pick = {};              // lựa chọn của từng kịch bản

const TABS = [['quick', '⚡ Nhanh'], ['hero', '🦸 Nhân vật'], ['map', '🗺️ Bản đồ & Ải'], ['battle', '⚔️ Trong trận'], ['items', '🎒 Đồ & tiền'], ['scenario', '🎬 Kịch bản']];
const connected = () => Date.now() - lastSeen < 4000;
const send = (m) => ch?.postMessage(m);
const cmds = () => buildCommands(state?.cat ?? {}, (query.match(/\d+/g) ?? []).map(Number).filter(n => n >= 1 && n <= 60));
const byId = (id) => cmds().find(c => c.id === id);
const ctx = () => state?.ctx ?? {};

function say(text, ok = true) { msg = { text, ok }; clearTimeout(msgTimer); msgTimer = setTimeout(() => { msg = null; render(); }, 7000); render(); }

/** một nút lệnh: xám đi + ghi lý do nếu lúc này chưa dùng được (ví dụ cần đang trong trận) */
function btn(id, label, cls = '') {
    const c = byId(id);
    if (!c) return '';
    const why = unavailable(c, ctx());
    return `<button class="tb ${cls}${why ? ' off' : ''}" data-run="${esc(id)}" title="${esc(why ?? c.label)}">${esc(label ?? c.label)}${why ? `<small>${esc(why)}</small>` : ''}</button>`;
}
const sec = (title, body, hint = '') => body ? `<section><h3>${title}${hint ? ` <small>${hint}</small>` : ''}</h3><div class="grid">${body}</div></section>` : '';
const toggleBtn = (k) => `<button class="tb tg${state?.toggles?.[k] ? ' on' : ''}" data-tg="${k}">${TOGGLES[k].icon} ${TOGGLES[k].label}<small>${state?.toggles?.[k] ? 'ĐANG BẬT' : 'đang tắt'}</small></button>`;

function tabQuick() {
    const quick = QUICK.filter(([id]) => id !== 'reset').map(([id, label]) => btn(id, label, 'big')).join('');
    const recent = (state?.recent ?? []).filter(r => !String(r.id).startsWith('sc:')).slice(0, 8).map(r => btn(r.id, `${r.icon ?? ''} ${r.label}`)).join('');
    return sec('Hay dùng nhất', quick, 'bấm 1 lần là xong, dùng được ở bản đồ, bảng ải và giữa trận')
        + sec('Công tắc', Object.keys(TOGGLES).map(toggleBtn).join(''), 'bật ở đây, vào trận sẽ tự áp dụng')
        + sec('Vừa dùng', recent)
        + `<section><h3>Bắt đầu lại</h3><div class="grid">${confirmReset
            ? '<button class="tb danger" data-reset="go">⚠️ Bấm lần nữa để XOÁ HẾT tiến trình</button><button class="tb" data-reset="no">Huỷ</button>'
            : '<button class="tb" data-reset="arm">🔄 Chơi lại từ đầu (xoá tiến trình)</button>'}</div></section>`;
}
function tabHero() {
    const heroes = state?.cat?.heroes ?? [];
    const pickRow = `<div class="chips"><button class="chip${hero === '' ? ' on' : ''}" data-hero="">Cả đội</button>${heroes.map(h => `<button class="chip${hero === h.id ? ' on' : ''}" data-hero="${h.id}">${esc(h.name)}</button>`).join('')}</div>`;
    if (!hero) {
        const all = cmds();
        return `<section><h3>Chọn ai</h3>${pickRow}</section>`
            + sec('Cả đội — cấp và bậc', btn('quick:max', '⚡ Lv60 SSS + đủ tướng', 'big') + all.filter(c => c.id.startsWith('team:')).map(c => btn(c.id, c.label.replace('Cả đội ', ''))).join(''))
            + sec('Cả đội — chỉ đổi bậc', all.filter(c => c.id.startsWith('teamRank:')).map(c => btn(c.id, c.label.replace('Cả đội bậc ', 'Bậc '))).join(''))
            + sec('Sở hữu', btn('ownAll', '🦸 Có đủ mọi tướng'));
    }
    const h = heroes.find(x => x.id === hero), n = h?.name ?? hero;
    return `<section><h3>Chọn ai</h3>${pickRow}</section>`
        + sec(`${esc(n)} — có / chưa có`, btn(`own:${hero}`, `🔓 Mở ${n}`) + btn(`unown:${hero}`, `🔒 Cất ${n}`))
        + sec(`${esc(n)} — cấp và bậc`, [0, 1, 2, 3].map(i => btn(`hero:${hero}:p${i}`, ['Lv1 Thường', 'Lv20 S', 'Lv40 SS', 'Lv60 SSS'][i])).join('') + btn(`rankUp:${hero}`, '⬆️ Đột phá (luồng thật)'))
        + sec(`${esc(n)} — trong trận`, btn(`member:${hero}`, '🔁 Thêm / bớt khỏi trận') + btn(`kill:${hero}`, '💀 Hạ gục ngay') + btn(`sc:skill:${hero}`, '🎯 Vào Đấu Tập thử chiêu'), 'cần đang ở Đấu Tập');
}
function tabMap() {
    const cat = state?.cat ?? {}, chapters = cat.chapters ?? [];
    chapter = Math.min(chapter, Math.max(0, chapters.length - 1));
    const c = chapters[chapter];
    const chipRow = `<div class="chips">${chapters.map((x, i) => `<button class="chip${i === chapter ? ' on' : ''}" data-chapter="${i}">Chương ${i + 1}</button>`).join('')}</div>`;
    return sec('Bản đồ thế giới', btn('world', '🗺️ Mở bản đồ') + (cat.scenes ?? []).map(s => btn(`tp:${s.id}`, `Tới ${s.name}`)).join(''), 'dịch chuyển tới khu')
        + (c ? `<section><h3>Ải</h3>${chipRow}<div class="grid">${btn(`board:${c.id}`, '📖 Mở Bảng ải')}${btn(`unlock:${c.id}`, '🔓 Mở hết chương')}</div>
            <div class="grid tight">${c.stages.map(s => btn(`jump:${s.id}`, `${s.no}`, 'num')).join('')}</div>
            <p class="hint">Bấm số = nhảy tới ải đó (các ải trước coi như đã qua).</p>
            ${c.branches?.length ? `<div class="grid">${c.branches.map(b => btn(`jump:${b.id}`, `Nhánh: ${b.name}`)).join('')}</div>` : ''}</section>` : '')
        + sec('Cấp tài khoản', cmds().filter(x => x.id.startsWith('acc:')).map(x => btn(x.id, x.label.replace('Cấp tài khoản ', 'Cấp '), 'num')).join(''), 'mở Khó / Địa ngục / các tính năng')
        + sec('Đi tới', btn('menu', '🏠 Về Menu') + btn('practice', '⚔️ Vào Đấu Tập'));
}
function tabBattle() {
    const all = cmds();
    return sec('Công tắc', Object.keys(TOGGLES).map(toggleBtn).join(''))
        + sec('Kết thúc trận', btn('win', '🏆 Thắng ngay', 'big') + btn('lose', '💀 Thua ngay') + btn('fillMana', '✨ Đầy mana'))
        + sec('Phe quái', all.filter(c => c.id.startsWith('spawn:')).map(c => btn(c.id)).join(''), 'chỉ trong Đấu Tập')
        + sec('Cấp quái', all.filter(c => c.id.startsWith('monLv:') || c.id.startsWith('monAdd:')).map(c => btn(c.id, c.label.replace('Quái ', ''), 'num')).join(''))
        + sec('Phép của Elarion', all.filter(c => c.id.startsWith('elem:')).map(c => btn(c.id, c.label.replace('Elarion: ', '').replace(' → nút KN2', ''))).join(''), 'nạp phép vào nút kỹ năng 2')
        + sec('Golem', all.filter(c => c.id.startsWith('golem:')).map(c => btn(c.id, c.label.replace('Golem: ', ''))).join(''));
}
function tabItems() {
    const all = cmds();
    return sec('Tiền', btn('quick:rich', '💰 Nhiều vàng + kim cương + đá', 'big') + ['gold', 'diamond', 'stone', 'stamina'].map(id => btn(id)).join(''))
        + sec('Trang bị thử (màu cam)', all.filter(c => c.id.startsWith('gear:')).map(c => btn(c.id, c.label.replace('Nhận đồ thử: ', '').replace(' (cam)', ''))).join(''))
        + sec('Vật phẩm', all.filter(c => c.id.startsWith('item:')).map(c => btn(c.id, c.label.replace('Nhận ', ''))).join(''))
        + sec('Khác', btn('evidence'));
}
function tabScenario() {
    const cat = state?.cat ?? {};
    const opts = (sc) => sc.ask === 'stage' ? (cat.chapters ?? []).flatMap((c, ci) => c.stages.map(s => [s.id, `${ci ? `C${ci + 1} · ` : ''}Ải ${s.no} · ${s.name}`]))
        : sc.ask === 'scene' ? (cat.scenes ?? []).map(s => [s.id, s.name])
        : (cat.heroes ?? []).filter(h => sc.ask !== 'heroNoPriest' || h.id !== 'priest').map(h => [h.id, h.name]);
    return `<section><h3>Kịch bản <small>một lần bấm làm hết các bước</small></h3>${SCENARIOS.map(sc => `
        <div class="scn"><div><b>${sc.icon} ${esc(sc.label)}</b><small>${esc(sc.hint)}</small></div>
            ${sc.ask ? `<select data-pick="${sc.id}">${opts(sc).map(([v, l]) => `<option value="${esc(v)}"${pick[sc.id] === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>` : ''}
            <button class="tb main" data-sc="${sc.id}">Chạy</button></div>`).join('')}</section>`;
}
function searchView() {
    const rows = searchCommands(cmds(), query, ctx()).slice(0, 60);
    return rows.length ? `<section><h3>Kết quả tìm</h3><div class="list">${rows.map(r => `<button class="row${r.why ? ' off' : ''}" data-run="${esc(r.cmd.id)}">${r.cmd.icon} ${esc(r.cmd.label)}${r.why ? `<small>${esc(r.why)}</small>` : ''}</button>`).join('')}</div></section>`
        : '<p class="hint">Không có lệnh nào khớp — thử gõ ít chữ hơn (không cần dấu).</p>';
}

function render() {
    const ok = connected();
    const status = !ch ? '⚠️ Trình duyệt này không hỗ trợ nối giữa hai cửa sổ'
        : !ok ? '🔌 Chưa thấy game. Mở game ở một thẻ / cửa sổ khác của CÙNG trình duyệt này, rồi vào bằng nút Server test.'
        : !state?.allowed ? '⏳ Đã thấy game, nhưng game chưa vào Server test (hoặc đang ở server chính — tool không dùng được ở đó).'
        : `🟢 Đã nối với game · ${state.label || 'đang ở màn khác'}${state.busy ? ' · đang chạy lệnh…' : ''}`;
    const focusQ = document.activeElement?.id === 'q', caret = focusQ ? document.activeElement.selectionStart : 0;
    const body = !ok || !state?.allowed ? '<p class="hint big">Tool cần game đang mở để ra lệnh. Khi game đã vào Server test, bảng này tự sáng lên.</p>'
        : query ? searchView()
        : ({ quick: tabQuick, hero: tabHero, map: tabMap, battle: tabBattle, items: tabItems, scenario: tabScenario }[tab] ?? tabQuick)();
    root.innerHTML = `
        <header><h1>🧪 Tool thử</h1><div class="status ${ok && state?.allowed ? 'ok' : 'bad'}">${status}</div></header>
        <input id="q" placeholder="Tìm lệnh (không cần dấu): ai 12 · mo tuong · bat tu…" value="${esc(query)}" autocomplete="off">
        <nav>${TABS.map(([id, label]) => `<button class="${!query && tab === id ? 'on' : ''}" data-tab="${id}">${label}</button>`).join('')}</nav>
        ${msg ? `<div class="msg ${msg.ok ? 'ok' : 'bad'}">${esc(msg.text)}</div>` : ''}
        <main>${body}</main>`;
    if (focusQ) { const q = document.getElementById('q'); q.focus(); q.setSelectionRange(caret, caret); }
}

root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.tab) { tab = d.tab; query = ''; localStorage.setItem('tool.tab', tab); return render(); }
    if (d.hero != null) { hero = d.hero; localStorage.setItem('tool.hero', hero); return render(); }
    if (d.chapter != null) { chapter = Number(d.chapter); return render(); }
    if (d.reset) {
        if (d.reset === 'arm') confirmReset = true;
        else { if (d.reset === 'go') { send({ type: 'reset' }); say('⏳ Đang xoá tiến trình…'); } confirmReset = false; }
        return render();
    }
    if (!connected() || !state?.allowed) return say('Chưa nối được với game', false);
    if (d.tg) return send({ type: 'toggle', key: d.tg, on: !state.toggles?.[d.tg] });
    if (d.sc) {
        const sc = SCENARIOS.find(s => s.id === d.sc), sel = root.querySelector(`select[data-pick="${d.sc}"]`);
        return send({ type: 'scenario', id: d.sc, arg: sc.ask ? sel?.value : undefined });
    }
    if (d.run) {
        const c = byId(d.run), why = c && unavailable(c, ctx());
        if (why) return say(`${c.label}: ${why}`, false);
        return send({ type: 'run', id: d.run });
    }
});
root.addEventListener('input', (e) => { if (e.target.id === 'q') { query = e.target.value.trim(); render(); } });
root.addEventListener('change', (e) => { const k = e.target.dataset?.pick; if (k) pick[k] = e.target.value; });

if (ch) {
    ch.onmessage = (e) => {
        const m = e.data ?? {};
        if (m.type === 'state') {
            lastSeen = Date.now();
            // game đang chuyển màn có thể báo "chưa sẵn sàng" trong tích tắc: giữ trạng thái cũ 3 giây cho bảng khỏi chớp tắt
            if (!m.allowed && state?.allowed && Date.now() - okAt < 3000) m.allowed = true; else if (m.allowed) okAt = Date.now();
            state = m; render();
        }
        else if (m.type === 'msg') { lastSeen = Date.now(); say(m.text, m.ok !== false); }
    };
    const ping = () => send({ type: 'hello' });
    ping(); setInterval(ping, 1500);
    setInterval(() => { if (!connected() && state) { render(); } }, 2000);
}
render();
