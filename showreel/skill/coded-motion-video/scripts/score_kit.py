"""score_kit — a tiny numpy synth for scoring code-rendered motion graphics.

Everything is positioned in BEATS on the same grid the picture animates to, so hits land
frame-tight. No samples, no dependencies beyond numpy.

    from score_kit import *
    s = Score(bpm=128, beats=32)                 # 32 beats @128 = 15.0 s
    s.kick(4); s.put('drums', clap(), 5, 0.42, rv=0.2)
    s.pad([(8, 16, ['F3', 'Ab3', 'C4', 'Eb4'])], cutoff=lambda sec: 1800)
    s.mixdown('score.wav')                       # gain-staged, soft-clipped, ~-15 LUFS, prints a level report

Instrument functions return mono float arrays (or (2, n) stereo). Durations are in seconds.
"""
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)
NOTE = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}


def hz(name):
    """'F3', 'Ab4', 'C#5' -> Hz."""
    name = name.replace('C#', 'Db').replace('D#', 'Eb').replace('F#', 'Gb').replace('G#', 'Ab').replace('A#', 'Bb')
    p, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((12 * (o + 1) + NOTE[p] - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def saw(freq, t):
    ph = np.cumsum(np.broadcast_to(freq, t.shape)) / SR if np.ndim(freq) else freq * t
    return 2 * (ph % 1.0) - 1


def sweep_sine(f_of_t, t):
    return np.sin(2 * np.pi * np.cumsum(f_of_t) / SR)


# ------------------------------------------------------------------ filters
def fft_filt(x, lo=None, hi=None, order=2):
    """Static zero-phase high/low/band-pass (Butterworth-shaped magnitude)."""
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
    """Time-varying filter (STFT overlap-add). fc: callable(seconds) -> Hz. kind: lp | hp | bp."""
    n = len(x)
    pad = np.concatenate([np.zeros(nfft), x, np.zeros(nfft)])
    w = np.sqrt(np.hanning(nfft + 1)[:-1])
    out, norm = np.zeros_like(pad), np.zeros_like(pad)
    f = np.maximum(np.fft.rfftfreq(nfft, 1 / SR), 1.0)
    for s in range(0, len(pad) - nfft, hop):
        c = max(20.0, float(fc((s + nfft / 2 - nfft) / SR)))
        if kind == 'lp':
            H = 1 / np.sqrt(1 + (f / c) ** 4)
        elif kind == 'hp':
            H = 1 / np.sqrt(1 + (c / f) ** 4)
        else:
            H = np.exp(-0.5 * (np.log2(f / c) / bw) ** 2)
        out[s:s + nfft] += np.fft.irfft(np.fft.rfft(pad[s:s + nfft] * w) * H, nfft) * w
        norm[s:s + nfft] += w * w
    return (out / np.maximum(norm, 1e-6))[nfft:nfft + n]


# -------------------------------------------------------------- instruments
def kick(dur=0.5, f0=170, f1=44, drive=1.7, decay=8):
    t = tt(dur)
    body = sweep_sine(f1 + (f0 - f1) * np.exp(-t * 30), t) * np.exp(-t * decay)
    click = fft_filt(noise(dur), lo=1500) * np.exp(-t * 500) * 0.35
    return np.tanh((body + click) * drive) / np.tanh(drive)


def clap(dur=0.4):
    t = tt(dur)
    env = sum(np.where(t >= d, np.exp(-(t - d) * 260), 0) for d in (0, 0.009, 0.019)) + 0.55 * np.exp(-t * 16) * (t >= 0.027)
    return fft_filt(noise(dur), lo=900, hi=4200) * env * 0.8


def hat(dur=0.06, decay=70, lo=7500):
    """Closed hat by default; open hat: hat(0.22, 14, 6500)."""
    return fft_filt(noise(dur), lo=lo, order=3) * np.exp(-tt(dur) * decay)


def snare(dur=0.3, body=190, tone=1.0):
    t = tt(dur)
    b = sweep_sine(body * (1 + 0.6 * np.exp(-t * 60)), t) * np.exp(-t * 22) * tone
    return b * 0.7 + fft_filt(noise(dur), lo=1400, hi=9000) * np.exp(-t * 16) * 0.8


def tom(freq, dur=0.45):
    t = tt(dur)
    return np.tanh(1.4 * sweep_sine(freq * (1 + 0.5 * np.exp(-t * 25)), t) * np.exp(-t * 7)) + fft_filt(noise(dur), lo=800, hi=5000) * np.exp(-t * 40) * 0.2


def boom(dur=2.4, f0=62, f1=28):
    """Sub drop + air crash for scene impacts (pair with a kick)."""
    t = tt(dur)
    sub = sweep_sine(f1 + (f0 - f1) * np.exp(-t * 2.5), t) * np.exp(-t * 1.9) * (1 - np.exp(-t * 400))
    return np.tanh(sub * 1.5) + fft_filt(noise(dur), lo=2500, order=1) * np.exp(-t * 2.8) * 0.35


def marimba(freq, dur=0.9, bright=1.0):
    """Toy-like pitched blip: great for bounces, landings, pops."""
    t = tt(dur)
    ph = 2 * np.pi * np.cumsum(freq * (1 + 0.05 * np.exp(-t * 45))) / SR
    s = np.sin(ph) * np.exp(-t * 6) + 0.4 * bright * np.sin(4 * ph) * np.exp(-t * 28) + 0.15 * bright * np.sin(9.2 * ph) * np.exp(-t * 60)
    return s * (1 - np.exp(-t * 3000))


def bell(freq, dur=1.2):
    t = tt(dur)
    s = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d) for r, a, d in ((1, 1, 3.5), (2.76, .45, 7), (5.4, .25, 14), (8.93, .12, 22)))
    return s * (1 - np.exp(-t * 2500))


