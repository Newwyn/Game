// ⏱️ Luật 3 phút cho mọi chế độ trừ Test (và mở đầu Prologue):
//   - PvE (Cốt truyện, Đấu với quái, Hoang dã, Hầm ngục...): hết 3 phút = thua do hết giờ.
//   - PvP (Đấu với tướng `duel_hero` & PvP 2 người): hết 3 phút = Sinh Tử cho TẤT CẢ (tướng + triệu hồi) mỗi 0,5s mất 5% maxHp,
//     bỏ qua khiên / hồi máu / YunYou đang bay; cùng gục 1 nhịp = bên tỉ lệ máu trước nhịp cao hơn thắng (bằng nhau = người đầu phòng thua).
// Nạp server.js trong node:vm như tests/judgment.test.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const realRequire = createRequire(path.join(__dirname, '../server.js'));
const SOURCE = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

function harness() {
    const events = [];
    const sockets = new Map();
    const ticks = [];
    const context = vm.createContext({
        console: { log() {} },
        process: { env: {} },
        Buffer,
        __dirname: path.join(__dirname, '..'),
        setInterval: fn => ticks.push(fn),
        clearInterval() {},
        setTimeout: () => 1,
        require: id => id === './game/accounts' ? { createAccounts: () => ({}) }
            : id === './progression' ? { ...realRequire(id), loadAll: () => ({}), saveAll() {} }
            : id === 'socket.io' ? {
                Server: function () {
                    return {
                        on() {},
                        sockets: { sockets },
                        to: () => ({ emit: (name, data) => events.push({ name, data: JSON.parse(JSON.stringify(data)) }) }),
                    };
                },
            }
            : id === 'http' ? { createServer: () => ({ listen() {} }) }
            : realRequire(id),
    });
    const run = code => vm.runInContext(code, context);
    run(SOURCE);
    run('var __rnd = 0.5; Math.random = () => __rnd;');
    const json = code => JSON.parse(run(`JSON.stringify(${code})`));
    return { run, events, sockets, ticks, json };
}

function makeHero(hp = 1000, maxHp = hp, extra = {}) {
    return {
        classId: 'warrior',
        alive: true,
        hp,
        maxHp,
        mp: 0,
        maxMp: 5000,
        pAtk: 100,
        mAtk: 0,
        pDef: 50,
        mDef: 50,
        crit: 0,
        critDmg: 1500,
        acc: 1000,
        dodge: 0,
        pen: 0,
        block: 0,
        lifesteal: 0,
        threat: 100,
        atkSpeed: 1000,
        moveSpeed: 1,
        x: 0,
        z: 0,
        statusEffects: [],
        passives: [],
        skills: [],
        ...extra,
    };
}

function setupRoom(h, { mode = 'campaign', isBotMatch = true, p1 = [makeHero()], p2 = [makeHero()], p2NPC = true, clock = 10000 } = {}) {
    h.run(`var room = {
        id: 'r1',
        mode: ${JSON.stringify(mode)},
        isBotMatch: ${JSON.stringify(isBotMatch)},
        status: 'active',
        clock: ${clock},
        speed: 1,
        winner: null,
        pending: [],
        players: {
            p1: { side: 'left', squad: ${JSON.stringify(p1)} },
            p2: { side: 'right', isNPC: ${JSON.stringify(p2NPC)}, squad: ${JSON.stringify(p2)} }
        }
    };
    rooms.r1 = room; curRoom = room;`);
}

