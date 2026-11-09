// ============================================================
// 🏰 TRANG VÀO GAME — hiện ngay khi mở game (tranh tải ngầm phía sau)
//   Nền động: bản đồ kinh thành trôi chậm + đội anh hùng + tàn lửa bay + tia sáng (canvas, tự dừng khi vào game)
//   Đăng nhập / tạo tài khoản (để TRỐNG cả 2 ô = vào luôn bằng bản lưu của trình duyệt này)
//   Nút: ⚔️ Vào game (server chính) · 🧪 Server test (chỉ chủ game — có bảng tool, src/ui/testPanel.js)
//   Server: socket authLogin / authRegister / authResume / authLogout -> authResult; vào server = kết nối lại kèm mã (enterServer)
// ============================================================
import { socket, enterServer } from '../net/socket.js';
import { loadState } from './loading.js';
import '../styles/landing.css';

const MAP = import.meta.glob('../assets/maps/capital.webp', { eager: true, import: 'default' });
const PORTRAITS = import.meta.glob('../assets/portraits/*.png', { eager: true, import: 'default' });
const LINEUP = ['archer', 'priest', 'warrior', 'assassin', 'mage'];   // giữa = to nhất
const LS = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* chế độ riêng tư */ } } };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let root = null, canvas = null, raf = 0, running = false;
let mode = 'login';               // 'login' | 'register'
let user = null;                  // { name, admin } khi đã đăng nhập
let token = LS.get('loc.token');
let busy = null;                  // chữ đang chờ ('Đang đăng nhập…')
let err = null, note = null;
let pending = null, waitTimer = null, resuming = false;
let server = null;                // server đã vào: 'main' | 'test'

export const currentServer = () => server;

// ---------- nền động ----------
const imgs = {};
const pic = (url) => { if (!url) return null; if (!imgs[url]) { const im = new Image(); im.src = url; imgs[url] = im; } const im = imgs[url]; return im.complete && im.naturalWidth ? im : null; };
let embers = [];
function seedEmbers(w, h) {
    const n = Math.round(Math.min(90, w * h / 16000));
    embers = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 2.2, v: 12 + Math.random() * 38, s: Math.random() * 6.28, hue: 18 + Math.random() * 30 }));
}
function resize() {
    if (!canvas) return;
    const k = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * k); canvas.height = Math.round(innerHeight * k);
    seedEmbers(canvas.width, canvas.height);
}
let last = 0;
function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    const t = now / 1000, g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    g.imageSmoothingEnabled = true;
    // 1) bản đồ kinh thành trôi chậm (phủ kín màn)
    const bg = pic(Object.values(MAP)[0]);
    g.fillStyle = '#0b1020'; g.fillRect(0, 0, W, H);
    if (bg) {
        const sc = Math.max(W / bg.width, H / bg.height) * 1.18;
        const bw = bg.width * sc, bh = bg.height * sc;
        const ox = (W - bw) / 2 + Math.sin(t * 0.05) * (bw - W) * 0.42, oy = (H - bh) / 2 + Math.cos(t * 0.037) * (bh - H) * 0.35;
        g.globalAlpha = 0.9; g.drawImage(bg, ox, oy, bw, bh); g.globalAlpha = 1;
    }
    // màn tối + ánh hoàng hôn
    let gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(8,10,28,.55)'); gr.addColorStop(0.55, 'rgba(30,14,10,.35)'); gr.addColorStop(1, 'rgba(6,4,10,.92)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // 2) tia sáng xoay chậm từ trên
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
        const a = -0.5 + i * 0.33 + Math.sin(t * 0.21 + i) * 0.06;
        g.save(); g.translate(W * 0.5, -H * 0.15); g.rotate(a);
        const rg = g.createLinearGradient(0, 0, 0, H * 1.2);
        rg.addColorStop(0, `rgba(255,214,140,${0.10 + 0.04 * Math.sin(t * 0.7 + i * 2)})`); rg.addColorStop(1, 'rgba(255,214,140,0)');
        g.fillStyle = rg; g.beginPath(); g.moveTo(-W * 0.02, 0); g.lineTo(W * 0.02, 0); g.lineTo(W * 0.16, H * 1.2); g.lineTo(-W * 0.16, H * 1.2); g.fill();
        g.restore();
    }
    g.restore();
    // 3) đội anh hùng đứng dưới (thở nhẹ), giữa to nhất
    const baseH = H * (W < H ? 0.36 : 0.5);
    LINEUP.forEach((id, i) => {
        const im = pic(PORTRAITS[`../assets/portraits/${id}.png`]);
        if (!im) return;
        const mid = (LINEUP.length - 1) / 2, d = Math.abs(i - mid);
        const h = baseH * (1 - d * 0.13), w = h * im.width / im.height;
        const x = W / 2 + (i - mid) * Math.min(W * 0.19, baseH * 0.62) - w / 2;
        const y = H - h * 0.97 + Math.sin(t * 1.3 + i * 1.7) * h * 0.012;
        g.save();
        g.shadowColor = 'rgba(255,170,80,.55)'; g.shadowBlur = 24 * (W / 1400);
        g.globalAlpha = 0.55 + 0.45 * (1 - d / 3);
        g.drawImage(im, x, y, w, h);
        g.restore();
    });
    // sương dưới chân
    gr = g.createLinearGradient(0, H * 0.72, 0, H);
    gr.addColorStop(0, 'rgba(6,4,10,0)'); gr.addColorStop(1, 'rgba(6,4,10,.95)');
    g.fillStyle = gr; g.fillRect(0, H * 0.72, W, H * 0.28);
    // 4) tàn lửa bay lên
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const e of embers) {
        e.y -= e.v * dt * (W / 1400 + 0.4); e.x += Math.sin(t * 1.4 + e.s) * 14 * dt;
        if (e.y < -10) { e.y = H + 10; e.x = Math.random() * W; }
        const fl = 0.55 + 0.45 * Math.sin(t * 5 + e.s * 3);
        g.fillStyle = `hsla(${e.hue},100%,62%,${0.75 * fl})`;
        g.beginPath(); g.arc(e.x, e.y, e.r * (W / 1400 + 0.5), 0, 6.283); g.fill();
    }
    g.restore();
}
function startBg() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
function stopBg() { running = false; cancelAnimationFrame(raf); }

