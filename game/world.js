// ============================================================
// BẢN ĐỒ THẾ GIỚI (P3) — tộc Người: màn ngang, NPC, rương, mỏ đá, nhiệm vụ / câu đố mở nhánh ải
// Dữ liệu + luật thuần (không socket); server.js nối. Mọi ngẫu nhiên dùng rng() truyền vào.
// Toạ độ x tính bằng "đơn vị màn": 0 = mép trái, width = mép phải (1 màn hình ≈ 1000).
// ============================================================
const W = require('./wallet');

const stage = (no) => `c1-${String(no).padStart(2, '0')}`;
const cleared = (pr, no) => pr.campaign?.cleared?.story?.[stage(no)] === true;

// Khu vực: mở khi qua ải (Cốt truyện)
const AREAS = {
    village: { name: 'Làng Ashford', needNo: 0 },
    outskirts: { name: 'Ngoại ô làng', needNo: 0 },
    road: { name: 'Đường Vương Đạo', needNo: 10 },
    capital: { name: 'Kinh thành Valoria', needNo: 12 },
};

// Bài đồng dao của bà Mira = thứ tự 4 biểu tượng ở Giếng Cổ
const WELL_SYMBOLS = ['☀️', '🌙', '⭐', '💧'];
const WELL_ANSWER = ['☀️', '🌙', '⭐', '💧'];
const RHYME = 'Mặt trời thức dậy, trăng lên đầu non · Sao rơi xuống giếng, nước về với con';
// Trang sách xé ở thư viện: xếp đúng thứ tự I → IV
const PAGES = ['I', 'II', 'III', 'IV'];

const MINE_COOLDOWN = 4 * 3600 * 1000;   // mỏ đá hồi sau 4 giờ (giờ thật)

