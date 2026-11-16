// Nyx (Hư Không, classId `voidmage`) — luật trận phía máy chủ. Nạp server.js trong node:vm như tests/judgment.test.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const SHOP = require('../game/shop');
const realRequire = createRequire(path.join(__dirname, '../server.js'));
const SOURCE = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

/** Máy chủ trong vm: socket.io / http giả, Math.random cố định (0.5: không né, không chí mạng tự nhiên, không chặn đòn). */
function harness() {
    const events = [];
    const sockets = new Map();
    const ticks = [];
    const context = vm.createContext({ console: { log() {} }, process: { env: {} }, Buffer,
        __dirname: path.join(__dirname, '..'), setInterval: fn => ticks.push(fn), clearInterval() {}, setTimeout: () => 1,
        require: id => id === './game/accounts' ? { createAccounts: () => ({}) }
            : id === './progression' ? { ...realRequire(id), loadAll: () => ({}), saveAll() {} }
            : id === 'socket.io' ? { Server: function () { return { on() {}, sockets: { sockets }, to: () => ({ emit: (name, data) => events.push({ name, data }) }) }; } }
            : id === 'http' ? { createServer: () => ({ listen() {} }) } : realRequire(id) });
    const run = code => vm.runInContext(code, context);
    run(SOURCE);
    run('var __rnd = 0.5; Math.random = () => __rnd;');
    // sự kiện voidFx (chép qua JSON: đối tượng tạo trong vm khác "realm" nên deepEqual chặt không so được trực tiếp)
    const fx = kind => events.filter(e => e.name === 'voidFx' && (!kind || e.data.kind === kind)).map(e => JSON.parse(JSON.stringify(e.data)));
    return { run, events, sockets, ticks, fx };
}

test('voidmage: có trong CLASS_DEFS, SQUAD_ORDER, cửa hàng 1000 Kim Cương, 3 kỹ năng 1/2/3 Orb', () => {
    const h = harness();
    const def = JSON.parse(h.run('JSON.stringify(CLASS_DEFS.voidmage ?? null)'));
    assert.ok(def, 'CLASS_DEFS.voidmage');
    assert.deepEqual([def.name, def.title, def.className, def.dmgType, def.classGroup, def.race], ['Nyx', 'Hư Không', 'Phù Thủy', 'magic', 'mage', 'goblin']);
    // chỉ số gốc cấp 1 (spec 6.2)
    const want = { maxHp: 900, maxMp: 5000, pAtk: 0, mAtk: 230, pDef: 35, mDef: 80, crit: 150, critDmg: 500, acc: 1000, dodge: 110, pen: 100, block: 0,
        lifesteal: 0, threat: 100, mpAtk: 200, mpSec: 130, atkSpeed: 1100, range: 'ranged', atkRange: 13, moveSpeed: 0.01 };
    for (const [k, v] of Object.entries(want)) assert.equal(def[k], v, k);
    assert.equal(h.run('SQUAD_ORDER.at(-1)'), 'voidmage');
    assert.equal(SHOP.PRICES.voidmage, 1000);
    assert.deepEqual(def.skills.map(s => [s.name, s.type, s.orbCost, s.cooldown]), [
        ['Ma Đạn Tinh Tú', 'void_missiles', 1, 7000], ['Sao Rơi', 'void_starfall', 2, 16000], ['Hố Đen', 'void_blackhole', 3, 24000]]);
    assert.deepEqual(def.passives.map(p => [p.name, p.type, p.talent]), [['Xói Mòn Hư Không', 'void_erosion', 1], ['Vỏ Hư Không', 'void_shell', 2]]);
    assert.deepEqual(def.passives[0].levels.value, [0.06, 0.08, 0.10]);
    assert.deepEqual(def.passives[1].levels, { value: [0.30, 0.45], revive: [0.30, 0.50] });
    // vào trận được như mọi anh hùng: đội chỉ có Nyx, kỹ năng nhân theo bậc, thiên phú mở theo cấp
    h.run("var squad = createSquad('left', SQUAD_ORDER.filter(c => c !== 'voidmage'), { voidmage: { level: 60, rank: 3 } })");
    assert.equal(h.run('squad.length'), 1);
    assert.equal(h.run('squad[0].classId'), 'voidmage');
    assert.deepEqual(JSON.parse(h.run('JSON.stringify(squad[0].passives.map(p => [p.type, p.value, p.revive ?? null]))')), [['void_erosion', 0.10, null], ['void_shell', 0.45, 0.50]]);
    assert.equal(h.run('squad[0].skills[0].multiplier'), 3.85);   // ×2.2 bậc SSS (×1.75)
    // mô tả thiên phú điền đủ số (không còn dấu ?)
    const talents = JSON.parse(h.run("JSON.stringify(talentInfo(CLASS_DEFS.voidmage, { level: 60, rank: 3 }))"));
    assert.equal(talents.length, 2);
    for (const t of talents) assert.ok(t.desc && !t.desc.includes('?') && !t.desc.includes('{'), t.desc);
    assert.match(talents[0].desc, /10%/);
    assert.match(talents[1].desc, /45%/); assert.match(talents[1].desc, /50%/);
});

/**
 * Phòng trận thử: Nyx (phe trái, đứng ở gốc toạ độ, đầy Orb) đấu với đội quái `foes` ([classId, x, z]).
 * Trong vm có sẵn: room, team, foes, nyx, T0 (lúc bắt đầu) · cast(i) dùng kỹ năng i ngay · at(ms) đẩy đồng hồ trận tới T0 + ms
 * (chạy các việc đã hẹn + processVoid nếu có) · hits: mọi lần gọi hitTarget (hệ số, lúc đánh, ép chí mạng...).
 */
function arena(h, { level = 1, rank = 0, foes = [['c1_wolf', 6, 0]], foeLevel = 1, foeHeroes = null, allies = [] } = {}) {
    const mine = ['voidmage', ...allies];   // Nyx luôn đứng cuối đội (SQUAD_ORDER) -> lấy theo classId
    h.run(`var team = createSquad('left', SQUAD_ORDER.filter(c => !${JSON.stringify(mine)}.includes(c)),
            Object.fromEntries(${JSON.stringify(mine)}.map(c => [c, { level: ${level}, rank: ${rank} }])));
        var foes = ${foeHeroes ? `createSquad('right', SQUAD_ORDER.filter(c => !${JSON.stringify(foeHeroes)}.includes(c)),
            Object.fromEntries(${JSON.stringify(foeHeroes)}.map(c => [c, { level: ${foeLevel}, rank: 0 }])))` : `createMonsterSquad(${foeLevel}, ${JSON.stringify(foes)})`};
        var foe = (classId) => foes.find(e => e.classId === classId);
        var room = { id: 'fixture', mode: 'test', status: 'active', clock: 100000, speed: 1.5,
            players: { p1: { side: 'left', squad: team }, p2: { side: 'right', isNPC: true, squad: foes } } };
        rooms.fixture = room; curRoom = room;
        var nyx = team.find(m => m.classId === 'voidmage'), NI = team.indexOf(nyx); nyx.x = 0; nyx.z = 0; nyx.mp = nyx.maxMp;
        var T0 = room.clock;
        var hits = []; var __hitTarget = hitTarget;
        hitTarget = function (attacker, target, ti, opp, mult, now, opts) {
            const r = __hitTarget.apply(this, arguments);
            hits.push({ by: attacker.classId, ti, mult, at: now - T0, force: !!(opts && opts.forceCrit), aoe: !!(opts && opts.aoe), ground: !!(opts && opts.ground),
                isCrit: r.isCrit, isMiss: r.isMiss, damage: r.damage });
            return r;
        };
        function cast(i) { curRoom = room; executeSkill('fixture', 'p1', NI, 'p2', i); }
        function at(ms) {
            room.clock = T0 + ms; curRoom = room; runPending(room, room.clock);
            if (typeof processVoid === 'function') processVoid(room, 'p1', NI, 'p2', room.clock);
        }
        function upTo(ms) { while (room.clock < T0 + ms) at(Math.min(ms, room.clock - T0 + 50)); }   // đi từng nhịp 50 ms như vòng lặp trận`);
}
/** Chạy VÒNG LẶP TRẬN THẬT (startBattleLoop) với đồng hồ giả: mỗi nhịp 50 ms trận. tick(n) chạy n nhịp. */
function realLoop(h) {
    h.run("var __now = 5000000; Date.now = () => __now; room.lastReal = __now; startBattleLoop('fixture');");
    const loop = h.ticks.at(-1);
    return (n = 1) => { for (let i = 0; i < n; i++) { h.run('__now += 50'); loop(); } };
}
const json = (h, code) => JSON.parse(h.run(`JSON.stringify(${code})`));

