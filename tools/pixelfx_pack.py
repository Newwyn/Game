"""Gộp các tấm khung pixelfx (node tools/render.mjs <id> --sheet trong thư viện pixelfx) thành 1 atlas cho makeFlipbook().

    .team\\pyenv\\Scripts\\python.exe tools/pixelfx_pack.py art/sylva/pixel/pixel_spec.json

spec: { "src": "C:/Users/Admin/pixelfx/records", "out": "src/assets/sprites/sylva_px.png", "meta": "src/vfx/sylvaPx.json",
        "groups": { "<tên nhóm trong game>": "<id pixelfx, VD nature/sylva-leaf-dart>", ... } }
Giữ NGUYÊN từng điểm ảnh (không co giãn, không lọc) — game phóng to bằng lọc NEAREST (makeFlipbook(..., { pixel: true })).
json ra: { size: [W, H], groups: { tên: { size: [w, h], pivot: [px, py], frames: [[x, y, w, h], ...], fps, loop } } }
(cùng định dạng tools/fx_grid_pack.py nên sylvaFx.js dùng chung hàm playArt / shootArt / groundArt).
"""
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(spec_path):
    spec = json.load(open(os.path.join(ROOT, spec_path), encoding="utf-8"))
    src = spec["src"]
    items = []
    def load_part(g):
        """1 phần: "id" · {"id", "pick"} · {"id", "n"} -> (danh sách khung, meta pixelfx)"""
        if isinstance(g, str): g = {"id": g}
        fid = g["id"]
        d = os.path.join(src, *fid.split("/"))
        base = fid.split("/")[-1]
        meta = json.load(open(os.path.join(d, base + ".json"), encoding="utf-8"))
        sheet = Image.open(os.path.join(d, base + ".png")).convert("RGBA")
        frames = [sheet.crop((f["frame"]["x"], f["frame"]["y"], f["frame"]["x"] + f["frame"]["w"], f["frame"]["y"] + f["frame"]["h"]))
                  for f in meta["frames"]]
        px = meta["meta"]["pixelfx"]
        if "pick" in g:
            frames = [frames[i] for i in g["pick"]]
        elif "n" in g:
            usable = len(frames) if px["loop"] else max(1, len(frames) - 1)
            frames = [frames[int(i * usable / g["n"])] for i in range(g["n"])]
        return frames, px

    for gname, g in spec["groups"].items():
        # g: "id" (mọi khung) · {"id", "pick": [chỉ số khung]} · {"id", "n": N} (N khung rải đều, bỏ khung trống cuối của hiệu ứng 1 lần)
        #   -> giữ đúng SỐ KHUNG mà mã hiệu ứng của game đang dùng (VD fireFx.js của Ignar: 4 / 8 khung)
        #   · {"parts": [phần, ...], "tip": [x, y]}: nối nhiều hiệu ứng CÙNG cỡ khung + gốc (VD Hộ Vệ: bay 4 + ném 2 + gầm 2);
        #     tip = điểm bàn tay TÍNH TỪ GỐC (pivot) của khung, px, y xuống (như fx_grid_pack) -> json "tip" (fireFx.js: chỗ cầu lửa bay ra)
        if isinstance(g, dict) and "parts" in g:
            frames, px = [], None
            for part in g["parts"]:
                fr, p = load_part(part)
                frames += fr
                px = px or p
            if "tip" in g: px = {**px, "tip": g["tip"]}
            items.append((gname, frames, px))
            continue
        if isinstance(g, str): g = {"id": g}
        fid = g["id"]
        d = os.path.join(src, *fid.split("/"))
        base = fid.split("/")[-1]
        meta = json.load(open(os.path.join(d, base + ".json"), encoding="utf-8"))
        sheet = Image.open(os.path.join(d, base + ".png")).convert("RGBA")
        frames = [sheet.crop((f["frame"]["x"], f["frame"]["y"], f["frame"]["x"] + f["frame"]["w"], f["frame"]["y"] + f["frame"]["h"]))
                  for f in meta["frames"]]
        px = meta["meta"]["pixelfx"]
        if "pick" in g:
            frames = [frames[i] for i in g["pick"]]
        elif "n" in g:
            usable = len(frames) if px["loop"] else max(1, len(frames) - 1)
            frames = [frames[int(i * usable / g["n"])] for i in range(g["n"])]
        items.append((gname, frames, px))
    # xếp hàng: mỗi nhóm nối tiếp, xuống dòng khi quá maxWidth
    maxW = spec.get("maxWidth", 2048)
    pad = 2
    x = y = rowH = 0
    place = []
    for gname, frames, px in items:
        for im in frames:
            w, h = im.size
            if x + w > maxW:
                x, y, rowH = 0, y + rowH + pad, 0
            place.append((gname, im, x, y))
            x += w + pad
            rowH = max(rowH, h)
    W = maxW if y > 0 else max(p[2] + p[1].size[0] for p in place)
    H = y + rowH
    atlas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out = {"size": [W, H], "groups": {}}
    for gname, frames, px in items:
        fw, fh = px["frameSize"]
        out["groups"][gname] = {"size": [fw, fh], "pivot": px["pivot"], "frames": [], "fps": px["fps"], "loop": px["loop"], "id": px["id"]}
        if "tip" in px: out["groups"][gname]["tip"] = px["tip"]
    for gname, im, gx, gy in place:
        atlas.paste(im, (gx, gy))
        out["groups"][gname]["frames"].append([gx, gy, im.size[0], im.size[1]])
    atlas.save(os.path.join(ROOT, spec["out"]), optimize=True)
    json.dump(out, open(os.path.join(ROOT, spec["meta"]), "w", encoding="utf-8"))
    for g, d in out["groups"].items():
        print(f"{g}: {len(d['frames'])} khung {d['size']} pivot {d['pivot']} {d['fps']}fps {'loop' if d['loop'] else 'once'}")
    print(f"atlas {W}x{H} -> {spec['out']}")


if __name__ == "__main__":
    main(sys.argv[1])
