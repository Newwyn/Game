// ============================================================
// HUD — thẻ thành viên (máu, orb, skill), bảng chỉ số 2 bên
// ============================================================
import { progressMeta, rankBadge } from './progressTool.js';
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
        if (cost) cost.textContent = sk.orbCost ? `${sk.orbCost} orb` : 'Miễn phí';
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
        // Zerith: lướt lần 2 lúc Đêm Tử Thần miễn phí (hiệu ứng reaper_echo)
        const free = def.skills[s].type === 'reaper_dash' && member.statusEffects?.some(e => e.type === 'reaper_echo' && e.endTime > now);
        const cost = free ? 0 : def.skills[s].orbCost;
        const costEl = btn.querySelector('.cost');
        const hpc = def.skills[s].hpCost ? ` +${Math.round(def.skills[s].hpCost * 100)}%♥` : '';   // Brakk: tốn thêm % máu
        const costTxt = free ? 'MIỄN PHÍ' : def.skills[s].orbCost ? `${def.skills[s].orbCost} orb${hpc}` : 'Miễn phí';
        if (costEl && costEl.textContent !== costTxt) costEl.textContent = costTxt;
        btn.classList.toggle('free', !!free);
        const queueIdx = member.queuedSkills.indexOf(s);
        const isQueued = queueIdx !== -1;

        // Đếm ngược hồi chiêu
        const cd = ensureCdOverlay(btn);
        // Hồi chiêu chỉ bắt đầu chạy khi diễn xong động tác (server cộng thêm thời gian diễn) -> trong lúc diễn / niệm giữ nguyên số đầy
        const cdMs = Math.min(member.skillCooldowns[s] - now, def.skills[s].cooldown);
        const remainingCd = Math.max(0, cdMs / 1000 / timeState.scale); // giây thật
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

        let cls = 'skill-btn' + (s === 2 ? ' ultimate' : '') + (free ? ' free' : '');
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

/**
 * Hiệu ứng -> [biểu tượng, màu, tên, mô tả, xấu?]. Mỗi hiệu ứng hiện thành 1 ICON tròn; vòng tối quét dần theo thời gian
 * còn lại (hết vòng = hết hiệu ứng). Rê chuột vào icon -> bảng thông tin (data-tip).
 */
