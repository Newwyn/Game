const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../game/wild');
const C = require('../game/campaign');

const fresh = () => C.ensureCampaign({}, 0);
const clear = (pr, n) => { for (let i = 1; i <= n; i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2, '0')}`] = true; };

test('mã trận quái hoang', () => {
    assert.equal(W.isId('wild-outskirts'), true);
    assert.equal(W.isId('wild-ashford'), false);
    assert.equal(W.isId('c1-01'), false);
    assert.equal(W.sceneOf('wild-forest'), 'forest');
});

test('chỉ gặp quái sau ải 1, ở khu có bầy quái', () => {
    const pr = fresh();
    assert.equal(W.canStart(pr, 'outskirts').ok, false);
    clear(pr, 1);
    assert.equal(W.canStart(pr, 'outskirts').ok, true);
    assert.equal(W.canStart(pr, 'ashford').ok, false);
});

test('cấp quái theo số ải đã qua, kẹp trong khoảng của khu', () => {
    const pr = fresh();
    clear(pr, 1);
    assert.equal(W.levelOf(pr, 'outskirts'), 1);
    assert.equal(W.levelOf(pr, 'road'), 10);
    clear(pr, 15);
    assert.equal(W.levelOf(pr, 'outskirts'), 8);
    assert.equal(W.levelOf(pr, 'road'), 15);
});

test('đội 1 người gặp 2 quái, đội đông gặp 3', () => {
    const pr = fresh(); clear(pr, 3);
    assert.equal(W.squad(pr, 'forest', 1, () => 0).layout.length, 2);
    const s = W.squad(pr, 'forest', 3, () => 0.99);
    assert.equal(s.layout.length, 3);
    assert.ok(s.layout.every(e => W.POOLS.forest.mobs.some(([c]) => c === e.classId)));
    assert.equal(s.mul, W.MUL);
    assert.equal(W.squad(pr, 'forest', 1).mul, W.MUL_BY_PARTY[1]);
});

test('thắng: vàng + EXP (đôi khi đá) · thua: không mất gì', () => {
    const pr = fresh(); clear(pr, 4);
    const g0 = pr.wallet.gold, s0 = pr.wallet.stone;
    const r = W.applyResult(pr, 'outskirts', true, () => 0.1);
    assert.equal(r.gold, 20 + 8 * 4);
    assert.equal(r.exp, 50 + 25 * 4);
    assert.equal(r.stone, 1);
    assert.equal(pr.wallet.gold, g0 + r.gold);
    assert.equal(pr.wallet.stone, s0 + 1);
    assert.deepEqual(W.applyResult(pr, 'outskirts', false), { exp: 0, gold: 0, stone: 0, diamond: 0 });
    assert.equal(pr.wild.wins, 1);
});
