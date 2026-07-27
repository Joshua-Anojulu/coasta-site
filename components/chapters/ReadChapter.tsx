import { getAssetSlot } from "@/lib/assets/manifest"
import { AssetSlotFrame } from "../AssetSlotFrame"
import { DetectionConcept } from "../DetectionConcept"

export function ReadChapter() {
  const frameSlot = getAssetSlot("ch3-read-01")

  return (
    <section className="chapter chapter-light read" id="read">
      <div className="chapter-shell read__grid">
        <div className="chapter-heading">
          <span className="chapter-kicker">PROCESS / READ</span>
          <h2>The frame becomes a decision.</h2>
          <p>
            The roadway frame enters a visible sequence: frame, signal, read,
            then human-readable check. The diagram shows the idea, not a
            captured product screen.
          </p>
        </div>
        <div className="read__visuals">
          <AssetSlotFrame
            sizes="(max-width: 767px) 92vw, 44vw"
            slot={frameSlot}
          />
          <DetectionConcept />
        </div>
      </div>
    </section>
  )
}
