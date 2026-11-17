// Leon (Kỳ Vương, classId `chessmaster`) — luật trận phía máy chủ, đợt 1 (task B1–B3: khai báo + 3 nút đổi theo thế cờ, cánh thủ, cánh công).
// Nạp server.js trong node:vm như tests/voidmage.test.js.
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
    // sự kiện chessFx (chép qua JSON: đối tượng tạo trong vm khác "realm" nên deepEqual chặt không so được trực tiếp)
    const fx = kind => events.filter(e => e.name === 'chessFx' && (!kind || e.data.kind === kind)).map(e => JSON.parse(JSON.stringify(e.data)));
    return { run, events, sockets, ticks, fx };
}
const json = (h, code) => JSON.parse(h.run(`JSON.stringify(${code})`));

/**
 * Phòng trận thử: Leon (phe trái, đứng ở gốc toạ độ, đầy Orb) đấu với đội quái `foes` ([classId, x, z]) hoặc đội anh hùng `foeHeroes`.
 * Trong vm có sẵn: room, team, foes, leon, LI (vị trí Leon trong đội), T0 (lúc bắt đầu) ·
 *   cast(i) bấm nút i ngay (gọi thẳng executeSkill: KHÔNG trừ Orb — chỉ vòng lặp trận mới trừ) ·
 *   at(ms) đẩy đồng hồ trận tới T0 + ms (chạy việc đã hẹn + processChessPiece / processChess như vòng lặp trận) · upTo(ms) đi từng nhịp 50 ms ·
 *   put(kind, x, z) gọi thẳng 1 quân ra sân (đặt ở x, z nếu có) · piece(kind) / slot(kind) quân còn sống của Leon · modes() chế độ 3 nút ·
 *   hits: mọi lần gọi hitTarget · calcs: mọi lần gọi calculateDamage (đòn đánh thường: skill === false).
 */
function arena(h, { level = 1, rank = 0, foes = [['monster_dummy', 8, 0]], foeLevel = 1, foeHeroes = null, allies = [] } = {}) {
    const mine = ['chessmaster', ...allies];
    h.run(`var team = createSquad('left', SQUAD_ORDER.filter(c => !${JSON.stringify(mine)}.includes(c)),
            Object.fromEntries(${JSON.stringify(mine)}.map(c => [c, { level: ${level}, rank: ${rank} }])));
        var foes = ${foeHeroes ? `createSquad('right', SQUAD_ORDER.filter(c => !${JSON.stringify(foeHeroes)}.includes(c)),
            Object.fromEntries(${JSON.stringify(foeHeroes)}.map(c => [c, { level: ${foeLevel}, rank: 0 }])))` : `createMonsterSquad(${foeLevel}, ${JSON.stringify(foes)})`};
        var foe = (classId) => foes.find(e => e.classId === classId);
        var ally = (classId) => team.find(e => e.classId === classId);
        var room = { id: 'fixture', mode: 'test', status: 'active', clock: 100000, speed: 1.5,
            players: { p1: { side: 'left', squad: team }, p2: { side: 'right', isNPC: true, squad: foes } } };
        rooms.fixture = room; curRoom = room;
        var leon = team.find(m => m.classId === 'chessmaster'), LI = team.indexOf(leon); leon.x = 0; leon.z = 0; leon.mp = leon.maxMp;
        var T0 = room.clock;
        var hits = [], calcs = []; var __hitTarget = hitTarget, __calculateDamage = calculateDamage;
        hitTarget = function (attacker, target, ti, opp, mult, now, opts) {
            const r = __hitTarget.apply(this, arguments);
            hits.push({ by: attacker.classId, ti, mult, at: now - T0, cc: !!(opts && opts.cc), aoe: !!(opts && opts.aoe), delay: (opts && opts.delay) || 0,
                isCrit: r.isCrit, isMiss: r.isMiss, damage: r.damage });
            return r;
        };
        calculateDamage = function (attacker, target, mult, now, opts) {
            const r = __calculateDamage.apply(this, arguments);
            calcs.push({ by: attacker.classId, to: target.classId, ti: foes.indexOf(target), mult: mult === undefined ? 1 : mult, at: now - T0, skill: !!(opts && opts.isSkill),
                damage: r.damage, absorbed: r.absorbed || 0, isMiss: r.isMiss });
            return r;
        };
        function cast(i) { curRoom = room; executeSkill('fixture', 'p1', LI, 'p2', i); }
        function at(ms) {
            room.clock = T0 + ms; curRoom = room; runPending(room, room.clock);
            for (const [pid, t] of Object.entries(room.players)) if (typeof processChessTeam === 'function') processChessTeam(room, pid, pid === 'p1' ? 'p2' : 'p1', room.clock);
            for (const [pid, t] of Object.entries(room.players)) for (let i = 0; i < t.squad.length; i++) {
                const opp = pid === 'p1' ? 'p2' : 'p1';
                if (t.squad[i].alive && typeof processChessPiece === 'function') processChessPiece(room, pid, i, opp, room.clock);
                if (typeof processChess === 'function') processChess(room, pid, i, opp, room.clock);
            }
        }
        function upTo(ms) { while (room.clock < T0 + ms) at(Math.min(ms, room.clock - T0 + 50)); }
        var put = (kind, x, z) => { const s = team[summonChessPiece(room, 'p1', LI, kind, room.clock)]; if (x != null) { s.x = x; s.z = z || 0; } return s; };
        var piece = (kind) => (chessPieces(room.players.p1, LI)[kind] || {}).unit;
        var slot = (kind) => { const p = chessPieces(room.players.p1, LI)[kind]; return p ? p.slot : -1; };
        var modes = () => leon.skills.map(s => s.mode);
        var kill = (m, squad) => { m.hp = 0; killMember(m, squad || team); };`);
}
/** Chạy VÒNG LẶP TRẬN THẬT (startBattleLoop) với đồng hồ giả: mỗi nhịp 50 ms trận. tick(n) chạy n nhịp. */
function realLoop(h) {
    h.run("var __now = 5000000; Date.now = () => __now; room.lastReal = __now; startBattleLoop('fixture');");
    const loop = h.ticks.at(-1);
    return (n = 1) => { for (let i = 0; i < n; i++) { h.run('__now += 50'); loop(); } };
}

// ============================================================
// B1 — khai báo Leon + 6 quân, 3 nút đổi theo thế cờ, gọi quân
// ============================================================
// spec 5.6: [tên, maxHp, +mỗi cấp, loại công, công, +, pDef, +, mDef, +, atkSpeed, tầm]
const PIECES = {
    pawn: ['Tốt', 1500, 95, 'pAtk', 130, 8, 110, 6, 90, 5, 1000, 2.2],
    rook: ['Xe', 3600, 230, 'pAtk', 150, 9, 260, 13, 200, 10, 1400, 2.6],
    knight: ['Mã', 1500, 95, 'pAtk', 185, 11, 90, 5, 80, 4, 900, 2.4],
    bishop: ['Tượng', 1000, 65, 'mAtk', 165, 10, 50, 3, 90, 5, 1200, 10],
    king: ['Vua', 4200, 260, 'pAtk', 210, 12, 240, 12, 220, 11, 1300, 2.8],
    queen: ['Hậu', 1400, 90, 'mAtk', 230, 13, 60, 3, 110, 6, 1100, 11],
};
// bảng chế độ nút trong plan: mode -> [tên, giá Orb, hồi chiêu, hình]
const MODES = {
    pawn: ['Gọi Tốt', 1, 1000, 'chess_pawn'], rook: ['Gọi Xe', 2, 1000, 'chess_rook'], guardMove: ['Nước Cờ Thủ', 1, 8000, 'chess_guard'],
    knight: ['Gọi Mã', 1, 1000, 'chess_knight'], bishop: ['Gọi Tượng', 2, 1000, 'chess_bishop'], strikeMove: ['Nước Cờ Công', 1, 8000, 'chess_strike'],
    locked: ['Chưa Đủ Thế Cờ', 0, 0, 'chess_locked'], king: ['Gọi Vua', 3, 1000, 'chess_king'], queen: ['Gọi Hậu', 3, 1000, 'chess_queen'],
    kingSkill: ['Phán Quyết', 2, 12000, 'chess_kingskill'], queenSkill: ['Vũ Điệu Quang Cầu', 2, 12000, 'chess_queenskill'],
    checkmate: ['Chiếu Tướng', 3, 20000, 'chess_checkmate'],
};
/** Nút số i của Leon phải đúng chế độ `mode` theo bảng (tên, giá, hồi, hình, kiểu kỹ năng gốc, cờ khoá) */
function assertButton(h, i, mode) {
    const sk = json(h, `leon.skills[${i}]`);
    const [name, orbCost, cooldown, icon] = MODES[mode];
    assert.deepEqual([sk.mode, sk.name, sk.orbCost, sk.cooldown, sk.icon, sk.type, !!sk.locked],
        [mode, name, orbCost, cooldown, icon, ['chess_guard', 'chess_strike', 'chess_royal'][i], mode === 'locked'], `nút ${i + 1} ở chế độ ${mode}`);
}

test('chessmaster: có trong CLASS_DEFS, SQUAD_ORDER, cửa hàng 1200 Kim Cương; 6 quân chess_* đúng bảng; CHESS_MODES đủ 12 chế độ', () => {
    const h = harness();
    const def = JSON.parse(h.run('JSON.stringify(CLASS_DEFS.chessmaster ?? null)'));
    assert.ok(def, 'CLASS_DEFS.chessmaster');
    assert.deepEqual([def.name, def.title, def.className, def.emoji, def.color, def.dmgType, def.classGroup, def.race],
        ['Leon', 'Kỳ Vương', 'Kỳ Thủ', '♟️', '#eab308', 'magic', 'summoner', 'human']);
    // chỉ số gốc cấp 1 (spec 5.2)
    const want = { maxHp: 1000, maxMp: 5000, pAtk: 0, mAtk: 170, pDef: 45, mDef: 75, crit: 100, critDmg: 500, acc: 1000, dodge: 100, pen: 50, block: 0,
        lifesteal: 0, threat: 100, mpAtk: 200, mpSec: 140, atkSpeed: 1100, range: 'ranged', atkRange: 11, moveSpeed: 0.01 };
    for (const [k, v] of Object.entries(want)) assert.equal(def[k], v, k);
    assert.equal(h.run("SQUAD_ORDER.includes('chessmaster')"), true);
    assert.equal(SHOP.PRICES.chessmaster, 1200);
    // sức quái vẫn chỉ tính theo 11 anh hùng gốc
    assert.deepEqual(json(h, 'MONSTER_SCALE_HEROES'), ['assassin', 'warrior', 'archer', 'priest', 'mage', 'reaper', 'wrestler', 'dancer', 'elementalist', 'alchemist', 'summoner']);
    // 3 kỹ năng gốc (khung của 3 nút) + 2 thiên phú
    assert.deepEqual(def.skills.map(s => [s.type, s.castRange, s.castTime]), [['chess_guard', 99, 0], ['chess_strike', 99, 0], ['chess_royal', 99, 0]]);
    assert.deepEqual(def.passives.map(p => [p.name, p.type, p.talent]), [['Thí Quân', 'chess_sacrifice', 1], ['Phong Cấp', 'chess_promote', 2]]);
    assert.deepEqual(def.passives[0].levels, { value: [0.06, 0.08, 0.10] });
    assert.deepEqual([def.passives[0].orb, def.passives[0].duration], [0.5, 5000]);
    assert.deepEqual(def.passives[1].levels, { value: [12000, 10000] });   // Phong Cấp: 12 giây (thiên phú cấp 2: 10 giây)
    assert.match(def.passives[1].desc, /Tốt.*Hậu.*Mã.*Vua/);
    // 6 quân cờ: triệu hồi có máu, nhận buff + debuff, chỉ số gốc + mỗi cấp đúng bảng spec 5.6
    assert.deepEqual(json(h, 'CHESS_UNITS'), Object.fromEntries(Object.keys(PIECES).map(k => [k, `chess_${k}`])));
    for (const [kind, [name, hp, hpUp, atkKey, atk, atkUp, pDef, pDefUp, mDef, mDefUp, atkSpeed, atkRange]] of Object.entries(PIECES)) {
        const d = json(h, `CLASS_DEFS.chess_${kind} ?? null`);
        assert.ok(d, `CLASS_DEFS.chess_${kind}`);
        assert.equal(d.name, name);
        assert.equal(d.summon, true);
        assert.deepEqual(d.summonRules, { targetable: true, buffs: true, debuffs: true });
        const other = atkKey === 'pAtk' ? 'mAtk' : 'pAtk';
        assert.deepEqual([d.maxHp, d[atkKey], d[other], d.pDef, d.mDef, d.atkSpeed, d.atkRange], [hp, atk, 0, pDef, mDef, atkSpeed, atkRange], kind);
        assert.deepEqual(d.perLevel, { maxHp: hpUp, [atkKey]: atkUp, pDef: pDefUp, mDef: mDefUp }, `${kind} perLevel`);
        assert.equal(d.dmgType, atkKey === 'mAtk' ? 'magic' : 'physical');
        assert.equal(d.range, atkRange >= 6 ? 'ranged' : 'melee');
        assert.deepEqual([d.skills, d.passives], [[], []]);
    }
    // bảng 12 chế độ nút
    const table = json(h, 'CHESS_MODES');
    assert.deepEqual(Object.keys(table).sort(), Object.keys(MODES).sort());
    for (const [mode, [name, orbCost, cooldown, icon]] of Object.entries(MODES)) {
        assert.deepEqual([table[mode].name, table[mode].orbCost, table[mode].cooldown, table[mode].icon], [name, orbCost, cooldown, icon], mode);
        assert.equal(!!table[mode].locked, mode === 'locked');
    }
    // vào trận được như mọi anh hùng: đội chỉ có Leon, thiên phú mở theo cấp, vừa vào trận nút đã ở thế [Gọi Tốt, Gọi Mã, khoá]
    h.run("var squad = createSquad('left', SQUAD_ORDER.filter(c => c !== 'chessmaster'), { chessmaster: { level: 60, rank: 3 } })");
    assert.equal(h.run('squad.length'), 1);
    assert.equal(h.run('squad[0].classId'), 'chessmaster');
    assert.equal(h.run('squad[0].mp'), 2000);   // 1,5 Orb + 0,5 Orb của tộc Human
    assert.deepEqual(json(h, 'squad[0].passives.map(p => [p.type, p.value])'), [['chess_sacrifice', 0.10], ['chess_promote', 10000]]);
    assert.deepEqual(json(h, 'squad[0].skills.map(s => s.mode)'), ['pawn', 'knight', 'locked']);
    // mô tả thiên phú điền đủ số (không còn dấu ?)
    const talents = json(h, 'talentInfo(CLASS_DEFS.chessmaster, { level: 60, rank: 3 })');
    assert.equal(talents.length, 2);
    for (const t of talents) assert.ok(t.desc && !t.desc.includes('?') && !t.desc.includes('{'), t.desc);
    assert.match(talents[0].desc, /10%/);
    assert.match(talents[1].desc, /12/);
});

