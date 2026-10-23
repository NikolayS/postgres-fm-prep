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
  // Judgment rows only: the speaker runs into or out of this span with no real pause. Allow a cut
  // point at a shallower dip (SOFT_VALLEY_DB under speech). Set it after reading the plan's
  // "clean cut points" hint, only at a sentence or clause boundary, and check the join by ear.
  soft?: boolean;
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

// ---- Shared audio assembly (render.ts and the join audit use the same code) ----------------
type Pcm = Int16Array | Float32Array;
export type Span = [number, number];
export type Piece = { a: number; b: number; xf: number }; // kept source audio [a, b) s; xf: crossfade at its start
export type AudioPlan = {
  audio?: Piece[]; // sample-exact kept audio (plan.ts); older plans have only frame segments
  segments: [number, number][]; // kept source frames [start, end) at FPS
  cuts: { end: number; xfade: number; mutes?: Span[] }[];
  muteOnly?: { mutes?: Span[] }[];
  gains?: { start: number; end: number; db: number }[]; // resolved dB
};

// 10 ms RMS levels (dBFS) of interleaved PCM, channels mixed.
export function levels(pcm: Pcm, ch: number, rate: number): Float32Array {
  const hop = rate / 100, scale = pcm instanceof Int16Array ? 1 / 32768 : 1;
  const out = new Float32Array(Math.floor(pcm.length / ch / hop));
  for (let i = 0; i < out.length; i++) {
    let s = 0;
    for (let j = i * hop; j < (i + 1) * hop; j++) {
      let v = 0;
      for (let c = 0; c < ch; c++) v += pcm[j * ch + c];
      v *= scale / ch;
      s += v * v;
    }
    out[i] = 10 * Math.log10(s / hop + 1e-12);
  }
  return out;
}

// Room tone over [a, b]: taken from the nearest real pause (a 10 ms run within 3 dB of the local
// floor, at least 0.25 s long, nearest to the gap, never the quietest digital hole far away),
// level-matched to the pause floor next to the gap, played as a forward/reverse loop (no seams),
// and blended with 40 ms equal-power edges.
export function roomToneFill(pcm: Pcm, ch: number, rate: number, lv: Float32Array, a: number, b: number) {
  const isInt = pcm instanceof Int16Array;
  const n = pcm.length / ch;
  const loc = (t: number, r = 3) => {
    const s = lv.subarray(Math.max(0, Math.round((t - r) * 100)), Math.min(lv.length, Math.round((t + r) * 100))).slice().sort();
    return s[Math.floor(s.length * 0.1)] ?? -90;
  };
  const fl = loc((a + b) / 2);
  // Candidate pause runs within 8 s, ranked by distance to [a, b].
  let best: Span | null = null, bestD = Infinity;
  for (let i = Math.max(0, Math.floor((a - 8) * 100)), r0 = -1; i <= Math.min(lv.length, Math.ceil((b + 8) * 100)); i++) {
    const t = i / 100;
    const on = i < lv.length && lv[i] < fl + 3 && lv[i] > fl - 6 && !(t > a - 0.02 && t < b + 0.02);
    if (on && r0 < 0) r0 = i;
    if (!on && r0 >= 0) {
      const s = r0 / 100 + 0.02, e = i / 100 - 0.02;
      if (e - s >= 0.25) {
        const d = e <= a ? a - e : s >= b ? s - b : 0;
        if (d < bestD) (bestD = d), (best = [s, e]);
      }
      r0 = -1;
    }
  }
  const len = Math.round((b - a) * rate), dst = Math.round(a * rate);
  if (len <= 0) return;
  let src0: number, L: number, g = 1;
  if (best) {
    src0 = Math.round(best[0] * rate), L = Math.max(1, Math.round(Math.min(best[1] - best[0], 1.0) * rate));
    let s = 0;
    for (let i = 0; i < L; i++) for (let c = 0; c < ch; c++) s += (pcm[(src0 + i) * ch + c] * (isInt ? 1 / 32768 : 1)) ** 2;
    const have = 10 * Math.log10(s / (L * ch) + 1e-12);
    g = 10 ** (Math.max(-6, Math.min(6, fl - have)) / 20);
  } else return; // no pause nearby: leave the sound as it is (a fill from far away sounds worse)
  const edge = Math.min(Math.round(0.04 * rate), len >> 1);
  const orig = pcm.slice(dst * ch, (dst + len) * ch);
  for (let i = 0; i < len && dst + i < n; i++) {
    const w = Math.min(1, i / edge, (len - 1 - i) / edge);
    const p = i % (2 * L), j = p < L ? p : 2 * L - 1 - p; // forward then reversed
    const ga = Math.cos((w * Math.PI) / 2), gb = Math.sin((w * Math.PI) / 2) * g;
    for (let c = 0; c < ch; c++) {
      const v = orig[i * ch + c] * ga + pcm[(src0 + j) * ch + c] * gb;
      pcm[(dst + i) * ch + c] = isInt ? Math.max(-32768, Math.min(32767, Math.round(v))) : v;
    }
  }
}

