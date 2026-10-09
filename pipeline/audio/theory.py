"""Chord symbols -> notes, and smooth voice leading between chords."""
from __future__ import annotations

import itertools
import re
from dataclasses import dataclass

PC = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
      "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}

# intervals above the root; 14 = 9th, 17 = 11th, 18 = #11th, 21 = 13th
QUALITY = {
    "": (0, 4, 7), "maj7": (0, 4, 7, 11), "maj9": (0, 4, 7, 11, 14), "add9": (0, 4, 7, 14),
    "6": (0, 4, 7, 9), "69": (0, 4, 7, 9, 14), "maj7#11": (0, 4, 7, 11, 18),
    "m": (0, 3, 7), "m7": (0, 3, 7, 10), "m9": (0, 3, 7, 10, 14), "madd9": (0, 3, 7, 14),
    "m6": (0, 3, 7, 9), "m11": (0, 3, 7, 10, 14, 17),
    "7": (0, 4, 7, 10), "9": (0, 4, 7, 10, 14),
    "sus2": (0, 2, 7), "sus4": (0, 5, 7), "7sus4": (0, 5, 7, 10), "9sus4": (0, 5, 7, 10, 14),
    "sus4add9": (0, 5, 7, 14),
}
_RX = re.compile(r"^([A-G](?:#|b)?)(.*?)(?:/([A-G](?:#|b)?))?$")


@dataclass(frozen=True)
class Chord:
    symbol: str
    root: int  # pitch class
    bass: int  # pitch class of the lowest note
    intervals: tuple[int, ...]

    @property
    def pcs(self) -> list[int]:
        return sorted({(self.root + i) % 12 for i in self.intervals})

    def essential(self, voices: int) -> list[int]:
        """Pitch classes the upper voices must contain: drop the 5th of big chords, then the root."""
        iv = list(self.intervals)
        if len(iv) > voices and 7 in iv:
            iv.remove(7)
        if len(iv) > voices and 0 in iv:
            iv.remove(0)
        return sorted({(self.root + i) % 12 for i in iv})


def parse(symbol: str) -> Chord:
    m = _RX.match(symbol.strip())
    if not m or m.group(2) not in QUALITY:
        raise ValueError(f"Unknown chord symbol '{symbol}'. Qualities: {', '.join(q or 'major' for q in QUALITY)}")
    root = PC[m.group(1)]
    bass = PC[m.group(3)] if m.group(3) else root
    return Chord(symbol, root, bass, QUALITY[m.group(2)])


def voice(chord: Chord, prev: list[int] | None, voices: int = 4, low: int = 52, high: int = 77,
          centre: float = 64.0) -> list[int]:
    """Choose MIDI notes for the pad that (a) contain the chord's essential tones, (b) avoid muddy or
    harsh spacings, and (c) move as little as possible from the previous chord (voice leading)."""
    pcs = set(chord.pcs)
    need = set(chord.essential(voices))
    pool = [n for n in range(low, high + 1) if n % 12 in pcs]
    best, best_cost = None, 1e9
    for combo in itertools.combinations(pool, voices):
        got = {n % 12 for n in combo}
        if not need <= got:
            continue
        gaps = [b - a for a, b in zip(combo, combo[1:])]
        if min(gaps) < 2 or combo[-1] - combo[0] > 19:
            continue
        # no thirds (or closer) down in the mud
        if any(g < 5 and a < 57 for a, g in zip(combo, gaps)):
            continue
        cost = 0.0
        if prev:
            cost += sum(abs(a - b) for a, b in zip(combo, prev))
            cost += 0.5 * abs(combo[-1] - prev[-1])  # the top line matters most
        cost += 0.35 * abs(sum(combo) / voices - centre)
        cost += 2.0 * (voices - len(got))  # prefer distinct notes over doublings
        if any(g == 1 for g in gaps):
            cost += 6
        if any(g == 2 and a < 60 for a, g in zip(combo, gaps)):
            cost += 3  # low seconds get cloudy
        if combo[-1] % 12 == chord.bass and chord.bass != chord.root:
            cost += 1.5  # don't put the slash-bass note on top
        if cost < best_cost:
            best, best_cost = list(combo), cost
    if best is None:  # fall back: stacked chord tones from the bottom of the range
        start = next(n for n in range(low, high) if n % 12 == chord.root)
        best = [start + i for i in chord.intervals[:voices]]
    return best


def bass_note(chord: Chord, prev: int | None, low: int = 33, high: int = 45) -> int:
    opts = [n for n in range(low, high + 1) if n % 12 == chord.bass]
    if prev is None:
        return min(opts, key=lambda n: abs(n - 38))
    return min(opts, key=lambda n: abs(n - prev))
