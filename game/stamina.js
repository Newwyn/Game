const W = require('./wallet');

// ---------- Thể lực ----------
const MAX = 360;
const REGEN_SEC = 300;
const COST = { story: 4, hard: 6, hell: 10 };
const BUY = { diamond: 50, amount: 60, cap: 999 };
const defaultStamina = now => ({ value: MAX, lastAt: now });
const valid = n => Number.isFinite(n) && n >= 0;

function regen(st, now) {
    if (st.value >= MAX) {
        st.lastAt = now;
    } else {
        const points = Math.min(MAX - st.value, Math.max(0, Math.floor((now - st.lastAt) / (REGEN_SEC * 1000))));
        st.value += points;
        st.lastAt += points * REGEN_SEC * 1000;
    }
    return st;
}

function trySpend(st, n, now) {
    if (!valid(n)) return false;
    regen(st, now);
    if (st.value < n) return false;
    st.value -= n;
    return true;
}

function refund(st, n) {
    if (valid(n)) st.value = Math.min(BUY.cap, st.value + n);
    return st;
}

function buy(st, wallet) {
    if (st.value >= BUY.cap || !W.trySpend(wallet, 'diamond', BUY.diamond)) return false;
    refund(st, BUY.amount);
    return true;
}

module.exports = { MAX, REGEN_SEC, COST, BUY, defaultStamina, regen, trySpend, refund, buy };
