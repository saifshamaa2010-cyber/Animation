"""Swappable text-to-speech providers.

Pick one with TTS_PROVIDER in .env. Every provider returns (mono float32 samples, sample_rate).
Results are cached in .cache/tts/ (keyed by provider + voice + text), so re-running the pipeline
never pays twice for the same sentence.

Only Kokoro has been run in the build sandbox (paid APIs are blocked there). The paid providers are
written against their public REST APIs and need a real key to be tested.
"""
from __future__ import annotations

import base64
import hashlib
import io
import json
import os
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

from ..common import ROOT

CACHE = ROOT / ".cache" / "tts"


class Provider:
    name = "base"

    def voice_id(self) -> str:
        raise NotImplementedError

    def _synth(self, text: str) -> tuple[np.ndarray, int]:
        raise NotImplementedError

    def synthesize(self, text: str) -> tuple[np.ndarray, int]:
        key = hashlib.sha256(f"{self.name}|{self.voice_id()}|{text}".encode()).hexdigest()[:24]
        CACHE.mkdir(parents=True, exist_ok=True)
        path = CACHE / f"{self.name}-{key}.wav"
        if path.exists():
            audio, sr = sf.read(path, dtype="float32")
            return audio, sr
        audio, sr = self._synth(text)
        audio = np.asarray(audio, dtype=np.float32)
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        sf.write(path, audio, sr)
        return audio, sr


class Kokoro(Provider):
    """Free, local, Apache-2.0. https://github.com/thewh1teagle/kokoro-onnx"""

    name = "kokoro"

    def __init__(self) -> None:
        from kokoro_onnx import Kokoro as K

        m = ROOT / "models" / "kokoro"
        self.k = K(str(m / "kokoro-v1.0.onnx"), str(m / "voices-v1.0.bin"))
        self.voice = os.environ.get("KOKORO_VOICE", "af_heart")
        # British voices start with b (bf_/bm_), American with a (af_/am_).
        self.lang = "en-gb" if self.voice.startswith("b") else "en-us"

    def voice_id(self) -> str:
        return self.voice

    def _synth(self, text: str):
        samples, sr = self.k.create(text, voice=self.voice, speed=1.0, lang=self.lang)
        return samples, sr