// ---------- Các màn ----------
// objects: chest (rương 1 lần) · mine (mỏ đá, hồi theo giờ) · item (vật nhiệm vụ) · puzzle · stageBoard (bảng chọn ải) · secret
const SCENES = {
    village_square: {
        area: 'village', name: 'Quảng trường Ashford', width: 2000, bg: 'village_square',
        portals: [{ x: 60, to: 'village_well', toX: 1840, label: 'Giếng Cổ' }, { x: 1940, to: 'village_street', toX: 120, label: 'Phố Lò rèn' }],
        npcs: [{ id: 'mira', x: 760 }],
        objects: [{ id: 'board', type: 'stageBoard', x: 1240, icon: '📜', label: 'Bảng ải' },
            { id: 'sq_chest', type: 'chest', x: 1600, reward: { gold: 300 } }],
    },
    village_well: {
        area: 'village', name: 'Giếng Cổ', width: 1900, bg: 'village_well',
        portals: [{ x: 1840, to: 'village_square', toX: 120, label: 'Quảng trường' }],
        npcs: [],
        objects: [{ id: 'well', type: 'puzzle', puzzle: 'well', x: 900, icon: '✨', label: 'Giếng Cổ' },
            { id: 'well_chest', type: 'chest', x: 220, reward: { diamond: 20 }, hidden: true }],
    },
    village_street: {
        area: 'village', name: 'Phố Lò rèn & Quán ăn', width: 2200, bg: 'village_street',
        portals: [{ x: 60, to: 'village_square', toX: 1880, label: 'Quảng trường' }, { x: 2140, to: 'outskirts_field', toX: 120, label: 'Ra ngoại ô' }],
        npcs: [{ id: 'borin', x: 620 }, { id: 'lena', x: 1500 }],
        objects: [],
    },
    outskirts_field: {
        area: 'outskirts', name: 'Cánh đồng', width: 2400, bg: 'outskirts_field',
        portals: [{ x: 60, to: 'village_street', toX: 2080, label: 'Về làng' }, { x: 2340, to: 'outskirts_mine', toX: 120, label: 'Mỏ đá' }],
        npcs: [],
        objects: [{ id: 'wheat', type: 'item', item: 'wheat', quest: 'lena', x: 1500, icon: '🌾', label: 'Lúa mì vàng' },
            { id: 'field_chest', type: 'chest', x: 2050, reward: { gold: 400, stone: 3 } }],
    },
    outskirts_mine: {
        area: 'outskirts', name: 'Mỏ đá bỏ hoang', width: 2000, bg: 'outskirts_mine',
        portals: [{ x: 60, to: 'outskirts_field', toX: 2280, label: 'Cánh đồng' }, { x: 1940, to: 'outskirts_forest', toX: 120, label: 'Rừng Sương' }],
        npcs: [],
        objects: [{ id: 'mine', type: 'mine', x: 900, icon: '⛏️', label: 'Mạch đá' },
            { id: 'hammer', type: 'item', item: 'hammer', quest: 'borin', x: 1550, icon: '🔨', label: 'Búa của bác Borin' }],
    },
    outskirts_forest: {
        area: 'outskirts', name: 'Rừng Sương', width: 2200, bg: 'outskirts_forest',
        portals: [{ x: 60, to: 'outskirts_mine', toX: 1880, label: 'Mỏ đá' }, { x: 2140, to: 'road_bridge', toX: 120, label: 'Đường Vương Đạo' }],
        npcs: [],
        objects: [{ id: 'mushroom', type: 'item', item: 'mushroom', quest: 'lena', x: 1100, icon: '🍄', label: 'Nấm sương' },
            { id: 'forest_chest', type: 'chest', x: 1800, reward: { diamond: 15 }, hidden: true }],
    },
    road_bridge: {
        area: 'road', name: 'Cầu Đá', width: 2000, bg: 'road_bridge',
        portals: [{ x: 60, to: 'outskirts_forest', toX: 2080, label: 'Rừng Sương' }, { x: 1940, to: 'road_outpost', toX: 120, label: 'Trạm gác' }],
        npcs: [],
        objects: [{ id: 'bridge_chest', type: 'chest', x: 1300, reward: { gold: 600 } }],
    },
    road_outpost: {
        area: 'road', name: 'Trạm gác biên', width: 1900, bg: 'road_outpost',
        portals: [{ x: 60, to: 'road_bridge', toX: 1880, label: 'Cầu Đá' }, { x: 1840, to: 'capital_gate', toX: 120, label: 'Kinh thành' }],
        npcs: [{ id: 'guard', x: 1000 }],
        objects: [],
    },
    capital_gate: {
        area: 'capital', name: 'Cổng thành Valoria', width: 2000, bg: 'capital_gate',
        portals: [{ x: 60, to: 'road_outpost', toX: 1780, label: 'Trạm gác' }, { x: 1940, to: 'capital_market', toX: 120, label: 'Khu chợ' }],
        npcs: [],
        objects: [{ id: 'gate_board', type: 'stageBoard', x: 1000, icon: '📜', label: 'Bảng ải' }],
    },
    capital_market: {
        area: 'capital', name: 'Khu chợ', width: 2400, bg: 'capital_market',
        portals: [{ x: 60, to: 'capital_gate', toX: 1880, label: 'Cổng thành' }, { x: 2340, to: 'capital_library', toX: 120, label: 'Thư viện' }],
        npcs: [],
        objects: [{ id: 'market_chest', type: 'chest', x: 1700, reward: { diamond: 25 }, hidden: true }],
    },
    capital_library: {
        area: 'capital', name: 'Thư viện hoàng gia', width: 1800, bg: 'capital_library',
        portals: [{ x: 60, to: 'capital_market', toX: 2280, label: 'Khu chợ' }, { x: 1740, to: 'capital_castle', toX: 120, label: 'Cung điện' }],
        npcs: [{ id: 'corvin', x: 600 }],
        objects: [{ id: 'pages', type: 'puzzle', puzzle: 'pages', x: 1200, icon: '📖', label: 'Trang sách bị xé', needNo: 16 }],
    },
    capital_castle: {
        area: 'capital', name: 'Cung điện', width: 2000, bg: 'capital_castle',
        portals: [{ x: 60, to: 'capital_library', toX: 1680, label: 'Thư viện' }],
        npcs: [{ id: 'elise', x: 900 }],
        objects: [{ id: 'crypt', type: 'secret', x: 1700, icon: '✨', label: 'Phiến đá lạ', needNo: 18, flag: 'loi_vao_ham_mo' }],
    },
};
const START = { scene: 'village_square', x: 400 };

