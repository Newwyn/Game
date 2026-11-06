// ============================================================
// TRANG BỊ (P2): tạo đồ, chỉ số, mặc / tháo, túi, bộ đồ, rơi đồ, cường hoá, tinh luyện, phân giải
// Số liệu: BAN_THIET_KE_GAME.md mục 9 + 10. Chỉ số tỉ lệ thang 1000 = 100%. Mọi ngẫu nhiên dùng rng() truyền vào.
// ============================================================
const W = require('./wallet');

const SLOTS = ['weapon', 'armor', 'hands', 'legs', 'ring', 'necklace'];
const SLOT_INFO = {
    weapon: { name: 'Vũ khí', icon: '⚔️' },
    armor: { name: 'Áo', icon: '🥋' },
    hands: { name: 'Tay', icon: '🧤' },
    legs: { name: 'Chân', icon: '👢' },
    ring: { name: 'Nhẫn', icon: '💍' },
    necklace: { name: 'Dây chuyền', icon: '📿' },
};
const SET_SLOTS = ['weapon', 'armor', 'hands', 'legs'];   // nhẫn / dây chuyền không thuộc bộ
const LEVELS = [10, 20, 30, 40, 50, 60];
const LEVEL_COEF = { 10: 0.2, 20: 0.35, 30: 0.5, 40: 0.65, 50: 0.8, 60: 1 };
const RARITIES = [
    { id: 0, name: 'Thường', color: '#e5e7eb', coef: 0.6, subs: 1 },
    { id: 1, name: 'Tốt', color: '#4ade80', coef: 0.7, subs: 2 },
    { id: 2, name: 'Hiếm', color: '#60a5fa', coef: 0.8, subs: 3 },
    { id: 3, name: 'Sử thi', color: '#c084fc', coef: 0.9, subs: 4 },
    { id: 4, name: 'Huyền thoại', color: '#fb923c', coef: 1, subs: 4 },
];
const STATS = {
    atk: { label: 'Tấn công', unit: 'num' },
    hp: { label: 'Máu', unit: 'num' },
    pDef: { label: 'Thủ vật lý', unit: 'num' },
    mDef: { label: 'Thủ phép', unit: 'num' },
    mpAtk: { label: 'Hồi năng lượng', unit: 'num' },
    crit: { label: 'Tỉ lệ chí mạng', unit: 'pct' },
    critDmg: { label: 'Sát thương chí mạng', unit: 'pct' },
    dodge: { label: 'Né', unit: 'pct' },
    block: { label: 'Chặn', unit: 'pct' },
    pen: { label: 'Xuyên giáp', unit: 'pct' },
    acc: { label: 'Chính xác', unit: 'pct' },
    atkSpeed: { label: 'Tốc đánh', unit: 'pct' },
};
const STAT_KEYS = Object.keys(STATS);
// Chỉ số chính theo ô (mốc cấp 60, cam)
const MAIN = {
    weapon: { atk: 300 }, armor: { hp: 2500 }, legs: { pDef: 90, mDef: 90 },
    hands: { pen: 60 }, ring: { crit: 80 }, necklace: { mpAtk: 40 },
};
// Dòng phụ: khoảng giá trị (mốc cấp 60, cam)
const SUB_RANGE = {
    atk: [50, 100], hp: [450, 900], pDef: [20, 40], mDef: [20, 40], mpAtk: [8, 16],
    crit: [30, 60], critDmg: [60, 120], dodge: [15, 30], block: [15, 30], pen: [20, 40], acc: [20, 40], atkSpeed: [20, 40],
};
// Bộ tộc Người (2 món: chỉ số; 4 món: hiệu ứng trong trận — server.js)
const SETS = {
    ho_ve: { name: 'Hộ Vệ Vương Quốc', two: { pDef: 0.1, mDef: 0.1 }, twoText: '+10% Thủ',
        fourText: 'Lần đầu máu < 50%: khiên 15% máu tối đa, cả đội +5% thủ 6 giây' },
    chien_luoc: { name: 'Chiến Lược Gia', two: { mpAtk: 0.15, mpSec: 0.15 }, twoText: '+15% Hồi năng lượng',
        fourText: 'Dùng kỹ năng 3 Orb trở lên: hoàn 1 Orb, cả đội +10% Tấn công 5 giây' },
    lu_khach: { name: 'Lữ Khách', two: { pAtk: 0.08, mAtk: 0.08 }, twoText: '+8% Tấn công',
        fourText: 'Mỗi đồng đội khác tộc: +6% sát thương (tối đa +18%)' },
};
const INV_MAX = 100;

