import subprocess, sys, numpy as np
src=sys.argv[1]; W,H=160,90
p=subprocess.run(["ffmpeg","-v","error","-i",src,"-vf","fps=1,scale=160:90","-f","rawvideo","-pix_fmt","gray","-"],capture_output=True)
a=np.frombuffer(p.stdout,np.uint8).reshape(-1,H,W).astype(float)
ref=np.median(a,axis=0)
br=a[:,45:,80:]  # circleback quadrant
brref=np.median(br,axis=0)
d=np.abs(br-brref).mean(axis=(1,2))
# grid separators: row 45 boundary and col 80 boundary darkness
print("frames",len(a))
bad=[(i,round(x,1)) for i,x in enumerate(d) if x>3]
print("circleback-quadrant deviations (s,diff):",bad[:50], len(bad))
# per-quadrant structure: check that quadrant boundaries persist: mean abs diff of whole frame vs median in top-left/top-right/bottom-left low-frequency
for name,(ys,xs) in {"TL":(slice(0,45),slice(0,80)),"TR":(slice(0,45),slice(80,160)),"BL":(slice(45,90),slice(0,80))}.items():
    q=a[:,ys,xs]; m=np.median(q,axis=0); dd=np.abs(q-m).mean(axis=(1,2))
    print(name,"max",round(dd.max(),1),"n>25",[(i,round(x,1)) for i,x in enumerate(dd) if x>25][:30])
