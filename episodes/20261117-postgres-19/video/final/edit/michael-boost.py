#!/usr/bin/env python3
"""Level the hosts in the edited body: Michael +7 dB with presence EQ (his mic runs about 9 dB quiet), Nik +1.5 dB.

Usage: python3 michael-boost.py <recording dir> <in.mp4> <out.mp4> [dB]

Michael's turns come from the transcript speaker labels (speaker_0 in review/work/src.words.json).
They are mapped through edited-v2.cuts.json to output time. The audio gets +dB in his turns
(default 7) and the cold-open presence EQ, then a limiter and the same two-pass loudnorm as render.ts (-16 LUFS, TP -2).
The video stream is copied.
"""
import bisect, json, re, subprocess, sys
from pathlib import Path

rec, src, out = sys.argv[1:4]
db = float(sys.argv[4]) if len(sys.argv) > 4 else 7.0
here = Path(__file__).resolve().parent
W = [w for w in json.load(open(f"{rec}/review/work/src.words.json"))["words"] if w.get("type", "word") == "word"]
seg = json.load(open(here / "edited-v2.cuts.json"))["segmentTimes"]
MICHAEL, NIK = "speaker_0", "speaker_1"
NIK_DB = 1.5  # Nik runs about 1.5 dB under Kirk after the mix (qa.ts audio spread)


def ranges(spk):
    """A speaker's turns in output time, padded but not into another speaker's words."""
    oth = [w for w in W if w["speaker"] != spk]
    oe = sorted(w["end"] for w in oth); os_ = sorted(w["start"] for w in oth)
    turns = []
    for i, w in enumerate(W):
        if w["speaker"] != spk: continue
        if turns and w["start"] - turns[-1][1] < 1.5 and W[i - 1]["speaker"] == spk: turns[-1][1] = w["end"]
        else: turns.append([w["start"], w["end"]])
    outr = []
    for s, e in turns:
        j = bisect.bisect_right(oe, s + 0.01); prev = oe[j - 1] if j else 0
        k = bisect.bisect_left(os_, e - 0.01); nxt = os_[k] if k < len(os_) else 1e9
        a, b = max(s - 0.12, min(prev, s)), min(e + 0.25, max(nxt, e))
        if b - a <= 0.05: continue
        for g in seg:  # map to output time through the kept segments
            lo, hi = max(a, g["srcStart"]), min(b, g["srcEnd"])
            if hi > lo: outr.append((g["outStart"] + lo - g["srcStart"], g["outStart"] + hi - g["srcStart"]))
    outr.sort()
    merged = []
    for a, b in outr:
        if merged and a - merged[-1][1] < 0.05: merged[-1][1] = max(merged[-1][1], b)
        else: merged.append([a, b])
    return merged


merged, nik = ranges(MICHAEL), ranges(NIK)
print(f"Michael: {len(merged)} output ranges, {sum(b - a for a, b in merged):.0f} s, +{db} dB; Nik: {len(nik)} ranges, +{NIK_DB} dB")

# Weights 0..1 with 40 ms linear ramps; volume is evaluated every 256 samples (5 ms), so the
# switch between the paths does not click. Michael wins where his and Nik's padding overlap.
R = 0.04
wexpr = lambda rs: "+".join(f"clip((t-{a - R / 2:.3f})/{R},0,1)*clip(({b + R / 2:.3f}-t)/{R},0,1)" for a, b in rs)
expr = f"min(1,{wexpr(merged)})"
nexpr = f"min(1,{wexpr(nik)})*(1-{expr})"
lin = 10 ** (db / 20)
# Michael's path: the cold-open v8 presence chain (high-pass, de-mud, presence) plus the gain;
# the other path keeps everyone else as is. Each path is muted outside its own ranges.
EQ = "highpass=f=90,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3000:t=q:w=0.9:g=4,equalizer=f=5500:t=q:w=1:g=2"
nlin = 10 ** (NIK_DB / 20)
pre = (f"asetnsamples=n=256,asplit=3[m][n][o];[m]{EQ},volume='{lin:.4f}*{expr}':eval=frame[m2];"
       f"[n]volume='{nlin:.4f}*{nexpr}':eval=frame[n2];[o]volume='max(0,1-{expr}-{nexpr})':eval=frame[o2];"
       f"[m2][n2][o2]amix=inputs=3:normalize=0,alimiter=limit=0.89:attack=5:release=50:level=false")
LN = "loudnorm=I=-16:TP=-2.0:LRA=11"
m = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-vn", "-filter_complex", f"[0:a]{pre},{LN}:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", m)[-1])
ln2 = f"{LN}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", f"[0:a]{pre},{ln2},aresample=48000[a]", "-map", "0:v", "-map", "[a]", "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
json.dump([[round(a, 3), round(b, 3)] for a, b in merged], open(Path(out).with_suffix(".michael.json"), "w"))
print(f"wrote {out}")
