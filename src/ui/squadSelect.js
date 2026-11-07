// ============================================================
// CHỌN ĐỘI HÌNH TRƯỚC TRẬN — chọn 1 đến 4 nhân vật, bấm "Xác nhận" mới vào trận
// ============================================================
// Server gửi 'squadSelect' (sau khi chọn chế độ / bấm chơi lại) -> hiện bảng chọn.
//   Test / Đấu với quái : 1 bảng (đội của bạn)
//   Đấu với tướng      : 2 bảng 1P (bạn) và 2P (AI điều khiển)
// Bấm thẻ để chọn / bỏ chọn, nút "Bỏ chọn tất cả" xoá hết (cả 1P lẫn 2P), nhớ lựa chọn lần trước (server lưu).
// Phím: 1-9 chọn cho 1P, Enter = xác nhận.
import { net, socket } from '../net/socket.js';
import { warmTextures } from '../core/textures.js';
import { tierUrls } from '../characters/sprite/tiers.js';

const PORTRAITS = import.meta.glob('../assets/portraits/*.png', { eager: true, import: 'default' });
const portrait = (id) => PORTRAITS[`../assets/portraits/${id}.png`];
const RANK_COLORS = ['#94a3b8', '#60a5fa', '#c084fc', '#fbbf24'];
const MODE_TITLE = {
    test: '🧪 TEST · CHỌN ĐỘI HÌNH',
    duel_monster: '⚔️ ĐẤU VỚI QUÁI',
    duel_hero: '⚔️ ĐẤU VỚI TƯỚNG',
    campaign: '📖 CỐT TRUYỆN · CHỌN ĐỘI HÌNH',
};

const SQUAD_ORDER = ['assassin', 'warrior', 'archer', 'priest', 'mage', 'reaper', 'wrestler', 'dancer', 'elementalist', 'alchemist', 'summoner'];
const FALLBACK_HEROES = {
    assassin: { id: 'assassin', name: 'Jessica', title: 'Lôi Ám', className: 'Sát Thủ', emoji: '🥷', color: '#1e293b', race: 'Human', raceEmoji: '🧑', level: 1, rank: 0, rankName: 'Thường', dmgType: 'physical', hp: 1260, atk: 231 },
    warrior: { id: 'warrior', name: 'Rok', title: 'Thiết Hộ', className: 'Chiến Binh', emoji: '🛡️', color: '#475569', race: 'Human', raceEmoji: '🧑', level: 1, rank: 0, rankName: 'Thường', dmgType: 'physical', hp: 3360, atk: 158 },
    archer: { id: 'archer', name: 'Lyra', title: 'Phong Tiễn', className: 'Cung Thủ', emoji: '🏹', color: '#0f766e', race: 'Elf', raceEmoji: '🧝', level: 1, rank: 0, rankName: 'Thường', dmgType: 'physical', hp: 1000, atk: 200 },
    priest: { id: 'priest', name: 'Seraphine', title: 'Thánh Quang', className: 'Tu Sĩ', emoji: '✨', color: '#ca8a04', race: 'Human', raceEmoji: '🧑', level: 1, rank: 0, rankName: 'Thường', dmgType: 'magic', hp: 1155, atk: 189 },
    mage: { id: 'mage', name: 'Ignar', title: 'Hỏa Ngục', className: 'Phù Thủy', emoji: '🔥', color: '#b91c1c', race: 'Human', raceEmoji: '🧑', level: 1, rank: 0, rankName: 'Thường', dmgType: 'magic', hp: 998, atk: 231 },
    reaper: { id: 'reaper', name: 'Zerith', title: 'U Minh', className: 'Sát Thủ', emoji: '💀', color: '#9f1239', race: 'Devil', raceEmoji: '😈', level: 1, rank: 0, rankName: 'Thường', dmgType: 'magic', hp: 1150, atk: 235 },
    wrestler: { id: 'wrestler', name: 'Brakk', title: 'Cuồng Đấu', className: 'Chiến Binh', emoji: '🐉', color: '#b45309', race: 'Dragon', raceEmoji: '🐉', level: 1, rank: 0, rankName: 'Thường', dmgType: 'physical', hp: 4600, atk: 180 },
    dancer: { id: 'dancer', name: 'Nerissa', title: 'Thủy Vũ', className: 'Tu Sĩ', emoji: '🌊', color: '#0891b2', race: 'Elf', raceEmoji: '🧝', level: 1, rank: 0, rankName: 'Thường', dmgType: 'magic', hp: 1050, atk: 170 },
    elementalist: { id: 'elementalist', name: 'Elarion', title: 'Tam Nguyên', className: 'Phù Thủy', emoji: '🔮', color: '#7c3aed', race: 'Elf', raceEmoji: '🧝', level: 1, rank: 0, rankName: 'Thường', dmgType: 'magic', hp: 1300, atk: 276 },
    alchemist: { id: 'alchemist', name: 'Grix', title: 'Lục Độc', className: 'Phù Thủy', emoji: '🧪', color: '#65a30d', race: 'Goblin', raceEmoji: '👺', level: 1, rank: 0, rankName: 'Thường', dmgType: 'magic', hp: 900, atk: 200 },
    summoner: { id: 'summoner', name: 'Sylva', title: 'Lâm Linh', className: 'Triệu Hồi Sư', emoji: '🦌', color: '#16a34a', race: 'Elf', raceEmoji: '🧝', level: 1, rank: 0, rankName: 'Thường', dmgType: 'magic', hp: 950, atk: 190 },
};