test('void_starfall: 4 đợt ở 3000/3500/4000/4500 ms, mỗi đợt ×0.9 bán kính 5.5 quanh cụm đông nhất, choáng 500 ms, đợt 2 và 4 isCrit === true', () => {
    const h = harness();
    // cụm 3 con sói quanh (10, 0) + 1 con đứng lẻ ở (21, 0)
    arena(h, { foes: [['c1_wolf', 10, 0], ['c1_wolf', 11, 1], ['c1_wolf', 10.5, -1], ['c1_wolf', 21, 0]] });
    h.run('cast(1)');
    assert.deepEqual(h.fx('channel'), [{ casterId: 'p1', casterIdx: 0, kind: 'channel', skill: 'starfall', duration: 5000, shell: false }]);
    assert.equal(h.run('voidChannel(nyx, room.clock).skill'), 'starfall');
    assert.equal(h.run('nyx.actionUntil - T0'), 5000);                 // đứng niệm đủ 5 giây
    assert.equal(h.run('nyx.skillCooldowns[1] - T0'), 5000 + 16000);   // hồi chiêu tính sau khi niệm xong
    // vùng rơi chọn lúc đợt đầu sắp rơi (giây thứ 3), không phải lúc bấm: cả cụm dời +3 ô sau khi Nyx đã niệm 1 giây
    h.run('at(1000); foes.slice(0, 3).forEach(e => { e.x += 3; })');
    h.run('at(2999)');
    assert.equal(h.fx('starWave').length, 0);
    assert.equal(h.run('foes[0].hp'), h.run('foes[0].maxHp'));
    for (const [n, ms] of [[1, 3000], [2, 3500], [3, 4000], [4, 4500]]) {
        h.run(`at(${ms - 1})`);
        assert.equal(h.fx('starWave').length, n - 1, `chưa tới đợt ${n}`);
        h.run(`at(${ms})`);
        const waves = h.fx('starWave');
        assert.equal(waves.length, n, `đợt ${n} ở ${ms} ms`);
        const w = waves.at(-1);
        assert.equal(w.n, n);
        assert.equal(w.radius, 5.5);
        assert.deepEqual(w.effects.map(e => e.targetIndex).sort(), [0, 1, 2]);   // con đứng lẻ (cách tâm > 5.5) không trúng
        const mine = json(h, `hits.filter(x => x.at === ${ms})`);
        assert.equal(mine.length, 3);
        for (const x of mine) {
            assert.equal(x.mult, 0.9);
            assert.equal(x.aoe, true);
            assert.equal(x.force, n === 2 || n === 4);
            assert.equal(x.isCrit, n === 2 || n === 4);
            assert.ok(x.damage > 0);
        }
        for (const e of w.effects) assert.equal(e.isCrit, n === 2 || n === 4);
        // choáng 500 ms tính từ lúc đợt sao rơi
        for (const i of [0, 1, 2]) assert.equal(h.run(`foes[${i}].statusEffects.some(s => s.type === 'stun' && s.endTime === T0 + ${ms} + 500)`), true);
        if (n === 1) h.run('foes.slice(0, 3).forEach(e => { e.z += 1; })');   // đã chọn vùng rồi thì không chọn lại
    }
    const waves = h.fx('starWave');
    assert.ok(Math.hypot(waves[0].x - 13.5, waves[0].z - 0) < 1, `tâm vùng rơi (${waves[0].x}, ${waves[0].z}) phải ở cụm đông nhất`);
    for (const w of waves) assert.deepEqual([w.x, w.z], [waves[0].x, waves[0].z]);
    // máu mất = tổng 4 đợt · con đứng lẻ nguyên vẹn, không choáng
    for (const i of [0, 1, 2]) {
        const total = waves.reduce((t, w) => t + w.effects.find(e => e.targetIndex === i).damage, 0);
        assert.equal(h.run(`foes[${i}].maxHp - foes[${i}].hp`), total);
    }
    assert.equal(h.run('foes[3].hp'), h.run('foes[3].maxHp'));
    assert.equal(h.run("foes[3].statusEffects.some(s => s.type === 'stun')"), false);
    // hết 5 giây: kênh kết thúc bình thường
    h.run('at(4999)');
    assert.equal(h.fx('channelEnd').length, 0);
    h.run('at(5000)');
    assert.deepEqual(h.fx('channelEnd'), [{ casterId: 'p1', casterIdx: 0, kind: 'channelEnd', reason: 'done' }]);
    assert.equal(h.run('voidChannel(nyx, room.clock)'), undefined);
    assert.equal(h.fx('starWave').length, 4);
    assert.equal(h.run('nyx.skillCooldowns[1] - T0'), 21000);
});

test('void_starfall: Nyx bị choáng ở 3200 ms (chưa có thiên phú 2) → chỉ 1 đợt rơi, skillCooldowns[1] > now, voidChannel === undefined', () => {
    const h = harness();
    arena(h, { foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 1]] });   // cọc gỗ: không đánh, không di chuyển
    const tick = realLoop(h);
    h.run('nyx.queuedSkills = [1]');
    tick(1);   // vòng lặp trận tự dùng Sao Rơi (trừ 2 Orb, vào hồi chiêu)
    assert.equal(h.fx('channel').length, 1);
    assert.equal(h.run('nyx.mp < nyx.maxMp - 1900'), true);
    h.run('var castAt = room.clock');
    tick(64);   // 3200 ms sau
    assert.equal(h.run('room.clock - castAt'), 3200);
    assert.equal(h.fx('starWave').length, 1);
    assert.equal(h.run('nyx.state'), 'acting');
    h.run('applyStun(nyx, 1000, room.clock)');
    tick(1);
    assert.equal(h.run('nyx.state'), 'stunned');
    assert.equal(h.run('voidChannel(nyx, room.clock)'), undefined);
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['stun']);
    assert.equal(h.run('nyx.skillCooldowns[1] > room.clock'), true);
    assert.equal(h.run('nyx.skillCooldowns[1] - room.clock'), 16000);   // hồi chiêu tính lại từ lúc bị ngắt
    tick(60);   // 3 giây nữa: hết choáng, các đợt 2-3-4 đã bị huỷ
    assert.equal(h.fx('starWave').length, 1);
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['stun']);
    assert.notEqual(h.run('nyx.state'), 'acting');                       // không kẹt actionUntil: hết choáng là đánh tiếp
    assert.notEqual(h.run('nyx.state'), 'stunned');
    assert.equal(h.run('nyx.lastAttackTime > castAt + 4200'), true);
});

test('void_starfall: Nyx chết ở 3200 ms → không đợt nào rơi thêm', () => {
    const h = harness();
    arena(h, { foes: [['c1_wolf', 8, 0], ['c1_wolf', 9, 1]] });
    h.run('cast(1); at(3200)');
    assert.equal(h.fx('starWave').length, 1);
    h.run('nyx.hp = 0; killMember(nyx, team)');
    assert.equal(h.run('nyx.alive'), false);
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['death']);
    assert.equal(h.run("nyx.statusEffects.some(e => e.type === 'void_channel')"), false);
    h.run('var hp = foes.map(e => e.hp); at(6000)');
    assert.equal(h.fx('starWave').length, 1);
    assert.deepEqual(json(h, 'foes.map(e => e.hp)'), json(h, 'hp'));
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['death']);   // không báo 'done' thêm lần nữa
    assert.equal(h.run('nyx.skillCooldowns[1] > T0 + 3200'), true);       // hồi chiêu vẫn chạy
});

test('void_missiles: mục tiêu mp 3000 → sau impact mp ∈ {1000, 2000}; sát thương chính theo ×2.2; đúng 9 nhịp sau đó (bắt đầu +400 ms, cách 65 ms), mỗi nhịp ×0.12, trúng cả đối thủ trong bán kính 3', () => {
    const seen = new Set();
    for (const rnd of [0.5, 0.2]) {   // 0.5 -> đốt 2 Orb · 0.2 -> đốt 1 Orb
        const h = harness();
        arena(h, { foeHeroes: ['warrior', 'archer', 'mage'] });
        h.run(`__rnd = ${rnd};
            var rok = foe('warrior'), lyra = foe('archer'), ignar = foe('mage'), RI = foes.indexOf(rok);
            Object.assign(rok, { x: 8, z: 0, mp: 3000 }); Object.assign(ignar, { x: 10, z: 0, mp: 500 }); Object.assign(lyra, { x: 8, z: 9, mp: 2000 });
            nyx.targetIndex = foes.indexOf(lyra); cast(0)`);
        const RI = h.run('RI');
        assert.deepEqual(h.fx('missiles'), [{ casterId: 'p1', casterIdx: 0, kind: 'missiles', targetId: 'p2', targetIndex: RI, flight: 600 }]);
        assert.equal(h.run('nyx.actionUntil - T0'), 700);
        assert.equal(h.run('nyx.skillCooldowns[0] - T0'), 700 + 7000);
        h.run('at(599)');
        assert.equal(h.fx('burst').length, 0);
        assert.equal(h.run('rok.mp'), 3000);
        assert.equal(h.run('rok.hp'), h.run('rok.maxHp'));
        h.run('at(600)');
        const burst = h.fx('burst');
        assert.equal(burst.length, 1);
        const mp = h.run('rok.mp');
        assert.ok(mp === 1000 || mp === 2000, `mp còn ${mp}`);
        seen.add(mp);
        assert.equal(burst[0].orbLost, (3000 - mp) / 1000);
        assert.deepEqual([burst[0].targetId, burst[0].targetIndex, burst[0].x, burst[0].z], ['p2', RI, 8, 0]);
        // cú trúng chính: 1 đòn đơn ×2.2 vào đúng mục tiêu
        const main = json(h, 'hits.filter(x => x.at === 600)');
        assert.deepEqual(main.map(x => [x.ti, x.mult, x.aoe]), [[RI, 2.2, false]]);
        assert.equal(burst[0].effects.length, 1);
        assert.ok(burst[0].effects[0].damage > 0);
        assert.equal(h.run('rok.maxHp - rok.hp'), burst[0].effects[0].damage);
        assert.equal(h.run('ignar.hp'), h.run('ignar.maxHp'));   // cú trúng chính không lan
        // Mana Burst: nhịp n nổ ở 600 + 400 + (n − 1) × 65 ms
        for (let n = 1; n <= 9; n++) {
            const ms = 600 + 400 + (n - 1) * 65;
            h.run(`at(${ms - 1})`);
            assert.equal(h.fx('burstTick').length, n - 1, `chưa tới nhịp ${n}`);
            h.run(`at(${ms})`);
            const ticks = h.fx('burstTick');
            assert.equal(ticks.length, n, `nhịp ${n} ở ${ms} ms`);
            assert.equal(ticks.at(-1).n, n);
            // trúng mục tiêu (Rok) + đối thủ trong bán kính 3 (Ignar cách 2); Lyra cách 9: không trúng
            assert.deepEqual(ticks.at(-1).effects.map(e => e.targetIndex).sort(), [RI, h.run('foes.indexOf(ignar)')].sort());
            for (const x of json(h, `hits.filter(x => x.at === ${ms})`)) assert.deepEqual([x.mult, x.aoe], [0.12, true]);
        }
        h.run('at(5000)');
        assert.equal(h.fx('burstTick').length, 9);   // đúng 9 nhịp, không hơn
        assert.equal(h.run('lyra.hp'), h.run('lyra.maxHp'));
        assert.equal(h.run('lyra.mp'), 2000);
        assert.equal(h.run('ignar.mp'), 500);        // chỉ mục tiêu bị đốt Orb
        assert.ok(h.run('ignar.hp') < h.run('ignar.maxHp'));
    }
    assert.deepEqual([...seen].sort(), [1000, 2000]);   // "ngẫu nhiên 1 hoặc 2 Orb": cả hai trường hợp đều xảy ra
});

