#!/usr/bin/env bash
# Builds claude-showreel.mp4 from scratch: synthesize the score, render 900 frames, encode.
#   ./build.sh [workdir]
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
work="${1:-$here/.build}"
mkdir -p "$work"

python3 "$here/score.py" "$work/score.wav"
node "$here/render.mjs" video "$work/frames" "${WORKERS:-4}"

ls "$work"/frames/chunk_*.mkv | sort -V | sed "s|^|file '|; s|$|'|" > "$work/chunks.txt"

# One RGB -> BT.709 conversion, a whisper of temporal luma grain, broadcast-safe tags.
ffmpeg -y -loglevel error -f concat -safe 0 -i "$work/chunks.txt" -i "$work/score.wav" \
  -vf "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p,noise=c0s=3:c0f=t+u" \
  -c:v libx264 -preset slow -crf 19 -profile:v high -level 4.2 -g 60 -bf 2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest \
  "$here/claude-showreel.mp4"

ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact "$here/claude-showreel.mp4"
