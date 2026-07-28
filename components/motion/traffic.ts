/**
 * Where everything on the carriageway is, at a given point in the drive.
 *
 * Split out of DriveRoad and kept free of canvas so it can be checked without
 * one. The traffic table is hand-tuned data, and hand-tuned data drifts: a
 * vehicle that is fractionally too fast will drive through a stopped one four
 * hundred metres later, which nothing in a type system catches and which is
 * only visible if you happen to scroll past that exact point. See
 * tests/drive-traffic.test.ts, which walks the whole run and asserts nobody
 * ever occupies the same space as anybody else.
 */

import { PROFILES, type BodyType } from "./drawScene"

export type DriveEvent = {
  readonly at: number
  readonly lane: -1 | 0 | 1
  readonly kind: "police" | "crash" | "stall" | "debris"
  readonly label: string
}

/** Lane width. Lane centres are -LANE, 0 and +LANE; nothing sits between them. */
export const LANE = 3.6
/** Where a stopped vehicle sits, straddling the edge line with its nearside on
 *  the hard shoulder. Far enough out that a lorry in the near lane clears it. */
export const SHOULDER = LANE * 1.72
/** Traffic beyond this is too small to be worth drawing. */
export const TRAFFIC_FAR = 221
/** Nearer than this and it has gone past the camera. */
export const NEAR_CULL = 2.2

export type TrafficEntry = {
  /** Metres down the run where it starts. */
  readonly at: number
  readonly lane: -1 | 0 | 1
  /** Its speed as a fraction of ours, so we close on it at (1 - speed). */
  readonly speed: number
  readonly body: BodyType
  /** Picks its paint colour. */
  readonly variant: number
}

/**
 * The corridor's traffic.
 *
 * Three rules, and between them they make the road physically possible:
 *
 * 1. Lane centres only. Lanes used to include 0.35 and -0.35, which put
 *    vehicles 1.26m off centre: two lanes 2.34m apart carrying vehicles up to
 *    2.55m wide, so a lorry and a car in adjacent "lanes" drove through each
 *    other every time they drew level.
 * 2. Within a lane, speed never falls as distance grows, so nobody ever catches
 *    the vehicle in front of them.
 * 3. Nothing runs in lane 0. That is our lane, and anything in it we would
 *    simply drive into.
 *
 * The right lane carries the heavy, slow traffic and we overtake it steadily;
 * the left lane runs faster and we pass it more gently. Nothing holds station.
 * There used to be a lead lorry pinned 27m ahead for the whole page, and it was
 * both the thing that looked pasted on and the thing every left-lane car drove
 * straight through.
 */
export const TRAFFIC: readonly TrafficEntry[] = [
  // Right lane: lorries, vans and pickups, slowest of the three.
  { at: 45, body: "lorry", lane: 1, speed: 0.28, variant: 2 },
  { at: 105, body: "van", lane: 1, speed: 0.3, variant: 4 },
  { at: 170, body: "pickup", lane: 1, speed: 0.32, variant: 9 },
  { at: 245, body: "lorry", lane: 1, speed: 0.34, variant: 0 },
  { at: 320, body: "sedan", lane: 1, speed: 0.36, variant: 5 },
  { at: 400, body: "van", lane: 1, speed: 0.38, variant: 2 },
  { at: 480, body: "lorry", lane: 1, speed: 0.4, variant: 8 },
  { at: 565, body: "suv", lane: 1, speed: 0.42, variant: 1 },
  { at: 655, body: "van", lane: 1, speed: 0.44, variant: 3 },
  { at: 745, body: "lorry", lane: 1, speed: 0.46, variant: 2 },
  { at: 840, body: "pickup", lane: 1, speed: 0.48, variant: 6 },
  { at: 940, body: "sedan", lane: 1, speed: 0.5, variant: 4 },
  { at: 1045, body: "lorry", lane: 1, speed: 0.52, variant: 0 },
  { at: 1155, body: "van", lane: 1, speed: 0.54, variant: 7 },
  { at: 1270, body: "suv", lane: 1, speed: 0.56, variant: 5 },
  { at: 1385, body: "sedan", lane: 1, speed: 0.58, variant: 1 },

  // Left lane: cars, quicker, and the lane the crash blocks. They move over
  // for it on their own account, well before we do.
  { at: 80, body: "sedan", lane: -1, speed: 0.5, variant: 0 },
  { at: 180, body: "hatch", lane: -1, speed: 0.52, variant: 3 },
  { at: 285, body: "suv", lane: -1, speed: 0.54, variant: 6 },
  { at: 395, body: "sedan", lane: -1, speed: 0.55, variant: 2 },
  { at: 505, body: "hatch", lane: -1, speed: 0.56, variant: 9 },
  { at: 620, body: "sedan", lane: -1, speed: 0.57, variant: 1 },
  { at: 740, body: "suv", lane: -1, speed: 0.58, variant: 4 },
  { at: 865, body: "sedan", lane: -1, speed: 0.59, variant: 7 },
  { at: 995, body: "hatch", lane: -1, speed: 0.6, variant: 0 },
  { at: 1130, body: "sedan", lane: -1, speed: 0.61, variant: 5 },
  { at: 1270, body: "suv", lane: -1, speed: 0.62, variant: 8 },
]

