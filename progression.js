// ============================================================
// TIẾN TRIỂN NHÂN VẬT: Level · Bậc (S/SS/SSS) · Tộc · Chỉ số riêng của class · Cấp kỹ năng
// ------------------------------------------------------------
// Thứ tự tính chỉ số khi vào trận:
//   chỉ số gốc (CLASS_DEFS, = level 1) -> + tăng theo level (bảng class × hệ số giai đoạn)
//   -> × thưởng bậc -> bonus tộc -> (đồ — làm sau) -> buff/debuff trong trận -> giới hạn trên (server.js)
// Tất cả chỉ số % dùng thang 1000 = 100% như phần còn lại của game.
// ============================================================
const fs = require('fs');
const path = require('path');

const MAX_LEVEL = 60;

// ---------- Bậc ----------
// cap: level tối đa của bậc (phải ĐỘT PHÁ mới lên tiếp) · bonus: % cộng 1 lần cho chỉ số chính
// skill level = chỉ số bậc + 1 (Thường = Lv1 ... SSS = Lv4)
const RANKS = [
    { id: 0, name: 'Thường', cap: 20, bonus: 0 },
    { id: 1, name: 'S', cap: 40, bonus: 0.05 },
    { id: 2, name: 'SS', cap: 60, bonus: 0.08 },
    { id: 3, name: 'SSS', cap: 60, bonus: 0.12 },
];
const MAX_RANK = RANKS.length - 1;

// Hệ số tăng chỉ số mỗi level theo giai đoạn: 2–20 ×1.0 · 21–40 ×1.25 · 41–60 ×1.5
const bandMult = (lv) => (lv <= 20 ? 1 : lv <= 40 ? 1.25 : 1.5);
/** Tổng "số level đã tăng" có trọng số (level 1 = 0) */
function growthUnits(level) {
    let u = 0;
    for (let lv = 2; lv <= level; lv++) u += bandMult(lv);
    return u;
}

// ---------- Cấp kỹ năng (theo bậc) ----------
// Chỉ tăng SỐ LIỆU: hệ số sát thương / máu khiên / hồi máu ×DMG · % buff/debuff ×BUFF. Orb, hồi chiêu, hiệu ứng giữ nguyên.
const SKILL_SCALE = { dmg: [1, 1.2, 1.45, 1.75], buff: [1, 1.1, 1.2, 1.3] };
const SKILL_DMG_KEYS = ['multiplier', 'spiritMultiplier', 'splashMultiplier', 'burstMultiplier', 'shieldHp', 'heal', 'prayHeal',
    'tickMultiplier', 'burnMultiplier', 'palmMultiplier', 'volleyMultiplier', 'guardianMultiplier',
    'slamMultiplier', 'cleaveMultiplier', 'aoeMultiplier', 'fallMultiplier', 'upliftMultiplier'];
const SKILL_BUFF_KEYS = ['atkSpeedUp', 'atkUp', 'critUp', 'critDmgUp', 'teamAccUp', 'teamDodgeUp', 'teamDef', 'defDown', 'mAtkUp', 'mDefUp', 'burstHeal', 'shieldPct'];

function scaleSkills(skills, rank) {
    const r = Math.max(0, Math.min(MAX_RANK, rank | 0));
    return skills.map(sk => {
        const out = { ...sk, level: r + 1 };
        for (const k of SKILL_DMG_KEYS) if (typeof sk[k] === 'number') out[k] = Math.round(sk[k] * SKILL_SCALE.dmg[r] * 1000) / 1000;
        for (const k of SKILL_BUFF_KEYS) if (typeof sk[k] === 'number') out[k] = Math.round(sk[k] * SKILL_SCALE.buff[r] * 1000) / 1000;
        return out;
    });
}

