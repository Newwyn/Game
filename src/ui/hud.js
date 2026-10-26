// ============================================================
// HUD — thẻ thành viên (máu, orb, skill), bảng chỉ số 2 bên
// ============================================================
import { progressMeta, rankBadge } from './progressTool.js';
import { game, myId } from '../state.js';
import { ORB_COST, MAX_SQUAD , gameNow, timeState } from '../config.js';
import { socket } from '../net/socket.js';
import gemF from '../assets/ui/gem_f.png';
import gemI from '../assets/ui/gem_i.png';
import gemB from '../assets/ui/gem_b.png';

const GEM_ICON = { f: gemF, i: gemI, b: gemB };
const GEM_NAME = { f: 'Hỏa', i: 'Băng', b: 'Lôi' };
const GEM_LIFE_REAL = 8;   // giây thật mỗi viên ngọc sống (server: gemLife)
// Điệu múa (Nerissa) / Tàng Hình (Jessica): phải có đối thủ trong tầm bắn của Lyra mới dùng được (server: foeInReach)
const NEED_FOE_TYPES = new Set(['dance_tide', 'dance_flow', 'dance_god', 'stealth']);

// ---------- AUTO từng tướng (nút AUTO trên thẻ) — nhớ theo trình duyệt, vào trận mới tự bật lại ----------
const AUTO_KEY = 'loc.memberAuto';
let autoPrefs = {};
try { autoPrefs = JSON.parse(localStorage.getItem(AUTO_KEY) || '{}') || {}; } catch { autoPrefs = {}; }
let autoSent = new Set();
/** Trận mới: gửi lại lựa chọn AUTO từng tướng đã nhớ */
export function resetMemberAuto() { autoSent = new Set(); }
function saveAutoPrefs() { try { localStorage.setItem(AUTO_KEY, JSON.stringify(autoPrefs)); } catch { /* bỏ qua */ } }
function updateCardAuto(card, member, i, teamAuto) {
    let b = card.querySelector('.card-auto');
    if (!b) {
        b = document.createElement('button');
        b.className = 'card-auto';
        b.textContent = 'AUTO';
        card.querySelector('.card-header')?.appendChild(b);
        // pointerdown: thẻ cập nhật liên tục, click có thể bị lỡ
        b.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault(); e.stopPropagation();
            const on = b.dataset.on !== '1';
            socket.emit('toggleMemberAuto', { memberIndex: +b.dataset.idx, value: on });
            autoPrefs[b.dataset.cls] = on;
            saveAutoPrefs();
            b.dataset.on = on ? '1' : '0';
            b.dataset.until = String(performance.now() + 700);   // chờ server xác nhận, không nháy lại trạng thái cũ
            b.classList.toggle('on', on);
        });
    }
    b.dataset.idx = i;
    b.dataset.cls = member.classId;
    if (!autoSent.has(i)) {
        autoSent.add(i);
        if (autoPrefs[member.classId] && !member.autoOn) {
            socket.emit('toggleMemberAuto', { memberIndex: i, value: true });
            b.dataset.on = '1'; b.dataset.until = String(performance.now() + 700);
        }
    }
    const on = performance.now() < +(b.dataset.until || 0) ? b.dataset.on === '1' : !!member.autoOn;
    b.dataset.on = on ? '1' : '0';
    b.classList.toggle('on', on);
    b.classList.toggle('team', !!teamAuto && !on);
    b.title = on ? 'AUTO riêng tướng này: BẬT — tự dùng kỹ năng (bấm để tắt)'
        : teamAuto ? 'Đang bật AUTO MODE cả đội — tướng này tự dùng kỹ năng. Bấm để bật AUTO riêng (giữ khi tắt AUTO MODE)'
        : 'AUTO riêng tướng này: TẮT — bấm để tướng này tự dùng kỹ năng';
}
/** Có đối thủ còn sống trong tầm bắn của Lyra quanh `m` không */
function foeNear(m, oppSquad) {
    const r = game.classDefs?.archer?.atkRange ?? 11;
    return (oppSquad ?? []).some(e => e.alive && Math.hypot(e.x - m.x, (e.z || 0) - (m.z || 0)) <= r);
}

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

