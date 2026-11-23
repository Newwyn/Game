// Pary (Búa Thánh, `holyhammer`) + Hệ thống chặn dịch chuyển (`relocate: true`) — kiểm tra đầy đủ phía máy chủ trong node:vm.
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

function harness() {
    const events = [];
    const sockets = new Map();
    const ticks = [];
    let onConn = null;
    const context = vm.createContext({
        console: { log() {} },
        process: { env: {} },
        Buffer,
        __dirname: path.join(__dirname, '..'),
        setInterval: fn => ticks.push(fn),
        clearInterval() {},
        setTimeout: () => 1,
        require: id => id === './game/accounts' ? { createAccounts: () => ({ resume: () => ({ ok: false }) }) }
            : id === './progression' ? { ...realRequire(id), loadAll: () => ({}), saveAll() {} }
            : id === 'socket.io' ? {
                Server: function () {
                    return {
                        on(ev, fn) { if (ev === 'connection') onConn = fn; },
                        sockets: { sockets },
                        to: () => ({ emit: (name, data) => events.push({ name, data }) }),
                    };
                },
            }
            : id === 'http' ? { createServer: () => ({ listen() {} }) }
            : realRequire(id),
    });
    const run = code => vm.runInContext(code, context);
    run(SOURCE);
    run('var __rnd = 0.5; Math.random = () => __rnd;');
    const fx = (eventName = 'paryFx', kind = null) => events
        .filter(e => e.name === eventName && (!kind || e.data.kind === kind))
        .map(e => JSON.parse(JSON.stringify(e.data)));
    const connectSocket = (id = 'p1', roomId = 'fixture') => {
        const handlers = {};
        const sock = {
            id, roomId, progressKey: id, lcServer: 'test',
            handshake: { auth: { clientId: 'test-' + id } },
            emit() {}, join() {}, use() {},
            on(ev, fn) { handlers[ev] = fn; },
        };
        sockets.set(id, sock);
        onConn?.(sock);
        sock.roomId = roomId; // gán lại sau io.on('connection') vì TEST_MODE tự tạo room_test_*
        return { sock, handlers };
    };
    return { run, events, sockets, ticks, fx, connectSocket };
}

const json = (h, code) => JSON.parse(h.run(`JSON.stringify(${code})`));

function arena(h, {
    level = 1, rank = 0, allies = [], foes = [['monster_dummy', 8, 0]], foeLevel = 1,
    foeHeroes = null, foeRank = 0, mode = 'test', pX = 0, pZ = 0, speed = 1.5,
} = {}) {
    const mine = ['holyhammer', ...allies];
    h.run(`
        var team = createSquad('left', SQUAD_ORDER.filter(c => !${JSON.stringify(mine)}.includes(c)),
            Object.fromEntries(${JSON.stringify(mine)}.map(c => [c, { level: ${level}, rank: ${rank} }])));
        var foes = ${foeHeroes
            ? `createSquad('right', SQUAD_ORDER.filter(c => !${JSON.stringify(foeHeroes)}.includes(c)),
                Object.fromEntries(${JSON.stringify(foeHeroes)}.map(c => [c, { level: ${foeLevel}, rank: ${foeRank} }])))`
            : `createMonsterSquad(${foeLevel}, ${JSON.stringify(foes)})`};
        team.forEach(m => { m.z = 0; });
        ${foeHeroes ? 'foes.forEach(m => { m.z = 0; });' : ''}
        var foe = (classId) => foes.find(e => e.classId === classId);
        var ally = (classId) => team.find(e => e.classId === classId);
        var room = { id: 'fixture', mode: ${JSON.stringify(mode)}, status: 'active', clock: 100000, speed: ${speed},
            pending: [], players: {
                p1: { side: 'left', squad: team },
                p2: { side: 'right', isNPC: ${mode !== 'duel_hero'}, squad: foes },
            } };
        rooms.fixture = room; curRoom = room;
        var pary = team.find(m => m.classId === 'holyhammer'), PI = team.indexOf(pary);
        pary.x = ${pX}; pary.z = ${pZ}; pary.mp = pary.maxMp;
        var T0 = room.clock;
        function cast(i, extraOpts = {}) {
            curRoom = room;
            executeSkill('fixture', 'p1', PI, 'p2', i, extraOpts);
        }
        function at(ms) {
            room.clock = T0 + ms; curRoom = room;
            runPending(room, room.clock);
            for (const p of Object.values(room.players)) {
                for (const m of p.squad) {
                    if (Array.isArray(m.statusEffects)) m.statusEffects = m.statusEffects.filter(ef => ef.endTime > room.clock);
                }
            }
            syncRelocateLocks(room, room.clock);
        }
        function upTo(ms) {
            while (room.clock < T0 + ms) at(Math.min(ms, room.clock - T0 + 50));
        }
    `);
}

function realLoop(h) {
    h.run("var __now = 5000000; Date.now = () => __now; room.lastReal = __now; startBattleLoop('fixture');");
    const loop = h.ticks.at(-1);
    return (n = 1) => {
        for (let i = 0; i < n; i++) {
            h.run('__now += 50');
            loop();
        }
    };
}

