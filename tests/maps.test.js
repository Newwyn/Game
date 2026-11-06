// Bản đồ kiểu Pokémon (src/world/maps.js, sinh bởi tools/build_maps.py) phải khớp dữ liệu server (game/world.js)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Wd = require('../game/world');

const src = fs.readFileSync(path.join(__dirname, '../src/world/maps.js'), 'utf8');
const MAPS = JSON.parse(src.slice(src.indexOf('{', src.indexOf('export const MAPS')), src.lastIndexOf(';')));
const walk = (m, x, y) => m.grid[y]?.[x] === '.';

test('mỗi khu của server có bản đồ, lưới đúng cỡ', () => {
    for (const id of Object.keys(Wd.SCENES)) {
        const m = MAPS[id];
        assert.ok(m, id);
        assert.equal(m.grid.length, m.rows);
        for (const r of m.grid) assert.equal(r.length, m.cols);
        assert.ok(walk(m, ...m.spawn), `${id} spawn`);
        assert.ok(fs.existsSync(path.join(__dirname, `../src/assets/maps/${m.image}.webp`)), `${id} ảnh nền`);
    }
});

test('NPC / đồ vật trên bản đồ khớp server, đứng ở ô đi được', () => {
    for (const [id, s] of Object.entries(Wd.SCENES)) {
        const m = MAPS[id];
        assert.deepEqual(m.npcs.map(n => n.id).sort(), [...s.npcs].sort(), id);
        assert.deepEqual(m.objects.map(o => o.id).sort(), s.objects.map(o => o.id).sort(), id);
        for (const n of m.npcs) assert.ok(walk(m, n.x, n.y), `${id}/${n.id}`);
        for (const o of m.objects) if (!o.area) assert.ok(walk(m, o.x, o.y), `${id}/${o.id}`);
        // 2 thứ không đứng chung 1 ô
        const cells = [...m.npcs, ...m.objects.filter(o => !o.area && !o.trigger)].map(q => `${q.x},${q.y}`);
        assert.equal(new Set(cells).size, cells.length, id);
    }
});

test('lối ra dẫn tới khu có thật, điểm xuất hiện đi được, mọi khu đi tới được từ điểm đầu', () => {
    const seen = new Set([Wd.START.scene]), queue = [Wd.START.scene];
    assert.ok(walk(MAPS[Wd.START.scene], Wd.START.x, Wd.START.y), 'START');
    while (queue.length) {
        const id = queue.shift();
        for (const e of MAPS[id].exits) {
            assert.ok(MAPS[e.scene], `${id} -> ${e.scene}`);
            assert.ok(walk(MAPS[e.scene], ...e.at), `${id} -> ${e.scene} @${e.at}`);
            if (!seen.has(e.scene)) { seen.add(e.scene); queue.push(e.scene); }
        }
    }
    assert.deepEqual([...seen].sort(), Object.keys(Wd.SCENES).sort());
});

test('tranh nhân vật đi bộ có đủ cho mọi NPC', () => {
    for (const n of Object.values(Wd.NPCS)) {
        assert.ok(fs.existsSync(path.join(__dirname, `../src/assets/overworld/${n.art}.webp`)), n.art);
        assert.ok(fs.existsSync(path.join(__dirname, `../src/assets/overworld/${n.art}.json`)), n.art);
    }
});

test('lối ra ở mép bản đồ có ít nhất 1 ô đi được để bước ra', () => {
    for (const [id, m] of Object.entries(MAPS)) {
        for (const e of m.exits.filter(q => q.edge)) {
            const cells = [];
            for (let k = e.a; k <= e.b; k++) {
                if (e.edge === 'left') cells.push([0, k]);
                if (e.edge === 'right') cells.push([m.cols - 1, k]);
                if (e.edge === 'up') cells.push([k, 0]);
                if (e.edge === 'down') cells.push([k, m.rows - 1]);
            }
            assert.ok(cells.some(([x, y]) => walk(m, x, y)), `${id} mép ${e.edge} -> ${e.scene}`);
        }
    }
});
