import Reveal from "./Reveal";

const ITEMS = [
  {
    q: "When does Coasta launch?",
    a: "Coasta launches in DFW first. Join the waitlist and we will email you the moment your area goes live.",
  },
  {
    q: "How much does it cost?",
    a: "Early access is free for waitlist members. Pricing for later plans will be announced before launch.",
  },
  {
    q: "Where do the alerts come from?",
    a: "From public traffic cameras read by our detection models. Every alert is camera-verified before it reaches you.",
  },
  {
    q: "Is my privacy protected?",
    a: "Yes. Coasta reads roadways, not people. We do not store faces, plates, or personal location history.",
  },
  {
    q: "Which cities are next?",
    a: "The DFW metroplex is first. Expansion cities will be chosen with input from the waitlist.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 px-5 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-medium text-signal">Questions</p>
        </Reveal>
        <Reveal index={1}>
          <h2 className="font-display mt-6 text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold tracking-[-0.01em]">
            Frequently asked
          </h2>
        </Reveal>
        <div className="mt-12 max-w-3xl">
          {ITEMS.map((item, i) => (
            <Reveal as="div" index={i + 2} key={item.q}>
              <details className="group border-b border-border py-6">
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold tracking-[-0.01em] text-ink outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
                >
                  {item.q}
                  <span className="shrink-0 text-lg text-signal transition-transform duration-300 [transition-timing-function:var(--ease-signal)] group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
