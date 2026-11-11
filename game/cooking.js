// ============================================================
// 🍲 NẤU ĂN (chương 1) — luật thuần, không socket. Nguyên liệu: game/gather.js (pr.world.mats)
//   · Nấu ở bếp cô Lena (tavern_in) hoặc lửa trại trên bản đồ. Mở khi xong việc "Mở lại quán" (cờ nguyen_lieu_lena) -> tính năng 'cooking'.
//   · Món ăn = đồ dùng trong trận: trước trận xếp tối đa 3 món vào TÚI ĐỒ ĂN, mỗi món dùng 1 lần / trận, cách nhau 8 giây.
//     Chỉ dùng ở ải cốt truyện / ải nhánh / quái hoang (không dùng ở Đấu, Test, hầm ngục).
//   · Anh hùng ăn đúng MÓN TỦ: hiệu quả +50%.
//   Lưu trong pr.world: dishes { mã: số lượng } · pouch [mã, …] (tối đa 3) · books { mã: true }
//   Công thức "đã biết" tính thẳng từ save (nhiệm vụ đã xong / ghi chép đã đọc / sách đã mua) -> không cần móc thêm ở chỗ khác.
// ============================================================
const G = require('./gather');
const W = require('./wallet');

const FLAG = 'nguyen_lieu_lena';
const POUCH_MAX = 3, COOLDOWN = 8000, FAV_BONUS = 1.5, DISH_MAX = 20;

// effect: heal (phần máu tối đa) · orb (số Orb) · cleanse (giải 1 lượt hiệu ứng xấu) · atk / def (phần trăm, trong ms) · revive (hồi sinh với phần máu)
// learn: start (biết sẵn khi mở bếp) · quest (xong nhiệm vụ) · note (đọc ghi chép) · book (mua sách ở bếp cô Lena)
const RECIPES = [
    { id: 'chao', name: 'Cháo lúa mì', needs: { lua: 2, muoi: 1 }, effect: { heal: 0.20 }, learn: { start: true } },
    { id: 'banh_mi', name: 'Bánh mì trứng', needs: { lua: 2, trung: 1 }, effect: { heal: 0.25 }, learn: { start: true } },
    { id: 'sup_nam', name: 'Súp nấm sương', needs: { nam: 2, sua: 1 }, effect: { heal: 0.18, orb: 1 }, learn: { start: true }, note: 'Món mà {ten} nhớ ra là mình thích.' },
    { id: 'thit_nuong', name: 'Thịt nướng than', needs: { thit: 2, go: 1, muoi: 1 }, effect: { heal: 0.10, atk: 0.15, ms: 10000 }, learn: { quest: 's_bay' }, fav: 'warrior', hint: 'Giúp Lão Gus kiểm bẫy thỏ' },
    { id: 'banh_tao', name: 'Bánh táo mật', needs: { tao: 2, lua: 1, trung: 1 }, effect: { orb: 2 }, learn: { book: 'book1' }, fav: 'assassin', hint: 'Mua Sổ tay bếp của cô Lena' },
    { id: 'tra_thao', name: 'Trà thảo mộc', needs: { thao: 2, dau: 1 }, effect: { cleanse: true, heal: 0.12 }, learn: { quest: 'sera' }, fav: 'priest', hint: 'Giúp Seraphine tìm thảo dược' },
    { id: 'ca_nuong', name: 'Cá nướng lá thơm', needs: { ca_chep: 1, thao: 1, go: 1 }, effect: { orb: 1, atk: 0.12, ms: 10000 }, learn: { note: 'n_mo_tho_san' }, fav: 'archer', hint: 'Đọc tấm gỗ ở nấm mộ trong Rừng Sương' },
    { id: 'canh_trung', name: 'Canh trứng rau', needs: { trung: 2, thao: 1, muoi: 1 }, effect: { heal: 0.10, def: 0.20, ms: 10000 }, learn: { quest: 'h_ga' }, hint: 'Lũ gà trong làng biết bí mật này' },
    { id: 'lau_ca', name: 'Lẩu cá bạc', needs: { ca_bac: 1, nam: 1, sua: 1 }, effect: { heal: 0.25, atk: 0.10, ms: 8000 }, learn: { book: 'book2' }, hint: 'Mua Sổ tay bếp kinh thành' },
    { id: 'sup_hoi_sinh', name: 'Súp hồi sinh', needs: { ca_vang: 1, mat: 1, thao: 2 }, effect: { revive: 0.30 }, learn: { note: 'n_dinh' }, rare: true, hint: 'Leo lên Đỉnh Đồi Gió ở Rừng Sương' },
];
const BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));
// bếp cô Lena bán đồ cơ bản + sách nấu ăn (needStage: phải qua ải đó)
const SHOP = {
    muoi: { mat: 'muoi', gold: 30 }, sua: { mat: 'sua', gold: 40 }, lua: { mat: 'lua', gold: 60 }, trung: { mat: 'trung', gold: 60 },
    book1: { book: true, name: 'Sổ tay bếp của cô Lena', gold: 600, teaches: 'banh_tao' },
    book2: { book: true, name: 'Sổ tay bếp kinh thành', gold: 1500, teaches: 'lau_ca', needStage: 'c1-13' },
};

