import { icon } from './icons.js';
import '../styles/account.css';
// ============================================================
// 📖 CHẾ ĐỘ CỐT TRUYỆN (CAMPAIGN) — Chương 1: Ngọn Lửa Dưới Thánh Huy
//   · Màn chọn ải: ví (Vàng, Kim Cương, Đá Cường Hoá), thể lực (value/360 + đếm ngược + hộp xác nhận mua),
//     3 tab độ khó (Cốt truyện / Khó / Địa ngục), 20 ải chia 3 phần + khu Nhánh ẩn
//   · Màn kết quả trận (stageResult): Thắng / Thua, thưởng, lần đầu qua, lên cấp, Lyra gia nhập, hoàn thể lực
// ============================================================
import { net, socket } from '../net/socket.js';
import { openCampaignSquadSelect } from './squadSelect.js';
import { showModeMenu, unlockText } from './modeMenu.js';
import { hideBattleResult, afterBattleEnd } from './overlays.js';
import { showGear } from './gear.js';
import { showWorld, hideWorld } from './world.js';
import { playStory, stageBackdrop } from './story.js';
import { showExtras } from './extras.js';

const STAMINA_MAX = 360;
const STAMINA_REGEN_SEC = 300;
// cấp quái hiển thị — giống enemyLevel trong game/campaign.js (Khó 38 + 0,55 × cấp ải, tối đa 60 · Địa ngục 60)
const enemyLv = (level, diff) => diff === 'hard' ? Math.min(60, Math.max(level + 5, Math.round(38 + 0.55 * level))) : diff === 'hell' ? 60 : level;
const DIFF_META = {
    story: { key: 'story', name: 'Cốt truyện', icon: '📖', cost: 4, lvAdd: 0, lockWhy: 'Mặc định mở', sub: 'Độ khó chuẩn' },
    hard: { key: 'hard', name: 'Khó', icon: '🔥', cost: 6, lvAdd: 5, sub: 'Quái cấp 39–60 · hợp với đội bậc SS', get lockWhy() { return unlockText('hard'); } },
    hell: { key: 'hell', name: 'Địa ngục', icon: '💀', cost: 10, lvAdd: 10, sub: 'Quái cấp 60 · hợp với đội bậc SSS', get lockWhy() { return unlockText('hell'); } },
};

const PARTS = [
    { key: 'lang', icon: '🏘️', title: 'Phần 1 — Làng Ashford', range: 'Ải 1–10' },
    { key: 'duong', icon: '🛤️', title: 'Đoạn nối — Đường Vương Đạo', range: 'Ải 11–12' },
    { key: 'kinh', icon: '🏰', title: 'Phần 2 — Kinh thành Valoria', range: 'Ải 13–20' },
];

const CHAPTER_SUB = { c1: 'Tộc Người · Làng Ashford · Đường Vương Đạo · Kinh thành Valoria', c2: 'Tộc Elf · Bìa rừng Sylvaren · Cầu Rễ Cổ · Thành cây Lunaria' };
const BOSS_LABELS = {
    1: { stars: '⭐', text: 'Trùm nhỏ', cls: 'boss-mini' },
    2: { stars: '⭐⭐', text: 'Trùm giữa chương', cls: 'boss-mid' },
    3: { stars: '⭐⭐⭐', text: 'Trùm cuối', cls: 'boss-final' },
};

const C2_HINTS = { 7: '💧 Nerissa gia nhập', 12: '🦌 Sylva gia nhập', 18: '🔮 Elarion gia nhập', 20: '🏆 Kết chương 2' };
const STAGE_HINTS = { 10: 'Đường lên kinh thành', 12: 'Giải cứu Lyra 🏹' };

const HERO_NAMES = {
    assassin: { name: 'Jessica', emoji: '🥷', title: 'Sát Thủ' },
    warrior: { name: 'Rok', emoji: '🛡️', title: 'Chiến Binh' },
    archer: { name: 'Lyra', emoji: '🏹', title: 'Cung Thủ' },
    priest: { name: 'Seraphine', emoji: '✨', title: 'Tu Sĩ' },
    mage: { name: 'Ignar', emoji: '🔥', title: 'Phù Thủy' },
    reaper: { name: 'Zerith', emoji: '💀', title: 'Sát Thủ' },
    wrestler: { name: 'Brakk', emoji: '🐉', title: 'Chiến Binh' },
    dancer: { name: 'Nerissa', emoji: '🌊', title: 'Tu Sĩ' },
    elementalist: { name: 'Elarion', emoji: '🔮', title: 'Phù Thủy' },
    alchemist: { name: 'Grix', emoji: '🧪', title: 'Phù Thủy' },
    summoner: { name: 'Sylva', emoji: '🦌', title: 'Triệu Hồi Sư' },
};

