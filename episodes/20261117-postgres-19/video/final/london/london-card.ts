#!/usr/bin/env bun
// London photo in the centre of the frame, the three host tiles around it (placement "london" =
// layout.json place.*.centers.london). Transparent overlay.
// bun london-card.ts --still out.png
// bun london-card.ts --mov out.mov --dur 23.62 (PNG-in-MOV with alpha: about 5x smaller than ProRes 4444)
// Uses the toolkit capture approach (Playwright/Chrome), no network or fonts.
import {resolve, join} from 'node:path';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
const args = Bun.argv.slice(2);
const arg = (k: string) => args[args.indexOf(k) + 1];
const still = args.includes('--still'), mov = args.includes('--mov');
if (still === mov) throw new Error('Choose --still out.png OR --mov out.mov --dur S');
const out = resolve(arg(still ? '--still' : '--mov'));
const dur = mov ? Number(arg('--dur')) : 0;
if (mov && (!args.includes('--dur') || !Number.isFinite(dur) || dur < .8)) throw new Error('Duration must be >= 0.8 s');
const disk = Bun.spawnSync(['df','-k','/System/Volumes/Data']);
console.log(disk.stdout.toString());
if (Number(disk.stdout.toString().trim().split('\n').at(-1)!.split(/\s+/)[3]) < 1.2*1024*1024) throw new Error('Less than 1.2 GiB free: stopped');
const photo = resolve(import.meta.dir, '../../../preview/assets/nik-michael-london.png');
const info = Bun.spawnSync(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',photo]);
const {width:w,height:h} = JSON.parse(info.stdout.toString()).streams[0];
const decode = Bun.spawnSync(['ffmpeg','-v','error','-i',photo,'-f','rawvideo','-pix_fmt','rgb24','-'], {maxBuffer: 64*1024*1024});
if (decode.exitCode) throw new Error(decode.stderr.toString());
const pixels=decode.stdout;
// Longest run of rows with >20% nonblack pixels excludes black UI and home indicator.
let start=0, bestA=0, bestB=0, active=false;
for(let y=0;y<=h;y++) {
 let lit=0;
 if(y<h) for(let x=0;x<w;x++) {const i=(y*w+x)*3; if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>30) lit++;}
 const content=y<h && lit>w*.2;
 if(content && !active) {start=y;active=true;}
 if(!content && active) {if(y-start>bestB-bestA){bestA=start;bestB=y;} active=false;}
}
if(bestB-bestA<h*.5) throw new Error('Photo bounds not found');
const top=bestA+4, bottom=bestB-4, ch=bottom-top;
console.log(JSON.stringify({content:[bestA,bestB],crop:{x:0,y:top,width:w,height:ch},photo:{top:250,bottom:900}}));
const recording=process.env.RECORDING ?? '/Users/nik/Documents/Zoom/2026-11-17 10.02.00 .fm recording';
const pw=process.env.PLAYWRIGHT_MODULE ?? join(recording,'final-overlays/tool/node_modules/playwright/index.mjs');
const {chromium}=await import(pw);
const browser=await chromium.launch({executablePath:process.env.BROWSER_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
let temp: string | undefined;
try {
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const data='data:image/png;base64,'+Buffer.from(await Bun.file(photo).arrayBuffer()).toString('base64');
 await page.setContent('<html><body style="margin:0;background:transparent"></body></html>');
 await page.evaluate(async ({data,w,top,ch}:any)=>{
  const im=new Image();im.src=data;await im.decode();
  const c=document.createElement('canvas');c.width=w;c.height=ch;c.getContext('2d')!.drawImage(im,0,top,w,ch,0,0,w,ch);
  const url=c.toDataURL();
  document.body.innerHTML=`<style>html,body{background:transparent;overflow:hidden} .photo{position:absolute;top:250px;left:50%;transform:translateX(-50%);height:650px;width:auto;border-radius:16px;box-shadow:0 14px 40px rgba(61,15,69,.35)}</style><img class="photo" src="${url}">`;
  await Promise.all([...document.images].map(i=>i.decode()));
 },{data,w,top,ch});
 if(still) await page.screenshot({path:out,omitBackground:true});
 else {
  temp=mkdtempSync(join(tmpdir(),'london-card-'));
  const png=join(temp,'card.png');await page.screenshot({path:png,omitBackground:true});
  // Transparent except the photo (centre, y 250-900); the hosts move around it (layout.json centers.london).
  const p=Bun.spawn(['ffmpeg','-v','error','-y','-loop','1','-framerate','25','-i',png,'-t',String(dur),'-vf',`format=rgba,fade=t=in:st=0:d=0.4:alpha=1,fade=t=out:st=${dur-.4}:d=0.4:alpha=1`,'-an','-c:v','png','-pix_fmt','rgba',out],{stdout:'inherit',stderr:'inherit'});
  if(await p.exited) throw new Error('ffmpeg failed');
 }
} finally {await browser.close();if(temp) rmSync(temp,{recursive:true,force:true});}
