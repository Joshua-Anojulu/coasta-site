"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { getReplayState, type ReplayState } from "@/lib/replay/engine";
import { TIMELINE } from "@/lib/replay/timeline";
import { CAMERAS, project } from "@/lib/dfw/geometry";
import { nearestRouteRef } from "@/lib/dfw/routes";
import { spotlightReducer, initialSpotlightState, deriveSpotlightId } from "@/lib/hero/spotlight";
import { placeCard, type Size } from "@/lib/hero/placeCard";
import MapCanvas from "./MapCanvas";
import AlertCard from "./AlertCard";
import Nav from "./Nav";

// Nav is fixed, full-width, h-16 (docs/DESIGN.md) - a constant occlusion
// band, not something that needs measuring.
const NAV_HEIGHT = 64;
// Reserved regardless of whether AlertCard is currently mounted (it
// mounts/unmounts with replay phase, so a measured rect would read 0x0 for
// much of the loop) - mirrors AlertCard's right-5/top-24/w-72 placement
// with a conservative max-height estimate for its tallest content state.
// Widened to cover the card at BOTH breakpoints (right-5 mobile, md:right-10):
// right edge inset 20px, width spans the extra 20px of the md offset.
const ALERT_CARD_RESERVED = { top: 96, right: 20, width: 308, height: 200 };
const HOTSPOT_SIZE = 44;
const CARD_SIZE: Size = { width: 224, height: 108 };

type Rect = { top: number; left: number; width: number; height: number };
type Hotspot = { id: string; x: number; y: number };

function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