test('chess nút + khoá cánh: đầu trận [pawn, knight, locked]; gọi Tốt (−1 Orb) → [rook, locked, locked] (cánh công khoá); gọi Xe (−2 Orb) → [guardMove, locked, king]; bấm nút khoá không mất Orb; gọi Vua → cánh công mở lại; giá và hồi đúng bảng', () => {
    const h = harness();
    arena(h);   // 1 cọc gỗ đứng trong tầm đánh của Leon (cách 8): có đối thủ trong tầm thì mới dùng được nút
    h.run('leon.mpSec = 0; leon.mpAtk = 0');   // không tự hồi Orb: đo đúng số Orb mỗi nút trừ
    const tick = realLoop(h);
    const order = () => h.events.filter(e => e.name === 'skillExecuted' && e.data.casterId === 'p1').map(e => [e.data.type, e.data.mode]);
    assert.deepEqual(json(h, 'modes()'), ['pawn', 'knight', 'locked']);
    assertButton(h, 0, 'pawn'); assertButton(h, 1, 'knight'); assertButton(h, 2, 'locked');
    assert.deepEqual(json(h, 'leon.chess'), { ever: { pawn: false, rook: false, knight: false, bishop: false }, firstWing: null, wing: null, turn: { guard: 0, strike: 0 },
        cd: {}, deadAt: {}, royalAuto: { king: 0, queen: 0 }, seatSince: 0, royals: 0, royalEver: false });
    assert.equal(h.run('skillUsable(leon, 0) && skillUsable(leon, 1)'), true);   // chưa gọi quân nào: cả 2 cánh đều bấm được
    // ---- Gọi Tốt: −1 Orb, hồi 1 s (tính sau khi diễn xong), quân ra sân sau động tác gọi ----
    h.run('leon.queuedSkills = [0]');
    tick(1);
    h.run('var t1 = room.clock');
    assert.deepEqual(order(), [['chess_guard', 'pawn']]);
    assert.equal(h.run('leon.mp'), 4000);
    const lock = h.run('leon.actionUntil - t1'), impact = h.run('leon.skills[0].impact');
    assert.ok(lock > 0 && impact >= 0 && impact <= lock, `impact ${impact} / lock ${lock}`);
    assert.equal(h.run('leon.skillCooldowns[0] - t1'), lock + 1000);
    assert.equal(h.run('leon.chess.cd.pawn - t1'), lock + 1000);
    assert.equal(h.run('slot("pawn")'), -1);                       // chưa ra: còn đang diễn động tác gọi
    assert.deepEqual(json(h, '[leon.chess.wing, modes()[1]]'), ['guard', 'locked']);   // vừa bấm là đã chọn cánh thủ: nút cánh công khoá liền
    tick(Math.ceil(impact / 50) + 1);
    assert.equal(h.run('piece("pawn").classId'), 'chess_pawn');
    const s1 = h.fx('summon');
    assert.equal(s1.length, 1);
    assert.deepEqual([s1[0].casterId, s1[0].casterIdx, s1[0].piece, s1[0].summonIdx], ['p1', 0, 'pawn', h.run('slot("pawn")')]);
    assert.ok(s1[0].x > 0 && Number.isFinite(s1[0].z));           // Tốt ra phía trước Leon (về phía địch)
    assert.deepEqual(json(h, 'modes()'), ['rook', 'locked', 'locked']);
    assertButton(h, 0, 'rook'); assertButton(h, 1, 'locked');
    assert.equal(h.run('leon.skillCooldowns[0] <= room.clock'), true);   // Gọi Xe có đồng hồ riêng: chưa dùng lần nào -> sẵn sàng
    const N = Math.ceil(lock / 50) + 2 + Math.ceil(impact / 50);
    // ---- Gọi Xe: −2 Orb ----
    h.run('leon.queuedSkills = [0]');
    tick(N);
    assert.deepEqual(order(), [['chess_guard', 'pawn'], ['chess_guard', 'rook']]);
    assert.equal(h.run('leon.mp'), 2000);
    assert.equal(h.run('piece("rook").classId'), 'chess_rook');
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'locked', 'king']);
    assertButton(h, 0, 'guardMove'); assertButton(h, 1, 'locked'); assertButton(h, 2, 'king');
    assert.deepEqual(json(h, '[leon.chess.ever, leon.chess.firstWing, leon.chess.wing]'), [{ pawn: true, rook: true, knight: false, bishop: false }, 'guard', 'guard']);
    // ---- cánh công đang khoá: bấm nút 2 không mất Orb, không ra quân, lệnh bị gỡ khỏi hàng đợi ----
    assert.equal(h.run('skillUsable(leon, 1)'), false);
    h.run('leon.queuedSkills = [1]');
    tick(N);
    assert.equal(h.run('leon.mp'), 2000);
    assert.equal(h.run('slot("knight")'), -1);
    assert.deepEqual(json(h, 'leon.queuedSkills'), []);
    assert.equal(order().length, 2);
    // ---- Gọi Vua: −3 Orb; có Vua rồi thì nút 3 thành chiêu 2 của Vua, cánh công MỞ LẠI ----
    h.run('leon.mp = 3000; leon.queuedSkills = [2]');
    tick(N);
    assert.equal(h.run('leon.mp'), 0);
    assert.equal(h.run('piece("king").classId'), 'chess_king');
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'knight', 'kingSkill']);
    assertButton(h, 1, 'knight'); assertButton(h, 2, 'kingSkill');
    assert.equal(h.run('leon.chess.royalEver && skillUsable(leon, 1)'), true);
    // ---- cánh công: Gọi Mã (−1), Gọi Tượng (−2) ----
    h.run('leon.mp = 1000; leon.queuedSkills = [1]');
    tick(N);
    assert.equal(h.run('leon.mp'), 0);
    assert.equal(h.run('piece("knight").classId'), 'chess_knight');
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'bishop', 'kingSkill']);
    assertButton(h, 1, 'bishop');
    h.run('leon.mp = 2000; leon.queuedSkills = [1]');
    tick(N);
    assert.equal(h.run('leon.mp'), 0);
    assert.equal(h.run('piece("bishop").classId'), 'chess_bishop');
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'strikeMove', 'kingSkill']);
    assertButton(h, 1, 'strikeMove');
    assert.equal(h.fx('summon').length, 5);
    // Vua gục: cả 2 cánh vẫn dùng được tới hết trận
    h.run('kill(piece("knight")); var kgSlot = slot("king")');
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'knight', 'kingSkill']);
    // mỗi quân chỉ 1 con, đều là thành viên thật của đội (triệu hồi), của đúng Leon này
    assert.deepEqual(json(h, 'team.slice(1).map(s => [s.classId, s.chessKind, s.summon, s.ownerIdx, s.alive, s.side])'),
        ['pawn', 'rook', 'king', 'knight', 'bishop'].map(k => [`chess_${k}`, k, true, 0, k !== 'knight', 'left']));
    h.run('kill(piece("king"))');
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'knight', 'king']);
});

test('chess "đã từng gọi": Tốt chết → nút 1 về pawn, nút 3 vẫn king; trong 5000 ms sau khi chết skillUsable(nút 1) false', () => {
    const h = harness();
    arena(h);
    h.run('put("pawn"); put("rook")');
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'locked', 'king']);
    assert.equal(h.run('skillUsable(leon, 0) && !skillUsable(leon, 1) && skillUsable(leon, 2)'), true);   // (cánh công khoá tới khi có quân chúa)
    h.run('var pawnSlot = slot("pawn"); at(2000); kill(piece("pawn"))');
    assert.deepEqual(json(h, 'modes()'), ['pawn', 'locked', 'king']);   // đổi ngay lúc quân chết, "đã từng đủ Tốt + Xe" vẫn giữ
    assertButton(h, 0, 'pawn'); assertButton(h, 2, 'king');
    assert.equal(h.run('leon.chess.deadAt.pawn - T0'), 2000);
    assert.equal(h.run('skillUsable(leon, 0)'), false);
    assert.equal(h.run('leon.skillCooldowns[0] - T0'), 2000 + 5000);      // nút đếm ngược tới lúc gọi lại được
    h.run('at(6999)');
    assert.equal(h.run('skillUsable(leon, 0)'), false);
    assert.equal(h.run('!skillUsable(leon, 1) && skillUsable(leon, 2)'), true);  // nút 3 không bị ảnh hưởng
    h.run('at(7000)');
    assert.equal(h.run('skillUsable(leon, 0)'), true);
    // gọi lại: Tốt mới dùng lại đúng ô cũ trong đội, nút 1 trở lại Nước Cờ Thủ
    h.run('cast(0); at(7000 + leon.skills[0].impact)');
    assert.equal(h.run('slot("pawn")'), h.run('pawnSlot'));
    assert.equal(h.run('piece("pawn").hp'), h.run('piece("pawn").maxHp'));
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'locked', 'king']);
    // Xe chết khi Tốt còn sống: nút 1 thành Gọi Xe
    h.run('at(9000); kill(piece("rook"))');
    assert.deepEqual(json(h, 'modes()'), ['rook', 'locked', 'king']);
    assert.equal(h.run('skillUsable(leon, 0)'), false);
    h.run('at(14000)');
    assert.equal(h.run('skillUsable(leon, 0)'), true);
    // cả Tốt lẫn Xe chết: gọi Tốt trước; nút 3 vẫn Gọi Vua
    h.run('kill(piece("pawn"))');
    assert.deepEqual(json(h, 'modes()'), ['pawn', 'locked', 'king']);
    // quân chúa gọi bằng nút 3 mà chết thì nút 3 gọi lại đúng quân đó (cũng chờ 5 giây)
    h.run('leon.actionUntil = 0; leon.skillCooldowns = [0, 0, 0]; cast(2); at(14000 + leon.skills[2].impact)');
    assert.equal(h.run('piece("king").classId'), 'chess_king');
    assert.deepEqual(json(h, 'modes()'), ['pawn', 'knight', 'kingSkill']);
    assert.equal(h.run('skillUsable(leon, 2)'), true);                    // chiêu 2 của Vua (Phán Quyết)
    h.run('at(16000); kill(piece("king"))');
    assert.deepEqual(json(h, 'modes()'), ['pawn', 'knight', 'king']);
    assert.equal(h.run('skillUsable(leon, 2)'), false);
    h.run('at(21000)');
    assert.equal(h.run('skillUsable(leon, 2)'), true);
});

test('chess khoá cánh: gọi quân cánh nào trước thì cánh kia khoá tới khi có quân chúa; đủ Mã+Tượng → nút 3 là queen; đủ Tốt+Xe → king; có quân chúa rồi thì cả 2 cánh dùng tới hết trận', () => {
    const h = harness();
    arena(h);
    h.run('put("knight")');
    assert.deepEqual(json(h, 'modes()'), ['locked', 'bishop', 'locked']);   // chọn cánh công: nút cánh thủ khoá, nút 3 còn khoá (chưa đủ cánh)
    assertButton(h, 0, 'locked'); assertButton(h, 2, 'locked');
    assert.deepEqual(json(h, '[leon.chess.wing, skillUsable(leon, 0), skillUsable(leon, 1), skillUsable(leon, 2)]'), ['strike', false, true, false]);
    // bấm thẳng vào nút khoá (không qua vòng lặp trận): lưới an toàn — không ra quân, không trừ Orb, không vào hồi
    h.run('var mp0 = leon.mp; cast(0); at(1000)');
    assert.deepEqual(json(h, '[slot("pawn"), leon.mp === mp0, leon.skillCooldowns[0]]'), [-1, true, 0]);
    h.run('leon.actionUntil = 0; put("bishop")');
    assert.deepEqual(json(h, 'modes()'), ['locked', 'strikeMove', 'queen']);
    assert.equal(h.run('leon.chess.firstWing'), 'strike');
    assertButton(h, 2, 'queen');
    // gọi Hậu ra sân bằng nút 3 -> cánh thủ mở
    h.run('cast(2); at(1000 + leon.skills[2].impact)');
    assert.equal(h.run('piece("queen").classId'), 'chess_queen');
    assert.equal(h.run('piece("king")'), undefined);
    assert.deepEqual(json(h, 'modes()'), ['pawn', 'strikeMove', 'queenSkill']);
    assert.deepEqual(json(h, '[skillUsable(leon, 0), skillUsable(leon, 2)]'), [true, true]);    // Gọi Tốt · chiêu 2 của Hậu (Vũ Điệu Quang Cầu)
    h.run('put("pawn"); put("rook")');
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'strikeMove', 'queenSkill']);
    assert.deepEqual(json(h, 'leon.chess.ever'), { pawn: true, rook: true, knight: true, bishop: true });
    // quân của cánh công + Hậu chết hết: nút 3 gọi lại Hậu (cánh đủ trước), cả 2 cánh vẫn mở
    h.run('kill(piece("knight")); kill(piece("bishop")); kill(piece("queen"))');
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'knight', 'queen']);
    // thứ tự ngược lại ở trận khác: chọn cánh thủ -> king. Quân cánh kia có ra sân bằng đường khác (không qua nút) cũng không mở khoá
    const g = harness();
    arena(g);
    g.run('put("pawn")');
    assert.deepEqual(json(g, 'modes()'), ['rook', 'locked', 'locked']);
    g.run('put("rook"); put("knight")');
    assert.deepEqual(json(g, 'modes()'), ['guardMove', 'locked', 'king']);
    assert.deepEqual(json(g, '[leon.chess.firstWing, leon.chess.wing]'), ['guard', 'guard']);
    g.run('put("king")');
    assert.deepEqual(json(g, 'modes()'), ['guardMove', 'bishop', 'kingSkill']);
});

test('chess quân không hết giờ: sau 120 s vẫn sống; mỗi loại 1 quân; chỉ số = gốc + perLevel × (cấp Leon − 1)', () => {
    const h = harness();
    arena(h, { level: 37, rank: 2, foes: [['monster_dummy', 8, 0], ['monster_dummy', 9, 2]] });
    h.run('for (const k of Object.keys(CHESS_UNITS)) put(k)');
    assert.equal(h.run('team.length'), 7);
    for (const [kind, [name, hp, hpUp, atkKey, atk, atkUp, pDef, pDefUp, mDef, mDefUp, atkSpeed, atkRange]] of Object.entries(PIECES)) {
        const s = json(h, `piece("${kind}")`);
        const other = atkKey === 'pAtk' ? 'mAtk' : 'pAtk';
        assert.deepEqual([s.name, s.maxHp, s.hp, s[atkKey], s[other], s.pDef, s.mDef, s.atkSpeed, s.atkRange],
            [name, hp + hpUp * 36, hp + hpUp * 36, atk + atkUp * 36, 0, pDef + pDefUp * 36, mDef + mDefUp * 36, atkSpeed, atkRange], kind);
        assert.deepEqual([s.classId, s.chessKind, s.summon, s.ownerIdx, s.level, s.side, s.maxMp, s.mp], [`chess_${kind}`, kind, true, 0, 37, 'left', 0, 0]);
        assert.equal(h.run(`piece("${kind}").summonEnd`), Infinity);
    }
    assert.equal(new Set(json(h, 'team.slice(1).map(s => s.summonId)')).size, 6);
    // vị trí ra sân so với Leon (0, 0), hướng về phía địch (+x): Tốt +4, Xe +3, Mã +3, Tượng −1, Vua +5, Hậu −1 — không quân nào đứng chồng lên nhau
    assert.deepEqual(json(h, 'Object.keys(CHESS_UNITS).map(k => piece(k).x)'), [4, 3, 3, -1, 5, -1]);
    const pos = json(h, 'Object.keys(CHESS_UNITS).map(k => [piece(k).x, piece(k).z])');
    for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) assert.ok(Math.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]) >= 1.5, `quân ${a} và ${b} đứng chồng`);
    // gọi thêm loại đang có: không ra quân thứ hai
    h.run('var again = summonChessPiece(room, "p1", LI, "pawn", room.clock)');
    assert.equal(h.run('again'), h.run('slot("pawn")'));
    assert.equal(h.run('team.length'), 7);
    assert.equal(h.fx('summon').length, 6);
    // 120 giây trong vòng lặp trận thật: không quân nào hết giờ, quân nào cũng đánh thường
    const tick = realLoop(h);
    tick(2400);
    assert.equal(h.run('room.clock - T0'), 120000);
    assert.deepEqual(json(h, 'team.map(s => s.alive)'), [true, true, true, true, true, true, true]);
    assert.deepEqual(json(h, 'team.slice(1).map(s => s.lastAttackTime > T0 + 110000)'), [true, true, true, true, true, true]);
    assert.equal(h.run('foes[0].hp < foes[0].maxHp'), true);
    assert.equal(h.events.some(e => e.name === 'sylvaFx' && e.data.kind === 'summonEnd'), false);
    assert.equal(h.run('team.length'), 7);
});

