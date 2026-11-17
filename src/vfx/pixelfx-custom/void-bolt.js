// ============================================================
// Hiệu ứng TỰ VẼ theo phong cách pixelfx cho Nyx (Hư Không) — 11/2026
//   missile: MỘT tia Ma Đạn Tinh Tú — tách từ hiệu ứng "Arcane missiles" của thư viện (src/vendor/pixelfx/fx/arcane/arcane-missiles.js):
//            giữ nguyên đầu tia (lõi nhiều lớp + 4 tia xoay), dải lụa xoắn 2 sợi phía sau, bụi sáng rơi lại, chớp nổ lúc trúng, bảng màu arcane.
//            Bản gốc vẽ cả chùm 5 tia vào 1 mục tiêu cố định trong 1 khung; ở đây mỗi tia là 1 hiệu ứng riêng, bay từ tay Nyx tới 1 điểm bất kỳ
//            trong đúng thời gian bay máy chủ đưa (voidFx.js dời cả khung theo đầu tia nên bay xa bao nhiêu cũng được).
//   pull:    1 nhịp HÚT của Hố Đen — vòng sáng co về tâm + các vệt bị kéo vào tâm (tâm ở (0, 0), ép dẹt như nhìn nghiêng) — 1 lần
//   Toạ độ: y âm là lên trên.
// The bolt and its pop are adapted from Sprite Fusion's open-source energy bolt (https://www.spritefusion.com/pixel-art-vfx/energy),
// MIT License, Copyright (c) 2026 Hugo Duprez — via pixelfx "Arcane missiles".
// ============================================================
import { Particles, Lights, P, Rng, fit, sparkle, rng, clamp, smooth, ease, TAU, WHITE, PAL } from '../../vendor/pixelfx/core/index.js';

const TRAIL_T = 0.15;   // dải lụa dài bằng quãng tia bay trong 0,15 giây (bản gốc: 18 mẫu × 1/120 giây)
const HALF = 118;       // nửa cạnh khung: dải lụa dài hơn thì cắt bớt
/**
 * o.link (voidFx.js đọc / ghi mỗi khung) — đơn vị điểm ảnh, gốc (0, 0) = bàn tay lúc tia rời tay:
 *   vào: tx, ty (đích, cập nhật theo mục tiêu đang chạy) · flight (giây bay) · heading (hướng rời tay, rad, y xuống dưới) · floor (y mặt đất)
 *   ra:  hx, hy (đầu tia — khung được dời theo điểm này) · arrived (đã tới nơi) · done (chớp nổ đã tan)
 */
