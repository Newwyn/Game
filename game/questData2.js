// ============================================================
// 📜 DỮ LIỆU NHIỆM VỤ CHƯƠNG 2 — Tiếng Gọi Rừng Thiêng (vùng Elf: Sylvaren · Lunaria)
//   Sử dụng cùng bộ máy nhiệm vụ tại game/quests.js và phần thưởng MAIN_TIERS từ game/questData1.js.
//   Chú ý: không dùng gạch dài ('—') trong lời thoại / tên nhiệm vụ / bước chính tuyến.
// ============================================================
const { MAIN_TIERS } = require('./questData1');

const npc = (...t) => t.map(x => ['npc', x]);
const sys = (t) => ['sys', t];

const ITEM_NAMES = {
    q_nhua_cay: 'Mẫu nhựa cây héo',
    q_mat_na: 'Chiếc mặt nạ vàng',
    q_tinh_dau: 'Lọ tinh dầu thanh tẩy',
    q_chia_thap: 'Chìa khóa Tháp chiêm tinh',
    q_linhthao1: 'Nhánh linh thảo sáng',
    q_linhthao2: 'Nhánh linh thảo sáng',
    q_linhthao3: 'Nhánh linh thảo sáng',
};

const QUEST_OBJECTS = {
    sylvaren: [
        { id: 'pk2_nhua', type: 'pickup', item: 'q_nhua_cay', main: true, label: 'Mẫu nhựa cây héo' },
        { id: 'pk2_tinhdau', type: 'pickup', item: 'q_tinh_dau', main: true, label: 'Lọ tinh dầu thanh tẩy' },
        { id: 'm2_tro_re', type: 'spot', label: 'Đám tro tím dưới rễ cây', lines: [
            '{Cau} chạm nhẹ vào lớp tro tím quanh rễ cổ thụ. Tro vẫn còn ấm, thoang thoảng mùi ma thuật lạ.',
            'Lối vào sâu hơn trong rừng đầy những tán cây rũ lá.'] },
        { id: 'm2_dau_giay', type: 'spot', label: 'Dấu giày sắt bên bờ suối', lines: [
            'Những vết giày đinh nặng trịch in hằn trên bùn ẩm cạnh Suối Trăng, hướng thẳng về phía bụi rậm phía đông.',
            'Đây rõ ràng là dấu chân của người ngoài, không phải của tộc Elf.'] },
        { id: 'm2_day_thung', type: 'spot', label: 'Cuộn dây thừng cắt dở', lines: [
            'Một đoạn dây thừng tẩm thuốc mê bị vứt lại vội vàng, còn vương sợi tua áo lụa xanh của Nerissa.'] },
        { id: 'm2_re_cau', type: 'spot', label: 'Rễ cổ co giật', lines: [
            'Những chùm rễ lớn của Cầu Rễ Cổ rung lên từng hồi theo mạch đập yếu ớt.',
            'Cần phải thanh tẩy lớp độc tím bám trên cầu trước khi bước qua vực sâu.'] },
        { id: 'pk2_lt1', type: 'pickup', item: 'q_linhthao1', quest: 's2_thao_duoc', label: 'Nhánh linh thảo sáng' },
        { id: 'pk2_lt2', type: 'pickup', item: 'q_linhthao2', quest: 's2_thao_duoc', label: 'Nhánh linh thảo sáng' },
        { id: 'pk2_lt3', type: 'pickup', item: 'q_linhthao3', quest: 's2_thao_duoc', label: 'Nhánh linh thảo sáng' },
        { id: 'm2_hoc1', type: 'spot', label: 'Hốc đá tây rừng', lines: ['Bên trong chỉ có vài quả thông khô và chiếc lá bạc. Không thấy sáo đâu.'] },
        { id: 'm2_hoc2', type: 'spot', label: 'Hốc đá giữa bãi cỏ', lines: ['Có tiếng sột soạt nhỏ của sóc rừng chạy vụt qua. Hốc đá trống không.'] },
        { id: 'm2_hoc3', type: 'spot', label: 'Hốc đá cạnh bãi săn', lines: ['Kẹt trong khe đá đúng là chiếc sáo gỗ khắc hoa văn lá của Bé Tavi!', 'Thổi nhẹ thử một hơi, tiếng sáo vẫn trong veo.'] },
    ],
    lunaria: [
        { id: 'pk2_chia', type: 'pickup', item: 'q_chia_thap', main: true, label: 'Chìa khóa Tháp chiêm tinh' },
        { id: 'm2_to_roi', type: 'spot', label: 'Tờ truyền đơn mặt trời', lines: [
            'Trên tờ giấy in biểu tượng mặt trời đỏ rực: “Dưới ánh sáng Varkos, mọi tộc đều sống mãi.”',
            'Mép giấy mới tinh, rõ ràng vừa được phát khắp chợ đêm ít lâu trước.'] },
        { id: 'm2_den_chot', type: 'spot', label: 'Lồng đèn bị dập tắt', lines: [
            'Chiếc lồng đèn trăng vỡ kính, xung quanh có dấu chân hối hả kéo về hướng bắc.'] },
        { id: 'm2_chot1', type: 'spot', label: 'Chốt gác tây quảng trường', lines: ['Bàn trực gác bị lật nghiêng, sổ điểm danh còn nằm lại dưới đất.'] },
        { id: 'm2_chot2', type: 'spot', label: 'Chốt gác đường lên Vườn treo', lines: ['Không còn bóng dáng kẻ lạ nào nấp quanh đây. Chốt đã an toàn.'] },
        { id: 'm2_chot3', type: 'spot', label: 'Chốt gác nam thành', lines: ['{Cau} kiểm tra kỹ lối ra phía nam: mọi cánh cửa đều còn nguyên chốt khóa.'] },
        { id: 'm2_den1', type: 'spot', label: 'Cột đèn lồng phía tây', lines: ['{Cau} châm lại ngọn bấc. Ánh sáng xanh dịu tỏa ra khắp góc quảng trường.'] },
        { id: 'm2_den2', type: 'spot', label: 'Cột đèn lồng cạnh đài phun', lines: ['Ánh đèn bừng sáng phản chiếu xuống mặt nước Đài phun trăng lấp lánh.'] },
        { id: 'm2_den3', type: 'spot', label: 'Cột đèn lồng khu nhà cây', lines: ['Ngọn đèn cuối cùng sáng rực lên, cả lối nhỏ ngập tràn ánh trăng êm dịu.'] },
        { id: 'm2_bia1', type: 'spot', always: true, label: 'Phiến bia cổ ngữ thứ nhất', lines: [
            'Phiến đá rêu phong khắc hàng chữ Elf cổ: “Bảy ngọn đuốc thắp nên vòm trời ngày loạn lạc.”'] },
        { id: 'm2_bia2', type: 'spot', always: true, label: 'Phiến bia cổ ngữ thứ hai', lines: [
            'Mặt đá sáng nhè nhẹ dưới chân Ngai Cây: “Lòng tham biến lời thề thành xiềng xích cho kẻ ở dưới.”'] },
        { id: 'm2_bia3', type: 'spot', always: true, label: 'Phiến bia cổ ngữ thứ ba', lines: [
            'Dòng chữ khắc sâu nhất nằm sát khu vườn nam: “Khi sáu ngọn đuốc quay lưng, ngọn thứ bảy giữ chìa khóa.”'] },
    ],
};

