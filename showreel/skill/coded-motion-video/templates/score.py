#!/usr/bin/env python3
"""Score for templates/reel.html (16 beats @ 128 BPM = 7.5 s). Mirror the picture's event list here:
every scene cut, bounce, slam and reveal gets a sound on the same beat.

    python3 score.py out.wav
"""
import os
import sys

# score_kit lives in the skill's scripts/ folder; point SCORE_KIT at it if you move things around.
sys.path.insert(0, os.environ.get('SCORE_KIT', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scripts')))
from score_kit import *  # noqa: E402,F401,F403

s = Score(bpm=128, beats=16)

# 0-4 · the ball: blips rise as the bounces shrink, a whoosh carries the dive into the lens
s.put('fx', whoosh(0.45, 2000, 600, peak=0.3), 0.05, 0.05)
for hb, note, amp in ((1, 'F4', 1), (2, 'Ab4', 0.8), (2.5, 'C5', 0.6), (2.75, 'Eb5', 0.45)):
    s.put('fx', marimba(hz(note)), hb, 0.42 * amp, rv=0.25)
    s.put('fx', kick(0.25, f0=120, f1=60, drive=1.0), hb, 0.35 * amp)
s.put('fx', whoosh(s.bt(0.75), 300, 7000, peak=0.92), 3.25, 0.3, rv=0.2)

# 4-8 · title: impact on the cut, four-on-the-floor, claps on 2 & 4, chord stab under the word
s.impact(4, 0.9)
for b in (5, 6, 7):
    s.kick(b)
for b in (5, 7):
    s.put('drums', clap(), b, 0.42, rv=0.2)
s.put('music', chord_stab(['F3', 'Ab3', 'C4', 'F4']), 4, 0.5, rv=0.3)
s.put('fx', whoosh(s.bt(0.5), 4000, 800, peak=0.3), 7.3, 0.12)

# 8-12 · grid: groove + offbeat bass, a soft tick per ripple
s.impact(8, 0.7)
for b in range(9, 12):
    s.kick(b)
for b in range(8, 12):
    s.put('music', bass_note('F', s.bt(0.45)), b + 0.5, 0.5)
    s.put('drums', hat(), b + 0.5, 0.2, 0.25)
    s.put('fx', click(3000, 0.01), b + 0.05, 0.08, rv=0.3)
s.pad([(8, 12, ['F3', 'Ab3', 'C4', 'Eb4']), (12, 20, ['F2', 'C3', 'Ab3', 'Eb4', 'G4'])], cutoff=lambda sec: 1800)

# 12-16 · end card: final hit, ringing chord, the ball lands as the period
s.impact(12, 0.9)
s.put('music', chord_stab(['F3', 'Ab3', 'C4', 'Eb4', 'G4'], dur=3.0, cutoff=2200), 12, 0.5, rv=0.5)
for i in range(13):
    s.put('fx', click(4200 + 90 * i, 0.006), 12.3 + i * 0.03, 0.07, -0.5 + i / 12, rv=0.15)
s.put('fx', marimba(hz('F5')), 13.5, 0.4, 0.35, rv=0.35)

s.mixdown(sys.argv[1] if len(sys.argv) > 1 else 'score.wav')