// ============================================================
// 1. Metadata, Shop, SQUAD_ORDER, MONSTER_SCALE_HEROES, chỉ số Lv1 & talentInfo
// ============================================================
test('Pary: metadata, roster, shop, highest Lv1 defences and monsterScale isolation', () => {
    const h = harness();
    const def = json(h, 'CLASS_DEFS.holyhammer');
    assert.equal(def.name, 'Pary');
    assert.equal(def.title, 'Búa Thánh');
    assert.equal(def.className, 'Chiến Binh');
    assert.equal(def.race, 'goblin');
    assert.equal(def.classGroup, 'warrior');
    assert.equal(def.dmgType, 'physical');
    assert.equal(def.range, 'melee');
    assert.ok(def.atkSpeed > 700, 'atkSpeed phải > 700 theo chuẩn hành động');

    assert.equal(h.run("SQUAD_ORDER.includes('holyhammer')"), true);
    assert.equal(h.run("MONSTER_SCALE_HEROES.includes('holyhammer')"), false, 'holyhammer không được nằm trong MONSTER_SCALE_HEROES');
    assert.equal(SHOP.PRICES.holyhammer, 1200);

    const pr = { owned: ['warrior'], wallet: { diamond: 1200 }, heroes: {} };
    const buyRes = SHOP.buy(pr, pr.wallet, 'holyhammer', new Set(['heroShop']));
    assert.equal(buyRes.ok, true);
    assert.equal(pr.owned.includes('holyhammer'), true);
    assert.equal(pr.wallet.diamond, 0);

    const paryLv1 = P.computeStats(def, { level: 1, rank: 0 });
    const rokLv1 = P.computeStats(json(h, 'CLASS_DEFS.warrior'), { level: 1, rank: 0 });
    const xeLv1 = json(h, 'CLASS_DEFS.chess_rook');
    assert.equal(paryLv1.pDef, 270);
    assert.equal(paryLv1.mDef, 230);
    assert.ok(paryLv1.pDef > rokLv1.pDef && paryLv1.mDef > rokLv1.mDef, 'giáp cao hơn Rok');
    assert.ok(paryLv1.pDef > xeLv1.pDef && paryLv1.mDef > xeLv1.mDef, 'giáp cao hơn quân Xe');
    assert.ok(paryLv1.maxHp > rokLv1.maxHp, 'máu cao hơn Rok');
    assert.ok(paryLv1.pAtk < rokLv1.pAtk, 'tấn công thấp hơn Rok');

    assert.equal(def.skills[0].orbCost, 2.5);
    assert.equal(def.skills[0].castTime, 2000);
    assert.equal(def.skills[0].cooldown, 10000);
    assert.equal(def.skills[1].orbCost, 3);
    assert.equal(def.skills[1].duration, 6000);
    assert.equal(def.skills[1].radius, 4.5);
    assert.equal(def.skills[2].orbCost, 4);
    assert.equal(def.skills[2].castTime, 2000);
    assert.equal(def.skills[2].cooldown, 25000);

    const ti = json(h, 'talentInfo(CLASS_DEFS.holyhammer, { level: 60, rank: 3 })');
    assert.equal(ti.length, 2);
    for (const p of ti) {
        assert.ok(!p.desc.includes('{') && !p.desc.includes('?'), `mô tả thiên phú sạch placeholder: ${p.desc}`);
    }
});

// ============================================================
// 2. Thuộc tính relocate: true, ngoại lệ Brakk & heroPanelPayload
// ============================================================
test('Relocate flag: marks all relocation skills (NOT brakk_grab) and exposes it in heroPanelPayload', () => {
    const h = harness();
    assert.equal(h.run('CLASS_DEFS.assassin.skills[0].relocate'), true, 'Jessica Phóng Bùa');
    assert.equal(h.run('CLASS_DEFS.assassin.skills[1].relocate'), true, 'Jessica Đột Kích');
    assert.equal(h.run('CLASS_DEFS.assassin.skills[2].relocate'), undefined, 'Jessica Tàng Hình không gắn relocate');
    assert.equal(h.run('CLASS_DEFS.assassin.passives[0].shadowStep.relocate'), true, 'Jessica Bóng Ẩn');
    assert.equal(h.run('CLASS_DEFS.archer.skills[0].relocate'), true, 'Lyra Tiễn Gió Chớp');
    assert.equal(h.run('CLASS_DEFS.reaper.skills[0].relocate'), true, 'Zerith Lưỡi Hái Xuyên Hồn');
    assert.equal(h.run('CLASS_DEFS.sylva_wolf.pounceRelocate'), true, 'Sylva Wolf Pounce');
    assert.equal(h.run('CLASS_DEFS.chess_knight.relocate'), true, 'Quân Mã');
    assert.equal(h.run("BOSS_SKILLS.b_wolf.find(s => s.id === 'pounce').relocate"), true);
    assert.equal(h.run("BOSS_SKILLS.b_morwen.find(s => s.id === 'dash').relocate"), true);
    assert.equal(h.run("BOSS_SKILLS.b_vexa.find(s => s.id === 'dash').relocate"), true);
    assert.equal(h.run('!!CLASS_DEFS.wrestler.skills[0].relocate'), false, 'Brakk Bá Vương Quật được miễn');

    const payload = JSON.parse(h.run(`
        (() => {
            const pr = progressOf('test_panel');
            for (const id of ['assassin', 'holyhammer']) if (!pr.owned.includes(id)) pr.owned.push(id);
            return JSON.stringify(heroPanelPayload(pr));
        })()
    `));
    const jess = payload.heroes.find(x => x.id === 'assassin');
    const paryPayload = payload.heroes.find(x => x.id === 'holyhammer');
    assert.equal(jess.skills[0].relocate, true);
    assert.equal(jess.skills[1].relocate, true);
    assert.equal(jess.skills[2].relocate, false);
    assert.ok(paryPayload && paryPayload.skills.length === 3, 'holyhammer có mặt trong heroPanelPayload');
});

