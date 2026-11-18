// 📜 Nhiệm vụ & chính tuyến Chương 2 — Tiếng Gọi Rừng Thiêng (game/questData2.js + game/quests.js + game/world.js)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const W = require('../game/world');
const C = require('../game/campaign');
const Q = require('../game/quests');
const QD2 = require('../game/questData2');
const CH2 = require('../game/chapter2');
const STORY = require('../game/story');
const STORY2 = require('../game/story2');
const P = require('../progression');

const NOW = new Date(2026, 10, 18, 12, 0, 0).getTime();
const s1 = (n) => `c1-${String(n).padStart(2, '0')}`;
const s2 = (n) => `c2-${String(n).padStart(2, '0')}`;
const noDaily = (pr, now = NOW) => { pr.world.daily = { day: Q.dayKey(now), tasks: [], n: {}, seen: {}, got: {}, bonus: true }; };
const fresh = () => { const pr = C.ensureCampaign({}, 0); W.ensureWorld(pr); noDaily(pr); return pr; };
const clear1 = (pr, n = 20) => { for (let i = 1; i <= n; i++) pr.campaign.cleared.story[s1(i)] = true; W.syncReports(pr); };
const clear2 = (pr, n) => { clear1(pr); for (let i = 1; i <= n; i++) pr.campaign.cleared.story[s2(i)] = true; W.syncReports(pr); };
const act = (pr, scene, id, now = NOW) => W.interact(pr, pr.wallet, scene, id, {}, now, () => 0.5);
const win = (pr, id, meta = {}, classes = ['warrior', 'archer'], now = NOW) => C.applyResult(pr, { id, diff: 'story', classes, win: true }, P, now, () => 0.999, { deaths: 0, skills: 0, kills: 3, ...meta });
const entry = (pr, id, now = NOW) => W.worldState(pr, now).qlog.list.find(q => q.id === id);
const obj = (pr, scene, id, now = NOW) => W.worldState(pr, now).scenes[scene].objects.find(o => o.id === id);
const npc = (pr, scene, id, now = NOW) => W.worldState(pr, now).scenes[scene].npcs.find(n => n.id === id);

