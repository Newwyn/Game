// ============================================================
// 📜 DỮ LIỆU NHIỆM VỤ CHƯƠNG 1 (bộ máy: game/quests.js · kế hoạch: demo/KE_HOACH_NHIEM_VU_CHUONG_1.md)
//   type: 'side' (phụ) · 'branch' (chuỗi nhánh, kết bằng 1 ải) · 'hidden' (ẩn: không có dấu, tự kích hoạt)
//   open: { stage: 'c1-04', account: 5, quest: '<id đã xong>' } — điều kiện mở
//   steps: làm lần lượt; goal xem game/quests.js (talk / deliver / collect / interact / reach / clearStage / flag /
//          winBattles / loseThenWin / openChests / jumpChests / readClues / standOn / useSkills / enhanceGear)
//   Lời thoại: [người nói, lời] — 'npc' = người đang nói chuyện · 'me' = nhân vật chính · 'sys' = dẫn truyện.
//   Lời ở đây viết ngắn cho đúng nghĩa, sẽ có người viết lại cho hay sau.
// Vị trí vật / người thêm trên bản đồ: src/world/mapsExtra.js · luật hiển thị: game/world.js (QUEST_OBJECTS bên dưới)
// ============================================================
const npc = (...t) => t.map(x => ['npc', x]);
const sys = (t) => ['sys', t];

// Tên vật nhiệm vụ trong túi (nhiều vật cùng tên thì gộp "×n")
const ITEM_NAMES = {
    q_lua: 'Bó lúa mì', q_nam: 'Nấm rơm', q_cui: 'Bó củi', q_quang: 'Quặng xanh', q_thu: 'Thư của chị Hanna', q_meo: 'Mèo mướp',
    q_trang1: 'Trang sổ lương', q_trang2: 'Trang sổ lương', q_trang3: 'Trang sổ lương',
    q_chan1: 'Tấm chăn', q_chan2: 'Tấm chăn', q_chan3: 'Tấm chăn', q_chan4: 'Tấm chăn', q_chan5: 'Tấm chăn', q_hoa: 'Hoa chuông trắng',
};

// Vật / người thêm trên bản đồ cho nhiệm vụ (game/world.js gộp vào SCENES):
//   pickup: vật nhặt (chỉ hiện khi bước đang làm cần nó) · spot: chỗ xem / tương tác (always: luôn có ở đó)
//   person: người đứng yên (hiện khi nhiệm vụ cần tới, hoặc always) · gather: vật nhặt hằng ngày (mọc lại lúc 05:00)
//   dailyBoard: bảng "việc hôm nay" · jump: phải NHẢY mới tới (không tính vào kiểm tra đi bộ)
const QUEST_OBJECTS = {
    ashford: [
        { id: 'daily_board', type: 'dailyBoard', label: 'Bảng việc hôm nay' },
        { id: 'pk_meo', type: 'pickup', item: 'q_meo', quest: 's_meo', label: 'Mèo mướp trong thùng gỗ', jump: true },
        { id: 'bia_vo_danh', type: 'spot', always: true, label: 'Tấm bia cũ', lines: ['Một tấm bia đá phủ rêu. Chỗ khắc tên đã bị đục phẳng.', 'Dưới chân bia có một bó hoa khô còn mới.'] },
        { id: 'ga1', type: 'spot', always: true, feed: true, label: 'Máng gà', lines: ['{Cau} rải một nắm thóc. Lũ gà chạy tới mổ lia lịa.'] },
        { id: 'ga2', type: 'spot', always: true, feed: true, label: 'Máng gà', lines: ['Con gà mái dẫn đàn con ra ăn, kêu cục cục.'] },
        { id: 'ga3', type: 'spot', always: true, feed: true, label: 'Máng gà', lines: ['Con gà trống đứng canh cho cả đàn ăn xong mới ăn.'] },
        { id: 'hoa_a1', type: 'gather', label: 'Khóm hoa dại' },
        { id: 'hoa_a2', type: 'gather', label: 'Khóm hoa dại' },
    ],
    outskirts: [
        { id: 'pk_lua', type: 'pickup', item: 'q_lua', quest: 's_chao', label: 'Bó lúa mì' },
        { id: 'pk_nam', type: 'pickup', item: 'q_nam', quest: 's_chao', label: 'Nấm rơm' },
        { id: 'pk_cui', type: 'pickup', item: 'q_cui', quest: 's_chao', label: 'Bó củi' },
        { id: 'pk_quang', type: 'pickup', item: 'q_quang', quest: 's_kiem', label: 'Quặng xanh' },
        { id: 'w_soi1', type: 'spot', label: 'Dấu chân sói', lines: ['{Cau} hét to và gõ khiên. Con sói cụp đuôi chạy mất.'] },
        { id: 'w_soi2', type: 'spot', label: 'Dấu chân sói', lines: ['Hai con sói đang cào hàng rào. Thấy người, chúng bỏ chạy vào rừng.'] },
        { id: 'w_soi3', type: 'spot', label: 'Dấu chân sói', lines: ['Chỉ còn dấu chân. {Cau} dựng lại mấy cọc rào bị đổ.'] },
        { id: 'bu_nhin', type: 'spot', always: true, label: 'Bù nhìn rơm', lines: ['Con bù nhìn đội mũ rách, đứng nhìn ra ruộng.', '(Hình như nó vừa gật đầu?)'] },
        { id: 'mo_cua', type: 'spot', label: 'Lối xuống Mỏ Sâu', lines: ['Một lối đào mới, còn mùi thuốc nổ. Bên dưới có tiếng cuốc và tiếng Goblin cãi nhau.'] },
        { id: 'luong_giau', type: 'spot', label: 'Đống rơm lạ', lines: ['Dưới đống rơm là mấy bao lương bị giấu. Quanh đó đầy dấu chân sói.'] },
        { id: 'p_khach', type: 'person', name: 'Người khách lạ', label: 'Người khách lạ', lines: ['Tôi chỉ đi ngang qua thôi.'] },
        { id: 'hoa_o1', type: 'gather', label: 'Khóm hoa dại' },
        { id: 'hoa_o2', type: 'gather', label: 'Khóm hoa dại' },
    ],
    forest: [
        { id: 't_bay1', type: 'spot', label: 'Bẫy thỏ', lines: ['Bẫy trống. {Cau} gài lại cho chắc.'] },
        { id: 't_bay2', type: 'spot', label: 'Bẫy thỏ', lines: ['Một con thỏ con mắc bẫy. {Cau} thả nó ra, nó chạy biến vào bụi.'] },
        { id: 't_bay3', type: 'spot', label: 'Bẫy thỏ', lines: ['Bẫy bị sói cắn đứt dây. {Cau} buộc lại.'] },
        { id: 't_bay4', type: 'spot', label: 'Bẫy thỏ', lines: ['Bẫy có một con thỏ béo. Lão Gus sẽ mừng lắm.'] },
    ],
    road: [
        { id: 'p_chong', type: 'person', name: 'Anh Will', label: 'Anh lính trạm canh', lines: ['Trạm canh dạo này đông người qua lại lắm.'] },
    ],
    capital: [
        { id: 'pg1', type: 'pickup', item: 'q_trang1', quest: 's_so', label: 'Trang giấy rơi' },
        { id: 'pg2', type: 'pickup', item: 'q_trang2', quest: 's_so', label: 'Trang giấy rơi' },
        { id: 'pg3', type: 'pickup', item: 'q_trang3', quest: 's_so', label: 'Trang giấy rơi' },
        { id: 'ch1', type: 'pickup', item: 'q_chan1', quest: 's_chan', label: 'Thùng chăn cũ' },
        { id: 'ch2', type: 'pickup', item: 'q_chan2', quest: 's_chan', label: 'Thùng chăn cũ' },
        { id: 'ch3', type: 'pickup', item: 'q_chan3', quest: 's_chan', label: 'Thùng chăn cũ' },
        { id: 'ch4', type: 'pickup', item: 'q_chan4', quest: 's_chan', label: 'Thùng chăn cũ' },
        { id: 'ch5', type: 'pickup', item: 'q_chan5', quest: 's_chan', label: 'Thùng chăn cũ' },
        { id: 'pk_hoa', type: 'pickup', item: 'q_hoa', quest: 's_hoa', label: 'Hoa chuông trắng' },
        { id: 'p_thuky', type: 'person', name: 'Thư ký Odo', label: 'Thư ký cổng thành', lines: ['Xếp hàng đi. Giấy tờ phải đủ ba dấu.'] },
        { id: 'so_no', type: 'spot', label: 'Sổ nợ bỏ quên', lines: ['Một cuốn sổ nợ của phường buôn. Một dòng bị gạch đè bằng mực đỏ.', 'Dưới vết gạch vẫn đọc được: "Jessica, đã trả đủ". Người ký nhận là một sĩ quan hậu cần.'] },
    ],
    tavern_in: [
        { id: 'ghe_trong', type: 'spot', always: true, label: 'Chiếc ghế trống', lines: ['Một chiếc ghế trống ở góc quán. Trên bàn có một cái cốc úp sẵn.'] },
    ],
};

