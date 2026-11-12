// ============================================================
// 🧺 KHÁM PHÁ BẢN ĐỒ (chương 1): hái lượm · chặt cây · đập quặng · câu cá · dụng cụ nhiều bậc · ghi chép · rương ẩn · chỗ leo · lời bâng quơ của dân làng
//   Luật thuần, không socket. game/world.js gộp OBJECTS vào SCENES và gọi các hàm ở đây; vị trí từng vật: src/world/mapsExtra.js
//   Saved in pr.world: mats { id: count }, tools { pick, axe, rod: tier }, gather { nodeId: completion timestamp in ms } (72-hour respawn)
//       hits { id vật: { d: khoá ngày, n: số lần đã gõ } } · casts { id chỗ câu: { d, n } } · notes { id: true } · books { id: true }
//   Chương sau chỉ cần thêm dòng vào 3 bảng: TOOLS (bậc dụng cụ) · NODES (loại điểm hái) · OBJECTS (vật trên bản đồ).
// ============================================================
const A = require('./account');
const W = require('./wallet');
const Q = require('./quests');

// ---------- nguyên liệu nấu ăn + vật liệu chế dụng cụ ----------
const MATS = {
    lua: { name: 'Lúa mì', kind: 'ing' }, nam: { name: 'Nấm rừng', kind: 'ing' }, thao: { name: 'Rau thơm', kind: 'ing' }, dau: { name: 'Quả mọng', kind: 'ing' },
    trung: { name: 'Trứng gà', kind: 'ing' }, tao: { name: 'Táo đỏ', kind: 'ing' }, thit: { name: 'Thịt tươi', kind: 'ing' }, mat: { name: 'Mật ong rừng', kind: 'ing', rare: true },
    ca_chep: { name: 'Cá chép', kind: 'ing' }, ca_bac: { name: 'Cá bạc', kind: 'ing' }, ca_vang: { name: 'Cá hoàng kim', kind: 'ing', rare: true },
    muoi: { name: 'Muối', kind: 'ing' }, sua: { name: 'Sữa', kind: 'ing' },
    go: { name: 'Gỗ', kind: 'mat' }, go_cung: { name: 'Gỗ sồi', kind: 'mat' }, dong: { name: 'Quặng đồng', kind: 'mat' }, sat: { name: 'Quặng sắt', kind: 'mat' },
};
const MAT_MAX = 99;

// ---------- DỤNG CỤ: mỗi loại 3 bậc. Bậc 1 nhận từ nhiệm vụ, bậc sau rèn ở bàn dụng cụ trong lò rèn bác Borin ----------
//   account: cấp tài khoản cần có · cost: vàng + vật liệu
const TOOLS = {
    pick: { name: 'Cuốc', use: 'đập quặng', tiers: [
        { tier: 1, name: 'Cuốc gỗ', quest: 't_dungcu' },
        { tier: 2, name: 'Cuốc sắt', account: 8, cost: { gold: 400, mats: { go: 6, dong: 8 } } },
        { tier: 3, name: 'Cuốc thép', account: 14, cost: { gold: 1200, mats: { go_cung: 4, sat: 8 } } }] },
    axe: { name: 'Rìu', use: 'chặt cây', tiers: [
        { tier: 1, name: 'Rìu gỗ', quest: 't_dungcu' },
        { tier: 2, name: 'Rìu sắt', account: 8, cost: { gold: 400, mats: { go: 8, dong: 6 } } },
        { tier: 3, name: 'Rìu thép', account: 14, cost: { gold: 1200, mats: { go_cung: 6, sat: 6 } } }] },
    rod: { name: 'Cần câu', use: 'câu cá', tiers: [
        { tier: 1, name: 'Cần câu tre', quest: 't_cau' },
        { tier: 2, name: 'Cần câu sắt', account: 10, cost: { gold: 500, mats: { go: 6, dong: 4 } } },
        { tier: 3, name: 'Cần câu thép', account: 16, cost: { gold: 1500, mats: { go_cung: 4, sat: 4 } } }] },
};