test('dữ liệu Chương 2: 20 ải + 20–28 task đa dạng + lộ trình sylvaren -> lunaria + 4–6 nhiệm vụ Elf; không gạch dài', () => {
    const main = Q.mainList('c2'), tasks = main.filter(st => st.kind === 'task');
    const reports = Object.keys(W.REPORTS2).length;
    assert.equal(main.length, 40 + reports + tasks.length);
    assert.ok(tasks.length >= 20 && tasks.length <= 28, `số task (${tasks.length}) phải trong 20–28`);
    assert.ok(main.findIndex(st => st.id === 'c2_clear1') <= 1, 'ải 1 tối đa 1 bước tới điểm truyện');

    const goalTypes = tasks.map(st => st.goal?.type);
    assert.ok(new Set(goalTypes).size >= 8, `cần >= 8 loại goal khác nhau (đang có ${new Set(goalTypes).size})`);
    for (let i = 2; i < goalTypes.length; i++) {
        assert.ok(!(goalTypes[i] === goalTypes[i - 1] && goalTypes[i] === goalTypes[i - 2]), `lặp 3 lần liên tiếp: ${goalTypes[i]}`);
    }

    for (let n = 1; n < 20; n++) {
        const a = main.findIndex(st => st.id === `c2_clear${n}`), b = main.findIndex(st => st.id === `c2_go${n + 1}`);
        const between = main.slice(a + 1, b).filter(st => st.kind === 'task');
        assert.ok(between.length >= 1 && between.length <= 2, `c2 ải ${n}->${n + 1}: ${between.length} task`);
    }

    const firstAll = [], perMap = {};
    for (const st of main) {
        if (!st.map) continue;
        perMap[st.map] = (perMap[st.map] ?? 0) + 1;
        if (!firstAll.includes(st.map)) firstAll.push(st.map);
    }
    assert.deepEqual(firstAll, ['sylvaren', 'lunaria']);
    assert.ok(perMap.sylvaren >= 20 && perMap.lunaria >= 15);
    const idx13 = main.findIndex(st => st.id === 'c2_go13');
    for (let i = 0; i < idx13; i++) assert.equal(main[i].map, 'sylvaren', `trước ải 13 không được qua lunaria: ${main[i].id}`);

    const allNpc = new Set(Object.values(W.SCENES).flatMap(s => s.npcs));
    const allObj = new Map(Object.values(W.SCENES).flatMap(s => s.objects).map(o => [o.id, o]));
    const items = new Set([...allObj.values()].filter(o => o.item).map(o => o.item));
    const stages = new Set([...CH2.stages, ...CH2.branches].map(s => s.id));
    for (const st of main) {
        assert.ok(!String(st.text ?? '').includes('—'), `${st.id}: text có gạch dài`);
        assert.ok(!/[{}]/.test(st.text ?? ''), `${st.id}: text có {}`);
        for (const t of Object.values(st.say ?? {}).flat()) assert.ok(!t.includes('—'), `${st.id}: say có gạch dài`);
        if (st.kind !== 'task') continue;
        const g = st.goal;
        for (const id of g.who ?? (g.npc ? [g.npc] : [])) assert.ok(allNpc.has(id) || allObj.get(id)?.type === 'person', `${st.id}: ${id}`);
        for (const it of g.items ?? []) assert.ok(items.has(it) || (st.give ?? []).includes(it), `${st.id}: ${it}`);
        for (const id of g.objs ?? (g.obj ? [g.obj] : [])) assert.ok(allObj.has(id), `${st.id}: ${id}`);
        if (g.stage) assert.ok(stages.has(g.stage), `${st.id}: ${g.stage}`);
    }

    const tiers = main.map(st => st.tier ?? 'small'), count = (t) => tiers.filter(x => x === t).length;
    assert.deepEqual([count('big'), count('mid'), count('small')], [3, 8, main.length - 11]);
    assert.equal(count('big') * Q.MAIN_TIERS.big.diamond + count('mid') * Q.MAIN_TIERS.mid.diamond, 540);
    assert.ok(tasks.every(st => (st.tier ?? 'small') === 'small'));

    // 4–6 nhiệm vụ phụ/ẩn chương 2, phần thưởng cùng chuẩn chương 1
    assert.ok(Q.QUESTS2.length >= 4 && Q.QUESTS2.length <= 6);
    assert.equal(Q.QUESTS2.filter(q => q.type === 'hidden').length, 1);
    const elfNpcs = new Set(['aeris', 'elfmerchant', 'elfkid', 'oren', 'lun_guard', 'elfkid2']);
    for (const q of Q.QUESTS2) {
        assert.ok(!Q.QUESTS.some(x => x.id === q.id), `trùng id ${q.id}`);
        if (q.type !== 'hidden') {
            assert.ok(elfNpcs.has(q.giver), q.id);
            assert.ok(q.reward.gold >= 300 && q.reward.gold <= 800, q.id);
            assert.ok(q.reward.stone >= 2 && q.reward.stone <= 5, q.id);
            assert.equal(q.reward.items.exp_small, 1, q.id);
        } else {
            assert.ok(q.reward.diamond >= 80 && q.reward.diamond <= 150, q.id);
        }
        assert.ok(!q.name.includes('—') && !q.desc.includes('—'));
        for (const st of q.steps) {
            const g = st.goal;
            for (const id of g.who ?? (g.npc ? [g.npc] : [])) assert.ok(allNpc.has(id), `${q.id}/${st.id}: ${id}`);
            for (const it of g.items ?? []) assert.ok(items.has(it), `${q.id}/${st.id}: ${it}`);
            for (const id of g.objs ?? (g.obj ? [g.obj] : [])) assert.ok(allObj.has(id), `${q.id}/${st.id}: ${id}`);
        }
        for (const [, text] of [...(q.intro ?? []), ...(q.outro ?? []), ...q.steps.flatMap(s => Object.values(s.say ?? {}).flat().map(t => ['', t]))]) {
            assert.ok(!text.includes('—'), `${q.id}: lời có gạch dài`);
        }
    }
});

