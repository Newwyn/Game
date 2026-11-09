// ============================================================
// CHƯƠNG 2 — TIẾNG GỌI RỪNG THIÊNG (vùng Elf Sylvaren · Thành cây Lunaria)
//   Mở khi qua ải 20 chương 1 (Công chúa Elise nhờ đội sang vùng Elf tìm em gái Lyra và kẻ đứng sau Thánh Varkos).
//   20 ải + 4 nhánh ẩn. Cấp quái = 20 + số ải. Trùm: ải 5 (Treant Già Mục Rỗng) · 10 (Vexa) · 15 (Thalor) · 20 (Sứ giả Malkor).
//   Gia nhập: Nerissa (ải 7 — em gái Lyra, bị bọn săn trộm bắt) · Sylva (ải 12 — người giữ Cầu Rễ) · Elarion (ải 18 — học giả tháp chiêm tinh)
// ============================================================
const POS = [{ x: 25, z: 0 }, { x: 30, z: -3 }, { x: 32, z: 3 }];
function squad(...list) {
    return list.map(([classId, name], i) => ({ classId, name, ...POS[i] }));
}

const rows = [
    ['Biên giới sương bạc', squad(['c2_scout', 'Elf Tuần Biên'], ['c2_scout', 'Elf Tuần Biên'], ['c2_spiritwolf', 'Sói Linh Hồn'])],
    ['Rễ cây biết đi', squad(['c2_treant', 'Mầm Rễ Mục'], ['c2_treant', 'Mầm Rễ Mục'], ['c2_wisp', 'Ma Trơi Tím'])],
    ['Đom đóm độc', squad(['c2_wisp', 'Ma Trơi Tím'], ['c2_wisp', 'Ma Trơi Tím'], ['c2_shroom', 'Nấm Độc'])],
    ['Lối mòn thợ săn', squad(['c2_scout', 'Elf Thợ Săn'], ['c2_spiritwolf', 'Sói Linh Hồn'], ['c2_scout', 'Elf Thợ Săn'])],
    ['Treant Già Mục Rỗng', squad(['b_hollow', 'Treant Già Mục Rỗng'], ['c2_treant', 'Mầm Rễ Mục'], ['c2_wisp', 'Ma Trơi Tím'])],
    ['Suối Trăng', squad(['c2_spiritwolf', 'Sói Linh Hồn'], ['c2_wisp', 'Ma Trơi Tím'], ['c2_spiritwolf', 'Sói Linh Hồn'])],
    ['Trại săn trộm', squad(['c1_soldier', 'Tên Săn Trộm'], ['c1_spy', 'Cung Thủ Săn Trộm'], ['c1_soldier', 'Tên Săn Trộm'])],
    ['Hang nấm phát quang', squad(['c2_shroom', 'Nấm Độc'], ['c2_shroom', 'Nấm Độc'], ['c2_treant', 'Mầm Rễ Mục'])],
    ['Đêm hội đom đóm', squad(['c2_wisp', 'Ma Trơi Tím'], ['c2_scout', 'Elf Bóng Đêm'], ['c2_shroom', 'Nấm Độc'])],
    ['Vexa — Nữ thợ săn bóng tối', squad(['b_vexa', 'Vexa — Nữ thợ săn bóng tối'], ['c2_scout', 'Elf Bóng Đêm'], ['c2_spiritwolf', 'Sói Linh Hồn'])],
    ['Cầu Rễ Cổ', squad(['c2_treant', 'Rễ Cổ Thức Giấc'], ['c2_treant', 'Rễ Cổ Thức Giấc'], ['c2_wisp', 'Ma Trơi Tím'])],
    ['Người giữ cầu', squad(['c2_spiritwolf', 'Sói Linh Hồn'], ['c2_treant', 'Rễ Cổ Thức Giấc'], ['c2_scout', 'Elf Tuần Biên'])],
    ['Cổng thành Lunaria', squad(['c2_guard', 'Vệ Binh Ánh Trăng'], ['c2_guard', 'Vệ Binh Ánh Trăng'], ['c2_scout', 'Cung Thủ Thành'])],
    ['Chợ đêm ánh trăng', squad(['c2_cultist', 'Tín Đồ Varkos'], ['c2_cultist', 'Tín Đồ Varkos'], ['c2_guard', 'Vệ Binh Bị Mua Chuộc'])],
    ['Thalor — Đại pháp sư', squad(['b_thalor', 'Thalor — Đại pháp sư'], ['c2_cultist', 'Tín Đồ Varkos'], ['c2_guard', 'Vệ Binh Ánh Trăng'])],
    ['Ngõ đèn lồng', squad(['c2_cultist', 'Tín Đồ Varkos'], ['c2_scout', 'Elf Bóng Đêm'], ['c2_wisp', 'Ma Trơi Tím'])],
    ['Vườn treo', squad(['c2_shroom', 'Nấm Độc'], ['c2_treant', 'Rễ Cổ Thức Giấc'], ['c2_cultist', 'Tín Đồ Varkos'])],
    ['Tháp chiêm tinh', squad(['c2_cultist', 'Tín Đồ Varkos'], ['c2_guard', 'Vệ Binh Bị Mua Chuộc'], ['c2_wisp', 'Ma Trơi Tím'])],
    ['Ngai Cây Cổ Thụ', squad(['c2_guard', 'Cận Vệ Ngai Cây'], ['c2_guard', 'Cận Vệ Ngai Cây'], ['c2_cultist', 'Tín Đồ Varkos'])],
    ['Sứ giả Malkor', squad(['b_malkor', 'Sứ giả Malkor'], ['c2_cultist', 'Tín Đồ Varkos'], ['c2_cultist', 'Tín Đồ Varkos'])],
];
// Cốt truyện: anh hùng đi cùng (khách) rồi gia nhập khi lần đầu qua ải
const STORY_PARTY = {
    7: { guests: ['dancer'], joins: ['dancer'] },          // giải cứu Nerissa (em gái Lyra) khỏi trại săn trộm
    12: { guests: ['summoner'], joins: ['summoner'] },     // Sylva — người giữ Cầu Rễ, thử thách rồi đi cùng
    18: { guests: ['elementalist'], joins: ['elementalist'] },   // Elarion — học giả tháp chiêm tinh
};
// Sức nền quái chương 2 (giả lập 09/11: 1.0 thì đội cấp kỳ vọng thắng 100% chỉ trong ~15 giây — quá dễ so với chương 1)
// mặc định: ải thường ×1.4, ải trùm ×1.5; chỉnh riêng từng ải ở đây
const BASE = { 10: 1.45, 20: 1.45 };   // ải 10 (Vexa) ×1.6 thắng 2/6   // ải thường ×1.4 thắng 100% ~17 giây (vừa) · trùm ×1.5 thắng 6/6 dễ -> ×1.6
const stages = rows.map(([name, enemies], i) => {
    const no = i + 1;
    return {
        id: `c2-${String(no).padStart(2, '0')}`, no, name, chapter: 'c2',
        part: no <= 10 ? 'sylvaren' : no <= 12 ? 'cau' : 'lunaria',
        level: 20 + no, boss: ({ 5: 1, 10: 2, 15: 1, 20: 3 })[no] || 0,
        enemies,
        base: BASE[no] ?? (({ 5: 1, 10: 2, 15: 1, 20: 3 })[no] ? 1.6 : 1.4),   // sức nền của ải: áp cho cả 3 mức độ khó
        ...(STORY_PARTY[no] ?? {}),
    };
});

