import { describe, expect, it } from "vitest"
import {
  LANE,
  lateralOf,
  occupantsAt,
  oncomingAt,
  TRAFFIC,
  type DriveEvent,
} from "@/components/motion/traffic"

/** The same four hazards DriveChapter renders. */
const EVENTS: readonly DriveEvent[] = [
  { at: 300, kind: "police", label: "Police vehicle", lane: 1 },
  { at: 640, kind: "crash", label: "Crash", lane: -1 },
  { at: 940, kind: "stall", label: "Stalled vehicle", lane: 1 },
  { at: 1220, kind: "debris", label: "Debris", lane: 0 },
]

const RUN = 1400
/**
 * Beyond this a vehicle is under about twenty pixels wide and two shapes
 * overlapping there is a couple of pixels of red, not a lorry driving through a
 * car. Inside it, an overlap is exactly the artefact this test exists to catch.
 */
const VISIBLE = 90

describe("the drive is physically possible", () => {
  it("never puts two vehicles in the same place, at either traffic density", () => {
    const failures: string[] = []

    for (const density of [1, 2]) {
      for (let travelled = 0; travelled <= RUN; travelled += 1) {
        const here = occupantsAt(travelled, EVENTS, density)
        for (let i = 0; i < here.length; i += 1) {
          for (let j = i + 1; j < here.length; j += 1) {
            const a = here[i]!
            const b = here[j]!
            // A pile-up is two vehicles that are supposed to be touching.
            if (a.group !== undefined && a.group === b.group) continue
            if (Math.min(a.z, b.z) > VISIBLE) continue
            const sideBySide = Math.abs(a.lateral - b.lateral) < (a.widthM + b.widthM) / 2
            const noseToTail = Math.abs(a.z - b.z) < (a.lengthM + b.lengthM) / 2
            if (sideBySide && noseToTail) {
              failures.push(
                `at ${travelled}m (density ${density}): ${a.label} and ${b.label} overlap ` +
                  `(z ${a.z.toFixed(1)}/${b.z.toFixed(1)}, lateral ${a.lateral.toFixed(2)}/${b.lateral.toFixed(2)})`,
              )
            }
          }
        }
      }
    }

    expect(failures.slice(0, 8)).toEqual([])
  })

  it("keeps every vehicle in a lane centre, never straddling a lane line", () => {
    for (const v of TRAFFIC) {
      expect(Math.abs(v.lane), `${v.body}@${v.at} is between lanes`).toBeLessThanOrEqual(1)
      expect(Number.isInteger(v.lane), `${v.body}@${v.at} is between lanes`).toBe(true)
    }
  })

  it("never lets a vehicle catch the one ahead of it in its own lane", () => {
    // Within a lane, speeds must not fall as distance grows. If a nearer
    // vehicle were faster than one further up the same lane it would run into
    // the back of it somewhere in the run, which is the failure the overlap
    // scan catches after the fact and this one catches in the data.
    for (const lane of [-1, 0, 1]) {
      const inLane = TRAFFIC.filter((v) => v.lane === lane)
      for (let i = 1; i < inLane.length; i += 1) {
        const behind = inLane[i - 1]!
        const ahead = inLane[i]!
        expect(
          ahead.speed,
          `${ahead.body}@${ahead.at} is slower than ${behind.body}@${behind.at} behind it in lane ${lane}`,
        ).toBeGreaterThanOrEqual(behind.speed)
      }
    }
  })

  it("leaves our own lane empty, because anything in it we would drive into", () => {
    expect(TRAFFIC.filter((v) => v.lane === 0)).toEqual([])
  })

  it("moves the traffic in the blocked lane over before we get there", () => {
    const crash = EVENTS.find((e) => e.kind === "crash")!
    // A left-lane car 40m in front of us has cleared the crash lane by the time
    // it is 45m short of the crash, which is well before we start moving.
    expect(lateralOf(-1, crash.at - 40, EVENTS)).toBeCloseTo(0, 1)
    expect(lateralOf(-1, crash.at - 300, EVENTS)).toBeCloseTo(-LANE, 1)
    expect(lateralOf(-1, crash.at + 200, EVENTS)).toBeCloseTo(-LANE, 1)
    // And nothing moves for a hazard that is on the shoulder rather than in a lane.
    expect(lateralOf(1, 300, EVENTS)).toBeCloseTo(LANE, 5)
    expect(lateralOf(1, 940, EVENTS)).toBeCloseTo(LANE, 5)
  })

  it("puts stopped vehicles far enough onto the shoulder to clear a lorry", () => {
    // The shoulder hazards used to sit exactly on the edge line, 1.8m from the
    // near lane, which a 2.55m lorry and a 1.84m saloon cannot both fit beside.
    const shoulder = occupantsAt(200, EVENTS, 2).find((o) => o.label === "police")
    expect(shoulder).toBeDefined()
    expect(Math.abs(shoulder!.lateral) - LANE).toBeGreaterThan((2.55 + 1.84) / 2)
  })

  it("keeps something in the near field almost the whole way down", () => {
    // The near field used to be held by a lorry pinned at a fixed distance. It
    // is held by real traffic now, so this is worth pinning down: an empty
    // foreground for a long stretch is the failure that change could cause.
    let occupied = 0
    let longestGap = 0
    let gap = 0
    for (let travelled = 0; travelled <= RUN; travelled += 1) {
      const near = occupantsAt(travelled, EVENTS, 2).filter((o) => o.z < 60)
      if (near.length > 0) {
        occupied += 1
        gap = 0
      } else {
        gap += 1
        longestGap = Math.max(longestGap, gap)
      }
    }
    expect(occupied / (RUN + 1)).toBeGreaterThan(0.95)
    expect(longestGap).toBeLessThan(60)
  })
})

describe("the far carriageway", () => {
  it("never lets two oncoming vehicles occupy the same place", () => {
    // They recycle on a fixed period at more than twice our closing speed, so a
    // spacing mistake here shows up as two headlight pairs merging into one.
    for (let travelled = 0; travelled <= RUN; travelled += 1) {
      const here = oncomingAt(travelled)
      for (let i = 0; i < here.length; i += 1) {
        for (let j = i + 1; j < here.length; j += 1) {
          const a = here[i]!
          const b = here[j]!
          if (Math.abs(a.lateral - b.lateral) > 2) continue
          expect(
            Math.abs(a.z - b.z),
            `oncoming pair overlaps at ${travelled}m (z ${a.z.toFixed(1)}/${b.z.toFixed(1)})`,
          ).toBeGreaterThan(6)
        }
      }
    }
  })

  it("keeps the far carriageway clear of ours", () => {
    // The median has to be wide enough that an oncoming vehicle can never be
    // mistaken for something in our outside lane.
    for (let travelled = 0; travelled <= RUN; travelled += 20) {
      for (const on of oncomingAt(travelled)) {
        for (const ours of occupantsAt(travelled, EVENTS, 2)) {
          expect(Math.abs(on.lateral - ours.lateral)).toBeGreaterThan(3.5)
        }
      }
    }
  })
})
