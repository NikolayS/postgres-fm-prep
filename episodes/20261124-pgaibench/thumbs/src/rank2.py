import csv,sys
from PIL import Image, ImageDraw
p=sys.argv[1]; key=sys.argv[2]; rows=[]
for r in csv.DictReader(open(f'{p}.csv')):
    i=int(r['file'][-9:-4]); t=60+2*i
    if 2010<=t<=2160: continue
    f={k:float(v) for k,v in r.items() if k!='file'}
    if f['faceW']==0 or f['hand']>0 or f['handChin']>0: continue
    if abs(f['roll'])>0.25 or f['eyeOpen']<float(sys.argv[3]): continue
    s=f['smile'] if key=='smile' else f['smile']*2+f['mouthOpen']
    rows.append((s,t,r['file'],f))
rows.sort(reverse=True); top=rows[:60]
S=Image.new('RGB',(10*200,6*220),'white'); d=ImageDraw.Draw(S)
for j,(s,t,fn,f) in enumerate(top):
    im=Image.open(fn); cx,cy,w=f['faceX'],f['faceY'],f['faceW']*1.4
    im=im.crop((int(cx-w),int(cy-w),int(cx+w),int(cy+w))).resize((200,200))
    S.paste(im,((j%10)*200,(j//10)*220)); d.text(((j%10)*200+4,(j//10)*220+202),f'{j} t={t} e{f["eyeOpen"]:.2f}',fill='black')
S.save(f'z-{p}-{key}.png')
