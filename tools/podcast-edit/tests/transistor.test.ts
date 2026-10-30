// Tests for transistor.ts with a mocked HTTP layer: nothing here talks to Transistor.
// Run: bun test tests/transistor.test.ts
import { describe, expect, test } from "bun:test";
import { release, type Deps } from "../transistor";

const KEY = "tk_secret_123456"; // gitleaks:allow (dummy key for the mocked API)
type Call = { method: string; url: string; headers: Record<string, string>; body?: any };

function mock(over: Partial<Record<string, (c: Call) => Response>> = {}) {
  const calls: Call[] = [], logs: string[] = [];
  const reply = (status: number, data: any) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
  const fetch = async (url: string, init: any = {}) => {
    const c: Call = { method: init.method ?? "GET", url, headers: { ...(init.headers ?? {}) }, body: init.body };
    calls.push(c);
    const path = url.replace(/\?.*/, "");
    for (const [k, f] of Object.entries(over)) if (path.endsWith(k) && f) return f(c);
    if (path.endsWith("/episodes/authorize_upload"))
      return reply(200, { data: { attributes: { upload_url: "https://r2.example/u/abc.mp3?X-Amz-Signature=s", content_type: "audio/mpeg", audio_url: "https://uploads.transistor.fm/abc.mp3" } } });
    if (url.startsWith("https://r2.example/")) return new Response("", { status: 200 });
    if (path.endsWith("/v1/episodes") && c.method === "POST") return reply(201, { data: { id: "777", attributes: { status: "draft" } } });
    if (path.endsWith("/v1/episodes/777/publish")) return reply(200, { data: { id: "777", attributes: { status: "published" } } });
    if (path.endsWith("/v1/episodes/555") && c.method === "PATCH") return reply(200, { data: { id: "555", attributes: { status: "published" } } });
    return reply(404, { errors: [{ title: "not found" }] });
  };
  const deps: Deps = { fetch: fetch as any, key: KEY, readFile: async () => new Uint8Array([1, 2, 3]), log: (s) => logs.push(s) };
  return { calls, logs, deps };
}
const form = (c: Call) => Object.fromEntries(new URLSearchParams(String(c.body)));
const base = { show: "32147", title: "Dump/restore done. Now what?", number: 193, season: 1, audio: "/x/ep.mp3", description: "<div>a &amp; b</div>", transcriptText: "Nik [00:00:13]: Hello." };

describe("new episode", () => {
  test("authorize upload, PUT the audio, create a draft; no publish without --publish", async () => {
    const m = mock();
    const r = await release(base, m.deps);
    expect(m.calls.map((c) => `${c.method} ${c.url.replace(/\?.*/, "")}`)).toEqual([
      "GET https://api.transistor.fm/v1/episodes/authorize_upload",
      "PUT https://r2.example/u/abc.mp3",
      "POST https://api.transistor.fm/v1/episodes",
    ]);
    expect(m.calls[0].url).toContain("filename=ep.mp3");
    expect(m.calls[1].headers["Content-Type"]).toBe("audio/mpeg");
    expect(form(m.calls[2])).toMatchObject({
      "episode[show_id]": "32147", "episode[title]": base.title, "episode[number]": "193", "episode[season]": "1",
      "episode[audio_url]": "https://uploads.transistor.fm/abc.mp3", "episode[description]": base.description,
      "episode[transcript_text]": base.transcriptText,
    });
    expect(r).toEqual({ id: "777", status: "draft" });
  });

  test("--publish publishes last, after the draft exists", async () => {
    const m = mock();
    const r = await release({ ...base, publish: true }, m.deps);
    const last = m.calls[m.calls.length - 1];
    expect(`${last.method} ${last.url}`).toBe("PATCH https://api.transistor.fm/v1/episodes/777/publish");
    expect(form(last)["episode[status]"]).toBe("published");
    expect(r.status).toBe("published");
  });

  test("the API key goes to Transistor only, never to the upload URL, and never to the log", async () => {
    const m = mock();
    await release({ ...base, publish: true }, m.deps);
    for (const c of m.calls) {
      if (c.url.startsWith("https://api.transistor.fm/")) expect(c.headers["x-api-key"]).toBe(KEY);
      else expect(JSON.stringify(c.headers)).not.toContain(KEY);
    }
    expect(m.logs.join("\n")).not.toContain(KEY);
  });
});

describe("existing episode", () => {
  test("--episode updates only the fields given (description, transcript)", async () => {
    const m = mock();
    await release({ show: "32147", episode: "555", description: "<div>d</div>", transcriptText: "t" }, m.deps);
    expect(m.calls.map((c) => `${c.method} ${c.url}`)).toEqual(["PATCH https://api.transistor.fm/v1/episodes/555"]);
    expect(form(m.calls[0])).toEqual({ "episode[description]": "<div>d</div>", "episode[transcript_text]": "t" });
  });
});

describe("safety", () => {
  test("dry run sends nothing and logs the plan without the key", async () => {
    const m = mock();
    const r = await release({ ...base, publish: true, dryRun: true }, m.deps);
    expect(m.calls).toEqual([]);
    expect(r.status).toBe("dry-run");
    const log = m.logs.join("\n");
    expect(log).toContain("authorize_upload");
    expect(log).toContain("publish");
    expect(log).not.toContain(KEY);
  });

  test("an API error stops the run, and its message has no key", async () => {
    const m = mock({ "/v1/episodes": (c) => new Response(`{"errors":[{"title":"bad key ${KEY}"}]}`, { status: 422 }) });
    const err = await release(base, m.deps).catch((e) => e as Error);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("422");
    expect(err.message).not.toContain(KEY);
    expect(m.calls.some((c) => c.url.endsWith("/publish"))).toBe(false);
  });

  test("no key: a clear error that names TRANSISTOR_API_KEY (dry run needs no key)", async () => {
    const m = mock();
    await expect(release(base, { ...m.deps, key: undefined })).rejects.toThrow(/TRANSISTOR_API_KEY/);
    expect((await release({ ...base, dryRun: true }, { ...m.deps, key: undefined })).status).toBe("dry-run");
  });

  test("a new episode needs a title and audio", async () => {
    const m = mock();
    await expect(release({ show: "1", title: "t" }, m.deps)).rejects.toThrow(/audio/);
    expect(m.calls).toEqual([]);
  });
});
