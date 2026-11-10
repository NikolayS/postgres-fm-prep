# Episode 195 (Extensions on demand): titles and thumbnails

The title promises the answer; the thumbnail asks the question. No channel or episode suffix.

1. **pgvector as a 0.31 MiB layer, not a 253 MiB image** (49) — pairs with thumbnail A, "FAT IMAGE or LAYERS?". The thumbnail asks which; the title answers with the measured sizes (CloudNativePG pgvector extension image 0.31 MiB vs fat image of official postgres:18.6 plus 18 extensions, 253.18 MiB compressed).
2. **Any extension mix, one image composed on pull** (45) — pairs with thumbnail B, "2^220 IMAGES?". The thumbnail poses the impossible combinatorics (220 extensions); the title says how StackGres Containers answers it: the registry composes the image from shared layers on request.
3. **Add an extension: 6 s switchover, not 192 s** (43) — pairs with thumbnail C, "ADD AN EXTENSION, RESTART?". Every image change on CloudNativePG is a rolling restart; the title gives the measured longest write outage (switchover 6.4 s vs restart with persistent clients 192.1 s, CNPG 1.27.4, medians of 5 runs).

Recommended: thumbnail A + title 1 as the main pair; A/B test titles 1-3 (or A vs B thumbnails) after the Premiere.

Faces (recording video1638846836.mp4, Zoom tiles): Nik 00:41:18.7, Álvaro 00:11:35.0, Kirk 00:47:48.5.