test('chess: mp 500 bấm Gọi Tốt → không trừ mp, không có quân; nút khoá (nút 3, nút cánh bị khoá) bấm 5 lần → queuedSkills không giữ lại, nút 1 vẫn dùng được', () => {
    const h = harness();
    arena(h);
    h.run('leon.mpSec = 0; leon.mpAtk = 0; leon.mp = 500');
    const tick = realLoop(h);
    // thiếu Orb: lệnh nằm chờ như mọi anh hùng, không trừ gì, không ra quân
    h.run('leon.queuedSkills = [0]');
    tick(20);
    assert.equal(h.run('leon.mp'), 500);
    assert.equal(h.run('team.length'), 1);
    assert.equal(h.run('leon.skillCooldowns[0]'), 0);
    assert.deepEqual(json(h, 'leon.queuedSkills'), [0]);
    assert.equal(h.events.some(e => e.name === 'skillExecuted'), false);
    // nút 3 đang khoá: bấm 5 lần (mỗi lần bấm = thêm vào / gỡ khỏi hàng đợi như máy chủ làm) — không lần nào được giữ lại
    h.run('var press = (i) => { const q = leon.queuedSkills; if (q.includes(i)) q.splice(q.indexOf(i), 1); else q.push(i); }');
    for (let n = 0; n < 5; n++) {
        h.run('press(2)');
        tick(1);
        assert.equal(h.run('leon.queuedSkills.includes(2)'), false, `lần bấm ${n + 1}`);
    }
    assert.deepEqual(json(h, 'leon.queuedSkills'), [0]);   // lệnh Gọi Tốt vẫn chờ, không bị nút khoá chen ngang
    assert.equal(h.run('leon.mp'), 500);
    assert.equal(h.run('leon.skillCooldowns[2]'), 0);
    // đủ Orb: Gọi Tốt ra ngay
    h.run('leon.mp = 1000');
    tick(1);
    assert.equal(h.run('leon.mp'), 0);
    assert.deepEqual(json(h, 'leon.queuedSkills'), []);
    tick(10);
    assert.equal(h.run('piece("pawn").classId'), 'chess_pawn');
    // đã chọn cánh thủ: nút cánh công (nút 2) khoá — bấm 5 lần không lần nào được giữ lại, không mất Orb
    assert.equal(h.run('modes()[1]'), 'locked');
    h.run('leon.mp = 1000');
    for (let n = 0; n < 5; n++) {
        h.run('press(1)');
        tick(1);
        assert.equal(h.run('leon.queuedSkills.includes(1)'), false, `lần bấm nút cánh khoá ${n + 1}`);
    }
    assert.deepEqual(json(h, '[leon.mp, slot("knight")]'), [1000, -1]);
    // nút khoá đứng đầu hàng đợi cũng không chặn nút khác: [nút 3 khoá, nút 2 khoá, nút 1 Gọi Xe] -> Xe vẫn ra
    h.run('leon.mp = 2000; leon.actionUntil = 0; leon.queuedSkills = [2, 1, 0]');
    tick(1);
    assert.equal(h.run('leon.mp'), 0);
    tick(10);
    assert.equal(h.run('piece("rook").classId'), 'chess_rook');
    assert.deepEqual(json(h, 'leon.queuedSkills'), []);
    // đang hồi chiêu: lệnh chờ, không trừ Orb, hết hồi mới ra
    h.run('leon.mp = 2000; leon.actionUntil = 0; leon.queuedSkills = [0]');
    tick(1);
    assert.deepEqual(h.events.filter(e => e.name === 'skillExecuted').map(e => e.data.mode), ['pawn', 'rook', 'guardMove']);
    assert.equal(h.run('leon.mp'), 1000);
    h.run('var used = room.clock; leon.queuedSkills = [0]');
    tick(100);   // 5 giây: Nước Cờ Thủ còn đang hồi (8 giây)
    assert.equal(h.run('leon.mp'), 1000);
    assert.deepEqual(json(h, 'leon.queuedSkills'), [0]);
    assert.equal(h.events.filter(e => e.name === 'skillExecuted').length, 3);
    tick(80);    // quá 8 giây + thời gian diễn
    assert.equal(h.events.filter(e => e.name === 'skillExecuted').length, 4);
    assert.equal(h.run('leon.mp'), 0);
});

test('chess: Leon gục trước khi quân kịp ra sân thì không có quân; Leon gục khi còn quân → quân ở lại đánh tiếp; 2 Leon hai phe có thế cờ riêng', () => {
    const h = harness();
    arena(h, { allies: ['warrior'], foeHeroes: ['chessmaster', 'warrior'] });
    h.run(`var rok = ally('warrior'), her = foe('chessmaster'), HI = foes.indexOf(her);
        Object.assign(rok, { x: -6, z: 4 }); Object.assign(her, { x: 9, z: 0 }); Object.assign(foe('warrior'), { x: 30, z: 6 });`);
    // gục giữa động tác gọi: quân không ra
    h.run('cast(0); kill(leon); at(1000)');
    assert.equal(h.run('team.some(s => s.chessKind)'), false);
    assert.equal(h.fx('summon').length, 0);
    // sống lại (giả lập hồi sinh), gọi Tốt + Mã; Leon phe kia gọi Mã — thế cờ 2 bên không dính nhau
    h.run(`leon.alive = true; leon.hp = leon.maxHp; leon.state = 'idle'; leon.actionUntil = 0; leon.skillCooldowns = [0, 0, 0];
        put("pawn"); put("knight");
        summonChessPiece(room, 'p2', HI, 'knight', room.clock);`);
    assert.deepEqual(json(h, 'modes()'), ['rook', 'locked', 'locked']);                       // Leon phe trái chọn cánh thủ (Tốt ra trước)
    assert.deepEqual(json(h, 'her.skills.map(s => s.mode)'), ['locked', 'bishop', 'locked']);   // Leon phe phải chọn cánh công
    assert.deepEqual(json(h, 'Object.keys(chessPieces(room.players.p2, HI))'), ['knight']);
    assert.deepEqual(h.fx('summon').map(e => [e.casterId, e.piece]), [['p1', 'pawn'], ['p1', 'knight'], ['p2', 'knight']]);
    assert.equal(h.run('foes.find(s => s.chessKind).side'), 'right');
    assert.ok(h.run('foes.find(s => s.chessKind).x') < h.run('her.x'));   // quân phe phải ra về phía −x (phía địch của nó)
    // Leon gục khi còn quân: quân ở lại, vẫn đánh; nút của Leon không còn được làm mới
    const tick = realLoop(h);
    h.run('var pw = piece("pawn"), kn = piece("knight"); pw.hp = pw.maxHp = kn.hp = kn.maxHp = 1e6; kill(leon); var t1 = room.clock');   // quân trâu hẳn lên để bài thử không phụ thuộc ai thắng
    tick(100);
    assert.equal(h.run('leon.alive'), false);
    assert.deepEqual(json(h, '[pw.alive, kn.alive]'), [true, true]);
    assert.equal(h.run('pw.lastAttackTime > t1 || kn.lastAttackTime > t1'), true);
    assert.deepEqual(json(h, 'leon.skills.map(s => s.mode)'), ['rook', 'locked', 'locked']);
    assert.ok(!h.run('room.winner'));                                    // Rok còn sống: trận chưa kết thúc
    // phe chỉ còn quân cờ sống → thua (luật sẵn có chỉ đếm tướng); quân cờ biến mất theo
    h.run('kill(rok)');
    tick(1);
    assert.equal(h.run('room.winner'), 'p2');
    assert.equal(h.run('team.some(s => s.alive)'), false);
});

// ============================================================
// B2 — cánh thủ: Tốt (Bắt Chéo, Giữ Lối), Xe (Thành Lũy, Nhập Thành), Nước Cờ Thủ
// ============================================================
/** Trong vm: taken(attacker, target) = sát thương 1 đòn ×1 gây ra (kể cả phần khiên hứng) — đo không làm mòn khiên */
const TAKEN = `var taken = (a, t) => { const keep = t.statusEffects; t.statusEffects = keep.filter(e => !SHIELD_TYPES.has(e.type));
    const r = __calculateDamage(a, t, 1, room.clock); t.statusEffects = keep; return r.damage; };
    var shieldOf = (m, type) => m.statusEffects.find(e => e.type === type && e.endTime > room.clock);`;

test('Tốt Bắt Chéo: đòn thứ 3 trúng thêm 1 đối thủ trong bán kính 3 quanh mục tiêu ×1.3; sau đó Tốt có khiên 12% maxHp trong 4000 ms', () => {
    const h = harness();
    // A (7, 0) là mục tiêu · B cách A 2.5 · C cách A 2.9 (xa hơn B: không trúng thêm) · D cách A 4 (ngoài bán kính 3)
    arena(h, { foes: [['monster_dummy', 7, 0], ['monster_dummy', 7, 2.5], ['monster_dummy', 7, -2.9], ['monster_dummy', 11, 0]] });
    h.run('var pw = put("pawn", 5.5, 0); var autos = () => calcs.filter(c => c.by === "chess_pawn" && !c.skill); var extra = () => hits.filter(x => x.by === "chess_pawn")');
    const tick = realLoop(h);
    tick(59);   // 2950 ms: mới 2 đòn thường ×1
    assert.deepEqual(json(h, 'autos().map(c => [c.ti, c.mult, c.at])'), [[0, 1, 1000], [0, 1, 2000]]);
    assert.equal(h.fx('pawnSlash').length, 0);
    assert.equal(h.run('extra().length'), 0);
    tick(1);    // 3000 ms: đòn thứ 3 = nhát chém chéo ×1.3 vào mục tiêu + trúng thêm B
    assert.deepEqual(json(h, 'autos().map(c => [c.ti, c.mult, c.at])'), [[0, 1, 1000], [0, 1, 2000], [0, 1.3, 3000]]);
    assert.ok(h.run('autos()[2].damage') > h.run('autos()[0].damage'));
    assert.deepEqual(json(h, 'extra().map(x => [x.ti, x.mult, x.at])'), [[1, 1.3, 3000]]);
    const slash = h.fx('pawnSlash');
    assert.equal(slash.length, 1);
    assert.deepEqual([slash[0].casterId, slash[0].casterIdx, slash[0].summonIdx], ['p1', 0, h.run('slot("pawn")')]);
    assert.deepEqual(slash[0].effects.map(e => e.targetIndex), [1]);
    assert.ok(slash[0].effects[0].damage > 0);
    assert.equal(h.run('pw.statusEffects.some(e => SHIELD_TYPES.has(e.type))'), false);   // chém xong (đòn chạm) mới có khiên
    const impact = h.run('CLASS_DEFS.chess_pawn.autoImpact');
    tick(impact / 50);
    assert.equal(h.run('foes[1].maxHp - foes[1].hp'), slash[0].effects[0].damage);
    assert.equal(h.run('foes[2].hp === foes[2].maxHp && foes[3].hp === foes[3].maxHp'), true);
    const sh = json(h, 'activeShield(pw, room.clock)');
    assert.deepEqual([sh.type, sh.hp, sh.maxHp, sh.endTime - h.run('T0')], ['chess_pawn_shield', Math.round(1500 * 0.12), Math.round(1500 * 0.12), 3000 + impact + 4000]);
    // đòn 4, 5 thường; đòn 6 lại chém chéo, khiên làm mới (không cộng dồn)
    tick((6000 - 3000 - impact) / 50);
    assert.deepEqual(json(h, 'autos().map(c => c.mult)'), [1, 1, 1.3, 1, 1, 1.3]);
    assert.equal(h.fx('pawnSlash').length, 2);
    tick(impact / 50);
    assert.equal(h.run('pw.statusEffects.filter(e => e.type === "chess_pawn_shield").length'), 1);
    assert.equal(h.run('activeShield(pw, room.clock).endTime - T0'), 6000 + impact + 4000);
    // hết 4000 ms thì khiên tan (Tốt ngừng đánh để không chém tiếp)
    h.run('pw.lastAttackTime = room.clock + 1e9');
    tick(4000 / 50 - 1);
    assert.equal(h.run('activeShield(pw, room.clock).type'), 'chess_pawn_shield');
    tick(1);
    assert.equal(h.run('activeShield(pw, room.clock)'), null);
    // không có đối thủ nào khác trong bán kính 3: vẫn chém ×1.3 + được khiên, không trúng thêm ai
    const g = harness();
    arena(g, { foes: [['monster_dummy', 7, 0], ['monster_dummy', 11, 0]] });
    g.run('var pw = put("pawn", 5.5, 0)');
    const tick2 = realLoop(g);
    tick2(60 + impact / 50);
    assert.deepEqual(g.fx('pawnSlash').map(e => e.effects.length), [0]);
    assert.deepEqual(json(g, 'calcs.filter(c => c.by === "chess_pawn").map(c => c.mult)'), [1, 1, 1.3]);
    assert.equal(g.run('activeShield(pw, room.clock).type'), 'chess_pawn_shield');
});

test('Nước cờ thủ luân phiên: lần 1 Tốt tiến 2 ô về phía địch, đối thủ trong bán kính 5 bị taunted 3000 ms về Tốt, Tốt KHÔNG có khiên; lần 2 Xe tới đồng đội % máu thấp nhất (không tính Xe), cả hai có khiên = 15% maxHp của Xe 5000 ms, người đó nhận sát thương ×0.75', () => {
    const h = harness();
    arena(h, { allies: ['archer'], foes: [['c1_wolf', 9, 0], ['c1_wolf', 9.5, 3], ['c1_wolf', 15, 0]] });
    h.run(TAKEN + `var lyra = ally('archer'), AI = team.indexOf(lyra); var pw = put("pawn", 4, 0), rk = put("rook", 3, -1.5), PS = slot("pawn"), RS = slot("rook");
        var again = (ms) => { at(ms); leon.skillCooldowns = [0, 0, 0]; leon.actionUntil = 0; };
        var D0 = taken(foes[0], lyra)`);
    const [LI, PS, RS, AI] = [h.run('LI'), h.run('PS'), h.run('RS'), h.run('AI')];
    assert.ok(h.run('D0') > 20);
    assert.deepEqual(json(h, 'modes()'), ['guardMove', 'locked', 'king']);
    // ---- lần 1: Tốt — Giữ Lối ----
    h.run('cast(0)');
    assert.deepEqual(h.fx('command'), [{ casterId: 'p1', casterIdx: LI, kind: 'command', wing: 'guard', piece: 'pawn', summonIdx: PS }]);
    assert.deepEqual(json(h, '[pw.x, pw.z]'), [6, 0]);
    const taunts = json(h, 'foes.map(e => e.statusEffects.find(s => s.type === "taunted") || null)');
    for (const i of [0, 1]) assert.deepEqual([taunts[i].sourceIndex, taunts[i].endTime - h.run('T0'), taunts[i].debuff], [PS, 3000, true], `sói ${i}`);
    assert.equal(taunts[2], null);                                              // cách Tốt 9 ô: ngoài bán kính 5
    assert.equal(h.run('pw.statusEffects.some(e => SHIELD_TYPES.has(e.type))'), false);   // Giữ Lối không cho khiên
    assert.equal(h.run('rk.statusEffects.length'), 0);
    assert.equal(h.fx('castle').length, 0);
    assert.deepEqual(json(h, '[leon.chess.turn.guard, leon.skillCooldowns[0] - T0, leon.chess.cd.guardMove - T0]'), [1, 600 + 8000, 600 + 8000]);
    const ex = h.events.filter(e => e.name === 'skillExecuted').at(-1).data;
    assert.deepEqual([ex.type, ex.mode, ex.wing, ex.piece, ex.summonIdx], ['chess_guard', 'guardMove', 'guard', 'pawn', PS]);
    // ---- lần 2: Xe — Nhập Thành, tới đồng đội % máu thấp nhất (Xe còn 10% máu nhưng không tính chính nó) ----
    h.run('again(1000); lyra.hp = Math.round(lyra.maxHp * 0.4); rk.hp = Math.round(rk.maxHp * 0.1); cast(0)');
    assert.deepEqual(h.fx('command').at(-1), { casterId: 'p1', casterIdx: LI, kind: 'command', wing: 'guard', piece: 'rook', summonIdx: RS });
    const castle = h.fx('castle');
    assert.equal(castle.length, 1);
    assert.deepEqual([castle[0].casterId, castle[0].casterIdx, castle[0].summonIdx, castle[0].allyIdx], ['p1', LI, RS, AI]);
    assert.ok(h.run('Math.hypot(rk.x - lyra.x, rk.z - lyra.z)') <= 2, 'Xe nhảy tới sát đồng đội');
    assert.ok(h.run('rk.x > lyra.x'));                                          // đứng chắn phía địch
    const want = Math.round(h.run('rk.maxHp') * 0.15);
    for (const who of ['rk', 'lyra']) {
        const s = json(h, `shieldOf(${who}, "chess_castle")`);
        assert.deepEqual([s.hp, s.maxHp, s.endTime - h.run('T0')], [want, want, 1000 + 5000], who);
        assert.equal(h.run(`activeShield(${who}, room.clock).type`), 'chess_castle');
    }
    assert.deepEqual(json(h, '(g => [g.value, g.endTime - T0])(shieldOf(lyra, "chess_castle_guard"))'), [0.25, 6000]);
    assert.equal(h.run('shieldOf(rk, "chess_castle_guard")'), undefined);       // Xe chỉ có khiên, không có phần giảm sát thương
    // người được che nhận ×0.75; đang đứng sau Xe nên còn được Thành Lũy ×0.85
    const D0 = h.run('D0');
    assert.ok(Math.abs(h.run('taken(foes[0], lyra)') - D0 * 0.75 * 0.85) <= 1.5, `sau Xe: ${h.run('taken(foes[0], lyra)')} so với ${D0} × 0.75 × 0.85`);
    h.run('rk.x = lyra.x - 3');                                                 // Xe lùi ra sau: hết Thành Lũy, còn ×0.75 của Nhập Thành
    assert.ok(Math.abs(h.run('taken(foes[0], lyra)') - D0 * 0.75) <= 1, `${h.run('taken(foes[0], lyra)')} so với ${D0} × 0.75`);
    h.run('at(5999)');
    assert.ok(Math.abs(h.run('taken(foes[0], lyra)') - D0 * 0.75) <= 1);
    h.run('at(6000)');                                                          // hết 5000 ms: nhận đủ, khiên tan
    assert.equal(h.run('taken(foes[0], lyra)'), D0);
    assert.equal(h.run('activeShield(lyra, room.clock) || activeShield(rk, room.clock)'), null);
    assert.equal(h.run('leon.chess.turn.guard'), 2);
    // ---- lần 3 lại tới Tốt, lần 4 tới Xe: lúc này Tốt ít máu nhất -> Xe che cho Tốt ----
    h.run('again(9000); cast(0)');
    assert.equal(h.fx('command').at(-1).piece, 'pawn');
    assert.equal(h.run('pw.x'), 8);
    h.run('again(18000); lyra.hp = lyra.maxHp; pw.hp = Math.round(pw.maxHp * 0.2); cast(0)');
    assert.equal(h.fx('command').at(-1).piece, 'rook');
    assert.equal(h.fx('castle').at(-1).allyIdx, PS);
    assert.ok(h.run('shieldOf(pw, "chess_castle_guard") && shieldOf(pw, "chess_castle")'));
    assert.equal(h.run('leon.chess.turn.guard'), 4);
    // ---- quân tới lượt đang bị choáng: nút tạm không dùng được, bấm thẳng cũng không làm gì (không tính lượt, không vào hồi) ----
    h.run('again(27000); applyStun(pw, 1000, room.clock)');
    assert.equal(h.run('skillUsable(leon, 0)'), false);
    h.run('cast(0)');
    assert.deepEqual(json(h, '[leon.chess.turn.guard, leon.skillCooldowns[0] <= room.clock, leon.actionUntil <= room.clock, pw.x]'), [4, true, true, 8]);
    assert.equal(h.fx('command').length, 4);
    h.run('at(28000)');
    assert.equal(h.run('skillUsable(leon, 0)'), true);
});

