#!/usr/bin/env bash
# Announcer lines for the v4 intro: ElevenLabs text to speech, one MP3 per line of intro.json.
# Voice: "Bill" (pqHfZKP75CvOlQylNhV4), an ElevenLabs premade stock voice, not a clone of anyone.
# Names are spelled for the ear: Sah-mokh-VAH-lov, Kristoffideez (kris-TOFF-ih-deez), VOH-lak (Kirk's
# surname is said "Vo-lak"). Check each line with whisper after a change.
# Usage: ELEVENLABS_API_KEY=... bash vo.sh <outdir>      (the key is never printed)
set -euo pipefail
H="$(cd "$(dirname "$0")" && pwd)"; OUT=$1; mkdir -p "$OUT"; : "${ELEVENLABS_API_KEY:?}"
VOICE=pqHfZKP75CvOlQylNhV4
bun -e 'for (const v of (await Bun.file(process.argv[1]).json()).vo) console.log(v.line + "\t" + v.text)' "$H/intro.json" |
while IFS=$'\t' read -r n t; do
  body=$(bun -e 'console.log(JSON.stringify({ text: process.argv[1], model_id: "eleven_multilingual_v2",
    voice_settings: { stability: 0.3, similarity_boost: 0.8, style: 0.7, use_speaker_boost: true } }))' "$t")
  code=$(curl -s -o "$OUT/vo-$n.mp3" -w "%{http_code}" "https://api.elevenlabs.io/v1/text-to-speech/$VOICE?output_format=mp3_44100_192" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" -H "content-type: application/json" -d "$body")
  echo "vo-$n $code"; [ "$code" = 200 ]
done
