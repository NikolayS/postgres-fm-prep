import re,sys
def ts(s): h,m,r=s.replace(',','.').split(':'); return int(h)*3600+int(m)*60+float(r)
def fmt(t,sep): h=int(t//3600); m=int(t%3600//60); s=t-h*3600-m*60; return f"{h:02d}:{m:02d}:{s:06.3f}".replace('.',sep)
def load(f,vtt):
  txt=open(f).read().strip()
  if vtt: txt=txt.split('\n\n',1)[1]
  cues=[]
  for b in txt.split('\n\n'):
    L=b.split('\n')
    if not vtt: L=L[1:]
    a,_,z=L[0].split(' '); cues.append([ts(a),ts(z),L[1:]])
  return cues
def save(f,cues,vtt):
  sep='.' if vtt else ','; out=[]
  for i,(a,z,L) in enumerate(cues,1):
    head=[] if vtt else [str(i)]
    out.append('\n'.join(head+[f"{fmt(a,sep)} --> {fmt(z,sep)}"]+L))
  open(f,'w').write(('WEBVTT\n\n' if vtt else '')+'\n\n'.join(out)+'\n')
base=sys.argv[1] if len(sys.argv)>1 else 'final-en'
for f,vtt in ((base+'.srt',0),(base+'.vtt',1)):
  c=load(f,vtt)
  k=[n for n,q in enumerate(c) if ''.join(q[2]).endswith('DDL, right?</v>' if vtt else 'DDL, right?')][0]
  # 73+74: one Kirk line
  c[k]=[c[k][0],c[k+1][1],[('<v Kirk>DDL, right? Making changes.</v>' if vtt else 'DDL, right? Making changes.')]]
  # 773+774: two speakers, two lines
  i=[n for n,q in enumerate(c) if 'I do-' in ''.join(q[2]) and 'Faster.' in ''.join(q[2])][0]; assert 'I do-' in ''.join(c[i][2]) and 'Often.' in ''.join(c[i+1][2]), c[i:i+2]
  c[i]=[c[i][0],c[i+1][1],(['<v Kirk>I do- Right?</v>','<v Nik>Faster. Often.</v>'] if vtt else ['- I do- Right?','- Faster. Often.'])]
  del c[i+1]; del c[k+1]
  # 198: move the boundary to 199 by 0.07 s (index shifted by the delete above)
  j=[n for n,q in enumerate(c) if ''.join(q[2]) in ('- Right?- Yeah.','<v Kirk>Right?</v><v Nik>Yeah.</v>','<v Nik>Right?</v><v Kirk>Yeah.</v>') and q[1]-q[0]<1][0]; assert 'Right?' in ''.join(c[j][2]), c[j]
  c[j][1]=c[j][0]+1.0; c[j+1][0]=c[j][1]
  # first cue: capital letter
  c[0][2][0]=c[0][2][0].replace('as long','As long')
  print(f,k,i,j)
  save(f,c,vtt)
print('ok')
