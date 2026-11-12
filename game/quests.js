// ============================================================
// 📜 BỘ MÁY NHIỆM VỤ kiểu MMO (chương 1) — luật thuần, không socket. Dữ liệu: game/questData1.js
//   · Server là nơi quyết định: tiến độ đếm từ SỰ KIỆN game (fire / talk / battle / pos), không tin client.
//   · Lưu trong pr.world: quests[id] = 'active' | 'done' · qp[id] = { i: bước, n: số đếm, d: { việc lẻ đã làm } }
//       main = số bước chính tuyến đã xong · daily = việc hôm nay · qnotes = dòng báo chờ gửi client
//   · Thưởng chỉ trả 1 lần: đổi trạng thái sang 'done' TRƯỚC khi cộng thưởng; bước chính tuyến trả khi chỉ số bước tăng.
//   · Nhiệm vụ ẩn: không có trạng thái cho tới khi sự kiện đầu tiên khớp bước đầu -> tự chuyển 'active' (lúc đó mới hiện trong sổ).
// ============================================================
const QD = require('./questData1');
const W = require('./wallet');
const A = require('./account');

const QUESTS = QD.QUESTS;
const BY_ID = Object.fromEntries(QUESTS.map(q => [q.id, q]));
const DAILY = QD.DAILY;
const MAIN_TIERS = QD.MAIN_TIERS;
const mainReward = (st) => MAIN_TIERS[st?.tier] ?? MAIN_TIERS.small;
let MAIN = [];                      // các bước chính tuyến (game/world.js nạp bằng setMain)
let locate = () => null;            // id NPC / vật -> { scene, kind, id } (game/world.js nạp bằng setLocator)
const setMain = (steps) => { MAIN = steps; };
const setLocator = (fn) => { locate = fn; };

const clearedId = (pr, id, diff = 'story') => pr.campaign?.cleared?.[diff]?.[id] === true;
const clearedNo = (pr, n) => clearedId(pr, `c1-${String(n).padStart(2, '0')}`);
const stageNo = (id) => { const m = /^c1-(\d\d)$/.exec(id ?? ''); return m ? Number(m[1]) : null; };
const C1_JUMP = /^jump_(ashford|outskirts|forest|road|capital)_/;   // rương phải nhảy mới tới của chương 1

// ---------- trạng thái ----------
function ensure(pr) {
    pr.world ??= {};
    const w = pr.world;
    w.quests ??= {}; w.bag ??= {}; w.qp ??= {}; w.opened ??= {}; w.qnotes ??= []; w.spot ??= {};
    pr.flags ??= {};
    if (!w.reported) { w.reported = {}; for (const st of MAIN) if (st.kind === 'report' && clearedNo(pr, st.no)) w.reported[st.no] = true; }   // save cũ: ải đã qua coi như đã báo (như game/world.js)
    if (w.main == null) w.main = firstUndone(pr);   // save cũ: bước của ải đã qua coi như xong, KHÔNG trả bù Kim Cương
    return w;
}
const stateOf = (pr, id) => pr.world?.quests?.[id] ?? null;
const progOf = (pr, id) => pr.world?.qp?.[id] ?? { i: 0, n: 0, d: {} };
function note(pr, t, k = 'info') {
    const w = pr.world;
    w.qnotes ??= [];
    w.qnotes.push({ t, k });
    if (w.qnotes.length > 16) w.qnotes.splice(0, w.qnotes.length - 16);
}
/** Lấy (và xoá) các dòng báo đang chờ — server gửi kèm worldState */
function takeNotes(pr) {
    const list = pr.world?.qnotes ?? [];
    if (pr.world) pr.world.qnotes = [];
    return list;
}

function isOpen(pr, q) {
    const o = q.open ?? {};
    if (o.stage && !clearedId(pr, o.stage)) return false;
    if (o.account && !((pr.account?.level ?? 1) >= o.account)) return false;
    if (o.quest && stateOf(pr, o.quest) !== 'done') return false;
    if (o.flag && !pr.flags?.[o.flag]) return false;
    return true;
}
function openText(q) {
    const o = q.open ?? {}, out = [];
    if (o.stage) out.push(`qua ải ${stageNo(o.stage) ?? o.stage}`);
    if (o.account) out.push(`cấp tài khoản ${o.account}`);
    if (o.quest) out.push(`xong việc “${BY_ID[o.quest]?.name ?? o.quest}”`);
    return out.length ? `Mở sau khi ${out.join(', ')}` : 'Chưa mở';
}

