import { describe, it, expect } from "vitest";
import { getReplayState, loopDuration, type ReplayEvent } from "@/lib/replay/engine";

const T: ReplayEvent[] = [
  { id: "e1", camId: "CAM-114", kind: "police", label: "Police vehicle", road: "US-75 at I-635", startMs: 2000, durationMs: 10000, lonlat: [-96.769, 32.924] },
  { id: "e2", camId: "CAM-203", kind: "stall", label: "Stalled vehicle", road: "I-30 E", startMs: 16000, durationMs: 10000, lonlat: [-96.9, 32.75] },
];

describe("loopDuration", () => {
  it("is last event end plus 2s of idle", () => expect(loopDuration(T)).toBe(28000));
});

describe("getReplayState", () => {
  it("is idle before the first event", () => {
    const s = getReplayState(T, 500);
    expect(s.phase).toBe("idle");
    expect(s.event).toBeNull();
  });
  it("pulses during the first 15% of an event", () => {
    expect(getReplayState(T, 2500).phase).toBe("pulse");
  });
  it("ramps confidence from 42 while detecting", () => {
    const s = getReplayState(T, 2000 + 1500 + 1); // just past pulse
    expect(s.phase).toBe("detecting");
    expect(s.confidence).toBeGreaterThanOrEqual(42);
    expect(s.confidence).toBeLessThan(96);
  });
  it("confirms at 96 after 70% of the event", () => {
    const s = getReplayState(T, 2000 + 8000);
    expect(s.phase).toBe("confirmed");
    expect(s.confidence).toBe(96);
    expect(s.event?.id).toBe("e1");
  });
  it("loops: t + loopMs gives the same state", () => {
    expect(getReplayState(T, 5000)).toEqual(getReplayState(T, 5000 + 28000));
  });
});
