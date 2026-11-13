# Postgres.FM stats report, 2026-11-13

Read-only snapshot taken 2026-11-13. Sources:
- [T-show] Transistor API `/v1/analytics/32147`, daily downloads 2022-07-05 to 2026-11-12
- [T-ep] Transistor API `/v1/analytics/32147/episodes`, daily downloads per episode, plus `/v1/episodes` (duration, number)
- [YT-S] YouTube Studio Analytics, Advanced mode (channel PostgresTV, "last 28 days" = Oct 16 to Nov 12, "last 365 days" = Nov 13 2025 to Nov 12 2026, lifetime)
- [YT-P] public data via `yt-dlp` (exact view, like and comment counts, upload dates), fetched 2026-11-13
- [PREP] ~/github/postgres-fm-prep (README, tools/podcast-edit/PROMOTION.md)

"d7" and "d30" = downloads in the first 7 and 30 days after publish, from [T-ep]. They are the fairest way to compare episodes of different age.

## Headline numbers

- Audio, all time: 255,618 downloads since the first episode on 2022-07-05 [T-show].
- Audio, per year: 2022 (half year) 13,366; 2023 54,266; 2024 69,706; 2025 67,758; 2026 to Nov 12 50,522 [T-show].
- Audio, typical new episode in 2026: about 830-880 downloads in 7 days, about 1,050-1,100 in 30 days, about 1,200-1,500 all time after a few months [T-ep].
- YouTube channel (PostgresTV, not only the podcast): 6,518 subscribers; lifetime 263,793 views, 26,067 watch hours, 4.28M impressions, CTR 2.2% [YT-S lifetime].
- YouTube, last 365 days: 63,260 views, 5,351.5 watch hours, average view duration 6:34, +863 net subscribers, 698,596 impressions, CTR 2.7% [YT-S 365].
- YouTube, last 28 days: 7,601 views, 368.5 watch hours, AVD 6:14, +49 subscribers, 77,732 impressions, CTR 1.8% [YT-S 28]. Monthly audience about 1.9K; 63% new viewers, 23% casual, 13% regular [YT-S overview].
- A full Postgres.FM episode on YouTube usually gets 400-1,300 views in total [YT-P]. So per episode, audio is about 1.5-2.5x bigger than YouTube.

## Trends

- Audio grew fast in 2022-2024, then went flat. Monthly downloads: about 1-3K in 2022, 4-6K in 2023, 5-6.5K in 2024, 5-7.3K in 2025 (peak Sep 2025: 7,292), 4.5-6.5K in 2026 [T-show].
- Monthly totals follow the release rhythm closely. June 2026 had no new episode (gap from May 29 to Jul 3) and fell to 2,052 downloads, the lowest month since 2022. Dec 2025 (3,740) also had only two episodes [T-show, T-ep]. The back catalog alone does not hold the numbers: a missed week costs downloads.
- Release cadence slowed: weekly in 2022-2024, then many two-week gaps from 2025 on (for example eps 162-168, 171-175) [T-ep].
- Per-episode reach per launch is flat, not falling. Mean d30 by episode block: 1-20: 411; 21-40: 585; 41-60: 692; 61-80: 801; 81-100: 876; 101-120: 970; 121-140: 971; 141-160: 1,116 (peak); 161-180: 1,099; 181-194: 1,062 [T-ep].
- So yearly totals in 2026 are lower mostly because there are fewer episodes, not because each episode reaches fewer people.
- Older episodes keep earning: early episodes (1-60) have 1,000-2,700 all-time downloads, of which only 300-700 came in the first 30 days [T-ep].

## Recent episodes 190-195 vs older

Audio [T-ep] (d7 / d30 / all-time; d30 is not complete for eps 193-195):
- 190 ClickHouse Managed Postgres: 845 / 1,069 / 1,161
- 191 GSoC B-Tree Merge: 918 / 1,268 / 1,335
- 192 Citus + StackGres: 794 / 969 (28 days) / 969
- 193 Dump/restore done. Now what?: 849 / 1,012 (21 days)
- 194 UUIDv4 vs UUIDv7: 888 / 975 (14 days)
- 195 Extensions on demand: 782 (7 days)
- Mean d7 for 190-195 = 846. Mean d7 for 181-189 = about 823. Mean d30: 170-179 1,071, 180-189 1,064, 190-194 1,059. In short: flat.

YouTube, views as of 2026-11-13 [YT-P], with AVD and CTR from [YT-S 365]:
- 190: 1,266 views, AVD 7:29, CTR 3.7%
- 191: 1,319 views, AVD 7:17, CTR 2.0%
- 192: 741 views, AVD 11:26, CTR 2.7%
- 193: 800 views, AVD 6:46, CTR 3.8%
- 194 (renamed to "We Inserted 2 Billion UUIDs to Settle This"): 1,140 views in 14 days, AVD 5:19, CTR 1.3% on 14,463 impressions
- 195: 590 views in 7 days, AVD 9:59, CTR 1.7%

## Per-episode ranking

Audio, top by d30 (eps 101-194) [T-ep]:
- 160 Postgres 18: 1,367
- 157 When not to use Postgres: 1,339
- 144 Top ten dangerous issues: 1,278
- 191 GSoC B-Tree Merge: 1,268
- 176 What's Missing in Postgres?: 1,246
- 161 User management: 1,244
- 181 autovacuum: 1,221
- 150 Multigres: 1,215

Audio, top all time [T-ep]: 1 Slow queries and slow transactions (2,713), 55 Beginner tips (2,157), 134 SQL vs NoSQL (2,154), 129 pg_duckdb (1,931), 40 Partitioning (1,886), 2 Managed services vs. DIY (1,859), 160 Postgres 18 (1,784), 144 Top ten dangerous issues (1,770), 83 Modern SQL (1,764), 81 pgvector (1,749).

