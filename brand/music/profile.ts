// Per-half-beat RMS (dB) of Apple Loops, priming removed: shows where the hits are.
//   bun profile.ts <file.caf>...
for (const p of Bun.argv.slice(2)) {
  const buf = Buffer.from(await Bun.file(p).arrayBuffer());
  let o = 8, prime = 0, frames = 0, beats = 0;
  while (o + 12 <= buf.length) {
    const t = buf.toString("latin1", o, o + 4), s = Number(buf.readBigInt64BE(o + 4)), d = o + 12;
    if (t === "pakt") { frames = Number(buf.readBigInt64BE(d + 8)); prime = buf.readInt32BE(d + 16); }
    if (t === "uuid") { const ps = buf.toString("utf8", d + 20, d + s).split("\0"); const i = ps.indexOf("beat count"); if (i >= 0) beats = +ps[i + 1]; }
    if (s < 0) break; o = d + s;
  }
  const pr = Bun.spawn(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "1", "-ar", "44100", "-"], { stdout: "pipe" });
  const x = new Float32Array(await new Response(pr.stdout).arrayBuffer()).subarray(prime, prime + frames);
  const step = frames / beats / 2, row: string[] = [];
  let peak = 0; for (const v of x) peak = Math.max(peak, Math.abs(v));
  for (let k = 0; k < beats * 2; k++) {
    let e = 0; const a = Math.round(k * step), b = Math.round((k + 1) * step);
    for (let i = a; i < b; i++) e += x[i] * x[i];
    const db = 10 * Math.log10(e / (b - a) + 1e-12);
    row.push((db < -60 ? "  ." : String(Math.round(db)).padStart(3)) + (k % 8 === 7 ? " |" : ""));
  }
  console.log(`${p.split("/").pop()!.replace(".caf", "").padEnd(34)} pk ${(20 * Math.log10(peak)).toFixed(0).padStart(3)}: ${row.join("")}`);
}
