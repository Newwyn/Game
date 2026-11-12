// 📜 Bộ máy nhiệm vụ kiểu MMO (game/quests.js + game/questData1.js) nối với bản đồ (game/world.js)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const W = require('../game/world');
const C = require('../game/campaign');
const Q = require('../game/quests');
const QD = require('../game/questData1');
const P = require('../progression');

const NOW = new Date(2026, 10, 11, 12, 0, 0).getTime();   // 12:00 trưa 11/11/2026 (giờ máy)
const DAY = 24 * 3600e3;
const sid = (n) => `c1-${String(n).padStart(2, '0')}`;
const noDaily = (pr, now = NOW) => { pr.world.daily = { day: Q.dayKey(now), tasks: [], n: {}, seen: {}, got: {}, bonus: true }; };   // tắt việc hằng ngày để đếm thưởng cho gọn
const fresh = (daily = false) => { const pr = C.ensureCampaign({}, 0); W.ensureWorld(pr); if (!daily) noDaily(pr); return pr; };
const clear = (pr, n) => { for (let i = 1; i <= n; i++) pr.campaign.cleared.story[sid(i)] = true; W.syncReports(pr); };
const act = (pr, scene, id, now = NOW) => W.interact(pr, pr.wallet, scene, id, {}, now, () => 0.5);
const win = (pr, id, meta = {}, classes = ['warrior', 'assassin'], now = NOW) => C.applyResult(pr, { id, diff: 'story', classes, win: true }, P, now, () => 0.999, { deaths: 0, skills: 0, kills: 3, ...meta });
const lose = (pr, id, now = NOW) => C.applyResult(pr, { id, diff: 'story', classes: ['warrior', 'assassin'], win: false }, P, now, () => 0.999, { deaths: 2, skills: 0, kills: 0 });
const entry = (pr, id, now = NOW) => W.worldState(pr, now).qlog.list.find(q => q.id === id);
const obj = (pr, scene, id, now = NOW) => W.worldState(pr, now).scenes[scene].objects.find(o => o.id === id);
const npc = (pr, scene, id) => W.worldState(pr, NOW).scenes[scene].npcs.find(n => n.id === id);

test('dữ liệu: 18 phụ · 7 nhánh · 10 ẩn; thưởng đúng khung; mọi mục tiêu trỏ tới NPC / vật có thật; không dùng gạch dài trong lời', () => {
    const by = (t) => Q.QUESTS.filter(q => q.type === t);
    assert.equal(by('side').length, 18);   // 15 việc + 2 việc trao dụng cụ + củi cho bếp quán
    assert.equal(by('branch').length, 7);
    assert.equal(by('hidden').length, 10);
    assert.equal(new Set(Q.QUESTS.map(q => q.id)).size, Q.QUESTS.length);
    const allNpc = new Set(Object.values(W.SCENES).flatMap(s => s.npcs)), allObj = new Map(Object.values(W.SCENES).flatMap(s => s.objects).map(o => [o.id, o]));
    const items = new Set([...allObj.values()].filter(o => o.item).map(o => o.item));
    const stages = new Set([...require('../game/chapter1').stages, ...require('../game/chapter1').branches].map(s => s.id));
    for (const q of Q.QUESTS) {
        if (q.type !== 'hidden') assert.ok(allNpc.has(q.giver), `${q.id} người giao`);
        if (q.type === 'side' && !q.legacy) {
            assert.ok(q.reward.gold >= 300 && q.reward.gold <= 800, q.id);
            assert.ok(q.reward.stone >= 2 && q.reward.stone <= 5, q.id);
            assert.equal(q.reward.items.exp_small, 1, q.id);
        }
        if (q.type === 'branch') {
            assert.equal(q.reward.diamond, 100, q.id);
            assert.ok(q.reward.gear, q.id);
            assert.ok(q.steps.length >= 3 && q.steps.length <= 4, q.id);
            assert.equal(q.steps.filter(s => s.goal.type === 'clearStage').length, 1, q.id);
        }
        if (q.type === 'hidden') assert.ok(q.reward.diamond >= 80 && q.reward.diamond <= 150, q.id);
        for (const st of q.steps) {
            const g = st.goal;
            for (const id of g.who ?? (g.npc ? [g.npc] : [])) assert.ok(allNpc.has(id) || allObj.get(id)?.type === 'person', `${q.id}/${st.id}: ${id}`);
            for (const it of g.items ?? []) assert.ok(items.has(it) || (q.give ?? []).includes(it), `${q.id}/${st.id}: vật ${it}`);
            for (const id of g.objs ?? (g.obj ? [g.obj] : [])) assert.ok(allObj.has(id), `${q.id}/${st.id}: ${id}`);
            if (g.stage) assert.ok(stages.has(g.stage), `${q.id}: ải ${g.stage}`);
            if (st.at?.obj) assert.ok(W.SCENES[st.at.scene].objects.some(o => o.id === st.at.obj), `${q.id}/${st.id} at`);
        }
        for (const [, text] of [...(q.intro ?? []), ...(q.outro ?? []), ...q.steps.flatMap(s => Object.values(s.say ?? {}).flat().map(t => ['', t]))]) assert.ok(!text.includes('—'), `${q.id}: lời có gạch dài`);
    }
    // 2 ải nhánh mới
    assert.equal(C.findStage('c1-n6').flag, 'kiem_doi_truong');
    assert.equal(C.findStage('c1-n7').flag, 'ten_bi_gach');
    // chính tuyến: khoảng 45 bước
    assert.equal(Q.mainList().length, 46);
});

