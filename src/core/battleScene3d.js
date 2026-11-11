// ============================================================
// SÂN ĐẤU DỰNG BẰNG MÔ HÌNH 3D CỦA BẢN ĐỒ THẾ GIỚI (11/2026 — người chơi thích phong cách bản đồ, chê nền trận vẽ tranh)
//   Dùng lại chính bộ dựng của bản đồ (src/world3d/build.js: nhà, tháp, tường thành, sạp chợ, lều, hầm mộ, cối xay…)
//   + bộ mô hình src/assets/world3d (Kenney CC0) -> trận đấu và bản đồ cùng một phong cách.
//   Mặc định BẬT cho mọi cảnh; xem lại nền vẽ tranh cũ: thêm ?bg3d=0 vào địa chỉ trang.
//   Toạ độ trong file này tính bằng Ô của bản đồ (1 ô = S đơn vị trận đấu): sân đánh (server ARENA_BOUNDS x ±48, z ±13)
//   = x ±18,5 ô, z ±5 ô. Vật cao đặt SAU sân (z < -5,5) hoặc hai bên (|x| > 19,5); trong sân chỉ có cỏ / hoa thấp.
// ============================================================
import * as THREE from 'three';
import { GROUND_Y } from '../config.js';
import { uTime, uSeeThrough } from '../world3d/assets.js';
import { buildProps } from '../world3d/build.js';

export const BG3D = typeof location === 'undefined' || new URLSearchParams(location.search).get('bg3d') !== '0';
const S = 2.6;   // 1 ô bản đồ = 2,6 đơn vị trận đấu (nhân vật trận cao ~2,9 = ~1,1 ô như trên bản đồ)

const ROUND = ['nature/tree_oak', 'nature/tree_default', 'nature/tree_detailed', 'nature/tree_fat'];
const DARK = ['nature/tree_oak_dark', 'nature/tree_default_dark', 'nature/tree_detailed_dark'];
const PINES = ['nature/tree_pineRoundA', 'nature/tree_pineRoundB', 'nature/tree_pineDefaultA', 'nature/tree_pineDefaultB'];
const TALLPINES = ['nature/tree_pineTallA_detailed', 'nature/tree_pineTallB_detailed', 'nature/tree_pineRoundC', 'nature/tree_pineRoundD'];
const BUSH = ['nature/plant_bush', 'nature/plant_bushDetailed', 'nature/plant_bushLarge', 'nature/plant_bushSmall'];
const ROCK = ['nature/rock_largeA', 'nature/rock_largeB', 'nature/rock_largeC', 'nature/rock_tallA', 'nature/rock_smallA', 'nature/rock_smallFlatA'];
const FLOWER = ['nature/flower_purpleA', 'nature/flower_redA', 'nature/flower_yellowA', 'nature/flower_purpleB', 'nature/flower_redB', 'nature/flower_yellowB'];
const GRASS = ['nature/grass', 'nature/grass_large'];
const SHROOM = ['nature/mushroom_red', 'nature/mushroom_redGroup', 'nature/mushroom_tan', 'nature/mushroom_tanGroup'];
const RED = 0xc0392b, BLUE = 0x3f6fc6, GREEN = 0x3f9a4a, GOLD = 0xd9a441, PURPLE = 0x7a4fb0;

