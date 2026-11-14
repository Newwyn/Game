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
import { PAINT, paintGrass, paintBackClouds, paintBackSky, paintSeeds, paintDungeon, paintMineLife } from '../world3d/paint.js';
import { camera } from './scene.js';
import { battleGfx, battleAutoScale } from './gpu.js';

// ---------- PHÔNG TRANH VẼ (14/11/2026): Codex vẽ toàn cảnh xa -> tấm phông sau sân, trượt theo máy quay chậm hơn (có chiều sâu) ----------
//   art/battle3d/<tên>_backdrop.png (bản gốc) -> src/assets/battle3d/<tên>_backdrop.webp (đã cắt phần đất gần)
//   horizon: vị trí rìa đất trong tranh (tỉ lệ tính từ đỉnh ảnh) -> đặt đúng mặt sân · width: bề ngang (đơn vị trận)
//   Máy quay trận chúc xuống: chỉ thấy dải tranh quanh rìa đất (thân cây / dãy nhà), phần trời cao ít khi lộ.
const BACKDROP_URL = import.meta.glob('../assets/battle3d/*_backdrop.webp', { eager: true, import: 'default' });
const BACKDROPS = {
    forest: { file: 'forest', horizon: 0.926, width: 104, aspect: 3072 / 736 },
    town: { file: 'town', horizon: 0.975, width: 104, aspect: 3072 / 879 },
    meadow: { file: 'meadow', horizon: 0.91, width: 104, aspect: 3072 / 674 },
    village: { file: 'village', horizon: 0.97, width: 104, aspect: 3072 / 1268 },
};
const BACKDROP_OF = { forest: 'forest', square: 'town', market: 'town', castle: 'town', gate: 'town', well: 'village', village: 'village', meadow: 'meadow', field: 'meadow', road: 'meadow', elf: 'forest', swamp: 'forest', camp: 'forest', outpost: 'forest', ruins: 'forest' };
const PARALLAX = 0.72;   // phông trượt theo máy quay 72% (vật gần trượt 0%) -> cảm giác xa
function paintBackdrop(group, key) {
    const cfg = BACKDROPS[BACKDROP_OF[key]];
    const url = cfg && BACKDROP_URL[`../assets/battle3d/${cfg.file}_backdrop.webp`];
    if (!url) return null;
    const tex = new THREE.TextureLoader().load(url);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const W = cfg.width / S, H = W / cfg.aspect;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex, fog: false, depthWrite: true }));
    mesh.position.set(0, (cfg.horizon - 0.5) * H - 0.15, -19);   // z -19 ô = 49 đơn vị sau giữa sân
    mesh.renderOrder = -10; mesh.frustumCulled = false;
    group.add(mesh);
    // màu trời phía trên phông (lúc máy quay ngước lên / phóng xa) lấy từ hàng trên cùng của tranh -> nối liền
    return () => { mesh.position.x = (camera.position.x / S) * PARALLAX; };
}


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
    const model = (key, x, z, sc = 1, r = R() * 6.28, y = 0) => {
        // (14/11/2026) cây khối cũ (Kenney) -> cây Meshy vẽ tay (sồi / bạch dương); ?meshy=0 để xem kiểu cũ
        if (MESHY_TREE && /^nature\/tree_/.test(key)) { key = 'meshy/forest_' + (FOREST_EXTRA.has('birch') && R() < 0.28 ? 'birch' : 'oak'); sc *= 1.55; }
        // Đồ hoạ Nhẹ (Cài đặt): bớt một nửa bụi / hoa / cỏ / đá cuội nhỏ — đỡ việc cho máy yếu, cảnh vẫn đủ
        if (LIGHT && /^meshy\/forest_(fern|flowerbush|wildflowers|grass|pebbles)$/.test(key) && R() < 0.5) return;
        return put('model', key, x, z, { s: sc, r, y });
    };
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
            if (LIGHT) n = Math.round(n * 0.35);   // Đồ hoạ Nhẹ: ít lá cỏ hơn (cỏ chồng nhiều lớp tốn card đồ hoạ)
            for (let i = 0; i < n; i++) {
                const x = -20 + R() * 40, z = -5.2 + R() * 10.8;
                if (Math.abs(z) < 2.3 && R() < 0.8) continue;
                if (z > 3 && R() < 0.5) continue;
                if (R() < flowers) model(pick(FLOWER), x, z, 0.75 + R() * 0.4); else model(pick(list), x, z, 0.55 + R() * 0.45);
            }
        },
        /** Dãy nhà dân sau sân */
        houses(z0 = -11, { xs = [-17, -10, -3, 5, 12], roofs = ['red', 'brown', 'red', 'brown', 'blue'], wall = 'wood', d = 3.6, h = 2.0 } = {}) {
            if (PAINT) {   // (12/11/2026) nhà bộ Làng Trung Cổ: tường trát vôi khung gỗ / tường đá, mái ngói ống — thay cho nhà khối cũ
                const kinds = [[2, 3, 1, 'plaster'], [2, 2, 0, 'brick'], [3, 4, 1, 'plaster'], [2, 3, 0, 'brick'], [2, 3, 1, 'plaster'], [2, 2, 0, 'plaster']];
                xs.forEach((x, i) => { const [w, dd, turn, wl] = kinds[i % kinds.length]; put('vhouse', { x: x + 2.4, z: z0 + 1.4 + (R() - 0.5) * 0.6, w, d: dd, turn, wall: wall === 'plaster' && wl === 'brick' ? 'plaster' : wl }); });
                // đồ đạc phố cổ (bộ Codex) rải dọc chân dãy nhà: xe hàng, thùng, bao, bồn hoa, ghế, đèn, dây cờ giăng ngang
                const T2 = 'custom/town_', zf = z0 + 4.4;
                model(T2 + 'cart_goods', xs[0] + 6.2, zf, 0.66, 1.3); model(T2 + 'cart_hay', xs[xs.length - 1] + 6.4, zf + 0.2, 0.66, -1.0);
                [['barrels', -19.5], ['crates', -13.2], ['sacks', -6.4], ['planter_a', -1.5], ['bench', 2.6], ['planter_b', 6.5], ['woodpile', 11.4], ['haybale', 15.6], ['flowerpots', 19.4]]
                    .forEach(([n, x], i) => model(T2 + n, x + (R() - 0.5), zf - 0.2 + (i % 2) * 0.5, 0.66, n === 'bench' || n.startsWith('planter') ? 0 : R() * 6));
                for (const x of [-16, -5.5, 5.5, 16]) model(T2 + 'lamp_post', x, zf + 0.7, 0.7, 0);
                for (const x of [-12, 0, 12]) model(T2 + 'bunting', x, z0 + 3.2, 1.3, 0, 0.6);
                return;
            }
            xs.forEach((x, i) => { const w = 4 + R() * 1.6; put('house', { x0: x, z0: z0 + (R() - 0.5), x1: x + w, z1: z0 + d, door: x + w / 2, roof: roofs[i % roofs.length], wall: i % 3 === 2 ? 'stone' : wall, h: h + R() * 0.4 }); });
        },
        // (14/11/2026) cột đèn sắt treo giỏ hoa: mô hình Meshy dựng từ tranh Codex (art/battle3d/town_lamp.png)
        lamps(z = -6.2, xs = [-15, -7.5, 0, 7.5, 15]) { xs.forEach(x => model('meshy/town_lamp', x, z, 2.5, x < 0 ? 0.4 : -0.4)); },
        /** Đồ đạc hầm ngục (KayKit): thùng rượu, thùng gỗ, rương, đống đá vụn, giá đuốc, bàn dài — rải dọc chân tường sau */
        dprops(z = -7, cave = false) {
            const D = 'dungeon/', sc = 0.62;
            const sets = [['barrel_large', 'barrel_small_stack'], ['crates_stacked', 'box_stacked'], ['chest'], ['rubble_half'], ['torch_lit'], ['keg_decorated', 'barrel_large'], ['trunk_large_A'], ['table_long_decorated_A']];
            for (let x = -20, i = 0; x <= 20; x += 4.6 + R() * 1.6, i++) {
                if (Math.abs(x) < 3) continue;
                const set = sets[(i * 5 + (cave ? 3 : 0)) % sets.length];
                set.forEach((n, k) => model(D + n, x + k * 1.25, z - R() * 0.5 + k * 0.2, sc * (n === 'rubble_half' ? 0.8 : 1), (R() - 0.5) * 0.8 + (n === 'chest' ? 0 : 0)));
            }
            if (cave) { model(D + 'rubble_large', -15, z - 1.2, 0.7, 0.2); model(D + 'rubble_large', 16, z - 1.4, 0.7, 3.3); }
        },
        banners(z, xs, colors = [RED]) { xs.forEach((x, i) => put('banner', x, z, colors[i % colors.length])); },
    };
    return api;
}

