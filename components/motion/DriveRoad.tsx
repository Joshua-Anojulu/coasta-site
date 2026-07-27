"use client"

import { useEffect, useRef } from "react"
import { useScroll } from "motion/react"
import { usePrefersReducedMotion } from "./usePrefersReducedMotion"

export type DriveEvent = {
  readonly at: number // world distance ahead, in metres
  readonly lane: -1 | 0 | 1
  readonly kind: "police" | "crash" | "stall" | "debris"
  readonly label: string
}

/**
 * Traffic ahead. Deterministic rather than random so the scene is identical on
 * every load and every resize: a road that reshuffles itself when you rotate
 * the phone reads as a glitch. `speed` is a fraction of the camera's, so you
 * close on each vehicle and pass it rather than sitting behind a static prop.
 */
const TRAFFIC: ReadonlyArray<{ at: number; lane: number; speed: number }> = [
  // Overtake distance is at / (1 - speed). At 0.85 that put every vehicle past
  // the end of the run, so nothing was ever actually passed and the traffic sat
  // frozen near the vanishing point. These values overtake across the drive.
  { at: 60, lane: -1, speed: 0.4 },
  { at: 180, lane: 0.35, speed: 0.5 },
  { at: 300, lane: 1, speed: 0.45 },
  { at: 430, lane: -0.35, speed: 0.55 },
  { at: 560, lane: 1, speed: 0.5 },
  { at: 700, lane: 0, speed: 0.6 },
  { at: 880, lane: -1, speed: 0.52 },
  { at: 1050, lane: 0.35, speed: 0.58 },
]

const TINT: Record<DriveEvent["kind"], string> = {
  police: "80, 160, 255",
  crash: "255, 59, 48",
  stall: "255, 176, 0",
  debris: "180, 210, 235",
}