// ---------- LOẠI ĐIỂM HÁI (bậc điểm so với bậc dụng cụ) ----------
//   tool + tier: dụng cụ và bậc tối thiểu · presses: số lần gõ với dụng cụ vừa đủ bậc (mỗi bậc hơn bớt 1 lần, ít nhất 1)
//   n: [ít nhất, nhiều nhất] · mỗi bậc dụng cụ hơn: +1 vật · bonus: vật thêm, tỉ lệ = chance × bậc dụng cụ (không cần dụng cụ: chance × 1)
//   stay: hái xong vật vẫn đứng đó (cây, tảng đá) · fish: chỗ câu cá (casts: số lần câu mỗi ngày)
const NODES = {
    lua: { name: 'Bụi lúa chín', item: 'lua', n: [1, 2] },
    nam: { name: 'Cụm nấm rừng', item: 'nam', n: [1, 2] },
    thao: { name: 'Bụi rau thơm', item: 'thao', n: [1, 2] },
    dau: { name: 'Bụi quả mọng', item: 'dau', n: [1, 2] },
    trung: { name: 'Ổ trứng gà', item: 'trung', n: [1, 2] },
    tao: { name: 'Cây táo', item: 'tao', n: [2, 3], stay: true, verb: 'Rung' },
    mat: { name: 'Tổ ong rừng', item: 'mat', n: [1, 1], stay: true },
    go: { name: 'Đống củi khô', tool: 'axe', tier: 1, presses: 3, item: 'go', n: [2, 3], stay: true, verb: 'Chặt', bonus: { mat: 'trung', chance: 0.08 } },
    go_cung: { name: 'Cây sồi già', tool: 'axe', tier: 2, presses: 4, item: 'go_cung', n: [1, 2], stay: true, verb: 'Chặt', bonus: { mat: 'mat', chance: 0.05 } },
    dong: { name: 'Tảng quặng đồng', tool: 'pick', tier: 1, presses: 3, item: 'dong', n: [2, 3], stay: true, verb: 'Đập', bonus: { wallet: 'stone', chance: 0.1 } },
    sat: { name: 'Tảng quặng sắt', tool: 'pick', tier: 2, presses: 4, item: 'sat', n: [1, 2], stay: true, verb: 'Đập', bonus: { wallet: 'stone', chance: 0.1 } },
    ca: { name: 'Chỗ câu cá', tool: 'rod', tier: 1, fish: true, casts: 3, stay: true },
    ca_sau: { name: 'Vũng nước sâu', tool: 'rod', tier: 2, fish: true, casts: 3, stay: true, rare: 2 },
};
// 3 loại cá: tỉ lệ (w) · cá hoàng kim cần cần câu bậc 2 trở lên
const FISH = [{ id: 'ca_chep', w: 70 }, { id: 'ca_bac', w: 25 }, { id: 'ca_vang', w: 5, rod: 2 }];
const FISH_TRIES = 8;   // số lần quăng câu tối đa mỗi chỗ mỗi ngày (kể cả trượt) — chặn bấm bừa

