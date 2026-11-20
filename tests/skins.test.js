// ============================================================
// Trang phục anh hùng (S / SS / SSS / Giấy): game/skins.js + nối server -> client -> sprite / VFX
// ============================================================
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const SK = require('../game/skins');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const CLASS_DEFS = {
    warrior: { name: 'Rok' },
    mage: { name: 'Ignar' },
    assassin: { name: 'Jessica' },
    archer: { name: 'Lyra' },
};

test('PAPER_SKIN_CLASSES trên server khớp với PAPER_SETS ở src/characters/sprite/paperSets.js', () => {
    const src = read('src/characters/sprite/paperSets.js');
    const start = src.indexOf('export const PAPER_SETS = {');
    assert.ok(start >= 0);
    const end = src.indexOf('\n};', start);
    assert.ok(end > start);
    const block = src.slice(start, end);
    const clientClasses = [...block.matchAll(/^ {4}([a-z_]+): \{/gm)].map(m => m[1]);
    assert.deepEqual([...SK.PAPER_SKIN_CLASSES].sort(), clientClasses.sort());
});

test('skinsFor chỉ mở trang phục "paper" cho các nhân vật có bộ giấy, giữ nguyên S/SS/SSS theo bậc', () => {
    assert.deepEqual(SK.skinsFor('warrior', 0), ['s', 'paper']);
    assert.deepEqual(SK.skinsFor('warrior', 1), ['s', 'paper']);
    assert.deepEqual(SK.skinsFor('warrior', 2), ['s', 'ss', 'paper']);
    assert.deepEqual(SK.skinsFor('warrior', 3), ['s', 'ss', 'sss', 'paper']);
    assert.deepEqual(SK.skinsFor('mage', 0), ['s', 'paper']);
    assert.deepEqual(SK.skinsFor('mage', 3), ['s', 'ss', 'sss', 'paper']);

    for (const cls of ['assassin', 'archer', 'priest', 'swordsage']) {
        assert.deepEqual(SK.skinsFor(cls, 0), ['s']);
        assert.deepEqual(SK.skinsFor(cls, 2), ['s', 'ss']);
        assert.deepEqual(SK.skinsFor(cls, 3), ['s', 'ss', 'sss']);
    }

    assert.deepEqual(SK.skinsFor(2), ['s', 'ss']);
});

test('setSkinChoice cho phép mặc/bỏ "paper" ở mọi bậc với warrior/mage, từ chối với class khác, tương thích save cũ', () => {
    // Save cũ không có pr.skins
    const pr = {
        owned: ['warrior', 'mage', 'assassin'],
        heroes: {
            warrior: { level: 1, rank: 0, exp: 0 },
            mage: { level: 25, rank: 1, exp: 0 },
            assassin: { level: 60, rank: 3, exp: 0 },
        },
    };

    // Chấp nhận 'paper' ở bậc 0 cho warrior & bậc 1 cho mage
    const wPaper = SK.setSkinChoice(pr, 'warrior', 'paper', CLASS_DEFS);
    assert.equal(wPaper?.ok, true);
    assert.equal(pr.skins.warrior, 'paper');

    const mPaper = SK.setSkinChoice(pr, 'mage', 'paper', CLASS_DEFS);
    assert.equal(mPaper?.ok, true);
    assert.equal(pr.skins.mage, 'paper');

    // Từ chối 'paper' cho class không có bộ giấy, kể cả bậc SSS
    const aPaper = SK.setSkinChoice(pr, 'assassin', 'paper', CLASS_DEFS);
    assert.equal(aPaper?.ok, false);
    assert.equal(pr.skins.assassin, undefined);

    // Vẫn chặn s/ss/sss khi chưa đủ bậc
    const wSS = SK.setSkinChoice(pr, 'warrior', 'ss', CLASS_DEFS);
    assert.equal(wSS?.ok, false);
    assert.equal(pr.skins.warrior, 'paper');

    const wS = SK.setSkinChoice(pr, 'warrior', 's', CLASS_DEFS);
    assert.equal(wS?.ok, true);
    assert.equal(pr.skins.warrior, 's');

    // Tự động (skin: null) xoá lựa chọn đã lưu
    const wAuto = SK.setSkinChoice(pr, 'warrior', null, CLASS_DEFS);
    assert.equal(wAuto?.ok, true);
    assert.equal(pr.skins.warrior, undefined);

    // Nhân vật chưa sở hữu -> bỏ qua an toàn
    assert.equal(SK.setSkinChoice(pr, 'archer', 'paper', CLASS_DEFS), null);
    assert.equal(pr.skins.archer, undefined);
});

test('resolveMemberSkin và applySkinToMember truyền member.skin + member.skinRank đúng trong trận', () => {
    const rok = { classId: 'warrior' };
    SK.applySkinToMember(rok, 0, 'paper');
    assert.equal(rok.skin, 'paper');
    assert.equal(rok.skinRank, null);

    SK.applySkinToMember(rok, 2, 'ss');
    assert.equal(rok.skin, 'ss');
    assert.equal(rok.skinRank, 2);

    // Chuyển về Tự động (null) hoặc save cũ chưa có skins
    SK.applySkinToMember(rok, 2, null);
    assert.equal(rok.skin, null);
    assert.equal(rok.skinRank, null);

    // Class không có bộ giấy dù truyền nhầm 'paper' vẫn về mặc định
    const jess = { classId: 'assassin' };
    SK.applySkinToMember(jess, 3, 'paper');
    assert.equal(jess.skin, null);
    assert.equal(jess.skinRank, null);
});

test('server.js nối đủ SK.applySkinToMember, PvP skin, heroPanel, progressUpdate và mặc định cho AI/khách mời', () => {
    const srv = read('server.js');
    assert.ok(srv.includes("require('./game/skins')"));
    assert.ok(srv.includes('SK.applySkinToMember(member, hero.rank, hero.skin ?? null)'));
    assert.ok(!srv.includes('applyMemberSkin'), 'server.js không được gọi nhầm applyMemberSkin');
    assert.ok(srv.includes('SK.setSkinChoice(pr, classId, skin, CLASS_DEFS)'));
    assert.ok(srv.includes('skins: skinsFor(id, h.rank)'));
    assert.ok(srv.includes("socket.emit('progressUpdate', progressPayload(socket.progressKey))"));
    assert.ok(srv.includes('MAX_HEROES(pr)'));
    assert.ok(srv.includes("if (!pr?.owned?.includes(g)) patch.skin = null;"));
    assert.ok(srv.includes('pvpHeroes(p1Socket)'));
});

test('gỡ hoàn toàn công tắc giấy toàn cục và bản đồ giấy; hiệu ứng chiến đấu phân biệt từng người thi triển', () => {
    const settingsSrc = read('src/core/settings.js');
    assert.ok(!settingsSrc.includes('paperHeroes:'));
    assert.ok(!settingsSrc.includes('setting-change'));

    const htmlSrc = read('index.html');
    assert.ok(!htmlSrc.includes('btn-paper-heroes'));

    const inputSrc = read('src/ui/input.js');
    assert.ok(!inputSrc.includes('togglePaperHeroes'));
    assert.ok(!inputSrc.includes('updatePaperHeroesButton'));
    assert.ok(!inputSrc.includes('setting-change'));

    const hpSrc = read('src/ui/heroPanel.js');
    assert.ok(hpSrc.includes('data-hp-skin="paper"'));
    assert.ok(hpSrc.includes("h.skins?.includes('paper')"));
    assert.ok(!hpSrc.includes('data-hp-paper'));

    const worldSrc = read('src/ui/world.js');
    for (const forbidden of ['worldpaper', 'mapStyle', 'wd_style', 'viewPaper', 'paperOverworldFor', 'ow_rok_paper', 'data-wd-style', 'data-wd-paper']) {
        assert.ok(!worldSrc.includes(forbidden), `world.js còn sót ${forbidden}`);
    }

    const regSrc = read('src/characters/registry.js');
    assert.ok(regSrc.includes('member.skin ?? null'));
    assert.ok(!regSrc.includes('paperSpriteFor'));

    const battleSrc = read('src/combat/battleScene.js');
    assert.ok(battleSrc.includes("m.skin === 'paper'"));

    for (const file of ['src/vfx/rokFx.js', 'src/vfx/fireFx.js', 'src/vfx/linkFx.js', 'src/characters/CutoutCharacterView.js', 'src/combat/events.js']) {
        const src = read(file);
        assert.ok(!src.includes('isRokPaperFx'), `${file} còn biến toàn cục isRokPaperFx`);
        assert.ok(!src.includes('isIgnarPaperFx'), `${file} còn biến toàn cục isIgnarPaperFx`);
    }
});