test('void_missiles vào quái (maxMp 1000, mp 0): không lỗi, mp vẫn 0', () => {
    const h = harness();
    arena(h, { foes: [['c1_wolf', 7, 0], ['c1_wolf', 9, 0]] });
    assert.deepEqual(json(h, 'foes.map(e => [e.maxMp, e.mp])'), [[1000, 0], [1000, 0]]);
    h.run('nyx.targetIndex = 0; cast(0); at(600)');
    const burst = h.fx('burst');
    assert.equal(burst.length, 1);
    assert.equal(burst[0].targetIndex, 0);
    assert.equal(burst[0].orbLost, 0);
    assert.equal(h.run('foes[0].mp'), 0);
    assert.ok(h.run('foes[0].hp') < h.run('foes[0].maxHp'));
    h.run('at(3000)');
    assert.equal(h.fx('burstTick').length, 9);
    assert.equal(h.run('foes[0].mp'), 0);
    assert.ok(h.run('foes[1].hp') < h.run('foes[1].maxHp'));   // con đứng cách 2 ô ăn 9 nhịp Mana Burst
    // mục tiêu chết trước khi tia tới: không còn cú trúng chính, Mana Burst vẫn nổ tại chỗ đó
    h.run('nyx.skillCooldowns[0] = 0; nyx.targetIndex = 0; cast(0); foes[0].hp = 0; killMember(foes[0], foes); var hp1 = foes[1].hp; at(3600)');
    assert.equal(h.fx('burst').at(-1).effects.length, 0);
    h.run('at(9000)');
    assert.equal(h.fx('burstTick').length, 18);
    assert.ok(h.run('foes[1].hp') < h.run('hp1'));
});

test('void_missiles: chọn anh hùng địch nhiều Orb nhất; không ai có Orb thì chọn mục tiêu đang đánh', () => {
    const h = harness();
    arena(h, { foeHeroes: ['warrior', 'archer', 'mage'] });
    h.run(`var rok = foe('warrior'), lyra = foe('archer'), ignar = foe('mage');
        var idx = (e) => foes.indexOf(e);
        Object.assign(rok, { x: 6, z: 0 }); Object.assign(lyra, { x: 9, z: 3 }); Object.assign(ignar, { x: 11, z: -3 });
        function pick(mps, cur) { [rok.mp, lyra.mp, ignar.mp] = mps; nyx.targetIndex = idx(cur); nyx.skillCooldowns[0] = 0; cast(0); }`);
    const last = () => h.fx('missiles').at(-1).targetIndex;
    // Ignar nhiều Orb nhất -> bắn Ignar dù đang đánh Rok
    h.run('pick([1000, 2000, 4000], rok)');
    assert.equal(last(), h.run('idx(ignar)'));
    h.run('pick([3500, 2000, 1000], lyra)');
    assert.equal(last(), h.run('idx(rok)'));
    // không ai có đủ 1 Orb -> mục tiêu đang đánh
    h.run('pick([0, 0, 0], lyra)');
    assert.equal(last(), h.run('idx(lyra)'));
    h.run('pick([900, 0, 300], ignar)');
    assert.equal(last(), h.run('idx(ignar)'));
    // anh hùng nhiều Orb nhất đứng ngoài tầm chiêu (14): bỏ qua, chọn người nhiều Orb nhất trong tầm
    h.run('ignar.x = 30; pick([1000, 2000, 4000], rok)');
    assert.equal(last(), h.run('idx(lyra)'));
    // anh hùng đã gục / đang tàng hình không được chọn
    h.run("ignar.x = 11; ignar.alive = false; lyra.statusEffects.push({ type: 'stealth', endTime: room.clock + 5000 }); pick([1000, 2000, 4000], rok)");
    assert.equal(last(), h.run('idx(rok)'));
});

test('void_missiles: đấu với quái thì bắn mục tiêu đang đánh (quái không phải anh hùng, dù có MP)', () => {
    const h = harness();
    arena(h, { foes: [['c1_wolf', 7, 0], ['c1_wolf', 9, 3]] });
    h.run('foes[0].mp = 1000; nyx.targetIndex = 1; cast(0)');
    assert.equal(h.fx('missiles')[0].targetIndex, 1);
    // chưa có mục tiêu đang đánh -> con gần nhất
    h.run('nyx.targetIndex = -1; nyx.skillCooldowns[0] = 0; cast(0)');
    assert.equal(h.fx('missiles')[1].targetIndex, 0);
});

test('void_blackhole: đối thủ cách tâm 6 bị kéo lại gần tâm hơn sau 1 s (≈3 đơn vị); đối thủ cách 9 không bị kéo; 3 đợt ở 1200/2400/3600 ms ×1.1 trong bán kính 4; đối thủ ccImmune không đổi vị trí nhưng vẫn mất máu; mục tiêu isAirborne không trúng xúc tu', () => {
    const h = harness();
    // tâm hố đen = (10, 0): 0 đứng giữa · 1 đứng giữa nhưng đang bay · 2, 3 cách tâm 6 · 4 cách 3 và miễn khống chế · 5 cách 3 · 6 cách 9
    arena(h, { foes: [['c1_wolf', 10, 0], ['c1_wolf', 10, 0], ['c1_wolf', 16, 0], ['c1_wolf', 4, 0], ['c1_wolf', 10, 3], ['c1_wolf', 10, -3], ['c1_wolf', 19, 0]] });
    h.run(`foes[1].statusEffects.push({ type: 'windspirit', endTime: T0 + 99999 });
        foes[4].statusEffects.push({ type: 'giant_form', endTime: T0 + 99999, immuneUntil: T0 + 99999 });
        var dist = (i) => Math.hypot(foes[i].x - 10, foes[i].z);
        cast(2)`);
    assert.equal(h.run('isAirborne(foes[1], room.clock) && ccImmune(foes[4], room.clock)'), true);
    assert.deepEqual(h.fx('channel'), [{ casterId: 'p1', casterIdx: 0, kind: 'channel', skill: 'blackhole', duration: 4000, shell: false }]);
    assert.deepEqual(h.fx('hole'), [{ casterId: 'p1', casterIdx: 0, kind: 'hole', x: 10, z: 0, radius: 8, duration: 4000, lashTimes: [1200, 2400, 3600], lashRadius: 4 }]);
    assert.equal(h.run('nyx.actionUntil - T0'), 4000);
    assert.equal(h.run('nyx.skillCooldowns[2] - T0'), 4000 + 24000);
    // hút 3 ô mỗi giây
    h.run('at(1000)');
    assert.ok(Math.abs(h.run('dist(2)') - 3) < 0.01, `cách tâm 6 -> sau 1 s còn ${h.run('dist(2)')}`);
    assert.ok(Math.abs(h.run('foes[2].x') - 13) < 0.01);
    assert.ok(Math.abs(h.run('dist(3)') - 3) < 0.01);
    assert.ok(h.run('dist(5)') < 0.01);                                  // cách 3 -> bị hút tới tâm, không vọt qua
    assert.deepEqual(json(h, '[foes[6].x, foes[6].z]'), [19, 0]);        // cách 9: ngoài bán kính 8, không bị hút
    assert.deepEqual(json(h, '[foes[4].x, foes[4].z]'), [10, 3]);        // miễn khống chế: không đổi vị trí
    assert.equal(h.fx('lash').length, 0);
    assert.equal(h.run('foes.every(e => e.hp === e.maxHp)'), true);      // hút không gây sát thương
    // 3 đợt xúc tu
    for (const [n, ms] of [[1, 1200], [2, 2400], [3, 3600]]) {
        h.run(`at(${ms - 1})`);
        assert.equal(h.fx('lash').length, n - 1, `chưa tới đợt ${n}`);
        h.run(`var hp = foes.map(e => e.hp); at(${ms})`);
        const lash = h.fx('lash');
        assert.equal(lash.length, n, `đợt ${n} ở ${ms} ms`);
        assert.deepEqual([lash.at(-1).n, lash.at(-1).x, lash.at(-1).z, lash.at(-1).radius], [n, 10, 0, 4]);
        // trong bán kính 4 quanh tâm: 0, 2, 3 (đã bị hút vào), 4 (miễn khống chế, đứng yên cách 3), 5 — không có 1 (đang bay) và 6 (ở xa)
        assert.deepEqual(lash.at(-1).effects.map(e => e.targetIndex).sort(), [0, 2, 3, 4, 5]);
        const mine = json(h, `hits.filter(x => x.at === ${ms})`);
        assert.equal(mine.length, 5);
        for (const x of mine) assert.deepEqual([x.mult, x.aoe, x.ground, x.damage > 0], [1.1, true, true, true]);
        for (const i of [0, 2, 3, 4, 5]) assert.ok(h.run(`foes[${i}].hp < hp[${i}]`), `đối thủ ${i} mất máu ở đợt ${n}`);
        assert.equal(h.run('foes[1].hp'), h.run('foes[1].maxHp'));
        assert.equal(h.run('foes[6].hp'), h.run('foes[6].maxHp'));
    }
    assert.deepEqual(json(h, '[foes[4].x, foes[4].z]'), [10, 3]);
    assert.deepEqual(json(h, '[foes[6].x, foes[6].z]'), [19, 0]);
    // hết 4 giây: hố đen tắt, không hút nữa
    h.run('at(3999)');
    assert.equal(h.fx('channelEnd').length, 0);
    h.run('at(4000)');
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['done']);
    h.run('foes[2].x = 16; at(5000)');
    assert.equal(h.run('foes[2].x'), 16);
    assert.equal(h.fx('lash').length, 3);
});

