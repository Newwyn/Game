// ============================================================
// PAPER SETS — Bảng đăng ký bộ hình / hiệu ứng / bản đồ kiểu giấy theo classId
// ============================================================
// Mọi tệp giấy đều nạp tuỳ chọn qua import.meta.glob: thiếu tệp hoặc ảnh lỗi tải -> tự lùi về bản chuẩn, không văng lỗi.
// Thêm nhân vật giấy mới chỉ cần thêm 1 mục vào PAPER_SETS (kèm tệp tương ứng nếu có).
import { settings } from '../../core/settings.js';
import { isTextureFailed } from '../../core/textures.js';

const SPRITE_IMG = import.meta.glob('../../assets/sprites/*_paper_sprite.webp', { eager: true, import: 'default' });
const SPRITE_META = import.meta.glob('./*PaperSprite.json', { eager: true, import: 'default' });
const FX_IMG = import.meta.glob('../../assets/sprites/*_paper_fx.webp', { eager: true, import: 'default' });
const FX_META = import.meta.glob('../../vfx/*PaperFx.json', { eager: true, import: 'default' });
const OW_IMG = import.meta.glob('../../assets/overworld/ow_*_paper.webp', { eager: true, import: 'default' });
const OW_META = import.meta.glob('../../assets/overworld/ow_*_paper.json', { eager: true, import: 'default' });

const hasSpriteMeta = (m) => !!(m?.frames && m?.size && (m.frames.idle1 || Object.keys(m.frames).length));
const hasFxMeta = (m, groups) => !!(m?.size && m?.groups && (!groups?.length || groups.every(k => m.groups[k]?.frames?.length)));
const hasOwMeta = (m) => !!(m && m.cw > 0 && m.ch > 0 && (m.cols ?? 3) > 0 && (m.rows ?? 4) > 0);

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
        overworld: {
            sheet: 'ow_rok',
            image: OW_IMG['../../assets/overworld/ow_rok_paper.webp'] ?? null,
            meta: OW_META['../../assets/overworld/ow_rok_paper.json'] ?? null,
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
        overworld: null,
    },
};

const OVERWORLD_CLASS_BY_SHEET = Object.fromEntries(
    Object.entries(PAPER_SETS)
        .filter(([, entry]) => entry.overworld?.sheet)
        .map(([classId, entry]) => [entry.overworld.sheet, classId]),
);

/** Kiểm tra bộ giấy của `classId` đã bật và sẵn sàng dùng cho `kind` ('sprite' | 'fx' | 'overworld') chưa */
export function paperReady(classId, kind = 'sprite') {
    if (!settings.paperHeroes) return false;
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
    if (kind === 'overworld') {
        const ow = entry.overworld;
        return !!(ow?.image && hasOwMeta(ow.meta) && !isTextureFailed(ow.image));
    }
    return false;
}

/** Trả về config sprite giấy cho `classId` khi sẵn sàng, ngược lại trả `fallback` (mặc định là `baseSprite`) */
export function paperSpriteFor(classId, baseSprite, fallback = baseSprite) {
    const stdBase = baseSprite?.fallbackSprite ?? baseSprite;
    if (!stdBase || !paperReady(classId, 'sprite')) return fallback;
    const { image, meta } = PAPER_SETS[classId].sprite;
    return { ...stdBase, image, meta, paper: true, fallbackSprite: fallback };
}

/** Trả về { key, image, meta } để cắt chân dung / ảnh thu nhỏ kiểu giấy khi sẵn sàng, null nếu không dùng */
export function paperPortraitFor(classId) {
    if (!paperReady(classId, 'sprite')) return null;
    const entry = PAPER_SETS[classId];
    return { key: entry.key, image: entry.sprite.image, meta: entry.sprite.meta };
}

/** Trả về { url, image, meta, key } cho atlas hiệu ứng giấy của `classId` khi sẵn sàng, null nếu không dùng */
export function paperFxFor(classId) {
    if (!paperReady(classId, 'fx')) return null;
    const entry = PAPER_SETS[classId];
    return { url: entry.fx.image, image: entry.fx.image, meta: entry.fx.meta, key: entry.key };
}

/** Trả về { url, meta } cho tờ overworld giấy tương ứng `sheetName` khi sẵn sàng, null nếu không dùng */
export function paperOverworldFor(sheetName) {
    const classId = OVERWORLD_CLASS_BY_SHEET[sheetName];
    if (!classId || !paperReady(classId, 'overworld')) return null;
    const ow = PAPER_SETS[classId].overworld;
    return { url: ow.image, meta: ow.meta };
}
