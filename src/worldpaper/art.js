// ============================================================
// 🎨 NGHỆ THUẬT BẢN ĐỒ GIẤY CẮT DÁN (dùng chung cho bản thử + Làng Ashford)
//   Mỗi hàm vẽ trả về 1 canvas nền trong suốt (lề >= 14px, chân ở đáy);
//   paperize() thêm viền giấy kem (#f6e9cd), hạt giấy li ti và độ khối trên-dưới.
//   Tách từng món nhỏ gọn để sau này có thể thay bằng tranh vẽ sẵn từng món.
// ============================================================

export function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return [c, c.getContext('2d')];
}

export const RIM = '#f6e9cd';

// viền giấy kem quanh hình + hạt giấy li ti trên mặt hình
export function paperize(src, rim = 7, r = Math.random) {
    const w = src.width, h = src.height;
    const [sil, sg] = mk(w, h);
    sg.drawImage(src, 0, 0);
    sg.globalCompositeOperation = 'source-in';
    sg.fillStyle = RIM; sg.fillRect(0, 0, w, h);
    const [out, g] = mk(w, h);
    for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2;
        g.drawImage(sil, Math.cos(a) * rim, Math.sin(a) * rim);
    }
    g.drawImage(sil, 0, 0);
    const [art, ag] = mk(w, h);
    ag.drawImage(src, 0, 0);
    ag.globalCompositeOperation = 'source-atop';
    const n = Math.floor(w * h / 55);
    for (let i = 0; i < n; i++) {
        ag.fillStyle = r() < 0.5 ? 'rgba(255,250,235,.07)' : 'rgba(70,35,10,.07)';
        ag.fillRect(r() * w, r() * h, 1.6, 1.6);
    }
    // sáng nhẹ phía trên, tối nhẹ phía dưới: giấy có khối hơn
    const gr = ag.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,240,200,.10)'); gr.addColorStop(1, 'rgba(80,30,10,.12)');
    ag.fillStyle = gr; ag.fillRect(0, 0, w, h);
    g.drawImage(art, 0, 0);
    return out;
}

// ---------- bảng màu cây & bụi (giữ nguyên cho bản thử, thêm bảng màu xanh làng cho Ashford) ----------
export const TREE_PALS = [
    { leaf: '#e98a2c', dab1: '#f4b244', dab2: '#cf5a26', branch: '#9b3620', edge: '#a8431f', trunk: '#8a4b2c' },
    { leaf: '#f0a63a', dab1: '#f8cf63', dab2: '#dd7a2a', branch: '#a5421f', edge: '#b9601f', trunk: '#7d4628' },
    { leaf: '#d9602b', dab1: '#ee9a3c', dab2: '#b23a22', branch: '#7c2418', edge: '#8e2d1c', trunk: '#70391f' },
    { leaf: '#e6b84a', dab1: '#f6dc7c', dab2: '#d98d2c', branch: '#a14a22', edge: '#b3741f', trunk: '#84502b' },
];

export const ASHFORD_TREE_PALS = [
    { leaf: '#5c9348', dab1: '#86bc5e', dab2: '#3f7337', branch: '#5f3e24', edge: '#335d2e', trunk: '#7d4b2d' },
    { leaf: '#6ea34b', dab1: '#9acb68', dab2: '#4d7f39', branch: '#684429', edge: '#3f6a30', trunk: '#754428' },
    { leaf: '#477c42', dab1: '#6aa453', dab2: '#2e5932', branch: '#52341e', edge: '#244927', trunk: '#6b3d22' },
    { leaf: '#d89b38', dab1: '#f2c85c', dab2: '#b87226', branch: '#6c3c22', edge: '#8c531d', trunk: '#7a4628' },
];

export function drawRoundTree(pal, r, opts = {}) {
    const w = 384, h = 448, cx = w / 2;
    const [c, g] = mk(w, h);
    // thân
    g.fillStyle = pal.trunk;
    g.beginPath();
    g.moveTo(cx - 20, h - 18); g.lineTo(cx - 10, h * 0.5); g.lineTo(cx + 10, h * 0.5); g.lineTo(cx + 20, h - 18);
    g.closePath(); g.fill();
    // tán: nhiều hình tròn gộp lại
    const cy = h * 0.40, crown = new Path2D();
    const blobs = [[0, 0, 118]];
    for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2 + r() * 0.4, d = 62 + r() * 22;
        blobs.push([Math.cos(a) * d * 1.05, Math.sin(a) * d * 0.95, 58 + r() * 20]);
    }
    for (const [x, y, rad] of blobs) { crown.moveTo(cx + x + rad, cy + y); crown.arc(cx + x, cy + y, rad, 0, Math.PI * 2); }
    g.strokeStyle = pal.edge; g.lineWidth = 10; g.stroke(crown);
    g.fillStyle = pal.leaf; g.fill(crown);
    g.save(); g.clip(crown);
    g.fillStyle = 'rgba(70,35,15,.16)';
    g.beginPath(); g.arc(cx + 70, cy + 70, 130, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 90; i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 150;
        g.save();
        g.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
        g.rotate(r() * Math.PI);
        g.fillStyle = r() < 0.55 ? pal.dab1 : pal.dab2;
        g.beginPath(); g.ellipse(0, 0, 9 + r() * 6, 4 + r() * 3, 0, 0, Math.PI * 2); g.fill();
        g.restore();
    }
    g.strokeStyle = pal.branch; g.lineCap = 'round';
    g.lineWidth = 7; g.beginPath(); g.moveTo(cx, h * 0.66); g.lineTo(cx + (r() - .5) * 14, cy - 96); g.stroke();
    for (let i = 0; i < 7; i++) {
        const y0 = h * 0.60 - i * 30, side = i % 2 ? 1 : -1, len = 60 + r() * 50;
        g.lineWidth = 5 - i * 0.35;
        g.beginPath(); g.moveTo(cx, y0);
        g.quadraticCurveTo(cx + side * len * 0.5, y0 - 12, cx + side * len, y0 - 46 - r() * 30);
        g.stroke();
    }
    if (opts.apples) {
        const spots = [[-72, -32], [68, -42], [-18, -86], [28, 12], [-86, 26], [84, 22], [-34, 48], [46, -8], [2, -26]];
        for (const [ax, ay] of spots) {
            const x = cx + ax + (r() - 0.5) * 12, y = cy + ay + (r() - 0.5) * 12;
            g.fillStyle = '#9b241c'; g.beginPath(); g.arc(x, y + 2, 13, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#df3d2b'; g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#ffd5b8'; g.beginPath(); g.arc(x - 4, y - 4, 3.6, 0, Math.PI * 2); g.fill();
        }
    }
    g.restore();
    return paperize(c, 8, r);
}

export function drawAppleTree(r) {
    return drawRoundTree(ASHFORD_TREE_PALS[1], r, { apples: true });
}

export function drawPine(r) {
    const w = 300, h = 460, cx = w / 2;
    const [c, g] = mk(w, h);
    g.fillStyle = '#7a4a2b';
    g.fillRect(cx - 13, h - 90, 26, 72);
    const tiers = 4;
    for (let i = tiers - 1; i >= 0; i--) {
        const top = 22 + i * 78, bot = top + 150, half = 62 + i * 22;
        g.fillStyle = i % 2 ? '#3f6f52' : '#4d8160';
        g.beginPath(); g.moveTo(cx, top);
        const teeth = 6;
        g.lineTo(cx + half, bot);
        for (let k = 1; k <= teeth; k++) {
            const x = cx + half - (2 * half) * (k / teeth), xm = x + half / teeth;
            g.lineTo(xm, bot - 22); g.lineTo(x, bot);
        }
        g.closePath(); g.fill();
        g.strokeStyle = 'rgba(240,230,190,.55)'; g.lineWidth = 3;
        for (let k = -2; k <= 2; k++) {
            g.beginPath(); g.moveTo(cx + k * 6, top + 26); g.lineTo(cx + k * half * 0.36, bot - 30); g.stroke();
        }
    }
    return paperize(c, 8, r);
}

export const FAN_PALS = [
    ['#2f8f83', '#c9472e', '#f0b04a'],
    ['#c9472e', '#ee8a34', '#f6d27a'],
    ['#4d8160', '#e6b84a', '#d9602b'],
    ['#2c7a78', '#59b3a2', '#e98a2c'],
];

export const ASHFORD_BUSH_PALS = [
    ['#4b814a', '#6ea456', '#98c46a'],
    ['#3d7047', '#5a9454', '#e6b84a'],
    ['#54864b', '#79ad59', '#d96a38'],
    ['#2f7a6d', '#58a48b', '#f0b84a'],
];

export function drawFanBush(pal, r) {
    const w = 300, h = 176, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    const rx = 132, ry = 142;
    for (let i = 0; i < 4; i++) {
        const k = 1 - i * 0.22;
        g.fillStyle = pal[i % pal.length];
        g.beginPath(); g.ellipse(cx, by, rx * k, ry * k, 0, Math.PI, 0); g.closePath(); g.fill();
    }
    g.strokeStyle = 'rgba(250,235,200,.5)'; g.lineWidth = 2.5;
    for (let i = 1; i < 9; i++) {
        const a = Math.PI + i / 9 * Math.PI;
        g.beginPath(); g.moveTo(cx + Math.cos(a) * rx * 0.36, by + Math.sin(a) * ry * 0.36);
        g.lineTo(cx + Math.cos(a) * rx * 0.96, by + Math.sin(a) * ry * 0.96); g.stroke();
    }
    return paperize(c, 7, r);
}

