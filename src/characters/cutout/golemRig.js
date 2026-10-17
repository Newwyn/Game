// ============================================================
// RIG GOLEM NGUYÊN TỐ — triệu hồi của Elarion (phép 🔥❄️⚡ Nguyên Tố Hợp Nhất)
// ============================================================
// Dùng NGUYÊN TRANH Golem (art/elarion/05-golem-v2.png) làm 1 hình liền -> giữ đúng nét vẽ.
// Cử động bằng cả thân (xem golemClips.js): nhún, chồm, lao, phồng / dẹp (sq), rung — xoay quanh điểm giữa 2 bàn chân.
// Các khớp KHÔNG có hình chỉ là điểm neo cho hiệu ứng: nắm đấm dung nham (handN), nắm đấm băng (handF), miệng (mouth), lõi ngực (core).
// Cắt: tools/cut_reference.py art/elarion/golem_spec.json -> golem_atlas.png + golemAtlas.json (thu 0.75)
import atlasUrl from '../../assets/sprites/golem_atlas.png';
import atlas from './golemAtlas.json';

const m = atlas.parts.body;
const FEET = [800, 1100];          // điểm giữa 2 bàn chân (toạ độ tranh gốc)
const TOP = 14;                    // đỉnh pha lê
const P = {                        // điểm neo hiệu ứng (toạ độ tranh gốc)
    handN: [300, 800],             // nắm đấm dung nham (tay sau, bên trái tranh)
    handF: [1185, 840],            // nắm đấm băng (tay trước)
    mouth: [1022, 330],
    core: [950, 500],
};
const pivot = [m.rect[0] + (FEET[0] - m.src[0]) * m.scale, m.rect[1] + (FEET[1] - m.src[1]) * m.scale];
const parts = {
    hips: { pos: FEET },
    body: { rect: m.rect, pivot, angle: 0, scale: 1 / m.scale, pos: FEET, parent: 'hips', z: 10 },
};
for (const [k, p] of Object.entries(P)) parts[k] = { pos: p, parent: 'body' };

export const GOLEM_RIG = {
    image: atlasUrl,
    atlasSize: atlas.atlasSize,
    origin: FEET,
    heightPx: FEET[1] - TOP,
    parts,
};
export const ASSASSIN_RIG = GOLEM_RIG; // tên chung cho tools/preview-cutout.html
export { golemClips as CLIPS, SKIN_KEYS, DEFAULT_SKINS, SECONDARY } from './golemClips.js';
