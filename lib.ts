// Shared helpers for the podcast-edit scripts.
import { $ } from "bun";

export type Word = { text: string; start: number; end: number; speaker: string; type: "word" | "event" };
export type Transcript = { engine: string; media: string; duration: number; words: Word[] };

// One planned removal of a word span. Detected rows and judgment rows look the same.
export type Removal = {
  id: string;
  speaker?: string; // set on auto rows: only this speaker's words are cut
  cat: string; // head | tail | filler | repeat | falsestart | struggle | bot | bot-polish
  start: number; // first removed word start (source seconds)
  end: number; // last removed word end
  text: string;
  reason: string;
  keep?: boolean; // true = vetoed or decided to keep, do not cut
};
// A pause the render keeps as it is (cap 2.5 s): after a joke or punchline, before a key point.
export type Beat = { start: number; end: number; side: "after" | "before"; text: string; reason: string };
// Gain for a source range in dB ("auto" = match the hosts' speech level), e.g. a quiet bot voice.
export type Gain = { start: number; end: number; db: number | "auto"; text: string; reason: string };
export type Edl = {
  media: string;
  words: string;
  removals: Removal[];
  candidates: { start: number; end: number; text: string; note: string }[]; // considered, kept
  notes: { at: number; note: string }[];
  beats?: Beat[];
  gains?: Gain[];
  laughs?: { start: number; end: number; tagged: boolean }[]; // audio laugh detector (prosody.ts)
};

export const isLaugh = (w: Word) => w.type === "event" && /laugh|chuckl|giggl/i.test(w.text);

export const FPS = 25;
export const RATE = 48000;
export const FRAME_S = 0.01; // energy frame

export const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9']/g, "");

export function fmt(s: number): string {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${(s - m * 60).toFixed(2).padStart(5, "0")}`;
}

export function parseTime(t: string | number): number {
  if (typeof t === "number") return t;
  const p = t.split(":").map(Number);
  return p.reduce((acc, v) => acc * 60 + v, 0);
}

export async function loadTranscript(path: string): Promise<Transcript> {
  const t: Transcript = await Bun.file(path).json();
  t.words = t.words
    .map((w) => ({ ...w, text: w.text.replace(/^\.\.\.\s*/, "").trim() }))
    .filter((w) => w.text)
    .sort((a, b) => a.start - b.start);
  return t;
}

// Decode a media file to interleaved float32 PCM (48 kHz stereo by default).
export async function decodePcm(media: string, channels = 2, rate = RATE): Promise<Float32Array> {
  const buf = await $`ffmpeg -v error -i ${media} -vn -ac ${channels} -ar ${rate} -f f32le -`.arrayBuffer();
  return new Float32Array(buf);
}

// RMS energy in dBFS per 10 ms frame, mono 16 kHz. Cached next to `cache`.
export async function energy(media: string, cache: string): Promise<Float32Array> {
  const f = Bun.file(cache);
  if (await f.exists()) return new Float32Array(await f.arrayBuffer());
  const pcm = await decodePcm(media, 1, 16000);
  const n = 160;
  const out = new Float32Array(Math.floor(pcm.length / n));
  for (let i = 0; i < out.length; i++) {
    let s = 0;
    for (let j = i * n; j < (i + 1) * n; j++) s += pcm[j] * pcm[j];
    out[i] = 10 * Math.log10(s / n + 1e-12);
  }
  await Bun.write(cache, out);
  return out;
}

// Time of the quietest 10 ms frame in [lo, hi].
export function quietest(db: Float32Array, lo: number, hi: number): number {
  let best = lo, bestDb = Infinity;
  for (let i = Math.ceil(lo / FRAME_S); i * FRAME_S <= hi && i < db.length; i++) {
    // Average of 3 frames, so one quiet frame inside a word does not win.
    const v = (db[i - 1] ?? db[i]) + db[i] + (db[i + 1] ?? db[i]);
    if (v < bestDb) (bestDb = v), (best = i * FRAME_S);
  }
  return best;
}

// ElevenLabs Scribe: word timestamps, fillers kept, audio events tagged. Needs ELEVENLABS_API_KEY.
export async function scribe(audio: string, speakers = 2, raw?: string): Promise<Word[]> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("file", Bun.file(audio));
  form.append("timestamps_granularity", "word");
  form.append("tag_audio_events", "true");
  form.append("diarize", "true");
  form.append("num_speakers", String(speakers));
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: form });
  if (!res.ok) throw new Error(`Scribe ${res.status}: ${await res.text()}`);
  const body: any = await res.json();
  if (raw) await Bun.write(raw, JSON.stringify(body));
  return body.words
    .filter((w: any) => w.type !== "spacing")
    .map((w: any) => ({ text: w.text.trim(), start: w.start, end: w.end, speaker: w.speaker_id ?? "", type: w.type === "audio_event" ? "event" : "word" }));
}

// Local whisper.cpp word timestamps (no upload). Drops many fillers; no speakers or events.
export async function whisperWords(audio: string, model = `${process.env.HOME}/.whisper-models/ggml-small.bin`): Promise<Word[]> {
  const base = audio.replace(/\.[^.\/]+$/, "") + ".whisper";
  const wav = `${base}.wav`;
  await $`ffmpeg -y -v error -i ${audio} -vn -ac 1 -ar 16000 ${wav}`;
  await $`whisper-cli -m ${model} -f ${wav} -ojf -sow -ml 1 -of ${base}`.quiet();
  const raw: any = await Bun.file(`${base}.json`).json();
  return raw.transcription
    .map((s: any) => ({ text: s.text.trim(), start: s.offsets.from / 1000, end: s.offsets.to / 1000, speaker: "", type: "word" as const }))
    .filter((w: Word) => w.text && !/^\[.*\]$/.test(w.text));
}