test('phụ: nhận ở người giao (!) -> nhặt vật -> trả (?) -> thưởng đúng 1 lần, tải lại vẫn giữ', () => {
    let pr = fresh();
    assert.equal(entry(pr, 's_chao').state, 'locked');
    assert.equal(obj(pr, 'outskirts', 'pk_lua').state, 'hidden');
    clear(pr, 1);
    assert.deepEqual([npc(pr, 'ashford', 'mira').mark, npc(pr, 'ashford', 'mira').mk], ['!', 'side']);
    assert.equal(entry(pr, 's_chao').state, 'offered');
    assert.equal(act(pr, 'outskirts', 'pk_lua').ok, false);   // chưa nhận thì chưa nhặt được
    const a = act(pr, 'ashford', 'mira');
    assert.ok(a.accepted && a.story && a.lines.length >= 2);
    assert.equal(entry(pr, 's_chao').state, 'active');
    assert.deepEqual(entry(pr, 's_chao').target, { scene: 'outskirts', kind: 'obj', id: 'pk_lua' });
    for (const id of ['pk_lua', 'pk_nam']) assert.equal(act(pr, 'outskirts', id).ok, true);
    assert.deepEqual(entry(pr, 's_chao').progress, { have: 2, need: 3 });
    assert.equal(act(pr, 'outskirts', 'pk_lua').ok, false);   // nhặt rồi thì biến mất
    pr = JSON.parse(JSON.stringify(pr));                       // tải lại trang
    assert.equal(act(pr, 'outskirts', 'pk_cui').ok, true);
    assert.deepEqual([npc(pr, 'ashford', 'mira').mark, npc(pr, 'ashford', 'mira').mk], ['?', 'side']);
    assert.deepEqual(entry(pr, 's_chao').target, { scene: 'ashford', kind: 'npc', id: 'mira' });
    assert.equal(W.worldState(pr, NOW).bag.length, 3);
    const before = structuredClone(pr.wallet), exp = pr.items.exp_small ?? 0;
    const r = act(pr, 'ashford', 'mira');
    assert.ok(r.completed && r.story);
    assert.deepEqual(r.rewards, { gold: 300, stone: 2, items: { exp_small: 1 } });
    assert.deepEqual([pr.wallet.gold - before.gold, pr.wallet.stone - before.stone, pr.items.exp_small - exp], [300, 2, 1]);
    assert.equal(entry(pr, 's_chao').state, 'done');
    assert.equal(W.worldState(pr, NOW).bag.length, 0);
    const after = structuredClone(pr.wallet);
    act(pr, 'ashford', 'mira'); act(pr, 'ashford', 'mira');   // bấm lặp / gửi lại gói tin
    assert.equal(Q.complete(pr, pr.wallet, Q.BY_ID.s_chao), null);
    assert.deepEqual(pr.wallet, after);
    assert.equal(pr.items.exp_small - exp, 1);
});

test('3 việc cũ chạy qua bộ máy mới, giữ cờ mở tính năng; việc kế của cùng người mở sau', () => {
    const pr = fresh();
    clear(pr, 4);
    assert.equal(act(pr, 'ashford', 'borin').text, 'Nhận việc');
    assert.equal(Q.stateOf(pr, 'borin'), 'active');
    act(pr, 'outskirts', 'hammer');
    const r = act(pr, 'ashford', 'borin');
    assert.equal(r.flag, 'bua_borin');
    assert.equal(pr.flags.bua_borin, true);
    assert.equal(pr.wallet.gold, 1000);
    assert.equal(C.isUnlocked(pr, 'c1-n2', 'story').ok, true);
    assert.equal(entry(pr, 's_kiem').state, 'offered');            // "Lưỡi kiếm đầu tiên" mở sau khi xong việc búa
    assert.equal(npc(pr, 'ashford', 'borin').mark, '!');
    // save cũ đang làm dở việc Lena (chỉ có quests + bag, chưa có qp): không kẹt
    clear(pr, 10);
    pr.world.quests.lena = 'active'; pr.world.bag = { wheat: true, mushroom: true };
    assert.equal(act(pr, 'ashford', 'lena').flag, 'nguyen_lieu_lena');
    assert.ok(C.features(Object.assign(pr, { account: { level: 12, exp: 0, migrated: true } })).has('tavern'));
});

