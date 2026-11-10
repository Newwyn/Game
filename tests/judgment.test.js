const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const rules = require('../game/judgment');
const realRequire = createRequire(path.join(__dirname, '../server.js'));
function harness(diff = 'story') {
    const events = [];
    const sockets = new Map();
    const context = vm.createContext({ console: { log() {} }, process: { env: {} }, Buffer,
        __dirname: path.join(__dirname, '..'), setInterval: () => 1, clearInterval() {}, setTimeout: () => 1,
        require: id => id === './game/accounts' ? { createAccounts: () => ({}) }
            : id === './progression' ? { ...realRequire(id), loadAll: () => ({}), saveAll() {} }
            : id === 'socket.io' ? { Server: function () { return { on() {}, sockets: { sockets }, to: () => ({ emit: (name, data) => events.push({ name, data }) }) }; } }
            : id === 'http' ? { createServer: () => ({ listen() {} }) } : realRequire(id) });
    const run = code => vm.runInContext(code, context);
    run(fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8'));
    run(`var boss = createMonsterSquad(19, [['b_valdric', 0, 0]])[0];
        var hero = createMonsterSquad(19, [['c1_wolf', 1, 0]])[0];
        var room = { id: 'fixture', mode: 'campaign', status: 'active', clock: 10000,
            stage: { diff: '${diff}' }, stageApplied: true,
            players: { npc: { isNPC: true, squad: [boss] }, player: { squad: [hero] } } };
        rooms.fixture = room; curRoom = room;
        boss.bossCasts = 3; boss.judgmentReadyAt = room.clock;`);
    return { run, events, sockets };
}
test('pure shield, blast and three-cast rules', () => {
    assert.equal(rules.shieldDamage(100, 1000, false), 100);
    assert.equal(rules.shieldDamage(100, 1000, true), 350);
    assert.equal(rules.blastDamage(1000, 'story'), 600);
    assert.equal(rules.blastDamage(1000, 'hard'), 850);
    assert.equal(rules.blastDamage(1000, 'hell'), 1000);
    let n = 0;
    for (let i = 1; i <= 3; i++) { n = rules.nextCast(n); assert.equal(rules.ultimateReady(n), i === 3); }
});
test('central damage absorbs delayed hits and overflow; break stuns and increases subsequent damage', () => {
    const h = harness();
    h.run(`processJudgment(room, 'npc', 0, 'player', room.clock); var hp = boss.hp; var shield = boss.ult.shield;
        dealDamage(boss, 10, room.players.npc, 100, null, hero, { cc: true });`);
    assert.equal(h.run('boss.ult.shield'), h.run('shield'));
    h.run('room.clock += 100; runPending(room, room.clock)');
    assert.equal(h.run('boss.hp'), h.run('hp'));
    assert.equal(h.run('shield - boss.ult.shield'), rules.shieldDamage(10, h.run('shield'), true));
    h.run('dealDamage(boss, 100000, room.players.npc)');
    assert.equal(h.run('boss.ult'), null);
    assert.equal(h.run('boss.hp'), h.run('hp'));
    assert.equal(h.run("boss.statusEffects.find(e => e.type === 'stun').endTime - room.clock"), 2500);
    h.run('dealDamage(boss, 100, room.players.npc)');
    assert.equal(h.run('hp - boss.hp'), 125);
    assert.equal(h.events.filter(e => e.data.phase === 'break').length, 1);
});
test('channel respects lock/stun, completes once, and god modes protect from hell', () => {
    for (const god of ['none', 'debug', 'socket']) {
        const h = harness('hell');
        if (god === 'debug') h.run('room.players.player.debugGodMode = true');
        if (god === 'socket') h.sockets.set('player', { testGod: true });
        h.run("boss.actionUntil = room.clock + 100; processJudgment(room, 'npc', 0, 'player', room.clock)");
        assert.equal(h.run('!!boss.ult'), false);
        h.run("room.clock += 100; processJudgment(room, 'npc', 0, 'player', room.clock); var hp = hero.hp;");
        h.run("processJudgment(room, 'npc', 0, 'player', room.clock + 4999)");
        assert.equal(h.run('hero.hp'), h.run('hp'));
        h.run("room.clock += 5000; processJudgment(room, 'npc', 0, 'player', room.clock)");
        assert.equal(h.events.filter(e => e.data.phase === 'leap').length, 1);   // nhảy lên trước, chưa trừ máu
        assert.equal(h.run('hero.hp'), h.run('hp'));
        assert.equal(h.run('damageJudgmentShield(boss, 999999, true) && boss.ult.shield > 0'), true);   // đang nhảy: không phá khiên được nữa
        h.run(`room.clock += ${rules.JUDGMENT.slamMs}; processJudgment(room, 'npc', 0, 'player', room.clock)`);
        assert.equal(h.run('hero.hp'), god === 'none' ? 0 : h.run('hp'));
        assert.equal(h.events.filter(e => e.data.phase === 'blast').length, 1);
    }
});
test('campaign timer pauses, loses once, cancels channel, resets and excludes other modes', () => {
    const h = harness();
    h.run("processJudgment(room, 'npc', 0, 'player', room.clock); processStageTimer(room)");
    assert.equal(h.events.at(-1).data.leftMs, 180000);
    h.run("room.status = 'paused'; processStageTimer(room)");
    assert.equal(h.run('room.winner'), undefined);
    h.run("room.status = 'active'; room.clock += 180000; processStageTimer(room); processStageTimer(room)");
    assert.equal(h.run('room.winner'), 'npc');
    assert.equal(h.run('boss.ult'), null);
    assert.equal(h.events.filter(e => e.name === 'battleEnd').length, 1);
    assert.equal(h.events.find(e => e.name === 'battleEnd').data.timeout, true);
    h.run('room.winner = null; startBattleLoop(room.id); processStageTimer(room)');
    assert.equal(h.events.at(-1).data.leftMs, 180000);
    for (const mode of ['test', 'duel_monster', 'duel_hero', 'prologue', 'menu']) {
        const count = h.events.length;
        h.run(`room.mode = '${mode}'; room.clock += 180000; processStageTimer(room)`);
        assert.equal(h.events.length, count);
    }
});
test('third cast is ring, both forms can seal, and sealed heroes cannot use skills', () => {
    const h = harness();
    h.run("boss.bossCasts = 2; boss.bossTimers = { pillars: 0, ring: 0 }; processBossSkills(room, 'npc', 0, 'player', room.clock)");
    assert.equal(h.events.find(e => e.name === 'bossFx').data.skill, 'ring');
    h.run('room.clock += 1200; runPending(room, room.clock)');
    assert.equal(h.run('boss.bossCasts'), 3);
    h.run("hero.statusEffects.push({ type: 'sealed', endTime: room.clock + 2000 })");
    assert.equal(h.run('skillUsable(hero, 0)'), false);
    h.run('room.clock += 2000');
    assert.equal(h.run('skillUsable(hero, 0)'), true);
});
test('timeout follows normal stage loss flow and reports timeout on stageResult', () => {
    const h = harness();
    h.run(`room.stageApplied = false;
        room.stage = { id: 'c1-20', diff: 'story', classes: ['warrior'], key: 'timeout-fixture', socketId: 'player' };
        progressOf('timeout-fixture'); processStageTimer(room);
        room.clock += 180000; processStageTimer(room); processStageTimer(room);`);
    const results = h.events.filter(e => e.name === 'stageResult');
    assert.equal(results.length, 1);
    assert.equal(results[0].data.timeout, true);
    assert.equal(results[0].data.win, false);
});
test('shield events flush the last hit, cancel on death, and second form can channel again', () => {
    const h = harness();
    h.run("processJudgment(room, 'npc', 0, 'player', room.clock); damageJudgmentShield(boss, 1, false); damageJudgmentShield(boss, 2, false)");
    assert.equal(h.events.filter(e => e.data.phase === 'shield').length, 1);
    h.run("room.clock += 100; processJudgment(room, 'npc', 0, 'player', room.clock)");
    assert.equal(h.events.filter(e => e.data.phase === 'shield').at(-1).data.hit, 2);
    h.run('killMember(boss, room.players.npc.squad)');
    assert.equal(h.events.filter(e => e.data.phase === 'cancel').length, 1);
    assert.equal(h.run('boss.phase2On'), true);
    h.run("room.clock += 3000; boss.bossCasts = 3; boss.judgmentReadyAt = room.clock; processJudgment(room, 'npc', 0, 'player', room.clock)");
    assert.equal(h.run('!!boss.ult'), true);
});
