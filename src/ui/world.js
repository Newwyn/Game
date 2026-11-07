// ============================================================
// 🗺️ BẢN ĐỒ THẾ GIỚI — kiểu Pokémon (Game Boy Advance): nhìn từ trên xuống, đi theo ô vuông
//   · Nhân vật chính (Nam / Nữ, người chơi chọn) đi 4 hướng: phím mũi tên / W A S D hoặc phím ảo; giữ để đi liên tục
//   · Nút A (E / Enter / Z): nói chuyện, xem đồ vật ở ô phía trước · Nút B (Space / X): nhảy (qua được vật cản mỏng 1 ô)
//   · Camera giữ nhân vật ở giữa màn, dừng ở mép bản đồ · NPC đứng / đi lại quanh chỗ của mình, quay mặt khi nói chuyện
//   · Bản đồ + vị trí NPC / đồ vật / lối ra: src/world/maps.js · Luật (rương, việc, sự kiện…): server (game/world.js)
// ============================================================
import { net, socket } from '../net/socket.js';
import { playStory } from './story.js';
import { MAPS } from '../world/maps.js';
import { trackerHTML, questLogHTML } from './questLog.js';
import '../styles/questlog.css';

const SHEETS = import.meta.glob('../assets/overworld/*.webp', { eager: true, import: 'default' });
const SHEET_META = import.meta.glob('../assets/overworld/*.json', { eager: true, import: 'default' });
const MAP_IMG = import.meta.glob('../assets/maps/*.webp', { eager: true, import: 'default' });
const ITEMS_IMG = import.meta.glob('../assets/overworld/items.webp', { eager: true, import: 'default' });

const DIRS = { down: [0, 1], left: [-1, 0], right: [1, 0], up: [0, -1] };
const ROW = { down: 0, left: 1, right: 2, up: 3 };
const STEP_MS = 230;          // thời gian đi 1 ô
const JUMP_MS = 420;
const ITEM_CELL = { chest: 0, chest_open: 1, mine: 2, wheat: 3, mushroom: 4, hammer: 5, herb: 6, pages: 7, board: 8 };

let root, canvas, ctx, hud, padEl;
let data = null, scene = null, map = null, open = false;
let onStages = null, onGear = null, onBack = null, onExtras = null, onStage = null;
const me = { x: 0, y: 0, face: 'down', moving: null, jump: null, step: 0 };
let npcs = [];                // [{ id, x, y, face, home, moving, nextAt, def }]
let dialog = null, puzzle = null, toastMsg = null, toastAt = 0, mapOpen = false, busy = false, fade = 0;
const held = new Set();       // hướng đang giữ (bàn phím + phím ảo)
let lastSave = 0;

// ---------- đồ hoạ: 3D (Đẹp / Nhẹ) hoặc phẳng 2D ----------
let host3d = null, fadeEl = null, view = null, loading3d = false;
const LS = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } } };
const coarse = () => { try { return matchMedia('(pointer: coarse)').matches; } catch { return false; } };
// 'auto' (mặc định): bắt đầu Đẹp (điện thoại: Nhẹ), máy không kịp thì tự hạ — xem view.setAuto
let quality = LS.get('wd_quality') || 'auto';
let autoLevel = coarse() ? 'low' : 'high', autoToast = false;
const webglOK = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };
if (!webglOK()) quality = '2d';
let viewLoading = null;
const use3d = () => quality !== '2d' && !!view;
function applyQuality() {
    if (!root) return;
    if (quality !== '2d' && !view) {   // phần 3D là gói riêng: chỉ tải khi mở bản đồ lần đầu
        viewLoading ??= import('../world3d/view.js')
            .then(m => { view = m.createView(host3d); })
            .catch(e => { console.warn('[world] không bật được 3D, dùng bản đồ phẳng', e); quality = '2d'; })
            .finally(() => { loading3d = false; applyQuality(); });
        loading3d = true; fade = Math.max(fade, 1);
        host3d.style.display = 'block'; canvas.style.display = 'none';
        return;
    }
    if (view && quality !== '2d') {
        view.setQuality(quality === 'auto' ? autoLevel : quality);
        view.setAuto(quality === 'auto' && !TICK, (kind) => {
            if (kind === 'low') autoLevel = 'low';
            if (!autoToast) { autoToast = true; toast('⚡ Máy hơi chậm — đã tự giảm đồ hoạ bản đồ cho mượt'); }
        });
    }
    host3d.style.display = quality === '2d' ? 'none' : 'block';
    canvas.style.display = quality === '2d' ? 'block' : 'none';
    if (scene && quality !== '2d') load3d(scene.id);
}
function load3d(id) {
    if (!view) return;
    loading3d = true; fade = Math.max(fade, 1);
    view.resize();
    view.setMap(id).catch(e => console.warn('[world] lỗi dựng bản đồ 3D', e)).finally(() => { if (scene?.id === id) loading3d = false; });
}

