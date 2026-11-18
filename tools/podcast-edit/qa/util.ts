// Shared subprocess helpers. Usage: await ffmpeg(["-i", file, ...]).
export async function run(command: string[], input?: string): Promise<Uint8Array> {
  const p = Bun.spawn(command, {
    stdin: input === undefined ? "ignore" : new TextEncoder().encode(input),
    stdout: "pipe", stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(p.stdout).arrayBuffer(), new Response(p.stderr).text(), p.exited,
  ]);
  if (code !== 0) throw new Error(`${command[0]} failed (${code}): ${stderr.trim()}`);
  return new Uint8Array(stdout);
}
export const ffmpeg = (args: string[]) => run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", ...args]);
export async function dimensions(file: string): Promise<{w: number; h: number}> {
  const raw = await run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", file]);
  const stream = JSON.parse(new TextDecoder().decode(raw)).streams?.[0];
  if (!stream?.width || !stream?.height) throw new Error(`No video dimensions for ${file}`);
  return { w: stream.width, h: stream.height };
}
export async function detectFaces(binary: string, paths: string[]): Promise<string> {
  if (paths.some(p => /[\r\n]/.test(p))) throw new Error("Image paths must not contain newlines");
  return new TextDecoder().decode(await run([binary], paths.join("\n") + "\n"));
}
export function fileId(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+$/, "_") || "frame";
}
