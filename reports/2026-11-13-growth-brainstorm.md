# Postgres.FM growth brainstorm, 2026-11-13

- Written 2026-11-13 at about 06:00 Pacific, before the release of #196. Read-only work: nothing was changed on YouTube, on Transistor, or in any other file.
- Source tags:
  - [T-show], [T-ep], [YT-S], [YT-P]: the sources of `reports/2026-11-13-stats-report.md`. Numbers with these tags are copied from that report.
  - [YT-P2]: public YouTube data that I fetched today with `yt-dlp`: publish time, views, likes and comments of eps 168-195 and of three short videos.
  - [SITE]: the public pages postgres.fm, /subscribe and /episodes/extensions-on-demand, fetched today.
  - [EP196]: `episodes/20261110-temporary-tables/`. [PREP]: `README.md`, `RELEASE_CHECKLIST.md`, `tools/podcast-edit/PROMOTION.md`.
- "Derived" = my arithmetic on those numbers. "Guess" = my opinion without data. All thresholds and targets are guesses to calibrate.

## What the numbers say

- Audio is a loyal base, and it is flat. Mean d30 per episode: 1,116 (eps 141-160), 1,099 (161-180), 1,062 (181-194) [T-ep]. Episodes differ by only about +/-20% (stats report). Audio follows subscriptions, so a title moves it little.
- The 2026 audio drop is a cadence problem. From Jan 2 to Nov 6 there were 45 Fridays and 28 episodes: 17 Fridays were skipped [YT-P2]. Derived: 17 x about 1,060 (d30) = about 18,000 downloads, 36% on top of the 50,522 so far in 2026 [T-show]. With them, 2026 would already be level with all of 2024 (69,706).
- YouTube is where the show grows. Mean views per episode today: 542 (eps 168-178), 764 (179-188), 1,036 (189-192), 843 (193-195, still young) [YT-P2, derived]. Subscribers: +863 in 365 days, now 6,518 [YT-S]; about +15% in a year (derived).
- But YouTube leaks:
  - 63% of the monthly viewers are new and 13% are regular [YT-S]. Derived: 13% of 1.9K is about 250 regular viewers.
  - +49 subscribers in the last 28 days, against a 365-day average of about +66 per 28 days (derived). Subscribers per 1,000 views: 13.6 over 365 days, 6.4 over the last 28 days (derived).
  - End screens bring 0 views, the Shorts feed 0.1%, notifications 1.1% [YT-S]. Episodes get 0 to 7 comments each [YT-P2].
- Packaging matters on YouTube, not on audio. Podcast videos range from 312 to 1,319 views [YT-P, YT-S]: a 4x spread, against +/-20% on audio.
- The two platforms like different episodes. Audio likes broad questions: "When not to use Postgres" 1,339 d30, "What's missing in Postgres?" 1,246 [T-ep]. On YouTube the same two have 792 and 630 views [YT-P2]. YouTube likes named technology, guests and news: GSoC B-Tree Merge 1,319, ClickHouse 1,266, pgBackRest 1,196, pgrust 1,098 [YT-S, YT-P2].
- Short, timely videos beat full episodes on views. "Postgres 19 delayed for a month. Is this about AI?" (2:46): 3,599 views. The PgQue video (3:30): 729 views; the full PgQue episode: 649 [YT-P2].
- The best viewers come from inside YouTube. AVD by source: Suggested 11:12, Playlists 10:43, External 2:17 [YT-S]. People who click from social posts do not watch for long.
- Old how-to episodes win over years: WAL and checkpoint tuning 3,244 views, Partitioning 2,886, Connection poolers 2,493 [YT-S lifetime]. A new episode gets 400-1,300 [YT-P].
- Two warning signs since the new pipeline (eps 193-195). Small samples, so treat them as questions:
  - The publish time slipped. Eps 168-191 went live on Friday at 14:30 UK time (06:30 Pacific, 15:30 CET), with one exception. Eps 192-195 went live at 09:15, 12:15, 14:58 and 13:15 Pacific. The last three are 21:15-22:58 CET on a Friday [YT-P2]. Guess: the old slot was Michael's, and nobody owns it now.
  - Likes per episode: about 26 (eps 179-188), 18 (189-192), 13 (193-195) [YT-P2, derived]. The newer videos are younger, so check again in a month. If it holds, either the core audience likes the new episodes less, or the new viewers do not engage.
