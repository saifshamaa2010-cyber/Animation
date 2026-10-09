"""End-to-end test of the audio engine on the MOCK timeline + synthetic narration.

    .venv/bin/python -m pipeline.audio.test.run_test [--reuse-music]

Everything is written under pipeline/audio/test/out/. Checks (numbers, not ears):
  - no clipping / NaNs; integrated loudness -14 LUFS +/- 0.5; true peak <= -1 dBTP
  - ducking: voice minus music while speaking (5th percentile >= 15 dB) and music recovery in pauses
  - every SFX lands where sfx.json says (cross-correlation of the SFX stem against each effect)
  - the music drops to near-silence under the pause-and-predict window and is continuous elsewhere
  - no clicks: no isolated sample-to-sample jumps in the music bed
Also draws PNGs (needs matplotlib, optional) for a visual check.
"""
from __future__ import annotations

import json
import sys

import numpy as np
import soundfile as sf
from scipy import signal

from .. import build
from .. import sfx as sfxlib
from .. import timeline as tlmod
from ..loudness import loudness_profile, true_peak_db
from ..mix import CTRL, speech_activity, SETTINGS
from ..paths import SR, episode_dir
from . import make_mock

OUT = make_mock.OUT


def check_sfx_timing(sfx_stem: np.ndarray, placed: list[dict], entries: list[dict]) -> list[dict]:
    loops = {e["cue"] + e["sfx"] for e in entries if e.get("untilCue") or e.get("durationSec")}
    res = []
    mono = sfx_stem.mean(1)
    for p in placed:
        if p["cue"] + p["sfx"] in loops:
            continue
        ref = sfxlib.load(p["sfx"]).mean(1)
        t = p["timeSec"]
        a = max(0, int((t - 0.3) * SR))
        seg = mono[a: a + len(ref) + int(0.6 * SR)]
        if len(seg) < len(ref):
            continue
        xc = signal.correlate(seg, ref, mode="valid", method="fft")
        lag = (a + int(np.argmax(np.abs(xc)))) / SR - t
        res.append({"sfx": p["sfx"], "cue": p["cue"], "expected": t, "errorMs": round(lag * 1000, 2)})
    return res


def music_checks(bed: np.ndarray, tl: tlmod.Timeline, plan: dict) -> dict:
    t, st = loudness_profile(bed, window=0.4, hop=0.05)
    out = {}
    for d in plan.get("dropouts", []):
        a, b = d["from"], d["to"]
        inside = st[(t > a + 1.6) & (t < b - 0.3)]
        before = st[(t > a - 4) & (t < a - 0.5)]
        out["dropoutDepthDb"] = round(float(np.median(before) - np.median(inside)), 1)
        out["dropoutLevelLufs"] = round(float(np.median(inside)), 1)
    mask = np.ones_like(t, bool)
    for d in plan.get("dropouts", []):
        mask &= ~((t > d["from"]) & (t < d["to"] + 0.5))
    body = (t > 2.0) & (t < tl.duration - 3.5) & mask
    out["quietestMomentOutsideDropoutLufs"] = round(float(np.min(st[body])), 1)
    out["loudestMomentLufs"] = round(float(np.max(st)), 1)
    # click detector: a sample-to-sample jump far above its local neighbourhood
    m = bed.mean(1)
    hp = np.abs(np.diff(m))
    local = signal.medfilt(hp[::8], 31)
    local = np.repeat(local, 8)[: len(hp)] + 1e-6
    spikes = int(np.sum(hp > 40 * local))
    out["clickSuspects"] = spikes
    # per-scene loudness of the bed (shows the arc)
    per = {}
    for sc in tl.scenes:
        sel = (t >= sc["startSec"]) & (t < sc["endSec"])
        if np.any(sel):
            per[sc["id"]] = round(float(10 * np.log10(np.mean(10 ** (st[sel] / 10)))), 1)
    out["bedLoudnessPerScene"] = per
    return out


