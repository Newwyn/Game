// ============================================================
// 🎒 TRANG BỊ + 🔨 LÒ RÈN (P2) — mở từ màn chọn ải Cốt truyện
//   · Trang bị: chọn anh hùng, 6 ô đồ, chỉ số (có đồ), bộ đồ, túi đồ lọc theo ô; bấm món đồ -> thẻ chi tiết (mặc / tháo / khoá)
//   · Lò rèn: cường hoá (+1 → +10, tỉ lệ, tích may mắn, Bùa May Mắn), tinh luyện (roll lại 1 dòng), phân giải nhiều món
//   · Mọi xác nhận làm ngay trên trang (không dùng confirm/alert)
// ============================================================
import { net, socket } from '../net/socket.js';

let root = null;
let onBack = null;
let data = null;          // gearState từ server
let tab = 'equip';        // 'equip' | 'forge'
let selHero = null;
let slotFilter = 'all';
let detailId = null;      // thẻ chi tiết đang mở
let forgeId = null;       // món đang đặt trên lò rèn
let forgeMode = 'enhance';   // 'enhance' | 'refine' | 'salvage'
let refineLine = 0;
let useCharm = false;
let picked = new Set();   // món chọn để phân giải
let confirmSalvage = false;
let notice = null;        // { text, kind: 'ok' | 'bad' | 'info' }
let busy = false;         // đang chờ server trả kết quả (chống bấm liên tục)

const fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN');
const pct = (r) => `${Math.round((r ?? 0) * 100)}%`;
const STAT_ROWS = [
    ['maxHp', 'Máu'], ['atk', 'Tấn công'], ['pDef', 'Thủ vật lý'], ['mDef', 'Thủ phép'],
    ['crit', 'Chí mạng', true], ['critDmg', 'ST chí mạng', true], ['pen', 'Xuyên giáp', true], ['acc', 'Chính xác', true],
    ['dodge', 'Né', true], ['block', 'Chặn', true], ['mpAtk', 'Năng lượng / đòn'], ['atkSpeed', 'Đòn / giây'],
];

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'gear-screen';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    return root;
}

// ---------- tra cứu ----------
const hero = () => data?.heroes.find(h => h.id === selHero) ?? data?.heroes[0] ?? null;
function allItems() {
    const out = [];
    for (const h of data?.heroes ?? []) for (const v of Object.values(h.equipped)) if (v) out.push({ ...v, owner: h });
    for (const v of data?.bag ?? []) out.push({ ...v, owner: null });
    return out;
}
const itemById = (id) => allItems().find(it => it.id === id) ?? null;
const sortItems = (list) => list.sort((a, b) => (b.level - a.level) || (b.rarity - a.rarity) || (b.enhance - a.enhance));

// ---------- khối giao diện ----------
function itemCard(it, { mini = false, check = false } = {}) {
    if (!it) return '';
    const sel = check && picked.has(it.id);
    return `<button class="gr-item r${it.rarity}${sel ? ' picked' : ''}${it.id === forgeId && tab === 'forge' && forgeMode !== 'salvage' ? ' on-forge' : ''}" data-gr-item="${it.id}" style="--rc:${it.color}" title="${it.name}">
        <span class="gr-item-icon">${it.icon}</span>
        ${it.enhance ? `<span class="gr-item-enh">+${it.enhance}</span>` : ''}
        ${it.locked ? '<span class="gr-item-lock">🔒</span>' : ''}
        ${it.owner ? `<span class="gr-item-owner">${it.owner.emoji}</span>` : ''}
        ${check ? `<span class="gr-item-check">${sel ? '✔' : ''}</span>` : ''}
        ${mini ? '' : `<span class="gr-item-lv">Cấp ${it.level}</span>`}
    </button>`;
}

function subLines(it, { radio = false } = {}) {
    return it.subs.map((s, i) => `
        <label class="gr-sub${s.gold ? ' gold' : ''}${radio ? ' pickable' : ''}${radio && i === refineLine ? ' chosen' : ''}">
            ${radio ? `<input type="radio" name="gr-line" value="${i}" ${i === refineLine ? 'checked' : ''}>` : ''}
            <span class="gr-sub-text">${s.text}</span>
            <span class="gr-sub-bar" title="Vị trí trong khoảng: ${pct(s.pct)}"><i style="width:${Math.max(4, Math.round(s.pct * 100))}%"></i></span>
        </label>`).join('');
}

