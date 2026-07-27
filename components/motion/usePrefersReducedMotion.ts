"use client"

import { useEffect, useState } from "react"

/**
 * `null` = not resolved yet. Consumers MUST bail on null.
 *
 * A media query cannot be read during a server render, so the first client
 * render always guesses. Defaulting to false shows a reduced-motion user one
 * frame of movement; defaulting to true runs the reduced branch on pass one and
 * then re-runs with the real value, and the reduced branch has already written
 * inline styles it does not clean up. Every effect that consumes this opens with
 * `if (reduce === null) return`, so exactly one branch ever runs.
 */
export function usePrefersReducedMotion(): boolean | null {
  const [reduce, setReduce] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(mq.matches)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return reduce
}
