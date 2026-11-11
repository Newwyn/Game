// ============================================================
// 🍲 BẢNG NẤU ĂN (bếp cô Lena / lửa trại) · 🧰 BÀN DỤNG CỤ (lò rèn bác Borin)
//   Mở từ bản đồ (src/ui/world.js) khi bấm A vào bếp, lửa trại, bàn dụng cụ.
//   Nấu ăn: danh sách công thức (chưa học hiện ???, kèm gợi ý) · nguyên liệu có / cần · số phần · nút Nấu · hình món bật lên khi nấu xong
//   Túi đồ ăn: xếp tối đa 3 món mang vào trận · Mua nguyên liệu: chỉ ở bếp cô Lena (muối, sữa, lúa, trứng, sách nấu ăn)
//   Dụng cụ: cuốc / rìu / cần câu, rèn lên bậc kế bằng gỗ + quặng + vàng (cần đủ cấp tài khoản)
//   Dữ liệu: server 'cookOpen' -> 'cookState' (server.js cookPayload) · 'cookDo' · 'cookBuy' · 'pouchSet' · 'toolCraft' -> 'cookResult'
// ============================================================
import { socket } from '../net/socket.js';
import { itemIcon } from './itemIcons.js';
import '../styles/cooking.css';

const HERO = { warrior: 'Rok', assassin: 'Jessica', priest: 'Seraphine', archer: 'Lyra' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN');

let root = null, data = null, mode = null, tab = 'cook', sel = null, qty = 1, msg = null, kitchen = false, onClose = null, pop = null;
export const cookingOpen = () => !!mode;

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'cook-screen';
    root.addEventListener('click', onClick);
    document.body.appendChild(root);
    window.addEventListener('keydown', (e) => { if (mode && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } }, true);
    return root;
}
function open(m, opts = {}) {
    mode = m; tab = m === 'tools' ? 'tools' : 'cook'; kitchen = !!opts.kitchen; onClose = opts.onClose ?? null; msg = null; qty = 1; data = null; pop = null;
    el().style.display = 'flex';
    render();
    socket.emit('cookOpen');
}
/** Mở bảng Nấu ăn (kitchen = bếp cô Lena: có thêm thẻ Mua nguyên liệu) */
export const openCooking = (opts) => open('cook', opts);
/** Mở bàn dụng cụ */
export const openTools = (opts) => open('tools', opts);
function close() {
    if (!mode) return;
    mode = null;
    root.style.display = 'none';
    const cb = onClose; onClose = null; cb?.();
}