/** Dữ liệu mặc định 20 ải + 5 nhánh Chương 1 (theo CHUONG_1_TOC_NGUOI.md) */
const DEFAULT_STAGES = [
    { id: 'c1-01', no: 1, name: 'Đêm ở cổng làng', part: 'lang', boss: 0 },
    { id: 'c1-02', no: 2, name: 'Cánh đồng cháy', part: 'lang', boss: 0 },
    { id: 'c1-03', no: 3, name: 'Rừng Sương', part: 'lang', boss: 0 },
    { id: 'c1-04', no: 4, name: 'Mỏ đá bỏ hoang', part: 'lang', boss: 0 },
    { id: 'c1-05', no: 5, name: 'Sói Đầu Đàn', part: 'lang', boss: 1 },
    { id: 'c1-06', no: 6, name: 'Trạm canh cháy', part: 'lang', boss: 0 },
    { id: 'c1-07', no: 7, name: 'Đầm lầy độc', part: 'lang', boss: 0 },
    { id: 'c1-08', no: 8, name: 'Trại Goblin ngoài', part: 'lang', boss: 0 },
    { id: 'c1-09', no: 9, name: 'Đêm trước trận chiến', part: 'lang', boss: 0 },
    { id: 'c1-10', no: 10, name: 'Skarn Răng Sắt', part: 'lang', boss: 2 },
    { id: 'c1-11', no: 11, name: 'Cầu Đá', part: 'duong', boss: 0 },
    { id: 'c1-12', no: 12, name: 'Trạm gác biên', part: 'duong', boss: 0 },
    { id: 'c1-13', no: 13, name: 'Chợ hỗn loạn', part: 'kinh', boss: 0 },
    { id: 'c1-14', no: 14, name: 'Ngõ tối', part: 'kinh', boss: 0 },
    { id: 'c1-15', no: 15, name: 'Morwen — Hiệp Sĩ Đen', part: 'kinh', boss: 1 },
    { id: 'c1-16', no: 16, name: 'Thư viện hoàng gia', part: 'kinh', boss: 0 },
    { id: 'c1-17', no: 17, name: 'Nhà thờ ánh sáng', part: 'kinh', boss: 0 },
    { id: 'c1-18', no: 18, name: 'Đại sảnh', part: 'kinh', boss: 0 },
    { id: 'c1-19', no: 19, name: 'Tường thành rực lửa', part: 'kinh', boss: 0 },
    { id: 'c1-20', no: 20, name: 'Đại tướng Valdric', part: 'kinh', boss: 3 },
];

const DEFAULT_BRANCHES = [
    { id: 'c1-n1', code: 'N1', name: 'Dưới Giếng Cổ', baseNo: 3 },
    { id: 'c1-n2', code: 'N2', name: 'Mỏ Sâu', baseNo: 6 },
    { id: 'c1-n3', code: 'N3', name: 'Bữa Tiệc Làng', baseNo: 8 },
    { id: 'c1-n4', code: 'N4', name: 'Trang Sách Bị Xé', baseNo: 16 },
    { id: 'c1-n5', code: 'N5', name: 'Hầm Mộ', baseNo: 18 },
];

let screenEl = null;
let resultEl = null;
let currentDiff = 'story';
let confirmBuyOpen = false;
let errorText = null;
let timerId = null;
let lastSelectedStage = null;

let state = createDefaultState();

function createDefaultState() {
    return {
        chapter: {
            id: 'c1',
            name: 'Ngọn Lửa Dưới Thánh Huy',
            stages: DEFAULT_STAGES.map((s, idx) => ({
                ...s,
                status: {
                    story: idx === 0 ? 'open' : 'locked',
                    hard: 'locked',
                    hell: 'locked',
                },
            })),
            branches: DEFAULT_BRANCHES.map((b) => ({
                ...b,
                status: { story: 'locked', hard: 'locked', hell: 'locked' },
            })),
        },
        wallet: { gold: 500, diamond: 100, stone: 0 },
        stamina: { value: 360, max: STAMINA_MAX, nextInSec: 0 },
        owned: ['assassin', 'warrior', 'priest'],
        features: ['command'],
        heroes: null,
    };
}

function normalizeStatus(st, fallbackStory = 'locked') {
    if (!st) return { story: fallbackStory, hard: 'locked', hell: 'locked' };
    if (typeof st === 'string') return { story: st, hard: 'locked', hell: 'locked' };
    return {
        story: st.story ?? fallbackStory,
        hard: st.hard ?? 'locked',
        hell: st.hell ?? 'locked',
    };
}

function normalizeState(raw = {}) {
    const base = createDefaultState();
    const ch = raw.chapter ?? raw;
    const rawStages = Array.isArray(ch.stages) ? ch.stages : [];
    const stageById = Object.fromEntries(rawStages.map(s => [s.id ?? `c1-${String(s.no).padStart(2, '0')}`, s]));
    const stageByNo = Object.fromEntries(rawStages.filter(s => s.no != null).map(s => [s.no, s]));

    const otherChapter = ch.id && ch.id !== 'c1';
    const stages = otherChapter ? rawStages.map((st, idx) => ({ ...st, status: normalizeStatus(st.status, idx === 0 ? 'open' : 'locked') })) : DEFAULT_STAGES.map((def, idx) => {
        const s = stageById[def.id] ?? stageByNo[def.no] ?? {};
        return {
            ...def,
            ...s,
            id: s.id ?? def.id,
            no: s.no ?? def.no,
            name: s.name ?? def.name,
            part: s.part ?? def.part,
            boss: s.boss ?? def.boss,
            status: normalizeStatus(s.status, idx === 0 ? 'open' : 'locked'),
        };
    });

    const rawBranches = Array.isArray(ch.branches) ? ch.branches : [];
    const branchById = Object.fromEntries(rawBranches.map(b => [b.id, b]));
    const branches = otherChapter ? [] : DEFAULT_BRANCHES.map((def) => {
        const b = branchById[def.id] ?? {};
        const fallback = b.unlocked ? 'open' : 'locked';
        return {
            ...def,
            ...b,
            id: b.id ?? def.id,
            code: b.code ?? def.code,
            name: b.name ?? def.name,
            baseNo: b.baseNo ?? def.baseNo,
            status: normalizeStatus(b.status, fallback),
        };
    });
    // Nếu server gửi thêm nhánh ngoài danh sách mặc định
    for (const b of rawBranches) {
        if (b?.id && !branches.some(x => x.id === b.id)) {
            branches.push({
                id: b.id,
                code: b.code ?? b.id.toUpperCase(),
                name: b.name ?? b.id,
                baseNo: b.baseNo ?? 1,
                status: normalizeStatus(b.status, b.unlocked ? 'open' : 'locked'),
            });
        }
    }

    const wallet = {
        gold: Number(raw.wallet?.gold ?? base.wallet.gold),
        diamond: Number(raw.wallet?.diamond ?? base.wallet.diamond),
        stone: Number(raw.wallet?.stone ?? base.wallet.stone),
    };

    let stamina;
    if (typeof raw.stamina === 'number') {
        const val = raw.stamina;
        stamina = { value: val, max: STAMINA_MAX, nextInSec: val < STAMINA_MAX ? STAMINA_REGEN_SEC : 0 };
    } else {
        const val = Number(raw.stamina?.value ?? base.stamina.value);
        const max = Number(raw.stamina?.max ?? STAMINA_MAX);
        let nextInSec = raw.stamina?.nextInSec;
        if (nextInSec == null) {
            if (val >= max) nextInSec = 0;
            else if (raw.stamina?.lastAt) {
                const elapsed = Math.max(0, Math.floor((Date.now() - raw.stamina.lastAt) / 1000));
                nextInSec = STAMINA_REGEN_SEC - (elapsed % STAMINA_REGEN_SEC);
            } else {
                nextInSec = STAMINA_REGEN_SEC;
            }
        }
        stamina = { value: val, max, nextInSec: Math.max(0, Math.floor(nextInSec)) };
    }

    const owned = Array.isArray(raw.owned) && raw.owned.length ? [...raw.owned] : base.owned;
    const features = Array.isArray(raw.features) ? [...raw.features] : (raw.features instanceof Set ? [...raw.features] : base.features);

    return {
        chapter: {
            id: ch.id ?? 'c1',
            no: ch.no ?? 1,
            name: ch.name ?? 'Ngọn Lửa Dưới Thánh Huy',
            parts: ch.parts ?? PARTS,
            chapters: ch.chapters ?? [{ id: 'c1', no: 1, name: 'Ngọn Lửa Dưới Thánh Huy', open: true }],
            stages,
            branches,
        },
        wallet,
        stamina,
        owned,
        features, account: raw.account ?? state?.account,
        heroes: raw.squad?.heroes ?? raw.heroes ?? state?.heroes ?? null,   // server gửi dữ liệu bảng chọn đội trong `squad`
        story: raw.story ?? state?.story ?? null,   // lời thoại trước ải (P4)
        spots: raw.spots ?? state?.spots ?? {},   // ải chỉ bắt đầu từ bản đồ -> gợi ý đi đâu
    };
}

