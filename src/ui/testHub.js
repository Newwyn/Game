// ============================================================
// 🧪 TOOL THỬ — MỘT bảng duy nhất, mở bằng phím ` hoặc nút 🧪 nổi (Esc đóng)
//   Thay cho: bảng 5 ngăn cũ (testPanel.js), "Tool Phe Mình", "Tool Phe Quái" trong trận, dải "Thử nhanh" ở màn chọn chế độ.
//   · Ô lệnh trên cùng: gõ vài chữ KHÔNG cần dấu ("ai 7", "rok sss", "bat tu", "toi kinh thanh") -> ↑↓ + Enter hoặc bấm chuột
//   · 🎬 Kịch bản: 1 lần bấm làm cả chuỗi (vào Đấu Tập, bật bất tử, gọi quái…)
//   · Theo ngữ cảnh: trong trận hiện lệnh trận trước, ở bản đồ hiện lệnh bản đồ trước; lệnh chưa dùng được thì mờ + ghi lý do
//   · Nhớ công tắc (Bất tử / Skill miễn phí / Quái bất tử): tự bật lại khi vào trận thử; trạng thái thật theo server (input.js)
//   · "Vừa dùng": 5 lệnh gần nhất
// Chỉ có ở nơi tool cũ được phép: Server test (body.srv-test); bản chơi thử không đăng nhập: màn chọn chế độ + trận Đấu Tập.
// Danh sách lệnh + kịch bản + bộ chạy bước: src/ui/testHubCore.mjs (có test). Server: testCatalog / testTool / debug* (server.js).
// ============================================================
import { socket, net } from '../net/socket.js';
import { hideWorld, worldOpen } from './world.js';
import { hideCampaign, openWorldHub } from './campaign.js';
import { showModeMenu } from './modeMenu.js';
import { isSquadSelectOpen } from './squadSelect.js';
import { getDebugToggles, setDebugToggle } from './input.js';
import { renderProgressTool } from './progressTool.js';
import { TOGGLES, GROUPS, SCENARIOS, buildCommands, findCommand, searchCommands, scenarioSteps, stepsFor, runSteps, unavailable, pushRecent, matchScore, autoApplyMode } from './testHubCore.mjs';
import '../styles/testHub.css';

const LS = {
    get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* chế độ riêng tư */ } },
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel) => panel?.querySelector(sel);

let fab = null, panel = null, toastEl = null, open = false;
let cat = null;                         // testCatalogResult
let query = '', sel = 0, rows = [];     // ô lệnh + danh sách đang hiện
let view = 'main';                      // main | pick | heroes | items
let pick = null;                        // { scenario, options: [{ id, label, sub, group }] }
let battle = null;                      // { mode } khi đang trong trận
let monsterLevel = null;
let busy = false;                       // đang chạy 1 chuỗi bước
let msg = null, msgTimer = null, toastTimer = null, lastServerMsg = 0;
let resetArmed = false, resetTimer = null;
let want = { god: false, noMana: false, enemyGod: false, ...LS.get('th.want', {}) };   // công tắc người dùng muốn bật
let recent = LS.get('th.recent', []);   // [{ id, icon, label }]

// ---------- ngữ cảnh ----------
const shown = (id) => { const d = document.getElementById(id)?.style.display; return !!d && d !== 'none'; };
const testServer = () => document.body.classList.contains('srv-test');
/** Tool chỉ có ở nơi tool cũ được phép (server tự kiểm tra lại mọi lệnh) */
let entered = false;   // đã qua trang vào game
const allowed = () => entered && (testServer() || (!document.body.classList.contains('srv-main') && (!battle || battle.mode === 'test')));
function context() {
    const place = battle ? 'battle' : worldOpen() ? 'world' : shown('campaign-screen') ? 'board' : shown('mode-menu') ? 'menu' : 'other';
    return { place, inBattle: !!battle, mode: battle?.mode ?? null };
}
function contextLabel(c) {
    if (c.place === 'battle') return c.mode === 'test' ? '⚔️ Trong trận Đấu Tập' : c.mode === 'campaign' ? '⚔️ Trong trận ải' : '⚔️ Trong trận Đấu';
    return { world: '🗺️ Đang ở bản đồ', board: '📖 Đang ở Bảng ải', menu: '🏠 Đang ở Menu' }[c.place] ?? '';
}

