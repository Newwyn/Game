// ============================================================
// LINH HỒN SƯ TỬ (Sư Tử Gầm của Rok) — vẽ bằng canvas, không cần ảnh
// ============================================================
// Đầu sư tử nhìn thẳng, há miệng gầm, bờm như lửa vàng. Dùng làm texture cho hiệu ứng bay ra khi Rok gầm.
const TAU = Math.PI * 2;

function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

/** Vẽ đầu sư tử vào ctx (kích thước size x size) */
export function drawLionHead(ctx, size = 512) {
    const k = size / 512;
    ctx.save();
    ctx.scale(k, k);
    ctx.translate(256, 262);
    const rand = rng(7);

    // ---- Tai (vẽ trước để bờm che bớt) ----
    for (const sgn of [-1, 1]) {
        ctx.fillStyle = '#f2b54a'; ctx.strokeStyle = '#8a4410'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(sgn * 96, -116, 26, 30, sgn * 0.5, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#b8611a'; ctx.beginPath(); ctx.ellipse(sgn * 96, -112, 12, 16, sgn * 0.5, 0, TAU); ctx.fill();
    }

    // ---- Bờm: các lọn cong như ngọn lửa, 3 lớp (ngoài cam đậm -> trong vàng sáng) ----
    const tufts = (count, r0, r1, width, c0, c1, blur, curl) => {
        for (let i = 0; i < count; i++) {
            const a = (i / count) * TAU + rand() * 0.15;
            const len = r1 * (0.82 + rand() * 0.32);
            const side = i % 2 ? 1 : -1;
            const ca = Math.cos(a), sa = Math.sin(a), na = -sa, nb = ca;
            const P = (r, off) => [ca * r + na * off, sa * r + nb * off];
            const g2 = ctx.createLinearGradient(...P(r0, 0), ...P(len, 0));
            g2.addColorStop(0, c0); g2.addColorStop(1, c1);
            ctx.fillStyle = g2; ctx.shadowColor = 'rgba(255,160,30,0.9)'; ctx.shadowBlur = blur;
            const w = width * (0.8 + rand() * 0.4), c = curl * side;
            ctx.beginPath();
            ctx.moveTo(...P(r0, -w));
            ctx.bezierCurveTo(...P(r0 + (len - r0) * 0.4, -w * 0.9 + c * 0.4), ...P(r0 + (len - r0) * 0.75, c * 0.9), ...P(len, c * 1.4));
            ctx.bezierCurveTo(...P(r0 + (len - r0) * 0.7, c * 0.6 + w * 0.3), ...P(r0 + (len - r0) * 0.35, w * 0.9 + c * 0.3), ...P(r0, w));
            ctx.closePath(); ctx.fill();
        }
    };
    tufts(26, 110, 240, 26, 'rgba(240,120,20,0.95)', 'rgba(200,60,0,0)', 20, 30);
    tufts(22, 104, 200, 24, 'rgba(255,175,55,1)', 'rgba(255,120,20,0.05)', 12, 24);
    tufts(18, 100, 160, 22, 'rgba(255,225,130,1)', 'rgba(255,170,50,0.2)', 6, 16);
    ctx.shadowBlur = 0;
    let g = ctx.createRadialGradient(0, 0, 60, 0, 0, 150);
    g.addColorStop(0, 'rgba(255,200,90,0.9)'); g.addColorStop(1, 'rgba(255,140,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.fill();

    // ---- Mặt ----
    g = ctx.createLinearGradient(0, -140, 0, 140);
    g.addColorStop(0, '#fff0b8'); g.addColorStop(0.5, '#f6c35a'); g.addColorStop(1, '#d98a2b');
    ctx.fillStyle = g; ctx.strokeStyle = '#7a3a0c'; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -132);
    ctx.bezierCurveTo(60, -134, 108, -100, 112, -40);
    ctx.bezierCurveTo(118, 10, 104, 52, 78, 78);      // má
    ctx.bezierCurveTo(70, 118, 40, 150, 0, 156);      // hàm dưới (há miệng)
    ctx.bezierCurveTo(-40, 150, -70, 118, -78, 78);
    ctx.bezierCurveTo(-104, 52, -118, 10, -112, -40);
    ctx.bezierCurveTo(-108, -100, -60, -134, 0, -132);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // lông bờm má: các lọn nhọn chờm lên viền mặt hai bên và dưới cằm
    for (let i = 0; i < 16; i++) {
        const a = 0.12 * Math.PI + (i / 15) * 0.76 * Math.PI; // má phải -> cằm -> má trái
        const ca = Math.cos(a), sa = Math.sin(a);
        const bx = ca * 104, by = sa * 140;
        const tipX = ca * (140 + rand() * 18), tipY = sa * (170 + rand() * 14);
        const nx = -sa * 15, ny = ca * 15;
        ctx.fillStyle = i % 2 ? '#ffd27a' : '#f5ae45';
        ctx.strokeStyle = 'rgba(122,58,12,0.55)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(bx - nx, by - ny);
        ctx.quadraticCurveTo((bx + tipX) / 2 - nx * 0.3, (by + tipY) / 2 - ny * 0.3, tipX, tipY);
        ctx.quadraticCurveTo((bx + tipX) / 2 + nx * 0.6, (by + tipY) / 2 + ny * 0.6, bx + nx, by + ny);
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // nếp nhăn trán (cau mày)
    ctx.strokeStyle = 'rgba(122,58,12,0.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const [x0, y0, x1, y1] of [[-14, -118, -6, -70], [14, -118, 6, -70], [0, -122, 0, -64]]) {
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }

    // ---- Mắt giận dữ phát sáng ----
    for (const s of [-1, 1]) {
        // cung mày dày, xếch xuống giữa
        ctx.fillStyle = '#7a3a0c';
        ctx.beginPath();
        ctx.moveTo(s * 18, -50); ctx.quadraticCurveTo(s * 55, -82, s * 95, -66);
        ctx.lineTo(s * 92, -56); ctx.quadraticCurveTo(s * 55, -66, s * 22, -38); ctx.closePath(); ctx.fill();
        // mắt
        ctx.save();
        ctx.shadowColor = 'rgba(255,255,200,1)'; ctx.shadowBlur = 22;
        ctx.fillStyle = '#fffbe0';
        ctx.beginPath();
        ctx.moveTo(s * 24, -36); ctx.quadraticCurveTo(s * 58, -58, s * 88, -46);
        ctx.quadraticCurveTo(s * 62, -22, s * 24, -36); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#ff9a1f'; ctx.beginPath(); ctx.arc(s * 54, -40, 7, 0, TAU); ctx.fill();
    }

    // ---- Mõm ----
    for (const s of [-1, 1]) {
        g = ctx.createRadialGradient(s * 34, 30, 5, s * 34, 30, 50);
        g.addColorStop(0, '#fff6d6'); g.addColorStop(1, '#f0b850');
        ctx.fillStyle = g; ctx.strokeStyle = 'rgba(122,58,12,0.6)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(s * 34, 32, 44, 32, s * 0.15, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(122,58,12,0.7)';
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(s * (22 + i * 13), 26 + j * 13 + i * 2, 2.6, 0, TAU); ctx.fill(); }
    }
    // sống mũi + mũi
    ctx.fillStyle = 'rgba(255,240,190,0.9)';
    ctx.beginPath(); ctx.moveTo(-14, -40); ctx.lineTo(14, -40); ctx.lineTo(20, 4); ctx.lineTo(-20, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6b2a0a'; ctx.strokeStyle = '#3d1504'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-26, -4); ctx.quadraticCurveTo(0, -14, 26, -4);
    ctx.quadraticCurveTo(20, 16, 0, 22); ctx.quadraticCurveTo(-20, 16, -26, -4);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // ---- Miệng há gầm ----
    ctx.fillStyle = '#4a0c08'; ctx.strokeStyle = '#2a0503'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-50, 60); ctx.quadraticCurveTo(0, 48, 50, 60);
    ctx.quadraticCurveTo(44, 132, 0, 140); ctx.quadraticCurveTo(-44, 132, -50, 60);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // lưỡi
    ctx.fillStyle = '#c2362b'; ctx.beginPath(); ctx.ellipse(0, 118, 28, 16, 0, 0, TAU); ctx.fill();
    // răng nanh
    ctx.fillStyle = '#fffdf2'; ctx.strokeStyle = 'rgba(80,40,10,0.6)'; ctx.lineWidth = 2;
    const fang = (x, y0, y1, w) => { ctx.beginPath(); ctx.moveTo(x - w, y0); ctx.lineTo(x + w, y0); ctx.lineTo(x, y1); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    fang(-34, 58, 96, 9); fang(34, 58, 96, 9);       // nanh trên
    fang(-14, 54, 70, 6); fang(14, 54, 70, 6); fang(0, 53, 66, 5);
    fang(-28, 136, 104, 7); fang(28, 136, 104, 7);   // nanh dưới
    ctx.restore();
}
