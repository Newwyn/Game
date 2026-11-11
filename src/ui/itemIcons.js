// ============================================================
// 🎨 ẢNH VẬT PHẨM VẼ BẰNG CODE (pixel 16×16, phóng to) — dùng chung cho: túi đồ, sổ nhiệm vụ, bảng nấu ăn, vật trên bản đồ (2D + 3D)
//   · Nguyên liệu / vật liệu: mã trong game/gather.js MATS (lua, nam, go, dong…)
//   · Món ăn: 'dish_<mã>' · Dụng cụ: 'tool_<pick|axe|rod><bậc>' · Vật nhiệm vụ: mã trong túi (q_meo, hammer…)
//   · Vật trên bản đồ: 'i_<tên>' (src/world/mapsExtra.js "sprite") — bản "_off" = đã hái / đã chặt (gốc cây, đá vụn)
//   Thêm vật mới: thêm 1 hàm vẽ vào DRAW. g.r = ô chữ nhật · g.e = hình bầu dục · g.l = đường chéo từng ô.
// ============================================================
const N = 16, SCALE = 6, CELL = N * SCALE;   // 96px mỗi ô, khớp cỡ ô của items.webp
const K = '#1e293b';                         // màu viền tối

function pen(ctx, ox = 0, oy = 0) {
    const r = (c, x, y, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(ox + x * SCALE, oy + y * SCALE, w * SCALE, h * SCALE); };
    const e = (c, cx, cy, rx, ry = rx) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.4) + (y * y) / (ry * ry + 0.4) <= 1) r(c, cx + x, cy + y); };
    const l = (c, x0, y0, x1, y1, w = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) r(c, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), w, 1); };
    return { r, e, l };
}
// ---------- mẫu dùng lại ----------
const bowl = (soup, top) => (g) => { g.e(K, 8, 10, 7, 4); g.e('#e2e8f0', 8, 10, 6, 3); g.e(soup, 8, 9, 5, 2); g.r('#94a3b8', 4, 13, 8, 1); top?.(g); g.r('#fff', 4, 9, 2, 1); };
const plate = (food) => (g) => { g.e(K, 8, 11, 7, 3); g.e('#f1f5f9', 8, 11, 6, 2); food(g); };
const fish = (body, belly) => (g) => { g.e(K, 7, 8, 6, 4); g.e(body, 7, 8, 5, 3); g.e(belly, 7, 9, 4, 1); g.r(K, 12, 5, 3, 7); g.r(body, 13, 6, 2, 5); g.r(K, 12, 8, 1, 1); g.r('#fff', 3, 7, 2, 2); g.r(K, 4, 7, 1, 1); g.r(belly, 6, 5, 3, 1); };
const rock = (base, lite, ore) => (g) => { g.e(K, 8, 10, 7, 5); g.e(base, 8, 10, 6, 4); g.e(lite, 6, 8, 3, 2); if (ore) for (const [x, y] of [[5, 9], [9, 8], [11, 11], [7, 12]]) { g.r(ore[0], x, y, 2, 2); g.r(ore[1], x, y, 1, 1); } };
const rubble = (base) => (g) => { g.e(K, 5, 12, 3, 2); g.e(base, 5, 12, 2, 1); g.e(K, 11, 12, 3, 2); g.e(base, 11, 12, 2, 1); g.r(base, 8, 13, 1, 1); };
const tree = (leaf, lite, fruit) => (g) => { g.r(K, 6, 9, 4, 7); g.r('#92400e', 7, 9, 2, 6); g.e(K, 8, 5, 7, 5); g.e(leaf, 8, 5, 6, 4); g.e(lite, 6, 4, 3, 2); if (fruit) for (const [x, y] of [[4, 6], [8, 3], [11, 6], [7, 7]]) { g.r(fruit, x, y, 2, 2); g.r('#fff', x, y, 1, 1); } };
const stump = (g) => { g.e(K, 8, 12, 5, 3); g.e('#92400e', 8, 12, 4, 2); g.e('#fcd34d', 8, 11, 3, 1); g.r('#b45309', 8, 11, 1, 1); };
const bush = (leaf, lite, dot) => (g) => { g.e(K, 8, 10, 7, 5); g.e(leaf, 8, 10, 6, 4); g.e(lite, 6, 8, 3, 2); if (dot) for (const [x, y] of [[4, 10], [7, 8], [10, 10], [8, 12], [12, 9]]) { g.r(dot, x, y, 2, 2); g.r('#fff', x, y, 1, 1); } };
const board = (g) => { g.r(K, 7, 6, 2, 10); g.r('#92400e', 7, 9, 2, 6); g.r(K, 2, 2, 12, 7); g.r('#d6a35c', 3, 3, 10, 5); g.r('#92400e', 4, 4, 8, 1); g.r('#92400e', 4, 6, 6, 1); };
const stone = (mark) => (g) => { g.r(K, 3, 3, 10, 12); g.r(K, 4, 2, 8, 1); g.r('#9ca3af', 4, 3, 8, 11); g.r('#d1d5db', 4, 3, 3, 10); g.r('#6b7280', 4, 14, 8, 1); mark?.(g); };
const TIER = ['#b45309', '#94a3b8', '#e0f2fe'], TIER_D = ['#78350f', '#475569', '#7dd3fc'];
const tool = (kind, t) => (g) => {
    const c = TIER[t - 1], d = TIER_D[t - 1];
    if (kind === 'rod') { g.l(K, 2, 14, 12, 1, 2); g.l(t === 1 ? '#a3e635' : c, 2, 14, 12, 1); g.l('#e2e8f0', 13, 2, 13, 10); g.r('#ef4444', 12, 10, 2, 2); g.r(d, 3, 12, 2, 2); return; }
    g.l(K, 3, 14, 11, 4, 2); g.l('#b45309', 3, 13, 11, 4);
    if (kind === 'pick') { g.e(K, 9, 4, 6, 2); g.r(K, 3, 5, 2, 3); g.r(K, 13, 5, 2, 4); g.r(c, 4, 3, 10, 2); g.r(c, 3, 5, 1, 2); g.r(c, 13, 5, 1, 3); g.r(d, 5, 4, 8, 1); }
    else { g.r(K, 8, 1, 6, 8); g.r(c, 9, 2, 4, 6); g.r(d, 12, 2, 1, 6); g.r('#fff', 9, 2, 1, 5); }
};

