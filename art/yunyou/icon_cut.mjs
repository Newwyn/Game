// Cắt tấm icon YunYou (Antigravity vẽ, 1264x848, 3x2 ô) -> src/assets/skills/swordsage_*.webp 128x128
import sharp from 'sharp';
const names = ['swordsage_0', 'swordsage_1', 'swordsage_2', 'swordsage_t1', 'swordsage_t2', 'swordsage_atk'];
const xs = [22, 437, 852], ys = [27, 435], w = 390, h = 382;
for (let i = 0; i < 6; i++)
    await sharp('art/yunyou/icons.jpg').extract({ left: xs[i % 3] + 6, top: ys[Math.floor(i / 3)] + 6, width: w - 12, height: h - 12 }).resize(128, 128, { fit: 'fill' }).webp({ quality: 90 }).toFile(`src/assets/skills/${names[i]}.webp`);
await sharp({ create: { width: 128 * 6, height: 128, channels: 3, background: '#222' } }).composite(names.map((n, i) => ({ input: `src/assets/skills/${n}.webp`, left: i * 128, top: 0 }))).jpeg().toFile('art/yunyou/icons_check.jpg');
console.log('ok');
