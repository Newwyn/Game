// ============================================================
// TRANG PHỤC ANH HÙNG (S / SS / SSS / Giấy) — dùng chung cho server & test
// ============================================================
// Danh sách nhân vật có bộ hình giấy — phải khớp với PAPER_SETS trong src/characters/sprite/paperSets.js
const PAPER_SKIN_CLASSES = new Set(['warrior', 'mage']);
const SKIN_RANK = { s: 1, ss: 2, sss: 3 };   // tranh bậc: S (mọi bậc) · SS (từ bậc SS) · SSS (từ bậc SSS)

/** Danh sách trang phục chọn được cho nhân vật `classId` ở bậc `rank` */
function skinsFor(classId, rank = 0) {
    // Tương thích ngược nếu caller cũ truyền skinsFor(rank) dạng số
    if (typeof classId === 'number') {
        rank = classId;
        classId = null;
    }
    return [
        's',
        ...(rank >= 2 ? ['ss'] : []),
        ...(rank >= 3 ? ['sss'] : []),
        ...(classId && PAPER_SKIN_CLASSES.has(classId) ? ['paper'] : []),
    ];
}

/** Chuẩn hoá trang phục hợp lệ cho thành viên trong trận -> { skin, skinRank } */
function resolveMemberSkin(classId, rank = 0, chosenSkin = null) {
    if (!chosenSkin || !skinsFor(classId, rank).includes(chosenSkin)) {
        return { skin: null, skinRank: null };
    }
    if (chosenSkin === 'paper') {
        return { skin: 'paper', skinRank: null };
    }
    return { skin: chosenSkin, skinRank: SKIN_RANK[chosenSkin] ?? null };
}

/** Áp dụng lựa chọn trang phục lên `member` trong trận */
function applySkinToMember(member, rank = 0, chosenSkin = null) {
    const resolved = resolveMemberSkin(member.classId, rank, chosenSkin);
    member.skin = resolved.skin;
    member.skinRank = resolved.skinRank;
    return member;
}

/** Chọn / bỏ trang phục cho anh hùng trong tiến trình `pr` */
function setSkinChoice(pr, classId, skin, classDefs) {
    const h = pr?.heroes?.[classId];
    if (!h || !pr?.owned?.includes(classId)) return null;
    if (skin !== null && !skinsFor(classId, h.rank).includes(skin)) {
        return {
            ok: false,
            text: skin === 'paper'
                ? 'Nhân vật này chưa có trang phục Giấy'
                : 'Chưa mở tranh này — đột phá lên bậc cao hơn',
        };
    }
    pr.skins ??= {};
    if (skin === null) delete pr.skins[classId];
    else pr.skins[classId] = skin;
    const name = classDefs?.[classId]?.name ?? classId;
    return {
        ok: true,
        text: skin === 'paper'
            ? `Đã đổi trang phục ${name} sang Giấy`
            : skin
                ? `Đã đổi trang phục ${name} sang bậc ${skin.toUpperCase()}`
                : 'Trang phục tự đổi theo bậc',
    };
}

module.exports = {
    PAPER_SKIN_CLASSES,
    SKIN_RANK,
    skinsFor,
    resolveMemberSkin,
    applySkinToMember,
    setSkinChoice,
};
