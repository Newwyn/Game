const test = require('node:test');
const assert = require('node:assert/strict');
const Wd = require('../game/world');
const C = require('../game/campaign');

const fresh = () => { const pr = C.ensureCampaign({}, 0); Wd.ensureWorld(pr); return pr; };
const clear = (pr, n) => { for (let i = 1; i <= n; i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2, '0')}`] = true; };
const wallet = (pr) => pr.wallet;
const quest = (pr, id) => Wd.questLog(pr).find(q => q.id === id);

test('quest log: fresh and legacy saves are read without mutation', () => {
    for (const pr of [{}, fresh()]) {
        const before = structuredClone(pr);
        const log = Wd.questLog(pr);
        assert.deepEqual(pr, before);
        assert.equal(log.length, 7);
        assert.equal(log[0].id, 'main');
        assert.match(log[0].title, /Ải 1: Đêm ở cổng làng/);
        assert.deepEqual(log[0].target, { scene: 'ashford', kind: 'obj', id: 'board' });
        assert.ok(log.slice(1).every(q => q.state === 'locked' && q.target === null && q.needNo > 0));
    }
    const pr = fresh();
    assert.deepEqual(Wd.worldState(pr, 0).quests, Wd.questLog(pr));
});

test('quest log: ambush, herb collection, turn-in and escort', () => {
    const pr = fresh();
    clear(pr, 1);
    assert.deepEqual(quest(pr, 'main').target, { scene: 'outskirts', kind: 'obj', id: 'ambush' });
    clear(pr, 2);
    const giver = { scene: 'ashford', kind: 'npc', id: 'sera' };
    assert.equal(quest(pr, 'sera').state, 'offered');
    assert.deepEqual(quest(pr, 'sera').target, giver);
    assert.deepEqual(quest(pr, 'main').target, giver);
    assert.match(quest(pr, 'main').obj, /Giúp Seraphine/);
    Wd.interact(pr, wallet(pr), 'ashford', 'sera');
    assert.equal(quest(pr, 'sera').state, 'active');
    assert.deepEqual(quest(pr, 'sera').progress, { have: 0, need: 1 });
    assert.deepEqual(quest(pr, 'sera').target, { scene: 'forest', kind: 'obj', id: 'herb' });
    assert.deepEqual(quest(pr, 'main').target, quest(pr, 'sera').target);
    Wd.interact(pr, wallet(pr), 'forest', 'herb');
    assert.deepEqual(quest(pr, 'sera').progress, { have: 1, need: 1 });
    assert.deepEqual(quest(pr, 'sera').target, giver);
    assert.match(quest(pr, 'sera').obj, /Mang Thảo dược/);
    Wd.interact(pr, wallet(pr), 'ashford', 'sera');
    assert.equal(quest(pr, 'sera').state, 'done');
    assert.equal(quest(pr, 'sera').target, null);
    assert.deepEqual(quest(pr, 'main').target, giver);
    assert.match(quest(pr, 'main').obj, /hộ tống/);
});

test('quest log: Lena targets the remaining item, then her NPC; Borin targets the hammer', () => {
    const pr = fresh();
    clear(pr, 4);
    pr.world.quests.lena = 'active';
    for (const [held, missing, scene] of [['wheat', 'mushroom', 'forest'], ['mushroom', 'wheat', 'outskirts']]) {
        pr.world.bag = { [held]: true };
        assert.deepEqual(quest(pr, 'lena').progress, { have: 1, need: 2 });
        assert.deepEqual(quest(pr, 'lena').target, { scene, kind: 'obj', id: missing });
    }
    pr.world.bag = { wheat: true, mushroom: true };
    assert.deepEqual(quest(pr, 'lena').target, { scene: 'ashford', kind: 'npc', id: 'lena' });
    assert.match(quest(pr, 'lena').obj, /Mang Lúa mì vàng, Nấm sương/);
    assert.match(quest(pr, 'lena').reward, /300 Vàng.*10 Kim Cương.*N3/);
    pr.world.quests.borin = 'active';
    assert.deepEqual(quest(pr, 'borin').target, { scene: 'outskirts', kind: 'obj', id: 'hammer' });
});

test('quest log: secrets unlock at their story thresholds and finish via flags', () => {
    for (const [id, n, flag, scene, branch] of [
        ['well', 1, 'gieng_co', 'ashford', 'N1'],
        ['pages', 16, 'trang_sach', 'capital', 'N4'],
        ['crypt', 18, 'loi_vao_ham_mo', 'capital', 'N5'],
    ]) {
        const pr = fresh();
        clear(pr, n - 1);
        assert.equal(quest(pr, id).state, 'locked');
        assert.equal(quest(pr, id).needNo, n);
        assert.equal(quest(pr, id).target, null);
        clear(pr, n);
        assert.equal(quest(pr, id).state, 'active');
        assert.equal(quest(pr, id).needNo, null);
        assert.deepEqual(quest(pr, id).target, { scene, kind: 'obj', id });
        assert.ok(quest(pr, id).reward.includes(branch));
        pr.flags[flag] = true;
        assert.equal(quest(pr, id).state, 'done');
        assert.equal(quest(pr, id).target, null);
    }
    assert.ok(quest(fresh(), 'well').desc.includes(Wd.RHYME));
});

test('quest log: every story stage, target, shape and side ordering is valid', () => {
    const stages = require('../game/chapter1').stages;
    const rank = { active: 0, offered: 1, locked: 2, done: 3 };
    const keys = ['id', 'type', 'title', 'giver', 'desc', 'state', 'obj', 'progress', 'target', 'reward', 'needNo'].sort();
    for (let n = 0; n <= 20; n++) {
        const pr = fresh();
        clear(pr, n);
        for (const state of [undefined, 'active', 'done']) {
            pr.world.quests = { sera: state, lena: state, borin: state };
            const before = structuredClone(pr);
            const log = Wd.questLog(pr);
            assert.deepEqual(pr, before);
            assert.equal(log.filter(q => q.type === 'main').length, 1);
            if (n < 20) assert.equal(log[0].title, `Chương 1 · Ải ${n + 1}: ${stages[n].name}`);
            if (n >= 3 && n < 20) assert.deepEqual(log[0].target,
                { scene: n >= 12 ? 'capital' : 'ashford', kind: 'obj', id: n >= 12 ? 'gate_board' : 'board' });
            if (n === 20) {   // xong chương 1 -> nhiệm vụ chính chuyển sang chương 2
                assert.equal(log[0].state, 'active');
                assert.equal(log[0].title, 'Chương 2 · Ải 1: Biên giới sương bạc');
                assert.deepEqual(log[0].target, { scene: 'capital', kind: 'obj', id: 'gate_board' });
            }
            const ranks = log.slice(1).map(q => rank[q.state]);
            assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
            for (const q of log) {
                assert.deepEqual(Object.keys(q).sort(), keys);
                if (!q.target) continue;
                const { scene, kind, id } = q.target;
                assert.ok(Wd.SCENES[scene]);
                assert.ok(kind === 'npc' ? Wd.SCENES[scene].npcs.includes(id) : Wd.SCENES[scene].objects.some(o => o.id === id));
            }
        }
    }
});

test('save cũ (màn ngang) được đưa về điểm đầu bản đồ mới', () => {
    const pr = { flags: { x: true }, world: { scene: 'village_square', x: 900 } };
    Wd.ensureWorld(pr);
    assert.equal(pr.world.scene, Wd.START.scene);
    assert.equal(pr.world.y, Wd.START.y);
    assert.deepEqual(pr.world.opened, {});
    assert.equal(pr.flags.x, true);
});

test('dữ liệu: NPC đều có hồ sơ, việc / sự kiện trỏ đúng', () => {
    for (const s of Object.values(Wd.SCENES)) {
        assert.ok(Wd.AREAS[s.area]);
        for (const n of s.npcs) assert.ok(Wd.NPCS[n], n);
    }
    assert.deepEqual(Wd.EVENT_STAGE, { jess: 'c1-02', sera: 'c1-03' });
});

test('hồ sơ nhân vật chính + xưng hô Nam / Nữ', () => {
    const pr = fresh();
    assert.equal(Wd.setPlayer(pr, { gender: 'x', name: 'An' }).ok, false);
    assert.equal(Wd.setPlayer(pr, { gender: 'm', name: 'A' }).ok, false);
    assert.equal(Wd.setPlayer(pr, { gender: 'f', name: '  Lyss<b>  ' }).ok, true);
    assert.deepEqual(pr.player, { gender: 'f', name: 'Lyssb' });
    assert.equal(Wd.fill('{Cau} ơi, {ten} là {chang} giỏi', pr.player), 'Cô ơi, Lyssb là cô gái giỏi');
    assert.equal(Wd.fill('{Cau} ơi {anh}', { gender: 'm', name: 'Kael' }), 'Cậu ơi anh');
    assert.equal(Wd.fill('{lạ}', null), '{lạ}');
});

test('khu vực mở theo ải: đường sau ải 10, kinh thành sau ải 12; lưu ô + hướng', () => {
    const pr = fresh();
    assert.equal(Wd.sceneOpen(pr, 'forest'), true);
    assert.equal(Wd.move(pr, 'road', 1, 1).ok, false);
    clear(pr, 10);
    assert.equal(Wd.move(pr, 'road', 5.4, 7.6, 'left').ok, true);
    assert.deepEqual([pr.world.x, pr.world.y, pr.world.face], [5, 8, 'left']);
    assert.equal(Wd.sceneOpen(pr, 'capital'), false);
    clear(pr, 12);
    assert.equal(Wd.sceneOpen(pr, 'capital'), true);
    assert.equal(Wd.move(pr, 'khong_co', 1, 1).ok, false);
});

test('rương 1 lần · mạch đá hồi 4 giờ', () => {
    const pr = fresh();
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'sq_chest').ok, true);
    assert.equal(pr.wallet.gold, 800);
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'sq_chest').ok, false);
    assert.equal(Wd.interact(pr, wallet(pr), 'outskirts', 'mine', {}, 1000, () => 0).ok, true);
    assert.equal(pr.wallet.stone, 3);
    assert.match(Wd.interact(pr, wallet(pr), 'outskirts', 'mine', {}, 61000, () => 0).why, /phút/);
});

test('sự kiện Jessica (ải 2): chưa qua ải 1 thì yên ắng, sau đó mở trận, xong thì hết', () => {
    const pr = fresh();
    assert.equal(Wd.interact(pr, wallet(pr), 'outskirts', 'ambush').ok, false);
    clear(pr, 1);
    const r = Wd.interact(pr, wallet(pr), 'outskirts', 'ambush');
    assert.equal(r.startStage, 'c1-02');
    assert.ok(r.lines.some(([who]) => who === 'stranger'));
    clear(pr, 2);
    assert.equal(Wd.interact(pr, wallet(pr), 'outskirts', 'ambush').ok, false);
    assert.equal(Wd.worldState(pr, 0).scenes.outskirts.npcs.find(n => n.id === 'jessica').hidden, false);
});

test('Seraphine: việc thảo dược sau ải 2 -> hộ tống vào rừng (ải 3)', () => {
    const pr = fresh();
    clear(pr, 2);
    assert.equal(Wd.npcDialog(pr, 'sera').quest, 'offer');
    Wd.interact(pr, wallet(pr), 'ashford', 'sera');
    assert.equal(Wd.interact(pr, wallet(pr), 'forest', 'herb').ok, true);
    const done = Wd.interact(pr, wallet(pr), 'ashford', 'sera');
    assert.equal(done.flag, 'thao_duoc_sera');
    const ev = Wd.interact(pr, wallet(pr), 'ashford', 'sera');
    assert.equal(ev.startStage, 'c1-03');
    clear(pr, 3);
    assert.equal(Wd.worldState(pr, 0).scenes.ashford.npcs.find(n => n.id === 'sera').hidden, true);   // đã vào đội
});

test('việc Borin / Lena mở nhánh N2 / N3', () => {
    const pr = fresh();
    clear(pr, 4);
    Wd.interact(pr, wallet(pr), 'ashford', 'borin');
    Wd.interact(pr, wallet(pr), 'outskirts', 'hammer');
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'borin').flag, 'bua_borin');
    assert.equal(C.isUnlocked(pr, 'c1-n2', 'story').ok, true);
    Wd.interact(pr, wallet(pr), 'ashford', 'lena');
    Wd.interact(pr, wallet(pr), 'outskirts', 'wheat');
    assert.equal(Wd.npcDialog(pr, 'lena').quest, 'active');
    Wd.interact(pr, wallet(pr), 'forest', 'mushroom');
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'lena').flag, 'nguyen_lieu_lena');
});

test('câu đố Giếng Cổ, trang sách, hầm mộ', () => {
    const pr = fresh();
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'well').puzzle, 'well');
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'well', { answer: ['🌙', '☀️', '⭐', '💧'] }).ok, false);
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'well', { answer: Wd.WELL_ANSWER }).flag, 'gieng_co');
    clear(pr, 18);
    assert.equal(Wd.interact(pr, wallet(pr), 'capital', 'pages', { answer: Wd.PAGES }).flag, 'trang_sach');
    assert.equal(Wd.interact(pr, wallet(pr), 'capital', 'crypt').flag, 'loi_vao_ham_mo');
    assert.equal(C.isUnlocked(pr, 'c1-n5', 'story').ok, true);
});
