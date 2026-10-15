/**
 * Carbon dioxide drifting in from the air and into the willow's leaves (S01 "thin air", S18 resolve, thumbnail).
 * Each molecule follows a gentle curve, slows as it reaches a real leaf, and is absorbed (shrinks and fades);
 * that leaf glints at the moment it takes the molecule in.
 */
import React from "react";
import { CarbonDioxide } from "../../../../components/kit";
import { Pt, rng } from "../../../../lib/geometry";
import { pulse } from "../../../../lib/track";
import type { WLeaf } from "./S01-Willow";

export type Co2Flight = { readonly t0: number; readonly travel: number; readonly from: Pt; readonly ctrl: Pt; readonly to: Pt; readonly key: number; readonly seed: number; readonly rot: number };

/** Molecules leave every `every` frames from `start` until `stop`, each aimed at one of `targets` (in turn). */
export const co2Flights = (o: {
  readonly start: number;
  readonly stop: number;
  readonly every: number;
  readonly travel: number;
  readonly targets: readonly WLeaf[];
  /** spawn point for molecule i (world) */
  readonly spawn: (i: number, r: () => number) => Pt;
  readonly seed?: number;
}): Co2Flight[] => {
  const out: Co2Flight[] = [];
  if (!o.targets.length) return out;
  const n = Math.max(0, Math.ceil((o.stop - o.start) / o.every));
  for (let i = 0; i < n; i++) {
    const r = rng((o.seed ?? 11) * 1000 + i * 17);
    const tg = o.targets[i % o.targets.length];
    const from = o.spawn(i, r);
    const to: Pt = [tg.x, tg.y + 4];
    const mx = (from[0] + to[0]) / 2;
    const my = (from[1] + to[1]) / 2;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const L = Math.hypot(dx, dy) || 1;
    const bend = (r() - 0.5) * 0.36 * L;
    out.push({
      t0: o.start + i * o.every + Math.round((r() - 0.5) * o.every * 0.5),
      travel: Math.round(o.travel * (0.88 + 0.24 * r())),
      from,
      ctrl: [mx - (dy / L) * bend, my + (dx / L) * bend],
      to,
      key: tg.key,
      seed: 200 + i,
      rot: -30 + r() * 60,
    });
  }
  return out;
};

/** 0..1 glint for a leaf: when a molecule is absorbed into it. */
export const co2Glint = (flights: readonly Co2Flight[], f: number) => {
  const m = new Map<number, number>();
  for (const fl of flights) {
    const v = pulse(f, fl.t0 + fl.travel * 0.86, 24);
    if (v > 0) m.set(fl.key, Math.max(m.get(fl.key) ?? 0, v));
  }
  return (key: number) => m.get(key) ?? 0;
};

export const Co2Molecules: React.FC<{ readonly f: number; readonly flights: readonly Co2Flight[]; readonly scale?: number; readonly opacity?: number }> = ({ f, flights, scale = 0.5, opacity = 1 }) => (
  <g opacity={opacity}>
    {flights.map((fl, i) => {
      const u = (f - fl.t0) / fl.travel;
      if (u <= 0 || u >= 1) return null;
      const p = 1 - Math.pow(1 - u, 1.7);
      const q = 1 - p;
      const x = q * q * fl.from[0] + 2 * q * p * fl.ctrl[0] + p * p * fl.to[0];
      const y = q * q * fl.from[1] + 2 * q * p * fl.ctrl[1] + p * p * fl.to[1];
      const absorb = Math.max(0, (u - 0.8) / 0.2);
      return (
        <CarbonDioxide
          key={i}
          x={x}
          y={y}
          scale={scale * (1 - 0.55 * absorb)}
          rotate={fl.rot + u * 30}
          opacity={Math.min(1, u * 8) * (1 - absorb)}
          temperature={20}
          seed={fl.seed}
        />
      );
    })}
  </g>
);
