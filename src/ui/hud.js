// ============================================================
// HUD — thẻ thành viên (máu, orb, skill), bảng chỉ số 2 bên
// ============================================================
import { game, myId } from '../state.js';
import { ORB_COST, MAX_SQUAD , gameNow, timeState } from '../config.js';

const $ = (id) => document.getElementById(id);

function ensureCdOverlay(btn) {
    let el = btn.querySelector('.cd-overlay');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'cd-overlay';
    Object.assign(el.style, {
        position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.6)',
        display: 'none', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: '900', color: '#fff', borderRadius: '8px',
    });
    btn.appendChild(el);
    return el;
}

/** Tên nhân vật + tên kỹ năng trên thẻ (chỉ vẽ lại khi đổi nhân vật). Kỹ năng dùng bằng CLICK CHUỘT, không phím tắt. */
function fillCardInfo(card, member, def, i) {
    if (card.dataset.classId === member.classId) return;
    card.dataset.classId = member.classId;
    card.style.setProperty('--class-color', def.color || '#64748b');
    const icon = card.querySelector('.class-icon'); if (icon) icon.textContent = def.emoji || '⚔️';
    const name = card.querySelector('.class-name');
    if (name) name.innerHTML = `${def.name}${def.title ? ` <small>· ${def.title}</small>` : ''}`;
    const tag = card.querySelector('.range-tag'); if (tag) tag.textContent = def.className || (def.range === 'melee' ? 'Cận chiến' : 'Đánh xa');
    def.skills.forEach((sk, s) => {
        const btn = $(`btn-${i}-${s}`);
        if (!btn) return;
        const ic = btn.querySelector('.skill-icon');
        if (ic) ic.textContent = sk.name;
        const cost = btn.querySelector('.cost');
        if (cost) cost.textContent = `${sk.orbCost} orb`;
        btn.title = `${sk.name} — ${sk.orbCost} orb, hồi ${(sk.cooldown / 1000).toFixed(0)}s (click để ra lệnh)`;
    });
}

function updateMemberCard(member, i, now) {
    const card = $(`member-${i}`);
    if (!card) return;
    card.style.display = 'flex';

    // Máu
    card.querySelector('.hp-fill').style.width = member.maxHp > 0 ? `${(member.hp / member.maxHp) * 100}%` : '0%';

    // Orb
    const orbs = member.mp / ORB_COST;
    const full = Math.floor(orbs);
    const remainder = orbs - full;
    const orbBar = $(`orb-bar-${i}`);
    if (orbBar) {
        Array.from(orbBar.children).forEach((orb, idx) => {
            const pct = idx < full ? 100 : idx === full ? remainder * 100 : 0;
            orb.style.setProperty('--fill-pct', `${pct}%`);
        });
    }

    // Skill
    const def = game.classDefs?.[member.classId];
    if (!def) return;
    fillCardInfo(card, member, def, i);
    for (let s = 0; s < 3; s++) {
        const btn = $(`btn-${i}-${s}`);
        if (!btn) continue;
        const cost = def.skills[s].orbCost;
        const queueIdx = member.queuedSkills.indexOf(s);
        const isQueued = queueIdx !== -1;

        // Đếm ngược hồi chiêu
        const cd = ensureCdOverlay(btn);
        const remainingCd = Math.max(0, (member.skillCooldowns[s] - now) / 1000 / timeState.scale); // giây thật
        if (remainingCd > 0) {
            cd.style.display = 'flex';
            cd.textContent = remainingCd.toFixed(1) + 's';
        } else {
            cd.style.display = 'none';
        }

        // Thứ tự trong hàng đợi
        const qNum = btn.querySelector('.queue-num');
        if (qNum) {
            qNum.style.display = isQueued ? 'flex' : 'none';
            if (isQueued) qNum.textContent = queueIdx + 1;
        }

        let cls = 'skill-btn' + (s === 2 ? ' ultimate' : '');
        if (!member.alive) {
            cls += ' disabled';
        } else {
            const isReady = member.mp >= cost * ORB_COST && now > member.skillCooldowns[s];
            if (isReady) cls += ' ready';
            if (isQueued) cls += ' queued';
            if (!isReady && !isQueued) cls += ' disabled';
        }
        btn.className = cls;
    }
}