// ---------- tiến độ 1 bước: { have, need } ----------
function progress(pr, g, p) {
    const w = pr.world ?? {}, d = p.d ?? {};
    switch (g.type) {
        case 'talk': return { have: g.who.filter(id => d[id]).length, need: g.who.length };
        case 'deliver': return { have: p.n ? 1 : 0, need: 1 };
        case 'collect': return { have: g.items.filter(it => w.bag?.[it]).length, need: g.items.length };
        case 'interact': return g.objs ? { have: g.objs.filter(id => d[id]).length, need: g.objs.length } : { have: Math.min(g.n, p.n ?? 0), need: g.n };
        case 'reach': case 'standOn': return { have: p.n ? 1 : 0, need: 1 };
        case 'clearStage': return { have: clearedId(pr, g.stage, g.diff ?? 'story') ? 1 : 0, need: 1 };
        case 'flag': return { have: pr.flags?.[g.flag] ? 1 : 0, need: 1 };
        case 'winBattles': case 'useSkills': case 'enhanceGear': return { have: Math.min(g.n, p.n ?? 0), need: g.n };
        case 'loseThenWin': return { have: p.n ? 2 : d.lost ? 1 : 0, need: 2 };
        case 'openChests': {
            const have = g.ids ? g.ids.filter(id => w.opened?.[id]).length : Object.keys(w.opened ?? {}).filter(id => !C1_JUMP.test(id)).length;
            return { have: Math.min(have, g.ids?.length ?? g.n), need: g.ids?.length ?? g.n };
        }
        case 'jumpChests': return { have: Math.min(g.n, Object.keys(w.opened ?? {}).filter(id => C1_JUMP.test(id)).length), need: g.n };
        case 'readClues': {
            const order = w.clueOrder ?? [];
            const got = g.clues.filter(c => order.includes(c)).length;
            if (g.ordered && got === g.clues.length && order.filter(c => g.clues.includes(c)).some((c, i) => c !== g.clues[i])) return { have: got - 1, need: g.clues.length, broken: true };
            return { have: got, need: g.clues.length };
        }
        case 'mats': {   // đang có đủ nguyên liệu / vật liệu trong túi (game/gather.js): mats { mã: số } hoặc any [mã…] + n
            const have = (id) => w.mats?.[id] ?? 0;
            if (g.any) return { have: Math.min(g.n, g.any.reduce((s, id) => s + have(id), 0)), need: g.n };
            return { have: Object.entries(g.mats).reduce((s, [id, n]) => s + Math.min(n, have(id)), 0), need: Object.values(g.mats).reduce((s, n) => s + n, 0) };
        }
        default: return { have: 0, need: 1 };
    }
}
const DERIVED = new Set(['collect', 'clearStage', 'flag', 'openChests', 'jumpChests', 'readClues', 'mats']);   // tính thẳng từ save, không cần đếm

