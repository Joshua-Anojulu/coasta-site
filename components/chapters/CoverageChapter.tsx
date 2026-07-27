import { buildCoverageRenderModel } from "@/lib/geometry/render-model"
import { DFW_GEOMETRY } from "@/lib/geometry/snapshot"
import { getAssetSlots } from "@/lib/assets/manifest"
import { AssetSlotFrame } from "../AssetSlotFrame"
import { CoverageMap } from "../CoverageMap"

export function CoverageChapter() {
  const model = buildCoverageRenderModel({
    height: 520,
    padding: 24,
    snapshot: DFW_GEOMETRY,
    width: 1_000,
  })
  const frames = getAssetSlots("CH5")

  return (
    <section className="chapter chapter-dark coverage" id="coverage">
      <div className="chapter-shell">
        <div className="chapter-heading chapter-heading--dark coverage__heading">
          <span className="chapter-kicker">DFW / COVERAGE</span>
          <h2>A camera is never just a dot.</h2>
          <p>
            Focus or hover a camera to read its road reference. Press Escape
            to clear the reading.
          </p>
        </div>
        <div className="coverage__resolve">
          {frames.map((slot) => (
            <AssetSlotFrame
              key={slot.id}
              sizes="(max-width: 767px) 92vw, 24vw"
              slot={slot}
            />
          ))}
        </div>
        <CoverageMap model={model} />
      </div>
    </section>
  )
}