- No harm is visible in the totals yet: audio d7 for 192-195 is 794, 849, 888, 782, against a mean of 846 for 190-195 [T-ep]. So the slot and the Premiere are hygiene, not a proven lever.

## Top 10, ranked by expected effect on the audience in 6 months

1. **Publish every Friday at 06:30 Pacific. No skipped weeks.**
   - Why: it is the only lever with direct proof in our data. 17 skipped Fridays cost about 18,000 downloads in 2026 (derived, see above). June 2026 with no episode fell to 2,052 downloads, the lowest month since 2022 [T-show].
   - How: keep 3 finished evergreen episodes in reserve. Schedule YouTube and Transistor on Thursday evening. Dec 25 and Jan 1 are Fridays: record for them now.
2. **Make Postgres 19 the event of the quarter.**
   - Why: "Postgres 18" has the best d30 of eps 101-194 (1,367), and each major release is the top of its period [T-ep]. The 2:46 video about the Postgres 19 delay has 3,599 views, more than any episode of the last 365 days (best: 1,319) [YT-P2, YT-S].
   - How: record the episode before the release, publish it on the release day, and add 5-8 short "one Postgres 19 feature, measured" videos from DBLab Forge. The release date is not in my data: confirm it.
3. **Fix the YouTube packaging rules, and test them properly.**
   - Why: the two titles without the word "Postgres" ("We Inserted 2 Billion UUIDs to Settle This", "Extensions on demand") have the lowest CTR of the recent episodes, 1.3% and 1.7%, against 2.0-3.8% for 190-193 [YT-S, YT-P2]. Two data points, other things changed too.
   - How: every title has "Postgres" and the problem in plain words. The thumbnail carries one number. Test 2 bold options, one variable, from the first minute (so no instant Premiere). Write down every result.
4. **Build the return path on YouTube.**
   - Why: about 250 regular viewers, 0 views from end screens, 0-7 comments per episode, 6.4 new subscribers per 1,000 views (all above).
   - How: end screen and info cards on every video, a pinned comment with a question, topic playlists (Playlists AVD 10:43 [YT-S]), one spoken "subscribe" after the first result, a community poll per episode, answers to every comment in 24 hours.
5. **Start with the result, not with the housekeeping.**
   - Why: 63% of viewers are new and the AVD is 6:14-6:34 [YT-S]. In #196 the first minute is about Michael's time off, and the headline result (3,931 against 88,531 tx/s) is said at about minute 27 [EP196].
   - How: a 15-25 s cold open (the best sentence plus the chart), then the title card, then the talk. Show news goes to the end. From #197.
6. **Add a second, short video each week.**
   - Why: 729 views for the 3:30 PgQue video against 649 for the full episode; 3,599 for the Postgres 19 news video [YT-P2]. The Shorts feed gives 0.1% of views today [YT-S].
   - How: a 2-4 minute "answer" cut of each experiment episode on Tuesday or Wednesday, and the 30-75 s speaker clip also uploaded as a Short that links to the full video. Stop the Shorts if they miss the threshold in section 5.
7. **Borrow audiences: guests with their own audience, and Nik as a guest elsewhere.**
   - Why: ClickHouse 1,266 views, turbopuffer 1,100, pgrust 1,098 on YouTube; Multigres 1,215 d30 and pg_duckdb 1,931 all-time on audio. Small products are at the bottom: Xata 475, pg_flight_recorder 393, Gadget 364 [YT-S, YT-P2, T-ep].
   - How: one guest per month from an adjacent world (analytics databases, Rust, application frameworks). One appearance of Nik per month on a bigger backend or developer show. A share kit for every guest.
8. **Let the experiment travel without the podcast.**
   - Why: the measured result is what makes the show different, and a chart goes to places a 40-minute video cannot. Evidence is thin: #194 got the most impressions of the recent episodes (14,463) [YT-S], and audio d7 did not move (840 for 193-195 against 852 for 190-192, stats report).
   - How: each DBLab Forge episode ships a blog post, the brief and one chart; send them to Hacker News, r/PostgreSQL, Postgres Weekly, Planet PostgreSQL and the wiki page that the topic belongs to. Judge after 6-10 episodes.