def bloop(f0, f1, dur=0.35, glide=0.05):
    """Water-drop / bubble: pitch glides f0 -> f1. Up = droplet, down = gloop."""
    t = tt(dur)
    return sweep_sine(f0 * (f1 / f0) ** np.clip(t / glide, 0, 1), t) * np.exp(-t * 11) * (1 - np.exp(-t * 900))


def click(freq=3200, dur=0.012):
    """UI tick / shutter / toggle. Scatter many quietly for cascades."""
    t = tt(dur)
    return (np.sin(2 * np.pi * freq * t) * 0.6 + fft_filt(noise(dur), lo=2000) * 0.4) * np.exp(-t * 600)


def whoosh(dur, f_from, f_to, peak=0.7, bw=0.55):
    """Band-passed noise sweep; peak = where in the swell it is loudest (0..1)."""
    t = tt(dur)
    u = t / dur
    sig = tv_filt(noise(dur), lambda s: f_from * (f_to / f_from) ** np.clip(s / dur, 0, 1), 'bp', bw=bw)
    return sig * np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.5) * 2.2


def riser(dur, f_from=300, f_to=9000, root='F3'):
    t = tt(dur)
    u = t / dur
    nz = tv_filt(noise(dur), lambda s: f_from * (f_to / f_from) ** np.clip(s / dur, 0, 1) ** 1.6, 'bp', bw=0.9) * u ** 2.2 * 2.5
    return nz + fft_filt(saw(hz(root) * 2 ** (2 * u ** 1.5), t), hi=2500) * u ** 2 * 0.12


def reverse_swell(dur, lo=3000):
    t = tt(dur)
    return fft_filt(noise(dur), lo=lo, order=1) * (t / t[-1]) ** 3