// ---------- Class: tăng mỗi level + chỉ số riêng ----------
// Class chỉ quyết định cách tăng chỉ số khi lên cấp. (Không còn "chỉ số riêng của class": mỗi nhân vật có 2 thiên phú riêng.)
const CLASS_GROWTH = {
    warrior: {
        name: 'Chiến Binh',
        perLevel: { maxHp: 120, pAtk: 6, mAtk: 0, pDef: 9, mDef: 6, crit: 1, acc: 1, dodge: 0.5, pen: 1, block: 3, mpSec: 1 },
    },
    mage: {
        name: 'Phù Thủy',
        perLevel: { maxHp: 45, pAtk: 0, mAtk: 12, pDef: 2, mDef: 5, crit: 2, acc: 2, dodge: 1, pen: 3, block: 0, mpSec: 3 },
    },
    priest: {
        name: 'Tu Sĩ',
        perLevel: { maxHp: 70, pAtk: 2, mAtk: 8, pDef: 4, mDef: 7, crit: 1, acc: 1, dodge: 1, pen: 1, block: 1, mpSec: 3 },
    },
    archer: {
        name: 'Cung Thủ',
        perLevel: { maxHp: 50, pAtk: 9, mAtk: 0, pDef: 2, mDef: 3, crit: 4, acc: 4, dodge: 2, pen: 3, block: 0, mpSec: 1 },
    },
    assassin: {
        name: 'Sát Thủ',
        perLevel: { maxHp: 55, pAtk: 10, mAtk: 0, pDef: 3, mDef: 3, crit: 5, acc: 2, dodge: 3, pen: 3, block: 0.5, mpSec: 1 },
    },
};
// Chỉ số do THIÊN PHÚ cấp (trường `stat` của thiên phú): Kiên Cường (Rok) · Sát Ý (Jessica) · Ưng Nhãn (Lyra) · Hỏa Tốc (Ignar)
const TALENT_STAT_KEYS = ['tenacity', 'killIntent', 'hawkEye', 'fireHaste'];
const UNIQUE_KEYS = TALENT_STAT_KEYS;   // tên cũ, giữ cho code đang dùng

// ---------- Thiên phú ----------
// Cơ bản chỉ có 3 kỹ năng. Thiên phú 1 mở ở Lv20, thiên phú 2 mở ở Lv40.
// Cấp thiên phú theo bậc: TP1 = 1 (Thường/S) · 2 (SS) · 3 (SSS) — TP2 = 1 (S/SS) · 2 (SSS)
const TALENT_UNLOCK = { 1: 20, 2: 40 };
const TALENT_MAX = { 1: 3, 2: 2 };
function talentLevels(level, rank) {
    const t1 = level >= TALENT_UNLOCK[1] ? Math.min(TALENT_MAX[1], Math.max(1, rank)) : 0;
    const t2 = level >= TALENT_UNLOCK[2] ? Math.min(TALENT_MAX[2], Math.max(1, rank - 1)) : 0;
    return { 1: t1, 2: t2 };
}
/** Danh sách thiên phú đã mở, mỗi cái lấy số liệu theo cấp: levels.{key}[cấp-1] -> {key} */
function resolveTalents(passives, level, rank) {
    const lv = talentLevels(level, rank);
    const out = [];
    for (const p of passives) {
        const l = lv[p.talent] ?? 0;
        if (!l) continue;
        const r = { ...p, level: l, maxLevel: TALENT_MAX[p.talent] };
        for (const [k, arr] of Object.entries(p.levels ?? {})) r[k] = arr[Math.min(l, arr.length) - 1];
        delete r.levels;
        out.push(r);
    }
    return out;
}