export function drawFlowerBush(r, flower = '#f7e3a0', heart = '#e98a2c') {
    const w = 280, h = 170, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    const greens = ['#4d8160', '#3f6f52', '#6f9a58', '#8aa64e'];
    for (let i = 0; i < 13; i++) {
        const a = -Math.PI / 2 + (i / 12 - 0.5) * 2.5, len = 78 + r() * 50;
        const tx = cx + Math.cos(a) * len * 1.25, ty = by + Math.sin(a) * len;
        const nx = Math.cos(a + Math.PI / 2) * 17, ny = Math.sin(a + Math.PI / 2) * 17;
        const mx = (cx + tx) / 2, my = (by + ty) / 2;
        g.fillStyle = greens[i % greens.length];
        g.beginPath(); g.moveTo(cx, by);
        g.quadraticCurveTo(mx + nx, my + ny, tx, ty);
        g.quadraticCurveTo(mx - nx, my - ny, cx, by);
        g.fill();
    }
    for (let i = 0; i < 6; i++) {
        const fx = cx + (r() - .5) * 190, fy = by - 40 - r() * 80, rad = 12 + r() * 5;
        g.fillStyle = flower;
        for (let p = 0; p < 5; p++) {
            const a = p / 5 * Math.PI * 2;
            g.beginPath(); g.arc(fx + Math.cos(a) * rad * 0.75, fy + Math.sin(a) * rad * 0.75, rad * 0.62, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = heart; g.beginPath(); g.arc(fx, fy, rad * 0.45, 0, Math.PI * 2); g.fill();
    }
    return paperize(c, 6, r);
}

export function drawReeds(r) {
    const w = 220, h = 250, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    const cols = ['#8a8f3c', '#a8a04a', '#6f7d3a', '#c2b257'];
    const tips = [];
    for (let i = 0; i < 13; i++) {
        const lean = (i / 12 - 0.5) * 2, len = 120 + r() * 95;
        const tx = cx + lean * 78 + (r() - .5) * 14, ty = by - len;
        g.strokeStyle = cols[i % cols.length]; g.lineWidth = 9 - Math.abs(lean) * 3; g.lineCap = 'round';
        g.beginPath(); g.moveTo(cx + lean * 16, by); g.quadraticCurveTo(cx + lean * 30, by - len * 0.55, tx, ty); g.stroke();
        if (i % 3 === 1) tips.push([tx, ty, lean]);
    }
    for (const [tx, ty, lean] of tips) {
        g.save(); g.translate(tx, ty + 14); g.rotate(lean * 0.3);
        g.fillStyle = '#b8362a';
        g.beginPath(); g.roundRect(-8, -30, 16, 46, 8); g.fill();
        g.restore();
    }
    return paperize(c, 6, r);
}

export function drawRock(r, variant = 'normal') {
    const w = 210, h = 140;
    const [c, g] = mk(w, h);
    const by = h - 16;
    const pts = variant === 'flat'
        ? [[20, by], [34, by - 30 - r() * 8], [92, by - 44 - r() * 8], [156, by - 36 - r() * 8], [190, by]]
        : variant === 'small'
            ? [[42, by], [54, by - 42 - r() * 10], [104, by - 64 - r() * 10], [154, by - 46 - r() * 8], [168, by]]
            : [[22, by], [34, by - 52 - r() * 14], [84, by - 92 - r() * 16], [140, by - 78 - r() * 14], [186, by - 34], [190, by]];
    g.fillStyle = '#9b8a76'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
    g.fillStyle = '#bcab92'; g.beginPath(); g.moveTo(pts[1][0], pts[1][1]); g.lineTo(pts[2][0], pts[2][1]); g.lineTo(pts[3][0], pts[3][1]); g.lineTo(108, by - (variant === 'flat' ? 20 : 44)); g.closePath(); g.fill();
    if (variant !== 'flat') {
        g.fillStyle = 'rgba(70,45,30,.25)'; g.beginPath(); g.moveTo(pts[3][0], pts[3][1]); g.lineTo(pts[4][0], pts[4][1]);
        if (pts[5]) g.lineTo(pts[5][0], pts[5][1]);
        g.lineTo(118, by); g.lineTo(108, by - 44); g.closePath(); g.fill();
    }
    if (variant === 'flat' || variant === 'normal') {   // vệt rêu nhỏ kiểu làng quê
        g.fillStyle = '#6c964d'; g.beginPath(); g.ellipse(82, by - (variant === 'flat' ? 32 : 70), 18, 6, -0.2, 0, Math.PI * 2); g.fill();
    }
    return paperize(c, 6, r);
}

// ---------- Nhà dân (hỗ trợ biến thể mái 'red' | 'brown' | 'blue' và tường 'cream' | 'stone') ----------
export function drawHouse(r, opts = {}) {
    const w = 560, h = 440;
    const [c, g] = mk(w, h);
    const by = h - 18;
    const roofCol = opts.roof === 'brown' ? '#9e5c36' : opts.roof === 'blue' ? '#4a72a8' : '#d2532c';
    const roofDark = opts.roof === 'brown' ? 'rgba(72,36,16,.45)' : opts.roof === 'blue' ? 'rgba(32,48,80,.45)' : 'rgba(120,30,15,.45)';
    const wallCol = opts.wall === 'stone' ? '#cfc4ae' : '#ecdcb8';
    // ống khói
    g.fillStyle = '#9c5a3a'; g.fillRect(380, 60, 46, 110);
    g.fillStyle = '#7c4328'; g.fillRect(374, 52, 58, 16);
    // tường
    g.fillStyle = wallCol; g.fillRect(90, 210, 380, by - 210);
    if (opts.wall === 'stone') {
        g.strokeStyle = 'rgba(110,96,76,.35)'; g.lineWidth = 3;
        for (let y = 246; y < by; y += 34) {
            g.beginPath(); g.moveTo(94, y); g.lineTo(466, y); g.stroke();
            for (let x = 110 + ((y / 34) % 2) * 32; x < 450; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, Math.min(by, y + 34)); g.stroke(); }
        }
    }
    g.strokeStyle = '#8a5a34'; g.lineWidth = 9;
    g.strokeRect(94, 214, 372, by - 218);
    g.beginPath(); g.moveTo(280, 214); g.lineTo(280, by); g.moveTo(94, 300); g.lineTo(466, 300); g.stroke();
    // mái
    g.fillStyle = roofCol;
    g.beginPath(); g.moveTo(40, 226); g.lineTo(150, 50); g.lineTo(410, 50); g.lineTo(520, 226); g.closePath(); g.fill();
    g.strokeStyle = roofDark; g.lineWidth = 4;
    for (let row = 1; row < 5; row++) {
        const y = 50 + row * 36, inset = 110 - row * 22.5;
        g.beginPath(); g.moveTo(40 + inset, y); g.lineTo(520 - inset, y); g.stroke();
        for (let x = 40 + inset + (row % 2 ? 18 : 36); x < 520 - inset; x += 36) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 36); g.stroke(); }
    }
    // cửa + cửa sổ sáng đèn
    g.fillStyle = '#7a4a2b'; g.beginPath(); g.roundRect(246, 318, 68, by - 318, [30, 30, 0, 0]); g.fill();
    g.fillStyle = '#e6b84a'; g.beginPath(); g.arc(298, 376, 5, 0, Math.PI * 2); g.fill();
    for (const x of [130, 370]) {
        g.fillStyle = '#ffd96e'; g.fillRect(x, 318, 64, 62);
        g.strokeStyle = '#8a5a34'; g.lineWidth = 7; g.strokeRect(x, 318, 64, 62);
        g.beginPath(); g.moveTo(x + 32, 318); g.lineTo(x + 32, 380); g.stroke();
    }
    return paperize(c, 9, r);
}

