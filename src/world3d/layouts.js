// ============================================================
// Bản đồ 3D — công trình đặt tay cho 7 bản đồ, đo theo tranh nền cũ (src/assets/maps/<khu>.webp, 43 x 24 ô)
//   Mỗi mục: [kiểu, ...tham số] — kiểu xem BUILD trong build.js. Toạ độ = ô (x trái->phải, z trên->dưới), số lẻ được.
//   Lưới đi được vẫn là src/world/maps.js (không đổi) -> công trình chỉ để nhìn, phải nằm trên ô bị chặn '#'.
//   Ô 't' (cây), 'f' (ruộng), cỏ, hoa… tự rải theo src/world/terrain3d.js.
// ============================================================
const ROUND = ['nature/tree_oak', 'nature/tree_default', 'nature/tree_detailed', 'nature/tree_fat', 'nature/tree_oak_dark'];
const PINES = ['nature/tree_pineRoundA', 'nature/tree_pineRoundB', 'nature/tree_pineRoundC', 'nature/tree_pineRoundD', 'nature/tree_pineDefaultA'];
const DARK_PINES = ['nature/tree_pineRoundA', 'nature/tree_pineRoundC', 'nature/tree_pineTallA_detailed', 'nature/tree_pineTallB_detailed', 'nature/tree_pineDefaultB'];
const WHITE = 0xece8df, BLUE = 0x3f6fc6;

