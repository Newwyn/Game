const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../game/stamina');
const W = require('../game/wallet');

test('mặc định và hằng số thể lực', () => {
    assert.equal(S.MAX, 360);
    assert.equal(S.REGEN_SEC, 300);
    assert.deepEqual(S.COST, { story: 4, hard: 6, hell: 10 });
    assert.deepEqual(S.BUY, { diamond: 50, amount: 60, cap: 999 });
    assert.deepEqual(S.defaultStamina(123), { value: 360, lastAt: 123 });
});
test('hồi đúng điểm và giữ thời gian lẻ', () => {
    const st = { value: 100, lastAt: 0 };
    assert.equal(S.regen(st, 900005), st);
    assert.deepEqual(st, { value: 103, lastAt: 900000 });
    S.regen(st, 899999);
    assert.deepEqual(st, { value: 103, lastAt: 900000 });
});
test('hồi lâu không vượt trần, mua dư không bị giảm', () => {
    const st = { value: 100, lastAt: 0 };
    S.regen(st, 30 * 3600000);
    assert.deepEqual(st, { value: 360, lastAt: 260 * 300000 });
    st.value = 370;
    S.regen(st, 31 * 3600000);
    assert.deepEqual(st, { value: 370, lastAt: 31 * 3600000 });
});
test('tiêu sau hồi và hoàn thể lực an toàn', () => {
    const st = { value: 3, lastAt: 0 };
    assert.equal(S.trySpend(st, 4, 0), false);
    assert.equal(st.value, 3);
    assert.equal(S.trySpend(st, 4, 300000), true);
    assert.equal(st.value, 0);
    S.refund(st, 3);
    assert.equal(st.value, 3);
    assert.equal(S.trySpend(st, -1, 300000), false);
    S.refund(st, -1);
    assert.equal(st.value, 3);
});
test('mua 60 điểm giá 50 Kim Cương, giới hạn 999', () => {
    const st = S.defaultStamina(0), w = W.defaultWallet();
    assert.equal(S.buy(st, w), true);
    assert.equal(st.value, 420);
    assert.equal(w.diamond, 50);
    st.value = 980;
    assert.equal(S.buy(st, w), true);
    assert.equal(st.value, 999);
    w.diamond = 100;
    assert.equal(S.buy(st, w), false);
    assert.equal(w.diamond, 100);
    st.value = 100;
    w.diamond = 49;
    assert.equal(S.buy(st, w), false);
    assert.equal(st.value, 100);
});
