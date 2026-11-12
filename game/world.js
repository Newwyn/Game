// ============================================================
// BẢN ĐỒ THẾ GIỚI — kiểu Pokémon (nhìn từ trên xuống, đi theo ô) · tộc Người
// Dữ liệu + luật thuần (không socket); server.js nối. Vị trí từng NPC / đồ vật trên lưới ô nằm ở client (src/world/maps.js);
// ở đây chỉ có id + luật (mở khu, rương, mỏ, việc, câu đố, sự kiện cốt truyện). Mọi ngẫu nhiên dùng rng() truyền vào.
// Lời thoại có chỗ đổi theo nhân vật chính Nam / Nữ: {cau} cậu/cô · {anh} anh/chị · {chang} chàng trai/cô gái · {ten} tên.
// ============================================================
const A = require('./account');
const E = require('./evidence');   // 🔎 sổ chứng cứ + đối chất trước nhà vua   // cấp tài khoản: EXP việc phụ, chữ báo mở khoá
const W = require('./wallet');
const CHAPTER = require('./chapter1');
const CHAPTER2 = require('./chapter2');
const Q = require('./quests');          // 📜 bộ máy nhiệm vụ (phụ / nhánh / ẩn / hằng ngày / bước chính tuyến)
const QD = require('./questData1');
const GA = require('./gather');         // 🧺 hái lượm, dụng cụ, câu cá, ghi chép, chỗ leo
const CK = require('./cooking');        // 🍲 nấu ăn
// Dùng cùng dữ liệu sinh với client, tránh giữ tọa độ của vùng cũ khi dịch chuyển.
const mapText = require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/world/maps.js'), 'utf8');
const MAPS = JSON.parse(mapText.split('export const MAPS = ')[1].trim().replace(/;$/, ''));
function sceneSpawn(id) {
    const [x, y] = MAPS[id].spawn;
    return { x, y, face: 'down' };
}
function landing(id, x, y) {
    const m = MAPS[id];
    if (Number.isInteger(x) && Number.isInteger(y) && m.grid[y]?.[x] === '.' && !(m.gaps??[]).some(p=>p[0]===x&&p[1]===y)) return { x, y };
    return sceneSpawn(id);
}

const stage = (no) => `c1-${String(no).padStart(2, '0')}`;
const cleared = (pr, no) => pr.campaign?.cleared?.story?.[stage(no)] === true;
const clearedId = (pr, id) => pr.campaign?.cleared?.story?.[id] === true;   // id ải bất kỳ chương (c2-05…)
const c2no = (id) => Number(String(id).slice(3));

// Khu vực: mở khi qua ải (Cốt truyện)
const AREAS = {
    village: { name: 'Làng Ashford', needNo: 0 },
    outskirts: { name: 'Ngoại ô làng', needNo: 0 },
    road: { name: 'Đường Vương Đạo', needNo: 10 },
    capital: { name: 'Kinh thành Valoria', needNo: 12 },
    elf: { name: 'Vùng Elf (Chương 2)', needNo: 20 },
};

// Bài đồng dao của bà Mira = thứ tự 4 biểu tượng ở Giếng Cổ
const WELL_SYMBOLS = ['☀️', '🌙', '⭐', '💧'];
const WELL_ANSWER = ['☀️', '🌙', '⭐', '💧'];
const RHYME = 'Mặt trời thức dậy, trăng lên đầu non · Sao rơi xuống giếng, nước về với con';
const PAGES = ['I', 'II', 'III', 'IV'];
const MOON_SYMBOLS = ['🌑', '🌒', '🌓', '🌕'];
const MOON_ANSWER = ['🌑', '🌒', '🌓', '🌕'];   // trăng mọc dần: non -> tròn (Aeris gợi ý)   // trang sách xé ở thư viện: xếp đúng thứ tự
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
            { id: 'well', type: 'puzzle', puzzle: 'well', label: 'Giếng Cổ', needNo: 7 },   // sau khi Sera về làng (truyện phụ 1)
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
            { id: 'pages', type: 'puzzle', puzzle: 'pages', label: 'Trang sách bị xé', needNo: 20 },   // sau khi kinh thành an toàn
            { id: 'crypt', type: 'secret', label: 'Phiến đá lạ', needNo: 20, flag: 'loi_vao_ham_mo' },   // sau lễ tang nhà vua
        ],
    },
};
// 🌲 CHƯƠNG 2 — vùng Elf (mở khi qua ải 20): đi qua cổng phía đông kinh thành
Object.assign(SCENES, {
    sylvaren: {
        area: 'elf', name: 'Bìa rừng Sylvaren',
        npcs: ['aeris', 'elfmerchant', 'elfkid'],
        objects: [
            { id: 'moonwell', type: 'puzzle', puzzle: 'moon', label: 'Suối Trăng', needStage: 'c2-06' },
            { id: 'syl_chest', type: 'chest', reward: { diamond: 30 } },
            { id: 'ruin_stone', type: 'note', label: 'Cổng đá cổ', lines: [
                'Trên cổng đá khắc chữ Elf cổ: “Bảy ngọn đuốc giữ bầu trời, một ngọn đuốc đã tắt.”',
                'Có lẽ “bảy ngọn đuốc” chính là Thất Thánh…'] },
            { id: 'shroom_glow', type: 'item', item: 'glowshroom', quest: 'aeris', label: 'Nấm phát quang' },
        ],
    },
    lunaria: {
        area: 'elf', name: 'Thành cây Lunaria', needStage: 'c2-12',   // cổng thành đóng tới khi qua Cầu Rễ (ải 12)
        npcs: ['oren', 'lun_guard', 'elfkid2'],
        objects: [
            { id: 'moon_fountain', type: 'secret', label: 'Đài phun trăng', needStage: 'c2-19', flag: 'goc_cay_me' },
            { id: 'lun_chest', type: 'chest', reward: { diamond: 40, gold: 2000 } },
            { id: 'star_tome', type: 'item', item: 'startome', quest: 'oren', label: 'Sách sao' },
            { id: 'lun_board', type: 'stageBoard', label: 'Bảng ải' },
        ],
    },
});
// 🏠 trong nhà (vào bằng cửa trên bản đồ làng, vẽ phẳng kiểu Pokémon)
Object.assign(SCENES, {
    tavern_in: {
        area: 'village', name: 'Quán của cô Lena', interior: true,
        npcs: ['bard', 'hank'],
        objects: [
            { id: 'tavern_counter', type: 'tavern', label: 'Quầy quán' },
            { id: 'tavern_chest', type: 'chest', reward: { gold: 150 } },
        ],
    },
    forge_in: {
        area: 'village', name: 'Lò rèn bác Borin', interior: true,
        npcs: ['mae'],
        objects: [
            { id: 'forge_anvil', type: 'forge', label: 'Đe rèn' },
            { id: 'forge_chest', type: 'chest', reward: { stone: 5 } },
        ],
    },
    mira_in: {
        area: 'village', name: 'Nhà Bà Mira', interior: true,
        npcs: ['ella'],
        objects: [
            { id: 'mira_shelf', type: 'note', label: 'Giá sách', lines: [
                'Một cuốn sách cũ mở sẵn: “Thuở trước, bảy vị Thánh cùng canh giữ thế giới…”',
                '“…kẻ mang dấu ấn sẽ đến khi các tộc quay giáo vào nhau.”',
                'Mấy trang sau bị xé mất. Có lẽ thư viện kinh thành còn bản đầy đủ.'] },
            { id: 'mira_chest', type: 'chest', reward: { diamond: 15 } },
        ],
    },
});
Object.assign(SCENES, {
    cathedral_in: {
        area: 'capital', name: 'Nhà thờ lớn Valoria', interior: true, interior3d: true,
        npcs: ['sister_anna'],
        objects: [
            { id: 'cathedral_note', type: 'note', label: 'Sách cầu nguyện', lines: ['Nguyện Ngọn Lửa Thánh soi đường cho người lạc bước.', 'Bên lề có nét chữ của Sera: “Sức mạnh chỉ có ý nghĩa khi ta dùng nó để che chở người khác.”'] },
            { id: 'cathedral_chest', type: 'chest', reward: { gold: 150 } },
        ],
    },
    palace_in: {
        area: 'capital', name: 'Cung điện Valoria — Sảnh ngai', interior: true, interior3d: true,
        npcs: ['palace_guard_left', 'palace_guard_right'],
        objects: [
            { id: 'palace_note', type: 'note', label: 'Chiếu chỉ hoàng gia', lines: ['Cổng thành phải mở cho dân tìm nơi trú ẩn. Không được thu thêm phí lương thực trong những ngày khó khăn.', 'Dấu son hoàng gia còn mới. Bên dưới là danh sách các kho cứu tế.'] },
            { id: 'palace_chest', type: 'chest', reward: { gold: 250 } },
        ],
    },
    archive_in: {
        area: 'capital', name: 'Thư khố Hoàng gia', interior: true, interior3d: true,
        npcs: [],
        objects: [
            { id: 'archive_note', type: 'note', label: 'Biên niên sử và bản đồ cũ', lines: ['Bản đồ ghi lại những con đường nối Valoria với các vùng đất phía đông.', 'Một dòng chú thích đã phai: “Khi bảy vị Thánh cùng giữ lời thề, ngọn lửa sẽ không lụi tắt.”'] },
            { id: 'archive_chest', type: 'chest', reward: { gold: 200 } },
        ],
    },
});
// ---------- ĐIỂM TRUYỆN + ĐIỀU TRA (chương 1) ----------
// Song song với Bảng ải: mỗi ải chính có 1 điểm trên bản đồ (gặp NPC hoặc tới đúng chỗ) -> xem lời trước ải -> mở BẢNG ẢI đúng ải đó.
//   npc: nói chuyện với NPC đó khi ải này là ải kế tiếp · obj: vật hiện ra trên bản đồ (vị trí ở src/world/mapsExtra.js)
//   ải 2 dùng sự kiện phục kích 'ambush' có sẵn · ải 18: Elise mở phần ĐỐI CHẤT (trình chứng cứ — game/evidence.js) trước
// 📜 vật / người của nhiệm vụ chương 1 (game/questData1.js QUEST_OBJECTS · vị trí ở src/world/mapsExtra.js)
for (const [id, list] of Object.entries(QD.QUEST_OBJECTS)) SCENES[id].objects.push(...list.map(o => ({ ...o })));
const QUEST_TYPES = new Set(['pickup', 'spot', 'person', 'gather', 'dailyBoard']);
// 🧺 điểm hái / chặt / đập / câu, ghi chép, bếp, bàn dụng cụ, chỗ leo, rương ẩn (game/gather.js OBJECTS · vị trí ở src/world/mapsExtra.js)
for (const [id, list] of Object.entries(GA.OBJECTS)) SCENES[id].objects.push(...list.map(o => ({ ...o })));
// Rương nhảy dùng cơ chế mở một lần đã có.
for (const [id,m] of Object.entries(MAPS)) for(const o of m.objects.filter(o=>o.id.startsWith('jump_')))
    SCENES[id].objects.push({id:o.id,type:'chest',reward:{gold:120}});

