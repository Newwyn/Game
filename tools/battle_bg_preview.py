# Xem trước: chiếu phối cảnh giống máy quay trận (core/cameraRig.js chế độ combat) — không cần chạy game
import sys, json, math
import numpy as np
from PIL import Image
from pathlib import Path

F = np.float32


def srgb2lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def lin2srgb(c): return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
def hx(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], F)


def sample(tex, u, v, wrap=False):
    h, w = tex.shape[:2]
    x = u * w - 0.5; y = (1 - v) * h - 0.5
    if wrap:
        x %= w; y %= h
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
    def g(yy, xx):
        if wrap: return tex[yy % h, xx % w]
        return tex[np.clip(yy, 0, h - 1), np.clip(xx, 0, w - 1)]
    return (g(y0, x0) * (1 - fx) + g(y0, x0 + 1) * fx) * (1 - fy) + (g(y0 + 1, x0) * (1 - fx) + g(y0 + 1, x0 + 1) * fx) * fy


def render(folder, key, info, W=1280, Hh=720, dist=22, focus_x=0.0, near=32, far=90):
    load = lambda p: np.asarray(Image.open(Path(folder) / f'{key}_{p}.webp').convert('RGBA'), F) / 255
    back, mid, gnd = load('back'), load('mid'), load('ground')
    pitch = math.radians(14); fov = math.radians(38)
    fy = 0.8
    cam = np.array([focus_x, fy + math.sin(pitch) * dist, math.cos(pitch) * dist], F)
    fwd = np.array([0, -math.sin(pitch), -math.cos(pitch)], F)
    right = np.array([1, 0, 0], F); up = np.cross(right, fwd)
    t = math.tan(fov / 2)
    px = (np.arange(W, dtype=F) + 0.5) / W * 2 - 1; py = 1 - (np.arange(Hh, dtype=F) + 0.5) / Hh * 2
    d = fwd[None, None] + px[None, :, None] * t * W / Hh * right[None, None] + py[:, None, None] * t * up[None, None]
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    fogc = srgb2lin(hx(info['fog'])); sky = srgb2lin(hx(info['sky']))
    out = np.broadcast_to(sky, (Hh, W, 3)).copy()
    depth = np.full((Hh, W), 1e9, F)
    # tấm xa z=-50 (200x18) — không sương, không đèn
    def plane(tex, z, w, h, alpha):
        nonlocal out
        s = (z - cam[2]) / d[..., 2]
        p = cam + d * s[..., None]
        u = p[..., 0] / w + 0.5; v = (p[..., 1] - (-0.5 - 1)) / h
        ok = (s > 0) & (v >= 0) & (v <= 1) & (u >= 0) & (u <= 1)
        c = sample(tex, np.clip(u, 0, 1), np.clip(v, 0, 1))
        a = (c[..., 3:4] if alpha else 1.0) * ok[..., None]
        return srgb2lin(c[..., :3]), a, s
    cb, ab, sb = plane(back, -50, 200, 18, False)
    out = out * (1 - ab) + cb * ab
    # mặt đất y=-0.5 (lặp 8 đơn vị/ô), có đèn + sương
    s = (-0.5 - cam[1]) / np.minimum(d[..., 1], -1e-6)
    p = cam + d * s[..., None]
    okg = (d[..., 1] < 0) & (p[..., 2] > -50) & (np.abs(p[..., 0]) < 110)
    cg = srgb2lin(sample(gnd, p[..., 0] / 8, -p[..., 2] / 8, True)[..., :3])
    L = info.get('light', 1.5); sun = srgb2lin(hx(info['sun']))
    lit = (max(0.65, L * 0.75) * sun + 0.25 + L * 0.81 * sun) / math.pi
    cg = cg * lit
    fg = np.clip((s - near) / (far - near), 0, 1)[..., None]
    cg = cg * (1 - fg) + fogc * fg
    out = np.where(okg[..., None], cg, out)
    cm, am, sm = plane(mid, -30, 150, 9, True)
    vis = (sm < s) | ~okg                     # tấm gần bị mặt đất che phần chân
    am = am * vis[..., None]
    out = out * (1 - am) + cm * am
    return Image.fromarray((np.clip(lin2srgb(out), 0, 1) * 255).astype(np.uint8))


if __name__ == '__main__':
    folder, outp = sys.argv[1], sys.argv[2]
    meta = json.loads((Path(folder) / 'battle_bg.json').read_text())
    for key in sys.argv[3:]:
        ims = [render(folder, key, meta[key], dist=22, focus_x=0), render(folder, key, meta[key], dist=14, focus_x=-30), render(folder, key, meta[key], dist=30, focus_x=28)]
        sheet = Image.new('RGB', (1280, 720 * 3 + 16), '#111')
        for i, im in enumerate(ims):
            sheet.paste(im, (0, i * 728))
        sheet.save(f'{outp}/{key}_preview.png')
