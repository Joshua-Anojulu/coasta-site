"use client"

import { useReducer } from "react"
import {
  INITIAL_COVERAGE_FOCUS,
  reduceCoverageFocus,
} from "@/lib/geometry/focus-model"
import type { CoverageRenderModel } from "@/lib/geometry/render-model"

type CoverageMapProps = {
  readonly model: CoverageRenderModel
}

export function CoverageMap({ model }: CoverageMapProps) {
  const [focus, dispatch] = useReducer(
    reduceCoverageFocus,
    INITIAL_COVERAGE_FOCUS,
  )
  const activeCamera = model.cameras.find((camera) => camera.id === focus.activeId)

  return (
    <div
      className="coverage-map"
      data-motion-state="assembled"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          dispatch({ type: "escape" })
        }
      }}
    >
      <div className="coverage-map__viewport">
        <svg
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${model.width} ${model.height}`}
        >
          {model.roads.map((road) => (
            <polyline
              className="coverage-road"
              data-road-class={road.roadClass}
              key={road.id}
              points={road.points}
            />
          ))}
        </svg>
        <div className="coverage-camera-layer">
          {model.cameras.map((camera) => (
            <button
              aria-describedby="coverage-status"
              /* Names the real road, never the synthetic CAM-### id. Announcing
                 an invented identifier would assert a camera inventory that
                 does not exist. */
              aria-label={`Coverage point on ${camera.roadRef}`}
              className="coverage-camera"
              data-active={focus.activeId === camera.id}
              data-camera-id={camera.id}
              data-road-ref={camera.roadRef}
              key={camera.id}
              onBlur={() => dispatch({ cameraId: camera.id, type: "blur" })}
              onFocus={() => dispatch({ cameraId: camera.id, type: "focus" })}
              onMouseEnter={() => dispatch({ cameraId: camera.id, type: "hover" })}
              onMouseLeave={() => dispatch({ cameraId: camera.id, type: "leave" })}
              style={{
                left: `${(camera.x / model.width) * 100}%`,
                top: `${(camera.y / model.height) * 100}%`,
              }}
              type="button"
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <div aria-live="polite" className="coverage-status" id="coverage-status">
        {activeCamera === undefined ? (
          <>
            <span>FOCUS A POINT</span>
            <strong>Road reference appears here</strong>
          </>
        ) : (
          <>
            <span>COVERAGE POINT</span>
            <strong>{activeCamera.roadRef}</strong>
          </>
        )}
      </div>
      <p className="coverage-credit">
        Map data: {model.attribution} / pinned {model.capturedAt.slice(0, 10)}
      </p>
    </div>
  )
}