9. **Relaunch the back catalog.**
   - Why: old how-to episodes reach 2,500-3,200 views over years [YT-S lifetime]; YouTube search is 16-19% of views [YT-S]; the titles of eps 156-193 all have the form "Topic | Postgres.FM N | #PostgreSQL #Postgres podcast" [YT-P2]; I did not list the older ones.
   - How: agents write search-style titles, chapters and descriptions, and build "start here" and topic playlists. Test on 20 videos against 20 controls first.
10. **Own a list, and get the missing data.**
    - Why: I found no email sign-up on postgres.fm [SITE]. There is no data from Apple or Spotify, no per-video retention, no social reach (stats report, "Data gaps"). Most choices above are guesses until this exists.
    - How: a weekly email or LinkedIn newsletter that agents write from the show notes; claim Apple Podcasts Connect and Spotify for Creators; a 5-question listener survey; a 30-minute growth review each month.

## 1. Today: quick wins for #196, ranked by effect per hour

- The clock comes first. It was 06:04 Pacific (15:04 CET) when I wrote this. The slot that the show used for all of 2026 until #191 is 15:30 CET. The last three episodes went live at 21:15-22:58 CET [YT-P2].
- So my advice is the opposite of "spend a few more hours before the release": change the metadata in 30-40 minutes, publish, then spend the hours on distribution. Hard limit: live by 09:00 Pacific (18:00 CET).

Before publishing (about 35 minutes):

1. **Publish as a normal public video, not an instant Premiere** (0 minutes, a decision).
   - Test & Compare cannot run during a Premiere [PREP], so the first and best impressions are lost for the test.
   - As far as I know, a person who opens a Premiere while it runs joins at the live point, not at 0:00. That is a bad first visit for someone who comes from X. Check this.
   - A Premiere is worth it only when the hosts are in the chat and people know the time in advance. With 0-7 comments per episode [YT-P2], I guess the chat is empty. Data gap: the number of live viewers and chat messages at the Premieres of 193-195.
2. **Change the title so that it has "Postgres" in it** (5 minutes).
   - The planned title, "Temp table per transaction: 3,931 vs 88,531 tx/s" [EP196], has no "Postgres" and no "CTE". Guess: "temp tables" is also a big SQL Server topic, so without "Postgres" YouTube can show the video to the wrong people. Two raw numbers with no context are hard to read on a phone.
   - My choice: **Postgres temp tables: the hidden performance cliff** (50 characters). It is true as stated, and it matches the brief.
   - Other good options: "The hidden costs of temp tables in Postgres" (43); "Temp table vs CTE in Postgres: 3,931 vs 88,531 tx/s" (51), which keeps the numbers and adds the search phrase "temp table vs CTE".
   - Keep "The hidden costs of CREATE TEMP TABLE" on Transistor. The audio title can differ.
3. **Test thumbnail A against thumbnail C, with one fixed title** (5 minutes).
   - A is "TEMP TABLES 23x SLOWER?" (a number), C is "DON'T USE TEMP TABLES?" (an opinion). Both fit the title above. Drop B ("5,000 IDLE SESSIONS?"): it does not say "temp tables", so it needs its own title, and then two things change at once.
   - Why 2 options and not 3: the best recent case is 14,463 impressions in 14 days [YT-S]. Derived, rough: with about 7,000 impressions per option at a CTR near 2.5%, only a difference of about 30% or more can be seen; with 3 options, about 36%. YouTube picks the winner by watch time, which is noisier than CTR.
   - If you prefer to test the title: keep thumbnail A and test my choice against the "3,931 vs 88,531" title. That answers the open question from #194.
4. **Description** (15 minutes). The hook lines are good. Changes:
   - Start the first line with the word: "Postgres temp tables in hot code: a temp table created and dropped in every transaction ran at 3,931 tx/s; the same query as a CTE at 88,531 tx/s (PG17, 16 vCPU, 32 clients, synthetic workload)."
   - Add "Related episodes" as YouTube links, so that people stay on YouTube (Suggested and Playlists have the longest AVD [YT-S]): UUIDv4 vs UUIDv7 https://www.youtube.com/watch?v=gf8e3JkQ_8M, LWLocks https://www.youtube.com/watch?v=DdQjvYHbIRU, max connections vs migrations https://www.youtube.com/watch?v=KFRK8PiIvTg, Long-running transactions https://www.youtube.com/watch?v=uSUpbUJM5Kk.
   - Add a subscribe line with the channel link.
   - Move the line about subtitles below the chapters.
   - Make chapter names read like search queries. Examples: "15:15 LWLock:SInvalWrite: why temp-table DDL reaches every session"; "26:30 Temp table vs CTE: under 4,000 vs 88,000 tx/s"; "07:40 What to use instead: arrays, CTEs, PL/pgSQL records"; "32:01 When temp tables are fine; unlogged tables". Rename "00:00 Intro" to the topic.
