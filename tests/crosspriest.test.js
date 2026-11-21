// Caelum (Thánh Giá, classId `crosspriest`) — kiểm tra đầy đủ cơ chế phía máy chủ trong node:vm.
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
    const fx = kind => events.filter(e => e.name === 'crossFx' && (!kind || e.data.kind === kind)).map(e => JSON.parse(JSON.stringify(e.data)));
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
    foeHeroes = null, foeRank = 0, mode = 'test', cX = 0, cZ = 0,
} = {}) {
    const mine = ['crosspriest', ...allies];
    h.run(`
        var team = createSquad('left', SQUAD_ORDER.filter(c => !${JSON.stringify(mine)}.includes(c)),
            Object.fromEntries(${JSON.stringify(mine)}.map(c => [c, { level: ${level}, rank: ${rank} }])));
        var foes = ${foeHeroes
            ? `createSquad('right', SQUAD_ORDER.filter(c => !${JSON.stringify(foeHeroes)}.includes(c)),
                Object.fromEntries(${JSON.stringify(foeHeroes)}.map(c => [c, { level: ${foeLevel}, rank: ${foeRank} }])))`
            : `createMonsterSquad(${foeLevel}, ${JSON.stringify(foes)})`};
        var foe = (classId) => foes.find(e => e.classId === classId);
        var ally = (classId) => team.find(e => e.classId === classId);
        var room = { id: 'fixture', mode: ${JSON.stringify(mode)}, status: 'active', clock: 100000, speed: 1.5,
            pending: [], players: {
                p1: { side: 'left', squad: team },
                p2: { side: 'right', isNPC: true, squad: foes },
            } };
        rooms.fixture = room; curRoom = room;
        var caelum = team.find(m => m.classId === 'crosspriest'), CI = team.indexOf(caelum);
        caelum.x = ${cX}; caelum.z = ${cZ}; caelum.mp = caelum.maxMp;
        var T0 = room.clock;
        var hits = [], calcs = [];
        var __hitTarget = hitTarget, __calculateDamage = calculateDamage;
        hitTarget = function (attacker, target, ti, opp, mult, now, opts) {
            const r = __hitTarget.apply(this, arguments);
            hits.push({ by: attacker.classId, ti, mult, at: now - T0, cc: !!(opts && opts.cc), aoe: !!(opts && opts.aoe), damage: r.damage, isMiss: r.isMiss });
            return r;
        };
        calculateDamage = function (attacker, target, mult, now, opts) {
            const r = __calculateDamage.apply(this, arguments);
            calcs.push({ by: attacker.classId, to: target.classId, ti: foes.indexOf(target), mult: mult === undefined ? 1 : mult, at: now - T0, skill: !!(opts && opts.isSkill), damage: r.damage, isMiss: r.isMiss });
            return r;
        };
        function cast(i, pt = null) {
            curRoom = room;
            executeSkill('fixture', 'p1', CI, 'p2', i, pt ? { point: pt } : {});
        }
        function at(ms) {
            room.clock = T0 + ms; curRoom = room;
            runPending(room, room.clock);
            for (const p of Object.values(room.players)) {
                for (const m of p.squad) {
                    if (Array.isArray(m.statusEffects)) m.statusEffects = m.statusEffects.filter(ef => ef.endTime > room.clock);
                }
            }
            processRoomCrosses(room, 'p1', 'p2', room.clock);
            processRoomCrosses(room, 'p2', 'p1', room.clock);
        }
        function upTo(ms) {
            while (room.clock < T0 + ms) at(Math.min(ms, room.clock - T0 + 50));
        }
        var kill = (m, squad) => { m.hp = 0; killMember(m, squad || team); };
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
// 1. Khai báo lớp nhân vật, cửa hàng, đội hình, chỉ số, không tính vào MONSTER_SCALE_HEROES
// ============================================================
test('Caelum: metadata, roster, shop, stats and monsterScale isolation', () => {
    const h = harness();
    const def = json(h, 'CLASS_DEFS.crosspriest');
    assert.equal(def.name, 'Caelum');
    assert.equal(def.title, 'Thánh Giá');
    assert.equal(def.className, 'Tu Sĩ');
    assert.equal(def.race, 'elf');
    assert.equal(def.classGroup, 'priest');
    assert.equal(def.dmgType, 'magic');
    assert.equal(def.range, 'ranged');
    assert.deepEqual(def.skills[0].dragTarget, { range: 14, radii: [3, 3.6, 4.2] });

    assert.equal(h.run("SQUAD_ORDER.includes('crosspriest')"), true);
    assert.equal(h.run("MONSTER_SCALE_HEROES.includes('crosspriest')"), false, 'crosspriest không được nằm trong MONSTER_SCALE_HEROES');
    assert.equal(SHOP.PRICES.crosspriest, 1200);

    // Mua được trong shop (cửa hàng anh hùng dùng Kim Cương)
    const pr = { owned: ['warrior'], wallet: { diamond: 1200 }, heroes: {} };
    const buyRes = SHOP.buy(pr, pr.wallet, 'crosspriest', new Set(['heroShop']));
    assert.equal(buyRes.ok, true);
    assert.equal(pr.owned.includes('crosspriest'), true);
    assert.equal(pr.wallet.diamond, 0);

    // Chỉ số Lv1 & Lv60 SSS nằm trong ngưỡng Tu Sĩ hỗ trợ mỏng
    const st1 = P.computeStats(def, { level: 1, rank: 0 });
    const st60 = P.computeStats(def, { level: 60, rank: 3 });
    // so với Seraphine (priest) cùng cách tính: máu / phép trong khoảng ±30%
    const sera = P.computeStats(h.run('JSON.stringify(CLASS_DEFS.priest)') && JSON.parse(h.run('JSON.stringify(CLASS_DEFS.priest)')));
    assert.ok(st1.maxHp >= sera.maxHp * 0.7 && st1.maxHp <= sera.maxHp * 1.3, `maxHp ${st1.maxHp} vs Seraphine ${sera.maxHp}`);
    assert.ok(st1.mAtk >= sera.mAtk * 0.7 && st1.mAtk <= sera.mAtk * 1.3 && st1.pAtk === 0, `mAtk ${st1.mAtk} vs ${sera.mAtk}`);
    assert.ok(st60.maxHp > st1.maxHp * 5 && st60.mAtk > st1.mAtk * 3);

    arena(h);
    assert.equal(h.run('caelum.crossType'), 1, 'mặc định loại Thánh giá ban đầu là 1');
});

// ============================================================
// 2. Đặt Thánh giá: kẹp tầm 14, kẹp mép sân, tự chọn chỗ & tránh trùng vị trí cùng loại
// ============================================================
test('Caelum Skill 1: range-14 & arena clamp, auto-placement and non-exact-overlap', () => {
    const h = harness();
    arena(h, { cX: 0, cZ: 0, foes: [['monster_dummy', 10, 2], ['monster_dummy', 11, 2]] });

    // Điểm trong tầm 14 -> giữ nguyên toạ độ
    h.run('cast(0, { x: 8, z: -4 })');
    let crosses = json(h, 'caelum.crosses');
    assert.equal(crosses.length, 1);
    assert.ok(Math.abs(crosses[0].x - 8) < 1e-6 && Math.abs(crosses[0].z - (-4)) < 1e-6);

    // Điểm ngoài tầm 14 -> bị kẹp đúng rìa bán kính 14 quanh Caelum
    h.run('cast(0, { x: 30, z: 40 })');
    crosses = json(h, 'caelum.crosses');
    assert.equal(crosses.length, 2);
    const d14 = Math.hypot(crosses[1].x - 0, crosses[1].z - 0);
    assert.ok(Math.abs(d14 - 14) < 0.05 || (crosses[1].z === 13 && d14 <= 14.01));

    // Đặt sát góc ngoài sân (Caelum ở x=-45, z=11) -> kẹp cả tầm 14 lẫn ARENA_BOUNDS
    h.run('caelum.x = -45; caelum.z = 11; cast(0, { x: -60, z: 25 })');
    crosses = json(h, 'caelum.crosses');
    assert.ok(crosses[2].x >= -48 && crosses[2].z <= 13);

    // Tự chọn vị trí (loại 3 Sấm sét): đặt 2 lần cùng loại 3 -> tự đặt vào cụm địch nhưng KHÔNG chồng chính xác lên nhau
    const h2 = harness();
    arena(h2, { cX: 0, cZ: 0, foes: [['monster_dummy', 10, 2], ['monster_dummy', 11, 2]] });
    h2.run('caelum.crossType = 3; cast(0); cast(0);');
    const c3 = json(h2, 'caelum.crosses');
    assert.equal(c3.length, 2);
    assert.ok(Math.hypot(c3[0].x - 10.5, c3[0].z - 2) <= 3.1, 'cây thứ nhất phải phủ cụm địch');
    const apart = Math.hypot(c3[1].x - c3[0].x, c3[1].z - c3[0].z);
    assert.ok(apart >= 0.6, `cây cùng loại đặt tự động tiếp theo phải lệch khỏi điểm cũ (${apart})`);
});

// ============================================================
// 3. Cấp độ 1->2->3 (10s/10s/10s), bán kính 3/3.6/4.2 và quy tắc kế thừa khi thay cây thứ 5
// ============================================================
test('Caelum Skill 1: level progression 1->2->3, expiration at 30s and 5th-cross inheritance', () => {
    const h = harness();
    arena(h, { level: 1, rank: 0 });
    h.run('caelum.crossType = 2; cast(0, { x: 4, z: 0 })');
    let c = json(h, 'caelum.crosses[0]');
    assert.equal(c.level, 1);
    assert.equal(c.radius, 3);

    h.run('upTo(10000)');
    c = json(h, 'caelum.crosses[0]');
    assert.equal(c.level, 2);
    assert.equal(c.radius, 3.6);

    h.run('upTo(20000)');
    c = json(h, 'caelum.crosses[0]');
    assert.equal(c.level, 3);
    assert.equal(c.radius, 4.2);

    h.run('upTo(30000)');
    assert.equal(h.run('caelum.crosses.length'), 0, 'hết 10s ở cấp 3 phải biến mất');
    assert.equal(h.fx('crossEnd').filter(e => e.reason === 'expire').length, 1);

    // Thử thay cây thứ 5 kế thừa cấp & thời gian:
    //  - Cây A đặt lúc t=0 -> tới t=16s đang ở cấp 2 (còn 4s lên cấp 3)
    //  - Cây B đặt lúc t=11s -> tới t=20s đang ở cấp 1 (còn 1s lên cấp 2)
    //  - Đặt cây C (t=12), D (t=13), rồi đặt cây thứ 5 E ở t=16s:
    //    thay cây cũ nhất A -> E phải kế thừa cấp 2 và lên cấp 3 đúng ở t=20s (4s sau)!
    const h2 = harness();
    arena(h2);
    h2.run('caelum.crossType = 2; cast(0, { x: 1, z: 0 })'); // A ở t=0 (Lv2 lúc 10s, Lv3 lúc 20s)
    h2.run('upTo(11000); cast(0, { x: 2, z: 0 })');         // B ở t=11s (Lv2 lúc 21s)
    h2.run('upTo(12000); cast(0, { x: 3, z: 0 })');         // C
    h2.run('upTo(13000); cast(0, { x: 4, z: 0 })');         // D
    h2.run('upTo(16000); cast(0, { x: 9, z: 0 })');         // E (cây thứ 5 thay A)
    let list = json(h2, 'caelum.crosses');
    assert.equal(list.length, 4);
    assert.equal(list[3].level, 2, 'cây thứ 5 phải kế thừa cấp 2 của cây cũ nhất');
    h2.run('upTo(20000)');
    list = json(h2, 'caelum.crosses');
    assert.equal(list[3].level, 3, 'cây thứ 5 kế thừa thời gian chạy tiếp -> phải lên cấp 3 ở mốc 20s');

    // Khi thay thế một cây ĐANG Ở CẤP 3: cây mới kế thừa cấp 3 và nhận lại ĐỦ 10s tồn tại mới
    const h3 = harness();
    arena(h3);
    h3.run('caelum.crossType = 2; cast(0, { x: 1, z: 0 })'); // X1 ở t=0 -> lên Lv3 lúc 20s (expireAt = 30s)
    h3.run('upTo(20000)');
    assert.equal(h3.run('caelum.crosses[0].level'), 3);
    h3.run('cast(0, { x: 2, z: 0 }); cast(0, { x: 3, z: 0 }); cast(0, { x: 4, z: 0 });'); // X2, X3, X4 đặt lúc 20s
    h3.run('upTo(24000); cast(0, { x: -2, z: 0 });'); // ở t=24s thay X1 (cũ nhất, đang Lv3 còn 6s) -> F nhận 10s mới tới 34s
    list = json(h3, 'caelum.crosses');
    const f = list[3];
    assert.equal(f.level, 3);
    assert.equal(f.expireAt - json(h3, 'room.clock'), 10000, 'thay cây cấp 3 phải nhận lại 10s mới');
    h3.run('upTo(33500)');
    assert.ok(json(h3, 'caelum.crosses').some(x => x.id === f.id), 'tới 33.5s cây F vẫn còn (do nhận lại 10s từ 24s)');
    h3.run('upTo(34050)');
    assert.equal(json(h3, 'caelum.crosses').some(x => x.id === f.id), false, 'đúng 34s cây F phải hết giờ');
});

// ============================================================
// 4. Bốn loại Thánh giá (Sinh Mệnh, Uy Lực, Sấm Sét, Thanh Tẩy) tác động 2 phe & cộng dồn
// ============================================================
test('Cross types 1-4 effects on allies & enemies and stacking rules', () => {
    // 4.1 Loại 1 (Sinh Mệnh): hồi máu + hồi Orb đồng đội · giảm hồi máu, trừ & giảm hồi Orb địch · hồi máu CỘNG DỒN, Orb & healCut KHÔNG cộng dồn
    {
        const h = harness();
        arena(h, { allies: ['warrior'], foes: [['monster_dummy', 4, 0]] });
        h.run('ally("warrior").x = 4; ally("warrior").hp = 500; ally("warrior").mp = 0; foes[0].mp = 4000; foes[0].maxMp = 5000;');
        h.run('caelum.crossType = 1; cast(0, { x: 4, z: 0 })');
        // Giảm hồi máu & giảm hồi Orb địch có tác dụng ngay trong vùng
        assert.ok(h.run('healCutOf(foes[0], room.clock) >= 0.29'), 'kẻ địch trong Sinh Mệnh phải bị giảm hồi máu');
        assert.ok(h.run('orbRegenMult(foes[0], room.clock) < 0.8'), 'kẻ địch trong Sinh Mệnh phải bị giảm tốc hồi Orb');
        const foeBeforeHeal = h.run('foes[0].hp = 1000; healUnit(foes[0], 1000, room.clock)');
        assert.ok(foeBeforeHeal <= 700, 'lượng hồi máu thật của địch phải bị cắt');

        h.run('upTo(2000)');
        const hp1 = h.run('ally("warrior").hp'), mp1 = h.run('ally("warrior").mp'), fmp1 = h.run('foes[0].mp');
        assert.ok(hp1 > 500, 'đồng đội được hồi máu mỗi 2s');
        assert.ok(mp1 > 0, 'đồng đội được tăng Orb mỗi 2s');
        assert.ok(fmp1 < 4000, 'địch bị trừ Orb mỗi 2s');

        // Đặt thêm 1 cây Sinh Mệnh nữa chồng lên cùng chỗ -> hồi máu CỘNG DỒN (×2), Orb đồng đội & trừ Orb địch KHÔNG cộng dồn
        const h2 = harness();
        arena(h2, { allies: ['warrior'], foes: [['monster_dummy', 4, 0]] });
        h2.run('ally("warrior").x = 4; ally("warrior").hp = 500; ally("warrior").mp = 0; foes[0].mp = 4000; foes[0].maxMp = 5000;');
        h2.run('caelum.crossType = 1; cast(0, { x: 4, z: 0 }); cast(0, { x: 4, z: 0 });');
        h2.run('upTo(2000)');
        const hp2 = h2.run('ally("warrior").hp'), mp2 = h2.run('ally("warrior").mp'), fmp2 = h2.run('foes[0].mp');
        assert.ok((hp2 - 500) > (hp1 - 500) * 1.8, 'hồi máu của 2 cây Sinh Mệnh chồng nhau phải cộng dồn');
        assert.equal(mp2, mp1, 'cộng Orb của 2 cây Sinh Mệnh chồng nhau KHÔNG cộng dồn');
        assert.equal(fmp2, fmp1, 'trừ Orb địch của 2 cây Sinh Mệnh chồng nhau KHÔNG cộng dồn');
    }

    // 4.2 Loại 2 (Uy Lực): đồng đội +ATK/DEF/atkSpeed, địch −ATK/DEF/atkSpeed · lưu 1s sau khi rời vùng · KHÔNG cộng dồn (lấy cấp cao nhất)
    {
        const h = harness();
        arena(h, { allies: ['warrior'], foes: [['monster_tank', 4, 0]] });
        h.run('ally("warrior").x = 4;');
        const baseA = json(h, 'getEffectiveStats(ally("warrior"), room.clock).stats');
        const baseF = json(h, 'getEffectiveStats(foes[0], room.clock).stats');
        h.run('caelum.crossType = 2; cast(0, { x: 4, z: 0 })');
        const onA = json(h, 'getEffectiveStats(ally("warrior"), room.clock).stats');
        const onF = json(h, 'getEffectiveStats(foes[0], room.clock).stats');
        assert.ok(onA.pAtk > baseA.pAtk && onA.pDef > baseA.pDef && onA.atkSpeed < baseA.atkSpeed);
        assert.ok(onF.pAtk < baseF.pAtk && onF.pDef < baseF.pDef && onF.atkSpeed > baseF.atkSpeed);

        // Chồng thêm 1 cây Uy Lực cấp 2 lên cùng chỗ: chỉ lấy cấp 2, không cộng thêm phần cấp 1
        h.run('caelum.crosses[0].level = 2; caelum.crosses[0].levelAt = T0 + 20000;');
        h.run('upTo(50)');
        const lv2Stats = json(h, 'getEffectiveStats(ally("warrior"), room.clock).stats');
        h.run('cast(0, { x: 4, z: 0 })'); // thêm cây Lv1 chồng lên
        const lv2Plus1 = json(h, 'getEffectiveStats(ally("warrior"), room.clock).stats');
        assert.equal(lv2Plus1.pAtk, lv2Stats.pAtk, 'hai cây Uy Lực chồng nhau chỉ lấy cấp cao nhất');

        // Rời khỏi vùng ở t=100ms -> lưu lại 1s (tới 1000ms còn, sau 1150ms mất)
        h.run('ally("warrior").x = 30; foes[0].x = 30; upTo(950);');
        const lingA = json(h, 'getEffectiveStats(ally("warrior"), room.clock).stats');
        assert.ok(lingA.pAtk > baseA.pAtk, 'hiệu ứng Uy Lực phải lưu lại 1s sau khi rời vùng');
        h.run('upTo(1200)');
        const goneA = json(h, 'getEffectiveStats(ally("warrior"), room.clock).stats');
        const goneF = json(h, 'getEffectiveStats(foes[0], room.clock).stats');
        assert.equal(goneA.pAtk, baseA.pAtk);
        assert.equal(goneF.pAtk, baseF.pAtk);
    }

    // 4.3 Loại 3 (Sấm Sét): mỗi 1s đánh 1 địch ngẫu nhiên + choáng 0.5s + miễn choáng 2s; sát thương CỘNG DỒN
    {
        const h = harness();
        arena(h, { foes: [['monster_dummy', 5, 0]] });
        h.run('caelum.crossType = 3; cast(0, { x: 5, z: 0 })');
        h.run('upTo(1000)');
        assert.ok(h.run('foes[0].hp < foes[0].maxHp'), 'sau 1s Sấm sét phải gây sát thương');
        assert.ok(h.run('foes[0].statusEffects.some(e => e.type === "stun" && e.endTime > room.clock)'), 'địch trúng sét phải bị choáng 0.5s');

        // Hết choáng 0.5s -> ở t=2000ms sét đánh lần 2 NHƯNG đang miễn choáng 2s (tới t=3000ms) -> KHÔNG choáng lại
        h.run('upTo(2000)');
        assert.equal(h.run('foes[0].statusEffects.some(e => e.type === "stun" && e.endTime > room.clock)'), false, 'trong 2s miễn choáng không được choáng tiếp');
        h.run('upTo(3000)');
        assert.equal(h.run('foes[0].statusEffects.some(e => e.type === "stun" && e.endTime > room.clock)'), true, 'hết 2s miễn choáng ở t=3s phải bị choáng lại');

        // 2 cây Sấm sét chồng lên nhau: sát thương CỘNG DỒN (cả 2 đều đánh trong 1s)
        const h2 = harness();
        arena(h2, { foes: [['monster_dummy', 5, 0]] });
        h2.run('caelum.crossType = 3; cast(0, { x: 5, z: 0 }); cast(0, { x: 5, z: 0 });');
        h2.run('upTo(1000)');
        assert.equal(h2.run('hits.length'), 2, '2 cây Sấm sét cùng lúc phải đánh đủ 2 phát cộng dồn');
    }

    // 4.4 Loại 4 (Thanh Tẩy): đồng đội nhận khiên 5s & giải debuff 3s; địch bị gỡ buff 3s & giảm kháng hiệu ứng
    {
        const h = harness();
        arena(h, { allies: ['warrior'], foes: [['monster_dummy', 5, 0]] });
        h.run('ally("warrior").x = 5;');
        h.run('ally("warrior").statusEffects.push({ type: "stun", endTime: T0 + 10000 });');
        h.run('foes[0].statusEffects.push({ type: "holy_shield", hp: 500, maxHp: 500, endTime: T0 + 10000 });');
        h.run('caelum.crossType = 4; cast(0, { x: 5, z: 0 })');
        // Giảm kháng hiệu ứng áp ngay: thời gian khống chế lên địch tăng lên
        assert.ok(h.run('ccTime(foes[0], 1000, room.clock) > 1150'), 'địch trong Thanh Tẩy phải bị giảm kháng hiệu ứng');
        // Tới 3s: giải debuff đồng đội + gỡ buff địch
        h.run('upTo(3000)');
        assert.equal(h.run('ally("warrior").statusEffects.some(e => e.type === "stun")'), false, 'sau 3s phải giải hiệu ứng xấu đồng đội');
        assert.equal(h.run('foes[0].statusEffects.some(e => e.type === "holy_shield")'), false, 'sau 3s phải gỡ buff có lợi trên địch');
        // Tới 5s: tạo khiên cho đồng đội
        h.run('upTo(5000)');
        assert.ok(h.run('activeShield(ally("warrior"), room.clock)?.type === "cross_shield"'), 'sau 5s đồng đội phải có khiên Thanh Tẩy');
    }
});

// ============================================================
// 5. Kỹ năng 2 (Thánh Ca): giảm hồi chiêu theo bậc, kích hoạt 3 lần, rút ngắn/kéo dài thời gian
// ============================================================
test('Caelum Skill 2 (Thánh Ca): cooldown scaling, 3x trigger, -4s below Lv3 and +4s at Lv3', () => {
    const h0 = harness();
    arena(h0, { rank: 0, foes: [['monster_dummy', 5, 0]] });
    const h3 = harness();
    arena(h3, { rank: 3, foes: [['monster_dummy', 5, 0]] });
    assert.ok(h0.run('caelum.skills[1].cooldown') > h3.run('caelum.skills[1].cooldown'), 'hồi chiêu KN2 phải giảm theo bậc kỹ năng');

    h0.run('caelum.crossType = 3; cast(0, { x: 5, z: 0 })'); // cây Sấm sét Lv1: levelAt = T0 + 10000
    h0.run('caelum.crossType = 1; cast(0, { x: 0, z: 0 }); caelum.hp = 400;'); // cây Sinh Mệnh Lv1
    const hpBefore = h0.run('caelum.hp');
    const foeBefore = h0.run('foes[0].hp');
    h0.run('cast(1)'); // dùng Thánh Ca lúc T0

    // Cả 2 cây kích hoạt ngay 3 lần
    assert.equal(h0.run('hits.length'), 3, 'Sấm sét phải kích hoạt ngay 3 phát');
    assert.ok(h0.run('foes[0].hp') < foeBefore);
    assert.ok(h0.run('caelum.hp') > hpBefore, 'Sinh Mệnh phải hồi máu 3 lần');

    // Thời gian lên cấp còn lại giảm từ 10s xuống 6s
    assert.equal(h0.run('caelum.crosses[0].level'), 1);
    assert.equal(h0.run('caelum.crosses[0].levelAt - T0'), 6000);

    // Dùng Thánh Ca lần nữa lúc T0 + 3000 (chỉ còn 3s -> trừ 4s => lên cấp 2 NGAY, dư 1s trừ tiếp -> lên cấp 3 sớm hơn 1s!)
    h0.run('upTo(3000); cast(1);');
    assert.equal(h0.run('caelum.crosses[0].level'), 2, 'trừ quá mốc 0 phải lên cấp 2 ngay lập tức');
    assert.equal(h0.run('caelum.crosses[0].levelAt - room.clock'), 9000, 'phần dư 1s phải được cộng dồn vào tiến độ lên cấp 3');

    // Khi cây đã đạt cấp 3: Thánh Ca cộng thêm +4s tồn tại
    h0.run('upTo(12000)');
    assert.equal(h0.run('caelum.crosses[0].level'), 3);
    const expBefore = h0.run('caelum.crosses[0].expireAt');
    h0.run('cast(1)');
    assert.equal(h0.run('caelum.crosses[0].expireAt'), expBefore + 4000, 'cấp 3 phải được +4s thời gian tồn tại');
});

// ============================================================
// 6. Kỹ năng 3 (Thần Quang): toàn sân tại (0,0), không tốn slot 4 cây, 10 nhịp, nổ mỗi phát 5, huỷ nếu chết
// ============================================================
test('Caelum Skill 3 (Thần Quang): whole-field center cross, buff/debuff/strip, 5th-smite explode+cleanse, cancel on death', () => {
    const h = harness();
    arena(h, { allies: ['warrior'], foes: [['monster_tank', 40, 8]] }); // địch rất xa ngoài 14 ô vẫn trúng (toàn sân)
    h.run('foes[0].hp = foes[0].maxHp = 200000;');
    // Đặt sẵn 4 cây KN1 trước để chứng minh KN3 không chiếm ô của 4 cây
    h.run('caelum.crossType = 2; cast(0, { x: 1, z: 0 }); cast(0, { x: 2, z: 0 }); cast(0, { x: 3, z: 0 }); cast(0, { x: 4, z: 0 });');
    const atkBefore = json(h, 'getEffectiveStats(ally("warrior"), room.clock).stats').pAtk;
    h.run('foes[0].statusEffects.push({ type: "holy_shield", hp: 2000, maxHp: 2000, endTime: T0 + 30000 });');
    h.run('cast(2)');
    assert.equal(h.run('caelum.crosses.length'), 4, 'KN3 không chiếm chỗ 4 Thánh giá KN1');
    assert.ok(h.run('caelum.crossRadiance && caelum.crossRadiance.x === 0 && caelum.crossRadiance.z === 0'));

    const atkAfter = json(h, 'getEffectiveStats(ally("warrior"), room.clock).stats').pAtk;
    assert.ok(atkAfter > atkBefore, 'đồng đội được cộng % ATK trong 10s');

    // Trước khi trúng Thần Phạt, gắn debuff lên đồng đội -> ở nhịp 5 phải bị giải sạch
    h.run('ally("warrior").statusEffects.push({ type: "stun", endTime: T0 + 15000 });');
    h.run('upTo(1000)');
    assert.equal(h.run('foes[0].statusEffects.some(e => e.type === "holy_shield")'), false, 'mỗi phát Thần Phạt xoá 1 buff địch');
    assert.ok(h.run('foes[0].statusEffects.some(e => e.type === "cross_smite_debuff")'), 'địch bị giảm sát thương và thủ');
    assert.ok(h.run('calculateDamage(foes[0], ally("warrior"), 1, room.clock).damage < calculateDamage(foes[0], ally("warrior"), 1, room.clock + 5000).damage'), 'Thần Phạt phải giảm sát thương địch gây ra');

    // Tới t=5000ms (phát thứ 5): nổ thêm 1 lần + giải mọi debuff đồng đội
    h.run('upTo(5000)');
    assert.equal(h.fx('radianceTick').filter(x => x.explode).length, 1, 'phát thứ 5 phải nổ');
    assert.equal(h.run('ally("warrior").statusEffects.some(e => e.type === "stun")'), false, 'phát thứ 5 giải sạch debuff đồng đội');

    // Tới t=10000ms: tổng 10 phát Thần Phạt, 2 phát nổ (#5 và #10) rồi kết thúc
    h.run('upTo(10000)');
    assert.equal(h.fx('radianceTick').length, 10);
    assert.equal(h.fx('radianceTick').filter(x => x.explode).length, 2);
    assert.equal(h.fx('radianceEnd').length, 1);

    // Chết thật (hết KN1, không hồi sinh) -> huỷ KN3 ngay lập tức!
    const hDeath = harness();
    arena(hDeath, { allies: ['warrior'], foes: [['monster_dummy', 10, 0]] });
    hDeath.run('cast(2); upTo(2000); kill(caelum, team);');
    assert.equal(hDeath.run('caelum.crossRadiance'), null, 'Caelum chết phải huỷ Thần Quang ngay');
    assert.equal(hDeath.run('ally("warrior").statusEffects.some(e => e.type === "cross_radiance_buff")'), false);
    const ticksAtDeath = hDeath.fx('radianceTick').length;
    hDeath.run('upTo(8000)');
    assert.equal(hDeath.fx('radianceTick').length, ticksAtDeath, 'sau khi Caelum chết Thần Quang không được đánh thêm');
});

// ============================================================
// 7. Thiên phú 1 (Lv20: +4%/cây ATK cả đội) & Thiên phú 2 (Lv40: hoàn Orb + hồi sinh)
// ============================================================
test('Caelum Talents 1 & 2: +4% team ATK per cross, 1 Orb refund, revive on death with 30s cooldown', () => {
    // Thiên phú 1 chưa mở ở Lv1, mở từ Lv20 (+4% mỗi cây, 4 cây = +16%)
    const hLow = harness();
    arena(hLow, { level: 1, allies: ['warrior'] });
    const baseLow = hLow.run('ally("warrior").pAtk');
    hLow.run('cast(0, { x: 1, z: 0 })');
    assert.equal(hLow.run('getEffectiveStats(ally("warrior"), room.clock).stats.pAtk'), baseLow, 'Lv1 chưa mở Thiên phú 1');

    const h20 = harness();
    arena(h20, { level: 20, rank: 1, allies: ['warrior'] });
    const base20 = h20.run('ally("warrior").pAtk');
    h20.run('cast(0, { x: 1, z: 0 })');
    assert.equal(h20.run('getEffectiveStats(ally("warrior"), room.clock).stats.pAtk'), Math.floor(base20 * 1.04));
    h20.run('cast(0, { x: 2, z: 0 }); cast(0, { x: 3, z: 0 }); cast(0, { x: 4, z: 0 });');
    assert.equal(h20.run('getEffectiveStats(ally("warrior"), room.clock).stats.pAtk'), Math.floor(base20 * 1.16));

    // Thiên phú 2 (Lv40): hoàn 1 Orb khi cây kết thúc (thay thế hoặc hết giờ) — dùng loại 2 để tách riêng phần hoàn Orb khỏi hồi Orb của Sinh Mệnh
    const h40 = harness();
    arena(h40, { level: 40, rank: 2 });
    h40.run('caelum.crossType = 2; caelum.mp = 0; cast(0, { x: 1, z: 0 }); cast(0, { x: 2, z: 0 }); cast(0, { x: 3, z: 0 }); cast(0, { x: 4, z: 0 });');
    h40.run('caelum.mp = 0; cast(0, { x: 5, z: 0 });'); // cây thứ 5 thay cây 1 -> hoàn 1 Orb = 1000 MP
    assert.equal(h40.run('caelum.mp'), 1000, 'thay cây thứ 5 phải hoàn 1 Orb');
    // Chờ hết giờ 30s -> cây 2..5 hết hạn đều hoàn Orb
    h40.run('caelum.mp = 0; upTo(30100)');
    assert.equal(h40.run('caelum.mp'), 4000, '4 cây hết giờ phải hoàn đủ 4 Orb');

    // Hồi sinh với 3 cây -> 60% maxHp, tiêu thụ hết Thánh giá, không hoàn Orb từ lúc bị hiến tế, hồi 30s
    const hRev = harness();
    arena(hRev, { level: 40, rank: 2 });
    hRev.run('cast(0, { x: -3, z: 0 }); cast(0, { x: 2, z: 0 }); cast(0, { x: 5, z: 0 });');
    hRev.run('caelum.mp = 0; kill(caelum, team);');
    assert.equal(hRev.run('caelum.alive'), true, 'có 3 Thánh giá -> phải hồi sinh');
    assert.equal(hRev.run('caelum.hp'), hRev.run('Math.round(caelum.maxHp * 0.60)'));
    assert.equal(hRev.run('caelum.crosses.length'), 0, 'mọi Thánh giá còn lại bị tiêu thụ khi hồi sinh');
    assert.equal(hRev.run('caelum.mp'), 0, 'Thánh giá tiêu thụ để hồi sinh không hoàn thêm Orb');
    assert.equal(hRev.fx('revive').length, 1);

    // 4 cây -> tối đa 80% maxHp
    const hRev4 = harness();
    arena(hRev4, { level: 40, rank: 2 });
    hRev4.run('cast(0, { x: 1, z: 0 }); cast(0, { x: 2, z: 0 }); cast(0, { x: 3, z: 0 }); cast(0, { x: 4, z: 0 });');
    hRev4.run('kill(caelum, team);');
    assert.equal(hRev4.run('caelum.hp'), hRev4.run('Math.round(caelum.maxHp * 0.80)'));

    // Chết lần 2 khi hồi chiêu 30s chưa xong (dù đặt lại Thánh giá mới) -> chết thật
    hRev.run('upTo(10000); cast(0, { x: 1, z: 0 }); kill(caelum, team);');
    assert.equal(hRev.run('caelum.alive'), false, 'đang hồi chiêu 30s không được hồi sinh');

    // Hết 30s hồi chiêu -> không có Thánh giá cũng không hồi sinh; có Thánh giá -> hồi sinh lại được
    hRev4.run('upTo(30000); cast(0, { x: 1, z: 0 }); kill(caelum, team);');
    assert.equal(hRev4.run('caelum.alive'), true, 'sau 30s và có Thánh giá phải hồi sinh lại được');
    hRev4.run('upTo(70000); kill(caelum, team);'); // 0 cây -> chết thật
    assert.equal(hRev4.run('caelum.alive'), false, 'không có Thánh giá thì không hồi sinh');
});

// ============================================================
// 8. Socket chọn loại, kéo thả điểm, và AUTO chọn loại Thánh giá + PvP Mirror kết thúc sạch
// ============================================================
test('Caelum socket handlers, AUTO crossType selection and PvP mirror termination', () => {
    const h = harness();
    arena(h, { level: 40, rank: 2, allies: ['warrior'], foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 0]] });
    const { handlers } = h.connectSocket('p1', 'fixture');

    handlers.setCrossType({ memberIndex: h.run('CI'), type: 3 });
    assert.equal(h.run('caelum.crossType'), 3);
    handlers.queueSkill({ memberIndex: h.run('CI'), skillIndex: 0, point: { x: 6, z: -2 } });
    assert.deepEqual(json(h, 'caelum.queuedTargets[0]'), { x: 6, z: -2 });
    // Kéo lần nữa ghi đè điểm (không tắt khỏi hàng đợi)
    handlers.queueSkill({ memberIndex: h.run('CI'), skillIndex: 0, point: { x: 7, z: 1 } });
    assert.deepEqual(json(h, 'caelum.queuedSkills'), [0]);
    assert.deepEqual(json(h, 'caelum.queuedTargets[0]'), { x: 7, z: 1 });

    const tick = realLoop(h);
    tick(2);
    assert.equal(h.run('caelum.crosses.length'), 1);
    assert.equal(h.run('caelum.crosses[0].type'), 3);
    assert.ok(Math.abs(h.run('caelum.crosses[0].x') - 7) < 1e-6);

    // AUTO chọn loại theo tình huống
    h.run('ally("warrior").hp = ally("warrior").maxHp * 0.5;');
    assert.equal(h.run('autoChooseCrossType(caelum, room.players.p1, room.players.p2, room.clock)'), 1, 'đồng đội mất máu -> loại 1');
    h.run('ally("warrior").hp = ally("warrior").maxHp;');
    assert.equal(h.run('autoChooseCrossType(caelum, room.players.p1, room.players.p2, room.clock)'), 3, 'địch tụ cụm -> loại 3');
    h.run('foes[1].x = 30; ally("warrior").statusEffects.push({ type: "stun", debuff: true, endTime: room.clock + 5000 });');
    assert.equal(h.run('autoChooseCrossType(caelum, room.players.p1, room.players.p2, room.clock)'), 4, 'có debuff đồng đội -> loại 4');
    h.run('ally("warrior").statusEffects = [];');
    assert.equal(h.run('autoChooseCrossType(caelum, room.players.p1, room.players.p2, room.clock)'), 2, 'mặc định còn lại -> loại 2');

    // Trận PvP mirror (Caelum vs Caelum, duel_hero): AUTO đánh nhau với Thiên phú 2 & Sinh Tử 3:00 luôn phải phân thắng thua
    const hpvp = harness();
    arena(hpvp, {
        level: 60, rank: 3, mode: 'duel_hero',
        allies: ['warrior'], foeHeroes: ['crosspriest', 'warrior'], foeLevel: 60, foeRank: 3,
    });
    hpvp.run('room.players.p1.autoMode = true; room.players.p2.autoMode = true;');
    hpvp.run('team.forEach((m, i) => { m.x = -25 - i * 2; m.mp = m.maxMp; }); foes.forEach((m, i) => { m.x = 25 + i * 2; m.mp = m.maxMp; });');
    const tickPvp = realLoop(hpvp);
    for (let i = 0; i < 4500 && !hpvp.run('room.winner'); i++) tickPvp(2); // tối đa 450s trận (quá 180s có Sinh Tử)
    const win = hpvp.run('room.winner');
    assert.ok(win === 'p1' || win === 'p2', `trận mirror PvP phải kết thúc có người thắng rõ ràng, nhận: ${win}`);
});

// người chơi 21/11: Thánh Ca (KN2) áp dụng cả cho cây Thần Quang (KN3)
test('Caelum Skill 2 also boosts Skill 3: +3 smites immediately and +4s duration', () => {
    const h = harness();
    arena(h, { allies: ['warrior'], foes: [['monster_tank', 8, 0]] });
    h.run('foes[0].hp = foes[0].maxHp = 500000;');
    h.run('cast(2)');
    const end0 = h.run('caelum.crossRadiance.endTime');
    h.run('upTo(1000)');
    assert.equal(h.run('caelum.crossRadiance.smiteCount'), 1);
    h.run('caelum.skillCooldowns[1] = 0; cast(1)');
    assert.equal(h.run('caelum.crossRadiance.smiteCount'), 4, 'Thánh Ca đánh thêm ngay 3 đợt Holy Smite');
    assert.equal(h.run('caelum.crossRadiance.endTime'), end0 + 4000, 'Thánh Ca kéo dài Thần Quang 4 giây');
    // không có Thánh giá KN1 nào nhưng có Thần Quang -> Thánh Ca vẫn dùng được (foeInReach)
    assert.equal(h.run('caelum.crosses.length'), 0);
    assert.equal(h.run("foeInReach(caelum, 'cross_hymn', foes, room.clock)"), true);
    h.run('upTo(14000)');
    assert.equal(h.run('caelum.crossRadiance'), null, 'Thần Quang kết thúc sau 14 giây');
});