function setLine(it) {
    if (!it.setName) return '';
    const info = data.setInfo?.[it.set] ?? null;
    return `<div class="gr-set-note">🧩 Bộ <b>${it.setName}</b>${info ? ` — 2 món: ${info.twoText} · 4 món: ${info.fourText}` : ''}</div>`;
}

function detailHTML() {
    const it = detailId && itemById(detailId);
    if (!it) return '';
    const h = hero();
    const wearOk = h && h.level >= it.wearLevel;
    const onThis = it.owner?.id === h?.id;
    return `
    <div class="cp-confirm-backdrop" data-gr-close-detail>
        <div class="gr-detail r${it.rarity}" style="--rc:${it.color}" role="dialog" aria-modal="true">
            <div class="gr-detail-head">
                <span class="gr-detail-icon">${it.icon}</span>
                <div>
                    <h3>${it.name}${it.enhance ? ` <span class="gr-enh">+${it.enhance}</span>` : ''}</h3>
                    <small>${it.slotName} · Cấp ${it.level} · <b style="color:${it.color}">${it.rarityName}</b> · Mặc từ Lv${it.wearLevel}${it.owner ? ` · Đang mặc: ${it.owner.emoji} ${it.owner.name}` : ''}</small>
                </div>
            </div>
            <div class="gr-main">${it.main.map(m => `<div>${m.text}</div>`).join('')}</div>
            <div class="gr-subs">${subLines(it)}</div>
            ${setLine(it)}
            ${notice ? `<p class="gr-detail-msg ${notice.kind}">${notice.text}</p>` : ''}
            <div class="gr-detail-actions">
                ${onThis
                    ? `<button class="cp-btn-cancel" data-gr-unequip="${it.slot}">Tháo khỏi ${h.name}</button>`
                    : wearOk ? `<button class="cp-btn-confirm" data-gr-equip="${it.id}">Mặc cho ${h.emoji} ${h.name}</button>`
                    : `<button class="cp-btn-confirm off" data-gr-equip-off="${it.wearLevel}">🔒 ${h.name} cần Lv${it.wearLevel}</button>`}
                <button class="cp-btn-cancel" data-gr-lock="${it.id}">${it.locked ? '🔓 Mở khoá' : '🔒 Khoá'}</button>
                ${data.features.forge ? `<button class="cp-btn-cancel" data-gr-to-forge="${it.id}">🔨 Lò rèn</button>` : ''}
                <button class="cp-btn-cancel" data-gr-close-detail>Đóng</button>
            </div>
        </div>
    </div>`;
}

function statsHTML(h) {
    const val = (s, k) => k === 'atk' ? Math.max(s.pAtk ?? 0, s.mAtk ?? 0) : k === 'atkSpeed' ? 1000 / (s.atkSpeed || 1000) : s[k] ?? 0;
    return STAT_ROWS.map(([k, label, isPct]) => {
        const b = val(h.base, k), v = val(h.stats, k);
        const show = (x) => k === 'atkSpeed' ? x.toFixed(2) : isPct ? `${(x / 10).toFixed(1).replace('.', ',')}%` : fmt(x);
        const up = k === 'atkSpeed' ? v - b >= 0.005 : v - b > 0;   // tốc đánh: chỉ ghi khi tăng thấy được (2 chữ số)
        return `<div class="gr-stat"><span>${label}</span><b>${show(v)}</b>${up ? `<em>+${k === 'atkSpeed' ? (v - b).toFixed(2) : isPct ? `${((v - b) / 10).toFixed(1).replace('.', ',')}%` : fmt(v - b)}</em>` : ''}</div>`;
    }).join('');
}

