import Reveal from "./Reveal";

// Categorical red is retired (PLAN.md step 4): every category tones blue,
// red is reserved for active confirmed states only.
const CATEGORIES = [
  { name: "Police vehicles", detail: "Marked units, light bars, department patterns" },
  { name: "Crashes", detail: "Multi-vehicle patterns, lane blockage, debris fields" },
  { name: "Stalled vehicles", detail: "Shoulder stops, hazard geometry, lane position" },
  { name: "Road debris", detail: "Objects where objects should not be" },
  { name: "Wrong-way drivers", detail: "Direction versus expected flow" },
];

// Ticker entries are mono data chips and stay uppercase (docs/DESIGN.md
// section 5's enumerated exception list).
const TICKER = [
  "POLICE / US-75 N", "CRASH / I-30 E", "STALL / I-635 W",
  "DEBRIS / DNT S", "POLICE / I-35E N", "WRONG-WAY / I-20 W",
];

export default function Catches() {
  return (
    <section className="py-32 md:py-44">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden border-y border-border px-5 py-3 font-mono text-xs text-ink-2 md:px-10">
          <div className="marquee-track gap-10" aria-hidden="true">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap">
                {t}
                <span className="border border-border px-1.5 py-0.5 text-[9px]">SIM</span>
              </span>
            ))}
          </div>
        </div>
        <div className="px-5 pt-20 md:px-10">
          <Reveal>
            <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold tracking-[-0.01em]">
              What it catches
            </h2>
          </Reveal>
          <ol className="mt-12 max-w-3xl">
            {CATEGORIES.map((c, i) => (
              <Reveal
                as="li"
                index={i}
                key={c.name}
                className="grid grid-cols-[3rem_1fr] items-baseline gap-4 border-b border-border py-6 md:grid-cols-[3rem_1fr_1.2fr]"
                style={{ marginLeft: `${Math.min(i * 4, 16)}%` }}
              >
                <span className="font-mono text-xs text-ink-2">0{i + 1}</span>
                <span className="font-display text-xl text-signal md:text-2xl">{c.name}</span>
                <span className="col-start-2 text-sm text-ink-2 md:col-start-3">{c.detail}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