// ---------- tự đi (bấm xuống đất / nút 🧭 Tự đi tới của nhiệm vụ) ----------
// auto = { goal: { scene, kind: 'npc'|'obj'|'tile', id?, x?, y? }, path: [[x, y]] | null, exitDir, fails }
let auto = null;
const N4 = [[0, -1, 'up'], [0, 1, 'down'], [-1, 0, 'left'], [1, 0, 'right']];
const dirTo = (ax, ay, bx, by) => bx > ax ? 'right' : bx < ax ? 'left' : by > ay ? 'down' : 'up';
function cancelAuto() { auto = null; }
function startAuto(goal) {
    auto = { goal, path: null, exitDir: null, fails: 0 };
    if (!planAuto()) auto = null;
}
/** BFS 4 hướng từ chỗ đứng tới 1 trong các ô đích (đi được) -> danh sách ô (không gồm ô đang đứng) hoặc null */
function bfs(goals) {
    const key = (x, y) => x + y * 1000, want = new Set(goals.map(([x, y]) => key(x, y)));
    if (want.has(key(me.x, me.y))) return [];
    const from = new Map([[key(me.x, me.y), null]]), q = [[me.x, me.y]];
    while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of N4) {
            const nx = x + dx, ny = y + dy, k = key(nx, ny);
            if (from.has(k) || blocked(nx, ny)) continue;
            from.set(k, key(x, y));
            if (want.has(k)) {
                const path = [];
                for (let c = k; c !== key(me.x, me.y); c = from.get(c)) path.unshift([c % 1000, Math.floor(c / 1000)]);
                return path;
            }
            q.push([nx, ny]);
        }
    }
    return null;
}
/** Các ô có thể đứng để tương tác với mục tiêu (+ ô mục tiêu để quay mặt vào) */
function goalTiles(g) {
    const around = (tiles) => {
        const own = new Set(tiles.map(([x, y]) => x + ',' + y)), out = [];
        for (const [x, y] of tiles) for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (!own.has(nx + ',' + ny) && !blocked(nx, ny)) out.push([nx, ny]); }
        return out;
    };
    if (g.kind === 'npc') {
        const n = npcs.find(q => q.id === g.id && !q.hidden);
        return n ? { stand: around([[n.x, n.y]]), face: [[n.x, n.y]] } : null;
    }
    if (g.kind === 'obj') {
        const o = (map.objects ?? []).find(q => q.id === g.id);
        if (!o) return null;
        if (o.trigger) return { stand: o.trigger.filter(([x, y]) => !blocked(x, y)), face: [] };
        const tiles = o.area ?? [[o.x, o.y]];
        return { stand: around(tiles), face: tiles };
    }
    return { stand: [[g.x, g.y]], face: [] };
}
/** Bản đồ kế tiếp trên đường tới khu đích (BFS theo lối ra) -> lối ra trong bản đồ hiện tại */
function nextExit(to) {
    const prev = new Map([[scene.id, null]]), q = [scene.id];
    while (q.length) {
        const s = q.shift();
        for (const e of MAPS[s]?.exits ?? []) {
            if (prev.has(e.scene) || !data.scenes[e.scene]?.open) continue;
            prev.set(e.scene, { s, e });
            if (e.scene === to) { let c = to; while (prev.get(c).s !== scene.id) c = prev.get(c).s; return prev.get(c).e; }
            q.push(e.scene);
        }
    }
    return null;
}
function planAuto() {
    if (!auto || !scene) return false;
    const g = auto.goal;
    auto.exitDir = null;
    if (g.scene && g.scene !== scene.id) {
        if (!data.scenes[g.scene]?.open) { toast(`🔒 ${data.scenes[g.scene]?.name ?? 'Khu đó'} chưa mở`); return false; }
        const e = nextExit(g.scene);
        if (!e) { toast('⚠️ Không tìm được đường tới đó'); return false; }
        let stand = [], dirOf = null;
        if (e.edge) {
            for (let i = e.a; i <= e.b; i++) {
                const [x, y] = e.edge === 'left' ? [0, i] : e.edge === 'right' ? [map.cols - 1, i] : e.edge === 'up' ? [i, 0] : [i, map.rows - 1];
                if (x >= 0 && y >= 0 && x < map.cols && y < map.rows && map.grid[y][x] === '.') stand.push([x, y]);
            }
            dirOf = () => e.edge;
        } else {
            const ex = new Set(e.tiles.map(([x, y]) => x + ',' + y));
            for (const [x, y] of e.tiles) for (const [dx, dy] of N4) if (!ex.has((x + dx) + ',' + (y + dy)) && !blocked(x + dx, y + dy)) stand.push([x + dx, y + dy]);
            dirOf = ([sx, sy]) => { const t = e.tiles.find(([x, y]) => Math.abs(x - sx) + Math.abs(y - sy) === 1); return t ? dirTo(sx, sy, t[0], t[1]) : null; };
        }
        const path = bfs(stand);
        if (!path) { toast('⚠️ Không tìm được đường tới đó'); return false; }
        auto.path = path;
        const end = path.length ? path[path.length - 1] : [me.x, me.y];
        auto.exitDir = dirOf(end);
        return true;
    }
    const gt = goalTiles(g);
    if (!gt || !gt.stand.length) { toast('⚠️ Không tới gần được chỗ đó'); return false; }
    const path = bfs(gt.stand);
    if (!path) { toast('⚠️ Không tìm được đường tới đó'); return false; }
    auto.path = path; auto.face = gt.face;
    return true;
}
function stepAuto() {
    if (!auto || !canWalk() || held.size || queued) return;
    if (!auto.path && !planAuto()) { auto = null; return; }
    if (!auto.path.length) {
        if (auto.exitDir) { const d = auto.exitDir; auto.path = null; me.face = d; turnAt = 0; tryStep(d); if (!fade) auto = null; return; }
        const g = auto.goal, f = (auto.face ?? []).find(([x, y]) => Math.abs(x - me.x) + Math.abs(y - me.y) === 1);
        auto = null;
        if (f) { me.face = dirTo(me.x, me.y, f[0], f[1]); if (g.kind === 'npc' || g.kind === 'obj') pressA(); }
        return;
    }
    const [nx, ny] = auto.path[0];
    if (blocked(nx, ny)) { if (++auto.fails > 6) { auto = null; toast('⚠️ Đường bị chắn'); } else auto.path = null; return; }
    auto.path.shift();
    const d = dirTo(me.x, me.y, nx, ny);
    me.face = d; turnAt = 0;
    tryStep(d);
}
function onGroundTap(e) {
    if (!open || dialog || puzzle || mapOpen || qlOpen || busy || !map) return;
    let t;
    if (use3d()) t = view.pick(e.clientX, e.clientY);
    else {
        const { cx, cy, S } = cam(), r = canvas.getBoundingClientRect(), k = canvas.width / r.width;
        t = { x: Math.floor(((e.clientX - r.left) * k + cx) / S), y: Math.floor(((e.clientY - r.top) * k + cy) / S) };
    }
    if (!t || t.x < 0 || t.y < 0 || t.x >= map.cols || t.y >= map.rows) return;
    const n = npcs.find(q => !q.hidden && q.x === t.x && q.y === t.y);
    if (n) return startAuto({ kind: 'npc', id: n.id });
    const o = (map.objects ?? []).find(q => !q.trigger && (q.x === t.x && q.y === t.y || (q.area ?? []).some(([x, y]) => x === t.x && y === t.y)) && visibleObj(q));
    if (o) return startAuto({ kind: 'obj', id: o.id });
    if (!blocked(t.x, t.y)) startAuto({ kind: 'tile', x: t.x, y: t.y });
}