function effectInfo(ef, m) {
    const pc = (v) => Math.round((v ?? 0) * 100);
    const pm = (v) => Math.round((v ?? 0) / 10);
    switch (ef.type) {
        case 'seal': return ['🔴', '#ef4444', 'Ấn', '−15% P.DEF · Đột Kích của Jessica lao tới', true];
        case 'stealth': return ['👤', '#4ade80', ef.shadow ? 'Bóng Ẩn' : 'Tàng Hình', 'Không bị chọn làm mục tiêu · chỉ trúng đòn DIỆN RỘNG · +20% P.ATK · +10% tốc đánh'];
        case 'stun': return ['💫', '#facc15', 'Choáng', 'Không thể di chuyển, đánh, niệm', true];
        case 'taunted': return ef.by === 'Brakk'
            ? ['📢', '#fb923c', 'Tiếng Hét Bảo Hộ', 'Bị Brakk khiêu khích, buộc đánh Brakk', true]
            : ['🦁', '#f87171', 'Sư Tử Gầm', `Bị khiêu khích, buộc đánh ${ef.by ?? 'Rok'}${ef.defDown ? ` · −${pc(ef.defDown)}% thủ` : ''}`, true];
        case 'guard': return ['🛡️', '#fcd34d', 'Dựng Khiên', ef.maxHp ? `Khiên ${Math.ceil(ef.hp)}/${ef.maxHp}` : 'Đang dựng khiên'];
        case 'guard_aura': return ['🔰', '#fcd34d', 'Khiên Hộ Đội', `+${pc(ef.value ?? 0.2)}% P.DEF / M.DEF`];
        case 'windspirit': return ['🌪️', '#5eead4', 'Vệ Thần Gió', `Bay (né đòn dưới đất) · tầm +${ef.rangeUp ?? 0} · +${pm(ef.critUp)}% chí mạng · +${pm(ef.critDmgUp)}% ST chí mạng`];
        case 'praying': return ['🙏', '#fde047', 'Thánh Niệm', 'Bay lên niệm · hồi máu cả đội mỗi giây · KN1/KN2 hồi nhanh'];
        case 'pray_blessing': return ['✨', '#facc15', 'Phước Thánh Niệm', `+${pc(ef.dmgUp)}% sát thương${ef.defUp ? ` · +${pc(ef.defUp)}% thủ` : ''}`];
        case 'holy_shield': return ef.dormant
            ? ['💠', '#fef08a', 'Hiệu ứng khiên', `Chỉ còn buff của khiên${ef.winged ? ' (cánh: +thủ, kháng khống chế)' : ''}`]
            : ['💠', '#fef08a', 'Khiên Ánh Sáng', `Khiên ${Math.round(ef.hp)}/${ef.maxHp}${ef.winged ? ' · cánh: +thủ, kháng khống chế' : ''}`];
        case 'tenacity_on': return ['🪨', '#fcd34d', 'Kiên Cường', `−${pm(ef.value ?? m.tenacity)}% sát thương nhận & thời gian khống chế`];
        case 'kill_intent': return ['🗡️', '#f87171', 'Sát Ý', `Đòn vừa rồi +${pm(m.killIntent)}% sát thương (hồi 10s)`];
        case 'iron_regen': return ['🔗', '#fcd34d', 'Ý Chí Thép', `Hồi ${pc(ef.regen)}% máu mỗi giây · máu dưới 30%: +${pm(ef.block)}% chặn đòn`];
        case 'revive_guard': return ['😇', '#fde68a', 'Hộ Mệnh', 'Vừa được hồi sinh: miễn mọi sát thương'];
        case 'fire_ward': return ['🔥', '#fb923c', 'Giáp Lửa', `Khiên ${Math.round(ef.hp)}/${ef.maxHp} · +${pc(ef.mDefUp)}% M.DEF · −${pc(ef.ccResist)}% khống chế · khiên hết: nổ choáng xung quanh`];
        case 'judged': return ['⚖️', '#a855f7', 'Thần Chết phán quyết', 'Bị nhấc lên không trung: có khiên thì vỡ khiên, không khiên thì chết', true];
        case 'thunder_blessing': return ['⚡', '#c4a1ff', 'Sấm phù trợ', `+${pm(ef.dodgeUp)}% né tránh`];
        case 'wind_blessing': return ['🍃', '#99f6e4', 'Gió dẫn đường', `+${pm(ef.accUp)}% chính xác`];
        case 'fire_god': return ['🔥', '#fb923c', 'Hỏa Thần Giáng Lâm',
            `+${pc(ef.mAtkUp)}% M.ATK · Khiên Lửa +${pc(ef.mDefUp)}% M.DEF, −${pc(ef.ccResist)}% khống chế${m.fireHaste ? ` · +${pm(m.fireHaste)}% tốc đánh` : ''} · chưởng ${(ef.count ?? 0) % 3}/3`];
        case 'mdef_break': return ['🔻', '#a78bfa', 'Phá giáp phép', `−${Math.round((ef.stacks ?? 0) * (ef.per ?? 0.05) * 100)}% M.DEF (${ef.stacks ?? 0} tầng)`, true];
        case 'knocked': return ['💥', '#fb923c', 'Bị hất văng', 'Đang bay ra sau', true];
        case 'knockup': return ['🌀', '#c084fc', 'Bị hất tung', 'Bay lên không, không thể làm gì', true];
        case 'death_mark': return ['☠️', '#fb7185', 'Ấn Tử', `−${pc(ef.healCut)}% hồi máu nhận được · Lưỡi Hái Hất Hồn lúc Đêm Tử Thần phá sạch khiên · máu chạm ngưỡng tử ${pc(ef.execute)}% (vạch đỏ trên thanh máu) -> Thần Chết phán quyết`, true];
        case 'reaper_echo': return ['↺', '#c084fc', 'Lướt lần 2', 'Lưỡi Hái Xuyên Hồn đã hồi — lướt thêm 1 lần MIỄN PHÍ'];
        case 'reaper_form': return ['💀', '#a855f7', 'Đêm Tử Thần',
            `Hộ Vệ Thần Chết chiến đấu cùng · bay · +${pc(ef.dmgUp)}% sát thương · +${pc(ef.atkSpeedUp)}% tốc đánh · −${pc(ef.ccResist)}% khống chế · KHÔNG THỂ CHẾT`];
        case 'fortress': return ['🏰', '#fcd34d', 'Thành Trì', 'Giảm sát thương nhận'];
        case 'giant_form': {
            const immune = Math.max(0, (ef.immuneUntil ?? 0) - gameNow());
            return ['🐉', '#f97316', 'Thần Lực Khổng Lồ',
                `+máu tối đa · +${pc(ef.defUp)}% P.DEF/M.DEF · +${pc(ef.dmgUp)}% sát thương${immune > 0 ? ` · MIỄN KHỐNG CHẾ còn ${(immune / 1000 / timeState.scale).toFixed(1)}s` : ''} · móc ngược ${(ef.autos ?? 0) % ((ef.every ?? 3) + 1)}/${ef.every ?? 3}`];
        }
        case 'brakk_shield': return ef.dormant
            ? ['🛡', '#fdba74', 'Khiên Vảy Rồng', 'Đang có khiên khác dày hơn hứng đòn']
            : ['🛡', '#fdba74', 'Khiên Vảy Rồng', `Khiên ${Math.round(ef.hp)}/${ef.maxHp} · cộng dồn Chấn Địa + Khí Thế Đấu Trường`];
        case 'grabbed': return ['✊', '#f97316', 'Bị túm', 'Bị Brakk nhấc bổng — sắp bị quật xuống đất', true];
        default: return ['❔', '#94a3b8', ef.type, ''];
    }
}
// Thời lượng gốc của hiệu ứng không có `duration`: ghi lại lúc mới thấy (theo nhân vật + loại)
const effStart = new Map();
function statusTags(member, now, key = '') {
    const active = (member.statusEffects || []).filter(ef => now < ef.endTime);
    if (active.length === 0) return '';
    const icons = active.map(ef => {
        const id = `${key}|${ef.type}|${ef.sourceIndex ?? ''}`;
        let rec = effStart.get(id);
        if (!rec || ef.endTime > rec.end + 30 || now < rec.start) { rec = { start: now, end: ef.endTime }; effStart.set(id, rec); }
        rec.end = ef.endTime;
        const total = ef.duration ?? Math.max(1, rec.end - rec.start);
        const left = Math.max(0, ef.endTime - now);
        const frac = Math.max(0, Math.min(1, 1 - left / total));       // phần đã trôi qua
        const secs = (Math.min(left, ef.duration ?? Infinity) / 1000 / timeState.scale).toFixed(1);
        const [icon, color, name, desc, bad] = effectInfo(ef, member);
        const tip = `<b style="color:${color}">${icon} ${name}</b>${desc ? `<br>${desc}` : ''}<br><span style="color:#94a3b8">Còn ${secs}s</span>`;
        return `<span class="st-ic${bad ? ' bad' : ''}" style="--c:${color};--p:${frac.toFixed(3)}" data-tip="${tip.replace(/"/g, '&quot;')}">${icon}</span>`;
    });
    return `<div class="st-icons">${icons.join('')}</div>`;
}

