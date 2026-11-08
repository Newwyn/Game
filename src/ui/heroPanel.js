// ============================================================
// 🧑 BẢNG NHÂN VẬT · 🎒 TÚI ĐỒ · 🏪 CỬA HÀNG · ⚙️ CÀI ĐẶT — mở từ thanh nút trên bản đồ thế giới
//   Nhân vật: danh sách anh hùng (trái) + 4 thẻ: Chỉ số · Kỹ năng · Trang bị · Trang phục (skin theo bậc S / SS / SSS)
//   Dữ liệu: server 'heroPanelOpen' -> 'heroPanel' (server.js heroPanelPayload) · đổi skin 'setSkin' · mua 'buyItem' · dùng bình EXP 'heroUseItem'
// ============================================================
import { socket } from '../net/socket.js';
import { softwareGL } from '../core/gpu.js';
import '../styles/heropanel.css';
import { icon } from './icons.js';

const PORTRAITS = import.meta.glob('../assets/portraits/*.png', { eager: true, import: 'default' });
const SKILL_ART = import.meta.glob('../assets/skills/*.webp', { eager: true, import: 'default' });
const ATLAS = import.meta.glob('../assets/sprites/*_sprite.webp', { eager: true, import: 'default' });
const ATLAS_META = import.meta.glob('../characters/sprite/*Sprite{,_s,_ss}.json', { eager: true, import: 'default' });
const ART = { assassin: 'jessica', warrior: 'rok', archer: 'lyra', priest: 'seraphine', mage: 'ignar', alchemist: 'grix', reaper: 'zerith',
    wrestler: 'brakk', dancer: 'nerissa', elementalist: 'elarion', summoner: 'sylva' };

