// ============================================================
// CỬA HÀNG ANH HÙNG (P6) — mở sau ải 20: mua anh hùng chưa sở hữu bằng Kim Cương
// ============================================================
const W = require('./wallet');

const PRICES = { mage: 600, alchemist: 600, reaper: 800, wrestler: 800, dancer: 800, summoner: 800, elementalist: 1200 };

function list(pr) {
    return Object.entries(PRICES).map(([id, price]) => ({ id, price, owned: !!pr.owned?.includes(id) }));
}
function buy(pr, wallet, heroId, features) {
    if (!features.has('heroShop')) return { ok: false, why: 'Cửa hàng anh hùng mở khi qua ải 20' };
    const price = PRICES[heroId];
    if (!price) return { ok: false, why: 'Anh hùng này không bán' };
    if (pr.owned.includes(heroId)) return { ok: false, why: 'Đã có anh hùng này' };
    if (!W.trySpend(wallet, 'diamond', price)) return { ok: false, why: `Cần ${price} Kim Cương` };
    pr.owned.push(heroId);
    return { ok: true, heroId };
}

const MONTHLY_LIMIT_MESSAGE = 'Bùa May Mắn chỉ mua được 1 lần mỗi tháng — quay lại vào tháng sau';
const monthKey = now => {
    const date = new Date(now);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
function itemLimit(pr, id, now) {
    if (id !== 'luck_charm') return null;
    const available = pr.shopLimits?.luck_charm !== monthKey(now);
    return { available, text: available ? 'Còn 1/1 lượt tháng này' : 'Đã mua tháng này' };
}
/** Atomic item purchase; caller supplies the catalog entry and server-local date/time. */
function buyItem(pr, item, count, now) {
    const n = Math.max(1, Math.min(20, count | 0));
    const limit = itemLimit(pr, item.id, now);
    if (limit && (!limit.available || n !== 1)) return { ok: false, why: MONTHLY_LIMIT_MESSAGE };
    for (const [cur, value] of Object.entries(item.cost)) {
        if ((pr.wallet[cur] ?? 0) < value * n) return { ok: false, why: `Không đủ ${cur === 'gold' ? 'Vàng' : 'Kim Cương'}` };
    }
    for (const [cur, value] of Object.entries(item.cost)) pr.wallet[cur] -= value * n;
    const target = item.wallet ? pr.wallet : (pr.items ??= {});
    target[item.id] = (target[item.id] ?? 0) + (item.qty ?? 1) * n;
    if (limit) (pr.shopLimits ??= {}).luck_charm = monthKey(now);
    return { ok: true, count: n };
}

module.exports = { PRICES, list, buy, monthKey, itemLimit, buyItem, MONTHLY_LIMIT_MESSAGE };