function recipeHTML() {
    const list = data.recipes, cur = list.find(r => r.id === sel) ?? list.find(r => r.known) ?? list[0];
    const rows = list.map(r => `<button type="button" class="ck-row${cur?.id === r.id ? ' on' : ''}${r.known ? '' : ' unknown'}" data-ck-sel="${r.id}">
        ${r.known ? itemIcon(`dish_${r.id}`, 'ck-ic') : '<span class="ck-ic ck-q">?</span>'}
        <span class="ck-row-main"><b>${esc(r.name)}${r.fav ? ` <span class="ck-heart" title="Món tủ của ${HERO[r.fav]}">♥</span>` : ''}</b>
        <small>${r.known ? (r.can > 0 ? `Nấu được ${r.can} phần` : 'Thiếu nguyên liệu') : esc(r.hint)}</small></span>
        ${r.have ? `<span class="ck-have">×${r.have}</span>` : ''}</button>`).join('');
    let detail = '<p class="ck-empty">Chọn một công thức.</p>';
    if (cur && !cur.known) detail = `<div class="ck-detail"><span class="ck-big ck-q">?</span><h3>???</h3><p class="ck-hint">Chưa học công thức này.</p><p class="ck-effect">Gợi ý: ${esc(cur.hint)}</p></div>`;
    else if (cur) {
        const max = Math.max(1, Math.min(10, cur.can));
        qty = Math.max(1, Math.min(max, qty));
        detail = `<div class="ck-detail">
            <div class="ck-stage">${itemIcon(`dish_${cur.id}`, 'ck-big')}${pop?.id === cur.id ? `<span class="ck-pop" data-n="+${pop.n}">${itemIcon(`dish_${cur.id}`, 'ck-pop-ic')}<i></i><i></i><i></i></span>` : ''}</div>
            <h3>${esc(cur.name)}${cur.rare ? ' <span class="ck-rare">Hiếm</span>' : ''}</h3>
            <p class="ck-effect">${esc(cur.effect)}</p>
            ${cur.fav ? `<p class="ck-fav">♥ Món tủ của <b>${HERO[cur.fav]}</b>: ${esc(cur.favEffect)}</p>` : ''}
            ${cur.note ? `<p class="ck-hint">${esc(cur.note).replace('{ten}', 'bạn')}</p>` : ''}
            <div class="ck-needs">${cur.needs.map(n => `<span class="ck-need${n.have >= n.n * qty ? '' : ' lack'}">${itemIcon(n.id, 'ck-need-ic')}<b>${esc(n.name)}</b><small>${n.have}/${n.n * qty}</small></span>`).join('')}</div>
            <div class="ck-actions">
                <div class="ck-qty"><button type="button" data-ck-qty="-1" ${qty <= 1 ? 'disabled' : ''} aria-label="Bớt">−</button><b>${qty}</b><button type="button" data-ck-qty="1" ${qty >= max ? 'disabled' : ''} aria-label="Thêm">+</button></div>
                <button type="button" class="ck-go" data-ck-cook="${cur.id}" ${cur.can >= qty && data.atCook ? '' : 'disabled'}>🍳 Nấu</button>
            </div>
            <p class="ck-hint">Đang có: <b>${cur.have}</b> phần · mỗi món tối đa 20 phần</p></div>`;
    }
    return `<div class="ck-split"><div class="ck-list">${rows}</div>${detail}</div>`;
}
function pouchHTML() {
    const left = Object.fromEntries(data.dishes.map(d => [d.id, d.n]));
    for (const id of data.pouch) left[id]--;
    const slots = Array.from({ length: data.pouchMax }, (_, i) => data.pouch[i] ?? null);
    const name = (id) => data.dishes.find(d => d.id === id)?.name ?? id;
    return `<div class="ck-pouch">
        <p class="ck-hint">Xếp tối đa <b>${data.pouchMax}</b> món mang vào trận. Mỗi món dùng 1 lần mỗi trận, cách nhau ${data.cooldown} giây. Dùng được ở ải cốt truyện, ải nhánh và quái hoang.</p>
        <div class="ck-slots">${slots.map((id, i) => id ? `<button type="button" class="ck-slot on" data-ck-unpack="${i}" title="Bấm để bỏ ra">${itemIcon(`dish_${id}`, 'ck-slot-ic')}<small>${esc(name(id))}</small></button>` : '<span class="ck-slot"><small>Ô trống</small></span>').join('')}</div>
        <h4>Món đang có</h4>
        ${data.dishes.length ? `<div class="ck-dishes">${data.dishes.map(d => `<button type="button" class="ck-dish" data-ck-pack="${d.id}" ${left[d.id] > 0 && data.pouch.length < data.pouchMax ? '' : 'disabled'}>
            ${itemIcon(`dish_${d.id}`, 'ck-ic')}<span class="ck-row-main"><b>${esc(d.name)} ×${d.n}${d.fav ? ` <span class="ck-heart">♥ ${HERO[d.fav]}</span>` : ''}</b><small>${esc(d.effect)}</small></span></button>`).join('')}</div>`
            : '<p class="ck-empty">Chưa có món nào. Sang thẻ Nấu ăn để nấu.</p>'}</div>`;
}
function shopHTML() {
    return `<div class="ck-shop"><p class="ck-hint">Cô Lena bán vài thứ cơ bản. Còn lại phải tự hái, câu, săn trên bản đồ.</p>
        ${data.shop.map(it => `<div class="ck-shop-row">${itemIcon(it.book ? 'q_trang' : it.mat, 'ck-ic')}
            <span class="ck-row-main"><b>${esc(it.name)}</b><small>${it.book ? `Dạy công thức: ${esc(it.teaches)}` : `Đang có ${it.owned}`}</small></span>
            ${it.book ? (it.owned ? '<span class="ck-have">Đã mua</span>' : it.locked ? `<span class="ck-have">${esc(it.lockText)}</span>` : `<button type="button" class="ck-buy" data-ck-buy="${it.id}" data-n="1" ${data.wallet.gold >= it.gold ? '' : 'disabled'}>🪙 ${fmt(it.gold)}</button>`)
                : `<button type="button" class="ck-buy" data-ck-buy="${it.id}" data-n="1" ${data.wallet.gold >= it.gold ? '' : 'disabled'}>×1 · 🪙 ${fmt(it.gold)}</button><button type="button" class="ck-buy" data-ck-buy="${it.id}" data-n="5" ${data.wallet.gold >= it.gold * 5 ? '' : 'disabled'}>×5 · 🪙 ${fmt(it.gold * 5)}</button>`}
        </div>`).join('')}</div>`;
}
function toolsHTML() {
    return `<div class="ck-tools"><p class="ck-hint">Dụng cụ bậc cao gõ ít lần hơn, được nhiều đồ hơn và hái được điểm khó (quặng sắt, cây sồi già, vũng nước sâu). Cấp tài khoản của bạn: <b>${data.account.level}</b>.</p>
        ${data.tools.map(t => `<div class="ck-tool">${itemIcon(`tool_${t.id}${t.tier || 1}`, `ck-big${t.tier ? '' : ' ck-dim'}`)}
            <div class="ck-row-main"><b>${t.tier ? `${esc(t.tierName)} <span class="ck-tier">Bậc ${t.tier}</span>` : `${esc(t.name)}: chưa có`}</b>
                <small>Dùng để ${esc(t.use)}</small>
                ${!t.tier ? `<small class="ck-lack">Nhận ${esc(t.first)} từ nhiệm vụ (${t.id === 'rod' ? 'Lão Gus ở Ngoại ô' : 'Bác Borin ở làng'}).</small>`
                    : t.next ? `<small class="${t.next.levelOk ? '' : 'ck-lack'}">Bậc kế: <b>${esc(t.next.name)}</b> · cần cấp tài khoản ${t.next.account}</small>
                        <div class="ck-needs">${Object.entries(t.next.cost.mats).map(([id, n]) => { const m = data.mats.find(x => x.id === id); return `<span class="ck-need${(m?.n ?? 0) >= n ? '' : ' lack'}">${itemIcon(id, 'ck-need-ic')}<small>${m?.n ?? 0}/${n}</small></span>`; }).join('')}<span class="ck-need${t.next.goldOk ? '' : ' lack'}"><b>🪙</b><small>${fmt(t.next.cost.gold)}</small></span></div>`
                        : '<small>Đã là bậc cao nhất của chương này.</small>'}</div>
            ${t.tier && t.next ? `<button type="button" class="ck-go" data-ck-craft="${t.id}" ${t.next.levelOk && t.next.matsOk && t.next.goldOk && data.atBench ? '' : 'disabled'}>⚒️ Rèn</button>` : ''}</div>`).join('')}
        <h4>Vật liệu đang có</h4>
        <div class="ck-needs">${data.mats.filter(m => m.kind === 'mat').map(m => `<span class="ck-need">${itemIcon(m.id, 'ck-need-ic')}<b>${esc(m.name)}</b><small>×${m.n}</small></span>`).join('') || '<span class="ck-empty">Chưa có gỗ hay quặng. Chặt đống củi khô, đập tảng quặng ngoài bản đồ.</span>'}</div></div>`;
}
function render() {
    if (!root || !mode) return;
    const tabs = mode === 'tools' ? [['tools', '🧰 Dụng cụ']] : [['cook', '🍳 Nấu ăn'], ['pouch', '🎒 Túi đồ ăn'], ...(kitchen ? [['shop', '🧺 Mua nguyên liệu']] : [])];
    const body = !data ? '<p class="ck-empty">Đang mở…</p>'
        : mode === 'cook' && !data.unlocked ? '<p class="ck-empty">Chưa mở Nấu ăn. Hãy giúp cô Lena mở lại quán trước.</p>'
        : tab === 'tools' ? toolsHTML() : tab === 'pouch' ? pouchHTML() : tab === 'shop' ? shopHTML() : recipeHTML();
    root.innerHTML = `<div class="ck-box" role="dialog" aria-label="${mode === 'tools' ? 'Bàn dụng cụ' : 'Nấu ăn'}">
        <div class="ck-head"><h2>${mode === 'tools' ? '🧰 Bàn dụng cụ của bác Borin' : kitchen ? '🍲 Bếp của cô Lena' : '🔥 Lửa trại'}</h2>
            ${data ? `<span class="ck-gold">🪙 ${fmt(data.wallet.gold)}</span>` : ''}<button type="button" class="ck-close" data-ck-close aria-label="Đóng">✕</button></div>
        <div class="ck-tabs">${tabs.map(([k, t]) => `<button type="button" class="ck-tab${tab === k ? ' on' : ''}" data-ck-tab="${k}">${t}</button>`).join('')}</div>
        <div class="ck-body">${body}</div>
        ${msg ? `<div class="ck-msg${msg.ok ? '' : ' bad'}">${esc(msg.text)}</div>` : ''}</div>`;
}
function onClick(e) {
    const q = (s) => e.target.closest(s);
    if (e.target === root || q('[data-ck-close]')) return close();
    const t = q('[data-ck-tab]'); if (t) { tab = t.dataset.ckTab; msg = null; return render(); }
    const s = q('[data-ck-sel]'); if (s) { sel = s.dataset.ckSel; qty = 1; pop = null; return render(); }
    const k = q('[data-ck-qty]'); if (k) { qty += Number(k.dataset.ckQty); return render(); }
    const c = q('[data-ck-cook]'); if (c) { c.disabled = true; return socket.emit('cookDo', { id: c.dataset.ckCook, n: qty }); }
    const b = q('[data-ck-buy]'); if (b) { b.disabled = true; return socket.emit('cookBuy', { id: b.dataset.ckBuy, n: Number(b.dataset.n) }); }
    const p = q('[data-ck-pack]'); if (p) return socket.emit('pouchSet', { list: [...data.pouch, p.dataset.ckPack] });
    const u = q('[data-ck-unpack]'); if (u) return socket.emit('pouchSet', { list: data.pouch.filter((_, i) => i !== Number(u.dataset.ckUnpack)) });
    const f = q('[data-ck-craft]'); if (f) { f.disabled = true; return socket.emit('toolCraft', { tool: f.dataset.ckCraft }); }
}
socket.on('cookState', (d) => { data = d; if (mode) render(); });
socket.on('cookResult', (r) => {
    if (!mode) return;
    msg = { ok: r.ok, text: r.text };
    if (r.ok && r.cooked) { pop = { ...r.cooked, at: performance.now() }; qty = 1; setTimeout(() => { if (pop && performance.now() - pop.at >= 1500) { pop = null; if (mode) render(); } }, 1600); }
    render();
});
