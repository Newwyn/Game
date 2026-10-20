// ============================================================
// Bản sao texture dùng chung ẢNH (atlas) — KHÔNG bắt tải lại ảnh lên GPU
// ------------------------------------------------------------
// Texture.clone() của three.js đánh dấu luôn ẢNH GỐC (source) "cần tải lại". Mỗi lần tạo bản sao (1 khung / 1 hình trong
// atlas) SAU KHI atlas đã lên GPU là tải lại NGUYÊN atlas (4096×1024 ≈ 16 MB + mipmap) -> giật khung, tụt FPS
// (đo trong trận 30s: 31 lần tải lại atlas 4096×1024 + 15 lần 4096×512).
// textureView(): bản sao có offset / repeat riêng, dùng chung ảnh + texture GPU, ảnh gốc giữ nguyên phiên bản (không tải lại).
// ============================================================
export function textureView(base) {
    const v = base.source.version;
    const t = base.clone();          // clone() -> copy() -> needsUpdate: tăng version bản sao (để gắn texture GPU) + version ảnh gốc
    t.source.version = v;            // trả lại phiên bản ảnh gốc: ảnh đã lên GPU thì không tải lại
    return t;
}