const QUESTS = [
    // ---------------- PHỤ (15) ----------------
    { id: 's_chao', type: 'side', name: 'Nồi cháo cho cả làng', giver: 'mira', scene: 'ashford', open: { stage: 'c1-01' },
        desc: 'Bà Mira muốn nấu một nồi cháo lớn cho những người vừa mất nhà. Gom lúa mì, nấm và củi ở Ngoại ô.',
        steps: [
            { id: 'gom', text: 'Gom lúa mì, nấm rơm và củi ở Ngoại ô', goal: { type: 'collect', items: ['q_lua', 'q_nam', 'q_cui'] } },
            { id: 'tra', text: 'Mang đồ về cho Bà Mira', goal: { type: 'deliver', npc: 'mira', items: ['q_lua', 'q_nam', 'q_cui'] } },
        ],
        reward: { gold: 300, stone: 2, items: { exp_small: 1 } },
        intro: npc('Nhiều nhà mất bếp sau trận cháy. Già muốn nấu một nồi cháo cho cả làng.', 'Cháu ra Ngoại ô gom giúp già ít lúa mì, nấm rơm và một bó củi nhé.'),
        outro: npc('Đủ cả rồi. Tối nay ai cũng có một bát cháo nóng.', 'Cháu cầm lấy chút này, đừng từ chối.') },
    { id: 'borin', type: 'side', legacy: true, name: 'Cái búa bị trộm', giver: 'borin', scene: 'ashford', open: { stage: 'c1-04' }, flag: 'bua_borin',
        desc: 'Bác Borin mất cây búa ở góc ruộng phía tây nam Ngoại ô. Lò rèn đang chờ tiếng búa trở lại.',
        steps: [
            { id: 'tim', text: 'Tìm Búa của bác Borin ở góc ruộng tây nam Ngoại ô', goal: { type: 'collect', items: ['hammer'] } },
            { id: 'tra', text: 'Mang Búa của bác Borin về cho Bác Borin', goal: { type: 'deliver', npc: 'borin', items: ['hammer'] } },
        ],
        reward: { gold: 500 }, extra: 'Mở nhánh N2',
        intro: npc('Chà, {cau} đánh Goblin giỏi đấy!', 'Hôm trước ta làm rơi cây búa ngoài ruộng Ngoại ô, góc tây nam… tìm giúp ta được không?'),
        outro: npc('Ôi, cây búa của ta! Rơi tận góc ruộng à? Cảm ơn {cau} nhiều lắm!') },
    { id: 's_kiem', type: 'side', name: 'Lưỡi kiếm đầu tiên', giver: 'borin', scene: 'ashford', open: { quest: 'borin' },
        desc: 'Có búa rồi, bác Borin muốn rèn cho {cau} một món vũ khí tử tế. Bác cần quặng xanh, và cần thời gian.',
        steps: [
            { id: 'quang', text: 'Lấy Quặng xanh cạnh mạch đá ở Ngoại ô', goal: { type: 'collect', items: ['q_quang'] } },
            { id: 'dua', text: 'Mang Quặng xanh về cho Bác Borin', goal: { type: 'deliver', npc: 'borin', items: ['q_quang'] }, say: { borin: ['Quặng tốt đấy. Ta cần một lúc để rèn.', 'Cứ đi làm việc của {cau}, thắng vài trận rồi quay lại.'] } },
            { id: 'cho', text: 'Chờ bác Borin rèn: thắng 2 trận bất kỳ', goal: { type: 'winBattles', n: 2 } },
            { id: 'nhan', text: 'Quay lại nhận vũ khí ở Bác Borin', goal: { type: 'talk', who: ['borin'] } },
        ],
        reward: { gold: 500, stone: 3, items: { exp_small: 1 }, gear: { slot: 'weapon', level: 10, rarity: 1 } },
        intro: npc('Có búa rồi thì phải rèn thứ gì cho ra hồn.', 'Mang cho ta một khối quặng xanh ở cạnh mạch đá Ngoại ô, ta rèn cho {cau} một món vũ khí.'),
        outro: npc('Xong rồi đây. Không đẹp, nhưng chắc tay.', 'Cầm nó mà giữ lấy người bên cạnh.') },
    { id: 'lena', type: 'side', legacy: true, name: 'Mở lại quán', giver: 'lena', scene: 'ashford', open: { stage: 'c1-10' }, flag: 'nguyen_lieu_lena',
        desc: 'Cô Lena muốn nấu một bữa tiết kiệm cho những người đang sửa làng sau trận Skarn.',
        steps: [
            { id: 'tim', text: 'Tìm Lúa mì vàng (Ngoại ô) và Nấm sương (Rừng Sương)', goal: { type: 'collect', items: ['wheat', 'mushroom'] } },
            { id: 'tra', text: 'Mang Lúa mì vàng, Nấm sương về cho Cô Lena', goal: { type: 'deliver', npc: 'lena', items: ['wheat', 'mushroom'] } },
        ],
        reward: { gold: 300, diamond: 10 }, extra: 'Mở nhánh N3 · mở Quán ăn',
        intro: npc('Cô muốn nấu một bữa cho những người đang sửa làng, tiết kiệm thôi, làng vẫn đói mà.', '{Cau} tìm giúp cô Lúa mì vàng ở cánh đồng và Nấm sương trong Rừng Sương nhé?'),
        outro: npc('Lúa mì vàng và nấm sương! Đủ nấu cả nồi lớn rồi!') },
    { id: 's_khach', type: 'side', name: 'Vị khách không trả tiền', giver: 'lena', scene: 'ashford', open: { quest: 'lena' },
        desc: 'Một người khách lạ ăn xong rồi lẳng lặng bỏ đi. Cô Lena không cần tiền, cô chỉ muốn biết người đó có ổn không.',
        steps: [
            { id: 'tim', text: 'Tìm người khách lạ ở cánh đồng Ngoại ô', goal: { type: 'talk', who: ['p_khach'] }, say: { p_khach: ['Tôi không có tiền. Tôi là lính đào ngũ ở Cầu Đá.', 'Bát canh đó là bữa nóng đầu tiên của tôi trong mười ngày. Nhờ {cau} đưa giúp cái huy hiệu này, coi như tôi gán nợ.'] } },
            { id: 've', text: 'Về kể lại cho Cô Lena', goal: { type: 'talk', who: ['lena'] } },
        ],
        reward: { gold: 500, stone: 3, items: { exp_small: 1 } },
        intro: npc('Hôm qua có người khách lạ ăn xong rồi đi mất, không trả tiền.', 'Cô không tiếc bát canh. Nhưng nhìn người đó gầy lắm. {Cau} tìm quanh Ngoại ô xem họ có sao không nhé.'),
        outro: npc('Lính đào ngũ à… Cái huy hiệu này cô sẽ giữ hộ.', 'Lần sau gặp, bảo người đó cứ vào quán. Còn đủ chỗ.') },
    { id: 'sera', type: 'side', legacy: true, name: 'Thuốc cho nhà cứu tế', giver: 'sera', scene: 'ashford', open: { stage: 'c1-07' }, flag: 'thao_duoc_sera',
        desc: 'Sera muốn để lại đủ thuốc cho người bệnh ở Ashford trước khi lên đường. Hãy hái thảo dược ở Rừng Sương.',
        steps: [
            { id: 'tim', text: 'Tìm Thảo dược ở Rừng Sương', goal: { type: 'collect', items: ['herb'] } },
            { id: 'tra', text: 'Mang Thảo dược về cho Seraphine', goal: { type: 'deliver', npc: 'sera', items: ['herb'] } },
        ],
        reward: { gold: 500 }, extra: 'Người bệnh ở Ashford có thuốc dùng',
        intro: npc('Trước khi đi cùng mọi người, tôi muốn để lại đủ thuốc cho người bệnh ở Ashford.', '{Cau} hái giúp tôi ít thảo dược ở bìa Rừng Sương được không?'),
        outro: npc('Thảo dược! Đủ để nhà cứu tế dùng tới khi đoàn cứu trợ về. Cảm ơn {cau}.') },
    { id: 's_bang', type: 'side', name: 'Băng cho người bị thương', giver: 'sera', scene: 'ashford', open: { quest: 'sera' },
        desc: 'Băng gạc sắp hết. Sera nhờ cả đội đánh cẩn thận: thắng 3 trận mà không ai trong đội gục.',
        steps: [
            { id: 'danh', text: 'Thắng 3 trận mà không ai trong đội gục', goal: { type: 'winBattles', n: 3, noDeaths: true } },
            { id: 've', text: 'Về báo cho Seraphine', goal: { type: 'talk', who: ['sera'] } },
        ],
        reward: { gold: 500, stone: 3, items: { exp_small: 1 } },
        intro: npc('Băng gạc chỉ còn đủ cho ba ngày.', 'Tôi xin mọi người một điều: ba trận tới, đừng để ai gục. Mỗi người gục là một cuộn băng.'),
        outro: npc('Ba trận, không ai phải nằm cáng. Cảm ơn mọi người.', 'Số băng dư tôi gửi lại nhà cứu tế rồi.') },
    { id: 's_meo', type: 'side', name: 'Con mèo trên mái nhà', giver: 'kid', scene: 'ashford', open: { stage: 'c1-01' },
        desc: 'Con mèo mướp của bé Pip chui vào thùng gỗ trong khoảng sân có rào sau lò rèn (góc đông bắc làng). Phải NHẢY qua hàng rào mới vào được.',
        steps: [
            { id: 'be', text: 'Nhảy qua hàng rào sau lò rèn (đông bắc làng) và bế mèo ra', goal: { type: 'collect', items: ['q_meo'] } },
            { id: 'tra', text: 'Mang mèo về cho Bé Pip', goal: { type: 'deliver', npc: 'kid', items: ['q_meo'] } },
        ],
        reward: { gold: 300, stone: 2, items: { exp_small: 1 } },
        intro: npc('{Anh} ơi! Con Mướp của em trèo qua mái lò rèn rồi nhảy vào cái sân có rào, không ra được!', 'Em thấp quá không nhảy qua rào được. {Anh} nhảy vào bế nó ra giúp em nhé!'),
        outro: npc('Mướp ơi! Mày làm tao sợ muốn chết!', 'Em cảm ơn {anh}! Lớn lên em cũng nhảy cao như {anh}!') },
    { id: 's_rao', type: 'side', name: 'Hàng rào bị phá', giver: 'villager_m', scene: 'ashford', open: { stage: 'c1-03' },
        desc: 'Sói phá hàng rào quanh ruộng nhà anh Tom. Đuổi chúng ở 3 chỗ có dấu chân ngoài Ngoại ô.',
        steps: [
            { id: 'duoi', text: 'Đuổi sói ở 3 chỗ có dấu chân quanh ruộng Ngoại ô', goal: { type: 'interact', objs: ['w_soi1', 'w_soi2', 'w_soi3'] } },
            { id: 've', text: 'Về báo cho Anh Tom', goal: { type: 'talk', who: ['villager_m'] } },
        ],
        reward: { gold: 400, stone: 2, items: { exp_small: 1 } },
        intro: npc('Kho lúa cháy rồi, giờ tới lượt sói phá rào ruộng.', 'Tôi phải ở lại dựng nhà. {Anh} ra ruộng Ngoại ô đuổi chúng giúp tôi, có ba chỗ rào bị cào.'),
        outro: npc('Ba chỗ đều yên rồi à? May quá.', 'Lúa còn thì làng còn. Cảm ơn {anh}.') },
    { id: 's_thu', type: 'side', name: 'Thư gửi chồng ở trạm canh', giver: 'villager_f', scene: 'ashford', open: { stage: 'c1-10' }, give: ['q_thu'],
        desc: 'Chồng chị Hanna gác ở trạm canh trên Đường Vương Đạo, lâu rồi chưa có tin. Mang thư tới cho anh ấy.',
        steps: [
            { id: 'dua', text: 'Mang thư tới anh Will ở trạm canh trên Đường Vương Đạo', goal: { type: 'deliver', npc: 'p_chong', items: ['q_thu'] }, say: { p_chong: ['Thư của Hanna? Cô ấy với mấy đứa nhỏ vẫn ổn chứ?', 'Nhờ {cau} nhắn lại: hết đợt gác này tôi về. Tôi hứa.'] } },
            { id: 've', text: 'Về nhắn lại cho Chị Hanna', goal: { type: 'talk', who: ['villager_f'] } },
        ],
        reward: { gold: 500, stone: 3, items: { exp_small: 1 } },
        intro: npc('Chồng tôi gác ở trạm canh trên Đường Vương Đạo. Từ hôm Goblin tới, tôi chưa nhận được chữ nào.', 'Nếu {anh} đi lối đó, mang giúp tôi lá thư này nhé.'),
        outro: npc('Anh ấy hứa sẽ về à…', 'Vậy là đủ rồi. Cảm ơn {anh}, thật lòng.') },
    { id: 's_bay', type: 'side', name: 'Bẫy thỏ', giver: 'farmer', scene: 'outskirts', open: { stage: 'c1-03' },
        desc: 'Lão Gus đặt 4 cái bẫy thỏ trong Rừng Sương nhưng chân lão đau, không vào rừng được.',
        steps: [
            { id: 'kiem', text: 'Kiểm 4 cái bẫy thỏ trong Rừng Sương', goal: { type: 'interact', objs: ['t_bay1', 't_bay2', 't_bay3', 't_bay4'] } },
            { id: 've', text: 'Về báo cho Lão Gus', goal: { type: 'talk', who: ['farmer'] } },
        ],
        reward: { gold: 400, stone: 3, items: { exp_small: 1 } },
        intro: npc('Lão đặt bốn cái bẫy thỏ trong Rừng Sương, mà cái chân này chẳng chịu đi nữa.', '{Cau} vào xem giúp lão. Bẫy nào trống thì gài lại nhé.'),
        outro: npc('Được một con thỏ béo, thả một con thỏ con. Thế là phải đạo.', 'Tối nay nhà lão có thịt. Của {cau} đây.') },
    { id: 's_giay', type: 'side', name: 'Giấy thông hành', giver: 'villager_m2', scene: 'capital', open: { stage: 'c1-13' },
        desc: 'Anh lính gác thành cần đủ 3 con dấu trên giấy thông hành của đoàn dân Ashford: thư ký cổng, thủ thư Corvin và bà Rosa ở chợ.',
        steps: [
            { id: 'dau', text: 'Xin dấu của Thư ký Odo, Lão Corvin và Bà Rosa', goal: { type: 'talk', who: ['p_thuky', 'corvin', 'merchant2'] },
                say: { p_thuky: ['Đoàn Ashford à? Được, dấu của cổng thành đây.'], corvin: ['Thư viện bảo lãnh cho các ngươi. Đừng làm ta hối hận.'], merchant2: ['Dấu của phường chợ đây. Dân bị nạn thì phải giúp nhau chứ.'] } },
            { id: 've', text: 'Mang giấy về cho Anh lính gác thành', goal: { type: 'talk', who: ['villager_m2'] } },
        ],
        reward: { gold: 600, stone: 4, items: { exp_small: 1 } },
        intro: npc('Đoàn dân Ashford muốn vào thành phải có giấy thông hành đủ ba dấu.', 'Tôi không được rời chốt. {Anh} chạy giúp: thư ký cổng, thủ thư Corvin và bà Rosa ở chợ.'),
        outro: npc('Đủ ba dấu. Tôi cho đoàn vào ngay.', 'Lệnh thì lệnh, nhưng không ai bắt tôi để dân ngủ ngoài cổng.') },
    { id: 's_so', type: 'side', name: 'Sổ lương thực bị thiếu trang', giver: 'corvin', scene: 'capital', open: { stage: 'c1-16' },
        desc: 'Lúc lính lục soát thư viện, ba trang sổ lương thực bị gió cuốn ra chợ. Lão Corvin cần lấy lại đủ.',
        steps: [
            { id: 'tim', text: 'Tìm 3 trang sổ rơi quanh chợ kinh thành', goal: { type: 'collect', items: ['q_trang1', 'q_trang2', 'q_trang3'] } },
            { id: 'tra', text: 'Mang 3 trang sổ về cho Lão Corvin', goal: { type: 'deliver', npc: 'corvin', items: ['q_trang1', 'q_trang2', 'q_trang3'] } },
        ],
        reward: { gold: 700, stone: 4, items: { exp_small: 1 } },
        intro: npc('Lúc lính lục soát, ba trang sổ lương bị gió cuốn ra ngoài chợ.', 'Thiếu một trang là người ta có cớ nói cả cuốn là giả. Tìm giúp ta.'),
        outro: npc('Đủ ba trang, số trang khớp nhau.', 'Sổ sách đủ thì lời nói mới có chỗ dựa. Cảm ơn {chang}.') },
    { id: 's_chan', type: 'side', name: 'Chăn cho nhà cứu tế', giver: 'nun', scene: 'capital', open: { stage: 'c1-14' },
        desc: 'Nhà cứu tế thiếu chăn cho người tị nạn. Sơ Agnes nhờ gom 5 tấm chăn cũ người dân để sẵn trong các thùng gỗ quanh kinh thành.',
        steps: [
            { id: 'gom', text: 'Gom 5 tấm chăn từ các thùng gỗ quanh kinh thành', goal: { type: 'collect', items: ['q_chan1', 'q_chan2', 'q_chan3', 'q_chan4', 'q_chan5'] } },
            { id: 'tra', text: 'Mang 5 tấm chăn về cho Sơ Agnes', goal: { type: 'deliver', npc: 'nun', items: ['q_chan1', 'q_chan2', 'q_chan3', 'q_chan4', 'q_chan5'] } },
        ],
        reward: { gold: 700, stone: 5, items: { exp_small: 1 } },
        intro: npc('Đêm kinh thành lạnh hơn dưới làng. Nhà cứu tế thiếu chăn cho người mới tới.', 'Nhiều nhà đã để chăn cũ vào thùng gỗ trước cửa. Con gom giúp ta năm tấm nhé.'),
        outro: npc('Năm tấm chăn, năm người đêm nay không phải co ro.', 'Cầu cho con luôn gặp người tử tế trên đường.') },
    { id: 's_hoa', type: 'side', name: 'Bông hoa cho cha', giver: 'elise', scene: 'capital', open: { stage: 'c1-15' },
        desc: 'Nhà vua ốm nặng. Elise muốn đặt bên giường cha một bông hoa chuông trắng mọc ở vườn sau cung điện, nhưng cô không rời kho lương được.',
        steps: [
            { id: 'hai', text: 'Hái Hoa chuông trắng ở vườn sau cung điện', goal: { type: 'collect', items: ['q_hoa'] } },
            { id: 'tra', text: 'Mang hoa về cho Công chúa Elise', goal: { type: 'deliver', npc: 'elise', items: ['q_hoa'] } },
        ],
        reward: { gold: 800, stone: 5, items: { exp_small: 1 } },
        intro: npc('Hồi nhỏ, mỗi lần tôi ốm, phụ vương đều đặt một bông hoa chuông trắng bên gối.', 'Giờ tới lượt người ốm, mà tôi không rời kho lương được. Bạn hái giúp tôi một bông ở vườn sau cung điện nhé.'),
        outro: npc('Đúng loài hoa này rồi.', 'Tôi sẽ đặt bên giường người đêm nay. Cảm ơn bạn.') },
    // ---- dụng cụ hái lượm bậc 1 (game/gather.js TOOLS) + củi cho bếp ----
    { id: 't_dungcu', type: 'side', name: 'Cuốc và rìu của thợ rèn', giver: 'borin', scene: 'ashford', open: { stage: 'c1-02' }, tools: { pick: 1, axe: 1 },
        desc: 'Bác Borin cho mượn hẳn một cây cuốc gỗ và một cây rìu gỗ. Đổi lại, bác cần ít gỗ và quặng đồng để nhóm lại lò.',
        steps: [
            { id: 'gom', text: 'Chặt 2 Gỗ ở đống củi khô và đập 2 Quặng đồng ở Ngoại ô', goal: { type: 'mats', mats: { go: 2, dong: 2 }, at: 'g_go1' } },
            { id: 've', text: 'Về báo cho Bác Borin', goal: { type: 'talk', who: ['borin'] } },
        ],
        reward: { gold: 300, stone: 2, items: { exp_small: 1 } },
        intro: npc('Tay không thì làm được gì ngoài đồng. Cầm lấy cây cuốc gỗ với cây rìu gỗ này.', 'Đống củi khô thì chặt bằng rìu, tảng quặng thì đập bằng cuốc. Kiếm cho ta 2 khúc gỗ và 2 cục quặng đồng nhé.'),
        outro: npc('Được đấy. Đồ {cau} cứ giữ mà dùng.', 'Lên cấp cao hơn thì ghé bàn dụng cụ trong xưởng, ta chỉ cách rèn cuốc sắt, rìu sắt.') },
    { id: 't_cau', type: 'side', name: 'Cần câu của lão Gus', giver: 'farmer', scene: 'outskirts', open: { stage: 'c1-03' }, tools: { rod: 1 },
        desc: 'Lão Gus tặng {cau} cây cần câu tre. Lão muốn xem {cau} có câu nổi một con cá không.',
        steps: [
            { id: 'cau', text: 'Câu 1 con cá ở chỗ câu cá trong Rừng Sương', goal: { type: 'mats', any: ['ca_chep', 'ca_bac', 'ca_vang'], n: 1, at: 'f_rung' } },
            { id: 've', text: 'Về khoe với Lão Gus', goal: { type: 'talk', who: ['farmer'] } },
        ],
        reward: { gold: 300, stone: 2, items: { exp_small: 1 } },
        intro: npc('Chân lão đau, không ra bờ nước được nữa. Cây cần câu tre này để không cũng phí.', 'Cầm lấy. Trong Rừng Sương có chỗ câu. Thấy phao vào vạch xanh thì giật.'),
        outro: npc('Ha! Câu được thật à. Con đầu tiên bao giờ cũng nhớ nhất.', 'Vũng sâu phía đông rừng có cá quý, nhưng cần câu tre không kéo nổi đâu.') },
    { id: 's_cui', type: 'side', name: 'Củi cho bếp quán', giver: 'hank', scene: 'tavern_in', open: { quest: 'lena' },
        desc: 'Bếp quán cô Lena đỏ lửa lại rồi nhưng đống củi sau quán đã hết. Lão Hank nhờ kiếm 3 khúc gỗ.',
        steps: [
            { id: 'gom', text: 'Chặt 3 Gỗ ở các đống củi khô', goal: { type: 'mats', mats: { go: 3 }, at: 'g_go1' } },
            { id: 've', text: 'Về báo cho Lão Hank trong quán', goal: { type: 'talk', who: ['hank'] } },
        ],
        reward: { gold: 400, stone: 2, items: { exp_small: 1 } },
        intro: npc('Hức… bếp có lửa mà củi thì hết. Cô Lena bận quá không đi chặt được.', '{Ban} kiếm giúp 3 khúc gỗ nhé. Đống củi khô ngoài Ngoại ô ấy.'),
        outro: npc('Đủ củi rồi! Tối nay có canh nóng.', 'Hức… lửa trại ngoài đồng cũng nấu được đấy, nhớ mang nguyên liệu theo.') },

    // ---------------- NHÁNH (7 chuỗi, mỗi chuỗi kết bằng 1 ải nhánh) ----------------
    { id: 'b_gieng', type: 'branch', name: 'Dưới Giếng Cổ', giver: 'mira', scene: 'ashford', open: { stage: 'c1-07' },
        desc: 'Nước Giếng Cổ đục dần. Bà Mira tin dưới đáy giếng có thứ gì đó, và bài đồng dao cổ là chìa khoá.',
        steps: [
            { id: 'hoi', text: 'Hỏi Chị Hanna về chuyện Giếng Cổ', goal: { type: 'talk', who: ['villager_f'] }, say: { villager_f: ['Đêm qua tôi ra giếng, nghe dưới đáy có tiếng cào đá.', 'Bốn phiến đá quanh miệng giếng xoay được đấy. Bà Mira có bài đồng dao về chúng.'] } },
            { id: 'mo', text: 'Xoay 4 biểu tượng ở Giếng Cổ theo bài đồng dao', goal: { type: 'flag', flag: 'gieng_co' }, at: { scene: 'ashford', obj: 'well' } },
            { id: 'ai', text: 'Vượt ải nhánh N1: Dưới Giếng Cổ (Bảng ải)', goal: { type: 'clearStage', stage: 'c1-n1' }, at: { scene: 'ashford', obj: 'board' } },
            { id: 've', text: 'Về báo cho Bà Mira', goal: { type: 'talk', who: ['mira'] } },
        ],
        reward: { diamond: 100, gear: { slot: 'armor', level: 10, rarity: 1 } },
        intro: npc('Nước Giếng Cổ đục mấy hôm nay. Người xưa bảo giếng đục là dưới bể chứa có chuyện.', 'Cháu hỏi Hanna xem, con bé hay ra giếng ban đêm.'),
        outro: npc('Goblin lạc xuống bể chứa à… Hèn gì nước đục.', 'Làng có nước sạch lại rồi. Cái này của ông nhà già ngày trước, cháu giữ lấy.') },
    { id: 'b_mo', type: 'branch', name: 'Mỏ Sâu', giver: 'borin', scene: 'ashford', open: { quest: 'borin' },
        desc: 'Kẻ trộm búa đã đào thông một lối xuống Mỏ Sâu. Bác Borin muốn biết chúng đào trộm thứ gì.',
        steps: [
            { id: 'hoi', text: 'Hỏi Mae trong lò rèn về lối đào mới', goal: { type: 'talk', who: ['mae'] }, say: { mae: ['Em thấy Goblin vác bao ra từ phía mạch đá, đêm nào cũng có.', 'Lối xuống nằm ngay phía trên mạch đá ở Ngoại ô.'] } },
            { id: 'xem', text: 'Xem lối xuống Mỏ Sâu cạnh mạch đá ở Ngoại ô', goal: { type: 'interact', objs: ['mo_cua'] } },
            { id: 'ai', text: 'Vượt ải nhánh N2: Mỏ Sâu (Bảng ải)', goal: { type: 'clearStage', stage: 'c1-n2' }, at: { scene: 'ashford', obj: 'board' } },
            { id: 've', text: 'Về báo cho Bác Borin', goal: { type: 'talk', who: ['borin'] } },
        ],
        reward: { diamond: 100, gear: { slot: 'hands', level: 10, rarity: 1 } },
        intro: npc('Cây búa không tự rơi đâu. Có đứa lấy nó để đục đá.', 'Mae bảo có lối đào mới ngoài mỏ. Hỏi con bé rồi xuống xem chúng đào cái gì.'),
        outro: npc('Quặng xanh, đóng hòm có đánh số. Không phải Goblin tự nghĩ ra đâu.', 'Đôi găng này ta rèn dở từ trước. Giờ nó có chủ rồi.') },
    { id: 'b_bua', type: 'branch', name: 'Bữa Ăn Còn Đủ Chỗ', giver: 'lena', scene: 'ashford', open: { quest: 'lena' },
        desc: 'Một phần lương của làng bị giấu ngoài đồng từ đêm Goblin tới. Cô Lena muốn mang về trước khi sói tha mất.',
        steps: [
            { id: 'hoi', text: 'Hỏi Lão Hank trong quán về chỗ giấu lương', goal: { type: 'talk', who: ['hank'] }, say: { hank: ['Hức… đêm đó ta với mấy người vác lương ra giấu dưới đống rơm.', 'Góc đông nam cánh đồng Ngoại ô ấy. Mà coi chừng, sói đánh hơi thấy rồi.'] } },
            { id: 'xem', text: 'Tìm đống rơm giấu lương ở đông nam Ngoại ô', goal: { type: 'interact', objs: ['luong_giau'] } },
            { id: 'ai', text: 'Vượt ải nhánh N3: Bữa Ăn Còn Đủ Chỗ (Bảng ải)', goal: { type: 'clearStage', stage: 'c1-n3' }, at: { scene: 'ashford', obj: 'board' } },
            { id: 've', text: 'Về báo cho Cô Lena', goal: { type: 'talk', who: ['lena'] } },
        ],
        reward: { diamond: 100, gear: { slot: 'legs', level: 10, rarity: 2 } },
        intro: npc('Đêm Goblin tới, mấy người trong làng có giấu một phần lương ngoài đồng.', 'Lão Hank biết chỗ. Lão ngồi trong quán đấy, hỏi lúc lão còn tỉnh nhé.'),
        outro: npc('Mang về đủ cả rồi! Bữa tới ai tới cũng có phần.', 'Cái này khách cũ bỏ quên lâu lắm rồi. {Cau} dùng đi.') },
    { id: 'b_kiem', type: 'branch', name: 'Thanh kiếm của đội trưởng', giver: 'rok', scene: 'ashford', open: { stage: 'c1-10' },
        desc: 'Trước khi về Ashford, Rok từng là đội trưởng ở trạm canh phía đông. Anh bỏ lại thanh kiếm ở đó vào ngày cả đội không ai trở về.',
        steps: [
            { id: 'hoi', text: 'Hỏi Mae trong lò rèn về thanh kiếm cũ của Rok', goal: { type: 'talk', who: ['mae'] }, say: { mae: ['Thầy Borin kể: anh Rok về làng tay không. Kiếm của anh ấy cắm lại ở trạm canh cũ.', 'Trạm đó ở phía đông Ngoại ô, chỗ có đống tro ấy.'] } },
            { id: 'toi', text: 'Tới trạm canh cũ ở phía đông Ngoại ô', goal: { type: 'reach', scene: 'outskirts', x: 37, y: 12, r: 2 }, flag: 'kiem_doi_truong' },
            { id: 'ai', text: 'Vượt ải nhánh N6: Thanh Kiếm Của Đội Trưởng (Bảng ải)', goal: { type: 'clearStage', stage: 'c1-n6' }, at: { scene: 'ashford', obj: 'board' } },
            { id: 've', text: 'Mang thanh kiếm về cho Rok', goal: { type: 'talk', who: ['rok'] } },
        ],
        reward: { diamond: 100, gear: { slot: 'weapon', level: 10, rarity: 2 } },
        intro: [['npc', 'Trước khi lên kinh thành, tôi còn một việc chưa dám làm.'], ['npc', 'Ba năm trước tôi dẫn sáu người giữ trạm canh phía đông. Chỉ mình tôi về. Tôi cắm kiếm lại đó, coi như mình không xứng cầm nó.'], ['npc', 'Mae biết chỗ. Nếu {cau} tới đó… xem nó còn không.']],
        outro: [['npc', 'Vẫn là nó. Vết mẻ này là của lần chắn cho Tobin.'], ['npc', 'Tôi cứ nghĩ bỏ kiếm lại là trả nợ. Hoá ra chỉ là trốn.'], ['npc', 'Tôi sẽ mang nó lên kinh thành. Còn cái này, {cau} giữ. Của một người trong đội cũ.']] },
    { id: 'b_ten', type: 'branch', name: 'Cái tên bị gạch', giver: 'jessica', scene: 'outskirts', open: { stage: 'c1-14' },
        desc: 'Jessica từng nhận tiền để dẫn đường cho kẻ thuê Goblin. Cô muốn tìm lại cuốn sổ nợ có tên mình và kẻ đã trả tiền.',
        steps: [
            { id: 'hoi', text: 'Hỏi Ông Basim trên Đường Vương Đạo về sổ nợ của phường buôn', goal: { type: 'talk', who: ['merchant'] }, say: { merchant: ['Sổ nợ của phường buôn à? Ai nợ, ai trả, ai trả thay, ghi hết trong đó.', 'Cuốn năm ngoái bị bỏ quên ở sạp cuối chợ kinh thành, gần rương hàng.'] } },
            { id: 'xem', text: 'Tìm cuốn sổ nợ ở cuối chợ kinh thành', goal: { type: 'interact', objs: ['so_no'] }, flag: 'ten_bi_gach' },
            { id: 'ai', text: 'Vượt ải nhánh N7: Cái Tên Bị Gạch (Bảng ải)', goal: { type: 'clearStage', stage: 'c1-n7' }, at: { scene: 'capital', obj: 'gate_board' } },
            { id: 've', text: 'Về gặp Jessica ở Ngoại ô', goal: { type: 'talk', who: ['jessica'] } },
        ],
        reward: { diamond: 100, gear: { slot: 'ring', level: 20, rarity: 1 } },
        intro: [['npc', 'Tôi nói thật một lần thôi nên nghe cho kỹ.'], ['npc', 'Năm ngoái tôi nợ phường buôn một khoản. Có người trả thay, đổi lại tôi dẫn một toán "thợ săn" qua rừng. Sau này tôi mới biết đó là người đi thuê Goblin.'], ['npc', 'Tên tôi nằm trong sổ nợ, cạnh tên kẻ trả tiền. Ông Basim biết cuốn sổ ở đâu.']],
        outro: [['npc', 'Một sĩ quan hậu cần của Valdric. Vậy là khớp với hồ sơ của Rok.'], ['npc', 'Tên tôi bị gạch trong sổ rồi. Nhưng tôi không gạch nó khỏi lời khai đâu. Tôi sẽ đứng ra làm chứng, cả phần của mình.'], ['npc', 'Cầm lấy. Đừng hỏi tôi lấy ở đâu.']] },
    { id: 'b_sach', type: 'branch', name: 'Trang Sách Bị Xé', giver: 'corvin', scene: 'capital', open: { stage: 'c1-20' },
        desc: 'Cuốn sách về Thất Thánh ở nhà Bà Mira bị xé mất mấy trang. Lão Corvin tin bản đầy đủ nằm trong số trang cứu được từ đám cháy.',
        steps: [
            { id: 'doc', text: 'Xem lại giá sách trong nhà Bà Mira ở Ashford', goal: { type: 'interact', objs: ['mira_shelf'] }, at: { scene: 'mira_in', obj: 'mira_shelf' } },
            { id: 'ghep', text: 'Xếp lại các trang sách ở thư viện kinh thành', goal: { type: 'flag', flag: 'trang_sach' }, at: { scene: 'capital', obj: 'pages' } },
            { id: 'ai', text: 'Vượt ải nhánh N4: Trang Sách Bị Xé (Bảng ải)', goal: { type: 'clearStage', stage: 'c1-n4' }, at: { scene: 'capital', obj: 'gate_board' } },
            { id: 've', text: 'Về báo cho Lão Corvin', goal: { type: 'talk', who: ['corvin'] } },
        ],
        reward: { diamond: 100, gear: { slot: 'necklace', level: 20, rarity: 2 } },
        intro: npc('Ngươi từng thấy cuốn sách về bảy vị Thánh ở nhà bà trưởng làng chứ? Nó bị xé mất mấy trang.', 'Xem lại nó trước, nhớ kỹ trang bị xé nằm ở đâu. Rồi về đây giúp ta ghép những trang cứu được.'),
        outro: npc('Có kẻ không muốn những trang này được đọc. Giờ thì chúng đã về chỗ cũ.', 'Thư viện không có gì quý hơn thứ này để tặng. Cầm lấy.') },
    { id: 'b_hammo', type: 'branch', name: 'Hầm Mộ', giver: 'elise', scene: 'capital', open: { stage: 'c1-20' },
        desc: 'Một phần hầm mộ hoàng gia bị hư sau biến cố. Elise nhờ cả nhóm giúp lão Corvin lấy lại bia tên của các đời vua.',
        steps: [
            { id: 'hoi', text: 'Hỏi Lão Corvin về lối vào hầm mộ', goal: { type: 'talk', who: ['corvin'] }, say: { corvin: ['Lối chính sập rồi. Nhưng sổ cũ ghi có một phiến đá xoay được trong vườn cung điện.', 'Dưới đó có người gác. Ông ta không biết triều đại đã đổi.'] } },
            { id: 'mo', text: 'Mở phiến đá lạ trong vườn cung điện', goal: { type: 'flag', flag: 'loi_vao_ham_mo' }, at: { scene: 'capital', obj: 'crypt' } },
            { id: 'ai', text: 'Vượt ải nhánh N5: Hầm Mộ (Bảng ải)', goal: { type: 'clearStage', stage: 'c1-n5' }, at: { scene: 'capital', obj: 'gate_board' } },
            { id: 've', text: 'Về báo cho Elise', goal: { type: 'talk', who: ['elise'] } },
        ],
        reward: { diamond: 100, gear: { slot: 'armor', level: 20, rarity: 2 } },
        intro: npc('Hầm mộ hoàng gia sập một phần. Bia tên của các đời vua còn ở dưới đó.', 'Tôi không muốn phụ vương nằm xuống mà không có tổ tiên bên cạnh. Corvin biết lối vào.'),
        outro: npc('Bia tên đã về đủ. Người gác mộ cũng được nghỉ rồi.', 'Đây là đồ trong kho hoàng gia. Người xứng đáng thì nên được mặc nó.') },

    // ---------------- ẨN (10) — không có dấu, tự kích hoạt khi làm đúng việc đầu tiên, KHÔNG dùng giờ thật ----------------
    { id: 'h_leo', type: 'hidden', name: 'Kẻ leo trèo', scene: 'ashford',
        desc: 'Có những cái rương đặt ở chỗ chỉ nhảy mới tới.',
        steps: [{ id: 'ruong', text: 'Mở 5 rương ở những chỗ phải nhảy mới tới', goal: { type: 'jumpChests', n: 5 } }],
        reward: { diamond: 100, title: 'Kẻ leo trèo' } },
    { id: 'h_bunhin', type: 'hidden', name: 'Người canh ruộng', scene: 'outskirts',
        desc: 'Con bù nhìn ngoài ruộng hình như biết nghe.',
        steps: [{ id: 'noi', text: 'Nói chuyện với bù nhìn 3 lần', goal: { type: 'interact', obj: 'bu_nhin', n: 3 } }],
        reward: { diamond: 80 },
        outro: [sys('Lần thứ ba, cái mũ rách rơi xuống. Trong mũ có một túi nhỏ ai đó giấu từ lâu.')] },
    { id: 'h_ghep', type: 'hidden', name: 'Người ghép hình', scene: 'forest',
        desc: 'Bốn manh mối, đọc theo đúng thứ tự sự việc xảy ra.',
        steps: [{ id: 'doc', text: 'Tìm đủ 4 manh mối theo đúng thứ tự: vết bánh xe, đống tro, phiến đá kho giam, áp phích', goal: { type: 'readClues', clues: ['clue_wheel', 'clue_arrows', 'clue_ledger', 'clue_poster'], ordered: true } }],
        reward: { diamond: 120, title: 'Thám tử Ashford' } },
    { id: 'h_khach', type: 'hidden', name: 'Vị khách lúc nửa đêm', scene: 'tavern_in', open: { stage: 'c1-15' },
        desc: 'Chiếc ghế ở góc quán cô Lena lúc nào cũng trống, nhưng cốc thì luôn có người úp sẵn.',
        steps: [{ id: 'ghe', text: 'Nói chuyện với chiếc ghế trống ở góc quán 3 lần', goal: { type: 'interact', obj: 'ghe_trong', n: 3 } }],
        reward: { diamond: 100 },
        outro: [sys('Lần thứ ba, cái cốc tự lật lên. Dưới cốc là mấy viên kim cương và một mẩu giấy: "Cảm ơn vì đã chào ta."')] },
    { id: 'h_ca', type: 'hidden', name: 'Con cá vàng', scene: 'road',
        desc: 'Giữa ao trên Đường Vương Đạo có một hòn đảo nhỏ. Đứng yên thì mới thấy.',
        steps: [{ id: 'dung', text: 'Đứng yên 10 giây trên đảo giữa ao ở Đường Vương Đạo', goal: { type: 'standOn', scene: 'road', x: 18, y: 7, sec: 10 } }],
        reward: { diamond: 120, title: 'Bạn của cá vàng' },
        outro: [sys('Mặt ao lặng dần. Một con cá vàng nổi lên, nhả vào tay {cau} một thứ lấp lánh rồi lặn mất.')] },
    { id: 'h_motminh', type: 'hidden', name: 'Một mình', scene: 'ashford',
        desc: 'Có trận phải tự mình đánh.',
        steps: [{ id: 'danh', text: 'Thắng một ải (từ ải 5 trở lên) với đội chỉ 1 người', goal: { type: 'winBattles', n: 1, squadSize: 1, minNo: 5 } }],
        reward: { diamond: 100, title: 'Độc hành' } },
    { id: 'h_bia', type: 'hidden', name: 'Người không có tên', scene: 'ashford',
        desc: 'Sau nhà Bà Mira có một tấm bia bị đục mất tên.',
        steps: [
            { id: 'xem', text: 'Xem tấm bia cũ sau nhà Bà Mira', goal: { type: 'interact', obj: 'bia_vo_danh', n: 1 } },
            { id: 'hoi', text: 'Hỏi Bà Mira về tấm bia', goal: { type: 'talk', who: ['mira'] }, say: { mira: ['Cháu thấy tấm bia rồi à.', 'Đó là người lính đầu tiên chết vì làng này. Tên bị đục đi theo lệnh trên, vì ông ấy cãi lệnh để cứu dân.', 'Già vẫn đặt hoa. Có tên hay không thì người ấy vẫn nằm đó.'] } },
        ],
        reward: { diamond: 80 } },
    { id: 'h_ga', type: 'hidden', name: 'Bạn của lũ gà', scene: 'ashford',
        desc: 'Lũ gà trong làng cũng cần người nhớ tới.',
        steps: [{ id: 'cho', text: 'Cho gà ăn ở 3 máng khác nhau trong làng', goal: { type: 'interact', objs: ['ga1', 'ga2', 'ga3'] } }],
        reward: { diamond: 80, title: 'Bạn của lũ gà' } },
    { id: 'h_dungday', type: 'hidden', name: 'Đứng dậy', scene: 'capital',
        desc: 'Thua Valdric một lần không có nghĩa là hết.',
        steps: [{ id: 'danh', text: 'Thua Đại tướng Valdric (ải 20) một lần rồi thắng', goal: { type: 'loseThenWin', stage: 'c1-20' } }],
        reward: { diamond: 150, title: 'Đứng dậy' } },
    { id: 'h_ruong', type: 'hidden', name: 'Tay trắng tay đầy', scene: 'ashford',
        desc: 'Không bỏ sót cái rương nào ở Ashford, Ngoại ô, Đường Vương Đạo và kinh thành.',
        steps: [{ id: 'mo', text: 'Mở hết mọi rương thường trong các vùng chương 1', goal: { type: 'openChests', ids: ['sq_chest', 'well_chest', 'tavern_chest', 'forge_chest', 'mira_chest', 'field_chest', 'forest_chest', 'bridge_chest', 'market_chest'] } }],
        reward: { diamond: 150, title: 'Tay trắng tay đầy' } },
];