// ---------- NPC (hội thoại theo tiến trình) ----------
const NPCS = {
    mira: { name: 'Bà Mira', title: 'Trưởng làng', emoji: '👵', art: 'mira' },
    borin: { name: 'Bác Borin', title: 'Thợ rèn', emoji: '🧔', art: 'borin' },
    lena: { name: 'Cô Lena', title: 'Chủ quán', emoji: '👩‍🍳', art: 'lena' },
    guard: { name: 'Lính gác', title: 'Trạm biên', emoji: '💂', art: 'guard' },
    corvin: { name: 'Lão Corvin', title: 'Thủ thư', emoji: '🧙', art: 'corvin' },
    elise: { name: 'Công chúa Elise', title: 'Phe hòa bình', emoji: '👸', art: 'elise' },
};

// Nhiệm vụ: borin (N2, sau ải 4) · lena (N3, sau ải 3)
const QUESTS = {
    borin: { needNo: 4, items: ['hammer'], flag: 'bua_borin', reward: { gold: 500 } },
    lena: { needNo: 3, items: ['wheat', 'mushroom'], flag: 'nguyen_lieu_lena', reward: { gold: 300, diamond: 10 } },
};
const ITEM_NAMES = { hammer: 'Búa của bác Borin', wheat: 'Lúa mì vàng', mushroom: 'Nấm sương' };

function ensureWorld(pr) {
    pr.world ??= {};
    const w = pr.world;
    w.scene ??= START.scene;
    w.x ??= START.x;
    w.opened ??= {};      // rương đã mở
    w.mineAt ??= {};      // mỏ: lần đào kế tiếp (ms)
    w.quests ??= {};      // id -> 'active' | 'done'
    w.bag ??= {};         // vật nhiệm vụ đang cầm
    w.talked ??= {};      // đã nói chuyện (để mở gợi ý)
    pr.flags ??= {};
    pr.items ??= {};
    return w;
}

function areaOpen(pr, area) {
    const a = AREAS[area];
    return !!a && (a.needNo === 0 || cleared(pr, a.needNo));
}
function sceneOpen(pr, id) {
    const s = SCENES[id];
    return !!s && areaOpen(pr, s.area);
}

