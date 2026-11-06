// ============================================================
// GIẢ LẬP ẢI CỐT TRUYỆN (cân bằng quái chương 1) — server phải đang chạy (cổng 3000)
//   node tools/sim_stage.js --stage c1-01 --level 1 [--upTo 0] [--squad warrior,assassin,priest] [--diff story] [--runs 3] [--auto]
//   Người chơi giả: mỗi 0,7 giây "bấm" 1 kỹ năng còn dùng được (như người mới bấm lung tung); --auto: bật AUTO cả đội.
//   Ghi tiến trình vào data/progress.json theo mã "sim-stage-bot" (cấp đội được đặt lại mỗi lần chạy).
// ============================================================
const { io } = require('socket.io-client');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']);
    return acc;
}, []));
const STAGE = args.stage ?? 'c1-01';
const LEVEL = Number(args.level ?? 1);
const UPTO = Number(args.upTo ?? Math.max(0, Number(STAGE.slice(3)) - 1));
const SQUAD = (args.squad ?? 'warrior,assassin,priest').split(',');
const DIFF = args.diff ?? 'story';
const RUNS = Number(args.runs ?? 3);
const AUTO = args.auto === 'true';

const socket = io('http://localhost:3000', { auth: { clientId: 'sim-stage-bot' }, transports: ['websocket'], reconnection: false });
const results = [];
let run = 0, startAt = 0, clicker = null, players = null, myId = null;

function start() {
    run++;
    socket.emit('startStage', { id: STAGE, diff: DIFF, classes: SQUAD });
}
socket.on('connect', () => {
    myId = socket.id;
    socket.emit('debugCampaign', { upTo: UPTO, level: LEVEL });
    setTimeout(start, 600);
});
socket.on('campaignError', (d) => { console.log('LỖI:', d.text); process.exit(1); });
socket.on('battleStart', (d) => {
    startAt = Date.now();
    if (AUTO) socket.emit('toggleAuto', { autoMode: true });
    socket.emit('setSpeed', { speed: 2 });
    clearInterval(clicker);
    let k = 0;
    clicker = setInterval(() => { socket.emit('queueSkill', { memberIndex: k % SQUAD.length, skillIndex: Math.floor(k / SQUAD.length) % 3 }); k++; }, 700);
});
socket.on('gameState', (d) => { players = d; });
socket.on('stageResult', (d) => {
    clearInterval(clicker);
    const sec = Math.round((Date.now() - startAt) / 1000);
    results.push({ win: d.win, sec });
    if (run < RUNS) setTimeout(start, 800);
    else {
        const wins = results.filter(r => r.win).length;
        console.log(`${STAGE} (${DIFF}) Lv${LEVEL} ${SQUAD.join('+')}${AUTO ? ' AUTO' : ''}: thắng ${wins}/${RUNS}`, results.map(r => `${r.win ? 'W' : 'L'}${r.sec}s`).join(' '));
        process.exit(0);
    }
});
setTimeout(() => { console.log('Hết giờ', results); process.exit(2); }, 60000 * RUNS);
