"""Final mix: narration + ducked music + sound effects -> one loudness-normalised track.

    .venv/bin/python -m pipeline.audio.mix <episode-id> [--timeline PATH] [--music PATH] [--out-dir DIR]

Writes (default out dir public/episodes/<id>/):
  mix.wav                         48 kHz stereo, -14 LUFS integrated, true peak <= -1 dBTP
  stems/narration.wav, music.wav, sfx.wav   the three layers exactly as mixed (same gain, before the limiter)
  mix_report.json                 loudness, ducking and SFX placement numbers

What it does, in plain English:
1. Voice: gentle clean-up (rumble filter + light compression), kept dead centre.
2. Music: automatically dips whenever the narrator speaks (it starts dipping ~150 ms *before*
   a phrase so the first word is never masked, and comes back up gently over ~600 ms in pauses).
   While speaking, music is kept at least 15 dB under the voice (we aim for ~19 dB).
3. Sound effects: placed on the cues listed in episodes/<id>/sfx.json. Each effect's level is set
   relative to the voice, then nudged by its gainDb. A cue that doesn't exist is reported, not fatal.
4. Master: set to -14 LUFS (YouTube's reference), then a look-ahead true-peak limiter keeps
   inter-sample peaks under -1 dBTP (checked with 4x oversampling).
"""
from __future__ import annotations

import argparse
import json
import warnings
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

from . import sfx as sfxlib
from . import timeline as tlmod
from .dsp import fade, highpass, nsamp, stereo, undb
from .loudness import integrated, limit, loudness_profile, normalise_and_limit
from .paths import SFX_DIR, SR, episode_dir, public_episode_dir

SETTINGS = {
    "targetLufs": -14.0,
    "truePeakMax": -1.0,
    "musicGapLU": -8.0,         # music level in pauses, relative to the voice's loudness
    "musicUnderLU": -17.0,      # music ceiling while the narrator speaks (rule: at least 15 dB under)
    "minDuckDb": -6.0,          # always dip at least this much under speech, even in quiet passages
    "duckAttackSec": 0.15,      # 10-90% time of the dip
    "duckReleaseSec": 0.60,     # 10-90% time of the recovery
    "duckLookaheadSec": 0.15,   # start dipping this long before speech
    "duckHoldSec": 0.25,        # ignore gaps shorter than this (no pumping between words)
    "sfxRelLU": -11.0,          # an effect at gainDb 0 peaks this far under the voice's loudness
    "voiceHighpassHz": 70.0,
    "voiceCompRatio": 2.5,
    "voiceCompAboveMedianDb": 4.0,
    "voicePeakAboveLufs": 11.5,  # fast, transparent peak control on the voice (TTS has sharp transients)
}
CTRL = 200  # Hz, control rate for envelopes


# --------------------------------------------------------------------------------------------------
# Voice
# --------------------------------------------------------------------------------------------------