function equipTabHTML() {
    const h = hero();
    if (!h) return '<p class="gr-empty">Chưa có anh hùng.</p>';
    const bag = sortItems(data.bag.filter(it => slotFilter === 'all' || it.slot === slotFilter));
    return `
    <div class="gr-heroes">${data.heroes.map(x => `
        <button class="gr-hero${x.id === h.id ? ' active' : ''}" data-gr-hero="${x.id}" style="--hc:${x.color}">
            <span>${x.emoji}</span><b>${x.name}</b><small>Lv${x.level} · ${x.rankName}</small>
        </button>`).join('')}
    </div>
    <div class="gr-equip-body">
        <section class="gr-panel">
            <h3>${h.emoji} ${h.name} <small>${h.title ?? ''} · tộc ${h.race}</small></h3>
            <div class="gr-slots">${data.slots.map(sl => {
                const it = h.equipped[sl.id];
                return `<div class="gr-slot">
                    ${it ? itemCard({ ...it, owner: null }) : `<div class="gr-slot-empty"><span>${sl.icon}</span></div>`}
                    <small>${sl.name}</small>
                </div>`;
            }).join('')}</div>
            ${h.sets.length ? `<div class="gr-sets">${h.sets.map(s => `
                <div class="gr-set${s.count >= 2 ? ' on' : ''}"><b>🧩 ${s.name} (${s.count}/4)</b>
                    <span class="${s.count >= 2 ? 'on' : ''}">2 món: ${s.twoText}</span>
                    <span class="${s.count >= 4 ? 'on' : ''}">4 món: ${s.fourText}</span></div>`).join('')}</div>` : ''}
            <div class="gr-stats">${statsHTML(h)}</div>
        </section>
        <section class="gr-panel gr-bag-panel">
            <div class="gr-bag-head">
                <h3>🎒 Túi đồ <small>${data.bag.length}/${data.invMax}</small></h3>
                <div class="gr-filters">
                    <button class="gr-chip${slotFilter === 'all' ? ' active' : ''}" data-gr-filter="all">Tất cả</button>
                    ${data.slots.map(sl => `<button class="gr-chip${slotFilter === sl.id ? ' active' : ''}" data-gr-filter="${sl.id}" title="${sl.name}">${sl.icon}</button>`).join('')}
                </div>
            </div>
            ${bag.length ? `<div class="gr-bag">${bag.map(it => itemCard(it)).join('')}</div>`
                : `<p class="gr-empty">${data.bag.length ? 'Không có món nào ở ô này.' : 'Túi trống. Thắng ải Cốt truyện để nhận đồ (mỗi trận 1 món, ải trùm thêm 1 món).'}</p>`}
        </section>
    </div>`;
}

