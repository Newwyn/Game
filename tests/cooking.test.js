// 🍲 Nấu ăn + túi đồ ăn (game/cooking.js) · mốc mở khoá tính năng chương 1 (game/account.js)
const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../game/world');
const C = require('../game/campaign');
const A = require('../game/account');
const G = require('../game/gather');
const CK = require('../game/cooking');
const Q = require('../game/quests');
const QD = require('../game/questData1');
const WILD = require('../game/wild');
const P = require('../progression');

const NOW = new Date(2026, 10, 11, 12, 0, 0).getTime();
const fresh = (open = true) => { const pr = C.ensureCampaign({}, 0); W.ensureWorld(pr); if (open) pr.flags.nguyen_lieu_lena = true; return pr; };
const give = (pr, mats) => { for (const [id, n] of Object.entries(mats)) G.addMat(pr, id, n); };
const member = (classId, extra = {}) => ({ classId, alive: true, hp: 400, maxHp: 1000, mp: 0, maxMp: 5000, statusEffects: [], ...extra });
const helpers = { heal: (m, amount) => { const v = Math.min(m.maxHp - m.hp, Math.round(amount)); m.hp += v; return v; }, cleanse: (m) => { m.statusEffects = m.statusEffects.filter(ef => !ef.debuff); }, orbCost: 1000 };

test('10 công thức, mỗi anh hùng chương 1 có 1 món tủ, đúng 1 món hồi sinh, nguyên liệu đều có thật, lời không dùng gạch dài', () => {
    assert.equal(CK.RECIPES.length, 10);
    assert.deepEqual(CK.RECIPES.filter(r => r.fav).map(r => r.fav).sort(), ['archer', 'assassin', 'priest', 'warrior']);
    assert.equal(CK.RECIPES.filter(r => r.effect.revive).length, 1);
    for (const r of CK.RECIPES) {
        for (const id of Object.keys(r.needs)) assert.ok(G.MATS[id], `${r.id}: ${id}`);
        assert.ok((r.effect.heal ?? 0) <= 0.25, `${r.id}: hồi máu tối đa 25%`);
        if (r.learn.quest) assert.ok(Q.BY_ID[r.learn.quest], r.id);
        if (r.learn.note) assert.ok(G.NOTES.some(n => n.id === r.learn.note && n.recipe === r.id), r.id);
        if (r.learn.book) assert.equal(CK.SHOP[r.learn.book].teaches, r.id);
        for (const t of [r.name, r.hint ?? '', r.note ?? '', CK.effectText(r.effect)]) assert.ok(!t.includes('—'), r.id);
    }
    // mọi nguyên liệu nấu ăn đều kiếm được: hái / câu / quái rơi / mua
    const sources = new Set([...Object.values(G.NODES).map(n => n.item).filter(Boolean), ...G.FISH.map(f => f.id), 'thit', ...Object.values(CK.SHOP).map(s => s.mat).filter(Boolean)]);
    for (const r of CK.RECIPES) for (const id of Object.keys(r.needs)) assert.ok(sources.has(id), `${r.id}: không có nguồn ${id}`);
});

test('chưa xong việc cô Lena: không nấu được, không có công thức, không có tính năng cooking', () => {
    const pr = fresh(false);
    give(pr, { lua: 5, muoi: 5 });
    assert.equal(CK.cook(pr, 'chao').ok, false);
    assert.equal(CK.state(pr).recipes.every(r => !r.known && r.name === '???'), true);
    pr.account.level = 60;
    assert.ok(!C.features(pr).has('cooking'));
    assert.equal(W.interact(pr, pr.wallet, 'tavern_in', 'bep_lena', {}, NOW).ok, false);
    pr.flags.nguyen_lieu_lena = true;
    assert.ok(C.features(pr).has('cooking'));
    assert.equal(W.interact(pr, pr.wallet, 'tavern_in', 'bep_lena', {}, NOW).open, 'cook');
    pr.account.level = 7;
    assert.ok(!C.features(pr).has('cooking'));
    assert.equal(W.interact(pr, pr.wallet, 'tavern_in', 'bep_lena', {}, NOW).ok, false);
});

