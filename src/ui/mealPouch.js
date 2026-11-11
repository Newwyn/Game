// ============================================================
// 🎒 TÚI ĐỒ ĂN
//   1) Ở bảng chọn đội (src/ui/squadSelect.js): xếp tối đa 3 món trước khi vào ải cốt truyện / ải nhánh
//   2) Trong trận: 3 nút nhỏ phía trên thanh kỹ năng. Bấm 1 món rồi bấm thẻ anh hùng để cho ăn;
//      bấm món đó lần nữa = tự chọn người ít máu nhất (món hồi sinh: người đã gục). Mỗi món 1 lần / trận, cách nhau 8 giây.
//   Dữ liệu: 'campaignState'.meals · 'cookState' · 'battleStart'.pouch · 'useDish' -> 'dishUsed' / 'dishResult' (server.js)
// ============================================================
import { socket } from '../net/socket.js';
import { itemIcon } from './itemIcons.js';
import '../styles/cooking.css';

const HERO = { warrior: 'Rok', assassin: 'Jessica', priest: 'Seraphine', archer: 'Lyra' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let meals = null;      // { open, dishes: [{ id, name, n, fav, effect }], pouch: [id], max }
let rerender = null;   // bảng chọn đội đang mở: vẽ lại khi túi đổi
socket.on('campaignState', (d) => { if (d?.meals) { meals = d.meals; rerender?.(); } });
socket.on('cookState', (d) => { if (d?.dishes) { meals = { open: d.unlocked, dishes: d.dishes, pouch: d.pouch, max: d.pouchMax, cooldown: d.cooldown }; rerender?.(); } });

/** Dải "Túi đồ ăn" trong bảng chọn đội — '' nếu chưa mở Nấu ăn hoặc ải này không dùng được món (hầm ngục) */
export function pouchEditorHTML(stageId, onChange) {
    rerender = onChange ?? null;
    if (!meals?.open || !/^c\d+-/.test(String(stageId ?? ''))) return '';
    const left = Object.fromEntries(meals.dishes.map(d => [d.id, d.n]));
    for (const id of meals.pouch) left[id]--;
    const name = (id) => meals.dishes.find(d => d.id === id)?.name ?? id;
    const slots = Array.from({ length: meals.max }, (_, i) => meals.pouch[i] ?? null);
    return `<div class="mp-edit"><b class="mp-edit-title">🎒 Túi đồ ăn <small>${meals.pouch.length}/${meals.max}</small></b>
        <div class="mp-edit-slots">${slots.map((id, i) => id ? `<button type="button" class="mp-slot on" data-mp-unpack="${i}" title="${esc(name(id))} (bấm để bỏ ra)">${itemIcon(`dish_${id}`, 'mp-ic')}</button>` : '<span class="mp-slot"></span>').join('')}</div>
        <div class="mp-edit-list">${meals.dishes.length ? meals.dishes.map(d => `<button type="button" class="mp-chip" data-mp-pack="${d.id}" title="${esc(d.effect)}${d.fav ? ` · Món tủ của ${HERO[d.fav]}` : ''}" ${left[d.id] > 0 && meals.pouch.length < meals.max ? '' : 'disabled'}>${itemIcon(`dish_${d.id}`, 'mp-chip-ic')}${esc(d.name)} ×${d.n}${d.fav ? ' <i>♥</i>' : ''}</button>`).join('')
            : '<small>Chưa có món nào. Nấu ở bếp cô Lena hoặc lửa trại trên bản đồ.</small>'}</div></div>`;
}
/** Xử lý bấm trong dải túi đồ ăn -> true nếu đã xử lý */
export function onPouchClick(e) {
    const p = e.target.closest('[data-mp-pack]'), u = e.target.closest('[data-mp-unpack]');
    if (!meals || (!p && !u)) return false;
    meals.pouch = p ? [...meals.pouch, p.dataset.mpPack].slice(0, meals.max) : meals.pouch.filter((_, i) => i !== Number(u.dataset.mpUnpack));
    socket.emit('pouchSet', { list: meals.pouch });
    rerender?.();
    return true;
}

// ---------- trong trận ----------
let bar = null, pouch = null, armed = null, cdEnd = 0, tip = null, tipAt = 0, timer = 0;
function barEl() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'meal-pouch';
    bar.addEventListener('click', (e) => {
        const b = e.target.closest('[data-mp-use]');
        if (!b || b.disabled) return;
        const slot = Number(b.dataset.mpUse);
        if (armed === slot) { armed = null; socket.emit('useDish', { slot }); }   // bấm lần 2: tự chọn người ăn
        else { armed = slot; say('Bấm vào thẻ anh hùng để cho ăn. Bấm món lần nữa để tự chọn người ít máu nhất.'); }
        draw();
    });
    document.body.appendChild(bar);
    // đang cầm 1 món: bấm vào thẻ anh hùng = cho người đó ăn (chặn không cho cú bấm này kích kỹ năng)
    document.addEventListener('click', (e) => {
        if (armed == null || !pouch) return;
        const card = e.target.closest?.('.member-card');
        if (!card) return;
        const idx = Number(String(card.id).replace('member-', ''));
        if (!Number.isInteger(idx)) return;
        e.preventDefault(); e.stopPropagation();
        socket.emit('useDish', { slot: armed, memberIndex: idx });
        armed = null; draw();
    }, true);
    return bar;
}
function say(t) { tip = t; tipAt = performance.now(); draw(); setTimeout(() => { if (performance.now() - tipAt >= 3400) { tip = null; draw(); } }, 3500); }
function draw() {
    if (!bar) return;
    const show = !!pouch?.slots.length;
    bar.style.display = show ? 'flex' : 'none';
    document.body.classList.toggle('meal-armed', show && armed != null);
    if (!show) return;
    const cd = Math.max(0, Math.ceil((cdEnd - performance.now()) / 1000));
    bar.innerHTML = `<span class="mp-label">🎒</span>${pouch.slots.map((s, i) => `<button type="button" class="mp-btn${armed === i ? ' armed' : ''}${s.used ? ' used' : ''}" data-mp-use="${i}" ${s.used || cd > 0 ? 'disabled' : ''}
            title="${esc(s.name)}: ${esc(s.effect)}${s.fav ? ` · Món tủ của ${HERO[s.fav]} (+50%)` : ''}">${itemIcon(`dish_${s.id}`, 'mp-ic')}${s.fav ? '<i class="mp-heart">♥</i>' : ''}${!s.used && cd > 0 ? `<b class="mp-cd">${cd}</b>` : ''}</button>`).join('')}
        ${tip ? `<span class="mp-tip">${esc(tip)}</span>` : ''}`;
    clearTimeout(timer);
    if (cd > 0) timer = setTimeout(draw, 500);
}
/** Dòng chữ bay lên trên thẻ anh hùng vừa ăn (+ trái tim nếu là món tủ) */
function float(memberIndex, text, fav) {
    const card = document.getElementById(`member-${memberIndex}`), r = card?.getBoundingClientRect();
    const fx = document.createElement('div');
    fx.className = `mp-float${fav ? ' fav' : ''}`;
    fx.innerHTML = `${fav ? '<span class="mp-float-heart">♥</span>' : ''}${esc(text)}`;
    fx.style.left = `${r ? r.left + r.width / 2 : window.innerWidth / 2}px`;
    fx.style.top = `${r ? r.top - 6 : window.innerHeight * 0.6}px`;
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 2200);
}
socket.on('battleStart', (d) => { pouch = d?.pouch?.slots?.length ? d.pouch : null; armed = null; cdEnd = 0; tip = null; barEl(); draw(); });
socket.on('dishUsed', (d) => {
    if (d.pouch) pouch = d.pouch;
    cdEnd = performance.now() + (d.pouch?.cooldown ?? 8000);
    const parts = [];
    if (d.revived) parts.push('Sống lại!');
    if (d.healed && !d.revived) parts.push(`+${Math.round(d.healed).toLocaleString('vi-VN')} máu`);
    if (d.orb) parts.push(`+${Math.round(d.orb * 10) / 10} Orb`);
    if (d.effect?.cleanse) parts.push('Giải hiệu ứng xấu');
    if (d.effect?.atk) parts.push(`+${Math.round(d.effect.atk * 100)}% công`);
    if (d.effect?.def) parts.push(`+${Math.round(d.effect.def * 100)}% thủ`);
    float(d.memberIndex, `${d.name}${parts.length ? `: ${parts.join(' · ')}` : ''}${d.fav ? ' (món tủ!)' : ''}`, d.fav);
    draw();
});
socket.on('dishResult', (d) => { if (!d.ok) say(d.text); });
for (const ev of ['stageResult', 'mainMenu', 'squadSelect']) socket.on(ev, () => { pouch = null; armed = null; draw(); });   // hết trận / về menu: cất túi