def chord_stab(notes, dur=0.5, cutoff=2600):
    t = tt(dur)
    s = sum(saw(hz(nm) * d, t) for nm in notes for d in (0.996, 1.004))
    return tv_filt(s, lambda x: 300 + cutoff * np.exp(-x * 9)) * np.exp(-t * 5) * (1 - np.exp(-t * 800)) / len(notes)


def pluck(freq, dur=0.32, cut=4500, decay=9):
    t = tt(dur)
    s = tv_filt(saw(freq, t) * 0.7 + saw(freq * 1.006, t) * 0.5, lambda x: 250 + cut * np.exp(-x * 26))
    return s * np.exp(-t * decay) * (1 - np.exp(-t * 1500))


def bass_note(name, dur, cut=900):
    """name without octave ('F', 'Ab'): sub sine in the 40-80 Hz range + filtered saw an octave up."""
    t = tt(dur)
    sub_f = hz(name + '1') if hz(name + '1') >= 40 else hz(name + '2')
    s = 0.6 * np.sin(2 * np.pi * sub_f * t) + 0.5 * tv_filt(saw(sub_f * 2, t) + saw(sub_f * 2.006, t), lambda x: 120 + cut * np.exp(-x * 14))
    return np.tanh(1.6 * s * np.minimum(1, t / 0.004))