const STORY_SPOTS = {
    1: { npc: 'rok', scene: 'ashford', go: 'Gặp Rok ở cổng đông làng' },
    3: { obj: 'sp_bandage', scene: 'forest', label: 'Dải vải băng', go: 'Lần theo dải vải băng ở bìa Rừng Sương' },
    4: { npc: 'borin', scene: 'ashford', go: 'Nghe bác Borin kể chuyện mất đồ' },
    5: { obj: 'sp_wolf', scene: 'forest', label: 'Dấu chân sói lớn', go: 'Lần theo dấu chân sói lớn sâu trong Rừng Sương' },
    6: { obj: 'sp_smoke', scene: 'outskirts', label: 'Cột khói phía đông', go: 'Tới chỗ cột khói phía đông Ngoại ô' },
    7: { obj: 'sp_swamp', scene: 'forest', label: 'Lối mòn vào đầm lầy', go: 'Theo lối mòn vào đầm lầy phía nam Rừng Sương' },
    8: { obj: 'sp_grix', scene: 'forest', label: 'Tiếng kêu ở rìa đầm', go: 'Tới rìa đầm lầy — có ai đó kêu cứu' },
    9: { npc: 'mira', scene: 'ashford', go: 'Về làng gặp Bà Mira' },
    10: { npc: 'rok', scene: 'ashford', go: 'Ra cổng làng cùng Rok trước bình minh' },
    11: { obj: 'sp_bridge', scene: 'road', label: 'Xe lương bị chặn', go: 'Tới Cầu Đá trên Đường Vương Đạo' },
    12: { npc: 'guard', scene: 'road', go: 'Tới trạm kiểm soát trước kinh thành' },
    13: { obj: 'sp_square', scene: 'capital', label: 'Đám đông ồn ào', go: 'Vào quảng trường kinh thành' },
    14: { npc: 'nun', scene: 'capital', go: 'Tìm Sơ Agnes' },
    15: { obj: 'sp_archive', scene: 'capital', label: 'Lối vào kho lưu trữ', go: 'Tới lối vào kho lưu trữ hoàng gia' },
    16: { npc: 'corvin', scene: 'capital', go: 'Gặp lão Corvin' },
    17: { obj: 'sp_relief', scene: 'capital', label: 'Nhà cứu tế bị vây', go: 'Tới nhà cứu tế đang bị vây' },
    18: { npc: 'elise', scene: 'capital', go: 'Gặp Elise để vào đại sảnh đối chất' },
    19: { obj: 'sp_tower', scene: 'capital', label: 'Cầu thang tháp hiệu lệnh', go: 'Lên tháp hiệu lệnh phía bắc' },
    20: { obj: 'sp_tower', scene: 'capital', label: 'Đỉnh tháp hiệu lệnh', go: 'Lên đỉnh tháp hiệu lệnh' },
};
/** ải chính chương 1 chỉ bắt đầu được từ bản đồ (gặp NPC / tới đúng chỗ) -> { 'c1-01': 'Gặp Rok…', … } cho Bảng ải ghi gợi ý */
function spotHints() {
    const out = { 'c1-02': 'Ra cánh đồng Ngoại ô — có tiếng ồn…' };
    for (const [no, sp] of Object.entries(STORY_SPOTS)) out[`c1-${String(no).padStart(2, '0')}`] = sp.go;
    return out;
}
// vật điều tra (chứng cứ ẩn — game/evidence.js, clue): hiện sau ải needNo, nhặt xong thì biến mất
const CLUES = [
    { id: 'clue_wheel', scene: 'forest', label: 'Vết bánh xe sâu', needNo: 3 },
    { id: 'clue_arrows', scene: 'outskirts', label: 'Đống tro trạm canh', needNo: 6 },
    { id: 'clue_ledger', scene: 'ashford', label: 'Phiến đá kho giam', needNo: 10 },
    { id: 'clue_poster', scene: 'capital', label: 'Áp phích trên tường', needNo: 13 },
];
for (const [no, sp] of Object.entries(STORY_SPOTS)) {
    if (!sp.obj || SCENES[sp.scene].objects.some(o => o.id === sp.obj)) continue;
    SCENES[sp.scene].objects.push({ id: sp.obj, type: 'story', label: sp.label, stages: Object.entries(STORY_SPOTS).filter(([, x]) => x.obj === sp.obj).map(([n]) => +n) });
}
for (const c of CLUES) SCENES[c.scene].objects.push({ id: c.id, type: 'clue', label: c.label, needNo: c.needNo });
/** Ải chương 1 kế tiếp (Cốt truyện) — null nếu đã xong cả 20 */
function nextStoryNo(pr) {
    for (let n = 1; n <= 20; n++) if (!cleared(pr, n)) return n;
    return null;
}
const storyStageId = (n) => `c1-${String(n).padStart(2, '0')}`;

// ---------- VỀ BÁO LẠI (sau trận) ----------
// Thắng ải lần đầu: chỉ phần lời xảy ra TẠI CHỖ (post[n].slice(0, from)) phát ngay; phần còn lại diễn ra ở nơi khác
// -> NPC đó hiện dấu !, nói chuyện mới phát. Ải kế tiếp chỉ mở sau khi đã báo lại.
//   cutscene: client phát kiểu cắt cảnh — [[tranh nền src/assets/world/<tên>.webp, từ câu thứ mấy], …] (ải 20: phòng bệnh nhà vua -> đại sảnh lễ đăng quang) · ending: kèm lời kết chương (ải 20)
const REPORTS = {
    1: { npc: 'mira', scene: 'ashford', from: 4, go: 'Về làng — Bà Mira đang chờ với nồi cháo' },
    2: { npc: 'mira', scene: 'ashford', from: 10, go: 'Về làng báo tin cho Bà Mira' },
    7: { npc: 'sera', scene: 'ashford', from: 1, go: 'Đưa Sera về Ashford nghỉ ngơi — tới gặp cô ở làng' },
    10: { npc: 'mira', scene: 'ashford', from: 4, go: 'Mang lời khai của Skarn về cho Bà Mira' },
    14: { npc: 'nun', scene: 'capital', from: 0, go: 'Theo Sơ Agnes vào sân sau gặp công chúa Elise' },
    20: { npc: 'elise', scene: 'capital', from: 99, ending: true, cutscene: [['king_bedroom', 0], ['capital_castle', 13]], go: 'Về cung điện — Elise đang ở bên giường nhà vua' },
};
/** Ải đã thắng nhưng chưa về báo lại (nhỏ nhất) -> số ải, không có -> null */
function pendingReport(pr) {
    const done = pr.world?.reported ?? {};
    for (const n of Object.keys(REPORTS).map(Number).sort((a, b) => a - b)) if (cleared(pr, n) && !done[n]) return n;
    return null;
}
/** Ải kế tiếp đang chờ ở điểm truyện (null khi còn phải về báo lại) */
const storyNo = (pr) => (pendingReport(pr) ? null : nextStoryNo(pr));
/** Lời sau trận phát NGAY tại chỗ (server.js dùng khi thắng lần đầu) — null = phát hết như cũ */
function postNow(n, lines) {
    const r = REPORTS[n];
    return r ? (lines ?? []).slice(0, r.from) : null;
}
/** Đánh dấu mọi ải đã qua là đã báo lại (công cụ thử nhảy ải / save cũ) */
function syncReports(pr) {
    const w = ensureWorld(pr);
    w.reported = {};
    for (const n of Object.keys(REPORTS)) if (cleared(pr, +n)) w.reported[n] = true;
    Q.resetMain(pr);   // bước chính tuyến tính lại theo ải đã qua, KHÔNG trả bù Kim Cương
}

