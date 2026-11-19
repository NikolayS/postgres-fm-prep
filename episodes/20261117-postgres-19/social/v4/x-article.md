# Episode 197 (Postgres 19): X Article draft, v4

DRAFT v4, 2026-11-19. Nothing is posted. Nik publishes it as an X Article (long-form) and links it from its own post, Tue 24 Nov 8:30 AM PT (see [`x-plan.md`](x-plan.md#article-post-tue--media-article-coverpng)). v4: the trap section comes first, reproduced (`repro/`); the note on synthetic tests is at the end. Same sourcing rules as the posts: every number is in the number check of [`x-plan.md`](x-plan.md#number-check) or in the extra rows at the end of this file.

- Cover: `preview/social-v4/article-cover.png`, 1500x500, channel style (rebuilt by `build.ts article`).
- Images: the existing slides in `preview/social-v4/`, one per section, as named in each section.
- Phone preview of the first screen: `preview/social-v4/article-phone.png`.
- Length: the article text between the two rules below; `build.ts sheet` prints its word count.

---

## Title

Postgres 19, measured: what got faster, and what to check before you upgrade

## Body

Postgres 19 is out. Before we recorded the new postgres.fm episode, we tested 19 RC2 against 18.7 on dedicated hosts. Here is what we measured, with the catches. Michael Christofides, Kirk Wolak and I talk it all through in the episode.

### The upgrade trap: --check says OK, the upgrade fails

Image: `s06-upgrade.png`

First, the one thing to check before you upgrade. pg_upgrade --check can say OK, and the upgrade to 19 still fails. We reproduced it, 18.7 to 19 RC2.

The cause: escape_string_warning (removed in 19, any value) or standard_conforming_strings = off (19 requires on), set on a role, a database or a function. GRANT SET ON PARAMETER escape_string_warning breaks it too. The check passes all of them. standard_conforming_strings = on is fine.

Find them before your upgrade window. Run the pg_proc query in each database:

```
select * from pg_db_role_setting
where setconfig::text ~ 'standard_conforming_strings|escape_string_warning';
select oid::regprocedure from pg_proc
where proconfig::text ~ 'standard_conforming_strings|escape_string_warning';
select parname from pg_parameter_acl
where parname = 'escape_string_warning';
```

Then upgrade a clone first.

### LISTEN/NOTIFY: 55x, and more

Image: `s01-notify.png`

1,000 listeners, each on its own channel, 4 notifiers, an 8-vCPU host. 18.7 sent 200 notifications per second. 19 sent 11,040. That is 55x, and it is a floor: our test client was the limit, so 19 can go higher.

The catch: the global lock at commit is still there. With many concurrent writing transactions, NOTIFY can still be your bottleneck.

### Autovacuum goes to the urgent table first

Image: `s02-autovac.png`

One table near wraparound (age 1.65 billion) among 120 bloated tables. On 18.7, autovacuum got to it last of 121, after 152.3 s. On 19 it was first, after 12.9 s.

Michael and Kirk both picked this one. There is nothing to configure: upgrade, and it works.

### TOAST uses lz4 by default

Image: `s03-lz4.png`

If your Postgres is built with lz4, 19 uses it for TOAST by default. We inserted 200,000 jsonb documents of 16 KiB: 44 s on 19 with lz4, 107 s on 18.7 with pglz.

The catch: the table is 11.3% larger. If disk matters more than speed, set `default_toast_compression = pglz`.

### jit = off by default: it cuts both ways

Image: `s04-jit.png`

JIT itself did not change; the default did. On 22 TPC-H-derived queries (scale factor 10), a short query went from 172 to 108 ms. The longest went from 3,914 to 4,607 ms. Per-query numbers are exploratory.

If you run long analytical queries, check them, and turn JIT back on where it helps.

### REPACK (CONCURRENTLY) is in core

Image: `s05-repack.png`

REPACK (CONCURRENTLY), based on pg_squeeze, is now part of Postgres. Kirk's point: you get it on managed services that do not ship pg_repack.

The catch is the final lock. On a 20,000,000-row table with 16 writer sessions, at 65,996 rows written per second, 30 rows per transaction, it waited 85.7 s for that lock. Plan for it under heavy writes.

### pg_plan_advice: plans on the server, not hints in the app

Image: none (Unit C, the Kirk clip, covers it; embed the post).

pg_plan_advice is new in 19: keep a good plan on the server, with no hints in the application code. Kirk on plan hints: "It was a great idea in 1975, okay? The problem is, we're 2026, baby."

The cost in our test: 11% to 14% less throughput on a trivial query, with advice generated for every query. 11% against the modules off, 14% against them loaded and idle.

### Diff your plans

Image: `s07-plans.png`

Same data, same statistics, planned on 18.7 and on 19 RC2: 83 of 220 stable query templates changed their plan. 61 of them come from one planner commit, a tie-break: a build of 19 without that commit does not change them. Most plan changes are fine. Some are not. Find yours before production does.

### My advice

Do not wait for 19.1. Start testing now, on clones, and give yourself a month or two. Take a clone of production, upgrade it, run your real queries, and compare the plans and the timings.

Which 19 feature do you test first? Tell me in the replies.

All tests are synthetic: setups we built, not rates of real systems. Your numbers will differ. Test your own workload. The methods and the raw numbers are in the study brief.

Watch: https://youtu.be/VcDU-NRE3hI
Listen: https://postgres.fm/episodes/postgres-19
All the numbers, with methods: https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c

---

## Extra number check (Article only)

| Number | Source |
| --- | --- |
| 4 notifiers, 8-vCPU host | `notes/notes.md`, "About the numbers", LISTEN/NOTIFY |
| age 1.65 billion; 120 bloated tables; last of 121 | `notes/notes.md`, autovacuum; `f04-autovac`: `rank` |
| 22 TPC-H-derived queries, scale factor 10; exploratory | `notes/notes.md`, JIT |
| 20,000,000-row table, 16 writer sessions | `notes/notes.md`, REPACK |
| 11% against modules off; 14% against loaded and idle | `f11-advice`: `lossOff`, `lossLoaded`; `notes/notes.md`, plan advice |
| 220 stable templates | `f10-plans`: `total`; `notes/notes.md`, plan changes |

Claims as discussed on air (podcast times, `captions/podcast.transcript.txt`): see the on-air sources list in `x-plan.md`. "19 removed one and requires the other on" is from the v2 post 8 text, checked against `notes/corrections.md`. "Do not wait for .1": Nik, 00:44:35; "a month or two": Nik, 00:50:38.
