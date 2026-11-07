// ============================================================
// Hình nhân vật theo BẬC: Thường + S -> tranh S · SS -> tranh SS · SSS -> tranh hiện tại (bản đầy đủ nhất)
// Tranh bậc thấp do Flow vẽ lại từng tấm động tác của bản SSS (giữ nguyên lưới + dáng, đổi trang phục / vũ khí — tools/tier_art.py),
// nên tên khung giống hệt -> dùng chung bảng clip của nhân vật, chỉ đổi atlas (image) + toạ độ khung (meta).
// Atlas: tools/sprite_pack.py art/<tên>/sprite_<bậc>/sprite_spec.json -> src/assets/sprites/<tên>_<bậc>_sprite.webp + <tên>Sprite_<bậc>.json
// Bậc nào chưa có tranh thì dùng tranh SSS.
// ============================================================
const IMG = import.meta.glob('../../assets/sprites/*_{s,ss}_sprite.webp', { eager: true, import: 'default' });
const META = import.meta.glob('./*Sprite_{s,ss}.json', { eager: true, import: 'default' });

// classId -> tên thư mục tranh
const ART = { assassin: 'jessica', warrior: 'rok', archer: 'lyra', priest: 'seraphine', mage: 'ignar', alchemist: 'grix', reaper: 'zerith',
    wrestler: 'brakk', dancer: 'nerissa', elementalist: 'elarion', summoner: 'sylva' };

/** Bậc (0 Thường · 1 S · 2 SS · 3 SSS) -> hậu tố tranh, null = tranh gốc */
export const tierOf = (rank) => (rank == null || rank >= 3 ? null : rank >= 2 ? 'ss' : 's');

/** Đường dẫn tranh bậc của các anh hùng trong tiến trình ({ heroes: { classId: { rank } } }) — để nạp ngầm trước trận */
export function tierUrls(progress) {
    const out = [];
    for (const [classId, h] of Object.entries(progress?.heroes ?? {})) {
        const t = tierOf(h?.rank ?? 0), art = ART[classId];
        const url = t && art && IMG[`../../assets/sprites/${art}_${t}_sprite.webp`];
        if (url && META[`./${art}Sprite_${t}.json`]) out.push(url);
    }
    return out;
}

/** Bảng sprite theo bậc: cùng clip, đổi atlas + meta nếu đã có tranh bậc đó */
export function tierSprite(base, classId, rank) {
    const t = tierOf(rank), art = ART[classId];
    if (!base || !t || !art) return base;
    const image = IMG[`../../assets/sprites/${art}_${t}_sprite.webp`], meta = META[`./${art}Sprite_${t}.json`];
    return image && meta ? { ...base, image, meta, tier: t } : base;
}
