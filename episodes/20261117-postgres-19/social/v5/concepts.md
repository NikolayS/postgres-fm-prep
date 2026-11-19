# Episode 197 (Postgres 19): X post for release day, v5 concepts

DRAFT, 2026-11-19 (Thu), about 2 PM PT. Nothing is posted. One post today.

What we must beat: Alex Shaplov's release post (155 likes at 17:39 UTC, still rising; https://x.com/alxshp/status/2123471112352989479). It is a list of 5 features with check marks, "Postgres isn't slowing down. It's taking over.", a video, and a quote of his own post. Pure cheer, no facts behind it.

What got likes for Nik (last 30 posts, `scratchpad/x-diagnosis/table.md`): 194 (dump/restore, "Your database is not ready yet", one surprise with numbers) and 170 (queue, "dead-tuple factory", video). Both have a hook in line 1, a turn in line 2, and a personal voice. Short posts with no media and no turn get 5 to 25 likes, "GTA6 can wait -- PG19 released" included (21 likes, today).

So we do not try to out-cheer Alex. We give the one thing his post cannot have: a person who runs Postgres, with an opinion, a laugh, or a confession.

Rules kept: first person; no emojis; no hashtags; no gloating about reverts or other people's work; Kirk Wolak is a co-host, no handle; Michael is @michristofides; no speed multipliers; only what is true and was said in the episode or can be checked. Episode link goes in a self-reply 2 minutes later: https://youtu.be/VcDU-NRE3hI

Media under `preview/` is git-ignored (local files only).

---

## 1. Consulting bread (humor, self-mocking)

```text
Postgres 19 just took some of my consulting income.

For years, almost every health check I did ended with "turn on log_lock_waits".

In 19 it is on by default.

Good. Fewer surprises at 3 AM for everyone. I will find something else to complain about.
```

- Media: none, or a 1080x1350 still (new, 10 min): one line of `postgresql.conf` on a dark card, `#log_lock_waits = off` struck through, below it `log_lock_waits = on   # default in Postgres 19`. Better as text only plus a 4-second clip of Nik saying the line (source 2048.31-2058.07 s, cut the "uh"; about 8 s).
- Emotion: a laugh, then warmth. People like an expert who jokes about himself.
- Why it beats Alex: it is about the speaker, not a list. DBAs recognize "turn on log_lock_waits" from their own work, so they reply with their own default. Easy to repost.
- Risk: small feature; people who do not run Postgres do not get it. "Almost every health check" is a soft claim: Nik must agree it is true for him. The commit is Laurenz Albe's (https://github.com/postgres/postgres/commit/2aac62be8cbb870ccf8c5b3fbb8a4e4aa8a14a73); a thank-you to him in the self-reply is good.

## 2. "It's 2026, baby" (clip with a personality)

```text
Kirk Wolak on query hints in Postgres 19:

"It was a great idea in 1975. The problem is, it's 2026, baby."

Hints were on the Postgres "we do not want" list for decades. 19 ships pg_plan_advice. Not hints. Kind of.
```

