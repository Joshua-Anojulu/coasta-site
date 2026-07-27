import { getAssetSlot, slotLocation } from "@/lib/assets/manifest"
import { AmbientSection } from "../AmbientSection"
import { AssetSlotFrame } from "../AssetSlotFrame"
import { PrimaryAction } from "../PrimaryAction"

export function ApproachChapter() {
  const heroSlot = getAssetSlot("ch1-hero-01")
  const heroLocation = slotLocation(heroSlot)

  return (
    <section className="chapter chapter-dark approach" id="approach">
      <AmbientSection className="approach__ambient">
        <AssetSlotFrame
          className="approach__frame"
          sizes="100vw"
          slot={heroSlot}
        />
        <div aria-hidden="true" className="monitor-scanlines" />
        {/* States where the frame was taken, not a camera id and not a running
            clock. Both of those asserted a live capture that never happened. */}
        <div className="approach__meta">
          <span>{heroLocation ?? "DFW metroplex"}</span>
          <span className="timecode">Licensed photograph</span>
        </div>
        <div className="approach__copy">
          <h1>
            <span>Every camera.</span>
            <span>Now a sensor.</span>
          </h1>
          <p>
            Coasta reads the roadway through cameras already looking at DFW.
          </p>
          <PrimaryAction href="#waitlist">Join the waitlist</PrimaryAction>
        </div>
        <a aria-label="Scroll to enter the network" className="scroll-cue" href="#wall">
          <span>Scroll to enter the network</span>
          <span aria-hidden="true">↓</span>
        </a>
      </AmbientSection>
    </section>
  )
}
