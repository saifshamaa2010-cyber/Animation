import { useEffect, useMemo } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";

/**
 * QA only (rendered when the composition gets `audit: true`). After each frame is laid out, logs
 * every visible piece of text with its real on-screen size and box, so `scripts/text-audit.ts` can
 * flag text under the 40 px minimum, outside the 100 px safe area, or cut by the frame edge.
 * Renders nothing and never changes the picture.
 */
export const TextAudit: React.FC = () => {
  const frame = useCurrentFrame();
  const handle = useMemo(() => delayRender(`text audit ${frame}`), [frame]);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        console.log("TEXTAUDIT " + JSON.stringify({ frame, items: measure() }));
      } finally {
        continueRender(handle);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [frame, handle]);
  return null;
};

type Item = { text: string; px: number; opacity: number; blur: boolean; box: [number, number, number, number] };

const visibleOpacity = (el: Element): { opacity: number; blur: boolean } => {
  let o = 1;
  let blur = false;
  for (let n: Element | null = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === "none" || cs.visibility === "hidden") return { opacity: 0, blur };
    o *= parseFloat(cs.opacity || "1");
    if (n === el && n instanceof SVGElement) o *= parseFloat(cs.fillOpacity || "1"); // inherited, so this covers parents
    if (cs.filter && cs.filter.includes("blur")) blur = true;
    // SVG motion blur (e.g. a rolling counter's streaking digits) — not meant to be read.
    const ref = n.getAttribute("filter")?.match(/url\(#([^)]+)\)/)?.[1];
    if (ref && document.getElementById(ref)?.querySelector("feGaussianBlur")) blur = true;
  }
  return { opacity: o, blur };
};

const measure = (): Item[] => {
  const out: Item[] = [];
  // SVG text (most labels): font size × the element's on-screen scale.
  document.querySelectorAll("svg text").forEach((el) => {
    const t = el as SVGTextElement;
    const text = (t.textContent || "").trim();
    if (!text) return;
    const ctm = t.getScreenCTM();
    if (!ctm) return;
    const scale = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));
    const px = parseFloat(getComputedStyle(t).fontSize) * scale;
    const r = t.getBoundingClientRect();
    const { opacity, blur } = visibleOpacity(t);
    if (opacity < 0.02 || r.width < 1) return;
    out.push({ text: text.slice(0, 60), px: Math.round(px * 10) / 10, opacity: Math.round(opacity * 100) / 100, blur, box: [r.left, r.top, r.right, r.bottom].map(Math.round) as Item["box"] });
  });
  // HTML text: every element that directly holds non-empty text.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set<Element>();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || seen.has(el) || el.closest("svg") || !(n.textContent || "").trim()) continue;
    seen.add(el);
    const he = el as HTMLElement;
    const r = he.getBoundingClientRect();
    if (r.width < 1) continue;
    const scale = he.offsetWidth > 0 ? r.width / he.offsetWidth : 1;
    const px = parseFloat(getComputedStyle(he).fontSize) * scale;
    const { opacity, blur } = visibleOpacity(he);
    if (opacity < 0.02) continue;
    out.push({ text: (he.textContent || "").trim().slice(0, 60), px: Math.round(px * 10) / 10, opacity: Math.round(opacity * 100) / 100, blur, box: [r.left, r.top, r.right, r.bottom].map(Math.round) as Item["box"] });
  }
  return out;
};
