#!/usr/bin/env python3
# Re-synthesizes the overlay sand strokes and the punch (sfx/README.md):
#   python3 sfx/generate.py [outdir]     (numpy + scipy; default outdir: sfx/generated)
# Writes G9, G10, K and L as 48 kHz mono 16-bit wav, peak -0.5 dBFS.
#
# The shipped wavs came from an interactive session whose script was not kept; this is a
# reconstruction from the recorded parameters. It gives the same kind of sound (envelope, band,
# sweep, grain), not byte-identical files: the noise draws differ. Use the shipped wavs in
# episodes; use this to make variants (change one parameter, listen next to the original).
import os, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, iirpeak, lfilter, sosfilt

SR = 48000


def env(n, rise, decay, tail=0.01):
    # Raised-cosine attack to the peak at `rise` s, then exp(-(t - rise) / decay), and a `tail` s
    # fade at the very end so the file stops without a click.
    t = np.arange(n) / SR
    e = np.where(t < rise, 0.5 - 0.5 * np.cos(np.pi * t / max(rise, 1e-9)), np.exp(-(t - rise) / decay))
    d = max(1, int(tail * SR))
    e[n - d:] *= np.linspace(1, 0, d)
    return e


def sand(T, rise, decay, f_from, f_to, grain_rate=2500, cut=4500, seed=0, body=0.5, lowcut=180, q=(0.55, 1.8)):
    """Granular sand stroke: short noise grains (Poisson, grain_rate per s), each through a
    resonant band at the current sweep frequency (log sweep f_from -> f_to) with Q drawn from q,
    plus a continuous `body` of noise in the same moving band; then highpass `lowcut`, lowpass
    `cut` (nothing bright above ~4.5 kHz). Envelope: peak at `rise` s, then decay time constant `decay` s."""
    rng = np.random.default_rng(seed)
    n = int(T * SR)
    t = np.arange(n) / SR
    f = f_from * (f_to / f_from) ** (t / T)
    out = np.zeros(n + SR // 50)
    # Grains: 1.5-5 ms Hann-windowed noise, random level, own band and Q.
    times = np.cumsum(rng.exponential(1 / grain_rate, int(grain_rate * T * 1.5)))
    for g in times[times < T]:
        i = int(g * SR)
        L = int(rng.uniform(0.0015, 0.005) * SR)
        b, a = iirpeak(min(f[i], SR / 2 - 100), rng.uniform(*q), fs=SR)
        x = lfilter(b, a, rng.standard_normal(L) * np.hanning(L)) * rng.uniform(0.2, 1.0)
        out[i:i + L] += x
    out = out[:n]
    # Body: noise through the moving band, 10 ms blocks with the filter state carried over.
    bodyx = np.zeros(n)
    zi, B = np.zeros(2), SR // 100
    noise = rng.standard_normal(n)
    for s in range(0, n, B):
        b, a = iirpeak(f[s], np.mean(q), fs=SR)
        bodyx[s:s + B], zi = lfilter(b, a, noise[s:s + B], zi=zi)
    out = out / (np.abs(out).max() + 1e-12) + body * bodyx / (np.abs(bodyx).max() + 1e-12)
    out = sosfilt(butter(2, lowcut, "highpass", fs=SR, output="sos"), out)
    out = sosfilt(butter(4, cut, "lowpass", fs=SR, output="sos"), out)
    return out * env(n, rise, decay)


def punch(T=0.6, f0=160, f1=48, tau=0.035, decay=0.16, knock=0.6, knock_band=(200, 600), grit=0.3, lowpass=1800, seed=31):
    """A low punch: a sine whose pitch drops f0 -> f1 (exponential, time constant tau) with an
    exponential decay, a short knock (noise in knock_band), and a little broadband grit; all
    lowpassed. It is not sub-only: phones play nothing under ~150 Hz, the knock carries it there."""
    rng = np.random.default_rng(seed)
    n = int(T * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / tau)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay)
    kn = sosfilt(butter(2, knock_band, "bandpass", fs=SR, output="sos"), rng.standard_normal(n))
    kn = knock * kn / np.abs(kn).max() * np.exp(-t / 0.04)
    gr = grit * rng.standard_normal(n) * np.exp(-t / decay)  # grit rides the body's decay
    out = sosfilt(butter(4, lowpass, "lowpass", fs=SR, output="sos"), body + kn + gr)
    return out * env(n, 0.002, 10.0, tail=0.02)  # 2 ms attack, no click; the body sets the decay


def write(path, x, peak_db=-0.5):
    x = x / (np.abs(x).max() + 1e-12) * 10 ** (peak_db / 20)
    wavfile.write(path, SR, np.round(x * 32767).astype(np.int16))


SOUNDS = {
    "G9-wider-band": lambda: sand(0.40, 0.07, 0.09, 900, 1800, q=(0.4, 2.4), seed=49),
    "G10-soft-start-quick-stop": lambda: sand(0.40, 0.16, 0.05, 900, 1800, seed=50),
    "K-sand-stroke-falling": lambda: sand(0.45, 0.06, 0.11, 1600, 700, seed=25),
    "L-punch-rough": lambda: punch(0.6, 160, 48, tau=0.035, decay=0.16, knock=0.6, knock_band=(200, 600), grit=0.3, lowpass=1800, seed=31),
}

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated")
    os.makedirs(out, exist_ok=True)
    for name, make in SOUNDS.items():
        write(os.path.join(out, f"{name}.wav"), make())
        print(os.path.join(out, f"{name}.wav"))
