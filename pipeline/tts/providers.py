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
        self.model = os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")

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


PROVIDERS = {"kokoro": Kokoro, "elevenlabs": ElevenLabs, "openai": OpenAI, "google": Google}


def get_provider(name: str | None = None) -> Provider:
    name = (name or os.environ.get("TTS_PROVIDER", "kokoro")).lower()
    if name not in PROVIDERS:
        raise SystemExit(f"Unknown TTS_PROVIDER '{name}'. Choose one of: {', '.join(PROVIDERS)}")
    return PROVIDERS[name]()