function isDiffUnlocked(diff) {
    if (diff === 'story') return { ok: true };
    const feats = new Set(state.features ?? []);
    if (diff === 'hard' || diff === 'hell') return { ok: feats.has(diff), why: unlockText(diff) };
    return { ok: false, why: 'Độ khó chưa mở' };
}

function formatSec(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function staminaTimerHTML() {
    const { value, max = STAMINA_MAX, nextInSec = 0 } = state.stamina ?? {};
    if (value >= max) {
        return `<span class="cp-stamina-timer full">${value > max ? 'Đầy (vượt giới hạn)' : 'Đầy'}</span>`;
    }
    return `<span class="cp-stamina-timer" id="cp-stamina-countdown">+1 sau ${formatSec(nextInSec || STAMINA_REGEN_SEC)}</span>`;
}

function ensureScreenEl() {
    if (screenEl) return screenEl;
    screenEl = document.createElement('div');
    screenEl.id = 'campaign-screen';
    document.body.appendChild(screenEl);
    screenEl.addEventListener('click', onScreenClick);
    return screenEl;
}

function ensureResultEl() {
    if (resultEl) return resultEl;
    resultEl = document.createElement('div');
    resultEl.id = 'campaign-result';
    document.body.appendChild(resultEl);
    resultEl.addEventListener('click', onResultClick);
    return resultEl;
}

function startStaminaTicker() {
    if (timerId) return;
    timerId = setInterval(() => {
        if (!state?.stamina) return;
        const max = state.stamina.max ?? STAMINA_MAX;
        if (state.stamina.value >= max) return;
        if (state.stamina.nextInSec > 1) {
            state.stamina.nextInSec -= 1;
        } else {
            state.stamina.value = Math.min(max, state.stamina.value + 1);
            state.stamina.nextInSec = state.stamina.value < max ? STAMINA_REGEN_SEC : 0;
            renderCampaign();
            return;
        }
        const timerSpan = document.getElementById('cp-stamina-countdown');
        if (timerSpan) {
            timerSpan.textContent = `+1 sau ${formatSec(state.stamina.nextInSec)}`;
        }
    }, 1000);
}

function stageCardHTML(s) {
    const st = s.status?.[currentDiff] ?? 'locked';
    const diffInfo = DIFF_META[currentDiff] ?? DIFF_META.story;
    const bossInfo = BOSS_LABELS[s.boss] ?? null;
    const lv = enemyLv(s.level ?? s.no ?? 1, diffInfo.key);
    const hint = String(s.id ?? 'c1').startsWith('c1') ? STAGE_HINTS[s.no] : C2_HINTS[s.no];
    const statusBadge = st === 'cleared'
        ? `<span class="cp-stage-badge cleared">✓ Đã qua</span>`
        : st === 'open'
        ? `<span class="cp-stage-badge open">⚔️ Khiêu chiến</span>`
        : `<span class="cp-stage-badge locked">🔒 Khoá</span>`;

    return `
    <button class="cp-stage-card ${st} ${bossInfo ? `boss ${bossInfo.cls}` : ''}" data-cp-stage="${s.id}" data-cp-status="${st}">
        <div class="cp-stage-top">
            <span class="cp-stage-no">Ải ${s.no}</span>
            ${bossInfo ? `<span class="cp-boss-tag ${bossInfo.cls}">${bossInfo.stars} ${bossInfo.text}</span>` : ''}
            ${statusBadge}
        </div>
        <div class="cp-stage-name">${st === 'locked' ? '🔒 ' : st === 'cleared' ? '✓ ' : ''}${s.name}</div>
        <div class="cp-stage-meta">
            <span>Quái Lv${lv}</span>
            <span>⚡ ${diffInfo.cost}</span>
        </div>
        ${hint ? `<div class="cp-stage-hint">🎁 ${hint}</div>` : ''}
    </button>`;
}

function branchCardHTML(b) {
    const st = b.status?.[currentDiff] ?? b.status?.story ?? 'open';
    const diffInfo = DIFF_META[currentDiff] ?? DIFF_META.story;
    const lv = enemyLv(b.baseNo ?? 1, diffInfo.key);
    const code = b.code ?? b.id.replace('c1-', '').toUpperCase();
    const hasPrefix = b.name.startsWith(code);
    const displayName = hasPrefix ? b.name : `${code} · ${b.name}`;
    const statusBadge = st === 'cleared'
        ? `<span class="cp-stage-badge cleared">✓ Đã qua</span>`
        : `<span class="cp-stage-badge open">⚔️ Khiêu chiến</span>`;

    return `
    <button class="cp-stage-card branch ${st}" data-cp-stage="${b.id}" data-cp-status="${st}">
        <div class="cp-stage-top">
            <span class="cp-stage-no">🌿 Nhánh ${code}</span>
            ${statusBadge}
        </div>
        <div class="cp-stage-name">${st === 'cleared' ? '✓ ' : ''}${displayName}</div>
        <div class="cp-stage-meta">
            <span>Quái Lv${lv}</span>
            <span>⚡ ${diffInfo.cost}</span>
        </div>
    </button>`;
}

export function renderCampaign() {
    const box = ensureScreenEl();
    const { wallet, stamina, chapter } = state;
    const diffCheck = isDiffUnlocked(currentDiff);
    if (!diffCheck.ok && currentDiff !== 'story') {
        currentDiff = 'story';
    }

    const tabsHTML = Object.values(DIFF_META).map((d) => {
        const chk = isDiffUnlocked(d.key);
        const active = currentDiff === d.key;
        return `
        <button class="cp-diff-tab${active ? ' active' : ''}${chk.ok ? '' : ' locked'}" data-cp-diff="${d.key}">
            <div class="cp-diff-main">
                <span>${chk.ok ? d.icon : '🔒'} <b>${d.name}</b></span>
                <span class="cp-diff-cost">⚡${d.cost}</span>
            </div>
            <div class="cp-diff-sub">${chk.ok ? d.sub : chk.why}</div>
        </button>`;
    }).join('');

    // Server test: hiện đủ mọi ải, bấm vào đánh luôn không cần ra bản đồ
    // Ải chính có điểm truyện ngoài bản đồ: Bảng ải chỉ hiện ải ĐÃ QUA (đánh lại / Khó / Địa ngục) + ải vừa mở từ bản đồ;
    // ải kế tiếp chưa qua -> 1 thẻ chỉ đường ra bản đồ
    let nextSpot = null;
    const partsHTML = (chapter.parts ?? PARTS).map((p) => {
        const all = (chapter.stages ?? []).filter(s => s.part === p.key);
        const list = all.filter(s => {
            if (!state.spots?.[s.id] || testServer() || s.status?.story === 'cleared' || (s.id === worldOrigin && currentDiff === 'story')) return true;
            if (!nextSpot && s.status?.story === 'open') nextSpot = s;
            return false;
        });
        const clearedCount = all.filter(s => s.status?.[currentDiff] === 'cleared').length;
        const spotCard = currentDiff === 'story' && nextSpot && nextSpot.part === p.key && !list.includes(nextSpot) ? `
            <button class="cp-stage-card cp-spot-card" data-cp-world>
                <div class="cp-stage-top"><span class="cp-stage-no">Ải ${nextSpot.no}</span><span class="cp-stage-badge locked">🗺️ Ngoài bản đồ</span></div>
                <div class="cp-stage-name">${nextSpot.name}</div>
                <div class="cp-stage-hint">📍 ${state.spots[nextSpot.id]}</div>
            </button>` : '';
        if (!list.length && !spotCard) return '';
        return `
        <section class="cp-part-section" data-part="${p.key}">
            <div class="cp-part-header">
                <h3>${p.icon} ${p.title} <small>(${p.range})</small></h3>
                <span class="cp-part-progress">Đã qua <b>${clearedCount}</b>/${all.length}</span>
            </div>
            <div class="cp-stage-grid">
                ${list.map(stageCardHTML).join('')}${spotCard}
            </div>
        </section>`;
    }).join('');

    // Chỉ hiện các nhánh đã mở (status !== 'locked' ở độ khó hiện tại hoặc story)
    const unlockedBranches = (chapter.branches ?? []).filter((b) => {
        const stDiff = b.status?.[currentDiff];
        const stStory = b.status?.story;
        return (stDiff && stDiff !== 'locked') || (stStory && stStory !== 'locked');
    });

    const branchesHTML = `
    <section class="cp-part-section cp-branches-section">
        <div class="cp-part-header">
            <h3>🌿 Nhánh ẩn <small>(Mở khoá qua khám phá)</small></h3>
            <span class="cp-part-progress">Đã mở <b>${unlockedBranches.length}</b> nhánh</span>
        </div>
        ${unlockedBranches.length ? `
        <div class="cp-stage-grid cp-branch-grid">
            ${unlockedBranches.map(branchCardHTML).join('')}
        </div>` : `
        <div class="cp-branch-empty">Chưa có nhánh ẩn nào được mở khoá. Hãy vượt ải và giải câu đố trên bản đồ để tìm lối vào!</div>`}
    </section>`;

    const confirmBoxHTML = confirmBuyOpen ? `
    <div class="cp-confirm-backdrop" data-cp-buy-backdrop>
        <div class="cp-confirm-box" role="dialog" aria-modal="true">
            <h3>⚡ Mua Thể Lực</h3>
            <p class="cp-confirm-question">Dùng 50 Kim Cương đổi 60 thể lực?</p>
            <p class="cp-confirm-meta">Hiện có: <b>💎 ${wallet.diamond.toLocaleString('vi-VN')} Kim Cương</b> · <b>⚡ ${stamina.value}/${stamina.max ?? STAMINA_MAX}</b></p>
            <div class="cp-confirm-actions">
                <button class="cp-btn-cancel" data-cp-buy-cancel>Huỷ</button>
                <button class="cp-btn-confirm" data-cp-buy-confirm>Xác nhận</button>
            </div>
        </div>
    </div>` : '';

    box.innerHTML = `
    <div class="cp-container">
        <header class="cp-header">
            <div class="cp-title-row">
                <button class="cp-back-btn" data-cp-back>← Menu</button>
                <button class="cp-back-btn cp-gear-btn" data-cp-extras title="Hầm ngục · Quán ăn · Cửa hàng anh hùng">🏰 Hầm ngục</button>
                <button class="cp-back-btn cp-gear-btn" data-cp-world title="Bản đồ thế giới: đi lại, NPC, rương, nhiệm vụ mở nhánh ẩn">🗺️ Thế giới</button>
                <button class="cp-back-btn cp-gear-btn${hasFeature('gear') ? '' : ' locked'}" data-cp-gear title="${hasFeature('gear') ? 'Mặc đồ · Lò rèn' : unlockText('gear')}">${hasFeature('gear') ? '🎒' : '🔒'} Trang bị</button>
                <div class="cp-title-text">
                    <h1>📖 CHƯƠNG ${chapter.no ?? 1}: ${(chapter.name ?? 'Ngọn Lửa Dưới Thánh Huy').toUpperCase()}</h1>
                    <p>${CHAPTER_SUB[chapter.id] ?? ''}</p>
                </div>
            </div>
            ${(chapter.chapters ?? []).length > 1 ? `<div class="cp-chapter-tabs">${chapter.chapters.map(c => `<button class="cp-chapter-tab${c.id === chapter.id ? ' active' : ''}${c.open ? '' : ' locked'}" data-cp-chapter="${c.id}" ${c.open ? '' : 'disabled'}>
                ${c.open ? '📖' : '🔒'} Chương ${c.no}: ${c.name} <small>${c.open ? `${c.cleared ?? 0}/${c.total ?? 20}` : `Mở khi qua ải 20 chương ${c.no - 1}`}</small></button>`).join('')}</div>` : ''}
            ${accountHTML(state.account)}
            <div class="cp-resource-bar">
                <div class="cp-wallet-item gold" title="Vàng">
                    <span class="cp-res-icon">🪙</span>
                    <span class="cp-res-label">Vàng</span>
                    <b class="cp-res-val">${wallet.gold.toLocaleString('vi-VN')}</b>
                </div>
                <div class="cp-wallet-item diamond" title="Kim Cương">
                    <span class="cp-res-icon">💎</span>
                    <span class="cp-res-label">Kim Cương</span>
                    <b class="cp-res-val">${wallet.diamond.toLocaleString('vi-VN')}</b>
                </div>
                <div class="cp-wallet-item stone" title="Đá Cường Hoá">
                    <span class="cp-res-icon">🔷</span>
                    <span class="cp-res-label">Đá Cường Hoá</span>
                    <b class="cp-res-val">${wallet.stone.toLocaleString('vi-VN')}</b>
                </div>
                <div class="cp-stamina-box" title="Thể lực (hồi 1 điểm mỗi 5 phút, tối đa 360)">
                    <div class="cp-stamina-main">
                        <span class="cp-res-icon">⚡</span>
                        <span class="cp-res-label">Thể lực</span>
                        <b class="cp-stamina-val">${stamina.value}/${stamina.max ?? STAMINA_MAX}</b>
                        ${staminaTimerHTML()}
                    </div>
                    <button class="cp-buy-btn" data-cp-buy-open title="Mua 60 thể lực bằng 50 Kim Cương">+ Mua</button>
                </div>
            </div>
        </header>

        ${errorText ? `
        <div class="cp-error-banner" role="alert">
            <span>⚠️ ${errorText}</span>
            <button class="cp-error-close" data-cp-error-close title="Đóng">✕</button>
        </div>` : ''}

        <div class="cp-diff-tabs" role="tablist">
            ${tabsHTML}
        </div>

        <div class="cp-scroll-body">
            ${partsHTML}
            ${branchesHTML}
        </div>

        ${confirmBoxHTML}
    </div>`;
}

function findStageOrBranch(id) {
    const s = (state.chapter?.stages ?? []).find(x => x.id === id);
    if (s) return { item: s, isBranch: false };
    const b = (state.chapter?.branches ?? []).find(x => x.id === id);
    if (b) return { item: b, isBranch: true };
    return null;
}

function whyStageLocked(item, isBranch, diff) {
    if (isBranch) {
        return 'Chưa tìm ra lối vào nhánh ẩn này';
    }
    const diffChk = isDiffUnlocked(diff);
    if (!diffChk.ok) return diffChk.why;
    if (diff === 'hard') {
        const storyCleared = item.status?.story === 'cleared';
        if (!storyCleared) return `Hãy qua ải ${item.no} ở mức Cốt truyện trước`;
        return unlockText('hard');
    }
    if (diff === 'hell') {
        return 'Hãy qua ải này ở mức Khó trước';
    }
    const prevNo = Math.max(1, (item.no ?? 2) - 1);
    return `Hãy qua ải ${prevNo} ở mức Cốt truyện trước`;
}

function hasFeature(key) {
    return (state.features ?? []).includes(key);
}

/** Bản đồ thế giới là nơi xuất phát của Cốt truyện: từ đó mở màn chọn ải / trang bị, quay về Menu */
export function openWorldHub() {
    hideCampaign();
    showWorld({
        stages: () => { hideWorld(); net.campaignOpen(); showCampaign(); },
        gear: () => { hideWorld(); showGear(() => openWorldHub()); },
        extras: (tab) => { hideWorld(); showExtras(() => openWorldHub(), tab); },
        back: () => { showModeMenu(); net.backToMenu(); },
        // sự kiện trên bản đồ (bị Goblin vây, hộ tống Seraphine…) -> vào thẳng màn chọn đội của ải đó
        stage: (id) => { hideWorld(); pendingWorldStage = id; net.campaignOpen(String(id).slice(0, 2)); },   // điểm truyện / sự kiện trên bản đồ -> mở Bảng ải đúng chương
        // 🌾 cỏ cao: đánh luôn bằng đội lần trước, xong quay lại bản đồ
        wild: (scene) => { hideWorld(); battleFromWorld = true; lastSelectedStage = { id: `wild-${scene}`, diff: 'story', name: '🌾 Quái hoang', no: null }; net.startStage({ id: `wild-${scene}`, diff: 'story' }); },
    });
}
let pendingWorldStage = null, battleFromWorld = false;   // trận mở từ sự kiện bản đồ -> thắng xong quay lại bản đồ
const GUEST_NAME = { assassin: 'Jessica', priest: 'Seraphine', archer: 'Lyra' };
/** Ải có khách cốt truyện: ghi chú trên màn chọn đội ("+ Jessica đi cùng") */
const guestNote = (item) => item?.guests?.length ? ` · ✨ ${item.guests.map(g => GUEST_NAME[g] ?? g).join(', ')} đi cùng` : '';
// Điểm truyện / sự kiện trên bản đồ (đã xem lời trước ải ngoài bản đồ) -> mở BẢNG ẢI như bình thường, ải đó được đánh dấu sẵn;
// bấm vào ải đó: không phát lại lời thoại, thắng xong quay lại bản đồ
const preSeen = new Set();
const testServer = () => document.body.classList.contains('srv-test');
let worldOrigin = null;
function openWorldStage(id) {
    const found = findStageOrBranch(id);
    if (!found) { openWorldHub(); return; }
    preSeen.add(id);
    worldOrigin = id;
    currentDiff = 'story';
    errorText = null;
    showCampaign();
    requestAnimationFrame(() => {
        const card = screenEl?.querySelector(`[data-cp-stage="${id}"]`);
        if (!card) return;
        card.classList.add('cp-focus');
        card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
}

function onScreenClick(e) {
    if (e.target.closest('[data-cp-extras]')) {
        errorText = null;
        hideCampaign();
        showExtras(() => { net.campaignOpen(); showCampaign(); });
        return;
    }
    if (e.target.closest('[data-cp-world]')) {
        errorText = null;
        openWorldHub();
        return;
    }
    if (e.target.closest('[data-cp-gear]')) {
        if (!hasFeature('gear')) {
            errorText = unlockText('gear');
            renderCampaign();
            return;
        }
        errorText = null;
        hideCampaign();
        showGear(() => { net.campaignOpen(); showCampaign(); });
        return;
    }
    if (e.target.closest('[data-cp-back]')) {
        confirmBuyOpen = false;
        errorText = null;
        hideCampaign();
        showModeMenu();
        net.backToMenu();
        return;
    }
    if (e.target.closest('[data-cp-error-close]')) {
        errorText = null;
        renderCampaign();
        return;
    }
    if (e.target.closest('[data-cp-buy-open]')) {
        confirmBuyOpen = true;
        errorText = null;
        renderCampaign();
        return;
    }
    if (e.target.closest('[data-cp-buy-cancel]') || e.target === screenEl.querySelector('[data-cp-buy-backdrop]')) {
        confirmBuyOpen = false;
        renderCampaign();
        return;
    }
    if (e.target.closest('[data-cp-buy-confirm]')) {
        confirmBuyOpen = false;
        net.buyStamina();
        renderCampaign();
        return;
    }
    const diffBtn = e.target.closest('[data-cp-diff]');
    if (diffBtn) {
        const d = diffBtn.dataset.cpDiff;
        const chk = isDiffUnlocked(d);
        if (!chk.ok) {
            errorText = `🔒 Độ khó ${DIFF_META[d]?.name ?? d}: ${chk.why}`;
            renderCampaign();
            return;
        }
        currentDiff = d;
        errorText = null;
        renderCampaign();
        return;
    }
    const chBtn = e.target.closest('[data-cp-chapter]');
    if (chBtn && !chBtn.disabled) { errorText = null; net.campaignOpen(chBtn.dataset.cpChapter); return; }
    const stageBtn = e.target.closest('[data-cp-stage]');
    if (stageBtn) {
        const id = stageBtn.dataset.cpStage;
        const found = findStageOrBranch(id);
        if (!found) return;
        const { item, isBranch } = found;
        const st = item.status?.[currentDiff] ?? (isBranch ? item.status?.story : 'locked') ?? 'locked';
        if (st === 'locked') {
            errorText = `🔒 ${whyStageLocked(item, isBranch, currentDiff)}`;
            renderCampaign();
            return;
        }
        const cost = DIFF_META[currentDiff]?.cost ?? 4;
        errorText = null;
        battleFromWorld = id === worldOrigin && currentDiff === 'story';   // vào từ điểm truyện trên bản đồ -> thắng xong về bản đồ
        lastSelectedStage = { id, diff: currentDiff, name: item.name, no: item.no };
        const diffName = DIFF_META[currentDiff]?.name ?? 'Cốt truyện';
        const stageLabel = (isBranch
            ? `Nhánh ${item.name} (${diffName} · ⚡${cost})`
            : `Ải ${item.no}: ${item.name} (${diffName} · ⚡${cost})`) + guestNote(item);
        hideCampaign();
        const openSquad = () => openCampaignSquadSelect({
            id,
            diff: currentDiff,
            stageLabel,
            owned: state.owned,
            heroes: state.heroes,
            onBack: () => showCampaign(),
        });
        // lần đầu vào ải (mức Cốt truyện): xem lời thoại trước
        const pre = currentDiff === 'story' && st !== 'cleared' && !preSeen.has(item.id) ? (state.story?.pre?.[item.id] ?? null) : null;   // đã xem ngoài bản đồ thì bỏ qua
        if (pre) playStory(pre, state.story.speakers, openSquad, { bg: stageBackdrop(item.id) }); else openSquad();
    }
}

export function renderCampaignState(payload) {
    if (payload) {
        state = normalizeState(payload);
    }
    if (pendingWorldStage) { const id = pendingWorldStage; pendingWorldStage = null; openWorldStage(id); return; }
    renderCampaign();
    ensureScreenEl().style.display = 'flex';
    document.body.classList.add('selecting-squad');
    startStaminaTicker();
}

export function showCampaign(payload) {
    if (payload) {
        state = normalizeState(payload);
    }
    hideResult();
    renderCampaign();
    ensureScreenEl().style.display = 'flex';
    document.body.classList.add('selecting-squad');
    startStaminaTicker();
}

export function hideCampaign() {
    if (screenEl) screenEl.style.display = 'none';
}

let lastResultDungeon = false;
export function renderStageResult(data = {}) {
    lastResultDungeon = !!data.stage?.dungeon;
    hideBattleResult();
    hideCampaign();

    if (data.wallet) {
        state.wallet = { ...state.wallet, ...data.wallet };
    }
    if (data.stamina) {
        state.stamina = typeof data.stamina === 'number'
            ? { ...state.stamina, value: data.stamina }
            : { ...state.stamina, ...data.stamina };
    }
    if (Array.isArray(data.newHeroes)) {
        const ownedSet = new Set(state.owned ?? []);
        data.newHeroes.forEach(h => ownedSet.add(h));
        state.owned = [...ownedSet];
    }

    if (data.account) state.account = data.account;
    if (data.features) state.features = data.features;
    const win = !!data.win;
    const firstClear = !!data.firstClear;
    const rewards = data.rewards ?? { exp: 0, gold: 0, stone: 0, diamond: 0 };
    const leveledEntries = Object.entries(data.leveled ?? {}).filter(([, up]) => up > 0);
    const newHeroes = Array.isArray(data.newHeroes) ? data.newHeroes : [];
    const refund = Number(data.refund ?? 0);

    const box = ensureResultEl();
    box.innerHTML = `
    <div class="cp-result-card ${win ? 'win' : 'lose'}">
        <div class="cp-result-badge">${win ? '🏆 Thắng' : data.timeout ? '⏰ Hết giờ' : '💀 Thua'}</div>
        <h2 class="cp-result-title">${win ? 'CHIẾN THẮNG!' : data.timeout ? 'HẾT GIỜ!' : 'THẤT BẠI!'}</h2>
        ${accountHTML(data.account)}
        ${data.accountLevelUp ? `<div class="cp-first-clear-banner account-toast" role="status">⬆️ Tài khoản lên cấp ${data.accountLevelUp.after.level}!</div>` : ''}
        <p class="cp-result-sub">
            ${lastSelectedStage ? `${lastSelectedStage.no ? `Ải ${lastSelectedStage.no}: ` : ''}${lastSelectedStage.name ?? ''} · ` : ''}
            ${win ? 'Đội của bạn đã vượt ải thành công!' : data.timeout ? 'Quá 3 phút chưa hạ được kẻ địch — mạnh lên rồi thử lại nhé!' : 'Đừng nản lòng, hãy nâng cấp đội hình và thử lại!'}
        </p>

        ${win ? `
        <div class="cp-result-rewards">
            <h3>🎁 Phần thưởng vượt ải</h3>
            <div class="cp-reward-grid">
                <div class="cp-reward-item exp"><span class="cp-rw-icon">⭐</span><span class="cp-rw-name">EXP tài khoản</span><b class="cp-rw-val">+${rewards.accountExp ?? 0}</b></div>
                ${Object.entries(rewards.items ?? {}).map(([key, count]) => `<div class="cp-reward-item">${icon(key, '🎁')}<span class="cp-rw-name">${ITEM_NAMES[key] ?? key}</span><b class="cp-rw-val">×${count}</b></div>`).join('')}
                <div class="cp-reward-item exp">
                    <span class="cp-rw-icon">✨</span>
                    <span class="cp-rw-name">EXP mỗi tướng</span>
                    <b class="cp-rw-val">+${(rewards.exp ?? 0).toLocaleString('vi-VN')}</b>
                </div>
                <div class="cp-reward-item gold">
                    <span class="cp-rw-icon">🪙</span>
                    <span class="cp-rw-name">Vàng</span>
                    <b class="cp-rw-val">+${(rewards.gold ?? 0).toLocaleString('vi-VN')}</b>
                </div>
                <div class="cp-reward-item stone">
                    <span class="cp-rw-icon">🔷</span>
                    <span class="cp-rw-name">Đá Cường Hoá</span>
                    <b class="cp-rw-val">+${(rewards.stone ?? 0).toLocaleString('vi-VN')}</b>
                </div>
                <div class="cp-reward-item diamond">
                    <span class="cp-rw-icon">💎</span>
                    <span class="cp-rw-name">Kim Cương</span>
                    <b class="cp-rw-val">+${(rewards.diamond ?? 0).toLocaleString('vi-VN')}</b>
                </div>
            </div>
        </div>

        ${firstClear ? `
        <div class="cp-first-clear-banner">
            🌟 Lần đầu qua: +${(rewards.diamond ?? 0).toLocaleString('vi-VN')} Kim Cương
        </div>` : ''}

        ${leveledEntries.length ? `
        <div class="cp-leveled-box">
            <h4>⬆️ Anh hùng lên cấp</h4>
            <div class="cp-leveled-list">
                ${leveledEntries.map(([cid, up]) => {
                    const h = HERO_NAMES[cid] ?? { name: cid, emoji: '⚔️', title: '' };
                    return `<span class="cp-leveled-chip">${h.emoji} <b>${h.name}</b> +${up} cấp</span>`;
                }).join('')}
            </div>
        </div>` : ''}

        ${unlockHTML(data)}
        ${dropsHTML(data)}

        ${newHeroes.includes('archer') ? `
        <div class="cp-new-hero-banner">
            <span class="cp-nh-icon">🏹</span>
            <div class="cp-nh-text">
                <b>Lyra gia nhập đội!</b>
                <small>Phong Tiễn · Cung Thủ tộc Elf đã sẵn sàng sát cánh cùng bạn (Đủ đội 4 người!)</small>
            </div>
        </div>` : ''}

        ${newHeroes.filter(id => id !== 'archer').map(id => {
            const h = HERO_NAMES[id] ?? { name: id, emoji: '⚔️' };
            return `<div class="cp-new-hero-banner"><span class="cp-nh-icon">${h.emoji}</span><div class="cp-nh-text"><b>${h.name} gia nhập đội!</b></div></div>`;
        }).join('')}
        ` : `
        <div class="cp-refund-banner">
            ${data.refundRun ? '💍 Thua không mất lượt hầm ngục' : `⚡ Hoàn lại ${refund} thể lực`}
        </div>
        `}

        <div class="cp-result-actions">
            <button class="cp-continue-btn" data-cp-continue>Tiếp tục →</button>
        </div>
    </div>`;

    box.style.display = 'flex';
    document.body.classList.add('selecting-squad');
}

const ITEM_NAMES = { exp_small: 'Bình Kinh Nghiệm Nhỏ', exp_big: 'Bình Kinh Nghiệm Lớn', exp_huge: 'Bình Kinh Nghiệm Siêu Lớn', refine_stone: 'Đá Tinh Luyện' };
function accountHTML(account) {
    if (!account) return '';
    return `<div class="cp-account"><b>⭐ Cấp tài khoản ${account.level}</b><progress max="${account.need || 1}" value="${account.need ? account.exp : 1}" aria-label="EXP tài khoản"></progress><small>${account.need ? `${account.exp}/${account.need} EXP` : 'Tối đa'}</small></div>`;
}
const FEATURE_NAMES = { tavern: 'Quán ăn', pvp: 'Đấu', chapter2: 'Chương 2', command: 'Ra lệnh', orb: 'Năng lượng Orb', auto: 'AUTO (tự dùng kỹ năng)', hard: 'Độ khó Khó', gear: 'Trang bị 🎒', forge: 'Lò rèn 🔨',
    setDungeon: 'Hầm ngục đồ bộ', jewelDungeon: 'Hầm ngục trang sức', hell: 'Độ khó Địa ngục', heroShop: 'Cửa hàng anh hùng' };
/** Tính năng vừa mở khoá sau trận */
function unlockHTML(data) {
    const list = (data.newFeatures ?? []).filter(f => FEATURE_NAMES[f]);
    if (!list.length) return '';
    return `<div class="cp-first-clear-banner cp-unlock-banner">🔓 Mở khoá mới: ${list.map(f => `<b>${FEATURE_NAMES[f]}</b>`).join(' · ')}</div>`;
}

/** Đồ rơi + bùa + đồ tự phân giải (túi đầy) ở màn kết quả */
function dropsHTML(data) {
    const drops = Array.isArray(data.drops) ? data.drops : [];
    const auto = data.autoSalvaged;
    if (!drops.length && !auto) return '';
    return `
        <div class="cp-leveled-box cp-drops-box">
            <h4>🎒 Đồ rơi${data.newFeatures?.includes('gear') ? ' — đã mở Trang bị!' : ''}</h4>
            <div class="cp-leveled-list">
                ${drops.map(it => `<span class="cp-leveled-chip cp-drop-chip" style="--rc:${it.color}">${it.icon} <b>${it.name}</b> · Cấp ${it.level}</span>`).join('')}
            </div>
            ${auto ? `<p class="cp-drop-auto">Túi đầy: ${auto.count} món tự phân giải → +${auto.stone} Đá Cường Hoá${auto.refine ? ` · +${auto.refine} Đá Tinh Luyện` : ''}</p>` : ''}
        </div>`;
}

function hideResult() {
    if (resultEl) resultEl.style.display = 'none';
}

function onResultClick(e) {
    if (e.target.closest('[data-cp-continue]')) {
        hideResult();
        hideBattleResult();
        if (lastResultDungeon) { lastResultDungeon = false; showExtras(() => { net.campaignOpen(); showCampaign(); }, 'dungeon'); return; }
        if (battleFromWorld) { battleFromWorld = false; openWorldHub(); return; }
        net.campaignOpen();
        showCampaign();
    }
}

export function setupCampaign() {
    ensureScreenEl();
    ensureResultEl();

    socket.on('campaignState', (data) => {
        // quiet (tool thu vua doi du lieu): bang ai dang dong thi chi cap nhat so lieu, khong tu bat len che man hinh dang dung
        if (data?.quiet && ensureScreenEl().style.display !== 'flex' && !pendingWorldStage) { state = normalizeState(data); return; }
        renderCampaignState(data);
    });

    socket.on('campaignError', (data) => {
        errorText = data?.text ?? 'Không thể bắt đầu ải này';
        showCampaign();
    });

    socket.on('stageResult', (data) => {
        // thắng ải lần đầu: lời thoại sau ải (kết chương sau ải 20) rồi mới hiện bảng kết quả
        hideBattleResult();   // bảng chung không hiện nữa — dùng bảng kết quả ải
        afterBattleEnd(() => {
            if (data?.story?.length) playStory(data.story, data.speakers, () => renderStageResult(data), { bg: stageBackdrop(data.stage?.id, 'post') });   // lời thoại sau ải: có tranh nền (minh hoạ riêng nếu có)
            else renderStageResult(data);
        });
    });

    socket.on('battleStart', (data) => {
        if (data?.mode === 'campaign') {
            if (data.stage) lastSelectedStage = data.stage;
            hideCampaign();
            hideResult();
            document.body.classList.remove('selecting-squad');
        }
    });

    socket.on('battleEnd', () => {
        if (resultEl && resultEl.style.display === 'flex') {
            hideBattleResult();
        }
    });

    socket.on('mainMenu', () => {
        // Nếu đang hiện kết quả trận chiến dịch (VD vừa thoát trận được hoàn thể lực) thì giữ kết quả để người chơi bấm Tiếp tục
        if (resultEl && resultEl.style.display === 'flex') return;
        hideCampaign();
    });

    // Phục vụ tự kiểm tra trên console trình duyệt (self-check)
    if (typeof window !== 'undefined') {
        window.showCampaign = showCampaign;
        window.renderCampaignState = renderCampaignState;
        window.renderStageResult = renderStageResult;
    }
}
