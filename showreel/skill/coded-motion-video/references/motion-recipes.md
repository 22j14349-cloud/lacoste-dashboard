# Motion recipes

Proven effects and transitions for the Canvas engine. Each recipe gives the core math and points to
a full implementation in `assets/example-reel/reel.html`, where the function names are shown in
brackets. All time inputs are beats `b` unless marked as seconds.

Contents
1. Physical bounce: gravity, squash & stretch, onion skins, graph editor
2. Kinetic type: masked rise, implode, gravity drop, elastic stretch, typewriter
3. Type → dots → grid (pixelate-and-scatter transition)
4. Dual-grid morph and Truchet labyrinth, with a zoom into one ring
5. Point-cloud 3D: coherent morphs, camera, dolly-through, tracked callout
6. Metaballs: implicit field, gradient anti-aliasing, mitosis, flood transition
7. Montage panels for ½-beat cuts, and a countdown
8. Particle convergence: burst → vortex → spiral into text
9. End card and bookend
10. Post: motion blur, shake, chromatic split, flash, vignette, grain
11. Transition cookbook

---

## 1. Physical bounce  [`s1Base`, `s1Ball`, `S1`]

- **One gravity constant for everything**, in px per beat² (the example uses 3440). A bounce lasting
  `T` beats has launch speed `gT/2`, height `h(u) = ½gT·u − ½g·u²`, and apex `gT²/8`.
- **Settling ball:** shrink each bounce period by a restitution factor `e ≈ 0.5` (hits at 1, 2, 2.5,
  2.75, 2.875 beats). That reads as physically right, and the hits accelerate musically.
- **Drop from rest:** `y = yg − ½g·T² + ½g·τ²` with τ measured from release.
- **Stretch along velocity:** take a numeric derivative, `s = 1 + 0.32·clamp(|v|/vmax)`, scale
  `(s, 1/s)` after rotating to `atan2(vy, vx)`. Lift the centre so the stretched ellipse never sinks
  into the floor.
- **Impact squash:** lasts about 0.075 beats, `q = sin(π·dt/0.075)·amp`, `sx = 1+0.5q`, `sy = 1−0.45q`,
  with the bottom pinned to the floor.
- **Anticipation then launch:** squash into the floor over 0.3 beats, then release with a vertical
  stretch that relaxes. For a "dive at the lens", grow the radius with `inExpo` until it covers the
  frame. The ball's colour then becomes the next scene's background (a match cut).
- **Craft extras:** onion-skin ghosts (outline circles at `b − k·0.06`, fading alpha), floor ripples
  (ellipses with ry ≈ 0.13·rx), dust particles under the same gravity, and a small "graph editor"
  panel that plots height against time with a playhead. Animators recognise these instantly.

## 2. Kinetic type  [`S2`, `layout`, `wordGeom`]

- **Per-letter layout:** `xs[i] = measureText(text.slice(0, i)).width`. Prefix widths keep kerning.
  `wordGeom()` fits a word to a maximum width and centres it. Measure the cap height once with
  `measureText('H').actualBoundingBoxAscent`.
- **Masked rise:** clip to the text's cap box, and offset each letter's y by
  `(1 − outExpo(p))·(cap + 40)` with `p = prog(b − start − i·0.055, 0, 0.5)`. Add a small rotation
  that resolves to 0. Exit by reversing with `inCubic`.
- **Implode:** letters start at scale 2.6 and alpha 0, staggered from the centre outwards
  (`|i − mid|·0.06`), and arrive with `outExpo`.
- **Gravity drop:** fall with `u²` over about 0.14 beats while stretched (`sy = 1 + 0.3u`), then land
  with a damped squash `exp(−dt·14)·cos(dt·2π·5)`, anchored at the baseline.
- **Elastic stretch:** `scaleY = spring(lt_seconds, 2.6, 7.5)`, anchored at the baseline, staggered
  0.035 beats.
- **Typewriter labels:** `text.slice(0, floor(prog·len))`.
- **Background texture:** outlined rows of a tagline scrolling in alternate directions at low alpha.
  This gives depth for very little cost.
- **Puns sell:** viewfinder brackets that snap around "FRAME", a toggle switch that flips under
  "ON", a full stop that is the hero ball.

## 3. Type → dots → grid  [`S2` PURPOSE branch, `init` PDOTS/PFILL]

1. In `init()`, draw the word on an offscreen canvas (`willReadFrequently: true`). Sample alpha on a
   step grid of about 12 px to get a list of dots.