// ============================================================
// (12/11/2026) CẢNH LÂU ĐÀI / TRONG NHÀ DỰNG LẠI bằng bộ KayKit Dungeon (tường đá cao, trụ, đuốc, cờ, bàn tiệc, kệ sách) + tháp mái ngói bộ Village.
//   Người chơi chê bản cũ: tối xanh, tường thấp, cột đèn + cờ kiểu khối lẫn vào. Ở đây KHÔNG dùng món nào của bộ khối cũ.
// ============================================================
const D = 'dungeon/';
const pillars = (c, z, xs, sc = 1.0, name = 'pillar_decorated') => xs.forEach(x => c.model(D + name, x, z, sc, 0));
const braziers = (c, z, xs, sc = 0.9) => xs.forEach(x => c.model(D + 'torch_lit', x, z, sc, 0));
const PAINTED = {
    /** HANG MỎ (12/11/2026): bộ mô hình Codex dựng bằng code (tools/models/make_mine_kit.py) — vách đá, cửa hầm khung gỗ, đường ray, xe goòng, khung chống, pha lê, nhũ đá */
    mine(c, deep) {
        const C = 'custom/', Z = -8.2;
        const walls = ['mine_wall_c', 'mine_wall_a', 'mine_wall_c', 'mine_wall_b', 'mine_entrance', 'mine_wall_a', 'mine_wall_b', 'mine_wall_c', 'mine_wall_a'];
        walls.forEach((n, i) => { const x = (i - 4) * 6; c.model(C + n, x, Z, 1, 0); c.model(C + 'mine_stalactites', x, Z + 0.96, 1, 0); });
        for (const x of [-4, 0, 4]) c.model(C + 'mine_rails', x, Z + 2.35, 1, 0);
        c.model(C + 'mine_cart', -2.6, Z + 2.35, 1, 0, 0.12);
        for (const x of [-17, -10, 10, 17]) c.model(C + 'mine_support', x, Z + 1.5, 1, 0);   // khung chống có đèn dầu treo -> 4 vũng sáng + đèn ở cửa hầm
        c.mineLamps = [[-16.5, 2.75, Z + 1.85], [-9.5, 2.75, Z + 1.85], [0, 3.1, Z + 1.7], [10.5, 2.75, Z + 1.85], [17.5, 2.75, Z + 1.85]];
        c.mineDeep = !!deep;
        c.model(C + 'mine_crystals', -14, Z + 1.5, 1, -0.26); c.model(C + 'mine_crystals', 7.2, Z + 1.5, 1, 0.35);
        c.model(C + 'mine_orepile', 3.1, Z + 1.35, 1, -0.2); c.model(C + 'mine_orepile', -7.3, Z + 1.55, 1, 0.26);
        c.model('dungeon/barrel_large', 16, Z + 1.6, 0.6, 0.4); c.model('dungeon/crates_stacked', -18, Z + 1.6, 0.6, -0.3);
        if (deep) { for (const x of [-20, -3.5, 13, 20]) c.model(C + 'mine_crystals', x, Z + 1.7, 1.25, c.R() * 6); c.put('glowShroom', -6, -6.3, 2.2); c.put('glowShroom', 12, -6.2, 2.2); c.put('mist', 0, -6.2, 7); }
    },
    /** Đỉnh tháp — nơi đấu Đại tướng Valdric: sảnh đá cao, cổng vòm lớn giữa, hàng trụ chạm, cờ đỏ, lửa đuốc */
    tower(c) {
        c.put('dwall', [-29, -8.4], [29, -8.4], { s: 1.45, banners: ['banner_patternA_red', 'banner_shield_blue', 'banner_patternA_red'] });
        pillars(c, -6.6, [-21, -14, -7, 7, 14, 21], 1.05);
        braziers(c, -5.9, [-17.5, -10.5, -3.5, 3.5, 10.5, 17.5]);
        c.model(D + 'sword_shield', -3.4, -7.3, 1.2, 0, 2.2); c.model(D + 'sword_shield', 3.4, -7.3, 1.2, 0, 2.2);
        c.model(D + 'chest_gold', -23.5, -6.4, 0.9, 0.4); c.model(D + 'trunk_large_A', 23.5, -6.4, 0.9, -0.4);
    },
    /** Sảnh lâu đài: tường cao treo cờ, bàn tiệc dài, hàng trụ */
    hall(c) {
        c.put('dwall', [-29, -9], [29, -9], { s: 1.4 });
        pillars(c, -7.2, [-20, -10, 10, 20], 1.0);
        for (const x of [-15, -5, 5, 15]) c.model(D + 'table_long_decorated_A', x, -6.5, 0.8, Math.PI / 2);
        braziers(c, -5.9, [-22, -10, 0, 10, 22]); c.model(D + 'keg_decorated', -24, -6.6, 0.8, 0.5); c.model(D + 'barrel_small_stack', 24, -6.6, 0.8, -0.5);
    },
    /** Thư viện: tường kệ sách, bàn dài, kệ đứng */
    library(c) {
        c.put('dwall', [-29, -8.8], [29, -8.8], { s: 1.3, shelves: true, banners: ['banner_shield_blue', 'banner_triple_green'] });
        for (const x of [-20, -12, 12, 20]) c.model(D + 'shelf_large', x, -6.9, 0.9, 0);
        c.model(D + 'table_long_decorated_A', -5, -6.4, 0.8, Math.PI / 2); c.model(D + 'table_long_decorated_A', 5, -6.4, 0.8, Math.PI / 2);
        braziers(c, -5.9, [-16, 0, 16]); pillars(c, -7.3, [-25, 25], 0.95, 'pillar');
    },
    /** Hầm mộ: tường đá song sắt, cột đá, rương, đá vụn, sương */
    crypt(c) {
        c.put('dwall', [-29, -9.2], [29, -9.2], { s: 1.25, banners: ['banner_shield_blue'] });
        pillars(c, -7.2, [-18, -9, 9, 18], 0.95, 'pillar');
        c.dprops(-6.5); c.model(D + 'rubble_large', -22, -7.6, 0.6, 0.3); c.model(D + 'rubble_large', 22, -7.8, 0.6, 3.4);
        c.edge({ grave: 0.8, stone: 0.2 }, { step: 2.6, z: -6.0 }); c.put('mist', -8, -6.2, 6); c.put('mist', 8, -6.4, 6);
    },
    /** Cổng thành: tường thành đá cao, cổng vòm giữa, 4 tháp mái ngói, cờ, thùng hàng */
    gate(c) {
        c.put('dwall', [-29, -8.8], [29, -8.8], { s: 1.35, banners: ['banner_patternA_red', 'banner_shield_blue'] });
        c.put('vtower', -8.5, -9.6, { r: 2.0, h: 9, roof: true }); c.put('vtower', 8.5, -9.6, { r: 2.0, h: 9, roof: true });
        c.put('vtower', -22, -9.6, { r: 1.8, h: 7, roof: true }); c.put('vtower', 22, -9.6, { r: 1.8, h: 7, roof: true });
        c.dprops(-6.5); c.edge({ bush: 0.5, flower: 0.5 }, { step: 2.8 });
    },
    /** Sân lâu đài: tường cao + 4 tháp, đài phun nước, hàng rào cây */
    castle(c) {
        c.put('dwall', [-29, -10.6], [29, -10.6], { s: 1.45, banners: ['banner_shield_blue', 'banner_patternA_red'] });
        c.put('vtower', -11, -11.6, { r: 2.2, h: 11, roof: true }); c.put('vtower', 11, -11.6, { r: 2.2, h: 11, roof: true });
        c.put('vtower', -23, -11.4, { r: 1.8, h: 8, roof: true }); c.put('vtower', 23, -11.4, { r: 1.8, h: 8, roof: true });
        c.put('fountain', 0, -7.4, 1.8); for (const x of [-16, -12, 12, 16]) c.model('town/hedge-large', x, -6.3, 2, 0);
        braziers(c, -6.2, [-6, 6, -20, 20]); c.edge({ flower: 0.6, bush: 0.4 }, { step: 2.2, z: -5.9 });
    },
    /** Cầu đá: lan can thấp hai bên, tháp canh hai đầu, rừng xa */
    bridge(c) {
        c.put('dwall', [-29, -5.9], [29, -5.9], { s: 0.55, half: true });
        c.put('vtower', -23, -7.2, { r: 1.7, h: 7, roof: true }); c.put('vtower', 23, -7.2, { r: 1.7, h: 7, roof: true });
        braziers(c, -5.3, [-15, -5, 5, 15], 0.8);
        c.trees(DARK, -16, { x0: -32, x1: 32, sc: 3, step: 2.2 }); c.trees(PINES, -21, { x0: -34, x1: 34, sc: 4, step: 2.4 });
    },
    /** Tường lũy: lan can sau lưng, tháp giữa cao, 2 tháp bên, thùng hàng, rừng xa phía dưới */
    battlement(c) {
        c.put('dwall', [-29, -5.9], [29, -5.9], { s: 0.6, half: true });
        c.put('vtower', 0, -8.4, { r: 2.1, h: 10, roof: true }); c.put('vtower', -20, -7.6, { r: 1.8, h: 7, roof: true }); c.put('vtower', 20, -7.6, { r: 1.8, h: 7, roof: true });
        c.dprops(-5.2); braziers(c, -5.2, [-10, 10], 0.8);
        c.trees(DARK, -22, { x0: -34, x1: 34, sc: 2.6, step: 2 });
    },
};