test('chuyển tiếp Chương 1 -> Chương 2: nói chuyện Elise (hồi kết C1) tự mở bước 1 Chương 2', () => {
    const pr = fresh();
    clear1(pr, 19);
    pr.campaign.cleared.story['c1-20'] = true;
    W.ensureWorld(pr);
    assert.equal(Q.activeChapter(pr), 'c1');
    assert.equal(W.questLog(pr)[0].title, 'Chương 1 · Hồi kết');
    assert.equal(W.worldState(pr, NOW).qlog.hidden.total, 13);   // c1-20 đã qua nên vùng Elf mở -> thấy tổng 13 nhiệm vụ ẩn

    act(pr, 'capital', 'elise');   // xong report20
    assert.equal(Q.activeChapter(pr), 'c2');
    assert.equal(pr.world.main, Q.mainList('c1').length);
    assert.equal(pr.world.main2, 0);
    assert.equal(W.questLog(pr)[0].title, 'Chương 2 · Ải 1: Biên giới sương bạc');
    assert.deepEqual(W.questLog(pr)[0].target, { scene: 'sylvaren', kind: 'obj', id: 'sp2_border' });
    assert.equal(W.questLog(pr)[0].obj, W.STORY_SPOTS2[1].go);
    assert.equal(W.worldState(pr, NOW).qlog.main.text, W.STORY_SPOTS2[1].go);
    assert.equal(W.worldState(pr, NOW).qlog.main.total, Q.mainList('c2').length);
});

