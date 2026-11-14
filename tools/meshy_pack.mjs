// Nén mô hình Meshy cho game nhẹ (14/11/2026): hình khối nén meshopt + ảnh dán nhỏ lại, bỏ ảnh kim loại/nhám (game không dùng)
//   node tools/meshy_pack.mjs                 -> nén lại mọi file trong src/assets/world3d/meshy từ bản gốc art/battle3d/meshy/<tên>_raw.glb
//   node tools/meshy_pack.mjs prop_haystack   -> chỉ nén 1 file
// Cỡ ảnh màu: công trình (bld_*) + cây lớn 1024, đồ nhỏ 512; ảnh lồi lõm (normal) 512.
// Game giải nén bằng MeshoptDecoder (src/world3d/assets.js).
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, prune, dedup, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const RAW = 'art/battle3d/meshy', OUT = 'src/assets/world3d/meshy';
const BIG = /^(bld_|forest_(oak|birch)$|town_fountain$)/;
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const only = process.argv.slice(2);
const names = fs.readdirSync(OUT).filter(f => f.endsWith('.glb')).map(f => f.slice(0, -4)).filter(n => !only.length || only.includes(n));
let before = 0, after = 0;
for (const n of names) {
    const src = path.join(RAW, n + '_raw.glb');
    if (!fs.existsSync(src)) { console.warn('thiếu bản gốc', src); continue; }
    before += fs.statSync(path.join(OUT, n + '.glb')).size;
    const doc = await io.read(src);
    for (const m of doc.getRoot().listMaterials()) { m.setMetallicRoughnessTexture(null); m.setMetallicFactor(0); m.setRoughnessFactor(0.9); }
    await doc.transform(prune(), dedup());
    const big = BIG.test(n) ? 1024 : 512;
    await doc.transform(
        textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 86, resize: [big, big], slots: /^baseColorTexture$/ }),
        textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 80, resize: [512, 512], slots: /^(normalTexture|emissiveTexture|occlusionTexture)$/ }),
        meshopt({ encoder: MeshoptEncoder, level: 'high' }),
    );
    await io.write(path.join(OUT, n + '.glb'), doc);
    const s = fs.statSync(path.join(OUT, n + '.glb')).size; after += s;
    console.log(n.padEnd(22), (s / 1024 | 0) + ' KB');
}
console.log(`Tổng: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
