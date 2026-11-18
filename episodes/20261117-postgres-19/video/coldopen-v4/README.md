# Cold open v4 (episode 197): alternative openings

`style-notes.md` has the reference study, the variants, and the license list. Build: `build.sh a|b|c`.

## Announcer intro (v4a, v4c)

A short "Starring..." open in the style of the reference: an announcer introduces each host over that host's own shot, with a big name card.

Script (`intro.json` holds the text and the start time of each line, plus the shots):

> Live from three time zones... it's Postgres F M!
> Starring... Nikolay Sah-mokh-VAH-lov! Michael Kristoffideez! And our guest... Kirk VOH-lak!
> Tonight: Postgres nineteen!

- Voice: ElevenLabs premade stock voice **"Bill", voice id `pqHfZKP75CvOlQylNhV4`**. This is a generic voice, not a clone or imitation of any real announcer. Model `eleven_multilingual_v2`, stability 0.3, similarity 0.8, style 0.7, speaker boost on. `vo.sh` makes the lines (it needs `ELEVENLABS_API_KEY` and never prints it).
- Names are spelled for the ear:
  - Kirk's surname is said "Vo-lak", so the script spells it `VOH-lak`.
  - `Sah-mokh-VAH-lov` puts the stress on VAH.
  - `Kristoffideez` gives kris-TOFF-ih-deez.
  - On screen the names keep their real spelling.
- Whisper (small) hears these lines in the render: "Live from three time zones. It's Postgres FM." / "Starring..." / "Nikolai Samokvahlov" / "Kristoffides" / "And our guest..." / "Kirk Volak" / "Tonight. Postgres 19."
- Name cards (seconds from the start):

  | Name | Card on screen | Name fully readable | Announcer says the name |
  |---|---|---|---|
  | Nik | 5.25-7.95 | 5.70-7.60 | 5.45-7.18 |
  | Michael | 7.95-10.65 | 8.40-10.30 | 8.15-9.76 |
  | Kirk | 11.75-14.45 | 12.20-14.10 | 11.9-12.9 |

  The name fades in and out over 0.35 s; there is no typing, flash or blink on the names.
