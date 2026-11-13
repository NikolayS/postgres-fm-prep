# psql transcript behind 24-select-t1

`psql18-session.txt` is a real interactive psql session on PostgreSQL 18.6 (docker image `postgres:18`, 2026-11-11), driven through a pty: table `t1 (id int, name text, status text)` with rows (1, Nik, on air), (2, Kirk, on air), (3, Michael, vacation), then the five statements of the card. `psql18-session.raw.txt` is the same capture with the terminal's bracketed-paste control codes (`ESC[?2004h/l`) still in it. The card (`src/Ep196v2.tsx`, `Psql196`) renders `src/psql18.json`, parsed from this transcript; no output line is typed by hand.
