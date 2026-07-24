import Reveal from "./Reveal";

// Asymmetric layout (docs/DESIGN.md composition discipline): a staggered,
// uneven-column list, never three equal cards. Layout strings are literal
// so Tailwind's content scan finds every utility.
const STEPS = [
  {
    n: "01",
    title: "Cameras watch the road",
    detail: "Public traffic cameras across DFW stream around the clock.",
    layout: "md:col-start-1 md:col-span-6",
    offset: "0%",
  },
  {
    n: "02",
    title: "AI reads every frame",
    detail: "Detection models classify police, crashes, stalls, and debris with confidence scores.",
    layout: "md:col-start-8 md:col-span-5 md:mt-16",
    offset: "8%",
  },
  {
    n: "03",
    title: "You get the alert first",
    detail: "High-confidence events reach your phone before you reach the hazard.",
    layout: "md:col-start-3 md:col-span-7 md:mt-32",
    offset: "16%",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-5 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-xs font-medium text-signal">How it works</h2>
        </Reveal>
        <div className="mt-16 flex flex-col gap-14 md:mt-20 md:grid md:grid-cols-12 md:gap-x-8 md:gap-y-0">
          {STEPS.map((s, i) => (
            <Reveal
              as="div"
              index={i}
              key={s.n}
              className={s.layout}
              style={{ marginLeft: s.offset }}
            >
              <span className="font-mono text-4xl text-signal md:text-5xl">{s.n}</span>
              <h3 className="font-display mt-4 text-xl font-semibold tracking-[-0.01em]">
                {s.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-2">{s.detail}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