test('void_blackhole trong vòng lặp trận thật: hút đều 3 ô / giây; Nyx bị choáng (chưa có thiên phú 2) thì hố đen tắt, các đợt xúc tu còn lại bị huỷ', () => {
    const h = harness();
    arena(h, { foes: [['monster_dummy', 6, 0], ['monster_dummy', 12, 0]] });   // cọc gỗ đứng yên; tâm cụm = (9, 0) (tính theo con đầu: (9 + 6) / 2 = 7.5)
    const tick = realLoop(h);
    h.run('nyx.queuedSkills = [2]');
    tick(1);
    const hole = h.fx('hole')[0];
    assert.ok(hole, 'vòng lặp trận đã dùng Hố Đen');
    assert.equal(h.run('nyx.mp <= nyx.maxMp - 3000 + 200'), true);   // đã trừ 3 Orb
    h.run(`var cx = ${hole.x}, far = () => Math.abs(foes[1].x - cx), d0 = far()`);
    tick(20);   // 1 giây
    assert.ok(Math.abs(h.run('d0 - far()') - 3) < 0.2, `1 giây hút ${h.run('d0 - far()')} ô`);
    tick(6);    // 1300 ms: đợt xúc tu đầu đã quất
    assert.equal(h.fx('lash').length, 1);
    h.run('applyStun(nyx, 800, room.clock)');
    tick(1);
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['stun']);
    assert.equal(h.run('voidChannel(nyx, room.clock)'), undefined);
    assert.equal(h.run('nyx.skillCooldowns[2] - room.clock'), 24000);
    h.run('var x1 = foes[1].x');
    tick(70);   // 3,5 giây nữa
    assert.equal(h.run('foes[1].x'), h.run('x1'));          // hố đen đã tắt: không hút nữa
    assert.equal(h.fx('lash').length, 1);                   // đợt 2, 3 bị huỷ
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['stun']);
    assert.notEqual(h.run('nyx.state'), 'acting');
});

test('void_erosion: cú trúng chiêu 1 = +1 tầng; 9 nhịp Mana Burst không cộng; mỗi đợt sao, mỗi đợt xúc tu +1; tối đa 5; per = 0.06 / 0.08 / 0.10 theo mức thiên phú 1 / 2 / 3; hết sau 8000 ms', () => {
    for (const [rank, per] of [[0, 0.06], [2, 0.08], [3, 0.10]]) {
        const h = harness();
        arena(h, { level: 20, rank, foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 0]] });   // cấp 20: chỉ có thiên phú 1
        h.run(`var ero = (i) => foes[i].statusEffects.find(e => e.type === 'void_erosion' && e.endTime > room.clock);
            var stacks = (i) => ero(i)?.stacks ?? 0;
            var mDef = (i) => getEffectiveStats(foes[i], room.clock).stats.mDef;
            var recast = (i) => { nyx.skillCooldowns = [0, 0, 0]; nyx.actionUntil = 0; nyx.mp = nyx.maxMp; cast(i); }`);
        assert.equal(h.run("talentOf(nyx, 'void_erosion').value"), per);
        assert.equal(h.run("talentOf(nyx, 'void_shell')"), null);
        assert.equal(h.run('mDef(0)'), 500);
        // Ma Đạn: cú trúng +1 tầng lên mục tiêu; 9 nhịp Mana Burst không cộng (kể cả lên con đứng cạnh)
        h.run('nyx.targetIndex = 0; cast(0); at(600)');
        assert.deepEqual(json(h, '[stacks(0), stacks(1)]'), [1, 0]);
        assert.deepEqual(h.fx('erode'), [{ casterId: 'p1', casterIdx: 0, kind: 'erode', targetId: 'p2', targetIndex: 0, stacks: 1 }]);
        assert.deepEqual(json(h, "[ero(0).per, ero(0).maxStacks, ero(0).debuff, ero(0).endTime - room.clock]"), [per, 5, true, 8000]);
        assert.equal(h.run('mDef(0)'), Math.floor(500 * (1 - per)));
        h.run('at(1600)');
        assert.equal(h.fx('burstTick').length, 9);
        assert.deepEqual(json(h, '[stacks(0), stacks(1)]'), [1, 0]);
        assert.equal(h.fx('erode').length, 1);
        // Sao Rơi (bấm ở 1600): mỗi đợt +1 tầng lên mọi đối thủ trúng
        h.run('recast(1)');
        for (const [n, ms] of [[1, 4600], [2, 5100], [3, 5600], [4, 6100]]) {
            h.run(`at(${ms})`);
            assert.deepEqual(json(h, '[stacks(0), stacks(1)]'), [1 + n, n], `sau đợt sao ${n}`);
        }
        assert.equal(h.run('mDef(0)'), Math.floor(500 * (1 - 5 * per)));
        assert.equal(h.run('mDef(1)'), Math.floor(500 * (1 - 4 * per)));
        // Hố Đen (bấm ở 6600): mỗi đợt xúc tu +1 tầng — tối đa 5
        h.run('at(6600); recast(2)');
        for (const ms of [7800, 9000, 10200]) {
            h.run(`at(${ms})`);
            assert.deepEqual(json(h, '[stacks(0), stacks(1)]'), [5, 5], `sau đợt xúc tu ở ${ms}`);
        }
        assert.equal(h.fx('lash').length, 3);
        assert.equal(h.run('mDef(1)'), Math.floor(500 * (1 - 5 * per)));
        assert.equal(Math.max(...h.fx('erode').map(e => e.stacks)), 5);
        assert.deepEqual(h.fx('erode').filter(e => e.targetIndex === 0).slice(0, 5).map(e => e.stacks), [1, 2, 3, 4, 5]);
        // giữ 8000 ms tính từ lần cộng cuối (10200)
        h.run('at(18199)');
        assert.equal(h.run('mDef(0)'), Math.floor(500 * (1 - 5 * per)));
        h.run('at(18200)');
        assert.deepEqual(json(h, '[stacks(0), stacks(1), mDef(0), mDef(1)]'), [0, 0, 500, 500]);
        // hết rồi thì đếm lại từ 1
        h.run('nyx.targetIndex = 1; recast(0); at(18800)');
        assert.deepEqual(json(h, '[stacks(0), stacks(1)]'), [0, 1]);
    }
});

test('void_erosion: 6 đối thủ chết → mAtk ×1.40 (tối đa 5 lần); 2 đồng minh anh hùng chết → crit +300, critDmg +600; quân triệu hồi chết không đổi gì', () => {
    const h = harness();
    arena(h, { level: 20, allies: ['warrior', 'archer', 'priest', 'mage'],
        foes: [['c1_wolf', 8, 0], ['c1_wolf', 9, 0], ['c1_wolf', 10, 0], ['c1_wolf', 11, 0], ['c1_wolf', 12, 0], ['c1_wolf', 13, 0], ['c1_wolf', 14, 0], ['b_valdric', 15, 0]] });
    h.run(`var st = () => getEffectiveStats(nyx, room.clock).stats;
        var kill = (m, squad) => { m.hp = 0; killMember(m, squad); };
        var s0 = st(); var ally = (id) => team.find(m => m.classId === id);
        foes[6].summon = true;                                         // quái được trùm gọi ra = triệu hồi
        team.push({ ...createMonsterSquad(1, [['c1_wolf', -2, 0]])[0], summon: true, side: 'left' });   // triệu hồi phe mình`);
    const s0 = json(h, 's0');
    const now = () => json(h, 'st()');
    // triệu hồi của 2 phe gục: không đổi gì
    h.run('kill(foes[6], foes); kill(team.at(-1), team)');
    assert.deepEqual([now().mAtk, now().crit, now().critDmg], [s0.mAtk, s0.crit, s0.critDmg]);
    // trùm 2 dạng "gục" lần đầu chỉ là đổi dạng: chưa tính là chết
    h.run('kill(foes[7], foes)');
    assert.equal(h.run('foes[7].alive'), true);
    assert.equal(now().mAtk, s0.mAtk);
    // mỗi đối thủ gục +8% M.ATK, tối đa 5 lần
    for (let k = 1; k <= 6; k++) {
        h.run(`kill(foes[${k - 1}], foes)`);
        assert.equal(now().mAtk, Math.floor(s0.mAtk * (1 + Math.min(5, k) * 0.08)), `sau ${k} đối thủ gục`);
    }
    assert.equal(now().mAtk, Math.floor(s0.mAtk * 1.4));
    assert.equal(h.run('nyx.voidKills'), 5);
    assert.deepEqual([now().crit, now().critDmg], [s0.crit, s0.critDmg]);
    // mỗi đồng minh (anh hùng) gục: +15% tỉ lệ chí mạng, +30% sát thương chí mạng, tối đa 3 lần
    h.run("kill(ally('warrior'), team); kill(ally('archer'), team)");
    assert.deepEqual([now().crit, now().critDmg], [s0.crit + 300, s0.critDmg + 600]);
    h.run("kill(ally('priest'), team); kill(ally('mage'), team)");
    assert.deepEqual([now().crit, now().critDmg], [s0.crit + 450, s0.critDmg + 900]);
    assert.equal(h.run('nyx.voidAllies'), 3);
    assert.equal(now().mAtk, Math.floor(s0.mAtk * 1.4));
});