let lastProgress = null;
let lastClassDefs = null;
let lastCampaignPick = null;

function buildHeroForCampaign(id, providedHero) {
    const base = { ...(FALLBACK_HEROES[id] ?? { id, name: id, title: '', className: '', emoji: '⚔️', color: '#475569', race: 'Human', raceEmoji: '🧑', level: 1, rank: 0, rankName: 'Thường', dmgType: 'physical', hp: 1000, atk: 150 }) };
    const def = lastClassDefs?.[id];
    if (def) {
        base.name = def.name ?? base.name;
        base.title = def.title ?? base.title;
        base.className = def.className ?? base.className;
        base.emoji = def.emoji ?? base.emoji;
        base.color = def.color ?? base.color;
        base.dmgType = def.dmgType ?? base.dmgType;
    }
    const ph = lastProgress?.heroes?.[id];
    if (ph) {
        base.level = ph.level ?? base.level;
        base.rank = ph.rank ?? base.rank;
        base.rankName = ph.rankName ?? base.rankName;
        if (ph.stats) {
            base.hp = ph.stats.maxHp ?? base.hp;
            base.atk = Math.max(ph.stats.pAtk ?? 0, ph.stats.mAtk ?? 0) || base.atk;
        }
        const raceDef = lastProgress?.meta?.races?.[ph.race ?? def?.race];
        if (raceDef) {
            base.race = raceDef.name ?? base.race;
            base.raceEmoji = raceDef.emoji ?? base.raceEmoji;
        }
    }
    if (providedHero && typeof providedHero === 'object') {
        Object.assign(base, providedHero);
    }
    return base;
}

let state = null;   // { heroes, sides: { p1:Set, p2:Set }, min, max, mode, dual, stageId?, diff?, stageLabel?, onBack? }
let root = null;

function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'squad-select';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    return root;
}

function grid(side, compact) {
    const { heroes, max } = state;
    const selected = state.sides[side];
    const n = selected.size;
    const order = heroes.filter(h => selected.has(h.id)).map(h => h.id);
    const cols = heroes.length > 10 ? 6 : Math.min(heroes.length, 5);
    return `<div class="ss-grid${compact ? ' compact' : ''}" style="--cols:${cols}">
        ${heroes.map((h, i) => {
            const on = selected.has(h.id);
            const full = !on && n >= max;
            return `
            <button class="ss-card${on ? ' on' : ''}${full ? ' full' : ''}" data-ss="${h.id}" data-side="${side}" style="--cc:${h.color}">
                ${side === 'p1' ? `<span class="ss-key">${i + 1}</span>` : ''}
                ${on ? `<span class="ss-check">✓ ${order.indexOf(h.id) + 1}</span>` : ''}
                <div class="ss-art">${portrait(h.id) ? `<img src="${portrait(h.id)}" alt="${h.name}" draggable="false">` : `<span class="ss-emoji">${h.emoji}</span>`}</div>
                <div class="ss-name">${h.emoji} ${h.name}</div>
                ${compact ? '' : `<div class="ss-title">${h.title}</div>`}
                <div class="ss-tags"><span>${h.className}</span>${compact ? '' : `<span>${h.raceEmoji} ${h.race}</span>`}</div>
                <div class="ss-lv">Lv ${h.level} <b style="color:${RANK_COLORS[h.rank]}">${h.rankName}</b></div>
                ${compact ? '' : `<div class="ss-stats"><span>❤ ${h.hp.toLocaleString()}</span><span>${h.dmgType === 'magic' ? '✦' : '⚔'} ${h.atk}</span></div>`}
            </button>`;
        }).join('')}
    </div>`;
}