// ---------- VẬT TRÊN BẢN ĐỒ (game/world.js gộp vào SCENES) ----------
//   node: điểm hái (kind = dòng trong NODES) · note + lore: ghi chép đọc được (vào sổ "Ghi chép") · cook: bếp / lửa trại
//   craft: bàn dụng cụ · climb: chỗ leo (client xử lý, phải leo mới lên) · chest + needNote: rương ẩn, chỉ hiện sau khi đọc ghi chép đó
//   up: vật nằm trên cao, phải leo / nhảy mới tới (không tính vào kiểm tra đi bộ)
const node = (id, kind, extra = {}) => ({ id, type: 'node', kind, label: NODES[kind].name, ...extra });
const lore = (id, label, title, lines, extra = {}) => ({ id, type: 'note', lore: true, label, title, lines, ...extra });
const OBJECTS = {
    outskirts: [
        node('g_outskirts_lua_1', 'lua'), node('g_outskirts_lua_2', 'lua'), node('g_outskirts_lua_3', 'lua'), node('g_outskirts_tao_4', 'tao'),
        node('g_outskirts_tao_5', 'tao'), node('g_outskirts_tao_6', 'tao'), node('g_outskirts_dong_7', 'dong'), node('g_outskirts_dong_8', 'dong'),
        node('g_outskirts_dong_9', 'dong'), node('g_outskirts_sat_10', 'sat'), node('g_outskirts_sat_11', 'sat'), node('g_outskirts_go_12', 'go'),
        node('g_outskirts_go_13', 'go'), node('g_outskirts_go_14', 'go'), node('g_outskirts_trung_15', 'trung'), node('g_outskirts_trung_16', 'trung'),
        node('g_lua1', 'lua'), node('g_lua2', 'lua'), node('g_trung1', 'trung'), node('g_dau1', 'dau'), node('g_tao1', 'tao'),
        node('g_go1', 'go'), node('g_go2', 'go'), node('g_dong1', 'dong'), node('g_sat1', 'sat', { up: true }),
        { id: 'c_mo', type: 'climb', label: 'Dây thừng lên gờ đá' },
        { id: 'lua_trai1', type: 'cook', label: 'Lửa trại bên ruộng' },
        lore('n_bien_dong', 'Biển chỉ đường', 'Biển chỉ đường Ngoại ô', ['Tây: làng Ashford. Đông: Rừng Sương. Bắc: mỏ đá của làng.', 'Ai đó khắc thêm bằng dao: "Ruộng chín thì hái, ba ngày sau lại mọc. Đừng tham."']),
        lore('n_mo', 'Bảng gỗ ở mỏ đá', 'Nội quy mỏ đá', ['Mỏ đá Ashford. Quặng đồng đập bằng cuốc gỗ cũng được. Quặng sắt trên gờ cao thì phải cuốc sắt.', 'Dòng cuối viết vội: "Thợ cả giấu hòm đồ nghề sau tảng đá cuối mỏ, phía đông."'], { reveal: 'hc_mo' }),
        { id: 'hc_mo', type: 'chest', needNote: 'n_mo', label: 'Hòm đồ nghề thợ mỏ', reward: { stone: 6, gold: 200 } },
    ],
    forest: [
        node('g_forest_nam_1', 'nam'), node('g_forest_nam_2', 'nam'), node('g_forest_nam_3', 'nam'), node('g_forest_nam_4', 'nam'),
        node('g_forest_nam_5', 'nam'), node('g_forest_nam_6', 'nam'), node('g_forest_dau_7', 'dau'), node('g_forest_dau_8', 'dau'),
        node('g_forest_dau_9', 'dau'), node('g_forest_thao_10', 'thao'), node('g_forest_thao_11', 'thao'), node('g_forest_thao_12', 'thao'),
        node('g_forest_go_cung_13', 'go_cung'), node('g_forest_go_cung_14', 'go_cung'), node('g_forest_go_15', 'go'), node('g_forest_go_16', 'go'),
        node('g_forest_go_17', 'go'), node('g_forest_mat_18', 'mat'),
        node('g_nam1', 'nam'), node('g_nam2', 'nam'), node('g_thao1', 'thao'), node('g_thao2', 'thao'), node('g_dau2', 'dau'),
        node('g_go3', 'go'), node('g_gocung1', 'go_cung'), node('g_tao2', 'tao', { up: true }), node('g_mat', 'mat', { up: true }),
        node('f_rung', 'ca'), node('f_sau', 'ca_sau'),
        { id: 'c_nui', type: 'climb', label: 'Dây leo lên đỉnh đồi' },
        { id: 'lua_trai2', type: 'cook', label: 'Lửa trại thợ săn' },
        lore('n_cay_co', 'Thân cây có khắc chữ', 'Lời khắc trên cây cổ thụ', ['Trên thân cây có mấy vạch đo chiều cao của một đứa trẻ, vạch cuối cao ngang vai {cau}.', 'Bên cạnh khắc: "Tobin, 12 tuổi. Lớn lên sẽ làm lính gác như chú Rok."']),
        lore('n_mo_tho_san', 'Nấm mộ nhỏ', 'Mộ người thợ săn', ['Một nấm mộ đắp đá, cắm cây cung gãy.', 'Tấm gỗ ghi: "Ông ấy nướng cá với lá thơm trên lửa củi, cả rừng ngửi thấy. Ai học được thì ông ấy vui."', '(Đã học công thức: Cá nướng lá thơm)'], { recipe: 'ca_nuong' }),
        lore('n_dinh', 'Phiến đá trên đỉnh đồi', 'Đỉnh Đồi Gió', ['Từ đây thấy cả Ashford, ruộng lúa và con đường lên kinh thành.', 'Phiến đá khắc chữ cổ: "Cá vàng trong vũng sâu, mật ong trên đỉnh gió, lá thơm dưới chân đồi. Nấu chung một nồi, người ngã sẽ đứng dậy."', '(Đã học công thức: Súp hồi sinh)'], { recipe: 'sup_hoi_sinh', up: true }),
        { id: 'hc_dinh', type: 'chest', label: 'Rương trên đỉnh đồi', up: true, reward: { diamond: 40, gold: 300 } },
    ],
    ashford: [
        node('g_ashford_tao_1', 'tao'), node('g_ashford_tao_2', 'tao'), node('g_ashford_tao_3', 'tao'), node('g_ashford_trung_4', 'trung'),
        node('g_trung2', 'trung'), node('g_tao3', 'tao'),
        lore('n_bang_lang', 'Bảng tin của làng', 'Bảng tin làng Ashford', ['"Ai nhặt được búa của bác Borin xin mang trả. Hậu tạ một bữa ở quán cô Lena."', '"Tối thứ bảy: cả làng góp gạo nấu cháo. Mang bát theo."']),
        lore('n_gieng', 'Phiến đá cạnh giếng', 'Lời khắc cạnh Giếng Cổ', ['"Giếng này đào năm làng lập. Nước trong thì làng yên."', 'Phía dưới có nét khắc mới hơn: "Ông tôi chôn hũ sành dưới bãi cỏ phía đông nam giếng."'], { reveal: 'hc_gieng' }),
        { id: 'hc_gieng', type: 'chest', needNote: 'n_gieng', label: 'Hũ sành chôn dưới đất', reward: { gold: 500, diamond: 15 } },
        lore('n_cong', 'Cáo thị ở cổng đông', 'Cáo thị cổng đông', ['"Lệnh của đội tuần tra: sau khi trời tối không ai ra Ngoại ô một mình."', 'Chữ ký: Rok. Bên dưới có đứa trẻ nào vẽ thêm một cái mặt cười.']),
    ],
    road: [
        node('g_road_dau_1', 'dau'), node('g_road_dau_2', 'dau'), node('g_road_dau_3', 'dau'), node('g_road_thao_4', 'thao'),
        node('g_road_thao_5', 'thao'), node('g_road_thao_6', 'thao'), node('g_road_dong_7', 'dong'), node('g_road_dong_8', 'dong'),
        node('g_dau3', 'dau'), node('g_thao3', 'thao'), node('g_go4', 'go'), node('g_dong2', 'dong'), node('f_ao', 'ca'),
        { id: 'lua_trai3', type: 'cook', label: 'Lửa trại bên đường' },
        lore('n_cot_moc', 'Cột mốc đá', 'Cột mốc Đường Vương Đạo', ['"Valoria: nửa ngày đường. Ashford: nửa ngày đường."', 'Ai đó viết phấn: "Ao bên đường có cá. Quăng câu lúc phao vào vạch xanh thì trúng."']),
        lore('n_tram', 'Tờ giấy dán ở trạm canh', 'Lịch gác trạm canh', ['Lịch gác bị gạch xoá nhiều lần. Tên "Will" bị xếp gác liền ba đợt.', 'Mặt sau có dòng chữ nhỏ: "Gửi Hanna: anh vẫn ổn. Đừng lo."']),
    ],
    capital: [
        node('g_capital_tao_1', 'tao'), node('g_capital_tao_2', 'tao'),
        node('g_tao4', 'tao'),
        lore('n_tuong', 'Bệ tượng đá', 'Bệ tượng vị vua đầu tiên', ['"Người dựng thành này bằng lời hứa: không ai trong tường thành phải đói."', 'Dưới chân tượng có mấy mẩu bánh mì ai đó đặt cho chim.']),
        lore('n_cho', 'Bảng giá ở chợ', 'Bảng giá chợ kinh thành', ['Giá bột mì tăng gấp ba trong một tháng. Dòng "lương cứu trợ" bị gạch.', 'Góc bảng có ghi chú của người bán: "Hàng dự trữ tôi để trong rương ở ngõ cụt phía nam phố chợ, ai đói cứ lấy."'], { reveal: 'hc_cho' }),
        { id: 'hc_cho', type: 'chest', needNote: 'n_cho', label: 'Rương hàng dự trữ', reward: { gold: 800, stone: 4 } },
        lore('n_thu_vien', 'Tấm bia trước thư viện', 'Bia thư viện hoàng gia', ['"Sách ở đây thuộc về người đọc, không thuộc về người giữ."', 'Nét khắc đã mòn, nhưng có người vẫn lau sạch mỗi ngày.']),
    ],
    tavern_in: [
        { id: 'bep_lena', type: 'cook', kitchen: true, label: 'Bếp của cô Lena' },
    ],
    forge_in: [
        { id: 'ban_dung_cu', type: 'craft', label: 'Bàn dụng cụ' },
    ],
};
const ALL_OBJECTS = Object.values(OBJECTS).flat();
const NOTES = Object.entries(OBJECTS).flatMap(([scene, list]) => list.filter(o => o.lore).map(o => ({ ...o, scene })));