// mô tả ngắn 3 kỹ năng (số liệu ở cấp kỹ năng 1)
const SKILL_DESC = {
    assassin: ['Phóng bùa sấm tím vào mục tiêu, gây sát thương từ xa. Không tốn Orb.', 'Lao tới chém mạnh mục tiêu, sát thương vật lý lớn.', 'Ẩn mình trong bóng tối: kẻ địch mất dấu, đòn đánh kế tiếp từ sau lưng chí mạng.'],
    warrior: ['Gầm vang: sát thương 80% công lên quái quanh Rok, buộc chúng đánh Rok 4 giây, −10% thủ.', 'Húc khiên hất văng quái trước mặt (160% công), choáng 1 giây; rơi xuống làm choáng quái xung quanh.', 'Dựng khiên thần hộ vệ: hấp thụ sát thương 5 giây, khiên vỡ dần phát nổ lan sang quái gần đó.'],
    archer: ['Nhảy lên bắn tên gió chắc chắn chí mạng, xuyên giáp, đẩy lùi. Hạ gục mục tiêu thì hoàn Orb.', 'Gọi Vệ Thần Gió 8 giây: Lyra bay lên, +30% tốc đánh, +20% công, tầm bắn xa hơn.', 'Gồng 2 giây rồi phóng 6 mũi tên thần như tên lửa vào mọi kẻ địch.'],
    priest: ['Hồi máu đồng đội yếu nhất + giải choáng. Đang Thánh Niệm: hồi cả đội.', 'Khiên ánh sáng cho đồng đội yếu nhất 5 giây. Đang Thánh Niệm: khiên cả đội + tăng thủ.', 'Bay lên niệm 10 giây: cả đội +20% sát thương, hồi ngay 2 kỹ năng kia.'],
    mage: ['Gọi cầu lửa từ trời rơi vào chỗ quái đông nhất, để lại biển lửa.', 'Cột lửa bùng 7 lần liên tiếp, mỗi lần giảm thủ phép của quái.', 'Gồng 1,5 giây gọi Hộ Vệ Thần Lửa 15 giây: +25% công phép, đòn thường hoá chưởng lửa.'],
    reaper: ['Lướt xuyên qua hàng quái, chém mọi kẻ trên đường. Không tốn Orb.', 'Lưỡi hái khổng lồ quét lên, hất tung quái phía trước 1 giây.', 'Gọi Hộ Vệ Thần Chết 10 giây: Zerith bay lơ lửng, +20% sát thương, +30% tốc đánh.'],
    dancer: ['Múa 5 giây: cả đội hồi năng lượng (Orb) rất nhanh.', 'Đốt dần Orb để hồi máu cả đội liên tục tới khi hết Orb.', 'Múa 10 giây: cả đội +20% máu tối đa, +20% công, kháng hiệu ứng xấu.'],
    elementalist: ['Đọc Sách Nguyên Tố: ghép 3 viên ngọc Hoả / Băng / Lôi đang giữ thành 1 phép.', 'Tung phép vừa ghép (10 kiểu phép khác nhau tuỳ cách ghép ngọc).', 'Bão Nguyên Tố quét khắp trận, dùng xong được hoàn 2 Orb.'],
    alchemist: ['Ném bình độc văng tung toé lên kẻ địch.', 'Tạo đầm lầy thối rữa: quái đứng trong bị trúng độc, chậm lại.', 'Kích nổ toàn bộ độc trên người kẻ địch, sát thương lớn.'],
    summoner: ['Gọi Sói và Đại Bàng chiến đấu cùng 18 giây.', 'Gọi Gấu Hộ Vệ ủi xuyên hàng quái, hất tung + choáng.', 'Gọi Thần Hươu 10 giây: hồi máu đồng đội mỗi giây, thú triệu hồi mạnh hơn.'],
    wrestler: ['Túm quái quật xuống đất (180% công), choáng 1 giây, chấn động quái gần đó.', 'Bật cao dậm đất: hất tung quái xung quanh, Brakk nhận khiên 25% máu.', 'Hoá Khổng Lồ 10 giây: +50% máu, +40% thủ, 5 giây đầu miễn mọi hiệu ứng xấu.'],
};
const STAT_ROWS = [
    ['maxHp', 'Máu tối đa'], ['pAtk', 'Công vật lý'], ['mAtk', 'Công phép'], ['pDef', 'Thủ vật lý'], ['mDef', 'Thủ phép'],
    ['crit', 'Tỉ lệ chí mạng', 'pct'], ['critDmg', 'Sát thương chí mạng', 'pct'], ['acc', 'Chính xác', 'pct'], ['dodge', 'Né tránh', 'pct'],
    ['pen', 'Xuyên giáp', 'pct'], ['block', 'Chặn đòn', 'pct'], ['lifesteal', 'Hút máu', 'pct'], ['mpAtk', 'Năng lượng mỗi đòn'], ['atkSpeed', 'Đòn / giây', 'spd'],
];
const RACE_VI = { Human: 'Tộc Người', Elf: 'Tộc Elf', Dragon: 'Tộc Rồng', Goblin: 'Tộc Goblin', Demon: 'Tộc Quỷ' };
const RANK_COLORS = ['#94a3b8', '#60a5fa', '#c084fc', '#fbbf24'];
const TIER_NAME = { s: 'Bậc S (Tân binh)', ss: 'Bậc SS (Giáp bạc)', sss: 'Bậc SSS (Huyền thoại)' };
const fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN');

let root = null, data = null, open = false, tab = 'hero', sub = 'stats', sel = null, msg = null, onClose = null, actions = {};
const LS = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } } };

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'hero-panel';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    window.addEventListener('keydown', (e) => { if (open && e.key === 'Escape') { e.stopPropagation(); close(); } }, true);
    return root;
}

/** Mở bảng: tab 'hero' | 'bag' | 'shop' | 'settings'. actions: { gear, forge, setQuality, quality, wild, setWild } từ bản đồ */
export function openHeroPanel(startTab = 'hero', opts = {}) {
    tab = startTab; msg = null; onClose = opts.onClose ?? null; actions = opts;
    open = true;
    el().style.display = 'flex';
    socket.emit('heroPanelOpen');
    render();
}
export const heroPanelOpen = () => open;
function close() {
    open = false;
    if (root) root.style.display = 'none';
    onClose?.();
}

