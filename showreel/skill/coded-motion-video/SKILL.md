---
name: coded-motion-video
description: Design and render motion graphics videos entirely in code — showreels, logo stings, kinetic typography, title sequences, promo and explainer animations, animated stats, beat-synced social clips — as a frame-exact MP4 with real motion blur and an original synthesized soundtrack. Use this whenever the user asks you to make, animate or render a video or animation yourself, wants to see what you can do as a motion designer, asks for a showreel, sting, intro/outro, kinetic type or motion graphics piece, or needs exact brand colours, typography or timing — even if they never say "code" or "canvas". Prefer it over AI video-generation services whenever the point is your own craft or pixel-exact design; mention those services only for photoreal or live-action footage.
compatibility: Needs Node 18+ with playwright (and its Chromium), Python 3 with numpy, and ffmpeg built with libx264. No GPU required.
---

# Coded Motion Video

You make the video the way a motion designer would: storyboard on a beat grid, animate every
element with intentional easing, cut on the music, polish, review frame by frame. The difference is
that every frame is a **pure function of time** drawn with Canvas 2D in headless Chromium, and the
score is **synthesized in numpy on the same grid**. That buys you frame-exact sync, parallel
rendering, true sub-frame motion blur, and a build that is fully reproducible from source.

A 15 s 1080p60 piece takes about 2 minutes to build on 4 cores. You will iterate several times,
so the loop is cheap. Use it.

## What's in this skill

| Path | Use |
|---|---|
| `templates/reel.html` | Starting point. A working engine with config, palette, scene table, cut-aware motion blur, shake, chromatic split, flashes, vignette, HUD and `?t=` / `?play` previews, plus four demo scenes. Copy it and replace the scenes. |
| `templates/score.py` | Starting point for the soundtrack (uses `score_kit`). |
| `scripts/score_kit.py` | numpy synth. It has drums, booms, risers, whooshes, pads, bass, plucks, bells, blips, bloops and clicks, plus sidechain, reverb and a gain-staged mixdown that prints per-bar bus levels. |
| `scripts/render.mjs` | Parallel frame renderer. `stills` gives quick PNGs; `video` gives lossless FFV1 chunks. |
| `scripts/build.sh` | `build.sh reel.html score.py out.mp4` runs score → frames → final H.264 + AAC with BT.709 tags and grain. |
| `scripts/review.py` | Your eyes and ears: contact sheets, cut strips, frame grids, crops, loudness, waveform/spectrogram, colour sampling, probe. |
| `references/motion-recipes.md` | How to build specific effects and transitions (read when designing scenes). |
| `references/sound-design.md` | Mapping picture events to sound, arrangement shape, mix targets. |
| `assets/example-reel/` | A complete 15 s, 8-scene showreel (`reel.html`, `score.py`, `contact-sheet.jpg`). Read it for patterns. The scene functions `S1`…`S8` are self-contained. |

## Workflow

### 0 · Check the machine

```sh
node -e "import('playwright').then(()=>console.log('playwright ok'))" || ls /opt/node-tools/node_modules/playwright
python3 -c "import numpy; print('numpy', numpy.__version__)"
ffmpeg -hide_banner -encoders | grep -E "libx264|ffv1"
fc-list : family | sort -u          # pick a heavy display face (e.g. "Inter Display" 900) + a text face
```

`render.mjs` finds playwright through a normal import, `PLAYWRIGHT_MODULE`, or common global paths.
Never run `playwright install` when a Chromium is already provisioned.

Work in a project folder. Copy `templates/reel.html`, `templates/score.py` and
`scripts/score_kit.py` into it (score.py imports score_kit from its own folder).

### 1 · Pre-production: lock the grid, then storyboard in beats

Pick the BPM so the duration is a whole number of bars: `BPM = beats × 60 / seconds`.

| Duration | BPM | Beats |
|---|---|---|
| 6 s | 120 | 12 |
| 7.5 s | 128 | 16 |
| 10 s | 120 | 20 |
| 15 s | 128 | 32 |
| 30 s | 128 | 64 |

Stay roughly in 110–130 BPM for energy. Non-integer frames per beat are fine.

Write a storyboard table before any code: `beats | scene idea | how it hands off to the next | key sounds`.
What makes it read as a *designer's* reel rather than a tech demo:
- **One idea per scene.** Each scene shows off one skill (timing, type, systems, 3D, fluids,
  rhythm, particles…) and lasts 2–4 beats. Fast cuts (½ or ¼ beat) are for montage builds.
