#!/usr/bin/env python3
"""Score for the Claude motion reel, synthesized from scratch with numpy.

128 BPM, F minor, 32 beats = exactly 15.0 s. Every sound effect is placed on the
same beat grid that reel.html animates to, so picture and sound lock frame-tight.

    python3 score.py out.wav
"""
import sys
import wave
import numpy as np

SR = 48000
BPM = 128
BEAT = 60 / BPM
DUR = 15.0
TAIL = 3.0
N = int(SR * (DUR + TAIL))
rng = np.random.default_rng(7)


def bt(b):
    return b * BEAT


def tt(dur):
    return np.arange(int(dur * SR)) / SR


NOTE = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}


def hz(name):
    """'F3' / 'Ab4' -> frequency."""
    p, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((12 * (o + 1) + NOTE[p] - 69) / 12)


# ------------------------------------------------------------------ buses
class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, t, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.stack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        sig = sig.copy()
        f = min(sig.shape[1], int(0.004 * SR))          # de-click every one-shot's tail
        sig[:, -f:] *= np.linspace(1, 0, f)
        if i < 0:
            sig, i = sig[:, -i:], 0
        n = min(sig.shape[1], N - i)
        if n > 0:
            self.x[:, i:i + n] += sig[:, :n] * gain


drums, music, fx, verb = Bus(), Bus(), Bus(), Bus()


def put(bus, sig, t, gain=1.0, pan=0.0, rv=0.0):
    bus.add(sig, t, gain, pan)
    if rv:
        verb.add(sig, t, gain * rv, pan)


# ---------------------------------------------------------------- filters
def fft_filt(x, lo=None, hi=None, order=2):
    nfft = 1 << int(np.ceil(np.log2(len(x) * 2)))
    X = np.fft.rfft(x, nfft)
    f = np.fft.rfftfreq(nfft, 1 / SR)
    H = np.ones_like(f)
    if hi:
        H /= np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        H /= np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    return np.fft.irfft(X * H, nfft)[:len(x)]


def tv_filt(x, fc, kind='lp', bw=0.6, nfft=2048, hop=256):
    """Time-varying filter by STFT overlap-add. fc: callable(seconds) -> Hz."""
    n = len(x)
    pad = np.concatenate([np.zeros(nfft), x, np.zeros(nfft)])
    w = np.sqrt(np.hanning(nfft + 1)[:-1])
    out = np.zeros_like(pad)
    norm = np.zeros_like(pad)
    f = np.maximum(np.fft.rfftfreq(nfft, 1 / SR), 1.0)
    for s in range(0, len(pad) - nfft, hop):
        c = max(20.0, float(fc((s + nfft / 2 - nfft) / SR)))
        if kind == 'lp':
            H = 1 / np.sqrt(1 + (f / c) ** 4)
        elif kind == 'hp':
            H = 1 / np.sqrt(1 + (c / f) ** 4)
        else:
            H = np.exp(-0.5 * (np.log2(f / c) / bw) ** 2)
        y = np.fft.irfft(np.fft.rfft(pad[s:s + nfft] * w) * H, nfft) * w
        out[s:s + nfft] += y
        norm[s:s + nfft] += w * w
    return (out / np.maximum(norm, 1e-6))[nfft:nfft + n]


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def saw(freq, t):
    ph = np.cumsum(np.broadcast_to(freq, t.shape)) / SR if np.ndim(freq) else freq * t
    return 2 * (ph % 1.0) - 1


# ------------------------------------------------------------ instruments
def kick(dur=0.5, f0=170, f1=44, drive=1.7):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)
    click = fft_filt(noise(dur), lo=1500) * np.exp(-t * 500) * 0.35
    return np.tanh((body + click) * drive) / np.tanh(drive)