test('các loại mục tiêu: talk / deliver / interact / reach / clearStage / flag / winBattles / loseThenWin', () => {
    const pr = fresh();
    clear(pr, 14);
    // talk nhiều người + người đứng trên bản đồ (person)
    act(pr, 'capital', 'villager_m2');
    assert.equal(obj(pr, 'capital', 'p_thuky').state, 'ready');
    assert.equal(obj(pr, 'capital', 'p_thuky').mark, '?');
    act(pr, 'capital', 'p_thuky'); act(pr, 'capital', 'p_thuky'); act(pr, 'capital', 'corvin');
    assert.deepEqual(entry(pr, 's_giay').progress, { have: 2, need: 3 });
    act(pr, 'capital', 'merchant2');
    assert.equal(obj(pr, 'capital', 'p_thuky').state, 'hidden');
    assert.equal(act(pr, 'capital', 'villager_m2').completed, true);
    // deliver: nhận thư lúc nhận việc, mang tới người ở trạm canh
    act(pr, 'ashford', 'villager_f');
    assert.equal(pr.world.bag.q_thu, true);
    assert.deepEqual(entry(pr, 's_thu').target, { scene: 'road', kind: 'obj', id: 'p_chong' });
    assert.ok(act(pr, 'road', 'p_chong').lines.length >= 2);
    assert.equal(pr.world.bag.q_thu, undefined);
    assert.equal(act(pr, 'ashford', 'villager_f').completed, true);
    // interact nhiều chỗ khác nhau
    act(pr, 'ashford', 'villager_m');
    for (const id of ['w_soi1', 'w_soi1', 'w_soi2']) act(pr, 'outskirts', id);
    assert.deepEqual(entry(pr, 's_rao').progress, { have: 2, need: 3 });
    assert.equal(obj(pr, 'outskirts', 'w_soi1').state, 'hidden');
    act(pr, 'outskirts', 'w_soi3');
    assert.equal(act(pr, 'ashford', 'villager_m').completed, true);
    // chuỗi nhánh Rok: talk -> reach -> clearStage (ải nhánh mới c1-n6) -> trả: +100 Kim Cương + 1 trang bị
    assert.deepEqual([npc(pr, 'ashford', 'rok').hidden, npc(pr, 'ashford', 'rok').mk], [false, 'branch']);   // Rok đã rời làng nhưng hiện lại để giao chuỗi
    act(pr, 'ashford', 'rok');
    assert.equal(C.isUnlocked(pr, 'c1-n6', 'story').ok, false);
    act(pr, 'forge_in', 'mae');
    assert.deepEqual(entry(pr, 'b_kiem').target, { scene: 'outskirts', kind: 'tile', x: 37, y: 12 });
    Q.pos(pr, pr.wallet, 'outskirts', 20, 12, NOW);
    assert.equal(entry(pr, 'b_kiem').step.i, 2);
    Q.pos(pr, pr.wallet, 'outskirts', 36, 13, NOW);
    assert.equal(entry(pr, 'b_kiem').step.i, 3);
    assert.equal(C.isUnlocked(pr, 'c1-n6', 'story').ok, true);
    win(pr, 'c1-n6');
    assert.equal(entry(pr, 'b_kiem').step.i, 4);
    const dia = pr.wallet.diamond, gear = Object.keys(pr.gear?.items ?? {}).length;
    assert.equal(act(pr, 'ashford', 'rok').completed, true);
    assert.equal(pr.wallet.diamond, dia + 100);
    assert.equal(Object.keys(pr.gear.items).length, gear + 1);
    assert.equal(npc(pr, 'ashford', 'rok').hidden, true);
    // flag: chuỗi Giếng Cổ đi qua câu đố có sẵn
    clear(pr, 7);
    pr.world.quests.s_chao = 'done';
    act(pr, 'ashford', 'mira');
    assert.equal(Q.stateOf(pr, 'b_gieng'), 'active');
    act(pr, 'ashford', 'villager_f');
    assert.deepEqual(entry(pr, 'b_gieng').target, { scene: 'ashford', kind: 'obj', id: 'well' });
    W.interact(pr, pr.wallet, 'ashford', 'well', { answer: W.WELL_ANSWER }, NOW);
    assert.equal(entry(pr, 'b_gieng').step.i, 3);
    // winBattles noDeaths
    pr.world.quests.sera = 'done';
    act(pr, 'ashford', 'sera');
    win(pr, 'c1-03', { deaths: 1 }); win(pr, 'c1-03'); win(pr, 'c1-03');
    assert.deepEqual(entry(pr, 's_bang').progress, { have: 2, need: 3 });
    win(pr, 'c1-03');
    assert.equal(act(pr, 'ashford', 'sera').completed, true);
});

test('mục tiêu đếm trong trận / lò rèn: useSkills, enhanceGear, standOn (2 lần báo vị trí)', () => {
    const pr = fresh(), p = { i: 0, n: 0, d: {} };
    assert.equal(Q.match(pr, { type: 'useSkills', n: 5 }, { type: 'battle', win: false, skills: 3 }, p), true);
    assert.deepEqual(Q.progress(pr, { type: 'useSkills', n: 5 }, p), { have: 3, need: 5 });
    Q.match(pr, { type: 'useSkills', n: 5 }, { type: 'battle', win: true, skills: 9 }, p);
    assert.deepEqual(Q.progress(pr, { type: 'useSkills', n: 5 }, p), { have: 5, need: 5 });
    const e = { i: 0, n: 0, d: {} };
    assert.equal(Q.match(pr, { type: 'enhanceGear', n: 1 }, { type: 'talk', who: 'x' }, e), false);
    assert.equal(Q.match(pr, { type: 'enhanceGear', n: 1 }, { type: 'enhance' }, e), true);
    assert.deepEqual(Q.progress(pr, { type: 'enhanceGear', n: 1 }, e), { have: 1, need: 1 });
    const s = { i: 0, n: 0, d: {} }, g = { type: 'standOn', scene: 'road', x: 18, y: 7, sec: 10 };
    assert.equal(Q.match(pr, g, { type: 'pos', scene: 'road', x: 18, y: 7, dwell: 9000 }, s), false);
    assert.equal(Q.match(pr, g, { type: 'pos', scene: 'road', x: 18, y: 8, dwell: 99000 }, s), false);
    assert.equal(Q.match(pr, g, { type: 'pos', scene: 'road', x: 18, y: 7, dwell: 10000 }, s), true);
});