// Điểm truyện Chương 2 (20 ải: 1–12 ở Sylvaren, 13–20 ở Lunaria)
const STORY_SPOTS = {
    1: { obj: 'sp2_border', scene: 'sylvaren', label: 'Biên giới sương bạc', go: 'Bước vào biên giới sương bạc phía tây Rừng Sylvaren' },
    2: { obj: 'sp2_roots', scene: 'sylvaren', label: 'Rễ cây mục tím', go: 'Kiểm tra đám rễ cây đang cựa quậy ở bìa rừng' },
    3: { obj: 'sp2_wisps', scene: 'sylvaren', label: 'Quầng ma trơi tím', go: 'Lần theo ánh sáng ma trơi tím sâu trong rừng' },
    4: { npc: 'aeris', scene: 'sylvaren', go: 'Gặp Đội trưởng Aeris ở chốt tuần biên' },
    5: { obj: 'sp2_treant', scene: 'sylvaren', label: 'Treant Già Mục Rỗng', go: 'Tiến tới gốc Treant Già đang phát sáng ma quái' },
    6: { obj: 'sp2_moon', scene: 'sylvaren', label: 'Bờ Suối Trăng', go: 'Tới bờ Suối Trăng phía bắc Rừng Sylvaren' },
    7: { obj: 'sp2_poachers', scene: 'sylvaren', label: 'Trại săn trộm', go: 'Áp sát trại săn trộm để giải cứu Nerissa' },
    8: { obj: 'sp2_cave', scene: 'sylvaren', label: 'Hang nấm phát quang', go: 'Tiến vào hang nấm phát quang theo dấu mặt nạ' },
    9: { obj: 'sp2_festival', scene: 'sylvaren', label: 'Bãi hội đom đóm', go: 'Tới bãi hội đom đóm tìm kẻ dẫn đường' },
    10: { obj: 'sp2_vexa', scene: 'sylvaren', label: 'Mũi tên đen của Vexa', go: 'Đuổi kịp Vexa tại bãi săn phía nam Sylvaren' },
    11: { obj: 'sp2_bridge', scene: 'sylvaren', label: 'Đầu Cầu Rễ Cổ', go: 'Tiến tới đầu Cầu Rễ Cổ phía đông rừng' },
    12: { obj: 'sp2_keeper', scene: 'sylvaren', label: 'Chốt giữ Cầu Rễ Cổ', go: 'Gặp người giữ Cầu Rễ Cổ để qua thành Lunaria' },
    13: { npc: 'lun_guard', scene: 'lunaria', go: 'Gặp Vệ binh Lunaria ở cổng thành ánh trăng' },
    14: { obj: 'sp2_market', scene: 'lunaria', label: 'Chợ đêm ánh trăng', go: 'Tới khu chợ đêm ánh trăng đang hỗn loạn' },
    15: { obj: 'sp2_thalor', scene: 'lunaria', label: 'Kết giới của Thalor', go: 'Đối đầu Đại pháp sư Thalor tại quảng trường ánh trăng' },
    16: { obj: 'sp2_alley', scene: 'lunaria', label: 'Ngõ đèn lồng', go: 'Lần theo Ngõ đèn lồng phía nam Lunaria' },
    17: { obj: 'sp2_garden', scene: 'lunaria', label: 'Vườn treo Lunaria', go: 'Lên Vườn treo phía đông thành cứu cây cổ thụ' },
    18: { obj: 'sp2_tower', scene: 'lunaria', label: 'Tháp chiêm tinh', go: 'Tiến vào Tháp chiêm tinh gặp học giả Elarion' },
    19: { obj: 'sp2_throne', scene: 'lunaria', label: 'Ngai Cây Cổ Thụ', go: 'Chạy tới bảo vệ Ngai Cây Cổ Thụ giữa thành' },
    20: { obj: 'sp2_malkor', scene: 'lunaria', label: 'Vòng sáng giáng thế', go: 'Bước vào vòng sáng trên Ngai Cây quyết đấu Sứ giả Malkor' },
};

