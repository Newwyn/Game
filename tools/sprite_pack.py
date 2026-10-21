"""Đóng gói các tấm sprite (tranh AI nền xanh) thành 1 atlas cho FrameSpriteView (src/characters/FrameSpriteView.js).

    python tools/sprite_pack.py art/ignar/sprite/sprite_spec.json [--debug ảnh_soi.png]

Chỉ làm các việc sau, KHÔNG tô / vẽ lại tranh:
  1. Tách nền xanh #00FF00 -> trong suốt. Viền 1-3px còn ám xanh thì lấy màu điểm đặc gần nhất bên trong (làm sạch mép do tách nền).
     "key" (cả spec hoặc từng tấm): "green" mặc định · "matte" giữ viền đen mảnh (Rok) · "jade" nhân vật mặc đồ xanh lá (Lyra:
     vải xanh không bị trong suốt / mất màu) · "alpha" tranh đã trong suốt sẵn.
  2. Tách từng khung theo vùng liền (mảnh rời như ngọc / xích gom về khung gần nhất), xếp trên -> dưới, trái -> phải.
     "groups" đặt tên khung: [["hurt", 4, "toe"], ["stun", 4, "toe"]] -> hurt1..4, stun1..4; phần tử thứ 4 (tuỳ chọn) =
     hệ số cỡ riêng của nhóm (VD hàng dưới AI vẽ to hơn hàng trên 8%: ["land", 4, "body", 0.92]).
  3. Co giãn cả tấm theo "scale" (đưa mọi tấm về cùng cỡ: đo bằng độ trùng dáng thủ thế / bề ngang tóc) × "atlasScale".
  4. Căn khung — mốc chân (gốc đứng) theo kiểu của nhóm:
       toe  : mũi giày trước (điểm phải nhất ở đáy) — chân trước đứng yên (đánh thường, kỹ năng, gục...)
       heel : gót giày sau (điểm trái nhất ở đáy) — chân sau đứng yên, chân trước bước tới (Hỏa Chưởng)
       body : giữa đầu — chạy, nhảy, gồng dang chân (chân di chuyển, thân đứng yên)
       hip  : giữa VÁY TRẮNG (vùng trắng liền lớn nhất ở thân dưới) — múa tại chỗ của Nerissa: hông là trục giữ thăng bằng,
              đầu nghiêng / quay lưng không làm cả hình trượt ngang
     cả 3 kiểu quy về cùng 1 điểm nhờ khung chuẩn "calib" (VD idle1); trục dọc luôn = đáy hình (chạm đất).
  5. Xếp atlas cắt sát từng khung (đỡ tốn bộ nhớ) + json: ô khung, gốc chân trong ô, đỉnh hình, điểm bàn tay xa (lửa / cầu lửa).
     "points" (theo tấm): điểm gắn đánh dấu tay {"số khung": {"tên": [x, y] trên tấm gốc}} -> json "pts" (VD mũi kiếm, đầu cung,
     tay cầm lụa); game đọc bằng view.pointWorld(tên). "format": "webp" -> atlas WebP (nhẹ ~3-4 lần PNG).
  6. Tuỳ chọn thêm (Nerissa):
     "footBand" (cả spec, px trên tấm gốc, mặc định 30): bề cao dải đáy để tìm mũi / gót giày + tâm đứng. Nhân vật có
       tua ngọc / dải lụa rủ gần đất (Nerissa) đặt nhỏ (VD 12) để chỉ bắt đế giày, không bắt tua.
     "footMin" (cả spec, px trên tấm gốc, mặc định 8): mảnh hẹp hơn trong dải đáy không tính là giày khi tìm tâm đứng
       (Nerissa 24: tua ngọc rủ ngang đế giày).
     "face": [x0, y0, x1, y1] (cả spec, Zerith) + kiểu mốc "face": trùng KHUÔN MẶT (so mẫu khung mặt của khung chuẩn, xoay ±24°)
       thay 'body' khi vũ khí giơ cao trên đầu (mốc 'body' đo hàng tóc đầu tiên -> bắt nhầm lưỡi hái). Cần opencv (cv2).
     "footBand" theo tấm: ghi đè dải đáy tìm giày cho riêng tấm đó (VD tấm chém có chân sau nhấc gót).
     "solidFeet": true (cả spec, Zerith): gót / mũi giày chỉ tính các mảnh rộng >= footMin trong dải đáy — bỏ mũi đuôi quỷ,
       tua áo, mũi nhọn cán lưỡi hái chạm đất (không thì gót nhảy sang các mảnh đó, khung bị lệch ngang).
     "ground": "group" hoặc ["tên nhóm", ...] (theo tấm): trục dọc = đường đất CHUNG của cả nhóm (trung vị đáy các khung cùng hàng tấm trong nhóm, đo
       trên tấm gốc) thay vì đáy từng khung -> khung nhảy / bật / xoạc chân giữ đúng độ cao AI vẽ (không bị kéo xuống đất).
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def key_green(rgb):
    a = rgb.astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = g - np.maximum(r, b)                       # độ "xanh nền"
    alpha = np.clip((228 - d) / (228 - 12), 0, 1)
    alpha[alpha < 0.05] = 0
    solid = (alpha >= 1) & (d <= 0)
    edge = (alpha > 0) & ~solid
    _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
    out = a.copy()
    out[edge] = a[iy, ix][edge]
    alpha = np.where(edge, np.clip((alpha - 0.15) / 0.85, 0, 1), alpha)
    return np.dstack([out, alpha * 255]).round().clip(0, 255).astype(np.uint8)


def key_matte(rgb):
    """Tách nền xanh kiểu "matte": alpha theo độ xanh so với màu nền đo ở mép tấm, màu gốc phục hồi bằng
    C = a*F + (1-a)*nền (bỏ phần nền trộn vào), rồi khử ám xanh. Giữ được viền đen mảnh (VD mép lưỡi kiếm)
    mà key_green làm mất. Không tô / vẽ lại tranh."""
    a = rgb.astype(np.float32)
    bd = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(bd[(bd[:, 1] - np.maximum(bd[:, 0], bd[:, 2])) > 150], axis=0)
    d = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
    al = np.clip(1 - d / (bg[1] - max(bg[0], bg[2])), 0, 1)
    al[al < 0.06] = 0
    k = np.maximum(al, 1e-3)[..., None]
    F = np.clip((a - (1 - k) * bg[None, None, :]) / k, 0, 255)
    F[..., 1] = np.minimum(F[..., 1], np.maximum(F[..., 0], F[..., 2]) + 6)    # khử ám xanh
    al = np.where(al < 0.5, al * ndi.binary_dilation(al >= 0.5, iterations=2), al)   # bỏ hạt nhiễu lẻ
    return np.dstack([F, al * 255]).round().clip(0, 255).astype(np.uint8)


def key_jade(rgb):
    """Tách nền xanh cho nhân vật MẶC ĐỒ XANH LÁ (Lyra: áo choàng, váy, ruy băng xanh ngọc). key_matte / key_green
    tính alpha theo độ xanh nên vải xanh lá bị trong suốt một phần + mất màu khi khử ám xanh. Ở đây:
      - nền = điểm xanh thuần (G - max(R, B) > 170 và G > 170, nền AI vẽ ~ (4, 249, 4)), kể cả lỗ kín (giữa dây cung và thân cung);
      - điểm cách nền > 2,5px: giữ nguyên 100% (vải xanh không bị đụng tới);
      - dải mép 2–3px: alpha = lớn hơn của (a) tách theo màu điểm đặc gần nhất bên trong C = a*F + (1-a)*nền (mép vải xanh)
        và (b) tách theo độ xanh như matte (dây cung mảnh, không có điểm đặc bên trong); màu = gỡ phần nền trộn vào, khử ám xanh
        nhưng cho phép xanh bằng điểm đặc gần nhất (mép vải xanh giữ màu).
    Không tô / vẽ lại tranh."""
    a = rgb.astype(np.float32)
    d = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
    bd = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bdd = bd[:, 1] - np.maximum(bd[:, 0], bd[:, 2])
    bg = np.median(bd[bdd > 150], axis=0)
    dbg = bg[1] - max(bg[0], bg[2])
    bgm = (d > 170) & (a[..., 1] > 170)
    dist = ndi.distance_transform_edt(~bgm)
    inner = dist > 2.5
    band = ~bgm & ~inner
    _, (iy, ix) = ndi.distance_transform_edt(~inner, return_indices=True)
    F = a[iy, ix]
    dF = F[..., 1] - np.maximum(F[..., 0], F[..., 2])
    num = ((a - bg) * (F - bg)).sum(-1)
    den = ((F - bg) ** 2).sum(-1) + 1e-3
    al_f = np.clip(num / den, 0, 1)
    al_d = np.clip(1 - d / dbg, 0, 1)
    al = np.where(bgm, 0.0, np.where(inner, 1.0, np.maximum(al_f, al_d)))
    al[(al < 0.06)] = 0
    k = np.maximum(al, 1e-3)[..., None]
    U = np.clip((a - (1 - k) * bg[None, None, :]) / k, 0, 255)
    U = np.where((al < 0.25)[..., None], F, U)                       # gần như trong suốt: lấy màu điểm đặc bên trong
    U[..., 1] = np.minimum(U[..., 1], np.maximum(U[..., 0], U[..., 2]) + np.maximum(6, dF))   # khử ám xanh, giữ độ xanh của vải
    out = np.where(band[..., None], U, a)
    return np.dstack([out, al * 255]).round().clip(0, 255).astype(np.uint8)


def load_sheet(path, key=None):
    """key: 'green' (mặc định, như Ignar) · 'matte' (nền xanh, giữ viền đen mảnh) · 'jade' (đồ xanh lá: Lyra) · 'alpha' (PNG đã trong suốt sẵn:
    bỏ quầng sáng mờ alpha < 56). Không ghi key: PNG có trong suốt -> 'alpha', còn lại -> 'green'."""
    im = Image.open(path)
    if key is None:
        key = 'alpha' if im.mode in ('RGBA', 'LA', 'P') and np.asarray(im.convert('RGBA'))[..., 3].min() < 250 else 'green'
    if key == 'alpha':
        a = np.asarray(im.convert('RGBA')).copy()
        A = a[..., 3]
        a[..., 3] = np.where(A < 56, 0, np.where(A >= 250, 255, A))
        return a
    rgb = np.asarray(im.convert('RGB'))
    return key_matte(rgb) if key == 'matte' else key_jade(rgb) if key == 'jade' else key_green(rgb)


def split_frames(rgba, min_size=20000, attach=60):
    alpha = rgba[..., 3].astype(np.float32) / 255
    m = alpha > 0.35
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    sizes = ndi.sum(m, lab, range(1, n + 1))
    objs = ndi.find_objects(lab)
    big = [i for i in range(n) if sizes[i] > min_size]
    cent = {i: ((objs[i][1].start + objs[i][1].stop) / 2, (objs[i][0].start + objs[i][0].stop) / 2) for i in range(n)}
    assign = {}
    for i in range(n):
        if i in big: assign[i] = i; continue
        if sizes[i] < 6: continue
        cx, cy = cent[i]; best, bd = None, 1e9
        for j in big:
            ys, xs = objs[j]
            dx = max(xs.start - cx, 0, cx - xs.stop); dy = max(ys.start - cy, 0, cy - ys.stop)
            if dx * dx + dy * dy < bd: bd, best = dx * dx + dy * dy, j
        if bd < attach ** 2: assign[i] = best
    H = m.shape[0]
    order = sorted(big, key=lambda j: (0 if cent[j][1] < H / 2 else 1, cent[j][0]))
    frames, offs = [], []
    for j in order:
        fm = np.isin(lab, [i + 1 for i, t in assign.items() if t == j])
        fm = ndi.binary_dilation(fm, iterations=3) & (alpha > 0)
        ys, xs = np.where(fm)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(fm[y0:y1, x0:x1], crop[..., 3], 0)
        frames.append(Image.fromarray(crop, 'RGBA'))
        offs.append((int(x0), int(y0)))
    return frames, offs


class Feet:
    """Đo mốc trên 1 khung (đã co giãn): mũi giày trước, gót giày sau, giữa đầu, đáy"""
    def __init__(self, im, off, hair_min, band_h, foot_band=30, run_min=0):
        a = np.asarray(im)[..., 3] > 128
        self.a = a
        h = a.shape[0]
        rows = np.where(a.any(1))[0]
        self.bottom = int(rows[-1]) + 1
        self.top = int(rows[0])
        cols = a[self.bottom - max(2, int(foot_band * off / 40)):self.bottom].any(0)
        xs = np.where(cols)[0]
        if run_min > 0:
            # "solidFeet": bỏ mảnh hẹp trong dải đáy (mũi đuôi, tua áo, mũi nhọn cán vũ khí chạm đất) khi tìm gót / mũi giày
            lab, n = ndi.label(cols)
            keep = [k for k in range(1, n + 1) if (lab == k).sum() >= run_min]
            if keep: xs = np.where(np.isin(lab, keep))[0]
        self.toe = xs[-1] - off
        self.heel = xs[0] + off
        cnt = a.sum(1)
        wide = np.where(cnt >= hair_min)[0]
        ht = int(wide[0]) if len(wide) else self.top
        band = a[ht:ht + band_h]
        bx = np.where(band)[1]
        self.head = float(bx.mean()) if len(bx) else (self.toe + self.heel) / 2
        # hông = giữa váy trắng (chỉ tính khi cần: kiểu 'hip')
        self._rgba = np.asarray(im)
        self._hip = None

    @property
    def hip(self):
        if self._hip is None:
            c = self._rgba[..., :3].astype(np.int16); a = self._rgba[..., 3] > 200
            white = a & (c.min(-1) > 205) & (c.max(-1) - c.min(-1) < 45)
            h = self.bottom - self.top
            white[:self.top + int(0.45 * h)] = False; white[self.top + int(0.88 * h):] = False
            white = ndi.binary_opening(white, iterations=2)
            lab, n = ndi.label(white)
            if n:
                sz = ndi.sum(white, lab, range(1, n + 1)); k = int(np.argmax(sz)) + 1
                self._hip = float(np.where(lab == k)[1].mean())
            else:
                self._hip = self.head
        return self._hip


def hand_points(a, ax, ay, top):
    """Bàn tay xa: cột phải nhất trong vùng thân trên (bỏ đầu / tóc, bỏ chân). Trả về (đỉnh lòng bàn tay x,y · điểm phải nhất x,y)"""
    y0, y1 = int(ay - 0.62 * (ay - top)), int(ay - 0.38 * (ay - top))
    reg = a[max(0, y0):y1].copy()
    reg[:, :max(0, int(ax) - 10)] = False
    if not reg.any(): return None
    xr = np.where(reg.any(0))[0][-1]
    w = max(8, int(45 * (ay - top) / 470))
    sub = reg[:, max(0, xr - w):xr + 1]; ys, xs = np.where(sub)
    return [float(xs.mean() + max(0, xr - w)), float(max(0, y0) + ys.min()), float(xr), float(max(0, y0) + ys.mean())]


def shelf_pack(sizes, max_w, pad):
    order = sorted(range(len(sizes)), key=lambda i: -sizes[i][1])
    pos = [None] * len(sizes)
    x = y = row_h = 0
    for i in order:
        w, h = sizes[i]
        if x + w + pad > max_w: x, y, row_h = 0, y + row_h + pad, 0
        pos[i] = (x, y); x += w + pad; row_h = max(row_h, h)
    return pos, y + row_h


def main(spec_path, debug=None):
    spec = json.load(open(spec_path))
    AS = spec.get('atlasScale', 1.0)
    off = 40 * AS                                   # nửa bề ngang giày (px, cỡ tấm attack × atlasScale)
    frames = []                                     # (tên, ảnh, kiểu mốc)
    gy = {}                                         # tên khung -> đường đất chung của nhóm (None: đáy khung)
    FB = spec.get('footBand', 30)                   # dải đáy tìm giày (px tấm gốc)
    fsrc, fband = {}, {}                            # tên khung -> (x, y gốc trên tấm, hệ số cỡ, tên tấm) · dải đáy riêng của tấm
    for sname, sh in spec['sheets'].items():
        rgba = load_sheet(os.path.join(ROOT, sh['file']), sh.get('key', spec.get('key')))
        imgs, offs = split_frames(rgba)
        pts = sh.get('points', {})               # điểm gắn đánh dấu tay: {"số khung (1..)": {"tên": [x, y] trên tấm gốc}}
        groups = sh.get('groups', [[sname, len(imgs), sh.get('anchor', 'toe')]])
        need = sum(g[1] for g in groups)
        if len(imgs) != need: raise SystemExit(f'{sname}: tách được {len(imgs)} khung, cần {need}')
        s0 = sh.get('scale', 1) * AS
        k = 0
        for g in groups:
            prefix, count, mode = g[:3]
            s = s0 * (g[3] if len(g) > 3 else 1)    # nhóm vẽ to / nhỏ hơn phần còn lại của tấm: hệ số riêng (phần tử thứ 4)
            gnd = {}                                # "ground": "group" -> đường đất chung của nhóm theo từng HÀNG tấm (toạ độ tấm gốc)
            gs = sh.get('ground')
            if gs == 'group' or (isinstance(gs, list) and prefix in gs):
                bot = {}
                for j in range(k, k + count):
                    rows = np.where((np.asarray(imgs[j])[..., 3] > 128).any(1))[0]
                    hrow = int(offs[j][1] + imgs[j].height / 2 >= rgba.shape[0] / 2)
                    bot.setdefault(hrow, []).append(offs[j][1] + int(rows[-1]) + 1)
                # trung vị đáy các khung cùng hàng: 1 khung có tua lụa rủ thấp hơn giày không kéo cả hàng lơ lửng;
                # khung bật nhảy / xoạc chân vẫn ở trên không
                gnd = {r: float(np.median(v)) for r, v in bot.items()}
            for i in range(count):
                im = imgs[k]; ox, oy = offs[k]; k += 1
                hrow = int(oy + im.height / 2 >= rgba.shape[0] / 2)
                if s != 1: im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
                fp = {n: ((x - ox) * s, (y - oy) * s) for n, (x, y) in pts.get(str(k), {}).items()}
                gy[f'{prefix}{i + 1}'] = (gnd[hrow] - oy) * s if hrow in gnd else None
                fsrc[f'{prefix}{i + 1}'] = (ox, oy, s, sname)
                fband[f'{prefix}{i + 1}'] = sh.get('footBand', FB)
                frames.append((f'{prefix}{i + 1}', im, mode, fp))
        print(sname, len(imgs), 'khung · scale', round(s0, 4))
    names = [f[0] for f in frames]
    frames3 = [(n, im, mode) for n, im, mode, _ in frames]
    fpts = {n: fp for n, _, _, fp in frames}
    frames = frames3
    calib = spec.get('calib', 'idle1')
    cim = frames[names.index(calib)][1]
    a0 = np.asarray(cim)[..., 3] > 128
    top0 = np.where(a0.any(1))[0][0]
    hair_w = np.where(a0[top0 + int(25 * AS):top0 + int(95 * AS)].any(0))[0]
    hair_min = 0.5 * (hair_w[-1] - hair_w[0])       # hàng "tóc" = rộng >= nửa bề ngang tóc (tay giơ lên đầu hẹp hơn)
    band_h = int(70 * AS)
    RM = spec.get('footMin', 8) * AS if spec.get('solidFeet') else 0   # "solidFeet": gót / mũi giày chỉ tính mảnh rộng >= footMin
    C = Feet(cim, off, hair_min, band_h, FB, RM)
    d_heel, d_head = C.toe - C.heel, C.toe - C.head
    d_hip = C.toe - C.hip
    # mốc 'face' (Zerith): trùng KHUÔN MẶT bằng so mẫu (xoay ±24°) — vũ khí giơ cao trên đầu không làm lệch như mốc 'body'
    face_find = None
    if spec.get('face'):
        import cv2
        fx0, fy0, fx1, fy1 = spec['face']             # khung mặt trên tấm của khung chuẩn (px tấm gốc)
        cox, coy, cs, _ = fsrc[calib]
        def gray(im):
            a = np.asarray(im).astype(np.float32); al = a[..., 3:4] / 255
            return cv2.cvtColor((a[..., :3] * al + 128 * (1 - al)).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        g0 = gray(cim)
        T0 = g0[int((fy0 - coy) * cs):int((fy1 - coy) * cs), int((fx0 - cox) * cs):int((fx1 - cox) * cs)]
        d_face = C.toe - ((fx0 + fx1) / 2 - cox) * cs
        def face_find(im):
            G = gray(im); best = (-2, 0.0)
            for ang in range(-24, 25, 6):
                M = cv2.getRotationMatrix2D((T0.shape[1] / 2, T0.shape[0] / 2), ang, 1.0)
                T = cv2.warpAffine(T0, M, (T0.shape[1], T0.shape[0]), borderValue=128)
                for sc in np.arange(0.9, 1.11, 0.02):
                    t = cv2.resize(T, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA)
                    if t.shape[0] >= G.shape[0] or t.shape[1] >= G.shape[1]: continue
                    r = cv2.matchTemplate(G, t, cv2.TM_CCOEFF_NORMED); _, m, _, (x, y) = cv2.minMaxLoc(r)
                    if m > best[0]: best = (m, x + t.shape[1] / 2)
            return best
    # tâm đứng (gốc nhân vật trong game) = giữa 2 giày ở khung chuẩn
    band = a0[C.bottom - max(2, int(FB * AS)):C.bottom]
    lab, _ = ndi.label(band)
    # "footMin" (px tấm gốc, mặc định 8): bỏ mảnh nhỏ hơn (VD tua ngọc rủ sát đất của Nerissa) khi tìm 2 chiếc giày
    bl = sorted([(o[1].start, o[1].stop) for o in ndi.find_objects(lab) if o[1].stop - o[1].start > spec.get('footMin', 8) * AS])
    origin_dx = (bl[0][0] + bl[-1][1]) / 2 - C.toe

    pad = spec.get('pad', 6)
    trims, sizes, meta_f = [], [], {}
    for nm, im, mode in frames:
        F = Feet(im, off, hair_min, band_h, fband.get(nm, FB), RM)
        if mode == 'face':
            if not face_find: raise SystemExit(f'{nm}: mốc "face" cần "face": [x0, y0, x1, y1] (khung mặt trên tấm của khung chuẩn)')
            fm, fx = face_find(im)
            if fm < 0.45: print(f'  ! {nm}: khớp mặt yếu ({fm:.2f}) — xem lại ảnh soi')
            ax = fx + d_face
        else:
            ax = F.toe if mode == 'toe' else F.heel + d_heel if mode == 'heel' else F.hip + d_hip if mode == 'hip' else F.head + d_head
        ax += origin_dx                              # gốc = tâm đứng
        ay = F.bottom if gy.get(nm) is None else gy[nm]
        hp = hand_points(F.a, ax - origin_dx, ay, F.top)
        bb = im.getbbox()
        crop = im.crop(bb)
        trims.append(crop); sizes.append(crop.size)
        meta_f[nm] = {'org': [round(ax - bb[0], 1), round(ay - bb[1], 1)], 'top': int(ay - F.top),
                      'hand': [round(v - (ax if j % 2 == 0 else ay), 1) for j, v in enumerate(hp)] if hp else None}
        if fpts.get(nm): meta_f[nm]['pts'] = {n: [round(x - ax, 1), round(y - ay, 1)] for n, (x, y) in fpts[nm].items()}
    pos, H = shelf_pack(sizes, spec.get('maxWidth', 4096), pad)
    W = max(p[0] + s[0] for p, s in zip(pos, sizes))
    atlas = Image.new('RGBA', (W, H))
    for (nm, _, _), crop, p in zip(frames, trims, pos):
        atlas.alpha_composite(crop, p)
        meta_f[nm]['rect'] = [p[0], p[1], crop.width, crop.height]
    ext = '.' + spec.get('format', 'png')
    out = {'image': os.path.basename(spec['out']) + ext, 'size': [W, H], 'atlasScale': AS, 'frames': meta_f}
    dst = os.path.join(ROOT, spec['out'])
    meta = os.path.join(ROOT, spec.get('meta', spec['out'] + '.json'))
    for d in (dst, meta): os.makedirs(os.path.dirname(d), exist_ok=True)
    # mép trong suốt lấy màu điểm gần nhất: thu nhỏ (mipmap) không ra viền đen
    arr = np.asarray(atlas).copy()
    tr = arr[..., 3] == 0
    if tr.any() and (~tr).any():
        _, (iy, ix) = ndi.distance_transform_edt(tr, return_indices=True)
        for c in range(3): arr[..., c] = arr[..., c][iy, ix]
    atlas = Image.fromarray(arr, 'RGBA')
    if ext == '.webp': atlas.save(dst + ext, 'WEBP', quality=90, alpha_quality=100, method=6, exact=True)
    else: atlas.save(dst + ext, optimize=True)
    json.dump(out, open(meta, 'w'), indent=1)
    print(len(frames), 'khung ->', dst + ext, W, 'x', H, '+', meta)

    if debug:   # ảnh soi: mọi khung đặt cùng gốc (vạch tím), đáy (vạch vàng), lòng bàn tay (vàng) + điểm cầu lửa (xanh)
        cw = int(max(f['org'][0] for f in meta_f.values()) + max(f['rect'][2] - f['org'][0] for f in meta_f.values())) + 10
        ch = int(max(f['org'][1] for f in meta_f.values())) + 10
        cols = 8; rows = (len(frames) + cols - 1) // cols
        dbg = Image.new('RGB', (cw * cols, ch * rows), (47, 74, 90)); d = ImageDraw.Draw(dbg)
        oxm = int(max(f['org'][0] for f in meta_f.values())) + 5
        for i, ((nm, _, mode), crop) in enumerate(zip(frames, trims)):
            f = meta_f[nm]; X, Y = (i % cols) * cw + oxm, (i // cols) * ch + ch - 5
            dbg.paste(crop, (int(X - f['org'][0]), int(Y - f['org'][1])), crop)
            d.line([(X, Y - ch + 5), (X, Y)], fill=(255, 0, 255)); d.line([(X - oxm, Y), (X - oxm + cw, Y)], fill=(255, 220, 0))
            if f['hand']:
                hx, hy, rx, ry = f['hand']
                d.ellipse([X + hx - 4, Y + hy - 4, X + hx + 4, Y + hy + 4], outline=(255, 255, 0), width=2)
                d.ellipse([X + rx - 4, Y + ry - 4, X + rx + 4, Y + ry + 4], outline=(0, 255, 255), width=2)
            for n, (px, py) in f.get('pts', {}).items():
                d.ellipse([X + px - 4, Y + py - 4, X + px + 4, Y + py + 4], outline=(255, 0, 255), width=2); d.text((X + px + 5, Y + py - 5), n, fill=(255, 0, 255))
            d.text(((i % cols) * cw + 4, (i // cols) * ch + 4), f'{nm} [{mode}]', fill=(255, 255, 255))
        dbg.save(debug)
        print('ảnh soi ->', debug)


if __name__ == '__main__':
    args = sys.argv[1:]
    dbg = None
    if '--debug' in args:
        i = args.index('--debug'); dbg = args[i + 1]; del args[i:i + 2]
    main(args[0] if args else os.path.join(ROOT, 'art/ignar/sprite/sprite_spec.json'), dbg)