test('Nước cờ thủ trong vòng lặp trận thật: −1 Orb, hồi 8 s; sói bị khiêu khích bỏ mục tiêu gần hơn để đánh Tốt; đối thủ miễn khống chế không bị khiêu khích', () => {
    const h = harness();
    arena(h, { foes: [['c1_wolf', 9, 2], ['c1_wolf', 9, 3], ['monster_dummy', 30, 0]] });
    // Xe đứng gần sói hơn Tốt -> bình thường sói đánh Xe; Tốt bước lên (6, 5) thì 2 con sói nằm trong bán kính 5
    h.run(`leon.mpSec = 0; leon.mpAtk = 0; leon.mp = 1000;
        var pw = put("pawn", 4, 5), rk = put("rook", 7, 0), PS = slot("pawn"), RS = slot("rook");
        for (const s of [pw, rk]) { s.hp = s.maxHp = 1e6; s.lastAttackTime = room.clock + 1e9; s.moveSpeed = 0; }
        foes[1].statusEffects.push({ type: 'giant_form', endTime: T0 + 99999, immuneUntil: T0 + 99999 });`);
    const tick = realLoop(h);
    tick(1);
    assert.deepEqual(json(h, '[foes[0].targetIndex, foes[1].targetIndex]'), [h.run('RS'), h.run('RS')]);
    h.run('leon.queuedSkills = [0]; var t1 = room.clock + 50');
    tick(1);
    assert.equal(h.run('leon.mp'), 0);
    assert.equal(h.run('leon.skillCooldowns[0] - t1'), 600 + 8000);
    assert.equal(h.fx('command').length, 1);
    assert.equal(h.run('foes[0].targetIndex'), h.run('PS'));
    assert.equal(h.run('foes[1].targetIndex'), h.run('RS'));                    // miễn khống chế: không bị khiêu khích
    assert.equal(h.run('foes[1].statusEffects.some(e => e.type === "taunted")'), false);
    tick(50);   // 2,5 giây sau vẫn phải đánh Tốt
    assert.equal(h.run('foes[0].targetIndex'), h.run('PS'));
    assert.ok(h.run('Math.hypot(foes[0].x - pw.x, foes[0].z - pw.z)') <= 2.8);  // đã chạy tới chỗ Tốt
});

test('Xe Thành Lũy: đồng đội đứng sau Xe trong 8 ô nhận ×0.85; đứng trước Xe nhận đủ', () => {
    const h = harness();
    arena(h, { foes: [['c1_wolf', 20, 0], ['c1_wolf', 5, 0]] });
    h.run(TAKEN + `var wolf = foes[0]; leon.x = 5; leon.z = 0; var D0 = taken(wolf, leon);
        var rk = put("rook", 10, 0), pw = put("pawn", 13, 0); var P0 = (() => { rk.alive = false; const v = taken(wolf, pw); rk.alive = true; return v; })();
        var W0 = taken(leon, foes[1]);
        var stand = (x, z) => { leon.x = x; leon.z = z; return taken(wolf, leon); }`);
    const D0 = h.run('D0');
    const near = (v, k) => Math.abs(v - D0 * k) <= 1;
    assert.ok(near(h.run('stand(5, 0)'), 0.85), `sau Xe 5 ô: ${h.run('stand(5, 0)')} so với ${D0} × 0.85`);
    assert.ok(near(h.run('stand(9.5, 0)'), 0.85));
    assert.ok(near(h.run('stand(2, 0)'), 0.85));                // đúng 8 ô
    assert.equal(h.run('stand(1.9, 0)'), D0);                   // 8,1 ô: ngoài tầm
    assert.ok(near(h.run('stand(4, 5)'), 0.85));                // lệch hàng, cách 7,8 ô
    assert.equal(h.run('stand(4, 6)'), D0);                     // lệch hàng, cách 8,5 ô
    assert.equal(h.run('stand(12, 0)'), D0);                    // đứng TRƯỚC Xe (gần phía địch hơn): nhận đủ
    assert.equal(h.run('stand(10, 3)'), D0);                    // ngang hàng với Xe: không tính là đứng sau
    // quân cờ khác cũng được che · bản thân Xe thì không · đối thủ đứng "sau" Xe không được gì
    assert.equal(h.run('taken(wolf, pw)'), h.run('P0'));        // Tốt đứng trước Xe
    h.run('pw.x = 8');
    assert.ok(Math.abs(h.run('taken(wolf, pw)') - h.run('P0') * 0.85) <= 1);
    assert.equal(h.run('chessWall(rk)'), 0);
    assert.deepEqual(json(h, '[chessWall(leon), chessWall(pw)]'), [0, 0.15]);   // Leon đang ở (10, 3): không; Tốt: có
    assert.equal(h.run('taken(leon, foes[1])'), h.run('W0'));
    // Xe gục: hết Thành Lũy
    assert.ok(near(h.run('stand(5, 0)'), 0.85));
    h.run('kill(rk)');
    assert.equal(h.run('stand(5, 0)'), D0);
    // phe phải: "sau Xe" là phía +x
    const g = harness();
    arena(g, { foeHeroes: ['chessmaster'] });
    g.run(TAKEN + `var her = foes[0]; her.x = 25; her.z = 0; var E0 = taken(leon, her);
        var rk2 = foes[summonChessPiece(room, 'p2', 0, 'rook', room.clock)]; rk2.x = 20; rk2.z = 0;`);
    assert.ok(Math.abs(g.run('taken(leon, her)') - g.run('E0') * 0.85) <= 1);
    g.run('her.x = 15');
    assert.equal(g.run('taken(leon, her)'), g.run('E0'));
});

// ============================================================
// B3 — cánh công: Mã (Nhảy Mã, Chiếu Đôi), Tượng (Hút Hồn, Trói Buộc), Nước Cờ Công
// ============================================================
test('Mã Nhảy Mã: đòn thứ 4 → Mã tới cạnh đối thủ hàng sau (x xa nhất về phía địch), đánh ×1.4', () => {
    const h = harness();
    // A (6, 0) đứng trước, B (15, 2) đứng sâu nhất phía địch, C (12, −3) ở giữa
    arena(h, { foes: [['monster_dummy', 6, 0], ['monster_dummy', 15, 2], ['monster_dummy', 12, -3]] });
    h.run('var kn = put("knight", 4, 0); var autos = () => calcs.filter(c => c.by === "chess_knight" && !c.skill); var jumps = () => hits.filter(x => x.by === "chess_knight")');
    const tick = realLoop(h);
    tick(71);   // 3550 ms: 3 đòn thường vào A
    assert.deepEqual(json(h, 'autos().map(c => [c.ti, c.mult, c.at])'), [[0, 1, 900], [0, 1, 1800], [0, 1, 2700]]);
    assert.equal(h.fx('knightJump').length, 0);
    tick(1);    // 3600 ms: đòn thứ 4 xong là nhảy tới B
    assert.deepEqual(json(h, 'autos().map(c => [c.ti, c.mult, c.at])'), [[0, 1, 900], [0, 1, 1800], [0, 1, 2700], [0, 1, 3600]]);
    assert.deepEqual(json(h, 'jumps().map(x => [x.ti, x.mult, x.at])'), [[1, 1.4, 3600]]);
    const jump = h.fx('knightJump');
    assert.equal(jump.length, 1);
    assert.deepEqual([jump[0].casterId, jump[0].casterIdx, jump[0].summonIdx, jump[0].z], ['p1', 0, h.run('slot("knight")'), 2]);
    assert.ok(Math.abs(jump[0].x - 13.8) < 1e-9);
    assert.deepEqual(jump[0].effects.map(e => e.targetIndex), [1]);
    assert.ok(jump[0].effects[0].damage > 0);
    assert.ok(h.run('Math.hypot(kn.x - foes[1].x, kn.z - foes[1].z)') <= 1.5, 'Mã đứng cạnh đối thủ hàng sau');
    assert.ok(h.run('kn.x < foes[1].x'));
    assert.deepEqual(json(h, '[kn.targetIndex, kn.lockedTargetIndex]'), [1, 1]);
    assert.equal(h.run('foes[1].hp'), h.run('foes[1].maxHp'));            // đòn nhảy chạm sau 350 ms
    tick(7);
    assert.equal(h.run('foes[1].maxHp - foes[1].hp'), jump[0].effects[0].damage);
    assert.equal(h.run('foes[2].hp'), h.run('foes[2].maxHp'));
    // nhảy xong đánh tiếp chính đối thủ đó; 4 đòn nữa lại nhảy
    tick(72 - 7);   // 7200 ms
    assert.deepEqual(json(h, 'autos().slice(4).map(c => [c.ti, c.mult, c.at])'), [[1, 1, 4500], [1, 1, 5400], [1, 1, 6300], [1, 1, 7200]]);
    assert.equal(h.fx('knightJump').length, 2);
    assert.deepEqual(json(h, 'jumps().map(x => [x.ti, x.mult])'), [[1, 1.4], [1, 1.4]]);
});

test('Chiếu Đôi: 2 đối thủ gần nhất trong 7 ô bị kéo tới cách Mã ≤ 1.5, mỗi đứa ×1.2 và choáng 1000 ms', () => {
    const h = harness();
    // sói 1 (20, 0) đứng sâu nhất -> Mã nhảy tới (18.8, 0). Cách chỗ đó: sói 1 = 1,2 · sói 2 = 4,1 · sói 3 = 5,7 (gần thứ ba: không bị kéo) · sói 0 = 10,8 (ngoài 7 ô)
    arena(h, { foes: [['c1_wolf', 8, 0], ['c1_wolf', 20, 0], ['c1_wolf', 16, 3], ['c1_wolf', 14, -3]] });
    h.run('var kn = put("knight", 3, 1.5), bs = put("bishop", -1, 1.5), KS = slot("knight"); bs.drainNext = 1e15; var far = (i) => Math.hypot(foes[i].x - kn.x, foes[i].z - kn.z); var hp0 = foes.map(e => e.hp)');
    assert.deepEqual(json(h, 'modes()'), ['locked', 'strikeMove', 'queen']);
    h.run('cast(1)');
    assert.deepEqual(h.fx('command'), [{ casterId: 'p1', casterIdx: 0, kind: 'command', wing: 'strike', piece: 'knight', summonIdx: h.run('KS') }]);
    assert.ok(Math.abs(h.run('kn.x') - 18.8) < 1e-9 && h.run('kn.z') === 0, 'Mã nhảy vào hàng sau');
    const fork = h.fx('fork');
    assert.equal(fork.length, 1);
    assert.deepEqual([fork[0].casterId, fork[0].casterIdx, fork[0].summonIdx], ['p1', 0, h.run('KS')]);
    assert.deepEqual(fork[0].pulled.map(p => p.targetIndex), [1, 2]);
    assert.deepEqual(fork[0].effects.map(e => e.targetIndex), [1, 2]);
    for (const i of [1, 2]) {
        assert.ok(h.run(`far(${i})`) <= 1.5, `sói ${i} cách Mã ${h.run(`far(${i})`)}`);
        const p = fork[0].pulled.find(x => x.targetIndex === i);
        assert.deepEqual([p.x, p.z], json(h, `[foes[${i}].x, foes[${i}].z]`));
        assert.equal(h.run(`foes[${i}].statusEffects.some(s => s.type === 'stun' && s.endTime === T0 + 1000)`), true, `sói ${i} choáng 1000 ms`);
        assert.equal(h.run(`hp0[${i}] - foes[${i}].hp`), fork[0].effects.find(e => e.targetIndex === i).damage);
        assert.ok(h.run(`hp0[${i}] - foes[${i}].hp`) > 0);
    }
    assert.deepEqual(json(h, '[foes[1].x, foes[1].z]'), [20, 0]);                       // đã ở sát Mã: không phải kéo
    assert.ok(h.run('foes[2].x > 16 && foes[2].z < 3 && foes[2].z > 0'));               // bị kéo dọc theo đường thẳng về phía Mã
    assert.deepEqual(json(h, 'hits.filter(x => x.by === "chess_knight").map(x => [x.ti, x.mult, x.cc])'), [[1, 1.2, true], [2, 1.2, true]]);
    // 2 con còn lại không sao
    assert.deepEqual(json(h, '[foes[0].x, foes[0].z, foes[3].x, foes[3].z]'), [8, 0, 14, -3]);
    assert.equal(h.run('foes[0].hp === hp0[0] && foes[3].hp === hp0[3]'), true);
    assert.equal(h.run('foes[0].statusEffects.length + foes[3].statusEffects.length'), 0);
    assert.deepEqual(json(h, '[leon.chess.turn.strike, leon.skillCooldowns[1] - T0]'), [1, 600 + 8000]);
    // ---- đối thủ miễn khống chế: không bị kéo, không choáng, vẫn mất máu; trùm đang niệm Phán Quyết: đòn trừ vào khiên niệm ----
    const g = harness();
    arena(g, { foeLevel: 60, foes: [['b_valdric', 20, 0], ['c1_wolf', 16, 3], ['c1_wolf', 17, -2]] });
    g.run(`var kn = put("knight"), bs = put("bishop"); bs.drainNext = 1e15; var boss = foes[0];
        room.stage = { diff: 'hell' }; boss.bossCasts = 3; boss.judgmentReadyAt = room.clock; processJudgment(room, 'p2', 0, 'p1', room.clock);
        foes[1].statusEffects.push({ type: 'giant_form', endTime: T0 + 99999, immuneUntil: T0 + 99999 });
        var s0 = boss.ult.shield, hp0 = foes.map(e => e.hp); cast(1)`);
    assert.ok(g.run('!!boss.ult && ccImmune(boss, room.clock) && ccImmune(foes[1], room.clock)'));
    const f2 = g.fx('fork')[0];
    assert.deepEqual(f2.effects.map(e => e.targetIndex), [0, 2]);                       // 2 đứa gần nhất: trùm (1,2) và sói 2 (2,7); sói 1 cách 4,1
    assert.deepEqual(f2.pulled.map(p => p.targetIndex), [2]);
    assert.deepEqual(json(g, '[boss.x, boss.z, boss.hp === hp0[0], boss.ult.shield < s0]'), [20, 0, true, true]);
    assert.equal(g.run("boss.statusEffects.some(s => s.type === 'stun')"), false);
    // miễn khống chế mà nằm trong 2 đứa gần nhất: mất máu nhưng đứng yên, không choáng
    const k = harness();
    arena(k, { foes: [['c1_wolf', 20, 0], ['c1_wolf', 16, 3]] });
    k.run(`var kn = put("knight"), bs = put("bishop"); bs.drainNext = 1e15;
        foes[1].statusEffects.push({ type: 'giant_form', endTime: T0 + 99999, immuneUntil: T0 + 99999 }); var hp1 = foes[1].hp; cast(1)`);
    assert.deepEqual(k.fx('fork')[0].pulled.map(p => p.targetIndex), [0]);
    assert.deepEqual(json(k, '[foes[1].x, foes[1].z, foes[1].hp < hp1]'), [16, 3, true]);
    assert.equal(k.run("foes[1].statusEffects.some(s => s.type === 'stun' && s.endTime > room.clock)"), false);
});