test('3-minute clock runs in all combat modes except test, prologue and menu', () => {
    for (const mode of ['campaign', 'duel_monster', 'duel_hero', 'pvp', 'dungeon', 'wild']) {
        const h = harness();
        setupRoom(h, { mode, p2NPC: mode === 'campaign' || mode === 'duel_monster' || mode === 'dungeon' || mode === 'wild' });
        h.run('processStageTimer(room)');
        const timerEvents = h.events.filter(e => e.name === 'battleTimer');
        assert.equal(timerEvents.length, 1, `mode ${mode} should emit battleTimer`);
        assert.deepEqual(timerEvents[0].data, { limitMs: 180000, leftMs: 180000 });

        h.run('room.clock += 5000; processStageTimer(room)');
        assert.equal(h.events.filter(e => e.name === 'battleTimer').at(-1).data.leftMs, 175000);
    }

    // PvP 2 người khi mode không đặt (chỉ isBotMatch: false) vẫn đếm 3 phút
    {
        const h = harness();
        setupRoom(h, { mode: undefined, isBotMatch: false, p2NPC: false });
        h.run('processStageTimer(room)');
        assert.equal(h.events.filter(e => e.name === 'battleTimer').length, 1);
    }

    // test, prologue, menu không chạy đồng hồ 3 phút và không bật Sinh Tử
    for (const mode of ['test', 'prologue', 'menu']) {
        const h = harness();
        setupRoom(h, { mode, p2NPC: false });
        h.run('processStageTimer(room); room.clock += 180000; processStageTimer(room); processSuddenDeath(room, room.clock);');
        assert.equal(h.events.filter(e => e.name === 'battleTimer').length, 0, `mode ${mode} must not emit battleTimer`);
        assert.equal(h.events.filter(e => e.name === 'suddenDeath').length, 0, `mode ${mode} must not emit suddenDeath`);
        assert.equal(h.events.filter(e => e.name === 'battleEnd').length, 0, `mode ${mode} must not timeout`);
    }
});

test('PvE timeout at 0:00 causes player loss with timeout:true and reuses mode loss handling', () => {
    // 1. duel_monster: hết giờ là thua (không vào Sinh Tử)
    {
        const h = harness();
        setupRoom(h, { mode: 'duel_monster', isBotMatch: true, p2NPC: true });
        h.run('processStageTimer(room); room.clock += 180000; processStageTimer(room); processSuddenDeath(room, room.clock);');
        assert.equal(h.run('room.winner'), 'p2');
        assert.equal(h.run('room.stageTimeout'), true);
        const ends = h.events.filter(e => e.name === 'battleEnd');
        assert.equal(ends.length, 1);
        assert.deepEqual(ends[0].data, { winnerId: 'p2', loserId: 'p1', timeout: true });
        assert.equal(h.events.filter(e => e.name === 'suddenDeath').length, 0);
    }

    // 2. campaign: hết giờ hoàn thể lực (COST - 1) và báo timeout:true trên stageResult
    {
        const h = harness();
        setupRoom(h, { mode: 'campaign', isBotMatch: true, p2NPC: true });
        h.run(`
            var pr = progressOf('timer-camp');
            pr.stamina.value = 100;
            room.stage = { id: 'c1-01', diff: 'story', classes: ['warrior'], key: 'timer-camp', socketId: 'p1' };
            room.stageApplied = false;
            processStageTimer(room);
            room.clock += 180000;
            processStageTimer(room);
            processStageTimer(room);
        `);
        const ends = h.events.filter(e => e.name === 'battleEnd');
        assert.equal(ends.length, 1);
        assert.deepEqual(ends[0].data, { winnerId: 'p2', loserId: 'p1', timeout: true });
        const results = h.events.filter(e => e.name === 'stageResult');
        assert.equal(results.length, 1);
        assert.equal(results[0].data.timeout, true);
        assert.equal(results[0].data.win, false);
        assert.equal(h.run('progressOf("timer-camp").stamina.value'), 103); // c1-01 story COST=4 -> hoàn COST - 1 = 3
    }

    // 3. wild: hết giờ vẫn thua với timeout:true, không thưởng
    {
        const h = harness();
        setupRoom(h, { mode: 'campaign', isBotMatch: true, p2NPC: true });
        h.run(`
            var pr = progressOf('timer-wild');
            pr.campaign.cleared.story['c1-01'] = true;
            WD.syncReports(pr);
            QS.resetMain(pr);
            var g0 = pr.wallet.gold;
            var st0 = pr.stamina.value;
            room.stage = { id: 'wild-outskirts', diff: 'story', classes: ['warrior'], key: 'timer-wild', socketId: 'p1' };
            room.stageApplied = false;
            processStageTimer(room);
            room.clock += 180000;
            processStageTimer(room);
        `);
        const res = h.events.find(e => e.name === 'stageResult').data;
        assert.equal(res.timeout, true);
        assert.equal(res.win, false);
        assert.equal(res.rewards?.gold ?? 0, 0);
        assert.equal(h.run('progressOf("timer-wild").wallet.gold === g0'), true);
        assert.equal(h.run('progressOf("timer-wild").stamina.value === st0'), true);
    }
});

