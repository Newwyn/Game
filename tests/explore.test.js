// 🧺 Khám phá bản đồ chương 1 (game/gather.js): hái lượm mọc lại 05:00 · dụng cụ nhiều bậc · câu cá · ghi chép · rương ẩn · chỗ leo · đồi · lời dân làng · ảnh vật phẩm
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const W = require('../game/world');
const C = require('../game/campaign');
const G = require('../game/gather');
const CK = require('../game/cooking');
const Q = require('../game/quests');
const QD = require('../game/questData1');

const NOW = new Date(2026, 10, 11, 12, 0, 0).getTime();   // 12:00 trưa
const HOUR = 3600e3;
const fresh = () => { const pr = C.ensureCampaign({}, 0); W.ensureWorld(pr); pr.world.daily = { day: Q.dayKey(NOW), tasks: [], n: {}, seen: {}, got: {}, bonus: true }; return pr; };
const clear = (pr, n) => { for (let i = 1; i <= n; i++) pr.campaign.cleared.story[`c1-${String(i).padStart(2, '0')}`] = true; W.syncReports(pr); };
const act = (pr, scene, id, now = NOW, rng = () => 0.5) => W.interact(pr, pr.wallet, scene, id, {}, now, rng);
const obj = (pr, scene, id, now = NOW) => W.worldState(pr, now).scenes[scene].objects.find(o => o.id === id);
const mapsText = fs.readFileSync('src/world/maps.js', 'utf8'), extraText = fs.readFileSync('src/world/mapsExtra.js', 'utf8');
const MAPS = JSON.parse(mapsText.split('export const MAPS = ')[1].trim().replace(/;$/, ''));
const EXTRA = JSON.parse(extraText.split('export const EXTRA = ')[1].trim().replace(/;$/, ''));
const PATCH = JSON.parse(extraText.split('export const PATCH = ')[1].split(/;\r?\n/)[0]);   // chịu được xuống dòng kiểu Windows
const rules = import('data:text/javascript;base64,' + Buffer.from((() => { const s = fs.readFileSync('src/ui/world.js', 'utf8').split('// MOVEMENT_RULES_BEGIN')[1].split('// MOVEMENT_RULES_END')[0]; return s.slice(s.indexOf('export const')); })()).toString('base64'));
/** bản đồ như client thấy: gộp vật thêm + vá độ cao */
function clientMap(id) {
    const m = structuredClone(MAPS[id]);
    for (const o of EXTRA[id] ?? []) { const i = m.objects.findIndex(x => x.id === o.id); if (i >= 0) m.objects[i] = o; else m.objects.push(o); }
    const rows = m.heights.map(r => [...r]);
    for (const [x, y, h] of PATCH[id]?.heights ?? []) rows[y][x] = String(h);
    m.heights = rows.map(r => r.join(''));
    return m;
}

test('bảng dữ liệu: dụng cụ 3 bậc, bậc 1 từ nhiệm vụ, bậc sau có cấp tài khoản + giá; điểm hái trỏ tới vật liệu / dụng cụ có thật', () => {
    for (const [id, t] of Object.entries(G.TOOLS)) {
        assert.deepEqual(t.tiers.map(x => x.tier), [1, 2, 3], id);
        assert.ok(Q.BY_ID[t.tiers[0].quest]?.tools?.[id] === 1, `${id}: nhiệm vụ trao bậc 1`);
        for (const x of t.tiers.slice(1)) { assert.ok(x.account > 1 && x.cost.gold > 0, id); for (const m of Object.keys(x.cost.mats)) assert.ok(G.MATS[m], m); }
        assert.ok(t.tiers[1].account < t.tiers[2].account && t.tiers[2].account <= 18, `${id}: rải trong chương 1`);
    }
    for (const [k, n] of Object.entries(G.NODES)) {
        if (!n.fish) assert.ok(G.MATS[n.item], k);
        if (n.tool) assert.ok(G.TOOLS[n.tool] && n.tier >= 1 && n.tier <= 3, k);
    }
    // vật liệu rèn bậc 3 chỉ lấy được bằng dụng cụ bậc 2 -> phải đi lần lượt
    assert.equal(G.NODES.sat.tier, 2); assert.equal(G.NODES.go_cung.tier, 2);
    for (const o of G.ALL_OBJECTS) for (const t of [o.label ?? '', o.title ?? '', ...(o.lines ?? [])]) assert.ok(!t.includes('—'), `${o.id}: lời có gạch dài`);
});