def clap(dur=0.4):
    t = tt(dur)
    env = sum(np.where(t >= d, np.exp(-(t - d) * 260), 0) for d in (0, 0.009, 0.019)) + 0.55 * np.exp(-t * 16) * (t >= 0.027)
    return fft_filt(noise(dur), lo=900, hi=4200) * env * 0.8


def hat(dur=0.06, decay=70, lo=7500):
    t = tt(dur)
    return fft_filt(noise(dur), lo=lo, order=3) * np.exp(-t * decay)


def snare(dur=0.3, body=190, tone=1.0):
    t = tt(dur)
    b = np.sin(2 * np.pi * np.cumsum(body * (1 + 0.6 * np.exp(-t * 60))) / SR) * np.exp(-t * 22) * tone
    nz = fft_filt(noise(dur), lo=1400, hi=9000) * np.exp(-t * 16)
    return b * 0.7 + nz * 0.8


def tom(freq, dur=0.45):
    t = tt(dur)
    f = freq * (1 + 0.5 * np.exp(-t * 25))
    return np.tanh(1.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)) + fft_filt(noise(dur), lo=800, hi=5000) * np.exp(-t * 40) * 0.2


def boom(dur=2.4, f0=62, f1=28):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 2.5)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.9) * (1 - np.exp(-t * 400))
    crash = fft_filt(noise(dur), lo=2500, order=1) * np.exp(-t * 2.8) * 0.35
    return np.tanh(sub * 1.5) + crash


def marimba(freq, dur=0.9, bright=1.0):
    t = tt(dur)
    f = freq * (1 + 0.05 * np.exp(-t * 45))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 6) + 0.4 * bright * np.sin(4 * ph) * np.exp(-t * 28) + 0.15 * bright * np.sin(9.2 * ph) * np.exp(-t * 60)
    return s * (1 - np.exp(-t * 3000))


def bell(freq, dur=1.2):
    t = tt(dur)
    s = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d) for r, a, d in ((1, 1, 3.5), (2.76, 0.45, 7), (5.4, 0.25, 14), (8.93, 0.12, 22)))
    return s * (1 - np.exp(-t * 2500))


def bloop(f0, f1, dur=0.35, glide=0.05):
    t = tt(dur)
    f = f0 * (f1 / f0) ** np.clip(t / glide, 0, 1)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * (1 - np.exp(-t * 900))


def click(freq=3200, dur=0.012):
    t = tt(dur)
    return (np.sin(2 * np.pi * freq * t) * 0.6 + fft_filt(noise(dur), lo=2000) * 0.4) * np.exp(-t * 600)


def whoosh(dur, f_from, f_to, peak=0.7, bw=0.55):
    t = tt(dur)
    u = t / dur
    sig = tv_filt(noise(dur), lambda s: f_from * (f_to / f_from) ** np.clip(s / dur, 0, 1), 'bp', bw=bw)
    env = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.5)
    return sig * env * 2.2


def riser(dur, f_from=300, f_to=9000):
    t = tt(dur)
    u = t / dur
    nz = tv_filt(noise(dur), lambda s: f_from * (f_to / f_from) ** np.clip(s / dur, 0, 1) ** 1.6, 'bp', bw=0.9) * (u ** 2.2) * 2.5
    tone = saw(hz('F3') * 2 ** (2 * u ** 1.5), t)
    tone = fft_filt(tone, hi=2500) * (u ** 2) * 0.12
    return nz + tone


def chord_stab(notes, dur=0.5, cutoff=2600):
    t = tt(dur)
    s = sum(saw(hz(nm) * d, t) for nm in notes for d in (0.996, 1.004))
    s = tv_filt(s, lambda x: 300 + cutoff * np.exp(-x * 9))
    return s * np.exp(-t * 5) * (1 - np.exp(-t * 800)) / len(notes)


def pluck(freq, dur=0.32, cut=4500, decay=9):
    t = tt(dur)
    s = saw(freq, t) * 0.7 + saw(freq * 1.006, t) * 0.5
    s = tv_filt(s, lambda x: 250 + cut * np.exp(-x * 26))
    return s * np.exp(-t * decay) * (1 - np.exp(-t * 1500))


