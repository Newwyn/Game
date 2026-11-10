# ============================================================
# XOÁ DẤU MỜ CỦA FLOW (ngôi sao 4 cánh trắng mờ ở góc phải dưới tranh Flow / Veo)
#   uv run --no-project --with numpy --with pillow --with scipy --with opencv-python python tools/remove_flow_mark.py [--dry]
# Cách làm (không vẽ đè, không làm nhoè):
#   1. Lấy KHUÔN độ mờ a(x, y) của dấu từ 1 tranh có nền phẳng (capital_market.webp): a = (ảnh - nền) / (255 - nền)
#   2. Với mỗi tranh cùng cỡ: tìm dấu gần vị trí chuẩn (khớp khuôn), rồi trừ ngược: gốc = (ảnh - a·255) / (1 - a)
#   Tranh gốc sao lưu ở .team/backup_flow_mark/ trước khi ghi đè.
# ============================================================
import sys, glob, os, shutil
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, 'src/assets/world/capital_market.webp')
BACKUP = os.path.join(ROOT, '.team', 'backup_flow_mark')


def template():
    """Khuôn độ mờ của ngôi sao (vùng 56x56 cách góc phải dưới ~70-126 px), nền ước lượng bằng trung vị rộng."""
    bk = os.path.join(BACKUP, os.path.relpath(REF, ROOT).replace(os.sep, '__'))
    im = np.asarray(Image.open(bk if os.path.exists(bk) else REF).convert('RGB')).astype(np.float32)   # khuôn lấy từ bản GỐC
    H, W = im.shape[:2]
    y0, x0 = H - 126, W - 126
    big = im[y0 - 30:y0 + 86, x0 - 30:x0 + 86]
    bg = ndi.median_filter(big, size=(51, 51, 1))[30:86, 30:86]
    c = im[y0:y0 + 56, x0:x0 + 56]
    a = np.clip(((c - bg) / np.maximum(255 - bg, 1)).mean(-1), 0, 1)
    lab, n = ndi.label(a > 0.08)                     # giữ đúng khối ngôi sao (bỏ vân giấy lẫn vào)
    if n:
        sizes = ndi.sum(np.ones_like(a), lab, range(1, n + 1))
        keep = ndi.binary_dilation(lab == (int(np.argmax(sizes)) + 1), iterations=2)
        a = np.where(keep, a, 0)
    return ndi.gaussian_filter(a, 0.6), (y0, x0)


def find(img, tpl, at):
    """Dò quanh vị trí chuẩn ±6px: điểm khớp khuôn tốt nhất (độ sáng thêm vào giống khuôn nhất)."""
    h, w = tpl.shape
    best, pos = -1e9, None
    lum = img.mean(-1)
    for dy in range(-6, 7):
        for dx in range(-6, 7):
            y, x = at[0] + dy, at[1] + dx
            if y < 0 or x < 0 or y + h > img.shape[0] or x + w > img.shape[1]:
                continue
            p = lum[y:y + h, x:x + w]
            base = ndi.median_filter(p, size=15)
            s = ((p - base) * tpl).sum() / (tpl.sum() + 1e-6)
            if s > best:
                best, pos = s, (y, x)
    return best, pos


def main(dry=False):
    tpl, at = template()
    print('khuôn', tpl.shape, 'ở', at, 'độ mờ lớn nhất', round(float(tpl.max()), 2))
    files = sorted(glob.glob(os.path.join(ROOT, 'src/assets/maps/*.webp')) + glob.glob(os.path.join(ROOT, 'src/assets/world/*.webp')))
    os.makedirs(BACKUP, exist_ok=True)
    for f in files:
        name0 = os.path.relpath(f, ROOT)
        bk = os.path.join(BACKUP, name0.replace(os.sep, '__'))
        im = Image.open(bk if os.path.exists(bk) else f)   # chạy lại: luôn làm từ bản gốc đã sao lưu
        rgb = np.asarray(im.convert('RGB')).astype(np.float32)
        if rgb.shape[:2] != (768, 1376):
            continue
        score, pos = find(rgb, tpl, at)
        name = os.path.relpath(f, ROOT)
        if score < 3.5:   # không thấy dấu
            print(f'  -  {name}: không có dấu ({score:.1f})')
            continue
        y, x = pos; h, w = tpl.shape
        a = tpl[..., None]
        patch = rgb[y:y + h, x:x + w]
        fixed = (patch - a * 255) / np.maximum(1 - a, 0.25)
        # chỗ còn lệch nhẹ (nén ảnh): hoà với trung vị xung quanh theo độ mờ
        med = ndi.median_filter(rgb[y - 8:y + h + 8, x - 8:x + w + 8], size=(13, 13, 1))[8:-8, 8:-8]
        k = np.clip((a - 0.25) / 0.25, 0, 1)
        fixed = fixed * (1 - k) + med * k
        rgb[y:y + h, x:x + w] = np.clip(fixed, 0, 255)
        # viền ngôi sao (độ mờ thấp, dễ lệch -> thành nét tối): lấp liền bằng màu xung quanh (inpaint)
        ring = ndi.binary_dilation(tpl > 0.01, iterations=2) & ~ndi.binary_erosion(tpl > 0.12, iterations=1)
        mask = np.zeros(rgb.shape[:2], np.uint8); mask[y:y + h, x:x + w] = ring.astype(np.uint8) * 255
        rgb = cv2.inpaint(np.clip(rgb, 0, 255).astype(np.uint8), mask, 4, cv2.INPAINT_TELEA).astype(np.float32)
        print(f'  ✓  {name}: xoá dấu ({score:.1f}) ở {pos}')
        if dry:
            continue
        dst = os.path.join(BACKUP, name.replace(os.sep, '__'))
        if not os.path.exists(dst):
            shutil.copy2(f, dst)
        out = Image.fromarray(rgb.astype(np.uint8), 'RGB')
        out.save(f, 'WEBP', quality=90)


