"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, type MotionValue } from "motion/react"
import { FeedPanel } from "@/components/motion/FeedPanel"
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion"
import "@/styles/variants.css"

/** Must pass WCAG AA against --color-ground. 0.4 on #e6eaee over #08090b clears it. */
const DIM = 0.4

function Word({
  word,
  progress,
  range,
}: {
  word: string
  progress: MotionValue<number>
  range: [number, number]
}) {
  const opacity = useTransform(progress, range, [DIM, 1])
  return (
    <motion.span style={{ opacity }} className="inline-block">
      {word}
    </motion.span>
  )
}

/** Stage-layer copy only, never a Ch2.5 answer. Emits real spaces so copy-paste
 *  and screen readers do not get runtogetherwords. */
function ScrubLine({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduce = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.35"] })
  const words = text.split(" ")

  if (reduce !== false) {
    return (
      <p ref={ref} className="v3-scrub">
        {text}
      </p>
    )
  }

  return (
    <p ref={ref} className="v3-scrub">
      {words.map((w, i) => (
        <span key={`${w}-${i}`}>
          <Word word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </p>
  )
}

const CHANNELS = [
  {
    kicker: "01 / APPROACH",
    head: "Every camera.\nNow a sensor.",
    line: "Coasta reads the roadway through cameras already looking at DFW.",
    feed: { id: "N-01", road: "I-35E" },
  },
  {
    kicker: "02 / THE WALL",
    head: "Roadside cameras across DFW.",
    line: "Each feed holds one point of view. Coasta reads them as one field of attention.",
    feed: { id: "N-03", road: "I-635" },
  },
  {
    kicker: "03 / THE READ",
    head: "The frame becomes a decision.",
    line: "Frame, signal, read, then human readable check.",
    feed: { id: "E-05", road: "I-30" },
  },
]

/**
 * v3: the rack.
 * Mechanic reason (Ch3): racking through channels is what an operator actually
 * does at a monitor wall, so each chapter holds at the top and the next one
 * arrives over it. CSS sticky owns the stacking, so nothing can desync.
 * Scroll cost: zero pinned. Stacking is free.
 */
export default function V3() {
  return (
    <main className="vroot">
      <span className="vlabel">V3 / THE RACK</span>

      {CHANNELS.map((channel) => (
        <section className="v3-card" key={channel.kicker}>
          <div className="v3-inner">
            <div>
              <p className="vkicker">{channel.kicker}</p>
              <h2 className="vhead" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)", marginTop: 14 }}>
                {channel.head.split("\n").map((l) => (
                  <span key={l} style={{ display: "block" }}>
                    {l}
                  </span>
                ))}
              </h2>
              <div style={{ marginTop: 26, maxWidth: "44ch" }}>
                <ScrubLine text={channel.line} />
              </div>
            </div>
            <FeedPanel id={channel.feed.id} road={channel.feed.road} signal={4} />
          </div>
        </section>
      ))}

      <section style={{ minHeight: "60dvh", display: "grid", placeItems: "center" }}>
        <p className="vkicker">END OF RACK</p>
      </section>
    </main>
  )
}
