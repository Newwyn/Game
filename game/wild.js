// ============================================================
// 🌾 QUÁI HOANG (cỏ cao kiểu Pokémon): đi trên ruộng lúa / bãi cỏ rừng / cỏ ven đường có thể gặp quái
//   Không tốn thể lực, thưởng nhỏ (vàng, EXP, đôi khi Đá Cường Hoá). Mở sau khi qua ải 1. Ô nào là "cỏ cao": client (src/world/wild.js).
//   Mã trận: `wild-<khu>` — server.js dựng đội quái bằng squad(), áp thưởng bằng applyResult().
// ============================================================

// mỗi khu: cấp quái (theo số ải đã qua, kẹp trong khoảng) + bầy quái có thể gặp [classId, tên]
const POOLS = {
    outskirts: { name: 'Ruộng lúa Ngoại ô', min: 1, max: 8,
        mobs: [['c1_goblin', 'Goblin Rình Ruộng'], ['c1_trapper', 'Goblin Trộm Lúa'], ['c1_wolf', 'Sói Hoang']] },
    forest: { name: 'Bãi cỏ Rừng Sương', min: 2, max: 10,
        mobs: [['c1_wolf', 'Sói Sương'], ['c1_wolf', 'Sói Rừng'], ['c1_goblin', 'Goblin Lạc Bầy']] },
    road: { name: 'Cỏ ven Đường Vương Đạo', min: 10, max: 16,
        mobs: [['c1_soldier', 'Lính Đào Ngũ'], ['c1_spy', 'Kẻ Cướp Đường'], ['c1_wolf', 'Sói Đồng Cỏ']] },
};
const POS = [{ x: 25, z: 0 }, { x: 30, z: -3 }, { x: 32, z: 3 }];
const MUL = 0.75;   // quái hoang yếu hơn quái ải cùng cấp (đội đủ 3 – 4 người)
const MUL_BY_PARTY = { 1: 0.45, 2: 0.6 };   // đi 1 – 2 người: quái yếu hơn nữa

const isId = (id) => typeof id === 'string' && id.startsWith('wild-') && !!POOLS[id.slice(5)];
const sceneOf = (id) => (isId(id) ? id.slice(5) : null);
const clearedCount = (pr) => Object.keys(pr.campaign?.cleared?.story ?? {}).filter(k => /^c1-\d\d$/.test(k)).length;

/** Có gặp quái ở khu này không (đã qua ải 1, khu có bầy quái) */
function canStart(pr, scene) {
    if (!POOLS[scene]) return { ok: false, why: 'Khu này không có quái hoang' };
    if (!pr.campaign?.cleared?.story?.['c1-01']) return { ok: false, why: 'Qua ải 1 trước đã' };
    return { ok: true };
}

/** Cấp quái: theo số ải cốt truyện đã qua, kẹp trong khoảng của khu */
function levelOf(pr, scene) {
    const p = POOLS[scene];
    return Math.max(p.min, Math.min(p.max, clearedCount(pr)));
}

/** Đội quái: 2 con (đội 1 người) hoặc 3 con, chọn ngẫu nhiên trong bầy */
function squad(pr, scene, partySize, rng = Math.random) {
    const p = POOLS[scene];
    const n = partySize <= 1 ? 2 : 3;
    const list = Array.from({ length: n }, (_, i) => {
        const [classId, name] = p.mobs[Math.floor(rng() * p.mobs.length)];
        return { classId, name, ...POS[i] };
    });
    return { level: levelOf(pr, scene), layout: list, mul: MUL_BY_PARTY[partySize] ?? MUL, name: p.name };
}

/** Thắng: cộng vàng (+ đôi khi đá), trả EXP mỗi anh hùng. Thua: không mất gì. */
function applyResult(pr, scene, win, rng = Math.random) {
    if (!win) return { exp: 0, gold: 0, stone: 0, diamond: 0 };
    const lv = levelOf(pr, scene);
    const r = { exp: 50 + 25 * lv, gold: 20 + 8 * lv, stone: rng() < 0.25 ? 1 : 0, diamond: 0 };
    pr.wallet.gold += r.gold;
    pr.wallet.stone += r.stone;
    pr.wild ??= { wins: 0 };
    pr.wild.wins++;
    return r;
}

module.exports = { POOLS, MUL, MUL_BY_PARTY, isId, sceneOf, canStart, levelOf, squad, applyResult };
