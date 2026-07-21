export type EventKind = "police" | "crash" | "stall";

export interface ReplayEvent {
  id: string;
  camId: string;
  kind: EventKind;
  label: string;
  road: string;
  startMs: number;
  durationMs: number;
  lonlat: [number, number];
}

export type Phase = "idle" | "pulse" | "detecting" | "confirmed";

export interface ReplayState {
  event: ReplayEvent | null;
  phase: Phase;
  confidence: number;
  loopMs: number;
}

const PULSE_END = 0.15;
const DETECT_END = 0.7;
const CONF_START = 42;
const CONF_END = 96;
const TAIL_MS = 2000;

export function loopDuration(timeline: ReplayEvent[]): number {
  return Math.max(...timeline.map((e) => e.startMs + e.durationMs)) + TAIL_MS;
}

export function getReplayState(timeline: ReplayEvent[], tMs: number): ReplayState {
  const loopMs = loopDuration(timeline);
  const t = ((tMs % loopMs) + loopMs) % loopMs;
  const event = timeline.find((e) => t >= e.startMs && t < e.startMs + e.durationMs) ?? null;
  if (!event) return { event: null, phase: "idle", confidence: 0, loopMs };
  const p = (t - event.startMs) / event.durationMs;
  if (p < PULSE_END) return { event, phase: "pulse", confidence: 0, loopMs };
  if (p < DETECT_END) {
    const ramp = (p - PULSE_END) / (DETECT_END - PULSE_END);
    return {
      event,
      phase: "detecting",
      confidence: Math.min(CONF_END - 1, Math.round(CONF_START + ramp * (CONF_END - CONF_START))),
      loopMs,
    };
  }
  return { event, phase: "confirmed", confidence: CONF_END, loopMs };
}