/** Nhãn giá kỹ năng: Lưu Thủy (Nerissa) không tốn Orb lúc bấm nhưng cần ≥1 Orb và đốt dần */
const costLabel = (sk) => sk.orbCost ? `${sk.orbCost} orb` : sk.minOrbs ? `≥${sk.minOrbs} orb` : 'Miễn phí';

/** Tên nhân vật + tên kỹ năng trên thẻ (chỉ vẽ lại khi đổi nhân vật). Kỹ năng dùng bằng CLICK CHUỘT, không phím tắt. */
function fillCardInfo(card, member, def, i) {
    if (card.dataset.classId === member.classId) return;
    card.dataset.classId = member.classId;
    if (member.classId !== 'elementalist') { card.querySelector('.gem-slots')?.remove(); card.querySelector('.gem-tray')?.remove(); }
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
        if (cost) cost.textContent = costLabel(sk);
        btn.title = `${sk.name} — ${costLabel(sk)}${sk.minOrbs ? ' (đốt dần tới khi hết)' : ''}, ${sk.cooldown ? `hồi ${(sk.cooldown / 1000).toFixed(0)}s` : 'không hồi chiêu'}${sk.active ? ' sau khi múa xong' : ''} (click để ra lệnh)`;
    });
}

/** Elarion: 3 ô Ngọc Nguyên Tố đang giữ trên thẻ (Hỏa / Băng / Lôi) */
function updateGemSlots(card, member) {
    let box = card.querySelector('.gem-slots');
    if (!box) {
        box = document.createElement('div');
        box.className = 'gem-slots';
        box.innerHTML = '<i></i><i></i><i></i><b class="gem-cnt" title="Ngọc từ kỹ năng: đồng đội dùng 5 kỹ năng / đối thủ dùng 10 kỹ năng → +1 ngọc ngẫu nhiên"></b>';
        card.querySelector('.skills-row')?.before(box);
    }
    const held = member.held ?? [];
    box.querySelectorAll('i').forEach((el, k) => {
        const c = 'gem-slot ' + (held[k] ?? 'empty');
        if (el.className !== c) el.className = c;
    });
    // đếm kỹ năng tới lần được thêm ngọc: đồng đội x/5 · đối thủ x/10
    const cnt = box.querySelector('.gem-cnt');
    const txt = `🤝${member.giftAlly ?? 0}/5 ⚔${member.giftFoe ?? 0}/10`;
    if (cnt && cnt.textContent !== txt) cnt.textContent = txt;
}

/**
 * Elarion: KHAY NGỌC nằm ngay trên thẻ — Ngọc Nguyên Tố rơi ra hiện ở đây, bấm để nhặt.
 * Là phần giao diện (không nằm trong cảnh 3D) -> không bị camera / góc nhìn / động tác ảnh hưởng.
 * Vòng quanh mỗi viên = thời gian còn lại; sắp tan (< 2 giây) thì nhấp nháy.
 */
