// ============================================================
// HẦM NGỤC (P6) — tộc Người
//   · Hầm ngục đồ bộ (mở ở ải 15): tốn thể lực, rơi đồ 3 bộ tộc Người (tím / cam), 3 tầng
//   · Hầm ngục trang sức (mở ở ải 16): 3 lượt / ngày (mua thêm bằng Kim Cương), rơi nhẫn / dây chuyền + Đá Tinh Luyện
// Mỗi tầng mở khi qua tầng trước. Luật thuần — server.js nối vào luồng đánh ải Cốt truyện (id 'd-set-1'...).
// ============================================================
const W = require('./wallet');
const S = require('./stamina');

const POS = [{ x: 25, z: 0 }, { x: 30, z: -3 }, { x: 32, z: 3 }];
const squad = (...list) => list.map(([classId, name], i) => ({ classId, name, ...POS[i] }));

const DUNGEONS = {
    set: {
        name: 'Hầm ngục đồ bộ', feature: 'setDungeon', stamina: 8,
        tiers: [
            { lv: 14, itemLv: 10, enemies: squad(['c1_soldier', 'Lính Gác Hầm'], ['c1_spy', 'Mật Thám'], ['c1_fire', 'Chiến Binh Lửa']) },
            { lv: 24, itemLv: 20, enemies: squad(['b_morwen', 'Bóng Morwen'], ['c1_soldier', 'Lính Gác Hầm'], ['c1_fire', 'Chiến Binh Lửa']) },
            { lv: 34, itemLv: 30, enemies: squad(['b_valdric', 'Bóng Đại tướng'], ['c1_fire', 'Chiến Binh Lửa'], ['c1_fire', 'Chiến Binh Lửa']) },
        ],
    },
    jewel: {
        name: 'Hầm ngục trang sức', feature: 'jewelDungeon', runsPerDay: 3, buyCost: 30, maxBuy: 3,
        tiers: [
            { lv: 15, itemLv: 10, enemies: squad(['c1_goblin', 'Goblin Giữ Kho'], ['c1_trapper', 'Goblin Ném Bom'], ['c1_spy', 'Kẻ Trộm Ngọc']) },
            { lv: 25, itemLv: 20, enemies: squad(['b_skarn', 'Bóng Skarn'], ['c1_trapper', 'Goblin Ném Bom'], ['c1_spy', 'Kẻ Trộm Ngọc']) },
            { lv: 35, itemLv: 30, enemies: squad(['b_warden', 'Người Gác Kho Báu'], ['c1_soldier', 'Lính Gác Mộ'], ['c1_spy', 'Kẻ Trộm Ngọc']) },
        ],
    },
};
const SETS = ['ho_ve', 'chien_luoc', 'lu_khach'];
const SET_SLOTS = ['weapon', 'armor', 'hands', 'legs'];

