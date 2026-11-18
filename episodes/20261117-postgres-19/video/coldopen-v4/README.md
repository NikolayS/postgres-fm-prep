# Cold open (episode 197): the v6 cold open and its alternatives

**v6 is the cold open of the final episode:** `build.sh b` writes `preview/cold-open-v6.mp4`. It has no voice (Nik's call). Nik, Michael and Kirk run the show together as three equal co-hosts, so all three name cards say "STARRING".

`style-notes.md` has the reference study, the variants and the license list.

v6 timeline (seconds; the shots are in `intro.json`):

| Shot | On screen |
|---|---|
| "LIVE FROM THREE TIME ZONES", then the postgres.fm wordmark | 0-4.35 |
| Giant "STARRING" | 4.35-5.25 |
| Nik's card | 5.25-7.95 (name fully readable 5.70-7.60) |
| Michael's card | 7.95-10.65 (name fully readable 8.40-10.30) |
| Kirk's card | 10.65-13.35 (name fully readable 11.10-13.00) |
| "postgres.fm Postgres 19" | 13.35-16.7 |
| Four-bite montage, then the button | 16.7-38.9 |

## Announcer voice (variants a and c only; not in v6)

A short "Starring..." open in the style of the reference: an announcer introduces each host over that host's own shot, with a big name card.

Script (`intro.json` holds the text and the start time of each line, plus the shots):

> Live from three time zones... it's Postgres F M!
> Starring... Nikolay Sah-mokh-VAH-lov! Michael Kristoffideez! And... Kirk VOH-lak!
> Tonight: Postgres nineteen!

- Voice: ElevenLabs premade stock voice **"Bill", voice id `pqHfZKP75CvOlQylNhV4`**. This is a generic voice, not a clone or imitation of any real announcer. Model `eleven_multilingual_v2`, stability 0.3, similarity 0.8, style 0.7, speaker boost on. `vo.sh` makes the lines (it needs `ELEVENLABS_API_KEY` and never prints it).
- Names are spelled for the ear:
  - Kirk's surname is said "Vo-lak", so the script spells it `VOH-lak`.
  - `Sah-mokh-VAH-lov` puts the stress on VAH.
  - `Kristoffideez` gives kris-TOFF-ih-deez.
  - On screen the names keep their real spelling.
- Whisper (small) heard the earlier take (before the Kirk line changed) as "Starring Nikolai Samok Vahlov, Michael Christofides, ... Kirk Volak. Tonight, Postgres 19." Rerun `vo.sh` and check with whisper before you build a or c again.