// ---------- Tộc ----------
// mul: nhân chỉ số · add: cộng (‰ hoặc điểm) · trait: đặc tính (xử lý trong server.js)
const RACE_DEFS = {
    elf: {
        name: 'Elf', emoji: '🧝',
        mul: { mpAtk: 1.1, mpSec: 1.1 }, add: { acc: 120, dodge: 80 },
        trait: { key: 'elf_agile', name: 'Linh Mẫn', desc: 'Né được đòn -> đòn đánh kế tiếp +20% sát thương', value: 0.2 },
        text: '+12% chính xác · +8% né · +10% hồi MP',
    },
    human: {
        name: 'Human', emoji: '🧑',
        mul: { maxHp: 1.05, pAtk: 1.05, mAtk: 1.05, pDef: 1.05, mDef: 1.05 }, add: {},
        trait: { key: 'human_adapt', name: 'Thích Nghi', desc: 'Vào trận có thêm +500 MP (0,5 Orb) — tổng 2 Orb', value: 500 },
        text: '+5% HP · ATK · DEF',
    },
    dragon: {
        name: 'Dragon', emoji: '🐉',
        mul: { maxHp: 1.15, pDef: 1.1, mDef: 1.1, atkSpeed: 1.05 }, add: {},
        trait: { key: 'dragon_scale', name: 'Vảy Rồng', desc: 'Sát thương chí mạng nhận vào giảm 25%', value: 0.25 },
        text: '+15% HP · +10% P.DEF/M.DEF · −5% tốc đánh',
    },
    goblin: {
        name: 'Goblin', emoji: '👺',
        mul: { maxHp: 0.9, moveSpeed: 1.1 }, add: { crit: 100, pen: 100 },
        trait: { key: 'goblin_opportunist', name: 'Thừa Cơ', desc: 'Đánh mục tiêu đang bị khống chế +15% sát thương', value: 0.15 },
        text: '+10% chí mạng · +10% xuyên giáp · +10% tốc chạy · −10% HP',
    },
    devil: {
        name: 'Devil', emoji: '😈',
        mul: { pAtk: 1.12, mAtk: 1.12, pDef: 0.92, mDef: 0.92 }, add: { lifesteal: 50 },
        trait: { key: 'devil_pact', name: 'Khế Ước Máu', desc: 'Máu dưới 30% -> +15% sát thương', value: 0.15 },
        text: '+12% P.ATK/M.ATK · +5% hút máu · −8% thủ',
    },
};

// Giới hạn trên (‰) và chỉ số nhận phần dư
const STAT_CAPS = {
    crit: { cap: 750, overflow: 'critDmg' },
    dodge: { cap: 500, overflow: 'acc' },
    block: { cap: 600, overflow: 'tenacity' },
    tenacity: { cap: 300 },
};

// ---------- EXP & vật phẩm (luồng thật — ngoài trận) ----------
/** EXP cần để lên từ `level` -> `level + 1` */
const expToNext = (level) => Math.round(5 * Math.pow(level, 1.3)) * 10;
const ITEMS = {
    exp_small: { name: 'Bình Kinh Nghiệm Nhỏ', emoji: '🧪', exp: 500 },
    exp_big: { name: 'Bình Kinh Nghiệm Lớn', emoji: '⚗️', exp: 5000 },
    stone_s: { name: 'Đá Đột Phá S', emoji: '🔷' },
    stone_ss: { name: 'Đá Đột Phá SS', emoji: '🔶' },
    stone_sss: { name: 'Đá Đột Phá SSS', emoji: '💠' },
};
// Điều kiện ĐỘT PHÁ lên bậc rank+1: đạt level tối đa của bậc hiện tại (+ nguyên liệu — TẠM CHƯA DÙNG, hệ thống đồ làm sau)
// VD sau này: [{ stone_s: 1 }, { stone_ss: 2 }, { stone_sss: 3 }]
const RANK_UP_COST = [{}, {}, {}];

function defaultProgress(classIds) {
    const heroes = {};
    for (const id of classIds) heroes[id] = { level: 1, rank: 0, exp: 0 };
    return { heroes, items: {} };
}

/** Cộng EXP (tự lên level, dừng ở level tối đa của bậc hiện tại — dư EXP giữ lại) */
function addExp(hero, amount) {
    hero.exp += amount;
    const cap = RANKS[hero.rank].cap;
    let gained = 0;
    while (hero.level < cap && hero.exp >= expToNext(hero.level)) {
        hero.exp -= expToNext(hero.level);
        hero.level++; gained++;
    }
    if (hero.level >= cap) hero.exp = Math.min(hero.exp, expToNext(hero.level)); // đầy thanh, chờ đột phá
    return gained;
}

/** Kiểm tra điều kiện đột phá -> { ok, next, need:[...], missing:[...] } */
function checkRankUp(hero, items) {
    if (hero.rank >= MAX_RANK) return { ok: false, maxed: true, need: [], missing: ['Đã đạt bậc cao nhất (SSS)'] };
    const cur = RANKS[hero.rank], next = RANKS[hero.rank + 1];
    const need = [`Đạt level ${cur.cap}`];
    const missing = [];
    if (hero.level < cur.cap) missing.push(`Cần level ${cur.cap} (hiện ${hero.level})`);
    for (const [id, n] of Object.entries(RANK_UP_COST[hero.rank])) {
        need.push(`${n} ${ITEMS[id].name}`);
        const have = items[id] ?? 0;
        if (have < n) missing.push(`Thiếu ${n - have} ${ITEMS[id].name}`);
    }
    return { ok: missing.length === 0, next: next.name, need, missing };
}