- Media: `preview/social-v4/xc-kirk.mp4` (18 s, Kirk in the Starfleet shirt, burned-in captions). Poster `xc-kirk.poster.png`.
- Emotion: a laugh at a big character, then "wait, Postgres has hints now?".
- Why it beats Alex: native video with a face and a line people quote. The shirt plus "2026, baby" stops the scroll. The last line is a real tension in the community that invites replies.
- Risk: "not hints, kind of" pulls in pedants (good for replies). The wiki wording: the page is "Not Worth Doing", section "Features We Do Not Want" (https://wiki.postgresql.org/wiki/Not_Worth_Doing#Features_We_Do_Not_Want); "decades" is Kirk's word on air. Kirk has no account, so he cannot amplify.

## 3. Changed my upgrade advice (strong personal opinion)

```text
For years my advice for a new Postgres major was: wait for .1 or .2.

For Postgres 19 I change it: don't wait.

Start testing today, on a clone of production. AI made testing cheap. Waiting is now the expensive part.

Then upgrade when your own tests say yes, not when the calendar does.
```

- Media: 6 s clip of Nik saying it (podcast 00:44:35, "My recommendation usually was to wait until the .1, .2 version, but now I think the better recommendation is: don't wait."). New cut from the episode video, captions like `xc-kirk.mp4`, 20 min.
- Emotion: surprise ("an expert reverses himself"), then agreement or a fight.
- Why it beats Alex: a reversal is the strongest hook on X. It is advice people can act on today, and it splits the audience, so replies come in.
- Risk: some read "don't wait" as "upgrade now". The text says test now, upgrade later; keep that line. Possible "AI shill" replies; answer with the upgrade trap from v4 B as proof of why testing matters.

## 4. Three co-hosts, three favorites (personality + question)

```text
Postgres 19 is out. We recorded the episode two days ago and each of us picked a favorite.

Kirk Wolak: LISTEN/NOTIFY with many listeners. He runs it in production.
@michristofides: plan advice. "A no-go area for years."
Me: REPACK (CONCURRENTLY). pg_squeeze, in core, after years of waiting.

What do you turn on first?
```

- Media: new 1080x1350 still (20 min): three face panels from the cold-open freeze frames (`video/coldopen-v9` README lists the JPEGs), name and favorite under each head, nothing on faces.
- Emotion: belonging. People like to vote.
- Why it beats Alex: it ends with a question that everybody can answer in one word, and the reply count drives reach. Faces beat check marks.
- Risk: the question can get few replies if the first hour is slow; Nik must answer each one. Michael's quote is exact (podcast 00:22:05).

## 5. The cold open (joy, energy)

```text
Postgres 19 is out.

We recorded the episode two days ago. 45 seconds of it:
```

- Media: `preview/cold-open-final.mp4` (the montage: GTA VI and GTA 19, revert fest, "years / decades", Christmas gift, DDL and Postgres 20).
- Emotion: fun, the "three friends laughing" feeling.
- Why it could beat Alex: same format as Alex (celebration plus video), but with real people and real jokes.
- Risk: "revert fest" and the CVE count are in the montage; that is close to the "no gloating about reverts" rule. 45 s is long for X autoplay; most people watch 3 s. Low text means nothing to quote. Check the montage before you use it.

## 6. 645 names (pride, gratitude)

```text
645 people are credited in the Postgres 19 release notes.

Postgres 12: 410.
Postgres 18: 507.

No company owns it. 645 people built it. Thank you, all of you.
```

- Media: new bar chart, 1080x1350, linear scale (from `cards/f01-numbers.card.json`: 12: 410, 13: 380, 14: 415, 15: 411, 16: 361, 17: 463, 18: 507, 19: 645), 19 in orange. 15 min.
- Emotion: pride, "I am part of this".
- Why it beats Alex: it is the warmest number of the day and anyone in the release notes reposts it. It celebrates people, not Nik.
- Risk: some of the growth came from AI-found bug reports (said on air); someone will say so. Do not argue; agree. The count is ours (names in the acknowledgments), so say "credited in the release notes", as above.

## 7. JIT off (hot take)

```text
JIT is off by default in Postgres 19.

It should have been off from the very beginning.

The lesson is not about JIT. A default needs a benchmark as good as the feature. With AI, we can afford those benchmarks now. Next on my list: track_planning in pg_stat_statements.
```

- Media: none, or the JIT card `preview/social-v4/s04-jit.png`.
- Emotion: agreement from people who were bitten; anger from others.
- Why it could win: a hot take gets quote-posts.
- Risk: high. It reads as a dig at the people who built JIT and set the default. It breaks the spirit of "no gloating about other people's work" on release day. Keep for another day, or not at all.

## 8. Hints history (nostalgia, "times change")

```text
For decades, query hints were on the Postgres wiki's list of "Features We Do Not Want".

Today Postgres 19 ships pg_plan_advice in contrib.

The list is still there. So is the need. 19 is the first release that meets them halfway.
```

- Media: screenshot of the wiki section (https://wiki.postgresql.org/wiki/Not_Worth_Doing#Features_We_Do_Not_Want), next to the first lines of the pg_plan_advice docs (https://www.postgresql.org/docs/19/pgplanadvice.html). 15 min.
- Emotion: history, a small "finally".
- Why it could win: old-timers repost history. Concept 2 does the same with more personality.
- Risk: "first release that meets them halfway" is an opinion (keep it as one). The text "pg_plan_advice is not hints" will come in replies.

## 9. GTA vs Postgres (meme visual)

```text
November 19, 2026. The whole world waited for one release.

Michael asked the real question on our podcast: at the GTA release cadence, when would GTA 19 come out? "A couple of hundred years?"

Postgres did 19 majors on time. Well, almost on time.
```

- Media: new 2-panel still (20 min, our own art, no game art or logos): left "GTA VI, Nov 19" in plain type, right a Postgres 19 terminal `select version();`. Or the GTA part of the cold open (source 147.86-168.96 s, about 6 s).
- Emotion: humor.
- Why it could win: the GTA joke is everywhere today.
- Risk: Nik already used it today (21 likes); a second GTA post looks like a repeat. Game art must not be used. "Postgres did 19 majors" is loose (version numbers changed scheme at 10); keep it vague or drop.

## 10. One-liner

```text
Postgres 19 is out. My favorite feature is the one that deletes a tool from my checklist: pg_squeeze is now REPACK (CONCURRENTLY), in core.
```

- Media: none.
- Emotion: a small nod.
- Why it could win: short posts are easy to like.
- Risk: Nik's short posts get 5 to 25 likes. It will not beat 155. It is here as a floor.

---

## Ranking (honest)

Likes are predictions from Nik's last 30 posts, with today's release-day attention as a bonus. Every one needs the first-hour checklist from `../v4/x-plan.md` (reply to everybody, ask Michael and @PostgresFM to repost).

1. **#3, Changed my upgrade advice + Nik clip: 90 to 250 likes.** A reversal by a known expert, advice to act on today, a split audience. Closest in shape to the 194 and 170 posts (hook, turn, voice). The 6 s clip has to be cut now (20 min).
2. **#2, Kirk "2026, baby" clip: 70 to 200 likes.** The media is ready, the line is quotable, the shirt stops the scroll. Lower floor than #3 because the topic (hints) is narrower and Kirk cannot repost.
3. **#1, Consulting bread: 50 to 180 likes.** The most likable, the least risky, zero production. Ceiling limited by a small feature.

Why not the others: #4 and #6 are good but depend on the first-hour replies and reposts; #5 sits close to the reverts rule; #7 breaks the no-gloating spirit; #9 repeats this morning's post; #10 is a floor.

If only 5 minutes are left: post #2 (media ready). If 20 minutes: post #3.
