import json, numpy as np, sys
SR=16000
a=np.fromfile('src16k.f32',dtype=np.float32)
W=json.load(open(sys.argv[1]))['words']
W=[w for w in W if w.get('type')=='word']
# mel filterbank
n_fft=512; hop=160; win=400
def mel(f): return 2595*np.log10(1+f/700)
def imel(m): return 700*(10**(m/2595)-1)
M=40
pts=imel(np.linspace(mel(60),mel(7600),M+2)); bins=np.floor((n_fft+1)*pts/SR).astype(int)
fb=np.zeros((M,n_fft//2+1))
for i in range(M):
  l,c,r=bins[i],bins[i+1],bins[i+2]
  fb[i,l:c]=(np.arange(l,c)-l)/max(c-l,1); fb[i,c:r]=(r-np.arange(c,r))/max(r-c,1)
hw=np.hanning(win)
def feats(t0,t1):
  s=a[int(t0*SR):int(t1*SR)]
  if len(s)<win: return np.zeros((0,M))
  n=1+(len(s)-win)//hop
  idx=np.arange(win)[None,:]+hop*np.arange(n)[:,None]
  fr=s[idx]*hw
  sp=np.abs(np.fft.rfft(fr,n_fft))**2
  lm=np.log(sp@fb.T+1e-10)
  e=lm.mean(1); keep=e>np.percentile(e,30)
  # DCT -> cepstra 1..20
  k=np.arange(M); D=np.cos(np.pi/M*(k[None,:]+0.5)*np.arange(1,21)[:,None])
  return (lm[keep]@D.T)
def turns(lo,hi,minw):
  out=[];cur=None
  for w in W:
    if not(lo<=w['start']<hi): continue
    if cur and w['speaker']==cur['spk'] and w['start']-cur['end']<1.0:
      cur['end']=w['end'];cur['n']+=1
    else:
      if cur and cur['n']>=minw: out.append(cur)
      cur={'spk':w['speaker'],'start':w['start'],'end':w['end'],'n':1}
  if cur and cur['n']>=minw: out.append(cur)
  return out
train={}
for t in turns(0,4240,8):
  if 1080<t['end'] and t['start']<1470: continue
  if t['spk']=='speaker_3': continue
  train.setdefault(t['spk'],[]).append(t)
models={}
rng=np.random.default_rng(0)
test={}
for s,ts in train.items():
  rng.shuffle(ts); te=ts[::5]; tr=[x for i,x in enumerate(ts) if i%5]
  test[s]=te
  F=np.concatenate([feats(x['start'],x['end']) for x in tr])
  models[s]=(F.mean(0),F.var(0)+1e-3)
  print(s,len(tr),F.shape)
def score(t0,t1):
  F=feats(t0,t1)
  if len(F)==0: return None
  r={}
  for s,(m,v) in models.items():
    r[s]=float((-0.5*(((F-m)**2)/v+np.log(v))).sum(1).mean())
  return r
ok=0;n=0
for s,te in test.items():
  for t in te:
    r=score(t['start'],t['end']); b=max(r,key=r.get); n+=1; ok+=(b==s)
    if b!=s: print('miss',s,b,t)
print('heldout acc',ok,n)
np.save('models.npy',{k:(m,v) for k,(m,v) in models.items()},allow_pickle=True)
# classify windows in region
NAME={'speaker_0':'Nik','speaker_1':'Kirk','speaker_2':'Alv'}
lo,hi=float(sys.argv[2]),float(sys.argv[3])
ws=[w for w in W if lo<=w['start']<hi]
# chunk by word groups: break at speaker change or every ~1.5s
chunk=[];
def flush(ch):
  if not ch: return
  r=score(ch[0]['start'],ch[-1]['end'])
  if r is None: lab='?';marg=0
  else:
    srt=sorted(r.items(),key=lambda x:-x[1]); lab=NAME[srt[0][0]]; marg=srt[0][1]-srt[1][1]
  print(f"{ch[0]['start']:8.2f} {ch[0]['speaker'][-1]} -> {lab:4} {marg:5.1f} | {' '.join(w['text'] for w in ch)}")
for w in ws:
  if chunk and (w['speaker']!=chunk[0]['speaker'] or w['end']-chunk[0]['start']>2.5 or w['start']-chunk[-1]['end']>0.4):
    flush(chunk); chunk=[]
  chunk.append(w)
flush(chunk)