export default function Hero() {
  const epochRef = useRef<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [state, setState] = useState<ReplayState>(() => getReplayState(TIMELINE, 0));

  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [spotlight, dispatch] = useReducer(spotlightReducer, initialSpotlightState);
  const spotlightId = deriveSpotlightId(spotlight);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const cardRafRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      setState(getReplayState(TIMELINE, 12000)); // static confirmed frame
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (epochRef.current === null) epochRef.current = now;
      const next = getReplayState(TIMELINE, now - epochRef.current);
      setState((prev) =>
        prev.phase !== next.phase ||
        prev.confidence !== next.confidence ||
        prev.event?.id !== next.event?.id
          ? next
          : prev
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Recomputes hotspot positions from the same project() output MapCanvas
  // renders from, then drops any hotspot whose >=44x44 rect intersects the
  // nav bar, the reserved AlertCard rect, or the measured headline/CTA
  // block - and any camera whose projected position falls outside the
  // visible canvas (the portrait focus window crops Fort Worth).
  const recomputeHotspots = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    setViewport({ width: w, height: h });
    if (w === 0 || h === 0) return;

    const headlineBox = headlineRef.current?.getBoundingClientRect();
    const headlineRel: Rect | null = headlineBox
      ? {
          top: headlineBox.top - rect.top,
          left: headlineBox.left - rect.left,
          width: headlineBox.width,
          height: headlineBox.height,
        }
      : null;

    const alertRect: Rect = {
      top: ALERT_CARD_RESERVED.top,
      left: w - ALERT_CARD_RESERVED.right - ALERT_CARD_RESERVED.width,
      width: ALERT_CARD_RESERVED.width,
      height: ALERT_CARD_RESERVED.height,
    };
    const navRect: Rect = { top: 0, left: 0, width: w, height: NAV_HEIGHT };

    const next: Hotspot[] = [];
    for (const cam of CAMERAS) {
      const [x, y] = project(cam.lonlat, w, h);
      if (x < 0 || x > w || y < 0 || y > h) continue;
      const hotspotRect: Rect = {
        top: y - HOTSPOT_SIZE / 2,
        left: x - HOTSPOT_SIZE / 2,
        width: HOTSPOT_SIZE,
        height: HOTSPOT_SIZE,
      };
      if (rectsIntersect(hotspotRect, navRect)) continue;
      if (rectsIntersect(hotspotRect, alertRect)) continue;
      if (headlineRel && rectsIntersect(hotspotRect, headlineRel)) continue;
      next.push({ id: cam.id, x, y });
    }
    setHotspots(next);
  }, []);

  useEffect(() => {
    recomputeHotspots();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(recomputeHotspots);
    ro.observe(container);
    return () => ro.disconnect();
  }, [recomputeHotspots]);

  // rAF-throttled card placement: recomputed whenever the spotlight or
  // hotspot layout changes, cancelling any pending frame first.
  useEffect(() => {
    if (!spotlightId || !viewport.width) {
      setCardPos(null);
      return;
    }
    const hotspot = hotspots.find((h) => h.id === spotlightId);
    if (!hotspot) {
      setCardPos(null);
      return;
    }
    cancelAnimationFrame(cardRafRef.current);
    cardRafRef.current = requestAnimationFrame(() => {
      setCardPos(placeCard({ x: hotspot.x, y: hotspot.y }, CARD_SIZE, viewport));
    });
    return () => cancelAnimationFrame(cardRafRef.current);
  }, [spotlightId, hotspots, viewport]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") dispatch({ type: "escape" });
    }
    function onPointerDown(e: PointerEvent) {
      if (groupRef.current?.contains(e.target as Node)) return;
      dispatch({ type: "outside-tap" });
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const spotlightCamera = spotlightId ? CAMERAS.find((c) => c.id === spotlightId) : undefined;
  const spotlightRoute = spotlightCamera ? nearestRouteRef(spotlightCamera.lonlat) : null;

  return (
    <header ref={containerRef} className="relative min-h-[100dvh] overflow-hidden">
      <Nav />
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero-sky)" }} />
      <MapCanvas
        epochRef={epochRef}
        paused={reduced}
        background="transparent"
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute right-5 top-24 md:right-10">
        <AlertCard state={state} />
      </div>
      <div ref={headlineRef} className="absolute bottom-12 left-5 max-w-2xl md:left-10">
        <h1 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-bold leading-[1.05] tracking-[-0.01em]">
          Every camera.<br />Now a sensor.
        </h1>
        <p className="mt-5 max-w-md text-sm text-ink-2">
          Coasta reads DFW traffic cameras with AI and warns you about police, crashes, and hazards before you reach them.
        </p>
        <a
          href="#waitlist"
          className="mt-8 inline-block bg-signal px-7 py-3 text-sm font-medium text-ground transition-transform duration-300 [transition-timing-function:var(--ease-signal)] hover:-translate-y-0.5"
        >
          Join the DFW waitlist
        </a>
      </div>

      {/* Hotspot layer: all pointer/keyboard input for the spotlight lives
          here; MapCanvas stays aria-hidden and only renders the highlight
          for the controlled spotlightId. Rendered after the CTA in DOM
          order so keyboard users reach the primary CTA first. */}
      <div ref={groupRef} role="group" aria-label="Camera network (simulated)" className="absolute inset-0">
        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-label={`Camera ${h.id}, simulated feed`}
            aria-describedby={h.id === spotlightId ? "hero-spotlight-card" : undefined}
            aria-pressed={spotlight.pinnedId === h.id}
            className="absolute rounded-full outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-signal)]"
            style={{
              left: h.x,
              top: h.y,
              width: HOTSPOT_SIZE,
              height: HOTSPOT_SIZE,
              transform: "translate(-50%, -50%)",
            }}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") dispatch({ type: "hover", id: h.id });
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") dispatch({ type: "unhover", id: h.id });
            }}
            onPointerCancel={() => dispatch({ type: "pointercancel" })}
            onFocus={() => dispatch({ type: "focus", id: h.id })}
            onBlur={() => dispatch({ type: "blur", id: h.id })}
            onClick={() => dispatch({ type: "toggle-pin", id: h.id })}
          />
        ))}
      </div>

      {spotlightCamera && cardPos && (
        <div
          id="hero-spotlight-card"
          className="pointer-events-none absolute w-56 rounded-lg border border-border bg-ground p-3 shadow-elevated"
          style={{ left: cardPos.x, top: cardPos.y }}
        >
          <div className="font-mono text-[10px] text-ink-2">{spotlightCamera.id}</div>
          <div className="mt-1.5 text-xs text-ink">{spotlightRoute ?? "DFW metroplex"}</div>
          <div className="mt-1 text-[11px] text-ink-2">
            Simulated feed <span className="border border-border px-1 py-0.5 font-mono text-[9px]">SIM</span>
          </div>
        </div>
      )}
    </header>
  );
}
