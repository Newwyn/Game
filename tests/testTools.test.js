const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../game/testTools');
const C = require('../game/campaign');
const WD = require('../game/world');
const EV = require('../game/evidence');
const G = require('../game/gear');
const fresh = () => C.ensureCampaign({ heroes: { warrior: { level: 1, rank: 0, exp: 0 } }, items: {}, story: {} }, Date.now());
test('test tools gate main, allow guest/test and use real catalog', () => {
    assert.equal(T.allowed('main'), false);
    assert.equal(T.allowed('guest'), true);
    assert.equal(T.allowed('test'), true);
    const c = T.catalog([{ id: 'warrior', name: 'Rok' }]);
    assert.equal(c.chapters.length, 2);
    assert.deepEqual(c.gearSlots, G.SLOTS);
    assert.equal(c.scenes.length, Object.keys(WD.SCENES).length);
});
test('test tools: jump backwards, unlock chapters and grant story heroes/evidence', () => {
    const p = fresh();
    assert.equal(T.apply(p, { op: 'unlockChapter', chapter: 'c2' }, []).ok, true);
    for (const ch of C.CHAPTERS) for (const s of [...ch.stages, ...ch.branches]) {
        assert.equal(C.isUnlocked(p, s.id, 'hell').ok, true);
    }
    T.apply(p, { op: 'stageJump', stageId: 'c1-03' }, []);
    assert.equal(p.campaign.cleared.story['c1-02'], true);
    assert.equal(p.campaign.cleared.story['c1-03'], undefined);
    assert.equal(p.campaign.cleared.story['c2-20'], undefined);
    assert.ok(p.owned.includes('assassin'));
    T.apply(p, { op: 'evidenceAll' }, []);
    assert.equal(Object.keys(p.evidence).length, EV.EVIDENCE.length);
});
test('test tools: clamp amounts, heroes, gear and teleport to locked scenes', () => {
    const p = fresh();
    T.apply(p, { op: 'heroes', level: 999, rank: -2, ownAll: true }, ['warrior']);
    assert.equal(p.heroes.warrior.level, 60);
    assert.equal(p.heroes.warrior.rank, 0);
    T.apply(p, { op: 'wallet', gold: -1e20, diamond: 1e20, stamina: 'full' }, []);
    assert.equal(p.wallet.gold, 0);
    assert.equal(p.wallet.diamond, 1e9);
    T.apply(p, { op: 'item', id: 'exp_small', count: 10000 }, []);
    assert.equal(p.items.exp_small, 999);
    assert.equal(T.apply(p, { op: 'gear', set: Object.keys(G.SETS)[0], level: 22, rarity: 99 }, []).ok, true);
    for (const scene of Object.keys(WD.SCENES)) {
        assert.equal(T.apply(p, { op: 'teleport', scene }, []).ok, true);
        assert.equal(WD.worldState(p).scene, scene);
    }
    assert.equal(T.apply(p, { op: 'invalid' }, []).ok, false);
    assert.equal(T.apply(p, { op: 'item', id: '__proto__' }, []).ok, false);
});
