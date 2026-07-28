"use client"

import { useRef } from "react"
import { motion, useMotionValue, useTransform } from "motion/react"
import { DriveRoad, type DriveEvent } from "@/components/motion/DriveRoad"

const EVENTS: readonly DriveEvent[] = [
  { at: 300, lane: 1, kind: "police", label: "Police vehicle" },
  { at: 640, lane: -1, kind: "crash", label: "Crash" },
  { at: 940, lane: 1, kind: "stall", label: "Stalled vehicle" },
  { at: 1220, lane: 0, kind: "debris", label: "Debris" },
]

/**
 * The four events are the old wall, read and alert chapters, told as things
 * that happen to you rather than as sections about a product. Each card says
 * what a camera saw and why it mattered, which is the whole pitch.
 */
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
    body: "Two frames, thirty seconds apart, show stopped vehicles where traffic was moving. That is a crash, not congestion, and it is worth moving over now.",
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
] as const

function AlertCard({
  card,
  distance,
}: {
  readonly card: (typeof CARDS)[number]
  /** Metres travelled. Pacing makes this non-linear in scroll progress, so the
   *  card has to read the same distance the road is drawing or it drifts away
   *  from the hazard it is describing. */
  readonly distance: ReturnType<typeof useMotionValue<number>>
}) {
  // A 240m window that closes exactly as you reach the hazard: warned, then you
  // pass it. The previous 370m window overlapped its neighbour (hazards are only
  // 280m to 340m apart), so two cards were on screen at once and stacked on top
  // of each other. These windows leave a clear 60m to 100m gap between cards.
  const opacity = useTransform(
    distance,
    [card.at - 240, card.at - 170, card.at - 40, card.at],
    [0, 1, 1, 0],
  )
  const y = useTransform(distance, [card.at - 240, card.at - 170], [26, 0])

  return (
    <motion.div className="drive-card" style={{ opacity, y }}>
      <span className="drive-card__eyebrow" style={{ color: `rgb(${card.tint})` }}>
        {card.eyebrow}
      </span>
      <h3 className="drive-card__title">{card.title}</h3>
      <p className="drive-card__body">{card.body}</p>
    </motion.div>
  )
}

export function DriveChapter() {
  const run = useRef<HTMLElement>(null)
  const distance = useMotionValue(0)

  return (
    <section className="chapter-drive" id="the-drive" ref={run}>
      {/* This block comes FIRST so the heading order is h1 then h2 then the
          cards' h3. Rendering it after the cards jumped h1 straight to h3 and
          failed axe's heading-order rule.
          It also carries the whole sequence in text: the road canvas is
          aria-hidden by design, so the page has to work without it (Ch7.3). */}
      <div className="visually-hidden">
        <h2>What Coasta warns you about</h2>
        <ul>
          {CARDS.map((card) => (
            <li key={card.at}>
              {card.title}, {card.eyebrow}. {card.body}
            </li>
          ))}
        </ul>
      </div>

      <div className="drive-view">
        <DriveRoad
          className="drive-canvas"
          distanceOut={distance}
          events={EVENTS}
          targetRef={run}
        />

        {/* The readable layer is a plain high-contrast plate, never text sitting
            raw on the moving scene (Ch2.4). */}
        {CARDS.map((card) => (
          <AlertCard card={card} distance={distance} key={card.at} />
        ))}

        <p className="drive-note" data-illustration-note>
          Illustration of the alert sequence
        </p>
      </div>
    </section>
  )
}