function render() {
    const box = el();
    const { min, max, dual, mode } = state;
    const n1 = state.sides.p1.size, n2 = state.sides.p2.size;
    const ok = n1 >= min && (!dual || n2 >= min);
    const sub = mode === 'campaign'
        ? `${state.stageLabel ? `${state.stageLabel} · ` : ''}Chọn ${min} – ${max} anh hùng đã sở hữu ra trận`
        : mode === 'test' ? `Chọn ${min} – ${max} nhân vật ra trận`
        : mode === 'duel_monster' ? `Chọn ${min} – ${max} nhân vật · mọi nhân vật Lv60 SSS · quái Lv60 · không có tool`
        : `Mỗi bên ${min} – ${max} nhân vật · Lv60 SSS · 2P do AI điều khiển · không có tool`;
    const goText = mode === 'campaign' ? 'Vào trận' : mode === 'test' ? 'Xác nhận vào trận' : 'Vào đấu';
    box.innerHTML = `
    <div class="ss-box${dual ? ' dual' : ''}">
        <div class="ss-head">
            <h2>${MODE_TITLE[mode] ?? 'CHỌN ĐỘI HÌNH'}</h2>
            <p class="ss-sub">${sub}</p>
        </div>
        <div class="ss-body">

        ${dual ? `
        <div class="ss-dual">
            <div class="ss-side p1"><div class="ss-side-h">🔵 1P <span>(bạn) · ${n1}/${max}</span></div>${grid('p1', true)}</div>
            <div class="ss-vs">VS</div>
            <div class="ss-side p2"><div class="ss-side-h">🔴 2P <span>(AI) · ${n2}/${max}</span></div>${grid('p2', true)}</div>
        </div>` : grid('p1', false)}
        </div>
        <div class="ss-foot">
            <button class="ss-quick" data-ss-back>← ${mode === 'campaign' ? 'Chọn ải' : 'Chọn chế độ'}</button>
            <span class="ss-count">${dual ? `🔵 1P: <b>${n1}</b>/${max} · 🔴 2P: <b>${n2}</b>/${max}` : `Đã chọn <b>${n1}</b> / ${max}`}</span>
            <button class="ss-quick" data-ss-clear ${n1 + (dual ? n2 : 0) ? '' : 'disabled'}>✕ Bỏ chọn tất cả</button>
            <button class="ss-go" data-ss-go ${ok ? '' : 'disabled'}>⚔️ ${goText}</button>
        </div>
        ${state.error ? `<div class="ss-err">${state.error}</div>` : ''}
    </div>`;
}

function toggle(side, id) {
    const selected = state.sides[side];
    if (selected.has(id)) selected.delete(id);
    else if (selected.size < state.max) selected.add(id);
    state.error = null;
    render();
}

function confirm() {
    if (!state) return;
    const { min, dual, mode } = state;
    if (state.sides.p1.size < min || (dual && state.sides.p2.size < min)) return;
    // giữ thứ tự đội hình chuẩn của server (đứng trước / sau)
    const list = (side) => state.heroes.map(h => h.id).filter(id => state.sides[side].has(id));
    if (mode === 'campaign') {
        const classes = list('p1');
        lastCampaignPick = classes;
        net.startStage({ id: state.stageId, diff: state.diff, classes });
        hide();
        return;
    }
    socket.emit('confirmSquad', { classes: list('p1'), enemyClasses: dual ? list('p2') : undefined });
    hide();
}

