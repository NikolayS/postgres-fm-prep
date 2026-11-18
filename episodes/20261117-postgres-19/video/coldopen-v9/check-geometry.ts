// Verify selected reaction head envelopes, panel boundaries, and title clearance.
// Usage: bun check-geometry.ts WORK/v7/faces.jsonl report.json
const [file,out]=Bun.argv.slice(2), rows=(await Bun.file(file).text()).trim().split('\n').map(JSON.parse);
const selected={n:797,m:749,k:773}, reports=[];
for(const variant of ['a','b']) for(const [k,host] of (variant==='a'?['n','m','k']:['m']).entries()) {
 const f=selected[host as keyof typeof selected];
 const b=rows.find(r=>r.f.endsWith(`/${host}/${String(f).padStart(4,'0')}.jpg`))?.b[0];
 if(!b||b[4]<0)throw Error('Missing landmarks');
 const ey=variant==='a'?400:340,sc=(variant==='a'?105:125)/Math.hypot(b[6]-b[4],b[7]-b[5]);
 const cx=variant==='a'?k*640+320+60*(1-2*ey/1080):960;
 const l=cx-sc*(b[4]+b[6])/2,t=ey-sc*(b[5]+b[7])/2;
 const x=l+sc*(b[0]-.15*b[2]),y=t+sc*(b[1]-.45*b[3]),w=sc*b[2]*1.3,h=sc*b[3]*1.7;
 const margin=variant==='a'?Math.min(x-(k*640+60-120*y/1080),k*640+700-120*(y+h)/1080-(x+w)):Math.min(x,1920-x-w);
 // At maximum stamp overshoot its upper edge is 753.04px and bottom 882.96px.
 reports.push({variant,host,sourceFrame:f,eyeY:ey,eyeDistance:variant==='a'?105:125,headBox:[x,y,w,h],diagonalMargin:margin,titleMargin:753.04-y-h});
}
await Bun.write(out,JSON.stringify(reports,null,2)+'\n'); console.log(reports);
if(reports.some(r=>r.diagonalMargin<0||r.titleMargin<0||r.headBox[1]<0)) process.exit(1);
