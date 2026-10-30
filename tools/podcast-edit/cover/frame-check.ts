// Reject frames where the orange wall logo is near the face, or the mic covers the face.
// usage: bun frame-check.ts picks.json  -> table + picks-ok.json
import { PNG } from "pngjs";
const picks = JSON.parse(await Bun.file(Bun.argv[2]).text());
const ok: Record<string, any[]> = {};
for (const [cls, arr] of Object.entries(picks) as [string, any[]][]) {
  ok[cls] = [];
  for (const p of arr) {
    const img = PNG.sync.read(Buffer.from(await Bun.file(p.file).arrayBuffer()));
    const { width: W, height: H, data: D } = img;
    const fh = p.faceH, x0 = p.faceX - fh / 2, x1 = p.faceX + fh / 2, y0 = p.faceY - fh / 2, y1 = p.faceY + fh / 2;
    let minDist = 1e9, orangeN = 0, skin = 0, dark = 0, area = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; const [r, g, b] = [D[i], D[i + 1], D[i + 2]];
      const outside = x < x0 - 10 || x > x1 + 10 || y < y0 - 10 || y > y1 + 10;
      const orange = outside && r > 110 && g > 40 && (r - b) / r > 0.55 && g / r > 0.3 && g / r < 0.78 && b / g < 0.6;
      if (orange) { orangeN++;
        const dx = x < x0 ? x0 - x : x > x1 ? x - x1 : 0, dy = y < y0 ? y0 - y : y > y1 ? y - y1 : 0;
        minDist = Math.min(minDist, Math.hypot(dx, dy)); }
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) { area++;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        if (r > 90 && r >= g && g >= b && (mx - mn) / mx > 0.15 && (mx - mn) / mx < 0.6) skin++;   // skin-ish
        if (mx < 45) dark++; }   // mic / glasses / shadow
    }
    const rec = { ...p, logoDist: Math.round(minDist), orangeN, skinFrac: +(skin / area).toFixed(2), darkFrac: +(dark / area).toFixed(2) };
    const pass = (orangeN < 15 || minDist > 40) && rec.darkFrac < 0.22;
    console.log(`${cls}\tt=${p.t}\tint=${p.intensity}\tlogoDist=${rec.logoDist}\torange=${orangeN}\tskin=${rec.skinFrac}\tdark=${rec.darkFrac}\t${pass ? "OK" : "reject"}`);
    if (pass) ok[cls].push(rec);
  }
}
await Bun.write(Bun.argv[2].replace(".json", "-ok.json"), JSON.stringify(ok, null, 1));
