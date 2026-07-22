const CATEGORIES = [
  { name: "Police vehicles", detail: "Marked units, light bars, department patterns", tone: "text-signal" },
  { name: "Crashes", detail: "Multi-vehicle patterns, lane blockage, debris fields", tone: "text-alert" },
  { name: "Stalled vehicles", detail: "Shoulder stops, hazard geometry, lane position", tone: "text-signal" },
  { name: "Road debris", detail: "Objects where objects should not be", tone: "text-signal" },
  { name: "Wrong-way drivers", detail: "Direction versus expected flow", tone: "text-alert" },
];

const TICKER = [
  "POLICE / US-75 N", "CRASH / I-30 E", "STALL / I-635 W",
  "DEBRIS / DNT S", "POLICE / I-35E N", "WRONG-WAY / I-20 W",
];

export default function Catches() {
  return (
    <section className="py-32 md:py-44">
      <div className="overflow-hidden border-y border-white/5 py-3 text-xs text-fog-dim">
        <div className="marquee-track gap-10" aria-hidden="true">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap">
              {t}
              <span className="border border-white/15 px-1.5 py-0.5 text-[9px]">SIM</span>
            </span>
          ))}
        </div>
      </div>
      <div className="px-5 pt-20 md:px-10">
        <h2 className="font-display text-3xl uppercase md:text-5xl">What it catches</h2>
        <ol className="mt-12 max-w-3xl">
          {CATEGORIES.map((c, i) => (
            <li
              key={c.name}
              className="grid grid-cols-[3rem_1fr] items-baseline gap-4 border-b border-white/5 py-6 md:grid-cols-[3rem_1fr_1.2fr]"
              style={{ marginLeft: `${Math.min(i * 4, 16)}%` }}
            >
              <span className="text-xs text-fog-dim">0{i + 1}</span>
              <span className={`font-display text-xl uppercase md:text-2xl ${c.tone}`}>{c.name}</span>
              <span className="col-start-2 text-sm text-fog-dim md:col-start-3">{c.detail}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