test('chính tuyến Chương 2 từ ải 1 đến ải 20: qua đủ 9 loại mục tiêu, chặn ải, mở Lunaria sau ải 12, thưởng 1 lần, báo kết thúc', () => {
    const pr = fresh();
    clear1(pr);
    const seenGoals = new Set();
    const dStart = pr.wallet.diamond;
    let battleRewardDia = 0;

    assert.equal(W.sceneOpen(pr, 'sylvaren'), true);
    assert.equal(W.sceneOpen(pr, 'lunaria'), false);

    for (let n = 1; n <= 20; n++) {
        // Kiểm tra cổng Lunaria khóa tới hết ải 12
        if (n <= 12) assert.equal(W.sceneOpen(pr, 'lunaria'), false);

        // Chạy hết task trước ải n (nếu có) và xác nhận stageBlocked hoạt động
        for (let guard = 0; guard < 5; guard++) {
            const cur = Q.mainCurrent(pr, 'c2');
            if (!cur || cur.st.kind !== 'task') break;
            assert.equal(Q.stageBlocked(pr, s2(n)), true, `c2-${n} phải bị chặn khi đang ở ${cur.st.id}`);
            const st = cur.st, g = st.goal;
            seenGoals.add(g.type);
            if (g.type === 'reach') {
                Q.pos(pr, pr.wallet, g.scene, g.x, g.y, NOW);
            } else if (g.type === 'standOn') {
                Q.pos(pr, pr.wallet, g.scene, g.x, g.y, NOW);
                Q.pos(pr, pr.wallet, g.scene, g.x, g.y, NOW + 1000);
                assert.equal(Q.stageBlocked(pr, s2(n)), true);
                Q.pos(pr, pr.wallet, g.scene, g.x, g.y, NOW + g.sec * 1000 + 200);
            } else if (g.type === 'interact') {
                for (const oid of g.objs ?? [g.obj]) assert.equal(act(pr, st.map, oid).ok, true, `${st.id}/${oid}`);
            } else if (g.type === 'talk') {
                const who = g.who[0];
                assert.equal(npc(pr, st.map, who).mk, 'main');
                assert.equal(act(pr, st.map, who).main, st.id);
            } else if (g.type === 'collect') {
                const tg = cur.target;
                assert.equal(obj(pr, tg.scene, tg.id).state, 'ready');
                assert.equal(act(pr, tg.scene, tg.id).ok, true);
            } else if (g.type === 'deliver') {
                const who = g.npc;
                assert.equal(npc(pr, st.map, who).mark, '?');
                assert.equal(act(pr, st.map, who).main, st.id);
                for (const it of g.items) assert.equal(pr.world.bag[it], undefined);
            } else if (g.type === 'useSkills') {
                win(pr, s2(1), { skills: g.n - 1 });
                assert.equal(Q.mainCurrent(pr, 'c2').st.id, st.id);
                assert.deepEqual(W.worldState(pr, NOW).qlog.main.progress, { have: g.n - 1, need: g.n });
                win(pr, s2(1), { skills: 1 });
            } else if (g.type === 'winBattles') {
                win(pr, s2(1), { deaths: 0 });
            } else if (g.type === 'openChests') {
                const tg = cur.target;
                assert.equal(act(pr, tg.scene, tg.id).ok, true);
            }
        }

        // Bây giờ đi tới điểm truyện của ải n
        assert.equal(Q.stageBlocked(pr, s2(n)), false, `ải ${n} phải hết bị chặn`);
        const sp = W.STORY_SPOTS2[n];
        const log = W.questLog(pr)[0];
        assert.equal(log.title, `Chương 2 · Ải ${n}: ${CH2.stages[n - 1].name}`);
        assert.equal(log.obj, sp.go);
        const goTarget = sp.npc ? { scene: sp.scene, kind: 'npc', id: sp.npc } : { scene: sp.scene, kind: 'obj', id: sp.obj };
        assert.deepEqual(log.target, goTarget);

        const gBefore = pr.wallet.gold;
        const gr = act(pr, goTarget.scene, goTarget.id);
        assert.equal(gr.startStage, s2(n));
        assert.equal(pr.wallet.gold, gBefore + 150);
        act(pr, goTarget.scene, goTarget.id);   // lặp lại không trả thưởng thêm
        assert.equal(pr.wallet.gold, gBefore + 150);

        const wr = win(pr, s2(n));
        battleRewardDia += wr.rewards.diamond;

        // Báo cáo nếu ải n có trong REPORTS2
        const rep = W.REPORTS2[n];
        if (rep) {
            assert.equal(W.pendingReport2(pr), n);
            assert.equal(W.postNow(s2(n), STORY.postFor(s2(n))).length, rep.from);
            assert.equal(W.questLog(pr)[0].title, n === 20 ? 'Chương 2 · Hồi kết' : `Chương 2 · Sau ải ${n}`);
            const rr = act(pr, rep.scene, rep.npc);
            assert.equal(rr.ok, true);
            if (n === 20) assert.deepEqual(rr.lines, STORY2.ending.map(l => [...l]));
            assert.equal(W.pendingReport2(pr), null);
        }

        if (n >= 12) assert.equal(W.sceneOpen(pr, 'lunaria'), true);
    }

    assert.ok(seenGoals.size >= 8);
    assert.equal(battleRewardDia, 20 * 50);
    assert.equal(pr.wallet.diamond - dStart, 1000 + 540 + 70);   // 20 ải ×50 · chính tuyến 3 mốc lớn ×100 + 8 mốc vừa ×30 · 2 rương mở trong chính tuyến (syl_chest 30 + lun_chest 40)
    assert.equal(W.questLog(pr)[0].state, 'done');
    assert.equal(W.questLog(pr)[0].title, 'Chương 2 · Tiếng Gọi Rừng Thiêng');
});

