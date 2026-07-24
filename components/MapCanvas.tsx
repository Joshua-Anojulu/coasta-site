"use client";
import { useEffect, useRef } from "react";
import { ROAD_SEGMENTS, CAMERAS, WATER, project, type RoadSegment } from "@/lib/dfw/geometry";
import { TIMELINE } from "@/lib/replay/timeline";
import { getReplayState } from "@/lib/replay/engine";

// Canvas role palette for the Clearsky "light atlas" map skin. Canvas cannot
// read CSS custom properties per frame, so these are kept in sync BY HAND
// with the map-role tones documented in docs/DESIGN.md section 1.1/8 and
// app/globals.css's --color-panel/-signal/-confirmed/-ink-2 family. Dark
// theme's low glow alphas (0.05 grid / 0.08 water) do NOT carry over onto a
// light ground - they read invisible - so every role here is a complete,
// independently tunable paint definition. Signal hierarchy rule: event
// markers (detect/confirmed/spotlight/cameraActive) always carry the
// heaviest visual weight; infrastructure (grid/roads/cameraIdle/dot) stays
// quiet. See docs/DESIGN.md section 8 for the accepted decorative-contrast
// trade-off on roadInterstate/cameraIdle.
type Paint = { readonly color: string; readonly alpha: number; readonly width?: number };

const MAP_COLORS = {
  panel: { color: "#F7F9FC", alpha: 1 },
  grid: { color: "#6B8CC4", alpha: 0.18 },
  water: { color: "#CBDDF2", alpha: 1 },
  roadInterstate: { color: "#5A7FBC", alpha: 0.9, width: 2.2 },
  roadMinor: { color: "#8AA6CE", alpha: 0.8, width: 1.2 },
  label: { color: "#4A5A73", alpha: 1 },
  // Idle node sits AT the contrast floor (~3.3:1 vs panel) on purpose - see
  // docs/DESIGN.md section 8 - so it never outshouts an active/event marker.
  cameraIdle: { color: "#5A7FBC", alpha: 1, width: 2.5 },
  cameraActive: { color: "#1D5BD8", alpha: 1, width: 4 },
  // Hover/focus highlight (Hero's hotspot layer drives this via the
  // controlled `spotlightId` prop); structurally distinct from cameraActive
  // - a double unfilled outline ring, never a filled node.
  spotlight: { color: "#1D5BD8", alpha: 1, width: 1.5 },
  dot: { color: "#123C8C", alpha: 0.3 },
  detect: { color: "#1D5BD8", alpha: 1, width: 2 },
  confirmed: { color: "#B93535", alpha: 1, width: 2 },
} as const satisfies Record<string, Paint>;

// White casing separates event/camera markers from the same-hue road
// network beneath them (cartography convention), rather than dark-theme glow.
const CASING = "#FFFFFF";
// +0.25px stroke-width allowance at DPR 1, where thin AA'd strokes on a
// light ground read faint (docs/DESIGN.md risk note); full weight at DPR>=2.
const dprWidth = (width: number, dpr: number) => (dpr <= 1 ? width + 0.25 : width);

const GRID_SPACING = 26;
const LABEL_MIN_WIDTH = 480;
const LABELS: { text: string; lonlat: readonly [number, number] }[] = [
  { text: "US-75", lonlat: [-96.752, 32.98] },
  { text: "I-635", lonlat: [-96.701, 32.918] },
  { text: "I-30", lonlat: [-97.1, 32.757] },
  { text: "I-35W", lonlat: [-97.33, 32.9] },
  { text: "DNT", lonlat: [-96.828, 33.02] },
];

export type TrafficDot = {
  segmentId: string;
  arcOffset: number;
  speed: number;
  direction: 1 | -1;
};

