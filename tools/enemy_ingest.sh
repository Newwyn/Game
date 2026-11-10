#!/usr/bin/env bash
# Nhận tranh Flow của 1 quái (~/Downloads/<art>-sprite-<tấm>.jpg) -> xoá dấu Flow -> spec -> đóng gói atlas
#   bash tools/enemy_ingest.sh <art> [--debug ảnh_soi.png]
set -e
cd "$(dirname "$0")/.."
art="$1"; shift || true
mkdir -p "art/enemies/$art/sprite"
for f in ~/Downloads/"$art"-sprite-*.jpg; do
  [ -e "$f" ] || continue
  b=$(basename "$f"); mv "$f" "art/enemies/$art/sprite/${b#"$art"-}"
done
export PYTHONIOENCODING=utf-8
UV="uv run --no-project --with numpy --with pillow --with scipy --with scikit-image --with opencv-python python"
$UV tools/flow_mark_sheet.py "$art" | tail -n +2
python tools/enemy_spec.py "$art" > /dev/null
$UV tools/sprite_pack.py "art/enemies/$art/sprite/sprite_spec.json" "$@" | tail -2
