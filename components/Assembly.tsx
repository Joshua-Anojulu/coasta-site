"use client"

import { useEffect } from "react"

/**
 * The assembly mechanic, applied to the content layer.
 *
 * The drive already builds as you descend: hazards resolve out of the dark and
 * their cards arrive before you reach them. Everything after the drive was
 * simply there, fully formed, which made the second half of the page feel like
 * a different site from the first.
 *
 * This lands each block's parts in sequence as it comes into view, using the
 * same hairline-rule vocabulary as the scan wipe between chapters, so the
 * content layer reads as continuous with the road rather than bolted to it.
 *
 * Two things it deliberately does not do:
 *
 * It never hides anything unless it is certain it can show it again. The hidden
 * state is scoped to `html[data-assembly="on"]`, which is set by an inline
 * script in the layout. With JavaScript off, the attribute is never set, the
 * rule never matches, and the page renders complete.
 *
 * It does not run at all under prefers-reduced-motion. The same inline script
 * checks first, so there is no assembled-from-nothing state to reason about:
 * the page simply arrives whole (Ch7.1).
 */
export function Assembly() {
  useEffect(() => {
    if (document.documentElement.dataset["assembly"] !== "on") return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target
          if (el instanceof HTMLElement) el.dataset["assembled"] = "true"
          io.unobserve(el)
        }
      },
      // A little inside the fold, so a block has landed by the time it is the
      // thing you are looking at rather than while it is still at the edge.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    )

    for (const el of document.querySelectorAll("[data-assemble]")) io.observe(el)
    return () => io.disconnect()
  }, [])

  return null
}
