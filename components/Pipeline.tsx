"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

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
      <div className="sticky top-0 flex h-[100dvh] flex-col justify-center px-5 md:px-10">
        <p className="text-xs uppercase tracking-[0.25em] text-signal">How it sees</p>
        <div className="relative mt-6 max-w-4xl overflow-hidden rounded-xl border border-white/10">
          <img src="/cam-frame.jpg" alt="Simulated highway camera frame" className="w-full opacity-70 [filter:saturate(0.4)_hue-rotate(190deg)]" />
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_3px,rgba(0,0,0,0.25)_3px_4px)]" />
          <div className="absolute left-3 top-3 flex gap-2 text-[10px] text-fog-dim">
            <span>CAM-114 / US-75 at I-635</span>
            <span className="border border-white/20 px-1">SIM</span>
          </div>

          <motion.div
            style={reduced ? { opacity: 1 } : { opacity: boxOpacity }}
            className="absolute left-[18%] top-[42%] h-[26%] w-[22%] border-2 border-signal
              [clip-path:polygon(0_0,30%_0,30%_12%,70%_12%,70%_0,100%_0,100%_30%,88%_30%,88%_70%,100%_70%,100%_100%,70%_100%,70%_88%,30%_88%,30%_100%,0_100%,0_70%,12%_70%,12%_30%,0_30%)]"
          />
          <motion.div
            style={reduced ? { opacity: 1 } : { opacity: labelOpacity }}
            className="absolute left-[18%] top-[32%] bg-asphalt/85 px-2 py-1 text-[11px] text-signal"
          >
            POLICE VEHICLE <motion.span className="tabular-nums">{reduced ? "96%" : confText}</motion.span>
          </motion.div>

          <motion.div
            style={reduced ? { opacity: 1, x: 0 } : { x: cardX, opacity: cardOpacity }}
            className="absolute bottom-4 right-4 border border-alert/50 bg-asphalt/90 p-3 text-xs"
          >
            <span className="text-alert">ALERT CONFIRMED</span>
            <span className="ml-2 text-fog-dim">pushed to nearby drivers</span>
          </motion.div>
        </div>
        <p className="mt-6 max-w-md text-sm text-fog-dim">
          Frame in. Objects found. Vehicle classified. Confidence scored. Only
          high-confidence events ever become alerts.
        </p>
      </div>
    </section>
  );
}
