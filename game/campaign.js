const W = require('./wallet');
const S = require('./stamina');
const chapter = require('./chapter1');

const DIFFS = ['story', 'hard', 'hell'];
const DIFF = {
    story: { lv: 0, mul: 1, exp: 1, stone: 1, dia: 1 },
    hard: { lv: 5, mul: 1.25, exp: 1.5, stone: 2, dia: 1 },
    hell: { lv: 10, mul: 1.6, exp: 2, stone: 3, dia: 2 },
};
const BOSS_HP = { 0: 1, 1: 2, 2: 3, 3: 4 };
const stageId = no => `c1-${String(no).padStart(2, '0')}`;
const cleared = (pr, id, diff) => pr.campaign?.cleared?.[diff]?.[id] === true;
const allHard = pr => chapter.stages.every(s => cleared(pr, s.id, 'hard'));
const denied = why => ({ ok: false, why });

// Bổ sung từng trường để save cũ vẫn giữ nguyên tiến trình.
function ensureCampaign(pr, now) {
    pr.wallet ??= {};
    for (const [key, value] of Object.entries(W.defaultWallet())) pr.wallet[key] ??= value;
    pr.stamina ??= {};
    for (const [key, value] of Object.entries(S.defaultStamina(now))) pr.stamina[key] ??= value;
    pr.owned ??= ['assassin', 'warrior', 'priest'];
    pr.campaign ??= {};
    pr.campaign.cleared ??= {};
    for (const diff of DIFFS) pr.campaign.cleared[diff] ??= {};
    pr.flags ??= {};
    return pr;
}

function findStage(id) {
    return chapter.stages.find(s => s.id === id) || chapter.branches.find(s => s.id === id) || null;
}

function isUnlocked(pr, id, diff) {
    const s = findStage(id);
    if (!s) return denied('Ải không tồn tại');
    if (!DIFFS.includes(diff)) return denied('Độ khó không hợp lệ');
    if (s.flag) {
        if (!pr.flags?.[s.flag]) return denied('Chưa tìm ra lối vào nhánh này');
        if (s.needStoryNo && !cleared(pr, stageId(s.needStoryNo), 'story')) {
            return denied(`Hãy qua ải ${s.needStoryNo} ở mức Cốt truyện trước`);
        }
    }
    if (diff === 'story' && s.no > 1 && !cleared(pr, stageId(s.no - 1), 'story')) {
        return denied(`Hãy qua ải ${s.no - 1} ở mức Cốt truyện trước`);
    }
    if (diff === 'hard') {
        if (!cleared(pr, 'c1-04', 'story')) return denied('Hãy qua ải 4 ở mức Cốt truyện trước');
        if (!cleared(pr, id, 'story')) return denied('Hãy qua ải này ở mức Cốt truyện trước');
    }
    if (diff === 'hell' && !allHard(pr)) return denied('Địa ngục mở khi qua hết 20 ải mức Khó');
    return { ok: true };
}

function chapterState(pr) {
    const status = s => Object.fromEntries(DIFFS.map(diff => [diff,
        cleared(pr, s.id, diff) ? 'cleared' : isUnlocked(pr, s.id, diff).ok ? 'open' : 'locked',
    ]));
    return {
        stages: chapter.stages.map(({ id, no, name, part, boss }) => ({ id, no, name, part, boss, status: status({ id }) })),
        branches: chapter.branches.map(({ enemies, ...s }) => ({ ...s, status: status(s) })),
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
    const out = new Set(['command']);
    for (const [no, key] of [[1, 'orb'], [2, 'auto'], [4, 'hard'], [6, 'gear'], [10, 'forge'], [15, 'setDungeon'], [16, 'jewelDungeon']]) {
        if (cleared(pr, stageId(no), 'story')) out.add(key);
    }
    if (allHard(pr)) out.add('hell');
    if (cleared(pr, 'c1-20', 'story')) out.add('heroShop');
    return out;
}

function rewardsFor(id, diff, firstClear) {
    const s = findStage(id), d = DIFF[diff];
    if (!s || !DIFFS.includes(diff)) throw new Error('Ải hoặc độ khó không hợp lệ');
    const n = s.no ?? s.baseNo;
    const diamond = s.flag ? 40 : [10, 30, 50, 100][s.boss];
    return {
        exp: Math.round((160 + 60 * n) * d.exp),   // P5 cân bằng: ×4 bản đầu (40 + 15n) để cấp anh hùng theo kịp cấp ải · Khó ×1,5 có thể ra số lẻ
        gold: Math.round((50 + 10 * n) * d.exp),
        stone: (1 + Math.floor(n / 5)) * d.stone,
        diamond: firstClear ? diamond * d.dia : 0,
    };
}

// Server gọi một lần khi kết thúc trận; thể lực đã trừ lúc vào trận.
function applyResult(pr, { id, diff, classes, win }, P, now) {
    if (!findStage(id) || !DIFFS.includes(diff)) throw new Error('Ải hoặc độ khó không hợp lệ');
    ensureCampaign(pr, now);
    const firstClear = !!win && !cleared(pr, id, diff);
    const result = {
        win, firstClear, rewards: { exp: 0, gold: 0, stone: 0, diamond: 0 },
        leveled: {}, newHeroes: [], refund: 0,
    };
    if (!win) {
        result.refund = S.COST[diff] - 1;
        S.refund(pr.stamina, result.refund);
        return result;
    }
    result.rewards = rewardsFor(id, diff, firstClear);
    for (const cur of W.CURRENCIES) W.add(pr.wallet, cur, result.rewards[cur]);
    pr.heroes ??= {};
    for (const classId of new Set(classes)) {
        pr.heroes[classId] ??= { level: 1, rank: 0, exp: 0 };
        result.leveled[classId] = P.addExp(pr.heroes[classId], result.rewards.exp);
    }
    pr.campaign.cleared[diff][id] = true;
    if (firstClear && diff === 'story' && id === 'c1-12' && !pr.owned.includes('archer')) {
        pr.owned.push('archer');
        result.newHeroes.push('archer');
    }
    return result;
}

module.exports = { DIFFS, DIFF, BOSS_HP, ensureCampaign, findStage, isUnlocked, chapterState, canStart, features, rewardsFor, applyResult };