test('chính tuyến: thưởng 3 mức (nhỏ / trung bình / quan trọng), mỗi bước trả đúng 1 lần; bảng góc luôn có bước hiện tại', () => {
    const pr = fresh(), d0 = pr.wallet.diamond, g0 = pr.wallet.gold, e0 = pr.items?.exp_small ?? 0;
    assert.deepEqual(W.worldState(pr, NOW).qlog.main, { i: 0, total: 46, reward: '+150 Vàng · +1 Bình EXP nhỏ', tier: 'small', text: 'Gặp Rok ở cổng đông làng', last: null });
    assert.equal(act(pr, 'ashford', 'rok').startStage, 'c1-01');          // bước 1 (nhỏ): bình EXP nhỏ + vàng, KHÔNG có Kim Cương
    assert.deepEqual([pr.wallet.diamond, pr.wallet.gold, pr.items.exp_small], [d0, g0 + 150, e0 + 1]);
    act(pr, 'ashford', 'rok'); act(pr, 'ashford', 'rok');                 // bấm lại không được thêm
    assert.deepEqual([pr.wallet.diamond, pr.wallet.gold, pr.items.exp_small], [d0, g0 + 150, e0 + 1]);
    assert.ok(Q.takeNotes(pr).some(n => n.k === 'main' && /\+150 Vàng/.test(n.t) && !/Kim Cương/.test(n.t)));
    win(pr, 'c1-01', {}, ['warrior']);                                    // bước 2: qua ải (+50 lần đầu của ải)
    assert.equal(pr.wallet.diamond, d0 + 50);
    win(pr, 'c1-01', {}, ['warrior']);                                    // đánh lại: không thêm
    assert.equal(pr.wallet.diamond, d0 + 50);
    assert.equal(W.worldState(pr, NOW).qlog.main.text, W.REPORTS[1].go);
    assert.equal(W.questLog(pr)[0].obj, W.REPORTS[1].go);                 // bảng CHÍNH TUYẾN ở góc
    act(pr, 'ashford', 'mira');                                           // bước 3: về báo lại (ải 1 là mức nhỏ)
    assert.equal(pr.wallet.diamond, d0 + 50);
    assert.equal(pr.world.main, 3);
    const again = JSON.parse(JSON.stringify(pr));
    W.worldState(again, NOW); Q.settle(again, again.wallet, NOW);
    assert.equal(again.wallet.diamond, d0 + 50);
    // cả chương: 3 bước quan trọng (bình siêu lớn) + 8 bước trung bình + 35 bước nhỏ = 540 Kim Cương
    const tiers = Q.mainList().map(st => st.tier ?? 'small'), count = (t) => tiers.filter(x => x === t).length;
    assert.deepEqual([count('big'), count('mid'), count('small')], [3, 8, 35]);
    assert.equal(count('big') * Q.MAIN_TIERS.big.diamond + count('mid') * Q.MAIN_TIERS.mid.diamond, 540);
    assert.ok(Q.MAIN_TIERS.big.items.exp_huge && Q.MAIN_TIERS.mid.items.exp_big && !Q.MAIN_TIERS.small.diamond);
    // ải 2 là mức trung bình: bước cuối của ải trả Kim Cương + bình lớn
    const last2 = Q.mainList().filter(st => st.no === 2).at(-1);
    assert.equal(last2.tier, 'mid');
});

