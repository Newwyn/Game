const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../game/gear');

// rng cố định: trả lần lượt các số trong mảng (hết thì quay vòng)
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };
// rng giả ngẫu nhiên có hạt giống
const seeded = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const fresh = () => { const pr = {}; G.ensureGear(pr); return pr; };
const wallet = (gold = 100000, stone = 10000) => ({ gold, diamond: 0, stone });
function give(pr, spec, rng = seeded(1)) {
    const it = G.createItem(rng, spec, G.newId(pr));
    assert.equal(G.addItem(pr, it), true);
    return it;
}

test('save cũ được bổ sung trường trang bị', () => {
    const pr = { items: { exp_small: 2 } };
    G.ensureGear(pr);
    assert.deepEqual(pr.gear, { items: {}, equipped: {}, nextId: 1 });
    assert.equal(pr.items.exp_small, 2);
    assert.equal(G.newId(pr), 'g1');
    assert.equal(G.newId(pr), 'g2');
});

test('chỉ số chính & dòng phụ nhân hệ số cấp × độ hiếm', () => {
    const w = G.createItem(seq(0), { slot: 'weapon', level: 60, rarity: 4 }, 'a');
    assert.deepEqual(w.main, [{ key: 'atk', value: 300 }]);
    const legs = G.createItem(seq(0), { slot: 'legs', level: 30, rarity: 2 }, 'b');
    assert.deepEqual(legs.main, [{ key: 'pDef', value: 36 }, { key: 'mDef', value: 36 }]);
    // Máu cấp 30 xanh dương: 180 – 360 (key thứ 2 trong danh sách = hp)
    const lo = G.createItem(seq(1 / 12 + 0.001, 0), { slot: 'armor', level: 30, rarity: 2 }, 'c');
    assert.equal(lo.subs[0].key, 'hp');
    assert.equal(lo.subs[0].value, 180);
    const hi = G.createItem(seq(1 / 12 + 0.001, 0.999999), { slot: 'armor', level: 30, rarity: 2 }, 'd');
    assert.equal(hi.subs[0].value, 360);
});

test('số dòng phụ theo độ hiếm, không trùng loại', () => {
    for (let r = 0; r <= 4; r++) {
        const it = G.createItem(seeded(r + 7), { slot: 'hands', level: 10, rarity: r }, 'x');
        assert.equal(it.subs.length, [1, 2, 3, 4, 4][r]);
        assert.equal(new Set(it.subs.map(s => s.key)).size, it.subs.length);
    }
    assert.throws(() => G.createItem(seq(0), { slot: 'hat', level: 10, rarity: 0 }, 'x'));
    // bộ chỉ gắn cho 4 ô thuộc bộ
    assert.equal(G.createItem(seq(0), { slot: 'ring', level: 10, rarity: 0, set: 'ho_ve' }, 'x').set, null);
    assert.equal(G.createItem(seq(0), { slot: 'armor', level: 10, rarity: 0, set: 'ho_ve' }, 'x').set, 'ho_ve');
});

test('mô tả: tên, chữ chỉ số, thanh dòng phụ, chữ vàng', () => {
    const it = G.createItem(seq(5 / 12 + 0.001, 0.95), { slot: 'ring', level: 60, rarity: 0 }, 'r');
    const d = G.describe(it);
    assert.equal(d.name, 'Nhẫn Thường');
    assert.equal(d.icon, '💍');
    assert.equal(d.main[0].text, '+4,8% Tỉ lệ chí mạng');   // 80‰ × 60% = 48‰
    assert.equal(d.subs[0].key, 'crit');
    assert.equal(d.subs[0].gold, true);
    assert.equal(d.subs[0].pct, 0.95);
    assert.equal(d.wearLevel, 60);
    const set = G.describe(G.createItem(seq(0), { slot: 'armor', level: 10, rarity: 2, set: 'lu_khach' }, 's'));
    assert.equal(set.name, 'Áo Lữ Khách');
    assert.equal(set.main[0].text, '+400 Máu');
});

test('đồ cấp 10 mặc từ Lv1, từ cấp 20 phải đủ đúng cấp đồ', () => {
    assert.equal(G.canWear(1, { level: 10 }).ok, true);
    assert.equal(G.canWear(19, { level: 20 }).ok, false);
    assert.match(G.canWear(19, { level: 20 }).why, /Lv20/);
    assert.equal(G.canWear(20, { level: 20 }).ok, true);
    assert.equal(G.canWear(59, { level: 60 }).ok, false);
    assert.equal(G.canWear(60, { level: 60 }).ok, true);
});