// 📜 các bước chính tuyến (mỗi bước +20 Kim Cương) dựng từ điểm truyện + ải + về báo lại
Q.setMain(QD.mainSteps(STORY_SPOTS, REPORTS, CHAPTER.stages));
/** Chỗ của NPC / vật / vật nhặt ('item:<mã>') trên bản đồ -> mục tiêu "Tự đi tới" của sổ nhiệm vụ */
Q.setLocator((id) => {
    if (!id) return null;
    for (const [scene, s] of Object.entries(SCENES)) {
        if (s.npcs.includes(id)) return { scene, kind: 'npc', id };
        const o = s.objects.find(x => (id.startsWith('item:') ? x.item === id.slice(5) : x.id === id));
        if (o) return { scene, kind: 'obj', id: o.id };
    }
    return null;
});

const START = { scene: 'outskirts', x: 3, y: 12, face: 'right' };

// ---------- NPC ----------
const NPCS = {
    sister_anna: { name: 'Sơ Anna', title: 'Người giữ Ngọn Lửa Thánh', art: 'npc_nun' },
    palace_guard_left: { name: 'Vệ binh hoàng cung', title: 'Gác sảnh ngai', art: 'npc_guard' },
    palace_guard_right: { name: 'Vệ binh hoàng cung', title: 'Gác sảnh ngai', art: 'npc_guard' },
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
    bard: { name: 'Finn', title: 'Người hát rong', art: 'npc_bard' },
    aeris: { name: 'Đội trưởng Aeris', title: 'Tuần biên Elf', art: 'npc_aeris' },
    elfmerchant: { name: 'Cô Lirien', title: 'Thương nhân thảo dược', art: 'npc_elfmerchant' },
    elfkid: { name: 'Bé Tavi', title: 'Elf nhỏ', art: 'npc_elfkid', wander: true },
    oren: { name: 'Trưởng lão Oren', title: 'Lunaria', art: 'npc_oren' },
    lun_guard: { name: 'Vệ binh Lunaria', title: 'Cổng thành', art: 'npc_aeris' },
    elfkid2: { name: 'Bé Mio', title: 'Elf nhỏ', art: 'npc_elfkid', wander: true },
    hank: { name: 'Lão Hank', title: 'Khách quen', art: 'npc_villager_m' },
    mae: { name: 'Mae', title: 'Thợ học việc', art: 'npc_apprentice' },
    ella: { name: 'Bé Ella', title: 'Cháu Bà Mira', art: 'npc_ella', wander: true },
};

// Việc: borin (N2, sau ải 4) · lena (N3, sau ải 10) · sera (sau khi được cứu ở ải 7: thuốc cho nhà cứu tế Ashford)
// from: ải đã qua; until: ải chưa qua. Báo lại luôn ưu tiên hơn điều kiện ẩn.
Object.assign(NPCS.sera,{showWhen:{from:'c1-07',quest:'sera'}});
Object.assign(NPCS.jessica,{showWhen:{from:'c1-02',until:'c1-03'}});
Object.assign(NPCS.rok,{showWhen:{until:'c1-10'}});
Object.assign(NPCS.guard,{showWhen:{from:'c1-10',until:'c1-12'}});
Object.assign(NPCS.nun,{showWhen:{from:'c1-13',until:'c1-15'}});
Object.assign(NPCS.elise,{showWhen:{from:'c1-14',until:'c1-20'}});
for(const s of Object.values(SCENES)) for(const o of s.objects) if(o.type==='story') {
    const first=Math.min(...o.stages),last=Math.max(...o.stages);
    o.showWhen={from:stage(first-1),until:stage(last)};
}
function shown(pr,def,id) {
    if(Object.entries(REPORTS).some(([n,r])=>r.npc===id&&cleared(pr,+n)&&!pr.world?.reported?.[n])) return true;
    const c=def?.showWhen;
    if(!c) return true;
    if(NPCS[id]===def && Q.needed(pr,id)) return true;   // nhiệm vụ đang cần người này (giao / trả / hỏi chuyện)
    return (!c.from||c.from==='c1-00'||clearedId(pr,c.from))&&(!c.until||!clearedId(pr,c.until))&&(!c.quest||pr.world?.quests?.[c.quest]!=='done');
}

const QUESTS = {
    borin: { needNo: 4, items: ['hammer'], flag: 'bua_borin', reward: { gold: 500 } },
    lena: { needNo: 10, items: ['wheat', 'mushroom'], flag: 'nguyen_lieu_lena', reward: { gold: 300, diamond: 10 } },
    sera: { needNo: 7, items: ['herb'], flag: 'thao_duoc_sera', reward: { gold: 500 } },
    aeris: { needStage: 'c2-04', items: ['glowshroom'], flag: 'nam_phat_quang', reward: { gold: 2000, diamond: 20 } },
    oren: { needStage: 'c2-14', items: ['startome'], flag: 'lang_elf_co', reward: { gold: 3000, diamond: 30 } },
};
const ITEM_NAMES = { hammer: 'Búa của bác Borin', wheat: 'Lúa mì vàng', mushroom: 'Nấm sương', herb: 'Thảo dược', glowshroom: 'Nấm phát quang', startome: 'Sách sao cổ', ...QD.ITEM_NAMES };
const questOpen = (pr, q) => (q.needStage ? clearedId(pr, q.needStage) : cleared(pr, q.needNo));
const questNeedText = (q) => (q.needStage ? `ải ${c2no(q.needStage)} chương 2` : `ải ${q.needNo}`);

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
    Object.assign(w, landing(w.scene, w.x, w.y)); w.face ??= START.face;
    w.opened ??= {}; w.mineAt ??= {}; w.quests ??= {}; w.bag ??= {}; w.talked ??= {};
    if (!w.reported) { w.reported = {}; for (const n of Object.keys(REPORTS)) if (cleared(pr, +n)) w.reported[n] = true; }   // save cũ: các ải đã qua coi như đã báo
    pr.flags ??= {};
    pr.items ??= {};
    w.gather ??= {};
    CK.ensure(pr);   // túi nguyên liệu, dụng cụ, món ăn, ghi chép
    w.clueOrder ??= CLUES.filter(c => E.has(pr, E.clueEvidence(c.id)?.id)).map(c => c.id);   // save cũ đã có manh mối: coi như đọc đúng thứ tự
    Q.ensure(pr);
    return w;
}

const areaOpen = (pr, area) => { const a = AREAS[area]; return !!a && (a.needNo === 0 || cleared(pr, a.needNo)); };
const sceneOpen = (pr, id) => !!SCENES[id] && areaOpen(pr, SCENES[id].area) && (!SCENES[id].needStage || clearedId(pr, SCENES[id].needStage));
const sceneNeedText = (id) => (SCENES[id]?.needStage ? `ải ${c2no(SCENES[id].needStage)} chương 2` : `ải ${SCENES[id] ? AREAS[SCENES[id].area].needNo : '?'}`);

/** Sự kiện cốt truyện trên bản đồ: jess (ải 2 — bị vây đánh) · sera (ải 3 — hộ tống Seraphine vào Rừng Sương) */
function eventState(pr, ev) {
    if (ev === 'jess') return !cleared(pr, 1) || pendingReport(pr) === 1 ? 'later' : cleared(pr, 2) ? 'done' : 'ready';
    return 'later';
}
const EVENT_LINES = {
    jess: [
        ['sys', 'Một đám Goblin từ bụi lúa nhảy ra, vây kín {ten} và Rok!'],
        ['goblin', 'Hố hố! Hai con mồi ngon lành. Nộp hết đồ ra đây!'],
        ['warrior', '{Cau} đứng sau ta! Chúng đông quá…'],
        ['stranger', 'Ba đánh hai? Chẳng công bằng chút nào. Để ta góp vui.'],
        ['sys', 'Một cô gái áo tím đáp xuống giữa vòng vây, hai lưỡi dao loé sấm tím.'],
        ['sys', 'Kỹ năng tốn Orb — năng lượng tích dần khi đánh. Cô gái áo tím chiến đấu cùng đội trong trận này.'],
    ],
    sera: [
        ['priest', 'Thảo dược này cứu được vài người, nhưng còn nhiều người bị thương lắm.'],
        ['priest', 'Sâu trong Rừng Sương có loại thảo dược quý hơn — nhưng lũ sói ở đó rất hung dữ.'],
        ['warrior', 'Để bọn ta hộ tống cô. {Ten}, đi chứ?'],
        ['sys', 'Đã mở AUTO: các anh hùng tự dùng kỹ năng khi đủ Orb. Seraphine chiến đấu cùng đội trong trận này.'],
    ],
};
const EVENT_STAGE = { jess: 'c1-02' };
for (let n = 1; n <= 20; n++) EVENT_STAGE[`s${n}`] = `c1-${String(n).padStart(2, '0')}`;
EVENT_LINES.jess = require('./story').pre[2];   // cùng lời trước ải 2 trong cốt truyện (không viết 2 bản)