/** Bàn thử Hút Hồn: Tượng ở (0, 2), Rok ở (8, 0), Ignar ở (9, 3) (đều trong tầm 10 của Tượng). Tượng ra sân lúc T0, 400 ms sau mới hành động */
function drainArena(h, mps) {
    arena(h, { foeHeroes: ['warrior', 'mage'] });
    h.run(`var rok = foe('warrior'), ignar = foe('mage'), RI = foes.indexOf(rok), II = foes.indexOf(ignar);
        Object.assign(rok, { x: 8, z: 0, mp: ${mps[0]} }); Object.assign(ignar, { x: 9, z: 3, mp: ${mps[1]} });
        leon.mp = 2000; var bs = put("bishop", 0, 2), BS = slot("bishop");
        var drain = () => bs.statusEffects.find(e => e.type === 'chess_drain'); var sucks = () => hits.filter(x => x.by === 'chess_bishop');`);
}

test('Hút Hồn: mỗi 12000 ms; anh hùng địch mp 3000 → sau 4000 ms còn 1000, mp của Leon không đổi vì hút; mục tiêu hết Orb giữa chừng → các giây còn lại hút máu ×0.5 M.ATK và Tượng hồi đúng lượng đó; quái (không Orb) → hút máu từ đầu', () => {
    // ---- anh hùng nhiều Orb nhất: mỗi giây mất 0,5 Orb, tổng 2 Orb ----
    const h = harness();
    drainArena(h, [3000, 1000]);
    h.run('upTo(350)');
    assert.equal(h.fx('drain').length, 0);                                    // vừa ra sân: chưa làm gì
    h.run('upTo(400)');
    assert.deepEqual(h.fx('drain'), [{ casterId: 'p1', casterIdx: 0, kind: 'drain', summonIdx: h.run('BS'), targetId: 'p2', targetIndex: h.run('RI'), mode: 'orb', duration: 4000 }]);
    assert.deepEqual(json(h, '(d => [d.targetPid, d.targetIdx, d.endTime - T0, d.next - T0, d.mode])(drain())'), ['p2', h.run('RI'), 4400, 1400, 'orb']);
    assert.equal(h.run('bs.actionUntil - T0'), 4400);                         // đứng yên lúc hút
    for (const [ms, mp] of [[1399, 3000], [1400, 2500], [2399, 2500], [2400, 2000], [3400, 1500], [4399, 1500]]) {
        h.run(`upTo(${ms})`);
        assert.equal(h.run('rok.mp'), mp, `${ms} ms`);
    }
    assert.equal(h.fx('drainEnd').length, 0);
    h.run('upTo(4400)');
    assert.equal(h.run('rok.mp'), 1000);
    const end = h.fx('drainEnd');
    assert.equal(end.length, 1);
    assert.deepEqual([end[0].casterId, end[0].casterIdx, end[0].summonIdx, end[0].targetId, end[0].targetIndex, end[0].mode], ['p1', 0, h.run('BS'), 'p2', h.run('RI'), 'orb']);
    assert.equal(h.run('drain()'), undefined);
    assert.deepEqual(json(h, '[leon.mp, bs.mp, ignar.mp, rok.hp === rok.maxHp, sucks().length]'), [2000, 0, 1000, true, 0]);   // Orb hút được không chuyển cho ai, không gây sát thương
    assert.equal(h.fx('drain').length, 1);
    // lần kế tiếp: 12000 ms sau lần trước
    h.run('upTo(12350)');
    assert.equal(h.fx('drain').length, 1);
    h.run('upTo(12400)');
    assert.equal(h.fx('drain').length, 2);

    // ---- hết Orb giữa chừng: 2 nhịp đầu hút Orb, 2 nhịp sau hút máu (đã đổi thì không đổi lại) ----
    const g = harness();
    drainArena(g, [1000, 0]);
    g.run('bs.hp = 100; upTo(2400)');
    assert.deepEqual(json(g, '[rok.mp, rok.hp === rok.maxHp, bs.hp, drain().mode]'), [0, true, 100, 'hp']);   // vừa hết Orb là đổi sang hút máu
    g.run('upTo(3000); rok.mp = 3000; upTo(3400)');                           // có Orb lại cũng vẫn hút máu
    assert.equal(g.run('drain().mode'), 'hp');
    assert.deepEqual(g.fx('drain').map(e => [e.mode, e.duration]), [['orb', 4000], ['hp', 2000]]);   // báo lại cho máy khách: đổi sang hút máu, còn 2000 ms
    assert.deepEqual(json(g, 'sucks().map(x => [x.ti, x.mult, x.at])'), [[g.run('RI'), 0.5, 3400]]);
    const lost1 = g.run('rok.maxHp - rok.hp');
    assert.ok(lost1 > 0);
    assert.equal(g.run('bs.hp'), 100 + lost1);                                // Tượng hồi đúng lượng máu hút được
    assert.equal(g.run('rok.mp'), 3000);
    g.run('upTo(4400)');
    assert.equal(g.run('sucks().length'), 2);
    assert.equal(g.run('bs.hp'), 100 + g.run('rok.maxHp - rok.hp'));
    assert.deepEqual(g.fx('drainEnd').map(e => e.mode), ['hp']);

    // ---- quái (dù có MP) không có Orb: hút máu từ đầu, đủ 4 nhịp ----
    const k = harness();
    arena(k, { foes: [['c1_wolf', 8, 0]] });
    k.run('foes[0].mp = 1000; var bs = put("bishop", 0, 2); bs.hp = 100; upTo(400)');
    assert.deepEqual(k.fx('drain').map(e => [e.targetIndex, e.mode, e.duration]), [[0, 'hp', 4000]]);
    k.run('upTo(4400)');
    assert.deepEqual(json(k, 'hits.filter(x => x.by === "chess_bishop").map(x => [x.mult, x.at])'), [[0.5, 1400], [0.5, 2400], [0.5, 3400], [0.5, 4400]]);
    assert.equal(k.run('foes[0].mp'), 1000);
    assert.equal(k.run('bs.hp'), 100 + k.run('foes[0].maxHp - foes[0].hp'));
    assert.equal(k.fx('drainEnd').length, 1);
});

test('Hút Hồn: ưu tiên anh hùng địch nhiều Orb nhất trong tầm; bị choáng thì đứt; mục tiêu gục hoặc Tượng gục thì thả', () => {
    // Ignar nhiều Orb hơn -> hút Ignar
    const h = harness();
    drainArena(h, [1000, 2500]);
    h.run('upTo(400)');
    assert.equal(h.fx('drain')[0].targetIndex, h.run('II'));
    // bị choáng lúc đang hút: đứt ngay, không hút tiếp, lần sau vẫn tính 12000 ms từ lúc bắt đầu
    h.run('upTo(1500); applyStun(bs, 1000, room.clock); upTo(1550)');
    assert.equal(h.run('ignar.mp'), 2000);
    assert.equal(h.fx('drainEnd').length, 1);
    assert.equal(h.run('drain()'), undefined);
    assert.equal(h.run('bs.actionUntil <= room.clock'), true);                // không kẹt động tác
    h.run('upTo(6000)');
    assert.equal(h.run('ignar.mp'), 2000);
    assert.equal(h.fx('drain').length, 1);
    h.run('upTo(12400)');
    assert.equal(h.fx('drain').length, 2);
    // người nhiều Orb nhất đứng ngoài tầm của Tượng: hút người nhiều Orb nhất trong tầm
    const g = harness();
    drainArena(g, [1000, 2500]);
    g.run('ignar.x = 30; upTo(400)');
    assert.equal(g.fx('drain')[0].targetIndex, g.run('RI'));
    // mục tiêu gục giữa chừng: thả
    g.run('upTo(1400); kill(rok, foes); upTo(1450)');
    assert.equal(g.fx('drainEnd').length, 1);
    assert.equal(g.run('drain()'), undefined);
    // không anh hùng nào còn đủ 0,5 Orb: bám mục tiêu đang đánh / gần nhất và hút máu
    const k = harness();
    drainArena(k, [400, 0]);
    k.run('upTo(400)');
    assert.deepEqual(k.fx('drain').map(e => [e.targetIndex, e.mode]), [[k.run('RI'), 'hp']]);
    // Tượng gục lúc đang hút: báo thả cho máy khách
    k.run('upTo(1000); kill(bs)');
    assert.equal(k.fx('drainEnd').length, 1);
    k.run('var hp = rok.hp; upTo(5000)');
    assert.equal(k.run('rok.hp'), k.run('hp'));
    assert.equal(k.fx('drainEnd').length, 1);
});

test('Trói Buộc: mục tiêu có công cao nhất; 2000 ms cả hai không hành động; mục tiêu pDef và mDef ×0.70 trong 4000 ms; mục tiêu ccImmune vẫn hành động nhưng vẫn bị ×0.70', () => {
    const h = harness();
    arena(h, { foes: [['c1_wolf', 8, 0], ['c1_wolf', 9, 2], ['c1_wolf', 10, -2]] });
    h.run(`var kn = put("knight"), bs = put("bishop"), BS = slot("bishop"); bs.drainNext = 1e15; leon.chess.turn.strike = 1;   // tới lượt Tượng
        foes[1].pAtk = 999; var def = (i) => { const s = getEffectiveStats(foes[i], room.clock).stats; return [s.pDef, s.mDef]; }; var d0 = def(1);
        var stunned = (m) => m.statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock);
        cast(1)`);
    const d0 = json(h, 'd0');
    assert.deepEqual(h.fx('command'), [{ casterId: 'p1', casterIdx: 0, kind: 'command', wing: 'strike', piece: 'bishop', summonIdx: h.run('BS') }]);
    assert.deepEqual(h.fx('bind'), [{ casterId: 'p1', casterIdx: 0, kind: 'bind', summonIdx: h.run('BS'), targetId: 'p2', targetIndex: 1, duration: 2000 }]);
    assert.equal(h.fx('fork').length, 0);
    // kẻ bị trói: không hành động 2000 ms (choáng), −30% thủ trong 4000 ms
    assert.equal(h.run("foes[1].statusEffects.some(e => e.type === 'stun' && e.endTime === T0 + 2000)"), true);
    assert.deepEqual(json(h, '(b => [b.value, b.endTime - T0, b.debuff])(foes[1].statusEffects.find(e => e.type === "chess_bound"))'), [0.3, 4000, true]);
    assert.deepEqual(json(h, 'def(1)'), [Math.floor(d0[0] * 0.7), Math.floor(d0[1] * 0.7)]);
    assert.equal(h.run('bs.actionUntil - T0'), 2000);                           // Tượng cũng đứng yên 2000 ms
    assert.equal(h.run('foes[0].statusEffects.length + foes[2].statusEffects.length'), 0);
    assert.equal(h.run('foes.every(e => e.hp === e.maxHp)'), true);             // Trói Buộc không gây sát thương
    h.run('at(1999)');
    assert.equal(h.run('stunned(foes[1])'), true);
    h.run('at(2000)');
    assert.equal(h.run('stunned(foes[1])'), false);
    assert.deepEqual(json(h, 'def(1)'), [Math.floor(d0[0] * 0.7), Math.floor(d0[1] * 0.7)]);   // hết trói, còn giảm thủ 2 giây nữa
    h.run('at(3999)');
    assert.deepEqual(json(h, 'def(1)'), [Math.floor(d0[0] * 0.7), Math.floor(d0[1] * 0.7)]);
    h.run('at(4000)');
    assert.deepEqual(json(h, 'def(1)'), d0);
    assert.deepEqual(json(h, '[leon.chess.turn.strike, leon.skillCooldowns[1] - T0]'), [2, 600 + 8000]);
    // ---- mục tiêu miễn khống chế (5 giây đầu Khổng Lồ): không bị trói nhưng vẫn giảm thủ ----
    const g = harness();
    arena(g, { foes: [['c1_wolf', 8, 0], ['c1_wolf', 9, 2]] });
    g.run(`var kn = put("knight"), bs = put("bishop"); bs.drainNext = 1e15; leon.chess.turn.strike = 1; foes[0].pAtk = 999;
        foes[0].statusEffects.push({ type: 'giant_form', endTime: T0 + 99999, immuneUntil: T0 + 99999 });
        var d0 = [getEffectiveStats(foes[0], room.clock).stats.pDef, getEffectiveStats(foes[0], room.clock).stats.mDef]; cast(1)`);
    assert.deepEqual(g.fx('bind').map(e => [e.targetIndex, e.duration]), [[0, 0]]);
    assert.equal(g.run("foes[0].statusEffects.some(e => e.type === 'stun' && e.endTime > room.clock)"), false);
    assert.deepEqual(json(g, '(s => [s.pDef, s.mDef])(getEffectiveStats(foes[0], room.clock).stats)'), [Math.floor(g.run('d0[0]') * 0.7), Math.floor(g.run('d0[1]') * 0.7)]);
    assert.ok(g.run('bs.actionUntil - T0') < 2000);                             // không trói được ai: Tượng không phải đứng 2 giây
    // ---- trùm đang niệm Phán Quyết: không bị trói (đòn khống chế trừ vào khiên niệm), vẫn giảm thủ · triệu hồi không nhận debuff: không dính gì ----
    const k = harness();
    arena(k, { foeLevel: 60, foes: [['b_valdric', 9, 0], ['elem_golem', 9, 3]] });
    k.run(`var kn = put("knight"), bs = put("bishop"); bs.drainNext = 1e15; leon.chess.turn.strike = 1; var boss = foes[0], golem = foes[1]; golem.summon = true;
        room.stage = { diff: 'hell' }; boss.bossCasts = 3; boss.judgmentReadyAt = room.clock; processJudgment(room, 'p2', 0, 'p1', room.clock);
        var s0 = boss.ult.shield; cast(1)`);
    assert.equal(k.fx('bind')[0].targetIndex, 0);
    assert.deepEqual(json(k, "[!!boss.ult, boss.ult.shield < s0, boss.statusEffects.some(e => e.type === 'stun'), boss.statusEffects.some(e => e.type === 'chess_bound')]"), [true, true, false, true]);
    k.run('leon.skillCooldowns = [0, 0, 0]; leon.actionUntil = 0; leon.chess.turn.strike = 1; boss.alive = false; cast(1)');
    assert.equal(k.fx('bind')[1].targetIndex, 1);
    assert.equal(k.run('golem.statusEffects.length'), 0);
});

test('Nước cờ công trong vòng lặp trận thật: −1 Orb, hồi 8 s, luân phiên Mã (Chiếu Đôi) → Tượng (Trói Buộc); lúc bị trói cả Tượng lẫn mục tiêu không đánh', () => {
    const h = harness();
    arena(h, { foes: [['c1_wolf', 2.2, 0]] });   // sói đứng sát Leon, cắn Leon mỗi giây
    h.run(`leon.mpSec = 0; leon.mpAtk = 0; leon.mp = 2000; leon.hp = leon.maxHp = 1e6;
        var kn = put("knight", 0.5, 0), bs = put("bishop", -6, 0), wolf = foes[0]; wolf.hp = wolf.maxHp = 1e6; bs.drainNext = 1e15;
        var modesUsed = () => room.__ev;`);
    const tick = realLoop(h);
    const used = () => h.events.filter(e => e.name === 'skillExecuted' && e.data.casterId === 'p1').map(e => [e.data.mode, e.data.piece]);
    h.run('leon.queuedSkills = [1]');
    tick(1);
    h.run('var t1 = room.clock');
    assert.deepEqual(used(), [['strikeMove', 'knight']]);
    assert.equal(h.run('leon.mp'), 1000);
    assert.equal(h.run('leon.skillCooldowns[1] - t1'), 600 + 8000);
    assert.equal(h.fx('fork').length, 1);
    assert.equal(h.run('wolf.state'), 'stunned');
    // bấm tiếp khi đang hồi: chờ đủ 8 giây mới tới lượt Tượng
    h.run('leon.queuedSkills = [1]');
    tick(160);
    assert.deepEqual(used(), [['strikeMove', 'knight']]);
    assert.equal(h.run('leon.mp'), 1000);
    for (let n = 0; n < 20 && !h.fx('bind').length; n++) tick(1);   // hết hồi (8 giây + thời gian diễn) là ra ngay
    assert.equal(h.run('room.clock - t1') <= 600 + 8000 + 100, true);
    assert.deepEqual(used(), [['strikeMove', 'knight'], ['strikeMove', 'bishop']]);
    assert.equal(h.run('leon.mp'), 0);
    assert.deepEqual(h.fx('bind').map(e => [e.targetIndex, e.duration]), [[0, 2000]]);
    h.run('var t2 = room.clock, wolfLast = wolf.lastAttackTime, bsLast = bs.lastAttackTime');
    tick(38);   // 1900 ms sau: cả hai vẫn đứng yên
    assert.deepEqual(json(h, '[wolf.state, bs.state, wolf.lastAttackTime === wolfLast, bs.lastAttackTime === bsLast]'), ['stunned', 'acting', true, true]);
    tick(42);   // hết trói: cả hai đánh lại
    assert.equal(h.run('wolf.lastAttackTime > t2 + 1900 && bs.lastAttackTime > t2 + 1900'), true);
});