- **Every hand-off is designed.** Prefer match cuts, where the last frame of one scene becomes
  the first of the next. For example: a shape grows to fill the frame and becomes the next background;
  type pixelates into dots that become a grid; a grid arc becomes a 3D ring; a blob floods the
  screen. Hard cuts land on beats and flip the background/foreground contrast.
- **An energy arc:** sparse hook → groove → breathing room (breakdown) → build (countdown) → drop →
  an end card held for at least 1.5–2 s. Bookend it if you can (the opening object returns at the end).
- **A tight palette:** 4–5 colour tokens with one accent. Assign background and foreground per scene so
  consecutive scenes contrast. If the user has a brand, use their exact colours and fonts.

Tell the user the plan in a few lines (concept, scenes, length), then build. Don't wait for
approval unless something is genuinely ambiguous (brand, name, aspect ratio, required copy).

### 2 · Build the renderer

Edit the copied `reel.html`: CONFIG (size, FPS, BPM, BEATS), palette, scene functions, then the
`SCENES`, `CUTS`, `IMPACTS`, `FLASHES` and `CHAPTERS` tables. The engine below them rarely needs changes.
These rules exist because the pipeline depends on them:

- **Time in, pixels out.** A scene draws from `(t, b, lb)` alone, with no state carried between
  calls. Use `hash(i, seed)` instead of `Math.random()`. Workers render frame ranges independently,
  and motion blur calls each frame 6 times at slightly different times, so stateful code breaks
  both.
- **Think in beats.** Write every animation as `prog(b, start, end)` through an ease, so moving
  a hit means editing one number, and the score can use the same numbers.
- **Register every hard cut in `CUTS`.** Otherwise the blur samples straddle the cut and you get
  a muddy one-frame dissolve.
- **Register impacts** (shake, chroma) and **flashes** on big hits only. They lose meaning if
  everything shakes.
- **Batch drawing.** Build a `Path2D` per colour and fill or stroke it once. Wrap state changes
  (`letterSpacing`, `globalAlpha`, clip) in `save()/restore()`. Fill backgrounds with overscan (`bg()`)
  so shake never reveals edges.
- **Precompute in `init()`.** Text-pixel sampling, grids and particle tables go there, not in the frame loop.
- **Budget:** aim under ~150 ms per sub-frame. Per-pixel work (metaballs) is the expensive part.
  For heavy scenes, lower the sample count by beat inside `renderFrame` (for example 3–5 instead of 6).

Read `references/motion-recipes.md` for the effects (physical bounces, masked and elastic type,
type-to-dots, dual-grid/Truchet morphs, point-cloud morphs, metaballs, montage panels, particle
convergence to text, end cards, post effects).

### 3 · Look before you render everything

```sh
node scripts/render.mjs reel.html stills stills 0.5,1.2,2.4,3.3     # seconds; 1–2 per scene
python3 scripts/review.py stills stills sheet.png                   # then Read sheet.png
python3 scripts/review.py crop stills/still_00072.png crop.png 600 200 900 500   # full-res detail
```

Stills take seconds. Iterate on composition, type size, colour and clutter here, not after a full render.
A still only shows one instant, though. Motion bugs need step 6.

### 4 · Score it

Edit `score.py` so every visual event has a sound at the same beat. Use impacts on scene cuts,
blips for bounces, clicks for UI-ish reveals, bloops for liquids, whooshes for camera moves, a riser
plus snare roll before the drop, and a ringing chord under the end card. `Score.mixdown()` prints
per-bar RMS for each bus. Then:

```sh
python3 score.py score.wav
python3 scripts/review.py loudness score.wav        # aim for I ≈ -16..-13 LUFS, peak ≤ -1 dBFS
python3 scripts/review.py audiovis score.wav vis.png  # check its structure matches the storyboard
```

You cannot listen. Lean on the beat grid, the per-bar level table and the waveform image, and tell
the user honestly that the mix was checked by measurement. See `references/sound-design.md`.

### 5 · Build

```sh
scripts/build.sh reel.html score.py out/reel.mp4 [workdir]     # WORKERS=4 CRF=19 GRAIN=3 by default
```

It renders lossless RGB chunks, then does exactly one RGB → BT.709 conversion with proper tags, so
colours don't shift in players. It also adds faint temporal luma grain against banding, encodes AAC
256k, and puts the index at the start of the file for streaming. Keep the work dir out of git (it's
hundreds of MB).

### 6 · Review in motion (this is where the real bugs are)