// ---------- lời bâng quơ của dân làng (bong bóng khi người chơi đi ngang) — đổi theo số ải đã qua ----------
const AMBIENT = {
    mira: [[0, ['Trời trở gió rồi…', 'Nồi cháo phải canh lửa nhỏ.']], [10, ['Mái nhà sửa được một nửa rồi.', 'Đi đường nhớ mặc ấm nhé.']], [20, ['Làng mình lại có tiếng trẻ con cười.', 'Già nhớ mấy đứa lắm.']]],
    borin: [[0, ['Lò mà nguội là tay ta ngứa.', 'Thép tốt phải tôi ba lần.']], [4, ['Tiếng búa lại vang rồi!', 'Cần cuốc hay rìu thì ghé xưởng.']], [12, ['Nghe nói kinh thành đang thiếu thợ rèn.', 'Quặng sắt trên gờ đá mới là đồ tốt.']]],
    lena: [[0, ['Hôm nay hết bột mì mất rồi…', 'Ai cũng cần một bữa nóng.']], [10, ['Bếp đỏ lửa lại rồi đây!', 'Có nguyên liệu thì vào bếp mà nấu nhé.']], [15, ['Món nào ngon nhớ để phần đồng đội.', 'Súp nấm hôm nay hơi mặn tay.']]],
    villager_m: [[0, ['Kho lúa cháy hết rồi…', 'Phải dựng lại trước mùa mưa.']], [10, ['Nhà tôi lợp xong mái rồi!', 'Sói bớt phá rào hẳn.']]],
    villager_f: [[0, ['Không biết anh Will có ổn không…', 'Đêm qua giếng lại kêu lạ.']], [10, ['Táo ở góc làng chín rồi đấy.', 'Mong thư sớm tới nơi.']]],
    kid: [[0, ['Yaa! Tiêu diệt Goblin!', 'Con Mướp đâu rồi nhỉ?']], [7, ['Chị Sera về rồi!', 'Lớn lên em sẽ leo được đỉnh đồi!']]],
    farmer: [[0, ['Lúa chín mà chẳng ai dám gặt.', 'Cái chân này lại đau.']], [3, ['Cá ao dạo này béo lắm.', 'Hái lúa nhớ chừa gốc, ba ngày sau lại lên.']], [10, ['Năm nay được mùa đấy.', 'Thỏ rừng nướng là nhất.']]],
    rok: [[0, ['Tuần tra thêm một vòng nữa.', 'Đừng đi xa một mình.']], [5, ['Ăn no rồi hãy đánh.', 'Thịt nướng than… lâu rồi chưa ăn.']]],
    sera: [[7, ['Trà thảo mộc giúp ngủ ngon lắm.', 'Mọi người nhớ thay băng đúng giờ.']]],
    jessica: [[2, ['Hừm.', 'Bánh táo ở kinh thành mới gọi là bánh.']], [14, ['Sổ sách không biết nói dối.', 'Đừng nhìn tôi.']]],
    guard: [[10, ['Đứng gác cả ngày mỏi chân quá.', 'Lệnh trên cứ đổi liên tục.']]],
    merchant: [[10, ['Hàng tốt giá rẻ đây!', 'Đường này dạo trước đông vui lắm.']], [13, ['Kinh thành mở cổng lại là tôi đi ngay.', 'Muối với sữa thì cô Lena có bán.']]],
    corvin: [[12, ['Trang này… không, trang kia mới đúng.', 'Sách cháy rồi thì chỉ còn trí nhớ.']], [16, ['Chữ viết tay không ai giả được mãi.', 'Ngồi xuống đọc đi, đừng đứng đọc.']]],
    elise: [[14, ['Ba mươi hai bao… thiếu hai.', 'Bột mì phải tới tay người đói.']], [20, ['Phụ vương thích hoa chuông trắng.', 'Còn nhiều việc phải làm lắm.']]],
    nun: [[13, ['Cầu cho đêm nay không ai lạnh.', 'Chăn vẫn thiếu năm tấm.']], [15, ['Có cháo nóng ở nhà cứu tế đấy.', 'Con đi đường bình an.']]],
    villager_m2: [[12, ['Lệnh gì mà lạ thế không biết…', 'Đổi ca chậm quá.']], [20, ['Nữ vương muôn năm!', 'Cuối cùng cũng được ngủ yên.']]],
    merchant2: [[12, ['Táo đỏ đây! Lê vàng đây!', 'Dạo này chợ vắng quá.']], [20, ['Chợ đông lại rồi!', 'Mua táo về làm bánh đi.']]],
    bard: [[0, ['La la la…', 'Thiếu một câu vần nữa thôi.']], [10, ['Bài ca Skarn Răng Sắt, ai nghe không?', 'Cá nướng lá thơm… hát thế nào nhỉ.']]],
    hank: [[0, ['Hức…', 'Thêm một cốc nữa.']], [10, ['Bếp có lửa là quán có khách.', 'Hức… củi khô cháy thơm lắm.']]],
    mae: [[0, ['Thầy ơi, lò nguội rồi!', 'Em mài xong lưỡi cuốc rồi.']], [8, ['Cuốc sắt đập được quặng sắt đấy.', 'Rìu thép chặt một nhát là đổ.']]],
    ella: [[0, ['Chữ này đọc là gì nhỉ?', 'Bà ơi, kể chuyện bảy vị Thánh đi.']]],
};
const clearedCount = (pr) => Object.keys(pr.campaign?.cleared?.story ?? {}).filter(k => /^c1-\d\d$/.test(k)).length;
/** 2–3 câu bâng quơ của NPC theo tiến trình (không có -> []) */
function ambient(pr, npcId) {
    const sets = AMBIENT[npcId];
    if (!sets) return [];
    const n = clearedCount(pr);
    let pick = null;
    for (const [from, lines] of sets) if (n >= from) pick = lines;
    return pick ?? [];
}

