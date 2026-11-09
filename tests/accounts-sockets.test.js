const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const realRequire = createRequire(path.join(__dirname, '../server.js'));

function harness() {
    const progress = {};
    let connect;
    const sockets = new Map();
    const io = { sockets: { sockets }, on: (event, fn) => { if (event === 'connection') connect = fn; },
        to: id => ({ emit: (event, data) => { for (const s of sockets.values()) if (s.id === id || s.roomId === id) s.emit(event, data); } }) };
    const accounts = { resume: token => token === 'owner' || token === 'member'
        ? { ok: true, user: { name: token === 'owner' ? 'Owner' : 'Member', admin: token === 'owner' }, token }
        : { ok: false }, logout: () => ({ ok: true, user: null }) };
    const context = vm.createContext({ console: { log() {} }, process: { env: {} }, __dirname: path.join(__dirname, '..'),
        setInterval: () => 1, clearInterval() {}, setTimeout: () => 1, clearTimeout() {}, Buffer,
        require: id => id === './game/accounts' ? { createAccounts: () => accounts }
            : id === './progression' ? { ...realRequire(id), loadAll: () => progress, saveAll() {} }
            : id === 'socket.io' ? { Server: function () { return io; } }
            : id === 'http' ? { createServer: () => ({ listen() {} }) } : realRequire(id) });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8'), context);
    let n = 0;
    function socket(auth) {
        const handlers = {}, events = [];
        let middleware;
        const s = { id: `socket-${++n}`, handshake: { auth }, events,
            on: (e, fn) => { handlers[e] = fn; }, emit: (e, d) => events.push([e, d]), join() {},
            use: fn => { middleware = fn; },
            send: (e, d) => { let result; middleware([e, d], () => { result = handlers[e]?.(d); }); return result; },
            last: e => events.filter(([name]) => name === e).at(-1)?.[1] };
        sockets.set(s.id, s);
        connect(s);
        return s;
    }
    return { socket, progress, run: code => vm.runInContext(code, context), context };
}
test('socket handshake isolates main/test saves, migrates once, and gates every debug event', () => {
    const h = harness();
    h.run("progressOf('browser-old').wallet.gold = 123");
    const main = h.socket({ clientId: 'browser-old', token: 'owner', server: 'main' });
    assert.equal(main.progressKey, 'acc-owner');
    assert.equal(main.events[0][0], 'serverInfo');
    assert.equal(h.progress['acc-owner'].wallet.gold, 123);
    const sandbox = h.socket({ clientId: 'browser-old', token: 'owner', server: 'test' });
    assert.equal(sandbox.progressKey, 'test-owner');
    sandbox.send('testTool', { op: 'wallet', gold: 100 });
    assert.equal(h.progress['test-owner'].wallet.gold, 223);
    assert.equal(h.progress['acc-owner'].wallet.gold, 123);
    assert.equal(h.progress['browser-old'].wallet.gold, 123);
    assert.ok(sandbox.last('campaignState'));
    assert.ok(sandbox.last('worldState'));
    for (const event of ['debugProgress', 'debugAccount', 'debugReset', 'debugCampaign', 'debugAction', 'debugEnemyAction', 'gearDebugGive', 'testTool', 'testCatalog']) {
        main.send(event, { op: 'wallet', gold: 999, level: 60 });
        assert.equal(main.last('testToolResult').ok, false, event);
    }
    main.send('chooseMode', { mode: 'test' });
    assert.equal(main.last('testToolResult').ok, false);
    assert.equal(h.progress['acc-owner'].wallet.gold, 123);
    const member = h.socket({ clientId: 'browser-new', token: 'member', server: 'test' });
    assert.equal(member.lcServer, 'main');
    assert.ok(member.last('serverInfo').note);
    const guest = h.socket({ clientId: 'browser-new', token: 'invalid', server: 'test' });
    assert.equal(guest.lcServer, 'guest');
    assert.ok(guest.last('authExpired'));
    guest.send('testCatalog', {});
    assert.equal(guest.last('testCatalogResult').chapters.length, 2);
});
test('test socket tools work in campaign battles, god persists and normal win/loss completes', () => {
    const h = harness();
    const s = h.socket({ clientId: 'browser-old', token: 'owner', server: 'test' });
    h.context.sid = s.id;
    h.context.rid = s.roomId;
    h.run("rooms[rid].mode = 'campaign'; rooms[rid].status = 'active'");
    s.send('debugAction', { type: 'noMana', value: true });
    assert.equal(h.run('rooms[rid].players[sid].debugNoMana'), true);
    s.send('debugProgress', { classId: 'warrior', level: 40 });
    assert.equal(h.progress['test-owner'].heroes.warrior.level, 40);
    s.send('testTool', { op: 'god', on: true });
    assert.equal(h.run('curRoom = rooms[rid]; socketGod(rooms[rid].players[sid])'), true);
    h.run('const m = rooms[rid].players[sid].squad[0]; m.hp = 100; dealDamage(m, 1000, rooms[rid].players[sid]);');
    assert.equal(h.run('m.hp'), 100);
    h.run("rooms[rid].stage = { id: 'c1-01', diff: 'story', classes: ['warrior'], key: 'test-owner', socketId: sid }; rooms[rid].stageApplied = false");
    s.send('testTool', { op: 'battleWin' });
    assert.equal(s.last('battleEnd').winnerId, s.id);
    assert.equal(s.last('stageResult').win, true);
    assert.equal(h.progress['test-owner'].campaign.cleared.story['c1-01'], true);
    assert.ok(s.last('stageResult').rewards.gold > 0);
    s.send('testTool', { op: 'battleWin' });
    assert.equal(s.last('testToolResult').ok, false);
    h.run("rooms[rid].winner = null; rooms[rid].stageApplied = false; for (const p of Object.values(rooms[rid].players)) for (const m of p.squad) { m.alive = true; m.hp = 100; }");
    s.send('testTool', { op: 'battleLose' });
    assert.equal(s.last('battleEnd').loserId, s.id);
    assert.equal(s.last('stageResult').win, false);
});
