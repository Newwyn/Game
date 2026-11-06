// Đội quái tạm; P5 thay bằng quái riêng theo truyện.
function squad(front, rear, support = rear) {
    return [
        { classId: 'monster_tank', name: front, x: 25, z: 0 },
        { classId: 'monster_archer', name: rear, x: 30, z: -3 },
        { classId: 'monster_supporter', name: support, x: 32, z: 3 },
    ];
}

const rows = [
    ['Đêm ở cổng làng', 'Goblin Cướp', 'Goblin Cướp'],
    ['Cánh đồng cháy', 'Goblin Đốt Ruộng', 'Goblin Cướp'],
    ['Rừng Sương', 'Sói Rừng', 'Sói Rừng'],
    ['Mỏ đá bỏ hoang', 'Goblin Đào Trộm', 'Goblin Cướp'],
    ['Sói Đầu Đàn', 'Sói Đầu Đàn', 'Sói Rừng'],
    ['Trạm canh cháy', 'Goblin Cướp', 'Goblin Đặt Bẫy'],
    ['Đầm lầy độc', 'Goblin Bẫy Độc', 'Goblin Bẫy Độc'],
    ['Trại Goblin ngoài', 'Goblin Canh Trại', 'Goblin Cướp'],
    ['Đêm trước trận chiến', 'Goblin Cướp', 'Goblin Đốt Ruộng'],
    ['Skarn Răng Sắt', 'Skarn Răng Sắt', 'Goblin Canh Trại'],
    ['Cầu Đá', 'Lính Đào Ngũ', 'Sói Rừng'],
    ['Trạm gác biên', 'Lính Trạm Gác', 'Lính Trạm Gác'],
    ['Chợ hỗn loạn', 'Côn Đồ', 'Côn Đồ'],
    ['Ngõ tối', 'Mật Thám Đội Lốt Elf', 'Mật Thám'],
    ['Morwen — Hiệp Sĩ Đen', 'Morwen — Hiệp Sĩ Đen', 'Lính Doanh Trại'],
    ['Thư viện hoàng gia', 'Lính Đốt Tài Liệu', 'Lính Đốt Tài Liệu'],
    ['Nhà thờ ánh sáng', 'Lính Bắt Phe Hòa Bình', 'Lính Trạm Gác'],
    ['Đại sảnh', 'Cận Vệ Cung Điện', 'Cận Vệ Cung Điện'],
    ['Tường thành rực lửa', 'Chiến Binh Lửa', 'Chiến Binh Lửa'],
    ['Đại tướng Valdric', 'Đại tướng Valdric', 'Chiến Binh Lửa'],
];
const stages = rows.map(([name, front, rear], i) => {
    const no = i + 1;
    return {
        id: `c1-${String(no).padStart(2, '0')}`, no, name,
        part: no <= 10 ? 'lang' : no <= 12 ? 'duong' : 'kinh',
        level: no, boss: ({ 5: 1, 10: 2, 15: 1, 20: 3 })[no] || 0,
        enemies: squad(front, rear),
    };
});

// Cấp nhánh theo nơi tìm manh mối: giếng, mỏ, rừng, thư viện, lâu đài.
const branches = [
    { id: 'c1-n1', name: 'Dưới Giếng Cổ', baseNo: 1, flag: 'gieng_co', enemies: squad('Người Gác Giếng', 'Bóng Tối Giếng Cổ') },
    { id: 'c1-n2', name: 'Mỏ Sâu', baseNo: 4, flag: 'bua_borin', enemies: squad('Goblin Đào Trộm', 'Goblin Cướp') },
    { id: 'c1-n3', name: 'Bữa Tiệc Làng', baseNo: 3, flag: 'nguyen_lieu_lena', enemies: squad('Sói Rừng', 'Goblin Cướp') },
    { id: 'c1-n4', name: 'Trang Sách Bị Xé', baseNo: 16, flag: 'trang_sach', enemies: squad('Lính Đốt Tài Liệu', 'Mật Thám') },
    { id: 'c1-n5', name: 'Hầm Mộ', baseNo: 18, flag: 'loi_vao_ham_mo', needStoryNo: 18, enemies: squad('Người Gác Mộ', 'Lính Gác Mộ') },
];

module.exports = { id: 'c1', name: 'Ngọn Lửa Gây Chiến', stages, branches };
