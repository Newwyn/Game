// 🌾 Cỏ cao kiểu Pokémon: ô nào gặp được quái hoang (theo loại mặt đất trong src/world/terrain3d.js) + tỉ lệ gặp
//   f = ruộng lúa · g = bãi cỏ. Luật trận / thưởng ở server: game/wild.js
import { TERRAIN } from './terrain3d.js';

export const WILD_TILES = { outskirts: 'f', forest: 'g', road: 'g' };
export const RATE = 1 / 14;          // mỗi bước trên cỏ cao
export const GRACE_STEPS = 8;        // vừa vào khu / vừa đánh xong: đi tự do vài bước

/** Ô (x, y) của khu có phải cỏ cao không */
export function isWildTile(scene, x, y) {
    const t = WILD_TILES[scene];
    return !!t && TERRAIN[scene]?.[y]?.[x] === t;
}