// Nhà bà Mira (Trưởng làng): mái xanh đá cao + đầu hồi gỗ + bậu hoa
export function drawChiefHouse(r) {
    const w = 560, h = 440;
    const [c, g] = mk(w, h);
    const by = h - 18;
    // ống khói gạch
    g.fillStyle = '#8e5136'; g.fillRect(396, 44, 48, 120);
    g.fillStyle = '#6c3b25'; g.fillRect(390, 36, 60, 16);
    // thân nhà 2 tầng nhẹ: đá chân tường + trát vôi khung gỗ trên
    g.fillStyle = '#c8bca6'; g.fillRect(76, 304, 408, by - 304);
    g.fillStyle = '#f2e3c4'; g.fillRect(76, 200, 408, 108);
    g.strokeStyle = '#744b2b'; g.lineWidth = 9;
    g.strokeRect(80, 204, 400, by - 208);
    g.beginPath(); g.moveTo(80, 304); g.lineTo(480, 304);
    g.moveTo(190, 204); g.lineTo(190, by); g.moveTo(370, 204); g.lineTo(370, by); g.stroke();
    // mái ngói xanh lam + đầu hồi tam giác giữa
    g.fillStyle = '#48698c';
    g.beginPath(); g.moveTo(34, 214); g.lineTo(132, 46); g.lineTo(428, 46); g.lineTo(526, 214); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(25,38,60,.42)'; g.lineWidth = 4;
    for (let row = 1; row < 5; row++) {
        const y = 46 + row * 34, inset = 98 - row * 19.6;
        g.beginPath(); g.moveTo(34 + inset, y); g.lineTo(526 - inset, y); g.stroke();
    }
    // đầu hồi giữa nổi bật
    g.fillStyle = '#f2e3c4';
    g.beginPath(); g.moveTo(206, 204); g.lineTo(280, 88); g.lineTo(354, 204); g.closePath(); g.fill();
    g.strokeStyle = '#744b2b'; g.lineWidth = 8; g.stroke();
    g.fillStyle = '#3b5776';
    g.beginPath(); g.moveTo(192, 208); g.lineTo(280, 74); g.lineTo(368, 208); g.lineTo(348, 208); g.lineTo(280, 98); g.lineTo(212, 208); g.closePath(); g.fill();
    // cửa gỗ lớn + hiên nhỏ + 2 cửa sổ sáng + bồn hoa
    g.fillStyle = '#6d4126'; g.beginPath(); g.roundRect(242, 314, 76, by - 314, [34, 34, 0, 0]); g.fill();
    g.strokeStyle = '#4a2b17'; g.lineWidth = 5; g.beginPath(); g.moveTo(280, 314); g.lineTo(280, by); g.stroke();
    g.fillStyle = '#ffd666'; g.beginPath(); g.arc(280, 152, 18, 0, Math.PI * 2); g.fill();
    for (const x of [112, 386]) {
        g.fillStyle = '#ffd96e'; g.fillRect(x, 316, 62, 58);
        g.strokeStyle = '#744b2b'; g.lineWidth = 6; g.strokeRect(x, 316, 62, 58);
        g.fillStyle = '#8b5732'; g.fillRect(x - 6, 372, 74, 14);
        g.fillStyle = '#4d814b'; g.beginPath(); g.arc(x + 14, 370, 9, 0, Math.PI * 2); g.arc(x + 31, 368, 10, 0, Math.PI * 2); g.arc(x + 48, 370, 9, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e05344'; g.beginPath(); g.arc(x + 18, 367, 4, 0, Math.PI * 2); g.arc(x + 44, 367, 4, 0, Math.PI * 2); g.fill();
    }
    return paperize(c, 9, r);
}

// Lò rèn bác Borin: tường đá + ống khói bự + mái hiên rèn đỏ rực lửa
export function drawSmithy(r) {
    const w = 560, h = 440;
    const [c, g] = mk(w, h);
    const by = h - 18;
    // ống khói đá lớn bên phải
    g.fillStyle = '#6f6962'; g.fillRect(386, 34, 72, 190);
    g.fillStyle = '#57524c'; g.fillRect(378, 28, 88, 18);
    // thân xưởng đá
    g.fillStyle = '#a89f92'; g.fillRect(76, 214, 326, by - 214);
    g.strokeStyle = '#5c5248'; g.lineWidth = 8; g.strokeRect(80, 218, 318, by - 222);
    // mái ngói xám than
    g.fillStyle = '#595d67';
    g.beginPath(); g.moveTo(42, 226); g.lineTo(132, 76); g.lineTo(356, 76); g.lineTo(426, 226); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(30,32,38,.45)'; g.lineWidth = 4;
    for (let row = 1; row < 4; row++) {
        const y = 76 + row * 38, inset = 90 - row * 22.5;
        g.beginPath(); g.moveTo(42 + inset, y); g.lineTo(426 - inset, y); g.stroke();
    }
    // mái hiên bên phải che lò than
    g.fillStyle = '#8b4e30';
    g.beginPath(); g.moveTo(376, 240); g.lineTo(520, 286); g.lineTo(520, 304); g.lineTo(376, 260); g.closePath(); g.fill();
    g.fillStyle = '#5c3c22'; g.fillRect(490, 294, 16, by - 294);
    // lò nung rực đỏ + cửa xưởng
    g.fillStyle = '#47423e'; g.beginPath(); g.roundRect(402, 316, 76, by - 316, [34, 34, 0, 0]); g.fill();
    g.fillStyle = '#ff6a22'; g.beginPath(); g.roundRect(418, 344, 44, by - 344, [20, 20, 0, 0]); g.fill();
    g.fillStyle = '#ffd25a'; g.beginPath(); g.arc(440, 396, 16, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#683f25'; g.beginPath(); g.roundRect(200, 306, 84, by - 306, [36, 36, 0, 0]); g.fill();
    // cửa sổ + biển búa đe trên tường
    g.fillStyle = '#ffaa44'; g.fillRect(114, 292, 56, 52);
    g.strokeStyle = '#5c3c22'; g.lineWidth = 6; g.strokeRect(114, 292, 56, 52);
    g.fillStyle = '#d4a038'; g.beginPath(); g.arc(336, 278, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#333'; g.fillRect(324, 272, 24, 12);
    return paperize(c, 9, r);
}

// Quán cô Lena: nhà 2 tầng rộng rãi + mái hiên sọc + biển cốc bia
export function drawTavern(r) {
    const w = 560, h = 440;
    const [c, g] = mk(w, h);
    const by = h - 18;
    // ống khói
    g.fillStyle = '#925235'; g.fillRect(116, 48, 46, 118);
    // tầng trệt đá ấm + tầng 2 trát vôi khung gỗ
    g.fillStyle = '#c4b39b'; g.fillRect(58, 298, 444, by - 298);
    g.fillStyle = '#f3e3c2'; g.fillRect(58, 198, 444, 102);
    g.strokeStyle = '#74482a'; g.lineWidth = 9; g.strokeRect(62, 202, 436, by - 206);
    g.beginPath(); g.moveTo(62, 298); g.lineTo(498, 298);
    g.moveTo(190, 202); g.lineTo(190, by); g.moveTo(370, 202); g.lineTo(370, by); g.stroke();
    // mái ngói đỏ cam rộng
    g.fillStyle = '#c9492a';
    g.beginPath(); g.moveTo(22, 210); g.lineTo(116, 46); g.lineTo(444, 46); g.lineTo(538, 210); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(110,28,15,.42)'; g.lineWidth = 4;
    for (let row = 1; row < 5; row++) {
        const y = 46 + row * 33, inset = 94 - row * 18.8;
        g.beginPath(); g.moveTo(22 + inset, y); g.lineTo(538 - inset, y); g.stroke();
    }
    // cửa sổ tầng 2 sáng đèn ấm
    for (const x of [100, 248, 398]) {
        g.fillStyle = '#ffdf78'; g.fillRect(x, 224, 60, 52);
        g.strokeStyle = '#74482a'; g.lineWidth = 6; g.strokeRect(x, 224, 60, 52);
        g.beginPath(); g.moveTo(x + 30, 224); g.lineTo(x + 30, 276); g.stroke();
    }
    // mái hiên sọc đỏ kem trước quán + cửa lớn + cửa sổ trệt
    for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#f6e9cd' : '#d2532c';
        g.fillRect(206 + i * 22, 292, 22, 34);
    }
    g.fillStyle = '#6f4124'; g.beginPath(); g.roundRect(244, 326, 72, by - 326, [24, 24, 0, 0]); g.fill();
    for (const x of [100, 398]) {
        g.fillStyle = '#ffd96e'; g.fillRect(x, 326, 60, 54);
        g.strokeStyle = '#74482a'; g.lineWidth = 6; g.strokeRect(x, 326, 60, 54);
    }
    return paperize(c, 9, r);
}

// Giếng cổ: thành đá + cột gỗ + mái ngói nhỏ + xô treo
export function drawWell(r) {
    const w = 300, h = 340, cx = w / 2, by = h - 18;
    const [c, g] = mk(w, h);
    // cột gỗ hai bên
    g.fillStyle = '#7a4b2b'; g.fillRect(72, 114, 22, 166); g.fillRect(206, 114, 22, 166);
    // trục quay & xô nước
    g.fillStyle = '#5c381f'; g.fillRect(78, 148, 144, 12);
    g.strokeStyle = '#cbb389'; g.lineWidth = 4; g.beginPath(); g.moveTo(150, 156); g.lineTo(150, 212); g.stroke();
    g.fillStyle = '#8b5832'; g.fillRect(134, 212, 32, 30);
    // thành giếng đá tròn
    g.fillStyle = '#a59e90'; g.beginPath(); g.roundRect(56, by - 88, 188, 88, 18); g.fill();
    g.fillStyle = '#bfb7a6'; g.beginPath(); g.ellipse(cx, by - 86, 94, 22, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3c96a4'; g.beginPath(); g.ellipse(cx, by - 86, 66, 13, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(70,60,48,.35)'; g.lineWidth = 3;
    for (let x = 86; x < 230; x += 36) { g.beginPath(); g.moveTo(x, by - 66); g.lineTo(x, by); g.stroke(); }
    // mái ngói nhỏ
    g.fillStyle = '#b95932';
    g.beginPath(); g.moveTo(38, 128); g.lineTo(cx, 38); g.lineTo(262, 128); g.closePath(); g.fill();
    g.strokeStyle = '#74361d'; g.lineWidth = 5; g.stroke();
    return paperize(c, 8, r);
}

// Bảng ải / bảng tin (daily = true: bảng Việc hôm nay màu xanh ngọc viền vàng)
export function drawBoard(r, daily = false) {
    const w = 280, h = 260, cx = w / 2, by = h - 18;
    const [c, g] = mk(w, h);
    g.fillStyle = '#6d4326'; g.fillRect(70, 90, 20, by - 90); g.fillRect(190, 90, 20, by - 90);
    g.fillStyle = daily ? '#2f6a64' : '#9c6b3b'; g.beginPath(); g.roundRect(38, 56, 204, 120, 12); g.fill();
    g.strokeStyle = daily ? '#e6b84a' : '#5e3b1f'; g.lineWidth = 8; g.stroke();
    // mái gỗ nhỏ che mưa
    g.fillStyle = daily ? '#3b5776' : '#7a4826';
    g.beginPath(); g.moveTo(26, 64); g.lineTo(cx, 26); g.lineTo(254, 64); g.closePath(); g.fill();
    // giấy thông báo dán trên bảng
    const notes = [[56, 74, 52, 66, '#f6ebd0'], [122, 82, 54, 54, '#efe0b8'], [184, 72, 42, 64, '#f8f0da']];
    for (const [nx, ny, nw, nh, col] of notes) {
        g.fillStyle = col; g.fillRect(nx, ny, nw, nh);
        g.fillStyle = '#c9472e'; g.beginPath(); g.arc(nx + nw / 2, ny + 8, 5, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(90,60,35,.45)'; g.fillRect(nx + 8, ny + 22, nw - 16, 4); g.fillRect(nx + 8, ny + 34, nw - 20, 4);
    }
    return paperize(c, 7, r);
}

// Sạp chợ mái bạt sọc + hoa quả trên quầy
export function drawStall(r) {
    const w = 320, h = 280, cx = w / 2, by = h - 18;
    const [c, g] = mk(w, h);
    // 2 cột sau
    g.fillStyle = '#6c4225'; g.fillRect(52, 82, 16, by - 82); g.fillRect(252, 82, 16, by - 82);
    // quầy hàng + hoa quả
    g.fillStyle = '#a06a3b'; g.fillRect(44, by - 88, 232, 88);
    g.strokeStyle = '#5c381f'; g.lineWidth = 5; g.strokeRect(44, by - 88, 232, 88);
    for (const [bx, col] of [[92, '#e24c38'], [148, '#f0b83a'], [208, '#7ab344']]) {
        g.fillStyle = '#c68e50'; g.fillRect(bx - 22, by - 102, 44, 18);
        g.fillStyle = col; g.beginPath(); g.arc(bx - 8, by - 104, 10, 0, Math.PI * 2); g.arc(bx + 8, by - 104, 10, 0, Math.PI * 2); g.arc(bx, by - 114, 10, 0, Math.PI * 2); g.fill();
    }
    // mái bạt sọc cam kem
    g.fillStyle = '#d95b2b';
    g.beginPath(); g.moveTo(24, 96); g.lineTo(54, 34); g.lineTo(266, 34); g.lineTo(296, 96); g.closePath(); g.fill();
    for (let i = 0; i < 6; i++) {
        g.fillStyle = i % 2 ? '#f6e9cd' : '#d2532c';
        g.beginPath(); g.roundRect(26 + i * 44.5, 92, 44.5, 28, [0, 0, 14, 14]); g.fill();
    }
    return paperize(c, 8, r);
}

// Khóm cây trồng trong vườn rau nhà bà Mira
export function drawGardenCrops(r) {
    const w = 260, h = 150, by = h - 16;
    const [c, g] = mk(w, h);
    for (let i = 0; i < 3; i++) {
        const x = 52 + i * 76;
        g.fillStyle = i === 1 ? '#e27b2b' : '#4e8a48';
        g.beginPath(); g.arc(x, by - 26, 26, 0, Math.PI * 2); g.fill();
        g.fillStyle = i === 1 ? '#f5a642' : '#73b45e';
        g.beginPath(); g.arc(x - 6, by - 32, 14, 0, Math.PI * 2); g.fill();
        if (i === 1) { g.fillStyle = '#477a3e'; g.fillRect(x - 4, by - 58, 8, 12); }
    }
    return paperize(c, 6, r);
}

// ---------- Đồ vật nhỏ & trung bình trên đường phố Ashford ----------
export function drawFence(r, variant = 'simple') {
    const w = 240, h = 160, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#9a683a';
    if (variant === 'planks') {
        for (let i = 0; i < 5; i++) {
            const x = 32 + i * 40;
            g.beginPath(); g.moveTo(x, by); g.lineTo(x, 42); g.lineTo(x + 14, 24); g.lineTo(x + 28, 42); g.lineTo(x + 28, by); g.closePath(); g.fill();
        }
        g.fillStyle = '#784c27'; g.fillRect(24, 62, 192, 14); g.fillRect(24, 108, 192, 14);
    } else {
        for (const x of [36, 110, 184]) {
            g.beginPath(); g.roundRect(x, 34, 22, by - 34, [10, 10, 2, 2]); g.fill();
        }
        g.fillStyle = '#b47d49'; g.fillRect(24, 58, 192, 14); g.fillRect(24, 100, 192, 14);
    }
    return paperize(c, 6, r);
}

export function drawLampPost(r) {
    const w = 180, h = 280, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    // đế đá vững + trụ sắt thẳng đứng chính giữa (cân xứng, không nghiêng lệch)
    g.fillStyle = '#8b8579'; g.beginPath(); g.roundRect(cx - 22, by - 26, 44, 26, 6); g.fill();
    g.fillStyle = '#3d4550'; g.fillRect(cx - 13, by - 36, 26, 12); g.fillRect(cx - 7, 88, 14, by - 122);
    g.fillRect(cx - 18, 92, 36, 8);
    // lồng đèn kính vàng đặt cân đối trên đỉnh cột
    g.fillStyle = '#ffe078'; g.fillRect(cx - 15, 56, 30, 34);
    g.strokeStyle = '#2d333c'; g.lineWidth = 4; g.strokeRect(cx - 15, 56, 30, 34);
    g.beginPath(); g.moveTo(cx, 56); g.lineTo(cx, 90); g.stroke();
    g.fillStyle = '#2d333c';
    g.beginPath(); g.moveTo(cx - 22, 58); g.lineTo(cx, 34); g.lineTo(cx + 22, 58); g.closePath(); g.fill();
    g.beginPath(); g.arc(cx, 31, 5, 0, Math.PI * 2); g.fill();
    return paperize(c, 6, r);
}

export function drawUnknownCard(r) {
    const w = 160, h = 180, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#efe0b8'; g.beginPath(); g.roundRect(cx - 42, by - 108, 84, 108, 14); g.fill();
    g.strokeStyle = '#9c6b3b'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#7a4b2b'; g.font = '900 58px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('?', cx, by - 52);
    return paperize(c, 6, r);
}

export function drawAnvil(r) {
    const w = 180, h = 160, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#7c4c2a'; g.beginPath(); g.roundRect(cx - 34, by - 48, 68, 48, 6); g.fill();
    g.fillStyle = '#4e5660'; g.fillRect(cx - 26, by - 76, 52, 30);
    g.fillStyle = '#687380';
    g.beginPath(); g.moveTo(cx - 56, by - 94); g.lineTo(cx + 46, by - 94); g.lineTo(cx + 58, by - 76); g.lineTo(cx - 36, by - 72); g.closePath(); g.fill();
    g.fillStyle = '#9aa6b4'; g.fillRect(cx - 34, by - 94, 72, 7);
    return paperize(c, 6, r);
}

export function drawBarrel(r) {
    const w = 160, h = 170, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#a06839'; g.beginPath(); g.ellipse(cx, by - 58, 44, 58, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c4874e'; g.beginPath(); g.ellipse(cx, by - 104, 34, 12, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#4a4e54'; g.fillRect(cx - 42, by - 84, 84, 10); g.fillRect(cx - 41, by - 36, 82, 10);
    return paperize(c, 6, r);
}

export function drawCrate(r, large = false) {
    const w = 170, h = 165, cx = w / 2, by = h - 16, sz = large ? 96 : 78;
    const [c, g] = mk(w, h);
    g.fillStyle = '#b47c45'; g.fillRect(cx - sz / 2, by - sz, sz, sz);
    g.strokeStyle = '#6c4322'; g.lineWidth = 7; g.strokeRect(cx - sz / 2, by - sz, sz, sz);
    g.beginPath(); g.moveTo(cx - sz / 2, by - sz); g.lineTo(cx + sz / 2, by); g.moveTo(cx + sz / 2, by - sz); g.lineTo(cx - sz / 2, by); g.stroke();
    return paperize(c, 6, r);
}

export function drawSacks(r) {
    const w = 180, h = 150, by = h - 16;
    const [c, g] = mk(w, h);
    for (const [sx, sy, rad] of [[68, by - 26, 32], [114, by - 24, 30], [90, by - 56, 26]]) {
        g.fillStyle = '#ccb080'; g.beginPath(); g.ellipse(sx, sy, rad, rad * 0.85, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#a98c5d'; g.beginPath(); g.ellipse(sx + 8, sy + 6, rad * 0.65, rad * 0.55, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#7e5a32'; g.fillRect(sx - 10, sy - rad * 0.85, 20, 7);
    }
    return paperize(c, 6, r);
}

export function drawWoodpile(r) {
    const w = 190, h = 150, by = h - 16;
    const [c, g] = mk(w, h);
    const logs = [[52, by - 16], [84, by - 16], [116, by - 16], [68, by - 42], [100, by - 42], [84, by - 66]];
    for (const [lx, ly] of logs) {
        g.fillStyle = '#7e4d29'; g.beginPath(); g.arc(lx, ly, 15, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#dfbe86'; g.beginPath(); g.arc(lx, ly, 10, 0, Math.PI * 2); g.fill();
    }
    // gốc chặt nhỏ bên cạnh
    g.fillStyle = '#784828'; g.fillRect(136, by - 36, 26, 36);
    g.fillStyle = '#e5c994'; g.beginPath(); g.ellipse(149, by - 36, 13, 6, 0, 0, Math.PI * 2); g.fill();
    return paperize(c, 6, r);
}

export function drawHaystack(r) {
    const w = 200, h = 170, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#deb141';
    g.beginPath(); g.moveTo(30, by); g.quadraticCurveTo(44, 34, cx, 28); g.quadraticCurveTo(156, 34, 170, by); g.closePath(); g.fill();
    g.strokeStyle = '#9f6e1c'; g.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
        const x = 52 + r() * 96, y = 56 + r() * 82;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 16, y + 18); g.stroke();
    }
    return paperize(c, 6, r);
}

export function drawTavernTable(r) {
    const w = 210, h = 160, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    // 2 ghế đẩu
    for (const sx of [38, 172]) {
        g.fillStyle = '#704324'; g.fillRect(sx - 10, by - 34, 20, 34);
        g.fillStyle = '#a46e3c'; g.beginPath(); g.ellipse(sx, by - 34, 18, 7, 0, 0, Math.PI * 2); g.fill();
    }
    // bàn tròn gỗ + 2 cốc bia
    g.fillStyle = '#5c381f'; g.fillRect(cx - 10, by - 56, 20, 56);
    g.fillStyle = '#9c6638'; g.beginPath(); g.ellipse(cx, by - 58, 48, 16, 0, 0, Math.PI * 2); g.fill();
    for (const mx of [cx - 18, cx + 14]) {
        g.fillStyle = '#c88c32'; g.fillRect(mx - 6, by - 78, 12, 18);
        g.fillStyle = '#fff5dc'; g.fillRect(mx - 6, by - 82, 12, 5);
    }
    return paperize(c, 6, r);
}

export function drawBench(r) {
    const w = 200, h = 140, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#684023'; g.fillRect(42, by - 34, 14, 34); g.fillRect(144, by - 34, 14, 34);
    g.fillStyle = '#9e6a3c'; g.fillRect(32, by - 44, 136, 14);
    g.fillStyle = '#8b5a30'; g.fillRect(38, by - 74, 124, 24);
    return paperize(c, 6, r);
}

export function drawSignpost(r) {
    const w = 180, h = 210, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#6c4225'; g.fillRect(cx - 8, 42, 16, by - 42);
    g.fillStyle = '#c58e52';
    g.beginPath(); g.moveTo(42, 52); g.lineTo(132, 52); g.lineTo(148, 66); g.lineTo(132, 80); g.lineTo(42, 80); g.closePath(); g.fill();
    g.fillStyle = '#b47c44';
    g.beginPath(); g.moveTo(138, 92); g.lineTo(48, 92); g.lineTo(32, 106); g.lineTo(48, 120); g.lineTo(138, 120); g.closePath(); g.fill();
    return paperize(c, 6, r);
}

export function drawShopSign(r, kind = 'tavern') {
    const w = 160, h = 220, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#4e341e'; g.fillRect(cx - 28, 34, 12, by - 34); g.fillRect(cx - 24, 38, 66, 10);
    g.fillStyle = kind === 'forge' ? '#434a54' : '#9c5a2b'; g.beginPath(); g.roundRect(cx + 2, 54, 54, 48, 8); g.fill();
    g.fillStyle = kind === 'forge' ? '#f39c12' : '#fde066';
    g.beginPath(); g.arc(cx + 29, 78, 14, 0, Math.PI * 2); g.fill();
    return paperize(c, 6, r);
}

export function drawFlowerPot(r, flower = '#e04f3d') {
    const w = 140, h = 150, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#b8633b';
    g.beginPath(); g.moveTo(cx - 24, by - 40); g.lineTo(cx + 24, by - 40); g.lineTo(cx + 18, by); g.lineTo(cx - 18, by); g.closePath(); g.fill();
    g.fillStyle = '#4c8848'; g.beginPath(); g.arc(cx, by - 54, 22, 0, Math.PI * 2); g.fill();
    for (const [dx, dy] of [[-12, -62], [10, -64], [0, -74]]) {
        g.fillStyle = flower; g.beginPath(); g.arc(cx + dx, by + dy, 9, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(cx + dx, by + dy, 3.5, 0, Math.PI * 2); g.fill();
    }
    return paperize(c, 5, r);
}

export function drawForgeProps(r) {
    const w = 220, h = 170, by = h - 16;
    const [c, g] = mk(w, h);
    // giá kiếm bên phải
    g.fillStyle = '#5e3c22'; g.fillRect(114, by - 82, 74, 82);
    for (const x of [130, 150, 170]) {
        g.fillStyle = '#c8d0d8'; g.fillRect(x - 4, by - 104, 8, 72);
        g.fillStyle = '#d4a038'; g.fillRect(x - 10, by - 96, 20, 6);
    }
    // đống than hồng bên trái
    g.fillStyle = '#2d2a28'; g.beginPath(); g.ellipse(64, by - 20, 40, 22, 0, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#ff5e1e'; g.beginPath(); g.arc(54, by - 14, 11, 0, Math.PI * 2); g.arc(74, by - 16, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd24d'; g.beginPath(); g.arc(62, by - 15, 6, 0, Math.PI * 2); g.fill();
    return paperize(c, 6, r);
}

export function drawStonePile(r) {
    const w = 180, h = 140, by = h - 16;
    const [c, g] = mk(w, h);
    for (const [x, y, rw, rh, col] of [[44, by - 28, 46, 28, '#95918a'], [94, by - 28, 46, 28, '#a7a299'], [68, by - 56, 48, 28, '#b8b2a8']]) {
        g.fillStyle = col; g.beginPath(); g.roundRect(x, y, rw, rh, 6); g.fill();
        g.strokeStyle = '#625e58'; g.lineWidth = 3; g.stroke();
    }
    return paperize(c, 6, r);
}

export function drawScarecrow(r) {
    const w = 190, h = 240, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#6c4224'; g.fillRect(cx - 7, 72, 14, by - 72); g.fillRect(38, 102, 114, 12);
    g.fillStyle = '#4c6fa4'; g.beginPath(); g.roundRect(cx - 26, 96, 52, 66, 8); g.fill();
    g.fillStyle = '#e5c470'; g.beginPath(); g.arc(cx, 70, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#684a26'; g.beginPath(); g.moveTo(cx - 34, 58); g.lineTo(cx + 34, 58); g.lineTo(cx, 24); g.closePath(); g.fill();
    return paperize(c, 6, r);
}

export function drawVeggieBasket(r) {
    const w = 170, h = 140, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    for (const [bx, col] of [[cx - 26, '#e26a2c'], [cx, '#4da048'], [cx + 26, '#d9483b']]) {
        g.fillStyle = '#9c6b3b'; g.fillRect(bx - 16, by - 26, 32, 26);
        g.fillStyle = col; g.beginPath(); g.arc(bx, by - 30, 14, 0, Math.PI * 2); g.fill();
    }
    return paperize(c, 5, r);
}

export function drawPumpkin(r) {
    const w = 150, h = 140, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#4f853e'; g.fillRect(cx - 4, by - 64, 8, 16);
    g.fillStyle = '#de6d24'; g.beginPath(); g.ellipse(cx - 16, by - 26, 20, 26, 0, 0, Math.PI * 2); g.ellipse(cx + 16, by - 26, 20, 26, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f0862e'; g.beginPath(); g.ellipse(cx, by - 26, 18, 28, 0, 0, Math.PI * 2); g.fill();
    return paperize(c, 5, r);
}

export function drawCart(r, high = false) {
    const w = 220, h = 180, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#704525'; g.fillRect(36, by - 56, 128, 14);
    g.fillStyle = '#a46c3c'; g.fillRect(46, by - (high ? 104 : 84), 110, high ? 52 : 34);
    g.fillStyle = '#d4b47c'; g.beginPath(); g.arc(82, by - (high ? 106 : 86), 20, Math.PI, 0); g.arc(124, by - (high ? 106 : 86), 18, Math.PI, 0); g.fill();
    for (const wx of [66, 140]) {
        g.fillStyle = '#5e391e'; g.beginPath(); g.arc(wx, by - 24, 24, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#cfa062'; g.beginPath(); g.arc(wx, by - 24, 12, 0, Math.PI * 2); g.fill();
    }
    return paperize(c, 6, r);
}

export function drawClothesline(r) {
    const w = 220, h = 180, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#6a4526'; g.fillRect(28, 36, 12, by - 36); g.fillRect(180, 36, 12, by - 36);
    g.strokeStyle = '#d8cbb8'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(34, 48); g.quadraticCurveTo(110, 68, 186, 48); g.stroke();
    const cols = ['#df4c3a', '#488cc4', '#f2c249', '#64ad64'];
    for (let i = 0; i < 4; i++) {
        const x = 52 + i * 34, y = 56 + (i === 1 || i === 2 ? 4 : 0);
        g.fillStyle = cols[i]; g.beginPath(); g.roundRect(x, y, 24, 34, 4); g.fill();
    }
    return paperize(c, 6, r);
}

export function drawMushroom(r, variant = 'red') {
    const w = 160, h = 150, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    const items = variant === 'red' ? [[cx - 18, by, 1.0], [cx + 22, by, 0.72]] : [[cx - 16, by, 0.9], [cx + 20, by, 0.8]];
    for (const [mx, my, sc] of items) {
        g.fillStyle = '#f2e3c2'; g.fillRect(mx - 8 * sc, my - 38 * sc, 16 * sc, 38 * sc);
        g.fillStyle = variant === 'red' ? '#cf3f2c' : '#c48d52';
        g.beginPath(); g.ellipse(mx, my - 38 * sc, 28 * sc, 20 * sc, 0, Math.PI, 0); g.closePath(); g.fill();
        if (variant === 'red') {
            g.fillStyle = '#fff5dc'; g.beginPath(); g.arc(mx - 10 * sc, my - 46 * sc, 5 * sc, 0, Math.PI * 2); g.arc(mx + 10 * sc, my - 44 * sc, 4 * sc, 0, Math.PI * 2); g.fill();
        }
    }
    return paperize(c, 5, r);
}

export function drawLog(r) {
    const w = 190, h = 120, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#7c4c29'; g.beginPath(); g.roundRect(30, by - 42, 130, 40, 18); g.fill();
    g.fillStyle = '#dfbd82'; g.beginPath(); g.ellipse(144, by - 22, 14, 18, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5c9142'; g.beginPath(); g.ellipse(84, by - 40, 26, 7, 0, 0, Math.PI * 2); g.fill();
    return paperize(c, 5, r);
}

// ---------- Rương & Vật phẩm nhiệm vụ / khám phá ----------
export function drawChest(r, open = false) {
    const w = 180, h = 160, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    if (open) {
        g.fillStyle = '#724420'; g.fillRect(cx - 46, by - 92, 92, 34);
        g.fillStyle = '#2d1c10'; g.fillRect(cx - 42, by - 64, 84, 24);
        g.fillStyle = '#ffd24c'; g.beginPath(); g.arc(cx - 14, by - 54, 12, 0, Math.PI * 2); g.arc(cx + 12, by - 56, 13, 0, Math.PI * 2); g.fill();
    } else {
        g.fillStyle = '#9c5f2b'; g.beginPath(); g.roundRect(cx - 46, by - 80, 92, 34, [18, 18, 0, 0]); g.fill();
    }
    g.fillStyle = '#844e22'; g.fillRect(cx - 46, by - 48, 92, 48);
    g.fillStyle = '#e4b448'; g.fillRect(cx - 34, by - (open ? 48 : 80), 10, open ? 48 : 80); g.fillRect(cx + 24, by - (open ? 48 : 80), 10, open ? 48 : 80);
    g.fillRect(cx - 10, by - 56, 20, 22);
    return paperize(c, 6, r);
}

export function drawLedger(r) {
    const w = 160, h = 160, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#8a4a2b'; g.beginPath(); g.roundRect(cx - 40, by - 88, 80, 82, 8); g.fill();
    g.fillStyle = '#f6ebd0'; g.fillRect(cx - 30, by - 78, 60, 62);
    g.fillStyle = '#785032'; g.fillRect(cx - 22, by - 62, 44, 5); g.fillRect(cx - 22, by - 48, 36, 5); g.fillRect(cx - 22, by - 34, 40, 5);
    g.fillStyle = '#cf3e2c'; g.beginPath(); g.arc(cx + 16, by - 22, 8, 0, Math.PI * 2); g.fill();
    return paperize(c, 6, r);
}

export function drawCat(r) {
    const w = 170, h = 150, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.strokeStyle = '#c87e38'; g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx + 28, by - 20); g.quadraticCurveTo(cx + 58, by - 48, cx + 44, by - 74); g.stroke();
    g.fillStyle = '#d98e40'; g.beginPath(); g.ellipse(cx + 6, by - 26, 36, 24, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e59d4e'; g.beginPath(); g.arc(cx - 22, by - 48, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c87e38';
    g.beginPath(); g.moveTo(cx - 38, by - 60); g.lineTo(cx - 34, by - 84); g.lineTo(cx - 18, by - 66); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx - 18, by - 66); g.lineTo(cx - 4, by - 84); g.lineTo(cx - 2, by - 60); g.closePath(); g.fill();
    g.fillStyle = '#3b8c4c'; g.beginPath(); g.arc(cx - 28, by - 50, 3.5, 0, Math.PI * 2); g.arc(cx - 14, by - 50, 3.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f49ba8'; g.beginPath(); g.arc(cx - 21, by - 42, 3, 0, Math.PI * 2); g.fill();
    return paperize(c, 6, r);
}

export function drawDog(r) {
    const w = 180, h = 150, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#9c683a';
    for (const lx of [cx - 22, cx - 6, cx + 18, cx + 32]) g.fillRect(lx, by - 28, 9, 28);
    g.fillStyle = '#b47a44'; g.beginPath(); g.ellipse(cx + 6, by - 36, 38, 22, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx - 28, by - 56, 20, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6c4322'; g.beginPath(); g.ellipse(cx - 14, by - 54, 8, 16, 0.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2b1e16'; g.beginPath(); g.arc(cx - 42, by - 54, 4, 0, Math.PI * 2); g.arc(cx - 30, by - 60, 3, 0, Math.PI * 2); g.fill();
    return paperize(c, 6, r);
}

export function drawStele(r, mossy = true) {
    const w = 180, h = 210, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#9b968d'; g.beginPath(); g.roundRect(cx - 38, 36, 76, by - 36, [34, 34, 4, 4]); g.fill();
    g.fillStyle = '#b7b2a8'; g.beginPath(); g.roundRect(cx - 30, 44, 34, by - 52, [24, 0, 0, 4]); g.fill();
    g.fillStyle = '#635f59'; for (let y = 78; y <= 132; y += 18) g.fillRect(cx - 22, y, 44, 5);
    if (mossy) { g.fillStyle = '#5c9348'; g.beginPath(); g.arc(cx - 24, by - 14, 14, 0, Math.PI * 2); g.fill(); }
    return paperize(c, 6, r);
}

export function drawTrough(r) {
    const w = 180, h = 140, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#8b5830'; g.fillRect(cx - 52, by - 36, 104, 30);
    g.fillStyle = '#5e381c'; g.fillRect(cx - 46, by - 10, 14, 10); g.fillRect(cx + 32, by - 10, 14, 10);
    g.fillStyle = '#f2c94c'; g.beginPath(); g.ellipse(cx, by - 36, 44, 12, 0, Math.PI, 0); g.closePath(); g.fill();
    // chú gà nhỏ bên máng
    g.fillStyle = '#fff5dc'; g.beginPath(); g.arc(cx + 40, by - 48, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#df3f2e'; g.fillRect(cx + 38, by - 64, 8, 6);
    g.fillStyle = '#f2a22a'; g.fillRect(cx + 50, by - 50, 8, 5);
    return paperize(c, 5, r);
}

export function drawNest(r) {
    const w = 170, h = 130, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#a46c32'; g.beginPath(); g.ellipse(cx, by - 18, 52, 20, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7c4c1e'; g.beginPath(); g.ellipse(cx, by - 22, 36, 12, 0, 0, Math.PI * 2); g.fill();
    for (const [ex, ey] of [[cx - 18, by - 30], [cx, by - 34], [cx + 18, by - 29]]) {
        g.fillStyle = '#f8edd0'; g.beginPath(); g.ellipse(ex, ey, 11, 15, 0, 0, Math.PI * 2); g.fill();
    }
    return paperize(c, 5, r);
}

export function drawJar(r) {
    const w = 150, h = 150, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#b45e32'; g.beginPath(); g.ellipse(cx, by - 38, 36, 38, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8b421f'; g.fillRect(cx - 22, by - 82, 44, 16);
    g.fillStyle = '#e5be74'; g.fillRect(cx - 32, by - 44, 64, 8);
    return paperize(c, 5, r);
}

export function drawSignBoard(r) {
    const w = 170, h = 170, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    g.fillStyle = '#704424'; g.fillRect(cx - 8, by - 58, 16, 58);
    g.fillStyle = '#caa062'; g.beginPath(); g.roundRect(cx - 46, by - 110, 92, 60, 8); g.fill();
    g.strokeStyle = '#6c4222'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#6c4222'; g.fillRect(cx - 30, by - 92, 60, 6); g.fillRect(cx - 30, by - 76, 44, 6);
    return paperize(c, 5, r);
}

export function drawSpark(r) {
    const w = 128, h = 128, cx = w / 2, cy = h / 2;
    const [c, g] = mk(w, h);
    g.fillStyle = '#ffe678';
    g.beginPath();
    g.moveTo(cx, 16); g.quadraticCurveTo(cx + 8, cy - 8, w - 16, cy);
    g.quadraticCurveTo(cx + 8, cy + 8, cx, h - 16);
    g.quadraticCurveTo(cx - 8, cy + 8, 16, cy);
    g.quadraticCurveTo(cx - 8, cy - 8, cx, 16);
    g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, 10, 0, Math.PI * 2); g.fill();
    return paperize(c, 4, r);
}

// ---------- Con vật & hiệu ứng sống động (gà, bướm, chim, cừu, vịt, lá, khói) ----------
export function drawChicken(r, brown = false) {
    const w = 140, h = 130, cx = w / 2, by = h - 16;
    const [c, g] = mk(w, h);
    const col = brown ? '#c88344' : '#f7f1de';
    g.fillStyle = '#e29032'; g.fillRect(cx - 10, by - 16, 5, 16); g.fillRect(cx + 6, by - 16, 5, 16);
    g.fillStyle = col; g.beginPath(); g.ellipse(cx + 4, by - 32, 28, 22, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx - 18, by - 50, 15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d93829'; g.beginPath(); g.arc(cx - 18, by - 66, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f2a428'; g.beginPath(); g.moveTo(cx - 30, by - 52); g.lineTo(cx - 42, by - 48); g.lineTo(cx - 30, by - 44); g.closePath(); g.fill();
    g.fillStyle = '#2a1c14'; g.beginPath(); g.arc(cx - 22, by - 52, 2.5, 0, Math.PI * 2); g.fill();
    return paperize(c, 5, r);
}

export function drawButterfly(r, color = '#ffe066') {
    const w = 128, h = 112, cx = w / 2, cy = h / 2;
    const [c, g] = mk(w, h);
    g.fillStyle = color;
    for (const sx of [-1, 1]) {
        g.beginPath(); g.ellipse(cx + sx * 22, cy - 10, 22, 16, sx * -0.4, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(cx + sx * 16, cy + 12, 16, 12, sx * 0.4, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#4a3222'; g.beginPath(); g.roundRect(cx - 4, cy - 18, 8, 36, 4); g.fill();
    return paperize(c, 4, r);
}

export function drawBird(r, color = '#c05a3b') {
    const w = 140, h = 120, cx = w / 2, by = h - 18;
    const [c, g] = mk(w, h);
    g.fillStyle = color; g.beginPath(); g.ellipse(cx + 4, by - 28, 26, 16, -0.2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx - 16, by - 42, 13, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f2b83a'; g.beginPath(); g.moveTo(cx - 26, by - 44); g.lineTo(cx - 38, by - 40); g.lineTo(cx - 26, by - 36); g.closePath(); g.fill();
    g.fillStyle = '#2a1c14'; g.beginPath(); g.arc(cx - 20, by - 44, 2.2, 0, Math.PI * 2); g.fill();
    return paperize(c, 4, r);
}

export function drawSmokePuff() {
    const [c, g] = mk(96, 96);
    g.fillStyle = 'rgba(248, 240, 222, 0.85)';
    for (const [x, y, rad] of [[48, 48, 26], [34, 52, 18], [62, 50, 18], [48, 34, 18]]) {
        g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
    return c;
}

export function drawSheep(r) {
    const w = 210, h = 160;
    const [c, g] = mk(w, h);
    const by = h - 14;
    g.fillStyle = '#5a3a2a';
    for (const x of [78, 100, 138, 158]) g.fillRect(x, by - 34, 9, 34);
    g.fillStyle = '#f3e8d2';
    for (const [x, y, rad] of [[118, by - 62, 46], [84, by - 66, 32], [152, by - 64, 32], [104, by - 92, 28], [138, by - 92, 28], [120, by - 44, 34]]) {
        g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#4a2f24'; g.beginPath(); g.ellipse(52, by - 74, 22, 17, -0.3, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(66, by - 92, 9, 5, 0.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f6e9cd'; g.beginPath(); g.arc(46, by - 78, 3, 0, Math.PI * 2); g.fill();
    return paperize(c, 6, r);
}

export function drawDuck(r) {
    const w = 170, h = 120;
    const [c, g] = mk(w, h);
    const by = h - 16;
    g.fillStyle = '#9a6a42'; g.beginPath(); g.ellipse(92, by - 26, 56, 26, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a4e2e'; g.beginPath(); g.ellipse(104, by - 30, 34, 15, -0.15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#efe3c6'; g.fillRect(52, by - 52, 16, 9);
    g.fillStyle = '#2f7d5c'; g.beginPath(); g.roundRect(48, by - 76, 20, 34, 9); g.fill();
    g.beginPath(); g.arc(54, by - 78, 17, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f0b83a'; g.beginPath(); g.moveTo(40, by - 82); g.lineTo(18, by - 74); g.lineTo(40, by - 70); g.closePath(); g.fill();
    g.fillStyle = '#2a1c14'; g.beginPath(); g.arc(50, by - 82, 2.6, 0, Math.PI * 2); g.fill();
    return paperize(c, 5, r);
}

export function drawLeaf(color) {
    const [c, g] = mk(64, 64);
    g.translate(32, 32); g.rotate(0.6);
    g.fillStyle = color;
    g.beginPath(); g.moveTo(0, -22); g.quadraticCurveTo(18, -4, 0, 22); g.quadraticCurveTo(-18, -4, 0, -22); g.fill();
    g.strokeStyle = 'rgba(110,35,15,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -18); g.lineTo(0, 20); g.stroke();
    return c;
}

export function drawPost(r) {
    const w = 96, h = 190;
    const [c, g] = mk(w, h);
    g.fillStyle = '#b9763e'; g.beginPath(); g.roundRect(26, 16, 44, h - 30, [20, 20, 4, 4]); g.fill();
    g.strokeStyle = 'rgba(110,55,20,.5)'; g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const x = 34 + i * 9 + r() * 3; g.beginPath(); g.moveTo(x, 40 + r() * 20); g.lineTo(x + (r() - .5) * 5, h - 26); g.stroke(); }
    g.fillStyle = '#d9954e'; g.beginPath(); g.roundRect(26, 16, 44, 26, [20, 20, 0, 0]); g.fill();
    return paperize(c, 6, r);
}

export function drawDeck(r) {
    const w = 256, h = 560;
    const [c, g] = mk(w, h);
    g.fillStyle = '#f6e9cd'; g.fillRect(0, 0, w, h);
    const n = 13, ph = (h - 12) / n;
    for (let i = 0; i < n; i++) {
        g.fillStyle = ['#d7a468', '#cf9858', '#dfb074'][i % 3];
        g.fillRect(8, 6 + i * ph + 2, w - 16, ph - 4);
        g.strokeStyle = 'rgba(120,70,30,.35)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(14, 6 + i * ph + ph * (0.3 + r() * 0.4)); g.lineTo(w - 14, 6 + i * ph + ph * (0.3 + r() * 0.4)); g.stroke();
    }
    return c;
}

export function drawMarker() {
    const [c, g] = mk(128, 128);
    g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.setLineDash([22, 14]);
    g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.stroke();
    g.setLineDash([]); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 64, 9, 0, Math.PI * 2); g.fill();
    return c;
}

// bảng hình nhân vật / vật phẩm: phóng to + thêm viền giấy kem quanh từng ô
export function heroSheet(img, meta, scale = 4, pad = 14, rim = 8) {
    const cols = meta.cols ?? 3, rows = meta.rows ?? 4;
    const cw = meta.cw * scale + pad * 2, ch = meta.ch * scale + pad * 2;
    const [c, g] = mk(cw * cols, ch * rows);
    g.imageSmoothingEnabled = false;
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
        g.drawImage(img, col * meta.cw, row * meta.ch, meta.cw, meta.ch, col * cw + pad, row * ch + pad, meta.cw * scale, meta.ch * scale);
    }
    const [sil, sg] = mk(c.width, c.height);
    sg.drawImage(c, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = RIM; sg.fillRect(0, 0, c.width, c.height);
    const [out, og] = mk(c.width, c.height);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; og.drawImage(sil, Math.cos(a) * rim, Math.sin(a) * rim); }
    og.drawImage(c, 0, 0);
    return { canvas: out, cellW: cw, cellH: ch, cols, rows };
}

// Mặt đất bản thử (giữ nguyên cho src/demo/papermap.js)
export function paintGround(o) {
    const { W, H, px, pz, ppu, r } = o;
    const [c, g] = mk(W, H);
    g.fillStyle = '#b6aa74'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
        const x = r() * W, y = r() * H, rad = 140 + r() * 320;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        const col = ['150,160,96', '196,178,116', '168,150,92', '134,150,98'][i % 4];
        gr.addColorStop(0, `rgba(${col},.30)`); gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.lineCap = 'round';
    for (let i = 0; i < 16000; i++) {
        const x = r() * W, y = r() * H, a = r() * Math.PI, len = 6 + r() * 18;
        g.strokeStyle = r() < 0.5 ? 'rgba(245,235,200,.10)' : 'rgba(80,70,30,.09)';
        g.lineWidth = 0.8 + r() * 1.2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
    for (let i = 0; i < 900; i++) {
        const wx = o.x0 + r() * o.gw, wz = o.z0 + r() * o.gd;
        if (!o.free(wx, wz)) continue;
        const x = px(wx), y = pz(wz);
        g.strokeStyle = r() < 0.5 ? 'rgba(96,112,58,.55)' : 'rgba(214,196,120,.6)'; g.lineWidth = 2.4;
        for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * 4, y); g.lineTo(x + k * 9, y - 11 - r() * 5); g.stroke(); }
    }
    const blobPath = (color, grow) => {
        g.fillStyle = color;
        for (const path of o.paths) for (const [x, z] of path) {
            g.beginPath(); g.arc(px(x) + (r() - .5) * 8, pz(z) + (r() - .5) * 8, o.pathHalf * ppu * (0.86 + r() * 0.24) + grow, 0, Math.PI * 2); g.fill();
        }
    };
    blobPath('rgba(130,116,66,.55)', 7);
    blobPath('#e9dcba', 0);
    for (const path of o.paths) for (const [x, z] of path) for (let k = 0; k < 5; k++) {
        g.fillStyle = r() < 0.5 ? 'rgba(180,160,110,.35)' : 'rgba(255,250,235,.5)';
        g.fillRect(px(x) + (r() - .5) * o.pathHalf * ppu * 1.5, pz(z) + (r() - .5) * o.pathHalf * ppu * 1.5, 3, 3);
    }
    const trace = () => { g.beginPath(); o.river.forEach(([x, z], i) => i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z))); };
    g.lineJoin = 'round'; g.lineCap = 'round';
    trace(); g.strokeStyle = 'rgba(110,100,60,.35)'; g.lineWidth = (o.riverHalf * 2 + 0.75) * ppu; g.stroke();
    trace(); g.strokeStyle = '#f3ead2'; g.lineWidth = (o.riverHalf * 2 + 0.45) * ppu; g.stroke();
    trace(); g.strokeStyle = '#34a597'; g.lineWidth = o.riverHalf * 2 * ppu; g.stroke();
    trace(); g.strokeStyle = 'rgba(96,205,186,.75)'; g.lineWidth = o.riverHalf * 1.25 * ppu; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.72)'; g.lineWidth = 4;
    for (let i = 2; i < o.river.length - 3; i += 2) {
        const [x0, z0] = o.river[i], [x1, z1] = o.river[i + 2];
        const tx = x1 - x0, tz = z1 - z0, tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl;
        const off = (r() - .5) * o.riverHalf * 1.5;
        const ax = px(x0 + nx * off), ay = pz(z0 + nz * off), bx = px(x1 + nx * off), by = pz(z1 + nz * off);
        g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + bx) / 2 + nx * 7, (ay + by) / 2 + nz * 7 - 5, bx, by); g.stroke();
    }
    return c;
}

// ============================================================
// 🗺️ TẤM GIẤY NỀN LÀNG ASHFORD (vẽ từ TERRAIN.ashford + MAPS.ashford + LAYOUTS.ashford)
// ============================================================
export function paintAshfordGround({ map, terrain, layout, W, H, M = 8, r }) {
    const cols = map.cols, rows = map.rows;
    const x0 = -M, z0 = -M, gw = cols + 2 * M, gd = rows + 2 * M, ppu = W / gw;
    const px = (x) => (x - x0) * ppu, pz = (z) => (z - z0) * ppu;
    const inside = (x, z) => x >= 0 && z >= 0 && x < cols && z < rows;
    const tileAt = (x, z) => terrain[Math.max(0, Math.min(rows - 1, z))][Math.max(0, Math.min(cols - 1, x))];

    const [c, g] = mk(W, H);
    // nền cỏ ô-liu ấm + mảng màu nước loang
    g.fillStyle = '#aeb06e'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 95; i++) {
        const x = r() * W, y = r() * H, rad = 120 + r() * 300;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        const col = ['142,162,88', '192,178,112', '160,152,92', '128,150,94'][i % 4];
        gr.addColorStop(0, `rgba(${col},.32)`); gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }

    // vùng rìa rừng ('t', 'd') hơi đậm hơn tạo chiều sâu
    const pathPts = [], pavePts = [], fieldPts = [];
    for (let z = -M; z < rows + M; z++) for (let x = -M; x < cols + M; x++) {
        let t = tileAt(x, z);
        if (!inside(x, z)) {
            if (t === 'b' || t === 's') t = 'g';
            const d = Math.max(x < 0 ? -x : x - cols + 1, z < 0 ? -z : z - rows + 1);
            if (t !== 'p' && d > 2 && r() < 0.72) t = 't';
        }
        if (t === 't' || t === 'd') {
            g.fillStyle = 'rgba(92, 114, 54, 0.24)';
            g.beginPath(); g.arc(px(x + 0.5), pz(z + 0.5), ppu * 0.92, 0, Math.PI * 2); g.fill();
        }
        if (t === 'p') {
            pathPts.push([x + 0.5, z + 0.5]);
            if (tileAt(x + 1, z) === 'p') pathPts.push([x + 1.0, z + 0.5]);
            if (tileAt(x, z + 1) === 'p') pathPts.push([x + 0.5, z + 1.0]);
            if (tileAt(x + 1, z + 1) === 'p' && (tileAt(x + 1, z) === 'p' || tileAt(x, z + 1) === 'p')) pathPts.push([x + 1.0, z + 1.0]);
        } else if (t === 's') {
            pavePts.push([x + 0.5, z + 0.5]);
            if (tileAt(x + 1, z) === 's') pavePts.push([x + 1.0, z + 0.5]);
            if (tileAt(x, z + 1) === 's') pavePts.push([x + 0.5, z + 1.0]);
        } else if (t === 'f') {
            fieldPts.push([x + 0.5, z + 0.5]);
        }
    }

    // đường mòn kem viền cắt giấy lởm chởm
    const drawBlobs = (pts, color, rad, jitter = 6) => {
        g.fillStyle = color;
        for (const [x, z] of pts) {
            g.beginPath();
            g.arc(px(x) + (r() - 0.5) * jitter, pz(z) + (r() - 0.5) * jitter, rad * (0.9 + r() * 0.18), 0, Math.PI * 2);
            g.fill();
        }
    };
    drawBlobs(pathPts, 'rgba(128, 112, 62, 0.52)', ppu * 0.62);
    drawBlobs(pathPts, '#e9dcba', ppu * 0.53);
    for (const [x, z] of pathPts) for (let k = 0; k < 3; k++) {
        g.fillStyle = r() < 0.5 ? 'rgba(180,160,110,.36)' : 'rgba(255,250,235,.48)';
        g.fillRect(px(x) + (r() - 0.5) * ppu * 0.85, pz(z) + (r() - 0.5) * ppu * 0.85, 3, 3);
    }

    // nền đá lát ('s') ở quảng trường
    drawBlobs(pavePts, 'rgba(116, 108, 86, 0.45)', ppu * 0.68, 4);
    drawBlobs(pavePts, '#d7ceb6', ppu * 0.60, 4);

    // quảng trường tròn khảm đá hoa văn la bàn
    const plaza = (layout.items ?? []).find(it => it[0] === 'plaza');
    if (plaza) {
        const cx = px(plaza[1]), cy = pz(plaza[2]), R = plaza[3] * ppu;
        g.fillStyle = 'rgba(92, 80, 54, 0.36)'; g.beginPath(); g.arc(cx + 4, cy + 5, R + 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#f3e8cc'; g.beginPath(); g.arc(cx, cy, R + 3, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#cfc5ab'; g.beginPath(); g.arc(cx, cy, R - 3, 0, Math.PI * 2); g.fill();
        const rings = 9;
        for (let ring = rings; ring >= 1; ring--) {
            const ro = (ring / rings) * (R - 5), ri = ((ring - 1) / rings) * (R - 5);
            const segs = Math.max(8, Math.round(ring * 7));
            for (let i = 0; i < segs; i++) {
                const a0 = (i / segs) * Math.PI * 2 + (ring % 2) * (Math.PI / segs);
                const a1 = ((i + 0.91) / segs) * Math.PI * 2 + (ring % 2) * (Math.PI / segs);
                const warm = (ring === 5 || ring === rings) ? 10 : 0;
                const l = 192 + ((i * 17 + ring * 29) % 24) + warm;
                g.fillStyle = `rgb(${l},${l - 6},${l - 20})`;
                g.beginPath(); g.arc(cx, cy, ro - 1.5, a0, a1); g.arc(cx, cy, ri + 1.5, a1, a0, true); g.closePath(); g.fill();
            }
        }
        g.save(); g.translate(cx, cy);
        for (let i = 0; i < 8; i++) {
            g.rotate(Math.PI / 4);
            g.fillStyle = i % 2 === 0 ? '#e3d0ac' : '#b89b6e';
            g.beginPath(); g.moveTo(0, -10); g.lineTo(10, 0); g.lineTo(0, -R * 0.34); g.lineTo(-10, 0); g.closePath(); g.fill();
        }
        g.fillStyle = '#efe1c4'; g.beginPath(); g.arc(0, 0, R * 0.08, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#7e7058'; g.lineWidth = 3; g.stroke();
        g.restore();
    }

    // luống rau & đất cày (gardenPatch + 'f')
    for (const [x, z] of fieldPts) {
        g.fillStyle = '#8b633c'; g.beginPath(); g.roundRect(px(x - 0.45), pz(z - 0.45), ppu * 0.9, ppu * 0.9, 10); g.fill();
    }
    for (const it of layout.detailItems ?? []) {
        if (it[0] === 'gardenPatch') {
            const [, gx0, gz0, gx1, gz1] = it;
            g.fillStyle = '#dfd2b2'; g.beginPath(); g.roundRect(px(gx0) - 4, pz(gz0) - 4, (gx1 - gx0) * ppu + 8, (gz1 - gz0) * ppu + 8, 10); g.fill();
            g.fillStyle = '#87603a'; g.beginPath(); g.roundRect(px(gx0), pz(gz0), (gx1 - gx0) * ppu, (gz1 - gz0) * ppu, 8); g.fill();
            g.strokeStyle = '#5e4023'; g.lineWidth = 4;
            for (let y = gz0 + 0.35; y < gz1 - 0.15; y += 0.45) {
                g.beginPath(); g.moveTo(px(gx0) + 6, pz(y)); g.lineTo(px(gx1) - 6, pz(y)); g.stroke();
            }
        }
        if (it[0] === 'dirtPatch') {
            const [, dx, dz, rx, rz, rot = 0] = it;
            g.save(); g.translate(px(dx), pz(dz)); g.rotate(-rot);
            g.fillStyle = 'rgba(136, 110, 74, 0.55)'; g.beginPath(); g.ellipse(0, 0, rx * 0.55 * ppu, rz * 0.55 * ppu, 0, 0, Math.PI * 2); g.fill();
            g.fillStyle = 'rgba(118, 92, 58, 0.48)'; g.beginPath(); g.ellipse(0, 0, rx * 0.35 * ppu, rz * 0.35 * ppu, 0, 0, Math.PI * 2); g.fill();
            g.restore();
        }
        if (it[0] === 'steppingStones') {
            for (const [sx, sz, sc = 1] of it[1]) {
                const rad = 0.28 * sc * ppu;
                g.fillStyle = '#efe5cc'; g.beginPath(); g.ellipse(px(sx), pz(sz), rad + 3, rad * 0.8 + 3, 0, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#a89f8e'; g.beginPath(); g.ellipse(px(sx), pz(sz), rad, rad * 0.78, 0, 0, Math.PI * 2); g.fill();
            }
        }
    }
    // vệt đất trước cửa các ngôi nhà
    for (const it of layout.items ?? []) {
        if (it[0] === 'house' && it[1].door != null) {
            g.fillStyle = 'rgba(142, 116, 78, 0.48)';
            g.beginPath(); g.ellipse(px(it[1].door), pz(it[1].z1 + 0.45), ppu * 0.75, ppu * 0.45, 0, 0, Math.PI * 2); g.fill();
        }
    }

    // khe nhảy (gaps): rãnh đất cát lõm cắt giấy viền kem (không vẽ ô đen bệt)
    for (const [gx, gz] of map.gaps ?? []) {
        const rx = px(gx + 0.06), ry = pz(gz + 0.06), rw = ppu * 0.88, rh = ppu * 0.88;
        g.fillStyle = '#f3ead2'; g.beginPath(); g.roundRect(rx - 3, ry - 3, rw + 6, rh + 6, 12); g.fill();
        g.fillStyle = '#bfa77a'; g.beginPath(); g.roundRect(rx, ry, rw, rh, 10); g.fill();
        g.fillStyle = '#7e6140'; g.beginPath(); g.roundRect(rx + 4, ry + 8, rw - 8, rh - 12, 8); g.fill();
        g.fillStyle = '#62482c'; g.beginPath(); g.roundRect(rx + 6, ry + 8, rw - 12, Math.max(8, rh * 0.24), [7, 7, 2, 2]); g.fill();
        g.fillStyle = '#9c8b74';
        for (const [ox, oy, sr] of [[0.26, 0.56, 4.5], [0.68, 0.48, 3.8], [0.48, 0.72, 4.2]]) {
            g.beginPath(); g.ellipse(rx + rw * ox, ry + rh * oy, sr * 1.2, sr * 0.85, 0.3, 0, Math.PI * 2); g.fill();
        }
    }

    // ngọn cỏ vẽ tay trên nền xanh
    for (let i = 0; i < 1400; i++) {
        const wx = x0 + r() * gw, wz = z0 + r() * gd;
        const tx = Math.floor(wx), tz = Math.floor(wz);
        const tt = inside(tx, tz) ? tileAt(tx, tz) : 'g';
        if (tt !== 'g' && tt !== 't') continue;
        if (plaza && Math.hypot(wx - plaza[1], wz - plaza[2]) < plaza[3] + 0.4) continue;
        const x = px(wx), y = pz(wz);
        g.strokeStyle = r() < 0.5 ? 'rgba(92,110,54,.55)' : 'rgba(214,196,120,.58)'; g.lineWidth = 2.2;
        for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * 4, y); g.lineTo(x + k * 8, y - 10 - r() * 5); g.stroke(); }
    }

    // sợi giấy phủ đều toàn tấm nền
    g.lineCap = 'round';
    for (let i = 0; i < 20000; i++) {
        const x = r() * W, y = r() * H, a = r() * Math.PI, len = 6 + r() * 18;
        g.strokeStyle = r() < 0.5 ? 'rgba(245,235,200,.09)' : 'rgba(80,70,30,.08)';
        g.lineWidth = 0.8 + r() * 1.2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }

    // viền mép giấy kem quanh toàn bộ tấm bản đồ
    g.strokeStyle = '#f3ead2'; g.lineWidth = 18; g.strokeRect(9, 9, W - 18, H - 18);
    g.strokeStyle = 'rgba(120, 96, 56, 0.35)'; g.lineWidth = 4; g.strokeRect(18, 18, W - 36, H - 36);
    return c;
}

// ============================================================
// 🧩 ĐÓNG GÓI ATLAS DÙNG CHUNG THEO TỪNG NHÓM HÌNH (giảm draw call)
// ============================================================
function packAtlas(entries, cellW, cellH, cols) {
    const rows = Math.ceil(entries.length / cols);
    const [canvas, g] = mk(cols * cellW, rows * cellH);
    const cells = {};
    entries.forEach(([key, cv, padBottom = 10 / cellH], idx) => {
        const col = idx % cols, row = Math.floor(idx / cols);
        const k = Math.min((cellW - 4) / cv.width, (cellH - 4) / cv.height);
        const dw = cv.width * k, dh = cv.height * k;
        const dx = col * cellW + (cellW - dw) / 2;
        const dy = (row + 1) * cellH - dh - 2;
        g.drawImage(cv, 0, 0, cv.width, cv.height, dx, dy, dw, dh);
        const u0 = (dx + 0.5) / canvas.width;
        const u1 = (dx + dw - 0.5) / canvas.width;
        const v1 = 1 - (dy + 0.5) / canvas.height;
        const v0 = 1 - (dy + dh - 0.5) / canvas.height;
        cells[key] = { u0, u1, v0, v1, w: cv.width, h: cv.height, padBottom };
    });
    return { canvas, cells };
}

/** Tạo đủ 5 atlas cho Làng Ashford (1 lần duy nhất khi vào làng) */
export function buildAshfordAtlases(seed = 20261120) {
    const r = rng(seed);
    const trees = packAtlas([
        ['round0', drawRoundTree(ASHFORD_TREE_PALS[0], r), 10 / 448],
        ['round1', drawRoundTree(ASHFORD_TREE_PALS[1], r), 10 / 448],
        ['round2', drawRoundTree(ASHFORD_TREE_PALS[2], r), 10 / 448],
        ['round3', drawRoundTree(ASHFORD_TREE_PALS[3], r), 10 / 448],
        ['apple', drawAppleTree(r), 10 / 448],
        ['pine', drawPine(r), 10 / 460],
    ], 384, 460, 3);

    const buildings = packAtlas([
        ['house_red', drawHouse(r, { roof: 'red', wall: 'plaster' }), 9 / 440],
        ['house_brown', drawHouse(r, { roof: 'brown', wall: 'plaster' }), 9 / 440],
        ['house_stone', drawHouse(r, { roof: 'red', wall: 'stone' }), 9 / 440],
        ['chiefhouse', drawChiefHouse(r), 9 / 440],
        ['smithy', drawSmithy(r), 9 / 440],
        ['tavern', drawTavern(r), 9 / 440],
        ['well', drawWell(r), 10 / 340],
        ['board', drawBoard(r, false), 11 / 260],
        ['daily_board', drawBoard(r, true), 11 / 260],
        ['stall', drawStall(r), 10 / 280],
        ['garden_crops', drawGardenCrops(r), 10 / 150],
    ], 560, 440, 4);

    const props = packAtlas([
        ['bush0', drawFanBush(ASHFORD_BUSH_PALS[0], r), 9 / 176],
        ['bush1', drawFanBush(ASHFORD_BUSH_PALS[1], r), 9 / 176],
        ['bush2', drawFanBush(ASHFORD_BUSH_PALS[2], r), 9 / 176],
        ['bush3', drawFanBush(ASHFORD_BUSH_PALS[3], r), 9 / 176],
        ['flower0', drawFlowerBush(r, '#f7e3a0', '#e98a2c'), 10 / 170],
        ['flower1', drawFlowerBush(r, '#f6c659', '#c9472e'), 10 / 170],
        ['flower2', drawFlowerBush(r, '#e6d6f7', '#b86bd8'), 10 / 170],
        ['rock_large', drawRock(r, 'normal'), 10 / 140],
        ['rock_flat', drawRock(r, 'flat'), 10 / 140],
        ['rock_small', drawRock(r, 'small'), 10 / 140],
        ['stone_pile', drawStonePile(r), 10 / 140],
        ['fence_simple', drawFence(r, 'simple'), 10 / 160],
        ['fence_planks', drawFence(r, 'planks'), 10 / 160],
        ['lamp', drawLampPost(r), 10 / 280],
        ['anvil', drawAnvil(r), 10 / 160],
        ['barrel', drawBarrel(r), 10 / 170],
        ['crate', drawCrate(r, false), 10 / 165],
        ['crate_large', drawCrate(r, true), 10 / 165],
        ['sacks', drawSacks(r), 10 / 150],
        ['woodpile', drawWoodpile(r), 10 / 150],
        ['haystack', drawHaystack(r), 10 / 170],
        ['tavern_table', drawTavernTable(r), 10 / 160],
        ['bench', drawBench(r), 10 / 140],
        ['signpost', drawSignpost(r), 10 / 210],
        ['sign_tavern', drawShopSign(r, 'tavern'), 10 / 220],
        ['sign_forge', drawShopSign(r, 'forge'), 10 / 220],
        ['pot_red', drawFlowerPot(r, '#e04f3d'), 11 / 150],
        ['pot_yellow', drawFlowerPot(r, '#f4c438'), 11 / 150],
        ['pot_purple', drawFlowerPot(r, '#a86ee6'), 11 / 150],
        ['forge_props', drawForgeProps(r), 10 / 170],
        ['scarecrow', drawScarecrow(r), 10 / 240],
        ['veggie_basket', drawVeggieBasket(r), 11 / 140],
        ['pumpkin', drawPumpkin(r), 11 / 140],
        ['cart', drawCart(r, false), 10 / 180],
        ['cart_high', drawCart(r, true), 10 / 180],
        ['clothesline', drawClothesline(r), 10 / 180],
        ['mushroom_red', drawMushroom(r, 'red'), 11 / 150],
        ['mushroom_tan', drawMushroom(r, 'tan'), 11 / 150],
        ['log', drawLog(r), 11 / 120],
        ['unknown', drawUnknownCard(r), 10 / 180],
    ], 256, 256, 7);

    const quest = packAtlas([
        ['chest', drawChest(r, false), 10 / 160],
        ['chest_open', drawChest(r, true), 10 / 160],
        ['daily_board', drawBoard(r, true), 11 / 260],
        ['ledger', drawLedger(r), 10 / 160],
        ['i_cat', drawCat(r), 10 / 150],
        ['i_stele', drawStele(r, true), 10 / 210],
        ['i_stone', drawStele(r, false), 10 / 210],
        ['i_trough', drawTrough(r), 11 / 140],
        ['i_flowers', drawFlowerBush(r, '#f7c5dc', '#f0b04a'), 10 / 170],
        ['i_nest', drawNest(r), 11 / 130],
        ['i_sign', drawSignBoard(r), 11 / 170],
        ['i_jar', drawJar(r), 11 / 150],
        ['i_spark', drawSpark(r), 0.5],
        ['unknown', drawUnknownCard(r), 10 / 180],
    ], 224, 240, 4);

    const critters = packAtlas([
        ['cat', drawCat(r), 16 / 150],
        ['dog', drawDog(r), 16 / 150],
        ['duck', drawDuck(r), 16 / 120],
        ['chicken_w', drawChicken(r, false), 16 / 130],
        ['chicken_b', drawChicken(r, true), 16 / 130],
        ['butterfly0', drawButterfly(r, '#ffe066'), 0.5],
        ['butterfly1', drawButterfly(r, '#ff9ff3'), 0.5],
        ['butterfly2', drawButterfly(r, '#74b9ff'), 0.5],
        ['bird', drawBird(r, '#c05a3b'), 18 / 120],
        ['leaf0', drawLeaf('#e98a2c'), 0.5],
        ['leaf1', drawLeaf('#f0b04a'), 0.5],
        ['smoke', drawSmokePuff(), 0.5],
    ], 192, 192, 4);

    return { trees, buildings, props, quest, critters };
}
