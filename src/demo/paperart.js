// Bản thử "bản đồ giấy cắt dán": toàn bộ hình được vẽ bằng code (canvas 2D).
// Mỗi hàm trả về 1 canvas nền trong suốt; paperize() thêm viền giấy kem + hạt giấy.

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

const RIM = '#f6e9cd';

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

export const TREE_PALS = [
    { leaf: '#e98a2c', dab1: '#f4b244', dab2: '#cf5a26', branch: '#9b3620', edge: '#a8431f', trunk: '#8a4b2c' },
    { leaf: '#f0a63a', dab1: '#f8cf63', dab2: '#dd7a2a', branch: '#a5421f', edge: '#b9601f', trunk: '#7d4628' },
    { leaf: '#d9602b', dab1: '#ee9a3c', dab2: '#b23a22', branch: '#7c2418', edge: '#8e2d1c', trunk: '#70391f' },
    { leaf: '#e6b84a', dab1: '#f6dc7c', dab2: '#d98d2c', branch: '#a14a22', edge: '#b3741f', trunk: '#84502b' },
];

export function drawRoundTree(pal, r) {
    const w = 384, h = 448, cx = w / 2;
    const [c, g] = mk(w, h);
    // thân
    g.fillStyle = pal.trunk;
    g.beginPath();
    g.moveTo(cx - 20, h - 16); g.lineTo(cx - 10, h * 0.5); g.lineTo(cx + 10, h * 0.5); g.lineTo(cx + 20, h - 16);
    g.closePath(); g.fill();
    // tán: nhiều hình tròn gộp lại
    const cy = h * 0.40, crown = new Path2D();
    const blobs = [[0, 0, 118]];
    for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2 + r() * 0.4, d = 62 + r() * 22;
        blobs.push([Math.cos(a) * d * 1.05, Math.sin(a) * d * 0.95, 58 + r() * 20]);
    }
    for (const [x, y, rad] of blobs) { crown.moveTo(cx + x + rad, cy + y); crown.arc(cx + x, cy + y, rad, 0, Math.PI * 2); }
    // nét viền vẽ trước rồi tô đè lên: chỉ còn lại viền ở mép ngoài tán
    g.strokeStyle = pal.edge; g.lineWidth = 10; g.stroke(crown);
    g.fillStyle = pal.leaf; g.fill(crown);
    g.save(); g.clip(crown);
    // mảng tối bên phải dưới
    g.fillStyle = 'rgba(120,40,15,.16)';
    g.beginPath(); g.arc(cx + 70, cy + 70, 130, 0, Math.PI * 2); g.fill();
    // chấm lá
    for (let i = 0; i < 90; i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 150;
        g.save();
        g.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
        g.rotate(r() * Math.PI);
        g.fillStyle = r() < 0.55 ? pal.dab1 : pal.dab2;
        g.beginPath(); g.ellipse(0, 0, 9 + r() * 6, 4 + r() * 3, 0, 0, Math.PI * 2); g.fill();
        g.restore();
    }
    // cành
    g.strokeStyle = pal.branch; g.lineCap = 'round';
    g.lineWidth = 7; g.beginPath(); g.moveTo(cx, h * 0.66); g.lineTo(cx + (r() - .5) * 14, cy - 96); g.stroke();
    for (let i = 0; i < 7; i++) {
        const y0 = h * 0.60 - i * 30, side = i % 2 ? 1 : -1, len = 60 + r() * 50;
        g.lineWidth = 5 - i * 0.35;
        g.beginPath(); g.moveTo(cx, y0);
        g.quadraticCurveTo(cx + side * len * 0.5, y0 - 12, cx + side * len, y0 - 46 - r() * 30);
        g.stroke();
    }
    g.restore();
    return paperize(c, 8, r);
}

