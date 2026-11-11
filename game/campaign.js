const A = require('./account');
const W = require('./wallet');
const S = require('./stamina');
const chapter = require('./chapter1');
const CHAPTERS = [chapter, require('./chapter2')];   // c1 tộc Người · c2 vùng Elf
const chapterOf = (id) => CHAPTERS.find(c => String(id ?? '').startsWith(`${c.id}-`)) ?? null;

const DIFFS = ['story', 'hard', 'hell'];
const DIFF = {
    story: { lv: 0, mul: 1, exp: 1, stone: 1, dia: 1 },
    hard: { lv: 5, mul: 1.25, exp: 1.5, stone: 2, dia: 1 },
    hell: { lv: 10, mul: 1.7, exp: 2, stone: 3, dia: 2 },
};
// Cấp quái theo mức độ khó (cân bằng 09/11): muốn lên SS phải đạt cấp 40, SSS cấp 60 -> đội SS thật sự ở cấp 40–60, SSS ở cấp 60.
//   Cốt truyện: cấp ải (ch1 1–20, ch2 21–40) · Khó: 38 + 0,55 × cấp ải (ch1 ≈ 39–49, ch2 ≈ 50–60) — cân cho đội SS
//   Địa ngục: luôn cấp 60, sức tăng dần theo ải (DIFF.hell.mul × (1 + HELL_RAMP × cấp ải)) — cân cho đội SSS cấp 60
const HARD_LV = { base: 38, per: 0.55 }, HELL_LV = 60, HELL_RAMP = 0.008;   // giả lập 09/11: mul 1,6 + ramp 0,02 -> đội SSS thua ải cuối chương 2 (0–1/4)
// quái chương 1 vốn yếu hơn chương 2 (chương 2 có sức nền ×1,4–1,6) -> mức Khó / Địa ngục chương 1 nhân thêm cho ngang
const C1_HARD_BOOST = 1.6;
const enemyLevel = (level, diff) => diff === 'hard' ? Math.min(60, Math.max(level + 5, Math.round(HARD_LV.base + HARD_LV.per * level)))
    : diff === 'hell' ? HELL_LV : level;
const enemyMul = (level, diff) => DIFF[diff].mul * (diff === 'hell' ? 1 + HELL_RAMP * level : 1) * (diff !== 'story' && level <= 20 ? C1_HARD_BOOST : 1);
const BOSS_HP = { 0: 1, 1: 2, 2: 3, 3: 4 };
const stageId = (no, ch = 'c1') => `${ch}-${String(no).padStart(2, '0')}`;
const cleared = (pr, id, diff) => pr.campaign?.cleared?.[diff]?.[id] === true;
const denied = why => ({ ok: false, why });

// Bổ sung từng trường để save cũ vẫn giữ nguyên tiến trình.
function ensureCampaign(pr, now) {
    pr.wallet ??= {};
    for (const [key, value] of Object.entries(W.defaultWallet())) pr.wallet[key] ??= value;
    pr.stamina ??= {};
    for (const [key, value] of Object.entries(S.defaultStamina(now))) pr.stamina[key] ??= value;
    pr.owned ??= ['warrior'];   // bắt đầu chỉ có Rok — Jessica (ải 2), Seraphine (ải 3), Lyra (ải 12) gia nhập theo cốt truyện
    pr.campaign ??= {};
    pr.campaign.cleared ??= {};
    for (const diff of DIFFS) pr.campaign.cleared[diff] ??= {};
    pr.flags ??= {};
    A.ensureAccount(pr);
    return pr;
}

function findStage(id) {
    const ch = chapterOf(id);
    return ch ? ch.stages.find(s => s.id === id) || ch.branches.find(s => s.id === id) || null : null;
}
/** Chương đã mở chưa (chương 2 mở khi qua ải 20 chương 1) */
const chapterOpen = (pr, ch) => !ch.needStage || cleared(pr, ch.needStage, 'story');

