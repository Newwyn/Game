// ============================================================
// 🗺️ BẢN ĐỒ THẾ GIỚI (P3) — màn ngang kiểu MapleStory
//   · Đội (người dẫn + đồng đội đi theo) đi trái / phải, đổi màn qua cổng, nói chuyện NPC, mở rương, đào mỏ, nhặt vật nhiệm vụ
//   · Câu đố Giếng Cổ (xoay 4 biểu tượng theo bài đồng dao) và Trang sách bị xé (đổi chỗ 4 mảnh)
//   · Điều khiển: ← → (A D) đi · ↑ / E / Space tương tác · bấm chuột / chạm vào nền để đi tới, vào NPC / vật để tới rồi tương tác
//   · Server giữ luật (game/world.js); client chỉ vẽ + gửi vị trí / tương tác
// ============================================================
import { net, socket } from '../net/socket.js';
import { playStory } from './story.js';
import rokImg from '../assets/sprites/rok_sprite.webp';
import rokMeta from '../characters/sprite/rokSprite.json';
import jesImg from '../assets/sprites/jessica_sprite.webp';
import jesMeta from '../characters/sprite/jessicaSprite.json';
import seraImg from '../assets/sprites/seraphine_sprite.webp';
import seraMeta from '../characters/sprite/seraphineSprite.json';
import lyraImg from '../assets/sprites/lyra_sprite.webp';
import lyraMeta from '../characters/sprite/lyraSprite.json';

const ART = import.meta.glob('../assets/world/*.webp', { eager: true, import: 'default' });
const artUrl = (name) => ART[`../assets/world/${name}.webp`] ?? null;
const HEROES = { warrior: [rokImg, rokMeta], assassin: [jesImg, jesMeta], priest: [seraImg, seraMeta], archer: [lyraImg, lyraMeta] };
const PARTY_ORDER = ['warrior', 'assassin', 'priest', 'archer'];

const BASE_H = 768;          // chiều cao chuẩn của màn (đơn vị thế giới)
const GROUND = 0.885;        // mặt đất ở 88,5% chiều cao
const SPEED = 420;           // đơn vị / giây
const REACH = 110;           // khoảng cách tương tác
const HERO_H = 215;          // chiều cao Rok khi vẽ (đơn vị thế giới)
const GAP = 105;             // khoảng cách giữa các thành viên trong đội
const AREA_SKY = { village: ['#fcd9a0', '#f6a96b'], outskirts: ['#bfe3ff', '#9fd18b'], road: ['#c9d9f2', '#8fb07a'], capital: ['#d9d3f5', '#a99cc9'] };

let root = null, canvas = null, ctx = null, hud = null;
let data = null;             // worldState
let scene = null;            // màn hiện tại (từ data.scenes)
let open = false, onStages = null, onGear = null, onBack = null, onExtras = null;
const keys = new Set();
const player = { x: 400, face: 1, moving: false, t: 0, target: null, then: null, trail: [] };
let followers = [];           // [{ id, x, face, moving, t }]
let dialog = null;            // { name, title, art, emoji, lines, i }
let puzzle = null;            // { kind, state[] }
let toastMsg = null, toastAt = 0;
let lastSave = 0, savedX = -1, busy = false;
const imgs = new Map();
function img(url) {
    if (!url) return null;
    if (!imgs.has(url)) { const im = new Image(); im.src = url; imgs.set(url, im); }
    const im = imgs.get(url);
    return im.complete && im.naturalWidth ? im : null;
}