// ------------------------------------------------------------
// Bảng chỉ số
// ------------------------------------------------------------
/** Một dòng chỉ số: xanh = đang được buff, đỏ = bị debuff */
function statRow(label, effVal, baseVal, suffix = '', format = null) {
    const val = format ? format(effVal) : effVal;
    let color = '#94a3b8';
    if (effVal > baseVal) color = '#4ade80';
    else if (effVal < baseVal) color = '#ef4444';
    return `<div style="display:flex; justify-content:space-between;"><span>${label}</span> <b style="color:${color}">${val}${suffix}</b></div>`;
}

function statusTags(member, now) {
    const active = (member.statusEffects || []).filter(ef => now < ef.endTime);
    if (active.length === 0) return '';
    const tags = active.map(ef => {
        const remaining = ((ef.endTime - now) / 1000 / timeState.scale).toFixed(1);
        if (ef.type === 'seal') return `<span style="color:#ef4444;font-size:11px;">🔴 Ấn (${remaining}s)</span>`;
        if (ef.type === 'stealth') return `<span style="color:#4ade80;font-size:11px;">🟢 Tàng Hình (${remaining}s)</span>`;
        if (ef.type === 'stun') return `<span style="color:#facc15;font-size:11px;">💫 Choáng (${remaining}s)</span>`;
        if (ef.type === 'taunted') return `<span style="color:#f87171;font-size:11px;">🦁 Sư Tử Gầm${ef.defDown ? ` -${Math.round(ef.defDown * 100)}% thủ` : ''} (${remaining}s)</span>`;
        if (ef.type === 'guard') return `<span style="color:#fcd34d;font-size:11px;">🛡️ Dựng Khiên (${remaining}s)</span>`;
        if (ef.type === 'guard_aura') return `<span style="color:#fcd34d;font-size:11px;">✨ Khiên Hộ Đội +${Math.round((ef.value ?? 0.2) * 100)}% thủ (${remaining}s)</span>`;
        if (ef.type === 'knocked') return `<span style="color:#fb923c;font-size:11px;">💥 Bị hất văng</span>`;
        if (ef.type === 'fortress') return `<span style="color:#fcd34d;font-size:11px;">🛡️ Thành Trì (${remaining}s)</span>`;
        return `<span style="font-size:11px;">${ef.type} (${remaining}s)</span>`;
    });
    return `<div style="margin-top:6px;padding:4px 6px;background:rgba(0,0,0,0.3);border-radius:6px;">${tags.join(' ')}</div>`;
}

// ------------------------------------------------------------
// Thu gọn / mở rộng bảng chỉ số (nhớ theo trình duyệt). Mặc định: phe mình mở, phe địch thu gọn.
// ------------------------------------------------------------
const STAT_KEY = 'loc.statPanels';
let statState = {};
try { statState = JSON.parse(localStorage.getItem(STAT_KEY) || '{}'); } catch { statState = {}; }
const isCollapsed = (key, side) => statState[key] ?? (side === 'right');
export function toggleStatPanel(key, side) {
    statState[key] = !isCollapsed(key, side);
    try { localStorage.setItem(STAT_KEY, JSON.stringify(statState)); } catch { /* bỏ qua */ }
}
/** Thu gọn / mở rộng TẤT CẢ bảng của một phe */
export function setAllStatPanels(side, collapsed) {
    for (const k of Object.keys(statState)) if (k.startsWith(side + '-')) delete statState[k];
    for (let i = 0; i < 12; i++) statState[`${side}-${i}`] = collapsed;
    try { localStorage.setItem(STAT_KEY, JSON.stringify(statState)); } catch { /* bỏ qua */ }
}

function miniHpBar(m) {
    const pct = m.maxHp > 0 ? Math.max(0, Math.min(1, m.hp / m.maxHp)) : 0;
    return `<div style="height:5px;background:#1e293b;border-radius:3px;overflow:hidden;margin-top:4px;"><div style="width:${(pct * 100).toFixed(1)}%;height:100%;background:#22c55e;"></div></div>`;
}