// ---------- khung đăng nhập ----------
function render() {
    if (!root) return;
    const card = root.querySelector('.ld2-card');
    const loading = !loadState.done ? `<div class="ld2-load"><i style="width:${Math.round(loadState.p * 100)}%"></i></div><small class="ld2-load-t">${esc(loadState.msg)} ${Math.round(loadState.p * 100)}%</small>` : '';
    if (user) {
        card.innerHTML = `
            <div class="ld2-hello">Xin chào, <b>${esc(user.name)}</b>${user.admin ? ' <span class="ld2-tag">👑 Chủ game</span>' : ''}</div>
            ${err ? `<p class="ld2-err">${esc(err)}</p>` : ''}${note ? `<p class="ld2-note">${esc(note)}</p>` : ''}
            <button class="ld2-btn main" data-ld="main" ${busy ? 'disabled' : ''}>⚔️ Vào game</button>
            ${user.admin ? `<button class="ld2-btn test" data-ld="test" ${busy ? 'disabled' : ''}>🧪 Server test</button>` : ''}
            <button class="ld2-link" data-ld="logout" ${busy ? 'disabled' : ''}>Đăng xuất</button>
            ${busy ? `<p class="ld2-busy">${esc(busy)}</p>` : ''}${loading}`;
        return;
    }
    const reg = mode === 'register';
    const keep = { u: card.querySelector('[name=u]')?.value ?? '', p: card.querySelector('[name=p]')?.value ?? '' };
    card.innerHTML = `
        <h2>${reg ? 'Tạo tài khoản' : 'Đăng nhập'}</h2>
        <form class="ld2-form" autocomplete="on">
            <label><span>Tài khoản</span><input name="u" autocomplete="username" maxlength="20" placeholder="${reg ? '3–20 ký tự: chữ, số, _' : 'Tên đăng nhập'}" value="${esc(keep.u)}"></label>
            <label><span>Mật khẩu</span><input name="p" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" maxlength="64" placeholder="${reg ? 'Ít nhất 6 ký tự' : 'Mật khẩu'}" value="${esc(keep.p)}"></label>
            ${err ? `<p class="ld2-err">${esc(err)}</p>` : ''}${note ? `<p class="ld2-note">${esc(note)}</p>` : ''}
            <button class="ld2-btn main" type="submit" data-ld="main" ${busy ? 'disabled' : ''}>${reg ? '✨ Tạo & vào game' : '⚔️ Vào game'}</button>
            <button class="ld2-btn test" type="button" data-ld="test" ${busy ? 'disabled' : ''}>🧪 Server test</button>
        </form>
        <button class="ld2-link" data-ld="${reg ? 'toLogin' : 'toReg'}">${reg ? '← Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Tạo mới'}</button>
        <small class="ld2-hint">Đang thử game: để trống cả 2 ô rồi bấm là vào luôn.</small>
        ${busy ? `<p class="ld2-busy">${esc(busy)}</p>` : ''}${loading}`;
}
function setBusy(t) { busy = t; render(); }

