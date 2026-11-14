#!/usr/bin/env bash
# Làm nhẹ mô hình Meshy cho game: giảm mặt (meshopt simplify) + ảnh dán 1024 webp, bỏ ảnh kim loại / nhám (đồ vật vẽ tay không cần)
#   bash tools/meshy_opt.sh <vào.glb> <ra.glb> [tỉ lệ giữ mặt, mặc định 0.03]
set -e
IN="$1"; OUT="$2"; RATIO="${3:-0.03}"
T=$(mktemp -d)
npx -y @gltf-transform/cli@4 weld "$IN" "$T/a.glb" >/dev/null
npx -y @gltf-transform/cli@4 simplify "$T/a.glb" "$T/b.glb" --ratio "$RATIO" --error 0.002 >/dev/null
npx -y @gltf-transform/cli@4 resize "$T/b.glb" "$T/c.glb" --width 1024 --height 1024 >/dev/null
npx -y @gltf-transform/cli@4 webp "$T/c.glb" "$OUT" --quality 86 >/dev/null
npx -y @gltf-transform/cli@4 inspect "$OUT" 2>/dev/null | grep -E "renderVertexCount|size|glPrimitives" | head -6 || true
ls -la "$OUT"
rm -rf "$T"