function rankUp(hero, items) {
    const chk = checkRankUp(hero, items);
    if (!chk.ok) return chk;
    for (const [id, n] of Object.entries(RANK_UP_COST[hero.rank])) items[id] -= n;
    hero.rank++;
    addExp(hero, 0); // EXP đang tích trữ (thanh đầy) được dùng tiếp sau khi mở giới hạn
    return { ...chk, ok: true, rank: RANKS[hero.rank].name };
}

// ---------- Tính chỉ số ----------
const MAIN_STATS = ['maxHp', 'pAtk', 'mAtk', 'pDef', 'mDef'];

/**
 * Chỉ số NỀN của nhân vật khi vào trận (chưa tính buff trong trận).
 * def: CLASS_DEFS[id] (có classGroup, race) · hero: { level, rank }
 */
function computeStats(def, hero = { level: 1, rank: 0 }) {
    const level = Math.max(1, Math.min(MAX_LEVEL, hero.level | 0));
    const rank = Math.max(0, Math.min(MAX_RANK, hero.rank | 0));
    const s = {
        maxHp: def.maxHp, maxMp: def.maxMp, pAtk: def.pAtk, mAtk: def.mAtk, pDef: def.pDef, mDef: def.mDef,
        crit: def.crit, critDmg: def.critDmg, acc: def.acc, dodge: def.dodge, pen: def.pen, block: def.block,
        lifesteal: def.lifesteal ?? 0, mpAtk: def.mpAtk, mpSec: def.mpSec, atkSpeed: def.atkSpeed, moveSpeed: def.moveSpeed,
    };
    for (const k of UNIQUE_KEYS) s[k] = 0;
    const growth = CLASS_GROWTH[def.classGroup];
    if (growth) {
        const u = growthUnits(level);
        const per = { ...growth.perLevel };
        // nhân vật đánh PHÉP thuộc nhóm class vật lý (vd Zerith — Sát Thủ phép): tăng M.ATK thay cho P.ATK
        if (def.dmgType === 'magic' && (per.pAtk ?? 0) > (per.mAtk ?? 0)) [per.pAtk, per.mAtk] = [per.mAtk ?? 0, per.pAtk];
        for (const [k, v] of Object.entries(per)) s[k] += v * u;
        // thưởng bậc (cộng dồn các bậc đã đạt)
        for (let r = 1; r <= rank; r++) {
            for (const k of MAIN_STATS) s[k] *= 1 + RANKS[r].bonus;
        }
    }
    const race = RACE_DEFS[def.race];
    if (race) {
        for (const [k, v] of Object.entries(race.mul)) s[k] *= v;
        for (const [k, v] of Object.entries(race.add)) s[k] += v;
    }
    // làm tròn số nguyên cho gọn (trừ tốc chạy)
    for (const k of Object.keys(s)) if (k !== 'moveSpeed') s[k] = Math.round(s[k]);
    return s;
}

// ---------- Lưu tiến trình ra file (giữ qua các lần khởi động lại server) ----------
const SAVE_FILE = path.join(__dirname, 'data', 'progress.json');
let saveTimer = null;
function loadAll() {
    try { return JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8')); } catch { return {}; }
}
function saveAll(all) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        try {
            fs.mkdirSync(path.dirname(SAVE_FILE), { recursive: true });
            fs.writeFileSync(SAVE_FILE, JSON.stringify(all, null, 1));
        } catch (e) { console.warn('[progress] Không lưu được:', e.message); }
    }, 300);
}

module.exports = {
    TALENT_UNLOCK, TALENT_MAX, talentLevels, resolveTalents,
    MAX_LEVEL, RANKS, MAX_RANK, SKILL_SCALE, CLASS_GROWTH, RACE_DEFS, STAT_CAPS, ITEMS, RANK_UP_COST, UNIQUE_KEYS, TALENT_STAT_KEYS,
    growthUnits, scaleSkills, computeStats, expToNext, addExp, checkRankUp, rankUp, defaultProgress, loadAll, saveAll,
};