# ---------------------------------------------------------- arrangement
KICKS = []


def K(b, g=1.0, **kw):
    KICKS.append(bt(b))
    put(drums, kick(**kw), bt(b), 0.95 * g)


def IMPACT(b, g=1.0):
    K(b, g)
    put(fx, boom(), bt(b), 0.75 * g, rv=0.35)
    put(fx, fft_filt(noise(1.6), lo=4000, order=1) * np.exp(-tt(1.6) * 3.2), bt(b), 0.22 * g, rv=0.5)


# --- bar 1 (0-4): atmosphere + the bouncing ball
air = tv_filt(noise(bt(4)), lambda s: 400 + 1800 * min(1, s / bt(4)), 'bp', bw=1.2) * np.linspace(0, 1, int(bt(4) * SR)) ** 1.5
put(fx, air, 0, 0.05, rv=0.2)
drone_t = tt(bt(4.2))
drone = (np.sin(2 * np.pi * hz('F2') * drone_t) + 0.5 * np.sin(2 * np.pi * hz('C3') * drone_t) + 0.25 * np.sin(2 * np.pi * hz('F3') * 1.002 * drone_t)) * np.minimum(1, drone_t / 1.2)
put(music, drone, 0, 0.09)
put(fx, whoosh(0.45, 2000, 600, peak=0.3), bt(0.05), 0.05, pan=-0.3)          # floor line draws
for i, (hb, nt) in enumerate(zip([1, 2, 2.5, 2.75, 2.875], ['F4', 'Ab4', 'C5', 'Eb5', 'F5'])):
    amp = 1 if i == 0 else [1, 1, 0.5, 0.25, 0.125][i] ** 0.45
    pan = -0.45 + 0.45 * hb / 2.9
    put(fx, marimba(hz(nt)), bt(hb), 0.42 * amp, pan, rv=0.25)
    put(fx, kick(0.25, f0=120, f1=60, drive=1.0), bt(hb), 0.35 * amp, pan)
creak_t = tt(bt(0.32))
creak = np.sin(2 * np.pi * np.cumsum(180 * 2 ** (1.4 * creak_t / creak_t[-1]) * (1 + 0.02 * np.sin(2 * np.pi * 28 * creak_t))) / SR) * np.minimum(1, creak_t / 0.05)
put(fx, creak, bt(3.0), 0.07)                                                   # anticipation
put(fx, whoosh(bt(0.72), 300, 7000, peak=0.92), bt(3.3), 0.3, rv=0.2)          # dive at the lens
put(fx, riser(bt(1.0), 500, 8000) * 0.6, bt(3.0), 0.25)

# --- bar 2 (4-8): kinetic type
IMPACT(4, 0.9)
for b in (5, 6, 7):
    K(b)
for b in (5, 7):
    put(drums, clap(), bt(b), 0.42, rv=0.2)