function statPanelHTML(m, now, key, side) {
    const collapsed = isCollapsed(key, side);
    const btn = `<button class="stat-toggle" data-stat-toggle="${key}" data-stat-side="${side}" title="${collapsed ? 'Mở rộng' : 'Thu gọn'}">${collapsed ? '+' : '−'}</button>`;
    if (collapsed) {
        return `
        <div class="stat-panel-card collapsed">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <b style="font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.name}</b>${btn}
            </div>
            ${miniHpBar(m)}
            ${statusTags(m, now)}
        </div>`;
    }
    const eff = m.effectiveStats || {};
    const base = m.baseStats || {};
    const row = (label, key, suffix, format) => statRow(label, eff[key] ?? m[key], base[key] ?? m[key], suffix, format);
    const pct = v => v / 10;
    return `
        <div class="stat-panel-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <b style="font-size:16px;">${m.name}</b>${btn}
            </div>
            <div style="font-size:12px; line-height:1.9;">
                ${row('P.ATK', 'pAtk')}
                ${row('M.ATK', 'mAtk')}
                <div style="display:flex; justify-content:space-between;"><span>HP</span> <b style="color:#ef4444">${Math.floor(m.hp)}/${m.maxHp}</b></div>
                ${row('P.DEF', 'pDef')}
                ${row('M.DEF', 'mDef')}
                <hr style="border:0; border-top:1px solid #334155; margin:6px 0;">
                ${row('Crit Rate', 'crit', '%', pct)}
                ${row('Crit DMG', 'critDmg', '', v => '×' + (1.5 + v / 1000).toFixed(2).replace(/0$/, ''))}
                ${row('Dodge', 'dodge', '%', pct)}
                ${row('Block', 'block', '%', pct)}
                ${row('Penetration', 'pen', '%', pct)}
                ${row('Accuracy', 'acc', '%', pct)}
                <hr style="border:0; border-top:1px solid #334155; margin:6px 0;">
                ${row('Tốc đánh (ms)', 'atkSpeed')}
                ${row('Speed (Move)', 'moveSpeed')}
                ${row('MP Recov/Atk', 'mpAtk')}
            </div>
            ${statusTags(m, now)}
        </div>
    `;
}

// ------------------------------------------------------------
export function updateHUD(players) {
    const me = myId();
    if (!me || !players?.[me]) return;
    const now = gameNow();
    const squad = players[me].squad;

    squad.forEach((member, i) => updateMemberCard(member, i, now));
    for (let i = squad.length; i < MAX_SQUAD; i++) {
        const card = $(`member-${i}`);
        if (card) card.style.display = 'none';
    }

    let left = '', right = '';
    Object.values(players).forEach(pd => {
        pd.squad.forEach((member, i) => {
            if (!member.alive) return;
            const html = statPanelHTML(member, now, `${pd.side}-${i}`, pd.side);
            if (pd.side === 'left') left += html; else right += html;
        });
    });
    const head = (side) => `<div class="stat-head"><span>📊 Chỉ số</span>
        <button class="stat-toggle" data-ui-scale="${side}-stats" data-step="-1" title="Thu nhỏ">🔍−</button>
        <button class="stat-toggle" data-ui-scale="${side}-stats" data-step="1" title="Phóng to">🔍+</button>
        <button class="stat-toggle" data-stat-all="${side}" data-all="0" title="Mở hết">⊞</button>
        <button class="stat-toggle" data-stat-all="${side}" data-all="1" title="Thu gọn hết">⊟</button></div>`;
    left = head('left') + left;
    right = head('right') + right;
    const leftEl = $('left-stats');
    if (leftEl) leftEl.innerHTML = left;
    const rightEl = $('right-stats');
    if (rightEl) rightEl.innerHTML = right;

    const autoBtn = $('btn-auto');
    if (autoBtn) {
        const on = !!players[me].autoMode;
        autoBtn.textContent = on ? 'AUTO MODE: ON' : 'AUTO MODE: OFF';
        autoBtn.classList.toggle('active', on);
    }
}
