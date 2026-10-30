// Intro/outro music: generate original instrumental cues with the ElevenLabs Music API.
//
//   bun music.ts generate <out-dir> [--options music-options.json] [--model music_v1]
//
// Needs ELEVENLABS_API_KEY (never printed). Each option makes <id>-intro.mp3 and <id>-outro.mp3
// plus <id>.json (prompt, model, seed, length, date) as the provenance record for licensing.
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

export type MusicOption = { id: string; style: string; intro: string; outro: string; introMs: number; outroMs: number };

// Defaults for an engineering audience: understated, modern, clean pulse, no vocals.
export const DEFAULT_OPTIONS: MusicOption[] = [
  {
    id: "a-pulse",
    style: "Minimal electronic, 100 BPM, warm analog synth bass, soft muted kick, clean arpeggiated pluck synth, airy pad, subtle tape warmth. Understated, modern, confident, focused. Not cheesy corporate, not EDM, no drops, no vocals.",
    intro: "Short podcast intro sting: starts with the pluck arpeggio, the pulse enters after two bars, ends with a clean resolved final chord that rings out to silence.",
    outro: "Podcast outro bed: steady and calm, same instruments, low-key groove that sits under speech, last bars resolve to a clean final chord and ring out.",
    introMs: 11000,
    outroMs: 24000,
  },
  {
    id: "b-lofi",
    style: "Lo-fi electronic, 88 BPM, Rhodes electric piano chords, dusty soft drums with brushed snare, round sub bass, light vinyl texture. Calm, smart, confident. Not cheesy, no vocals.",
    intro: "Short podcast intro sting: Rhodes chord stabs over the beat, a small melodic hook, clean ending on a held chord.",
    outro: "Podcast outro bed: relaxed groove, same Rhodes and drums, simple and steady under speech, ends on a held chord fading to silence.",
    introMs: 11000,
    outroMs: 24000,
  },
  {
    id: "c-synthwave-min",
    style: "Minimal modern synth, 112 BPM, ticking closed hi-hat, tight sub bass pulse, glassy FM bell motif, wide pad, precise and clean like a well-built machine. Confident, restrained. No vocals, no EDM build, no drop.",
    intro: "Short podcast intro sting: bell motif over the pulse, builds slightly, cuts to a clean final hit with a short tail.",
    outro: "Podcast outro bed: same pulse and bell motif, sparse and steady under speech, ends with a final hit and short tail.",
    introMs: 11000,
    outroMs: 24000,
  },
];

async function compose(prompt: string, ms: number, model: string, out: string) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  const res = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ prompt, music_length_ms: ms, model_id: model, force_instrumental: true }),
  });
  if (!res.ok) throw new Error(`music ${res.status}: ${await res.text()}`);
  await Bun.write(out, await res.arrayBuffer());
}

async function generate(dir: string, options: MusicOption[], model: string) {
  mkdirSync(dir, { recursive: true });
  // Starter allows 2 concurrent generations: one option (intro + outro) at a time.
  for (const o of options) {
    const jobs = (["intro", "outro"] as const).map(async (kind) => {
      const out = join(dir, `${o.id}-${kind}.mp3`);
      if (existsSync(out)) return;
      const prompt = `${o.style} ${o[kind]}`;
      await compose(prompt, kind === "intro" ? o.introMs : o.outroMs, model, out);
      console.log(`wrote ${out}`);
    });
    await Promise.all(jobs);
    await Bun.write(join(dir, `${o.id}.json`), JSON.stringify({ ...o, model, api: "POST /v1/music", force_instrumental: true, generated: new Date().toISOString() }, null, 2));
  }
}

if (import.meta.main) {
  const [cmd, ...rest] = Bun.argv.slice(2);
  const flag = (n: string) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined; };
  if (cmd === "generate" && rest[0]) {
    const opts = flag("--options") ? await Bun.file(flag("--options")!).json() : DEFAULT_OPTIONS;
    await generate(rest[0], opts, flag("--model") ?? "music_v1");
  } else {
    console.error("usage: bun music.ts generate <out-dir> [--options file.json] [--model music_v1]");
    process.exit(2);
  }
}
