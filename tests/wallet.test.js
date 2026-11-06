const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../game/wallet');

test('ví mặc định và cộng tiền', () => {
    const w = W.defaultWallet();
    assert.deepEqual(W.CURRENCIES, ['gold', 'diamond', 'stone']);
    assert.deepEqual(w, { gold: 500, diamond: 100, stone: 0 });
    assert.equal(W.add(w, 'stone', 3), w);
    assert.equal(w.stone, 3);
    for (const n of [-1, NaN, Infinity]) W.add(w, 'gold', n);
    W.add(w, 'unknown', 10);
    assert.equal(w.gold, 500);
    assert.equal(w.unknown, undefined);
});

test('trừ tiền chỉ khi đủ và số tiền hợp lệ', () => {
    const w = W.defaultWallet();
    assert.equal(W.trySpend(w, 'gold', 400), true);
    assert.equal(w.gold, 100);
    for (const n of [101, -1, NaN, Infinity]) assert.equal(W.trySpend(w, 'gold', n), false);
    assert.equal(W.trySpend(w, 'unknown', 0), false);
    assert.equal(w.gold, 100);
});
