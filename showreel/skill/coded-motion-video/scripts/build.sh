#!/usr/bin/env bash
# One-command build: synthesize score -> render all frames -> encode the deliverable.
#   build.sh <reel.html> <score.py> <out.mp4> [workdir]
# Env: WORKERS (default 4), CRF (default 19), GRAIN (luma grain strength, default 3, 0 = off)
set -euo pipefail
reel="$1"; score="$2"; out="$3"; work="${4:-$(dirname "$out")/.build}"
here="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$work"; rm -f "$work"/frames/chunk_*.mkv

python3 "$score" "$work/score.wav"
node "$here/render.mjs" "$reel" video "$work/frames" "${WORKERS:-4}"
ls "$work"/frames/chunk_*.mkv | sort | sed "s|^|file '|; s|$|'|" > "$work/chunks.txt"

grain=""; [ "${GRAIN:-3}" != "0" ] && grain=",noise=c0s=${GRAIN:-3}:c0f=t+u"
# Exactly one RGB -> BT.709 conversion (intermediates are lossless RGB), tagged so players don't shift colours.
ffmpeg -y -loglevel error -f concat -safe 0 -i "$work/chunks.txt" -i "$work/score.wav" \
  -vf "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p$grain" \
  -c:v libx264 -preset slow -crf "${CRF:-19}" -profile:v high -g 60 -bf 2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "$out"

python3 "$here/review.py" probe "$out"