test('old 15s 1v1 sudden death rule is removed; PvP Sinh Tử starts only at 3:00', () => {
    const h = harness();
    // 1v1 PvP không bắt đầu Sinh Tử ở giây 15 hay giây 179
    setupRoom(h, { mode: 'duel_hero', isBotMatch: true, p2NPC: true });
    h.run('processStageTimer(room);');
    for (const dt of [15000, 15000, 149500]) {
        h.run(`room.clock += ${dt}; processStageTimer(room); processSuddenDeath(room, room.clock);`);
        assert.equal(h.events.filter(e => e.name === 'suddenDeath').length, 0);
        assert.equal(h.run('room.players.p1.squad[0].hp'), 1000);
        assert.equal(h.run('room.players.p2.squad[0].hp'), 1000);
    }

    // Vừa chạm 180,000 ms (còn lại 500ms từ 179500) -> không xử thua timeout mà bật Sinh Tử với reason:'time'
    h.run('room.clock += 500; processStageTimer(room); processSuddenDeath(room, room.clock);');
    assert.equal(h.run('room.winner'), null);
    assert.equal(h.events.filter(e => e.name === 'battleEnd').length, 0);
    const starts = h.events.filter(e => e.name === 'suddenDeath' && e.data.kind === 'start');
    assert.equal(starts.length, 1);
    assert.deepEqual(starts[0].data, { kind: 'start', reason: 'time' });
    // Nhịp đầu tiên trừ 5% mỗi bên
    assert.equal(h.run('room.players.p1.squad[0].hp'), 950);
    assert.equal(h.run('room.players.p2.squad[0].hp'), 950);
});

