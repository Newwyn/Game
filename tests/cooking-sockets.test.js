// 🍲 Nấu ăn / túi đồ ăn / dụng cụ / câu cá qua socket thật của server.js (chạy server.js trong vm như tests/accounts-sockets.test.js)
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
    const accounts = { resume: () => ({ ok: false }), logout: () => ({ ok: true, user: null }) };
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
/** người chơi đã mở Nấu ăn, đứng trong bếp cô Lena, có sẵn nguyên liệu */
function cookPlayer() {
    const h = harness(), s = h.socket({ clientId: 'cook-tester' });
    s.send('worldOpen');
    const pr = h.progress['cook-tester'];
    pr.flags.nguyen_lieu_lena = true; pr.account.level = 20;
    pr.world.scene = 'tavern_in'; pr.world.x = 7; pr.world.y = 5;
    pr.world.mats = { lua: 10, muoi: 5, trung: 3, thit: 4, go: 20, dong: 20 };
    h.context.sid = s.id; h.context.rid = s.roomId;
    return { h, s, pr };
}

test('nấu ở bếp, mua đồ, xếp túi qua socket; đứng ngoài bếp không nấu / không mua được', () => {
    const { s, pr } = cookPlayer();
    s.send('cookOpen');
    const st = s.last('cookState');
    assert.deepEqual([st.unlocked, st.atCook, st.kitchen, st.atBench], [true, true, true, false]);
    assert.equal(st.recipes.length, 10);
    s.send('cookDo', { id: 'chao', n: 2 });
    assert.deepEqual([s.last('cookResult').ok, s.last('cookResult').cooked.n, pr.world.dishes.chao, pr.world.mats.lua], [true, 2, 2, 6]);
    s.send('cookDo', { id: 'sup_hoi_sinh', n: 1 });
    assert.equal(s.last('cookResult').ok, false);
    const gold = pr.wallet.gold;
    s.send('cookBuy', { id: 'sua', n: 2 });
    assert.deepEqual([pr.world.mats.sua, pr.wallet.gold], [2, gold - 80]);
    s.send('pouchSet', { list: ['chao', 'chao', 'chao'] });
    assert.deepEqual(s.last('cookState').pouch, ['chao', 'chao']);
    s.send('pouchSet', { list: ['chao', 'chao', 'chao', 'chao'] });
    assert.equal(s.last('cookResult').ok, false);
    // ra ngoài đường: không nấu, không mua
    pr.world.scene = 'ashford';
    s.send('cookDo', { id: 'chao', n: 1 });
    assert.match(s.last('cookResult').text, /bếp hoặc lửa trại/);
    s.send('cookBuy', { id: 'muoi', n: 1 });
    assert.match(s.last('cookResult').text, /bếp cô Lena/);
    assert.deepEqual([pr.world.dishes.chao, pr.world.mats.muoi], [2, 3]);
    // lửa trại ngoài Ngoại ô nấu được
    pr.world.scene = 'outskirts';
    s.send('cookDo', { id: 'chao', n: 1 });
    assert.equal(pr.world.dishes.chao, 3);
    // bảng túi đồ / bảng chọn ải có nguyên liệu + món
    s.send('heroPanelOpen');
    assert.equal(s.last('heroPanel').pack.dishes[0].n, 3);
    s.send('campaignOpen', {});
    assert.deepEqual(s.last('campaignState').meals.pouch, ['chao', 'chao']);
});

test('rèn dụng cụ chỉ ở bàn dụng cụ trong lò rèn', () => {
    const { s, pr } = cookPlayer();
    pr.world.tools = { pick: 1 }; pr.wallet.gold = 1000;
    s.send('toolCraft', { tool: 'pick' });
    assert.match(s.last('cookResult').text, /bàn dụng cụ/);
    assert.equal(pr.world.tools.pick, 1);
    pr.world.scene = 'forge_in';
    s.send('toolCraft', { tool: 'pick' });
    assert.deepEqual([s.last('cookResult').ok, pr.world.tools.pick, pr.wallet.gold, pr.world.mats.go], [true, 2, 600, 14]);
    assert.equal(s.last('cookState').tools.find(t => t.id === 'pick').tierName, 'Cuốc sắt');
});

