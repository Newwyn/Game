"""
Gom các mảnh từ nhiều "bảng mảnh rời" (nền trắng) thành MỘT atlas nền trong suốt cho nhân vật 2D cutout.

Chạy:
    python tools/build_atlas.py art/assassin2/atlas_spec.json

Spec (JSON):
{
  "out": "src/assets/sprites/assassin2_atlas.png",     // atlas đầu ra
  "meta": "src/characters/cutout/assassin2Atlas.json",  // toạ độ mảnh trong atlas
  "width": 2048,
  "sheets": { "body": {"file": "art/assassin2/02-body-parts.png", "scale": 1.0}, ... },
  "parts":  { "head": {"sheet": "body", "comps": [1]}, ... }
}
`comps` = số thứ tự mảnh như trong ảnh .preview.png của tools/slice_parts.py (có thể gộp nhiều số).
Kết quả meta: { tên: { rect:[x,y,w,h] (trong atlas), src:[x,y] (góc trên-trái trong ảnh gốc), scale } }
=> điểm (sx, sy) trong ảnh gốc nằm ở atlas: rect.x + (sx - src.x) * scale.
"""
import json
import sys

import numpy as np
from scipy import ndimage
from PIL import Image

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from slice_parts import background_mask, components, MIN_AREA  # noqa: E402

PAD = 3


def load_sheet(path):
    img = Image.open(path).convert("RGB")
    rgb = np.asarray(img)
    bg = background_mask(rgb)
    from PIL import ImageFilter
    alpha = Image.fromarray(((~bg) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    a = np.asarray(alpha).astype(np.float32)
    a = np.clip((a - 40) * 255 / (215 - 40), 0, 255).astype(np.uint8)
    labels, comps = components(~bg)
    comps = [c for c in comps if c["area"] >= MIN_AREA]
    comps.sort(key=lambda c: (c["y"] // 80, c["x"]))
    return rgb, a, labels, comps


def main():
    spec_path = sys.argv[1]
    spec = json.load(open(spec_path))
    sheets = {k: (load_sheet(v["file"]), v.get("scale", 1.0)) for k, v in spec["sheets"].items()}

    crops = []
    for name, p in spec["parts"].items():
        (rgb, a, labels, comps), scale = sheets[p["sheet"]]
        ids = [comps[i - 1]["id"] for i in p["comps"]]
        mask = np.isin(labels, ids)
        # nới mặt nạ 2px để giữ viền mềm
        mask = ndimage.binary_dilation(mask, iterations=2)
        ys, xs = np.nonzero(mask)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        alpha = np.where(mask[y0:y1, x0:x1], a[y0:y1, x0:x1], 0).astype(np.uint8)
        if p.get("holes"):  # đục lỗ: vùng trắng lớn nằm kín bên trong (vd lỗ giữa phi tiêu)
            sub = rgb[y0:y1, x0:x1].astype(int)
            white = (255 - sub).max(axis=2) <= 40
            lab, n = ndimage.label(white)
            for i in range(1, n + 1):
                region = lab == i
                if region.sum() > 300:
                    region = ndimage.binary_dilation(region, iterations=1)
                    alpha[region] = 0
        if p.get("erase"):  # xoá "núm da" ở đầu khớp sẽ bị mảnh khác che (tránh khớp lộ cục tròn như búp bê)
            sub = rgb[y0:y1, x0:x1].astype(int)
            R, G, B = sub[..., 0], sub[..., 1], sub[..., 2]
            skin = (R > 225) & (R - B > 45) & (B > 130) & (G > 165) & (R - G > 12) & (R - G < 75)
            skin &= mask[y0:y1, x0:x1]
            skin = ndimage.binary_opening(skin, iterations=2)
            lab, n = ndimage.label(skin)
            dark = sub.sum(axis=2) < 3 * 150
            for ex, ey in p["erase"]:
                px, py = ex - x0, ey - y0
                best, bd = 0, 1e9
                for i in range(1, n + 1):
                    ys, xs = np.nonzero(lab == i)
                    if len(xs) < 80:
                        continue
                    d = np.hypot(xs.mean() - px, ys.mean() - py)
                    if d < bd:
                        best, bd = i, d
                if not best or bd > 45:
                    print(f"  ! {name}: không thấy núm da gần {ex},{ey}")
                    continue
                region = lab == best
                # núm da + viền nâu bao quanh nó
                kill = ndimage.binary_dilation(region, iterations=2) | (ndimage.binary_dilation(region, iterations=7) & dark)
                alpha[kill] = 0
                # dọn các vệt viền mảnh còn sót quanh chỗ vừa xoá
                zone = ndimage.binary_dilation(region, iterations=14)
                solid = alpha > 100
                keep = ndimage.binary_dilation(ndimage.binary_opening(solid, iterations=4), iterations=1)
                alpha[zone & ~keep] = 0
        im = Image.fromarray(np.dstack([rgb[y0:y1, x0:x1], alpha]), "RGBA")
        if scale != 1.0:
            im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
        crops.append((name, im, [int(x0), int(y0)], scale))

    # Xếp kệ (shelf packing) theo chiều cao giảm dần
    W = spec.get("width", 2048)
    order = sorted(crops, key=lambda c: -c[1].height)
    x = y = shelf_h = 0
    placed = {}
    for name, im, src, scale in order:
        if x + im.width + PAD > W:
            x, y, shelf_h = 0, y + shelf_h + PAD, 0
        placed[name] = (x + PAD, y + PAD)
        x += im.width + PAD * 2
        shelf_h = max(shelf_h, im.height + PAD)
    H = y + shelf_h + PAD
    H = 1 << (H - 1).bit_length()  # luỹ thừa của 2 cho GPU

    atlas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    meta = {"atlasSize": [W, H], "parts": {}}
    for name, im, src, scale in crops:
        px, py = placed[name]
        atlas.paste(im, (px, py))
        meta["parts"][name] = {"rect": [px, py, im.width, im.height], "src": src, "scale": scale}
    # Kéo màu ra vùng trong suốt sát mép (tránh viền trắng khi lọc texture)
    arr = np.asarray(atlas).copy()
    transparent = arr[..., 3] == 0
    _, (iy, ix) = ndimage.distance_transform_edt(transparent, return_indices=True)
    for c in range(3):
        arr[..., c] = arr[..., c][iy, ix]
    Image.fromarray(arr, "RGBA").save(spec["out"], optimize=True)
    json.dump(meta, open(spec["meta"], "w"), indent=1)
    print(f"atlas {W}x{H} -> {spec['out']}  ({len(crops)} mảnh)")


if __name__ == "__main__":
    main()
