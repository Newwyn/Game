// ---------- Ví tiền ----------
const CURRENCIES = ['gold', 'diamond', 'stone'];
const defaultWallet = () => ({ gold: 500, diamond: 100, stone: 0 });
const valid = (cur, n) => CURRENCIES.includes(cur) && Number.isFinite(n) && n >= 0;

function add(w, cur, n) {
    if (valid(cur, n)) w[cur] += n;
    return w;
}

function trySpend(w, cur, n) {
    if (!valid(cur, n) || !(w[cur] >= n)) return false;
    w[cur] -= n;
    return true;
}

module.exports = { CURRENCIES, defaultWallet, add, trySpend };
