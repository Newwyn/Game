// ============================================================
// BẢN ĐỒ THẾ GIỚI — kiểu Pokémon (nhìn từ trên xuống, đi theo ô) · tộc Người
// Dữ liệu + luật thuần (không socket); server.js nối. Vị trí từng NPC / đồ vật trên lưới ô nằm ở client (src/world/maps.js);
// ở đây chỉ có id + luật (mở khu, rương, mỏ, việc, câu đố, sự kiện cốt truyện). Mọi ngẫu nhiên dùng rng() truyền vào.
// Lời thoại có chỗ đổi theo nhân vật chính Nam / Nữ: {cau} cậu/cô · {anh} anh/chị · {chang} chàng trai/cô gái · {ten} tên.
// ============================================================
const W = require('./wallet');
const CHAPTER = require('./chapter1');

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
const PAGES = ['I', 'II', 'III', 'IV'];   // trang sách xé ở thư viện: xếp đúng thứ tự
const MINE_COOLDOWN = 4 * 3600 * 1000;    // mạch đá hồi sau 4 giờ (giờ thật)

// ---------- 5 bản đồ ----------
// objects: chest (rương 1 lần) · mine (mạch đá, hồi theo giờ) · item (vật nhiệm vụ) · puzzle · stageBoard (bảng chọn ải)
//          secret (lối bí mật) · event (sự kiện cốt truyện -> vào ải)
const SCENES = {
    ashford: {
        area: 'village', name: 'Làng Ashford',
        npcs: ['mira', 'borin', 'lena', 'sera', 'rok', 'villager_m', 'villager_f', 'kid'],
        objects: [
            { id: 'board', type: 'stageBoard', label: 'Bảng ải' },
            { id: 'well', type: 'puzzle', puzzle: 'well', label: 'Giếng Cổ' },
            { id: 'sq_chest', type: 'chest', reward: { gold: 300 } },
            { id: 'well_chest', type: 'chest', reward: { diamond: 20 } },
        ],
    },
    outskirts: {
        area: 'outskirts', name: 'Ngoại ô · Cánh đồng & Mỏ đá',
        npcs: ['farmer', 'jessica'],
        objects: [
            { id: 'ambush', type: 'event', event: 'jess', label: 'Có tiếng ồn…' },
            { id: 'wheat', type: 'item', item: 'wheat', quest: 'lena', label: 'Lúa mì vàng' },
            { id: 'mine', type: 'mine', label: 'Mạch đá' },
            { id: 'hammer', type: 'item', item: 'hammer', quest: 'borin', label: 'Búa của bác Borin' },
            { id: 'field_chest', type: 'chest', reward: { gold: 400, stone: 3 } },
        ],
    },
    forest: {
        area: 'outskirts', name: 'Rừng Sương',
        npcs: [],
        objects: [
            { id: 'mushroom', type: 'item', item: 'mushroom', quest: 'lena', label: 'Nấm sương' },
            { id: 'herb', type: 'item', item: 'herb', quest: 'sera', label: 'Thảo dược' },
            { id: 'forest_chest', type: 'chest', reward: { diamond: 15 } },
        ],
    },
    road: {
        area: 'road', name: 'Đường Vương Đạo',
        npcs: ['guard', 'merchant'],
        objects: [{ id: 'bridge_chest', type: 'chest', reward: { gold: 600 } }],
    },
    capital: {
        area: 'capital', name: 'Kinh thành Valoria',
        npcs: ['corvin', 'elise', 'nun', 'villager_m2', 'merchant2'],
        objects: [
            { id: 'gate_board', type: 'stageBoard', label: 'Bảng ải' },
            { id: 'market_chest', type: 'chest', reward: { diamond: 25 } },
            { id: 'pages', type: 'puzzle', puzzle: 'pages', label: 'Trang sách bị xé', needNo: 16 },
            { id: 'crypt', type: 'secret', label: 'Phiến đá lạ', needNo: 18, flag: 'loi_vao_ham_mo' },
        ],
    },
};
const START = { scene: 'outskirts', x: 3, y: 12, face: 'right' };

