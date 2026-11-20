// ============================================================
// PAPER SETS — Bảng đăng ký bộ hình / hiệu ứng trang phục Giấy theo classId
// ============================================================
// Mọi tệp giấy đều nạp tuỳ chọn qua import.meta.glob: thiếu tệp hoặc ảnh lỗi tải -> tự lùi về bản chuẩn, không văng lỗi.
// Thêm nhân vật giấy mới chỉ cần thêm 1 mục vào PAPER_SETS (kèm tệp tương ứng nếu có) và cập nhật PAPER_SKIN_CLASSES ở game/skins.js.
import { isTextureFailed } from '../../core/textures.js';

const SPRITE_IMG = import.meta.glob('../../assets/sprites/*_paper_sprite.webp', { eager: true, import: 'default' });
const SPRITE_META = import.meta.glob('./*PaperSprite.json', { eager: true, import: 'default' });
const FX_IMG = import.meta.glob('../../assets/sprites/*_paper_fx.webp', { eager: true, import: 'default' });
const FX_META = import.meta.glob('../../vfx/*PaperFx.json', { eager: true, import: 'default' });

const hasSpriteMeta = (m) => !!(m?.frames && m?.size && (m.frames.idle1 || Object.keys(m.frames).length));
const hasFxMeta = (m, groups) => !!(m?.size && m?.groups && (!groups?.length || groups.every(k => m.groups[k]?.frames?.length)));

export const PAPER_SETS = {
    warrior: {
        key: 'rok',
        sprite: {
            image: SPRITE_IMG['../../assets/sprites/rok_paper_sprite.webp'] ?? null,
            meta: SPRITE_META['./rokPaperSprite.json'] ?? null,
        },
        fx: {
            image: FX_IMG['../../assets/sprites/rok_paper_fx.webp'] ?? null,
            meta: FX_META['../../vfx/rokPaperFx.json'] ?? null,
            requiredGroups: [
                'aegisA', 'aegisB', 'lion', 'roarWave', 'holyCircle', 'goldRing',
                'quakeRing', 'tauntIcon', 'buffIcon', 'bashBurst', 'chain', 'healCross',
            ],
        },
    },
    mage: {
        key: 'ignar',
        sprite: {
            image: SPRITE_IMG['../../assets/sprites/ignar_paper_sprite.webp'] ?? null,
            meta: SPRITE_META['./ignarPaperSprite.json'] ?? null,
        },
        fx: {
            image: FX_IMG['../../assets/sprites/ignar_paper_fx.webp'] ?? null,
            meta: FX_META['../../vfx/ignarPaperFx.json'] ?? null,
            requiredGroups: [
                'hand', 'ball', 'boom', 'hit', 'swirl', 'meteor', 'flame', 'warn', 'scorch',
                'circleDim', 'circleLit', 'summonCircle', 'shockRing', 'slam', 'breakIcon',
                'pillar', 'aura', 'wing', 'palm', 'shield', 'guard',
            ],
        },
    },
};

export const hasPaperSet = (classId) => {
    const sp = PAPER_SETS[classId]?.sprite;
    return !!(sp?.image && hasSpriteMeta(sp.meta));
};

/** Kiểm tra bộ giấy của `classId` đã sẵn sàng dùng cho `kind` ('sprite' | 'fx') chưa */
export function paperReady(classId, kind = 'sprite') {
    const entry = PAPER_SETS[classId];
    if (!entry) return false;
    if (kind === 'sprite') {
        const sp = entry.sprite;
        return !!(sp?.image && hasSpriteMeta(sp.meta) && !isTextureFailed(sp.image));
    }
    if (kind === 'fx') {
        const fx = entry.fx;
        return !!(fx?.image && hasFxMeta(fx.meta, fx.requiredGroups) && !isTextureFailed(fx.image));
    }
    return false;
}

/** Trả về config sprite giấy cho `classId` khi sẵn sàng, ngược lại trả `fallback` (mặc định là `baseSprite`) */
export function paperSpriteFor(classId, baseSprite, fallback = baseSprite) {
    const stdBase = baseSprite?.fallbackSprite ?? baseSprite;
    if (!stdBase || !paperReady(classId, 'sprite')) return fallback;
    const { image, meta } = PAPER_SETS[classId].sprite;
    return { ...stdBase, image, meta, tier: 'paper', topScale: undefined, paper: true, fallbackSprite: fallback };
}

/** Trả về { key, image, url, meta, frame } để cắt chân dung / ảnh thu nhỏ kiểu giấy khi sẵn sàng, null nếu không có */
export function paperPortraitFor(classId) {
    if (!paperReady(classId, 'sprite')) return null;
    const entry = PAPER_SETS[classId];
    const frame = entry.sprite.meta?.frames?.idle1 ?? Object.values(entry.sprite.meta?.frames ?? {})[0] ?? null;
    return { key: entry.key, image: entry.sprite.image, url: entry.sprite.image, meta: entry.sprite.meta, frame };
}

/** Trả về { url, image, meta, key } cho atlas hiệu ứng giấy của `classId` khi sẵn sàng, null nếu không có */
export function paperFxFor(classId) {
    if (!paperReady(classId, 'fx')) return null;
    const entry = PAPER_SETS[classId];
    return { url: entry.fx.image, image: entry.fx.image, meta: entry.fx.meta, key: entry.key };
}
