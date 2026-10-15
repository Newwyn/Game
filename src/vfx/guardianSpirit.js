// ============================================================
// THẦN HỘ VỆ (Dựng Khiên của Rok) — vẽ bằng canvas, không cần ảnh
// ============================================================
// Vị thần giáp vàng nhìn thẳng, đội mũ có mào, sau lưng là đôi cánh + vầng hào quang,
// hai tay giữ chiếc khiên khổng lồ che trước người. Dùng làm texture "linh ảnh" hiện trên đầu Rok.
const TAU = Math.PI * 2;

/** Vẽ thần hộ vệ vào ctx kích thước (w, h) — tỉ lệ gốc 512 x 768 */
export function drawGuardian(ctx, w = 512, h = 768) {
    ctx.save();
    ctx.scale(w / 512, h / 768);
    const cx = 256;

    // ---- Hào quang + tia sáng sau đầu ----
    ctx.save();
    ctx.translate(cx, 190);
    for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        const len = i % 2 ? 210 : 260;
        const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        g.addColorStop(0, 'rgba(255,240,190,0.55)'); g.addColorStop(1, 'rgba(255,200,90,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.05) * len, Math.sin(a - 0.05) * len);
        ctx.lineTo(Math.cos(a + 0.05) * len, Math.sin(a + 0.05) * len);
        ctx.closePath(); ctx.fill();
    }
    let g = ctx.createRadialGradient(0, 0, 20, 0, 0, 150);
    g.addColorStop(0, 'rgba(255,250,220,0.95)'); g.addColorStop(0.5, 'rgba(255,215,120,0.5)'); g.addColorStop(1, 'rgba(255,190,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.fill();
    // vòng hào quang
    ctx.strokeStyle = 'rgba(255,236,170,0.95)'; ctx.lineWidth = 7; ctx.shadowColor = 'rgba(255,190,60,1)'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(0, -10, 92, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, -10, 104, 0, TAU); ctx.stroke();
    ctx.restore();

    // ---- Đôi cánh (lớp lông vũ toả ra hai bên) ----
    for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(cx + s * 60, 260);
        for (let row = 0; row < 3; row++) {
            const n = 7 - row;
            for (let i = 0; i < n; i++) {
                const t = i / (n - 1);
                const a = (-0.95 + t * 1.25) ;                  // góc toả lông (từ trên xuống)
                const len = (190 - row * 45) * (1 - t * 0.25);
                const ang = s > 0 ? a : Math.PI - a;
                const fx = Math.cos(ang), fy = Math.sin(ang);
                const gg = ctx.createLinearGradient(0, 0, fx * len, fy * len);
                gg.addColorStop(0, row === 2 ? 'rgba(255,236,180,0.95)' : 'rgba(255,248,225,0.9)');
                gg.addColorStop(1, row === 0 ? 'rgba(255,200,110,0.15)' : 'rgba(255,215,140,0.5)');
                ctx.fillStyle = gg; ctx.strokeStyle = 'rgba(190,120,30,0.55)'; ctx.lineWidth = 2;
                ctx.shadowColor = 'rgba(255,200,80,0.8)'; ctx.shadowBlur = 8;
                const wdt = 16 + row * 3;
                const nx = -fy * wdt, ny = fx * wdt;
                ctx.beginPath();
                ctx.moveTo(nx * 0.4, ny * 0.4);
                ctx.quadraticCurveTo(fx * len * 0.55 + nx, fy * len * 0.55 + ny, fx * len, fy * len);
                ctx.quadraticCurveTo(fx * len * 0.55 - nx, fy * len * 0.55 - ny, -nx * 0.4, -ny * 0.4);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            }
        }
        ctx.restore();
    }
    ctx.shadowBlur = 0;

    // ---- Áo choàng sau người ----
    g = ctx.createLinearGradient(0, 260, 0, 700);
    g.addColorStop(0, '#f3c86a'); g.addColorStop(0.7, 'rgba(235,165,50,0.5)'); g.addColorStop(1, 'rgba(230,150,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(cx - 90, 265); ctx.quadraticCurveTo(cx - 170, 520, cx - 150, 700);
    ctx.lineTo(cx + 150, 700); ctx.quadraticCurveTo(cx + 170, 520, cx + 90, 265); ctx.closePath(); ctx.fill();

    // ---- Thân giáp + vai ----
    const metal = (y0, y1) => { const m = ctx.createLinearGradient(0, y0, 0, y1); m.addColorStop(0, '#fff6d8'); m.addColorStop(0.5, '#f2c75c'); m.addColorStop(1, '#c98a24'); return m; };
    ctx.fillStyle = metal(250, 420); ctx.strokeStyle = '#8a5410'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx - 70, 255); ctx.lineTo(cx + 70, 255); ctx.lineTo(cx + 58, 420); ctx.lineTo(cx - 58, 420); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) {   // giáp vai tròn nhiều lớp
        for (let k = 0; k < 3; k++) {
            ctx.fillStyle = metal(240 + k * 18, 300 + k * 18);
            ctx.beginPath(); ctx.ellipse(cx + s * (88 + k * 6), 268 + k * 16, 52 - k * 6, 30 - k * 3, s * 0.35, 0, TAU); ctx.fill(); ctx.stroke();
        }
    }

    // ---- Đầu: mũ trụ có mào lông, khe mắt phát sáng ----
    ctx.fillStyle = metal(110, 250); ctx.strokeStyle = '#8a5410'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, 108);
    ctx.bezierCurveTo(cx + 55, 110, cx + 66, 160, cx + 60, 205);
    ctx.lineTo(cx + 40, 248); ctx.lineTo(cx - 40, 248); ctx.lineTo(cx - 60, 205);
    ctx.bezierCurveTo(cx - 66, 160, cx - 55, 110, cx, 108);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // mào lông trên mũ
    for (let i = 0; i < 9; i++) {
        const t = i / 8, a = -Math.PI / 2 + (t - 0.5) * 1.1;
        const gg = ctx.createLinearGradient(cx, 112, cx + Math.cos(a) * 120, 112 + Math.sin(a) * 120);
        gg.addColorStop(0, '#fffbe8'); gg.addColorStop(1, 'rgba(255,190,80,0)');
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.moveTo(cx - 8, 116);
        ctx.quadraticCurveTo(cx + Math.cos(a) * 60 - 14, 112 + Math.sin(a) * 60, cx + Math.cos(a) * 120, 112 + Math.sin(a) * 120);
        ctx.quadraticCurveTo(cx + Math.cos(a) * 60 + 14, 112 + Math.sin(a) * 60, cx + 8, 116);
        ctx.closePath(); ctx.fill();
    }
    // sống mũi & cánh hai bên mũ
    ctx.fillStyle = '#fff1c2';
    ctx.fillRect(cx - 5, 118, 10, 92);
    for (const s of [-1, 1]) {
        ctx.fillStyle = metal(140, 200);
        ctx.beginPath(); ctx.moveTo(cx + s * 58, 170); ctx.quadraticCurveTo(cx + s * 120, 120, cx + s * 135, 92);
        ctx.quadraticCurveTo(cx + s * 110, 160, cx + s * 62, 200); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // khe mắt sáng
    ctx.save();
    ctx.fillStyle = '#2a1606'; ctx.beginPath(); ctx.moveTo(cx - 48, 178); ctx.lineTo(cx + 48, 178); ctx.lineTo(cx + 40, 196); ctx.lineTo(cx - 40, 196); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'rgba(160,230,255,1)'; ctx.shadowBlur = 20; ctx.fillStyle = '#e8fbff';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * 22, 187, 13, 4.5, s * -0.15, 0, TAU); ctx.fill(); }
    ctx.restore();

    // ---- Hai tay giữ khiên ----
    for (const s of [-1, 1]) {
        ctx.fillStyle = metal(290, 420); ctx.strokeStyle = '#8a5410'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cx + s * 110, 285); ctx.quadraticCurveTo(cx + s * 160, 360, cx + s * 150, 430);
        ctx.lineTo(cx + s * 118, 432); ctx.quadraticCurveTo(cx + s * 120, 360, cx + s * 80, 300); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // ---- KHIÊN KHỔNG LỒ (khiên kite) ----
    const top = 330, bottom = 748, half = 150;
    const shieldPath = () => {
        ctx.beginPath();
        ctx.moveTo(cx - half, top);
        ctx.quadraticCurveTo(cx, top - 34, cx + half, top);
        ctx.bezierCurveTo(cx + half + 6, top + 170, cx + 90, bottom - 90, cx, bottom);
        ctx.bezierCurveTo(cx - 90, bottom - 90, cx - half - 6, top + 170, cx - half, top);
        ctx.closePath();
    };
    ctx.save();
    ctx.shadowColor = 'rgba(255,200,70,1)'; ctx.shadowBlur = 30;
    g = ctx.createLinearGradient(cx - half, top, cx + half, bottom);
    g.addColorStop(0, '#e9f4ff'); g.addColorStop(0.5, '#9cc2f0'); g.addColorStop(1, '#4f78c0');
    ctx.fillStyle = g; shieldPath(); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 16; ctx.strokeStyle = '#f5c95a'; shieldPath(); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#8a5410'; shieldPath(); ctx.stroke();
    // viền trong
    ctx.save(); ctx.translate(cx, (top + bottom) / 2); ctx.scale(0.86, 0.88); ctx.translate(-cx, -(top + bottom) / 2);
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,240,190,0.9)'; shieldPath(); ctx.stroke(); ctx.restore();
    // huy hiệu mặt trời + chữ thập ở giữa khiên
    ctx.save();
    ctx.translate(cx, 500);
    ctx.shadowColor = 'rgba(255,220,120,1)'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffe9a0';
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU, r = i % 2 ? 70 : 95;
        ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.12) * 34, Math.sin(a - 0.12) * 34);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a + 0.12) * 34, Math.sin(a + 0.12) * 34); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#fff8dc'; ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e0a63a'; ctx.fillRect(-9, -120, 18, 240); ctx.fillRect(-80, -9, 160, 18);
    ctx.fillStyle = '#fffdf0'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill();
    ctx.restore();

    // ---- Bàn tay đè lên mép khiên ----
    for (const s of [-1, 1]) {
        ctx.fillStyle = metal(410, 460); ctx.strokeStyle = '#8a5410'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(cx + s * 136, 440, 26, 22, 0, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
}