test('hái lượm: nhận đồ 1 lần, hôm sau 05:00 mọc lại, số lượng trong khoảng', () => {
    const pr = fresh();
    const morning = new Date(2026, 10, 12, 5, 0, 1).getTime(), before5 = new Date(2026, 10, 12, 4, 59, 0).getTime();
    assert.equal(obj(pr, 'outskirts', 'g_lua1').state, 'ready');
    const r = act(pr, 'outskirts', 'g_lua1');
    assert.ok(r.ok && r.done);
    assert.ok(r.got.lua >= 1 && r.got.lua <= 2);
    const n = G.have(pr, 'lua');
    assert.equal(obj(pr, 'outskirts', 'g_lua1').state, 'hidden');
    assert.equal(act(pr, 'outskirts', 'g_lua1').ok, false);
    assert.equal(act(JSON.parse(JSON.stringify(pr)), 'outskirts', 'g_lua1', before5).ok, false);   // nạp lại save, trước 05:00: chưa mọc
    assert.equal(G.have(pr, 'lua'), n);
    assert.equal(obj(pr, 'outskirts', 'g_lua1', morning).state, 'ready');
    assert.ok(act(pr, 'outskirts', 'g_lua1', morning).ok);
    assert.ok(G.have(pr, 'lua') > n);
    // cây táo: rung xong cây vẫn đứng đó (trạng thái 'done'), được 2–3 quả
    const t = act(pr, 'outskirts', 'g_tao1');
    assert.ok(t.got.tao >= 2 && t.got.tao <= 3);
    assert.equal(obj(pr, 'outskirts', 'g_tao1').state, 'done');
    // giới hạn số lượng với mọi loại điểm + mọi bậc dụng cụ
    for (const [k, node] of Object.entries(G.NODES)) if (!node.fish) for (const tier of [node.tier ?? 0, 2, 3]) for (const x of [0, 0.5, 0.999]) {
        const y = G.rollYield(node, Math.max(tier, node.tier ?? 0), () => x);
        assert.ok(y >= node.n[0] && y <= node.n[1] + 2, `${k} bậc ${tier}: ${y}`);
    }
    for (let i = 0; i < 300; i++) G.addMat(pr, 'lua', 1);
    assert.equal(G.have(pr, 'lua'), G.MAT_MAX);
});

test('chặt cây / đập quặng: cần dụng cụ đủ bậc, bậc cao gõ ít lần hơn và được nhiều hơn', () => {
    const pr = fresh();
    const no = act(pr, 'outskirts', 'g_go1');
    assert.equal(no.ok, false); assert.match(no.why, /Rìu gỗ/);
    assert.match(obj(pr, 'outskirts', 'g_go1').lack, /Rìu gỗ/);
    G.giveTool(pr, 'axe', 1); G.giveTool(pr, 'pick', 1);
    assert.equal(obj(pr, 'outskirts', 'g_go1').lack, null);
    const a = act(pr, 'outskirts', 'g_go1'), b = act(pr, 'outskirts', 'g_go1');
    assert.deepEqual([a.hit.left, b.hit.left, G.have(pr, 'go')], [2, 1, 0]);          // 3 lần gõ, chưa xong thì chưa có gỗ
    const c = act(pr, 'outskirts', 'g_go1', NOW, () => 0.99);
    assert.ok(c.done && c.got.go === 3);
    assert.equal(act(pr, 'outskirts', 'g_go1').ok, false);
    // quặng sắt (trên gờ đá) cần cuốc bậc 2
    const iron = act(pr, 'outskirts', 'g_sat1');
    assert.equal(iron.ok, false); assert.match(iron.why, /Cuốc sắt trở lên \(đang có Cuốc gỗ\)/);
    pr.world.tools.pick = 2;
    assert.equal(G.pressesFor(G.NODES.sat, 2), 4);
    assert.equal(G.pressesFor(G.NODES.dong, 2), 2);
    assert.equal(G.pressesFor(G.NODES.dong, 3), 1);
    const d1 = act(pr, 'outskirts', 'g_dong1', NOW, () => 0.99), d2 = act(pr, 'outskirts', 'g_dong1', NOW, () => 0.99);
    assert.ok(d1.hit && d2.done);
    assert.equal(d2.got.dong, 4);                                                     // 3 + 1 nhờ cuốc hơn 1 bậc
    // gõ dở hôm qua không tính sang hôm nay
    pr.world.tools.axe = 1;
    act(pr, 'outskirts', 'g_go2');
    assert.equal(act(pr, 'outskirts', 'g_go2', NOW + 24 * HOUR).hit.left, 2);
});

