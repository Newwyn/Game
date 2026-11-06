const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../game/campaign');
const fresh = () => C.ensureCampaign({}, 0);
const clear = (pr, diff, n) => { for (let i = 1; i <= n; i++) pr.campaign.cleared[diff][`c1-${String(i).padStart(2, '0')}`] = true; };

test('bổ sung save cũ và giữ dữ liệu đã có', () => {
    const pr = fresh();
    assert.deepEqual(pr, {
        wallet: { gold: 500, diamond: 100, stone: 0 }, stamina: { value: 360, lastAt: 0 },
        owned: ['assassin', 'warrior', 'priest'], flags: {},
        campaign: { cleared: { story: {}, hard: {}, hell: {} } },
    });
    pr.wallet.gold = 7;
    const before = structuredClone(pr);
    assert.equal(C.ensureCampaign(pr, 123), pr);
    assert.deepEqual(pr, before);
    const partial = C.ensureCampaign({ wallet: { gold: 7 }, campaign: { cleared: { story: { 'c1-01': true } } } }, 0);
    assert.equal(partial.wallet.diamond, 100);
    assert.equal(partial.campaign.cleared.story['c1-01'], true);
    assert.deepEqual(partial.campaign.cleared.hard, {});
});
test('mở Cốt truyện, Khó, Địa ngục theo tiến trình', () => {
    const pr = fresh();
    assert.equal(C.isUnlocked(pr, 'c1-01', 'story').ok, true);
    assert.equal(C.isUnlocked(pr, 'c1-02', 'story').ok, false);
    clear(pr, 'story', 3);
    assert.equal(C.isUnlocked(pr, 'c1-03', 'hard').ok, false);
    clear(pr, 'story', 4);
    assert.equal(C.isUnlocked(pr, 'c1-03', 'hard').ok, true);
    assert.equal(C.isUnlocked(pr, 'c1-05', 'hard').ok, false);
    clear(pr, 'hard', 19);
    assert.equal(C.isUnlocked(pr, 'c1-01', 'hell').ok, false);
    clear(pr, 'hard', 20);
    assert.equal(C.isUnlocked(pr, 'c1-01', 'hell').ok, true);
});
test('nhánh cần cờ; N5 cần qua ải 18', () => {
    const pr = fresh();
    assert.equal(C.isUnlocked(pr, 'c1-n1', 'story').ok, false);
    pr.flags.gieng_co = true;
    assert.equal(C.isUnlocked(pr, 'c1-n1', 'story').ok, true);
    pr.flags.loi_vao_ham_mo = true;
    assert.equal(C.isUnlocked(pr, 'c1-n5', 'story').ok, false);
    clear(pr, 'story', 18);
    assert.equal(C.isUnlocked(pr, 'c1-n5', 'story').ok, true);
    assert.equal(C.isUnlocked(pr, 'c1-n1', 'hard').ok, false);
    pr.campaign.cleared.story['c1-n1'] = true;
    assert.equal(C.isUnlocked(pr, 'c1-n1', 'hard').ok, true);
});
test('kiểm tra đội và thể lực không trừ điểm', () => {
    const pr = fresh();
    const start = classes => C.canStart(pr, { id: 'c1-01', diff: 'story', classes }, 0);
    for (const classes of [undefined, [], ['archer'], Array(5).fill('warrior')]) assert.equal(start(classes).ok, false);
    pr.stamina.value = 3;
    assert.equal(start(['warrior']).ok, false);
    assert.equal(pr.stamina.value, 3);
    assert.deepEqual(C.canStart(pr, { id: 'c1-01', diff: 'story', classes: ['warrior'] }, 300000), { ok: true });
    assert.equal(pr.stamina.value, 4);
    assert.equal(C.canStart(pr, { id: 'missing', diff: 'story', classes: [] }, 0).why, 'Ải không tồn tại');
    assert.equal(C.canStart(pr, { id: 'c1-01', diff: 'invalid', classes: ['warrior'] }, 0).ok, false);
});
test('trạng thái và tính năng theo mốc', () => {
    const pr = fresh();
    assert.deepEqual([...C.features(pr)], ['command']);
    let state = C.chapterState(pr);
    assert.equal(state.stages.length, 20);
    assert.equal(state.branches.length, 5);
    assert.deepEqual(state.stages[0].status, { story: 'open', hard: 'locked', hell: 'locked' });
    clear(pr, 'story', 10);
    assert.deepEqual([...C.features(pr)], ['command', 'orb', 'auto', 'hard', 'gear', 'forge']);
    state = C.chapterState(pr);
    assert.equal(state.stages[0].status.story, 'cleared');
    assert.equal(state.stages[10].status.story, 'open');
    clear(pr, 'story', 20);
    clear(pr, 'hard', 20);
    for (const key of ['setDungeon', 'jewelDungeon', 'hell', 'heroShop']) assert.ok(C.features(pr).has(key));
    assert.equal(C.findStage('missing'), null);
    assert.equal(C.findStage('c1-n1').flag, 'gieng_co');
});
test('hệ số độ khó và máu trùm', () => {
    assert.deepEqual(C.DIFFS, ['story', 'hard', 'hell']);
    assert.deepEqual(C.DIFF, {
        story: { lv: 0, mul: 1, exp: 1, stone: 1, dia: 1 },
        hard: { lv: 5, mul: 1.25, exp: 1.5, stone: 2, dia: 1 },
        hell: { lv: 10, mul: 1.6, exp: 2, stone: 3, dia: 2 },
    });
    assert.deepEqual(C.BOSS_HP, { 0: 1, 1: 2, 2: 3, 3: 4 });
});