const DRAW = {
    // ----- nguyên liệu -----
    lua: (g) => { for (const [x, y] of [[4, 5], [8, 2], [12, 5]]) { g.l('#a16207', x, y + 4, 8, 15); g.r(K, x - 2, y - 1, 4, 7); g.r('#facc15', x - 1, y, 2, 5); g.r('#fef08a', x - 1, y, 1, 4); } g.r('#b45309', 6, 12, 5, 2); },
    nam: (g) => { g.r(K, 5, 8, 6, 8); g.r('#fef3c7', 6, 8, 4, 7); g.r('#e7d3a8', 9, 9, 1, 6); g.e(K, 8, 6, 7, 4); g.e('#b45309', 8, 6, 6, 3); g.e('#f59e0b', 6, 5, 3, 1); g.r('#fff7ed', 9, 6, 2, 2); g.r('#fff7ed', 4, 7, 1, 1); },
    thao: (g) => { g.l('#166534', 8, 15, 8, 5); for (const [x, y, s] of [[5, 5, 1], [11, 4, 1], [4, 9, 1], [12, 9, 1], [8, 2, 1]]) { g.e(K, x, y, 3, 2); g.e('#22c55e', x, y, 2, 1); g.r('#bbf7d0', x - s, y, 1, 1); } g.r('#92400e', 7, 13, 3, 1); },
    dau: (g) => { g.l('#166534', 8, 2, 8, 6); g.e('#22c55e', 11, 3, 2, 1); for (const [x, y] of [[6, 8], [10, 8], [8, 12]]) { g.e(K, x, y, 3, 3); g.e('#7c3aed', x, y, 2, 2); g.r('#ddd6fe', x - 1, y - 1, 1, 1); } },
    trung: (g) => { g.e(K, 8, 9, 5, 6); g.e('#fef3c7', 8, 9, 4, 5); g.e('#fffbeb', 6, 7, 2, 2); g.r('#e7d3a8', 9, 12, 2, 1); },
    tao: (g) => { g.l('#92400e', 8, 2, 8, 5); g.e('#22c55e', 11, 3, 2, 1); g.e(K, 8, 9, 6, 6); g.e('#dc2626', 8, 9, 5, 5); g.e('#f87171', 6, 7, 2, 2); g.r('#fff', 5, 6, 1, 1); },
    thit: (g) => { g.e(K, 7, 8, 6, 5); g.e('#dc2626', 7, 8, 5, 4); g.e('#fca5a5', 6, 7, 3, 2); g.e('#fee2e2', 7, 8, 1, 1); g.r(K, 11, 11, 4, 3); g.r('#fef3c7', 12, 11, 3, 2); g.r('#fef3c7', 14, 13, 1, 1); },
    mat: (g) => { g.r(K, 4, 5, 8, 10); g.r('#f59e0b', 5, 6, 6, 8); g.r('#fde68a', 5, 6, 2, 7); g.r(K, 4, 3, 8, 2); g.r('#92400e', 5, 3, 6, 2); g.r('#fff', 6, 7, 1, 3); g.r('#b45309', 5, 10, 6, 1); },
    ca_chep: fish('#f97316', '#fed7aa'), ca_bac: fish('#94a3b8', '#f1f5f9'), ca_vang: (g) => { fish('#facc15', '#fef9c3')(g); g.r('#fff', 9, 3, 1, 3); g.r('#fff', 8, 4, 3, 1); g.r('#fff', 14, 2, 1, 1); },
    muoi: (g) => { g.r(K, 4, 5, 8, 10); g.r('#e2e8f0', 5, 6, 6, 8); g.r('#fff', 5, 9, 6, 5); g.r(K, 4, 3, 8, 2); g.r('#64748b', 5, 3, 6, 2); g.r('#94a3b8', 7, 7, 2, 1); },
    sua: (g) => { g.r(K, 5, 2, 6, 3); g.r('#bae6fd', 6, 2, 4, 2); g.r(K, 4, 5, 8, 10); g.r('#f8fafc', 5, 5, 6, 9); g.r('#e2e8f0', 9, 6, 2, 8); g.r('#38bdf8', 5, 9, 6, 2); },
    go: (g) => { for (const y of [5, 10]) { g.r(K, 2, y - 1, 12, 5); g.r('#92400e', 3, y, 10, 3); g.r('#b45309', 3, y, 10, 1); g.e('#fcd34d', 12, y + 1, 1, 1); } },
    go_cung: (g) => { g.r(K, 2, 4, 12, 9); g.r('#57534e', 3, 5, 10, 7); g.r('#78716c', 3, 5, 10, 2); g.e(K, 12, 8, 2, 4); g.e('#d6d3d1', 12, 8, 1, 3); g.r('#44403c', 5, 9, 4, 1); },
    dong: rock('#78716c', '#a8a29e', ['#ea580c', '#fdba74']), sat: rock('#52525b', '#71717a', ['#cbd5e1', '#fff']),
    // ----- món ăn -----
    dish_chao: bowl('#fef3c7', (g) => { g.r('#facc15', 7, 8, 2, 1); }),
    dish_banh_mi: plate((g) => { g.e(K, 8, 8, 6, 3); g.e('#d97706', 8, 8, 5, 2); g.e('#fbbf24', 7, 7, 3, 1); g.e('#fff', 10, 8, 1, 1); g.r('#facc15', 10, 8, 1, 1); }),
    dish_sup_nam: bowl('#d6a35c', (g) => { g.e('#b45309', 7, 9, 1, 1); g.r('#fef3c7', 10, 9, 2, 1); }),
    dish_thit_nuong: plate((g) => { g.l(K, 2, 9, 14, 6, 2); g.l('#a16207', 2, 9, 14, 6); for (const x of [4, 7, 10]) { g.r(K, x, 5, 3, 5); g.r('#b91c1c', x, 6, 2, 3); g.r('#7f1d1d', x, 8, 2, 1); } }),
    dish_banh_tao: plate((g) => { g.e(K, 8, 8, 6, 4); g.e('#d97706', 8, 8, 5, 3); g.e('#fcd34d', 8, 7, 4, 1); g.l('#92400e', 5, 6, 11, 9); g.l('#92400e', 11, 6, 5, 9); g.r('#dc2626', 7, 4, 2, 2); }),
    dish_tra_thao: (g) => { g.r(K, 3, 6, 9, 8); g.r('#f1f5f9', 4, 7, 7, 6); g.r('#65a30d', 4, 7, 7, 2); g.r(K, 12, 8, 3, 4); g.r('#f1f5f9', 12, 9, 2, 2); g.r('#fff', 5, 3, 1, 2); g.r('#fff', 8, 2, 1, 3); g.r('#bbf7d0', 6, 7, 2, 1); },
    dish_ca_nuong: plate((g) => { g.e(K, 7, 8, 6, 3); g.e('#b45309', 7, 8, 5, 2); g.r(K, 12, 6, 3, 5); g.r('#b45309', 13, 7, 1, 3); g.r('#451a03', 5, 7, 1, 3); g.r('#451a03', 8, 7, 1, 3); g.e('#22c55e', 3, 11, 2, 1); }),
    dish_canh_trung: bowl('#fde68a', (g) => { g.e('#fff', 7, 9, 2, 1); g.r('#f59e0b', 7, 9, 1, 1); g.r('#22c55e', 10, 8, 2, 1); }),
    dish_lau_ca: (g) => { g.r(K, 2, 7, 12, 7); g.r('#44403c', 3, 8, 10, 5); g.e('#ef4444', 8, 8, 5, 1); g.r('#cbd5e1', 6, 7, 3, 1); g.r('#22c55e', 10, 8, 2, 1); g.r(K, 0, 9, 2, 2); g.r(K, 14, 9, 2, 2); g.r('#fff', 5, 3, 1, 3); g.r('#fff', 10, 2, 1, 4); },
    dish_sup_hoi_sinh: bowl('#fde047', (g) => { g.r('#fff', 8, 2, 1, 5); g.r('#fff', 6, 4, 5, 1); g.r('#fef9c3', 3, 4, 1, 1); g.r('#fef9c3', 13, 5, 1, 1); g.r('#f97316', 7, 9, 2, 1); }),
    // ----- vật nhiệm vụ trong túi -----
    hammer: (g) => { g.l(K, 3, 14, 9, 6, 2); g.l('#b45309', 3, 13, 9, 6); g.r(K, 6, 1, 9, 6); g.r('#94a3b8', 7, 2, 7, 4); g.r('#e2e8f0', 7, 2, 7, 1); },
    q_cui: (g) => { DRAW.go(g); g.r('#fbbf24', 7, 3, 2, 11); },
    q_quang: rock('#475569', '#64748b', ['#2563eb', '#93c5fd']),
    q_thu: (g) => { g.r(K, 1, 4, 14, 9); g.r('#fef3c7', 2, 5, 12, 7); g.l('#d6a35c', 2, 5, 8, 9); g.l('#d6a35c', 14, 5, 8, 9); g.e('#dc2626', 8, 10, 1, 1); },
    q_meo: (g) => { g.e(K, 8, 10, 6, 5); g.e('#d97706', 8, 10, 5, 4); g.r(K, 3, 3, 3, 4); g.r(K, 10, 3, 3, 4); g.r('#d97706', 4, 4, 1, 3); g.r('#d97706', 11, 4, 1, 3); g.r('#92400e', 6, 6, 4, 1); g.r('#16a34a', 5, 9, 2, 2); g.r('#16a34a', 9, 9, 2, 2); g.r(K, 6, 9, 1, 2); g.r(K, 10, 9, 1, 2); g.r('#fda4af', 8, 11, 1, 1); },
    q_trang: (g) => { g.r(K, 3, 1, 10, 14); g.r('#fef3c7', 4, 2, 8, 12); for (const y of [4, 6, 8, 10]) g.r('#92400e', 5, y, 6, 1); g.r('#dc2626', 9, 12, 2, 1); },
    q_chan: (g) => { g.r(K, 1, 5, 14, 9); g.r('#7c3aed', 2, 6, 12, 7); g.r('#a78bfa', 2, 6, 12, 2); g.r('#fde68a', 2, 10, 12, 1); g.r('#5b21b6', 8, 6, 1, 7); },
    q_hoa: (g) => { g.l('#166534', 8, 15, 8, 6); g.e('#22c55e', 11, 11, 2, 1); for (const [x, y] of [[5, 5], [10, 4], [8, 8]]) { g.e(K, x, y, 3, 3); g.e('#f8fafc', x, y, 2, 2); g.r('#fde68a', x, y + 2, 1, 1); } },
    glowshroom: (g) => { DRAW.nam(g); g.e('#67e8f9', 8, 6, 5, 2); g.r('#fff', 6, 5, 2, 1); },
    startome: (g) => { g.r(K, 2, 2, 12, 13); g.r('#1e3a8a', 3, 3, 10, 11); g.r('#fde68a', 7, 5, 2, 5); g.r('#fde68a', 5, 7, 6, 1); g.r('#93c5fd', 3, 3, 1, 11); },
    // ----- dụng cụ (3 bậc: gỗ / sắt / thép) -----
    ...Object.fromEntries(['pick', 'axe', 'rod'].flatMap(k => [1, 2, 3].map(t => [`tool_${k}${t}`, tool(k, t)]))),
    // ----- vật trên bản đồ -----
    i_wheat: (g) => { for (const x of [3, 6, 9, 12]) { g.l('#a16207', x, 15, x, 7); g.r(K, x - 1, 3, 3, 6); g.r('#facc15', x, 4, 1, 4); g.r('#fef08a', x - 1, 5, 1, 2); } },
    i_mushroom: (g) => { for (const [x, y, c] of [[5, 9, '#b45309'], [11, 11, '#dc2626']]) { g.r('#fef3c7', x - 1, y, 2, 5); g.e(K, x, y, 4, 3); g.e(c, x, y, 3, 2); g.r('#fff7ed', x - 1, y - 1, 1, 1); } },
    i_herb: bush('#16a34a', '#86efac'), i_berry: bush('#15803d', '#4ade80', '#7c3aed'), i_flowers: bush('#15803d', '#4ade80', '#f472b6'),
    i_nest: (g) => { g.e(K, 8, 11, 7, 4); g.e('#a16207', 8, 11, 6, 3); g.e('#713f12', 8, 10, 4, 1); for (const x of [6, 8, 10]) { g.e('#fef3c7', x, 9, 1, 2); } g.l('#ca8a04', 2, 12, 14, 12); },
    i_appletree: tree('#15803d', '#4ade80', '#dc2626'), i_appletree_off: tree('#15803d', '#4ade80'),
    i_oak: tree('#14532d', '#166534'), i_oak_off: stump,
    i_logs: (g) => { for (const [x, y] of [[2, 10], [8, 10], [5, 6]]) { g.r(K, x, y - 1, 7, 5); g.r('#92400e', x + 1, y, 5, 3); g.e('#fcd34d', x + 1, y + 1, 1, 1); g.r('#b45309', x + 3, y, 3, 1); } },
    i_logs_off: (g) => { g.r(K, 4, 12, 8, 3); g.r('#92400e', 5, 12, 6, 2); g.r('#fcd34d', 5, 13, 1, 1); g.r('#a16207', 3, 14, 2, 1); g.r('#a16207', 12, 13, 2, 1); },
    i_ore_copper: rock('#78716c', '#a8a29e', ['#ea580c', '#fdba74']), i_ore_copper_off: rubble('#78716c'),
    i_ore_iron: rock('#52525b', '#71717a', ['#cbd5e1', '#fff']), i_ore_iron_off: rubble('#52525b'),
    i_ore_blue: rock('#475569', '#64748b', ['#2563eb', '#93c5fd']),
    i_hive: (g) => { g.r('#92400e', 7, 0, 2, 3); g.e(K, 8, 8, 5, 6); g.e('#f59e0b', 8, 8, 4, 5); for (const y of [5, 8, 11]) g.r('#b45309', 5, y, 7, 1); g.r(K, 7, 10, 2, 2); g.r('#fde047', 13, 4, 2, 1); g.r(K, 13, 5, 1, 1); },
    i_hive_off: (g) => { g.r('#92400e', 7, 0, 2, 3); g.e(K, 8, 8, 5, 6); g.e('#a8a29e', 8, 8, 4, 5); for (const y of [5, 8, 11]) g.r('#78716c', 5, y, 7, 1); },
    i_fishspot: (g) => { g.e('#0ea5e9', 8, 11, 7, 3); g.e('#7dd3fc', 8, 11, 4, 1); g.l('#e2e8f0', 12, 1, 8, 9); g.l(K, 15, 4, 12, 1, 1); g.r('#ef4444', 7, 9, 2, 2); g.r('#fff', 7, 8, 2, 1); },
    i_fishspot_off: (g) => { g.e('#0369a1', 8, 11, 7, 3); g.e('#0ea5e9', 8, 11, 4, 1); },
    i_rope: (g) => { g.r(K, 6, 0, 4, 16); for (let y = 0; y < 16; y++) g.r(y % 2 ? '#d6a35c' : '#a16207', 7, y, 2, 1); g.r(K, 3, 0, 10, 2); g.r('#78716c', 4, 0, 8, 1); },
    i_vine: (g) => { for (let y = 0; y < 16; y++) { g.r('#166534', 7 + (y % 4 < 2 ? 0 : 1), y, 2, 1); } for (const [x, y] of [[5, 2], [10, 5], [5, 8], [10, 11], [6, 14]]) { g.e(K, x, y, 2, 1); g.e('#4ade80', x, y, 1, 1); } },
    i_campfire: (g) => { g.l(K, 2, 14, 13, 11, 2); g.l('#92400e', 2, 13, 13, 11); g.l(K, 13, 14, 2, 11, 2); g.l('#b45309', 13, 13, 2, 11); g.e('#ea580c', 8, 8, 3, 5); g.e('#facc15', 8, 9, 2, 3); g.r('#fff', 8, 10, 1, 2); g.r('#ea580c', 5, 5, 1, 1); g.r('#facc15', 11, 3, 1, 1); },
    i_sign: board,
    i_carved: (g) => { g.r(K, 3, 0, 10, 16); g.r('#78350f', 4, 0, 8, 16); g.r('#92400e', 4, 0, 3, 16); for (const y of [3, 6, 9, 12]) g.r('#fde68a', 6, y, 4, 1); g.r('#fde68a', 7, 2, 1, 11); },
    i_grave: (g) => { g.e('#57534e', 8, 13, 7, 2); g.r(K, 7, 2, 2, 11); g.r('#92400e', 7, 3, 2, 9); g.r(K, 4, 5, 8, 2); g.r('#92400e', 5, 5, 6, 1); g.l('#a16207', 11, 4, 14, 12); g.e('#a8a29e', 4, 13, 2, 1); g.e('#a8a29e', 11, 14, 2, 1); },
    i_stone: stone((g) => { for (const y of [5, 7, 9, 11]) g.r('#4b5563', 6, y, 5, 1); }),
    i_stele: stone((g) => { g.r('#4b5563', 6, 5, 5, 3); g.r('#9ca3af', 6, 6, 5, 1); g.r('#16a34a', 4, 12, 3, 2); g.r('#f472b6', 10, 13, 2, 1); }),
    i_jar: (g) => { g.e(K, 8, 10, 6, 5); g.e('#b45309', 8, 10, 5, 4); g.e('#d97706', 6, 9, 2, 2); g.r(K, 5, 3, 6, 3); g.r('#92400e', 6, 4, 4, 2); g.r('#fde68a', 6, 8, 4, 1); },
    i_stove: (g) => { g.r(K, 1, 6, 14, 10); g.r('#78716c', 2, 7, 12, 8); g.r('#a8a29e', 2, 7, 12, 1); g.r(K, 5, 10, 6, 5); g.r('#ea580c', 6, 11, 4, 4); g.r('#facc15', 7, 12, 2, 3); g.r(K, 4, 2, 8, 5); g.r('#44403c', 5, 3, 6, 3); g.r('#fff', 7, 0, 1, 2); g.r('#fff', 10, 1, 1, 1); },
    i_bench: (g) => { g.r(K, 1, 7, 14, 3); g.r('#b45309', 2, 7, 12, 2); g.r(K, 2, 10, 2, 6); g.r(K, 12, 10, 2, 6); g.r('#d97706', 2, 7, 12, 1); g.r(K, 9, 3, 5, 4); g.r('#94a3b8', 10, 4, 3, 2); g.r('#e2e8f0', 10, 4, 3, 1); g.l('#92400e', 3, 6, 9, 3); g.r('#94a3b8', 2, 4, 3, 2); },
    i_cat: (g) => { g.r(K, 1, 8, 14, 8); g.r('#b45309', 2, 9, 12, 6); g.r('#92400e', 2, 12, 12, 1); g.e(K, 8, 6, 4, 3); g.e('#d97706', 8, 6, 3, 2); g.r(K, 4, 1, 3, 4); g.r(K, 9, 1, 3, 4); g.r('#d97706', 5, 2, 1, 3); g.r('#d97706', 10, 2, 1, 3); g.r('#16a34a', 6, 6, 1, 1); g.r('#16a34a', 10, 6, 1, 1); g.r('#fda4af', 8, 7, 1, 1); },
    i_trough: (g) => { g.r(K, 1, 9, 14, 5); g.r('#92400e', 2, 10, 12, 3); g.r('#facc15', 3, 9, 10, 2); g.r('#fef08a', 4, 9, 2, 1); g.r('#fef08a', 9, 9, 2, 1); g.r(K, 2, 14, 2, 2); g.r(K, 12, 14, 2, 2); g.e('#fff', 13, 5, 2, 2); g.r('#dc2626', 13, 2, 2, 1); g.r('#f59e0b', 15, 5, 1, 1); },
    i_scarecrow: (g) => { g.r(K, 7, 4, 2, 12); g.r('#92400e', 7, 9, 2, 7); g.r(K, 1, 6, 14, 3); g.r('#1d4ed8', 2, 7, 12, 2); g.r('#facc15', 1, 7, 1, 2); g.r('#facc15', 14, 7, 1, 2); g.r('#1d4ed8', 5, 9, 6, 4); g.e(K, 8, 3, 3, 3); g.e('#fde68a', 8, 4, 2, 2); g.r(K, 4, 1, 8, 2); g.r('#78350f', 6, 0, 4, 2); g.r(K, 7, 4, 1, 1); g.r(K, 9, 4, 1, 1); },
    i_chair: (g) => { g.r(K, 4, 1, 8, 9); g.r('#b45309', 5, 2, 6, 7); g.r('#92400e', 6, 3, 1, 5); g.r('#92400e', 9, 3, 1, 5); g.r(K, 3, 9, 10, 3); g.r('#d97706', 4, 9, 8, 2); g.r(K, 4, 12, 2, 4); g.r(K, 10, 12, 2, 4); },
    i_trap: (g) => { g.r(K, 2, 6, 12, 9); g.r('#a16207', 3, 7, 10, 7); for (const x of [5, 8, 11]) g.r(K, x, 7, 1, 7); g.r(K, 3, 10, 10, 1); g.l('#e2e8f0', 8, 1, 8, 6); g.r('#f97316', 6, 12, 2, 1); },
    i_firewood: (g) => { DRAW.go(g); g.r('#fbbf24', 7, 3, 2, 11); },
    i_blanket: (g) => { g.r(K, 1, 8, 14, 8); g.r('#b45309', 2, 9, 12, 6); g.r('#92400e', 2, 12, 12, 1); g.r(K, 2, 4, 12, 5); g.r('#7c3aed', 3, 5, 10, 3); g.r('#a78bfa', 3, 5, 10, 1); g.r('#fde68a', 3, 7, 10, 1); },
    i_bellflower: (g) => { DRAW.q_hoa(g); },
    i_spark: (g) => { g.r('#fffbeb', 7, 2, 2, 12); g.r('#fffbeb', 2, 7, 12, 2); g.r('#fde68a', 6, 6, 4, 4); g.r('#fff', 7, 7, 2, 2); g.r('#fde68a', 4, 4, 1, 1); g.r('#fde68a', 11, 4, 1, 1); g.r('#fde68a', 4, 11, 1, 1); g.r('#fde68a', 11, 11, 1, 1); },
    i_haystack: (g) => { g.e(K, 8, 10, 7, 6); g.e('#eab308', 8, 10, 6, 5); g.e('#fde047', 6, 8, 3, 2); for (const [x, y] of [[5, 11], [9, 9], [11, 12], [7, 13]]) g.l('#a16207', x, y, x + 1, y + 2); },
};
// mã trong túi dùng lại hình: vật nhiệm vụ nhiều món cùng loại, vật kiểu cũ
const ALIAS = { q_lua: 'lua', wheat: 'lua', q_nam: 'nam', mushroom: 'nam', herb: 'thao', q_trang1: 'q_trang', q_trang2: 'q_trang', q_trang3: 'q_trang',
    q_chan1: 'q_chan', q_chan2: 'q_chan', q_chan3: 'q_chan', q_chan4: 'q_chan', q_chan5: 'q_chan' };
