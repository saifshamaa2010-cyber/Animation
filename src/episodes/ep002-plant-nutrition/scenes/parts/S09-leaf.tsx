/**
 * S09: one leaf that can turn about its midrib from face-on (broad) to edge-on (a thin slab).
 * The face squashes by cos(turn) while the leaf's thickness appears below it by sin(turn), so
 * the same leaf visibly becomes a slab — "broad" and "thin" are two views of one object.
 */
import React from "react";
import { C } from "../../../../brand/tokens";
import { Leaf, LeafGeo, leafGeometry } from "../../../../components/bio";
import { LitShape, mix } from "../../../../components/kit";
import { useSvgId } from "../../../../components/ids";
import { Pt, roundedPolygon, smoothOpenPath } from "../../../../lib/geometry";

export type LeafPose = {
  readonly cx: number;
  readonly cy: number;
  readonly len: number;
  readonly wid: number;
  /** degrees, 0 = tip pointing right */
  readonly ang: number;
  /** 0 = face-on … 1 = edge-on */
  readonly turn: number;
  /** thickness of the slab when edge-on, px */
  readonly T: number;
};

const SHAPE = { stalk: 0.18, veinPairs: 4 } as const;

/** Leaf-local (u along the midrib, v across) → screen, with the turn applied. `dn` = offset along the leaf's normal. */
export const posePoint = (pose: LeafPose, u: number, v: number, dn = 0): Pt => {
  const th = (pose.turn * Math.PI) / 2;
  const y = v * Math.cos(th) + dn * Math.sin(th);
  const a = (pose.ang * Math.PI) / 180;
  return [pose.cx + u * Math.cos(a) - y * Math.sin(a), pose.cy + u * Math.sin(a) + y * Math.cos(a)];
};

export const poseGeo = (pose: LeafPose): LeafGeo => {
  const flat = leafGeometry({ cx: 0, cy: 0, len: pose.len, wid: pose.wid, ang: 0, ...SHAPE });
  const X = (p: Pt): Pt => posePoint(pose, p[0], p[1]);
  return {
    ...flat,
    cx: pose.cx,
    cy: pose.cy,
    ang: pose.ang,
    outline: flat.outline.map(X),
    midrib: flat.midrib.map(X),
    veins: flat.veins.map((v) => v.map(X)),
    petiole: flat.petiole.map(X),
    P: (u, v) => X(flat.P(u, v)),
    half: (t) => flat.half(t) * Math.cos((pose.turn * Math.PI) / 2),
  };
};

/** Half-width of the (unturned) leaf at t = 0 base … 1 tip. */
export const poseHalf = (pose: LeafPose, t: number) => leafGeometry({ cx: 0, cy: 0, len: pose.len, wid: pose.wid, ...SHAPE }).half(t);

export const TurnLeaf: React.FC<{
  readonly pose: LeafPose;
  readonly sunlit?: number;
  readonly opacity?: number;
  /** soft sun wash sweeping from base (0) to tip (1) over the face: "surface area" */
  readonly wash?: number;
  readonly washOpacity?: number;
}> = ({ pose, sunlit = 0, opacity = 1, wash = 0, washOpacity = 0 }) => {
  const id = useSvgId("tleaf");
  if (opacity <= 0) return null;
  const th = (pose.turn * Math.PI) / 2;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const flat = leafGeometry({ cx: 0, cy: 0, len: pose.len, wid: pose.wid, ang: 0, ...SHAPE });
  const geo = poseGeo(pose);
  // the slab: the face's far edge, then its near edge pushed down by the thickness
  const N = 30;
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = -pose.len / 2 + t * pose.len;
    const h = flat.half(t);
    top.push(posePoint(pose, u, -h));
    bot.push(posePoint(pose, u, h, pose.T));
  }
  const slab = s > 0.01 ? roundedPolygon([...top, ...bot.reverse()], pose.T * s * 0.5) : null;
  // stalk: from the base, at mid-thickness
  const L = pose.len * SHAPE.stalk;
  const stalkPts: Pt[] = [
    posePoint(pose, -pose.len / 2, 0, pose.T / 2),
    posePoint(pose, -pose.len / 2 - L * 0.35, L * 0.12, pose.T / 2),
    posePoint(pose, -pose.len / 2 - L * 0.7, L * 0.3, pose.T / 2),
    posePoint(pose, -pose.len / 2 - L, L * 0.52, pose.T / 2),
  ];
  const stalkW = Math.max(6, pose.wid * 0.04);
  const faceD = geo.outline.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("") + "Z";
  const washTo = posePoint(pose, -pose.len / 2 + wash * pose.len * 1.05, 0);
  const washFrom = posePoint(pose, -pose.len / 2, 0);
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={faceD} />
        </clipPath>
        <linearGradient id={`${id}-w`} gradientUnits="userSpaceOnUse" x1={washFrom[0]} y1={washFrom[1]} x2={washTo[0]} y2={washTo[1]}>
          <stop offset="0" stopColor={C.sun} stopOpacity={0.16} />
          <stop offset="0.85" stopColor={C.sun} stopOpacity={0.3} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={smoothOpenPath(stalkPts)} fill="none" stroke={C.stem} strokeWidth={stalkW} strokeLinecap="round" />
      <path d={smoothOpenPath(stalkPts)} fill="none" stroke={C.paper} strokeOpacity={0.22} strokeWidth={Math.max(2, pose.wid * 0.012)} strokeLinecap="round" transform="translate(-2 -2)" />
      {slab ? <LitShape d={slab} top={mix(C.leaf, C.leafDeep, 0.25)} bottom={C.leafDark} rimOpacity={0.55} rimWidth={6} shadow={0.5 * s} shadowDy={14} shadowBlur={14} slant={0.05} /> : null}
      {c > 0.03 ? (
        <g opacity={Math.min(1, c * 6)}>
          <Leaf geo={geo} sunlit={sunlit} showStalk={false} shadow={0.5 * c} veins={Math.min(1, c * 2)} />
          {wash > 0 && washOpacity > 0 ? (
            <g clipPath={`url(#${id}-c)`} opacity={washOpacity}>
              <path d={faceD} fill={`url(#${id}-w)`} />
            </g>
          ) : null}
        </g>
      ) : null}
    </g>
  );
};