// ---------- nhiệm vụ: khung theo dõi + sổ nhiệm vụ (J) ----------
let qlOpen = false, qlTab = 'active', qlSel = null, tracked = LS.get('wd_track') || 'main';
const quests = () => data?.quests ?? [];
function trackedQuest() {
    const list = quests();
    return list.find(q => q.id === tracked && (q.state === 'active' || q.state === 'offered')) ?? list.find(q => q.type === 'main' && q.state === 'active') ?? null;
}
function goQuest(id) {
    const q = quests().find(x => x.id === id);
    if (!q?.target) return toast('Nhiệm vụ này chưa có chỗ để đi tới');
    tracked = id; LS.set('wd_track', id);
    qlOpen = false; renderHud();
    startAuto({ scene: q.target.scene, kind: q.target.kind, id: q.target.id });
}
/** Vị trí (ô) của mục tiêu nhiệm vụ đang theo dõi nếu nằm trong bản đồ hiện tại */
function trackedSpot() {
    const t = trackedQuest()?.target;
    if (!t || t.scene !== scene?.id) return null;
    if (t.kind === 'npc') { const n = npcs.find(q => q.id === t.id && !q.hidden); return n ? npcPos(n) : null; }
    const o = (map.objects ?? []).find(q => q.id === t.id);
    if (!o) return null;
    const tiles = o.trigger ?? o.area ?? [[o.x, o.y]];
    return { x: tiles.reduce((s, [x]) => s + x, 0) / tiles.length + 0.5, z: tiles.reduce((s, [, y]) => s + y, 0) / tiles.length + 0.5 };
}

const imgs = new Map();
function img(url) {
    if (!url) return null;
    if (!imgs.has(url)) { const im = new Image(); im.src = url; imgs.set(url, im); }
    const im = imgs.get(url);
    return im.complete && im.naturalWidth ? im : null;
}
const sheet = (name) => ({ url: SHEETS[`../assets/overworld/${name}.webp`], meta: SHEET_META[`../assets/overworld/${name}.json`] });

// ---------- khung ----------
function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'world-screen';
    root.innerHTML = `<div class="wd-3d"></div><canvas class="wd-canvas"></canvas><div class="wd-fade"></div><div class="wd-hud"></div>
        <div class="wd-pad" aria-label="Phím điều hướng">
            <button class="wd-dp up" data-dir="up" aria-label="Lên">▲</button>
            <button class="wd-dp left" data-dir="left" aria-label="Trái">◀</button>
            <button class="wd-dp right" data-dir="right" aria-label="Phải">▶</button>
            <button class="wd-dp down" data-dir="down" aria-label="Xuống">▼</button>
        </div>
        <div class="wd-ab"><button class="wd-btn-b" data-key="b" aria-label="Nhảy">B</button><button class="wd-btn-a" data-key="a" aria-label="Nói chuyện / xem">A</button></div>`;
    document.body.appendChild(root);
    canvas = root.querySelector('canvas');
    ctx = canvas.getContext('2d');
    hud = root.querySelector('.wd-hud');
    padEl = root.querySelector('.wd-pad');
    host3d = root.querySelector('.wd-3d');
    fadeEl = root.querySelector('.wd-fade');
    hud.addEventListener('click', onHudClick);
    // bấm chuột / chạm xuống đất: tự đi tới ô đó (nói chuyện / xem nếu là NPC, đồ vật)
    host3d.addEventListener('pointerdown', onGroundTap);
    canvas.addEventListener('pointerdown', onGroundTap);
    applyQuality();
    // phím ảo: giữ để đi
    root.querySelectorAll('[data-dir]').forEach(b => {
        const d = b.dataset.dir;
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); held.add(d); lastDir = d; tap(d); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, () => held.delete(d)));
    });
    root.querySelector('[data-key="a"]').addEventListener('pointerdown', (e) => { e.preventDefault(); pressA(); });
    root.querySelector('[data-key="b"]').addEventListener('pointerdown', (e) => { e.preventDefault(); pressB(); });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', (e) => { const d = KEY_DIR[e.key]; if (d) held.delete(d); });
    window.addEventListener('resize', resize);
    window.addEventListener('blur', () => held.clear());
    return root;
}
const KEY_DIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
let lastDir = null;
function resize() {
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(root.clientWidth * dpr);
    canvas.height = Math.round(root.clientHeight * dpr);
    view?.resize();
    if (open) renderHud();
}

// ---------- lưới ô ----------
const T = () => map.tile;                                   // px ảnh / ô
function tileSize() {                                       // px màn hình / ô: thấy khoảng 15 x 10 ô như Game Boy
    return Math.max(28, Math.floor(Math.min(canvas.width / 15, canvas.height / 10)));
}
function blocked(x, y, ignoreNpc = false) {
    if (!map || x < 0 || y < 0 || x >= map.cols || y >= map.rows) return true;
    if (map.grid[y][x] !== '.') return true;
    if (!ignoreNpc && npcs.some(n => !n.hidden && n.x === x && n.y === y)) return true;
    if ((map.objects ?? []).some(o => o.solid && o.x === x && o.y === y && visibleObj(o))) return true;
    return false;
}
const visibleObj = (o) => { const st = scene?.objects.find(s => s.id === o.id); return !!st && st.state !== 'hidden' && !(o.char && st.state !== 'ready'); };

