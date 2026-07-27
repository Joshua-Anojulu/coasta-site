"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { DriveRoad, type DriveEvent } from "@/components/motion/DriveRoad"
import "@/styles/worlds.css"

const RUN = 1400

const EVENTS: readonly DriveEvent[] = [
  { at: 300, lane: 1, kind: "police", label: "Police vehicle" },
  { at: 640, lane: -1, kind: "crash", label: "Crash" },
  { at: 940, lane: 1, kind: "stall", label: "Stalled vehicle" },
  { at: 1220, lane: 0, kind: "debris", label: "Debris" },
]

const CARDS = [
  {
    at: 300,
    eyebrow: "0.4 miles ahead",
    title: "Police vehicle, right shoulder",
    body: "A camera two overpasses up sees the light bar before you round the curve. You get the warning while you can still change lanes.",
    tint: "80, 160, 255",
  },
  {
    at: 640,
    eyebrow: "0.6 miles ahead",
    title: "Crash blocking the left lane",
    body: "Two frames, thirty seconds apart, show stopped vehicles where traffic was moving. That is a crash, not congestion, and it is worth a lane change now.",
    tint: "255, 59, 48",
  },
  {
    at: 940,
    eyebrow: "0.3 miles ahead",
    title: "Stalled vehicle on the shoulder",
    body: "Stationary, hazards on, half a lane in. Not an emergency, still a reason to move left before you are on top of it.",
    tint: "255, 176, 0",
  },
  {
    at: 1220,
    eyebrow: "Just ahead",
    title: "Debris in the centre lane",
    body: "The thing you cannot see until your headlights reach it. A camera already had.",
    tint: "180, 210, 235",
  },
]

function AlertCard({
  card,
  progress,
}: {
  readonly card: (typeof CARDS)[number]
  readonly progress: ReturnType<typeof useScroll>["scrollYProgress"]
}) {
  const start = (card.at - 300) / RUN
  const peak = (card.at - 150) / RUN
  const hold = (card.at - 40) / RUN
  const end = (card.at + 70) / RUN

  const opacity = useTransform(progress, [start, peak, hold, end], [0, 1, 1, 0])
  const y = useTransform(progress, [start, peak], [26, 0])

  return (
    <motion.div className="w7-card" style={{ opacity, y }}>
      <span className="w7-card__eyebrow" style={{ color: `rgb(${card.tint})` }}>
        {card.eyebrow}
      </span>
      <h3 className="w7-card__title">{card.title}</h3>
      <p className="w7-card__body">{card.body}</p>
    </motion.div>
  )
}

/** w7: the drive. World: the road ahead, at night, from the driver's seat.
 *  Scroll is the accelerator. Each hazard resolves out of the dark and is
 *  explained as you pass it, which is literally what the product does. */
export default function W7() {
  const run = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: run, offset: ["start start", "end end"] })

  return (
    <main className="w w7">
      <span className="w-tag">W7 / THE DRIVE</span>

      {/* The hero sits in normal flow and scrolls away on its own. It was
          previously inside the sticky view with a scroll-linked opacity, which
          measured non-monotonically (0.17 at 783px, 0.45 at 1665px) and left a
          ghost of the headline sitting over the road. Structure beats a value
          that has a failure mode. */}
      <section className="w7-intro">
        <p className="w7-eyebrow">Dallas / Fort Worth</p>
        <h1 className="w7-head">
          Every camera.
          <br />
          Now a sensor.
        </h1>
        <p className="w7-sub">Scroll to drive. Coasta reads the road ahead of you.</p>
        <span className="w7-cue" aria-hidden="true">
          ↓
        </span>
      </section>

      <section className="w7-run" ref={run}>
        <div className="w7-view">
          <DriveRoad className="w7-canvas" events={EVENTS} targetRef={run} />

          {CARDS.map((card) => (
            <AlertCard card={card} key={card.at} progress={scrollYProgress} />
          ))}

          <p className="w7-note">Illustration of the alert sequence</p>
        </div>
      </section>

      <section className="w7-arrive">
        <div className="w7-arrive__inner">
          <p className="w7-eyebrow">You arrived</p>
          <h2 className="w7-h2">Four things you never had to react to.</h2>
          <p className="w7-body">
            None of them were on your windscreen when you needed to know. All of
            them were on a camera that was already looking.
          </p>
          <a className="w7-cta" href="#waitlist" id="waitlist">
            Join the waitlist
          </a>
        </div>
      </section>
    </main>
  )
}
