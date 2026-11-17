// Sinh sprite_spec.json cho Nyx (bậc SSS) và 6 quân cờ: tấm đứng do Codex vẽ (1536x1024), tấm động tác do Flow vẽ (JPEG 1200x896 -> scale 1.28)
//   node art/leon/pack_specs.mjs   rồi   python tools/sprite_pack.py <spec> cho từng bộ
import fs from 'node:fs';
const F = 1.28;
const DEAD7 = ['pawn', 'knight', 'king', 'queen'];   // khung cuối (đống đá vụn) quá nhỏ, bị gộp vào khung trước -> chỉ còn 3 khung gục
const base = (note, out, meta) => ({ note, atlasScale: 0.6, maxWidth: 4096, pad: 6, calib: 'idle1', key: 'green', footBand: 16, footMin: 25, solidFeet: true, out, meta, format: 'webp' });
const nyx = { ...base('Nyx (Hu Khong) bac SSS: dung = Codex, dong tac = Flow 17/11/2026', 'src/assets/sprites/nyx_sprite', 'src/characters/sprite/nyxSprite.json'), atlasScale: 0.75, sheets: {
    idle: { scale: 1, split: true, file: 'art/nyx/sprite/sprite-idle.png', groups: [['idle', 4, 'heel'], ['ready', 4, 'heel']] },
    attack: { scale: F, split: true, file: 'art/nyx/sprite_flow/sprite-attack.jpg', anchor: 'heel' },
    move: { scale: F, split: true, file: 'art/nyx/sprite_flow/sprite-move.jpg', anchor: 'body' },
    'hurt-stun': { scale: F, split: true, file: 'art/nyx/sprite_flow/sprite-hurt-stun.jpg', groups: [['hurt', 4, 'heel'], ['stun', 4, 'heel']] },
    'dead-victory': { scale: F, split: true, file: 'art/nyx/sprite_flow/sprite-dead-victory.jpg', groups: [['dead', 4, 'toe'], ['victory', 4, 'body']], ground: 'group' },
    'cast-land': { scale: F, split: true, file: 'art/nyx/sprite_flow/sprite-cast-land.jpg', groups: [['cast', 4, 'heel'], ['land', 4, 'body']], ground: 'group' },
    missiles: { scale: F, split: true, file: 'art/nyx/sprite_flow/sprite-missiles.jpg', anchor: 'heel' },
    starfall: { scale: F, split: true, file: 'art/nyx/sprite_flow/sprite-starfall.jpg', anchor: 'heel' },
    blackhole: { scale: F, split: true, file: 'art/nyx/sprite_flow/sprite-blackhole.jpg', anchor: 'heel' } } };
fs.writeFileSync('art/nyx/sprite/sprite_spec.json', JSON.stringify(nyx, null, 4));
for (const p of ['pawn', 'rook', 'knight', 'bishop', 'king', 'queen']) {
    const d = `art/leon/${p}/`;
    const spec = { ...base(`Quan ${p} cua Leon: dung = Codex, dong tac = Flow`, `src/assets/sprites/chess_${p}_sprite`, `src/characters/sprite/chess_${p}Sprite.json`), sheets: {
        idle: { scale: 1, split: true, file: d + 'sprite-idle.png', groups: [['idle', 4, 'heel'], ['ready', 4, 'heel']] },
        attack: { scale: F, split: true, file: d + 'flow/sprite-attack.jpg', anchor: 'body', ground: 'group' },
        move: { scale: F, split: true, file: d + 'flow/sprite-move.jpg', anchor: 'body', ground: 'group' },
        'hurt-dead': { scale: F, split: true, file: d + 'flow/sprite-hurt-dead.jpg', groups: [['hurt', 4, 'heel'], ['dead', DEAD7.includes(p) ? 3 : 4, 'body']], ground: 'group' },
        skill: { scale: F, split: true, file: d + 'flow/sprite-skill.jpg', groups: [['skillA', 4, 'body'], ['skillB', 4, 'body']], ground: 'group' } } };
    fs.writeFileSync(d + 'sprite_spec.json', JSON.stringify(spec, null, 4));
}
console.log('ok');
