import { Faq } from "../Faq"
import { WaitlistForm } from "../WaitlistForm"

export function GroundChapter() {
  return (
    <section className="chapter chapter-light ground">
      <div className="chapter-shell ground__grid">
        <div>
          <div className="chapter-heading">
            <span className="chapter-kicker">GROUND / QUESTIONS</span>
            <h2>What drivers need to know.</h2>
          </div>
          <Faq />
        </div>
        <aside className="waitlist-panel">
          <span className="chapter-kicker">DFW / EARLY ACCESS</span>
          <h3>See the road sooner.</h3>
          <p>
            Join the DFW waitlist. Coasta will email you when your area goes
            live.
          </p>
          <WaitlistForm />
        </aside>
      </div>
    </section>
  )
}