/** Bộ viết cảnh: gom danh sách [kiểu, ...tham số] cho buildProps */
function scene(seedNo) {
    let s = seedNo;
    const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const pick = (a) => a[Math.floor(R() * a.length)];
    const items = [];
    const put = (...it) => items.push(it);
    const model = (key, x, z, sc = 1, r = R() * 6.28, y = 0) => put('model', key, x, z, { s: sc, r, y });
    const api = {
        items, R, pick, put, model,
        /** Dải cây: từ x0 tới x1, cách nhau `step`, quanh hàng z (lệch ±jz), cỡ sc..sc+ds */
        trees(list, z, { x0 = -24, x1 = 24, step = 2.2, jz = 0.8, sc = 2.6, ds = 1.0 } = {}) {
            for (let x = x0; x <= x1; x += step * (0.75 + R() * 0.5)) model(pick(list), x, z + (R() - 0.5) * 2 * jz, sc + R() * ds);
        },
        /** Rừng nền 3 lớp (gần / giữa / xa) sau lưng sân */
        woods(near, far, { z = -7, deep = true } = {}) {
            api.trees(near, z, { step: 2.4, sc: 2.8, ds: 1.0 });
            api.trees(far, z - 3.2, { x0: -27, x1: 27, step: 1.8, jz: 1.4, sc: 3.4, ds: 1.4 });
            if (deep) api.trees(far, z - 8, { x0: -32, x1: 32, step: 2.2, jz: 2.4, sc: 4.4, ds: 2 });
        },
        /** Hai bên sân: cây / bụi khép cảnh */
        sides(list, { sc = 2.8 } = {}) {
            for (const side of [-1, 1]) for (let z = -5; z <= 6; z += 1.7 + R()) { model(pick(list), side * (20.6 + R() * 2.4), z, sc + R()); model(pick(BUSH), side * (19.7 + R()), z + 0.8, 1.6 + R() * 0.6); }
        },
        /** Viền sau sân (z -5,7..-6,5): bụi, đá, gốc cây, nấm, hoa, thùng, bia mộ — lớp chi tiết gần nhân vật nhất */
        edge(kinds = { bush: 0.42, rock: 0.2, log: 0.1, shroom: 0.12, flower: 0.16 }, { z = -5.7, x0 = -20, x1 = 20, step = 1.1 } = {}) {
            for (let x = x0; x <= x1; x += step * (0.7 + R() * 0.9)) {
                let t = R(); const zz = z - R() * 0.8;
                for (const [k, w] of Object.entries(kinds)) {
                    if (t >= w) { t -= w; continue; }
                    if (k === 'bush') model(pick(BUSH), x, zz, 1.5 + R() * 0.9);
                    else if (k === 'rock') model(pick(ROCK), x, zz, 1.2 + R() * 1.1);
                    else if (k === 'log') model(pick(['nature/stump_old', 'nature/stump_round', 'nature/log', 'nature/log_large']), x, zz, 1.5 + R() * 0.5);
                    else if (k === 'shroom') model(pick(SHROOM), x, zz, 1.4 + R() * 0.6);
                    else if (k === 'flower') model(pick(FLOWER), x, zz, 1.5 + R() * 0.5);
                    else if (k === 'crate') model(pick(['survival/box', 'survival/box-large', 'survival/barrel']), x, zz, 1.7 + R() * 0.5);
                    else if (k === 'grave') model(pick(['graveyard/gravestone-cross', 'graveyard/cross-column', 'graveyard/urn-round']), x, zz, 1.6 + R() * 0.5, (R() - 0.5) * 0.5);
                    else if (k === 'stone') model(pick(['nature/stone_largeA', 'nature/stone_tallA', 'nature/stone_smallA', 'survival/resource-stone']), x, zz, 1.4 + R());
                    break;
                }
            }
        },
        /** Cỏ + hoa THẤP rải thưa trong sân (không che nhân vật, lay theo gió): dày ở mép, gần như trống ở giữa */
        turf(n = 300, { flowers = 0.16, list = GRASS } = {}) {
            for (let i = 0; i < n; i++) {
                const x = -20 + R() * 40, z = -5.2 + R() * 10.8;
                if (Math.abs(z) < 2.3 && R() < 0.8) continue;
                if (z > 3 && R() < 0.5) continue;
                if (R() < flowers) model(pick(FLOWER), x, z, 0.75 + R() * 0.4); else model(pick(list), x, z, 0.55 + R() * 0.45);
            }
        },
        /** Dãy nhà dân sau sân */
        houses(z0 = -11, { xs = [-17, -10, -3, 5, 12], roofs = ['red', 'brown', 'red', 'brown', 'blue'], wall = 'wood', d = 3.6, h = 2.0 } = {}) {
            xs.forEach((x, i) => { const w = 4 + R() * 1.6; put('house', { x0: x, z0: z0 + (R() - 0.5), x1: x + w, z1: z0 + d, door: x + w / 2, roof: roofs[i % roofs.length], wall: i % 3 === 2 ? 'stone' : wall, h: h + R() * 0.4 }); });
        },
        lamps(z = -6.2, xs = [-15, -7.5, 0, 7.5, 15]) { xs.forEach(x => put('lamp', x, z)); },
        banners(z, xs, colors = [RED]) { xs.forEach((x, i) => put('banner', x, z, colors[i % colors.length])); },
    };
    return api;
}

