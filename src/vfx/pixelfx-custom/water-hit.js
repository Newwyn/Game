// ============================================================
// "Giọt Thủy Vũ" — hiệu ứng TỰ VẼ theo phong cách pixelfx cho đòn đánh thường của Nerissa (11/2026)
//   'water/splash' của thư viện quá to + vòng gợn kéo dài -> khó nhìn. Bản này gọn, rõ, ngắn (0,6 giây):
//   lõi nước loé trắng ở ngực -> vành nước dẹt nở ra -> 2 dải lụa nước xoáy cong quanh điểm trúng
//   -> giọt nước văng thành vòng cung rơi xuống, lấp lánh. Toạ độ: chân mục tiêu ở (0, 0), y âm là lên.
// ============================================================
import { fit, sparkle, rng, smooth, WHITE, PAL } from '../../vendor/pixelfx/core/index.js';

export const meta = {
    name: 'Water hit',
    desc: 'Giọt Thủy Vũ: lõi nước loé, vành nước nở, 2 dải lụa nước xoáy, giọt nước văng lấp lánh.',
    tags: ['water', 'hit', 'impact', 'one-shot'],
    size: [80, 76],
    origin: [40, 66],
    duration: 0.65,
    loop: false,
    fps: 30,
    options: { palette: PAL.water, seed: 5 },
};

const CY = -24;   // ngang ngực mục tiêu

export function draw(p, t, o) {
    const C = fit(o.palette, 8), u = t / meta.duration;
    // lõi nước loé trắng
    const core = 1 - smooth(0, 0.35, u);
    if (core > 0) {
        p.glow(0, CY, 12, C[5], 0.5 * core);
        p.disc(0, CY, 1.5 + 3 * core, core > 0.5 ? WHITE : C[6], core);
    }
    // vành nước dẹt nở ra (ellipse 2 lớp: mép trắng + thân xanh)
    const rr = 3 + 15 * smooth(0, 0.55, u), ra = 1 - smooth(0.3, 0.85, u);
    if (ra > 0) {
        for (let j = 0, n = 48; j < n; j++) {
            const g = (j / n) * Math.PI * 2, x = Math.cos(g) * rr, y = CY + Math.sin(g) * rr * 0.38;
            p.dot(x, y, Math.sin(g) > 0 ? WHITE : C[6], ra);
            p.dot(x * 0.92, y + 1, C[4], ra * 0.6);
        }
    }
    // 2 dải lụa nước xoáy cong (đối xứng), quét quanh điểm trúng
    const sw = smooth(0, 0.6, u), sa = 1 - smooth(0.45, 1, u);
    if (sa > 0) {
        for (const side of [1, -1]) {
            for (let i = 0; i < 18; i++) {
                const k = i / 17, a0 = side > 0 ? -2.3 : 0.85, g = a0 + (k * 2.2 + sw * 1.4) * side;
                const r = 6 + 9 * k * (0.6 + 0.4 * sw);
                const x = Math.cos(g) * r, y = CY + Math.sin(g) * r * 0.6;
                p.dot(x, y, k > 0.8 ? WHITE : k > 0.4 ? C[6] : C[5], sa * (0.4 + 0.6 * k));
            }
        }
    }
    // giọt nước văng thành vòng cung rồi rơi
    for (let i = 0; i < 12; i++) {
        const R = rng(o.seed, i), ang = R.range(-Math.PI * 0.95, -Math.PI * 0.05), spd = R.range(30, 62), life = R.range(0.38, 0.62);
        if (t > life) continue;
        const k = t / life, x = Math.cos(ang) * spd * t, y = CY + Math.sin(ang) * spd * t + 90 * t * t, a = 1 - k * k;
        p.dot(x, y, k < 0.35 ? WHITE : C[6], a);
        p.dot(x, y + 1, C[4], a * 0.7);
        if (i % 4 === 0 && k < 0.5) sparkle(p, x, y, 1.5, WHITE, C[6], 0.4 * a);
    }
}
