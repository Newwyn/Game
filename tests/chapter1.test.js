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
        assert.ok(s.enemies.length >= 2 && s.enemies.length <= 3);
        if (s.boss) {
            assert.equal(s.enemies.length, 3);
            assert.equal(s.enemies[0].classId, 'monster_tank');
        }
    }
    assert.equal(C.stages[0].name, 'Đêm ở cổng làng');
    assert.equal(C.stages[19].name, 'Đại tướng Valdric');
});
test('5 nhánh đúng tên, cờ và điều kiện N5', () => {
    assert.deepEqual(C.branches.map(b => b.name), ['Dưới Giếng Cổ', 'Mỏ Sâu', 'Bữa Tiệc Làng', 'Trang Sách Bị Xé', 'Hầm Mộ']);
    assert.deepEqual(C.branches.map(b => b.flag), ['gieng_co', 'bua_borin', 'nguyen_lieu_lena', 'trang_sach', 'loi_vao_ham_mo']);
    assert.deepEqual(C.branches.map(b => b.baseNo), [1, 4, 3, 16, 18]);
    assert.equal(C.branches[4].needStoryNo, 18);
});
test('id duy nhất, quái tạm và vị trí hợp lệ', () => {
    const all = [...C.stages, ...C.branches];
    assert.equal(new Set(all.map(s => s.id)).size, 25);
    for (const s of all) for (const e of s.enemies) {
        assert.ok(['monster_tank', 'monster_archer', 'monster_supporter'].includes(e.classId));
        assert.ok(e.name.length > 0);
        assert.ok(e.x >= 25 && e.x <= 32);
        assert.ok(e.z >= -3 && e.z <= 3);
    }
});