test('chính tuyến: save cũ ở giữa chương tính đúng bước, không kẹt, KHÔNG trả bù', () => {
    const steps = Q.mainList();
    // save rất cũ: chưa có pr.world
    const old = C.ensureCampaign({}, 0);
    for (let i = 1; i <= 8; i++) old.campaign.cleared.story[sid(i)] = true;
    const d0 = old.wallet.diamond;
    W.ensureWorld(old); noDaily(old);
    assert.equal(steps[old.world.main].id, 'go9');
    W.worldState(old, NOW); Q.settle(old, old.wallet, NOW);
    assert.equal(old.wallet.diamond, d0);                                  // 8 ải đã qua: không trả bù
    assert.equal(act(old, 'ashford', 'mira').startStage, 'c1-09');         // đi tiếp bình thường
    assert.equal(old.wallet.diamond, d0);                                  // "tới điểm truyện" là bước nhỏ: không có Kim Cương
    // save cũ vừa thắng ải 1, chưa về báo (đã có world.reported nhưng chưa có world.main)
    const mid = C.ensureCampaign({}, 0);
    W.ensureWorld(mid); delete mid.world.main; delete mid.world.spot;
    mid.campaign.cleared.story[sid(1)] = true;
    const d1 = mid.wallet.diamond;
    W.ensureWorld(mid); noDaily(mid);
    assert.equal(steps[mid.world.main].id, 'report1');
    assert.equal(mid.wallet.diamond, d1);
    act(mid, 'ashford', 'mira');
    assert.equal(mid.wallet.diamond, d1);                                   // ải 1: mức nhỏ, không có Kim Cương
    assert.equal(steps[mid.world.main].id, 'go2');
    // trận đánh khi save chưa có world (móc ở campaign.applyResult) cũng không trả bù
    const raw = C.ensureCampaign({}, 0);
    for (let i = 1; i <= 5; i++) raw.campaign.cleared.story[sid(i)] = true;
    const d2 = raw.wallet.diamond;
    raw.world = { daily: { day: Q.dayKey(NOW), tasks: [], n: {}, seen: {}, got: {}, bonus: true } };
    C.applyResult(raw, { id: 'c1-03', diff: 'story', classes: ['warrior', 'assassin'], win: true }, P, NOW, () => 0.999, { deaths: 0, skills: 0, kills: 3 });
    W.ensureWorld(raw); Q.settle(raw, raw.wallet, NOW);
    assert.equal(raw.wallet.diamond, d2);
    assert.equal(steps[raw.world.main].id, 'go6');
    // công cụ thử nhảy ải (syncReports) cũng không trả
    const jump = fresh(), d3 = jump.wallet.diamond;
    clear(jump, 20);
    Q.settle(jump, jump.wallet, NOW);
    assert.equal(jump.wallet.diamond, d3);
    assert.equal(jump.world.main, 46);
});

test('ẩn: không lộ trước khi kích hoạt; tự kích hoạt ở hành động đầu; thưởng + danh hiệu 1 lần', () => {
    const pr = fresh();
    const hidden = () => W.worldState(pr, NOW).qlog.list.filter(q => q.type === 'hidden');
    assert.deepEqual(hidden(), []);
    assert.deepEqual(W.worldState(pr, NOW).qlog.hidden, { found: 0, total: 10 });
    for (const s of Object.values(W.worldState(pr, NOW).scenes)) {
        for (const n of s.npcs) assert.notEqual(n.mk, 'hidden');
        for (const o of s.objects) assert.notEqual(o.mk, 'hidden');
    }
    assert.ok(!JSON.stringify(W.worldState(pr, NOW).qlog).includes('Người canh ruộng'));
    // bù nhìn 3 lần
    const d0 = pr.wallet.diamond;
    act(pr, 'outskirts', 'bu_nhin');
    assert.deepEqual(hidden().map(q => [q.id, q.state, q.progress]), [['h_bunhin', 'active', { have: 1, need: 3 }]]);
    assert.ok(pr.world.qnotes.some(n => /Phát hiện nhiệm vụ ẩn/.test(n.t)));
    act(pr, 'outskirts', 'bu_nhin');
    const r = act(pr, 'outskirts', 'bu_nhin');
    assert.ok(r.lines.some(([, t]) => /mũ rách rơi/.test(t)));            // lời kết phát ngay tại chỗ
    assert.equal(pr.wallet.diamond, d0 + 80);
    act(pr, 'outskirts', 'bu_nhin'); act(pr, 'outskirts', 'bu_nhin'); act(pr, 'outskirts', 'bu_nhin');
    assert.equal(pr.wallet.diamond, d0 + 80);
    assert.deepEqual(W.worldState(pr, NOW).qlog.hidden, { found: 1, total: 10 });
    // cho gà ăn ở 3 máng khác nhau (không dùng giờ thật) -> danh hiệu
    act(pr, 'ashford', 'ga1'); act(pr, 'ashford', 'ga1'); act(pr, 'ashford', 'ga2');
    assert.equal(Q.stateOf(pr, 'h_ga'), 'active');
    act(pr, 'ashford', 'ga3');
    assert.equal(Q.stateOf(pr, 'h_ga'), 'done');
    assert.deepEqual(pr.titles, ['Bạn của lũ gà']);
    // ghế trống ở quán: chỉ tính sau ải 15
    for (let i = 0; i < 3; i++) act(pr, 'tavern_in', 'ghe_trong');
    assert.equal(Q.stateOf(pr, 'h_khach'), null);
    clear(pr, 15);
    for (let i = 0; i < 3; i++) act(pr, 'tavern_in', 'ghe_trong');
    assert.equal(Q.stateOf(pr, 'h_khach'), 'done');
    // tấm bia sau nhà Bà Mira -> hỏi Bà Mira (không có dấu trên đầu vì là nhiệm vụ ẩn)
    for (const id of ['s_chao', 'b_gieng']) pr.world.quests[id] = 'done';
    act(pr, 'ashford', 'bia_vo_danh');
    assert.equal(npc(pr, 'ashford', 'mira').mark, null);
    assert.ok(act(pr, 'ashford', 'mira').lines.some(([, t]) => /người lính đầu tiên/.test(t)));
    assert.equal(Q.stateOf(pr, 'h_bia'), 'done');
});