export const missile = {
    meta: {
        name: 'Void missile', desc: 'Một tia Arcane missiles: rời tay theo hướng riêng, lượn vòng trên dải lụa xoắn rồi nổ chớp ở đích.',
        tags: ['arcane', 'missile', 'projectile', 'homing', 'magic', 'loop'], size: [HALF * 2, HALF * 2], origin: [HALF, HALF], duration: 1, loop: true, fps: 30,
        options: { palette: PAL.arcane, seed: 3, link: null },
    },
    create(o) {
        const C = fit(o.palette, 8), R = new Rng(o.seed);
        const ps = new Particles({ rng: R, ground: () => 1e6, sparks: [WHITE, C[6], C[5], C[4]] }), lights = new Lights();
        const L = o.link ?? { tx: 120, ty: 0, flight: 0.4, heading: -0.8 };
        const b = { x: 0, y: 0, vx: 0, vy: 0, trail: [], hit: -1, tw: R.range(0, TAU), acc: 0 };
        const jitter = [R.range(-3, 3), R.range(-5, 5)];
        let t = 0, started = false, p1 = null;
        L.hx = 0; L.hy = 0; L.arrived = false; L.done = false;

        // đường bay: rời tay theo `heading` rồi bị kéo vòng về đích, càng lúc càng nhanh (như tia gốc: lượn rồi lao vào)
        const at = (e) => {
            const tx = L.tx + jitter[0], ty = L.ty + jitter[1], u = 1 - e;
            const d = Math.hypot(tx, ty) || 1, side = Math.sign(tx || 1);
            const p2x = tx - side * Math.min(34, d * 0.3), p2y = ty - Math.min(26, d * 0.22);
            return [3 * u * u * e * p1[0] + 3 * u * e * e * p2x + e * e * e * tx, 3 * u * u * e * p1[1] + 3 * u * e * e * p2y + e * e * e * ty];
        };

        function ribbon(p) {
            const pts = b.trail, n = pts.length, fade = b.hit < 0 ? 1 : 1 - clamp((t - b.hit) / 0.16);
            if (n < 2 || fade <= 0) return;
            for (let i = 0; i < n - 1; i++) {
                const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], Ls = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / Ls, ny = (x1 - x0) / Ls;
                for (let d = 0; d < Ls; d += 0.5) {
                    const u = (i + d / Ls) / (n - 1), x = x0 + ((x1 - x0) * d) / Ls, y = y0 + ((y1 - y0) * d) / Ls, a = (1 - u) * 1.7 * fade;
                    // thân: thon dần về đuôi, giữa trắng gần đầu tia, nguội dần ra ngoài
                    const w = 2.6 * Math.pow(1 - u, 0.8) + 0.3;
                    for (let q = -w; q <= w; q += 0.5) {
                        const v = Math.abs(q) / w;
                        p.dot(x + nx * q, y + ny * q, v < 0.35 ? (u < 0.25 ? WHITE : C[6]) : v < 0.7 ? (u < 0.4 ? C[6] : C[5]) : u < 0.5 ? C[5] : C[4], a * (v < 0.7 ? 1 : 0.75));
                    }
                    // 2 sợi xoắn quanh thân: sáng khi vòng ra trước, mờ khi ra sau
                    for (const s of [0, Math.PI]) {
                        const ph = u * 10 - t * 26 + b.tw + s, off = Math.sin(ph) * (w + 1.4);
                        if (Math.cos(ph) > -0.2) p.dot(x + nx * off, y + ny * off, Math.cos(ph) > 0.4 ? (u < 0.35 ? WHITE : C[6]) : C[4], a);
                    }
                }
                if (i % 3 === 0) p.glow(x0, y0, 9 * (1 - i / n) + 3, C[5], 0.3 * (1 - i / n) * fade);
            }
        }
        function head(p) {
            const x = b.x, y = b.y;
            for (let i = 0; i < 4; i++) {
                const a = t * 24 + (i * TAU) / 4 + b.tw, l = 5.5 + 1.5 * Math.sin(t * 50 + i);
                p.line(x + Math.cos(a) * 3.2, y + Math.sin(a) * 3.2, x + Math.cos(a) * l, y + Math.sin(a) * l, C[6]);
            }
            p.circle(x, y, 3.8, C[4]);
            p.circle(x, y, 3, C[5]);
            p.circle(x, y, 2.1, C[6]);
            p.circle(x, y, 1.2, WHITE);
            p.glow(x, y, 24, C[5], 0.6);
            p.glow(x, y, 7, WHITE, 0.4);
        }
        function pop(p, q, x, y) {
            if (q < 0.16) {
                const r = 9 * (1 - q / 0.16) + 1.5;
                p.circle(x, y, r + 1.5, C[5]);
                p.circle(x, y, r, WHITE);
            }
            if (q < 0.4) {
                const l = 15 * (1 - q / 0.4) + 3;
                for (let d = -l; d <= l; d++) {
                    const a = Math.abs(d) / l, c = a < 0.3 ? WHITE : a < 0.65 ? C[6] : C[5];
                    p.dot(x + d, y, c, 1.15 - a);
                    p.dot(x, y + d * 0.7, c, 1.15 - a);
                }
            }
            const rr = 3 + 18 * ease.outCubic(q);
            p.ring(x, y, rr + 0.5, Math.max(1, 3 * (1 - q)), q < 0.3 ? WHITE : C[6], 1.2 - q);
        }

        return {
            update(dt) {
                t += dt;
                if (!started) {
                    started = true;
                    // điểm kéo đầu: rời tay theo hướng riêng (không chúi xuống dưới mặt đất)
                    const d = Math.hypot(L.tx, L.ty) || 1, len = clamp(d * 0.5, 26, 78);
                    p1 = [Math.cos(L.heading) * len, Math.sin(L.heading) * len];
                    if (L.floor != null) p1[1] = Math.min(p1[1], L.floor - 6);
                    lights.add(0, 0, 28, C[5], 0.7, 0.14);
                    for (let i = 0; i < 4; i++) {
                        const a = L.heading + R.range(-0.6, 0.6), v = R.range(60, 140);
                        ps.spawn(P.MOTE, 0, 0, Math.cos(a) * v, Math.sin(a) * v, R.range(0.12, 0.25), C[6], 0.6);
                    }
                }
                if (b.hit < 0) {
                    const u = clamp(t / Math.max(0.05, L.flight ?? 0.4)), e = 0.4 * u + 0.6 * u * u;
                    const [x, y] = at(e);
                    b.vx = (x - b.x) / Math.max(dt, 1e-4); b.vy = (y - b.y) / Math.max(dt, 1e-4);
                    b.x = x; b.y = y;
                    b.trail.unshift([x, y, t]);
                    while (b.trail.length > 2 && (t - b.trail[b.trail.length - 1][2] > TRAIL_T || Math.hypot(b.trail[b.trail.length - 1][0] - x, b.trail[b.trail.length - 1][1] - y) > HALF - 10)) b.trail.pop();
                    if ((b.acc += dt) > 0.012) {
                        b.acc = 0;
                        if (R.chance(0.6)) ps.spawn(P.MOTE, x, y, -b.vx * 0.08 + R.range(-25, 25), -b.vy * 0.08 + R.range(-25, 25), R.range(0.2, 0.4), R.chance(0.5) ? C[6] : C[5], 0.55);
                    }
                    if (u >= 1) {
                        b.hit = t;
                        L.arrived = true;
                        lights.add(x, y, 40, C[5], 0.8, 0.25);   // (bản gốc bán kính 70: ở đây thu lại cho gọn trong khung, Mana Burst nổ ngay sau đó)
                        lights.add(x, y, 24, WHITE, 0.85, 0.09);
                        for (let i = 0; i < 16; i++) {
                            const a = R.range(0, TAU), v = R.range(80, 230);
                            ps.spawn(P.SPARK, x, y, Math.cos(a) * v, Math.sin(a) * v - 40, R.range(0.15, 0.45));
                        }
                        for (let i = 0; i < 7; i++) {
                            const a = R.range(-Math.PI, 0.3), v = R.range(40, 140);
                            ps.spawn(i % 2 ? P.STAR : P.MOTE, x, y, Math.cos(a) * v, Math.sin(a) * v, R.range(0.25, 0.48), R.pick([WHITE, C[6], C[5]]), R.range(0.8, 1.6));
                        }
                    }
                } else if (t - b.hit > 0.55) L.done = true;
                L.hx = b.x; L.hy = b.y;
                ps.update(dt);
                lights.update(dt);
            },
            draw(p) {
                // khung luôn lấy đầu tia làm tâm: dời mọi thứ (toạ độ tính từ bàn tay) về quanh (0, 0)
                p.place(-b.x, -b.y, false, 0);
                ribbon(p);
                if (b.hit < 0) head(p);
                else { const k = (t - b.hit) / 0.35; if (k < 1) pop(p, k, b.x, b.y); }
                if (t < 0.3) sparkle(p, 0, 0, 3 + 2 * Math.sin(t * 40), C[6], C[5], 0.45 * (1 - t / 0.3));
                ps.draw(p);
                lights.draw(p);
            },
        };
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
                // vòng dày 3 điểm ảnh (trắng ở giữa) để nổi trên nền đĩa hố đen
                p.dot(x, y, k === 0 ? WHITE : C[6], a);
                p.dot(Math.cos(g) * (rx + 1), Math.sin(g) * (rx + 1) * SQ, C[6], a);
                p.dot(Math.cos(g) * (rx - 1), Math.sin(g) * (rx - 1) * SQ, C[6], a);
                if (j % 2 === 0) p.dot(Math.cos(g) * (rx + 2), Math.sin(g) * (rx + 2) * SQ, C[5], a * 0.7);
            }
        }
        // vệt bị kéo vào tâm
        for (let i = 0; i < 26; i++) {
            const R = rng(o.seed, i), g = R.range(0, TAU), r0 = R.range(0.55, 1) * PR, lag = R.range(0, 0.25), len = R.range(8, 18);
            const q = Math.max(0, Math.min(1, (u - lag) / 0.7));
            if (q <= 0 || q >= 1) continue;
            const r = r0 * (1 - q * q) + 4, cx = Math.cos(g), cy = Math.sin(g) * SQ, a = fade * (0.4 + 0.6 * q);
            p.line(cx * r, cy * r, cx * (r + len * (0.4 + q)), cy * (r + len * (0.4 + q)), q > 0.6 ? C[6] : C[5], a);
            p.line(cx * r, cy * r + 1, cx * (r + len * (0.4 + q)), cy * (r + len * (0.4 + q)) + 1, C[5], a * 0.8);
            p.disc(cx * r, cy * r, 1.2, WHITE, a);
        }
        // tâm nháy sáng lúc mọi thứ ập vào
        const hit = smooth(0.55, 0.8, u) * (1 - smooth(0.8, 1, u));
        if (hit > 0) { p.glow(0, 0, 16, C[5], 0.5 * hit); p.disc(0, 0, 2 + 3 * hit, WHITE, hit); }
    },
};
