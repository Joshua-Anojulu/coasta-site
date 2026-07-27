"use client"

import { useEffect, useRef } from "react"
import { DFW_GEOMETRY } from "@/lib/geometry/snapshot"
import { usePrefersReducedMotion } from "./usePrefersReducedMotion"

type Pt = { x: number; y: number }
type Road = { pts: Pt[]; len: number[]; total: number; major: boolean }

const BG = "#05070d"
const CORE = "103, 232, 249" // cyan
const WARM = "255, 176, 0" // amber

/**
 * The DFW network as light. Real OpenStreetMap geometry, 236 corridors, drawn
 * as glowing arteries with signal pulses travelling them.
 *
 * Performance: the static glow is rendered ONCE into an offscreen canvas and
 * blitted each frame. Only the pulses are redrawn, so the per-frame cost is a
 * single drawImage plus a few dozen short strokes rather than 236 multi-pass
 * paths. That is the difference between this being free and this being a fan.
 */
export function LivingNetwork({ className = "" }: { readonly className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduce = usePrefersReducedMotion()

  useEffect(() => {
    if (reduce === null) return
    const canvas = canvasRef.current
    if (canvas === null) return
    const ctx = canvas.getContext("2d")
    if (ctx === null) return

    let raf = 0
    let onScreen = true
    let roads: Road[] = []
    let glow: HTMLCanvasElement | null = null
    let w = 0
    let h = 0

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.max(1, Math.floor(rect.width))
      h = Math.max(1, Math.floor(rect.height))
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const b = DFW_GEOMETRY.bounds
      const pad = Math.min(w, h) * 0.06
      const sx = (w - pad * 2) / (b.maxLongitude - b.minLongitude)
      const sy = (h - pad * 2) / (b.maxLatitude - b.minLatitude)
      const s = Math.min(sx, sy)
      const ox = pad + (w - pad * 2 - (b.maxLongitude - b.minLongitude) * s) / 2
      const oy = pad + (h - pad * 2 - (b.maxLatitude - b.minLatitude) * s) / 2

      roads = DFW_GEOMETRY.roads.map((road) => {
        const pts = road.points.map(([lon, lat]) => ({
          x: ox + (lon - b.minLongitude) * s,
          // latitude grows north, canvas y grows down
          y: oy + (b.maxLatitude - lat) * s,
        }))
        const len: number[] = [0]
        let total = 0
        for (let i = 1; i < pts.length; i += 1) {
          total += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y)
          len.push(total)
        }
        return { pts, len, total, major: road.roadClass === "interstate" }
      })

      // Bake the static network once.
      glow = document.createElement("canvas")
      glow.width = canvas.width
      glow.height = canvas.height
      const g = glow.getContext("2d")
      if (g === null) return
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.globalCompositeOperation = "lighter"
      g.lineCap = "round"
      g.lineJoin = "round"

      // Three passes: wide bloom, mid halo, bright core. Additive, so overlaps
      // brighten where corridors converge, which is where the metroplex reads.
      const passes: Array<[number, number]> = [
        [9, 0.035],
        [3.2, 0.07],
        [1.05, 0.5],
      ]
      for (const [width, alpha] of passes) {
        for (const road of roads) {
          g.beginPath()
          road.pts.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)))
          g.lineWidth = road.major ? width : width * 0.62
          g.strokeStyle = `rgba(${CORE}, ${road.major ? alpha : alpha * 0.62})`
          g.stroke()
        }
      }
    }

    const at = (road: Road, dist: number): Pt => {
      const d = ((dist % road.total) + road.total) % road.total
      let i = 1
      while (i < road.len.length && road.len[i]! < d) i += 1
      const a = road.pts[i - 1]!
      const bp = road.pts[Math.min(i, road.pts.length - 1)]!
      const segLen = road.len[Math.min(i, road.len.length - 1)]! - road.len[i - 1]!
      const t = segLen === 0 ? 0 : (d - road.len[i - 1]!) / segLen
      return { x: a.x + (bp.x - a.x) * t, y: a.y + (bp.y - a.y) * t }
    }

    // One pulse per major corridor, capped: the ambient budget is 30 concurrent
    // elements on desktop (Ch4.3), so this stays well inside it.
    let pulses: Array<{ road: Road; d: number; v: number; warm: boolean }> = []
    const seedPulses = () => {
      const majors = roads.filter((r) => r.major && r.total > 60)
      pulses = majors.slice(0, 26).map((road, i) => ({
        road,
        d: (road.total / 26) * i,
        v: 26 + (i % 5) * 7,
        warm: i % 6 === 0,
      }))
    }

    let last = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!onScreen || document.visibilityState !== "visible") return
      const dt = last === 0 ? 0 : Math.min((now - last) / 1000, 0.05)
      last = now

      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)
      if (glow !== null) {
        ctx.drawImage(glow, 0, 0, w, h)
      }

      ctx.globalCompositeOperation = "lighter"
      ctx.lineCap = "round"
      for (const p of pulses) {
        p.d += p.v * dt
        const head = at(p.road, p.d)
        const tail = at(p.road, p.d - 26)
        const rgb = p.warm ? WARM : CORE
        const grad = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y)
        grad.addColorStop(0, `rgba(${rgb}, 0)`)
        grad.addColorStop(1, `rgba(${rgb}, 0.95)`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 2.1
        ctx.beginPath()
        ctx.moveTo(tail.x, tail.y)
        ctx.lineTo(head.x, head.y)
        ctx.stroke()

        ctx.fillStyle = `rgba(${rgb}, 0.85)`
        ctx.beginPath()
        ctx.arc(head.x, head.y, 2.1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const paintStatic = () => {
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)
      if (glow !== null) ctx.drawImage(glow, 0, 0, w, h)
    }

    build()
    seedPulses()

    if (reduce) {
      // Assembled end state: the network is lit, the pulses simply do not travel.
      paintStatic()
    } else {
      raf = requestAnimationFrame(frame)
    }

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false
    })
    io.observe(canvas)

    const onResize = () => {
      build()
      seedPulses()
      if (reduce) paintStatic()
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [reduce])

  return <canvas aria-hidden="true" className={className} ref={canvasRef} />
}
