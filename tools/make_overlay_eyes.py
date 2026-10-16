"""
Tạo các mảnh MẮT BIỂU CẢM khớp sẵn lên đầu nhân vật (cho nhân vật ghép từ tấm bộ phận).
Tấm mắt (03-hands-eyes) vẽ mắt to kèm mảng da; script thu nhỏ, căn theo con ngươi, đổi màu da cho khớp đầu,
rồi chỉ giữ phần nằm trong vùng mắt trên đầu (không đè lên tóc). Ra mỗi biểu cảm 1 file PNG nhỏ.

Chạy:  python tools/make_overlay_eyes.py art/nerissa/eyes_spec.json
Spec: { "head": "...02-body-parts.png", "sheet": "...03-hands-eyes.png", "out": "art/nerissa/gen",
        "headIris": [x,y], "sheetIris": [x,y] (con ngươi mắt mở trên tấm), "openBox": [x0,y0,x1,y1],
        "scale": s, "region": [[x,y]...] (vùng mắt trên đầu), "irisEllipse": [cx,cy,rx,ry],
        "eyes": { tên: [x0,y0,x1,y1] } }   -> out/eye-<tên>.png ; tâm (pivot) = headIris trong toạ độ file: ghi ra JSON
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

spec = json.load(open(sys.argv[1]))
head = np.array(Image.open(spec["head"]).convert("RGBA")).astype(np.float32)
sheet = Image.open(spec["sheet"]).convert("RGBA")
s = spec["scale"]
hx, hy = spec["headIris"]
ox0, oy0 = spec["openBox"][:2]
ix, iy = spec["sheetIris"]
offx, offy = ix - ox0, iy - oy0          # vị trí con ngươi so với góc hộp (dùng chung cho mọi biểu cảm)
H, W = head.shape[:2]
# vùng giữ lại trên đầu
reg = Image.new("L", (W, H), 0)
ImageDraw.Draw(reg).polygon([tuple(p) for p in spec["region"]], fill=255)
reg = np.array(reg.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
r, g, b = head[..., 0], head[..., 1], head[..., 2]
cx, cy, rx, ry = spec["irisEllipse"]
yy, xx = np.mgrid[0:H, 0:W]
in_eye = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
hair = (b > r + 25) & (b > 110) & ~in_eye
reg *= ~hair
# màu da của đầu quanh mắt
skin_h = (r > 200) & (g > 150) & (r - b > 25) & (reg > 0.5) & ~in_eye
skin_col = np.median(head[skin_h][:, :3], axis=0)
meta = {}
for name, box in spec["eyes"].items():
    x0, y0, x1, y1 = box
    p = np.array(sheet.crop(box)).astype(np.float32)
    pr, pg, pb = p[..., 0], p[..., 1], p[..., 2]
    sk = (pr > 200) & (pg > 150) & (pr - pb > 25) & (p[..., 3] > 200)
    shift = skin_col - np.median(p[sk][:, :3], axis=0)
    p[sk, :3] = np.clip(p[sk, :3] + shift, 0, 255)
    # bỏ viền đen bao quanh mảng da của tấm mắt: co alpha vào trong `erode` px rồi làm mềm mép
    from scipy import ndimage
    er = spec.get("erode", 10)
    core = ndimage.binary_erosion(p[..., 3] > 128, iterations=er)
    soft = ndimage.gaussian_filter(core.astype(np.float32), er / 3)
    p[..., 3] = np.minimum(p[..., 3], np.clip(soft * 1.6, 0, 1) * 255)
    pim = Image.fromarray(p.astype(np.uint8), "RGBA")
    pim = pim.resize((max(1, round(pim.width * s)), max(1, round(pim.height * s))), Image.LANCZOS)
    # đặt lên khung đầu: con ngươi trùng headIris
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px, py = round(hx - offx * s), round(hy - offy * s)
    canvas.alpha_composite(pim, (px, py))
    c = np.array(canvas).astype(np.float32)
    c[..., 3] *= reg
    c = c.astype(np.uint8)
    ys, xs = np.nonzero(c[..., 3] > 4)
    bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    out = f'{spec["out"]}/eye-{name}.png'
    Image.fromarray(c[by0:by1, bx0:bx1], "RGBA").save(out)
    meta[name] = {"file": out, "pivot": [int(hx - bx0), int(hy - by0)], "box": [0, 0, int(bx1 - bx0), int(by1 - by0)]}
    print(name, out, meta[name]["pivot"], "skin shift", shift.round(1))
json.dump(meta, open(f'{spec["out"]}/eyes_meta.json', "w"), indent=1)
