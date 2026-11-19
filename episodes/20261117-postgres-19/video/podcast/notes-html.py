import html
YT="https://youtu.be/VcDU-NRE3hI"
A=lambda u: f'<a href="{html.escape(u)}">{html.escape(u)}</a>'
groups=[
 ("Main link",[("20:40","Postgres 19 for people who run it: PostgreSQL 19 RC2 vs 18.7 (DBLab Forge study brief, PostgresAI)","https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c")]),
 ("The release",[("01:55","PostgreSQL 19 release notes","https://www.postgresql.org/docs/19/release-19.html"),
   ("05:19","What LLMs do to PostgreSQL and DBAs (depesz, 2026-11-09)","https://www.depesz.com/2026/11/09/what-llms-do-to-postgresql-and-dbas/"),
   ("07:54","scary patch contest (Robert Haas, pgsql-hackers, 2026-08-25)","https://www.postgresql.org/message-id/CA%2BTgmob9NY6m0YNFTQ4nFH2d0iC9SQRruDYxfndGKKzh8OC80w%40mail.gmail.com"),
   ("08:08","Are we reverting patches because of bugs found by AI? (Tomas Vondra, 2026-10-01)","https://vondra.me/posts/are-we-reverting-patches-because-of-bugs-found-by-ai/"),
   ("08:22","pgroast, an adversarial reviewer for Postgres proposals","https://github.com/NikolayS/pgroast")]),
 ("Episodes we referred to",[("10:03","pg_squeeze, with Antonin Houska","https://postgres.fm/episodes/pg_squeeze"),
   ("16:58","The hidden costs of CREATE TEMP TABLE (last week)","https://postgres.fm/episodes/the-hidden-costs-of-create-temp-table"),
   ("17:21","DBOS, on LISTEN/NOTIFY at scale (its notes link the Recall.ai post)","https://postgres.fm/episodes/dbos"),
   ("36:53","Dump/restore done. Now what? (episode 193)","https://postgres.fm/episodes/dump-restore-done-now-what")]),
 ("REPACK",[("09:56","Add CONCURRENTLY option to REPACK (commit, Antonin Houska; based on pg_squeeze)","https://github.com/postgres/postgres/commit/28d534e2ae0ac888b5460f977a10cd9bb017ef98"),
   ("13:37","What REPACK (CONCURRENTLY) costs while it runs (Radim Marek, boringSQL, 2026-09-28)","https://boringsql.com/posts/repack-concurrently-costs/")]),
 ("LISTEN/NOTIFY and autovacuum",[("17:31","Optimize LISTEN/NOTIFY via shared channel map and direct advancement (commit, Joel Jacobson)","https://github.com/postgres/postgres/commit/282b1cde9dedf456ecf02eb27caf086023a7bb71"),
   ("19:51","Add rudimentary table prioritization to autovacuum (commit, Nathan Bossart)","https://github.com/postgres/postgres/commit/d7965d65fc5bb2139bc51c051c11428414c65160")]),
 ("Plan advice",[("22:13","Waiting for Postgres 19: Better Planner Hints with Path Generation Strategies (Lukas Fittl, 5mins of Postgres)","https://pganalyze.com/blog/5mins-postgres-19-better-planner-hints")]),
 ("Other features",[("27:52","jit: Change the default to off (commit, Jelte Fennema-Nio)","https://github.com/postgres/postgres/commit/7f8c88c2b872cb74882ab93dcb05529dab2a10bc"),
   ("30:16","WAIT FOR (docs)","https://www.postgresql.org/docs/19/sql-wait.html"),
   ("35:40","instrumentation: Use Time-Stamp Counter on x86-64 to lower overhead (commit, Lukas Fittl, Andres Freund, David Geier)","https://github.com/postgres/postgres/commit/294520c44487ecaade7a6ea8781b973f9ed03909")]),
 ("Upgrade",[("40:58","pg_upgrade --check passes, then the upgrade fails (shihao zhong, pgsql-hackers, 2026-10-24)","https://www.postgresql.org/message-id/CAGRkXqT%2B5%2BmQhoKZFTiM4yOZtVV%3DNW506vDwFtVeG%2BVmL_W5wQ%40mail.gmail.com"),
   ("47:53","RegreSQL, catch query performance regressions (Radim Marek)","https://github.com/boringSQL/regresql")]),
]
numbers=[
 "CVEs per release: "+A("https://www.postgresql.org/support/security/")+" (snapshot 2026-11-18, 229 CVEs), grouped by release day from 2019 to 18.7; releases without a CVE count as 0. 18.7 fixed 52 and 18.6 fixed 28; 2019-2025 releases fixed 1.5 on average (median 1).",
 "Release credits: names in the release-notes acknowledgments of 12 to 19; commits in each development cycle (PostgreSQL git, data of 2026-11-11).",
 "REPACK (CONCURRENTLY): 19.0, 16 dedicated vCPU, 20,000,000-row table, 16 writer sessions; median of 3 runs per point (2 valid runs at the first point).",
 "LISTEN/NOTIFY: 1,000 listeners on their own channels, 4 notifiers, 8-vCPU dedicated host, median of 3 trials; our client was the limit, so 19 can go higher.",
 "Autovacuum order: one old table (age 1.65 billion) among 120 bloated tables, 16-vCPU dedicated host, median of 3 trials.",
 "Plan advice: advice generated for every query (always_store_advice_details), trivial query, small shared test host, 4 clients, 20 s, 2 trials; 11% against the modules off, 14% against them loaded and idle.",
 "JIT: 22 TPC-H-derived queries, scale factor 10, 32-vCPU dedicated host, 3 trials; per-query numbers are exploratory. JIT itself did not change; the default did.",
 "lz4 TOAST: insert of 200,000 jsonb documents of 16 KiB, 8-vCPU dedicated host, 3 trials. The table is 11.3% larger with lz4; if disk matters more, set default_toast_compression = pglz.",
 "Plan changes: 4,273 benchmark queries (263 templates; 220 stable on 18.7) planned on 18.7 and 19 RC2 with the same data and statistics; 61 of the 83 changed templates come from one planner commit (a tie-break), shown by a build without it.",
]
checks=[
 ("00:21:29","Parallel autovacuum is off by default: set autovacuum_max_parallel_workers. Autovacuum prioritization needs no change."),
 ("00:27:12","Our test measured 11% to 14% lower throughput with advice generated for every query, on a trivial query (small shared test host, 2 trials)."),
 ("00:35:41","The lower timing overhead uses the CPU time-stamp counter on x86-64."),
 ("00:38:18","Extended statistics in pg_dump are in the release notes (\"Allow pg_dump to include restorable extended statistics\"), and pg_restore restores them; dump with pg_dump --statistics."),
 ("00:40:40","Correction: the removed settings cannot be set on a table. The upgrade trap is escape_string_warning, or standard_conforming_strings = off, set on a role, a database or a function: pg_upgrade --check passes, then the upgrade fails."),
]
e=html.escape
tip='<div><strong>Tip: watch on YouTube. Since episode 193, the video shows charts and illustrations as we talk.</strong>'+(' '+A(YT) if YT else '')+'</div><div>&nbsp;</div>'
intro=('<div>Michael, Nik, and Kirk discuss Postgres 19: why the release came in November and not in September, the features we like most, and what to check before you upgrade. We cover REPACK (CONCURRENTLY), LISTEN/NOTIFY with many listeners, autovacuum prioritization, plan advice, WAIT FOR LSN, new defaults, and how to test an upgrade now that AI makes testing cheaper.'
       '<br>&nbsp;<br>Here are some links to things we mentioned:&nbsp;<br>Times are podcast times of the first mention.</div>')
