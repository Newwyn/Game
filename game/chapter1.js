// Đội quái chương 1 (P5): mỗi ải 3 quái theo truyện — [classId, tên hiển thị]. Quái đầu tiên của ải trùm là trùm.
const POS = [{ x: 25, z: 0 }, { x: 30, z: -3 }, { x: 32, z: 3 }];
function squad(...list) {
    return list.map(([classId, name], i) => ({ classId, name, ...POS[i] }));
}

const rows = [
    ['Cánh cổng chưa được phép đóng', squad(['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Ném Bom'])],   // chỉ có Rok -> 2 quái
    ['Cánh đồng cháy', squad(['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Đốt Ruộng'], ['c1_trapper', 'Goblin Đốt Ruộng'])],
    ['Dấu băng trong Rừng Sương', squad(['c1_wolf', 'Sói Rừng'], ['c1_wolf', 'Sói Rừng'], ['c1_wolf', 'Sói Rừng'])],
    ['Quặng xanh và hòm có số', squad(['c1_goblin', 'Goblin Đào Trộm'], ['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Ném Bom'])],
    ['Sói Đầu Đàn', squad(['b_wolf', 'Sói Đầu Đàn'], ['c1_wolf', 'Sói Rừng'], ['c1_wolf', 'Sói Rừng'])],
    ['Trạm canh bị bỏ lại', squad(['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Đặt Bẫy'], ['c1_goblin', 'Goblin Cướp'])],
    ['Đưa Seraphine về', squad(['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Bẫy Độc'], ['c1_trapper', 'Goblin Bẫy Độc'])],
    ['Những cái tên trong kho hàng', squad(['c1_goblin', 'Goblin Canh Trại'], ['c1_goblin', 'Goblin Canh Trại'], ['c1_trapper', 'Goblin Ném Bom'])],
    ['Đêm trước cuộc tấn công', squad(['c1_goblin', 'Goblin Cướp'], ['c1_wolf', 'Sói Săn'], ['c1_trapper', 'Goblin Đốt Ruộng'])],
    ['Skarn Răng Sắt', squad(['b_skarn', 'Skarn Răng Sắt'], ['c1_goblin', 'Goblin Canh Trại'], ['c1_trapper', 'Goblin Ném Bom'])],
    ['Những người lính ở Cầu Đá', squad(['c1_soldier', 'Lính Đào Ngũ'], ['c1_wolf', 'Sói Rừng'], ['c1_spy', 'Lính Nỏ Đào Ngũ'])],
    ['Người tù tên Lyra', squad(['c1_soldier', 'Lính Trạm Gác'], ['c1_soldier', 'Lính Trạm Gác'], ['c1_spy', 'Lính Nỏ'])],
    ['Đứa trẻ dưới quầy hàng', squad(['c1_soldier', 'Côn Đồ'], ['c1_soldier', 'Côn Đồ'], ['c1_spy', 'Kẻ Kích Động'])],
    ['Người phụ nữ ở kho cứu tế', squad(['c1_soldier', 'Lính Gác Ngõ'], ['c1_spy', 'Mật Thám Đội Lốt Elf'], ['c1_spy', 'Mật Thám'])],
    ['Morwen — Hiệp Sĩ Đen', squad(['b_morwen', 'Morwen — Hiệp Sĩ Đen'], ['c1_soldier', 'Lính Doanh Trại'], ['c1_spy', 'Lính Nỏ'])],
    ['Sổ lương thực', squad(['c1_soldier', 'Lính Đốt Tài Liệu'], ['c1_fire', 'Lính Đốt Tài Liệu'], ['c1_spy', 'Mật Thám'])],
    ['Nhà cứu tế bị vây', squad(['c1_soldier', 'Lính Mang Thánh Ấn'], ['c1_soldier', 'Lính Trạm Gác'], ['c1_spy', 'Lính Nỏ'])],
    ['Đại sảnh và lời đề nghị cuối cùng', squad(['c1_soldier', 'Cận Vệ Mang Thánh Ấn'], ['c1_soldier', 'Cận Vệ Mang Thánh Ấn'], ['c1_fire', 'Cận Vệ Lửa'])],
    ['Những người không thể tự hạ kiếm', squad(['c1_fire', 'Chiến Binh Lửa'], ['c1_fire', 'Chiến Binh Lửa'], ['c1_spy', 'Lính Nỏ'])],
    ['Đại tướng Valdric', squad(['b_valdric', 'Đại tướng Valdric'], ['c1_fire', 'Chiến Binh Lửa'], ['c1_fire', 'Chiến Binh Lửa'])],
];
// Cốt truyện: anh hùng đi cùng (khách, không cần sở hữu) và gia nhập khi lần đầu qua ải
// Sức quái mức Cốt truyện ải 1–10: người chơi (09/11 chiều) yêu cầu GIẢM MỘT NỬA so với bản cân bằng giả lập
//   (bản giả lập: 1 ×0,5 · 2 ×0,6 · 3–9 ×1 · 5 ×0,78 · 10 ×1,22) -> mỗi số × 0,5
const HALF = 0.5;
const STORY_PARTY = {
    1: { power: 0.5 * HALF },                                               // chỉ có Rok
    2: { guests: ['assassin'], joins: ['assassin'], power: 0.6 * HALF },   // cánh đồng cháy — Jessica đánh cùng rồi gia nhập
    3: { power: HALF }, 4: { power: HALF },                                 // ải 3–6: chỉ Rok + Jessica
    5: { power: 0.78 * HALF },                                              // trùm đầu tiên (Sói Đầu Đàn)
    6: { power: HALF },
    7: { guests: ['priest'], joins: ['priest'], power: HALF },              // giải cứu Sera ở trại giam đầm lầy — Sera chỉ vào đội khi được cứu
    8: { power: HALF }, 9: { power: HALF },
    10: { power: 1.22 * HALF },                                             // Skarn
    12: { joins: ['archer'] },                                              // giải cứu Lyra ở trạm gác
    15: { power: 1.12 },  // Morwen — giả lập 09/11: 1.05 thắng 6/6, 1.15 thắng 3/6
    20: { power: 0.78 },  // Valdric (trùm cuối, cấp ~19) — 0.85 thắng 2/6, 0.7 thắng 6/6
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
    { id: 'c1-n1', name: 'Dưới Giếng Cổ', baseNo: 7, flag: 'gieng_co', enemies: squad(['c1_goblin', 'Goblin Lạc Đường'], ['c1_wolf', 'Bóng Tối Giếng Cổ'], ['c1_trapper', 'Goblin Ném Bom']) },
    { id: 'c1-n2', name: 'Mỏ Sâu', baseNo: 4, flag: 'bua_borin', enemies: squad(['c1_goblin', 'Goblin Đào Trộm'], ['c1_goblin', 'Goblin Cướp'], ['c1_trapper', 'Goblin Nổ Mìn']) },
    { id: 'c1-n3', name: 'Bữa Ăn Còn Đủ Chỗ', baseNo: 10, flag: 'nguyen_lieu_lena', enemies: squad(['c1_wolf', 'Sói Rừng'], ['c1_wolf', 'Sói Rừng'], ['c1_goblin', 'Goblin Cướp']) },
    { id: 'c1-n4', name: 'Trang Sách Bị Xé', baseNo: 20, flag: 'trang_sach', enemies: squad(['c1_soldier', 'Lính Đốt Tài Liệu'], ['c1_spy', 'Mật Thám'], ['c1_fire', 'Lính Đốt Tài Liệu']) },
    { id: 'c1-n5', name: 'Hầm Mộ', baseNo: 20, flag: 'loi_vao_ham_mo', needStoryNo: 20, boss: 2, enemies: squad(['b_warden', 'Người Gác Mộ'], ['c1_soldier', 'Lính Gác Mộ'], ['c1_soldier', 'Lính Gác Mộ']) },
    // 2 ải nhánh của chuỗi nhiệm vụ mới (game/questData1.js): cờ bật khi làm tới bước "tìm ra chỗ" của chuỗi
    { id: 'c1-n6', name: 'Thanh Kiếm Của Đội Trưởng', baseNo: 12, flag: 'kiem_doi_truong', enemies: squad(['c1_soldier', 'Lính Đào Ngũ Giữ Trạm'], ['c1_wolf', 'Sói Săn'], ['c1_spy', 'Lính Nỏ Đào Ngũ']) },
    { id: 'c1-n7', name: 'Cái Tên Bị Gạch', baseNo: 16, flag: 'ten_bi_gach', enemies: squad(['c1_soldier', 'Tay Đòi Nợ'], ['c1_spy', 'Kẻ Giữ Sổ'], ['c1_fire', 'Lính Hậu Cần']) },
];

const PARTS = [
    { key: 'lang', icon: '🏘️', title: 'Phần 1 — Làng Ashford', range: 'Ải 1–10' },
    { key: 'duong', icon: '🛤️', title: 'Đoạn nối — Đường Vương Đạo', range: 'Ải 11–12' },
    { key: 'kinh', icon: '🏰', title: 'Phần 2 — Kinh thành Valoria', range: 'Ải 13–20' },
];
module.exports = { id: 'c1', no: 1, name: 'Ngọn Lửa Dưới Thánh Huy', race: 'human', stages, branches, parts: PARTS };
