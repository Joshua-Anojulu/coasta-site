import type { ReplayEvent } from "./engine";

export const TIMELINE: ReplayEvent[] = [
  {
    id: "evt-police-highfive", camId: "CAM-114", kind: "police",
    label: "Police vehicle", road: "US-75 at I-635 (High Five)",
    startMs: 2000, durationMs: 12000, lonlat: [-96.764522, 32.92343],
  },
  {
    id: "evt-stall-i30", camId: "CAM-207", kind: "stall",
    label: "Stalled vehicle, right shoulder", road: "I-30 E near Fair Park",
    startMs: 18000, durationMs: 12000, lonlat: [-96.771371, 32.781024],
  },
  {
    id: "evt-crash-i35e", camId: "CAM-052", kind: "crash",
    label: "Multi-vehicle crash", road: "I-35E N near Oak Lawn",
    startMs: 34000, durationMs: 12000, lonlat: [-96.832104, 32.802816],
  },
];
