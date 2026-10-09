#!/usr/bin/env bash
# One-time setup: Python environment + free voice + speech-recognition models.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt
mkdir -p models/kokoro models/asr
if [ ! -f models/kokoro/kokoro-v1.0.onnx ]; then
  echo "Downloading Kokoro voice model (~350 MB)…"
  curl -L -o models/kokoro/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -L -o models/kokoro/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
fi
if [ ! -d models/asr/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8 ]; then
  echo "Downloading speech-recognition model (~480 MB)…"
  curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8.tar.bz2 | tar xj -C models/asr
fi
[ -f .env ] || cp .env.example .env
echo "Setup complete."
