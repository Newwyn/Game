// ============================================================
// Hình nhân vật theo BẬC: Thường + S -> tranh S · SS -> tranh SS · SSS -> tranh hiện tại (bản đầy đủ nhất)
// Tranh bậc thấp do Flow vẽ lại từng tấm động tác của bản SSS (giữ nguyên lưới + dáng, đổi trang phục / vũ khí — tools/tier_art.py),
// nên tên khung giống hệt -> dùng chung bảng clip của nhân vật, chỉ đổi atlas (image) + toạ độ khung (meta).
// Atlas: tools/sprite_pack.py art/<tên>/sprite_<bậc>/sprite_spec.json -> src/assets/sprites/<tên>_<bậc>_sprite.webp + <tên>Sprite_<bậc>.json
// Bậc nào chưa có tranh thì dùng tranh SSS.
// ============================================================
import { markTextureFailed } from '../../core/textures.js';
import { paperPortraitFor, paperSpriteFor } from './paperSets.js';

const IMG = import.meta.glob('../../assets/sprites/*_{s,ss}_sprite.webp', { eager: true, import: 'default' });
const META = import.meta.glob('./*Sprite_{s,ss}.json', { eager: true, import: 'default' });
const SSS_IMG = import.meta.glob('../../assets/sprites/*_sprite.webp', { eager: true, import: 'default' });
const SSS_META = import.meta.glob('./*Sprite.json', { eager: true, import: 'default' });

// classId -> tên thư mục tranh
const ART = { assassin: 'jessica', warrior: 'rok', archer: 'lyra', priest: 'seraphine', mage: 'ignar', alchemist: 'grix', reaper: 'zerith',
    wrestler: 'brakk', dancer: 'nerissa', elementalist: 'elarion', summoner: 'sylva', voidmage: 'nyx', chessmaster: 'leon', swordsage: 'yunyou' };

/** Bậc (0 Thường · 1 S · 2 SS · 3 SSS) -> hậu tố tranh, null = tranh gốc */
export const tierOf = (rank) => (rank == null || rank >= 3 ? null : rank >= 2 ? 'ss' : 's');

// Bậc hiện tại của từng anh hùng (cập nhật mỗi lần nhận tiến trình) — để khung thoại / thẻ dùng đúng hình bậc
let RANKS = {};
export function setHeroRanks(progress) {
    RANKS = Object.fromEntries(Object.entries(progress?.heroes ?? {}).map(([id, h]) => [id, ({ s: 1, ss: 2, sss: 3 })[h?.skin] ?? h?.rank ?? 0]));   // trang phục người chơi chọn (nếu có) thắng bậc
    for (const id of Object.keys(RANKS)) tierPortrait(id);   // cắt sẵn chân dung để lần đầu hiện đã có
}

// Chân dung theo bậc: cắt khung đứng (idle1) trong tranh bậc -> ảnh dataURL (lưu sẵn). Chưa nạp xong ảnh -> null (lần sau có)
const portraitCache = new Map();
export function tierPortrait(classId, rank = RANKS[classId] ?? 3) {
    const art = ART[classId];
    if (!art) return null;
    let t = tierOf(rank);
    let image = t ? IMG[`../../assets/sprites/${art}_${t}_sprite.webp`] : null;
    let meta = t ? META[`./${art}Sprite_${t}.json`] : null;
    let key = t ? `${art}_${t}` : `${art}_sss`;
    const paper = paperPortraitFor(classId);
    if (paper) {
        image = paper.image;
        meta = paper.meta;
        key = `${paper.key}_paper`;
    } else if ((!image || !meta) && classId === 'swordsage') {
        // YunYou (chưa có tranh S/SS riêng): mọi bậc tạm dùng bộ SSS
        image = SSS_IMG[`../../assets/sprites/${art}_sprite.webp`];
        meta = SSS_META[`./${art}Sprite.json`];
        key = `${art}_sss`;
    }
    if (!image || !meta) return null;
    const f = meta?.frames?.idle1 ?? (meta && Object.values(meta.frames)[0]);
    if (!f?.rect) return null;
    const c = portraitCache.get(key);
    if (typeof c === 'string') return c;
    if (!c) {
        const img = new Image();
        portraitCache.set(key, img);
        img.onload = () => {
            const [x, y, w, h] = f.rect;
            const cv = document.createElement('canvas');
            cv.width = w; cv.height = h;
            cv.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
            portraitCache.set(key, cv.toDataURL('image/png'));
        };
        img.onerror = () => {
            markTextureFailed(image);
            portraitCache.delete(key);
            if (paper) tierPortrait(classId, rank);
        };
        img.src = image;
    }
    return null;
}

/** Đường dẫn tranh bậc của các anh hùng trong tiến trình ({ heroes: { classId: { rank } } }) — để nạp ngầm trước trận */
export function tierUrls(progress) {
    const out = [];
    for (const [classId, h] of Object.entries(progress?.heroes ?? {})) {
        const paper = paperPortraitFor(classId);
        if (paper) { out.push(paper.image); continue; }
        const t = tierOf(h?.rank ?? 0), art = ART[classId];
        const url = t && art && IMG[`../../assets/sprites/${art}_${t}_sprite.webp`];
        if (url && META[`./${art}Sprite_${t}.json`]) out.push(url);
    }
    return out;
}

/** Bảng sprite theo bậc: cùng clip, đổi atlas + meta nếu đã có tranh bậc đó */
export function tierSprite(base, classId, rank) {
    const stdBase = base?.fallbackSprite ?? base;
    const t = tierOf(rank), art = ART[classId];
    if (!stdBase || !art) return base;
    const img = t ? IMG[`../../assets/sprites/${art}_${t}_sprite.webp`] : null;
    const meta = t ? META[`./${art}Sprite_${t}.json`] : null;
    // tierTopScale: tranh bậc thấp có tỉ lệ đỉnh tóc / đỉnh hình khác bản SSS (VD gậy Sera dạng S không cao hơn đầu) -> chiều cao người vẫn bằng nhau
    const tiered = t && img && meta ? { ...stdBase, image: img, meta, tier: t, topScale: stdBase.tierTopScale?.[t] ?? stdBase.topScale } : stdBase;
    return paperSpriteFor(classId, stdBase, tiered);
}
