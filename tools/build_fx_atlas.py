"""
Gom hiệu ứng (VFX) từ các tấm hình thành 1 atlas nền trong suốt.
Chạy:  python tools/build_fx_atlas.py art/ignar/fx_spec.json
Spec: { "out": "...png", "meta": "...json", "width": 2048,
        "sheets": { tên: {"file": "...", "scale": 0.5} },          // tấm PNG nền trong suốt, hoặc nền ĐEN (tự tách nền)
        "parts":  { tên: {"sheet": "...", "box": [x0,y0,x1,y1], "scale"?: s, "largest"?: true} } }
Nền đen -> alpha = độ sáng lớn nhất của pixel, màu được "gỡ đen" (lửa giữ độ rực, không bị viền đen).
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

PAD = 3


def load(path):
    im = Image.open(path)
    a = np.asarray(im.convert("RGBA")).astype(np.float32)
    if im.mode != "RGBA" or a[..., 3].min() > 250:
        # nền đen: alpha = kênh sáng nhất, màu = màu / alpha
        al = a[..., :3].max(-1) / 255.0
        al = np.clip((al - 0.06) / 0.94, 0, 1)
        rgb = np.where(al[..., None] > 0.01, a[..., :3] / np.maximum(al[..., None], 1e-3) * np.clip(al[..., None] + 0.0, 0, 1) / np.maximum(al[..., None], 1e-3), 0)
        rgb = np.clip(a[..., :3] / np.maximum(al[..., None], 0.05), 0, 255)
        a = np.dstack([rgb, al * 255])
    else:
        solid = a[..., 3] > 200
        if solid.any():
            _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
            for c in range(3):
                a[..., c] = np.where(solid, a[..., c], a[..., c][iy, ix])
    return a.astype(np.uint8)


def main():
    spec = json.load(open(sys.argv[1]))
    sheets = {k: (load(v["file"]), v.get("scale", 1.0)) for k, v in spec["sheets"].items()}
    crops = []
    for name, p in spec["parts"].items():
        arr, sc = sheets[p["sheet"]]
        x0, y0, x1, y1 = p["box"]
        sub = arr[y0:y1, x0:x1].copy()
        if p.get("largest"):   # chỉ giữ khối liền lớn nhất (bỏ mẩu hình bên cạnh lọt vào hộp)
            lab, n = ndimage.label(ndimage.binary_dilation(sub[..., 3] > 20, iterations=3))
            if n > 1:
                keep = lab == (np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))) + 1)
                sub[..., 3] = np.where(keep, sub[..., 3], 0)
        im = Image.fromarray(sub, "RGBA")
        s = p.get("scale", sc)
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        crops.append((name, im))
    W = spec.get("width", 2048)
    x = y = shelf = 0
    placed = {}
    for name, im in sorted(crops, key=lambda c: -c[1].height):
        if x + im.width + PAD > W:
            x, y, shelf = 0, y + shelf + PAD, 0
        placed[name] = (x + PAD, y + PAD)
        x += im.width + PAD * 2
        shelf = max(shelf, im.height + PAD)
    H = 1 << (y + shelf + PAD - 1).bit_length()
    atlas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    meta = {"atlasSize": [W, H], "parts": {}}
    for name, im in crops:
        px, py = placed[name]
        atlas.paste(im, (px, py))
        meta["parts"][name] = {"rect": [px, py, im.width, im.height]}
    arr = np.asarray(atlas).copy()
    tr = arr[..., 3] == 0
    _, (iy, ix) = ndimage.distance_transform_edt(tr, return_indices=True)
    for c in range(3):
        arr[..., c] = arr[..., c][iy, ix]
    Image.fromarray(arr, "RGBA").save(spec["out"], optimize=True)
    json.dump(meta, open(spec["meta"], "w"), indent=1)
    print(f"fx atlas {W}x{H} -> {spec['out']} ({len(crops)} hình)")


if __name__ == "__main__":
    main()
