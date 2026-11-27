# Episode release checklist

Copy this list into the episode's `README.md` (or an issue) for each release and tick items as they are done. Nothing is published without the host's explicit OK. Tool details live in [`tools/podcast-edit/SKILL.md`](tools/podcast-edit/SKILL.md).

## 0. Production: from the recording to the full draft

Do these in order. The first thing the host sees is the **full composed episode**, not a cut list or a cuts-only video (Nik, 2026-11-10 and 2026-11-24: "i need full draft with everything already", "where is coldstart? intro? framing for our heads?"). Read how the last 4 episodes were made before you start: each episode folder has `video/README.md` or `video/final/README.md`.

1. [ ] **Study the last 4 episodes**: their compose scripts and layouts, cold opens, title cards, outros, overlays, music levels, and the host's corrections in their notes. Reuse their tools and settings. Write down what this episode does differently, and why.
2. [ ] **Review folder.** Make one numbered folder for the host, `<recording>/review/for-nik/`, with `00-INDEX.md`. Every preview, clip, still and list for the host goes there, with numbered descriptive names. Every report gives full absolute paths.
3. [ ] **Transcribe** once (Scribe). Check speaker labels. Note when a host is away (camera off, "I'll be right back").
4. [ ] **Cut hard.** Detect, judge, prosody, plan, audit the joins (`SKILL.md`). Cut hedges, rambling, tech trouble and on-air "let's cut that". The first minutes get a second, stricter pass for the hosts' stumbles (restarts, broken grammar, word salad): the opening sets the impression (Nik, episode 198: "'it's still /// already so' moment in the beginning is embarrassing"). Keep the clean take of each thought; every cut stays a restorable row; check each join by re-transcription.
5. [ ] **Bad-moments sweep** of the whole transcript and of the rendered edit:
   - a host leaving, being away or coming back, and every later reference to it ("welcome back", "where were we", "Good. Great. Great.");
   - every profanity (fuck, shit, damn and variants, also in other languages), in the Scribe words and in the meeting bot transcript. No bleeps: cut the word, or the whole phrase if the join jumps;
   - complaints about insects, coffee, the room, tech problems, screen sharing, "are we recording", remarks about bots or the setup, references to talk before the recording;
   - anything else off-topic, embarrassing or unprofessional. When in doubt, cut it and list it as restorable.
   A cut with no clean join gets a wider cut (the whole sentence), not a pass. Check by grepping the aligned transcript of the render. List every removed moment for the host: source time, what it was, cut id. List what you kept on purpose, and why.
6. [ ] **Layout and framing**: heads in framed tiles, in an order chosen so that every host faces inward (they look at each other, never out of the picture). To decide: decide on real frames, never by a fixed name order. Run `bun tools/podcast-edit/qa/facing.ts estimate <tiles.json> <out> --samples 12` on the source recording: it crops each host tile at 12 points over the episode and estimates the head turn from Apple Vision landmarks (nose line vs the face-box center; the face position in the tile as a fallback), and writes a contact sheet and a draft record. Look at the sheet and write `<episode>/video/final/facing.json`: per host `left`, `right` or `neutral` (straight at the camera), evidence frames, a note. Order: right-facing hosts on the left, neutral in the middle, left-facing on the right (`proposeOrder`). With three hosts the center tile can face either way, so put there the host who faces the camera most straight, or whoever is left; a neutral host may sit on any edge. `qa.ts` check `facing` fails when there is no record or a host looks out of the picture from an edge tile; only a written `override` (`by`, `reason`) from the host passes it. Example: episode 198, Nik and Kirk, Kirk left and Nik right. Use the absent-host layout when a host is away (episode 196). Header "postgres.fm <topic>" on one line at 104 px. The meeting-bot tile is small, and note-taker tiles are never shown. Check a still.
7. [ ] **Title card**: a Remotion card on the shades intro cue, crazier than the last one (not longer). Have fun with the elephant, never with the heads. If a host is absent, make one friendly joke about it. The numbers on the card match the source.
8. [ ] **Illustrations, made and placed** (not only planned). Density: about 30 in an hour or more (episode 196 had 31). First make an inventory of every visual in the source material (the post's diagrams, figures, tables, the site's leaderboard and pages) and get the originals (SVG, data), not screenshots. Then a storyboard of all visuals (`templates/episode/storyboard.md`: time, words, one idea, what it adds, source). Each visual states **what it adds** beyond the speech (a number, a picture, a structure, a joke); cut a card that only restates the spoken line (Nik, 2026-11-27). Most visuals are animated pieces built from that material: diagrams built up as they are named, charts drawn from the data, numbers that count or collapse, gags for the hosts' best lines. They must entertain, not only be correct: a set of static screenshots with underlines and plain text strips was rejected (Nik, episode 198: "illustrations are weak ... think! be creative! entertain!"). Captures stay for third-party pages (docs, papers). Key text big (30 px or more, hero numbers 120 px or more), one idea per visual. An animation that carries meaning is never thumbnail-size: make it the main thing at that moment (a center panel zoomed on the part being discussed, or the head tiles pull back and a wide scene takes the lower area). Check every overlay at 360p (frame scaled to 640x360); an inline graphic that does not read there is made bigger, or dropped if it is only decoration (Nik, episode 198, on a small 3D AAA copy next to a strip: "animation is too small here"). Each one matches what is said at that moment, and every number matches the source:
   - real screenshots of quoted pages, with the URL printed;
   - figures from the post or brief;
   - band strips with one fact each;
   - an Editor's note only as a vetoable default.
   Text goes under the heads, never over faces, and nothing in the bottom 180 px. Every overlay sequence enters with one sound cue (`manifest-sfx.json`): overlays that follow one another (start within 3 s of the previous end, or the same `group`) get the sound on the first only; the rest change silently (Nik, 2026-11-27: "user already attracted"). Make a review list for the host: number, timecode, quote, what it shows, source, and one preview image each.
