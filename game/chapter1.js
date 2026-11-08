// Đội quái chương 1 (P5): mỗi ải 3 quái theo truyện — [classId, tên hiển thị]. Quái đầu tiên của ải trùm là trùm.
const POS = [{ x: 25, z: 0 }, { x: 30, z: -3 }, { x: 32, z: 3 }];
function squad(...list) {
    return list.map(([classId, name], i) => ({ classId, name, ...POS[i] }));
}

const rows = [
    ['Đêm ở cổng làng', squad(['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Ném Bom'])],   // chỉ có Rok -> 2 quái
    ['Cánh đồng cháy', squad(['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Đốt Ruộng'], ['c1_trapper', 'Goblin Đốt Ruộng'])],
    ['Rừng Sương', squad(['c1_wolf', 'Sói Rừng'], ['c1_wolf', 'Sói Rừng'], ['c1_wolf', 'Sói Rừng'])],
    ['Mỏ đá bỏ hoang', squad(['c1_goblin', 'Goblin Đào Trộm'], ['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Ném Bom'])],
    ['Sói Đầu Đàn', squad(['b_wolf', 'Sói Đầu Đàn'], ['c1_wolf', 'Sói Rừng'], ['c1_wolf', 'Sói Rừng'])],
    ['Trạm canh cháy', squad(['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Đặt Bẫy'], ['c1_goblin', 'Goblin Cướp'])],
    ['Đầm lầy độc', squad(['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Bẫy Độc'], ['c1_trapper', 'Goblin Bẫy Độc'])],
    ['Trại Goblin ngoài', squad(['c1_goblin', 'Goblin Canh Trại'], ['c1_goblin', 'Goblin Canh Trại'], ['c1_trapper', 'Goblin Ném Bom'])],
    ['Đêm trước trận chiến', squad(['c1_goblin', 'Goblin Cướp'], ['c1_wolf', 'Sói Săn'], ['c1_trapper', 'Goblin Đốt Ruộng'])],
    ['Skarn Răng Sắt', squad(['b_skarn', 'Skarn Răng Sắt'], ['c1_goblin', 'Goblin Canh Trại'], ['c1_trapper', 'Goblin Ném Bom'])],
    ['Cầu Đá', squad(['c1_soldier', 'Lính Đào Ngũ'], ['c1_wolf', 'Sói Rừng'], ['c1_spy', 'Lính Nỏ Đào Ngũ'])],
    ['Trạm gác biên', squad(['c1_soldier', 'Lính Trạm Gác'], ['c1_soldier', 'Lính Trạm Gác'], ['c1_spy', 'Lính Nỏ'])],
    ['Chợ hỗn loạn', squad(['c1_soldier', 'Côn Đồ'], ['c1_soldier', 'Côn Đồ'], ['c1_spy', 'Kẻ Kích Động'])],
    ['Ngõ tối', squad(['c1_soldier', 'Lính Gác Ngõ'], ['c1_spy', 'Mật Thám Đội Lốt Elf'], ['c1_spy', 'Mật Thám'])],
    ['Morwen — Hiệp Sĩ Đen', squad(['b_morwen', 'Morwen — Hiệp Sĩ Đen'], ['c1_soldier', 'Lính Doanh Trại'], ['c1_spy', 'Lính Nỏ'])],
    ['Thư viện hoàng gia', squad(['c1_soldier', 'Lính Đốt Tài Liệu'], ['c1_fire', 'Lính Đốt Tài Liệu'], ['c1_spy', 'Mật Thám'])],
    ['Nhà thờ ánh sáng', squad(['c1_soldier', 'Lính Bắt Phe Hòa Bình'], ['c1_soldier', 'Lính Trạm Gác'], ['c1_spy', 'Lính Nỏ'])],
    ['Đại sảnh', squad(['c1_soldier', 'Cận Vệ Cung Điện'], ['c1_soldier', 'Cận Vệ Cung Điện'], ['c1_fire', 'Cận Vệ Lửa'])],
    ['Tường thành rực lửa', squad(['c1_fire', 'Chiến Binh Lửa'], ['c1_fire', 'Chiến Binh Lửa'], ['c1_spy', 'Lính Nỏ'])],
    ['Đại tướng Valdric', squad(['b_valdric', 'Đại tướng Valdric'], ['c1_fire', 'Chiến Binh Lửa'], ['c1_fire', 'Chiến Binh Lửa'])],
];
// Cốt truyện: anh hùng đi cùng (khách, không cần sở hữu) và gia nhập khi lần đầu qua ải
const STORY_PARTY = {
    1: { power: 0.5 },                                               // chỉ có Rok
    2: { guests: ['assassin'], joins: ['assassin'], power: 0.6 },   // bị Goblin vây đánh — Jessica xuất hiện ứng cứu
    3: { guests: ['priest'], joins: ['priest'], power: 0.8 },       // hộ tống Seraphine vào Rừng Sương hái thảo dược
    12: { joins: ['archer'] },                          // giải cứu Lyra ở trạm gác
};
const stages = rows.map(([name, enemies], i) => {
    const no = i + 1;
    return {
        id: `c1-${String(no).padStart(2, '0')}`, no, name,
        part: no <= 10 ? 'lang' : no <= 12 ? 'duong' : 'kinh',
        level: no, boss: ({ 5: 1, 10: 2, 15: 1, 20: 3 })[no] || 0,
        enemies,
        ...(STORY_PARTY[no] ?? {}),
    };
});

// Cấp nhánh theo nơi tìm manh mối: giếng, mỏ, rừng, thư viện, lâu đài.
const branches = [
    { id: 'c1-n1', name: 'Dưới Giếng Cổ', baseNo: 1, flag: 'gieng_co', enemies: squad(['c1_goblin', 'Goblin Lạc Đường'], ['c1_wolf', 'Bóng Tối Giếng Cổ'], ['c1_trapper', 'Goblin Ném Bom']) },
    { id: 'c1-n2', name: 'Mỏ Sâu', baseNo: 4, flag: 'bua_borin', enemies: squad(['c1_goblin', 'Goblin Đào Trộm'], ['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Nổ Mìn']) },
    { id: 'c1-n3', name: 'Bữa Tiệc Làng', baseNo: 3, flag: 'nguyen_lieu_lena', enemies: squad(['c1_wolf', 'Sói Rừng'], ['c1_wolf', 'Sói Rừng'], ['c1_goblin', 'Goblin Cướp']) },
    { id: 'c1-n4', name: 'Trang Sách Bị Xé', baseNo: 16, flag: 'trang_sach', enemies: squad(['c1_soldier', 'Lính Đốt Tài Liệu'], ['c1_spy', 'Mật Thám'], ['c1_fire', 'Lính Đốt Tài Liệu']) },
    { id: 'c1-n5', name: 'Hầm Mộ', baseNo: 18, flag: 'loi_vao_ham_mo', needStoryNo: 18, boss: 2, enemies: squad(['b_warden', 'Người Gác Mộ'], ['c1_soldier', 'Lính Gác Mộ'], ['c1_soldier', 'Lính Gác Mộ']) },
];

const PARTS = [
    { key: 'lang', icon: '🏘️', title: 'Phần 1 — Làng Ashford', range: 'Ải 1–10' },
    { key: 'duong', icon: '🛤️', title: 'Đoạn nối — Đường Vương Đạo', range: 'Ải 11–12' },
    { key: 'kinh', icon: '🏰', title: 'Phần 2 — Kinh thành Valoria', range: 'Ải 13–20' },
];
module.exports = { id: 'c1', no: 1, name: 'Ngọn Lửa Gây Chiến', race: 'human', stages, branches, parts: PARTS };