function ensure(pr) {
    const w = G.ensure(pr);
    w.dishes ??= {}; w.pouch ??= [];
    return w;
}
const unlocked = (pr) => !!pr.flags?.[FLAG];
/** Công thức đã biết chưa (tính từ save) */
function knows(pr, id) {
    const r = BY_ID[id], w = pr.world ?? {};
    if (!r || !unlocked(pr)) return false;
    const l = r.learn;
    return !!(l.start || (l.quest && w.quests?.[l.quest] === 'done') || (l.note && w.notes?.[l.note]) || (l.book && w.books?.[l.book]));
}
function effectText(e, mul = 1) {
    const pct = (v) => `${Math.round(v * mul * 100)}%`, out = [];
    if (e.revive) out.push(`Hồi sinh 1 đồng đội với ${pct(e.revive)} máu`);
    if (e.heal) out.push(`Hồi ${pct(e.heal)} máu`);
    if (e.orb) out.push(`+${Math.round(e.orb * mul * 10) / 10} Orb`);
    if (e.cleanse) out.push('Giải hiệu ứng xấu');
    if (e.atk) out.push(`+${pct(e.atk)} tấn công ${e.ms / 1000} giây`);
    if (e.def) out.push(`+${pct(e.def)} phòng thủ ${e.ms / 1000} giây`);
    return out.join(' · ');
}

/** Nấu n phần: trừ nguyên liệu đúng 1 lần rồi cộng món */
function cook(pr, id, n = 1) {
    const r = BY_ID[id], w = ensure(pr);
    n = Math.max(1, Math.min(10, Math.floor(n) || 1));
    if (!unlocked(pr)) return { ok: false, why: 'Bếp chưa mở. Hãy giúp cô Lena mở lại quán trước' };
    if (!r) return { ok: false, why: 'Không có công thức này' };
    if (!knows(pr, id)) return { ok: false, why: 'Chưa học công thức này' };
    if ((w.dishes[id] ?? 0) + n > DISH_MAX) return { ok: false, why: `Chỉ mang được ${DISH_MAX} phần mỗi món` };
    const need = Object.fromEntries(Object.entries(r.needs).map(([k, v]) => [k, v * n]));
    if (!G.takeMats(pr, need)) return { ok: false, why: `Thiếu nguyên liệu: ${Object.entries(need).filter(([k, v]) => G.have(pr, k) < v).map(([k, v]) => `${G.MATS[k].name} (${G.have(pr, k)}/${v})`).join(', ')}` };
    w.dishes[id] = (w.dishes[id] ?? 0) + n;
    return { ok: true, id, n, text: `Nấu xong ${n} ${r.name}!` };
}
/** Mua đồ cơ bản / sách nấu ăn ở bếp cô Lena */
function buy(pr, wallet, id, n = 1) {
    const it = SHOP[id], w = ensure(pr);
    if (!unlocked(pr)) return { ok: false, why: 'Quầy bếp chưa mở' };
    if (!it) return { ok: false, why: 'Không có món hàng này' };
    if (it.book) {
        if (w.books[id]) return { ok: false, why: 'Đã mua cuốn này rồi' };
        if (it.needStage && !pr.campaign?.cleared?.story?.[it.needStage]) return { ok: false, why: `Sách này về hàng sau khi qua ải ${Number(it.needStage.slice(3))}` };
        if (!W.trySpend(wallet, 'gold', it.gold)) return { ok: false, why: `Cần ${it.gold} Vàng` };
        w.books[id] = true;
        return { ok: true, text: `Đã mua ${it.name}. Học được công thức: ${BY_ID[it.teaches].name}` };
    }
    n = Math.max(1, Math.min(20, Math.floor(n) || 1));
    if (G.have(pr, it.mat) + n > G.MAT_MAX) return { ok: false, why: 'Túi đã đầy món này' };
    if (!W.trySpend(wallet, 'gold', it.gold * n)) return { ok: false, why: `Cần ${it.gold * n} Vàng` };
    G.addMat(pr, it.mat, n);
    return { ok: true, text: `Mua ${n} ${G.MATS[it.mat].name}` };
}