9. [ ] **Cold-open variants** in the form of the PUBLISHED cold opens (episode 196 `video/montage.sh`, episode 197 `video/coldopen-v9`), never an early draft:
   - a montage of 4-7 short lines (1.5-6.5 s each, about 20 s), alternating voices, hard cuts;
   - jokes, images, blunt opinions, one number; it ends on a punchline;
   - clean screen (the episode layout, no strips);
   - opening music under it (episode 197 funk cue, 0.2 under the voices, full on the button).
   Add motion and sound design: cuts on the beat, punch-ins on punchlines, whips, graphic gags tied to the words (stamps, a cracked badge, a reboot glitch), sound hits. Make 2-3 intensity levels (bold, medium, restrained). A clean montage with hard cuts only was rejected (Nik, episode 198: "coldstart -- lacks dynamics, some special effects"). Fun with graphics, never with the heads; no effect changes what a line means.
   Build a shortlist from the whole transcript first (episode 197 `notes/cold-open-shortlist.md`). Then make 3 variants as separate clips, each with its lines, source times and a recommendation. The final video uses the recommended variant until the host picks. One topic explained with summary strips is not a cold open (Nik, 2026-11-24: "These Coldopen drafts are total BS").
10. [ ] **Outro** fits the episode: no Forge frame without an experiment. The outro's "In this episode" frame leads with the episode's main artifact and its URL, large and long enough to read and type (episode 198: "PGAIBench v0.2" and "pgaibench.dev", then the post and the repo). The same order goes first everywhere the episode lists links: the YouTube description's first lines, the show notes, the pinned comment, and the first on-screen mention (Nik, 2026-11-24: "PGAIBench v0.2 -- https://pgaibench.dev first of all!").
11. [ ] **Compose** under `watchdog.ts`: `--music-lufs -20.5 --duck -21 --duck-ramp 3 --intro-fade 8`. Then the cold open in front, by stream copy.
12. [ ] **Level the voices**: each voice 10 dB or more over the music, voices within 3 dB (`qa.ts` audio), Michael boosted.
13. [ ] **QA**: `qa.ts` with every check that applies; a skip needs a written reason. The check `length` compares the final with its parts (cold open + body time map) and its tail with the outro: a render that stopped early fails it (episode 198: 21.5 s short, no outro, all other checks passed). Look at extracted frames: cold open, title card, several body points, every overlay, the outro.
14. [ ] **Package up to publishing**:
    - title options;
    - then 2-3 thumbnails and the square cover, with everyone on the episode, eyes open, heads balanced and facing inward (the video's tile order);
    - podcast MP3 (no overlay sounds; no cold open unless the host wants it);
    - notes and description with final times (video times and podcast times differ);
    - chapters.
    Put each one in the review folder.
15. [ ] **Report** to the host: the review folder path, what waits for the host's choice, and what was kept on purpose. Nothing is uploaded or published without the host's go.

## 1. Edit approved

- [ ] Cut list reviewed: hedges ("I'm not sure"), BS and tech trouble cut hard; fillers, false starts, long pauses, pre-show and post-show chatter, on-air "let's cut that" moments, bot interruptions, remarks about how someone looks.
- [ ] `bun tools/podcast-edit/qa.ts <episode-dir>` passed before every preview sent to the host; zoomed strip crops and the card contact sheet looked at.
- [ ] **Host approved the edit** (watched the full draft, not only the cut list).
- [ ] Speaker names and titles are as the guest wants them. Ask; don't copy them from LinkedIn.

## 2. YouTube video

- [ ] Intro and outro in place.
- [ ] Illustrations: band cards, centre cards, charts and figures from the episode's research, each at the moment it is discussed. Data cards are chart-first `cards/*.card.json` with every number recomputed (`cards/cards.ts check`); cards that need explaining are in `notes/blog-candidates.md`.
- [ ] Header "postgres.fm <topic>" on one 104 px line; hosts face each other (order in CLAUDE.md); Kirk is a co-host, never a guest; no announcer voice; voices clearly above the music.
- [ ] Every overlay (card, photo, strip) that starts a sequence enters with a sound cue; overlays later in the same sequence (start within 3 s of the previous end, or the same `group`) change silently, and only the sequence's last overlay has an exit cue. Sounds follow the convention in `tools/podcast-edit/sfx/`: band cards get a typing reveal; centre cards get the sand strokes in and out, plus a punch on key reveals. Nothing bright, nothing sub-only. The render used `manifest-sfx.json` from `sfx-manifest.ts`, and the `qa.ts` check `sfx` passed.
- [ ] Loudness about -16 LUFS integrated; no clipping.
- [ ] Full decode check: no dropped or duplicated frames, A/V in sync at start, middle and end.
- [ ] If only overlays or sounds changed after a full render, splice the changed windows (`splice.ts`) or remux the audio (`compose.ts --audio-only`). Don't re-render the whole video.
- [ ] Long renders run under `watchdog.ts`. If a render froze at the outro, finish it with `splice.ts --outro` (SKILL.md, "Fix a finished video").
- [ ] Outro fits the episode: no experiment outro when there were no results; two companies on separate frames; no name said twice (voice and graphic).
- [ ] Camera backgrounds: nothing private visible (blur it).
- [ ] Every quoted post (X, LinkedIn, HN, mailing list, GitHub…) is a real screenshot of its UI with the URL printed, not a typed quote card.

## 3. YouTube metadata

- [ ] **Title** under about 50 visible characters. It must complement the thumbnail, not repeat it: the thumbnail asks the question, the title promises how we answered it (a concrete number or effort). No channel or episode suffix; the channel name already shows.
- [ ] Title settled **before** the thumbnails and the square cover are made; the covers show the final title.
- [ ] **Thumbnail(s)**, 1280×720:
  - dark background;
  - heavy condensed headline of 2–4 words;
  - host and guest heads in framed tiles, balanced (equal head size and eye level), each lit well enough; brighten a dark camera;
  - tile order as in the video: every head faces inward (`facing.json`, checklist section 0 item 6). The title card and the square cover follow the same order.
  - Make 2–3 options when unsure.
- [ ] **A/B test** (Test & Compare), thumbnail only with one fixed title (see Growth rules). It starts once the video is public; check the next day that it is running.
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
- [ ] Playlists, 2–3: always **Postgres.FM podcast** and **PostgreSQL in English**, plus 1 topic playlist (e.g. "PostgreSQL performance. Benchmarks", "PostgreSQL index maintenance. Bloat. VACUUM", "Postgres in containers. Docker. Kubernetes", "Postgres and AI", "Hacking Postgres").
- [ ] Publish as a normal **scheduled Public** video, not an instant Premiere (A/B tests cannot run during a Premiere). Schedule YouTube and Transistor for the same minute (Transistor: `PATCH /v1/episodes/<id>/publish` with `episode[status]=scheduled` and `episode[published_at]`).
- [ ] Upload route for big files: Studio needs a local file, so from a remote session serve the mp4 with Range support behind a tunnel and set it on the upload input (see SKILL.md). The YouTube Data API is the clean route, but uploads from an unverified OAuth project stay Private until Google's audit; get the audit done once.

## 4. YouTube subtitles

- [ ] English subtitles built from the edited transcript.
- [ ] **Dictionary pass:** apply the glossary in `prompt.txt` from https://gitlab.com/postgres-ai/content/postgres-fm to the subtitles and transcripts. Then read them through for names, product names (DBLab Forge, PL/pgSQL…), Postgres terms and SQL identifiers. Add new mis-hearings to the glossary in an MR to that repo.
- [ ] Uploaded **with timing** (the YouTube SRT, built from the final video's time map; not the podcast SRT) and published.
- [ ] **Remove YouTube's auto-generated English track** once it appears. It can take a while after upload, so check again after publishing.
- [ ] Check whether auto-dubbing is on, and turn it off unless we want it. The switch is channel-wide (Settings → Upload defaults → Advanced settings); for one video, delete the dubbed tracks on its Languages page once they appear.

## 5. Podcast audio (Transistor)

- [ ] Decide: does the audio get the cold open too? If yes, rebuild the mp3 and the transcript, and shift every podcast time in the notes by the cold-open length.
- [ ] Audio-only master: same edit, **no overlay sounds**, about -16 LUFS, MP3 with the episode cover embedded.
- [ ] Square cover 3000×3000 in the podcast style.
- [ ] Draft created with `transistor.ts`. Set:
  - title;
  - summary;
  - description (the HTML show notes);
  - transcript;
  - `video_url` pointing at the YouTube video.
- [ ] Show notes open with the "watch on YouTube" tip; since episode 193 the video carries charts and illustrations.
- [ ] Publish with `transistor.ts --show 32147 --episode <id> --publish`, then check:
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

## 9. Social posts (same day)

Rules and lessons: [`tools/podcast-edit/PROMOTION.md`](tools/podcast-edit/PROMOTION.md).

- [ ] X thread drafted in `episodes/<episode>/social/x-thread.md`: numbers in the first line, no link in the first post, links in the last reply, handles checked, a number check with sources.
- [ ] Only the guest's product and ours are named; other products are described generically.
- [ ] Media: an animation (each screen readable, contact sheet checked) and a speaker clip (`social/clip.py`; no sip or hand at the start; ends on the show URL).
- [ ] LinkedIn variant, links in the first comment.
- [ ] The host posts.

## 10. Blog post (postgres-ai/docs, a few days later)

- [ ] Draft MR with the SOC2 work item linked. The parts match the last two posts: plain title, TL;DR tabs, video, numbers, the social animation, "how it works" in depth, advice, limits, links, thanks.
- [ ] Terms defined for a generic engineer; about 70-80% STE; first person.
- [ ] No reader questions (no comments section); no figure that needs explaining.
- [ ] Lint, cspell, CI and the review app checked. The host merges.

## 11. After release

- [ ] Within a day: the auto subtitles are gone, auto-dubbing is off, the A/B test is running, and the RSS entry is correct.
- [ ] Update the episode's `README.md` here and the episode table in the top `README.md`: status, publication links (YouTube, postgres.fm, blog post), the experiment DOI.
- [ ] Note what went wrong in this release and fix the tool or this checklist.

## Growth rules (from reports/2026-11-13-growth-brainstorm.md)

- [ ] Publish Friday 06:30 Pacific. Schedule YouTube and Transistor on Thursday; freeze Thursday 18:00 PT. Keep 3 episodes in reserve.
- [ ] YouTube title has "Postgres" in the sentence; problem first; at most one number, with its unit and context.
- [ ] Thumbnail A/B test with ONE fixed title (Test & Compare, thumbnail only); one variant carries the episode title. Write down the result.
- [ ] Normal public publish, not an instant Premiere (A/B tests cannot run during a Premiere).
- [ ] Cold open (15–25 s: best line + chart) before the title card, chosen from 3-4 variants (section 0). From #197.
- [ ] Description: first line starts with "Postgres …" and states the conditions; search-style chapter names; "Related episodes" with YouTube links; subscribe line.
- [ ] End screen (Subscribe + Best for viewer) and 1–2 info cards where an older episode is mentioned.
- [ ] After publish: pinned comment with the numbers + a question; community poll; answer comments for 24 h.
- [ ] Second wave (Mon–Wed): speaker clip also as a Short; 2–4 min "answer" cut; blog post to HN / r/PostgreSQL / Postgres Weekly.