// Về báo lại Chương 2 (không đặt báo cáo ở 1–4 lên aeris hay 1–14 lên oren để giữ tương thích việc cũ)
const REPORTS = {
    5: { npc: 'aeris', scene: 'sylvaren', from: 2, go: 'Về báo Đội trưởng Aeris rằng Treant Già đã yên nghỉ' },
    10: { npc: 'aeris', scene: 'sylvaren', from: 2, go: 'Mang mũi tên đen về báo tin cho Đội trưởng Aeris' },
    15: { npc: 'oren', scene: 'lunaria', from: 1, go: 'Về báo với Trưởng lão Oren rằng Thalor đã tỉnh ngộ' },
    20: { npc: 'oren', scene: 'lunaria', from: 2, ending: true, go: 'Về gặp Trưởng lão Oren làm lễ hồi sinh Ngai Cây Cổ Thụ' },
};

const QUESTS = [
    { id: 's2_thao_duoc', chapter: 'c2', type: 'side', name: 'Thuốc giải cho cây rừng', giver: 'elfmerchant', scene: 'sylvaren', open: { stage: 'c2-02' },
        desc: 'Cô Lirien muốn pha thuốc giải cho những cây non nhiễm độc tím. Hãy hái 3 nhánh Linh thảo sáng mọc rải rác quanh Bìa rừng Sylvaren.',
        steps: [
            { id: 'hai', text: 'Tìm 3 nhánh Linh thảo sáng quanh Bìa rừng Sylvaren', goal: { type: 'collect', items: ['q_linhthao1', 'q_linhthao2', 'q_linhthao3'] } },
            { id: 'tra', text: 'Mang 3 nhánh Linh thảo sáng về cho Cô Lirien', goal: { type: 'deliver', npc: 'elfmerchant', items: ['q_linhthao1', 'q_linhthao2', 'q_linhthao3'] } },
        ],
        reward: { gold: 600, stone: 4, items: { exp_small: 1 } },
        intro: npc('Rễ cây mục kéo theo hơi độc làm cây non héo dần. Ta cần pha gấp một mẻ thuốc giải.', '{Cau} tìm giúp ta ba nhánh Linh thảo sáng quanh bìa rừng nhé?'),
        outro: npc('Đủ ba nhánh linh thảo tươi sáng rồi! Số thuốc này đủ cứu cả vạt rừng non.', 'Cảm ơn {cau} đã giúp Rừng Thiêng cầm cự.') },
    { id: 's2_sao_tre', chapter: 'c2', type: 'side', name: 'Chiếc sáo gỗ bị đánh rơi', giver: 'elfkid', scene: 'sylvaren', open: { stage: 'c2-05' },
        desc: 'Lúc chạy trốn sói linh hồn, Bé Tavi làm rơi chiếc sáo gỗ kỷ vật của anh trai. Kiểm tra 3 hốc đá quanh Rừng Sylvaren để tìm giúp bé.',
        steps: [
            { id: 'tim', text: 'Kiểm tra 3 hốc đá quanh Rừng Sylvaren', goal: { type: 'interact', objs: ['m2_hoc1', 'm2_hoc2', 'm2_hoc3'] } },
            { id: 'bao', text: 'Báo lại tin tìm thấy sáo cho Bé Tavi', goal: { type: 'talk', who: ['elfkid'] } },
        ],
        reward: { gold: 500, stone: 3, items: { exp_small: 1 } },
        intro: npc('{Anh} ơi! Hôm trước chạy khỏi bầy sói, em làm rơi mất chiếc sáo gỗ anh trai tặng!', 'Em chỉ nhớ nó rơi quanh mấy hốc đá trong rừng. {Anh} tìm giúp em với nhé!'),
        outro: npc('Đúng chiếc sáo gỗ của em rồi! Em tưởng không bao giờ tìm lại được nữa!', '{Anh} giỏi thật đấy, cảm ơn {anh} nhiều lắm!') },
    { id: 's2_tuan_tra', chapter: 'c2', type: 'side', name: 'Tuần tra lại thành cây', giver: 'lun_guard', scene: 'lunaria', open: { stage: 'c2-15' },
        desc: 'Sau khi Thalor tỉnh ngộ, vệ binh Lunaria đang dọn sạch tàn dư tín đồ Varkos. Kiểm 3 chốt gác trong thành và thắng 2 trận không ai gục.',
        steps: [
            { id: 'chot', text: 'Kiểm tra 3 chốt gác trong Thành cây Lunaria', goal: { type: 'interact', objs: ['m2_chot1', 'm2_chot2', 'm2_chot3'] } },
            { id: 'danh', text: 'Đẩy lùi tàn dư quanh thành: thắng 2 trận không ai gục', goal: { type: 'winBattles', n: 2, noDeaths: true } },
            { id: 've', text: 'Về báo lại với Vệ binh Lunaria', goal: { type: 'talk', who: ['lun_guard'] } },
        ],
        reward: { gold: 800, stone: 5, items: { exp_small: 1 } },
        intro: npc('Quân số đội gác vừa qua biến cố vẫn còn thiếu người.', 'Nhờ các vị rà giúp ba chốt gác trong thành và đánh gọn tàn dư ngoài đường nhé.'),
        outro: npc('Ba chốt đều sạch bóng kẻ lạ, đội các vị cũng không ai xây xát.', 'Lunaria thật may mắn khi có các vị ở đây.') },
    { id: 's2_den_long', chapter: 'c2', type: 'side', name: 'Thắp lại đèn lồng đêm trăng', giver: 'elfkid2', scene: 'lunaria', open: { stage: 'c2-16' },
        desc: 'Đêm trăng ở Lunaria trở nên u tối sau vụ náo loạn chợ đêm. Bé Mio nhờ {cau} thắp lại 3 cột đèn lồng quanh quảng trường.',
        steps: [
            { id: 'thap', text: 'Thắp lại 3 cột đèn lồng quanh quảng trường Lunaria', goal: { type: 'interact', objs: ['m2_den1', 'm2_den2', 'm2_den3'] } },
            { id: 've', text: 'Về báo với Bé Mio ở quảng trường', goal: { type: 'talk', who: ['elfkid2'] } },
        ],
        reward: { gold: 700, stone: 4, items: { exp_small: 1 } },
        intro: npc('Quảng trường tối quá làm mấy em nhỏ sợ không dám ra ngoài...', '{Anh} cao hơn em nhiều, giúp em châm lại ba cột đèn lồng quanh quảng trường nhé!'),
        outro: npc('Quảng trường sáng lung linh lại rồi! Giờ trông giống Lunaria mọi ngày lắm!', 'Cảm ơn {anh} nhiều ạ!') },
    { id: 'h2_co_ngu', chapter: 'c2', type: 'hidden', name: 'Lời thề dưới ánh trăng', scene: 'lunaria', open: { stage: 'c2-12' },
        desc: 'Ba phiến bia cổ ngữ ẩn quanh Thành cây Lunaria ghi lại mặt khuất của lời thề Thất Thánh.',
        steps: [
            { id: 'doc', text: 'Đọc 3 phiến bia cổ ngữ quanh Thành cây Lunaria', goal: { type: 'interact', objs: ['m2_bia1', 'm2_bia2', 'm2_bia3'] } },
        ],
        reward: { diamond: 120, title: 'Người đọc cổ ngữ' },
        outro: [sys('Ba mảnh cổ ngữ ghép thành một câu hoàn chỉnh: “Khi sáu ngọn đuốc quay lưng, ngọn thứ bảy giữ chìa khóa.”')] },
];