// ---------- lời báo ----------
function flash(text, ok = true, ms = 6000) {
    msg = { text, ok }; clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { msg = null; renderMsg(); }, ms);
    renderMsg();
    if (!open && !text.startsWith('⏳')) toast(text, ok);   // bảng đang đóng (kịch bản tự đóng bảng): báo bằng dòng nổi cạnh nút 🧪
}
function renderMsg() {
    const m = $('.th-msg');
    if (m) { m.textContent = msg?.text ?? ''; m.className = `th-msg${msg ? (msg.ok ? ' ok' : ' bad') : ''}`; }
}
function toast(text, ok = true) {
    if (!toastEl || !allowed()) return;
    toastEl.textContent = text; toastEl.className = `show ${ok ? 'ok' : 'bad'}`;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.className = ''; }, 4500);
}

// ---------- công tắc: nhớ lựa chọn, trạng thái thật theo server ----------
const toggleOn = (key) => (battle ? !!getDebugToggles()[key] : !!want[key]);
function setToggle(key, on) {
    want[key] = !!on; LS.set('th.want', want);
    if (battle) setDebugToggle(key, on);   // ngoài trận: chỉ nhớ, vào trận thử sẽ tự bật
    renderStatus();
}
function applyWanted() {
    const keys = Object.keys(TOGGLES).filter(k => want[k]);
    for (const k of keys) setDebugToggle(k, true);
    if (keys.length) toast(`🧪 Tự bật lại: ${keys.map(k => TOGGLES[k].label).join(' · ')}`);
}
function renderStatus() {
    const box = $('.th-status');
    if (!box) return;
    const keys = Object.keys(TOGGLES), on = keys.filter(toggleOn);
    const lead = battle ? (on.length ? 'Đang bật:' : 'Chưa bật công tắc nào:') : (on.length ? 'Tự bật khi vào trận thử:' : 'Công tắc (nhớ cho trận thử sau):');
    box.innerHTML = `<span class="th-lead">${lead}</span>${keys.map(k => `<button class="th-tg${toggleOn(k) ? ' on' : ''}" data-th="tg" data-v="${k}" title="Bấm để bật / tắt">${TOGGLES[k].icon} ${TOGGLES[k].label}</button>`).join('')}
        ${battle?.mode === 'test' && monsterLevel ? `<span class="th-lead">· Quái Lv${monsterLevel}</span>` : ''}`;
    for (const b of panel.querySelectorAll('[data-tgl]')) b.textContent = toggleOn(b.dataset.tgl) ? 'ĐANG BẬT · bấm để tắt' : 'đang tắt · bấm để bật';
}

