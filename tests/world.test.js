const test = require('node:test');
const assert = require('node:assert/strict');
const Wd = require('../game/world');
const C = require('../game/campaign');

const fresh = () => { const pr = C.ensureCampaign({}, 0); Wd.ensureWorld(pr); return pr; };
const clear = (pr, n) => { for (let i = 1; i <= n; i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2, '0')}`] = true; };
const wallet = (pr) => pr.wallet;

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
