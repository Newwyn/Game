// YunYou (Kiếm Tiên, classId `swordsage`) — bộ kiểm thử phía máy chủ cho tướng bay trên không,
// ngoại lệ PvP 2 YunYou cùng bay, đáp đất khi hết đồng minh không phải triệu hồi,
// 3 kỹ năng (Ngự Kiếm Tốc · Vạn Kiếm Đồng Quy · Trận Đồ Kiếm) và 2 thiên phú (Vết Kiếm Vỡ Giáp · Kiếm Tâm Thông Minh).
// Nạp server.js trong node:vm như tests/voidmage.test.js & tests/chessmaster.test.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const SHOP = require('../game/shop');
const P = require('../progression');

const realRequire = createRequire(path.join(__dirname, '../server.js'));
const SOURCE = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

/** Máy chủ trong vm: socket.io / http giả, Math.random điều khiển được (mặc định 0.5). */
function harness() {
    const events = [];
    const sockets = new Map();
    const ticks = [];
    const context = vm.createContext({
        console: { log() {} }, process: { env: {} }, Buffer,
        __dirname: path.join(__dirname, '..'), setInterval: fn => ticks.push(fn), clearInterval() {}, setTimeout: () => 1,
        require: id => id === './game/accounts' ? { createAccounts: () => ({}) }
            : id === './progression' ? { ...realRequire(id), loadAll: () => ({}), saveAll() {} }
            : id === 'socket.io' ? { Server: function () { return { on() {}, sockets: { sockets }, to: () => ({ emit: (name, data) => events.push({ name, data }) }) }; } }
            : id === 'http' ? { createServer: () => ({ listen() {} }) } : realRequire(id),
    });
    const run = code => vm.runInContext(code, context);
    run(SOURCE);
    run('var __rnd = 0.5; Math.random = () => __rnd;');
    const fx = kind => events.filter(e => e.name === 'swordFx' && (!kind || e.data.kind === kind)).map(e => JSON.parse(JSON.stringify(e.data)));
    const evs = name => events.filter(e => e.name === name).map(e => JSON.parse(JSON.stringify(e.data)));
    return { run, events, sockets, ticks, fx, evs };
}
const json = (h, code) => JSON.parse(h.run(`JSON.stringify(${code})`));

/**
 * Tạo phòng thử với YunYou (p1, left) ở x = 0, đồng minh `allies`, và đội địch `foes` hoặc `foeHeroes`.
 * Khả dụng trong vm: room, team, foes, yy, YI, T0, cast(i), at(ms), upTo(ms), hits, calcs, ally(id), foe(id), kill(m, sq).
 */
function arena(h, { level = 1, rank = 0, allies = ['warrior'], foes = [['monster_dummy', 8, 0]], foeLevel = 1, foeHeroes = null, foeRank = 0, yyX = 0, foeX = null } = {}) {
    const mine = ['swordsage', ...allies];
    const allyX = mine.filter(c => c !== 'swordsage');
    h.run(`var team = createSquad('left', SQUAD_ORDER.filter(c => !${JSON.stringify(mine)}.includes(c)),
            Object.fromEntries(${JSON.stringify(mine)}.map(c => [c, { level: ${level}, rank: ${rank} }])));
        var foes = ${foeHeroes
            ? `createSquad('right', SQUAD_ORDER.filter(c => !${JSON.stringify(foeHeroes)}.includes(c)),
                Object.fromEntries(${JSON.stringify(foeHeroes)}.map(c => [c, { level: ${foeLevel}, rank: ${foeRank} }])))`
            : `createMonsterSquad(${foeLevel}, ${JSON.stringify(foes)})`};
        var foe = (classId) => foes.find(e => e.classId === classId);
        var ally = (classId) => team.find(e => e.classId === classId);
        var room = { id: 'fixture', mode: 'test', status: 'active', clock: 100000, speed: 1.5,
            players: { p1: { side: 'left', squad: team }, p2: { side: 'right', isNPC: true, squad: foes } } };
        rooms.fixture = room; curRoom = room;
        var yy = team.find(m => m.classId === 'swordsage'), YI = team.indexOf(yy);
        yy.x = ${yyX}; yy.z = 0; yy.mp = yy.maxMp;
        ${allyX.length ? `team.forEach(m => { if (m !== yy) { m.x = ${yyX + 2}; m.z = 0; m.mp = m.maxMp; } });` : ''}
        ${foeX != null ? `foes.forEach((f, i) => { f.x = ${foeX} + i * 0.5; f.z = 0; });` : ''}
        var T0 = room.clock;
        var hits = [], calcs = [];
        var __hitTarget = hitTarget, __calculateDamage = calculateDamage;
        hitTarget = function (attacker, target, ti, opp, mult, now, opts) {
            const r = __hitTarget.apply(this, arguments);
            hits.push({ by: attacker.classId, to: target.classId, ti, mult, at: now - T0,
                aoe: !!(opts && opts.aoe), delay: (opts && opts.delay) || 0, isCrit: r.isCrit, isMiss: r.isMiss, damage: r.damage });
            return r;
        };
        calculateDamage = function (attacker, target, mult, now, opts) {
            const r = __calculateDamage.apply(this, arguments);
            calcs.push({ by: attacker.classId, to: target.classId, ti: foes.indexOf(target), mult: mult === undefined ? 1 : mult,
                at: now - T0, skill: !!(opts && opts.isSkill), damage: r.damage, isCrit: r.isCrit, isMiss: r.isMiss, immune: !!r.immune });
            return r;
        };
        function cast(i) { curRoom = room; executeSkill('fixture', 'p1', YI, 'p2', i); }
        function at(ms) {
            room.clock = T0 + ms; curRoom = room; runPending(room, room.clock);
            for (const [pid, t] of Object.entries(room.players)) for (let i = 0; i < t.squad.length; i++) {
                const opp = pid === 'p1' ? 'p2' : 'p1';
                if (typeof processYunYou === 'function') processYunYou(room, pid, i, opp, room.clock);
            }
        }
        function upTo(ms) { while (room.clock < T0 + ms) at(Math.min(ms, room.clock - T0 + 50)); }
        var kill = (m, squad) => { m.hp = 0; killMember(m, squad || team); };`);
}

