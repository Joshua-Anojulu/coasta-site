"use client"

import { useEffect, useRef, useState } from "react"
import type { AssetSlot } from "@/lib/assets/manifest"
import { AssetSlotFrame } from "./AssetSlotFrame"

type CameraWallProps = {
  readonly slots: readonly AssetSlot[]
}

export function CameraWall({ slots }: CameraWallProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (root === null || slots.length === 0) {
      return
    }

    let timer: ReturnType<typeof setInterval> | null = null
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    }
    const start = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setActiveIndex(0)
        return
      }
      timer = setInterval(
        () => setActiveIndex((index) => (index + 1) % slots.length),
        3_200,
      )
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
  }, [slots.length])

  return (
    <div className="camera-wall" data-motion-state="assembled" ref={rootRef}>
      {slots.map((slot, index) => (
        <AssetSlotFrame
          active={index === activeIndex}
          className="camera-wall__tile"
          key={slot.id}
          sizes="(max-width: 767px) 92vw, 42vw"
          slot={slot}
        />
      ))}
    </div>
  )
}