// ---------- vẽ ----------
const hero = () => data?.heroes.find(h => h.id === sel) ?? data?.heroes[0];
function portrait(id) {
    const url = PORTRAITS[`../assets/portraits/${id}.png`];
    return url ? `<img src="${url}" alt="">` : '<span>🧑</span>';
}
function render() {
    if (!root) return;
    const tabs = [['hero', '🧑 Nhân vật'], ['bag', '🎒 Túi đồ'], ['shop', '🏪 Cửa hàng'], ['settings', '⚙️ Cài đặt']];
    const w = data?.wallet ?? {};
    root.innerHTML = `<div class="hp-box" role="dialog" aria-label="Nhân vật">
        <div class="hp-head">
            <div class="hp-tabs">${tabs.map(([k, t]) => `<button class="hp-tab${tab === k ? ' on' : ''}" data-hp-tab="${k}">${t}</button>`).join('')}</div>
            <div class="hp-wallet"><span>${icon('gold', '🪙')} ${fmt(w.gold)}</span><span>${icon('diamond', '💎')} ${fmt(w.diamond)}</span><span>${icon('stone', '🔷')} ${fmt(w.stone)}</span></div>
            <button class="hp-close" data-hp-close aria-label="Đóng">✕</button>
        </div>
        ${msg ? `<div class="hp-msg ${msg.ok ? 'ok' : 'bad'}">${msg.text}</div>` : ''}
        <div class="hp-body">${!data ? '<p class="hp-empty">Đang mở…</p>' : tab === 'hero' ? heroHTML() : tab === 'bag' ? bagHTML() : tab === 'shop' ? shopHTML() : settingsHTML()}</div>
    </div>`;
}