function onClick(e) {
    const b = e.target.closest('[data-ld]');
    if (!b || b.disabled) return;
    const a = b.dataset.ld;
    if (a === 'toReg' || a === 'toLogin') { mode = a === 'toReg' ? 'register' : 'login'; err = note = null; render(); return; }
    if (a === 'logout') { socket.emit('authLogout', { token }); token = null; LS.set('loc.token', null); user = null; err = note = null; render(); return; }
    if (a === 'main' || a === 'test') { e.preventDefault(); choose(a); }
}
function choose(srv) {
    err = note = null;
    if (user && token) return go(srv, token);
    const u = root.querySelector('[name=u]')?.value.trim() ?? '', p = root.querySelector('[name=p]')?.value ?? '';
    if (!u && !p) return go(srv, null);   // để trống: vào luôn (bản lưu của trình duyệt này)
    if (!u || !p) { err = 'Nhập đủ tài khoản và mật khẩu (hoặc để trống cả hai để vào thử)'; render(); return; }
    pending = srv;
    setBusy(mode === 'register' ? 'Đang tạo tài khoản…' : 'Đang đăng nhập…');
    socket.emit(mode === 'register' ? 'authRegister' : 'authLogin', { user: u, pass: p });
    armTimeout();
}
function armTimeout() {
    clearTimeout(waitTimer);
    waitTimer = setTimeout(() => { if (resuming) { resuming = false; token = null; return setBusy(null); } if (busy) { pending = null; err = 'Máy chủ chưa phản hồi — thử lại sau, hoặc để trống 2 ô để vào thử'; setBusy(null); } }, 8000);
}
function onAuth(r = {}) {
    clearTimeout(waitTimer);
    if (resuming) { resuming = false; if (!r.ok) { token = null; LS.set('loc.token', null); return setBusy(null); } }
    if (!r.ok) { err = r.error ?? 'Không đăng nhập được'; pending = null; setBusy(null); return; }
    user = r.user ?? null; token = r.token ?? (user ? token : null);
    LS.set('loc.token', user ? token : null);
    const srv = pending; pending = null;
    if (user && srv) return go(srv, token);
    setBusy(null);
}

// vào server: khách = giữ kết nối hiện tại; tài khoản = kết nối lại kèm mã rồi đợi serverInfo
let entering = null;
function go(srv, tok) {
    entering = srv;
    if (!tok) return finish(srv, null);
    setBusy('Đang vào server…');
    enterServer(tok, srv);
    armTimeout();
}
function onServerInfo(info = {}) {
    if (!entering) return;
    clearTimeout(waitTimer);
    if (info.note) note = info.note;
    finish(info.server === 'test' ? 'test' : 'main', info.user ?? user);
}
socket.on('authExpired', () => { token = null; LS.set('loc.token', null); user = null; if (entering) { entering = null; err = 'Phiên đăng nhập đã hết — đăng nhập lại'; setBusy(null); } });

function finish(srv, who) {
    entering = null;
    if (!loadState.done) {   // tranh chưa tải xong: đợi rồi vào
        setBusy('Đang tải tranh, sắp xong…');
        const iv = setInterval(() => { render(); if (loadState.done) { clearInterval(iv); finish(srv, who); } }, 250);
        return;
    }
    server = srv;
    document.body.classList.toggle('srv-test', srv === 'test');
    document.body.classList.toggle('srv-main', srv !== 'test');
    busy = null;
    root.classList.add('out');
    setTimeout(() => { stopBg(); root.remove(); root = null; canvas = null; }, 700);
    window.dispatchEvent(new CustomEvent('server-entered', { detail: { server: srv, user: who } }));
}

export function setupLanding() {
    root = document.createElement('div');
    root.id = 'landing';
    root.innerHTML = `<canvas class="ld2-bg"></canvas>
        <div class="ld2-wrap">
            <div class="ld2-logo"><h1>LEGEND OF CAPSULES</h1><p>Chương 1 · Ngọn Lửa Dưới Thánh Huy</p></div>
            <div class="ld2-card"></div>
        </div>
        <small class="ld2-ver">Bản thử nghiệm</small>`;
    document.body.appendChild(root);
    canvas = root.querySelector('canvas');
    resize(); addEventListener('resize', resize);
    root.addEventListener('click', onClick);
    root.addEventListener('submit', (e) => { e.preventDefault(); choose('main'); });
    socket.on('authResult', onAuth);
    socket.on('serverInfo', onServerInfo);
    render(); startBg();
    // thanh tải trong khung: vẽ lại tới khi xong
    const iv = setInterval(() => { if (!root) return clearInterval(iv); const bar = root.querySelector('.ld2-load i'); if (bar) bar.style.width = `${Math.round(loadState.p * 100)}%`; const tx = root.querySelector('.ld2-load-t'); if (tx) tx.textContent = `${loadState.msg} ${Math.round(loadState.p * 100)}%`; if (loadState.done) { clearInterval(iv); render(); } }, 300);
    if (token) { resuming = true; setBusy('Đang kiểm tra đăng nhập…'); socket.emit('authResume', { token }); armTimeout(); }
}
