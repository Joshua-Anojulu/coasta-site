"use client"

import { useEffect, useRef } from "react"
import { useScroll } from "motion/react"
import { usePrefersReducedMotion } from "./usePrefersReducedMotion"
import { drawCones, drawDebris, drawVehicle, smoothstep, type VehicleKind } from "./drawScene"

export type DriveEvent = {
  readonly at: number
  readonly lane: -1 | 0 | 1
  readonly kind: "police" | "crash" | "stall" | "debris"
  readonly label: string
}

const TRAFFIC: ReadonlyArray<{ at: number; lane: number; speed: number; truck?: boolean }> = [
  // Overtake distance is at / (1 - speed). Spacing of ~70m keeps two to four in
  // view at once, which is what a real corridor looks like at night.
  { at: 40, lane: -1, speed: 0.4 },
  { at: 110, lane: 1, speed: 0.34, truck: true },
  { at: 175, lane: 0.35, speed: 0.5 },
  { at: 250, lane: -0.35, speed: 0.46 },
  { at: 320, lane: 1, speed: 0.55 },
  { at: 395, lane: -1, speed: 0.42, truck: true },
  { at: 465, lane: 0.35, speed: 0.5 },
  { at: 540, lane: 0, speed: 0.6 },
  { at: 615, lane: -1, speed: 0.52 },
  { at: 690, lane: 1, speed: 0.44, truck: true },
  { at: 760, lane: 0.35, speed: 0.56 },
  { at: 835, lane: -0.35, speed: 0.48 },
  { at: 910, lane: 1, speed: 0.52 },
  { at: 985, lane: -1, speed: 0.38, truck: true },
  { at: 1060, lane: 0.35, speed: 0.54 },
  { at: 1135, lane: 0, speed: 0.5 },
  { at: 1210, lane: -0.35, speed: 0.46 },
  { at: 1290, lane: 1, speed: 0.56 },
]

const RUN = 1400
const CAM_H = 1.5
const LANE = 3.6
const FAR = 260

export function DriveRoad({
  events,
  className = "",
  targetRef,
}: {
  readonly events: readonly DriveEvent[]
  readonly className?: string
  readonly targetRef: React.RefObject<HTMLElement | null>
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
     * The lead vehicle: a real rendered car and trailer, keyed off its black
     * background and held in the near field for the whole drive.
     *
     * It exists because of a measurement. At a 1280px viewport a car is 106px
     * wide at the 16m cull but only 19px at 90m, and the coded traffic all sits
     * in that far band, where a photoreal render and a drawn shape are
     * indistinguishable. Detail only pays off close up, so this one is staged
     * close and closes only 21m across the entire run.
     */
    let lead: HTMLImageElement | null = null
    let leadReady = false
    const leadImage = new Image()
    leadImage.onload = () => {
      lead = leadImage
      leadReady = true
    }
    leadImage.src = "/vehicles/traffic-near.webp"

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

      // Carriageway.
      const nl = proj(-LANE * 1.5, 1.2)
      const nr = proj(LANE * 1.5, 1.2)
      const fl = proj(-LANE * 1.5, far)
      const fr = proj(LANE * 1.5, far)
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

      for (const lateral of [-LANE * 1.5, LANE * 1.5]) {
        ctx.beginPath()
        for (let z = 3; z < far; z += 6) {
          const p = proj(lateral, z)
          if (z === 3) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = "rgba(120, 190, 230, 0.30)"
        ctx.lineWidth = 1.4
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

      const sizeAt = (z: number, truck: boolean) => {
        const s = focal / Math.max(z, 0.6)
        return {
          halfW: Math.min((truck ? 1.28 : 0.92) * s, w * 0.11),
          bodyH: Math.min((truck ? 1.5 : 0.72) * s, h * 0.16),
          scale: s,
        }
      }

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
        if (z <= 16 || z >= far * 0.85) continue
        const fade = Math.max(0.12, 1 - z / (far * 0.85)) * pass.weight
        const { halfW, bodyH } = sizeAt(z, v.truck === true)
        const p = proj(v.lane * LANE, z)
        items.push({
          z,
          paint: () =>
            drawVehicle(ctx, {
              x: p.x,
              ground: p.y,
              halfW,
              bodyH,
              fade,
              kind: v.truck === true ? "truck" : "car",
            }),
        })
      }

      for (const ev of events) {
        const z = ev.at - travelled
        if (z <= 6 || z >= far) continue
        const fade = Math.min(1, Math.max(0.15, 1 - z / far) * tune.glow)
        const { halfW, bodyH, scale } = sizeAt(z, false)

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
        items.push({
          z,
          paint: () => {
            drawVehicle(ctx, { x: p.x, ground: p.y, halfW, bodyH, fade, kind, phase })
            // A crash is two vehicles, the second askew behind the first.
            if (ev.kind === "crash") {
              const p2 = proj(lateral + 1.5, z + 7)
              const s2 = sizeAt(z + 7, false)
              drawVehicle(ctx, {
                x: p2.x,
                ground: p2.y,
                halfW: s2.halfW * 0.92,
                bodyH: s2.bodyH * 0.92,
                fade: fade * 0.9,
                kind: "wreck",
                phase: phase + 0.5,
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
      if (leadReady && lead !== null) {
        // 17m closing to about 11m across the run. 46m looked far away despite
        // being "near": at a 1.5m camera height the contact point sits only
        // ~30px below the horizon, so the eye reads it as distant regardless of
        // the number. Under 20m is where a vehicle gains real presence.
        const lz = 17 - travelled * 0.0043
        if (lz > 7) {
          const s = focal / lz
          const halfW = 1.75 * s
          const spriteH = halfW * 2 * (lead.naturalHeight / lead.naturalWidth)
          const p = proj(-LANE * 0.5, lz)
          items.push({
            z: lz,
            paint: () => {
              ctx.globalCompositeOperation = "source-over"
              // Contact shadow, so it sits on the tarmac like the drawn traffic.
              const sh = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, halfW * 1.5)
              sh.addColorStop(0, "rgba(0, 0, 0, 0.6)")
              sh.addColorStop(1, "rgba(0, 0, 0, 0)")
              ctx.fillStyle = sh
              ctx.beginPath()
              ctx.ellipse(p.x, p.y, halfW * 1.5, halfW * 0.34, 0, 0, Math.PI * 2)
              ctx.fill()
              ctx.drawImage(lead as CanvasImageSource, p.x - halfW, p.y - spriteH, halfW * 2, spriteH)
            },
          })
        }
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
      draw(scrollYProgress.get() * tune.run, now)
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
  }, [reduce, events, scrollYProgress])

  return <canvas aria-hidden="true" className={className} ref={canvasRef} />
}