function onClick(e) {
    const card = e.target.closest('[data-ss]');
    if (card) return toggle(card.dataset.side ?? 'p1', card.dataset.ss);
    if (e.target.closest('[data-ss-clear]')) {
        state.sides.p1 = new Set();
        if (state.dual) state.sides.p2 = new Set();
        state.error = null;
        return render();
    }
    if (e.target.closest('[data-ss-back]')) {
        const onBack = state?.mode === 'campaign' ? state.onBack : null;
        hide();
        if (onBack) { onBack(); return; }
        socket.emit('backToMenu');
        return;
    }
    if (e.target.closest('[data-ss-go]')) confirm();
}

function onKey(e) {
    if (!state || !root || root.style.display === 'none') return;
    if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); confirm(); return; }
    const i = e.key === '0' ? 9 : e.key === '-' ? 10 : Number(e.key) - 1;
    if (i >= 0 && i < state.heroes.length) { e.preventDefault(); e.stopImmediatePropagation(); toggle('p1', state.heroes[i].id); }
}

function show(data) {
    const ownedSet = data.mode === 'campaign' && Array.isArray(data.owned) ? new Set(data.owned) : null;
    const rawHeroes = Array.isArray(data.heroes) ? data.heroes : [];
    const heroes = ownedSet ? rawHeroes.filter(h => ownedSet.has(h.id)) : rawHeroes;
    const validIds = new Set(heroes.map(h => h.id));
    const sel = (data.selected ?? []).filter(id => validIds.has(id)).slice(0, data.max ?? 4);
    state = {
        heroes, min: data.min ?? 1, max: data.max ?? 4, mode: data.mode ?? 'test', dual: !!data.dual, error: null,
        stageId: data.stageId, diff: data.diff, stageLabel: data.stageLabel, onBack: data.onBack,
        sides: { p1: new Set(sel.length ? sel : heroes.slice(0, data.max ?? 4).map(h => h.id)), p2: new Set(data.enemySelected ?? sel) },
    };
    render();
    el().style.display = 'flex';
    document.body.classList.add('selecting-squad');
}

/** Mở bảng chọn đội cho chế độ Cốt truyện: chỉ hiện anh hùng trong `owned`, tối đa 4 */
export function openCampaignSquadSelect({ id, diff, stageLabel, owned = ['assassin', 'warrior', 'priest'], heroes: providedHeroes, onBack }) {
    const ownedSet = new Set(Array.isArray(owned) && owned.length ? owned : ['assassin', 'warrior', 'priest']);
    const providedMap = Array.isArray(providedHeroes)
        ? Object.fromEntries(providedHeroes.map(h => [h.id, h]))
        : (providedHeroes ?? {});
    const order = [
        ...SQUAD_ORDER.filter(hid => ownedSet.has(hid)),
        ...[...ownedSet].filter(hid => !SQUAD_ORDER.includes(hid)),
    ];
    const heroes = order.map(hid => buildHeroForCampaign(hid, providedMap[hid]));
    const defaultPick = (lastCampaignPick ?? order).filter(hid => ownedSet.has(hid)).slice(0, 4);
    show({
        heroes,
        owned: [...ownedSet],
        selected: defaultPick.length ? defaultPick : order.slice(0, 4),
        min: 1,
        max: 4,
        mode: 'campaign',
        dual: false,
        stageId: id,
        diff,
        stageLabel,
        onBack,
    });
}

function hide() {
    if (root) root.style.display = 'none';
    document.body.classList.remove('selecting-squad');
}

export const isSquadSelectOpen = () => !!root && root.style.display !== 'none';

export function setupSquadSelect() {
    socket.on('progressUpdate', (d) => { lastProgress = d; warmTextures(tierUrls(d)); });   // nạp ngầm tranh bậc S / SS của đội -> vào trận không khựng
    socket.on('battleStart', (d) => {
        if (d?.classDefs) lastClassDefs = d.classDefs;
        if (d?.mode && d.mode !== 'menu') hide();
    });
    socket.on('squadSelect', show);
    socket.on('squadSelectError', (d) => { if (state) { state.error = d.text; render(); el().style.display = 'flex'; } });
    socket.on('campaignError', hide);
    socket.on('countdown', hide);
    socket.on('mainMenu', hide);
    window.addEventListener('keydown', onKey, true);
}