/** Sự kiện có làm bước này tiến lên không (ghi vào p) */
function match(pr, g, ev, p) {
    p.d ??= {};
    switch (g.type) {
        case 'talk':
            if (ev.type !== 'talk' || !g.who.includes(ev.who) || p.d[ev.who]) return false;
            p.d[ev.who] = true; return true;
        case 'deliver':
            if (ev.type !== 'talk' || ev.who !== g.npc || p.n || !g.items.every(it => pr.world.bag?.[it])) return false;
            p.n = 1; return true;
        case 'interact':
            if (ev.type !== 'interact') return false;
            if (g.objs) { if (!g.objs.includes(ev.id) || p.d[ev.id]) return false; p.d[ev.id] = true; return true; }
            if (ev.id !== g.obj || (p.n ?? 0) >= g.n) return false;
            p.n = (p.n ?? 0) + 1; return true;
        case 'reach':
            if (ev.type !== 'pos' || ev.scene !== g.scene || p.n || Math.max(Math.abs(ev.x - g.x), Math.abs(ev.y - g.y)) > (g.r ?? 1)) return false;
            p.n = 1; return true;
        case 'standOn':   // server đo bằng 2 lần báo vị trí cùng 1 ô cách nhau đủ lâu (ev.dwell = ms đã đứng ở ô đó)
            if (ev.type !== 'pos' || ev.scene !== g.scene || ev.x !== g.x || ev.y !== g.y || p.n || !(ev.dwell >= g.sec * 1000)) return false;
            p.n = 1; return true;
        case 'winBattles':
            if (ev.type !== 'battle' || !ev.win || (p.n ?? 0) >= g.n) return false;
            if (g.noDeaths && ev.deaths > 0) return false;
            if (g.squadSize && ev.squad !== g.squadSize) return false;
            if (g.minNo && !((stageNo(ev.id) ?? 0) >= g.minNo)) return false;
            p.n = (p.n ?? 0) + 1; return true;
        case 'loseThenWin':
            if (ev.type !== 'battle' || ev.id !== g.stage || p.n) return false;
            if (!ev.win) { if (p.d.lost) return false; p.d.lost = true; return true; }
            if (!p.d.lost) return false;
            p.n = 1; return true;
        case 'useSkills':
            if (ev.type !== 'battle' || !(ev.skills > 0) || (p.n ?? 0) >= g.n) return false;
            p.n = Math.min(g.n, (p.n ?? 0) + ev.skills); return true;
        case 'enhanceGear':
            if (ev.type !== 'enhance' || (p.n ?? 0) >= g.n) return false;
            p.n = (p.n ?? 0) + 1; return true;
        default: return false;
    }
}

const visibleQuests = () => QUESTS.filter(q => q.type !== 'hidden');
const stepOf = (pr, q) => q.steps[progOf(pr, q.id).i] ?? null;
function start(pr, q) {
    const w = ensure(pr);
    if (w.quests[q.id]) return false;
    w.quests[q.id] = 'active';
    w.qp[q.id] = { i: 0, n: 0, d: {} };
    for (const it of q.give ?? []) w.bag[it] = true;
    for (const [tool, tier] of Object.entries(q.tools ?? {})) require('./gather').giveTool(pr, tool, tier);   // dụng cụ bậc 1 trao khi nhận việc
    return true;
}

