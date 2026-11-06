import json,sys,re
cuts,man,log,out=sys.argv[1:5]
seg=json.load(open(cuts))['segmentTimes']
def m(s):
    for x in seg:
        if x['srcStart']-1e-6<=s<=x['srcEnd']+1e-6: return x['outStart']+(s-x['srcStart'])
    raise SystemExit(f'src {s} falls in a cut')
src={}
for l in open(log):
    p=l.split('\t')
    if len(p)>=4 and p[1].startswith('src'): src[p[0]]=float(p[1].split()[1])
M=json.load(open(man)); items=M['overlays'] if isinstance(M,dict) else M
for o in items:
    k=o['file'].split('/')[-1].rsplit('.',1)[0]; new=round(m(src[k]),2)
    print(k,o['outStart'],'->',new); o['outStart']=new
json.dump(M,open(out,'w'),indent=1)
