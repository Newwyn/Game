// ============================================================
// 🛠️ TOOL PHE MÌNH (test) — gom mọi công cụ của phe mình vào 1 bảng:
//   · Chung: bơm mana, skill miễn phí, bất tử
//   · Cả đội: mốc nhanh Lv1 / Lv20 S / Lv40 SS / Lv60 SSS
//   · Từng nhân vật: bật/tắt ra trận, level, bậc, chỉ số xem trước, thiên phú, nút Đột phá (luồng thật)
// Chỉnh trong tool áp ngay vào trận, KHÔNG cần điều kiện. Nút "⬆ Đột phá" là luồng thật: kiểm tra điều kiện rồi mới lên.
// Server gửi 'progressUpdate' mỗi khi tiến trình đổi -> vẽ lại phần nhân vật.
// ============================================================
import { socket } from '../net/socket.js';

let data = null;          // gói progressUpdate mới nhất
let msg = null;           // { ok, text, t }
let disabled = new Set(); // nhân vật đang TẮT (không ra trận)
const collapsedHeroes = new Set();

export const progressNet = {
    set: (classId, patch) => socket.emit('debugProgress', { classId, ...patch }),
    rankUp: (classId) => socket.emit('rankUp', { classId }),
};

/** Bảng tra (bậc, tộc, class) cho HUD */
export const progressMeta = () => data?.meta ?? null;

/** Danh sách nhân vật đang tắt (server gửi qua battleStart / memberToggles) */
export function setDisabledHeroes(list = []) {
    disabled = new Set(list);
    renderProgressTool();
}

const RANK_COLORS = ['#94a3b8', '#60a5fa', '#c084fc', '#fbbf24'];
const pct = (v) => `${(v / 10).toFixed(v % 10 ? 1 : 0)}%`;

export function rankBadge(rank, name) {
    const c = RANK_COLORS[rank] ?? '#94a3b8';
    const glow = rank >= 3 ? 'box-shadow:0 0 8px rgba(251,191,36,.7);' : '';
    return `<span class="pt-rank" style="border-color:${c};color:${c};${glow}">${name}</span>`;
}

function talentsHTML(h) {
    const list = h.talents ?? [];
    if (!list.length) return '';
    return `<div class="pt-talents">${list.map(t => {
        const lock = !t.level;
        const lvTag = lock ? `<span class="pt-lock">🔒 mở ở Lv${t.unlockAt}</span>` : `<span class="pt-tlv">Lv${t.level}/${t.max}</span>`;
        return `<div class="${lock ? 'locked' : ''}"><span class="pt-tn">Thiên phú ${t.slot}</span> <b>${t.name}</b> ${lvTag}<br><small>${t.desc}</small></div>`;
    }).join('')}</div>`;
}

function heroCard(id, h) {
    const meta = data.meta;
    const race = meta.races[h.race];
    const cls = meta.classes[h.classGroup];
    const st = h.stats;
    const on = !disabled.has(id);
    const open = on && !collapsedHeroes.has(id);
    const t2 = (h.talents ?? []).find(t => t.slot === 2);
    const uniq = t2 ? `<span>Thiên phú 2 · ${t2.name} <b>${t2.level ? `Lv${t2.level}` : '🔒 Lv40'}</b></span>` : '';
    const rankBtns = meta.ranks.map(r => `<button class="pt-seg${r.id === h.rank ? ' on' : ''}" style="--c:${RANK_COLORS[r.id]}" data-pt="rank" data-id="${id}" data-v="${r.id}">${r.name}</button>`).join('');
    const chk = h.rankCheck;
    const rankInfo = chk.maxed ? '<span class="pt-ok">Đã đạt SSS (tối đa)</span>'
        : chk.ok ? `<span class="pt-ok">✔ Đủ điều kiện lên ${chk.next}</span>`
        : `<span class="pt-miss">✖ ${chk.missing.join(' · ')}</span>`;
    return `
    <div class="pt-hero${on ? '' : ' off'}">
        <div class="pt-hero-top">
            <span class="pt-name" data-pt="fold" data-id="${id}">${race?.emoji ?? ''} <b>${h.name}</b> <span class="pt-sub">${race?.name ?? ''} · ${cls?.name ?? ''}</span></span>
            ${rankBadge(h.rank, h.rankName)}
            <span class="pt-lvmini">Lv${h.level}</span>
            ${on ? `<button class="pt-kill" data-action="debugKill" data-arg="${id}" title="Test: hạ gục ngay (thử hồi sinh)">💀</button>` : ''}
            <span class="pt-fold" data-pt="fold" data-id="${id}">${open ? '▾' : '▸'}</span>
        </div>
        ${open ? `
        <div class="pt-row">
            <button class="pt-btn" data-pt="addLevel" data-id="${id}" data-v="-10">−10</button>
            <button class="pt-btn" data-pt="addLevel" data-id="${id}" data-v="-1">−1</button>
            <div class="pt-lv"><small>Level</small><b>${h.level}</b><small>/ ${meta.maxLevel}</small><span class="pt-skill">Skill Lv${h.skillLevel}</span></div>
            <button class="pt-btn" data-pt="addLevel" data-id="${id}" data-v="1">+1</button>
            <button class="pt-btn" data-pt="addLevel" data-id="${id}" data-v="10">+10</button>
        </div>
        <input class="pt-slider" type="range" min="1" max="${meta.maxLevel}" value="${h.level}" data-pt-slider="${id}">
        <div class="pt-segs">${rankBtns}</div>
        <div class="pt-stats">
            <span>HP <b>${st.maxHp.toLocaleString()}</b></span>
            <span>${st.mAtk > st.pAtk ? 'M.ATK' : 'P.ATK'} <b>${Math.max(st.pAtk, st.mAtk)}</b></span>
            <span>P.DEF <b>${st.pDef}</b></span>
            <span>M.DEF <b>${st.mDef}</b></span>
            <span>Chí mạng <b>${pct(st.crit)}</b></span>
            <span>Né <b>${pct(st.dodge)}</b></span>
        </div>
        ${talentsHTML(h)}
        <div class="pt-row pt-real">
            <button class="pt-btn gold" data-pt="rankUp" data-id="${id}" title="Luồng thật: kiểm tra điều kiện rồi mới lên bậc">⬆ Đột phá</button>
            <div class="pt-check">${rankInfo}</div>
        </div>` : ''}
    </div>`;
}

