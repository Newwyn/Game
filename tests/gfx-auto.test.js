// (14/11/2026) Đồ hoạ trận "Tự động": bộ đo khung hình/giây + các bậc hạ độ nét (src/core/gpu.js)
const test = require('node:test');
const assert = require('node:assert');

// localStorage giả cho battleGfx()
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.window = { devicePixelRatio: 1 };

let gpu;
test.before(async () => { gpu = await import('../src/core/gpu.js'); });

/** chạy `seconds` giây ở `fps` khung/giây, bắt đầu từ thời điểm t (ms); trả về thời điểm kết thúc */
function run(w, t, fps, seconds) {
    const step = 1000 / fps;
    for (const end = t + seconds * 1000; t < end; t += step) w.sample(t);
    return t;
}

test('máy mượt (60 khung/giây): không giảm', () => {
    const calls = [];
    const w = gpu.createFpsWatch((f) => { calls.push(f); return true; });
    run(w, 1000, 60, 15);
    assert.equal(calls.length, 0);
    assert.ok(w.lastFps >= 58 && w.lastFps <= 61, `đo ra ${w.lastFps}`);
});

test('máy chậm (20 khung/giây): báo chậm sau khi chờ ổn định + 3 giây đo', () => {
    const calls = [];
    const w = gpu.createFpsWatch((f) => { calls.push({ f, t: w.last }); return true; });
    run(w, 1000, 20, 7);
    assert.ok(calls.length >= 1, 'phải báo chậm');
    assert.ok(Math.abs(calls[0].f - 20) < 1.5, `fps đo ${calls[0].f}`);
    assert.ok(calls[0].t >= 1000 + 2500 + 3000 - 60, 'không báo trước khi chờ 2,5 giây + đo đủ 3 giây');
});

test('bị khựng (khung cách nhau > 250ms) hoặc tab ẩn: không tính, đo lại sau khi ổn định', () => {
    const calls = [];
    const w = gpu.createFpsWatch((f) => { calls.push(f); return true; });
    let t = run(w, 1000, 60, 4);
    t += 2000; w.sample(t);                       // khựng 2 giây (đang tải trận)
    t = run(w, t, 60, 6);
    for (let i = 0; i < 20; i++) w.sample(t += 500, true);   // tab ẩn: khung thưa nhưng không được tính là chậm
    t = run(w, t, 60, 6);
    assert.equal(calls.length, 0);
});

test('chậm kéo dài: hạ từng bậc 1 -> 0,85 -> 0,7 rồi dừng; chỉ ở chế độ Tự động', () => {
    store.delete('gfx_battle');
    assert.equal(gpu.battleGfx(), 'auto');
    assert.equal(gpu.battleAutoScale(), 1);
    assert.equal(gpu.battleAutoLower(), true);  assert.equal(gpu.battleAutoScale(), 0.85);
    assert.equal(gpu.battleAutoLower(), true);  assert.equal(gpu.battleAutoScale(), 0.7);
    assert.equal(gpu.battleAutoLower(), false); assert.equal(gpu.battleAutoScale(), 0.7);
    store.set('gfx_battle', 'high');
    assert.equal(gpu.battleAutoLower(), false, 'Đẹp: không tự giảm');
    store.set('gfx_battle', 'low');
    assert.equal(gpu.battleGfx(), 'low');
    store.delete('gfx_battle');
});
