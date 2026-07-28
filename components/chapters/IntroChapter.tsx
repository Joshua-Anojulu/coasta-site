import { PrimaryAction } from "@/components/PrimaryAction"

/**
 * The hero sits in normal flow and scrolls away on its own rather than living
 * inside the pinned drive with a scroll-linked opacity. That earlier approach
 * measured non-monotonically and left a ghost of the headline over the road.
 *
 * Hero budget (Ch2.12): eyebrow, headline, subtext, CTA, one support line.
 * The scroll cue sits at the viewport bottom and does not count.
 *
 * The five parts land in order rather than arriving together, which is the same
 * mechanic the rest of the page uses. See components/Assembly.tsx.
 */
export function IntroChapter() {
  return (
    <section className="chapter-intro" id="approach">
      <div className="intro-inner">
        <p className="intro-eyebrow" data-assemble style={{ "--i": 0 } as React.CSSProperties}>
          Dallas / Fort Worth
        </p>
        <h1 className="intro-head" data-assemble style={{ "--i": 1 } as React.CSSProperties}>
          Every camera.
          <br />
          Now a sensor.
        </h1>
        <p className="intro-sub" data-assemble style={{ "--i": 2 } as React.CSSProperties}>
          Coasta reads the roadway through cameras already looking at DFW.
        </p>
        <div data-assemble style={{ "--i": 3 } as React.CSSProperties}>
          <PrimaryAction href="#waitlist">Join the waitlist</PrimaryAction>
        </div>
        <p className="intro-support" data-assemble style={{ "--i": 4 } as React.CSSProperties}>
          DFW first. We will email you when your area goes live.
        </p>
      </div>

      {/* Overriding the no-scroll-cue default: the hero is full bleed with no
          content edge visible below the fold, and the next thing to do is
          literally to drive. A real anchor link, not decoration (Ch2.3). */}
      <a className="intro-cue" href="#the-drive">
        <span>Scroll to drive</span>
        <span aria-hidden="true">↓</span>
      </a>
    </section>
  )
}