// ---------- trạng thái ----------
function ensure(pr) {
    pr.world ??= {};
    const w = pr.world;
    w.mats ??= {}; w.tools ??= {}; w.gather ??= {}; w.hits ??= {}; w.casts ??= {}; w.notes ??= {}; w.books ??= {};
    return w;
}
const have = (pr, id) => pr.world?.mats?.[id] ?? 0;
function addMat(pr, id, n = 1) {
    if (!MATS[id]) return 0;
    const w = ensure(pr), before = w.mats[id] ?? 0;
    w.mats[id] = Math.max(0, Math.min(MAT_MAX, before + n));
    if (!w.mats[id]) delete w.mats[id];
    return (w.mats[id] ?? 0) - before;
}
const hasMats = (pr, need = {}) => Object.entries(need).every(([id, n]) => have(pr, id) >= n);
function takeMats(pr, need = {}) {
    if (!hasMats(pr, need)) return false;
    for (const [id, n] of Object.entries(need)) addMat(pr, id, -n);
    return true;
}
const toolTier = (pr, tool) => pr.world?.tools?.[tool] ?? 0;
const tierInfo = (tool, tier) => TOOLS[tool]?.tiers.find(t => t.tier === tier) ?? null;
const needText = (n) => `${tierInfo(n.tool, n.tier).name}${n.tier < 3 ? ' trở lên' : ''}`;