// ---------- mở màn hình ----------
function openBoard(arg) {
    if (battle) return flash('Đang trong trận — đánh xong (hoặc Về Menu) rồi mở Bảng ải nhé', false);
    if (worldOpen()) hideWorld();
    document.getElementById('mode-menu')?.style.setProperty('display', 'none');
    net.campaignOpen(String(arg ?? 'c1').slice(0, 2));
    if (String(arg).includes('-')) {   // bảng ải hiện xong -> khoanh ải vừa nhảy tới
        const t0 = performance.now();
        const look = () => {
            const card = document.querySelector(`[data-cp-stage="${arg}"]`);
            if (card) { card.classList.add('cp-focus'); card.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
            if (performance.now() - t0 < 4000) setTimeout(look, 150);
        };
        setTimeout(look, 200);
    }
}
function openWorld() {
    if (battle) return flash('Đang trong trận — Về Menu trước rồi mở bản đồ nhé', false);
    // lệnh dịch chuyển vừa chạy xong: server còn gửi 'campaignState' -> Bảng ải sẽ bật đè lên bản đồ; trong 2,5 giây tới thì đóng lại
    const keep = () => { if (worldOpen()) hideCampaign(); };
    socket.on('campaignState', keep);
    setTimeout(() => socket.off('campaignState', keep), 2500);
    if (worldOpen()) return;   // đang ở bản đồ: server tự gửi vị trí mới
    document.getElementById('mode-menu')?.style.setProperty('display', 'none');
    openWorldHub();
}
/** Lệnh testTool ngoài trận làm server gửi lại 'campaignState' -> Bảng ải tự bật lên. Lệnh không liên quan tới ải (tiền, đồ, dịch chuyển…)
 *  thì giữ nguyên màn hình đang đứng: Bảng ải vừa bật thì đóng lại, Menu vừa bị ẩn thì hiện lại. */
function guardScreens() {
    if (shown('campaign-screen')) return;
    const menuOpen = shown('mode-menu'), hadClass = document.body.classList.contains('selecting-squad');
    const undo = () => {
        clearTimeout(timer); socket.off('campaignState', undo);
        hideCampaign();
        if (menuOpen && !worldOpen()) showModeMenu();
        else if (!hadClass && !worldOpen() && !isSquadSelectOpen() && !shown('mode-menu')) document.body.classList.remove('selecting-squad');
    };
    const timer = setTimeout(() => socket.off('campaignState', undo), 2500);
    socket.on('campaignState', undo);
}

// ---------- chạy lệnh / kịch bản ----------
const io = {
    emit: (event, data) => socket.emit(event, data),
    on: (event, fn) => socket.on(event, fn),
    off: (event, fn) => socket.off(event, fn),
    say: (text) => flash(`⏳ ${text}`),
    ui: (name, arg) => ({
        toggle: () => setToggle(arg, !toggleOn(arg)),
        toggleOn: () => setToggle(arg, true),
        board: () => openBoard(arg),
        world: () => openWorld(),
        detail: () => { view = arg; query = ''; const i = $('.th-in'); if (i) i.value = ''; render(); },
        reset: () => armReset(true),
        close: () => toggle(false),
    })[name]?.(),
};
function remember(item) { recent = pushRecent(recent, item); LS.set('th.recent', recent); }

async function runSequence(label, steps, guard) {
    if (busy) return flash('Đang chạy lệnh trước — đợi một chút', false);
    busy = true;
    const t0 = performance.now();
    flash(`⏳ ${label}…`);
    if (guard && !battle) guardScreens();
    let res;
    try { res = await runSteps(steps, io); } catch (e) { res = { ok: false, text: `Lỗi: ${e?.message ?? e}` }; }
    busy = false;
    if (!res.ok) flash(`⚠️ ${label}: ${res.text ?? 'không xong'}`, false, 9000);
    else if (lastServerMsg < t0 || !open) flash(`✅ ${label}`);   // bảng đã tự đóng (kịch bản): báo xong bằng dòng nổi
    if (open && view === 'main') render();   // mục con (đồ tuỳ chọn, chi tiết nhân vật): giữ nguyên ô đang chọn
}
function runCommand(cmd) {
    if (!cmd) return;
    if (cmd.scenario) return cmd.arg || !cmd.ask ? runScenario(cmd.scenario, cmd.arg, cmd.arg ? cmd.label : null) : openPick(cmd.scenario);
    const why = unavailable(cmd, context());
    if (why) return flash(`⚠️ ${cmd.label}: ${why}`, false);
    const only = cmd.steps.length === 1 ? cmd.steps[0].ui : null;
    if (only === 'detail' || only === 'reset') return io.ui(only, cmd.steps[0].arg);   // mở mục con / hỏi xác nhận: không tính là "vừa dùng"
    remember({ id: cmd.id, icon: cmd.icon, label: cmd.label });
    return runSequence(cmd.label, stepsFor(cmd, context()), cmd.guard);
}
function runScenario(id, arg, label) {
    const sc = SCENARIOS.find(s => s.id === id);
    const steps = scenarioSteps(id, arg, context(), cat ?? {});
    if (!sc || !steps) return;
    const name = label ?? (arg ? `${sc.label}: ${pick?.options.find(o => o.id === arg)?.label ?? arg}` : sc.label);
    remember({ id: arg ? `sc:${id}:${arg}` : `sc:${id}`, icon: sc.icon, label: name });
    view = 'main'; pick = null;
    return runSequence(name, steps, false);
}
function runRecent(id) {
    const m = /^sc:([^:]+)(?::(.+))?$/.exec(id);
    if (m) { const sc = SCENARIOS.find(s => s.id === m[1]); return sc?.ask && !m[2] ? openPick(m[1]) : runScenario(m[1], m[2], recent.find(r => r.id === id)?.label); }
    const cmd = findCommand(id, cat ?? {});
    return cmd ? runCommand(cmd) : flash('Lệnh này chưa sẵn sàng (đang tải danh sách từ máy chủ)', false);
}
function openPick(id) {
    const sc = SCENARIOS.find(s => s.id === id);
    if (!cat) return flash('Đang tải danh sách từ máy chủ… thử lại sau 1 giây', false);
    const options = sc.ask === 'stage' ? (cat.chapters ?? []).flatMap((c, ci) => c.stages.map(s => ({ id: s.id, label: `${ci ? `C${ci + 1}·` : ''}${s.no}`, sub: s.name, find: `${s.no} ${s.name} chuong ${ci + 1}` })))
        : sc.ask === 'scene' ? (cat.scenes ?? []).map(s => ({ id: s.id, label: s.name }))
        : (cat.heroes ?? []).filter(h => sc.ask !== 'heroNoPriest' || h.id !== 'priest').map(h => ({ id: h.id, label: h.name }));
    pick = { scenario: id, options };
    view = 'pick'; query = ''; sel = 0;
    const input = $('.th-in'); if (input) { input.value = ''; input.focus(); }
    render();
}
function armReset(on) {
    resetArmed = on; clearTimeout(resetTimer);
    if (on) {   // hiện hộp xác nhận ở đầu bảng (xoá chữ đang gõ để thấy ngay); 8 giây không bấm thì tự huỷ
        resetTimer = setTimeout(() => { resetArmed = false; if (open) render(); }, 8000);
        query = ''; view = 'main'; const input = $('.th-in'); if (input) input.value = '';
    }
    if (open) render();
}

// ---------- vẽ ----------
const PICK_TITLE = { hero: 'chọn tướng', heroNoPriest: 'chọn tướng sẽ bị hạ gục (đi cùng Tu Sĩ)', stage: 'chọn ải', scene: 'chọn khu' };
function pickOptions() {
    if (!query) return pick.options;
    return pick.options.map(o => ({ o, s: matchScore(query, o.find ?? o.label) })).filter(x => x.s).sort((a, b) => b.s - a.s).map(x => x.o);
}
function pickHTML() {
    const sc = SCENARIOS.find(s => s.id === pick.scenario), list = pickOptions();
    return `<div class="th-sec"><button class="th-back" data-th="back">← Quay lại</button><b>${sc.icon} ${esc(sc.label)}</b><i>— ${PICK_TITLE[sc.ask]}</i><small>(gõ để lọc, Enter chọn ô đầu)</small></div>
        <div class="th-chips${sc.ask === 'stage' ? ' num' : ''}">${list.map((o, i) => `<button class="th-chip${i === 0 && query ? ' sel' : ''}" data-th="pick" data-v="${esc(o.id)}" title="${esc(o.sub ?? o.label)}">${esc(o.label)}</button>`).join('')
            || '<p class="th-empty">Không có lựa chọn nào khớp</p>'}</div>`;
}
function itemsHTML() {
    const opt = (arr) => (arr ?? []).map(o => typeof o === 'object' ? `<option value="${esc(o.id)}">${esc(o.name)}</option>` : `<option value="${esc(o)}">${esc(o)}</option>`).join('');
    return `<div class="th-sec"><button class="th-back" data-th="back">← Quay lại</button><b>🧰 Nhận đồ / vật phẩm tuỳ chọn</b></div>
        <div class="th-form"><h4>Vật phẩm</h4>
            <div class="th-row"><select data-in="item" aria-label="Vật phẩm">${opt(cat?.items)}</select>
                <input type="number" min="1" max="999" value="10" data-in="itemN" aria-label="Số lượng">
                <button class="th-btn main" data-th="giveItem">Nhận</button></div></div>
        <div class="th-form"><h4>Trang bị</h4>
            <div class="th-row"><select data-in="gSet" aria-label="Bộ đồ"><option value="">Không theo bộ</option>${opt(cat?.gearSets)}</select>
                <select data-in="gSlot" aria-label="Món"><option value="">Cả bộ</option>${opt(cat?.gearSlots)}</select></div>
            <div class="th-row"><label>Cấp đồ <input type="number" min="1" max="60" value="${LS.get('th.glv', 10)}" data-in="gLv"></label>
                <select data-in="gRar" aria-label="Độ hiếm">${opt(cat?.rarities)}</select>
                <button class="th-btn main" data-th="giveGear">Nhận đồ</button></div></div>
        ${cat ? '' : '<p class="th-empty">Đang tải danh sách từ máy chủ…</p>'}`;
}
function heroesHTML() {
    return `<div class="th-sec"><button class="th-back" data-th="back">← Quay lại</button><b>📋 Chi tiết nhân vật</b> <small>bấm tên để mở · chỉnh là áp ngay</small></div>
        <div id="progress-tool-body" class="th-pt"><div class="pt-msg">Đang tải…</div></div>`;
}
function rowHTML(r, i) {
    const c = r.cmd;
    const state = c.toggle ? `<small class="th-state" data-tgl="${c.toggle}"></small>` : '';
    return `<button class="th-cmd${i === sel ? ' sel' : ''}${r.why ? ' off' : ''}" data-th="cmd" data-i="${i}" role="option" aria-selected="${i === sel}">
        <span class="th-ic">${c.icon}</span><span class="th-lb">${esc(c.label)}${c.hint ? `<small>${esc(c.hint)}</small>` : ''}</span>${state}${r.why ? `<small class="th-why">${esc(r.why)}</small>` : c.leave && battle ? '<small class="th-note">thoát trận trước</small>' : ''}</button>`;
}
function mainHTML(ctx) {
    const nums = (query.match(/\d+/g) ?? []).map(Number).filter(n => n >= 1 && n <= 60);
    rows = searchCommands(buildCommands(cat ?? {}, nums), query, ctx);
    sel = Math.max(0, Math.min(sel, rows.length - 1));
    let list = '', lastGroup = null;
    rows.forEach((r, i) => {
        if (!query && r.cmd.group !== lastGroup) { lastGroup = r.cmd.group; list += `<div class="th-group">${GROUPS[lastGroup] ?? ''}</div>`; }
        list += rowHTML(r, i);
    });
    const top = query ? '' : `
        ${resetArmed ? `<div class="th-reset"><span>Xoá hết tiến trình của hồ sơ này và chơi lại từ đầu?</span>
            <button class="th-btn danger" data-th="resetGo">⚠️ Bấm lần nữa để XOÁ HẾT</button><button class="th-btn" data-th="resetNo">Huỷ</button></div>` : ''}
        ${recent.length ? `<div class="th-sec">Vừa dùng</div><div class="th-chips">${recent.map(r => `<button class="th-chip" data-th="recent" data-v="${esc(r.id)}">${r.icon ?? ''} ${esc(r.label)}</button>`).join('')}</div>` : ''}
        <div class="th-sec">🎬 Kịch bản <small>1 lần bấm làm hết</small></div>
        <div class="th-scs">${SCENARIOS.map(s => `<button class="th-sc" data-th="sc" data-v="${s.id}"><span>${s.icon}</span><b>${esc(s.label)}</b><small>${esc(s.hint)}</small></button>`).join('')}</div>`;
    const empty = query ? '<p class="th-empty">Không có lệnh nào khớp — thử gõ ít chữ hơn (không cần dấu)</p>' : '';
    return `${top}${cat ? '' : '<p class="th-empty">Đang tải danh sách ải / nhân vật từ máy chủ…</p>'}
        <div class="th-list" role="listbox">${list || empty}</div>`;
}
function render() {
    if (!panel || !open) return;
    const ctx = context();
    $('.th-ctx').textContent = contextLabel(ctx);
    const body = $('.th-body');
    body.innerHTML = view === 'pick' && pick ? pickHTML() : view === 'items' ? itemsHTML() : view === 'heroes' ? heroesHTML() : mainHTML(ctx);
    if (view === 'heroes') renderProgressTool();
    renderStatus(); renderMsg();
    body.querySelector('.th-cmd.sel')?.scrollIntoView({ block: 'nearest' });
}
function moveSel(d) {
    if (view !== 'main' || !rows.length) return;
    sel = (sel + d + rows.length) % rows.length;
    for (const b of panel.querySelectorAll('.th-cmd')) { const on = Number(b.dataset.i) === sel; b.classList.toggle('sel', on); b.setAttribute('aria-selected', String(on)); }
    $('.th-cmd.sel')?.scrollIntoView({ block: 'nearest' });
}

// ---------- thao tác ----------
const val = (k) => $(`[data-in="${k}"]`)?.value;
const T = (op, extra) => [{ emit: 'testTool', data: { op, ...extra }, wait: 'testToolResult', test: (r) => !!r?.ok, fail: 'Máy chủ không nhận lệnh', failText: (r) => r?.text }];
function onClick(e) {
    const b = e.target.closest('[data-th]');
    if (!b) return;
    const a = b.dataset.th, v = b.dataset.v;
    switch (a) {
        case 'close': return toggle(false);
        case 'cmd': sel = Number(b.dataset.i); return runCommand(rows[sel]?.cmd);
        case 'tg': return setToggle(v, !toggleOn(v));
        case 'sc': { const sc = SCENARIOS.find(s => s.id === v); return sc.ask ? openPick(v) : runScenario(v); }
        case 'pick': return runScenario(pick.scenario, v);
        case 'recent': return runRecent(v);
        case 'back': view = 'main'; pick = null; render(); return $('.th-in')?.focus();
        case 'resetNo': return armReset(false);
        case 'resetGo': armReset(false); flash('⏳ Đang xoá tiến trình…'); return socket.emit('debugReset');   // server trả debugResetDone -> tải lại trang (progressTool.js)
        case 'giveItem': return runSequence('Nhận vật phẩm', T('item', { id: val('item'), count: Math.max(1, Math.min(999, Number(val('itemN')) || 1)) }), true);
        case 'giveGear': { const lv = Math.max(1, Math.min(60, Number(val('gLv')) || 1)); LS.set('th.glv', lv);
            return runSequence('Nhận đồ', T('gear', { set: val('gSet') || undefined, slot: val('gSlot') || undefined, level: lv, rarity: val('gRar') }), true); }
    }
}
function onKey(e) {
    e.stopImmediatePropagation();   // không để phím gõ trong bảng điều khiển nhân vật / bản đồ / chọn đội / tạm dừng trận
    if (e.key === 'Escape' || e.key === '`') { e.preventDefault(); if (e.key === 'Escape' && view !== 'main') { view = 'main'; pick = null; render(); $('.th-in')?.focus(); } else toggle(false); return; }
    if (e.target !== $('.th-in')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'Enter') {
        e.preventDefault();
        if (view === 'pick' && pick) { const first = pickOptions()[0]; if (first) runScenario(pick.scenario, first.id); }
        else if (view === 'main') runCommand(rows[sel]?.cmd);
    }
}
function onInput(e) {
    query = e.target.value.trim(); sel = 0;
    if (view !== 'pick') view = 'main';
    render();
}

function toggle(on = !open) {
    if (on && !allowed()) return;
    open = on;
    panel.classList.toggle('open', open);
    fab.classList.toggle('on', open);
    fab.setAttribute('aria-expanded', String(open));
    if (!open) { panel.querySelector('.th-in')?.blur(); return; }
    if (!cat) socket.emit('testCatalog', {});
    view = 'main'; pick = null; sel = 0; query = '';
    const input = $('.th-in');
    input.value = '';
    render();
    input.focus();
}
const syncAllowed = () => { const ok = allowed(); document.body.classList.toggle('th-ok', ok); if (!ok && open) toggle(false); };

export function setupTestHub() {
    fab = document.createElement('button');
    fab.id = 'th-fab'; fab.type = 'button'; fab.title = 'Tool thử (phím `)'; fab.setAttribute('aria-label', 'Mở tool thử');
    fab.textContent = '🧪';
    panel = document.createElement('aside');
    panel.id = 'th-panel'; panel.setAttribute('aria-label', 'Tool thử');
    panel.innerHTML = `
        <div class="th-head"><b>🧪 Tool thử</b><small class="th-ctx"></small><button class="th-x" data-th="close" aria-label="Đóng">✕</button></div>
        <label class="th-box"><span>›</span><input class="th-in" type="text" autocomplete="off" spellcheck="false" placeholder="Gõ lệnh, không cần dấu: ai 7 · rok sss · bat tu · toi kinh thanh" aria-label="Ô lệnh"></label>
        <div class="th-status"></div>
        <div class="th-body"></div>
        <div class="th-msg" role="status"></div>
        <div class="th-foot">↑ ↓ chọn · Enter chạy · Esc đóng · phím \` bật / tắt</div>`;
    toastEl = document.createElement('div');
    toastEl.id = 'th-toast';
    document.body.append(fab, panel, toastEl);
    fab.addEventListener('click', () => toggle());
    panel.addEventListener('click', onClick);
    panel.querySelector('.th-in').addEventListener('input', onInput);
    // Bắt phím ở window (pha capture) và đăng ký SỚM (main.js gọi setupTestHub trước bảng chọn đội): đang gõ trong bảng thì
    // các màn khác (chọn đội bắt phím số + Enter, hội thoại, bản đồ, tạm dừng) không nhận phím.
    // Phím ` mở / đóng ở mọi nơi; Esc đóng cả khi con trỏ không nằm trong bảng.
    window.addEventListener('keydown', (e) => {
        if (panel.contains(e.target)) return onKey(e);
        if (open && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); toggle(false); return; }
        if (e.key !== '`' || !allowed() || e.target.closest?.('input, textarea, select')) return;
        e.preventDefault(); toggle();
    }, true);
    window.addEventListener('open-test-hub', () => toggle(true));          // nút 🧪 ở màn chọn chế độ (modeMenu.js)
    window.addEventListener('debug-toggles', () => { if (open) renderStatus(); });   // server đổi trạng thái công tắc (input.js)

    socket.on('testCatalogResult', (c) => { cat = c; if (open) render(); });
    socket.on('testToolResult', (r = {}) => { lastServerMsg = performance.now(); flash(`${r.ok ? '✅' : '⚠️'} ${r.text ?? ''}`, !!r.ok); });
    socket.on('progressMsg', (m = {}) => { lastServerMsg = performance.now(); flash(`${m.ok ? '✅' : '⚠️'} ${m.text ?? ''}`, !!m.ok); });
    socket.on('monsterLevel', (d) => { monsterLevel = d?.level ?? null; if (open) renderStatus(); });
    socket.on('battleStart', (d) => {
        if (!d?.mode || d.mode === 'menu') return;
        battle = { mode: d.mode };
        syncAllowed();
        if (allowed() && autoApplyMode(d.mode, testServer())) applyWanted();   // tự bật lại công tắc đã nhớ
        setTimeout(() => { if (open) render(); });   // đợi các màn khác ẩn / hiện xong rồi mới đọc ngữ cảnh
    });
    const left = () => { battle = null; syncAllowed(); setTimeout(() => { if (open) render(); }); };
    socket.on('mainMenu', left);
    socket.on('stageResult', left);
    window.addEventListener('server-entered', (e) => { entered = true; cat = null; battle = null; syncAllowed(); if (allowed() && e.detail?.server === 'test') socket.emit('testCatalog', {}); });
    syncAllowed();
}
