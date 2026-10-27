// ============================================================
// TRẬN ĐÁNH THỬ TỰ ĐỘNG (không cần trình duyệt)
//   Kết nối vào server đang chạy như 1 người chơi, chọn chế độ + đội hình, bật AUTO tốc độ x2,
//   ghi lại kỹ năng / sự kiện / chỉ số lạ (NaN, máu âm...) rồi in báo cáo.
//
//   Cách dùng (server phải đang chạy, mặc định cổng 3000):
//     node tools/sim_battle.js --mode test --squad alchemist,priest --seconds 60
//     node tools/sim_battle.js --mode duel_hero --squad alchemist,warrior --enemy priest,dancer --seconds 90
//   Tuỳ chọn: --port 3000  --watch alchemist (classId cần theo dõi kỹ)  --progress all (Lv60 SSS cả đội, chỉ chế độ test)
//             --free (kỹ năng miễn phí, không hồi chiêu) · --god (phe mình bất tử) — 2 tuỳ chọn này chỉ chạy ở chế độ test
//   Grix: báo thêm số bình mỗi lần ném (flasksPerCast), loại bình (flaskKinds), máu hồi từ bình (flaskHeal) và từ Giáp Độc (wardDrainHeal).
//   Lưu ý: server ghi tiến trình vào data/progress.json theo mã người chơi "sim-battle-bot".
// ============================================================
const { io } = require('socket.io-client');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']);
    return acc;
}, []));
const PORT = Number(args.port ?? process.env.PORT ?? 3000);
const MODE = args.mode ?? 'test';
const SQUAD = (args.squad ?? 'alchemist').split(',');
const ENEMY = (args.enemy ?? '').split(',').filter(Boolean);
const SECONDS = Number(args.seconds ?? 60);
const WATCH = args.watch ?? SQUAD[0];

const report = {
    mode: MODE, squad: SQUAD, enemy: ENEMY, watch: WATCH,
    skillsByType: {}, watchSkills: {}, castStarts: 0, autoAttacks: 0,
    fxKinds: {}, fxDamage: {}, statusSeen: {}, maxStacksSeen: 0,
    problems: [], ended: null, stateUpdates: 0,
};
const problem = (msg) => { if (report.problems.length < 40) report.problems.push(msg); };
const bad = (v) => typeof v === 'number' && !Number.isFinite(v);

const socket = io(`http://localhost:${PORT}`, { auth: { clientId: 'sim-battle-bot' }, transports: ['websocket'], reconnection: false });
let classDefs = null, myId = null, started = false;

function checkEffects(list, where) {
    (list ?? []).forEach(e => {
        if (!e) return;
        if (bad(e.damage) || (typeof e.damage === 'number' && e.damage < 0)) problem(`${where}: sát thương lạ ${e.damage}`);
        if (bad(e.heal)) problem(`${where}: hồi máu lạ ${e.heal}`);
    });
}

socket.on('connect_error', (err) => { console.error(`Không kết nối được server cổng ${PORT}: ${err.message}`); process.exit(2); });
socket.on('connect', () => { myId = socket.id; });
socket.on('mainMenu', () => socket.emit('chooseMode', { mode: MODE }));
socket.on('squadSelect', () => {
    if (started) return;
    if (args.progress && MODE === 'test') socket.emit('debugProgress', { classId: 'all', preset: 3 });
    socket.emit('confirmSquad', { classes: SQUAD, enemyClasses: ENEMY });
});
socket.on('squadSelectError', (d) => { problem(`Chọn đội lỗi: ${d?.text}`); finish(); });
socket.on('battleStart', (d) => {
    if (d.classDefs) classDefs = d.classDefs;
    if (d.mode === 'menu') return;
    if (started) return;
    started = true;
    const mine = d.players?.[myId]?.squad?.map(m => m.classId) ?? [];
    SQUAD.forEach(c => { if (!mine.includes(c)) problem(`Đội của mình thiếu ${c} (có: ${mine.join(',')})`); });
    // --free: kỹ năng miễn phí, không hồi chiêu (chỉ chế độ test) · --god: phe mình bất tử
    if (args.free && MODE === 'test') socket.emit('debugAction', { type: 'noMana', value: true });
    if (args.god && MODE === 'test') socket.emit('debugAction', { type: 'godMode', value: true });
    // --enemyGod: quái bất tử (chỉ chế độ test) — để trận kéo dài, thử kỹ năng nhiều lần
    if (args.enemyGod && MODE === 'test') socket.emit('debugEnemyAction', { type: 'godMode', value: true });
    socket.emit('toggleAuto', { autoMode: true });
    socket.emit('setSpeed', { speed: 2 });
    setTimeout(finish, SECONDS * 1000);
});

