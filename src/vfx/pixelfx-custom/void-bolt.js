// ============================================================
// Hiệu ứng TỰ VẼ theo phong cách pixelfx cho Nyx (Hư Không) — 11/2026
//   mote: đốm ma đạn đang thành hình (lơ lửng sau lưng Nyx trước khi phóng) — lặp
//   bolt: 1 tia Ma Đạn Tinh Tú đang bay — đầu tia ở (0, 0), chĩa sang phải, đuôi sáng uốn lượn kéo về bên trái — lặp
//         (voidFx.js xoay cả tấm theo hướng bay nên chỉ cần vẽ 1 hướng)
//   pull: 1 nhịp HÚT của Hố Đen — vòng sáng co về tâm + các vệt bị kéo vào tâm (tâm ở (0, 0), ép dẹt như nhìn nghiêng) — 1 lần
//   Toạ độ: gốc ở GIỮA khung, y âm là lên trên.
// ============================================================
import { fit, sparkle, rng, smooth, TAU, WHITE, PAL } from '../../vendor/pixelfx/core/index.js';

const MOTE_D = 0.6;
export const mote = {
    meta: {
        name: 'Void mote', desc: 'Đốm ma đạn đang thành hình: lõi trắng, quầng tím, bụi sao xoáy vào.',
        tags: ['arcane', 'orb', 'charge', 'loop'], size: [30, 30], origin: [15, 15], duration: MOTE_D, loop: true, fps: 30,
        options: { palette: PAL.arcane, seed: 3 },
    },
    draw(p, t, o) {
        const C = fit(o.palette, 8), ph = t / MOTE_D, beat = 0.5 + 0.5 * Math.sin(ph * TAU);
        p.glow(0, 0, 8 + 2 * beat, C[4], 0.5);
        p.disc(0, 0, 2.6 + 0.5 * beat, C[5], 1);
        p.disc(0, 0, 1.5, WHITE, 1);
        sparkle(p, 0, 0, 3.5 + 1.5 * beat, WHITE, C[6], 0.6);
        // bụi sao xoáy vào lõi
        for (let i = 0; i < 5; i++) {
            const R = rng(o.seed, i), q = (ph + R.range(0, 1)) % 1, a = R.range(0, TAU) + q * 2.4, d = 11 * (1 - q) + 2;
            p.dot(Math.cos(a) * d, Math.sin(a) * d, q > 0.6 ? WHITE : C[6], 0.35 + 0.65 * q);
        }
    },
};

const BOLT_D = 0.4, TAIL = 30;
export const bolt = {
    meta: {
        name: 'Void bolt', desc: 'Tia ma đạn bay: lõi sao trắng, quầng tím, đuôi sáng uốn lượn, bụi sao rơi lại phía sau.',
        tags: ['arcane', 'projectile', 'missile', 'loop'], size: [56, 26], origin: [44, 13], duration: BOLT_D, loop: true, fps: 30,
        options: { palette: PAL.arcane, seed: 3 },
    },
    draw(p, t, o) {
        const C = fit(o.palette, 8), ph = t / BOLT_D;
        // đuôi: dải sáng thon dần, uốn lượn
        for (let i = 0; i < 30; i++) {
            const q = i / 29, x = -1.5 - q * TAIL, y = Math.sin(q * 6.5 - ph * TAU * 2 + (o.seed ?? 0)) * 2.4 * q;
            const r = 2.3 * (1 - q) + 0.35, a = (1 - q) * 0.95;
            p.disc(x, y, r, q < 0.2 ? C[6] : q < 0.55 ? C[5] : C[4], a);
            if (q < 0.5) p.dot(x, y, WHITE, a * 0.8);
        }
        // bụi sao rơi lại phía sau
        for (let i = 0; i < 6; i++) {
            const R = rng(o.seed, i + 11), q = (ph + R.range(0, 1)) % 1;
            p.dot(-4 - q * (TAIL + 4), R.range(-6, 6) * (0.3 + q), q < 0.4 ? WHITE : C[6], 1 - q);
        }
        // đầu tia
        p.glow(0, 0, 9, C[4], 0.6);
        p.disc(0, 0, 3.1, C[6], 1);
        p.disc(0, 0, 1.8, WHITE, 1);
        sparkle(p, 0, 0, 5 + 1.5 * Math.sin(ph * TAU * 2), WHITE, C[6], 0.6);
    },
};

const PULL_D = 0.55, PR = 100, SQ = 0.42;
export const pull = {
    meta: {
        name: 'Void pull', desc: 'Nhịp hút của Hố Đen: vòng sáng co về tâm, các vệt bị kéo vào tâm.',
        tags: ['shadow', 'gravity', 'pull', 'one-shot'], size: [216, 104], origin: [108, 52], duration: PULL_D, loop: false, fps: 30,
        options: { palette: PAL.shadow, seed: 5 },
    },
    draw(p, t, o) {
        const C = fit(o.palette, 8), u = Math.min(1, t / PULL_D);
        const fade = smooth(0, 0.12, u) * (1 - smooth(0.75, 1, u));
        // 2 vòng co về tâm (vòng sau trễ hơn 1 chút), càng vào trong càng nhanh
        for (let k = 0; k < 2; k++) {
            const q = Math.max(0, Math.min(1, (u - k * 0.16) / 0.8));
            if (q <= 0 || q >= 1) continue;
            const rx = PR * (1 - q * q) + 6, a = fade * (0.55 + 0.45 * q);
            const n = Math.ceil(rx * 3.2);
            for (let j = 0; j < n; j++) {
                const g = (j / n) * TAU, x = Math.cos(g) * rx, y = Math.sin(g) * rx * SQ;
                p.dot(x, y, k === 0 ? C[6] : C[5], a);
                if (k === 0 && j % 2 === 0) p.dot(Math.cos(g) * (rx + 1), Math.sin(g) * (rx + 1) * SQ, C[4], a * 0.6);
            }
        }
        // vệt bị kéo vào tâm
        for (let i = 0; i < 26; i++) {
            const R = rng(o.seed, i), g = R.range(0, TAU), r0 = R.range(0.55, 1) * PR, lag = R.range(0, 0.25), len = R.range(8, 18);
            const q = Math.max(0, Math.min(1, (u - lag) / 0.7));
            if (q <= 0 || q >= 1) continue;
            const r = r0 * (1 - q * q) + 4, cx = Math.cos(g), cy = Math.sin(g) * SQ, a = fade * (0.4 + 0.6 * q);
            p.line(cx * r, cy * r, cx * (r + len * (0.4 + q)), cy * (r + len * (0.4 + q)), q > 0.6 ? C[6] : C[5], a);
            p.dot(cx * r, cy * r, WHITE, a);
        }
        // tâm nháy sáng lúc mọi thứ ập vào
        const hit = smooth(0.55, 0.8, u) * (1 - smooth(0.8, 1, u));
        if (hit > 0) { p.glow(0, 0, 16, C[5], 0.5 * hit); p.disc(0, 0, 2 + 3 * hit, WHITE, hit); }
    },
};
