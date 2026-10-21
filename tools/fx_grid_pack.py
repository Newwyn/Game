"""Cắt tấm hiệu ứng (nền ĐEN, lưới cố định) thành chuỗi khung + đóng gói 1 atlas cho src/vfx/fireFx.js.

    python tools/fx_grid_pack.py art/ignar/fx2/fx2_spec.json [--preview soi.png]

Chỉ làm các việc sau, KHÔNG tô / vẽ lại tranh:
  1. Cắt theo ô lưới ("grid": [cột, hàng]); ô đánh số trái -> phải, trên -> dưới (0..).
     Hình lấn sang ô bên cạnh vẫn đủ: gom theo vùng liền, vùng thuộc ô chứa phần lớn diện tích của nó.
  2. Tách nền đen -> trong suốt ("keepAlpha": true ở tấm = tranh PNG đã trong suốt thật -> giữ nguyên kênh trong suốt, bỏ bước này):
       fire  (mặc định): alpha = độ sáng lớn nhất, màu "gỡ đen" -> lửa giữ độ rực, viền mờ dần, không viền đục.
       solid: ngưỡng: vật THẬT màu tối (đá, giáp, đất cháy, khiên tím): phần ruột (sáng hơn ngưỡng, lấp lỗ, lùi vào trong
              "inset" px) giữ ĐẶC màu gốc; viền ngoài vẫn mờ như lửa. "holeMax": chỉ lấp lỗ <= N px (giữ khoảng tối lớn trong suốt).
       solidFrames: [khung] chỉ áp "solid" cho các khung này (mặc định mọi khung)
       smoke: [khung]: khói xám — điểm ít màu giữ màu xám thật, độ đục theo độ sáng (khói không bị trắng bệch).
  3. Căn khung trong nhóm (dời cả khung, không sửa điểm ảnh):
       cell  : giữ nguyên vị trí trong ô (AI đã vẽ cùng chân đế)
       core  : trùng lõi trắng nóng (cầu lửa, luồng chưởng)   ·   bottom: trùng đáy-giữa
       blob  : trùng 1 vật có màu riêng "blob": [[r,g,b thấp], [r,g,b cao]] (+ "blobRegion" [x0,y0,x1,y1] tỉ lệ ô) —
               VD sư tử vàng giữa Khiên Thần của Rok; pivot "blob" = đúng điểm đó
  4. Cắt sát theo khung chung của nhóm (mọi khung cùng cỡ) + điểm gốc "pivot":
       core | bottom | center | left (mép trái giữa) | [x, y] theo toạ độ trong ô gốc.
  5. Xếp atlas + json: nhóm -> { size, pivot, frames: [rect...], tip? }. Đuôi "out" .webp -> nén WebP (nhẹ ~3-4 lần).
  6. Nhóm 1 hình AI vẽ tràn hẳn sang ô bên cạnh và CHẠM hình bên cạnh (VD vòng thủy triều + vòng hoa sen của Nerissa):
     "rect": [x0, y0, x1, y1] (toạ độ tấm gốc) thay cho "cells" -> cắt đúng khung chữ nhật đó (1 khung), không gom vùng liền.
     "feather": [trái, phải] (px, tuỳ chọn): AI vẽ hình bị CẮT CỤT ở mép tấm / mép ô -> mờ dần vài chục px ở 2 mép để không
     lộ đường cắt thẳng (chỉ làm mờ mép, không vẽ thêm).
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def key_black(raw, solid=None, inset=6, smoke=False, hole_max=None):
    """raw: RGB float 0..255 (nền đen) -> RGBA float. hole_max: chỉ lấp lỗ nhỏ (viền tối mảnh trong vật), lỗ lớn
    (khoảng tối giữa cánh và vòng hào quang) giữ trong suốt"""
    mx = raw.max(-1); mn = raw.min(-1)
    a = np.clip((mx / 255 - 0.06) / 0.94, 0, 1)
    col = np.clip(raw / np.maximum(a[..., None], 0.05), 0, 255)
    if smoke:
        sat = (mx - mn) / np.maximum(mx, 1)
        gray = np.clip(1 - sat * 2.2, 0, 1)
        a_s = np.clip((mx - 12) / 110, 0, 1) * gray
        use = a_s > a
        col = np.where(use[..., None], np.clip(raw / np.maximum(a_s[..., None], 0.05), 0, 255), col)
        a = np.maximum(a, a_s)
    if solid is not None:
        base = ndi.binary_opening(mx > solid, iterations=2)
        core = ndi.binary_fill_holes(base) & (mx > 18)   # lỗ là nền đen thật thì bỏ
        if hole_max is not None:
            holes, nh = ndi.label(core & ~base)
            if nh:
                hs = ndi.sum(np.ones_like(mx), holes, range(1, nh + 1))
                big = np.isin(holes, np.where(hs > hole_max)[0] + 1)
                core = core & ~big
        if inset: core = ndi.binary_erosion(core, iterations=inset)
        soft = np.clip(ndi.gaussian_filter(core.astype(np.float32), 2.0) * 1.3, 0, 1)
        col = col * (1 - soft[..., None]) + raw * soft[..., None]
        a = np.maximum(a, soft)
    return np.dstack([col, a * 255])


def core_point(rgba, region=None):
    """lõi trắng nóng: trọng tâm điểm rất sáng (min kênh cao)"""
    rgb = rgba[..., :3] * (rgba[..., 3:] / 255)
    hot = rgb.min(-1)
    m = hot > np.percentile(hot[rgba[..., 3] > 20], 99) if (rgba[..., 3] > 20).any() else hot > 200
    if region is not None:
        x0, x1 = region
        mm = np.zeros_like(m); w = m.shape[1]; mm[:, int(x0 * w):int(x1 * w)] = m[:, int(x0 * w):int(x1 * w)]; m = mm
    ys, xs = np.where(m)
    if not len(xs): return (rgba.shape[1] / 2, rgba.shape[0] / 2)
    return (float(xs.mean()), float(ys.mean()))


def blob_point(rgba, lo, hi, region=None):
    """Trọng tâm vùng liền LỚN NHẤT có màu trong [lo, hi] (VD sư tử vàng giữa khiên) — None nếu không thấy.
    region = [x0, y0, x1, y1] (tỉ lệ 0..1 của ảnh) giới hạn chỗ tìm."""
    rgb = rgba[..., :3] * (rgba[..., 3:] / 255)
    m = np.all((rgb >= lo) & (rgb <= hi), axis=-1)
    if region is not None:
        h, w = m.shape; x0, y0, x1, y1 = region
        mm = np.zeros_like(m); mm[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = m[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)]; m = mm
    m = ndi.binary_opening(m, iterations=2)
    lab, n = ndi.label(m)
    if not n: return None
    sz = ndi.sum(m, lab, range(1, n + 1)); k = int(np.argmax(sz)) + 1
    if sz[k - 1] < 300: return None
    ys, xs = np.where(lab == k)
    return (float(xs.mean()), float(ys.mean()))


def bbox(a, thr=8):
    ys, xs = np.where(a > thr)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def save_atlas(im, dst):
    """.webp: nén có mất mát nhẹ (q90), kênh trong suốt giữ nguyên; .png: không mất"""
    if dst.lower().endswith('.webp'):
        im.save(dst, 'WEBP', quality=90, alpha_quality=100, method=6, exact=True)
    else:
        im.save(dst, optimize=True)


def main(spec_path, preview=None):
    spec = json.load(open(spec_path))
    groups = []                       # (tên, [ảnh RGBA đã căn], pivot (x, y) trong ảnh, tip?)
    for sname, sh in spec['sheets'].items():
        src = Image.open(os.path.join(ROOT, sh['file']))
        # "keepAlpha": tranh xuất sẵn trong suốt có kênh trong suốt THẬT (khói đen, áo choàng tối...): giữ nguyên kênh đó,
        # không đặt lên nền đen rồi tách đen (tách đen làm mất mọi phần tối). Mặc định: đặt lên nền đen (như tranh nền đen)
        keep_alpha = bool(sh.get('keepAlpha')) and src.mode in ('RGBA', 'LA', 'P')
        if keep_alpha:
            raw = np.asarray(src.convert('RGBA')).astype(np.float32)
            raw[..., :3] *= raw[..., 3:] / 255          # nhân sẵn độ trong (điểm trong suốt không mang màu quầng)
            lum = raw[..., 3]
        else:
            if src.mode in ('RGBA', 'LA', 'P'):
                bg = Image.new('RGBA', src.size, (0, 0, 0, 255)); bg.alpha_composite(src.convert('RGBA')); src = bg
            raw = np.asarray(src.convert('RGB')).astype(np.float32)
            lum = raw.max(-1)
        H, W = raw.shape[:2]
        NC = raw.shape[2]
        gc, gr = sh['grid']; cw, ch = W // gc, H // gr
        # hình vẽ lấn sang ô bên cạnh: gom theo VÙNG LIỀN, vùng thuộc ô chứa phần lớn diện tích của nó
        M = 96
        # "regionThr" / "regionDilate": ngưỡng sáng (keepAlpha: ngưỡng độ đục) + độ nở khi gom vùng liền (lưới B nhiều hình
        # sát nhau: tăng ngưỡng để quầng sáng mờ không nối các hình lại); "keepGrow": nở thêm quanh vùng để giữ quầng sáng mờ
        lab, n = ndi.label(ndi.binary_dilation(lum > sh.get('regionThr', 20), iterations=sh.get('regionDilate', 4)))
        owner = np.zeros(n + 1, int) - 1
        if n:
            cell_of = (np.arange(H)[:, None] // ch).clip(0, gr - 1) * gc + (np.arange(W)[None, :] // cw).clip(0, gc - 1)
            cnt = np.zeros((n + 1, gc * gr), int)
            np.add.at(cnt, (lab.ravel(), cell_of.ravel()), 1)
            owner[1:] = cnt[1:].argmax(1)
        def cell_img(i):
            cy, cx = (i // gc) * ch, (i % gc) * cw
            y0, y1, x0, x1 = max(0, cy - M), min(H, cy + ch + M), max(0, cx - M), min(W, cx + cw + M)
            keep = ndi.binary_dilation(owner[lab[y0:y1, x0:x1]] == i, iterations=sh.get('keepGrow', 3))
            c = np.zeros((ch + 2 * M, cw + 2 * M, NC), np.float32)
            c[y0 - cy + M:y1 - cy + M, x0 - cx + M:x1 - cx + M] = raw[y0:y1, x0:x1] * keep[..., None]
            return c
        cells = [cell_img(i) for i in range(gc * gr)]
        def rect_img(r, feather=(0, 0)):   # cắt đúng khung chữ nhật (đặt như 1 ô có lề M)
            x0, y0, x1, y1 = r
            part = raw[y0:y1, x0:x1].copy()
            fl, fr = feather; xs = np.arange(x1 - x0, dtype=np.float32)
            ramp = np.ones_like(xs)
            if fl: ramp = np.minimum(ramp, np.clip(xs / fl, 0, 1))
            if fr: ramp = np.minimum(ramp, np.clip((x1 - x0 - 1 - xs) / fr, 0, 1))
            part *= (ramp ** 1.5)[None, :, None]   # nền đen: tối đi = trong suốt dần (keepAlpha: màu đã nhân sẵn -> mờ cả độ đục)
            c = np.zeros((ch + 2 * M, cw + 2 * M, NC), np.float32)
            c[M:M + (y1 - y0), M:M + (x1 - x0)] = part
            return c
        for g in sh['groups']:
            if 'rect' in g:
                cells.append(rect_img(g['rect'], g.get('feather', (0, 0)))); g = {**g, 'cells': [len(cells) - 1]}
            idx = g['cells']
            smoke = set(g.get('smoke', []))
            sf = set(g.get('solidFrames', range(len(idx))))
            if keep_alpha:   # bỏ nhân sẵn độ trong (màu thật để ghép atlas)
                imgs = [np.dstack([cells[i][..., :3] / np.maximum(cells[i][..., 3:], 1) * 255, cells[i][..., 3]]) for i in idx]
            else:
                imgs = [key_black(cells[i], g.get('solid') if k in sf else None, g.get('inset', 6), k in smoke, g.get('holeMax')) for k, i in enumerate(idx)]
            # căn khung trong nhóm
            al = g.get('align', 'cell')
            offs = []
            if al == 'core':
                ref = core_point(imgs[0], g.get('coreRegion'))
                for im in imgs:
                    c = core_point(im, g.get('coreRegion')); offs.append((ref[0] - c[0], ref[1] - c[1]))
            elif al == 'bottom':
                x0, y0, x1, y1 = bbox(imgs[0][..., 3]); ref = ((x0 + x1) / 2, y1)
                for im in imgs:
                    a0, b0, a1, b1 = bbox(im[..., 3]); offs.append((ref[0] - (a0 + a1) / 2, ref[1] - b1))
            elif al == 'blob':
                # trùng 1 vật có màu riêng (VD sư tử vàng giữa khiên): khung không thấy vật lấy độ dời của khung gần nhất có thấy
                lo, hi = g['blob']
                pts = [blob_point(im, lo, hi, g.get('blobRegion')) for im in imgs]
                have = [k for k, q in enumerate(pts) if q]
                if not have: raise SystemExit(f"{g['name']}: không thấy màu blob ở khung nào")
                ref = pts[g.get('blobRef', have[0])]
                for k in range(len(imgs)):
                    q = pts[k] or pts[min(have, key=lambda j: abs(j - k))]
                    offs.append((ref[0] - q[0], ref[1] - q[1]))
                print('   blob:', [tuple(round(v) for v in q) if q else None for q in pts])
            else:
                offs = [(0, 0)] * len(imgs)
            pad = max(40, int(max(max(abs(dx), abs(dy)) for dx, dy in offs)) + 4)
            if al == 'blob': g['_blobRef'] = (ref[0] + pad, ref[1] + pad)                                   # ảnh ô đã có lề M quanh ô gốc
            canv = []
            for im, (dx, dy) in zip(imgs, offs):
                c = np.zeros((ch + 2 * (M + pad), cw + 2 * (M + pad), 4), np.float32)
                ox, oy = pad + int(round(dx)), pad + int(round(dy))
                c[oy:oy + im.shape[0], ox:ox + im.shape[1]] = im
                canv.append(c)
            pad += M
            union = np.max([c[..., 3] for c in canv], axis=0)
            x0, y0, x1, y1 = bbox(union, 6)
            x0, y0 = max(0, x0 - 3), max(0, y0 - 3); x1, y1 = x1 + 3, y1 + 3
            crops = [c[y0:y1, x0:x1] for c in canv]
            pv = g.get('pivot', 'center')
            if pv == 'core': p = core_point(crops[0], g.get('coreRegion'))
            elif pv == 'bottom': p = ((x1 - x0) / 2, y1 - y0 - 3)
            elif pv == 'left': p = (3, (y1 - y0) / 2)
            elif pv == 'center': p = ((x1 - x0) / 2, (y1 - y0) / 2)
            elif pv == 'blob': p = (g['_blobRef'][0] - x0, g['_blobRef'][1] - y0)
            else: p = (pv[0] + pad - x0, pv[1] + pad - y0)
            tip = None
            if 'tip' in g:   # điểm phải nhất (VD tay Hộ Vệ đang ném) của 1 khung, tính từ pivot
                k = g['tip']; a = crops[k][..., 3] > 120
                cols = np.where(a.any(0))[0]; xr = cols[-1]; ys = np.where(a[:, xr - 6:xr + 1].any(1))[0]
                tip = [float(xr - p[0]), float(ys.mean() - p[1])]
            s = g.get('scale', sh.get('scale', 0.5))
            out = []
            for c in crops:
                im = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8), 'RGBA')
                out.append(im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS))
            groups.append((g['name'], out, (p[0] * s, p[1] * s), [v * s for v in tip] if tip else None))
            print(f"{sname}/{g['name']}: {len(out)} khung {out[0].size} · căn {al} · pivot {pv}")
    # xếp atlas (kệ)
    pad = 4; maxW = spec.get('maxWidth', 4096)
    items = [(gi, fi, im) for gi, (_, ims, _, _) in enumerate(groups) for fi, im in enumerate(ims)]
    items.sort(key=lambda t: -t[2].height)
    x = y = rowh = 0; pos = {}
    for gi, fi, im in items:
        if x + im.width + pad > maxW: x, y, rowh = 0, y + rowh + pad, 0
        pos[(gi, fi)] = (x + pad, y + pad); x += im.width + pad; rowh = max(rowh, im.height)
    Wt = maxW; Ht = y + rowh + 2 * pad
    Ht = 1 << (Ht - 1).bit_length()
    atlas = Image.new('RGBA', (Wt, Ht))
    meta = {'size': [Wt, Ht], 'groups': {}}
    for gi, (name, ims, p, tip) in enumerate(groups):
        rects = []
        for fi, im in enumerate(ims):
            px, py = pos[(gi, fi)]; atlas.paste(im, (px, py)); rects.append([px, py, im.width, im.height])
        gm = {'size': [ims[0].width, ims[0].height], 'pivot': [round(p[0], 1), round(p[1], 1)], 'frames': rects}
        if tip: gm['tip'] = [round(tip[0], 1), round(tip[1], 1)]
        meta['groups'][name] = gm
    # mép trong suốt lấy màu điểm gần nhất (lọc mipmap không ra viền đen)
    arr = np.asarray(atlas).copy()
    tr = arr[..., 3] == 0
    if tr.any() and (~tr).any():
        _, (iy, ix) = ndi.distance_transform_edt(tr, return_indices=True)
        for c in range(3): arr[..., c] = arr[..., c][iy, ix]
    dst = os.path.join(ROOT, spec['out']); os.makedirs(os.path.dirname(dst), exist_ok=True)
    save_atlas(Image.fromarray(arr, 'RGBA'), dst)
    json.dump(meta, open(os.path.join(ROOT, spec['meta']), 'w'), indent=1)
    print(f'atlas {Wt}x{Ht} -> {dst} · {len(items)} khung')
    if preview:   # ảnh soi: mỗi nhóm 1 hàng trên nền cỏ (như trong game), chấm vàng = pivot, xanh = tip
        rows = []
        for name, ims, p, tip in groups:
            w = sum(im.width + 10 for im in ims) + 160; h = ims[0].height + 10
            r = Image.new('RGB', (w, h), (109, 143, 85)); d = ImageDraw.Draw(r); d.text((4, 4), name, fill=(255, 255, 255))
            x = 150
            for im in ims:
                r.paste(im, (x, 5), im)
                d.ellipse([x + p[0] - 3, 5 + p[1] - 3, x + p[0] + 3, 5 + p[1] + 3], outline=(255, 255, 0), width=2)
                if tip: d.ellipse([x + p[0] + tip[0] - 3, 5 + p[1] + tip[1] - 3, x + p[0] + tip[0] + 3, 5 + p[1] + tip[1] + 3], outline=(0, 255, 255), width=2)
                x += im.width + 10
            rows.append(r)
        Wp = max(r.width for r in rows); Hp = sum(r.height for r in rows)
        pv = Image.new('RGB', (Wp, Hp), (60, 60, 60)); y = 0
        for r in rows: pv.paste(r, (0, y)); y += r.height
        pv.save(preview); print('ảnh soi ->', preview, pv.size)


if __name__ == '__main__':
    a = sys.argv[1:]; pv = None
    if '--preview' in a: i = a.index('--preview'); pv = a[i + 1]; del a[i:i + 2]
    main(a[0] if a else os.path.join(ROOT, 'art/ignar/fx2/fx2_spec.json'), pv)