const owner = (casterId, idx, players) => players?.[casterId]?.squad?.[idx]?.classId;
let lastPlayers = null;
socket.on('stateUpdate', (d) => {
    report.stateUpdates++;
    lastPlayers = d.players;
    Object.values(d.players ?? {}).forEach(p => (p.squad ?? []).forEach(m => {
        if (bad(m.hp) || bad(m.maxHp)) problem(`${m.classId}: máu NaN/Infinity`);
        if (m.hp > m.maxHp * 1.001 + 1) problem(`${m.classId}: máu ${m.hp} > tối đa ${m.maxHp}`);
        (m.statusEffects ?? []).forEach(ef => {
            report.statusSeen[ef.type] = (report.statusSeen[ef.type] ?? 0) + 1;
            if (ef.type === 'poison') {
                report.maxStacksSeen = Math.max(report.maxStacksSeen, ef.stacks ?? 0);
                if (ef.maxStacks && ef.stacks > ef.maxStacks) problem(`Độc vượt tối đa: ${ef.stacks}/${ef.maxStacks}`);
            }
        });
    }));
});
socket.on('skillExecuted', (d) => {
    report.skillsByType[d.type] = (report.skillsByType[d.type] ?? 0) + 1;
    if (owner(d.casterId, d.casterIdx, lastPlayers) === WATCH) report.watchSkills[d.type] = (report.watchSkills[d.type] ?? 0) + 1;
    checkEffects(d.effects, `skill ${d.type}`);
});
socket.on('castStart', () => report.castStarts++);
socket.on('autoAttack', (d) => { report.autoAttacks++; if (bad(d.damage)) problem(`autoAttack sát thương lạ ${d.damage}`); });
socket.on('goblinFx', (d) => {
    report.fxKinds[d.kind] = (report.fxKinds[d.kind] ?? 0) + 1;
    const effs = d.effects ?? (d.effect ? [d.effect] : []);
    checkEffects(effs, `goblinFx ${d.kind}`);
    const dmg = effs.reduce((t, e) => t + (Number(e?.damage) || 0), 0);
    report.fxDamage[d.kind] = (report.fxDamage[d.kind] ?? 0) + dmg;
    // Grix bản 2: loại bình (near / far / extra / ally), hồi máu đồng minh từ bình, máu hút từ Giáp Độc
    if (d.kind === 'flaskHit') {
        report.flaskKinds = report.flaskKinds ?? {};
        report.flaskKinds[d.flaskKind ?? '?'] = (report.flaskKinds[d.flaskKind ?? '?'] ?? 0) + 1;
        (d.heals ?? []).forEach(h => {
            if (bad(h.heal) || h.heal < 0) problem(`flaskHit: hồi máu lạ ${h.heal}`);
            report.flaskHeal = (report.flaskHeal ?? 0) + (Number(h.heal) || 0);
        });
    }
    if (d.kind === 'wardDrain') {
        if (bad(d.heal) || d.heal < 0) problem(`wardDrain: hồi máu lạ ${d.heal}`);
        report.wardDrainHeal = (report.wardDrainHeal ?? 0) + (Number(d.heal) || 0);
    }
});
// Triệu hồi: phe nào HẾT TƯỚNG (không tính triệu hồi) mà quá 1,5s trận chưa kết thúc -> lỗi luật thắng thua.
//   Đếm sự kiện của Sylva (sylvaFx) + số triệu hồi (summon: true) đã thấy trên sân theo loại.
let heroesDeadSince = null;
socket.on('stateUpdate', (d) => {
    if (report.ended) return;
    const anyTeamWiped = Object.values(d.players ?? {}).some(p => {
        const heroes = (p.squad ?? []).filter(m => !m.summon);
        return heroes.length > 0 && heroes.every(m => !m.alive);
    });
    if (anyTeamWiped) {
        heroesDeadSince ??= d.clock;
        if (d.clock - heroesDeadSince > 1500 && !report.wipeProblem) { report.wipeProblem = true; problem('Một phe đã hết tướng nhưng trận chưa kết thúc (còn triệu hồi?)'); }
    } else heroesDeadSince = null;
    Object.values(d.players ?? {}).forEach(p => (p.squad ?? []).forEach(m => {
        if (m.summon && m.alive) { report.summonsSeen = report.summonsSeen ?? {}; report.summonsSeen[m.classId] = Math.max(report.summonsSeen[m.classId] ?? 0, 1); }
    }));
});
socket.on('sylvaFx', (d) => {
    report.sylvaFx = report.sylvaFx ?? {};
    report.sylvaFx[d.kind] = (report.sylvaFx[d.kind] ?? 0) + 1;
    const effs = d.effects ?? (d.effect ? [d.effect] : []);
    checkEffects(effs, `sylvaFx ${d.kind}`);
    (d.heals ?? []).forEach(h => { if (bad(h.heal) || h.heal < 0) problem(`sylvaFx ${d.kind}: hồi máu lạ ${h.heal}`); });
});
// Elarion — Bóng Nguyên Tố (lúc Bão Nguyên Tố): đếm bóng hiện / tan, kiểm tra không bao giờ có 2 bóng cùng lúc của 1 Elarion;
//   đếm nhịp mưa / tia của bóng và của chính Elarion
const shadowsOn = new Map();
socket.on('elemFx', (d) => {
    const key = `${d.casterId}:${d.casterIdx}`;
    if (d.kind === 'shadowStart') {
        report.shadowStarts = (report.shadowStarts ?? 0) + 1;
        report.shadowSpells = report.shadowSpells ?? {};
        report.shadowSpells[d.spell] = (report.shadowSpells[d.spell] ?? 0) + 1;
        if (shadowsOn.get(key)) problem('Elarion có 2 bóng cùng lúc');
        shadowsOn.set(key, true);
        if (bad(d.toX) || bad(d.toZ)) problem('shadowStart: toạ độ lùi lạ');
    }
    if (d.kind === 'shadowEnd') { report.shadowEnds = (report.shadowEnds ?? 0) + 1; shadowsOn.set(key, false); }
    if (d.kind === 'rainTick' || d.kind === 'beamTick') {
        const k = `${d.kind}${d.shadow ? '(bóng)' : ''}`;
        report.elemTicks = report.elemTicks ?? {};
        report.elemTicks[k] = (report.elemTicks[k] ?? 0) + 1;
    }
});
// Grix bản 2: số bình mỗi lần dùng Bình Độc Văng (2, 3 hoặc thêm bình đồng minh)
socket.on('skillExecuted', (d) => {
    if (d.type !== 'goblin_flask' || !Array.isArray(d.flasks)) return;
    report.flasksPerCast = report.flasksPerCast ?? {};
    const n = d.flasks.length;
    report.flasksPerCast[n] = (report.flasksPerCast[n] ?? 0) + 1;
    if (n < 2) problem(`Bình Độc Văng chỉ ném ${n} bình`);
});
// Luật Sinh Tử (1 đấu 1 quá 15s): giây bắt đầu (tính từ lúc vào trận, gồm 3s đếm ngược), số lần trừ máu, máu lạ
let battleT0 = null, lastClock = null;
socket.on('countdown', (d) => { if (d.count === 'START') battleT0 = lastClock; });
socket.on('stateUpdate', (d) => { lastClock = d.clock; if (battleT0 == null) battleT0 = d.clock; });
socket.on('suddenDeath', (d) => {
    if (d.kind === 'start') report.suddenDeathAt = lastClock != null && battleT0 != null ? +((lastClock - battleT0) / 1000).toFixed(1) : '?';
    if (d.kind === 'tick') {
        report.suddenDeathTicks = (report.suddenDeathTicks ?? 0) + 1;
        (d.hits ?? []).forEach(h => { if (bad(h.damage) || h.damage <= 0) problem(`suddenDeath: trừ máu lạ ${h.damage}`); });
    }
});
socket.on('battleEnd', (d) => {
    report.battleSeconds = lastClock != null && battleT0 != null ? +((lastClock - battleT0) / 1000).toFixed(1) : '?';
});
socket.on('battleEnd', (d) => { report.ended = d.draw ? 'hoà' : (d.winnerId === myId ? 'THẮNG' : 'thua'); finish(); });

let done = false;
function finish() {
    if (done) return;
    done = true;
    if (lastPlayers) {
        report.finalHp = Object.entries(lastPlayers).map(([pid, p]) =>
            `${pid === myId ? 'Mình' : 'Đối thủ'}: ` + (p.squad ?? []).map(m => `${m.classId} ${Math.round(m.hp)}/${Math.round(m.maxHp)}`).join(', '));
    }
    console.log(JSON.stringify(report, null, 2));
    socket.close();
    process.exit(report.problems.length ? 1 : 0);
}
setTimeout(() => { if (!started) { problem('Trận không bắt đầu sau 15s'); finish(); } }, 15000);
