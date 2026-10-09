# Sound design for coded motion

The score sells the edit. When every hit lands on the picture, a 15 s reel feels twice as
polished. `scripts/score_kit.py` provides the instruments and the mix. This file covers what to put
where, and how to judge a mix you cannot hear.

## Arrangement shape (match it to the picture's energy arc)

| Section | Typical length | Music | Sound design |
|---|---|---|---|
| Hook / intro | 1 bar | Quiet drone or air, no drums | Blips on every small motion (bounces, pops) |
| First cut | Downbeat | `impact()` (kick + sub boom + air) | Slams on word hits, a chord stab |
| Groove | 1–2 bars | Four-on-the-floor kicks, claps on 2 and 4, offbeat hats, offbeat bass, pad | Tick cascades for waves, whooshes for morphs |
| Breakdown | 1 bar | Kicks drop out, pad filter opens slowly, sustained sub | Bloops for liquids, airy whooshes |
| Build | 1 bar | Kicks back, snares on every cut accelerating to 16ths, `riser()` | Countdown toms rising in pitch; cut the riser about ⅛ beat before the drop for a gap of air |
| Drop | 1 bar | Biggest impact, kicks, rolling 16th bass with sidechain, open hats, plucks | Swirling noise for vortices, rising bell arpeggio as things assemble |
| End card | 1 bar or more | A final impact and a long ringing chord (pad + stab + bells) | Soft ticks per letter, the bookend blip, then near-silence |

Keep everything in one key. A minor key with a i–VI–III–VII style progression works well (F minor:
Fm7 – Dbmaj7 – Abmaj7 – Eb6 – back to Fm9). Voice-lead pads so only one note moves at a time.

## Mapping picture → sound

| Picture event | Sound (`score_kit`) |
|---|---|
| Scene cut or big reveal | `s.impact(beat, gain)` |
| Bounce or landing | `marimba(hz(note))` plus a soft low `kick(0.25, 120, 60, 1.0)`; pitches rising through a chord |
| A shape stretching under tension | A short rising sine glide (`sweep_sine`) |
| Camera dive or zoom | `whoosh(dur, lo, hi, peak≈0.9)` ending on the next downbeat |
| Morph or rotation | `whoosh` with a 0.5 peak, panned slightly |
| Wave across a grid | One `click()` per element, timed by its delay, panned by x |
| Shutter, toggle, UI | `click()` pairs (high + mid) |
| Liquid split or droplet | `bloop(f0, f1)` rising; a merge is `bloop` falling, longer |
| Particles assembling | A rising `bell()` arpeggio on the pentatonic scale, 32nd notes |
| A highlight sweeping left → right | A quiet sine sweep with its pan following the visual x |
| Letters revealing | Very quiet `click()` per letter, pitch stepping up |

## Gain staging and targets

- **Bus gains in `mixdown`:** drums 0.6, music 0.9, fx 0.6, reverb 1.3. The sidechain dips the music
  bus by 0.62 on every `s.kick()`.
- **Read the per-bar table it prints.** In groove bars, drums sit around −13 to −15 dB, music −13 to
  −16, and fx a few dB lower. The breakdown should show drums gone and music carrying. Any single bus
  10 dB above the others is a problem.
- **Mixdown order:** normalise the sum to 1.15 peak, then `tanh`, then set the final peak to 0.86.
  Summing first and clipping later crushed an earlier mix to −7 LUFS.
- **Targets:** `review.py loudness` should show integrated loudness around −16 to −13 LUFS, true peak
  at or below −0.5 dBFS (ideally −1), and an LRA of 3–8 LU. Below 3 LU, the mix has no dynamics.
- **`audiovis`:** the waveform should show the storyboard (a sparse intro, regular kick spikes, the
  breakdown dip, the build, the biggest transient at the drop, a decaying tail). The spectrogram
  should show highs on hats and risers and a continuous low end only where the bass plays.

## Gotchas

- Every placed sound gets a 4 ms fade-out automatically, so truncated tails don't click.
- Use sub frequencies at 40 Hz or above (`bass_note` picks the octave). Lower than that wastes headroom.
- Risers should end *before* the drop's downbeat. Silence makes the hit land.
- If the user wants no music, keep only the sound-design layer on the fx bus. The hits still sell
  the edit.