const MAIN_BIG = [10, 15, 20];
const MAIN_MID = [2, 5, 7, 8, 12, 14, 17, 18];
const CLEAR_SCENE = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, i + 1 <= 12 ? 'sylvaren' : 'lunaria']));

// 24 bước task xen giữa 20 ải Chương 2 (9 loại mục tiêu khác nhau, không bao giờ lặp 3 lần liên tiếp; 1–12+chốt cầu ở sylvaren, 13–20 ở lunaria)
const MAIN_TASKS_AFTER = {
    1: [
        { id: 'c2_t01_border_trace', map: 'sylvaren', text: 'Lần vào đường mòn phía đông biên giới xem nguồn sương độc',
            goal: { type: 'reach', scene: 'sylvaren', x: 10, y: 12, r: 2 } },
    ],
    2: [
        { id: 'c2_t02_root_ash', map: 'sylvaren', text: 'Kiểm tra đám tro tím còn sót lại dưới rễ cổ thụ',
            goal: { type: 'interact', obj: 'm2_tro_re', n: 1 } },
    ],
    3: [
        { id: 'c2_t03_kid_elf', map: 'sylvaren', text: 'Hỏi Bé Tavi ở bìa rừng xem đội tuần biên đi hướng nào',
            goal: { type: 'talk', who: ['elfkid'] },
            say: { elfkid: ['Chị Đội trưởng Aeris vừa dẫn toán thợ săn đi về phía đông bắc.', 'Chị ấy bảo hễ thấy người lạ là chặn ngay, {anh} cẩn thận nhé!'] } },
        { id: 'c2_t04_combat_prep', map: 'sylvaren', text: 'Tập trung giao chiến trong rừng: dùng 4 lần kỹ năng trong trận',
            goal: { type: 'useSkills', n: 4 }, at: { scene: 'sylvaren', x: 15, y: 9 } },
    ],
    4: [
        { id: 'c2_t05_sap_collect', map: 'sylvaren', text: 'Nhặt Mẫu nhựa cây héo gần lối mòn để tìm nguyên nhân rừng bệnh',
            goal: { type: 'collect', items: ['q_nhua_cay'] } },
    ],
    5: [
        { id: 'c2_t06_sap_deliver', map: 'sylvaren', give: ['q_nhua_cay'], text: 'Đem Mẫu nhựa cây héo nhờ Cô Lirien kiểm tra độc tính',
            goal: { type: 'deliver', npc: 'elfmerchant', items: ['q_nhua_cay'] },
            say: { elfmerchant: ['Nhựa cây bị ám ma thuật mặt trời giả rồi... Thảo nào cây cổ thụ phát điên.', 'Gần Suối Trăng vẫn còn linh lực ánh trăng tinh khiết, {cau} mau tiến lên đó.'] } },
        { id: 'c2_t07_moon_stand', map: 'sylvaren', text: 'Đứng yên 3 giây bên bờ Suối Trăng lắng nghe tiếng vọng',
            goal: { type: 'standOn', scene: 'sylvaren', x: 13, y: 7, sec: 3 } },
    ],
    6: [
        { id: 'c2_t08_poacher_clue', map: 'sylvaren', text: 'Kiểm tra dấu giày sắt và dây trói bỏ lại bên bờ Suối Trăng',
            goal: { type: 'interact', objs: ['m2_dau_giay', 'm2_day_thung'] } },
    ],
    7: [
        { id: 'c2_t09_win_clear', map: 'sylvaren', text: 'Đẩy lùi tàn quân săn trộm quanh trại (thắng 1 trận không ai gục)',
            goal: { type: 'winBattles', n: 1, noDeaths: true }, at: { scene: 'sylvaren', x: 30, y: 15 } },
        { id: 'c2_t10_syl_chest', map: 'sylvaren', text: 'Mở rương tiếp tế ở góc tây nam Rừng Sylvaren',
            goal: { type: 'openChests', ids: ['syl_chest'] } },
    ],
    8: [
        { id: 'c2_t11_gold_mask', map: 'sylvaren', give: ['q_mat_na'], text: 'Đem Chiếc mặt nạ vàng nhặt trong hang nấm cho Đội trưởng Aeris xem',
            goal: { type: 'deliver', npc: 'aeris', items: ['q_mat_na'] },
            say: { aeris: ['Dấu mặt trời này giống hệt huy hiệu kẻ đeo mặt nạ mà người tộc Người nhắc tới.', 'Tối nay là Đêm hội đom đóm mà rừng im ắng lạ thường... Chắc chắn có kẻ nội gián.'] } },
    ],
    9: [
        { id: 'c2_t12_vexa_track', map: 'sylvaren', text: 'Đuổi theo bóng kẻ nội gián về phía bãi săn nam Rừng Sylvaren',
            goal: { type: 'reach', scene: 'sylvaren', x: 26, y: 18, r: 2 } },
    ],
    10: [
        { id: 'c2_t13_root_check', map: 'sylvaren', text: 'Xem xét các rễ cây đang co giật gần đầu Cầu Rễ Cổ',
            goal: { type: 'interact', obj: 'm2_re_cau', n: 1 } },
        { id: 'c2_t14_merchant_remedy', map: 'sylvaren', text: 'Nhặt Lọ tinh dầu thanh tẩy của đội tuần biên gần Cầu Rễ',
            goal: { type: 'collect', items: ['q_tinh_dau'] } },
    ],
    11: [
        { id: 'c2_t15_bridge_stand', map: 'sylvaren', text: 'Đứng yên 3 giây trên đầu Cầu Rễ Cổ cảm nhận nhịp đập của cầu',
            goal: { type: 'standOn', scene: 'sylvaren', x: 35, y: 14, sec: 3 } },
    ],
    12: [
        { id: 'c2_t16_aeris_farewell', map: 'sylvaren', give: ['q_tinh_dau'], text: 'Trao Lọ tinh dầu còn lại cho Đội trưởng Aeris giữ chốt Cầu Rễ',
            goal: { type: 'deliver', npc: 'aeris', items: ['q_tinh_dau'] },
            say: { aeris: ['Cầu Rễ yên rồi, đường sang Thành cây Lunaria đã mở.', 'Trưởng lão Oren đang đợi các ngươi bên kia cổng thành. Cứ đi về phía đông là tới.'] } },
    ],
    13: [
        { id: 'c2_t17_kid2_market', map: 'lunaria', text: 'Hỏi Bé Mio gần đài phun trăng về những người mặc áo trắng ở chợ đêm',
            goal: { type: 'talk', who: ['elfkid2'] },
            say: { elfkid2: ['Mấy người áo trắng phát tờ rơi mặt trời xong rồi đuổi hết cô chú bán hàng đi!', 'Đêm qua khu chợ bên kia quảng trường ồn ào lắm, còn nhiều thùng hàng bỏ dở nữa.'] } },
    ],
    14: [
        { id: 'c2_t18_market_clue', map: 'lunaria', text: 'Kiểm tra tờ truyền đơn mặt trời và lồng đèn tắt ở chợ đêm',
            goal: { type: 'interact', objs: ['m2_to_roi', 'm2_den_chot'] } },
    ],
    15: [
        { id: 'c2_t19_lun_chest', map: 'lunaria', text: 'Mở rương kho báu ở góc đông nam Thành cây Lunaria',
            goal: { type: 'openChests', ids: ['lun_chest'] } },
        { id: 'c2_t20_guard_alley', map: 'lunaria', text: 'Hỏi Vệ binh Lunaria hướng đám tín đồ Varkos vừa rút chạy',
            goal: { type: 'talk', who: ['lun_guard'] },
            say: { lun_guard: ['Đại pháp sư đã hạ lệnh ngừng chặn đường, nhưng đám tín đồ kia vẫn chạy sâu vào Ngõ đèn lồng.', 'Chúng định phá Vườn treo để cắt nguồn linh lực của Ngai Cây!'] } },
    ],
    16: [
        { id: 'c2_t21_use_skills', map: 'lunaria', text: 'Rèn nhịp phối hợp cùng cả đội: dùng 5 lần kỹ năng trong trận',
            goal: { type: 'useSkills', n: 5 }, at: { scene: 'lunaria', x: 18, y: 12 } },
    ],
    17: [
        { id: 'c2_t22_tower_seal', map: 'lunaria', text: 'Nhặt Chìa khóa Tháp chiêm tinh đánh rơi cạnh Vườn treo',
            goal: { type: 'collect', items: ['q_chia_thap'] } },
    ],
    18: [
        { id: 'c2_t23_deliver_key', map: 'lunaria', give: ['q_chia_thap'], text: 'Báo gấp với Trưởng lão Oren trước khi Malkor chạm tới Ngai Cây',
            goal: { type: 'deliver', npc: 'oren', items: ['q_chia_thap'] },
            say: { oren: ['Elarion đã cảnh báo kịp rồi, Malkor muốn dùng Ngai Cây Cổ Thụ làm cổng hiến tế!', 'Chạy thẳng tới Ngai Cây ngay, ta và Thalor sẽ giữ vững hậu phương!'] } },
    ],
    19: [
        { id: 'c2_t24_final_rally', map: 'lunaria', text: 'Dẹp sạch cận vệ tàn dư quanh Ngai Cây (thắng 1 trận bất kỳ)',
            goal: { type: 'winBattles', n: 1 }, at: { scene: 'lunaria', x: 21, y: 15 } },
    ],
};

