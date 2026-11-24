import csv,sys
from PIL import Image, ImageDraw
p=sys.argv[1]; ts=[int(x) for x in sys.argv[2].split(',')]
R={60+2*int(r['file'][-9:-4]):r for r in csv.DictReader(open(f'{p}.csv'))}
S=Image.new('RGB',(5*360,((len(ts)+4)//5)*380),'white'); d=ImageDraw.Draw(S)
for j,t in enumerate(ts):
    r=R[t]; cx,cy,w=float(r['faceX']),float(r['faceY']),float(r['faceW'])*1.2
    im=Image.open(r['file']).crop((int(cx-w),int(cy-w),int(cx+w),int(cy+w))).resize((360,360),Image.LANCZOS)
    S.paste(im,((j%5)*360,(j//5)*380)); d.text(((j%5)*360+4,(j//5)*380+362),f't={t} eye{r["eyeOpen"]} sm{r["smile"]} yaw{r["yaw"]}',fill='black')
S.save(f'cand-{p}.png')
