"use client"

import { useEffect, useRef } from "react"
import { useScroll, type MotionValue } from "motion/react"
import { usePrefersReducedMotion } from "./usePrefersReducedMotion"
import {
  drawCones,
  drawDebris,
  drawVehicle,
  smoothstep,
  vehicleScale,
  PROFILES,
  type BodyType,
  type VehicleKind,
} from "./drawScene"

export type DriveEvent = {
  readonly at: number
  readonly lane: -1 | 0 | 1
  readonly kind: "police" | "crash" | "stall" | "debris"
  readonly label: string
}

/**
 * The corridor's traffic.
 *
 * Every entry names its own body type. A motorway at night is a mix of
 * saloons, hatchbacks, 4x4s, vans and lorries, and it is the mix that makes it
 * read as traffic: eighteen identical silhouettes read as wallpaper no matter
 * how well any one of them is drawn. Slower entries are the heavy ones, which
 * is also true on a real road.
 *
 * Overtake distance is at / (1 - speed). Spacing of ~70m keeps two to four in
 * view at once.
 */
const TRAFFIC: ReadonlyArray<{ at: number; lane: number; speed: number; body: BodyType }> = [
  { at: 40, body: "sedan", lane: -1, speed: 0.4 },
  { at: 110, body: "lorry", lane: 1, speed: 0.3 },
  { at: 175, body: "hatch", lane: 0.35, speed: 0.5 },
  { at: 250, body: "suv", lane: -0.35, speed: 0.46 },
  { at: 320, body: "sedan", lane: 1, speed: 0.55 },
  // Overtakes early on purpose: at 0.4 it drew level with the crash, which is
  // also in the left lane, at 28m out, and drove straight through it.
  { at: 395, body: "van", lane: -1, speed: 0.56 },
  { at: 465, body: "pickup", lane: 0.35, speed: 0.48 },
  { at: 540, body: "hatch", lane: 0, speed: 0.6 },
  { at: 615, body: "sedan", lane: -1, speed: 0.52 },
  { at: 690, body: "lorry", lane: 1, speed: 0.32 },
  { at: 760, body: "suv", lane: 0.35, speed: 0.5 },
  { at: 835, body: "sedan", lane: -0.35, speed: 0.54 },
  { at: 910, body: "van", lane: 1, speed: 0.42 },
  { at: 985, body: "lorry", lane: -1, speed: 0.34 },
  { at: 1060, body: "hatch", lane: 0.35, speed: 0.56 },
  { at: 1135, body: "pickup", lane: 0, speed: 0.46 },
  { at: 1210, body: "sedan", lane: -0.35, speed: 0.52 },
  { at: 1290, body: "suv", lane: 1, speed: 0.5 },
]

const RUN = 1400
const CAM_H = 1.5
const LANE = 3.6
const FAR = 260