function heroHTML() {
    const h = hero();
    if (!h) return '<p class="hp-empty">Chưa có anh hùng.</p>';
    sel = h.id;
    const subs = [['stats', '📊 Chỉ số'], ['skills', '✨ Kỹ năng'], ['gear', '🛡️ Trang bị'], ['skin', '👗 Trang phục']];
    return `<div class="hp-hero">
        <div class="hp-list">${data.heroes.map(x => `<button class="hp-li${x.id === h.id ? ' on' : ''}" data-hp-hero="${x.id}" style="--c:${x.color}">
            <span class="hp-face">${portrait(x.id)}</span><span><b>${x.name}</b><small>Lv${x.level} · <i style="color:${RANK_COLORS[x.rank]}">${x.rankName}</i></small></span></button>`).join('')}</div>
        <div class="hp-main">
            <div class="hp-card" style="--c:${h.color}">
                <span class="hp-face big">${portrait(h.id)}</span>
                <div class="hp-id"><h3>${h.emoji ?? ''} ${h.name} <small>· ${h.title}</small></h3>
                    <p>${RACE_VI[h.race] ?? h.race} · ${h.className} · ${h.dmgType === 'magic' ? 'Sát thương phép' : 'Sát thương vật lý'} · ${h.range === 'melee' ? 'Cận chiến' : 'Đánh xa'}</p>
                    <div class="hp-lv"><b>Lv ${h.level}</b><span class="hp-rank" style="--rc:${RANK_COLORS[h.rank]}">${h.rankName}</span>
                        <div class="hp-exp"><i style="width:${h.expNext ? Math.min(100, Math.round(100 * h.exp / h.expNext)) : 100}%"></i></div>
                        <small>${h.level >= h.cap ? `Đầy cấp bậc ${h.rankName} (Lv${h.cap}) — cần đột phá` : `EXP ${fmt(h.exp)} / ${fmt(h.expNext)}`}</small></div>
                    <div class="hp-quick">
                        <button class="cp-back-btn hp-ibtn" data-hp-exp="exp_small" ${(data.items.exp_small ?? 0) ? '' : 'disabled'}>${icon('exp_small', '🧪')} Bình EXP nhỏ (${data.items.exp_small ?? 0})</button>
                        <button class="cp-back-btn hp-ibtn" data-hp-exp="exp_big" ${(data.items.exp_big ?? 0) ? '' : 'disabled'}>${icon('exp_big', '⚗️')} Bình EXP lớn (${data.items.exp_big ?? 0})</button>
                        ${h.affinity ? `<span class="hp-aff">💗 Thân mật Lv${h.affinity}</span>` : ''}
                    </div></div>
            </div>
            <div class="hp-subtabs">${subs.map(([k, t]) => `<button class="hp-sub${sub === k ? ' on' : ''}" data-hp-sub="${k}">${t}</button>`).join('')}</div>
            <div class="hp-subbody">${sub === 'stats' ? statsHTML(h) : sub === 'skills' ? skillsHTML(h) : sub === 'gear' ? gearHTML(h) : skinHTML(h)}</div>
        </div></div>`;
}
function statVal(s, k, kind) {
    const v = s?.[k] ?? 0;
    return kind === 'pct' ? `${(v / 10).toFixed(1).replace('.', ',')}%` : kind === 'spd' ? (1000 / (v || 1000)).toFixed(2).replace('.', ',') : fmt(v);
}
function statsHTML(h) {
    return `<div class="hp-stats">${STAT_ROWS.filter(([k]) => k !== (h.dmgType === 'magic' ? 'pAtk' : 'mAtk') || (h.stats?.[k] ?? 0) > 0).map(([k, label, kind]) => {
        const b = h.base?.[k] ?? 0, v = h.stats?.[k] ?? 0, diff = k === 'atkSpeed' ? b - v : v - b;
        return `<div class="hp-stat"><span>${label}</span><b>${statVal(h.stats, k, kind)}</b>${diff > 0 ? `<em>+${kind === 'pct' ? `${(diff / 10).toFixed(1).replace('.', ',')}%` : kind === 'spd' ? '' : fmt(diff)} đồ</em>` : ''}</div>`;
    }).join('')}</div><p class="hp-note">Số màu xanh = phần cộng thêm từ trang bị. Chỉ số còn tăng theo tộc (${RACE_VI[h.race] ?? h.race}), cấp, bậc và độ thân mật ở quán ăn.</p>`;
}
function skillsHTML(h) {
    const desc = SKILL_DESC[h.id] ?? [];
    const cost = (sk) => sk.minOrbs ? `≥${sk.minOrbs} Orb (đốt dần)` : sk.orbCost ? `${sk.orbCost} Orb` : 'Miễn phí';
    return `<div class="hp-skills">${h.skills.map((sk, i) => {
        const art = SKILL_ART[`../assets/skills/${h.id}_${i}.webp`];
        return `<div class="hp-skill"><span class="hp-sk-ic"${art ? ` style="background-image:url(${art})"` : ''}></span>
            <div><b>${sk.name}</b> <small>${['Kỹ năng 1', 'Kỹ năng 2', 'Tuyệt kỹ'][i]} · Lv${h.skillLevel}</small>
            <p>${desc[i] ?? ''}</p><span class="hp-tags"><i>💠 ${cost(sk)}</i><i>⏱ ${sk.cooldown ? `Hồi ${Math.round(sk.cooldown / 1000)} giây` : 'Không hồi chiêu'}</i></span></div></div>`;
    }).join('')}
    ${(h.talents ?? []).map(t => `<div class="hp-skill talent${t.level ? '' : ' locked'}"><span class="hp-sk-ic tal">${t.level ? '🌟' : '🔒'}</span>
        <div><b>${t.name}</b> <small>Thiên phú ${t.slot} · ${t.level ? `Lv${t.level}/${t.max}` : `mở ở Lv${t.unlockAt}`}</small><p>${t.desc}</p></div></div>`).join('')}
    <p class="hp-note">Kỹ năng lên cấp khi đột phá bậc (Thường → S → SS → SSS).</p></div>`;
}
function gearHTML(h) {
    const eq = h.equipped ?? {};
    return `<div class="hp-gear">${(data.slots ?? []).map(sl => {
        const it = eq[sl.id];
        return `<div class="hp-slot${it ? '' : ' empty'}" style="--rc:${it?.color ?? '#475569'}"><span class="hp-slot-ic">${icon(sl.id, sl.icon)}</span>
            <div>${it ? `<b style="color:${it.color}">${it.name}${it.enhance ? ` +${it.enhance}` : ''}</b><small>Cấp ${it.level} · ${it.rarityName}</small>
                <small>${it.main.map(m => `${m.label} ${m.text}`).join(' · ')}</small>` : `<b>${sl.name}</b><small>Chưa mặc</small>`}</div></div>`;
    }).join('')}</div>
    ${h.sets?.length ? `<div class="hp-sets">${h.sets.map(st => `<div><b>${st.name}</b> (${st.count}/4)<small class="${st.count >= 2 ? 'on' : ''}">2 món: ${st.twoText}</small><small class="${st.count >= 4 ? 'on' : ''}">4 món: ${st.fourText}</small></div>`).join('')}</div>` : ''}
    <div class="hp-actions">
        ${data.features.includes('gear') ? '<button class="cp-btn-confirm" data-hp-go="gear">🎒 Mặc / tháo đồ</button>' : '<span class="hp-note">🔒 Trang bị mở khi qua ải 6</span>'}
        ${data.features.includes('forge') ? '<button class="cp-btn-cancel" data-hp-go="forge">⚒️ Lò rèn</button>' : ''}
    </div>`;
}
function atlasFrame(id, tier) {
    const art = ART[id];
    if (!art) return null;
    const suffix = tier === 'sss' ? '' : `_${tier}`;
    const meta = ATLAS_META[`../characters/sprite/${art}Sprite${suffix}.json`];
    const url = ATLAS[`../assets/sprites/${art}${suffix}_sprite.webp`];
    const f = meta?.frames?.idle1 ?? meta?.frames?.[Object.keys(meta?.frames ?? {})[0]];
    if (!meta || !url || !f) return null;
    const [x, y, w, hh] = f.rect, [W, H] = meta.size, k = 150 / hh;
    return `<span class="hp-skin-img" style="width:${Math.round(w * k)}px;height:150px;background-image:url(${url});background-size:${Math.round(W * k)}px ${Math.round(H * k)}px;background-position:-${Math.round(x * k)}px -${Math.round(y * k)}px"></span>`;
}
function skinHTML(h) {
    const auto = !h.skin;
    return `<div class="hp-skins">
        <button class="hp-skin${auto ? ' on' : ''}" data-hp-skin="auto"><span class="hp-skin-auto">🔄</span><b>Tự động</b><small>Đổi theo bậc hiện tại</small></button>
        ${['s', 'ss', 'sss'].map(t => {
            const ok = h.skins.includes(t), img = atlasFrame(h.id, t);
            return `<button class="hp-skin${h.skin === t ? ' on' : ''}${ok ? '' : ' locked'}" data-hp-skin="${t}" ${ok ? '' : 'disabled'}>
                ${img ?? '<span class="hp-skin-auto">❔</span>'}<b>${TIER_NAME[t]}</b><small>${ok ? (h.skin === t ? '✓ Đang mặc' : 'Bấm để mặc') : `🔒 Đột phá lên ${t.toUpperCase()} để mở`}</small></button>`;
        }).join('')}
    </div><p class="hp-note">Trang phục chỉ đổi hình trong trận, không đổi chỉ số.</p>`;
}
// túi đồ: 4 phần — 💰 Tài nguyên · 🧪 Nguyên liệu · 📜 Vật phẩm nhiệm vụ · 🛡️ Trang bị
const MATS = [['refine_stone', '💎', 'Đá Tinh Luyện', 'Tinh luyện lại 1 dòng phụ của trang bị'], ['luck_charm', '🍀', 'Bùa May Mắn', 'Cường hoá hỏng không bị tụt cấp'],
    ['exp_small', '🧪', 'Bình Kinh Nghiệm Nhỏ', '+500 EXP cho 1 anh hùng'], ['exp_big', '⚗️', 'Bình Kinh Nghiệm Lớn', '+5.000 EXP cho 1 anh hùng'],
    ['stone_s', '🔷', 'Đá Đột Phá S', 'Đột phá lên bậc S'], ['stone_ss', '🔶', 'Đá Đột Phá SS', 'Đột phá lên bậc SS'], ['stone_sss', '💠', 'Đá Đột Phá SSS', 'Đột phá lên bậc SSS']];