// Bảng thông tin khi rê chuột lên icon hiệu ứng (1 bảng dùng chung, đặt theo vị trí chuột)
let tipEl = null, mouse = { x: -1, y: -1 };
function updateTip() {
    tipEl ??= Object.assign(document.body.appendChild(document.createElement('div')), { id: 'st-tip' });
    const t = mouse.x >= 0 ? document.elementFromPoint(mouse.x, mouse.y)?.closest?.('[data-tip]') : null;
    if (!t) { tipEl.style.display = 'none'; return; }
    tipEl.innerHTML = t.dataset.tip;
    tipEl.style.display = 'block';
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = Math.min(window.innerWidth - w - 8, mouse.x + 14) + 'px';
    tipEl.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, mouse.y + 14)) + 'px';
}
window.addEventListener('mousemove', (e) => { mouse = { x: e.clientX, y: e.clientY }; updateTip(); });
setInterval(updateTip, 150);   // bảng chỉ số vẽ lại liên tục -> cập nhật thời gian còn lại

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

// Tộc / chỉ số riêng của class (bảng tra lấy từ gói progressUpdate)
function raceEmoji(m) { return progressMeta()?.races?.[m.race]?.emoji ? progressMeta().races[m.race].emoji + ' ' : ''; }
function raceName(m) { const r = progressMeta()?.races?.[m.race]; return r ? `${r.name} · ${game.classDefs?.[m.classId]?.className ?? ''}` : ''; }

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
            ${statusTags(m, now, key)}
        </div>`;
    }
    const eff = m.effectiveStats || {};
    const base = m.baseStats || {};
    const row = (label, key, suffix, format) => statRow(label, eff[key] ?? m[key], base[key] ?? m[key], suffix, format);
    const pct = v => v / 10;
    return `
        <div class="stat-panel-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <b style="font-size:16px;">${raceEmoji(m)}${m.name}</b>${btn}
            </div>
            ${m.level ? `<div style="font-size:11px; color:#94a3b8; margin-bottom:3px;">${raceName(m)}</div>
                <div style="display:flex; gap:6px; align-items:center; font-size:11px; margin-bottom:6px; color:#94a3b8; white-space:nowrap;">
                <span>Lv <b style="color:#fff">${m.level}</b></span>${rankBadge(m.rank ?? 0, m.rankName ?? 'Thường')}
                <span style="color:#fde68a; margin-left:auto">Skill Lv${m.skillLevel ?? 1}</span></div>` : ''}
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
                ${row('Khiêu khích', 'threat')}
                ${(eff.lifesteal ?? 0) > 0 ? row('Hút máu', 'lifesteal', '%', pct) : ''}
                <div style="display:flex; justify-content:space-between;"><span>Loại sát thương</span> <b style="color:${game.classDefs?.[m.classId]?.dmgType === 'magic' ? '#60a5fa' : '#f87171'}">${game.classDefs?.[m.classId]?.dmgType === 'magic' ? 'Phép' : 'Vật lý'}</b></div>
            </div>
            ${statusTags(m, now, key)}
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