// Bảng sự kiện chessFx (hợp đồng với máy khách — plan + 2 kind bổ sung pawnGuard, drainTick): kind -> các trường phải có (ngoài casterId, casterIdx)
const CHESS_FX = { summon: ['piece', 'summonIdx', 'x', 'z'], command: ['wing', 'piece', 'summonIdx'], pawnSlash: ['summonIdx', 'effects'], castle: ['summonIdx', 'allyIdx'],
    knightJump: ['summonIdx', 'x', 'z', 'effects'], fork: ['summonIdx', 'pulled', 'effects'], drain: ['summonIdx', 'targetId', 'targetIndex', 'mode', 'duration'],
    drainEnd: ['summonIdx', 'targetId', 'targetIndex', 'mode', 'duration'], bind: ['summonIdx', 'targetId', 'targetIndex', 'duration'],
    pawnGuard: ['summonIdx', 'x', 'z', 'targets'], drainTick: ['summonIdx', 'targetId', 'targetIndex', 'mode', 'effects'],
    crown: ['summonIdx', 'targets', 'duration'], judgeStart: ['summonIdx', 'duration', 'targets'], judgeSlam: ['summonIdx', 'x', 'z', 'effects'],
    orb: ['id', 'x', 'z', 'duration'], orbTick: ['id', 'effects'], orbGone: ['id'], dance: ['summonIdx', 'recalled', 'shots'],
    board: ['king', 'queen'], promote: ['from', 'to', 'piece', 'summonIdx'], sacrifice: ['piece'], checkmate: ['kingIdx', 'queenIdx', 'lift', 'effects'] };

test('trận AUTO thật có Leon (hạt giống cố định): chạy hết không lỗi, trạng thái luôn hợp lệ, mọi sự kiện chessFx đúng bảng', () => {
    const seen = new Set();
    const setups = [   // [hạt giống, cấp, bậc, đội trái, đội phải (anh hùng) hoặc quái]
        [3, 60, 3, ['chessmaster', 'warrior', 'priest', 'reaper'], ['chessmaster', 'wrestler', 'dancer', 'voidmage'], null],
        [11, 1, 0, ['chessmaster', 'archer', 'summoner', 'mage'], ['assassin', 'warrior', 'elementalist', 'priest'], null],
        [29, 40, 1, ['chessmaster', 'warrior', 'priest'], null, [{ classId: 'b_valdric', x: 25, z: 0, boss: true }, { classId: 'c1_fire', x: 28, z: -3 }, { classId: 'c2_wisp', x: 32, z: 3 }]],
        [42, 20, 0, ['chessmaster'], null, [{ classId: 'c1_wolf', x: 12, z: 0 }, { classId: 'c1_spy', x: 20, z: 2 }, { classId: 'c1_goblin', x: 14, z: -2 }]],
    ];
    for (const [seed, level, rank, left, right, monsters] of setups) {
        const h = harness();
        h.run(`(function () { let s = ${seed}; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
            var mk = (side, list) => createSquad(side, SQUAD_ORDER.filter(c => !list.includes(c)), Object.fromEntries(list.map(c => [c, { level: ${level}, rank: ${rank} }])));
            var room = { id: 'fixture', mode: ${monsters ? "'test'" : "'duel_hero'"}, status: 'active', clock: 100000, speed: 1.5, winner: null, stage: { diff: 'hell' }, stageApplied: true,
                players: { p1: { side: 'left', autoMode: true, squad: mk('left', ${JSON.stringify(left)}) },
                    p2: { side: 'right', isNPC: true, autoMode: true, squad: ${monsters ? `createMonsterSquad(${level}, ${JSON.stringify(monsters)}, { mul: 1.2, bossHp: 3 })` : `mk('right', ${JSON.stringify(right)})`} } } };
            rooms.fixture = room; curRoom = room;
            var broken = () => { for (const [pid, t] of Object.entries(room.players)) { const kinds = {};
                for (const m of t.squad) {
                    for (const k of ['x', 'z', 'hp', 'mp', 'maxHp', 'pAtk', 'mAtk', 'pDef', 'mDef']) if (!Number.isFinite(m[k] ?? 0)) return pid + ':' + m.classId + ' ' + k + '=' + m[k];
                    if (m.hp < 0 || m.hp > m.maxHp + 1) return pid + ':' + m.classId + ' máu ' + m.hp + '/' + m.maxHp;
                    if (m.chessKind && m.alive) { const key = m.ownerIdx + m.chessKind; if (kinds[key]) return pid + ': 2 quân ' + m.chessKind + ' cùng lúc'; kinds[key] = 1;
                        if (t.squad[m.ownerIdx]?.classId !== 'chessmaster') return pid + ': quân cờ không có chủ';
                        const d = m.statusEffects.find(e => e.type === 'chess_drain'); if (d && room.clock > d.endTime + 400) return pid + ': Tượng kẹt Hút Hồn'; }
                    if (m.classId === 'chessmaster' && m.alive) {
                        if (m.skills.some(s => !CHESS_MODES[s.mode])) return pid + ': nút không có chế độ';
                        if (m.queuedSkills.some(k => m.skills[k].locked)) return pid + ': lệnh bấm nút khoá còn nằm trong hàng đợi';
                    }
                } } return ''; }`);
        const tick = realLoop(h);
        for (let i = 0; i < 2400 && !h.run('room.winner'); i++) {   // tối đa 120 giây trận
            tick(1);
            assert.equal(h.run('broken()'), '', `hạt giống ${seed}, nhịp ${i}`);
        }
        for (const d of h.fx()) {
            assert.ok(CHESS_FX[d.kind], `kind lạ: ${d.kind}`);
            for (const f of ['casterId', 'casterIdx', ...CHESS_FX[d.kind]]) assert.ok(d[f] !== undefined && d[f] !== null, `${d.kind}.${f} (hạt giống ${seed})`);
            seen.add(d.kind);
        }
    }
    // Leon thật sự gọi quân và ra nước cờ trong trận AUTO, quân tự dùng chiêu
    for (const kind of ['summon', 'command', 'pawnSlash', 'knightJump', 'drain', 'drainEnd', 'drainTick', 'board', 'sacrifice', 'crown', 'orb', 'orbTick']) assert.ok(seen.has(kind), `chưa thấy ${kind} — đã thấy: ${[...seen]}`);
});

// ============================================================
// B4 — quân chúa: Vua (Vương Miện, Phán Quyết)
// ============================================================
const STATS = `var def = (m) => { const s = getEffectiveStats(m, room.clock).stats; return [s.pDef, s.mDef]; };
    var eff = (m, type) => m.statusEffects.find(e => e.type === type && e.endTime > room.clock);
    var hitKing = (k, dmg) => dealDamage(k, dmg || 10, room.players.p1, 0, null, foes[0], { isMiss: false });`;

test('Gọi Vua: cần cánh thủ đã từng đủ, tốn 3 Orb; nút 3 thành kingSkill (2 Orb, hồi 12000)', () => {
    const h = harness();
    arena(h);
    h.run('put("pawn")');
    assert.equal(h.run('modes()[2]'), 'locked');
    h.run('put("rook")');
    assertButton(h, 2, 'king');
    assert.equal(h.run('skillCostOf(leon, 2, room.clock)'), 3000);
    h.run('cast(2); at(300)');
    assert.equal(h.run('piece("king").classId'), 'chess_king');
    assertButton(h, 2, 'kingSkill');
    assert.deepEqual(json(h, '[skillCostOf(leon, 2, room.clock), leon.skills[2].cooldown, skillUsable(leon, 2), leon.skills[2].ready === undefined]'), [2000, 12000, true, true]);
});

test('Vương Miện: mỗi 15000 ms; mọi đồng đội trừ Vua: pDef và mDef ×1.15, khiên = pDef + mDef của Vua, 8000 ms; Tốt và Xe: ×1.30 và khiên gấp đôi; Vua không có', () => {
    const h = harness();
    arena(h, { allies: ['archer'] });
    h.run(STATS + `var lyra = ally('archer'), pw = put("pawn"), rk = put("rook"), kn = put("knight"), kg = put("king"), KS = slot("king");
        var who = { lyra, leon, pw, rk, kn, kg }, d0 = Object.fromEntries(Object.entries(who).map(([k, m]) => [k, def(m)])); upTo(350)`);
    assert.equal(h.fx('crown').length, 0);
    h.run('upTo(400)');   // Vua ra sân xong là đội vương miện lần đầu
    const crown = h.fx('crown');
    assert.equal(crown.length, 1);
    assert.deepEqual([crown[0].casterId, crown[0].casterIdx, crown[0].summonIdx, crown[0].duration], ['p1', h.run('LI'), h.run('KS'), 8000]);
    assert.deepEqual(crown[0].targets.sort(), json(h, 'team.map((m, i) => i).filter(i => team[i] !== kg)').sort());
    const d0 = json(h, 'd0'), shield = 240 + 220;
    for (const [k, mult] of [['lyra', 1], ['leon', 1], ['kn', 1], ['pw', 2], ['rk', 2]]) {
        const c = json(h, `eff(who.${k}, 'chess_crown')`);
        assert.deepEqual([c.hp, c.maxHp, c.x2, c.endTime - h.run('T0')], [shield * mult, shield * mult, mult === 2, 8400], k);
        assert.ok(Math.abs(c.defUp - 0.15 * mult) < 1e-9);
        assert.deepEqual(json(h, `def(who.${k})`), d0[k].map(v => Math.floor(v * (1 + 0.15 * mult))), k);
        assert.equal(h.run(`activeShield(who.${k}, room.clock).type`), 'chess_crown');
    }
    assert.equal(h.run("eff(kg, 'chess_crown')"), undefined);
    assert.deepEqual(json(h, 'def(kg)'), d0.kg);
    h.run('upTo(8399)');
    assert.deepEqual(json(h, 'def(lyra)'), d0.lyra.map(v => Math.floor(v * 1.15)));
    h.run('upTo(8400)');
    assert.deepEqual(json(h, '[def(lyra), def(pw), activeShield(lyra, room.clock)]'), [d0.lyra, d0.pw, null]);
    h.run('upTo(15350)');
    assert.equal(h.fx('crown').length, 1);
    h.run('upTo(15400)');
    assert.equal(h.fx('crown').length, 2);
});

test('Vương Miện hồi máu: Vua bị đánh trúng → ai còn khiên vương miện hồi 2% maxHp (Tốt, Xe 4%); 5 cú trong 1 giây chỉ hồi 2 lần', () => {
    const h = harness();
    arena(h, { allies: ['archer'] });
    h.run(STATS + `var lyra = ally('archer'), pw = put("pawn"), rk = put("rook"), kg = put("king"); kg.hp = kg.maxHp = 1e6; upTo(400);
        for (const m of [lyra, pw, leon]) m.hp = Math.round(m.maxHp * 0.5);
        eff(leon, 'chess_crown').hp = 0;   // khiên vương miện của Leon đã vỡ
        var h0 = () => [lyra.hp, pw.hp, leon.hp], a = h0(); hitKing(kg)`);
    const a = json(h, 'a'), up = [Math.round(h.run('lyra.maxHp') * 0.02), Math.round(h.run('pw.maxHp') * 0.04)];
    assert.deepEqual(json(h, 'h0()'), [a[0] + up[0], a[1] + up[1], a[2]]);
    h.run('at(600); hitKing(kg); at(700); hitKing(kg); at(800); hitKing(kg); at(900); hitKing(kg)');   // 5 cú trong 1 giây: chỉ 2 lần hồi
    assert.deepEqual(json(h, 'h0()'), [a[0] + up[0] * 2, a[1] + up[1] * 2, a[2]]);
    h.run('at(1700); hitKing(kg)');
    assert.deepEqual(json(h, 'h0()'), [a[0] + up[0] * 3, a[1] + up[1] * 3, a[2]]);
    h.run('at(2800); hitKing(rk)');   // quân khác bị đánh: không ai hồi
    assert.deepEqual(json(h, 'h0()'), [a[0] + up[0] * 3, a[1] + up[1] * 3, a[2]]);
    h.run('at(8500); hitKing(kg)');   // hết vương miện: không hồi nữa
    assert.deepEqual(json(h, 'h0()'), [a[0] + up[0] * 3, a[1] + up[1] * 3, a[2]]);
});

test('Phán Quyết: niệm 3000 ms, vừa niệm là MỌI đối thủ trên sân bị khiêu khích về Vua 3000 ms; applyStun không ngắt; mất 500 máu lúc niệm → cú chém = ×2.0 P.ATK + 500 (trần 30% maxHp của Vua), vùng dài 7 rộng 5 trước mặt, hất tung 1000 ms', () => {
    for (const [lost, bonus] of [[500, 500], [2000, 1260]]) {
        const h = harness();
        // Vua ở (10, 0) nhìn về +x. Trong vùng: sói 0 (13, 0), sói 1 (16.9, 2.4) · ngoài: sói 2 (17.5, 0) quá dài, sói 3 (13, 3) quá rộng, sói 4 (8, 0) sau lưng
        arena(h, { foes: [['c1_wolf', 13, 0], ['c1_wolf', 16.9, 2.4], ['c1_wolf', 17.5, 0], ['c1_wolf', 13, 3], ['c1_wolf', 8, 0]] });
        h.run(STATS + `put("pawn"); put("rook"); var kg = put("king", 10, 0), KS = slot("king"); kg.crownNext = 1e15; var hp0 = foes.map(e => e.hp); cast(2)`);
        assert.deepEqual(h.fx('judgeStart'), [{ casterId: 'p1', casterIdx: 0, kind: 'judgeStart', summonIdx: h.run('KS'), duration: 3000, targetId: 'p2', targets: [0, 1, 2, 3, 4] }]);
        // cả 5 con sói (trong vùng chém lẫn ngoài vùng, kể cả con sau lưng) đều bị khiêu khích về phía Vua đúng 3000 ms
        assert.deepEqual(json(h, "foes.map(e => { const t = e.statusEffects.find(x => x.type === 'taunted'); return t ? [t.endTime - T0, t.duration, t.sourceIndex, !!t.debuff, e.lockedTargetIndex] : null; })"),
            [0, 1, 2, 3, 4].map(() => [3000, 3000, h.run('KS'), true, -1]));
        assert.deepEqual(json(h, "[eff(kg, 'chess_judging').endTime - T0, eff(kg, 'chess_judging').stored, kg.actionUntil - T0 >= 3000, ccImmune(kg, room.clock)]"), [3000, 0, true, true]);
        assert.deepEqual(json(h, '[leon.skillCooldowns[2] - T0, skillUsable(leon, 2)]'), [600 + 12000, false]);   // đang niệm: không bấm lại được
        // bị choáng lúc niệm: không ngắt; bị đánh vẫn mất máu, tích lại
        h.run(`at(1000); applyStun(kg, 1000, room.clock); kg.statusEffects.push({ type: 'stun', endTime: room.clock + 2000 }); hitKing(kg, ${lost}); at(1050)`);
        assert.equal(h.run("kg.statusEffects.some(e => e.type === 'stun')"), false);
        assert.equal(h.run('kg.maxHp - kg.hp'), lost);
        h.run('at(2999)');
        assert.equal(h.fx('judgeSlam').length, 0);
        h.run('at(3000)');
        const slam = h.fx('judgeSlam');
        assert.equal(slam.length, 1);
        assert.deepEqual([slam[0].summonIdx, slam[0].x, slam[0].z], [h.run('KS'), 10, 0]);
        assert.deepEqual(slam[0].effects.map(e => e.targetIndex).sort(), [0, 1]);
        const mine = json(h, 'hits.filter(x => x.by === "chess_king")');
        assert.equal(mine.length, 2);
        for (const x of mine) { assert.ok(Math.abs(x.mult - (2 + bonus / 210)) < 1e-9, `hệ số ${x.mult}`); assert.equal(x.at, 3000); }
        for (const i of [0, 1]) {
            assert.equal(h.run(`foes[${i}].statusEffects.some(e => e.type === 'knockup' && e.endTime === T0 + 4000)`), true);
            assert.ok(h.run(`foes[${i}].hp < hp0[${i}]`));
        }
        for (const i of [2, 3, 4]) assert.equal(h.run(`foes[${i}].hp === hp0[${i}] && foes[${i}].statusEffects.every(e => e.type === 'taunted')`), true, `sói ${i} ngoài vùng: chỉ bị khiêu khích`);
        assert.equal(h.run("eff(kg, 'chess_judging')"), undefined);
        assert.equal(h.run('ccImmune(kg, room.clock)'), false);
    }
    // Vua gục lúc đang niệm: không chém
    const g = harness();
    arena(g, { foes: [['c1_wolf', 13, 0]] });
    g.run('put("pawn"); put("rook"); var kg = put("king", 10, 0); kg.crownNext = 1e15; cast(2); at(1000); kill(kg); at(4000)');
    assert.equal(g.fx('judgeSlam').length, 0);
    assert.equal(g.run('foes[0].hp'), g.run('foes[0].maxHp'));
});

