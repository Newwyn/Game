// Đóng gói mô hình 3D cho bản đồ thế giới (Kenney, giấy phép CC0 — dùng tự do, kể cả thương mại)
// Dùng: node tools/pack_world3d.mjs <thư mục chứa các bộ Kenney đã giải nén>
//   Thư mục nguồn cần có: nature/Models/GLTF format, town/Models/GLB format, x_castle-kit/…, x_survival-kit/…, x_graveyard-kit_5.0/…
//   (tải ở opengameart.org: Nature Kit, Fantasy Town Kit, Castle Kit, Survival Kit, Graveyard Kit — tác giả Kenney)
// Việc làm: chép đúng các mô hình trong LIST sang src/assets/world3d/<bộ>/<tên>.glb,
//   · nhúng ảnh bảng màu (Textures/colormap.png) vào trong file .glb — để Vite đổi tên file khi build vẫn không mất ảnh
//   · đặt kim loại = 0 (bộ Nature ghi kim loại = 1 → không có môi trường phản chiếu sẽ đen thui)
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2];
if (!SRC) { console.error('Thiếu đường dẫn thư mục nguồn'); process.exit(1); }
const OUT = path.resolve('src/assets/world3d');
const KITS = {
    nature: 'nature/Models/GLTF format',
    town: 'town/Models/GLB format',
    castle: 'x_castle-kit/Models/GLB format',
    survival: 'x_survival-kit/Models/GLB format',
    graveyard: 'x_graveyard-kit_5.0/Models/GLB format',
};
const LIST = {
    nature: ['tree_oak', 'tree_oak_dark', 'tree_default', 'tree_default_dark', 'tree_detailed', 'tree_detailed_dark', 'tree_fat', 'tree_fat_darkh', 'tree_simple', 'tree_small',
        'tree_pineRoundA', 'tree_pineRoundB', 'tree_pineRoundC', 'tree_pineRoundD', 'tree_pineTallA', 'tree_pineTallA_detailed', 'tree_pineTallB_detailed', 'tree_pineDefaultA', 'tree_pineDefaultB',
        'plant_bush', 'plant_bushLarge', 'plant_bushDetailed', 'plant_bushSmall', 'plant_bushLargeTriangle', 'plant_flatTall',
        'grass', 'grass_large', 'grass_leafs', 'grass_leafsLarge', 'flower_redA', 'flower_redB', 'flower_yellowA', 'flower_yellowB', 'flower_purpleA', 'flower_purpleB',
        'mushroom_red', 'mushroom_redGroup', 'mushroom_tan', 'mushroom_tanGroup', 'mushroom_tanTall',
        'rock_largeA', 'rock_largeB', 'rock_largeC', 'rock_smallA', 'rock_smallC', 'rock_smallFlatA', 'rock_tallA', 'rock_tallB', 'stone_smallA', 'stone_smallC', 'stone_largeA', 'stone_tallA',
        'cliff_block_rock', 'cliff_blockHalf_rock', 'cliff_cave_rock', 'cliff_large_rock', 'cliff_top_rock', 'cliff_corner_rock',
        'bridge_stone', 'bridge_stoneRound', 'fence_simple', 'fence_planks', 'fence_gate', 'sign', 'log', 'log_large', 'log_stack', 'log_stackLarge', 'stump_round', 'stump_old',
        'lily_large', 'lily_small', 'campfire_stones', 'campfire_logs', 'crops_wheatStageA', 'crops_wheatStageB', 'crops_cornStageD', 'crop_pumpkin', 'crops_dirtRow',
        'pot_large', 'pot_small', 'tent_detailedOpen', 'tent_smallClosed', 'canoe', 'hanging_moss', 'statue_obelisk', 'statue_column'],
    town: ['wall-wood', 'wall-wood-door', 'wall-wood-window-shutters', 'wall-wood-window-small', 'wall-wood-detail-cross', 'wall', 'wall-door', 'wall-window-shutters', 'wall-window-glass',
        'wall-window-round', 'wall-arch', 'wall-block', 'wall-corner', 'wall-doorway-round', 'roof-high-gable', 'roof-high-gable-end', 'roof-high-point', 'roof-gable', 'roof-gable-end', 'roof-point', 'roof-flat',
        'chimney', 'fountain-round', 'fountain-round-detail', 'fountain-center', 'lantern', 'cart', 'cart-high', 'watermill', 'windmill', 'blade', 'stall', 'stall-red', 'stall-green', 'stall-bench', 'stall-stool',
        'fence', 'fence-gate', 'hedge', 'hedge-large', 'planks', 'planks-opening', 'poles', 'poles-horizontal', 'pillar-wood', 'pillar-stone', 'banner-red', 'banner-green', 'overhang',
        'stairs-stone', 'stairs-wood', 'road', 'wheel', 'rock-large', 'rock-wide'],
    castle: ['wall', 'wall-half', 'wall-corner', 'wall-doorway', 'wall-pillar', 'wall-narrow', 'gate', 'door', 'metal-gate', 'tower-base', 'tower-top', 'tower-square', 'tower-square-base',
        'tower-square-mid', 'tower-square-mid-windows', 'tower-square-mid-door', 'tower-square-top', 'tower-square-roof', 'tower-square-top-roof', 'tower-square-top-roof-high', 'tower-square-top-roof-high-windows',
        'tower-hexagon-base', 'tower-hexagon-mid', 'tower-hexagon-top', 'tower-hexagon-roof', 'tower-slant-roof', 'flag', 'flag-banner-long', 'flag-pennant', 'flag-wide', 'stairs-stone', 'bridge-straight'],
    survival: ['tent', 'tent-canvas', 'barrel', 'box', 'box-large', 'chest', 'workbench-anvil', 'workbench', 'fence-fortified', 'fence', 'signpost', 'signpost-single', 'campfire-pit', 'campfire-stand',
        'resource-wood', 'resource-stone', 'tool-pickaxe', 'tool-hammer', 'bucket', 'floor', 'structure', 'structure-roof', 'bedroll'],
    graveyard: ['crypt', 'crypt-small', 'crypt-door', 'hay-bale', 'hay-bale-bundled', 'lightpost-single', 'lightpost-double', 'lantern-candle', 'iron-fence', 'stone-wall', 'pillar-large', 'pillar-obelisk',
        'gravestone-cross', 'urn-round', 'bench', 'cross-column', 'column-large', 'altar-stone'],
};

