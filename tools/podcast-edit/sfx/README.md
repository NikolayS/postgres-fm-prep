# Overlay sound library

Sounds for on-screen overlay cards, agreed with the host on 2026-10-30
(Postgres.FM UUIDv4 vs UUIDv7 episode). `sfx-manifest.ts` applies the
convention below to an overlay manifest; `compose.ts` mixes the result.

- `G10-soft-start-quick-stop.wav`: center card IN, 0.05 s after the card
  starts.
- `G9-wider-band.wav`: center card OUT, about -3 dB, 0.1 s before the
  card's exit starts (measured from its alpha).
- `L-punch-rough.wav`: accent, only for a sudden, short reveal inside a
  card (a number or a bar that jumps in).
- `K-sand-stroke-falling.wav`: alternative accent, a softer falling stroke.
- `U2-typing-fast.wav`: band-card typing, one sound per typed line, trimmed
  to that line's typing time.

## Convention

- Band cards (lower third) use the typing render `<card>-typing.mov` and
  get one typing sound per typed line, from the line's first keystroke,
  trimmed to the line's typing length. No whoosh, air or wind.
- Center cards get IN and OUT; nothing else unless something in the card
  lands suddenly (accent, at most one or two per card).
- Nothing bright: no energy to speak of above ~4.5 kHz (the sand strokes are
  lowpassed at 4.5 kHz, the punch at 1.8 kHz). No clicks or ticks.
- Nothing sub-only: phones play nothing under ~150 Hz, so a pure sub thump
  is silent there and boomy on headphones. The punch carries a 200-600 Hz
  knock for that reason.
- Ceiling about -15 LUFS momentary for any SFX; keep them under the voice.
  `compose.ts` sets each sound's loudest 400 ms to `--sfx-lufs` (default
  -20) plus its `--sfx-rel` offset, so pass the OUT offset by name:
  `--sfx-rel center-out=-3` (`sfx-manifest.ts` copies the files into the
  episode under these role names).

## Sources and licences

- G9, G10, K, L: synthesized for Postgres.FM with numpy/scipy (granular
  sand noise in a moving band; the punch is a 160 -> 48 Hz pitch drop plus
  a 200-600 Hz knock). Owned by PostgresAI; free to use without
  attribution. `generate.py` re-synthesizes them from the recorded
  parameters (`python3 sfx/generate.py [outdir]`). It is a reconstruction,
  not byte-identical: band, sweep direction and envelope match (envelope
  correlation 0.95-0.97, spectral centroid within ~10%), the noise draws
  differ and its files are 3-5 dB lower in RMS at the same peak (spikier
  grains). That does not matter in the mix, which levels by loudness, but
  ship the wavs here, not regenerated ones.
- U2: a 3 s excerpt of "Typing fast.ogg" by stephan, Wikimedia Commons,
  public domain:
  https://commons.wikimedia.org/wiki/File:Typing_fast.ogg (downloaded
  2026-10-30). No attribution required.
