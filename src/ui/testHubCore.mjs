// ============================================================
// 🧪 TOOL THỬ — phần "thuần" (không đụng trình duyệt / socket) để chạy được trong tests/testHub.test.js
//   · norm / matchScore / searchCommands : tìm lệnh không cần gõ dấu ("ai 7", "rok sss", "bat tu")
//   · buildCommands                      : danh sách MỌI lệnh (dựng từ testCatalogResult của server)
//   · SCENARIOS / scenarioSteps          : kịch bản 1 lần bấm = chuỗi bước
//   · runSteps                           : chạy chuỗi bước (gửi lệnh -> đợi server trả lời, quá giờ thì báo, không treo)
// Giao diện nằm ở src/ui/testHub.js.
// ============================================================

/** Bỏ dấu tiếng Việt + chữ thường: "Tới Ải 7 — Bão Tuyết" -> "toi ai 7 bao tuyet" */
export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9+\-]+/g, ' ').trim();

const isSubseq = (needle, hay) => { let i = 0; for (const c of hay) if (c === needle[i]) i++; return i === needle.length; };

/** Điểm khớp của `query` với `text` (+ từ khoá phụ `kw`). 0 = không khớp. Mọi cụm trong query đều phải khớp. */
export function matchScore(query, text, kw = '') {
    const q = norm(query);
    if (!q) return 1;
    const t = norm(text), k = norm(kw);
    const tw = t.split(' '), kwWords = k ? k.split(' ') : [];
    let score = 0;
    for (const tok of q.split(' ')) {
        const num = /^\d+$/.test(tok);
        let best = 0;
        for (const [words, mul] of [[tw, 1], [kwWords, 0.8]]) {
            for (let i = 0; i < words.length; i++) {
                const w = words[i];
                let s = 0;
                if (w === tok) s = 100;
                else if (w.startsWith(tok)) s = 70;
                else if (!num && tok.length >= 2 && w.includes(tok)) s = 40;
                else if (num && w.replace(/\D+/g, '') === tok) s = 85;   // "60" khớp "lv60"
                else if (!num && tok.length >= 3 && w[0] === tok[0] && isSubseq(tok, w)) s = 15;   // gõ tắt / thiếu chữ trong 1 từ ("srphn" -> seraphine)
                if (s) best = Math.max(best, (s - Math.min(i, 8)) * mul);   // từ đứng đầu nhãn được ưu tiên nhẹ
            }
        }
        if (!best) return 0;
        score += best;
    }
    if (t.includes(q)) score += t.startsWith(q) ? 90 : 60;   // đúng nguyên cụm
    return Math.max(1, score - t.length * 0.2);
}

// ---------- công tắc nhớ lựa chọn ----------
export const TOGGLES = {
    god: { icon: '🛡️', label: 'Bất tử', kw: 'god bat tu phe minh', event: 'debugAction', type: 'godMode' },
    noMana: { icon: '✨', label: 'Skill miễn phí', kw: 'khong ton mana free skill hoi chieu', event: 'debugAction', type: 'noMana' },
    enemyGod: { icon: '👹', label: 'Quái bất tử', kw: 'enemy god dich bat tu', event: 'debugEnemyAction', type: 'godMode' },
};
export const toggleEmit = (key, on) => [TOGGLES[key].event, { type: TOGGLES[key].type, value: !!on }];
/** Trận nào thì tự bật lại các công tắc đã nhớ: Đấu Tập; ở Server test thêm cả ải Cốt truyện (thay cho "bật Bất tử trước rồi vào đánh") */
export const autoApplyMode = (mode, testServer) => mode === 'test' || (!!testServer && mode === 'campaign');

// ---------- dữ liệu cố định (trước đây là các nút trong index.html) ----------
export const ELEM_SPELLS = [['meteor', '🔥🔥🔥', 'Thiên Thạch'], ['frost', '❄️❄️❄️', 'Băng Phong'], ['chain', '⚡⚡⚡', 'Lôi Xích'], ['golem', '🔥❄️⚡', 'Golem'],
    ['ward', '❄️❄️⚡', 'Giáp Băng Sét'], ['tornado', '⚡⚡❄️', 'Lốc Xoáy'], ['steam', '🔥🔥❄️', 'Hơi Nước'], ['firebolt', '🔥🔥⚡', 'Hỏa Lôi Cầu'],
    ['beams', '❄️❄️🔥', 'Băng Hoại Hỏa Thiên'], ['haste', '⚡⚡🔥', 'Tốc Lôi']];