// ---------- thưởng ----------
const REWARD_NAME = { gold: 'Vàng', diamond: 'Kim Cương', stone: 'Đá Cường Hoá' };
const ITEM_NAME = { exp_small: 'Bình EXP nhỏ', exp_big: 'Bình EXP lớn', exp_huge: 'Bình EXP siêu lớn', refine_stone: 'Đá Tinh Luyện', luck_charm: 'Bùa May Mắn' };
function rewardText(r = {}) {
    const out = [];
    for (const k of Object.keys(REWARD_NAME)) if (r[k]) out.push(`+${r[k]} ${REWARD_NAME[k]}`);
    for (const [k, v] of Object.entries(r.items ?? {})) out.push(`+${v} ${ITEM_NAME[k] ?? k}`);
    if (r.gear) out.push('+1 Trang bị');
    if (r.title) out.push(`Danh hiệu “${r.title}”`);
    return out.join(' · ');
}
function grant(pr, wallet, r = {}, rng = Math.random) {
    for (const k of Object.keys(REWARD_NAME)) if (r[k]) W.add(wallet, k, r[k]);
    pr.items ??= {};
    for (const [k, v] of Object.entries(r.items ?? {})) pr.items[k] = (pr.items[k] ?? 0) + v;
    let gearName = null;
    if (r.gear) {   // 1 món trang bị (túi đầy thì tự phân giải như đồ rơi)
        const G = require('./gear');
        const it = G.createItem(rng, r.gear, G.newId(pr));
        gearName = G.describe(it).name ?? 'Trang bị';
        if (!G.addItem(pr, it)) { const v = G.salvageValue(it); W.add(wallet, 'stone', v.stone); pr.items.refine_stone = (pr.items.refine_stone ?? 0) + v.refine; gearName += ' (túi đầy, đã phân giải)'; }
    }
    if (r.title) { pr.titles ??= []; if (!pr.titles.includes(r.title)) pr.titles.push(r.title); }
    return gearName;
}
/** Xong nhiệm vụ: đổi 'done' trước rồi mới cộng thưởng -> gọi lại không trả lần 2 */
function complete(pr, wallet, q, rng) {
    const w = ensure(pr);
    if (w.quests[q.id] === 'done') return null;
    const C = require('./campaign'), feats = C.features(pr);
    w.quests[q.id] = 'done';
    delete w.qp[q.id];
    for (const st of q.steps) for (const it of st.goal.items ?? []) delete w.bag[it];
    for (const it of q.give ?? []) delete w.bag[it];
    if (q.flag) pr.flags[q.flag] = true;
    const gearName = grant(pr, wallet, q.reward, rng);
    const xp = A.questAccountExp(q.id, q.type), acc = A.addAccountExp(pr, xp);   // nhiệm vụ cũng cho EXP tài khoản (theo loại: phụ / nhánh / ẩn)
    const up = acc.levelUps.length ? ` · ⬆️ Lên cấp tài khoản ${acc.after.level}!` : '';
    const text = `Hoàn thành “${q.name}”: ${rewardText(q.reward)}${gearName ? ` (${gearName})` : ''} · +${xp} EXP tài khoản${up}${q.extra ? ` · ${q.extra}` : ''}`;
    note(pr, `${q.type === 'hidden' ? '🔮 Nhiệm vụ ẩn' : '✅'} ${text}`, 'done');
    for (const f of C.features(pr)) if (!feats.has(f)) note(pr, `🔓 Mở tính năng mới: ${A.NAMES[f] ?? f}`, 'main');   // lên cấp tài khoản / xong việc mở khoá -> báo ngay trên bản đồ
    return { quest: q.id, rewards: { ...q.reward }, text, flag: q.flag ?? null, account: acc };
}

// ---------- chính tuyến: mỗi bước +20 Kim Cương ----------
function mainDone(pr, st) {
    const w = pr.world ?? {};
    if (st.kind === 'go') return !!w.spot?.[st.no] || clearedNo(pr, st.no);
    if (st.kind === 'clear') return clearedNo(pr, st.no);
    return clearedNo(pr, st.no) && !!w.reported?.[st.no];
}
function firstUndone(pr) {
    let i = 0;
    while (i < MAIN.length && mainDone(pr, MAIN[i])) i++;
    return i;
}
/** Tính lại bước chính tuyến KHÔNG trả thưởng (save cũ / công cụ thử nhảy ải) */
function resetMain(pr) { ensure(pr).main = firstUndone(pr); }
function advanceMain(pr, wallet) {
    const w = pr.world;
    let n = 0;
    while (w.main < MAIN.length && mainDone(pr, MAIN[w.main])) {
        const st = MAIN[w.main];
        w.main++;                                   // tăng chỉ số trước -> mỗi bước chỉ trả 1 lần
        const r = mainReward(st);                   // nhỏ: bình EXP nhỏ + vàng · trung bình: + Kim Cương · quan trọng: bình siêu lớn
        grant(pr, wallet, r);
        note(pr, `${st.tier === 'big' ? '🌟' : '⭐'} Chính tuyến: ${st.text} · ${rewardText(r)}`, 'main');
        n++;
    }
    return n;
}