function isUnlocked(pr, id, diff) {
    const s = findStage(id);
    if (!s) return denied('Ải không tồn tại');
    if (!DIFFS.includes(diff)) return denied('Độ khó không hợp lệ');
    const ch = chapterOf(id);
    if (!chapterOpen(pr, ch)) return denied(`Chương ${ch.no} mở khi qua ải 20 chương ${ch.no - 1}`);
    if (s.flag) {
        if (!pr.flags?.[s.flag]) return denied('Chưa tìm ra lối vào nhánh này');
        if (s.needStoryNo && !cleared(pr, stageId(s.needStoryNo, ch.id), 'story')) {
            return denied(`Hãy qua ải ${s.needStoryNo} ở mức Cốt truyện trước`);
        }
        if (s.needStage && !cleared(pr, s.needStage, 'story')) return denied(`Hãy qua ải ${Number(s.needStage.slice(3))} ở mức Cốt truyện trước`);
    }
    if (diff === 'story' && s.no > 1 && !cleared(pr, stageId(s.no - 1, ch.id), 'story')) {
        return denied(`Hãy qua ải ${s.no - 1} ở mức Cốt truyện trước`);
    }
    if (diff === 'hard') {
        if (!features(pr).has('hard')) return denied(A.unlockText('hard'));
        if (!cleared(pr, id, 'story')) return denied('Hãy qua ải này ở mức Cốt truyện trước');
    }
    if (diff === 'hell') {
        if (!features(pr).has('hell')) return denied(A.unlockText('hell'));
        if (!cleared(pr, id, 'hard')) return denied('Hãy qua ải này ở mức Khó trước');
    }
    return { ok: true };
}

function chapterState(pr, chId = 'c1') {
    const ch = CHAPTERS.find(c => c.id === chId && chapterOpen(pr, c)) ?? chapter;
    const status = s => Object.fromEntries(DIFFS.map(diff => [diff,
        cleared(pr, s.id, diff) ? 'cleared' : isUnlocked(pr, s.id, diff).ok ? 'open' : 'locked',
    ]));
    return {
        id: ch.id, no: ch.no, name: ch.name, parts: ch.parts,
        stages: ch.stages.map(({ id, no, name, part, boss, guests, level }) => ({ id, no, name, part, boss, guests, level, status: status({ id }) })),
        branches: ch.branches.map(({ enemies, ...s }) => ({ ...s, code: s.id.slice(3).toUpperCase(), status: status(s) })),
        // danh sách chương cho thanh chọn chương
        chapters: CHAPTERS.map(c => ({ id: c.id, no: c.no, name: c.name, open: chapterOpen(pr, c),
            cleared: c.stages.filter(s => cleared(pr, s.id, 'story')).length, total: c.stages.length })),
    };
}

function canStart(pr, { id, diff, classes }, now) {
    const unlocked = isUnlocked(pr, id, diff);
    if (!unlocked.ok) return unlocked;
    if (!Array.isArray(classes) || classes.length < 1 || classes.length > 4) return denied('Hãy chọn từ 1 đến 4 anh hùng');
    if (!classes.every(id => pr.owned?.includes(id))) return denied('Bạn chưa sở hữu anh hùng này');
    S.regen(pr.stamina, now);
    if (pr.stamina.value < S.COST[diff]) return denied('Không đủ thể lực');
    return { ok: true };
}

function features(pr) {
    const level = A.ensureAccount(pr).level;
    const out = new Set(Object.entries(A.UNLOCKS).filter(([lv]) => level >= Number(lv)).flatMap(([, keys]) => keys));
    if (!pr.flags?.nguyen_lieu_lena) { out.delete('tavern'); out.delete('cooking'); }   // quán ăn + nấu ăn: còn cần xong việc Mở lại quán của cô Lena
    if (cleared(pr, 'c1-20', 'story')) { out.add('heroShop'); out.add('chapter2'); }
    return out;
}

