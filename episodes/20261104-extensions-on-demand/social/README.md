# Episode 195: social posts

[Episode overview](../README.md)

- [`x-thread.md`](x-thread.md): the X thread (first post, replies, links) and the LinkedIn variant, with the number check.
- [`combinations-anim.py`](combinations-anim.py): the 1080x1350 animation "How many Postgres images would you potentially need?" (v3.4). Used as the first-post media and, re-encoded without sound, in the blog post. `python3 combinations-anim.py out.mp4 poster.png`. Needs Pillow, ffmpeg and JetBrains Mono in `~/Library/Fonts`.
- [`alvaro-clip.py`](alvaro-clip.py): the 65 s clip of Álvaro with an episode card synced to his words. It reads files in the Zoom review folder (`27-final-v5.mp4`, `11-podcast.time-map.json`, `10-youtube.en.cues.json`). The generic version, without the card, is [`tools/podcast-edit/social/clip.py`](../../../tools/podcast-edit/social/clip.py).

Rendered media stay in the Zoom review folder (`review/33-social/`). Rules for the next episode: [`tools/podcast-edit/PROMOTION.md`](../../../tools/podcast-edit/PROMOTION.md).