/** Anything standing on the carriageway, in world coordinates. */
export type Occupant = {
  /** Metres from the centre line, positive to the right. */
  readonly lateral: number
  /** Metres ahead of us. */
  readonly z: number
  readonly widthM: number
  readonly lengthM: number
  readonly label: string
  readonly body?: BodyType
  readonly variant?: number
  /** How hard our headlights are falling on it, 0 to 1. */
  readonly lit?: number
  /** Set on the two vehicles of a pile-up, which are supposed to be touching. */
  readonly group?: string
}

/**
 * Where a vehicle in `lane` sits across the carriageway, once it has dealt with
 * anything blocking that lane.
 *
 * `ahead` is its own position down the run, not ours. That is the whole point:
 * a vehicle forty metres in front of us reaches the crash forty metres before
 * we do and moves over then, so you watch the car ahead pull out and only
 * afterwards do it yourself. Shoulder hazards are not in anybody's lane, so
 * nothing moves for them.
 */
export function lateralOf(
  lane: -1 | 0 | 1,
  ahead: number,
  events: readonly DriveEvent[],
): number {
  let lat = lane * LANE
  for (const ev of events) {
    if (ev.lane !== lane) continue
    if (ev.kind !== "crash" && ev.kind !== "debris") continue
    // Out of the outside lanes towards the middle; out of the middle to the left.
    const dir = lane === 0 ? -1 : -lane
    const across =
      smoothstep(ev.at - 150, ev.at - 45, ahead) - smoothstep(ev.at + 15, ev.at + 80, ahead)
    lat += dir * LANE * across
  }
  return lat
}

/** How hard our dipped beam falls on something this far ahead. */
export function litAt(z: number): number {
  return 1 - smoothstep(10, 70, z)
}

/**
 * Everything on the road at this point in the drive, near enough to matter.
 *
 * `density` is the --drive-traffic knob: below 1 it thins the table out, above
 * 1 it interleaves a second set half a gap further on.
 */
export function occupantsAt(
  travelled: number,
  events: readonly DriveEvent[],
  density = 1,
): Occupant[] {
  const out: Occupant[] = []

  const stride = density >= 1 ? 1 : Math.max(1, Math.round(1 / Math.max(density, 0.06)))
  const shifts = density > 1.02 ? [0, 36] : [0]

  for (const shift of shifts) {
    for (const [i, v] of TRAFFIC.entries()) {
      if (i % stride !== 0) continue
      const z = v.at + shift - travelled * (1 - v.speed)
      if (z <= NEAR_CULL || z >= TRAFFIC_FAR) continue
      const p = PROFILES[v.body]
      out.push({
        body: v.body,
        label: `${v.body}@${v.at}${shift === 0 ? "" : "+"}`,
        lateral: lateralOf(v.lane, travelled + z, events),
        lengthM: p.lengthM,
        lit: litAt(z),
        variant: v.variant,
        widthM: p.widthM,
        z,
      })
    }
  }

  for (const ev of events) {
    const z = ev.at - travelled
    if (z <= NEAR_CULL || z >= 260) continue
    if (ev.kind === "debris") {
      out.push({ label: "debris", lateral: ev.lane * LANE, lengthM: 2.4, widthM: 2.8, z })
      continue
    }
    // In a live lane only for the crash; the rest are stopped on the shoulder.
    const lateral = ev.kind === "crash" ? ev.lane * LANE : ev.lane * SHOULDER
    out.push({
      body: "sedan",
      ...(ev.kind === "crash" ? { group: "crash" } : {}),
      label: ev.kind,
      lateral,
      lengthM: PROFILES.sedan.lengthM,
      lit: litAt(z),
      // White for the police car, so the chevrons and the bar have something to
      // sit on; a dark red for the one that has broken down.
      variant: ev.kind === "police" ? 2 : 5,
      widthM: PROFILES.sedan.widthM,
      z,
    })
    if (ev.kind === "crash") {
      out.push({
        body: "suv",
        group: "crash",
        label: "crash second vehicle",
        lateral: lateral + 1.5,
        lengthM: PROFILES.suv.lengthM,
        lit: litAt(z + 7),
        variant: 3,
        widthM: PROFILES.suv.widthM,
        z: z + 7,
      })
    }
  }

  return out
}

/**
 * Smooth 0..1 ramp. Used for lane changes so vehicles ease across rather than
 * snapping, which is the difference between reading as a driver and reading as
 * a teleport.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