test('void_erosion mức 0 (Nyx dưới cấp 20): không tầng nào, đối thủ / đồng minh gục không cộng gì; đòn trượt và triệu hồi không nhận debuff thì không dính tầng', () => {
    const h = harness();
    arena(h, { level: 19, allies: ['warrior'], foes: [['monster_dummy', 8, 0], ['c1_wolf', 9, 0]] });
    h.run('var s0 = getEffectiveStats(nyx, room.clock).stats; nyx.targetIndex = 0; cast(0); at(600); nyx.actionUntil = 0; cast(1); upTo(6000)');
    assert.equal(h.fx('starWave').length, 4);
    assert.equal(h.fx('erode').length, 0);
    assert.equal(h.run("foes.some(e => e.statusEffects.some(s => s.type === 'void_erosion'))"), false);
    h.run("foes[1].hp = 0; killMember(foes[1], foes); team.find(m => m.classId === 'warrior').hp = 0; killMember(team.find(m => m.classId === 'warrior'), team)");
    assert.deepEqual(json(h, "['mAtk', 'crit', 'critDmg'].map(k => getEffectiveStats(nyx, room.clock).stats[k] - s0[k])"), [0, 0, 0]);
    // có thiên phú: cú trúng bị né (trượt) không cộng tầng · Golem (triệu hồi không nhận debuff) không dính tầng
    const g = harness();
    arena(g, { level: 20, foes: [['c1_wolf', 8, 0], ['elem_golem', 9, 0]] });
    g.run('foes[1].summon = true; __rnd = 0; nyx.targetIndex = 0; cast(0); at(600)');   // __rnd = 0: sói né được (né 9%)
    assert.equal(g.fx('burst')[0].effects[0].isMiss, true);
    assert.equal(g.fx('erode').length, 0);
    g.run('__rnd = 0.5; at(1600); nyx.actionUntil = 0; cast(1); at(4600)');
    assert.deepEqual(g.fx('starWave')[0].effects.map(e => e.targetIndex).sort(), [0, 1]);
    assert.deepEqual(g.fx('erode').map(e => e.targetIndex), [0]);
    assert.equal(g.run("foes[1].statusEffects.some(s => s.type === 'void_erosion')"), false);
});

test('void_shell: đang kênh, applyStun 1000 ms → không có hiệu ứng stun, đủ 4 đợt sao; sát thương nhận ×0.70 (mức 1) / ×0.55 (mức 2); hết kênh thì nhận đủ', () => {
    for (const [level, rank, value] of [[40, 1, 0.30], [60, 3, 0.45]]) {
        const h = harness();
        arena(h, { level, rank, foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 1]] });
        assert.equal(h.run("talentOf(nyx, 'void_shell').value"), value);
        h.run(`var stunned = () => nyx.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock);
            var wolf = createMonsterSquad(${level}, [['c1_wolf', 2, 0]])[0];
            var taken = () => calculateDamage(wolf, nyx, 1, room.clock).damage;
            var plain = taken()`);
        assert.ok(h.run('plain') > 50);
        const tick = realLoop(h);
        h.run('nyx.queuedSkills = [1]');
        tick(1);
        assert.equal(h.fx('channel')[0].shell, true);
        h.run('var castAt = room.clock');
        // đang niệm: giảm sát thương nhận
        const shell = h.run('taken()');
        assert.ok(Math.abs(shell - h.run('plain') * (1 - value)) <= 1, `nhận ${shell} so với ${h.run('plain')} × ${1 - value}`);
        tick(64);   // 3200 ms: đã rơi đợt 1
        assert.equal(h.fx('starWave').length, 1);
        assert.equal(h.run('ccImmune(nyx, room.clock)'), true);
        h.run('applyStun(nyx, 1000, room.clock)');
        assert.equal(h.run('stunned()'), false);
        tick(1);
        assert.equal(h.run('stunned()'), false);
        assert.equal(h.run('voidChannel(nyx, room.clock).skill'), 'starfall');
        assert.equal(h.run('nyx.state'), 'acting');
        // choáng / hất tung gắn thẳng vào (không qua applyStun) cũng bị gỡ, không ngắt niệm
        h.run("nyx.statusEffects.push({ type: 'stun', endTime: room.clock + 2000 }, { type: 'knocked', endTime: room.clock + 2000 })");
        tick(1);
        assert.equal(h.run("nyx.statusEffects.some(e => e.type === 'stun' || e.type === 'knocked')"), false);
        assert.equal(h.fx('channelEnd').length, 0);
        tick(40);   // tới 5300 ms: đủ 4 đợt, niệm xong
        assert.equal(h.fx('starWave').length, 4);
        assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['done']);
        assert.equal(h.run('nyx.skillCooldowns[1] - castAt'), 21000);
        // hết kênh: nhận đủ sát thương, lại bị choáng như thường
        assert.equal(h.run('ccImmune(nyx, room.clock)'), false);
        assert.equal(h.run('taken()'), h.run('plain'));
        h.run('applyStun(nyx, 1000, room.clock)');
        assert.equal(h.run('stunned()'), true);
    }
});

test('void_shell: đòn chí tử → alive vẫn true, isVanished 3000 ms, canBeTargeted false, dealDamage lúc đó không trừ máu; sau 3000 ms hp = 30% / 50% maxHp; đòn chí tử lần hai → chết', () => {
    for (const [level, rank, revive] of [[40, 1, 0.30], [60, 3, 0.50]]) {
        const h = harness();
        arena(h, { level, rank, foes: [['c1_wolf', 6, 0], ['c1_wolf', 7, 1]] });
        h.run(`var mine = room.players.p1; nyx.x = -5; nyx.z = 2;
            nyx.statusEffects.push({ type: 'stun', endTime: room.clock + 9000 }, { type: 'mdef_break', stacks: 3, per: 0.05, endTime: room.clock + 9000, debuff: true });
            var gone = () => isVanished(nyx, room.clock);
            var killed1 = dealDamage(nyx, 999999, mine, 0, null, foes[0], { cc: false })`);
        assert.equal(h.run('killed1'), false);   // đòn kích hoạt Mượn Mạng không tính là hạ gục (người đánh không được thưởng hạ gục)
        // không gục: rơi vào cổng Hư Không 3 giây
        assert.equal(h.run('nyx.alive'), true);
        assert.equal(h.run('gone()'), true);
        assert.equal(h.run('nyx.voidLifeUsed'), true);
        assert.deepEqual(h.fx('vanish'), [{ casterId: 'p1', casterIdx: 0, kind: 'vanish', duration: 3000 }]);
        assert.equal(h.run('canBeTargeted(nyx, room.clock)'), false);
        assert.equal(h.run('foesOf(mine, room.clock).length'), 0);
        assert.equal(h.run('findBestTarget(foes[0], team, room.clock)'), null);
        assert.equal(h.run("nyx.statusEffects.some(e => e.type === 'stun' || e.type === 'mdef_break')"), false);   // vào cổng: sạch hiệu ứng đang dính
        h.run("checkWinCondition('fixture')");
        assert.equal(h.run('room.winner'), undefined);   // còn sống -> trận chưa kết thúc
        // trong cổng: không đòn nào trừ được máu, không dính hiệu ứng mới
        h.run('var hp = nyx.hp; dealDamage(nyx, 500, mine); dealDamage(nyx, 999999, mine)');
        assert.equal(h.run('nyx.hp'), h.run('hp'));
        assert.equal(h.run('nyx.alive'), true);
        assert.deepEqual(json(h, '(r => [r.damage, r.isMiss])(hitTarget(foes[0], nyx, NI, mine, 5, room.clock, { aoe: true }))'), [0, true]);
        h.run("applyStun(nyx, 2000, room.clock); nyx.statusEffects.push({ type: 'poison', stacks: 5, endTime: room.clock + 6000, debuff: true }); at(1500)");
        assert.equal(h.run("nyx.statusEffects.some(e => e.type !== 'void_vanish')"), false);
        h.run('at(2999)');
        assert.equal(h.run('gone()'), true);
        assert.equal(h.fx('return').length, 0);
        // đủ 3000 ms: trở lại ở hàng sau phe mình (sát mép sân bên trái), máu = 30% / 50%
        h.run('at(3000)');
        assert.equal(h.run('gone()'), false);
        assert.equal(h.run('nyx.hp'), Math.round(h.run('nyx.maxHp') * revive));
        assert.deepEqual(h.fx('return'), [{ casterId: 'p1', casterIdx: 0, kind: 'return', x: -44, z: 2, hp: h.run('nyx.hp') }]);
        assert.deepEqual(json(h, '[nyx.x, nyx.z]'), [-44, 2]);
        assert.equal(h.run('canBeTargeted(nyx, room.clock)'), true);
        assert.equal(h.run('nyx.alive'), true);
        // lần hai: chết thật
        h.run('var killed2 = dealDamage(nyx, 999999, mine)');
        assert.equal(h.run('killed2'), true);
        assert.equal(h.run('nyx.alive'), false);
        assert.equal(h.fx('vanish').length, 1);
        h.run("checkWinCondition('fixture')");
        assert.equal(h.run('room.winner'), 'p2');
    }
});