// ---------- vòng lặp ----------
let raf = 0, last = 0;
// chỉ khi chạy thử (npm run dev, thêm ?tick vào địa chỉ): chạy vòng lặp bằng hẹn giờ — khung xem bị ẩn thì trình duyệt dừng requestAnimationFrame
const TICK = !!import.meta.env?.DEV && location.search.includes('tick');
const nextFrame = (f) => (TICK ? setTimeout(() => f(performance.now()), 40) : requestAnimationFrame(f));
const stopFrame = (h) => (TICK ? clearTimeout(h) : cancelAnimationFrame(h));
function frame(t) {
    if (!open) return;
    raf = nextFrame(frame);
    const dt = Math.min(50, t - (last || t));
    last = t;
    update(dt, t);
    if (use3d()) draw3d(t); else if (quality === '2d') draw(t);
    if (fadeEl) fadeEl.style.opacity = quality !== '2d' ? fade : 0;
    if (toastMsg && t - toastAt > 3500) { toastMsg = null; renderHud(); }
}
function update(dt, now) {
    if (!map) return;
    fade = loading3d && quality !== '2d' ? 1 : Math.max(0, fade - dt / 300);
    // đi / nhảy
    if (me.moving) {
        me.moving.t += dt;
        if (me.moving.t >= me.moving.dur) {
            me.x = me.moving.tx; me.y = me.moving.ty; me.moving = null; me.jump = null;
            me.step++; arriveAt = performance.now();
            onArrive();
        }
    }
    if (canWalk()) {
        const d = (lastDir && held.has(lastDir)) ? lastDir : [...held].pop();
        if (d) { queued = null; cancelAuto(); tryStep(d); }
        else if (queued) { const q = queued; queued = null; turnAt = 0; arriveAt = performance.now(); tryStep(q); }
        else stepAuto();
    }
    // NPC đi lại quanh chỗ đứng
    for (const n of npcs) {
        if (n.moving) {
            n.moving.t += dt;
            if (n.moving.t >= STEP_MS * 1.6) { n.x = n.moving.tx; n.y = n.moving.ty; n.moving = null; n.step++; }
            continue;
        }
        if (!n.def.wander || dialog || now < n.nextAt) continue;
        n.nextAt = now + 1600 + Math.random() * 2600;
        const d = Object.keys(DIRS)[Math.floor(Math.random() * 4)];
        n.face = d;
        const [dx, dy] = DIRS[d], tx = n.x + dx, ty = n.y + dy;
        if (Math.abs(tx - n.home[0]) > 2 || Math.abs(ty - n.home[1]) > 2) continue;
        if (blocked(tx, ty) || (tx === me.x && ty === me.y) || (me.moving && tx === me.moving.tx && ty === me.moving.ty)) continue;
        n.moving = { tx, ty, t: 0 };
    }
}
const canWalk = () => open && map && !me.moving && !dialog && !puzzle && !mapOpen && !qlOpen && !busy && fade <= 0;
// bấm nhanh 1 cái: quay mặt (nếu đang nhìn hướng khác) hoặc đi 1 ô — không bị lỡ giữa 2 khung hình
let queued = null;   // bấm trong lúc đang bước: nhớ lại, bước xong đi tiếp
function tap(d) { cancelAuto(); if (canWalk()) { turnAt = 0; tryStep(d); } else if (me.moving && !me.jump) queued = d; }
function tryStep(d) {
    const now = performance.now();
    // đứng yên mà bấm hướng khác: chỉ quay mặt (giống Pokémon), giữ thêm chút mới đi
    if (me.face !== d && now - arriveAt > 60) { me.face = d; turnAt = now; return; }
    me.face = d;
    if (now - turnAt < 110) return;
    const [dx, dy] = DIRS[d], tx = me.x + dx, ty = me.y + dy;
    // lối ra ở mép bản đồ / ô cổng
    const exit = (map.exits ?? []).find(e => (e.tiles ?? []).some(([x, y]) => x === tx && y === ty) || (e.edge && edgeHit(e, tx, ty)));
    if (exit) return useExit(exit);
    if (blocked(tx, ty)) { bump(); return; }
    me.moving = { tx, ty, t: 0, dur: STEP_MS };
}
let turnAt = 0, arriveAt = 0;
const edgeHit = (e, x, y) => (e.edge === 'left' && x < 0 && y >= e.a && y <= e.b) || (e.edge === 'right' && x >= map.cols && y >= e.a && y <= e.b)
    || (e.edge === 'up' && y < 0 && x >= e.a && x <= e.b) || (e.edge === 'down' && y >= map.rows && x >= e.a && x <= e.b);
let bumpAt = 0, trigLock = null;
function bump() { bumpAt = performance.now(); }
let saveTimer = 0;
function onArrive() {
    clearTimeout(saveTimer); saveTimer = setTimeout(() => save(true), 600);   // lưu vị trí ngay sau khi dừng bước
    // bước vào ô sự kiện (đi qua là kích hoạt — như bụi cỏ Pokémon)
    const trig = (map.objects ?? []).find(o => o.trigger && o.trigger.some(([x, y]) => x === me.x && y === me.y) && visibleObj(o));
    if (!trig) { trigLock = null; return; }
    if (trigLock === trig.id) return;   // đã kích hoạt, phải ra khỏi vùng rồi vào lại
    trigLock = trig.id;
    { const st = scene.objects.find(s => s.id === trig.id); if (st?.state === 'ready') interactWith({ kind: 'obj', id: trig.id }); }
}
function useExit(exit) {
    const s = data.scenes[exit.scene];
    if (!s?.open) { toast(`🔒 ${s?.name ?? 'Khu này'} mở khi qua ải ${s?.needNo ?? '?'}`); bump(); return; }
    fade = 1;
    loadScene(exit.scene, exit.at[0], exit.at[1], exit.face ?? me.face);
    net.worldMove(exit.scene, me.x, me.y, me.face, true);
    toast(`📍 ${s.name}`);
}

// ---------- nút A / B ----------
function front() { const [dx, dy] = DIRS[me.face]; return [me.x + dx, me.y + dy]; }
function pressA() {
    if (!open) return;
    if (dialog) return nextLine();
    if (puzzle || mapOpen || qlOpen || busy || me.moving) return;
    const [fx, fy] = front();
    const n = npcs.find(q => !q.hidden && (q.moving ? q.moving.tx : q.x) === fx && (q.moving ? q.moving.ty : q.y) === fy);
    if (n) {
        n.face = { up: 'down', down: 'up', left: 'right', right: 'left' }[me.face];
        return interactWith({ kind: 'npc', id: n.id });
    }
    const o = (map.objects ?? []).find(q => (q.x === fx && q.y === fy || (q.area && q.area.some(([x, y]) => x === fx && y === fy))) && visibleObj(q));
    if (o) return interactWith({ kind: 'obj', id: o.id });
}
function pressB() {
    if (!open || dialog || puzzle || mapOpen || qlOpen || busy || me.moving) return;
    cancelAuto();
    const [dx, dy] = DIRS[me.face];
    const x1 = me.x + dx, y1 = me.y + dy, x2 = me.x + 2 * dx, y2 = me.y + 2 * dy;
    // nhảy qua vật cản mỏng 1 ô (hàng rào, luống hoa…) nếu ô sau đó đi được; không thì nhảy tại chỗ
    if (blocked(x1, y1, true) && !blocked(x2, y2) && map.grid[y1]?.[x1] !== undefined && !(map.noJump ?? []).some(([x, y]) => x === x1 && y === y1)) {
        me.moving = { tx: x2, ty: y2, t: 0, dur: JUMP_MS }; me.jump = true;
    } else if (!blocked(x1, y1)) { me.moving = { tx: x1, ty: y1, t: 0, dur: JUMP_MS }; me.jump = true; }
    else { me.moving = { tx: me.x, ty: me.y, t: 0, dur: JUMP_MS }; me.jump = true; }
}
function interactWith({ kind, id }) {
    if (kind === 'obj') {
        const o = scene.objects.find(s => s.id === id);
        if (o?.type === 'stageBoard') { save(true); return onStages?.(); }
    }
    busy = true;
    net.worldInteract(scene.id, id);
}