function forgeTabHTML() {
    const items = sortItems(allItems());
    const salvage = forgeMode === 'salvage';
    const list = salvage ? items.filter(it => !it.owner && !it.locked) : items;
    if (!salvage && !itemById(forgeId)) forgeId = list[0]?.id ?? null;
    const it = itemById(forgeId);
    let right = '';
    if (salvage) {
        const sv = [...picked].map(id => data.salvage[id]).filter(Boolean);
        const stone = sv.reduce((a, v) => a + v.stone, 0), refine = sv.reduce((a, v) => a + v.refine, 0);
        right = `
        <h3>♻️ Phân giải</h3>
        <p class="gr-hint">Đổi đồ thừa thành đá. Đồ đang mặc và đồ đã khoá 🔒 không hiện ở đây.</p>
        <div class="gr-filters">
            <button class="gr-chip" data-gr-pick="0">Chọn đồ Thường</button>
            <button class="gr-chip" data-gr-pick="1">Thường + Tốt</button>
            <button class="gr-chip" data-gr-pick="none">Bỏ chọn</button>
        </div>
        <div class="gr-forge-cost">Đã chọn <b>${picked.size}</b> món → nhận <b>🔷 ${fmt(stone)}</b> Đá Cường Hoá${refine ? ` · <b>💠 ${refine}</b> Đá Tinh Luyện` : ''}</div>
        <button class="gr-big-btn" data-gr-salvage-open ${picked.size && !busy ? '' : 'disabled'}>♻️ Phân giải ${picked.size || ''} món</button>`;
    } else if (it) {
        const head = `
        <div class="gr-forge-item r${it.rarity}" style="--rc:${it.color}">
            ${itemCard({ ...it, owner: null }, { mini: true })}
            <div><b>${it.name}${it.enhance ? ` <span class="gr-enh">+${it.enhance}</span>` : ''}</b>
            <small>Cấp ${it.level} · ${it.rarityName}${it.owner ? ` · ${it.owner.emoji} ${it.owner.name} đang mặc` : ''}</small></div>
        </div>`;
        if (forgeMode === 'enhance') {
            const e = data.enhance[it.id] ?? {};
            const rate = Math.min(1, (e.rate ?? 0) + (useCharm ? 0.1 : 0));
            const enough = data.wallet.stone >= e.stone && data.wallet.gold >= e.gold && (!useCharm || data.mats.luck_charm > 0);
            right = head + (e.maxed ? '<p class="gr-maxed">✨ Đã cường hoá tối đa +10</p>' : `
            <div class="gr-enh-row"><span class="gr-enh">+${it.enhance}</span> → <span class="gr-enh">+${e.to}</span>
                <b class="gr-rate ${rate >= 1 ? 'sure' : rate < 0.5 ? 'risky' : ''}">Tỉ lệ ${pct(rate)}</b></div>
            <div class="gr-main">${it.main.map(m => `<div>${m.text}</div>`).join('')}</div>
            <p class="gr-hint">${e.dropOnFail ? '⚠️ Thất bại sẽ <b>tụt 1 cấp</b>.' : e.to > 5 ? 'Thất bại giữ nguyên cấp.' : 'Chắc chắn thành công.'}
                ${it.luck ? ` Tích may mắn: +${pct(it.luck)}` : ''}${e.to === 5 ? ' · Lên +5: các dòng phụ +10%.' : ''}</p>
            <label class="gr-charm ${data.mats.luck_charm ? '' : 'off'}"><input type="checkbox" data-gr-charm ${useCharm ? 'checked' : ''} ${data.mats.luck_charm ? '' : 'disabled'}>
                🍀 Dùng Bùa May Mắn (+10%) · còn ${data.mats.luck_charm}</label>
            <div class="gr-forge-cost">Tốn <b class="${data.wallet.stone >= e.stone ? '' : 'lack'}">🔷 ${fmt(e.stone)}</b> Đá Cường Hoá · <b class="${data.wallet.gold >= e.gold ? '' : 'lack'}">🪙 ${fmt(e.gold)}</b> Vàng</div>
            <button class="gr-big-btn" data-gr-enhance ${enough && !busy ? '' : 'disabled'}>🔨 Cường hoá</button>`);
        } else {
            const r = data.refine[it.id] ?? {};
            if (refineLine >= it.subs.length) refineLine = 0;
            const enough = data.mats.refine_stone >= r.refine && data.wallet.gold >= r.gold;
            right = head + `
            <p class="gr-hint">Chọn 1 dòng để roll lại <b>hoàn toàn ngẫu nhiên</b> (có thể đổi sang dòng khác, số tăng hoặc giảm).</p>
            <div class="gr-subs">${subLines(it, { radio: true })}</div>
            <div class="gr-forge-cost">Tốn <b class="${data.mats.refine_stone >= r.refine ? '' : 'lack'}">💠 ${r.refine}</b> Đá Tinh Luyện (còn ${data.mats.refine_stone}) · <b class="${data.wallet.gold >= r.gold ? '' : 'lack'}">🪙 ${fmt(r.gold)}</b> Vàng</div>
            <button class="gr-big-btn" data-gr-refine ${enough && !busy ? '' : 'disabled'}>💠 Tinh luyện dòng ${refineLine + 1}</button>`;
        }
    } else {
        right = '<p class="gr-empty">Chưa có món đồ nào để rèn.</p>';
    }
    const sv = salvage && confirmSalvage ? (() => {
        const v = [...picked].map(id => data.salvage[id]).filter(Boolean);
        return `
        <div class="cp-confirm-backdrop">
            <div class="cp-confirm-box" role="dialog" aria-modal="true">
                <h3>♻️ Phân giải ${picked.size} món?</h3>
                <p class="cp-confirm-question">Đồ phân giải sẽ mất hẳn.</p>
                <p class="cp-confirm-meta">Nhận <b>🔷 ${fmt(v.reduce((a, x) => a + x.stone, 0))}</b> Đá Cường Hoá${v.some(x => x.refine) ? ` · <b>💠 ${v.reduce((a, x) => a + x.refine, 0)}</b> Đá Tinh Luyện` : ''}</p>
                <div class="cp-confirm-actions">
                    <button class="cp-btn-cancel" data-gr-salvage-cancel>Huỷ</button>
                    <button class="cp-btn-confirm" data-gr-salvage-yes>Phân giải</button>
                </div>
            </div>
        </div>`;
    })() : '';
    return `
    <div class="gr-modes">
        <button class="gr-chip${forgeMode === 'enhance' ? ' active' : ''}" data-gr-mode="enhance">🔨 Cường hoá</button>
        <button class="gr-chip${forgeMode === 'refine' ? ' active' : ''}" data-gr-mode="refine">💠 Tinh luyện</button>
        <button class="gr-chip${forgeMode === 'salvage' ? ' active' : ''}" data-gr-mode="salvage">♻️ Phân giải</button>
    </div>
    <div class="gr-equip-body">
        <section class="gr-panel gr-bag-panel">
            <h3>${salvage ? 'Chọn đồ để phân giải' : 'Chọn món đồ'} <small>${list.length} món</small></h3>
            ${list.length ? `<div class="gr-bag">${list.map(x => itemCard(x, { check: salvage })).join('')}</div>` : '<p class="gr-empty">Không có món nào.</p>'}
        </section>
        <section class="gr-panel gr-forge-panel">${right}</section>
    </div>
    ${sv}`;
}