// ---------- Cường hoá ----------
const ENH_RATE = [1, 1, 1, 1, 1, 0.8, 0.65, 0.5, 0.35, 0.2];        // tỉ lệ đập lên +1 … +10
const ENH_MAIN = [0.05, 0.05, 0.05, 0.05, 0.05, 0.08, 0.09, 0.11, 0.13, 0.16];   // chỉ số chính tăng mỗi cấp
const ENH_STONE_MUL = [1, 1, 1, 1, 1, 2, 2, 3, 3, 4];
const STONE_BY_LEVEL = { 10: 1, 20: 2, 30: 3, 40: 5, 50: 7, 60: 10 };
const LUCK_STEP = 0.05, CHARM_BONUS = 0.1, SUB_BONUS_AT = 5, SUB_BONUS = 0.1, MAX_ENH = 10;
const SALVAGE_MUL = [1, 1.5, 2, 3, 4];
const SALVAGE_REFINE = [0, 0, 1, 2, 3];

// ---------- Rơi đồ ----------
const DROP_RARITY = { story: [0.6, 0.3, 0.1], hard: [0.3, 0.45, 0.25], hell: [0.1, 0.45, 0.45] };
const DROP_LV_ADD = { story: 0, hard: 5, hell: 10 };
const CHARM_CHANCE = { story: 0, hard: 0.1, hell: 0.2 };

const coefOf = (level, rarity) => (LEVEL_COEF[level] ?? 0) * (RARITIES[rarity]?.coef ?? 0);
const pick = (rng, arr) => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
const fmtNum = (v) => String(Math.round(v * 10) / 10).replace('.', ',');
function statText(key, value) {
    const s = STATS[key];
    return s.unit === 'pct' ? `+${fmtNum(value / 10)}% ${s.label}` : `+${Math.round(value)} ${s.label}`;
}
function subValue(key, roll, level, rarity) {
    const [lo, hi] = SUB_RANGE[key];
    return Math.round((lo + (hi - lo) * roll) * coefOf(level, rarity));
}

function ensureGear(pr) {
    pr.gear ??= {};
    pr.gear.items ??= {};
    pr.gear.equipped ??= {};
    pr.gear.nextId ??= 1;
    pr.items ??= {};
    return pr.gear;
}
function newId(pr) {
    const g = ensureGear(pr);
    return `g${g.nextId++}`;
}

function createItem(rng, { slot, level, rarity, set = null }, id) {
    if (!SLOTS.includes(slot) || !LEVEL_COEF[level] || !RARITIES[rarity]) throw new Error('Đồ không hợp lệ');
    const k = coefOf(level, rarity);
    const main = Object.entries(MAIN[slot]).map(([key, v]) => ({ key, value: Math.round(v * k) }));
    const subs = [];
    const pool = [...STAT_KEYS];
    for (let i = 0; i < RARITIES[rarity].subs; i++) {
        const key = pool.splice(Math.min(pool.length - 1, Math.floor(rng() * pool.length)), 1)[0];
        const roll = rng();
        subs.push({ key, roll, value: subValue(key, roll, level, rarity) });
    }
    return { id, slot, level, rarity, set: set && SETS[set] && SET_SLOTS.includes(slot) ? set : null, main, subs, enhance: 0, luck: 0, spent: 0, locked: false };
}

