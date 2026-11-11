// 🧪 Tool thử (src/ui/testHub.js + testHubCore.mjs): tìm lệnh không dấu, đủ mọi thao tác của các bảng tool cũ,
// kịch bản chạy đúng thứ tự (socket giả) và không treo khi server không trả lời.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const T = require('../game/testTools');
const C = require('../game/campaign');

const core = import('../src/ui/testHubCore.mjs');
const HEROES = [['assassin', 'Jessica'], ['warrior', 'Rok'], ['archer', 'Lyra'], ['priest', 'Seraphine'], ['mage', 'Ignar'], ['reaper', 'Zerith'],
    ['wrestler', 'Brakk'], ['dancer', 'Nerissa'], ['elementalist', 'Elarion'], ['alchemist', 'Grix'], ['summoner', 'Sylva']];
const HERO_IDS = HEROES.map(h => h[0]);
const cat = T.catalog(HEROES.map(([id, name]) => ({ id, name })));   // đúng danh sách server gửi (testCatalogResult)
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const numsOf = (q) => (q.match(/\d+/g) ?? []).map(Number);

test('tìm lệnh: không cần dấu, gõ vài chữ là ra đúng lệnh đứng đầu', async () => {
    const m = await core;
    assert.equal(m.norm('Tới Ải 7 — Bão Tuyết, Đầy'), 'toi ai 7 bao tuyet day');
    const top = (q, ctx = { place: 'menu' }) => m.searchCommands(m.buildCommands(cat, numsOf(q)), q, ctx)[0]?.cmd;
    assert.equal(top('ai 7').id, 'jump:c1-07');
    assert.equal(top('ải 7').id, 'jump:c1-07');
    assert.equal(top('ai 7 chuong 2').id, 'jump:c2-07');
    assert.equal(top('ai 17').id, 'jump:c1-17');
    assert.equal(top('rok sss').id, 'hero:warrior:p3');
    assert.equal(top('golem bao tuyet').id, 'golem:1');
    assert.equal(top('toi kinh thanh').id, 'tp:capital');
    assert.equal(top('bat tu').id, 'tg:god');
    assert.equal(top('quai bat tu').id, 'tg:enemyGod');
    assert.equal(top('mien phi').id, 'tg:noMana');
    assert.equal(top('day mana').id, 'fillMana');
    assert.equal(top('thang').id, 'win');
    assert.equal(top('choi lai').id, 'reset');
    assert.equal(top('tai khoan 10').id, 'acc:10');
    assert.equal(top('quai 37').id, 'monLv:37');          // con số tuỳ ý
    assert.equal(top('lyra 33').id, 'heroLv:archer:33');
    assert.equal(top('thu chieu ly').id, 'sc:skill:archer');
    assert.equal(top('elarion loc').id, 'elem:tornado');
    assert.equal(top('zzzz'), undefined);
    assert.equal(m.matchScore('ai 7', 'Tới ải 17'), 0, '"7" không được khớp "17"');
});

