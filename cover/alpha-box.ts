// Hand mask fix: make the given boxes transparent. usage: bun alpha-box.ts in.png out.png x0,y0,x1,y1 [...]
import { PNG } from "pngjs";
const [inp, out, ...boxes] = Bun.argv.slice(2);
const img = PNG.sync.read(Buffer.from(await Bun.file(inp).arrayBuffer()));
for (const bx of boxes) { const [x0, y0, x1, y1] = bx.split(",").map(Number);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) img.data[(y * img.width + x) * 4 + 3] = 0; }
await Bun.write(out, PNG.sync.write(img)); console.log("boxed", out, boxes.join(" "));