def load_narration(path: Path, n_target: int) -> np.ndarray:
    x, sr = sf.read(path, dtype="float64", always_2d=True)
    x = x.mean(axis=1)
    if sr != SR:
        g = np.gcd(sr, SR)
        x = signal.resample_poly(x, SR // g, sr // g)
    if len(x) > n_target + nsamp(0.1):
        warnings.warn(f"Narration is {len(x) / SR - n_target / SR:.2f} s longer than the timeline; the mix is extended to fit it.")
    return x


def frame_db(x: np.ndarray, rate: int = CTRL, win: float = 0.03) -> np.ndarray:
    """RMS level (dBFS) on a `rate` Hz grid, `win`-second windows."""
    hop = SR // rate
    w = nsamp(win)
    c = np.concatenate([[0.0], np.cumsum(x ** 2)])
    centres = np.arange(0, len(x), hop)
    a = np.clip(centres - w // 2, 0, len(x))
    b = np.clip(centres + w // 2, 0, len(x))
    ms = (c[b] - c[a]) / np.maximum(b - a, 1)
    return 10 * np.log10(np.maximum(ms, 1e-12))


def speech_activity(voice: np.ndarray, s: dict) -> tuple[np.ndarray, float]:
    """Boolean speech mask on the control grid (with look-ahead and hold), and the threshold used."""
    lv = frame_db(voice)
    loud = lv[lv > -70]
    thr = max(-55.0, (np.percentile(loud, 95) if loud.size else -20) - 30.0)
    act = lv > thr
    # drop blips shorter than 50 ms
    lab = np.diff(np.concatenate([[0], act.astype(int), [0]]))
    starts, ends = np.nonzero(lab == 1)[0], np.nonzero(lab == -1)[0]
    for a, b in zip(starts, ends):
        if (b - a) / CTRL < 0.05:
            act[a:b] = False
    # hold across short gaps, then extend backwards by the look-ahead
    hold = int(s["duckHoldSec"] * CTRL)
    la = int(s["duckLookaheadSec"] * CTRL)
    act = np.convolve(act.astype(float), np.ones(hold + 1), mode="full")[: len(act)] > 0  # forward hold
    act = np.convolve(act.astype(float)[::-1], np.ones(la + 1), mode="full")[: len(act)][::-1] > 0  # look-ahead
    return act, float(thr)


def compress_voice(v: np.ndarray, s: dict) -> tuple[np.ndarray, float]:
    """Light 'leveller' compression: only the loudest syllables are pulled down a little."""
    rate = 1000
    lv = frame_db(v, rate, 0.01)
    speech = lv[lv > np.percentile(lv[lv > -70], 50) - 20] if np.any(lv > -70) else lv
    thr = float(np.median(speech) + s["voiceCompAboveMedianDb"])
    ratio, knee = float(s["voiceCompRatio"]), 6.0
    over = lv - thr
    gr = np.where(over <= -knee / 2, 0.0,
                  np.where(over >= knee / 2, over * (1 - 1 / ratio), (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee)))
    # smooth: fast attack (5 ms), gentle release (120 ms), 5 ms look-ahead
    att, rel = np.exp(-1 / (0.005 * rate)), np.exp(-1 / (0.12 * rate))
    gr = np.concatenate([gr[5:], np.zeros(5)])
    out = np.empty_like(gr)
    e = 0.0
    for i, g in enumerate(gr):
        e = g + (e - g) * (att if g > e else rel)
        out[i] = e
    gain = undb(-np.interp(np.arange(len(v)) / SR, np.arange(len(out)) / rate, out))
    return v * gain, float(np.max(out))


# --------------------------------------------------------------------------------------------------
# Music ducking
# --------------------------------------------------------------------------------------------------

def _smooth_db(target: np.ndarray, attack: float, release: float) -> np.ndarray:
    """Asymmetric one-pole smoothing in dB. attack/release are 10-90% times."""
    a = np.exp(-1 / (attack / 2.2 * CTRL))
    r = np.exp(-1 / (release / 2.2 * CTRL))
    out = np.empty_like(target)
    e = target[0]
    for i, t in enumerate(target):
        e = t + (e - t) * (a if t < e else r)
        out[i] = e
    return out


def duck_gain(music: np.ndarray, active: np.ndarray, v_lufs: float, s: dict, extra_db: float = 0.0) -> tuple[np.ndarray, float, np.ndarray]:
    """Per-sample music gain. Returns (gain, static_db, ducking curve in dB on the control grid)."""
    t_ms, m_st = loudness_profile(music, window=3.0, hop=1 / CTRL)
    n_ctrl = len(active)
    grid = np.arange(n_ctrl) / CTRL
    m = np.interp(grid, t_ms, m_st)
    audible = m_st[m_st > -60]
    p90 = np.percentile(audible, 90) if audible.size else -20.0
    static = (v_lufs + s["musicGapLU"]) - p90 + extra_db
    lvl = m + static
    gap_target = np.minimum(0.0, (v_lufs + s["musicGapLU"]) - lvl)
    under_target = np.minimum(s["minDuckDb"], (v_lufs + s["musicUnderLU"]) - lvl)
    target = np.where(active, under_target, gap_target)
    sm = _smooth_db(target, s["duckAttackSec"], s["duckReleaseSec"])
    g = undb(static + np.interp(np.arange(len(music)) / SR, grid, sm))
    return g, float(static), sm


# --------------------------------------------------------------------------------------------------
# SFX
# --------------------------------------------------------------------------------------------------

def _ref_loudness(x: np.ndarray) -> float:
    _, l = loudness_profile(x, window=0.2, hop=0.01)
    return float(np.max(l))


def build_sfx(tl: tlmod.Timeline, entries: list[dict], n: int, v_lufs: float, s: dict,
              sfx_dir: Path = SFX_DIR) -> tuple[np.ndarray, list[dict], list[str]]:
    out = np.zeros((n, 2))
    placed, problems = [], []
    cache: dict[str, tuple[np.ndarray, float]] = {}
    for e in entries:
        if not isinstance(e, dict) or "sfx" not in e or ("cue" not in e and "sec" not in e):
            problems.append(f"Ignored malformed sfx entry: {e}")
            continue
        if "sec" in e:  # absolute time exported by the animation (episodes/<id>/build/sfx-events.json)
            e = {**e, "cue": f"{e.get('scene', '?')}@{float(e['sec']):.3f}s"}
            t, w = float(e["sec"]), []
        else:
            with warnings.catch_warnings(record=True) as w:
                warnings.simplefilter("always")
                t = tl.time(e["cue"])
        if t is None:
            problems.append(f"Cue '{e['cue']}' not found in the timeline — '{e['sfx']}' skipped." + (f" ({w[0].message})" if w else ""))
            continue
        name = e["sfx"]
        if name not in cache:
            try:
                x = sfxlib.load(name, sfx_dir)
            except KeyError:
                problems.append(f"Unknown sound effect '{name}' (cue {e['cue']}) — skipped.")
                continue
            cache[name] = (x, _ref_loudness(x))
        x, ref = cache[name]
        t += float(e.get("offsetSec", 0.0))
        # optional looping (e.g. a sizzle bed under a passage)
        until = tl.time(e["untilCue"], warn=False) if e.get("untilCue") else None
        if e.get("untilCue") and until is None:
            problems.append(f"untilCue '{e['untilCue']}' not found — '{name}' at {e['cue']} uses durationSec or plays once.")
        if until is not None and until <= t:
            problems.append(f"untilCue '{e['untilCue']}' is before '{e['cue']}' — '{name}' plays once.")
            until = None
        length = (until - t) if until is not None else e.get("durationSec")
        if length:
            reps = int(np.ceil(nsamp(float(length)) / len(x))) + 1
            x = np.tile(x, (reps, 1))[: nsamp(float(length))]
            x = fade(x, float(e.get("fadeInSec", 0.3)), float(e.get("fadeOutSec", 0.5)))
        gain_db = (v_lufs + s["sfxRelLU"] + float(e.get("gainDb", 0.0))) - ref
        y = x * undb(gain_db)
        if "pan" in e:  # simple balance
            p = float(np.clip(e["pan"], -1, 1))
            y = y * np.array([min(1, 1 - p), min(1, 1 + p)])
        start = nsamp(t)
        if start >= n:
            problems.append(f"'{name}' at {t:.2f} s is after the end of the episode — skipped.")
            continue
        start = max(0, start)
        k = min(len(y), n - start)
        out[start:start + k] += y[:k]
        placed.append({"cue": e["cue"], "sfx": name, "timeSec": round(t, 3), "gainDb": round(gain_db, 1),
                       "lengthSec": round(k / SR, 2)})
    return out, placed, problems


def load_sfx_list(path: Path) -> list[dict]:
    if not path.exists():
        warnings.warn(f"No {path}; mixing without sound effects.")
        return []
    data = json.loads(path.read_text())
    return data.get("events", []) if isinstance(data, dict) else data


def merge_sfx(cue_entries: list[dict], events_path: Path | None, timeline_path: Path | None) -> tuple[list[dict], list[str]]:
    """Combine the hand-written cue list (sfx.json) with the frame-exact events exported from the
    animation (episodes/<id>/build/sfx-events.json, made by `scripts/sfx-events.ts`).
    For any scene the animation exports, its events win and sfx.json's entries for that scene are
    dropped, so nothing plays twice. Other scenes keep their sfx.json entries."""
    notes: list[str] = []
    if not events_path or not events_path.exists():
        return cue_entries, notes
    data = json.loads(events_path.read_text())
    anim = [e for e in (data.get("events", []) if isinstance(data, dict) else data) if "sec" in e and "sfx" in e]
    if timeline_path and timeline_path.exists() and events_path.stat().st_mtime < timeline_path.stat().st_mtime:
        notes.append(f"{events_path.name} is older than timeline.json — re-export it (npx tsx scripts/sfx-events.ts) so effects match the new narration.")
    covered = {e.get("scene") for e in anim}
    kept = [e for e in cue_entries if str(e.get("cue", "")).split(".")[0] not in covered]
    dropped = len(cue_entries) - len(kept)
    notes.append(f"Using {len(anim)} animation-exported effects for {', '.join(sorted(c for c in covered if c))}; "
                 f"{dropped} sfx.json entries for those scenes are superseded.")
    return kept + anim, notes


# --------------------------------------------------------------------------------------------------
# Measurements
# --------------------------------------------------------------------------------------------------

def loudness_range(x: np.ndarray) -> float:
    """EBU Tech 3342 LRA (LU)."""
    _, st = loudness_profile(x, window=3.0, hop=0.1)
    st = st[st > -70]
    if st.size == 0:
        return 0.0
    rel = 10 * np.log10(np.mean(10 ** (st / 10))) - 20
    st = st[st > rel]
    return float(np.percentile(st, 95) - np.percentile(st, 10))


def ducking_stats(voice_st: np.ndarray, music_st: np.ndarray, raw_active: np.ndarray) -> dict:
    """Compare voice vs music momentary loudness (400 ms) in windows that are all speech, and music
    level in clear pauses (>= 0.8 s without speech)."""
    t, lv = loudness_profile(voice_st, 0.4, 0.05)
    _, lm = loudness_profile(music_st, 0.4, 0.05)
    grid = np.arange(len(raw_active)) / CTRL
    # fraction of each 400 ms window that is speech
    c = np.concatenate([[0], np.cumsum(raw_active.astype(float))])
    i0 = np.clip(((t - 0.2) * CTRL).astype(int), 0, len(raw_active))
    i1 = np.clip(((t + 0.2) * CTRL).astype(int), 0, len(raw_active))
    frac = (c[i1] - c[i0]) / np.maximum(i1 - i0, 1)
    speech = (frac > 0.95) & (lv > -60)
    diff = lv[speech] - lm[speech]
    # pauses: windows entirely inside gaps of at least 0.8 s
    gap = np.convolve((~raw_active).astype(float), np.ones(int(0.8 * CTRL)), mode="same") >= int(0.8 * CTRL) - 1
    g_at = np.interp(t, grid, gap.astype(float)) > 0.99
    v_int = integrated(voice_st)
    res = {
        "speechWindows": int(speech.sum()),
        "voiceMinusMusicWhileSpeaking": {
            "median": round(float(np.median(diff)), 1) if diff.size else None,
            "p5": round(float(np.percentile(diff, 5)), 1) if diff.size else None,
            "min": round(float(np.min(diff)), 1) if diff.size else None,
        },
        "musicInPausesRelVoice": {
            "median": round(float(np.median(lm[g_at] - v_int)), 1) if np.any(g_at) else None,
            "max": round(float(np.max(lm[g_at] - v_int)), 1) if np.any(g_at) else None,
        },
        "musicWhileSpeakingRelVoice_median": round(float(np.median(lm[speech] - v_int)), 1) if diff.size else None,
    }
    return res


# --------------------------------------------------------------------------------------------------

def mix(tl: tlmod.Timeline, music_path: Path, sfx_entries: list[dict], out_dir: Path,
        settings: dict | None = None, sfx_dir: Path = SFX_DIR, verbose: bool = True,
        sfx_notes: list[str] | None = None) -> dict:
    s = dict(SETTINGS)
    s.update(settings or {})
    n = nsamp(tl.duration)
    if not tl.narration_path.exists():
        raise SystemExit(f"Narration audio not found at {tl.narration_path} (from timeline.json). Run the narration step first.")
    voice = load_narration(tl.narration_path, n)
    n = max(n, len(voice))
    voice = np.pad(voice, (0, n - len(voice)))

    voice = highpass(voice, s["voiceHighpassHz"], 2)
    voice, max_gr = compress_voice(voice, s)
    # catch the TTS's sharp, sparse transients here (fast release = inaudible) so the master limiter
    # hardly has to work
    v_peak_ceiling = integrated(stereo(voice)) + s["voicePeakAboveLufs"]
    v_lim, v_lim_stats = limit(stereo(voice), ceiling_db=v_peak_ceiling, lookahead=0.002, release=0.04)
    voice = v_lim[:, 0]
    raw_act, thr = speech_activity(voice, {**s, "duckHoldSec": 0.0, "duckLookaheadSec": 0.0})
    act, _ = speech_activity(voice, s)
    voice_st = stereo(voice)  # dead centre
    v_lufs = integrated(voice_st)

    music, sr = sf.read(music_path, dtype="float64", always_2d=True)
    if sr != SR:
        g = np.gcd(sr, SR)
        music = signal.resample_poly(music, SR // g, sr // g, axis=0)
    music = stereo(music[:, :2] if music.shape[1] >= 2 else music[:, 0])
    music = np.pad(music, ((0, max(0, n - len(music))), (0, 0)))[:n]

    # duck, then verify the 15 dB rule and tighten if any passage is too close
    extra = 0.0
    for _ in range(4):
        g, static, duck_db = duck_gain(music, act, v_lufs, s, extra)
        music_d = music * g[:, None]
        stats = ducking_stats(voice_st, music_d, raw_act)
        p5 = stats["voiceMinusMusicWhileSpeaking"]["p5"]
        if p5 is None or p5 >= 16.0:
            break
        extra -= (16.0 - p5) + 0.5
    sfx_track, placed, problems = build_sfx(tl, sfx_entries, n, v_lufs, s, sfx_dir)
    for p in sfx_notes or []:
        print(f"  note: {p}")
    for p in problems:
        print(f"  WARNING: {p}")

    full = voice_st + music_d + sfx_track
    out, gain_db, lim = normalise_and_limit(full, s["targetLufs"], s["truePeakMax"])
    gain = undb(gain_db)

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "stems").mkdir(exist_ok=True)
    sf.write(out_dir / "mix.wav", out.astype(np.float32), SR, subtype="PCM_24")
    for name, stem in (("narration", voice_st), ("music", music_d), ("sfx", sfx_track)):
        sf.write(out_dir / "stems" / f"{name}.wav", (stem * gain).astype(np.float32), SR, subtype="PCM_24")

    final_stats = ducking_stats(voice_st * gain, music_d * gain, raw_act)
    # how much the ducker itself pulls the music down: speech vs clear pauses (>= 0.8 s, not in the
    # music's own dropout), read straight from the gain curve so the music's dynamics don't blur it
    gap = np.convolve((~raw_act).astype(float), np.ones(int(0.8 * CTRL)), mode="same") >= int(0.8 * CTRL) - 1
    n_c = min(len(duck_db), len(raw_act))
    final_stats["duckGainWhileSpeakingDb"] = round(float(np.median(duck_db[:n_c][raw_act[:n_c]])), 1)
    final_stats["duckGainInPausesDb"] = round(float(np.median(duck_db[:n_c][gap[:n_c]])), 1) if np.any(gap[:n_c]) else None
    report = {
        "episode": tl.episode,
        "durationSec": round(n / SR, 3),
        "loudness": {
            "integratedLufs": round(lim["integratedLufs"], 2),
            "truePeakDbtp": round(lim["truePeakDbtp"], 2),
            "samplePeakDbfs": round(lim["samplePeakDbfs"], 2),
            "loudnessRangeLU": round(loudness_range(out), 1),
            "masterGainDb": round(gain_db, 2),
            "limiterMaxReductionDb": round(lim["maxGainReductionDb"], 2),
            "limiterPercentTime": round(lim["percentTimeLimiting"], 2),
        },
        "voice": {"integratedLufsInMix": round(integrated(voice_st * gain), 2),
                  "compressorMaxReductionDb": round(max_gr, 1),
                  "peakControlMaxReductionDb": round(v_lim_stats["maxGainReductionDb"], 1),
                  "peakControlPercentTime": round(v_lim_stats["percentTimeLimiting"], 2),
                  "speechGateDbfs": round(thr, 1),
                  "speechPercent": round(float(raw_act.mean() * 100), 1)},
        "music": {"staticGainDb": round(static, 1), "extraSafetyDb": round(extra, 1),
                  "integratedLufsInMix": round(integrated(music_d * gain), 2), **final_stats},
        "sfx": {"placed": placed, "problems": problems, "notes": sfx_notes or [],
                "integratedLufsInMix": round(integrated(sfx_track * gain), 2) if np.any(sfx_track) else None},
        "settings": s,
    }
    (out_dir / "mix_report.json").write_text(json.dumps(report, indent=1))
    if verbose:
        print_report(report, out_dir)
    return report


def print_report(r: dict, out_dir: Path) -> None:
    L, M = r["loudness"], r["music"]
    d = M["voiceMinusMusicWhileSpeaking"]
    ok = lambda c: "OK " if c else "FAIL"
    print("\n  Loudness report")
    print(f"  {ok(abs(L['integratedLufs'] + 14) <= 0.5)} integrated loudness  {L['integratedLufs']:6.2f} LUFS   (target -14)")
    print(f"  {ok(L['truePeakDbtp'] <= -1.0)} true peak            {L['truePeakDbtp']:6.2f} dBTP   (max -1.0, 4x oversampled)")
    print(f"       sample peak          {L['samplePeakDbfs']:6.2f} dBFS")
    print(f"       loudness range       {L['loudnessRangeLU']:6.1f} LU")
    print(f"       limiter              max {L['limiterMaxReductionDb']:.1f} dB, active {L['limiterPercentTime']:.1f}% of the time")
    print(f"  {ok((d['p5'] or 99) >= 15)} music under voice     median {d['median']} dB, 5th pct {d['p5']} dB, worst {d['min']} dB  (rule >= 15)")
    print(f"       ducking              music gain {M.get('duckGainWhileSpeakingDb')} dB while speaking vs {M.get('duckGainInPausesDb')} dB in pauses")
    V = r["voice"]
    print(f"       voice peak control   max {V['peakControlMaxReductionDb']} dB, active {V['peakControlPercentTime']}% of the time; leveller max {V['compressorMaxReductionDb']} dB")
    print(f"       sfx placed           {len(r['sfx']['placed'])} (problems: {len(r['sfx']['problems'])})")
    print(f"  -> {out_dir / 'mix.wav'}")


def main(argv: list[str] | None = None) -> dict:
    ap = argparse.ArgumentParser(description="Mix narration, music and SFX into the final episode audio.")
    ap.add_argument("episode")
    ap.add_argument("--timeline", help="default: episodes/<id>/build/timeline.json")
    ap.add_argument("--music", help="music bed WAV (default: public/episodes/<id>/stems/music_bed.wav)")
    ap.add_argument("--sfx-config", help="default: episodes/<id>/sfx.json")
    ap.add_argument("--sfx-events", help="animation-exported effects (default: episodes/<id>/build/sfx-events.json)")
    ap.add_argument("--no-sfx-events", action="store_true", help="ignore the animation export; use sfx.json only")
    ap.add_argument("--out-dir", help="default: public/episodes/<id>/")
    a = ap.parse_args(argv)
    tl = tlmod.load(a.episode, a.timeline)
    out_dir = Path(a.out_dir) if a.out_dir else public_episode_dir(a.episode)
    music = Path(a.music) if a.music else public_episode_dir(a.episode) / "stems" / "music_bed.wav"
    if not music.exists():
        raise SystemExit(f"No music bed at {music}. Run: .venv/bin/python -m pipeline.audio.build {a.episode}")
    entries = load_sfx_list(Path(a.sfx_config) if a.sfx_config else episode_dir(a.episode) / "sfx.json")
    ev_path = None if a.no_sfx_events else (Path(a.sfx_events) if a.sfx_events else tl.path.parent / "sfx-events.json")
    entries, notes = merge_sfx(entries, ev_path, tl.path)
    if sfxlib.missing():
        sfxlib.write_all(sfxlib.missing(), quiet=True)
    print(f"Mixing {a.episode}…")
    return mix(tl, music, entries, out_dir, sfx_notes=notes)


if __name__ == "__main__":
    main()