/** Lời thoại NPC theo tiến trình -> { lines: [[người nói, lời]], quest?: 'offer'|'active'|'turnin'|'done', event? } */
function npcDialog(pr, id) {
    const w = ensureWorld(pr);
    const q = QUESTS[id];
    const me = (t) => ['npc', t];
    const rn = pendingReport(pr);
    if (rn && REPORTS[rn].npc === id) {
        const S = require('./story'), r = REPORTS[rn];
        const lines = [...(S.post[rn] ?? []).slice(r.from), ...(r.ending ? S.ending : [])].map(l => [...l]);
        return { lines: lines.length ? lines : [['npc', '…']], report: rn, cutscene: r.cutscene ?? null };
    }
    const n = storyNo(pr), sp = n && STORY_SPOTS[n];
    if (sp?.npc === id) {
        const pre = require('./story').pre[n] ?? [];
        if (n === 18 && pr.flags?.trial_score == null)   // Elise: đối chất trước nhà vua (trình chứng cứ) rồi mới vào đại sảnh
            return { lines: [['elise', 'Phụ vương đồng ý cho đối chất trong đêm nay. Trước mặt các đại thần, chứng cứ của các bạn phải thật chắc.'], ['elise', 'Các bạn sẵn sàng chưa?']], event: 'trial' };
        return { lines: (n === 18 ? pre.slice(4) : pre).map(l => [...l]), event: `s${n}` };
    }
    if (id === 'sera') {
        if (!cleared(pr, 7)) return { lines: [me('…')] };   // chưa được cứu (bị ẩn trên bản đồ)
    }
    if (q) {
        const st = w.quests[id];
        const has = q.items.every(it => w.bag[it]);
        const L = {
            borin: { done: [`Búa về tay rồi, ta lại gõ được cả ngày! Trang bị ${A.unlockText('gear').toLowerCase()}, cường hoá ${A.unlockText('forge').toLowerCase()} — lúc đó ghé lò rèn nhé.`, 'Trong Mỏ Sâu có lối đi ta mới đào thông — cẩn thận Goblin nhé. (Đã mở nhánh N2)'],
                lock: ['Lò rèn đang nguội vì Goblin quấy phá ngoài mỏ đá…', `Dẹp yên mỏ đá (qua ải ${q.needNo}) rồi ghé lại nhé, {chang}.`],
                turnin: ['Ôi, cây búa của ta! Rơi tận góc ruộng à? Cảm ơn {cau} nhiều lắm!'],
                active: ['Búa của ta rơi đâu đó ở góc ruộng phía tây nam Ngoại ô.'],
                offer: ['Chà, {cau} đánh Goblin giỏi đấy!', 'Hôm trước ta làm rơi cây búa ngoài ruộng Ngoại ô, góc tây nam… tìm giúp ta được không?'] },
            lena: { done: ['Đủ nguyên liệu rồi! Còn phần lương giấu ngoài đồng nữa thôi. (Đã mở nhánh N3 · Bữa Ăn Còn Đủ Chỗ)', 'Quán ăn của ta mở cửa rồi — mời đồng đội ăn để thêm thân thiết nhé! (nút 🏰 Hầm ngục → 🍲 Quán ăn)'],
                lock: ['Làng đang loạn, quán ta đóng cửa tạm.', `Khi rừng bớt nguy hiểm (qua ải ${q.needNo}) ta sẽ nhờ {cau} một việc.`],
                turnin: ['Lúa mì vàng và nấm sương! Đủ nấu cả nồi lớn rồi!'],
                active: [`Còn thiếu: ${q.items.filter(it => !w.bag[it]).map(it => ITEM_NAMES[it]).join(', ')}.`, 'Lúa mì ở cánh đồng Ngoại ô, nấm sương mọc trong Rừng Sương.'],
                offer: ['Cô muốn nấu một bữa cho những người đang sửa làng — tiết kiệm thôi, làng vẫn đói mà.', '{Cau} tìm giúp cô Lúa mì vàng ở cánh đồng và Nấm sương trong Rừng Sương nhé?'] },
            aeris: { done: ['Hang nấm sâu trong rừng đã mở lối. Cẩn thận Nấm Chúa! (Đã mở nhánh N2 chương 2)'],
                lock: ['Rừng còn nhiều tuần biên nghi ngờ các ngươi.', `Qua ${questNeedText(q)} rồi hãy nói chuyện với ta.`],
                turnin: ['Nấm phát quang! Ánh sáng của nó dẫn đường vào hang sâu.'],
                active: ['Nấm phát quang mọc ở góc đông nam bìa rừng.'],
                offer: ['Ta nợ các ngươi một lời xin lỗi.', 'Lối vào hang nấm bị bóng tối che. Tìm giúp ta một cây Nấm phát quang nhé?', 'À, Suối Trăng phía tây bắc — trăng mọc từ non tới tròn, nhớ lấy.'] },
            oren: { done: ['Sách sao chỉ đường tới Lăng Elf Cổ. Tổ tiên sẽ phù hộ các ngươi. (Đã mở nhánh N3 chương 2)'],
                lock: ['Lunaria đang hỗn loạn. Khi vệ binh trở lại bình thường, ta sẽ nhờ {cau} một việc.'],
                turnin: ['Đúng là Sách sao cổ! Trang cuối vẽ đường tới lăng tổ tiên…'],
                active: ['Sách sao nằm đâu đó gần tháp chiêm tinh, phía đông bắc thành.'],
                offer: ['{Cau} là người mang dấu ấn mà sách cổ nhắc tới.', 'Cuốn Sách sao cổ bị đánh rơi gần tháp chiêm tinh. Mang về đây, ta sẽ chỉ {cau} lăng tổ tiên.'] },
            sera: { done: ['Người phụ việc đã có đủ thuốc và lịch uống. Giờ tôi yên tâm đi cùng mọi người rồi.'], lock: [],
                turnin: ['Thảo dược! Đủ để nhà cứu tế dùng tới khi đoàn cứu trợ về. Cảm ơn {cau}.'],
                active: ['Thảo dược mọc ở bìa Rừng Sương, phía đông Ngoại ô. Nhờ cả vào {cau}.'],
                offer: ['Trước khi đi cùng mọi người, tôi muốn để lại đủ thuốc cho người bệnh ở Ashford.', '{Cau} hái giúp tôi ít thảo dược ở bìa Rừng Sương được không?'] },
        }[id];
        if (st === 'done') return { lines: L.done.map(me), quest: 'done' };
        if (!questOpen(pr, q)) return { lines: L.lock.map(me) };
        if (st === 'active' && has) return { lines: L.turnin.map(me), quest: 'turnin' };
        if (st === 'active') return { lines: L.active.map(me), quest: 'active' };
        return { lines: L.offer.map(me), quest: 'offer' };
    }
    const T = {
        mira: cleared(pr, 20) ? ['Thư từ kinh thành về rồi: Elise giờ là nữ vương. Ashford đã sửa xong một nửa mái nhà.', 'Già vẫn giữ bản chép chứng cứ. Đi đâu cũng nhớ gửi tin về, nghe chưa?']
            : cleared(pr, 10) ? ['Ta giữ bản chép ở đây. Nếu các cháu gặp chuyện, người khác vẫn phải biết đã xảy ra việc gì.', 'Grix với Borin cãi nhau suốt về cái bể lọc… nhưng tối nào cũng làm tới khuya.']
            : cleared(pr, 7) ? ['Sera về rồi, già mừng quá. Con bé cứ đứng dậy khám bệnh, phải bắt ngồi mới chịu.', 'Già có bài đồng dao cổ, người xưa dùng để nhớ cách mở nắp xuống bể chứa:', `“${RHYME}”`, 'Mấy hôm nay nước Giếng Cổ đục lắm… Các cháu xuống xem giúp già.']
            : cleared(pr, 2) ? ['Sera mang túi thuốc đi tìm những người bị bắt từ hôm trước, vẫn chưa về…', 'Rok sẽ tìm ra con bé. Cháu ở cạnh nó nhé.']
            : cleared(pr, 1) ? ['Cháo hơi ít gạo. Đừng chê nhé.', 'Vẫn còn vài người ngoài đồng chưa về làng… Rok đang lo lắm.']
            : ['Cháu là người Rok tìm thấy ở ngôi miếu đổ à?', 'Goblin đang kéo tới cổng làng — xem Bảng ải giữa quảng trường để cùng Rok giữ cổng.'],
        rok: cleared(pr, 10) ? ['Tôi đã bàn giao việc tuần tra cho đội phó. Bằng chứng phải tới được kinh thành.', 'Xem Bảng ải khi {cau} sẵn sàng.']
            : cleared(pr, 2) ? ['Đi tìm Sera trước đã. Cô ấy để lại dấu thì mình phải đi theo dấu.', 'Còn {cau}… ăn gì chưa? Bà Mira mà biết {cau} nhịn là tôi bị mắng.']
            : cleared(pr, 1) ? ['{Cau} hét hay lắm. Lần sau cứ hét to vậy.', 'Vẫn còn người ngoài đồng chưa về. Xem Bảng ải khi sẵn sàng.']
            : ['Tôi là Rok, đội trưởng tuần tra. Đi bên cạnh tôi. Có chuyện thì tìm chỗ nấp.', 'Bảng ải giữa quảng trường ghi những nơi đang có Goblin.'],
        jessica: cleared(pr, 9) ? ['Giấy tờ tôi giao hết cho Rok rồi. Lên kinh thành tôi sẽ ra làm chứng.', 'Đừng nhìn tôi như thể tôi đã được tha thứ. Chưa đâu.']
            : cleared(pr, 2) ? ['Đừng hỏi tôi từ đâu tới. Hỏi tôi đường nào ngắn nhất thì được.', 'Mà này, đội trưởng nhà các người lúc nào cũng nghiêm thế à?']
            : ['…', '(Cô gái áo tím đứng tựa gốc cây, lặng lẽ quan sát.)'],
        guard: cleared(pr, 12) ? ['Daren khai thật rồi… Lệnh bắt cô gái Elf kia là giả. Đường lên kinh thành mở, đi đi.']
            : ['Đứng lại! Trạm gác đang lục soát gián điệp.', 'Không có lệnh của bộ chỉ huy thì không ai được qua. (Qua ải 12 để vào kinh thành)'],
        corvin: cleared(pr, 20) ? ['Những trang cứu được từ đám cháy cần sắp lại. Số La Mã ở góc mỗi mảnh sẽ giúp {cau}.']
            : cleared(pr, 16) ? ['Bản gốc phù điêu ta giữ trong hòm niêm phong. Bản sao ở chỗ các ngươi rồi.', 'Đừng điền phần bị mất bằng điều mình muốn tin.']
            : ['Thư viện đang bị lính lục soát. Quay lại sau nhé, {chang}.'],
        elise: cleared(pr, 20) ? ['Một phần hầm mộ hoàng gia bị hư sau biến cố. Có một phiến đá lạ ở góc vườn cung điện… {cau} giúp Corvin xem thử nhé.', 'Khi không có cả triều đình đứng cạnh, cứ gọi tôi là Elise.']
            : cleared(pr, 14) ? ['Tôi đếm số lương còn lại mỗi tối.', 'Cần bản lưu xuất kho và lệnh điều chuyển lương. Corvin sẽ giúp các bạn.']
            : ['(Một cô gái áo choàng dính bột mì đang kiểm từng bao lương.)', 'Ghi đúng số bao đã xuất, tên người nhận và tên người phê chuẩn.'],
        villager_m: ['Hôm qua Goblin đốt mất kho lúa nhà tôi. Mong là các {anh} dẹp được chúng.'],
        villager_f: ['Bà Mira hay kể chuyện về Giếng Cổ lắm. Nghe nói dưới đáy giếng có thứ gì đó…'],
        kid: ['{Anh} ơi, lớn lên em cũng sẽ làm hiệp sĩ như anh Rok!', '(Bé Pip vung thanh kiếm gỗ.)'],
        farmer: ['Ruộng lúa năm nay vàng ươm, vậy mà lũ Goblin cứ rình đốt.', 'Mạch đá phía đông bắc đào được Đá Cường Hoá đấy — mấy giờ lại lộ ra lớp mới.'],
        merchant: ['Hàng từ kinh thành đây! … À mà đường lên đó đang bị chặn, bán chẳng được bao nhiêu.'],
        merchant2: ['Táo đỏ, lê vàng! Kinh thành dạo này lính tráng nhiều quá, khách cũng ngại ra chợ.'],
        nun: ['Phe hòa bình vẫn cầu nguyện mỗi ngày. Chiến tranh chẳng đem lại điều gì tốt đẹp.'],
        sister_anna: ['Cứ vào nghỉ một lát nhé. Ngọn Lửa Thánh luôn sáng vì những người còn cần được chở che.', 'Sera từng cầu nguyện ở đây trước mỗi chuyến đi. Em ấy tin rằng một hiệp sĩ phải biết đưa tay ra giúp người khác trước khi rút kiếm.'],
        palace_guard_left: ['Mời bạn đi theo thảm đỏ. Xin giữ yên lặng trong sảnh ngai.'],
        palace_guard_right: ['Công chúa Elise vẫn ở ngoài tiền sảnh để nghe dân trình bày. Bạn có thể tìm cô ấy ở đó.'],
        villager_m2: cleared(pr, 20) ? ['Nữ vương công khai hồ sơ rồi… hóa ra lương cứu trợ bị đem đi chuẩn bị chiến tranh.'] : ['Có lệnh của bộ chỉ huy: ai thấy người Elf thì phải báo ngay. Lạ thật…'],
        elfmerchant: ['Thảo dược rừng Sylvaren chữa được cả vết bỏng lửa thần đấy!', 'Dạo này rừng bệnh, thảo dược héo hết cả…'],
        elfkid: clearedId(pr, 'c2-05') ? ['Treant Già ngủ yên rồi! Cảm ơn {anh}!'] : ['{Anh} là người tộc Người à? Lần đầu em thấy đó!', 'Đừng lại gần cây cổ thụ có tim xanh nhé, nó dữ lắm.'],
        lun_guard: clearedId(pr, 'c2-15') ? ['Đại pháp sư Thalor đã tỉnh ngộ. Lunaria chào đón các vị.'] : ['Lệnh của Đại pháp sư: không ai được vào tháp chiêm tinh!'],
        elfkid2: ['Đài phun trăng ban đêm sáng lắm! Nghe nói bên dưới có gốc của Cây Mẹ…'],
        bard: cleared(pr, 10)
            ? ['Khúc ca mới nhất của ta: “Skarn Răng Sắt gục ngã trước {chang} mang dấu ấn!” Khách nghe xong ai cũng vỗ tay.']
            : ['Ghé quán cô Lena là phải nghe ta hát một bài!', 'Ta đang soạn khúc ca về {chang} mất trí nhớ đánh lui Goblin đấy.'],
        hank: ['Hức… Rượu mạch của cô Lena là nhất vùng.', 'Nghe đồn trên đường lên kinh thành có lính đào ngũ chặn đường. Cẩn thận nhé, {ban}.'],
        mae: pr.flags.bua_borin
            ? ['Có búa rồi, thầy Borin rèn suốt ngày đêm!', 'Muốn cường hoá đồ thì đặt lên cái đe kia nhé.']
            : ['Thầy Borin mất búa nên chẳng rèn được gì, cả xưởng nguội lạnh…', 'Nghe nói búa rơi ở góc ruộng phía tây nam Ngoại ô.'],
        ella: ['Bà Mira kể sách cổ nói về bảy vị Thánh trên trời.', 'Cháu muốn đọc hết chỗ sách này… nhưng nhiều chữ khó quá.'],
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
    if (!sceneOpen(pr, sceneId)) return no(`Khu này mở khi qua ${sceneNeedText(sceneId)}`);
    w.scene = sceneId;
    Object.assign(w, landing(sceneId, Math.round(x), Math.round(y)));
    if (['up', 'down', 'left', 'right'].includes(face)) w.face = face;
    return ok();
}

/** Tương tác NPC / đồ vật. data: { answer?: string[] }. Trả { ok, why?, text?, lines?, rewards?, flag?, startStage? } */
function interact0(pr, wallet, sceneId, targetId, data = {}, now = Date.now(), rng = Math.random) {
    const w = ensureWorld(pr);
    if (!sceneOpen(pr, sceneId)) return no('Khu này chưa mở');
    const s = SCENES[sceneId];
    if (s.npcs.includes(targetId)) {
        if(!shown(pr,NPCS[targetId],targetId)) return no('Nhân vật đã rời khỏi đây');
        w.talked[targetId] = true;
        const q = QUESTS[targetId];
        const d = npcDialog(pr, targetId);
        if (d.event || d.report) Q.dailyEvent(pr, wallet, { type: 'talk', who: targetId }, now);
        if (d.event === 'trial') return ok({ lines: d.lines, present: E.trialPayload(pr) });   // khung đối chất (client) -> presentTrial
        if (d.report) { w.reported[d.report] = true; return ok({ lines: d.lines, cutscene: d.cutscene }); }   // về báo lại -> mở ải kế tiếp
        if (d.event) return ok({ lines: d.lines, startStage: EVENT_STAGE[d.event] });
        // 📜 bộ máy nhiệm vụ: trả / làm bước -> nhận nhiệm vụ mới (3 việc cũ borin / lena / sera cũng chạy ở đây, giữ nguyên cờ)
        const qr = Q.talk(pr, wallet, targetId, now, rng);
        if (qr) return ok({ ...qr, npcName: NPCS[targetId].name });
        if (q && !Q.BY_ID[targetId] && d.quest === 'offer') { w.quests[targetId] = 'active'; return ok({ text: 'Nhận việc', lines: d.lines }); }
        if (q && !Q.BY_ID[targetId] && d.quest === 'turnin') {
            w.quests[targetId] = 'done';
            for (const it of q.items) delete w.bag[it];
            pr.flags[q.flag] = true;
            const rewards = giveReward(wallet, q.reward);
            const xp = A.questAccountExp(targetId), acc = A.addAccountExp(pr, xp);   // việc phụ cũng cho EXP tài khoản
            const up = acc.levelUps.length ? ` · ⬆️ Lên cấp tài khoản ${acc.after.level}!` : '';
            return ok({ text: `Hoàn thành việc: ${rewardText(rewards)} · +${xp} EXP tài khoản${up}${targetId === 'sera' ? '' : ' · Mở nhánh ải mới!'}`, lines: d.lines, rewards, flag: q.flag, account: acc });
        }
        return ok({ lines: d.lines });
    }
    const o = findObj(sceneId, targetId);
    if (!o || !shown(pr,o,targetId)) return no('Không có gì ở đây');
    if (o.needNo && !cleared(pr, o.needNo)) return no(`Chưa thể làm gì — qua ải ${o.needNo} trước`);
    if (o.needStage && !clearedId(pr, o.needStage)) return no(`Chưa thể làm gì — qua ải ${c2no(o.needStage)} chương 2 trước`);
    // 🧺 điểm hái / chặt / đập / câu cá: mỗi lần bấm = 1 lần gõ; xong thì cộng nguyên liệu (mọc lại 05:00)
    if (o.type === 'node') { const r = GA.hitNode(pr, wallet, o, now, rng); return r.ok ? ok(r) : no(r.why); }
    if (o.type === 'cook') return CK.unlocked(pr) && require('./campaign').features(pr).has('cooking') ? ok({ open: 'cook', kitchen: !!o.kitchen })
        : no(CK.unlocked(pr) ? `Chưa nấu được. Nấu ăn ${A.unlockText('cooking').toLowerCase()}` : 'Chưa biết nấu gì cả. Giúp cô Lena mở lại quán trước đã');
    if (o.type === 'craft') return ok({ open: 'tools' });
    if (o.type === 'climb') return ok({ text: 'Đứng sát chân dây rồi bấm A để leo lên' });
    if (o.type === 'chest' && o.needNote && !GA.noteRead(pr, o.needNote)) return no('Không có gì ở đây');
    // 📜 vật / người của nhiệm vụ
    if (QUEST_TYPES.has(o.type)) {
        if (Q.objState(pr, o, now) === 'hidden') return no('Không có gì ở đây');
        if (o.type === 'pickup') { w.bag[o.item] = true; return ok({ text: `Nhặt được ${ITEM_NAMES[o.item]}` }); }
        if (o.type === 'spot') {
            if (o.feed) {   // máng gà: mỗi máng tính 1 lần / ngày cho việc hằng ngày
                w.fed ??= {};
                if (w.fed[o.id] !== Q.dayKey(now)) { w.fed[o.id] = Q.dayKey(now); Q.dailyEvent(pr, wallet, { type: 'feed' }, now); }
            }
            return ok({ lines: o.lines.map(t => ['sys', t]) });
        }
        if (o.type === 'person') {
            const qr = Q.talk(pr, wallet, o.id, now, rng);
            return ok(qr ? { ...qr, npcName: o.name } : { lines: o.lines.map(t => ['npc', t]), npcName: o.name });
        }
        if (o.type === 'gather') {   // vật nhặt hằng ngày: mọc lại lúc 05:00
            w.gather[o.id] = Q.dayKey(now);
            return ok({ text: `Hái ${o.label}: ${rewardText(giveReward(wallet, { gold: 20 }))}`, rewards: { gold: 20 } });
        }
        return ok({ openDaily: true });   // bảng "việc hôm nay"
    }
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
        const flag = { well: 'gieng_co', pages: 'trang_sach', moon: 'suoi_trang' }[o.puzzle];
        if (pr.flags[flag]) return no('Bí mật ở đây đã được giải');
        const ans = Array.isArray(data.answer) ? data.answer : null;
        if (!ans) return ok({ puzzle: o.puzzle });
        const right = { well: WELL_ANSWER, pages: PAGES, moon: MOON_ANSWER }[o.puzzle];
        if (ans.length !== right.length || ans.some((v, i) => v !== right[i])) return no({ well: 'Giếng im lặng… thứ tự chưa đúng', pages: 'Các mảnh chưa khớp nhau…', moon: 'Mặt suối gợn sóng rồi lặng im… thứ tự chưa đúng' }[o.puzzle]);
        pr.flags[flag] = true;
        const rewards = giveReward(wallet, { diamond: 30 });
        return ok({ text: `${{ well: 'Đáy giếng phát sáng, lộ ra lối đi!', pages: 'Trang sách ghép lại: một tập bệnh án thời xưa — ở lề có ghi chú lạ!', moon: 'Suối Trăng sáng rực — đáy suối mở ra một lối đi!' }[o.puzzle]} ${rewardText(rewards)} · Mở nhánh ải mới!`, rewards, flag });
    }
    if (o.type === 'secret') {
        const c2 = o.flag === 'goc_cay_me';
        if (pr.flags[o.flag]) return no(c2 ? 'Lối xuống Gốc Cây Mẹ đã mở' : 'Lối xuống hầm mộ đã mở');
        pr.flags[o.flag] = true;
        return ok({ text: c2 ? 'Mặt nước đài phun rẽ ra — bậc thang dẫn xuống Gốc Cây Mẹ! Mở nhánh ải mới!' : 'Phiến đá trượt sang một bên — lối xuống hầm mộ! Mở nhánh ải mới!', flag: o.flag });
    }
    if (o.type === 'story') {
        const n = storyNo(pr);
        if (!o.stages.includes(n)) return no('Xung quanh yên ắng…');
        return ok({ lines: (require('./story').pre[n] ?? []).map(l => [...l]), startStage: storyStageId(n) });
    }
    if (o.type === 'clue') {
        if (!cleared(pr, o.needNo)) return no('Chưa thấy gì đáng chú ý…');
        const e = E.collectClue(pr, o.id);
        if (!e) return no('Đã điều tra chỗ này rồi.');
        return ok({ lines: [['sys', `🔎 Tìm thấy chứng cứ: ${e.icon} ${e.name}`], ['sys', e.desc], [...e.comment]], text: `🔎 Sổ chứng cứ: +${e.name}`, evidence: e.id });
    }
    if (o.type === 'event') {
        const st = eventState(pr, o.event);
        if (st === 'later') return no('Xung quanh yên ắng…');
        if (st === 'done') return no('Chỉ còn dấu chân Goblin chạy tán loạn.');
        return ok({ lines: EVENT_LINES[o.event].map(l => [...l]), startStage: EVENT_STAGE[o.event] });
    }
    if (o.type === 'stageBoard') return ok({ openStages: true });
    if (o.type === 'note') {
        if (!o.lore) return ok({ lines: o.lines.map(t => ['sys', t]) });
        const first = GA.readNote(pr, o).first;   // 📓 ghi vào sổ Ghi chép (lần đầu)
        const lines = o.lines.map(t => ['sys', t]);
        if (first && o.reveal) lines.push(['sys', 'Có thứ gì đó vừa lộ ra ở gần đây…']);
        return ok({ lines, ...(first ? { text: `📓 Ghi chép mới: ${o.title}` } : {}) });
    }
    if (o.type === 'tavern') return pr.flags.nguyen_lieu_lena ? ok({ open: 'tavern' }) : no('Quầy còn đóng — giúp cô Lena chuẩn bị Bữa Tiệc Làng trước đã');
    if (o.type === 'forge') return require('./campaign').features(pr).has('gear') ? ok({ open: 'gear' }) : no(`Đe rèn còn nguội — Trang bị ${A.unlockText('gear').toLowerCase()}`);
    return no('Không có gì ở đây');
}