// ---------- vẽ ----------
function cam() {
    const S = tileSize();
    const px = (me.moving ? me.x + (me.moving.tx - me.x) * ease(me.moving) : me.x) * S + S / 2;
    const py = (me.moving ? me.y + (me.moving.ty - me.y) * ease(me.moving) : me.y) * S + S / 2;
    const W = map.cols * S, H = map.rows * S;
    const cx = W <= canvas.width ? (W - canvas.width) / 2 : Math.max(0, Math.min(W - canvas.width, px - canvas.width / 2));
    const cy = H <= canvas.height ? (H - canvas.height) / 2 : Math.max(0, Math.min(H - canvas.height, py - canvas.height / 2));
    return { cx, cy, S };
}
const ease = (m) => Math.min(1, m.t / m.dur);
function drawChar(name, x, y, face, walking, stepN, lift = 0, S) {
    const { url, meta } = sheet(name);
    const im = img(url);
    if (!im || !meta) return;
    const col = walking ? (stepN % 2 ? 0 : 2) : 1;
    const r = ROW[face] ?? 0;
    const h = S * 1.35, w = h * meta.cw / meta.ch;
    // bóng dưới chân
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(x + S / 2, y + S * 0.92, S * 0.32, S * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(im, col * meta.cw, r * meta.ch, meta.cw, meta.ch, x + S / 2 - w / 2, y + S * 0.98 - h - lift, w, h);
}
function draw(now) {
    if (!ctx || !map) return;
    ctx.imageSmoothingEnabled = false;
    const { cx, cy, S } = cam();
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bg = img(MAP_IMG[`../assets/maps/${map.image}.webp`]);
    if (bg) ctx.drawImage(bg, -cx, -cy, map.cols * S, map.rows * S);
    const items = img(Object.values(ITEMS_IMG)[0]), itemsMeta = SHEET_META['../assets/overworld/items.json'];
    const list = [];   // vẽ theo hàng (y) để vật ở dưới che vật ở trên
    for (const o of map.objects ?? []) {
        const st = scene.objects.find(s => s.id === o.id);
        if (!st || st.state === 'hidden') continue;
        if (o.char) {   // nhóm quái đứng chờ (sự kiện)
            if (st.state !== 'ready') continue;
            for (const [k, [ox, oy]] of [[0, 0], [1, -1], [1, 1]].entries()) list.push({ y: o.y + oy, draw: () =>
                drawChar(o.char, (o.x + ox) * S - cx, (o.y + oy) * S - cy, 'left', Math.floor(now / 400 + k) % 2 === 0, Math.floor(now / 400), 0, S) });
            continue;
        }
        if (!o.sprite) continue;
        list.push({ y: o.y, draw: () => {
            const cell = ITEM_CELL[o.sprite === 'chest' && st.state === 'done' ? 'chest_open' : o.sprite];
            if (items && itemsMeta && cell != null) {
                const sx = (cell % itemsMeta.cols) * itemsMeta.cw, sy = Math.floor(cell / itemsMeta.cols) * itemsMeta.ch;
                const k = (o.big ? 1.3 : 0.9) * S / itemsMeta.ch;
                const w = itemsMeta.cw * k, h = itemsMeta.ch * k;
                const bob = st.state === 'ready' && o.sprite !== 'chest' && o.sprite !== 'mine' ? Math.sin(now / 300) * S * 0.05 : 0;
                ctx.drawImage(items, sx, sy, itemsMeta.cw, itemsMeta.ch, o.x * S - cx + S / 2 - w / 2, o.y * S - cy + S - h + bob, w, h);
            }
        } });
    }
    for (const n of npcs) {
        if (n.hidden) continue;
        const p = n.moving ? Math.min(1, n.moving.t / (STEP_MS * 1.6)) : 0;
        const x = (n.x + (n.moving ? (n.moving.tx - n.x) * p : 0)) * S - cx, y = (n.y + (n.moving ? (n.moving.ty - n.y) * p : 0)) * S - cy;
        list.push({ y: n.y + (n.moving ? (n.moving.ty - n.y) * p : 0), draw: () => {
            drawChar(n.def.art, x, y, n.face, !!n.moving && p > 0.25 && p < 0.75, n.step, 0, S);
            if (n.mark) {
                ctx.font = `900 ${Math.round(S * 0.6)}px Outfit, sans-serif`; ctx.textAlign = 'center';
                ctx.lineWidth = Math.max(2, S * 0.08); ctx.strokeStyle = '#1e293b'; ctx.fillStyle = n.mark === '!' ? '#facc15' : '#4ade80';
                const yy = y - S * 0.55 + Math.sin(now / 250) * S * 0.08;
                ctx.strokeText(n.mark, x + S / 2, yy); ctx.fillText(n.mark, x + S / 2, yy);
            }
        } });
    }
    const p = me.moving ? ease(me.moving) : 0;
    const mx = (me.x + (me.moving ? (me.moving.tx - me.x) * p : 0)) * S - cx, my = (me.y + (me.moving ? (me.moving.ty - me.y) * p : 0)) * S - cy;
    const lift = me.jump ? Math.sin(p * Math.PI) * S * 0.75 : 0;
    const shake = performance.now() - bumpAt < 150 ? Math.sin(performance.now() / 15) * S * 0.04 : 0;
    list.push({ y: me.y + (me.moving ? (me.moving.ty - me.y) * p : 0) + 0.01, draw: () =>
        drawChar(data.player?.gender === 'f' ? 'hero_f' : 'hero_m', mx + shake, my, me.face, !!me.moving && !me.jump && p > 0.2 && p < 0.8, me.step, lift, S) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.draw());
    // lớp phủ trên đầu (tán cây / mái nhà) nếu bản đồ có
    if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
}

// ---------- vẽ 3D: gom trạng thái gửi sang src/world3d/view.js ----------
function npcPos(n) {
    const p = n.moving ? Math.min(1, n.moving.t / (STEP_MS * 1.6)) : 0;
    return { x: n.x + (n.moving ? (n.moving.tx - n.x) * p : 0) + 0.5, z: n.y + (n.moving ? (n.moving.ty - n.y) * p : 0) + 0.5, p };
}
function draw3d(now) {
    if (!map || !view) return;
    const p = me.moving ? ease(me.moving) : 0;
    const mx = me.x + (me.moving ? (me.moving.tx - me.x) * p : 0) + 0.5, mz = me.y + (me.moving ? (me.moving.ty - me.y) * p : 0) + 0.5;
    const shake = performance.now() - bumpAt < 150 ? Math.sin(performance.now() / 15) * 0.05 : 0;
    const hero = sheet(data.player?.gender === 'f' ? 'hero_f' : 'hero_m');
    const actors = [{ key: 'me', url: hero.url, meta: hero.meta, x: mx + shake, z: mz, face: me.face,
        col: (!!me.moving && !me.jump && p > 0.2 && p < 0.8) ? (me.step % 2 ? 0 : 2) : 1, lift: me.jump ? Math.sin(p * Math.PI) * 0.8 : 0 }];
    const marks = [];
    for (const n of npcs) {
        if (n.hidden) continue;
        const s = sheet(n.def.art), q = npcPos(n);
        actors.push({ key: 'npc:' + n.id, url: s.url, meta: s.meta, x: q.x, z: q.z, face: n.face, col: (!!n.moving && q.p > 0.25 && q.p < 0.75) ? (n.step % 2 ? 0 : 2) : 1 });
        if (n.mark) marks.push({ key: 'm:' + n.id, x: q.x, z: q.z, txt: n.mark, color: n.mark === '!' ? '#facc15' : '#4ade80' });
    }
    const itemsUrl = Object.values(ITEMS_IMG)[0], itemsMeta = SHEET_META['../assets/overworld/items.json'];
    const items = [];
    for (const o of map.objects ?? []) {
        const st = scene.objects.find(s => s.id === o.id);
        if (!st || st.state === 'hidden') continue;
        if (o.char) {   // nhóm quái đứng chờ (sự kiện)
            if (st.state !== 'ready') continue;
            const g = sheet(o.char);
            [[0, 0], [1, -1], [1, 1]].forEach(([ox, oy], k) => actors.push({ key: `ev:${o.id}:${k}`, url: g.url, meta: g.meta, x: o.x + ox + 0.5, z: o.y + oy + 0.5, face: 'left',
                col: Math.floor(now / 400 + k) % 2 === 0 ? 0 : 2 }));
            continue;
        }
        if (!o.sprite || !itemsMeta) continue;
        const cell = ITEM_CELL[o.sprite === 'chest' && st.state === 'done' ? 'chest_open' : o.sprite];
        if (cell == null) continue;
        items.push({ key: o.id, url: itemsUrl, meta: itemsMeta, cell, x: o.x + 0.5, z: o.y + 0.75, size: (o.big ? 1.35 : 0.95) * 1.1,
            bob: st.state === 'ready' && o.sprite !== 'chest' && o.sprite !== 'mine' });
    }
    view.frame({ focus: { x: mx, z: mz }, actors, items, marks, beacon: trackedSpot(),
        route: auto?.path ? auto.path.map(([x, y]) => ({ x: x + 0.5, z: y + 0.5 })) : [] });
}

// ---------- HUD ----------
function renderHud() {
    if (!hud || !data) return;
    const w = data.wallet ?? {}, fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN');
    hud.innerHTML = `
    <div class="wd-top">
        <button class="cp-back-btn" data-wd-back>← Menu</button>
        <div class="wd-title"><b>🗺️ ${scene?.name ?? ''}</b><small>${data.player ? `${data.player.gender === 'f' ? '♀' : '♂'} ${data.player.name}` : ''}</small></div>
        <div class="wd-res"><span>🪙 ${fmt(w.gold)}</span><span>💎 ${fmt(w.diamond)}</span><span>🔷 ${fmt(w.stone)}</span></div>
        <div class="wd-btns">
            <button class="cp-back-btn" data-wd-stages>📖 Chọn ải</button>
            <button class="cp-back-btn" data-wd-gear>🎒 Trang bị</button>
            <button class="cp-back-btn" data-wd-extras>🏰 Hầm ngục</button>
            <button class="cp-back-btn" data-wd-map>🧭 Bản đồ</button>
        </div>
    </div>
    ${data.bag?.length ? `<div class="wd-bag">Đang mang: ${data.bag.map(b => `<b>${b.name}</b>`).join(', ')}</div>` : ''}
    ${toastMsg ? `<div class="wd-toast">${toastMsg}</div>` : ''}
    <div class="wd-help">Mũi tên / WASD: đi · bấm xuống đất: tự đi tới · A (E): nói chuyện / xem · B (Space): nhảy · J: nhiệm vụ</div>
    ${data.quests ? trackerHTML(trackedQuest()) : ""}
    ${dialog ? dialogHTML() : ''}
    ${puzzle ? puzzleHTML() : ''}
    ${mapOpen ? mapHTML() : ''}
    ${qlOpen ? questLogHTML(quests(), { tab: qlTab, sel: qlSel, tracked: trackedQuest()?.id ?? null }) : ''}`;
    // khung theo dõi nhiệm vụ nằm ngay dưới thanh trên cùng (thanh này xuống 2 dòng trên màn hẹp)
    const top = hud.querySelector('.wd-top'), trk = hud.querySelector('.ql-tracker');
    if (top && trk) trk.style.top = Math.round(top.getBoundingClientRect().bottom - root.getBoundingClientRect().top + 8) + 'px';
}
function dialogHTML() {
    const [who, text] = dialog.lines[dialog.i] ?? [];
    const name = who === 'npc' ? dialog.name : (dialog.speakers?.[who]?.name ?? '');
    return `<div class="wd-dialog" data-wd-next>
        ${name ? `<div class="wd-dlg-name">${name}</div>` : ''}
        <p>${text ?? ''}</p><span class="wd-dlg-next">${dialog.i >= dialog.lines.length - 1 ? '✕' : '▼'}</span>
    </div>`;
}
function puzzleHTML() {
    if (puzzle.kind === 'well') return `<div class="cp-confirm-backdrop"><div class="wd-puzzle" role="dialog">
        <h3>💧 Giếng Cổ</h3><p>Bốn phiến đá khắc biểu tượng. Bấm để xoay từng phiến, xếp theo một thứ tự nào đó…</p>
        <div class="wd-dials">${puzzle.state.map((v, i) => `<button class="wd-dial" data-wd-dial="${i}">${v}</button>`).join('')}</div>
        ${puzzle.msg ? `<p class="wd-pz-msg">${puzzle.msg}</p>` : ''}
        <div class="cp-confirm-actions"><button class="cp-btn-cancel" data-wd-pz-close>Rời đi</button><button class="cp-btn-confirm" data-wd-pz-try>Thử</button></div></div></div>`;
    return `<div class="cp-confirm-backdrop"><div class="wd-puzzle" role="dialog">
        <h3>📖 Trang sách bị xé</h3><p>Bấm 2 mảnh để đổi chỗ. Ở góc mỗi mảnh có số La Mã mờ.</p>
        <div class="wd-dials">${puzzle.state.map((v, i) => `<button class="wd-dial page${puzzle.pick === i ? ' picked' : ''}" data-wd-page="${i}"><small>${v}</small>📜</button>`).join('')}</div>
        ${puzzle.msg ? `<p class="wd-pz-msg">${puzzle.msg}</p>` : ''}
        <div class="cp-confirm-actions"><button class="cp-btn-cancel" data-wd-pz-close>Rời đi</button><button class="cp-btn-confirm" data-wd-pz-try>Ghép</button></div></div></div>`;
}
function mapHTML() {
    const areas = {};
    for (const s of Object.values(data.scenes)) (areas[s.area] ??= { name: s.areaName, list: [] }).list.push(s);
    return `<div class="cp-confirm-backdrop" data-wd-map-close><div class="wd-map" role="dialog">
        <h3>🧭 Bản đồ tộc Người</h3><p class="gr-hint">Bấm vào khu đã mở để dịch chuyển nhanh tới đó.</p>
        ${Object.values(areas).map(a => `<div class="wd-map-area"><b>${a.name}</b><div>${a.list.map(s =>
            `<button class="wd-map-scene${s.id === scene.id ? ' here' : ''}${s.open ? '' : ' locked'}" data-wd-travel="${s.id}" ${s.open ? '' : 'disabled'}>${s.open ? '' : '🔒 '}${s.name}${s.id === scene.id ? ' 📍' : ''}</button>`).join('')}</div>
            ${a.list[0].open ? '' : `<small>Mở khi qua ải ${a.list[0].needNo}</small>`}</div>`).join('')}
        <div class="wd-quality"><b>Đồ hoạ bản đồ</b><div>${[["auto", "🤖 Tự động"], ["high", "✨ Đẹp"], ["low", "⚡ Nhẹ"], ["2d", "🗺️ Phẳng 2D"]].map(([k, t]) => `<button class="wd-map-scene${quality === k ? " here" : ""}" data-wd-q="${k}">${t}</button>`).join("")}</div>
            <small>Tự động: đẹp nhất máy chạy mượt được · Nhẹ: điện thoại / máy yếu · Phẳng: bản đồ tranh vẽ cũ</small></div>
        <button class="cp-btn-cancel" data-wd-map-close>Đóng</button></div></div>`;
}
function toast(t) { toastMsg = t; toastAt = performance.now(); renderHud(); }
function nextLine() {
    if (dialog.i < dialog.lines.length - 1) { dialog.i++; renderHud(); return; }
    const after = dialog.after; dialog = null; renderHud();
    after?.();
}

// ---------- nhập liệu ----------
function onKey(e) {
    if (!open || e.target?.closest?.('input, textarea')) return;
    if (document.getElementById('story-screen')?.style.display === 'flex') return;   // đang xem hội thoại cốt truyện
    const d = KEY_DIR[e.key];
    if (d) { e.preventDefault(); if (!held.has(d)) { held.add(d); lastDir = d; tap(d); } return; }
    if (['e', 'E', 'Enter', 'z', 'Z'].includes(e.key)) { e.preventDefault(); pressA(); }
    if ([' ', 'x', 'X'].includes(e.key)) { e.preventDefault(); if (dialog) nextLine(); else pressB(); }
    if (e.key === 'j' || e.key === 'J') { e.preventDefault(); if (!dialog && !puzzle) { qlOpen = !qlOpen; mapOpen = false; renderHud(); } }
    if (e.key === 'Escape') { dialog = null; puzzle = null; mapOpen = false; qlOpen = false; cancelAuto(); renderHud(); }
}
function onHudClick(e) {
    const q = (s) => e.target.closest(s);
    if (q('[data-wd-back]')) { save(true); hideWorld(); onBack?.(); return; }
    if (q('[data-wd-stages]')) { save(true); onStages?.(); return; }
    if (q('[data-wd-gear]')) { save(true); onGear?.(); return; }
    if (q('[data-wd-extras]')) { save(true); onExtras?.(); return; }
    if (q('[data-wd-map]')) { mapOpen = true; renderHud(); return; }
    const wq = q('[data-wd-q]');
    if (wq) { quality = wq.dataset.wdQ; LS.set('wd_quality', quality); applyQuality(); renderHud(); return; }
    // sổ nhiệm vụ
    if (q('[data-ql-open]')) { qlOpen = true; mapOpen = false; qlSel = trackedQuest()?.id ?? null; renderHud(); return; }
    if (e.target.matches('[data-ql-close]') || q('button[data-ql-close]')) { qlOpen = false; renderHud(); return; }
    const qt = q('[data-ql-tab]'); if (qt) { qlTab = qt.dataset.qlTab; qlSel = null; renderHud(); return; }
    const qs = q('[data-ql-sel]'); if (qs) { qlSel = qs.dataset.qlSel; renderHud(); return; }
    const qk = q('[data-ql-track]'); if (qk) { tracked = qk.dataset.qlTrack; LS.set('wd_track', tracked); toast('📌 Đang theo dõi nhiệm vụ này'); return; }
    const qg = q('[data-ql-go]'); if (qg) { goQuest(qg.dataset.qlGo); return; }
    const tv = q('[data-wd-travel]');
    if (tv) {
        mapOpen = false;
        const id = tv.dataset.wdTravel, m = MAPS[id];
        if (id !== scene.id && m) { fade = 1; loadScene(id, m.spawn[0], m.spawn[1], 'down'); net.worldMove(id, me.x, me.y, me.face, true); }
        renderHud(); return;
    }
    if (e.target.matches('[data-wd-map-close]') || q('button[data-wd-map-close]')) { mapOpen = false; renderHud(); return; }
    if (q('[data-wd-next]')) { nextLine(); return; }
    if (q('[data-wd-pz-close]')) { puzzle = null; renderHud(); return; }
    const dial = q('[data-wd-dial]');
    if (dial) { const i = +dial.dataset.wdDial, sy = data.wellSymbols; puzzle.state[i] = sy[(sy.indexOf(puzzle.state[i]) + 1) % sy.length]; puzzle.msg = null; renderHud(); return; }
    const pg = q('[data-wd-page]');
    if (pg) {
        const i = +pg.dataset.wdPage;
        if (puzzle.pick == null) puzzle.pick = i; else { [puzzle.state[i], puzzle.state[puzzle.pick]] = [puzzle.state[puzzle.pick], puzzle.state[i]]; puzzle.pick = null; }
        puzzle.msg = null; renderHud(); return;
    }
    if (q('[data-wd-pz-try]') && !busy) { busy = true; net.worldInteract(scene.id, puzzle.kind === 'well' ? 'well' : 'pages', puzzle.state); }
}

// ---------- dữ liệu ----------
function loadScene(id, x, y, face) {
    scene = data.scenes[id];
    map = MAPS[id];
    me.x = x; me.y = y; me.face = face ?? me.face; me.moving = null; me.jump = null; queued = null;
    npcs = (map?.npcs ?? []).map(p => {
        const s = scene.npcs.find(n => n.id === p.id);
        return s ? { id: p.id, x: p.x, y: p.y, home: [p.x, p.y], face: p.face ?? 'down', def: s, hidden: s.hidden, mark: s.mark, moving: null, step: 0, nextAt: performance.now() + Math.random() * 2000 } : null;
    }).filter(Boolean);
    if (auto) { auto.path = null; auto.exitDir = null; }
    if (view && quality !== '2d') load3d(id);
    renderHud();
}
function save(force = false) {
    if (!scene || !open) return;
    const now = performance.now();
    if (!force && now - lastSave < 3000) return;
    lastSave = now;
    net.worldMove(scene.id, me.x, me.y, me.face);
}

// ---------- cốt truyện: tạo nhân vật -> mở màn -> tỉnh dậy ----------
let prologueOn = false, wakeShown = false, storyText = null;
function startPrologue() {
    prologueOn = true;
    hideWorld();
    document.body.classList.add('selecting-squad');
    playStory(storyText.intro.prologue, storyText.speakers, () => socket.emit('prologueStart'));
}
function onPrologueEnd() {
    const flash = document.createElement('div');
    flash.className = 'wd-flash';
    document.body.appendChild(flash);
    setTimeout(() => playStory(storyText.intro.sealed, storyText.speakers, () => { flash.remove(); prologueOn = false; showWorld(); }), 1600);
}
function showSetup() {
    const box = document.createElement('div');
    box.className = 'cp-confirm-backdrop wd-setup';
    let g = 'm', name = 'Kael';
    const portrait = (name) => sheet(name).url;
    const render = (msg = '') => {
        box.innerHTML = `<div class="wd-puzzle wd-setup-box" role="dialog">
            <h3>✴️ Bạn là ai?</h3><p>Chọn nhân vật chính và đặt tên — mọi người trong truyện sẽ gọi bạn theo đó.</p>
            <div class="wd-gender">
                ${[['m', 'Nam', 'hero_m'], ['f', 'Nữ', 'hero_f']].map(([k, t, s]) => `<button class="wd-g${g === k ? ' on' : ''}" data-g="${k}">
                    <span class="wd-g-face" style="background-image:url(${portrait(s)})"></span><b>${t}</b></button>`).join('')}
            </div>
            <input class="wd-name" maxlength="14" placeholder="Tên nhân vật (2–14 chữ)" value="${name.replace(/"/g, '')}">
            ${msg ? `<p class="wd-pz-msg">${msg}</p>` : ''}
            <div class="cp-confirm-actions"><button class="cp-btn-confirm" data-ok>Bắt đầu hành trình</button></div></div>`;
    };
    render();
    box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-g]');
        if (b) {
            const cur = box.querySelector('.wd-name').value;
            g = b.dataset.g;
            name = (cur === 'Kael' || cur === 'Lyss') ? (g === 'f' ? 'Lyss' : 'Kael') : cur;   // tên mặc định thì đổi theo giới tính
            render(); return;
        }
        if (e.target.closest('[data-ok]')) {
            name = box.querySelector('.wd-name').value.replace(/[<>{}"]/g, '').trim();
            if (name.length < 2) { render('Tên cần ít nhất 2 ký tự'); return; }
            socket.emit('playerSetup', { gender: g, name });
            box.remove();
        }
    });
    document.body.appendChild(box);
}
function applyState(d) {
    if (d.storyText) storyText = d.storyText;
    if (!d.player) { if (open && !document.querySelector('.wd-setup')) { hideWorld(); document.body.classList.add('selecting-squad'); showSetup(); } return; }
    if (d.story && !d.story.prologue) { if (!prologueOn) { open = true; startPrologue(); } return; }
    if (d.story && !d.story.wake && !wakeShown && open) {
        wakeShown = true;
        setTimeout(() => playStory(storyText.intro.wake, storyText.speakers, () => socket.emit('storyMark', { key: 'wake' })), 300);
    }
    const first = !data || !scene;
    data = d;
    if (first || scene.id !== d.scene) loadScene(d.scene, d.x, d.y, d.face);
    else {   // cập nhật trạng thái (dấu ! ?, đồ vật) mà không dịch vị trí
        scene = d.scenes[d.scene];
        for (const n of npcs) { const s = scene.npcs.find(q => q.id === n.id); if (s) { n.def = s; n.hidden = s.hidden; n.mark = s.mark; } }
        renderHud();
    }
}
function onResult(r) {
    busy = false;
    if (r.puzzle) { puzzle = { kind: r.puzzle, state: r.puzzle === 'well' ? ['💧', '⭐', '🌙', '☀️'] : ['III', 'I', 'IV', 'II'], pick: null, msg: null }; return renderHud(); }
    if (puzzle && !r.ok) { puzzle.msg = r.text; return renderHud(); }
    if (puzzle && r.ok) puzzle = null;
    if (r.lines) {
        const n = scene?.npcs.find(x => x.id === r.target);
        dialog = { name: n?.name ?? '', speakers: r.speakers, lines: [...r.lines, ...(r.text ? [['sys', `✨ ${r.text}`]] : [])], i: 0,
            after: r.startStage ? () => { save(true); onStage?.(r.startStage); } : null };
        return renderHud();
    }
    if (r.openStages) { save(true); return onStages?.(); }
    toast(r.ok ? `✨ ${r.text}` : `⚠️ ${r.text}`);
}

// ---------- mở / đóng ----------
export function showWorld({ stages, gear, back, extras, stage } = {}) {
    onStages = stages ?? onStages; onGear = gear ?? onGear; onBack = back ?? onBack; onExtras = extras ?? onExtras; onStage = stage ?? onStage;
    el().style.display = 'block';
    document.body.classList.add('selecting-squad', 'in-world');
    open = true;
    resize();
    held.clear();
    net.worldOpen();
    stopFrame(raf); last = 0;
    raf = nextFrame(frame);
}
export function hideWorld() {
    if (open && scene) save(true);
    open = false;
    stopFrame(raf);
    held.clear();
    if (root) root.style.display = 'none';
    document.body.classList.remove('in-world');
}
export const worldOpen = () => open;
// chỉ khi chạy thử (npm run dev): xem trạng thái bản đồ trong console — window.__wd
if (import.meta.env?.DEV) window.__wd = { get view() { return view; }, get auto() { return auto; }, get quests() { return quests(); }, me, get npcs() { return npcs; }, get busy() { return busy; }, get dialog() { return dialog; }, get scene() { return scene?.id; } };
export function setupWorld() {
    el();
    socket.on('worldState', applyState);
    socket.on('worldResult', onResult);
    socket.on('worldError', (d) => { busy = false; toast(`⚠️ ${d.text}`); });
    socket.on('prologueEnd', onPrologueEnd);
    socket.on('battleStart', hideWorld);
    socket.on('mainMenu', hideWorld);
}
