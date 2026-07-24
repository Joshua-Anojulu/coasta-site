"use client";
import { useEffect, useState } from "react";
import { CAMERAS } from "@/lib/dfw/geometry";
import Reveal from "./Reveal";

const TILES = Array.from({ length: 48 }, (_, i) => {
  const cam = CAMERAS[i % CAMERAS.length];
  return `${cam.id.replace("CAM", "FEED")}-${String(i).padStart(2, "0")}`;
});

export default function BlindSpot() {
  const [lit, setLit] = useState(7);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setLit(Math.floor(Math.random() * TILES.length)), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="relative px-5 py-32 md:px-10 md:py-44"
      style={{ background: "var(--gradient-blindspot-pipeline)" }}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-medium text-signal">The blind spot</p>
        </Reveal>
        <div className="mt-6 grid gap-12 md:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <h2 className="font-display max-w-xl text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold leading-tight tracking-[-0.01em]">
              Texas roads are covered in cameras. Almost nobody is watching them.
            </h2>
          </Reveal>
          <Reveal index={1}>
            <p className="self-end text-sm leading-relaxed text-ink-2">
              Traffic cameras stream around the clock, but a human control room can only
              look at a handful of feeds at a time. Crashes sit undiscovered. Stalled cars
              block lanes for miles of backup. Coasta watches every feed at once.
            </p>
          </Reveal>
        </div>
        <Reveal index={2} className="relative mt-16 overflow-hidden">
          <div className="relative grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8" aria-hidden="true">
            <div className="blindspot-scan pointer-events-none absolute inset-0 z-10" />
            {TILES.map((id, i) => (
              <div
                key={id}
                className={`aspect-video border p-1.5 font-mono text-[9px] transition-colors duration-700 [transition-timing-function:var(--ease-signal)] ${
                  i === lit
                    ? "tile-pulse border-signal/60 bg-signal/10 text-signal"
                    : "border-border bg-panel text-ink-2/40"
                }`}
              >
                {id}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