test('nhiệm vụ phụ & ẩn Chương 2: đủ vòng đời, không nhận 2 lần, giữ sau JSON reload', () => {
    let pr = fresh();
    clear2(pr, 2);
    // s2_thao_duoc (Cô Lirien -> nhặt 3 nhánh -> trả)
    assert.equal(entry(pr, 's2_thao_duoc').state, 'offered');
    assert.equal(obj(pr, 'sylvaren', 'pk2_lt1').state, 'hidden');
    assert.equal(npc(pr, 'sylvaren', 'elfmerchant').mark, '!');
    assert.equal(act(pr, 'sylvaren', 'elfmerchant').accepted, true);
    assert.equal(entry(pr, 's2_thao_duoc').state, 'active');
    for (const id of ['pk2_lt1', 'pk2_lt2']) assert.equal(act(pr, 'sylvaren', id).ok, true);
    assert.deepEqual(entry(pr, 's2_thao_duoc').progress, { have: 2, need: 3 });
    pr = JSON.parse(JSON.stringify(pr));
    assert.equal(act(pr, 'sylvaren', 'pk2_lt3').ok, true);
    assert.equal(npc(pr, 'sylvaren', 'elfmerchant').mark, '?');
    const g0 = pr.wallet.gold, st0 = pr.wallet.stone;
    const fin = act(pr, 'sylvaren', 'elfmerchant');
    assert.equal(fin.completed, true);
    assert.equal(pr.wallet.gold, g0 + 600);
    assert.equal(pr.wallet.stone, st0 + 4);
    assert.equal(entry(pr, 's2_thao_duoc').state, 'done');
    act(pr, 'sylvaren', 'elfmerchant');
    assert.equal(pr.wallet.gold, g0 + 600);

    // s2_sao_tre (Bé Tavi: 3 hốc đá)
    clear2(pr, 5);
    assert.equal(act(pr, 'sylvaren', 'elfkid').accepted, true);
    for (const id of ['m2_hoc1', 'm2_hoc2', 'm2_hoc3']) assert.equal(act(pr, 'sylvaren', id).ok, true);
    assert.equal(act(pr, 'sylvaren', 'elfkid').completed, true);

    // s2_tuan_tra (Vệ binh Lunaria: 3 chốt gác + 2 trận không ai gục) & h2_co_ngu (nhiệm vụ ẩn)
    clear2(pr, 15);
    assert.equal(obj(pr, 'lunaria', 'm2_bia1').state, 'ready');
    assert.equal(entry(pr, 'h2_co_ngu'), undefined);
    const d0 = pr.wallet.diamond;
    act(pr, 'lunaria', 'm2_bia1');
    assert.deepEqual(entry(pr, 'h2_co_ngu').progress, { have: 1, need: 3 });
    act(pr, 'lunaria', 'm2_bia1');   // đọc lại bia 1 không đếm trùng
    assert.deepEqual(entry(pr, 'h2_co_ngu').progress, { have: 1, need: 3 });
    act(pr, 'lunaria', 'm2_bia2');
    const hfin = act(pr, 'lunaria', 'm2_bia3');
    assert.equal(Q.stateOf(pr, 'h2_co_ngu'), 'done');
    assert.equal(pr.wallet.diamond, d0 + 120);
    assert.ok(pr.titles.includes('Người đọc cổ ngữ'));
    assert.ok(hfin.lines.some(([, t]) => /ngọn thứ bảy/.test(t)));

    assert.equal(act(pr, 'lunaria', 'lun_guard').accepted, true);
    for (const id of ['m2_chot1', 'm2_chot2', 'm2_chot3']) act(pr, 'lunaria', id);
    win(pr, s2(1), { deaths: 1 });   // có người gục -> không tính
    assert.equal(entry(pr, 's2_tuan_tra').step.i, 2);
    win(pr, s2(1), { deaths: 0 });
    win(pr, s2(1), { deaths: 0 });
    assert.equal(act(pr, 'lunaria', 'lun_guard').completed, true);

    // s2_den_long (Bé Mio: 3 cột đèn)
    clear2(pr, 16);
    assert.equal(act(pr, 'lunaria', 'elfkid2').accepted, true);
    for (const id of ['m2_den1', 'm2_den2', 'm2_den3']) act(pr, 'lunaria', id);
    assert.equal(act(pr, 'lunaria', 'elfkid2').completed, true);
});

test('save cũ ở giữa Chương 2 không kẹt và không trả bù Kim Cương', () => {
    const old = C.ensureCampaign({}, 0);
    for (let i = 1; i <= 20; i++) old.campaign.cleared.story[s1(i)] = true;
    for (let i = 1; i <= 5; i++) old.campaign.cleared.story[s2(i)] = true;
    const d0 = old.wallet.diamond;
    W.ensureWorld(old); noDaily(old);
    assert.equal(Q.activeChapter(old), 'c2');
    assert.equal(Q.mainList('c2')[old.world.main2].id, 'c2_t06_sap_deliver');
    assert.equal(old.world.bag.q_nhua_cay, true);   // tự phát vật nhiệm vụ để không bị kẹt
    Q.settle(old, old.wallet, NOW);
    assert.equal(old.wallet.diamond, d0);

    // Sau ải 12 (Lunaria vừa mở) qua syncReports
    const mid = fresh();
    clear2(mid, 12);
    const d1 = mid.wallet.diamond;
    Q.settle(mid, mid.wallet, NOW);
    assert.equal(mid.wallet.diamond, d1);
    assert.equal(Q.mainList('c2')[mid.world.main2].id, 'c2_t16_aeris_farewell');
    assert.equal(W.sceneOpen(mid, 'lunaria'), true);
});