function rewardsFor(id, diff, firstClear, rng = Math.random) {
    const s = findStage(id), d = DIFF[diff];
    if (!s || !DIFFS.includes(diff)) throw new Error('Ải hoặc độ khó không hợp lệ');
    const n = s.level ?? s.baseNo ?? s.no;   // chương 2: cấp ải 21–40 -> thưởng lớn hơn
    const items = {}, rates = A.TABLE.drops;
    if (rng() < Math.min(rates.smallMax, rates.smallBase + rates.smallPerLevel * n)) items.exp_small = rng() < rates.smallDouble ? 2 : 1;
    if (s.boss && (firstClear || rng() < rates.bigReplay)) items.exp_big = 1;
    if (n >= rates.refineMin && rng() < rates.refine) items.refine_stone = 1;
    // 11/2026 (người chơi quyết): mỗi ải lần đầu qua = 50 Kim Cương (Cốt truyện) · 100 (Khó) · 150 (Địa ngục), không phân biệt ải thường / trùm
    const diamond = { story: 50, hard: 100, hell: 150 }[diff];
    return {
        items, accountExp: A.stageAccountExp(s, diff, firstClear),
        exp: Math.round((160 + 60 * n + n * n) * d.exp),   // cân bằng 09/11: + n² để chương 2 (ải cấp 21–40) cấp anh hùng vẫn bám kịp cấp ải (tính cả bình EXP rơi) · Khó ×1,5 có thể ra số lẻ
        gold: Math.round((50 + 10 * n) * d.exp),
        stone: (1 + Math.floor(n / 5)) * d.stone,
        diamond: firstClear ? diamond : 0,
    };
}

// Server gọi một lần khi kết thúc trận; thể lực đã trừ lúc vào trận.
//   meta = { deaths, skills, kills } (server đếm trong trận; không truyền = không gọi) -> móc sự kiện nhiệm vụ (game/quests.js): bước chính tuyến, nhiệm vụ, việc hằng ngày
function applyResult(pr, { id, diff, classes, win }, P, now, rng = Math.random, meta = null) {
    if (!findStage(id) || !DIFFS.includes(diff)) throw new Error('Ải hoặc độ khó không hợp lệ');
    ensureCampaign(pr, now);
    const questHook = () => meta && require('./quests').battle(pr, pr.wallet, { id, diff, win: !!win, squad: new Set(classes).size, ...meta }, now ?? Date.now());
    const beforeFeatures = features(pr);
    const firstClear = !!win && !cleared(pr, id, diff);
    const result = {
        win, firstClear, rewards: { exp: 0, gold: 0, stone: 0, diamond: 0, accountExp: 0, items: {} }, account: A.accountState(pr), newFeatures: [], accountLevelUp: null,
        leveled: {}, newHeroes: [], refund: 0,
    };
    if (!win) {
        result.refund = S.COST[diff] - 1;
        S.refund(pr.stamina, result.refund);
        questHook();
        return result;
    }
    result.rewards = rewardsFor(id, diff, firstClear, rng);
    const up = A.addAccountExp(pr, result.rewards.accountExp);
    result.accountLevelUp = up.levelUps.length ? up : null;
    result.account = A.accountState(pr);
    pr.items ??= {};
    for (const [key, count] of Object.entries(result.rewards.items)) pr.items[key] = (pr.items[key] ?? 0) + count;
    for (const cur of W.CURRENCIES) W.add(pr.wallet, cur, result.rewards[cur]);
    pr.heroes ??= {};
    for (const classId of new Set(classes)) {
        pr.heroes[classId] ??= { level: 1, rank: 0, exp: 0 };
        result.leveled[classId] = P.addExp(pr.heroes[classId], result.rewards.exp);
    }
    pr.campaign.cleared[diff][id] = true;
    // anh hùng gia nhập khi lần đầu qua ải (mức Cốt truyện): ải có `joins` trong chapter1.js
    for (const hero of (firstClear && diff === 'story' ? findStage(id).joins ?? [] : [])) {
        if (!pr.owned.includes(hero)) { pr.owned.push(hero); result.newHeroes.push(hero); }
    }
    result.newFeatures = [...features(pr)].filter(f => !beforeFeatures.has(f));
    questHook();
    return result;
}

module.exports = { DIFFS, DIFF, BOSS_HP, CHAPTERS, chapterOf, chapterOpen, ensureCampaign, findStage, isUnlocked, chapterState, canStart, features, rewardsFor, applyResult, enemyLevel, enemyMul, HARD_LV, HELL_LV, HELL_RAMP };
