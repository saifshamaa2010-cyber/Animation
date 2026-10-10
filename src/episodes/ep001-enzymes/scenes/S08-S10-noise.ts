/**
 * 2D simplex noise for the temperature arc, value-for-value identical to `noise2D` from
 * @remotion/noise (same seeding: remotion's `random(seed)` feeding simplex-noise's permutation
 * table), but with an unbounded per-seed cache. @remotion/noise only keeps the last ~10 seeds, and
 * the arc model samples hundreds (every molecule has its own x/y/rotation seeds), so it rebuilt a
 * permutation table on almost every call — that was ~80 % of the arc's start-up time.
 *
 * The noise function below is a port of createNoise2D from simplex-noise 4.0.1:
 *   Copyright (c) 2018–2022 Jonas Wagner. MIT License.
 *   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 *   associated documentation files (the "Software"), to deal in the Software without restriction,
 *   including without limitation the rights to use, copy, modify, merge, publish, distribute,
 *   sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions: The above copyright notice and this
 *   permission notice shall be included in all copies or substantial portions of the Software.
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */
import { random } from "remotion";

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const GRAD2 = [1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 1, 0, -1, 0, 0, 1, 0, -1, 0, 1, 0, -1];

type Table = { perm: Uint8Array; gx: Float64Array; gy: Float64Array };

const buildTable = (seed: string): Table => {
  const r = random(seed); // (as in @remotion/noise: the same value for every draw)
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 0; i < 255; i++) {
    const j = i + ~~(r * (256 - i));
    const aux = perm[i];
    perm[i] = perm[j];
    perm[j] = aux;
  }
  for (let i = 256; i < 512; i++) perm[i] = perm[i - 256];
  const gx = new Float64Array(512);
  const gy = new Float64Array(512);
  for (let i = 0; i < 512; i++) {
    gx[i] = GRAD2[(perm[i] % 12) * 2];
    gy[i] = GRAD2[(perm[i] % 12) * 2 + 1];
  }
  return { perm, gx, gy };
};

const TABLES = new Map<string, Table>();

/** Same values as `noise2D(seed, x, y)` from @remotion/noise, without its tiny seed cache. */
export const noise2D = (seed: string, x: number, y: number): number => {
  let tb = TABLES.get(seed);
  if (!tb) {
    tb = buildTable(seed);
    TABLES.set(seed, tb);
  }
  const { perm, gx, gy } = tb;
  const s = (x + y) * F2;
  const i = Math.floor(x + s) | 0;
  const j = Math.floor(y + s) | 0;
  const t = (i + j) * G2;
  const x0 = x - (i - t);
  const y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0;
  const j1 = 1 - i1;
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;
  const ii = i & 255;
  const jj = j & 255;
  let n0 = 0;
  let n1 = 0;
  let n2 = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    const g = ii + perm[jj];
    t0 *= t0;
    n0 = t0 * t0 * (gx[g] * x0 + gy[g] * y0);
  }
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    const g = ii + i1 + perm[jj + j1];
    t1 *= t1;
    n1 = t1 * t1 * (gx[g] * x1 + gy[g] * y1);
  }
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    const g = ii + 1 + perm[jj + 1];
    t2 *= t2;
    n2 = t2 * t2 * (gx[g] * x2 + gy[g] * y2);
  }
  return 70 * (n0 + n1 + n2);
};
