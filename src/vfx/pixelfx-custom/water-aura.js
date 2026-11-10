// ============================================================
// "Thủy Vũ Hoàn" — hiệu ứng TỰ VẼ theo phong cách pixelfx: nước bao quanh Nerissa suốt lúc múa (11/2026)
//   2 dải lụa nước xoắn ốc bay vòng quanh người (nửa sau vẽ SAU lưng, nửa trước vẽ TRƯỚC người -> có chiều sâu),
//   vòng bọt nước dưới chân gợn sóng, giọt nước bay lên lấp lánh. Lặp liền mạch 2,4 giây.
//   Toạ độ: chân ở (0, 0), y âm là lên trên (nhân vật cao 44 điểm ảnh).
// ============================================================
import { fit, sparkle, rng, TAU, WHITE, PAL } from '../../vendor/pixelfx/core/index.js';

export const meta = {
    name: 'Water aura',
    desc: 'Thủy Vũ Hoàn: 2 dải lụa nước xoắn quanh người, vòng bọt dưới chân, giọt nước bay lên lấp lánh.',
    tags: ['water', 'aura', 'buff', 'dance', 'loop'],
    size: [100, 86],
    origin: [50, 74],
    duration: 2.4,
    loop: true,
    fps: 30,
    options: { palette: PAL.water, seed: 6 },
};

const D = meta.duration, RX = 21, TILT = 0.3;

// 1 điểm trên quỹ đạo: góc a, độ cao y -> toạ độ + ở phía trước hay sau người
const orbit = (a, y, r = RX) => ({ x: Math.cos(a) * r, y: y + Math.sin(a) * r * TILT, front: Math.sin(a) > 0 });

function ribbons(p, t, C, wantFront) {
    const w = (t / D) * TAU;
    for (let k = 0; k < 3; k++) {
        const base = w * (k === 1 ? -1.2 : 1) + k * (TAU / 3);   // 3 dải, 1 dải xoay ngược
        for (let i = 0; i < 44; i++) {
            const q = i / 43;                                 // 0 = đuôi, 1 = đầu dải
            const a = base + q * 2.9;
            const y = -4 - q * 30 + 3 * Math.sin(w + k * 2.1);  // xoắn từ chân lên ngang vai
            const r = RX + 1 - q * 5 + 1.5 * Math.sin(w * 2 + q * 6 + k);
            const o = orbit(a, y, r);
            if (o.front !== wantFront) continue;
            const al = (0.35 + 0.65 * q) * (o.front ? 1 : 0.65);
            const th = 0.6 + 1.2 * Math.sin(q * Math.PI);    // dải phình ở giữa, nhọn 2 đầu
            p.disc(o.x, o.y, th, q > 0.55 ? C[5] : C[4], al);
            p.dot(o.x, o.y - th, q > 0.8 ? WHITE : C[6], al);   // mép sáng phía trên
            if (q > 0.93) { p.glow(o.x, o.y, 5, C[5], 0.3); p.dot(o.x, o.y, WHITE, al); }
        }
    }
}

function foam(p, t, C, wantFront) {
    const w = (t / D) * TAU;
    for (let j = 0, n = 56; j < n; j++) {
        const a = (j / n) * TAU;
        const o = orbit(a, -1, 23 + 1.2 * Math.sin(a * 5 - w * 2));
        if (o.front !== wantFront) continue;
        const crest = 0.5 + 0.5 * Math.sin(a * 3 - w * 2);
        p.dot(o.x, o.y, crest > 0.75 ? WHITE : C[5], 0.45 + 0.5 * crest);
        p.dot(o.x * 0.9, o.y + 1, C[4], 0.4 + 0.3 * crest);
    }
}

export function drawBack(p, t, o) {
    const C = fit(o.palette, 8);
    p.glow(0, -20, 28, C[4], 0.18);
    foam(p, t, C, false);
    ribbons(p, t, C, false);
}

export function draw(p, t, o) {
    const C = fit(o.palette, 8);
    foam(p, t, C, true);
    ribbons(p, t, C, true);
    // giọt nước bay vòng lên rồi tan (lặp theo chu kỳ riêng mỗi giọt)
    for (let i = 0; i < 14; i++) {
        const R = rng(o.seed, i), life = R.range(0.9, 1.6), off = R.range(0, D);
        const k = (((t + off) % life) / life);
        const a = R.range(0, TAU) + k * 2.2, r = R.range(10, 22) * (1 - 0.3 * k);
        const x = Math.cos(a) * r, y = -2 - k * R.range(30, 46) + Math.sin(a) * r * TILT;
        const al = Math.sin(k * Math.PI);
        p.disc(x, y, 0.9, k < 0.4 ? WHITE : C[6], al);
        if (i % 5 === 0) sparkle(p, x, y, 1.5, WHITE, C[6], 0.45 * al);
    }
}