export const GOLEM_SKILLS = [['🔥', 'Nộ Lửa'], ['❄️', 'Bão Tuyết'], ['⚡', 'Hào Quang Sét']];
export const RANKS = ['Thường', 'S', 'SS', 'SSS'];
export const ACCOUNT_LEVELS = [1, 3, 6, 10, 12, 15, 18, 20, 25, 60];
export const GEAR_LEVELS = [10, 30, 60];
const PRESETS = [[1, 0], [20, 1], [40, 2], [60, 3]];   // debugProgress.preset 0..3
const TEAM_PRESETS = [[1, 0], [20, 1], [40, 1], [40, 2], [60, 2], [60, 3]];

export const GROUPS = { scenario: '🎬 Kịch bản', battle: '⚔️ Trong trận', enemy: '👹 Phe quái', elem: '🔮 Elarion & Golem', hero: '🦸 Nhân vật',
    story: '📖 Ải', map: '🗺️ Bản đồ', items: '🎒 Đồ & tiền', nav: '🧭 Đi tới' };
const ORDER = {
    battle: ['battle', 'enemy', 'elem', 'hero', 'scenario', 'items', 'nav', 'story', 'map'],
    world: ['map', 'story', 'scenario', 'nav', 'hero', 'items', 'battle', 'enemy', 'elem'],
    board: ['story', 'scenario', 'nav', 'map', 'hero', 'items', 'battle', 'enemy', 'elem'],
    menu: ['scenario', 'nav', 'story', 'map', 'hero', 'items', 'battle', 'enemy', 'elem'],
};
export const groupOrder = (place) => ORDER[place] ?? ORDER.menu;

const clampLv = (n) => Math.max(1, Math.min(60, Math.trunc(Number(n)) || 1));
const T = (op, extra = {}) => ({ emit: 'testTool', data: { op, ...extra }, wait: 'testToolResult', test: (r) => !!r?.ok, fail: 'Máy chủ không nhận lệnh (chỉ dùng được ở Server test)', failText: (r) => r?.text });
const E = (emit, data) => ({ emit, data });

/** Cấp + bậc đội hợp với ải thứ `no` của chương thứ `chapterIndex` (0 = chương 1) */
export function teamForStage(chapterIndex, no) {
    const level = clampLv(chapterIndex * 20 + Number(no) + 2);
    return { level, rank: level > 40 ? 2 : level > 20 ? 1 : 0 };
}

/** ctx = { inBattle, mode, place } -> lý do KHÔNG dùng được lệnh lúc này (null = dùng được) */
export function unavailable(cmd, ctx = {}) {
    if (cmd.need === 'battle' && !ctx.inBattle) return 'Cần đang trong trận';
    if (cmd.need === 'test' && !(ctx.inBattle && ctx.mode === 'test')) return 'Chỉ dùng trong trận Đấu Tập';
    return null;
}

/**
 * Mọi lệnh của tool thử. cat = testCatalogResult { chapters, heroes, items, gearSets, scenes } (thiếu vẫn chạy, chỉ ít lệnh hơn).
 * nums = các con số người dùng vừa gõ -> thêm lệnh "cấp N" tuỳ ý.
 * Mỗi lệnh: { id, icon, label, kw, group, need (battle | test), leave (đang trong trận thì về Menu trước), steps, toggle?, guard? }
 */