5. **End screen and info cards** (10 minutes). End screens give 0 views today [YT-S].
   - End screen in the outro: Subscribe, "Best for viewer", and the UUID episode.
   - Info cards: at 06:12 the UUID episode (it is named there), at 15:15 the LWLocks episode.
   - Be honest about size: few viewers reach the end of a 38-minute video (retention is a data gap). It is cheap, so do it.

Right after publishing (about 30 minutes):

6. **Pinned comment** (5 minutes). Suggested text:
   - "Numbers from this episode (synthetic workload; conditions in the brief): a temp table created and dropped in every transaction: 3,931 tx/s; the same query as a CTE: 88,531 tx/s (26:30). With 5,000 idle sessions, temp-table DDL falls from 502 to 127 tx/s (20:05). Brief: https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d. Question: do you create temp tables in the request path? What did you use instead: a CTE, arrays, an unlogged table?"
   - Then answer every comment for 24 hours. Ask Kirk to do the same.
7. **X thread and LinkedIn, with video in the first post** (15 minutes).
   - The draft uses a still image. PROMOTION.md says the first post gets a clip or an animation, and neither is made [EP196]. Fast way: cut 20-30 s of the final video at the throughput card (Nik reads the two numbers at about 26:58-27:25). No new render.
   - Post from the show accounts too: X @PostgresFM and Mastodon @postgresfm@fosstodon.org are on the site [SITE]. Check that somebody posts there while Michael is away. Add Bluesky.
   - LinkedIn: try the four charts (`assets/23-throughput.png`, `17-cliff.png`, `21-ring.png`, `16-ash.png`) as one document post. Guess: this format does well with engineers there.
   - Send Kirk a ready post and the clip of himself. People share clips where they speak.