/** Công thức từng cảnh (khoá = tên trong src/core/battleThemes.js) */
// món Meshy đã có trong src/assets/world3d/meshy (thêm dần) — công thức cảnh tự dùng khi có
const MESHY_FILES = import.meta.glob('../assets/world3d/meshy/*.glb', { query: '?url', import: 'default', eager: true });
const FOREST_EXTRA = new Set(Object.keys(MESHY_FILES).map(p => p.match(/forest_([a-z]+)\.glb$/)?.[1]).filter(Boolean));
let LIGHT = false;   // Đồ hoạ trận Nhẹ (gpu.js battleGfx) — đọc lại mỗi lần dựng cảnh
const MESHY_TREE = FOREST_EXTRA.has('oak') && (typeof location === 'undefined' || new URLSearchParams(location.search).get('meshy') !== '0');
const MESHY_BLD = new Set(Object.keys(MESHY_FILES).map(p => p.match(/bld_([a-z]+)\.glb$/)?.[1]).filter(Boolean));
const TOWN_EXTRA = new Set(Object.keys(MESHY_FILES).map(p => p.match(/town_([a-z]+)\.glb$/)?.[1]).filter(Boolean));

const RECIPES = {
    // ---- thiên nhiên ----
    meadow(c) { c.woods(ROUND, [...ROUND, ...DARK], { deep: false }); c.sides(ROUND); c.edge(); c.put('tent', -3, -7.2, 3.2, 0.2); c.model('nature/log_stackLarge', -12, -6.3, 2.2, 0.4); c.model('nature/campfire_stones', 8, -6, 1.8, 0); c.model('nature/campfire_logs', 8, -6, 1.8, 0.6); c.model('nature/sign', 14, -5.9, 2); c.turf(320); },
    // (14/11/2026) rừng: phông xa = tranh Codex vẽ (src/assets/battle3d/forest_backdrop.webp), vật gần = mô hình Meshy dựng từ tranh Codex (meshy/forest_*)
    forest(c) {
        // (14/11/2026) rừng dày: mọi vật là mô hình Meshy dựng từ tranh Codex (meshy/forest_*) + phông rừng vẽ tay phía xa
        const M = (k, x, z, h, r = c.R() * 6.28) => c.model('meshy/forest_' + k, x, z, h, r);
        const has = (k) => FOREST_EXTRA.has(k);   // món mới (Codex vẽ thêm) có thì dùng, chưa có thì thay bằng món sẵn
        const tree = (x, z, h) => M(has('birch') && c.R() < 0.3 ? 'birch' : 'oak', x, z, h);
        // 3 hàng cây sau sân: gần thưa vừa, giữa dày, xa to (che kín chân phông)
        for (let x = -25; x <= 25; x += 4.0 + c.R() * 1.4) tree(x, -8.8 - c.R() * 1.2, 4.0 + c.R() * 1.2);
        for (let x = -28; x <= 28; x += 3.2 + c.R() * 1.2) tree(x, -12 - c.R() * 1.5, 5.0 + c.R() * 1.4);
        for (let x = -31; x <= 31; x += 3.6 + c.R() * 1.2) tree(x, -16 - c.R() * 2, 6.0 + c.R() * 1.6);
        // bụi rậm dưới chân cây (giữa hàng cây và viền sân)
        for (let x = -24; x <= 24; x += 1.6 + c.R() * 1.0) {
            const z = -7.4 - c.R() * 1.4, t = c.R();
            if (t < 0.45) M('fern', x, z, 0.9 + c.R() * 0.5); else if (t < 0.6) M('stump', x, z, 0.9 + c.R() * 0.4); else if (t < 0.8) M('rock', x, z, 0.9 + c.R() * 0.7);
            else if (has('flowerbush')) M('flowerbush', x, z, 0.9 + c.R() * 0.4); else M('fern', x, z, 1.1);
        }
        // viền sau sân sát nhân vật: đá rêu, gốc cây nấm, dương xỉ, nấm, khúc gỗ đổ
        for (let x = -20; x <= 20; x += 1.25 + c.R() * 0.9) {
            const z = -5.7 - c.R() * 0.9, t = c.R();
            if (t < 0.32) M('fern', x, z, 0.65 + c.R() * 0.35); else if (t < 0.52) M('rock', x, z, 0.6 + c.R() * 0.8);
            else if (t < 0.64) M('stump', x, z, 0.7 + c.R() * 0.4); else if (t < 0.76 && has('mushrooms')) M('mushrooms', x, z, 0.5 + c.R() * 0.3);
            else if (t < 0.86 && has('log')) M('log', x, z, 0.55, (c.R() - 0.5) * 0.6); else if (has('wildflowers')) M('wildflowers', x, z, 0.35 + c.R() * 0.15); else M('fern', x, z, 0.6);
        }
        // hai bên sân: kín từ sau ra trước
        for (const sx of [-1, 1]) for (let z = -6; z <= 6; z += 1.6 + c.R() * 0.8) {
            tree(sx * (22.5 + c.R() * 2), z, 4.2 + c.R() * 1.2);
            M(c.R() < 0.5 ? 'fern' : 'rock', sx * (19.6 + c.R() * 1.2), z + 0.6, 0.8 + c.R() * 0.6);
        }
        // trong sân: chỉ vài cụm thấp ở mép (không che nhân vật) — đá cuội, hoa dại, cỏ
        for (let i = 0; i < 26; i++) {
            const x = -19 + c.R() * 38, z = (c.R() < 0.5 ? -1 : 1) * (3.2 + c.R() * 1.8);
            const k = has('pebbles') && c.R() < 0.35 ? 'pebbles' : has('grass') && c.R() < 0.5 ? 'grass' : has('wildflowers') ? 'wildflowers' : 'rock';
            M(k, x, z, k === 'rock' ? 0.3 + c.R() * 0.2 : 0.3 + c.R() * 0.2);
        }
        c.put('mist', -8, -6.5, 5); c.put('mist', 9, -6.8, 5); c.put('mist', 0, -9, 7); c.turf(140, { flowers: 0.15 });
    },
    field(c) {
        // (14/11/2026) người chơi: lúa mì khối cũ nhìn như que tre -> bụi lúa vàng Meshy (cỏ đồng vàng), 2 hàng so le
        if (FOREST_EXTRA.has('grass')) { for (const [z, dx] of [[-6.1, 0], [-7.5, 0.85]]) for (let x = -20 + dx; x <= 20; x += 1.7) c.model('meshy/forest_grass', x + c.R() * 0.4, z + (c.R() - 0.5) * 0.3, 1.25 + c.R() * 0.35); }
        else for (let x = -20; x <= 20; x += 0.9) for (const z of [-6, -6.9, -7.8]) c.model(c.R() < 0.5 ? 'nature/crops_wheatStageB' : 'nature/crops_wheatStageA', x + c.R() * 0.4, z, 1.7 + c.R() * 0.3, 0);
        c.put('fence', [-21, -5.5], [21, -5.5]); c.put('windmill', -11, -10.5); c.put('scarecrow', 4, -7); c.put('haystack', 12, -9.2, 1.1); c.put('haystack', 14, -9.8, 0.9); c.put('haystack', -3, -9.6, 1.0);
        c.put('house', { x0: 7, z0: -13.5, x1: 12, z1: -10.2, door: 9.5, roof: 'brown' }); c.trees(ROUND, -14.5, { step: 5.5, sc: 3.4 }); c.sides(ROUND); c.turf(260, { flowers: 0.22 });
    },
    road(c) { c.put('fence', [-21, -5.6], [-4, -5.6]); c.put('fence', [5, -5.6], [21, -5.6]); c.model('survival/signpost', 0.5, -6, 2.4, 0); c.model('town/cart', -9, -6.6, 2.2, 0.5); c.model('nature/rock_largeB', 13, -6.4, 2.2); c.put('haystack', 16, -6.8, 0.9); c.woods(ROUND, [...ROUND, ...DARK], { z: -8.5, deep: false }); c.sides(ROUND); c.edge({ bush: 0.3, rock: 0.2, flower: 0.2, log: 0.1 }, { z: -6.3 }); c.turf(220); },
    swamp(c) { c.woods([...DARK, ...PINES], TALLPINES); c.sides(DARK); c.edge({ bush: 0.3, shroom: 0.3, log: 0.2, rock: 0.2 }); for (const x of [-14, -6, 3, 11, 17]) c.model('nature/lily_large', x, -5.9 - c.R(), 2.2); c.put('glowShroom', -9, -6.4, 2.4); c.put('glowShroom', 6, -6.6, 2.0); c.put('mist', -10, -6, 6); c.put('mist', 0, -6.6, 6); c.put('mist', 11, -6.2, 6); c.model('nature/canoe', 14, -6.5, 2.2, 0.4); c.turf(260, { flowers: 0.04, list: ['nature/grass_large', 'nature/grass_leafs'] }); },
    elf(c) {
        // (14/11/2026) làng tiên: rừng Meshy + nhà cây tiên, nấm / đèn lồng / pha lê phát sáng (Meshy khi có, code cũ khi chưa)
        const M = (k, x, z, h, r = c.R() * 6.28) => c.model('meshy/forest_' + k, x, z, h, r);
        if (FOREST_EXTRA.has('oak')) {
            for (let x = -26; x <= 26; x += 4.2 + c.R() * 1.6) c.model('nature/tree_fat', x, -12 - c.R() * 1.5, 3.4 + c.R());
            for (let x = -31; x <= 31; x += 3.8 + c.R() * 1.4) c.model('nature/tree_fat', x, -16.5 - c.R() * 2, 4.2 + c.R());
            for (const sx of [-1, 1]) for (let z = -6; z <= 6; z += 1.8 + c.R() * 0.8) c.model('nature/tree_fat', sx * (22.5 + c.R() * 2), z, 2.8 + c.R() * 0.8);
            for (let x = -22; x <= 22; x += 1.5 + c.R() * 1.0) { const t = c.R(); M(t < 0.5 ? 'fern' : t < 0.8 ? 'flowerbush' : 'wildflowers', x, -7.2 - c.R() * 1.6, t < 0.8 ? 0.9 + c.R() * 0.4 : 0.4); }
        } else {
            c.trees(['nature/tree_fat', 'nature/tree_oak'], -7.4, { step: 3.4, sc: 5, ds: 1.6 }); c.trees(['nature/tree_fat', 'nature/tree_detailed'], -11.5, { x0: -27, x1: 27, step: 2.8, sc: 6.5, ds: 2 }); c.trees(DARK, -18, { x0: -32, x1: 32, sc: 8, ds: 2 }); c.sides(['nature/tree_fat']);
        }
        if (MESHY_BLD.has('elfhouse')) { c.model('meshy/bld_elfhouse', -12.5, -9.4, 5.0, 0.25); c.model('meshy/bld_elfhouse', 12.5, -9.8, 4.6, -0.3); }   // nhà cây của tiên
        if (MESHY_BLD.has('elfhall')) c.model('meshy/bld_elfhall', 0, -13.5, 6.5, 0);
        for (const x of [-17, -6.5, 6.5, 17]) c.put('elfLantern', x, -6.1, x < 0 ? 0x8ef9ff : 0xffb8e6);
        c.put('glowShroom', -13, -6.4, 2.6); c.put('glowShroom', 2, -6.8, 2.2); c.put('glowShroom', 14.5, -6.4, 2.6);
        c.put('crystalCluster', -9, -6.9, 0x64dfdf, 1.2); c.put('crystalCluster', 9.5, -7.0, 0x80ffdb, 1.1);
        for (let x = -20; x <= 20; x += 1.4 + c.R() * 1.0) { const z = -5.7 - c.R() * 0.8, t = c.R(); if (t < 0.4) M('fern', x, z, 0.6 + c.R() * 0.3); else if (t < 0.65) M('wildflowers', x, z, 0.4); else if (t < 0.8) M('rock', x, z, 0.5 + c.R() * 0.5); else M('flowerbush', x, z, 0.7); }
        c.put('mist', -6, -6.4, 6); c.put('mist', 8, -6.6, 6); c.turf(220, { flowers: 0.3 });
    },
    // ---- làng / trại ----
    village(c) { c.houses(-10.6); c.put('well', -1, -6.6); c.put('fence', [-20, -5.7], [-4, -5.7]); c.put('fence', [3, -5.7], [20, -5.7]); c.put('haystack', 10, -6.8, 0.9); c.model('town/cart', -12, -6.6, 2.2, 0.3); c.model('survival/barrel', 6, -6.3, 2); c.model('survival/box', 6.9, -6.5, 1.9); c.lamps(-6.1, [-16, 16]); c.sides(ROUND); c.turf(180, { flowers: 0.2 }); },
    well(c) { c.houses(-11.2, { xs: [-18, -11, 6, 13] }); c.put('well', 0, -7.4); c.lamps(-6, [-4.5, 4.5, -14, 14]); c.model('graveyard/bench', -5.5, -6.6, 2, 0); c.model('graveyard/bench', 5.5, -6.6, 2, 0); c.model('survival/bucket', 1.3, -6.5, 2); c.model('meshy/town_barrels', -9, -6.7, 1.3, 0.4); c.model('meshy/town_barrels', 9.5, -6.6, 1.2, -0.5); c.trees(ROUND, -15.5, { step: 2.8, sc: 3.6 }); c.sides(ROUND); c.edge({ flower: 0.5, bush: 0.3, crate: 0.2 }, { step: 1.8 }); c.turf(120, { flowers: 0.25 }); },
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
        if (PAINT) return PAINTED.mine(c, deep);
        c.put('cliff', -24, -12, 24, -8, deep ? 4.4 : 3.4); c.put('cliff', -24, -8, -10, -6.6, 2.2); c.put('cliff', 10, -8, 24, -6.6, 2.2); c.put('mineEntrance', 0, -7.6); c.put('rails', [[0, -7.2], [0, -5.6]]); c.put('rails', [[-14, -5.9], [14, -5.9]]);
        for (const x of [-16, -8, 8, 16]) c.model('graveyard/lantern-candle', x, -6.3, 2.4, 0);
        c.edge({ stone: 0.5, crate: 0.3, rock: 0.2 }, { step: 1.7, z: -6 }); c.model('survival/tool-pickaxe', -4, -6.2, 2.2, 0.6); c.model('survival/resource-stone', 5, -6.3, 2.4); c.model('town/cart-high', -11, -6.2, 2, 1.2);
        if (PAINT) c.dprops(-6.4, true);
        if (deep) { c.put('glowShroom', -6, -6.3, 2.2); c.put('glowShroom', 12, -6.2, 2.2); c.put('mist', 0, -6.2, 7); }
    },
    deepMine(c) { RECIPES.mine(c, true); },
    // ---- phố thị ----
    square(c) {
        // (14/11/2026) quảng trường đầy đủ: đồ Meshy dựng từ tranh Codex (meshy/town_*) + phông phố vẽ tay
        const T = (k, x, z, h, r = 0) => c.model('meshy/town_' + k, x, z, h, r);
        const has = (k) => TOWN_EXTRA.has(k);
        c.houses(-12.4, { xs: [-19, -12.5, 6.5, 13], roofs: ['blue', 'red', 'red', 'blue'], wall: 'plaster', h: 2.4 });
        T('fountain', 0, -8.6, 2.6);
        // hai dãy cột đèn + chậu hoa / cây cắt tỉa dọc lối đi sau sân
        c.lamps(-6.1, [-18, -12, -6, 6, 12, 18]);
        for (const x of [-15, -9, -3.2, 3.2, 9, 15]) {
            if (has('topiary') && Math.abs(x) > 4) T('topiary', x, -6.6, 1.5); else if (has('planter')) T('planter', x, -6.4, 0.9, 0); else c.model('town/hedge-large', x, -6.4, 2, 0);
        }
        // ghế băng quanh đài phun, cờ, tượng, sạp hàng, xe hoa, thùng gỗ
        for (const [x, r] of [[-4.6, 0.25], [4.6, -0.25]]) has('bench') ? T('bench', x, -7.4, 0.9, r) : c.model('graveyard/bench', x, -7.4, 2, r);
        for (const x of [-21, 21]) has('banner') ? T('banner', x, -7.5, 3.2) : c.banners(-7.5, [x], [BLUE]);
        if (has('statue')) { T('statue', -9.5, -9.6, 2.8, 0.3); T('statue', 9.5, -9.6, 2.8, -0.3); }
        if (has('stall')) { T('stall', -16.5, -8.6, 1.9, 0.3); T('stall', 16.5, -8.6, 1.9, -0.3); } else { c.put('stall', -6.5, -6.9, RED, 0.2); c.put('stall', 6.5, -6.9, BLUE, -0.2); }
        if (has('flowercart')) { T('flowercart', -12.5, -8.4, 1.3, 0.5); T('flowercart', 12.8, -8.2, 1.3, -0.6); }
        if (has('signpost')) T('signpost', 20.3, -5.4, 2.0, -0.3);
        for (const [x, z, r] of [[-19.5, -6.2, 0.5], [19, -6.6, -0.6], [-10.8, -6.9, 1.2], [-20.5, 2.5, 0.2], [20.2, -2, -1]]) T('barrels', x, z, 1.25, r);
        // hai bên sân: chậu hoa + đèn khép cảnh
        for (const sx of [-1, 1]) for (const z of [-3, 1, 4.5]) { c.model('meshy/town_lamp', sx * 21.5, z, 2.5, 0); if (has('planter')) T('planter', sx * 20.2, z + 1.2, 0.9, Math.PI / 2); }
    },
    market(c) {
        c.houses(-12.2, { xs: [-19, -12, -5, 3, 10, 16], roofs: ['red', 'blue', 'brown', 'red', 'blue'], wall: 'plaster', h: 2.3 });
        [[-16, RED], [-11, GOLD], [-6, GREEN], [0, BLUE], [6, PURPLE], [11, RED], [16, GOLD]].forEach(([x, col], i) => i % 2 === 0 && TOWN_EXTRA.has('stall') ? c.model('meshy/town_stall', x, -7.1, 1.9, (c.R() - 0.5) * 0.3) : c.put('stall', x, -6.9 - (i % 2) * 0.5, col, (c.R() - 0.5) * 0.3));
        if (MESHY_BLD.has('markethall')) c.model('meshy/bld_markethall', 1.5, -15.5, 6.5, 0);   // (14/11) nhà chợ có tháp đồng hồ phía sau dãy nhà
        c.edge({ flower: 1 }, { step: 3.2, z: -5.9 }); for (const x of [-13.5, -8.5, 3, 13.5]) c.model('meshy/town_barrels', x + c.R(), -6.2, 1.2, c.R() * 6.28); c.model('town/cart', -19, -6.4, 2.2, 0.6); c.lamps(-6.1, [-13.5, -3, 8.5, 19]);
    },
    gate(c) { if (PAINT) return PAINTED.gate(c); c.put('castleWall', [-26, -8.6], [-3.2, -8.6], 4.2); c.put('castleWall', [3.2, -8.6], [26, -8.6], 4.2); c.put('tower', -3.6, -8.6, { h: 5.6, r: 1.5 }); c.put('tower', 3.6, -8.6, { h: 5.6, r: 1.5 }); c.model('castle/gate', 0, -8.5, 3.1, 0); c.put('tower', -17, -8.6, { h: 5, roof: null }); c.put('tower', 17, -8.6, { h: 5, roof: null }); c.banners(-7.9, [-10, -6.5, 6.5, 10], [RED, BLUE]); c.lamps(-6, [-14, -5, 5, 14]); c.edge({ crate: 0.4, bush: 0.4, flower: 0.2 }, { step: 2.6 }); },
    castle(c) {
        if (PAINT) return PAINTED.castle(c);
        c.put('hall', { x0: -8, z0: -15, x1: 8, z1: -10, h: 4.4, roofH: 2.4, door: 0 }); c.put('tower', -9, -10.4, { h: 6.4, r: 1.5 }); c.put('tower', 9, -10.4, { h: 6.4, r: 1.5 }); c.put('spire', 0, -13, { w: 2.2, h: 7.5, roofH: 3.2, wall: 0xe8e4dc, roof: BLUE });
        c.put('castleWall', [-26, -9.4], [-10.6, -9.4], 2.4); c.put('castleWall', [10.6, -9.4], [26, -9.4], 2.4); c.put('tower', -20, -9.4, { h: 4.4 }); c.put('tower', 20, -9.4, { h: 4.4 });
        c.put('fountain', 0, -7.2, 1.8); for (const x of [-15, -11, 11, 15]) c.model('town/hedge-large', x, -6.2, 2, 0); c.banners(-9.2, [-4.5, 4.5], [BLUE]); c.lamps(-6, [-6.5, 6.5, -18, 18]); c.edge({ flower: 0.6, bush: 0.4 }, { step: 2.2, z: -5.9 });
    },
    bridge(c) { if (PAINT) return PAINTED.bridge(c); for (const z of [-5.6, 5.8]) c.put('castleWall', [-26, z], [26, z], 0.9); c.lamps(-5.9, [-16, -8, 0, 8, 16]); c.put('tower', -22, -6.4, { h: 4.6, roof: null, r: 1.5 }); c.put('tower', 22, -6.4, { h: 4.6, roof: null, r: 1.5 }); c.banners(-5.9, [-12, 12], [RED]); c.trees(DARK, -16, { x0: -32, x1: 32, sc: 3, step: 2.2 }); c.trees(PINES, -21, { x0: -34, x1: 34, sc: 4, step: 2.4 }); },
    battlement(c) { if (PAINT) return PAINTED.battlement(c); c.put('castleWall', [-26, -5.8], [26, -5.8], 1.3); c.put('tower', -19, -6.4, { h: 4, roof: null, r: 1.6 }); c.put('tower', 19, -6.4, { h: 4, roof: null, r: 1.6 }); c.put('tower', 0, -7.4, { h: 6.2, r: 1.7 }); for (const x of [-12, -6, 6, 12]) c.model('castle/flag-banner-long', x, -5.9, 2.4, 0, 1.3); c.edge({ crate: 0.7, stone: 0.3 }, { step: 3, z: -5.2, x0: -17, x1: 17 }); c.trees(DARK, -22, { x0: -34, x1: 34, sc: 2.6, step: 2 }); },
    tower(c) { if (PAINT) return PAINTED.tower(c); c.put('castleWall', [-26, -5.8], [26, -5.8], 1.1); c.put('spire', -14, -7.6, { w: 2, h: 6.5, roofH: 3 }); c.put('spire', 14, -7.6, { w: 2, h: 6.5, roofH: 3 }); c.put('tower', 0, -8.2, { h: 7.5, r: 2, roof: 0x2a3b6a }); for (const x of [-8, 8]) c.model('castle/flag-pennant', x, -5.9, 2.6, 0, 1.1); for (const x of [-18, -5, 5, 18]) c.model('graveyard/lightpost-single', x, -5.3, 2.2, 0); },
    // ---- trong nhà ----
    hall(c) {
        if (PAINT) return PAINTED.hall(c);
        c.put('castleWall', [-26, -9], [26, -9], 5.4);
        for (let x = -20; x <= 20; x += 5) { c.model('graveyard/pillar-large', x, -6.6, 3.4, 0); c.model('graveyard/pillar-large', x + 2.5, -8.2, 3.4, 0); }
        for (const x of [-15, -5, 5, 15]) c.model('castle/flag-banner-long', x, -8.4, 3, 0, 2.6); c.model('graveyard/altar-stone', 0, -7.6, 3, 0); for (const x of [-12.5, -7.5, 7.5, 12.5]) c.model('graveyard/lightpost-double', x, -6, 2.2, 0); for (const x of [-18, 18]) c.model('graveyard/urn-round', x, -6, 2.4);
    },
    library(c) {
        if (PAINT) return PAINTED.library(c);
        c.put('hall', { x0: -24, z0: -13, x1: 24, z1: -8.6, h: 5, wall: 0x8a6a48, roof: 0x5a3f2a, roofH: 0.6, windows: 0xf2d49a });
        for (let x = -20; x <= 20; x += 4) { c.model('town/wall-wood-detail-cross', x, -8.3, 2.6, 0); c.model('town/pillar-wood', x + 2, -6.6, 3, 0); }
        for (const x of [-16, -8, 8, 16]) c.model('graveyard/lantern-candle', x, -6, 2.6, 0); c.edge({ crate: 1 }, { step: 3.4, z: -6.4 }); c.model('survival/workbench', -3, -6.8, 2.6, 0); c.model('graveyard/bench', 3.5, -6.6, 2.2, 0);
    },
    crypt(c) { if (PAINT) return PAINTED.crypt(c); c.put('castleWall', [-26, -9.4], [26, -9.4], 4.6); c.put('crypt', -9, -7.6, 3.2); c.put('crypt', 9, -7.6, 3.2); c.model('graveyard/crypt-door', 0, -9, 3.4, 0); for (let x = -20; x <= 20; x += 5) c.model('graveyard/column-large', x, -6.8, 3, 0); c.put('fence', [-21, -5.8], [21, -5.8], 'graveyard/iron-fence', 1.5); c.edge({ grave: 0.8, stone: 0.2 }, { step: 1.8, z: -6.3 }); for (const x of [-14, 14]) c.model('graveyard/lightpost-single', x, -6, 2.4, 0); c.put('mist', -8, -6.2, 6); c.put('mist', 8, -6.4, 6); },
    ruins(c) { for (let x = -19; x <= 19; x += 4.2) c.model(c.R() < 0.6 ? 'graveyard/column-large' : 'graveyard/pillar-obelisk', x + c.R(), -6.6 - c.R() * 1.6, 2.2 + c.R() * 1.6, c.R(), 0); c.put('fence', [-22, -8.6], [-6, -8.6], 'graveyard/stone-wall', 1.8); c.put('fence', [7, -8.6], [22, -8.6], 'graveyard/stone-wall', 1.8); c.model('graveyard/altar-stone', 0, -7.6, 3.2, 0); c.edge({ stone: 0.45, rock: 0.3, bush: 0.15, grave: 0.1 }, { step: 1.5 }); c.trees(DARK, -11.5, { sc: 3.6, step: 2.6 }); c.trees(TALLPINES, -16, { x0: -30, x1: 30, sc: 4.6 }); c.put('mist', -9, -6.2, 6); c.put('mist', 9, -6.6, 6); c.turf(120, { flowers: 0.03 }); },
    moon(c) {
        for (let x = -20; x <= 20; x += 4) c.model('graveyard/column-large', x, -6.6, 3.6, 0); if (MESHY_BLD.has('elfhall')) c.model('meshy/bld_elfhall', 0, -12, 7, 0);   // (14/11) điện thờ trăng của tiên (Meshy)
        else { c.put('hall', { x0: -7, z0: -14, x1: 7, z1: -9.6, h: 4.2, wall: 0xdfe8f4, roof: 0x8fb4e8, roofH: 2, windows: 0x9fd0ff, door: 0, doorColor: 0x6f8fc0 }); c.put('dome', 0, -11.8, 2.6, 4.2, 0x9fc4ee); }
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

const PAINT_GRASS = new Set(['meadow', 'forest', 'field', 'road', 'swamp', 'elf', 'village', 'camp', 'outpost', 'ruins', 'moon']);
const PAINT_DARK = new Set(['swamp', 'moon', 'ruins']);
const PAINT_SKY = new Set(['meadow', 'forest', 'field', 'road', 'elf', 'village', 'well', 'camp', 'outpost', 'square', 'market', 'gate', 'castle', 'bridge', 'battlement']);

const PAINT_DUNGEON = { mine: 'warm', deepMine: 'cold', hall: 'warm', library: 'warm', crypt: 'cold', tower: 'warm', moon: 'cold', ruins: 'cold' };
const PAINT_CAVE = new Set([]);   // hang mỏ đã có nhũ đá + pha lê thật của bộ Codex, không cần hình nón tạm nữa   // chỉ hang mới có nhũ đá + pha lê
/** Dựng cảnh 3D cho `key`; trả về ngay 2 nhóm rỗng, mô hình hiện ra khi tải xong */
export function createModelScene(key) {
    LIGHT = battleGfx() === 'low' || (battleGfx() === 'auto' && battleAutoScale() <= 0.71);
    const rear = new THREE.Group(), foreground = new THREE.Group();
    const seedNo = 101 + [...key].reduce((a, ch) => a + ch.charCodeAt(0), 0) * 7;
    const c = scene(seedNo);
    RECIPES[key](c);
    const entry = { rear, anim: [] };
    live.push(entry);
    // kiểu TRANH VẼ TAY (12/11/2026): cây tán tròn -> tán cụm lá vẽ tay; sân cỏ mọc ngọn cỏ; mây tích sau cảnh ngoài trời
    const items = c.items;   // mọi cây (kể cả thông) đã được bộ dựng đổi sang cây vẽ tay -> cả cảnh chỉ một kiểu cây
    buildProps(items, {}, seedNo).then(({ group, anim }) => {
        if (PAINT) {
            if (PAINT_GRASS.has(key) && !['forest', 'meadow', 'field'].includes(key)) {   // (14/11) cảnh có mặt đất vẽ tay (Codex): bỏ cỏ nhọn vẽ bằng code
                const tiles = [], R = c.R;
                for (let z = -8; z < 7; z++) for (let x = -24; x < 24; x++) {
                    const lane = z >= -3 && z < 3;                       // giữa sân (chỗ nhân vật đánh): cỏ thưa hơn để không rối mắt
                    if (lane && R() < 0.5) continue;
                    // máy quay trận ở rất gần -> cỏ nhỏ hơn bản đồ nhiều: sau sân 0,5 · giữa sân 0,26 (chỉ tới mắt cá) · trước sân 0,36
                    tiles.push([x, z, 0, 0.5 + 0.5 * Math.sin(x * 0.31 + z * 0.12) * Math.cos(z * 0.27 - x * 0.08), lane ? 0.26 : z < -3 ? 0.5 : 0.36]);
                }
                paintGrass(group, tiles, PAINT_DARK.has(key) ? 16 : 24, PAINT_DARK.has(key) ? 0.9 : 1.25);
            }
            const bd = paintBackdrop(group, key);
            if (bd) { paintBackSky(group); anim.push(bd); anim.push(paintSeeds(group, [-24, -8, 24, 7], { count: 60, y0: 0.3, y1: 4 })); }
            else if (PAINT_SKY.has(key)) { paintBackSky(group); anim.push(paintBackClouds(group, seedNo)); anim.push(paintSeeds(group, [-24, -8, 24, 7], { count: 60, y0: 0.3, y1: 4 })); }
            if (c.mineLamps) anim.push(paintMineLife(group, c.mineLamps, { deep: c.mineDeep, scale: S }));   // hang mỏ: tối, đèn dầu, dơi, đá rơi
            else if (PAINT_DUNGEON[key]) anim.push(paintDungeon(group, PAINT_DUNGEON[key], seedNo, PAINT_CAVE.has(key)));   // hầm ngục / hang: luồng sáng, bụi, quầng đuốc
        }
        rear.add(settle(group)); entry.anim = anim;
    });
    // lớp trước mặt (sát máy quay, chỉ hiện ngoài lúc đánh): vài bụi cây khung dưới — chỉ cảnh ngoài trời
    if (['meadow', 'forest', 'field', 'road', 'swamp', 'elf', 'camp', 'outpost', 'village', 'ruins'].includes(key)) {
        const f = scene(seedNo + 5);
        if (key === 'forest') for (let x = -20; x <= 20; x += 1.8 + f.R() * 1.4) {   // (14/11) rừng: dương xỉ / bụi hoa / đá Meshy sát máy quay
            const t = f.R(), k = t < 0.5 ? 'fern' : t < 0.75 && FOREST_EXTRA.has('flowerbush') ? 'flowerbush' : 'rock';
            f.model('meshy/forest_' + k, x, 6.3 + f.R() * 0.9, k === 'rock' ? 0.8 + f.R() * 0.6 : 1.0 + f.R() * 0.5, f.R() * 6.28);
        }
        else for (let x = -19; x <= 19; x += 2.4 + f.R() * 2) f.model(f.pick(BUSH), x, 6.4 + f.R() * 0.7, 1.7 + f.R() * 0.6);
        buildProps(f.items, {}, seedNo + 5).then(({ group }) => foreground.add(settle(group)));
    }
    startTick();
    return { rear, foreground };
}