put(music, chord_stab(['F3', 'Ab3', 'C4', 'F4']), bt(4), 0.5, rv=0.3)
put(music, chord_stab(['Db3', 'F3', 'Ab3', 'C4']), bt(5), 0.42, rv=0.3)
put(music, chord_stab(['Eb3', 'G3', 'Bb3', 'Eb4']), bt(6), 0.42, rv=0.3)
put(music, chord_stab(['F3', 'Ab3', 'C4', 'G4'], dur=0.9), bt(6.5), 0.48, rv=0.3)
put(fx, click(5200, 0.006), bt(5), 0.35, 0.2)                                   # camera shutter on FRAME
put(fx, fft_filt(noise(0.03), lo=1800, hi=5000) * np.exp(-tt(0.03) * 140), bt(5) + 0.045, 0.45, 0.2)
put(fx, click(2400), bt(6.22), 0.4, 0.15)                                       # toggle ON
put(fx, click(3800, 0.008), bt(6.3), 0.25, 0.15)
spr_t = tt(0.6)
put(fx, np.sin(2 * np.pi * np.cumsum(230 * (1 + 0.28 * np.exp(-spr_t * 7) * np.sin(2 * np.pi * 11 * spr_t))) / SR) * np.exp(-spr_t * 6), bt(6.5), 0.16)  # boing
put(fx, bloop(420, 1500, 0.2, 0.025), bt(6.88), 0.28, 0.35, rv=0.3)             # period pop
for i in range(70):                                                              # pixelate sparkle
    tb = 7.25 + 0.72 * (i / 70) ** 0.8 + 0.02 * rng.random()
    nt = rng.choice(['F6', 'Ab6', 'Bb6', 'C7', 'Eb7', 'F7'])
    put(fx, bell(hz(nt), 0.25) * np.exp(-tt(0.25) * 12), bt(tb), 0.035 + 0.02 * rng.random(), rng.uniform(-0.9, 0.9), rv=0.3)
put(fx, whoosh(bt(0.6), 1200, 6000, peak=0.6), bt(7.35), 0.12, rv=0.2)

# --- bars 3-4 (8-16): systems + dimension — the groove
PADS = [  # (start beat, end beat, voicing)
    (8, 12, ['F3', 'Ab3', 'C4', 'Eb4']),
    (12, 16, ['F3', 'Ab3', 'C4', 'Db4']),
    (16, 20, ['G3', 'Ab3', 'C4', 'Eb4']),
    (20, 24, ['G3', 'Bb3', 'C4', 'Eb4']),
    (24, 28, ['F3', 'Ab3', 'Eb4', 'G4']),
    (28, 36, ['F2', 'C3', 'Ab3', 'Eb4', 'G4']),
]
pad_l, pad_r = np.zeros(N), np.zeros(N)
for b0, b1, notes in PADS:
    i0, i1 = int(bt(b0) * SR), min(N, int(bt(b1) * SR) + int(0.25 * SR))
    t = np.arange(i1 - i0) / SR
    env = np.minimum(1, t / 0.06) * np.minimum(1, np.maximum(0, (t[-1] - t) / 0.25))
    if b0 == 28:
        env *= np.exp(-t * 0.55)
    for nm in notes:
        f = hz(nm)
        for k, d in enumerate((-0.14, -0.07, 0, 0.07, 0.14)):
            v = saw(f * 2 ** (d / 12), t + rng.random() / f) * env / len(notes) / 5
            gl, gr = (1.35, 0.65) if k % 2 else (0.65, 1.35)
            pad_l[i0:i1] += v * gl
            pad_r[i0:i1] += v * gr


def pad_cut(s):
    b = s / BEAT
    if b < 16:
        return 1500 + 300 * np.sin(b * 0.8)
    if b < 20:
        return 500 + 3200 * ((b - 16) / 4) ** 2
    if b < 24:
        return 900 + 5500 * ((b - 20) / 4) ** 2.2
    if b < 28:
        return 3800
    return 2600 * np.exp(-(b - 28) * 0.35) + 500


put(music, np.stack([tv_filt(pad_l, pad_cut), tv_filt(pad_r, pad_cut)]), 0, 0.55, rv=0.35)

ROOT = {8: 'F', 12: 'Db', 16: 'Ab', 20: 'Eb', 24: 'F'}


def bass_note(name, dur, cut=900):
    t = tt(dur)
    sub_f = hz(name + '1') if hz(name + '1') >= 40 else hz(name + '2')
    s = 0.6 * np.sin(2 * np.pi * sub_f * t) + 0.5 * tv_filt(saw(sub_f * 2, t) + saw(sub_f * 2.006, t), lambda x: 120 + cut * np.exp(-x * 14))
    return np.tanh(1.6 * s * np.minimum(1, t / 0.004) * np.minimum(1, (t[-1] - t) / 0.01 + 1e-9))


