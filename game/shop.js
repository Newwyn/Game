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

module.exports = { PRICES, list, buy };
