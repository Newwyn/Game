// ============================================================
// QUÁI 2D TẠM (vẽ bằng code) — sinh vật viên nhộng nhìn nghiêng, ghép mảnh như Sát Thủ
// ============================================================
// Mỗi loại quái vẽ lên một canvas nhỏ (thân + chân + tay + đồ cầm), rồi dùng chung
// CutoutCharacterView + hệ động tác theo tư thế. Khi có tranh thật cho quái:
// làm bảng mảnh rời -> tools/build_atlas.py -> rig riêng giống assassin2Rig.js.
//   monster_tank      : mũ sắt + khiên tròn
//   monster_archer    : mũ thợ săn + cung
//   monster_supporter : mầm lá trên đầu + gậy phép
//   monster_dummy     : cọc gỗ có hồng tâm (không chân tay)
import { buildPoseClip } from './poseClip.js';

const W = 512, H = 256;
// Vùng các mảnh trong canvas
const R = {
    body: [4, 4, 184, 236],
    foot: [200, 4, 70, 42],
    hand: [200, 56, 44, 44],
    prop: [290, 4, 140, 236],
};

function shadeHex(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
    r = f(r); g = f(g); b = f(b);
    return `rgb(${r},${g},${b})`;
}

const OUTLINE = '#3a2a2e';

