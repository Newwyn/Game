const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../game/dungeon');
const T = require('../game/tavern');
const SH = require('../game/shop');
const C = require('../game/campaign');

const DAY = new Date(2026, 10, 6, 12).getTime();
const fresh = () => C.ensureCampaign({}, DAY);
const feats = (...f) => new Set(f);
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

test('id hầm ngục', () => {
    assert.deepEqual(D.parseId('d-set-2'), { kind: 'set', tier: 2 });
    assert.equal(D.parseId('c1-01'), null);
    assert.equal(D.parseId('d-set-4'), null);
    assert.equal(D.findTier('d-jewel-3').itemLv, 30);
});

test('hầm đồ bộ: khoá theo tính năng + tầng, tốn 8 thể lực, thua hoàn 7', () => {
    const pr = fresh();
    const args = { kind: 'set', tier: 1, classes: ['warrior'] };
    assert.equal(D.canStart(pr, args, feats(), DAY).ok, false);
    assert.equal(D.canStart(pr, { ...args, tier: 2 }, feats('setDungeon'), DAY).ok, false);   // chưa qua tầng 1
    assert.equal(D.canStart(pr, args, feats('setDungeon'), DAY).ok, true);
    assert.equal(D.canStart(pr, { ...args, classes: ['archer'] }, feats('setDungeon'), DAY).ok, false);
    D.spend(pr, 'set', DAY);
    assert.equal(pr.stamina.value, 352);
    assert.deepEqual(D.applyResult(pr, { kind: 'set', tier: 1, win: false }, DAY), { win: false, refund: 7 });
    assert.equal(pr.stamina.value, 359);
    assert.equal(D.applyResult(pr, { kind: 'set', tier: 1, win: true }, DAY).firstTier, true);
    assert.equal(D.canStart(pr, { ...args, tier: 2 }, feats('setDungeon'), DAY).ok, true);
    pr.stamina.value = 5;
    assert.match(D.canStart(pr, args, feats('setDungeon'), DAY).why, /thể lực/);
});

test('hầm trang sức: 3 lượt / ngày, thua không mất lượt, mua thêm 3 lượt, sang ngày mới đặt lại', () => {
    const pr = fresh();
    const args = { kind: 'jewel', tier: 1, classes: ['warrior'] };
    const f = feats('jewelDungeon');
    for (let i = 0; i < 3; i++) { assert.equal(D.canStart(pr, args, f, DAY).ok, true); D.spend(pr, 'jewel', DAY); }
    assert.equal(D.canStart(pr, args, f, DAY).ok, false);
    D.applyResult(pr, { kind: 'jewel', tier: 1, win: false }, DAY);
    assert.equal(D.runsLeft(pr, DAY), 1);
    D.spend(pr, 'jewel', DAY);
    for (let i = 0; i < 3; i++) assert.equal(D.buyRun(pr, pr.wallet, DAY).ok, true);
    assert.equal(D.buyRun(pr, pr.wallet, DAY).ok, false);
    assert.equal(pr.wallet.diamond, 10);
    assert.equal(D.runsLeft(pr, DAY), 3);
    assert.equal(D.runsLeft(pr, DAY + 24 * 3600 * 1000), 3);
    assert.equal(pr.dungeon.jewelBought, 0);
    const poor = fresh(); poor.wallet.diamond = 5;
    assert.equal(D.buyRun(poor, poor.wallet, DAY).ok, false);
});

test('chiến lợi phẩm: đồ bộ tím / cam đúng cấp tầng, trang sức là nhẫn / dây chuyền', () => {
    for (let t = 1; t <= 3; t++) {
        const s = D.rollLoot(seq(0.3, 0.1, 0.5, 0.9), 'set', t);
        for (const it of s.items) {
            assert.ok(['weapon', 'armor', 'hands', 'legs'].includes(it.slot));
            assert.ok(['ho_ve', 'chien_luoc', 'lu_khach'].includes(it.set));
            assert.ok(it.rarity >= 3);
            assert.equal(it.level, t * 10);
        }
        const j = D.rollLoot(seq(0.6, 0.2), 'jewel', t);
        assert.equal(j.items.length, 1);
        assert.ok(['ring', 'necklace'].includes(j.items[0].slot));
        assert.equal(j.refine, t);
    }
});

test('trạng thái hầm ngục gửi client', () => {
    const pr = fresh();
    const st = D.state(pr, feats('setDungeon'), DAY);
    assert.equal(st.set.open, true);
    assert.equal(st.jewel.open, false);
    assert.deepEqual(st.set.tiers.map(t => t.open), [true, false, false]);
    assert.equal(st.jewel.runsLeft, 3);
});

test('quán ăn: mở sau nhiệm vụ Lena, mời món tăng thân mật, lên cấp, thưởng chỉ số', () => {
    const pr = fresh();
    assert.equal(T.feed(pr, pr.wallet, 'warrior', 'bread').ok, false);
    pr.flags.nguyen_lieu_lena = true;
    assert.equal(T.isOpen(pr), false);
    pr.account.level = 12;
    assert.equal(T.feed(pr, pr.wallet, 'archer', 'bread').ok, false);   // chưa sở hữu
    assert.equal(T.feed(pr, pr.wallet, 'warrior', 'cake').ok, false);
    const r = T.feed(pr, pr.wallet, 'warrior', 'soup');
    assert.deepEqual(r, { ok: true, gained: 35, level: 0, up: false });
    assert.equal(pr.wallet.gold, 200);
    assert.equal(T.feed(pr, pr.wallet, 'warrior', 'soup').ok, false);   // thiếu vàng, không trừ gì
    assert.equal(pr.wallet.gold, 200);
    assert.equal(T.feed(pr, pr.wallet, 'warrior', 'bread').up, false);
    assert.equal(T.feed(pr, pr.wallet, 'warrior', 'bread').up, true);   // 55 điểm -> cấp 1
    assert.equal(T.levelOf(4000), 10);
    assert.equal(T.bonus(1700), 0.07);
    pr.affinity.warrior = 4000; pr.wallet.gold = 9999;
    assert.match(T.feed(pr, pr.wallet, 'warrior', 'bread').why, /tối đa/);
    assert.equal(T.state(pr).find(h => h.id === 'warrior').level, 10);
});

test('cửa hàng anh hùng: mở sau ải 20, mua bằng Kim Cương, không mua trùng', () => {
    const pr = fresh();
    pr.wallet.diamond = 1000;
    assert.equal(SH.buy(pr, pr.wallet, 'mage', feats()).ok, false);
    assert.equal(SH.buy(pr, pr.wallet, 'warrior', feats('heroShop')).ok, false);
    assert.equal(SH.buy(pr, pr.wallet, 'mage', feats('heroShop')).ok, true);
    assert.equal(pr.wallet.diamond, 400);
    assert.ok(pr.owned.includes('mage'));
    assert.equal(SH.buy(pr, pr.wallet, 'mage', feats('heroShop')).ok, false);
    assert.equal(SH.buy(pr, pr.wallet, 'elementalist', feats('heroShop')).ok, false);   // thiếu Kim Cương
    assert.equal(SH.list(pr).find(h => h.id === 'mage').owned, true);
});