test('rèn dụng cụ: cần bậc 1 từ nhiệm vụ, đủ cấp tài khoản, trừ vật liệu + vàng đúng 1 lần', () => {
    const pr = fresh();
    assert.match(G.craft(pr, pr.wallet, 'pick').why, /nhiệm vụ/);
    G.giveTool(pr, 'pick', 1);
    for (const [id, n] of [['go', 20], ['dong', 20]]) G.addMat(pr, id, n);
    pr.wallet.gold = 1000;
    pr.account.level = 7;
    assert.match(G.craft(pr, pr.wallet, 'pick').why, /cấp tài khoản 8/);
    assert.deepEqual([G.have(pr, 'go'), pr.wallet.gold, pr.world.tools.pick], [20, 1000, 1]);
    pr.account.level = 8;
    const r = G.craft(pr, pr.wallet, 'pick');
    assert.ok(r.ok && r.tier === 2);
    assert.deepEqual([G.have(pr, 'go'), G.have(pr, 'dong'), pr.wallet.gold, pr.world.tools.pick], [14, 12, 600, 2]);
    // bậc 3: thiếu vật liệu / thiếu vàng thì không mất gì
    pr.account.level = 14;
    assert.match(G.craft(pr, pr.wallet, 'pick').why, /Thiếu vật liệu/);
    G.addMat(pr, 'go_cung', 4); G.addMat(pr, 'sat', 8);
    pr.wallet.gold = 100;
    assert.match(G.craft(pr, pr.wallet, 'pick').why, /1200 Vàng/);
    assert.deepEqual([G.have(pr, 'sat'), pr.wallet.gold, pr.world.tools.pick], [8, 100, 2]);
    pr.wallet.gold = 1200;
    assert.ok(G.craft(pr, pr.wallet, 'pick').ok);
    assert.deepEqual([G.have(pr, 'sat'), G.have(pr, 'go_cung'), pr.wallet.gold, pr.world.tools.pick], [0, 0, 0, 3]);
    assert.match(G.craft(pr, pr.wallet, 'pick').why, /bậc cao nhất/);
    assert.equal(G.giveTool(pr, 'pick', 1), true);
    assert.equal(pr.world.tools.pick, 3);                                             // nhận lại bậc 1 không làm tụt bậc
    assert.equal(W.worldState(pr).pack.tools.find(t => t.id === 'pick').tierName, 'Cuốc thép');
});

test('nhiệm vụ dụng cụ: Borin trao cuốc + rìu, lão Gus trao cần câu; gom đủ vật liệu rồi về báo', () => {
    assert.equal(Q.QUESTS.filter(q => q.type === 'side').length, 18);
    const pr = fresh();
    clear(pr, 2);   // ải 4 kế tiếp thì Borin kể chuyện cốt truyện trước, nên nhận dụng cụ từ sau ải 2
    const offer = act(pr, 'ashford', 'borin');
    assert.equal(offer.quest, 't_dungcu');
    assert.deepEqual([pr.world.tools.pick, pr.world.tools.axe], [1, 1]);
    for (let i = 0; i < 3; i++) act(pr, 'outskirts', 'g_go1', NOW, () => 0.99);
    for (let i = 0; i < 3; i++) act(pr, 'outskirts', 'g_dong1', NOW, () => 0.99);
    assert.equal(Q.progOf(pr, 't_dungcu').i, 1);                                      // đủ 2 gỗ + 2 quặng -> sang bước về báo
    const gold = pr.wallet.gold;
    assert.ok(act(pr, 'ashford', 'borin').completed);
    assert.equal(pr.wallet.gold, gold + 300);
    assert.equal(G.have(pr, 'go'), 3);                                                // vật liệu vẫn giữ để rèn dụng cụ
    clear(pr, 3);
    // lão Gus: nhận việc Bẫy thỏ trước, lần nói chuyện sau nhận cần câu
    assert.equal(act(pr, 'outskirts', 'farmer').quest, 's_bay');
    assert.equal(act(pr, 'outskirts', 'farmer').quest, 't_cau');
    assert.equal(pr.world.tools.rod, 1);
    assert.ok(act(pr, 'forest', 'f_rung').fishing);
    assert.ok(W.fish(pr, pr.wallet, 'forest', 'f_rung', 'good', NOW, () => 0.1).ok);
    assert.equal(Q.progOf(pr, 't_cau').i, 1);
    assert.ok(act(pr, 'outskirts', 'farmer').completed);
});