/** Chạy vòng lặp trận thật (startBattleLoop): mỗi tick(1) = 50 ms trận (speed = 1.5 -> 1:1). */
function realLoop(h) {
    h.run("var __now = 5000000; Date.now = () => __now; room.lastReal = __now; startBattleLoop('fixture');");
    const loop = h.ticks.at(-1);
    return (n = 1) => { for (let i = 0; i < n; i++) { h.run('__now += 50'); loop(); } };
}

// ============================================================
// 1. Khai báo · Giá · Bậc · Tộc · Cân bằng chỉ số vs Lyra
// ============================================================
test('swordsage: khai báo CLASS_DEFS, SQUAD_ORDER, cửa hàng 1200 Kim Cương, ngoài MONSTER_SCALE_HEROES, raceLabel Không rõ, tốc đánh nhanh nhất (700 ms) & yếu hơn Lyra mỗi nhát', () => {
    const h = harness();
    const def = json(h, 'CLASS_DEFS.swordsage ?? null');
    assert.ok(def, 'phải có CLASS_DEFS.swordsage');
    assert.deepEqual(
        [def.name, def.title, def.className, def.emoji, def.color, def.dmgType, def.classGroup, def.race, def.raceLabel],
        ['YunYou', 'Kiếm Tiên', 'Cung Thủ', '🗡️', '#2dd4bf', 'physical', 'archer', 'human', 'Không rõ']
    );
    assert.equal(def.atkSpeed, 700);
    assert.equal(def.atkRange, 11);
    assert.equal(def.range, 'ranged');
    assert.equal(h.run("SQUAD_ORDER.includes('swordsage')"), true);
    assert.equal(SHOP.PRICES.swordsage, 1200);
    assert.equal(h.run("MONSTER_SCALE_HEROES.includes('swordsage')"), false);

    // Tốc đánh nhanh nhất trong mọi anh hùng chơi được
    const others = json(h, "HERO_IDS().filter(id => id !== 'swordsage').map(id => [id, CLASS_DEFS[id].atkSpeed])");
    for (const [id, spd] of others) assert.ok(def.atkSpeed < spd, `${id} atkSpeed ${spd} phải > 700`);

    // HP, P.DEF, M.DEF, P.ATK mỗi nhát rõ ràng thấp hơn Lyra (archer) ở cả Lv1 và Lv60 SSS (kể cả sau bonus Human ×1.05)
    const arch = json(h, 'CLASS_DEFS.archer');
    for (const [level, rank] of [[1, 0], [60, 3]]) {
        const sYy = P.computeStats(def, { level, rank });
        const sLy = P.computeStats(arch, { level, rank });
        for (const k of ['maxHp', 'pDef', 'mDef', 'pAtk']) {
            assert.ok(sYy[k] < sLy[k], `Lv${level} R${rank}: YunYou ${k}=${sYy[k]} phải < Lyra ${sLy[k]}`);
        }
    }

    // Kỹ năng & thiên phú & tỉ lệ theo bậc
    assert.deepEqual(def.skills.map(s => [s.type, s.orbCost, s.cooldown, s.castTime]),
        [['sword_haste', 1, 12000, 0], ['sword_multi', 2, 16000, 0], ['sword_formation', 4, 24000, 0]]);
    assert.deepEqual(
        [def.skills[2].chargeTime, def.skills[2].fireDuration, def.skills[2].ticks, def.skills[2].tickGap, def.skills[2].tickMultiplier, def.skills[2].flightTime, def.skills[2].lock],
        [2000, 5000, 10, 500, 0.25, 1200, 0]
    );
    assert.deepEqual(def.skills[1].byRank, { extraMultiplier: [0.5, 0.57, 0.63, 0.7] });
    for (let r = 0; r <= 3; r++) {
        const sks = P.scaleSkills(def.skills, r);
        assert.equal(sks[1].extraMultiplier, [0.5, 0.57, 0.63, 0.7][r]);
    }
    const fMults = [0, 1, 2, 3].map(r => P.scaleSkills(def.skills, r)[2].finalMultiplier);
    assert.equal(fMults[0], 3);
    assert.ok(fMults[0] <= fMults[1] && fMults[1] <= fMults[2] && fMults[2] <= fMults[3]);

    // talentInfo sạch, createSquad & progressPayload giữ raceLabel 'Không rõ' và airborne = false
    const talents = json(h, 'talentInfo(CLASS_DEFS.swordsage, { level: 60, rank: 3 })');
    assert.equal(talents.length, 2);
    for (const t of talents) assert.ok(t.desc && !t.desc.includes('?') && !t.desc.includes('{'), t.desc);
    h.run("var sq = createSquad('left', SQUAD_ORDER.filter(c => c !== 'swordsage'), { swordsage: { level: 1, rank: 0 } })");
    assert.equal(h.run('sq[0].airborne'), false);
    assert.equal(h.run('sq[0].raceLabel'), 'Không rõ');
    assert.equal(h.run("progressPayload('test_yy').heroes.swordsage.raceLabel"), 'Không rõ');
});