test('ẩn: một mình · thua rồi thắng Valdric · đứng trên đảo 10 giây · rương nhảy · mở hết rương · manh mối đúng thứ tự', () => {
    const pr = fresh();
    clear(pr, 19);
    win(pr, 'c1-03', {}, ['warrior']);                                     // ải < 5: không tính
    assert.equal(Q.stateOf(pr, 'h_motminh'), null);
    win(pr, 'c1-06', {}, ['warrior', 'assassin']);
    assert.equal(Q.stateOf(pr, 'h_motminh'), null);
    win(pr, 'c1-06', {}, ['warrior']);
    assert.equal(Q.stateOf(pr, 'h_motminh'), 'done');
    assert.ok(pr.titles.includes('Độc hành'));
    // thua Valdric rồi thắng
    const solo = fresh(); clear(solo, 19);
    win(solo, 'c1-20');
    assert.equal(Q.stateOf(solo, 'h_dungday'), null);                      // thắng luôn: không tính
    lose(pr, 'c1-20');
    assert.equal(Q.stateOf(pr, 'h_dungday'), 'active');
    lose(pr, 'c1-20'); win(pr, 'c1-19');
    assert.equal(Q.stateOf(pr, 'h_dungday'), 'active');
    const d0 = pr.wallet.diamond;
    win(pr, 'c1-20');
    assert.equal(Q.stateOf(pr, 'h_dungday'), 'done');
    assert.ok(pr.wallet.diamond >= d0 + 150);
    // đứng yên trên đảo: 2 lần báo vị trí cùng ô cách nhau >= 10 giây
    Q.pos(pr, pr.wallet, 'road', 18, 7, NOW);
    Q.pos(pr, pr.wallet, 'road', 18, 7, NOW + 6000);
    assert.equal(Q.stateOf(pr, 'h_ca'), null);
    Q.pos(pr, pr.wallet, 'road', 17, 7, NOW + 7000);                       // bước ra: tính lại từ đầu
    Q.pos(pr, pr.wallet, 'road', 18, 7, NOW + 8000);
    Q.pos(pr, pr.wallet, 'road', 18, 7, NOW + 17000);
    assert.equal(Q.stateOf(pr, 'h_ca'), null);
    Q.pos(pr, pr.wallet, 'road', 18, 7, NOW + 18000);
    assert.equal(Q.stateOf(pr, 'h_ca'), 'done');
    // rương nhảy: cái đầu tiên kích hoạt, đủ 5 thì xong
    const jumps = Object.entries(W.SCENES).flatMap(([s, d]) => d.objects.filter(o => /^jump_(ashford|outskirts|forest|road|capital)_/.test(o.id)).map(o => [s, o.id]));
    assert.ok(jumps.length >= 5);
    act(pr, ...jumps[0]);
    assert.deepEqual(entry(pr, 'h_leo').progress, { have: 1, need: 5 });
    for (const j of jumps.slice(1, 5)) act(pr, ...j);
    assert.equal(Q.stateOf(pr, 'h_leo'), 'done');
    // mở hết rương thường
    const chests = Q.BY_ID.h_ruong.steps[0].goal.ids;
    for (const id of chests) { const scene = Object.keys(W.SCENES).find(s => W.SCENES[s].objects.some(o => o.id === id && o.type === 'chest')); assert.ok(scene, id); act(pr, scene, id); }
    assert.equal(Q.stateOf(pr, 'h_ruong'), 'done');
    // manh mối đúng thứ tự
    for (const [scene, id] of [['forest', 'clue_wheel'], ['outskirts', 'clue_arrows'], ['ashford', 'clue_ledger']]) act(pr, scene, id);
    assert.deepEqual(entry(pr, 'h_ghep').progress, { have: 3, need: 4 });
    act(pr, 'capital', 'clue_poster');
    assert.equal(Q.stateOf(pr, 'h_ghep'), 'done');
    // sai thứ tự thì không xong
    const bad = fresh(); clear(bad, 13);
    for (const [scene, id] of [['outskirts', 'clue_arrows'], ['forest', 'clue_wheel'], ['ashford', 'clue_ledger'], ['capital', 'clue_poster']]) act(bad, scene, id);
    assert.equal(Q.stateOf(bad, 'h_ghep'), 'active');
});

