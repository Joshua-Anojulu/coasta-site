"use client"

import { useEffect, useRef, useState } from "react"

const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  second: "2-digit",
  timeZone: "America/Chicago",
})

export function LiveTimecode() {
  const rootRef = useRef<HTMLTimeElement>(null)
  const [timecode, setTimecode] = useState("00:00:00 CT")

  useEffect(() => {
    const root = rootRef.current
    if (root === null) {
      return
    }

    let timer: ReturnType<typeof setInterval> | null = null
    const update = () => setTimecode(`${formatter.format(new Date())} CT`)
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    }
    const start = () => {
      update()
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        timer = setInterval(update, 1_000)
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        start()
      } else {
        stop()
      }
    })

    observer.observe(root)
    return () => {
      stop()
      observer.disconnect()
    }
  }, [])

  return (
    <time className="timecode" ref={rootRef}>
      DFW / {timecode}
    </time>
  )
}
