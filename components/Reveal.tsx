"use client";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

// The single scroll-reveal client leaf Clearsky introduces: fade + 14px
// rise, plays once, 0.5-0.7s, --ease-signal easing (docs/DESIGN.md 9.1).
// Under prefers-reduced-motion it renders children in their final visible
// state with no animation - content is never gated behind motion.
const EASE_SIGNAL = [0.16, 1, 0.3, 1] as const;
const STAGGER_STEP = 0.08;
const TAGS = { div: motion.div, li: motion.li } as const;

export default function Reveal({
  children,
  className,
  style,
  index = 0,
  duration = 0.6,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Position within a list/tile group - drives a modest stagger delay. */
  index?: number;
  duration?: number;
  as?: keyof typeof TAGS;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Static = as;
    return (
      <Static className={className} style={style}>
        {children}
      </Static>
    );
  }

  const MotionTag = TAGS[as];
  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: Math.min(0.7, Math.max(0.5, duration)),
        delay: index * STAGGER_STEP,
        ease: EASE_SIGNAL,
      }}
    >
      {children}
    </MotionTag>
  );
}