function updateGemTray(card, member, idx, now) {
    let tray = card.querySelector('.gem-tray');
    if (!tray) {
        tray = document.createElement('div');
        tray.className = 'gem-tray';
        tray.dataset.idx = idx;
        tray.addEventListener('pointerdown', (e) => {
            const btn = e.target.closest('.gem-btn');
            if (!btn || btn.dataset.picked || e.button !== 0) return;
            e.preventDefault(); e.stopPropagation();
            socket.emit('pickGem', { memberIndex: +tray.dataset.idx, gemId: +btn.dataset.id });
            flyGem(btn, card);
        });
        card.appendChild(tray);
    }
    tray.dataset.idx = idx;
    const gems = member.alive ? (member.gems ?? []) : [];
    const have = new Map(Array.from(tray.children).filter(el => !el.dataset.gone).map(el => [el.dataset.id, el]));
    const scale = Math.max(0.05, timeState.scale || 1);
    for (const g of gems) {
        let el = have.get(String(g.id));
        if (!el) {
            el = document.createElement('button');
            el.className = `gem-btn ${g.el}${g.gift ? ' gift' : ''}`;   // gift: ngọc thưởng từ kỹ năng đồng đội / đối thủ
            el.dataset.id = g.id;
            el.dataset.el = g.el;
            el.title = `Ngọc ${GEM_NAME[g.el]} — bấm để nhặt`;
            el.innerHTML = `<span class="gem-ring"></span><img src="${GEM_ICON[g.el]}" alt="" draggable="false">`;
            // chỗ CỐ ĐỊNH theo ô của viên ngọc (5 ô hàng dưới + 4 ô hàng trên so le) -> ngọc khác rơi / tan không làm xê dịch
            const slot = g.slot ?? 0;
            const col = slot < 5 ? slot - 2 : slot - 6.5, row = slot < 5 ? 0 : 1;
            el.style.left = `calc(50% + ${col * 44}px)`;
            el.style.bottom = `${row * 40}px`;
            tray.appendChild(el);
        }
        have.delete(String(g.id));
        const left = Math.max(0, (g.end - now) / 1000 / scale);
        el.style.setProperty('--left', `${Math.min(1, left / GEM_LIFE_REAL) * 360}deg`);
        el.classList.toggle('blink', left < 2);
        // bấm rồi mà server không nhận (ngọc vừa tan / đang tạm dừng) -> hiện lại
        if (el.dataset.picked && performance.now() - +el.dataset.picked > 900) { delete el.dataset.picked; el.classList.remove('picked'); }
    }
    // ngọc không còn: đã nhặt (đã bay vào ô) hoặc tan
    for (const el of have.values()) {
        el.dataset.gone = '1';
        if (!el.dataset.picked) el.classList.add('fade');
        setTimeout(() => el.remove(), 260);
    }
}
/** Ngọc bay từ khay vào ô ngọc đang giữ trên thẻ */
function flyGem(btn, card) {
    if (btn.dataset.picked) return;
    btn.dataset.picked = String(performance.now());
    btn.classList.add('picked');
    const slots = card.querySelectorAll('.gem-slots i');
    const held = Array.from(slots).filter(s => !s.classList.contains('empty')).length;
    const to = slots[Math.min(2, held)] ?? slots[2];
    if (!to) return;
    const a = btn.getBoundingClientRect(), b = to.getBoundingClientRect();
    const img = document.createElement('img');
    img.src = btn.querySelector('img').src;
    img.className = 'gem-fly';
    Object.assign(img.style, { left: `${a.left + a.width / 2}px`, top: `${a.top + a.height / 2}px` });
    document.body.appendChild(img);
    requestAnimationFrame(() => {
        img.style.transform = `translate(-50%, -50%) translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + b.height / 2 - a.top - a.height / 2}px) scale(0.55)`;
        img.style.opacity = '0.4';
    });
    setTimeout(() => img.remove(), 300);
}
/** Server báo ngọc đã được nhặt (cả lúc AI tự nhặt) -> viên trên khay bay vào ô */
export function hudGemPicked(d) {
    const card = $(`member-${d.casterIdx}`);
    const btn = card?.querySelector(`.gem-tray .gem-btn[data-id="${d.gemId}"]`);
    if (btn) flyGem(btn, card);
}

