// Check the source-detected head envelopes against the settled split panel geometry.
// Usage: bun check-split.ts <WORK/v7/faces.jsonl> <report.json>
const [input, out] = Bun.argv.slice(2);
const rows = (await Bun.file(input).text()).trim().split('\n').map(JSON.parse);
const median = (a: number[]) => a.sort((x,y)=>x-y)[a.length>>1];
const result = ['n','m','k'].map((host,k) => {
  const boxes = rows.filter(r => r.f.includes(`/${host}/`) && +r.f.match(/(\d+)\.jpg$/)[1]-1 >= 606 && +r.f.match(/(\d+)\.jpg$/)[1]-1 < 637).map(r=>r.b[0]).filter(b=>b && b[4]>=0);
  if (!boxes.length) throw Error(`No landmarks for ${host}`);
  const ex=median(boxes.map(b=>(b[4]+b[6])/2)), ey=median(boxes.map(b=>(b[5]+b[7])/2));
  const scale=105/median(boxes.map(b=>Math.hypot(b[6]-b[4],b[7]-b[5])));
  const left=k*640+320+60*(1-2*450/1080)-scale*ex, top=450-scale*ey;
  const margins=boxes.flatMap(b=>{
    const x=left+scale*(b[0]-.15*b[2]), y=top+scale*(b[1]-.45*b[3]);
    const w=scale*b[2]*1.3,h=scale*b[3]*1.7;
    return [y,1080-y-h,x-(k*640+60-120*y/1080),(k*640+700-120*(y+h)/1080)-(x+w)];
  });
  return {host,frames:boxes.length,targetEyeDistance:105,targetEyeY:450,minHeadMargin:Math.min(...margins)};
});
await Bun.write(out, JSON.stringify(result,null,2)+'\n');
console.log(result); if(result.some(r=>r.minHeadMargin<0))process.exit(1);
