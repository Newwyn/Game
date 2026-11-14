#!/usr/bin/env bash
# Tải mô hình Meshy (đã giảm mặt ~30K trên Meshy) rồi thu ảnh dán về 1024 webp cho game
#   bash tools/meshy_get.sh <tên> '<link glb của Meshy>'  -> art/battle3d/meshy/<tên>_raw.glb + src/assets/world3d/meshy/<tên>.glb
set -e
N="$1"; URL="$2"
mkdir -p art/battle3d/meshy src/assets/world3d/meshy
curl -s -L -o "art/battle3d/meshy/${N}_raw.glb" "$URL"
T=$(mktemp -d)
npx -y @gltf-transform/cli@4 resize "art/battle3d/meshy/${N}_raw.glb" "$T/c.glb" --width 1024 --height 1024 >/dev/null
npx -y @gltf-transform/cli@4 webp "$T/c.glb" "src/assets/world3d/meshy/${N}.glb" --quality 86 >/dev/null
rm -rf "$T"
ls -la "src/assets/world3d/meshy/${N}.glb"
