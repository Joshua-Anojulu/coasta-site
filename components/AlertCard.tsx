"use client";
import type { ReplayState } from "@/lib/replay/engine";

const KIND_LABEL = { police: "POLICE", crash: "CRASH", stall: "STALL" } as const;

export default function AlertCard({ state }: { state: ReplayState }) {
  const { event, phase, confidence } = state;
  if (!event || phase === "idle" || phase === "pulse") return null;
  const confirmed = phase === "confirmed";
  const color = confirmed ? "text-alert" : "text-signal";
  const barColor = confirmed ? "bg-alert" : "bg-signal";
  return (
    <div className="w-72 rounded-xl border border-white/10 bg-white/5 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="rounded-[calc(0.75rem-0.375rem)] bg-surface p-4">
        <div className="flex items-center justify-between text-[10px] text-fog-dim">
          <span>{event.camId}</span>
          <span className="border border-white/15 px-1.5 py-0.5">SIM</span>
        </div>
        <div className={`mt-3 font-display text-xl uppercase ${color}`}>
          {KIND_LABEL[event.kind]} {confirmed ? "CONFIRMED" : "DETECTING"}
        </div>
        <div className="mt-1 text-xs text-fog-dim">{event.label}</div>
        <div className="mt-0.5 text-xs text-fog">{event.road}</div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${barColor} transition-[width] duration-200 [transition-timing-function:var(--ease-signal)]`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className={`text-xs tabular-nums ${color}`}>{confidence}%</span>
        </div>
      </div>
    </div>
  );
}