/** Tương tác + móc sự kiện nhiệm vụ: ghi điểm truyện đã tới, rương / vật nhặt / manh mối / vật đã xem -> tiến độ nhiệm vụ, bước chính tuyến (+20 Kim Cương) */
function interact(pr, wallet, sceneId, targetId, data = {}, now = Date.now(), rng = Math.random) {
    const r = interact0(pr, wallet, sceneId, targetId, data, now, rng);
    if (!r.ok) return r;
    const w = pr.world, o = findObj(sceneId, targetId);
    const n = r.startStage ? require('./story').stageNo(r.startStage) : null;
    if (n && r.startStage.startsWith('c1-')) w.spot[n] = true;   // đã tới điểm truyện của ải n
    if (r.present) w.spot[18] = true;
    if (o && !r.puzzle) {
        if (o.type === 'chest') Q.fire(pr, wallet, { type: 'chest', id: o.id }, now, rng);
        if (['mine', 'item', 'pickup', 'gather'].includes(o.type) || (o.type === 'node' && r.done)) Q.fire(pr, wallet, { type: 'gather', id: o.id }, now, rng);
        if (o.type === 'clue') Q.clueRead(pr, o.id);
        if (o.type !== 'person') {
            const res = Q.fire(pr, wallet, { type: 'interact', id: o.id }, now, rng);
            const fin = res.done.map(d => Q.BY_ID[d.quest]).find(q => q?.outro);   // nhiệm vụ (ẩn) xong ngay tại vật: phát lời kết
            if (fin) r.lines = [...(r.lines ?? []), ...fin.outro.map(l => [...l])];
        }
    }
    Q.settle(pr, wallet, now, rng);
    return r;
}

