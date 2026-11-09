const test = require('node:test');
const assert = require('node:assert/strict');
const Wd = require('../game/world');
const C = require('../game/campaign');

const fresh = () => { const pr = C.ensureCampaign({}, 0); Wd.ensureWorld(pr); return pr; };
const clear = (pr, n) => { for (let i = 1; i <= n; i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2, '0')}`] = true; Wd.syncReports(pr); };   // coi như đã về báo lại sau mỗi ải
const wallet = (pr) => pr.wallet;
const quest = (pr, id) => Wd.questLog(pr).find(q => q.id === id);

test('quest log: fresh and legacy saves are read without mutation', () => {
    for (const pr of [{}, fresh()]) {
        const before = structuredClone(pr);
        const log = Wd.questLog(pr);
        assert.deepEqual(pr, before);
        assert.equal(log.length, 7);
        assert.equal(log[0].id, 'main');
        assert.match(log[0].title, /Ải 1: Cánh cổng chưa được phép đóng/);
        assert.deepEqual(log[0].target, { scene: 'ashford', kind: 'npc', id: 'rok' });   // điểm truyện ải 1: gặp Rok
        assert.ok(log.slice(1).every(q => q.state === 'locked' && q.target === null && q.needNo > 0));
    }
    const pr = fresh();
    assert.deepEqual(Wd.worldState(pr, 0).quests, Wd.questLog(pr));
});

test('quest log: ambush (ải 2) rồi Sera chỉ xuất hiện khi được cứu (ải 7) — việc thuốc cho nhà cứu tế', () => {
    const pr = fresh();
    clear(pr, 1);
    assert.deepEqual(quest(pr, 'main').target, { scene: 'outskirts', kind: 'obj', id: 'ambush' });
    clear(pr, 6);
    const giver = { scene: 'ashford', kind: 'npc', id: 'sera' };
    assert.equal(quest(pr, 'sera').state, 'locked');   // Sera còn bị giam
    assert.equal(Wd.worldState(pr, 0).scenes.ashford.npcs.find(n => n.id === 'sera').hidden, true);
    assert.deepEqual(quest(pr, 'main').target, { scene: 'forest', kind: 'obj', id: 'sp_swamp' });   // ải 7: lối mòn vào đầm lầy (hoặc Bảng ải)
    clear(pr, 7);
    assert.equal(Wd.worldState(pr, 0).scenes.ashford.npcs.find(n => n.id === 'sera').hidden, false);
    assert.equal(quest(pr, 'sera').state, 'offered');
    assert.deepEqual(quest(pr, 'sera').target, giver);
    Wd.interact(pr, wallet(pr), 'ashford', 'sera');
    assert.equal(quest(pr, 'sera').state, 'active');
    assert.deepEqual(quest(pr, 'sera').target, { scene: 'forest', kind: 'obj', id: 'herb' });
    Wd.interact(pr, wallet(pr), 'forest', 'herb');
    assert.deepEqual(quest(pr, 'sera').target, giver);
    assert.match(quest(pr, 'sera').obj, /Mang Thảo dược/);
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'sera').flag, 'thao_duoc_sera');
    assert.equal(quest(pr, 'sera').state, 'done');
});

test('quest log: Lena targets the remaining item, then her NPC; Borin targets the hammer', () => {
    const pr = fresh();
    clear(pr, 10);
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
        ['well', 7, 'gieng_co', 'ashford', 'N1'],        // sau khi Sera về làng
        ['pages', 20, 'trang_sach', 'capital', 'N4'],    // sau khi kinh thành an toàn
        ['crypt', 20, 'loi_vao_ham_mo', 'capital', 'N5'],   // sau lễ tang nhà vua
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
            if (n >= 2 && n < 20) {   // chính tuyến chỉ tới điểm truyện của ải kế tiếp (Bảng ải chỉ để đánh lại)
                const sp = Wd.STORY_SPOTS[n + 1];
                assert.deepEqual(log[0].target, sp.npc ? { scene: sp.scene, kind: 'npc', id: sp.npc } : { scene: sp.scene, kind: 'obj', id: sp.obj });
                assert.equal(log[0].obj, sp.go);   // ải này chỉ bắt đầu từ bản đồ — không nhắc Bảng ải
            }
            if (n === 20) {   // xong chương 1 -> nhiệm vụ chính chuyển sang chương 2
                assert.equal(log[0].state, 'active');
                assert.equal(log[0].title, 'Chương 2 · Ải 1: Biên giới sương bạc');
                assert.equal(log[0].target, null);   // rừng chưa có Bảng ải -> hướng dẫn dùng 📖 Chọn ải, không bắt về kinh thành
                assert.match(log[0].obj, /Chọn ải/);
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
    assert.equal(Wd.EVENT_STAGE.jess, 'c1-02');
    for (let n = 1; n <= 20; n++) assert.equal(Wd.EVENT_STAGE[`s${n}`], `c1-${String(n).padStart(2, '0')}`);
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

test('việc Borin / Lena mở nhánh N2 / N3', () => {
    const pr = fresh();
    clear(pr, 4);
    Wd.interact(pr, wallet(pr), 'ashford', 'borin');
    Wd.interact(pr, wallet(pr), 'outskirts', 'hammer');
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'borin').flag, 'bua_borin');
    assert.equal(C.isUnlocked(pr, 'c1-n2', 'story').ok, true);
    assert.equal(Wd.npcDialog(pr, 'lena').quest, undefined);   // bữa ăn của Lena: sau trận Skarn (ải 10)
    clear(pr, 10);
    Wd.interact(pr, wallet(pr), 'ashford', 'lena');
    Wd.interact(pr, wallet(pr), 'outskirts', 'wheat');
    assert.equal(Wd.npcDialog(pr, 'lena').quest, 'active');
    Wd.interact(pr, wallet(pr), 'forest', 'mushroom');
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'lena').flag, 'nguyen_lieu_lena');
});

test('câu đố Giếng Cổ, trang sách, hầm mộ', () => {
    const pr = fresh();
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'well').ok, false);   // giếng: sau khi Sera về làng (ải 7)
    clear(pr, 7);
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'well').puzzle, 'well');
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'well', { answer: ['🌙', '☀️', '⭐', '💧'] }).ok, false);
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'well', { answer: Wd.WELL_ANSWER }).flag, 'gieng_co');
    clear(pr, 20);
    assert.equal(Wd.interact(pr, wallet(pr), 'capital', 'pages', { answer: Wd.PAGES }).flag, 'trang_sach');
    assert.equal(Wd.interact(pr, wallet(pr), 'capital', 'crypt').flag, 'loi_vao_ham_mo');
    assert.equal(C.isUnlocked(pr, 'c1-n5', 'story').ok, true);
});

test('Lunaria mở sau ải 12 chương 2 (qua Cầu Rễ), báo đúng mốc', () => {
    const pr = fresh();
    clear(pr, 20);
    let ws = Wd.worldState(pr, 0);
    assert.equal(ws.scenes.sylvaren.open, true);
    assert.equal(ws.scenes.lunaria.open, false);
    assert.equal(ws.scenes.lunaria.needText, 'ải 12 chương 2');
    for (let n = 1; n <= 12; n++) pr.campaign.cleared.story[`c2-${String(n).padStart(2, '0')}`] = true;
    ws = Wd.worldState(pr, 0);
    assert.equal(ws.scenes.lunaria.open, true);
});

test('điểm truyện: NPC / vật mở đúng ải kế tiếp; điều tra cho chứng cứ; đối chất trước ải 18', () => {
    const E = require('../game/evidence');
    const pr = fresh();
    assert.equal(Wd.interact(pr, wallet(pr), 'ashford', 'rok').startStage, 'c1-01');   // ải 1: gặp Rok
    clear(pr, 2);
    assert.equal(Wd.worldState(pr, 0).scenes.forest.objects.find(o => o.id === 'sp_bandage').state, 'ready');
    assert.equal(Wd.interact(pr, wallet(pr), 'forest', 'sp_bandage').startStage, 'c1-03');
    assert.equal(Wd.interact(pr, wallet(pr), 'forest', 'sp_wolf').ok, false);   // chưa tới ải 5
    clear(pr, 3);
    assert.equal(Wd.worldState(pr, 0).scenes.forest.objects.find(o => o.id === 'sp_bandage').state, 'hidden');
    const c = Wd.interact(pr, wallet(pr), 'forest', 'clue_wheel');
    assert.equal(c.evidence, 'cart_tracks');
    assert.equal(Wd.interact(pr, wallet(pr), 'forest', 'clue_wheel').ok, false);
    assert.equal(Wd.worldState(pr, 0).evidence.count, 1);
    clear(pr, 17);
    for (const id of ['lot_numbers', 'withdraw_order', 'target_board', 'grain_transfer']) pr.evidence[id] = true;
    const t = Wd.interact(pr, wallet(pr), 'capital', 'elise');
    assert.ok(t.present && t.present.questions.length === 4);
    const before = pr.wallet.diamond;
    const r = Wd.presentTrial(pr, pr.wallet, { q1: 'lot_numbers', q2: 'withdraw_order', q3: 'target_board', q4: 'grain_transfer' });
    assert.equal(r.result.correct, 4);
    assert.equal(r.startStage, 'c1-18');
    assert.equal(pr.wallet.diamond, before + 4 * E.TRIAL_REWARD.diamond);
    assert.equal(Wd.interact(pr, wallet(pr), 'capital', 'elise').startStage, 'c1-18');   // đã đối chất: Elise đưa thẳng vào ải
    const again = Wd.presentTrial(pr, pr.wallet, {});
    assert.equal(again.rewards.diamond ?? 0, 0);   // thưởng chỉ lần đầu
});

test('về báo lại sau trận: phần lời ở nơi khác chuyển sang NPC ngoài bản đồ, báo xong mới mở ải kế tiếp', () => {
    const S = require('../game/story');
    const pr = fresh();
    clear(pr, 0);
    pr.campaign.cleared.story['c1-01'] = true;   // vừa thắng ải 1, chưa về làng
    assert.equal(Wd.pendingReport(pr), 1);
    assert.deepEqual(Wd.postNow(1, S.post[1]), S.post[1].slice(0, 4));   // tại cổng làng: chỉ lời của Rok
    const mira = Wd.worldState(pr).scenes.ashford.npcs.find(n => n.id === 'mira');
    assert.equal(mira.mark, '!');
    const log = Wd.questLog(pr);
    assert.deepEqual(log[0].target, { scene: 'ashford', kind: 'npc', id: 'mira' });
    assert.equal(Wd.worldState(pr).scenes.outskirts.objects.find(o => o.id === 'ambush').state, 'later');   // ải 2 chưa tới lúc
    const r = Wd.interact(pr, pr.wallet, 'ashford', 'mira');
    assert.equal(r.ok, true);
    assert.deepEqual(r.lines, S.post[1].slice(4).map(l => [...l]));
    assert.equal(Wd.pendingReport(pr), null);
    assert.equal(Wd.worldState(pr).scenes.outskirts.objects.find(o => o.id === 'ambush').state, 'ready');
});

test('kết chương 1: thắng Valdric -> về cung gặp Elise, cắt cảnh phòng bệnh nhà vua rồi lễ đăng quang', () => {
    const S = require('../game/story');
    const pr = fresh();
    clear(pr, 19);
    pr.campaign.cleared.story['c1-20'] = true;
    assert.equal(Wd.pendingReport(pr), 20);
    assert.equal(Wd.questLog(pr)[0].title, 'Chương 1 · Hồi kết');
    const r = Wd.interact(pr, pr.wallet, 'capital', 'elise');
    assert.deepEqual(r.lines, S.ending.map(l => [...l]));
    assert.deepEqual(r.cutscene.map(c => c[0]), ['king_bedroom', 'capital_castle']);
    assert.match(r.lines[r.cutscene[1][1]][1], /lên ngôi/);
    assert.equal(Wd.pendingReport(pr), null);
});

test('save cũ đã qua nhiều ải: không bắt quay lại báo các ải cũ', () => {
    const C = require('../game/campaign');
    const pr = C.ensureCampaign({}, 0);
    for (let i = 1; i <= 12; i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2, '0')}`] = true;
    Wd.ensureWorld(pr);
    assert.equal(Wd.pendingReport(pr), null);
});
