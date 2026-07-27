import { placeDetectionLabel } from "@/lib/detection/placement"

export function DetectionConcept() {
  const placement = placeDetectionLabel({
    detection: { height: 98, width: 176, x: 318, y: 174 },
    frame: { height: 360, width: 640 },
    gap: 8,
    label: { height: 24, width: 180 },
  })

  return (
    <figure className="detection-concept">
      <div aria-label="Diagrammatic detection concept" className="concept-frame">
        <div aria-hidden="true" className="concept-road">
          <span />
          <span />
          <span />
        </div>
        <div
          aria-hidden="true"
          className="detection-label"
          style={{
            left: `${(placement.x / 640) * 100}%`,
            top: `${(placement.y / 360) * 100}%`,
          }}
        >
          OBJECT / REVIEW
        </div>
        <div
          aria-hidden="true"
          className="detection-box"
          style={{
            height: `${(98 / 360) * 100}%`,
            left: `${(318 / 640) * 100}%`,
            top: `${(174 / 360) * 100}%`,
            width: `${(176 / 640) * 100}%`,
          }}
        />
        <div className="concept-flow">
          <span>FRAME</span>
          <span>SIGNAL</span>
          <span>READ</span>
          <span>CHECK</span>
        </div>
      </div>
      <figcaption>Concept visualization, not model output</figcaption>
    </figure>
  )
}
