const TABLE = {
    maxLevel: 60, curve: { base: 85, perLevel: 5 },
    stage: { base: 25, perLevel: 2, boss: 25, first: 55, difficulty: { story: 1, hard: 1.5, hell: 2 } },
    dungeon: { base: 80, perTier: 40, first: 60 }, quest: { default: 100, side: 50, branch: 80, hidden: 40 },   // nhiệm vụ chương 1 theo loại (11/2026: giảm để mốc mở khoá rải đều theo ải, không dồn vào đầu chương)
    drops: { smallBase: .2, smallPerLevel: .01, smallMax: .65, smallDouble: .25, bigReplay: .08, refineMin: 10, refine: .12 },
};
// 11/2026: mở gần hết tính năng trong chương 1 (chỉ đi cốt truyện cũng tới cấp 18 ở ải 20) — cứ 2–3 ải có 1 thứ mới; Đấu vẫn ở cấp 25.
//   'cooking' và 'tavern' còn cần xong việc Mở lại quán của cô Lena (cờ nguyen_lieu_lena, sau ải 10) — xem game/campaign.js features()
const UNLOCKS = { 1: ['command', 'orb'], 3: ['auto'], 5: ['gear'], 7: ['forge'], 8: ['cooking'], 9: ['tavern'], 10: ['hard'], 12: ['setDungeon'], 15: ['jewelDungeon'], 18: ['hell'], 25: ['pvp'] };
const NAMES = { command: 'Ra lệnh', orb: 'Năng lượng Orb', auto: 'Tự động đánh', gear: 'Trang bị', forge: 'Lò rèn', hard: 'Độ khó Khó', tavern: 'Quán ăn', cooking: 'Nấu ăn', setDungeon: 'Hầm ngục đồ bộ', jewelDungeon: 'Hầm ngục trang sức', hell: 'Độ khó Địa ngục', pvp: 'Đấu' };
const unlocks = () => Object.entries(UNLOCKS).flatMap(([level, keys]) => keys.map(feature => ({ level: Number(level), feature, name: NAMES[feature] })));
const unlockText = feature => `Mở ở cấp tài khoản ${unlocks().find(u => u.feature === feature)?.level ?? '?'}`;
const expToNext = level => level >= TABLE.maxLevel ? 0 : TABLE.curve.base + TABLE.curve.perLevel * (level - 1);
function stageAccountExp(stage, diff = 'story', first = false) {
    const t = TABLE.stage;
    return Math.round((t.base + t.perLevel * (stage.level ?? stage.baseNo ?? stage.no ?? 1) + (stage.boss ? t.boss * stage.boss : 0) + (first ? t.first : 0)) * t.difficulty[diff]);
}
const dungeonAccountExp = (tier, first = false) => TABLE.dungeon.base + TABLE.dungeon.perTier * tier + (first ? TABLE.dungeon.first : 0);
// Quest owner: call addAccountExp(pr, questAccountExp(questId)) once when claiming a completed quest.
//   type: 'side' | 'branch' | 'hidden' (nhiệm vụ chương 1 — game/quests.js); không truyền = việc kiểu cũ (100)
const questAccountExp = (questId, type) => TABLE.quest[questId] ?? TABLE.quest[type] ?? TABLE.quest.default;
function grant(a, n) {
    a.exp += Math.max(0, Number.isFinite(n) ? Math.floor(n) : 0);
    const levelUps = [];
    while (a.level < TABLE.maxLevel && a.exp >= expToNext(a.level)) { a.exp -= expToNext(a.level); levelUps.push(++a.level); }
    if (a.level === TABLE.maxLevel) a.exp = 0;
    return levelUps;
}
function ensureAccount(pr) {
    pr.account ??= { level: 1, exp: 0 };
    const a = pr.account;
    if (a.migrated) return a;
    a.level = Math.max(1, Math.min(TABLE.maxLevel, Math.floor(a.level) || 1));
    a.exp = Math.max(0, Number(a.exp) || 0);
    a.migrated = true;
    const chapters = [require('./chapter1'), require('./chapter2')];
    for (const ch of chapters) for (const st of [...ch.stages, ...ch.branches]) {
        for (const diff of Object.keys(TABLE.stage.difficulty)) if (pr.campaign?.cleared?.[diff]?.[st.id]) grant(a, stageAccountExp(st, diff, true));
    }
    // Grandfather old unlocks, including saves with sparse or unusually early clears.
    const story = pr.campaign?.cleared?.story ?? {};
    let floor = pr.flags?.nguyen_lieu_lena ? 12 : 1;
    for (const [stage, level] of [[2, 3], [4, 10], [6, 6], [10, 10], [15, 15], [16, 18]]) if (story[`c1-${String(stage).padStart(2, '0')}`]) floor = Math.max(floor, level);
    if (chapters[0].stages.every(s => pr.campaign?.cleared?.hard?.[s.id])) floor = Math.max(floor, 20);
    if (a.level < floor) { a.level = floor; a.exp = 0; }
    return a;
}
function accountState(pr) {
    const a = ensureAccount(pr);
    return { level: a.level, exp: a.exp, need: expToNext(a.level), unlocks: unlocks() };
}
function addAccountExp(pr, n) {
    const a = ensureAccount(pr), before = { level: a.level, exp: a.exp };
    const levelUps = grant(a, n);
    return { before, after: { level: a.level, exp: a.exp }, levelUps };
}
module.exports = { TABLE, UNLOCKS, NAMES, unlockText, expToNext, stageAccountExp, dungeonAccountExp, questAccountExp, ensureAccount, accountState, addAccountExp };
