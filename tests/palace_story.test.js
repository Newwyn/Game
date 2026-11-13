// (13/11/2026) Cung điện Valoria: nhà vua / nữ vương hiện đúng lúc theo cốt truyện + 2 nhiệm vụ ẩn trong cung
const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../game/world');
const C = require('../game/campaign');

const fresh = (upTo) => {
    const pr = C.ensureCampaign({}, 0);
    for (let i = 1; i <= upTo; i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2, '0')}`] = true;
    W.ensureWorld(pr);
    return pr;
};
const act = (pr, scene, id) => W.interact(pr, pr.wallet, scene, id);
const text = (r) => (r.lines ?? []).map(l => l[1]).join(' ');
const diamonds = (pr) => JSON.stringify(pr.wallet);

test('nhà vua ở Tẩm cung cho tới khi xong Chương 1; sau đó Elise là nữ vương ở Sảnh ngai', () => {
    for (const n of [12, 14, 18, 19]) {
        const pr = fresh(n);
        assert.equal(W.shown(pr, W.NPCS.king_aldric, 'king_aldric'), true, `vua phải còn ở ải ${n}`);
        assert.equal(W.shown(pr, W.NPCS.queen_elise, 'queen_elise'), false, `nữ vương chưa có ở ải ${n}`);
        assert.ok(text(act(pr, 'palace_king', 'king_aldric')).length > 10);
    }
    const end = fresh(20);
    assert.equal(W.shown(end, W.NPCS.king_aldric, 'king_aldric'), false);
    assert.equal(W.shown(end, W.NPCS.queen_elise, 'queen_elise'), true);
    assert.match(text(act(end, 'palace_in', 'queen_elise')), /Ngai này cha tôi/);
    assert.match(text(act(end, 'palace_king', 'palace_physician')), /lúc người còn/);
    assert.match(text(act(fresh(12), 'palace_king', 'palace_physician')), /yếu dần/);
    // lời nhà vua đổi sau buổi đối chất (ải 18)
    assert.match(text(act(fresh(12), 'palace_king', 'king_aldric')), /chẳng ấm/);
    assert.match(text(act(fresh(18), 'palace_king', 'king_aldric')), /đại sảnh/);
    // nhà vua và nữ vương có mặt trong danh sách người của phòng + có tranh
    assert.ok(W.SCENES.palace_king.npcs.includes('king_aldric') && W.SCENES.palace_in.npcs.includes('queen_elise'));
    assert.equal(W.NPCS.king_aldric.art, 'npc_king');
});

test('nhiệm vụ ẩn "Ngai của những người đã ngã": bảng dưới ngai -> hỏi họa sĩ -> thanh kiếm không tên, thưởng 1 lần', () => {
    const pr = fresh(12);
    assert.equal(pr.world.quests.h_ngai, undefined);
    assert.match(text(act(pr, 'palace_in', 'ngai_kiem')), /nhớ đủ tên/);
    assert.equal(pr.world.quests.h_ngai, 'active');
    assert.match(text(act(pr, 'palace_gallery', 'palace_painter')), /không khắc tên/);
    const before = diamonds(pr);
    const last = act(pr, 'palace_council', 'kiem_vo_danh');
    assert.equal(pr.world.quests.h_ngai, 'done');
    assert.match(text(last), /Ashford/);
    assert.notEqual(diamonds(pr), before);
    const after = diamonds(pr);
    act(pr, 'palace_council', 'kiem_vo_danh'); act(pr, 'palace_in', 'ngai_kiem');
    assert.equal(diamonds(pr), after);   // không thưởng lần hai
    // xem thanh kiếm trước khi biết chuyện thì chưa xong
    const p2 = fresh(12);
    act(p2, 'palace_council', 'kiem_vo_danh');
    assert.notEqual(p2.world.quests.h_ngai, 'done');
});

test('nhiệm vụ ẩn "Khúc nhạc của mẹ": gom 3 trang nhạc ở 3 phòng rồi kể với chị Mina', () => {
    const pr = fresh(12);
    act(pr, 'palace_dining', 'nhac1');
    assert.equal(pr.world.quests.h_dan, 'active');
    assert.doesNotMatch(text(act(pr, 'palace_elise', 'palace_maid')), /Liora hay đàn/);   // chưa đủ 3 trang: chị Mina nói chuyện thường
    act(pr, 'palace_gallery', 'nhac2'); act(pr, 'palace_balcony', 'nhac3');
    const before = diamonds(pr);
    assert.match(text(act(pr, 'palace_elise', 'palace_maid')), /Liora hay đàn/);
    assert.equal(pr.world.quests.h_dan, 'done');
    assert.notEqual(diamonds(pr), before);
});

test('Đèn Hộ Mệnh cạnh giường nhà vua xem được (gợi trước cho đoạn kết Chương 1)', () => {
    assert.match(text(act(fresh(12), 'palace_king', 'den_ho_menh')), /không thấy ấm/);
});