export function renderProgressTool() {
    const box = document.getElementById('progress-tool-body');
    if (!box || !data) return;
    const presets = ['Lv1 Thường', 'Lv20 S', 'Lv40 SS', 'Lv60 SSS'].map((t, i) =>
        `<button class="pt-seg" style="--c:${RANK_COLORS[i]}" data-pt="preset" data-id="all" data-v="${i}">${t}</button>`).join('');
    const showMsg = msg && performance.now() - msg.t < 6000;
    const ids = Object.keys(data.heroes);
    const onIds = ids.filter(id => !disabled.has(id));
    // Đội hình trong trận: bấm để thêm / bớt (test). Chỉ nhân vật đang ra trận mới hiện bảng chi tiết bên dưới.
    const roster = ids.map(id => {
        const h = data.heroes[id], on = !disabled.has(id);
        return `<button class="pt-roster${on ? ' on' : ''}" data-action="toggleMember" data-arg="${id}" title="${on ? 'Bớt khỏi trận' : 'Thêm vào trận'}">
            ${data.meta.races[h.race]?.emoji ?? ''} ${h.name}<span>${on ? '✓' : '+'}</span></button>`;
    }).join('');
    box.innerHTML = `
        <div class="pt-section">Cả đội</div>
        <div class="pt-segs">${presets}</div>
        <div class="pt-section">Đội hình trong trận <span class="pt-cnt">${onIds.length}/4</span></div>
        <div class="pt-rosters">${roster}</div>
        ${onIds.map(id => heroCard(id, data.heroes[id])).join('')}
        ${showMsg ? `<div class="pt-msg ${msg.ok ? 'ok' : 'bad'}">${msg.text}</div>` : ''}`;
}

function onClick(e) {
    const b = e.target.closest('[data-pt]');
    if (!b || !document.getElementById('progress-tool')?.contains(b)) return;
    const { pt, id } = b.dataset;
    const v = b.dataset.v;
    if (pt === 'fold') { collapsedHeroes.has(id) ? collapsedHeroes.delete(id) : collapsedHeroes.add(id); renderProgressTool(); return; }
    if (pt === 'addLevel') progressNet.set(id, { addLevel: Number(v) });
    else if (pt === 'rank') progressNet.set(id, { rank: Number(v) });
    else if (pt === 'preset') progressNet.set(id, { preset: Number(v) });
    else if (pt === 'rankUp') progressNet.rankUp(id);
}

export function setupProgressTool() {
    socket.on('progressUpdate', (d) => { data = d; renderProgressTool(); });
    socket.on('progressMsg', (m) => { msg = { ...m, t: performance.now() }; renderProgressTool(); setTimeout(renderProgressTool, 6100); });
    document.addEventListener('click', onClick);
    document.addEventListener('change', (e) => {
        const id = e.target?.dataset?.ptSlider;
        if (id) progressNet.set(id, { level: Number(e.target.value) });
    });
    // kéo thanh trượt: hiện số level ngay (thả tay mới gửi)
    document.addEventListener('input', (e) => {
        const el = e.target;
        if (!el?.dataset?.ptSlider) return;
        const lv = el.closest('.pt-hero')?.querySelector('.pt-lv b');
        if (lv) lv.textContent = el.value;
    });
}