export function buildCommands(cat = {}, nums = []) {
    const out = [];
    const add = (id, icon, label, group, steps, o = {}) => out.push({ id, icon, label, group, steps, kw: '', need: null, ...o });
    const heroes = cat.heroes ?? [], chapters = cat.chapters ?? [];
    const extra = [...new Set(nums.map(clampLv))];

    // 🎬 kịch bản (cũng tìm được bằng ô lệnh)
    for (const s of SCENARIOS) add(`sc:${s.id}`, s.icon, s.label, 'scenario', null, { kw: s.kw, ask: s.ask, scenario: s.id, hint: s.hint });
    for (const h of heroes) add(`sc:skill:${h.id}`, '🎯', `Thử chiêu ${h.name}`, 'scenario', null, { kw: 'kich ban test skill ky nang dau tap', scenario: 'skill', arg: h.id, low: true });
    chapters.forEach((c, ci) => c.stages.forEach(s => add(`sc:boss:${s.id}`, '👑', `Thử trùm ải ${s.no}${ci ? ` chương ${ci + 1}` : ''} (đội đủ cấp)`, 'scenario', null,
        { kw: `${s.name} kich ban boss`, scenario: 'boss', arg: s.id, low: true })));

    // ⚔️ trong trận
    for (const [key, t] of Object.entries(TOGGLES)) add(`tg:${key}`, t.icon, t.label, key === 'enemyGod' ? 'enemy' : 'battle', [{ ui: 'toggle', arg: key }], { kw: t.kw, toggle: key });
    add('fillMana', '💎', 'Đầy mana', 'battle', [E('debugAction', { type: 'fillMana' })], { need: 'battle', kw: 'bom mana full day' });
    add('win', '🏆', 'Thắng ngay', 'battle', [T('battleWin')], { need: 'battle', kw: 'win thang tran' });
    add('lose', '💀', 'Thua ngay', 'battle', [T('battleLose')], { need: 'battle', kw: 'lose thua tran' });

    // 👹 phe quái
    add('spawn:standard', '👹', 'Gọi 3 quái', 'enemy', [E('debugEnemyAction', { type: 'spawnStandard' })], { need: 'test', kw: 'trieu hoi summon monster' });
    add('spawn:dummy', '🪵', 'Gọi cọc gỗ', 'enemy', [E('debugEnemyAction', { type: 'spawnDummy' })], { need: 'test', kw: 'trieu hoi dummy bia tap' });
    add('spawn:addDummy', '➕', 'Thêm 1 cọc gỗ', 'enemy', [E('debugEnemyAction', { type: 'addDummy' })], { need: 'test', kw: 'dummy' });
    add('spawn:removeDummy', '➖', 'Bớt 1 cọc gỗ', 'enemy', [E('debugEnemyAction', { type: 'removeDummy' })], { need: 'test', kw: 'dummy' });
    for (const lv of [...new Set([1, 20, 40, 60, ...extra])]) add(`monLv:${lv}`, '📶', `Quái cấp ${lv}`, 'enemy', [E('debugEnemyAction', { type: 'monsterLevel', set: lv })], { need: 'test', kw: `lv${lv} level monster` });
    for (const d of [1, 10, -1, -10]) add(`monAdd:${d}`, '📶', `Quái ${d > 0 ? '+' : '−'}${Math.abs(d)} cấp`, 'enemy', [E('debugEnemyAction', { type: 'monsterLevel', add: d })],
        { need: 'test', kw: `${d > 0 ? 'tang' : 'giam'} level monster` });

    // 🔮 Elarion + Golem
    for (const [key, ic, name] of ELEM_SPELLS) add(`elem:${key}`, '🔮', `Elarion: ${name} ${ic} → nút KN2`, 'elem', [E('debugAction', { type: 'elemSpell', value: key })], { need: 'test', kw: 'phep spell ky nang 2' });
    GOLEM_SKILLS.forEach(([ic, name], i) => add(`golem:${i}`, ic, `Golem: ${name} (kỹ năng ${i + 1})`, 'elem', [E('debugAction', { type: 'golemSkill', value: i })], { need: 'test', kw: 'golem skill dung ngay' }));

    // 🦸 nhân vật — trong trận dùng debugProgress (áp ngay lên nhân vật đang đánh), ngoài trận cũng vậy (không làm nhảy màn hình)
    const P = (classId, patch) => [E('debugProgress', { classId, ...patch })];
    for (const [lv, rk] of TEAM_PRESETS) add(`team:${lv}:${rk}`, '🦸', `Cả đội Lv${lv} ${RANKS[rk]}`, 'hero', P('all', { level: lv, rank: rk }), { kw: 'tat ca anh hung cap bac preset' });
    RANKS.forEach((r, i) => add(`teamRank:${i}`, '🎖️', `Cả đội bậc ${r}`, 'hero', P('all', { rank: i }), { kw: 'tat ca anh hung rank' }));
    for (const lv of extra) add(`teamLv:${lv}`, '🦸', `Cả đội cấp ${lv}`, 'hero', P('all', { level: lv }), { kw: `lv${lv} level tat ca` });
    add('ownAll', '🦸', 'Có đủ mọi anh hùng', 'hero', [T('heroes', { ownAll: true })], { kw: 'so huu mo khoa tuong', guard: true });
    add('detail:heroes', '📋', 'Bảng chi tiết nhân vật (cấp, bậc, thiên phú, đột phá)', 'hero', [{ ui: 'detail', arg: 'heroes' }], { kw: 'chi so level slider talent rank up tung nguoi' });
    for (const h of heroes) {
        PRESETS.forEach(([lv, rk], i) => add(`hero:${h.id}:p${i}`, '🦸', `${h.name} Lv${lv} ${RANKS[rk]}`, 'hero', P(h.id, { preset: i }), { kw: 'cap bac anh hung' }));
        for (const lv of extra) add(`heroLv:${h.id}:${lv}`, '🦸', `${h.name} cấp ${lv}`, 'hero', P(h.id, { level: lv }), { kw: `lv${lv} level` });
        add(`rankUp:${h.id}`, '⬆️', `${h.name}: Đột phá (luồng thật, có kiểm tra điều kiện)`, 'hero', [E('rankUp', { classId: h.id })], { kw: 'len bac rank up' });
        add(`member:${h.id}`, '🔁', `${h.name}: thêm / bớt khỏi trận`, 'hero', [E('debugAction', { type: 'toggleMember', value: h.id })], { need: 'test', kw: 'doi hinh bat tat ra tran squad' });
        add(`kill:${h.id}`, '💀', `${h.name}: hạ gục ngay (thử hồi sinh)`, 'hero', [E('debugAction', { type: 'kill', value: h.id })], { need: 'test', kw: 'giet chet kill revive' });
    }

    // 📖 ải
    chapters.forEach((c, ci) => {
        const short = `chương ${ci + 1}`, full = `${short} · ${c.name ?? c.id}`;
        for (const s of c.stages) add(`jump:${s.id}`, '📖', `Tới ải ${s.no}${ci ? ` chương ${ci + 1}` : ''} · ${s.name}`, 'story',
            [T('stageJump', { stageId: s.id }), { ui: 'board', arg: s.id }], { leave: true, kw: `nhay jump stage ch${ci + 1}` });
        add(`unlock:${c.id}`, '🔓', `Mở hết ${short} (cả Khó, Địa ngục, nhánh)`, 'story', [T('unlockChapter', { chapter: c.id }), { ui: 'board', arg: c.id }], { leave: true, kw: `mo khoa unlock ${c.name ?? ''}` });
        add(`board:${c.id}`, '📖', `Mở Bảng ải ${full}`, 'story', [{ ui: 'board', arg: c.id }], { leave: true, kw: 'chon ai campaign cot truyen' });
    });
    for (const lv of [...new Set([...ACCOUNT_LEVELS, ...extra])]) add(`acc:${lv}`, '⭐', `Cấp tài khoản ${lv}`, 'story', [E('debugAccount', { level: lv })], { kw: 'tk account mo chuc nang kho dia nguc dau' });

    // 🗺️ bản đồ
    add('world', '🗺️', 'Mở bản đồ thế giới', 'map', [{ ui: 'world' }], { leave: true, kw: 'di dao world map cot truyen' });
    for (const s of cat.scenes ?? []) add(`tp:${s.id}`, '📍', `Tới ${s.name}`, 'map', [T('teleport', { scene: s.id }), { ui: 'world' }], { leave: true, kw: 'dich chuyen teleport khu ban do', guard: true });

    // 🎒 đồ & tiền
    add('gold', '🪙', '+10.000 vàng', 'items', [T('wallet', { gold: 10000 })], { kw: 'tien gold', guard: true });
    add('diamond', '💎', '+1.000 kim cương', 'items', [T('wallet', { diamond: 1000 })], { kw: 'tien diamond kc', guard: true });
    add('stone', '🔷', '+100 đá', 'items', [T('wallet', { stone: 100 })], { kw: 'tien stone cuong hoa', guard: true });
    add('stamina', '⚡', 'Đầy thể lực', 'items', [T('wallet', { stamina: 'full' })], { kw: 'stamina the luc', guard: true });
    add('evidence', '🔎', 'Có đủ mọi chứng cứ', 'items', [T('evidenceAll')], { kw: 'so chung cu doi chat', guard: true });
    for (const it of cat.items ?? []) add(`item:${it.id}`, '🎁', `Nhận 10 × ${it.name}`, 'items', [T('item', { id: it.id, count: 10 })], { kw: 'vat pham item', guard: true });
    for (const lv of GEAR_LEVELS) {
        add(`gear::${lv}`, '🎒', `Nhận đồ thử: 6 ô thường cấp ${lv} (cam)`, 'items', [E('gearDebugGive', { set: null, level: lv, rarity: 4 })], { kw: `trang bi gear lv${lv}` });
        for (const g of cat.gearSets ?? []) add(`gear:${g.id}:${lv}`, '🎒', `Nhận đồ thử: ${g.name} cấp ${lv} (cam)`, 'items', [E('gearDebugGive', { set: g.id, level: lv, rarity: 4 })], { kw: `trang bi gear bo lv${lv}` });
    }
    add('detail:items', '🧰', 'Nhận đồ / vật phẩm tuỳ chọn (chọn món, cấp, độ hiếm, số lượng)', 'items', [{ ui: 'detail', arg: 'items' }], { kw: 'trang bi gear item form' });

    // 🧭 đi tới
    add('menu', '🏠', 'Về Menu (thoát trận)', 'nav', [{ emit: 'backToMenu', wait: 'mainMenu', fail: 'Không về được Menu' }], { kw: 'thoat tran main menu chon che do' });
    add('practice', '🧪', 'Vào Đấu Tập (chọn đội)', 'nav', [...toMenu(), E('chooseMode', { mode: 'test' }), { ui: 'close' }], { kw: 'test mode dau tap' });
    add('reset', '🔄', 'Chơi lại từ đầu (xoá tiến trình)', 'nav', [{ ui: 'reset' }], { kw: 'reset xoa tien trinh' });
    return out;
}

