# Episode 194 social clips

Two 4:5 videos (1080x1350) for X and LinkedIn, made on 2026-11-05. Both scripts use Python 3 with Pillow and ffmpeg, and macOS fonts (`/System/Library/Fonts/SFNS.ttf`; the animation also uses JetBrains Mono from `~/Library/Fonts/`).

## UUIDv4 vs UUIDv7 animation (blog post)

[`uuid_anim.py`](uuid_anim.py) draws [`uuid-v3.mp4`](uuid-v3.mp4) (15.5 s, 30 fps, no sound) frame by frame: the `gen_random_uuid()` default, then two index grids (UUIDv7: one hot leaf; UUIDv4: inserts all over the index), then the conclusion. It also writes a poster frame.

```bash
python3 uuid_anim.py uuid-v3.mp4 poster-v3.png
```

## Kirk on the B-tree (episode clip)

[`kirk_clip.py`](kirk_clip.py) cuts [`kirk-btree-v2.mp4`](kirk-btree-v2.mp4) (74 s, 25 fps) from the final episode video: final time 18:03.6 to 19:17.6 (`START`, `END` in the script). Kirk's tile at the top, the B-tree card (center overlay) below it, burned-in captions from the YouTube VTT, on the pink show gradient. The tile and card rectangles (`KX0...`, `DX0...`) are in final-video pixels of this episode's layout.

```bash
cd "/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review"
python3 <repo>/episodes/20261027-uuidv4-vs-uuidv7/social/kirk_clip.py 29-final-v9.mp4 30-youtube.en.vtt kirk-btree-v2.mp4
```

For another clip, change `START`, `END`, the texts at the top of the frame and the crop rectangles.
