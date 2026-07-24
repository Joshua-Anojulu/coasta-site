"use client";
import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import Reveal from "./Reveal";

export default function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const boxOpacity = useTransform(scrollYProgress, [0.18, 0.3], [0, 1]);
  const labelOpacity = useTransform(scrollYProgress, [0.38, 0.5], [0, 1]);
  const conf = useTransform(scrollYProgress, [0.38, 0.62], [42, 96]);
  const confText = useTransform(conf, (v) => `${Math.round(v)}%`);
  const cardX = useTransform(scrollYProgress, [0.68, 0.82], ["120%", "0%"]);
  const cardOpacity = useTransform(scrollYProgress, [0.68, 0.8], [0, 1]);

  return (
    <section ref={ref} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-[100dvh] flex-col items-center justify-center px-5 md:px-10">
        <div className="mx-auto w-full max-w-4xl">
          <Reveal>
            <p className="text-xs font-medium text-signal">How it sees</p>
          </Reveal>
          <div className="relative mx-auto mt-6 overflow-hidden rounded-xl border border-border">
            <Image
              src="/cam-frame.jpg"
              alt="Simulated highway camera frame"
              width={1600}
              height={900}
              sizes="(min-width: 768px) 56rem, 100vw"
              className="h-auto w-full [filter:contrast(1.02)_brightness(0.98)]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_5px,rgba(11,27,51,0.04)_5px_5.5px)]" />
            <div className="absolute left-3 top-3 flex gap-2 font-mono text-[10px] text-ink-2">
              <span>CAM-114 / US-75 at I-635</span>
              <span className="border border-border px-1">SIM</span>
            </div>

            <motion.div
              style={reduced ? { opacity: 1 } : { opacity: boxOpacity }}
              className="absolute left-[61.5%] top-[67.5%] h-[7.5%] w-[5%] border-2 border-signal
                [clip-path:polygon(0_0,30%_0,30%_12%,70%_12%,70%_0,100%_0,100%_30%,88%_30%,88%_70%,100%_70%,100%_100%,70%_100%,70%_88%,30%_88%,30%_100%,0_100%,0_70%,12%_70%,12%_30%,0_30%)]"
            />
            <motion.div
              style={reduced ? { opacity: 1 } : { opacity: labelOpacity }}
              className="absolute left-[61.5%] top-[58.5%] bg-ground/90 px-2 py-1 font-mono text-[11px] text-signal"
            >
              Police vehicle <motion.span className="tabular-nums">{reduced ? "96%" : confText}</motion.span>
              <span className="ml-1.5 border border-border px-1 py-0.5 align-middle text-[9px] text-ink-2">SIM</span>
            </motion.div>

            <motion.div
              style={reduced ? { opacity: 1, x: 0 } : { x: cardX, opacity: cardOpacity }}
              className="absolute bottom-4 right-4 border border-confirmed/50 bg-ground/95 p-3 font-mono text-xs"
            >
              <span className="text-confirmed">Alert confirmed</span>
              <span className="ml-2 border border-border px-1.5 py-0.5 text-[10px] text-ink-2">SIM</span>
              <span className="ml-2 text-ink-2">pushed to nearby drivers</span>
            </motion.div>
          </div>
          <Reveal index={1}>
            <p className="mx-auto mt-6 max-w-md text-sm text-ink-2">
              Frame in. Objects found. Vehicle classified. Confidence scored. Only
              high-confidence events ever become alerts.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
