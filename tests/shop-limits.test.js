const test = require('node:test');
const assert = require('node:assert/strict');
const Shop = require('../game/shop');
const charm = { id: 'luck_charm', cost: { diamond: 50 } };
const fresh = () => ({ wallet: { diamond: 500, gold: 5000 }, items: {} });
const date = (year, month, day = 1, hour = 0, minute = 0) => new Date(year, month - 1, day, hour, minute);

test('charm purchase persists server-local calendar month and rejects repeats without charging', () => {
    const pr = fresh(), now = date(2026, 11, 9);
    assert.deepEqual(Shop.itemLimit(pr, charm.id, now), { available: true, text: 'Còn 1/1 lượt tháng này' });
    assert.deepEqual(Shop.buyItem(pr, charm, 1, now), { ok: true, count: 1 });
    assert.equal(pr.wallet.diamond, 450);
    assert.equal(pr.items.luck_charm, 1);
    assert.deepEqual(pr.shopLimits, { luck_charm: '2026-11' });
    assert.deepEqual(Shop.itemLimit(pr, charm.id, now), { available: false, text: 'Đã mua tháng này' });
    const restored = JSON.parse(JSON.stringify(pr)), before = structuredClone(restored);
    assert.deepEqual(Shop.buyItem(restored, charm, 1, date(2026, 11, 30)), { ok: false, why: Shop.MONTHLY_LIMIT_MESSAGE });
    assert.deepEqual(restored, before);
    assert.equal(Shop.itemLimit(fresh(), charm.id, now).available, true);
});

test('monthly quota resets at local midnight, including December to January', () => {
    for (const [last, next] of [[date(2026, 11, 30, 23, 59), date(2026, 12)], [date(2026, 12, 31, 23, 59), date(2027, 1)]]) {
        const pr = fresh();
        assert.ok(Shop.buyItem(pr, charm, 1, last).ok);
        assert.ok(Shop.itemLimit(pr, charm.id, next).available);
        assert.ok(Shop.buyItem(pr, charm, 1, next).ok);
        assert.equal(pr.items.luck_charm, 2);
        assert.equal(pr.wallet.diamond, 400);
        assert.equal(pr.shopLimits.luck_charm, Shop.monthKey(next));
    }
    assert.equal(Shop.monthKey(date(2027, 1)), '2027-01');
});

test('bulk charm attempts and insufficient funds consume neither money nor monthly allowance', () => {
    const now = date(2026, 11), pr = fresh(), before = structuredClone(pr);
    assert.deepEqual(Shop.buyItem(pr, charm, 20, now), { ok: false, why: Shop.MONTHLY_LIMIT_MESSAGE });
    assert.deepEqual(pr, before);
    pr.wallet.diamond = 49;
    assert.equal(Shop.buyItem(pr, charm, 1, now).ok, false);
    assert.equal(pr.wallet.diamond, 49);
    assert.equal(pr.shopLimits, undefined);
    assert.deepEqual(pr.items, {});
    pr.wallet.diamond = 50;
    assert.ok(Shop.buyItem(pr, charm, 1, now).ok);
    assert.equal(pr.wallet.diamond, 0);
});

test('ordinary item packs and wallet purchases retain quantities and have no monthly limit', () => {
    const pr = fresh(), now = date(2026, 11);
    const refine = { id: 'refine_stone', cost: { gold: 1500 }, qty: 5 };
    assert.equal(Shop.itemLimit(pr, refine.id, now), null);
    assert.ok(Shop.buyItem(pr, refine, 2, now).ok);
    assert.equal(pr.items.refine_stone, 10);
    assert.equal(pr.wallet.gold, 2000);
    assert.ok(Shop.buyItem(pr, { id: 'stone', cost: { gold: 1200 }, qty: 10, wallet: true }, 1, now).ok);
    assert.equal(pr.wallet.stone, 10);
    assert.equal(pr.shopLimits, undefined);
});
