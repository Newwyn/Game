const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../game/chapter1');

test('20 ải đúng thứ tự, phần, cấp và trùm', () => {
    assert.equal(C.id, 'c1');
    assert.equal(C.name, 'Ngọn Lửa Gây Chiến');
    assert.equal(C.stages.length, 20);
    for (const [i, s] of C.stages.entries()) {
        const no = i + 1;
        assert.equal(s.no, no);
        assert.equal(s.level, no);
        assert.equal(s.id, `c1-${String(no).padStart(2, '0')}`);
        assert.equal(s.part, no <= 10 ? 'lang' : no <= 12 ? 'duong' : 'kinh');
        assert.equal(s.boss, ({ 5: 1, 10: 2, 15: 1, 20: 3 })[no] || 0);
        assert.equal(s.enemies.length, no === 1 ? 2 : 3);   // ải 1 chỉ có Rok -> 2 quái
        // ải trùm: quái đầu là trùm (b_*), ải thường không có trùm
        assert.equal(s.enemies[0].classId.startsWith('b_'), !!s.boss);
        assert.ok(s.enemies.slice(1).every(e => !e.classId.startsWith('b_')));
    }
    assert.equal(C.stages[0].name, 'Đêm ở cổng làng');
    assert.equal(C.stages[19].name, 'Đại tướng Valdric');
    // cốt truyện: Jessica (ải 2) và Seraphine (ải 3) đi cùng rồi gia nhập, Lyra gia nhập ở ải 12
    assert.deepEqual([C.stages[1].guests, C.stages[1].joins], [['assassin'], ['assassin']]);
    assert.deepEqual([C.stages[2].guests, C.stages[2].joins], [['priest'], ['priest']]);
    assert.deepEqual(C.stages[11].joins, ['archer']);
});
test('5 nhánh đúng tên, cờ và điều kiện N5', () => {
    assert.deepEqual(C.branches.map(b => b.name), ['Dưới Giếng Cổ', 'Mỏ Sâu', 'Bữa Tiệc Làng', 'Trang Sách Bị Xé', 'Hầm Mộ']);
    assert.deepEqual(C.branches.map(b => b.flag), ['gieng_co', 'bua_borin', 'nguyen_lieu_lena', 'trang_sach', 'loi_vao_ham_mo']);
    assert.deepEqual(C.branches.map(b => b.baseNo), [1, 4, 3, 16, 18]);
    assert.equal(C.branches[4].needStoryNo, 18);
    assert.equal(C.branches[4].enemies[0].classId, 'b_warden');   // N5: trùm ẩn Người Gác Mộ
});
test('id duy nhất, quái chương 1 và vị trí hợp lệ', () => {
    const all = [...C.stages, ...C.branches];
    assert.equal(new Set(all.map(s => s.id)).size, 25);
    for (const s of all) for (const e of s.enemies) {
        assert.ok(/^(c1_(goblin|trapper|wolf|soldier|spy|fire)|b_(wolf|skarn|morwen|valdric|warden))$/.test(e.classId), e.classId);
        assert.ok(e.name.length > 0);
        assert.ok(e.x >= 25 && e.x <= 32);
        assert.ok(e.z >= -3 && e.z <= 3);
    }
});