function render() {
    if (!data) return;
    const box = el();
    const forgeOk = data.features.forge;
    box.innerHTML = `
    <div class="cp-container gr-container">
        <header class="cp-header">
            <div class="cp-title-row">
                <button class="cp-back-btn" data-gr-back>← Chọn ải</button>
                <div class="cp-title-text"><h1>🎒 TRANG BỊ</h1><p>Mặc đồ cho anh hùng · Lò rèn: cường hoá, tinh luyện, phân giải</p></div>
            </div>
            <div class="cp-resource-bar">
                <div class="cp-wallet-item gold" title="Vàng"><span class="cp-res-icon">🪙</span><b class="cp-res-val">${fmt(data.wallet.gold)}</b></div>
                <div class="cp-wallet-item stone" title="Đá Cường Hoá"><span class="cp-res-icon">🔷</span><b class="cp-res-val">${fmt(data.wallet.stone)}</b></div>
                <div class="cp-wallet-item" title="Đá Tinh Luyện"><span class="cp-res-icon">💠</span><b class="cp-res-val">${fmt(data.mats.refine_stone)}</b></div>
                <div class="cp-wallet-item" title="Bùa May Mắn"><span class="cp-res-icon">🍀</span><b class="cp-res-val">${fmt(data.mats.luck_charm)}</b></div>
            </div>
        </header>
        <div class="gr-tabs">
            <button class="cp-diff-tab${tab === 'equip' ? ' active' : ''}" data-gr-tab="equip"><div class="cp-diff-main"><span>🎒 <b>Trang bị</b></span></div></button>
            <button class="cp-diff-tab${tab === 'forge' ? ' active' : ''}${forgeOk ? '' : ' locked'}" data-gr-tab="forge">
                <div class="cp-diff-main"><span>${forgeOk ? '🔨' : '🔒'} <b>Lò rèn</b></span></div>
                ${forgeOk ? '' : '<div class="cp-diff-sub">Mở khi qua ải 10</div>'}</button>
        </div>
        ${notice ? `<div class="gr-notice ${notice.kind}" role="status"><span>${notice.text}</span><button class="cp-error-close" data-gr-notice-close title="Đóng">✕</button></div>` : ''}
        <div class="cp-scroll-body gr-body">${tab === 'forge' && forgeOk ? forgeTabHTML() : equipTabHTML()}</div>
        ${tab === 'equip' ? detailHTML() : ''}
    </div>`;
}