class Chatterbox(Provider):
    """Free, local, MIT licence (code and weights). https://github.com/resemble-ai/chatterbox

    Runs in .venv-tts (torch) through pipeline/tts/chatterbox_worker.py, one sentence at a time (it is
    most natural on short inputs); sentences are joined with a short breath. CHATTERBOX_REF = a
    reference clip that sets the voice (empty = the model's built-in voice). Only synthetic or
    consenting voices may be used as a reference — never a real person's voice without their consent.
    """

    name = "chatterbox"
    BREATH = 0.3  # seconds between sentences inside one segment

    def __init__(self) -> None:
        self.ref = os.environ.get("CHATTERBOX_REF", "").strip()
        if self.ref and not Path(self.ref).is_absolute():
            self.ref = str(ROOT / self.ref)
        if self.ref and not Path(self.ref).exists():
            raise SystemExit(f"CHATTERBOX_REF not found: {self.ref}")
        self.params = {k: os.environ.get(k, "") for k in ("CHATTERBOX_EXAGGERATION", "CHATTERBOX_CFG", "CHATTERBOX_TEMPERATURE")}
        self.proc = None
        self.sr = 24000

    def voice_id(self) -> str:
        ref = "builtin"
        if self.ref:
            ref = Path(self.ref).stem + "-" + hashlib.sha256(Path(self.ref).read_bytes()).hexdigest()[:8]
        return ref + "".join(f"|{v}" for v in self.params.values())

    def _worker(self):
        if self.proc is None:
            import subprocess

            py = ROOT / ".venv-tts" / "bin" / "python"
            if not py.exists():
                raise SystemExit("Chatterbox needs .venv-tts (see pipeline/setup.sh).")
            CACHE.mkdir(parents=True, exist_ok=True)
            log = open(CACHE / "chatterbox-worker.log", "a")
            env = {**os.environ, "CHATTERBOX_REF": self.ref}
            self.proc = subprocess.Popen([str(py), str(Path(__file__).with_name("chatterbox_worker.py"))], cwd=ROOT, env=env,
                                         stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=log, text=True, bufsize=1)
            hello = json.loads(self.proc.stdout.readline() or "{}")
            if not hello.get("ready"):
                raise SystemExit(f"Chatterbox failed to start; see {CACHE / 'chatterbox-worker.log'}")
            self.sr = int(hello["sr"])
        return self.proc

    @staticmethod
    def sentences(text: str) -> list[str]:
        import re

        return [s for s in re.split(r"(?<=[.!?…])\s+", text.strip()) if s]

    def _one(self, sentence: str) -> np.ndarray:
        p = self._worker()
        out = CACHE / f"chatterbox-part-{os.getpid()}.wav"
        seed = int(hashlib.sha256(sentence.encode()).hexdigest()[:8], 16)
        p.stdin.write(json.dumps({"text": sentence, "out": str(out), "seed": seed}) + "\n")
        p.stdin.flush()
        reply = json.loads(p.stdout.readline() or '{"ok": false, "error": "worker stopped"}')
        if not reply.get("ok"):
            raise SystemExit(f"Chatterbox: {reply.get('error')} (log: {CACHE / 'chatterbox-worker.log'})")
        audio, _ = sf.read(out, dtype="float32")
        out.unlink(missing_ok=True)
        from ..narrate import trim  # same silence trim as whole segments get

        return trim(audio, self.sr)

    def _synth(self, text: str):
        parts: list[np.ndarray] = []
        for i, s in enumerate(self.sentences(text)):
            if i:
                parts.append(np.zeros(int(self.BREATH * self.sr), dtype=np.float32))
            parts.append(self._one(s))
        return (np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)), self.sr


def _post(url: str, headers: dict, body: dict) -> bytes:
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def _need(var: str) -> str:
    v = os.environ.get(var, "")
    if not v:
        raise SystemExit(f"{var} is missing. Add it to .env (see .env.example).")
    return v


class ElevenLabs(Provider):
    """https://elevenlabs.io/docs/api-reference/text-to-speech/convert"""

    name = "elevenlabs"

    def __init__(self) -> None:
        self.key = _need("ELEVENLABS_API_KEY")
        self.voice = _need("ELEVENLABS_VOICE_ID")
        self.model = os.environ.get("ELEVENLABS_MODEL", "eleven_v4")

    def voice_id(self) -> str:
        return f"{self.voice}:{self.model}"

    def _synth(self, text: str):
        raw = _post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice}?output_format=pcm_24000",
            {"xi-api-key": self.key, "Content-Type": "application/json"},
            {"text": text, "model_id": self.model,
             "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.2}},
        )
        return np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0, 24000


class OpenAI(Provider):
    """https://platform.openai.com/docs/guides/text-to-speech"""

    name = "openai"

    def __init__(self) -> None:
        self.key = _need("OPENAI_API_KEY")
        self.voice = os.environ.get("OPENAI_VOICE", "sage")
        self.model = os.environ.get("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
        self.instructions = os.environ.get(
            "OPENAI_TTS_INSTRUCTIONS",
            "Warm, curious science narrator. Clear, unhurried, conversational. British English.",
        )

    def voice_id(self) -> str:
        return f"{self.voice}:{self.model}:{self.instructions}"

    def _synth(self, text: str):
        raw = _post(
            "https://api.openai.com/v1/audio/speech",
            {"Authorization": f"Bearer {self.key}", "Content-Type": "application/json"},
            {"model": self.model, "voice": self.voice, "input": text,
             "instructions": self.instructions, "response_format": "wav"},
        )
        audio, sr = sf.read(io.BytesIO(raw), dtype="float32")
        return audio, sr


class Google(Provider):
    """https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize"""

    name = "google"

    def __init__(self) -> None:
        self.key = _need("GOOGLE_TTS_API_KEY")
        self.voice = os.environ.get("GOOGLE_VOICE", "en-GB-Chirp3-HD-Aoede")

    def voice_id(self) -> str:
        return self.voice

    def _synth(self, text: str):
        lang = "-".join(self.voice.split("-")[:2])
        raw = _post(
            f"https://texttospeech.googleapis.com/v1/text:synthesize?key={self.key}",
            {"Content-Type": "application/json"},
            {"input": {"text": text}, "voice": {"languageCode": lang, "name": self.voice},
             "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": 24000}},
        )
        wav = base64.b64decode(json.loads(raw)["audioContent"])
        audio, sr = sf.read(io.BytesIO(wav), dtype="float32")
        return audio, sr