test('trong ải: túi mang vào trận, ăn hồi máu thật, món tủ +50%, hồi chung 8 giây, mỗi món 1 lần, trừ món đúng 1 lần', () => {
    const { h, s, pr } = cookPlayer();
    pr.world.scene = 'tavern_in';
    pr.world.quests.s_bay = 'done';
    s.send('cookDo', { id: 'chao', n: 2 });
    s.send('cookDo', { id: 'thit_nuong', n: 1 });
    s.send('pouchSet', { list: ['chao', 'thit_nuong', 'chao'] });
    s.send('startStage', { id: 'c1-01', diff: 'story', classes: ['warrior'] });
    const start = s.last('battleStart');
    assert.deepEqual(start.pouch.slots.map(x => [x.id, x.used]), [['chao', false], ['thit_nuong', false], ['chao', false]]);
    assert.equal(start.pouch.slots[1].fav, 'warrior');
    s.send('useDish', { slot: 0, memberIndex: 0 });
    assert.match(s.last('dishResult').text, /Chờ trận bắt đầu/);
    assert.equal(pr.world.dishes.chao, 2);
    h.run("rooms[rid].status = 'active'; rooms[rid].clock = 100000; me = rooms[rid].players[sid].squad[0]; me.hp = Math.round(me.maxHp * 0.3); hp0 = me.hp;");
    s.send('useDish', { slot: 0, memberIndex: 0 });
    const used = s.last('dishUsed');
    assert.equal(used.healed, Math.round(h.run('me.maxHp') * 0.2));
    assert.equal(h.run('me.hp - hp0'), used.healed);
    assert.equal(pr.world.dishes.chao, 1);
    assert.equal(used.pouch.slots[0].used, true);
    // còn hồi chung: bị chặn, không trừ món
    s.send('useDish', { slot: 1, memberIndex: 0 });
    assert.match(s.last('dishResult').text, /Chờ \d giây/);
    assert.equal(pr.world.dishes.thit_nuong, 1);
    // hết 8 giây: Rok ăn món tủ -> +15% × 1,5 tấn công trong 10 giây
    h.run('rooms[rid].clock += 8000; atk0 = getEffectiveStats(me, rooms[rid].clock).stats.pAtk;');
    s.send('useDish', { slot: 1 });   // không chọn người: tự chọn người ít máu nhất (đội 1 người = Rok)
    assert.deepEqual([s.last('dishUsed').memberIndex, s.last('dishUsed').fav], [0, true]);
    assert.equal(h.run('getEffectiveStats(me, rooms[rid].clock).stats.pAtk'), Math.floor(h.run('atk0') * 1.225));
    assert.equal(h.run('getEffectiveStats(me, rooms[rid].clock + 10001).stats.pAtk'), h.run('atk0'));
    // ô đã dùng không dùng lại
    h.run('rooms[rid].clock += 8000');
    s.send('useDish', { slot: 0, memberIndex: 0 });
    assert.match(s.last('dishResult').text, /đã dùng/);
    s.send('useDish', { slot: 2, memberIndex: 0 });
    assert.deepEqual([pr.world.dishes.chao, pr.world.dishes.thit_nuong], [undefined, undefined]);
    assert.deepEqual(pr.world.pouch, []);
    assert.equal(s.events.filter(([e]) => e === 'dishUsed').length, 3);                     // tối đa 3 món mỗi trận
});

test('Đấu / Test không có túi đồ ăn: bấm dùng món bị từ chối và không mất món', () => {
    const { h, s, pr } = cookPlayer();
    s.send('cookDo', { id: 'chao', n: 2 });
    s.send('pouchSet', { list: ['chao', 'chao'] });
    for (const mode of ['duel_monster', 'test']) {
        h.run("rooms[rid].status = 'menu'");
        s.send('chooseMode', { mode });
        s.send('confirmSquad', { classes: ['warrior'] });
        assert.equal(s.last('battleStart').mode, mode);
        assert.equal(s.last('battleStart').pouch, undefined);
        h.run("rooms[rid].status = 'active'");
        s.send('useDish', { slot: 0, memberIndex: 0 });
        assert.match(s.last('dishResult').text, /không dùng được món ăn/);
        assert.equal(pr.world.dishes.chao, 2);
    }
    // hầm ngục cũng không
    h.run("rooms[rid].status = 'menu'; rooms[rid].winner = null");
    assert.equal(h.run("CK.battlePouch(progressOf('cook-tester'), 'campaign', 'dungeon-set-1').slots.length"), 0);
});

test('câu cá qua socket: báo trúng thì có cá, vượt lượt bị chặn', () => {
    const { s, pr } = cookPlayer();
    pr.world.tools = { rod: 1 };
    for (let i = 0; i < 3; i++) { s.send('worldFish', { scene: 'forest', target: 'f_rung', quality: 'good' }); assert.equal(s.last('worldFishResult').ok, true); }
    const fish = (pr.world.mats.ca_chep ?? 0) + (pr.world.mats.ca_bac ?? 0);
    assert.equal(fish, 3);
    s.send('worldFish', { scene: 'forest', target: 'f_rung', quality: 'perfect' });
    assert.equal(s.last('worldFishResult').ok, false);
    s.send('worldFish', { scene: 'forest', target: 'f_sau', quality: 'perfect' });
    assert.match(s.last('worldFishResult').text, /Cần câu sắt/);
});