```sh
python3 scripts/review.py sheet  out/reel.mp4 sheet.png --every 30            # whole piece at a glance
python3 scripts/review.py strips out/reel.mp4 cuts.png --frames 112,225,450   # 8 consecutive frames per cut
python3 scripts/review.py frames out/reel.mp4 phase.png --frames 700,712,722,730  # inside complex moves
python3 scripts/review.py color  out/reel.mp4 130 960 150 '#E8613C'
python3 scripts/review.py probe  out/reel.mp4
```

A cut at beat `k` sits at frame `round(k × 60/BPM × FPS)`. Strip every cut. Also strip the hand-off
points *inside* scenes, where one motion phase starts another (burst → vortex → assemble). Jumps
between consecutive frames show up clearly there. Go through the failure-mode list below for every
review, fix, rebuild, and re-check. Two or three passes is normal.

### 7 · Deliver

Send the MP4 with your file-sending tool (rendered inline), plus the contact sheet if helpful.
Summarise it scene by scene in plain language, give the specs (length, resolution, fps, size,
loudness), and say what you verified and what you couldn't (you haven't heard it). In a repo,
commit the source, the build script and the final MP4. Ignore `.build/` and `node_modules/`.

## Craft principles

- **Ease everything.** Use `EZ` (hard in, buttery out) for big moves, `outExpo` for arrivals, `inExpo`
  for exits and dives, and `spring()` for overshoot and settle. Linear motion only for continuous
  drift and rotation.
- **Animation fundamentals carry the "pro" feel.** Use anticipation before big moves, squash and
  stretch that preserves volume (sx = 1/sy), physically consistent gravity (one g for every
  bounce), staggered offsets (0.03–0.07 beats per letter or element), and follow-through.
- **Nothing is ever static.** Add a slow 2–5% push-in, a drifting background row or a rotating badge.
  The end card breathes too.
- **Hits on the beat, motion between beats.** Big changes land exactly on beats. Everything else
  flows across them.
- **Restraint with post.** Use shake, chromatic split and flashes on maybe five moments in 15 s. Use a
  subtle vignette and faint grain throughout.
- **Designer details** sell the reel when they stay small and quiet. Examples: a HUD with chapter
  labels, timecode and beat lights; a live graph-editor curve; onion-skin spacing ghosts; a 3D callout
  label; a viewfinder frame.

## Failure modes seen before (check these on every review)

| Symptom | Cause | Fix |
|---|---|---|
| Particles teleport and long lines streak across the frame when a phase starts | The composite transform isn't the identity at u=0 (e.g. spiral rotation `φ·(1−u)` instead of `φ·u`) | Make every phased move equal its start pose at u=0 and its end pose at u=1. Strip the phase boundary. |
| A burst turns into a grey haze | Thousands of long streaks averaged by motion blur | Cap streak length (~30–120 px, varied), use thinner lines |
| 3–4 washed-out frames after a hit | The flash decays too slowly | Decay the flash in about 3 frames (`exp(-48·dt)`); the engine default does this |
| A one-frame cross-dissolve at a cut | The cut isn't in `CUTS` | Add it |
| A metaball merge looks polygonal | Symmetric satellite balls | Shrink the satellites as the blobs merge |
| A 3D label covers the object | The label is anchored to a moving vertex | Use a fixed label position with a leader line to the vertex |
| Letters jitter or kerning breaks in per-letter animation | Glyph widths measured individually | Use `layout()` prefix widths (keeps kerning); reset `letterSpacing` via save/restore |
| The opening seconds feel empty | The first action starts too late | Start something within about 0.3 s (a line drawing in, the HUD sliding in) |
| The audio measures around -7 LUFS and is crushed | Buses summed far past full scale into the soft clipper | Normalise before the clipper (`Score.mixdown` does). Keep bus gains sane. |
| Sampled colours read dark | Sampled inside the vignette or grain | Sample near the centre; ≤3 code values of error is fine |
| Slow frames (~1 s) | GPU emulation in headless Chromium | Launch with `--disable-gpu --disable-accelerated-2d-canvas` (render.mjs does). Export with `toDataURL`, not screenshots. |

## Performance reference (4 cores, 1080p60, 6 sub-samples)

- **Stills:** about 20 s for ~10 frames, including startup.
- **Full render:** about 80–90 s for 900 frames. Simple vector scenes take 60–150 ms per frame;
  metaball and 3,000-particle scenes 300–800 ms.
- **Encode:** about 40–60 s. Output is about 20–25 MB for 15 s at CRF 19 with grain 3. Raise CRF or
  lower GRAIN for smaller files.