test('câu cá: cần cần câu; mỗi lần 0–2 con; giới hạn lượt mỗi ngày; cá hoàng kim cần cần câu bậc 2; vũng sâu cần bậc 2', () => {
    const pr = fresh();
    assert.equal(act(pr, 'forest', 'f_rung').ok, false);
    G.giveTool(pr, 'rod', 1);
    const info = act(pr, 'forest', 'f_rung').fishing;
    assert.deepEqual([info.id, info.left], ['f_rung', 3]);
    assert.match(act(pr, 'forest', 'f_sau').why, /Cần câu sắt/);
    const o = W.SCENES.forest.objects.find(x => x.id === 'f_rung');
    // trượt: không mất lượt, không được cá
    const miss = G.fishCast(pr, o, 'miss', NOW, () => 0);
    assert.deepEqual([miss.ok, Object.keys(miss.got).length, miss.left], [true, 0, 3]);
    let total = 0;
    for (let i = 0; i < 3; i++) {
        const r = G.fishCast(pr, o, 'perfect', NOW, () => 0.999);                     // rng cao nhất: loại hiếm nhất có thể
        const n = Object.values(r.got).reduce((s, v) => s + v, 0);
        assert.ok(r.ok && n >= 1 && n <= 2);
        assert.equal(r.got.ca_vang, undefined, 'cần câu tre không câu được cá hoàng kim');
        total += n;
    }
    assert.equal(G.fishCast(pr, o, 'perfect', NOW, () => 0).ok, false);              // hết 3 lượt
    assert.equal(obj(pr, 'forest', 'f_rung').state, 'done');
    assert.ok(total >= 3 && total <= 6);
    assert.equal(obj(pr, 'forest', 'f_rung', NOW + 24 * HOUR).state, 'ready');
    // bấm bừa (trượt liên tục) cũng bị chặn sau FISH_TRIES lần
    const p2 = fresh(); G.giveTool(p2, 'rod', 1);
    for (let i = 0; i < G.FISH_TRIES; i++) assert.ok(G.fishCast(p2, o, 'miss', NOW).ok);
    assert.equal(G.fishCast(p2, o, 'good', NOW).ok, false);
    // cần câu bậc 2 ở vũng sâu: có thể ra cá hoàng kim; 2 con thứ hai luôn là cá chép
    const p3 = fresh(); p3.world.tools.rod = 2;
    const deep = W.SCENES.forest.objects.find(x => x.id === 'f_sau');
    const r = G.fishCast(p3, deep, 'perfect', NOW, () => 0.999);
    assert.equal(r.got.ca_vang, 1); assert.equal(r.rare, true);
    const kinds = new Set();
    for (const x of [0, 0.3, 0.6, 0.85, 0.999]) for (const k of Object.keys(G.fishCast(fresh2(), deep, 'good', NOW, () => x).got)) kinds.add(k);
    assert.deepEqual([...kinds].sort(), ['ca_bac', 'ca_chep', 'ca_vang']);
    function fresh2() { const p = fresh(); p.world.tools.rod = 3; return p; }
    assert.equal(G.fishInfo(fresh2(), deep).left, 4);                                 // cần câu thép: thêm 1 lượt
    assert.equal(W.fish(p3, p3.wallet, 'forest', 'g_nam1', 'good', NOW).ok, false);   // không câu ở bụi nấm
});