/** Lời thoại NPC theo tiến trình -> { lines, quest?: 'offer'|'active'|'turnin'|'done' } */
function npcDialog(pr, id) {
    const w = ensureWorld(pr);
    const q = QUESTS[id];
    if (q) {
        const st = w.quests[id];
        const has = q.items.every(it => w.bag[it]);
        if (st === 'done') return { lines: id === 'borin'
            ? ['Búa về tay rồi, ta lại gõ được cả ngày! Ghé lò rèn bất cứ lúc nào.', 'À, trong Mỏ Sâu có lối đi ta mới đào thông — cẩn thận Goblin nhé. (Đã mở nhánh N2)']
            : ['Bữa tiệc vui quá! Cả làng nhớ ơn các cháu.', '(Đã mở nhánh N3 · Bữa Tiệc Làng)',
                'Quán ăn của ta mở cửa rồi — mời đồng đội ăn để thêm thân thiết nhé! (nút 🏰 Hầm ngục → 🍲 Quán ăn)'], quest: 'done' };
        if (!cleared(pr, q.needNo)) return { lines: id === 'borin'
            ? ['Lò rèn đang nguội vì Goblin quấy phá ngoài mỏ đá…', `Dẹp yên mỏ đá (qua ải ${q.needNo}) rồi ghé lại nhé.`]
            : ['Làng đang loạn, quán ta đóng cửa tạm.', `Khi rừng bớt nguy hiểm (qua ải ${q.needNo}) ta sẽ nhờ các cháu một việc.`] };
        if (st === 'active' && has) return { lines: id === 'borin'
            ? ['Ôi, cây búa của ta! Ở mỏ đá à? Cảm ơn nhiều lắm!']
            : ['Lúa mì vàng và nấm sương! Đủ nấu cả nồi lớn rồi!'], quest: 'turnin' };
        if (st === 'active') return { lines: id === 'borin'
            ? ['Búa của ta rơi đâu đó trong Mỏ đá bỏ hoang (ra ngoại ô, qua Cánh đồng).']
            : [`Còn thiếu: ${q.items.filter(it => !w.bag[it]).map(it => ITEM_NAMES[it]).join(', ')}.`, 'Lúa mì ở Cánh đồng, nấm sương mọc trong Rừng Sương.'], quest: 'active' };
        return { lines: id === 'borin'
            ? ['Chà, mấy đứa đánh Goblin giỏi đấy!', 'Hôm trước ta làm rơi cây búa trong Mỏ đá bỏ hoang… tìm giúp ta được không?']
            : ['Làng muốn mở tiệc mừng đánh lui Goblin.', 'Cháu tìm giúp ta Lúa mì vàng ở Cánh đồng và Nấm sương trong Rừng Sương nhé?'], quest: 'offer' };
    }
    if (id === 'mira') return { lines: cleared(pr, 1)
        ? ['Các cháu đã cứu làng một phen. Già có bài đồng dao cổ, kể từ hồi còn bé:', `“${RHYME}”`, 'Người ta bảo Giếng Cổ phía tây giữ bí mật gì đó… Cứ thử xoay theo lời hát xem.']
        : ['Goblin lại kéo tới cổng làng!', 'Bảng ải ở quảng trường — vào ải 1 đẩy lùi chúng giúp già.'] };
    if (id === 'guard') return { lines: cleared(pr, 12)
        ? ['Các người đã giải oan cho cô gái Elf kia… Đường lên kinh thành mở rồi, đi đi.']
        : ['Đứng lại! Trạm gác đang lục soát gián điệp.', 'Không có lệnh của Đại tướng thì không ai được qua. (Qua ải 12 để vào kinh thành)'] };
    if (id === 'corvin') return { lines: cleared(pr, 16)
        ? ['Lũ lính đã xé nát cuốn sách về Thất Thánh…', 'Ta nhặt được 4 mảnh trang. Giúp ta xếp lại đúng thứ tự — số La Mã ở góc mỗi mảnh.']
        : ['Thư viện đang bị lính Đại tướng lục soát. Quay lại sau nhé, chàng trai.'] };
    if (id === 'elise') return { lines: cleared(pr, 18)
        ? ['Đại tướng cất giấu gì đó dưới lâu đài.', 'Có một phiến đá lạ cuối hành lang phía đông… các bạn thử xem.']
        : ['Cha ta đang bị Đại tướng thao túng. Xin hãy giúp phe hòa bình.'] };
    return { lines: ['…'] };
}

const findObj = (sceneId, objId) => SCENES[sceneId]?.objects.find(o => o.id === objId) ?? null;
const ok = (extra = {}) => ({ ok: true, ...extra });
const no = (why) => ({ ok: false, why });
function giveReward(pr, wallet, reward) {
    for (const [k, v] of Object.entries(reward ?? {})) W.add(wallet, k, v);
    return { ...reward };
}
const rewardText = (r) => Object.entries(r).map(([k, v]) => `+${v} ${{ gold: 'Vàng', diamond: 'Kim Cương', stone: 'Đá Cường Hoá' }[k]}`).join(' · ');

