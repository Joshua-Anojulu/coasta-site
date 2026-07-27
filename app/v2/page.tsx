"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { FeedPanel } from "@/components/motion/FeedPanel"
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion"
import "@/styles/variants.css"

gsap.registerPlugin(ScrollTrigger)

const FEEDS = [
  { id: "W-11", road: "I-35W" },
  { id: "W-09", road: "I-820" },
  { id: "C-12", road: "SH-114" },
  { id: "N-03", road: "I-635" },
  { id: "N-01", road: "I-35E" },
  { id: "E-05", road: "I-30" },
  { id: "S-07", road: "I-20" },
]

/**
 * v2: the sweep.
 * Mechanic reason (Ch3): the metroplex is wide, not tall, so the page travels
 * the way the network does, west to east across the corridors.
 * Scroll cost: one pinned pan, roughly 2.6 viewports.
 */
export default function V2() {
  const wrap = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const reduce = usePrefersReducedMotion()
  const [, setPanning] = useState(false)

  useEffect(() => {
    if (reduce === null || !wrap.current || !track.current) return
    if (reduce) {
      setPanning(false)
      return
    }

    const getDistance = () => track.current!.scrollWidth - wrap.current!.offsetWidth

    const mm = gsap.matchMedia()
    mm.add("(min-width: 768px)", () => {
      const wrapEl = wrap.current!
      const trackEl = track.current!
      if (getDistance() <= 0) return

      // Flip imperatively before measuring: a setState would not have committed,
      // so the pin spacer would be sized from a track that is still a native
      // scroller and the pin would jump once React caught up.
      wrapEl.classList.add("overflow-hidden")
      trackEl.classList.remove("v2-track--native")
      setPanning(true)

      const tween = gsap.to(trackEl, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: wrapEl,
          start: "top top",
          end: () => "+=" + getDistance(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
      ScrollTrigger.refresh()

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        wrapEl.classList.remove("overflow-hidden")
        trackEl.classList.add("v2-track--native")
        setPanning(false)
      }
    })

    return () => {
      mm.revert()
    }
  }, [reduce])

  return (
    <main className="vroot">
      <span className="vlabel">V2 / THE SWEEP</span>

      {/* Base classes are the FALLBACK: every failure path lands on a native
          scroll-snap carousel rather than a clipped section showing one panel. */}
      <section ref={wrap} style={{ position: "relative" }}>
        <div className="v2-depth" aria-hidden="true" />
        <div
          ref={track}
          className="v2-track v2-track--native"
        >
          <div className="v2-panel v2-panel--copy">
            <p className="vkicker">DFW / WEST TO EAST</p>
            <h1 className="vhead">
              Every camera.
              <br />
              Now a sensor.
            </h1>
            <p style={{ maxWidth: "42ch", marginTop: 22, color: "var(--color-phosphor-dim)" }}>
              Travel the network the way the network runs.
            </p>
          </div>
          {FEEDS.map((feed, i) => (
            <div className="v2-panel" key={feed.id}>
              <FeedPanel id={feed.id} road={feed.road} signal={(i % 4) + 1} />
            </div>
          ))}
        </div>
      </section>

      <section style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "0 6vw" }}>
        <div style={{ width: "min(1100px, 92vw)" }}>
          <p className="vkicker">THE READ</p>
          <h2 className="vhead" style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}>
            The frame becomes a decision.
          </h2>
        </div>
      </section>
    </main>
  )
}