for b in range(8, 16):
    K(b)
    root = ROOT[8 if b < 12 else 12]
    put(music, bass_note(root, bt(0.45)), bt(b + 0.5), 0.5)
    put(drums, hat(), bt(b + 0.5), 0.2, 0.25)
    put(drums, hat(0.04, 110), bt(b + 0.25), 0.08, -0.3)
    put(drums, hat(0.04, 110), bt(b + 0.75), 0.08, -0.3)
    if b % 2 == 1:
        put(drums, clap(), bt(b), 0.42, rv=0.2)
# rotation-wave tick cascades: centre-out, then left-to-right
cells = [(c, r) for r in range(9) for c in range(16)]
maxd = np.hypot(960, 540)
for c, r in cells:
    d = np.hypot(c * 120 + 60 - 960, r * 120 + 60 - 540) / maxd
    put(fx, click(2600 + 2400 * (1 - d), 0.008), bt(10.05 + 0.45 * d + 0.2), 0.045, (c - 7.5) / 8)
    if rng.random() < 0.55:
        put(fx, click(3600 + 120 * r, 0.008), bt(11.0 + 0.4 * c / 15 + 0.2), 0.045, (c - 7.5) / 8)
put(fx, fft_filt(noise(1.2), lo=5000, order=1) * np.exp(-tt(1.2) * 4), bt(10), 0.18, rv=0.4)   # colour flip
put(fx, whoosh(bt(0.9), 200, 3500, peak=0.85), bt(11.1), 0.25)                                   # dive into the ring
# morph whooshes + arpeggio for the point cloud
for b, (lo, hi_) in zip((12.05, 13.0, 14.0, 15.0), ((300, 2400), (2400, 500), (500, 4000), (4000, 900))):
    put(fx, whoosh(bt(0.75), lo, hi_, peak=0.5), bt(b), 0.18, pan=0.3 * np.sin(b), rv=0.3)
ARP = ['F4', 'Ab4', 'C5', 'Db5', 'F5', 'C5', 'Ab4', 'Db5']
for k in range(16):
    b = 12 + k * 0.25
    put(music, pluck(hz(ARP[k % 8]) * 2), bt(b), 0.14 * (0.7 + 0.3 * (k % 2 == 0)), 0.5 if k % 2 else -0.5, rv=0.45)
put(fx, riser(bt(0.75), 800, 12000), bt(15.25), 0.35)
put(fx, whoosh(bt(0.6), 600, 9000, peak=0.95), bt(15.4), 0.3)

# --- bar 5 (16-20): fluidity — breakdown
IMPACT(16, 0.75)
put(fx, bloop(110, 520, 0.6, 0.12), bt(16.02), 0.5, rv=0.35)
put(music, bass_note('Ab', bt(3.9), cut=400) * np.exp(-tt(bt(3.9)) * 0.3), bt(16), 0.42)
for b, f0, f1, p in ((16.9, 260, 900, -0.5), (16.9, 300, 1000, 0.5), (17.9, 380, 1300, -0.75), (17.92, 420, 1400, 0.75), (17.95, 340, 1150, -0.2), (17.97, 460, 1500, 0.3)):
    put(fx, bloop(f0, f1, 0.3), bt(b), 0.3, p, rv=0.35)
for k in range(6):
    put(fx, bloop(700 + 150 * k, 2000 + 200 * k, 0.18, 0.02), bt(18.2 + k * 0.08), 0.13, [-0.6, 0.6, -0.3, 0.3, -0.8, 0.8][k], rv=0.4)
gl_t = tt(bt(0.6))
put(fx, np.sin(2 * np.pi * np.cumsum(500 * (0.25 ** (gl_t / gl_t[-1]))) / SR) * np.exp(-gl_t * 3) * np.minimum(1, gl_t / 0.02), bt(19.0), 0.28, rv=0.3)   # merge gloop
put(fx, whoosh(bt(0.6), 200, 2500, peak=0.95), bt(19.4), 0.3)
for b in (16.5, 17.5, 18.5, 19.5):
    put(drums, hat(0.12, 30, 9000), bt(b), 0.06, 0.4, rv=0.3)