/** Nhật ký nhiệm vụ thuần: đọc cả save cũ mà không khởi tạo hay đổi tiến trình. */
function questLog(pr) {
    const w = pr.world ?? {};
    const bag = w.bag ?? {};
    const flags = pr.flags ?? {};
    const details = {
        sera: { title: 'Thuốc cho nhà cứu tế', desc: 'Sera muốn để lại đủ thuốc cho người bệnh ở Ashford trước khi lên đường. {Cau} hãy hái thảo dược ở bìa Rừng Sương.', extra: 'Người bệnh ở Ashford có thuốc dùng' },
        lena: { title: 'Bữa ăn còn đủ chỗ', desc: 'Cô Lena muốn nấu một bữa tiết kiệm cho những người đang sửa làng sau trận Skarn.', extra: 'Mở nhánh N3' },
        borin: { title: 'Tìm búa cho bác Borin', desc: 'Bác Borin làm rơi cây búa ở góc ruộng phía tây nam Ngoại ô. Lò rèn đang chờ tiếng búa trở lại.', extra: 'Mở nhánh N2' },
        aeris: { title: 'Ánh sáng cho hang nấm', desc: 'Đội trưởng Aeris cần một cây Nấm phát quang để soi lối vào hang nấm sâu trong rừng Sylvaren.', extra: 'Mở nhánh N2 chương 2', scene: 'sylvaren' },
        oren: { title: 'Sách sao cổ', desc: 'Trưởng lão Oren nhờ tìm cuốn Sách sao cổ bị đánh rơi gần tháp chiêm tinh Lunaria.', extra: 'Mở nhánh N3 chương 2', scene: 'lunaria' },
    };
    const sides = Object.entries(details).map(([id, detail]) => {
        const q = QUESTS[id];
        if (q.needStage && !sceneOpen(pr, detail.scene)) return null;   // việc chương 2: chỉ hiện khi vùng Elf đã mở
        const state = !questOpen(pr, q) ? 'locked' : w.quests?.[id] === 'done' ? 'done' : w.quests?.[id] === 'active' ? 'active' : 'offered';
        const missing = q.items.filter(it => !bag[it]);
        const giver = NPCS[id].name;
        let target = null;
        let obj = state === 'locked' ? `Mở sau ${questNeedText(q)}` : state === 'done' ? 'Đã hoàn thành việc' : `Nói chuyện với ${giver}`;
        if (state === 'offered' || state === 'active') target = { scene: detail.scene ?? 'ashford', kind: 'npc', id };
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
            target, reward: `${rewardText(q.reward)} · ${detail.extra}`, needNo: state === 'locked' ? (q.needNo ?? null) : null };
    }).filter(Boolean);
    const secrets = [
        { id: 'well', title: 'Bí mật Giếng Cổ', npc: 'mira', needNo: 7, flag: 'gieng_co', scene: 'ashford',
            desc: `Bà Mira kể bài đồng dao: “${RHYME}”. Có lẽ lời hát giữ bí mật của giếng.`, obj: 'Xoay các biểu tượng ở Giếng Cổ theo bài đồng dao', reward: '+30 Kim Cương · Mở nhánh N1' },
        { id: 'pages', title: 'Trang sách bị xé', npc: 'corvin', needNo: 20, flag: 'trang_sach', scene: 'capital',
            desc: 'Lão Corvin cần sắp lại những trang cứu được từ đám cháy thư viện. Số La Mã ở góc trang sẽ giúp {cau} ghép lại.', obj: 'Xếp lại các trang sách ở thư viện hoàng gia', reward: '+30 Kim Cương · Mở nhánh N4' },
        { id: 'crypt', title: 'Lối vào hầm mộ', npc: 'elise', needNo: 20, flag: 'loi_vao_ham_mo', scene: 'capital',
            desc: 'Một phần hầm mộ hoàng gia bị hư sau biến cố. Elise nhờ cả nhóm giúp Corvin lấy lại bia tên — lối vào là phiến đá lạ trong vườn cung điện.', obj: 'Khám phá phiến đá lạ trong vườn cung điện', reward: 'Mở nhánh N5' },
    ];
    if (sceneOpen(pr, 'sylvaren')) secrets.push(
        { id: 'moonwell', title: 'Bí ẩn Suối Trăng', npc: 'aeris', needStage: 'c2-06', flag: 'suoi_trang', scene: 'sylvaren',
            desc: 'Aeris kể: “Trăng mọc từ non tới tròn”. Bốn phiến đá quanh Suối Trăng khắc bốn pha trăng.', obj: 'Xoay bốn phiến đá ở Suối Trăng theo thứ tự trăng mọc', reward: '+30 Kim Cương · Mở nhánh N1 chương 2' },
        { id: 'moon_fountain', title: 'Gốc Cây Mẹ', npc: 'oren', needStage: 'c2-19', flag: 'goc_cay_me', scene: 'lunaria',
            desc: 'Dưới Đài phun trăng ở Lunaria là lối xuống Gốc Cây Mẹ — trái tim của Rừng Thiêng.', obj: 'Chạm vào Đài phun trăng giữa thành Lunaria', reward: 'Mở nhánh N4 chương 2' });
    for (const q of secrets) {
        const unlocked = q.needStage ? clearedId(pr, q.needStage) : cleared(pr, q.needNo);
        const state = flags[q.flag] ? 'done' : unlocked ? 'active' : 'locked';
        sides.push({ id: q.id, type: 'side', title: q.title, giver: NPCS[q.npc].name, desc: q.desc, state,
            obj: state === 'locked' ? `Mở sau ${q.needStage ? `ải ${c2no(q.needStage)} chương 2` : `ải ${q.needNo}`}` : state === 'done' ? 'Đã khám phá bí mật' : q.obj,
            progress: null, target: state === 'active' ? { scene: q.scene, kind: 'obj', id: q.id } : null,
            reward: q.reward, needNo: state === 'locked' ? (q.needNo ?? null) : null });
    }
    const next = CHAPTER.stages.find(s => !cleared(pr, s.no));
    const main = { id: 'main', type: 'main', title: next ? `Chương 1 · Ải ${next.no}: ${next.name}` : 'Chương 1 · Ngọn Lửa Dưới Thánh Huy', giver: '',
        desc: !next || next.no >= 13 ? 'Mang bằng chứng về Ashford tới kinh thành Valoria trước khi chiến tranh nổ ra.' : next.no <= 2 ? 'Cùng Rok giữ làng Ashford khỏi lũ Goblin.' : next.no <= 7 ? 'Lần theo dấu nữ tu Sera và những người bị Goblin bắt đi.' : next.no <= 10 ? 'Giữ Ashford trước cuộc tấn công của Skarn.' : 'Theo Đường Vương Đạo, mang chứng cứ lên kinh thành.',
        state: next ? 'active' : 'done', obj: 'Đã hoàn thành chương 1', progress: null, target: null,
        reward: 'Phần thưởng ải cốt truyện', needNo: null };
    // chương 1 xong -> nhiệm vụ chính chuyển sang chương 2 (vùng Elf)
    const next2 = !next && CHAPTER2.stages.find(s2 => !clearedId(pr, s2.id));
    if (next2) {
        Object.assign(main, { title: `Chương 2 · Ải ${next2.no}: ${next2.name}`, state: 'active',
            desc: next2.no <= 12 ? 'Tiến vào Rừng Thiêng Sylvaren, tìm em gái Lyra và kẻ đang đầu độc khu rừng.' : 'Vạch trần âm mưu của sứ giả Varkos ở Thành cây Lunaria.',
            obj: `Mở Bảng ải (hoặc 📖 Chọn ải → Chương 2) và đánh ải ${next2.no}: ${next2.name}`,
            target: next2.no >= 13 && sceneOpen(pr, 'lunaria') ? { scene: 'lunaria', kind: 'obj', id: 'lun_board' } : null });   // rừng Sylvaren chưa có Bảng ải -> dùng 📖 Chọn ải, không bắt về kinh thành
        if (!main.target) main.obj = `Bấm 📖 Chọn ải (thanh dưới màn hình) → Chương 2, đánh ải ${next2.no}: ${next2.name}`;
    } else if (!next) Object.assign(main, { title: 'Chương 2 · Tiếng Gọi Rừng Thiêng', obj: 'Đã hoàn thành chương 2' });
    if (next) {
        const capital = next.no >= 13 && sceneOpen(pr, 'capital');
        main.target = { scene: capital ? 'capital' : 'ashford', kind: 'obj', id: capital ? 'gate_board' : 'board' };
        main.obj = `Mở Bảng ải và đánh ải ${next.no}: ${next.name}`;
        const sp = STORY_SPOTS[next.no];
        if (sp && sceneOpen(pr, sp.scene)) {
            main.target = sp.npc ? { scene: sp.scene, kind: 'npc', id: sp.npc } : { scene: sp.scene, kind: 'obj', id: sp.obj };
            main.obj = sp.go;
        }
        if (next.no === 2 && eventState(pr, 'jess') === 'ready') {
            main.target = { scene: 'outskirts', kind: 'obj', id: 'ambush' };
            main.obj = 'Ra cánh đồng Ngoại ô — có tiếng ồn…';
        }
    }
    // vừa thắng ải có phần "về báo lại": chính tuyến chỉ tới NPC đó trước (ải 20: về cung gặp Elise trước khi sang chương 2)
    const rn = pendingReport(pr);
    if (rn && sceneOpen(pr, REPORTS[rn].scene)) {
        Object.assign(main, { state: 'active', title: rn === 20 ? "Chương 1 · Hồi kết" : `Chương 1 · Sau ải ${rn}`, target: { scene: REPORTS[rn].scene, kind: 'npc', id: REPORTS[rn].npc }, obj: REPORTS[rn].go });
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
            id, name: s.name, area: s.area, interior: !!s.interior, areaName: AREAS[s.area].name, open: sceneOpen(pr, id), needNo: AREAS[s.area].needNo, needText: sceneNeedText(id),
            npcs: s.npcs.map(n => {
                const d = npcDialog(pr, n);
                const hidden = !shown(pr,NPCS[n],n);
                // dấu trên đầu: ! vàng chính tuyến · ! / ? xanh lá phụ · tím nhánh (mk = loại) — nhiệm vụ ẩn không có dấu
                const m = d.event || d.report ? { txt: '!', kind: 'main' } : Q.BY_ID[n] || !QUESTS[n] ? Q.markOf(pr, n)
                    : d.quest === 'offer' ? { txt: '!', kind: 'side' } : d.quest === 'turnin' ? { txt: '?', kind: 'side' } : Q.markOf(pr, n);
                return { id: n, ...NPCS[n], hidden, mark: m?.txt ?? null, mk: m?.kind ?? null, say: GA.ambient(pr, n) };
            }),
            objects: s.objects.map(o => {
                const st = !shown(pr,o,o.id) ? 'hidden' : o.type === 'node' ? GA.nodeState(pr, o, now) : o.needNote && !GA.noteRead(pr, o.needNote) ? 'hidden' : QUEST_TYPES.has(o.type) ? Q.objState(pr, o, now) : o.type === 'chest' ? (w.opened[o.id] ? 'done' : 'ready')
                    : o.type === 'mine' ? (now < (w.mineAt[o.id] ?? 0) ? 'cooldown' : 'ready')
                    : o.type === 'item' ? (w.quests[o.quest] === 'active' && !w.bag[o.item] ? 'ready' : 'hidden')
                    : o.type === 'puzzle' ? (pr.flags[{ well: 'gieng_co', pages: 'trang_sach', moon: 'suoi_trang' }[o.puzzle]] ? 'done' : ((o.needNo && !cleared(pr, o.needNo)) || (o.needStage && !clearedId(pr, o.needStage)) ? 'locked' : 'ready'))
                    : o.type === 'secret' ? (pr.flags[o.flag] ? 'done' : ((o.needStage ? clearedId(pr, o.needStage) : cleared(pr, o.needNo)) ? 'ready' : 'hidden'))
                    : o.type === 'story' ? (o.stages.includes(storyNo(pr)) ? 'ready' : 'hidden')
                    : o.type === 'clue' ? (cleared(pr, o.needNo) && !E.has(pr, E.clueEvidence(o.id)?.id) ? 'ready' : 'hidden')
                    : o.type === 'event' ? eventState(pr, o.event)
                    : 'ready';
                const pm = o.type === 'person' && st === 'ready' ? Q.markOf(pr, o.id) : null;
                return { id: o.id, type: o.type, label: o.label ?? (o.type === 'chest' ? 'Rương' : ''), state: st, puzzle: o.puzzle, item: o.item,
                    ...(o.type === 'person' ? { name: o.name, mark: pm?.txt ?? null, mk: pm?.kind ?? null } : {}),
                    ...(o.type === 'node' ? { kind: o.kind, lack: GA.toolLack(pr, GA.NODES[o.kind]) } : {}), ...(o.lore ? { unread: !GA.noteRead(pr, o.id) } : {}),
                    readyIn: o.type === 'mine' ? Math.max(0, (w.mineAt[o.id] ?? 0) - now) : 0 };
            }),
        };
    }
    // túi vật nhiệm vụ: vật cùng tên gộp "×n"
    const bagNames = new Map();
    for (const it of Object.keys(w.bag)) { const name = ITEM_NAMES[it] ?? it, b = bagNames.get(name) ?? { id: it, n: 0 }; b.n++; bagNames.set(name, b); }
    const personName = (id) => NPCS[id]?.name ?? Object.values(SCENES).flatMap(s => s.objects).find(o => o.id === id)?.name ?? id;
    return { scene: w.scene, x: w.x, y: w.y, face: w.face, teleportVersion: w.teleportVersion ?? 0, scenes, bag: [...bagNames].map(([name, b]) => ({ id: b.id, name: b.n > 1 ? `${name} ×${b.n}` : name })),
        wellSymbols: WELL_SYMBOLS, moonSymbols: MOON_SYMBOLS, pages: PAGES, player: pr.player ?? null, quests: questLog(pr), evidence: E.journal(pr),
        qlog: Q.log(pr, now, personName),
        notebook: GA.notesState(pr, (id) => SCENES[id]?.name ?? id),   // 📓 sổ Ghi chép
        pack: { ...GA.bagState(pr), dishes: CK.state(pr).dishes, cooking: CK.unlocked(pr) && require('./campaign').features(pr).has('cooking') } };   // 🧺 nguyên liệu, dụng cụ, món ăn   // 📜 sổ nhiệm vụ mới: phụ / nhánh / ẩn / hằng ngày + số bước chính tuyến
}