// ============================================================
// 2. Vòng đời bay & đáp đất · không bay khi 1 mình · đứng yên trên không
// ============================================================
test('swordsage bay & đáp đất: ngoài giao tranh đi bộ -> địch vào tầm đánh (còn đồng minh không phải triệu hồi) thì bay lên & đứng yên -> hết đồng minh không phải triệu hồi (kể cả còn triệu hồi) lập tức đáp đất và giữ grounded cả khi hồi sinh', () => {
    const h = harness();
    // Địch ở xa ngoài tầm đánh (x = 18 > atkRange 11)
    arena(h, { allies: ['warrior'], foes: [['monster_dummy', 18, 0]], yyX: 0 });
    const tick = realLoop(h);
    assert.equal(h.run('yy.airborne'), false);

    // Bước đầu: đi bộ, chưa bay vì địch ngoài tầm đánh
    tick(5);
    assert.equal(h.run('yy.airborne'), false);
    assert.ok(h.run('yy.x > 0'), 'YunYou phải đi bộ tiến lại trước khi địch vào tầm');

    // Đưa địch vào trong tầm đánh -> bay lên & phát swordFx 'takeoff'
    h.run('foes[0].x = yy.x + 10');
    tick(1);
    assert.equal(h.run('yy.airborne'), true);
    assert.equal(h.fx('takeoff').length, 1);

    // Đang bay: kể cả đẩy địch ra ngoài tầm đánh vẫn đứng yên trên không
    const airX = h.run('yy.x');
    h.run('foes[0].x = 40');
    tick(10);
    assert.equal(h.run('yy.x'), airX, 'đang bay phải đứng yên trên không');
    assert.equal(h.run('yy.airborne'), true);

    // Thêm 1 đồng đội TRIỆU HỒI sống, sau đó giết đồng đội thật (warrior) -> ĐÁP ĐẤT NGAY TRONG CÙNG NHỊP (killMember)
    h.run("team.push({ ...createMonsterSquad(1, [['c1_wolf', 0, 0]])[0], side: 'left', summon: true })");
    h.run('kill(ally("warrior"), team)');
    assert.equal(h.run('yy.airborne'), false, 'chỉ còn triệu hồi cũng phải đáp đất ngay khi đồng minh thật cuối cùng chết');
    assert.equal(h.run('yy.swordGrounded'), true);
    assert.equal(h.fx('land').length, 1);

    // Hồi sinh đồng minh thật sau khi đã đáp đất -> vẫn ở dưới đất tới hết trận
    h.run('var w = ally("warrior"); w.alive = true; w.hp = 500; w.state = "idle";');
    h.run('foes[0].x = yy.x + 8');
    tick(3);
    assert.equal(h.run('yy.airborne'), false, 'đã đáp đất là giữ dưới đất tới hết trận');
});

test('swordsage không bay khi đi 1 mình hoặc chỉ đi cùng quân triệu hồi', () => {
    for (const hasSummon of [false, true]) {
        const h = harness();
        arena(h, { allies: [], foes: [['monster_dummy', 8, 0]], yyX: 0 });
        if (hasSummon) h.run("team.push({ ...createMonsterSquad(1, [['c1_wolf', 1, 0]])[0], side: 'left', summon: true })");
        h.run('at(50); at(100);');
        assert.equal(h.run('yy.airborne'), false, `solo/summon-only (hasSummon=${hasSummon}) không được bay`);
        assert.equal(h.fx('takeoff').length, 0);
    }
});

// ============================================================
// 3. Miễn nhiễm trên không + không kẹt khi đáp đất + vẫn nhận buff/heal đồng minh
// ============================================================
test('airborne miễn mọi đòn đánh, kỹ năng đơn, AoE, khống chế, dấu ấn & AI phe địch (Nyx/Ignar/Grix/Brakk/Rok/Zerith/Leon), nhưng vẫn nhận heal & buff/khiên từ đồng minh (Seraphine/Rok/Nerissa)', () => {
    const h = harness();
    arena(h, {
        level: 40, rank: 2,
        allies: ['warrior', 'priest', 'dancer'],
        foeHeroes: ['warrior', 'mage', 'alchemist', 'reaper', 'wrestler', 'voidmage', 'chessmaster'],
        foeLevel: 40, foeRank: 2,
        yyX: -4, foeX: 4,
    });
    h.run('at(50)');   // YunYou bay lên (cách foe 8 <= 11)
    assert.equal(h.run('yy.airborne'), true);
    h.run('yy.hp = Math.floor(yy.maxHp * 0.5)');
    const hpHalf = h.run('yy.hp');
    const airX = h.run('yy.x');

    // Không kẻ địch nào nhắm được YunYou; AI địch không chọn YunYou
    assert.deepEqual(json(h, 'foes.map(f => canBeTargeted(yy, room.clock, f))'), foesCountFalse(7));
    assert.equal(h.run('findBestTarget(foes[0], team, room.clock) !== yy'), true);
    assert.equal(h.run('findLowestHpTarget(team, room.clock, foes[0]) !== yy'), true);

    // Đánh trực tiếp / AoE / CC từ phe địch -> 0 sát thương, không hiệu ứng
    h.run(`
        var enemyMage = foes.find(f => f.classId === 'mage');
        var enemyReaper = foes.find(f => f.classId === 'reaper');
        var enemyRok = foes.find(f => f.classId === 'warrior');
        var enemyBrakk = foes.find(f => f.classId === 'wrestler');
        var enemyNyx = foes.find(f => f.classId === 'voidmage');
        var enemyGrix = foes.find(f => f.classId === 'alchemist');
        var enemyLeon = foes.find(f => f.classId === 'chessmaster');
        var direct = calculateDamage(enemyMage, yy, 2, room.clock, { isSkill: true });
        var directAoe = hitTarget(enemyMage, yy, YI, room.players.p1, 2, room.clock, { aoe: true, noBlock: true });
        applyStun(yy, 1500, room.clock, enemyRok);
        knockUp(yy, 1200, enemyBrakk);
        applyFreeze(yy, 1200, room.clock, enemyNyx);
        fireAoe(room.id, 'p2', foes.indexOf(enemyMage), 'p1', yy.x, yy.z, 6, 2, 'meteor');
        goblinArea(room, 'p2', foes.indexOf(enemyGrix), 'p1', { x: yy.x, z: yy.z }, { radius: 6, multiplier: 2, tickMultiplier: 0.5, stacks: 3, healCut: 0.3 }, false);
        addPoison(enemyGrix, yy, 3, room.clock);
    `);
    assert.equal(h.run('direct.immune && direct.damage === 0 && directAoe.damage === 0'), true);
    assert.equal(h.run('yy.hp'), hpHalf, 'không chiêu phe địch nào được trừ máu YunYou đang bay');
    assert.equal(h.run('yy.x'), airX, 'không bị kéo hay đẩy lùi');
    assert.deepEqual(json(h, 'yy.statusEffects.map(e => e.type)'), [], 'không dính choáng/hất tung/đóng băng/độc từ địch');

    // Cho Nyx phe địch thả Sao Rơi + Hố Đen ngay toạ độ YunYou, Rok khiêu khích
    h.run(`
        enemyNyx.x = 0; enemyRok.x = -3; enemyBrakk.x = -3;
        executeSkill('fixture', 'p2', foes.indexOf(enemyNyx), 'p1', 1);
        executeSkill('fixture', 'p2', foes.indexOf(enemyNyx), 'p1', 2);
        executeSkill('fixture', 'p2', foes.indexOf(enemyRok), 'p1', 0);
        at(5500);
    `);
    assert.equal(h.run('yy.hp'), hpHalf, 'Sao Rơi, Hố Đen & Khiêu Khích không đụng được YunYou');
    assert.equal(h.run("yy.statusEffects.some(e => e.type === 'stun' || e.type === 'taunted')"), false);
    assert.equal(h.run('yy.x'), airX, 'Hố Đen không kéo được YunYou đang bay');

    // Đồng minh heal & buff vẫn tác dụng lên YunYou đang bay (đặt đồng minh lại đủ máu để kiểm tra cả chiêu đơn supportTarget lẫn chiêu cả đội)
    h.run(`
        team.forEach(a => { if (a !== yy) { a.alive = true; a.hp = a.maxHp; a.statusEffects = []; a.mp = a.maxMp; } });
        yy.hp = ${hpHalf};
        executeSkill('fixture', 'p1', team.indexOf(ally('priest')), 'p2', 1);
        executeSkill('fixture', 'p1', team.indexOf(ally('priest')), 'p2', 0);
        at(5900);
        executeSkill('fixture', 'p1', team.indexOf(ally('priest')), 'p2', 2);
        executeSkill('fixture', 'p1', team.indexOf(ally('warrior')), 'p2', 2);
        executeSkill('fixture', 'p1', team.indexOf(ally('dancer')), 'p2', 2);
        at(6600);
    `);
    assert.ok(h.run('yy.hp > ' + hpHalf), 'Seraphine phải hồi máu được cho YunYou đang bay');
    const types = json(h, 'yy.statusEffects.map(e => e.type)');
    for (const need of ['holy_shield', 'pray_blessing', 'guard_aura', 'water_god']) {
        assert.ok(types.includes(need), `thiếu buff đồng minh ${need} trên YunYou đang bay`);
    }
});

