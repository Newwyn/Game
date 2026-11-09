import { unlockText } from './modeMenu.js';
// ============================================================
// 🏰 HẦM NGỤC · 🍲 QUÁN ĂN · 🛒 CỬA HÀNG ANH HÙNG (P6) — 1 màn, 3 tab
//   · Hầm ngục: đồ bộ (thể lực, 3 tầng) · trang sức (3 lượt / ngày, mua thêm lượt) -> bấm tầng -> chọn đội -> vào trận
//   · Quán ăn: chọn anh hùng, mời món (Vàng) -> độ thân mật, mỗi cấp +1% Máu & Tấn công
//   · Cửa hàng anh hùng: mua anh hùng mới bằng Kim Cương (hộp xác nhận ngay trên trang)
// ============================================================
import { net, socket } from '../net/socket.js';
import { openCampaignSquadSelect } from './squadSelect.js';

const PORTRAITS = import.meta.glob('../assets/portraits/*.png', { eager: true, import: 'default' });
import { tierPortrait } from '../characters/sprite/tiers.js';
const TAVERN_BG = import.meta.glob('../assets/world/tavern.webp', { eager: true, import: 'default' });
let root = null, data = null, tab = 'dungeon', onBack = null, notice = null, heroSel = null, confirmBuy = null;
const fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN');
const face = (id, emoji) => { const u = tierPortrait(id) ?? PORTRAITS[`../assets/portraits/${id}.png`]; return u ? `<img src="${u}" alt="">` : `<span>${emoji ?? '⚔️'}</span>`; };   // hình đúng bậc S / SS

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'extras-screen';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    return root;
}