# ----------------------------------------------------------------- the score
class Score:
    BUSES = ('drums', 'music', 'fx', 'verb')

    def __init__(self, bpm, beats, tail=3.0):
        self.bpm, self.beats = bpm, beats
        self.beat = 60 / bpm
        self.dur = beats * self.beat
        self.N = int(SR * (self.dur + tail))
        self.bus = {k: np.zeros((2, self.N)) for k in self.BUSES}
        self.kicks = []

    def bt(self, b):
        return b * self.beat

    def put(self, bus, sig, at, gain=1.0, pan=0.0, rv=0.0):
        """Place a sound at beat `at` on a bus ('drums' | 'music' | 'fx'). rv = reverb send."""
        sig = np.array(sig, dtype=float, copy=True)
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.stack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        f = min(sig.shape[1], int(0.004 * SR))
        sig[:, -f:] *= np.linspace(1, 0, f)          # de-click every one-shot tail
        for name, g in ((bus, gain), ('verb', gain * rv)):
            if not g:
                continue
            i = int(round(self.bt(at) * SR))
            s = sig
            if i < 0:
                s, i = s[:, -i:], 0
            n = min(s.shape[1], self.N - i)
            if n > 0:
                self.bus[name][:, i:i + n] += s[:, :n] * g

    def kick(self, at, gain=1.0, **kw):
        """A kick that also drives the sidechain pump on the music bus."""
        self.kicks.append(self.bt(at))
        self.put('drums', kick(**kw), at, 0.95 * gain)

    def impact(self, at, gain=1.0):
        """Scene-change hit: kick + sub boom + air."""
        self.kick(at, gain)
        self.put('fx', boom(), at, 0.75 * gain, rv=0.35)
        self.put('fx', fft_filt(noise(1.6), lo=4000, order=1) * np.exp(-tt(1.6) * 3.2), at, 0.22 * gain, rv=0.5)

    def pad(self, chords, cutoff=lambda sec: 1800, gain=0.55, rv=0.35, voices=(-0.14, -0.07, 0, 0.07, 0.14), last_decay=0.55):
        """Stereo supersaw pad. chords: [(beat_from, beat_to, ['F3','Ab3',...]), ...]; cutoff(sec) -> Hz."""
        L, R = np.zeros(self.N), np.zeros(self.N)
        for k_ch, (b0, b1, notes) in enumerate(chords):
            i0, i1 = int(self.bt(b0) * SR), min(self.N, int(self.bt(b1) * SR) + int(0.25 * SR))
            t = np.arange(i1 - i0) / SR
            env = np.minimum(1, t / 0.06) * np.minimum(1, np.maximum(0, (t[-1] - t) / 0.25))
            if k_ch == len(chords) - 1:
                env *= np.exp(-t * last_decay)
            for nm in notes:
                f = hz(nm)
                for k, d in enumerate(voices):
                    v = saw(f * 2 ** (d / 12), t + rng.random() / f) * env / len(notes) / len(voices)
                    gl, gr = (1.35, 0.65) if k % 2 else (0.65, 1.35)
                    L[i0:i1] += v * gl
                    R[i0:i1] += v * gr
        self.put('music', np.stack([tv_filt(L, cutoff), tv_filt(R, cutoff)]), 0, gain, rv=rv)

    # ------------------------------------------------------------ mixdown
    def _sidechain(self, depth):
        tN = np.arange(self.N) / SR
        sc = np.ones(self.N)
        for tk in sorted(self.kicks):
            i = int(tk * SR)
            seg = tN[i:i + int(0.45 * SR)] - tk
            sc[i:i + len(seg)] = np.minimum(sc[i:i + len(seg)], 1 - depth * np.exp(-seg / 0.1) * np.minimum(1, seg / 0.003))
        return sc

    def _reverb(self, rt60=2.3):
        t = tt(3.0)
        out = []
        for ch in range(2):
            ir = rng.standard_normal(len(t)) * 10 ** (-3 * t / rt60)
            ir = fft_filt(tv_filt(ir, lambda s: 9000 * np.exp(-s * 1.2) + 900), lo=180, order=1)
            ir = np.concatenate([np.zeros(int(0.015 * SR)), ir])
            ir /= np.sqrt(np.sum(ir ** 2))
            x = self.bus['verb'][ch]
            nfft = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
            out.append(np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:len(x)])
        return np.stack(out)

    def report(self, mix_gains):
        """Per-bar RMS (dBFS) for each bus: the 'listening' you can do without ears."""
        bar = 4
        db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
        print('bus      ' + ' '.join(f'bar{b + 1:<3d}' for b in range(int(np.ceil(self.beats / bar)))))
        for k, g in mix_gains.items():
            x = self.bus[k] * g
            cells = []
            for b in range(int(np.ceil(self.beats / bar))):
                a, z = int(self.bt(b * bar) * SR), int(self.bt(min(self.beats, b * bar + bar)) * SR)
                v = db(x[:, a:z])
                cells.append(f'{v:6.1f}' if v > -120 else '   -  ')
            print(f'{k:8s} ' + ' '.join(cells))

    def mixdown(self, path, gains=None, sidechain=0.62, peak=0.86, fade=0.35, verbose=True):
        """Bus gains -> sidechain -> reverb -> 25 Hz HPF -> pre-clip normalise -> tanh -> final peak.
        Normalising BEFORE the soft clipper is what keeps it from crushing the mix (only the biggest
        transients kiss it). Lands around -14..-16 LUFS for typical arrangements."""
        g = {'drums': 0.6, 'music': 0.9, 'fx': 0.6, 'wet': 1.3, **(gains or {})}
        wet = self._reverb() * 0.55
        mix = g['drums'] * self.bus['drums'] + g['music'] * self.bus['music'] * self._sidechain(sidechain) + g['fx'] * self.bus['fx'] + g['wet'] * wet
        mix = np.stack([fft_filt(mix[0], lo=25), fft_filt(mix[1], lo=25)])[:, :int(self.dur * SR)]
        mix *= 1.15 / np.max(np.abs(mix))
        mix = np.tanh(mix)
        f = int(fade * SR)
        mix[:, -f:] *= np.linspace(1, 0, f) ** 2
        mix *= peak / np.max(np.abs(mix))
        pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
        with wave.open(path, 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        if verbose:
            self.bus['wet'] = wet
            self.report({k: g[k] for k in ('drums', 'music', 'fx', 'wet')})
            del self.bus['wet']
            print(f'wrote {path}: {mix.shape[1] / SR:.3f}s, {len(self.kicks)} kicks')
