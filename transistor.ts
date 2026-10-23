#!/usr/bin/env bun
// Transistor.fm release: upload the podcast audio, create a draft episode with the description
// (show notes HTML) and transcript_text, and publish only with --publish. postgres.fm is the
// Transistor-hosted site; it shows transcript_text as paragraphs (subtitles.ts transcript-txt).
// Usage:
//   bun transistor.ts --show 32147 --title "..." --number 193 --season 1 --audio podcast.mp3
//        --description-file notes.transistor.html --transcript-file transcript.txt [--publish] [--dry-run]
//   bun transistor.ts --show 32147 --episode <id> [--description-file f] [--transcript-file f] [--dry-run]
//        (update an existing episode: only the fields given)
// The API key comes from TRANSISTOR_API_KEY. It goes only to api.transistor.fm, never to the
// presigned upload URL, and it is never printed. --dry-run sends nothing and prints the plan.
import { basename } from "path";
import { parseArgs } from "util";

export const API = "https://api.transistor.fm/v1";
export type Opts = {
  show: string; episode?: string; title?: string; number?: number; season?: number; audio?: string;
  description?: string; transcriptText?: string; publish?: boolean; dryRun?: boolean;
};
export type Deps = { fetch: typeof fetch; key?: string; readFile: (p: string) => Promise<Uint8Array>; log: (s: string) => void };

// Episode fields as Transistor form parameters: episode[title]=...
const fields = (o: Record<string, string | number | undefined>) => {
  const f = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined) f.set(`episode[${k}]`, String(v));
  return f;
};
const size = (f: URLSearchParams) => [...f].map(([k, v]) => `${k} (${v.length} chars)`).join(", ");

export async function release(o: Opts, d: Deps): Promise<{ id?: string; status: string }> {
  const hide = (s: string) => (d.key ? s.split(d.key).join("***") : s);
  const log = (s: string) => d.log(hide(s));
  if (!o.episode && (!o.title || !o.audio)) throw new Error("a new episode needs --title and --audio");
  if (!o.dryRun && !d.key) throw new Error("TRANSISTOR_API_KEY is not set");

  async function api(method: string, path: string, body?: URLSearchParams) {
    const url = API + path;
    log(`${method} ${url.replace(/\?.*/, "")}${body ? `: ${size(body)}` : ""}`);
    const r = await d.fetch(url, { method, headers: { "x-api-key": d.key!, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) }, body });
    const text = await r.text();
    if (!r.ok) throw new Error(hide(`${method} ${path.replace(/\?.*/, "")}: HTTP ${r.status} ${text.slice(0, 300)}`));
    return JSON.parse(text || "{}");
  }

  const content = { description: o.description, transcript_text: o.transcriptText };
  if (o.dryRun) {
    if (o.episode) log(`PATCH ${API}/episodes/${o.episode}: ${size(fields(content))}`);
    else {
      log(`GET ${API}/episodes/authorize_upload (filename=${basename(o.audio!)})`);
      log(`PUT <presigned upload URL>: ${o.audio}`);
      log(`POST ${API}/episodes: ${size(fields({ show_id: o.show, title: o.title, number: o.number, season: o.season, audio_url: "<audio_url>", ...content }))}`);
    }
    if (o.publish) log(`PATCH ${API}/episodes/${o.episode ?? "<new id>"}/publish: episode[status]=published`);
    log("dry run: nothing sent");
    return { id: o.episode, status: "dry-run" };
  }

  let id = o.episode, status = "draft";
  if (id) {
    const r = await api("PATCH", `/episodes/${id}`, fields(content));
    status = r.data?.attributes?.status ?? status;
  } else {
    const up = (await api("GET", `/episodes/authorize_upload?filename=${encodeURIComponent(basename(o.audio!))}`)).data.attributes;
    log(`PUT <presigned upload URL>: ${o.audio}`);
    const put = await d.fetch(up.upload_url, { method: "PUT", headers: { "Content-Type": up.content_type }, body: await d.readFile(o.audio!) });
    if (!put.ok) throw new Error(`audio upload: HTTP ${put.status}`);
    const r = await api("POST", "/episodes", fields({ show_id: o.show, title: o.title, number: o.number, season: o.season, audio_url: up.audio_url, ...content }));
    id = String(r.data.id);
    status = r.data.attributes?.status ?? status;
    log(`draft episode ${id}`);
  }
  if (o.publish) {
    const r = await api("PATCH", `/episodes/${id}/publish`, new URLSearchParams({ "episode[status]": "published" }));
    status = r.data?.attributes?.status ?? "published";
    log(`episode ${id}: ${status}`);
  }
  return { id, status };
}

if (import.meta.main) {
  const { values: v } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      show: { type: "string" }, episode: { type: "string" }, title: { type: "string" }, number: { type: "string" }, season: { type: "string" },
      audio: { type: "string" }, "description-file": { type: "string" }, "transcript-file": { type: "string" },
      publish: { type: "boolean" }, "dry-run": { type: "boolean" },
    },
  });
  if (!v.show) { console.error("usage: see the header of transistor.ts"); process.exit(2); }
  const text = (f?: string) => (f ? Bun.file(f).text() : undefined);
  try {
    const r = await release({
      show: v.show, episode: v.episode, title: v.title, number: v.number ? Number(v.number) : undefined, season: v.season ? Number(v.season) : undefined,
      audio: v.audio, description: await text(v["description-file"]), transcriptText: await text(v["transcript-file"]), publish: v.publish, dryRun: v["dry-run"],
    }, { fetch, key: process.env.TRANSISTOR_API_KEY, readFile: async (p) => new Uint8Array(await Bun.file(p).arrayBuffer()), log: (s) => console.log(s) });
    console.log(`result: episode ${r.id ?? "-"} ${r.status}`);
  } catch (e) {
    console.error(String((e as Error).message));
    process.exit(1);
  }
}
