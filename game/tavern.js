// ============================================================
// QUÁN ĂN (P6) — độ thân mật: mời anh hùng món ăn (Vàng) -> điểm thân mật -> cấp 0..10, mỗi cấp +1% Máu & Tấn công
// Mở khi xong nhiệm vụ "Bữa Tiệc Làng" của cô Lena (cờ nguyen_lieu_lena).
// ============================================================
const W = require('./wallet');

const FOODS = {
    bread: { name: 'Bánh mì nướng', emoji: '🥖', gold: 100, pts: 10 },
    soup: { name: 'Súp nấm sương', emoji: '🍲', gold: 300, pts: 35 },
    roast: { name: 'Gà quay mật ong', emoji: '🍗', gold: 800, pts: 100 },
};
const LEVELS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000, 4000];   // điểm cần cho cấp 0..10
const MAX = LEVELS.length - 1;
const BONUS_PER_LV = 0.01;
const FLAG = 'nguyen_lieu_lena';

const isOpen = (pr) => !!pr.flags?.[FLAG];
function ensureTavern(pr) {
    pr.affinity ??= {};
    return pr.affinity;
}
function levelOf(pts) {
    let lv = 0;
    while (lv < MAX && pts >= LEVELS[lv + 1]) lv++;
    return lv;
}
const bonus = (pts) => levelOf(pts ?? 0) * BONUS_PER_LV;

function feed(pr, wallet, heroId, foodId) {
    if (!isOpen(pr)) return { ok: false, why: 'Quán ăn mở khi giúp cô Lena chuẩn bị Bữa Tiệc Làng' };
    if (!pr.owned?.includes(heroId)) return { ok: false, why: 'Bạn chưa sở hữu anh hùng này' };
    const f = FOODS[foodId];
    if (!f) return { ok: false, why: 'Món không có trong thực đơn' };
    const aff = ensureTavern(pr);
    const before = aff[heroId] ?? 0;
    if (levelOf(before) >= MAX) return { ok: false, why: 'Đã thân thiết tối đa' };
    if (!W.trySpend(wallet, 'gold', f.gold)) return { ok: false, why: `Cần ${f.gold} Vàng` };
    aff[heroId] = Math.min(LEVELS[MAX], before + f.pts);
    return { ok: true, gained: aff[heroId] - before, level: levelOf(aff[heroId]), up: levelOf(aff[heroId]) > levelOf(before) };
}

/** Thông tin từng anh hùng sở hữu: điểm, cấp, điểm cấp kế, thưởng */
function state(pr) {
    const aff = ensureTavern(pr);
    return (pr.owned ?? []).map(id => {
        const pts = aff[id] ?? 0, lv = levelOf(pts);
        return { id, pts, level: lv, max: MAX, next: lv < MAX ? LEVELS[lv + 1] : null, cur: LEVELS[lv], bonus: lv * BONUS_PER_LV };
    });
}

module.exports = { FOODS, LEVELS, MAX, BONUS_PER_LV, FLAG, isOpen, ensureTavern, levelOf, bonus, feed, state };