/** Nhận dụng cụ bậc 1 từ nhiệm vụ (không hạ bậc đang có) */
function giveTool(pr, tool, tier = 1) {
    if (!TOOLS[tool]) return false;
    const w = ensure(pr);
    w.tools[tool] = Math.max(w.tools[tool] ?? 0, tier);
    return true;
}
/** Rèn dụng cụ lên bậc kế: đủ cấp tài khoản + vật liệu + vàng. Trừ đồ đúng 1 lần rồi mới nâng bậc. */
function craft(pr, wallet, tool) {
    const def = TOOLS[tool];
    if (!def) return { ok: false, why: 'Không có dụng cụ này' };
    const w = ensure(pr), cur = w.tools[tool] ?? 0, next = tierInfo(tool, cur + 1);
    if (!cur) return { ok: false, why: `Chưa có ${def.name}. Hãy nhận ${def.tiers[0].name} từ nhiệm vụ trước` };
    if (!next) return { ok: false, why: `${def.name} đã ở bậc cao nhất của chương này` };
    if (A.ensureAccount(pr).level < next.account) return { ok: false, why: `${next.name} cần cấp tài khoản ${next.account}` };
    if (!hasMats(pr, next.cost.mats)) return { ok: false, why: `Thiếu vật liệu: ${costText(next.cost)}` };
    if (!((wallet.gold ?? 0) >= next.cost.gold)) return { ok: false, why: `Cần ${next.cost.gold} Vàng` };
    if (!takeMats(pr, next.cost.mats) || !W.trySpend(wallet, 'gold', next.cost.gold)) return { ok: false, why: 'Không rèn được, hãy thử lại' };
    w.tools[tool] = next.tier;
    return { ok: true, tool, tier: next.tier, text: `Đã rèn ${next.name}!` };
}
const costText = (c) => [...Object.entries(c.mats ?? {}).map(([id, n]) => `${n} ${MATS[id].name}`), ...(c.gold ? [`${c.gold} Vàng`] : [])].join(', ');