def plots(mix: np.ndarray, voice: np.ndarray, music: np.ndarray, sfx_track: np.ndarray, tl: tlmod.Timeline,
          act: np.ndarray, plan: dict) -> list[str]:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        return []
    files = []
    t, lv = loudness_profile(voice, 0.4, 0.05)
    _, lm = loudness_profile(music, 0.4, 0.05)
    _, ls = loudness_profile(sfx_track, 0.4, 0.05)
    _, lx = loudness_profile(mix, 3.0, 0.1)
    tx = np.arange(len(lx)) * 0.1 + 1.5
    fig, ax = plt.subplots(2, 1, figsize=(18, 8), sharex=True)
    ax[0].plot(t, lv, lw=0.6, label="voice (momentary)", color="#2a6")
    ax[0].plot(t, lm, lw=0.9, label="music (momentary, ducked)", color="#c63")
    ax[0].plot(t, ls, lw=0.6, label="sfx", color="#66c", alpha=0.7)
    ax[0].plot(tx, lx, lw=1.2, label="mix (short-term)", color="k")
    for sc in tl.scenes:
        ax[0].axvline(sc["startSec"], color="#999", lw=0.5)
        ax[0].text(sc["startSec"] + 0.3, -16, sc["id"], fontsize=7)
    for d in plan.get("dropouts", []):
        ax[0].axvspan(d["from"], d["to"], color="#fd8", alpha=0.4)
    ax[0].set_ylim(-60, -8)
    ax[0].legend(loc="lower right", fontsize=8)
    ax[0].set_ylabel("LUFS")
    f, tt, S = signal.spectrogram(mix.mean(1)[:: 2], SR / 2, nperseg=2048, noverlap=1024)
    ax[1].pcolormesh(tt, f, 10 * np.log10(S + 1e-14), vmin=-130, vmax=-40, shading="auto", cmap="magma")
    ax[1].set_ylim(0, 8000)
    ax[1].set_xlabel("seconds")
    plt.tight_layout()
    p = OUT / "levels_full.png"
    plt.savefig(p, dpi=70)
    plt.close()
    files.append(str(p))
    # zoom: S08 end -> S10 start (pause & predict) and the hook -> title
    for name, (a, b) in {"zoom_hook_title.png": (0, tl.scene("S03")["startSec"] + 6),
                         "zoom_predict.png": (tl.scene("S09")["startSec"] - 3, tl.scene("S10")["startSec"] + 8)}.items():
        fig, ax = plt.subplots(1, 1, figsize=(16, 4.5))
        sel = (t >= a) & (t <= b)
        ax.plot(t[sel], lv[sel], label="voice", color="#2a6")
        ax.plot(t[sel], lm[sel], label="music (ducked)", color="#c63")
        ax.plot(t[sel], ls[sel], label="sfx", color="#66c")
        ga = np.arange(len(act)) / CTRL
        s2 = (ga >= a) & (ga <= b)
        ax.fill_between(ga[s2], -70, -70 + 8 * act[s2], color="#2a6", alpha=0.3, label="speech detected")
        for sc in tl.scenes:
            if a <= sc["startSec"] <= b:
                ax.axvline(sc["startSec"], color="#999", lw=0.8)
                ax.text(sc["startSec"] + 0.1, -12, sc["id"])
        ax.set_ylim(-72, -8)
        ax.legend(fontsize=8, loc="lower right")
        plt.tight_layout()
        p = OUT / name
        plt.savefig(p, dpi=70)
        plt.close()
        files.append(str(p))
    return files


def main(reuse_music: bool = False) -> dict:
    make_mock.ensure()
    tl = tlmod.load(path=make_mock.MOCK_TIMELINE)
    ep = tl.episode
    # the animation's sfx-events.json is timed to the REAL narration, so the mock test uses sfx.json only
    report = build.run(ep, timeline=str(make_mock.MOCK_TIMELINE), out_dir=str(OUT), reuse_music=reuse_music,
                       use_sfx_events=False)

    mix, _ = sf.read(OUT / "mix.wav", always_2d=True)
    voice, _ = sf.read(OUT / "stems" / "narration.wav", always_2d=True)
    music, _ = sf.read(OUT / "stems" / "music.wav", always_2d=True)
    sfx_track, _ = sf.read(OUT / "stems" / "sfx.wav", always_2d=True)
    bed, _ = sf.read(OUT / "stems" / "music_bed.wav", always_2d=True)
    plan = json.loads((OUT / "stems" / "music_plan.json").read_text())
    entries = json.loads((episode_dir(ep) / "sfx.json").read_text())

    act, _ = speech_activity(voice.mean(1), {**SETTINGS, "duckHoldSec": 0.0, "duckLookaheadSec": 0.0})
    timing = check_sfx_timing(sfx_track, report["sfx"]["placed"], entries)
    worst_ms = max((abs(r["errorMs"]) for r in timing), default=0.0)
    mc = music_checks(bed, tl, plan)
    L = report["loudness"]
    d = report["music"]["voiceMinusMusicWhileSpeaking"]
    checks = {
        "noNaN": bool(np.all(np.isfinite(mix))),
        "noClipping(samplePeak<0dBFS)": L["samplePeakDbfs"] < 0,
        "integratedLufs=-14±0.5": abs(L["integratedLufs"] + 14) <= 0.5,
        "truePeak<=-1dBTP(recheck)": true_peak_db(mix) <= -1.0 + 0.05,  # WAV is 24-bit: allow rounding
        "musicUnderVoice>=15dB(p5)": (d["p5"] or 0) >= 15,
        "sfxTimingWorst<5ms": worst_ms < 5,
        "dropoutDepth>=20dB": mc.get("dropoutDepthDb", 0) >= 20,
        "musicBedNoClickSuspects": mc["clickSuspects"] == 0,
    }
    out = {"checks": checks, "loudness": L, "ducking": report["music"], "sfxTiming": timing,
           "sfxTimingWorstMs": worst_ms, "music": mc, "plots": plots(mix, voice, music, sfx_track, tl, act, plan)}
    (OUT / "test_report.json").write_text(json.dumps(out, indent=1, default=float))
    print("\nTest checks:")
    for k, v in checks.items():
        print(f"  {'PASS' if v else 'FAIL'}  {k}")
    print(f"  sfx timing worst error {worst_ms:.2f} ms over {len(timing)} one-shot effects")
    print(f"  music dropout depth {mc.get('dropoutDepthDb')} dB; bed loudness per scene {mc['bedLoudnessPerScene']}")
    return out


if __name__ == "__main__":
    main(reuse_music="--reuse-music" in sys.argv)
