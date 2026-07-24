"use client";
import { useRef } from "react";
import MapCanvas from "./MapCanvas";
import Reveal from "./Reveal";

// Statuses are enumerated coverage statuses (docs/DESIGN.md section 5's
// uppercase exception list) and stay uppercase + mono.
const QUEUE = [
  { city: "Dallas / Fort Worth", status: "BUILDING NOW", live: true },
  { city: "Houston", status: "QUEUED", live: false },
  { city: "Austin", status: "QUEUED", live: false },
  { city: "San Antonio", status: "QUEUED", live: false },
];

export default function Coverage() {
  const epochRef = useRef<number | null>(null);
  return (
    <section
      id="coverage"
      className="mx-auto grid max-w-6xl scroll-mt-24 gap-12 px-5 py-32 md:grid-cols-[1.4fr_1fr] md:px-10 md:py-44"
    >
      <Reveal className="relative min-h-72 overflow-hidden rounded-xl border border-border bg-panel">
        <MapCanvas epochRef={epochRef} paused className="absolute inset-0 h-full w-full" />
        <span className="absolute left-4 top-4 text-[10px] text-ink-2">DFW metroplex</span>
      </Reveal>
      <div className="self-center">
        <Reveal index={1}>
          <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold leading-tight tracking-[-0.01em]">
            DFW first. Then your city.
          </h2>
        </Reveal>
        <ul className="mt-10 space-y-4 text-sm">
          {QUEUE.map((q, i) => (
            <Reveal
              as="li"
              index={i + 2}
              key={q.city}
              className="flex items-center justify-between border-b border-border pb-3"
            >
              <span>{q.city}</span>
              <span className={`font-mono ${q.live ? "text-signal" : "text-ink-2"}`}>{q.status}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