/**
 * A night highway seen from the driver's seat, drawn in code.
 *
 * Scroll is the accelerator: progress along the pinned section maps to distance
 * travelled, so the road actually comes toward you and hazards resolve out of
 * the dark ahead. Nothing here is a photograph or a gradient standing in for a
 * hero (hard ban 1); it is perspective geometry and light.
 *
 * Scroll handling goes through Motion's useScroll, never a scroll listener or
 * scrollY in state, both of which Ch3.1 bans.
 */
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

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.max(1, Math.floor(rect.width))
      h = Math.max(1, Math.floor(rect.height))
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // Total metres of road the section represents.
    const RUN = 1400
    const CAM_H = 1.5
    const LANE = 3.6

    const draw = (travelled: number) => {
      const horizon = h * 0.44
      const focal = w * 0.72
      const cx = w / 2

      // Project a point (lateral metres, metres ahead) to screen.
      const proj = (lateral: number, z: number) => {
        const zz = Math.max(z, 0.6)
        return { x: cx + (lateral * focal) / zz, y: horizon + (CAM_H * focal) / zz }
      }

      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "#04060a"
      ctx.fillRect(0, 0, w, h)

      // Sky glow above the horizon: the city you are driving toward.
      const sky = ctx.createLinearGradient(0, horizon - h * 0.3, 0, horizon)
      sky.addColorStop(0, "rgba(10, 18, 32, 0)")
      sky.addColorStop(1, "rgba(38, 78, 110, 0.5)")
      ctx.fillStyle = sky
      ctx.fillRect(0, horizon - h * 0.3, w, h * 0.3)

      // Road surface.
      const far = 260
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

      // A restrained sheen down the centre, as if the surface is damp under the
      // lamps. Kept subtle on purpose: the brief is professional, and a glossy
      // reflective road tips this straight into a driving game.
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

      // Lane dashes. Offsetting by the travelled distance is what makes the road
      // move under you rather than the camera fly over a static texture.
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

      // Continuous edge lines.
      for (const lateral of [-LANE * 1.5, LANE * 1.5]) {
        ctx.beginPath()
        for (let z = 1.2; z < far; z += 6) {
          const p = proj(lateral, z)
          if (z === 1.2) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = "rgba(120, 190, 230, 0.30)"
        ctx.lineWidth = 1.4
        ctx.stroke()
      }

      // Roadside light poles. These are the speed cue: they enter small at the
      // vanishing point and sweep past the edge of frame, which is what actually
      // communicates travel. Lane dashes alone read as a static texture.
      // The mast is drawn firmly and the lamp kept tight; an oversized bloom
      // reads as a floating ball rather than a light on a pole.
      const POLE = 45
      for (let k = 0; k < 14; k += 1) {
        const z = k * POLE - (travelled % POLE)
        if (z < 2 || z > far) continue
        const fade = Math.max(0, 1 - z / far)
        for (const side of [-1, 1]) {
          const base = proj(side * LANE * 2.6, z)
          const headY = base.y - (7.5 * focal) / Math.max(z, 0.6)
          // Mast, then the short arm that reaches over the carriageway.
          ctx.strokeStyle = `rgba(158, 194, 220, ${0.4 * fade})`
          ctx.lineWidth = Math.max(1, 3.4 * fade)
          ctx.beginPath()
          ctx.moveTo(base.x, base.y)
          ctx.lineTo(base.x, headY)
          ctx.lineTo(base.x - side * (LANE * 0.6 * focal) / Math.max(z, 0.6), headY)
          ctx.stroke()

          const hx = base.x - side * (LANE * 0.6 * focal) / Math.max(z, 0.6)
          const r = Math.max(3, 20 * fade)
          const lamp = ctx.createRadialGradient(hx, headY, 0, hx, headY, r)
          lamp.addColorStop(0, `rgba(255, 208, 140, ${0.62 * fade})`)
          lamp.addColorStop(1, "rgba(255, 208, 140, 0)")
          ctx.fillStyle = lamp
          ctx.beginPath()
          ctx.arc(hx, headY, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Traffic ahead. Nothing sells a night drive like other people's
      // taillights, and it is the detail that makes the scene read as a real
      // road rather than an empty diagram. Each vehicle moves, slower than the
      // camera, so you close on it and pass it.
      for (const v of TRAFFIC) {
        const z = v.at + travelled * v.speed - travelled
        if (z < 3 || z > far * 0.8) continue
        const fade = Math.max(0, 1 - z / (far * 0.8))
        const half = (0.85 * focal) / Math.max(z, 0.6)
        const cxv = cx + (v.lane * LANE * focal) / Math.max(z, 0.6)
        const yv = horizon + (CAM_H * focal) / Math.max(z, 0.6) - half * 0.5

        for (const dx of [-half, half]) {
          const g = ctx.createRadialGradient(cxv + dx, yv, 0, cxv + dx, yv, Math.max(2.5, 13 * fade))
          g.addColorStop(0, `rgba(255, 72, 60, ${0.85 * fade})`)
          g.addColorStop(1, "rgba(255, 72, 60, 0)")
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(cxv + dx, yv, Math.max(2.5, 13 * fade), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Hazards, resolving out of the dark as they approach.
      for (const ev of events) {
        const z = ev.at - travelled
        if (z < 1.5 || z > far) continue
        const p = proj(ev.lane * LANE, z)
        const fade = Math.max(0, 1 - z / far)
        const r = Math.max(2, 34 * fade)
        const tint = TINT[ev.kind]

        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.4)
        halo.addColorStop(0, `rgba(${tint}, ${0.5 * fade})`)
        halo.addColorStop(1, `rgba(${tint}, 0)`)
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 3.4, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(${tint}, ${Math.min(1, 0.85 * fade + 0.2)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(1.5, r * 0.28), 0, Math.PI * 2)
        ctx.fill()
      }

      // Vignette, drawn last so it sits over the light.
      ctx.globalCompositeOperation = "source-over"
      const vig = ctx.createRadialGradient(cx, h * 0.55, h * 0.16, cx, h * 0.55, h * 0.95)
      vig.addColorStop(0, "rgba(4, 6, 10, 0)")
      vig.addColorStop(1, "rgba(4, 6, 10, 0.9)")
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)
    }

    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!onScreen || document.visibilityState !== "visible") return
      draw(scrollYProgress.get() * RUN)
    }

    resize()

    if (reduce) {
      // Assembled end state: the road is present and the hazards are placed at
      // a readable distance. Nothing is missing, it simply does not travel.
      draw(RUN * 0.35)
    } else {
      raf = requestAnimationFrame(frame)
    }

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false
    })
    io.observe(canvas)

    const onResize = () => {
      resize()
      if (reduce) draw(RUN * 0.35)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [reduce, events, scrollYProgress])

  return <canvas aria-hidden="true" className={className} ref={canvasRef} />
}
