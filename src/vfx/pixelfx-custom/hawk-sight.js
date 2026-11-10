// ============================================================
// "Mắt Ưng Gió" — hiệu ứng TỰ VẼ theo phong cách pixelfx (dùng bộ công cụ của thư viện: bảng màu, sparkle, glow, cycle)
//   cho Thần Phong Giáng Thế của Lyra: cả đội +chính xác (người dùng chọn tự vẽ thay vệt gió 'status/haste', 11/2026)
//   - trên đầu: vòng ngắm ánh sáng, 4 vạch ngắm xoay chậm, chấm giữa nhấp nháy, tia sáng chạy quanh vòng
//   - quanh người: làn gió mảnh lướt ngang thân dưới + vài sợi lông vũ nhỏ rơi lắc lư
// Cùng cách dùng như hiệu ứng trong src/vendor/pixelfx/fx (meta + drawBack / draw), toạ độ: chân nhân vật ở (0, 0), y âm là lên trên.
// ============================================================
import { fit, sparkle, cycle, TAU, WHITE, PAL } from '../../vendor/pixelfx/core/index.js';

export const meta = {
    name: 'Hawk sight',
    desc: 'Mắt Ưng Gió: vòng ngắm ánh sáng trên đầu + làn gió và lông vũ nhỏ quanh người.',
    tags: ['buff', 'wind', 'accuracy', 'loop', 'character'],
    size: [64, 84],
    origin: [32, 72],
    duration: 2.4,
    loop: true,
    fps: 30,
    actor: 2,
    options: { palette: PAL.cyber, seed: 7 },
};

const HY = -61;   // tâm vòng ngắm (nhân vật cao 44 px) — trên thanh máu

/** sau lưng nhân vật: làn gió mảnh lướt ngang */
export function drawBack(p, t, o) {
    const C = fit(o.palette, 8), T = meta.duration;
    cycle(t, T, 5, o.seed, (g) => g.range(0.7, 1.1), (age, life, R) => {
        const u = age / life, y = -R.range(6, 30), x0 = R.range(-18, -8), len = R.range(10, 16), k = Math.sin(u * Math.PI);
        const head = x0 + u * 26;
        for (let i = 0; i < len; i++) {
            const x = head - i, a = k * (1 - i / len);
            if (a < 0.05) continue;
            p.dot(x, y + Math.sin((x + age * 30) * 0.35) * 0.8, i < 2 ? WHITE : i < len * 0.5 ? C[6] : C[5], a * 0.85);
        }
        p.light(head, y, C[5], 0.3 * k);
    });
}

/** trước nhân vật: vòng ngắm trên đầu + lông vũ rơi */
export function draw(p, t, o) {
    const C = fit(o.palette, 8), T = meta.duration, ph = (t / T) * TAU;
    const s = 1 + 0.08 * Math.sin(ph * 2), R = 6 * s, y0 = HY + (Math.sin(ph) > 0.6 ? -1 : 0);
    // ánh sáng rủ xuống đầu
    p.glowLine(0, y0 + R, 0, -42, 6, C[4], 0.12);
    p.glow(0, y0, 15, C[4], 0.32);
    // vòng ngắm: nửa dưới dày + sáng hơn, tia sáng chạy quanh
    const gl = ph * 1.5;
    for (let j = 0, n = 56; j < n; j++) {
        const g = (j / n) * TAU, x = Math.cos(g) * R, y = y0 + Math.sin(g) * R;
        const d = Math.abs(((g - gl + Math.PI) % TAU + TAU) % TAU - Math.PI);
        p.px(x, y, d < 0.35 ? WHITE : Math.sin(g) > 0 ? C[6] : C[5]);
    }
    // 4 vạch ngắm xoay chậm
    const rot = ph * 0.25;
    for (let q = 0; q < 4; q++) {
        const a = rot + (q * TAU) / 4, cx = Math.cos(a), cy = Math.sin(a);
        p.line(cx * (R + 2), y0 + cy * (R + 2), cx * (R + 5), y0 + cy * (R + 5), C[6], 1);
        p.px(cx * (R + 5), y0 + cy * (R + 5), WHITE);
    }
    // chấm giữa nhấp nháy + loé
    const blink = 0.5 + 0.5 * Math.sin(ph * 4);
    p.px(0, y0, blink > 0.4 ? WHITE : C[6]);
    if (blink > 0.85) sparkle(p, 0, y0, 2, WHITE, C[6], 0.5);
    sparkle(p, Math.cos(gl) * R, y0 + Math.sin(gl) * R, 1.5, WHITE, C[6], 0.4);
    // lông vũ nhỏ rơi lắc lư quanh người
    cycle(t, T, 4, o.seed + 11, (g) => g.range(1.2, 1.8), (age, life, Rg) => {
        const u = age / life, x = Rg.range(-14, 14) + Math.sin(age * 4 + Rg.range(0, TAU)) * 3, y = -Rg.range(34, 46) + u * 30;
        const k = Math.sin(u * Math.PI), tilt = Math.sin(age * 4) > 0 ? 1 : -1;
        p.dot(x, y, WHITE, k);
        p.dot(x + tilt, y + 1, C[6], k * 0.9);
        p.dot(x + 2 * tilt, y + 2, C[5], k * 0.7);
        p.light(x, y, C[5], 0.25 * k);
    });
}