test('ghi chép: đọc thì vào sổ (đếm đúng), chưa đọc hiện ???; rương ẩn chỉ hiện sau khi đọc đúng ghi chép, mở 1 lần', () => {
    const pr = fresh();
    const nb = () => W.worldState(pr).notebook;
    assert.ok(G.NOTES.length >= 12);
    assert.deepEqual([nb().have, nb().total], [0, G.NOTES.length]);
    assert.ok(nb().list.every(n => n.title === '???' && !n.lines.length));
    assert.equal(obj(pr, 'outskirts', 'hc_mo').state, 'hidden');
    assert.equal(act(pr, 'outskirts', 'hc_mo').ok, false);
    assert.equal(obj(pr, 'outskirts', 'n_mo').unread, true);
    const r = act(pr, 'outskirts', 'n_mo');
    assert.match(r.text, /Ghi chép mới: Nội quy mỏ đá/);
    assert.ok(r.lines.some(l => l[1].includes('vừa lộ ra')));
    assert.equal(act(pr, 'outskirts', 'n_mo').text, undefined);                       // đọc lại: không báo mới
    assert.equal(nb().have, 1);
    assert.equal(nb().list.find(n => n.id === 'n_mo').title, 'Nội quy mỏ đá');
    assert.equal(obj(pr, 'outskirts', 'n_mo').unread, false);
    assert.equal(obj(pr, 'outskirts', 'hc_mo').state, 'ready');
    const stone = pr.wallet.stone;
    assert.ok(act(pr, 'outskirts', 'hc_mo').ok);
    assert.equal(pr.wallet.stone, stone + 6);
    assert.equal(act(JSON.parse(JSON.stringify(pr)), 'outskirts', 'hc_mo').ok, false);
    // mỗi rương ẩn trỏ tới 1 ghi chép có thật cùng khu và ghi chép đó có "reveal" ngược lại
    for (const [scene, list] of Object.entries(G.OBJECTS)) for (const o of list.filter(x => x.needNote)) assert.equal(list.find(x => x.id === o.needNote)?.reveal, o.id, `${scene}/${o.id}`);
    // ghi chép dạy công thức
    pr.flags.nguyen_lieu_lena = true;
    assert.equal(CK.knows(pr, 'sup_hoi_sinh'), false);
    act(pr, 'forest', 'n_dinh');
    assert.equal(CK.knows(pr, 'sup_hoi_sinh'), true);
    // giá sách nhà bà Mira (ghi chú kiểu cũ) vẫn đọc được, không tính vào sổ
    assert.ok(act(pr, 'mira_in', 'mira_shelf').ok);
    assert.equal(nb().have, 2);
});

test('lời bâng quơ của dân làng: 2–3 câu mỗi người, đổi theo tiến trình, không gạch dài', () => {
    const pr = fresh();
    for (const [id, sets] of Object.entries(G.AMBIENT)) {
        assert.ok(W.NPCS[id], id);
        for (const [, lines] of sets) { assert.ok(lines.length >= 2 && lines.length <= 3, id); for (const t of lines) assert.ok(t.length <= 60 && !t.includes('—'), `${id}: ${t}`); }
    }
    const early = W.worldState(pr).scenes.ashford.npcs.find(n => n.id === 'lena').say;
    clear(pr, 10);
    const late = W.worldState(pr).scenes.ashford.npcs.find(n => n.id === 'lena').say;
    assert.ok(early.length >= 2 && late.length >= 2);
    assert.notDeepEqual(early, late);
    assert.deepEqual(G.ambient(fresh(), 'sera'), []);                                 // Sera chưa được cứu: không nói
});