function foesCountFalse(n) { return Array(n).fill(false); }

test('hết đồng minh -> YunYou đáp đất -> quái nhắm & kết thúc trận bình thường (không kẹt)', () => {
    const h = harness();
    arena(h, { level: 1, allies: ['warrior'], foes: [['monster_tank', 8, 0], ['monster_archer', 10, 0]], foeLevel: 10, yyX: 0 });
    const tick = realLoop(h);
    tick(2);
    assert.equal(h.run('yy.airborne'), true);
    h.run('kill(ally("warrior"), team)');
    assert.equal(h.run('yy.airborne'), false);
    assert.equal(h.run('foes.every(f => f.alive && canBeTargeted(yy, room.clock, f) && findBestTarget(f, team, room.clock) === yy)'), true);
    for (let i = 0; i < 60 && h.run('yy.hp === yy.maxHp'); i++) tick(1);
    assert.ok(h.run('yy.hp < yy.maxHp'), 'quái phải đánh trúng YunYou sau khi đáp đất');
    // Chạy tiếp tới khi có người thắng
    for (let i = 0; i < 400 && !h.run('room.winner'); i++) tick(5);
    assert.ok(h.run('room.winner'), 'trận phải kết thúc sạch, không kẹt vô hạn');
});

// ============================================================
// 4. Ngoại lệ PvP: 2 YunYou phe đối địch CÙNG ĐANG BAY bắn nhau bình thường
// ============================================================
test('ngoại lệ PvP: 2 YunYou cùng đang bay nhắm & gây sát thương cho nhau (đánh thường, Vạn Kiếm Đồng Quy, Trận Đồ Kiếm, Vết Kiếm) trong khi đồng minh mặt đất vẫn không chạm được YunYou bay', () => {
    const h = harness();
    arena(h, {
        level: 40, rank: 2,
        allies: ['warrior'],
        foeHeroes: ['swordsage', 'warrior'],
        foeLevel: 40, foeRank: 2,
        yyX: -4, foeX: 4,
    });
    h.run('var foeYy = foe("swordsage"), foeWar = foe("warrior");');
    h.run('foeYy.x = 4; foeWar.x = 2;');
    const tick = realLoop(h);
    tick(2);
    assert.equal(h.run('yy.airborne && foeYy.airborne'), true, 'cả 2 YunYou phải đang bay');

    // YunYou1 nhìn thấy YunYou2; Warrior1 không nhìn thấy YunYou2
    assert.equal(h.run('canBeTargeted(foeYy, room.clock, yy)'), true);
    assert.equal(h.run('canBeTargeted(foeYy, room.clock, ally("warrior"))'), false);
    assert.equal(h.run('canBeTargeted(yy, room.clock, foeWar)'), false);

    // Đánh trực diện + kiếm phụ (S2) + Trận Đồ Kiếm (S3) giữa 2 YunYou đang bay
    const hpBefore = h.run('foeYy.hp');
    h.run(`
        yy.mp = yy.maxMp; cast(1);
        var e1 = hitTarget(yy, foeYy, foes.indexOf(foeYy), room.players.p2, 1, room.clock, { isSkill: false });
        swordApplyMark(yy, foeYy, room.clock);
        swordAfterAuto('fixture', 'p1', YI, 'p2', foes.indexOf(foeWar), room.clock);
        cast(2);
    `);
    tick(5);   // chạy delay kiếm phụ + mưa kiếm
    assert.ok(h.run('foeYy.hp < ' + hpBefore), 'YunYou1 phải gây sát thương được lên YunYou2 đang bay');
    assert.ok(h.run("foeYy.statusEffects.some(e => e.type === 'sword_mark' || e.type === 'sword_break')"), 'Vết Kiếm phải gắn lên YunYou2');

    // Warrior phe 1 đánh YunYou2 phải miễn
    h.run('var wHit = calculateDamage(ally("warrior"), foeYy, 1, room.clock, {});');
    assert.equal(h.run('wHit.immune && wHit.damage === 0'), true);
});