/** 🎣 Kết quả 1 lần quăng câu ở chỗ câu cá (client báo trúng / trượt; server quyết định cá + giới hạn theo ngày) */
function fish(pr, wallet, sceneId, objId, quality, now = Date.now(), rng = Math.random) {
    ensureWorld(pr);
    const o = findObj(sceneId, objId);
    if (!sceneOpen(pr, sceneId) || o?.type !== 'node') return no('Ở đây không câu được');
    const r = GA.fishCast(pr, o, quality, now, rng);
    if (!r.ok) return no(r.why);
    if (Object.keys(r.got).length) Q.fire(pr, wallet, { type: 'gather', id: o.id }, now, rng);
    Q.settle(pr, wallet, now, rng);
    return ok(r);
}

/** Đối chất trước nhà vua (trước ải 18): chấm chứng cứ, thưởng lần đầu, rồi vào ải 18 */
function presentTrial(pr, wallet, answers = {}) {
    if (nextStoryNo(pr) !== 18) return no('Chưa tới lúc đối chất');
    const r = E.present(pr, answers);
    const rewards = giveReward(wallet, r.rewards);
    ensureWorld(pr).spot[18] = true; Q.settle(pr, wallet);   // bước chính tuyến "gặp Elise để đối chất" xong
    const tail = (require('./story').pre[18] ?? []).slice(4);   // phần sau cuộc tranh luận: nhà vua quyết, Valdric trở mặt
    return ok({ result: { correct: r.correct, total: r.total, lines: r.lines, first: r.first }, rewards, text: r.first ? `Thuyết phục ${r.correct}/${r.total} · ${rewardText(rewards)}` : `Thuyết phục ${r.correct}/${r.total}`,
        lines: [...r.lines, ...tail].map(l => [...l]), startStage: 'c1-18' });
}

module.exports = { fish, shown, presentTrial, nextStoryNo, spotHints, REPORTS, pendingReport, postNow, syncReports, STORY_SPOTS, CLUES, MOON_ANSWER, clearedId, AREAS, SCENES, NPCS, QUESTS, ITEM_NAMES, START, WELL_SYMBOLS, WELL_ANSWER, PAGES, RHYME, MINE_COOLDOWN, EVENT_STAGE,
    QUEST_TYPES, sceneSpawn, landing, ensureWorld, areaOpen, sceneOpen, npcDialog, move, interact, worldState, questLog, fill, setPlayer, eventState };