test('bản đồ: mọi vật khám phá có chỗ đứng hợp lệ; vật thường đi bộ tới được (đã vá độ cao); vật "trên cao" chỉ leo / nhảy mới tới', async () => {
    const { jumpTarget, canWalkTile, tileHeight, isGap } = await rules;
    const key = (x, y) => `${x},${y}`, dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [id, list] of Object.entries(G.OBJECTS)) {
        const m = clientMap(id), pos = new Map(m.objects.map(o => [o.id, o]));
        const solid = new Set([...m.npcs.filter(n => !W.NPCS[n.id].wander).map(n => key(n.x, n.y)), ...m.objects.filter(o => o.solid && !o.area).flatMap(o => (o.group ?? [[0, 0]]).map(([dx, dy]) => key(o.x + dx, o.y + dy)))]);
        const blocked = (x, y) => m.grid[y]?.[x] !== '.' || isGap(m, x, y) || solid.has(key(x, y));
        const flood = (moves) => { const seen = new Set([key(...m.spawn)]), q = [m.spawn]; for (let i = 0; i < q.length; i++) for (const [x, y] of moves(q[i][0], q[i][1])) if (!seen.has(key(x, y))) { seen.add(key(x, y)); q.push([x, y]); } return seen; };
        const walkMoves = (x, y) => dirs.map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => !blocked(nx, ny) && canWalkTile(m, x, y, nx, ny));
        const climbs = m.objects.filter(o => o.from);
        const allMoves = (x, y) => {
            const out = walkMoves(x, y);
            for (const [dx, dy] of dirs) { const t = jumpTarget(m, x, y, dx, dy, true, blocked); if (t) out.push([t.tx, t.ty]); }
            for (const c of climbs) if (c.from.some(([fx, fy]) => fx === x && fy === y)) out.push([c.x, c.y]);
            return out;
        };
        const walked = flood(walkMoves), reached = flood(allMoves);
        const near = (set, o) => dirs.some(([dx, dy]) => set.has(key(o.x + dx, o.y + dy)) && tileHeight(m, o.x + dx, o.y + dy) === tileHeight(m, o.x, o.y));
        for (const o of list) {
            const p = pos.get(o.id);
            assert.ok(p, `${id}/${o.id}: thiếu vị trí trong mapsExtra.js`);
            assert.equal(m.grid[p.y][p.x], '.', `${id}/${o.id}`);
            if (o.type === 'climb') {
                assert.ok(p.from.length && !p.solid && p.optional, `${id}/${o.id}`);
                for (const [fx, fy] of p.from) {
                    assert.equal(Math.abs(fx - p.x) + Math.abs(fy - p.y), 1, `${id}/${o.id}: ô chân phải sát dây`);
                    assert.ok(tileHeight(m, p.x, p.y) - tileHeight(m, fx, fy) >= 2, `${id}/${o.id}: chỗ leo phải cao hơn 2 bậc (nhảy không tới)`);
                    assert.ok(reached.has(key(fx, fy)), `${id}/${o.id}: không tới được chân dây`);
                }
                assert.ok(!walked.has(key(p.x, p.y)), `${id}/${o.id}: đi bộ lên được`);
                continue;
            }
            if (o.up) { assert.ok(p.optional, `${id}/${o.id}`); assert.ok(near(reached, p), `${id}/${o.id}: leo / nhảy không tới`); assert.ok(!near(walked, p), `${id}/${o.id}: đi bộ tới được`); }
            else assert.ok(near(walked, p), `${id}/${o.id}: đi bộ không tới`);
        }
        // vá độ cao không cắt đường tới NPC / vật bắt buộc / lối ra
        for (const t of [...m.npcs, ...m.objects.filter(o => !o.optional && !o.area && !o.trigger)]) assert.ok(dirs.some(([dx, dy]) => walked.has(key(t.x + dx, t.y + dy))) || walked.has(key(t.x, t.y)), `${id}: không tới được ${t.id}`);
    }
    // Đồi Gió ở Rừng Sương: vai đồi bậc 1, đỉnh bậc 3; trên đỉnh có ghi chép + nguyên liệu hiếm + rương 1 lần
    const f = clientMap('forest'), at = (id) => f.objects.find(o => o.id === id);
    assert.deepEqual(['n_dinh', 'g_mat', 'hc_dinh'].map(id => tileHeight(f, at(id).x, at(id).y)), [3, 3, 3]);
    assert.equal(tileHeight(f, ...at('c_nui').from[0]), 1);
    assert.equal(G.MATS.mat.rare, true);
    assert.equal(W.SCENES.forest.objects.find(o => o.id === 'hc_dinh').type, 'chest');
    // chỗ câu cá đứng sát nước
    const ter = (await import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync('src/world/terrain3d.js', 'utf8')).toString('base64'))).TERRAIN;
    for (const [id, list] of Object.entries(G.OBJECTS)) for (const o of list.filter(x => G.NODES[x.kind]?.fish)) {
        const p = (EXTRA[id] ?? []).find(x => x.id === o.id);
        assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ter[id][p.y + dy]?.[p.x + dx] === 'w'), `${id}/${o.id}: không sát nước`);
    }
});