function drawBody(ctx, kind, color) {
    const [x, y, w, h] = R.body;
    const bx = x + 8, by = y + 36, bw = w - 16, bh = h - 40; // chừa chỗ cho mũ
    const isDummy = kind === 'monster_dummy';
    const base = isDummy ? '#a8743f' : color;
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, shadeHex(base, 0.25));
    g.addColorStop(1, shadeHex(base, -0.25));
    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bw / 2); ctx.fill(); ctx.stroke();
    // bụng sáng
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(bx + bw * 0.62, by + bh * 0.66, bw * 0.28, bh * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    // bóng sáng trên đầu
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(bx + bw * 0.35, by + bh * 0.16, bw * 0.16, bh * 0.07, -0.5, 0, Math.PI * 2); ctx.fill();

    if (isDummy) {
        // hồng tâm + vân gỗ
        ctx.strokeStyle = 'rgba(90,50,20,0.5)'; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bx + 20 + i * 30, by + 30); ctx.lineTo(bx + 15 + i * 32, by + bh - 20); ctx.stroke(); }
        [[42, '#fff'], [32, '#d94a3a'], [20, '#fff'], [9, '#d94a3a']].forEach(([r, c]) => {
            ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx + bw * 0.6, by + bh * 0.5, r, 0, Math.PI * 2); ctx.fill();
        });
        ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx + bw * 0.6, by + bh * 0.5, 42, 0, Math.PI * 2); ctx.stroke();
        return;
    }

    // Mặt nhìn sang PHẢI: mắt gần to, mắt xa hẹp sát mép
    const ex = bx + bw * 0.68, ey = by + bh * 0.36;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(ex, ey, 17, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2238'; ctx.beginPath(); ctx.ellipse(ex + 5, ey + 2, 9, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + 8, ey - 4, 3.5, 0, Math.PI * 2); ctx.fill();
    const fx = bx + bw - 14;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(fx, ey, 6, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2238'; ctx.beginPath(); ctx.ellipse(fx + 1, ey + 2, 3.5, 10, 0, 0, Math.PI * 2); ctx.fill();
    // má hồng + miệng
    ctx.fillStyle = 'rgba(255,120,120,0.35)'; ctx.beginPath(); ctx.ellipse(ex - 6, ey + 30, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ex + 18, ey + 32, 7, 0.2, Math.PI - 0.6); ctx.stroke();

    // Đồ đội đầu
    const top = by, cx = bx + bw / 2;
    if (kind === 'monster_tank') {
        ctx.fillStyle = '#9aa3ad'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(cx, top + 26, bw * 0.55, 48, 0, Math.PI, 0); ctx.lineTo(cx + bw * 0.55, top + 30); ctx.lineTo(cx - bw * 0.55, top + 30); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#d9a441'; ctx.beginPath(); ctx.roundRect(cx - 7, top - 30, 14, 34, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(cx - 25, top, 22, 9, -0.3, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'monster_archer') {
        ctx.fillStyle = '#5b7a3a'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(cx - bw * 0.58, top + 26); ctx.quadraticCurveTo(cx - 20, top - 10, cx - 50, top - 30); ctx.quadraticCurveTo(cx + 30, top - 10, cx + bw * 0.58, top + 26); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.ellipse(cx - 30, top - 8, 7, 26, -0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (kind === 'monster_supporter') {
        ctx.strokeStyle = '#4a7a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, top + 6); ctx.lineTo(cx, top - 22); ctx.stroke();
        ctx.fillStyle = '#6fcf4a'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(cx + 16, top - 26, 18, 8, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx - 16, top - 26, 18, 8, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
}

function drawFoot(ctx, color) {
    const [x, y, w, h] = R.foot;
    ctx.fillStyle = shadeHex(color, -0.35); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 4, h / 2 - 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function drawHand(ctx, color) {
    const [x, y, w, h] = R.hand;
    ctx.fillStyle = shadeHex(color, 0.1); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2 - 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

/** Vẽ đồ cầm tay; trả về điểm cầm (trong canvas) hoặc null */
function drawProp(ctx, kind, color) {
    const [x, y, w, h] = R.prop;
    const cx = x + w / 2, cy = y + h / 2;
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 5;
    if (kind === 'monster_tank') {
        ctx.fillStyle = shadeHex(color, -0.35);
        ctx.beginPath(); ctx.ellipse(cx, cy, 34, 62, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(cx, cy, 26, 52, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#d9a441'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        return [cx - 6, cy];
    }
    if (kind === 'monster_archer') {
        ctx.strokeStyle = '#7a4a24'; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.arc(cx - 40, cy, 82, -1.1, 1.1); ctx.stroke();
        ctx.strokeStyle = '#eee'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 40 + 82 * Math.cos(-1.1), cy + 82 * Math.sin(-1.1)); ctx.lineTo(cx - 40 + 82 * Math.cos(1.1), cy + 82 * Math.sin(1.1)); ctx.stroke();
        return [cx - 40 + 82, cy];
    }
    if (kind === 'monster_supporter') {
        ctx.fillStyle = '#7a4a24';
        ctx.beginPath(); ctx.roundRect(cx - 7, y + 40, 14, h - 50, 6); ctx.fill(); ctx.stroke();
        const glow = ctx.createRadialGradient(cx, y + 34, 2, cx, y + 34, 32);
        glow.addColorStop(0, '#ffffff'); glow.addColorStop(0.4, '#9dffb0'); glow.addColorStop(1, 'rgba(47,214,90,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, y + 34, 32, 0, Math.PI * 2); ctx.fill();
        return [cx, y + 150];
    }
    return null;
}

const cache = new Map();

/** Dữ liệu hiển thị (giống CHARACTER_VISUALS.xxx.cutout) cho một loại quái */
export function creatureVisual(kind, color = '#888888') {
    const key = `${kind}|${color}`;
    if (cache.has(key)) return cache.get(key);

    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    drawBody(ctx, kind, color);
    const isDummy = kind === 'monster_dummy';
    if (!isDummy) { drawFoot(ctx, color); drawHand(ctx, color); }
    const grip = drawProp(ctx, kind, color);

    // Lắp ráp (pixel): gốc ở giữa hai chân, thân nhìn sang phải
    const ORIGIN = [256, 400];
    const [bx, by, bw, bh] = R.body;
    const bodyBottom = [bx + bw / 2, by + bh - 6];
    const BODY_AT = [256, isDummy ? 398 : 382];
    const [fx, fy, fw, fh] = R.foot, [hx, hy, hw, hh] = R.hand;
    // Tay / chân không có cánh tay: điểm xoay đặt ở "vai" / "hông" (ngoài hình), để xoay = vung tay / bước chân
    const handPivot = [hx + hw / 2, hy + hh / 2 - 46];
    const footPivot = [fx + fw / 2, fy + fh / 2 - 26];
    const parts = {
        hips: { pos: BODY_AT },
        body: { rect: R.body, pivot: bodyBottom, pos: BODY_AT, parent: 'hips', z: 4 },
    };
    if (!isDummy) {
        parts.footN = { rect: R.foot, pivot: footPivot, pos: [266, 368], parent: 'hips', z: 5 };
        parts.footF = { rect: R.foot, pivot: footPivot, pos: [246, 368], parent: 'hips', z: 1, shade: 0.72 };
        parts.handN = { rect: R.hand, pivot: handPivot, pos: [266, 300], parent: 'body', z: 7 };
        parts.handF = { rect: R.hand, pivot: handPivot, pos: [240, 300], parent: 'body', z: 0, shade: 0.72 };
        if (grip) {
            const handCenter = [266, 300 + 46];
            parts.prop = { rect: R.prop, pivot: grip, pos: handCenter, parent: 'handN', z: kind === 'monster_tank' ? 8 : 6.5 };
        }
    }
    const rig = { image: c.toDataURL('image/png'), atlasSize: [W, H], origin: ORIGIN, heightPx: 212, parts }; // thân cao ~212px -> 1.85 đơn vị
    const visual = {
        rig,
        clips: (p, height) => creatureClips(p, height, isDummy),
        height: 1.85,
        shadowSize: 1.5,
        anims: {
            attack: { clip: 'attack', hitTime: 0.18 },
            throw: { clip: 'attack', hitTime: 0.18 },
        },
    };
    cache.set(key, visual);
    return visual;
}

function creatureClips(parts, height, isDummy) {
    const IDLE = { hips: [0, 0], body: 0, footN: 0, footF: 0, handN: 0.15, handF: -0.15, prop: 0 };
    const pose = (o) => ({ ...IDLE, ...o });
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height);
    if (isDummy) {
        return [
            c('idle', [0, 1], [IDLE, IDLE]),
            c('hurt', [0, 0.06, 0.3], [IDLE, pose({ body: 0.15 }), IDLE]),
            c('dead', [0, 1], [IDLE, IDLE]),
            c('stunned', [0, 0.3, 0.6], [pose({ body: 0.08 }), pose({ body: -0.08 }), pose({ body: 0.08 })]),
            c('fall', [0, 0.3], [IDLE, IDLE]),
            c('land', [0, 0.1, 0.35], [pose({ hips: [0, -0.04] }), pose({ body: -0.06 }), IDLE]),
        ];
    }
    return [
        c('idle', [0, 0.6, 1.2], [IDLE, pose({ hips: [0, -0.02], body: 0.03, handN: 0.2, handF: -0.1 }), IDLE]),
        // Nhảy lò cò: bật lên - đáp xuống
        c('move', [0, 0.1, 0.2, 0.3, 0.4], [
            pose({ hips: [0, 0], body: -0.12, footN: 0.5, footF: -0.5, handN: -0.5, handF: 0.5 }),
            pose({ hips: [0, 0.1], body: -0.18, footN: 0.1, footF: -0.1 }),
            pose({ hips: [0, 0], body: -0.12, footN: -0.5, footF: 0.5, handN: 0.5, handF: -0.5 }),
            pose({ hips: [0, 0.1], body: -0.18, footN: -0.1, footF: 0.1 }),
            pose({ hips: [0, 0], body: -0.12, footN: 0.5, footF: -0.5, handN: -0.5, handF: 0.5 }),
        ]),
        c('attack', [0, 0.1, 0.18, 0.3, 0.45], [
            IDLE,
            pose({ body: 0.25, hips: [-0.03, 0], handN: -1.6, footN: 0.2, footF: -0.2 }),
            pose({ body: -0.35, hips: [0.06, 0], handN: 1.7, handF: -0.6, footN: 0.5, footF: -0.4 }),
            pose({ body: -0.25, hips: [0.04, 0], handN: 1.4, handF: -0.4, footN: 0.4, footF: -0.3 }),
            IDLE,
        ]),
        c('cast', [0, 0.3, 0.6], [
            pose({ hips: [0, 0.02], body: 0.12, handN: 2.6, handF: 2.4 }),
            pose({ hips: [0, 0.04], body: 0.16, handN: 2.8, handF: 2.6 }),
            pose({ hips: [0, 0.02], body: 0.12, handN: 2.6, handF: 2.4 }),
        ]),
        c('hurt', [0, 0.06, 0.32], [IDLE, pose({ body: 0.45, hips: [-0.05, 0], handN: 1.2, handF: 1.0 }), IDLE]),
        c('dead', [0, 1], [pose({ body: 0.2, handN: 0.8, handF: 0.6 }), pose({ body: 0.2, handN: 0.8, handF: 0.6 })]),
        c('stunned', [0, 0.3, 0.6], [pose({ body: 0.18, handN: 0.6, handF: 0.4 }), pose({ body: -0.12, handN: 0.3, handF: 0.7 }), pose({ body: 0.18, handN: 0.6, handF: 0.4 })]),
        c('fall', [0, 0.15, 0.3], [
            pose({ handN: 2.6, handF: 2.4, footN: 0.6, footF: 0.4 }),
            pose({ handN: 2.8, handF: 2.6, footN: 0.7, footF: 0.5 }),
            pose({ handN: 2.6, handF: 2.4, footN: 0.6, footF: 0.4 }),
        ]),
        c('land', [0, 0.08, 0.3, 0.5], [
            pose({ hips: [0, -0.1], body: -0.25, handN: 0.9, handF: -0.9 }),
            pose({ hips: [0, -0.1], body: -0.25, handN: 0.9, handF: -0.9 }),
            pose({ hips: [0, 0.03], body: 0.05 }),
            IDLE,
        ]),
        c('victory', [0, 0.2, 0.4], [IDLE, pose({ hips: [0, 0.12], handN: 2.8, handF: 2.6 }), IDLE]),
        c('victoryIdle', [0, 0.25, 0.5], [pose({ handN: 2.7, handF: 2.5 }), pose({ hips: [0, 0.08], handN: 2.9, handF: 2.7 }), pose({ handN: 2.7, handF: 2.5 })]),
    ];
}