/** Công thức từng cảnh (khoá = tên trong src/core/battleThemes.js) */
const RECIPES = {
    // ---- thiên nhiên ----
    meadow(c) { c.woods(ROUND, [...ROUND, ...DARK]); c.sides(ROUND); c.edge(); c.put('tent', -3, -7.2, 3.2, 0.2); c.model('nature/log_stackLarge', -12, -6.3, 2.2, 0.4); c.model('nature/campfire_stones', 8, -6, 1.8, 0); c.model('nature/campfire_logs', 8, -6, 1.8, 0.6); c.model('nature/sign', 14, -5.9, 2); c.turf(320); },
    forest(c) { c.woods([...PINES, ...ROUND], [...TALLPINES, ...DARK]); c.sides(PINES); c.edge({ bush: 0.3, rock: 0.25, log: 0.15, shroom: 0.2, flower: 0.1 }); c.model('nature/rock_tallB', -5, -6.8, 3.2, 1); c.model('nature/rock_tallA', 14, -7, 2.8, 2); c.model('nature/statue_obelisk', 2, -7.2, 2.6, 0); c.put('mist', -8, -6.5, 5); c.put('mist', 9, -6.8, 5); c.turf(340, { flowers: 0.08 }); },
    field(c) {
        for (let x = -20; x <= 20; x += 0.9) for (const z of [-6, -6.9, -7.8]) c.model(c.R() < 0.5 ? 'nature/crops_wheatStageB' : 'nature/crops_wheatStageA', x + c.R() * 0.4, z, 1.7 + c.R() * 0.3, 0);
        c.put('fence', [-21, -5.5], [21, -5.5]); c.put('windmill', -11, -10.5); c.put('scarecrow', 4, -7); c.put('haystack', 12, -9.2, 1.1); c.put('haystack', 14, -9.8, 0.9); c.put('haystack', -3, -9.6, 1.0);
        c.put('house', { x0: 7, z0: -13.5, x1: 12, z1: -10.2, door: 9.5, roof: 'brown' }); c.trees(ROUND, -14.5, { step: 3, sc: 3.4 }); c.trees(DARK, -19, { x0: -30, x1: 30, sc: 4.6 }); c.sides(ROUND); c.turf(260, { flowers: 0.22 });
    },
    road(c) { c.put('fence', [-21, -5.6], [-4, -5.6]); c.put('fence', [5, -5.6], [21, -5.6]); c.model('survival/signpost', 0.5, -6, 2.4, 0); c.model('town/cart', -9, -6.6, 2.2, 0.5); c.model('nature/rock_largeB', 13, -6.4, 2.2); c.put('haystack', 16, -6.8, 0.9); c.woods(ROUND, [...ROUND, ...DARK], { z: -8.5 }); c.sides(ROUND); c.edge({ bush: 0.3, rock: 0.2, flower: 0.2, log: 0.1 }, { z: -6.3 }); c.turf(220); },
    swamp(c) { c.woods([...DARK, ...PINES], TALLPINES); c.sides(DARK); c.edge({ bush: 0.3, shroom: 0.3, log: 0.2, rock: 0.2 }); for (const x of [-14, -6, 3, 11, 17]) c.model('nature/lily_large', x, -5.9 - c.R(), 2.2); c.put('glowShroom', -9, -6.4, 2.4); c.put('glowShroom', 6, -6.6, 2.0); c.put('mist', -10, -6, 6); c.put('mist', 0, -6.6, 6); c.put('mist', 11, -6.2, 6); c.model('nature/canoe', 14, -6.5, 2.2, 0.4); c.turf(260, { flowers: 0.04, list: ['nature/grass_large', 'nature/grass_leafs'] }); },
    elf(c) {
        c.trees(['nature/tree_fat', 'nature/tree_oak'], -7.4, { step: 3.4, sc: 5, ds: 1.6 }); c.trees(['nature/tree_fat', 'nature/tree_detailed'], -11.5, { x0: -27, x1: 27, step: 2.8, sc: 6.5, ds: 2 }); c.trees(DARK, -18, { x0: -32, x1: 32, sc: 8, ds: 2 }); c.sides(['nature/tree_fat']);
        for (const x of [-16, -9, -2, 5, 12, 18]) c.model('graveyard/lantern-candle', x, -6, 2.2, 0);
        c.put('glowShroom', -12, -6.5, 2.6); c.put('glowShroom', 1, -6.7, 2.2); c.put('glowShroom', 14, -6.4, 2.6); c.edge({ flower: 0.5, shroom: 0.25, bush: 0.25 }); c.put('mist', -6, -6.4, 6); c.put('mist', 8, -6.6, 6); c.turf(340, { flowers: 0.3 });
    },
    // ---- làng / trại ----
    village(c) { c.houses(-10.6); c.put('well', -1, -6.6); c.put('fence', [-20, -5.7], [-4, -5.7]); c.put('fence', [3, -5.7], [20, -5.7]); c.put('haystack', 10, -6.8, 0.9); c.model('town/cart', -12, -6.6, 2.2, 0.3); c.model('survival/barrel', 6, -6.3, 2); c.model('survival/box', 6.9, -6.5, 1.9); c.lamps(-6.1, [-16, 16]); c.trees(ROUND, -15.5, { step: 2.6, sc: 3.6 }); c.sides(ROUND); c.turf(180, { flowers: 0.2 }); },
    well(c) { c.houses(-11.2, { xs: [-18, -11, 6, 13] }); c.put('well', 0, -7.4); c.lamps(-6, [-4.5, 4.5, -14, 14]); c.model('graveyard/bench', -5.5, -6.6, 2, 0); c.model('graveyard/bench', 5.5, -6.6, 2, 0); c.model('survival/bucket', 1.3, -6.5, 2); c.trees(ROUND, -15.5, { step: 2.8, sc: 3.6 }); c.sides(ROUND); c.edge({ flower: 0.5, bush: 0.3, crate: 0.2 }, { step: 1.8 }); c.turf(120, { flowers: 0.25 }); },
    camp(c) {
        c.put('palisade', [-22, -10.5], [22, -10.5]); for (const [x, r] of [[-13, 0.3], [-5, -0.2], [4, 0.15], [13, -0.3]]) c.put('tent', x, -7.6 - c.R(), 3.4, r);
        c.model('survival/campfire-pit', 0, -6.3, 2.4, 0); c.model('survival/campfire-stand', 0, -6.3, 2.4, 0); c.banners(-6.2, [-17, -9, 9, 17], [RED]); c.edge({ crate: 0.6, log: 0.2, rock: 0.2 }, { step: 1.9 });
        c.model('survival/bedroll', -8.5, -6.2, 2, 0.6); c.model('survival/workbench', 8, -6.4, 2.2, 0); c.woods(PINES, [...PINES, ...DARK], { z: -12.5 }); c.sides(PINES); c.turf(140, { flowers: 0.05 });
    },
    outpost(c) {
        c.put('palisade', [-22, -8.2], [-3, -8.2]); c.put('palisade', [3, -8.2], [22, -8.2]); c.put('watchtower', -15, -7); c.put('watchtower', 15, -7); c.put('tent', -8, -6.9, 3, 0.2); c.put('tent', 8, -6.9, 3, -0.2);
        c.banners(-8, [-2.6, 2.6], [RED]); c.edge({ crate: 0.55, rock: 0.25, log: 0.2 }, { step: 2 }); c.model('survival/campfire-pit', 0, -6.2, 2.2, 0); c.woods(PINES, [...TALLPINES, ...DARK], { z: -11 }); c.sides(PINES); c.turf(150, { flowers: 0.05 });
    },
    // ---- mỏ ----
    mine(c, deep = false) {
        c.put('cliff', -24, -12, 24, -8, deep ? 4.4 : 3.4); c.put('cliff', -24, -8, -10, -6.6, 2.2); c.put('cliff', 10, -8, 24, -6.6, 2.2); c.put('mineEntrance', 0, -7.6); c.put('rails', [[0, -7.2], [0, -5.6]]); c.put('rails', [[-14, -5.9], [14, -5.9]]);
        for (const x of [-16, -8, 8, 16]) c.model('graveyard/lantern-candle', x, -6.3, 2.4, 0);
        c.edge({ stone: 0.5, crate: 0.3, rock: 0.2 }, { step: 1.7, z: -6 }); c.model('survival/tool-pickaxe', -4, -6.2, 2.2, 0.6); c.model('survival/resource-stone', 5, -6.3, 2.4); c.model('town/cart-high', -11, -6.2, 2, 1.2);
        if (deep) { c.put('glowShroom', -6, -6.3, 2.2); c.put('glowShroom', 12, -6.2, 2.2); c.put('mist', 0, -6.2, 7); }
    },
    deepMine(c) { RECIPES.mine(c, true); },
    // ---- phố thị ----
    square(c) { c.houses(-12.4, { xs: [-19, -12.5, 6.5, 13], roofs: ['blue', 'red', 'red', 'blue'], wall: 'plaster', h: 2.4 }); c.put('fountain', 0, -8.2, 2.2); c.lamps(-6, [-16, -8, 8, 16]); c.put('stall', -6.5, -6.9, RED, 0.2); c.put('stall', 6.5, -6.9, BLUE, -0.2); c.model('town/hedge-large', -13, -6.3, 2, 0); c.model('town/hedge-large', 13, -6.3, 2, 0); c.banners(-6.4, [-3.4, 3.4], [BLUE]); c.put('tower', -22, -12, { h: 5, r: 1.4 }); c.put('tower', 22, -12, { h: 5, r: 1.4 }); c.put('castleWall', [-26, -15], [26, -15], 2.4); },
    market(c) {
        c.houses(-12.2, { xs: [-19, -12, -5, 3, 10, 16], roofs: ['red', 'blue', 'brown', 'red', 'blue'], wall: 'plaster', h: 2.3 });
        [[-16, RED], [-11, GOLD], [-6, GREEN], [0, BLUE], [6, PURPLE], [11, RED], [16, GOLD]].forEach(([x, col], i) => c.put('stall', x, -6.9 - (i % 2) * 0.5, col, (c.R() - 0.5) * 0.3));
        c.edge({ crate: 0.7, flower: 0.3 }, { step: 2.4, z: -5.9 }); c.model('town/cart', -19, -6.4, 2.2, 0.6); c.lamps(-6.1, [-13.5, -3, 8.5, 19]);
    },
    gate(c) { c.put('castleWall', [-26, -8.6], [-3.2, -8.6], 4.2); c.put('castleWall', [3.2, -8.6], [26, -8.6], 4.2); c.put('tower', -3.6, -8.6, { h: 5.6, r: 1.5 }); c.put('tower', 3.6, -8.6, { h: 5.6, r: 1.5 }); c.model('castle/gate', 0, -8.5, 3.1, 0); c.put('tower', -17, -8.6, { h: 5, roof: null }); c.put('tower', 17, -8.6, { h: 5, roof: null }); c.banners(-7.9, [-10, -6.5, 6.5, 10], [RED, BLUE]); c.lamps(-6, [-14, -5, 5, 14]); c.edge({ crate: 0.4, bush: 0.4, flower: 0.2 }, { step: 2.6 }); },
    castle(c) {
        c.put('hall', { x0: -8, z0: -15, x1: 8, z1: -10, h: 4.4, roofH: 2.4, door: 0 }); c.put('tower', -9, -10.4, { h: 6.4, r: 1.5 }); c.put('tower', 9, -10.4, { h: 6.4, r: 1.5 }); c.put('spire', 0, -13, { w: 2.2, h: 7.5, roofH: 3.2, wall: 0xe8e4dc, roof: BLUE });
        c.put('castleWall', [-26, -9.4], [-10.6, -9.4], 2.4); c.put('castleWall', [10.6, -9.4], [26, -9.4], 2.4); c.put('tower', -20, -9.4, { h: 4.4 }); c.put('tower', 20, -9.4, { h: 4.4 });
        c.put('fountain', 0, -7.2, 1.8); for (const x of [-15, -11, 11, 15]) c.model('town/hedge-large', x, -6.2, 2, 0); c.banners(-9.2, [-4.5, 4.5], [BLUE]); c.lamps(-6, [-6.5, 6.5, -18, 18]); c.edge({ flower: 0.6, bush: 0.4 }, { step: 2.2, z: -5.9 });
    },
    bridge(c) { for (const z of [-5.6, 5.8]) c.put('castleWall', [-26, z], [26, z], 0.9); c.lamps(-5.9, [-16, -8, 0, 8, 16]); c.put('tower', -22, -6.4, { h: 4.6, roof: null, r: 1.5 }); c.put('tower', 22, -6.4, { h: 4.6, roof: null, r: 1.5 }); c.banners(-5.9, [-12, 12], [RED]); c.trees(DARK, -16, { x0: -32, x1: 32, sc: 3, step: 2.2 }); c.trees(PINES, -21, { x0: -34, x1: 34, sc: 4, step: 2.4 }); },
    battlement(c) { c.put('castleWall', [-26, -5.8], [26, -5.8], 1.3); c.put('tower', -19, -6.4, { h: 4, roof: null, r: 1.6 }); c.put('tower', 19, -6.4, { h: 4, roof: null, r: 1.6 }); c.put('tower', 0, -7.4, { h: 6.2, r: 1.7 }); for (const x of [-12, -6, 6, 12]) c.model('castle/flag-banner-long', x, -5.9, 2.4, 0, 1.3); c.edge({ crate: 0.7, stone: 0.3 }, { step: 3, z: -5.2, x0: -17, x1: 17 }); c.trees(DARK, -22, { x0: -34, x1: 34, sc: 2.6, step: 2 }); },
    tower(c) { c.put('castleWall', [-26, -5.8], [26, -5.8], 1.1); c.put('spire', -14, -7.6, { w: 2, h: 6.5, roofH: 3 }); c.put('spire', 14, -7.6, { w: 2, h: 6.5, roofH: 3 }); c.put('tower', 0, -8.2, { h: 7.5, r: 2, roof: 0x2a3b6a }); for (const x of [-8, 8]) c.model('castle/flag-pennant', x, -5.9, 2.6, 0, 1.1); for (const x of [-18, -5, 5, 18]) c.model('graveyard/lightpost-single', x, -5.3, 2.2, 0); },
    // ---- trong nhà ----
    hall(c) {
        c.put('castleWall', [-26, -9], [26, -9], 5.4); for (let x = -20; x <= 20; x += 5) { c.model('graveyard/pillar-large', x, -6.6, 3.4, 0); c.model('graveyard/pillar-large', x + 2.5, -8.2, 3.4, 0); }
        for (const x of [-15, -5, 5, 15]) c.model('castle/flag-banner-long', x, -8.4, 3, 0, 2.6); c.model('graveyard/altar-stone', 0, -7.6, 3, 0); for (const x of [-12.5, -7.5, 7.5, 12.5]) c.model('graveyard/lightpost-double', x, -6, 2.2, 0); for (const x of [-18, 18]) c.model('graveyard/urn-round', x, -6, 2.4);
    },
    library(c) {
        c.put('hall', { x0: -24, z0: -13, x1: 24, z1: -8.6, h: 5, wall: 0x8a6a48, roof: 0x5a3f2a, roofH: 0.6, windows: 0xf2d49a });
        for (let x = -20; x <= 20; x += 4) { c.model('town/wall-wood-detail-cross', x, -8.3, 2.6, 0); c.model('town/pillar-wood', x + 2, -6.6, 3, 0); }
        for (const x of [-16, -8, 8, 16]) c.model('graveyard/lantern-candle', x, -6, 2.6, 0); c.edge({ crate: 1 }, { step: 3.4, z: -6.4 }); c.model('survival/workbench', -3, -6.8, 2.6, 0); c.model('graveyard/bench', 3.5, -6.6, 2.2, 0);
    },
    crypt(c) { c.put('castleWall', [-26, -9.4], [26, -9.4], 4.6); c.put('crypt', -9, -7.6, 3.2); c.put('crypt', 9, -7.6, 3.2); c.model('graveyard/crypt-door', 0, -9, 3.4, 0); for (let x = -20; x <= 20; x += 5) c.model('graveyard/column-large', x, -6.8, 3, 0); c.put('fence', [-21, -5.8], [21, -5.8], 'graveyard/iron-fence', 1.5); c.edge({ grave: 0.8, stone: 0.2 }, { step: 1.8, z: -6.3 }); for (const x of [-14, 14]) c.model('graveyard/lightpost-single', x, -6, 2.4, 0); c.put('mist', -8, -6.2, 6); c.put('mist', 8, -6.4, 6); },
    ruins(c) { for (let x = -19; x <= 19; x += 4.2) c.model(c.R() < 0.6 ? 'graveyard/column-large' : 'graveyard/pillar-obelisk', x + c.R(), -6.6 - c.R() * 1.6, 2.2 + c.R() * 1.6, c.R(), 0); c.put('fence', [-22, -8.6], [-6, -8.6], 'graveyard/stone-wall', 1.8); c.put('fence', [7, -8.6], [22, -8.6], 'graveyard/stone-wall', 1.8); c.model('graveyard/altar-stone', 0, -7.6, 3.2, 0); c.edge({ stone: 0.45, rock: 0.3, bush: 0.15, grave: 0.1 }, { step: 1.5 }); c.trees(DARK, -11.5, { sc: 3.6, step: 2.6 }); c.trees(TALLPINES, -16, { x0: -30, x1: 30, sc: 4.6 }); c.put('mist', -9, -6.2, 6); c.put('mist', 9, -6.6, 6); c.turf(120, { flowers: 0.03 }); },
    moon(c) {
        for (let x = -20; x <= 20; x += 4) c.model('graveyard/column-large', x, -6.6, 3.6, 0); c.put('hall', { x0: -7, z0: -14, x1: 7, z1: -9.6, h: 4.2, wall: 0xdfe8f4, roof: 0x8fb4e8, roofH: 2, windows: 0x9fd0ff, door: 0, doorColor: 0x6f8fc0 }); c.put('dome', 0, -11.8, 2.6, 4.2, 0x9fc4ee);
        c.put('tower', -12, -10.6, { h: 6, r: 1.3, roof: 0x8fb4e8, wall: 0xe6eef8 }); c.put('tower', 12, -10.6, { h: 6, r: 1.3, roof: 0x8fb4e8, wall: 0xe6eef8 });
        for (const x of [-17, -10, 10, 17]) c.model('nature/statue_obelisk', x, -8, 3.4, 0); c.put('glowShroom', -6, -6.2, 2.4); c.put('glowShroom', 6, -6.2, 2.4); c.trees(['nature/tree_fat'], -15.5, { x0: -30, x1: 30, sc: 5.5, step: 3.4 }); c.edge({ flower: 0.6, stone: 0.4 }, { step: 2.4 });
    },
};
export const MODEL_SCENES = new Set(Object.keys(RECIPES));