// ---------- NPC ----------
const NPCS = {
    mira: { name: 'Bà Mira', title: 'Trưởng làng', art: 'npc_mira' },
    borin: { name: 'Bác Borin', title: 'Thợ rèn', art: 'npc_borin' },
    lena: { name: 'Cô Lena', title: 'Chủ quán', art: 'npc_lena' },
    sera: { name: 'Seraphine', title: 'Nữ tu', art: 'ow_sera' },
    rok: { name: 'Rok', title: 'Đội trưởng tuần tra', art: 'ow_rok' },
    jessica: { name: 'Cô gái áo tím', title: '???', art: 'ow_jessica' },
    guard: { name: 'Lính gác', title: 'Trạm biên', art: 'npc_guard' },
    corvin: { name: 'Lão Corvin', title: 'Thủ thư', art: 'npc_corvin' },
    elise: { name: 'Công chúa Elise', title: 'Phe hòa bình', art: 'npc_elise' },
    villager_m: { name: 'Anh Tom', title: 'Dân làng', art: 'npc_villager_m', wander: true },
    villager_f: { name: 'Chị Hanna', title: 'Dân làng', art: 'npc_villager_f', wander: true },
    kid: { name: 'Bé Pip', title: 'Cậu nhóc', art: 'npc_kid', wander: true },
    farmer: { name: 'Lão Gus', title: 'Nông dân', art: 'npc_farmer' },
    merchant: { name: 'Ông Basim', title: 'Thương nhân', art: 'npc_merchant' },
    merchant2: { name: 'Bà Rosa', title: 'Bán hoa quả', art: 'npc_villager_f', wander: true },
    nun: { name: 'Sơ Agnes', title: 'Nhà thờ', art: 'npc_nun' },
    villager_m2: { name: 'Anh lính gác thành', title: 'Kinh thành', art: 'npc_guard', wander: true },
};

// Việc: borin (N2, sau ải 4) · lena (N3, sau ải 3) · sera (Seraphine gia nhập: thảo dược, sau ải 2)
const QUESTS = {
    borin: { needNo: 4, items: ['hammer'], flag: 'bua_borin', reward: { gold: 500 } },
    lena: { needNo: 3, items: ['wheat', 'mushroom'], flag: 'nguyen_lieu_lena', reward: { gold: 300, diamond: 10 } },
    sera: { needNo: 2, items: ['herb'], flag: 'thao_duoc_sera', reward: { gold: 200 } },
};
const ITEM_NAMES = { hammer: 'Búa của bác Borin', wheat: 'Lúa mì vàng', mushroom: 'Nấm sương', herb: 'Thảo dược' };

// ---------- Nhân vật chính Nam / Nữ ----------
const WORDS = { m: { cau: 'cậu', anh: 'anh', chang: 'chàng trai', ban: 'cậu bạn' }, f: { cau: 'cô', anh: 'chị', chang: 'cô gái', ban: 'cô bạn' } };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Điền {cau} {anh} {chang} {ban} {ten} (viết hoa chữ đầu nếu token viết hoa: {Cau}) theo hồ sơ nhân vật chính */
function fill(text, player) {
    const w = WORDS[player?.gender === 'f' ? 'f' : 'm'];
    return String(text).replace(/\{(\w+)\}/g, (m, k) => {
        if (k === 'ten' || k === 'Ten') return player?.name || 'Ngươi';
        const low = k.toLowerCase();
        if (!(low in w)) return m;
        return k[0] === k[0].toUpperCase() ? cap(w[low]) : w[low];
    });
}
function setPlayer(pr, { gender, name }) {
    const g = gender === 'f' ? 'f' : gender === 'm' ? 'm' : null;
    const n = String(name ?? '').replace(/[<>{}]/g, '').trim().slice(0, 14);
    if (!g) return { ok: false, why: 'Hãy chọn Nam hoặc Nữ' };
    if (n.length < 2) return { ok: false, why: 'Tên cần ít nhất 2 ký tự' };
    pr.player = { gender: g, name: n };
    return { ok: true };
}

function ensureWorld(pr) {
    pr.world ??= {};
    const w = pr.world;
    if (!SCENES[w.scene]) { w.scene = START.scene; w.x = START.x; w.y = START.y; w.face = START.face; }   // save bản cũ (màn ngang) -> điểm đầu
    w.x ??= START.x; w.y ??= START.y; w.face ??= START.face;
    w.opened ??= {}; w.mineAt ??= {}; w.quests ??= {}; w.bag ??= {}; w.talked ??= {};
    pr.flags ??= {};
    pr.items ??= {};
    return w;
}

