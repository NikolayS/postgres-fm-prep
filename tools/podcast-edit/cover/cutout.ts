import { removeBackground } from "@imgly/background-removal-node";
const [inp, out] = [Bun.argv[2], Bun.argv[3]];
const blob = await removeBackground(inp, { output: { format: "image/png", quality: 1 }, model: "medium" });
await Bun.write(out, Buffer.from(await blob.arrayBuffer()));
console.log("wrote", out);