test('void_shell: mượn mạng giữa lúc niệm → chiêu bị huỷ (đợt chưa rơi không rơi nữa), hồi chiêu vẫn chạy, không kẹt động tác', () => {
    const h = harness();
    arena(h, { level: 40, rank: 1, foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 1]] });
    h.run('cast(1); upTo(3200)');
    assert.equal(h.fx('starWave').length, 1);
    // đang có Vỏ Hư Không (giảm 30% sát thương) nhưng đòn này vẫn chí tử
    h.run('dealDamage(nyx, 999999, room.players.p1)');
    assert.equal(h.run('isVanished(nyx, room.clock)'), true);
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['vanish']);
    assert.equal(h.run('voidChannel(nyx, room.clock)'), undefined);
    assert.equal(h.run('nyx.skillCooldowns[1] - room.clock'), 16000);
    assert.equal(h.run('nyx.actionUntil <= room.clock'), true);
    h.run('upTo(7000)');
    assert.equal(h.fx('starWave').length, 1);
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['vanish']);
    assert.equal(h.fx('return').length, 1);
    assert.equal(h.run('nyx.hp'), Math.round(h.run('nyx.maxHp') * 0.3));
});

test('void_shell trong vòng lặp trận thật: trong cổng Hư Không Nyx không hành động, đối thủ không đánh được; trở lại rồi đánh tiếp', () => {
    const h = harness();
    arena(h, { level: 40, rank: 1, foes: [['c1_wolf', 2, 0]], foeLevel: 40 });
    const tick = realLoop(h);
    h.run('nyx.hp = 1; foes[0].lastAttackTime = 0; nyx.lastAttackTime = room.clock + 99999');   // sói cắn phát đầu là chí tử
    tick(8);   // sói ra đòn, 180 ms sau đòn chạm
    assert.equal(h.fx('vanish').length, 1);
    assert.equal(h.run('nyx.alive && isVanished(nyx, room.clock)'), true);
    h.run('var t1 = room.clock, hp1 = nyx.hp, mp1 = nyx.mp, wolfHits = foes[0].lastAttackTime; nyx.lastAttackTime = 0; nyx.autoOn = true');
    tick(50);   // 2,5 giây trong cổng
    assert.equal(h.run('nyx.state'), 'vanished');
    assert.equal(h.run('nyx.hp'), h.run('hp1'));
    assert.equal(h.run('nyx.mp'), h.run('mp1'));
    assert.equal(h.run('nyx.lastAttackTime'), 0);                     // không đánh
    assert.equal(h.run('nyx.queuedSkills.length'), 0);                // AUTO không xếp chiêu
    assert.equal(h.run('foes[0].lastAttackTime'), h.run('wolfHits')); // sói không còn ai để cắn
    assert.equal(h.run('foes[0].targetIndex'), -1);
    assert.ok(!h.run('room.winner'));                                 // Nyx còn sống: trận chưa kết thúc
    tick(12);   // quá 3 giây: đã trở lại
    assert.equal(h.fx('return').length, 1);
    assert.equal(h.fx('return')[0].x, -44);
    assert.equal(h.run('isVanished(nyx, room.clock)'), false);
    assert.ok(h.run('nyx.hp') >= Math.round(h.run('nyx.maxHp') * 0.3));
    h.run('nyx.autoOn = false; var t2 = room.clock');
    tick(60);   // 3 giây sau: lại là mục tiêu của sói, lại tự đánh thường
    assert.equal(h.run('foes[0].targetIndex'), 0);
    assert.notEqual(h.run('nyx.state'), 'vanished');
    assert.ok(h.run('nyx.lastAttackTime') > h.run('t2'), 'Nyx đánh thường lại sau khi trở về');
    assert.equal(h.run('nyx.alive'), true);
});

test('void_shell mức 0 (chưa mở): không có tác dụng nào', () => {
    const h = harness();
    arena(h, { level: 39, rank: 1, foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 1]] });   // cấp 39: có thiên phú 1, chưa có thiên phú 2
    assert.equal(h.run("talentOf(nyx, 'void_shell')"), null);
    assert.ok(h.run("talentOf(nyx, 'void_erosion')"));
    h.run(`var wolf = createMonsterSquad(39, [['c1_wolf', 2, 0]])[0];
        var taken = () => calculateDamage(wolf, nyx, 1, room.clock).damage;
        var plain = taken(); cast(1); upTo(3200)`);
    assert.equal(h.fx('channel')[0].shell, false);
    assert.equal(h.run('taken()'), h.run('plain'));                      // đang niệm vẫn nhận đủ sát thương
    assert.equal(h.run('ccImmune(nyx, room.clock)'), false);
    h.run('applyStun(nyx, 1000, room.clock)');
    assert.equal(h.run("nyx.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), true);   // bị choáng như thường
    h.run('upTo(3250)');
    assert.equal(h.run("nyx.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), true);   // processVoid không gỡ
    // đòn chí tử: chết luôn, không có cổng Hư Không
    h.run('dealDamage(nyx, 999999, room.players.p1)');
    assert.equal(h.run('nyx.alive'), false);
    assert.equal(h.run('isVanished(nyx, room.clock)'), false);
    assert.equal(h.fx('vanish').length, 0);
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['death']);
});

test('void_shell: Nyx phe bên phải trở lại ở mép sân bên phải; mượn mạng không tính là "đối thủ chết" cho Nyx phe kia', () => {
    const h = harness();
    arena(h, { level: 40, rank: 1, foeHeroes: ['voidmage'], foeLevel: 40 });
    h.run(`var her = foes[0]; her.x = 20; her.z = -3;
        dealDamage(her, 999999, room.players.p2);
        var vanishedOk = her.alive && isVanished(her, room.clock) && !canBeTargeted(her, room.clock);
        room.clock += 3000; processVoid(room, 'p2', 0, 'p1', room.clock)`);
    assert.equal(h.run('vanishedOk'), true);
    assert.deepEqual(json(h, '[her.x, her.z, her.hp === Math.round(her.maxHp * 0.3)]'), [44, -3, true]);
    assert.deepEqual(h.fx('return').map(e => [e.casterId, e.x, e.z]), [['p2', 44, -3]]);
    assert.equal(h.run('nyx.voidKills ?? 0'), 0);
    h.run('dealDamage(her, 999999, room.players.p2)');
    assert.equal(h.run('her.alive'), false);
    assert.equal(h.run('nyx.voidKills'), 1);
});

test('AUTO voidmage: 3 Orb + ≥2 đối thủ sống → 2; vừa dùng Hố Đen (đang kênh xong) + 2 Orb → 1; chỉ 1 Orb → 0', () => {
    const h = harness();
    arena(h, { foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 1]] });
    h.run(`var auto = (mp) => { if (mp != null) nyx.mp = mp; return autoChooseSkill(nyx, NI, room.players.p1, room.players.p2, room.clock); };`);
    assert.equal(h.run('auto(3000)'), 2);                 // đủ 3 Orb, 2 đối thủ -> Hố Đen
    assert.equal(h.run('auto(5000)'), 2);
    assert.equal(h.run('auto(1000)'), 0);                 // chỉ 1 Orb -> Ma Đạn
    assert.equal(h.run('auto(2000)'), -1);                // 2 Orb, Hố Đen sẵn sàng: để dành (thiếu 1 Orb nữa), không bắn Ma Đạn, không Sao Rơi
    assert.equal(h.run('auto(2900)'), -1);
    assert.equal(h.run('auto(900)'), -1);                 // chưa đủ Orb cho chiêu nào
    // vừa dùng Hố Đen (niệm xong): còn 2 Orb -> Sao Rơi dội vào cụm vừa gom
    h.run('nyx.mp = 5000; cast(2)');
    assert.equal(h.run('auto(5000)'), -1);                // đang niệm: không chọn gì
    h.run('upTo(4000)');
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['done']);
    assert.equal(h.run('auto(2000)'), 1);
    assert.equal(h.run('auto(1000)'), 0);                 // không đủ Orb cho Sao Rơi -> Ma Đạn
    assert.equal(h.run('auto(900)'), -1);
    // Sao Rơi cũng đang hồi -> Ma Đạn
    h.run('nyx.skillCooldowns[1] = room.clock + 9000');
    assert.equal(h.run('auto(5000)'), 0);
    // Hố Đen sắp hồi xong (còn 3 giây): giữ Orb cho nó — chỉ bắn Ma Đạn khi bắn xong vẫn còn đủ 3 Orb
    h.run('nyx.skillCooldowns[1] = 0; nyx.skillCooldowns[2] = room.clock + 3000');
    assert.equal(h.run('auto(5000)'), 0);
    assert.equal(h.run('auto(3500)'), -1);
    assert.equal(h.run('auto(2000)'), -1);
    assert.equal(h.run('auto(1500)'), 0);
    // chỉ còn 1 đối thủ thường: không dùng Hố Đen, Sao Rơi / Ma Đạn như thường; 1 đối thủ là trùm: vẫn Hố Đen
    h.run('nyx.skillCooldowns = [0, 0, 0]; foes[1].alive = false');
    assert.equal(h.run('auto(5000)'), 1);
    assert.equal(h.run('auto(1000)'), 0);
    h.run('foes[0].boss = true');
    assert.equal(h.run('auto(3000)'), 2);
    // không có đối thủ trong tầm đánh: chờ
    h.run('foes[0].x = 40');
    assert.equal(h.run('auto(5000)'), -1);
});