test('hằng ngày: 4 việc, 1–2 việc đánh quái, tổng đúng 100 Kim Cương, cùng ngày mọi người giống nhau, không ra việc chưa mở', () => {
    assert.equal(QD.DAILY.each * QD.DAILY.count + QD.DAILY.bonus, 100);
    const seen = new Set();
    for (let d = 0; d < 90; d++) {
        const now = NOW + d * DAY, a = fresh(true), b = fresh(true);
        clear(b, 3);
        const ta = W.worldState(a, now).qlog.daily, tb = W.worldState(b, now).qlog.daily;
        assert.equal(ta.tasks.length, 4);
        assert.equal(new Set(ta.tasks.map(t => t.id)).size, 4);
        const fights = ta.tasks.filter(t => t.fight).length;
        assert.ok(fights >= 1 && fights <= 2, `ngày ${d}: ${fights} việc đánh quái`);
        assert.deepEqual(ta.tasks.map(t => t.id), tb.tasks.map(t => t.id));
        assert.ok(!ta.tasks.some(t => t.id === 'd_enh'));                    // chưa mở lò rèn / chưa có đồ: không ra việc cường hoá
        assert.equal(ta.total, 100);
        for (const t of ta.tasks) seen.add(t.id);
    }
    assert.ok(seen.size >= 8);
    // người đã mở lò rèn và có đồ thì có thể gặp việc cường hoá
    const G = require('../game/gear');
    let got = false;
    for (let d = 0; d < 90 && !got; d++) {
        const pr = fresh(true); pr.account.level = 10;
        G.addItem(pr, G.createItem(() => 0.5, { slot: 'weapon', level: 10, rarity: 0 }, G.newId(pr)));
        got = W.worldState(pr, NOW + d * DAY).qlog.daily.tasks.some(t => t.id === 'd_enh');
    }
    assert.ok(got);
});

test('hằng ngày: làm đủ -> đúng 100 Kim Cương, không nhận 2 lần, 05:00 sáng làm mới', () => {
    const pr = fresh(true);
    clear(pr, 3);
    const d0 = pr.wallet.diamond;
    const state = () => W.worldState(pr, NOW).qlog.daily;
    const doTask = (t) => {
        for (let i = 0; i < t.need + 2; i++) {
            if (['d_win2', 'd_kill6', 'd_clean', 'd_skill10'].includes(t.id)) win(pr, 'c1-01', { skills: 4, kills: 2 });
            if (t.id === 'd_talk2') { act(pr, 'ashford', 'kid'); act(pr, 'ashford', 'kid'); act(pr, 'outskirts', 'farmer'); }
            if (t.id === 'd_gather') { act(pr, 'ashford', 'hoa_a1'); act(pr, 'ashford', 'hoa_a2'); act(pr, 'outskirts', 'hoa_o1'); }
            if (t.id === 'd_jump5') Q.fire(pr, pr.wallet, { type: 'jump' }, NOW);
            if (t.id === 'd_feed') act(pr, 'ashford', 'ga1');
            if (t.id === 'd_walk') Q.pos(pr, pr.wallet, 'forest', 2, 11, NOW);
        }
    };
    const tasks = state().tasks;
    // việc nhận thưởng ở chỗ khác (ải lặp lại không cho Kim Cương; nhiệm vụ ẩn / phụ có thể xen vào) -> chỉ đếm dòng báo "việc hôm nay"
    for (const t of tasks) doTask(t);
    const notes = Q.takeNotes(pr).filter(n => n.k === 'daily');
    assert.equal(notes.length, 5);                                           // 4 việc + thưởng đủ bộ
    assert.ok(state().tasks.every(t => t.done && t.have === t.need));
    assert.equal(state().bonusGot, true);
    const paid = pr.wallet.diamond - d0;
    for (const t of tasks) doTask(t);                                        // làm lại: không nhận nữa
    assert.equal(Q.takeNotes(pr).filter(n => n.k === 'daily').length, 0);
    assert.equal(pr.wallet.diamond - d0, paid);
    // tách riêng phần của việc hằng ngày: đúng 100
    const only = fresh(true), o0 = only.wallet.diamond;
    for (const id of only.world.daily?.tasks ?? Q.ensureDaily(only, NOW).tasks) {
        const t = QD.DAILY.tasks.find(x => x.id === id);
        const ev = { win: { type: 'battle', win: true, kills: 0, deaths: 1 }, kill: { type: 'battle', win: true, kills: 3, deaths: 1 }, clean: { type: 'battle', win: true, deaths: 0, kills: 0 }, talk: null,
            gather: { type: 'gather' }, skill: { type: 'battle', win: false, skills: 5 }, jump: { type: 'jump' }, feed: { type: 'feed' }, walk: { type: 'pos', scene: 'forest' }, enh: { type: 'enhance' } }[t.kind];
        for (let i = 0; i < 12; i++) Q.dailyEvent(only, only.wallet, ev ?? { type: 'talk', who: `n${i}` }, NOW);
    }
    assert.equal(only.wallet.diamond - o0, 100);
    for (let i = 0; i < 5; i++) Q.dailyEvent(only, only.wallet, { type: 'battle', win: true, kills: 9, deaths: 0, skills: 99 }, NOW);
    assert.equal(only.wallet.diamond - o0, 100);
    // mốc đổi ngày: 04:59 vẫn là ngày cũ, 05:00 là ngày mới
    const at = (h, m) => new Date(2026, 10, 12, h, m, 0).getTime();
    assert.equal(Q.dayKey(at(4, 59)), Q.dayKey(NOW));
    assert.notEqual(Q.dayKey(at(5, 0)), Q.dayKey(NOW));
    const next = W.worldState(only, at(5, 0)).qlog.daily;
    assert.ok(next.tasks.every(t => !t.done && t.have === 0));
    assert.equal(next.bonusGot, false);
    for (let i = 0; i < 12; i++) Q.dailyEvent(only, only.wallet, { type: 'jump' }, at(5, 0));
    // vật nhặt hằng ngày mọc lại sau 05:00
    const g = fresh(true);
    assert.equal(act(g, 'ashford', 'hoa_a1').ok, true);
    assert.equal(act(g, 'ashford', 'hoa_a1').ok, false);
    assert.equal(obj(g, 'ashford', 'hoa_a1').state, 'hidden');
    assert.equal(obj(g, 'ashford', 'hoa_a1', at(5, 0)).state, 'ready');
    assert.equal(act(g, 'ashford', 'daily_board').openDaily, true);          // bảng "việc hôm nay" cạnh bảng ải
});