// ============================================================
// 5. 3 Kỹ năng của YunYou (S1 Ngự Kiếm Tốc · S2 Vạn Kiếm Đồng Quy · S3 Trận Đồ Kiếm)
// ============================================================
test('S1 Ngự Kiếm Tốc (+80% tốc đánh 6s) & S2 Vạn Kiếm Đồng Quy (8s phóng kiếm phụ tới mọi đối thủ khác, hệ số 50%..70% theo bậc) & cộng dồn S1+S2', () => {
    for (const [rank, wantMult] of [[0, 0.5], [1, 0.57], [2, 0.63], [3, 0.7]]) {
        const h = harness();
        arena(h, { rank, foes: [['monster_dummy', 7, 0], ['monster_dummy', 8, 2], ['monster_dummy', 9, -2]] });
        const baseSpd = h.run('getEffectiveStats(yy, room.clock).stats.atkSpeed');

        // Bật S1: tốc đánh tăng +80% trong 6000 ms
        h.run('cast(0)');
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.atkSpeed'), Math.floor(baseSpd / 1.8));
        h.run('at(5999)');
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.atkSpeed'), Math.floor(baseSpd / 1.8));
        h.run('at(6000)');
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.atkSpeed'), baseSpd);

        // Bật cả S1 + S2, đánh thường vào foe[0] -> kiếm phụ phóng tới foe[1] & foe[2] với đúng extraMultiplier theo bậc
        h.run('yy.mp = yy.maxMp; yy.skillCooldowns = [0, 0, 0]; cast(0); cast(1);');
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.atkSpeed'), Math.floor(baseSpd / 1.8));
        assert.equal(h.run("yy.statusEffects.some(e => e.type === 'sword_multi' && e.endTime > room.clock)"), true);
        const hpBefore = json(h, 'foes.map(f => f.hp)');
        h.run('hitTarget(yy, foes[0], 0, room.players.p2, 1, room.clock, { isSkill: false });');
        h.run('swordAfterAuto("fixture", "p1", YI, "p2", 0, room.clock);');
        assert.equal(h.fx('extraSwords').length, 1);
        assert.deepEqual(h.fx('extraSwords')[0].effects.map(e => e.targetIndex), [1, 2]);
        const extraCalcs = json(h, 'calcs.slice(-2)');
        assert.deepEqual(extraCalcs.map(c => [c.ti, c.mult, c.skill]), [[1, wantMult, false], [2, wantMult, false]]);
        h.run('at(6000 + 240)');
        const hpAfter = json(h, 'foes.map(f => f.hp)');
        assert.ok(hpAfter[1] < hpBefore[1] && hpAfter[2] < hpBefore[2], `rank ${rank}: foe[1], foe[2] phải mất máu từ kiếm phụ`);

        // S2 hết hạn sau 8000 ms (kể từ 6000 -> 14000)
        h.run('at(14000)');
        assert.equal(h.run("yy.statusEffects.some(e => e.type === 'sword_multi' && e.endTime > room.clock)"), false);
    }
});

