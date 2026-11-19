# Prepend the cold-open cues (YouTube SRT cues 1-12, cold-open time) to the podcast SRT/VTT and transcript.
# Podcast cold open starts after the final's 1024-sample pad: +0.0213 s.
import re,os
HERE=os.path.dirname(os.path.abspath(__file__))
SH=1024/48000
Y=open(os.path.join(HERE,'../../notes/subtitles-en.srt')).read().strip().split('\n\n')[:12]
spk={1:'Nik',2:None,3:'Michael',4:'Kirk',5:'Kirk',6:'Kirk',7:'Nik',8:'Michael',9:'Kirk',10:None,11:'Nik',12:None}
def ts(s):
    h,m,r=s.split(':'); s,ms=r.split(','); return int(h)*3600+int(m)*60+int(s)+int(ms)/1000
def fmt(t,sep):
    ms=round(t*1000); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d}{sep}{ms%1000:03d}"
cues=[]
for b in Y:
    l=b.split('\n'); a,z=l[1].split(' --> '); cues.append((ts(a)+SH,ts(z)+SH,l[2:]))
srt=[];vtt=[];prev=None
for i,(a,z,lines) in enumerate(cues,1):
    s=spk[i]; L=list(lines)
    if s and s!=prev: L[0]=f"{s}: "+L[0]
    if len(L)==1 and len(L[0])>42:
        w=L[0].split(' '); k=min(range(1,len(w)),key=lambda k:abs(len(' '.join(w[:k]))-len(' '.join(w[k:])))); L=[' '.join(w[:k]),' '.join(w[k:])]
    srt.append((a,z,L))
    if i==10: V=["<v Nik>[laughs]</v>" if False else "[laughs]","<v Nik>Decades. The only thing left,</v>"]
    elif i==12: V=["<v Michael>The only thing. That small thing.</v>","[laughs]"]
    elif s: V=[f"<v {s}>"+"\n".join(lines)+"</v>"]
    else: V=lines
    vtt.append((a,z,V)); prev=s if s else ('Nik' if i==10 else 'Michael' if i==12 else prev)
body=open('out/podcast.srt').read().strip().split('\n\n')
out=[]
for i,(a,z,L) in enumerate(srt,1): out.append(f"{i}\n{fmt(a,',')} --> {fmt(z,',')}\n"+"\n".join(L))
for j,b in enumerate(body,len(srt)+1):
    l=b.split('\n'); out.append(f"{j}\n"+"\n".join(l[1:]))
open('final/podcast.en.srt','w').write("\n\n".join(out)+"\n")
v=open('out/podcast.vtt').read(); head,rest=v.split('\n\n',1)
vt=[f"{fmt(a,'.')} --> {fmt(z,'.')}\n"+"\n".join(V) for a,z,V in vtt]
open('final/podcast.en.vtt','w').write(head+"\n\n"+"\n\n".join(vt)+"\n\n"+rest)
co=[('Nik',1,"Because the GTA VI is being released on November 19."),('Michael',3,"When would GTA 19 come out? Like a couple of hundred years?"),
    ('Kirk',4,"We have commit fests, and then we had a revert fest 10 or 20x the number of CVEs in the same year. Like, that's insane."),
    ('Nik',7,"From 200 per second, we went to 11,000 per second."),('Michael',8,"No-go area for Postgres for years,"),
    ('Kirk',9,"You said years, I think you meant decades."),('Nik',10,"Decades. The only thing left, from among big gaps is just DDL, right? Just DDL and Postgres 20 and that's it."),
    ('Michael',12,"The only thing. That small thing.")]
def hms(t): t=int(t); return f"{t//3600:02d}:{t//60%60:02d}:{t%60:02d}"
md=open('out/podcast.transcript.md').read(); t1,rest=md.split('\n\n',1)
blk="\n\n".join(f"**{s}** [{hms(cues[i-1][0] + (0.9 if i==10 else 0))}]\n\n{x}" for s,i,x in co)
open('final/podcast.transcript.md','w').write(t1+"\n\n"+blk+"\n\n"+rest)
print('ok')