// ---------- việc hằng ngày ----------
const pad = (n) => String(n).padStart(2, '0');
/** Khoá ngày: đổi lúc 05:00 giờ máy chủ */
function dayKey(now) {
    const d = new Date(now - DAILY.resetHour * 3600e3);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function seeded(str) {
    let h = 2166136261;
    for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffled(list, rng) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
function dailyAvail(pr, t) {
    if (t.needs === 'forge') return require('./campaign').features(pr).has('forge') && Object.keys(pr.gear?.items ?? {}).length > 0;
    return true;
}
/** 4 việc của ngày: hạt giống theo ngày (mọi người cùng thứ tự), bỏ việc người chơi chưa mở được; 1–2 việc đánh quái */
function pickDaily(pr, key) {
    const rng = seeded(key);
    const fights = shuffled(DAILY.tasks.filter(t => t.fight), rng), others = shuffled(DAILY.tasks.filter(t => !t.fight), rng);
    const nFight = 1 + (rng() < 0.5 ? 1 : 0);
    return [...fights.slice(0, nFight), ...others.filter(t => dailyAvail(pr, t)).slice(0, DAILY.count - nFight)].map(t => t.id);
}
function ensureDaily(pr, now) {
    const w = ensure(pr), key = dayKey(now);
    if (w.daily?.day !== key) w.daily = { day: key, tasks: pickDaily(pr, key), n: {}, seen: {}, got: {}, bonus: false };
    return w.daily;
}
const dailyTask = (id) => DAILY.tasks.find(t => t.id === id);
function dailyEvent(pr, wallet, ev, now) {
    const d = ensureDaily(pr, now);
    let changed = false;
    for (const id of d.tasks) {
        const t = dailyTask(id);
        if (!t || d.got[id]) continue;
        let add = 0;
        if (ev.type === 'battle') {
            if (t.kind === 'win' && ev.win) add = 1;
            if (t.kind === 'kill' && ev.win) add = ev.kills ?? 0;
            if (t.kind === 'clean' && ev.win && !(ev.deaths > 0)) add = 1;
            if (t.kind === 'skill') add = ev.skills ?? 0;
        } else if (ev.type === 'talk' && t.kind === 'talk') {
            if (!d.seen[`t:${ev.who}`]) { d.seen[`t:${ev.who}`] = true; add = 1; }
        } else if (t.kind === 'gather' && (ev.type === 'chest' || ev.type === 'gather')) add = ev.type === 'chest' ? 3 : 1;
        else if (t.kind === 'jump' && ev.type === 'jump') add = 1;
        else if (t.kind === 'feed' && ev.type === 'feed') add = 1;
        else if (t.kind === 'walk' && ev.type === 'pos' && ev.scene === t.scene) add = 1;
        else if (t.kind === 'enh' && ev.type === 'enhance') add = 1;
        if (!add) continue;
        d.n[id] = Math.min(t.need, (d.n[id] ?? 0) + add);
        changed = true;
        if (d.n[id] >= t.need) {   // xong việc: trả ngay, đánh dấu trước khi cộng -> không nhận 2 lần
            d.got[id] = true;
            W.add(wallet, 'diamond', DAILY.each);
            note(pr, `📅 Việc hôm nay: ${t.text} · +${DAILY.each} Kim Cương`, 'daily');
        }
    }
    if (!d.bonus && d.tasks.length >= DAILY.count && d.tasks.every(id => d.got[id])) {
        d.bonus = true;
        W.add(wallet, 'diamond', DAILY.bonus);
        note(pr, `📅 Xong cả ${DAILY.count} việc hôm nay · +${DAILY.bonus} Kim Cương`, 'daily');
    }
    return changed;
}
function dailyState(pr, now) {
    const d = ensureDaily(pr, now);
    const next = new Date(now - DAILY.resetHour * 3600e3); next.setHours(24, 0, 0, 0);
    return { day: d.day, each: DAILY.each, bonus: DAILY.bonus, bonusGot: d.bonus, total: DAILY.each * DAILY.count + DAILY.bonus,
        resetIn: Math.max(0, next.getTime() + DAILY.resetHour * 3600e3 - now),
        tasks: d.tasks.map(id => { const t = dailyTask(id); return { id, text: t.text, fight: !!t.fight, have: d.n[id] ?? 0, need: t.need, done: !!d.got[id] }; }) };
}

// ---------- xử lý sự kiện ----------
/** Bước đang làm đã đủ -> sang bước kế; hết bước -> xong (nhiệm vụ ẩn / bước cuối không cần trả). Kèm chính tuyến + kích hoạt nhiệm vụ ẩn tính từ save. */
function settle(pr, wallet, now = Date.now(), rng = Math.random) {
    const w = ensure(pr), out = [];
    for (const q of QUESTS) {
        if (q.type === 'hidden' && !w.quests[q.id] && isOpen(pr, q) && DERIVED.has(q.steps[0].goal.type) && progress(pr, q.steps[0].goal, progOf(pr, q.id)).have > 0) {
            start(pr, q);
            note(pr, `🔮 Phát hiện nhiệm vụ ẩn: ${q.name}`, 'start');
        }
        if (w.quests[q.id] !== 'active') continue;
        const p = w.qp[q.id] ??= { i: 0, n: 0, d: {} };
        while (p.i < q.steps.length) {
            const st = q.steps[p.i], pg = progress(pr, st.goal, p);
            if (pg.have < pg.need) break;
            if (st.goal.type === 'deliver') for (const it of st.goal.items) delete w.bag[it];
            if (st.flag) pr.flags[st.flag] = true;
            p.i++; p.n = 0; p.d = {};
            if (p.i < q.steps.length) note(pr, `📜 ${q.name}: ${q.steps[p.i].text}`, 'step');
        }
        if (p.i >= q.steps.length) { const r = complete(pr, wallet, q, rng); if (r) out.push(r); }
    }
    advanceMain(pr, wallet);
    return out;
}
/** Sự kiện game -> tiến độ nhiệm vụ đang làm + kích hoạt nhiệm vụ ẩn + việc hằng ngày. Trả danh sách { q, step } vừa tiến. */
function fire(pr, wallet, ev, now = Date.now(), rng = Math.random) {
    const w = ensure(pr), hits = [];
    const early = settle(pr, wallet, now, rng);   // bước tính thẳng từ save (đã đủ vật, đã qua ải…) sang bước kế trước khi xét sự kiện
    for (const q of QUESTS) {
        const st = w.quests[q.id];
        if (st === 'done') continue;
        if (st === 'active') {
            const p = w.qp[q.id] ??= { i: 0, n: 0, d: {} }, step = q.steps[p.i];
            if (step && match(pr, step.goal, ev, p)) hits.push({ q, step });
        } else if (q.type === 'hidden' && isOpen(pr, q)) {   // nhiệm vụ ẩn: hành động đầu tiên đúng -> kích hoạt
            const p = { i: 0, n: 0, d: {} };
            if (!match(pr, q.steps[0].goal, ev, p)) continue;
            w.quests[q.id] = 'active'; w.qp[q.id] = p;
            hits.push({ q, step: q.steps[0] });
            note(pr, `🔮 Phát hiện nhiệm vụ ẩn: ${q.name}`, 'start');
        }
    }
    dailyEvent(pr, wallet, ev, now);
    const done = [...early, ...settle(pr, wallet, now, rng)];
    return { hits, done };
}

/** Nói chuyện với NPC / người trên bản đồ: trả / làm bước -> nhận nhiệm vụ mới -> nhắc việc. null = không liên quan nhiệm vụ. */
function talk(pr, wallet, who, now = Date.now(), rng = Math.random) {
    const { hits, done } = fire(pr, wallet, { type: 'talk', who }, now, rng);
    if (hits.length) {
        const { q, step } = hits[0], fin = done.find(d => d.quest === q.id);
        const say = step.say?.[who] ?? null;
        const lines = [...(say ?? []).map(t => ['npc', t]), ...(fin ? (q.outro ?? []) : [])].map(l => [...l]);
        if (!lines.length) lines.push(['npc', fin ? 'Cảm ơn nhiều lắm.' : 'Được rồi.']);
        return { lines, quest: q.id, story: !!fin || (say?.length ?? 0) > 1, ...(fin ? { text: fin.text, rewards: fin.rewards, flag: fin.flag, account: fin.account, completed: true } : {}) };
    }
    const offer = visibleQuests().find(q => q.giver === who && !stateOf(pr, q.id) && isOpen(pr, q));
    if (offer) {
        start(pr, offer);
        note(pr, `📜 Nhận nhiệm vụ: ${offer.name}`, 'start');
        settle(pr, wallet, now, rng);
        return { lines: (offer.intro ?? [['npc', '…']]).map(l => [...l]), quest: offer.id, story: true, accepted: true, text: offer.legacy ? 'Nhận việc' : `Nhận nhiệm vụ: ${offer.name}` };
    }
    const active = visibleQuests().find(q => q.giver === who && stateOf(pr, q.id) === 'active' && !q.legacy);
    if (active) return { lines: [['npc', `Việc ta nhờ: ${stepOf(pr, active)?.text ?? active.name}.`]], quest: active.id };
    return null;
}

/** Dấu trên đầu NPC / người: '?' tới lúc trả / nói chuyện theo bước · '!' có nhiệm vụ mới. Nhiệm vụ ẩn không có dấu. */
function markOf(pr, who) {
    const w = pr.world ?? {};
    for (const q of visibleQuests()) {
        if (w.quests?.[q.id] !== 'active') continue;
        const p = progOf(pr, q.id), g = q.steps[p.i]?.goal;
        if (!g) continue;
        if (g.type === 'talk' && g.who.includes(who) && !p.d?.[who]) return { txt: '?', kind: q.type, quest: q.id };
        if (g.type === 'deliver' && g.npc === who && g.items.every(it => w.bag?.[it])) return { txt: '?', kind: q.type, quest: q.id };
    }
    const offer = visibleQuests().find(q => q.giver === who && !w.quests?.[q.id] && isOpen(pr, q));
    return offer ? { txt: '!', kind: offer.type, quest: offer.id } : null;
}
/** NPC / người có đang được nhiệm vụ cần tới không (để hiện dù điều kiện cốt truyện đã ẩn) — kể cả bước nói chuyện của nhiệm vụ ẩn */
function needed(pr, who) {
    if (markOf(pr, who)) return true;
    const w = pr.world ?? {};
    return QUESTS.some(q => {
        if (w.quests?.[q.id] !== 'active') return false;
        if (q.giver === who) return true;
        const p = progOf(pr, q.id), g = q.steps[p.i]?.goal;
        return !!g && ((g.type === 'talk' && g.who.includes(who) && !p.d?.[who]) || (g.type === 'deliver' && g.npc === who));
    });
}

/** Trạng thái vật nhiệm vụ trên bản đồ: 'ready' | 'hidden' (+ dấu cho người) */
function objState(pr, o, now = Date.now()) {
    const w = pr.world ?? {};
    if (o.type === 'pickup' || o.type === 'item') {
        const q = BY_ID[o.quest];
        if (!q || w.quests?.[q.id] !== 'active' || w.bag?.[o.item]) return 'hidden';
        const g = q.steps[progOf(pr, q.id).i]?.goal;
        return g?.type === 'collect' && g.items.includes(o.item) ? 'ready' : 'hidden';
    }
    if (o.type === 'spot') {
        if (o.always) return 'ready';
        return QUESTS.some(q => { if (w.quests?.[q.id] !== 'active') return false; const p = progOf(pr, q.id), g = q.steps[p.i]?.goal; return g?.type === 'interact' && (g.objs ? g.objs.includes(o.id) && !p.d?.[o.id] : g.obj === o.id); }) ? 'ready' : 'hidden';
    }
    if (o.type === 'person') return o.always || needed(pr, o.id) ? 'ready' : 'hidden';
    if (o.type === 'gather') return w.gather?.[o.id] === dayKey(now) ? 'hidden' : 'ready';
    return 'ready';
}
/** Vật nhặt có đang cần cho bước hiện tại không */
const wantsItem = (pr, o) => objState(pr, o) === 'ready';

/** Báo vị trí (server.js gọi khi client lưu ô đang đứng): reach + standOn (đo thời gian đứng yên giữa 2 lần báo cùng ô) */
function pos(pr, wallet, scene, x, y, now = Date.now()) {
    const w = ensure(pr), key = `${scene}:${x},${y}`;
    if (w.qstand?.key !== key) w.qstand = { key, at: now };
    return fire(pr, wallet, { type: 'pos', scene, x, y, dwell: now - w.qstand.at }, now);
}
/** Kết thúc 1 trận (ải / quái hoang / hầm ngục): ev = { id, diff, win, squad, deaths, skills, kills } */
function battle(pr, wallet, ev, now = Date.now()) {
    return fire(pr, wallet, { type: 'battle', id: ev.id, diff: ev.diff ?? 'story', win: !!ev.win, squad: ev.squad ?? 0, deaths: ev.deaths ?? 0, skills: ev.skills ?? 0, kills: ev.kills ?? 0 }, now);
}
/** Ghi thứ tự đọc manh mối (nhiệm vụ ẩn "Người ghép hình") — save cũ đã có manh mối: game/world.js coi như đọc đúng thứ tự */
function clueRead(pr, clueId) {
    const w = ensure(pr);
    w.clueOrder ??= [];
    if (!w.clueOrder.includes(clueId)) w.clueOrder.push(clueId);
}

// ---------- sổ nhiệm vụ ----------
function targetOf(pr, q, p) {
    const st = q.steps[p.i], g = st?.goal, w = pr.world ?? {};
    if (!g) return null;
    if (st.at) return st.at.obj ? { scene: st.at.scene, kind: 'obj', id: st.at.obj } : { scene: st.at.scene, kind: 'tile', x: st.at.x, y: st.at.y };
    if (g.type === 'talk') return locate(g.who.find(id => !p.d?.[id]));
    if (g.type === 'deliver') return locate(g.npc);
    if (g.type === 'collect') return locate(`item:${g.items.find(it => !w.bag?.[it])}`);
    if (g.type === 'interact') return locate(g.objs ? g.objs.find(id => !p.d?.[id]) : g.obj);
    if (g.type === 'reach') return { scene: g.scene, kind: 'tile', x: g.x, y: g.y };
    if (g.type === 'mats' && g.at) return locate(g.at);
    return null;
}
/** Sổ nhiệm vụ gửi client: phụ + nhánh (cả chưa mở) · ẩn (chỉ cái đã tìm ra) · chính tuyến (số bước) · hằng ngày */
function log(pr, now = Date.now(), npcName = (id) => id) {
    const order = { active: 0, offered: 1, locked: 2, done: 3 };
    const list = [];
    for (const q of QUESTS) {
        const st = stateOf(pr, q.id);
        if (q.type === 'hidden' && !st) continue;   // chưa tìm ra: không lộ
        const state = st === 'done' ? 'done' : st === 'active' ? 'active' : isOpen(pr, q) ? 'offered' : 'locked';
        const p = progOf(pr, q.id), step = state === 'active' ? q.steps[p.i] : null;
        const pg = step ? progress(pr, step.goal, p) : null;
        const giver = q.giver ? npcName(q.giver) : '';
        list.push({ id: q.id, type: q.type, title: q.name, giver, desc: q.desc ?? '', state,
            obj: state === 'done' ? 'Đã hoàn thành' : state === 'locked' ? openText(q) : state === 'offered' ? `Nói chuyện với ${giver}` : `${step.text}${pg?.broken ? ' (đã đọc sai thứ tự)' : ''}`,
            progress: pg && pg.need > 1 ? { have: pg.have, need: pg.need } : null,
            step: state === 'active' ? { i: p.i + 1, total: q.steps.length } : null,
            target: state === 'offered' ? locate(q.giver) : state === 'active' ? targetOf(pr, q, p) : null,
            reward: `${rewardText(q.reward)}${q.extra ? ` · ${q.extra}` : ''}`, needNo: state === 'locked' && q.open?.stage ? stageNo(q.open.stage) : null });
    }
    list.sort((a, b) => order[a.state] - order[b.state]);
    const hidden = QUESTS.filter(q => q.type === 'hidden');
    const i = Math.min(pr.world?.main ?? 0, MAIN.length);
    return { list, daily: dailyState(pr, now),
        hidden: { found: hidden.filter(q => stateOf(pr, q.id)).length, total: hidden.length },
        main: { i, total: MAIN.length, reward: MAIN[i] ? rewardText(mainReward(MAIN[i])) : null, tier: MAIN[i]?.tier ?? 'small', text: MAIN[i]?.text ?? null, last: MAIN[i - 1]?.text ?? null },
        titles: [...(pr.titles ?? [])] };
}

module.exports = { QUESTS, BY_ID, DAILY, MAIN_TIERS, setMain, setLocator, mainList: () => MAIN, ensure, stateOf, progOf, isOpen, progress, match, start, complete, settle, fire, talk, pos, battle, clueRead,
    markOf, needed, objState, wantsItem, resetMain, takeNotes, note, dayKey, pickDaily, ensureDaily, dailyState, dailyEvent, log, rewardText, grant };
