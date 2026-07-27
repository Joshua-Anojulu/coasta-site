import { getAssetSlots } from "@/lib/assets/manifest"
import { AmbientSection } from "../AmbientSection"
import { CameraWall } from "../CameraWall"

export function WallChapter() {
  const slots = getAssetSlots("CH2")

  return (
    <section className="chapter chapter-dark wall" id="wall">
      <AmbientSection className="chapter-shell">
        <div className="chapter-heading chapter-heading--dark">
          <span className="chapter-kicker">NETWORK / WALL</span>
          <h2>Roadside cameras across DFW.</h2>
          <p>
            Each feed holds one point of view. Coasta reads them as one field
            of attention.
          </p>
        </div>
        <CameraWall slots={slots} />
      </AmbientSection>
    </section>
  )
}
