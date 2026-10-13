"""
Tách "bảng mảnh rời" (parts sheet, nền trắng) thành atlas nền trong suốt cho nhân vật 2D cutout.

Chạy:
    python tools/slice_parts.py art/assassin/parts_sheet.png src/assets/sprites/assassin_parts.png

Kết quả:
  - <output>.png          : atlas nền trong suốt (giữ nguyên vị trí các mảnh như ảnh gốc)
  - <output>.preview.png  : ảnh đánh số từng mảnh để đặt tên
  - in ra danh sách mảnh: số thứ tự, khung [x, y, w, h], diện tích
Sau đó khai báo các mảnh trong src/characters/cutout/<tên>Rig.js (rect + pivot + pos + z).
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

WHITE_TOL = 28        # độ lệch tối đa so với màu trắng để coi là nền
MIN_AREA = 400        # bỏ các đốm nhỏ hơn (pixel)
PAD = 2


def background_mask(rgb):
    """Nền = vùng gần trắng NỐI LIỀN với mép ảnh (giữ lại phần trắng bên trong nhân vật, vd lòng trắng mắt)."""
    h, w, _ = rgb.shape
    near_white = (255 - rgb.astype(int)).max(axis=2) <= WHITE_TOL
    try:
        from scipy import ndimage
        lab, _ = ndimage.label(near_white)
        edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
        edge = edge[edge > 0]
        return np.isin(lab, edge)
    except ImportError:
        pass
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near_white[y, x] and not bg[y, x]:
                bg[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_white[y, x] and not bg[y, x]:
                bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near_white[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    return bg


def components(fg):
    try:  # nhanh hơn nhiều nếu có scipy
        from scipy import ndimage
        labels, n = ndimage.label(fg, structure=np.ones((3, 3)))
        comps = []
        for i, sl in enumerate(ndimage.find_objects(labels), 1):
            ys, xs = sl
            comps.append({"id": i, "x": xs.start, "y": ys.start, "w": xs.stop - xs.start,
                          "h": ys.stop - ys.start, "area": int((labels[sl] == i).sum())})
        return labels, comps
    except ImportError:
        pass
    h, w = fg.shape
    labels = np.zeros((h, w), np.int32)
    comps = []
    cur = 0
    for y0 in range(h):
        for x0 in range(w):
            if not fg[y0, x0] or labels[y0, x0]:
                continue
            cur += 1
            labels[y0, x0] = cur
            q = deque([(y0, x0)])
            xs, ys, n = [x0, x0], [y0, y0], 0
            while q:
                y, x = q.popleft(); n += 1
                xs[0] = min(xs[0], x); xs[1] = max(xs[1], x)
                ys[0] = min(ys[0], y); ys[1] = max(ys[1], y)
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and not labels[ny, nx]:
                            labels[ny, nx] = cur; q.append((ny, nx))
            comps.append({"id": cur, "x": xs[0], "y": ys[0], "w": xs[1] - xs[0] + 1, "h": ys[1] - ys[0] + 1, "area": n})
    return labels, comps


def main():
    src, dst = sys.argv[1], sys.argv[2]
    img = Image.open(src).convert("RGB")
    rgb = np.asarray(img)
    bg = background_mask(rgb)

    # Alpha mềm ở mép: làm mờ nhẹ mặt nạ rồi cắt ngưỡng
    alpha = Image.fromarray(((~bg) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    a = np.asarray(alpha).astype(np.float32)
    a = np.clip((a - 40) * 255 / (215 - 40), 0, 255).astype(np.uint8)
    rgba = np.dstack([rgb, a])
    Image.fromarray(rgba, "RGBA").save(dst)

    _, comps = components(~bg)
    comps = [c for c in comps if c["area"] >= MIN_AREA]
    comps.sort(key=lambda c: (c["y"] // 80, c["x"]))

    preview = img.copy()
    d = ImageDraw.Draw(preview)
    print(f"atlasSize: [{img.width}, {img.height}]")
    for i, c in enumerate(comps, 1):
        x, y, w, h = c["x"] - PAD, c["y"] - PAD, c["w"] + PAD * 2, c["h"] + PAD * 2
        d.rectangle([x, y, x + w, y + h], outline=(255, 0, 0), width=2)
        d.text((x + 3, y + 3), str(i), fill=(255, 0, 0))
        print(f"{i:2d}: rect [{x}, {y}, {w}, {h}]  area {c['area']}")
    preview.save(dst.rsplit(".", 1)[0] + ".preview.png")


if __name__ == "__main__":
    main()