// ============================================================
// 3. Kỹ năng 1: Niệm 2s (-50% ST & miễn CC) -> Đập 1.4x, văng cách biên 2u + choáng 1s; mục tiêu không đẩy vẫn nhận ST + choáng
// ============================================================
test('Skill 1: 2s spin cast (-50% dmg, CC immune) and smash knockback to 2u from enemy bound; unpushable still takes dmg+stun', () => {
    const h = harness();
    arena(h, { pX: 0, pZ: 0, foeHeroes: ['warrior'] });
    h.run(`
        var rok = foe('warrior');
        rok.x = 1.8; rok.z = 0; rok.dodge = 0; rok.block = 0; rok.tenacity = 0; rok.crit = 0; rok.mp = 0;
        pary.dodge = 0; pary.block = 0; pary.crit = 0; pary.mp = pary.maxMp;
    `);
    const baseDmg = h.run('calculateDamage(rok, pary, 1.0, room.clock, { isSkill: false }).damage');

    h.run('pary.queuedSkills.push(0);');
    const step = realLoop(h);
    step(2); // +100ms -> đang niệm 2000ms
    assert.equal(h.run('pary.state'), 'casting');
    assert.equal(h.run('pary.castingSkillId'), 0);
    assert.equal(h.run('ccImmune(pary, room.clock)'), true, 'miễn khống chế khi đang gồng KN1');

    const spinDmg = h.run('calculateDamage(rok, pary, 1.0, room.clock, { isSkill: false }).damage');
    assert.ok(spinDmg <= Math.ceil(baseDmg * 0.55) && spinDmg >= Math.floor(baseDmg * 0.45),
        `sát thương khi gồng KN1 phải giảm ~50%: base=${baseDmg}, spin=${spinDmg}`);

    // Choáng giữa lúc gồng -> KHÔNG ngắt chiêu
    h.run('applyStun(pary, 2000, room.clock)');
    step(5); // +250ms
    assert.equal(h.run('pary.state'), 'casting', 'choáng không được ngắt gồng KN1');

    // Cho chạy hết 2000ms niệm + 220ms impact
    const rokHpBefore = h.run('rok.hp');
    step(40);
    const maxX = h.run('ARENA_BOUNDS.maxX');
    const rokX = h.run('rok.x');
    assert.equal(rokX, maxX - 2, 'Rok bị hất tới cách biên sân địch 2 đơn vị');
    assert.ok(rokX <= maxX, 'không bao giờ vượt ngoài ARENA_BOUNDS');
    assert.ok(h.run('rok.hp') < rokHpBefore, 'Rok chịu sát thương đập KN1');
    assert.equal(h.run("rok.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), true, 'Rok bị choáng sau khi đáp');

    // Trường hợp không thể đẩy (Brakk hoá Khổng Lồ trong 5s đầu): không bay nhưng vẫn nhận sát thương + choáng 1s
    const h2 = harness();
    arena(h2, { pX: 0, pZ: 0, foeHeroes: ['wrestler'] });
    h2.run(`
        var brakk = foe('wrestler');
        brakk.x = 2.0; brakk.z = 0; brakk.dodge = 0; brakk.block = 0; brakk.tenacity = 0; brakk.crit = 0;
        pary.dodge = 0; pary.block = 0; pary.crit = 0;
        executeSkill('fixture', 'p2', 0, 'p1', 2, { free: true });
        at((CLASS_DEFS.wrestler.skills[2].impact ?? 0) + 50);
    `);
    assert.equal(h2.run('ccImmune(brakk, room.clock)'), true, 'Brakk Khổng Lồ đang miễn khống chế');
    const brakkStartX = h2.run('brakk.x');
    const brakkHpBefore = h2.run('brakk.hp');
    h2.run('pary.targetIndex = 0; cast(0);');
    const step2 = realLoop(h2);
    step2(6); // +300ms (qua impact 220ms và chạy cả processBrakk mỗi nhịp)
    assert.equal(h2.run('brakk.x'), brakkStartX, 'Brakk Khổng Lồ không bị đẩy bay');
    assert.ok(h2.run('brakk.hp') < brakkHpBefore, 'Brakk Khổng Lồ vẫn nhận sát thương KN1');
    assert.equal(h2.run("brakk.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), true, 'Brakk Khổng Lồ vẫn bị choáng 1s (noCleanse)');
});

// ============================================================
// 4. Kỹ năng 2: Khiên Pary tăng theo N (trần 5 = 18%), đồng minh trong vòng CHỈ nhận khiên = 0.5 * (pDef + mDef) * 6
// ============================================================
test('Skill 2: shield scales by unit count N (cap 5 -> 18%) and allies inside receive ONLY 0.5*(pDef+mDef)*6 shield', () => {
    // N = 0 (một mình)
    const h0 = harness();
    arena(h0, { pX: 0, pZ: 0, foes: [['monster_tank', 20, 0]] });
    h0.run('cast(1)');
    const s0 = json(h0, "pary.statusEffects.find(e => e.type === 'holy_aura_shield')");
    assert.equal(s0.maxHp, Math.round(h0.run('pary.maxHp') * 0.08), 'N=0 cho khiên 8% maxHp');

    // N = 2 (1 đồng minh trong vòng + 1 địch trong vòng; 1 đồng minh + 1 địch ngoài vòng)
    const h2 = harness();
    arena(h2, { pX: 0, pZ: 0, allies: ['archer', 'priest'], foeHeroes: ['warrior', 'mage'] });
    h2.run(`
        ally('archer').x = 2; ally('archer').z = 0;
        ally('priest').x = -12; ally('priest').z = 0;
        foe('warrior').x = -3; foe('warrior').z = 0;
        foe('mage').x = 15; foe('mage').z = 0;
        cast(1);
    `);
    const s2 = json(h2, "pary.statusEffects.find(e => e.type === 'holy_aura_shield')");
    assert.equal(s2.maxHp, Math.round(h2.run('pary.maxHp') * 0.08 * (1 + 0.25 * 2)), 'N=2 cho khiên 12% maxHp');
    const allySh = json(h2, "ally('archer').statusEffects.find(e => e.type === 'holy_aura_ally_shield')");
    assert.ok(allySh, 'đồng minh trong vòng nhận khiên đồng minh');
    assert.equal(allySh.maxHp, Math.round(0.5 * (270 + 230) * 6), 'khiên đồng minh = 0.5*(pDef+mDef)*6');
    assert.equal(h2.run("ally('archer').statusEffects.some(e => e.type === 'holy_aura')"), false, 'đồng minh không nhận hào quang');
    assert.equal(h2.run("ally('priest').statusEffects.some(e => e.type === 'holy_aura_ally_shield')"), false, 'đồng minh ngoài vòng không nhận khiên');

    // N = 6 (3 đồng minh + 3 địch trong vòng 4.5) -> trần 5 = 18%
    const h6 = harness();
    arena(h6, { pX: 0, pZ: 0, allies: ['archer', 'priest', 'mage'], foeHeroes: ['warrior', 'assassin', 'reaper'] });
    h6.run(`
        ally('archer').x = 1; ally('archer').z = 0;
        ally('priest').x = -1; ally('priest').z = 0;
        ally('mage').x = 0; ally('mage').z = 2;
        foe('warrior').x = 2; foe('warrior').z = 0;
        foe('assassin').x = -2; foe('assassin').z = 0;
        foe('reaper').x = 0; foe('reaper').z = -2;
        cast(1);
    `);
    const s6 = json(h6, "pary.statusEffects.find(e => e.type === 'holy_aura_shield')");
    assert.equal(s6.maxHp, Math.round(h6.run('pary.maxHp') * 0.18), 'N=6 chặn trần ở 5 -> 18% maxHp');
});

// ============================================================
// 5. Hệ thống chặn dịch chuyển: đứng trong vòng không bấm/auto/Bóng Ẩn được; từ ngoài lao vào/xuyên qua bị dừng sát mép + choáng 1s + hồi 15% khiên + emit Bị chặn!
// ============================================================
test('Relocation blocking: locks units inside aura and intercepts/stuns external relocators with 15% shield restore and Bị chặn! fx', () => {
    // Phần 1: Đứng sẵn bên trong vòng hào quang (foeLevel 20 để mở Thiên phú 1 Bóng Ẩn)
    const h1 = harness();
    arena(h1, { pX: 0, pZ: 0, foeHeroes: ['assassin', 'wrestler'], foeLevel: 20, foeRank: 1 });
    h1.run(`
        var jess = foe('assassin'), brakk = foe('wrestler');
        var JI = foes.indexOf(jess);
        jess.x = 2; jess.z = 0; jess.mp = jess.maxMp; jess.skillCooldowns = [0, 0, room.clock + 10000];
        brakk.x = -2; brakk.z = 0; brakk.mp = brakk.maxMp;
        cast(1);
    `);
    assert.equal(h1.run('isRelocateLocked(jess, room.clock)'), true, 'địch trong vòng bị gắn relocate_lock');
    assert.equal(h1.run('skillUsable(jess, 0)'), false, 'Phóng Bùa bị khoá trong vòng');
    assert.equal(h1.run('skillUsable(jess, 1)'), false, 'Đột Kích bị khoá trong vòng');
    assert.equal(h1.run('skillUsable(jess, 2)'), true, 'Tàng Hình không gắn relocate nên vẫn dùng được');
    assert.equal(h1.run('skillUsable(brakk, 0)'), true, 'Brakk Bá Vương Quật vẫn dùng được');

    // Socket queueSkill từ chối chiêu relocate khi đang bị relocate_lock
    const { handlers } = h1.connectSocket('p2', 'fixture');
    handlers.queueSkill({ memberIndex: h1.run('JI'), skillIndex: 1 });
    assert.equal(h1.run('jess.queuedSkills.length'), 0, 'queueSkill phải từ chối chiêu relocate khi bị khoá');

    // AI tự động bỏ qua chiêu relocate khi đang bị khoá
    h1.run('jess.targetIndex = PI;');
    assert.equal(h1.run('autoChooseSkill(jess, JI, room.players.p2, room.players.p1, room.clock)'), -1, 'AI bỏ qua chiêu relocate khi bị khoá');

    // Bóng Ẩn (nội tại Jessica) cũng không kích hoạt khi đang đứng trong vòng
    h1.run('jess.hp = Math.floor(jess.maxHp * 0.3); checkShadowStep(jess);');
    assert.equal(h1.run('jess.x'), 2, 'Bóng Ẩn không dịch chuyển khi khởi phát bên trong hào quang');

    // Đi bộ ra khỏi vòng -> syncRelocateLocks xoá khoá ngay
    h1.run('jess.x = 12; jess.z = 0; syncRelocateLocks(room, room.clock);');
    assert.equal(h1.run('isRelocateLocked(jess, room.clock)'), false, 'ra khỏi vùng thì hết relocate_lock');

    // Phần 2: Từ ngoài bay vào hoặc lướt xuyên qua hào quang (dùng đúng index thật theo SQUAD_ORDER)
    const h2 = harness();
    arena(h2, { pX: 0, pZ: 0, allies: ['priest'], foeHeroes: ['reaper', 'assassin', 'archer'] });
    h2.run(`
        var sera = ally('priest'), SI = team.indexOf(sera);
        sera.x = 10; sera.z = 0; sera.hp = 500;
        var zerith = foe('reaper'), jessOut = foe('assassin'), lyraOut = foe('archer');
        var ZI = foes.indexOf(zerith), JI2 = foes.indexOf(jessOut), LI = foes.indexOf(lyraOut);
        zerith.x = -8; zerith.z = 0; zerith.mp = zerith.maxMp; zerith.targetIndex = PI;
        jessOut.x = -9; jessOut.z = 0; jessOut.mp = jessOut.maxMp; jessOut.targetIndex = PI;
        lyraOut.x = -6; lyraOut.z = 0; lyraOut.mp = lyraOut.maxMp;
        cast(1);
        var sh2 = pary.statusEffects.find(e => e.type === 'holy_aura_shield');
        sh2.hp = Math.round(sh2.maxHp * 0.4);
    `);
    const maxSh2 = h2.run('sh2.maxHp');
    h2.events.length = 0;

    // Zerith Lưỡi Hái Xuyên Hồn lướt từ x=-8 xuyên qua (0,0) về phía Seraphine (x=10)
    h2.run("executeSkill('fixture', 'p2', ZI, 'p1', 0)");
    const dZero = h2.run('Math.hypot(zerith.x - pary.x, (zerith.z || 0) - (pary.z || 0))');
    assert.ok(Math.abs(dZero - 4.5) < 0.15, `Zerith bị chặn ngay mép vòng (~4.5), nhận d=${dZero}`);
    assert.equal(h2.run("zerith.statusEffects.some(e => e.type === 'stun' && e.endTime >= room.clock + 950)"), true, 'Zerith bị choáng 1s');
    assert.equal(h2.run('sh2.hp'), Math.round(maxSh2 * 0.4) + Math.round(maxSh2 * 0.15), 'Pary hồi 15% khiên tối đa của Hào quang');
    const blkEv = h2.fx('paryFx', 'relocateBlocked')[0];
    assert.ok(blkEv && blkEv.text === 'Bị chặn!', 'phát sự kiện paryFx relocateBlocked với text Bị chặn!');

    // Jessica Đột Kích lướt từ x=-9 xuyên qua (0,0) về phía Pary/Seraphine
    h2.run("executeSkill('fixture', 'p2', JI2, 'p1', 1)");
    assert.ok(h2.run('jessOut.x') < h2.run('pary.x'), 'Jessica Đột Kích bị dừng ở phía trước mép vòng');
    assert.ok(Math.abs(h2.run('Math.hypot(jessOut.x - pary.x, (jessOut.z || 0) - (pary.z || 0))') - 4.5) < 0.15);
    assert.equal(h2.run("jessOut.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), true);

    // Jessica Phóng Bùa (nhảy lùi từ x=-7 hướng vào +X vì Seraphine máu thấp hơn đang ở -12) -> cắt mép vòng
    h2.run("sera.x = -12; sera.hp = 100; jessOut.statusEffects = []; jessOut.x = -7; jessOut.z = 0; jessOut.skillCooldowns[0] = 0; executeSkill('fixture', 'p2', JI2, 'p1', 0);");
    assert.ok(Math.abs(h2.run('Math.hypot(jessOut.x - pary.x, (jessOut.z || 0) - (pary.z || 0))') - 4.5) < 0.15, 'Jessica Phóng Bùa nhảy lùi bị chặn ở mép vòng');
    assert.equal(h2.run("jessOut.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), true, 'Jessica Phóng Bùa bị choáng 1s khi chặn');
    assert.equal(h2.run("sera.statusEffects.some(e => e.type === 'seal')"), false, 'bị chặn khi nhảy lùi nên không phóng bùa');

    // Lyra Tiễn Gió Chớp nhảy lùi từ x=-6 hướng vào +X (mục tiêu Seraphine ở -12) -> cắt mép vòng
    h2.run("lyraOut.targetIndex = SI; executeSkill('fixture', 'p2', LI, 'p1', 0);");
    assert.ok(Math.abs(h2.run('Math.hypot(lyraOut.x - pary.x, (lyraOut.z || 0) - (pary.z || 0))') - 4.5) < 0.15, 'Lyra nhảy lùi bị chặn ở mép vòng');
    assert.equal(h2.run("lyraOut.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), true);
    assert.ok(h2.run('sh2.hp') <= maxSh2, 'lượng hồi khiên không vượt trần shieldMax');

    // Bóng Ẩn từ ngoài nhảy xuyên qua hào quang + kiểm tra trần khiên (foeLevel 20 để mở Thiên phú 1)
    const h3 = harness();
    arena(h3, { pX: 0, pZ: 0, allies: ['priest'], foeHeroes: ['assassin'], foeLevel: 20, foeRank: 1 });
    h3.run(`
        ally('priest').x = 10; ally('priest').z = 0; ally('priest').hp = 100;
        var jessB = foe('assassin'); jessB.x = -9; jessB.z = 0;
        cast(1);
        var sh3 = pary.statusEffects.find(e => e.type === 'holy_aura_shield');
        sh3.hp = sh3.maxHp - 10;
        jessB.hp = Math.floor(jessB.maxHp * 0.3);
        checkShadowStep(jessB);
    `);
    assert.equal(h3.run('sh3.hp'), h3.run('sh3.maxHp'), 'hồi khiên khi chặn Bóng Ẩn chạm trần shieldMax');
    assert.equal(h3.run("jessB.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), true, 'Bóng Ẩn từ ngoài bị chặn & choáng 1s');
});

// ============================================================
// 6. Ngoại lệ Brakk: Bá Vương Quật (brakk_grab) KHÔNG bị chặn bởi Hào Quang Thánh Thần
// ============================================================
test('Brakk exemption: Bá Vương Quật (brakk_grab) is NOT blocked inside Pary aura', () => {
    const h = harness();
    arena(h, { pX: 0, pZ: 0, foeHeroes: ['wrestler'] });
    h.run(`
        var brakk = foe('wrestler'), BI = foes.indexOf(brakk);
        brakk.x = 2; brakk.z = 0; brakk.dodge = 0; brakk.mp = brakk.maxMp;
        cast(1);
        var aura = pary.statusEffects.find(e => e.type === 'holy_aura');
        var sh = pary.statusEffects.find(e => e.type === 'holy_aura_shield');
        sh.hp = 5000; sh.maxHp = 5000;
    `);
    h.events.length = 0;
    const beforeX = h.run('brakk.x');
    h.run("executeSkill('fixture', 'p2', BI, 'p1', 0)");
    assert.notEqual(h.run('brakk.x'), beforeX, 'Brakk tự do lao/vồ');
    assert.equal(h.run("brakk.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), false, 'Brakk không bị choáng');
    assert.equal(h.run('aura.blockedCount'), 0, 'Hào quang không tính lần chặn nào từ Brakk');
    assert.ok(h.run('sh.hp < 5000 && sh.hp > 0'), 'khiên Pary chỉ hấp thụ đòn quật chứ không được hồi từ Brakk');
    assert.equal(h.fx('paryFx', 'relocateBlocked').length, 0);
});

// ============================================================
// 7. Tuyệt kỹ (KN3): 2s niệm KHÔNG miễn CC (bị choáng -> mất chiêu); 3 nhịp sau cast miễn CC + nhận ST thường; Nhịp 3 toàn sân kéo YunYou xuống rồi bay lại
// ============================================================
test('Skill 3: stunned during 2s cast interrupts skill; 3 slams grant CC-immune (normal dmg), pull flying YunYou down then allow re-takeoff', () => {
    // Phần A: choáng trong 2s niệm làm mất chiêu
    const hA = harness();
    arena(hA, { pX: 0, pZ: 0, foeHeroes: ['warrior'] });
    hA.run('foe("warrior").x = 2; foe("warrior").z = 0; pary.queuedSkills.push(2);');
    const stepA = realLoop(hA);
    stepA(2);
    assert.equal(hA.run('pary.state'), 'casting');
    assert.equal(hA.run('pary.castingSkillId'), 2);
    assert.equal(hA.run('ccImmune(pary, room.clock)'), false, 'KN3 không miễn khống chế khi đang niệm');
    hA.run('applyStun(pary, 1000, room.clock)');
    stepA(2);
    assert.equal(hA.run('pary.state'), 'stunned', 'bị choáng làm ngắt KN3');
    assert.equal(hA.run('pary.castingSkillId'), null);

    // Phần B: 3 nhịp giáng búa + kéo YunYou đang bay xuống ở nhịp 3 rồi bay lại
    const hB = harness();
    arena(hB, { pX: 0, pZ: 0, allies: ['archer'], foeHeroes: ['swordsage', 'priest', 'mage'] });
    hB.run(`
        var lyraAlly = ally('archer'); lyraAlly.x = -6; lyraAlly.z = 0; lyraAlly.dodge = 0; lyraAlly.crit = 0;
        var yunyou = foe('swordsage'), near = foe('priest'), far = foe('mage');
        var YI = foes.indexOf(yunyou);
        yunyou.x = 18; yunyou.z = 0; yunyou.airborne = true; yunyou.dodge = 0; yunyou.block = 0; yunyou.tenacity = 0;
        near.x = 3; near.z = 0; near.dodge = 0; near.block = 0; near.crit = 0; near.tenacity = 0;
        far.x = 25; far.z = 0; far.dodge = 0; far.block = 0; far.tenacity = 0;
        pary.dodge = 0; pary.block = 0; pary.crit = 0;
    `);
    const baseTaken = hB.run('calculateDamage(near, pary, 1.0, room.clock, { isSkill: false }).damage');
    const yyStartHp = hB.run('yunyou.hp');
    const farStartHp = hB.run('far.hp');
    const nearStartHp = hB.run('near.hp');

    // Kích hoạt 3 nhịp (Slam 1 chạy ngay tại +0ms)
    hB.run('cast(2)');
    assert.equal(hB.run('ccImmune(pary, room.clock)'), true, 'miễn khống chế suốt 3 nhịp đập búa');
    assert.equal(hB.run('calculateDamage(near, pary, 1.0, room.clock, { isSkill: false }).damage'), baseTaken, 'vẫn nhận sát thương bình thường khi đập KN3');
    const nearAfterSlam1 = hB.run('near.hp');
    assert.ok(nearAfterSlam1 < nearStartHp, 'địch gần (R<=5) trúng Nhịp 1');
    assert.equal(hB.run('far.hp'), farStartHp, 'địch xa (25u) chưa trúng Nhịp 1');
    assert.equal(hB.run('yunyou.hp'), yyStartHp, 'YunYou đang bay miễn Nhịp 1');

    // Nhịp 2 ở +600ms
    hB.run('upTo(600)');
    assert.ok(hB.run('near.hp') < nearAfterSlam1, 'địch gần trúng Nhịp 2 tại +0.6s');
    assert.equal(hB.run('yunyou.hp'), yyStartHp, 'YunYou đang bay vẫn miễn Nhịp 2');

    // Nhịp 3 toàn sân ở +1600ms
    hB.run('upTo(1600)');
    assert.ok(hB.run('far.hp') < farStartHp, 'Nhịp 3 trúng toàn bộ địch còn sống trên sân');
    assert.ok(hB.run('yunyou.hp') < yyStartHp, 'Nhịp 3 kéo YunYou xuống và gây 1.2x sát thương');
    assert.equal(hB.run('yunyou.airborne'), false, 'YunYou bị kéo xuống đất');
    assert.equal(hB.run('!!yunyou.swordGrounded'), false, 'KHÔNG set swordGrounded');
    assert.equal(hB.run("yunyou.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), true, 'YunYou bị choáng 1.5s');

    // Trong lúc đang choáng (+1800ms), đồng đội đánh trúng YunYou được và YunYou chưa bay lên lại
    hB.run("at(1800); processYunYou(room, 'p2', YI, 'p1', room.clock);");
    assert.equal(hB.run('yunyou.airborne'), false, 'vẫn ở dưới đất khi đang bị choáng');
    assert.equal(hB.run('calculateDamage(lyraAlly, yunyou, 1.0, room.clock, { isSkill: false }).isMiss'), false, 'đồng đội đánh trúng được YunYou lúc bị kéo xuống');

    // Sau khi hết 1.5s choáng (tới +3200ms): YunYou tự bay lên lại
    hB.run("upTo(3200); processYunYou(room, 'p2', YI, 'p1', room.clock);");
    assert.equal(hB.run('yunyou.airborne'), true, 'YunYou tự bay lên lại sau khi hết choáng Nhịp 3');
});

// ============================================================
// 8. Thiên phú 1 (Lv20 — Búa Bay Hậu Tuyến): đòn thường thứ 3 ném tuyến sau (trừ khi chỉ còn 1 địch), 0.8x + choáng 1s + khiên 6% 6s
// ============================================================
test('Talent 1 (Lv20): every 3rd basic attack throws hammer at back-line enemy with 0.8x, 1s stun and 6% maxHp 6s shield', () => {
    const h = harness();
    arena(h, { level: 20, rank: 1, pX: 0, pZ: 0, foeHeroes: ['warrior', 'archer', 'mage'] });
    h.run(`
        var front = foe('warrior'), b1 = foe('archer'), b2 = foe('mage');
        front.x = 2; front.dodge = 0; front.tenacity = 0;
        b1.x = 10; b1.dodge = 0; b1.tenacity = 0;
        b2.x = 14; b2.dodge = 0; b2.tenacity = 0;
        paryAfterAuto('fixture', 'p1', 0, 'p2', 0, room.clock);
        paryAfterAuto('fixture', 'p1', 0, 'p2', 0, room.clock);
    `);
    assert.equal(h.fx('paryFx', 'throw').length, 0, '2 đòn đầu chưa ném búa');

    for (let trial = 0; trial < 5; trial++) {
        if (trial > 0) {
            h.run("paryAfterAuto('fixture', 'p1', 0, 'p2', 0, room.clock); paryAfterAuto('fixture', 'p1', 0, 'p2', 0, room.clock);");
        }
        h.events.length = 0;
        h.run(`__rnd = ${(trial * 0.23).toFixed(2)}; paryAfterAuto('fixture', 'p1', 0, 'p2', 0, room.clock);`);
        const ev = h.fx('paryFx', 'throw')[0];
        assert.ok(ev, 'phải phát sự kiện ném búa ở đòn thường thứ 3');
        assert.notEqual(ev.targetIndex, 0, 'loại trừ kẻ địch gần nhất khi còn tuyến sau');
    }

    h.run('upTo(600)');
    const sh = json(h, "pary.statusEffects.find(e => e.type === 'pary_throw_shield')");
    assert.ok(sh, 'Pary nhận khiên khi búa bay về');
    assert.equal(sh.maxHp, Math.round(h.run('pary.maxHp') * 0.06));
    assert.equal(Math.round(sh.duration), 6000);
    assert.ok(h.run('b1.hp < b1.maxHp || b2.hp < b2.maxHp'), 'địch tuyến sau bị gây sát thương');
    assert.equal(h.run("b1.statusEffects.some(e => e.type === 'stun') || b2.statusEffects.some(e => e.type === 'stun')"), true, 'địch tuyến sau bị choáng 1s');

    // Trường hợp chỉ còn đúng 1 kẻ địch chọn được -> ném vào chính kẻ đó
    const hSolo = harness();
    arena(hSolo, { level: 20, rank: 1, pX: 0, pZ: 0, foeHeroes: ['warrior'] });
    hSolo.run(`
        foe('warrior').x = 2; foe('warrior').dodge = 0;
        paryAfterAuto('fixture', 'p1', 0, 'p2', 0, room.clock);
        paryAfterAuto('fixture', 'p1', 0, 'p2', 0, room.clock);
        paryAfterAuto('fixture', 'p1', 0, 'p2', 0, room.clock);
    `);
    const soloThrow = hSolo.fx('paryFx', 'throw')[0];
    assert.equal(soloThrow.targetIndex, 0, 'chỉ còn 1 địch thì ném vào chính kẻ đó');
});

// ============================================================
// 9. Thiên phú 2 (Lv40 — Hộ Giáp Bủa Vây): +8% P.DEF & M.DEF mỗi địch sống trong 4.5u (tối đa 5 = +40%), tính động khi địch vào/chết
// ============================================================
test('Talent 2 (Lv40): +8% pDef and mDef per alive enemy within 4.5u (cap 5 = +40%), dynamically recomputed', () => {
    const h = harness();
    const foesLayout = Array.from({ length: 6 }, (_, i) => ['monster_dummy', 20 + i * 0.3, 0]);
    arena(h, { level: 40, rank: 2, pX: 0, pZ: 0, foes: foesLayout });
    const base = json(h, 'getEffectiveStats(pary, room.clock).stats');

    h.run('foes[0].x = 4.0; foes[0].z = 0;');
    const s1 = json(h, 'getEffectiveStats(pary, room.clock).stats');
    assert.equal(s1.pDef, Math.floor(base.pDef * 1.08));
    assert.equal(s1.mDef, Math.floor(base.mDef * 1.08));

    h.run('foes.forEach((e, i) => { e.x = 0.5 + i * 0.3; e.z = 0; });');
    const s6 = json(h, 'getEffectiveStats(pary, room.clock).stats');
    assert.equal(s6.pDef, Math.floor(base.pDef * 1.40), '6 địch trần 5 = +40% P.DEF');
    assert.equal(s6.mDef, Math.floor(base.mDef * 1.40), '6 địch trần 5 = +40% M.DEF');

    h.run('foes[0].alive = false; foes[1].alive = false; foes[2].alive = false;');
    const s3 = json(h, 'getEffectiveStats(pary, room.clock).stats');
    assert.equal(s3.pDef, Math.floor(base.pDef * 1.24), '3 địch chết -> còn 3 địch = +24%');
    assert.equal(s3.mDef, Math.floor(base.mDef * 1.24));
});

// ============================================================
// 10. Trận PvP gương (Pary vs Pary) & đối xứng hất văng về biên trái cho phe Phải
// ============================================================
test('PvP mirror battle & right-side Skill 1 knockback symmetry', () => {
    const h = harness();
    arena(h, {
        level: 40, rank: 2, mode: 'duel_hero',
        allies: ['assassin'], foeHeroes: ['holyhammer', 'reaper'], foeLevel: 40, foeRank: 2,
    });
    h.run(`
        room.players.p1.autoMode = true; room.players.p2.autoMode = true;
        team.forEach((m, i) => { m.x = -3 - i * 2; m.z = 0; m.mp = m.maxMp; });
        foes.forEach((m, i) => { m.x = 3 + i * 2; m.z = 0; m.mp = m.maxMp; });
    `);
    const tick = realLoop(h);
    tick(240); // 12 giây giao tranh AUTO đầy đủ
    assert.equal(h.run('team.concat(foes).some(m => m.hp < m.maxHp || !m.alive)'), true, 'trận PvP gương chạy sạch và giao tranh diễn ra');

    // Đối xứng phe Phải hất văng về ARENA_BOUNDS.minX + 2
    const mir = harness();
    arena(mir, { pX: -10, pZ: 0, allies: ['warrior'], foeHeroes: ['holyhammer'] });
    mir.run(`
        var targetLeft = ally('warrior');
        targetLeft.x = 0; targetLeft.z = 0; targetLeft.dodge = 0; targetLeft.tenacity = 0;
        var rightPary = foe('holyhammer'), RPI = foes.indexOf(rightPary);
        rightPary.x = 2; rightPary.z = 0; rightPary.mp = rightPary.maxMp; rightPary.targetIndex = team.indexOf(targetLeft);
        pary.x = -40;
        executeSkill('fixture', 'p2', RPI, 'p1', 0);
    `);
    assert.equal(mir.run('targetLeft.x'), mir.run('ARENA_BOUNDS.minX + 2'), 'Pary phe Phải hất mục tiêu tới cách biên trái 2 đơn vị');
});
