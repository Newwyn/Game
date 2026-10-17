"""
Tô lại ĐẦU KHỚP TRÒN của tấm bộ phận (vẽ màu da/ nâu nhạt như mặt cắt) thành màu vải xung quanh,
để khi gắn xương không lộ các "lỗ tròn" màu da ở vai / khuỷu / hông / gối.

Chạy:  python tools/recolor_caps.py art/elarion/caps_spec.json
Spec: { "sheet": "...png", "out": "...png",
        "exclude": [[x0,y0,x1,y1], ...],            // vùng không đụng (đầu, cổ thật...)
        "regions": [ { "box": [x0,y0,x1,y1], "color": [r,g,b],   // màu vải thay vào
                       "mode": "tan" | "light" | "light2", "maxY"?: y } ] }  // tan: đầu khớp nâu; light: đầu khớp sáng (chỉ trên maxY)
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def main():
    spec = json.load(open(sys.argv[1]))
    a = np.asarray(Image.open(spec["sheet"]).convert("RGBA")).astype(np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    excl = np.zeros(al.shape, bool)
    for x0, y0, x1, y1 in spec.get("exclude", []):
        excl[y0:y1, x0:x1] = True
    out = a.copy()
    yy = np.arange(al.shape[0])[:, None]
    for reg in spec["regions"]:
        x0, y0, x1, y1 = reg["box"]
        box = np.zeros(al.shape, bool); box[y0:y1, x0:x1] = True
        if reg.get("mode", "tan") == "tan":
            m = (r > 170) & (g > 110) & (b > 70) & (r - b > 55) & (r - g > 28) & (r - g < 85)
        elif reg["mode"] == "light":
            m = (r > 200) & (g > 165) & (b > 100) & (r - b > 45)
        else:   # light2: mọi màu da / nâu sáng (hộp nhỏ ôm sát đầu khớp)
            m = (r > 180) & (g > 120) & (b > 70) & (r - b > 45)
        if reg.get("maxY"):
            m &= yy < reg["maxY"]
        m &= box & ~excl & (al > 100)
        m = ndimage.binary_opening(m, iterations=1)
        lab, n = ndimage.label(m)
        if n:
            sz = ndimage.sum(m, lab, range(1, n + 1))
            m = np.isin(lab, np.nonzero(sz > reg.get("minArea", 250))[0] + 1)
        m = ndimage.binary_closing(m, iterations=2) & box
        if not m.any():
            continue
        lum = 0.3 * r + 0.59 * g + 0.11 * b
        mean = lum[m].mean()
        col = np.array(reg["color"], np.float32)
        shade = np.clip(lum / mean, 0.55, 1.35)[..., None]
        new = np.clip(col * shade, 0, 255)
        # mép khớp: trộn mềm 2px (pixel lẫn màu da / viền)
        soft = ndimage.gaussian_filter(m.astype(np.float32), 1.0)
        soft = np.where(m, 1.0, soft)[..., None] * box[..., None]
        out[..., :3] = out[..., :3] * (1 - soft) + new * soft
    Image.fromarray(out.astype(np.uint8), "RGBA").save(spec["out"])
    print("->", spec["out"])


if __name__ == "__main__":
    main()