test('mặc, đổi món cùng ô, chuyển đồ giữa 2 anh hùng', () => {
    const pr = fresh();
    const a = give(pr, { slot: 'weapon', level: 10, rarity: 0 });
    const b = give(pr, { slot: 'weapon', level: 10, rarity: 1 });
    assert.equal(G.equip(pr, 'warrior', 1, a.id).ok, true);
    assert.equal(G.bagItems(pr).length, 1);
    const sw = G.equip(pr, 'warrior', 1, b.id);
    assert.equal(sw.swapped, a.id);
    assert.deepEqual(G.equippedItems(pr, 'warrior').map(i => i.id), [b.id]);
    assert.equal(G.equip(pr, 'assassin', 1, b.id).ok, true);   // chuyển sang người khác
    assert.equal(G.ownerOf(pr, b.id), 'assassin');
    assert.deepEqual(G.equippedItems(pr, 'warrior'), []);
    assert.equal(G.equip(pr, 'assassin', 1, 'g999').ok, false);
    const hi = give(pr, { slot: 'armor', level: 30, rarity: 0 });
    assert.equal(G.equip(pr, 'assassin', 5, hi.id).ok, false);
});

test('tháo đồ: ô trống hoặc túi đầy thì từ chối', () => {
    const pr = fresh();
    const a = give(pr, { slot: 'legs', level: 10, rarity: 0 });
    G.equip(pr, 'priest', 1, a.id);
    assert.equal(G.unequip(pr, 'priest', 'weapon').ok, false);
    for (let i = 0; i < G.INV_MAX; i++) give(pr, { slot: 'hands', level: 10, rarity: 0 });
    assert.equal(G.addItem(pr, G.createItem(seq(0), { slot: 'hands', level: 10, rarity: 0 }, 'over')), false);
    assert.equal(G.unequip(pr, 'priest', 'legs').ok, false);
    assert.equal(G.ownerOf(pr, a.id), 'priest');
});

test('cường hoá thành công tăng chỉ số chính, mốc +5 tăng dòng phụ', () => {
    const pr = fresh(), w = wallet();
    const it = give(pr, { slot: 'weapon', level: 60, rarity: 4 }, seq(0.5));
    const sub0 = G.itemStats(it).atk - 300;
    for (let i = 0; i < 5; i++) assert.equal(G.enhance(pr, w, it, seq(0.99)).success, true);
    assert.equal(it.enhance, 5);
    const d = G.describe(it);
    assert.equal(d.main[0].value, 375);   // +25%
    assert.equal(d.subs[0].value, Math.round(it.subs[0].value * 1.1));
    assert.ok(G.itemStats(it).atk > 300 + sub0);
    assert.equal(w.stone, 10000 - 50);   // cấp 60: 10 viên / lần
    assert.equal(w.gold, 100000 - 60 * 5 * (1 + 2 + 3 + 4 + 5));
    assert.equal(it.spent, 50);
});

test('cường hoá hỏng: +6/+7 giữ cấp, từ +8 tụt 1 cấp, tích may mắn, bùa', () => {
    const pr = fresh(), w = wallet();
    const it = give(pr, { slot: 'armor', level: 10, rarity: 0 });
    it.enhance = 5;
    const r1 = G.enhance(pr, w, it, seq(0.85));   // 80% -> hỏng
    assert.deepEqual([r1.success, r1.to], [false, 5]);
    assert.equal(it.luck, 0.05);
    assert.equal(G.enhanceInfo(it).rate, 0.85);
    assert.equal(G.enhance(pr, w, it, seq(0.84)).success, true);
    assert.equal(it.luck, 0);
    it.enhance = 7;
    const r2 = G.enhance(pr, w, it, seq(0.6));    // +8: 50% -> hỏng, tụt về +6
    assert.deepEqual([r2.success, r2.from, r2.to], [false, 7, 6]);
    assert.equal(G.enhanceInfo(it).stone, 2);      // +7: ×2
    // bùa +10%
    it.enhance = 7; it.luck = 0;
    assert.equal(G.enhance(pr, w, it, seq(0.55), { charm: true }).ok, false);   // chưa có bùa
    pr.items.luck_charm = 1;
    assert.equal(G.enhance(pr, w, it, seq(0.55), { charm: true }).success, true);
    assert.equal(pr.items.luck_charm, 0);
    it.enhance = 10;
    assert.equal(G.enhance(pr, w, it, seq(0)).ok, false);
});

test('cường hoá thiếu đá / vàng: từ chối, không trừ gì', () => {
    const pr = fresh();
    const it = give(pr, { slot: 'weapon', level: 30, rarity: 0 });
    const poor = wallet(10, 100);
    const r = G.enhance(pr, poor, it, seq(0));
    assert.equal(r.ok, false);
    assert.match(r.why, /Vàng/);
    assert.deepEqual(poor, wallet(10, 100));
    const noStone = wallet(100000, 2);
    assert.match(G.enhance(pr, noStone, it, seq(0)).why, /Đá Cường Hoá/);
    assert.equal(it.enhance, 0);
});

test('tinh luyện: đổi 1 dòng, không trùng loại, dòng sai bị từ chối', () => {
    const pr = fresh(), w = wallet();
    const it = give(pr, { slot: 'hands', level: 20, rarity: 3 }, seeded(3));
    assert.equal(G.refine(pr, w, it, seq(0), 0).ok, false);   // chưa có đá
    pr.items.refine_stone = 30;
    assert.equal(G.refine(pr, w, it, seq(0), 4).ok, false);
    assert.equal(G.refine(pr, w, it, seq(0), -1).ok, false);
    const rng = seeded(9);
    for (let i = 0; i < 25; i++) {
        const r = G.refine(pr, w, it, rng, i % 4);
        assert.equal(r.ok, true);
        assert.equal(new Set(it.subs.map(s => s.key)).size, 4);
    }
    assert.equal(pr.items.refine_stone, 5);
    assert.equal(w.gold, 100000 - 25 * 200);
});