/** Hệ số chỉ số chính theo cấp cường hoá (cộng dồn) */
const mainMul = (enh) => 1 + ENH_MAIN.slice(0, enh).reduce((a, b) => a + b, 0);
const subMul = (enh) => (enh >= SUB_BONUS_AT ? 1 + SUB_BONUS : 1);

function itemStats(item) {
    const out = Object.fromEntries(STAT_KEYS.map(k => [k, 0]));
    for (const m of item.main) out[m.key] += Math.round(m.value * mainMul(item.enhance));
    for (const s of item.subs) out[s.key] += Math.round(s.value * subMul(item.enhance));
    return out;
}

function describe(item) {
    const info = SLOT_INFO[item.slot], r = RARITIES[item.rarity], set = item.set ? SETS[item.set] : null;
    return {
        id: item.id, slot: item.slot, slotName: info.name, icon: info.icon,
        name: set ? `${info.name} ${set.name}` : `${info.name} ${r.name}`,
        level: item.level, wearLevel: wearLevel(item),
        rarity: item.rarity, rarityName: r.name, color: r.color,
        set: item.set, setName: set?.name ?? null, enhance: item.enhance, locked: !!item.locked,
        main: item.main.map(m => {
            const value = Math.round(m.value * mainMul(item.enhance));
            return { key: m.key, label: STATS[m.key].label, value, text: statText(m.key, value) };
        }),
        subs: item.subs.map(s => {
            const value = Math.round(s.value * subMul(item.enhance));
            return { key: s.key, label: STATS[s.key].label, value, text: statText(s.key, value), pct: s.roll, gold: s.roll >= 0.9 };
        }),
    };
}

/** Cấp anh hùng tối thiểu để mặc: đồ cấp 10 mặc từ Lv1, từ cấp 20 trở lên phải đủ đúng cấp đồ */
const wearLevel = (item) => (item.level <= 10 ? 1 : item.level);
function canWear(heroLevel, item) {
    const need = wearLevel(item);
    return heroLevel >= need ? { ok: true } : { ok: false, why: `Cần anh hùng Lv${need} trở lên` };
}

// ---------- Túi & mặc đồ ----------
function ownerOf(pr, itemId) {
    for (const [hero, slots] of Object.entries(ensureGear(pr).equipped)) {
        for (const id of Object.values(slots)) if (id === itemId) return hero;
    }
    return null;
}
function equippedIds(pr) {
    const s = new Set();
    for (const slots of Object.values(ensureGear(pr).equipped)) for (const id of Object.values(slots)) if (id) s.add(id);
    return s;
}
function bagItems(pr) {
    const on = equippedIds(pr);
    return Object.values(ensureGear(pr).items).filter(it => !on.has(it.id));
}
function equippedItems(pr, heroId) {
    const g = ensureGear(pr);
    return Object.values(g.equipped[heroId] ?? {}).map(id => g.items[id]).filter(Boolean);
}
function addItem(pr, item) {
    if (bagItems(pr).length >= INV_MAX) return false;
    ensureGear(pr).items[item.id] = item;
    return true;
}
function equip(pr, heroId, heroLevel, itemId) {
    const g = ensureGear(pr), item = g.items[itemId];
    if (!item) return { ok: false, why: 'Không tìm thấy món đồ' };
    const wear = canWear(heroLevel, item);
    if (!wear.ok) return wear;
    const prev = ownerOf(pr, itemId);
    if (prev === heroId) return { ok: true };
    if (prev) delete g.equipped[prev][item.slot];   // đang trên người khác -> chuyển sang
    g.equipped[heroId] ??= {};
    const swapped = g.equipped[heroId][item.slot] ?? null;   // món cũ ở ô đó về túi
    g.equipped[heroId][item.slot] = itemId;
    return { ok: true, swapped };
}
function unequip(pr, heroId, slot) {
    const g = ensureGear(pr);
    if (!g.equipped[heroId]?.[slot]) return { ok: false, why: 'Ô này đang trống' };
    if (bagItems(pr).length >= INV_MAX) return { ok: false, why: 'Túi đồ đã đầy' };
    delete g.equipped[heroId][slot];
    return { ok: true };
}

