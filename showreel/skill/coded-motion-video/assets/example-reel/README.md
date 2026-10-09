# Example: "Claude — Motion Reel 2026"

A finished 15 s, 1920×1080 @ 60 fps showreel built with this skill. `contact-sheet.jpg` shows one frame
every 0.5 s.

- `reel.html` has eight scenes on a 128 BPM grid (32 beats). Each scene is one function:
  - `S1` timing and spacing
  - `S2` kinetic type
  - `S3` dual-grid and Truchet systems
  - `S4` point-cloud 3D
  - `S5` metaballs
  - `S6` montage and countdown
  - `S7` particle convergence
  - `S8` end card
- `score.py` is the standalone score for it. It predates `score_kit.py`, which was extracted from
  it, so the instruments are the same.

To render it with the skill scripts:

```sh
node ../../scripts/render.mjs reel.html stills /tmp/ex 2.0,7.0,11.6
python3 score.py /tmp/ex/score.wav && ../../scripts/build.sh reel.html score.py /tmp/ex/reel.mp4
```

Note that `build.sh` runs `score.py out.wav`, and this score takes its output path as argv[1] too.