// Room tone over removed words, gains, then the sample-exact splice with equal-power crossfades.
// Returns new PCM (same type). `src` is modified in place (room tone and gains).
export function assembleAudio<T extends Pcm>(src: T, ch: number, rate: number, plan: AudioPlan, lv?: Float32Array): T {
  const isInt = src instanceof Int16Array;
  const L = lv ?? levels(src, ch, rate);
  for (const c of [...plan.cuts, ...(plan.muteOnly ?? [])]) for (const [a, b] of c.mutes ?? []) roomToneFill(src, ch, rate, L, a, b);
  const S = (s: number) => Math.round(s * rate);
  for (const g of plan.gains ?? []) {
    const a = S(g.start - 0.05), b = S(g.end + 0.1), ramp = S(0.03), lin = 10 ** (g.db / 20);
    for (let i = a; i < b; i++) {
      const k = 1 + (lin - 1) * Math.min(1, (i - a) / ramp, (b - 1 - i) / ramp);
      for (let c = 0; c < ch; c++) { const v = src[i * ch + c] * k; src[i * ch + c] = isInt ? Math.max(-32768, Math.min(32767, Math.round(v))) : v; }
    }
  }
  const xfadeAt = new Map(plan.cuts.map((c) => [Math.round(c.end * FPS), c.xfade]));
  const pieces: Piece[] = plan.audio ?? plan.segments.map(([a, b]) => ({ a: a / FPS, b: b / FPS, xf: xfadeAt.get(a) ?? 0.06 }));
  const total = pieces.reduce((s, p) => s + S(p.b) - S(p.a), 0);
  const out = (isInt ? new Int16Array(total * ch) : new Float32Array(total * ch)) as T;
  const nsrc = src.length / ch;
  let o = 0;
  pieces.forEach((p, k) => {
    const s0 = S(p.a), s1 = S(p.b);
    out.set(src.subarray(s0 * ch, s1 * ch), o * ch);
    if (k > 0) {
      // Join at output sample o: the previous piece's continuation fades out under this one's lead-in.
      const pEnd = S(pieces[k - 1].b);
      const H = Math.floor((p.xf * rate) / 2);
      for (let i = -H; i < H; i++) {
        if (o + i < 0 || pEnd + i >= nsrc || s0 + i < 0) continue;
        const w = (i + H) / (2 * H), ga = Math.cos((w * Math.PI) / 2), gb = Math.sin((w * Math.PI) / 2);
        for (let c = 0; c < ch; c++) {
          const v = src[(pEnd + i) * ch + c] * ga + src[(s0 + i) * ch + c] * gb;
          out[(o + i) * ch + c] = isInt ? Math.max(-32768, Math.min(32767, Math.round(v))) : v;
        }
      }
    }
    o += s1 - s0;
  });
  const fadeIn = Math.round(0.03 * rate), fadeOut = Math.round(0.5 * rate);
  for (let i = 0; i < fadeIn; i++) for (let c = 0; c < ch; c++) out[i * ch + c] *= i / fadeIn;
  for (let i = 0; i < fadeOut; i++) for (let c = 0; c < ch; c++) out[(o - 1 - i) * ch + c] *= i / fadeOut;
  return out;
}
