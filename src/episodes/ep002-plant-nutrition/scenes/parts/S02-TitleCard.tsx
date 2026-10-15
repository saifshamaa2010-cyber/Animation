/**
 * EP002 title card (S02, and the end card S20). The motif is the whole episode in one gesture:
 * one packet of light lands on a leaf and a glucose ring comes out of it.
 */
import React from "react";
import { C, EASE, W } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { Leaf, leafGeometry } from "../../../../components/bio";
import { Photon } from "../../../../components/Light";
import { Glucose } from "../../../../components/SugarChain";
import { HandUnderline, textWidth } from "../../../../components/kit";
import { useSvgId } from "../../../../components/ids";
import { Pt } from "../../../../lib/geometry";
import { prog } from "../../../../lib/motion";

export const TITLE_WORDS = ["Plant", "Nutrition"] as const;
export const TITLE_SIZE = 120;
const SPACING = -3;

/** x of each title word (centred on the frame) and their widths. */
export const titleLayout = (size = TITLE_SIZE) => {
  const space = textWidth(" ", size, 700);
  const widths = TITLE_WORDS.map((w) => textWidth(w, size, 700, SPACING));
  const total = widths.reduce((a, b) => a + b, 0) + space * (TITLE_WORDS.length - 1);
  let x = W / 2 - total / 2;
  const xs = widths.map((w) => {
    const x0 = x;
    x += w + space;
    return x0;
  });
  return { xs, widths, total };
};

/** Title words rising through a mask (as in EP001's title), with "Nutrition" underlined in amber (food = sugar). */
export const TitleWords: React.FC<{ readonly t: number; readonly y: number; readonly delay?: number; readonly underline?: boolean }> = ({ t, y, delay = 0, underline = true }) => {
  const id = useSvgId("ttl");
  const { xs, widths } = titleLayout();
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={y - TITLE_SIZE} width={W} height={TITLE_SIZE * 1.32} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {TITLE_WORDS.map((w, i) => {
          const p = prog(t, delay + i * 6, 18, EASE.out);
          if (p <= 0) return null;
          return (
            <text key={w} x={xs[i]} y={y + (1 - p) * TITLE_SIZE * 1.15} fontFamily={FONT} fontWeight={700} fontSize={TITLE_SIZE} fill={C.paper} letterSpacing={SPACING}>
              {w}
            </text>
          );
        })}
      </g>
      {underline ? <HandUnderline x1={xs[1] - 6} x2={xs[1] + widths[1] + 6} y={y + 30} progress={prog(t, delay + 24, 16, (v) => v)} color={C.amber} width={8} seed={27} /> : null}
    </g>
  );
};

/** The motif: a leaf, a photon landing on it, a glucose ring leaving it. `t` = frames since it started. */
export const TitleMotif: React.FC<{ readonly t: number; readonly cx: number; readonly cy: number; readonly land?: number; readonly scale?: number }> = ({ t, cx, cy, land = 22, scale = 1 }) => {
  const geo = leafGeometry({ cx, cy, len: 250 * scale, wid: 124 * scale, ang: -22, stalk: 0.26, veinPairs: 5 });
  const hit: Pt = geo.P(36 * scale, -8 * scale);
  const leafIn = prog(t, 0, 16);
  const sun = Math.max(0, Math.min(1, (t - land) / 4)) * (1 - 0.6 * prog(t, land + 6, 30));
  const ring = prog(t, land + 3, 16);
  const rise = prog(t, land + 3, 34, EASE.out);
  const gx = hit[0] + 118 * scale * rise;
  const gy = hit[1] - 92 * scale * rise;
  return (
    <g>
      <Leaf geo={geo} progress={leafIn} sunlit={sun} shadow={0.4} />
      {t >= land && t < land + 14 ? (
        <circle cx={hit[0]} cy={hit[1]} r={(14 + 46 * prog(t, land, 14, EASE.out)) * scale} fill="none" stroke={C.sun} strokeWidth={3} opacity={1 - prog(t, land, 14)} />
      ) : null}
      <Photon from={[hit[0] - 330 * scale, hit[1] - 300 * scale]} to={hit} p={(t - land + 18) / 18} />
      {ring > 0 ? <Glucose x={gx} y={gy} tone="sugar" glow={1 - 0.55 * prog(t, land + 10, 30)} scale={(0.55 + 0.35 * EASE.out(ring)) * scale} opacity={Math.min(1, ring * 1.6)} /> : null}
    </g>
  );
};
