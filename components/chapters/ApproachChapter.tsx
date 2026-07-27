import { getAssetSlot } from "@/lib/assets/manifest"
import { AmbientSection } from "../AmbientSection"
import { AssetSlotFrame } from "../AssetSlotFrame"
import { LiveTimecode } from "../LiveTimecode"
import { PrimaryAction } from "../PrimaryAction"

export function ApproachChapter() {
  const heroSlot = getAssetSlot("ch1-hero-01")

  return (
    <section className="chapter chapter-dark approach" id="approach">
      <AmbientSection className="approach__ambient">
        <AssetSlotFrame
          className="approach__frame"
          sizes="100vw"
          slot={heroSlot}
        />
        <div aria-hidden="true" className="monitor-scanlines" />
        <div className="approach__meta">
          <span>CAM / APPROACH</span>
          <LiveTimecode />
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
