import { getAssetSlot } from "@/lib/assets/manifest"
import { AssetSlotFrame } from "../AssetSlotFrame"

export function AlertChapter() {
  const alertSlot = getAssetSlot("ch4-alert-01")

  return (
    <section className="chapter chapter-light alert" id="alert">
      <div className="chapter-shell alert__grid">
        <div className="chapter-heading">
          <span className="chapter-kicker">ALERT / CONFIRM</span>
          <h2>The alert starts with the road.</h2>
          <p>
            Coasta begins with a camera frame and the road context around it.
            No fake phone, dashboard, or terminal stands between the driver
            and the explanation.
          </p>
          <dl className="alert-sequence">
            <div>
              <dt>01</dt>
              <dd>Read the frame</dd>
            </div>
            <div>
              <dt>02</dt>
              <dd>Attach road context</dd>
            </div>
            <div>
              <dt>03</dt>
              <dd>Prepare the alert</dd>
            </div>
          </dl>
        </div>
        <AssetSlotFrame
          className="alert__frame"
          sizes="(max-width: 767px) 92vw, 48vw"
          slot={alertSlot}
        />
      </div>
    </section>
  )
}