/** Các bước thật sự chạy: lệnh đổi màn (tới ải, mở bản đồ…) mà đang trong trận thì tự Về Menu trước */
export const stepsFor = (cmd, ctx = {}) => (cmd.leave && ctx.inBattle ? [...toMenu(), ...cmd.steps] : cmd.steps);

/** Tìm 1 lệnh theo id (cả lệnh "cấp N" tuỳ ý: lấy số ngay trong id) */
export function findCommand(id, cat) {
    const nums = String(id).match(/^(?:monLv|teamLv|acc):(\d+)$|^heroLv:[^:]+:(\d+)$/);
    return buildCommands(cat, nums ? [Number(nums[1] ?? nums[2])] : []).find(c => c.id === id) ?? null;
}

/**
 * Lọc + xếp lệnh. Có chữ: xếp theo độ khớp (lệnh hợp ngữ cảnh nhỉnh hơn một chút). Không chữ: xếp theo ngữ cảnh.
 * Lệnh chưa dùng được lúc này xuống cuối, kèm lý do (why).
 */
export function searchCommands(cmds, query, ctx = {}, limit = 60) {
    const order = groupOrder(ctx.place), q = norm(query);
    const rows = [];
    cmds.forEach((cmd, i) => {
        if (!q && cmd.group === 'scenario') return;   // không gõ gì: kịch bản đã có nút to phía trên
        const s = q ? matchScore(q, cmd.label, cmd.kw) : 1;
        if (!s) return;
        const why = unavailable(cmd, ctx);
        const gi = order.indexOf(cmd.group);
        // có chữ: lệnh chưa dùng được chỉ bị trừ điểm vừa phải (gõ đúng tên vẫn thấy, mờ + lý do); biến thể kịch bản đứng sau lệnh thường
        rows.push({ cmd, why, i, gi, score: q ? s + (order.length - gi) * 1.5 - (why ? 80 : 0) - (cmd.low ? 12 : 0) : -(why ? 1000 : 0) - gi * 10 });
    });
    rows.sort((a, b) => b.score - a.score || a.i - b.i);
    return rows.slice(0, limit);
}