const dungeonId = (kind, tier) => `d-${kind}-${tier}`;
function parseId(id) {
    const m = /^d-(set|jewel)-([123])$/.exec(id ?? '');
    return m ? { kind: m[1], tier: Number(m[2]) } : null;
}
/** Ngày theo giờ máy chủ (YYYY-MM-DD) — lượt hầm trang sức đặt lại mỗi ngày */
function dayKey(now) {
    const d = new Date(now);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function ensureDungeon(pr, now) {
    pr.dungeon ??= {};
    const d = pr.dungeon;
    d.best ??= { set: 0, jewel: 0 };
    if (d.day !== dayKey(now)) { d.day = dayKey(now); d.jewelRuns = 0; d.jewelBought = 0; }
    d.jewelRuns ??= 0; d.jewelBought ??= 0;
    return d;
}
const runsLeft = (pr, now) => {
    const d = ensureDungeon(pr, now);
    return DUNGEONS.jewel.runsPerDay + d.jewelBought - d.jewelRuns;
};

/** Hầm / tầng có mở chưa (features: Set tính năng đã mở từ campaign.features) */
function isOpen(pr, kind, tier, features, now) {
    const dg = DUNGEONS[kind];
    if (!dg || !dg.tiers[tier - 1]) return { ok: false, why: 'Hầm ngục không tồn tại' };
    if (!features.has(dg.feature)) return { ok: false, why: kind === 'set' ? 'Hầm ngục đồ bộ mở khi qua ải 15' : 'Hầm ngục trang sức mở khi qua ải 16' };
    if (tier > 1 && (ensureDungeon(pr, now).best[kind] ?? 0) < tier - 1) return { ok: false, why: `Hãy qua tầng ${tier - 1} trước` };
    return { ok: true };
}
function canStart(pr, { kind, tier, classes }, features, now) {
    const open = isOpen(pr, kind, tier, features, now);
    if (!open.ok) return open;
    if (!Array.isArray(classes) || classes.length < 1 || classes.length > 4) return { ok: false, why: 'Hãy chọn từ 1 đến 4 anh hùng' };
    if (!classes.every(id => pr.owned?.includes(id))) return { ok: false, why: 'Bạn chưa sở hữu anh hùng này' };
    if (kind === 'set') {
        S.regen(pr.stamina, now);
        if (pr.stamina.value < DUNGEONS.set.stamina) return { ok: false, why: 'Không đủ thể lực' };
    } else if (runsLeft(pr, now) <= 0) return { ok: false, why: 'Hết lượt hôm nay — mua thêm lượt bằng Kim Cương' };
    return { ok: true };
}
/** Trừ chi phí lúc vào trận (đã qua canStart) */
function spend(pr, kind, now) {
    if (kind === 'set') return S.trySpend(pr.stamina, DUNGEONS.set.stamina, now);
    ensureDungeon(pr, now).jewelRuns++;
    return true;
}
function buyRun(pr, wallet, now) {
    const d = ensureDungeon(pr, now);
    if (d.jewelBought >= DUNGEONS.jewel.maxBuy) return { ok: false, why: 'Hôm nay đã mua tối đa lượt' };
    if (!W.trySpend(wallet, 'diamond', DUNGEONS.jewel.buyCost)) return { ok: false, why: `Cần ${DUNGEONS.jewel.buyCost} Kim Cương` };
    d.jewelBought++;
    return { ok: true };
}

const pick = (rng, arr) => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
/** Chiến lợi phẩm khi thắng -> { items: [{slot, level, rarity, set?}], refine, stone, gold } */
function rollLoot(rng, kind, tier) {
    const t = DUNGEONS[kind].tiers[tier - 1];
    const rarity = () => (rng() < 0.25 + 0.1 * (tier - 1) ? 4 : 3);   // tím / cam (tầng cao nhiều cam hơn)
    if (kind === 'set') {
        const n = rng() < 0.4 ? 2 : 1;
        const items = Array.from({ length: n }, () => ({ slot: pick(rng, SET_SLOTS), level: t.itemLv, rarity: rarity(), set: pick(rng, SETS) }));
        return { items, refine: 0, stone: 5 * tier, gold: 200 * tier };
    }
    return { items: [{ slot: pick(rng, ['ring', 'necklace']), level: t.itemLv, rarity: rarity() }], refine: tier, stone: 0, gold: 150 * tier };
}

/** Áp kết quả (thua: hoàn chi phí) -> { win, refund, refundRun, firstTier } — đồ do server tạo bằng game/gear.js */
function applyResult(pr, { kind, tier, win }, now) {
    const d = ensureDungeon(pr, now);
    if (!win) {
        if (kind === 'set') { S.refund(pr.stamina, DUNGEONS.set.stamina - 1); return { win: false, refund: DUNGEONS.set.stamina - 1 }; }
        d.jewelRuns = Math.max(0, d.jewelRuns - 1);   // thua hầm trang sức: không mất lượt
        return { win: false, refundRun: true };
    }
    const firstTier = (d.best[kind] ?? 0) < tier;
    if (firstTier) d.best[kind] = tier;
    return { win: true, firstTier };
}

/** Trạng thái gửi client */
function state(pr, features, now) {
    const d = ensureDungeon(pr, now);
    return Object.fromEntries(Object.entries(DUNGEONS).map(([kind, dg]) => [kind, {
        name: dg.name, open: features.has(dg.feature), best: d.best[kind] ?? 0,
        stamina: dg.stamina ?? 0, runsLeft: kind === 'jewel' ? runsLeft(pr, now) : null,
        bought: kind === 'jewel' ? d.jewelBought : null, buyCost: dg.buyCost ?? null, maxBuy: dg.maxBuy ?? null,
        tiers: dg.tiers.map((t, i) => ({ id: dungeonId(kind, i + 1), tier: i + 1, lv: t.lv, itemLv: t.itemLv,
            open: isOpen(pr, kind, i + 1, features, now).ok, enemies: t.enemies.map(e => e.name) })),
    }]));
}

const findTier = (id) => { const p = parseId(id); return p ? { ...p, ...DUNGEONS[p.kind].tiers[p.tier - 1], name: `${DUNGEONS[p.kind].name} · Tầng ${p.tier}` } : null; };

module.exports = { DUNGEONS, dungeonId, parseId, dayKey, ensureDungeon, runsLeft, isOpen, canStart, spend, buyRun, rollLoot, applyResult, state, findTier };
