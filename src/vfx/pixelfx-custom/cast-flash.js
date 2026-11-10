// ============================================================
// "Loé ra đòn" — hiệu ứng TỰ VẼ theo phong cách pixelfx (bảng màu, sparkle, glow, rng của thư viện)
//   cho đòn đánh thường của nhân vật / quái đánh xa (ném bùa, bắn tên, phóng phép...): thư viện chỉ có vệt chém cận chiến.
//   Ở bàn tay phía trước: loé trắng -> vòng sáng nở ra rồi tan, 4 tia chữ thập co lại, tia lửa bắn về phía trước rơi nhẹ.
//   Màu theo palette (lửa, nước, độc, lá...). Toạ độ: chân ở (0, 0), y âm là lên trên, nhìn sang phải (flip tự lật).
// ============================================================
import { fit, sparkle, rng, smooth, WHITE, PAL } from '../../vendor/pixelfx/core/index.js';

export const meta = {
    name: 'Cast flash',
    desc: 'Loé ra đòn ở bàn tay: vòng sáng nở, tia chữ thập, tia lửa bắn về phía trước.',
    tags: ['cast', 'shoot', 'attack', 'flash', 'one-shot'],
    size: [84, 72],
    origin: [30, 62],
    duration: 0.5,
    loop: false,
    fps: 30,
    options: { palette: PAL.arcane, seed: 3 },
};

const HX = 13, HY = -27;   // bàn tay phía trước, ngang ngực (nhân vật cao 44 px)

export function draw(p, t, o) {
    const C = fit(o.palette, 8), u = t / meta.duration;
    // loé trắng ở tay (3 nhịp đầu)
    const flash = 1 - smooth(0, 0.25, u);
    if (flash > 0) {
        p.glow(HX, HY, 10, C[5], 0.55 * flash);
        p.disc(HX, HY, 1 + 2.5 * flash, WHITE, flash);
    }
    // vòng sáng nở ra rồi tan (ép dẹt theo chiều đứng như nhìn nghiêng)
    const rr = 2 + 11 * smooth(0, 0.7, u), ra = 1 - smooth(0.25, 0.9, u);
    if (ra > 0) {
        for (let j = 0, n = 40; j < n; j++) {
            const g = (j / n) * Math.PI * 2, x = HX + Math.cos(g) * rr * 0.6, y = HY + Math.sin(g) * rr;
            p.dot(x, y, u < 0.35 ? WHITE : C[6], ra);
        }
        p.glow(HX, HY, rr + 3, C[4], 0.18 * ra);
    }
    // tia chữ thập co dần
    const arm = 6 * (1 - smooth(0.05, 0.6, u));
    if (arm > 0.6) sparkle(p, HX + 1, HY, arm, WHITE, C[6], 0.55);
    // tia lửa bắn về phía trước, hơi rơi
    for (let i = 0; i < 9; i++) {
        const R = rng(o.seed, i), spd = R.range(38, 80), ang = R.range(-0.55, 0.45), life = R.range(0.22, 0.45);
        if (t > life) continue;
        const k = t / life, x = HX + Math.cos(ang) * spd * t, y = HY + Math.sin(ang) * spd * t + 40 * t * t;
        const a = 1 - k;
        p.dot(x, y, k < 0.3 ? WHITE : k < 0.6 ? C[6] : C[5], a);
        p.dot(x - Math.cos(ang) * 1.5, y - Math.sin(ang) * 1.5, C[4], a * 0.6);
        p.light(x, y, C[5], 0.25 * a);
    }
}
