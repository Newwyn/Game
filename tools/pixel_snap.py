"""Ép tranh "kiểu pixel" do AI vẽ (nền xanh #00FF00) về ĐÚNG lưới điểm ảnh thật: pixel art sắc, ít màu, viền gọn.

    .team\\pyenv\\Scripts\\python.exe tools/pixel_snap.py <vào.png> <ra.png> [--block 6] [--colors 24] [--preview xem.png]

1. Tách nền xanh (độ "xanh trội" so với đỏ / lam) -> alpha 0/1 (pixel art không có mép mờ).
2. Thu nhỏ theo `block` (cỡ 1 ô pixel AI vẽ, ~6 điểm ảnh): mỗi ô lấy màu TRUNG VỊ của các điểm đặc (không nhoè như lọc thường);
   ô đặc < 50% -> trong suốt.
3. Gom màu cả tấm về `colors` màu (median cut) -> bảng màu chung cho mọi khung của tấm.
4. Ra PNG cỡ nhỏ (1 điểm = 1 ô pixel) — game phóng to bằng lọc NEAREST. --preview: bản phóng to ×block để xem.
Không tô / vẽ lại tranh: chỉ lấy mẫu + gom màu.
"""
import sys
import numpy as np
from PIL import Image


def convert(src, dst, block=5, colors=28, preview=None, outline=True, flatten=10, prescale=1.0):
    """Chế độ CHUYỂN tranh vẽ tay (không phải pixel) -> pixel art: tách nền xanh, thu nhỏ theo block bằng lọc vùng (BOX, có
    nhân alpha để mép không ám xanh), alpha >= 50% thành đặc, gom màu, thêm viền tối 1 ô quanh hình (màu = màu bên trong tối đi)."""
    src_im = Image.open(src).convert("RGB")
    if prescale != 1.0:   # đưa mọi tấm về cùng cỡ nhân vật (= "scale" trong sprite_spec.json của tranh gốc) TRƯỚC khi chia ô
        src_im = src_im.resize((round(src_im.width * prescale), round(src_im.height * prescale)), Image.LANCZOS)
    raw = np.asarray(src_im)
    im = raw.astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    spill = g - np.maximum(r, b)
    if flatten:
        # làm phẳng mảng màu (mean shift: gom vùng màu gần nhau thành 1 mảng, giữ đường viền) -> bớt lấm tấm khi thu nhỏ
        import cv2
        im = cv2.pyrMeanShiftFiltering(raw, flatten, 28).astype(np.float32)
    alpha = np.clip(1 - (spill - 30) / 60, 0, 1) * ~((g > 150) & (spill > 90))       # nền xanh -> 0, mép -> mờ dần
    im[..., 1] = np.minimum(im[..., 1], np.maximum(im[..., 0], im[..., 2]) + 20)      # khử ám xanh ở mép
    H, W = alpha.shape
    h, w = H // block, W // block
    pre = np.dstack([im * alpha[..., None], alpha])[: h * block, : w * block]
    small = pre.reshape(h, block, w, block, 4).mean(axis=(1, 3))
    a = small[..., 3]
    rgb = np.where(a[..., None] > 1e-3, small[..., :3] / np.maximum(a[..., None], 1e-3), 0)
    solid = a >= 0.5
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = np.clip(rgb, 0, 255)
    out[..., 3] = solid * 255
    from PIL import ImageEnhance
    small_rgb = Image.fromarray(out[..., :3], "RGB")
    small_rgb = ImageEnhance.Contrast(ImageEnhance.Color(small_rgb).enhance(1.1)).enhance(1.05)   # màu đậm, tương phản rõ (kiểu pixel art)
    q = small_rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out[..., :3] = np.asarray(q)
    if outline:
        # viền tối 1 ô BÊN NGOÀI hình (kiểu pixel art cổ điển): ô trống sát hình -> màu ô hình bên cạnh tối đi 70%
        s = solid
        ring = np.zeros_like(s)
        col = np.zeros((h, w, 3), np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sh = np.roll(np.roll(s, dy, 0), dx, 1)
            add = sh & ~s & ~ring
            col[add] = np.roll(np.roll(out[..., :3], dy, 0), dx, 1)[add]
            ring |= add
        out[ring, :3] = (col[ring] * 0.3).astype(np.uint8)
        out[ring, 3] = 255
    res = Image.fromarray(out, "RGBA")
    res.save(dst)
    if preview:
        res.resize((w * block, h * block), Image.NEAREST).save(preview)
    print(f"{src} -> {dst} {w}x{h} (chuyển, block {block}, {colors} màu)")


def snap(src, dst, block=6, colors=24, preview=None):
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.int16)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    bg = (g - np.maximum(r, b) > 60) & (g > 150)        # nền xanh thuần
    H, W = bg.shape
    h, w = H // block, W // block
    out = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        ys = slice(y * block, (y + 1) * block)
        for x in range(w):
            xs = slice(x * block, (x + 1) * block)
            solid = ~bg[ys, xs]
            if solid.mean() < 0.5:
                continue
            px = im[ys, xs][solid]
            out[y, x, :3] = np.median(px, axis=0)
            out[y, x, 3] = 255
    # gom màu (chỉ điểm đặc)
    rgb = Image.fromarray(out[..., :3], "RGB")
    q = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out[..., :3] = np.asarray(q)
    res = Image.fromarray(out, "RGBA")
    res.save(dst)
    if preview:
        res.resize((w * block, h * block), Image.NEAREST).save(preview)
    print(f"{src} -> {dst} {w}x{h} (block {block}, {colors} màu)")


if __name__ == "__main__":
    a = sys.argv[1:]
    opt = {"block": 6, "colors": 24, "preview": None}
    pos = []
    i = 0
    mode_convert = "--convert" in a
    a = [x for x in a if x != "--convert"]
    while i < len(a):
        if a[i].startswith("--"):
            k = a[i][2:]
            opt[k] = a[i + 1] if k == "preview" else int(a[i + 1])
            i += 2
        else:
            pos.append(a[i]); i += 1
    if mode_convert:
        convert(pos[0], pos[1], opt["block"], opt["colors"], opt["preview"], flatten=opt.get("flatten", 10), prescale=opt.get("prescale", 1000) / 1000)
    else:
        snap(pos[0], pos[1], opt["block"], opt["colors"], opt["preview"])