// Deterministic (no Math.random): same segments in -> same 40 dots out.
export function createTrafficDots(segments: readonly RoadSegment[]): TrafficDot[] {
  const interstates = segments.filter((s) => s.cls === "interstate");
  if (interstates.length === 0) return [];
  const fract = (v: number) => v - Math.floor(v);
  const dots: TrafficDot[] = [];
  for (let i = 0; i < 40; i++) {
    const seg = interstates[(i * 7) % interstates.length];
    const r = fract(Math.sin(i * 127.1 + 311.7) * 43758.5453);
    dots.push({
      segmentId: seg.id,
      arcOffset: r,
      speed: 0.02 + 0.03 * fract(r * 7.31),
      direction: i % 2 === 0 ? 1 : -1,
    });
  }
  return dots;
}

type SegmentArc = {
  points: readonly (readonly [number, number])[];
  cum: number[];
  total: number;
};

const SEGMENT_ARCS = new Map<string, SegmentArc>(
  ROAD_SEGMENTS.map((seg) => {
    const cum: number[] = [0];
    let total = 0;
    for (let i = 1; i < seg.points.length; i++) {
      const [lonA, latA] = seg.points[i - 1];
      const [lonB, latB] = seg.points[i];
      const kx = Math.cos(((latA + latB) / 2) * (Math.PI / 180));
      total += Math.hypot((lonB - lonA) * kx, latB - latA);
      cum.push(total);
    }
    return [seg.id, { points: seg.points, cum, total: total || 1 }];
  }),
);

const TRAFFIC_DOTS = createTrafficDots(ROAD_SEGMENTS);

function dotLonLat(dot: TrafficDot, tSec: number): readonly [number, number] {
  const arc = SEGMENT_ARCS.get(dot.segmentId);
  if (!arc) return [0, 0];
  let p = dot.arcOffset + dot.direction * dot.speed * tSec;
  p = ((p % 1) + 1) % 1;
  const target = p * arc.total;
  let i = 1;
  while (i < arc.cum.length - 1 && arc.cum[i] < target) i++;
  const span = arc.cum[i] - arc.cum[i - 1] || 1;
  const f = (target - arc.cum[i - 1]) / span;
  const [lonA, latA] = arc.points[i - 1];
  const [lonB, latB] = arc.points[i];
  return [lonA + (lonB - lonA) * f, latA + (latB - latA) * f];
}

// Interstate roads carry a soft, subtle depth understroke (NOT dark-theme
// glow) beneath the crisp top stroke; minor roads are a single quiet stroke.
const ROAD_UNDERSTROKE = { width: 5, alpha: 0.12 };