test('phân giải: giá trị, cộng vào ví, từ chối đồ đang mặc / đã khoá', () => {
    const pr = fresh(), w = wallet(0, 0);
    const a = give(pr, { slot: 'weapon', level: 30, rarity: 2 });
    const b = give(pr, { slot: 'armor', level: 10, rarity: 0 });
    const c = give(pr, { slot: 'legs', level: 10, rarity: 4 });
    a.spent = 9;
    assert.deepEqual(G.salvageValue(a), { stone: 6 + 4, refine: 1 });
    G.equip(pr, 'warrior', 30, c.id);
    assert.equal(G.salvage(pr, w, [a.id, c.id]).ok, false);
    b.locked = true;
    assert.equal(G.salvage(pr, w, [b.id]).ok, false);
    assert.equal(G.salvage(pr, w, []).ok, false);
    assert.equal(G.salvage(pr, w, ['nope']).ok, false);
    assert.ok(pr.gear.items[a.id]);
    const r = G.salvage(pr, w, [a.id, a.id]);
    assert.deepEqual(r, { ok: true, count: 1, stone: 10, refine: 1 });
    assert.equal(w.stone, 10);
    assert.equal(pr.items.refine_stone, 1);
    assert.equal(pr.gear.items[a.id], undefined);
});

test('cộng chỉ số: bộ 2 món, hiệu ứng 4 món', () => {
    const mk = (slot, set) => G.createItem(seq(0), { slot, level: 10, rarity: 0, set }, slot);
    const two = G.gearBonus([mk('weapon', 'ho_ve'), mk('armor', 'ho_ve'), mk('ring')]);
    assert.deepEqual(two.sets, { ho_ve: 2 });
    assert.deepEqual(two.effects, []);
    assert.equal(two.stats.atk, Math.round(300 * 0.12) + G.itemStats(mk('weapon')).atk - 36 + G.itemStats(mk('armor')).atk + G.itemStats(mk('ring')).atk);
    const four = G.gearBonus(['weapon', 'armor', 'hands', 'legs'].map(s => mk(s, 'lu_khach')));
    assert.deepEqual(four.effects, ['lu_khach']);
});

test('áp đồ vào chỉ số: vật lý / phép, tốc đánh, thưởng bộ, không sửa đầu vào', () => {
    const base = { maxHp: 1000, pAtk: 100, mAtk: 0, pDef: 100, mDef: 100, crit: 50, critDmg: 500, acc: 1000, dodge: 0, pen: 0, block: 0, mpAtk: 200, mpSec: 100, atkSpeed: 1000, moveSpeed: 0.01 };
    const stats = { atk: 20, hp: 300, pDef: 10, mDef: 0, mpAtk: 0, crit: 40, critDmg: 0, dodge: 0, block: 0, pen: 0, acc: 0, atkSpeed: 250 };
    const copy = structuredClone(base);
    const phys = G.applyGear(base, { stats, sets: {} }, 'physical');
    assert.deepEqual(base, copy);
    assert.equal(phys.pAtk, 120);
    assert.equal(phys.mAtk, 0);
    assert.equal(phys.maxHp, 1300);
    assert.equal(phys.crit, 90);
    assert.equal(phys.atkSpeed, 800);
    assert.equal(phys.moveSpeed, 0.01);
    const mag = G.applyGear(base, { stats, sets: { ho_ve: 2, lu_khach: 1 } }, 'magic');
    assert.equal(mag.mAtk, 20);
    assert.equal(mag.pAtk, 100);
    assert.equal(mag.pDef, 121);   // (100+10) × 1,1
    assert.equal(mag.mDef, 110);
    const none = G.applyGear(base, null, 'physical');
    assert.deepEqual(none, base);
});

test('rơi đồ: 4 ô, tối đa xanh dương, cấp theo độ khó, ải trùm thêm món', () => {
    const rng = seeded(42);
    for (let i = 0; i < 300; i++) {
        const diff = ['story', 'hard', 'hell'][i % 3];
        const no = 1 + (i % 20);
        const d = G.rollDrops(rng, { no, boss: no % 5 === 0 ? 1 : 0, diff });
        assert.equal(d.items.length, no % 5 === 0 ? 2 : 1);
        for (const it of d.items) {
            assert.ok(G.SET_SLOTS.includes(it.slot));
            assert.ok(it.rarity >= 0 && it.rarity <= 2);
            const lv = no + { story: 0, hard: 5, hell: 10 }[diff];
            assert.equal(it.level, Math.max(10, Math.floor(lv / 10) * 10));
        }
    }
    assert.deepEqual(G.rollDrops(seq(0.5), { no: 6, diff: 'story', firstClear: true }).items, [{ slot: 'weapon', level: 10, rarity: 1 }]);
});