function updateMemberCard(member, i, now, ctx = {}) {
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
    const elem = member.classId === 'elementalist';
    if (elem) { updateGemSlots(card, member); updateGemTray(card, member, i, now); }
    updateCardAuto(card, member, i, ctx.teamAuto);
    for (let s = 0; s < 3; s++) {
        const btn = $(`btn-${i}-${s}`);
        if (!btn) continue;
        // kỹ năng theo bậc (server gửi) — Elarion: nút KN2 đổi theo phép đang giữ
        const sk = member.skills?.[s] ?? def.skills[s];
        if (elem) {
            const ic = btn.querySelector('.skill-icon');
            const nm = s === 1 && !member.spell ? 'Chưa ghép phép' : sk.name;
            if (ic && ic.textContent !== nm) ic.textContent = nm;
        }
        // Zerith: lướt lần 2 lúc Đêm Tử Thần miễn phí (hiệu ứng reaper_echo)
        const free = sk.type === 'reaper_dash' && member.statusEffects?.some(e => e.type === 'reaper_echo' && e.endTime > now);
        // Elarion — Thiên Tài Nguyên Tố: phép kế tiếp giảm 1 Orb
        const discount = elem && s === 1 && member.spellDiscount ? 1 : 0;
        const cost = free ? 0 : Math.max(0, sk.orbCost - discount);
        const costEl = btn.querySelector('.cost');
        const hpc = sk.hpCost ? ` +${Math.round(sk.hpCost * 100)}%♥` : '';   // Brakk: tốn thêm % máu
        const costTxt = free ? 'MIỄN PHÍ' : elem && s === 0 ? `${cost} orb · ${member.held?.length ?? 0}/3`
            : elem && s === 1 && !member.spell ? '—' : sk.orbCost ? `${cost} orb${discount ? ' ↓' : ''}${hpc}` : costLabel(sk);
        if (costEl && costEl.textContent !== costTxt) costEl.textContent = costTxt;
        btn.classList.toggle('free', !!free);
        const queueIdx = member.queuedSkills.indexOf(s);
        const isQueued = queueIdx !== -1;

        // Kỹ năng ĐANG CHẠY (VD điệu múa của Nerissa): vòng sáng chạy quanh nút + vạch thời gian còn lại ở đáy nút
        const act = activeOf(member, def, s, now);
        if (act) {
            btn.style.setProperty('--act-p', act.p.toFixed(3));
            btn.style.setProperty('--act-c', act.combo ? '#fde68a' : (def.skills[s].activeColor ?? '#5eead4'));
        }

        // Đếm ngược hồi chiêu
        const cd = ensureCdOverlay(btn);
        // Hồi chiêu chỉ bắt đầu chạy khi diễn xong động tác (server cộng thêm thời gian diễn) -> trong lúc diễn / niệm giữ nguyên số đầy
        const cdMs = Math.min(member.skillCooldowns[s] - now, Math.max(sk.cooldown ?? 0, elem ? 1000 : 0));
        const remainingCd = act ? 0 : Math.max(0, cdMs / 1000 / timeState.scale); // giây thật (đang chạy: hồi chiêu chưa tính)
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
            const need = Math.max(cost, free ? 0 : (sk.minOrbs ?? 0));
            // Elarion: Sách cần đủ 3 viên ngọc, nút phép cần có phép
            let usable = !elem || (s === 0 ? (member.held?.length ?? 0) >= 3 : s === 1 ? !!member.spell : true);
            // điệu múa / Tàng Hình: chưa gặp đối thủ -> chưa dùng được (bấm vẫn xếp hàng chờ)
            const farFoe = NEED_FOE_TYPES.has(sk.type) && !foeNear(member, ctx.oppSquad);
            if (farFoe) { usable = false; cls += ' far-foe'; }
            const isReady = !act && usable && member.mp >= need * ORB_COST && now > member.skillCooldowns[s];
            if (isReady) cls += ' ready';
            if (isQueued) cls += ' queued';
            if (act) cls += ' active' + (act.combo ? ' combo' : '');
            else if (!isReady && !isQueued) cls += ' disabled';
        }
        btn.className = cls;
    }
}

/**
 * Kỹ năng s có đang chạy không (skill.active = loại hiệu ứng trên người). Trả { p: phần còn lại 0..1, combo } hoặc null.
 * Không có thời lượng (Lưu Thủy: múa tới khi hết Orb) -> p = lượng MP còn lại. combo: mọi kỹ năng "active" đang cùng chạy (vòng vàng).
 */