body=''
for g,items in groups:
    body+=f'<div><br><strong>{e(g)}</strong></div><ul>'+''.join(f'<li>[00:{t}] {e(l)} {A(u)}</li>' for t,l,u in items)+'</ul>'
body+='<div><br><strong>About the numbers on screen</strong><br>They come from the study brief above. Most are synthetic tests of setups we built; they are not failure or speed rates of real systems. All are for 19 RC2, not 19.0.</div><ul>'+''.join(f'<li>{x}</li>' for x in numbers)+'</ul>'
body+='<div><br><strong>Notes (checked against the Postgres 19 RC2 source after recording)</strong></div><ul>'+''.join(f'<li>[{t}] {e(x)}</li>' for t,x in checks)+'</ul>'
tail=('<div><br></div><div>~~~<br><br>What did you like or not like? What should we discuss next time? Let us know via a YouTube comment, on <a href="https://postgres.fm/people">social media,</a> or by commenting on <a href="https://docs.google.com/document/d/1PNGSn_d0A7gTR4C0p6geQyHOTgdpitKCRvafCNnT-44/edit#heading=h.v4ncheatetql">our Google doc</a>!</div>'
      '<div><br>~~~<br><br>Postgres FM is produced by:</div><ul><li>Michael Christofides, founder of <a href="https://pgmustard.com/">pgMustard</a></li><li>Nikolay Samokhvalov, founder of <a href="https://postgres.ai/">PostgresAI</a></li><li>Kirk Wolak, Software Architect at <a href="https://www.kirasoft.com/">KiraSoft</a></li></ul>'
      '<div><br></div><div>With credit to:</div><ul><li>Jessie Draws for the elephant artwork</li><li>Intro and outro music: our own arrangement of Apple Loops from GarageBand (royalty-free under the GarageBand licence)</li></ul>')
open('notes.transistor.html','w').write(tip+intro+body+tail)
import re; h=tip+intro+body+tail; urls=set(re.findall(r'href="([^"]+)"',h)); print(len(h),'chars;',len(urls),'distinct hrefs')