const keyOf = (k) => (DRAW[k] ? k : ALIAS[k] ?? null);
export const hasIcon = (key) => !!keyOf(key);

const urls = new Map();
/** Ảnh 1 vật (data URL, nền trong suốt) — null nếu chưa có hình */
export function iconURL(key) {
    const k = keyOf(key);
    if (!k || typeof document === 'undefined') return null;
    if (!urls.has(k)) {
        const c = document.createElement('canvas');
        c.width = c.height = CELL;
        DRAW[k](pen(c.getContext('2d')));
        urls.set(k, c.toDataURL());
    }
    return urls.get(k);
}
/** <img> ảnh vật, thiếu hình thì hiện 📦 */
export function itemIcon(key, cls = 'ic', fallback = '📦') {
    const url = iconURL(key);
    return url ? `<img class="${cls} ic-pixel" src="${url}" alt="" draggable="false">` : `<span class="${cls} ic-emoji">${fallback}</span>`;
}
// ---------- tấm ảnh ghép cho vật trên bản đồ (cùng kiểu items.webp: url + meta + số ô) ----------
const MAP_KEYS = Object.keys(DRAW).filter(k => k.startsWith('i_'));
let atlas = null;
export function mapAtlas() {
    if (atlas || typeof document === 'undefined') return atlas;
    const cols = 8, rows = Math.ceil(MAP_KEYS.length / cols), c = document.createElement('canvas');
    c.width = cols * CELL; c.height = rows * CELL;
    const ctx = c.getContext('2d');
    MAP_KEYS.forEach((k, i) => DRAW[k](pen(ctx, (i % cols) * CELL, Math.floor(i / cols) * CELL)));
    atlas = { url: c.toDataURL(), canvas: c, meta: { cols, rows, cw: CELL, ch: CELL } };
    return atlas;
}
/** Ô của 1 vật bản đồ trong tấm ảnh ghép (null nếu không có). done = true: dùng bản "_off" nếu có */
export function mapCell(sprite, done = false) {
    const i = MAP_KEYS.indexOf(done && DRAW[`${sprite}_off`] ? `${sprite}_off` : sprite);
    return i < 0 ? null : i;
}
export const hasOff = (sprite) => !!DRAW[`${sprite}_off`];
