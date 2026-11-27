# v8.1b audio: v8.1 audio minus r15's entry sound (w09 - x3 at x3 48.2-48.9 s, x0.872), raw f32 stereo to stdout.
import numpy as np, subprocess, sys
SR = 48000
o = np.fromfile('o9.f32', dtype=np.float32).astype(np.float64).reshape(-1, 2)
x = np.fromfile('x3.f32', dtype=np.float32).astype(np.float64).reshape(-1, 2)
d = o[:min(len(o), len(x))] - x[:min(len(o), len(x))]
s0, s1 = int(48.2 * SR), int(48.9 * SR); seg = d[s0:s1].copy(); f = int(0.01 * SR)
w = np.ones(len(seg)); w[:f] = np.linspace(0, 1, f); w[-f:] = np.linspace(1, 0, f); seg *= w[:, None] * 0.872
F = np.frombuffer(subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', '../../for-nik/70-episode-198-final-v81.mp4', '-vn', '-ac', '2', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).copy()
k = int(round(1182.0223333333333 * SR))
F[k + s0:k + s1] -= seg.astype(np.float32)
sys.stdout.buffer.write(F.tobytes())
