import sharp from 'sharp';
const names = process.argv.slice(3), W = 632, H = 424;
await sharp({ create: { width: W * 2, height: H * Math.ceil(names.length / 2), channels: 3, background: '#000' } })
  .composite(await Promise.all(names.map(async (n, i) => ({ input: await sharp(n).resize(W, H, { fit: 'fill' }).toBuffer(), left: (i % 2) * W, top: Math.floor(i / 2) * H })))).jpeg({ quality: 82 }).toFile(process.argv[2]);
