"use client";
import type { ReplayState } from "@/lib/replay/engine";

const KIND_LABEL = { police: "Police", crash: "Crash", stall: "Stall" } as const;

export default function AlertCard({ state }: { state: ReplayState }) {
  const { event, phase, confidence } = state;
  if (!event || phase === "idle" || phase === "pulse") return null;
  const confirmed = phase === "confirmed";
  const color = confirmed ? "text-confirmed" : "text-signal";
  const barColor = confirmed ? "bg-confirmed" : "bg-signal";
  return (
    <div className="w-72 rounded-xl border border-border bg-ground p-4 shadow-elevated">
      <div className="flex items-center justify-between font-mono text-[10px] text-ink-2">
        <span>{event.camId}</span>
        <span className="border border-border px-1.5 py-0.5">SIM</span>
      </div>
      <div className={`mt-3 text-xl font-semibold tracking-[-0.01em] ${color}`}>
        {KIND_LABEL[event.kind]} {confirmed ? "confirmed" : "detecting"}
      </div>
      <div className="mt-1 text-xs text-ink-2">{event.label}</div>
      <div className="mt-0.5 text-xs text-ink">{event.road}</div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full ${barColor} transition-[width] duration-200 [transition-timing-function:var(--ease-signal)]`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span className={`font-mono text-xs tabular-nums ${color}`}>{confidence}%</span>
      </div>
    </div>
  );
}