function readGlb(file) {
    const b = fs.readFileSync(file);
    if (b.readUInt32LE(0) !== 0x46546c67) throw new Error('không phải GLB: ' + file);
    let off = 12, json = null, bin = Buffer.alloc(0);
    while (off < b.length) {
        const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4);
        const data = b.subarray(off + 8, off + 8 + len);
        if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8'));
        else if (type === 0x004e4942) bin = Buffer.from(data);
        off += 8 + len;
    }
    return { json, bin };
}
const pad4 = (buf, fill) => buf.length % 4 ? Buffer.concat([buf, Buffer.alloc(4 - (buf.length % 4), fill)]) : buf;
function writeGlb(file, json, bin) {
    const j = pad4(Buffer.from(JSON.stringify(json), 'utf8'), 0x20), bb = pad4(bin, 0);
    const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + j.length + 8 + bb.length, 8);
    const ch = (len, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.writeUInt32LE(type, 4); return h; };
    fs.writeFileSync(file, Buffer.concat([head, ch(j.length, 0x4e4f534a), j, ch(bb.length, 0x004e4942), bb]));
}

let n = 0, bytes = 0;
for (const [kit, names] of Object.entries(LIST)) {
    const dir = path.join(SRC, KITS[kit]);
    fs.mkdirSync(path.join(OUT, kit), { recursive: true });
    for (const name of names) {
        const file = path.join(dir, name + '.glb');
        if (!fs.existsSync(file)) { console.warn('THIẾU', kit, name); continue; }
        const { json, bin } = readGlb(file);
        let data = pad4(bin, 0);
        for (const img of json.images ?? []) {
            if (!img.uri || img.uri.startsWith('data:')) continue;
            const png = fs.readFileSync(path.join(dir, decodeURIComponent(img.uri)));
            json.bufferViews.push({ buffer: 0, byteOffset: data.length, byteLength: png.length });
            img.bufferView = json.bufferViews.length - 1; img.mimeType = 'image/png'; delete img.uri;
            data = pad4(Buffer.concat([data, png]), 0);
        }
        if (json.buffers?.[0]) { json.buffers[0].byteLength = data.length; delete json.buffers[0].uri; }
        for (const m of json.materials ?? []) { m.pbrMetallicRoughness ??= {}; m.pbrMetallicRoughness.metallicFactor = 0; m.pbrMetallicRoughness.roughnessFactor = 0.9; }
        const out = path.join(OUT, kit, name + '.glb');
        writeGlb(out, json, data);
        n++; bytes += fs.statSync(out).size;
    }
}
fs.writeFileSync(path.join(OUT, 'LICENSE.txt'), `Mô hình 3D trong thư mục này: bộ Nature Kit, Fantasy Town Kit, Castle Kit, Survival Kit, Graveyard Kit
của Kenney (www.kenney.nl) — giấy phép Creative Commons Zero (CC0): dùng tự do cho dự án cá nhân, giáo dục và thương mại,
không bắt buộc ghi công. Nguồn tải: opengameart.org. Đóng gói bằng tools/pack_world3d.mjs (nhúng ảnh màu, đặt kim loại = 0).
`);
console.log(`Đã đóng gói ${n} mô hình, ${(bytes / 1024 / 1024).toFixed(2)} MB → ${OUT}`);