function dungeonHTML() {
    const d = data.dungeon;
    const card = (kind, icon, desc) => {
        const g = d[kind];
        return `<section class="gr-panel ex-dg">
            <h3>${icon} ${g.name} ${g.open ? '' : '<small>🔒</small>'}</h3>
            <p class="gr-hint">${desc}</p>
            ${kind === 'jewel' && g.open ? `<div class="ex-runs">Lượt hôm nay: <b>${g.runsLeft}</b> · đã mua ${g.bought}/${g.maxBuy}
                <button class="gr-chip" data-ex-buyrun ${g.bought >= g.maxBuy ? 'disabled' : ''}>+1 lượt (💎 ${g.buyCost})</button></div>` : ''}
            <div class="ex-tiers">${g.tiers.map(t => `
                <button class="ex-tier${t.open && g.open ? '' : ' locked'}" data-ex-tier="${t.id}" data-kind="${kind}">
                    <b>${t.open && g.open ? '' : '🔒 '}Tầng ${t.tier}</b>
                    <small>Quái Lv${t.lv} · đồ cấp ${t.itemLv}</small>
                    <small class="ex-en">${t.enemies.join(' · ')}</small>
                    ${g.best >= t.tier ? '<span class="ex-done">✓ Đã qua</span>' : ''}
                </button>`).join('')}</div>
        </section>`;
    };
    return `<div class="ex-grid">
        ${card('set', '🛡️', `Rơi đồ 3 bộ tộc Người (Hộ Vệ · Chiến Lược · Lữ Khách), độ hiếm Sử thi / Huyền thoại. Mỗi lần vào tốn ⚡${d.set.stamina} thể lực (thua hoàn ${d.set.stamina - 1}). ${unlockText("setDungeon")}.`)}
        ${card('jewel', '💍', `Rơi Nhẫn / Dây chuyền (Sử thi / Huyền thoại) + Đá Tinh Luyện. 3 lượt mỗi ngày, thua không mất lượt. ${unlockText("jewelDungeon")}.`)}
    </div>`;
}
function tavernHTML() {
    const t = data.tavern;
    if (!t.open) return `<p class="gr-empty">🔒 ${unlockText("tavern")} và giúp cô Lena chuẩn bị <b>Bữa Tiệc Làng</b> (nhận việc ở Phố Lò rèn trên bản đồ thế giới, sau ải 3).</p>`;
    const sel = t.heroes.find(h => h.id === heroSel) ?? t.heroes[0];
    heroSel = sel?.id;
    const pct = sel && sel.next ? Math.round(((sel.pts - sel.cur) / (sel.next - sel.cur)) * 100) : 100;
    return `<div class="ex-tavern" style="${TAVERN_BG['../assets/world/tavern.webp'] ? `--tv:url(${TAVERN_BG['../assets/world/tavern.webp']})` : ''}">
        <div class="gr-heroes">${t.heroes.map(h => `<button class="gr-hero${h.id === sel?.id ? ' active' : ''}" data-ex-hero="${h.id}"><span>${h.emoji}</span><b>${h.name}</b><small>❤️ ${h.level}/${h.max}</small></button>`).join('')}</div>
        ${sel ? `<section class="gr-panel ex-aff">
            <div class="ex-aff-face">${face(sel.id, sel.emoji)}</div>
            <div class="ex-aff-body">
                <h3>${sel.name} <small>${sel.title ?? ''}</small></h3>
                <div class="ex-aff-bar"><i style="width:${pct}%"></i></div>
                <small>Thân mật cấp <b>${sel.level}</b>/${sel.max} · ${sel.next ? `${sel.pts}/${sel.next} điểm` : 'tối đa'} · thưởng hiện tại <b>+${Math.round(sel.bonus * 100)}% Máu & Tấn công</b></small>
                <div class="ex-foods">${Object.entries(t.foods).map(([id, f]) => `
                    <button class="ex-food" data-ex-food="${id}" ${sel.next == null || data.wallet.gold < f.gold ? 'disabled' : ''}>
                        <span>${f.emoji}</span><b>${f.name}</b><small>🪙 ${fmt(f.gold)} · +${f.pts} thân mật</small></button>`).join('')}</div>
            </div></section>` : ''}
    </div>`;
}
function shopHTML() {
    const s = data.shop;
    if (!s.open) return `<p class="gr-empty">🔒 Cửa hàng anh hùng mở khi qua ải 20 (kết chương 1).</p>`;
    const c = confirmBuy && s.list.find(h => h.id === confirmBuy);
    return `<div class="ex-shop">${s.list.map(h => `
        <div class="gr-panel ex-hero-card${h.owned ? ' owned' : ''}">
            <div class="ex-aff-face">${face(h.id, h.emoji)}</div>
            <b>${h.emoji} ${h.name}</b><small>${h.title ?? ''} · ${h.className ?? ''}</small>
            ${h.owned ? '<span class="ex-done">✓ Đã có</span>' : `<button class="gr-big-btn" data-ex-buy="${h.id}" ${data.wallet.diamond < h.price ? 'disabled' : ''}>💎 ${fmt(h.price)}</button>`}
        </div>`).join('')}</div>
    ${c ? `<div class="cp-confirm-backdrop"><div class="cp-confirm-box" role="dialog">
        <h3>🛒 Mời ${c.name} gia nhập?</h3>
        <p class="cp-confirm-question">Dùng ${fmt(c.price)} Kim Cương?</p>
        <p class="cp-confirm-meta">Hiện có 💎 ${fmt(data.wallet.diamond)}</p>
        <div class="cp-confirm-actions"><button class="cp-btn-cancel" data-ex-buy-no>Huỷ</button><button class="cp-btn-confirm" data-ex-buy-yes="${c.id}">Xác nhận</button></div>
    </div></div>` : ''}`;
}
function render() {
    if (!data) return;
    const w = data.wallet;
    el().innerHTML = `
    <div class="cp-container gr-container">
        <header class="cp-header">
            <div class="cp-title-row">
                <button class="cp-back-btn" data-ex-back>← Quay lại</button>
                <div class="cp-title-text"><h1>🏰 HẦM NGỤC · QUÁN ĂN · CỬA HÀNG</h1><p>Đồ bộ, trang sức, độ thân mật và anh hùng mới</p></div>
            </div>
            <div class="cp-resource-bar">
                <div class="cp-wallet-item gold"><span class="cp-res-icon">🪙</span><b class="cp-res-val">${fmt(w.gold)}</b></div>
                <div class="cp-wallet-item diamond"><span class="cp-res-icon">💎</span><b class="cp-res-val">${fmt(w.diamond)}</b></div>
                <div class="cp-wallet-item"><span class="cp-res-icon">⚡</span><b class="cp-res-val">${data.stamina?.value ?? 0}/${data.stamina?.max ?? 360}</b></div>
            </div>
        </header>
        <div class="gr-tabs ex-tabs">
            ${[['dungeon', '🏰 Hầm ngục'], ['tavern', '🍲 Quán ăn'], ['shop', '🛒 Cửa hàng anh hùng']].map(([k, t]) =>
                `<button class="cp-diff-tab${tab === k ? ' active' : ''}" data-ex-tab="${k}"><div class="cp-diff-main"><span><b>${t}</b></span></div></button>`).join('')}
        </div>
        ${notice ? `<div class="gr-notice ${notice.kind}" role="status"><span>${notice.text}</span><button class="cp-error-close" data-ex-notice-close>✕</button></div>` : ''}
        <div class="cp-scroll-body gr-body">${tab === 'tavern' ? tavernHTML() : tab === 'shop' ? shopHTML() : dungeonHTML()}</div>
    </div>`;
}
function onClick(e) {
    const q = (s) => e.target.closest(s);
    if (q('[data-ex-back]')) { hideExtras(); onBack?.(); return; }
    if (q('[data-ex-notice-close]')) { notice = null; render(); return; }
    const tb = q('[data-ex-tab]');
    if (tb) { tab = tb.dataset.exTab; notice = null; confirmBuy = null; render(); return; }
    if (q('[data-ex-buyrun]')) { net.dungeonBuyRun(); return; }
    const tier = q('[data-ex-tier]');
    if (tier) {
        const g = data.dungeon[tier.dataset.kind];
        const t = g.tiers.find(x => x.id === tier.dataset.exTier);
        if (!g.open || !t.open) {
            const why = !g.open ? unlockText(tier.dataset.kind === 'set' ? 'setDungeon' : 'jewelDungeon') : `Hãy qua tầng ${t.tier - 1} trước`;
            notice = { kind: 'bad', text: `🔒 ${why}` }; render(); return;
        }
        if (tier.dataset.kind === 'jewel' && g.runsLeft <= 0) { notice = { kind: 'bad', text: '⚠️ Hết lượt hôm nay — mua thêm lượt bằng Kim Cương' }; render(); return; }
        hideExtras();
        openCampaignSquadSelect({ id: t.id, diff: 'story', stageLabel: `${g.name} · Tầng ${t.tier} (${tier.dataset.kind === 'set' ? `⚡${g.stamina}` : 'dùng 1 lượt'})`,
            owned: data.owned, heroes: data.squad?.heroes, onBack: () => showExtras() });
        return;
    }
    const hh = q('[data-ex-hero]');
    if (hh) { heroSel = hh.dataset.exHero; render(); return; }
    const fd = q('[data-ex-food]');
    if (fd) { net.tavernFeed(heroSel, fd.dataset.exFood); return; }
    const by = q('[data-ex-buy]');
    if (by) { confirmBuy = by.dataset.exBuy; render(); return; }
    if (q('[data-ex-buy-no]')) { confirmBuy = null; render(); return; }
    const yes = q('[data-ex-buy-yes]');
    if (yes) { const id = yes.dataset.exBuyYes; confirmBuy = null; net.shopBuy(id); }
}

export function showExtras(back, startTab) {
    onBack = back ?? onBack;
    if (startTab) tab = startTab;
    notice = null;
    el().style.display = 'flex';
    document.body.classList.add('selecting-squad');
    if (!data) el().innerHTML = '<div class="cp-container gr-container"><p class="gr-empty">Đang mở…</p></div>'; else render();
    net.extrasOpen();
}
export function hideExtras() { if (root) root.style.display = 'none'; }
export function setupExtras() {
    el();
    socket.on('extrasState', (d) => { data = d; if (root.style.display === 'flex') render(); });
    socket.on('extrasResult', (r) => { notice = { kind: r.ok ? 'ok' : 'bad', text: r.ok ? `✨ ${r.text}` : `⚠️ ${r.text}` }; });
    socket.on('battleStart', hideExtras);
    socket.on('mainMenu', hideExtras);
}