# --- bar 6 (20-24): rhythm — the build
for b in (20, 21, 22, 22.5):
    K(b, 0.9)
for k, b in enumerate((20, 20.5, 21, 21.5, 22, 22.5)):
    put(drums, snare(tone=1 + 0.1 * k), bt(b), 0.38, rv=0.25)
for b in np.arange(22.0, 23.0, 0.25):
    put(drums, snare(0.2, 210), bt(b + 0.125), 0.2, rv=0.2)
for k, (b, nt) in enumerate(zip((23, 23.25, 23.5, 23.75), ('F2', 'Ab2', 'C3', 'F3'))):
    put(drums, tom(hz(nt) * 2), bt(b), 0.55, [-0.4, 0.4, -0.2, 0.2][k], rv=0.3)
    put(drums, snare(0.2, 240), bt(b), 0.25)
for b in np.arange(20, 22, 1):
    put(music, bass_note('Eb', bt(0.45)), bt(b + 0.5), 0.45)
for b in np.arange(22, 23.5, 0.5):
    put(music, bass_note('Eb', bt(0.22), 1400), bt(b + 0.25), 0.42)
build = riser(bt(3.85), 300, 11000)
put(fx, build, bt(20), 0.28)
put(fx, whoosh(bt(0.3), 9000, 2000, peak=0.1), bt(23.75), 0.15)

# --- bar 7 (24-28): convergence — the drop
IMPACT(24, 1.15)
put(fx, fft_filt(noise(2.5), lo=3000, order=1) * np.exp(-tt(2.5) * 1.6), bt(24), 0.25, rv=0.6)
for b in range(25, 28):
    K(b)
for b in (25, 27):
    put(drums, clap(), bt(b), 0.45, rv=0.2)
for k in range(16):
    b = 24 + k * 0.25
    if k % 4 == 2:
        put(drums, hat(0.22, 14, 6500), bt(b), 0.13, 0.3, rv=0.15)
    else:
        put(drums, hat(0.05, 80), bt(b), 0.09 + 0.04 * (k % 2), -0.25)
    if k % 4 != 0:
        put(music, bass_note('F', bt(0.22), 1800), bt(b), 0.42)
