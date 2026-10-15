"""
Cắt nhân vật TRỰC TIẾP từ tranh toàn thân (đứng yên = giống hệt tranh), tấm bộ phận rời chỉ để lấp chỗ bị che.

Chạy:  python tools/cut_reference.py art/seraphine/ref_spec.json

Spec: {
  "ref": "art/seraphine/01-character.png",      // tranh toàn thân
  "out": "src/assets/sprites/sera_atlas.png", "meta": "src/characters/cutout/seraAtlas.json",
  "order": ["staff", "handF", ...],              // thứ tự ƯU TIÊN khi 2 mảnh tranh cùng 1 điểm (mảnh trước giành điểm)
  "pieces": { tên: { "poly": [[x,y],...], "color": "skin"|"notskin"|null, "fill": "inpaint"|"vcopy"|null,
                     "fillPoly": [[x,y]...], "extendUp": [y_top, [x0,x1]],
                     "variants": { tên2: { "extendUp": [y_top, [x0,x1]] } } } },   // thêm mảnh tên2 = mảnh này kéo dài lên (skin)
  "extra": { tên: { "sheet": "...", "box": [x0,y0,x1,y1], "scale": s, "largest": true,
                    "poly": [[x,y]...], "keep": {"band": [ya,yb], "disks": [[cx,cy,r]...]} } }   // mảnh lấy từ tấm khác (vd mắt, bàn tay)
                     // largest: chỉ giữ khối liền lớn nhất trong hộp (bỏ mẩu mảnh bên cạnh lọt vào)
}
Toạ độ trong meta (src) là toạ độ trên TRANH TOÀN THÂN -> rig đặt mảnh đúng chỗ như tranh.
"""
import json
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from slice_parts import background_mask  # noqa: E402

PAD = 3


def poly_mask(shape, poly):
    im = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).polygon([tuple(p) for p in poly], fill=255)
    return np.asarray(im) > 0


def is_skin(rgb):
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (r > 200) & (r - b > 35) & (g > 145) & (r - g > 12) & (r - g < 80) & (b > 105) & (g - b < 44)


def is_hair(rgb):
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (r > 170) & (g > 130) & (r - b > 45) & (b < 200)


def soft_alpha(fg):
    a = cv2.GaussianBlur((fg * 255).astype(np.uint8), (0, 0), 0.8).astype(np.float32)
    return np.clip((a - 40) * 255 / (215 - 40), 0, 255).astype(np.uint8)


def load_sheet(path):
    """Tấm bộ phận: PNG nền trong suốt thì dùng alpha sẵn có; nền trắng thì tự tách nền."""
    im = Image.open(path)
    if im.mode == "RGBA" and np.asarray(im)[..., 3].min() < 10:
        a = np.asarray(im).copy()
        # màu ẩn dưới pixel trong suốt (thường là quầng sáng) -> lấy màu pixel đặc gần nhất để không lem viền
        solid = a[..., 3] > 200
        _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
        for c in range(3):
            a[..., c] = np.where(solid, a[..., c], a[..., c][iy, ix])
        return a
    rgb = np.asarray(im.convert("RGB"))
    return np.dstack([rgb, soft_alpha(~background_mask(rgb))])


def decontaminate(ref, fg):
    """Tách viền khỏi nền trắng: pixel mép là màu thật F trộn với trắng -> tính lại alpha, gỡ phần trắng.
    Hết viền trắng khi đặt nhân vật lên nền tối của game."""
    img = ref.astype(np.float32)
    inner = ndimage.binary_erosion(fg, iterations=3)
    _, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
    F = img[iy, ix]                                   # màu lõi gần nhất
    band = ndimage.binary_dilation(fg, iterations=2) & ~inner
    d = 255.0 - F
    o = 255.0 - img
    den = (d * d).sum(-1)
    a = np.clip((o * d).sum(-1) / np.maximum(den, 1), 0, 1)
    unstable = den < 40 * 40 * 3 * 0.25               # lõi gần trắng (áo trắng): giữ alpha cũ
    old = soft_alpha(fg).astype(np.float32) / 255
    a = np.where(unstable, old, a)
    alpha = np.where(inner, 1.0, np.where(band, a, 0.0))
    # gỡ trắng: obs = a*C + (1-a)*255  ->  C = (obs - (1-a)*255) / a
    C = (img - (1 - alpha[..., None]) * 255) / np.maximum(alpha[..., None], 1e-3)
    C = np.where(alpha[..., None] > 0.35, C, F)
    out = np.where(band[..., None], np.clip(C, 0, 255), img).astype(np.uint8)
    al = (alpha * 255).astype(np.uint8)
    al[al < 14] = 0
    return out, al


