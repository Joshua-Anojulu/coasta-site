"use client";
import { useRef } from "react";
import MapCanvas from "./MapCanvas";
import { TIMELINE } from "@/lib/replay/timeline";

const KIND_COLOR = { police: "text-signal", crash: "text-alert", stall: "text-signal" } as const;

export default function PhonePreview() {
  const epochRef = useRef<number | null>(null);
  return (
    <section className="grid gap-16 px-5 py-32 md:grid-cols-2 md:items-center md:px-10 md:py-44">
      <div>
        <h2 className="font-display max-w-md text-3xl uppercase leading-tight md:text-5xl">
          The road, briefed to your pocket
        </h2>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-fog-dim">
          Open Coasta before you drive. Police sightings, crashes, and stalled
          vehicles on your route show up as alerts with distance and direction,
          sourced from cameras, not crowd reports.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <li><span className="text-signal">01</span> Live hazard map of DFW</li>
          <li><span className="text-signal">02</span> Route monitoring with push alerts</li>
          <li><span className="text-signal">03</span> Camera-verified, confidence-scored</li>
        </ul>
      </div>
      <div className="justify-self-center md:-rotate-2">
        <div className="w-72 rounded-[2.5rem] border border-white/15 bg-surface p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-asphalt">
            <div className="flex items-center justify-between px-4 pt-4 text-[10px] text-fog-dim">
              <span>COASTA</span><span className="text-signal">DFW / demo</span>
            </div>
            <MapCanvas epochRef={epochRef} paused className="h-56 w-full" />
            <div className="space-y-2 px-3 pb-5">
              {TIMELINE.map((e) => (
                <div key={e.id} className="rounded-lg border border-white/10 bg-surface p-2.5 text-[11px]">
                  <span className={KIND_COLOR[e.kind]}>{e.label}</span>
                  <div className="mt-0.5 text-fog-dim">{e.road}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