const QUEST_DESC = { wheat: 'Mang cho cô Lena ở làng Ashford', mushroom: 'Mang cho cô Lena ở làng Ashford', herb: 'Mang cho Seraphine ở giếng làng', hammer: 'Trả cho bác Borin ở lò rèn' };
let bagTab = 'res';
function cell(key, fb, name, count, desc) {
    return `<div class="hp-cell" title="${desc ?? name}">${icon(key, fb, 'hp-cell-ic')}<b>${count != null ? fmt(count) : ''}</b><small>${name}</small>${desc ? `<i>${desc}</i>` : ''}</div>`;
}
function bagHTML() {
    const tabs = [['res', 'gold', '💰', 'Tài nguyên'], ['mat', 'refine_stone', '🧪', 'Nguyên liệu'], ['quest', 'quest_pages', '📜', 'Vật phẩm nhiệm vụ'], ['gear', 'weapon', '🛡️', `Trang bị (${data.bag.length}/${data.invMax})`]];
    let body = '';
    if (bagTab === 'res') {
        const st = data.stamina ?? {};
        body = `<div class="hp-cells">${cell('gold', '🪙', 'Vàng', data.wallet.gold, 'Mua đồ, nấu ăn ở quán, cường hoá')}${cell('diamond', '💎', 'Kim Cương', data.wallet.diamond, 'Mua anh hùng, bùa, thể lực')}
            ${cell('stone', '🔷', 'Đá Cường Hoá', data.wallet.stone, 'Cường hoá trang bị ở Lò rèn')}${cell('stamina', '⚡', 'Thể lực', st.value != null ? `${st.value}` : null, `Vào ải tốn thể lực · tối đa ${st.max ?? ''}`)}</div>`;
    } else if (bagTab === 'mat') {
        const list = MATS.filter(([k]) => (data.items[k] ?? 0) > 0);
        body = list.length ? `<div class="hp-cells">${list.map(([k, e, n, d]) => cell(k, e, n, data.items[k], d)).join('')}</div>` : '<p class="hp-empty">Chưa có nguyên liệu — mua ở 🏪 Cửa hàng hoặc nhận khi qua ải / Hầm ngục.</p>';
    } else if (bagTab === 'quest') {
        body = data.quest?.length ? `<div class="hp-cells">${data.quest.map(q => cell(`quest_${q.id}`, '📦', q.name, null, QUEST_DESC[q.id] ?? 'Vật phẩm nhiệm vụ')).join('')}</div>`
            : '<p class="hp-empty">Không mang vật phẩm nhiệm vụ nào. Nhận việc từ NPC có dấu ❗ rồi tìm đồ trên bản đồ.</p>';
    } else {
        body = data.bag.length ? `<div class="hp-bag">${data.bag.slice(0, 80).map(it => `<div class="hp-item" style="--rc:${it.color}" title="${it.name}">${icon(it.slot, it.icon, 'hp-item-ic')}<b>${it.name}${it.enhance ? ` +${it.enhance}` : ''}</b><small>Cấp ${it.level} · ${it.rarityName}${it.setName ? ` · Bộ ${it.setName}` : ''}</small></div>`).join('')}</div>`
            : '<p class="hp-empty">Chưa có trang bị nào trong túi. Đồ rơi khi qua ải (từ ải 6) và ở Hầm ngục.</p>';
        if (data.features.includes('gear')) body += '<div class="hp-actions"><button class="cp-btn-confirm" data-hp-go="gear">🎒 Mặc / tháo đồ</button></div>';
    }
    return `<div class="hp-bagtabs">${tabs.map(([k, ik, e, t]) => `<button class="hp-sub hp-ibtn${bagTab === k ? ' on' : ''}" data-hp-bag="${k}">${icon(ik, e)} ${t}</button>`).join('')}</div>${body}`;
}
function shopHTML() {
    const price = (c) => Object.entries(c).map(([k, v]) => `${icon(k, k === 'gold' ? '🪙' : '💎')} ${fmt(v)}`).join(' ');
    return `<div class="hp-shop">${data.shop.map(it => `<div class="hp-shop-it"><span class="hp-shop-ic">${icon(it.id, it.emoji)}</span><div><b>${it.name}</b><small>${it.desc}</small></div>
        <button class="cp-btn-confirm" data-hp-buy="${it.id}">${price(it.cost)}</button></div>`).join('')}</div>
    <div class="hp-actions">${data.features.includes('heroShop') ? '<button class="cp-btn-cancel" data-hp-go="heroshop">🦸 Cửa hàng anh hùng</button>' : '<span class="hp-note">🔒 Cửa hàng anh hùng mở sau ải 20</span>'}
        <button class="cp-btn-cancel" data-hp-go="tavern">🍲 Quán ăn</button></div>`;
}
function settingsHTML() {
    const q = actions.quality?.() ?? 'auto', wild = actions.wild?.() ?? true, speed = LS.get('st_speed') || 'normal';
    const row = (title, opts, cur, attr, note) => `<div class="hp-set"><b>${title}</b><div>${opts.map(([k, t]) => `<button class="hp-sub${cur === k ? ' on' : ''}" ${attr}="${k}">${t}</button>`).join('')}</div>${note ? `<small>${note}</small>` : ''}</div>`;
    return `<div class="hp-settings">
        ${row('🗺️ Đồ hoạ bản đồ', [['auto', '🤖 Tự động'], ['high', '✨ Đẹp'], ['low', '⚡ Nhẹ'], ['2d', '🗺️ Phẳng 2D']], q, 'data-hp-q',
            softwareGL() ? '⚠️ Trình duyệt đang vẽ bằng phần mềm (chưa dùng card đồ hoạ) — nên dùng Phẳng 2D. Bật “Tăng tốc phần cứng” trong cài đặt trình duyệt rồi mở lại để chơi 3D.' : 'Tự động: đẹp nhất mà máy vẫn mượt')}
        ${row('🌾 Gặp quái ở cỏ cao', [['on', 'Bật'], ['off', 'Tắt']], wild ? 'on' : 'off', 'data-hp-wild', 'Ruộng lúa, bãi cỏ rừng, cỏ ven đường · không tốn thể lực')}
        ${row('💬 Tốc độ chữ hội thoại', [['slow', 'Chậm'], ['normal', 'Vừa'], ['fast', 'Nhanh'], ['instant', 'Hiện ngay']], speed, 'data-hp-speed')}
        <div class="hp-set"><b>🔊 Âm thanh</b><small>Nhạc nền và tiếng động sẽ có ở bản sau.</small></div>
        <div class="hp-set"><b>✴️ Nhân vật chính</b><small>${data.player ? `${data.player.gender === 'f' ? '♀ Nữ' : '♂ Nam'} · ${data.player.name}` : 'Chưa tạo'}</small></div>
    </div>`;
}

