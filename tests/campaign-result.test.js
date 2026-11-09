const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../game/campaign');
const A = require('../game/account');
const baseRewards = (...args) => { const { accountExp, items, ...rest } = C.rewardsFor(...args); return rest; };
const P = require('../progression');

test('thưởng đúng cấp, độ khó và lần đầu', () => {
    assert.deepEqual(baseRewards('c1-10', 'story', true), { exp: 860, gold: 150, stone: 3, diamond: 50 });
    assert.deepEqual(baseRewards('c1-20', 'hell', true), { exp: 3520, gold: 500, stone: 15, diamond: 200 });
    assert.deepEqual(baseRewards('c1-01', 'hard', true), { exp: 332, gold: 90, stone: 2, diamond: 10 });
    assert.equal(C.rewardsFor('c1-05', 'hard', true).diamond, 30);
    assert.equal(C.rewardsFor('c1-15', 'story', true).diamond, 30);
    assert.equal(C.rewardsFor('c1-20', 'hell', false).diamond, 0);
    assert.equal(C.rewardsFor('c1-n2', 'story', true).diamond, 40);
    assert.equal(C.rewardsFor('c1-n2', 'hell', true).diamond, 80);
    assert.equal(C.rewardsFor('c1-n2', 'story', true).exp, 416);
});
test('thắng nhận thưởng, EXP và Lyra đúng một lần', () => {
    const pr = C.ensureCampaign(P.defaultProgress(['warrior', 'priest']), 0);
    const battle = { id: 'c1-12', diff: 'story', classes: ['warrior'], win: true };
    const expectedHero = { level: 1, rank: 0, exp: 0 };
    const levels = P.addExp(expectedHero, 1024);
    const result = C.applyResult(pr, battle, P, 0);
    assert.equal(result.win, true);
    assert.equal(result.firstClear, true);
    assert.equal(result.refund, 0);
    assert.deepEqual(result.newHeroes, ['archer']);
    assert.deepEqual(result.leveled, { warrior: levels });
    assert.deepEqual(pr.heroes.warrior, expectedHero);
    assert.equal(pr.heroes.priest.exp, 0);
    assert.deepEqual(pr.wallet, { gold: 670, diamond: 110, stone: 3 });
    assert.equal(pr.campaign.cleared.story['c1-12'], true);
    const again = C.applyResult(pr, battle, P, 0);
    assert.equal(again.firstClear, false);
    assert.deepEqual(again.newHeroes, []);
    assert.equal(again.rewards.diamond, 0);
    assert.equal(pr.owned.filter(id => id === 'archer').length, 1);
});
test('thua hoàn chi phí trừ 1, không thưởng hoặc mở ải', () => {
    for (const [diff, refund] of [['story', 3], ['hard', 5], ['hell', 9]]) {
        const pr = C.ensureCampaign({}, 0);
        pr.stamina.value = 100;
        const wallet = { ...pr.wallet };
        const result = C.applyResult(pr, { id: 'c1-03', diff, classes: ['warrior'], win: false }, P, 0);
        assert.deepEqual(result, { win: false, firstClear: false, rewards: { exp: 0, gold: 0, stone: 0, diamond: 0, accountExp: 0, items: {} }, account: A.accountState(pr), accountLevelUp: null, newFeatures: [], leveled: {}, newHeroes: [], refund });
        assert.equal(pr.stamina.value, 100 + refund);
        assert.deepEqual(pr.wallet, wallet);
        assert.deepEqual(pr.campaign.cleared[diff], {});
    }
});
test('save thiếu heroes vẫn nhận EXP, Lyra chỉ mở ở Cốt truyện', () => {
    const pr = C.ensureCampaign({}, 0);
    const result = C.applyResult(pr, { id: 'c1-12', diff: 'hard', classes: ['warrior'], win: true }, P, 0);
    assert.ok(pr.heroes.warrior.level > 1);
    assert.deepEqual(result.newHeroes, []);
    const story = C.applyResult(pr, { id: 'c1-12', diff: 'story', classes: ['warrior'], win: true }, P, 0);
    assert.equal(story.firstClear, true);
    assert.deepEqual(story.newHeroes, ['archer']);
});
