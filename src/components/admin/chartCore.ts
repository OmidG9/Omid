'use client';

import { useEffect, useState } from 'react';

/** Shared SVG viewBox constants for line charts. */
export const CHART_W = 600;
export const CHART_H = 190;
export const PAD_X = 10;
export const PAD_TOP = 16;
export const PAD_BOTTOM = 10;

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** True when the user prefers reduced motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export interface Pt {
  x: number;
  y: number;
}

export function buildPoints(
  values: number[],
  min: number,
  max: number
): Pt[] {
  const n = values.length;
  if (n === 0) return [];
  const innerW = CHART_W - PAD_X * 2;
  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
  const step = n > 1 ? innerW / (n - 1) : 0;
  const range = max - min || 1;
  return values.map((v, i) => ({
    x: PAD_X + i * step,
    y: PAD_TOP + innerH - ((v - min) / range) * innerH,
  }));
}

/** Smooth monotone-ish curve through the points (midpoint cubic). */
export function smoothD(pts: Pt[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cx = (prev.x + cur.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${cur.y}, ${cur.x} ${cur.y}`;
  }
  return d;
}

/** Area path that closes the line down to the baseline. */
export function areaD(lineD: string, pts: Pt[]): string {
  if (pts.length === 0) return '';
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${lineD} L ${last.x} ${CHART_H - PAD_BOTTOM} L ${first.x} ${
    CHART_H - PAD_BOTTOM
  } Z`;
}
