import { PrimaryAction } from "@/components/PrimaryAction"

/**
 * The hero sits in normal flow and scrolls away on its own rather than living
 * inside the pinned drive with a scroll-linked opacity. That earlier approach
 * measured non-monotonically and left a ghost of the headline over the road.
 *
 * Hero budget (Ch2.12): eyebrow, headline, subtext, CTA, one support line.
 * The scroll cue sits at the viewport bottom and does not count.
 */
export function IntroChapter() {
  return (
    <section className="chapter-intro" id="approach">
      <div className="intro-inner">
        <p className="intro-eyebrow">Dallas / Fort Worth</p>
        <h1 className="intro-head">
          Every camera.
          <br />
          Now a sensor.
        </h1>
        <p className="intro-sub">
          Coasta reads the roadway through cameras already looking at DFW.
        </p>
        <PrimaryAction href="#waitlist">Join the waitlist</PrimaryAction>
        <p className="intro-support">DFW first. We will email you when your area goes live.</p>
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