function mainSteps(spots = STORY_SPOTS, reports = REPORTS, stages = []) {
    const out = [];
    for (let i = 0; i < stages.length; i++) {
        const s = stages[i], n = s.no, sp = spots[n], rep = reports[n];
        const stageName = String(s.name ?? '').replace(/\s*—\s*/g, ': ');
        const map = sp?.scene ?? (n <= 12 ? 'sylvaren' : 'lunaria');
        out.push({ id: `c2_go${n}`, kind: 'go', no: n, stage: s.id, map, text: sp?.go ?? `Tới điểm mở ải ${n} chương 2` });
        out.push({ id: `c2_clear${n}`, kind: 'clear', no: n, stage: s.id, map: CLEAR_SCENE[n] ?? map, text: `Vượt ải ${n}: ${stageName}` });
        if (rep) out.push({ id: `c2_report${n}`, kind: 'report', no: n, stage: s.id, map: rep.scene, text: rep.go });
        out[out.length - 1].tier = MAIN_BIG.includes(n) ? 'big' : MAIN_MID.includes(n) ? 'mid' : 'small';
        const nextStage = stages[i + 1]?.id;
        for (const t of MAIN_TASKS_AFTER[n] ?? []) out.push({ kind: 'task', tier: 'small', stage: nextStage, ...t });
    }
    return out;
}

module.exports = { QUESTS, QUEST_OBJECTS, ITEM_NAMES, STORY_SPOTS, REPORTS, MAIN_TIERS, MAIN_TASKS_AFTER, mainSteps };