8. **Community poll** (5 minutes). "Where do you create temp tables in Postgres?" Options: "In the request path, per transaction" / "Once per session" / "Only in batch jobs" / "Never". It is the only free way to reach the subscribers who do not watch (6,518 subscribers, about 250 regular viewers).
9. **Playlists** (5 minutes). Start a playlist "Postgres performance cliffs": this episode, LWLocks (#162), max connections vs migrations (#166), Long-running transactions (#175), Top ten dangerous issues (#144), UUIDv4 vs UUIDv7 (#194). Check that the "Postgres.FM podcast" playlist is marked as a podcast in Studio.
10. **Publish on Transistor at the same minute**, then check the RSS feed [PREP].

Second wave, Monday to Wednesday (1-2 hours in total):

- **Speaker clip of Kirk** (45-60 minutes with `social/clip.py`): about 25:09-26:25 in the transcript. He explains the 4,096-slot ring buffer as a broadcast to every session and ends with "adding an extra developer to a late project only makes it later". One idea, a good last line. Use it on X and LinkedIn, and upload the same file as a YouTube Short with the full episode as its related video. Guess: a 1080x1350 file under 3 minutes counts as a Short; check at upload.
- **Trick clip of Nik**: "select t1 from t1", about 29:39-31:35, with the psql card (`assets/24-psql.png`). It is useful to any backend engineer, not only to DBAs. Cut it to 60-90 s.
- **The blog post, when it is out**: send the post (not the video) to Hacker News and r/PostgreSQL on a weekday morning Pacific time (guess), and to Postgres Weekly. Read the subreddit's rule on self-promotion first.
- **The wiki**: the show notes link the "Don't Do This" entry on temp tables [EP196]. Ask Kirk if the entry can cite the brief once the raw data is public.
- **Retitle #195 and #194** (2 minutes each, after their tests end): see experiment E1.

Not today:

- **A cold open for #196.** It needs a new render and a new upload: a new video ID, shifted captions and chapters, changed links in the thread and in Transistor. That is 1.5-3 hours and a late release, for one episode. Make it standard from #197.
- **The social animation.** The charts and the two clips are enough.
- **More versions of the title card or the overlays.** #196 already has title-card versions v5 to v9 and final video v6 [EP196].
- **A 3-option test of title wording.**

## 2. Per-episode process changes

Release rhythm:

- Thursday 18:00 Pacific is the freeze. Schedule YouTube and Transistor for Friday 06:30 Pacific. Things that are not ready go to the second wave or are dropped.
- Three waves instead of one day: Friday the episode and the thread; Monday or Tuesday the speaker clip and the Short; Wednesday or Thursday the answer video or the blog post. Two or three contacts per week instead of one.
- A time budget. Rule: the clip and the posts are finished before the title card gets a new version. Reason: the illustrations show no measurable effect yet (stats report), audio listeners cannot see them, and on the release day of #196 the social media were "not made yet" [EP196].

Titles:

- "Postgres" (or a word that can only mean Postgres: pgvector, autovacuum, pgBackRest) is in every YouTube title. Not as a hashtag suffix; in the sentence.
- Problem first, mechanism second. Guess, to test: "hot_standby_feedback" (819 views) becomes "Why your Postgres replica cancels queries"; "Plan flips" (382) becomes "Why did my Postgres query suddenly get slow?"; "pg_wait_tracer" (393) becomes "Find what your Postgres is waiting on" [views: YT-P2].
- "X vs Y" when it is true. Comparisons do well: SQL vs NoSQL 2,154 all-time audio [T-ep], max connections vs migrations 1,100 views [YT-S].
- One number at most in a title, with its unit and its context. Never two bare numbers.
- Every claim is true as written, and its conditions are in the first line of the description. "23x" is "23x in our test". This audience punishes a loose claim.
- Decide the hook before the recording: "what is the one number or the one chart?" Then the hosts say it clearly in the first two minutes.

Thumbnails:

- Test the design, not only the words: chart first (two bars, 3,931 against 88,531, and a big "23x") against the current faces layout. Today's tiles are small Zoom frames, and two laughing faces under "23x SLOWER?" send two different messages.
- Check each thumbnail at 320 px wide before upload.
- One layout family, so that people recognise the show in the feed.

The first minute:

- Order: cold open (15-25 s), title card (7 s at most), topic. Guess: a 14-second animated card before any content loses new viewers. Check it in the retention curves of 193-195 before you change the card.
- Show news (who is away, how to watch) goes to the end.
- One spoken ask after the first result: "if this is useful, subscribe; we measure one Postgres question every week".

Chapters, description, SEO:

- Chapter names are search phrases. No "Intro", no "Layer 3", no "The brief".
- "Postgres" in the first description line; related episodes as YouTube links; info cards when an older episode is named on air.
- YouTube title and podcast title are chosen separately. Audio is subscription-driven; YouTube is not.
- postgres.fm already has a transcript page per episode [SITE]. For search on the web, the blog post is the page to rank. Keep the rule that experiment episodes get one.

Clips:

- One idea per clip, 30-75 s [PREP]. Every clip goes to X and LinkedIn as native video and to YouTube as a Short with a related-video link.
- For social posts the goal is reach and new followers of the show, not YouTube watch time: External AVD is 2:17 [YT-S].

Guests:

- Choose a guest who brings an audience that we do not have. Niche products as a main topic: one per month at most, with a problem-first title.
- Ask each guest for "your one number" before the recording.
- Share kit on release day: a clip of the guest, a ready post, the thumbnail, the links. Ask them to post in the first 24 hours.
- While Michael is away: a guest co-host with their own audience for 3-4 weeks in a row is worth more than a one-time guest (guess).

Topics, one month as a portfolio:

- One broad question for audio ("When not to use Postgres" 1,339 d30, "Top ten dangerous issues" 1,278 [T-ep]).
- One measured "X vs Y" with DBLab Forge.
- One guest from outside the Postgres circle.
- One core how-to that people search for ("autovacuum" 1,221 d30 [T-ep]; WAL and checkpoint tuning 3,244 views over the years [YT-S lifetime]).
- Careful with a year-in-review episode: "Postgres year in review 2025" has 359 views, the lowest of the 2026 episodes [YT-P2].

After release:

- Answer every comment in 24 hours.
- Log for each episode: title and thumbnail used, test result, publish time, views at 48 hours and at 7 days, d7, subscribers gained. Without this log, each A/B test is lost.

## 3. Bigger bets for the next 3-6 months

- **Postgres 19 package** (top 10, item 2).
  - First step: confirm the release date; book a committer or a member of the release team as the guest; choose the 5-8 features to measure.
  - Short videos: one feature each, 2-4 minutes, one chart, the same title pattern ("Postgres 19: <feature>, measured").
- **"We measured it" as a named series.**
  - One question that people already argue about, one reproducible experiment, one chart. Topic ideas (guess): how many indexes are too many, the cost of subtransactions, JSONB against columns, 10,000 partitions, connection count against throughput, numeric against bigint.
  - Series playlist with numbered parts; the same thumbnail family.
  - Stop or change if, after 6-10 episodes, YouTube views at 28 days and d30 are not above the means of 190-192.
- **A live experiment format.** The agent runs the experiment during the recording and the result is shown at the end. Guess: "AI and Postgres" pulls viewers; the video with "Is this about AI?" in the title has 3,599 views [YT-P2]. Rule: every number is checked after the recording and before the release.
- **Short videos as a second format** (top 10, item 6). Two kinds: the answer cut of an episode, and a news comment of 2-3 minutes in the same week as the news.
- **Adjacent audiences** (top 10, item 7).
  - Candidates to ask (guess; check who was already on the show): Talking Postgres, Scaling Postgres, 5mins of Postgres, Database School, Hussein Nasser's channel, the CMU Database Group, The Changelog, Software Engineering Radio, and framework podcasts (Rails, Django, Elixir, Laravel).
  - The pitch for developer shows: "Postgres mistakes that application teams make", with measured numbers.
  - Trade trailers or episode mentions with other Postgres shows.
- **Back-catalog relaunch and a "start here" track** (top 10, item 9).
  - Playlists: "Postgres for backend engineers: start here" (Beginner tips, 2,157 all-time audio [T-ep]; Schema design checklist, 905 views [YT-S]), "Performance cliffs", "Vacuum and bloat", "We measured it".
  - Set the channel home page: a trailer for new visitors and the playlists as sections. I did not look at the current layout.
- **Newsletter and owned list** (top 10, item 10).
  - Cheapest start: a LinkedIn newsletter from Nik's profile (guess: followers are invited to it automatically) plus an email list. One issue per episode: the result, the chart, three links.
  - Ask if the pgMustard newsletter and the PostgresAI mailing list can carry each new episode. I do not know what they do today.
- **The website.** Facts [SITE]: the home page title is "Postgres FM"; the Subscribe page lists Apple, Spotify, Overcast, Pocket Casts and others, and links YouTube only as a playlist; I found no email form.
  - Add a YouTube channel link with the subscribe prompt, an email form, and a "start here" page. I did not check what the Transistor site theme allows.
- **Video on Spotify and Apple, and the YouTube podcast tab.**
  - First claim the two dashboards; they show followers and completion. Then decide.
  - If Spotify is a large part of the downloads, test video there for 4 episodes. To verify first: I believe a video uploaded to Spotify replaces the audio there and may stop counting as a Transistor download.
  - Apple video: verify what Transistor supports. I have no data.
- **Conference tie-ins.**
  - Hallway interviews: 5-8 minutes with each speaker, "the one thing from your talk". Ten short videos per event, and each speaker shares their own.
  - One live episode with questions from the room.
  - Events to consider (dates to confirm): FOSDEM PGDay, PGConf.dev, POSETTE, PGConf.EU, PGConf NYC.
- **Listener episodes.** A monthly "your production problem" episode from comments and the community poll. It gives a reason to comment, and "Top ten dangerous issues" shows that problem lists work (1,278 d30 [T-ep]).
- **Other languages.** Translated titles and descriptions for the top countries (free, low risk). Auto-dubbing only after a native speaker checks two minutes of it. Needs the geography data first.

## 4. What to stop doing

- **Stop skipping Fridays.** 17 of 45 in 2026 [YT-P2].
- **Stop releasing in the Pacific afternoon, and stop polishing on the release day.** The last three episodes went live at 21:15-22:58 CET [YT-P2].
- **Stop the instant Premiere as the default.** Keep a scheduled Premiere for special episodes with the hosts in the chat.
- **Stop YouTube titles without "Postgres"**, and stop bare number pairs as the default title until a test supports them. #194's result title: the most impressions, the lowest CTR (1.3%) and the shortest AVD (5:19) [YT-S]; one data point.
- **Stop 3-option tests of small wording changes**, and stop tests that nobody writes down. The results of the #194 and #195 tests are not in the stats report.
- **Stop opening with show news.**
- **Stop tool-name titles for narrow topics.** pg_flight_recorder 393 views, pg_wait_tracer 393, Plan flips 382 [YT-P2]; hot_standby_feedback 911 d30, pg_wait_tracer 966 [T-ep].
- **Stop counting social link clicks as YouTube growth.** External is 13.8% of views with an AVD of 2:17 [YT-S].
- **Stop putting hours into the title card and overlay versions before the clip and the posts exist.** No measured effect yet (stats report).
- **Stop running product ads on public videos of this channel.** 2,990 ad views with an AVD of 1:05 [YT-S] are mixed into the channel numbers. Use unlisted copies for ads. Whether ad views change YouTube's recommendations, I do not know; the sure gain is clean data.
- **Stop linking YouTube viewers to postgres.fm for older episodes.** Link the YouTube video.
- **Stop judging an episode by one number.** Use the log in section 2.

## 5. Experiments

Each has a metric and a success threshold. The thresholds are guesses; fix them after the first two results. One variable per episode: alternate E2 and E3.

- **E1. "Postgres" in the title (retitle #194 and #195).**
  - Change: after their tests end, add "Postgres" and the search phrase, for example "UUIDv4 vs UUIDv7 in Postgres 18: 2 billion rows tested" and "Postgres extensions on demand, without fat images".
  - Metric: CTR and views from YouTube search in the next 28 days, against the 14 days before.
  - Success: CTR at or above 2.5% (now 1.3% and 1.7% [YT-S]), or search views double. A weak before-and-after design, but it costs four minutes.
- **E2. Result-number title against plain problem title.**
  - Change: 2 titles, the same thumbnail, on 6 episodes with a measured result.
  - Metric: YouTube's verdict (watch-time share) and CTR.
  - Success: one style wins 4 of 6. It becomes the rule.
- **E3. Chart thumbnail against faces thumbnail.**
  - Change: 2 thumbnails, the same title, on 6 episodes. #196 gives the first point of a related question (number headline A against opinion headline C).
  - Metric and success: as E2.
- **E4. Morning release without Premiere against the afternoon Premiere of 193-195.**
  - Metric: YouTube views at 48 hours and 7 days; audio d7.
  - Baseline: #195 has 590 views at 7 days [YT-P]; d7 of 193-195 is 849, 888, 782 [T-ep]. The 48-hour numbers of 193-195 are a data gap: read them in Studio.
  - Success: the mean of the next 4 episodes is not lower. Then the Premiere stays off. Topic effects are mixed in.
- **E5. Cold open.**
  - Change: on every second episode, for 8 episodes.
  - Metric: the share of viewers still watching at 0:30 and at 1:00; AVD.
  - Success: +10 points at 0:30 and +1 minute of AVD against the episodes without it.
- **E6. Return path.**
  - Change: end screen, cards, pinned question and spoken ask on new episodes; end screens on the 30 most-viewed videos of the last 90 days.
  - Metric: views from end screens (now 0 [YT-S]); subscribers per 1,000 views (now 6.4, derived); comments per episode (now 0-7 [YT-P2]).
  - Success in 8 weeks: 150 end-screen views per 28 days; 12 subscribers per 1,000 views; 10 comments per episode.
- **E7. Shorts.**
  - Change: one Short per episode for 8 episodes, each linked to the full video.
  - Metric: views per Short; subscribers from Shorts; views of the full episode that come from the Short.
  - Success: a median of 1,000 views and 5 subscribers per Short, or 3% of the full episode's views. Below that, stop the Shorts and keep the clips for X and LinkedIn.
- **E8. The answer video.**
  - Change: a 2-4 minute cut, midweek, for 4 experiment episodes.
  - Metric: views at 28 days against the full episode; subscribers gained.
  - Success: at least as many views as the full episode (as with PgQue: 729 against 649 [YT-P2]) and 10 subscribers each.
- **E9. Back-catalog relaunch.**
  - Change: new title, chapters and description on 20 old episodes; 20 similar episodes stay as controls.
  - Metric: views in the next 28 days divided by views in the 28 days before, treated against control.
  - Success: the treated ratio is 1.3 times the control ratio. Then do the rest of the catalog.
- **E10. Problem-first titles for narrow topics.**
  - Change: the next 3 narrow topics.
  - Metric: d30 and YouTube views at 28 days.
  - Baseline: 911-966 d30 [T-ep]; 382-393 views for the tool-name titles [YT-P2].
  - Success: d30 at or above 1,060 and 800 views.
- **E11. Guest share kit.**
  - Metric: did the guest post (yes or no); External views in the first 7 days; views at 7 days.
  - Success over 8 guest episodes: episodes with a guest post have 20% more views at 7 days.
- **E12. Community poll.**
  - Metric: votes per poll; Browse views of the episode in the first 48 hours.
  - Success after 6 polls: 100 votes or more on at least 3 of them.
- **E13. Newsletter.**
  - Metric: subscribers; open rate; audio d7.
  - Success in 8 weeks: 400 subscribers, a 40% open rate, d7 at or above 950 (the mean of 190-195 is 846 [T-ep]).
- **E14. Postgres 19 package.**
  - Success: d30 at or above 1,400 (Postgres 18: 1,367 [T-ep]); 2,000 YouTube views in 28 days (the Postgres 18 episode has 1,100 [YT-P2]); 100 new subscribers in the release week (now +49 in 28 days [YT-S]).
- **E15. Twelve Fridays in a row.**
  - Metric: monthly downloads; the share of regular viewers.
  - Success: 6,500 downloads or more in each of 3 months (2026 range: 4.5-6.5K [T-show]); regular viewers at 18% (now 13% [YT-S]).

## 6. Data we are missing to decide

- **Retention curves** of 193-195: the share still watching at 0:14 (end of the title card), 0:30 and 1:00. Decides the cold open and the title card. Ten minutes in Studio.
- **The results of the #194 and #195 title tests**: which option won, by how much.
- **Per-video reach**: impressions, CTR, and views by traffic source at day 7 for the last 10 episodes.
  - Something does not add up. Derived: impressions x CTR is about 1,400 views in the last 28 days (77,732 x 1.8%), 18% of the 7,601 views. But Browse, Search and Suggested together are 76% of views [YT-S]. For #194: 14,463 x 1.3% is about 190 of 1,139 views. Before more work on CTR, read the Reach funnel in Studio for a few videos and learn how many views a thumbnail really decides.
- **Premiere numbers**: peak live viewers and chat messages for 193-195.
- **Who and when**: geography; "When your viewers are on YouTube"; devices; the share of watch time from subscribers. Decides the slot and the translations.
- **Search terms** that bring viewers (Studio, Reach). Decides topics and back-catalog titles.
- **Which videos and channels suggest ours.** Decides who to work with.
- **The External source list**: X, LinkedIn, postgres.fm, the blog, Google. Decides where to post.
- **Subscribers gained per video.**
- **Apple Podcasts Connect and Spotify for Creators**: followers, completion, the Spotify share. **Transistor**: the split by app and by country.
- **Social reach**: impressions and link clicks per post on X and LinkedIn, and for the show accounts. Add UTM tags to the links to postgres.fm and to the brief.
- **Website visits**: postgres.fm, the brief pages, the blog posts.
- **Hours per episode by stage** (edit, cards, title card, metadata, social), for Nik and for the agents. "Effect per hour" is a guess without it.
- **A listener survey**: role, how they found the show, audio or video, what they miss.
- **Likes per episode at a fixed age** (day 14), to learn if the drop from about 26 to 13 is real.
- **The Shorts tab.** My fetch returned one item and had errors; check how many Shorts the channel has.

## Targets for May 2027 (guesses, not forecasts)

- Audio: mean d30 from about 1,060 to 1,250. Monthly downloads above 7,300 for three months in a row (the record is 7,292, Sep 2025 [T-show]).
- YouTube: +150 subscribers per 28 days (now +49). Regular viewers from 13% to 20%. Mean episode views at 28 days of 1,300 or more.
- No skipped Friday.
