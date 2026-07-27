"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

type AmbientSectionProps = {
  readonly children: ReactNode
  readonly className?: string
}

export function AmbientSection({ children, className = "" }: AmbientSectionProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (root === null) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry?.isIntersecting ?? false),
      { rootMargin: "20% 0px" },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={`ambient-region ${className}`}
      data-ambient-active={active}
      data-motion-state="assembled"
      ref={rootRef}
    >
      {children}
    </div>
  )
}
