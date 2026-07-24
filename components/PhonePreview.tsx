"use client";
import { useRef } from "react";
import MapCanvas from "./MapCanvas";
import { TIMELINE } from "@/lib/replay/timeline";
import Reveal from "./Reveal";

// Categorical red is retired with the amber palette (Josh sign-off, PLAN.md
// step 4): all kinds render in the brand blue; red is reserved for active
// confirmed states only (Hero/Pipeline cards).
const KIND_COLOR = { police: "text-signal", crash: "text-signal", stall: "text-signal" } as const;

const BULLETS = [
  { n: "01", text: "Hazard map of DFW, briefed before you drive" },
  { n: "02", text: "Route alerts pushed before you drive" },
  { n: "03", text: "Camera-verified, confidence-scored" },
] as const;

export default function PhonePreview() {
  const epochRef = useRef<number | null>(null);
  return (
    <section className="mx-auto grid max-w-6xl gap-16 px-5 py-32 md:grid-cols-2 md:items-center md:px-10 md:py-44">
      <div>
        <Reveal>
          <h2 className="font-display max-w-md text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold leading-tight tracking-[-0.01em]">
            The road, briefed to your pocket
          </h2>
        </Reveal>
        <Reveal index={1}>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-2">
            Open Coasta before you drive. Police sightings, crashes, and stalled
            vehicles on your route show up as alerts with distance and direction,
            sourced from cameras, not crowd reports.
          </p>
        </Reveal>
        <ul className="mt-8 space-y-3 text-sm">
          {BULLETS.map((item, i) => (
            <Reveal as="li" index={i + 2} key={item.n}>
              <span className="text-signal">{item.n}</span> {item.text}
            </Reveal>
          ))}
        </ul>
      </div>
      <Reveal className="justify-self-center md:-rotate-2">
        <div className="w-72 rounded-[2.5rem] border border-border bg-panel p-2 shadow-elevated">
          <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-ground">
            <div className="flex items-center justify-between px-4 pt-4 font-mono text-[10px] text-ink-2">
              <span>COASTA</span><span className="text-signal">DFW / demo</span>
            </div>
            <MapCanvas epochRef={epochRef} paused className="h-56 w-full" />
            <div className="space-y-2 px-3 pb-5">
              {TIMELINE.map((e) => (
                <div key={e.id} className="rounded-lg border border-border bg-ground p-2.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className={KIND_COLOR[e.kind]}>{e.label}</span>
                    <span className="border border-border px-1.5 py-0.5 text-[9px] text-ink-2">SIM</span>
                  </div>
                  <div className="mt-0.5 text-ink-2">{e.road}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