test('bản đồ & hình ảnh: mọi điểm Chương 2 đi bộ tới được; mọi vật q_* có hình trong itemIcons', async () => {
    const { MAPS, flood, key } = await import('../tools/world_audit.mjs');
    const xsrc = fs.readFileSync(path.join(__dirname, '../src/world/mapsExtra.js'), 'utf8');
    const EXTRA = JSON.parse(xsrc.slice(xsrc.indexOf('{', xsrc.indexOf('export const EXTRA')), xsrc.lastIndexOf(';')));
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const reachFor = (sceneId) => {
        const m = MAPS[sceneId], pos = new Map((EXTRA[sceneId] ?? []).map(o => [o.id, o]));
        const all = [...m.objects.filter(o => !pos.has(o.id)), ...pos.values()];
        const solid = new Set([...m.npcs.filter(n => !W.NPCS[n.id].wander).map(n => key(n.x, n.y)), ...all.filter(o => o.solid && !o.area).flatMap(o => (o.group ?? [[0, 0]]).map(([dx, dy]) => key(o.x + dx, o.y + dy)))]);
        return { m, all, pos, reached: flood(m, m.spawn, solid), h: (x, y) => m.heights?.[y]?.[x] ?? '0' };
    };
    const checkNear = (sceneId, oId) => {
        const { m, all, pos, reached, h } = reachFor(sceneId);
        const o = pos.get(oId) ?? m.objects.find(x => x.id === oId) ?? all.find(x => x.id === oId);
        assert.ok(o, `${sceneId}/${oId}: thiếu vị trí`);
        assert.equal(m.grid[o.y][o.x], '.', `${sceneId}/${oId}`);
        assert.ok(N4.some(([dx, dy]) => reached.has(key(o.x + dx, o.y + dy)) && h(o.x + dx, o.y + dy) === h(o.x, o.y)), `${sceneId}/${oId}: không đi bộ tới được`);
    };

    for (const [sceneId, list] of Object.entries(QD2.QUEST_OBJECTS)) for (const q of list) checkNear(sceneId, q.id);
    for (const sp of Object.values(QD2.STORY_SPOTS)) if (sp.obj) checkNear(sp.scene, sp.obj);

    for (const st of Q.mainList('c2')) if (st.kind === 'task') {
        const tg = Q.targetOfGoal({}, st, st.goal, {});
        assert.ok(tg && MAPS[tg.scene], `${st.id}: thiếu target`);
        const { m, all, reached, h } = reachFor(tg.scene);
        if (st.goal.type === 'reach' || st.goal.type === 'standOn') assert.ok(reached.has(key(st.goal.x, st.goal.y)), `${st.id}: pos`);
        if (tg.kind === 'tile') assert.ok(reached.has(key(tg.x, tg.y)), `${st.id}: tile`);
        else if (tg.kind === 'npc') {
            const np = m.npcs.find(n => n.id === tg.id);
            assert.ok(np && N4.some(([dx, dy]) => reached.has(key(np.x + dx, np.y + dy)) && h(np.x + dx, np.y + dy) === h(np.x, np.y)), `${st.id}: npc ${tg.id}`);
        } else if (tg.kind === 'obj') {
            const o = all.find(x => x.id === tg.id);
            const tiles = o?.area ?? (o ? [[o.x, o.y]] : []);
            assert.ok(o && tiles.some(([ox, oy]) => N4.some(([dx, dy]) => reached.has(key(ox + dx, oy + dy)) && h(ox + dx, oy + dy) === h(ox, oy))), `${st.id}: obj ${tg.id}`);
        }
    }

    const icons = await import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(path.join(__dirname, '../src/ui/itemIcons.js'), 'utf8')).toString('base64'));
    for (const id of Object.keys(QD2.ITEM_NAMES)) assert.ok(icons.hasIcon(id), `thiếu hình ${id}`);
});