def find_wide(img, tpl):
    """Dò dấu trên tấm hình động nhân vật 1536x1024 (vị trí khác tranh 1376x768)."""
    h, w = tpl.shape
    H, W = img.shape[:2]
    lum = img.mean(-1)
    best, pos = -1e9, None
    # dấu nằm quanh (930, 1378) trên tấm 1536x1024 — dò hẹp ±18px (dò rộng dễ nhầm vào phần trắng của nhân vật)
    cy, cx = round(930 * H / 1024), round(1378 * W / 1536)
    for y in range(cy - 18, cy + 19):
        for x in range(cx - 18, cx + 19):
            p = lum[y:y + h, x:x + w]
            s = ((p - np.median(p)) * tpl).sum() / (tpl.sum() + 1e-6)
            if s > best:
                best, pos = s, (y, x)
    return best, pos


def clean(rgb, tpl, pos):
    y, x = pos; h, w = tpl.shape
    a = tpl[..., None]
    patch = rgb[y:y + h, x:x + w]
    rgb[y:y + h, x:x + w] = np.clip((patch - a * 255) / np.maximum(1 - a, 0.25), 0, 255)
    ring = ndi.binary_dilation(tpl > 0.01, iterations=2) & ~ndi.binary_erosion(tpl > 0.12, iterations=1)
    mask = np.zeros(rgb.shape[:2], np.uint8); mask[y:y + h, x:x + w] = ring.astype(np.uint8) * 255
    return cv2.inpaint(rgb.astype(np.uint8), mask, 4, cv2.INPAINT_TELEA)


def sheets(dry=False):
    """Tấm hình động nhân vật bậc S / SS (art/<tên>/sprite_s|sprite_ss/*.png) — xoá dấu ở TẤM GỐC rồi đóng gói lại (sprite_pack.py)."""
    tpl, _ = template()
    fs = sorted(set(glob.glob(os.path.join(ROOT, 'art/*/sprite_s/*.png')) + glob.glob(os.path.join(ROOT, 'art/*/sprite_ss/*.png'))))
    n = 0
    for f in fs:
        name = os.path.relpath(f, ROOT)
        bk = os.path.join(BACKUP, name.replace(os.sep, '__'))
        src = Image.open(bk if os.path.exists(bk) else f)
        alpha = src.getchannel('A') if src.mode == 'RGBA' else None
        rgb = np.asarray(src.convert('RGB')).astype(np.float32)
        score, pos = find_wide(rgb, tpl)
        H, W = rgb.shape[:2]
        edge = abs(pos[0] - round(930 * H / 1024)) >= 17 or abs(pos[1] - round(1378 * W / 1536)) >= 17
        if score < 6 or edge:   # không có dấu (điểm tốt nhất nằm sát mép vùng dò = chỉ là nhiễu)
            continue
        n += 1
        if dry:
            print(f'  ✓  {name}: {score:.1f} {pos}'); continue
        if not os.path.exists(bk):
            shutil.copy2(f, bk)
        out = Image.fromarray(clean(rgb, tpl, pos), 'RGB')
        if alpha is not None:
            out.putalpha(alpha)
        out.save(f)
    print('tấm có dấu:', n, '/', len(fs))


if __name__ == '__main__':
    if '--sheets' in sys.argv:
        sheets('--dry' in sys.argv)
    else:
        main('--dry' in sys.argv)