/** Danh sách "Vừa dùng": mới nhất đứng đầu, không lặp, tối đa `max` */
export const pushRecent = (list, item, max = 5) => [item, ...(list ?? []).filter(r => r.id !== item.id)].slice(0, max);

// ============================================================
// 🎬 KỊCH BẢN
// ============================================================
export const SCENARIOS = [
    { id: 'skill', icon: '🎯', label: 'Thử chiêu 1 tướng', ask: 'hero', kw: 'kich ban skill ky nang dau tap', hint: 'Vào Đấu Tập 1 tướng · bất tử · skill miễn phí · 3 quái bất tử' },
    { id: 'team60', icon: '🏆', label: 'Thử cả đội Lv60 SSS', ask: null, kw: 'kich ban doi hinh manh nhat dau tap', hint: 'Cả đội Lv60 SSS · vào Đấu Tập · 3 quái Lv60' },
    { id: 'boss', icon: '👑', label: 'Thử trùm ải N', ask: 'stage', kw: 'kich ban boss ai cot truyen', hint: 'Nhảy tới ải · đội đủ cấp · mở Bảng ải ngay ải đó' },
    { id: 'walk', icon: '🗺️', label: 'Đi dạo bản đồ', ask: 'scene', kw: 'kich ban world map khu', hint: 'Dịch chuyển tới khu đã chọn rồi mở bản đồ' },
    { id: 'revive', icon: '✨', label: 'Thử hồi sinh', ask: 'heroNoPriest', kw: 'kich ban revive tu si seraphine hoi sinh', hint: 'Tu Sĩ + 1 tướng · cọc gỗ · hạ gục tướng đó để thử hồi sinh' },
];

