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
          <h2>Coverage is a map, not a number.</h2>
          <p>
            Focus or hover a point to read the road it sits on. Press Escape to
            clear the reading.
          </p>
          {/* The points are positions computed against OpenStreetMap road
              geometry, not installed camera locations, and the underlying ids
              are synthetic. Saying so is the same rule that removed the
              detection box from the hero: the page may not imply a capability
              or an inventory that does not exist. */}
          <p className="coverage__disclaimer">
            These points mark corridors in the launch area, drawn on real DFW
            road geometry. They are not a map of installed cameras.
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
