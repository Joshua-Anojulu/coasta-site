"use client";
import { useEffect, useState } from "react";
import { CAMERAS } from "@/lib/dfw/geometry";

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
    <section className="relative px-5 py-32 md:px-10 md:py-44">
      <p className="text-xs uppercase tracking-[0.25em] text-signal">The blind spot</p>
      <div className="mt-6 grid gap-12 md:grid-cols-[1.2fr_1fr]">
        <h2 className="font-display max-w-xl text-3xl uppercase leading-tight md:text-5xl">
          Texas roads are covered in cameras. Almost nobody is watching them.
        </h2>
        <p className="self-end text-sm leading-relaxed text-fog-dim">
          Traffic cameras stream around the clock, but a human control room can only
          look at a handful of feeds at a time. Crashes sit undiscovered. Stalled cars
          block lanes for miles of backup. Coasta watches every feed at once.
        </p>
      </div>
      <div className="mt-16 grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
        {TILES.map((id, i) => (
          <div
            key={id}
            className={`aspect-video border p-1.5 text-[9px] transition-colors duration-700 [transition-timing-function:var(--ease-signal)] ${
              i === lit
                ? "border-signal/60 bg-signal/10 text-signal"
                : "border-white/5 bg-surface text-fog-dim/40"
            }`}
          >
            {id}
          </div>
        ))}
      </div>
    </section>
  );
}