test('bản đồ: mọi vật nhặt / điểm tới / người của nhiệm vụ đi bộ tới được; riêng con mèo của bé Pip phải nhảy', async () => {
    const { MAPS, flood, key } = await import('../tools/world_audit.mjs');
    const xsrc = fs.readFileSync(path.join(__dirname, '../src/world/mapsExtra.js'), 'utf8');
    const EXTRA = JSON.parse(xsrc.slice(xsrc.indexOf('{', xsrc.indexOf('export const EXTRA')), xsrc.lastIndexOf(';')));
    const src = fs.readFileSync(path.join(__dirname, '../src/ui/world.js'), 'utf8').split('// MOVEMENT_RULES_BEGIN')[1].split('// MOVEMENT_RULES_END')[0];
    const { jumpTarget } = await import('data:text/javascript;base64,' + Buffer.from(src.slice(src.indexOf('export const'))).toString('base64'));
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [id, list] of Object.entries(QD.QUEST_OBJECTS)) {
        const m = MAPS[id], pos = new Map((EXTRA[id] ?? []).map(o => [o.id, o]));
        const all = [...m.objects.filter(o => !pos.has(o.id)), ...pos.values()];
        const solid = new Set([...m.npcs.filter(n => !W.NPCS[n.id].wander).map(n => key(n.x, n.y)), ...all.filter(o => o.solid && !o.area).flatMap(o => (o.group ?? [[0, 0]]).map(([dx, dy]) => key(o.x + dx, o.y + dy)))]);
        const reached = flood(m, m.spawn, solid);
        const h = (x, y) => m.heights?.[y]?.[x] ?? '0';
        for (const q of list) {
            const o = pos.get(q.id);
            assert.ok(o, `${id}/${q.id} chưa có vị trí trong mapsExtra.js`);
            assert.equal(m.grid[o.y][o.x], '.', `${id}/${q.id}`);
            const near = N4.some(([dx, dy]) => reached.has(key(o.x + dx, o.y + dy)) && h(o.x + dx, o.y + dy) === h(o.x, o.y));
            assert.equal(near, !q.jump, `${id}/${q.id}: ${q.jump ? 'phải là chỗ cần nhảy' : 'không đi bộ tới được'}`);
            assert.equal(!!o.optional, !!q.jump, `${id}/${q.id} optional`);
        }
    }
    // con mèo: từ ô (36,11) nhảy qua hàng rào lên (36,9), rồi đi bộ tới cạnh thùng gỗ; nhảy ra lại được
    const m = MAPS.ashford, cat = EXTRA.ashford.find(o => o.id === 'pk_meo');
    const blocked = (x, y) => m.grid[y]?.[x] !== '.' || (m.gaps ?? []).some(p => p[0] === x && p[1] === y) || (x === cat.x && y === cat.y);
    assert.ok(flood(m, m.spawn).has(key(36, 11)));
    assert.deepEqual(jumpTarget(m, 36, 11, 0, -1, false, blocked), { tx: 36, ty: 9, cost: 1 });
    const yard = flood(m, [36, 9], new Set([key(cat.x, cat.y)]));
    assert.ok(N4.some(([dx, dy]) => yard.has(key(cat.x + dx, cat.y + dy))));
    assert.deepEqual(jumpTarget(m, 36, 9, 0, 1, false, blocked), { tx: 36, ty: 11, cost: 1 });
    // điểm "tới chỗ" / "đứng yên" là ô đi được (đảo giữa ao phải nhảy đá mới tới: nhiệm vụ ẩn)
    for (const q of Q.QUESTS) for (const st of q.steps) if (st.goal.type === 'reach') {
        const mm = MAPS[st.goal.scene];
        assert.ok(flood(mm, mm.spawn).has(key(st.goal.x, st.goal.y)), `${q.id}: điểm tới`);
    }
    assert.equal(MAPS.road.grid[7][18], '.');
});

test('con mèo của bé Pip: nhận việc -> mèo hiện ở sân có rào -> bế về -> thưởng', () => {
    const pr = fresh();
    clear(pr, 1);
    pr.world.quests.s_chao = 'done';
    assert.equal(obj(pr, 'ashford', 'pk_meo').state, 'hidden');
    assert.equal(act(pr, 'ashford', 'kid').accepted, true);
    assert.equal(obj(pr, 'ashford', 'pk_meo').state, 'ready');
    assert.equal(act(pr, 'ashford', 'pk_meo').ok, true);
    assert.equal(act(pr, 'ashford', 'kid').completed, true);
    assert.equal(Q.stateOf(pr, 's_meo'), 'done');
});