test('S3 Trận Đồ Kiếm: dựng ngay không niệm (YunYou vẫn đánh thường & dùng KN1/2) -> 2s tích lực -> 5s mưa kiếm (10 đợt ×0.5s ×0.25) -> đại kiếm bay 1.2s nổ ×3 luôn CM; choáng KHÔNG huỷ, chết MỚI huỷ, 1 trận tại 1 thời điểm & đọc chỉ số lúc nổ', () => {
    // (A) Độc lập với YunYou: không casting state, tự đánh + bật được KN1 lúc tích lực & KN2 lúc bắn;
    //     10 đợt ×0.25 cách 0.5s; đại kiếm phóng sau đợt cuối & nổ sau 1.2s ×3 luôn CM (kể cả crit = 0)
    {
        const h = harness();
        arena(h, { level: 1, rank: 0, allies: ['warrior'], foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 2], ['monster_dummy', 25, 0]] });
        h.run('ally("warrior").x = -100; yy.crit = 0;'); // Rok đứng xa để chỉ đếm đòn đánh thường của YunYou
        const yi = h.run('YI');
        const tick = realLoop(h);
        tick(1);   // bay lên ở nhịp 1
        assert.equal(h.run('yy.airborne'), true);

        const autoCount = () => h.evs('autoAttack').filter(e => e.attackerId === 'p1' && e.attackerIndex === yi).length;
        h.run('yy.mp = yy.maxMp; yy.queuedSkills = [2];');
        for (let i = 0; i < 20 && !h.fx('formationStart').length; i++) tick(1);
        assert.equal(h.fx('formationStart').length, 1);
        const fsEv = h.fx('formationStart')[0];
        assert.equal(h.run('yy.castingSkillId'), null, 'S3 không còn trạng thái niệm trên YunYou');
        assert.notEqual(h.run('yy.state'), 'casting');
        assert.deepEqual([fsEv.chargeTime, fsEv.fireDuration, fsEv.ticks, fsEv.tickGap, fsEv.flightTime], [2000, 5000, 10, 500, 1200]);
        assert.ok(Math.abs(fsEv.x - (8 + 9 + 25) / 3) < 1e-6, 'tâm trận phải nằm đúng tâm nhóm địch còn sống lúc tạo');
        assert.ok(Math.abs(fsEv.z - 2 / 3) < 1e-6);

        // Trong 2s tích lực: YunYou vẫn đánh thường & vẫn dùng được KN1
        const autosAtCast = autoCount();
        tick(15); // +750 ms
        h.run('yy.mp = yy.maxMp; yy.queuedSkills = [0];');
        tick(24); // +1200 ms (tổng 1950 ms từ lúc tạo)
        const autosAfterCharge = autoCount();
        assert.ok(autosAfterCharge > autosAtCast, 'YunYou vẫn phải đánh thường trong lúc trận tích lực 2s');
        assert.equal(h.run("yy.statusEffects.some(e => e.type === 'sword_haste' && e.endTime > room.clock)"), true, 'phải bật được KN1 trong lúc trận tích lực');
        assert.equal(h.fx('formationRain').length, 0);
        assert.equal(h.fx('rainTick').length, 0);

        // Chạm đúng mốc 2000 ms -> bắt đầu pha bắn 5s
        tick(1);
        assert.equal(h.fx('formationRain').length, 1);

        // Trong 5s bắn: YunYou vẫn đánh thường & vẫn dùng được KN2
        tick(20); // +1000 ms
        h.run('yy.mp = yy.maxMp; yy.queuedSkills = [1];');
        tick(79); // +3950 ms (tổng 6950 ms từ lúc tạo -> đã qua 9 đợt)
        const autosAfterFire = autoCount();
        assert.ok(autosAfterFire > autosAfterCharge, 'YunYou vẫn phải đánh thường trong lúc trận bắn');
        assert.equal(h.run("yy.statusEffects.some(e => e.type === 'sword_multi' && e.endTime > room.clock)"), true, 'phải bật được KN2 trong lúc trận bắn');
        assert.equal(h.fx('rainTick').length, 9);
        assert.equal(h.fx('finalSwordLaunch').length, 0);

        // Chạm 7000 ms -> đợt thứ 10 & phóng đại kiếm
        tick(1);
        assert.equal(h.fx('rainTick').length, 10, 'phải có đúng 10 đợt mưa kiếm');
        assert.equal(h.fx('finalSwordLaunch').length, 1, 'kết thúc pha bắn phải phóng đại kiếm');
        assert.equal(h.fx('finalSwordLaunch')[0].flightTime, 1200);
        assert.equal(h.fx('finalSwordExplode').length, 0);

        // Bay chậm 1.2s (chưa tới 1200 ms vẫn chưa nổ)
        tick(23); // +1150 ms
        assert.equal(h.fx('finalSwordExplode').length, 0);
        tick(1);  // +50 ms = đúng 1200 ms sau đợt cuối
        assert.equal(h.fx('finalSwordExplode').length, 1, 'đại kiếm phải nổ sau đúng 1.2s bay');
        assert.equal(h.fx('formationEnd').some(e => e.reason === 'done'), true);

        const rains = h.fx('rainTick');
        const exps = h.fx('finalSwordExplode');
        assert.deepEqual(rains[0].effects.map(e => e.targetIndex), [0, 1]);
        assert.deepEqual(exps[0].effects.map(e => e.targetIndex), [0, 1]);
        assert.equal(exps[0].effects.every(e => e.isCrit === true), true, 'đại kiếm cuối phải chắc chắn chí mạng');

        const rainHits = json(h, "hits.filter(x => x.by === 'swordsage' && x.mult === 0.25)");
        assert.equal(rainHits.length, 20, '10 đợt × 2 địch trong vùng');
        const tickTimes = [...new Set(rainHits.map(x => x.at))];
        assert.equal(tickTimes.length, 10);
        for (let i = 1; i < tickTimes.length; i++) assert.equal(tickTimes[i] - tickTimes[i - 1], 500, 'mỗi đợt cách nhau 0.5s');
        const finalCalcs = json(h, "calcs.filter(c => c.by === 'swordsage' && c.mult === 3)");
        assert.equal(finalCalcs.length, 2);
        assert.equal(finalCalcs.every(c => c.isCrit === true), true);
        assert.equal(finalCalcs[0].at - tickTimes.at(-1), 1200, 'đại kiếm nổ đúng 1.2s sau đợt mưa kiếm cuối');
    }

    // (B) Đứng dưới đất & bị choáng thật sự -> KHÔNG huỷ Trận Đồ Kiếm
    {
        const h = harness();
        arena(h, { allies: [], foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 0]] });
        const tick = realLoop(h);
        tick(1);
        assert.equal(h.run('yy.airborne'), false);
        h.run('yy.mp = yy.maxMp; yy.queuedSkills = [2];');
        for (let i = 0; i < 20 && !h.fx('formationStart').length; i++) tick(1);
        assert.equal(h.fx('formationStart').length, 1);
        tick(10); // +500 ms -> choáng 2.5s ngay giữa lúc tích lực
        h.run('applyStun(yy, 2500, room.clock)');
        tick(1);
        assert.equal(h.run('yy.state'), 'stunned', 'YunYou dưới đất phải bị choáng thật');
        assert.equal(h.fx('formationEnd').length, 0, 'choáng trên YunYou KHÔNG được huỷ Trận Đồ Kiếm');
        tick(180); // +9000 ms -> đủ qua hết 2s + 5s + 1.2s
        assert.equal(h.fx('rainTick').length, 10);
        assert.equal(h.fx('finalSwordLaunch').length, 1);
        assert.equal(h.fx('finalSwordExplode').length, 1);
    }

    // (C) YunYou chết giữa chừng -> huỷ phần còn lại của Trận Đồ Kiếm & phát formationEnd(death)
    {
        const h = harness();
        arena(h, { allies: ['warrior'], foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 0]] });
        h.run('cast(2); upTo(3000);'); // qua tích lực 2s + 2 đợt mưa kiếm (2500, 3000)
        assert.equal(h.fx('rainTick').length, 2);
        h.run('kill(yy, team);');
        assert.equal(h.fx('formationEnd').filter(e => e.reason === 'death').length, 1);
        h.run('upTo(9000);');
        assert.equal(h.fx('rainTick').length, 2, 'sau khi YunYou chết không được nổ thêm mưa kiếm');
        assert.equal(h.fx('finalSwordLaunch').length, 0);
        assert.equal(h.fx('finalSwordExplode').length, 0);
    }

    // (D) Sát thương dùng chỉ số tại thời điểm từng đợt & mỗi lần chỉ 1 trận hoạt động
    {
        const h = harness();
        arena(h, { allies: ['warrior'], foes: [['monster_dummy', 8, 0]] });
        h.run('yy.crit = 0; cast(2); upTo(2500);');
        const d1 = h.run('hits.at(-1).damage');
        h.run('yy.pAtk *= 2; upTo(3000);');
        const d2 = h.run('hits.at(-1).damage');
        assert.ok(d2 > d1 * 1.5, `đợt sau pAtk×2 (${d2}) phải lớn hơn đợt đầu (${d1})`);

        // Dựng lại trận mới khi trận cũ chưa xong -> trận cũ bị thay thế ('replaced'), trận mới chạy trọn vẹn
        h.run('yy.mp = yy.maxMp; cast(2);');
        assert.equal(h.fx('formationEnd').some(e => e.reason === 'replaced'), true);
        h.run('upTo(3000 + 8200);');
        assert.equal(h.fx('finalSwordExplode').length, 1);
    }
});

