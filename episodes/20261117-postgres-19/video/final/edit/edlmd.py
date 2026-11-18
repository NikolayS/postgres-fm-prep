import json,re,sys
cuts_p,edl_p,draft_p,notes_p,out_md,coldlen=sys.argv[1:7]; CO=float(coldlen)
d=json.load(open(cuts_p)); edl=json.load(open(edl_p)); dr=json.load(open(draft_p))
seg=d['segmentTimes']
def o(src):
    for s in seg:
        if s['srcStart']-0.05<=src<=s['srcEnd']+0.05: return s['outStart']+max(0,src-s['srcStart'])
    nxt=[s for s in seg if s['srcStart']>=src]; return nxt[0]['outStart'] if nxt else seg[-1]['outEnd']
f=lambda x: f"{int(x//3600)}:{int(x%3600//60):02d}:{x%60:04.1f}" if x>=3600 else f"{int(x//60):02d}:{x%60:04.1f}"
cid={r['id']:re.search(r'\[(c\d\d)\]',r.get('reason','')).group(1) for r in edl['removals'] if re.search(r'\[(c\d\d)\]',r.get('reason',''))}
info={r['id']:r for r in dr['removals']}
by={}
for c in d['cuts']:
    for i in c['ids']:
        if i in cid: by.setdefault(cid[i],[]).append(c)
skipped={cid[s['id']]:s['reason'] for s in d['skipped'] if s['id'] in cid}
L=[f"# Episode 197 draft: cut list with draft-video times\n",
f"Video: `preview/episode-197-draft.mp4` (not in git; no cold open, it starts at the episode). The \"draft video\" column is where the cut now sits in that video (the jump point). The \"source\" column is the Zoom recording time. To restore a cut, say its id (\"restore c12\").\n",
f"Source {f(d['sourceSeconds'])} -> draft {f(d['outputSeconds'])}. Judgment cuts: {len(by)} of {len(info)} rows applied; the toolkit's automatic filler, repeat, false-start and pause cuts are listed in the full cuts file.\n",
"| id | category | draft video | source | cut s | removed (Scribe words) | why |","| --- | --- | --- | --- | --- | --- | --- |"]
tot=0
for k in sorted(info):
    r=info[k]
    if k in by:
        cs=by[k]; dur=sum(c['end']-c['start'] for c in cs); tot+=dur
        txt=' / '.join(c['text'] for c in cs if c['text'])[:220] or '(head/tail)'
        L.append(f"| {k} | {r['cat']} | {f(o(cs[0]['start'])+CO)} | {f(cs[0]['start'])} | {dur:.1f} | {txt.replace('|','/')} | {r['reason'].replace('|','/')} |")
    else:
        why=skipped.get(k,'no words matched in the Scribe transcript (noise in the bot transcript only)')
        L.append(f"| {k} | {r['cat']} | not cut | ~{r['near']} | 0 | {r['phrase'][:120].replace('|','/')} | NOT APPLIED: {why} |")
L.append(f"\nJudgment cuts total: {tot:.0f} s.\n")
# notes
L.append("## On-screen notes in the draft\n\n| draft video | tag | text |\n| --- | --- | --- |")
nt=json.load(open(notes_p)); placed=[]
for t,tag,fn,text in nt:
    h,m,s=map(int,t.split(':')); src=h*3600+m*60+s+36
    ot=o(src)+CO; placed.append((ot,fn)); L.append(f"| {f(ot)} | {tag} | {text} |")
open(out_md,'w').write('\n'.join(L)+'\n')
json.dump(placed,open(notes_p.replace('notes.json','placed.json'),'w'))
print(len(by),tot)
