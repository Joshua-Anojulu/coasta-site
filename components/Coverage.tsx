"use client";
import { useRef } from "react";
import MapCanvas from "./MapCanvas";

const QUEUE = [
  { city: "Dallas / Fort Worth", status: "BUILDING NOW", live: true },
  { city: "Houston", status: "QUEUED", live: false },
  { city: "Austin", status: "QUEUED", live: false },
  { city: "San Antonio", status: "QUEUED", live: false },
];

export default function Coverage() {
  const epochRef = useRef<number | null>(null);
  return (
    <section className="grid gap-12 px-5 py-32 md:grid-cols-[1.4fr_1fr] md:px-10 md:py-44">
      <div className="relative min-h-72 overflow-hidden rounded-xl border border-white/5 bg-surface/50">
        <MapCanvas epochRef={epochRef} paused className="absolute inset-0 h-full w-full" />
        <span className="absolute left-4 top-4 text-[10px] uppercase text-fog-dim">DFW metroplex</span>
      </div>
      <div className="self-center">
        <h2 className="font-display text-3xl uppercase leading-tight md:text-5xl">DFW first. Then your city.</h2>
        <ul className="mt-10 space-y-4 text-sm">
          {QUEUE.map((q) => (
            <li key={q.city} className="flex items-center justify-between border-b border-white/5 pb-3">
              <span>{q.city}</span>
              <span className={q.live ? "text-signal" : "text-fog-dim"}>{q.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