test('PvP Sinh Tử hits all living units on both sides (heroes + summons), ignores shields & airborne YunYou, respects god-mode', () => {
    const h = harness();
    // Tạo YunYou đang bay, 1 tướng có khiên lớn, và 1 triệu hồi mỗi bên
    h.run(`
        var yy = createSquad('left', SQUAD_ORDER.filter(c => c !== 'swordsage'), { swordsage: { level: 1, rank: 0 } })[0];
        var rock = { classId: 'warrior', alive: true, hp: 2000, maxHp: 2000, statusEffects: [{ type: 'holy_shield', hp: 50000, maxHp: 50000, endTime: 999999 }], passives: [] };
        var pet1 = { classId: 'elem_golem', summon: true, alive: true, hp: 1000, maxHp: 1000, statusEffects: [] };
        var enemyHero = { classId: 'mage', alive: true, hp: 1000, maxHp: 1000, statusEffects: [{ type: 'guard', hp: 50000, maxHp: 50000, endTime: 999999 }], passives: [] };
        var enemySummon = { classId: 'c1_wolf', summon: true, alive: true, hp: 800, maxHp: 800, statusEffects: [] };
        var room = {
            id: 'r_sd',
            mode: 'pvp',
            isBotMatch: false,
            status: 'active',
            clock: 10000,
            speed: 1,
            winner: null,
            pending: [],
            players: {
                p1: { side: 'left', squad: [yy, rock, pet1] },
                p2: { side: 'right', isNPC: false, squad: [enemyHero, enemySummon] }
            }
        };
        rooms.r_sd = room; curRoom = room;
        // Đặt YunYou vào trạng thái bay trên không (bình thường dealDamage miễn nhiễm)
        yy.airborne = true;
    `);

    // Xác nhận trạng thái bay thực sự miễn nhiễm với dealDamage thông thường
    assert.equal(h.run('isSwordAirborne(yy)'), true);
    assert.equal(h.run('swordFlyImmune(yy)'), true);
    const yyMax = h.run('yy.maxHp');
    const yyBefore = h.run('yy.hp');
    h.run('dealDamage(yy, 100, room.players.p1); runPending(room, room.clock);');
    assert.equal(h.run('yy.hp'), yyBefore, 'regular dealDamage is blocked while airborne');

    // Hết 3 phút -> Sinh Tử trừ 5% maxHp cho TẤT CẢ đơn vị sống ở cả 2 bên (kể cả YunYou đang bay, khiên, triệu hồi)
    h.run('processStageTimer(room); room.clock += 180000; processStageTimer(room); processSuddenDeath(room, room.clock);');

    const yyLoss = Math.max(1, Math.round(yyMax * 0.05));
    assert.equal(h.run('yy.hp'), yyBefore - yyLoss, 'airborne YunYou loses 5% maxHp per tick');
    assert.equal(h.run('rock.hp'), 1900, 'shield does not absorb Sinh Tử');
    assert.equal(h.run('rock.statusEffects[0].hp'), 50000, 'shield value stays untouched');
    assert.equal(h.run('pet1.hp'), 950, 'ally summon loses 5% maxHp');
    assert.equal(h.run('enemyHero.hp'), 950, 'enemy hero loses 5% maxHp despite guard shield');
    assert.equal(h.run('enemySummon.hp'), 760, 'enemy summon loses 5% maxHp');

    const tick = h.events.find(e => e.name === 'suddenDeath' && e.data.kind === 'tick');
    assert.equal(tick.data.hits.length, 5);

    // Sau 500ms nữa -> mỗi bên hồi máu cũng không làm tắt Sinh Tử, tiếp tục trừ thêm 5%
    h.run('yy.hp = Math.min(yy.maxHp, yy.hp + 10); room.clock += 500; processStageTimer(room); processSuddenDeath(room, room.clock);');
    assert.equal(h.run('rock.hp'), 1800);
    assert.equal(h.run('enemyHero.hp'), 900);

    // Cờ god-mode miễn trừ Sinh Tử cho đội có cờ
    h.run('room.players.p1.debugGodMode = true; room.clock += 500; processSuddenDeath(room, room.clock);');
    assert.equal(h.run('rock.hp'), 1800, 'debugGodMode protects p1');
    assert.equal(h.run('enemyHero.hp'), 850, 'p2 without god-mode still takes damage');

    // socketGod qua map sockets (cờ `testGod`) cũng được tôn trọng; YunYou đang bay chạm 0 máu vẫn bị kết liễu bởi Sinh Tử
    h.run(`
        room.players.p1.debugGodMode = false;
        room.players.p2.socketId = 'p2';
        yy.hp = 1;
    `);
    h.sockets.set('p2', { testGod: true });
    h.run('room.clock += 500; processSuddenDeath(room, room.clock);');
    assert.equal(h.run('rock.hp'), 1700);
    assert.equal(h.run('yy.hp'), 0);
    assert.equal(h.run('yy.alive'), false, 'airborne YunYou can die to Sinh Tử');
    assert.equal(h.run('enemyHero.hp'), 850, 'socketGod protects p2');
});