const areaOpen = (pr, area) => { const a = AREAS[area]; return !!a && (a.needNo === 0 || cleared(pr, a.needNo)); };
const sceneOpen = (pr, id) => !!SCENES[id] && areaOpen(pr, SCENES[id].area);

/** Sự kiện cốt truyện trên bản đồ: jess (ải 2 — bị vây đánh) · sera (ải 3 — hộ tống Seraphine vào Rừng Sương) */
function eventState(pr, ev) {
    if (ev === 'jess') return !cleared(pr, 1) ? 'later' : cleared(pr, 2) ? 'done' : 'ready';
    if (ev === 'sera') return pr.flags.thao_duoc_sera && !cleared(pr, 3) ? 'ready' : cleared(pr, 3) ? 'done' : 'later';
    return 'later';
}
const EVENT_LINES = {
    jess: [
        ['sys', 'Một đám Goblin từ bụi lúa nhảy ra, vây kín {ten} và Rok!'],
        ['goblin', 'Hố hố! Hai con mồi ngon lành. Nộp hết đồ ra đây!'],
        ['warrior', '{Cau} đứng sau ta! Chúng đông quá…'],
        ['stranger', 'Năm đánh hai? Chẳng công bằng chút nào. Để ta góp vui.'],
        ['sys', 'Một cô gái áo tím đáp xuống giữa vòng vây, hai lưỡi dao loé sấm tím.'],
    ],
    sera: [
        ['priest', 'Thảo dược này cứu được vài người, nhưng còn nhiều người bị thương lắm.'],
        ['priest', 'Sâu trong Rừng Sương có loại thảo dược quý hơn — nhưng lũ sói ở đó rất hung dữ.'],
        ['warrior', 'Để bọn ta hộ tống cô. {Ten}, đi chứ?'],
    ],
};
const EVENT_STAGE = { jess: 'c1-02', sera: 'c1-03' };