def main():
    spec = json.load(open(sys.argv[1]))
    src_im = Image.open(spec["ref"])
    ref_alpha = np.asarray(src_im)[..., 3].copy() if src_im.mode == "RGBA" and np.asarray(src_im)[..., 3].min() < 10 else None
    if ref_alpha is not None:
        # tranh nền trong suốt: lấy màu thật dưới pixel trong suốt từ pixel đặc gần nhất (không lem viền)
        a = np.asarray(src_im).copy()
        solid = a[..., 3] > 200
        _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
        for c in range(3):
            a[..., c] = np.where(solid, a[..., c], a[..., c][iy, ix])
        ref = a[..., :3].copy()
    else:
        ref = np.asarray(src_im.convert("RGB")).copy()
    H, W, _ = ref.shape
    fg = (ref_alpha > 24) if ref_alpha is not None else ~background_mask(ref)
    # nền trắng bị nhân vật bao kín (vd khe giữa 2 chân): đánh dấu bằng điểm mồi
    nw = (255 - ref.astype(int)).max(axis=2) <= 12
    lab, _ = ndimage.label(nw)
    for sx, sy in spec.get("bgSeeds", []):
        if lab[sy, sx]:
            fg &= lab != lab[sy, sx]
    # khe trắng giữa các lọn tóc (nền bị tóc bao kín, không nối ra mép ảnh) -> cũng là nền
    for poly in spec.get("whiteHolePolys", []):
        r = ref.astype(int)
        wh = (r.min(-1) >= 236) & ((r.max(-1) - r.min(-1)) <= 16) & poly_mask(ref.shape, poly)
        for kp in spec.get("whiteKeepPolys", []):   # lòng trắng mắt... giữ lại
            wh &= ~poly_mask(ref.shape, kp)
        lab, n = ndimage.label(wh)
        if n:
            sz = ndimage.sum(wh, lab, range(1, n + 1))
            big = np.isin(lab, np.nonzero(sz >= spec.get("whiteHoleMin", 12))[0] + 1)
            # đốm sáng bóng trên tóc (xung quanh là màu tóc sáng) -> giữ; khe hở (viền tóc đậm bao quanh) -> xoá
            ring_ok = []
            for ci in np.nonzero(big_ids := (sz >= spec.get("whiteHoleMin", 12)))[0] + 1:
                comp = lab == ci
                ring = ndimage.binary_dilation(comp, iterations=3) & ~comp
                if r[ring][:, 2].mean() < spec.get("whiteHoleRing", 170):
                    ring_ok.append(ci)
            big = np.isin(lab, ring_ok)
            fg &= ~ndimage.binary_dilation(big, iterations=1)
    fg0 = fg.copy()   # bóng nhân vật gốc (trước khi trừ vùng discard) — dùng cho fillFg
    taken = np.zeros((H, W), bool)
    layers = {}
    def piece_mask(p):
        m = np.zeros((H, W), bool)
        for q in p.get("polys", [{"poly": p.get("poly"), "color": p.get("color")}]):
            pm = poly_mask(ref.shape, q["poly"])
            if q.get("color") == "skin":
                sk = ndimage.binary_closing(is_skin(ref) & pm, iterations=3)
                pm &= ndimage.binary_dilation(sk, iterations=2)
            elif q.get("color") == "notskin":
                pm &= ~is_skin(ref)
            elif q.get("color") == "hair":
                pm &= is_hair(ref)
            elif q.get("color") == "nothair":
                pm &= ~ndimage.binary_opening(is_hair(ref), iterations=1)
            m |= pm
        return m

    for name in spec["order"]:
        p = spec["pieces"][name]
        m = piece_mask(p) & fg & ~taken
        m = ndimage.binary_opening(m, iterations=1)
        if p.get("largest"):
            lab, n = ndimage.label(m)
            if n > 1:
                m = lab == (np.argmax(ndimage.sum(m, lab, range(1, n + 1))) + 1)
        m = ndimage.binary_fill_holes(m) & fg & ~taken | m
        taken |= m
        layers[name] = m

    pieces = {}
    if ref_alpha is not None:
        fga = ref_alpha.copy()          # nền trong suốt sẵn: dùng alpha gốc, không cần gỡ nền trắng
    else:
        ref, fga = decontaminate(ref, fg)
    for name, m in layers.items():
        p = spec["pieces"][name]
        if p.get("discard"):      # vùng bỏ đi (vd quả cầu lửa vẽ sẵn trên tay -> làm bằng hiệu ứng)
            continue
        rgb = ref.copy()
        # nới 2px ra ngoài (chồng lên mảnh bên cạnh) -> không hở khe ở đường cắt
        mo = ndimage.binary_dilation(m, iterations=p.get("grow", 2)) & (fga > 0)
        alpha = np.where(mo, fga, 0).astype(np.uint8)
        if p.get("matte"):
            # tóc sáng sát nền trắng: mép tóc tính alpha theo màu tóc chuẩn -> sợi nhạt thành trong suốt, không trắng
            Fh = np.array(p["matte"], np.float32)
            dist = ndimage.distance_transform_edt(fga > 0)
            near = (dist <= p.get("matteBand", 8)) & mo
            o = 255.0 - ref.astype(np.float32)
            d = 255.0 - Fh
            est = np.clip((o * d).sum(-1) / (d * d).sum(), 0, 1)
            est = np.clip((est - 0.12) / 0.6, 0, 1)
            alpha[near] = np.minimum(alpha[near], (est[near] * 255)).astype(np.uint8)
            C = (ref.astype(np.float32) - (1 - est[..., None]) * 255) / np.maximum(est[..., None], 0.05)
            C = np.clip(np.where(est[..., None] > 0.25, C, Fh), 0, 255)
            rgb[near] = C[near].astype(np.uint8)
        if p.get("fill"):
            region = poly_mask(ref.shape, p.get("fillPoly", p.get("poly") or p["polys"][0]["poly"]))
            hole = region & ~mo
            if p.get("fillFg"):   # chỉ lấp phần nằm trong bóng nhân vật gốc (vd chỗ cán liềm đè lên áo)
                hole &= fg0 & ndimage.binary_dilation(mo, iterations=p.get("fillNear", 40))
            if p["fill"] == "inpaint":
                rgb = cv2.inpaint(rgb, (hole * 255).astype(np.uint8), 9, cv2.INPAINT_TELEA)
                alpha[hole] = 255
            elif p["fill"] == "vcopy":
                # cán gậy thẳng đứng: lặp dải ngay phía trên chỗ bị che xuống dưới
                ys, xs = np.nonzero(hole)
                if len(ys):
                    y0 = ys.min()
                    for y in range(ys.min(), ys.max() + 1):
                        src = y0 - 1 - ((y - y0) % 24)
                        row = hole[y] & (alpha[src] > 0)
                        rgb[y, row] = rgb[src, row]
                        alpha[y, row] = alpha[src, row]
        # biến thể: cùng mảnh nhưng kéo dài lên trên (vd tay xa giơ ra trước -> ống tay nối liền tới vai)
        for vname, v in p.get("variants", {}).items():
            vr, va = rgb.copy(), alpha.copy()
            ytop, (x0, x1) = v["extendUp"]
            ys, _ = np.nonzero(va[:, x0:x1] > 200)
            top = ys.min() + 3
            for y in range(ytop, top):
                vr[y, x0:x1] = vr[top, x0:x1]
                va[y, x0:x1] = va[top, x0:x1]
            ys, xs = np.nonzero(va > 0)
            vx0, vx1, vy0, vy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            pieces[vname] = (Image.fromarray(np.dstack([vr[vy0:vy1, vx0:vx1], va[vy0:vy1, vx0:vx1]]), "RGBA"), [int(vx0), int(vy0)], 1.0)
        if p.get("extendRight"):
            # kéo dài mảnh sang phải (gốc đuôi bị tay che): lặp cột x_src tới x_to
            x_to, x_src = p["extendRight"][:2]
            grow = p["extendRight"][2] if len(p["extendRight"]) > 2 else 0.0   # nở dày dần về phía gốc
            col_rgb, col_a = rgb[:, x_src].copy(), alpha[:, x_src].copy()
            ys = np.nonzero(col_a > 128)[0]
            cy = (ys.min() + ys.max()) / 2 if len(ys) else 0
            H = rgb.shape[0]
            for x in range(x_src + 1, x_to):
                f = 1 + grow * (x - x_src) / max(1, x_to - x_src)
                src = np.clip(np.round(cy + (np.arange(H) - cy) / f).astype(int), 0, H - 1)
                rgb[:, x] = col_rgb[src]
                alpha[:, x] = col_a[src]
        if p.get("extendUp"):
            # kéo dài mảnh lên trên (phần bị che) bằng cách lặp hàng trên cùng
            ytop, (x0, x1) = p["extendUp"]
            ys, _ = np.nonzero(alpha[:, x0:x1] > 200)
            top = ys.min() + 3
            for y in range(ytop, top):
                rgb[y, x0:x1] = rgb[top, x0:x1]
                alpha[y, x0:x1] = alpha[top, x0:x1]
        ys, xs = np.nonzero(alpha > 0)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        im = Image.fromarray(np.dstack([rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1]]), "RGBA")
        pieces[name] = (im, [int(x0), int(y0)], 1.0)

    # Mảnh lấy từ tấm khác (bàn tay...): src = góc hộp trên tấm đó, scale = tỉ lệ thu nhỏ
    #   -> rig dùng toạ độ gốc của tấm đó làm pivot.
    # Mắt ("eye": true): vùng mắt của tranh (box là toạ độ trên TRANH), "overlay" = mắt biểu cảm từ tấm khác,
    #   mắt gốc được xoá (inpaint) trước khi đặt mắt mới. Không có overlay = mắt gốc của tranh.
    for name, e in spec.get("extra", {}).items():
        if e.get("blank"):   # mảnh trong suốt (vd mắt 'open' = giữ mắt gốc)
            pieces[name] = (Image.new("RGBA", (4, 4), (0, 0, 0, 0)), [0, 0], 1.0)
            continue
        if e.get("warp"):
            # mảnh lấy từ tấm khác, biến đổi affine M (đo bằng so khớp ảnh) về đúng chỗ trên TRANH -> src = toạ độ tranh
            arr = load_sheet(e["sheet"])
            x0, y0, x1, y1 = e["box"]
            sub = np.zeros_like(arr); sub[y0:y1, x0:x1] = arr[y0:y1, x0:x1]
            M = np.array(e["M"], np.float32)
            wimg = cv2.warpAffine(sub, M, (W, H), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
            ys, xs = np.nonzero(wimg[..., 3] > 8)
            bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            pieces[name] = (Image.fromarray(wimg[by0:by1, bx0:bx1], "RGBA"), [int(bx0), int(by0)], 1.0)
            continue
        if e.get("eye"):
            x0, y0, x1, y1 = e["box"]
            crop = ref[y0:y1, x0:x1].copy()
            hm = layers[e.get("on", "head")][y0:y1, x0:x1]
            blob = Image.new("L", (x1 - x0, y1 - y0), 0)
            ImageDraw.Draw(blob).ellipse([4, 4, x1 - x0 - 4, y1 - y0 - 4], fill=255)
            blob = np.asarray(blob.filter(__import__("PIL.ImageFilter", fromlist=["x"]).GaussianBlur(3))).astype(np.float32)
            if e.get("overlay"):
                ip = poly_mask(ref.shape, e["erase"])[y0:y1, x0:x1]
                # xoá mắt gốc: tô màu da (trung vị da quanh mắt), viền mềm
                sk = is_skin(crop) & ~ip
                col = np.median(crop[sk], axis=0) if sk.sum() > 20 else np.array(spec.get("skinColor", [252, 222, 200]))
                w = cv2.GaussianBlur(ip.astype(np.float32), (0, 0), 2.5)[..., None]
                crop = (crop * (1 - w) + col * w).astype(np.uint8)
            a = (blob * hm).astype(np.uint8)
            im = Image.fromarray(np.dstack([crop, a]), "RGBA")
            if e.get("overlay"):
                o = e["overlay"]
                bx0, by0, bx1, by1 = o["box"]
                arr = load_sheet(o["sheet"])[by0:by1, bx0:bx1].copy()
                if o.get("feather", True):
                    # mép mềm hình elip: dán mắt mới không lộ đường cắt hình chữ nhật
                    hh, ww = arr.shape[:2]
                    yy, xx = np.mgrid[0:hh, 0:ww]
                    d = ((xx - ww / 2) / (ww / 2)) ** 2 + ((yy - hh / 2) / (hh / 2)) ** 2
                    arr[..., 3] = (arr[..., 3] * np.clip((1 - d) / 0.35, 0, 1)).astype(np.uint8)
                oi = Image.fromarray(arr, "RGBA")
                s = o["scale"]
                oi = oi.resize((round(oi.width * s), round(oi.height * s)), Image.LANCZOS)
                cx, cy = o["at"]   # tâm mắt mới (toạ độ tranh)
                im.alpha_composite(oi, (round(cx - x0 - oi.width / 2), round(cy - y0 - oi.height / 2)))
            pieces[name] = (im, [x0, y0], 1.0)
            continue
        x0, y0, x1, y1 = e["box"]
        full = load_sheet(e["sheet"])
        arr = full[y0:y1, x0:x1].copy()
        # "poly": chỉ giữ phần trong đa giác (toạ độ trên tấm) — vd cắt cẳng tay tại cổ tay
        # "keep": {"band": [ya, yb], "disks": [[cx, cy, r], ...]} — dải ngang ya..yb + các ĐĨA TRÒN quanh khớp
        #         (đầu khớp tròn -> xoay khuỷu / gối không lộ đường cắt thẳng); tấm vẽ liền cả tay / chân
        keepm = None
        if e.get("poly"):
            keepm = poly_mask(full.shape, e["poly"])[y0:y1, x0:x1]
        if e.get("keep"):
            k = e["keep"]
            yy, xx = np.mgrid[y0:y1, x0:x1]
            km = np.zeros(arr.shape[:2], bool)
            if k.get("band"):
                km |= (yy >= k["band"][0]) & (yy < k["band"][1])
            for cx, cy, r in k.get("disks", []):
                km |= (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r
            keepm = km if keepm is None else (keepm & km)
        if keepm is not None:
            soft = cv2.GaussianBlur(keepm.astype(np.float32), (0, 0), 0.9)
            arr[..., 3] = (arr[..., 3] * soft).astype(np.uint8)
        if e.get("largest"):   # chỉ giữ khối liền lớn nhất (bỏ mẩu mảnh khác lọt vào hộp)
            lab, n = ndimage.label(ndimage.binary_dilation(arr[..., 3] > 8, iterations=2))
            if n > 1:
                keep = lab == (np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))) + 1)
                arr[..., 3] = np.where(keep, arr[..., 3], 0)
        im = Image.fromarray(arr, "RGBA")
        s = e.get("scale", 1.0)
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        pieces[name] = (im, [x0, y0], s)

    Wt = spec.get("width", 2048)
    order = sorted(pieces.items(), key=lambda kv: -kv[1][0].height)
    x = y = shelf = 0
    placed = {}
    for name, (im, src, sc) in order:
        if x + im.width + PAD > Wt:
            x, y, shelf = 0, y + shelf + PAD, 0
        placed[name] = (x + PAD, y + PAD)
        x += im.width + PAD * 2
        shelf = max(shelf, im.height + PAD)
    Ht = 1 << (y + shelf + PAD - 1).bit_length()
    atlas = Image.new("RGBA", (Wt, Ht), (0, 0, 0, 0))
    meta = {"atlasSize": [Wt, Ht], "parts": {}}
    for name, (im, src, sc) in pieces.items():
        px, py = placed[name]
        atlas.paste(im, (px, py))
        meta["parts"][name] = {"rect": [px, py, im.width, im.height], "src": src, "scale": sc}
    arr = np.asarray(atlas).copy()
    tr = arr[..., 3] == 0
    _, (iy, ix) = ndimage.distance_transform_edt(tr, return_indices=True)
    for c in range(3):
        arr[..., c] = arr[..., c][iy, ix]
    Image.fromarray(arr, "RGBA").save(spec["out"], optimize=True)
    json.dump(meta, open(spec["meta"], "w"), indent=1)
    # ảnh kiểm tra: tô màu từng mảnh trên tranh
    dbg = ref.copy().astype(float)
    rng = np.random.default_rng(3)
    for name, m in layers.items():
        c = rng.integers(40, 255, 3)
        dbg[m] = dbg[m] * 0.45 + c * 0.55
    Image.fromarray(dbg.astype(np.uint8)).save(spec.get("debug", "/tmp/cut_debug.png"))
    print(f"atlas {Wt}x{Ht} -> {spec['out']} ({len(pieces)} mảnh)")


if __name__ == "__main__":
    main()