// ---------- Cộng chỉ số ----------
function gearBonus(items) {
    const stats = Object.fromEntries(STAT_KEYS.map(k => [k, 0]));
    const sets = {};
    for (const it of items) {
        const s = itemStats(it);
        for (const k of STAT_KEYS) stats[k] += s[k];
        if (it.set) sets[it.set] = (sets[it.set] ?? 0) + 1;
    }
    return { stats, sets, effects: Object.keys(sets).filter(id => sets[id] >= 4) };
}
function applyGear(stats, bonus, dmgType) {
    const s = { ...stats }, b = bonus?.stats ?? {};
    s[dmgType === 'magic' ? 'mAtk' : 'pAtk'] += b.atk ?? 0;
    for (const k of ['hp', 'pDef', 'mDef', 'mpAtk', 'crit', 'critDmg', 'dodge', 'block', 'pen', 'acc']) {
        const key = k === 'hp' ? 'maxHp' : k;
        s[key] = (s[key] ?? 0) + (b[k] ?? 0);
    }
    if (b.atkSpeed) s.atkSpeed = s.atkSpeed / (1 + b.atkSpeed / 1000);
    for (const [id, n] of Object.entries(bonus?.sets ?? {})) {
        if (n < 2 || !SETS[id]) continue;
        for (const [k, v] of Object.entries(SETS[id].two)) if (typeof s[k] === 'number') s[k] *= 1 + v;
    }
    for (const k of Object.keys(s)) if (k !== 'moveSpeed' && typeof s[k] === 'number') s[k] = Math.round(s[k]);
    return s;
}

// ---------- Rơi đồ ----------
function rollDrops(rng, { no, boss = 0, diff, firstClear = false }) {
    const lvl = no + (DROP_LV_ADD[diff] ?? 0);
    const level = Math.min(60, Math.max(10, Math.floor(lvl / 10) * 10));
    const weights = DROP_RARITY[diff] ?? DROP_RARITY.story;
    const rollRarity = () => {
        let x = rng();
        for (let i = 0; i < weights.length; i++) { if (x < weights[i]) return i; x -= weights[i]; }
        return weights.length - 1;
    };
    const items = [];
    if (firstClear && diff === 'story' && no === 6) items.push({ slot: 'weapon', level, rarity: 1 });   // ải 6: dạy mặc đồ
    else items.push({ slot: pick(rng, SET_SLOTS), level, rarity: rollRarity() });
    if (boss) items.push({ slot: pick(rng, SET_SLOTS), level, rarity: rollRarity() });
    const charms = rng() < (CHARM_CHANCE[diff] ?? 0) ? 1 : 0;
    return { items, charms };
}

// ---------- Phân giải ----------
function salvageValue(item) {
    return {
        stone: Math.ceil(STONE_BY_LEVEL[item.level] * SALVAGE_MUL[item.rarity]) + Math.floor((item.spent ?? 0) / 2),
        refine: SALVAGE_REFINE[item.rarity],
    };
}
function salvage(pr, wallet, ids) {
    const g = ensureGear(pr);
    if (!Array.isArray(ids) || !ids.length) return { ok: false, why: 'Chưa chọn món nào' };
    const uniq = [...new Set(ids)];
    for (const id of uniq) {
        const it = g.items[id];
        if (!it) return { ok: false, why: 'Không tìm thấy món đồ' };
        if (ownerOf(pr, id)) return { ok: false, why: 'Không phân giải được đồ đang mặc' };
        if (it.locked) return { ok: false, why: 'Không phân giải được đồ đã khoá' };
    }
    let stone = 0, refine = 0;
    for (const id of uniq) {
        const v = salvageValue(g.items[id]);
        stone += v.stone; refine += v.refine;
        delete g.items[id];
    }
    W.add(wallet, 'stone', stone);
    pr.items.refine_stone = (pr.items.refine_stone ?? 0) + refine;
    return { ok: true, count: uniq.length, stone, refine };
}