/** Lời thoại NPC theo tiến trình -> { lines: [[người nói, lời]], quest?: 'offer'|'active'|'turnin'|'done', event? } */
function npcDialog(pr, id) {
    const w = ensureWorld(pr);
    const q = QUESTS[id];
    const me = (t) => ['npc', t];
    if (id === 'sera') {
        if (!cleared(pr, 2)) return { lines: [me('Xin lỗi, ta đang lo cho người bị thương… Goblin đốt ruộng làm nhiều người bỏng nặng.')] };
        if (cleared(pr, 3)) return { lines: [me('Cảm ơn {cau} đã đưa ta vào Rừng Sương. Từ giờ ta sẽ đi cùng mọi người.')] };
        if (pr.flags.thao_duoc_sera) return { lines: EVENT_LINES.sera.map(l => [...l]), event: 'sera' };
    }
    if (q) {
        const st = w.quests[id];
        const has = q.items.every(it => w.bag[it]);
        const L = {
            borin: { done: ['Búa về tay rồi, ta lại gõ được cả ngày! Ghé lò rèn bất cứ lúc nào.', 'Trong Mỏ Sâu có lối đi ta mới đào thông — cẩn thận Goblin nhé. (Đã mở nhánh N2)'],
                lock: ['Lò rèn đang nguội vì Goblin quấy phá ngoài mỏ đá…', `Dẹp yên mỏ đá (qua ải ${q.needNo}) rồi ghé lại nhé, {chang}.`],
                turnin: ['Ôi, cây búa của ta! Ở mỏ đá à? Cảm ơn {cau} nhiều lắm!'],
                active: ['Búa của ta rơi đâu đó gần cửa mỏ đá ở Ngoại ô.'],
                offer: ['Chà, {cau} đánh Goblin giỏi đấy!', 'Hôm trước ta làm rơi cây búa gần mỏ đá… tìm giúp ta được không?'] },
            lena: { done: ['Bữa tiệc vui quá! Cả làng nhớ ơn {cau}.', '(Đã mở nhánh N3 · Bữa Tiệc Làng)', 'Quán ăn của ta mở cửa rồi — mời đồng đội ăn để thêm thân thiết nhé! (nút 🏰 Hầm ngục → 🍲 Quán ăn)'],
                lock: ['Làng đang loạn, quán ta đóng cửa tạm.', `Khi rừng bớt nguy hiểm (qua ải ${q.needNo}) ta sẽ nhờ {cau} một việc.`],
                turnin: ['Lúa mì vàng và nấm sương! Đủ nấu cả nồi lớn rồi!'],
                active: [`Còn thiếu: ${q.items.filter(it => !w.bag[it]).map(it => ITEM_NAMES[it]).join(', ')}.`, 'Lúa mì ở cánh đồng Ngoại ô, nấm sương mọc trong Rừng Sương.'],
                offer: ['Làng muốn mở tiệc mừng đánh lui Goblin.', '{Cau} tìm giúp ta Lúa mì vàng ở cánh đồng và Nấm sương trong Rừng Sương nhé?'] },
            sera: { done: [], lock: [],
                turnin: ['Thảo dược! {Cau} tìm được thật sao… Cảm ơn, ta sẽ đắp thuốc cho mọi người ngay.'],
                active: ['Thảo dược mọc ở bìa Rừng Sương, phía đông Ngoại ô. Nhờ cả vào {cau}.'],
                offer: ['Ta là Seraphine, nữ tu từ kinh thành đến cứu tế.', 'Ta cần thảo dược để chữa bỏng cho dân làng — {cau} hái giúp ta ở bìa Rừng Sương được không?'] },
        }[id];
        if (st === 'done') return { lines: L.done.map(me), quest: 'done' };
        if (!cleared(pr, q.needNo)) return { lines: L.lock.map(me) };
        if (st === 'active' && has) return { lines: L.turnin.map(me), quest: 'turnin' };
        if (st === 'active') return { lines: L.active.map(me), quest: 'active' };
        return { lines: L.offer.map(me), quest: 'offer' };
    }
    const T = {
        mira: cleared(pr, 1)
            ? ['{Cau} đã giúp làng một phen. Già có bài đồng dao cổ, kể từ hồi còn bé:', `“${RHYME}”`, 'Người ta bảo Giếng Cổ phía tây giữ bí mật gì đó… Cứ thử xoay theo lời hát xem.']
            : ['Ôi, {chang} tỉnh rồi à? Rok đưa {cau} về từ đống đổ nát ngoài làng đấy.', 'Goblin sắp kéo tới cổng làng — xem Bảng ải giữa quảng trường để cùng Rok chặn chúng.'],
        rok: cleared(pr, 1)
            ? ['Trận vừa rồi… {cau} ra lệnh, ta làm theo như thể đã quen từ lâu.', 'Mạnh lên rồi ta sẽ đi tiếp. Xem Bảng ải khi sẵn sàng.']
            : ['Ta là Rok, đội trưởng tuần tra. {Cau} không nhớ gì thật sao?', 'Thôi được, cứ ở cạnh ta. Bảng ải giữa quảng trường ghi những nơi đang có Goblin.'],
        jessica: cleared(pr, 2)
            ? ['Đừng hỏi ta là ai. Cứ coi ta là… một người bạn đi đường.', 'Mà {cau} ra lệnh trận đánh cũng ra gì đấy.']
            : ['…', '(Cô gái áo tím đứng tựa gốc cây, lặng lẽ quan sát.)'],
        guard: cleared(pr, 12) ? ['Các người đã giải oan cho cô gái Elf kia… Đường lên kinh thành mở rồi, đi đi.']
            : ['Đứng lại! Trạm gác đang lục soát gián điệp.', 'Không có lệnh của Đại tướng thì không ai được qua. (Qua ải 12 để vào kinh thành)'],
        corvin: cleared(pr, 16) ? ['Lũ lính đã xé nát cuốn sách về Thất Thánh…', 'Ta nhặt được 4 mảnh trang. Giúp ta xếp lại đúng thứ tự — số La Mã ở góc mỗi mảnh.']
            : ['Thư viện đang bị lính Đại tướng lục soát. Quay lại sau nhé, {chang}.'],
        elise: cleared(pr, 18) ? ['Đại tướng cất giấu gì đó dưới lâu đài.', 'Có một phiến đá lạ ở góc vườn cung điện… {cau} thử xem.']
            : ['Cha ta đang bị Đại tướng thao túng. Xin {cau} hãy giúp phe hòa bình.'],
        villager_m: ['Hôm qua Goblin đốt mất kho lúa nhà tôi. Mong là các {anh} dẹp được chúng.'],
        villager_f: ['Bà Mira hay kể chuyện về Giếng Cổ lắm. Nghe nói dưới đáy giếng có thứ gì đó…'],
        kid: ['{Anh} ơi, lớn lên em cũng sẽ làm hiệp sĩ như anh Rok!', '(Bé Pip vung thanh kiếm gỗ.)'],
        farmer: ['Ruộng lúa năm nay vàng ươm, vậy mà lũ Goblin cứ rình đốt.', 'Mạch đá phía đông bắc đào được Đá Cường Hoá đấy — mấy giờ lại lộ ra lớp mới.'],
        merchant: ['Hàng từ kinh thành đây! … À mà đường lên đó đang bị chặn, bán chẳng được bao nhiêu.'],
        merchant2: ['Táo đỏ, lê vàng! Kinh thành dạo này lính tráng nhiều quá, khách cũng ngại ra chợ.'],
        nun: ['Phe hòa bình vẫn cầu nguyện mỗi ngày. Chiến tranh chẳng đem lại điều gì tốt đẹp.'],
        villager_m2: ['Có lệnh của Đại tướng: ai thấy người Elf thì phải báo ngay. Lạ thật…'],
    }[id] ?? ['…'];
    return { lines: T.map(me) };
}