function toMenu() { return [{ emit: 'backToMenu', wait: 'mainMenu', fail: 'Không về được Menu', say: 'Về Menu…' }]; }
const enterPractice = (classes) => [
    ...toMenu(),
    { emit: 'chooseMode', data: { mode: 'test' }, wait: 'squadSelect', save: 'squad', fail: 'Máy chủ không mở Đấu Tập (chỉ có ở Server test)', say: 'Vào Đấu Tập…' },
    { emit: 'confirmSquad', data: (bag) => ({ classes: classes ?? fullSquad(bag.squad) }), wait: 'battleStart', test: (d) => d?.mode === 'test',
        fail: 'Không vào được trận Đấu Tập', say: 'Xếp đội…' },
];
/** Đội đủ người cho "cả đội": đội đã nhớ lần trước, thiếu thì thêm người khác cho đủ (squad = gói squadSelect của server) */
export function fullSquad(squad = {}) {
    const max = squad.max ?? 4, pick = [...(squad.selected ?? [])].slice(0, max);
    for (const h of squad.heroes ?? []) { if (pick.length >= max) break; if (!pick.includes(h.id)) pick.push(h.id); }
    return pick;
}
const remember = (...keys) => keys.map(k => ({ ui: 'toggleOn', arg: k }));

/** Chuỗi bước của kịch bản `id` với lựa chọn `arg` (id tướng / ải / khu). cat để tra chương của ải. */
export function scenarioSteps(id, arg, ctx = {}, cat = {}) {
    const leave = ctx.inBattle ? toMenu() : [];
    switch (id) {
        case 'skill': return [...enterPractice([arg]), ...remember('god', 'noMana', 'enemyGod'),
            E('debugEnemyAction', { type: 'spawnStandard' }), { ui: 'close' }];
        case 'team60': return [...leave, { emit: 'debugProgress', data: { classId: 'all', level: 60, rank: 3 }, wait: 'progressUpdate', fail: 'Máy chủ không đặt được cấp đội (chỉ có ở Server test)', say: 'Cả đội lên Lv60 SSS…' },
            ...enterPractice(null), E('debugEnemyAction', { type: 'spawnStandard' }), E('debugEnemyAction', { type: 'monsterLevel', set: 60 }), { ui: 'close' }];
        case 'boss': {
            const ci = Math.max(0, (cat.chapters ?? []).findIndex(c => c.stages.some(s => s.id === arg)));
            const no = (cat.chapters ?? [])[ci]?.stages.find(s => s.id === arg)?.no ?? 1;
            return [...leave, { ...T('stageJump', { stageId: arg }), say: 'Nhảy tới ải…' }, { ...T('heroes', teamForStage(ci, no)), say: 'Nâng cấp đội…' }, { ui: 'board', arg }, { ui: 'close' }];
        }
        case 'walk': return [...leave, { ...T('teleport', { scene: arg }), say: 'Dịch chuyển…' }, { ui: 'world' }, { ui: 'close' }];
        case 'revive': return [...enterPractice([arg, 'priest']), ...remember('noMana'),
            E('debugEnemyAction', { type: 'spawnDummy' }),
            { wait: 'countdown', test: (d) => d?.count === 'START', ms: 9000, fail: 'Trận chưa bắt đầu — tự bấm 💀 hạ gục sau nhé', say: 'Đợi trận bắt đầu…' },
            E('debugAction', { type: 'fillMana' }), E('debugAction', { type: 'kill', value: arg }), { ui: 'close' }];
        default: return null;
    }
}