export function drawPine(r) {
    const w = 300, h = 460, cx = w / 2;
    const [c, g] = mk(w, h);
    g.fillStyle = '#7a4a2b';
    g.fillRect(cx - 13, h - 90, 26, 74);
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

// bụi hình quạt nhiều lớp
export function drawFanBush(pal, r) {
    const w = 300, h = 176, cx = w / 2, by = h - 14;
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
    const w = 280, h = 170, cx = w / 2, by = h - 14;
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

// cụm lau sậy đầu đỏ (ven sông)
export function drawReeds(r) {
    const w = 220, h = 250, cx = w / 2, by = h - 14;
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

export function drawRock(r) {
    const w = 210, h = 140;
    const [c, g] = mk(w, h);
    const by = h - 14;
    const pts = [[22, by], [34, by - 52 - r() * 14], [84, by - 92 - r() * 16], [140, by - 78 - r() * 14], [186, by - 34], [190, by]];
    g.fillStyle = '#9b8a76'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
    g.fillStyle = '#bcab92'; g.beginPath(); g.moveTo(pts[1][0], pts[1][1]); g.lineTo(pts[2][0], pts[2][1]); g.lineTo(pts[3][0], pts[3][1]); g.lineTo(108, by - 44); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,45,30,.25)'; g.beginPath(); g.moveTo(pts[3][0], pts[3][1]); g.lineTo(pts[4][0], pts[4][1]); g.lineTo(pts[5][0], pts[5][1]); g.lineTo(118, by); g.lineTo(108, by - 44); g.closePath(); g.fill();
    return paperize(c, 6, r);
}

export function drawHouse(r) {
    const w = 560, h = 440;
    const [c, g] = mk(w, h);
    const by = h - 16;
    // ống khói
    g.fillStyle = '#9c5a3a'; g.fillRect(380, 60, 46, 110);
    // tường
    g.fillStyle = '#ecdcb8'; g.fillRect(90, 210, 380, by - 210);
    g.strokeStyle = '#8a5a34'; g.lineWidth = 9;
    g.strokeRect(94, 214, 372, by - 218);
    g.beginPath(); g.moveTo(280, 214); g.lineTo(280, by); g.moveTo(94, 300); g.lineTo(466, 300); g.stroke();
    // mái
    g.fillStyle = '#d2532c';
    g.beginPath(); g.moveTo(40, 226); g.lineTo(150, 50); g.lineTo(410, 50); g.lineTo(520, 226); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,30,15,.45)'; g.lineWidth = 4;
    for (let row = 1; row < 5; row++) {
        const y = 50 + row * 36, inset = 110 - row * 22.5;
        g.beginPath(); g.moveTo(40 + inset, y); g.lineTo(520 - inset, y); g.stroke();
        for (let x = 40 + inset + (row % 2 ? 18 : 36); x < 520 - inset; x += 36) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 36); g.stroke(); }
    }
    // cửa + cửa sổ sáng đèn
    g.fillStyle = '#7a4a2b'; g.beginPath(); g.roundRect(246, 318, 68, by - 318, [30, 30, 0, 0]); g.fill();
    for (const x of [130, 370]) {
        g.fillStyle = '#ffd96e'; g.fillRect(x, 318, 64, 62);
        g.strokeStyle = '#8a5a34'; g.lineWidth = 7; g.strokeRect(x, 318, 64, 62);
        g.beginPath(); g.moveTo(x + 32, 318); g.lineTo(x + 32, 380); g.stroke();
    }
    return paperize(c, 9, r);
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

// cọc lan can cầu
export function drawPost(r) {
    const w = 96, h = 190;
    const [c, g] = mk(w, h);
    g.fillStyle = '#b9763e'; g.beginPath(); g.roundRect(26, 16, 44, h - 30, [20, 20, 4, 4]); g.fill();
    g.strokeStyle = 'rgba(110,55,20,.5)'; g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const x = 34 + i * 9 + r() * 3; g.beginPath(); g.moveTo(x, 40 + r() * 20); g.lineTo(x + (r() - .5) * 5, h - 26); g.stroke(); }
    g.fillStyle = '#d9954e'; g.beginPath(); g.roundRect(26, 16, 44, 26, [20, 20, 0, 0]); g.fill();
    return paperize(c, 6, r);
}

// mặt cầu: ván gỗ xếp ngang
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