// Nhánh ẩn: mở bằng việc / câu đố ở vùng Elf (game/world.js)
const branches = [
    { id: 'c2-n1', name: 'Đáy Suối Trăng', baseNo: 23, flag: 'suoi_trang', chapter: 'c2',
        enemies: squad(['c2_spiritwolf', 'Sói Trăng'], ['c2_wisp', 'Linh Hồn Suối'], ['c2_spiritwolf', 'Sói Trăng']) },
    { id: 'c2-n2', name: 'Hang Nấm Sâu', baseNo: 28, flag: 'nam_phat_quang', chapter: 'c2',
        enemies: squad(['c2_shroom', 'Nấm Chúa'], ['c2_shroom', 'Nấm Độc'], ['c2_treant', 'Rễ Mục']) },
    { id: 'c2-n3', name: 'Lăng Elf Cổ', baseNo: 35, flag: 'lang_elf_co', chapter: 'c2',
        enemies: squad(['c2_guard', 'Hồn Vệ Binh Cổ'], ['c2_wisp', 'Linh Hồn Cổ'], ['c2_guard', 'Hồn Vệ Binh Cổ']) },
    { id: 'c2-n4', name: 'Gốc Cây Mẹ', baseNo: 39, flag: 'goc_cay_me', needStage: 'c2-19', boss: 2, chapter: 'c2',
        enemies: squad(['b_hollow', 'Bóng Tối Gốc Cây Mẹ'], ['c2_treant', 'Rễ Mục'], ['c2_wisp', 'Ma Trơi Tím']) },
];

const PARTS = [
    { key: 'sylvaren', icon: '🌲', title: 'Phần 1 — Bìa rừng Sylvaren', range: 'Ải 1–10' },
    { key: 'cau', icon: '🌉', title: 'Đoạn nối — Cầu Rễ Cổ', range: 'Ải 11–12' },
    { key: 'lunaria', icon: '🌙', title: 'Phần 2 — Thành cây Lunaria', range: 'Ải 13–20' },
];

module.exports = { id: 'c2', no: 2, name: 'Tiếng Gọi Rừng Thiêng', race: 'elf', needStage: 'c1-20', stages, branches, parts: PARTS };