export const LAYOUTS = {
    // ---------------- 1. Làng Ashford ----------------
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
        // Chi tiết làng Ashford (mọi món đều nằm trên ô '#' và ngoài chân nhà x0..x1 × z0..z1)
        detailItems: [
            // --- 1. Quán rượu cô Lena (28.7..34.4 × 15.0..18.9, cửa [31,19]) ---
            ['tavernTable', 28.2, 19.2],
            ['tavernTable', 26.8, 19.1],
            ['model', 'survival/barrel', 28.2, 18.4, { s: 2.3 }],
            ['model', 'survival/barrel', 28.3, 17.5, { s: 2.2, r: 0.4 }],
            ['model', 'survival/barrel', 34.7, 18.4, { s: 2.3 }],
            ['model', 'survival/box', 34.8, 17.5, { s: 2.1, r: 0.3 }],
            ['shopSign', 30.2, 19.1, 'tavern'],
            ['flowerPot', 30.7, 19.1, 'nature/flower_yellowA'],

            // --- 2. Lò rèn bác Borin (30.1..34.2 × 5.6..9.9, cửa [32,10]) ---
            ['forgeProps', 29.4, 9.5],
            ['shopSign', 33.2, 10.1, 'forge'],
            ['model', 'survival/resource-stone', 34.6, 8.3, { s: 2.1 }],
            ['model', 'survival/box-large', 29.5, 9.1, { s: 2.2, r: 0.2 }],
            ['woodpile', 34.6, 9.1, 1.5],

            // --- 3. Nhà bà Mira (18.6..22.9 × 1.2..5.5, cửa [20,5]) + vườn rau ---
            ['gardenPatch', 23.0, 4.0, 24.3, 5.8],
            ['fence', [23.0, 3.9], [24.3, 3.9], 'nature/fence_planks', 1.1],
            ['fence', [24.2, 4.7], [24.2, 6.7], 'nature/fence_planks', 1.1],
            ['scarecrow', 23.6, 5.5],
            ['veggieBasket', 21.8, 5.7],
            ['flowerPot', 19.8, 5.65, 'nature/flower_purpleA'],
            ['flowerPot', 21.6, 5.65, 'nature/flower_redA'],
            ['model', 'nature/crop_pumpkin', 17.6, 5.2, { s: 1.7 }],

            // --- 4. Nhà số 1 (tây bắc: 7.8..11.8 × 5.6..9.9, cửa 9.7) ---
            ['woodpile', 7.3, 5.8, 0.3],
            ['flowerPot', 8.8, 9.95, 'nature/flower_redA'],
            ['flowerPot', 10.5, 9.95, 'nature/flower_yellowA'],
            ['model', 'survival/barrel', 12.1, 7.2, { s: 2.2 }],
            ['sack', 12.1, 9.5, 2],

            // --- 5. Nhà số 2 (bắc: 12.9..17.1 × 1.8..6.2, cửa 15) ---
            ['model', 'town/cart', 17.5, 4.0, { s: 1.25, r: 0.35 }],
            ['sack', 14.3, 6.3, 3],
            ['model', 'survival/box', 17.3, 5.8, { s: 2.1, r: -0.2 }],
            ['flowerPot', 14.1, 6.3, 'nature/flower_yellowB'],
            ['clothesline', [17.2, 4.4], [18.5, 4.4]],

            // --- 6. Nhà số 4 (đông bắc: 24.4..28.6 × 2.8..7.0, cửa 26.6) ---
            ['haystack', 28.75, 5.0, 0.68],
            ['veggieBasket', 25.3, 7.15],
            ['sack', 28.75, 6.5, 2],
            ['flowerPot', 25.8, 7.1, 'nature/flower_redB'],
            ['clothesline', [23.0, 3.8], [24.3, 3.8]],

            // --- 7. Nhà số 6 (tây nam: 7.2..11.4 × 14.6..18.9, cửa 9.3) ---
            ['woodpile', 6.5, 17.2, 1.4],
            ['model', 'survival/barrel', 6.6, 18.4, { s: 2.2 }],
            ['flowerPot', 8.4, 19.0, 'nature/flower_purpleB'],
            ['flowerPot', 10.2, 19.0, 'nature/flower_yellowA'],
            ['clothesline', [6.5, 14.8], [6.5, 16.6]],

            // --- 8. Nhà số 7 (nam: 11.8..15.8 × 18.6..22.8, cửa 13.6) ---
            ['model', 'town/cart-high', 11.1, 20.8, { s: 1.15, r: 0.5 }],
            ['sack', 12.4, 22.9, 3],
            ['veggieBasket', 14.8, 22.9],
            ['flowerPot', 12.8, 22.9, 'nature/flower_redA'],

            // --- 9. Quảng trường, băng ghế, cột đèn, quầy hàng nhỏ & giếng ---
            ['stall', 19.3, 10.4, 0xd35400, 0],
            ['veggieBasket', 20.4, 10.5],
            ['sack', 18.3, 10.5, 2],
            ['model', 'graveyard/bench', 14.8, 17.4, { s: 1.45, r: 0.55 }],
            ['model', 'graveyard/bench', 26.4, 9.4, { s: 1.45, r: -0.6 }],
            ['model', 'graveyard/bench', 12.4, 9.4, { s: 1.45, r: 2.3 }],
            ['model', 'graveyard/bench', 24.8, 16.6, { s: 1.45, r: -2.4 }],
            ['lamp', 15.4, 6.6], ['lamp', 24.3, 6.6], ['lamp', 15.5, 17.6], ['lamp', 24.3, 17.6], ['lamp', 10.5, 14.3], ['lamp', 35.2, 10.4],
            // quanh giếng cổ (5.6, 12.0)
            ['model', 'survival/barrel', 4.3, 11.2, { s: 2.1 }],
            ['flowerPot', 4.5, 13.1, 'nature/flower_yellowA'],

            // --- 10. Bụi cây, đá, nấm, khóm hoa nhiều màu ở rìa rừng ---
            ['model', 'nature/mushroom_redGroup', 4.6, 9.8, { s: 1.9 }],
            ['model', 'nature/mushroom_tanGroup', 11.6, 15.2, { s: 1.8 }],
            ['model', 'nature/mushroom_red', 36.4, 14.8, { s: 1.8 }],
            ['model', 'nature/mushroom_tanTall', 6.2, 15.2, { s: 1.8 }],
            ['model', 'nature/rock_largeA', 4.5, 9.2, { s: 1.35, r: 0.8 }],
            ['model', 'nature/rock_smallFlatA', 12.2, 8.4, { s: 1.6, r: 1.2 }],
            ['model', 'nature/rock_smallC', 28.4, 10.4, { s: 1.6 }],
            ['model', 'nature/log', 5.5, 15.6, { s: 1.8, r: 0.4 }],

            // --- 11. Vệt đất mòn & đá lát rải quanh quảng trường / đường đi ---
            ['dirtPatch', 5.6, 12.0, 2.8, 2.6, 0.2],
            ['dirtPatch', 19.4, 11.8, 2.2, 1.4, 0],
            ['dirtPatch', 31.8, 10.4, 3.2, 1.8, 0.1],
            ['dirtPatch', 31.5, 19.3, 3.4, 1.6, -0.1],
            ['steppingStones', [
                [9.7, 10.6, 1.1], [9.9, 11.3, 0.95], [10.4, 11.9, 1.05],
                [15.0, 6.9, 1.1], [15.3, 7.6, 0.95],
                [20.8, 6.1, 1.15], [20.5, 6.8, 1.0],
                [26.6, 7.6, 1.1], [26.3, 8.3, 0.95],
                [32.1, 10.5, 1.15], [31.5, 19.4, 1.2],
                [19.5, 19.6, 1.1], [19.8, 20.6, 1.0], [19.6, 21.6, 1.1],
                [35.5, 12.5, 1.05], [37.2, 12.4, 0.95], [39.0, 12.6, 1.1],
            ]],

            // --- 12. Sức sống: bướm lượn trên luống hoa & gà con mổ thóc (trên ô '#') ---
            ['butterflies', [
                [27.9, 10.5], [27.9, 14.9], [27.0, 16.4], [26.2, 17.8],
                [16.5, 20.8], [23.5, 5.2], [11.5, 9.8], [4.6, 12.4],
            ]],
            ['chickens', [
                [23.2, 5.2], [23.8, 5.5],
                [6.4, 15.8], [6.8, 16.3],
                [28.8, 6.2],
            ]],
        ],
    },

    // ---------------- 2. Ngoại ô: cánh đồng, cối xay gió, mỏ đá ----------------
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
        detailItems: [
            // Khu mỏ đá: giàn gỗ trục kéo, xe goòng, đống quặng, cuốc xẻng, thùng hàng
            ['mineRig', 27.5, 5.5, 0.15],
            ['mineCart', 29.4, 6.3, 0],
            ['mineCart', 27.4, 7.6, 1.35],
            ['orePile', 28.3, 8.4, 0xf1c40f],
            ['orePile', 29.4, 7.4, 0xe67e22],
            ['orePile', 32.3, 8.4, 0x5dade2],
            ['model', 'survival/barrel', 26.5, 5.5, { s: 2.2 }],
            ['model', 'survival/box-large', 28.3, 5.5, { s: 2.2, r: 0.25 }],
            ['model', 'survival/tool-pickaxe', 30.5, 5.5, { s: 2.3, r: 0.6 }],
            ['model', 'survival/tool-hammer', 27.2, 8.5, { s: 2.2, r: -0.4 }],
            ['model', 'survival/resource-stone', 35.4, 8.4, { s: 2.1 }],
            ['woodpile', 36.4, 7.5, 1.2],
            ['roadTorch', 28.2, 5.2],
            ['roadTorch', 30.6, 5.2],

            // Quanh cối xay gió & cánh đồng: kho thóc nhỏ, bù nhìn, đống rơm, xe bò, hàng rào ruộng
            ['granary', 14.5, 9.5, 0],
            ['granary', 26.4, 21.5, -0.3],
            ['model', 'town/cart', 16.5, 9.5, { s: 1.3, r: 0.4 }],
            ['model', 'town/cart-high', 12.4, 16.5, { s: 1.2, r: -0.3 }],
            ['model', 'town/cart', 1.8, 15.5, { s: 1.25, r: 0.2 }],
            ['sack', 14.5, 10.5, 3],
            ['veggieBasket', 16.4, 10.5],
            ['model', 'survival/barrel', 14.4, 11.5, { s: 2.2 }],
            ['scarecrow', 15.5, 6.5],
            ['scarecrow', 20.4, 14.5],
            ['scarecrow', 6.4, 2.5],
            ['haystack', 18.3, 15.5, 0.75],
            ['haystack', 23.5, 18.4, 0.85],
            ['haystack', 28.4, 21.5, 0.8],
            ['haystack', 6.4, 4.5, 0.7],
            ['haystack', 1.8, 7.5, 0.72],
            ['model', 'graveyard/hay-bale-bundled', 24.4, 18.5, { s: 1.7, r: 0.4 }],
            ['model', 'graveyard/hay-bale', 6.4, 14.5, { s: 1.7 }],
            ['model', 'survival/tool-hammer', 24.4, 19.4, { s: 2.1, r: 0.5 }],
            ['sack', 17.5, 14.5, 2],
            ['sack', 25.5, 22.4, 3],
            ['veggieBasket', 27.5, 22.4],
            ['woodpile', 29.4, 22.4, 0.4],
            ['woodpile', 1.8, 5.5, 1.5],
            ['model', 'nature/crop_pumpkin', 6.4, 7.5, { s: 1.75 }],
            ['model', 'nature/crop_pumpkin', 6.4, 17.5, { s: 1.75 }],
            ['sack', 6.4, 20.5, 2],
            ['sack', 1.8, 18.5, 2],
            ['fence', [7.2, 1.6], [10.8, 1.6], 'nature/fence_planks', 1.2],
            ['fence', [13.2, 1.6], [15.8, 1.6], 'nature/fence_planks', 1.2],
            ['dirtPatch', 15.7, 15.2, 3.2, 2.2, 0.1],
            ['dirtPatch', 29.4, 6.2, 2.8, 2.4, 0],
            ['butterflies', [[15.5, 9.5], [20.4, 14.5], [6.4, 7.5], [23.5, 18.5], [27.5, 22.4]]],
        ],
    },

    // ---------------- 3. Rừng Sương ----------------
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
        detailItems: [
            // Trại bỏ hoang trong rừng sâu
            ['abandonedCamp', 20.5, 7.5, 0.3],
            ['abandonedCamp', 13.2, 17.4, -0.4],

            // Khúc gỗ đổ phủ rêu
            ['mossyLog', 4.5, 5.5, 0.4, 1.9],
            ['mossyLog', 12.5, 4.5, -0.3, 1.8],
            ['mossyLog', 19.5, 9.5, 0.8, 1.85],
            ['mossyLog', 26.5, 11.5, -0.5, 1.9],
            ['mossyLog', 21.5, 18.5, 0.25, 1.85],
            ['mossyLog', 34.5, 15.5, 1.1, 1.9],
            ['mossyLog', 8.5, 20.5, -0.2, 1.8],

            // Gốc cây mục
            ['model', 'nature/stump_old', 5.4, 8.4, { s: 2.1, r: 0.5 }],
            ['model', 'nature/stump_round', 17.5, 6.4, { s: 1.9, r: 1.2 }],
            ['model', 'nature/stump_old', 25.4, 10.4, { s: 2.15, r: 2.1 }],
            ['model', 'nature/stump_round', 18.5, 15.4, { s: 1.85, r: 0.7 }],
            ['model', 'nature/stump_old', 33.5, 13.5, { s: 2.1, r: 1.6 }],
            ['model', 'nature/stump_round', 6.4, 18.4, { s: 1.9, r: 0.3 }],

            // Đá phủ rêu
            ['mossyRock', 4.5, 7.2, 1.5],
            ['mossyRock', 18.4, 8.4, 1.45],
            ['mossyRock', 27.4, 9.5, 1.6],
            ['mossyRock', 25.4, 13.5, 1.5],
            ['mossyRock', 17.4, 18.4, 1.55],
            ['mossyRock', 36.5, 8.5, 1.5],
            ['mossyRock', 32.5, 18.4, 1.45],

            // Bụi dương xỉ xoè tán
            ['fernCluster', 5.5, 4.5, 1.55],
            ['fernCluster', 11.5, 5.5, 1.5],
            ['fernCluster', 22.5, 6.5, 1.6],
            ['fernCluster', 28.4, 11.5, 1.5],
            ['fernCluster', 19.5, 16.5, 1.55],
            ['fernCluster', 12.5, 18.5, 1.5],
            ['fernCluster', 36.5, 6.5, 1.6],
            ['fernCluster', 33.5, 16.5, 1.5],

            // Nấm lớn & nấm phát sáng
            ['glowShroom', 4.6, 6.4, 1.65],
            ['glowShroom', 22.4, 8.5, 1.7],
            ['glowShroom', 27.5, 12.5, 1.6],
            ['glowShroom', 18.5, 14.5, 1.65],
            ['glowShroom', 23.5, 17.5, 1.75],
            ['model', 'nature/mushroom_redGroup', 36.4, 10.4, { s: 2.1 }],
            ['model', 'nature/mushroom_tanTall', 33.4, 19.4, { s: 2.2 }],
            ['model', 'nature/mushroom_redGroup', 5.4, 14.5, { s: 2.0 }],

            // Đom đóm & lớp sương là là mặt đất
            ['fireflies', [
                [4.6, 6.4], [18.4, 8.4], [22.4, 8.5], [27.5, 12.5],
                [18.5, 14.5], [23.5, 17.5], [12.5, 18.5], [34.5, 15.5], [6.4, 18.4],
            ]],
            ['groundFog', 5.5, 9.5, 4.5, 3.2],
            ['groundFog', 20.5, 8.5, 4.8, 3.4],
            ['groundFog', 26.5, 12.5, 4.2, 3.0],
            ['groundFog', 19.5, 18.5, 5.0, 3.5],
            ['groundFog', 35.5, 14.5, 4.4, 3.2],
        ],
    },

    // ---------------- 4. Đường Vương Đạo: cầu đá, trạm gác ----------------
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
        detailItems: [
            // Cột mốc & biển chỉ đường dọc Đường Vương Đạo
            ['milestone', 1.5, 9.5],
            ['milestone', 6.5, 6.5],
            ['milestone', 24.5, 9.2],
            ['milestone', 34.5, 12.5],
            ['milestone', 38.5, 18.5],
            ['model', 'survival/signpost', 6.5, 5.5, { s: 3.0 }],
            ['model', 'survival/signpost-single', 24.5, 14.2, { s: 2.8, r: -0.3 }],
            ['model', 'survival/signpost', 34.5, 8.5, { s: 3.0, r: 0.2 }],

            // Xe hàng hỏng & kiện hàng rơi dọc đường
            ['brokenCart', 5.5, 16.5, 0.35],
            ['brokenCart', 36.5, 5.5, -0.4],

            // Lửa trại & khu nghỉ chân lữ khách
            ['campfireLit', 29.5, 16.5],
            ['campfireLit', 4.5, 6.5],
            ['tent', 3.2, 5.5, 3.6, 0.4],
            ['model', 'graveyard/bench', 8.5, 16.5, { s: 1.45, r: 0 }],

            // Đuốc ven đường & 4 đầu cầu đá
            ['roadTorch', 11.2, 9.8],
            ['roadTorch', 21.2, 9.8],
            ['roadTorch', 11.2, 13.6],
            ['roadTorch', 21.2, 13.6],
            ['roadTorch', 1.6, 8.5],
            ['roadTorch', 1.6, 14.5],
            ['roadTorch', 9.5, 16.3],
            ['roadTorch', 24.3, 8.5],
            ['roadTorch', 24.3, 14.5],
            ['roadTorch', 33.5, 9.4],
            ['roadTorch', 33.5, 13.5],
            ['roadTorch', 41.2, 16.4],

            // Trạm gác: giá vũ khí, thùng lương thảo, bao tải, củi, cờ hiệu
            ['weaponRack', 25.4, 7.5, 0],
            ['weaponRack', 25.4, 14.5, 0],
            ['model', 'survival/barrel', 29.5, 5.8, { s: 2.3 }],
            ['sack', 28.5, 5.8, 3],
            ['model', 'survival/box-large', 32.5, 14.5, { s: 2.3 }],
            ['model', 'survival/barrel', 31.5, 14.5, { s: 2.2 }],
            ['woodpile', 28.8, 17.5, 0.2],
            ['sack', 30.2, 17.5, 2],
            ['banner', 25.8, 4.5, 0xc0392b],
            ['banner', 11.2, 9.4, 0x3f6fc6],
            ['banner', 21.2, 9.4, 0x3f6fc6],
            ['dirtPatch', 26.1, 11.5, 2.6, 3.2, 0],
            ['dirtPatch', 29.5, 16.5, 2.8, 2.4, 0.2],
            ['steppingStones', [
                [4.5, 11.5, 1.15], [7.5, 11.4, 1.05], [23.2, 11.5, 1.1],
                [30.5, 11.5, 1.1], [36.5, 11.6, 1.05], [40.2, 11.4, 1.15],
            ]],
        ],
    },

    // ---------------- 5. Kinh thành Valoria ----------------
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
        detailItems: [
            // Tượng hiệp sĩ & đài phun nước phụ
            ['statue', 23.5, 7.5, 0],
            ['statue', 31.5, 7.5, 0],
            ['statue', 16.5, 13.5, Math.PI / 2],
            ['statue', 25.5, 13.5, -Math.PI / 2],
            ['fountain', 34.5, 16.5, 1.05],

            // Chậu cây cắt tỉa hoàng gia (topiary)
            ['topiary', 20.5, 7.4, 'cone'],
            ['topiary', 25.5, 7.4, 'sphere'],
            ['topiary', 29.8, 7.4, 'sphere'],
            ['topiary', 34.8, 7.4, 'cone'],
            ['topiary', 12.4, 9.5, 'sphere'],
            ['topiary', 12.4, 14.5, 'sphere'],
            ['topiary', 18.5, 19.2, 'cone'],
            ['topiary', 24.5, 19.2, 'cone'],

            // Cờ phướn dài hoàng gia (royalBanner)
            ['royalBanner', 21.5, 7.2, 0x3f6fc6],
            ['royalBanner', 24.5, 7.2, 0xc0392b],
            ['royalBanner', 30.8, 7.2, 0xc0392b],
            ['royalBanner', 33.8, 7.2, 0x3f6fc6],
            ['royalBanner', 10.2, 6.8, 0xf1c40f],
            ['royalBanner', 16.5, 6.8, 0xf1c40f],
            ['royalBanner', 18.2, 19.3, 0x3f6fc6],
            ['royalBanner', 25.2, 19.3, 0x3f6fc6],

            // Ghế đá cẩm thạch & đèn đường
            ['stoneBench', 18.4, 12.4, Math.PI / 2],
            ['stoneBench', 23.4, 12.4, -Math.PI / 2],
            ['stoneBench', 18.4, 14.4, Math.PI / 2],
            ['stoneBench', 23.4, 14.4, -Math.PI / 2],
            ['stoneBench', 34.5, 15.2, 0],
            ['stoneBench', 34.5, 17.8, Math.PI],
            ['lamp', 9.5, 8.4],
            ['lamp', 18.5, 9.2],
            ['lamp', 23.5, 9.2],
            ['lamp', 30.5, 10.4],
            ['lamp', 30.5, 12.4],
            ['lamp', 15.4, 19.2],
            ['lamp', 26.4, 19.2],
            ['lamp', 33.8, 15.4],

            // Sạp chợ bổ sung, thùng hàng, bao tải, chậu hoa
            ['stall', 30.5, 13.5, 0x8e44ad, -Math.PI / 2],
            ['veggieBasket', 19.5, 16.3],
            ['sack', 22.5, 16.3, 3],
            ['model', 'survival/barrel', 25.5, 16.3, { s: 2.2 }],
            ['model', 'survival/box-large', 16.5, 16.3, { s: 2.2, r: 0.3 }],
            ['model', 'survival/barrel', 36.8, 10.5, { s: 2.2 }],
            ['model', 'town/cart', 5.4, 15.4, { s: 1.25, r: 0.4 }],
            ['flowerPot', 30.5, 11.4, 'nature/flower_purpleA'],
            ['flowerPot', 7.5, 7.4, 'nature/flower_redA'],
            ['flowerPot', 12.4, 11.5, 'nature/flower_yellowA'],
            ['flowerPot', 12.4, 13.2, 'nature/flower_redB'],
        ],
    },

    // ---------------- 6. Bìa rừng Elf Sylvaren ----------------
    sylvaren: {
        style: {
            trees: ['nature/tree_detailed', 'nature/tree_fat', 'nature/tree_oak'], edgeTrees: ['nature/tree_detailed', 'nature/tree_fat'], treeScale: [2.0, 2.7],
            sky: 0xa9c9d6, fog: [0xb4d0d8, 22, 54], sun: 0xe6f0ff, sunI: 1.8, hemi: 1.15, lilies: 0.12,
        },
        items: [
            ...[[4.5, 5.2], [11.5, 7.6], [17.1, 8.1], [26.3, 7.6], [37.5, 13.8], [23.3, 17.4], [15.8, 21.1]].map(([x, z]) => ['glowShroom', x, z, 1.3]),
            ['mist', 12, 4, 3], ['mist', 30, 18, 3.5],
            ['spire', 15.6, 13.6, { w: 1.4, h: 3.2, roofH: 1.2, wall: 0xb08a7a, roof: 0x6f5a52 }],
            ['spire', 23.6, 13.6, { w: 1.4, h: 3.2, roofH: 1.2, wall: 0xb08a7a, roof: 0x6f5a52 }],
            ['model', 'nature/stone_tallA', 27.2, 12.3, { s: 2 }],
            ['tent', 31, 3.6, 4], ['watchtower', 35.6, 2.8],
            ['palisade', [26.4, 7.6], [29.6, 7.6]], ['palisade', [32.4, 7.6], [37.4, 7.6]],
            ['banner', 37.8, 5.6, 0x2f7d4f],
        ],
        detailItems: [
            // Đèn lồng treo phát sáng kiểu Elf
            ['elfLantern', 13.5, 9.5, 0x7ef9ff],
            ['elfLantern', 18.5, 9.5, 0x7ef9ff],
            ['elfLantern', 21.5, 9.5, 0x7ef9ff],
            ['elfLantern', 26.4, 9.5, 0x7ef9ff],
            ['elfLantern', 13.5, 16.5, 0x80ffdb],
            ['elfLantern', 18.4, 16.5, 0x80ffdb],
            ['elfLantern', 22.4, 16.5, 0x80ffdb],
            ['elfLantern', 26.4, 16.5, 0x80ffdb],
            ['elfLantern', 2.4, 11.4, 0x7ef9ff],
            ['elfLantern', 3.4, 15.4, 0x7ef9ff],
            ['elfLantern', 38.4, 9.5, 0x7ef9ff],
            ['elfLantern', 38.4, 17.5, 0x7ef9ff],

            // Cột đá khắc cổ ngữ & cổng vòm đá
            ['moonArch', 20.5, 10.5, 0],
            ['runePillar', 14.5, 10.5, 0x6ee7ff],
            ['runePillar', 25.5, 10.5, 0x6ee7ff],
            ['runePillar', 14.5, 15.5, 0x6ee7ff],
            ['runePillar', 25.5, 15.5, 0x6ee7ff],
            ['runePillar', 18.2, 13.5, 0x80ffdb],
            ['runePillar', 22.3, 13.5, 0x80ffdb],
            ['runePillar', 27.5, 7.5, 0x6ee7ff],

            // Cụm pha lê phát sáng
            ['crystalCluster', 16.5, 10.2, 0x64dfdf, 1.15],
            ['crystalCluster', 23.5, 10.2, 0x64dfdf, 1.15],
            ['crystalCluster', 17.5, 15.8, 0x72efdd, 1.1],
            ['crystalCluster', 24.5, 15.8, 0x72efdd, 1.1],
            ['crystalCluster', 16.5, 6.4, 0x80ffdb, 1.2],
            ['crystalCluster', 23.5, 5.4, 0x80ffdb, 1.2],
            ['crystalCluster', 3.4, 17.5, 0x64dfdf, 1.05],
            ['crystalCluster', 23.5, 21.4, 0x64dfdf, 1.1],

            // Hoa phát quang & nấm phát sáng
            ['glowFlower', 13.6, 11.5, 0x80ffea],
            ['glowFlower', 13.6, 14.5, 0xc77dff],
            ['glowFlower', 27.4, 11.5, 0x80ffea],
            ['glowFlower', 26.4, 14.5, 0xc77dff],
            ['glowFlower', 2.5, 9.5, 0x80ffea],
            ['glowFlower', 2.5, 16.5, 0x80ffea],
            ['glowFlower', 15.5, 20.4, 0xc77dff],
            ['glowFlower', 34.5, 6.5, 0x80ffea],
            ['glowShroom', 15.4, 11.5, 1.45],
            ['glowShroom', 24.4, 11.5, 1.45],
            ['glowShroom', 16.4, 16.5, 1.5],
            ['glowShroom', 24.4, 16.5, 1.5],
            ['model', 'graveyard/altar-stone', 20.5, 11.5, { s: 1.7 }],
            ['model', 'nature/statue_column', 17.5, 12.2, { s: 1.85 }],
            ['model', 'nature/statue_column', 22.5, 12.2, { s: 1.85 }],
            ['groundFog', 20.5, 11.5, 4.5, 3.2],
            ['groundFog', 12.5, 5.5, 4.2, 2.8],
        ],
    },

    // ---------------- 7. Thành cây Elf Lunaria ----------------
    lunaria: {
        style: {
            trees: ['nature/tree_detailed', 'nature/tree_fat', 'nature/tree_oak_dark'], edgeTrees: ['nature/tree_fat', 'nature/tree_detailed'], treeScale: [2.2, 3.0],
            sky: 0xc7b8d8, fog: [0xd0c2dc, 26, 60], sun: 0xffe0c8, sunI: 2.0, hemi: 1.1, noTrees: [[16, 5, 27, 16]],
        },
        items: [
            ['plaza', 21.5, 11.6, 5.4, 0xf0c8b0], ['fountain', 21.6, 11.4, 1.6],
            ...[[17.2, 8.3], [25.9, 8.3], [17.2, 14.6], [25.9, 14.6], [6.5, 11.1], [30.8, 12.6]].map(([x, z]) => ['lamp', x, z]),
            ['hall', { x0: 29.6, z0: 1.0, x1: 36.6, z1: 6.4, h: 3.6, wall: 0xf0c8b8, roof: 0x7f8fb0, roofH: 1.2, door: 33.1 }],
            ['dome', 33.1, 3.6, 2.6, 6.2, 0x8fa0c8],
            ['house', { x0: 3.0, z0: 2.2, x1: 7.0, z1: 6.0, door: 5.0, roof: 'brown' }],
            ['house', { x0: 10.2, z0: 1.4, x1: 14.0, z1: 5.4, door: 12.2, roof: 'brown' }],
            ['house', { x0: 4.4, z0: 17.0, x1: 8.0, z1: 20.4, door: 6.2, roof: 'brown' }],
            ['house', { x0: 23.6, z0: 18.6, x1: 27.2, z1: 21.8, door: 25.4, roof: 'brown' }],
            ['flowerbed', 31.4, 14.4, 34.4, 16.2], ['flowerbed', 37.2, 14.4, 40.4, 16.2], ['flowerbed', 31.4, 17.4, 35.2, 19.2], ['flowerbed', 37.2, 17.4, 41.0, 19.2],
            ['tower', 36.6, 13.8, { r: 1.0, h: 2.6, roof: 0xf0e0f0, wall: 0xf4ece4 }],
        ],
        detailItems: [
            // Đèn lồng treo phát sáng kiểu Elf
            ['elfLantern', 15.4, 8.5, 0xffb8e6],
            ['elfLantern', 15.4, 10.5, 0x8ef9ff],
            ['elfLantern', 15.4, 13.5, 0xffb8e6],
            ['elfLantern', 28.4, 10.5, 0x8ef9ff],
            ['elfLantern', 28.4, 11.5, 0xffb8e6],
            ['elfLantern', 28.4, 15.5, 0x8ef9ff],
            ['elfLantern', 19.5, 5.5, 0x8ef9ff],
            ['elfLantern', 23.5, 5.5, 0x8ef9ff],
            ['elfLantern', 29.2, 6.6, 0xffb8e6],
            ['elfLantern', 37.2, 6.6, 0xffb8e6],
            ['elfLantern', 8.5, 17.5, 0x8ef9ff],
            ['elfLantern', 23.2, 18.2, 0xffb8e6],

            // Cổng vòm ánh trăng & cột đá khắc cổ ngữ
            ['moonArch', 21.5, 9.2, 0],
            ['runePillar', 18.5, 9.5, 0xc77dff],
            ['runePillar', 24.5, 9.5, 0xc77dff],
            ['runePillar', 18.5, 13.5, 0x7ef9ff],
            ['runePillar', 24.5, 13.5, 0x7ef9ff],
            ['runePillar', 19.4, 6.5, 0xc77dff],
            ['runePillar', 23.4, 6.5, 0xc77dff],
            ['runePillar', 28.5, 16.5, 0x7ef9ff],
            ['runePillar', 35.5, 12.5, 0xc77dff],

            // Cụm pha lê phát sáng
            ['crystalCluster', 14.5, 7.5, 0xe0aaff, 1.15],
            ['crystalCluster', 14.5, 13.5, 0x72efdd, 1.15],
            ['crystalCluster', 29.5, 10.5, 0xe0aaff, 1.2],
            ['crystalCluster', 34.5, 8.5, 0x72efdd, 1.15],
            ['crystalCluster', 9.5, 18.5, 0xe0aaff, 1.1],
            ['crystalCluster', 18.5, 17.5, 0x72efdd, 1.15],
            ['crystalCluster', 28.5, 19.5, 0xe0aaff, 1.1],
            ['crystalCluster', 35.5, 16.5, 0x72efdd, 1.2],

            // Hoa phát quang, nấm phát sáng & ghế đá Elf
            ['glowFlower', 19.2, 10.2, 0xffb8e6],
            ['glowFlower', 23.8, 10.2, 0xffb8e6],
            ['glowFlower', 19.2, 12.8, 0x80ffea],
            ['glowFlower', 23.8, 12.8, 0x80ffea],
            ['glowFlower', 7.5, 5.5, 0xffb8e6],
            ['glowFlower', 9.5, 5.5, 0x80ffea],
            ['glowFlower', 12.5, 17.5, 0xffb8e6],
            ['glowFlower', 32.5, 16.5, 0x80ffea],
            ['glowFlower', 38.5, 16.5, 0xffb8e6],
            ['stoneBench', 18.5, 11.5, Math.PI / 2],
            ['stoneBench', 24.5, 11.5, -Math.PI / 2],
            ['stoneBench', 11.5, 13.5, 0],
            ['stoneBench', 13.5, 13.5, 0],
            ['glowShroom', 8.5, 4.5, 1.4],
            ['glowShroom', 15.5, 4.5, 1.45],
            ['glowShroom', 9.5, 19.5, 1.4],
            ['glowShroom', 28.5, 20.5, 1.45],
            ['groundFog', 21.5, 11.5, 4.6, 3.2],
            ['groundFog', 35.5, 16.5, 4.2, 3.0],
        ],
    },
};