// vòng đánh dấu chỗ sẽ đi tới
export function drawMarker() {
    const [c, g] = mk(128, 128);
    g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.setLineDash([22, 14]);
    g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.stroke();
    g.setLineDash([]); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 64, 9, 0, Math.PI * 2); g.fill();
    return c;
}

// bảng hình nhân vật của game: phóng to + thêm viền giấy quanh từng ô
export function heroSheet(img, meta, scale = 4, pad = 14) {
    const cw = meta.cw * scale + pad * 2, ch = meta.ch * scale + pad * 2;
    const [c, g] = mk(cw * meta.cols, ch * meta.rows);
    g.imageSmoothingEnabled = false;
    for (let row = 0; row < meta.rows; row++) for (let col = 0; col < meta.cols; col++) {
        g.drawImage(img, col * meta.cw, row * meta.ch, meta.cw, meta.ch, col * cw + pad, row * ch + pad, meta.cw * scale, meta.ch * scale);
    }
    const [sil, sg] = mk(c.width, c.height);
    sg.drawImage(c, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = RIM; sg.fillRect(0, 0, c.width, c.height);
    const [out, og] = mk(c.width, c.height);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; og.drawImage(sil, Math.cos(a) * 8, Math.sin(a) * 8); }
    og.drawImage(c, 0, 0);
    return { canvas: out, cellW: cw, cellH: ch };
}

// Mặt đất: giấy màu ô-liu, đường mòn kem, sông xanh ngọc viền trắng
// o: { W, H, px(x), pz(z), ppu, river: [[x,z]...], riverHalf, paths: [[[x,z]...]...], pathHalf, free(x,z), r }
export function paintGround(o) {
    const { W, H, px, pz, ppu, r } = o;
    const [c, g] = mk(W, H);
    g.fillStyle = '#b6aa74'; g.fillRect(0, 0, W, H);
    // mảng màu loang
    for (let i = 0; i < 70; i++) {
        const x = r() * W, y = r() * H, rad = 140 + r() * 320;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        const col = ['150,160,96', '196,178,116', '168,150,92', '134,150,98'][i % 4];
        gr.addColorStop(0, `rgba(${col},.30)`); gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // sợi giấy
    g.lineCap = 'round';
    for (let i = 0; i < 16000; i++) {
        const x = r() * W, y = r() * H, a = r() * Math.PI, len = 6 + r() * 18;
        g.strokeStyle = r() < 0.5 ? 'rgba(245,235,200,.10)' : 'rgba(80,70,30,.09)';
        g.lineWidth = 0.8 + r() * 1.2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
    // cỏ vẽ tay
    for (let i = 0; i < 900; i++) {
        const wx = o.x0 + r() * o.gw, wz = o.z0 + r() * o.gd;
        if (!o.free(wx, wz)) continue;
        const x = px(wx), y = pz(wz);
        g.strokeStyle = r() < 0.5 ? 'rgba(96,112,58,.55)' : 'rgba(214,196,120,.6)'; g.lineWidth = 2.4;
        for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * 4, y); g.lineTo(x + k * 9, y - 11 - r() * 5); g.stroke(); }
    }
    // đường mòn: mép xé lởm chởm
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
    // sông
    const trace = () => { g.beginPath(); o.river.forEach(([x, z], i) => i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z))); };
    g.lineJoin = 'round'; g.lineCap = 'round';
    trace(); g.strokeStyle = 'rgba(110,100,60,.35)'; g.lineWidth = (o.riverHalf * 2 + 0.75) * ppu; g.stroke();
    trace(); g.strokeStyle = '#f3ead2'; g.lineWidth = (o.riverHalf * 2 + 0.45) * ppu; g.stroke();
    trace(); g.strokeStyle = '#34a597'; g.lineWidth = o.riverHalf * 2 * ppu; g.stroke();
    trace(); g.strokeStyle = 'rgba(96,205,186,.75)'; g.lineWidth = o.riverHalf * 1.25 * ppu; g.stroke();
    // gợn sóng trắng chạy theo dòng
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