// ---------------- VIỆC HẰNG NGÀY ----------------
// Mỗi ngày 4 việc (làm mới 05:00 giờ máy chủ): 1–2 việc đánh quái (fight) + việc nhẹ. Mỗi việc 20 Kim Cương, đủ 4 việc thêm 20 = 100 / ngày.
//   kind: win (thắng trận) · kill (hạ quái) · clean (thắng không ai gục) · talk (nói chuyện N người khác nhau) · gather (nhặt vật: rương tính 3)
//         skill (dùng kỹ năng trong trận) · jump (nhảy trên bản đồ) · feed (cho gà ăn) · walk (tới 1 vùng) · enh (cường hoá)
const DAILY = {
    each: 20, bonus: 20, count: 4, resetHour: 5,
    tasks: [
        { id: 'd_win2', fight: true, kind: 'win', need: 2, text: 'Thắng 2 trận bất kỳ' },
        { id: 'd_kill6', fight: true, kind: 'kill', need: 6, text: 'Hạ 6 quái' },
        { id: 'd_clean', fight: true, kind: 'clean', need: 1, text: 'Thắng 1 trận mà không ai trong đội gục' },
        { id: 'd_talk2', kind: 'talk', need: 2, text: 'Nói chuyện với 2 người khác nhau' },
        { id: 'd_gather', kind: 'gather', need: 3, text: 'Mở 1 rương hoặc nhặt 3 vật (hoa dại, mạch đá, vật nhiệm vụ)' },
        { id: 'd_skill10', kind: 'skill', need: 10, text: 'Dùng 10 lần kỹ năng trong trận' },
        { id: 'd_jump5', kind: 'jump', need: 5, text: 'Nhảy 5 lần trên bản đồ' },
        { id: 'd_feed', kind: 'feed', need: 1, text: 'Cho gà trong làng Ashford ăn 1 lần' },
        { id: 'd_walk', kind: 'walk', need: 1, scene: 'forest', text: 'Đi dạo tới Rừng Sương' },
        { id: 'd_enh', kind: 'enh', need: 1, needs: 'forge', text: 'Cường hoá 1 món trang bị' },
    ],
};