// ============================================================
// 6. Thiên phú 1 (Vết Kiếm Vỡ Giáp) & Thiên phú 2 (Kiếm Tâm Thông Minh)
// ============================================================
test('TP1 Vết Kiếm Vỡ Giáp: mở ở Lv20 (−20/25/30% P.DEF); tích đủ 6 nhát từ thường / kiếm phụ / mưa kiếm / đại kiếm -> Vỡ Giáp 6s cho MỌI đòn & +10% P.ATK 8s (tối đa 3 tầng)', () => {
    // Chưa đủ Lv20 -> không mở TP1
    {
        const h = harness();
        arena(h, { level: 19, rank: 0 });
        assert.equal(h.run("talentOf(yy, 'sword_mark')"), null);
    }

    for (const [level, rank, wantBreak] of [[20, 1, 0.20], [20, 2, 0.25], [60, 3, 0.30]]) {
        const h = harness();
        arena(h, { level, rank, allies: ['warrior'], foes: [['monster_tank', 8, 0], ['monster_dummy', 9, 2]] });
        assert.equal(h.run("talentOf(yy, 'sword_mark').value"), wantBreak);
        const basePDef = h.run('getEffectiveStats(foes[0], room.clock).stats.pDef');
        const basePAtk = h.run('getEffectiveStats(yy, room.clock).stats.pAtk');

        // 5 dấu (từ swordApplyMark: thường / kiếm phụ / mưa kiếm / đại kiếm đều gọi swordApplyMark) -> chưa vỡ giáp
        for (let i = 1; i <= 5; i++) {
            const left = h.run('swordApplyMark(yy, foes[0], room.clock)');
            assert.equal(left, i);
        }
        assert.equal(h.run("foes[0].statusEffects.find(e => e.type === 'sword_mark').stacks"), 5);
        assert.equal(h.fx('break').length, 0);

        // Nhát thứ 6 -> tiêu thụ 6 dấu, gây sword_break 6s & YunYou +10% P.ATK 8s
        const rok = 'ally("warrior")';
        const rokDmgBefore = h.run(`calculateDamage(${rok}, foes[0], 1, room.clock, {}).damage`);
        const left6 = h.run('swordApplyMark(yy, foes[0], room.clock)');
        assert.equal(left6, 0);
        assert.equal(h.fx('break').length, 1);
        assert.equal(h.run("foes[0].statusEffects.some(e => e.type === 'sword_mark')"), false);
        assert.equal(h.run('getEffectiveStats(foes[0], room.clock).stats.pDef'), Math.floor(basePDef * (1 - wantBreak)));
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.pAtk'), Math.floor(basePAtk * 1.10));
        // Đòn vật lý của ĐỒNG MINH (Rok) đánh vào mục tiêu Vỡ Giáp mạnh hơn rõ rệt
        const rokDmgAfter = h.run(`calculateDamage(${rok}, foes[0], 1, room.clock, {}).damage`);
        assert.ok(rokDmgAfter > rokDmgBefore, 'Vỡ Giáp phải tăng sát thương vật lý cho MỌI người đánh');

        // Nổ thêm 3 lần nữa (tới 4 lần tổng) -> P.ATK YunYou chỉ tối đa 3 tầng (+30%)
        for (let k = 0; k < 18; k++) h.run('swordApplyMark(yy, foes[0], room.clock)');
        assert.equal(h.run("yy.statusEffects.find(e => e.type === 'sword_atk').stacks"), 3);
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.pAtk'), Math.floor(basePAtk * 1.30));

        // Hết 6s -> hết Vỡ Giáp, P.ATK vẫn còn tới 8s rồi hết
        h.run('at(6000)');
        assert.equal(h.run('getEffectiveStats(foes[0], room.clock).stats.pDef'), basePDef);
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.pAtk'), Math.floor(basePAtk * 1.30));
        h.run('at(8000)');
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.pAtk'), basePAtk);
    }

    // Xác minh đòn đánh thường, kiếm phụ (sau 240ms), mưa kiếm (5 đợt) và đại kiếm cuối đều gắn dấu -> đủ 6 thì nổ Vỡ Giáp
    {
        const h = harness();
        arena(h, { level: 20, rank: 1, foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 2]] });
        h.run(`
            yy.mp = yy.maxMp; cast(1);
            hitTarget(yy, foes[0], 0, room.players.p2, 1, room.clock, { isSkill: false });
            later(240, () => swordApplyMark(yy, foes[0], room.clock));
            swordAfterAuto('fixture', 'p1', YI, 'p2', 0, room.clock);
            at(240);
        `);
        assert.equal(h.run("foes[0].statusEffects.find(e => e.type === 'sword_mark')?.stacks"), 1);
        assert.equal(h.run("foes[1].statusEffects.find(e => e.type === 'sword_mark')?.stacks"), 1);

        // Tung S3 ở t=240: 10 đợt mưa kiếm (2s + 5s = +7000 -> tích +5 đủ 6 nổ Vỡ Giáp ở đợt 5, còn 5 dấu)
        // + đại kiếm cuối (+1200 -> 8200) gắn thêm 1 dấu -> đủ 6 nổ lần 2!
        h.run('cast(2); at(240 + 8200);');
        assert.equal(h.fx('break').length, 4, 'cả 2 mục tiêu phải nổ Vỡ Giáp đủ 2 lần qua 10 đợt mưa kiếm + đại kiếm cuối');
        assert.equal(h.run("foes[0].statusEffects.some(e => e.type === 'sword_break' && e.endTime > room.clock)"), true);
        assert.equal(h.run("foes[1].statusEffects.some(e => e.type === 'sword_break' && e.endTime > room.clock)"), true);
        assert.equal(h.run("yy.statusEffects.find(e => e.type === 'sword_atk')?.stacks"), 3);   // 4 lần Vỡ Giáp (2 mục tiêu × 2) -> +10% P.ATK mỗi lần, tối đa 3 tầng
        assert.equal(h.run("foes[0].statusEffects.some(e => e.type === 'sword_mark')"), false);
        assert.equal(h.run("foes[1].statusEffects.some(e => e.type === 'sword_mark')"), false);
    }
});