// ---------- chạy: gió lay cỏ cây + các chuyển động riêng của cảnh (cối xay, sương, nấm sáng) ----------
const live = [];   // { rear, anim }
let ticking = false;
function startTick() {
    if (ticking) return;
    ticking = true;
    const tick = () => {
        const t = performance.now() / 1000;
        let any = false;
        for (const sc of live) if (sc.rear.parent?.visible) { any = true; for (const f of sc.anim) f(t); }
        if (any) { uTime.value = t; uSeeThrough.value = 0; }   // trong trận không có "nhìn xuyên vật che" của bản đồ
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}
const settle = (group) => {
    group.scale.setScalar(S);
    group.position.y = GROUND_Y;
    group.traverse(o => { o.userData.persistent = true; o.frustumCulled = false; if (o.isMesh) o.castShadow = false; });
    return group;
};

/** Dựng cảnh 3D cho `key`; trả về ngay 2 nhóm rỗng, mô hình hiện ra khi tải xong */
export function createModelScene(key) {
    const rear = new THREE.Group(), foreground = new THREE.Group();
    const seedNo = 101 + [...key].reduce((a, ch) => a + ch.charCodeAt(0), 0) * 7;
    const c = scene(seedNo);
    RECIPES[key](c);
    const entry = { rear, anim: [] };
    live.push(entry);
    buildProps(c.items, {}, seedNo).then(({ group, anim }) => { rear.add(settle(group)); entry.anim = anim; });
    // lớp trước mặt (sát máy quay, chỉ hiện ngoài lúc đánh): vài bụi cây khung dưới — chỉ cảnh ngoài trời
    if (['meadow', 'forest', 'field', 'road', 'swamp', 'elf', 'camp', 'outpost', 'village', 'ruins'].includes(key)) {
        const f = scene(seedNo + 5);
        for (let x = -19; x <= 19; x += 2.4 + f.R() * 2) f.model(f.pick(BUSH), x, 6.4 + f.R() * 0.7, 1.7 + f.R() * 0.6);
        buildProps(f.items, {}, seedNo + 5).then(({ group }) => foreground.add(settle(group)));
    }
    startTick();
    return { rear, foreground };
}