// ---------- bấm ----------
function onClick(e) {
    const q = (s) => e.target.closest(s);
    if (q('[data-hp-close]') || e.target === root) return close();
    const t = q('[data-hp-tab]'); if (t) { tab = t.dataset.hpTab; msg = null; return render(); }
    const hh = q('[data-hp-hero]'); if (hh) { sel = hh.dataset.hpHero; return render(); }
    const s = q('[data-hp-sub]'); if (s) { sub = s.dataset.hpSub; return render(); }
    const bt = q('[data-hp-bag]'); if (bt) { bagTab = bt.dataset.hpBag; return render(); }
    const sk = q('[data-hp-skin]'); if (sk && !sk.disabled) { socket.emit('setSkin', { classId: sel, skin: sk.dataset.hpSkin === 'auto' ? null : sk.dataset.hpSkin }); return; }
    const ex = q('[data-hp-exp]'); if (ex && !ex.disabled) { socket.emit('heroUseItem', { classId: sel, itemId: ex.dataset.hpExp }); return; }
    const b = q('[data-hp-buy]'); if (b) { socket.emit('buyItem', { id: b.dataset.hpBuy }); return; }
    const g = q('[data-hp-go]'); if (g) { const k = g.dataset.hpGo; close(); return actions[k]?.(); }
    const qq = q('[data-hp-q]'); if (qq) { actions.setQuality?.(qq.dataset.hpQ); return render(); }
    const w = q('[data-hp-wild]'); if (w) { actions.setWild?.(w.dataset.hpWild === 'on'); return render(); }
    const sp = q('[data-hp-speed]'); if (sp) { LS.set('st_speed', sp.dataset.hpSpeed); return render(); }
}

export function setupHeroPanel() {
    el().style.display = 'none';
    socket.on('heroPanel', (d) => { data = d; if (open) render(); });
    socket.on('heroPanelMsg', (m) => { msg = m; if (open) render(); });
    socket.on('progressMsg', (m) => { if (open) { msg = m; render(); } });
}
