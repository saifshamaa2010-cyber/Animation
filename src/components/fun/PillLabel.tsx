import React from "react";
import { C, EASE } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { Pt } from "../../lib/geometry";
import { cumulative, sampleSpline } from "../kit/ink";
import { textWidth } from "../kit/text";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (t: number) => {
  const c1 = 1.70158;
  const x = clamp01(t);
  return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** A dense polyline through `pts` (Catmull–Rom) with its cumulative lengths, for moving things along it. */
export const makeRoute = (pts: readonly Pt[], step = 4) => {
  const poly = sampleSpline(pts, false, step);
  const L = cumulative(poly);
  return { poly, L, total: L[L.length - 1] || 1 };
};
export type Route = ReturnType<typeof makeRoute>;

/** Point and heading (degrees) at fraction u (0..1, by length) along a route. */
export const routeAt = (r: Route, u: number): { p: Pt; ang: number } => {
  const target = clamp01(u) * r.total;
  let lo = 0;
  let hi = r.L.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (r.L[mid] < target) lo = mid;
    else hi = mid;
  }
  const a = r.poly[lo];
  const b = r.poly[hi];
  const seg = r.L[hi] - r.L[lo] || 1;
  const k = (target - r.L[lo]) / seg;
  return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
};

/**
 * A rounded label pill (dark glass, bold Lexend) that pops in after its leader lines draw. One or more
 * `anchors` get a leader line each (e.g. "guard cells" pointing at both cells).
 */
export const PillLabel: React.FC<{
  /** centre of the pill */
  readonly x: number;
  readonly y: number;
  readonly text: string;
  /** 0..1: leaders draw (first half), then the pill pops */
  readonly progress: number;
  /** 0..1 fades it away */
  readonly out?: number;
  readonly anchors?: readonly Pt[];
  readonly color?: string;
  readonly lineColor?: string;
  readonly size?: number;
  readonly fill?: string;
}> = ({ x, y, text, progress, out = 0, anchors = [], color = C.paper, lineColor, size = 46, fill = "#0B0A1C" }) => {
  if (progress <= 0 || out >= 1) return null;
  const w = textWidth(text, size, 700) + size * 1.25;
  const h = size * 1.55;
  const lead = EASE.out(clamp01(progress / 0.45));
  const pop = clamp01((progress - 0.25) / 0.75);
  const lc = lineColor ?? color;
  const op = 1 - clamp01(out);
  return (
    <g opacity={op}>
      {anchors.map((a, i) => {
        // start on the pill's edge, towards the anchor
        const dx = a[0] - x;
        const dy = a[1] - y;
        const kx = Math.abs(dx) > 1e-3 ? (w / 2) / Math.abs(dx) : Infinity;
        const ky = Math.abs(dy) > 1e-3 ? (h / 2) / Math.abs(dy) : Infinity;
        const k = Math.min(kx, ky, 1);
        const s: Pt = [x + dx * k, y + dy * k];
        const e: Pt = [s[0] + (a[0] - s[0]) * lead, s[1] + (a[1] - s[1]) * lead];
        return (
          <g key={i}>
            <line x1={s[0]} y1={s[1]} x2={e[0]} y2={e[1]} stroke="#0B0A1C" strokeOpacity={0.5} strokeWidth={9} strokeLinecap="round" />
            <line x1={s[0]} y1={s[1]} x2={e[0]} y2={e[1]} stroke={lc} strokeWidth={4} strokeLinecap="round" />
            {lead > 0.95 ? <circle cx={a[0]} cy={a[1]} r={8} fill={lc} stroke="#0B0A1C" strokeOpacity={0.6} strokeWidth={3} /> : null}
          </g>
        );
      })}
      {pop > 0 ? (
        <g transform={`translate(${x} ${y}) scale(${back(pop)})`} opacity={Math.min(1, pop * 3)}>
          <rect x={-w / 2 + 3} y={-h / 2 + 7} width={w} height={h} rx={h / 2} fill="#000" opacity={0.3} />
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} fillOpacity={0.82} stroke={lc} strokeOpacity={0.75} strokeWidth={3} />
          <text y={size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size} fill={color}>
            {text}
          </text>
        </g>
      ) : null}
    </g>
  );
};

/**
 * A dashed, curved arrow that draws on along `pts` and whose dashes keep flowing towards the head
 * (`flow` = frames; the flow shows the direction of movement, e.g. of a gas diffusing).
 */
export const DashArrow: React.FC<{
  readonly pts: readonly Pt[];
  readonly progress: number;
  readonly out?: number;
  readonly color?: string;
  readonly width?: number;
  readonly flow?: number;
}> = ({ pts, progress, out = 0, color = C.paper, width = 6, flow = 0 }) => {
  if (progress <= 0 || out >= 1) return null;
  const r = makeRoute(pts, 4);
  const upto = EASE.out(clamp01(progress)) * r.total;
  const kept: Pt[] = [];
  for (let i = 0; i < r.poly.length && r.L[i] <= upto; i++) kept.push(r.poly[i]);
  const end = routeAt(r, upto / r.total);
  kept.push(end.p);
  if (kept.length < 2) return null;
  const d = `M${kept.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L")}`;
  const head = width * 3.4;
  const a = (end.ang * Math.PI) / 180;
  const tip = end.p;
  const bx = tip[0] - Math.cos(a) * head;
  const by = tip[1] - Math.sin(a) * head;
  const px = -Math.sin(a) * head * 0.62;
  const py = Math.cos(a) * head * 0.62;
  const tri = `M${tip[0] + Math.cos(a) * 4},${tip[1] + Math.sin(a) * 4} L${bx + px},${by + py} L${bx - px},${by - py} Z`;
  return (
    <g opacity={1 - clamp01(out)}>
      <path d={d} fill="none" stroke="#0B0A1C" strokeOpacity={0.45} strokeWidth={width + 6} strokeLinecap="round" strokeDasharray={`${width * 3} ${width * 2.4}`} strokeDashoffset={-flow * 1.6} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={`${width * 3} ${width * 2.4}`} strokeDashoffset={-flow * 1.6} />
      <path d={tri} fill={color} stroke="#0B0A1C" strokeOpacity={0.45} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};
