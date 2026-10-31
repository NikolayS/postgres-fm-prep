# Episode release checklist

Copy this list into the episode's `README.md` (or an issue) for each release and tick items as they are done. Nothing is published without the host's explicit OK. Tool details live in [`tools/podcast-edit/SKILL.md`](tools/podcast-edit/SKILL.md).

## 1. Edit approved

- [ ] Cut list reviewed: fillers, false starts, long pauses, pre-show and post-show chatter, on-air "let's cut that" moments, bot interruptions.
- [ ] **Host approved the edit** (watched the full draft, not only the cut list).
- [ ] Speaker names and titles are as the guest wants them. Ask; don't copy them from LinkedIn.

## 2. YouTube video

- [ ] Intro and outro in place.
- [ ] Illustrations: band cards, centre cards, charts and figures from the episode's research, each at the moment it is discussed.
- [ ] Overlay sounds follow the convention in `tools/podcast-edit/sfx/`: band cards get a typing reveal; centre cards get the sand strokes in and out, plus a punch on key reveals. Nothing bright, nothing sub-only.
- [ ] Loudness about -16 LUFS integrated; no clipping.
- [ ] Full decode check: no dropped or duplicated frames, A/V in sync at start, middle and end.
- [ ] If only overlays or sounds changed after a full render, splice the changed windows or remux the audio. Don't re-render the whole video.

## 3. YouTube metadata

- [ ] **Title** under about 50 visible characters. It must complement the thumbnail, not repeat it: the thumbnail asks the question, the title promises how we answered it (a concrete number or effort). No channel or episode suffix; the channel name already shows.
- [ ] **Thumbnail(s)**, 1280×720:
  - dark background;
  - heavy condensed headline of 2–4 words;
  - host and guest heads in framed tiles, balanced (equal head size and eye level), each lit well enough; brighten a dark camera.
  - Make 2–3 options when unsure.
- [ ] **A/B test** (Test & Compare) with up to 3 titles and/or thumbnails. It cannot run during a Premiere, so it starts once the Premiere ends; check the next day that it is running.
- [ ] **Description**:
  - hook with the key measured result, and its conditions, in the first two lines;
  - "Postgres.FM episode N";
  - one paragraph about the episode;
  - "Main link:" with the HTML brief, when there is one (see section 7);
  - high-level chapters, starting at 00:00, about 10–16 of them, in video time;
  - key links with the video time of their first mention;
  - link to the full notes on postgres.fm;
  - the standard footer: feedback, "produced by", credits;
  - 2–3 hashtags at the end.
- [ ] Made for kids: **No**.
- [ ] Playlist: Postgres.FM podcast.
- [ ] Publish as Public with **instant Premiere**.

## 4. YouTube subtitles

- [ ] English subtitles built from the edited transcript.
- [ ] **Dictionary pass:** apply the glossary in `prompt.txt` from https://gitlab.com/postgres-ai/content/postgres-fm to the subtitles and transcripts. Then read them through for names, product names (DBLab Forge, PL/pgSQL…), Postgres terms and SQL identifiers. Add new mis-hearings to the glossary in an MR to that repo.
- [ ] Uploaded **with timing** (SRT built from the final video's time map) and published.
- [ ] **Remove YouTube's auto-generated English track** once it appears. It can take a while after upload, so check again after publishing.
- [ ] Check whether auto-dubbing is on, and turn it off unless we want it.

## 5. Podcast audio (Transistor)

- [ ] Audio-only master: same edit, **no overlay sounds**, about -16 LUFS, MP3 with the episode cover embedded.
- [ ] Square cover 3000×3000 in the podcast style.
- [ ] Draft created with `transistor.ts`. Set:
  - title;
  - summary;
  - description (the HTML show notes);
  - transcript;
  - `video_url` pointing at the YouTube video.
- [ ] Show notes open with the "watch on YouTube" tip; since episode 193 the video carries charts and illustrations.
- [ ] Publish (`PATCH /v1/episodes/<id>/publish`, `status=published`), then check:
  - the postgres.fm episode page;
  - the Transistor share page;
  - the RSS feed.

## 6. Transcript and podcast subtitles

- [ ] Transcript in the new style: a speaker name and a `[hh:mm:ss]` stamp **only when a person starts speaking**, organised in readable paragraphs. No per-line timestamps.
- [ ] Times are podcast times, which differ from video times when the intro and cards differ.
- [ ] SRT/VTT for the audio version, built from the audio time map.

## 7. Show notes

- [ ] Basic show notes: one paragraph about the episode, then links grouped by topic. Each link carries the podcast time of its first mention.
- [ ] About 20 links at most. Docs links point at the exact section. Every link opens and says what we claim it says.
- [ ] **Brief in Main link, everywhere.** When the episode has an HTML brief (console share link), it is the first item under a "Main link" heading in the Transistor notes (so on postgres.fm), and in a "Main link:" block right after the episode paragraph in the YouTube description, above the chapters. Don't repeat it in the key links list.
- [ ] No company or job title for a guest unless they asked for one.

## 8. Research artefacts (when the episode is built on an experiment)

- [ ] Public brief: the console share link works when logged out, and contains no private paths, hosts, code or customer data.
- [ ] Public archive (Zenodo):
  - raw data, SQL workloads and settings;
  - a checksum list that verifies after download;
  - a licence that names every exception;
  - a reserved DOI, published only after the linked results are public.
- [ ] Independent review of everything that goes public, repeated until it passes. Trackers (issues, MR notes and diffs) are checked too, not only files.
- [ ] Once the archive is public, add the brief, the results repo and the DOI to the show notes and the YouTube description.

## 9. After release

- [ ] Within a day: the auto subtitles are gone, the A/B test is running, and the RSS entry is correct.
- [ ] Update the episode's `README.md` here: status, publication links, the experiment DOI.
- [ ] Note what went wrong in this release and fix the tool or this checklist.
