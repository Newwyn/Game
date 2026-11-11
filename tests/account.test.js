const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../game/account');
const C = require('../game/campaign');
const D = require('../game/dungeon');
const T = require('../game/tavern');
const P = { addExp: () => 0 };
const cleared = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`c1-${String(i + 1).padStart(2, '0')}`, true]));

test('account curve increases, supports multiple levels, clamps at 60', () => {
    for (let lv = 1; lv < 59; lv++) assert.ok(A.expToNext(lv + 1) > A.expToNext(lv));
    const pr = {};
    const r = A.addAccountExp(pr, A.expToNext(1) + A.expToNext(2));
    assert.deepEqual(r, { before: { level: 1, exp: 0 }, after: { level: 3, exp: 0 }, levelUps: [2, 3] });
    A.addAccountExp(pr, -5);
    assert.equal(pr.account.exp, 0);
    A.addAccountExp(pr, 1e9);
    assert.equal(pr.account.level, 60);
    assert.equal(pr.account.exp, 0);
    assert.equal(A.accountState(pr).need, 0);
});

test('old saves receive retrospective EXP once and retain every prior gated feature', () => {
    for (const [n, keys] of [[2, ['auto']], [4, ['hard']], [6, ['gear', 'hard']], [10, ['gear', 'forge', 'hard']], [15, ['setDungeon']], [16, ['jewelDungeon']]]) {
        const pr = { campaign: { cleared: { story: cleared(n) } } };
        for (const key of keys) assert.ok(C.features(pr).has(key), `${n}: ${key}`);
        const snapshot = structuredClone(pr.account);
        A.ensureAccount(pr);
        assert.deepEqual(pr.account, snapshot);
    }
    const veteran = { campaign: { cleared: { story: cleared(20), hard: cleared(20) } }, flags: { nguyen_lieu_lena: true } };
    for (const key of ['hell', 'tavern', 'heroShop', 'chapter2']) assert.ok(C.features(veteran).has(key));
    const single = { campaign: { cleared: { story: { 'c1-01': true } } } };
    const expected = {}; A.addAccountExp(expected, A.stageAccountExp(C.findStage('c1-01'), 'story', true));
    assert.deepEqual(A.ensureAccount(single), expected.account);
});

test('unlock table, story gates, and tavern dual requirement', () => {
    assert.deepEqual(A.UNLOCKS, { 1: ['command', 'orb'], 3: ['auto'], 5: ['gear'], 7: ['forge'], 8: ['cooking'], 9: ['tavern'], 10: ['hard'], 12: ['setDungeon'], 15: ['jewelDungeon'], 18: ['hell'], 25: ['pvp'] });   // 11/2026: mở gần hết tính năng trong chương 1
    const pr = C.ensureCampaign({}, 0);
    for (const { level, feature, name } of A.accountState(pr).unlocks) {
        assert.ok(name);
        pr.flags.nguyen_lieu_lena = true;
        pr.account.level = level;
        assert.ok(C.features(pr).has(feature));
        if (level > 1) { pr.account.level--; assert.ok(!C.features(pr).has(feature)); }
    }
    pr.account.level = 60;
    assert.ok(!C.features(pr).has('chapter2'));
    assert.ok(!C.features(pr).has('heroShop'));
    delete pr.flags.nguyen_lieu_lena;
    assert.ok(!T.isOpen(pr));
    assert.ok(!C.features(pr).has('tavern'));
    pr.flags.nguyen_lieu_lena = true;
    assert.ok(T.isOpen(pr));
});

test('hard and hell require account threshold and this stage previous difficulty', () => {
    const pr = C.ensureCampaign({}, 0);
    pr.account.level = 20;
    assert.ok(!C.isUnlocked(pr, 'c1-01', 'hard').ok);
    pr.campaign.cleared.story['c1-01'] = true;
    assert.ok(C.isUnlocked(pr, 'c1-01', 'hard').ok);
    assert.ok(!C.isUnlocked(pr, 'c1-01', 'hell').ok);
    pr.campaign.cleared.hard['c1-01'] = true;
    assert.ok(C.isUnlocked(pr, 'c1-01', 'hell').ok);
    pr.account.level = 17;   // Địa ngục mở ở cấp 18
    assert.ok(!C.isUnlocked(pr, 'c1-01', 'hell').ok);
});

test('deterministic drops, first boss potion, replay diamonds, and loss grants nothing', () => {
    const pr = C.ensureCampaign({}, 0);
    const args = { id: 'c1-10', diff: 'hell', classes: ['warrior'], win: true };
    const r = C.applyResult(pr, args, P, 0, () => 0);
    assert.deepEqual(r.rewards.items, { exp_small: 2, exp_big: 1, refine_stone: 1 });
    assert.deepEqual(pr.items, r.rewards.items);
    assert.ok(r.rewards.accountExp > 0);
    assert.ok(r.rewards.diamond > 0);
    assert.ok(r.accountLevelUp.levelUps.length);
    const replay = C.applyResult(pr, args, P, 0, () => .999);
    assert.equal(replay.rewards.diamond, 0);
    assert.deepEqual(replay.rewards.items, {});
    assert.ok(replay.rewards.accountExp < r.rewards.accountExp);
    assert.deepEqual(C.rewardsFor('c1-05', 'story', true, () => .999).items, { exp_big: 1 });
    assert.equal(C.rewardsFor('c1-01', 'story', true, () => 0).items.refine_stone, undefined);
    const before = structuredClone(pr.account), items = structuredClone(pr.items);
    const loss = C.applyResult(pr, { ...args, win: false }, P, 0, () => { throw Error('loss must not roll'); });
    assert.equal(loss.rewards.accountExp, 0);
    assert.deepEqual(pr.account, before);
    assert.deepEqual(pr.items, items);
});

test('branch, difficulty, dungeon, and quest EXP sources', () => {
    const st = C.findStage('c1-n1');
    assert.ok(A.stageAccountExp(st) > 0);
    assert.equal(A.stageAccountExp(st, 'hell'), A.stageAccountExp(st) * 2);
    assert.equal(A.stageAccountExp(st, 'hard'), Math.round(A.stageAccountExp(st) * 1.5));
    assert.ok(A.questAccountExp('nguyen_lieu_lena') > 0);
    const pr = C.ensureCampaign({}, 0), before = structuredClone(pr.account);
    D.applyResult(pr, { kind: 'set', tier: 1, win: false }, 0);
    assert.deepEqual(pr.account, before);
    const first = D.applyResult(pr, { kind: 'set', tier: 1, win: true }, 0);
    const replay = D.applyResult(pr, { kind: 'set', tier: 1, win: true }, 0);
    assert.equal(first.rewards.accountExp, A.dungeonAccountExp(1, true));
    assert.equal(replay.rewards.accountExp, A.dungeonAccountExp(1));
});

test('campaign pacing reaches approximately level 20 / 35', () => {
    const pr = C.ensureCampaign({}, 0);
    const play = id => C.applyResult(pr, { id, diff: 'story', classes: ['warrior'], win: true }, P, 0, () => .999);
    C.CHAPTERS[0].stages.forEach(s => play(s.id));
    C.CHAPTERS[0].stages.slice(0, 10).forEach(s => play(s.id));
    assert.equal(pr.account.level, 20);
    C.CHAPTERS[1].stages.forEach(s => play(s.id));
    assert.equal(pr.account.level, 34);
});