test('nấu: trừ nguyên liệu đúng 1 lần, thiếu thì không trừ gì, công thức chưa học không nấu được', () => {
    const pr = fresh();
    give(pr, { lua: 5, muoi: 2, thit: 4, go: 2 });
    const r = CK.cook(pr, 'chao', 2);
    assert.ok(r.ok);
    assert.deepEqual([G.have(pr, 'lua'), G.have(pr, 'muoi'), pr.world.dishes.chao], [1, 0, 2]);
    const bad = CK.cook(pr, 'chao', 1);                        // còn 1 lúa, 0 muối
    assert.equal(bad.ok, false);
    assert.match(bad.why, /Lúa mì \(1\/2\)/);
    assert.deepEqual([G.have(pr, 'lua'), pr.world.dishes.chao], [1, 2]);
    assert.equal(CK.cook(pr, 'thit_nuong').ok, false);        // chưa học (cần xong việc Bẫy thỏ)
    give(pr, { muoi: 1 });
    pr.world.quests.s_bay = 'done';
    assert.ok(CK.cook(pr, 'thit_nuong').ok);
    assert.deepEqual([G.have(pr, 'thit'), G.have(pr, 'go'), G.have(pr, 'muoi')], [2, 1, 0]);
    // sau khi lưu / nạp lại vẫn đúng số
    const again = JSON.parse(JSON.stringify(pr));
    assert.equal(CK.state(again).dishes.find(d => d.id === 'chao').n, 2);
});

test('học công thức: biết sẵn 3 món · nhiệm vụ · ghi chép · sách mua ở bếp (sách 2 cần qua ải 13)', () => {
    const pr = fresh();
    const known = () => CK.state(pr).recipes.filter(r => r.known).map(r => r.id);
    assert.deepEqual(known(), ['chao', 'banh_mi', 'sup_nam']);
    pr.world.quests.sera = 'done'; pr.world.quests.h_ga = 'done';
    assert.ok(known().includes('tra_thao') && known().includes('canh_trung'));
    assert.ok(W.interact(pr, pr.wallet, 'forest', 'n_mo_tho_san', {}, NOW).ok);
    assert.ok(known().includes('ca_nuong'));
    pr.wallet.gold = 5000;
    assert.ok(CK.buy(pr, pr.wallet, 'book1').ok);
    assert.equal(pr.wallet.gold, 4400);
    assert.equal(CK.buy(pr, pr.wallet, 'book1').ok, false);    // không mua 2 lần
    assert.equal(pr.wallet.gold, 4400);
    assert.equal(CK.buy(pr, pr.wallet, 'book2').ok, false);
    pr.campaign.cleared.story['c1-13'] = true;
    assert.ok(CK.buy(pr, pr.wallet, 'book2').ok);
    assert.ok(known().includes('banh_tao') && known().includes('lau_ca'));
    assert.ok(CK.buy(pr, pr.wallet, 'muoi', 3).ok);
    assert.deepEqual([G.have(pr, 'muoi'), pr.wallet.gold], [3, 4400 - 1500 - 90]);
    pr.wallet.gold = 10;
    assert.equal(CK.buy(pr, pr.wallet, 'sua', 1).ok, false);
    assert.equal(G.have(pr, 'sua'), 0);
});

test('túi đồ ăn: tối đa 3 món, không quá số đang có, bỏ món lạ', () => {
    const pr = fresh();
    pr.world.dishes = { chao: 2, banh_mi: 1 };
    assert.equal(CK.setPouch(pr, ['chao', 'chao', 'banh_mi', 'chao']).ok, false);          // 4 món
    assert.deepEqual(CK.setPouch(pr, ['chao', 'chao', 'chao']).pouch, ['chao', 'chao']);   // chỉ có 2 phần
    assert.deepEqual(CK.setPouch(pr, ['xyz', 'banh_mi', 'chao']).pouch, ['banh_mi', 'chao']);
    assert.equal(CK.battlePouch(pr, 'campaign', 'c1-05').slots.length, 2);
});

test('không dùng món ăn ở Đấu / Test / hầm ngục; dùng được ở ải cốt truyện, ải nhánh, quái hoang', () => {
    const pr = fresh();
    pr.world.dishes = { chao: 3 }; CK.setPouch(pr, ['chao', 'chao', 'chao']);
    for (const mode of ['duel_hero', 'duel_monster', 'test', 'prologue']) assert.equal(CK.battlePouch(pr, mode, 'c1-01').slots.length, 0, mode);
    assert.equal(CK.battlePouch(pr, 'campaign', 'dungeon-set-1').slots.length, 0);
    for (const id of ['c1-01', 'c1-n3', 'c2-07', 'wild-forest']) assert.equal(CK.battlePouch(pr, 'campaign', id).slots.length, 3, id);
    assert.equal(CK.useSlot(pr, { slots: [], cdUntil: 0 }, 0, member('warrior'), 0).ok, false);
});

