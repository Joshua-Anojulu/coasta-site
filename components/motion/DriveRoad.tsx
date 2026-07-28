"use client"

import { useEffect, useRef } from "react"
import { useScroll, type MotionValue } from "motion/react"
import { usePrefersReducedMotion } from "./usePrefersReducedMotion"
import {
  drawCones,
  drawDebris,
  drawVehicle,
  vehicleScale,
  type BodyType,
  type VehicleKind,
} from "./drawScene"
import { LANE, occupantsAt, smoothstep, TRAFFIC_FAR, type DriveEvent } from "./traffic"

export type { DriveEvent }


const RUN = 1400
const CAM_H = 1.5
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

      // One shared layout for the canvas and for the test that walks the whole
      // run looking for two vehicles in the same place. Drawing from a second,
      // parallel copy of this arithmetic is how the old version ended up with a
      // lorry parked in the lane every left-hand car drove through.
      const kindOf: Record<string, VehicleKind> = {
        police: "police",
        crash: "wreck",
        stall: "stalled",
      }

      for (const o of occupantsAt(travelled, events, tune.traffic)) {
        const { z } = o
        const p = proj(o.lateral, z)

        if (o.label === "debris") {
          const scale = sizeAt(z, "sedan")
          const fade = Math.min(1, Math.max(0.15, 1 - z / far) * tune.glow)
          items.push({
            z,
            paint: () => {
              drawDebris(ctx, { x: p.x, ground: p.y, scale: scale * 0.9, fade })
              drawCones(ctx, { proj, lateral: o.lateral - 1.2, z: z + 6, count: 3, fade })
            },
          })
          continue
        }

        const body = o.body ?? "sedan"
        const scale = sizeAt(z, body)
        const kind = kindOf[o.label]
        // Hazards get the glow knob; ordinary traffic just fades into the haze.
        const fade =
          kind === undefined
            ? Math.max(0.12, 1 - z / TRAFFIC_FAR)
            : Math.min(1, Math.max(0.15, 1 - z / far) * tune.glow)

        items.push({
          z,
          paint: () => {
            drawVehicle(ctx, {
              x: p.x,
              ground: p.y,
              scale,
              fade,
              body,
              kind: kind ?? "moving",
              lit: o.lit ?? 0,
              phase: o.label === "crash second vehicle" ? phase + 0.5 : phase,
              variant: o.variant ?? 0,
            })
            // Cones taper the closure behind anything stopped. They start
            // beside the vehicle and lead back out to the edge line, which is
            // the direction a real taper runs; drawn the other way they sat in
            // a live lane looking like the road was closed.
            if (o.label === "crash") {
              drawCones(ctx, { proj, lateral: o.lateral - 1.6, z: z + 10, count: 4, fade })
            } else if (o.label === "police" || o.label === "stall") {
              drawCones(ctx, { proj, lateral: o.lateral + 0.4, z: z + 8, count: 3, fade })
            }
          },
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
