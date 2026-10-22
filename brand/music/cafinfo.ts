// Print Apple Loop metadata (CAF 'info' chunk + packet table priming) for each file.
//   bun cafinfo.ts <file.caf>...
for (const p of Bun.argv.slice(2)) {
  const b = Buffer.from(await Bun.file(p).arrayBuffer());
  let o = 8; const info: Record<string, string> = {}; let prime = -1, remain = -1, frames = -1;
  while (o + 12 <= b.length) {
    const type = b.toString("latin1", o, o + 4); const size = Number(b.readBigInt64BE(o + 4)); const d = o + 12;
    if (type === "info") {
      const n = b.readUInt32BE(d); const parts = b.toString("utf8", d + 4, d + size).split("\0");
      for (let i = 0; i < n * 2; i += 2) info[parts[i]] = parts[i + 1];
    } else if (type === "uuid") {
      const n = b.readUInt32BE(d + 16); const parts = b.toString("utf8", d + 20, d + size).split("\0");
      if (n > 0 && n < 50) for (let i = 0; i < n * 2; i += 2) if (parts[i]) info[parts[i]] = parts[i + 1];
    } else if (type === "pakt") {
      frames = Number(b.readBigInt64BE(d + 8)); prime = b.readInt32BE(d + 16); remain = b.readInt32BE(d + 20);
    }
    if (size < 0) break; o = d + size;
  }
  console.log([p.split("/").pop(), `frames=${frames}`, `prime=${prime}`, `remain=${remain}`, ...Object.entries(info).map(([k, v]) => `${k}=${v}`)].join(" | "));
}