test('TP2 Kiếm Tâm Thông Minh: mở ở Lv40 (+6/8% tỉ lệ CM mỗi đòn hụt CM, đặt lại khi CM; +8/10% ST CM tối đa 5 tầng 8s, làm mới khi CM)', () => {
    {
        const h = harness();
        arena(h, { level: 39, rank: 2 });
        assert.equal(h.run("talentOf(yy, 'sword_focus')"), null);
    }

    for (const [rank, critPer, cdPer] of [[2, 60, 80], [3, 80, 100]]) {
        const h = harness();
        arena(h, { level: 60, rank });
        assert.deepEqual(json(h, "[talentOf(yy, 'sword_focus').value, talentOf(yy, 'sword_focus').critDmg]"), [critPer, cdPer]);
        const baseCrit = h.run('getEffectiveStats(yy, room.clock).stats.crit');
        const baseCd = h.run('getEffectiveStats(yy, room.clock).stats.critDmg');

        // 3 đòn không chí mạng -> cộng dồn 3 tầng sword_crit
        h.run('swordOnHitCrit(yy, false, room.clock); swordOnHitCrit(yy, false, room.clock); swordOnHitCrit(yy, false, room.clock);');
        assert.equal(h.run("yy.statusEffects.find(e => e.type === 'sword_crit').stacks"), 3);
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.crit'), Math.min(750, baseCrit + 3 * critPer));

        // Kích 1 đòn chí mạng (via calculateDamage forceCrit) -> xoá sword_crit về 0, +1 tầng sword_critdmg
        h.run('calculateDamage(yy, foes[0], 1, room.clock, { forceCrit: true });');
        assert.equal(h.run("yy.statusEffects.some(e => e.type === 'sword_crit')"), false, 'sau khi CM phải đặt lại tầng TLCM');
        assert.equal(h.run("yy.statusEffects.find(e => e.type === 'sword_critdmg').stacks"), 1);
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.critDmg'), baseCd + cdPer);

        // Chạm trần 5 tầng ở t = 4000 (làm mới 8000 ms -> hết ở 12000)
        h.run('at(4000)');
        for (let i = 0; i < 6; i++) h.run('swordOnHitCrit(yy, true, room.clock)');
        assert.equal(h.run("yy.statusEffects.find(e => e.type === 'sword_critdmg').stacks"), 5);
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.critDmg'), baseCd + 5 * cdPer);

        h.run('at(11999)');
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.critDmg'), baseCd + 5 * cdPer);
        h.run('at(12000)');
        assert.equal(h.run("yy.statusEffects.some(e => e.type === 'sword_critdmg' && e.endTime > room.clock)"), false, 'hết 8s từ lần CM cuối phải mất buff STCM');
        assert.equal(h.run('getEffectiveStats(yy, room.clock).stats.critDmg'), baseCd);
    }
});

// ============================================================
// 7. AI autoChooseSkill & giả lập trận AUTO kết thúc sạch
// ============================================================
test('AUTO 2v2 & PvP (2 YunYou): autoChooseSkill dùng đủ 3 kỹ năng, trận kết thúc có đội thắng không treo', () => {
    // 7a. PvE 2v3: YunYou + Rok vs quái cấp cao để trận kéo dài đủ dùng cả 3 chiêu
    {
        const h = harness();
        arena(h, { level: 50, rank: 2, allies: ['warrior'], foes: [['monster_tank', 9, -1], ['monster_tank', 10, 2], ['monster_archer', 11, 0]], foeLevel: 45, yyX: -1 });
        const yi = h.run('YI');
        h.run('room.players.p1.autoMode = true; yy.mp = yy.maxMp;');
        const tick = realLoop(h);
        for (let i = 0; i < 1200 && !h.run('room.winner'); i++) tick(2);
        assert.ok(h.run('room.winner'), 'trận AUTO 2v3 với quái phải kết thúc có kết quả');
        const used = new Set(h.evs('skillExecuted').filter(e => e.casterId === 'p1' && e.casterIdx === yi).map(e => e.type));
        for (const sk of ['sword_haste', 'sword_multi', 'sword_formation']) {
            assert.ok(used.has(sk), `AI phải dùng được kỹ năng ${sk}`);
        }
    }

    // 7b. PvP đối đầu 2v2 đều có YunYou
    {
        const h = harness();
        arena(h, {
            level: 40, rank: 2, allies: ['warrior'],
            foeHeroes: ['swordsage', 'warrior'], foeLevel: 40, foeRank: 2,
            yyX: -8, foeX: 8,
        });
        h.run('room.players.p1.autoMode = true; room.players.p2.autoMode = true;');
        const tick = realLoop(h);
        for (let i = 0; i < 2600 && !h.run('room.winner'); i++) tick(2);   // trận gương 2v2 kết thúc quanh nhịp 1700 (chiêu 3 chia 10 đợt nhỏ nên lâu hơn bản cũ một chút)
        assert.ok(h.run('room.winner'), 'trận PvP có 2 YunYou phải kết thúc sạch, không deadlock');
    }
});