const findObj = (sceneId, objId) => SCENES[sceneId]?.objects.find(o => o.id === objId) ?? null;
const ok = (extra = {}) => ({ ok: true, ...extra });
const no = (why) => ({ ok: false, why });
function giveReward(wallet, reward) {
    for (const [k, v] of Object.entries(reward ?? {})) W.add(wallet, k, v);
    return { ...reward };
}
const rewardText = (r) => Object.entries(r).map(([k, v]) => `+${v} ${{ gold: 'Vàng', diamond: 'Kim Cương', stone: 'Đá Cường Hoá' }[k]}`).join(' · ');

/** Đổi màn / vị trí ô (chỉ vào được màn đã mở) */
function move(pr, sceneId, x, y, face) {
    const w = ensureWorld(pr);
    if (!sceneOpen(pr, sceneId)) return no(`Khu này mở khi qua ải ${SCENES[sceneId] ? AREAS[SCENES[sceneId].area].needNo : '?'}`);
    w.scene = sceneId;
    w.x = Math.max(0, Math.min(200, Math.round(Number(x) || 0)));
    w.y = Math.max(0, Math.min(200, Math.round(Number(y) || 0)));
    if (['up', 'down', 'left', 'right'].includes(face)) w.face = face;
    return ok();
}

/** Tương tác NPC / đồ vật. data: { answer?: string[] }. Trả { ok, why?, text?, lines?, rewards?, flag?, startStage? } */
function interact(pr, wallet, sceneId, targetId, data = {}, now = Date.now(), rng = Math.random) {
    const w = ensureWorld(pr);
    if (!sceneOpen(pr, sceneId)) return no('Khu này chưa mở');
    const s = SCENES[sceneId];
    if (s.npcs.includes(targetId)) {
        w.talked[targetId] = true;
        const q = QUESTS[targetId];
        const d = npcDialog(pr, targetId);
        if (d.event) return ok({ lines: d.lines, startStage: EVENT_STAGE[d.event] });
        if (q && d.quest === 'offer') { w.quests[targetId] = 'active'; return ok({ text: 'Nhận việc', lines: d.lines }); }
        if (q && d.quest === 'turnin') {
            w.quests[targetId] = 'done';
            for (const it of q.items) delete w.bag[it];
            pr.flags[q.flag] = true;
            const rewards = giveReward(wallet, q.reward);
            return ok({ text: `Hoàn thành việc: ${rewardText(rewards)}${targetId === 'sera' ? '' : ' · Mở nhánh ải mới!'}`, lines: d.lines, rewards, flag: q.flag });
        }
        return ok({ lines: d.lines });
    }
    const o = findObj(sceneId, targetId);
    if (!o) return no('Không có gì ở đây');
    if (o.needNo && !cleared(pr, o.needNo)) return no(`Chưa thể làm gì — qua ải ${o.needNo} trước`);
    if (o.type === 'chest') {
        if (w.opened[o.id]) return no('Rương trống rỗng');
        w.opened[o.id] = true;
        return ok({ text: `Mở rương: ${rewardText(giveReward(wallet, o.reward))}`, rewards: o.reward });
    }
    if (o.type === 'mine') {
        const at = w.mineAt[o.id] ?? 0;
        if (now < at) return no(`Mạch đá đã cạn — hồi sau ${Math.ceil((at - now) / 60000)} phút`);
        w.mineAt[o.id] = now + MINE_COOLDOWN;
        const stone = 3 + Math.floor(rng() * 3) + (cleared(pr, 10) ? 3 : 0);
        return ok({ text: `Đào được ${rewardText(giveReward(wallet, { stone }))} (mạch đá hồi sau 4 giờ)`, rewards: { stone } });
    }
    if (o.type === 'item') {
        const q = QUESTS[o.quest];
        if (w.quests[o.quest] !== 'active') return no(w.quests[o.quest] === 'done' ? 'Đã xong việc này rồi' : 'Có vẻ ai đó cần thứ này… (chưa nhận việc)');
        if (w.bag[o.item]) return no('Đã nhặt rồi');
        if (!q.items.includes(o.item)) return no('Không cần thứ này');
        w.bag[o.item] = true;
        return ok({ text: `Nhặt được ${ITEM_NAMES[o.item]}` });
    }
    if (o.type === 'puzzle') {
        const flag = o.puzzle === 'well' ? 'gieng_co' : 'trang_sach';
        if (pr.flags[flag]) return no('Bí mật ở đây đã được giải');
        const ans = Array.isArray(data.answer) ? data.answer : null;
        if (!ans) return ok({ puzzle: o.puzzle });
        const right = o.puzzle === 'well' ? WELL_ANSWER : PAGES;
        if (ans.length !== right.length || ans.some((v, i) => v !== right[i])) return no(o.puzzle === 'well' ? 'Giếng im lặng… thứ tự chưa đúng' : 'Các mảnh chưa khớp nhau…');
        pr.flags[flag] = true;
        const rewards = giveReward(wallet, { diamond: 30 });
        return ok({ text: `${o.puzzle === 'well' ? 'Đáy giếng phát sáng, lộ ra lối đi!' : 'Trang sách ghép lại: danh sách Thất Thánh!'} ${rewardText(rewards)} · Mở nhánh ải mới!`, rewards, flag });
    }
    if (o.type === 'secret') {
        if (pr.flags[o.flag]) return no('Lối xuống hầm mộ đã mở');
        pr.flags[o.flag] = true;
        return ok({ text: 'Phiến đá trượt sang một bên — lối xuống hầm mộ! Mở nhánh ải mới!', flag: o.flag });
    }
    if (o.type === 'event') {
        const st = eventState(pr, o.event);
        if (st === 'later') return no('Xung quanh yên ắng…');
        if (st === 'done') return no('Chỉ còn dấu chân Goblin chạy tán loạn.');
        return ok({ lines: EVENT_LINES[o.event].map(l => [...l]), startStage: EVENT_STAGE[o.event] });
    }
    if (o.type === 'stageBoard') return ok({ openStages: true });
    return no('Không có gì ở đây');
}

