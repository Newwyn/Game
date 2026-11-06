const test = require('node:test');
const assert = require('node:assert/strict');
const Wd = require('../game/world');
const C = require('../game/campaign');

const fresh = () => { const pr = C.ensureCampaign({}, 0); Wd.ensureWorld(pr); return pr; };
const clear = (pr, n) => { for (let i = 1; i <= n; i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2, '0')}`] = true; };
const wallet = (pr) => pr.wallet;

test('save cũ được bổ sung trạng thái thế giới', () => {
    const pr = { flags: { x: true } };
    Wd.ensureWorld(pr);
    assert.equal(pr.world.scene, 'village_square');
    assert.deepEqual(pr.world.opened, {});
    assert.equal(pr.flags.x, true);
});

test('dữ liệu màn: cổng 2 chiều trỏ đúng màn, toạ độ nằm trong màn', () => {
    for (const [id, s] of Object.entries(Wd.SCENES)) {
        assert.ok(Wd.AREAS[s.area], id);
        for (const p of s.portals) {
            const to = Wd.SCENES[p.to];
            assert.ok(to, `${id} -> ${p.to}`);
            assert.ok(p.toX >= 0 && p.toX <= to.width);
            assert.ok(to.portals.some(b => b.to === id), `${p.to} thiếu cổng về ${id}`);
        }
        for (const o of [...s.objects, ...s.npcs]) assert.ok(o.x >= 0 && o.x <= s.width, `${id}.${o.id}`);
        for (const n of s.npcs) assert.ok(Wd.NPCS[n.id], n.id);
    }
});

test('khu vực mở theo ải: đường sau ải 10, kinh thành sau ải 12', () => {
    const pr = fresh();
    assert.equal(Wd.sceneOpen(pr, 'outskirts_mine'), true);
    assert.equal(Wd.sceneOpen(pr, 'road_bridge'), false);
    assert.equal(Wd.move(pr, 'road_bridge', 100).ok, false);
    clear(pr, 10);
    assert.equal(Wd.move(pr, 'road_bridge', 99999).ok, true);
    assert.equal(pr.world.x, 2000);
    assert.equal(Wd.sceneOpen(pr, 'capital_gate'), false);
    clear(pr, 12);
    assert.equal(Wd.sceneOpen(pr, 'capital_gate'), true);
    assert.equal(Wd.move(pr, 'khong_co', 1).ok, false);
});

test('rương chỉ mở 1 lần, cộng thưởng vào ví', () => {
    const pr = fresh();
    const r = Wd.interact(pr, wallet(pr), 'village_square', 'sq_chest');
    assert.equal(r.ok, true);
    assert.equal(pr.wallet.gold, 500 + 300);
    assert.equal(Wd.interact(pr, wallet(pr), 'village_square', 'sq_chest').ok, false);
    assert.equal(pr.wallet.gold, 800);
});

test('mỏ đá: đào được đá, hồi sau 4 giờ', () => {
    const pr = fresh();
    const r = Wd.interact(pr, wallet(pr), 'outskirts_mine', 'mine', {}, 1000, () => 0);
    assert.equal(r.ok, true);
    assert.equal(pr.wallet.stone, 3);
    const again = Wd.interact(pr, wallet(pr), 'outskirts_mine', 'mine', {}, 1000 + 60000, () => 0);
    assert.equal(again.ok, false);
    assert.match(again.why, /phút/);
    clear(pr, 10);
    assert.equal(Wd.interact(pr, wallet(pr), 'outskirts_mine', 'mine', {}, 1000 + Wd.MINE_COOLDOWN, () => 0.99).ok, true);
    assert.equal(pr.wallet.stone, 3 + 5 + 3);
});

test('nhiệm vụ Borin: khoá trước ải 4, nhận, nhặt búa, trả -> cờ nhánh N2', () => {
    const pr = fresh();
    assert.equal(Wd.npcDialog(pr, 'borin').quest, undefined);
    assert.equal(Wd.interact(pr, wallet(pr), 'outskirts_mine', 'hammer').ok, false);   // chưa nhận
    clear(pr, 4);
    assert.equal(Wd.npcDialog(pr, 'borin').quest, 'offer');
    Wd.interact(pr, wallet(pr), 'village_street', 'borin');
    assert.equal(pr.world.quests.borin, 'active');
    assert.equal(Wd.interact(pr, wallet(pr), 'village_street', 'borin').flag, undefined);   // chưa có búa
    assert.equal(Wd.interact(pr, wallet(pr), 'outskirts_mine', 'hammer').ok, true);
    assert.equal(Wd.interact(pr, wallet(pr), 'outskirts_mine', 'hammer').ok, false);   // nhặt rồi
    const done = Wd.interact(pr, wallet(pr), 'village_street', 'borin');
    assert.equal(done.flag, 'bua_borin');
    assert.equal(pr.flags.bua_borin, true);
    assert.equal(pr.wallet.gold, 1000);
    assert.equal(C.isUnlocked(pr, 'c1-n2', 'story').ok, true);
    assert.equal(Wd.npcDialog(pr, 'borin').quest, 'done');
});

test('nhiệm vụ Lena cần đủ 2 nguyên liệu', () => {
    const pr = fresh();
    clear(pr, 3);
    Wd.interact(pr, wallet(pr), 'village_street', 'lena');
    Wd.interact(pr, wallet(pr), 'outskirts_field', 'wheat');
    assert.equal(Wd.npcDialog(pr, 'lena').quest, 'active');
    Wd.interact(pr, wallet(pr), 'outskirts_forest', 'mushroom');
    assert.equal(Wd.interact(pr, wallet(pr), 'village_street', 'lena').flag, 'nguyen_lieu_lena');
    assert.deepEqual(pr.world.bag, {});
});

test('câu đố Giếng Cổ: sai thì từ chối, đúng thứ tự đồng dao thì mở N1 (1 lần)', () => {
    const pr = fresh();
    assert.equal(Wd.interact(pr, wallet(pr), 'village_well', 'well').puzzle, 'well');
    assert.equal(Wd.interact(pr, wallet(pr), 'village_well', 'well', { answer: ['🌙', '☀️', '⭐', '💧'] }).ok, false);
    assert.equal(Wd.interact(pr, wallet(pr), 'village_well', 'well', { answer: ['☀️'] }).ok, false);
    assert.equal(pr.flags.gieng_co, undefined);
    const r = Wd.interact(pr, wallet(pr), 'village_well', 'well', { answer: Wd.WELL_ANSWER });
    assert.equal(r.flag, 'gieng_co');
    assert.equal(pr.wallet.diamond, 130);
    assert.equal(Wd.interact(pr, wallet(pr), 'village_well', 'well', { answer: Wd.WELL_ANSWER }).ok, false);
});

test('trang sách (sau ải 16) và hầm mộ (sau ải 18)', () => {
    const pr = fresh();
    clear(pr, 12);
    assert.equal(Wd.interact(pr, wallet(pr), 'capital_library', 'pages').ok, false);
    assert.equal(Wd.interact(pr, wallet(pr), 'capital_castle', 'crypt').ok, false);
    clear(pr, 18);
    assert.equal(Wd.interact(pr, wallet(pr), 'capital_library', 'pages', { answer: ['II', 'I', 'III', 'IV'] }).ok, false);
    assert.equal(Wd.interact(pr, wallet(pr), 'capital_library', 'pages', { answer: Wd.PAGES }).flag, 'trang_sach');
    assert.equal(Wd.interact(pr, wallet(pr), 'capital_castle', 'crypt').flag, 'loi_vao_ham_mo');
    assert.equal(C.isUnlocked(pr, 'c1-n5', 'story').ok, true);
});

test('trạng thái gửi client: dấu ! / ? trên NPC, vật nhiệm vụ chỉ hiện khi đang làm', () => {
    const pr = fresh();
    clear(pr, 4);
    let st = Wd.worldState(pr, 0);
    assert.equal(st.scenes.village_street.npcs.find(n => n.id === 'borin').mark, '!');
    assert.equal(st.scenes.outskirts_mine.objects.find(o => o.id === 'hammer').state, 'hidden');
    assert.equal(st.scenes.road_bridge.open, false);
    Wd.interact(pr, wallet(pr), 'village_street', 'borin');
    Wd.interact(pr, wallet(pr), 'outskirts_mine', 'hammer');
    st = Wd.worldState(pr, 0);
    assert.equal(st.scenes.village_street.npcs.find(n => n.id === 'borin').mark, '?');
    assert.deepEqual(st.bag.map(b => b.id), ['hammer']);
    pr.world.scene = 'capital_gate';   // màn chưa mở -> về quảng trường
    assert.equal(Wd.worldState(pr, 0).scene, 'village_square');
});