// ---------- Cường hoá ----------
function enhanceInfo(item) {
    if (item.enhance >= MAX_ENH) return { maxed: true };
    const to = item.enhance + 1;
    return {
        maxed: false, to,
        rate: Math.min(1, Math.round((ENH_RATE[to - 1] + (item.luck ?? 0)) * 1000) / 1000),
        stone: STONE_BY_LEVEL[item.level] * ENH_STONE_MUL[to - 1],
        gold: item.level * 5 * to,
        dropOnFail: to >= 8,
    };
}
function enhance(pr, wallet, item, rng, { charm = false } = {}) {
    ensureGear(pr);
    const info = enhanceInfo(item);
    if (info.maxed) return { ok: false, why: 'Đã cường hoá tối đa' };
    if (!(wallet.stone >= info.stone)) return { ok: false, why: `Cần ${info.stone} Đá Cường Hoá` };
    if (!(wallet.gold >= info.gold)) return { ok: false, why: `Cần ${info.gold} Vàng` };
    if (charm && !((pr.items.luck_charm ?? 0) >= 1)) return { ok: false, why: 'Không còn Bùa May Mắn' };
    W.trySpend(wallet, 'stone', info.stone);
    W.trySpend(wallet, 'gold', info.gold);
    if (charm) pr.items.luck_charm -= 1;
    item.spent = (item.spent ?? 0) + info.stone;
    const rate = Math.min(1, info.rate + (charm ? CHARM_BONUS : 0));
    const from = item.enhance;
    const success = rng() < rate;
    if (success) { item.enhance = info.to; item.luck = 0; }
    else {
        item.luck = Math.round(((item.luck ?? 0) + LUCK_STEP) * 1000) / 1000;
        if (info.dropOnFail) item.enhance = from - 1;
    }
    return { ok: true, success, from, to: item.enhance };
}

// ---------- Tinh luyện ----------
const refineInfo = (item) => ({ refine: 1, gold: item.level * 10 });
function refine(pr, wallet, item, rng, line) {
    ensureGear(pr);
    if (!Number.isInteger(line) || line < 0 || line >= item.subs.length) return { ok: false, why: 'Dòng không hợp lệ' };
    const cost = refineInfo(item);
    if (!((pr.items.refine_stone ?? 0) >= cost.refine)) return { ok: false, why: 'Cần 1 Đá Tinh Luyện' };
    if (!(wallet.gold >= cost.gold)) return { ok: false, why: `Cần ${cost.gold} Vàng` };
    pr.items.refine_stone -= cost.refine;
    W.trySpend(wallet, 'gold', cost.gold);
    const others = new Set(item.subs.filter((_, i) => i !== line).map(s => s.key));
    const key = pick(rng, STAT_KEYS.filter(k => !others.has(k)));
    const roll = rng();
    const before = { ...item.subs[line] };
    item.subs[line] = { key, roll, value: subValue(key, roll, item.level, item.rarity) };
    return { ok: true, before, after: { ...item.subs[line] } };
}

module.exports = {
    SLOTS, SLOT_INFO, SET_SLOTS, LEVELS, RARITIES, STATS, SETS, INV_MAX, ENH_RATE, ENH_MAIN, STONE_BY_LEVEL,
    ensureGear, newId, createItem, itemStats, describe, canWear,
    ownerOf, bagItems, equippedItems, addItem, equip, unequip,
    gearBonus, applyGear, rollDrops, salvageValue, salvage, enhanceInfo, enhance, refineInfo, refine,
};