test('PvP Sinh Tử resolves until a hero side falls and breaks simultaneous-death ties by pre-tick HP fraction then first player loses', () => {
    // Trường hợp A: Cả 2 cùng gục trong 1 nhịp, bên có tỉ lệ máu trước nhịp cao hơn thắng (p1: 4% vs p2: 2% -> p1 thắng)
    {
        const h = harness();
        setupRoom(h, {
            mode: 'duel_hero',
            isBotMatch: true,
            p2NPC: true,
            p1: [makeHero(40, 1000)],
            p2: [makeHero(20, 1000)],
        });
        h.run('processStageTimer(room); room.clock += 180000; processStageTimer(room); processSuddenDeath(room, room.clock);');
        assert.equal(h.run('room.winner'), 'p1');
        const end = h.events.find(e => e.name === 'battleEnd').data;
        assert.equal(end.winnerId, 'p1');
        assert.equal(end.loserId, 'p2');
        assert.notEqual(end.draw, true);
    }

    // Trường hợp B: Bên p2 giữ tỉ lệ máu trước nhịp cao hơn (p1: 100/5000 = 2% vs p2: 40/1000 = 4% -> p2 thắng)
    {
        const h = harness();
        setupRoom(h, {
            mode: 'pvp',
            isBotMatch: false,
            p2NPC: false,
            p1: [makeHero(100, 5000)],
            p2: [makeHero(40, 1000)],
        });
        h.run('processStageTimer(room); room.clock += 180000; processStageTimer(room); processSuddenDeath(room, room.clock);');
        assert.equal(h.run('room.winner'), 'p2');
        const end = h.events.find(e => e.name === 'battleEnd').data;
        assert.equal(end.winnerId, 'p2');
        assert.equal(end.loserId, 'p1');
    }

    // Trường hợp C: Tỉ lệ máu trước nhịp BẰNG NHAU (30/1000 = 60/2000 = 3%) -> người chơi đầu phòng (p1) thua, p2 thắng
    {
        const h = harness();
        setupRoom(h, {
            mode: 'pvp',
            isBotMatch: false,
            p2NPC: false,
            p1: [makeHero(30, 1000)],
            p2: [makeHero(60, 2000)],
        });
        h.run('processStageTimer(room); room.clock += 180000; processStageTimer(room); processSuddenDeath(room, room.clock);');
        assert.equal(h.run('room.winner'), 'p2');
        const end = h.events.find(e => e.name === 'battleEnd').data;
        assert.equal(end.winnerId, 'p2');
        assert.equal(end.loserId, 'p1');
        assert.notEqual(end.draw, true);
    }

    // Trường hợp D: Triệu hồi còn sống nhưng tướng hết thì vẫn thua, và Sinh Tử chạy qua startBattleLoop ở chế độ duel_hero luôn ra kết quả
    {
        const h = harness();
        h.run(`
            var s1 = createSquad('left', SQUAD_ORDER.filter(c => c !== 'warrior'), { warrior: { level: 1, rank: 0 } });
            var s2 = createSquad('right', SQUAD_ORDER.filter(c => c !== 'warrior'), { warrior: { level: 1, rank: 0 } });
            s1[0].maxHp = 1000; s1[0].hp = 120; s1[0].moveSpeed = 0; s1[0].x = -10; s1[0].z = 0;
            s2[0].maxHp = 1000; s2[0].hp = 220; s2[0].moveSpeed = 0; s2[0].x = 10; s2[0].z = 0;
            var pet = createMonsterSquad(1, [['c1_wolf', -10, 0]])[0];
            pet.summon = true; pet.maxHp = 999; pet.hp = 999; pet.moveSpeed = 0; pet.pAtk = 0; pet.mAtk = 0; pet.skills = [];
            s1.push(pet);
            var __now = 5000000; Date.now = () => __now;
            var room = {
                id: 'r1',
                mode: 'duel_hero',
                isBotMatch: true,
                status: 'starting',
                countdown: 3,
                lastTick: __now,
                lastReal: __now,
                clock: 10000,
                winner: null,
                pending: [],
                players: {
                    p1: { side: 'left', squad: s1, autoMode: false },
                    p2: { side: 'right', isNPC: true, squad: s2, autoMode: true }
                }
            };
            rooms.r1 = room; curRoom = room;
            startBattleLoop('r1');
        `);
        const loop = h.ticks.at(-1);
        // Với DEFAULT_SPEED = 1 (timeScale = 1 / 1.5), ~5s đếm ngược + ~270s thực = 180s đồng hồ trận + vài nhịp Sinh Tử (< 6000 nhịp 50ms)
        for (let i = 0; i < 6000 && !h.run('!!room.winner'); i++) {
            h.run('__now += 50;');
            loop();
        }
        assert.equal(h.run('room.winner'), 'p2');
        assert.equal(h.events.some(e => e.name === 'battleTimer' && e.data.leftMs === 180000), true);
        assert.equal(h.events.some(e => e.name === 'battleTimer' && e.data.leftMs === 0), true);
        assert.equal(h.events.some(e => e.name === 'suddenDeath' && e.data.kind === 'start' && e.data.reason === 'time'), true);
        assert.equal(h.events.some(e => e.name === 'battleEnd' && e.data.winnerId === 'p2'), true);
        assert.equal(h.run('room.players.p1.squad[1].alive'), false, 'loser summon vanishes on battle end');
    }
});