/** Nhật ký nhiệm vụ thuần: đọc cả save cũ mà không khởi tạo hay đổi tiến trình. */
function questLog(pr) {
    const w = pr.world ?? {};
    const bag = w.bag ?? {};
    const flags = pr.flags ?? {};
    const details = {
        sera: { title: 'Thảo dược cho Seraphine', desc: 'Seraphine cần thảo dược để chữa bỏng cho dân làng. {Cau} hãy giúp cô tìm thuốc ở bìa Rừng Sương.', extra: 'Mở sự kiện hộ tống Seraphine' },
        lena: { title: 'Nguyên liệu cho bữa tiệc', desc: 'Cô Lena muốn nấu một bữa tiệc mừng làng thoát khỏi Goblin.', extra: 'Mở nhánh N3' },
        borin: { title: 'Tìm búa cho bác Borin', desc: 'Bác Borin làm rơi cây búa gần mỏ đá Ngoại ô. Lò rèn đang chờ tiếng búa trở lại.', extra: 'Mở nhánh N2' },
    };
    const sides = Object.entries(details).map(([id, detail]) => {
        const q = QUESTS[id];
        const state = !cleared(pr, q.needNo) ? 'locked' : w.quests?.[id] === 'done' ? 'done' : w.quests?.[id] === 'active' ? 'active' : 'offered';
        const missing = q.items.filter(it => !bag[it]);
        const giver = NPCS[id].name;
        let target = null;
        let obj = state === 'locked' ? `Mở sau ải ${q.needNo}` : state === 'done' ? 'Đã hoàn thành việc' : `Nói chuyện với ${giver}`;
        if (state === 'offered' || state === 'active') target = { scene: 'ashford', kind: 'npc', id };
        if (state === 'active') {
            if (missing.length) {
                for (const [scene, data] of Object.entries(SCENES)) {
                    const item = data.objects.find(o => o.item === missing[0]);
                    if (!item) continue;
                    target = { scene, kind: 'obj', id: item.id };
                    obj = `Tìm ${ITEM_NAMES[missing[0]]} ở ${data.name} (${q.items.length - missing.length}/${q.items.length})`;
                    break;
                }
            } else obj = `Mang ${q.items.map(it => ITEM_NAMES[it]).join(', ')} về cho ${giver}`;
        }
        return { id, type: 'side', title: detail.title, giver, desc: detail.desc, state, obj,
            progress: state === 'active' ? { have: q.items.length - missing.length, need: q.items.length } : null,
            target, reward: `${rewardText(q.reward)} · ${detail.extra}`, needNo: state === 'locked' ? q.needNo : null };
    });
    const secrets = [
        { id: 'well', title: 'Bí mật Giếng Cổ', npc: 'mira', needNo: 1, flag: 'gieng_co', scene: 'ashford',
            desc: `Bà Mira kể bài đồng dao: “${RHYME}”. Có lẽ lời hát giữ bí mật của giếng.`, obj: 'Xoay các biểu tượng ở Giếng Cổ theo bài đồng dao', reward: '+30 Kim Cương · Mở nhánh N1' },
        { id: 'pages', title: 'Trang sách bị xé', npc: 'corvin', needNo: 16, flag: 'trang_sach', scene: 'capital',
            desc: 'Lão Corvin nhặt được bốn mảnh sách về Thất Thánh. Số La Mã ở góc trang sẽ giúp {cau} ghép lại.', obj: 'Xếp lại các trang sách ở thư viện hoàng gia', reward: '+30 Kim Cương · Mở nhánh N4' },
        { id: 'crypt', title: 'Lối vào hầm mộ', npc: 'elise', needNo: 18, flag: 'loi_vao_ham_mo', scene: 'capital',
            desc: 'Công chúa Elise nghi Đại tướng giấu bí mật dưới lâu đài. Một phiến đá lạ nằm trong vườn cung điện.', obj: 'Khám phá phiến đá lạ trong vườn cung điện', reward: 'Mở nhánh N5' },
    ];
    for (const q of secrets) {
        const state = flags[q.flag] ? 'done' : cleared(pr, q.needNo) ? 'active' : 'locked';
        sides.push({ id: q.id, type: 'side', title: q.title, giver: NPCS[q.npc].name, desc: q.desc, state,
            obj: state === 'locked' ? `Mở sau ải ${q.needNo}` : state === 'done' ? 'Đã khám phá bí mật' : q.obj,
            progress: null, target: state === 'active' ? { scene: q.scene, kind: 'obj', id: q.id } : null,
            reward: q.reward, needNo: state === 'locked' ? q.needNo : null });
    }
    const next = CHAPTER.stages.find(s => !cleared(pr, s.no));
    const main = { id: 'main', type: 'main', title: next ? `Chương 1 · Ải ${next.no}: ${next.name}` : 'Chương 1 · Ngọn Lửa Gây Chiến', giver: '',
        desc: !next || next.no >= 13 ? 'Cùng đồng đội vạch trần âm mưu ở kinh thành Valoria.' : next.no <= 10 ? 'Cùng Rok bảo vệ làng Ashford khỏi lũ Goblin.' : 'Theo Đường Vương Đạo, tìm đường đến kinh thành.',
        state: next ? 'active' : 'done', obj: 'Đã hoàn thành chương 1', progress: null, target: null,
        reward: 'Phần thưởng ải cốt truyện', needNo: null };
    if (next) {
        const capital = next.no >= 13 && sceneOpen(pr, 'capital');
        main.target = { scene: capital ? 'capital' : 'ashford', kind: 'obj', id: capital ? 'gate_board' : 'board' };
        main.obj = `Mở Bảng ải và đánh ải ${next.no}: ${next.name}`;
        if (next.no === 2 && eventState(pr, 'jess') === 'ready') {
            main.target = { scene: 'outskirts', kind: 'obj', id: 'ambush' };
            main.obj = 'Ra cánh đồng Ngoại ô — có tiếng ồn…';
        } else if (next.no === 3) {
            main.target = flags.thao_duoc_sera ? { scene: 'ashford', kind: 'npc', id: 'sera' } : sides.find(q => q.id === 'sera').target;
            main.obj = flags.thao_duoc_sera ? 'Nói chuyện với Seraphine để hộ tống cô vào Rừng Sương' : 'Giúp Seraphine tìm thảo dược';
        }
    }
    const order = { active: 0, offered: 1, locked: 2, done: 3 };
    return [main, ...sides.sort((a, b) => order[a.state] - order[b.state])];
}