// ---------- dựng khung ----------
function el() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'world-screen';
    root.innerHTML = `<canvas class="wd-canvas"></canvas><div class="wd-hud"></div>`;
    document.body.appendChild(root);
    canvas = root.querySelector('canvas');
    ctx = canvas.getContext('2d');
    hud = root.querySelector('.wd-hud');
    canvas.addEventListener('pointerdown', onCanvasPointer);
    hud.addEventListener('click', onHudClick);
    hud.addEventListener('pointerdown', onHudHold);
    window.addEventListener('pointerup', () => { keys.delete('hold-l'); keys.delete('hold-r'); });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', (e) => keys.delete(keyName(e)));
    window.addEventListener('resize', resize);
    return root;
}
const keyName = (e) => ({ ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' })[e.key] ?? e.key;
function resize() {
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(root.clientWidth * dpr);
    canvas.height = Math.round(root.clientHeight * dpr);
}

// ---------- tra cứu ----------
const scale = () => canvas.height / BASE_H;
const viewW = () => canvas.width / scale();
const groundY = () => BASE_H * GROUND;
function camX() {
    const vw = viewW();
    if (!scene || scene.width <= vw) return (scene?.width ?? vw) / 2 - vw / 2;
    return Math.max(0, Math.min(scene.width - vw, player.x - vw / 2));
}
/** Mọi thứ tương tác được trong màn: cổng, NPC, vật thể (đang hiện) */
function interactables() {
    if (!scene) return [];
    const out = [];
    for (const p of scene.portals) out.push({ kind: 'portal', x: p.x, p, label: p.open ? `${p.label}` : `🔒 ${p.label} (qua ải ${p.needNo})` });
    for (const n of scene.npcs) out.push({ kind: 'npc', x: n.x, n, label: `Nói chuyện · ${n.name}` });
    for (const o of scene.objects) {
        if (o.state === 'hidden') continue;
        const verb = { chest: o.state === 'done' ? 'Rương trống' : 'Mở rương', mine: o.state === 'cooldown' ? 'Mạch đá đã cạn' : 'Đào đá', item: 'Nhặt',
            puzzle: o.state === 'done' ? 'Đã giải' : 'Xem', secret: 'Xem xét', stageBoard: 'Chọn ải' }[o.type] ?? 'Xem';
        out.push({ kind: 'obj', x: o.x, o, label: `${verb} · ${o.label}` });
    }
    return out;
}
function nearest() {
    let best = null;
    for (const it of interactables()) {
        const d = Math.abs(it.x - player.x);
        if (d <= REACH && (!best || d < Math.abs(best.x - player.x))) best = it;
    }
    return best;
}

// ---------- hành động ----------
function interact(it) {
    if (!it || busy || dialog || puzzle) return;
    if (it.kind === 'portal') {
        if (!it.p.open) return toast(`🔒 ${it.p.label} mở khi qua ải ${it.p.needNo}`);
        return goScene(it.p.to, it.p.toX);
    }
    const target = it.kind === 'npc' ? it.n.id : it.o.id;
    if (it.kind === 'obj' && it.o.type === 'stageBoard') { save(true); return onStages?.(); }
    busy = true;
    net.worldInteract(scene.id, target);
}
function goScene(id, x) {
    const s = data.scenes[id];
    if (!s?.open) return;
    scene = s;
    player.x = x; player.target = null; player.then = null; player.trail = [];
    followers.forEach((f, i) => { f.x = x - player.face * GAP * (i + 1); });
    net.worldMove(id, x, true);
    savedX = x;
    renderHud();
}
function save(force = false) {
    if (!scene || !open) return;
    const now = performance.now();
    if (!force && (now - lastSave < 2500 || Math.abs(player.x - savedX) < 5)) return;
    lastSave = now; savedX = player.x;
    net.worldMove(scene.id, Math.round(player.x));
}
function toast(text) { toastMsg = text; toastAt = performance.now(); renderHud(); }

// ---------- vòng lặp ----------
let last = 0, raf = 0;
function frame(t) {
    if (!open) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    update(dt);
    draw();
    if (toastMsg && t - toastAt > 3500) { toastMsg = null; renderHud(); }
}
function update(dt) {
    if (!scene) return;
    let dir = 0;
    if (!dialog && !puzzle) {
        if (keys.has('l') || keys.has('hold-l')) dir -= 1;
        if (keys.has('r') || keys.has('hold-r')) dir += 1;
    }
    if (dir) { player.target = null; player.then = null; }
    else if (player.target != null) {
        const d = player.target - player.x;
        if (Math.abs(d) < 6) {
            player.target = null;
            const then = player.then; player.then = null;
            if (then) interact(then);
        } else dir = Math.sign(d);
    }
    player.moving = dir !== 0;
    if (dir) {
        player.face = dir;
        player.x = Math.max(20, Math.min(scene.width - 20, player.x + dir * SPEED * dt));
        player.trail.push(player.x);
        if (player.trail.length > 400) player.trail.shift();
    }
    player.t += dt;
    // đồng đội đi theo sau, cách nhau ~75 đơn vị
    followers.forEach((f, i) => {
        const want = player.x - player.face * GAP * (i + 1);
        const d = want - f.x;
        f.moving = Math.abs(d) > 8;
        if (f.moving) { f.face = Math.sign(d); f.x += Math.sign(d) * Math.min(Math.abs(d), SPEED * 1.05 * dt); }
        else f.face = player.face;
        f.t += dt;
    });
    const near = nearest();
    if ((near?.label ?? null) !== lastPrompt) { lastPrompt = near?.label ?? null; renderPrompt(near); }
    save();
}
let lastPrompt = null;

function drawHero(id, x, face, moving, t, alpha = 1) {
    const [url, meta] = HEROES[id] ?? [];
    const im = img(url);
    const cam = camX(), s = scale(), gy = groundY();
    const sx = (x - cam) * s, sy = gy * s;
    if (!im) return;
    const names = moving ? ['move1', 'move2', 'move3', 'move4', 'move5', 'move6', 'move7', 'move8'] : ['idle1', 'idle2', 'idle3', 'idle4'];
    const fps = moving ? 12 : 5;
    const fr = meta.frames[names[Math.floor(t * fps) % names.length]] ?? meta.frames.idle1;
    const k = (HERO_H / rokMeta.frames.idle1.rect[3]) * s;   // cùng tỉ lệ cho cả đội (giữ chiều cao tương đối)
    const [rx, ry, rw, rh] = fr.rect, [ox, oy] = fr.org;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sx, sy);
    ctx.scale(face < 0 ? -k : k, k);
    // bóng dưới chân
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(0, 0, 70, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(im, rx, ry, rw, rh, -ox, -oy, rw, rh);
    ctx.restore();
}
function drawLabel(text, x, y, color = '#fde68a', bg = 'rgba(15,23,42,.78)') {
    const s = scale();
    ctx.font = `700 ${Math.max(11, 15 * s)}px Outfit, sans-serif`;
    const w = ctx.measureText(text).width + 14 * s;
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 22 * s, w, 24 * s, 8 * s); ctx.fill();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - 10 * s);
}
function draw() {
    if (!ctx) return;
    const W = canvas.width, H = canvas.height, s = scale(), cam = camX(), gy = groundY();
    ctx.clearRect(0, 0, W, H);
    // nền: tranh vẽ (cuộn chậm theo camera) hoặc trời + đất vẽ tạm
    const bg = img(artUrl(scene?.bg));
    if (bg) {
        const bh = H, bw = bg.naturalWidth * (H / bg.naturalHeight);
        const cover = Math.max(bw, W);
        const span = Math.max(1, (scene.width - viewW()));
        const off = scene.width > viewW() ? (cam / span) * (cover - W) : (cover - W) / 2;
        ctx.drawImage(bg, -off, 0, cover, bh * (cover / bw));
    } else {
        const [a, b] = AREA_SKY[scene?.area] ?? ['#cbd5e1', '#94a3b8'];
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, a); g.addColorStop(GROUND, b); g.addColorStop(GROUND, '#6b4f2a'); g.addColorStop(1, '#4a3520');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = `800 ${46 * s}px Outfit, sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(scene?.name ?? '', W / 2, H * 0.4);
    }
    if (!scene) return;
    const sx = (x) => (x - cam) * s;
    // cổng
    for (const p of scene.portals) {
        const x = sx(p.x), y = gy * s;
        const grd = ctx.createRadialGradient(x, y - 70 * s, 5, x, y - 70 * s, 70 * s);
        grd.addColorStop(0, p.open ? 'rgba(253,230,138,.85)' : 'rgba(148,163,184,.6)'); grd.addColorStop(1, 'rgba(253,230,138,0)');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(x, y - 70 * s, 42 * s, 80 * s, 0, 0, Math.PI * 2); ctx.fill();
        drawLabel(p.open ? `➜ ${p.label}` : `🔒 ${p.label}`, x, y - 160 * s, p.open ? '#fde68a' : '#cbd5e1');
    }
    // vật thể
    for (const o of scene.objects) {
        if (o.state === 'hidden') continue;
        const x = sx(o.x), y = gy * s;
        const art = img(artUrl(`obj_${o.type === 'chest' ? (o.state === 'done' ? 'chest_open' : 'chest') : o.type}`));
        const bob = o.state === 'ready' ? Math.sin(performance.now() / 300) * 4 * s : 0;
        if (art) {
            const h = (o.type === 'puzzle' || o.type === 'stageBoard' ? 170 : 95) * s, w = art.naturalWidth * h / art.naturalHeight;
            ctx.globalAlpha = o.state === 'done' ? 0.6 : 1;
            ctx.drawImage(art, x - w / 2, y - h + bob, w, h);
            ctx.globalAlpha = 1;
        } else {
            ctx.font = `${(o.type === 'stageBoard' ? 64 : 52) * s}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.globalAlpha = o.state === 'done' || o.state === 'cooldown' ? 0.5 : 1;
            ctx.fillText(o.type === 'chest' && o.state === 'done' ? '📦' : o.icon, x, y + bob);
            ctx.globalAlpha = 1;
        }
        if (o.state === 'ready' && o.type !== 'stageBoard' && o.type !== 'puzzle') {
            ctx.fillStyle = 'rgba(253,224,71,.85)'; ctx.font = `${22 * s}px serif`; ctx.textAlign = 'center';
            ctx.fillText('✨', x + 30 * s, y - 70 * s + bob);
        }
    }
    // NPC
    for (const n of scene.npcs) {
        const x = sx(n.x), y = gy * s;
        const art = img(artUrl(`npc_${n.art}`));
        if (art) {
            const h = 230 * s, w = art.naturalWidth * h / art.naturalHeight;
            ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y, 55 * s, 11 * s, 0, 0, Math.PI * 2); ctx.fill();
            ctx.save(); ctx.translate(x, y);
            if (n.x > player.x) ctx.scale(-1, 1);   // quay mặt về phía người chơi
            ctx.drawImage(art, -w / 2, -h, w, h); ctx.restore();
        } else {
            ctx.font = `${96 * s}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText(n.emoji, x, y);
        }
        drawLabel(`${n.name}`, x, y + 30 * s, '#fef3c7');
        if (n.mark) {
            ctx.font = `900 ${44 * s}px Outfit, sans-serif`; ctx.textAlign = 'center';
            ctx.fillStyle = n.mark === '!' ? '#facc15' : '#4ade80';
            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 5 * s;
            const yy = y - 250 * s + Math.sin(performance.now() / 250) * 6 * s;
            ctx.strokeText(n.mark, x, yy); ctx.fillText(n.mark, x, yy);
        }
    }
    // đội
    [...followers].reverse().forEach(f => drawHero(f.id, f.x, f.face, f.moving, f.t));
    if (data?.party?.[0]) drawHero(data.party[0], player.x, player.face, player.moving, player.t);
}

// ---------- HUD ----------
function renderPrompt(near) {
    const p = hud?.querySelector('.wd-prompt');
    if (!p) return;
    p.innerHTML = near ? `<button class="wd-act" data-wd-act>▲ ${near.label}</button>` : '';
}
function renderHud() {
    if (!hud || !data) return;
    const w = data.wallet ?? {};
    const fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN');
    hud.innerHTML = `
    <div class="wd-top">
        <button class="cp-back-btn" data-wd-back>← Menu</button>
        <div class="wd-title"><b>🗺️ ${scene?.name ?? ''}</b><small>${scene?.areaName ?? ''}</small></div>
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
    <div class="wd-prompt"></div>
    <div class="wd-pad">
        <button class="wd-pad-btn" data-wd-hold="l" aria-label="Đi trái">◀</button>
        <button class="wd-pad-btn" data-wd-hold="r" aria-label="Đi phải">▶</button>
    </div>
    <div class="wd-help">← → đi · ↑ / E tương tác · bấm vào nền để đi tới</div>
    ${dialog ? dialogHTML() : ''}
    ${puzzle ? puzzleHTML() : ''}
    ${mapOpen ? mapHTML() : ''}`;
    lastPrompt = undefined;
    renderPrompt(nearest());
}
let mapOpen = false;
function mapHTML() {
    const areas = {};
    for (const s of Object.values(data.scenes)) (areas[s.area] ??= { name: s.areaName, list: [] }).list.push(s);
    return `<div class="cp-confirm-backdrop" data-wd-map-close>
        <div class="wd-map" role="dialog">
            <h3>🧭 Bản đồ tộc Người</h3>
            <p class="gr-hint">Bấm vào khu đã mở để dịch chuyển nhanh tới đó.</p>
            ${Object.values(areas).map(a => `<div class="wd-map-area"><b>${a.name}</b><div>${a.list.map(s =>
                `<button class="wd-map-scene${s.id === scene.id ? ' here' : ''}${s.open ? '' : ' locked'}" data-wd-travel="${s.id}" ${s.open ? '' : 'disabled'}>${s.open ? '' : '🔒 '}${s.name}${s.id === scene.id ? ' 📍' : ''}</button>`).join('')}</div>
                ${a.list[0].open ? '' : `<small>Mở khi qua ải ${a.list[0].needNo}</small>`}</div>`).join('')}
            <button class="cp-btn-cancel" data-wd-map-close>Đóng</button>
        </div></div>`;
}
function dialogHTML() {
    const art = artUrl(`npc_${dialog.art}`);
    const last = dialog.i >= dialog.lines.length - 1;
    return `<div class="wd-dialog" data-wd-next>
        <div class="wd-dlg-face">${art ? `<img src="${art}" alt="">` : `<span>${dialog.emoji ?? '💬'}</span>`}</div>
        <div class="wd-dlg-body"><b>${dialog.name}${dialog.title ? ` <small>· ${dialog.title}</small>` : ''}</b>
            <p>${dialog.lines[dialog.i]}</p>
            <span class="wd-dlg-next">${last ? 'Đóng ✕' : 'Tiếp ▶'}</span></div>
    </div>`;
}
function puzzleHTML() {
    if (puzzle.kind === 'well') return `<div class="cp-confirm-backdrop">
        <div class="wd-puzzle" role="dialog">
            <h3>🪨 Giếng Cổ</h3>
            <p>Bốn phiến đá khắc biểu tượng. Bấm để xoay từng phiến, xếp theo một thứ tự nào đó…</p>
            <div class="wd-dials">${puzzle.state.map((v, i) => `<button class="wd-dial" data-wd-dial="${i}">${v}</button>`).join('')}</div>
            ${puzzle.msg ? `<p class="wd-pz-msg">${puzzle.msg}</p>` : ''}
            <div class="cp-confirm-actions"><button class="cp-btn-cancel" data-wd-pz-close>Rời đi</button><button class="cp-btn-confirm" data-wd-pz-try>Thử</button></div>
        </div></div>`;
    return `<div class="cp-confirm-backdrop">
        <div class="wd-puzzle" role="dialog">
            <h3>📖 Trang sách bị xé</h3>
            <p>Bấm 2 mảnh để đổi chỗ. Ở góc mỗi mảnh có số La Mã mờ.</p>
            <div class="wd-dials">${puzzle.state.map((v, i) => `<button class="wd-dial page${puzzle.pick === i ? ' picked' : ''}" data-wd-page="${i}"><small>${v}</small>📜</button>`).join('')}</div>
            ${puzzle.msg ? `<p class="wd-pz-msg">${puzzle.msg}</p>` : ''}
            <div class="cp-confirm-actions"><button class="cp-btn-cancel" data-wd-pz-close>Rời đi</button><button class="cp-btn-confirm" data-wd-pz-try>Ghép</button></div>
        </div></div>`;
}

// ---------- nhập liệu ----------
function onKey(e) {
    if (!open) return;
    if (e.target?.closest?.('input, textarea')) return;
    const k = keyName(e);
    if (dialog && ['ArrowUp', 'w', 'W', 'e', 'E', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); nextLine(); return; }
    if (k === 'l' || k === 'r') { keys.add(k); e.preventDefault(); return; }
    if (['ArrowUp', 'w', 'W', 'e', 'E', ' '].includes(e.key)) { e.preventDefault(); interact(nearest()); }
    if (e.key === 'Escape') { dialog = null; puzzle = null; mapOpen = false; renderHud(); }
}
function onCanvasPointer(e) {
    if (!scene || dialog || puzzle) return;
    const r = canvas.getBoundingClientRect();
    const wx = camX() + ((e.clientX - r.left) * (canvas.width / r.width)) / scale();
    // bấm trúng NPC / vật / cổng -> đi tới rồi tương tác
    let hit = null;
    for (const it of interactables()) if (Math.abs(it.x - wx) < 60 && (!hit || Math.abs(it.x - wx) < Math.abs(hit.x - wx))) hit = it;
    player.target = Math.max(20, Math.min(scene.width - 20, hit ? hit.x - Math.sign(hit.x - player.x || 1) * 40 : wx));
    player.then = hit;
    if (hit && Math.abs(hit.x - player.x) <= REACH) { player.target = null; player.then = null; interact(hit); }
}
function onHudHold(e) {
    const h = e.target.closest('[data-wd-hold]');
    if (h) { keys.add(`hold-${h.dataset.wdHold}`); e.preventDefault(); }
}
function nextLine() {
    if (!dialog) return;
    if (dialog.i < dialog.lines.length - 1) dialog.i++;
    else dialog = null;
    renderHud();
}
function onHudClick(e) {
    const q = (s) => e.target.closest(s);
    if (q('[data-wd-back]')) { save(true); hideWorld(); onBack?.(); return; }
    if (q('[data-wd-stages]')) { save(true); onStages?.(); return; }
    if (q('[data-wd-gear]')) { save(true); onGear?.(); return; }
    if (q('[data-wd-extras]')) { save(true); onExtras?.(); return; }
    if (q('[data-wd-map]')) { mapOpen = true; renderHud(); return; }
    if (e.target.matches('[data-wd-map-close]') || q('button[data-wd-map-close]')) { mapOpen = false; renderHud(); return; }
    const tv = q('[data-wd-travel]');
    if (tv) {   // dịch chuyển nhanh tới khu đã mở (đứng ở đầu khu)
        mapOpen = false;
        if (tv.dataset.wdTravel !== scene.id) goScene(tv.dataset.wdTravel, 300);
        else renderHud();
        return;
    }
    if (q('[data-wd-act]')) { interact(nearest()); return; }
    if (q('[data-wd-next]')) { nextLine(); return; }
    if (q('[data-wd-pz-close]')) { puzzle = null; renderHud(); return; }
    const dial = q('[data-wd-dial]');
    if (dial) {
        const i = +dial.dataset.wdDial, sy = data.wellSymbols;
        puzzle.state[i] = sy[(sy.indexOf(puzzle.state[i]) + 1) % sy.length];
        puzzle.msg = null; renderHud(); return;
    }
    const pg = q('[data-wd-page]');
    if (pg) {
        const i = +pg.dataset.wdPage;
        if (puzzle.pick == null) puzzle.pick = i;
        else { [puzzle.state[i], puzzle.state[puzzle.pick]] = [puzzle.state[puzzle.pick], puzzle.state[i]]; puzzle.pick = null; }
        puzzle.msg = null; renderHud(); return;
    }
    if (q('[data-wd-pz-try]') && !busy) {
        busy = true;
        const target = puzzle.kind === 'well' ? 'well' : 'pages';
        net.worldInteract(scene.id, target, puzzle.state);
    }
}

// ---------- server ----------
// ---------- Cốt truyện: mở màn (đấu thần) -> bị phong ấn -> tỉnh dậy ở Ashford ----------
let prologueOn = false, wakeShown = false, storyText = null;
function startPrologue() {
    prologueOn = true;
    hideWorld();
    document.body.classList.add('selecting-squad');   // ẩn bảng tool Test phía sau lời dẫn
    playStory(storyText.intro.prologue, storyText.speakers, () => socket.emit('prologueStart'));
}
function onPrologueEnd() {
    const flash = document.createElement('div');
    flash.className = 'wd-flash';
    document.body.appendChild(flash);
    setTimeout(() => {
        playStory(storyText.intro.sealed, storyText.speakers, () => {
            flash.remove();
            prologueOn = false;
            showWorld();
        });
    }, 1600);
}
function applyState(d) {
    if (d.storyText) storyText = d.storyText;
    if (d.story && !d.story.prologue) { if (!prologueOn && open) startPrologue(); return; }
    if (d.story && !d.story.wake && !wakeShown && open) {
        wakeShown = true;
        setTimeout(() => playStory(storyText.intro.wake, storyText.speakers, () => socket.emit('storyMark', { key: 'wake' })), 300);
    }
    const first = !data;
    data = d;
    const sceneChanged = !scene || scene.id !== d.scene;
    scene = d.scenes[d.scene];
    if (first || sceneChanged) { player.x = d.x; player.trail = []; }
    d.party = PARTY_ORDER.filter(id => (d.party?.length ? d.party : PARTY_ORDER.slice(0, 3)).includes(id));   // Rok dẫn đầu
    const ids = d.party.slice(1);
    followers = ids.map((id, i) => followers.find(f => f.id === id) ?? { id, x: player.x - GAP * (i + 1), face: 1, moving: false, t: i * 0.3 });
    renderHud();
}
function onResult(r) {
    busy = false;
    if (r.puzzle) {   // mở bảng câu đố
        const shuffled = r.puzzle === 'well' ? ['💧', '⭐', '🌙', '☀️'] : ['III', 'I', 'IV', 'II'];
        puzzle = { kind: r.puzzle, state: shuffled, pick: null, msg: null };
        return renderHud();
    }
    if (puzzle && !r.ok) { puzzle.msg = r.text; return renderHud(); }
    if (puzzle && r.ok) puzzle = null;
    if (r.lines) {
        const n = scene?.npcs.find(x => x.id === r.target);
        dialog = { name: n?.name ?? '', title: n?.title, art: n?.art, emoji: n?.emoji, lines: [...r.lines, ...(r.text ? [`✨ ${r.text}`] : [])], i: 0 };
        return renderHud();
    }
    if (r.openStages) { save(true); return onStages?.(); }
    toast(r.ok ? `✨ ${r.text}` : `⚠️ ${r.text}`);
}

// ---------- mở / đóng ----------
export function showWorld({ stages, gear, back, extras } = {}) {
    onStages = stages ?? onStages; onGear = gear ?? onGear; onBack = back ?? onBack; onExtras = extras ?? onExtras;
    el().style.display = 'block';
    document.body.classList.add('selecting-squad', 'in-world');
    open = true;
    resize();
    net.worldOpen();
    cancelAnimationFrame(raf); last = 0;
    raf = requestAnimationFrame(frame);
}
export function hideWorld() {
    if (open) save(true);
    open = false;
    cancelAnimationFrame(raf);
    keys.clear();
    if (root) root.style.display = 'none';
    document.body.classList.remove('in-world');
}
export const worldOpen = () => open;

export function setupWorld() {
    el();
    socket.on('worldState', applyState);
    socket.on('prologueEnd', onPrologueEnd);
    socket.on('worldResult', onResult);
    socket.on('worldError', (d) => { busy = false; toast(`⚠️ ${d.text}`); });
    socket.on('battleStart', hideWorld);
    socket.on('battleEnd', () => { if (prologueOn) document.getElementById('battle-result')?.style.setProperty('display', 'none'); });
    socket.on('mainMenu', hideWorld);
}