// ---------- túi đồ ăn ----------
/** Túi hợp lệ: tối đa 3 món, mỗi món không quá số đang có */
function cleanPouch(pr, list) {
    const w = ensure(pr), left = { ...w.dishes }, out = [];
    for (const id of Array.isArray(list) ? list : []) {
        if (out.length >= POUCH_MAX) break;
        if (!BY_ID[id] || !(left[id] > 0)) continue;
        left[id]--; out.push(id);
    }
    return out;
}
function setPouch(pr, list) {
    if (!unlocked(pr)) return { ok: false, why: 'Chưa mở Nấu ăn' };
    if (Array.isArray(list) && list.length > POUCH_MAX) return { ok: false, why: `Túi đồ ăn chỉ chứa ${POUCH_MAX} món` };
    const w = ensure(pr);
    w.pouch = cleanPouch(pr, list);
    return { ok: true, pouch: [...w.pouch] };
}
/** Trận này có được dùng món ăn không: chỉ ải cốt truyện / nhánh / quái hoang */
const allowedIn = (mode, stageId) => mode === 'campaign' && typeof stageId === 'string' && (/^c\d+-/.test(stageId) || stageId.startsWith('wild-'));
/** Túi mang vào trận (bản chụp lúc vào trận): [{ id, used }] + mốc hồi chung */
function battlePouch(pr, mode, stageId) {
    if (!unlocked(pr) || !allowedIn(mode, stageId)) return { slots: [], cdUntil: 0 };
    return { slots: cleanPouch(pr, ensure(pr).pouch).map(id => ({ id, used: false })), cdUntil: 0 };
}
/** Hiệu quả của món với 1 anh hùng (món tủ ×1,5) */
function effectFor(id, classId) {
    const r = BY_ID[id];
    if (!r) return null;
    const fav = !!r.fav && r.fav === classId, k = fav ? FAV_BONUS : 1, e = r.effect;
    return { id, name: r.name, fav, heal: (e.heal ?? 0) * k, orb: (e.orb ?? 0) * k, cleanse: !!e.cleanse, atk: (e.atk ?? 0) * k, def: (e.def ?? 0) * k, ms: e.ms ?? 0, revive: (e.revive ?? 0) * k };
}
/** Chọn người ăn khi không chỉ định: món hồi sinh -> người đã gục đầu tiên · món khác -> người còn sống ít máu nhất (theo %) */
function pickTarget(squad, id) {
    const heroes = squad.map((m, i) => ({ m, i })).filter(o => !o.m.summon);
    if (BY_ID[id]?.effect.revive) { const dead = heroes.find(o => !o.m.alive); if (dead) return dead.i; }
    const alive = heroes.filter(o => o.m.alive);
    if (!alive.length) return -1;
    return alive.sort((a, b) => a.m.hp / a.m.maxHp - b.m.hp / b.m.maxHp)[0].i;
}
/** Dùng 1 ô trong túi: kiểm tra (đã dùng / hồi chung / còn món / người ăn hợp lệ) rồi TRỪ món đúng 1 lần. Chưa áp hiệu quả. */
function useSlot(pr, bp, slot, target, now) {
    const s = bp?.slots?.[slot], w = ensure(pr);
    if (!s) return { ok: false, why: 'Ô này không có món' };
    if (s.used) return { ok: false, why: 'Món này đã dùng trong trận' };
    if (now < bp.cdUntil) return { ok: false, why: `Chờ ${Math.ceil((bp.cdUntil - now) / 1000)} giây nữa` };
    if (!target || target.summon) return { ok: false, why: 'Hãy chọn một anh hùng' };
    const r = BY_ID[s.id];
    if (!target.alive && !r.effect.revive) return { ok: false, why: 'Người đã gục không ăn được món này' };
    if (!(w.dishes[s.id] > 0)) { s.used = true; return { ok: false, why: 'Hết món này rồi' }; }
    w.dishes[s.id]--;
    if (!w.dishes[s.id]) delete w.dishes[s.id];
    w.pouch = cleanPouch(pr, w.pouch);
    s.used = true;
    bp.cdUntil = now + COOLDOWN;
    return { ok: true, effect: effectFor(s.id, target.classId) };
}
/** Áp hiệu quả lên 1 thành viên trong trận. h = { heal(m, amount), cleanse(m), orbCost } do server.js đưa vào (dùng lại hàm hồi máu / giải hiệu ứng sẵn có) */
function applyEffect(m, e, now, h) {
    const out = { healed: 0, orb: 0, revived: false, fav: e.fav };
    if (!m.alive) {
        if (!e.revive) return out;
        m.alive = true; m.state = 'idle'; m.pendingDmg = 0; m.queuedSkills = []; m.actionUntil = 0; m.castingSkillId = null;
        m.hp = Math.max(1, Math.round(m.maxHp * e.revive));
        m.statusEffects = (m.statusEffects ?? []).filter(ef => ef.noCleanse && ef.endTime > now && ef.type !== 'judged');
        out.revived = true; out.healed = m.hp;
        return out;
    }
    const heal = e.heal + e.revive;   // món hồi sinh cho người còn sống: chỉ hồi máu
    if (heal > 0) out.healed = h.heal(m, m.maxHp * heal);
    if (e.orb > 0) { const before = m.mp ?? 0; m.mp = Math.min(m.maxMp ?? before, before + e.orb * h.orbCost); out.orb = (m.mp - before) / h.orbCost; }
    if (e.cleanse) h.cleanse(m);
    if (e.atk > 0 || e.def > 0) {
        m.statusEffects = (m.statusEffects ?? []).filter(ef => ef.type !== 'meal_buff');
        m.statusEffects.push({ type: 'meal_buff', atk: e.atk, def: e.def, endTime: now + e.ms, duration: e.ms });
    }
    return out;
}
/** Quái hoang rơi thịt: 55% được 1, 15% được 2 */
function wildDrop(pr, rng = Math.random) {
    const r = rng(), n = r < 0.15 ? 2 : r < 0.70 ? 1 : 0;
    return n ? G.addMat(pr, 'thit', n) : 0;
}

