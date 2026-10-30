#!/usr/bin/env bun
// Word-level transcript of a media file.
// Usage: bun transcribe.ts <media> <out.json> [--engine elevenlabs|whisper] [--speakers N]
// Output: { engine, duration, words: [{ text, start, end, speaker, type }] }
//   type is "word" or "event" (laughter, etc., ElevenLabs only).
import { $ } from "bun";
import { parseArgs } from "util";
import { type Word, scribe } from "./lib";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    engine: { type: "string", default: "elevenlabs" },
    speakers: { type: "string", default: "2" },
    model: { type: "string", default: `${process.env.HOME}/.whisper-models/ggml-large-v3-turbo.bin` },
  },
});
const [media, out] = positionals;
if (!media || !out) {
  console.error("usage: bun transcribe.ts <media> <out.json> [--engine elevenlabs|whisper] [--speakers N]");
  process.exit(2);
}

const tmp = `${out}.tmp`;
await $`mkdir -p ${tmp}`.quiet();
const duration = Number((await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${media}`.text()).trim());

let words: Word[];
if (values.engine === "elevenlabs") {
  const audio = `${tmp}/audio.mp3`;
  await $`ffmpeg -y -v error -i ${media} -vn -ac 1 -ar 22050 -b:a 64k ${audio}`;
  console.error(`uploading ${audio} to ElevenLabs Scribe ...`);
  words = await scribe(audio, Number(values.speakers), `${tmp}/raw.json`);
} else {
  // whisper.cpp with a disfluent prompt so it keeps more fillers.
  const wav = `${tmp}/audio.wav`;
  await $`ffmpeg -y -v error -i ${media} -vn -ac 1 -ar 16000 ${wav}`;
  const prompt = "Um, uh, so, like, I mean, uh, you know, um, the the, it's a, it's a, hmm.";
  await $`whisper-cli -m ${values.model} -f ${wav} -ojf -sow -ml 1 --prompt ${prompt} -of ${tmp}/whisper`.quiet();
  const raw: any = await Bun.file(`${tmp}/whisper.json`).json();
  words = raw.transcription
    .map((s: any) => ({
      text: s.text.trim(),
      start: s.offsets.from / 1000,
      end: s.offsets.to / 1000,
      speaker: "",
      type: "word" as const,
    }))
    .filter((w: Word) => w.text && !/^\[.*\]$/.test(w.text));
}

await Bun.write(out, JSON.stringify({ engine: values.engine, media, duration, words }, null, 1));
console.error(`${words.length} words -> ${out}`);