2. Swap the text for dots with radius `0.62·step`. They overlap, so the swap is nearly invisible.
   Then shrink them to the grid-dot radius.
3. Target cell for each dot: normalise its position inside the word's bounding box, then map it to
   grid columns and rows. The text "expands" into the grid.
4. Fly with a stagger by x (`delay = 0.3·x/W`), using `EZ` and an arc offset
   `perp·sin(πu)·rand(±70)`.
5. Cells with no dot pop in with `outBack` so the grid is complete on the downbeat.

## 4. Dual-grid morph and Truchet  [`S3`, `init` GRID]

**Key fact:** an inscribed circle's quarter-arc between two edge midpoints, reflected across their
chord, is exactly the corner-centred Truchet arc.

- **Morph parameter:** for each arc point P, project it onto the chord to get M, then draw
  `M + k·(P − M)`. At k = 1 you get circles in each cell; at k = 0, diamonds (a lattice); at
  k = −1, four corner arcs per cell, which join into circles around the grid *vertices* (a dual-grid
  flip).
- **Truchet selection:** each cell keeps two opposite quarters (by hash). Trim the other two by
  drawing a shrinking angular sub-range centred on their midpoint.
- **Waves:** rotate each cell's geometry by 90° with `inOutCubic`, delayed by distance from an origin
  (centre-out, then left-to-right on a random subset). Flip the colours on the beat between waves.
  Pulse the stroke width on each kick.
- **Zoom into one ring:** force the four cells around a vertex V to keep the arcs at V. Remember
  that a 90° rotation toggles orientation, so pre-flip the cells the wave will rotate. Then zoom with
  `z = zmax^EZ(p)`, translating V to the screen centre and keeping the stroke width in screen space.
  Fade every non-ring arc. Size the ring to match the radius the next scene starts with.

## 5. Point-cloud 3D  [`S4`, `SHAPES`, `MORPHS`, `s4Pos`, `s4Cam`]

- Give each point a fixed `(u, v)` on a grid (for example 72×36). Every shape is a function of
  `(u, v)`, so morphs are coherent: ring, sphere (φ = π(0.03 + 0.94v)), torus, a wave field
  (`x = (u−.5)·3.8`, `z = (v−.5)·2.6`, height from ripples launched on every beat), and a twisted
  tunnel along z.
- **Morph:** `lerp(A, B, EZ(prog(b, start + stagger, start + stagger + dur)))`, staggered by
  `|v − .5|` or `u`.
- **Camera:** yaw, then pitch, then perspective, `screen = centre + x·K/zc` with
  `K = radiusPx·D`. A ring seen from pitch π/2 is a flat circle (matching the previous scene's 2D
  ring); easing pitch down reveals the 3D. Blend yaw and pitch to 0 for the tunnel and dolly
  forward with `inExpo` until the points pass the camera. Skip points with `zc < 0.12`.
- **Rendering:** draw mesh polylines along rows and columns at about 0.14 alpha, then points sized
  `≈3.4·D/zc` with alpha falling off by depth. Use one accent band of rows in the accent colour. Add a
  soft radial glow behind.
- **Designer extras:** an axis gizmo in the corner (project unit axes with the camera rotation), and a
  callout with a **fixed** label (shape name, vertex count, live yaw) whose leader line follows a
  tracked vertex.

## 6. Metaballs  [`s5Balls`, `drawMetaballs`, `S5`]

- **Field:** `f = Σ r²/d²`. Gradient `∇f = Σ −2r²(p − c)/d⁴`. Anti-aliased alpha
  `a = clamp(0.5 + (f − 1)/|∇f|)`, which is a signed distance in pixels and gives crisp edges at full
  resolution. Compute only inside the balls' bounding box (pad by 2.3r) into a reused `ImageData`.
- **Mitosis for free:** n coincident balls of radius r look like one ball of radius `√n·r`. Start
  4 coincident balls at `r0/2`, then move them apart in two stages to get one, then two, then four
  cells, with area conserved and a natural gooey bridge that snaps.
- **Organic wobble:** small satellites orbiting each cell. Shrink them as the cells merge, or the
  merged blob looks polygonal.
- **Droplets:** small balls peeling off parents along orbiting paths.
- **Style:** a flat fill plus the same mask tinted ink and offset (18, 18) as a hard shadow
  (`source-in` fill on a copy). Use a dot-grid background and a rotating circular-text badge.
- **Flood transition:** converge everything, then scale all radii by up to ~7.5 with `inExpo` so the
  blob covers the frame. Its colour is the next scene's background.

## 7. Montage panels  [`S6`]