/**
 * Chạy chuỗi bước. io = { emit(event, data), on(event, fn), off(event, fn), ui(name, arg, bag) -> có thể trả Promise, say?(text) }
 * Bước: { emit, data | data(bag), wait, test(payload), ms, fail, failText(payload), save } · { ui, arg } · { delay }
 *   - có `wait`: đăng ký nghe TRƯỚC rồi mới gửi `emit`; quá `ms` (mặc định 5 giây) -> dừng, trả { ok: false, text: fail }
 *   - `test` trả false -> dừng ngay với lời báo của server (failText) hoặc `fail`
 * Trả { ok, done, text? } — không bao giờ treo.
 */
export async function runSteps(steps, io, { ms: defaultMs = 5000 } = {}) {
    const bag = {};
    let done = 0;
    for (const st of steps) {
        if (st.say) io.say?.(st.say);
        const data = typeof st.data === 'function' ? st.data(bag) : st.data;
        if (st.wait) {
            const res = await new Promise((resolve) => {
                let timer = null;
                const finish = (r) => { clearTimeout(timer); io.off(st.wait, onEvent); resolve(r); };
                const onEvent = (payload) => {
                    if (st.test && !st.test(payload)) {
                        // trả lời "không được" của chính lệnh vừa gửi -> dừng; sự kiện chung (battleStart, countdown…) chưa đúng thì đợi tiếp
                        if (st.failText) finish({ ok: false, text: st.failText(payload) || st.fail });
                        return;
                    }
                    finish({ ok: true, payload });
                };
                io.on(st.wait, onEvent);
                timer = setTimeout(() => finish({ ok: false, text: `${st.fail ?? `Không thấy máy chủ trả lời (${st.wait})`} — quá ${Math.round((st.ms ?? defaultMs) / 100) / 10} giây` }), st.ms ?? defaultMs);
                if (st.emit) io.emit(st.emit, data);
            });
            if (!res.ok) return { ok: false, done, text: res.text };
            if (st.save) bag[st.save] = res.payload;
        } else if (st.emit) io.emit(st.emit, data);
        else if (st.ui) await io.ui(st.ui, st.arg, bag);
        else if (st.delay) await new Promise(r => setTimeout(r, st.delay));
        done++;
    }
    return { ok: true, done };
}
