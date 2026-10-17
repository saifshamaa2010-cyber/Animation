"""Chatterbox speech worker. Runs in .venv-tts (it needs torch), started by the Chatterbox provider.

Reads one JSON request per line on stdin: {"text": ..., "out": "/path.wav", "seed": 123}
and answers one JSON line on stdout when the file is written: {"ok": true} (or {"ok": false, "error": ...}).
The model is loaded once, so a whole episode is narrated without reloading it.
"""
import json
import os
import sys

proto = sys.stdout
sys.stdout = sys.stderr  # anything the model prints goes to the log, never into the protocol

import soundfile as sf  # noqa: E402
import torch  # noqa: E402

torch.set_num_threads(int(os.environ.get("CHATTERBOX_THREADS") or os.cpu_count() or 4))
from chatterbox.tts import ChatterboxTTS  # noqa: E402

model = ChatterboxTTS.from_pretrained(device="cpu")
ref = os.environ.get("CHATTERBOX_REF") or None
kw = {
    "exaggeration": float(os.environ.get("CHATTERBOX_EXAGGERATION", "0.45")),
    "cfg_weight": float(os.environ.get("CHATTERBOX_CFG", "0.4")),
    "temperature": float(os.environ.get("CHATTERBOX_TEMPERATURE", "0.7")),
}
if ref:
    kw["audio_prompt_path"] = ref
print(json.dumps({"ready": True, "sr": model.sr}), file=proto, flush=True)

for line in sys.stdin:
    if not line.strip():
        continue
    req = json.loads(line)
    try:
        torch.manual_seed(int(req.get("seed", 0)))
        wav = model.generate(req["text"], **kw).squeeze(0).numpy()
        sf.write(req["out"], wav, model.sr)
        print(json.dumps({"ok": True}), file=proto, flush=True)
    except Exception as e:  # report and keep serving
        print(json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}), file=proto, flush=True)