test('AUTO voidmage trong vòng lặp trận thật: Hố Đen trước, niệm xong tới Sao Rơi, rồi Ma Đạn', () => {
    const h = harness();
    arena(h, { foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 1]] });
    const tick = realLoop(h);
    h.run('nyx.autoOn = true');
    const order = () => h.events.filter(e => e.name === 'skillExecuted' && e.data.casterId === 'p1').map(e => e.data.type);
    tick(8);
    assert.deepEqual(order(), ['void_blackhole']);
    tick(80);   // hết 4 giây niệm: còn 2 Orb + hồi thêm -> Sao Rơi
    assert.deepEqual(order(), ['void_blackhole', 'void_starfall']);
    tick(130);  // hết 5 giây niệm Sao Rơi -> Ma Đạn khi đủ 1 Orb
    assert.deepEqual(order().slice(0, 3), ['void_blackhole', 'void_starfall', 'void_missiles']);
    assert.equal(h.fx('lash').length, 3);
    assert.equal(h.fx('starWave').length, 4);
    assert.ok(h.fx('burstTick').length >= 9);
});

test('void_shell: mượn mạng cũng cứu khi cái chết không đi qua dealDamage (Thần Chết phán quyết, đòn nổ Phán Quyết của trùm); hiệu ứng có lợi giữ nguyên, hiệu ứng bất lợi mới không dính', () => {
    const J = require('../game/judgment').JUDGMENT;
    // 1. Thần Chết phán quyết: có Ấn Tử + máu dưới ngưỡng -> bị nhấc lên 1,1 giây -> chém kết liễu
    const h = harness();
    arena(h, { level: 40, rank: 1, foes: [['c1_wolf', 6, 0]] });
    h.run(`nyx.statusEffects.push({ type: 'meal_buff', atk: 0.1, endTime: room.clock + 60000 });
        nyx.statusEffects.push({ type: 'death_mark', endTime: room.clock + 15000, execute: 0.5, healCut: 0.2, owner: 'right', debuff: true, noCleanse: true });
        nyx.hp = Math.round(nyx.maxHp * 0.4); checkJudgement(nyx)`);
    assert.equal(h.run('isJudged(nyx, room.clock)'), true);
    h.run('at(1100)');
    assert.equal(h.run('nyx.alive && isVanished(nyx, room.clock) && !isJudged(nyx, room.clock)'), true);
    assert.equal(h.fx('vanish').length, 1);
    // trong cổng: Ấn Tử mới, choáng, độc... không dính; buff đồng đội cho thì vẫn nhận
    h.run(`nyx.statusEffects.push({ type: 'death_mark', endTime: room.clock + 15000, execute: 0.5, owner: 'right', debuff: true, noCleanse: true },
            { type: 'poison', stacks: 3, endTime: room.clock + 6000, debuff: true }, { type: 'taunted', endTime: room.clock + 4000, sourceIndex: 0 },
            { type: 'gear_atk', value: 0.1, endTime: room.clock + 9000 });
        at(2000)`);
    assert.deepEqual(json(h, 'nyx.statusEffects.map(e => e.type).sort()'), ['gear_atk', 'meal_buff', 'void_vanish']);
    h.run('at(1100 + 3000)');
    assert.equal(h.run('isVanished(nyx, room.clock)'), false);
    assert.equal(h.run('nyx.hp'), Math.round(h.run('nyx.maxHp') * 0.3));
    assert.deepEqual(json(h, 'nyx.statusEffects.map(e => e.type).sort()'), ['gear_atk', 'meal_buff']);
    // 2. đòn nổ Phán Quyết của trùm (mức Cốt truyện: 60% máu tối đa): Nyx còn 50% máu -> đáng lẽ gục -> mượn mạng
    const b = harness();
    arena(b, { level: 40, rank: 1, allies: ['warrior'], foes: [['b_valdric', 6, 0]] });
    b.run(`var boss = foes[0], rok = team.find(m => m.classId === 'warrior'); boss.bossCasts = 3; boss.judgmentReadyAt = room.clock;
        var judge = () => processJudgment(room, 'p2', 0, 'p1', room.clock);
        nyx.hp = Math.round(nyx.maxHp * 0.5); judge(); room.clock += ${J.durationMs}; judge(); room.clock += ${J.slamMs}; judge()`);
    assert.equal(b.events.filter(e => e.name === 'bossUlt' && e.data.phase === 'blast').length, 1);
    assert.equal(b.run('nyx.alive && isVanished(nyx, room.clock)'), true);
    assert.ok(b.run('rok.hp') < b.run('rok.maxHp'));
    // 3. đang trong cổng thì đòn nổ kế tiếp không đụng được Nyx
    b.run(`boss.bossCasts = 3; boss.judgmentReadyAt = room.clock; boss.actionUntil = 0; rok.hp = rok.maxHp;
        judge(); room.clock += ${J.durationMs}; nyx.voidReturnAt = room.clock + 5000; nyx.statusEffects.find(e => e.type === 'void_vanish').endTime = room.clock + 5000;
        judge(); room.clock += ${J.slamMs}; judge()`);
    assert.equal(b.events.filter(e => e.name === 'bossUlt' && e.data.phase === 'blast').length, 2);
    assert.equal(b.run('nyx.alive && nyx.hp === 1 && isVanished(nyx, room.clock)'), true);
    assert.ok(b.run('rok.hp') < b.run('rok.maxHp'));
});

