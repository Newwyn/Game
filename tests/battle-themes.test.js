const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
// Client modules are ESM, while the server package is CommonJS.
const source = fs.readFileSync(path.join(__dirname, '../src/core/battleThemes.js'), 'utf8');
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const payload = id => ({ mode: 'campaign', stage: { id, no: 999, diff: 'hard' } });

test('all twenty chapter-one locations follow the story, including indoor and tower stages', async () => {
    const { themeForBattle } = await modulePromise;
    const expected = ['village', 'field', 'forest', 'mine', 'forest', 'outpost', 'swamp', 'camp', 'square', 'mine', 'bridge', 'outpost', 'market', 'market', 'gate', 'library', 'castle', 'hall', 'battlement', 'tower'];
    expected.forEach((theme, i) => assert.equal(themeForBattle(payload(`c1-${String(i + 1).padStart(2, '0')}`)), theme));
});
test('chapter two uses local ID rather than global display number', async () => {
    const { themeForBattle } = await modulePromise;
    for (let no = 1; no <= 20; no++) assert.equal(themeForBattle({ mode: 'campaign', stage: { id: `c2-${String(no).padStart(2, '0')}`, no: no + 20 } }), no <= 12 ? 'elf' : 'moon');
});
test('branches include well, deep mine, library, crypt and elf locations', async () => {
    const { themeForBattle } = await modulePromise;
    const expected = { 'c1-n1': 'well', 'c1-n2': 'deepMine', 'c1-n3': 'field', 'c1-n4': 'library', 'c1-n5': 'crypt', 'c2-n1': 'elf', 'c2-n2': 'elf', 'c2-n3': 'moon', 'c2-n4': 'elf' };
    for (const [id, theme] of Object.entries(expected)) assert.equal(themeForBattle(payload(id)), theme);
});
test('dungeons and wild scenes use the server ID formats', async () => {
    const { themeForBattle } = await modulePromise;
    for (const kind of ['set', 'jewel']) for (const tier of [1, 2, 3]) assert.equal(themeForBattle(payload(`d-${kind}-${tier}`)), 'ruins');
    for (const [scene, theme] of Object.entries({ outskirts: 'field', forest: 'forest', road: 'road' })) assert.equal(themeForBattle(payload(`wild-${scene}`)), theme);
});
test('non-campaign modes and malformed data safely fall back to meadow', async () => {
    const { themeForBattle } = await modulePromise;
    for (const mode of ['test', 'duel_monster', 'duel_hero', 'prologue', 'menu', undefined]) assert.equal(themeForBattle({ mode, stage: { id: 'c1-20' } }), 'meadow');
    for (const data of [null, undefined, {}, { mode: 'campaign' }, { mode: 'campaign', stage: {} }]) assert.equal(themeForBattle(data), 'meadow');
    for (const id of [null, 20, {}, 'c1-00', 'c2-21', 'c3-01', 'c1-1', 'c1-n6', 'c2-n99', 'd-set-4', 'd-other-1', 'wild-unknown', 'wild-toString', '__proto__']) assert.equal(themeForBattle(payload(id)), 'meadow');
});
test('every mapped theme has a complete immutable profile', async () => {
    const { BATTLE_THEMES, CHAPTER_ONE, BRANCHES, WILD_THEMES } = await modulePromise;
    for (const key of [...CHAPTER_ONE, ...Object.values(BRANCHES), ...Object.values(WILD_THEMES), 'elf', 'moon', 'ruins']) {
        const p = BATTLE_THEMES[key];
        assert.ok(p && Object.isFrozen(p));
        assert.ok(p.far > p.near && p.intensity > 0 && typeof p.ground === 'number');
    }
});
