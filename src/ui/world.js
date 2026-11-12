// ============================================================
// 🗺️ BẢN ĐỒ THẾ GIỚI — kiểu Pokémon (Game Boy Advance): nhìn từ trên xuống, đi theo ô vuông
//   · Nhân vật chính (Nam / Nữ, người chơi chọn) đi 4 hướng: phím mũi tên / W A S D hoặc phím ảo; giữ để đi liên tục
//   · Nút A (E / Enter / Z): nói chuyện, xem đồ vật ở ô phía trước · Nút B (Space / X): nhảy (qua được vật cản mỏng 1 ô)
//   · Camera giữ nhân vật ở giữa màn, dừng ở mép bản đồ · NPC đứng / đi lại quanh chỗ của mình, quay mặt khi nói chuyện
//   · Bản đồ + vị trí NPC / đồ vật / lối ra: src/world/maps.js · Luật (rương, việc, sự kiện…): server (game/world.js)
// ============================================================
import { net, socket } from '../net/socket.js';
import { playStory, playCutscene, storyArt, setStoryGender, storyPlaying } from './story.js';
import { MAPS } from '../world/maps.js';
import { EXTRA, PATCH } from '../world/mapsExtra.js';
import { PAINT as PAINT3D } from '../world3d/assets.js';
import { presentationHTML } from './evidence.js';   // 🔎 đối chất trước nhà vua (ải 18)
for (const [id, list] of Object.entries(EXTRA)) for (const o of list) { const objs = MAPS[id]?.objects; if (!objs) continue; const i = objs.findIndex(x => x.id === o.id); if (i >= 0) objs[i] = o; else objs.push(o); }   // điểm truyện + vật điều tra (chương 1)
// 🧺 độ cao thêm (Đồi Gió, gờ đá mỏ) — maps.js không sinh lại được nên vá lúc nạp; bản đồ 3D đọc cùng MAPS này
for (const [id, p] of Object.entries(PATCH)) { const m = MAPS[id]; if (!m?.heights) continue; const rows = m.heights.map(r => [...r]); for (const [x, y, h] of p.heights ?? []) if (rows[y]?.[x] != null) rows[y][x] = String(h); m.heights = rows.map(r => r.join('')); }
import { softwareGL } from '../core/gpu.js';
import { mapAtlas, mapCell } from './itemIcons.js';
import { openCooking, openTools, cookingOpen } from './cooking.js';
import { openHeroPanel, heroPanelOpen } from './heroPanel.js';
import { icon } from './icons.js';
import { isWildTile, RATE as WILD_RATE, GRACE_STEPS } from '../world/wild.js';
import { trackerHTML, questLogHTML } from './questLog.js';
import '../styles/questlog.css';

const SHEETS = import.meta.glob('../assets/overworld/*.webp', { eager: true, import: 'default' });
const SHEET_META = import.meta.glob('../assets/overworld/*.json', { eager: true, import: 'default' });
const MAP_IMG = import.meta.glob('../assets/maps/*.webp', { eager: true, import: 'default' });
const ITEMS_IMG = import.meta.glob('../assets/overworld/items.webp', { eager: true, import: 'default' });
const ITEMS2_IMG = import.meta.glob('../assets/overworld/items2.webp', { eager: true, import: 'default' });

const DIRS = { down: [0, 1], left: [-1, 0], right: [1, 0], up: [0, -1] };
// MOVEMENT_RULES_BEGIN — luật thuần được kiểm tra độc lập.
export const tileHeight = (m,x,y) => Number(m.heights?.[y]?.[x] ?? 0);
export const isGap = (m,x,y) => (m.gaps??[]).some(p=>p[0]===x&&p[1]===y);
export const canWalkTile = (m,x,y,nx,ny) => m.grid[ny]?.[nx]==='.' && !isGap(m,nx,ny) && tileHeight(m,x,y)===tileHeight(m,nx,ny);
export function jumpTarget(m,x,y,dx,dy,running,blocked) {
    const h=tileHeight(m,x,y);
    const thin=(n)=> {
        const xx=x+dx*n, yy=y+dy*n;
        return m.grid[yy]?.[xx]!==undefined && !(m.noJump??[]).some(p=>p[0]===xx&&p[1]===yy)
            && (isGap(m,xx,yy)||m.grid[yy][xx]==='#');
    };
    const land=(n,up)=>!blocked(x+dx*n,y+dy*n)&&!isGap(m,x+dx*n,y+dy*n)&&tileHeight(m,x+dx*n,y+dy*n)<=h+up;
    if(running&&thin(1)&&thin(2)&&land(3,0)) return {tx:x+dx*3,ty:y+dy*3,cost:2};
    if(thin(1)&&land(2,0)) return {tx:x+dx*2,ty:y+dy*2,cost:1};
    if(land(1,1)) return {tx:x+dx,ty:y+dy,cost:1};
    return null;
}
export const runningReady=(steps,face,lastFace,now,lastAt)=>steps>=2&&face===lastFace&&now-lastAt<=250;
export function recoverStamina(s,now) {
    if(s.value>=5) { s.at=now; return; }
    const n=Math.floor((now-s.at)/1600);
    if(n>0) { s.value=Math.min(5,s.value+n); s.at+=n*1600; }
}
export function spendStamina(s,cost,now) {
    recoverStamina(s,now);
    if(s.value<cost) return false;
    if(s.value===5) s.at=now;
    s.value-=cost; return true;
}
// MOVEMENT_RULES_END
const stamina={value:5,at:0};
let runSteps=0, runFace=null, runAt=-Infinity, jumpQueued=false, staminaFlash=0;
function drawStamina(now) {
    const bar=root?.querySelector('.wd-stamina');
    if(!bar) return;
    bar.setAttribute('aria-valuenow',String(stamina.value));
    bar.setAttribute('aria-label',`Thể lực nhảy: ${stamina.value}/5`);
    bar.classList.toggle('empty',now<staminaFlash);
    [...bar.children].forEach((el,i)=>el.classList.toggle('filled',i<stamina.value));
}
const ROW = { down: 0, left: 1, right: 2, up: 3 };
const STEP_MS = 230;          // thời gian đi 1 ô
const JUMP_MS = 420;
const ITEM_CELL = { chest: 0, chest_open: 1, mine: 2, wheat: 3, mushroom: 4, hammer: 5, herb: 6, pages: 7, board: 8 };
// bộ vật thứ 2 (điểm truyện chương 1) — items2.webp 4x3 ô
const ITEM2_CELL = { bandage: 0, wolf_tracks: 1, smoke: 2, reeds: 3, wheel_tracks: 4, ash_arrows: 5, ledger: 6, archive_door: 7, stairs: 8, poster: 9, crate: 10, torch: 11 };
const NO_BOB = new Set(['board', 'poster', 'ledger', 'chest', 'mine', 'smoke', 'wolf_tracks', 'wheel_tracks', 'ash_arrows', 'archive_door', 'stairs', 'reeds', 'crate', 'torch']);
const noBob = (sprite) => NO_BOB.has(sprite) || !!sprite?.startsWith('i_');   // vật vẽ bằng code đứng yên (cây, đá, biển gỗ…); chỗ hái được có tia lấp lánh riêng
// ✨ vật đang hái / đọc được: điểm hái còn đồ (đủ dụng cụ), ghi chép chưa đọc
const sparkles = (st) => (st.type === 'node' && st.state === 'ready' && !st.lack) || (st.type === 'note' && st.unread);
let shakeObj = null;   // { id, at }: vật vừa bị gõ / rung (chặt cây, đập đá, rung táo)
const shakeOf = (id, now) => (shakeObj?.id === id && now - shakeObj.at < 260 ? Math.sin((now - shakeObj.at) / 22) * 0.07 : 0);
/** ảnh + ô của 1 vật: { url, meta, cell } (null nếu chưa có ảnh) */
function itemSrc(sprite, done) {
    if (sprite?.startsWith('i_')) { const a = mapAtlas(), cell = mapCell(sprite, done); return a && cell != null ? { url: a.url, meta: a.meta, cell } : null; }   // ảnh vẽ bằng code (src/ui/itemIcons.js)
    if (ITEM2_CELL[sprite] != null) {
        const url = Object.values(ITEMS2_IMG)[0], meta = SHEET_META['../assets/overworld/items2.json'];
        if (url && meta) return { url, meta, cell: ITEM2_CELL[sprite] };
    }
    const cell = ITEM_CELL[sprite === 'chest' && done ? 'chest_open' : sprite];
    const meta = SHEET_META['../assets/overworld/items.json'];
    return cell == null || !meta ? null : { url: Object.values(ITEMS_IMG)[0], meta, cell };
}
/** vật dạng người: 1 người (solo) hoặc nhóm 3 — mỗi phần tử [dx, dy, char?] (char riêng, VD sói đầu đàn + 2 sói thường) */
const groupOf = (o) => o.group ?? (o.solo ? [[0, 0]] : [[0, 0], [1, -1], [1, 1]]);

