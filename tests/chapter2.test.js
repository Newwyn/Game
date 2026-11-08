// Chương 2 — vùng Elf: mở chương, ải, gia nhập, nhánh, việc / câu đố ngoài bản đồ
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../game/campaign');
const CH2 = require('../game/chapter2');
const Wd = require('../game/world');
const S = require('../game/story');

const P = { addExp: () => 0 };
const fresh = () => { const pr = C.ensureCampaign({}, 0); Wd.ensureWorld(pr); return pr; };
const clear1 = (pr, n = 20) => { for (let i = 1; i <= n; i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2, '0')}`] = true; };
const clear2 = (pr, n) => { for (let i = 1; i <= n; i++) pr.campaign.cleared.story[`c2-${String(i).padStart(2, '0')}`] = true; };

test('chương 2: 20 ải cấp 21–40, 4 trùm, 4 nhánh, mỗi ải 3 quái có thật', () => {
    assert.equal(CH2.stages.length, 20);
    assert.deepEqual(CH2.stages.map(s => s.level), Array.from({ length: 20 }, (_, i) => 21 + i));
    assert.deepEqual(CH2.stages.filter(s => s.boss).map(s => s.no), [5, 10, 15, 20]);
    for (const s of CH2.stages) assert.equal(s.enemies[0].classId.startsWith('b_'), !!s.boss, `${s.id}: ải trùm phải có trùm đứng đầu`);
    assert.equal(CH2.branches.length, 4);
    for (const s of [...CH2.stages, ...CH2.branches]) assert.equal(s.enemies.length, 3, s.id);
    assert.deepEqual(CH2.parts.map(p => p.key), ['sylvaren', 'cau', 'lunaria']);
});

test('chương 2 chỉ mở khi qua ải 20 chương 1; ải trong chương mở lần lượt', () => {
    const pr = fresh();
    assert.equal(C.isUnlocked(pr, 'c2-01', 'story').ok, false);
    clear1(pr, 19);
    assert.equal(C.isUnlocked(pr, 'c2-01', 'story').ok, false);
    clear1(pr);
    assert.equal(C.isUnlocked(pr, 'c2-01', 'story').ok, true);
    assert.equal(C.isUnlocked(pr, 'c2-02', 'story').ok, false);
    clear2(pr, 1);
    assert.equal(C.isUnlocked(pr, 'c2-02', 'story').ok, true);
    const st = C.chapterState(pr, 'c2');
    assert.equal(st.id, 'c2');
    assert.deepEqual(st.chapters.map(c => [c.id, c.open]), [['c1', true], ['c2', true]]);
    assert.equal(C.chapterState(fresh(), 'c2').id, 'c1');   // chưa mở -> vẫn xem chương 1
});

test('Nerissa (ải 7), Sylva (ải 12), Elarion (ải 18) gia nhập; thưởng theo cấp ải', () => {
    const pr = fresh(); clear1(pr); clear2(pr, 6);
    const r = C.applyResult(pr, { id: 'c2-07', diff: 'story', classes: ['warrior'], win: true }, P, 0);
    assert.deepEqual(r.newHeroes, ['dancer']);
    assert.ok(r.rewards.exp > C.rewardsFor('c1-20', 'story', false).exp);
    for (const [no, hero] of [[12, 'summoner'], [18, 'elementalist']]) {
        assert.ok(CH2.stages[no - 1].joins.includes(hero));
        assert.ok(CH2.stages[no - 1].guests.includes(hero));
    }
});

test('lời thoại trước / sau 20 ải + kết chương 2', () => {
    for (let n = 1; n <= 20; n++) {
        const id = `c2-${String(n).padStart(2, '0')}`;
        assert.ok(S.preFor(id)?.length, id);
        assert.ok(S.postFor(id)?.length, id);
        for (const [who] of [...S.preFor(id), ...S.postFor(id)]) assert.ok(S.SPEAKERS[who], `${id}: ${who}`);
    }
    assert.ok(S.endingFor('c2-20').length);
    assert.equal(S.endingFor('c2-19'), null);
});

test('vùng Elf: mở sau ải 20; việc Aeris / Oren, Suối Trăng, Gốc Cây Mẹ mở 4 nhánh', () => {
    const pr = fresh();
    assert.equal(Wd.sceneOpen(pr, 'sylvaren'), false);
    clear1(pr);
    assert.equal(Wd.sceneOpen(pr, 'sylvaren'), true);
    // Aeris: sau ải 4 chương 2
    assert.equal(Wd.npcDialog(pr, 'aeris').quest, undefined);
    clear2(pr, 4);
    assert.equal(Wd.npcDialog(pr, 'aeris').quest, 'offer');
    Wd.interact(pr, pr.wallet, 'sylvaren', 'aeris');
    assert.equal(Wd.interact(pr, pr.wallet, 'sylvaren', 'shroom_glow').ok, true);
    assert.equal(Wd.interact(pr, pr.wallet, 'sylvaren', 'aeris').flag, 'nam_phat_quang');
    assert.equal(C.isUnlocked(pr, 'c2-n2', 'story').ok, true);
    // Suối Trăng: sau ải 6
    assert.equal(Wd.interact(pr, pr.wallet, 'sylvaren', 'moonwell').ok, false);
    clear2(pr, 6);
    assert.equal(Wd.interact(pr, pr.wallet, 'sylvaren', 'moonwell').puzzle, 'moon');
    assert.equal(Wd.interact(pr, pr.wallet, 'sylvaren', 'moonwell', { answer: ['🌕', '🌓', '🌒', '🌑'] }).ok, false);
    assert.equal(Wd.interact(pr, pr.wallet, 'sylvaren', 'moonwell', { answer: Wd.MOON_ANSWER }).flag, 'suoi_trang');
    assert.equal(C.isUnlocked(pr, 'c2-n1', 'story').ok, true);
    // Oren: sau ải 14 · Gốc Cây Mẹ: sau ải 19
    clear2(pr, 14);
    Wd.interact(pr, pr.wallet, 'lunaria', 'oren');
    Wd.interact(pr, pr.wallet, 'lunaria', 'star_tome');
    assert.equal(Wd.interact(pr, pr.wallet, 'lunaria', 'oren').flag, 'lang_elf_co');
    assert.equal(Wd.interact(pr, pr.wallet, 'lunaria', 'moon_fountain').ok, false);
    clear2(pr, 19);
    assert.equal(Wd.interact(pr, pr.wallet, 'lunaria', 'moon_fountain').flag, 'goc_cay_me');
    assert.equal(C.isUnlocked(pr, 'c2-n4', 'story').ok, true);
});