/** Gói trạng thái gửi client (lời thoại đã điền theo Nam / Nữ ở server.js) */
function worldState(pr, now = Date.now()) {
    const w = ensureWorld(pr);
    if (!sceneOpen(pr, w.scene)) { w.scene = START.scene; w.x = START.x; w.y = START.y; }
    const scenes = {};
    for (const [id, s] of Object.entries(SCENES)) {
        scenes[id] = {
            id, name: s.name, area: s.area, areaName: AREAS[s.area].name, open: sceneOpen(pr, id), needNo: AREAS[s.area].needNo,
            npcs: s.npcs.map(n => {
                const d = npcDialog(pr, n);
                const hidden = (n === 'sera' && cleared(pr, 3)) || (n === 'jessica' && !cleared(pr, 2));   // đã gia nhập đội / chưa xuất hiện
                return { id: n, ...NPCS[n], hidden, mark: d.event ? '!' : d.quest === 'offer' ? '!' : d.quest === 'turnin' ? '?' : null };
            }),
            objects: s.objects.map(o => {
                const st = o.type === 'chest' ? (w.opened[o.id] ? 'done' : 'ready')
                    : o.type === 'mine' ? (now < (w.mineAt[o.id] ?? 0) ? 'cooldown' : 'ready')
                    : o.type === 'item' ? (w.quests[o.quest] === 'active' && !w.bag[o.item] ? 'ready' : 'hidden')
                    : o.type === 'puzzle' ? (pr.flags[o.puzzle === 'well' ? 'gieng_co' : 'trang_sach'] ? 'done' : (o.needNo && !cleared(pr, o.needNo) ? 'locked' : 'ready'))
                    : o.type === 'secret' ? (pr.flags[o.flag] ? 'done' : (cleared(pr, o.needNo) ? 'ready' : 'hidden'))
                    : o.type === 'event' ? eventState(pr, o.event)
                    : 'ready';
                return { id: o.id, type: o.type, label: o.label ?? (o.type === 'chest' ? 'Rương' : ''), state: st, puzzle: o.puzzle, item: o.item,
                    readyIn: o.type === 'mine' ? Math.max(0, (w.mineAt[o.id] ?? 0) - now) : 0 };
            }),
        };
    }
    return { scene: w.scene, x: w.x, y: w.y, face: w.face, scenes, bag: Object.keys(w.bag).map(it => ({ id: it, name: ITEM_NAMES[it] })),
        wellSymbols: WELL_SYMBOLS, pages: PAGES, player: pr.player ?? null, quests: questLog(pr) };
}

module.exports = { AREAS, SCENES, NPCS, QUESTS, START, WELL_SYMBOLS, WELL_ANSWER, PAGES, RHYME, MINE_COOLDOWN, EVENT_STAGE,
    ensureWorld, areaOpen, sceneOpen, npcDialog, move, interact, worldState, questLog, fill, setPlayer, eventState };