/** Gói dữ liệu bảng Nấu ăn / túi đồ ăn gửi client */
function state(pr) {
    const w = ensure(pr), open = unlocked(pr);
    return {
        open, pouchMax: POUCH_MAX, cooldown: COOLDOWN / 1000,
        recipes: RECIPES.map(r => {
            const known = knows(pr, r.id);
            return known ? { id: r.id, known: true, name: r.name, fav: r.fav ?? null, rare: !!r.rare, effect: effectText(r.effect), favEffect: r.fav ? effectText(r.effect, FAV_BONUS) : null, note: r.note ?? null,
                needs: Object.entries(r.needs).map(([id, n]) => ({ id, name: G.MATS[id].name, n, have: G.have(pr, id) })),
                can: Math.min(...Object.entries(r.needs).map(([id, n]) => Math.floor(G.have(pr, id) / n))), have: w.dishes[r.id] ?? 0 }
                : { id: r.id, known: false, name: '???', hint: open ? r.hint ?? 'Chưa rõ cách học' : 'Giúp cô Lena mở lại quán', fav: null, have: 0 };
        }),
        dishes: Object.entries(w.dishes).filter(([id, n]) => BY_ID[id] && n > 0).map(([id, n]) => ({ id, name: BY_ID[id].name, n, fav: BY_ID[id].fav ?? null, effect: effectText(BY_ID[id].effect) })),
        pouch: cleanPouch(pr, w.pouch),
        shop: Object.entries(SHOP).map(([id, it]) => ({ id, book: !!it.book, name: it.book ? it.name : G.MATS[it.mat].name, gold: it.gold, mat: it.mat ?? null,
            owned: it.book ? !!w.books[id] : G.have(pr, it.mat), locked: !!(it.needStage && !pr.campaign?.cleared?.story?.[it.needStage]), lockText: it.needStage ? `Về hàng sau ải ${Number(it.needStage.slice(3))}` : null,
            teaches: it.teaches ? BY_ID[it.teaches].name : null })),
    };
}

module.exports = { FLAG, POUCH_MAX, COOLDOWN, FAV_BONUS, DISH_MAX, RECIPES, BY_ID, SHOP, ensure, unlocked, knows, effectText, cook, buy, cleanPouch, setPouch, allowedIn, battlePouch, effectFor, pickTarget, useSlot, applyEffect, wildDrop, state };
