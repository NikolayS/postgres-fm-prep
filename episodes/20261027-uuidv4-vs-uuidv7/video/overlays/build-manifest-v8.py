# Builds manifest-v8.json: band cards use the -typing.mov when present, with U2 typing over
# each typed line; center cards get G10 in / G9 out; L only at the sudden in-card reveals.
import json, os, subprocess
O = os.path.dirname(os.path.abspath(__file__))
m = json.load(open(f"{O}/manifest-woof.json"))
ACCENT = {"02": [24.8], "07": [16.6]}          # sudden in-card reveals -> punch L
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
missing = []
for it in m["overlays"]:
    k = it["id"][:2]
    if it["placement"] == "band":
        typed = it["file"].replace(".mov", "-typing.mov")
        bursts = f"{O}/{k}-typing-bursts.json"
        if os.path.exists(f"{O}/{typed}") and os.path.exists(bursts):
            it["file"] = typed
            b = json.load(open(bursts)); b = b.get("bursts", b) if isinstance(b, dict) else b
            # one sound span per typed line: from the line's first burst start
            lines = {}
            for x in b: lines.setdefault(x.get("line", 0), []).append(x)
            keep = [s for s in it["sfx"] if "thud" in s["file"]]
            it["sfx"] = keep + [{"file": "sfx/typeu2.wav", "at": round(min(x["start"] for x in v), 3),
                                 "gain": 1, "dur": round(max(x["end"] for x in v) - min(x["start"] for x in v), 3)}
                                for v in lines.values()]
        else:
            missing.append(it["id"]); it["sfx"] = [s for s in it["sfx"] if "woof" not in s["file"]]
    else:
        d = dur(f"{O}/{it['file']}")
        keep = [s for s in it["sfx"] if "thud" in s["file"] and not any(abs(s["at"] - a) < 0.5 for a in ACCENT.get(k, []))]
        it["sfx"] = ([{"file": "sfx/sandg10.wav", "at": 0.05, "gain": 1}] + keep
                     + [{"file": "sfx/punchl.wav", "at": a, "gain": 1} for a in ACCENT.get(k, [])]
                     + [{"file": "sfx/sandg9.wav", "at": round(d - 0.45, 2), "gain": 0.7}])
json.dump(m, open(f"{O}/manifest-v8.json", "w"), indent=2)
for it in m["overlays"]: print(it["id"][:20], it["file"], [(os.path.basename(s["file"]), s["at"]) for s in it["sfx"]])
print("band cards still without typing version:", missing)
