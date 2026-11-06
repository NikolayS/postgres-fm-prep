import json,sys,re
R="/Users/nik/Documents/Zoom/2026-11-04 14.09.51 .fm recording/review"
W=[w for w in json.load(open(R+"/src.words.json"))["words"] if w.get("type")=="word"]
segs=json.load(open(R+"/01-edited.cuts.json"))["segmentTimes"]
def ed(t):
  for s in segs:
    if t<s["srcStart"]: return s["outStart"],"CUT"
    if t<=s["srcEnd"]: return round(s["outStart"]+t-s["srcStart"],2),""
  return segs[-1]["outEnd"],"END"
norm=lambda s: re.sub(r"[^a-z0-9']","",s.lower())
toks=[norm(w["text"]) for w in W]
for q in sys.argv[1:]:
  near=None
  if "@" in q: q,near=q.split("@"); near=float(near)
  qt=[norm(x) for x in q.split() if norm(x)]
  for i in range(len(toks)-len(qt)+1):
    if toks[i:i+len(qt)]==qt:
      a=W[i]["start"]; b=W[i+len(qt)-1]["end"]
      if near is not None and abs(a-near)>60: continue
      e,f=ed(a); print(f"{q!r}: src {a:.2f}-{b:.2f} ({int(a//60)}:{a%60:05.2f}) edited {e} {f} final {round(e+13,2) if isinstance(e,float) else e}")
