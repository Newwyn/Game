# ============================================================
# Xoá dấu ngôi sao mờ của Flow trên tấm hình động nền xanh 1200x896 (art/enemies/<art>/sprite/*.jpg)
#   uv run --no-project --with numpy --with pillow --with scipy python tools/flow_mark_sheet.py [<art> ...]
# Dấu = lớp trắng mờ a(x,y) phủ lên: C = a*255 + (1-a)*gốc.
#   1. Khuôn a: đo trên nền xanh (kênh đỏ của nền ~0 -> a = R/255) — lấy NHỎ NHẤT qua nhiều tấm (chỗ nào ở tấm nào là nền thì đo được)
#      lưu art/enemies/flow_mark_1200.npy, dùng lại cho mọi quái.
#   2. Mỗi tấm: dò vị trí dấu ±8px quanh chỗ chuẩn rồi trừ ngược gốc = (C - a*255) / (1 - a). Bản gốc sao lưu ở .team/backup_flow_mark/.
# ============================================================
import sys, os, glob, shutil
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPL = os.path.join(ROOT, 'art', 'enemies', 'flow_mark_1200.npy')
BACKUP = os.path.join(ROOT, '.team', 'backup_flow_mark')
BOX = 80          # khuôn 80x80, góc trên trái chuẩn ở (W-138, H-140)
X0, Y0 = 1200 - 138, 896 - 140
FIX = (755, 1059)   # (y, x) góc trên trái khuôn ở chỗ dấu chuẩn


def load(f):
    bk = os.path.join(BACKUP, os.path.relpath(f, ROOT).replace(os.sep, '__'))
    return np.asarray(Image.open(bk if os.path.exists(bk) else f).convert('RGB')).astype(np.float32), bk


def build_template(files):
    """Khuôn đo chuẩn từ tranh bản đồ (tools/remove_flow_mark.py, nền phẳng) -> phóng theo cỡ khớp nhất trên các tấm quái."""
    sys.path.insert(0, os.path.join(ROOT, 'tools'))
    import remove_flow_mark as R
    base, _ = R.template()
    best = None
    for sc in (0.9, 1.0, 1.1, 1.17, 1.25, 1.35):
        n = max(8, round(base.shape[0] * sc))
        t = np.asarray(Image.fromarray((base * 255).astype(np.uint8)).resize((n, n), Image.LANCZOS)).astype(np.float32) / 255
        pad = np.zeros((BOX, BOX), np.float32); o = (BOX - n) // 2; pad[o:o + n, o:o + n] = t[:BOX - o, :BOX - o]
        tot = sum(find(load(f)[0], pad)[0] for f in files)
        print('  cỡ', sc, round(tot, 1))
        if best is None or tot > best[0]:
            best = (tot, pad)
    return best[1]


def find(a, tpl):
    lum = a.mean(-1)
    best, pos = -1e9, (Y0, X0)
    for dy in range(-8, 9):
        for dx in range(-8, 9):
            y, x = Y0 + dy, X0 + dx
            p = lum[y:y + BOX, x:x + BOX]
            s = ((p - ndi.median_filter(p, 11)) * tpl).sum() / (tpl.sum() + 1e-6)
            if s > best:
                best, pos = s, (y, x)
    return best, pos


def clean(f, tpl):
    a, bk = load(f)
    if a.shape[:2] != (896, 1200):
        return 'bỏ qua (cỡ khác)'
    score, (y, x) = find(a, tpl)
    # Flow luôn đóng dấu ở cùng 1 chỗ trên tấm 1200x896 (đo trên Goblin: 1059,755); dấu đè lên hình nhân vật thì điểm dò thấp
    #   -> vẫn xoá ở chỗ chuẩn, chỉ tin vị trí dò được khi điểm cao và gần chỗ chuẩn
    if score < 2 or abs(x - FIX[1]) > 3 or abs(y - FIX[0]) > 3:
        y, x = FIX
    k = tpl[..., None]
    p = a[y:y + BOX, x:x + BOX]
    a[y:y + BOX, x:x + BOX] = np.clip((p - k * 255) / np.maximum(1 - k, 0.3), 0, 255)
    if not os.path.exists(bk):
        shutil.copy2(f, bk)
    Image.fromarray(a.astype(np.uint8)).save(f, quality=95)
    return f'xoá dấu ({score:.1f}) ở {x},{y}'


if __name__ == '__main__':
    os.makedirs(BACKUP, exist_ok=True)
    arts = sys.argv[1:] or [os.path.basename(d) for d in glob.glob(os.path.join(ROOT, 'art/enemies/*')) if os.path.isdir(d)]
    files = [f for a in arts for f in sorted(glob.glob(os.path.join(ROOT, 'art/enemies', a, 'sprite', 'sprite-*.jpg')))]
    if not os.path.exists(TPL):
        np.save(TPL, build_template(files))
    tpl = np.load(TPL)
    print('khuôn', round(float(tpl.max()), 2))
    for f in files:
        print(os.path.relpath(f, ROOT), clean(f, tpl))