test('đủ lệnh: mọi thao tác của bảng 5 ngăn, Tool Phe Mình, Tool Phe Quái và dải Thử nhanh đều có', async () => {
    const m = await core;
    const cmds = m.buildCommands(cat, [35]);
    assert.equal(new Set(cmds.map(c => c.id)).size, cmds.length, 'id lệnh không trùng');
    const sent = [];   // mọi gói tin các lệnh sẽ gửi
    for (const c of cmds) for (const s of c.steps ?? []) if (s.emit) sent.push([s.emit, s.data ?? {}]);
    for (const k of Object.keys(m.TOGGLES)) sent.push(m.toggleEmit(k, true));
    const has = (event, want) => sent.some(([e, d]) => e === event && Object.entries(want).every(([k, v]) => JSON.stringify(d[k]) === JSON.stringify(v)));
    const OLD = [
        // 🧪 bảng 5 ngăn (testPanel.js)
        ...cat.chapters.flatMap(c => c.stages.map(s => ['testTool', { op: 'stageJump', stageId: s.id }])),
        ...cat.chapters.map(c => ['testTool', { op: 'unlockChapter', chapter: c.id }]),
        ['debugProgress', { classId: 'all', level: 60, rank: 3 }], ['debugProgress', { classId: 'all', level: 60, rank: 2 }],
        ['debugProgress', { classId: 'all', level: 40, rank: 1 }], ['debugProgress', { classId: 'all', level: 1, rank: 0 }],
        ['debugProgress', { classId: 'all', level: 35 }],
        ...[0, 1, 2, 3].map(rank => ['debugProgress', { classId: 'all', rank }]),
        ['testTool', { op: 'heroes', ownAll: true }],
        ['testTool', { op: 'wallet', gold: 10000 }], ['testTool', { op: 'wallet', diamond: 1000 }], ['testTool', { op: 'wallet', stone: 100 }], ['testTool', { op: 'wallet', stamina: 'full' }],
        ...[1, 3, 6, 10, 12, 15, 18, 20, 25, 60].map(level => ['debugAccount', { level }]),
        ...cat.items.map(it => ['testTool', { op: 'item', id: it.id }]),
        ['testTool', { op: 'evidenceAll' }], ['testTool', { op: 'battleWin' }], ['testTool', { op: 'battleLose' }],
        ...cat.scenes.map(s => ['testTool', { op: 'teleport', scene: s.id }]),
        // 🛠️ Tool Phe Mình (index.html + input.js + progressTool.js)
        ['debugAction', { type: 'fillMana' }], ['debugAction', { type: 'noMana', value: true }], ['debugAction', { type: 'godMode', value: true }],
        ...m.ELEM_SPELLS.map(([key]) => ['debugAction', { type: 'elemSpell', value: key }]),
        ...[0, 1, 2].map(i => ['debugAction', { type: 'golemSkill', value: i }]),
        ...HERO_IDS.flatMap(id => [['debugAction', { type: 'toggleMember', value: id }], ['debugAction', { type: 'kill', value: id }], ['rankUp', { classId: id }],
            ['debugProgress', { classId: id, level: 35 }], ...[0, 1, 2, 3].map(preset => ['debugProgress', { classId: id, preset }])]),
        ...[10, 30, 60].flatMap(level => [null, ...cat.gearSets.map(g => g.id)].map(set => ['gearDebugGive', { set, level, rarity: 4 }])),
        // 👹 Tool Phe Quái
        ...['spawnStandard', 'spawnDummy', 'addDummy', 'removeDummy'].map(type => ['debugEnemyAction', { type }]),
        ...[1, -1, 10, -10].map(add => ['debugEnemyAction', { type: 'monsterLevel', add }]),
        ...[1, 20, 40, 60].map(set => ['debugEnemyAction', { type: 'monsterLevel', set }]),
        ['debugEnemyAction', { type: 'godMode', value: true }],
        // đi tới
        ['backToMenu', {}], ['chooseMode', { mode: 'test' }],
    ];
    assert.equal(m.ELEM_SPELLS.length, 10);
    for (const [event, want] of OLD) assert.ok(has(event, want), `thiếu lệnh: ${event} ${JSON.stringify(want)}`);
    // 10 phép Elarion đúng với phép thật trên server
    const spells = new Set([...read('server.js').matchAll(/^\s+(\w+): \{ name: '[^']+', recipe: '[fib]{3}'/gm)].map(x => x[1]));
    assert.deepEqual([...spells].sort(), m.ELEM_SPELLS.map(x => x[0]).sort());
    // lệnh mở mục con (đồ tuỳ chọn, chi tiết nhân vật), mở Bảng ải / bản đồ, xoá tiến trình 2 bước
    const ui = new Set(cmds.flatMap(c => (c.steps ?? []).filter(s => s.ui).map(s => `${s.ui}:${s.arg ?? ''}`)));
    for (const k of ['detail:heroes', 'detail:items', 'world:', 'board:c1', 'board:c2', 'reset:', 'toggle:god', 'toggle:noMana', 'toggle:enemyGod']) assert.ok(ui.has(k), k);
    // 5 kịch bản + biến thể cho từng tướng / từng ải
    assert.deepEqual(m.SCENARIOS.map(s => s.id), ['skill', 'team60', 'boss', 'walk', 'revive']);
    for (const id of HERO_IDS) assert.ok(cmds.some(c => c.id === `sc:skill:${id}`));
});

test('gói testTool của mọi lệnh đều được game/testTools.apply nhận (đúng tên trường)', async () => {
    const m = await core;
    for (const c of m.buildCommands(cat)) for (const s of c.steps ?? []) {
        if (s.emit !== 'testTool' || ['battleWin', 'battleLose'].includes(s.data.op)) continue;
        const pr = makeProgress();
        const r = T.apply(pr, s.data, HERO_IDS);
        assert.equal(r.ok, true, `${c.id}: ${r.text}`);
        assert.equal(s.test(r), true);
    }
});
function makeProgress() {
    const pr = { heroes: Object.fromEntries(HERO_IDS.map(id => [id, { level: 1, rank: 0, exp: 0 }])), items: {}, story: {}, flags: {}, owned: ['warrior'],
        wallet: { gold: 0, diamond: 0, stone: 0 }, evidence: {}, gear: { items: [], equipped: {}, nextId: 1 } };
    C.ensureCampaign(pr, Date.now());
    require('../game/account').ensureAccount(pr);
    return pr;
}

test('ngữ cảnh: trong trận hiện lệnh trận trước, ở bản đồ hiện lệnh bản đồ trước; lệnh chưa dùng được có lý do', async () => {
    const m = await core;
    const cmds = m.buildCommands(cat);
    const first = (ctx) => m.searchCommands(cmds, '', ctx)[0].cmd.group;
    assert.equal(first({ place: 'battle', inBattle: true, mode: 'test' }), 'battle');
    assert.equal(first({ place: 'world' }), 'map');
    assert.equal(first({ place: 'board' }), 'story');
    assert.equal(first({ place: 'menu' }), 'nav');   // kịch bản đã là nút to phía trên nên không lặp trong danh sách
    const by = (id) => cmds.find(c => c.id === id);
    assert.equal(m.unavailable(by('fillMana'), { place: 'menu' }), 'Cần đang trong trận');
    assert.equal(m.unavailable(by('fillMana'), { inBattle: true, mode: 'campaign' }), null);
    assert.equal(m.unavailable(by('spawn:standard'), { inBattle: true, mode: 'campaign' }), 'Chỉ dùng trong trận Đấu Tập');
    assert.equal(m.unavailable(by('spawn:standard'), { inBattle: true, mode: 'test' }), null);
    // lệnh đổi màn (tới ải, bản đồ…) dùng được cả khi đang trong trận: tự Về Menu trước
    assert.equal(m.unavailable(by('jump:c1-07'), { inBattle: true, mode: 'test' }), null);
    assert.deepEqual(m.stepsFor(by('jump:c1-07'), { inBattle: true }).map(s => s.emit ?? `ui:${s.ui}`), ['backToMenu', 'testTool', 'ui:board']);
    assert.deepEqual(m.stepsFor(by('jump:c1-07'), { inBattle: false }).map(s => s.emit ?? `ui:${s.ui}`), ['testTool', 'ui:board']);
    assert.equal(m.stepsFor(by('fillMana'), { inBattle: true }).length, 1);
    assert.equal(m.unavailable(by('tg:god'), { place: 'menu' }), null, 'công tắc bật trước được (nhớ cho trận sau)');
    // gõ đúng tên lệnh chưa dùng được: vẫn thấy (mờ + lý do), nhưng lệnh dùng được đứng trước khi cùng khớp
    const r = m.searchCommands(cmds, 'day mana', { place: 'menu' })[0];
    assert.equal(r.cmd.id, 'fillMana'); assert.equal(r.why, 'Cần đang trong trận');
    // không gõ gì: lệnh chưa dùng được nằm cuối
    const idle = m.searchCommands(cmds, '', { place: 'menu' }, 999);
    assert.ok(idle.findIndex(x => x.why) > idle.findIndex(x => x.cmd.group === 'items'));
});

test('nhớ lựa chọn + vừa dùng', async () => {
    const m = await core;
    assert.equal(m.autoApplyMode('test', false), true);
    assert.equal(m.autoApplyMode('campaign', true), true);
    assert.equal(m.autoApplyMode('campaign', false), false);
    assert.equal(m.autoApplyMode('duel_monster', true), false);
    assert.equal(m.autoApplyMode('duel_hero', true), false);
    assert.deepEqual(m.toggleEmit('enemyGod', 1), ['debugEnemyAction', { type: 'godMode', value: true }]);
    assert.deepEqual(m.toggleEmit('noMana', false), ['debugAction', { type: 'noMana', value: false }]);
    let list = [];
    for (const id of ['a', 'b', 'c', 'a', 'd', 'e', 'f']) list = m.pushRecent(list, { id });
    assert.deepEqual(list.map(r => r.id), ['f', 'e', 'd', 'a', 'c']);
    assert.equal(m.findCommand('monLv:37', cat).label, 'Quái cấp 37');
    assert.equal(m.findCommand('heroLv:warrior:33', cat).label, 'Rok cấp 33');
    assert.equal(m.findCommand('jump:c1-07', cat).id, 'jump:c1-07');
    assert.equal(m.findCommand('khong-co', cat), null);
    assert.deepEqual(m.teamForStage(0, 7), { level: 9, rank: 0 });
    assert.deepEqual(m.teamForStage(1, 20), { level: 42, rank: 2 });
});

// ---------- socket giả: ghi lại mọi gói gửi đi, trả lời như server ----------
function fakeIo(reply = {}) {
    const listeners = new Map(), log = [], ui = [];
    const io = {
        log, ui,
        on: (ev, fn) => { if (!listeners.has(ev)) listeners.set(ev, new Set()); listeners.get(ev).add(fn); },
        off: (ev, fn) => listeners.get(ev)?.delete(fn),
        fire: (ev, payload) => { for (const fn of [...(listeners.get(ev) ?? [])]) fn(payload); },
        emit: (ev, data) => { log.push([ev, data]); const r = reply[ev]?.(data); for (const [e, p] of r ?? []) setTimeout(() => io.fire(e, p), 1); },
        ui: (name, arg) => { ui.push(`${name}:${arg ?? ''}`); },
        count: () => [...listeners.values()].reduce((n, s) => n + s.size, 0),
    };
    const uiLog = ui; io.uiLog = uiLog;
    return io;
}
const server = {
    backToMenu: () => [['mainMenu', {}]],
    chooseMode: (d) => [['squadSelect', { mode: d.mode, max: 4, selected: ['warrior', 'archer', 'priest', 'mage', 'reaper'] }]],
    confirmSquad: () => [['battleStart', { mode: 'menu' }], ['battleStart', { mode: 'test' }], ['countdown', { count: 3 }], ['countdown', { count: 'START' }]],
    testTool: (d) => [['testToolResult', T.apply(makeProgress(), d, HERO_IDS)]],
    debugProgress: () => [['progressUpdate', {}]],
};

test('kịch bản "Thử chiêu 1 tướng": về Menu -> Đấu Tập -> xếp đội -> đợi trận bắt đầu rồi mới bật tool + gọi quái', async () => {
    const m = await core;
    const io = fakeIo(server);
    const r = await m.runSteps(m.scenarioSteps('skill', 'archer', { inBattle: true, mode: 'campaign' }, cat), io, { ms: 500 });
    assert.equal(r.ok, true);
    assert.deepEqual(io.log, [['backToMenu', undefined], ['chooseMode', { mode: 'test' }], ['confirmSquad', { classes: ['archer'] }], ['debugEnemyAction', { type: 'spawnStandard' }]]);
    assert.deepEqual(io.uiLog, ['toggleOn:god', 'toggleOn:noMana', 'toggleOn:enemyGod', 'close:']);
    assert.equal(io.count(), 0, 'không để sót bộ nghe sự kiện');
});

test('kịch bản "Cả đội Lv60 SSS" dùng đội đã nhớ của server; "Thử hồi sinh" đợi START rồi mới hạ gục', async () => {
    const m = await core;
    let io = fakeIo(server);
    assert.equal((await m.runSteps(m.scenarioSteps('team60', null, { inBattle: false }, cat), io, { ms: 500 })).ok, true);
    assert.deepEqual(io.log.map(x => x[0]), ['debugProgress', 'backToMenu', 'chooseMode', 'confirmSquad', 'debugEnemyAction', 'debugEnemyAction']);
    assert.deepEqual(io.log[0][1], { classId: 'all', level: 60, rank: 3 });
    assert.deepEqual(io.log[3][1], { classes: ['warrior', 'archer', 'priest', 'mage'] });   // tối đa 4 người
    assert.deepEqual(io.log[5][1], { type: 'monsterLevel', set: 60 });
    // lần trước chỉ đánh 1 người (vd vừa chạy "Thử chiêu 1 tướng") -> vẫn ra đủ 4 người
    assert.deepEqual(m.fullSquad({ max: 4, selected: ['archer'], heroes: HERO_IDS.map(id => ({ id })) }), ['archer', 'assassin', 'warrior', 'priest']);
    assert.deepEqual(m.fullSquad({ max: 4, selected: ['a', 'b', 'c', 'd', 'e'] }), ['a', 'b', 'c', 'd']);

    io = fakeIo(server);
    const order = [];
    io.on('countdown', (d) => order.push(`cd:${d.count}`));
    const emit = io.emit; io.emit = (ev, d) => { order.push(ev === 'debugAction' ? `${ev}:${d.type}` : ev); emit(ev, d); };
    assert.equal((await m.runSteps(m.scenarioSteps('revive', 'warrior', {}, cat), io, { ms: 500 })).ok, true);
    assert.deepEqual(io.log[2], ['confirmSquad', { classes: ['warrior', 'priest'] }]);
    assert.ok(order.indexOf('cd:START') < order.indexOf('debugAction:kill'), order.join(' '));
    assert.deepEqual(io.log.at(-1), ['debugAction', { type: 'kill', value: 'warrior' }]);
});

test('kịch bản "Thử trùm ải N" và "Đi dạo bản đồ": gói tin hợp lệ với server thật, xong thì mở đúng màn', async () => {
    const m = await core;
    let io = fakeIo(server);
    assert.equal((await m.runSteps(m.scenarioSteps('boss', 'c2-05', { inBattle: false }, cat), io, { ms: 500 })).ok, true);
    assert.deepEqual(io.log, [['testTool', { op: 'stageJump', stageId: 'c2-05' }], ['testTool', { op: 'heroes', level: 27, rank: 1 }]]);
    assert.deepEqual(io.uiLog, ['board:c2-05', 'close:']);
    io = fakeIo(server);
    assert.equal((await m.runSteps(m.scenarioSteps('walk', 'capital', { inBattle: true, mode: 'test' }, cat), io, { ms: 500 })).ok, true);
    assert.deepEqual(io.log, [['backToMenu', undefined], ['testTool', { op: 'teleport', scene: 'capital' }]]);
    assert.deepEqual(io.uiLog, ['world:', 'close:']);
    for (const s of m.SCENARIOS) assert.ok(Array.isArray(m.scenarioSteps(s.id, s.ask === 'stage' ? 'c1-01' : s.ask === 'scene' ? 'capital' : 'warrior', {}, cat)), s.id);
});

test('server không trả lời / từ chối: dừng với lời báo rõ ràng, không treo, không chạy bước sau', async () => {
    const m = await core;
    // 1) không trả lời chooseMode (vd server chính chặn Đấu Tập)
    let io = fakeIo({ backToMenu: server.backToMenu });
    const t0 = Date.now();
    let r = await m.runSteps(m.scenarioSteps('skill', 'archer', {}, cat), io, { ms: 60 });
    assert.equal(r.ok, false);
    assert.match(r.text, /Đấu Tập.*quá/);
    assert.ok(Date.now() - t0 < 2000);
    assert.deepEqual(io.log.map(x => x[0]), ['backToMenu', 'chooseMode']);
    assert.deepEqual(io.uiLog, []);
    assert.equal(io.count(), 0);
    // 2) server từ chối (testToolResult ok: false) -> báo đúng lời server, dừng ngay (không đợi hết giờ)
    io = fakeIo({ testTool: () => [['testToolResult', { ok: false, text: 'Chỉ dùng được ở Server test' }]] });
    r = await m.runSteps(m.scenarioSteps('boss', 'c1-07', {}, cat), io, { ms: 5000 });
    assert.deepEqual([r.ok, r.text, r.done], [false, 'Chỉ dùng được ở Server test', 0]);
    assert.equal(io.log.length, 1);
    // 3) sự kiện chung chưa đúng (battleStart của màn khác) thì đợi tiếp chứ không dừng
    io = fakeIo({ ...server, confirmSquad: () => [['battleStart', { mode: 'campaign' }]] });
    r = await m.runSteps(m.scenarioSteps('skill', 'archer', {}, cat), io, { ms: 80 });
    assert.equal(r.ok, false);
    assert.match(r.text, /Không vào được trận Đấu Tập/);
});

test('giao diện: bảng tool cũ đã gỡ, chỉ còn 1 lối vào; không dùng alert / confirm / prompt', () => {
    const html = read('index.html');
    for (const id of ['progress-tool', 'enemy-debug-controls', 'btn-debug-god-mode', 'btn-enemy-god']) assert.ok(!html.includes(id), id);
    assert.ok(!fs.existsSync(path.join(__dirname, '..', 'src/ui/testPanel.js')));
    const menu = read('src/ui/modeMenu.js');
    assert.ok(menu.includes('open-test-hub') && !menu.includes('debugCampaign') && !menu.includes('debugReset'));
    for (const f of ['src/ui/testHub.js', 'src/ui/testHubCore.mjs', 'src/ui/modeMenu.js', 'src/ui/progressTool.js']) {
        assert.doesNotMatch(read(f).replace(/\/\/.*$/gm, ''), /\b(alert|confirm|prompt)\s*\(/, f);
    }
    const hub = read('src/ui/testHub.js');
    assert.match(hub, /case 'resetGo':.*socket\.emit\('debugReset'\)/);   // xoá tiến trình: xác nhận 2 bước ngay trên bảng rồi mới gửi
    assert.match(read('src/main.js'), /setupTestHub\(\);[\s\S]*setupSquadSelect\(\);/);   // bắt phím trước bảng chọn đội
    // công tắc: trạng thái thật vẫn theo stateUpdate của server
    assert.match(read('src/ui/input.js'), /socket\.on\('stateUpdate', \(d\) => syncDebugToggles\(d\.players, d\.enemyGodMode\)\)/);
});