function activeOf(member, def, s, now) {
    const sk = def.skills[s];
    if (!sk?.active || !member.alive) return null;
    const on = (type) => member.statusEffects?.find(e => e.type === type && e.endTime > now);
    const ef = on(sk.active);
    if (!ef) return null;
    const p = ef.duration > 0 ? (ef.endTime - now) / ef.duration : (member.maxMp > 0 ? member.mp / member.maxMp : 0);
    const actives = def.skills.filter(k => k.active);
    const combo = actives.length >= 3 && actives.every(k => on(k.active));
    return { p: Math.max(0, Math.min(1, p)), combo };
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
        case 'reaper_echo': return ['↺', '#fb7185', 'Lướt lần 2', 'Lưỡi Hái Xuyên Hồn đã hồi — lướt thêm 1 lần MIỄN PHÍ'];
        case 'reaper_form': return ['💀', '#e11d48', 'Đêm Tử Thần',
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
        case 'lone_dragon': return ['🐲', '#f59e0b', 'Độc Long', `Chỉ còn 1 mình Brakk trên sân: sát thương ×${(1 + (ef.value ?? 1)).toFixed(0)}`];
        // ---- Elarion (Tam Nguyên) + Golem ----
        case 'attune_fire': return ['🔥', '#fb923c', 'Cộng Hưởng Hỏa', `${ef.stacks} tầng: +${pc((ef.per ?? 0) * ef.stacks)}% ATK`];
        case 'attune_ice': return ['❄️', '#67e8f9', 'Cộng Hưởng Băng', `${ef.stacks} tầng: hồi ${((ef.per ?? 0) * ef.stacks * 100).toFixed(1)}% máu mỗi giây`];
        case 'attune_bolt': return ['⚡', '#c084fc', 'Cộng Hưởng Lôi', `${ef.stacks} tầng: +${pc((ef.per ?? 0) * ef.stacks)}% tốc đánh${ef.orb ? ` · +${pc(ef.orb * ef.stacks)}% tốc độ hồi Orb` : ''}`];
        case 'elem_storm': return ['🌀', '#fde68a', 'Bão Nguyên Tố', 'Ngọc trên sân luôn được bổ sung cho đủ 7 viên'];
        case 'frozen': return ['🧊', '#7dd3fc', 'Đóng Băng', 'Bị đóng băng: đứng im, không đánh, không niệm', true];
        case 'frost_slow': return ['❄️', '#7dd3fc', 'Băng Phong', `−${pc(ef.value)}% tốc đánh`, true];
        case 'chain_break': return ['⚡', '#a78bfa', 'Lôi Xích', `−${pc(ef.value)}% M.DEF`, true];
        case 'golem_break': return ['🔥', '#fb923c', 'Nộ Lửa', `−${pc(ef.value)}% M.DEF`, true];
        case 'chill': return ['🧊', '#bae6fd', 'Hàn Khí', `${ef.stacks}/5 tầng: −${pc((ef.per ?? 0) * ef.stacks)}% tốc đánh · đủ 5 tầng bị đóng băng (sát thương băng nào cũng cộng tầng)`, true];
        case 'elem_rain': return ['⛈️', '#94a3b8', 'Mưa Giông', 'Đang thi triển: phe ta hồi máu mỗi giây (đầy máu thì hồi MP), sét đánh đối thủ · dùng kỹ năng khác thì ngắt'];
        case 'elem_beam': {
            const st = Math.min(ef.max ?? 5, ef.tick ?? 0);
            return ['☄️', '#fb923c', 'Băng Hoại Hỏa Thiên', `Đang chưởng SolarBeam băng-hỏa tới cuối bản đồ · lửa ${st}/${ef.max ?? 5} tầng (+${Math.round((ef.ramp ?? 0.03) * st * 100 + (st >= (ef.max ?? 5) ? (ef.maxBonus ?? 0.3) * 100 : 0))}% sát thương lửa) · bị choáng / dùng kỹ năng khác thì ngắt`];
        }
        case 'beam_slow': return ['❄️', '#7dd3fc', 'Băng Hoại Hỏa Thiên', `Trúng tia băng: −${pc(ef.value)}% tốc đánh`, true];
        case 'storm_self': return ['⚡', '#c084fc', 'Tốc Lôi', `Đánh thường chưởng 2 lần · +${pc(ef.value)}% tốc đánh${ef.orbRegen ? ` · hồi Orb ×${ef.orbRegen}` : ''} · ${(ef.autos ?? 0) % (ef.every ?? 5)}/${ef.every ?? 5} đòn tới lần tăng tốc cả đội`];
        case 'golem_haste': return ['⚡', '#c084fc', 'Tay Sét', `+${pc(ef.value)}% tốc đánh · mỗi đòn giật toàn bộ đối thủ`];
        case 'golem_breath': return ['🌨️', '#bae6fd', 'Phun Bão Tuyết', 'Đứng phun bão tuyết'];
        case 'frost_stack': return ['🌨️', '#bae6fd', 'Bão Tuyết', `${ef.stacks} tầng: −${pc((ef.per ?? 0) * ef.stacks)}% tốc đánh · đủ 4 tầng bị đóng băng`, true];
        case 'steam_blind': return ['♨️', '#fdba74', 'Hơi Nước Bỏng', `Đánh trượt thêm ${pc(ef.value)}%`, true];
        case 'storm_haste': return ['⚡', '#c084fc', 'Nhịp Lôi', `+${pc((ef.value ?? 0) * (ef.stacks ?? 1))}% tốc đánh (${ef.stacks ?? 1} tầng)`];
        case 'storm_ward': return ef.dormant
            ? ['🛡', '#7dd3fc', 'Giáp Băng Sét', 'Ai đánh trúng bị sét giật + choáng 0,5s']
            : ['🛡', '#7dd3fc', 'Giáp Băng Sét', `Khiên ${Math.round(ef.hp)}/${ef.maxHp} · ai đánh trúng bị sét giật + choáng 0,5s`];
        case 'golem_aura': return ['⚡', '#c084fc', 'Hào Quang Sét', 'Mỗi giây giật mọi đối thủ đứng gần (choáng 0,5s)'];
        // ---- Nerissa (Thủy Vũ) ----
        case 'dance_tide': return ['🌊', '#38bdf8', 'Vũ Khúc Sóng Triều', 'Đang múa: cả đội tăng tốc hồi MP'];
        case 'dance_flow': return ['💧', '#5eead4', 'Lưu Thủy Hồi Xuân', 'Đang múa: mỗi 0,5s đốt 0,5 Orb hồi máu cả đội — múa tới khi hết Orb'];
        case 'dance_god': return ['🪷', '#fde68a', 'Thủy Thần Vũ', 'Đang múa: cả đội +máu tối đa, +hồi máu nhận, +ATK, kháng khống chế'];
        case 'tide_mana': return ['🔹', '#38bdf8', 'Sóng Triều', `Hồi thêm ${Math.round(ef.manaPerSec ?? 0)} MP mỗi giây (${((ef.manaPerSec ?? 0) / ORB_COST).toFixed(1)} Orb/giây)`];
        case 'water_god': return ['🪷', '#fde68a', 'Phước Thủy Thần', `+máu tối đa · +${pc(ef.healUp)}% hồi máu nhận · +${pc(ef.atkUp)}% ATK · −${pc(ef.ccResist)}% khống chế`];
        case 'water_shield': return ef.dormant
            ? ['🫧', '#7dd3fc', 'Giáp Nước', 'Đang có khiên khác dày hơn hứng đòn']
            : ['🫧', '#7dd3fc', 'Giáp Nước', `Khiên ${Math.round(ef.hp)}/${ef.maxHp} · tự hồi khi Nerissa còn múa Sóng Triều + Lưu Thủy`];
        case 'note_break': return ['🎵', '#a78bfa', 'Nốt Nhạc Vỡ Giáp', `−${pc(ef.value)}% M.DEF`, true];
        case 'note_amp': return ['🎶', '#5eead4', 'Nốt Nhạc Cổ Vũ', `+${pc(ef.value)}% sát thương phép`];
        case 'tide_haste': return ['💨', '#38bdf8', 'Nhịp Triều', `+${pc(ef.value)}% tốc đánh (Nerissa múa Sóng Triều + Thủy Thần)`];
        case 'tide_slow': return ['🐌', '#64748b', 'Nước Cuốn', `−${pc(ef.value)}% tốc đánh (Nerissa múa Sóng Triều + Thủy Thần)`, true];
        default: return ['❔', '#94a3b8', ef.type, ''];
    }
}
const AURA_EFFECTS = new Set(['water_shield', 'tide_haste', 'tide_slow', 'lone_dragon']);
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
        // duy trì (không có hạn / được làm mới liên tục khi tổ hợp điệu múa còn chạy) -> không ghi số giây
        const keep = left > 1e8 || AURA_EFFECTS.has(ef.type);
        const tip = `<b style="color:${color}">${icon} ${name}</b>${desc ? `<br>${desc}` : ''}<br><span style="color:#94a3b8">${keep ? 'Duy trì' : `Còn ${secs}s`}</span>`;
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
    const opp = Object.entries(players).find(([id]) => id !== me)?.[1];

    squad.forEach((member, i) => {
        if (!member.summon) return updateMemberCard(member, i, now, { teamAuto: !!players[me].autoMode, oppSquad: opp?.squad });
        const card = $(`member-${i}`);   // Golem triệu hồi: không có thẻ
        if (card) card.style.display = 'none';
    });
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