function buildBackground(w: number, h: number, dpr: number, fontFamily: string, background: "transparent" | "panel") {
  const bg = document.createElement("canvas");
  bg.width = Math.max(1, Math.round(w * dpr));
  bg.height = Math.max(1, Math.round(h * dpr));
  const ctx = bg.getContext("2d");
  if (!ctx) return bg;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (background === "panel") {
    ctx.fillStyle = MAP_COLORS.panel.color;
    ctx.globalAlpha = MAP_COLORS.panel.alpha;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = MAP_COLORS.grid.color;
  ctx.globalAlpha = MAP_COLORS.grid.alpha;
  for (let gx = GRID_SPACING / 2; gx < w; gx += GRID_SPACING) {
    for (let gy = GRID_SPACING / 2; gy < h; gy += GRID_SPACING) {
      ctx.fillRect(gx, gy, 1, 1);
    }
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = MAP_COLORS.water.color;
  ctx.globalAlpha = MAP_COLORS.water.alpha;
  for (const ring of WATER.rings) {
    ctx.beginPath();
    ring.forEach((p, i) => {
      const [x, y] = project(p, w, h);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const clsGroup of ["other", "interstate"] as const) {
    const segments = ROAD_SEGMENTS.filter((s) =>
      clsGroup === "interstate" ? s.cls === "interstate" : s.cls !== "interstate",
    );
    const paint = clsGroup === "interstate" ? MAP_COLORS.roadInterstate : MAP_COLORS.roadMinor;
    const tracePath = () => {
      ctx.beginPath();
      for (const seg of segments) {
        seg.points.forEach((p, i) => {
          const [x, y] = project(p, w, h);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
      }
    };
    ctx.strokeStyle = paint.color;
    if (clsGroup === "interstate") {
      tracePath();
      ctx.lineWidth = dprWidth(ROAD_UNDERSTROKE.width, dpr);
      ctx.globalAlpha = ROAD_UNDERSTROKE.alpha;
      ctx.stroke();
    }
    tracePath();
    ctx.lineWidth = dprWidth(paint.width ?? 1, dpr);
    ctx.globalAlpha = paint.alpha;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (w >= LABEL_MIN_WIDTH) {
    ctx.font = `10px ${fontFamily}`;
    ctx.fillStyle = MAP_COLORS.label.color;
    ctx.globalAlpha = MAP_COLORS.label.alpha;
    for (const label of LABELS) {
      const [x, y] = project(label.lonlat, w, h);
      ctx.fillText(label.text, x + 4, y - 4);
    }
    ctx.globalAlpha = 1;
  }
  return bg;
}

// Fills a circular node cased in a ring of `casingColor` (drawn first, so it
// reads as a thin outline once the node is painted on top) - the light-theme
// substitute for dark-theme node glow, keeping markers legible over the
// same-hue road strokes beneath them.
function drawCasedNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  casingWidth: number,
  color: string,
  alpha: number,
) {
  ctx.beginPath();
  ctx.arc(x, y, radius + casingWidth, 0, Math.PI * 2);
  ctx.fillStyle = CASING;
  ctx.globalAlpha = 1;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Strokes a circular ring cased in white (a wider white understroke drawn
// first, then the color stroke on top) - the cartography-style casing called
// for detect/confirmed rings and corner brackets.
function strokeCasedCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  width: number,
  color: string,
  alpha: number,
  dpr: number,
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = CASING;
  ctx.lineWidth = dprWidth(width + 3, dpr);
  // Casing fades WITH the color stroke - an always-opaque white ring would
  // sweep the roads at full strength late in each expansion cycle.
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = dprWidth(width, dpr);
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

const STATIC_T = 12000;

function drawFrame(
  ctx: CanvasRenderingContext2D,
  bg: HTMLCanvasElement,
  w: number,
  h: number,
  tMs: number,
  paused: boolean,
  spotlightId: string | null | undefined,
  dpr: number,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(bg, 0, 0, w, h);
  const s = getReplayState(TIMELINE, tMs);

  for (const cam of CAMERAS) {
    const [x, y] = project(cam.lonlat, w, h);
    const active = s.event?.camId === cam.id;

    if (active) {
      drawCasedNode(ctx, x, y, MAP_COLORS.cameraActive.width!, 2, MAP_COLORS.cameraActive.color, MAP_COLORS.cameraActive.alpha);
    } else {
      // Breathing moves to a surrounding halo (radius + alpha animate) -
      // the node itself stays solid opacity, never faded.
      const phase = 0.5 + 0.5 * Math.sin(tMs / 900 + x * 0.13);
      const haloRadius = 5 + 3 * phase;
      const haloAlpha = 0.1 + 0.1 * phase;
      ctx.beginPath();
      ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
      ctx.fillStyle = MAP_COLORS.cameraIdle.color;
      ctx.globalAlpha = haloAlpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      drawCasedNode(ctx, x, y, MAP_COLORS.cameraIdle.width!, 1, MAP_COLORS.cameraIdle.color, MAP_COLORS.cameraIdle.alpha);
    }

    if (spotlightId && cam.id === spotlightId) {
      // Double unfilled outline ring - structurally distinct from the
      // filled cameraActive node, so both can render together.
      const base = active ? MAP_COLORS.cameraActive.width! : MAP_COLORS.cameraIdle.width!;
      for (const extra of [5, 9]) {
        ctx.beginPath();
        ctx.arc(x, y, base + extra, 0, Math.PI * 2);
        ctx.strokeStyle = MAP_COLORS.spotlight.color;
        ctx.lineWidth = dprWidth(MAP_COLORS.spotlight.width!, dpr);
        ctx.globalAlpha = MAP_COLORS.spotlight.alpha;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  if (!paused) {
    ctx.fillStyle = MAP_COLORS.dot.color;
    ctx.globalAlpha = MAP_COLORS.dot.alpha;
    const tSec = tMs / 1000;
    for (const dot of TRAFFIC_DOTS) {
      const [x, y] = project(dotLonLat(dot, tSec), w, h);
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (s.event && s.phase !== "idle") {
    const [x, y] = project(s.event.lonlat, w, h);
    const paint = s.phase === "confirmed" ? MAP_COLORS.confirmed : MAP_COLORS.detect;
    // expanding radar ring, cased in white so it separates from the roads
    const ring = ((tMs % 1400) / 1400) * 26;
    strokeCasedCircle(ctx, x, y, 6 + ring, paint.width!, paint.color, 1 - ring / 26, dpr);
    // bounding-box corner brackets around the event, also cased in white
    const r = 12, l = 5;
    ctx.strokeStyle = CASING;
    ctx.lineWidth = dprWidth(paint.width! + 3, dpr);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      ctx.beginPath();
      ctx.moveTo(x + sx * r, y + sy * r - sy * l);
      ctx.lineTo(x + sx * r, y + sy * r);
      ctx.lineTo(x + sx * r - sx * l, y + sy * r);
      ctx.stroke();
    }
    ctx.strokeStyle = paint.color;
    ctx.lineWidth = dprWidth(paint.width!, dpr);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      ctx.beginPath();
      ctx.moveTo(x + sx * r, y + sy * r - sy * l);
      ctx.lineTo(x + sx * r, y + sy * r);
      ctx.lineTo(x + sx * r - sx * l, y + sy * r);
      ctx.stroke();
    }
    drawCasedNode(ctx, x, y, 3.5, 1.5, paint.color, 1);
  }
}

export default function MapCanvas({
  epochRef, paused, className, background = "panel", spotlightId,
}: {
  epochRef: React.RefObject<number | null>;
  paused: boolean;
  className?: string;
  background?: "transparent" | "panel";
  spotlightId?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);
  const dprRef = useRef(1);
  // Latest-value ref so the running RAF loop (created once per [paused,
  // epochRef, background] effect run) always renders the current spotlight
  // without needing to restart the loop on every hover/focus change.
  const spotlightRef = useRef(spotlightId);
  spotlightRef.current = spotlightId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let disposed = false;

    const fontFamily = () =>
      getComputedStyle(document.body).fontFamily || "monospace";

    const currentT = () =>
      paused
        ? STATIC_T
        : performance.now() - (epochRef.current ?? performance.now());

    const rebuild = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgRef.current = buildBackground(w, h, dpr, fontFamily(), background);
      // Redraw after resize to prevent canvas clear from blanking content
      drawFrame(ctx, bgRef.current, w, h, currentT(), paused, spotlightRef.current, dpr);
    };
    rebuild();
    const ro = new ResizeObserver(rebuild);
    ro.observe(canvas);

    // next/font families resolve asynchronously; rebuild once so canvas labels
    // never keep a fallback face permanently (matters most for paused frames)
    document.fonts.ready.then(() => {
      if (!disposed) rebuild();
    });

    if (paused) {
      return () => { disposed = true; ro.disconnect(); };
    }
    let raf = 0;
    const tick = (now: number) => {
      if (epochRef.current === null) epochRef.current = now;
      if (bgRef.current) {
        drawFrame(
          ctx, bgRef.current, canvas.clientWidth, canvas.clientHeight,
          now - epochRef.current, false, spotlightRef.current, dprRef.current,
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { disposed = true; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [paused, epochRef, background]);

  // Controlled spotlight: while paused there is no running RAF loop, so a
  // spotlightId change needs its own one-shot redraw of the static frame.
  useEffect(() => {
    if (!paused) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const bg = bgRef.current;
    if (!canvas || !ctx || !bg) return;
    drawFrame(ctx, bg, canvas.clientWidth, canvas.clientHeight, STATIC_T, true, spotlightId, dprRef.current);
  }, [spotlightId, paused]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
