"use client";
import { useEffect, useRef, useState } from "react";
import { getReplayState, type ReplayState } from "@/lib/replay/engine";
import { TIMELINE } from "@/lib/replay/timeline";
import MapCanvas from "./MapCanvas";
import AlertCard from "./AlertCard";
import Nav from "./Nav";

export default function Hero() {
  const epochRef = useRef<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [state, setState] = useState<ReplayState>(() => getReplayState(TIMELINE, 0));

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

  return (
    <header className="relative min-h-[100dvh] overflow-hidden">
      <Nav />
      <MapCanvas epochRef={epochRef} paused={reduced} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-asphalt via-transparent to-asphalt/60" />
      <div className="absolute right-5 top-24 md:right-10">
        <AlertCard state={state} />
      </div>
      <div className="absolute bottom-12 left-5 max-w-5xl md:left-10">
        <h1 className="font-display text-[min(9vw,6rem)] uppercase leading-[0.95] whitespace-nowrap">
          Every camera.<br />Now a sensor.
        </h1>
        <p className="mt-5 max-w-md text-sm text-fog-dim">
          Coasta reads DFW traffic cameras with AI and warns you about police, crashes, and hazards before you reach them.
        </p>
        <a
          href="#waitlist"
          className="mt-8 inline-block bg-signal px-7 py-3 text-sm font-medium uppercase text-asphalt transition-transform duration-300 [transition-timing-function:var(--ease-signal)] hover:-translate-y-0.5"
        >
          Join the DFW waitlist
        </a>
      </div>
    </header>
  );
}