Cut every ½ beat; each panel lives about 14 frames, so make it read instantly (one bold pattern, one
colour pair):
- **Halftone wave:** dot radius `∝ 0.5 + 0.5·sin(x·kx + y·ky − t·ω)`.
- **Sunburst:** alternating wedges, rotating, scaling from 1.25 to 1, with a pulsing disc in the centre.
- **Type rows:** a repeated word, alternating fill and outline, rows scrolling in opposite
  directions at about 1700 px/s.
- **Op-art rings:** concentric rings moving outward with slightly wobbling centres (gives moiré).
- **Checker flip wave:** squares rotate 90° while dipping in scale, delayed by `(c + r)`.
- **EQ bars:** heights from `hash(bar, sixteenth)` with an attack/decay envelope inside each 16th.
- **Countdown 4-3-2-1 on ¼ beats:** a giant numeral, `scale 1.35 → 1` with `outExpo`, a tiny
  rotation, a different colour pair per number. The last one zooms into the drop.

## 8. Particle convergence  [`S7`, `vortexPos`, `partPos`, `init` PART]

- **Targets:** sample the title on a hex grid (row offset `step/2`, row pitch `0.866·step`), so
  `n = sample count` (about 3,000 at step 7.5 for a 300 px word).
- **Burst:** `r = R_i·outExpo(prog(b, 24, 24.7))`, plus a shockwave ring and speed lines.
- **Vortex:** angular speed `∝ 1/R_i` (inner orbits faster), ramped in smoothly with
  `τ − 0.6(1 − e^(−τ/0.6))`. The radius contracts with `inOutCubic`. Squash y slightly (·0.82) for depth.
- **Spiral in:** depart at `d_i` (staggered by target x so the word assembles left to right), then
  `p = target + rot(φ·u)·(start − target)·(1 − u)` with `u = EZ(...)`. **The rotation must be φ·u**,
  not φ·(1 − u), or particles teleport at departure.
- **Streaks:** draw from the position 0.05 beats earlier to now, **capped** at 26–116 px, or the burst
  becomes a grey haze.
- **Hold:** small jitter, plus a highlight sweep (particles near a moving x take the accent colour).
  Then cross-fade to the solid font (`inCubic`) while the particles shrink. Cut to the end card with
  inverted colours.

## 9. End card and bookend  [`S8`, `s8Dot`]

- Keep the title at exactly the same position and size as the previous scene's particle text, so
  the cut is a pure colour inversion.
- **Subtitle:** masked letter rise, with letter-spacing tightening from 34 to 17 px using `EZ`.
  A rule draws out from the centre, then meta text slides in from the centre.
- **Bookend:** the opening ball drops in as the full stop (same radius, same gravity, a bounce, a
  settle), then gives a little "wink" hop before the end.
- A slow push-in (+2.5%) keeps the hold alive. Leave the last 1.5–2 s readable, and use the last frame
  as the poster.

## 10. Post  [`renderFrame`, `chroma`, `shakeAt`, `post`]

- **Motion blur:** average N sub-frames inside the shutter window with a running average
  (`globalAlpha = 1/(k+1)`). Clamp sample times to the current cut segment.
- **Shake:** for each impact, `a·exp(−9·dt)` times a smooth pseudo-noise (a sum of sines), plus a
  tiny rotation. Apply it to the scene layer only, never the HUD.
- **Chromatic split:** copy the layer, multiply it by pure red, green or blue to get each channel,
  draw R scaled `1 + 2a/W` and G `1 + a/W` with `lighter`. Scaling (rather than shifting) avoids
  coloured edge strips and looks lens-like.
- **Flash:** an overlay whose alpha decays with `exp(−48·dt)`, so it's gone in about 3 frames.
- **Vignette:** a pre-rendered radial gradient, stronger on dark scenes.
- **Grain:** add it in ffmpeg (`noise=c0s=3:c0f=t+u`), not in the page. That keeps the intermediates
  compressible.

## 11. Transition cookbook

| From → to | Move |
|---|---|
| Object → new scene | The object grows (`inExpo`) to cover the frame; its colour becomes the new background |
| Type → pattern | Pixelate into sampled dots that fly to a grid |
| Pattern → 3D | Zoom into one element; it becomes a ring that tilts into perspective |
| 3D → anything | Dolly through the tunnel, then hard-cut on an impact with a flash |
| Blob → montage | The blob floods the frame; the first montage panel uses the same colour |
| Montage → drop | A countdown on ¼ beats, the last number zooms in, a white flash plus burst |
| Particles → end card | The particles form the title, then a colour-inverted cut to the solid title |