test('dùng món trong trận: mỗi ô 1 lần, hồi chung 8 giây, trừ món đúng 1 lần, tối đa 3 món mỗi trận', () => {
    const pr = fresh();
    pr.world.dishes = { chao: 5 }; CK.setPouch(pr, ['chao', 'chao', 'chao']);
    const bp = CK.battlePouch(pr, 'campaign', 'c1-05'), m = member('priest');
    const r = CK.useSlot(pr, bp, 0, m, 1000);
    assert.ok(r.ok);
    assert.equal(pr.world.dishes.chao, 4);
    assert.equal(CK.useSlot(pr, bp, 0, m, 20000).ok, false);                 // ô đã dùng
    assert.match(CK.useSlot(pr, bp, 1, m, 1000 + CK.COOLDOWN - 1).why, /Chờ 1 giây/);
    assert.equal(pr.world.dishes.chao, 4);                                    // bị chặn thì không trừ món
    assert.ok(CK.useSlot(pr, bp, 1, m, 1000 + CK.COOLDOWN).ok);
    assert.ok(CK.useSlot(pr, bp, 2, m, 1000 + CK.COOLDOWN * 2).ok);
    assert.equal(pr.world.dishes.chao, 2);
    assert.equal(CK.useSlot(pr, bp, 3, m, 99999).ok, false);                 // không có ô thứ 4
    assert.equal(bp.slots.every(s => s.used), true);
});

test('hiệu quả món: hồi 20% máu; món tủ +50%; Orb; giải hiệu ứng xấu; tăng công / thủ có thời hạn', () => {
    const now = 5000;
    const rok = member('warrior'), jess = member('assassin');
    assert.equal(CK.applyEffect(rok, CK.effectFor('chao', 'warrior'), now, helpers).healed, 200);
    // Thịt nướng than: món tủ của Rok
    const fav = CK.effectFor('thit_nuong', 'warrior'), plain = CK.effectFor('thit_nuong', 'assassin');
    assert.equal(fav.fav, true); assert.equal(plain.fav, false);
    assert.ok(Math.abs(fav.heal - plain.heal * 1.5) < 1e-9 && Math.abs(fav.atk - plain.atk * 1.5) < 1e-9);
    rok.hp = 100; jess.hp = 100;
    assert.equal(CK.applyEffect(rok, fav, now, helpers).healed, 150);
    assert.equal(CK.applyEffect(jess, plain, now, helpers).healed, 100);
    const buff = rok.statusEffects.find(ef => ef.type === 'meal_buff');
    assert.deepEqual([Math.round(buff.atk * 1000), buff.endTime], [225, now + 10000]);
    CK.applyEffect(rok, fav, now + 1, helpers);
    assert.equal(rok.statusEffects.filter(ef => ef.type === 'meal_buff').length, 1);   // không cộng dồn
    // Bánh táo mật: +2 Orb, Jessica (món tủ) +3
    assert.equal(CK.applyEffect(jess, CK.effectFor('banh_tao', 'assassin'), now, helpers).orb, 3);
    assert.equal(jess.mp, 3000);
    const full = member('archer', { mp: 4500 });
    assert.equal(CK.applyEffect(full, CK.effectFor('banh_tao', 'archer'), now, helpers).orb, 0.5);   // không vượt Orb tối đa
    // Trà thảo mộc: giải hiệu ứng xấu
    const sick = member('archer', { statusEffects: [{ type: 'burn', debuff: true, endTime: 9e9 }, { type: 'shield', endTime: 9e9 }] });
    CK.applyEffect(sick, CK.effectFor('tra_thao', 'archer'), now, helpers);
    assert.deepEqual(sick.statusEffects.map(ef => ef.type), ['shield']);
});

test('món hồi sinh: chỉ nó cứu được người đã gục (30% máu); món thường không dùng cho người gục và không bị trừ', () => {
    const pr = fresh();
    pr.world.dishes = { chao: 1, sup_hoi_sinh: 1 }; CK.setPouch(pr, ['chao', 'sup_hoi_sinh']);
    const bp = CK.battlePouch(pr, 'campaign', 'c1-10'), dead = member('archer', { alive: false, hp: 0 }), ok = member('warrior');
    assert.equal(CK.useSlot(pr, bp, 0, dead, 0).ok, false);
    assert.equal(pr.world.dishes.chao, 1);
    assert.equal(CK.pickTarget([ok, dead], 'sup_hoi_sinh'), 1);
    assert.equal(CK.pickTarget([ok, dead], 'chao'), 0);
    const r = CK.useSlot(pr, bp, 1, dead, 0);
    assert.ok(r.ok);
    const res = CK.applyEffect(dead, r.effect, 0, helpers);
    assert.deepEqual([res.revived, dead.alive, dead.hp], [true, true, 300]);
    assert.equal(pr.world.dishes.sup_hoi_sinh, undefined);
});

