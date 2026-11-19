# Clean-verbatim pass over a subtitles.ts transcript.md (Nik, 2026-11-19: "too much Ugh and Ogh").
# Removes fillers (uh, um, ugh, oh, ah, mm, hmm), filler "you know" and "like,", backchannel asides,
# repeated words ("I, I", "the the"), cut-off word fragments ("revis—"), backchannel-only turns,
# then merges consecutive turns of one speaker (first stamp kept). Speakers' words are not rewritten.
# Usage: python3 polish.py in.transcript.md out.transcript.md [pairs.txt]
import re,sys
WORDS=set(w.strip().lower() for w in open('/usr/share/dict/words'))
def isword(w):
    w=w.lower(); return any(x in WORDS for x in (w,w[:-1] if w.endswith('s') else w,w[:-2] if w.endswith('es') else w,w[:-2] if w.endswith('ed') else w,w[:-1] if w.endswith('d') else w,w[:-3] if w.endswith('ing') else w))
FILL=r"(?:uh|um|uhm|er|erm|ugh|oh|ah|mm|mm-hmm|hmm|uh-huh)"
CODE={'pgroast','samograph','vacuumdb','pgbench','pgcompacttable','autovacuum','dblink','libpq'}
KEEP_REPEAT={'very','really','many','much','more','old','no','bye','slowly','long','late','super','scary'}
BACK={'yeah','yes','mm','mm-hmm','right','okay','well','so','and','but','i','true','um','uh','oh','ah','ugh','hmm','yep','sure','like','it','the'}
def clean(t):
    t=re.sub(r"\*\((\w+): ([^)]*)\)\*",lambda m: '' if all(w in BACK for w in re.findall(r"[\w'-]+",m.group(2).lower())) else m.group(0),t)
    t=re.sub(rf"(?i)(^|(?<=[\s,.?!—]))(?:{FILL})[,.!?…]*(?=\s|$)",'',t)
    t=re.sub(r"(?i),\s*you know,\s*",' ',t); t=re.sub(r"(?i),\s*you know([?.])",r"\1",t); t=re.sub(r"(?i)(^|(?<=[.?!]\s))you know,\s*",'',t)
    t=re.sub(r"(?i),\s*like,\s*",' ',t); t=re.sub(r"(?:^|(?<=[.?!]\s))Like\.\s*",'',t); t=re.sub(r"(?:^|(?<=[.?!—]\s))Like,\s+",'',t); t=re.sub(r"(?i)\blike,\s+like\b","like",t)
    # cut-off fragments: a non-word ending in a dash, followed by more text
    t=re.sub(r"\b([A-Za-z']+)[—-](?=\s+\S)",lambda m: m.group(0) if (not m.group(1).islower()) or isword(m.group(1)) else '',t)
    # repeated 1-4 word groups separated by a comma or space ("I, I", "the the", "I've had a bit, I've had a bit")
    for n in (4,3,2,1):
        W=r"[\w'%]+"; g=(r"(?:"+W+r"\s+){"+str(n-1)+"}"+W) if n>1 else W
        pat=re.compile(r"(?i)\b("+g+r")"+(r"[,—?.!]?" if n>=3 else r"[,—]?")+r"\s+\1\b")
        while True:
            m=pat.search(t)
            if not m or (n==1 and m.group(1).lower() in KEEP_REPEAT): break
            t=t[:m.start()]+m.group(1)+t[m.end():]
    t=re.sub(r"\s+([,.?!])(?!\d)",r"\1",t); t=re.sub(r"([,.?!])(?:\s*,)+",r"\1",t); t=re.sub(r"^[,.\s—]+",'',t)
    t=re.sub(r"\s{2,}",' ',t).strip()
    t=re.sub(r"(?:^|(?<=[.?!] ))Like\. ",'',t)
    t=re.sub(r"(^|[.?!]\s+)([a-z][\w-]*)",lambda m: m.group(0) if re.search(r"[_\d]",m.group(2)) or m.group(2) in CODE else m.group(1)+m.group(2)[0].upper()+m.group(2)[1:],t)
    return t
src=open(sys.argv[1]).read(); head,body=src.split('\n\n',1)
blocks=re.findall(r"\*\*(\w+)\*\* \[(\d\d:\d\d:\d\d)\]\n\n(.*?)(?=\n\n\*\*\w+\*\* \[|\Z)",body,flags=re.S)
out=[];pairs=[]
for who,ts,txt in blocks:
    paras=[clean(p) for p in txt.strip().split('\n\n')]
    for a,b in zip(txt.strip().split('\n\n'),paras):
        if a!=b: pairs.append((ts,who,a,b))
    paras=[p for p in paras if p]
    words=re.findall(r"[\w'-]+",' '.join(paras).lower())
    if not paras or (len(words)<=3 and all(w in BACK for w in words)): continue
    if out and out[-1][0]==who: out[-1][2].extend(paras)
    else: out.append([who,ts,paras])
res=head+'\n\n'+'\n\n'.join(f"**{w}** [{ts}]\n\n"+'\n\n'.join(p) for w,ts,p in out)+'\n'
open(sys.argv[2],'w').write(res)
if len(sys.argv)>3:
    open(sys.argv[3],'w').write('\n\n'.join(f"[{ts}] {w}\nBEFORE: {a}\nAFTER:  {b}" for ts,w,a,b in pairs))
print(len(blocks),'turns in,',len(out),'turns out;',len(pairs),'paragraphs changed')
