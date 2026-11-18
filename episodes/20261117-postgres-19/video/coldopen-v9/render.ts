// Reuse the v8 renderer verbatim except for the closing exchange and freeze.
// Usage: VARIANT=a|b bun render.ts WORK/v7 frames-dir
import {readFileSync, writeFileSync, unlinkSync} from 'fs';
import {join} from 'path';
const variant=process.env.VARIANT ?? 'a';
if(!['a','b'].includes(variant)) throw Error('VARIANT must be a or b');
const ending = String.raw`
const REACTIONS: Record<string,number> = {n:797,m:749,k:773}; // 1-based v7 source JPEGs
function finalPhoto(solo: boolean, u: number) {
  let body = '<div style="position:absolute;inset:0;background:'+DARK+'"></div>';
  for (const [who,k] of (solo ? [['m',0]] : [['n',0],['m',1],['k',2]]) as [string,number][]) {
    const mm=(REACTIONS[who]-1)/FPS, b=facesAt(who,mm)[0];
    if(!b || b[4]<0) throw Error('Missing reaction landmarks: '+who);
    const ex=(b[4]+b[6])/2, ey=(b[5]+b[7])/2;
    const sc=(solo?125:105)/Math.hypot(b[6]-b[4],b[7]-b[5]);
    const EY=solo?340:400, cx=solo?960:k*640+320+60*(1-2*EY/1080);
    const L=cx-sc*ex,T=EY-sc*ey;
    const clip=solo?'none':'polygon('+(k*640+60)+'px 0,'+(k*640+700)+'px 0,'+(k*640+580)+'px 1080px,'+(k*640-60)+'px 1080px)';
    body+='<div style="position:absolute;inset:0;clip-path:'+clip+'"><img src="file://'+mont(who,mm)+'" style="position:absolute;inset:0;width:1920px;height:1080px;filter:blur(30px) brightness(.5)"><img src="file://'+mont(who,mm)+'" style="position:absolute;left:'+L+'px;top:'+T+'px;width:'+1920*sc+'px;height:'+1080*sc+'px;filter:grayscale('+ease(u/.16)+') contrast(1.25)"></div>';
    if(!solo && k<2) body+='<svg width="1920" height="1080" style="position:absolute;inset:0"><path d="M '+(k*640+700)+' 0 L '+(k*640+580)+' 1080" stroke="'+PINK+'" stroke-width="8"/></svg>';
  }
  return body+'<div style="position:absolute;inset:0;background:'+PLUM+';mix-blend-mode:multiply;opacity:'+(.45*ease(u/.16))+'"></div>';
}
function montage(m:number,i:number,tEnd:number) {
  if(m<28.84) return v8Montage(m,i,tEnd);
  // Swap the final two bites: Nik's question, then Michael's answer.
  if(m<31.64) return v8Montage(Math.min(34.08,m+2.6),i,tEnd);
  if(m<34.1) return v8Montage(m-2.8,i,tEnd);
  const u=m-34.1,tb=TB-TT;
  let body=finalPhoto(VARIANT==='b',u);
  if(m>=tb) {
    // Same button timing and slam; title band stays below every head and above y=900.
    const sc=slamS(m-tb,.14,1.12);
    body+='<div class="cap" style="position:absolute;left:280px;top:760px;width:1360px;height:116px;display:flex;align-items:center;justify-content:center;gap:40px;background:rgba(22,6,27,.90);border-left:6px solid '+PINK+';transform:scale('+sc+');transform-origin:center"><img src="file://'+BRAND+'/wordmark-alpha.png" style="height:80px"><span style="font:900 100px Lato;color:white;white-space:nowrap">Postgres <span style="color:'+PINK2+'">19</span></span></div>';
  }
  return {body,rgb:0,hb:0};
}
`;
let source=readFileSync(join(import.meta.dir,'../coldopen-v8/v8.ts'),'utf8');
source=source.replace('function montage(', 'function v8Montage(').replace('// ---------- render ----------',`const VARIANT=${JSON.stringify(variant)};\n${ending}\n// ---------- render ----------`);
const tmp=join(import.meta.dir,`.render-${variant}.ts`);
try {
 writeFileSync(tmp,source);
 const p=Bun.spawn(['bun',tmp,...Bun.argv.slice(2)],{env:{...process.env,FROM:process.env.FROM??'932'},stdout:'inherit',stderr:'inherit'});
 if(await p.exited) throw Error('Render failed');
} finally {unlinkSync(tmp);}
