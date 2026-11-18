# Rewrite the chapter and link times in notes/youtube-description.txt and notes/notes.md for a given
# cold-open length. times-body.json holds each time relative to the start of the title card
# (video time = cold open + value). Usage: python3 set_times.py <cold-open seconds> (0 = body only).
import json,re,sys,os
CO=float(sys.argv[1]); E=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../..')
T=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'times-body.json')))
fmt=lambda t: f"{int(t//3600)}:{int(t%3600//60):02d}:{int(t%60):02d}" if t>=3600 else f"{int(t//60):02d}:{int(t%60):02d}"
p=os.path.join(E,'notes/youtube-description.txt'); out=[]
for l in open(p).read().split('\n'):
    a=re.match(r'^(\d\d:\d\d) (.+)$',l)
    if a and a.group(2) in T['yt_chapters']:
        v=T['yt_chapters'][a.group(2)]
        if a.group(2)=='Cold open' and CO==0: continue
        l=f"{fmt(0 if a.group(2)=='Cold open' else v+CO)} {a.group(2)}"
    l=re.sub(r'\((\d\d:\d\d)\) (https?://\S+)',lambda b:f"({fmt(T['yt_links'][b.group(2)]+CO)}) {b.group(2)}",l)
    out.append(l)
s='\n'.join(out)
if CO==0 and '00:00 Cold open' not in s and 'TODO cold open' not in s:
    s=s.replace('Chapters:\n','Chapters (TODO cold open: add its length to every time; run video/final/edit/set_times.py <seconds>):\n')
if CO>0: s=re.sub(r'Chapters \(TODO cold open[^\n]*\):\n','Chapters:\n',s)
if CO>0 and '00:00 Cold open' not in s: s=s.replace('Chapters:\n','Chapters:\n00:00 Cold open\n')
open(p,'w').write(s)
p=os.path.join(E,'notes/notes.md'); out=[]
for l in open(p).read().split('\n'):
    b=re.match(r'^(- \[)(\d\d:\d\d)(\] .*?)(https?://\S+)(.*)$',l)
    if b and b.group(4) in T['notes']: l=f"{b.group(1)}{fmt(T['notes'][b.group(4)]+CO)}{b.group(3)}{b.group(4)}{b.group(5)}"
    out.append(l)
t='\n'.join(out)
t=re.sub(r'\(`episode-197-final.mp4`: [^)]*\)', f"(`episode-197-final.mp4`: {'a '+str(round(CO))+' s cold open, then ' if CO else 'TODO cold open, then '}the 14 s title card, then the edited show)", t)
open(p,'w').write(t)
print('set times for cold open',CO)
