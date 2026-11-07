// ============================================================
// Bản đồ 3D — công trình đặt tay cho 5 bản đồ, đo theo tranh nền cũ (src/assets/maps/<khu>.webp, 43 x 24 ô)
//   Mỗi mục: [kiểu, ...tham số] — kiểu xem BUILD trong build.js. Toạ độ = ô (x trái->phải, z trên->dưới), số lẻ được.
//   Lưới đi được vẫn là src/world/maps.js (không đổi) -> công trình chỉ để nhìn, phải nằm trên ô bị chặn.
//   Ô 't' (cây), 'f' (ruộng), cỏ, hoa… tự rải theo src/world/terrain3d.js.
// ============================================================
const ROUND = ['nature/tree_oak', 'nature/tree_default', 'nature/tree_detailed', 'nature/tree_fat', 'nature/tree_oak_dark'];
const PINES = ['nature/tree_pineRoundA', 'nature/tree_pineRoundB', 'nature/tree_pineRoundC', 'nature/tree_pineRoundD', 'nature/tree_pineDefaultA'];
const DARK_PINES = ['nature/tree_pineRoundA', 'nature/tree_pineRoundC', 'nature/tree_pineTallA_detailed', 'nature/tree_pineTallB_detailed', 'nature/tree_pineDefaultB'];
const WHITE = 0xece8df, BLUE = 0x3f6fc6;