// ---------- bấm ----------
function onClick(e) {
    const t = e.target;
    const q = (sel) => t.closest(sel);
    if (q('[data-gr-back]')) { hideGear(); onBack?.(); return; }
    if (q('[data-gr-notice-close]')) { notice = null; render(); return; }
    const tb = q('[data-gr-tab]');
    if (tb) {
        if (tb.dataset.grTab === 'forge' && !data.features.forge) { notice = { kind: 'bad', text: '🔒 Lò rèn mở khi qua ải 10 ở mức Cốt truyện' }; render(); return; }
        tab = tb.dataset.grTab; detailId = null; notice = null; confirmSalvage = false; render(); return;
    }
    const hb = q('[data-gr-hero]');
    if (hb) { selHero = hb.dataset.grHero; render(); return; }
    const fb = q('[data-gr-filter]');
    if (fb) { slotFilter = fb.dataset.grFilter; render(); return; }
    // thẻ chi tiết: bấm nền tối hoặc nút Đóng
    if (t.matches('[data-gr-close-detail]') || q('button[data-gr-close-detail]')) { detailId = null; render(); return; }
    const off = q('[data-gr-equip-off]');
    if (off) { notice = { kind: 'bad', text: `⚠️ ${hero().name} mới Lv${hero().level} — món này mặc từ Lv${off.dataset.grEquipOff}` }; render(); return; }
    const eq = q('[data-gr-equip]');
    if (eq) { send(() => net.gearEquip(hero().id, eq.dataset.grEquip)); detailId = null; return; }
    const uq = q('[data-gr-unequip]');
    if (uq) { send(() => net.gearUnequip(hero().id, uq.dataset.grUnequip)); detailId = null; return; }
    const lk = q('[data-gr-lock]');
    if (lk) { send(() => net.gearLock(lk.dataset.grLock)); return; }
    const tf = q('[data-gr-to-forge]');
    if (tf) { forgeId = tf.dataset.grToForge; tab = 'forge'; forgeMode = 'enhance'; detailId = null; render(); return; }
    const md = q('[data-gr-mode]');
    if (md) { forgeMode = md.dataset.grMode; picked.clear(); confirmSalvage = false; notice = null; render(); return; }
    const pk = q('[data-gr-pick]');
    if (pk) {
        const v = pk.dataset.grPick;
        picked = new Set(v === 'none' ? [] : data.bag.filter(it => !it.locked && it.rarity <= Number(v)).map(it => it.id));
        render(); return;
    }
    if (q('[data-gr-salvage-open]')) { if (picked.size) { confirmSalvage = true; render(); } return; }
    if (q('[data-gr-salvage-cancel]')) { confirmSalvage = false; render(); return; }
    if (q('[data-gr-salvage-yes]')) { confirmSalvage = false; const ids = [...picked]; picked.clear(); send(() => net.gearSalvage(ids)); return; }
    if (q('[data-gr-enhance]')) { send(() => net.gearEnhance(forgeId, useCharm)); return; }
    if (q('[data-gr-refine]')) { send(() => net.gearRefine(forgeId, refineLine)); return; }
    const ib = q('[data-gr-item]');
    if (ib) {
        const id = ib.dataset.grItem;
        if (tab === 'forge') {
            if (forgeMode === 'salvage') { picked.has(id) ? picked.delete(id) : picked.add(id); }
            else forgeId = id;
        } else { detailId = id; notice = null; }
        render();
    }
}
function onChange(e) {
    if (e.target.matches('[data-gr-charm]')) { useCharm = e.target.checked; render(); }
    if (e.target.name === 'gr-line') { refineLine = Number(e.target.value); render(); }
}
function send(fn) {
    if (busy) return;
    busy = true;
    notice = null;
    fn();
    render();
}

// ---------- mở / đóng ----------
export function showGear(back) {
    onBack = back ?? onBack;
    tab = 'equip'; detailId = null; notice = null; confirmSalvage = false; picked.clear();
    net.gearOpen();
    el().style.display = 'flex';
    document.body.classList.add('selecting-squad');
    if (!data) el().innerHTML = '<div class="cp-container gr-container"><p class="gr-empty">Đang mở túi đồ…</p></div>';
    else render();
}
export function hideGear() {
    if (root) root.style.display = 'none';
}

export function setupGear() {
    socket.on('gearState', (d) => {
        data = d;
        busy = false;
        if (!data.heroes.some(h => h.id === selHero)) selHero = data.heroes[0]?.id ?? null;
        picked = new Set([...picked].filter(id => data.bag.some(it => it.id === id)));
        if (root?.style.display === 'flex') render();
    });
    socket.on('gearResult', (d) => {
        notice = { kind: d.action === 'enhance' && !d.success ? 'bad' : 'ok', text: d.text };
        if (d.action === 'enhance' && useCharm && !(data?.mats.luck_charm > 1)) useCharm = false;
    });
    socket.on('gearError', (d) => {
        busy = false;
        notice = { kind: 'bad', text: `⚠️ ${d.text}` };
        if (root?.style.display === 'flex') render();
    });
    socket.on('mainMenu', hideGear);
    socket.on('battleStart', hideGear);
}