/** Các BƯỚC chính tuyến chương 1 (thưởng 3 mức: MAIN_TIERS): với mỗi ải — tới điểm truyện -> qua ải -> (nếu có) về báo lại */
// 3 mức thưởng của bước chính tuyến (người chơi quyết 12/11/2026): bước NHỎ = bình EXP nhỏ + vàng · bước TRUNG BÌNH (8 ải) = bình EXP lớn + vàng +
// Kim Cương · bước QUAN TRỌNG (3 ải: trùm Skarn, Morwen, kết chương) = bình EXP siêu lớn + vàng + Kim Cương. Mức tính ở bước CUỐI của ải; bước khác đều là nhỏ.
const MAIN_BIG = [10, 15, 20], MAIN_MID = [2, 5, 7, 8, 12, 14, 17, 18];
const MAIN_TIERS = {
    small: { gold: 150, items: { exp_small: 1 } },
    mid: { gold: 500, diamond: 30, items: { exp_big: 1 } },
    big: { gold: 1500, diamond: 100, items: { exp_huge: 1 } },
};
function mainSteps(spots, reports, stages) {
    const out = [];
    for (const s of stages) {
        const n = s.no, sp = spots[n], rep = reports[n];
        out.push({ id: `go${n}`, kind: 'go', no: n, text: n === 2 ? 'Ra cánh đồng Ngoại ô, có tiếng ồn' : sp?.go ?? `Tới chỗ bắt đầu ải ${n}` });
        out.push({ id: `clear${n}`, kind: 'clear', no: n, text: `Vượt ải ${n}: ${s.name}` });
        if (rep) out.push({ id: `report${n}`, kind: 'report', no: n, text: rep.go });
        out[out.length - 1].tier = MAIN_BIG.includes(n) ? 'big' : MAIN_MID.includes(n) ? 'mid' : 'small';   // chỉ MỐC CUỐI của mỗi ải (qua ải, hoặc về báo lại nếu có) mới trả Kim Cương
    }
    return out;
}

module.exports = { QUESTS, QUEST_OBJECTS, ITEM_NAMES, DAILY, MAIN_TIERS, mainSteps };