test('đối thủ miễn khống chế (trùm đang niệm Phán Quyết, Golem không nhận debuff): Hố Đen không hút, Sao Rơi không làm choáng, vẫn ăn sát thương, không lỗi', () => {
    const h = harness();
    arena(h, { level: 20, foeLevel: 60, foes: [['b_valdric', 9, 2], ['elem_golem', 9, -2], ['c1_wolf', 13, 0]] });
    h.run(`var boss = foes[0], golem = foes[1], wolf = foes[2]; golem.summon = true;
        room.stage = { diff: 'hell' };   // khiên Phán Quyết dày (25% máu trùm cấp 60): không vỡ trong bài thử này
        boss.bossCasts = 3; boss.judgmentReadyAt = room.clock; processJudgment(room, 'p2', 0, 'p1', room.clock);
        var shield0 = boss.ult.shield, bossHp = boss.hp, golemHp = golem.hp, pos = () => [boss.x, boss.z, golem.x, golem.z];
        var p0 = pos(), wolfX = wolf.x; cast(2); upTo(4000)`);
    assert.ok(h.run('!!boss.ult'), 'trùm đang niệm Phán Quyết');
    assert.equal(h.run('ccImmune(boss, room.clock) && ccImmune(golem, room.clock)'), true);
    assert.equal(h.fx('lash').length, 3);
    assert.deepEqual(json(h, 'pos()'), json(h, 'p0'));                 // không bị hút
    assert.ok(h.run('wolf.x') < h.run('wolfX'));                       // sói thường thì bị hút
    assert.ok(h.run('boss.ult.shield') < h.run('shield0'));            // trùm đang niệm: đòn đánh trừ vào khiên Phán Quyết
    assert.equal(h.run('boss.hp'), h.run('bossHp'));
    assert.ok(h.run('golem.hp') < h.run('golemHp'));                   // Golem vẫn mất máu
    assert.equal(h.run("golem.statusEffects.some(e => e.type === 'void_erosion')"), false);
    // Sao Rơi: choáng không dính vào trùm đang niệm / Golem
    h.run('var s1 = boss.ult.shield, g1 = golem.hp; nyx.actionUntil = 0; nyx.skillCooldowns = [0, 0, 0]; cast(1); upTo(8700)');
    assert.equal(h.fx('starWave').length, 4);
    assert.equal(h.run("boss.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), false);
    assert.equal(h.run("golem.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), false);
    assert.equal(h.run("wolf.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), true);
    assert.ok(h.run('boss.ult ? boss.ult.shield < s1 : true'));
    assert.ok(h.run('golem.hp') < h.run('g1'));
    assert.deepEqual(json(h, 'pos()'), json(h, 'p0'));
});

test('void_starfall / void_blackhole: vừa dính choáng (chưa có thiên phú 2) thì đợt tới giờ ngay sau đó cũng không rơi; có Vỏ Hư Không thì vẫn rơi', () => {
    for (const [level, shell] of [[1, false], [40, true]]) {
        const h = harness();
        arena(h, { level, rank: level === 40 ? 1 : 0, foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 1]] });
        h.run('cast(1); upTo(3450); applyStun(nyx, 1000, room.clock); nyx.statusEffects.push({ type: "stun", endTime: room.clock + 1000 }); at(3500)');
        assert.equal(h.fx('starWave').length, shell ? 2 : 1, `đợt 2 ${shell ? 'vẫn rơi' : 'không rơi'}`);
        h.run(`nyx.statusEffects = nyx.statusEffects.filter(e => e.type !== 'stun' && e.type !== 'void_channel'); nyx.actionUntil = 0; nyx.skillCooldowns = [0, 0, 0];
            cast(2); upTo(3500 + 1150); nyx.statusEffects.push({ type: "stun", endTime: room.clock + 1000 }); at(3500 + 1200)`);   // Hố Đen bấm ở 3500 -> đợt xúc tu đầu ở 4700
        assert.equal(h.fx('lash').length, shell ? 1 : 0);
    }
});

test('bấm chiêu khi chưa đủ Orb / đang niệm: không mất Orb, lệnh nằm chờ; đủ Orb thì tự ra chiêu', () => {
    const h = harness();
    arena(h, { foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 1]] });
    const tick = realLoop(h);
    h.run('nyx.mp = 1000; nyx.queuedSkills = [2]');   // Hố Đen cần 3 Orb
    tick(20);
    assert.equal(h.fx('channel').length, 0);
    assert.ok(h.run('nyx.mp') >= 1000);                 // không bị trừ Orb
    assert.deepEqual(json(h, 'nyx.queuedSkills'), [2]); // lệnh vẫn chờ
    assert.equal(h.run('nyx.skillCooldowns[2]'), 0);
    h.run('nyx.mp = 3000');
    tick(1);
    assert.deepEqual(h.fx('channel').map(e => e.skill), ['blackhole']);
    assert.ok(h.run('nyx.mp') < 300);
    assert.deepEqual(json(h, 'nyx.queuedSkills'), []);
    // đang niệm mà bấm Sao Rơi: chờ niệm xong mới ra (không cắt ngang, không mất Orb sớm)
    h.run('nyx.mp = 5000; nyx.queuedSkills = [1]');
    tick(40);   // 2 giây: vẫn đang niệm Hố Đen
    assert.deepEqual(h.fx('channel').map(e => e.skill), ['blackhole']);
    assert.ok(h.run('nyx.mp') >= 5000);
    tick(45);   // quá 4 giây: Hố Đen xong -> Sao Rơi bắt đầu
    assert.deepEqual(h.fx('channel').map(e => e.skill), ['blackhole', 'starfall']);
    assert.deepEqual(h.fx('channelEnd').map(e => e.reason), ['done']);
    assert.equal(h.fx('lash').length, 3);
});

test('void_shell: đúng nhịp hết giờ trong cổng, đối thủ được xử lý trước Nyx không kịp đánh vào chỗ cũ', () => {
    const h = harness();
    arena(h, { level: 40, rank: 1, foeHeroes: ['voidmage'], foeLevel: 40 });   // Nyx phe phải đứng trong tầm đánh của Nyx phe trái (phe trái được xử lý trước)
    h.run('var her = foes[0]; her.x = 8; her.z = 0; her.lastAttackTime = room.clock + 1e9; nyx.mp = 0; her.mp = 0');
    const tick = realLoop(h);
    h.run('dealDamage(her, 999999, room.players.p2)');   // vào cổng ngay từ đầu
    tick(59);   // 2950 ms: vẫn trong cổng, Nyx phe trái không có ai để đánh
    assert.equal(h.run('isVanished(her, room.clock)'), true);
    assert.equal(h.run('nyx.lastAttackTime'), 0);
    tick(1);    // đúng 3000 ms
    assert.equal(h.run('nyx.lastAttackTime'), 0);        // không kịp ra đòn vào chỗ cũ (x = 8)
    assert.deepEqual(h.fx('return').map(e => [e.casterId, e.x]), [['p2', 44]]);          // đã trở lại mép sân bên phải (rồi bắt đầu đi tới ngay trong nhịp đó)
    assert.deepEqual(json(h, '[her.x > 43, isVanished(her, room.clock), her.hp === Math.round(her.maxHp * 0.3)]'), [true, false, true]);
    tick(10);   // nửa giây sau: Nyx phe trái đang đuổi theo, chưa vào tầm nên chưa đánh được -> máu vẫn nguyên
    assert.ok(h.run('nyx.x') > 0);
    assert.equal(h.run('her.hp >= Math.round(her.maxHp * 0.3)'), true);
});

test('void_shell: trở lại sau lưng đồng đội đứng sau cùng 3 ô; đồng đội đã gục hoặc quân triệu hồi không tính; không còn ai thì ở mép sân', () => {
    const h = harness();
    arena(h, { level: 60, rank: 3, allies: ['warrior', 'priest'], foes: [['c1_wolf', 30, 0]] });
    h.run("var rok = team.find(m => m.classId === 'warrior'), sera = team.find(m => m.classId === 'priest'); rok.x = 12; rok.z = 0; sera.x = -6; sera.z = 1; nyx.x = 2; nyx.z = 2;");
    h.run('killMember(nyx, team); at(3000)');
    assert.deepEqual(json(h, '[nyx.alive, nyx.x, nyx.z]'), [true, -9, 2]);   // sau lưng Seraphine (x = -6) 3 ô
    assert.equal(h.fx('return')[0].x, -9);

    const h2 = harness();
    arena(h2, { level: 60, rank: 3, allies: ['warrior'], foes: [['c1_wolf', 30, 0]] });
    h2.run("var rok = team.find(m => m.classId === 'warrior'); rok.x = 12; rok.alive = false; rok.hp = 0; nyx.x = 2; nyx.z = -1;");
    h2.run('killMember(nyx, team); at(3000)');
    assert.deepEqual(json(h2, '[nyx.alive, nyx.x, nyx.z]'), [true, -44, -1]);   // đồng đội đã gục -> về mép sân phía mình
});

// Bảng sự kiện voidFx (hợp đồng với máy khách): kind -> các trường phải có (ngoài casterId, casterIdx)
const VOID_FX = { missiles: ['targetId', 'targetIndex', 'flight'], burst: ['targetId', 'targetIndex', 'x', 'z', 'orbLost', 'effects'], burstTick: ['n', 'effects'],
    channel: ['skill', 'duration', 'shell'], starAim: ['x', 'z', 'radius', 'lead', 'waves'], starWave: ['n', 'x', 'z', 'radius', 'effects'], hole: ['x', 'z', 'radius', 'duration', 'lashTimes', 'lashRadius'], lash: ['n', 'x', 'z', 'radius', 'effects'],
    channelEnd: ['reason'], vanish: ['duration'], return: ['x', 'z', 'hp'], erode: ['targetId', 'targetIndex', 'stacks'] };

test('trận AUTO thật có Nyx (hạt giống cố định): chạy hết không lỗi, trạng thái luôn hợp lệ, mọi sự kiện voidFx đúng bảng', () => {
    const seen = new Set();
    const setups = [   // [hạt giống, cấp, bậc, đội trái, đội phải (anh hùng) hoặc quái]
        [7, 60, 3, ['voidmage', 'warrior', 'priest', 'reaper'], ['voidmage', 'wrestler', 'dancer', 'alchemist'], null],
        [12, 1, 0, ['voidmage', 'archer', 'summoner', 'mage'], ['assassin', 'warrior', 'elementalist', 'priest'], null],
        [21, 40, 1, ['voidmage', 'warrior', 'priest'], null, [{ classId: 'b_valdric', x: 25, z: 0, boss: true }, { classId: 'c1_fire', x: 28, z: -3 }, { classId: 'c2_wisp', x: 32, z: 3 }]],
    ];
    for (const [seed, level, rank, left, right, monsters] of setups) {
        const h = harness();
        h.run(`(function () { let s = ${seed}; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
            var mk = (side, list) => createSquad(side, SQUAD_ORDER.filter(c => !list.includes(c)), Object.fromEntries(list.map(c => [c, { level: ${level}, rank: ${rank} }])));
            var room = { id: 'fixture', mode: ${monsters ? "'test'" : "'duel_hero'"}, status: 'active', clock: 100000, speed: 1.5, winner: null, stage: { diff: 'hell' }, stageApplied: true,
                players: { p1: { side: 'left', autoMode: true, squad: mk('left', ${JSON.stringify(left)}) },
                    p2: { side: 'right', isNPC: true, autoMode: true, squad: ${monsters ? `createMonsterSquad(${level}, ${JSON.stringify(monsters)}, { mul: 1.2, bossHp: 3 })` : `mk('right', ${JSON.stringify(right)})`} } } };
            rooms.fixture = room; curRoom = room;
            var broken = () => { for (const [pid, t] of Object.entries(room.players)) for (const m of t.squad) {
                for (const k of ['x', 'z', 'hp', 'mp', 'maxHp']) if (!Number.isFinite(m[k] ?? 0)) return pid + ':' + m.classId + ' ' + k + '=' + m[k];
                if (m.hp < 0 || m.hp > m.maxHp + 1) return pid + ':' + m.classId + ' máu ' + m.hp + '/' + m.maxHp;
                if (m.classId === 'voidmage' && m.voidReturnAt != null && room.clock > m.voidReturnAt + 400) return pid + ': Nyx kẹt trong cổng Hư Không';
                if (m.classId === 'voidmage' && !m.alive && m.statusEffects.some(e => e.type === 'void_channel')) return pid + ': Nyx đã gục mà kênh còn chạy';
            } return ''; }`);
        const tick = realLoop(h);
        for (let i = 0; i < 2400 && !h.run('room.winner'); i++) {   // tối đa 120 giây trận
            tick(1);
            assert.equal(h.run('broken()'), '', `hạt giống ${seed}, nhịp ${i}`);
        }
        for (const d of h.fx()) {
            assert.ok(VOID_FX[d.kind], `kind lạ: ${d.kind}`);
            for (const f of ['casterId', 'casterIdx', ...VOID_FX[d.kind]]) assert.ok(d[f] !== undefined && d[f] !== null, `${d.kind}.${f} (hạt giống ${seed})`);
            seen.add(d.kind);
        }
    }
    // (từng kind đã có bài thử riêng ở trên; ở đây chỉ cần chắc Nyx thật sự ra chiêu trong trận AUTO)
    assert.ok(seen.has('channel') && (seen.has('lash') || seen.has('starWave')), `các sự kiện đã thấy: ${[...seen]}`);
});