Audio, bottom by d30 (eps 101-194) [T-ep]: 105 Postgres startup ecosystem (822), 121 Postgres online communities (828), 106 Out of disk (838), 125 pg_stat_statements track_planning (853), 101 pgvectorscale (854), 126 Column Tetris (871). Recent low ones: 189 hot_standby_feedback (911 d30), 178 pg_wait_tracer (966), 173 Plan flips (955).

YouTube, podcast episodes, last 365 days by views [YT-S 365]: 191 (1,319), 190 (1,266), 182 pgBackRest (1,196), 194 UUIDs (1,139), 166 max connections vs migrations (1,100), 187 pgrust (1,098), 188 Estimating work_mem (992), 177 Schema design checklist (905), 164 Tens of TB per hour (848), 181 autovacuum (840).
- Bottom in the same window: 174 PostGIS (445), 165 What's new in EXPLAIN (450), 185 Xata (475), 167 Archiving (497). All-time public counts, lowest: 135 Extended Statistics (312), 148 Mean vs p99 (329), 171 Comments and metadata (336), 153 caSe-inSENsiTive (343), 168 Year in review 2025 (359) [YT-P].
- Highest watch time per view (AVD) in 365 days: 192 (11:26), 176 (11:14), 182 (10:54), 179 PgQue (10:16), 165 (10:03), 195 (9:59) [YT-S 365].

YouTube, whole channel all time [YT-S lifetime]: the top is older non-podcast content (Buffer management talk 4,428; PostgresAI launch video 3,998; psql talk 3,930; vacuum talk 3,693; "Postgres 19 delayed" short 3,599). Top podcast videos all time: 010 WAL and checkpoint tuning (3,244), Partitioning (2,886), Version control for databases (2,864), 022 PostgREST (2,802), Logical replication common issues (2,710), Connection poolers (2,493).

## What seems to correlate with good performance

These are patterns, not proven causes. Sample sizes are small and the spread between episodes is narrow (about +/-20% around the mean).
- Topic breadth wins on audio. Broad or "big picture" titles lead: major releases (Postgres 15/16/17/18 are each top of their period), "When not to use Postgres", "Top ten dangerous issues", "What's missing", "SQL vs NoSQL", "Beginner tips", "Best Practices" [T-ep].
- Narrow internals and niche tools are at the bottom: track_planning, Column Tetris, pg_wait_tracer, hot_standby_feedback, Extended Statistics [T-ep, YT-P]. Exception: "autovacuum" (181) did well; well-known core topics are fine.
- Guests/products: a known product or person helps somewhat (Multigres 1,215; pg_duckdb 1,931 all time; PgDog 139). Smaller or less-known products are below average (startup ecosystem, pgvectorscale, Xata 982, pg_flight_recorder 1,069) [T-ep].
- Length: weak positive link on audio (correlation 0.28 between duration and d30, eps 121-194). Longer episodes are often guest episodes on big topics, so this is likely not causal [T-ep].
- Title style on YouTube: ep 194, retitled as a "result" headline, got the most impressions of any recent episode (14,463) and 1,139 views in two weeks, but the lowest CTR (1.3%) and shortest AVD (5:19). YouTube showed it more, but fewer people clicked and they left earlier. One data point only [YT-S].
- Short clips: non-podcast shorts and launch clips get the top view counts (Postgres 19 delayed: 3,599; PostgresAI demo 2: 2,262; intro video 3,998), but watch time and subscribers from them are tiny (for example 30 hours, +3 subs). Note: a part of the PostgresAI views came from YouTube advertising (2,990 ad views in 365 days, AVD 1:05) [YT-S].
- Illustrations and charts (since ep 193, see PROMOTION.md [PREP]): no measurable change yet. Audio d7 for 193-195 (mean 840) is the same as 190-192 (852). On YouTube, 193 is mid-pack (800 views) and 195 had a good AVD (9:59) but only 7 days of data. Need 6-10 more episodes before any call. Note that audio listeners cannot see illustrations at all, so they can only affect YouTube and social.

## Audience and traffic (YouTube, last 365 days) [YT-S]

- Browse features 37.4% of views (30.8% of watch time); YouTube search 16.1%; External 13.8% (but AVD only 2:17); Direct/unknown 9.0%; Suggested videos 6.1% (AVD 11:12, best); YouTube advertising 4.7%; Channel pages 4.5%; Playlists 4.0% (AVD 10:43); Notifications 1.1%; Shorts feed 0.1%; End screens 0.
- Last 28 days: Browse 50%, Search 19%, Suggested 7%.
- Most of the audience is new each month (63% new viewers); regular viewers are only 13%. Top demographic: male 35-44.
- End screens give 0 views, and Shorts feed almost nothing: two unused surfaces.
- Suggested and Playlist traffic watches longest (10-11 min). Organic discovery (search, suggested) is where engaged viewers come from.

## Data gaps

- Transistor: no app/platform split, no geography, no listener retention used here. Downloads are not unique listeners. The `/analytics/episodes` endpoint uses mm-dd-yyyy dates and the show endpoint dd-mm-yyyy; handled in the analysis.
- d30 is incomplete for eps 192-195. Re-run in mid-December for a fair read on 193-195.
- YouTube: did not read per-video retention curves, per-video traffic sources, or "last 90 days" (the Studio URL value for 90 days was not found). Numbers from [YT-S 365] for a video can differ a little from [YT-P] totals because of the window.
- YouTube channel mixes podcast, talks, hacking sessions and product videos, so channel totals are not podcast-only.
- No data from Spotify for Podcasters or Apple Podcasts Connect, which would give follower counts and completion rates.
- Not measured: social posts reach (LinkedIn, X), website visits, newsletter.
