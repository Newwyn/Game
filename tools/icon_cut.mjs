// Cắt tấm icon 3x2 (1536x1024, ô 512) thành từng icon 128x128 webp: node tools/icon_cut.mjs <thư mục ra> (đọc bảng CELLS của art/icons/icon_jobs_leon_nyx.mjs)
import sharp from 'sharp';
import fs from 'node:fs';
const out = process.argv[2] ?? 'src/assets/skills';
const src = fs.readFileSync('art/icons/icon_jobs_leon_nyx.mjs', 'utf8');
const CELLS = eval('(' + src.match(/export const CELLS = (\{[\s\S]*?\n\});/)[1] + ')');
for (const [sheet, names] of Object.entries(CELLS)) {
    for (let i = 0; i < names.length; i++) {
        const left = (i % 3) * 512 + 36, top = Math.floor(i / 3) * 512 + 36;   // bỏ viền trống quanh hình vuông ~448
        await sharp(`art/icons/${sheet}.png`).extract({ left, top, width: 440, height: 440 }).resize(128, 128).webp({ quality: 90 }).toFile(`${out}/${names[i]}.webp`);
    }
}
const copy = { chessmaster_0: 'chess_pawn', chessmaster_1: 'chess_knight', chessmaster_2: 'chess_locked' };
for (const [a, b] of Object.entries(copy)) fs.copyFileSync(`${out}/${b}.webp`, `${out}/${a}.webp`);
console.log('xong', Object.values(CELLS).flat().length + 3, 'icon ->', out);