/** Đổi màn / vị trí (chỉ vào được màn đã mở) */
function move(pr, sceneId, x) {
    const w = ensureWorld(pr);
    if (!sceneOpen(pr, sceneId)) return no(`Khu này mở khi qua ải ${SCENES[sceneId] ? AREAS[SCENES[sceneId].area].needNo : '?'}`);
    const s = SCENES[sceneId];
    w.scene = sceneId;
    w.x = Math.max(0, Math.min(s.width, Number(x) || 0));
    return ok();
}

/**
 * Tương tác với NPC / vật thể. data: { answer?: string[] } cho câu đố.
 * Trả về { ok, why?, text?, rewards?, flag?, done? }
 */
function interact(pr, wallet, sceneId, targetId, data = {}, now = Date.now(), rng = Math.random) {
    const w = ensureWorld(pr);
    if (!sceneOpen(pr, sceneId)) return no('Khu này chưa mở');
    const s = SCENES[sceneId];
    // NPC: nhận / trả nhiệm vụ
    if (s.npcs.some(n => n.id === targetId)) {
        w.talked[targetId] = true;
        const q = QUESTS[targetId];
        const d = npcDialog(pr, targetId);
        if (q && d.quest === 'offer') { w.quests[targetId] = 'active'; return ok({ text: 'Nhận nhiệm vụ', lines: d.lines }); }
        if (q && d.quest === 'turnin') {
            w.quests[targetId] = 'done';
            for (const it of q.items) delete w.bag[it];
            pr.flags[q.flag] = true;
            const rewards = giveReward(pr, wallet, q.reward);
            return ok({ text: `Hoàn thành nhiệm vụ: ${rewardText(rewards)} · Mở nhánh ải mới!`, lines: d.lines, rewards, flag: q.flag });
        }
        return ok({ lines: d.lines });
    }
    const o = findObj(sceneId, targetId);
    if (!o) return no('Không có gì ở đây');
    if (o.needNo && !cleared(pr, o.needNo)) return no(`Chưa thể làm gì — qua ải ${o.needNo} trước`);
    if (o.type === 'chest') {
        if (w.opened[o.id]) return no('Rương trống rỗng');
        w.opened[o.id] = true;
        const rewards = giveReward(pr, wallet, o.reward);
        return ok({ text: `Mở rương: ${rewardText(rewards)}`, rewards });
    }
    if (o.type === 'mine') {
        const at = w.mineAt[o.id] ?? 0;
        if (now < at) return no(`Mạch đá đã cạn — hồi sau ${Math.ceil((at - now) / 60000)} phút`);
        w.mineAt[o.id] = now + MINE_COOLDOWN;
        const stone = 3 + Math.floor(rng() * 3) + (cleared(pr, 10) ? 3 : 0);
        const rewards = giveReward(pr, wallet, { stone });
        return ok({ text: `Đào được ${rewardText(rewards)} (mạch đá hồi sau 4 giờ)`, rewards });
    }
    if (o.type === 'item') {
        const q = QUESTS[o.quest];
        if (w.quests[o.quest] !== 'active') return no(w.quests[o.quest] === 'done' ? 'Đã xong việc này rồi' : 'Có vẻ ai đó đánh rơi thứ này… (chưa nhận nhiệm vụ)');
        if (w.bag[o.item]) return no('Đã nhặt rồi');
        if (!q.items.includes(o.item)) return no('Không cần thứ này');
        w.bag[o.item] = true;
        return ok({ text: `Nhặt được ${ITEM_NAMES[o.item]}` });
    }
    if (o.type === 'puzzle') {
        const flag = o.puzzle === 'well' ? 'gieng_co' : 'trang_sach';
        if (pr.flags[flag]) return no('Bí mật ở đây đã được giải');
        const ans = Array.isArray(data.answer) ? data.answer : null;
        if (!ans) return ok({ puzzle: o.puzzle });   // mở bảng câu đố
        const right = o.puzzle === 'well' ? WELL_ANSWER : PAGES;
        if (ans.length !== right.length || ans.some((v, i) => v !== right[i])) return no(o.puzzle === 'well' ? 'Giếng im lặng… thứ tự chưa đúng' : 'Các mảnh chưa khớp nhau…');
        pr.flags[flag] = true;
        const rewards = giveReward(pr, wallet, { diamond: 30 });
        return ok({ text: `${o.puzzle === 'well' ? 'Đáy giếng phát sáng, lộ ra lối đi!' : 'Trang sách ghép lại: danh sách Thất Thánh!'} ${rewardText(rewards)} · Mở nhánh ải mới!`, rewards, flag });
    }
    if (o.type === 'secret') {
        if (pr.flags[o.flag]) return no('Lối xuống hầm mộ đã mở');
        pr.flags[o.flag] = true;
        return ok({ text: 'Phiến đá trượt sang một bên — lối xuống hầm mộ! Mở nhánh ải mới!', flag: o.flag });
    }
    if (o.type === 'stageBoard') return ok({ openStages: true });
    return no('Không có gì ở đây');
}

