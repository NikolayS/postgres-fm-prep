import csv,sys
from PIL import Image, ImageDraw
p=sys.argv[1]; rows=[]
for r in csv.DictReader(open(f'{p}.csv')):
    i=int(r['file'][-9:-4]); t=60+2*i
    if 2010<=t<=2160: continue
    f={k:float(v) for k,v in r.items() if k!='file'}
    if f['faceW']==0 or f['hand']>0 or f['handChin']>0: continue
    if abs(f['yaw'])>0.2 or abs(f['roll'])>0.2 or f['eyeOpen']<0.2: continue
    s=f['smile']*3+f['eyeOpen']*4+min(f['sharp'],150)/150+min(f['mouthOpen'],0.3)*2
    rows.append((s,t,r['file'],f))
rows.sort(reverse=True); top=rows[:40]
for s,t,fn,f in top[:40]: print(round(s,3),t,fn,f['eyeOpen'],f['smile'],f['mouthOpen'],f['sharp'],f['faceW'])
S=Image.new('RGB',(8*320,5*200),'white'); d=ImageDraw.Draw(S)
for j,(s,t,fn,f) in enumerate(top):
    S.paste(Image.open(fn).resize((320,180)),((j%8)*320,(j//8)*200)); d.text(((j%8)*320+4,(j//8)*200+182),f'{j} t={t}',fill='black')
S.save(f'top-{p}.png')
