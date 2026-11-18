#!/usr/bin/env bun
// Usage: bun forge/check-cards.ts [--json]. Hero numbers (SVG text of 100 px or more) count as graphics: they stay visible in the qaNoText render.
// Geometry is imported from the renderer, not duplicated here. The font loader
// lives in the overlay tool; no DOM/font loading is needed for these pure exports.
import {plugin} from 'bun';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {homedir} from 'node:os';
const tool = process.env.FORGE_TOOL ?? resolve(homedir(), 'Documents/Zoom/2026-11-17 10.02.00 .fm recording/final-overlays/tool');
const requireTool = createRequire(resolve(tool, 'package.json'));
plugin({name:'overlay-imports', setup(build) {
  build.onLoad({filter:/Ep197\.tsx$/}, args => ({contents:new Bun.Transpiler({loader:'tsx',tsconfig:{compilerOptions:{jsx:'react'}}}).transformSync(readFileSync(args.path,'utf8').replace("from 'react'", `from ${JSON.stringify(requireTool.resolve('react'))}`).replace("from 'remotion'", `from ${JSON.stringify(requireTool.resolve('remotion'))}`).replace("from './font'", "from 'ep197-font-check'")),loader:'js'}));
  build.onResolve({filter:/^(react(?:\/.*)?|remotion)$/}, args => ({path:requireTool.resolve(args.path)}));
  build.module('ep197-font-check', () => ({exports:{font:()=>{}},loader:'object'}));
}});
const {visibleStrings,PANEL} = await import('./Ep197');
const {mkdirSync,mkdtempSync,writeFileSync,copyFileSync,rmSync,statfsSync} = await import('node:fs');
const {tmpdir} = await import('node:os');
function diskCheck() {
  const s=statfsSync(tool);
  if(s.bavail*s.bsize<2*1024**3) throw new Error('STOP: less than 2 GiB free');
}
diskCheck();
copyFileSync(resolve(import.meta.dir,'Ep197.tsx'),resolve(tool,'src/Ep197.tsx'));
const proc=Bun.spawnSync(['python3',resolve(import.meta.dir,'forge-items.py'),'--json']);
if(proc.exitCode!==0) throw new Error(proc.stderr.toString());
const items=JSON.parse(proc.stdout.toString());
const units=new Set(['s','ms','rows/s','/s','%']);
const temp=mkdtempSync(resolve(tmpdir(),'ep197-card-qa-'));
const results:any[]=[];
const qa = process.env.FORGE_QA ?? '/private/tmp/claude-501/-Users-nik/141a973e-6a5e-479e-9ad4-b7e86da396a4/scratchpad/ep/w/qa';
mkdirSync(qa,{recursive:true});
// RGBA PNGs stay transparent; compare unpremultiplied RGB inside the panel.
// The plain colour is sampled from an empty interior pixel, avoiding alpha rounding.
const measure=`
import sys,json
import numpy as np
from PIL import Image, ImageDraw
a=np.asarray(Image.open(sys.argv[1]).convert('RGBA')).astype(np.int16)
b=np.asarray(Image.open(sys.argv[2]).convert('RGBA')).astype(np.int16)
x,y,w,h=map(int,sys.argv[3:7])
bg=b[y+30,x+30,:3]
a=a[y:y+h,x:x+w,:3]; b=b[y:y+h,x:x+w,:3]
def cells(mask):
    return mask.reshape(h//20,20,w//20,20).any(axis=(1,3))
g=cells(np.abs(b-bg).sum(axis=2)>24)
t=cells(np.any(a!=b,axis=2)) & ~g

# Dilate for connectivity only; measure boxes around the original ink cells.
rows,cols=g.shape
d=np.zeros_like(g)
for yy,xx in zip(*np.nonzero(g)):
    d[max(0,yy-1):min(rows,yy+2),max(0,xx-1):min(cols,xx+2)]=True
seen=np.zeros_like(g); union=np.zeros_like(g); boxes=[]
for yy,xx in zip(*np.nonzero(d)):
    if seen[yy,xx]: continue
    stack=[(yy,xx)]; seen[yy,xx]=True; ink=[]
    while stack:
        cy,cx=stack.pop()
        if g[cy,cx]: ink.append((cy,cx))
        for ny in range(max(0,cy-1),min(rows,cy+2)):
            for nx in range(max(0,cx-1),min(cols,cx+2)):
                if d[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx]=True; stack.append((ny,nx))
    if not ink: continue
    ys,xs=zip(*ink); top,bottom=min(ys),max(ys)+1; left,right=min(xs),max(xs)+1
    if right-left<3 or bottom-top<3: continue
    union[top:bottom,left:right]=True
    boxes.append((x+left*20,y+top*20,x+right*20-1,y+bottom*20-1))
debug=Image.open(sys.argv[1]).convert('RGBA')
draw=ImageDraw.Draw(debug)
for box in boxes: draw.rectangle(box,outline=(255,0,0,255),width=1)
debug.save(sys.argv[7])
print(json.dumps({'chartArea':round(float(union.mean()*100),2),'ink':round(float(g.mean()*100),2),'text':round(float(t.mean()*100),2)}))

`;
try {
  for(const it of items) {
    diskCheck();
    const props={...it.props,durationSec:it.duration};
    // Spec: headline + graphic labels only; chip is excluded by visibleStrings.
    // Whitespace-delimited row/tx is one word; numerals, versions and units are excluded.
    const strings=visibleStrings(props);
    const words=strings.flatMap((s:string)=>s.split(/\s+/)).filter((s:string)=>/\p{L}/u.test(s)&&!units.has(s)&&!/^\d+(?:\.\d+)*$/.test(s)).length;
    for(const qaNoText of [false,true]) {
      diskCheck();
      const mode=qaNoText?'no-text':'normal';
      const propPath=resolve(temp,mode+'.json');
      writeFileSync(propPath,JSON.stringify({...props,qaNoText}));
      const p=Bun.spawn(['bunx','remotion','still','src/index.ts','forge',resolve(temp,mode+'.png'),`--props=${propPath}`,`--frame=${Math.floor((it.duration-1.5)*25)}`,'--image-format=png','--log=error'],{cwd:tool,stdout:'pipe',stderr:'pipe'});
      const [code,out,err]=await Promise.all([p.exited,new Response(p.stdout).text(),new Response(p.stderr).text()]);
      if(code!==0) throw new Error(`${it.id}: ${out} ${err}`);
    }
    const m=Bun.spawnSync(['python3','-c',measure,resolve(temp,'normal.png'),resolve(temp,'no-text.png'),...[PANEL.x,PANEL.y,PANEL.w,PANEL.h].map(String),resolve(qa,it.id+'-boxes.png')]);
    if(m.exitCode!==0) throw new Error(m.stderr.toString());
    const pixels=JSON.parse(m.stdout.toString());
    const row={id:it.id,words,...pixels,pass:words<=10&&pixels.chartArea>=60&&pixels.text<pixels.ink};
    results.push(row);
    console.error(`${it.id}: ${words} words, ${pixels.chartArea}% chart area, ${pixels.ink}% ink, ${pixels.text}% text`);
  }
} finally {rmSync(temp,{recursive:true,force:true});}
if(process.argv.includes('--json')) console.log(JSON.stringify(results,null,2));
else console.table(results);
if(results.length!==8||results.some((r:any)=>!r.pass)) process.exitCode=1;