// ---------- điểm hái ----------
const dayOf = (now) => Q.dayKey(now);
const RESPAWN_MS = 72 * 60 * 60 * 1000;
// Legacy day keys (date strings or small numeric dates) are already respawned.
function respawnAt(pr, o) {
    const at = pr.world?.gather?.[o.id];
    return typeof at === 'number' && Number.isFinite(at) && at > 1e11 ? at + RESPAWN_MS : null;
}
/** 'ready' | 'done' (depleted persistent object) | 'hidden' */
function nodeState(pr, o, now) {
    const n = NODES[o.kind], w = pr.world ?? {};
    if (!n) return 'hidden';
    if (n.fish) { const c = w.casts?.[o.id]; return c?.d === dayOf(now) && (c.n >= castsOf(pr, n) || (c.t ?? 0) >= FISH_TRIES) ? 'done' : 'ready'; }
    return (now ?? Date.now()) < (respawnAt(pr, o) ?? 0) ? (n.stay ? 'done' : 'hidden') : 'ready';
}
const pressesFor = (n, tier) => Math.max(1, (n.presses ?? 1) - Math.max(0, tier - (n.tier ?? 0)));
const castsOf = (pr, n) => n.casts + (toolTier(pr, 'rod') >= 3 ? 1 : 0);
/** Kiểm tra dụng cụ cho điểm này -> null nếu đủ, không thì câu báo cần gì */
function toolLack(pr, n) {
    if (!n.tool) return null;
    const t = toolTier(pr, n.tool);
    if (t >= n.tier) return null;
    return `${n.name} cần ${needText(n)}${t ? ` (đang có ${tierInfo(n.tool, t).name})` : ''}`;
}
/** Số vật nhận được: trong khoảng n của điểm + 1 mỗi bậc dụng cụ hơn (đã kiểm tra bằng test giới hạn) */
function rollYield(n, tier, rng) {
    const [lo, hi] = n.n;
    return lo + Math.floor(rng() * (hi - lo + 1)) + Math.max(0, tier - (n.tier ?? tier));
}
/** 1 lần bấm vào điểm hái. Trả { ok:false, why } | { ok, hit: { left, total } } (chưa xong) | { ok, got, text } (xong, đã cộng đồ) */
function hitNode(pr, wallet, o, now = Date.now(), rng = Math.random) {
    const n = NODES[o.kind], w = ensure(pr);
    if (!n) return { ok: false, why: 'Không có gì ở đây' };
    if (nodeState(pr, o, now) !== 'ready') return { ok: false, why: n.fish ? 'Cá ở đây đã bị động, mai quay lại nhé' : `${n.name} đã hái rồi, mọc lại sau 72 giờ kể từ lúc hái` };
    const lack = toolLack(pr, n);
    if (lack) return { ok: false, why: lack };
    if (n.fish) return { ok: true, fishing: fishInfo(pr, o) };
    const tier = n.tool ? toolTier(pr, n.tool) : 0, total = pressesFor(n, tier), day = dayOf(now);
    const h = w.hits[o.id]?.d === day ? w.hits[o.id] : (w.hits[o.id] = { d: day, n: 0 });
    h.n++;
    if (h.n < total) return { ok: true, hit: { left: total - h.n, total }, text: `${n.verb ?? 'Hái'}… còn ${total - h.n} lần` };
    delete w.hits[o.id];
    w.gather[o.id] = now;                       // đánh dấu đã hái TRƯỚC khi cộng đồ -> không nhận 2 lần
    const got = {}, count = addMat(pr, n.item, rollYield(n, tier, rng));
    if (count) got[n.item] = count;
    const parts = count ? [`+${count} ${MATS[n.item].name}`] : [`Túi đã đầy ${MATS[n.item].name}`];
    if (n.bonus && rng() < n.bonus.chance * Math.max(1, tier)) {
        if (n.bonus.wallet) { W.add(wallet, n.bonus.wallet, 1); parts.push('+1 Đá Cường Hoá'); }
        else if (addMat(pr, n.bonus.mat, 1)) { got[n.bonus.mat] = 1; parts.push(`+1 ${MATS[n.bonus.mat].name}`); }
    }
    return { ok: true, got, done: true, respawnAt: now + RESPAWN_MS, text: `${n.verb ?? 'Hái'} ${n.name}: ${parts.join(' · ')}` };
}

