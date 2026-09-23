import type { Camera, BoardNode } from '../store/types';

export const GRID_SIZE = 24;

export interface Point {
  x: number;
  y: number;
}

/** Screen (client) coords → world coords, given the current camera. */
export function screenToWorld(pt: Point, cam: Camera, rect: DOMRect): Point {
  return {
    x: (pt.x - rect.left - cam.x) / cam.zoom,
    y: (pt.y - rect.top - cam.y) / cam.zoom,
  };
}

/** World coords → screen (client) coords. */
export function worldToScreen(pt: Point, cam: Camera, rect: DOMRect): Point {
  return {
    x: pt.x * cam.zoom + cam.x + rect.left,
    y: pt.y * cam.zoom + cam.y + rect.top,
  };
}

export function snap(v: number, on: boolean, size = GRID_SIZE): number {
  return on ? Math.round(v / size) * size : v;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Zoom about a fixed screen point, so the cursor stays anchored. */
export function zoomAt(cam: Camera, factor: number, screenX: number, screenY: number): Camera {
  const zoom = clamp(cam.zoom * factor, 0.1, 4);
  const k = zoom / cam.zoom;
  return {
    zoom,
    x: screenX - (screenX - cam.x) * k,
    y: screenY - (screenY - cam.y) * k,
  };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function nodeRect(n: BoardNode): Rect {
  return { x: n.x, y: n.y, w: n.w, h: n.h };
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function normalizeRect(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

/** Bounding box of a set of nodes, with padding. Used to frame the camera. */
export function boundsOf(nodes: BoardNode[], pad = 80): Rect | null {
  if (!nodes.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.w);
    maxY = Math.max(maxY, n.y + n.h);
  }
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
}

/** Camera that fits `rect` inside a viewport of `vw`×`vh`. */
export function cameraForRect(rect: Rect, vw: number, vh: number): Camera {
  const zoom = clamp(Math.min(vw / rect.w, vh / rect.h), 0.1, 1.5);
  return {
    zoom,
    x: vw / 2 - (rect.x + rect.w / 2) * zoom,
    y: vh / 2 - (rect.y + rect.h / 2) * zoom,
  };
}

/**
 * Cubic bezier between two ports, with horizontal control arms.
 * The arm length grows with distance so short hops don't loop awkwardly.
 */
export function wirePath(from: Point, to: Point): string {
  const dx = Math.abs(to.x - from.x);
  const arm = clamp(dx * 0.5, 40, 220);
  return `M ${from.x} ${from.y} C ${from.x + arm} ${from.y}, ${to.x - arm} ${to.y}, ${to.x} ${to.y}`;
}

/** Midpoint of the above bezier at t=0.5 — where the delete affordance sits. */
export function wireMidpoint(from: Point, to: Point): Point {
  const dx = Math.abs(to.x - from.x);
  const arm = clamp(dx * 0.5, 40, 220);
  const p0 = from;
  const p1 = { x: from.x + arm, y: from.y };
  const p2 = { x: to.x - arm, y: to.y };
  const p3 = to;
  const t = 0.5;
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

export const PORT_INSET = 0;

/** Output port sits on the right edge, input on the left, both vertically centred. */
export function outPort(n: BoardNode): Point {
  return { x: n.x + n.w + PORT_INSET, y: n.y + n.h / 2 };
}

export function inPort(n: BoardNode): Point {
  return { x: n.x - PORT_INSET, y: n.y + n.h / 2 };
}
