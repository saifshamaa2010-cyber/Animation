#!/usr/bin/env bash
# Sound effects placed from the scenes' own timing, then music + final mix.
set -euo pipefail
EP="${1:?usage: npm run audio -- <episode-id>}"
cd "$(dirname "$0")/.."
npx tsx scripts/sfx-events.ts "$EP"
.venv/bin/python -m pipeline.audio.build "$EP"