class Gemini(Provider):
    """Gemini text-to-speech (AI Studio key). https://ai.google.dev/gemini-api/docs/speech-generation

    The accent and tone come from a short spoken-style direction in front of the text
    (GEMINI_TTS_STYLE). Listen to the first take: if it ever reads the direction aloud, shorten it.
    """

    name = "gemini"

    def __init__(self) -> None:
        self.key = _need("GEMINI_API_KEY")
        self.model = os.environ.get("GEMINI_TTS_MODEL", "gemini-3.8-flash-tts")
        self.voice = os.environ.get("GEMINI_VOICE", "Kore")
        self.style = os.environ.get(
            "GEMINI_TTS_STYLE",
            "Read this as a warm, curious science narrator with a natural British accent, "
            "clear and unhurried",
        )

    def voice_id(self) -> str:
        return f"{self.model}:{self.voice}:{self.style}"

    def _synth(self, text: str):
        prompt = f"{self.style}: {text}" if self.style else text
        raw = _post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent",
            {"x-goog-api-key": self.key, "Content-Type": "application/json"},
            {"contents": [{"parts": [{"text": prompt}]}],
             "generationConfig": {"responseModalities": ["AUDIO"],
                                  "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": self.voice}}}}},
        )
        part = json.loads(raw)["candidates"][0]["content"]["parts"][0]["inlineData"]
        pcm = base64.b64decode(part["data"])
        rate = 24000
        for bit in part.get("mimeType", "").split(";"):
            if bit.strip().startswith("rate="):
                rate = int(bit.strip()[5:])
        return np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768.0, rate


class Cartesia(Provider):
    """https://docs.cartesia.ai/api-reference/tts/bytes"""

    name = "cartesia"

    def __init__(self) -> None:
        self.key = _need("CARTESIA_API_KEY")
        self.voice = _need("CARTESIA_VOICE_ID")
        self.model = os.environ.get("CARTESIA_MODEL", "sonic-3")
        self.version = os.environ.get("CARTESIA_VERSION", "2025-04-16")

    def voice_id(self) -> str:
        return f"{self.voice}:{self.model}"

    def _synth(self, text: str):
        raw = _post(
            "https://api.cartesia.ai/tts/bytes",
            {"X-API-Key": self.key, "Cartesia-Version": self.version, "Content-Type": "application/json"},
            {"model_id": self.model, "transcript": text, "language": "en",
             "voice": {"mode": "id", "id": self.voice},
             "output_format": {"container": "wav", "encoding": "pcm_s16le", "sample_rate": 24000}},
        )
        audio, sr = sf.read(io.BytesIO(raw), dtype="float32")
        return audio, sr


PROVIDERS = {"kokoro": Kokoro, "chatterbox": Chatterbox, "elevenlabs": ElevenLabs, "gemini": Gemini, "cartesia": Cartesia,
             "openai": OpenAI, "google": Google}


def get_provider(name: str | None = None) -> Provider:
    name = (name or os.environ.get("TTS_PROVIDER", "kokoro")).lower()
    if name not in PROVIDERS:
        raise SystemExit(f"Unknown TTS_PROVIDER '{name}'. Choose one of: {', '.join(PROVIDERS)}")
    return PROVIDERS[name]()