test('Phán Quyết khiêu khích: đối thủ miễn khống chế / triệu hồi không nhận debuff / đã gục không dính; trong vòng lặp trận thật sói bỏ mục tiêu gần để đánh Vua; Vua tự dùng (có cả Vua và Hậu) cũng khiêu khích', () => {
    const h = harness();
    // 0: sói thường (xa 30 ô vẫn dính) · 1: sói miễn khống chế · 2: Golem (triệu hồi không nhận debuff) · 3: sói đã gục · 4: sói thường
    arena(h, { foes: [['c1_wolf', 40, 0], ['c1_wolf', 13, 0], ['elem_golem', 14, 2], ['c1_wolf', 12, -2], ['c1_wolf', 13, 3]] });
    h.run(`foes[1].statusEffects.push({ type: 'giant_form', endTime: T0 + 99999, immuneUntil: T0 + 99999 }); foes[2].summon = true; kill(foes[3], foes);
        put("pawn"); put("rook"); var kg = put("king", 10, 0), KS = slot("king"); kg.crownNext = 1e15; cast(2)`);
    assert.equal(h.run('ccImmune(foes[1], room.clock) && !takesDebuffs(foes[2])'), true);
    assert.deepEqual(h.fx('judgeStart')[0].targets, [0, 4]);
    assert.deepEqual(json(h, "foes.map(e => e.statusEffects.some(x => x.type === 'taunted'))"), [true, false, false, false, true]);
    // vòng lặp trận thật: sói đang cắn Leon đứng ngay cạnh, Vua niệm thì nó quay sang đánh Vua
    const r = harness();
    arena(r, { foes: [['c1_wolf', 2, 0]] });
    r.run('put("pawn", -20, 5); put("rook", -20, -5); var kg = put("king", 12, 0), KS = slot("king"); kg.crownNext = 1e15; kg.hp = kg.maxHp = 1e6; leon.hp = leon.maxHp = 1e6');
    const tick = realLoop(r);
    tick(30);
    assert.equal(r.run('foes[0].targetIndex'), r.run('LI'));     // gần Leon nhất -> đang đánh Leon
    r.run('leon.queuedSkills = [2]');
    tick(2);
    assert.equal(r.fx('judgeStart').length, 1);
    assert.deepEqual(r.fx('judgeStart')[0].targets, [0]);
    tick(20);    // 1 giây sau: sói đã bỏ Leon, chạy về phía Vua
    assert.equal(r.run('foes[0].targetIndex'), r.run('KS'));
    // có cả Vua và Hậu: Vua tự dùng Phán Quyết -> cũng khiêu khích
    const a = harness();
    arena(a, { foes: [['c1_wolf', 13, 0], ['c1_wolf', 30, 4]] });
    a.run('put("pawn"); put("rook"); var kg = put("king", 10, 0); var qn = put("queen", 0, 0); kg.crownNext = qn.orbNext = 1e15; upTo(200)');
    assert.equal(a.fx('judgeStart').length, 1);
    assert.deepEqual(a.fx('judgeStart')[0].targets, [0, 1]);
    assert.equal(a.run("foes.every(e => e.statusEffects.some(x => x.type === 'taunted' && x.sourceIndex === slot('king')))"), true);
});

// ============================================================
// B5 — quân chúa: Hậu (Quang Cầu, Vũ Điệu Quang Cầu)
// ============================================================
test('Quang Cầu: 1 quả mỗi 3000 ms, sống 10000 ms, vị trí nằm trong hộp bao các đối thủ còn sống; mỗi 1000 ms ×0.35 lên đối thủ trong bán kính 2.5; 2 quả chồng nhau → 2 lần sát thương; choáng nhẹ 200 ms nhiều nhất 1 lần / 1500 ms / mục tiêu; mục tiêu ccImmune không choáng, vẫn mất máu', () => {
    const h = harness();
    // hộp bao: x 10..14, z −2.5..2 -> với Math.random = 0.5 quả cầu rơi ở (12, −0.25): trúng cọc 0, 2, 3 (cách ≤ 2.5), không trúng cọc 1 (cách 3)
    arena(h, { foes: [['monster_dummy', 10, 0], ['monster_dummy', 14, 2], ['monster_dummy', 12, -2.5], ['monster_dummy', 12, 0]] });
    h.run(`var qn = put("queen"), QSL = slot("queen"), orbs = () => room.players.p1.chessOrbs || [];
        foes[3].statusEffects.push({ type: 'giant_form', endTime: T0 + 99999, immuneUntil: T0 + 99999 });
        var stun = (i) => foes[i].statusEffects.find(e => e.type === 'stun' && e.endTime > room.clock); var by = (ms) => hits.filter(x => x.by === 'chess_queen' && x.at === ms);
        upTo(2950)`);
    assert.equal(h.fx('orb').length, 0);
    h.run('upTo(3000)');
    const o1 = h.fx('orb');
    assert.equal(o1.length, 1);
    assert.deepEqual([o1[0].casterId, o1[0].casterIdx, o1[0].x, o1[0].z, o1[0].duration], ['p1', 0, 12, -0.25, 10000]);
    assert.deepEqual(json(h, 'orbs().map(o => [o.id, o.ownerSlot, o.x, o.z, o.endTime - T0, o.next - T0])'), [[o1[0].id, h.run('QSL'), 12, -0.25, 13000, 4000]]);
    h.run('upTo(3950)');
    assert.equal(h.fx('orbTick').length, 0);
    h.run('upTo(4000)');
    const t1 = h.fx('orbTick');
    assert.equal(t1.length, 1);
    assert.equal(t1[0].id, o1[0].id);
    assert.deepEqual(t1[0].effects.map(e => e.targetIndex).sort(), [0, 2, 3]);
    assert.deepEqual(json(h, 'by(4000).map(x => [x.mult, x.aoe])'), [[0.35, true], [0.35, true], [0.35, true]]);
    assert.deepEqual(json(h, '[stun(0).endTime - T0, stun(2).endTime - T0, !!stun(3), !!stun(1)]'), [4200, 4200, false, false]);   // miễn khống chế: không choáng, vẫn mất máu
    assert.ok(h.run('foes[3].hp < foes[3].maxHp && foes[1].hp === foes[1].maxHp'));
    h.run('upTo(5000)');   // nhịp 2: vẫn mất máu, chưa được choáng lại (mới 1000 ms)
    assert.equal(h.run('by(5000).length'), 3);
    assert.equal(h.run('!!stun(0)'), false);
    h.run('upTo(6000)');   // nhịp 3: đã quá 1500 ms -> choáng lại; quả thứ 2 rơi (cùng chỗ)
    assert.equal(h.run('stun(0).endTime - T0'), 6200);
    assert.equal(h.fx('orb').length, 2);
    h.run('upTo(7000)');   // 2 quả chồng nhau: mỗi đối thủ ăn 2 lần
    assert.equal(h.run('by(7000).length'), 6);
    assert.deepEqual(json(h, 'by(7000).filter(x => x.ti === 0).length'), 2);
    h.run('upTo(12950)');
    assert.equal(h.fx('orbGone').length, 0);
    h.run('upTo(13000)');
    assert.deepEqual(h.fx('orbGone').map(e => e.id), [o1[0].id]);
    assert.equal(h.fx('orbTick').filter(e => e.id === o1[0].id).length, 10);
    assert.equal(h.run('orbs().length'), 3);   // quả rơi ở 6000, 9000, 12000 còn sống
});

test('Vũ Điệu Quang Cầu: đang có 3 quả → sau 1000 ms niệm, 3 quả cũ biến mất, bắn 5 phát; đang có 0 quả → bắn 2; mỗi phát ×0.9 rồi thành 1 quả mới 10000 ms ở chỗ mục tiêu', () => {
    for (const have of [3, 0]) {
        const h = harness();
        arena(h, { foes: [['monster_dummy', 10, 0], ['monster_dummy', 14, 2], ['monster_dummy', 12, -2.5]] });
        h.run(`put("knight"); var bs = put("bishop"); bs.drainNext = 1e15; var qn = put("queen"), QSL = slot("queen"), orbs = () => room.players.p1.chessOrbs || [];
            upTo(${have * 3000}); var old = orbs().map(o => o.id), t = room.clock - T0; leon.actionUntil = 0; cast(2)`);
        assert.equal(h.run('old.length'), have);
        const t = h.run('t'), dance = h.fx('dance');
        assert.equal(dance.length, 1);
        assert.deepEqual([dance[0].casterId, dance[0].casterIdx, dance[0].summonIdx, dance[0].recalled], ['p1', 0, h.run('QSL'), json(h, 'old')]);
        assert.equal(dance[0].shots.length, have + 2);
        assert.equal(h.run('orbs().length'), 0);                                // quả cũ đã được thu về
        assert.equal(h.run('qn.actionUntil - T0 >= t + 1000'), true);
        const shots = json(h, `hits.filter(x => x.by === 'chess_queen' && x.at === ${t} && x.mult === 0.9)`);
        assert.deepEqual(shots.map(x => [x.mult, x.delay]), Array(have + 2).fill([0.9, 1000]));
        assert.deepEqual(shots.map(x => x.ti), dance[0].shots.map(s => s.targetIndex));
        h.run(`var hp = foes.map(e => e.hp); upTo(${t + 950})`);
        assert.equal(h.fx('orb').length, have);
        h.run(`upTo(${t + 1000})`);
        const fresh = h.fx('orb').slice(have);
        assert.deepEqual(fresh.map(o => [o.id, o.x, o.z, o.duration]), dance[0].shots.map(s => [s.id, s.x, s.z, 10000]));
        for (const s of dance[0].shots) assert.deepEqual([s.x, s.z], json(h, `[foes[${s.targetIndex}].x, foes[${s.targetIndex}].z]`));
        assert.deepEqual(json(h, 'orbs().map(o => o.endTime - T0)'), Array(have + 2).fill(t + 11000));
        assert.ok(h.run('foes.reduce((n, e, i) => n + hp[i] - e.hp, 0)') > 0);
        assert.equal(h.run('leon.skillCooldowns[2] - T0'), t + 600 + 12000);
    }
});

// ============================================================
// B6 — bàn cờ, Thí Quân, Phong Cấp, Chiếu Tướng, AUTO + các sửa bổ sung
// ============================================================
test('Bàn cờ: có Vua → mọi thành viên phe đó nhận ×0.85; có Hậu → quân cờ sát thương ×1.20 và tốc đánh +20%; không còn quân chúa → hết; phát chessFx board khi đổi', () => {
    const h = harness();
    arena(h, { allies: ['archer'], foes: [['c1_wolf', 20, 0]] });
    h.run(TAKEN + `var lyra = ally('archer'), pw = put("pawn"), wolf = foes[0];
        var spd = (m) => getEffectiveStats(m, room.clock).stats.atkSpeed;
        var base = { lyra: taken(wolf, lyra), pw: taken(wolf, pw), out: taken(pw, wolf), outLeon: taken(leon, wolf), spd: spd(pw), spdLeon: spd(leon) }; at(100)`);
    const b = json(h, 'base');
    assert.equal(h.fx('board').length, 0);
    assert.deepEqual(json(h, 'chessBoard(room.players.p1)'), { king: false, queen: false });
    h.run('var kg = put("king"); kg.crownNext = 1e15; at(200)');
    assert.deepEqual(h.fx('board').map(e => [e.casterId, e.king, e.queen]), [['p1', true, false]]);
    assert.ok(Math.abs(h.run('taken(wolf, lyra)') - b.lyra * 0.85) <= 1);
    assert.ok(Math.abs(h.run('taken(wolf, pw)') - b.pw * 0.85) <= 1);
    assert.deepEqual(json(h, '[taken(pw, wolf), spd(pw)]'), [b.out, b.spd]);           // chỉ có Vua: quân không mạnh thêm
    h.run('var qn = put("queen"); qn.orbNext = 1e15; at(300)');
    assert.deepEqual(h.fx('board').at(-1).king && h.fx('board').at(-1).queen, true);
    assert.ok(Math.abs(h.run('taken(pw, wolf)') - b.out * 1.2) <= 1);
    assert.equal(h.run('spd(pw)'), Math.floor(b.spd / 1.2));
    assert.deepEqual(json(h, '[taken(leon, wolf), spd(leon), taken(wolf, pw) < ' + b.pw + ']'), [b.outLeon, b.spdLeon, true]);   // anh hùng không được phần của Hậu
    h.run('kill(kg); at(400)');
    assert.deepEqual([h.fx('board').at(-1).king, h.fx('board').at(-1).queen], [false, true]);
    assert.equal(h.run('taken(wolf, lyra)'), b.lyra);
    h.run('kill(qn); at(500)');
    assert.deepEqual([h.fx('board').at(-1).king, h.fx('board').at(-1).queen], [false, false]);
    assert.equal(h.fx('board').length, 4);
    assert.deepEqual(json(h, '[taken(pw, wolf), spd(pw)]'), [b.out, b.spd]);
});

test('Thí Quân: quân chết → mỗi đồng đội khiên 6% / 8% / 10% maxHp của mình 5000 ms; Leon mp +500; mức 0 không có gì', () => {
    for (const [level, rank, value] of [[20, 0, 0.06], [20, 2, 0.08], [20, 3, 0.10], [19, 0, 0]]) {
        const h = harness();
        arena(h, { level, rank, allies: ['archer'] });
        h.run(`var lyra = ally('archer'), pw = put("pawn"), rk = put("rook"); leon.mp = 1000; at(1000); kill(pw)`);
        const sh = json(h, "[lyra, leon, rk, pw].map(m => { const s = m.statusEffects.find(e => e.type === 'chess_sacrifice'); return s ? [s.hp, s.endTime - T0, Math.round(m.maxHp * " + value + ")] : null; })");
        if (!value) {
            assert.deepEqual(sh, [null, null, null, null]);
            assert.equal(h.run('leon.mp'), 1000);
            assert.equal(h.fx('sacrifice').length, 0);
            continue;
        }
        for (const s of sh.slice(0, 3)) assert.deepEqual([s[0], s[1]], [s[2], 6000]);
        assert.equal(sh[3], null);                                               // quân vừa chết không có khiên
        assert.equal(h.run('activeShield(lyra, room.clock).type'), 'chess_sacrifice');
        assert.equal(h.run('leon.mp'), 1500);
        assert.deepEqual(h.fx('sacrifice'), [{ casterId: 'p1', casterIdx: h.run('LI'), kind: 'sacrifice', piece: 'pawn' }]);
    }
});

