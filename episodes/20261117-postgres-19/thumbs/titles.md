# Episode 197 (Postgres 19): titles and thumbnails

DRAFT, 2026-11-17. The title promises the answer; the thumbnail asks the question. No channel or episode suffix.

**postgres.fm episode title:** "Postgres 19" (slug `postgres-19`, confirmed).

## YouTube title options

1. **Postgres 19: favorite features and upgrade traps** (48) — pairs with thumbnail A, "POSTGRES 19: UPGRADE NOW?". It says what the episode is: one round of favorites, one round of warnings. Safe, matches the talk.
2. **Postgres 19: what to check before you upgrade** (45) — pairs with thumbnail B, "WHAT BREAKS ON 19?". Problem first. The upgrade part is about 13 of the 58 min (00:44:18 to 00:57:00), so the title promises a bit more than the episode gives on the upgrade.
3. **Postgres 19: 1,000 listeners, NOTIFY 55x faster** (47) — pairs with thumbnail C, "NOTIFY 55x FASTER?". One measured number: 200/s on 18.7 against at least 11,040/s on 19 RC2 (that is at least 55x; 8-vCPU dedicated host, 4 notifiers, median of 3 runs, client-limited). The talk spends about 2 min on it, so the title oversells one topic; the description must carry the conditions.

Recommended: title 1 with thumbnail A.

No A/B test for this episode: Michael takes part, and thumbnail and title experiments run only on episodes without him.

## Thumbnail concepts (1280x720)

All three people in framed tiles, balanced: Nik, Michael, Kirk. Reuse the heads from the recording (pick frames after the edit; Michael's camera may need brightening). Dark background, heavy condensed headline, 2 to 4 words.

- **A:** "POSTGRES 19: UPGRADE NOW?" No date chip, so it reads the same before and after 19.0.
- **B:** "WHAT BREAKS ON 19?" Chip: "pg_upgrade --check said OK". Cover text must not frame anyone's work as a failure; this one points at a tool gap, which upstream discusses openly. Check with Nik.
- **C:** "NOTIFY 55x FASTER?" Chip: "1,000 listeners, 19 RC2". Only with title 3.

Square cover (podcast, 3000x3000): "POSTGRES 19", the three heads, samograph sticker as in 196.

## Cold open (from #197, 15 to 25 s, growth rule)

The draft for Nik's approval, with the transcript excerpts and on-screen text, is in [`../notes/cold-open.md`](../notes/cold-open.md). Summary:

Candidates, recording times:

1. 00:55:23 to 00:56:13, Nik: a query at one call per second hits a 60 s statement_timeout, and on a 96-core machine two calls per second fill the box. Strong, stands alone, about 50 s: needs a trim.
2. 00:20:59 to 00:21:14, Nik: "with one thousand listeners from two hundred per second, we went to eleven thousand per second", with the brief's NOTIFY chart on screen. Short; add the conditions as a chip.
3. 00:28:24 to 00:29:20, Kirk: "Plan hints to me is the 1975 solution ... we're 2026, baby." Funny; trim to about 20 s.

Recommendation: 2 (it has a chart and a number), or 3 if Nik prefers a laugh.