export const LAYOUTS = {
    // ---------------- Làng Ashford ----------------
    ashford: {
        style: { trees: ROUND, sky: 0xc9d9b0, fog: [0xc9d2a8, 30, 62], sun: 0xffd29a },
        items: [
            ['plaza', 19.3, 12.8, 6.6],
            ['house', { x0: 7.8, z0: 5.6, x1: 11.8, z1: 9.9, door: 9.7, roof: 'red' }],
            ['house', { x0: 12.9, z0: 1.8, x1: 17.1, z1: 6.2, door: 15, roof: 'brown' }],
            ['house', { x0: 18.6, z0: 1.2, x1: 22.9, z1: 5.5, door: 20.8, roof: 'red' }],
            ['house', { x0: 24.4, z0: 2.8, x1: 28.6, z1: 7.0, door: 26.6, roof: 'brown' }],
            ['house', { x0: 30.1, z0: 5.6, x1: 34.2, z1: 9.9, door: 32.1, roof: 'brown', wall: 'stone' }],   // lò rèn bác Borin
            ['house', { x0: 7.2, z0: 14.6, x1: 11.4, z1: 18.9, door: 9.3, roof: 'brown' }],
            ['house', { x0: 11.8, z0: 18.6, x1: 15.8, z1: 22.8, door: 13.6, roof: 'red' }],
            ['house', { x0: 28.7, z0: 15.0, x1: 34.4, z1: 18.9, door: 31.5, roof: 'brown', h: 2.2, chimney: false }],   // quán của cô Lena
            ['model', 'survival/signpost', 30.2, 19.2, { s: 3.2 }],
            ['anvil', 29.4, 9.4], ['anvil', 33.6, 10.8],
            ['model', 'survival/barrel', 34.6, 9.4, { s: 2.6 }],
            ['well', 5.6, 12.0],
            ['board', 19.4, 11.8],
            ['fence', [35.8, 10.6], [44, 10.6]],
            ['fence', [23.0, 19.4], [28.4, 19.4]],
            ['fence', [36.2, 14.3], [36.2, 20]],
            ['fence', [17.5, 20.8], [17.5, 24.5]],
            ['fence', [21.7, 21.5], [21.7, 24.5]],
            ['flowerbed', 27.3, 10.0, 28.6, 11.1],
            ['flowerbed', 27.3, 14.3, 28.6, 15.5],
            ['flowerbed', 25.9, 15.8, 28.5, 17.0],
            ['flowerbed', 24.4, 17.2, 28.5, 18.4],
            ['flowerbed', 16.0, 19.2, 17.0, 22.8],
            ['lamp', 12.6, 9.0], ['lamp', 26.2, 9.0], ['lamp', 12.6, 16.6], ['lamp', 26.0, 13.6],
        ],
    },
    // ---------------- Ngoại ô: cánh đồng, cối xay gió, mỏ đá ----------------
    outskirts: {
        style: { trees: [...PINES, 'nature/tree_oak'], sky: 0xcfdcae, fog: [0xd0d6a6, 30, 62], sun: 0xffd29a },
        items: [
            ['cliff', 24, 0, 36, 5, 2.8], ['cliff', 31, 5, 36, 7, 2.0], ['cliff', 24, 5, 26, 6, 1.6],
            ['mineEntrance', 29.4, 5.15],
            ['rails', [[29.4, 5.5], [29.4, 7.3], [28.6, 7.9], [27.0, 8.0]]],
            ['windmill', 15.7, 13.6],
            ['haystack', 18.0, 2.0, 0.8], ['haystack', 20.7, 2.0, 0.8], ['haystack', 19.4, 12.1, 0.7], ['haystack', 20.7, 15.9, 1.2],
            ['haystack', 25.8, 11.4, 1.3], ['haystack', 29.4, 13.5, 0.7], ['haystack', 35.1, 7.8, 0.7], ['haystack', 32.9, 18.6, 1.2], ['haystack', 20.7, 22.0, 0.6],
            ['model', 'nature/rock_largeA', 22.2, 2.0, { s: 1.8 }], ['model', 'nature/rock_largeB', 23.6, 2.0, { s: 1.6 }], ['model', 'nature/rock_largeA', 25.1, 6.4, { s: 1.6, r: 1 }],
            ['model', 'nature/rock_largeB', 21.3, 13.4, { s: 1.8 }], ['model', 'nature/rock_largeA', 35.2, 16.3, { s: 1.7 }], ['model', 'nature/rock_largeB', 25.1, 22.1, { s: 1.5 }],
            ['model', 'nature/sign', 15.0, 6.3, { s: 3 }], ['model', 'nature/sign', 12.2, 16.3, { s: 3 }],
            ['model', 'nature/plant_bushDetailed', 17.9, 14.8, { s: 2.4 }],
            ['scarecrow', 23.6, 19.0],
            ['fence', [6.75, -0.5], [6.75, 23.2]],
            ['fence', [2.5, 3], [2.5, 9.2]], ['fence', [-1, 9.2], [2.6, 9.2]],
            ['fence', [-1, 23.4], [2.5, 23.4]], ['fence', [6.8, 23.4], [24, 23.4]],
            ['model', 'survival/resource-wood', 28.2, 8.9, { s: 2.2 }],
        ],
    },
    // ---------------- Rừng Sương ----------------
    forest: {
        style: {
            trees: DARK_PINES, edgeTrees: DARK_PINES, treeScale: [1.9, 2.5], sky: 0x8fb5ad, fog: [0x9cc4bb, 18, 46], sun: 0xd8f0e0, sunI: 1.6, hemi: 1.15,
            ground: { g: [0.42, 0.36, 0.3], d: [0.43, 0.3, 0.27], t: [0.42, 0.34, 0.24], b: [0.42, 0.36, 0.3], p: [0.07, 0.38, 0.38] }, lilies: 0.1,
        },
        items: [
            ...[[6.1, 5.8], [14.1, 7.2], [18.2, 7.1], [8.8, 8.4], [6.2, 9.9], [30.2, 8.5], [6.1, 14.1], [10.1, 14.1], [27.5, 14.2], [17.1, 17.1], [31.5, 17.1], [8.9, 18.5], [11.6, 18.5], [27.6, 18.6]]
                .map(([x, z]) => ['glowShroom', x, z, 1.4]),
            ['mist', 9, 5, 3.5], ['mist', 24, 8, 3], ['mist', 11, 17, 4], ['mist', 28, 18, 3], ['mist', 34, 9, 3],
            ['model', 'nature/plant_bushDetailed', 31.5, 7.3, { s: 2.4 }],
            ['model', 'nature/log_large', 21.5, 9.6, { s: 2, r: 0.3 }], ['model', 'nature/stump_old', 3.5, 13.2, { s: 2.2 }],
        ],
    },
    // ---------------- Đường Vương Đạo: cầu đá, trạm gác ----------------
    road: {
        style: { trees: [...PINES, 'nature/tree_default'], sky: 0xc9dbb4, fog: [0xc9d6ac, 30, 62], sun: 0xffd8a6, water: 0x3f86c8, lilies: 0 },
        items: [
            ['stoneBridge', 10.8, 10.0, 21.2, 13.4],
            ['clear', 24, 5, 35, 10], ['clear', 24, 13, 34, 19],
            ['watchtower', 26.8, 6.2],
            ['palisade', [24.5, 5.3], [33.9, 5.3]], ['palisade', [24.5, 5.3], [24.5, 9.6]], ['palisade', [33.9, 5.3], [33.9, 6.8]],
            ['palisade', [24.5, 9.6], [25.8, 9.6]], ['palisade', [32.7, 8.0], [32.7, 9.6]], ['palisade', [32.7, 9.6], [34.0, 9.6]],
            ['palisade', [24.4, 13.6], [25.8, 13.6]], ['palisade', [32.7, 13.6], [33.6, 13.6]],
            ['palisade', [24.4, 13.6], [24.4, 18.4]], ['palisade', [33.6, 13.6], [33.6, 18.4]], ['palisade', [24.4, 18.4], [33.6, 18.4]],
            ['tent', 30.6, 7.4, 4.2], ['tent', 27.1, 15.9, 4.2], ['tent', 31.3, 15.9, 4.2],
            ['model', 'survival/box-large', 32.3, 7.2, { s: 2.4 }], ['model', 'survival/box', 32.3, 8.1, { s: 2.4 }],
            ['barrier', 26.1, 9.4, 13.6],
            ['banner', 34.6, 9.0], ['banner', 34.6, 13.6], ['banner', 25.2, 17.6], ['banner', 32.7, 17.6],
            ['model', 'survival/campfire-pit', 28.6, 7.4, { s: 2.2 }],
        ],
    },
    // ---------------- Kinh thành Valoria ----------------
    capital: {
        style: { trees: ROUND, sky: 0xcad9bd, fog: [0xc8d2b4, 32, 66], sun: 0xffdcae, noTrees: [[5, 7, 37, 19]] },
        items: [
            // cung điện (trên cùng) + tường + 4 tháp mái xanh
            ['hall', { x0: 21, z0: -1, x1: 35, z1: 3.6, h: 3.2, wall: WHITE, roof: BLUE, roofH: 1.8 }],
            ['hall', { x0: 26.2, z0: -0.5, x1: 29.6, z1: 4.0, h: 4.2, wall: WHITE, roof: BLUE, roofH: 2.2, door: 27.9, doorColor: 0x2b2b33 }],
            ['castleWall', [19.4, 6.6], [36.8, 6.6], 2.0],
            ['tower', 19.4, 6.2, { r: 1.0, h: 3.2 }], ['tower', 25.8, 6.2, { r: 1.0, h: 3.4 }], ['tower', 30.3, 6.2, { r: 1.0, h: 3.4 }], ['tower', 36.8, 6.2, { r: 1.0, h: 3.2 }],
            ['model', 'castle/gate', 27.9, 7.1, { s: 3, r: Math.PI / 2 }],
            ['castleWall', [19.2, -1], [19.2, 5.6], 2.0], ['castleWall', [37.0, -1], [37.0, 5.6], 2.0],
            // nhà thờ ánh sáng
            ['hall', { x0: 10.5, z0: 2.6, x1: 16.3, z1: 7.0, h: 3.6, wall: 0xb8b2a6, roof: 0x5f6670, roofH: 2.0, door: 13.4, doorColor: 0x2b2b33 }],
            ['spire', 11.4, 2.4, { w: 1.5, h: 5.2 }], ['spire', 15.4, 2.4, { w: 1.5, h: 5.2 }],
            // thư viện hoàng gia + mái vòm
            ['hall', { x0: 5.8, z0: 9.2, x1: 12.0, z1: 15.0, h: 2.8, wall: 0xd8cdb6, roof: 0x9a8a72, roofH: 1.0, door: 8.9, doorColor: 0x2b2420 }],
            ['dome', 8.8, 10.6, 1.4, 2.8],
            // nhà dân
            ['house', { x0: 5.0, z0: 4.2, x1: 8.1, z1: 7.1, door: 6.5, roof: 'brown' }],
            ['house', { x0: 38.3, z0: 2.6, x1: 42.4, z1: 6.8, door: 39.7, roof: 'brown' }],
            ['house', { x0: 31.5, z0: 9.0, x1: 36.7, z1: 12.6, door: 35.3, roof: 'blue', wall: 'stone' }],
            ['house', { x0: 38.2, z0: 9.2, x1: 41.8, z1: 12.6, door: 39.6, roof: 'brown' }],
            ['house', { x0: 30.3, z0: 15.0, x1: 33.4, z1: 18.4, door: 31.6, roof: 'red' }],
            ['house', { x0: 9.3, z0: 17.4, x1: 12.9, z1: 19.2, door: 11, roof: 'brown', h: 1.5, chimney: false }],
            ['house', { x0: 12.5, z0: 21.6, x1: 14.6, z1: 24.5, door: null, roof: 'red' }],
            ['house', { x0: 15.2, z0: 21.6, x1: 17.4, z1: 24.5, door: null, roof: 'blue' }],
            ['house', { x0: 27.3, z0: 21.6, x1: 29.6, z1: 24.5, door: null, roof: 'blue' }],
            ['model', 'nature/tree_oak', 35.2, 14.6, { s: 2.6 }],
            ['model', 'survival/barrel', 7.5, 16.9, { s: 2.6 }],
            // chợ quanh đài phun nước
            ['fountain', 21.5, 13.3, 1.35],
            ...[[15.8, 10.4, 0xc0392b], [18.0, 10.2, 0x8e44ad], [19.9, 10.3, 0x27ae60], [15.8, 11.8, 0x3f6fc6], [17.8, 11.7, 0xe0b030],
                [23.1, 10.3, 0xd35454], [24.9, 10.3, 0x27ae60], [26.4, 10.3, 0xe0b030], [24.8, 11.8, 0x3f6fc6], [26.2, 11.8, 0xc0392b],
                [16.3, 15.3, 0x27ae60], [17.9, 15.3, 0xc0392b], [20.0, 16.5, 0x3f6fc6], [23.1, 16.5, 0xc0392b], [24.9, 15.2, 0xe0b030], [26.4, 15.2, 0x2a9d8f]]
                .map(([x, z, c]) => ['stall', x, z, c]),
            ['lamp', 14.3, 9.1], ['lamp', 28.6, 9.1], ['lamp', 14.3, 17.6], ['lamp', 28.6, 17.6],
            // tường thành ngoài + cổng
            ['castleWall', [4.3, -1], [4.3, 16]], ['castleWall', [4.3, 16], [8, 19.8]], ['castleWall', [8, 19.8], [18.4, 19.8]],
            ['castleWall', [24.6, 19.8], [33, 19.8]], ['castleWall', [33, 19.8], [37, 15.2]], ['castleWall', [37, 15.2], [44, 15.2]],
            ['hall', { x0: 19.9, z0: 19.4, x1: 23.1, z1: 21.6, h: 3.0, wall: WHITE, roof: 0xd8d2c6, roofH: 0.3, door: 21.5, doorColor: 0x14110e }],
            ['tower', 19.1, 19.9, { r: 1.05, h: 3.6, roof: null }], ['tower', 23.9, 19.9, { r: 1.05, h: 3.6, roof: null }],
        ],
    },
};
