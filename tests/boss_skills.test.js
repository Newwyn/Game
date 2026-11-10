const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../server.js'), 'utf8');
const pure = source.split('// BOSS_SKILLS_BEGIN')[1].split('// BOSS_SKILLS_END')[0];
const { BOSS_SKILLS, bossNextTime, bossTargets, bossInShape } = vm.runInNewContext(pure.slice(pure.indexOf('\n')) + '\n;({ BOSS_SKILLS, bossNextTime, bossTargets, bossInShape })', { JUDGMENT: require('../game/judgment').JUDGMENT });
test('mọi trùm (5 trùm chương 1 + 4 trùm chương 2) có 2 chiêu có tên, hợp lệ, có cảnh báo trước', () => {
    assert.equal(Object.keys(BOSS_SKILLS).length, 9);
    for (const skills of Object.values(BOSS_SKILLS)) {
        assert.equal(skills.length, 2);
        for (const sk of skills) {
            assert.ok(sk.name && !sk.name.includes('?'));
            assert.ok(sk.warning >= 1000 && sk.cooldown > sk.warning);
            for (const value of Object.values(sk)) if (typeof value === 'number') assert.ok(Number.isFinite(value) && value > 0);
        }
    }
});
test('clock deadlines are stable while paused and phase two starts its own cooldown', () => {
    const howl = BOSS_SKILLS.b_wolf[0], ring = BOSS_SKILLS.b_valdric[1];
    assert.equal(bossNextTime(howl, 100, undefined, false), 100 + howl.first);
    assert.equal(bossNextTime(howl, 4000, 100 + howl.first, false), 100 + howl.first);
    assert.equal(bossNextTime(ring, 5000, undefined, false), 15000);
    assert.equal(bossNextTime(ring, 5000, undefined, true), 15000);
});
test('target selection uses HP percentage, attack, distance, unique random living heroes', () => {
    const squad = [
        { alive: true, hp: 20, maxHp: 100, pAtk: 10, mAtk: 2, x: 1, z: 0 },
        { alive: true, hp: 30, maxHp: 300, pAtk: 2, mAtk: 40, x: 5, z: 0 },
        { alive: false, hp: 0, maxHp: 100, pAtk: 100, mAtk: 0, x: 20, z: 0 },
        { alive: true, summon: true, hp: 1, maxHp: 100, pAtk: 200, mAtk: 0, x: 30, z: 0 }];
    for (const mode of ['weak', 'attack', 'far']) assert.equal(bossTargets(squad, mode, {x: 0, z: 0})[0].i, 1);
    const picked = bossTargets(squad, 'random', {x: 0, z: 0}, 3, () => 0);
    assert.equal(picked.length, 2); assert.equal(new Set(picked.map(t => t.i)).size, 2);
});
test('fixed circle and finite line warnings match impact boundaries', () => {
    const circle = {x: 0, z: 0, radius: 3.5};
    assert.ok(bossInShape({x: 3.5, z: 0}, circle));
    assert.ok(!bossInShape({x: 3.6, z: 0}, circle));
    const line = {kind: 'line', x: 0, z: 0, toX: 10, toZ: 0, width: 2};
    assert.ok(bossInShape({x: 5, z: 1}, line));
    assert.ok(!bossInShape({x: 11, z: 0}, line));
    assert.ok(!bossInShape({x: 5, z: 1.1}, line));
});

test('runtime uses game-clock scheduling, caps wolves, and cancels dead boss casts', () => {
    const runtime = source.slice(source.indexOf('function processBossSkills('), source.indexOf('function checkBossPhase('));
    const queue = [], events = [];
    const boss = {classId: 'b_wolf', alive: true, level: 12, x: 0, z: 0, statusEffects: []};
    const hero = {alive: true, hp: 100, maxHp: 100, pAtk: 20, mAtk: 0, x: 5, z: 0};
    const room = {id: 'test', clock: 0, players: {boss: {squad: [boss]}, hero: {squad: [hero]}}};
    const context = {
        BOSS_SKILLS, bossTargets, bossNextTime, bossInShape,
        io: {to: () => ({emit: (name, d) => events.push(d)})},
        later: (delay, fn) => queue.push(fn),
        createMonsterSquad: () => [{alive: true, hp: 100, maxHp: 100, pAtk: 10, mAtk: 0, pDef: 10, mDef: 10, crit: 10, critDmg: 1500, acc: 1000, dodge: 0, pen: 0, block: 0, lifesteal: 0, moveSpeed: 1, atkSpeed: 1000}],
        clampToArena: () => {},
    };
    const process = vm.runInNewContext(runtime + ';processBossSkills', context);
    process(room, 'boss', 0, 'hero', 0);
    assert.equal(queue.length, 0);
    const howl = BOSS_SKILLS.b_wolf[0];   // số lấy từ bảng (chỉnh cân bằng không phải sửa bài kiểm tra)
    for (let cast = 0; cast < howl.maxSummons + 1; cast++) {
        const now = howl.first + cast * howl.cooldown;
        boss.bossTimers.pounce = Infinity;
        room.clock = now;
        process(room, 'boss', 0, 'hero', now);
        assert.equal(events.at(-1).kind, 'warning');
        room.clock += 1000; queue.shift()();
    }
    assert.equal(room.players.boss.squad.length, 1 + howl.maxSummons);   // gọi thêm 1 lần nữa vẫn không vượt giới hạn
    assert.equal(room.players.boss.squad[1].hp, 100 * howl.scale);
    room.clock = howl.first + (howl.maxSummons + 1) * howl.cooldown;
    process(room, 'boss', 0, 'hero', room.clock);
    boss.alive = false;
    const before = events.length;
    queue.shift()();
    assert.equal(events.length, before);
    process(room, 'boss', 0, 'hero', 100000);
    assert.equal(queue.length, 0);
});