test('Phong Cấp: có Vua (ghế Hậu trống) + TỐT sống 12000 ms (mức 2: 10000) kể từ max(lúc Vua ra, lúc Tốt ra, lúc ghế trống) → Tốt thành chess_queen đủ chỉ số; có Hậu (ghế Vua trống) + MÃ sống đủ → Mã thành chess_king; ô quân vừa phong trống, gọi lại được; nút 3 thành checkmate với skillCooldowns[2] ≤ now; ghế trống lại → phong tiếp', () => {
    for (const [level, rank, wait] of [[40, 1, 12000], [60, 3, 10000]]) {
        const h = harness();
        arena(h, { level, rank });
        assert.equal(h.run("talentOf(leon, 'chess_promote').value"), wait);
        // có sẵn Mã từ đầu: đang có VUA thì Mã KHÔNG được phong (ghế Vua không trống), chỉ Tốt lên Hậu
        h.run('var pw = put("pawn"), rk = put("rook"), kn = put("knight"), PS = slot("pawn"), NS = slot("knight"); at(1000); var kg = put("king"); kg.crownNext = 1e15; at(1000)');
        h.run(`upTo(${1000 + wait - 50})`);
        assert.equal(h.fx('promote').length, 0);
        assert.equal(h.run('team[PS].classId'), 'chess_pawn');
        h.run(`upTo(${1000 + wait})`);
        assert.deepEqual(h.fx('promote'), [{ casterId: 'p1', casterIdx: 0, kind: 'promote', from: h.run('PS'), to: 'queen', piece: 'pawn', summonIdx: h.run('PS') }]);
        const q = json(h, 'team[PS]');
        assert.deepEqual([q.classId, q.chessKind, q.name, q.alive, q.maxHp, q.hp, q.mAtk, q.pAtk, q.atkRange, q.ownerIdx],
            ['chess_queen', 'queen', 'Hậu', true, 1400 + 90 * (level - 1), 1400 + 90 * (level - 1), 230 + 13 * (level - 1), 0, 11, 0]);
        assert.equal(h.run('pw.alive'), false);                                    // Tốt cũ không còn trên sân
        assert.equal(h.run('team[NS].classId'), 'chess_knight');                   // Mã vẫn là Mã
        assert.deepEqual(json(h, 'modes()'), ['pawn', 'bishop', 'checkmate']);
        assert.deepEqual(json(h, '[leon.skillCooldowns[2] <= room.clock, skillUsable(leon, 0), leon.chess.deadAt.pawn === undefined]'), [true, true, true]);
        assert.equal(h.fx('sacrifice').length, 0);                                 // phong cấp không phải quân chết
        // đủ 2 quân chúa: không ai được phong nữa dù sống bao lâu
        h.run(`var t = room.clock - T0; var pwx = put("pawn"); upTo(t + ${wait + 2000})`);
        assert.equal(h.fx('promote').length, 1);
        // ghế Hậu trống lại -> đếm lại từ lúc ghế trống: Tốt (đã sống sẵn) phong tiếp sau đúng `wait`
        h.run(`t = room.clock - T0; kill(team[PS]); at(t); var PS2 = slot("pawn"); upTo(t + ${wait - 50})`);
        assert.equal(h.fx('promote').length, 1);
        h.run(`upTo(t + ${wait})`);
        assert.deepEqual(h.fx('promote').at(-1), { casterId: 'p1', casterIdx: 0, kind: 'promote', from: h.run('PS2'), to: 'queen', piece: 'pawn', summonIdx: h.run('PS2') });
        // Vua gục, còn Hậu (ghế Vua trống): MÃ xưng Vua — Tốt mới thì KHÔNG (Tốt chỉ lên Hậu)
        h.run(`t = room.clock - T0; kill(kg); at(t); var pw3 = put("pawn"), PS3 = slot("pawn"); upTo(t + ${wait - 50})`);
        assert.equal(h.fx('promote').length, 2);
        h.run(`upTo(t + ${wait})`);
        assert.deepEqual(h.fx('promote').at(-1), { casterId: 'p1', casterIdx: 0, kind: 'promote', from: h.run('NS'), to: 'king', piece: 'knight', summonIdx: h.run('NS') });
        assert.deepEqual(json(h, '[team[NS].classId, team[NS].chessKind, team[NS].maxHp, team[PS3].classId, kn.alive]'), ['chess_king', 'king', 4200 + 260 * (level - 1), 'chess_pawn', false]);
        // ô Mã trống: nút 2 về Gọi Mã, gọi lại được ngay (không phải chờ 5 giây); nút 3 là Chiếu Tướng
        assert.deepEqual(json(h, '[modes(), skillUsable(leon, 1), leon.chess.deadAt.knight === undefined]'), [['guardMove', 'knight', 'checkmate'], true, true]);
        assert.equal(h.fx('sacrifice').length, 2);                                 // (2 lần Thí Quân là của Hậu và Vua bị giết ở trên, không phải của quân được phong)
    }
    // chưa mở thiên phú 2 (cấp 39): không phong cấp
    const g = harness();
    arena(g, { level: 39, rank: 1 });
    g.run('put("pawn"); put("rook"); put("knight"); var kg = put("king"); kg.crownNext = 1e15; upTo(20000)');
    assert.equal(g.fx('promote').length, 0);
    // Tốt ra sau Vua: tính từ lúc Tốt ra
    const k = harness();
    arena(k, { level: 40, rank: 1 });
    k.run('var p0 = put("pawn"); put("rook"); var kg = put("king"); kg.crownNext = 1e15; at(0); kill(p0); at(8000); put("pawn"); upTo(19950)');
    assert.equal(k.fx('promote').length, 0);
    k.run('upTo(20000)');
    assert.equal(k.fx('promote').length, 1);
    // chỉ có Hậu: Tốt không được phong (ghế trống là ghế Vua, cần Mã); Mã ra sau thì tính từ lúc Mã ra
    const q = harness();
    arena(q, { level: 40, rank: 1 });
    q.run('var n0 = put("knight"); put("bishop"); var qn = put("queen"); qn.orbNext = 1e15; at(0); kill(n0); put("pawn"); upTo(20000)');
    assert.equal(q.fx('promote').length, 0);
    q.run('put("knight"); upTo(31950)');
    assert.equal(q.fx('promote').length, 0);
    q.run('upTo(32000)');
    assert.deepEqual(q.fx('promote').map(e => [e.piece, e.to]), [['knight', 'king']]);
    // gọi thẳng chessPromote sai đường (Tốt -> Vua, Mã -> Hậu, Xe -> gì cũng không): không làm gì
    const w = harness();
    arena(w, { level: 40, rank: 1 });
    w.run('put("pawn"); put("rook"); put("knight")');
    assert.deepEqual(json(w, '[chessPromote(room, "p1", slot("pawn"), "king", room.clock), chessPromote(room, "p1", slot("knight"), "queen", room.clock), chessPromote(room, "p1", slot("rook"), "king", room.clock)]'), [-1, -1, -1]);
    assert.equal(w.fx('promote').length, 0);
});

test('Chiếu Tướng: tốn 3 Orb, hồi 20000; mọi đối thủ bị nâng 1500 ms rồi nhận ×3.0 P.ATK của Vua và choáng 1000 ms; đối thủ ccImmune không bị nâng nhưng mất máu', () => {
    const h = harness();
    arena(h, { foes: [['c1_wolf', 12, 0], ['c1_wolf', 30, 5], ['c1_wolf', 14, -3]] });
    h.run(`var kg = put("king"), qn = put("queen"); kg.crownNext = 1e15; qn.orbNext = 1e15; leon.chess.royalAuto = { king: 1e15, queen: 1e15 };
        foes[2].statusEffects.push({ type: 'giant_form', endTime: T0 + 99999, immuneUntil: T0 + 99999 });
        var has = (i, type) => foes[i].statusEffects.find(e => e.type === type && e.endTime > room.clock); var hp0 = foes.map(e => e.hp)`);
    assertButton(h, 2, 'checkmate');
    assert.deepEqual(json(h, '[skillCostOf(leon, 2, room.clock), skillUsable(leon, 2)]'), [3000, true]);
    h.run('cast(2)');
    const cm = h.fx('checkmate');
    assert.equal(cm.length, 1);
    assert.deepEqual([cm[0].casterId, cm[0].casterIdx, cm[0].kingIdx, cm[0].queenIdx, cm[0].lift], ['p1', 0, h.run('slot("king")'), h.run('slot("queen")'), 1500]);
    assert.deepEqual(cm[0].effects.map(e => e.targetIndex), [0, 1, 2]);
    assert.deepEqual(json(h, 'hits.filter(x => x.by === "chess_king").map(x => [x.ti, x.mult, x.delay])'), [[0, 3, 1500], [1, 3, 1500], [2, 3, 1500]]);
    assert.deepEqual(json(h, '[has(0, "knockup").endTime - T0, has(1, "knockup").endTime - T0, !!has(2, "knockup"), !!has(2, "stun")]'), [1500, 1500, false, false]);
    assert.equal(h.run('leon.skillCooldowns[2] - T0'), 600 + 20000);
    h.run('at(1499)');
    assert.deepEqual(json(h, 'foes.map(e => e.hp)'), json(h, 'hp0'));
    h.run('at(1500)');
    for (const i of [0, 1, 2]) assert.equal(h.run(`hp0[${i}] - foes[${i}].hp`), cm[0].effects[i].damage);
    assert.ok(cm[0].effects.every(e => e.damage > 0));
    assert.deepEqual(json(h, '[has(0, "stun").endTime - T0, has(1, "stun").endTime - T0, !!has(2, "stun")]'), [2500, 2500, false]);
});

test('có cả Vua và Hậu: mỗi quân chúa tự dùng chiêu 2 của mình mỗi 14000 ms; chỉ có 1 quân chúa thì không tự dùng', () => {
    const h = harness();
    arena(h, { foes: [['monster_dummy', 8, 0]] });
    h.run('var kg = put("king"); kg.crownNext = 1e15; upTo(5000)');
    assert.equal(h.fx('judgeStart').length + h.fx('dance').length, 0);
    h.run('var qn = put("queen"); qn.orbNext = 1e15; upTo(5050)');
    assert.deepEqual([h.fx('judgeStart').length, h.fx('dance').length], [1, 1]);
    assert.equal(h.run('leon.mp'), h.run('leon.maxMp'));                         // tự dùng: không tốn Orb của Leon
    h.run('upTo(19000)');
    assert.deepEqual([h.fx('judgeStart').length, h.fx('dance').length, h.fx('judgeSlam').length], [1, 1, 1]);
    h.run('upTo(19100)');
    assert.deepEqual([h.fx('judgeStart').length, h.fx('dance').length], [2, 2]);
});

test('AUTO chessmaster: đội không có Chiến Binh sống → nút 1 trước; có Chiến Binh → nút 2 trước; có checkmate + 3 Orb → 2; đồng đội dưới 60% máu + guardMove sẵn → 0', () => {
    const mk = (opts) => { const h = harness(); arena(h, opts);
        h.run('var auto = (mp) => { if (mp != null) leon.mp = mp; curRoom = room; return autoChooseSkill(leon, LI, room.players.p1, room.players.p2, room.clock); }; var free = () => { for (const s of team) if (s.chessKind) { s.crownNext = s.orbNext = s.drainNext = 1e15; } leon.chess.royalAuto = { king: 1e15, queen: 1e15 }; }');
        return h; };
    // không có Chiến Binh: mở cánh thủ trước, xong thì gọi quân chúa, rồi mới xây cánh công
    const a = mk({ allies: ['archer'] });
    assert.equal(a.run('auto(2000)'), 0);
    assert.equal(a.run('auto(900)'), -1);
    a.run('put("pawn")');
    assert.equal(a.run('auto(1000)'), -1);                                       // Gọi Xe cần 2 Orb: để dành, không gọi Mã
    assert.equal(a.run('modes()[1]'), 'locked');                                 // (cánh công đang khoá: AUTO không bao giờ chọn nút 2 lúc này)
    assert.notEqual(a.run('auto(5000)'), 1);
    assert.equal(a.run('auto(2000)'), 0);
    a.run('put("rook")');
    assert.equal(a.run('auto(2500)'), -1);                                       // để dành 3 Orb cho quân chúa
    assert.equal(a.run('auto(3000)'), 2);
    a.run('put("king"); free(); at(100)');
    assert.equal(a.run('auto(1000)'), 1);                                        // có quân chúa rồi: xây nốt cánh công
    a.run('put("knight")');
    assert.equal(a.run('auto(2000)'), 1);
    a.run('put("bishop"); free()');
    assert.equal(a.run('auto(1000)'), 1);                                        // không còn quân nào cần gọi: Nước Cờ Công
    // quân chết: gọi lại ngay khi đủ Orb (chờ đủ 5 giây)
    a.run('at(1000); kill(piece("knight")); at(7000)');
    assert.equal(a.run('auto(1000)'), 1);
    assert.equal(a.run('modes()[1]'), 'knight');
    // đồng đội dưới 60% máu + Nước Cờ Thủ sẵn sàng -> 0
    a.run("ally('archer').hp = Math.round(ally('archer').maxHp * 0.5)");
    assert.equal(a.run('auto(1000)'), 0);
    a.run('leon.skillCooldowns[0] = room.clock + 5000');
    assert.equal(a.run('auto(1000)'), 1);
    // có Chiến Binh còn sống: mở cánh công trước; Chiến Binh gục thì mở cánh thủ
    const b = mk({ allies: ['warrior'] });
    assert.equal(b.run('auto(2000)'), 1);
    b.run("ally('warrior').alive = false");
    assert.equal(b.run('auto(2000)'), 0);
    // có Chiếu Tướng + 3 Orb -> 2
    const c = mk({});
    c.run('put("king"); put("queen"); free(); at(100)');
    assert.equal(c.run('modes()[2]'), 'checkmate');
    assert.equal(c.run('auto(3000)'), 2);
    assert.notEqual(c.run('auto(2900)'), 2);
});

test('sửa bổ sung: pawnGuard + drainTick gửi máy khách; applyProgress bỏ qua quân triệu hồi; nút có ready: false khi bấm chỉ xếp hàng chờ', () => {
    // pawnGuard: Giữ Lối báo chỗ Tốt đứng + những ai bị khiêu khích
    const h = harness();
    arena(h, { foes: [['c1_wolf', 9, 0], ['c1_wolf', 9.5, 3], ['c1_wolf', 15, 0]] });
    h.run('var pw = put("pawn", 4, 0), rk = put("rook", 3, -1.5); cast(0)');
    assert.deepEqual(h.fx('pawnGuard'), [{ casterId: 'p1', casterIdx: 0, kind: 'pawnGuard', summonIdx: h.run('slot("pawn")'), x: 6, z: 0, targets: [0, 1] }]);
    // ready: quân tới lượt (Xe) bị choáng -> nút 1 có ready: false; hết choáng thì bỏ cờ · quân chết đang chờ 5 giây -> ready: false
    h.run('at(1000)');
    assert.equal(h.run('"ready" in leon.skills[0]'), false);
    h.run('applyStun(rk, 1000, room.clock); at(1050)');
    assert.equal(h.run('leon.skills[0].ready'), false);
    h.run('at(2100)');
    assert.equal(h.run('"ready" in leon.skills[0]'), false);
    h.run('kill(pw); at(2200)');
    assert.deepEqual(json(h, '[leon.skills[0].mode, leon.skills[0].ready]'), ['pawn', false]);
    h.run('at(7200)');
    assert.equal(h.run('"ready" in leon.skills[0]'), false);
    // drainTick: mỗi nhịp hút — hút Orb thì effects rỗng, hút máu thì có số sát thương
    const g = harness();
    drainArena(g, [1000, 0]);
    g.run('upTo(4400)');
    const ticks = g.fx('drainTick');
    assert.deepEqual(ticks.map(t => [t.summonIdx, t.targetId, t.targetIndex, t.mode, t.effects.length]),
        [['orb', 0], ['orb', 0], ['hp', 1], ['hp', 1]].map(([mode, n]) => [g.run('BS'), 'p2', g.run('RI'), mode, n]));
    assert.ok(ticks[2].effects[0].damage > 0 && ticks[2].effects[0].targetIndex === g.run('RI'));
    // applyProgress lên quân cờ / thú của Sylva (tool đổi cấp cả đội giữa trận): không lỗi, không đổi gì
    const k = harness();
    arena(k, { level: 30, rank: 1, allies: ['summoner'] });
    k.run(`var pw = put("pawn"), SI = team.indexOf(ally('summoner')), wolf = team[summonSylvaUnit(room, 'p1', SI, 'wolf', 0, 0, 18000, room.clock)];
        var snap = () => JSON.stringify([pw, wolf]); var s0 = snap();
        for (const m of team) applyProgress(m, { ...undefined, level: m.summon ? undefined : 30, rank: m.summon ? undefined : 1, gear: null, aff: 0, skin: null })`);
    assert.equal(k.run('snap()'), k.run('s0'));
    assert.equal(k.run('leon.level'), 30);
});