export function DriveRoad({
  events,
  className = "",
  targetRef,
  distanceOut,
}: {
  readonly events: readonly DriveEvent[]
  readonly className?: string
  readonly targetRef: React.RefObject<HTMLElement | null>
  /** Metres travelled, published each frame. The alert cards key off this
   *  rather than off scroll progress: pacing makes distance a non-linear
   *  function of progress, so anything deriving its own distance from progress
   *  would drift out of step with the hazard it describes. */
  readonly distanceOut?: MotionValue<number>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduce = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end end"] })

  useEffect(() => {
    if (reduce === null) return
    const canvas = canvasRef.current
    if (canvas === null) return
    const ctx = canvas.getContext("2d")
    if (ctx === null) return

    let raf = 0
    let onScreen = true
    let w = 0
    let h = 0

    /**
     * Real renders for the two hazards that come closest to the camera.
     *
     * There used to be a third, a lead vehicle held in the near field. It was
     * dropped: the render came back as a box trailer with a car's rear end
     * grafted onto the bottom of it, and keying its background left a pale
     * ghost that sat in the middle of the frame for the entire drive. A drawn
     * lorry is both correct and controllable, so the lead is drawn now.
     */
    // Explicit keys rather than an index signature: with Record<string, _> every
    // read is `possibly undefined` and needs bracket access, which buys nothing
    // for a fixed set of two.
    const sprites: {
      police: HTMLImageElement | null
      stalled: HTMLImageElement | null
    } = { police: null, stalled: null }
    for (const [name, file] of [
      ["police", "police.webp"],
      ["stalled", "stalled.webp"],
    ] as const) {
      const img = new Image()
      img.onload = () => {
        sprites[name] = img
      }
      img.src = `/vehicles/${file}`
    }

    /** Draws a keyed sprite standing on the road at `ground`, plus its contact
     *  shadow. Width is given in metres so it scales with perspective like
     *  everything else in the scene. */
    const paintSprite = (
      img: HTMLImageElement,
      p: { x: number; y: number },
      metres: number,
      scale: number,
    ) => {
      const halfW = (metres / 2) * scale
      const spriteH = halfW * 2 * (img.naturalHeight / img.naturalWidth)
      ctx.globalCompositeOperation = "source-over"
      const sh = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, halfW * 1.5)
      sh.addColorStop(0, "rgba(0, 0, 0, 0.6)")
      sh.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = sh
      ctx.beginPath()
      ctx.ellipse(p.x, p.y, halfW * 1.5, halfW * 0.34, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.drawImage(img as CanvasImageSource, p.x - halfW, p.y - spriteH, halfW * 2, spriteH)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.max(1, Math.floor(rect.width))
      h = Math.max(1, Math.floor(rect.height))
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    /**
     * Where the car sits across the carriageway, in metres.
     *
     * The point of the whole page is that you are warned early enough to act,
     * so the car has to actually act: it eases away from each hazard's lane
     * while the alert is on screen, holds while passing, then settles back.
     * Without this the warnings are narration; with it they are a story.
     */
    const egoLateral = (travelled: number): number => {
      let offset = 0
      for (const ev of events) {
        // Deliberately smaller than a real lane change. The projection is a pure
        // lateral camera translation, so the shift is divided by z: at a 1.2m
        // near plane a full 3.6m lane throws the road's near corners thousands
        // of pixels sideways and the carriageway visibly shears. Just under a
        // metre reads clearly as moving over without breaking the geometry.
        const target = ev.lane === 0 ? 1.15 : -ev.lane * 0.95
        const moveIn = smoothstep(ev.at - 210, ev.at - 70, travelled)
        const moveOut = smoothstep(ev.at + 20, ev.at + 95, travelled)
        offset += target * (moveIn - moveOut)
      }
      return offset
    }

    /**
     * Where the lorry we are following sits, in metres across the carriageway.
     *
     * It runs in the left lane, which is the lane the crash blocks, so it has
     * to get out of the way. It is not glued to us: it reaches each hazard
     * first and moves at that hazard's distance, not ours, so you watch the
     * vehicle ahead swing out and then follow it. That is the entire product in
     * one gesture, and it is the reason the lead vehicle is worth having at all.
     *
     * Unlike the camera this is an object, so it can move a full lane without
     * shearing anything.
     */
    const leadLateral = (ahead: number): number => {
      let lat = -LANE
      for (const ev of events) {
        if (ev.lane !== -1) continue
        const moveIn = smoothstep(ev.at - 150, ev.at - 45, ahead)
        const moveOut = smoothstep(ev.at + 15, ev.at + 80, ahead)
        lat += LANE * (moveIn - moveOut)
      }
      return lat
    }

    /**
     * Live tuning values from :root, written by the dev TweakBar.
     *
     * Cached and refreshed on an interval rather than read per frame:
     * getComputedStyle forces a style resolve, and doing nine of them at 60fps
     * is a measurable cost for values that only change when a human drags a
     * slider. In production nothing sets these and every one falls back.
     */
    let tune = {
      run: RUN,
      traffic: 1,
      fog: FAR,
      lamp: 1,
      lampGap: 45,
      glow: 1,
      vignette: 1,
      steer: 1,
      horizon: 0.44,
    }

    const readTunables = () => {
      const cs = getComputedStyle(document.documentElement)
      const num = (name: string, fallback: number) => {
        const parsed = Number.parseFloat(cs.getPropertyValue(name))
        return Number.isFinite(parsed) ? parsed : fallback
      }
      tune = {
        run: num("--drive-run", RUN),
        traffic: num("--drive-traffic", 1),
        fog: num("--drive-fog", FAR),
        lamp: num("--drive-lamp", 1),
        lampGap: num("--drive-lamp-gap", 45),
        glow: num("--drive-glow", 1),
        vignette: num("--drive-vignette", 1),
        steer: num("--drive-steer", 1),
        horizon: num("--drive-horizon", 0.44),
      }
    }

    readTunables()
    const tuneTimer = window.setInterval(readTunables, 250)

    /**
     * Scroll-to-distance curve, so the drive slows as it reaches each hazard.
     *
     * A linear mapping meant you were warned about something and then covered
     * the last 200m of it in a few pixels of scroll, which wasted the payoff of
     * the warning. Here the travel rate dips around every event, so the same
     * scroll buys less distance near a hazard and you actually watch it arrive
     * and pass.
     *
     * Built as a lookup table: define a speed profile over distance, integrate
     * 1/speed to get scroll cost, normalise, then invert. Doing it numerically
     * once is far simpler than solving the inverse analytically, and 512 samples
     * is smooth well past the precision a scrollbar can express.
     */
    const SAMPLES = 512
    const buildPacing = (run: number) => {
      const table = new Float64Array(SAMPLES + 1)
      let acc = 0
      for (let i = 0; i <= SAMPLES; i += 1) {
        const d = (i / SAMPLES) * run
        // Slowest right at the hazard, easing back to full speed either side.
        let slow = 0
        for (const ev of events) {
          const t = (d - ev.at) / 130
          slow += 0.62 * Math.exp(-t * t)
        }
        const speed = Math.max(0.25, 1 - Math.min(slow, 0.75))
        acc += 1 / speed
        table[i] = acc
      }
      const total = table[SAMPLES] ?? 1
      for (let i = 0; i <= SAMPLES; i += 1) table[i] = (table[i] ?? 0) / total
      return table
    }

    let pacing = buildPacing(tune.run)
    let pacingRun = tune.run

    /** progress 0..1 -> metres travelled, via the inverse of the pacing table. */
    const distanceFor = (progress: number, run: number) => {
      if (run !== pacingRun) {
        pacing = buildPacing(run)
        pacingRun = run
      }
      const p = Math.min(1, Math.max(0, progress))
      let lo = 0
      let hi = SAMPLES
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if ((pacing[mid] ?? 0) < p) lo = mid
        else hi = mid
      }
      const a = pacing[lo] ?? 0
      const b = pacing[hi] ?? 1
      const frac = b === a ? 0 : (p - a) / (b - a)
      return ((lo + frac) / SAMPLES) * run
    }

    const draw = (travelled: number, nowMs: number) => {
      const far = tune.fog
      const horizon = h * tune.horizon
      const focal = w * 0.72
      const cx = w / 2
      const ego = egoLateral(travelled) * tune.steer
      // Flash phase for police bars and hazard flashers. Frozen under reduced
      // motion so nothing strobes.
      const phase = reduce ? 0.25 : (nowMs / 620) % 1

      const proj = (lateral: number, z: number) => {
        const zz = Math.max(z, 0.6)
        return { x: cx + ((lateral - ego) * focal) / zz, y: horizon + (CAM_H * focal) / zz }
      }

      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "#04060a"
      ctx.fillRect(0, 0, w, h)

      const sky = ctx.createLinearGradient(0, horizon - h * 0.3, 0, horizon)
      sky.addColorStop(0, "rgba(10, 18, 32, 0)")
      sky.addColorStop(1, "rgba(38, 78, 110, 0.5)")
      ctx.fillStyle = sky
      ctx.fillRect(0, horizon - h * 0.3, w, h * 0.3)

      // Carriageway, out past the edge lines to include the hard shoulder. The
      // shoulder hazards sit at 5.4m, which is exactly the edge of three live
      // lanes, so without it a stopped vehicle stands half on the tarmac and
      // half in the void.
      const EDGE = LANE * 2.05
      const nl = proj(-EDGE, 1.2)
      const nr = proj(EDGE, 1.2)
      const fl = proj(-EDGE, far)
      const fr = proj(EDGE, far)
      ctx.beginPath()
      ctx.moveTo(nl.x, nl.y)
      ctx.lineTo(nr.x, nr.y)
      ctx.lineTo(fr.x, fr.y)
      ctx.lineTo(fl.x, fl.y)
      ctx.closePath()
      const road = ctx.createLinearGradient(0, horizon, 0, h)
      road.addColorStop(0, "#0a0f16")
      road.addColorStop(0.55, "#141c26")
      road.addColorStop(1, "#1b2430")
      ctx.fillStyle = road
      ctx.fill()

      ctx.save()
      ctx.clip()
      const sheen = ctx.createLinearGradient(cx, horizon, cx, h)
      sheen.addColorStop(0, "rgba(150, 200, 235, 0)")
      sheen.addColorStop(1, "rgba(150, 200, 235, 0.05)")
      ctx.fillStyle = sheen
      ctx.fillRect(0, horizon, w, h - horizon)

      /**
       * Our own headlights on the tarmac.
       *
       * The scene was geometrically right without this and still read wrong:
       * every vehicle looked like it was hovering, because the road under it
       * was the same near-black as the road fifty metres away. Nothing was
       * lighting anything. A dipped beam falling on the surface is what puts
       * the traffic on the ground, and it is the one light source a driver
       * actually has at night.
       *
       * A straight line on the ground plane projects to a straight line, so
       * each beam is an exact quad rather than an approximation.
       */
      const BEAM_SLICES = 20
      const beam = (spread0: number, spread1: number, z0: number, z1: number, alpha: number) => {
        const l0 = proj(-spread0, z0)
        const r0 = proj(spread0, z0)
        const l1 = proj(-spread1, z1)
        const r1 = proj(spread1, z1)

        // Sliced across the depth of the beam rather than filled as one quad
        // with a blur. `ctx.filter = "blur()"` looked right and cost 150ms a
        // frame at 2560px wide, against a whole-scene budget of 33ms; it is not
        // on the fast path at that size. Slices give the same soft edge for
        // sixty gradient objects, which is nothing.
        for (let i = 0; i < BEAM_SLICES; i += 1) {
          const t0 = i / BEAM_SLICES
          const t1 = (i + 1) / BEAM_SLICES
          const ya = l0.y + (l1.y - l0.y) * t0
          const yb = l0.y + (l1.y - l0.y) * t1 + 1
          const xla = l0.x + (l1.x - l0.x) * t0
          const xra = r0.x + (r1.x - r0.x) * t0
          const xlb = l0.x + (l1.x - l0.x) * t1
          const xrb = r0.x + (r1.x - r0.x) * t1

          // Brightest where a dipped beam actually pools, not at the bumper.
          const fall = t0 < 0.32 ? 0.35 + (t0 / 0.32) * 0.65 : 1 - (t0 - 0.32) / 0.68
          const a = alpha * fall
          const g = ctx.createLinearGradient(Math.min(xla, xlb), 0, Math.max(xra, xrb), 0)
          g.addColorStop(0, "rgba(196, 210, 228, 0)")
          g.addColorStop(0.34, `rgba(196, 210, 228, ${a})`)
          g.addColorStop(0.66, `rgba(196, 210, 228, ${a})`)
          g.addColorStop(1, "rgba(196, 210, 228, 0)")
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.moveTo(xla, ya)
          ctx.lineTo(xra, ya)
          ctx.lineTo(xrb, yb)
          ctx.lineTo(xlb, yb)
          ctx.closePath()
          ctx.fill()
        }
      }

      ctx.globalCompositeOperation = "lighter"
      // The broad spill, then a tighter hot core inside it.
      beam(2.6, 6.2, 2, 62, 0.05)
      beam(1.5, 3.4, 2.4, 44, 0.055)
      ctx.restore()

      ctx.globalCompositeOperation = "lighter"
      ctx.lineCap = "round"

      // Lane dashes, offset by distance so the road moves under you.
      const DASH = 12
      for (const lateral of [-LANE / 2, LANE / 2]) {
        for (let k = 0; k < 26; k += 1) {
          const z0 = k * DASH - (travelled % DASH)
          const z1 = z0 + DASH * 0.42
          if (z1 < 1.2) continue
          const a = proj(lateral, Math.max(z0, 1.2))
          const b = proj(lateral, Math.max(z1, 1.3))
          const fade = Math.max(0, 1 - z0 / far)
          ctx.strokeStyle = `rgba(226, 238, 250, ${0.5 * fade})`
          ctx.lineWidth = Math.max(1, 7 * fade)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      // Ground haze. The sky gradient stopped dead at the horizon and the road
      // began there in near-black, which drew a hard line straight across the
      // frame. Real distance ends in air, not in an edge.
      ctx.globalCompositeOperation = "lighter"
      const haze = ctx.createLinearGradient(0, horizon - h * 0.09, 0, horizon + h * 0.07)
      haze.addColorStop(0, "rgba(46, 78, 106, 0)")
      haze.addColorStop(0.5, "rgba(46, 78, 106, 0.3)")
      haze.addColorStop(1, "rgba(46, 78, 106, 0)")
      ctx.fillStyle = haze
      ctx.fillRect(0, horizon - h * 0.09, w, h * 0.16)

      // Solid edge lines dividing the live lanes from the hard shoulder.
      for (const lateral of [-LANE * 1.5, LANE * 1.5]) {
        ctx.beginPath()
        for (let z = 3; z < far; z += 6) {
          const p = proj(lateral, z)
          if (z === 3) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = "rgba(190, 220, 245, 0.42)"
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Gantries: the speed cue.
      const POLE = tune.lampGap
      for (let k = 0; k < 14; k += 1) {
        const z = k * POLE - (travelled % POLE)
        if (z < 24 || z > far) continue
        const fade = Math.max(0, 1 - z / far)
        for (const side of [-1, 1]) {
          const base = proj(side * LANE * 2.6, z)
          const headY = base.y - (7.5 * focal) / Math.max(z, 0.6)
          const armX = base.x - side * (LANE * 0.6 * focal) / Math.max(z, 0.6)
          ctx.strokeStyle = `rgba(158, 194, 220, ${0.4 * fade * Math.min(tune.lamp, 1.2)})`
          ctx.lineWidth = Math.max(1, 3.4 * fade)
          ctx.beginPath()
          ctx.moveTo(base.x, base.y)
          ctx.lineTo(base.x, headY)
          ctx.lineTo(armX, headY)
          ctx.stroke()

          const r = Math.max(3, 20 * fade)
          const lamp = ctx.createRadialGradient(armX, headY, 0, armX, headY, r)
          lamp.addColorStop(0, `rgba(255, 208, 140, ${0.62 * fade * tune.lamp})`)
          lamp.addColorStop(1, "rgba(255, 208, 140, 0)")
          ctx.fillStyle = lamp
          ctx.beginPath()
          ctx.arc(armX, headY, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Everything with a ground position, painted far to near so nearer things
      // overlap correctly. Hazards and traffic share one pass for that reason.
      type Item = { z: number; paint: () => void }
      const items: Item[] = []

      // Pixels per metre at a given distance, clamped uniformly per body type so
      // a near vehicle keeps its proportions instead of squashing.
      const sizeAt = (z: number, body: BodyType) =>
        vehicleScale(focal / Math.max(z, 0.6), body, { h, w })

      // How hard our own headlights fall on the vehicle ahead. Full inside 12m,
      // gone by 45m, which is roughly the reach of a dipped beam.
      const litAt = (z: number) => 1 - smoothstep(12, 45, z)

      const stride = tune.traffic >= 1 ? 1 : Math.max(1, Math.round(1 / Math.max(tune.traffic, 0.06)))
      // Above 1 the extra pass interleaves a second set half a gap further on,
      // faded in proportionally so the slider is continuous rather than a step.
      const extra = Math.max(0, Math.min(tune.traffic - 1, 1))
      const passes: Array<{ shift: number; weight: number }> = [{ shift: 0, weight: 1 }]
      if (extra > 0.02) passes.push({ shift: 36, weight: extra })

      for (const pass of passes)
      for (const [ti, v] of TRAFFIC.entries()) {
        if (ti % stride !== 0) continue
        const z = v.at + pass.shift + travelled * v.speed - travelled
        if (z <= 2.2 || z >= far * 0.85) continue
        const fade = Math.max(0.12, 1 - z / (far * 0.85)) * pass.weight
        const scale = sizeAt(z, v.body)
        const p = proj(v.lane * LANE, z)
        items.push({
          z,
          paint: () =>
            drawVehicle(ctx, {
              x: p.x,
              ground: p.y,
              scale,
              fade,
              body: v.body,
              lit: litAt(z),
              variant: ti,
            }),
        })
      }

      for (const ev of events) {
        const z = ev.at - travelled
        if (z <= 2.2 || z >= far) continue
        const fade = Math.min(1, Math.max(0.15, 1 - z / far) * tune.glow)
        // The crash and the stall are saloons; the shoulder hazard the police
        // are attending is one too. Debris borrows the sedan scale only to size
        // its fragments.
        const scale = sizeAt(z, "sedan")
        const halfW = (PROFILES.sedan.widthM / 2) * scale
        const bodyH = PROFILES.sedan.heightM * scale

        if (ev.kind === "debris") {
          const p = proj(ev.lane * LANE, z)
          items.push({
            z,
            paint: () => {
              drawDebris(ctx, { x: p.x, ground: p.y, scale: scale * 0.9, fade })
              drawCones(ctx, { proj, lateral: ev.lane * LANE - 1.2, z: z + 6, count: 3, fade })
            },
          })
          continue
        }

        const kindMap: Record<string, VehicleKind> = {
          police: "police",
          crash: "wreck",
          stall: "stalled",
        }
        const kind = kindMap[ev.kind] ?? "stalled"
        // On the shoulder, not in a live lane, except the crash which blocks one.
        const lateral = ev.kind === "crash" ? ev.lane * LANE : ev.lane * LANE * 1.5
        const p = proj(lateral, z)
        const sprite = ev.kind === "police" ? sprites.police : ev.kind === "stall" ? sprites.stalled : null

        items.push({
          z,
          paint: () => {
            if (sprite !== null) {
              // Real render for the hazards that get closest. The police sprite
              // already carries a lit bar, so no coded bar over it.
              paintSprite(sprite, p, ev.kind === "police" ? 2.1 : 1.9, focal / Math.max(z, 0.6))
              if (ev.kind === "stall" && phase % 1 < 0.5) {
                // The render came back with brake lights rather than the amber
                // hazards that were asked for, so the flashers are drawn over
                // it. Real bodywork, real flashing.
                ctx.globalCompositeOperation = "lighter"
                for (const side of [-1, 1]) {
                  const hx = p.x + side * halfW * 0.85
                  const hy = p.y - bodyH * 0.5
                  const r = Math.min(Math.max(4, halfW * 1.1), 30)
                  const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r)
                  g.addColorStop(0, `rgba(255, 176, 0, ${0.85 * fade})`)
                  g.addColorStop(1, "rgba(255, 176, 0, 0)")
                  ctx.fillStyle = g
                  ctx.beginPath()
                  ctx.arc(hx, hy, r, 0, Math.PI * 2)
                  ctx.fill()
                }
              }
            } else {
              drawVehicle(ctx, {
                x: p.x,
                ground: p.y,
                scale,
                fade,
                body: "sedan",
                kind,
                lit: litAt(z),
                phase,
                variant: 2,
              })
            }
            // A crash is two vehicles, the second askew behind the first. It is
            // a 4x4, so the pile reads as two different vehicles rather than as
            // one shape drawn twice.
            if (ev.kind === "crash") {
              const p2 = proj(lateral + 1.5, z + 7)
              drawVehicle(ctx, {
                x: p2.x,
                ground: p2.y,
                scale: sizeAt(z + 7, "suv"),
                fade: fade * 0.9,
                body: "suv",
                kind: "wreck",
                lit: litAt(z + 7),
                phase: phase + 0.5,
                variant: 4,
              })
              drawCones(ctx, { proj, lateral: lateral - 1.4, z: z + 10, count: 4, fade })
            }
            if (ev.kind === "police" || ev.kind === "stall") {
              drawCones(ctx, { proj, lateral: lateral - ev.lane * 1.1, z: z + 8, count: 2, fade })
            }
          },
        })
      }

      // The lead vehicle joins the same depth-sorted pass so hazards and traffic
      // can pass in front of or behind it correctly.
      //
      // A lorry, drawn rather than composited: it is the one thing in frame the
      // whole way down the page, so it has to be right, and a trailer's rear is
      // mostly flat panel, door seams and marker lights, which draws better
      // than it renders. Held in the left lane at 30m closing to about 24m; at
      // 17m it filled the centre of the frame and hid both the road and the
      // hazards, which made it the subject instead of the context.
      const lz = 30 - travelled * 0.0043
      if (lz > 7) {
        const p = proj(leadLateral(travelled + lz), lz)
        items.push({
          z: lz,
          paint: () =>
            drawVehicle(ctx, {
              x: p.x,
              ground: p.y,
              scale: sizeAt(lz, "lorry"),
              fade: 1,
              body: "lorry",
              lit: litAt(lz),
              variant: 5,
            }),
        })
      }

      items.sort((a, b) => b.z - a.z)
      for (const item of items) item.paint()

      ctx.globalCompositeOperation = "source-over"
      const vig = ctx.createRadialGradient(cx, h * 0.55, h * 0.16, cx, h * 0.55, h * 0.95)
      vig.addColorStop(0, "rgba(4, 6, 10, 0)")
      vig.addColorStop(1, `rgba(4, 6, 10, ${Math.min(0.98, 0.9 * tune.vignette)})`)
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!onScreen || document.visibilityState !== "visible") return
      const travelled = distanceFor(scrollYProgress.get(), tune.run)
      distanceOut?.set(travelled)
      draw(travelled, now)
    }

    resize()

    if (reduce) {
      draw(tune.run * 0.2, 0)
    } else {
      raf = requestAnimationFrame(frame)
    }

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false
    })
    io.observe(canvas)

    const onResize = () => {
      resize()
      if (reduce) draw(tune.run * 0.2, 0)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(tuneTimer)
      io.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [reduce, events, scrollYProgress, distanceOut])

  return <canvas aria-hidden="true" className={className} ref={canvasRef} />
}
