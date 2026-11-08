// Bản đồ 3D (src/world3d): mặt đất từng ô (src/world/terrain3d.js) + công trình đặt tay (src/world3d/layouts.js)
// phải khớp lưới bản đồ 2D (src/world/maps.js) và mô hình đã đóng gói (src/assets/world3d)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const mapsSrc = read('src/world/maps.js');
const ALL_MAPS = JSON.parse(mapsSrc.slice(mapsSrc.indexOf('{', mapsSrc.indexOf('export const MAPS')), mapsSrc.lastIndexOf(';')));
// trong nhà vẽ tranh phẳng (không dựng 3D)
const MAPS = Object.fromEntries(Object.entries(ALL_MAPS).filter(([, m]) => !m.interior));
const terrSrc = read('src/world/terrain3d.js');
const TERRAIN = JSON.parse(terrSrc.slice(terrSrc.indexOf('{', terrSrc.indexOf('export const TERRAIN')), terrSrc.lastIndexOf(';')));
const buildSrc = read('src/world3d/build.js');
const KINDS = new Set([...buildSrc.matchAll(/^ {4}(\w+)\(ctx\b/gm)].map(m => m[1]));

test('mỗi bản đồ có mặt đất 3D đúng cỡ lưới, chỉ dùng ký tự hợp lệ', () => {
    for (const [id, m] of Object.entries(MAPS)) {
        const t = TERRAIN[id];
        assert.ok(t, id);
        assert.equal(t.length, m.rows, id);
        for (const r of t) { assert.equal(r.length, m.cols, id); assert.match(r, /^[gpswfdtb]+$/, id); }
    }
});

test('công trình đặt tay: đúng kiểu, mô hình có thật, khung nhà hợp lệ', async () => {
    const { LAYOUTS } = await import('../src/world3d/layouts.js');
    const glb = (key) => fs.existsSync(path.join(__dirname, '../src/assets/world3d', key.split('@')[0] + '.glb'));
    for (const id of Object.keys(MAPS)) {
        const L = LAYOUTS[id];
        assert.ok(L, `thiếu bố cục 3D cho ${id}`);
        for (const k of [...(L.style?.trees ?? []), ...(L.style?.edgeTrees ?? [])]) assert.ok(glb(k), `${id}: thiếu cây ${k}`);
        for (const [kind, ...args] of L.items) {
            assert.ok(KINDS.has(kind), `${id}: không có kiểu ${kind}`);
            if (kind === 'model') assert.ok(glb(args[0]), `${id}: thiếu mô hình ${args[0]}`);
            if (kind === 'house' || kind === 'hall') { const h = args[0]; assert.ok(h.x0 < h.x1 && h.z0 < h.z1, `${id}: khung ${kind} sai`); }
        }
    }
});

test('mô hình dùng trong code dựng cảnh đều đã đóng gói', () => {
    const keys = new Set([...buildSrc.matchAll(/'((?:nature|town|castle|survival|graveyard)\/[\w-]+)(?:@\w+)?'/g)].map(m => m[1]));
    assert.ok(keys.size > 10);
    for (const k of keys) assert.ok(fs.existsSync(path.join(__dirname, '../src/assets/world3d', k + '.glb')), `thiếu ${k}.glb`);
});
