// ============================================================
// VỆ THẦN GIÓ (Thần Phong Giáng Thế của Lyra) — vẽ bằng canvas, không cần ảnh
// ============================================================
// Linh ảnh nữ cung thủ trong suốt màu ngọc, nhìn nghiêng sang PHẢI, giương cung; tóc và vạt áo tan thành gió.
// drawWindSpirit(ctx, w, h, draw) : draw = 0 (cung thả lỏng) .. 1 (kéo căng hết cỡ)
const TAU = Math.PI * 2;

export function drawWindSpirit(ctx, w = 512, h = 768, draw = 0.6) {
    ctx.save();
    ctx.scale(w / 512, h / 768);

    // ---- quầng sáng phía sau ----
    let g = ctx.createRadialGradient(250, 330, 30, 250, 360, 330);
    g.addColorStop(0, 'rgba(190,255,240,0.55)'); g.addColorStop(0.5, 'rgba(80,220,200,0.22)'); g.addColorStop(1, 'rgba(40,180,170,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 768);

    const body = (y0, y1) => {
        const b = ctx.createLinearGradient(0, y0, 0, y1);
        b.addColorStop(0, 'rgba(235,255,250,0.95)'); b.addColorStop(0.6, 'rgba(140,240,220,0.85)'); b.addColorStop(1, 'rgba(60,200,190,0.15)');
        return b;
    };
    ctx.shadowColor = 'rgba(120,255,230,0.9)'; ctx.shadowBlur = 22;

    // ---- tóc đuôi ngựa bay ra sau thành các dải gió ----
    for (let i = 0; i < 6; i++) {
        const off = i * 14;
        ctx.strokeStyle = `rgba(200,255,245,${0.75 - i * 0.1})`; ctx.lineWidth = 16 - i * 2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(205, 150 + i * 4);
        ctx.bezierCurveTo(140, 130 + off, 90, 200 + off, 30, 170 + off * 1.4);
        ctx.stroke();
    }

    // ---- vạt áo choàng dài, đuôi xoắn thành gió (không có chân) ----
    ctx.fillStyle = body(260, 740);
    ctx.beginPath();
    ctx.moveTo(215, 265);
    ctx.bezierCurveTo(300, 300, 320, 470, 290, 560);
    ctx.bezierCurveTo(270, 640, 210, 690, 120, 735);
    ctx.bezierCurveTo(170, 660, 150, 600, 120, 560);
    ctx.bezierCurveTo(140, 450, 150, 330, 215, 265);
    ctx.closePath(); ctx.fill();
    // xoáy gió ở đuôi áo
    ctx.strokeStyle = 'rgba(210,255,248,0.8)'; ctx.lineWidth = 5;
    for (const [cx, cy, r] of [[150, 650, 34], [95, 600, 22], [210, 705, 20]]) {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0.3, TAU * 0.8); ctx.stroke();
    }

    // ---- thân ----
    ctx.fillStyle = body(240, 420);
    ctx.beginPath();
    ctx.moveTo(195, 245); ctx.quadraticCurveTo(250, 235, 268, 270);
    ctx.quadraticCurveTo(285, 340, 262, 410); ctx.lineTo(175, 410);
    ctx.quadraticCurveTo(165, 320, 195, 245); ctx.closePath(); ctx.fill();

    // ---- đầu + mũ trùm gió ----
    ctx.fillStyle = 'rgba(240,255,252,0.97)';
    ctx.beginPath(); ctx.ellipse(232, 185, 52, 58, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(150,240,225,0.9)';
    ctx.beginPath(); ctx.moveTo(176, 200); ctx.quadraticCurveTo(170, 110, 240, 118); ctx.quadraticCurveTo(300, 125, 290, 175);
    ctx.quadraticCurveTo(250, 150, 205, 170); ctx.quadraticCurveTo(190, 190, 192, 230); ctx.closePath(); ctx.fill();
    // mắt phát sáng
    ctx.shadowColor = 'rgba(255,255,255,1)'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(262, 190, 9, 4, -0.15, 0, TAU); ctx.fill();
    ctx.shadowColor = 'rgba(120,255,230,0.9)'; ctx.shadowBlur = 22;

    // ---- tay kéo dây (ra sau, tới má) ----
    const pull = 30 + draw * 55;          // tay kéo càng căng càng lùi về sau
    const handX = 300 - pull, handY = 250;
    ctx.strokeStyle = 'rgba(225,255,250,0.95)'; ctx.lineWidth = 20; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(235, 275); ctx.quadraticCurveTo(250, 300, handX, handY); ctx.stroke();

    // ---- tay giữ cung (duỗi thẳng ra trước) ----
    const bowX = 420, bowY = 255;
    ctx.beginPath(); ctx.moveTo(250, 270); ctx.lineTo(bowX - 8, bowY); ctx.stroke();

    // ---- cánh cung lớn ----
    const bend = 0.9 + draw * 0.35;
    ctx.strokeStyle = 'rgba(255,255,255,1)'; ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(bowX - 40 * bend, bowY - 190);
    ctx.quadraticCurveTo(bowX + 60 + 25 * bend, bowY, bowX - 40 * bend, bowY + 190);   // cánh cung hình chữ D
    ctx.stroke();
    // lông vũ trang trí 2 đầu cung
    ctx.fillStyle = 'rgba(160,250,230,0.9)';
    for (const sy of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(bowX - 52 * bend, bowY + sy * 200, 12, 30, sy * 0.6, 0, TAU); ctx.fill();
    }
    // dây cung (kéo về tay)
    ctx.strokeStyle = 'rgba(230,255,250,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bowX - 40 * bend, bowY - 190); ctx.lineTo(handX, handY); ctx.lineTo(bowX - 40 * bend, bowY + 190); ctx.stroke();
    // mũi tên gió đặt trên dây
    if (draw > 0.05) {
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(handX, handY); ctx.lineTo(bowX + 70, bowY); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(bowX + 92, bowY); ctx.lineTo(bowX + 62, bowY - 13); ctx.lineTo(bowX + 62, bowY + 13); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
}