vortex = tv_filt(noise(bt(1.4)), lambda s: 700 + 900 * np.sin(s * 9) ** 2, 'bp', bw=0.8)
vt = tt(bt(1.4))
pan_l = 0.5 + 0.5 * np.sin(2 * np.pi * 3.2 * vt)
env_v = np.sin(np.pi * vt / vt[-1]) ** 1.5
put(fx, np.stack([vortex * env_v * pan_l, vortex * env_v * (1 - pan_l)]) * 1.6, bt(24.4), 0.2)
PENTA = ['F5', 'Ab5', 'Bb5', 'C6', 'Eb6', 'F6', 'Ab6', 'Bb6', 'C7', 'Eb7', 'F7']
for k in range(34):
    b = 25.45 + k * 0.034
    put(fx, bell(hz(PENTA[min(len(PENTA) - 1, k // 3)]), 0.6), bt(b), 0.07, 0.8 * np.sin(k * 1.3), rv=0.45)
for k in range(16):
    b = 24 + k * 0.25
    put(music, pluck(hz(['F5', 'C5', 'Ab4', 'C5', 'Eb5', 'C5', 'G5', 'C5'][k % 8]), cut=3500), bt(b), 0.09, 0.45 if k % 2 else -0.45, rv=0.4)
sw_t = tt(bt(0.75))
sweep = np.sin(2 * np.pi * np.cumsum(1800 * 3 ** (sw_t / sw_t[-1])) / SR) * np.sin(np.pi * sw_t / sw_t[-1]) ** 2
put(fx, np.stack([sweep * (1 - sw_t / sw_t[-1]), sweep * sw_t / sw_t[-1]]) * 1.4, bt(26.6), 0.05, rv=0.4)
rev_t = tt(bt(0.55))
put(fx, fft_filt(noise(len(rev_t) / SR), lo=3000, order=1) * (rev_t / rev_t[-1]) ** 3, bt(27.45), 0.3)

# --- bar 8 (28-32): end card
IMPACT(28, 0.95)
put(music, chord_stab(['F3', 'Ab3', 'C4', 'Eb4', 'G4'], dur=3.0, cutoff=2200), bt(28), 0.5, rv=0.5)
for i, nm in enumerate(['F4', 'C5', 'Eb5', 'G5', 'Ab5']):
    put(fx, bell(hz(nm), 2.4), bt(28) + i * 0.03, 0.06, -0.3 + 0.15 * i, rv=0.5)
for i in range(15):                                                             # subtitle letters
    put(fx, click(4200 + 90 * i, 0.006), bt(28.3 + i * 0.03), 0.07, -0.5 + i / 14, rv=0.15)
put(fx, whoosh(bt(0.6), 800, 5000, peak=0.5), bt(29.0), 0.08)                  # rule draws
fall_t = tt(bt(0.5))
put(fx, np.sin(2 * np.pi * np.cumsum(1700 * 0.55 ** (fall_t / fall_t[-1])) / SR) * np.minimum(1, fall_t / 0.03) * 0.5, bt(29.5), 0.07, 0.35)
for b, nt, a in ((30.0, 'F5', 1.0), (30.3, 'C6', 0.4), (31.5, 'Ab5', 0.35), (31.8, 'F6', 0.5)):
    put(fx, marimba(hz(nt)), bt(b), 0.4 * a, 0.35, rv=0.35)
    put(fx, kick(0.25, f0=120, f1=60, drive=1.0), bt(b), 0.3 * a, 0.35)

# ------------------------------------------------------------- mixdown
KICKS.sort()
tN = np.arange(N) / SR
sc = np.ones(N)
for tk in KICKS:
    i = int(tk * SR)
    seg = tN[i:i + int(0.45 * SR)] - tk
    sc[i:i + len(seg)] = np.minimum(sc[i:i + len(seg)], 1 - 0.62 * np.exp(-seg / 0.1) * np.minimum(1, seg / 0.003))


def make_ir(rt60=2.3, dur=3.0, pre=0.015):
    t = tt(dur)
    irs = []
    for _ in range(2):
        nz = rng.standard_normal(len(t)) * 10 ** (-3 * t / rt60)
        nz = tv_filt(nz, lambda s: 9000 * np.exp(-s * 1.2) + 900)
        nz = fft_filt(nz, lo=180, order=1)
        ir = np.concatenate([np.zeros(int(pre * SR)), nz])
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    return irs


def conv(x, ir):
    nfft = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:len(x)]


irl, irr = make_ir()
wet = np.stack([conv(verb.x[0], irl), conv(verb.x[1], irr)]) * 0.55

mix = 0.6 * drums.x + 0.9 * music.x * sc + 0.6 * fx.x + 1.3 * wet
mix = np.stack([fft_filt(mix[0], lo=25, order=2), fft_filt(mix[1], lo=25, order=2)])[:, :int(DUR * SR)]
mix *= 1.15 / np.max(np.abs(mix))          # only the biggest transients kiss the soft clipper
mix = np.tanh(mix)
fade = int(0.35 * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade) ** 2
mix *= 0.86 / np.max(np.abs(mix))            # ~ -1.3 dBFS sample peak; headroom for the AAC encode

out = sys.argv[1] if len(sys.argv) > 1 else 'score.wav'
pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f'wrote {out}: {mix.shape[1] / SR:.3f}s, {len(KICKS)} kicks')
