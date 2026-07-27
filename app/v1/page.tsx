"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { FeedPanel } from "@/components/motion/FeedPanel"
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion"
import "@/styles/variants.css"

gsap.registerPlugin(ScrollTrigger)

const FEEDS = [
  { id: "N-01", road: "I-35E" },
  { id: "N-02", road: "US-75" },
  { id: "N-03", road: "I-635" },
  { id: "N-04", road: "DNT" },
  { id: "E-05", road: "I-30" },
  { id: "E-06", road: "PGBT" },
  { id: "S-07", road: "I-20" },
  { id: "S-08", road: "I-45" },
  { id: "W-09", road: "I-820" },
  { id: "W-10", road: "SH-183" },
  { id: "W-11", road: "I-35W" },
  { id: "C-12", road: "SH-114" },
]

/**
 * v1: the wall assembles.
 * Mechanic reason (Ch3): the network is not a place you travel to, it is
 * something that switches on around you, so the hero holds still and the wall
 * populates. Scroll cost: 12 tiles staged in 6 waves, ~3.3 viewports pinned.
 */
export default function V1() {
  const stage = useRef<HTMLDivElement>(null)
  const reduce = usePrefersReducedMotion()

  useEffect(() => {
    if (reduce === null || !stage.current) return
    const tiles = gsap.utils.toArray<HTMLElement>(".v1-wall .feed", stage.current)

    if (reduce) {
      gsap.set(tiles, { autoAlpha: 1, y: 0, scale: 1 })
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage.current,
          start: "top top",
          end: () => `+=${tiles.length * 28}%`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })

      tiles.forEach((tile, i) => {
        tl.fromTo(
          tile,
          { autoAlpha: 0, y: 40, scale: 0.9 },
          { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(1.5)", duration: 0.5 },
          i * 0.28,
        )
      })
    }, stage)

    return () => ctx.revert()
  }, [reduce])

  return (
    <main className="vroot">
      <span className="vlabel">V1 / THE WALL ASSEMBLES</span>

      <div className="v1-stage" ref={stage}>
        <div className="v1-wall" aria-hidden="true">
          {FEEDS.map((feed, i) => (
            <FeedPanel key={feed.id} id={feed.id} road={feed.road} signal={(i % 4) + 1} />
          ))}
        </div>
        <div className="v1-scrim" />
        <div className="v1-copy">
          <p className="vkicker">DFW / NETWORK</p>
          <h1 className="vhead">
            Every camera.
            <br />
            Now a sensor.
          </h1>
          <p style={{ maxWidth: "46ch", marginTop: 22, color: "var(--color-phosphor-dim)" }}>
            Coasta reads the roadway through cameras already looking at DFW.
          </p>
        </div>
      </div>

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
