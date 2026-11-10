# Promotion: blog post, X and LinkedIn

What we learned from episodes 193-195 (October-November 2026). The host posts and merges; the agent drafts. Nothing goes out without the host's OK.

Order: the YouTube Premiere and the postgres.fm page first, then the X thread and LinkedIn post (same day), then the blog post (a few days later; it reuses the social media).

## X thread

- **First post: no link.** X shows posts with links to fewer people. Links go in the last reply.
- Open with concrete measured numbers, in the first line. Example (episode 195): "pgvector as its own container image: 0.31 MiB. A fat Postgres image with 18 extensions: 253 MiB."
- One media item per post. The first post gets the strongest one: an animation or a speaker clip.
- Tag the guests and co-hosts by handle (the memory file `x-handles` has them; ask when unsure, never guess). Say "Out now" once the Premiere has started.
- Replies: one idea and one media item each. The last reply has the links: video, postgres.fm page, the brief, the guest's product.
- X counts each link as 23 characters. Keep every post under 280.
- Name only the guest's product and ours. Describe other products generically ("a Kubernetes operator"), in posts and in the animations. Episode 195: the host asked to remove the operator's name from the animation and the restart chart.
- LinkedIn: a longer version of the first post; the links go in the first comment.
- Keep the thread file in the episode folder (`social/x-thread.md`), with a number check that cites the source of each number.

## Animations (1080x1350)

Frames drawn with Pillow and piped to ffmpeg; see episode 195 `social/combinations-anim.py`.

- **Readable.** Every text screen stays on screen at least 1 s + 1 s per 3 words once it is fully visible. Episode 195 v1 failed this ("disappearing too fast, I cannot read"). Make a contact sheet of stills and check it before sending.
- **Show scale with something people feel.** 2^220 sets compared with the atoms in the Earth worked. A progress bar that sits at 0% looks like a stuck preloader: do not use it, even with labels.
- **Be fair.** Give the other side its best case first ("one fat image is simple"), then show why it fails (size, CVEs, restarts).
- **Precise words.** "How many images would you *potentially* need?", not "need".
- Linear scales from 0. No one-sided accent borders. No emojis. B-tree drawings show a wide fan-out, never two children.
- When the point is a mechanism (a B-tree page split), the picture must show the mechanism, not only the speaker talking about it.
- Make a poster PNG (the first readable frame). The blog post uses it.

## Speaker clips (social/clip.py)

- `tools/podcast-edit/social/clip.py`: one speaker's tile from the original recording, burned captions, an end card with the show URL. Use `find.ts` for the in and out points.
- Start on the first word of a sentence and after any layout change. No sip, hand or "um" in the first second (episode 194: "my sip and Kirk's hand, why?"). Check `<out>.check.png`.
- End on "Postgres.FM / postgres.fm", not on a product logo or a frozen last frame.
- 30-75 s, one idea. Sound on, captions for people who watch muted.

## Blog post (postgres-ai/docs)

The docs repository is under SOC2: the post goes in a draft MR with a linked work item. Look at the last two posts in `blog/` first and match their parts.

**Parts, in order:**
1. **Title:** plain words that say what the reader gets. "Extensions on demand for Postgres in containers" worked; a clever title confused the host.
2. **Description:** one or two sentences with the main measured result.
3. **Intro, then `<!--truncate-->`, then the TL;DR** (`TldrTabs`: founders, developers, dbas, managers, 3 points each; set `defaultTab`).
4. **The episode video** (YouTube nocookie iframe) near the top.
5. **The story with numbers:** `StatRow` for 3-4 key numbers, `BlogFigure` for charts. Reuse the episode cards and the social animation (`<video controls muted playsInline preload="metadata" poster=...>`, MP4 H.264 CRF 26, `-movflags +faststart`, no audio track, about 2 MB). The host noticed when the animations were missing.
6. **How it works:** the mechanism, the numbers measured, and why it was hard to build. A guest product needs this section in depth, with numbers. A short paragraph that ends the story is not enough (episode 195: "and then we quickly end? that's not ok").
7. **So which way?:** practical advice on when to use each option.
8. **Limits:** versions, test conditions, what we did not test.
9. **Links and thanks** to the guest and co-hosts.

**Language:**
- First person (Nik), lively, for a generic engineer.
- About 70-80% ASD-STE100, not 100%. When every sentence is short, the text reads choppy (reviewer feedback). Explanations and reasoning can use longer sentences.
- Define every term at first use: "fat image", "switchover", "longest write outage", "manifest", "digest". Write out internal shorthand ("PostgreSQL apt repository", not "PGDG").
- Link our products to their product pages (DBLab Forge: the Forge product page). Write full URLs.

**Do not:**
- Ask readers to comment. The blog has no comments.
- Add a figure that needs a paragraph to explain it. Episode 195's Big Bang progress bar: "not worth a picture; confusing".
- Describe on a public page the mistakes that internal review caught.

**Checks before review:** the longread lint (`~/github/skills/skills/longread/scripts/longread_lint.py`, STE share 70-80%), cspell (add new words to `cspell.json`), CI green, and the review app. The page is an SPA: use headless Chrome `--dump-dom`, because curl returns only the shell.

## Video details the host asked for (episodes 194-195)

- **Posts are shown as screenshots, never as re-typed quote cards.** This applies to X, LinkedIn, Hacker News, Reddit, mailing lists (pgsql-hackers), GitHub issues, blog posts and docs. Viewers recognize the platform's UI at once, and a screenshot shows the quote is real. Episode 195 first had a typed quote card for Mitchell Hashimoto's post; the host asked for the screenshot.
  - Take it logged out, light theme, at 2x, from the author line to the date. For X, use the official embed (`https://platform.twitter.com/embed/Tweet.html?id=<id>&theme=light`) in headless Chrome. Crop off counters and ads, but keep the platform's look.
  - Mark the key words with a red underline (#E5322D), drawn when the speaker says them. No highlight boxes.
  - Print the full URL under the screenshot, in small grey mono.
  - The same rule applies to the blog post and social posts: show the original post as a screenshot with a link.
- Faces: when the host asks for smaller faces, zoom out (take a bigger crop of the tile), do not only scale down.
- Two companies are never on one frame. Episode 195 outro: frame 1 "In this episode:" with the guest's company; a cut; frame 2 "Prepared by:" with PostgresAI. The kickers use a clean monospace (JetBrains Mono), not a generic AI-looking font.
- Do not say a name in the voice-over that the graphic already shows.
- Tease an absent co-host as a friendly joke, never as an attack.
- Cut on-air remarks about how someone looks, and the remark that it will be cut.
- Blur private things in camera backgrounds (a family photo on the wall) until the speaker moves the camera (`splice.ts --vf ... --at x:y`).
- When the episode has no experiment results, do not reuse the Forge outro. Make an outro about what the episode covered.
