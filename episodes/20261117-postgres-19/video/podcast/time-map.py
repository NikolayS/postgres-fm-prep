# Run in <recording>/review/work-like folder holding edited-v2.cuts.json (from <recording>/review).
# Source (Zoom recording) -> podcast time map for episode 197.
# podcast = BODY0 + body v5 time; body v5 = body v3 (= edited-v2 output) minus body-v5 cuts.
# BODY0: the final's audio join, measured: 1024-sample pad + cold open (2,101,248) + 1024-sample pad.
import json,os
HERE=os.path.dirname(os.path.abspath(__file__))
BODY0=(1024+2101248+1024)/48000
st=json.load(open('edited-v2.cuts.json'))['segmentTimes']
cuts=json.load(open(os.path.join(HERE,'../final/edit/body-v5-cuts.json')))['cuts']
def v5(t):  # body v3 -> v5 (t not inside a cut)
    return t-sum(min(c['to'],t)-c['from'] for c in cuts if t>c['from'])
segs=[]
for s in st:
    a,b=s['outStart'],s['outEnd']
    # split [a,b) by cuts
    pts=[a]+[x for c in cuts for x in (c['from'],c['to']) if a<x<b]+[b]
    for i in range(len(pts)-1):
        x,y=pts[i],pts[i+1]
        if any(c['from']<=x and y<=c['to'] for c in cuts): continue
        if y-x<1e-6: continue
        src=s['srcStart']+(x-a)
        segs.append({'srcStart':round(src,4),'srcEnd':round(src+(y-x),4),'audioStart':round(BODY0+v5(x),4)})
total=153732096/48000
talk_end=segs[-1]['audioStart']+segs[-1]['srcEnd']-segs[-1]['srcStart']
m={'note':'episode 197 podcast: source -> podcast seconds (cold open 0-43.8 s not mapped; body from %.4f s)'%BODY0,
   'intro':{'start':0,'talkStart':BODY0},'talk':{'start':BODY0,'end':round(talk_end,3)},'outro':{'end':round(total,3)},'segments':segs,'total':round(total,3)}
json.dump(m,open('podcast.time-map.json','w'),indent=1)
print(len(segs),'segments; talk end',talk_end,'total',total)