/** Gói trạng thái gửi client */
function worldState(pr, now = Date.now()) {
    const w = ensureWorld(pr);
    if (!sceneOpen(pr, w.scene)) { w.scene = START.scene; w.x = START.x; }
    const scenes = {};
    for (const [id, s] of Object.entries(SCENES)) {
        scenes[id] = {
            id, name: s.name, area: s.area, areaName: AREAS[s.area].name, width: s.width, bg: s.bg,
            open: sceneOpen(pr, id), needNo: AREAS[s.area].needNo,
            portals: s.portals.map(p => ({ ...p, open: sceneOpen(pr, p.to), needNo: AREAS[SCENES[p.to].area].needNo })),
            npcs: s.npcs.map(n => {
                const d = npcDialog(pr, n.id);
                return { ...n, ...NPCS[n.id], mark: d.quest === 'offer' ? '!' : d.quest === 'turnin' ? '?' : null };
            }),
            objects: s.objects.map(o => {
                const st = o.type === 'chest' ? (w.opened[o.id] ? 'done' : 'ready')
                    : o.type === 'mine' ? (now < (w.mineAt[o.id] ?? 0) ? 'cooldown' : 'ready')
                    : o.type === 'item' ? (w.quests[o.quest] === 'active' && !w.bag[o.item] ? 'ready' : 'hidden')
                    : o.type === 'puzzle' ? (pr.flags[o.puzzle === 'well' ? 'gieng_co' : 'trang_sach'] ? 'done' : (o.needNo && !cleared(pr, o.needNo) ? 'locked' : 'ready'))
                    : o.type === 'secret' ? (pr.flags[o.flag] ? 'done' : (cleared(pr, o.needNo) ? 'ready' : 'hidden'))
                    : 'ready';
                return { id: o.id, type: o.type, x: o.x, icon: o.icon ?? (o.type === 'chest' ? '🎁' : '❔'), label: o.label ?? (o.type === 'chest' ? 'Rương' : ''),
                    hidden: !!o.hidden, state: st, readyIn: o.type === 'mine' ? Math.max(0, (w.mineAt[o.id] ?? 0) - now) : 0, puzzle: o.puzzle };
            }),
        };
    }
    return { scene: w.scene, x: w.x, scenes, bag: Object.keys(w.bag).map(it => ({ id: it, name: ITEM_NAMES[it] })),
        wellSymbols: WELL_SYMBOLS, pages: PAGES };
}

module.exports = { AREAS, SCENES, NPCS, QUESTS, START, WELL_SYMBOLS, WELL_ANSWER, PAGES, RHYME, MINE_COOLDOWN,
    ensureWorld, areaOpen, sceneOpen, npcDialog, move, interact, worldState };
