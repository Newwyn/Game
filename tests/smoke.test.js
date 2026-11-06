// Kiểm tra nhanh: nạp được progression.js + tộc Người cộng đúng chỉ số
const test = require('node:test');
const assert = require('node:assert');
const P = require('../progression.js');

test('tộc Người có đặc tính Thích Nghi', () => {
    assert.strictEqual(P.RACE_DEFS.human.trait.key, 'human_adapt');
});

test('computeStats: Chiến Binh tộc Người cấp 1 có +5% Máu', () => {
    const def = { maxHp: 100, maxMp: 3000, pAtk: 10, mAtk: 0, pDef: 10, mDef: 10, crit: 0, critDmg: 1500, acc: 1000, dodge: 0,
        pen: 0, block: 0, mpAtk: 0, mpSec: 0, atkSpeed: 1000, moveSpeed: 1, classGroup: 'warrior', race: 'human' };
    assert.strictEqual(P.computeStats(def, { level: 1, rank: 0 }).maxHp, 105);
});