let root, canvas, ctx, hud, padEl;
let data = null, scene = null, map = null, open = false;
let onStages = null, onGear = null, onBack = null, onExtras = null, onStage = null, onWild = null;
const me = { x: 0, y: 0, h: 0, face: 'down', moving: null, jump: null, step: 0 };
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
// trình duyệt vẽ 3D bằng phần mềm (không dùng card đồ hoạ) -> chế độ Tự động dùng bản đồ phẳng 2D cho mượt
let softGL = false, softToast = false;
if (quality === 'auto' && softwareGL()) { softGL = true; quality = '2d'; }
let autoLevel = coarse() ? 'low' : 'high', autoToast = false;
const webglOK = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };
if (!webglOK()) quality = '2d';
let viewLoading = null;
// vẽ phẳng (tranh): chọn 🗺️ Phẳng 2D, hoặc đang ở TRONG NHÀ (phòng luôn vẽ tranh kiểu Pokémon)
const flat = () => quality === '2d' || (!!map?.interior && !map?.interior3d);
const use3d = () => !flat() && !!view;
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
    host3d.style.display = flat() ? 'none' : 'block';
    canvas.style.display = flat() ? 'block' : 'none';
    if (scene && !flat()) load3d(scene.id);
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
            if (from.has(k) || blocked(nx, ny) || !canWalkTile(map,x,y,nx,ny)) continue;
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
        return { stand: around(tiles).filter(([x,y])=>tileHeight(map,x,y)===tileHeight(map,o.x,o.y)), face: tiles };
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
    if (!path) { toast('Phải nhảy mới tới được'); return false; }
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
let qlOpen = false, qlTab = 'main', qlSel = null, tracked = LS.get('wd_track') || 'main';
// danh sách cho sổ + khung theo dõi: chính tuyến (kèm số bước, +20 Kim Cương mỗi bước) + phụ / nhánh / ẩn của bộ máy mới (qlog) + việc chương 2 kiểu cũ
const CH2_SIDE = new Set(['aeris', 'oren', 'moonwell', 'moon_fountain']);
function quests() {
    const legacy = data?.quests ?? [], ql = data?.qlog;
    if (!ql) return legacy;
    const main = legacy.find(q => q.type === 'main');
    const inCh1 = ql.main.i < ql.main.total;
    return [...(main ? [{ ...main, progress: inCh1 ? { have: ql.main.i, need: ql.main.total } : null,
        reward: inCh1 ? ql.main.reward ? `Bước này: ${ql.main.reward}` : 'Thưởng ải cốt truyện' : main.reward }] : []), ...ql.list, ...legacy.filter(q => CH2_SIDE.has(q.id))];
}
// màu dấu ! / ? theo loại nhiệm vụ: vàng chính tuyến · xanh lá phụ · tím nhánh
const MARK_COLOR = { main: '#facc15', side: '#4ade80', branch: '#c084fc' };
const markColor = (mk) => MARK_COLOR[mk] ?? '#facc15';
/** dấu trên đầu người đứng trên bản đồ (vật kiểu person của nhiệm vụ) */
const objMark = (o) => { const st = scene?.objects.find(q => q.id === o.id); return st?.state === 'ready' && st.mark ? st : null; };
function openQuestLog(tab) { qlOpen = true; mapOpen = false; if (tab) { qlTab = tab; qlSel = null; } else qlSel = trackedQuest()?.id ?? null; renderHud(); }
// ---------- dòng báo nhiệm vụ bay lên (+20 Kim Cương mỗi bước chính tuyến, xong nhiệm vụ, việc hôm nay…) ----------
const noteQueue = [];
/** Kim Cương nằm trong các dòng báo CHƯA hiện: chưa cộng vào con số trên màn hình (báo xong mới cộng) */
const pendingOf = (name) => noteQueue.reduce((s, n) => s + Number(new RegExp(`\\+(\\d+) ${name}`).exec(n.t ?? '')?.[1] ?? 0), 0);
let noteAt = 0;
function pumpNotes(now) {
    if (!noteQueue.length || now - noteAt < 1400 || dialog || puzzle || busy || storyPlaying() || heroPanelOpen()) return;
    noteAt = now;
    const n = noteQueue.shift(), fx = document.createElement('div');
    fx.className = `wd-float k-${n.k ?? 'info'}`;
    fx.textContent = n.t;
    root.appendChild(fx);
    setTimeout(() => fx.remove(), 3300);
    if (/\+\d+ (Kim Cương|Vàng)/.test(n.t ?? '')) {
        renderHud();
        if (/\+\d+ Kim Cương/.test(n.t)) hud?.querySelector('[data-wd-gem]')?.classList.add('wd-gem-pop');
        if (/\+\d+ Vàng/.test(n.t)) hud?.querySelector('[data-wd-gold]')?.classList.add('wd-gem-pop');
    }   // báo xong mới cộng số
}
function trackedQuest() {
    const list = quests();
    return list.find(q => q.id === tracked && (q.state === 'active' || q.state === 'offered')) ?? list.find(q => q.type === 'main' && q.state === 'active') ?? null;
}
function goQuest(id) {
    const q = quests().find(x => x.id === id);
    if (!q?.target) return toast('Nhiệm vụ này chưa có chỗ để đi tới');
    tracked = id; LS.set('wd_track', id);
    qlOpen = false; renderHud();
    startAuto({ scene: q.target.scene, kind: q.target.kind, id: q.target.id, x: q.target.x, y: q.target.y });
}
/** Vị trí (ô) của mục tiêu nhiệm vụ đang theo dõi nếu nằm trong bản đồ hiện tại */
function trackedSpot() {
    const t = trackedQuest()?.target;
    if (!t || t.scene !== scene?.id) return null;
    if (t.kind === 'npc') { const n = npcs.find(q => q.id === t.id && !q.hidden); return n ? npcPos(n) : null; }
    if (t.kind === 'tile') return { x: t.x + 0.5, z: t.y + 0.5 };
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
        <div class="wd-say" style="display:none"></div>
        <div class="wd-mini" title="Bản đồ thu nhỏ — bấm để mở bản đồ lớn (M)"><canvas></canvas><span class="wd-mini-name"></span></div>
        <div class="wd-pad" aria-label="Phím điều hướng">
            <button class="wd-dp up" data-dir="up" aria-label="Lên">▲</button>
            <button class="wd-dp left" data-dir="left" aria-label="Trái">◀</button>
            <button class="wd-dp right" data-dir="right" aria-label="Phải">▶</button>
            <button class="wd-dp down" data-dir="down" aria-label="Xuống">▼</button>
        </div>
        <div class="wd-ab"><span class="wd-stamina" role="meter" aria-valuemin="0" aria-valuemax="5"><i></i><i></i><i></i><i></i><i></i></span><button class="wd-btn-b" data-key="b" aria-label="Nhảy">B</button><button class="wd-btn-a" data-key="a" aria-label="Nói chuyện / xem">A</button></div>`;
    document.body.appendChild(root);
    canvas = root.querySelector('canvas');
    ctx = canvas.getContext('2d');
    hud = root.querySelector('.wd-hud');
    mini = root.querySelector('.wd-mini');
    sayEl = root.querySelector('.wd-say');
    miniCtx = mini.querySelector('canvas').getContext('2d');
    mini.addEventListener('click', () => doAction('map'));
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
    if (map.grid[y][x] !== '.' || isGap(map,x,y)) return true;
    if (!ignoreNpc && npcs.some(n => !n.hidden && n.x === x && n.y === y)) return true;
    if ((map.objects ?? []).some(o => o.solid && (o.char ? groupOf(o).some(([ox, oy]) => o.x + ox === x && o.y + oy === y) : o.x === x && o.y === y) && visibleObj(o))) return true;
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
    if (use3d()) draw3d(t); else if (flat()) draw(t);
    if (fadeEl) fadeEl.style.opacity = !flat() ? fade : 0;
    if (toastMsg && t - toastAt > 3500) { toastMsg = null; renderHud(); }
    if (t - miniAt > 120) { miniAt = t; drawMini(t); }
    pumpNotes(t);
    pumpBubbles(t);
    if (fishing && fishing.state !== 'done') { const bob = hud?.querySelector('.wd-fish-bob'); if (bob) bob.style.left = `${(fishing.state === 'run' ? fishPos(t) : fishing.stop ?? 0.5) * 100}%`; }
    // đứng yên: báo lại ô đang đứng vài giây một lần (server đo thời gian đứng yên cho nhiệm vụ) — tối đa 3 lần mỗi lần dừng
    if (scene && !me.moving && standSent < 3 && performance.now() - arriveAt > 4000 * (standSent + 1)) { standSent++; socket.emit('worldStand', { scene: scene.id, x: me.x, y: me.y }); }
}
let standSent = 0;
// ---------- 🗺️ bản đồ thu nhỏ (góc phải trên) ----------
let mini = null, miniCtx = null, miniAt = 0;
function drawMini(t) {
    if (!miniCtx || !map) return;
    const c = miniCtx.canvas, W = 176, H = Math.round(W * map.rows / map.cols);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const k = W / map.cols;
    miniCtx.imageSmoothingEnabled = true;
    const bg = img(MAP_IMG[`../assets/maps/${map.image}.webp`]);
    if (bg) miniCtx.drawImage(bg, 0, 0, W, H); else { miniCtx.fillStyle = '#1e293b'; miniCtx.fillRect(0, 0, W, H); }
    miniCtx.fillStyle = 'rgba(2, 6, 23, .25)'; miniCtx.fillRect(0, 0, W, H);
    const dot = (x, y, r, fill, stroke = '#0f172a') => { miniCtx.beginPath(); miniCtx.arc(x, y, r, 0, Math.PI * 2); miniCtx.fillStyle = fill; miniCtx.fill(); miniCtx.lineWidth = 1.5; miniCtx.strokeStyle = stroke; miniCtx.stroke(); };
    // lối ra (cửa / mép bản đồ)
    for (const e of map.exits ?? []) {
        const cells = e.tiles ?? (e.edge === 'left' ? [[0, (e.a + e.b) / 2]] : e.edge === 'right' ? [[map.cols - 1, (e.a + e.b) / 2]] : e.edge === 'up' ? [[(e.a + e.b) / 2, 0]] : [[(e.a + e.b) / 2, map.rows - 1]]);
        if (e.edge) { // mép: đánh dấu đoạn ô đi được thật ở mép
            const ys = [], xs = [];
            for (let i = e.a; i <= e.b; i++) {
                if (e.edge === 'left' && map.grid[i]?.[0] === '.') ys.push(i);
                if (e.edge === 'right' && map.grid[i]?.[map.cols - 1] === '.') ys.push(i);
                if (e.edge === 'up' && map.grid[0]?.[i] === '.') xs.push(i);
                if (e.edge === 'down' && map.grid[map.rows - 1]?.[i] === '.') xs.push(i);
            }
            if (ys.length) cells[0][1] = (ys[0] + ys[ys.length - 1]) / 2;
            if (xs.length) cells[0][0] = (xs[0] + xs[xs.length - 1]) / 2;
        }
        const [x, y] = cells[0];
        dot((x + 0.5) * k, (y + 0.5) * k, e.door ? 2.5 : 3.5, e.door ? '#fbbf24' : '#22d3ee');
    }
    for (const n of npcs) if (!n.hidden) dot((n.x + 0.5) * k, (n.y + 0.5) * k, n.mark ? 3.2 : 2.2, n.mark ? markColor(n.mk) : '#e2e8f0');
    for (const o of map.objects ?? []) { const st = o.char && objMark(o); if (st) dot((o.x + 0.5) * k, (o.y + 0.5) * k, 3.2, markColor(st.mk)); }   // người của nhiệm vụ
    const tg = trackedSpot();
    if (tg) { const r = 4 + Math.sin(t / 200) * 1.5; dot(tg.x * k, tg.z * k, r, 'rgba(250, 204, 21, .35)', '#facc15'); }
    // nhân vật chính: chấm đỏ + mũi chỉ hướng
    const px = (me.x + 0.5) * k, py = (me.y + 0.5) * k, [dx, dy] = DIRS[me.face] ?? [0, 1];
    miniCtx.beginPath(); miniCtx.moveTo(px + dx * 7, py + dy * 7); miniCtx.lineTo(px - dy * 4, py + dx * 4); miniCtx.lineTo(px + dy * 4, py - dx * 4); miniCtx.closePath();
    miniCtx.fillStyle = '#fff'; miniCtx.fill();
    dot(px, py, 3.6, '#ef4444', '#fff');
    const nm = mini.querySelector('.wd-mini-name');
    if (nm && nm.textContent !== (scene?.name ?? '')) nm.textContent = scene?.name ?? '';
}
function update(dt, now) {
    if (!map) return;
    fade = loading3d && !flat() ? 1 : Math.max(0, fade - dt / 300);
    recoverStamina(stamina,now); drawStamina(now);
    // đi / nhảy
    if (me.moving) {
        me.moving.t += dt;
        me.h=tileHeight(map,me.x,me.y)+(tileHeight(map,me.moving.tx,me.moving.ty)-tileHeight(map,me.x,me.y))*ease(me.moving);
        if (me.moving.t >= me.moving.dur) {
            if (!me.jump) { runSteps=runFace===me.face && now-runAt<=STEP_MS+250 ? runSteps+1 : 1; runFace=me.face; runAt=now; }
            me.x = me.moving.tx; me.y = me.moving.ty; me.moving = null; me.jump = null; me.climb = false;
            me.step++; arriveAt = performance.now(); standSent = 0;
            me.h=tileHeight(map,me.x,me.y);
            onArrive();
            if(jumpQueued) { jumpQueued=false; pressB(); }
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
        if (!canWalkTile(map,n.x,n.y,tx,ty) || blocked(tx, ty) || (tx === me.x && ty === me.y) || (me.moving && tx === me.moving.tx && ty === me.moving.ty)) continue;
        n.moving = { tx, ty, t: 0 };
    }
}
const canWalk = () => open && map && !me.moving && !dialog && !puzzle && !fishing && !mapOpen && !qlOpen && !busy && fade <= 0 && !heroPanelOpen() && !cookingOpen();
// bấm nhanh 1 cái: quay mặt (nếu đang nhìn hướng khác) hoặc đi 1 ô — không bị lỡ giữa 2 khung hình
let queued = null;   // bấm trong lúc đang bước: nhớ lại, bước xong đi tiếp
function tap(d) { cancelAuto(); if (canWalk()) { turnAt = 0; tryStep(d); } else if (me.moving && !me.jump) queued = d; }
function tryStep(d) {
    const now = performance.now();
    if(d!==runFace || now-runAt>250) runSteps=0;
    // đứng yên mà bấm hướng khác: chỉ quay mặt (giống Pokémon), giữ thêm chút mới đi
    if (me.face !== d && now - arriveAt > 60) { me.face = d; turnAt = now; return; }
    me.face = d;
    if (now - turnAt < 110) return;
    const [dx, dy] = DIRS[d], tx = me.x + dx, ty = me.y + dy;
    // lối ra ở mép bản đồ / ô cổng
    const exit = (map.exits ?? []).find(e => (e.tiles ?? []).some(([x, y]) => x === tx && y === ty) || (e.edge && edgeHit(e, tx, ty)));
    if (exit) return useExit(exit);
    if (blocked(tx, ty) || !canWalkTile(map,me.x,me.y,tx,ty)) { bump(); return; }
    me.moving = { tx, ty, t: 0, dur: STEP_MS };
}
let turnAt = 0, arriveAt = 0;
const edgeHit = (e, x, y) => (e.edge === 'left' && x < 0 && y >= e.a && y <= e.b) || (e.edge === 'right' && x >= map.cols && y >= e.a && y <= e.b)
    || (e.edge === 'up' && y < 0 && x >= e.a && x <= e.b) || (e.edge === 'down' && y >= map.rows && x >= e.a && x <= e.b);
let bumpAt = 0, trigLock = null;
function bump() { bumpAt = performance.now(); }
let saveTimer = 0;
// ---------- 🌾 cỏ cao: gặp quái hoang (src/world/wild.js · game/wild.js) ----------
let wildGrace = GRACE_STEPS, wildOff = LS.get('wd_wild') === 'off';
function wildCheck() {
    if (wildOff || !onWild || !data?.wild?.includes(scene?.id) || !isWildTile(scene.id, me.x, me.y)) return false;
    if (wildGrace > 0) { wildGrace--; return false; }
    if (Math.random() >= WILD_RATE) return false;
    cancelAuto(); held.clear(); queued = null; busy = true;
    const fx = document.createElement('div');
    fx.className = 'wd-encounter';
    fx.innerHTML = '<span>❗</span>';
    document.body.appendChild(fx);
    save(true);
    setTimeout(() => { fx.remove(); busy = false; onWild(scene.id); }, 900);
    return true;
}
function onArrive() {
    const exit=map.exits.find(e=>(e.tiles??[]).some(([x,y])=>x===me.x&&y===me.y));
    if(exit) { useExit(exit); return; }
    clearTimeout(saveTimer); saveTimer = setTimeout(() => save(true), 600);   // lưu vị trí ngay sau khi dừng bước
    if (wildCheck()) return;
    // bước vào ô sự kiện (đi qua là kích hoạt — như bụi cỏ Pokémon)
    const trig = (map.objects ?? []).find(o => o.trigger && o.trigger.some(([x, y]) => x === me.x && y === me.y) && visibleObj(o));
    if (!trig) { trigLock = null; return; }
    if (trigLock === trig.id) return;   // đã kích hoạt, phải ra khỏi vùng rồi vào lại
    trigLock = trig.id;
    { const st = scene.objects.find(s => s.id === trig.id); if (st?.state === 'ready') interactWith({ kind: 'obj', id: trig.id }); }
}
function useExit(exit) {
    const s = data.scenes[exit.scene];
    if (!s?.open) { toast(`🔒 ${s?.name ?? 'Khu này'} mở khi qua ${s?.needText ?? `ải ${s?.needNo ?? '?'}`}`); bump(); return; }
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
    if (fishing) return fishPull();
    if (puzzle || mapOpen || qlOpen || busy || me.moving || cookingOpen()) return;
    const [fx, fy] = front();
    if (tryClimb(fx, fy)) return;
    const n = npcs.find(q => !q.hidden && (q.moving ? q.moving.tx : q.x) === fx && (q.moving ? q.moving.ty : q.y) === fy);
    if (n) {
        n.face = { up: 'down', down: 'up', left: 'right', right: 'left' }[me.face];
        return interactWith({ kind: 'npc', id: n.id });
    }
    const o = (map.objects ?? []).find(q => (q.x === fx && q.y === fy || (q.area && q.area.some(([x, y]) => x === fx && y === fy))) && visibleObj(q));
    if (o && tileHeight(map,o.x,o.y)===tileHeight(map,me.x,me.y)) return interactWith({ kind: 'obj', id: o.id });
}
// ---------- 🧗 chỗ leo (vật kiểu 'climb' trong mapsExtra: "from" = ô đứng dưới chân) ----------
//   Đứng ở ô chân, quay mặt vào dây rồi bấm A: leo lên ô của dây (tốn 2 nấc thể lực nhảy). Đứng trên dây quay ra ô chân bấm A: tụt xuống (không tốn).
const CLIMB_MS = 900, CLIMB_COST = 2;
function tryClimb(fx, fy) {
    for (const o of map.objects ?? []) {
        if (!o.from || !visibleObj(o)) continue;
        const atFoot = o.from.some(([x, y]) => x === me.x && y === me.y), up = atFoot && o.x === fx && o.y === fy;
        const down = me.x === o.x && me.y === o.y && o.from.some(([x, y]) => x === fx && y === fy);
        if (!up && !down) continue;
        const [tx, ty] = up ? [o.x, o.y] : [fx, fy], now = performance.now();
        if (blocked(tx, ty)) { bump(); return true; }
        if (up && !spendStamina(stamina, CLIMB_COST, now)) { bump(); staminaFlash = now + 450; drawStamina(now); toast('Hết sức rồi, nghỉ một chút rồi leo'); return true; }
        cancelAuto();
        me.moving = { tx, ty, t: 0, dur: CLIMB_MS }; me.jump = true; me.climb = true; runSteps = 0; runFace = null; drawStamina(now);
        return true;
    }
    return false;
}
function pressB() {
    if(me.moving && !me.jump) { jumpQueued=true; return; }
    if (!canWalk()) return;
    cancelAuto();
    const now=performance.now(), [dx,dy]=DIRS[me.face];
    const target=jumpTarget(map,me.x,me.y,dx,dy,runningReady(runSteps,me.face,runFace,now,runAt),blocked);
    if(!target) { bump(); runSteps=0; return; }
    if(!spendStamina(stamina,target.cost,now)) { bump(); staminaFlash=now+450; drawStamina(now); return; }
    me.moving={tx:target.tx,ty:target.ty,t:0,dur:JUMP_MS}; me.jump=true;
    socket.emit('worldJump');   // việc hằng ngày "nhảy N lần"
    runSteps=0; runFace=null; drawStamina(now);
}
function interactWith({ kind, id }) {
    if (kind === 'obj') {
        const o = scene.objects.find(s => s.id === id);
        if (o?.type === 'stageBoard') { save(true); return onStages?.(); }
        if (o?.type === 'dailyBoard') return openQuestLog('daily');   // bảng "việc hôm nay" -> thẻ Hằng ngày
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
// ---------- ✨ tan pixel: quái / người trên bản đồ biến mất sau khi bị đánh bại ----------
//   vật dạng người (o.char) đang hiện mà vừa bị ẩn (thắng ải / sự kiện) -> vỡ thành ô pixel bay lên rồi mờ dần
const DISSOLVE_MS = 1100;
const dissolves = [];                 // { char, x, y, face, t0 }
const readySnap = new Map();          // 'scene:id' -> đang hiện
function snapObjects(allowFx) {
    if (!map || !scene) return;
    for (const o of map.objects ?? []) {
        if (!o.char) continue;
        const k = `${scene.id}:${o.id}`, on = visibleObj(o);
        if (allowFx && readySnap.get(k) && !on)   // chỉ kẻ địch mới tan (Sera, Grix… thì không) — o.foe: cả nhóm · o.foeChars: chỉ các con đó
            groupOf(o).forEach(([ox, oy, ch], i) => (o.foe ?? o.id === 'ambush' ? true : o.foeChars?.includes(ch ?? o.char)) && dissolves.push({ char: ch ?? o.char, x: o.x + ox, y: o.y + oy, face: o.face ?? 'left', delay: i * 120, t0: null }));   // t0 đặt ở khung hình đầu tiên bản đồ hiện (trận thắng xong state tới lúc bản đồ còn ẩn)
        readySnap.set(k, on);
    }
}
const blockRand = (i, j, seed) => { const v = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453; return v - Math.floor(v); };
/** 2D: khung đứng của nhân vật vỡ thành ô vuông — ô nào tới lượt thì bay lên + mờ */
function drawDissolve(d, now, S, cx, cy) {
    const p = (now - d.t0) / DISSOLVE_MS;
    if (p < 0) return drawChar(d.char, d.x * S - cx, d.y * S - cy, d.face, false, 0, 0, S);
    const { url, meta } = sheet(d.char), im = img(url);
    if (!im || !meta) return;
    const r = ROW[d.face] ?? 0, h = S * 1.35, w = h * meta.cw / meta.ch;
    const x0 = d.x * S - cx + S / 2 - w / 2, y0 = d.y * S - cy + S * 0.98 - h;
    const B = 8, k = w / meta.cw;           // ô 8 điểm ảnh gốc
    for (let j = 0; j * B < meta.ch; j++) for (let i = 0; i * B < meta.cw; i++) {
        const start = blockRand(i, j, d.x + d.y) * 0.55 + (1 - j * B / meta.ch) * 0.25;   // đầu tan trước, chân tan sau
        const q = (p - start) / 0.4;
        if (q >= 1) continue;
        const lift = q > 0 ? q * q * S * 1.1 : 0, drift = q > 0 ? (blockRand(j, i, 3) - 0.5) * q * S * 0.6 : 0;
        ctx.globalAlpha = q > 0 ? 1 - q : 1;
        ctx.drawImage(im, meta.cw + i * B, r * meta.ch + j * B, B, B, x0 + i * B * k + drift, y0 + j * B * k - lift, B * k + 0.5, B * k + 0.5);
        if (q > 0 && q < 0.5) { ctx.fillStyle = `rgba(255,240,190,${0.5 - q})`; ctx.fillRect(x0 + i * B * k + drift, y0 + j * B * k - lift, B * k, B * k); }
    }
    ctx.globalAlpha = 1;
}
/** 💬 bong bóng lời nói 1 dòng trên đầu NPC (bản đồ phẳng) */
function drawBubble(text, x, y, S) {
    ctx.font = `700 ${Math.max(11, Math.round(S * 0.26))}px Outfit, sans-serif`; ctx.textAlign = 'center';
    const w = ctx.measureText(text).width + S * 0.4, h = S * 0.5, x0 = Math.max(4, Math.min(canvas.width - w - 4, x - w / 2));
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = Math.max(1.5, S * 0.04);
    ctx.beginPath(); ctx.roundRect?.(x0, y - h, w, h, h * 0.35); if (!ctx.roundRect) ctx.rect(x0, y - h, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1e293b'; ctx.fillText(text, x0 + w / 2, y - h * 0.3);
}
/** dấu ! / ? nhấp nhô trên đầu (màu theo loại nhiệm vụ) */
function drawMark(txt, mk, x, y, S, now) {
    ctx.font = `900 ${Math.round(S * 0.6)}px Outfit, sans-serif`; ctx.textAlign = 'center';
    ctx.lineWidth = Math.max(2, S * 0.08); ctx.strokeStyle = '#1e293b'; ctx.fillStyle = markColor(mk);
    const yy = y - S * 0.55 + Math.sin(now / 250) * S * 0.08;
    ctx.strokeText(txt, x + S / 2, yy); ctx.fillText(txt, x + S / 2, yy);
}
function draw(now) {
    if (!ctx || !map) return;
    ctx.imageSmoothingEnabled = false;
    const { cx, cy, S } = cam();
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bg = img(MAP_IMG[`../assets/maps/${map.image}.webp`]);
    if (bg) ctx.drawImage(bg, -cx, -cy, map.cols * S, map.rows * S);
    for(let y=0;y<map.rows;y++) for(let x=0;x<map.cols;x++) {
        const h=tileHeight(map,x,y), gap=isGap(map,x,y);
        if(!h&&!gap) continue;
        ctx.fillStyle=gap?'#153d55':h===1?'rgba(240,210,140,.65)':h===2?'rgba(255,232,170,.8)':'rgba(214,198,170,.92)';
        ctx.fillRect(x*S-cx,y*S-cy,S,S);
        ctx.strokeStyle=gap?'#4388a8':'#8b663b'; ctx.strokeRect(x*S-cx,y*S-cy,S,S);
    }
    for(const [x,y] of map.stones??[]) { ctx.fillStyle='#b3b8b7'; ctx.fillRect(x*S-cx+3,y*S-cy+3,S-6,S-6); }
    const list = [];   // vẽ theo hàng (y) để vật ở dưới che vật ở trên
    for (const o of map.objects ?? []) {
        const st = scene.objects.find(s => s.id === o.id);
        if (!st || st.state === 'hidden') continue;
        if (o.char) {   // nhóm quái đứng chờ (sự kiện)
            if (st.state !== 'ready') continue;
            const idle = !!o.solo;   // người đứng yên (Grix, lính...) — không giậm chân
            for (const [k, [ox, oy, ch]] of groupOf(o).entries()) list.push({ y: o.y + oy, draw: () =>
                drawChar(ch ?? o.char, (o.x + ox) * S - cx, (o.y + oy) * S - cy, o.face ?? 'left', !idle && Math.floor(now / 400 + k) % 2 === 0, Math.floor(now / 400), 0, S) });
            if (st.mark) list.push({ y: o.y + 0.02, draw: () => drawMark(st.mark, st.mk, o.x * S - cx, o.y * S - cy, S, now) });
            continue;
        }
        if (!o.sprite) continue;
        list.push({ y: o.y, draw: () => {
            const src = itemSrc(o.sprite, st.state === 'done'), items = src && img(src.url);
            if (items) {
                const { meta, cell } = src;
                const sx = (cell % meta.cols) * meta.cw, sy = Math.floor(cell / meta.cols) * meta.ch;
                const k = (o.big ? 1.3 : 0.9) * S / meta.ch;
                const w = meta.cw * k, h = meta.ch * k;
                const bob = st.state === 'ready' && !noBob(o.sprite) ? Math.sin(now / 300) * S * 0.05 : 0;
                const ox = o.x * S - cx + S / 2 - w / 2 + shakeOf(o.id, now) * S, oy = o.y * S - cy + S - h + bob - tileHeight(map,o.x,o.y)*S*.35;
                ctx.drawImage(items, sx, sy, meta.cw, meta.ch, ox, oy, w, h);
                if (sparkles(st)) {   // ✨ tia lấp lánh: chỗ này hái / đọc được
                    const tw = (Math.sin(now / 180 + o.x * 1.7) + 1) / 2, r = S * (0.08 + tw * 0.1), px = o.x * S - cx + S * (0.72 + Math.sin(now / 700 + o.y) * 0.08), py = oy + h * 0.18;
                    ctx.fillStyle = `rgba(255,251,210,${0.45 + tw * 0.55})`;
                    ctx.fillRect(px - r, py - r * 0.25, r * 2, r * 0.5); ctx.fillRect(px - r * 0.25, py - r, r * 0.5, r * 2);
                }
            }
        } });
    }
    for (let i = dissolves.length - 1; i >= 0; i--) { const d = dissolves[i]; d.t0 ??= now + d.delay; if (now - d.t0 > DISSOLVE_MS) dissolves.splice(i, 1); }
    for (const d of dissolves) list.push({ y: d.y, draw: () => drawDissolve(d, now, S, cx, cy) });
    for (const n of npcs) {
        if (n.hidden) continue;
        const p = n.moving ? Math.min(1, n.moving.t / (STEP_MS * 1.6)) : 0;
        const x = (n.x + (n.moving ? (n.moving.tx - n.x) * p : 0)) * S - cx, y = (n.y + (n.moving ? (n.moving.ty - n.y) * p : 0)) * S - cy;
        list.push({ y: n.y + (n.moving ? (n.moving.ty - n.y) * p : 0), draw: () => {
            drawChar(n.def.art, x, y, n.face, !!n.moving && p > 0.25 && p < 0.75, n.step, 0, S);
            if (n.mark) drawMark(n.mark, n.mk, x, y, S, now);
        } });
    }
    const p = me.moving ? ease(me.moving) : 0;
    const mx = (me.x + (me.moving ? (me.moving.tx - me.x) * p : 0)) * S - cx, my = (me.y + (me.moving ? (me.moving.ty - me.y) * p : 0)) * S - cy;
    const lift = me.jump && !me.climb ? Math.sin(p * Math.PI) * S * 0.75 : 0;
    const shake = performance.now() - bumpAt < 150 ? Math.sin(performance.now() / 15) * S * 0.04 : 0;
    list.push({ y: me.y + (me.moving ? (me.moving.ty - me.y) * p : 0) + 0.01, draw: () =>
        drawChar(data.player?.gender === 'f' ? 'hero_f' : 'hero_m', mx + shake + (me.climb ? Math.sin(now / 60) * S * 0.03 : 0), my-me.h*S*.35, me.climb ? 'up' : me.face, me.climb ? true : !!me.moving && !me.jump && p > 0.2 && p < 0.8, me.climb ? Math.floor(now / 130) : me.step, lift, S) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.draw());
    if (bubble && now < bubble.until) {   // 💬 lời bâng quơ của dân làng
        const n = npcs.find(q => q.id === bubble.id && !q.hidden);
        if (n) { const q = npcPos(n); drawBubble(bubble.text, (q.x - 0.5) * S - cx + S / 2, (q.z - 0.5) * S - cy - S * 0.55, S); }
    }
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
    const actors = [{ key: 'me', url: hero.url, meta: hero.meta, x: mx + shake, z: mz, face: me.climb ? 'up' : me.face,
        col: me.climb ? (Math.floor(now / 130) % 2 ? 0 : 2) : (!!me.moving && !me.jump && p > 0.2 && p < 0.8) ? (me.step % 2 ? 0 : 2) : 1, h: me.h, lift: me.h*.35+(me.jump && !me.climb ? Math.sin(p * Math.PI) * 0.8 : 0) }];
    const marks = [];
    for (const n of npcs) {
        if (n.hidden) continue;
        const s = sheet(n.def.art), q = npcPos(n);
        actors.push({ key: 'npc:' + n.id, url: s.url, meta: s.meta, x: q.x, z: q.z, face: n.face, col: (!!n.moving && q.p > 0.25 && q.p < 0.75) ? (n.step % 2 ? 0 : 2) : 1 });
        if (n.mark) marks.push({ key: 'm:' + n.id, x: q.x, z: q.z, txt: n.mark, color: markColor(n.mk) });
    }
    const items = [];
    for (const o of map.objects ?? []) {
        const st = scene.objects.find(s => s.id === o.id);
        if (!st || st.state === 'hidden') continue;
        if (o.char) {   // nhóm quái đứng chờ (sự kiện)
            if (st.state !== 'ready') continue;
            groupOf(o).forEach(([ox, oy, ch], k) => { const g = sheet(ch ?? o.char); actors.push({ key: `ev:${o.id}:${k}`, url: g.url, meta: g.meta, x: o.x + ox + 0.5, z: o.y + oy + 0.5, face: o.face ?? 'left',
                col: o.solo ? 1 : Math.floor(now / 400 + k) % 2 === 0 ? 0 : 2 }); });
            if (st.mark) marks.push({ key: 'm:' + o.id, x: o.x + 0.5, z: o.y + 0.5, txt: st.mark, color: markColor(st.mk) });
            continue;
        }
        if (PAINT3D && (o.sprite === 'i_appletree' || o.sprite === 'i_oak')) {   // cây hái được đã là cây vẽ tay 3D (world3d/build.js): chỉ giữ tia lấp lánh khi hái được
            if (sparkles(st)) { const sp = itemSrc('i_spark'); if (sp) items.push({ key: o.id + ':sp', url: sp.url, meta: sp.meta, cell: sp.cell, x: o.x + 0.78, z: o.y + 0.8, size: 0.42 + Math.sin(now / 180 + o.x) * 0.12, bob: true }); }
            continue;
        }
        const src = o.sprite && itemSrc(o.sprite, st.state === 'done');
        if (!src) continue;
        items.push({ key: o.id, url: src.url, meta: src.meta, cell: src.cell, x: o.x + 0.5 + shakeOf(o.id, now), z: o.y + 0.75, size: (o.big ? 1.35 : 0.95) * 1.1,
            bob: st.state === 'ready' && !noBob(o.sprite) });
        if (sparkles(st)) { const sp = itemSrc('i_spark'); if (sp) items.push({ key: o.id + ':sp', url: sp.url, meta: sp.meta, cell: sp.cell, x: o.x + 0.78, z: o.y + 0.8, size: 0.42 + Math.sin(now / 180 + o.x) * 0.12, bob: true }); }
    }
    for (let i = dissolves.length - 1; i >= 0; i--) { const d = dissolves[i]; d.t0 ??= now + d.delay; if (now - d.t0 > DISSOLVE_MS) dissolves.splice(i, 1); }
    dissolves.forEach((d, i) => { const g = sheet(d.char);
        actors.push({ key: `dz:${d.char}:${d.x}:${d.y}:${d.t0}`, url: g.url, meta: g.meta, x: d.x + 0.5, z: d.y + 0.5, face: d.face, col: 1,
            dissolve: Math.max(0, (now - d.t0) / DISSOLVE_MS) }); });
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
        <div class="wd-res"><span data-wd-gold>${icon('gold', '🪙')} ${fmt(Math.max(0, (w.gold ?? 0) - pendingOf('Vàng')))}</span><span data-wd-gem>${icon('diamond', '💎')} ${fmt(Math.max(0, (w.diamond ?? 0) - pendingOf('Kim Cương')))}</span><span>${icon('stone', '🔷')} ${fmt(w.stone)}</span></div>
    </div>
    <div class="wd-bar" role="toolbar" aria-label="Chức năng">
        ${ACTIONS.map(([k, ic, t, key]) => `<button class="wd-act-btn" data-wd-act="${k}" title="${t}${key ? ` (phím ${key})` : ''}">${icon(`ui_${k}`, ic, 'wd-act-ic')}<small>${t}</small>${key ? `<kbd>${key}</kbd>` : ''}</button>`).join('')}
    </div>
    ${data.bag?.length ? `<div class="wd-bag">Đang mang: ${data.bag.map(b => `<b>${b.name}</b>`).join(', ')}</div>` : ''}
    ${toastMsg ? `<div class="wd-toast">${toastMsg}</div>` : ''}
    <div class="wd-help">Mũi tên / WASD: đi · bấm đất: tự đi · A (E): nói chuyện · B (Space): nhảy · C nhân vật · I túi · J nhiệm vụ · M bản đồ · Esc cài đặt</div>
    ${data.quests ? trackerHTML(trackedQuest(), data.qlog?.daily ?? null) : ""}
    ${dialog ? dialogHTML() : ''}
    ${puzzle ? puzzleHTML() : ''}
    ${mapOpen ? mapHTML() : ''}
    ${qlOpen ? questLogHTML(quests(), { tab: qlTab, sel: qlSel, tracked: trackedQuest()?.id ?? null, evidence: data?.evidence ?? null, qlog: data?.qlog ?? null, notebook: data?.notebook ?? null }) : ''}
    ${fishing ? fishHTML() : ''}`;
    // khung theo dõi nhiệm vụ nằm ngay dưới bản đồ thu nhỏ
    const trk = hud.querySelector('.ql-tracker');
    if (trk && mini) trk.style.top = Math.round(mini.getBoundingClientRect().bottom - root.getBoundingClientRect().top + 8) + 'px';
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
    if (puzzle.kind === 'present') return presentationHTML(puzzle, data?.speakers ?? {});
    if (puzzle.kind === 'well' || puzzle.kind === 'moon') return `<div class="cp-confirm-backdrop"><div class="wd-puzzle" role="dialog">
        ${puzzle.kind === 'moon' ? '<h3>🌙 Suối Trăng</h3><p>Bốn phiến đá quanh suối khắc các pha trăng. Bấm để xoay từng phiến…</p>'
            : '<h3>💧 Giếng Cổ</h3><p>Bốn phiến đá khắc biểu tượng. Bấm để xoay từng phiến, xếp theo một thứ tự nào đó…</p>'}
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
    for (const s of Object.values(data.scenes)) if (!s.interior) (areas[s.area] ??= { name: s.areaName, list: [] }).list.push(s);   // trong nhà: không dịch chuyển tới
    return `<div class="cp-confirm-backdrop" data-wd-map-close><div class="wd-map" role="dialog">
        <h3>🧭 Bản đồ tộc Người</h3><p class="gr-hint">Bấm vào khu đã mở để dịch chuyển nhanh tới đó.</p>
        ${Object.values(areas).map(a => `<div class="wd-map-area"><b>${a.name}</b><div>${a.list.map(s =>
            `<button class="wd-map-scene${s.id === scene.id ? ' here' : ''}${s.open ? '' : ' locked'}" data-wd-travel="${s.id}" ${s.open ? '' : 'disabled'}>${s.open ? '' : '🔒 '}${s.name}${s.id === scene.id ? ' 📍' : ''}</button>`).join('')}</div>
            ${a.list[0].open ? '' : `<small>Mở khi qua ải ${a.list[0].needNo}</small>`}</div>`).join('')}
        <div class="wd-quality"><b>Đồ hoạ bản đồ</b><div>${[["auto", "🤖 Tự động"], ["high", "✨ Đẹp"], ["low", "⚡ Nhẹ"], ["2d", "🗺️ Phẳng 2D"]].map(([k, t]) => `<button class="wd-map-scene${quality === k ? " here" : ""}" data-wd-q="${k}">${t}</button>`).join("")}</div>
            <small>Tự động: đẹp nhất máy chạy mượt được · Nhẹ: điện thoại / máy yếu · Phẳng: bản đồ tranh vẽ cũ</small></div>
        <div class="wd-quality"><b>🌾 Gặp quái ở cỏ cao</b><div>${[['on', 'Bật'], ['off', 'Tắt']].map(([k, t]) => `<button class="wd-map-scene${(wildOff ? 'off' : 'on') === k ? ' here' : ''}" data-wd-wild="${k}">${t}</button>`).join('')}</div>
            <small>Ruộng lúa Ngoại ô, bãi cỏ Rừng Sương, cỏ ven Đường Vương Đạo · không tốn thể lực · mở sau ải 1</small></div>
        <button class="cp-btn-cancel" data-wd-map-close>Đóng</button></div></div>`;
}
// ---------- 🎣 câu cá: phao chạy qua lại trên thanh, bấm A / nút Giật đúng lúc phao ở vạch xanh ----------
//   fishing = { id, left, speed, zone, t0, state: 'run' | 'wait' | 'done', msg }
let fishing = null;
const fishPos = (now) => { const p = ((now - fishing.t0) / 1000 * 0.85 * fishing.speed) % 2; return p <= 1 ? p : 2 - p; };   // 0..1 chạy qua lại
function fishHTML() {
    const z = fishing.zone * 100;
    return `<div class="cp-confirm-backdrop"><div class="wd-puzzle wd-fish" role="dialog">
        <h3>🎣 Câu cá</h3><p>Bấm <b>Giật!</b> (phím A / E) khi phao đỏ nằm trong vạch xanh. Còn <b>${fishing.left}</b> lượt hôm nay.</p>
        <div class="wd-fish-bar"><span class="wd-fish-zone" style="left:${50 - z / 2}%;width:${z}%"></span><span class="wd-fish-best" style="left:${50 - z / 6}%;width:${z / 3}%"></span><i class="wd-fish-bob"></i></div>
        ${fishing.msg ? `<p class="wd-pz-msg">${fishing.msg}</p>` : ''}
        <div class="cp-confirm-actions"><button class="cp-btn-cancel" data-wd-fish-close>Thu cần</button>
            ${fishing.state === 'done' ? '' : `<button class="cp-btn-confirm" data-wd-fish-pull ${fishing.state === 'wait' ? 'disabled' : ''}>${fishing.state === 'again' ? 'Quăng tiếp' : 'Giật!'}</button>`}</div></div></div>`;
}
function fishPull() {
    if (!fishing || fishing.state === 'wait' || fishing.state === 'done') return;
    if (fishing.state === 'again') { fishing.state = 'run'; fishing.t0 = performance.now(); fishing.msg = null; return renderHud(); }
    const d = Math.abs(fishPos(performance.now()) - 0.5);
    fishing.state = 'wait'; fishing.stop = fishPos(performance.now());
    socket.emit('worldFish', { scene: scene.id, target: fishing.id, quality: d <= fishing.zone / 6 ? 'perfect' : d <= fishing.zone / 2 ? 'good' : 'miss' });
    renderHud();
}
function onFishResult(r) {
    if (!fishing) return;
    if (!r.ok) { fishing.state = 'done'; fishing.msg = `⚠️ ${r.text}`; return renderHud(); }
    fishing.left = r.left; fishing.msg = `${r.rare ? '🌟 ' : Object.keys(r.got ?? {}).length ? '🐟 ' : '💦 '}${r.text}`;
    fishing.state = r.left > 0 ? 'again' : 'done';
    if (fishing.state === 'done') fishing.msg += ' Hết lượt câu ở đây hôm nay.';
    renderHud();
}
// ---------- 💬 lời bâng quơ của dân làng: đi ngang (cách ≤ 2 ô) thì thỉnh thoảng nói 1 câu ----------
let bubble = null, bubbleCheck = 0, sayEl = null;
function pumpBubbles(now) {
    if (bubble && now >= bubble.until) { bubble = null; if (sayEl) sayEl.style.display = 'none'; }
    if (now - bubbleCheck < 900 || bubble || dialog || puzzle || fishing || busy) return;
    bubbleCheck = now;
    const near = npcs.filter(n => !n.hidden && n.def.say?.length && Math.max(Math.abs(n.x - me.x), Math.abs(n.y - me.y)) <= 2 && now - (n.saidAt ?? -1e9) > 25000);
    if (!near.length) return;
    const n = near[Math.floor(Math.random() * near.length)];
    n.saidAt = now; n.sayIdx = ((n.sayIdx ?? Math.floor(Math.random() * n.def.say.length)) + 1) % n.def.say.length;
    bubble = { id: n.id, text: n.def.say[n.sayIdx], until: now + 3600 };
    if (sayEl) { sayEl.textContent = `💬 ${n.def.name}: ${bubble.text}`; sayEl.style.display = 'block'; }
}
function toast(t) { toastMsg = t; toastAt = performance.now(); renderHud(); }
function nextLine() {
    if (dialog.i < dialog.lines.length - 1) { dialog.i++; renderHud(); return; }
    const after = dialog.after; dialog = null; renderHud();
    after?.();
}

// ---------- nhập liệu ----------
// thanh chức năng dưới màn hình: [mã, biểu tượng, tên, phím tắt]
const ACTIONS = [['stages', '📖', 'Chọn ải', ''], ['hero', '🧑', 'Nhân vật', 'C'], ['bag', '🎒', 'Túi đồ', 'I'], ['forge', '⚒️', 'Rèn', ''],
    ['shop', '🏪', 'Cửa hàng', ''], ['extras', '🏰', 'Hầm ngục', ''], ['quests', '📜', 'Nhiệm vụ', 'J'], ['map', '🧭', 'Bản đồ', 'M'], ['settings', '⚙️', 'Cài đặt', 'O']];
function panel(tab) {
    held.clear(); cancelAuto(); save(true);
    openHeroPanel(tab, {
        onClose: () => { net.worldOpen(); renderHud(); },   // cập nhật ví sau khi mua bán
        gear: () => { save(true); onGear?.(); }, forge: () => { save(true); onGear?.(); },
        heroshop: () => { save(true); onExtras?.('shop'); }, tavern: () => { save(true); onExtras?.('tavern'); },
        quality: () => (softGL && quality === '2d' && !LS.get('wd_quality') ? 'auto' : quality),
        setQuality: (q) => { quality = q; LS.set('wd_quality', q); applyQuality(); },
        wild: () => !wildOff, setWild: (on) => { wildOff = !on; LS.set('wd_wild', on ? 'on' : 'off'); },
    });
}
function doAction(k) {
    if (k === 'stages') { save(true); return onStages?.(); }
    if (k === 'hero' || k === 'bag' || k === 'shop' || k === 'settings') return panel(k);
    if (k === 'forge') { save(true); return onGear?.(); }
    if (k === 'extras') { save(true); return onExtras?.(); }
    if (k === 'quests') { if (qlOpen) { qlOpen = false; return renderHud(); } return openQuestLog(); }
    if (k === 'map') { mapOpen = !mapOpen; qlOpen = false; return renderHud(); }
}
const ACTION_KEYS = { c: 'hero', i: 'bag', m: 'map', o: 'settings' };
function onKey(e) {
    if (!open || e.target?.closest?.('input, textarea')) return;
    if (heroPanelOpen() || cookingOpen()) return;   // đang mở bảng Nhân vật / Túi / Cửa hàng / Cài đặt / Nấu ăn
    if (fishing) { if (['e', 'E', 'Enter', 'z', 'Z', ' '].includes(e.key)) { e.preventDefault(); fishPull(); } else if (e.key === 'Escape') { fishing = null; renderHud(); } return; }
    if (document.getElementById('story-screen')?.style.display === 'flex') return;   // đang xem hội thoại cốt truyện
    const d = KEY_DIR[e.key];
    if (d) { e.preventDefault(); if (!held.has(d)) { held.add(d); lastDir = d; tap(d); } return; }
    if (['e', 'E', 'Enter', 'z', 'Z'].includes(e.key)) { e.preventDefault(); pressA(); }
    if ([' ', 'x', 'X'].includes(e.key)) { e.preventDefault(); if (dialog) nextLine(); else pressB(); }
    if (e.key === 'j' || e.key === 'J') { e.preventDefault(); if (!dialog && !puzzle) { qlOpen = !qlOpen; mapOpen = false; renderHud(); } }
    const act = ACTION_KEYS[e.key?.toLowerCase?.()];
    if (act && !dialog && !puzzle) { e.preventDefault(); doAction(act); return; }
    if (e.key === 'Escape') {
        if (!dialog && !puzzle && !mapOpen && !qlOpen) { panel('settings'); return; }
        dialog = null; puzzle = null; mapOpen = false; qlOpen = false; cancelAuto(); renderHud();
    }
}
function onHudClick(e) {
    const q = (s) => e.target.closest(s);
    const act = q('[data-wd-act]');
    if (act) { doAction(act.dataset.wdAct); return; }
    if (q('[data-wd-back]')) { save(true); hideWorld(); onBack?.(); return; }
    if (q('[data-wd-stages]')) { save(true); onStages?.(); return; }
    if (q('[data-wd-gear]')) { save(true); onGear?.(); return; }
    if (q('[data-wd-extras]')) { save(true); onExtras?.(); return; }
    if (q('[data-wd-map]')) { mapOpen = true; renderHud(); return; }
    const ww = q('[data-wd-wild]');
    if (ww) { wildOff = ww.dataset.wdWild === 'off'; LS.set('wd_wild', wildOff ? 'off' : 'on'); renderHud(); return; }
    const wq = q('[data-wd-q]');
    if (wq) { quality = wq.dataset.wdQ; LS.set('wd_quality', quality); applyQuality(); renderHud(); return; }
    // sổ nhiệm vụ
    if (q('[data-ql-daily]')) { openQuestLog('daily'); return; }
    if (q('[data-ql-open]')) { const t = trackedQuest(); if (t && ['main', 'side', 'branch', 'hidden'].includes(t.type)) qlTab = t.type; openQuestLog(); return; }
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
    if (q('[data-wd-fish-close]')) { fishing = null; renderHud(); return; }
    if (q('[data-wd-fish-pull]')) { fishPull(); return; }
    // 🔎 đối chất trước nhà vua
    if (puzzle?.kind === 'present') {
        const qb = q('[data-ev-q]'), pk = q('[data-ev-pick]');
        if (qb) { puzzle.active = puzzle.active === qb.dataset.evQ ? null : qb.dataset.evQ; renderHud(); return; }
        if (pk && puzzle.active) {
            puzzle.answers[puzzle.active] = pk.dataset.evPick;
            puzzle.active = puzzle.questions.find(x => !puzzle.answers[x.id])?.id ?? null;   // tự chuyển sang câu chưa trả lời
            renderHud(); return;
        }
        if (q('[data-ev-cancel]')) { puzzle = null; renderHud(); return; }
        if (q('[data-ev-submit]') && !busy) { busy = true; socket.emit('worldPresent', { answers: puzzle.answers }); return; }
        if (q('[data-ev-continue]')) {
            const nx = puzzle.next; puzzle = null;
            dialog = { name: '', speakers: nx.speakers, lines: nx.tail, i: 0, after: () => { save(true); onStage?.(nx.startStage); } };
            renderHud(); return;
        }
    }
    const dial = q('[data-wd-dial]');
    if (dial) { const i = +dial.dataset.wdDial, sy = puzzle.kind === 'moon' ? data.moonSymbols : data.wellSymbols; puzzle.state[i] = sy[(sy.indexOf(puzzle.state[i]) + 1) % sy.length]; puzzle.msg = null; renderHud(); return; }
    const pg = q('[data-wd-page]');
    if (pg) {
        const i = +pg.dataset.wdPage;
        if (puzzle.pick == null) puzzle.pick = i; else { [puzzle.state[i], puzzle.state[puzzle.pick]] = [puzzle.state[puzzle.pick], puzzle.state[i]]; puzzle.pick = null; }
        puzzle.msg = null; renderHud(); return;
    }
    if (q('[data-wd-pz-try]') && !busy) { busy = true; net.worldInteract(scene.id, { well: 'well', pages: 'pages', moon: 'moonwell' }[puzzle.kind], puzzle.state); }
}

// ---------- dữ liệu ----------
function loadScene(id, x, y, face) {
    scene = data.scenes[id];
    map = MAPS[id];
    // Save cũ / phản hồi mạng không được đặt người chơi vào ô chặn.
    if (!Number.isInteger(x) || !Number.isInteger(y) || map.grid[y]?.[x] !== '.') [x, y] = map.spawn;
    me.x = x; me.y = y; me.h=tileHeight(map,x,y); runSteps=0; runFace=null; jumpQueued=false; me.face = face ?? me.face; me.moving = null; me.jump = null; queued = null;
    npcs = (map?.npcs ?? []).map(p => {
        const s = scene.npcs.find(n => n.id === p.id);
        return s ? { id: p.id, x: p.x, y: p.y, home: [p.x, p.y], face: p.face ?? 'down', def: s, hidden: s.hidden, mark: s.mark, mk: s.mk, moving: null, step: 0, nextAt: performance.now() + Math.random() * 2000 } : null;
    }).filter(Boolean);
    if (auto) { auto.path = null; auto.exitDir = null; }
    standSent = 0; arriveAt = performance.now();
    snapObjects(false);
    wildGrace = GRACE_STEPS;
    if (host3d && canvas) { host3d.style.display = flat() ? 'none' : 'block'; canvas.style.display = flat() ? 'block' : 'none'; }
    if (view && !flat()) load3d(id); else loading3d = false;
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
    // giấc mơ mở đầu (không còn trận "Đấu Thần" — cách bấm kỹ năng dạy ở ải 1); nền tối kín: không lộ màn Test phía sau
    playStory(storyText.intro.prologue, storyText.speakers, () => { socket.emit('storyMark', { key: 'prologue' }); onPrologueEnd(); }, { bg: 'dark' });
}
function onPrologueEnd() {
    const flash = document.createElement('div');
    flash.className = 'wd-flash';
    document.body.appendChild(flash);
    setTimeout(() => playStory(storyText.intro.sealed, storyText.speakers, () => { flash.remove(); prologueOn = false; document.body.classList.remove('selecting-squad'); showWorld(); }, { bg: 'dark' }), 1600);
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
        setTimeout(() => playStory(storyText.intro.wake, storyText.speakers, () => socket.emit('storyMark', { key: 'wake' }), storyArt('c1_wake') ? { bg: storyArt('c1_wake') } : {}), 300);
    }
    const first = !data || !scene;
    const teleported = data && d.teleportVersion !== data.teleportVersion;
    if (d.notes?.length) noteQueue.push(...d.notes);   // dòng báo nhiệm vụ (bay lên sau khi hội thoại đóng)
    data = d;
    setStoryGender(d.player?.gender);   // tranh truyện có nhân vật chính: chọn bản nam / nữ
    if (first || teleported || scene.id !== d.scene) loadScene(d.scene, d.x, d.y, d.face);
    else {   // cập nhật trạng thái (dấu ! ?, đồ vật) mà không dịch vị trí
        scene = d.scenes[d.scene];
        for (const n of npcs) { const s = scene.npcs.find(q => q.id === n.id); if (s) { n.def = s; n.hidden = s.hidden; n.mark = s.mark; n.mk = s.mk; } }
        snapObjects(true);
        renderHud();
    }
}
function onResult(r) {
    busy = false;
    if (r.puzzle) { puzzle = { kind: r.puzzle, state: { well: ['💧', '⭐', '🌙', '☀️'], moon: ['🌕', '🌑', '🌓', '🌒'] }[r.puzzle] ?? ['III', 'I', 'IV', 'II'], pick: null, msg: null }; return renderHud(); }
    if (puzzle && !r.ok) { puzzle.msg = r.text; return renderHud(); }
    if (puzzle && r.ok) puzzle = null;
    if (r.lines && r.cutscene?.length) {   // về báo lại kiểu cắt cảnh (kết chương 1: phòng bệnh nhà vua…)
        busy = true;
        playCutscene(r.lines, r.cutscene, r.speakers, () => { busy = false; renderHud(); });
        return;
    }
    if (r.openDaily) return openQuestLog('daily');
    // 🧺 điểm hái / chặt / đập: rung vật; chưa xong thì chỉ báo còn mấy lần · chỗ câu cá: mở thanh câu · bếp / bàn dụng cụ: mở bảng
    if (r.ok && (r.hit || r.done)) shakeObj = { id: r.target, at: performance.now() };
    if (r.ok && r.hit) return toast(`🪓 ${r.text}`);
    if (r.ok && r.fishing) { fishing = { ...r.fishing, t0: performance.now(), state: 'run', msg: null }; held.clear(); return renderHud(); }
    if (r.open === 'cook') { held.clear(); cancelAuto(); return openCooking({ kitchen: !!r.kitchen, onClose: () => { net.worldOpen(); renderHud(); } }); }
    if (r.open === 'tools') { held.clear(); cancelAuto(); return openTools({ onClose: () => { net.worldOpen(); renderHud(); } }); }
    if (r.lines && r.story) {   // nhận / trả nhiệm vụ: khung truyện (playStory) rồi dòng thưởng bay lên
        busy = true;
        playStory(r.lines, r.speakers, () => { busy = false; renderHud(); });
        return;
    }
    if (r.lines) {
        const n = scene?.npcs.find(x => x.id === r.target);
        dialog = { name: r.npcName ?? n?.name ?? '', speakers: r.speakers, lines: [...r.lines, ...(r.text && !r.quest ? [['sys', `✨ ${r.text}`]] : [])], i: 0,
            after: r.startStage ? () => { save(true); onStage?.(r.startStage); }
                : r.present ? () => { puzzle = { kind: 'present', ...r.present }; renderHud(); } : null };   // Elise: lời mở đầu -> khung đối chất
        return renderHud();
    }
    if (r.openStages) { save(true); return onStages?.(); }
    if (r.open === 'tavern') { save(true); return onExtras?.('tavern'); }   // quầy quán -> 🍲 Quán ăn
    if (r.open === 'gear') { save(true); return onGear?.(); }               // đe rèn -> 🎒 Trang bị / Lò rèn
    toast(r.ok ? `✨ ${r.text}` : `⚠️ ${r.text}`);
}

// ---------- mở / đóng ----------
export function showWorld({ stages, gear, back, extras, stage, wild } = {}) {
    onStages = stages ?? onStages; onGear = gear ?? onGear; onBack = back ?? onBack; onExtras = extras ?? onExtras; onStage = stage ?? onStage; onWild = wild ?? onWild;
    wildGrace = GRACE_STEPS; busy = false;
    if (softGL && !softToast) { softToast = true; setTimeout(() => toast('⚠️ Trình duyệt chưa dùng card đồ hoạ → đang dùng bản đồ phẳng 2D cho mượt. Bật “Tăng tốc phần cứng” trong cài đặt trình duyệt rồi mở lại để chơi bản đồ 3D.'), 800); }
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
if (import.meta.env?.DEV) window.__wd = { get view() { return view; }, get auto() { return auto; }, get quests() { return quests(); }, me, get npcs() { return npcs; }, get busy() { return busy; }, get dialog() { return dialog; }, get scene() { return scene?.id; }, get dissolves() { return dissolves; }, get fishing() { return fishing; }, get data() { return data; }, get map() { return map; } };
export function setupWorld() {
    el();
    socket.on('worldState', applyState);
    socket.on('worldResult', onResult);
    socket.on('worldPresentResult', (r) => {   // chấm xong -> hiện điểm + lời nhà vua / Valdric, rồi phần còn lại của cảnh đại sảnh -> Bảng ải 18
        busy = false;
        if (puzzle?.kind !== 'present') return;
        puzzle.result = r.result;
        puzzle.rewardText = r.result.first ? r.text : null;
        puzzle.next = { speakers: r.speakers, tail: r.lines.slice(r.result.lines.length), startStage: r.startStage };
        renderHud();
    });
    socket.on('worldError', (d) => { busy = false; toast(`⚠️ ${d.text}`); });
    socket.on('worldFishResult', onFishResult);
    socket.on('prologueEnd', onPrologueEnd);
    socket.on('battleStart', hideWorld);
    socket.on('mainMenu', hideWorld);
}