test('quái hoang rơi thịt 0–2 miếng', () => {
    const pr = fresh();
    assert.equal(CK.wildDrop(pr, () => 0.9), 0);
    assert.equal(CK.wildDrop(pr, () => 0.5), 1);
    assert.equal(CK.wildDrop(pr, () => 0.01), 2);
    assert.equal(G.have(pr, 'thit'), 3);
    assert.ok(WILD.POOLS.forest);
});

test('mốc mở khoá chương 1: chỉ đi cốt truyện vẫn mở hết (trừ Đấu) khi xong ải 20, cứ 2–3 ải có thứ mới', () => {
    assert.deepEqual(A.UNLOCKS, { 1: ['command', 'orb'], 3: ['auto'], 5: ['gear'], 7: ['forge'], 8: ['cooking'], 9: ['tavern'], 10: ['hard'], 12: ['setDungeon'], 15: ['jewelDungeon'], 18: ['hell'], 25: ['pvp'] });
    assert.equal(A.NAMES.cooking, 'Nấu ăn');
    const pr = C.ensureCampaign({}, 0);
    W.ensureWorld(pr);
    const at = {};   // tính năng -> ải mở
    for (const s of C.CHAPTERS[0].stages) {
        const r = C.applyResult(pr, { id: s.id, diff: 'story', classes: ['warrior'], win: true }, P, 0, () => 0.999);
        if (s.no === 10) pr.flags.nguyen_lieu_lena = true;   // việc cô Lena mở sau ải 10
        for (const f of [...r.newFeatures, ...C.features(pr)]) at[f] ??= s.no;
    }
    assert.equal(pr.account.level, 18);
    for (const f of ['auto', 'gear', 'forge', 'cooking', 'tavern', 'hard', 'setDungeon', 'jewelDungeon', 'hell', 'heroShop', 'chapter2']) assert.ok(C.features(pr).has(f), f);
    assert.ok(!C.features(pr).has('pvp'));
    assert.deepEqual(at, { command: 1, orb: 1, auto: 3, gear: 5, forge: 7, hard: 10, cooking: 10, tavern: 10, setDungeon: 13, jewelDungeon: 16, hell: 20, heroShop: 20, chapter2: 20 });
    // làm hết nhiệm vụ phụ / nhánh ngay khi mở: nhanh hơn nhưng vẫn rải ra, Đấu chỉ mở ở cuối chương
    const q = C.ensureCampaign({}, 0), stageOf = (x) => { let o = x.open ?? {}; while (o.quest) o = QD.QUESTS.find(y => y.id === o.quest).open ?? {}; return o.stage ? Number(o.stage.slice(3)) : 1; };
    const lv = {};
    for (const s of C.CHAPTERS[0].stages) {
        A.addAccountExp(q, A.stageAccountExp(s, 'story', true));
        for (const x of QD.QUESTS.filter(x => x.type !== 'hidden' && stageOf(x) === s.no)) A.addAccountExp(q, A.questAccountExp(x.id, x.type));
        lv[s.no] = q.account.level;
    }
    assert.ok(lv[2] < 5 && lv[5] < 12 && lv[9] < 18 && lv[19] < 25, JSON.stringify(lv));
    assert.deepEqual([A.questAccountExp('s_meo', 'side'), A.questAccountExp('b_mo', 'branch'), A.questAccountExp('h_ga', 'hidden'), A.questAccountExp('aeris')], [50, 80, 40, 100]);
});

test('xong việc cô Lena ở cấp đủ cao: sổ báo "Mở tính năng mới: Nấu ăn"', () => {
    const pr = fresh(false);
    for (let i = 1; i <= 10; i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2, '0')}`] = true;
    W.syncReports(pr);
    pr.account.level = 12;
    const act = (scene, id) => W.interact(pr, pr.wallet, scene, id, {}, NOW, () => 0.5);
    assert.ok(act('ashford', 'lena').ok);
    act('outskirts', 'wheat'); act('forest', 'mushroom');
    Q.takeNotes(pr);
    assert.ok(act('ashford', 'lena').ok);
    assert.equal(pr.flags.nguyen_lieu_lena, true);
    const notes = Q.takeNotes(pr).map(n => n.t);
    assert.ok(notes.some(t => t.includes('Mở tính năng mới: Nấu ăn')), notes.join(' | '));
    assert.ok(notes.some(t => t.includes('Mở tính năng mới: Quán ăn')));
});
