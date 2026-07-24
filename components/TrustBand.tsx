import Reveal from "./Reveal";

const STATEMENTS = [
  {
    heading: "Camera-verified",
    detail: "Alerts come from what cameras actually see, not crowd rumors.",
  },
  {
    heading: "Privacy-first by design",
    detail: "No faces, no license plates, no personal tracking.",
  },
  {
    heading: "Built for DFW first",
    detail: "Tuned to the metroplex freeway network before anywhere else.",
  },
];

export default function TrustBand() {
  return (
    <section className="bg-panel px-5 py-20 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
        {STATEMENTS.map((s, i) => (
          <Reveal as="div" index={i} key={s.heading}>
            <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">
              {s.heading}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.detail}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