// ---------- câu cá: client chơi thanh thời điểm, server quyết định cá (giới hạn theo ngày) ----------
function fishInfo(pr, o) {
    const n = NODES[o.kind], c = pr.world?.casts?.[o.id];
    const used = c?.d === dayOf(Date.now()) ? c.n : 0;
    return { id: o.id, left: Math.max(0, castsOf(pr, n) - used), speed: n.rare ? 1.35 : 1, zone: n.rare ? 0.16 : 0.22 };
}
/** Kết quả 1 lần quăng câu: quality 'miss' | 'good' | 'perfect' (client báo). 0–2 con mỗi lần; trượt không mất lượt nhưng vẫn tính vào số lần thử trong ngày. */
function fishCast(pr, o, quality, now = Date.now(), rng = Math.random) {
    const n = NODES[o?.kind], w = ensure(pr);
    if (!n?.fish) return { ok: false, why: 'Ở đây không câu được' };
    const lack = toolLack(pr, n);
    if (lack) return { ok: false, why: lack };
    const day = dayOf(now), c = w.casts[o.id]?.d === day ? w.casts[o.id] : (w.casts[o.id] = { d: day, n: 0, t: 0 });
    const max = castsOf(pr, n);
    if (c.n >= max || (c.t ?? 0) >= FISH_TRIES) return { ok: false, why: 'Cá ở đây đã bị động, mai quay lại nhé' };
    c.t = (c.t ?? 0) + 1;
    if (quality !== 'good' && quality !== 'perfect') return { ok: true, got: {}, left: max - c.n, text: 'Hụt rồi! Cá đớp mồi xong bơi mất.' };
    c.n++;
    const rod = toolTier(pr, 'rod'), got = {};
    const pool = FISH.filter(f => !f.rod || rod >= f.rod).map(f => ({ id: f.id, w: f.w * (f.id !== 'ca_chep' ? (quality === 'perfect' ? 2 : 1) * (n.rare ?? 1) * (rod >= 3 ? 1.5 : 1) : 1) }));
    const pick = () => { let r = rng() * pool.reduce((s, f) => s + f.w, 0); for (const f of pool) { if ((r -= f.w) < 0) return f.id; } return pool[0].id; };
    const first = pick();
    if (addMat(pr, first, 1)) got[first] = 1;
    if (quality === 'perfect' && rng() < 0.25 && addMat(pr, 'ca_chep', 1)) got.ca_chep = (got.ca_chep ?? 0) + 1;
    const names = Object.entries(got).map(([id, k]) => `+${k} ${MATS[id].name}`);
    return { ok: true, got, left: max - c.n, rare: !!got.ca_vang, text: names.length ? `Câu được: ${names.join(' · ')}` : 'Túi cá đã đầy' };
}

// ---------- ghi chép ----------
/** Đọc 1 ghi chép: ghi vào sổ (lần đầu). Trả { first } */
function readNote(pr, o) {
    const w = ensure(pr), first = !w.notes[o.id];
    w.notes[o.id] = true;
    return { first };
}
const noteRead = (pr, id) => !!pr.world?.notes?.[id];
/** Sổ "Ghi chép" gửi client: ghi chép chưa đọc chỉ hiện ??? */
function notesState(pr, sceneName = (id) => id) {
    const list = NOTES.map(n => noteRead(pr, n.id)
        ? { id: n.id, read: true, title: n.title, where: sceneName(n.scene), lines: n.lines }
        : { id: n.id, read: false, title: '???', where: sceneName(n.scene), lines: [] });
    return { have: list.filter(n => n.read).length, total: list.length, list };
}

/** Túi nguyên liệu + dụng cụ gửi client */
function bagState(pr) {
    const w = ensure(pr), lv = A.ensureAccount(pr).level;
    return {
        mats: Object.entries(MATS).filter(([id]) => w.mats[id]).map(([id, m]) => ({ id, name: m.name, kind: m.kind, n: w.mats[id], rare: !!m.rare })),
        tools: Object.entries(TOOLS).map(([id, t]) => {
            const tier = w.tools[id] ?? 0, next = tierInfo(id, tier + 1);
            return { id, name: t.name, use: t.use, tier, tierName: tier ? tierInfo(id, tier).name : null, first: t.tiers[0].name,
                next: tier && next ? { name: next.name, account: next.account, cost: next.cost, costText: costText(next.cost), levelOk: lv >= next.account, matsOk: hasMats(pr, next.cost.mats), goldOk: (pr.wallet?.gold ?? 0) >= next.cost.gold } : null };
        }),
    };
}

module.exports = { MATS, MAT_MAX, TOOLS, NODES, FISH, FISH_TRIES, OBJECTS, ALL_OBJECTS, NOTES, AMBIENT, ambient, ensure, have, addMat, hasMats, takeMats, toolTier, tierInfo, giveTool, craft, costText,
    RESPAWN_MS, respawnAt, nodeState, pressesFor, toolLack, rollYield, hitNode, fishInfo, fishCast, readNote, noteRead, notesState, bagState };