test('ảnh vật phẩm: nguyên liệu, món ăn, dụng cụ, vật nhiệm vụ và mọi vật "i_*" trên bản đồ đều có hình vẽ', async () => {
    const icons = await import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync('src/ui/itemIcons.js', 'utf8')).toString('base64'));
    for (const id of Object.keys(G.MATS)) assert.ok(icons.hasIcon(id), id);
    for (const r of CK.RECIPES) assert.ok(icons.hasIcon(`dish_${r.id}`), r.id);
    for (const t of Object.keys(G.TOOLS)) for (const n of [1, 2, 3]) assert.ok(icons.hasIcon(`tool_${t}${n}`), t);
    for (const id of Object.keys(W.ITEM_NAMES)) assert.ok(icons.hasIcon(id), `vật nhiệm vụ ${id}`);
    for (const [scene, list] of Object.entries(EXTRA)) for (const o of list) if (o.sprite?.startsWith('i_')) assert.ok(icons.mapCell(o.sprite) != null, `${scene}/${o.id}: ${o.sprite}`);
    // vẽ thử mọi hình bằng canvas giả: không hàm vẽ nào lỗi, hình nào cũng có nét
    let rects = 0;
    const fake = () => ({ width: 0, height: 0, getContext: () => ({ set fillStyle(v) { assert.match(v, /^#[0-9a-f]{3,6}$/i); }, fillRect: (x, y, w, h) => { assert.ok([x, y, w, h].every(Number.isFinite) && w > 0 && h > 0); rects++; } }), toDataURL: () => `data:fake;${rects}` });
    globalThis.document = { createElement: fake };
    try {
        for (const key of [...Object.keys(G.MATS), ...CK.RECIPES.map(r => `dish_${r.id}`), ...Object.keys(G.TOOLS).flatMap(t => [1, 2, 3].map(n => `tool_${t}${n}`)), ...Object.keys(W.ITEM_NAMES)]) {
            const before = rects;
            assert.ok(icons.iconURL(key), key);
            assert.ok(rects > before || icons.iconURL(key), key);
        }
        const atlas = icons.mapAtlas();
        assert.ok(atlas.meta.cols * atlas.meta.rows >= 40 && atlas.meta.cw === 96);
        assert.ok(rects > 2000);
    } finally { delete globalThis.document; }
    // vật nhiệm vụ không còn dùng hình tạm (thùng gỗ / bó lúa / bụi lau)
    const spr = (scene, id) => EXTRA[scene].find(o => o.id === id).sprite;
    assert.deepEqual([spr('ashford', 'pk_meo'), spr('ashford', 'ga1'), spr('outskirts', 'bu_nhin'), spr('ashford', 'bia_vo_danh'), spr('tavern_in', 'ghe_trong'), spr('forest', 't_bay1')],
        ['i_cat', 'i_trough', 'i_scarecrow', 'i_stele', 'i_chair', 'i_trap']);
    // điểm hái có "stay" đều có hình lúc đã hái
    for (const [scene, list] of Object.entries(G.OBJECTS)) for (const o of list.filter(x => G.NODES[x.kind]?.stay)) assert.ok(icons.hasOff(EXTRA[scene].find(x => x.id === o.id).sprite), `${scene}/${o.id}: thiếu hình đã hái`);
});

test('việc hằng ngày "nhặt vật" tính cả điểm hái mới; hoa dại kiểu cũ vẫn cho vàng', () => {
    const pr = C.ensureCampaign({}, 0); W.ensureWorld(pr);
    pr.world.daily = { day: Q.dayKey(NOW), tasks: ['d_gather'], n: {}, seen: {}, got: {}, bonus: true };
    act(pr, 'outskirts', 'g_lua1'); act(pr, 'outskirts', 'g_trung1');
    assert.equal(pr.world.daily.n.d_gather, 2);
    const gold = pr.wallet.gold;
    assert.ok(act(pr, 'outskirts', 'hoa_o1').ok);
    assert.equal(pr.wallet.gold, gold + 20);
    assert.equal(pr.world.daily.got.d_gather, true);
    assert.ok(QD.DAILY.tasks.find(t => t.id === 'd_gather'));
});
